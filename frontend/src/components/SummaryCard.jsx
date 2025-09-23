import React from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SummaryCard({ summaries = [] }) {
  if (!Array.isArray(summaries) || summaries.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 max-w-3xl mx-auto">
        <p className="text-gray-500">No summary available.</p>
      </div>
    );
  }

  const grouped = [];
  let currentGroup = null;

  summaries.forEach((line) => {
    if (typeof line !== "string") return;
    const trimmed = line.trim();

    if (trimmed.startsWith("Here are the article's main points")) return;

    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      if (currentGroup) grouped.push(currentGroup);
      currentGroup = { title: trimmed.replace(/\*\*/g, ""), points: [] };
    } else if (trimmed.startsWith("*")) {
      if (!currentGroup) currentGroup = { title: "Summary", points: [] };
      currentGroup.points.push(trimmed.replace(/^\* /, ""));
    } else {
      if (!currentGroup) currentGroup = { title: "Summary", points: [] };
      currentGroup.points.push(trimmed);
    }
  });

  if (currentGroup) grouped.push(currentGroup);

  // Function to copy entire summary text
  const handleCopy = () => {
    const fullText = grouped
      .map(
        (section) =>
          `${section.title}\n${section.points.map((p) => `- ${p}`).join("\n")}`
      )
      .join("\n\n");

    navigator.clipboard.writeText(fullText);
    toast.success("Summary copied to clipboard!");
  };

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow-md border border-gray-200 max-w-full md:max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800">📄 Summary</h2>
        <button
          onClick={handleCopy}
          className="px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
        >
          📋 Copy
        </button>
      </div>

      {grouped.map((section, index) => (
        <div key={index} className="mb-4 md:mb-5">
          <h3 className="text-md md:text-lg font-medium text-gray-700 mb-2">
            {section.title}
          </h3>
          <ul className="list-disc pl-4 md:pl-5 space-y-1">
            {section.points.map((point, i) => (
              <li key={i} className="text-sm md:text-base text-gray-600">
                {point}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
