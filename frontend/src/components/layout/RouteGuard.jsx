import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RouteGuard = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Auth is always resolved before the LoadingScreen dismisses (App.jsx waits for both),
  // so loading should never be true here — but guard against it just in case with null.
  if (loading) return null;

  if (!user) {
    const isOfficialRole = allowedRoles && allowedRoles.some(r => ['PROVINCIAL_DOT', 'MUNICIPAL_DOT', 'HOMESTAY_OWNER', 'TOUR_GUIDE'].includes(r));
    return <Navigate to={isOfficialRole ? "/portal/login" : "/login"} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RouteGuard;
