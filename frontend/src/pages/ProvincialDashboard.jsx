import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import Swal from 'sweetalert2';
import {
  Landmark, ShieldCheck, Users, Home, Award, Calendar, AlertCircle,
  FileText, CheckCircle, BarChart3, Megaphone, ClipboardList,
  Download, Plus, Trash2, Edit, Bell, Image, UserPlus, X, Key, Building2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import SafeImage from '../components/SafeImage';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

const PIE_COLORS = ['#0F3D3E', '#f59e0b', '#6366f1', '#ec4899', '#10b981'];

const ProvincialDashboard = () => {
  const { token } = useAuth();
  const { showAlert } = useAlert();

  const [data, setData] = useState({ homestays: [], guides: [], municipalAdmins: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('accounts');
  const [remarks, setRemarks] = useState('');
  const [inquiries, setInquiries] = useState([]);

  // Analytics
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPublished, setAnnPublished] = useState(true);
  const [editingAnnId, setEditingAnnId] = useState(null);
  const [annMsg, setAnnMsg] = useState({ type: '', text: '' });

  // Activity Logs
  const [activityLogs, setActivityLogs] = useState([]);

  // Complaints State
  const [complaints, setComplaints] = useState([]);
  const [complaintFilterStatus, setComplaintFilterStatus] = useState('ALL');
  const [complaintFilterMun, setComplaintFilterMun] = useState('ALL');

  // Backup State
  const [backupFile, setBackupFile] = useState(null);
  const [backupMsg, setBackupMsg] = useState({ type: '', text: '' });
  const [backupRestoring, setBackupRestoring] = useState(false);

  // Content Management State
  const [municipalitiesList, setMunicipalitiesList] = useState([]);
  const [selectedMunId, setSelectedMunId] = useState('');
  const [selectedMunDetails, setSelectedMunDetails] = useState(null);
  const [munDescEdit, setMunDescEdit] = useState('');
  const [newMunImageFile, setNewMunImageFile] = useState(null);
  const [newMunImageFeatured, setNewMunImageFeatured] = useState(false);
  const [contentMsg, setContentMsg] = useState({ type: '', text: '' });

  // ─── DOT User CRUD State ──────────────────────────────────────
  const [dotUsers, setDotUsers] = useState([]);
  const [dotUsersLoading, setDotUsersLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalMode, setUserModalMode] = useState('create'); // 'create' | 'edit'
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({
    fullName: '', email: '', password: '', phoneNumber: '',
    role: 'MUNICIPAL_DOT', municipalityId: '', status: 'APPROVED',
    designation: '', officeAddress: '',
  });
  const [userFormMsg, setUserFormMsg] = useState({ type: '', text: '' });
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [forceCreate, setForceCreate] = useState(false);
  const [accountsFilter, setAccountsFilter] = useState('ALL'); // 'ALL' | 'MUNICIPAL_DOT' | 'PROVINCIAL_DOT'

  const headers = { 'Authorization': `Bearer ${token}` };
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };

  // ─── Fetch Helpers ──────────────────────────────────────────
  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      const [listRes, inqRes] = await Promise.all([
        fetch('/api/listings/applications', { headers }),
        fetch('/api/inquiries', { headers }),
      ]);
      if (listRes.ok) setData(await listRes.json());
      if (inqRes.ok) setInquiries(await inqRes.json());
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const r = await fetch('/api/analytics/overview', { headers });
      if (r.ok) setAnalytics(await r.json());
    } catch (err) { console.error(err); }
    finally { setAnalyticsLoading(false); }
  };

  const fetchAnnouncements = async () => {
    try {
      const r = await fetch('/api/announcements/all', { headers });
      if (r.ok) setAnnouncements(await r.json());
    } catch (err) { console.error(err); }
  };

  const fetchActivityLogs = async () => {
    try {
      const r = await fetch('/api/announcements/activity-logs', { headers });
      if (r.ok) setActivityLogs(await r.json());
    } catch (err) { console.error(err); }
  };

  const fetchMunicipalitiesList = async () => {
    try {
      const r = await fetch('/api/municipalities');
      if (r.ok) setMunicipalitiesList(await r.json());
    } catch (err) { console.error(err); }
  };

  const fetchDotUsers = async () => {
    setDotUsersLoading(true);
    try {
      const r = await fetch('/api/listings/users', { headers });
      if (r.ok) setDotUsers(await r.json());
    } catch (err) { console.error(err); }
    finally { setDotUsersLoading(false); }
  };

  const fetchSelectedMunDetails = async (munId) => {
    if (!munId) return;
    try {
      const r = await fetch(`/api/municipalities/${munId}`);
      if (r.ok) {
        const d = await r.json();
        setSelectedMunDetails(d);
        setMunDescEdit(d.municipality.description || '');
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchDashboardData(); }, [token]);

  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalytics();
    if (activeTab === 'announcements') fetchAnnouncements();
    if (activeTab === 'activity') fetchActivityLogs();
    if (activeTab === 'content') fetchMunicipalitiesList();
    if (activeTab === 'complaints') fetchComplaints();
    if (activeTab === 'backup') fetchMunicipalitiesList();
    if (activeTab === 'accounts') {
      fetchDotUsers();
      fetchMunicipalitiesList();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedMunId) fetchSelectedMunDetails(selectedMunId);
  }, [selectedMunId]);

  const handleUpdateMunProfile = async (e) => {
    e.preventDefault();
    setContentMsg({ type: '', text: '' });
    try {
      const r = await fetch('/api/municipalities/profile', {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ description: munDescEdit, municipalityId: selectedMunId }),
      });
      const d = await r.json();
      if (r.ok) {
        setContentMsg({ type: 'success', text: 'Municipality description updated!' });
        await fetchSelectedMunDetails(selectedMunId);
      } else {
        setContentMsg({ type: 'error', text: d.message || 'Failed to update description.' });
      }
    } catch (err) {
      setContentMsg({ type: 'error', text: 'Server error.' });
    }
  };

  const handleAddMunImage = async (e) => {
    e.preventDefault();
    if (!newMunImageFile) return;
    setContentMsg({ type: '', text: '' });

    const formData = new FormData();
    formData.append('image', newMunImageFile);
    formData.append('isFeatured', newMunImageFeatured);
    formData.append('municipalityId', selectedMunId);

    try {
      const r = await fetch('/api/municipalities/images', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const d = await r.json();
      if (r.ok) {
        setContentMsg({ type: 'success', text: 'Photo added successfully!' });
        setNewMunImageFile(null);
        setNewMunImageFeatured(false);
        const fileIn = document.getElementById('prov-mun-file-input');
        if (fileIn) fileIn.value = '';
        await fetchSelectedMunDetails(selectedMunId);
      } else {
        setContentMsg({ type: 'error', text: d.message || 'Failed.' });
      }
    } catch (err) {
      setContentMsg({ type: 'error', text: 'Server error.' });
    }
  };

  const handleDeleteMunImage = async (imgId) => {
    if (!window.confirm('Delete this photo?')) return;
    setContentMsg({ type: '', text: '' });
    try {
      const r = await fetch(`/api/municipalities/images/${imgId}`, {
        method: 'DELETE',
        headers,
      });
      if (r.ok) {
        setContentMsg({ type: 'success', text: 'Photo deleted.' });
        await fetchSelectedMunDetails(selectedMunId);
      } else {
        setContentMsg({ type: 'error', text: 'Failed to delete.' });
      }
    } catch (err) {
      setContentMsg({ type: 'error', text: 'Server error.' });
    }
  };

  // ─── DOT User CRUD Handlers ──────────────────────────────────
  const openCreateModal = () => {
    setUserModalMode('create');
    setEditingUserId(null);
    setForceCreate(false);
    setUserForm({
      fullName: '', email: '', password: '', phoneNumber: '',
      role: 'MUNICIPAL_DOT', municipalityId: '', status: 'APPROVED',
      designation: 'Tourism Officer', officeAddress: 'Municipal Hall',
    });
    setUserFormMsg({ type: '', text: '' });
    setShowUserModal(true);
  };

  const openEditModal = (u) => {
    setUserModalMode('edit');
    setEditingUserId(u.id);
    setForceCreate(false);
    setUserForm({
      fullName: u.full_name || '',
      email: u.email || '',
      password: '',
      phoneNumber: u.phone_number || '',
      role: u.role,
      municipalityId: u.municipality_id ? String(u.municipality_id) : '',
      status: u.status || 'APPROVED',
      designation: u.designation || '',
      officeAddress: u.office_address || '',
    });
    setUserFormMsg({ type: '', text: '' });
    setShowUserModal(true);
  };

  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    setUserFormLoading(true);
    setUserFormMsg({ type: '', text: '' });
    try {
      const url = userModalMode === 'create' ? '/api/listings/users' : `/api/listings/users/${editingUserId}`;
      const method = userModalMode === 'create' ? 'POST' : 'PUT';
      const body = { ...userForm };
      if (userModalMode === 'create' && forceCreate) body.forceCreate = true;
      if (userModalMode === 'edit') delete body.password; // don't send blank password on edit

      const r = await fetch(url, { method, headers: jsonHeaders, body: JSON.stringify(body) });
      const d = await r.json();

      if (r.status === 409 && d.requiresForce) {
        // Duplicate municipality warning — ask for confirmation
        setUserFormMsg({ type: 'warn', text: d.message });
        setForceCreate(true);
        setUserFormLoading(false);
        return;
      }

      if (r.ok) {
        setUserFormMsg({ type: 'success', text: d.message });
        setShowUserModal(false);
        await fetchDotUsers();
        await fetchDashboardData();
      } else {
        setUserFormMsg({ type: 'error', text: d.message || 'Operation failed.' });
      }
    } catch (err) {
      setUserFormMsg({ type: 'error', text: 'Server error.' });
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleDeleteDotUser = async (userId, userName) => {
    const result = await Swal.fire({
      title: 'Delete Account?',
      html: `This will permanently delete the account for <strong>${userName}</strong> and all associated data. This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-3xl' },
    });
    if (!result.isConfirmed) return;
    try {
      const r = await fetch(`/api/listings/users/${userId}`, { method: 'DELETE', headers });
      const d = await r.json();
      if (r.ok) {
        showAlert(d.message, 'success');
        await fetchDotUsers();
        await fetchDashboardData();
      } else {
        showAlert(d.message || 'Delete failed.', 'error');
      }
    } catch (err) {
      showAlert('Server error.', 'error');
    }
  };

  // ─── Approval Handler ────────────────────────────────────────
  const handleApprove = async (id, type, status) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/listings/approve/${id}`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ type, status, remarks: remarks || 'Processed by Provincial DOT' })
      });
      if (response.ok) {
        setRemarks('');
        await fetchDashboardData();
      } else {
        const err = await response.json();
        showAlert(err.message || 'Action failed.', 'error');
      }
    } catch (err) {
      console.error('Error in approval action:', err);
    }
  };

  // ─── Announcement Handlers ───────────────────────────────────
  const handleAnnSubmit = async (e) => {
    e.preventDefault();
    setAnnMsg({ type: '', text: '' });
    try {
      const url = editingAnnId ? `/api/announcements/${editingAnnId}` : '/api/announcements';
      const method = editingAnnId ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method,
        headers: jsonHeaders,
        body: JSON.stringify({ title: annTitle, content: annContent, isPublished: annPublished }),
      });
      const d = await r.json();
      if (r.ok) {
        setAnnMsg({ type: 'success', text: editingAnnId ? 'Updated!' : 'Announcement published!' });
        setAnnTitle(''); setAnnContent(''); setAnnPublished(true); setEditingAnnId(null);
        await fetchAnnouncements();
      } else { setAnnMsg({ type: 'error', text: d.message || 'Failed.' }); }
    } catch (err) { setAnnMsg({ type: 'error', text: 'Server error.' }); }
  };

  const handleDeleteAnn = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this announcement?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0F3D3E',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'rounded-3xl',
      }
    });
    if (!result.isConfirmed) return;
    await fetch(`/api/announcements/${id}`, { method: 'DELETE', headers });
    await fetchAnnouncements();
  };

  const handleEditAnn = (ann) => {
    setEditingAnnId(ann.id);
    setAnnTitle(ann.title);
    setAnnContent(ann.content || '');
    setAnnPublished(ann.is_published);
  };

  // ─── Export Handlers ─────────────────────────────────────────
  const exportAnalyticsCSV = async () => {
    try {
      const r = await fetch('/api/analytics/export', { headers });
      if (!r.ok) return;
      const rows = await r.json();
      if (!rows.length) return;
      const keys = Object.keys(rows[0]);
      const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'abra_bookings_export.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
  };

  const fetchComplaints = async () => {
    try {
      const r = await fetch('/api/complaints', { headers });
      if (r.ok) setComplaints(await r.json());
    } catch (err) { console.error(err); }
  };

  const exportAnalyticsExcel = async () => {
    try {
      const r = await fetch('/api/analytics/export', { headers });
      if (!r.ok) return;
      const bookings = await r.json();
      if (!bookings.length) return;
      
      const ws = XLSX.utils.json_to_sheet(bookings);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Abra Province Bookings");
      XLSX.writeFile(wb, "abra_province_bookings.xlsx");
    } catch (err) { console.error(err); }
  };

  const exportAnalyticsPDF = async () => {
    try {
      const r = await fetch('/api/analytics/export', { headers });
      if (!r.ok) return;
      const bookings = await r.json();
      if (!bookings.length) return;

      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(15, 61, 62);
      doc.text("Abra Province DOT Tourism Booking Report", 14, 20);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-PH')} ${new Date().toLocaleTimeString()}`, 14, 27);
      doc.text(`Total Bookings Extracted: ${bookings.length}`, 14, 35);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text("Tourist Name", 14, 45);
      doc.text("Homestay Name", 60, 45);
      doc.text("Municipality", 110, 45);
      doc.text("Amount", 160, 45);
      doc.text("Status", 180, 45);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 47, 196, 47);
      
      doc.setFont("helvetica", "normal");
      let y = 54;
      bookings.slice(0, 30).forEach((b) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(b.tourist_name || 'N/A', 14, y);
        doc.text((b.homestay_name || 'N/A').substring(0, 22), 60, y);
        doc.text(b.municipality || 'N/A', 110, y);
        doc.text(b.total_amount ? `P${b.total_amount}` : 'N/A', 160, y);
        doc.text(b.status || 'PENDING', 180, y);
        y += 7;
      });
      
      if (bookings.length > 30) {
        y += 5;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.text(`... and ${bookings.length - 30} more bookings. Export Excel or CSV for the complete list.`, 14, y);
      }
      
      doc.save("abra_province_bookings_report.pdf");
    } catch (err) { console.error(err); }
  };

  const handleBackupDownload = () => {
    fetch('/api/backup/export', { headers })
      .then(res => {
        if (!res.ok) throw new Error('Backup failed.');
        return res.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `abraventure_database_backup_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(err => {
        showAlert('Failed to generate backup.', 'error');
      });
  };

  const handleBackupRestore = async (e) => {
    e.preventDefault();
    if (!backupFile) {
      setBackupMsg({ type: 'error', text: 'Please select a backup JSON file.' });
      return;
    }
    const result = await Swal.fire({
      title: 'Warning!',
      text: 'THIS WILL OVERWRITE ALL CURRENT DATABASE DATA AND CANNOT BE UNDONE. Are you absolutely sure you want to proceed?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, overwrite database!',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'rounded-3xl',
      }
    });
    if (!result.isConfirmed) return;
    
    setBackupMsg({ type: '', text: '' });
    setBackupRestoring(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const payload = JSON.parse(event.target.result);
        const res = await fetch('/api/backup/import', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          setBackupMsg({ type: 'success', text: 'Database restored successfully! Reloading dashboard...' });
          setBackupFile(null);
          const fileIn = document.getElementById('backup-file-input');
          if (fileIn) fileIn.value = '';
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          setBackupMsg({ type: 'error', text: data.message || 'Restore failed.' });
        }
      } catch (err) {
        setBackupMsg({ type: 'error', text: 'Invalid JSON backup file or server error.' });
      } finally {
        setBackupRestoring(false);
      }
    };
    reader.readAsText(backupFile);
  };

  // ─── Computed Stats ──────────────────────────────────────────
  const totalHomestays = data.homestays.length;
  const approvedHomestays = data.homestays.filter(h => h.status === 'APPROVED').length;
  const totalGuides = data.guides.length;
  const approvedGuides = data.guides.filter(g => g.status === 'APPROVED').length;
  const pendingMunAdmins = data.municipalAdmins.filter(m => m.status === 'PENDING').length;

  const statusPieData = [
    { name: 'Pending', value: inquiries.filter(i => i.status === 'PENDING').length },
    { name: 'Responded', value: inquiries.filter(i => i.status === 'RESPONDED').length },
    { name: 'Confirmed', value: inquiries.filter(i => i.status === 'CONFIRMED').length },
    { name: 'Cancelled', value: inquiries.filter(i => i.status === 'CANCELLED').length },
  ].filter(d => d.value > 0);

  const tabList = [
    { id: 'accounts', label: 'Municipal Accounts', icon: Landmark },
    { id: 'listings', label: 'Stakeholders Review', icon: FileText },
    { id: 'analytics', label: 'Province Analytics', icon: BarChart3 },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'content', label: 'Content Management', icon: Image },
    { id: 'complaints', label: 'Complaints', icon: AlertCircle },
    { id: 'activity', label: 'Activity Logs', icon: ClipboardList },
    { id: 'backup', label: 'System Backup', icon: ShieldCheck },
  ];

  if (loading) return (
    <div className="flex justify-center items-center py-24 min-h-[calc(100vh-16rem)]">
      <div className="w-12 h-12 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const StatusBadge = ({ status }) => {
    const colors = {
      APPROVED: 'bg-emerald-100 text-emerald-800',
      REJECTED: 'bg-red-100 text-red-800',
      PENDING: 'bg-amber-100 text-amber-800',
      ENDORSED: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide ${colors[status] || 'bg-slate-100 text-slate-600'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 pb-5 border-b border-slate-200 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-amber-500" /> Provincial Office Portal
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">Provincial DOT Control Panel</h1>
          <p className="text-xs text-slate-400 mt-1">Verify listings, approve municipal accounts, monitor Abra tourism province-wide.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={exportAnalyticsCSV}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-550 text-slate-500" /> CSV
          </button>
          <button
            onClick={exportAnalyticsExcel}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-700" /> Excel
          </button>
          <button
            onClick={exportAnalyticsPDF}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" /> PDF Report
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Approved Homestays', value: `${approvedHomestays}/${totalHomestays}`, icon: Home, color: 'bg-emerald-50 text-emerald-900' },
          { label: 'Approved Guides', value: `${approvedGuides}/${totalGuides}`, icon: Award, color: 'bg-emerald-50 text-emerald-900' },
          { label: 'Pending Mun. DOTs', value: pendingMunAdmins, icon: Landmark, color: 'bg-amber-50 text-amber-700' },
          { label: 'Total Inquiries', value: inquiries.length, icon: Calendar, color: 'bg-blue-50 text-blue-700' },
          { label: 'Announcements', value: announcements.length || '—', icon: Megaphone, color: 'bg-purple-50 text-purple-700' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">{s.label}</span>
                <h3 className="text-xl font-black text-slate-800">{s.value}</h3>
              </div>
              <div className={`${s.color} p-2.5 rounded-xl flex-shrink-0`}><Icon className="w-5 h-5" /></div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-t-2xl shadow-sm mb-0 flex px-6 space-x-5 overflow-x-auto whitespace-nowrap scrollbar-none">
        {tabList.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setRemarks(''); }}
              className={`py-4 px-1 border-b-2 font-bold text-sm cursor-pointer transition-all flex items-center gap-2 flex-shrink-0 ${
                activeTab === tab.id ? 'border-emerald-900 text-emerald-950' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Remarks bar (for approval tabs) */}
      {(activeTab === 'accounts' || activeTab === 'listings') && (
        <div className="bg-amber-50/60 border-x border-slate-200 px-6 py-3">
          <input
            type="text"
            placeholder="Type approval/rejection remarks before acting..."
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-900"
          />
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-white border border-slate-200 rounded-b-2xl shadow-sm p-6">

        {/* Accounts Tab */}
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            {/* Header Row */}
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">DOT Account Management</h2>
                <p className="text-xs text-slate-400 mt-0.5">Create, edit, and manage Provincial & Municipal DOT officer accounts.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Role filter */}
                <select
                  value={accountsFilter}
                  onChange={e => setAccountsFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                >
                  <option value="ALL">All Roles</option>
                  <option value="MUNICIPAL_DOT">Municipal DOT</option>
                  <option value="PROVINCIAL_DOT">Provincial DOT</option>
                </select>
                <button
                  id="btn-create-dot-user"
                  onClick={openCreateModal}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Create Account
                </button>
              </div>
            </div>

            {/* Pending Registrations Banner */}
            {data.municipalAdmins.filter(a => a.status === 'PENDING').length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-amber-800">
                  {data.municipalAdmins.filter(a => a.status === 'PENDING').length} pending Municipal DOT registration(s) awaiting your approval — use the Approve/Reject buttons below.
                </span>
              </div>
            )}

            {/* Full DOT Users Table */}
            {dotUsersLoading ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin" /></div>
            ) : (() => {
              const filtered = dotUsers.filter(u => accountsFilter === 'ALL' || u.role === accountsFilter);
              if (filtered.length === 0) return (
                <div className="text-center py-12 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No DOT accounts found. Use "Create Account" to add one.
                </div>
              );
              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold bg-slate-50">
                        {['Role','Municipality','Full Name','Email','Phone','Designation','Status','Actions'].map(h => (
                          <th key={h} className={`py-3 px-4 ${h==='Actions'?'text-center':''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(u => (
                        <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/40 text-slate-600">
                          <td className="py-3 px-4">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              u.role === 'PROVINCIAL_DOT' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {u.role === 'PROVINCIAL_DOT' ? 'Provincial' : 'Municipal'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-950">{u.municipality_name || <span className="text-slate-300 italic font-normal">Province-wide</span>}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{u.full_name}</td>
                          <td className="py-3 px-4 text-slate-500">{u.email}</td>
                          <td className="py-3 px-4">{u.phone_number || '—'}</td>
                          <td className="py-3 px-4 text-slate-500">{u.designation || '—'}</td>
                          <td className="py-3 px-4"><StatusBadge status={u.status} /></td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Quick approve/reject if PENDING */}
                              {u.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(u.id, 'MUNICIPAL_DOT', 'APPROVED')}
                                    className="px-2.5 py-1 bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg font-bold text-[10px]"
                                  >Approve</button>
                                  <button
                                    onClick={() => handleApprove(u.id, 'MUNICIPAL_DOT', 'REJECTED')}
                                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[10px]"
                                  >Reject</button>
                                </>
                              )}
                              {/* Edit */}
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-800 transition-colors"
                                title="Edit account"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteDotUser(u.id, u.full_name)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                                title="Delete account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* ─── User CRUD Modal ─────────────────────────────────────── */}
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-[fadeIn_.15s_ease]">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-800" />
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    {userModalMode === 'create' ? 'Create New DOT Account' : 'Edit DOT Account'}
                  </h3>
                </div>
                <button onClick={() => setShowUserModal(false)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400"><X className="w-4 h-4" /></button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleUserFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">

                {/* Role */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Role *</label>
                    <select
                      value={userForm.role}
                      onChange={e => { setUserForm(f => ({ ...f, role: e.target.value, municipalityId: '' })); setForceCreate(false); setUserFormMsg({type:'',text:''}); }}
                      disabled={userModalMode === 'edit'}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="MUNICIPAL_DOT">Municipal DOT</option>
                      <option value="PROVINCIAL_DOT">Provincial DOT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Status *</label>
                    <select
                      value={userForm.status}
                      onChange={e => setUserForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    >
                      <option value="APPROVED">Approved</option>
                      <option value="PENDING">Pending</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Municipality (only for Municipal DOT) */}
                {userForm.role === 'MUNICIPAL_DOT' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Municipality *</label>
                    <select
                      required
                      value={userForm.municipalityId}
                      onChange={e => { setUserForm(f => ({ ...f, municipalityId: e.target.value })); setForceCreate(false); setUserFormMsg({type:'',text:''}); }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    >
                      <option value="">-- Select Municipality --</option>
                      {municipalitiesList.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Full Name & Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Full Name *</label>
                    <input
                      required type="text" value={userForm.fullName}
                      onChange={e => setUserForm(f => ({ ...f, fullName: e.target.value }))}
                      placeholder="Juan dela Cruz"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Phone</label>
                    <input
                      type="text" value={userForm.phoneNumber}
                      onChange={e => setUserForm(f => ({ ...f, phoneNumber: e.target.value }))}
                      placeholder="09XX XXX XXXX"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Email Address *</label>
                  <input
                    required type="email" value={userForm.email}
                    onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="officer@municipality.gov.ph"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                {/* Password (create only) */}
                {userModalMode === 'create' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Password *</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        required type="password" value={userForm.password}
                        onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="Minimum 8 characters"
                        minLength={8}
                        className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                    </div>
                  </div>
                )}

                {/* Designation & Office (for Municipal DOT) */}
                {userForm.role === 'MUNICIPAL_DOT' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Designation</label>
                      <input
                        type="text" value={userForm.designation}
                        onChange={e => setUserForm(f => ({ ...f, designation: e.target.value }))}
                        placeholder="Tourism Officer"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Office Address</label>
                      <input
                        type="text" value={userForm.officeAddress}
                        onChange={e => setUserForm(f => ({ ...f, officeAddress: e.target.value }))}
                        placeholder="Municipal Hall"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                    </div>
                  </div>
                )}

                {/* Message / Warning */}
                {userFormMsg.text && (
                  <div className={`rounded-xl px-4 py-3 text-xs font-semibold ${
                    userFormMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    userFormMsg.type === 'warn'    ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                                     'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {userFormMsg.text}
                    {userFormMsg.type === 'warn' && (
                      <p className="mt-1 font-normal text-amber-700">Click <strong>"Confirm & Create Anyway"</strong> below to proceed.</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                  >Cancel</button>
                  <button
                    type="submit"
                    disabled={userFormLoading}
                    className="flex-1 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-60"
                  >
                    {userFormLoading ? 'Saving...' :
                      forceCreate ? 'Confirm & Create Anyway' :
                      userModalMode === 'create' ? 'Create Account' : 'Save Changes'
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <div className="space-y-8">
            {/* Homestays */}
            <div>
              <h3 className="font-extrabold text-emerald-950 text-base mb-4 border-b border-slate-100 pb-2">Homestay Verification Audits</h3>
              {data.homestays.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">No homestays registered.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold bg-slate-50">
                        {['Homestay','Owner','Municipality','Docs','Status','Actions'].map(h => <th key={h} className="py-3 px-4">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {data.homestays.map(h => {
                        const endorsed = h.documents.filter(d => d.status === 'ENDORSED').length;
                        return (
                          <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50/40 text-slate-600">
                            <td className="py-3.5 px-4 font-bold text-slate-800">{h.name}</td>
                            <td className="py-3.5 px-4">{h.owner_name}</td>
                            <td className="py-3.5 px-4">{h.municipality_name}</td>
                            <td className="py-3.5 px-4 font-medium text-emerald-950">{endorsed}/{h.documents.length}</td>
                            <td className="py-3.5 px-4"><StatusBadge status={h.status} /></td>
                            <td className="py-3.5 px-4 flex gap-2">
                              {h.status !== 'APPROVED' && <button onClick={() => handleApprove(h.id, 'HOMESTAY', 'APPROVED')} className="px-3 py-1 bg-emerald-900 text-white rounded font-bold text-[10px] hover:bg-emerald-800">Approve</button>}
                              {h.status !== 'REJECTED' && <button onClick={() => handleApprove(h.id, 'HOMESTAY', 'REJECTED')} className="px-3 py-1 bg-red-600 text-white rounded font-bold text-[10px] hover:bg-red-700">Reject</button>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {/* Guides */}
            <div>
              <h3 className="font-extrabold text-emerald-950 text-base mb-4 border-b border-slate-100 pb-2">Tour Guide Verification Audits</h3>
              {data.guides.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">No tour guides registered.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold bg-slate-50">
                        {['Guide','Email','Municipality','Docs','Status','Actions'].map(h => <th key={h} className="py-3 px-4">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {data.guides.map(g => {
                        const endorsed = g.documents.filter(d => d.status === 'ENDORSED').length;
                        return (
                          <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50/40 text-slate-600">
                            <td className="py-3.5 px-4 font-bold text-slate-800">{g.guide_name}</td>
                            <td className="py-3.5 px-4">{g.email}</td>
                            <td className="py-3.5 px-4">{g.municipality_name}</td>
                            <td className="py-3.5 px-4 font-medium text-emerald-950">{endorsed}/{g.documents.length}</td>
                            <td className="py-3.5 px-4"><StatusBadge status={g.status} /></td>
                            <td className="py-3.5 px-4 flex gap-2">
                              {g.status !== 'APPROVED' && <button onClick={() => handleApprove(g.id, 'GUIDE', 'APPROVED')} className="px-3 py-1 bg-emerald-900 text-white rounded font-bold text-[10px] hover:bg-emerald-800">Approve</button>}
                              {g.status !== 'REJECTED' && <button onClick={() => handleApprove(g.id, 'GUIDE', 'REJECTED')} className="px-3 py-1 bg-red-600 text-white rounded font-bold text-[10px] hover:bg-red-700">Reject</button>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Province-Wide Performance Analytics</h2>

            {analyticsLoading ? (
              <div className="text-center py-16"><div className="w-10 h-10 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : (
              <>
                {/* Key Metrics */}
                {analytics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Tourists', value: analytics.touristCount, color: 'text-emerald-900' },
                      { label: 'Total Homestays', value: analytics.homestayStats?.total || 0, color: 'text-emerald-900' },
                      { label: 'Total Guides', value: analytics.guideStats?.total || 0, color: 'text-emerald-900' },
                      { label: 'Confirmed Bookings', value: analytics.statusDist?.find(s => s.status === 'CONFIRMED')?.count || 0, color: 'text-amber-600' },
                    ].map(m => (
                      <div key={m.label} className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">{m.label}</p>
                        <p className={`text-3xl font-black ${m.color}`}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Accreditation rates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h4 className="font-bold text-slate-800 text-sm mb-4">Accreditation Completion</h4>
                    <div className="space-y-4 text-xs">
                      {[
                        { label: 'Homestay Approval Rate', approved: approvedHomestays, total: totalHomestays, color: 'bg-emerald-900' },
                        { label: 'Tour Guide Approval Rate', approved: approvedGuides, total: totalGuides, color: 'bg-amber-500' },
                      ].map(b => (
                        <div key={b.label}>
                          <div className="flex justify-between font-semibold mb-1 text-slate-700">
                            <span>{b.label}</span>
                            <span>{b.total > 0 ? Math.round((b.approved / b.total) * 100) : 0}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div className={`${b.color} h-full rounded-full transition-all duration-700`} style={{ width: `${b.total > 0 ? (b.approved / b.total) * 100 : 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Booking Status Pie */}
                  {statusPieData.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                      <h4 className="font-bold text-slate-800 text-sm mb-4">Booking Status Distribution</h4>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{ fontSize: '10px' }}>
                            {statusPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Monthly Bookings Chart */}
                {analytics?.monthlyBookings?.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-slate-800 text-sm">Monthly Booking Trends ({new Date().getFullYear()})</h4>
                      <button onClick={exportAnalyticsCSV} className="flex items-center gap-1 text-xs text-emerald-700 font-semibold hover:underline">
                        <Download className="w-3 h-3" /> Export All
                      </button>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={analytics.monthlyBookings}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                        <Bar dataKey="total" fill="#0F3D3E" radius={[4, 4, 0, 0]} name="Total" />
                        <Bar dataKey="confirmed" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Confirmed" />
                        <Bar dataKey="cancelled" fill="#ef4444" radius={[4, 4, 0, 0]} name="Cancelled" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Top Municipalities by Bookings */}
                {analytics?.topMunicipalities?.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h4 className="font-bold text-slate-800 text-sm mb-4">Top Municipalities by Bookings</h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={analytics.topMunicipalities} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="municipality" type="category" width={110} tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                        <Bar dataKey="bookings" fill="#6366f1" radius={[0, 4, 4, 0]} name="Bookings" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Attractions by Municipality */}
                {analytics?.attractionsByMun?.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h4 className="font-bold text-slate-800 text-sm mb-4">Attractions Per Municipality</h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={analytics.attractionsByMun}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="municipality" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                        <Bar dataKey="attractions" fill="#10b981" radius={[4, 4, 0, 0]} name="Attractions" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="border border-slate-200 bg-slate-50 rounded-2xl p-6">
              <h3 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-200 pb-2">
                {editingAnnId ? 'Edit Announcement' : 'Post New Announcement'}
              </h3>
              <form onSubmit={handleAnnSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                  <input type="text" required value={annTitle} onChange={e => setAnnTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" placeholder="Announcement title..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Content *</label>
                  <textarea required rows="5" value={annContent} onChange={e => setAnnContent(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs resize-none" placeholder="Write the full announcement..." />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="publish-chk" checked={annPublished} onChange={e => setAnnPublished(e.target.checked)} className="w-4 h-4 accent-emerald-700 rounded" />
                  <label htmlFor="publish-chk" className="text-xs font-semibold text-slate-700">Publish immediately</label>
                </div>
                {annMsg.text && <p className={`text-xs ${annMsg.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>{annMsg.text}</p>}
                <div className="flex gap-2 pt-1">
                  <button type="submit" className="flex-1 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl">
                    {editingAnnId ? 'Update' : 'Publish Announcement'}
                  </button>
                  {editingAnnId && <button type="button" onClick={() => { setEditingAnnId(null); setAnnTitle(''); setAnnContent(''); }} className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold">Cancel</button>}
                </div>
              </form>
            </div>

            {/* Announcements List */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">{announcements.length} Announcements</h3>
              {announcements.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-sm">
                  <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30" /> No announcements posted yet.
                </div>
              ) : announcements.map(ann => (
                <div key={ann.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-extrabold text-slate-800 text-sm">{ann.title}</p>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${ann.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {ann.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{ann.content}</p>
                      <p className="text-[10px] text-slate-300 mt-1">By {ann.created_by_name} · {new Date(ann.created_at).toLocaleDateString('en-PH')}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleEditAnn(ann)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteAnn(ann.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Management Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Municipalities Profile &amp; Gallery Customization</h2>
            
            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Municipality</label>
              <select
                value={selectedMunId}
                onChange={e => { setSelectedMunId(e.target.value); setSelectedMunDetails(null); setContentMsg({type:'',text:''}); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
              >
                <option value="">-- Select Municipality --</option>
                {municipalitiesList.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {selectedMunDetails ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                {/* Left Side: Update Description */}
                <div className="lg:col-span-1 border border-slate-150 p-5 rounded-2xl bg-slate-50 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">Edit Description</h3>
                  <form onSubmit={handleUpdateMunProfile} className="space-y-3">
                    <div>
                      <textarea
                        rows="6"
                        required
                        value={munDescEdit}
                        onChange={e => setMunDescEdit(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs resize-none"
                        placeholder="Write the introduction or descriptive profile for this municipality..."
                      />
                    </div>
                    {contentMsg.text && contentMsg.type !== 'image' && (
                      <p className={`text-xs ${contentMsg.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>{contentMsg.text}</p>
                    )}
                    <button type="submit" className="w-full py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl">
                      Save Changes
                    </button>
                  </form>
                </div>

                {/* Right Side: Manage Cover & Photos */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="border border-slate-150 p-5 rounded-2xl bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2 mb-3">Upload New Gallery Photo</h3>
                    <form onSubmit={handleAddMunImage} className="flex flex-wrap items-center gap-4">
                      <input
                        type="file"
                        id="prov-mun-file-input"
                        accept="image/*"
                        required
                        onChange={e => setNewMunImageFile(e.target.files[0])}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                      />
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={newMunImageFeatured}
                          onChange={e => setNewMunImageFeatured(e.target.checked)}
                          className="w-4 h-4 accent-emerald-700 rounded"
                        />
                        Set as Featured (Cover)
                      </label>
                      <button type="submit" className="px-5 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl">
                        Add Photo
                      </button>
                    </form>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-3">Gallery Photos</h3>
                    {selectedMunDetails.municipality.images?.length === 0 ? (
                      <p className="text-xs text-slate-400 py-8 text-center bg-slate-50 border border-slate-100 rounded-xl">No photos uploaded yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {selectedMunDetails.municipality.images?.map(img => (
                          <div key={img.id} className="aspect-square bg-slate-100 rounded-xl overflow-hidden shadow-sm border border-slate-150 relative group">
                            <SafeImage src={img.image_url} alt="Gallery item" className="w-full h-full object-cover" fallback="square" />
                            {img.is_featured && (
                              <span className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">Featured</span>
                            )}
                            <button
                              onClick={() => handleDeleteMunImage(img.id)}
                              className="absolute top-2 right-2 p-1.5 bg-red-650 hover:bg-red-700 text-white rounded-lg shadow opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete Photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : selectedMunId ? (
              <p className="text-slate-400 text-xs py-8">Loading municipality profile data...</p>
            ) : (
              <p className="text-slate-400 text-xs py-8 text-center border border-dashed border-slate-200 rounded-xl">
                Please select a municipality to manage its content description and cover gallery.
              </p>
            )}
          </div>
        )}

        {/* Activity Logs Tab */}
        {activeTab === 'activity' && (
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-800">System Activity Logs</h2>
              <span className="text-xs text-slate-400">{activityLogs.length} recent entries</span>
            </div>
            {activityLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" /> No activity recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold bg-slate-50">
                      {['Time','User','Role','Action','Target','IP'].map(h => <th key={h} className="py-3 px-4">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs.map(log => (
                      <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/40 text-slate-600">
                        <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{log.actor_name || '—'}</td>
                        <td className="py-2.5 px-4">
                          <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">{(log.actor_role || '').replace(/_/g, ' ')}</span>
                        </td>
                        <td className="py-2.5 px-4 font-bold text-emerald-900">{log.action}</td>
                        <td className="py-2.5 px-4 text-slate-400">{log.target_type || '—'}</td>
                        <td className="py-2.5 px-4 text-slate-300">{log.ip_address || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Complaints Tab */}
        {activeTab === 'complaints' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Province-Wide Complaints & Grievances</h2>
                <p className="text-xs text-slate-400 mt-0.5">Monitor tourist feedback and resolution status across all 27 municipalities.</p>
              </div>
              <div className="flex gap-2">
                <select
                  value={complaintFilterMun}
                  onChange={e => setComplaintFilterMun(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                >
                  <option value="ALL">All Municipalities</option>
                  {municipalitiesList.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
                <select
                  value={complaintFilterStatus}
                  onChange={e => setComplaintFilterStatus(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="INVESTIGATING">INVESTIGATING</option>
                </select>
              </div>
            </div>

            {(() => {
              const filtered = complaints.filter(c => {
                const matchStatus = complaintFilterStatus === 'ALL' || c.status === complaintFilterStatus;
                const matchMun = complaintFilterMun === 'ALL' || c.municipality_name === complaintFilterMun;
                return matchStatus && matchMun;
              });

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-600 opacity-60" />
                    No complaints match the selected filters.
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold bg-slate-50">
                        {['Date','Tourist','Municipality','Complaint Details','Status','Resolution Remarks'].map(h => <th key={h} className="py-3 px-4">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(comp => (
                        <tr key={comp.id} className="border-b border-slate-100 hover:bg-slate-50/40 text-slate-650">
                          <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">{new Date(comp.created_at).toLocaleDateString('en-PH')}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">{comp.tourist_name || 'Anonymous'}<br/><span className="text-[10px] text-slate-400 font-normal">{comp.tourist_email || '—'}</span></td>
                          <td className="py-3.5 px-4 font-bold text-emerald-955">{comp.municipality_name}</td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <strong className="text-slate-700 block mb-0.5">{comp.title}</strong>
                            <span className="text-slate-500 font-light block line-clamp-2">"{comp.description}"</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${comp.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {comp.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 italic max-w-xs">
                            {comp.resolution_details ? `"${comp.resolution_details}"` : <span className="text-slate-300">Unresolved</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* Backup & Restore Tab */}
        {activeTab === 'backup' && (
          <div className="space-y-8">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-800">Database System Backup & Restore</h2>
              <p className="text-xs text-slate-400 mt-0.5">Perform database dumps or reload data archives. Keep backups secure to protect system audits.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Export Panel */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <h3 className="font-extrabold text-emerald-950 text-base mb-2">Export Data Archive</h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Downloads a complete database snapshot containing all 27 municipalities, registered stakeholder accounts, booking histories, itineraries, audit logs, and complaints. The backup will be downloaded in platform-independent JSON format.
                </p>
                <button
                  onClick={handleBackupDownload}
                  className="px-5 py-3 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download System Backup (.json)
                </button>
              </div>

              {/* Import Panel */}
              <div className="bg-rose-50/20 border border-rose-105 rounded-2xl p-6">
                <h3 className="font-extrabold text-rose-955 text-base mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 animate-pulse" />
                  Restore Data Archive
                </h3>
                <p className="text-xs text-rose-800/80 mb-6 leading-relaxed">
                  <strong>CRITICAL WARNING:</strong> Restoring database backup will permanently overwrite all active tables (including homestays, tour guides, and booking requests). This action cannot be undone. Ensure your backup JSON is valid before uploading.
                </p>

                <form onSubmit={handleBackupRestore} className="space-y-4">
                  <div className="border border-slate-250 border-dashed rounded-xl p-4 bg-white">
                    <input
                      id="backup-file-input"
                      type="file"
                      accept=".json"
                      onChange={e => setBackupFile(e.target.files[0])}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-900 hover:file:bg-rose-100 cursor-pointer"
                    />
                  </div>

                  {backupMsg.text && (
                    <p className={`text-xs font-semibold ${backupMsg.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
                      {backupMsg.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={backupRestoring}
                    className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" /> {backupRestoring ? 'Restoring System Database...' : 'Restore System Database'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProvincialDashboard;
