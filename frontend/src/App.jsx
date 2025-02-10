import React from 'react';
import { Link } from 'react-router-dom';

function App() {
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;