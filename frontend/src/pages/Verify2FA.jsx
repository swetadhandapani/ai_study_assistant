import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Verify2FA() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Stored in localStorage after login attempt
  const email = localStorage.getItem("pending2FAEmail");
  const method = localStorage.getItem("pending2FAMethod"); // "email" or "totp"

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code) {
      toast.error("⚠️ Please enter the 2FA code.");
      return;
    }

    try {
      setLoading(true);
      const endpoint =
        method === "totp" ? "/auth/verify-totp" : "/auth/verify-2fa";

      //  Ensure code is always sent as a string
      const res = await api.post(endpoint, {
        email,
        code: code.toString().trim(),
      });

      // Store token and user in localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Clear pending data
      localStorage.removeItem("pending2FAEmail");
      localStorage.removeItem("pending2FAMethod");

      // Notify Navbar about new login
      window.dispatchEvent(new Event("userUpdated"));

      toast.success("🎉 Login successful!");
      navigate("/upload");
    } catch (err) {
      toast.error(err.response?.data?.message || "❌ Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post("/auth/resend-2fa", { email });
      toast.success("📩 A new code has been sent to your email.");
    } catch (err) {
      toast.error(err.response?.data?.message || "❌ Failed to resend code.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 text-center max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🔐 Two-Factor Authentication
        </h2>

        {method === "email" ? (
          <p className="text-sm text-gray-600 mb-6">
            We sent a 6-digit code to your email <b>{email}</b>. <br />
            Enter it below to complete your login.
          </p>
        ) : (
          <p className="text-sm text-gray-600 mb-6">
            Open your <b>Authenticator App</b> and enter the 6-digit code.
          </p>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} // ✅ digits only
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
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        {method === "email" && (
          <p className="text-sm text-gray-500 mt-4">
            Didn’t get the code? <br />
            <button
              onClick={handleResend}
              className="text-blue-600 font-semibold hover:underline"
            >
              Resend Code
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
