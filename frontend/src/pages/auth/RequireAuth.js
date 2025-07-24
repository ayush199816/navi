import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * RequireAuth - Protects routes based on authentication and allowed roles.
 * @param {ReactNode} children - The component(s) to render if access is granted.
 * @param {Array<string>} allowedRoles - List of allowed user roles (optional).
 */
const RequireAuth = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    // Not logged in; redirect to login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // User does not have permission
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RequireAuth;
