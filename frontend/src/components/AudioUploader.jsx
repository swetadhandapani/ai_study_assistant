import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AudioUploader() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Unified Upload Handler
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      return toast.warn("⚠️ Please select an audio file");
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("audio", file);
    formData.append("title", title.trim() || "Untitled Audio");

    // Token retrieval (checks both token & userInfo)
    let token = localStorage.getItem("token");
    if (!token) {
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        try {
          const parsed = JSON.parse(userInfo);
          token = parsed?.token || parsed?.accessToken;
        } catch {}
      }
    }

    if (!token) {
      toast.error("⚠️ You must be logged in to upload audio");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/audio/transcribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success(" Audio uploaded successfully!");
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        toast.error(data?.message || "⚠️ Audio upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("❌ Error uploading audio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleUpload}
      className="space-y-4 bg-white p-6 rounded-lg shadow-md border border-gray-200"
    >
     

      {/* Title Input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter audio title..."
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
      />

      {/* File Input */}
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="w-full text-gray-700 cursor-pointer"
      />

      {/* Upload Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-colors shadow-md"
        >
          {loading ? "Uploading..." : "Upload Audio"}
        </button>
      </div>
    </form>
  );
}
