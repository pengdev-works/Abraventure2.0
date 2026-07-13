import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, Menu, X, LogOut, User, Calendar, MapPin, Bell, Info, CheckCheck, Trash2, Map } from 'lucide-react';

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch notifications + unread count
  useEffect(() => {
    if (!token || !user) { setUnreadCount(0); setNotifications([]); return; }
    const fetchNotifications = async () => {
      try {
        const [notifRes, countRes] = await Promise.all([
          fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/notifications/unread-count', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (notifRes.ok) setNotifications(await notifRes.json());
        if (countRes.ok) { const d = await countRes.json(); setUnreadCount(d.count); }
      } catch (err) { /* silent */ }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [token, user]);

  const handleMarkAllRead = async () => {
    if (!token) return;
    await fetch('/api/notifications/read-all', { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleDeleteNotif = async (id, e) => {
    e.stopPropagation();
    await fetch(`/api/notifications/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkRead = async (id) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

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
      case 'TOURIST':         return '/tourist-dashboard';
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

  const navLink = 'px-3 py-2 rounded-lg text-slate-700 hover:text-emerald-900 hover:bg-emerald-50 font-semibold text-sm transition-all flex items-center gap-1.5';

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
              <Link to="/" className={navLink}>Home</Link>
              <Link to="/municipalities" className={navLink}>
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                Explore
              </Link>
              <Link to="/map" className={navLink}>
                <Map className="w-3.5 h-3.5 text-amber-500" />
                Interactive Map
              </Link>
              <Link to="/events" className={navLink}>
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                Events
              </Link>
              <Link to="/travel-tips" className={navLink}>
                <Info className="w-3.5 h-3.5 text-amber-500" />
                Travel Tips
              </Link>
              {user?.role === 'TOURIST' && (
                <Link to="/itinerary" className={navLink}>
                  <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  Itinerary
                </Link>
              )}
            </div>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  {/* Notification Bell */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-emerald-900 transition-all"
                      title="Notifications"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center px-1 animate-bounce">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {showNotifications && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                          <h4 className="font-extrabold text-slate-800 text-sm">Notifications</h4>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="flex items-center gap-1 text-xs text-emerald-700 font-semibold hover:text-emerald-900"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              Mark all read
                            </button>
                          )}
                        </div>
                        {/* List */}
                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                          {notifications.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 text-xs">
                              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                              No notifications yet
                            </div>
                          ) : notifications.map(n => (
                            <div
                              key={n.id}
                              onClick={() => handleMarkRead(n.id)}
                              className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors relative ${!n.is_read ? 'bg-emerald-50/50' : ''}`}
                            >
                              {!n.is_read && (
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              )}
                              <p className={`text-xs font-bold pl-3 ${n.is_read ? 'text-slate-600' : 'text-slate-800'}`}>{n.title}</p>
                              <p className="text-xs text-slate-500 pl-3 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                              <div className="flex items-center justify-between pl-3 mt-1">
                                <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                <button onClick={(e) => handleDeleteNotif(n.id, e)} className="text-slate-300 hover:text-red-400 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-slate-800 leading-tight max-w-[120px] truncate">{user.fullName}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${getRoleBadgeColor()}`}>
                        {user.role.replace(/_/g, ' ')}
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
                      <LogOut className="w-4 h-4" />
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
            <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 font-semibold text-sm transition-all">Home</Link>
            <Link to="/municipalities" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 font-semibold text-sm transition-all">
              <MapPin className="w-4 h-4 text-amber-500" /> Explore Municipalities
            </Link>
            <Link to="/map" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 font-semibold text-sm transition-all">
              <Map className="w-4 h-4 text-amber-500" /> Interactive Map
            </Link>
            <Link to="/events" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 font-semibold text-sm transition-all">
              <Calendar className="w-4 h-4 text-amber-500" /> Events & Festivals
            </Link>
            <Link to="/travel-tips" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 font-semibold text-sm transition-all">
              <Info className="w-4 h-4 text-amber-500" /> Travel Tips
            </Link>
            {user?.role === 'TOURIST' && (
              <Link to="/itinerary" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 font-semibold text-sm transition-all">
                <Calendar className="w-4 h-4 text-purple-500" /> Itinerary Planner
              </Link>
            )}
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
                        {user.role.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5">{unreadCount} notif</span>
                    )}
                  </div>
                  <Link to={getDashboardLink()} onClick={() => setIsOpen(false)} className="block w-full text-center px-4 py-2.5 bg-emerald-900 text-white font-bold rounded-xl text-sm mb-2">Dashboard</Link>
                  <button onClick={handleLogout} className="block w-full text-center px-4 py-2.5 text-red-600 hover:bg-red-50 font-semibold rounded-xl text-sm transition-all">Logout</button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/login" onClick={() => setIsOpen(false)} className="text-center px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all">Sign In</Link>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="text-center px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-emerald-950 font-bold rounded-xl text-sm shadow-md">Register</Link>
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
