import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No token found');
        }

        const response = await fetch(`${API_URL}/api/auth/verify`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Get the JSON data from the response
        const data = await response.json();
        console.log('Verification response:', data);

        if (isMounted) {
          if (data.valid) {
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
    // Clear any potentially stale auth data
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;