// src/components/SignupForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://major-backend-r7lx.onrender.com'; // Or import from a config file


// Receive onLoginSuccess prop
function SignupForm({ switchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Include name in the body
        body: JSON.stringify({ name, email,phone,confirmPassword }),
        credentials: 'include', // <<< IMPORTANT: Include credentials
      });

      const data = await response.json();

      if (response.ok && data.success) {
         // Call the handler passed from App.jsx to update global state
        // onLoginSuccess(data.user);
        navigate('/chat'); // Navigate after successful signup
      } else {
        setError(data.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error('Signup request error:', err);
      setError('An error occurred during signup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-700 to-purple-800 p-6 md:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition duration-300 w-full max-w-md h-[620px]">
      <h2 className="text-2xl font-extrabold text-white mb-4 text-center">
        Create an Account
      </h2>
      <p className="text-gray-300 text-center mb-6">
        Sign up today and start your journey towards better mental health.
      </p>
      {error && <p className="text-red-400 text-center mb-4">{error}</p>} {/* Display error */}
      <form onSubmit={handleSubmit}>
        {/* Full Name */}
        <div className="relative mb-4">
          <label className="block text-gray-200 font-medium mb-1">
            Full Name
            <span className="text-red-600 text-sm ml-1">*</span>
          </label>
          <input
            type="text"
            className="border text-white font-semibold border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
            disabled={isLoading}
          />
        </div>

        {/* Email */}
        <div className="relative mb-4">
          <label className="block text-gray-200 font-medium mb-1">
            Email Address
            <span className="text-red-600 text-sm ml-1">*</span>
          </label>
          <input
            type="email"
            className="border text-white font-semibold border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
            disabled={isLoading}
          />
        </div>

        {/* Phone No */}
        <div className="relative mb-4">
          <label className="block text-gray-200 font-medium mb-1">
            Phone Number
            <span className="text-red-600 text-sm ml-1">*</span>
          </label>
          <input
            type="text"
            className="border text-white font-semibold border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            required
            disabled={isLoading}
          />
        </div>


        {/* Confirm Password */}
        <div className="relative mb-6">
          <label className="block text-gray-200 font-medium mb-1">
            Password
            <span className="text-red-600 text-sm ml-1">*</span>
          </label>
          <input
            type="password"
            className="border text-white font-semibold border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••"
            required
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-yellow-400 hover:bg-yellow-500 text-purple-900 font-bold w-full py-2 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>

      {/* Login Link */}
      <p className="mt-6 text-gray-300 text-center">
        Already have an account?{' '}
        <button
          onClick={switchToLogin}
          className="text-yellow-400 font-semibold hover:underline"
          disabled={isLoading}
        >
          Log In
        </button>
      </p>
    </div>
  );
}

export default SignupForm;