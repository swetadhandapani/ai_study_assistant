import React from "react";
import UploadArea from "../components/UploadArea";

export default function EditUploadPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start py-12 px-4">
      <div className="w-full max-w-3xl bg-white p-8 rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
          ✏️ Edit Your Note
        </h2>
        <UploadArea isEdit={true} />
      </div>
    </div>
  );
}
