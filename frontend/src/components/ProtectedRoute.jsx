import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Verifying token:', token ? 'Token exists' : 'No token');
        
        if (!token) {
          throw new Error('No token found');
        }

        const response = await axios.get('http://localhost:5000/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('Verification response:', response.data);

        if (isMounted) {
          if (response.data.valid) {
            setIsAuthenticated(true);
          } else {
            throw new Error('Token invalid');
          }
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        if (isMounted) {
          // Clear auth data on any error
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]); // Re-verify on route change

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Verifying authentication...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to signin');
    // Clear any potentially stale auth data
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;