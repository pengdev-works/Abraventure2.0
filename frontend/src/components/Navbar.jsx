import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, Menu, X, LogOut, User, Calendar, MapPin, Building, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'PROVINCIAL_DOT':
        return '/provincial-dashboard';
      case 'MUNICIPAL_DOT':
        return '/municipal-dashboard';
      case 'HOMESTAY_OWNER':
        return '/owner-dashboard';
      case 'TOUR_GUIDE':
        return '/guide-dashboard';
      default:
        return '/';
    }
  };

  return (
    <nav className="sticky top-0 z-50 glassmorphism bg-white/80 border-b border-slate-200/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-emerald-900 font-extrabold text-xl tracking-wider">
              <Compass className="w-8 h-8 text-amber-500 animate-pulse" />
              <span>ABRAVENTURE</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-slate-700 hover:text-emerald-900 font-semibold transition-colors">Home</Link>
            <Link to="/municipalities" className="text-slate-700 hover:text-emerald-900 font-semibold transition-colors flex items-center gap-1">
              <MapPin className="w-4 h-4 text-emerald-900" /> Municipalities
            </Link>
            <Link to="/itinerary" className="text-slate-700 hover:text-emerald-900 font-semibold transition-colors flex items-center gap-1">
              <Calendar className="w-4 h-4 text-emerald-900" /> Itinerary Planner
            </Link>

            {user ? (
              <div className="flex items-center space-x-4 border-l border-slate-200 pl-6">
                <Link
                  to={getDashboardLink()}
                  className="flex items-center gap-1 px-4 py-2 rounded-full bg-emerald-900 text-white font-semibold text-sm hover:bg-emerald-800 hover:shadow-lg transition-all"
                >
                  <User className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <div className="text-right hidden lg:block">
                  <p className="text-xs text-slate-500 font-medium">{user.role.replace('_', ' ')}</p>
                  <p className="text-sm font-semibold text-slate-800 max-w-[120px] truncate">{user.fullName}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 border-l border-slate-200 pl-6">
                <Link to="/login" className="text-slate-700 hover:text-emerald-900 font-semibold transition-colors text-sm">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-full bg-amber-500 text-white hover:bg-amber-600 font-bold text-sm hover:shadow-lg transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:text-emerald-900 hover:bg-slate-100 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white/95 border-b border-slate-200 animate-fadeIn">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
            >
              Home
            </Link>
            <Link
              to="/municipalities"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
            >
              Municipalities
            </Link>
            <Link
              to="/itinerary"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
            >
              Itinerary Planner
            </Link>

            {user ? (
              <div className="pt-4 pb-2 border-t border-slate-200 mt-2">
                <div className="flex items-center px-3 mb-3">
                  <div className="bg-emerald-100 p-2 rounded-full text-emerald-900 mr-3">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-slate-800">{user.fullName}</div>
                    <div className="text-sm font-medium text-slate-500">{user.email}</div>
                  </div>
                </div>
                <Link
                  to={getDashboardLink()}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium bg-emerald-900 text-white hover:bg-emerald-800"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 mt-1"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-200 mt-2 flex flex-col gap-2 px-3 pb-3">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-center px-4 py-2 border border-slate-300 rounded-full text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="text-center px-4 py-2 bg-amber-500 text-white rounded-full font-bold hover:bg-amber-600"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
