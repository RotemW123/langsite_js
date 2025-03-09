import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from './utils/api';

function App() {
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: "guest@mail", 
          password: "guest123" 
        }),
      });

      const data = await response.json();

      if (response.ok && data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id);
        window.location.href = "/language-selection";
      } else {
        setError(data.message || "Guest login failed");
        console.error("Guest login failed:", data.message);
      }
    } catch (err) {
      console.error("Guest login error:", err);
      setError("Error during guest login. Please try again.");
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-8">
            Welcome to LangSite
          </h1>
          <p className="text-xl mb-12 opacity-90">
            Your personal language learning companion
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/signup"
              className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-opacity-90 transition-all duration-200 transform hover:-translate-y-1"
            >
              Get Started
            </Link>
            <Link 
              to="/signin"
              className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-all duration-200 transform hover:-translate-y-1"
            >
              Sign In
            </Link>
            <button 
              onClick={handleGuestLogin}
              disabled={isGuestLoading}
              className="px-8 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-all duration-200 transform hover:-translate-y-1 disabled:opacity-70"
            >
              {isGuestLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading...
                </span>
              ) : (
                "Enter as Guest"
              )}
            </button>
          </div>
          
          {error && (
            <div className="mt-6 p-3 bg-red-500 bg-opacity-20 border border-red-300 rounded-lg text-white">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;