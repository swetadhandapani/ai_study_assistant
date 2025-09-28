import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle, FaBars, FaTimes } from "react-icons/fa";

export default function Navbar() {
  const navigate = useNavigate();
  const [warning, setWarning] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const userMenuRef = useRef(null);
  const mainMenuRef = useRef(null);

  // ✅ Normalize avatar URL
  const normalizeAvatar = (userObj) => {
    if (!userObj) return null;
    let avatar = userObj.avatar;
    if (avatar && !avatar.startsWith("http")) {
      avatar = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${
        avatar.startsWith("/") ? "" : "/"
      }${avatar}`;
    }
    return { ...userObj, avatar };
  };

  // ✅ Load user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
      setUser(normalizeAvatar(JSON.parse(storedUser)));
    }
  }, []);

  // ✅ Sync with login/logout/profile updates
  useEffect(() => {
    const syncUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
        setUser(normalizeAvatar(JSON.parse(storedUser)));
      } else {
        setUser(null);
      }
    };

    window.addEventListener("storage", syncUser);
    window.addEventListener("userUpdated", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("userUpdated", syncUser);
    };
  }, []);

  // ✅ Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  // ✅ Close main menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mainMenuRef.current && !mainMenuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // ✅ Logout clears localStorage and syncs UI
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
    window.dispatchEvent(new Event("userUpdated"));
  };

  const isVerified = user?.isVerified;

  // ⚠️ Temporary warning popup
  const showWarning = (message) => {
    setWarning(message);
    setTimeout(() => setWarning(null), 5000);
  };

  // ✅ Prevent unverified users from accessing pages
  const handleProtectedClick = (e, page) => {
    if (!user) {
      e.preventDefault();
      showWarning("⚠️ Please login to access this page");
    } else if (!isVerified) {
      e.preventDefault();
      showWarning("⚠️ Please verify your email before accessing " + page);
    }
  };

  return (
    <>
      {warning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg shadow-lg z-50">
          {warning}
        </div>
      )}

      <nav className="bg-white shadow-md border-t-4 border-gradient-to-r from-purple-500 to-blue-500">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            to="/"
            className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            AI Study Assistant
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-2xl text-gray-700"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>

          <div
            ref={mainMenuRef}
            className={`${
              menuOpen ? "flex" : "hidden"
            } md:flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 absolute md:static top-16 left-0 w-full md:w-auto bg-white md:bg-transparent shadow-md md:shadow-none px-6 py-4 md:p-0 z-40`}
          >
            <Link
              to="/dashboard"
              onClick={(e) => handleProtectedClick(e, "Dashboard")}
              className="text-gray-700 hover:text-purple-600 transition-colors hover:underline"
            >
              Dashboard
            </Link>

            {user && (
              <Link
                to="/upload"
                onClick={(e) => handleProtectedClick(e, "Upload")}
                className="text-gray-700 hover:text-purple-600 transition-colors hover:underline"
              >
                Upload
              </Link>
            )}

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-md shadow-md bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 transition"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <FaUserCircle className="text-xl" />
                  )}
                  <span className="font-medium">{user.name || user.email}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg overflow-hidden z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-purple-50"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={(e) => handleProtectedClick(e, "Dashboard")}
                      className="block px-4 py-2 text-gray-700 hover:bg-purple-50"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/"
                className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white px-4 py-2 rounded-md shadow-md transition duration-300"
              >
                Login / Register
              </Link>
            )}
          </div>
        </div>
      </nav>

      {user && !isVerified && (
        <div className="bg-yellow-100 border-t border-b border-yellow-400 text-yellow-800 text-center p-3">
          📧 Please verify your email to unlock all features. Check your inbox!
        </div>
      )}
    </>
  );
}
