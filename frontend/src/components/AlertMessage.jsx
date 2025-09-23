import React from "react";

export default function AlertMessage({ type = "info", message, onClose }) {
  if (!message) return null;

  const colors = {
    success: "bg-green-100 text-green-700 border-green-400",
    error: "bg-red-100 text-red-700 border-red-400",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-400",
    info: "bg-blue-100 text-blue-700 border-blue-400",
  };

  return (
    <div
      className={`fixed top-5 right-5 max-w-sm w-full border-l-4 p-4 rounded shadow-lg ${colors[type]} animate-fade-in`}
    >
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-3 text-lg font-bold focus:outline-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
