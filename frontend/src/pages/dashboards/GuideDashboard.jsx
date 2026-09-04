import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import {
  Award, FileText, User, MessageSquare, Upload, CheckCircle,
  AlertTriangle, Trash2, Calendar, Star, Menu, X, ArrowUpRight, ShieldCheck
} from 'lucide-react';
import EyeComfortToggle from '../../components/common/EyeComfortToggle';

const GuideDashboard = () => {
  const { token, user, logout } = useAuth();
  const { showAlert } = useAlert();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'documents');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && t !== activeTab) {
      setActiveTab(t);
    }
  }, [searchParams]);
  const [profile, setProfile] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocUrl, setSelectedDocUrl] = useState(null);

  // Profile forms state
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState('');
  const [services, setServices] = useState('');
  const [areas, setAreas] = useState('');
  const [priceRate, setPriceRate] = useState('');
  const [profilePic, setProfilePic] = useState(null);

  // Inquiry reply state
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Reviews received
  const [receivedReviews, setReceivedReviews] = useState([]);

  // Availability calendar
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const fetchProfileAndRequirements = async () => {
    if (!token || !user) return;
    try {
      // 1. Fetch profile
      const userRes = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (userRes.ok) {
        const uData = await userRes.json();
        setProfile(uData.profile);
        if (uData.profile) {
          setBio(uData.profile.bio || '');
          setLanguages(uData.profile.languages_spoken || '');
          setServices(uData.profile.services_offered || '');
          setAreas(uData.profile.areas_covered || '');
          setPriceRate(uData.profile.price_rate || '');
        }
      }

      // 2. Fetch requirements of guide's municipality
      const reqRes = await fetch(`/api/requirements/municipality/${user.municipalityId}?targetType=TOUR_GUIDE`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequirements(reqData);
      }

      // 3. Fetch submissions
      const subRes = await fetch('/api/documents/my-submissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubmissions(subData);
      }

      // 4. Fetch received inquiries
      const inqRes = await fetch('/api/inquiries', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (inqRes.ok) {
        const inqData = await inqRes.json();
        setInquiries(inqData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndRequirements();
    fetchReceivedReviews();
  }, [token, user]);

  const fetchReceivedReviews = async () => {
    if (!token) return;
    try {
      const r = await fetch('/api/reviews/received', { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setReceivedReviews(await r.json());
    } catch (err) { console.error(err); }
  };

  const handleConfirmBooking = async (id) => {
    try {
      await fetch(`/api/inquiries/reply/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ replyMessage: 'Your tour guide booking is confirmed! We will meet at the agreed location.', status: 'CONFIRMED' }),
      });
      await fetchProfileAndRequirements();
    } catch (err) { console.error(err); }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await fetch(`/api/inquiries/reply/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ replyMessage: 'Sorry, this booking has been cancelled. Please contact us to reschedule.', status: 'CANCELLED' }),
      });
      await fetchProfileAndRequirements();
    } catch (err) { console.error(err); }
  };

  const buildCalendarDays = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const confirmedBookings = inquiries.filter(i => i.status === 'CONFIRMED' && i.start_date);
    const bookedDates = new Set();
    confirmedBookings.forEach(b => {
      const start = new Date(b.start_date);
      const end = b.end_date ? new Date(b.end_date) : new Date(b.start_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getFullYear() === calendarYear && d.getMonth() === calendarMonth) bookedDates.add(d.getDate());
      }
    });
    return { firstDay, daysInMonth, bookedDates };
  };

  const avgRating = receivedReviews.length > 0
    ? (receivedReviews.reduce((s, r) => s + r.rating, 0) / receivedReviews.length).toFixed(1)
    : null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

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
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        showAlert('Guide profile updated successfully.', 'success');
        setProfilePic(null);
        await fetchProfileAndRequirements();
      } else {
        showAlert('Update failed.', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e, requirementId) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('requirementId', requirementId);
    formData.append('document', file);

    try {
      const response = await fetch('/api/documents/submit', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        showAlert('File uploaded successfully for evaluation.', 'success');
        await fetchProfileAndRequirements();
      } else {
        showAlert('Upload failed.', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReplyInquiry = async (e) => {
    e.preventDefault();
    if (!replyText || !selectedInquiry) return;

    try {
      const response = await fetch(`/api/inquiries/reply/${selectedInquiry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ replyMessage: replyText, status: 'RESPONDED' })
      });

      if (response.ok) {
        setReplyText('');
        setSelectedInquiry(null);
        showAlert('Reply sent successfully to the tourist.', 'success');
        await fetchProfileAndRequirements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 min-h-[calc(100vh-16rem)]">
        <div className="w-12 h-12 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isApproved = profile?.status === 'APPROVED';

  const guideTabs = [
    { id: 'documents', label: 'Accreditation Docs', icon: FileText },
    { id: 'profile', label: 'Guide Details & Photo', icon: User },
    { id: 'inquiries', label: 'Inquiries', icon: MessageSquare, badge: inquiries.length },
    { id: 'calendar', label: 'Availability Calendar', icon: Calendar },
    { id: 'reviews', label: 'My Reviews', icon: Star, badge: receivedReviews.length },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-app,#E3ECE4)] font-sans text-[var(--text-primary,#17281D)] flex flex-col lg:flex-row transition-colors">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Proper Desktop & Mobile Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#153325] text-white flex flex-col justify-between border-r border-[#1D4433] shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex-shrink-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Top: Abraventure Official Logo & Masthead */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/abraventure-logo.png"
                alt="Abraventure Official Logo"
                className="w-10 h-10 object-contain filter drop-shadow-md rounded-lg group-hover:scale-105 transition-transform"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="min-w-0">
                <span className="font-serif text-lg font-bold tracking-wider text-[#FAF7F2] leading-none block truncate">
                  ABRAVENTURE
                </span>
                <span className="text-[10px] text-[#B88B2A] tracking-[0.2em] uppercase font-bold block mt-1 truncate">
                  Tour Guide Portal
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden text-white/60 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Context Strip */}
          <div className="px-5 py-3 bg-black/20 border-b border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-white/70 flex items-center gap-2 font-mono truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {user?.municipalityName || 'Abra'} Guide Desk
            </span>
            <Link to="/" className="text-[#B88B2A] hover:underline flex items-center gap-1 font-semibold flex-shrink-0">
              Live Site <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Main Navigation Features */}
          <div className="p-3 space-y-1 flex-1">
            <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B88B2A]">
              Guide Features
            </div>
            {guideTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchParams({ tab: tab.id });
                    setSelectedInquiry(null);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#B88B2A] text-[#153325] font-bold shadow-md'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#153325]' : 'text-[#B88B2A]'}`} />
                  <span className="flex-1 truncate">{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-[#153325]">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Sidebar: Guide Profile Card */}
          <div className="p-4 border-t border-white/10 space-y-2 bg-[#0F261C]">
            <div className="bg-black/30 rounded-xl p-3 flex items-center justify-between border border-white/5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#B88B2A]/20 border border-[#B88B2A]/40 flex items-center justify-center font-bold font-serif text-[#B88B2A] text-xs flex-shrink-0">
                  {user?.fullName?.charAt(0) || 'G'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user?.fullName || 'Licensed Guide'}</p>
                  <p className="text-[10px] text-white/50 truncate font-mono">{user?.municipalityName || 'Abra'}</p>
                </div>
              </div>
              {logout && (
                <button
                  onClick={logout}
                  title="Sign out of portal"
                  className="text-white/50 hover:text-rose-300 p-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer text-[11px] font-semibold"
                >
                  Exit
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-[var(--bg-header,#EAF1EB)]/90 backdrop-blur-md border-b border-[var(--border-app,#C7D7C9)] px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-[var(--border-app,#C7D7C9)] text-[#153325] hover:bg-black/5 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B88B2A]">
                  Certified Local Ambassador · {user?.municipalityName || 'Abra'}
                </span>
              </div>
              <h1 className="font-serif text-lg sm:text-2xl font-bold text-[#153325]">
                {guideTabs.find(t => t.id === activeTab)?.label || 'Overview'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Eye Comfort Theme Selector */}
            <EyeComfortToggle />

            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${
              isApproved
                ? 'bg-[#153325]/10 border-[#153325]/20 text-[#153325]'
                : 'bg-[#B88B2A]/10 border-[#B88B2A]/30 text-[#B88B2A]'
            }`}>
              {isApproved ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-[#153325]" />
                  <span>Accredited Guide ✓</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-[#B88B2A]" />
                  <span>Pending Accreditation</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <div className="p-4 sm:p-8 space-y-6 max-w-7xl w-full">
          {/* Tab Content Container */}
          <div className="bg-[var(--bg-card,#F3F8F4)] border border-[var(--border-app,#C7D7C9)] rounded-2xl shadow-sm p-4 sm:p-6 transition-colors">
        
        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div>
            <h3 className="font-bold text-slate-805 text-base mb-2">Accreditation Document Submissions</h3>
            <p className="text-slate-400 text-xs mb-6">
              Upload local accreditation requirement files required by the Municipal DOT of {user.municipalityName}. Fulfilling all items triggers municipal endorsement.
            </p>

            {requirements.length === 0 ? (
              <p className="text-slate-450 text-xs py-8 text-center bg-slate-50 border border-slate-100 rounded-xl">
                No special accreditation documents configured by your local DOT.
              </p>
            ) : (
              <div className="space-y-4">
                {requirements.map((r) => {
                  const sub = submissions.find((s) => s.requirement_id === r.id);
                  return (
                    <div key={r.id} className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          {r.requirement_name}
                          {r.is_required && (
                            <span className="text-[9px] font-bold tracking-wide uppercase text-red-650 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                              Required
                            </span>
                          )}
                        </h4>
                        {r.description && <p className="text-slate-450 text-xs mt-1">{r.description}</p>}
                        
                        {sub && (
                          <div className="mt-3 text-xs flex items-center gap-4">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] tracking-wide uppercase ${
                              sub.status === 'ENDORSED' ? 'bg-emerald-100 text-emerald-800' :
                              sub.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              Status: {sub.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedDocUrl(sub.document_url)}
                              className="text-emerald-950 font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
                            >
                              View Uploaded File
                            </button>
                          </div>
                        )}
                        
                        {sub?.review_comments && (
                          <p className="mt-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                            <strong>DOT Remarks:</strong> {sub.review_comments}
                          </p>
                        )}
                      </div>

                      {/* Upload button */}
                      <label className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5 self-end md:self-auto">
                        <Upload className="w-4 h-4" />
                        <span>{sub ? 'Resubmit File' : 'Upload File'}</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileUpload(e, r.id)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab — Guide Credential Dossier */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* TOP: Digital ID Badge */}
            <div className="relative rounded-2xl overflow-hidden border border-[#153325]/15 shadow-lg">
              {/* Header band */}
              <div className="bg-gradient-to-r from-[#153325] via-[#1e4a36] to-[#153325] px-6 pt-6 pb-16 relative">
                <div className="absolute inset-0 opacity-5" style={{backgroundImage:'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',backgroundSize:'12px 12px'}} />
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B88B2A]">🇵🇭 Republic of the Philippines</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mt-0.5">Department of Tourism · Province of Abra</p>
                    <h2 className="font-serif text-xl font-bold text-white mt-1">Certified Tour Guide Credential</h2>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${isApproved ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30' : 'bg-amber-400/20 text-amber-200 border-amber-400/30'}`}>
                      {isApproved ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {isApproved ? 'Accredited' : 'Pending Review'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Avatar floats over the band */}
              <div className="bg-[var(--bg-card,#F3F8F4)] px-6 pb-6">
                <div className="flex flex-col sm:flex-row gap-5 -mt-12 relative">
                  {/* Avatar + upload */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl border-4 border-[var(--bg-card,#F3F8F4)] overflow-hidden shadow-xl bg-slate-200">
                      <img
                        src={profile?.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=153325&color=fff&size=200`}
                        alt="Guide portrait"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <label className="mt-2 flex items-center justify-center gap-1 text-[10px] font-bold text-[#153325] hover:text-[#B88B2A] cursor-pointer transition-colors">
                      <Upload className="w-3 h-3" />
                      Change Photo
                      <input type="file" accept="image/*" onChange={(e) => setProfilePic(e.target.files[0])} className="hidden" />
                    </label>
                  </div>

                  {/* Name & meta */}
                  <div className="pt-14 sm:pt-2 flex-1">
                    <h3 className="font-serif text-2xl font-bold text-[#153325]">{user.fullName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{user.municipalityName} Certified Local Ambassador · Abra, CAR</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {languages.split(',').filter(Boolean).map((lang, i) => (
                        <span key={i} className="px-2.5 py-0.5 bg-[#153325]/8 text-[#153325] text-[10px] font-bold rounded-full border border-[#153325]/15">{lang.trim()}</span>
                      ))}
                    </div>
                  </div>

                  {/* Rate badge */}
                  <div className="self-start sm:mt-2 flex flex-col items-end gap-2">
                    <div className="bg-[#B88B2A]/10 border border-[#B88B2A]/25 rounded-xl px-4 py-3 text-right">
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#B88B2A]">Daily Rate</p>
                      <p className="font-serif text-xl font-bold text-[#153325]">₱{priceRate ? parseFloat(priceRate).toLocaleString() : '—'}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-bold">{receivedReviews.length > 0 ? (receivedReviews.reduce((s,r)=>s+r.rating,0)/receivedReviews.length).toFixed(1) : 'N/A'}</span>
                      <span>({receivedReviews.length} review{receivedReviews.length !== 1 ? 's' : ''})</span>
                    </div>
                  </div>
                </div>

                {/* Quick-stat strip */}
                <div className="grid grid-cols-3 gap-3 mt-5">
                  {[
                    { label: 'Areas Covered', value: areas ? areas.split(',').length : 0, icon: '🗺️' },
                    { label: 'Services', value: services ? services.split(',').length : 0, icon: '🎒' },
                    { label: 'Inquiries', value: inquiries.length, icon: '💬' },
                  ].map(s => (
                    <div key={s.label} className="bg-[var(--bg-app,#E3ECE4)] rounded-xl p-3 text-center border border-[var(--border-app,#C7D7C9)]">
                      <div className="text-lg">{s.icon}</div>
                      <div className="font-bold text-[#153325] text-sm">{s.value}</div>
                      <div className="text-[10px] text-slate-500">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BOTTOM: Edit form */}
            <div className="bg-[var(--bg-card,#F3F8F4)] rounded-2xl border border-[var(--border-app,#C7D7C9)] p-6">
              <h4 className="font-bold text-[#153325] text-sm mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Edit Guide Profile
              </h4>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#B88B2A] mb-1.5">Languages Spoken</label>
                    <input
                      type="text"
                      required
                      value={languages}
                      onChange={(e) => setLanguages(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#153325]/20"
                      placeholder="e.g. English, Tagalog, Ilokano"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#B88B2A] mb-1.5">Daily Price Rate (₱)</label>
                    <input
                      type="number"
                      required
                      value={priceRate}
                      onChange={(e) => setPriceRate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#153325]/20"
                      placeholder="e.g. 1500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#B88B2A] mb-1.5">Services Offered</label>
                  <input
                    type="text"
                    required
                    value={services}
                    onChange={(e) => setServices(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#153325]/20"
                    placeholder="e.g. Hiking, waterfalls tour, food tasting, historical walking tour"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#B88B2A] mb-1.5">Areas Covered</label>
                  <input
                    type="text"
                    required
                    value={areas}
                    onChange={(e) => setAreas(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#153325]/20"
                    placeholder="e.g. Kaparkan Falls, Tineg rivers, Bangued city proper"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#B88B2A] mb-1.5">About Me (Bio)</label>
                  <textarea
                    rows="4"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#153325]/20 resize-none"
                    placeholder="Write a brief background about your tour guide experience, credentials..."
                  ></textarea>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#153325] hover:bg-[#1e4a36] text-white font-bold rounded-xl text-xs cursor-pointer transition-colors shadow-sm"
                  >
                    Save Guide Details
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Received Inquiries Tab */}
        {activeTab === 'inquiries' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-slate-200 rounded-2xl overflow-hidden" style={{minHeight: '520px'}}>
            {/* Conversation List */}
            <div className="lg:col-span-1 border-r border-slate-200 bg-slate-50 flex flex-col">
              <div className="px-4 py-3 border-b border-slate-200 bg-white">
                <h3 className="font-bold text-slate-800 text-sm">Tour Inquiries</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{inquiries.length} conversation{inquiries.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {inquiries.length === 0 ? (
                  <p className="text-slate-400 text-xs py-8 text-center">No inquiries yet.</p>
                ) : (
                  inquiries.map((inq) => (
                    <div
                      key={inq.id}
                      onClick={() => setSelectedInquiry(inq)}
                      className={`px-4 py-3 cursor-pointer transition-colors ${
                        selectedInquiry?.id === inq.id
                          ? 'bg-emerald-900/8 border-l-4 border-emerald-900'
                          : 'hover:bg-slate-100/70 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-sky-800">{(inq.tourist_name || 'G')[0].toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-bold text-slate-800 text-xs truncate">{inq.tourist_name}</p>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                              inq.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                              inq.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                              inq.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>{inq.status}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{inq.message}</p>
                          {inq.start_date && (
                            <p className="text-[10px] text-slate-400 mt-0.5">📅 {new Date(inq.start_date).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Panel */}
            <div className="lg:col-span-2 flex flex-col bg-white">
              {selectedInquiry ? (
                <>
                  {/* Chat Header */}
                  <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center gap-3 flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-sky-800">{(selectedInquiry.tourist_name || 'G')[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm">{selectedInquiry.tourist_name}</p>
                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 mt-0.5">
                        {selectedInquiry.tourist_email && <span>✉️ {selectedInquiry.tourist_email}</span>}
                        {selectedInquiry.tourist_phone && <span>📞 {selectedInquiry.tourist_phone}</span>}
                        {selectedInquiry.start_date && (
                          <span>📅 {new Date(selectedInquiry.start_date).toLocaleDateString()}{selectedInquiry.end_date ? ` → ${new Date(selectedInquiry.end_date).toLocaleDateString()}` : ''}</span>
                        )}
                        {selectedInquiry.number_of_guests && <span>👥 {selectedInquiry.number_of_guests} guest(s)</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                      selectedInquiry.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      selectedInquiry.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                      selectedInquiry.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{selectedInquiry.status}</span>
                  </div>

                  {/* Chat Bubbles */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50" style={{minHeight: '220px', maxHeight: '280px'}}>
                    {/* Tourist message — left side */}
                    <div className="flex items-end gap-2">
                      <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 mb-0.5">
                        <span className="text-xs font-bold text-sky-800">{(selectedInquiry.tourist_name || 'G')[0].toUpperCase()}</span>
                      </div>
                      <div className="max-w-[75%]">
                        <p className="text-[10px] text-slate-400 mb-1 ml-1">{selectedInquiry.tourist_name}</p>
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                          <p className="text-xs text-slate-700 leading-relaxed">{selectedInquiry.message}</p>
                        </div>
                      </div>
                    </div>

                    {/* Guide reply — right side */}
                    {selectedInquiry.reply_message && (
                      <div className="flex items-end gap-2 flex-row-reverse">
                        <div className="w-7 h-7 rounded-full bg-emerald-900 flex items-center justify-center flex-shrink-0 mb-0.5">
                          <span className="text-xs font-bold text-white">G</span>
                        </div>
                        <div className="max-w-[75%]">
                          <p className="text-[10px] text-slate-400 mb-1 mr-1 text-right">You (Guide)</p>
                          <div className="bg-emerald-900 rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
                            <p className="text-xs text-white leading-relaxed">{selectedInquiry.reply_message}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status indicators */}
                    {selectedInquiry.status === 'CONFIRMED' && (
                      <div className="text-center">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">✅ Tour Booking Confirmed</span>
                      </div>
                    )}
                    {selectedInquiry.status === 'CANCELLED' && (
                      <div className="text-center">
                        <span className="text-[10px] bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full">❌ Booking Declined</span>
                      </div>
                    )}
                  </div>

                  {/* Chat Input + Actions */}
                  <div className="border-t border-slate-200 bg-white flex-shrink-0">
                    {/* Reply input */}
                    <form onSubmit={handleReplyInquiry} className="p-3 flex items-end gap-2">
                      <textarea
                        required
                        rows="2"
                        placeholder="Type your reply... (meeting point, GCash details, tour details...)"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReplyInquiry(e); } }}
                        className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-emerald-400 focus:bg-white resize-none transition-colors"
                      />
                      <button
                        type="submit"
                        className="p-2.5 bg-emerald-900 text-white rounded-xl hover:bg-emerald-800 transition-colors flex-shrink-0"
                        title="Send reply"
                      >
                        <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                      </button>
                    </form>

                    {/* Confirm / Decline — for PENDING and RESPONDED */}
                    {(selectedInquiry.status === 'PENDING' || selectedInquiry.status === 'RESPONDED') && (
                      <div className="px-3 pb-3 space-y-2">
                        {selectedInquiry.status === 'RESPONDED' && (
                          <p className="text-[10px] text-center text-slate-400 italic">You've replied. Ready to confirm this booking?</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => { handleConfirmBooking(selectedInquiry.id); setSelectedInquiry(null); }}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                          >
                            ✓ Confirm Booking
                          </button>
                          <button
                            onClick={() => { handleCancelBooking(selectedInquiry.id); setSelectedInquiry(null); }}
                            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                          >
                            ✕ Decline
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
                  <p className="font-bold text-sm text-slate-600">Select a conversation</p>
                  <p className="text-xs mt-1">Choose an inquiry from the left to read the message and reply.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Availability Calendar */}
        {activeTab === 'calendar' && (() => {
          const { firstDay, daysInMonth, bookedDates } = buildCalendarDays();
          const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
          return (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 text-base">Guide Availability Calendar</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => { let m=calendarMonth-1,y=calendarYear; if(m<0){m=11;y--;} setCalendarMonth(m);setCalendarYear(y); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">‹</button>
                  <span className="text-sm font-bold text-slate-800 min-w-[130px] text-center">{MONTH_NAMES[calendarMonth]} {calendarYear}</span>
                  <button onClick={() => { let m=calendarMonth+1,y=calendarYear; if(m>11){m=0;y++;} setCalendarMonth(m);setCalendarYear(y); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">›</button>
                </div>
              </div>
              <div className="flex gap-4 text-xs mb-4">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-400 rounded-full"/> Booked</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded-full"/> Available</span>
              </div>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-7 bg-emerald-900">
                  {dayNames.map(d => <div key={d} className="text-center text-white text-[10px] font-bold uppercase py-2">{d}</div>)}
                </div>
                <div className="grid grid-cols-7">
                  {Array.from({length: firstDay}).map((_,i) => <div key={`e-${i}`} className="h-12 bg-slate-50 border border-slate-100"/>)}
                  {Array.from({length: daysInMonth},(_,i)=>i+1).map(day => {
                    const isBooked = bookedDates.has(day);
                    const isToday = day===new Date().getDate() && calendarMonth===new Date().getMonth() && calendarYear===new Date().getFullYear();
                    return (
                      <div key={day} className={`h-12 border border-slate-100 flex items-center justify-center ${isBooked?'bg-red-50':'bg-white hover:bg-emerald-50'}`}>
                        <span className={`text-xs font-semibold ${isBooked?'text-red-600':isToday?'text-white':'text-slate-700'} ${isToday?'bg-emerald-900 rounded-full w-6 h-6 flex items-center justify-center':''}`}>{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3 text-center">Red = Booked tour days (confirmed). Green = Available.</p>
            </div>
          );
        })()}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">Tourist Reviews</h3>
              {avgRating && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400"/>
                  <span className="font-black text-amber-900 text-lg">{avgRating}</span>
                  <span className="text-xs text-amber-700">/ 5 ({receivedReviews.length} reviews)</span>
                </div>
              )}
            </div>
            {receivedReviews.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm"><Star className="w-10 h-10 mx-auto mb-2 opacity-30"/> No reviews yet.</div>
            ) : (
              <div className="space-y-4">
                {receivedReviews.map(rev => (
                  <div key={rev.id} className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-slate-800 text-sm">{rev.reviewer_name || 'Anonymous'}</p>
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(s=><Star key={s} className={`w-4 h-4 ${s<=rev.rating?'fill-amber-400 text-amber-400':'text-slate-200'}`}/>)}</div>
                    </div>
                    {rev.comment && <p className="text-slate-600 text-xs leading-relaxed">{rev.comment}</p>}
                    <p className="text-slate-300 text-[10px] mt-2">{new Date(rev.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div> {/* <-- Closes Tab Content container */}

      {selectedDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-base">Document Viewer</h3>
              <div className="flex items-center gap-3">
                <a
                  href={selectedDocUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                >
                  Download / Open
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedDocUrl(null)}
                  className="p-1.5 text-slate-450 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                  aria-label="Close modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50 flex flex-col justify-center">
              {selectedDocUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={selectedDocUrl}
                  className="w-full h-[65vh] rounded-xl border border-slate-200 bg-white"
                  title="Document Viewer"
                />
              ) : (
                <div className="flex justify-center items-center h-[65vh]">
                  <img
                    src={selectedDocUrl}
                    alt="Uploaded file"
                    className="max-w-full max-h-full object-contain rounded-xl shadow-sm border border-slate-200 bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        </div>
      </main>
    </div>
  );
};

export default GuideDashboard;
