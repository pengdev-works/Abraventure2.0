import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import Swal from 'sweetalert2';
import {
  Landmark, ShieldCheck, Users, Home, Award, Calendar, AlertCircle,
  FileText, CheckCircle, BarChart3, Megaphone, ClipboardList,
  Download, Plus, Trash2, Edit, Bell, Image, UserPlus, X, Key, Building2,
  Settings, Menu, Globe, ArrowUpRight, Lock, Sliders, Shield,
  Video, Film, Play, Eye, EyeOff, Sparkles, ExternalLink, RefreshCw
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import SafeImage from '../../components/common/SafeImage';
import EyeComfortToggle from '../../components/common/EyeComfortToggle';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

const PIE_COLORS = ['#153325', '#B88B2A', '#355C6D', '#5A534E', '#1D4433'];

const ProvincialDashboard = () => {
  const { token, user, logout } = useAuth();
  const { showAlert } = useAlert();
  const [searchParams, setSearchParams] = useSearchParams();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [data, setData] = useState({ homestays: [], guides: [], municipalAdmins: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'accounts');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && t !== activeTab) {
      setActiveTab(t);
    }
  }, [searchParams]);
  const [remarks, setRemarks] = useState('');
  const [inquiries, setInquiries] = useState([]);

  // Settings State
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsConfig, setSettingsConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('provincial_dot_settings');
      return saved ? JSON.parse(saved) : {
        officeName: 'Provincial Tourism Office - Abra',
        headOfficer: 'Provincial Tourism Officer',
        contactEmail: 'tourism@abra.gov.ph',
        hotline: '+63 (074) 752-8000',
        capitolAddress: 'Capitol Compound, Bangued, Abra 2800',
        enablePublicInquiries: true,
        autoNotifyEmail: true,
        analyticsAutoRefresh: true,
      };
    } catch {
      return {
        officeName: 'Provincial Tourism Office - Abra',
        headOfficer: 'Provincial Tourism Officer',
        contactEmail: 'tourism@abra.gov.ph',
        hotline: '+63 (074) 752-8000',
        capitolAddress: 'Capitol Compound, Bangued, Abra 2800',
        enablePublicInquiries: true,
        autoNotifyEmail: true,
        analyticsAutoRefresh: true,
      };
    }
  });

  const handleSaveSettings = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('provincial_dot_settings', JSON.stringify(settingsConfig));
      setSettingsSaved(true);
      if (showAlert) showAlert('Settings saved successfully', 'success');
      setTimeout(() => setSettingsSaved(false), 3500);
    } catch (err) {
      console.error(err);
    }
  };

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
  const [contentSubTab, setContentSubTab] = useState('advertisements'); // 'advertisements' | 'hero' | 'municipalities'

  // ─── Video Advertisements State ────────────────────────────────
  const [videoAds, setVideoAds] = useState([]);
  const [videoAdsLoading, setVideoAdsLoading] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adModalMode, setAdModalMode] = useState('create'); // 'create' | 'edit'
  const [editingAdId, setEditingAdId] = useState(null);
  const [adForm, setAdForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: 'Eco-Tourism & Waterfalls',
    municipalityId: '',
    ctaText: 'Explore Now',
    ctaLink: '/municipalities',
    badgeLabel: 'Official Provincial DOT Spotlight',
    videoUrl: '',
    thumbnailUrl: '',
    displayOrder: 1,
    isActive: true,
  });
  const [adVideoFile, setAdVideoFile] = useState(null);
  const [adThumbnailFile, setAdThumbnailFile] = useState(null);
  const [adFormLoading, setAdFormLoading] = useState(false);
  const [adMsg, setAdMsg] = useState({ type: '', text: '' });

  // ─── Homepage Hero Banner & Video State ───────────────────────
  const [heroForm, setHeroForm] = useState({
    badgeText: 'Province of Abra · Cordillera Administrative Region',
    title: 'Explore the Heart of Cordillera Abra',
    subtitle: 'From Kaparkan\'s limestone terraces to Itneg heritage weaving villages — discover verified homestays, accredited local guides, and hidden gems across all 27 municipalities.',
    videoUrl: '',
  });
  const [heroVideoFile, setHeroVideoFile] = useState(null);
  const [heroMsg, setHeroMsg] = useState({ type: '', text: '' });
  const [heroLoading, setHeroLoading] = useState(false);

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

  const fetchHeroConfig = async () => {
    try {
      const r = await fetch('/api/announcements/hero');
      if (r.ok) {
        const d = await r.json();
        setHeroForm({
          badgeText: d.badge_text || '',
          title: d.title || '',
          subtitle: d.subtitle || '',
          videoUrl: d.video_url || '',
        });
      }
    } catch (err) { console.error('Error fetching hero config:', err); }
  };

  const handleUpdateHero = async (e) => {
    e.preventDefault();
    setHeroMsg({ type: '', text: '' });
    setHeroLoading(true);
    try {
      const formData = new FormData();
      formData.append('badgeText', heroForm.badgeText);
      formData.append('title', heroForm.title);
      formData.append('subtitle', heroForm.subtitle);
      if (heroForm.videoUrl) formData.append('videoUrl', heroForm.videoUrl);
      if (heroVideoFile) formData.append('media', heroVideoFile);

      const r = await fetch('/api/announcements/hero', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const d = await r.json();
      if (r.ok) {
        setHeroMsg({ type: 'success', text: 'Homepage hero banner & background video updated successfully!' });
        if (d.hero) {
          setHeroForm({
            badgeText: d.hero.badge_text || '',
            title: d.hero.title || '',
            subtitle: d.hero.subtitle || '',
            videoUrl: d.hero.video_url || '',
          });
        }
        setHeroVideoFile(null);
      } else {
        setHeroMsg({ type: 'error', text: d.message || 'Failed to update hero configuration.' });
      }
    } catch (err) {
      setHeroMsg({ type: 'error', text: 'Server error updating hero.' });
    } finally {
      setHeroLoading(false);
    }
  };

  const fetchVideoAds = async () => {
    if (!token) return;
    setVideoAdsLoading(true);
    try {
      const r = await fetch('/api/advertisements/all', { headers });
      if (r.ok) {
        setVideoAds(await r.json());
      }
    } catch (err) {
      console.error('Error fetching video ads:', err);
    } finally {
      setVideoAdsLoading(false);
    }
  };

  const openCreateAdModal = () => {
    setAdModalMode('create');
    setEditingAdId(null);
    setAdForm({
      title: '',
      subtitle: '',
      description: '',
      category: 'Eco-Tourism & Waterfalls',
      municipalityId: '',
      ctaText: 'Explore Now',
      ctaLink: '/municipalities',
      badgeLabel: 'Official Provincial DOT Spotlight',
      videoUrl: '',
      thumbnailUrl: '',
      displayOrder: videoAds.length + 1,
      isActive: true,
    });
    setAdVideoFile(null);
    setAdThumbnailFile(null);
    setAdMsg({ type: '', text: '' });
    setShowAdModal(true);
  };

  const openEditAdModal = (ad) => {
    setAdModalMode('edit');
    setEditingAdId(ad.id);
    setAdForm({
      title: ad.title || '',
      subtitle: ad.subtitle || '',
      description: ad.description || '',
      category: ad.category || 'Eco-Tourism & Waterfalls',
      municipalityId: ad.municipality_id ? String(ad.municipality_id) : '',
      ctaText: ad.cta_text || 'Explore Now',
      ctaLink: ad.cta_link || '/municipalities',
      badgeLabel: ad.badge_label || 'Official Provincial DOT Spotlight',
      videoUrl: ad.video_url || '',
      thumbnailUrl: ad.thumbnail_url || '',
      displayOrder: ad.display_order ?? 0,
      isActive: Boolean(ad.is_active),
    });
    setAdVideoFile(null);
    setAdThumbnailFile(null);
    setAdMsg({ type: '', text: '' });
    setShowAdModal(true);
  };

  const handleSaveAd = async (e) => {
    e.preventDefault();
    setAdFormLoading(true);
    setAdMsg({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('title', adForm.title);
      formData.append('subtitle', adForm.subtitle);
      formData.append('description', adForm.description);
      formData.append('category', adForm.category);
      if (adForm.municipalityId) formData.append('municipalityId', adForm.municipalityId);
      formData.append('ctaText', adForm.ctaText);
      formData.append('ctaLink', adForm.ctaLink);
      formData.append('badgeLabel', adForm.badgeLabel);
      formData.append('isActive', String(adForm.isActive));
      formData.append('displayOrder', String(adForm.displayOrder));
      if (adForm.videoUrl) formData.append('videoUrl', adForm.videoUrl);
      if (adForm.thumbnailUrl) formData.append('thumbnailUrl', adForm.thumbnailUrl);

      if (adVideoFile) formData.append('video', adVideoFile);
      if (adThumbnailFile) formData.append('thumbnail', adThumbnailFile);

      const url = adModalMode === 'create' ? '/api/advertisements' : `/api/advertisements/${editingAdId}`;
      const method = adModalMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setShowAdModal(false);
        if (showAlert) showAlert(data.message || 'Video advertisement saved successfully!', 'success');
        await fetchVideoAds();
      } else {
        setAdMsg({ type: 'error', text: data.message || 'Failed to save advertisement.' });
      }
    } catch (err) {
      console.error('Error saving advertisement:', err);
      setAdMsg({ type: 'error', text: 'Server error saving advertisement.' });
    } finally {
      setAdFormLoading(false);
    }
  };

  const handleToggleAdStatus = async (ad) => {
    try {
      const res = await fetch(`/api/advertisements/${ad.id}/toggle`, {
        method: 'PATCH',
        headers,
      });
      const data = await res.json();
      if (res.ok) {
        if (showAlert) showAlert(data.message, 'success');
        await fetchVideoAds();
      } else {
        if (showAlert) showAlert(data.message || 'Failed to toggle status.', 'error');
      }
    } catch (err) {
      console.error('Error toggling ad status:', err);
      if (showAlert) showAlert('Server error toggling status.', 'error');
    }
  };

  const handleDeleteAd = async (ad) => {
    const result = await Swal.fire({
      title: 'Delete Video Advertisement?',
      html: `Are you sure you want to delete <strong>"${ad.title}"</strong>?<br/><span class="text-xs text-slate-500">It will immediately be removed from the Landing Page.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0F3D3E',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-3xl' },
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/advertisements/${ad.id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (res.ok) {
        if (showAlert) showAlert(data.message || 'Advertisement deleted.', 'success');
        await fetchVideoAds();
      } else {
        if (showAlert) showAlert(data.message || 'Failed to delete advertisement.', 'error');
      }
    } catch (err) {
      console.error('Error deleting ad:', err);
      if (showAlert) showAlert('Server error deleting advertisement.', 'error');
    }
  };

  useEffect(() => { fetchDashboardData(); }, [token]);

  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalytics();
    if (activeTab === 'announcements') fetchAnnouncements();
    if (activeTab === 'activity') fetchActivityLogs();
    if (activeTab === 'content') {
      fetchMunicipalitiesList();
      fetchHeroConfig();
      fetchVideoAds();
    }
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
      APPROVED: 'bg-[#153325]/10 text-[#153325] border border-[#153325]/30',
      REJECTED: 'bg-red-50 text-red-700 border border-red-200',
      PENDING: 'bg-[#FAF7F2] text-[#B88B2A] border border-[#B88B2A]/30',
      ENDORSED: 'bg-[#355C6D]/10 text-[#355C6D] border border-[#355C6D]/30',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${colors[status] || 'bg-slate-100 text-slate-600'}`}>
        {status}
      </span>
    );
  };

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
              <div>
                <span className="font-serif text-lg font-bold tracking-wider text-[#FAF7F2] leading-none block">
                  ABRAVENTURE
                </span>
                <span className="text-[10px] text-[#B88B2A] tracking-[0.2em] uppercase font-bold block mt-1">
                  Provincial DOT
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
            <span className="text-white/70 flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Bangued Capitol DOT
            </span>
            <Link to="/" className="text-[#B88B2A] hover:underline flex items-center gap-1 font-semibold">
              Live Site <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Main Navigation Features */}
          <div className="p-3 space-y-1 flex-1">
            <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B88B2A]">
              Tourism Features
            </div>
            {tabList.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchParams({ tab: tab.id });
                    setRemarks('');
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
                  {tab.id === 'accounts' && pendingMunAdmins > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white shadow-xs">
                      {pendingMunAdmins}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Sidebar: Settings and User Status */}
          <div className="p-4 border-t border-white/10 space-y-2 bg-[#0F261C]">
            {/* Settings button in sidebar */}
            <button
              onClick={() => {
                setActiveTab('settings');
                setSearchParams({ tab: 'settings' });
                setRemarks('');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                activeTab === 'settings'
                  ? 'bg-[#B88B2A] text-[#153325] font-bold shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-[#153325]' : 'text-[#B88B2A]'}`} />
              <span className="flex-1">Settings</span>
            </button>

            {/* Officer Profile Card */}
            <div className="bg-black/30 rounded-xl p-3 flex items-center justify-between border border-white/5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#B88B2A]/20 border border-[#B88B2A]/40 flex items-center justify-center font-bold font-serif text-[#B88B2A] text-xs flex-shrink-0">
                  {user?.fullName?.charAt(0) || 'P'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user?.fullName || 'Provincial Officer'}</p>
                  <p className="text-[10px] text-white/50 truncate font-mono">Provincial DOT</p>
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
        {/* Top Control Bar */}
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
                  Province of Abra · Executive Portal
                </span>
              </div>
              <h1 className="font-serif text-lg sm:text-2xl font-bold text-[#153325]">
                {tabList.find(t => t.id === activeTab)?.label || (activeTab === 'settings' ? 'Settings' : 'Overview')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Eye Comfort Theme Selector */}
            <EyeComfortToggle />

            <button
              onClick={exportAnalyticsCSV}
              className="btn-editorial-outline px-3 py-1.5 text-xs text-[#153325] border-[var(--border-app,#C7D7C9)] hover:bg-white/50 hidden sm:flex items-center gap-1.5 cursor-pointer rounded-lg"
            >
              <Download className="w-3.5 h-3.5 text-[#B88B2A]" /> CSV
            </button>
            <button
              onClick={exportAnalyticsExcel}
              className="btn-editorial-outline px-3 py-1.5 text-xs text-[#153325] border-[var(--border-app,#C7D7C9)] hover:bg-white/50 hidden sm:flex items-center gap-1.5 cursor-pointer rounded-lg"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-700" /> Excel
            </button>
            <button
              onClick={exportAnalyticsPDF}
              className="btn-editorial-gold px-3.5 py-1.5 text-xs tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs rounded-lg"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <div className="p-4 sm:p-8 space-y-6 max-w-7xl w-full">
          {/* Stats Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            {[
              { label: 'Approved Homestays', value: `${approvedHomestays}/${totalHomestays}`, icon: Home },
              { label: 'Approved Guides', value: `${approvedGuides}/${totalGuides}`, icon: Award },
              { label: 'Pending Mun. DOTs', value: pendingMunAdmins, icon: Landmark, alert: pendingMunAdmins > 0 },
              { label: 'Total Inquiries', value: inquiries.length, icon: Calendar },
              { label: 'All Municipalities', value: '27', icon: ShieldCheck },
            ].map((stat) => (
              <div key={stat.label} className={`bg-[var(--bg-card,#F3F8F4)] rounded-xl border ${stat.alert ? 'border-amber-400 bg-amber-50/40' : 'border-[var(--border-app,#C7D7C9)]'} p-4 shadow-2xs flex items-center gap-3 transition-colors`}>
                <div className="w-9 h-9 rounded-lg bg-black/5 border border-[var(--border-app,#C7D7C9)] flex items-center justify-center flex-shrink-0 text-[#153325]">
                  <stat.icon className={`w-4 h-4 ${stat.alert ? 'text-amber-600' : 'text-[#B88B2A]'}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-serif text-xl sm:text-2xl font-bold text-[#153325] leading-tight truncate">{stat.value}</p>
                  <p className="text-[10px] text-[#5A534E] font-bold uppercase tracking-wider truncate">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Remarks bar (for approval tabs) */}
          {(activeTab === 'accounts' || activeTab === 'listings') && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <input
                type="text"
                placeholder="Type approval/rejection remarks before acting on accounts or listings..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full px-3.5 py-2 border border-amber-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#153325]"
              />
            </div>
          )}

          {/* Tab Content Card */}
          <div className="bg-white border border-[#E8DFC8] rounded-2xl shadow-sm p-4 sm:p-6">

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
        {/* Content Management Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Top Sub-Navigation Bar */}
            <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-2 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setContentSubTab('advertisements')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    contentSubTab === 'advertisements'
                      ? 'bg-[#153325] text-[#FAF7F2] shadow-sm'
                      : 'text-[#5A534E] hover:text-[#153325] hover:bg-slate-100'
                  }`}
                >
                  <Film className="w-4 h-4 text-[#B88B2A]" />
                  <span>Video Advertisements</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    contentSubTab === 'advertisements' ? 'bg-[#B88B2A] text-[#153325]' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {videoAds.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setContentSubTab('hero')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    contentSubTab === 'hero'
                      ? 'bg-[#153325] text-[#FAF7F2] shadow-sm'
                      : 'text-[#5A534E] hover:text-[#153325] hover:bg-slate-100'
                  }`}
                >
                  <Megaphone className="w-4 h-4 text-[#B88B2A]" />
                  <span>Homepage Hero &amp; Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => setContentSubTab('municipalities')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    contentSubTab === 'municipalities'
                      ? 'bg-[#153325] text-[#FAF7F2] shadow-sm'
                      : 'text-[#5A534E] hover:text-[#153325] hover:bg-slate-100'
                  }`}
                >
                  <Image className="w-4 h-4 text-[#B88B2A]" />
                  <span>Municipalities &amp; Gallery</span>
                </button>
              </div>

              {contentSubTab === 'advertisements' && (
                <button
                  type="button"
                  onClick={openCreateAdModal}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#B88B2A] to-amber-500 hover:from-amber-600 hover:to-[#B88B2A] text-[#153325] font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post Video Advertisement</span>
                </button>
              )}
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                SUB-TAB 1: VIDEO ADVERTISEMENTS
            ══════════════════════════════════════════════════════════════════ */}
            {contentSubTab === 'advertisements' && (
              <div className="space-y-6">
                {/* Header & KPI Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#5A534E] uppercase tracking-wider">Total Campaigns</span>
                      <Video className="w-4 h-4 text-[#B88B2A]" />
                    </div>
                    <p className="text-2xl font-serif font-bold text-[#153325] mt-2">{videoAds.length}</p>
                    <p className="text-[11px] text-[#5A534E] mt-0.5">Uploaded provincial video ads</p>
                  </div>

                  <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#5A534E] uppercase tracking-wider">Live on Landing Page</span>
                      <Eye className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-serif font-bold text-emerald-800 mt-2">
                      {videoAds.filter(a => a.is_active).length}
                    </p>
                    <p className="text-[11px] text-[#5A534E] mt-0.5">Currently visible to travelers</p>
                  </div>

                  <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#5A534E] uppercase tracking-wider">Highlighted Towns</span>
                      <Landmark className="w-4 h-4 text-[#355C6D]" />
                    </div>
                    <p className="text-2xl font-serif font-bold text-[#355C6D] mt-2">
                      {new Set(videoAds.filter(a => a.municipality_name).map(a => a.municipality_name)).size}
                    </p>
                    <p className="text-[11px] text-[#5A534E] mt-0.5">Municipalities with active video campaigns</p>
                  </div>
                </div>

                {/* Video Ads List / Grid */}
                {videoAdsLoading ? (
                  <div className="flex justify-center items-center py-20 bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl">
                    <div className="w-10 h-10 border-4 border-[#153325] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : videoAds.length === 0 ? (
                  <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-3xl p-12 text-center shadow-xs">
                    <div className="w-16 h-16 bg-[#B88B2A]/15 text-[#B88B2A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Film className="w-8 h-8" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#153325]">No Video Advertisements Yet</h3>
                    <p className="text-xs text-[#5A534E] max-w-md mx-auto mt-2 leading-relaxed">
                      Upload promotional videos for Kaparkan Falls, Tingguian heritage weaving, river rafting, and municipal celebrations. They will automatically be featured in the interactive video showcase on the Landing Page.
                    </p>
                    <button
                      type="button"
                      onClick={openCreateAdModal}
                      className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#153325] text-white font-bold text-xs rounded-xl shadow-md hover:bg-[#1D4433] transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#B88B2A]" />
                      <span>Post First Video Advertisement</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videoAds.map((ad) => (
                      <div
                        key={ad.id}
                        className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                      >
                        {/* Video Player Preview */}
                        <div className="relative aspect-video bg-black">
                          <video
                            controls
                            preload="metadata"
                            poster={ad.thumbnail_url}
                            className="w-full h-full object-cover"
                            src={ad.video_url}
                          />
                          <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                            <span className="bg-[#153325]/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-white/10">
                              {ad.category || 'Eco-Tourism'}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleAdStatus(ad)}
                              title={ad.is_active ? 'Click to Hide from Landing Page' : 'Click to Show on Landing Page'}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md transition-all cursor-pointer ${
                                ad.is_active
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-slate-700 text-slate-200 hover:bg-slate-800'
                              }`}
                            >
                              {ad.is_active ? (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>Active</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  <span>Draft</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-[#5A534E] mb-1.5">
                              {ad.municipality_name ? (
                                <span className="font-semibold text-[#B88B2A]">
                                  📍 {ad.municipality_name}, Abra
                                </span>
                              ) : (
                                <span className="font-semibold text-[#5A534E]">Provincial Tourism</span>
                              )}
                              <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                Priority #{ad.display_order ?? 0}
                              </span>
                            </div>

                            <h4 className="font-serif text-base font-bold text-[#153325] leading-snug mb-1">
                              {ad.title}
                            </h4>
                            {ad.subtitle && (
                              <p className="text-xs text-[#B88B2A] font-medium mb-2">
                                {ad.subtitle}
                              </p>
                            )}
                            <p className="text-xs text-[#5A534E] line-clamp-3 leading-relaxed mb-4">
                              {ad.description || 'Promotional video advertisement showcasing Abra tourism.'}
                            </p>
                          </div>

                          {/* CTA Info & Controls */}
                          <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
                            <div className="flex items-center justify-between text-[11px] bg-[#FAF7F2] p-2 rounded-lg border border-[#E8DFC8]">
                              <span className="font-bold text-[#153325] truncate">
                                CTA: {ad.cta_text || 'Explore Now'}
                              </span>
                              <span className="text-[10px] text-[#5A534E] font-mono truncate max-w-[120px]">
                                {ad.cta_link || '/municipalities'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-slate-400">
                                {ad.created_at ? new Date(ad.created_at).toLocaleDateString('en-PH') : ''}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditAdModal(ad)}
                                  className="p-1.5 text-[#153325] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Advertisement"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAd(ad)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Advertisement"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                SUB-TAB 2: HOMEPAGE HERO BANNER & VIDEO
            ══════════════════════════════════════════════════════════════════ */}
            {contentSubTab === 'hero' && (
              <div className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-900/50">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                  <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">Homepage Hero Banner &amp; Background Video</h3>
                    <p className="text-xs text-white/60">Customize the top "Explore the Heart of Abra" title, tagline, and background video on the landing page.</p>
                  </div>
                </div>

                <form onSubmit={handleUpdateHero} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Badge Text */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1">Top Badge Text</label>
                      <input
                        type="text"
                        value={heroForm.badgeText}
                        onChange={e => setHeroForm(f => ({ ...f, badgeText: e.target.value }))}
                        placeholder="Province of Abra · Cordillera Administrative Region"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>

                    {/* Headline Title */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1">Hero Title ("Explore the Heart of Abra")</label>
                      <input
                        type="text"
                        required
                        value={heroForm.title}
                        onChange={e => setHeroForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Explore the Heart of Cordillera Abra"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  {/* Subtitle Tagline */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1">Subtitle / Tagline Description</label>
                    <textarea
                      rows="2"
                      value={heroForm.subtitle}
                      onChange={e => setHeroForm(f => ({ ...f, subtitle: e.target.value }))}
                      placeholder="From Kaparkan's limestone terraces to Itneg heritage weaving villages..."
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                    />
                  </div>

                  {/* Video Upload or Video URL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1">Upload Background Video File (MP4/WebM)</label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={e => setHeroVideoFile(e.target.files[0])}
                        className="w-full text-xs text-white/80 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-emerald-950 hover:file:bg-amber-400 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1">Or Direct Video URL (Optional)</label>
                      <input
                        type="text"
                        value={heroForm.videoUrl}
                        onChange={e => setHeroForm(f => ({ ...f, videoUrl: e.target.value }))}
                        placeholder="https://example.com/abra_hero.mp4"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  {/* Current Active Video Preview */}
                  {heroForm.videoUrl && (
                    <div className="mt-3 p-3 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs text-amber-300 font-bold">Active Background Video Attached</span>
                      </div>
                      <a href={heroForm.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-amber-400 hover:underline">Preview Video →</a>
                    </div>
                  )}

                  {heroMsg.text && (
                    <p className={`text-xs font-semibold ${heroMsg.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
                      {heroMsg.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={heroLoading}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-emerald-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {heroLoading ? 'Updating Hero...' : 'Publish Homepage Hero Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                SUB-TAB 3: MUNICIPALITIES & GALLERY
            ══════════════════════════════════════════════════════════════════ */}
            {contentSubTab === 'municipalities' && (
              <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Municipalities Profile &amp; Gallery Customization</h2>
                  <p className="text-xs text-slate-500 mt-1">Select any of Abra's 27 municipalities to update its official introductory overview and photo gallery.</p>
                </div>

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
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
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

            {/* ══════════════════════════════════════════════════════════════════
                MODAL: CREATE / EDIT VIDEO ADVERTISEMENT
            ══════════════════════════════════════════════════════════════════ */}
            {showAdModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-150 my-8 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-[#B88B2A]/15 text-[#B88B2A] rounded-xl">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-bold text-[#153325]">
                          {adModalMode === 'create' ? 'Post New Video Advertisement' : 'Edit Video Advertisement'}
                        </h3>
                        <p className="text-xs text-[#5A534E]">
                          Campaign will be featured in the official video showcase on the Landing Page.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAdModal(false)}
                      className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveAd} className="space-y-4">
                    {/* Title & Subtitle */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#153325] mb-1">
                          Campaign Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={adForm.title}
                          onChange={e => setAdForm(f => ({ ...f, title: e.target.value }))}
                          placeholder="e.g. Discover Kaparkan Falls"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#153325]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#153325] mb-1">
                          Subtitle / Catchphrase
                        </label>
                        <input
                          type="text"
                          value={adForm.subtitle}
                          onChange={e => setAdForm(f => ({ ...f, subtitle: e.target.value }))}
                          placeholder="e.g. Emerald terraces in Tineg"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#153325]"
                        />
                      </div>
                    </div>

                    {/* Category & Municipality */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#153325] mb-1">Category</label>
                        <select
                          value={adForm.category}
                          onChange={e => setAdForm(f => ({ ...f, category: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#153325]"
                        >
                          <option value="Eco-Tourism & Waterfalls">Eco-Tourism &amp; Waterfalls</option>
                          <option value="Cultural Heritage & Crafts">Cultural Heritage &amp; Crafts</option>
                          <option value="Mountain Adventure & Treks">Mountain Adventure &amp; Treks</option>
                          <option value="Festivals & Cultural Events">Festivals &amp; Cultural Events</option>
                          <option value="Local Gastronomy & Markets">Local Gastronomy &amp; Markets</option>
                          <option value="Provincial Tourism Spotlight">Provincial Tourism Spotlight</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#153325] mb-1">
                          Featured Municipality (Optional)
                        </label>
                        <select
                          value={adForm.municipalityId}
                          onChange={e => setAdForm(f => ({ ...f, municipalityId: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#153325]"
                        >
                          <option value="">All Abra / General Provincial</option>
                          {municipalitiesList.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold text-[#153325] mb-1">Description</label>
                      <textarea
                        rows="3"
                        value={adForm.description}
                        onChange={e => setAdForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Detailed promotional description of this attraction, heritage, or adventure..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#153325] resize-none"
                      />
                    </div>

                    {/* Video Source: Upload File OR Direct URL */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-[#B88B2A]" />
                        <span className="text-xs font-bold text-[#153325]">Video Media Source</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#5A534E] mb-1">
                            Upload Video File (MP4, WebM, MOV)
                          </label>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={e => setAdVideoFile(e.target.files[0])}
                            className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#153325] file:text-white hover:file:bg-[#1D4433] cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#5A534E] mb-1">
                            Or Direct Video URL
                          </label>
                          <input
                            type="text"
                            value={adForm.videoUrl}
                            onChange={e => setAdForm(f => ({ ...f, videoUrl: e.target.value }))}
                            placeholder="https://.../video.mp4"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#153325]"
                          />
                        </div>
                      </div>
                      {adForm.videoUrl && !adVideoFile && (
                        <p className="text-[11px] text-slate-500 font-mono truncate">
                          Current Video: {adForm.videoUrl}
                        </p>
                      )}
                    </div>

                    {/* Thumbnail Image: Upload File OR Direct URL */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <Image className="w-4 h-4 text-[#B88B2A]" />
                        <span className="text-xs font-bold text-[#153325]">Poster / Thumbnail Image</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#5A534E] mb-1">
                            Upload Poster Image
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => setAdThumbnailFile(e.target.files[0])}
                            className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#153325] file:text-white hover:file:bg-[#1D4433] cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#5A534E] mb-1">
                            Or Thumbnail Image URL
                          </label>
                          <input
                            type="text"
                            value={adForm.thumbnailUrl}
                            onChange={e => setAdForm(f => ({ ...f, thumbnailUrl: e.target.value }))}
                            placeholder="https://.../cover.jpg"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#153325]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* CTA Details & Display Priority */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#153325] mb-1">CTA Button Text</label>
                        <input
                          type="text"
                          value={adForm.ctaText}
                          onChange={e => setAdForm(f => ({ ...f, ctaText: e.target.value }))}
                          placeholder="e.g. Explore Tineg"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#153325]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#153325] mb-1">CTA Destination Link</label>
                        <input
                          type="text"
                          value={adForm.ctaLink}
                          onChange={e => setAdForm(f => ({ ...f, ctaLink: e.target.value }))}
                          placeholder="/municipalities"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#153325]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#153325] mb-1">Display Priority Order</label>
                        <input
                          type="number"
                          value={adForm.displayOrder}
                          onChange={e => setAdForm(f => ({ ...f, displayOrder: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#153325]"
                        />
                      </div>
                    </div>

                    {/* Active Checkbox */}
                    <div className="pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adForm.isActive}
                          onChange={e => setAdForm(f => ({ ...f, isActive: e.target.checked }))}
                          className="w-4 h-4 accent-[#153325] rounded"
                        />
                        <span className="text-xs font-bold text-[#153325]">
                          Publish immediately (Visible on Landing Page video showcase)
                        </span>
                      </label>
                    </div>

                    {adMsg.text && (
                      <p className={`text-xs font-semibold ${adMsg.type === 'error' ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {adMsg.text}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowAdModal(false)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={adFormLoading}
                        className="px-6 py-2 bg-gradient-to-r from-[#B88B2A] to-amber-500 hover:from-amber-600 hover:to-[#B88B2A] text-[#153325] font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        {adFormLoading ? 'Saving...' : adModalMode === 'create' ? 'Publish Video Advertisement' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
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

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#E8DFC8] pb-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#153325]">Portal & Tourism Administration Settings</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure Provincial DOT office details, communication channels, and administrative operational parameters.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Executive Access Active
                </span>
              </div>
            </div>

            {settingsSaved && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Configuration changes successfully updated and applied to the provincial portal session.</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Section 1: Office Profile & Direct Inquiries */}
              <div className="bg-[#FAF7F2] border border-[#E8DFC8] rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#153325] border-b border-[#E8DFC8]/60 pb-3">
                  <Building2 className="w-4 h-4 text-[#B88B2A]" />
                  <span>Provincial Tourism Office Profile</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A534E] mb-1">
                      Official Department / Office Name
                    </label>
                    <input
                      type="text"
                      value={settingsConfig.officeName}
                      onChange={e => setSettingsConfig({ ...settingsConfig, officeName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFC8] rounded-xl text-xs text-[#232120] focus:ring-1 focus:ring-[#153325] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A534E] mb-1">
                      Provincial Tourism Officer / Signatory
                    </label>
                    <input
                      type="text"
                      value={settingsConfig.headOfficer}
                      onChange={e => setSettingsConfig({ ...settingsConfig, headOfficer: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFC8] rounded-xl text-xs text-[#232120] focus:ring-1 focus:ring-[#153325] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A534E] mb-1">
                      Official Contact Email
                    </label>
                    <input
                      type="email"
                      value={settingsConfig.contactEmail}
                      onChange={e => setSettingsConfig({ ...settingsConfig, contactEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFC8] rounded-xl text-xs text-[#232120] focus:ring-1 focus:ring-[#153325] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A534E] mb-1">
                      Public Tourism Assistance Hotline
                    </label>
                    <input
                      type="text"
                      value={settingsConfig.hotline}
                      onChange={e => setSettingsConfig({ ...settingsConfig, hotline: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFC8] rounded-xl text-xs text-[#232120] focus:ring-1 focus:ring-[#153325] focus:outline-none font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A534E] mb-1">
                      Provincial Capitol Office Address
                    </label>
                    <input
                      type="text"
                      value={settingsConfig.capitolAddress}
                      onChange={e => setSettingsConfig({ ...settingsConfig, capitolAddress: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E8DFC8] rounded-xl text-xs text-[#232120] focus:ring-1 focus:ring-[#153325] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Tourism Operations & Workflow Automation */}
              <div className="bg-[#FAF7F2] border border-[#E8DFC8] rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#153325] border-b border-[#E8DFC8]/60 pb-3">
                  <Sliders className="w-4 h-4 text-[#B88B2A]" />
                  <span>Portal Workflow & Inquiries Automation</span>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 bg-white border border-[#E8DFC8] rounded-xl cursor-pointer hover:border-[#153325]/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={settingsConfig.enablePublicInquiries}
                      onChange={e => setSettingsConfig({ ...settingsConfig, enablePublicInquiries: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded text-[#153325] focus:ring-[#153325]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#153325] block">Enable Public Traveler Inquiries Dispatch</span>
                      <span className="text-[11px] text-slate-500">
                        Allows tourists to send inquiries through homestay and guide profiles which route into municipality and provincial dispatch queues.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-white border border-[#E8DFC8] rounded-xl cursor-pointer hover:border-[#153325]/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={settingsConfig.autoNotifyEmail}
                      onChange={e => setSettingsConfig({ ...settingsConfig, autoNotifyEmail: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded text-[#153325] focus:ring-[#153325]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#153325] block">Instant Email Notifications on Municipal Submissions</span>
                      <span className="text-[11px] text-slate-500">
                        Dispatch email summaries to Capitol Officers whenever an LGU endorses a new homestay or tour guide for review.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-white border border-[#E8DFC8] rounded-xl cursor-pointer hover:border-[#153325]/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={settingsConfig.analyticsAutoRefresh}
                      onChange={e => setSettingsConfig({ ...settingsConfig, analyticsAutoRefresh: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded text-[#153325] focus:ring-[#153325]"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#153325] block">Automatic Province Analytics Synchronization</span>
                      <span className="text-[11px] text-slate-500">
                        Periodically sync tourist registration graphs and municipality demographic charts in real-time.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Section 3: Security & Session Policy */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-200 pb-3">
                  <Shield className="w-4 h-4 text-emerald-800" />
                  <span>Security & Account Governance</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Current Role</p>
                    <p className="text-xs font-mono font-bold text-slate-800 mt-1">{user?.role || 'PROVINCIAL_DOT'}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Capitol Level Clearance</p>
                  </div>
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Session Status</p>
                    <p className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> JWT Verified
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Expires on browser exit</p>
                  </div>
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Database Safeguard</p>
                    <p className="text-xs font-bold text-slate-800 mt-1">Daily Automated</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">System Backup Enabled</p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  className="btn-editorial-gold px-6 py-2.5 text-xs font-bold tracking-wider rounded-xl shadow cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Save Portal Settings
                </button>
              </div>
            </form>
          </div>
        )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default ProvincialDashboard;
