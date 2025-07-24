import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Component to protect routes that require authentication
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {Array} props.allowedRoles - Array of roles allowed to access the route
 */
const RequireAuth = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useSelector(state => state.auth);
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Check if user has required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-700">You don't have permission to access this page.</p>
        <button 
          onClick={() => window.history.back()} 
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  // User is authenticated and has required role, render children
  return children;
};

export default RequireAuth;
