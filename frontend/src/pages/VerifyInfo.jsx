import React from "react";
import { Link } from "react-router-dom";

export default function VerifyInfo() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md text-center">
        <h2 className="text-2xl font-bold text-green-600 mb-4">
          Verify Your Email
        </h2>
        <p className="text-gray-700 mb-4">
          We’ve sent you a verification link. Please check your inbox (and spam folder).
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Once verified, you can log in with your credentials.
        </p>
        <Link
          to="/"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
