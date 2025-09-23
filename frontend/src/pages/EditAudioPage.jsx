import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function EditAudioPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAudio = async () => {
      try {
        const res = await api.get(`/audio/${id}`);
        setTitle(res.data.title || "");
      } catch (err) {
        toast.error(err.response?.data?.message || "⚠️ Failed to load audio note");
      }
    };
    fetchAudio();
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send multipart/form-data since we may upload a new file
      const form = new FormData();
      form.append("title", title);
      if (file) form.append("audio", file);

      await api.put(`/audio/${id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(" Audio note updated");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "⚠️ Failed to update audio note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <form
        onSubmit={handleSave}
        className="p-6 bg-white rounded-lg shadow-md border border-gray-200 space-y-4"
      >
        <h2 className="text-xl font-bold mb-2">Edit Audio Note</h2>

        <label className="text-sm font-medium">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter audio title..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
        />

        <label className="text-sm font-medium">Replace audio file (optional)</label>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-gray-700 cursor-pointer"
        />

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 rounded border"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-5 py-2 rounded-md"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
