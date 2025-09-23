import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function UploadArea({ isEdit = false }) {
  const { id } = useParams();
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  // If edit mode, fetch note
  useEffect(() => {
    if (isEdit && id) {
      (async () => {
        try {
          const res = await api.get(`/notes/${id}`);
          setTitle(res.data.title);
          setText(res.data.originalText);
        } catch (err) {
          toast.error(err.response?.data?.message || "⚠️ Failed to load note");
        }
      })();
    }
  }, [isEdit, id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!isEdit && !file && (!text || text.trim().length < 20)) {
      return toast.warning("⚠️ Upload a PDF or paste at least 20 characters of text");
    }
    try {
      setLoading(true);
      const form = new FormData();
      form.append("title", title);
      if (file) form.append("file", file);
      if (text) form.append("text", text);

      if (isEdit) {
        await api.put(`/notes/${id}`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(" Note updated successfully!");
      } else {
        await api.post("/notes/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(" Uploaded successfully!");
      }
      setTimeout(() => (window.location.href = "/dashboard"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 bg-white p-6 rounded-lg shadow-md border border-gray-200"
    >
      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter note title..."
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
      />

      {/* File Upload */}
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
        className="w-full text-gray-700 cursor-pointer"
      />

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="Or paste your notes here..."
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none resize-none"
      ></textarea>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md font-medium transition-colors shadow-md"
        >
          {loading
            ? isEdit
              ? "Updating..."
              : "Uploading..."
            : isEdit
            ? "Update Note"
            : "Upload & Create"}
        </button>
      </div>
    </form>
  );
}
