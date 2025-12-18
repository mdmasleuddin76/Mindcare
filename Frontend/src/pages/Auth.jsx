import React, { useState } from "react";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";
import illustration from "../assets/auth.png"; // Replace with your actual image path
import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // const navigate = useNavigate();
  const API_BASE_URL = 'https://major-backend-r7lx.onrender.com'; // Or import from a config file
  
  const navigate = useNavigate(); // Initialize navigate

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
          navigate('/chat'); // Redirect to chat page if authenticated
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

  const switchToSignup = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);


  return (
    <div className="bg-gradient-to-b from-purple-600 to-purple-500 md:min-h-screen flex items-center justify-center px-4 md:py-10 py-4">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: Form Box */}
        <div >
          {isLogin ? (
            <LoginForm switchToSignup={switchToSignup} />
          ) : (
            <SignupForm switchToLogin={switchToLogin} />
          )}
        </div>

        {/* Right: Illustration Box */}
        <div className={`hidden lg:flex flex-col items-center bg-gradient-to-r from-purple-700 to-purple-800 p-8 rounded-2xl relative shadow-2xl transition duration-300  ${isLogin?"h-[540px]":"h-[620px]"}`}>
          {/* Background Blur Shadow */}
          <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-30"></div>
          <img
            src={illustration}
            alt="Illustration"
            className="w-3/4 max-w-sm mb-6 rounded-lg"
          />
          <h3 className="text-xl font-bold text-white text-center">
            Join MindCare Today!
          </h3>
          <p className="text-gray-200 text-center mt-2">
            Explore personalized tools and strategies to enhance your mental
            well-being. Sign up or log in to get started.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;
