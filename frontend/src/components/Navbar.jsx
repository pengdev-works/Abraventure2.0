import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, Menu, X, LogOut, User, Calendar, MapPin, ChevronDown } from 'lucide-react';

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
      case 'PROVINCIAL_DOT':  return '/provincial-dashboard';
      case 'MUNICIPAL_DOT':   return '/municipal-dashboard';
      case 'HOMESTAY_OWNER':  return '/owner-dashboard';
      case 'TOUR_GUIDE':      return '/guide-dashboard';
      default:                return '/';
    }
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'PROVINCIAL_DOT': return 'bg-indigo-100 text-indigo-800';
      case 'MUNICIPAL_DOT':  return 'bg-emerald-100 text-emerald-800';
      case 'HOMESTAY_OWNER': return 'bg-amber-100 text-amber-800';
      case 'TOUR_GUIDE':     return 'bg-sky-100 text-sky-800';
      default:               return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <nav className="sticky top-0 z-50">
      {/* Itneg Gold Accent Bar */}
      <div className="h-0.5 bg-gradient-to-r from-emerald-900 via-amber-500 to-emerald-900" />

      {/* Main navbar */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
                <Compass className="w-8 h-8 text-amber-500 relative z-10 group-hover:rotate-45 transition-transform duration-500" />
              </div>
              <div className="flex items-baseline gap-0">
                <span className="font-extrabold text-lg tracking-wider text-amber-500">ABRA</span>
                <span className="font-extrabold text-lg tracking-wider text-emerald-900">VENTURE</span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className="px-4 py-2 rounded-lg text-slate-700 hover:text-emerald-900 hover:bg-emerald-50 font-semibold text-sm transition-all"
              >
                Home
              </Link>
              <Link
                to="/municipalities"
                className="px-4 py-2 rounded-lg text-slate-700 hover:text-emerald-900 hover:bg-emerald-50 font-semibold text-sm transition-all flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                Municipalities
              </Link>
              <Link
                to="/itinerary"
                className="px-4 py-2 rounded-lg text-slate-700 hover:text-emerald-900 hover:bg-emerald-50 font-semibold text-sm transition-all flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                Itinerary
              </Link>
            </div>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-slate-800 leading-tight max-w-[120px] truncate">{user.fullName}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${getRoleBadgeColor()}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                    <Link
                      to={getDashboardLink()}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-full shadow-md hover:shadow-lg transition-all"
                    >
                      <User className="w-3.5 h-3.5" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                      title="Logout"
                    >
                      <LogOut className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-full text-slate-700 hover:text-emerald-900 font-semibold text-sm transition-all border border-transparent hover:border-slate-200 hover:bg-slate-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-emerald-950 font-bold text-sm shadow-md hover:shadow-amber-300/40 hover:scale-105 transition-all"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-emerald-900 hover:bg-emerald-50 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-lg animate-fadeSlideDown">
          <div className="px-4 pt-3 pb-5 space-y-1">
            <Link to="/" onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 font-semibold text-sm transition-all">
              Home
            </Link>
            <Link to="/municipalities" onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 font-semibold text-sm transition-all">
              <MapPin className="w-4 h-4 text-amber-500" /> Municipalities
            </Link>
            <Link to="/itinerary" onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 font-semibold text-sm transition-all">
              <Calendar className="w-4 h-4 text-amber-500" /> Itinerary Planner
            </Link>

            <div className="mt-3 pt-3 border-t border-slate-100">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 mb-3 bg-emerald-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-emerald-900 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm leading-tight">{user.fullName}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${getRoleBadgeColor()}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <Link to={getDashboardLink()} onClick={() => setIsOpen(false)}
                    className="block w-full text-center px-4 py-2.5 bg-emerald-900 text-white font-bold rounded-xl text-sm mb-2">
                    Dashboard
                  </Link>
                  <button onClick={handleLogout}
                    className="block w-full text-center px-4 py-2.5 text-red-600 hover:bg-red-50 font-semibold rounded-xl text-sm transition-all">
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/login" onClick={() => setIsOpen(false)}
                    className="text-center px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all">
                    Sign In
                  </Link>
                  <Link to="/register" onClick={() => setIsOpen(false)}
                    className="text-center px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-emerald-950 font-bold rounded-xl text-sm shadow-md">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
