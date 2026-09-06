import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Menu, X, LogOut, User, Bell, CheckCheck, Trash2,
  Calendar, AlertCircle, Star, FileText, ChevronRight, Inbox
} from 'lucide-react';
import DarkModeToggle from '../common/DarkModeToggle';

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

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

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getNotificationIcon = (n) => {
    const type = (n.type || '').toUpperCase();
    const title = (n.title || '').toLowerCase();
    const msg = (n.message || '').toLowerCase();

    if (type === 'BOOKING' || title.includes('booking') || title.includes('inquiry') || msg.includes('booking')) {
      return {
        icon: Calendar,
        bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
      };
    }
    if (type === 'COMPLAINT' || title.includes('complaint') || msg.includes('complaint')) {
      return {
        icon: AlertCircle,
        bg: 'bg-rose-500/10 text-rose-700 border-rose-500/20'
      };
    }
    if (type === 'REVIEW' || title.includes('review') || msg.includes('review')) {
      return {
        icon: Star,
        bg: 'bg-amber-500/10 text-[#B88B2A] border-amber-500/20'
      };
    }
    if (type === 'ACCREDITATION' || type === 'DOCUMENT' || title.includes('document') || title.includes('accreditation')) {
      return {
        icon: FileText,
        bg: 'bg-sky-500/10 text-sky-700 border-sky-500/20'
      };
    }
    return {
      icon: Bell,
      bg: 'bg-[#153325]/10 text-[#153325] border-[#153325]/20'
    };
  };

  const getNotificationLink = (n) => {
    if (n.link) return n.link;
    const type = (n.type || '').toUpperCase();
    const title = (n.title || '').toLowerCase();
    const msg = (n.message || '').toLowerCase();
    const role = user?.role;

    // Booking or inquiry
    if (type === 'BOOKING' || title.includes('booking') || title.includes('inquiry') || msg.includes('inquiry') || msg.includes('booking')) {
      if (role === 'HOMESTAY_OWNER') return '/owner-dashboard?tab=inquiries';
      if (role === 'TOUR_GUIDE') return '/guide-dashboard?tab=inquiries';
      if (role === 'TOURIST') return '/tourist-dashboard?tab=bookings';
      if (role === 'MUNICIPAL_DOT') return '/municipal-dashboard?tab=inquiries';
      if (role === 'PROVINCIAL_DOT') return '/provincial-dashboard?tab=listings';
    }

    // Complaints / Grievances
    if (type === 'COMPLAINT' || title.includes('complaint') || msg.includes('complaint')) {
      if (role === 'MUNICIPAL_DOT') return '/municipal-dashboard?tab=complaints';
      if (role === 'PROVINCIAL_DOT') return '/provincial-dashboard?tab=complaints';
      if (role === 'TOURIST') return '/tourist-dashboard?tab=complaints';
    }

    // Reviews
    if (type === 'REVIEW' || title.includes('review') || msg.includes('review')) {
      if (role === 'HOMESTAY_OWNER') return '/owner-dashboard?tab=reviews';
      if (role === 'TOUR_GUIDE') return '/guide-dashboard?tab=reviews';
      if (role === 'TOURIST') return '/tourist-dashboard?tab=bookings';
    }

    // Accreditation / Documents
    if (type === 'ACCREDITATION' || type === 'DOCUMENT' || title.includes('accreditation') || title.includes('document') || title.includes('requirement')) {
      if (role === 'HOMESTAY_OWNER') return '/owner-dashboard?tab=documents';
      if (role === 'TOUR_GUIDE') return '/guide-dashboard?tab=documents';
      if (role === 'MUNICIPAL_DOT') return '/municipal-dashboard?tab=review';
      if (role === 'PROVINCIAL_DOT') return '/provincial-dashboard?tab=listings';
    }

    // Announcements
    if (type === 'ANNOUNCEMENT' || title.includes('announcement')) {
      if (role === 'PROVINCIAL_DOT') return '/provincial-dashboard?tab=announcements';
      return '/events';
    }

    // Fallback to user's dashboard link
    return getDashboardLink();
  };

  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      await handleMarkRead(n.id);
    }
    setShowNotifications(false);
    const targetLink = getNotificationLink(n);
    if (targetLink) {
      navigate(targetLink);
    }
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
      case 'PROVINCIAL_DOT': return 'bg-[#153325]/10 text-[#153325] border border-[#153325]/20';
      case 'MUNICIPAL_DOT':  return 'bg-[#2D5D46]/10 text-[#2D5D46] border border-[#2D5D46]/20';
      case 'HOMESTAY_OWNER': return 'bg-[#B88B2A]/10 text-[#946E1D] border border-[#B88B2A]/20';
      case 'TOUR_GUIDE':     return 'bg-[#355C6D]/10 text-[#355C6D] border border-[#355C6D]/20';
      default:               return 'bg-[#E8DFC8] text-[#383431]';
    }
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClasses = (path) => `
    px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all
    border-b-2 ${isActive(path)
      ? 'text-[#153325] border-[#B88B2A] font-bold'
      : 'text-[#5A534E] border-transparent hover:text-[#153325] hover:border-[#153325]/30'
    }
  `;

  return (
    <nav className="sticky top-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFC8] transition-all">
      {/* Official Government Header Topline */}
      <div className="bg-[#153325] text-[#FAF7F2] text-[10px] sm:text-[11px] py-1 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-medium tracking-wider uppercase opacity-90 truncate text-[10px] sm:text-[11px]">
            Provincial Tourism Office · Province of Abra, Philippines
          </span>
          <div className="hidden sm:flex items-center gap-4 text-[11px] opacity-80 flex-shrink-0">
            <span>27 Municipalities</span>
            <span>•</span>
            <span>DOT Accredited Platform</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">

          {/* Editorial Brand & Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group text-left flex-shrink-0">
            <img
              src="/abraventure-logo.png"
              alt="Abraventure Official Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 object-contain filter drop-shadow-xs group-hover:scale-105 transition-transform flex-shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="flex flex-col">
              <span className="font-serif text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-[#153325] group-hover:text-[#B88B2A] transition-colors leading-none">
                ABRAVENTURE
              </span>
              <span className="text-[8px] sm:text-[9px] font-sans font-bold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-[#5A534E] mt-0.5 sm:mt-1">
                Province of Abra · Cordillera
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links (Clean Typography, No Icon Clutter) */}
          <div className="hidden lg:flex items-center gap-1">
            <Link to="/" className={navLinkClasses('/')}>Explore</Link>
            <Link to="/municipalities" className={navLinkClasses('/municipalities')}>Destinations</Link>
            <Link to="/map" className={navLinkClasses('/map')}>Interactive Map</Link>
            <Link to="/itinerary" className={navLinkClasses('/itinerary')}>Plan Itinerary</Link>
            <Link to="/events" className={navLinkClasses('/events')}>Events</Link>
            <Link to="/travel-tips" className={navLinkClasses('/travel-tips')}>Travel Guide</Link>
          </div>

          {/* Desktop Auth & Actions */}
          {/* Action Strip: Notifications, Auth & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Quick Auth Links (if not logged in) */}
            {!user && (
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-[#153325] hover:text-[#B88B2A] transition-colors px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/portal/login"
                  className="btn-editorial-outline text-xs !py-1.5 !px-3.5"
                >
                  Official Portal
                </Link>
                <Link
                  to="/register"
                  className="btn-editorial-gold text-xs !py-1.5 !px-3.5 shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Notification Bell (for all logged in users, desktop & mobile) */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl text-[#5A534E] hover:text-[#153325] hover:bg-[#F3ECE0] transition-colors relative cursor-pointer"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B88B2A] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#B88B2A] ring-2 ring-[#FAF7F2]"></span>
                    </span>
                  )}
                </button>

                {/* Rich Notification Dropdown */}
                {showNotifications && (
                  <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-14 sm:top-full mt-2 w-auto sm:w-96 max-w-sm mx-auto sm:mx-0 bg-white border border-[#E8DFC8] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3.5 bg-[#FAF7F2] border-b border-[#E8DFC8]">
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif font-bold text-sm text-[#153325]">Notifications</h4>
                        {unreadCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B88B2A]/15 text-[#946E1D] border border-[#B88B2A]/30">
                            {unreadCount} new
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/5 text-[#5A534E]">
                            All read
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-[#B88B2A] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-[#F3ECE0]">
                      {notifications.length === 0 ? (
                        <div className="py-10 px-4 text-center">
                          <Inbox className="w-8 h-8 text-[#5A534E]/40 mx-auto mb-2" />
                          <p className="font-serif font-bold text-xs text-[#153325]">You're all caught up</p>
                          <p className="text-[11px] text-[#5A534E] mt-0.5">No notifications at this time</p>
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const iconData = getNotificationIcon(n);
                          const IconComp = iconData.icon;
                          return (
                            <div
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`p-3.5 flex items-start gap-3 text-left hover:bg-[#FAF7F2] transition-colors cursor-pointer group relative ${
                                !n.is_read ? 'bg-[#FAF7F2]/90 border-l-4 border-[#B88B2A]' : 'opacity-90 hover:opacity-100'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${iconData.bg}`}>
                                <IconComp className="w-4 h-4" />
                              </div>

                              <div className="flex-1 min-w-0 pr-6">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <p className={`text-xs truncate ${!n.is_read ? 'font-bold text-[#153325]' : 'font-medium text-[#232120]'}`}>
                                    {n.title}
                                  </p>
                                  {!n.is_read && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#B88B2A] flex-shrink-0 animate-pulse" />
                                  )}
                                </div>
                                <p className="text-[11px] text-[#5A534E] line-clamp-2 leading-relaxed">
                                  {n.message}
                                </p>
                                <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#5A534E]/80">
                                  <span className="font-mono">{formatTimeAgo(n.created_at)}</span>
                                  <span className="text-[#B88B2A] font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                    Open <ChevronRight className="w-3 h-3" />
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={(e) => handleDeleteNotif(n.id, e)}
                                className="absolute top-3 right-3 p-1 text-[#5A534E]/40 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                                title="Delete notification"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Desktop Dashboard Link (when logged in) */}
            {user && (
              <div className="hidden lg:flex items-center gap-2.5 pl-2 border-l border-[#E8DFC8]">
                <div className="text-right hidden xl:block">
                  <p className="text-xs font-semibold text-[#153325] leading-tight max-w-[130px] truncate">
                    {user.fullName}
                  </p>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${getRoleBadgeColor()}`}>
                    {user.role.replace(/_/g, ' ')}
                  </span>
                </div>

                <Link
                  to={getDashboardLink()}
                  className="btn-editorial-primary text-xs !py-2 !px-3.5 flex items-center gap-1.5 shadow-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-[#5A534E] hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Log Out"
                  aria-label="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            <DarkModeToggle />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 text-[#153325] hover:bg-[#F3ECE0] rounded-xl transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Backdrop Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 top-[76px] sm:top-[88px] bg-black/40 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden relative z-50 bg-[#FAF7F2] border-b border-[#E8DFC8] px-4 pt-3 pb-6 space-y-1 shadow-xl animate-fadeIn max-h-[calc(100dvh-5rem)] overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className={`block px-4 py-3 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors touch-target flex items-center ${
              isActive('/') ? 'bg-[#153325] text-white font-bold' : 'text-[#153325] hover:bg-[#F3ECE0]'
            }`}
          >
            Explore
          </Link>
          <Link
            to="/municipalities"
            onClick={() => setIsOpen(false)}
            className={`block px-4 py-3 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors touch-target flex items-center ${
              isActive('/municipalities') ? 'bg-[#153325] text-white font-bold' : 'text-[#153325] hover:bg-[#F3ECE0]'
            }`}
          >
            Destinations (27 Municipalities)
          </Link>
          <Link
            to="/map"
            onClick={() => setIsOpen(false)}
            className={`block px-4 py-3 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors touch-target flex items-center ${
              isActive('/map') ? 'bg-[#153325] text-white font-bold' : 'text-[#153325] hover:bg-[#F3ECE0]'
            }`}
          >
            Interactive Map
          </Link>
          <Link
            to="/itinerary"
            onClick={() => setIsOpen(false)}
            className={`block px-4 py-3 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors touch-target flex items-center ${
              isActive('/itinerary') ? 'bg-[#153325] text-white font-bold' : 'text-[#153325] hover:bg-[#F3ECE0]'
            }`}
          >
            Plan Itinerary
          </Link>
          <Link
            to="/events"
            onClick={() => setIsOpen(false)}
            className={`block px-4 py-3 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors touch-target flex items-center ${
              isActive('/events') ? 'bg-[#153325] text-white font-bold' : 'text-[#153325] hover:bg-[#F3ECE0]'
            }`}
          >
            Events & Festivals
          </Link>
          <Link
            to="/travel-tips"
            onClick={() => setIsOpen(false)}
            className={`block px-4 py-3 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors touch-target flex items-center ${
              isActive('/travel-tips') ? 'bg-[#153325] text-white font-bold' : 'text-[#153325] hover:bg-[#F3ECE0]'
            }`}
          >
            Travel Guide
          </Link>

          <div className="pt-4 border-t border-[#E8DFC8] space-y-2">
            {user ? (
              <>
                <div className="p-3 bg-[#F3ECE0] rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#153325]">{user.fullName}</p>
                    <p className="text-[10px] text-[#5A534E] uppercase font-semibold">{user.role.replace(/_/g, ' ')}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-semibold text-rose-700 hover:underline cursor-pointer p-2"
                  >
                    Sign Out
                  </button>
                </div>
                <Link
                  to={getDashboardLink()}
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center btn-editorial-primary text-xs !py-3 rounded-xl shadow-xs touch-target"
                >
                  My Dashboard
                </Link>
              </>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="text-center btn-editorial-outline text-xs !py-3 rounded-xl touch-target flex items-center justify-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/portal/login"
                    onClick={() => setIsOpen(false)}
                    className="text-center btn-editorial-outline text-xs !py-3 rounded-xl border-[#153325] text-[#153325] touch-target flex items-center justify-center"
                  >
                    Official Portal
                  </Link>
                </div>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center btn-editorial-gold text-xs !py-3 font-bold rounded-xl shadow-xs touch-target flex items-center justify-center"
                >
                  Register Account
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
