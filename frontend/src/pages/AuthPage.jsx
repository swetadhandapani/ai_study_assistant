import React, { useState, useEffect } from "react";
import api from "../api/axiosInstance";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🔑 Check if user just verified via email link
  useEffect(() => {
    if (localStorage.getItem("emailVerified") === "true") {
      toast.success("🎉 Email verified successfully! Please login.");
      localStorage.removeItem("emailVerified");
    }
  }, []);

  const validateInputs = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{1,25}$/;

    if (!emailRegex.test(email)) {
      toast.error(
        "⚠️ Only valid Gmail addresses are allowed (name@gmail.com)."
      );
      return false;
    }
    if (!passwordRegex.test(password)) {
      toast.error(
        "⚠️ Password must contain letters, numbers, special characters and not exceed 25 characters."
      );
      return false;
    }
    return true;
  };

  
  const handleAuth = async (e) => {
  e.preventDefault();
  if (!validateInputs()) return;
  try {
    const url = isRegister ? "/auth/register" : "/auth/login";
    const res = await api.post(
      url,
      isRegister ? { name, email, password } : { email, password }
    );

    if (isRegister) {
      toast.info("✅ Registered! Please check your email to verify before logging in.");
      setTimeout(() => (window.location.href = "/verify-info"), 1500);
    } else {
      // ✅ Step 1: If backend says 2FA is required
      if (res.data.requires2FA) {
        localStorage.setItem("pending2FAEmail", email); // save for Verify2FA.jsx
        localStorage.setItem("pending2FAMethod", res.data.method); // "email" or "totp"
        toast.info("🔐 Please enter the 2FA code sent to your email.");
        setTimeout(() => (window.location.href = "/verify-2fa"), 1000);
        return;
      }

      // ✅ Step 2: If user exists but not verified
      if (!res.data.user?.isVerified) {
        toast.error("⚠️ Please verify your email before logging in.");
        return;
      }

      // ✅ Step 3: Store token temporarily
      localStorage.setItem("token", res.data.token);

      // ✅ Step 4: Always fetch a fresh profile (so user state is consistent)
      const profileRes = await api.get("/auth/profile", {
        headers: { Authorization: `Bearer ${res.data.token}` },
      });

      const freshUser = profileRes.data.user;
      localStorage.setItem("user", JSON.stringify(freshUser));

      // ✅ Step 5: Success → redirect
      toast.success("🎉 Login successful!");
      setTimeout(() => (window.location.href = "/upload"), 1200);
    }
  } catch (err) {
    toast.error(err.response?.data?.message || err.message);
  }
};


  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Left Side */}
      <div className="flex w-full md:w-1/2 bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center text-white p-10">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Welcome!</h1>
          <p className="text-base md:text-lg">
            Manage your notes and files in one place securely.
          </p>
        </div>
      </div>

      {/* Right Side (Form) */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-gray-50 overflow-y-auto py-10">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg w-full max-w-md">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-center text-gray-800">
            {isRegister ? "Create Account" : "Login to Your Account"}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegister && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            )}
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />

            {/* Password field with toggle */}
            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Forgot Password Link */}
            {!isRegister && (
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-blue-600 text-sm">
                  Forgot Password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition duration-300"
            >
              {isRegister ? "Register" : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-purple-600 font-semibold hover:underline"
            >
              {isRegister ? "Login" : "Register"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
