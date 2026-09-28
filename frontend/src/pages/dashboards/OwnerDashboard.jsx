import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { useSocketEvent } from '../../context/SocketContext';
import Swal from 'sweetalert2';
import {
  Home, FileText, Bed, CalendarCheck, Calendar, Users,
  CreditCard, Star, Upload, CheckCircle, AlertTriangle, Trash2,
  User, Compass, Eye, Menu, X, ArrowUpRight, ShieldCheck,
  Search, Check, RefreshCw, Phone, Mail, DollarSign, Clock,
  MapPin, ChevronRight, Award, MessageSquareOff
} from 'lucide-react';
import SafeImage, { formatMediaUrl } from '../../components/common/SafeImage';
import DarkModeToggle from '../../components/common/DarkModeToggle';
import DocumentViewerModal from '../../components/common/DocumentViewerModal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const OwnerDashboard = () => {
  const { token, user, logout } = useAuth();
  const { showAlert } = useAlert();
  const [searchParams, setSearchParams] = useSearchParams();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Normalize tab param (map legacy 'inquiries' or 'guests' to 'bookings')
  const getInitialTab = () => {
    const t = searchParams.get('tab');
    if (!t) return 'overview';
    if (t === 'inquiries' || t === 'guests') return 'bookings';
    return t;
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) {
      const normalized = (t === 'inquiries' || t === 'guests') ? 'bookings' : t;
      if (normalized !== activeTab) {
        setActiveTab(normalized);
      }
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDocUrl, setSelectedDocUrl] = useState(null);

  // Profile forms state
  const [hsName, setHsName] = useState('');
  const [hsDesc, setHsDesc] = useState('');
  const [hsAddress, setHsAddress] = useState('');
  const [hsPhone, setHsPhone] = useState('');
  const [hsEmail, setHsEmail] = useState('');
  const [hsLat, setHsLat] = useState('');
  const [hsLng, setHsLng] = useState('');

  // Room form state
  const [roomType, setRoomType] = useState('Private Room');
  const [roomPrice, setRoomPrice] = useState('');
  const [roomCapacity, setRoomCapacity] = useState('1');
  const [roomDesc, setRoomDesc] = useState('');

  // Room image state
  const [roomImageFiles, setRoomImageFiles] = useState({}); // { roomId: FileList }
  const [roomImageUploading, setRoomImageUploading] = useState({}); // { roomId: bool }
  const [expandedRoomId, setExpandedRoomId] = useState(null); // which room is expanded for images

  // Booking management state (NO CHAT - modeled directly after GuideDashboard)
  const [bookingFilter, setBookingFilter] = useState('ALL');
  const [searchBookingQuery, setSearchBookingQuery] = useState('');
  const [selectedBookingForAction, setSelectedBookingForAction] = useState(null);
  const [actionModalType, setActionModalType] = useState(null); // 'CONFIRM' | 'RESPOND' | 'DECLINE' | 'DETAILS'
  const [actionRemarks, setActionRemarks] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Calendar State
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  // Fetch full dashboard dataset
  const fetchProfileAndRequirements = useCallback(async (isRefresh = false) => {
    if (!token || !user) return;
    if (isRefresh) setRefreshing(true);
    try {
      // 1. Fetch profile
      const userRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (userRes.ok) {
        const uData = await userRes.json();
        setProfile(uData.profile);
        if (uData.profile) {
          setHsName(uData.profile.name || '');
          setHsDesc(uData.profile.description || '');
          setHsAddress(uData.profile.address || '');
          setHsPhone(uData.profile.contact_phone || '');
          setHsEmail(uData.profile.contact_email || '');
          setHsLat(uData.profile.latitude !== null && uData.profile.latitude !== undefined ? uData.profile.latitude : '');
          setHsLng(uData.profile.longitude !== null && uData.profile.longitude !== undefined ? uData.profile.longitude : '');
        }
      }

      // 2. Fetch accreditation requirements of owner's municipality
      if (user.municipalityId) {
        const reqRes = await fetch(`/api/requirements/municipality/${user.municipalityId}?targetType=HOMESTAY`, {
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
        setInquiries(Array.isArray(inqData) ? inqData : []);
      }

      // 5. Fetch reviews received
      const revRes = await fetch('/api/reviews/received', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (revRes.ok) {
        const revData = await revRes.json();
        setReceivedReviews(Array.isArray(revData) ? revData : []);
      }
    } catch (err) {
      console.error('Error fetching homestay dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchProfileAndRequirements();
  }, [fetchProfileAndRequirements]);

  // Real-time live dashboard sync
  useSocketEvent('account:status_changed', () => {
    fetchProfileAndRequirements();
  });
  useSocketEvent('inquiry:new', () => {
    fetchProfileAndRequirements();
  });
  useSocketEvent('inquiry:updated', () => {
    fetchProfileAndRequirements();
  });
  useSocketEvent('review:new', () => {
    fetchProfileAndRequirements();
  });

  // Accreditation stats
  const isApproved = profile?.status === 'APPROVED';
  const requiredCount = requirements.filter(r => r.is_required).length;
  const endorsedCount = submissions.filter(s => s.status === 'ENDORSED' || s.status === 'APPROVED').length;
  const accreditationPercent = requiredCount > 0 ? Math.round((endorsedCount / requiredCount) * 100) : (isApproved ? 100 : 0);

  // Booking stats
  const pendingBookingsCount = inquiries.filter(i => i.status === 'PENDING').length;
  const confirmedBookings = inquiries.filter(i => i.status === 'CONFIRMED');
  const confirmedBookingsCount = confirmedBookings.length;
  const upcomingGuests = confirmedBookings
    .filter(b => b.start_date && new Date(b.start_date) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a,b) => new Date(a.start_date) - new Date(b.start_date));

  // Reviews
  const avgRating = receivedReviews.length > 0
    ? (receivedReviews.reduce((s, r) => s + r.rating, 0) / receivedReviews.length).toFixed(1)
    : null;

  // Rooms count and lowest price
  const roomsList = profile?.rooms || [];
  const lowestRate = roomsList.length > 0
    ? Math.min(...roomsList.map(r => parseFloat(r.price_per_night) || 0))
    : 0;

  // Filtered bookings list (NO CHAT)
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

  // Submit Booking Action (Confirm, Respond with Instructions, or Decline)
  const handleExecuteBookingAction = async () => {
    if (!selectedBookingForAction || !actionModalType) return;
    setProcessingAction(true);

    let status = 'CONFIRMED';
    let defaultMsg = 'Your homestay booking has been confirmed! We look forward to hosting you.';

    if (actionModalType === 'RESPOND') {
      status = 'RESPONDED';
      defaultMsg = 'We have received your reservation request. Please note our check-in guidelines and feel free to reach out.';
    } else if (actionModalType === 'DECLINE') {
      status = 'CANCELLED';
      defaultMsg = 'Sorry, we are unable to accommodate your reservation dates at this time.';
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
        else if (actionModalType === 'DECLINE') showAlert('Reservation request declined.', 'info');
        else showAlert('Remarks updated and sent to guest.', 'success');

        setActionModalType(null);
        setSelectedBookingForAction(null);
        setActionRemarks('');
        await fetchProfileAndRequirements();
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

  // Direct Booking Confirm / Decline helpers
  const handleConfirmBooking = async (id) => {
    try {
      const r = await fetch(`/api/inquiries/reply/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ replyMessage: 'Your booking has been confirmed! We look forward to hosting you.', status: 'CONFIRMED' }),
      });
      if (r.ok) {
        showAlert('Booking confirmed!', 'success');
        await fetchProfileAndRequirements();
      }
    } catch (err) {
      console.error(err);
      showAlert('Failed to confirm booking.', 'error');
    }
  };

  const handleCancelBooking = async (id) => {
    const res = await Swal.fire({
      title: 'Decline Reservation?',
      text: 'Do you want to decline this booking request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, decline',
      cancelButtonText: 'Keep Request',
      customClass: { popup: 'rounded-3xl' }
    });
    if (!res.isConfirmed) return;

    try {
      const r = await fetch(`/api/inquiries/reply/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ replyMessage: 'We are sorry, your booking request has been cancelled.', status: 'CANCELLED' }),
      });
      if (r.ok) {
        showAlert('Booking declined.', 'info');
        await fetchProfileAndRequirements();
      }
    } catch (err) {
      console.error(err);
      showAlert('Failed to cancel booking.', 'error');
    }
  };

  // Calendar calculations
  const buildCalendarDays = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const bookedDates = new Set();
    confirmedBookings.forEach(b => {
      if (!b.start_date) return;
      const start = new Date(b.start_date);
      const end = b.end_date ? new Date(b.end_date) : new Date(b.start_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getFullYear() === calendarYear && d.getMonth() === calendarMonth) {
          bookedDates.add(d.getDate());
        }
      }
    });
    return { firstDay, daysInMonth, bookedDates };
  };

  // Geolocation detection
  const handleDetectHomestayCoords = () => {
    if (!navigator.geolocation) {
      showAlert('Geolocation is not supported by your browser.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setHsLat(pos.coords.latitude.toFixed(6));
        setHsLng(pos.coords.longitude.toFixed(6));
        showAlert('GPS coordinates detected successfully!', 'success');
      },
      () => {
        showAlert('Failed to acquire location. Please enter latitude & longitude manually.', 'error');
      }
    );
  };

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/listings/homestay', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: hsName,
          description: hsDesc,
          address: hsAddress,
          contactPhone: hsPhone,
          contactEmail: hsEmail,
          latitude: hsLat ? parseFloat(hsLat) : null,
          longitude: hsLng ? parseFloat(hsLng) : null
        })
      });

      if (response.ok) {
        showAlert('Homestay profile updated successfully.', 'success');
        await fetchProfileAndRequirements();
      } else {
        showAlert('Failed to update profile.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Network error updating profile.', 'error');
    }
  };

  // Accreditation document file upload
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
        showAlert('Document uploaded successfully for DOT evaluation.', 'success');
        await fetchProfileAndRequirements();
      } else {
        const err = await response.json().catch(() => ({}));
        showAlert(err.message || 'File upload failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Upload network error.', 'error');
    }
  };

  // Homestay photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('isFeatured', true);
    formData.append('image', file);

    try {
      const response = await fetch('/api/listings/homestay/images', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        showAlert('Photo uploaded and added to your gallery.', 'success');
        await fetchProfileAndRequirements();
      } else {
        showAlert('Photo upload failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Upload network error.', 'error');
    }
  };

  // Delete photo
  const handleDeletePhoto = async (photoId) => {
    const result = await Swal.fire({
      title: 'Delete Photo?',
      text: 'Do you want to delete this photo from your gallery?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-3xl' }
    });
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/listings/homestay/images/${photoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        showAlert('Photo removed.', 'info');
        await fetchProfileAndRequirements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add room / sleeping space
  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!roomPrice) return;

    try {
      const response = await fetch('/api/listings/homestay/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          roomType,
          pricePerNight: parseFloat(roomPrice),
          capacity: parseInt(roomCapacity),
          description: roomDesc
        })
      });

      if (response.ok) {
        setRoomPrice('');
        setRoomDesc('');
        showAlert('Sleeping space added successfully.', 'success');
        await fetchProfileAndRequirements();
      } else {
        showAlert('Failed to save room.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Network error saving room.', 'error');
    }
  };

  // Delete room
  const handleDeleteRoom = async (roomId) => {
    const result = await Swal.fire({
      title: 'Remove Sleeping Space?',
      text: 'Do you want to delete this room configuration?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-3xl' }
    });
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/listings/homestay/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        showAlert('Sleeping space removed.', 'info');
        await fetchProfileAndRequirements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upload multiple room images
  const handleRoomImageUpload = async (roomId) => {
    const files = roomImageFiles[roomId];
    if (!files || files.length === 0) return;
    setRoomImageUploading(prev => ({ ...prev, [roomId]: true }));
    let successCount = 0;
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append('roomImage', file);
        const res = await fetch(`/api/listings/homestay/rooms/${roomId}/images`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd
        });
        if (res.ok) successCount++;
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
    setRoomImageUploading(prev => ({ ...prev, [roomId]: false }));
    setRoomImageFiles(prev => ({ ...prev, [roomId]: null }));
    if (successCount > 0) {
      showAlert(`${successCount} photo(s) uploaded successfully.`, 'success');
      await fetchProfileAndRequirements();
    } else {
      showAlert('Failed to upload photos.', 'error');
    }
  };

  // Delete a single room image
  const handleDeleteRoomImage = async (imageId) => {
    try {
      const res = await fetch(`/api/listings/room-images/${imageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showAlert('Photo removed.', 'info');
        await fetchProfileAndRequirements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Owner Sidebar Navigation Tabs (identical clean structure to GuideDashboard)
  const ownerTabs = [
    { id: 'overview', label: 'Host Overview', icon: Compass, badge: 0 },
    {
      id: 'documents',
      label: 'Accreditation Docs',
      icon: FileText,
      badge: requirements.length > 0 && endorsedCount < requiredCount ? (requiredCount - endorsedCount) : 0,
      badgeColor: 'bg-amber-400 text-slate-900'
    },
    { id: 'profile', label: 'Homestay Details & Photos', icon: Home, badge: 0 },
    {
      id: 'rooms',
      label: 'Sleeping Arrangements',
      icon: Bed,
      badge: profile?.rooms?.length || 0,
      badgeColor: 'bg-emerald-600 text-white'
    },
    {
      id: 'bookings',
      label: 'Homestay Bookings',
      icon: CalendarCheck,
      badge: pendingBookingsCount,
      badgeColor: 'bg-rose-500 text-white'
    },
    { id: 'calendar', label: 'Availability Calendar', icon: Calendar, badge: 0 },
    { id: 'payments', label: 'Payment Tracking', icon: CreditCard, badge: 0 },
    {
      id: 'reviews',
      label: 'Guest Reviews',
      icon: Star,
      badge: receivedReviews.length,
      badgeColor: 'bg-emerald-500 text-white'
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-28 min-h-screen bg-[var(--bg-app,#F7F8F6)] text-slate-600">
        <div className="w-12 h-12 border-4 border-[#153325] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-serif font-bold text-sm tracking-wide text-[#153325]">
          Loading Abra Homestay Host Portal...
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
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0F261C] text-white flex flex-col justify-between border-r border-[#1D4433] shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex-shrink-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Masthead */}
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
                  Homestay Host Portal
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
          <div className="px-5 py-3 bg-black/25 border-b border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-white/80 flex items-center gap-2 font-mono truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {user?.municipalityName || 'Abra'} Host Desk
            </span>
            <Link to="/" className="text-[#B88B2A] hover:underline flex items-center gap-1 font-semibold flex-shrink-0">
              Live Site <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="p-3 space-y-1 flex-1">
            <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B88B2A]/90">
              Host Operations
            </div>
            {ownerTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#B88B2A] text-[#153325] font-bold shadow-md'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#153325]' : 'text-[#B88B2A]'}`} />
                  <span className="flex-1 truncate">{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tab.badgeColor || 'bg-amber-400 text-slate-900'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Accreditation Quick Pill in Sidebar */}
          <div className="px-4 py-3 border-t border-white/10 bg-black/15">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-white/60">DOT Accreditation</span>
              <span className={`font-bold ${isApproved ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isApproved ? 'Accredited' : `${accreditationPercent}% Verified`}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isApproved ? 'bg-emerald-400' : 'bg-amber-400'}`}
                style={{ width: `${isApproved ? 100 : Math.max(15, accreditationPercent)}%` }}
              />
            </div>
          </div>

          {/* Bottom Sidebar: Host Profile Card */}
          <div className="p-4 border-t border-white/10 space-y-2 bg-[#0A1A13]">
            <div className="bg-black/30 rounded-xl p-3 flex items-center justify-between border border-white/5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#B88B2A]/20 border border-[#B88B2A]/40 flex items-center justify-center font-bold font-serif text-[#B88B2A] text-xs flex-shrink-0">
                  {profile?.images?.[0]?.image_url ? (
                    <img src={formatMediaUrl(profile.images[0].image_url)} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.fullName?.charAt(0) || 'H'
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{profile?.name || user?.fullName || 'Homestay Host'}</p>
                  <p className="text-[10px] text-white/50 truncate font-mono">{user?.municipalityName || 'Abra'}</p>
                </div>
              </div>
              {logout && (
                <button
                  onClick={logout}
                  title="Sign out of portal"
                  className="text-white/50 hover:text-rose-300 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-xs font-semibold"
                >
                  Exit
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Work Area ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-[var(--bg-card,#FFFFFF)]/95 backdrop-blur-md border-b border-[var(--border-app,#E5E7EB)] px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-[var(--border-app,#E5E7EB)] text-[#153325] hover:bg-black/5 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B88B2A]">
                  Verified Accommodation · {user?.municipalityName || 'Province of Abra'}
                </span>
              </div>
              <h1 className="font-serif text-lg sm:text-2xl font-bold text-[#153325] dark:text-[#E2ECE5]">
                {ownerTabs.find(t => t.id === activeTab)?.label || 'Overview'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Data button */}
            <button
              onClick={() => fetchProfileAndRequirements(true)}
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
                  <span>Accredited Homestay ✓</span>
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
        <div className="p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">

          {/* ══════════════════════════════════════════════════════════
              TAB 1: HOST PORTAL OVERVIEW
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
                      {isApproved ? 'Officially Accredited Homestay' : 'Accreditation Review in Progress'}
                    </h2>
                    <p className="text-white/80 text-xs max-w-2xl leading-relaxed">
                      {isApproved
                        ? 'Your accommodation has been fully endorsed by the Municipal DOT of ' + (user?.municipalityName || 'Abra') + ' and verified by the Provincial Tourism Office. Your homestay is officially listed for verified tourist reservations.'
                        : `You have submitted ${endorsedCount} of ${requiredCount} required accreditation clearances. Upload all documents requested by your Municipal DOT to receive municipal endorsement.`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleTabChange('documents')}
                      className="px-4 py-2.5 bg-[#B88B2A] hover:bg-[#A37B24] text-[#153325] font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
                    >
                      {isApproved ? 'View Accreditation Files' : 'Complete Documents'}
                    </button>
                    <button
                      onClick={() => handleTabChange('profile')}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 cursor-pointer transition-colors"
                    >
                      Homestay Dossier
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
                {/* 1. Confirmed Bookings */}
                <div
                  onClick={() => { setBookingFilter('CONFIRMED'); handleTabChange('bookings'); }}
                  className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl p-5 shadow-xs transition-colors cursor-pointer hover:border-emerald-600"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Confirmed Bookings
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="font-serif text-3xl font-bold text-[#153325] dark:text-[#E2ECE5]">
                    {confirmedBookingsCount}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {upcomingGuests.length} upcoming scheduled stay{upcomingGuests.length !== 1 ? 's' : ''}
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
                      Guest Rating
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
                    Based on {receivedReviews.length} guest review{receivedReviews.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* 4. Sleeping Spaces */}
                <div
                  onClick={() => handleTabChange('rooms')}
                  className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl p-5 shadow-xs transition-colors cursor-pointer hover:border-emerald-600"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Sleeping Spaces
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#153325]/10 text-[#153325] dark:text-emerald-400 flex items-center justify-center">
                      <Bed className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="font-serif text-3xl font-bold text-[#153325] dark:text-[#E2ECE5]">
                    {roomsList.length}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {lowestRate > 0 ? `Starting from ₱${lowestRate.toLocaleString()} / night` : 'Configure room types'}
                  </p>
                </div>
              </div>

              {/* Next Upcoming Guest Highlight & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Guest or Next Check-in */}
                <div className="lg:col-span-2 bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-serif font-bold text-[#153325] dark:text-[#E2ECE5] text-base">
                        Upcoming Confirmed Guest Check-ins
                      </h3>
                      <p className="text-xs text-slate-500">
                        Scheduled tourist stays confirmed on your availability calendar
                      </p>
                    </div>
                    <button
                      onClick={() => handleTabChange('calendar')}
                      className="text-xs font-bold text-[#B88B2A] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      View Calendar <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {upcomingGuests.length === 0 ? (
                    <div className="py-10 text-center border border-dashed border-[var(--border-app,#E5E7EB)] rounded-xl bg-[var(--bg-app,#F7F8F6)] p-6">
                      <CalendarCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-bold text-[#153325] dark:text-[#E2ECE5]">No Upcoming Confirmed Stays</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        When guests book your homestay and you confirm their reservation, their arrival dates and vouchers will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingGuests.slice(0, 3).map((b) => (
                        <div
                          key={b.id}
                          className="p-4 rounded-xl border border-[var(--border-app,#E5E7EB)] bg-[var(--bg-app,#F7F8F6)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#153325]/10 text-[#153325] dark:text-emerald-400 font-bold flex items-center justify-center shrink-0">
                              {(b.tourist_name || 'G')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-[#153325] dark:text-[#E2ECE5]">{b.tourist_name}</p>
                              <p className="text-xs text-slate-500">
                                📅 {b.start_date ? new Date(b.start_date).toLocaleDateString() : 'Dates Flexible'}
                                {b.end_date && ` → ${new Date(b.end_date).toLocaleDateString()}`}
                                {' '}· {b.number_of_guests || 1} Guest(s)
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                              Confirmed
                            </span>
                            <button
                              onClick={() => {
                                setSelectedBookingForAction(b);
                                setActionModalType('DETAILS');
                              }}
                              className="text-xs font-bold text-[#153325] dark:text-emerald-400 hover:underline px-2 py-1"
                            >
                              Voucher
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Host Actions */}
                <div className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-[#153325] dark:text-[#E2ECE5] text-base mb-1">
                      Quick Host Operations
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Direct shortcuts to manage your homestay listing
                    </p>
                    <div className="space-y-2.5">
                      <button
                        onClick={() => handleTabChange('bookings')}
                        className="w-full py-2.5 px-3.5 bg-[var(--bg-app,#F7F8F6)] hover:bg-black/5 rounded-xl border border-[var(--border-app,#E5E7EB)] text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between cursor-pointer transition-colors text-left"
                      >
                        <span className="flex items-center gap-2">
                          <CalendarCheck className="w-4 h-4 text-[#B88B2A]" /> Manage Guest Reservations
                        </span>
                        {pendingBookingsCount > 0 && (
                          <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {pendingBookingsCount}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => handleTabChange('rooms')}
                        className="w-full py-2.5 px-3.5 bg-[var(--bg-app,#F7F8F6)] hover:bg-black/5 rounded-xl border border-[var(--border-app,#E5E7EB)] text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between cursor-pointer transition-colors text-left"
                      >
                        <span className="flex items-center gap-2">
                          <Bed className="w-4 h-4 text-[#153325] dark:text-emerald-400" /> Sleeping Space Configurations
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      <button
                        onClick={() => handleTabChange('profile')}
                        className="w-full py-2.5 px-3.5 bg-[var(--bg-app,#F7F8F6)] hover:bg-black/5 rounded-xl border border-[var(--border-app,#E5E7EB)] text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between cursor-pointer transition-colors text-left"
                      >
                        <span className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-[#153325] dark:text-emerald-400" /> Homestay Photos & Coordinates
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      <button
                        onClick={() => handleTabChange('payments')}
                        className="w-full py-2.5 px-3.5 bg-[var(--bg-app,#F7F8F6)] hover:bg-black/5 rounded-xl border border-[var(--border-app,#E5E7EB)] text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between cursor-pointer transition-colors text-left"
                      >
                        <span className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[#B88B2A]" /> Payment Tracking & Slips
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--border-app,#E5E7EB)] mt-4">
                    <p className="text-[11px] text-slate-400 text-center">
                      Municipal Tourism Office · {user?.municipalityName}
                    </p>
                  </div>
                </div>
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
                      Upload requirement files specified by the Municipal Tourism Office of {user?.municipalityName || 'Abra'}. Approved files endorse you to the province.
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
                    The Municipal Tourism Office of {user?.municipalityName || 'your municipality'} has not set specific document requirements yet. Please consult your Municipal Tourism Officer.
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
                  <ShieldCheck className="w-4 h-4 text-[#B88B2A]" /> DOT Homestay Accreditation Workflow Guidelines
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 text-xs">
                  <li>Accepted formats: PDF, PNG, JPG (maximum 10MB per document).</li>
                  <li>Clear, legible copies of your Barangay Clearance, Mayor's Permit, and DOT Homestay Inspection report are standard.</li>
                  <li>Once all required files are endorsed by {user?.municipalityName} Municipal DOT, the Provincial Tourism Office issues your official accreditation.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 3: HOMESTAY DETAILS & PHOTOS DOSSIER
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* TOP: Official Philippine DOT Digital Homestay Operator Card */}
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
                        Accredited Homestay Operator Dossier
                      </h2>
                      <p className="text-white/60 text-xs">
                        Department of Tourism · Municipality of {user?.municipalityName || 'Abra'}
                      </p>
                    </div>

                    <span className={`self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      isApproved
                        ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40'
                        : 'bg-amber-400/20 text-amber-200 border-amber-400/40'
                    }`}>
                      {isApproved ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      {isApproved ? 'Officially Accredited' : 'Pending Verification'}
                    </span>
                  </div>
                </div>

                <div className="bg-[var(--bg-card,#FFFFFF)] px-6 pb-6 transition-colors">
                  <div className="flex flex-col sm:flex-row gap-5 -mt-12 relative items-start">
                    <div className="w-24 h-24 rounded-2xl border-4 border-[var(--bg-card,#FFFFFF)] overflow-hidden shadow-xl bg-[#153325] flex items-center justify-center text-white shrink-0">
                      {profile?.images?.[0]?.image_url ? (
                        <SafeImage src={profile.images[0].image_url} alt="Homestay" className="w-full h-full object-cover" />
                      ) : (
                        <Home className="w-10 h-10 text-white/70" />
                      )}
                    </div>

                    <div className="pt-2 flex-1 min-w-0">
                      <h3 className="font-serif text-2xl font-bold text-[#153325] dark:text-[#E2ECE5] truncate">
                        {hsName || user?.fullName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {user?.municipalityName} Homestay · {hsAddress || 'Complete address pending'}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {hsPhone && (
                          <span className="px-2.5 py-0.5 bg-[#153325]/8 text-[#153325] dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-full border border-[#153325]/15">
                            📞 {hsPhone}
                          </span>
                        )}
                        {hsEmail && (
                          <span className="px-2.5 py-0.5 bg-[#153325]/8 text-[#153325] dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-full border border-[#153325]/15">
                            ✉ {hsEmail}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Review Badge */}
                    <div className="self-start sm:mt-2 flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-[#B88B2A]/10 border border-[#B88B2A]/25 rounded-xl px-3.5 py-2">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-[#153325] dark:text-[#E2ECE5] text-base">{avgRating || '5.0'}</span>
                        <span className="text-slate-400 text-[11px]">/ 5.0</span>
                      </div>
                      <span className="text-[10px] text-slate-400">({receivedReviews.length} reviews)</span>
                    </div>
                  </div>

                  {/* Quick-stat strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    {[
                      { label: 'Sleeping Spaces', value: profile?.rooms?.length ?? 0, icon: '🛏️' },
                      { label: 'Gallery Photos', value: profile?.images?.length ?? 0, icon: '🖼️' },
                      { label: 'Confirmed Stays', value: confirmedBookingsCount, icon: '📅' },
                      { label: 'Guest Reviews', value: receivedReviews.length, icon: '⭐' },
                    ].map(s => (
                      <div key={s.label} className="bg-[var(--bg-app,#F7F8F6)] rounded-xl p-3 text-center border border-[var(--border-app,#E5E7EB)]">
                        <div className="text-lg">{s.icon}</div>
                        <div className="font-bold text-[#153325] dark:text-[#E2ECE5] text-sm mt-0.5">{s.value}</div>
                        <div className="text-[10px] text-slate-500">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Homestay Details Form */}
              <div className="bg-[var(--bg-card,#FFFFFF)] rounded-2xl border border-[var(--border-app,#E5E7EB)] p-6 shadow-xs">
                <h4 className="font-serif font-bold text-[#153325] dark:text-[#E2ECE5] text-base mb-4 flex items-center gap-2">
                  <Home className="w-4 h-4 text-[#B88B2A]" /> Edit Homestay Public Profile
                </h4>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#B88B2A] mb-1.5">
                      Homestay Public Name
                    </label>
                    <input
                      type="text"
                      required
                      value={hsName}
                      onChange={(e) => setHsName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#153325]/20 text-[#111827] dark:text-[#E2ECE5]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#B88B2A] mb-1.5">
                      Description & Guest House Rules
                    </label>
                    <textarea
                      rows="4"
                      value={hsDesc}
                      onChange={(e) => setHsDesc(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#153325]/20 text-[#111827] dark:text-[#E2ECE5] resize-none"
                      placeholder="Describe your homestay rooms, local scenery, traditional meals, or transport guidance..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#B88B2A] mb-1.5">
                      Complete Physical Address
                    </label>
                    <input
                      type="text"
                      required
                      value={hsAddress}
                      onChange={(e) => setHsAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#153325]/20 text-[#111827] dark:text-[#E2ECE5]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-[#B88B2A] mb-1.5">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        required
                        value={hsPhone}
                        onChange={(e) => setHsPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#153325]/20 text-[#111827] dark:text-[#E2ECE5]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-[#B88B2A] mb-1.5">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        required
                        value={hsEmail}
                        onChange={(e) => setHsEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#153325]/20 text-[#111827] dark:text-[#E2ECE5]"
                      />
                    </div>
                  </div>

                  {/* GPS Coordinates */}
                  <div className="bg-[#B88B2A]/5 p-4 rounded-xl border border-[#B88B2A]/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        GPS Geolocation Coordinates
                      </label>
                      <button
                        type="button"
                        onClick={handleDetectHomestayCoords}
                        className="text-[10px] font-bold text-[#153325] bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3 text-[#153325]" /> Detect Current Location
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500">Latitude</span>
                        <input
                          type="number"
                          step="any"
                          value={hsLat}
                          onChange={(e) => setHsLat(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-black/20 border border-[var(--border-app,#E5E7EB)] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#153325]/20 text-[#111827] dark:text-[#E2ECE5]"
                          placeholder="e.g. 17.597123"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500">Longitude</span>
                        <input
                          type="number"
                          step="any"
                          value={hsLng}
                          onChange={(e) => setHsLng(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-black/20 border border-[var(--border-app,#E5E7EB)] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#153325]/20 text-[#111827] dark:text-[#E2ECE5]"
                          placeholder="e.g. 120.621234"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#153325] hover:bg-[#1E4A36] text-white font-bold rounded-xl text-xs cursor-pointer transition-colors shadow-xs"
                    >
                      Save Profile Details
                    </button>
                  </div>
                </form>
              </div>

              {/* Photo Gallery */}
              <div className="bg-[var(--bg-card,#FFFFFF)] rounded-2xl border border-[var(--border-app,#E5E7EB)] p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-serif font-bold text-[#153325] dark:text-[#E2ECE5] text-base flex items-center gap-2">
                      Homestay Photo Gallery
                    </h4>
                    <p className="text-xs text-slate-500">Upload authentic images of your rooms, patio, and amenities</p>
                  </div>
                  <label className="px-4 py-2 bg-[#153325] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#1E4A36] shadow flex items-center gap-1.5 transition-colors">
                    <Upload className="w-4 h-4" /> Add Photo
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>

                {profile?.images && profile.images.length === 0 ? (
                  <p className="text-slate-400 text-xs py-10 text-center bg-[var(--bg-app,#F7F8F6)] border border-dashed border-[var(--border-app,#E5E7EB)] rounded-xl">
                    No images uploaded yet. Upload homestay pictures for tourists to browse.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {profile?.images?.map((img) => (
                      <div key={img.id} className="relative rounded-xl overflow-hidden group h-40 bg-slate-100 border border-[var(--border-app,#E5E7EB)]">
                        <SafeImage src={img.image_url} alt="Gallery" className="w-full h-full object-cover" fallback="square" />
                        <button
                          onClick={() => handleDeletePhoto(img.id)}
                          className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow cursor-pointer"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 4: SLEEPING ARRANGEMENTS
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'rooms' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add Room Form */}
              <div className="lg:col-span-1 border border-[var(--border-app,#E5E7EB)] p-6 rounded-2xl bg-[var(--bg-card,#FFFFFF)] shadow-xs">
                <h3 className="font-serif font-bold text-[#153325] dark:text-[#E2ECE5] text-base mb-1 border-b border-[var(--border-app,#E5E7EB)] pb-2">
                  Add Sleeping Space
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Describe how guests will sleep in your home. After adding a space, expand it to upload bed photos.
                </p>
                <form onSubmit={handleAddRoom} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Space Type</label>
                    <select
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] rounded-xl text-xs text-[#111827] dark:text-[#E2ECE5]"
                    >
                      <option value="Private Room">Private Room</option>
                      <option value="Shared Room">Shared Room</option>
                      <option value="Family Room">Family Room</option>
                      <option value="Entire Home">Entire Home</option>
                      <option value="Loft / Attic Room">Loft / Attic Room</option>
                      <option value="Outdoor Cottage">Outdoor Cottage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rate per Night (₱)</label>
                    <input
                      type="number"
                      required
                      value={roomPrice}
                      onChange={(e) => setRoomPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] rounded-xl text-xs text-[#111827] dark:text-[#E2ECE5]"
                      placeholder="e.g. 500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Guests Capacity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={roomCapacity}
                      onChange={(e) => setRoomCapacity(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] rounded-xl text-xs text-[#111827] dark:text-[#E2ECE5]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
                    <textarea
                      rows="3"
                      value={roomDesc}
                      onChange={(e) => setRoomDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] rounded-xl text-xs text-[#111827] dark:text-[#E2ECE5] resize-none"
                      placeholder="e.g. Cozy private room with electric fan, clean bed linens, and shared bathroom."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#153325] text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-[#1E4A36] transition-colors shadow-xs"
                  >
                    Save Sleeping Space
                  </button>
                </form>
              </div>

              {/* Room List with Photo Gallery */}
              <div className="lg:col-span-2 bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] p-6 rounded-2xl shadow-xs">
                <h3 className="font-serif font-bold text-[#153325] dark:text-[#E2ECE5] text-base mb-1 border-b border-[var(--border-app,#E5E7EB)] pb-2">
                  Configured Sleeping Spaces ({roomsList.length})
                </h3>
                <p className="text-xs text-slate-500 mb-4">Expand each space to upload bed photos. These are visible to tourists exploring your municipality.</p>

                {roomsList.length === 0 ? (
                  <p className="text-slate-400 text-xs py-12 text-center bg-[var(--bg-app,#F7F8F6)] border border-dashed border-[var(--border-app,#E5E7EB)] rounded-xl">
                    No sleeping spaces added yet. Use the form on the left to describe your room offerings.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {roomsList.map((rm) => {
                      const isExpanded = expandedRoomId === rm.id;
                      const roomImages = rm.room_images || [];
                      const pendingFiles = roomImageFiles[rm.id];
                      const isUploading = roomImageUploading[rm.id];
                      return (
                        <div key={rm.id} className="rounded-xl border border-[var(--border-app,#E5E7EB)] bg-[var(--bg-app,#F7F8F6)] overflow-hidden">
                          {/* Room Header Row */}
                          <div className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-[#153325]/10 flex items-center justify-center flex-shrink-0">
                                <Bed className="w-4 h-4 text-[#153325]" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-[#153325] dark:text-[#E2ECE5] truncate">{rm.room_type}</h4>
                                <p className="text-slate-500 text-xs mt-0.5 truncate">
                                  Up to {rm.capacity} guest(s){rm.description ? ` · ${rm.description}` : ''}
                                </p>
                                <p className="text-[#B88B2A] font-bold text-xs mt-0.5">
                                  ₱{parseFloat(rm.price_per_night).toLocaleString()} / night
                                  {roomImages.length > 0 && (
                                    <span className="ml-2 font-normal text-slate-400">· {roomImages.length} photo{roomImages.length !== 1 ? 's' : ''}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => setExpandedRoomId(isExpanded ? null : rm.id)}
                                className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-[var(--border-app,#E5E7EB)] text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Upload className="w-3 h-3" />
                                {isExpanded ? 'Collapse' : 'Photos'}
                              </button>
                              <button
                                onClick={() => handleDeleteRoom(rm.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete room"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Expandable Photo Section */}
                          {isExpanded && (
                            <div className="border-t border-[var(--border-app,#E5E7EB)] p-4 space-y-4 bg-white dark:bg-slate-800/20">
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">📷 Bed & Room Photos</p>

                              {/* Existing Photo Grid */}
                              {roomImages.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                  {roomImages.map((img) => (
                                    <div key={img.id} className="relative group rounded-lg overflow-hidden aspect-square border border-[var(--border-app,#E5E7EB)]">
                                      <SafeImage
                                        src={img.image_url}
                                        alt={img.caption || rm.room_type}
                                        className="w-full h-full object-cover"
                                        fallback="generic"
                                      />
                                      <button
                                        onClick={() => handleDeleteRoomImage(img.id)}
                                        className="absolute top-1 right-1 w-6 h-6 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        title="Remove photo"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                      {img.caption && (
                                        <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1.5 py-0.5 truncate">{img.caption}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Upload New Photos */}
                              <div className="space-y-2">
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">Upload new photos (multiple allowed)</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  id={`room-img-${rm.id}`}
                                  className="hidden"
                                  onChange={(e) => setRoomImageFiles(prev => ({ ...prev, [rm.id]: e.target.files }))}
                                />
                                <label
                                  htmlFor={`room-img-${rm.id}`}
                                  className="flex items-center gap-2 px-3 py-2.5 border-2 border-dashed border-[#153325]/30 hover:border-[#153325] rounded-xl cursor-pointer transition-colors text-xs text-slate-500 hover:text-[#153325] hover:bg-[#153325]/5"
                                >
                                  <Upload className="w-4 h-4" />
                                  {pendingFiles && pendingFiles.length > 0
                                    ? `${pendingFiles.length} file(s) selected — click Upload to confirm`
                                    : 'Click to select bed/room photos…'}
                                </label>
                                {pendingFiles && pendingFiles.length > 0 && (
                                  <button
                                    onClick={() => handleRoomImageUpload(rm.id)}
                                    disabled={isUploading}
                                    className="w-full py-2 bg-[#153325] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#1E4A36] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                                  >
                                    {isUploading ? (
                                      <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Uploading…</>
                                    ) : (
                                      <><Upload className="w-3.5 h-3.5" />Upload {pendingFiles.length} Photo{pendingFiles.length !== 1 ? 's' : ''}</>
                                    )}
                                  </button>
                                )}
                              </div>
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

          {/* ══════════════════════════════════════════════════════════
              TAB 5: HOMESTAY BOOKINGS & RESERVATIONS (NO CHAT)
          ══════════════════════════════════════════════════════════ */}
          {(activeTab === 'bookings' || activeTab === 'inquiries' || activeTab === 'guests') && (
            <div className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
              {/* Header & Filter Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-app,#E5E7EB)] pb-4">
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#153325] dark:text-[#E2ECE5]">
                    Homestay Bookings & Client Reservations
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official reservation requests, check-in schedules, guest details, and downpayment verification.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  {/* Search */}
                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search guest, ref #, phone..."
                      value={searchBookingQuery}
                      onChange={(e) => setSearchBookingQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#153325] text-[#111827] dark:text-[#E2ECE5] w-full"
                    />
                    {searchBookingQuery && (
                      <button
                        onClick={() => setSearchBookingQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                    {searchBookingQuery || bookingFilter !== 'ALL' ? 'No matching bookings found' : 'No reservation requests received yet'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {searchBookingQuery || bookingFilter !== 'ALL'
                      ? 'Try clearing your search term or switching the status filter.'
                      : 'When tourists book your homestay accommodations through Abraventure, their formal reservation vouchers appear here.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredBookings.map((b) => {
                    const isPending = b.status === 'PENDING';
                    const isConfirmed = b.status === 'CONFIRMED';
                    const isCancelled = b.status === 'CANCELLED';
                    const isResponded = b.status === 'RESPONDED';

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

                          {/* Guest Profile */}
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-[#153325]/10 text-[#153325] dark:text-emerald-400 font-bold text-base flex items-center justify-center shrink-0">
                              {(b.tourist_name || 'G')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-serif font-bold text-sm sm:text-base text-[#153325] dark:text-[#E2ECE5] truncate">
                                {b.tourist_name}
                              </h4>
                              <p className="text-xs text-slate-500 truncate">
                                Direct Contact: {b.tourist_phone || b.tourist_email || 'Verified Guest'}
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
                              <span className="text-[10px] font-bold uppercase text-slate-400 block">Stay Schedule</span>
                              <span className="font-semibold text-[#153325] dark:text-[#E2ECE5]">
                                {b.start_date ? new Date(b.start_date).toLocaleDateString() : 'Dates Flexible'}
                                {b.end_date && ` – ${new Date(b.end_date).toLocaleDateString()}`}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400 block">Party Size</span>
                              <span className="font-semibold text-[#153325] dark:text-[#E2ECE5]">
                                {b.number_of_guests || 1} Guest(s)
                              </span>
                            </div>
                          </div>

                          {/* Guest's Request Note */}
                          <div className="mt-3">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                              Guest Notes & Inquiries:
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

                          {/* Host Remarks Note */}
                          {b.reply_message && (
                            <div className="mt-3 p-3 rounded-xl bg-[#153325]/10 border border-[#153325]/20 text-xs">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#153325] dark:text-emerald-300 block mb-0.5">
                                Your Host Remarks / Check-in Instructions:
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
                                    setActionRemarks(b.reply_message || 'Your booking is confirmed! Looking forward to welcoming you to our homestay. Please notify us of your estimated arrival time.');
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
                                  <CheckCircle className="w-4 h-4" /> Homestay Booking Confirmed
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
              TAB 6: ROOM AVAILABILITY CALENDAR
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'calendar' && (() => {
            const { firstDay, daysInMonth, bookedDates } = buildCalendarDays();
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return (
              <div className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl shadow-sm p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-app,#E5E7EB)] pb-4">
                  <div>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-[#153325] dark:text-[#E2ECE5]">
                      Homestay Availability Calendar
                    </h3>
                    <p className="text-xs text-slate-500">
                      Visual overview of confirmed bookings and open room availability
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        let m = calendarMonth - 1;
                        let y = calendarYear;
                        if (m < 0) { m = 11; y--; }
                        setCalendarMonth(m);
                        setCalendarYear(y);
                      }}
                      className="p-1.5 rounded-lg border border-[var(--border-app,#E5E7EB)] hover:bg-black/5 text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      ‹
                    </button>
                    <span className="text-xs font-bold text-[#153325] dark:text-[#E2ECE5] min-w-[130px] text-center">
                      {MONTH_NAMES[calendarMonth]} {calendarYear}
                    </span>
                    <button
                      onClick={() => {
                        let m = calendarMonth + 1;
                        let y = calendarYear;
                        if (m > 11) { m = 0; y++; }
                        setCalendarMonth(m);
                        setCalendarYear(y);
                      }}
                      className="p-1.5 rounded-lg border border-[var(--border-app,#E5E7EB)] hover:bg-black/5 text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      ›
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                    <span className="w-3 h-3 bg-rose-500 rounded-full" /> Booked / Occupied
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                    <span className="w-3 h-3 bg-white border border-slate-300 rounded-full" /> Open / Available
                  </span>
                </div>

                <div className="border border-[var(--border-app,#E5E7EB)] rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-7 bg-[#153325] text-white">
                    {dayNames.map(d => (
                      <div key={d} className="text-center text-[11px] font-bold uppercase py-2.5">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 bg-[var(--bg-app,#F7F8F6)]">
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`e-${i}`} className="h-16 bg-black/[0.02] border border-[var(--border-app,#E5E7EB)]" />
                    ))}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                      const isBooked = bookedDates.has(day);
                      const isToday = day === new Date().getDate() && calendarMonth === new Date().getMonth() && calendarYear === new Date().getFullYear();
                      return (
                        <div
                          key={day}
                          className={`h-16 border border-[var(--border-app,#E5E7EB)] flex flex-col items-center justify-center relative transition-colors ${
                            isBooked
                              ? 'bg-rose-500/10'
                              : 'bg-[var(--bg-card,#FFFFFF)] hover:bg-emerald-500/5'
                          }`}
                        >
                          <span className={`text-xs font-bold ${
                            isBooked ? 'text-rose-600 dark:text-rose-400' :
                            isToday ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                          } ${isToday ? 'bg-[#153325] rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                            {day}
                          </span>
                          {isBooked && (
                            <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 mt-1">
                              Booked
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ══════════════════════════════════════════════════════════
              TAB 7: PAYMENT TRACKING
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'payments' && (
            <div className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl shadow-sm p-6 space-y-6">
              <div className="border-b border-[var(--border-app,#E5E7EB)] pb-4">
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#153325] dark:text-[#E2ECE5]">
                  Payment Tracker & Downpayment Verification
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify guest payment slips or mark guests paying upon arrival at your homestay.
                </p>
              </div>

              {/* Stat Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    label: 'Confirmed Bookings',
                    value: inquiries.filter(i => i.status === 'CONFIRMED').length,
                    color: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                  },
                  {
                    label: 'Proof Slip Received',
                    value: inquiries.filter(i => i.status === 'CONFIRMED' && i.payment_proof_url).length,
                    color: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30'
                  },
                  {
                    label: 'Pay on Arrival',
                    value: inquiries.filter(i => i.status === 'CONFIRMED' && !i.payment_proof_url).length,
                    color: 'bg-slate-200/50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300'
                  },
                ].map(s => (
                  <div key={s.label} className={`border rounded-2xl p-5 ${s.color}`}>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{s.label}</p>
                    <p className="text-3xl font-black">{s.value}</p>
                  </div>
                ))}
              </div>

              {inquiries.filter(i => i.status === 'CONFIRMED').length === 0 ? (
                <div className="text-center py-14 bg-[var(--bg-app,#F7F8F6)] rounded-2xl border border-dashed border-[var(--border-app,#E5E7EB)]">
                  <CreditCard className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="font-bold text-sm text-[#153325] dark:text-[#E2ECE5]">No confirmed bookings yet</p>
                  <p className="text-xs text-slate-400 mt-1">Confirm reservation requests in the Homestay Bookings tab to track downpayments here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inquiries.filter(i => i.status === 'CONFIRMED').map(inq => (
                    <div
                      key={inq.id}
                      className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#153325] dark:text-[#E2ECE5] text-sm">{inq.tourist_name || 'Guest'}</span>
                          <span className="font-mono text-[10px] text-slate-400">REF #{inq.id.substring(0, 8).toUpperCase()}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {inq.start_date?.split('T')[0]}{inq.end_date ? ` – ${inq.end_date.split('T')[0]}` : ''} · {inq.number_of_guests || 1} guest(s)
                        </p>
                        {inq.tourist_phone && <p className="text-xs text-slate-400">📞 {inq.tourist_phone}</p>}
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {inq.payment_proof_url ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                              ✅ Deposit Slip Attached
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedDocUrl(inq.payment_proof_url)}
                              className="px-3 py-1 bg-[#153325] text-white text-[11px] font-bold rounded-lg cursor-pointer hover:bg-[#1E4A36] flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> View Slip
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-1 rounded-full">
                            💵 Pay on Arrival
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 8: GUEST REVIEWS
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'reviews' && (
            <div className="bg-[var(--bg-card,#FFFFFF)] border border-[var(--border-app,#E5E7EB)] rounded-2xl shadow-sm p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-app,#E5E7EB)] pb-4">
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#153325] dark:text-[#E2ECE5]">
                    Tourist Reviews & Ratings
                  </h3>
                  <p className="text-xs text-slate-500">
                    Feedback received from verified guests who stayed at your homestay
                  </p>
                </div>
                {avgRating && (
                  <div className="flex items-center gap-2 bg-[#B88B2A]/10 border border-[#B88B2A]/25 px-4 py-2 rounded-xl">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-black text-[#153325] dark:text-[#E2ECE5] text-lg">{avgRating}</span>
                    <span className="text-xs text-slate-500">/ 5.0 ({receivedReviews.length} reviews)</span>
                  </div>
                )}
              </div>

              {receivedReviews.length === 0 ? (
                <div className="text-center py-14 bg-[var(--bg-app,#F7F8F6)] rounded-2xl border border-dashed border-[var(--border-app,#E5E7EB)]">
                  <Star className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-sm text-[#153325] dark:text-[#E2ECE5]">No tourist reviews yet</p>
                  <p className="text-xs text-slate-400 mt-1">Guest ratings will be highlighted here once verified tourists submit reviews.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedReviews.map(rev => (
                    <div key={rev.id} className="bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] rounded-xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-sm text-[#153325] dark:text-[#E2ECE5]">{rev.reviewer_name || 'Verified Tourist'}</p>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
                            />
                          ))}
                        </div>
                      </div>
                      {rev.comment && <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">{rev.comment}</p>}
                      <p className="text-slate-400 text-[10px] mt-2">
                        {new Date(rev.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════
          MODAL 1: BOOKING ACTION MODAL (CONFIRM / REMARKS / DECLINE)
      ══════════════════════════════════════════════════════════ */}
      {selectedBookingForAction && actionModalType && actionModalType !== 'DETAILS' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card,#FFFFFF)] rounded-2xl p-6 shadow-2xl border border-[var(--border-app,#E5E7EB)] max-w-md w-full relative animate-fadeIn space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-app,#E5E7EB)] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#B88B2A] uppercase tracking-wider block">
                  REF #{selectedBookingForAction.id.substring(0, 8).toUpperCase()}
                </span>
                <h3 className="font-serif font-bold text-lg text-[#153325] dark:text-[#E2ECE5]">
                  {actionModalType === 'CONFIRM' && 'Confirm Homestay Booking'}
                  {actionModalType === 'RESPOND' && 'Send Remarks to Guest'}
                  {actionModalType === 'DECLINE' && 'Decline Reservation'}
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
                Guest: {selectedBookingForAction.tourist_name}
              </p>
              <p className="text-slate-500">
                Schedule: {selectedBookingForAction.start_date ? new Date(selectedBookingForAction.start_date).toLocaleDateString() : 'Dates Flexible'}
                {selectedBookingForAction.end_date && ` – ${new Date(selectedBookingForAction.end_date).toLocaleDateString()}`}
                {' '}({selectedBookingForAction.number_of_guests || 1} Guests)
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {actionModalType === 'CONFIRM' && 'Check-in Instructions & GCash / Payment Details:'}
                {actionModalType === 'RESPOND' && 'Host Remarks for Guest:'}
                {actionModalType === 'DECLINE' && 'Reason for Declining (Optional):'}
              </label>
              <textarea
                rows="4"
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder={
                  actionModalType === 'CONFIRM'
                    ? 'e.g. Booking confirmed! Check-in starts at 2:00 PM. Please send downpayment via GCash 0917-xxx-xxxx. Contact us when approaching town.'
                    : actionModalType === 'RESPOND'
                    ? 'e.g. Please let us know if your party will require homecooked breakfast or assistance with local vehicle parking.'
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

      {/* ══════════════════════════════════════════════════════════
          MODAL 2: FULL VOUCHER DETAILS MODAL
      ══════════════════════════════════════════════════════════ */}
      {selectedBookingForAction && actionModalType === 'DETAILS' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card,#FFFFFF)] rounded-2xl p-6 shadow-2xl border border-[var(--border-app,#E5E7EB)] max-w-lg w-full relative animate-fadeIn space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[var(--border-app,#E5E7EB)] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#B88B2A] uppercase tracking-wider block">
                  Homestay Reservation Voucher
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Stay Dates:</span>
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
                  Guest Contact Details
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

              {/* Guest Request Notes */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-app,#F7F8F6)] border border-[var(--border-app,#E5E7EB)] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Guest Request Notes:
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
                      Downpayment Slip Attached
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDocUrl(selectedBookingForAction.payment_proof_url)}
                    className="px-3 py-1 bg-[#153325] text-white text-[11px] font-bold rounded-lg cursor-pointer hover:bg-[#1E4A36] flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> View Slip
                  </button>
                </div>
              )}

              {/* Host Remarks */}
              {selectedBookingForAction.reply_message && (
                <div className="p-3.5 rounded-xl bg-[#153325]/10 border border-[#153325]/20 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#153325] dark:text-emerald-300 block">
                    Host Remarks / Check-in Guidance:
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {selectedBookingForAction.reply_message}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[var(--border-app,#E5E7EB)]">
              <button
                type="button"
                onClick={() => {
                  setActionModalType(null);
                  setSelectedBookingForAction(null);
                }}
                className="px-4 py-2 bg-[#153325] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#1E4A36]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document / Slip Viewer Modal */}
      {selectedDocUrl && (
        <DocumentViewerModal
          docUrl={selectedDocUrl}
          onClose={() => setSelectedDocUrl(null)}
          title="Document / Payment Proof Viewer"
        />
      )}
    </div>
  );
};

export default OwnerDashboard;
