import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import api from "../api/axiosInstance";
import SummaryCard from "../components/SummaryCard";
import Flashcards from "../components/Flashcards";
import Quiz from "../components/Quiz";
import NotePreviewModal from "../components/NotePreviewModal";
import Chatbot from "../components/Chatbot";
import MindMap from "../components/MindMap";
import gsap from "gsap";
import { FiEdit2, FiTrash2, FiEye } from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [audioNotes, setAudioNotes] = useState([]);
  const [selected, setSelected] = useState(null); // text note
  const [selectedAudio, setSelectedAudio] = useState(null); // audio note
  const [material, setMaterial] = useState({
    summaries: [],
    flashcards: [],
    quizzes: [],
    mindmap: null,
  });
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("all");
  const [previewNote, setPreviewNote] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const cardRef = useRef();

  //  Transcript + Translation modal states
  const [openTranscript, setOpenTranscript] = useState(false);
  const [openTranslation, setOpenTranslation] = useState(false);
  const [translationText, setTranslationText] = useState("");
  const [targetLang, setTargetLang] = useState("es");
  const [openMarkdown, setOpenMarkdown] = useState(false);

  useEffect(() => {
    fetchNotes();
    fetchAudioNotes();
  }, []);

  useEffect(() => {
    if (cardRef.current)
      gsap.fromTo(cardRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 });
  }, [material, viewMode]);

  useEffect(() => {
    if (selected) setChatOpen(false);
  }, [selected?._id]);

  const fetchNotes = async () => {
    try {
      const res = await api.get("/notes");
      setNotes(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "⚠️ Failed to fetch notes");
    }
  };

  const fetchAudioNotes = async () => {
    try {
      const res = await api.get("/audio");
      setAudioNotes(res.data);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "⚠️ Failed to fetch audio notes"
      );
    }
  };

  const loadMaterial = async (note) => {
    setSelected(note);
    setSelectedAudio(null);
    try {
      const res = await api.get(`/ai/material/${note._id}`);
      setMaterial({
        summaries: res.data.summaries || [],
        flashcards: res.data.flashcards || [],
        quizzes: res.data.quizzes || [],
        mindmap: null,
      });
    } catch {
      setMaterial({
        summaries: [],
        flashcards: [],
        quizzes: [],
        mindmap: null,
      });
      toast.error("⚠️ Failed to load study material");
    }
  };

  const deleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await api.delete(`/notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
      if (selected && selected._id === noteId) {
        setSelected(null);
        setMaterial({
          summaries: [],
          flashcards: [],
          quizzes: [],
          mindmap: null,
        });
        setChatOpen(false);
      }
      toast.success(" Note deleted successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const deleteAudioNote = async (id) => {
    if (!window.confirm("Are you sure you want to delete this audio note?"))
      return;
    try {
      await api.delete(`/audio/${id}`);
      setAudioNotes((prev) => prev.filter((a) => a._id !== id));
      if (selectedAudio && selectedAudio._id === id) setSelectedAudio(null);
      toast.success(" Audio note deleted successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const generate = async (
    actions = ["summary", "flashcards", "quiz"],
    mode = "all"
  ) => {
    const current = selected || selectedAudio; // ✅ support audio or text
    if (!current) return toast.warning("⚠️ Select a note or audio note first");

    setLoading(true);
    try {
      const res = await api.post("/ai/generate", {
        noteId: current._id,
        actions,
      });

      setMaterial((prev) => ({
        summaries: actions.includes("summary")
          ? res.data.summaries || []
          : prev.summaries,
        flashcards: actions.includes("flashcards")
          ? res.data.flashcards || []
          : prev.flashcards,
        quizzes: actions.includes("quiz")
          ? res.data.quizzes || []
          : prev.quizzes,
        mindmap: prev.mindmap,
      }));

      setViewMode(mode);
      toast.success("✨ Study materials generated!");
    } catch {
      toast.error("⚠️ Failed to generate study material");
    } finally {
      setLoading(false);
    }
  };

  const generateMindmap = async () => {
    const current = selected || selectedAudio; // ✅ support audio or text
    if (!current) return toast.warning("⚠️ Select a note or audio note first");

    setLoading(true);
    try {
      const res = await api.post(`/ai/mindmap/${current._id}`);
      setMaterial((prev) => ({ ...prev, mindmap: res.data.mindmap }));
      setViewMode("mindmap");
      toast.success("🧠 Mind map generated!");
    } catch {
      toast.error("⚠️ Failed to generate mind map");
    } finally {
      setLoading(false);
    }
  };

  const generateMarkdown = async () => {
    const current = selected || selectedAudio;
    if (!current) return toast.warning("⚠️ Select a note or audio note first");

    setLoading(true);
    try {
      const res = await api.post(`/ai/markdown/${current._id}`);
      setMarkdown(res.data.markdown || "");
      setOpenMarkdown(true); 
      setViewMode("markdown");
      toast.success(" Markdown generated!");
    } catch {
      toast.error("⚠️ Failed to generate markdown");
    } finally {
      setLoading(false);
    }
  };

  const translateTranscript = async () => {
    if (!selectedAudio) return;
    try {
      const res = await api.post("/audio/translate", {
        transcript: selectedAudio.transcription || "",
        targetLang,
      });
      setTranslationText(res.data.translated);
      setOpenTranslation(true);
    } catch {
      toast.error("⚠️ Failed to translate transcript");
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen overflow-x-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-gradient-to-b from-indigo-600 via-purple-600 to-blue-500 text-white shadow-xl p-5 overflow-y-auto">
        <h3 className="font-bold text-lg md:text-xl mb-4">📒 Your Notes</h3>
        {notes.length === 0 && (
          <div className="text-gray-200">No notes yet</div>
        )}
        <ul className="space-y-3">
          {notes.map((n) => (
            <li
              key={n._id}
              className={`p-3 rounded-lg flex justify-between items-center cursor-pointer ${
                selected && selected._id === n._id
                  ? "bg-white text-indigo-700 font-semibold"
                  : "bg-indigo-500 hover:bg-indigo-400"
              }`}
              onClick={() => loadMaterial(n)}
              title={n.title}
            >
              {/* Title block */}
              <div className="flex-1 min-w-0">
                <div className="truncate">{n.title}</div>
                <div className="text-xs truncate">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Icons */}
              <div className="flex-shrink-0 flex space-x-2 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewNote(n);
                  }}
                >
                  <FiEye size={18} />
                </button>
                <Link
                  to={`/upload/${n._id}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <FiEdit2 size={18} />
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(n._id);
                  }}
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Audio Notes */}
        <h3 className="font-bold text-lg mt-6 mb-3">🎤 Audio Notes</h3>
        {audioNotes.length === 0 && (
          <div className="text-gray-200">No audio notes yet</div>
        )}
        <ul className="space-y-3">
          {audioNotes.map((a) => (
            <li
              key={a._id}
              className={`p-3 rounded-lg flex justify-between items-center cursor-pointer ${
                selectedAudio && selectedAudio._id === a._id
                  ? "bg-white text-indigo-700 font-semibold"
                  : "bg-indigo-500 hover:bg-indigo-400"
              }`}
              onClick={() => {
                setSelectedAudio(a);
                setSelected(null);
                setMaterial({
                  summaries: [],
                  flashcards: [],
                  quizzes: [],
                  mindmap: null,
                });
                setChatOpen(false);
                setViewMode("all");
              }}
              title={a.title}
            >
              <div className="flex-1 min-w-0">
                <div className="truncate">{a.title}</div>
                <div className="text-xs truncate">
                  {new Date(a.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="flex-shrink-0 flex space-x-2 ml-2">
                <Link to={`/upload-audio/${a._id}`}>
                  <FiEdit2 size={18} />
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAudioNote(a._id);
                  }}
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-50 overflow-y-auto ">
        {!selected && !selectedAudio && (
          <div className="text-gray-500 text-center">
            Select a note or audio note.
          </div>
        )}

        {/* Text Note Viewer */}
        {selected && (
          <>
            <h2
              className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-700 line-clamp-2 break-words"
              title={selected.title}
            >
              {selected.title}
            </h2>
            <div className="text-xs sm:text-sm text-gray-500 mb-4">
              Uploaded: {new Date(selected.createdAt).toLocaleString()}
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => generate(["summary"], "summary")}
                className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                  viewMode === "summary"
                    ? "bg-indigo-700"
                    : "bg-indigo-500 hover:bg-indigo-600"
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => generate(["flashcards"], "flashcards")}
                className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                  viewMode === "flashcards"
                    ? "bg-orange-600"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                Flashcards
              </button>
              <button
                onClick={() => generate(["quiz"], "quiz")}
                className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                  viewMode === "quiz"
                    ? "bg-green-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                Quiz
              </button>
              <button
                onClick={() =>
                  generate(["summary", "flashcards", "quiz"], "all")
                }
                className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                  viewMode === "all"
                    ? "bg-blue-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading && viewMode === "all" ? "Generating..." : "All"}
              </button>
              <button
                onClick={() => setChatOpen((v) => !v)}
                className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                  chatOpen ? "bg-pink-700" : "bg-pink-500 hover:bg-pink-600"
                }`}
              >
                Ask AI
              </button>
              <button
                onClick={generateMindmap}
                className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                  viewMode === "mindmap"
                    ? "bg-purple-700"
                    : "bg-purple-500 hover:bg-purple-600"
                }`}
              >
                Mind Map
              </button>
              <button
                onClick={generateMarkdown}
                className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                  viewMode === "markdown"
                    ? "bg-gray-700"
                    : "bg-gray-500 hover:bg-gray-600"
                }`}
              >
                Markdown
              </button>
            </div>

            <div ref={cardRef}>
              {(viewMode === "summary" || viewMode === "all") &&
                material.summaries.length > 0 && (
                  <>
                    <h3 className="font-semibold text-indigo-700 mb-2">
                      Summary
                    </h3>
                    <SummaryCard summaries={material.summaries} />
                  </>
                )}

              {(viewMode === "flashcards" || viewMode === "all") &&
                material.flashcards.length > 0 && (
                  <>
                    <h3 className="font-semibold text-orange-600 mb-2 mt-4">
                      Flashcards
                    </h3>
                    <Flashcards cards={material.flashcards} />
                  </>
                )}

              {(viewMode === "quiz" || viewMode === "all") &&
                material.quizzes.length > 0 && (
                  <>
                    <h3 className="font-semibold text-green-600 mb-2 mt-4">
                      Quiz
                    </h3>
                    <Quiz quizzes={material.quizzes} />
                  </>
                )}

              {viewMode === "mindmap" && material.mindmap && (
                <MindMap data={material.mindmap} />
              )}

              {chatOpen && <Chatbot note={selected} />}

             
            </div>
          </>
        )}

        {/* Audio Note Viewer */}
        {selectedAudio && (
          <div className="p-4 sm:p-6 bg-white rounded-xl shadow-md">
            <h2
              className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-700 line-clamp-2 break-words"
              title={selectedAudio.title}
            >
              {selectedAudio.title}
            </h2>
            <div className="text-xs sm:text-sm text-gray-500 mb-4">
              Uploaded: {new Date(selectedAudio.createdAt).toLocaleString()}
            </div>
            <audio
              controls
              src={selectedAudio.fileUrl}
              className="w-full mb-4 rounded"
            />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={() => setOpenTranscript(true)}
                className="px-4 py-2 rounded-lg bg-green-600 text-white"
              >
                Show Transcript
              </button>

              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="px-2 py-1 border rounded"
              >
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="ta">Tamil</option>
                <option value="de">German</option>
                <option value="hi">Hindi</option>
                <option value="zh">Chinese</option>
              </select>

              <button
                onClick={translateTranscript}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white"
              >
                Translate
              </button>
            </div>

            {/* New Study Tools for Audio Notes */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => generate(["flashcards"], "flashcards")}
                className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                  viewMode === "flashcards"
                    ? "bg-orange-600"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                Flashcards
              </button>

              <button
                onClick={() => generate(["quiz"], "quiz")}
                className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                  viewMode === "quiz"
                    ? "bg-indigo-700"
                    : "bg-indigo-500 hover:bg-indigo-600"
                }`}
              >
                Quiz
              </button>

              <button
                onClick={() => setChatOpen((v) => !v)}
                className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                  chatOpen ? "bg-pink-700" : "bg-pink-500 hover:bg-pink-600"
                }`}
              >
                Ask AI
              </button>
              <button
                onClick={generateMarkdown}
                className="px-4 py-2 rounded-lg text-white font-medium bg-gray-500 hover:bg-gray-600"
              >
                Markdown
              </button>
            </div>

            {/* Render results */}
            <div className="mt-6">
              {(viewMode === "flashcards" || viewMode === "all") &&
                material.flashcards.length > 0 && (
                  <>
                    <h3 className="font-semibold text-orange-600 mb-2">
                      Flashcards
                    </h3>
                    <Flashcards cards={material.flashcards} />
                  </>
                )}

              {(viewMode === "quiz" || viewMode === "all") &&
                material.quizzes.length > 0 && (
                  <>
                    <h3 className="font-semibold text-green-600 mb-2 mt-4">
                      Quiz
                    </h3>
                    <Quiz quizzes={material.quizzes} />
                  </>
                )}

              {chatOpen && <Chatbot note={selectedAudio} />}
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewNote && (
        <NotePreviewModal
          note={previewNote}
          onClose={() => setPreviewNote(null)}
        />
      )}

      {/* Transcript Modal */}
      {openTranscript && selectedAudio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <h4 className="font-bold text-indigo-700">📝 Transcript</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        selectedAudio.transcription ||
                          "No transcript available."
                      );
                      toast.success("📋 Transcript copied to clipboard!");
                    } catch {
                      toast.error("⚠️ Failed to copy transcript");
                    }
                  }}
                  className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium"
                >
                  Copy
                </button>
                <button
                  onClick={() => setOpenTranscript(false)}
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[70vh] overflow-y-auto p-4">
              <pre className="whitespace-pre-wrap break-words text-sm leading-6">
                {selectedAudio.transcription || "No transcript available."}
              </pre>
            </div>

            {/* Footer with Download button */}
            <div className="border-t p-4 flex justify-end">
              <button
                onClick={() => {
                  const content =
                    selectedAudio.transcription || "No transcript available.";
                  const blob = new Blob([content], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;

                  // Use title or fallback
                  const safeTitle = (
                    selectedAudio.title || "transcript"
                  ).replace(/[^a-z0-9_\-]/gi, "_");
                  a.download = `${safeTitle}_transcript.txt`;

                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                ⬇️ Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Translation Modal */}
      {openTranslation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <h4 className="font-bold text-indigo-700">🌍 Translation</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        translationText || "No translation available."
                      );
                      toast.success("📋 Translation copied to clipboard!");
                    } catch {
                      toast.error("⚠️ Failed to copy translation");
                    }
                  }}
                  className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium"
                >
                  Copy
                </button>
                <button
                  onClick={() => setOpenTranslation(false)}
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[70vh] overflow-y-auto p-4">
              <pre className="whitespace-pre-wrap break-words text-sm leading-6">
                {translationText || "No translation available."}
              </pre>
            </div>

            {/* Footer with Download button */}
            <div className="border-t p-4 flex justify-end">
              <button
                onClick={() => {
                  const content =
                    translationText || "No translation available.";
                  const blob = new Blob([content], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;

                  // Use audio title if available
                  const safeTitle = (
                    selectedAudio?.title || "translation"
                  ).replace(/[^a-z0-9_\-]/gi, "_");
                  a.download = `${safeTitle}_translation.txt`;

                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                ⬇️ Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Markdown Modal */}
      {openMarkdown && markdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <h4 className="font-bold text-indigo-700">📝 Markdown</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(markdown);
                      toast.success(" Markdown copied to clipboard!");
                    } catch {
                      toast.error("⚠️ Failed to copy markdown");
                    }
                  }}
                  className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium"
                >
                  Copy
                </button>
                <button
                  onClick={() => setOpenMarkdown(false)}
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[70vh] overflow-y-auto p-4 prose">
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>

            {/* Footer */}
            <div className="border-t p-4 flex justify-end">
              <button
                onClick={() => {
                  const blob = new Blob([markdown], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  const current = selected || selectedAudio;
                  const safeTitle = (current?.title || "markdown").replace(
                    /[^a-z0-9_\-]/gi,
                    "_"
                  );
                  a.download = `${safeTitle}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                ⬇️ Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
