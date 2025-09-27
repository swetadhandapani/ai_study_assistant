import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Download, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";

export default function AvatarPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const imageUrl =
    location.state?.avatar || JSON.parse(localStorage.getItem("user"))?.avatar;
  const name = location.state?.name || "profile";

  if (!imageUrl) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-gray-500">No image to preview</p>
      </div>
    );
  }

  const handleDownload = async () => {
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error("Failed to download image");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${name}-avatar.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="relative max-w-2xl w-full bg-white shadow-lg rounded-lg p-6">
        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-full shadow"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar Image */}
        <img
          src={imageUrl}
          alt="Full Avatar"
          className="w-full max-h-[80vh] object-contain rounded-md shadow"
        />

        {/* Download Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={handleDownload}
            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}


 
