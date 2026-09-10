import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RouteGuard = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#E3ECE4] dark:bg-[#0D1C15]">
        <div className="w-10 h-10 border-4 border-[#153325] border-t-[#B88B2A] rounded-full animate-spin"></div>
      </div>
    );
  }

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
