import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import {
  Package, Plus, Edit, Trash2, Send, CheckCircle, Clock, XCircle, AlertCircle,
  RefreshCw, Eye, Calendar, Users, Bus, ChevronDown, ChevronUp, MapPin, Building2,
  DollarSign, Check, X, MessageSquare, Download, Filter, Search, Award, TrendingUp,
  FileText, ExternalLink, Upload
} from 'lucide-react';

const MUNICIPALITIES = [
  'Bangued', 'Boliney', 'Bucay', 'Bucloc', 'Daguioman', 'Danglas', 'Dolores',
  'La Paz', 'Lacub', 'Lagangilang', 'Lagayan', 'Langiden', 'Licuan-Baay',
  'Luba', 'Malibcong', 'Manabo', 'Peñarrubia', 'Pidigan', 'Pilar', 'Sallapadan',
  'San Isidro', 'San Juan', 'San Quintin', 'Tayum', 'Tineg', 'Tubo', 'Villaviciosa'
];

const STATUS_COLORS = {
  DRAFT: { bg: '#F2EDE2', text: '#7B847F', border: '#DCD4C5', label: 'Draft' },
  PENDING_COORDINATION: { bg: '#FFF4D8', text: '#7A5A14', border: '#F2D785', label: 'Coordination' },
  PENDING_APPROVAL: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D', label: 'Pending Approval' },
  SUBMITTED: { bg: '#EBF4FF', text: '#1E429F', border: '#B4C6FF', label: 'Under Review' },
  REVISION_REQUESTED: { bg: '#FFF0E0', text: '#C2410C', border: '#FDBA74', label: 'Needs Revision' },
  APPROVED: { bg: '#E7F3EC', text: '#1E6040', border: '#B2DBC3', label: 'Approved' },
  PUBLISHED: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7', label: 'Published' },
  REJECTED: { bg: '#FDE8E8', text: '#9B1C1C', border: '#F8B4B4', label: 'Rejected' },
  ARCHIVED: { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB', label: 'Archived' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_COLORS[status] || { bg: '#eee', text: '#666', border: '#ccc', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
      background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.text }} />
      {cfg.label}
    </span>
  );
};

const ProvincialPackagesTab = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('all-packages'); // 'all-packages' | 'reviews' | 'coordination' | 'schedules' | 'bookings'
  const [packages, setPackages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [coordinationPackages, setCoordinationPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterMuni, setFilterMuni] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [reviewModalPkg, setReviewModalPkg] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [schedulePkg, setSchedulePkg] = useState(null);
  const [transportPkg, setTransportPkg] = useState(null);

  // Form state
  const initialForm = {
    title: '',
    municipality: 'Bangued',
    package_type: 'MULTI_MUNICIPALITY',
    description: '',
    duration_days: 1,
    duration_nights: 0,
    price_per_pax: '',
    min_pax: 1,
    max_pax: 20,
    daily_capacity: 30,
    inclusions: '',
    exclusions: '',
    itinerary: '',
    homestay_options: '',
    tour_guide_names: '',
    transport_mode: 'JEEPNEY',
    transport_options: '',
    meeting_point: 'Abra Provincial Capitol, Bangued',
    dropoff_point: 'Abra Provincial Capitol, Bangued',
    cover_image_url: '',
    contact_person: user?.full_name || '',
    contact_number: user?.phone || '',
    is_published: true,
    participating_municipalities: ['Bangued'],
  };
  const [formData, setFormData] = useState(initialForm);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);

  // Schedule modal state
  const [schedules, setSchedules] = useState([]);
  const [newSchedule, setNewSchedule] = useState({
    travel_date: '',
    max_capacity: 20,
    is_available: true,
    departure_time: '07:00',
  });

  // Transport modal state
  const [transports, setTransports] = useState([]);
  const [newTransport, setNewTransport] = useState({
    travel_date: '',
    vehicle_label: '',
    driver_name: '',
    total_seats: 14,
    route_notes: '',
    departure_time: '07:00',
  });

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'all-packages' || activeSubTab === 'schedules') {
        // includeAll=true so DRAFT/SUBMITTED/APPROVED packages are visible to Provincial DOT
        const res = await fetch('/api/tour-packages?includeAll=true', { headers });
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.packages || []);
        setPackages(list);
      } else if (activeSubTab === 'reviews') {
        // Backend sets status = 'PENDING_APPROVAL' when Municipal DOT submits
        const res = await fetch('/api/tour-packages?includeAll=true&status=PENDING_APPROVAL', { headers });
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.packages || []);
        setReviews(list);
      } else if (activeSubTab === 'coordination') {
        // Multi-municipality cross-boundary packages
        const res = await fetch('/api/tour-packages?includeAll=true&packageType=MULTI_MUNICIPALITY', { headers });
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.packages || []);
        setCoordinationPackages(list);
      } else if (activeSubTab === 'bookings') {
        // All bookings across the province
        const res = await fetch('/api/tour-packages/bookings/all', { headers });
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.bookings || []);
        setBookings(list);
      }
    } catch (err) {
      console.error('Error fetching provincial package data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics summary
  const totalPackages = packages.length;
  const pendingReviewsCount = reviews.length;
  const multiMuniCount = packages.filter(p => p.package_type === 'MULTI_MUNICIPALITY').length;
  const totalBookingsCount = bookings.length;
  const totalTouristsCount = bookings.reduce((acc, b) => acc + (b.number_of_tourists || 0), 0);
  const totalRevenue = bookings
    .filter(b => b.status === 'CONFIRMED' || b.payment_status === 'VERIFIED')
    .reduce((acc, b) => acc + parseFloat(b.total_amount || 0), 0);

  // Submit / save package
  const handleSavePackage = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price_per_pax: parseFloat(formData.price_per_pax) || 0,
        min_pax: parseInt(formData.min_pax) || 1,
        max_pax: parseInt(formData.max_pax) || 20,
        daily_capacity: parseInt(formData.daily_capacity) || 30,
        duration_days: parseInt(formData.duration_days) || 1,
        duration_nights: parseInt(formData.duration_nights) || 0,
        inclusions: typeof formData.inclusions === 'string' ? formData.inclusions.split('\n').filter(Boolean) : formData.inclusions,
        exclusions: typeof formData.exclusions === 'string' ? formData.exclusions.split('\n').filter(Boolean) : formData.exclusions,
        homestay_options: typeof formData.homestay_options === 'string' ? formData.homestay_options.split('\n').filter(Boolean) : formData.homestay_options,
        tour_guide_names: typeof formData.tour_guide_names === 'string' ? formData.tour_guide_names.split('\n').filter(Boolean) : formData.tour_guide_names,
      };

      const bodyData = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          bodyData.append(k, JSON.stringify(v));
        } else if (v !== null && v !== undefined) {
          bodyData.append(k, v);
        }
      });
      bodyData.append('price', payload.price_per_pax || 0);
      bodyData.append('durationDays', payload.duration_days || 1);
      bodyData.append('maxCapacityPerDate', payload.daily_capacity || 30);
      bodyData.append('municipalityId', payload.primary_municipality_id || 1);
      bodyData.append('imageUrl', formData.cover_image_url || '');

      if (coverImageFile) {
        bodyData.append('coverImage', coverImageFile);
      }

      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      let res, data;
      if (editingPkg) {
        res = await fetch(`/api/tour-packages/${editingPkg.id}`, {
          method: 'PUT',
          headers: authHeaders,
          body: bodyData,
        });
        data = await res.json();
      } else {
        res = await fetch('/api/tour-packages', {
          method: 'POST',
          headers: authHeaders,
          body: bodyData,
        });
        data = await res.json();
      }

      if (res.ok) {
        Swal.fire('Success', data.message || 'Package saved successfully!', 'success');
        setShowModal(false);
        setEditingPkg(null);
        setFormData(initialForm);
        setCoverImageFile(null);
        setCoverImagePreview(null);
        fetchData();
      } else {
        Swal.fire('Error', data.message || 'Failed to save package', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'An unexpected error occurred', 'error');
    }
  };

  // Review decisions
  const handleReviewAction = async (action) => {
    if (!reviewModalPkg) return;
    // Backend accepts: action='APPROVE'|'REJECT'|'REQUEST_REVISION' and body field `remarks`
    if ((action === 'REJECT' || action === 'REQUEST_REVISION') && !reviewFeedback.trim()) {
      Swal.fire('Required', 'Please provide feedback/reasons for this decision.', 'warning');
      return;
    }

    try {
      const res = await fetch(`/api/tour-packages/${reviewModalPkg.id}/review`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ action, remarks: reviewFeedback }),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire('Updated!', data.message, 'success');
        setReviewModalPkg(null);
        setReviewFeedback('');
        fetchData();
      } else {
        Swal.fire('Error', data.message, 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to submit review', 'error');
    }
  };

  // Delete / Archive
  const handleDelete = async (pkg) => {
    const confirm = await Swal.fire({
      title: 'Delete / Archive Package?',
      text: `Are you sure you want to remove "${pkg.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, remove',
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/tour-packages/${pkg.id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (res.ok) {
        Swal.fire('Deleted', data.message, 'success');
        fetchData();
      } else {
        Swal.fire('Error', data.message, 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to delete package', 'error');
    }
  };

  // Open schedules
  const openSchedules = async (pkg) => {
    setSchedulePkg(pkg);
    try {
      const res = await fetch(`/api/tour-packages/${pkg.id}/schedules`, { headers });
      const data = await res.json();
      // Backend returns plain array
      setSchedules(Array.isArray(data) ? data : (data.schedules || []));
      setNewSchedule({
        travel_date: '',
        max_capacity: pkg.max_capacity || pkg.daily_capacity || 20,
        is_available: true,
        departure_time: '07:00',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!schedulePkg) return;
    try {
      // Map to backend expected field names: travelDate, maxCapacity, isAvailable
      const payload = {
        travelDate: newSchedule.travel_date,
        maxCapacity: newSchedule.max_capacity,
        isAvailable: newSchedule.is_available,
      };
      const res = await fetch(`/api/tour-packages/${schedulePkg.id}/schedules`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire('Success', 'Schedule slot added', 'success');
        openSchedules(schedulePkg);
      } else {
        Swal.fire('Error', data.message, 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to add schedule', 'error');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      // Correct route: DELETE /api/tour-packages/:id/schedules/:sid
      const res = await fetch(`/api/tour-packages/${schedulePkg.id}/schedules/${scheduleId}`, { method: 'DELETE', headers });
      if (res.ok) openSchedules(schedulePkg);
    } catch (err) {
      console.error(err);
    }
  };

  // Open transports
  const openTransports = async (pkg) => {
    setTransportPkg(pkg);
    try {
      const res = await fetch(`/api/tour-packages/${pkg.id}/transport`, { headers });
      const data = await res.json();
      // Backend returns plain array
      setTransports(Array.isArray(data) ? data : (data.transports || []));
      // fetch schedules for date dropdown
      const sRes = await fetch(`/api/tour-packages/${pkg.id}/schedules`, { headers });
      const sData = await sRes.json();
      setSchedules(Array.isArray(sData) ? sData : (sData.schedules || []));
      // Reset transport form
      setNewTransport({
        travel_date: '',
        vehicle_label: '',
        driver_name: '',
        total_seats: 14,
        route_notes: '',
        departure_time: '07:00',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTransport = async (e) => {
    e.preventDefault();
    if (!transportPkg) return;
    try {
      // Map to backend expected field names: travelDate, vehicleLabel, totalSeats, driverName, routeNotes
      const payload = {
        travelDate: newTransport.travel_date,
        vehicleLabel: newTransport.vehicle_label,
        driverName: newTransport.driver_name || null,
        totalSeats: newTransport.total_seats || 10,
        routeNotes: newTransport.route_notes || null,
        departureTime: newTransport.departure_time || null,
      };
      const res = await fetch(`/api/tour-packages/${transportPkg.id}/transport`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire('Success', 'Vehicle assigned', 'success');
        openTransports(transportPkg);
      } else {
        Swal.fire('Error', data.message, 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to add transport', 'error');
    }
  };

  const handleDeleteTransport = async (tId) => {
    try {
      // Correct route: DELETE /api/tour-packages/:id/transport/:tid
      const res = await fetch(`/api/tour-packages/${transportPkg.id}/transport/${tId}`, { method: 'DELETE', headers });
      if (res.ok) openTransports(transportPkg);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered lists
  const filteredPackages = packages.filter(p => {
    const muniName = p.municipality_name || p.municipality || '';
    const matchMuni = filterMuni === 'ALL' || muniName === filterMuni;
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchType = filterType === 'ALL' || p.package_type === filterType;
    const matchSearch = !searchQuery ||
      (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      muniName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchMuni && matchStatus && matchType && matchSearch;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (bookings.length === 0) {
      Swal.fire('Info', 'No booking records to export', 'info');
      return;
    }
    const headers = ['Ref', 'Tourist', 'Package', 'Municipality', 'Travel Date', 'Pax', 'Transport', 'Homestay', 'Amount', 'Status', 'Payment'];
    const rows = bookings.map(b => [
      b.booking_reference,
      `"${b.tourist_name || ''}"`,
      `"${b.package_title || ''}"`,
      b.municipality,
      b.travel_date?.split('T')[0] || b.travel_date,
      b.number_of_tourists,
      b.transport_choice,
      `"${b.homestay_name || ''}"`,
      b.total_amount,
      b.status,
      b.payment_status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `abra_tour_bookings_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // UI styling helpers
  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-app)',
    borderRadius: '0.85rem',
    padding: '1.25rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  };

  const btnPrimary = {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.5rem 1rem', borderRadius: '0.5rem',
    background: 'var(--color-primary)', color: '#fff',
    border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
  };

  const btnSecondary = {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.5rem 0.9rem', borderRadius: '0.5rem',
    background: 'var(--bg-card)', color: 'var(--text-main)',
    border: '1px solid var(--border-app)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
  };

  const btnSuccess = {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.5rem 0.9rem', borderRadius: '0.5rem',
    background: '#1E6040', color: '#fff',
    border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
  };

  const btnDanger = {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.5rem 0.9rem', borderRadius: '0.5rem',
    background: '#DC2626', color: '#fff',
    border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div style={{
        ...cardStyle,
        background: 'linear-gradient(135deg, #123826 0%, #1A4D36 60%, #2D6A4F 100%)',
        color: '#fff',
        padding: '1.75rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#85E3B3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Award size={18} /> Abra Provincial Tourism Office
          </div>
          <h2 style={{ fontSize: '1.7rem', fontWeight: 800, margin: '0.25rem 0 0.5rem 0', color: '#fff' }}>
            Tour Package & Inter-Municipality Management
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#D2F0DE', maxWidth: 680, lineHeight: 1.5 }}>
            Create province-wide circuits, review submitted municipal packages, coordinate participating municipalities, and monitor overall tourist capacity and bookings across Abra.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            style={{
              ...btnPrimary,
              background: '#D97706',
              padding: '0.65rem 1.25rem',
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)'
            }}
            onClick={() => {
              setEditingPkg(null);
              setFormData({ ...initialForm, package_type: 'MULTI_MUNICIPALITY' });
              setCoverImageFile(null);
              setCoverImagePreview(null);
              setShowModal(true);
            }}
          >
            <Plus size={18} /> Create Province Package
          </button>
          <button
            style={{
              ...btnSecondary,
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
            onClick={fetchData}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem'
      }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Packages</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.2rem' }}>{totalPackages}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Across all 27 municipalities</div>
        </div>

        <div style={{ ...cardStyle, borderColor: pendingReviewsCount > 0 ? '#F59E0B' : 'var(--border-app)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: pendingReviewsCount > 0 ? '#D97706' : 'var(--text-muted)', textTransform: 'uppercase' }}>Needs Review</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: pendingReviewsCount > 0 ? '#D97706' : 'var(--text-main)', marginTop: '0.2rem' }}>
            {pendingReviewsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Awaiting Provincial approval</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Multi-Muni Circuits</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563EB', marginTop: '0.2rem' }}>{multiMuniCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Cross-boundary packages</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Tourists Booked</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>{totalTouristsCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>From {totalBookingsCount} bookings</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verified Revenue</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D97706', marginTop: '0.2rem' }}>₱{totalRevenue.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Paid bookings to date</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-app)',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem'
      }}>
        {[
          { id: 'all-packages', label: 'All Packages', icon: Package, badge: totalPackages },
          { id: 'reviews', label: 'Pending Reviews', icon: Clock, badge: pendingReviewsCount, badgeColor: '#D97706' },
          { id: 'coordination', label: 'Multi-Muni Coordination', icon: Building2 },
          { id: 'schedules', label: 'Capacity & Transports', icon: Calendar },
          { id: 'bookings', label: 'Province Bookings & Reports', icon: FileText },
        ].map(t => {
          const Icon = t.icon;
          const active = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.15rem',
                borderRadius: '0.5rem 0.5rem 0 0',
                background: active ? 'var(--bg-card)' : 'transparent',
                border: active ? '1px solid var(--border-app)' : '1px solid transparent',
                borderBottom: active ? '2px solid var(--color-primary)' : 'none',
                color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: 999,
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  background: t.badgeColor || 'var(--color-primary)',
                  color: '#fff'
                }}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: ALL PACKAGES */}
      {activeSubTab === 'all-packages' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Filters Bar */}
          <div style={{
            ...cardStyle,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 220 }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search packages by title or municipality..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '0.4rem',
                  border: '1px solid var(--border-app)',
                  background: 'var(--bg-body)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Municipality:</span>
              <select
                value={filterMuni}
                onChange={e => setFilterMuni(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '0.4rem',
                  border: '1px solid var(--border-app)',
                  background: 'var(--bg-body)',
                  color: 'var(--text-main)',
                  fontSize: '0.825rem'
                }}
              >
                <option value="ALL">All Municipalities (27)</option>
                {MUNICIPALITIES.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '0.4rem',
                  border: '1px solid var(--border-app)',
                  background: 'var(--bg-body)',
                  color: 'var(--text-main)',
                  fontSize: '0.825rem'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="APPROVED">Approved</option>
                <option value="SUBMITTED">Under Review</option>
                <option value="REVISION_REQUESTED">Revision Requested</option>
                <option value="DRAFT">Draft</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Type:</span>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '0.4rem',
                  border: '1px solid var(--border-app)',
                  background: 'var(--bg-body)',
                  color: 'var(--text-main)',
                  fontSize: '0.825rem'
                }}
              >
                <option value="ALL">All Types</option>
                <option value="MUNICIPAL">Single Municipality</option>
                <option value="MULTI_MUNICIPALITY">Multi-Municipality</option>
              </select>
            </div>
          </div>

          {/* Package Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading packages...</div>
          ) : filteredPackages.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Package size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No packages found</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Try adjusting your filters or search terms.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {filteredPackages.map(pkg => (
                <div key={pkg.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                  {/* Cover Image */}
                  <div style={{
                    height: 160,
                    position: 'relative',
                    backgroundImage: `url(${pkg.image_url || pkg.cover_image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%)'
                    }} />
                    <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <StatusBadge status={pkg.status} />
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: 999,
                        background: pkg.package_type === 'MULTI_MUNICIPALITY' ? '#2563EB' : 'rgba(0,0,0,0.6)',
                        color: '#fff'
                      }}>
                        {pkg.package_type === 'MULTI_MUNICIPALITY' ? '🌐 Multi-Muni' : '📍 Municipal'}
                      </span>
                    </div>
                    <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', right: '0.75rem', color: '#fff' }}>
                      <div style={{ fontSize: '0.75rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={12} /> {pkg.municipality_name || pkg.municipality || 'Abra'}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {pkg.title}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                    <p style={{
                      margin: 0,
                      fontSize: '0.825rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {pkg.description || 'No description provided.'}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <div>⏱️ {pkg.duration_days} Day(s) {pkg.duration_nights > 0 ? `· ${pkg.duration_nights} Night(s)` : ''}</div>
                      <div>👥 Max {pkg.max_pax} pax/booking</div>
                      <div>🚌 {pkg.transport_mode || 'Flexible'}</div>
                      <div>⚡ {pkg.daily_capacity || 30} slots/day</div>
                    </div>

                    <div style={{
                      marginTop: 'auto',
                      paddingTop: '0.6rem',
                      borderTop: '1px solid var(--border-app)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rate per pax</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                          ₱{parseFloat(pkg.price || pkg.price_per_pax || 0).toLocaleString()}
                        </div>
                      </div>

                      {/* Action buttons */}
                      {pkg.status === 'PENDING_APPROVAL' && (
                        <button
                          style={{ ...btnPrimary, padding: "0.4rem 0.75rem", background: "#059669", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                          onClick={() => { setReviewModalPkg(pkg); setReviewFeedback('Meets Abra Provincial Tourism standards.'); }}
                        >
                          <CheckCircle size={13} /> Review
                        </button>
                      )}
                      {pkg.status === 'APPROVED' && (
                        <button
                          style={{ ...btnPrimary, padding: "0.4rem 0.75rem", background: "#2563EB", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                          onClick={async () => {
                            const r = await fetch(`/api/tour-packages/${pkg.id}/publish`, { method: "PUT", headers });
                            const d = await r.json();
                            if (r.ok) { Swal.fire('Published!', d.message, 'success'); fetchData(); }
                            else Swal.fire('Error', d.message, 'error');
                          }}
                        >
                          <ExternalLink size={13} /> Publish
                        </button>
                      )}
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                        <button
                          title="Manage Schedules & Capacity"
                          style={{ ...btnSecondary, padding: '0.4rem 0.6rem' }}
                          onClick={() => openSchedules(pkg)}
                        >
                          <Calendar size={14} />
                        </button>
                        <button
                          title="Assign Transport"
                          style={{ ...btnSecondary, padding: '0.4rem 0.6rem' }}
                          onClick={() => openTransports(pkg)}
                        >
                          <Bus size={14} />
                        </button>
                        <button
                          title="Edit Package"
                          style={{ ...btnSecondary, padding: '0.4rem 0.6rem' }}
                          onClick={() => {
                            setEditingPkg(pkg);
                            setFormData({
                              title: pkg.title,
                              municipality: pkg.municipality_name || pkg.municipality || 'Bangued',
                              package_type: pkg.package_type || 'MUNICIPAL',
                              description: pkg.description || '',
                              duration_days: pkg.duration_days || 1,
                              duration_nights: pkg.duration_nights || 0,
                              price_per_pax: pkg.price || pkg.price_per_pax || '',
                              min_pax: pkg.min_pax || 1,
                              max_pax: pkg.max_pax || 20,
                              daily_capacity: pkg.max_capacity || pkg.daily_capacity || 30,
                              inclusions: Array.isArray(pkg.inclusions) ? pkg.inclusions.join('\n') : pkg.inclusions || '',
                              exclusions: Array.isArray(pkg.exclusions) ? pkg.exclusions.join('\n') : pkg.exclusions || '',
                              itinerary: pkg.itinerary || '',
                              homestay_options: Array.isArray(pkg.homestay_options) ? pkg.homestay_options.join('\n') : pkg.homestay_options || '',
                              tour_guide_names: Array.isArray(pkg.tour_guide_names) ? pkg.tour_guide_names.join('\n') : pkg.tour_guide_names || '',
                              transport_mode: pkg.transport_mode || pkg.transport_option || 'JEEPNEY',
                              transport_options: pkg.transport_options || '',
                              meeting_point: pkg.meeting_point || '',
                              dropoff_point: pkg.dropoff_point || '',
                              cover_image_url: pkg.image_url || pkg.cover_image_url || '',
                              contact_person: pkg.contact_person || '',
                              contact_number: pkg.contact_number || '',
                              is_published: !!pkg.is_published,
                              participating_municipalities: pkg.participating_municipalities || [pkg.municipality_name || pkg.municipality],
                            });
                            setCoverImageFile(null);
                            setCoverImagePreview(pkg.image_url || pkg.cover_image_url || null);
                            setShowModal(true);
                          }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          title="Delete / Archive"
                          style={{ ...btnSecondary, padding: '0.4rem 0.6rem', color: '#DC2626' }}
                          onClick={() => handleDelete(pkg)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: PENDING REVIEWS */}
      {activeSubTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ ...cardStyle, background: '#FFFBEB', borderColor: '#FDE68A' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <Clock size={22} style={{ color: '#D97706', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.95rem' }}>
                  Municipal Packages Awaiting Provincial Review & Approval ({reviews.length})
                </div>
                <div style={{ fontSize: '0.825rem', color: '#B45309', marginTop: '0.2rem' }}>
                  Review itineraries, homestay allocations, accredited tour guides, and capacity thresholds. You may Approve, Request Revisions with feedback, or Reject submissions.
                </div>
              </div>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
              <CheckCircle size={48} style={{ color: '#059669', opacity: 0.6, marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>All Caught Up!</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>No municipal packages are currently awaiting provincial review.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map(pkg => (
                <div key={pkg.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <StatusBadge status={pkg.status} />
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: 999, background: '#EFF6FF', color: '#1E40AF', fontWeight: 700 }}>
                          📍 {pkg.municipality}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Submitted by: {pkg.creator_name || 'Municipal Tourism'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>{pkg.title}</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: 750 }}>
                        {pkg.description}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rate per pax</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                        ₱{parseFloat(pkg.price_per_pax || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Capacity: {pkg.daily_capacity} slots/day
                      </div>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '0.75rem',
                    background: 'var(--bg-body)',
                    padding: '0.85rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem'
                  }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Duration: </span>
                      {pkg.duration_days} Day(s) {pkg.duration_nights > 0 ? `· ${pkg.duration_nights} Night(s)` : ''}
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Transport: </span>
                      {pkg.transport_mode} ({pkg.meeting_point || ' Capitol Bangued'})
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Contact: </span>
                      {pkg.contact_person} ({pkg.contact_number || 'N/A'})
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Homestay Options: </span>
                      {Array.isArray(pkg.homestay_options) && pkg.homestay_options.length > 0 ? pkg.homestay_options.join(', ') : 'None listed'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-app)', paddingTop: '0.75rem' }}>
                    <button
                      style={btnSuccess}
                      onClick={() => {
                        setReviewModalPkg(pkg);
                        setReviewFeedback('Meets Abra Provincial Tourism standards. Approved.');
                      }}
                    >
                      <CheckCircle size={15} /> Review & Approve
                    </button>
                    <button
                      style={{ ...btnSecondary, color: '#D97706', borderColor: '#FDE68A' }}
                      onClick={() => {
                        setReviewModalPkg(pkg);
                        setReviewFeedback('');
                      }}
                    >
                      <MessageSquare size={15} /> Request Revisions / Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: MULTI-MUNICIPALITY COORDINATION */}
      {activeSubTab === 'coordination' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ ...cardStyle, background: '#EFF6FF', borderColor: '#BFDBFE' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <Building2 size={22} style={{ color: '#2563EB', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, color: '#1E40AF', fontSize: '0.95rem' }}>
                  Multi-Municipality Tourism Packages & Inter-Agency Coordination
                </div>
                <div style={{ fontSize: '0.825rem', color: '#1D4ED8', marginTop: '0.2rem' }}>
                  Track participating municipalities for cross-border tours (e.g., Bangued - Tayum - Bucay historical circuit, or Malibcong - Lacub eco-trek). Each municipality reviews their segment before full launch.
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              style={{ ...btnPrimary, background: '#2563EB' }}
              onClick={() => {
                setEditingPkg(null);
                setFormData({
                  ...initialForm,
                  package_type: 'MULTI_MUNICIPALITY',
                  title: 'Abra Heritage & Highlands Circuit (Sample)',
                  participating_municipalities: ['Bangued', 'Tayum', 'Bucay']
                });
                setShowModal(true);
              }}
            >
              <Plus size={16} /> New Multi-Municipality Circuit
            </button>
          </div>

          {coordinationPackages.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
              <Building2 size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No multi-municipality coordination records</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Create a multi-municipality package above to start coordinating participating towns.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {coordinationPackages.map(pkg => (
                <div key={pkg.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <StatusBadge status={pkg.status} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', background: '#DBEAFE', padding: '0.2rem 0.5rem', borderRadius: 999 }}>
                          🌐 Multi-Municipality Circuit
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>{pkg.title}</h3>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        Lead Municipality: <strong>{pkg.municipality}</strong> · Created by {pkg.creator_name || 'Provincial Tourism'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button style={btnSecondary} onClick={() => openSchedules(pkg)}>
                        <Calendar size={14} /> Schedules
                      </button>
                      <button style={btnSecondary} onClick={() => openTransports(pkg)}>
                        <Bus size={14} /> Transport
                      </button>
                    </div>
                  </div>

                  {/* Participating municipalities table */}
                  <div style={{ border: '1px solid var(--border-app)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--bg-body)', padding: '0.5rem 0.85rem', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Participating Municipalities Coordination Status
                    </div>
                    {Array.isArray(pkg.participating_municipalities) && pkg.participating_municipalities.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', divideY: '1px solid var(--border-app)' }}>
                        {pkg.participating_municipalities.map((item, idx) => {
                          const mName = typeof item === 'string' ? item : item.municipality;
                          const mStatus = typeof item === 'string' ? 'ACCEPTED' : item.status;
                          const mFeedback = typeof item === 'string' ? '' : item.feedback;
                          return (
                            <div key={idx} style={{ padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: idx > 0 ? '1px solid var(--border-app)' : 'none' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <MapPin size={16} style={{ color: 'var(--color-primary)' }} />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{mName}</div>
                                  {mFeedback && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Note: {mFeedback}</div>}
                                </div>
                              </div>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.6rem',
                                borderRadius: 999,
                                background: mStatus === 'ACCEPTED' ? '#E7F3EC' : mStatus === 'REJECTED' ? '#FDE8E8' : '#FFF4D8',
                                color: mStatus === 'ACCEPTED' ? '#1E6040' : mStatus === 'REJECTED' ? '#9B1C1C' : '#7A5A14'
                              }}>
                                {mStatus}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ padding: '0.85rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        No participating municipalities assigned yet.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: SCHEDULES & CAPACITY */}
      {activeSubTab === 'schedules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ ...cardStyle, background: 'var(--bg-body)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
              Select a Package to Inspect Schedules, Tourist Capacity & Transportation
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Manage upcoming tour dates, open slots, van/jeepney allocations, and assigned local drivers.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {packages.map(pkg => (
              <div key={pkg.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>{pkg.municipality}</span>
                  <StatusBadge status={pkg.status} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{pkg.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Max Daily Capacity: <strong>{pkg.daily_capacity || 30} pax</strong>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                  <button style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }} onClick={() => openSchedules(pkg)}>
                    <Calendar size={14} /> View Schedules
                  </button>
                  <button style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }} onClick={() => openTransports(pkg)}>
                    <Bus size={14} /> Vehicles
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: PROVINCE BOOKINGS & REPORTS */}
      {activeSubTab === 'bookings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Province-Wide Package Bookings</h3>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Track tourist reservations across all tour packages in Abra.
              </div>
            </div>
            <button style={btnPrimary} onClick={handleExportCSV}>
              <Download size={16} /> Export Bookings CSV
            </button>
          </div>

          {bookings.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
              <Users size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No bookings registered yet</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Bookings made by tourists will appear here in real-time.</div>
            </div>
          ) : (
            <div style={{ ...cardStyle, overflowX: 'auto', padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-body)', borderBottom: '1px solid var(--border-app)', textAlign: 'left' }}>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Ref #</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Tourist</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Package</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Municipality</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Date</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Pax</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Total</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Booking Status</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border-app)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {b.booking_reference}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600 }}>{b.tourist_name || 'Tourist'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.tourist_email}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{b.package_title}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{b.municipality}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{b.travel_date?.split('T')[0] || b.travel_date}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{b.number_of_tourists}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#D97706' }}>
                        ₱{parseFloat(b.total_amount || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <StatusBadge status={b.status} />
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 999,
                          background: b.payment_status === 'VERIFIED' ? '#E7F3EC' : b.payment_status === 'PROOF_SUBMITTED' ? '#FFF4D8' : '#F2EDE2',
                          color: b.payment_status === 'VERIFIED' ? '#1E6040' : b.payment_status === 'PROOF_SUBMITTED' ? '#7A5A14' : '#7B847F',
                        }}>
                          {b.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT PACKAGE MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: 750,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-app)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-body)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  {editingPkg ? 'Edit Tour Package' : 'Create Provincial / Multi-Municipality Package'}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Define destinations, pricing, daily capacity, and participating municipalities.
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePackage} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.1rem', flex: 1 }}>
                {/* Title & Type */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>Package Title *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g., Abra Grand Heritage & Waterfalls Circuit"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border-app)', background: 'var(--bg-body)', color: 'var(--text-main)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>Package Type</label>
                    <select
                      value={formData.package_type}
                      onChange={e => setFormData({ ...formData, package_type: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border-app)', background: 'var(--bg-body)', color: 'var(--text-main)' }}
                    >
                      <option value="MULTI_MUNICIPALITY">Multi-Municipality</option>
                      <option value="MUNICIPAL">Single Municipality</option>
                    </select>
                  </div>
                </div>

                {/* Primary Municipality & Participating Municipalities */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>Lead / Main Municipality *</label>
                    <select
                      value={formData.municipality}
                      onChange={e => setFormData({ ...formData, municipality: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border-app)', background: 'var(--bg-body)', color: 'var(--text-main)' }}
                    >
                      {MUNICIPALITIES.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {formData.package_type === 'MULTI_MUNICIPALITY' && (
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                        Participating Municipalities ({formData.participating_municipalities.length})
                      </label>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.4rem',
                        maxHeight: 90,
                        overflowY: 'auto',
                        padding: '0.5rem',
                        background: 'var(--bg-body)',
                        borderRadius: '0.4rem',
                        border: '1px solid var(--border-app)'
                      }}>
                        {MUNICIPALITIES.map(m => {
                          const isSelected = formData.participating_municipalities.includes(m);
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                const current = formData.participating_municipalities;
                                const updated = isSelected ? current.filter(x => x !== m) : [...current, m];
                                setFormData({ ...formData, participating_municipalities: updated });
                              }}
                              style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: 999,
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                border: '1px solid var(--border-app)',
                                cursor: 'pointer',
                                background: isSelected ? 'var(--color-primary)' : 'var(--bg-card)',
                                color: isSelected ? '#fff' : 'var(--text-secondary)'
                              }}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>Description & Overview</label>
                  <textarea
                    rows={3}
                    placeholder="Describe highlights, tourist sights, cultural experiences..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border-app)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  />
                </div>

                {/* Duration & Capacity Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Days</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.duration_days}
                      onChange={e => setFormData({ ...formData, duration_days: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border-app)', background: 'var(--bg-body)', color: 'var(--text-main)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Nights</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.duration_nights}
                      onChange={e => setFormData({ ...formData, duration_nights: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border-app)', background: 'var(--bg-body)', color: 'var(--text-main)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Price / Pax (₱) *</label>
                    <input
                      required
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="1500"
                      value={formData.price_per_pax}
                      onChange={e => setFormData({ ...formData, price_per_pax: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border-app)', background: 'var(--bg-body)', color: 'var(--text-main)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Daily Capacity</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.daily_capacity}
                      onChange={e => setFormData({ ...formData, daily_capacity: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border-app)', background: 'var(--bg-body)', color: 'var(--text-main)' }}
                    />
                  </div>
                </div>

                {/* Transportation & Meeting Point */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Transport Mode</label>
                    <select
                      value={formData.transport_mode}
                      onChange={e => setFormData({ ...formData, transport_mode: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border-app)', background: 'var(--bg-body)', color: 'var(--text-main)' }}
                    >
                      <option value="VAN">Aircon Van</option>
                      <option value="JEEPNEY">Chartered Jeepney</option>
                      <option value="BUS">Tourist Bus / Coaster</option>
                      <option value="TRICYCLE">Local Tricycle</option>
                      <option value="WALKING">Walking / Trekking Only</option>
                      <option value="OWN_VEHICLE">Own Vehicle Convoy</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Pickup / Assembly</label>
                    <input
                      type="text"
                      value={formData.meeting_point}
                      onChange={e => setFormData({ ...formData, meeting_point: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border-app)', background: 'var(--bg-body)', color: 'var(--text-main)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Dropoff Point</label>
                    <input
                      type="text"
                      value={formData.dropoff_point}
                      onChange={e => setFormData({ ...formData, dropoff_point: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border-app)', background: 'var(--bg-body)', color: 'var(--text-main)' }}
                    />
                  </div>
                </div>

                {/* Homestays & Tour Guides */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Homestay Options (1 per line)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Tayum Heritage Homestay&#10;Bangued Traveler's Inn"
                      value={formData.homestay_options}
                      onChange={e => setFormData({ ...formData, homestay_options: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border-app)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Accredited Tour Guides (1 per line)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Juan Dela Cruz (DOT Accredited)&#10;Maria Santos (Eco-guide)"
                      value={formData.tour_guide_names}
                      onChange={e => setFormData({ ...formData, tour_guide_names: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border-app)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>

                {/* Package Cover Image Upload */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                    Package Cover Photo *
                  </label>

                  {coverImagePreview ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-app)',
                      background: 'var(--bg-body)'
                    }}>
                      <img
                        src={coverImagePreview}
                        alt="Package Cover Preview"
                        style={{
                          width: '100px',
                          height: '65px',
                          objectFit: 'cover',
                          borderRadius: '0.4rem',
                          border: '1px solid var(--border-app)',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', wordBreak: 'break-all' }}>
                          {coverImageFile ? coverImageFile.name : 'Current Package Cover Photo'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {coverImageFile
                            ? `${(coverImageFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload`
                            : 'Existing cover image'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <label style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.45rem 0.75rem',
                          background: 'var(--color-primary)',
                          color: '#fff',
                          borderRadius: '0.4rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}>
                          <Upload size={14} /> Change
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setCoverImageFile(file);
                                setCoverImagePreview(URL.createObjectURL(file));
                                setFormData(prev => ({ ...prev, cover_image_url: '' }));
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setCoverImageFile(null);
                            setCoverImagePreview(null);
                            setFormData(prev => ({ ...prev, cover_image_url: '' }));
                          }}
                          style={{
                            padding: '0.45rem 0.65rem',
                            background: 'transparent',
                            border: '1px solid #DC2626',
                            color: '#DC2626',
                            borderRadius: '0.4rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1.25rem 1rem',
                      borderRadius: '0.5rem',
                      border: '2px dashed var(--border-app)',
                      background: 'var(--bg-body)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}>
                      <Upload size={24} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Click to select and upload package cover photo
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        PNG, JPG, JPEG, or WEBP (recommended high-resolution landscape photo)
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setCoverImageFile(file);
                            setCoverImagePreview(URL.createObjectURL(file));
                            setFormData(prev => ({ ...prev, cover_image_url: '' }));
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Contact Person & Contact Number */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Contact Person</label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border-app)', background: 'var(--bg-body)', color: 'var(--text-main)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Contact Number</label>
                    <input
                      type="text"
                      value={formData.contact_number}
                      onChange={e => setFormData({ ...formData, contact_number: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border-app)', background: 'var(--bg-body)', color: 'var(--text-main)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-app)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                background: 'var(--bg-body)'
              }}>
                <button
                  type="button"
                  style={btnSecondary}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={btnPrimary}
                >
                  {editingPkg ? 'Save Changes' : 'Publish Provincial Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW & FEEDBACK MODAL */}
      {reviewModalPkg && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: 550,
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-app)', background: 'var(--bg-body)' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                Review: {reviewModalPkg.title}
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Submitted by {reviewModalPkg.municipality_name || reviewModalPkg.municipality || 'Municipal'} Tourism Office
                {reviewModalPkg.creator_name && ` · by ${reviewModalPkg.creator_name}`}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Price: ₱{parseFloat(reviewModalPkg.price || reviewModalPkg.price_per_pax || 0).toLocaleString()} per pax
                {' · '} Duration: {reviewModalPkg.duration_days} day(s)
                {' · '} Capacity: {reviewModalPkg.max_capacity || reviewModalPkg.daily_capacity || 30} pax/day
              </div>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                  Provincial Review Feedback / Decision Notes:
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide praise or specific requested modifications (e.g., reduce pax limit, attach accredited guide certificate, adjust pickup timing)..."
                  value={reviewFeedback}
                  onChange={e => setReviewFeedback(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.4rem', border: '1px solid var(--border-app)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-app)', background: 'var(--bg-body)', display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button style={btnSecondary} onClick={() => setReviewModalPkg(null)}>
                Cancel
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={btnDanger} onClick={() => handleReviewAction('REJECT')}>
                  <XCircle size={14} /> Reject
                </button>
                <button style={{ ...btnSecondary, color: '#D97706', borderColor: '#FDE68A' }} onClick={() => handleReviewAction('REQUEST_REVISION')}>
                  <MessageSquare size={14} /> Request Revision
                </button>
                <button style={btnSuccess} onClick={() => handleReviewAction('APPROVE')}>
                  <CheckCircle size={14} /> Approve Package
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULES & CAPACITY MODAL */}
      {schedulePkg && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: 650,
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-app)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-body)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Manage Schedules: {schedulePkg.title}</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Daily Capacity: {schedulePkg.daily_capacity} slots</div>
              </div>
              <button onClick={() => setSchedulePkg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
              {/* Add schedule form */}
              <form onSubmit={handleAddSchedule} style={{ background: 'var(--bg-body)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-app)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.6rem' }}>+ Add Open Date / Departure</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', display: 'block' }}>Date *</label>
                    <input
                      required
                      type="date"
                      value={newSchedule.travel_date}
                      onChange={e => setNewSchedule({ ...newSchedule, travel_date: e.target.value })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '0.35rem', border: '1px solid var(--border-app)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', display: 'block' }}>Max Capacity</label>
                    <input
                      type="number"
                      min={1}
                      value={newSchedule.max_capacity}
                      onChange={e => setNewSchedule({ ...newSchedule, max_capacity: parseInt(e.target.value) || 20 })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '0.35rem', border: '1px solid var(--border-app)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', display: 'block' }}>Departure Time</label>
                    <input
                      type="time"
                      value={newSchedule.departure_time}
                      onChange={e => setNewSchedule({ ...newSchedule, departure_time: e.target.value })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '0.35rem', border: '1px solid var(--border-app)' }}
                    />
                  </div>
                </div>
                <label style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={newSchedule.is_available}
                    onChange={e => setNewSchedule({ ...newSchedule, is_available: e.target.checked })}
                  /> Open for bookings
                </label>
                <button type="submit" style={{ ...btnPrimary, width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>
                  Add Schedule Slot
                </button>
              </form>

              {/* Schedule listing */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Existing Departure Schedules ({schedules.length})</div>
                {schedules.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem', fontSize: '0.85rem' }}>
                    No departure slots scheduled yet. Add one above!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {schedules.map(s => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', border: '1px solid var(--border-app)', borderRadius: '0.4rem', background: 'var(--bg-card)' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>📅 {(s.travel_date || s.schedule_date || '').toString().split('T')[0]}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Capacity: {s.max_capacity || s.max_slots || 20} · Booked: {s.reserved_count || s.booked_slots || 0} · Remaining: {(s.max_capacity || s.max_slots || 20) - (s.reserved_count || s.booked_slots || 0)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 999, background: s.is_available ? '#E7F3EC' : '#FEE2E2', color: s.is_available ? '#1E6040' : '#DC2626' }}>
                            {s.is_available ? 'OPEN' : 'CLOSED'}
                          </span>
                          <button onClick={() => handleDeleteSchedule(s.id)} style={{ ...btnDanger, padding: '0.3rem 0.5rem' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRANSPORT ASSIGNMENT MODAL */}
      {transportPkg && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: 650,
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-app)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-body)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Vehicle & Driver Allocation: {transportPkg.title}</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Assign vans, jeepneys, coasters and drivers</div>
              </div>
              <button onClick={() => setTransportPkg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
              {/* Add transport form */}
              <form onSubmit={handleAddTransport} style={{ background: 'var(--bg-body)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-app)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.6rem' }}>+ Assign Vehicle / Driver</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', display: 'block' }}>Travel Date *</label>
                    {schedules.length > 0 ? (
                      <select
                        required
                        value={newTransport.travel_date}
                        onChange={e => setNewTransport({ ...newTransport, travel_date: e.target.value })}
                        style={{ width: '100%', padding: '0.4rem', borderRadius: '0.35rem', border: '1px solid var(--border-app)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                      >
                        <option value="">Select a scheduled date</option>
                        {schedules.map(s => {
                          const d = (s.travel_date || '').toString().split('T')[0];
                          return <option key={s.id} value={d}>{d}</option>;
                        })}
                      </select>
                    ) : (
                      <input
                        required
                        type="date"
                        value={newTransport.travel_date}
                        onChange={e => setNewTransport({ ...newTransport, travel_date: e.target.value })}
                        style={{ width: '100%', padding: '0.4rem', borderRadius: '0.35rem', border: '1px solid var(--border-app)' }}
                      />
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', display: 'block' }}>Vehicle Label *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Van - ABC 1234 (14 seater)"
                      value={newTransport.vehicle_label}
                      onChange={e => setNewTransport({ ...newTransport, vehicle_label: e.target.value })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '0.35rem', border: '1px solid var(--border-app)' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', display: 'block' }}>Driver Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Mang Pedro"
                      value={newTransport.driver_name}
                      onChange={e => setNewTransport({ ...newTransport, driver_name: e.target.value })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '0.35rem', border: '1px solid var(--border-app)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', display: 'block' }}>Total Seats</label>
                    <input
                      type="number"
                      min={1}
                      value={newTransport.total_seats}
                      onChange={e => setNewTransport({ ...newTransport, total_seats: parseInt(e.target.value) || 1 })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '0.35rem', border: '1px solid var(--border-app)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', display: 'block' }}>Departure Time</label>
                    <input
                      type="time"
                      value={newTransport.departure_time}
                      onChange={e => setNewTransport({ ...newTransport, departure_time: e.target.value })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '0.35rem', border: '1px solid var(--border-app)' }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.72rem', display: 'block' }}>Route / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Capitol → Boliney → Malibcong"
                    value={newTransport.route_notes}
                    onChange={e => setNewTransport({ ...newTransport, route_notes: e.target.value })}
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '0.35rem', border: '1px solid var(--border-app)' }}
                  />
                </div>
                <button type="submit" style={{ ...btnPrimary, width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>
                  Assign Transport Unit
                </button>
              </form>

              {/* Transports listing */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Assigned Vehicles ({transports.length})</div>
                {transports.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem', fontSize: '0.85rem' }}>
                    No transport units assigned yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {transports.map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', border: '1px solid var(--border-app)', borderRadius: '0.4rem', background: 'var(--bg-card)' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>🚌 {t.vehicle_label} · {(t.travel_date || '').toString().split('T')[0]}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Driver: {t.driver_name || 'Unassigned'} · Seats: {t.total_seats} · {t.route_notes || 'No route notes'}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteTransport(t.id)} style={{ ...btnDanger, padding: '0.3rem 0.5rem' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvincialPackagesTab;
