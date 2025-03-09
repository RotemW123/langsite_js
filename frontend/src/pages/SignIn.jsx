import React, { useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../utils/api";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id);
        setMessage("Login successful!");
        window.location.href = "/language-selection";
      } else {
        setError(data.message || "Login failed");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Error during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="text-indigo-600 hover:text-indigo-500 font-medium">
              Sign up
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="Enter your password"
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
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
          >
            {isLoading ? "Signing in..." : "Sign In"}
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
};

export default SignIn;