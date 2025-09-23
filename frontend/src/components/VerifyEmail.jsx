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
        setStatus("success");
        setMessage(res.data.message || "✅ Email verified successfully!");
        +localStorage.setItem("emailVerified", "true"); // store flag
        setTimeout(() => navigate("/"), 3000);
      })
      .catch(() => {
        setStatus("error");
        setMessage("❌ Verification failed or token expired.");
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
              Redirecting to login...
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
