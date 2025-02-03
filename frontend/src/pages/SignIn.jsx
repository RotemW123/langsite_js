import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🟢 handleSubmit triggered for SignIn");
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Response:", response);
      console.log("Data:", data);

      if (response.ok && data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id);
        
        console.log("Token and userId stored successfully");
        setMessage("Login successful!");
        
        setTimeout(() => {
          navigate("/home");
        }, 100);
      } else {
        setError(data.message || "Login failed - Missing token or user data");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Error during login. Please try again.");
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="auth-form-container">
        <h2>Welcome Back</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
          <button 
            type="submit" 
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default SignIn;