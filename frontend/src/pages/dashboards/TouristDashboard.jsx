import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocketEvent } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Calendar, CreditCard, Upload, FileText, CheckCircle2, Clock, 
  ChevronRight, AlertCircle, Star, Megaphone, Plus, Info, 
  MapPin, Compass, ArrowRight, Check, Package, Download, 
  ExternalLink, QrCode, X, Search, Filter, Phone, Mail, 
  Eye, RefreshCw, Home, ShieldCheck, Sparkles, Navigation
} from 'lucide-react';
import QRCode from 'qrcode';
import DarkModeToggle from '../../components/common/DarkModeToggle';
import SafeImage from '../../components/common/SafeImage';

const TouristDashboard = () => {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Navigation tabs: 'stays', 'tour-packages', 'itineraries', 'complaints'
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'stays');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && t !== activeTab) {
      setActiveTab(t);
    }
  }, [searchParams]);

  // Data states
  const [bookings, setBookings] = useState([]);
  const [tourPkgBookings, setTourPkgBookings] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states for stays
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');

  // Modals state
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);
  const [paymentUploadBooking, setPaymentUploadBooking] = useState(null);
  const [paymentFile, setPaymentFile] = useState(null);
  const [uploadingPayment, setUploadingPayment] = useState(false);

  // Review modal
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // QR Pass modal
  const [qrModalBooking, setQrModalBooking] = useState(null);
  const [qrModalImg, setQrModalImg] = useState('');

  // Tour package payment proof modal
  const [pkgProofModal, setPkgProofModal] = useState(null);
  const [pkgProofFile, setPkgProofFile] = useState(null);
  const [pkgProofLoading, setPkgProofLoading] = useState(false);

  // Complaint / Grievance form
  const [selectedMunId, setSelectedMunId] = useState('');
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const headers = useMemo(() => ({ 'Authorization': `Bearer ${token}` }), [token]);

  // Data Fetching Handlers
  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/inquiries', { headers });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const fetchTourPkgBookings = async () => {
    try {
      const res = await fetch('/api/tour-packages/bookings/mine', { headers });
      if (res.ok) {
        const data = await res.json();
        setTourPkgBookings(Array.isArray(data) ? data : (data.bookings || []));
      }
    } catch (err) {
      console.error('Error fetching tour package bookings:', err);
    }
  };

  const fetchItineraries = async () => {
    try {
      const res = await fetch('/api/itineraries', { headers });
      if (res.ok) {
        const data = await res.json();
        setItineraries(data || []);
      }
    } catch (err) {
      console.error('Error fetching itineraries:', err);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/complaints', { headers });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
    }
  };

  const fetchMunicipalities = async () => {
    try {
      const res = await fetch('/api/municipalities');
      if (res.ok) {
        const data = await res.json();
        setMunicipalities(data);
      }
    } catch (err) {
      console.error('Error fetching municipalities:', err);
    }
  };

  const initDashboard = async () => {
    if (!token) return;
    setLoading(true);
    await Promise.all([
      fetchBookings(),
      fetchTourPkgBookings(),
      fetchItineraries(),
      fetchComplaints(),
      fetchMunicipalities()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    initDashboard();
  }, [token]);

  // Real-time socket events
  useSocketEvent('inquiry:updated', () => {
    fetchBookings();
    showToast('Your booking inquiry status has been updated.', 'info', 4000, 'Booking Update');
  });

  useSocketEvent('complaint:updated', () => {
    fetchComplaints();
    showToast('Your municipal report has been updated by the Tourism Office.', 'info', 4000, 'Report Update');
  });

  // Action: Upload payment proof for a homestay/guide booking
  const handleUploadPaymentProof = async (e) => {
    e.preventDefault();
    if (!paymentFile || !paymentUploadBooking) {
      showToast('Please select a payment receipt image.', 'error');
      return;
    }

    setUploadingPayment(true);
    const formData = new FormData();
    formData.append('paymentProof', paymentFile);

    try {
      const res = await fetch(`/api/inquiries/${paymentUploadBooking.id}/payment`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Payment confirmation uploaded successfully! The provider has been notified.', 'success', 5000, 'Payment Submitted');
        setPaymentFile(null);
        setPaymentUploadBooking(null);
        await fetchBookings();
      } else {
        showToast(data.message || 'Failed to upload payment proof.', 'error');
      }
    } catch {
      showToast('Network error uploading payment confirmation.', 'error');
    } finally {
      setUploadingPayment(false);
    }
  };

  // Action: Submit Review
  const handleOpenReviewModal = (booking) => {
    setReviewBooking(booking);
    if (booking.homestay_id) {
      setReviewTarget({ id: booking.homestay_id, type: 'HOMESTAY', name: booking.homestay_name });
    } else if (booking.guide_id) {
      setReviewTarget({ id: booking.guide_id, type: 'GUIDE', name: booking.guide_name });
    }
    setRating(5);
    setReviewComment('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      showToast('Please select a star rating between 1 and 5.', 'error');
      return;
    }
    setSubmittingReview(true);

    const payload = {
      rating,
      comment: reviewComment,
      homestayId: reviewTarget?.type === 'HOMESTAY' ? reviewTarget.id : null,
      guideId: reviewTarget?.type === 'GUIDE' ? reviewTarget.id : null
    };

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Thank you! Your verified review has been published.', 'success', 4000, 'Review Submitted');
        setReviewBooking(null);
        setReviewTarget(null);
      } else {
        showToast(data.message || 'Failed to submit review.', 'error');
      }
    } catch {
      showToast('Network error submitting review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Action: Submit Municipal Feedback / Grievance
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!selectedMunId || !complaintTitle.trim() || !complaintDesc.trim()) {
      showToast('All fields are required to file an official report.', 'error');
      return;
    }
    setSubmittingComplaint(true);

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: complaintTitle.trim(),
          description: complaintDesc.trim(),
          municipalityId: selectedMunId
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Feedback submitted. The Municipal Tourism Desk has been officially notified.', 'success', 5000, 'Report Filed');
        setComplaintTitle('');
        setComplaintDesc('');
        setSelectedMunId('');
        await fetchComplaints();
      } else {
        showToast(data.message || 'Failed to submit feedback.', 'error');
      }
    } catch {
      showToast('Network error submitting feedback.', 'error');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Filtered Bookings for Stays & Guides tab
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesStatus = bookingStatusFilter === 'ALL' || b.status === bookingStatusFilter;
      const targetName = (b.homestay_name || b.guide_name || '').toLowerCase();
      const message = (b.message || '').toLowerCase();
      const refId = (b.id || '').toLowerCase();
      const query = bookingSearchQuery.toLowerCase().trim();
      const matchesSearch = !query || targetName.includes(query) || message.includes(query) || refId.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [bookings, bookingStatusFilter, bookingSearchQuery]);

  // Status Badge UI Helper
  const getStatusBadge = (status) => {
    const configs = {
      PENDING: {
        bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
        label: 'Pending Review',
        dot: 'bg-amber-500'
      },
      CONFIRMED: {
        bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        label: 'Confirmed',
        dot: 'bg-emerald-500'
      },
      RESPONDED: {
        bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
        label: 'Host Responded',
        dot: 'bg-blue-500'
      },
      CANCELLED: {
        bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
        label: 'Cancelled',
        dot: 'bg-rose-500'
      }
    };
    const c = configs[status] || {
      bg: 'bg-stone-500/10 text-stone-700 dark:text-stone-300 border-stone-500/30',
      label: status,
      dot: 'bg-stone-400'
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${c.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
    );
  };

  const confirmedBookingsCount = bookings.filter(b => b.status === 'CONFIRMED').length;
  const pendingPaymentsCount = bookings.filter(b => b.status === 'CONFIRMED' && !b.payment_proof_url).length;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-32 min-h-[calc(100vh-16rem)] bg-[var(--bg-app)]">
        <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-serif text-sm font-semibold text-[var(--text-secondary)]">Loading your travel workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] pb-24 transition-colors">
      
      {/* ── Top Executive Header Banner ── */}
      <div className="bg-[var(--color-forest-950)] text-[var(--color-cream-100)] pt-12 pb-16 border-b border-[var(--border-subtle)] relative overflow-hidden">
        {/* Subtle patterned background */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#C99A2E 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/10 text-[var(--color-gold-400)] text-[10px] font-bold uppercase tracking-[0.22em] px-3.5 py-1 rounded-full border border-white/10 backdrop-blur-xs">
              <Compass className="w-3.5 h-3.5 text-[var(--color-gold-400)]" />
              <span>Official Tourist Travel Hub · Abra, CAR</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
              Mabuhay, {user?.fullName || 'Traveler'}
            </h1>
            <p className="text-white/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Your centralized itinerary manager, accredited homestay reservation desk, verified tour passes, and direct municipal tourism assistance portal.
            </p>
          </div>

          <div className="flex gap-2.5 flex-wrap items-center">
            <DarkModeToggle />
            <Link 
              to="/itinerary" 
              className="btn-editorial-gold px-4 py-2.5 text-xs tracking-wider flex items-center gap-2 shadow-sm font-bold"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Expedition Planner</span>
            </Link>
            <Link 
              to="/tour-packages" 
              className="btn-editorial-outline px-4 py-2.5 text-xs text-white border-white/20 hover:bg-white/10 flex items-center gap-2 font-bold"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Tour Packages</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        
        {/* ── Key Metrics Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[
            { 
              tabId: 'stays',
              label: 'Homestays & Guides', 
              value: bookings.length, 
              subtext: `${confirmedBookingsCount} Confirmed`,
              icon: Home,
              accent: 'text-[var(--color-forest-700)]'
            },
            { 
              tabId: 'tour-packages',
              label: 'Tour Passes', 
              value: tourPkgBookings.length, 
              subtext: `${tourPkgBookings.filter(b => b.status === 'CONFIRMED').length} Active passes`,
              icon: Package,
              accent: 'text-[var(--color-gold-600)]'
            },
            { 
              tabId: 'itineraries',
              label: 'Saved Itineraries', 
              value: itineraries.length, 
              subtext: 'Custom plans',
              icon: Navigation,
              accent: 'text-blue-600 dark:text-blue-400'
            },
            { 
              tabId: 'complaints',
              label: 'Tourism Desk Inquiries', 
              value: complaints.length, 
              subtext: `${complaints.filter(c => c.status === 'RESOLVED').length} Resolved`,
              icon: Megaphone,
              accent: 'text-amber-600 dark:text-amber-400'
            }
          ].map((stat, i) => {
            const Icon = stat.icon;
            const isCurrentTab = activeTab === stat.tabId;
            return (
              <div 
                key={i} 
                onClick={() => {
                  setActiveTab(stat.tabId);
                  setSearchParams({ tab: stat.tabId });
                }}
                className={`bg-[var(--bg-card)] p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer select-none group shadow-2xs ${
                  isCurrentTab 
                    ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/10 dark:ring-[var(--color-primary)]/30' 
                    : 'border-[var(--border-subtle)] hover:border-[var(--border-app)] hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] sm:text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider truncate">
                    {stat.label}
                  </span>
                  <div className={`p-2 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] ${stat.accent} group-hover:scale-105 transition-transform`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                    {stat.value}
                  </h3>
                  <span className="text-[11px] text-[var(--text-muted)] font-medium">
                    {stat.subtext}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Main Tab Navigation ── */}
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-t-2xl shadow-2xs flex px-4 sm:px-6 space-x-2 sm:space-x-6 overflow-x-auto whitespace-nowrap scrollbar-none">
          {[
            { id: 'stays', label: 'Stays & Guide Reservations', icon: Home, count: bookings.length },
            { id: 'tour-packages', label: 'Tour Packages & QR Passes', icon: Package, count: tourPkgBookings.length },
            { id: 'itineraries', label: 'Expedition Plans', icon: Calendar, count: itineraries.length },
            { id: 'complaints', label: 'Municipal Tourism Desk', icon: Megaphone, count: complaints.length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchParams({ tab: tab.id });
                }}
                className={`py-4 border-b-2 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all flex-shrink-0 touch-target ${
                  isActive
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--color-gold)]' : ''}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isActive 
                    ? 'bg-[var(--color-primary)] text-white' 
                    : 'bg-[var(--bg-app)] text-[var(--text-secondary)]'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Tab Content Container ── */}
        <div className="bg-[var(--bg-card)] border border-t-0 border-[var(--border-subtle)] rounded-b-2xl shadow-2xs p-4 sm:p-6 lg:p-8 min-h-[500px]">
          
          {/* ══════════════════════════════════════════════════════════
              TAB 1: STAYS & GUIDE RESERVATIONS (Proper Card Architecture)
             ══════════════════════════════════════════════════════════ */}
          {activeTab === 'stays' && (
            <div className="space-y-6">
              
              {/* Header & Filter Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
                <div>
                  <h2 className="font-serif font-bold text-lg text-[var(--text-primary)]">
                    My Stays & Guide Bookings
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Official requests, confirmation vouchers, host remarks, and deposit slips.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search input */}
                  <div className="relative min-w-[200px] sm:min-w-[240px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={bookingSearchQuery}
                      onChange={(e) => setBookingSearchQuery(e.target.value)}
                      placeholder="Search homestay, guide..."
                      className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                    />
                    {bookingSearchQuery && (
                      <button 
                        onClick={() => setBookingSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <Link
                    to="/municipalities"
                    className="btn-editorial-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Book New Stay
                  </Link>
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] font-bold text-[var(--text-secondary)] flex items-center gap-1 mr-2 uppercase tracking-wider">
                  <Filter className="w-3 h-3" /> Filter:
                </span>
                {['ALL', 'CONFIRMED', 'PENDING', 'RESPONDED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setBookingStatusFilter(st)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      bookingStatusFilter === st
                        ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                        : 'bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {st === 'ALL' ? 'All Bookings' : st}
                  </button>
                ))}
              </div>

              {/* Booking Cards Grid */}
              {filteredBookings.length === 0 ? (
                <div className="text-center py-20 bg-[var(--bg-app)] rounded-2xl border border-dashed border-[var(--border-subtle)] p-6">
                  <Home className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-60" />
                  <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
                    {bookingSearchQuery || bookingStatusFilter !== 'ALL' ? 'No matching bookings found' : 'No reservations made yet'}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-sm mx-auto leading-relaxed">
                    {bookingSearchQuery || bookingStatusFilter !== 'ALL'
                      ? 'Try clearing your search query or switching your status filter.'
                      : 'Connect with accredited homestay hosts and licensed local guides across 27 municipalities in Abra.'}
                  </p>
                  <Link
                    to="/municipalities"
                    className="inline-flex items-center gap-1.5 mt-5 btn-editorial-primary text-xs px-4 py-2 font-bold"
                  >
                    Browse Directory <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {filteredBookings.map((b) => {
                    const isHomestay = !!b.homestay_id;
                    const providerName = isHomestay ? b.homestay_name : b.guide_name;
                    const dateDisplay = b.start_date
                      ? `${new Date(b.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${
                          b.end_date ? ' – ' + new Date(b.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
                        }`
                      : 'Flexible Dates';

                    return (
                      <div
                        key={b.id}
                        className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
                      >
                        {/* Card Header */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                            <span className="font-mono text-[11px] font-bold text-[var(--text-secondary)] bg-[var(--bg-app)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                              REF #{b.id.substring(0, 8).toUpperCase()}
                            </span>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(b.status)}
                            </div>
                          </div>

                          {(() => {
                            const providerImg = isHomestay ? b.homestay_image : b.guide_pic;
                            return (
                              <div className="flex items-start gap-3">
                                {providerImg ? (
                                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[var(--border-subtle)] bg-slate-100 dark:bg-stone-900 shadow-2xs">
                                    <SafeImage
                                      src={providerImg}
                                      alt={providerName}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0 text-[var(--color-primary)]">
                                    {isHomestay ? <Home className="w-6 h-6" /> : <Compass className="w-6 h-6 text-[var(--color-gold)]" />}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gold)] block">
                                    {isHomestay ? 'Accredited Homestay' : 'Certified Tour Guide'}
                                  </span>
                                  <h3 className="font-serif font-bold text-base text-[var(--text-primary)] truncate">
                                    {providerName}
                                  </h3>
                                  {b.homestay_address && (
                                    <p className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1 mt-0.5 truncate">
                                      <MapPin className="w-3 h-3 text-[var(--color-gold)] flex-shrink-0" />
                                      <span className="truncate">{b.homestay_address}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Reservation Details Pills */}
                          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                            <div className="flex items-center gap-1.5 truncate">
                              <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)] flex-shrink-0" />
                              <span className="truncate">{dateDisplay}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-medium">👥 {b.number_of_guests || 1} Guest(s)</span>
                            </div>
                            {b.total_amount && (
                              <div className="col-span-2 pt-1 font-bold text-xs text-[var(--color-primary)]">
                                Estimated Total: ₱{parseFloat(b.total_amount).toLocaleString()}
                              </div>
                            )}
                          </div>

                          {/* Tourist Inquiry Note */}
                          {b.message && (
                            <div className="mt-3 p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                              <span className="font-bold text-[10px] uppercase tracking-wider block text-[var(--text-primary)] mb-1">
                                Your Note to Host:
                              </span>
                              <p className="line-clamp-2 italic">"{b.message}"</p>
                            </div>
                          )}

                          {/* Official Host Response / Remarks Container */}
                          <div className="mt-3">
                            {b.reply_message ? (
                              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs">
                                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold mb-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Official Operator Response:</span>
                                </div>
                                <p className="text-[var(--text-primary)] font-medium leading-relaxed">
                                  "{b.reply_message}"
                                </p>
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-xl bg-[var(--bg-app)] border border-dashed border-[var(--border-subtle)] flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                <span>Awaiting response & confirmation from operator desk.</span>
                              </div>
                            )}
                          </div>

                          {/* Payment Confirmation Status */}
                          {b.status === 'CONFIRMED' && (
                            <div className="mt-3">
                              {b.payment_proof_url ? (
                                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-between text-xs">
                                  <span className="text-blue-800 dark:text-blue-300 font-semibold flex items-center gap-1.5">
                                    <Check className="w-3.5 h-3.5" /> Payment Receipt Attached
                                  </span>
                                  <a 
                                    href={b.payment_proof_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="font-bold text-[var(--color-gold)] hover:underline flex items-center gap-1 text-[11px]"
                                  >
                                    View Slip <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              ) : (
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs">
                                  <span className="text-amber-800 dark:text-amber-300 font-medium">
                                    Deposit slip pending
                                  </span>
                                  <button
                                    onClick={() => setPaymentUploadBooking(b)}
                                    className="btn-editorial-gold text-[10px] px-2.5 py-1 font-bold cursor-pointer"
                                  >
                                    Upload Receipt
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setSelectedBookingDetails(b)}
                            className="btn-editorial-outline text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </button>

                          {b.status === 'CONFIRMED' && !b.payment_proof_url && (
                            <button
                              onClick={() => setPaymentUploadBooking(b)}
                              className="btn-editorial-primary text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer font-bold"
                            >
                              <Upload className="w-3.5 h-3.5" /> Upload Deposit
                            </button>
                          )}

                          {b.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleOpenReviewModal(b)}
                              className="btn-editorial-gold text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer font-bold ml-auto"
                            >
                              <Star className="w-3.5 h-3.5" /> Review
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 2: TOUR PACKAGES & OFFICIAL QR PASSES
             ══════════════════════════════════════════════════════════ */}
          {activeTab === 'tour-packages' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-subtle)] pb-4">
                <div>
                  <h2 className="font-serif font-bold text-lg text-[var(--text-primary)]">
                    Official Tour Packages & Passes
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Municipal circuits, highland adventures, and downloadable checkpoint passes.
                  </p>
                </div>
                <Link
                  to="/tour-packages"
                  className="btn-editorial-primary text-xs px-4 py-2 flex items-center gap-1.5 font-bold"
                >
                  <Compass className="w-3.5 h-3.5" /> Explore Tour Packages
                </Link>
              </div>

              {tourPkgBookings.length === 0 ? (
                <div className="text-center py-20 px-4 bg-[var(--bg-app)] rounded-2xl border border-dashed border-[var(--border-subtle)]">
                  <Package className="w-12 h-12 text-[var(--color-gold)] mx-auto mb-3 opacity-60" />
                  <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">No Tour Package Bookings Yet</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-sm mx-auto leading-relaxed">
                    Book guided heritage circuits, Kaparkan travertine treks, and multi-municipality tour passes endorsed by the DOT.
                  </p>
                  <Link
                    to="/tour-packages"
                    className="inline-flex items-center gap-1.5 mt-4 btn-editorial-primary text-xs px-4 py-2 font-bold"
                  >
                    Browse Packages <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {tourPkgBookings.map(b => (
                    <div
                      key={b.id}
                      className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow overflow-hidden"
                    >
                      <div>
                        {b.package_image && (
                          <div className="relative h-36 -mx-5 -mt-5 mb-3.5 overflow-hidden bg-slate-100 dark:bg-stone-900">
                            <SafeImage
                              src={b.package_image}
                              alt={b.package_title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute top-2.5 left-2.5">
                              <span className="font-mono text-xs font-bold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/20">
                                PASS #{b.booking_reference}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                          {!b.package_image && (
                            <span className="font-mono text-xs font-bold text-[var(--color-forest-800)] dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                              PASS #{b.booking_reference}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 ml-auto">
                            {getStatusBadge(b.status)}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.payment_status === 'VERIFIED'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : b.payment_status === 'PROOF_SUBMITTED'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                : 'bg-stone-500/15 text-stone-700 dark:text-stone-300'
                            }`}>
                              💳 {b.payment_status?.replace(/_/g, ' ') || 'PENDING'}
                            </span>
                          </div>
                        </div>

                        <h3 className="font-serif font-bold text-base text-[var(--text-primary)] line-clamp-1">{b.package_title}</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[var(--color-gold)]" />
                          <span>{b.municipality || b.municipality_name}, Abra</span>
                        </p>

                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                          <div>📅 Date: <strong>{b.travel_date?.split('T')[0] || b.travel_date}</strong></div>
                          <div>👥 Tourists: <strong>{b.number_of_tourists} Pax</strong></div>
                          <div>🚌 Transport: <strong>{b.transport_choice}</strong></div>
                          {b.homestay_name && <div>🏠 Stay: <strong>{b.homestay_name}</strong></div>}
                        </div>

                        <div className="mt-2 text-xs font-bold text-[var(--color-primary)]">
                          Total Amount: ₱{parseFloat(b.total_amount || 0).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-subtle)] flex-wrap">
                        {/* QR Code Pass Button */}
                        <button
                          onClick={async () => {
                            setQrModalBooking(b);
                            try {
                              const qr = await QRCode.toDataURL(b.booking_reference, {
                                width: 280,
                                margin: 2,
                                color: { dark: '#09231C', light: '#FFFFFF' }
                              });
                              setQrModalImg(qr);
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="btn-editorial-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5 cursor-pointer font-bold"
                        >
                          <QrCode className="w-3.5 h-3.5" /> View QR Pass
                        </button>

                        {/* Upload Proof */}
                        {b.payment_status !== 'VERIFIED' && (
                          <button
                            onClick={() => {
                              setPkgProofModal(b);
                              setPkgProofFile(null);
                            }}
                            className="btn-editorial-gold text-xs px-3.5 py-1.5 flex items-center gap-1.5 cursor-pointer font-bold"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {b.payment_status === 'PROOF_SUBMITTED' ? 'Re-upload Receipt' : 'Upload Receipt'}
                          </button>
                        )}

                        <Link
                          to={`/tour-packages/${b.tour_package_id}`}
                          className="text-xs text-[var(--color-primary)] hover:underline font-semibold ml-auto flex items-center gap-1"
                        >
                          Details <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 3: MY EXPEDITIONS & SAVED ITINERARIES
             ══════════════════════════════════════════════════════════ */}
          {activeTab === 'itineraries' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-subtle)] pb-4">
                <div>
                  <h2 className="font-serif font-bold text-lg text-[var(--text-primary)]">
                    My Expedition Plans & Travel Journal
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Tailored multi-day schedules, routes, and saved itineraries across the province.
                  </p>
                </div>
                <Link
                  to="/itinerary"
                  className="btn-editorial-primary text-xs px-4 py-2 flex items-center gap-1.5 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" /> Open Itinerary Planner
                </Link>
              </div>

              {itineraries.length === 0 ? (
                <div className="text-center py-20 px-4 bg-[var(--bg-app)] rounded-2xl border border-dashed border-[var(--border-subtle)]">
                  <Navigation className="w-12 h-12 text-[var(--color-primary)] mx-auto mb-3 opacity-60" />
                  <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">No Custom Itineraries Yet</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-sm mx-auto leading-relaxed">
                    Build your custom Abra journey with attractions, homestays, and certified guides across 27 municipalities.
                  </p>
                  <Link
                    to="/itinerary"
                    className="inline-flex items-center gap-1.5 mt-4 btn-editorial-primary text-xs px-4 py-2 font-bold"
                  >
                    Start Planning <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {itineraries.map((itin) => (
                    <div
                      key={itin.id}
                      className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold text-[var(--color-gold)] uppercase tracking-wider">
                            Custom Expedition
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {new Date(itin.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
                          {itin.title}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                          {itin.description || 'No description provided.'}
                        </p>
                        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                          <span>
                            {itin.start_date ? new Date(itin.start_date).toLocaleDateString() : 'TBD'}
                            {itin.end_date ? ` – ${new Date(itin.end_date).toLocaleDateString()}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[var(--border-subtle)]">
                        <Link
                          to="/itinerary"
                          className="btn-editorial-outline w-full py-2 text-xs flex items-center justify-center gap-1.5 font-bold"
                        >
                          View in Planner <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 4: MUNICIPAL TOURISM DESK & FEEDBACK
             ══════════════════════════════════════════════════════════ */}
          {activeTab === 'complaints' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form to submit feedback or report */}
              <div className="lg:col-span-1 border border-[var(--border-subtle)] p-6 rounded-2xl bg-[var(--bg-app)] h-fit space-y-4">
                <div className="flex items-center gap-1.5 text-[var(--color-gold)] font-bold text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" />
                  Official Grievance Desk
                </div>
                <h3 className="font-serif font-bold text-[var(--text-primary)] text-base border-b border-[var(--border-subtle)] pb-2">
                  File Feedback or Official Report
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Your reports are routed directly to the designated Tourism Officer of that municipality for official investigation.
                </p>
                
                <form onSubmit={handleSubmitComplaint} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Target Municipality *</label>
                    <select
                      required
                      value={selectedMunId}
                      onChange={e => setSelectedMunId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      <option value="">-- Select Municipality in Abra --</option>
                      {municipalities.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Subject Title *</label>
                    <input
                      type="text"
                      required
                      value={complaintTitle}
                      onChange={e => setComplaintTitle(e.target.value)}
                      placeholder="e.g. Rate discrepancy, trail safety signage..."
                      className="w-full px-3.5 py-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] placeholder-[var(--text-muted)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Detailed Explanation *</label>
                    <textarea
                      required
                      rows="4"
                      value={complaintDesc}
                      onChange={e => setComplaintDesc(e.target.value)}
                      placeholder="Include dates, specific sites, or provider names to expedite official municipal resolution..."
                      className="w-full px-3.5 py-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none placeholder-[var(--text-muted)]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingComplaint}
                    className="w-full py-2.5 btn-editorial-primary text-xs tracking-wider cursor-pointer font-bold disabled:opacity-50"
                  >
                    {submittingComplaint ? 'Submitting Report...' : 'File Official Report'}
                  </button>
                </form>
              </div>

              {/* List of submitted reports */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                  <h2 className="font-serif font-bold text-[var(--text-primary)] text-lg">My Submitted Reports ({complaints.length})</h2>
                  <span className="text-xs text-[var(--text-secondary)]">Filed with Municipal Tourism Desks</span>
                </div>

                {complaints.length === 0 ? (
                  <div className="text-center py-16 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-subtle)]">
                    <Megaphone className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-2 opacity-60" />
                    <h3 className="font-serif font-bold text-[var(--text-primary)] text-sm">No reports filed</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                      Thank you for helping keep Abra safe, ethical, and hospitable for all travelers.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {complaints.map((c) => {
                      const isPending = c.status === 'PENDING';
                      return (
                        <div key={c.id} className="border border-[var(--border-subtle)] rounded-2xl p-5 bg-[var(--bg-card)] space-y-3">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                              isPending 
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30' 
                                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            }`}>
                              {c.status}
                            </span>
                            <span className="text-[10px] text-[var(--text-secondary)]">
                              Filed on {new Date(c.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <h4 className="font-serif font-bold text-[var(--text-primary)] text-base">{c.title}</h4>
                          <div className="text-[11px] text-[var(--color-gold)] font-bold uppercase tracking-wider flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {c.municipality_name} Municipality
                          </div>

                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl p-3.5">
                            {c.description}
                          </p>

                          {c.resolution_details ? (
                            <div className="p-3.5 border border-emerald-500/30 bg-emerald-500/10 rounded-xl space-y-1">
                              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                                <CheckCircle2 className="w-4 h-4" />
                                Official Municipal Resolution:
                              </div>
                              <p className="text-xs text-[var(--text-primary)] font-medium">"{c.resolution_details}"</p>
                              {c.resolved_at && (
                                <div className="text-[10px] text-[var(--text-secondary)] pt-1 text-right">
                                  Resolved on {new Date(c.resolved_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 w-fit">
                              <Clock className="w-3.5 h-3.5 flex-shrink-0" /> 
                              Under active review by {c.municipality_name} Tourism Officers.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODAL 1: RESERVATION DETAILS & INVOICE SUMMARY
         ══════════════════════════════════════════════════════════ */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-2xl border border-[var(--border-subtle)] max-w-lg w-full relative animate-fadeIn space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-3">
                {(() => {
                  const modalImg = selectedBookingDetails.homestay_image || selectedBookingDetails.guide_pic;
                  if (!modalImg) return null;
                  return (
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[var(--border-subtle)] bg-slate-100 dark:bg-stone-900 shadow-2xs">
                      <SafeImage
                        src={modalImg}
                        alt={selectedBookingDetails.homestay_name || selectedBookingDetails.guide_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                })()}
                <div>
                  <span className="text-[10px] font-bold text-[var(--color-gold)] uppercase tracking-wider block">
                    Reservation Voucher
                  </span>
                  <h3 className="font-serif font-bold text-lg text-[var(--text-primary)]">
                    {selectedBookingDetails.homestay_name || selectedBookingDetails.guide_name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[var(--bg-app)] p-3.5 rounded-xl border border-[var(--border-subtle)]">
                <div>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Reference:</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">#{selectedBookingDetails.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Status:</span>
                  <span>{getStatusBadge(selectedBookingDetails.status)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Schedule:</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {selectedBookingDetails.start_date ? new Date(selectedBookingDetails.start_date).toLocaleDateString() : 'Flexible'}
                    {selectedBookingDetails.end_date ? ` – ${new Date(selectedBookingDetails.end_date).toLocaleDateString()}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Party Size:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{selectedBookingDetails.number_of_guests || 1} Person(s)</span>
                </div>
              </div>

              {/* Direct Provider Contacts (Phone/Email) */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  Direct Provider Contacts
                </span>
                {selectedBookingDetails.homestay_phone || selectedBookingDetails.guide_phone ? (
                  <p className="flex items-center gap-2 text-[var(--text-primary)]">
                    <Phone className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <span>{selectedBookingDetails.homestay_phone || selectedBookingDetails.guide_phone}</span>
                  </p>
                ) : null}
                {selectedBookingDetails.homestay_email || selectedBookingDetails.guide_email ? (
                  <p className="flex items-center gap-2 text-[var(--text-primary)]">
                    <Mail className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <span>{selectedBookingDetails.homestay_email || selectedBookingDetails.guide_email}</span>
                  </p>
                ) : null}
                {selectedBookingDetails.homestay_address && (
                  <p className="flex items-center gap-2 text-[var(--text-primary)]">
                    <MapPin className="w-3.5 h-3.5 text-[var(--color-gold)]" />
                    <span>{selectedBookingDetails.homestay_address}</span>
                  </p>
                )}
              </div>

              {/* Notes & Messages */}
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                  <span className="font-bold text-[10px] text-[var(--text-muted)] uppercase block mb-1">
                    Your Inquired Requests:
                  </span>
                  <p className="text-[var(--text-secondary)] italic">
                    "{selectedBookingDetails.message}"
                  </p>
                </div>

                {selectedBookingDetails.reply_message && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <span className="font-bold text-[10px] text-emerald-800 dark:text-emerald-300 uppercase block mb-1">
                      Official Operator Confirmation & Instructions:
                    </span>
                    <p className="text-[var(--text-primary)] font-medium">
                      "{selectedBookingDetails.reply_message}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="btn-editorial-primary text-xs px-5 py-2 font-bold cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL 2: UPLOAD PAYMENT RECEIPT SLIP
         ══════════════════════════════════════════════════════════ */}
      {paymentUploadBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-2xl border border-[var(--border-subtle)] max-w-md w-full relative animate-fadeIn space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[var(--color-gold)] uppercase tracking-wider block">
                  Deposit Confirmation
                </span>
                <h3 className="font-serif font-bold text-lg text-[var(--text-primary)]">
                  Upload Payment Slip
                </h3>
              </div>
              <button
                onClick={() => { setPaymentUploadBooking(null); setPaymentFile(null); }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[var(--text-secondary)] space-y-1 bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border-subtle)]">
              <div><strong>Provider:</strong> {paymentUploadBooking.homestay_name || paymentUploadBooking.guide_name}</div>
              <div><strong>Reference ID:</strong> #{paymentUploadBooking.id.substring(0, 8).toUpperCase()}</div>
              {paymentUploadBooking.total_amount && (
                <div><strong>Payable Amount:</strong> ₱{parseFloat(paymentUploadBooking.total_amount).toLocaleString()}</div>
              )}
            </div>

            <form onSubmit={handleUploadPaymentProof} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                  GCash / Bank Transfer Receipt Image *
                </label>
                <input
                  required
                  type="file"
                  accept="image/*"
                  onChange={e => setPaymentFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[var(--text-secondary)] file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:opacity-90 cursor-pointer"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={uploadingPayment || !paymentFile}
                  className="btn-editorial-primary text-xs px-4 py-2.5 flex-1 cursor-pointer font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingPayment ? 'Uploading Receipt...' : 'Submit Payment Proof'}
                </button>
                <button
                  type="button"
                  onClick={() => { setPaymentUploadBooking(null); setPaymentFile(null); }}
                  className="btn-editorial-ghost text-xs px-4 py-2.5 cursor-pointer font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL 3: OPERATOR REVIEW MODAL
         ══════════════════════════════════════════════════════════ */}
      {reviewBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-2xl border border-[var(--border-subtle)] max-w-md w-full relative animate-fadeIn space-y-4">
            <div>
              <span className="text-[10px] font-bold text-[var(--color-gold)] uppercase tracking-wider block">
                Official Review & Rating
              </span>
              <h3 className="font-serif font-bold text-lg text-[var(--text-primary)]">
                Review {reviewTarget?.name}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Help other tourists by sharing your experience on hospitality, punctuality, and cultural authenticity.
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-2">Rating (1 to 5 Stars) *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star 
                        className={`w-7 h-7 ${star <= rating ? 'text-[var(--color-gold)] fill-[var(--color-gold)]' : 'text-[var(--border-strong)]'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Feedback Comments</label>
                <textarea
                  rows="3"
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Share details regarding guide knowledge, room cleanliness, local food, or safety..."
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none placeholder-[var(--text-muted)]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-editorial-primary text-xs px-4 py-2.5 flex-1 cursor-pointer font-bold disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting Review...' : 'Publish Verified Review'}
                </button>
                <button
                  type="button"
                  onClick={() => { setReviewBooking(null); setReviewTarget(null); }}
                  className="btn-editorial-ghost text-xs px-4 py-2.5 cursor-pointer font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL 4: QR CODE TOUR VERIFICATION PASS
         ══════════════════════════════════════════════════════════ */}
      {qrModalBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-2xl border border-[var(--border-subtle)] max-w-sm w-full text-center space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
              <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">Tour Verification Pass</h3>
              <button
                onClick={() => { setQrModalBooking(null); setQrModalImg(''); }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/20">
                {qrModalBooking.booking_reference}
              </span>
              <p className="font-serif font-bold text-sm text-[var(--text-primary)] pt-1">{qrModalBooking.package_title}</p>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Travel Date: {qrModalBooking.travel_date?.split('T')[0] || qrModalBooking.travel_date} ({qrModalBooking.number_of_tourists} Pax)
              </p>
            </div>

            {qrModalImg && (
              <div className="p-3 bg-white rounded-xl border border-[var(--border-subtle)] inline-block shadow-inner">
                <img src={qrModalImg} alt="QR Pass" className="w-48 h-48 mx-auto rounded-lg" />
                <p className="text-[10px] text-stone-500 font-mono mt-1">Official Municipal / Provincial Tourism Pass</p>
              </div>
            )}

            <div className="pt-2">
              <a
                href={qrModalImg}
                download={`Abra-Tour-Pass-${qrModalBooking.booking_reference}.png`}
                className="btn-editorial-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer font-bold"
              >
                <Download className="w-4 h-4" /> Download QR Pass
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL 5: TOUR PACKAGE PAYMENT PROOF
         ══════════════════════════════════════════════════════════ */}
      {pkgProofModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-2xl border border-[var(--border-subtle)] max-w-md w-full space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
              <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">Upload Tour Payment Proof</h3>
              <button
                onClick={() => { setPkgProofModal(null); setPkgProofFile(null); }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[var(--text-secondary)] space-y-1.5 bg-[var(--bg-app)] p-3.5 rounded-xl border border-[var(--border-subtle)]">
              <div><strong>Booking Ref:</strong> {pkgProofModal.booking_reference}</div>
              <div><strong>Package:</strong> {pkgProofModal.package_title}</div>
              <div><strong>Payable Amount:</strong> ₱{parseFloat(pkgProofModal.total_amount || 0).toLocaleString()}</div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!pkgProofFile || !pkgProofModal) return;
                setPkgProofLoading(true);
                try {
                  const fd = new FormData();
                  fd.append('proof_image', pkgProofFile);
                  const res = await fetch(`/api/tour-packages/bookings/${pkgProofModal.id}/payment-proof`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: fd,
                  });
                  const d = await res.json();
                  if (res.ok) {
                    showToast('Proof of payment submitted for Tourism Office verification.', 'success', 5000, 'Proof Submitted');
                    setPkgProofModal(null);
                    setPkgProofFile(null);
                    await fetchTourPkgBookings();
                  } else {
                    showToast(d.message || 'Failed to upload proof', 'error');
                  }
                } catch {
                  showToast('Network error uploading proof', 'error');
                } finally {
                  setPkgProofLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">Payment Receipt Image *</label>
                <input
                  required
                  type="file"
                  accept="image/*"
                  onChange={e => setPkgProofFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[var(--text-secondary)] file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:opacity-90 cursor-pointer"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={pkgProofLoading || !pkgProofFile}
                  className="btn-editorial-primary text-xs px-4 py-2.5 flex-1 cursor-pointer font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {pkgProofLoading ? 'Uploading...' : 'Submit Receipt'}
                </button>
                <button
                  type="button"
                  onClick={() => { setPkgProofModal(null); setPkgProofFile(null); }}
                  className="btn-editorial-ghost text-xs px-4 py-2.5 cursor-pointer font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TouristDashboard;
