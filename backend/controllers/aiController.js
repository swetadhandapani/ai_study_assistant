const Note = require("../models/Note");
const AudioNote = require("../models/AudioNote");
const StudyMaterial = require("../models/StudyMaterial");
const { Groq } = require("groq-sdk");

// ---- Groq client ----
let groqClient = null;
if (process.env.GROQ_API_KEY) {
  groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const callAI = async (prompt, maxTokens = 600, temperature = 0.2) => {
  try {
    if (!groqClient) {
      console.warn("No GROQ_API_KEY found — returning dummy AI data.");
      return "DUMMY_AI_RESPONSE";
    }
    const response = await groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature,
    });
    return response.choices?.[0]?.message?.content || "DUMMY_AI_RESPONSE";
  } catch (err) {
    console.error("Groq API call failed:", err.message);
    return "DUMMY_AI_RESPONSE";
  }
};

// ---- helper: get text from either Note or AudioNote ----
const getTextFromSource = async (id, userId) => {
  let note = await Note.findOne({ _id: id, user: userId });
  if (note) return { text: note.originalText || "", type: "note", doc: note };

  let audio = await AudioNote.findOne({ _id: id, user: userId });
  if (audio)
    return { text: audio.transcription || "", type: "audio", doc: audio };

  return null;
};

// ---- Get study material by note ----
const getStudyMaterial = async (req, res) => {
  try {
    const { noteId } = req.params;
    const studyMaterial = await StudyMaterial.findOne({
      user: req.user._id,
      note: noteId,
    });
    if (!studyMaterial)
      return res.status(404).json({ message: "Study material not found" });
    res.json(studyMaterial);
  } catch (err) {
    console.error("getStudyMaterial error:", err);
    res
      .status(500)
      .json({ message: "Error fetching study material", error: err.message });
  }
};
// ---- Generate Summaries / Flashcards / Quizzes ----
const generateMaterials = async (req, res) => {
  try {
    const { noteId, actions } = req.body;
    if (!noteId || !Array.isArray(actions)) {
      return res
        .status(400)
        .json({ message: "noteId and actions array are required" });
    }

    const source = await getTextFromSource(noteId, req.user._id);
    if (!source)
      return res.status(404).json({ message: "Note/Audio not found" });

    const text = source.text;
    const result = { summaries: [], flashcards: [], quizzes: [] };

    // ---- SUMMARY ----
    if (actions.includes("summary")) {
      const summary = await callAI(
        `Summarize the following text in concise bullet points (no intro/outro, one point per line):
${text}`,
        350
      );

      result.summaries =
        summary === "DUMMY_AI_RESPONSE"
          ? ["Dummy summary item 1", "Dummy summary item 2"]
          : summary
              .split(/\n+/)
              .map((s) => s.replace(/^[-*•]\s?/, "").trim())
              .filter(Boolean);
    }

    // ---- FLASHCARDS ----
    if (actions.includes("flashcards")) {
      const fcRaw = await callAI(
        `Create 6-10 high-quality flashcards from the text.
Each line MUST follow exactly:
Q: <question> | A: <answer>
Text:
${text}`,
        600
      );

      if (fcRaw === "DUMMY_AI_RESPONSE") {
        result.flashcards = [
          { question: "Dummy Question 1?", answer: "Dummy Answer 1" },
          { question: "Dummy Question 2?", answer: "Dummy Answer 2" },
        ];
      } else {
        const flashcards = [];
        fcRaw.split(/\n+/).forEach((line) => {
          let m = line.match(/Q:\s*(.*?)\s*\|\s*A:\s*(.+)/i);
          if (!m) m = line.match(/Q:\s*(.*?)\s*A:\s*(.+)/i);
          if (m)
            flashcards.push({ question: m[1].trim(), answer: m[2].trim() });
        });
        result.flashcards = flashcards.length
          ? flashcards
          : [
              {
                question: "Could not parse AI flashcards.",
                answer: "Please try regenerating.",
              },
            ];
      }
    }

    // ---- QUIZZES ----
    if (actions.includes("quiz")) {
      const quizRaw = await callAI(
        `Generate 5 multiple-choice questions from the text.
For each question use this block format:
Q: <question>
A: option1|option2|option3|option4
ANSWER_INDEX: <0-3>

Text:
${text}`,
        800
      );

      if (quizRaw === "DUMMY_AI_RESPONSE") {
        result.quizzes = [
          {
            question: "Dummy quiz question?",
            options: ["A", "B", "C", "D"],
            answerIndex: 0,
          },
        ];
      } else {
        const quizzes = [];
        const blocks = quizRaw.split(/\n{2,}/);
        blocks.forEach((block) => {
          const qMatch = block.match(/Q:\s*(.+)/i);
          const aMatch = block.match(/A:\s*(.+)/i);
          const ansMatch = block.match(/ANSWER_INDEX:\s*(\d+)/i);
          if (qMatch && aMatch && ansMatch) {
            const options = aMatch[1]
              .split("|")
              .map((x) => x.trim())
              .filter(Boolean);
            const answerIndex = Number(ansMatch[1]);
            if (options.length >= 2 && Number.isInteger(answerIndex)) {
              quizzes.push({
                question: qMatch[1].trim(),
                options,
                answerIndex,
              });
            }
          }
        });
        result.quizzes = quizzes;
      }
    }

    // ---- Save/Update StudyMaterial ----
    const query = { user: req.user._id };
    if (source.type === "note") query.note = source.doc._id;
    if (source.type === "audio") query.audio = source.doc._id;

    const existing = await StudyMaterial.findOne(query);
    if (existing) {
      existing.summaries = result.summaries;
      existing.flashcards = result.flashcards;
      existing.quizzes = result.quizzes;
      await existing.save();
    } else {
      await StudyMaterial.create({
        user: req.user._id,
        ...(source.type === "note"
          ? { note: source.doc._id }
          : { audio: source.doc._id }),
        summaries: result.summaries,
        flashcards: result.flashcards,
        quizzes: result.quizzes,
      });
    }

    return res.json(result);
  } catch (err) {
    console.error("generateMaterials error:", err);
    res.status(500).json({ message: "AI error", error: err.message });
  }
};

// ---- Ask-AI (works for both text & audio) ----
const askAboutNote = async (req, res) => {
  try {
    const { noteId, question } = req.body;
    if (!noteId || !question) {
      return res
        .status(400)
        .json({ message: "noteId and question are required" });
    }

    const source = await getTextFromSource(noteId, req.user._id);
    if (!source)
      return res.status(404).json({ message: "Note/Audio not found" });

    const prompt = `You are an assistant that answers ONLY using the text provided below. 
If the answer is not clearly supported by the text, say "I couldn't find that in the note."

Question: ${question}

TEXT:
${source.text}`;

    const answer = await callAI(prompt, 500, 0.1);
    const safeAnswer =
      answer === "DUMMY_AI_RESPONSE"
        ? `Pretend AI answer to: "${question}" based on this content: "${(
            source.text || ""
          ).slice(0, 200)}..."`
        : answer;

    res.json({ answer: safeAnswer });
  } catch (err) {
    console.error("askAboutNote error:", err);
    res
      .status(500)
      .json({ message: "Server error in AI ask", error: err.message });
  }
};

// ---- Mindmap (works for both text & audio) ----
const generateMindmap = async (req, res) => {
  try {
    const { noteId } = req.params;
    const source = await getTextFromSource(noteId, req.user._id);
    if (!source)
      return res.status(404).json({ message: "Note/Audio not found" });

    const text = source.text;

    const prompt = `
Turn the following text into a JSON mind map.

Format exactly like this:
{
  "nodes": [
    { "id": "1", "data": { "label": "Main Idea" }, "position": { "x": 250, "y": 25 } },
    { "id": "2", "data": { "label": "Subtopic" }, "position": { "x": 100, "y": 125 } }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2" }
  ]
}

Rules:
- Only output pure JSON, no explanations.
- Keep 5–8 nodes max.
- Position nodes roughly spaced out.
- Connect all subtopics to the main idea.

Text:
${text}
`;

    const aiResponse = await callAI(prompt, 800, 0.3);
    const cleaned = aiResponse
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("❌ AI mindmap parse error:", err);
      return res.json({ mindmap: { nodes: [], edges: [] } });
    }

    res.json({ mindmap: parsed });
  } catch (err) {
    console.error("Mindmap generation error:", err);
    res.status(500).json({ message: "Error generating mindmap" });
  }
};

// ---- Generate Markdown ----
const generateMarkdown = async (req, res) => {
  try {
    const { noteId } = req.params;

    const source = await getTextFromSource(noteId, req.user._id);
    if (!source)
      return res.status(404).json({ message: "Note/Audio not found" });

    const text = source.text;

    const markdown = await callAI(
      `Convert the following text into a well-structured Markdown document. 
Use headers, bullet points, code blocks (if applicable), and proper markdown syntax.

Text:
${text}`,
      800
    );

    res.json({
      markdown:
        markdown === "DUMMY_AI_RESPONSE"
          ? `# Dummy Markdown\n\n- Point 1\n- Point 2`
          : markdown,
    });
  } catch (err) {
    console.error("generateMarkdown error:", err);
    res
      .status(500)
      .json({ message: "Error generating markdown", error: err.message });
  }
};



module.exports = {
  generateMaterials,
  getStudyMaterial,
  askAboutNote,
  generateMindmap,
  getTextFromSource,
  callAI,
  generateMarkdown,
};
