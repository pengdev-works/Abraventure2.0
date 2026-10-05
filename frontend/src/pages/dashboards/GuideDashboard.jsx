import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { useSocketEvent } from '../../context/SocketContext';
import {
  Award, FileText, User, Upload, CheckCircle,
  AlertTriangle, Calendar, Star, Menu, X, ArrowUpRight,
  ShieldCheck, Clock, Phone, Mail, MapPin, Sparkles,
  Check, Search, Filter, CalendarCheck, ChevronLeft, ChevronRight,
  Eye, DollarSign, Globe, Compass, HelpCircle, CheckCircle2,
  XCircle, UserCheck, RefreshCw, AlertCircle, FileCheck,
  CreditCard, Users, ExternalLink, MessageSquareOff
} from 'lucide-react';
import DarkModeToggle from '../../components/common/DarkModeToggle';
import DocumentViewerModal from '../../components/common/DocumentViewerModal';
import SafeImage, { formatMediaUrl } from '../../components/common/SafeImage';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const GuideDashboard = () => {
  const { token, user, logout } = useAuth();
  const { showAlert } = useAlert();
  const [searchParams, setSearchParams] = useSearchParams();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('guide_sidebar_collapsed') === 'true'; } catch { return false; }
  });
  const toggleSidebar = () => setSidebarCollapsed(prev => {
    const next = !prev;
    try { localStorage.setItem('guide_sidebar_collapsed', String(next)); } catch {}
    return next;
  });
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'overview');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && t !== activeTab) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    setMobileSidebarOpen(false);
  };

  // Main data state
  const [profile, setProfile] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [customAvailability, setCustomAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDocUrl, setSelectedDocUrl] = useState(null);

  // Profile Form state
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState('');
  const [services, setServices] = useState('');
  const [areas, setAreas] = useState('');
  const [priceRate, setPriceRate] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Booking management state
  const [bookingFilter, setBookingFilter] = useState('ALL');
  const [searchBookingQuery, setSearchBookingQuery] = useState('');
  const [selectedBookingForAction, setSelectedBookingForAction] = useState(null);
  const [actionModalType, setActionModalType] = useState(null); // 'CONFIRM' | 'RESPOND' | 'DECLINE' | 'DETAILS'
  const [actionRemarks, setActionRemarks] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Calendar State
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [togglingDate, setTogglingDate] = useState(null);

  // Fetch full guide dashboard dataset
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (!token || !user) return;
    if (isRefresh) setRefreshing(true);
    try {
      // 1. Fetch user & guide profile
      const userRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let fetchedProfile = null;
      if (userRes.ok) {
        const uData = await userRes.json();
        fetchedProfile = uData.profile;
        setProfile(uData.profile);
        if (uData.profile) {
          setBio(uData.profile.bio || '');
          setLanguages(uData.profile.languages_spoken || '');
          setServices(uData.profile.services_offered || '');
          setAreas(uData.profile.areas_covered || '');
          setPriceRate(uData.profile.price_rate != null ? String(uData.profile.price_rate) : '');
        }
      }

      // 2. Fetch accreditation requirements for guide's municipality
      if (user.municipalityId) {
        const reqRes = await fetch(`/api/requirements/municipality/${user.municipalityId}?targetType=TOUR_GUIDE`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setRequirements(Array.isArray(reqData) ? reqData : []);
        }
      }

      // 3. Fetch submissions
      const subRes = await fetch('/api/documents/my-submissions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubmissions(Array.isArray(subData) ? subData : []);
      }

      // 4. Fetch received bookings / inquiries
      const inqRes = await fetch('/api/inquiries', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (inqRes.ok) {
        const inqData = await inqRes.json();
        const list = Array.isArray(inqData) ? inqData : [];
        setInquiries(list);
      }

      // 5. Fetch reviews received
      const revRes = await fetch('/api/reviews/received', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (revRes.ok) {
        const revData = await revRes.json();
        setReceivedReviews(Array.isArray(revData) ? revData : []);
      }

      // 6. Fetch guide custom calendar availability if profile exists
      if (fetchedProfile?.id) {
        const availRes = await fetch(`/api/announcements/guide-availability?guideId=${fetchedProfile.id}`);
        if (availRes.ok) {
          const availData = await availRes.json();
          setCustomAvailability(Array.isArray(availData) ? availData : []);
        }
      }
    } catch (err) {
      console.error('Error fetching guide dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time live sync
  useSocketEvent('account:status_changed', () => fetchDashboardData());
  useSocketEvent('inquiry:new', () => fetchDashboardData());
  useSocketEvent('inquiry:updated', () => fetchDashboardData());
  useSocketEvent('review:new', () => fetchDashboardData());

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    const formData = new FormData();
    formData.append('bio', bio);
    formData.append('languagesSpoken', languages);
    formData.append('servicesOffered', services);
    formData.append('areasCovered', areas);
    formData.append('priceRate', priceRate ? parseFloat(priceRate) : 0);
    if (profilePic) {
      formData.append('profilePicture', profilePic);
    }

    try {
      const response = await fetch('/api/listings/guide', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        showAlert('Tour Guide credentials updated successfully.', 'success');
        setProfilePic(null);
        setProfilePicPreview(null);
        await fetchDashboardData();
      } else {
        const err = await response.json().catch(() => ({}));
        showAlert(err.message || 'Failed to update guide profile.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Network error while saving profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Accreditation Document File Upload
  const handleFileUpload = async (e, requirementId) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('requirementId', requirementId);
    formData.append('document', file);

    try {
      const response = await fetch('/api/documents/submit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        showAlert('Accreditation document uploaded for DOT evaluation.', 'success');
        await fetchDashboardData();
      } else {
        const err = await response.json().catch(() => ({}));
        showAlert(err.message || 'File upload failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Upload network error.', 'error');
    }
  };

  // Submit Booking Action (Confirm, Respond with Instructions, or Decline)
  const handleExecuteBookingAction = async () => {
    if (!selectedBookingForAction || !actionModalType) return;
    setProcessingAction(true);

    let status = 'CONFIRMED';
    let defaultMsg = 'Your tour booking has been confirmed! We look forward to guiding you through Abra.';

    if (actionModalType === 'RESPOND') {
      status = 'RESPONDED';
      defaultMsg = 'We have reviewed your request. Please note the tour guidelines and requirements.';
    } else if (actionModalType === 'DECLINE') {
      status = 'CANCELLED';
      defaultMsg = 'Sorry, we are unable to accommodate this tour schedule at this time.';
    }

    const replyMessage = actionRemarks.trim() || defaultMsg;

    try {
      const res = await fetch(`/api/inquiries/reply/${selectedBookingForAction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ replyMessage, status })
      });

      if (res.ok) {
        if (actionModalType === 'CONFIRM') showAlert('Booking confirmed successfully!', 'success');
        else if (actionModalType === 'DECLINE') showAlert('Booking declined.', 'info');
        else showAlert('Remarks updated and sent to tourist.', 'success');

        setActionModalType(null);
        setSelectedBookingForAction(null);
        setActionRemarks('');
        await fetchDashboardData();
      } else {
        showAlert('Failed to update booking status.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Network error updating booking.', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  // Toggle calendar date availability
  const handleToggleDateAvailability = async (dateStr, currentlyBlocked) => {
    if (!profile?.id) return;
    setTogglingDate(dateStr);
    try {
      const nextAvailable = currentlyBlocked;
      const res = await fetch('/api/announcements/guide-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          availableDate: dateStr,
          isAvailable: nextAvailable
        })
      });
      if (res.ok) {
        const availRes = await fetch(`/api/announcements/guide-availability?guideId=${profile.id}`);
        if (availRes.ok) {
          setCustomAvailability(await availRes.json());
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingDate(null);
    }
  };

  // Helper stats & aggregations
  const isApproved = profile?.status === 'APPROVED';
  const pendingBookingsCount = inquiries.filter(i => i.status === 'PENDING').length;
  const confirmedBookings = inquiries.filter(i => i.status === 'CONFIRMED');
  const confirmedBookingsCount = confirmedBookings.length;

  const avgRating = receivedReviews.length > 0
    ? (receivedReviews.reduce((s, r) => s + r.rating, 0) / receivedReviews.length).toFixed(1)
    : null;

  // Accreditation progress calculation
  const requiredCount = requirements.filter(r => r.is_required).length || requirements.length || 1;
  const endorsedCount = requirements.filter(r => {
    const sub = submissions.find(s => s.requirement_id === r.id);
    return sub && (sub.status === 'ENDORSED' || sub.status === 'APPROVED');
  }).length;
  const accreditationPercent = Math.min(100, Math.round((endorsedCount / requiredCount) * 100));

  // Build calendar matrix
  const buildCalendarDays = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    // Map booked days from confirmed inquiries
    const bookedMap = new Map();
    confirmedBookings.forEach(b => {
      if (!b.start_date) return;
      const start = new Date(b.start_date);
      const end = b.end_date ? new Date(b.end_date) : new Date(b.start_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getFullYear() === calendarYear && d.getMonth() === calendarMonth) {
          bookedMap.set(d.getDate(), b);
        }
      }
    });

    // Map blocked days from custom availability
    const blockedSet = new Set();
    customAvailability.forEach(av => {
      if (av.is_available === false && av.available_date) {
        const d = new Date(av.available_date);
        if (d.getFullYear() === calendarYear && d.getMonth() === calendarMonth) {
          blockedSet.add(d.getDate());
        }
      }
    });

    return { firstDay, daysInMonth, bookedMap, blockedSet };
  };

  // Filtered bookings list
  const filteredBookings = inquiries.filter(b => {
    if (bookingFilter !== 'ALL' && b.status !== bookingFilter) return false;
    if (searchBookingQuery.trim()) {
      const q = searchBookingQuery.toLowerCase();
      const matchName = b.tourist_name?.toLowerCase().includes(q);
      const matchMsg = b.message?.toLowerCase().includes(q);
      const matchEmail = b.tourist_email?.toLowerCase().includes(q);
      const matchPhone = b.tourist_phone?.toLowerCase().includes(q);
      const matchRef = b.id?.toLowerCase().includes(q);
      return matchName || matchMsg || matchEmail || matchPhone || matchRef;
    }
    return true;
  });

  // Upcoming confirmed tours
  const upcomingTours = confirmedBookings
    .filter(b => b.start_date && new Date(b.start_date) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a,b) => new Date(a.start_date) - new Date(b.start_date));

  // Tab definitions
  const guideTabs = [
    { id: 'overview', label: 'Portal Overview', icon: Compass, badge: 0 },
    { id: 'documents', label: 'Accreditation Docs', icon: FileText, badge: requirements.length > 0 && endorsedCount < requiredCount ? (requiredCount - endorsedCount) : 0, badgeColor: 'bg-amber-400 text-slate-900' },
    { id: 'profile', label: 'Guide Credentials', icon: User, badge: 0 },
    { id: 'bookings', label: 'Tour Bookings', icon: CalendarCheck, badge: pendingBookingsCount, badgeColor: 'bg-rose-500 text-white' },
    { id: 'calendar', label: 'Availability Calendar', icon: Calendar, badge: 0 },
    { id: 'reviews', label: 'Tourist Reviews', icon: Star, badge: receivedReviews.length, badgeColor: 'bg-emerald-500 text-white' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-28 min-h-screen bg-[var(--bg-app,#F7F8F6)] text-slate-600">
        <div className="w-12 h-12 border-4 border-[#153325] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-serif font-bold text-sm tracking-wide text-[#153325]">
          Loading Abra Tour Guide Portal...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app,#F7F8F6)] font-sans text-[var(--text-primary,#111827)] flex flex-col lg:flex-row transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Official Abra Tourism Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#0F261C] text-white flex flex-col justify-between border-r border-[#1D4433] shadow-2xl transition-all duration-300 ease-in-out lg:static lg:translate-x-0 flex-shrink-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-72'} w-72`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Top: Abraventure Official Logo & Masthead / Toggle */}
          {sidebarCollapsed ? (
            <div className="py-3 px-2 border-b border-white/10 flex flex-col items-center justify-center min-h-[68px]">
              <button
                onClick={toggleSidebar}
                title="Expand sidebar"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="p-4 border-b border-white/10 flex items-center justify-between min-h-[68px]">
              <Link to="/" className="flex items-center gap-3 group min-w-0">
                <img src="/abraventure-logo.png" alt="Abraventure Official Logo" className="w-10 h-10 object-contain filter drop-shadow-md rounded-lg group-hover:scale-105 transition-transform flex-shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <div className="min-w-0">
                  <span className="font-serif text-lg font-bold tracking-wider text-[#FAF7F2] leading-none block truncate">ABRAVENTURE</span>
                  <span className="text-[10px] text-[#B88B2A] tracking-[0.2em] uppercase font-bold block mt-1 truncate">Tour Guide Portal</span>
                </div>
              </Link>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={toggleSidebar}
                  title="Collapse sidebar"
                  className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="lg:hidden text-white/60 hover:text-white p-1 rounded-lg cursor-pointer"
                  title="Close navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Context Strip */}
          {!sidebarCollapsed && (
            <div className="px-5 py-3 bg-black/25 border-b border-white/5 flex items-center justify-between text-[11px]">
              <span className="text-white/80 flex items-center gap-2 font-mono truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {user?.municipalityName || 'Abra'} Guide Desk
              </span>
              <Link to="/" className="text-[#B88B2A] hover:underline flex items-center gap-1 font-semibold flex-shrink-0">
                Live Site <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="hidden lg:flex justify-center py-2 border-b border-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          )}

          {/* Navigation Items */}
          <div className="p-3 space-y-1 flex-1">
            {!sidebarCollapsed && (
              <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B88B2A]/90">Portal Operations</div>
            )}
            {guideTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  title={sidebarCollapsed ? tab.label : undefined}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                    sidebarCollapsed ? 'px-0 py-2.5 justify-center' : 'px-3.5 py-2.5'
                  } ${
                    isActive ? 'bg-[#B88B2A] text-[#153325] font-bold shadow-md' : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#153325]' : 'text-[#B88B2A]'}`} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 truncate">{tab.label}</span>
                      {tab.badge > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tab.badgeColor || 'bg-amber-400 text-slate-900'}`}>{tab.badge}</span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Accreditation Quick Pill in Sidebar */}
          {!sidebarCollapsed && (
            <div className="px-4 py-3 border-t border-white/10 bg-black/15">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-white/60">DOT Accreditation</span>
                <span className={`font-bold ${isApproved ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isApproved ? 'Accredited' : `${accreditationPercent}% Verified`}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${isApproved ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${isApproved ? 100 : Math.max(15, accreditationPercent)}%` }} />
              </div>
            </div>
          )}

          {/* Bottom Sidebar: Guide Identity Card */}
          <div className="p-3 border-t border-white/10 space-y-2 bg-[#0A1A13]">
            {sidebarCollapsed ? (
              <div className="flex justify-center py-1">
                <button onClick={logout} title={user?.fullName || 'Guide'} className="w-8 h-8 rounded-lg overflow-hidden bg-[#B88B2A]/20 border border-[#B88B2A]/40 flex items-center justify-center font-bold font-serif text-[#B88B2A] text-xs hover:bg-rose-500/20 hover:border-rose-400/40 hover:text-rose-300 transition-colors cursor-pointer">
                  {profile?.profile_picture_url ? <img src={formatMediaUrl(profile.profile_picture_url)} alt="Avatar" className="w-full h-full object-cover" /> : (user?.fullName?.charAt(0) || 'G')}
                </button>
              </div>
            ) : (
              <div className="bg-black/30 rounded-xl p-3 flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#B88B2A]/20 border border-[#B88B2A]/40 flex items-center justify-center font-bold font-serif text-[#B88B2A] text-xs flex-shrink-0">
                    {profile?.profile_picture_url ? <img src={formatMediaUrl(profile.profile_picture_url)} alt="Avatar" className="w-full h-full object-cover" /> : (user?.fullName?.charAt(0) || 'G')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{user?.fullName || 'Licensed Guide'}</p>
                    <p className="text-[10px] text-white/50 truncate font-mono">{user?.municipalityName || 'Abra'}</p>
                  </div>
                </div>
                {logout && (
                  <button onClick={logout} title="Sign out of portal" className="text-white/50 hover:text-rose-300 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-xs font-semibold">Exit</button>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main Content Work Area ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-[var(--bg-card,#FFFFFF)]/95 backdrop-blur-md border-b border-[var(--border-app,#E5E7EB)] px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs transition-colors">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 rounded-xl border border-[var(--border-app,#E5E7EB)] text-[#153325] hover:bg-black/5 cursor-pointer" title="Open navigation menu">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B88B2A]">
                  Certified Local Ambassador · {user?.municipalityName || 'Province of Abra'}
                </span>
              </div>
              <h1 className="font-serif text-lg sm:text-2xl font-bold text-[#153325] dark:text-[#E2ECE5]">
                {guideTabs.find(t => t.id === activeTab)?.label || 'Overview'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Data button */}
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              title="Refresh Data"
              className="p-2 rounded-xl border border-[var(--border-app,#E5E7EB)] text-slate-500 hover:text-[#153325] hover:bg-black/5 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#153325]' : ''}`} />
            </button>

            {/* Dark Mode Toggle */}
            <DarkModeToggle showLabel={false} />

            {/* Accreditation Badge */}
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-colors ${
              isApproved
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
            }`}>
              {isApproved ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Accredited Guide ✓</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Pending Accreditation</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Body Container */}
        <div className="p-4 sm:p-8 space-y-6 w-full min-w-0">

          {/* ══════════════════════════════════════════════════════════
              TAB 1: PORTAL OVERVIEW
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Accreditation Status Hero Banner */}
              <div className={`rounded-2xl p-6 border transition-all ${
                isApproved
                  ? 'bg-gradient-to-br from-[#153325] to-[#1E4A36] text-white border-[#275840] shadow-lg'
                  : 'bg-gradient-to-br from-[#2D2411] to-[#423315] text-white border-[#59441D] shadow-lg'
              }`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-white border border-white/15">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#B88B2A]" />
                      <span>DOT Municipal Tourism Compliance · {user?.municipalityName}</span>
                    </div>
                    <h2 className="font-serif text-2xl font-bold">
                      {isApproved ? 'Officially Certified Local Tour Guide' : 'Accreditation Review in Progress'}
                    </h2>
                    <p className="text-white/80 text-xs max-w-2xl leading-relaxed">
                      {isApproved
                        ? 'Your credentials have been fully verified and endorsed by the Municipal DOT and approved by the Provincial Tourism Office. Your profile is live for tourist bookings and official itinerary inclusion.'
                        : `You have fulfilled ${endorsedCount} of ${requiredCount} local accreditation requirements. Upload all required certificates to trigger municipal endorsement.`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleTabChange('documents')}
                      className="px-4 py-2.5 bg-[#B88B2A] hover:bg-[#A37B24] text-[#153325] font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
                    >
                      {isApproved ? 'View Accreditation Files' : 'Complete Requirements'}
                    </button>
                    <button
                      onClick={() => handleTabChange('profile')}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 cursor-pointer transition-colors"
                    >
                      Digital ID Card
                    </button>
                  </div>
                </div>

                {!isApproved && (
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-white/70">Document Endorsement Progress</span>
                      <span className="font-bold text-[#B88B2A]">{endorsedCount} / {requiredCount} Endorsed ({accreditationPercent}%)</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div className="bg-[#B88B2A] h-full rounded-full transition-all duration-500" style={{ width: `${accreditationPercent}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* 4 Core Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Confirmed Tours */}
                <div className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl p-5 shadow-xs transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Confirmed Tours
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="font-serif text-3xl font-bold text-[#153325] dark:text-[#E2ECE5]">
                    {confirmedBookingsCount}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {upcomingTours.length} upcoming scheduled tour{upcomingTours.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* 2. Pending Requests */}
                <div
                  onClick={() => { setBookingFilter('PENDING'); handleTabChange('bookings'); }}
                  className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl p-5 shadow-xs transition-colors cursor-pointer hover:border-amber-400"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Pending Requests
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="font-serif text-3xl font-bold text-amber-600">
                    {pendingBookingsCount}
                  </div>
                  <p className="text-[11px] text-amber-600/80 mt-1 font-semibold">
                    {pendingBookingsCount > 0 ? 'Requires action / confirmation' : 'All requests processed'}
                  </p>
                </div>

                {/* 3. Rating & Reviews */}
                <div
                  onClick={() => handleTabChange('reviews')}
                  className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl p-5 shadow-xs transition-colors cursor-pointer hover:border-[#B88B2A]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Tourist Rating
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-[#B88B2A] flex items-center justify-center">
                      <Star className="w-5 h-5 fill-amber-400" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-bold text-[#153325] dark:text-[#E2ECE5]">
                      {avgRating || '5.0'}
                    </span>
                    <span className="text-xs text-slate-400">/ 5.0</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Based on {receivedReviews.length} tourist review{receivedReviews.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* 4. Daily Rate */}
                <div
                  onClick={() => handleTabChange('profile')}
                  className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl p-5 shadow-xs transition-colors cursor-pointer hover:border-emerald-600"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Standard Daily Rate
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#153325]/10 text-[#153325] dark:text-emerald-400 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="font-serif text-3xl font-bold text-[#153325] dark:text-[#E2ECE5]">
                    {priceRate ? `₱${parseFloat(priceRate).toLocaleString()}` : '₱0'}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Per guided group tour day
                  </p>
                </div>
              </div>

              {/* Next Upcoming Tour Highlight & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Tour or Next Schedule */}
                <div className="lg:col-span-2 bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-serif font-bold text-[#153325] dark:text-[#E2ECE5] text-base">
                        Upcoming Confirmed Tour Schedule
                      </h3>
                      <p className="text-xs text-slate-500">
                        Scheduled tourist bookings locked on your calendar
                      </p>
                    </div>
                    <button
                      onClick={() => handleTabChange('calendar')}
                      className="text-xs font-bold text-[#B88B2A] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Full Calendar <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {upcomingTours.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-[var(--border-app,#E5E7EB)] rounded-xl">
                      <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No upcoming tours confirmed yet</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        When you confirm tourist reservation requests, they appear right here and block your calendar.
                      </p>
                      <button
                        onClick={() => handleTabChange('bookings')}
                        className="mt-3 px-4 py-2 bg-[#153325] text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Review Booking Requests
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingTours.slice(0, 3).map((tour) => (
                        <div
                          key={tour.id}
                          className="p-4 rounded-xl border border-[var(--border-app,#E5E7EB)] bg-[var(--bg-app,#F7F8F6)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {new Date(tour.start_date).getDate()}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-[#153325] dark:text-[#E2ECE5]">
                                {tour.tourist_name || 'Tourist Group'}
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                📅 {new Date(tour.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {tour.end_date && ` – ${new Date(tour.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                                {tour.number_of_guests && ` · ${tour.number_of_guests} guest(s)`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Confirmed
                            </span>
                            <button
                              onClick={() => {
                                setSelectedBookingForAction(tour);
                                setActionModalType('DETAILS');
                              }}
                              className="px-3 py-1 bg-[#153325] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#1E4A36]"
                            >
                              View Voucher
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Shortcuts */}
                <div className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-[#153325] dark:text-[#E2ECE5] text-base mb-1">
                      Quick Guide Operations
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Direct access to core guide workflows
                    </p>

                    <div className="space-y-2.5">
                      <button
                        onClick={() => handleTabChange('bookings')}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--border-app,#E5E7EB)] hover:border-[#153325] hover:bg-black/5 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <CalendarCheck className="w-4 h-4 text-[#B88B2A]" />
                          <div>
                            <p className="text-xs font-bold text-[#153325] dark:text-[#E2ECE5]">Tour Bookings & Requests</p>
                            <p className="text-[10px] text-slate-500">Confirm, manage, or decline requests</p>
                          </div>
                        </div>
                        {pendingBookingsCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900">
                            {pendingBookingsCount}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => handleTabChange('profile')}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--border-app,#E5E7EB)] hover:border-[#153325] hover:bg-black/5 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-[#B88B2A]" />
                          <div>
                            <p className="text-xs font-bold text-[#153325] dark:text-[#E2ECE5]">Update Profile & Rates</p>
                            <p className="text-[10px] text-slate-500">Edit areas covered, services & bio</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        onClick={() => handleTabChange('calendar')}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--border-app,#E5E7EB)] hover:border-[#153325] hover:bg-black/5 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-[#B88B2A]" />
                          <div>
                            <p className="text-xs font-bold text-[#153325] dark:text-[#E2ECE5]">Manage Availability</p>
                            <p className="text-[10px] text-slate-500">Block day-offs or open dates</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        onClick={() => handleTabChange('documents')}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--border-app,#E5E7EB)] hover:border-[#153325] hover:bg-black/5 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-[#B88B2A]" />
                          <div>
                            <p className="text-xs font-bold text-[#153325] dark:text-[#E2ECE5]">DOT Accreditation</p>
                            <p className="text-[10px] text-slate-500">Upload clearance & certificates</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-[#153325]/5 border border-[#153325]/15 text-[11px] text-[#153325] dark:text-emerald-300">
                    <p className="font-bold flex items-center gap-1.5 mb-0.5">
                      <HelpCircle className="w-3.5 h-3.5" /> Direct Communications Advisory
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Tourist bookings display the traveler's verified contact number and email for direct coordination.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Bookings Quick Table */}
              <div className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-serif font-bold text-[#153325] dark:text-[#E2ECE5] text-base">
                      Recent Tour Requests
                    </h3>
                    <p className="text-xs text-slate-500">
                      Latest booking submissions from tourists in {user?.municipalityName}
                    </p>
                  </div>
                  <button
                    onClick={() => handleTabChange('bookings')}
                    className="text-xs font-bold text-[#B88B2A] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Manage All Bookings ({inquiries.length}) <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {inquiries.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No tourist bookings received yet. Once travelers book you, their requests will appear here.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-app,#E5E7EB)] text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-3 px-3">Reference</th>
                          <th className="py-3 px-3">Tourist</th>
                          <th className="py-3 px-3">Scheduled Dates</th>
                          <th className="py-3 px-3">Party Size</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-app,#E5E7EB)]">
                        {inquiries.slice(0, 5).map(b => (
                          <tr key={b.id} className="hover:bg-black/5 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-slate-500">
                              #{b.id.substring(0, 8).toUpperCase()}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-[#153325] dark:text-[#E2ECE5] block">
                                {b.tourist_name || 'Tourist'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {b.tourist_phone || b.tourist_email}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                              {b.start_date ? new Date(b.start_date).toLocaleDateString() : 'Flexible'}
                              {b.end_date && ` – ${new Date(b.end_date).toLocaleDateString()}`}
                            </td>
                            <td className="py-3 px-3 text-slate-500">
                              {b.number_of_guests || 1} guest(s)
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                b.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                b.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => {
                                  setSelectedBookingForAction(b);
                                  setActionModalType('DETAILS');
                                }}
                                className="px-3 py-1 bg-[#153325] hover:bg-[#1E4A36] text-white font-bold rounded-lg text-[11px] cursor-pointer"
                              >
                                View Request
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 2: ACCREDITATION DOCUMENTS
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'documents' && (
            <div className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl shadow-sm p-6 space-y-6">
              <div className="border-b border-[var(--border-app,#E5E7EB)] pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#153325] dark:text-[#E2ECE5]">
                      Accreditation Document Submissions
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Upload official certificates and clearances required by the Municipal DOT of {user.municipalityName}. Fulfilling all required items triggers municipal endorsement.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Compliance:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isApproved
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {endorsedCount} of {requiredCount} Endorsed
                    </span>
                  </div>
                </div>
              </div>

              {requirements.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[var(--border-app,#E5E7EB)] rounded-2xl bg-[var(--bg-app,#F7F8F6)]">
                  <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="font-bold text-sm text-[#153325] dark:text-[#E2ECE5]">No Special Requirements Configured</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    The Municipal Tourism Office of {user?.municipalityName} has not set specific document requirements yet. Please consult the Municipal Tourism Officer.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requirements.map((r) => {
                    const sub = submissions.find((s) => s.requirement_id === r.id);
                    const isEndorsed = sub?.status === 'ENDORSED' || sub?.status === 'APPROVED';
                    const isRejected = sub?.status === 'REJECTED';
                    const isSubmitted = sub && !isEndorsed && !isRejected;

                    return (
                      <div
                        key={r.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          isEndorsed
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : isRejected
                            ? 'border-rose-500/30 bg-rose-500/5'
                            : isSubmitted
                            ? 'border-amber-500/30 bg-amber-500/5'
                            : 'border-[var(--border-app,#E5E7EB)] bg-[var(--bg-app,#F7F8F6)]'
                        } flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-[#153325] dark:text-[#E2ECE5]">
                              {r.requirement_name}
                            </h4>
                            {r.is_required && (
                              <span className="text-[9px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded-full">
                                Required
                              </span>
                            )}
                            {isEndorsed && (
                              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Endorsed by DOT
                              </span>
                            )}
                            {isRejected && (
                              <span className="text-[9px] font-black uppercase tracking-wider text-rose-800 bg-rose-100 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Action Required / Rejected
                              </span>
                            )}
                            {isSubmitted && (
                              <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Under Review
                              </span>
                            )}
                          </div>

                          {r.description && (
                            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                              {r.description}
                            </p>
                          )}

                          {sub && (
                            <div className="mt-3 text-xs flex items-center gap-4 flex-wrap">
                              <span className="text-slate-400 text-[11px]">
                                Submitted: {new Date(sub.created_at || sub.submitted_at || Date.now()).toLocaleDateString()}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedDocUrl(sub.document_url)}
                                className="text-[#153325] dark:text-emerald-400 font-bold hover:underline cursor-pointer bg-transparent border-none p-0 inline-flex items-center gap-1 text-xs"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Uploaded File
                              </button>
                            </div>
                          )}

                          {sub?.review_comments && (
                            <div className="mt-2.5 text-xs text-rose-700 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/60 p-3 rounded-xl border border-rose-200 dark:border-rose-900">
                              <strong className="font-bold">DOT Officer Remarks:</strong> {sub.review_comments}
                            </div>
                          )}
                        </div>

                        {/* File Upload Control */}
                        <div className="flex-shrink-0 self-end md:self-center">
                          <label className="px-4 py-2.5 bg-[#153325] hover:bg-[#1E4A36] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5">
                            <Upload className="w-4 h-4" />
                            <span>{sub ? 'Resubmit Document' : 'Upload Document'}</span>
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={(e) => handleFileUpload(e, r.id)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tourism Office Advisory Box */}
              <div className="p-4 rounded-xl bg-[#153325]/5 border border-[#153325]/15 text-xs text-[#153325] dark:text-[#E2ECE5]">
                <h4 className="font-bold flex items-center gap-1.5 text-sm mb-1">
                  <ShieldCheck className="w-4 h-4 text-[#B88B2A]" /> DOT Accreditation Workflow Guidelines
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 text-xs">
                  <li>Accepted formats: PDF, PNG, JPG (maximum 10MB per document).</li>
                  <li>Clear, legible copies of your DOT Tour Guide Certificate, Barangay Clearance, and valid ID are standard.</li>
                  <li>Once all required files are endorsed by {user?.municipalityName} Municipal DOT, the Provincial Tourism Office issues your official badge.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 3: GUIDE CREDENTIALS & PROFILE DOSSIER
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* TOP: Official Philippine DOT Digital Guide Credential Card */}
              <div className="relative rounded-2xl overflow-hidden border border-[#153325]/20 shadow-xl bg-[var(--bg-card,#FFFFFF)]">
                <div className="bg-gradient-to-r from-[#0F261C] via-[#153325] to-[#0F261C] px-6 pt-6 pb-16 relative text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">🇵🇭</span>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#B88B2A]">
                          Republic of the Philippines · Province of Abra
                        </p>
                      </div>
                      <h2 className="font-serif text-xl sm:text-2xl font-bold text-white mt-1">
                        Accredited Tour Guide Credential Card
                      </h2>
                      <p className="text-white/60 text-xs">
                        Department of Tourism · Cordillera Administrative Region
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        isApproved
                          ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30'
                          : 'bg-amber-400/20 text-amber-200 border-amber-400/30'
                      }`}>
                        {isApproved ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        {isApproved ? 'Official Accreditation' : 'Pending Verification'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-0">
                  <div className="flex flex-col sm:flex-row gap-5 -mt-12 relative z-10">
                    <div className="flex-shrink-0 flex flex-col items-center sm:items-start">
                      <div className="w-28 h-28 rounded-2xl border-4 border-[var(--bg-card,#FFFFFF)] overflow-hidden shadow-2xl bg-slate-200">
                        <img
                          src={profilePicPreview || (profile?.profile_picture_url ? formatMediaUrl(profile.profile_picture_url) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'G')}&background=153325&color=fff&size=200`)}
                          alt="Guide Portrait"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <label className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#153325] dark:text-emerald-400 hover:text-[#B88B2A] cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Change Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files[0];
                            if (f) {
                              setProfilePic(f);
                              setProfilePicPreview(URL.createObjectURL(f));
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="pt-2 sm:pt-14 flex-1 text-center sm:text-left">
                      <h3 className="font-serif text-2xl font-bold text-[#153325] dark:text-[#E2ECE5]">
                        {user?.fullName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Certified Local Ambassador · {user?.municipalityName}, Abra
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-3 justify-center sm:justify-start">
                        {languages ? (
                          languages.split(',').filter(Boolean).map((lang, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 bg-[#153325]/10 text-[#153325] dark:text-emerald-300 text-[10px] font-bold rounded-full border border-[#153325]/20"
                            >
                              🗣️ {lang.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No languages configured</span>
                        )}
                      </div>
                    </div>

                    <div className="self-center sm:self-start sm:mt-14 flex flex-col items-center sm:items-end gap-2">
                      <div className="bg-[#B88B2A]/10 border border-[#B88B2A]/30 rounded-xl px-4 py-2.5 text-center sm:text-right">
                        <p className="text-[9px] font-black uppercase tracking-wider text-[#B88B2A]">Daily Rate</p>
                        <p className="font-serif text-2xl font-bold text-[#153325] dark:text-[#E2ECE5]">
                          ₱{priceRate ? parseFloat(priceRate).toLocaleString() : '0'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-[#153325] dark:text-[#E2ECE5]">{avgRating || '5.0'}</span>
                        <span>({receivedReviews.length} review{receivedReviews.length !== 1 ? 's' : ''})</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-[var(--border-app,#E5E7EB)]">
                    <div className="p-3 rounded-xl bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#B88B2A] block mb-1">
                        🗺️ Areas Covered
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2">
                        {areas || 'Not set'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#B88B2A] block mb-1">
                        🎒 Services Offered
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2">
                        {services || 'Not set'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#B88B2A] block mb-1">
                        📅 Total Bookings
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {inquiries.length} total tour reservations
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Details Edit Form */}
              <div className="bg-[var(--bg-card,#FFFFFF)] rounded-2xl border border-[var(--border-app,#E5E7EB)] p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 border-b border-[var(--border-app,#E5E7EB)] pb-3">
                  <div>
                    <h4 className="font-serif font-bold text-base text-[#153325] dark:text-[#E2ECE5] flex items-center gap-2">
                      <User className="w-4 h-4 text-[#B88B2A]" /> Edit Tour Guide Public Dossier
                    </h4>
                    <p className="text-xs text-slate-500">
                      These details are displayed on the public Abraventure listings and municipal portals for tourists.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-[#B88B2A] mb-1.5">
                        Languages Spoken (comma-separated)
                      </label>
                      <input
                        type="text"
                        required
                        value={languages}
                        onChange={(e) => setLanguages(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#153325]/30 text-[#111827] dark:text-[#E2ECE5]"
                        placeholder="e.g. English, Tagalog, Ilokano, Itneg"
                      />
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {['English', 'Tagalog', 'Ilokano', 'Itneg'].map(lang => (
                          <button
                            type="button"
                            key={lang}
                            onClick={() => {
                              const curr = languages ? languages.split(',').map(s => s.trim()) : [];
                              if (!curr.includes(lang)) {
                                setLanguages(curr.length ? `${languages}, ${lang}` : lang);
                              }
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-black/5 hover:bg-black/10 text-slate-600 dark:text-slate-400 cursor-pointer"
                          >
                            + {lang}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-[#B88B2A] mb-1.5">
                        Daily Price Rate (₱ PHP)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">₱</span>
                        <input
                          type="number"
                          required
                          min="0"
                          step="50"
                          value={priceRate}
                          onChange={(e) => setPriceRate(e.target.value)}
                          className="w-full pl-8 pr-3.5 py-2.5 bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#153325]/30 text-[#111827] dark:text-[#E2ECE5]"
                          placeholder="e.g. 1500"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Standard rate charged to tourists per guided group tour day.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#B88B2A] mb-1.5">
                      Services Offered
                    </label>
                    <input
                      type="text"
                      required
                      value={services}
                      onChange={(e) => setServices(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#153325]/30 text-[#111827] dark:text-[#E2ECE5]"
                      placeholder="e.g. Mountain trekking, Waterfall excursions, River guiding, Historical walking tour, Photography guide"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#B88B2A] mb-1.5">
                      Areas & Attractions Covered
                    </label>
                    <input
                      type="text"
                      required
                      value={areas}
                      onChange={(e) => setAreas(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#153325]/30 text-[#111827] dark:text-[#E2ECE5]"
                      placeholder="e.g. Kaparkan Falls, Mt. Bullagao, Apao Rolling Hills, Don Teodoro Falls, Bangued Heritage Walk"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#B88B2A] mb-1.5">
                      About Me (Guide Background & Experience)
                    </label>
                    <textarea
                      rows="4"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#153325]/30 resize-none text-[#111827] dark:text-[#E2ECE5]"
                      placeholder="Introduce yourself to visiting tourists. Highlight your local knowledge, years of experience, safety training, and passion for Abra's natural heritage..."
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-6 py-2.5 bg-[#153325] hover:bg-[#1E4A36] text-white font-bold rounded-xl text-xs cursor-pointer transition-colors shadow-sm flex items-center gap-2"
                    >
                      {savingProfile && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{savingProfile ? 'Saving Changes...' : 'Save Guide Dossier'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 4: TOUR BOOKINGS & RESERVATIONS (NO CHAT)
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'bookings' && (
            <div className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
              {/* Header & Filter Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-app,#E5E7EB)] pb-4">
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#153325] dark:text-[#E2ECE5]">
                    Tour Bookings & Client Reservations
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official requests, confirmation vouchers, tourist details, and downpayment verification.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  {/* Search */}
                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search tourist, ref #, phone..."
                      value={searchBookingQuery}
                      onChange={(e) => setSearchBookingQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#153325] text-[#111827] dark:text-[#E2ECE5] w-full"
                    />
                    {searchBookingQuery && (
                      <button
                        onClick={() => setSearchBookingQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-[var(--bg-app,#F7F8F6)] p-1 rounded-xl border border-[var(--border-app,#E5E7EB)] overflow-x-auto">
                    {['ALL', 'PENDING', 'CONFIRMED', 'RESPONDED', 'CANCELLED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setBookingFilter(st)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          bookingFilter === st
                            ? 'bg-[#153325] text-white shadow-xs'
                            : 'text-slate-500 hover:text-[#153325]'
                        }`}
                      >
                        {st === 'ALL' ? 'All Requests' : st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bookings Card Grid */}
              {filteredBookings.length === 0 ? (
                <div className="text-center py-20 bg-[var(--bg-app,#F7F8F6)] rounded-2xl border border-dashed border-[var(--border-app,#E5E7EB)] p-6">
                  <CalendarCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3 opacity-60" />
                  <h3 className="font-serif font-bold text-base text-[#153325] dark:text-[#E2ECE5]">
                    {searchBookingQuery || bookingFilter !== 'ALL' ? 'No matching bookings found' : 'No tour reservations received yet'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {searchBookingQuery || bookingFilter !== 'ALL'
                      ? 'Try clearing your search term or switching the status filter.'
                      : 'When tourists book your guided tours through Abraventure, their formal reservation requests appear here.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredBookings.map((b) => {
                    const isPending = b.status === 'PENDING';
                    const isConfirmed = b.status === 'CONFIRMED';
                    const isCancelled = b.status === 'CANCELLED';
                    const isResponded = b.status === 'RESPONDED';

                    // Estimated earnings if rate is known and start date given
                    const rateNum = priceRate ? parseFloat(priceRate) : 0;

                    return (
                      <div
                        key={b.id}
                        className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        {/* Top: Reference & Status */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="font-mono text-[11px] font-bold text-slate-500 bg-[var(--bg-app,#F7F8F6)] px-2.5 py-1 rounded-md border border-[var(--border-app,#E5E7EB)]">
                              REF #{b.id.substring(0, 8).toUpperCase()}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                              isConfirmed ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' :
                              isPending ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30' :
                              isCancelled ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30' :
                              'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300'
                            }`}>
                              {b.status}
                            </span>
                          </div>

                          {/* Tourist Profile */}
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-[#153325]/10 text-[#153325] dark:text-emerald-400 font-bold text-base flex items-center justify-center shrink-0">
                              {(b.tourist_name || 'T')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-serif font-bold text-sm sm:text-base text-[#153325] dark:text-[#E2ECE5] truncate">
                                {b.tourist_name}
                              </h4>
                              <p className="text-xs text-slate-500">
                                Direct Contact: {b.tourist_phone || b.tourist_email || 'Verified Tourist'}
                              </p>
                            </div>
                          </div>

                          {/* Quick Contact Chips */}
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--border-app,#E5E7EB)] text-xs">
                            {b.tourist_phone && (
                              <a
                                href={`tel:${b.tourist_phone}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] text-slate-600 dark:text-slate-300 hover:text-[#153325] font-semibold text-[11px]"
                              >
                                <Phone className="w-3 h-3 text-[#B88B2A]" /> {b.tourist_phone}
                              </a>
                            )}
                            {b.tourist_email && (
                              <a
                                href={`mailto:${b.tourist_email}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] text-slate-600 dark:text-slate-300 hover:text-[#153325] font-semibold text-[11px]"
                              >
                                <Mail className="w-3 h-3 text-[#B88B2A]" /> {b.tourist_email}
                              </a>
                            )}
                          </div>

                          {/* Schedule & Party Size */}
                          <div className="grid grid-cols-2 gap-2 mt-3 bg-[var(--bg-app,#F7F8F6)] p-3 rounded-xl border border-[var(--border-app,#E5E7EB)] text-xs">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400 block">Requested Schedule</span>
                              <span className="font-semibold text-[#153325] dark:text-[#E2ECE5]">
                                {b.start_date ? new Date(b.start_date).toLocaleDateString() : 'Dates Flexible'}
                                {b.end_date && ` – ${new Date(b.end_date).toLocaleDateString()}`}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400 block">Group Size</span>
                              <span className="font-semibold text-[#153325] dark:text-[#E2ECE5]">
                                {b.number_of_guests || 1} Person(s)
                              </span>
                            </div>
                          </div>

                          {/* Tourist's Request Note */}
                          <div className="mt-3">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                              Tourist Request & Inquiries:
                            </span>
                            <div className="p-3 bg-[var(--bg-app,#F7F8F6)] rounded-xl border border-[var(--border-app,#E5E7EB)] text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {b.message || 'No additional specifications provided.'}
                            </div>
                          </div>

                          {/* Payment / Downpayment Slip (if attached) */}
                          {b.payment_proof_url && (
                            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-[#153325] dark:text-[#FAF7F2]">
                                <CreditCard className="w-4 h-4 text-[#B88B2A]" />
                                <span className="font-semibold">Deposit Slip Attached</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedDocUrl(b.payment_proof_url)}
                                className="px-3 py-1 bg-[#153325] text-white text-[11px] font-bold rounded-lg cursor-pointer hover:bg-[#1E4A36] flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> View Slip
                              </button>
                            </div>
                          )}

                          {/* Guide Remarks Note */}
                          {b.reply_message && (
                            <div className="mt-3 p-3 rounded-xl bg-[#153325]/10 border border-[#153325]/20 text-xs">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#153325] dark:text-emerald-300 block mb-0.5">
                                Your Official Guide Remarks:
                              </span>
                              <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                                {b.reply_message}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Bottom Action Controls */}
                        <div className="pt-3 border-t border-[var(--border-app,#E5E7EB)] space-y-2">
                          <div className="flex items-center gap-2">
                            {/* Details Modal Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBookingForAction(b);
                                setActionModalType('DETAILS');
                              }}
                              className="px-3 py-2 bg-[var(--bg-app,#F7F8F6)] hover:bg-black/5 text-slate-700 dark:text-slate-300 border border-[var(--border-app,#E5E7EB)] font-bold text-xs rounded-xl cursor-pointer transition-colors"
                            >
                              Voucher Details
                            </button>

                            {/* Action Buttons for Pending or Responded */}
                            {!isConfirmed && !isCancelled && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBookingForAction(b);
                                    setActionRemarks(b.reply_message || 'Your booking is confirmed! Meeting location: Bangued Town Plaza. Looking forward to our tour.');
                                    setActionModalType('CONFIRM');
                                  }}
                                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <Check className="w-4 h-4" /> Confirm Booking
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBookingForAction(b);
                                    setActionRemarks(b.reply_message || '');
                                    setActionModalType('RESPOND');
                                  }}
                                  className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 cursor-pointer transition-colors"
                                >
                                  Add Remarks
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBookingForAction(b);
                                    setActionRemarks('');
                                    setActionModalType('DECLINE');
                                  }}
                                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 cursor-pointer transition-colors"
                                >
                                  Decline
                                </button>
                              </>
                            )}

                            {/* If already confirmed */}
                            {isConfirmed && (
                              <div className="flex-1 flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                                  <CheckCircle className="w-4 h-4" /> Tour Schedule Confirmed
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBookingForAction(b);
                                    setActionRemarks(b.reply_message || '');
                                    setActionModalType('RESPOND');
                                  }}
                                  className="text-[11px] font-bold text-[#153325] dark:text-emerald-400 hover:underline cursor-pointer"
                                >
                                  Update Notes
                                </button>
                              </div>
                            )}

                            {/* If cancelled */}
                            {isCancelled && (
                              <div className="flex-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30 px-3 py-1.5 rounded-xl text-center">
                                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                                  Reservation Request Declined
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 5: AVAILABILITY CALENDAR
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'calendar' && (() => {
            const { firstDay, daysInMonth, bookedMap, blockedSet } = buildCalendarDays();
            const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            return (
              <div className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl shadow-sm p-6 space-y-6">
                {/* Header & Month Nav */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-app,#E5E7EB)] pb-4">
                  <div>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-[#153325] dark:text-[#E2ECE5]">
                      Guide Availability & Tour Schedule
                    </h3>
                    <p className="text-xs text-slate-500">
                      Click any open day to toggle your availability (Open vs Blocked/Day Off). Confirmed tours are highlighted automatically.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        let m = calendarMonth - 1, y = calendarYear;
                        if (m < 0) { m = 11; y--; }
                        setCalendarMonth(m);
                        setCalendarYear(y);
                      }}
                      className="p-2 rounded-xl border border-[var(--border-app,#E5E7EB)] hover:bg-black/5 cursor-pointer text-slate-600 dark:text-slate-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-serif font-bold text-sm sm:text-base text-[#153325] dark:text-[#E2ECE5] min-w-[150px] text-center">
                      {MONTH_NAMES[calendarMonth]} {calendarYear}
                    </span>
                    <button
                      onClick={() => {
                        let m = calendarMonth + 1, y = calendarYear;
                        if (m > 11) { m = 0; y++; }
                        setCalendarMonth(m);
                        setCalendarYear(y);
                      }}
                      className="p-2 rounded-xl border border-[var(--border-app,#E5E7EB)] hover:bg-black/5 cursor-pointer text-slate-600 dark:text-slate-300"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setCalendarMonth(new Date().getMonth());
                        setCalendarYear(new Date().getFullYear());
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-[#153325] dark:text-emerald-400 border border-[var(--border-app,#E5E7EB)] rounded-xl hover:bg-black/5 cursor-pointer"
                    >
                      Today
                    </button>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-3.5 h-3.5 bg-rose-500 rounded-md" />
                    <strong>Booked Tour</strong> (Confirmed booking)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-3.5 h-3.5 bg-slate-300 dark:bg-slate-700 rounded-md" />
                    <strong>Day Off / Blocked</strong> (Click to toggle)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-3.5 h-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md" />
                    <strong>Open / Available</strong>
                  </span>
                </div>

                {/* Calendar Grid */}
                <div className="border border-[var(--border-app,#E5E7EB)] rounded-2xl overflow-hidden shadow-xs">
                  <div className="grid grid-cols-7 bg-[#0F261C] text-white">
                    {dayHeaders.map(d => (
                      <div key={d} className="py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-[#FAF7F2]">
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 divide-x divide-y divide-[var(--border-app,#E5E7EB)]">
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`pad-${i}`} className="h-20 bg-[var(--bg-app,#F7F8F6)]/50" />
                    ))}

                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const bookedInq = bookedMap.get(day);
                      const isBlocked = blockedSet.has(day);
                      const isToday =
                        day === new Date().getDate() &&
                        calendarMonth === new Date().getMonth() &&
                        calendarYear === new Date().getFullYear();

                      return (
                        <div
                          key={day}
                          onClick={() => {
                            if (!bookedInq) {
                              handleToggleDateAvailability(dateStr, isBlocked);
                            }
                          }}
                          className={`h-20 p-2 relative flex flex-col justify-between transition-colors ${
                            bookedInq
                              ? 'bg-rose-500/10 border-rose-500/30'
                              : isBlocked
                              ? 'bg-slate-200/50 dark:bg-slate-800/50 cursor-pointer hover:opacity-80'
                              : 'bg-white dark:bg-[#1A261F] hover:bg-emerald-500/5 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${
                              isToday
                                ? 'w-6 h-6 rounded-full bg-[#153325] text-white flex items-center justify-center'
                                : bookedInq
                                ? 'text-rose-700 dark:text-rose-400'
                                : isBlocked
                                ? 'text-slate-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}>
                              {day}
                            </span>
                            {isToday && (
                              <span className="text-[8px] font-black uppercase text-[#B88B2A]">Today</span>
                            )}
                          </div>

                          <div className="mt-1">
                            {bookedInq ? (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBookingForAction(bookedInq);
                                  setActionModalType('DETAILS');
                                }}
                                className="px-1.5 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-bold truncate cursor-pointer hover:bg-rose-700"
                                title={`Tour with ${bookedInq.tourist_name}`}
                              >
                                🎒 {bookedInq.tourist_name}
                              </div>
                            ) : isBlocked ? (
                              <div className="text-[9px] text-slate-400 font-semibold truncate">
                                🚫 Day Off
                              </div>
                            ) : (
                              <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                                ✓ Open
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Monthly Confirmed Tours Schedule */}
                <div className="pt-2">
                  <h4 className="font-serif font-bold text-sm text-[#153325] dark:text-[#E2ECE5] mb-3">
                    Scheduled Tours for {MONTH_NAMES[calendarMonth]} {calendarYear}
                  </h4>
                  {Array.from(bookedMap.values()).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No confirmed tours scheduled in this month.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Array.from(bookedMap.entries()).map(([day, b]) => (
                        <div
                          key={`tour-${day}`}
                          className="p-3.5 rounded-xl border border-[var(--border-app,#E5E7EB)] bg-[var(--bg-app,#F7F8F6)] flex items-center justify-between"
                        >
                          <div>
                            <span className="text-[10px] font-bold uppercase text-[#B88B2A]">
                              {MONTH_NAMES[calendarMonth]} {day}, {calendarYear}
                            </span>
                            <p className="font-bold text-xs text-[#153325] dark:text-[#E2ECE5]">
                              {b.tourist_name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {b.number_of_guests || 1} guest(s) · {b.tourist_phone || 'No phone'}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedBookingForAction(b);
                              setActionModalType('DETAILS');
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold bg-[#153325] text-white rounded-lg cursor-pointer"
                          >
                            Details
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ══════════════════════════════════════════════════════════
              TAB 6: TOURIST REVIEWS & RATINGS
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'reviews' && (
            <div className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl shadow-sm p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-app,#E5E7EB)] pb-4">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#153325] dark:text-[#E2ECE5]">
                    Tourist Feedback & Star Ratings
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verified reviews submitted by tourists who booked your guiding services
                  </p>
                </div>

                {avgRating && (
                  <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/25 px-4 py-2 rounded-xl">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <div>
                      <span className="font-serif font-bold text-xl text-[#153325] dark:text-[#FAF7F2]">
                        {avgRating}
                      </span>
                      <span className="text-xs text-slate-500"> / 5.0</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      ({receivedReviews.length} review{receivedReviews.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}
              </div>

              {receivedReviews.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-[var(--border-app,#E5E7EB)] rounded-2xl bg-[var(--bg-app,#F7F8F6)]">
                  <Star className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <h4 className="font-serif font-bold text-sm text-[#153325] dark:text-[#E2ECE5]">
                    No Reviews Received Yet
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    After you complete guided tours with tourists, their ratings and testimonials will be showcased here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {receivedReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 rounded-2xl border border-[var(--border-app,#E5E7EB)] bg-[var(--bg-app,#F7F8F6)] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className="font-bold text-xs text-[#153325] dark:text-[#E2ECE5]">
                            {rev.reviewer_name || 'Verified Tourist'}
                          </h4>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= rev.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300 dark:text-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {rev.comment && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2 italic">
                            "{rev.comment}"
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-[var(--border-app,#E5E7EB)] text-[10px] text-slate-400">
                        {new Date(rev.created_at || Date.now()).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ── MODAL 1: RESERVATION ACTION MODAL (Confirm / Respond / Decline) ── */}
      {selectedBookingForAction && actionModalType && actionModalType !== 'DETAILS' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card,#FFFFFF)] rounded-2xl p-6 shadow-2xl border border-[var(--border-app,#E5E7EB)] max-w-lg w-full relative animate-fadeIn space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-app,#E5E7EB)] pb-3">
              <div className="flex items-center gap-2">
                {actionModalType === 'CONFIRM' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                {actionModalType === 'RESPOND' && <FileCheck className="w-5 h-5 text-amber-600" />}
                {actionModalType === 'DECLINE' && <AlertTriangle className="w-5 h-5 text-rose-600" />}
                <h3 className="font-serif font-bold text-base text-[#153325] dark:text-[#E2ECE5]">
                  {actionModalType === 'CONFIRM' && 'Confirm Tourist Booking'}
                  {actionModalType === 'RESPOND' && 'Add Guide Remarks & Instructions'}
                  {actionModalType === 'DECLINE' && 'Decline Booking Request'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActionModalType(null);
                  setSelectedBookingForAction(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[var(--bg-app,#F7F8F6)] rounded-xl border border-[var(--border-app,#E5E7EB)] text-xs space-y-1">
              <p className="font-bold text-[#153325] dark:text-[#E2ECE5]">
                Tourist: {selectedBookingForAction.tourist_name}
              </p>
              <p className="text-slate-500">
                Schedule: {selectedBookingForAction.start_date ? new Date(selectedBookingForAction.start_date).toLocaleDateString() : 'Dates Flexible'}
                {selectedBookingForAction.end_date && ` – ${new Date(selectedBookingForAction.end_date).toLocaleDateString()}`}
                {' '}({selectedBookingForAction.number_of_guests || 1} Guests)
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {actionModalType === 'CONFIRM' && 'Official Confirmation Remarks & Meeting Instructions:'}
                {actionModalType === 'RESPOND' && 'Guide Remarks for Tourist:'}
                {actionModalType === 'DECLINE' && 'Reason for Declining (Optional):'}
              </label>
              <textarea
                rows="4"
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder={
                  actionModalType === 'CONFIRM'
                    ? 'e.g. Booking confirmed! Please meet me at Bangued Plaza in front of the Capitol at 7:00 AM. Bring water and trekking shoes.'
                    : actionModalType === 'RESPOND'
                    ? 'e.g. Please confirm your exact arrival time and if your group requires 4x4 transport rental to the trailhead.'
                    : 'e.g. Fully booked on requested dates. Please reschedule.'
                }
                className="w-full px-3.5 py-2.5 bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#153325]/30 text-[#111827] dark:text-[#E2ECE5] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActionModalType(null);
                  setSelectedBookingForAction(null);
                }}
                className="px-4 py-2 border border-[var(--border-app,#E5E7EB)] text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingAction}
                onClick={handleExecuteBookingAction}
                className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 ${
                  actionModalType === 'CONFIRM' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  actionModalType === 'DECLINE' ? 'bg-rose-600 hover:bg-rose-700' :
                  'bg-[#153325] hover:bg-[#1E4A36]'
                }`}
              >
                {processingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {actionModalType === 'CONFIRM' && 'Confirm Booking Voucher'}
                  {actionModalType === 'RESPOND' && 'Send Remarks'}
                  {actionModalType === 'DECLINE' && 'Decline Request'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: FULL VOUCHER DETAILS MODAL ── */}
      {selectedBookingForAction && actionModalType === 'DETAILS' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card,#FFFFFF)] rounded-2xl p-6 shadow-2xl border border-[var(--border-app,#E5E7EB)] max-w-lg w-full relative animate-fadeIn space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[var(--border-app,#E5E7EB)] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#B88B2A] uppercase tracking-wider block">
                  Tour Reservation Voucher
                </span>
                <h3 className="font-serif font-bold text-lg text-[#153325] dark:text-[#E2ECE5]">
                  {selectedBookingForAction.tourist_name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActionModalType(null);
                  setSelectedBookingForAction(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[var(--bg-app,#F7F8F6)] p-3.5 rounded-xl border border-[var(--border-app,#E5E7EB)]">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Reference:</span>
                  <span className="font-mono font-bold text-[#153325] dark:text-[#E2ECE5]">
                    #{selectedBookingForAction.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Status:</span>
                  <span className="font-bold text-[#B88B2A]">{selectedBookingForAction.status}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Schedule:</span>
                  <span className="font-semibold text-[#153325] dark:text-[#E2ECE5]">
                    {selectedBookingForAction.start_date ? new Date(selectedBookingForAction.start_date).toLocaleDateString() : 'Flexible'}
                    {selectedBookingForAction.end_date && ` – ${new Date(selectedBookingForAction.end_date).toLocaleDateString()}`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Party Size:</span>
                  <span className="font-semibold text-[#153325] dark:text-[#E2ECE5]">
                    {selectedBookingForAction.number_of_guests || 1} Guest(s)
                  </span>
                </div>
              </div>

              {/* Direct Tourist Contacts */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Tourist Contacts
                </span>
                {selectedBookingForAction.tourist_phone && (
                  <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-[#B88B2A]" />
                    <a href={`tel:${selectedBookingForAction.tourist_phone}`} className="hover:underline font-semibold">
                      {selectedBookingForAction.tourist_phone}
                    </a>
                  </p>
                )}
                {selectedBookingForAction.tourist_email && (
                  <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-[#B88B2A]" />
                    <a href={`mailto:${selectedBookingForAction.tourist_email}`} className="hover:underline font-semibold">
                      {selectedBookingForAction.tourist_email}
                    </a>
                  </p>
                )}
              </div>

              {/* Tourist Specifications */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Tourist Request Notes:
                </span>
                <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedBookingForAction.message || 'No specific requests noted.'}
                </p>
              </div>

              {/* Payment Proof Slip if present */}
              {selectedBookingForAction.payment_proof_url && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#B88B2A]" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Payment Proof Attached
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDocUrl(selectedBookingForAction.payment_proof_url)}
                    className="px-3 py-1 bg-[#153325] text-white text-[11px] font-bold rounded-lg cursor-pointer hover:bg-[#1E4A36] flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Slip
                  </button>
                </div>
              )}

              {/* Guide's Current Remarks */}
              {selectedBookingForAction.reply_message && (
                <div className="p-3.5 rounded-xl bg-[#153325]/10 border border-[#153325]/20 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#153325] dark:text-emerald-300 block">
                    Guide Instructions Sent:
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {selectedBookingForAction.reply_message}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-app,#E5E7EB)]">
              <button
                type="button"
                onClick={() => {
                  setActionModalType(null);
                  setSelectedBookingForAction(null);
                }}
                className="px-4 py-2 bg-[#153325] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#1E4A36]"
              >
                Close Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document & Receipt Viewer Modal */}
      {selectedDocUrl && (
        <DocumentViewerModal
          docUrl={selectedDocUrl}
          onClose={() => setSelectedDocUrl(null)}
          title="Document & Payment Receipt Viewer"
        />
      )}
    </div>
  );
};

export default GuideDashboard;
