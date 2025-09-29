import React from "react";
import { FiX } from "react-icons/fi";

const BASE_URL = import.meta.env.VITE_API_URL?.startsWith("http")
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, "")
  : window.location.origin;

export default function NotePreviewModal({ note, onClose }) {
  if (!note) return null;

  const fileUrl = note.fileUrl ? `${BASE_URL}/api${note.fileUrl}` : null;
  const isPDF = note.fileUrl?.match(/\.pdf$/i);
  const isImage = note.fileUrl?.match(/\.(jpeg|jpg|png|gif)$/i);
  const isOffice = note.fileUrl?.match(/\.(docx?|pptx?)$/i);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-2 sm:px-4">
      <div className="bg-white rounded-lg shadow-lg w-full sm:w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b">
          <h2 className="text-base sm:text-lg font-bold text-indigo-700 truncate">
            📖 {note.title || "Untitled Note"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1">
          {/* Extracted Text */}
          {note.originalText && (
            <div className="mb-4">
              <h3 className="font-semibold text-indigo-600 mb-2 text-sm sm:text-base">
                📝 Extracted Text
              </h3>
              <p className="text-gray-700 text-sm sm:text-base whitespace-pre-line break-words">
                {note.originalText}
              </p>
            </div>
          )}

          {/* File Preview */}
          {fileUrl && (
            <div className="mb-4">
              <h3 className="font-semibold text-indigo-600 mb-2 text-sm sm:text-base">
                📂 File Preview
              </h3>

              {isPDF ? (
                <div className="w-full border rounded overflow-hidden">
                  <iframe
                    src={fileUrl}
                    sandbox="allow-same-origin allow-scripts allow-popups"
                    className="w-full min-h-[400px] sm:min-h-[500px] h-[70vh]"
                    style={{ display: "block" }}
                    title="PDF Preview"
                  />
                  <div className="text-center mt-2">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      📥 Open PDF in New Tab
                    </a>
                  </div>
                </div>
              ) : isImage ? (
                <div className="text-center">
                  <img
                    src={fileUrl}
                    alt="Uploaded file"
                    className="w-full max-h-[400px] sm:max-h-[500px] object-contain rounded-md shadow"
                  />
                  <div className="mt-2">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      📥 Download Image
                    </a>
                  </div>
                </div>
              ) : isOffice ? (
                <div className="w-full border rounded overflow-hidden">
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(
                      fileUrl
                    )}&embedded=true`}
                    className="w-full min-h-[400px] sm:min-h-[500px] h-[70vh]"
                    style={{ display: "block" }}
                    title="Google Docs Preview"
                  />
                  <div className="text-center mt-2">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      📥 Open File in New Tab
                    </a>
                  </div>
                </div>
              ) : (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="text-blue-600 underline break-all"
                >
                  📥 Download {note.fileUrl.split("/").pop()}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
