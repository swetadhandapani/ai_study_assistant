import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");
  const navigate = useNavigate();

 useEffect(() => {
  axios
    .get(`${import.meta.env.VITE_API_URL}/api/auth/verify-email/${token}`)
    .then((res) => {
      if (res.data.user && res.data.token) {
        // Store full session
        localStorage.setItem("userInfo", JSON.stringify(res.data));
        setMessage("✅ Email verified successfully! Redirecting...");
        setStatus("success");

        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        setMessage("⚠️ Verification failed. Please try logging in.");
        setStatus("error");
      }
    })
    .catch((err) => {
      setMessage(err.response?.data?.message || "❌ Verification failed");
      setStatus("error");
    });
}, [token, navigate]);


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 text-center max-w-md w-full">
        {status === "loading" && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Verifying your email...
            </h2>
            <p className="text-sm text-gray-500">Please wait a moment.</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              🎉 Verification Successful!
            </h2>
            <p className="text-sm text-gray-600">{message}</p>
            <p className="text-sm text-gray-400 mt-2">
              Redirecting to your dashboard...
            </p>
          </div>
        )}

        {status === "error" && (
          <div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              ❌ Verification Failed
            </h2>
            <p className="text-sm text-gray-600">{message}</p>
            <Link
              to="/resend-verification"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Resend Verification Email
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
