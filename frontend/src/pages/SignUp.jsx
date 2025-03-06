import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../utils/api';

function SignUp() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      // Log the data being sent

      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        username,
        email,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setMessage(response.data.message);

      // Wait a bit before redirecting
      setTimeout(() => {
        navigate('/signin');
      }, 2000);
      
    } catch (err) {
      console.error('Signup error:', err.response?.data || err);
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-gray-600">
            Already have an account?{" "}
            <Link to="/signin" className="text-indigo-600 hover:text-indigo-500 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Choose a username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Create a password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 text-green-500 p-3 rounded-lg">
              {message} Redirecting to sign in...
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>

          <div className="text-center">
            <Link to="/" className="text-indigo-600 hover:text-indigo-500 text-sm">
              ← Back to home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignUp;