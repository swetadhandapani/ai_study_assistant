import React, { useState } from "react";
import api from "../api/axiosInstance";
import { toast } from "react-toastify";

const Chatbot = ({ note }) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const askAI = async () => {
    if (!chatInput.trim() || !note) return;
    const question = chatInput.trim();

    setChatMessages((prev) => [...prev, { role: "user", text: question }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await api.post("/ai/ask", { noteId: note._id, question });
      setChatMessages((prev) => [...prev, { role: "assistant", text: res.data.answer }]);
    } catch (err) {
      toast.error(err.response?.data?.message || "⚠️ AI failed to answer");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="mt-6 border rounded-lg bg-white shadow p-4 max-h-96 flex flex-col">
      <h3 className="font-semibold text-pink-600 mb-2">💬 Ask AI about this note</h3>

      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg max-w-[80%] ${
              msg.role === "user"
                ? "bg-indigo-100 self-end text-right ml-auto"
                : "bg-gray-100 self-start text-left"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {chatLoading && <div className="text-gray-500 text-sm">AI is thinking...</div>}
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && askAI()}
          placeholder="Ask something about this note..."
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
        <button
          onClick={askAI}
          disabled={chatLoading}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
