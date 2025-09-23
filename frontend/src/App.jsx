import React from "react";
import { Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import UploadPage from "./pages/UploadPage";
import EditUploadPage from "./pages/EditUploadPage";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import AudioUploader from "./components/AudioUploader";
import VerifyEmail from "./components/VerifyEmail";
import VerifyInfo from "./pages/VerifyInfo";
import ResendVerification from "./components/ResendVerification";
import EditAudioPage from "./pages/EditAudioPage";
import AvatarPreview from "./pages/AvatarPreview";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Verify2FA from "./pages/Verify2FA";
import ConfirmTOTPSetup from "./pages/ConfirmTOTPSetup";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/avatar-preview" element={<AvatarPreview />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/verify-info" element={<VerifyInfo />} />
          <Route path="/verify-2fa" element={<Verify2FA />} />

          <Route path="/resend-verification" element={<ResendVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route path="/profile" element={<Profile />} />

          <Route
            path="/confirm-totp"
            element={
              <ProtectedRoute>
                <ConfirmTOTPSetup />
              </ProtectedRoute>
            }
          />

          {/* Notes Upload */}
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload/:id"
            element={
              <ProtectedRoute>
                <EditUploadPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/upload-audio"
            element={
              <ProtectedRoute>
                <AudioUploader />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload-audio/:id"
            element={
              <ProtectedRoute>
                <EditAudioPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </div>
  );
}
