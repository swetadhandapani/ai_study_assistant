import React, { useState } from "react";
import { Share2 } from "lucide-react"; 
import gsap from "gsap";

export default function Flashcards({ cards = [] }) {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % cards.length);
  const prev = () => setIndex((i) => (i - 1 + cards.length) % cards.length);

  const shareAllCards = async () => {
    if (cards.length === 0) return;

    const allContent = cards
      .map(
        (c, i) =>
          `Card ${i + 1}:\nQ: ${c.question}\nA: ${c.answer || "—"}\n`
      )
      .join("\n");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Flashcards",
          text: allContent,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(allContent);
        alert("All flashcards copied to clipboard!");
      } catch (err) {
        console.error("Clipboard copy failed:", err);
      }
    }
  };

  return (
    <div>
      {cards.length === 0 ? (
        <div>No flashcards</div>
      ) : (
        <div className="relative p-4 md:p-6 border rounded bg-white shadow">
          {/* Share Icon at Top Right */}
          <button
            onClick={shareAllCards}
            className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100"
            title="Share All Flashcards"
          >
            <Share2 className="w-5 h-5 text-blue-600" />
          </button>

          <div className="text-xs md:text-sm text-gray-600 mb-2">
            Card {index + 1} / {cards.length}
          </div>
          <div className="text-base md:text-lg font-semibold mb-3">
            {cards[index].question}
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-blue-600 text-sm md:text-base">
              Show answer
            </summary>
            <div className="mt-2 text-gray-700 text-sm md:text-base">
              {cards[index].answer}
            </div>
          </details>

          {/* Navigation buttons */}
          <div className="flex gap-2 mt-3 justify-center md:justify-start">
            <button
              onClick={prev}
              className="px-2 md:px-3 py-1 border rounded text-sm md:text-base"
            >
              Prev
            </button>
            <button
              onClick={next}
              className="px-2 md:px-3 py-1 border rounded text-sm md:text-base"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
