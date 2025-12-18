import React, { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import logo from "../assets/icon.png"
import { useEffect, useCallback } from "react";


function Navbar() {
  const [isNavOpen, setIsNavOpen] = useState(false); // For mobile menu toggle
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); 

  // const navigate = useNavigate();
  const API_BASE_URL = 'https://major-backend-r7lx.onrender.com'; // Or import from a config file

  // Function to check authentication status
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Essential for sending/receiving cookies
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsAuthenticated(true);
          if(data.user.email === "adminmasle@gmail.com") {
            setIsAdmin(true); // Set admin status based on user role
          }
        } else {
          // Handle case where cookie exists but is invalid/user not found
          setIsAuthenticated(false);
        }
      } else {
        // Not authorized or other error
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error verifying auth status:', error);
      setIsAuthenticated(false);
    } 
  }, []);

  // Check auth status when the app loads
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Function to handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Essential for sending cookies
      });
      if (response.ok) {
        setIsAuthenticated(false);
      } else {
        console.error('Logout failed:', await response.text());
        // Optionally handle logout failure on the UI
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  return (
    <nav className="bg-gradient-to-r from-purple-700 to-purple-800 shadow-md z-20">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left Navigation Links (Desktop) */}
        <div className="hidden md:flex space-x-6">
          <a
            href="/"
            className="text-white hover:text-gray-200 font-medium tracking-wide transition duration-300"
          >
            Home
          </a>
          <a
            href="#features"
            className="text-white hover:text-gray-200 font-medium tracking-wide transition duration-300"
          >
            Features
          </a>
          <a
            href="#contact"
            className="text-white hover:text-gray-200 font-medium tracking-wide transition duration-300"
          >
            Contact Us
          </a>
          {isAdmin && (
            <a
              href="/admin"
              className="text-white hover:text-gray-200 font-medium tracking-wide transition duration-300"
            >
              Admin Panel
            </a>
          )}
        </div>

        {/* Logo */}
        <div className="flex items-center ">
          <img
            src={logo} // Replace with your logo URL
            alt="Logo"
            className=" h-12"
          />
          <span className="text-2xl font-bold text-white">MindCare</span>
        </div>

        {/* Right Side: Dynamic Button (Login/Logout) */}
        <div className="hidden md:flex items-center space-x-4">
          <a href="/auth">
          <button
            onClick={() => {
              if (isAuthenticated) {
                handleLogout();
              }
            }}
            className={`${
              isAuthenticated 
                ? "bg-white text-purple-700"
                : "bg-gradient-to-r from-purple-600 to-purple-500"
            } hover:shadow-lg focus:ring-2 focus:ring-purple-400 font-medium px-5 py-2 rounded-full shadow-md transition-transform transform hover:scale-105 active:scale-95`}
          >
            {isAuthenticated ? "Logout" : "Login/Signup"}
          </button>
          </a>
          <a href="/chat">
          <button className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold px-6 py-2 rounded-full shadow-lg transition-transform transform hover:scale-110 active:scale-95">
            Try MindCare for Free
          </button>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white hover:text-gray-200 focus:outline-none"
          onClick={() => setIsNavOpen(!isNavOpen)}
        >
          {isNavOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isNavOpen && (
        <div className="md:hidden px-4 pb-4 bg-gradient-to-r from-purple-700 to-purple-800 shadow-lg">
          <a
            href="/"
            className="block py-2 text-white hover:text-gray-200 font-medium transition duration-300"
            onClick={() => setIsNavOpen(false)}
          >
            Home
          </a>
          <a
            href="#features"
            className="block py-2 text-white hover:text-gray-200 font-medium transition duration-300"
            onClick={() => setIsNavOpen(false)}
          >
            Features
          </a>
          <a
            href="#contact"
            className="block py-2 text-white hover:text-gray-200 font-medium transition duration-300"
            onClick={() => setIsNavOpen(false)}
          >
            Contact Us
          </a>
          {isAdmin && (
            <a
              href="/admin"
              className="block py-2 text-white hover:text-gray-200 font-medium transition duration-300"
              onClick={() => setIsNavOpen(false)}
            >
              Admin Panel
            </a>
          )}
          <a href="/auth">
          <button
            onClick={() => {
              setIsNavOpen(false);
            }}
            className={`block w-full text-left py-2 ${
              isAuthenticated
                ? "bg-white text-purple-700"
                : "bg-gradient-to-r from-purple-600 to-purple-500"
            } hover:shadow-lg focus:ring-2 focus:ring-purple-400 font-medium px-5 rounded-full shadow-md transition-transform transform hover:scale-105 active:scale-95`}
          >
            {isAuthenticated ? "Logout" : "Login/Signup"}
          </button>
          </a>
          <a href="/chat">
          <button className="mt-4 w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold px-6 py-2 rounded-full shadow-lg transition-transform transform hover:scale-110 active:scale-95">
            Try MindCare for Free
          </button>
          </a>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
