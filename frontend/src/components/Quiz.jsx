import React, { useState } from "react";
import { FaShareAlt } from "react-icons/fa";

export default function Quiz({ quizzes = [] }) {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [showAnswers, setShowAnswers] = useState(false); 

  if (!quizzes.length) return <div>No quizzes</div>;

  const current = quizzes[i];

  const choose = (idx) => {
    setAnswers((prev) => [...prev, idx]);
    if (idx === current.answerIndex) setScore((s) => s + 1);

    if (i + 1 < quizzes.length) setI(i + 1);
    else setDone(true);
  };

  const handleShare = async () => {
    if (!done) return;

    let text = `📘 Quiz Results\nScore: ${score} / ${quizzes.length}\n\n`;

    quizzes.forEach((q, idx) => {
      text += `${idx + 1}. ${q.question}\n`;
      text += `✅ Correct: ${q.options[q.answerIndex]}\n`;
      text += answers[idx] === q.answerIndex
        ? `🎯 Your Answer: ${q.options[answers[idx]]} (Correct)\n\n`
        : `❌ Your Answer: ${q.options[answers[idx]]}\n\n`;
    });

    if (navigator.share) {
      await navigator.share({ title: "Quiz Results", text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Results copied to clipboard!");
    }
  };

  return (
    <div className="relative p-4 md:p-6 border rounded bg-white shadow">
      {/* Share Icon at Top Right */}
      <button
        onClick={handleShare}
        disabled={!done}
        title={
          done
            ? "Share Results"
            : "Complete the quiz before sharing"
        }
        className={`absolute top-2 right-2 p-2 rounded-full ${
          done
            ? "bg-indigo-600 text-white hover:bg-indigo-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        <FaShareAlt />
      </button>

      {!done ? (
        <>
          <div className="text-xs md:text-sm text-gray-500 mb-2">
            Q {i + 1} / {quizzes.length}
          </div>
          <div className="font-semibold text-base md:text-lg mb-3">{current.question}</div>
          <div className="grid gap-2">
            {current.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => choose(idx)}
                className="text-left p-2 md:p-3 border rounded hover:bg-gray-50 transition text-sm md:text-base"
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div>
          <h3 className="text-lg md:text-xl font-semibold text-indigo-700">
            Quiz complete! 🎉
          </h3>
          <p className="mt-2 font-medium text-sm md:text-base">
            Score: {score} / {quizzes.length}
          </p>
          <button
            onClick={() => setShowAnswers((prev) => !prev)}
            className="mt-3 px-3 md:px-4 py-2 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition text-sm md:text-base"
          >
            {showAnswers ? "Hide Answers" : "Show Answers"}
          </button>
          {showAnswers && (
            <ul className="mt-4 space-y-3 text-sm md:text-base">
              {quizzes.map((q, idx) => (
                <li key={idx} className="p-3 md:p-4 border rounded bg-gray-50">
                  <p className="font-medium">{idx + 1}. {q.question}</p>
                  <p className="text-xs md:text-sm">
                    ✅ Correct: <span className="font-semibold text-green-600">{q.options[q.answerIndex]}</span>
                  </p>
                  <p className="text-xs md:text-sm">
                    {answers[idx] === q.answerIndex ? (
                      <span className="text-green-600">You chose the right answer 🎯</span>
                    ) : (
                      <span className="text-red-500">❌ Your Answer: {q.options[answers[idx]]}</span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
