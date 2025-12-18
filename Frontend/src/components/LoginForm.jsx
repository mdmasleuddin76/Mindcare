// src/components/LoginForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://major-backend-r7lx.onrender.com'; // Or import from a config file


// Receive onLoginSuccess prop
function LoginForm({ switchToSignup}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // State for handling login errors
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // <<< IMPORTANT: Include credentials
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Call the handler passed from App.jsx to update global state
        // onLoginSuccess(data.user);
        navigate('/chat'); // Navigate to chat page on successful login
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login request error:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-700 to-purple-800 p-8 md:p-10 rounded-2xl shadow-lg hover:shadow-2xl transition duration-300 w-full max-w-md h-[540px]">
      <h2 className="text-3xl font-extrabold text-white mb-6 text-center">
        Welcome Back
      </h2>
      <p className="text-gray-300 text-center mb-8">
        Log in to your account and take the first step towards a healthier you.
      </p>
      {error && <p className="text-red-400 text-center mb-4">{error}</p>} {/* Display error */}
      <form onSubmit={handleSubmit}>
        {/* Email Field */}
        <div className="relative mb-6">
          <label className="block text-gray-200 font-medium mb-2">
            Email Address
            <span className=" text-red-600 text-[20px] px-[1px] ml-[1px]">*</span>
          </label>
          <input
            type="email"
            className="border text-white font-semibold border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
            disabled={isLoading}
          />
        </div>

        {/* Password Field */}
        <div className="relative mb-6">
          <label className="block text-gray-200 font-medium mb-2">
            Password
            <span className=" text-red-600 text-[20px] px-[1px] ml-[1px]">*</span>
          </label>
          <input
            type="password"
            className="border text-white font-semibold border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            required
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-yellow-400 hover:bg-yellow-500 text-purple-900 font-bold w-full py-3 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Logging In...' : 'Log In'}
        </button>
      </form>

      {/* Signup Link */}
      <p className="mt-6 text-gray-300 text-center">
        Don’t have an account?{' '}
        <button
          onClick={switchToSignup}
          className="text-yellow-400 font-semibold hover:underline"
          disabled={isLoading}
        >
          Sign Up
        </button>
      </p>
    </div>
  );
}

export default LoginForm;