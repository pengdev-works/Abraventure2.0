import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import {
  Package, Plus, Edit, Trash2, Send, CheckCircle, Clock, XCircle, AlertCircle,
  RefreshCw, Eye, Calendar, Truck, Users, MapPin, FileText, ChevronDown,
  ChevronUp, Star, Home, Compass, Navigation, Info, Upload, Check, X,
  ArrowRight, Building2, Globe, Shield, Download, ExternalLink, QrCode, Bus
} from 'lucide-react';

// ─── Status Badge Helper ─────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    DRAFT:               { color: '#7B847F', bg: '#F2EDE2', label: 'Draft', icon: FileText },
    PENDING_APPROVAL:    { color: '#9A6A18', bg: '#FFF4D8', label: 'Pending Review', icon: Clock },
    APPROVED:            { color: '#1E6040', bg: '#E7F3EC', label: 'Approved', icon: CheckCircle },
    REVISION_REQUESTED:  { color: '#B88B2A', bg: '#FFF4D8', label: 'Revision Needed', icon: RefreshCw },
    REJECTED:            { color: '#B84A42', bg: '#FBE9E7', label: 'Rejected', icon: XCircle },
    PUBLISHED:           { color: '#174638', bg: '#D4EBE1', label: 'Published', icon: CheckCircle },
    FULLY_BOOKED:        { color: '#922E28', bg: '#FBE9E7', label: 'Fully Booked', icon: Users },
    COMPLETED:           { color: '#2C5560', bg: '#E8F2F4', label: 'Completed', icon: Star },
    CANCELLED:           { color: '#7B847F', bg: '#F2EDE2', label: 'Cancelled', icon: X },
  };
  const s = map[status] || { color: '#7B847F', bg: '#F2EDE2', label: status, icon: Info };
  const Icon = s.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      background: s.bg, color: s.color,
      padding: '0.25rem 0.65rem', borderRadius: '9999px',
      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.03em',
    }}>
      <Icon size={11} /> {s.label}
    </span>
  );
};

// ─── Transport Option Badge ──────────────────────────────────────────────────
const TransportBadge = ({ option }) => {
  const map = {
    PROVIDED: { label: 'Provided Transport', color: '#174638', bg: '#D4EBE1' },
    OWN:      { label: 'Own Vehicle Only', color: '#2C5560', bg: '#E8F2F4' },
    BOTH:     { label: 'Both Options', color: '#7A5A14', bg: '#FFF4D8' },
  };
  const s = map[option] || { label: option, color: '#7B847F', bg: '#F2EDE2' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '0.2rem 0.55rem', borderRadius: '9999px',
      fontSize: '0.7rem', fontWeight: 600,
    }}>{s.label}</span>
  );
};

// ─── Capacity Bar ────────────────────────────────────────────────────────────
const CapacityBar = ({ reserved, max }) => {
  const pct = max > 0 ? Math.min(100, Math.round((reserved / max) * 100)) : 0;
  const color = pct >= 100 ? '#B84A42' : pct >= 75 ? '#9A6A18' : '#1E6040';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
        <span>{reserved} reserved</span><span>{max - reserved} left</span>
      </div>
      <div style={{ height: 6, background: '#E4DCCB', borderRadius: 99 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const TourPackagesTab = () => {
  const { token, user } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  // ── State ──────────────────────────────────────────────────────────────
  const [subTab, setSubTab] = useState('packages'); // 'packages' | 'schedules' | 'transport' | 'bookings' | 'coordination'
  const [packages, setPackages] = useState([]);
  const [participationReqs, setParticipationReqs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [attractions, setAttractions] = useState([]);
  const [homestays, setHomestays] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected package for schedule/transport management
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [transportList, setTransportList] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  // Package Form
  const [showPkgForm, setShowPkgForm] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState(null);
  const [pkgForm, setPkgForm] = useState({
    title: '', description: '', price: '', durationDays: '2',
    inclusions: '', maxCapacityPerDate: '30', transportOption: 'BOTH',
    homestayIncluded: false,
  });
  const [pkgItems, setPkgItems] = useState([]);
  const [pkgImageFile, setPkgImageFile] = useState(null);
  const [pkgImagePreview, setPkgImagePreview] = useState('');
  const [pkgSaving, setPkgSaving] = useState(false);
  const [pkgMsg, setPkgMsg] = useState({ type: '', text: '' });

  // Schedule form
  const [schedForm, setSchedForm] = useState({ travelDate: '', maxCapacity: '30' });
  const [schedSaving, setSchedSaving] = useState(false);

  // Transport form
  const [transForm, setTransForm] = useState({
    travelDate: '', vehicleLabel: '', departureTime: '', totalSeats: '10', driverName: '', routeNotes: ''
  });
  const [transSaving, setTransSaving] = useState(false);
  const [editingTransId, setEditingTransId] = useState(null);

  // Participation respond
  const [respondingId, setRespondingId] = useState(null);
  const [respondNotes, setRespondNotes] = useState('');

  // Filter
  const [pkgFilter, setPkgFilter] = useState('ALL');
  const [bookingFilter, setBookingFilter] = useState('ALL');

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/tour-packages/manage/my-packages', { headers });
      if (res.ok) setPackages(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchAttractions = async () => {
    if (!user?.municipalityId) return;
    try {
      const res = await fetch(`/api/municipalities/${user.municipalityId}`);
      if (res.ok) {
        const data = await res.json();
        setAttractions(data.attractions || []);
        setHomestays(data.homestays || []);
        setGuides(data.guides || []);
      }
    } catch (err) { console.error(err); }
  };

  const fetchParticipation = async () => {
    try {
      const res = await fetch('/api/tour-packages/participation/requests', { headers });
      if (res.ok) setParticipationReqs(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/tour-packages/bookings/all', { headers });
      if (res.ok) setBookings(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchSchedules = async (pkgId) => {
    setSchedulesLoading(true);
    try {
      const res = await fetch(`/api/tour-packages/${pkgId}/schedules`, { headers });
      if (res.ok) setSchedules(await res.json());
    } catch (err) { console.error(err); }
    finally { setSchedulesLoading(false); }
  };

  const fetchTransport = async (pkgId, date) => {
    try {
      const url = `/api/tour-packages/${pkgId}/transport${date ? `?travelDate=${date}` : ''}`;
      const res = await fetch(url, { headers });
      if (res.ok) setTransportList(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchPackages(), fetchAttractions(), fetchParticipation(), fetchBookings()]);
      setLoading(false);
    };
    init();
  }, [user?.municipalityId]);

  useEffect(() => {
    if (selectedPkg) {
      fetchSchedules(selectedPkg.id);
      fetchTransport(selectedPkg.id);
    }
  }, [selectedPkg]);

  // ── Package Form Handlers ──────────────────────────────────────────────
  const resetPkgForm = () => {
    setPkgForm({ title: '', description: '', price: '', durationDays: '2', inclusions: '', maxCapacityPerDate: '30', transportOption: 'BOTH', homestayIncluded: false });
    setPkgItems([]);
    setPkgImageFile(null);
    setPkgImagePreview('');
    setEditingPkgId(null);
    setPkgMsg({ type: '', text: '' });
  };

  const openEdit = (pkg) => {
    setEditingPkgId(pkg.id);
    setPkgForm({
      title: pkg.title, description: pkg.description || '', price: pkg.price,
      durationDays: pkg.duration_days, inclusions: pkg.inclusions || '',
      maxCapacityPerDate: pkg.max_capacity || 30, transportOption: pkg.transport_option || 'BOTH',
      homestayIncluded: pkg.homestay_included || false,
    });
    setPkgImagePreview(pkg.image_url || '');
    setShowPkgForm(true);
  };

  const addPkgItem = () => {
    setPkgItems(prev => [...prev, { dayNumber: 1, timeSlot: '', activityType: 'ATTRACTION', attractionId: '', homestayId: '', guideId: '', customActivityName: '', notes: '' }]);
  };

  const updatePkgItem = (idx, field, value) => {
    setPkgItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const removePkgItem = (idx) => {
    setPkgItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    if (!pkgForm.title.trim()) { setPkgMsg({ type: 'error', text: 'Package title is required.' }); return; }
    setPkgSaving(true); setPkgMsg({ type: '', text: '' });

    const formData = new FormData();
    Object.entries(pkgForm).forEach(([k, v]) => formData.append(k, v));
    formData.append('items', JSON.stringify(pkgItems));
    if (pkgImageFile) formData.append('coverImage', pkgImageFile);

    try {
      const url = editingPkgId ? `/api/tour-packages/${editingPkgId}` : '/api/tour-packages';
      const method = editingPkgId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (res.ok) {
        setPkgMsg({ type: 'success', text: data.message || 'Package saved successfully!' });
        await fetchPackages();
        setTimeout(() => { setShowPkgForm(false); resetPkgForm(); }, 1500);
      } else {
        setPkgMsg({ type: 'error', text: data.message || 'Failed to save package.' });
      }
    } catch (err) {
      setPkgMsg({ type: 'error', text: 'Server error saving package.' });
    } finally {
      setPkgSaving(false);
    }
  };

  const handleDeletePackage = async (pkg) => {
    const result = await Swal.fire({
      title: 'Delete Package?',
      text: `"${pkg.title}" will be permanently deleted.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#B84A42', confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/tour-packages/${pkg.id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (res.ok) { Swal.fire('Deleted!', data.message, 'success'); await fetchPackages(); }
      else Swal.fire('Error', data.message, 'error');
    } catch { Swal.fire('Error', 'Server error deleting package.', 'error'); }
  };

  const handleSubmitForApproval = async (pkg) => {
    const result = await Swal.fire({
      title: 'Submit for Approval?',
      text: `"${pkg.title}" will be sent to the Provincial Tourism Office for review.`,
      icon: 'question', showCancelButton: true,
      confirmButtonColor: '#174638', confirmButtonText: 'Submit',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/tour-packages/${pkg.id}/submit`, { method: 'POST', headers });
      const data = await res.json();
      if (res.ok) { Swal.fire('Submitted!', data.message, 'success'); await fetchPackages(); }
      else Swal.fire('Error', data.message, 'error');
    } catch { Swal.fire('Error', 'Server error submitting package.', 'error'); }
  };

  // ── Schedule Handlers ──────────────────────────────────────────────────
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!schedForm.travelDate || !selectedPkg) return;
    setSchedSaving(true);
    try {
      const res = await fetch(`/api/tour-packages/${selectedPkg.id}/schedules`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(schedForm),
      });
      const data = await res.json();
      if (res.ok) { setSchedForm({ travelDate: '', maxCapacity: '30' }); await fetchSchedules(selectedPkg.id); }
      else Swal.fire('Error', data.message, 'error');
    } catch { Swal.fire('Error', 'Server error saving schedule.', 'error'); }
    finally { setSchedSaving(false); }
  };

  const handleDeleteSchedule = async (schedId) => {
    if (!window.confirm('Delete this date slot?')) return;
    try {
      await fetch(`/api/tour-packages/${selectedPkg.id}/schedules/${schedId}`, { method: 'DELETE', headers });
      await fetchSchedules(selectedPkg.id);
    } catch { Swal.fire('Error', 'Failed to delete schedule.', 'error'); }
  };

  // ── Transport Handlers ─────────────────────────────────────────────────
  const handleSaveTransport = async (e) => {
    e.preventDefault();
    if (!transForm.travelDate || !transForm.vehicleLabel) return;
    setTransSaving(true);
    try {
      const body = { ...transForm, transportId: editingTransId };
      const res = await fetch(`/api/tour-packages/${selectedPkg.id}/transport`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setTransForm({ travelDate: '', vehicleLabel: '', departureTime: '', totalSeats: '10', driverName: '', routeNotes: '' });
        setEditingTransId(null);
        await fetchTransport(selectedPkg.id);
      } else Swal.fire('Error', data.message, 'error');
    } catch { Swal.fire('Error', 'Server error saving transport.', 'error'); }
    finally { setTransSaving(false); }
  };

  const handleDeleteTransport = async (tid) => {
    if (!window.confirm('Delete this transport slot?')) return;
    try {
      await fetch(`/api/tour-packages/${selectedPkg.id}/transport/${tid}`, { method: 'DELETE', headers });
      await fetchTransport(selectedPkg.id);
    } catch { Swal.fire('Error', 'Failed to delete transport.', 'error'); }
  };

  // ── Participation Handlers ─────────────────────────────────────────────
  const handleRespondParticipation = async (req, action) => {
    try {
      const res = await fetch(`/api/tour-packages/participation/${req.id}/respond`, {
        method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: respondNotes }),
      });
      const data = await res.json();
      if (res.ok) { Swal.fire('Done!', data.message, 'success'); setRespondingId(null); setRespondNotes(''); await fetchParticipation(); }
      else Swal.fire('Error', data.message, 'error');
    } catch { Swal.fire('Error', 'Server error responding.', 'error'); }
  };

  // ── Booking Status Handler ────────────────────────────────────────────
  const handleUpdateBookingStatus = async (bid, status) => {
    try {
      const res = await fetch(`/api/tour-packages/bookings/${bid}/status`, {
        method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) { await fetchBookings(); }
      else Swal.fire('Error', data.message, 'error');
    } catch { Swal.fire('Error', 'Server error updating booking.', 'error'); }
  };

  // ── Filtered Data ──────────────────────────────────────────────────────
  const filteredPackages = pkgFilter === 'ALL' ? packages : packages.filter(p => p.status === pkgFilter);
  const filteredBookings = bookingFilter === 'ALL' ? bookings : bookings.filter(b => b.status === bookingFilter);
  const pendingParticipation = participationReqs.filter(p => p.status === 'PENDING');

  // ── Styles ─────────────────────────────────────────────────────────────
  const cardStyle = {
    background: 'var(--bg-card)', border: '1px solid var(--border-app)',
    borderRadius: '1rem', padding: '1.25rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  };
  const inputStyle = {
    width: '100%', padding: '0.6rem 0.85rem',
    border: '1px solid var(--border-app)', borderRadius: '0.6rem',
    background: 'var(--bg-input)', color: 'var(--text-primary)',
    fontSize: '0.875rem', outline: 'none',
  };
  const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' };
  const btnPrimary = {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.55rem 1.1rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
    background: 'var(--color-primary)', color: '#fff', fontSize: '0.825rem', fontWeight: 700,
    transition: 'all 0.2s',
  };
  const btnSecondary = {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.5rem 1rem', borderRadius: '0.6rem',
    border: '1px solid var(--border-app)', cursor: 'pointer',
    background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.825rem', fontWeight: 600,
  };
  const btnDanger = {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.45rem 0.9rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
    background: '#FBE9E7', color: '#B84A42', fontSize: '0.8rem', fontWeight: 700,
  };
  const btnGold = {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
    background: '#FFF4D8', color: '#7A5A14', fontSize: '0.8rem', fontWeight: 700,
  };

  // ── Sub-tab Nav ────────────────────────────────────────────────────────
  const subTabs = [
    { key: 'packages', label: 'My Packages', icon: Package },
    { key: 'coordination', label: `Coordination ${pendingParticipation.length > 0 ? `(${pendingParticipation.length})` : ''}`, icon: Globe },
    { key: 'schedules', label: 'Schedules & Capacity', icon: Calendar },
    { key: 'transport', label: 'Transportation', icon: Truck },
    { key: 'bookings', label: 'Tourist Bookings', icon: Users },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', marginRight: '0.75rem' }} /> Loading tour packages...
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={22} color="var(--color-primary)" /> Tour Packages
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            Create and manage official tour packages for your municipality
          </p>
        </div>
        {subTab === 'packages' && !showPkgForm && (
          <button style={btnPrimary} onClick={() => { resetPkgForm(); setShowPkgForm(true); }}>
            <Plus size={15} /> New Package
          </button>
        )}
      </div>

      {/* Sub-tab Navigation */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {subTabs.map(tab => {
          const Icon = tab.icon;
          const active = subTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setSubTab(tab.key)} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1rem', borderRadius: '0.6rem', cursor: 'pointer', whiteSpace: 'nowrap',
              background: active ? 'var(--color-primary)' : 'var(--bg-card)',
              color: active ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.8rem', fontWeight: 700,
              border: active ? 'none' : '1px solid var(--border-app)',
              transition: 'all 0.2s',
            }}>
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── PACKAGES TAB ─────────────────────────────────────────────── */}
      {subTab === 'packages' && (
        <div>
          {showPkgForm && (
            <div style={{ ...cardStyle, marginBottom: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>
                  {editingPkgId ? '✏️ Edit Package' : '➕ Create New Package'}
                </h3>
                <button style={btnSecondary} onClick={() => { setShowPkgForm(false); resetPkgForm(); }}>
                  <X size={14} /> Cancel
                </button>
              </div>

              <form onSubmit={handleSavePackage}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Package Title *</label>
                    <input style={inputStyle} value={pkgForm.title} onChange={e => setPkgForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. 3-Day Abra Nature Adventure" required />
                  </div>
                  <div>
                    <label style={labelStyle}>Price per Tourist (PHP) *</label>
                    <input style={inputStyle} type="number" value={pkgForm.price} onChange={e => setPkgForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" min="0" required />
                  </div>
                  <div>
                    <label style={labelStyle}>Duration (Days)</label>
                    <input style={inputStyle} type="number" value={pkgForm.durationDays} onChange={e => setPkgForm(p => ({ ...p, durationDays: e.target.value }))} min="1" max="30" />
                  </div>
                  <div>
                    <label style={labelStyle}>Max Capacity per Date</label>
                    <input style={inputStyle} type="number" value={pkgForm.maxCapacityPerDate} onChange={e => setPkgForm(p => ({ ...p, maxCapacityPerDate: e.target.value }))} min="1" />
                  </div>
                  <div>
                    <label style={labelStyle}>Transportation Option</label>
                    <select style={inputStyle} value={pkgForm.transportOption} onChange={e => setPkgForm(p => ({ ...p, transportOption: e.target.value }))}>
                      <option value="BOTH">Both (Provided & Own Vehicle)</option>
                      <option value="PROVIDED">Provided Only</option>
                      <option value="OWN">Own Vehicle Only</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                      <input type="checkbox" checked={pkgForm.homestayIncluded} onChange={e => setPkgForm(p => ({ ...p, homestayIncluded: e.target.checked }))} />
                      Include Homestay in Package
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Description</label>
                  <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={pkgForm.description} onChange={e => setPkgForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe what tourists will experience..." />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Inclusions (comma-separated)</label>
                  <input style={inputStyle} value={pkgForm.inclusions} onChange={e => setPkgForm(p => ({ ...p, inclusions: e.target.value }))} placeholder="e.g. Tour Guide, Homestay, Meals, Transportation" />
                </div>

                {/* Cover Image */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={labelStyle}>Cover Image</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {pkgImagePreview && (
                      <img src={pkgImagePreview} alt="Preview" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid var(--border-app)' }} />
                    )}
                    <label style={{ ...btnSecondary, cursor: 'pointer' }}>
                      <Upload size={14} /> Choose Image
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                        const f = e.target.files[0];
                        if (f) { setPkgImageFile(f); setPkgImagePreview(URL.createObjectURL(f)); }
                      }} />
                    </label>
                  </div>
                </div>

                {/* Itinerary Items */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <label style={{ ...labelStyle, margin: 0 }}>Day-by-Day Itinerary</label>
                    <button type="button" style={btnGold} onClick={addPkgItem}><Plus size={13} /> Add Activity</button>
                  </div>
                  {pkgItems.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-section-alt)', borderRadius: '0.6rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                      No activities added yet. Click "Add Activity" to build the itinerary.
                    </div>
                  )}
                  {pkgItems.map((item, idx) => (
                    <div key={idx} style={{ ...cardStyle, marginBottom: '0.75rem', background: 'var(--bg-section-alt)', position: 'relative' }}>
                      <button type="button" onClick={() => removePkgItem(idx)} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', ...btnDanger, padding: '0.3rem' }}>
                        <Trash2 size={12} />
                      </button>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                        <div>
                          <label style={labelStyle}>Day #</label>
                          <input style={inputStyle} type="number" min="1" max={pkgForm.durationDays || 10} value={item.dayNumber} onChange={e => updatePkgItem(idx, 'dayNumber', e.target.value)} />
                        </div>
                        <div>
                          <label style={labelStyle}>Time (optional)</label>
                          <input style={inputStyle} type="time" value={item.timeSlot} onChange={e => updatePkgItem(idx, 'timeSlot', e.target.value)} />
                        </div>
                        <div>
                          <label style={labelStyle}>Activity Type</label>
                          <select style={inputStyle} value={item.activityType} onChange={e => updatePkgItem(idx, 'activityType', e.target.value)}>
                            <option value="ATTRACTION">Attraction / Destination</option>
                            <option value="HOMESTAY">Homestay</option>
                            <option value="GUIDE">Tour Guide</option>
                            <option value="CUSTOM">Custom Activity</option>
                          </select>
                        </div>
                        {item.activityType === 'ATTRACTION' && (
                          <div>
                            <label style={labelStyle}>Attraction</label>
                            <select style={inputStyle} value={item.attractionId} onChange={e => updatePkgItem(idx, 'attractionId', e.target.value)}>
                              <option value="">Select attraction...</option>
                              {attractions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                          </div>
                        )}
                        {item.activityType === 'HOMESTAY' && (
                          <div>
                            <label style={labelStyle}>Homestay</label>
                            <select style={inputStyle} value={item.homestayId} onChange={e => updatePkgItem(idx, 'homestayId', e.target.value)}>
                              <option value="">Select homestay...</option>
                              {homestays.filter(h => h.status === 'APPROVED').map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                          </div>
                        )}
                        {item.activityType === 'GUIDE' && (
                          <div>
                            <label style={labelStyle}>Tour Guide</label>
                            <select style={inputStyle} value={item.guideId} onChange={e => updatePkgItem(idx, 'guideId', e.target.value)}>
                              <option value="">Select guide...</option>
                              {guides.filter(g => g.status === 'APPROVED').map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                          </div>
                        )}
                        {item.activityType === 'CUSTOM' && (
                          <div>
                            <label style={labelStyle}>Activity Name</label>
                            <input style={inputStyle} value={item.customActivityName} onChange={e => updatePkgItem(idx, 'customActivityName', e.target.value)} placeholder="e.g. Village Cultural Tour" />
                          </div>
                        )}
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={labelStyle}>Notes</label>
                          <input style={inputStyle} value={item.notes} onChange={e => updatePkgItem(idx, 'notes', e.target.value)} placeholder="Any notes for this activity..." />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {pkgMsg.text && (
                  <div style={{ padding: '0.65rem 1rem', borderRadius: '0.6rem', marginBottom: '1rem',
                    background: pkgMsg.type === 'success' ? '#E7F3EC' : '#FBE9E7',
                    color: pkgMsg.type === 'success' ? '#1E6040' : '#B84A42',
                    fontSize: '0.825rem', fontWeight: 600,
                  }}>
                    {pkgMsg.text}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" style={btnSecondary} onClick={() => { setShowPkgForm(false); resetPkgForm(); }}>Cancel</button>
                  <button type="submit" style={btnPrimary} disabled={pkgSaving}>
                    {pkgSaving ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Check size={14} /> {editingPkgId ? 'Update Package' : 'Create Package'}</>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filter bar */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {['ALL', 'DRAFT', 'PENDING_APPROVAL', 'REVISION_REQUESTED', 'APPROVED', 'PUBLISHED', 'FULLY_BOOKED'].map(s => (
              <button key={s} onClick={() => setPkgFilter(s)} style={{
                padding: '0.35rem 0.8rem', borderRadius: '9999px', border: '1px solid var(--border-app)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                background: pkgFilter === s ? 'var(--color-primary)' : 'var(--bg-card)',
                color: pkgFilter === s ? '#fff' : 'var(--text-secondary)',
              }}>
                {s === 'ALL' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>

          {/* Package list */}
          {filteredPackages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Package size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>No packages found</div>
              <div style={{ fontSize: '0.825rem' }}>Create your first official tour package to get started.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
              {filteredPackages.map(pkg => (
                <div key={pkg.id} style={{ ...cardStyle, position: 'relative', overflow: 'hidden' }}>
                  {pkg.image_url && (
                    <img src={pkg.image_url} alt={pkg.title} style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: '0.6rem', marginBottom: '0.85rem' }} />
                  )}
                  {!pkg.image_url && (
                    <div style={{ width: '100%', height: 80, background: 'linear-gradient(135deg, #174638, #286653)', borderRadius: '0.6rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={28} color="rgba(255,255,255,0.4)" />
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.975rem', color: 'var(--text-primary)', flex: 1, paddingRight: '0.5rem' }}>{pkg.title}</div>
                    <StatusBadge status={pkg.status || 'DRAFT'} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📅 {pkg.duration_days}D</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>💰 ₱{parseFloat(pkg.price).toLocaleString()}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>👥 Max {pkg.max_capacity}/date</span>
                    <TransportBadge option={pkg.transport_option || 'BOTH'} />
                  </div>
                  {pkg.status === 'REVISION_REQUESTED' && pkg.review_remarks && (
                    <div style={{ background: '#FFF4D8', border: '1px solid #E0B94F', borderRadius: '0.5rem', padding: '0.6rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.78rem', color: '#7A5A14' }}>
                      <strong>📝 Revision needed:</strong> {pkg.review_remarks}
                    </div>
                  )}
                  {pkg.status === 'REJECTED' && pkg.review_remarks && (
                    <div style={{ background: '#FBE9E7', border: '1px solid #F0C4C0', borderRadius: '0.5rem', padding: '0.6rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.78rem', color: '#B84A42' }}>
                      <strong>❌ Rejected:</strong> {pkg.review_remarks}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      📋 {pkg.schedule_count || 0} dates · 🎒 {pkg.total_tourist_reservations || 0} tourists reserved
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {['DRAFT', 'REVISION_REQUESTED', 'REJECTED'].includes(pkg.status) && (
                      <button style={btnSecondary} onClick={() => openEdit(pkg)}><Edit size={12} /> Edit</button>
                    )}
                    {['DRAFT', 'REVISION_REQUESTED'].includes(pkg.status) && (
                      <button style={btnGold} onClick={() => handleSubmitForApproval(pkg)}><Send size={12} /> Submit</button>
                    )}
                    <button style={btnSecondary} onClick={() => { setSelectedPkg(pkg); setSubTab('schedules'); }}>
                      <Calendar size={12} /> Schedules
                    </button>
                    <button style={btnSecondary} onClick={() => { setSelectedPkg(pkg); setSubTab('transport'); }}>
                      <Truck size={12} /> Transport
                    </button>
                    {['DRAFT', 'REJECTED', 'REVISION_REQUESTED'].includes(pkg.status) && (
                      <button style={btnDanger} onClick={() => handleDeletePackage(pkg)}><Trash2 size={12} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── COORDINATION TAB ──────────────────────────────────────────── */}
      {subTab === 'coordination' && (
        <div>
          <div style={{ ...cardStyle, marginBottom: '1rem', background: '#E8F2F4', border: '1px solid #B8D8E0' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <Globe size={18} color="#2C5560" style={{ marginTop: 2 }} />
              <div style={{ fontSize: '0.85rem', color: '#2C5560' }}>
                <strong>Multi-Municipality Coordination</strong> — When the Provincial Tourism Office includes your municipality in a multi-destination package, you will receive a coordination request here. Review the package details and confirm your availability.
              </div>
            </div>
          </div>

          {participationReqs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Globe size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>No coordination requests</div>
              <div style={{ fontSize: '0.825rem' }}>You have no pending participation requests from the Provincial Tourism Office.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {participationReqs.map(req => (
                <div key={req.id} style={{ ...cardStyle, borderLeft: `4px solid ${req.status === 'CONFIRMED' ? '#1E6040' : req.status === 'DECLINED' ? '#B84A42' : '#9A6A18'}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{req.package_title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>From: <strong>{req.package_home_municipality}</strong> · Created by {req.created_by_name}</div>
                    </div>
                    <StatusBadge status={req.status === 'CONFIRMED' ? 'APPROVED' : req.status === 'DECLINED' ? 'REJECTED' : 'PENDING_APPROVAL'} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ background: 'var(--bg-section-alt)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.78rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Duration</div>
                      <div style={{ fontWeight: 700 }}>{req.duration_days} Days</div>
                    </div>
                    <div style={{ background: 'var(--bg-section-alt)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.78rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Price</div>
                      <div style={{ fontWeight: 700 }}>₱{parseFloat(req.price).toLocaleString()}</div>
                    </div>
                    <div style={{ background: 'var(--bg-section-alt)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.78rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Package Status</div>
                      <div style={{ fontWeight: 700 }}>{req.package_status?.replace(/_/g, ' ')}</div>
                    </div>
                  </div>
                  {req.package_description && (
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{req.package_description}</div>
                  )}
                  {req.status === 'PENDING' && (
                    <div>
                      {respondingId === req.id ? (
                        <div style={{ background: 'var(--bg-section-alt)', borderRadius: '0.6rem', padding: '0.75rem', marginTop: '0.5rem' }}>
                          <label style={labelStyle}>Notes (optional)</label>
                          <textarea style={{ ...inputStyle, minHeight: 60, marginBottom: '0.75rem', resize: 'vertical' }} value={respondNotes} onChange={e => setRespondNotes(e.target.value)} placeholder="Any notes about your municipality's availability..." />
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button style={btnPrimary} onClick={() => handleRespondParticipation(req, 'CONFIRM')}><Check size={13} /> Confirm Participation</button>
                            <button style={btnDanger} onClick={() => handleRespondParticipation(req, 'DECLINE')}><X size={13} /> Decline</button>
                            <button style={btnSecondary} onClick={() => setRespondingId(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button style={btnGold} onClick={() => setRespondingId(req.id)}>
                          <ArrowRight size={13} /> Respond to Request
                        </button>
                      )}
                    </div>
                  )}
                  {req.status !== 'PENDING' && req.notes && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      📝 Notes: {req.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Expected Tourist Arrivals from Provincial Tours */}
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Bus size={18} color="var(--color-primary)" /> Expected Tourist Arrivals from Provincial Tours
                </h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Confirmed multi-municipality tour circuits from the Provincial Tourism Office visiting your municipality.
                </div>
              </div>
            </div>

            {bookings.filter(b => b.reviewing_authority === 'PROVINCIAL').length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                No active tourist delegations from Provincial tours currently scheduled for your municipality.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bookings.filter(b => b.reviewing_authority === 'PROVINCIAL').map(b => (
                  <div key={b.id} style={{ ...cardStyle, borderLeft: '4px solid #0284C7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', color: '#0369A1', background: '#E0F2FE', padding: '0.15rem 0.5rem', borderRadius: '0.35rem' }}>
                            {b.booking_reference}
                          </span>
                          <StatusBadge status={b.status} />
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#E0F2FE', color: '#0369A1', padding: '0.15rem 0.5rem', borderRadius: 999 }}>
                            🌟 Provincial Circuit
                          </span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {b.package_title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                          <span>📅 Expected Date: <strong>{b.travel_date?.split('T')[0] || b.travel_date}</strong></span>
                          <span>👥 Expected Tourists: <strong>{b.number_of_tourists} Pax</strong></span>
                          <span>🚌 Transport: <strong>{b.transport_choice}</strong></span>
                          <span>👤 Tourist: <strong>{b.tourist_name}</strong> {b.tourist_phone ? `(📞 ${b.tourist_phone})` : ''}</span>
                        </div>
                        {b.tourist_spots?.length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#0369A1', marginTop: '0.4rem', background: '#F0F9FF', padding: '0.35rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #BAE6FD' }}>
                            📍 <strong>Tourist Spots in Itinerary:</strong> {b.tourist_spots.join(', ')}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369A1', background: '#E0F2FE', padding: '0.25rem 0.6rem', borderRadius: '0.35rem' }}>
                          🛡️ Reviewed & Confirmed by Provincial DOT
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SCHEDULES TAB ─────────────────────────────────────────────── */}
      {subTab === 'schedules' && (
        <div>
          {/* Package selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Select Package to Manage Schedules</label>
            <select style={{ ...inputStyle, maxWidth: 400 }} value={selectedPkg?.id || ''} onChange={e => {
              const pkg = packages.find(p => p.id === e.target.value);
              setSelectedPkg(pkg || null);
            }}>
              <option value="">Choose a package...</option>
              {packages.map(p => <option key={p.id} value={p.id}>{p.title} ({p.status})</option>)}
            </select>
          </div>

          {selectedPkg && (
            <>
              <div style={{ ...cardStyle, marginBottom: '1.25rem', borderLeft: '4px solid #C99A2E' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                  📅 Add Date Slot — {selectedPkg.title}
                </div>
                <form onSubmit={handleSaveSchedule} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div>
                    <label style={labelStyle}>Travel Date *</label>
                    <input style={{ ...inputStyle, width: 180 }} type="date" value={schedForm.travelDate} onChange={e => setSchedForm(p => ({ ...p, travelDate: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Max Capacity</label>
                    <input style={{ ...inputStyle, width: 120 }} type="number" value={schedForm.maxCapacity} onChange={e => setSchedForm(p => ({ ...p, maxCapacity: e.target.value }))} min="1" />
                  </div>
                  <button type="submit" style={btnPrimary} disabled={schedSaving}>
                    {schedSaving ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />}
                    Add Slot
                  </button>
                </form>
              </div>

              <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                📊 Existing Date Slots
              </div>
              {schedulesLoading ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /></div>
              ) : schedules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', background: 'var(--bg-section-alt)', borderRadius: '0.75rem', fontSize: '0.825rem' }}>
                  No date slots added yet. Add your first available travel date above.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                  {schedules.map(sched => {
                    const remaining = sched.max_capacity - sched.reserved_count;
                    const pct = Math.round((sched.reserved_count / sched.max_capacity) * 100);
                    return (
                      <div key={sched.id} style={{ ...cardStyle, position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                            {new Date(sched.travel_date).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          {remaining <= 0 ? (
                            <span style={{ background: '#FBE9E7', color: '#B84A42', padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700 }}>🔴 FULL</span>
                          ) : remaining <= 5 ? (
                            <span style={{ background: '#FFF4D8', color: '#7A5A14', padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700 }}>🟡 {remaining} left</span>
                          ) : (
                            <span style={{ background: '#E7F3EC', color: '#1E6040', padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700 }}>🟢 {remaining} left</span>
                          )}
                        </div>
                        <CapacityBar reserved={sched.reserved_count} max={sched.max_capacity} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capacity: {sched.max_capacity}</span>
                          <button style={btnDanger} onClick={() => handleDeleteSchedule(sched.id)} disabled={sched.reserved_count > 0}>
                            <Trash2 size={11} /> {sched.reserved_count > 0 ? 'Has Bookings' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TRANSPORT TAB ─────────────────────────────────────────────── */}
      {subTab === 'transport' && (
        <div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Select Package to Manage Transportation</label>
            <select style={{ ...inputStyle, maxWidth: 400 }} value={selectedPkg?.id || ''} onChange={e => {
              const pkg = packages.find(p => p.id === e.target.value);
              setSelectedPkg(pkg || null);
            }}>
              <option value="">Choose a package...</option>
              {packages.filter(p => ['BOTH', 'PROVIDED'].includes(p.transport_option || 'BOTH')).map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          {selectedPkg && (
            <>
              <div style={{ ...cardStyle, marginBottom: '1.25rem', borderLeft: '4px solid #3D7180' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                  🚌 {editingTransId ? 'Edit Vehicle' : 'Add Vehicle'} — {selectedPkg.title}
                </div>
                <form onSubmit={handleSaveTransport}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Travel Date *</label>
                      <input style={inputStyle} type="date" value={transForm.travelDate} onChange={e => setTransForm(p => ({ ...p, travelDate: e.target.value }))} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Vehicle / Unit Label *</label>
                      <input style={inputStyle} value={transForm.vehicleLabel} onChange={e => setTransForm(p => ({ ...p, vehicleLabel: e.target.value }))} placeholder="e.g. Vehicle 01, Van A" required />
                    </div>
                    <div>
                      <label style={labelStyle}>Departure Time</label>
                      <input style={inputStyle} type="time" value={transForm.departureTime} onChange={e => setTransForm(p => ({ ...p, departureTime: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Total Seats</label>
                      <input style={inputStyle} type="number" min="1" value={transForm.totalSeats} onChange={e => setTransForm(p => ({ ...p, totalSeats: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Driver / Provider</label>
                      <input style={inputStyle} value={transForm.driverName} onChange={e => setTransForm(p => ({ ...p, driverName: e.target.value }))} placeholder="Driver or transport company name" />
                    </div>
                    <div>
                      <label style={labelStyle}>Route / Notes</label>
                      <input style={inputStyle} value={transForm.routeNotes} onChange={e => setTransForm(p => ({ ...p, routeNotes: e.target.value }))} placeholder="e.g. Bangued → Kaparkan" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" style={btnPrimary} disabled={transSaving}>
                      {transSaving ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />}
                      {editingTransId ? 'Update Vehicle' : 'Add Vehicle'}
                    </button>
                    {editingTransId && (
                      <button type="button" style={btnSecondary} onClick={() => { setEditingTransId(null); setTransForm({ travelDate: '', vehicleLabel: '', departureTime: '', totalSeats: '10', driverName: '', routeNotes: '' }); }}>
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Transport list */}
              {transportList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', background: 'var(--bg-section-alt)', borderRadius: '0.75rem', fontSize: '0.825rem' }}>
                  No vehicles added yet. Add transportation vehicles above.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Object.entries(
                    transportList.reduce((acc, t) => {
                      const d = t.travel_date?.split('T')[0] || t.travel_date;
                      if (!acc[d]) acc[d] = [];
                      acc[d].push(t);
                      return acc;
                    }, {})
                  ).map(([date, vehicles]) => (
                    <div key={date} style={cardStyle}>
                      <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                        📅 {new Date(date).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {vehicles.map(v => {
                          const avail = v.total_seats - v.reserved_seats;
                          return (
                            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.85rem', background: 'var(--bg-section-alt)', borderRadius: '0.6rem', flexWrap: 'wrap' }}>
                              <Truck size={15} color="var(--color-primary)" />
                              <div style={{ flex: 1, minWidth: 140 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{v.vehicle_label}</div>
                                {v.driver_name && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Driver: {v.driver_name}</div>}
                                {v.route_notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Route: {v.route_notes}</div>}
                                {v.departure_time && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Departs: {v.departure_time}</div>}
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                {avail <= 0 ? (
                                  <span style={{ background: '#FBE9E7', color: '#B84A42', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>FULL</span>
                                ) : (
                                  <span style={{ background: '#E7F3EC', color: '#1E6040', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                                    {avail}/{v.total_seats} seats
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '0.35rem' }}>
                                <button style={btnSecondary} onClick={() => {
                                  setEditingTransId(v.id);
                                  setTransForm({ travelDate: date, vehicleLabel: v.vehicle_label, departureTime: v.departure_time || '', totalSeats: v.total_seats, driverName: v.driver_name || '', routeNotes: v.route_notes || '' });
                                }}>
                                  <Edit size={12} />
                                </button>
                                <button style={btnDanger} onClick={() => handleDeleteTransport(v.id)} disabled={v.reserved_seats > 0}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── BOOKINGS TAB ──────────────────────────────────────────────── */}
      {subTab === 'bookings' && (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Filter:</span>
            {['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].map(s => (
              <button key={s} onClick={() => setBookingFilter(s)} style={{
                padding: '0.3rem 0.75rem', borderRadius: 999, border: '1px solid var(--border-app)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                background: bookingFilter === s ? 'var(--color-primary)' : 'var(--bg-card)',
                color: bookingFilter === s ? '#fff' : 'var(--text-secondary)',
              }}>
                {s}
              </button>
            ))}
          </div>

          {filteredBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Users size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>No bookings</div>
              <div style={{ fontSize: '0.825rem' }}>Tourist bookings for your packages will appear here.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredBookings.map(b => (
                <div key={b.id} style={{ ...cardStyle }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-primary)', background: '#E7F3EC', padding: '0.2rem 0.6rem', borderRadius: '0.4rem' }}>
                          {b.booking_reference}
                        </div>
                        <StatusBadge status={b.status} />
                        <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: 999, background: b.payment_status === 'VERIFIED' ? '#E7F3EC' : b.payment_status === 'PROOF_SUBMITTED' ? '#FFF4D8' : '#F2EDE2', color: b.payment_status === 'VERIFIED' ? '#1E6040' : b.payment_status === 'PROOF_SUBMITTED' ? '#7A5A14' : '#7B847F', fontWeight: 700 }}>
                          💳 {b.payment_status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{b.package_title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span>👤 {b.tourist_name}</span>
                        <span>📅 {b.travel_date?.split('T')[0] || b.travel_date}</span>
                        <span>👥 {b.number_of_tourists} tourist(s)</span>
                        <span>🚌 {b.transport_choice}</span>
                        {b.homestay_name && <span>🏠 {b.homestay_name}</span>}
                      </div>
                      {b.total_amount && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>💰 Total: ₱{parseFloat(b.total_amount).toLocaleString()}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {b.reviewing_authority === 'PROVINCIAL' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.35rem 0.75rem', borderRadius: '0.5rem', background: '#E0F2FE', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Globe size={13} /> Reviewed by Provincial Tourism Office
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Expected: {b.number_of_tourists} Pax on {b.travel_date?.split('T')[0] || b.travel_date}
                          </span>
                        </div>
                      ) : (
                        <>
                          {b.status === 'PENDING' && (
                            <>
                              <button
                                style={btnPrimary}
                                onClick={() => handleUpdateBookingStatus(b.id, 'CONFIRMED')}
                              >
                                <Check size={12} /> Confirm Booking
                              </button>
                              {b.payment_status === 'PROOF_SUBMITTED' && (
                                <button
                                  style={{ ...btnPrimary, background: '#1E6040' }}
                                  onClick={async () => {
                                    const r = await fetch(`/api/tour-packages/bookings/${b.id}/verify-payment`, { method: 'PUT', headers });
                                    const d = await r.json();
                                    if (r.ok) { Swal.fire('Confirmed!', d.message, 'success'); await fetchBookings(); }
                                    else Swal.fire('Error', d.message, 'error');
                                  }}
                                >
                                  <Check size={12} /> Verify Payment
                                </button>
                              )}
                              <button
                                style={btnDanger}
                                onClick={() => handleUpdateBookingStatus(b.id, 'CANCELLED')}
                              >
                                <X size={12} /> Cancel
                              </button>
                            </>
                          )}
                          {b.status === 'CONFIRMED' && (
                            <>
                              {b.payment_status !== 'VERIFIED' && (
                                <button
                                  style={{ ...btnPrimary, background: '#1E6040' }}
                                  onClick={async () => {
                                    const r = await fetch(`/api/tour-packages/bookings/${b.id}/verify-payment`, { method: 'PUT', headers });
                                    const d = await r.json();
                                    if (r.ok) { Swal.fire('Verified!', d.message, 'success'); await fetchBookings(); }
                                    else Swal.fire('Error', d.message, 'error');
                                  }}
                                >
                                  <Check size={12} /> Mark as Paid
                                </button>
                              )}
                              <button
                                style={btnGold}
                                onClick={() => handleUpdateBookingStatus(b.id, 'COMPLETED')}
                              >
                                <Check size={12} /> Complete
                              </button>
                              <button
                                style={btnDanger}
                                onClick={() => handleUpdateBookingStatus(b.id, 'CANCELLED')}
                              >
                                <X size={12} /> Cancel
                              </button>
                            </>
                          )}
                          {b.payment_proof_url && (
                            <a
                              href={b.payment_proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ ...btnSecondary, textDecoration: 'none' }}
                            >
                              <ExternalLink size={12} /> Proof
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TourPackagesTab;
