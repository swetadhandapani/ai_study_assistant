import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/auth/verify-email/${token}`
        );

        if (res.data.success) {
          setStatus("success");
          toast.success("✅ Email verified successfully! Redirecting to login...");
          localStorage.setItem("emailVerified", "true");

          // Redirect after 3 seconds
          setTimeout(() => navigate("/"), 3000);
        } else {
          setStatus("error");
          toast.error(
            res.data.message || "⚠️ Verification failed. Please try again."
          );
        }
      } catch (err) {
        setStatus("error");
        toast.error(
          err.response?.data?.message || "❌ Verification failed. Try again."
        );
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <ToastContainer position="top-center" autoClose={3000} />
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
            <p className="text-sm text-gray-600">
              Your email is verified. Redirecting to login...
            </p>
          </div>
        )}

        {status === "error" && (
          <div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              ❌ Verification Failed
            </h2>
            <p className="text-sm text-gray-600">
              Please try again or resend verification email.
            </p>
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
