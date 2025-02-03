import React from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import './index.css'

function App() {
  return (
    <div className="App">
      <div className="welcome-section">
        <h1>Welcome to LangSite</h1>
        <p>Your personal language learning companion</p>
      </div>
      <div className="auth-buttons">
        <Link to="/signup">
          <button className="primary-button">Sign Up</button>
        </Link>
        <Link to="/signin">
          <button className="secondary-button">Sign In</button>
        </Link>
      </div>
    </div>
  );
}

export default App;