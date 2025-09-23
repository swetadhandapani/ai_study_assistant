import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ConfirmTOTPSetup() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!code) {
      toast.error("⚠️ Please enter the 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await api.post(
        "/auth/confirm-totp",
        { code },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(res.data.message);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Notify Navbar about new user state
      window.dispatchEvent(new Event("userUpdated"));

      navigate("/dashboard"); 
    } catch (err) {
      toast.error(err.response?.data?.message || "❌ Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 text-center max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🔐 Confirm TOTP Setup
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter the <b>6-digit code</b> from your Authenticator app to finish
          setup.
        </p>

        <form onSubmit={handleConfirm} className="space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter 6-digit code"
            maxLength="6"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center tracking-widest text-lg"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loading ? "Confirming..." : "Confirm Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
