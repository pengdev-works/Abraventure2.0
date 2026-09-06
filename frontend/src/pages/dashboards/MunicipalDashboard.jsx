import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import Swal from 'sweetalert2';
import {
  Landmark, Compass, FolderClosed, CheckSquare, Plus, Trash2, Edit,
  AlertCircle, FileCheck, CheckCircle, User, Upload, Mail, Phone,
  MapPin, X, Calendar, BarChart3, MessageSquare, Star, Download,
  FileText, Tag, Send, Package, Menu, ArrowUpRight, ShieldCheck, Settings,
  Camera, Building2, QrCode, Award, Check, Clock, Shield, Lock, RefreshCw, Sparkles,
  Film, Video, Play, Eye, EyeOff, Search, ExternalLink, Navigation, Layers, Globe, Home, ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import SafeImage from '../../components/common/SafeImage';
import EyeComfortToggle from '../../components/common/EyeComfortToggle';

const MunicipalDashboard = () => {
  const { token, user, logout, refreshUser } = useAuth();
  const { showAlert } = useAlert();
  const [searchParams, setSearchParams] = useSearchParams();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'attractions');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && t !== activeTab) {
      setActiveTab(t);
    }
  }, [searchParams]);
  const [data, setData] = useState({ homestays: [], guides: [] });
  const [requirements, setRequirements] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocUrl, setSelectedDocUrl] = useState(null);

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.fullName || '');
  const [profilePhone, setProfilePhone] = useState(user?.phoneNumber || '');
  const [profileDesignation, setProfileDesignation] = useState(user?.profile?.designation || '');
  const [profileAddress, setProfileAddress] = useState(user?.profile?.office_address || '');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(user?.profile?.profile_picture_url || user?.municipalityFeaturedImage || '');
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Municipality Customizer State
  const [munDescription, setMunDescription] = useState('');
  const [munImages, setMunImages] = useState([]);
  const [munImageFile, setMunImageFile] = useState(null);
  const [munIsFeatured, setMunIsFeatured] = useState(false);
  const [munMsg, setMunMsg] = useState({ type: '', text: '' });

  // ─── Municipal Video Advertisements State ──────────────────────
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
    ctaText: 'Explore Municipality',
    ctaLink: '/municipalities',
    badgeLabel: 'Municipal Tourism Spotlight',
    videoUrl: '',
    thumbnailUrl: '',
    displayOrder: 1,
    isActive: true,
  });
  const [adVideoFile, setAdVideoFile] = useState(null);
  const [adThumbnailFile, setAdThumbnailFile] = useState(null);
  const [adFormLoading, setAdFormLoading] = useState(false);
  const [adMsg, setAdMsg] = useState({ type: '', text: '' });

  // Forms State
  const [attractions, setAttractions] = useState([]);
  const [editingAttractionId, setEditingAttractionId] = useState(null);
  const [attractionName, setAttractionName] = useState('');
  const [attractionDesc, setAttractionDesc] = useState('');
  const [attractionCategory, setAttractionCategory] = useState('Nature');
  const [attractionImageFile, setAttractionImageFile] = useState(null);
  const [attractionImagePreview, setAttractionImagePreview] = useState('');
  const [attractionLoc, setAttractionLoc] = useState('');
  const [attractionLat, setAttractionLat] = useState('');
  const [attractionLng, setAttractionLng] = useState('');
  const [attractionVideoFile, setAttractionVideoFile] = useState(null);
  const [attractionVideoUrl, setAttractionVideoUrl] = useState('');
  const [attractionVideoInputMode, setAttractionVideoInputMode] = useState('file'); // 'file' | 'url'
  const [dashAttractionSearch, setDashAttractionSearch] = useState('');
  const [dashAttractionCatFilter, setDashAttractionCatFilter] = useState('ALL');
  const [detectingCoords, setDetectingCoords] = useState(false);
  const [attractionSaving, setAttractionSaving] = useState(false);
  const [previewAttraction, setPreviewAttraction] = useState(null);

  const [reqName, setReqName] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqTarget, setReqTarget] = useState('HOMESTAY');
  const [reqRequired, setReqRequired] = useState(true);
  const [editingReqId, setEditingReqId] = useState(null);
  const [reqSaving, setReqSaving] = useState(false);
  const [reqSearch, setReqSearch] = useState('');
  const [reqFilterTarget, setReqFilterTarget] = useState('ALL');
  const [reqFilterMandatory, setReqFilterMandatory] = useState('ALL');

  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewFilter, setReviewFilter] = useState('ALL');
  const [inlineRemarks, setInlineRemarks] = useState({});

  // Events State
  const [events, setEvents] = useState([]);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventCategory, setEventCategory] = useState('Festival');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventImageFile, setEventImageFile] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventMsg, setEventMsg] = useState({ type: '', text: '' });

  // Inquiries (Municipal DOT view)
  const [dotInquiries, setDotInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inqReply, setInqReply] = useState('');

  // Analytics
  const [analytics, setAnalytics] = useState(null);

  // Complaints State
  const [complaints, setComplaints] = useState([]);
  const [resolvingComplaintId, setResolvingComplaintId] = useState(null);
  const [complaintResolution, setComplaintResolution] = useState('');
  const [resolvingStatus, setResolvingStatus] = useState('RESOLVED');

  // Tour Packages State
  const [packagesList, setPackagesList] = useState([]);
  const [editingPkgId, setEditingPkgId] = useState(null);
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgDuration, setPkgDuration] = useState('2');
  const [pkgInclusions, setPkgInclusions] = useState('');
  const [pkgImageUrl, setPkgImageUrl] = useState('');      // existing URL from DB (edit mode)
  const [pkgImageFile, setPkgImageFile] = useState(null);  // newly selected file
  const [pkgImagePreview, setPkgImagePreview] = useState(''); // local blob preview
  const [pkgItems, setPkgItems] = useState([]);
  const [pkgMsg, setPkgMsg] = useState({ type: '', text: '' });
  const [dashPkgSearch, setDashPkgSearch] = useState('');
  const [dashPkgDurationFilter, setDashPkgDurationFilter] = useState('ALL');
  const [pkgSubmitting, setPkgSubmitting] = useState(false);
  const [previewPackage, setPreviewPackage] = useState(null);
  const [previewPackageItems, setPreviewPackageItems] = useState([]);
  const [previewPkgLoading, setPreviewPkgLoading] = useState(false);

  // Sync profile details when user context loads
  useEffect(() => {
    if (user) {
      setProfileName(user.fullName || '');
      setProfilePhone(user.phoneNumber || '');
      setProfileDesignation(user.profile?.designation || '');
      setProfileAddress(user.profile?.office_address || '');
      setProfilePicPreview(user.profile?.profile_picture_url || user.municipalityFeaturedImage || '');
    }
  }, [user]);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileUpdating(true);
    setProfileMsg({ type: '', text: '' });

    const formData = new FormData();
    formData.append('fullName', profileName);
    formData.append('phoneNumber', profilePhone);
    formData.append('designation', profileDesignation);
    formData.append('officeAddress', profileAddress);
    if (profilePicFile) {
      formData.append('profilePicture', profilePicFile);
    }

    try {
      const response = await fetch('/api/listings/municipal-dot', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const resData = await response.json();
      if (response.ok) {
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
        setProfilePicFile(null);
        await refreshUser();
      } else {
        setProfileMsg({ type: 'error', text: resData.message || 'Failed to update profile.' });
      }
    } catch (err) {
      console.error(err);
      setProfileMsg({ type: 'error', text: 'Server error updating profile.' });
    } finally {
      setProfileUpdating(false);
    }
  };

  const fetchMunicipalityData = async () => {
    if (!user?.municipalityId) return;
    try {
      const response = await fetch(`/api/municipalities/${user.municipalityId}`);
      if (response.ok) {
        const munData = await response.json();
        setMunDescription(munData.municipality.description || '');
        setMunImages(munData.municipality.images || []);
        setAttractions(munData.attractions || []);
      }
    } catch (err) {
      console.error('Error fetching municipality profile data:', err);
    }
  };

  const handleUpdateMunicipalityProfile = async (e) => {
    e.preventDefault();
    setMunMsg({ type: '', text: '' });

    try {
      const response = await fetch('/api/municipalities/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ description: munDescription })
      });

      const resData = await response.json();
      if (response.ok) {
        setMunMsg({ type: 'success', text: 'Municipality details updated successfully!' });
        await fetchMunicipalityData();
      } else {
        setMunMsg({ type: 'error', text: resData.message || 'Failed to update details.' });
      }
    } catch (err) {
      console.error(err);
      setMunMsg({ type: 'error', text: 'Server error updating details.' });
    }
  };

  const handleAddMunicipalityImage = async (e) => {
    e.preventDefault();
    if (!munImageFile) return;
    setMunMsg({ type: '', text: '' });

    const formData = new FormData();
    formData.append('image', munImageFile);
    formData.append('isFeatured', munIsFeatured);

    try {
      const response = await fetch('/api/municipalities/images', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const resData = await response.json();
      if (response.ok) {
        setMunMsg({ type: 'success', text: 'Image uploaded successfully!' });
        setMunImageFile(null);
        setMunIsFeatured(false);
        const fileInput = document.getElementById('mun-file-input');
        if (fileInput) fileInput.value = '';
        await fetchMunicipalityData();
      } else {
        setMunMsg({ type: 'error', text: resData.message || 'Failed to upload image.' });
      }
    } catch (err) {
      console.error(err);
      setMunMsg({ type: 'error', text: 'Server error uploading image.' });
    }
  };

  const handleDeleteMunicipalityImage = async (imageId) => {
    if (!window.confirm('Delete this municipality image?')) return;
    setMunMsg({ type: '', text: '' });

    try {
      const response = await fetch(`/api/municipalities/images/${imageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const resData = await response.json();
      if (response.ok) {
        setMunMsg({ type: 'success', text: 'Image deleted successfully!' });
        await fetchMunicipalityData();
      } else {
        setMunMsg({ type: 'error', text: resData.message || 'Failed to delete image.' });
      }
    } catch (err) {
      console.error(err);
      setMunMsg({ type: 'error', text: 'Server error deleting image.' });
    }
  };

  const fetchData = async () => {
    if (!token || !user) return;
    try {
      // 1. Fetch local homestay & guide applications
      const appRes = await fetch('/api/listings/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (appRes.ok) {
        const appData = await appRes.json();
        setData(appData);
      }

      // 2. Fetch local requirements
      const reqRes = await fetch(`/api/requirements/municipality/${user.municipalityId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequirements(reqData);
      }

      // 3. Fetch submissions
      const subRes = await fetch('/api/documents/municipal-submissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubmissions(subData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchMunicipalityData();
    fetchEvents();
    fetchDotInquiries();
    fetchAnalytics();
    fetchComplaints();
    fetchPackages();
    fetchVideoAds();
  }, [token, user]);

  const fetchVideoAds = async () => {
    if (!token) return;
    setVideoAdsLoading(true);
    try {
      const r = await fetch('/api/advertisements/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (r.ok) {
        setVideoAds(await r.json());
      }
    } catch (err) {
      console.error('Error fetching municipal video ads:', err);
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
      ctaText: `Explore ${user?.municipalityName || 'Municipality'}`,
      ctaLink: user?.municipalityId ? `/municipalities/${user.municipalityId}` : '/municipalities',
      badgeLabel: `${user?.municipalityName || 'Municipal'} Tourism Spotlight`,
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
      ctaText: ad.cta_text || `Explore ${user?.municipalityName || 'Municipality'}`,
      ctaLink: ad.cta_link || (user?.municipalityId ? `/municipalities/${user.municipalityId}` : '/municipalities'),
      badgeLabel: ad.badge_label || `${user?.municipalityName || 'Municipal'} Tourism Spotlight`,
      videoUrl: ad.video_url || '',
      thumbnailUrl: ad.thumbnail_url || '',
      displayOrder: ad.display_order ?? 1,
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
        showAlert(data.message || 'Video advertisement saved successfully!', 'success');
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
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(data.message, 'success');
        await fetchVideoAds();
      } else {
        showAlert(data.message || 'Failed to toggle status.', 'error');
      }
    } catch (err) {
      console.error('Error toggling ad status:', err);
      showAlert('Server error toggling status.', 'error');
    }
  };

  const handleDeleteAd = async (ad) => {
    const result = await Swal.fire({
      title: 'Delete Video Advertisement?',
      html: `Are you sure you want to delete <strong>"${ad.title}"</strong>?<br/><span class="text-xs text-slate-500">It will immediately be removed from the tourism portal and your municipality page.</span>`,
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
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(data.message || 'Advertisement deleted.', 'success');
        await fetchVideoAds();
      } else {
        showAlert(data.message || 'Failed to delete advertisement.', 'error');
      }
    } catch (err) {
      console.error('Error deleting ad:', err);
      showAlert('Server error deleting advertisement.', 'error');
    }
  };

  const fetchPackages = async () => {
    if (!user?.municipalityId) return;
    try {
      const res = await fetch(`/api/packages?municipalityId=${user.municipalityId}`);
      if (res.ok) setPackagesList(await res.json());
    } catch (err) {
      console.error('Error fetching packages:', err);
    }
  };

  const handleAddPkgItem = () => {
    setPkgItems([
      ...pkgItems,
      { dayNumber: 1, activityType: 'ATTRACTION', targetId: '', customActivityName: '', notes: '' }
    ]);
  };

  const handleRemovePkgItem = (index) => {
    setPkgItems(pkgItems.filter((_, i) => i !== index));
  };

  const handlePkgItemChange = (index, field, value) => {
    const updated = [...pkgItems];
    updated[index][field] = value;
    setPkgItems(updated);
  };

  const handlePkgImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPkgImageFile(file);
      setPkgImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    if (!pkgTitle.trim()) return;

    setPkgMsg({ type: '', text: '' });
    setPkgSubmitting(true);

    const formattedItems = pkgItems.map(item => ({
      dayNumber: parseInt(item.dayNumber || 1),
      activityType: item.activityType,
      attractionId: item.activityType === 'ATTRACTION' ? item.targetId : null,
      homestayId: item.activityType === 'HOMESTAY' ? item.targetId : null,
      guideId: item.activityType === 'GUIDE' ? item.targetId : null,
      customActivityName: item.activityType === 'CUSTOM' ? item.customActivityName : null,
      notes: item.notes || '',
    }));

    const formData = new FormData();
    formData.append('title', pkgTitle);
    formData.append('description', pkgDesc);
    formData.append('price', pkgPrice ? parseFloat(pkgPrice) : 0);
    formData.append('durationDays', parseInt(pkgDuration || 1));
    formData.append('inclusions', pkgInclusions);
    formData.append('items', JSON.stringify(formattedItems));
    if (pkgImageFile) {
      formData.append('coverImage', pkgImageFile);
    } else if (pkgImageUrl) {
      formData.append('imageUrl', pkgImageUrl);
    }

    try {
      const url = editingPkgId ? `/api/packages/${editingPkgId}` : '/api/packages';
      const method = editingPkgId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const resData = await response.json();
      if (response.ok) {
        showAlert(editingPkgId ? 'Package updated successfully!' : 'Package created successfully!', 'success');
        setEditingPkgId(null);
        setPkgTitle('');
        setPkgDesc('');
        setPkgPrice('');
        setPkgDuration('2');
        setPkgInclusions('');
        setPkgImageUrl('');
        setPkgImageFile(null);
        setPkgImagePreview('');
        setPkgItems([]);
        fetchPackages();
      } else {
        setPkgMsg({ type: 'error', text: resData.message || 'Failed to save package.' });
      }
    } catch (err) {
      console.error(err);
      setPkgMsg({ type: 'error', text: 'Server error saving package.' });
    } finally {
      setPkgSubmitting(false);
    }
  };

  const handleEditPackage = async (pkg) => {
    setEditingPkgId(pkg.id);
    setPkgTitle(pkg.title);
    setPkgDesc(pkg.description || '');
    setPkgPrice(pkg.price || '');
    setPkgDuration(pkg.duration_days || 1);
    setPkgInclusions(pkg.inclusions || '');
    setPkgImageUrl(pkg.image_url || '');
    setPkgImageFile(null);
    setPkgImagePreview(pkg.image_url || '');

    const formEl = document.getElementById('package-form-panel');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
      const res = await fetch(`/api/packages/${pkg.id}`);
      if (res.ok) {
        const details = await res.json();
        const mappedItems = details.items.map(i => ({
          dayNumber: i.day_number,
          activityType: i.activity_type,
          targetId: i.activity_type === 'ATTRACTION' ? i.attraction_id : i.activity_type === 'HOMESTAY' ? i.homestay_id : i.guide_id,
          customActivityName: i.custom_activity_name || '',
          notes: i.notes || '',
        }));
        setPkgItems(mappedItems);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPackagePreview = async (pkg) => {
    setPreviewPackage(pkg);
    setPreviewPackageItems([]);
    setPreviewPkgLoading(true);
    try {
      const res = await fetch(`/api/packages/${pkg.id}`);
      if (res.ok) {
        const details = await res.json();
        setPreviewPackageItems(details.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewPkgLoading(false);
    }
  };

  const handleDeletePackage = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Tour Package?',
      text: 'This municipal tour package will no longer be visible to tourists.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#153325',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete package',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-3xl' }
    });
    if (!result.isConfirmed) return;
    try {
      const response = await fetch(`/api/packages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        showAlert('Package deleted successfully.', 'success');
        fetchPackages();
      } else {
        const resData = await response.json();
        showAlert(resData.message || 'Failed to delete package.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Server error deleting package.', 'error');
    }
  };

  const fetchEvents = async () => {
    if (!user?.municipalityId) return;
    try {
      const r = await fetch(`/api/events?municipalityId=${user.municipalityId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setEvents(await r.json());
    } catch (err) { console.error(err); }
  };

  const fetchDotInquiries = async () => {
    if (!token) return;
    try {
      const r = await fetch('/api/inquiries', { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setDotInquiries(await r.json());
    } catch (err) { console.error(err); }
  };

  const fetchAnalytics = async () => {
    if (!token) return;
    try {
      const r = await fetch('/api/analytics/municipal', { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setAnalytics(await r.json());
    } catch (err) { console.error(err); }
  };

  const fetchComplaints = async () => {
    if (!token) return;
    try {
      const r = await fetch('/api/complaints', { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setComplaints(await r.json());
    } catch (err) { console.error(err); }
  };

  const handleResolveComplaint = async (e) => {
    e.preventDefault();
    if (!complaintResolution) return;
    try {
      const response = await fetch(`/api/complaints/${resolvingComplaintId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resolutionDetails: complaintResolution,
          status: resolvingStatus
        })
      });
      if (response.ok) {
        showAlert('Complaint resolved successfully!', 'success');
        setResolvingComplaintId(null);
        setComplaintResolution('');
        await fetchComplaints();
      } else {
        const err = await response.json();
        showAlert(err.message || 'Failed to resolve complaint.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Server error.', 'error');
    }
  };

  const exportPDF = () => {
    if (!analytics) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 61, 62);
    doc.text(`${user.municipalityName} DOT Tourism Analytics Report`, 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-PH')} ${new Date().toLocaleTimeString()}`, 14, 27);
    doc.text(`Total Attractions: ${analytics.attractionCount}`, 14, 37);
    doc.text(`Total Events Posted: ${events.length}`, 14, 43);
    doc.text(`Total Inquiries Received: ${dotInquiries.length}`, 14, 49);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 61, 62);
    doc.text("Monthly Bookings", 14, 62);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text("Month", 14, 70);
    doc.text("Total Inquiries", 60, 70);
    doc.text("Confirmed Bookings", 110, 70);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 72, 196, 72);
    
    doc.setFont("helvetica", "normal");
    let y = 78;
    if (analytics.monthlyBookings && analytics.monthlyBookings.length > 0) {
      analytics.monthlyBookings.forEach((b) => {
        doc.text(b.month || 'N/A', 14, y);
        doc.text(String(b.total || 0), 60, y);
        doc.text(String(b.confirmed || 0), 110, y);
        y += 7;
      });
    } else {
      doc.text("No bookings recorded.", 14, y);
      y += 7;
    }
    
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 61, 62);
    doc.text("Homestay Analytics", 14, y);
    
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text("Homestay Name", 14, y);
    doc.text("Confirmed Bookings", 110, y);
    
    doc.line(14, y+2, 196, y+2);
    y += 8;
    doc.setFont("helvetica", "normal");
    
    if (analytics.homestayOccupancy && analytics.homestayOccupancy.length > 0) {
      analytics.homestayOccupancy.forEach((h) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(h.homestay || 'N/A', 14, y);
        doc.text(String(h.bookings || 0), 110, y);
        y += 7;
      });
    } else {
      doc.text("No homestays registered or active.", 14, y);
    }
    
    doc.save(`${user.municipalityName.toLowerCase()}_tourism_report.pdf`);
  };

  const exportExcel = () => {
    if (!analytics) return;
    
    const bookingsData = analytics.monthlyBookings.map(b => ({
      'Month': b.month,
      'Total Inquiries': b.total,
      'Confirmed Bookings': b.confirmed
    }));
    
    const homestayData = analytics.homestayOccupancy.map(h => ({
      'Homestay Name': h.homestay,
      'Confirmed Bookings': h.bookings
    }));
    
    const wb = XLSX.utils.book_new();
    
    const wsBookings = XLSX.utils.json_to_sheet(bookingsData);
    XLSX.utils.book_append_sheet(wb, wsBookings, "Monthly Bookings");
    
    const wsHomestays = XLSX.utils.json_to_sheet(homestayData);
    XLSX.utils.book_append_sheet(wb, wsHomestays, "Homestay Bookings");
    
    XLSX.writeFile(wb, `${user.municipalityName.toLowerCase()}_tourism_report.xlsx`);
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setEventMsg({ type: '', text: '' });
    const formData = new FormData();
    formData.append('title', eventTitle);
    formData.append('description', eventDesc);
    formData.append('category', eventCategory);
    formData.append('startDate', eventStartDate);
    formData.append('endDate', eventEndDate);
    formData.append('venue', eventVenue);
    if (eventImageFile) formData.append('image', eventImageFile);
    try {
      const url = editingEventId ? `/api/events/${editingEventId}` : '/api/events';
      const method = editingEventId ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: formData });
      const d = await r.json();
      if (r.ok) {
        setEventMsg({ type: 'success', text: editingEventId ? 'Event updated!' : 'Event created!' });
        setEventTitle(''); setEventDesc(''); setEventCategory('Festival');
        setEventStartDate(''); setEventEndDate(''); setEventVenue('');
        setEventImageFile(null); setEditingEventId(null);
        await fetchEvents();
      } else { setEventMsg({ type: 'error', text: d.message || 'Failed.' }); }
    } catch (err) { setEventMsg({ type: 'error', text: 'Server error.' }); }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await fetch(`/api/events/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      await fetchEvents();
    } catch (err) { console.error(err); }
  };

  const handleStartEditEvent = (ev) => {
    setEditingEventId(ev.id);
    setEventTitle(ev.title);
    setEventDesc(ev.description || '');
    setEventCategory(ev.category || 'Festival');
    setEventStartDate(ev.start_date?.split('T')[0] || '');
    setEventEndDate(ev.end_date?.split('T')[0] || '');
    setEventVenue(ev.venue || '');
  };

  const handleInquiryReply = async (id) => {
    if (!inqReply) return;
    try {
      const r = await fetch(`/api/inquiries/reply/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ replyMessage: inqReply, status: 'RESPONDED' }),
      });
      if (r.ok) { setSelectedInquiry(null); setInqReply(''); await fetchDotInquiries(); }
    } catch (err) { console.error(err); }
  };

  const exportCSV = () => {
    if (!analytics?.monthlyBookings) return;
    const rows = [['Month', 'Total', 'Confirmed'], ...analytics.monthlyBookings.map(r => [r.month, r.total, r.confirmed])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'municipal_analytics.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleAttractionImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttractionImageFile(file);
      setAttractionImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDetectAttractionCoords = () => {
    if (!navigator.geolocation) {
      showAlert('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setDetectingCoords(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAttractionLat(pos.coords.latitude.toFixed(6));
        setAttractionLng(pos.coords.longitude.toFixed(6));
        setDetectingCoords(false);
        showAlert('GPS coordinates detected successfully!', 'success');
      },
      (err) => {
        setDetectingCoords(false);
        showAlert('Failed to acquire GPS location. Please check device permissions or type coordinates manually.', 'error');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleStartAttractionEdit = (att) => {
    setEditingAttractionId(att.id);
    setAttractionName(att.name);
    setAttractionDesc(att.description || '');
    setAttractionCategory(att.category || 'Nature');
    setAttractionLoc(att.location_details || '');
    setAttractionLat(att.latitude !== null && att.latitude !== undefined ? att.latitude : '');
    setAttractionLng(att.longitude !== null && att.longitude !== undefined ? att.longitude : '');
    setAttractionVideoUrl(att.video_url || '');
    setAttractionVideoFile(null);
    setAttractionVideoInputMode(att.video_url && (att.video_url.startsWith('http') || att.video_url.includes('youtube')) ? 'url' : 'file');
    setAttractionImageFile(null);
    setAttractionImagePreview(att.image_url || '');
    
    // Smooth scroll to form panel
    const formEl = document.getElementById('attraction-form-panel');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelAttractionEdit = () => {
    setEditingAttractionId(null);
    setAttractionName('');
    setAttractionDesc('');
    setAttractionCategory('Nature');
    setAttractionLoc('');
    setAttractionLat('');
    setAttractionLng('');
    setAttractionVideoUrl('');
    setAttractionVideoFile(null);
    setAttractionImageFile(null);
    setAttractionImagePreview('');
    const fileInput = document.getElementById('attraction-file-input');
    if (fileInput) fileInput.value = '';
    const videoInput = document.getElementById('attraction-video-file-input');
    if (videoInput) videoInput.value = '';
  };

  const handleAttractionSubmit = async (e) => {
    e.preventDefault();
    if (!attractionName || !attractionDesc) return;
    setAttractionSaving(true);

    const formData = new FormData();
    formData.append('name', attractionName);
    formData.append('description', attractionDesc);
    formData.append('category', attractionCategory);
    formData.append('locationDetails', attractionLoc);
    if (attractionLat) formData.append('latitude', attractionLat);
    if (attractionLng) formData.append('longitude', attractionLng);

    if (attractionImageFile) {
      formData.append('image', attractionImageFile);
    } else if (attractionImagePreview) {
      formData.append('imageUrl', attractionImagePreview);
    }

    if (attractionVideoFile) {
      formData.append('video', attractionVideoFile);
    } else if (attractionVideoUrl) {
      formData.append('videoUrl', attractionVideoUrl);
    }

    try {
      let response;
      if (editingAttractionId) {
        response = await fetch(`/api/municipalities/attractions/${editingAttractionId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
      } else {
        response = await fetch('/api/municipalities/attractions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
      }

      const resData = await response.json();
      if (response.ok) {
        showAlert(editingAttractionId ? 'Attraction updated successfully!' : 'Attraction added successfully!', 'success');
        handleCancelAttractionEdit();
        await fetchMunicipalityData();
      } else {
        showAlert(resData.message || 'Failed to save attraction.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Server error saving attraction.', 'error');
    } finally {
      setAttractionSaving(false);
    }
  };

  const handleDeleteAttraction = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this tourist attraction?',
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
    try {
      const response = await fetch(`/api/municipalities/attractions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        showAlert('Attraction deleted successfully.', 'success');
        await fetchMunicipalityData();
      } else {
        const resData = await response.json();
        showAlert(resData.message || 'Failed to delete attraction.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Server error deleting attraction.', 'error');
    }
  };

  const handleAddRequirement = async (e) => {
    e.preventDefault();
    if (!reqName.trim()) return;
    setReqSaving(true);

    try {
      const url = editingReqId ? `/api/requirements/${editingReqId}` : '/api/requirements';
      const method = editingReqId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requirementName: reqName.trim(),
          description: reqDesc.trim(),
          targetType: reqTarget,
          isRequired: reqRequired
        })
      });

      if (response.ok) {
        setReqName('');
        setReqDesc('');
        setEditingReqId(null);
        setReqTarget('HOMESTAY');
        setReqRequired(true);
        showAlert(editingReqId ? 'Accreditation requirement updated successfully.' : 'Accreditation requirement configured successfully.', 'success');
        await fetchData();
      } else {
        const errData = await response.json();
        showAlert(errData.message || 'Failed to save requirement.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Server error while saving requirement.', 'error');
    } finally {
      setReqSaving(false);
    }
  };

  const handleEditRequirement = (r) => {
    setEditingReqId(r.id);
    setReqName(r.requirement_name || '');
    setReqDesc(r.description || '');
    setReqTarget(r.target_type || 'HOMESTAY');
    setReqRequired(r.is_required !== false);
    const formPanel = document.getElementById('requirement-form-panel');
    if (formPanel) {
      formPanel.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEditRequirement = () => {
    setEditingReqId(null);
    setReqName('');
    setReqDesc('');
    setReqTarget('HOMESTAY');
    setReqRequired(true);
  };

  const handleDeleteRequirement = async (reqId) => {
    const result = await Swal.fire({
      title: 'Delete Requirement?',
      text: 'Are you sure you want to remove this accreditation requirement? Stakeholders will no longer be asked for it, and existing submissions will be affected.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#153325',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete requirement',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'rounded-3xl',
      }
    });
    if (!result.isConfirmed) return;
    try {
      const response = await fetch(`/api/requirements/${reqId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        showAlert('Accreditation requirement removed.', 'info');
        if (editingReqId === reqId) {
          handleCancelEditRequirement();
        }
        await fetchData();
      } else {
        const errData = await response.json();
        showAlert(errData.message || 'Failed to delete requirement.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Server error deleting requirement.', 'error');
    }
  };

  const handleReviewDocument = async (subId, status, remarks) => {
    try {
      const response = await fetch(`/api/documents/review/${subId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, reviewComments: remarks || reviewRemarks || 'Processed' })
      });

      if (response.ok) {
        setReviewRemarks('');
        showAlert(`Document marked as ${status.toLowerCase()}.`, 'success');
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndorseStakeholder = async (id, type) => {
    try {
      const response = await fetch(`/api/listings/endorse/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, remarks: 'Endorsed for Provincial DOT approval after Municipal validation.' })
      });

      if (response.ok) {
        showAlert('Stakeholder endorsed successfully.', 'success');
        await fetchData();
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

  const municipalTabs = [
    { id: 'attractions', label: 'Local Attractions', icon: Compass },
    { id: 'packages', label: 'Tour Packages', icon: Package },
    { id: 'videoAds', label: 'Video Advertisements', icon: Film },
    { id: 'requirements', label: 'Accreditation Checklist', icon: FolderClosed },
    { id: 'review', label: 'Review Submissions', icon: CheckSquare },
    { id: 'stakeholders', label: 'Endorse Operators', icon: FileCheck },
    { id: 'events', label: 'Festivals & Events', icon: Calendar },
    { id: 'inquiries', label: 'Tourist Inquiries', icon: MessageSquare },
    { id: 'complaints', label: 'Grievance Desk', icon: AlertCircle },
    { id: 'reports', label: 'Official Reports', icon: BarChart3 },
    { id: 'municipality', label: 'Municipal Guidebook', icon: Landmark },
    { id: 'profile', label: 'Officer Profile', icon: User },
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
                  {user?.municipalityName || 'Municipal'} DOT
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
              {user?.municipalityName || 'LGU'} Tourism Desk
            </span>
            <Link to="/" className="text-[#B88B2A] hover:underline flex items-center gap-1 font-semibold flex-shrink-0">
              Live Site <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Main Navigation Features */}
          <div className="p-3 space-y-1 flex-1">
            <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B88B2A]">
              Municipal Features
            </div>
            {municipalTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchParams({ tab: tab.id });
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
                  {tab.id === 'videoAds' && videoAds.length > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-[#153325] text-[#FAF7F2]' : 'bg-[#B88B2A] text-[#153325]'
                    }`}>
                      {videoAds.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Sidebar: Officer Profile Card */}
          <div className="p-4 border-t border-white/10 space-y-2 bg-[#0F261C]">
            <div className="bg-black/30 rounded-xl p-3 flex items-center justify-between border border-white/5">
              <div 
                onClick={() => { setActiveTab('profile'); setMobileSidebarOpen(false); }}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
                title="View & Edit Officer Profile Dossier"
              >
                <div className="w-8 h-8 rounded-lg bg-[#B88B2A]/20 border border-[#B88B2A]/40 flex items-center justify-center font-bold font-serif text-[#B88B2A] text-xs flex-shrink-0 overflow-hidden group-hover:border-[#B88B2A] transition-colors">
                  {user?.profile?.profile_picture_url || profilePicPreview ? (
                    <img
                      src={profilePicPreview || user?.profile?.profile_picture_url}
                      alt="Officer Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <span>{user?.fullName?.charAt(0) || 'M'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-[#B88B2A] transition-colors">{user?.fullName || 'Municipal Officer'}</p>
                  <p className="text-[10px] text-white/50 truncate font-mono">{user?.profile?.designation || 'Tourism Officer'}</p>
                </div>
              </div>
              {logout && (
                <button
                  onClick={logout}
                  title="Sign out of portal"
                  className="text-white/50 hover:text-rose-300 p-1.5 rounded-md hover:bg-white/5 transition-colors cursor-pointer text-[11px] font-semibold flex-shrink-0 ml-1"
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
                  Municipality of {user?.municipalityName || 'Abra'} · Official Desk
                </span>
              </div>
              <h1 className="font-serif text-lg sm:text-2xl font-bold text-[#153325]">
                {municipalTabs.find(t => t.id === activeTab)?.label || 'Overview'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Eye Comfort Background Theme Selector */}
            <EyeComfortToggle />

            {activeTab === 'reports' && (
              <>
                <button
                  onClick={exportCSV}
                  className="btn-editorial-outline px-3 py-1.5 text-xs text-[#153325] border-[var(--border-app,#C7D7C9)] hover:bg-white/50 hidden sm:flex items-center gap-1.5 cursor-pointer rounded-lg"
                >
                  <Download className="w-3.5 h-3.5 text-[#B88B2A]" /> CSV
                </button>
                <button
                  onClick={exportExcel}
                  className="btn-editorial-outline px-3 py-1.5 text-xs text-[#153325] border-[var(--border-app,#C7D7C9)] hover:bg-white/50 hidden sm:flex items-center gap-1.5 cursor-pointer rounded-lg"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-700" /> Excel
                </button>
                <button
                  onClick={exportPDF}
                  className="btn-editorial-gold px-3.5 py-1.5 text-xs tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs rounded-lg"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
              </>
            )}
            <div className="px-3 py-1 bg-black/5 border border-[var(--border-app,#C7D7C9)] rounded-lg text-[11px] font-semibold text-[#153325] hidden md:block">
              {user?.municipalityName} LGU
            </div>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <div className="p-4 sm:p-8 space-y-6 max-w-7xl w-full">
          {/* Tab Content Container */}
          <div className="bg-[var(--bg-card,#F3F8F4)] border border-[var(--border-app,#C7D7C9)] rounded-2xl shadow-sm p-4 sm:p-6 transition-colors">

        {/* Tour Packages Tab */}
        {activeTab === 'packages' && (() => {
          const totalPackages = packagesList.length;
          const avgDuration = totalPackages > 0
            ? (packagesList.reduce((sum, p) => sum + (parseInt(p.duration_days) || 1), 0) / totalPackages).toFixed(1)
            : '0';
          const totalStops = packagesList.reduce((sum, p) => sum + (parseInt(p.item_count) || 0), 0);

          const durationFilters = [
            { id: 'ALL', label: 'All Packages', icon: '📦' },
            { id: '1', label: '1 Day (Day Trips)', icon: '☀️' },
            { id: '2', label: '2 Days (Weekend)', icon: '🏕️' },
            { id: '3+', label: '3+ Days (Expedition)', icon: '⛰️' }
          ];

          const filteredPackages = packagesList.filter(pkg => {
            const matchesSearch = !dashPkgSearch ||
              pkg.title?.toLowerCase().includes(dashPkgSearch.toLowerCase()) ||
              pkg.description?.toLowerCase().includes(dashPkgSearch.toLowerCase()) ||
              pkg.inclusions?.toLowerCase().includes(dashPkgSearch.toLowerCase());

            if (!matchesSearch) return false;

            const days = parseInt(pkg.duration_days) || 1;
            if (dashPkgDurationFilter === '1') return days === 1;
            if (dashPkgDurationFilter === '2') return days === 2;
            if (dashPkgDurationFilter === '3+') return days >= 3;
            return true;
          });

          return (
            <div className="space-y-6">
              {/* Top KPI Metrics Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5A534E] uppercase tracking-wider">Published Packages</span>
                    <Package className="w-4 h-4 text-[#153325]" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-[#153325] mt-2">{totalPackages}</p>
                  <p className="text-[11px] text-[#5A534E] mt-0.5">Municipal travel packages</p>
                </div>

                <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5A534E] uppercase tracking-wider">Average Duration</span>
                    <Calendar className="w-4 h-4 text-[#B88B2A]" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-[#B88B2A] mt-2">{avgDuration} Days</p>
                  <p className="text-[11px] text-[#5A534E] mt-0.5">Trip length across packages</p>
                </div>

                <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5A534E] uppercase tracking-wider">Scheduled Stops</span>
                    <MapPin className="w-4 h-4 text-[#355C6D]" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-[#355C6D] mt-2">{totalStops}</p>
                  <p className="text-[11px] text-[#5A534E] mt-0.5">Coordinated sight activities</p>
                </div>

                <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#5A534E] uppercase tracking-wider">Tourist Portal</span>
                      <Globe className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xs font-semibold text-[#153325] mt-1.5">Live Packages Showcase</p>
                  </div>
                  <Link
                    to={`/municipalities/${user?.municipalityId || 1}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#153325] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#1D4433] transition-all cursor-pointer"
                  >
                    <span>View Public Page</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#B88B2A]" />
                  </Link>
                </div>
              </div>

              {/* Main Tour Packages Workspace: Form (Col-5) & Directory (Col-7) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Column */}
                <div
                  id="package-form-panel"
                  className="lg:col-span-5 bg-white border border-[var(--border-app,#C7D7C9)] p-6 rounded-2xl shadow-xs h-fit space-y-4 text-left"
                >
                  <div className="flex justify-between items-center border-b border-[var(--border-app,#C7D7C9)] pb-3">
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#153325] flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-[#B88B2A]" />
                        <span>{editingPkgId ? 'Edit Tour Package' : 'Create Municipal Package'}</span>
                      </h3>
                      <p className="text-xs text-[#5A534E] mt-0.5">
                        {editingPkgId ? `Updating "${pkgTitle}"` : 'Bundle local sights, homestays, and tour guides into curated itineraries.'}
                      </p>
                    </div>
                    {editingPkgId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPkgId(null);
                          setPkgTitle('');
                          setPkgDesc('');
                          setPkgPrice('');
                          setPkgDuration('2');
                          setPkgInclusions('');
                          setPkgImageUrl('');
                          setPkgImageFile(null);
                          setPkgImagePreview('');
                          setPkgItems([]);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  {pkgMsg.text && (
                    <div className={`p-3 rounded-xl text-xs font-semibold ${pkgMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {pkgMsg.text}
                    </div>
                  )}

                  <form onSubmit={handlePackageSubmit} className="space-y-4">
                    {/* Package Title */}
                    <div>
                      <label className="block text-xs font-bold text-[#153325] mb-1">
                        Package Title <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. 3D2N Tineg Eco-Adventure & Kaparkan Falls"
                          value={pkgTitle}
                          onChange={(e) => setPkgTitle(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                        />
                        <Package className="w-4 h-4 text-[#5A534E]/60 absolute left-3 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    {/* Price & Duration */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#153325] mb-1">
                          Price per Person (₱)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 3500"
                          value={pkgPrice}
                          onChange={(e) => setPkgPrice(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#153325] mb-1">
                          Duration (Days) <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={pkgDuration}
                          onChange={(e) => setPkgDuration(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 10, 14].map(d => (
                            <option key={d} value={d}>
                              {d} Day{d > 1 ? 's' : ''} {d === 1 ? '(Day Tour)' : d === 2 ? '(Weekend)' : '(Expedition)'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Cover Image Upload Dropzone */}
                    <div>
                      <label className="block text-xs font-bold text-[#153325] mb-1">
                        Package Cover Photo
                      </label>
                      {pkgImagePreview ? (
                        <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-[var(--border-app,#C7D7C9)] group bg-[#153325]">
                          <img
                            src={pkgImagePreview}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow">
                              Change Photo
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/avif"
                                onChange={handlePkgImageChange}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setPkgImageFile(null);
                                setPkgImagePreview('');
                                setPkgImageUrl('');
                              }}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[var(--border-app,#C7D7C9)] hover:border-[#153325] rounded-xl bg-slate-50 hover:bg-[#FAF7F2] cursor-pointer transition-all">
                          <div className="flex flex-col items-center gap-1 text-center px-4">
                            <Upload className="w-6 h-6 text-[#5A534E]/70" />
                            <span className="text-xs font-semibold text-[#153325]">
                              Click to select package cover photo
                            </span>
                            <span className="text-[10px] text-[#5A534E]">
                              JPG, PNG, WEBP — Recommended 16:9 landscape
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            onChange={handlePkgImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Inclusions Summary */}
                    <div>
                      <label className="block text-xs font-bold text-[#153325] mb-1">
                        Inclusions Summary
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2 Nights Homestay, Accredited Guide, Environmental Fees, Transfers"
                        value={pkgInclusions}
                        onChange={(e) => setPkgInclusions(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold text-[#153325] mb-1">
                        Package Overview
                      </label>
                      <textarea
                        rows="3"
                        placeholder="Highlight what travelers will experience on this curated expedition..."
                        value={pkgDesc}
                        onChange={(e) => setPkgDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325] resize-none"
                      />
                    </div>

                    {/* Day-by-Day Package Item Builder */}
                    <div className="border-t border-[var(--border-app,#C7D7C9)] pt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-[#153325] text-xs flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#B88B2A]" />
                            <span>Day Schedule & Stops ({pkgItems.length})</span>
                          </h4>
                          <p className="text-[11px] text-[#5A534E]">
                            Coordinate attractions, homestays, and tour guides.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddPkgItem}
                          className="px-3 py-1.5 bg-[#153325] text-white rounded-xl text-xs font-bold hover:bg-[#1D4433] flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                        >
                          <Plus className="w-3 h-3 text-[#B88B2A]" /> Add Stop
                        </button>
                      </div>

                      {pkgItems.length === 0 ? (
                        <div className="p-4 bg-[#FAF7F2] rounded-xl border border-dashed border-[var(--border-app,#C7D7C9)] text-center space-y-1">
                          <p className="text-xs font-bold text-[#153325]">No stops scheduled yet</p>
                          <p className="text-[11px] text-[#5A534E]">
                            Click "Add Stop" above to include local waterfalls, accredited homestays, or tour guides in this package.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                          {pkgItems.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 bg-[#FAF7F2]/80 border border-[var(--border-app,#C7D7C9)] rounded-xl space-y-2 relative shadow-xs"
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-white bg-[#153325] px-2 py-0.5 rounded-md">
                                    Stop #{idx + 1}
                                  </span>
                                  <span className="text-[10px] font-bold text-[#B88B2A]">
                                    Day {item.dayNumber || 1}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePkgItem(idx)}
                                  className="text-slate-400 hover:text-red-600 p-1 cursor-pointer transition-colors"
                                  title="Remove stop"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-[#153325] mb-0.5">Day Assignment</label>
                                  <select
                                    value={item.dayNumber}
                                    onChange={(e) => handlePkgItemChange(idx, 'dayNumber', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white border border-[var(--border-app,#C7D7C9)] rounded-lg text-xs text-[#232120]"
                                  >
                                    {[...Array(parseInt(pkgDuration || 1)).keys()].map(d => (
                                      <option key={d + 1} value={d + 1}>Day {d + 1}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-[#153325] mb-0.5">Activity Type</label>
                                  <select
                                    value={item.activityType}
                                    onChange={(e) => handlePkgItemChange(idx, 'activityType', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white border border-[var(--border-app,#C7D7C9)] rounded-lg text-xs text-[#232120]"
                                  >
                                    <option value="ATTRACTION">📍 Local Attraction</option>
                                    <option value="HOMESTAY">🏡 Accredited Homestay</option>
                                    <option value="GUIDE">🧭 Licensed Tour Guide</option>
                                    <option value="CUSTOM">✨ Custom Activity</option>
                                  </select>
                                </div>
                              </div>

                              {item.activityType === 'ATTRACTION' && (
                                <div>
                                  <label className="block text-[10px] font-bold text-[#153325] mb-0.5">Select Attraction</label>
                                  <select
                                    value={item.targetId}
                                    onChange={(e) => handlePkgItemChange(idx, 'targetId', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white border border-[var(--border-app,#C7D7C9)] rounded-lg text-xs text-[#232120]"
                                  >
                                    <option value="">-- Choose Attraction --</option>
                                    {attractions.map(a => (
                                      <option key={a.id} value={a.id}>{a.name} ({a.category})</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {item.activityType === 'HOMESTAY' && (
                                <div>
                                  <label className="block text-[10px] font-bold text-[#153325] mb-0.5">Select Homestay</label>
                                  <select
                                    value={item.targetId}
                                    onChange={(e) => handlePkgItemChange(idx, 'targetId', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white border border-[var(--border-app,#C7D7C9)] rounded-lg text-xs text-[#232120]"
                                  >
                                    <option value="">-- Choose Homestay --</option>
                                    {data.homestays.map(h => (
                                      <option key={h.id} value={h.id}>{h.name}</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {item.activityType === 'GUIDE' && (
                                <div>
                                  <label className="block text-[10px] font-bold text-[#153325] mb-0.5">Select Tour Guide</label>
                                  <select
                                    value={item.targetId}
                                    onChange={(e) => handlePkgItemChange(idx, 'targetId', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white border border-[var(--border-app,#C7D7C9)] rounded-lg text-xs text-[#232120]"
                                  >
                                    <option value="">-- Choose Tour Guide --</option>
                                    {data.guides.map(g => (
                                      <option key={g.id} value={g.id}>{g.full_name} ({g.languages_spoken || 'Guide'})</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {item.activityType === 'CUSTOM' && (
                                <div>
                                  <label className="block text-[10px] font-bold text-[#153325] mb-0.5">Custom Stop Name</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Traditional Abra Basi Wine Tasting"
                                    value={item.customActivityName}
                                    onChange={(e) => handlePkgItemChange(idx, 'customActivityName', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white border border-[var(--border-app,#C7D7C9)] rounded-lg text-xs text-[#232120]"
                                  />
                                </div>
                              )}

                              <div>
                                <label className="block text-[10px] font-semibold text-[#5A534E] mb-0.5">Activity Notes</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Morning photo walk, bring water shoes"
                                  value={item.notes}
                                  onChange={(e) => handlePkgItemChange(idx, 'notes', e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-[var(--border-app,#C7D7C9)] rounded-lg text-xs text-[#232120]"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={pkgSubmitting}
                      className="w-full py-3 bg-[#153325] hover:bg-[#1D4433] text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {pkgSubmitting ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-[#B88B2A]" />
                          <span>{editingPkgId ? 'Update Tour Package' : 'Publish Tour Package'}</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Directory Column */}
                <div className="lg:col-span-7 space-y-4 text-left">
                  {/* Directory Header with Live Search & Duration Chips */}
                  <div className="bg-white border border-[var(--border-app,#C7D7C9)] p-4 sm:p-5 rounded-2xl shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-serif font-bold text-base text-[#153325] flex items-center gap-2">
                          <span>Published Packages</span>
                          <span className="text-xs bg-[#FAF7F2] text-[#153325] px-2 py-0.5 rounded-full font-sans font-bold border border-[#E8DFC8]">
                            {packagesList.length}
                          </span>
                        </h3>
                        <p className="text-xs text-[#5A534E]">
                          Tourists can book these packages as-is or import them directly into their travel itinerary planner.
                        </p>
                      </div>

                      {/* Search Input */}
                      <div className="relative w-full sm:w-60">
                        <input
                          type="text"
                          value={dashPkgSearch}
                          onChange={(e) => setDashPkgSearch(e.target.value)}
                          placeholder="Search packages..."
                          className="w-full pl-8 pr-7 py-1.5 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs text-[#232120] placeholder:text-[#5A534E]/60 focus:outline-none focus:border-[#153325]"
                        />
                        <Search className="w-3.5 h-3.5 text-[#5A534E]/60 absolute left-2.5 top-2 pointer-events-none" />
                        {dashPkgSearch && (
                          <button
                            type="button"
                            onClick={() => setDashPkgSearch('')}
                            className="absolute right-2 top-2 text-[#5A534E] hover:text-[#153325] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Duration Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                      {durationFilters.map(df => {
                        const count = df.id === 'ALL'
                          ? packagesList.length
                          : packagesList.filter(p => {
                              const d = parseInt(p.duration_days) || 1;
                              if (df.id === '1') return d === 1;
                              if (df.id === '2') return d === 2;
                              if (df.id === '3+') return d >= 3;
                              return true;
                            }).length;

                        if (df.id !== 'ALL' && count === 0) return null;

                        const isActive = dashPkgDurationFilter === df.id;
                        return (
                          <button
                            key={df.id}
                            type="button"
                            onClick={() => setDashPkgDurationFilter(df.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                              isActive
                                ? 'bg-[#153325] text-white font-bold shadow-xs'
                                : 'bg-[#FAF7F2] text-[#5A534E] hover:text-[#153325] hover:bg-[#F3ECE0] border border-[#E8DFC8]'
                            }`}
                          >
                            <span>{df.icon}</span>
                            <span>{df.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-[#5A534E]'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Packages Grid / Empty State */}
                  {packagesList.length === 0 ? (
                    <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-10 text-center shadow-xs">
                      <div className="w-14 h-14 bg-[#153325]/10 text-[#153325] rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Package className="w-7 h-7 text-[#B88B2A]" />
                      </div>
                      <h4 className="font-serif text-lg font-bold text-[#153325]">
                        No Municipal Packages Created Yet
                      </h4>
                      <p className="text-xs text-[#5A534E] max-w-md mx-auto mt-2 leading-relaxed">
                        Create curated municipal tour packages on the left form by combining local waterfalls, accredited homestays, and tour guides. Packages help tourists plan multi-day adventures in {user?.municipalityName || 'your municipality'}!
                      </p>
                    </div>
                  ) : filteredPackages.length === 0 ? (
                    <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-8 text-center shadow-xs">
                      <Package className="w-8 h-8 text-[#B88B2A] mx-auto mb-2 opacity-60" />
                      <p className="font-serif text-base font-bold text-[#153325]">No packages match your search</p>
                      <p className="text-xs text-[#5A534E] mt-1">Try clearing your search term or switching duration filters.</p>
                      <button
                        type="button"
                        onClick={() => { setDashPkgSearch(''); setDashPkgDurationFilter('ALL'); }}
                        className="mt-3 px-3.5 py-1.5 bg-[#153325] text-white text-xs font-bold rounded-xl hover:bg-[#1D4433] transition-colors cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredPackages.map(pkg => (
                        <div
                          key={pkg.id}
                          className={`bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                            editingPkgId === pkg.id
                              ? 'border-[#B88B2A] ring-2 ring-[#B88B2A]/30'
                              : 'border-[var(--border-app,#C7D7C9)]'
                          }`}
                        >
                          <div>
                            {/* Card Hero Photo with Price & Duration Pills */}
                            <div className="relative aspect-[16/10] bg-[#153325] overflow-hidden">
                              <SafeImage
                                src={pkg.image_url}
                                alt={pkg.title}
                                className="w-full h-full object-cover"
                                fallback="landscape"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                <span className="bg-[#153325]/90 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-lg backdrop-blur-md shadow-xs border border-white/10">
                                  {pkg.duration_days} Day{pkg.duration_days > 1 ? 's' : ''}
                                </span>
                              </div>

                              <span className="absolute top-2.5 right-2.5 bg-[#B88B2A] text-white font-extrabold text-xs px-2.5 py-0.5 rounded-lg shadow-sm">
                                ₱{parseFloat(pkg.price).toLocaleString()}
                              </span>

                              <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white/90 text-[10px] px-2 py-0.5 rounded-md border border-white/15 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-[#B88B2A]" />
                                <span>{pkg.item_count || 0} coordinated stop{pkg.item_count !== 1 ? 's' : ''}</span>
                              </div>
                            </div>

                            {/* Card Details */}
                            <div className="p-4 space-y-2">
                              <h4 className="font-serif text-base font-bold text-[#153325] leading-snug line-clamp-1">
                                {pkg.title}
                              </h4>
                              {pkg.description && (
                                <p className="text-xs text-[#5A534E] line-clamp-2 leading-relaxed">
                                  {pkg.description}
                                </p>
                              )}
                              {pkg.inclusions && (
                                <div className="bg-[#FAF7F2] p-2 rounded-lg border border-[var(--border-app,#C7D7C9)] text-[11px] text-[#153325] flex items-start gap-1.5">
                                  <span className="font-bold text-[#B88B2A] flex-shrink-0">Includes:</span>
                                  <span className="line-clamp-1 text-[#5A534E]">{pkg.inclusions}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Toolbar Footer */}
                          <div className="p-3 border-t border-[var(--border-app,#C7D7C9)] bg-[#FAF7F2]/50 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenPackagePreview(pkg)}
                              className="px-2.5 py-1.5 text-xs font-bold text-[#153325] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-[#E8DFC8] flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Schedule</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditPackage(pkg)}
                                className="px-3 py-1.5 bg-[#153325] hover:bg-[#1D4433] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <Edit className="w-3 h-3 text-[#B88B2A]" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePackage(pkg.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Package"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Package Preview Modal */}
              {previewPackage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-[#E8DFC8] my-auto text-left">
                    <div className="relative aspect-video bg-[#153325] overflow-hidden rounded-t-2xl">
                      <SafeImage
                        src={previewPackage.image_url}
                        alt={previewPackage.title}
                        className="w-full h-full object-cover"
                        fallback="landscape"
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewPackage(null)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md cursor-pointer transition-colors shadow"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="bg-[#153325]/90 text-white font-bold text-xs px-2.5 py-1 rounded-lg backdrop-blur-md">
                          ₱{parseFloat(previewPackage.price).toLocaleString()} / person
                        </span>
                        <span className="bg-[#B88B2A] text-white font-bold text-xs px-2 py-1 rounded-lg shadow-sm">
                          {previewPackage.duration_days} Day{previewPackage.duration_days > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="font-serif text-2xl font-bold text-[#153325]">
                          {previewPackage.title}
                        </h3>
                        {previewPackage.inclusions && (
                          <p className="text-xs text-[#5A534E] mt-1 bg-[#FAF7F2] p-2.5 rounded-lg border border-[#E8DFC8]">
                            <strong className="text-[#153325]">Inclusions:</strong> {previewPackage.inclusions}
                          </p>
                        )}
                      </div>

                      {previewPackage.description && (
                        <p className="text-xs text-[#5A534E] leading-relaxed">
                          {previewPackage.description}
                        </p>
                      )}

                      {/* Daily Stops Timeline */}
                      <div className="border-t border-[#E8DFC8] pt-4 space-y-3">
                        <h4 className="font-serif font-bold text-sm text-[#153325] flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-[#B88B2A]" />
                          <span>Daily Schedule Timeline ({previewPackageItems.length} stops)</span>
                        </h4>

                        {previewPkgLoading ? (
                          <div className="text-center py-6">
                            <span className="w-6 h-6 border-2 border-[#153325] border-t-transparent rounded-full animate-spin inline-block" />
                          </div>
                        ) : previewPackageItems.length === 0 ? (
                          <p className="text-xs text-[#5A534E] italic bg-[#FAF7F2] p-3 rounded-lg border border-[#E8DFC8] text-center">
                            No day schedule items added to this package yet.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {previewPackageItems.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFC8] flex items-start gap-3"
                              >
                                <span className="bg-[#153325] text-white font-bold text-[10px] px-2 py-1 rounded-md flex-shrink-0">
                                  Day {item.day_number}
                                </span>
                                <div className="text-xs text-left">
                                  <p className="font-bold text-[#153325]">
                                    {item.activity_type === 'ATTRACTION' && (item.attraction_name || 'Attraction Visit')}
                                    {item.activity_type === 'HOMESTAY' && (item.homestay_name || 'Homestay Overnight')}
                                    {item.activity_type === 'GUIDE' && `Guided by: ${item.guide_name || 'Accredited Guide'}`}
                                    {item.activity_type === 'CUSTOM' && (item.custom_activity_name || 'Activity')}
                                  </p>
                                  {item.notes && (
                                    <p className="text-[#5A534E] text-[11px] mt-0.5 italic">{item.notes}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[var(--border-app,#C7D7C9)] flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewPackage(null)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Close Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const p = previewPackage;
                            setPreviewPackage(null);
                            handleEditPackage(p);
                          }}
                          className="px-4 py-2 bg-[#153325] hover:bg-[#1D4433] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5 text-[#B88B2A]" />
                          <span>Edit Package</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Municipal Video Advertisements Tab */}
        {activeTab === 'videoAds' && (
          <div className="space-y-6">
            {/* Header & KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#5A534E] uppercase tracking-wider">Town Video Campaigns</span>
                  <Video className="w-4 h-4 text-[#B88B2A]" />
                </div>
                <p className="text-2xl font-serif font-bold text-[#153325] mt-2">{videoAds.length}</p>
                <p className="text-[11px] text-[#5A534E] mt-0.5">{user?.municipalityName || 'Municipal'} video ads</p>
              </div>

              <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#5A534E] uppercase tracking-wider">Live &amp; Active</span>
                  <Eye className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-serif font-bold text-emerald-800 mt-2">
                  {videoAds.filter(a => a.is_active).length}
                </p>
                <p className="text-[11px] text-[#5A534E] mt-0.5">Visible on Landing Page &amp; Town page</p>
              </div>

              <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5A534E] uppercase tracking-wider">Action</span>
                    <Film className="w-4 h-4 text-[#355C6D]" />
                  </div>
                  <p className="text-xs font-semibold text-[#153325] mt-2">Promote Local Wonders</p>
                </div>
                <button
                  type="button"
                  onClick={openCreateAdModal}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#153325] text-white font-bold text-xs rounded-xl shadow hover:bg-[#1D4433] transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#B88B2A]" />
                  <span>Post Video Ad</span>
                </button>
              </div>
            </div>

            {/* Content List / Grid */}
            {videoAdsLoading ? (
              <div className="flex justify-center items-center py-20 bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl">
                <div className="w-10 h-10 border-4 border-[#153325] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : videoAds.length === 0 ? (
              <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-3xl p-12 text-center shadow-xs">
                <div className="w-16 h-16 bg-[#B88B2A]/15 text-[#B88B2A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Film className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#153325]">
                  No Video Advertisements Posted for {user?.municipalityName || 'this Municipality'}
                </h3>
                <p className="text-xs text-[#5A534E] max-w-md mx-auto mt-2 leading-relaxed">
                  Post high-definition video advertisements highlighting {user?.municipalityName || 'your town'}'s scenic waterfalls, cultural heritage, trekking trails, and local festivals. Videos are broadcast both on the province-wide Landing Page video showcase and on your official town details page!
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
                          title={ad.is_active ? 'Click to Hide from Portals' : 'Click to Make Live'}
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
                          <span className="font-semibold text-[#B88B2A]">
                            📍 {user?.municipalityName || ad.municipality_name || 'Municipality'}, Abra
                          </span>
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
                          {ad.description || 'Promotional video advertisement showcasing municipal tourism.'}
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

        {/* Attractions Tab */}
        {activeTab === 'attractions' && (() => {
          const geoTaggedCount = attractions.filter(a => a.latitude && a.longitude).length;
          const videoShowcaseCount = attractions.filter(a => a.video_url).length;

          const allCats = [
            { id: 'ALL', label: 'All Sights', icon: '📍' },
            { id: 'Waterfall', label: 'Waterfalls & Springs', icon: '🌊' },
            { id: 'Cave', label: 'Caves & Gorges', icon: '🪨' },
            { id: 'Mountain', label: 'Peaks & Valleys', icon: '⛰️' },
            { id: 'Historical', label: 'Historical Landmarks', icon: '🏛️' },
            { id: 'Cultural', label: 'Cultural & Crafts', icon: '🧵' },
            { id: 'Nature', label: 'Eco-Parks & Nature', icon: '🌿' }
          ];

          const filteredAttractions = (attractions || []).filter(a => {
            const matchesSearch = !dashAttractionSearch ||
              a.name?.toLowerCase().includes(dashAttractionSearch.toLowerCase()) ||
              a.description?.toLowerCase().includes(dashAttractionSearch.toLowerCase()) ||
              a.location_details?.toLowerCase().includes(dashAttractionSearch.toLowerCase());
            
            if (!matchesSearch) return false;
            if (dashAttractionCatFilter === 'ALL') return true;
            return (a.category || '').toLowerCase().includes(dashAttractionCatFilter.toLowerCase());
          });

          return (
            <div className="space-y-6">
              {/* Top KPI Metrics Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5A534E] uppercase tracking-wider">Registered Sights</span>
                    <Landmark className="w-4 h-4 text-[#153325]" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-[#153325] mt-2">{attractions.length}</p>
                  <p className="text-[11px] text-[#5A534E] mt-0.5">Municipal attractions in {user?.municipalityName || 'Town'}</p>
                </div>

                <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5A534E] uppercase tracking-wider">GPS Geotagged</span>
                    <MapPin className="w-4 h-4 text-[#B88B2A]" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-[#B88B2A] mt-2">{geoTaggedCount}</p>
                  <p className="text-[11px] text-[#5A534E] mt-0.5">Ready for 3D Map & Navigation</p>
                </div>

                <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5A534E] uppercase tracking-wider">Video Spotlights</span>
                    <Video className="w-4 h-4 text-[#355C6D]" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-[#355C6D] mt-2">{videoShowcaseCount}</p>
                  <p className="text-[11px] text-[#5A534E] mt-0.5">Showcased with video media</p>
                </div>

                <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#5A534E] uppercase tracking-wider">Public Town Portal</span>
                      <Globe className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xs font-semibold text-[#153325] mt-1.5">Live Municipality Showcase</p>
                  </div>
                  <Link
                    to={`/municipalities/${user?.municipalityId || 1}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#153325] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#1D4433] transition-all cursor-pointer"
                  >
                    <span>View Public Page</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#B88B2A]" />
                  </Link>
                </div>
              </div>

              {/* Main Attractions Workspace: Form (Col-5) & Directory (Col-7) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Column */}
                <div
                  id="attraction-form-panel"
                  className="lg:col-span-5 bg-white border border-[var(--border-app,#C7D7C9)] p-6 rounded-2xl shadow-xs h-fit text-left"
                >
                  <div className="flex items-center justify-between mb-4 border-b border-[var(--border-app,#C7D7C9)] pb-3">
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#153325]">
                        {editingAttractionId ? 'Edit Tourist Attraction' : 'Add Tourist Attraction'}
                      </h3>
                      <p className="text-xs text-[#5A534E] mt-0.5">
                        {editingAttractionId ? `Modifying "${attractionName}"` : 'Publish eco-tourism & heritage sites to your town page.'}
                      </p>
                    </div>
                    {editingAttractionId && (
                      <button
                        type="button"
                        onClick={handleCancelAttractionEdit}
                        className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleAttractionSubmit} className="space-y-4">
                    {/* Attraction Name */}
                    <div>
                      <label className="block text-xs font-bold text-[#153325] mb-1">
                        Attraction Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={attractionName}
                          onChange={(e) => setAttractionName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                          placeholder="e.g. Libtec Crystal Cave"
                        />
                        <Landmark className="w-4 h-4 text-[#5A534E]/60 absolute left-3 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    {/* Category & Location Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#153325] mb-1">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={attractionCategory}
                          onChange={(e) => setAttractionCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                        >
                          <option value="Waterfall">🌊 Waterfall / Spring</option>
                          <option value="Cave">🪨 Cave / Rock Formation</option>
                          <option value="Mountain">⛰️ Mountain / Peak</option>
                          <option value="Historical">🏛️ Historical Landmark</option>
                          <option value="Cultural">🧵 Cultural & Heritage</option>
                          <option value="Nature">🌿 Eco-Park & Nature</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#153325] mb-1">
                          Location / Barangay
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={attractionLoc}
                            onChange={(e) => setAttractionLoc(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                            placeholder="e.g. Brgy. Libtec, 15m from town"
                          />
                          <MapPin className="w-4 h-4 text-[#5A534E]/60 absolute left-3 top-2.5 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Cover Photo Upload Dropzone */}
                    <div>
                      <label className="block text-xs font-bold text-[#153325] mb-1">
                        Cover Photo
                      </label>
                      {attractionImagePreview ? (
                        <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-[var(--border-app,#C7D7C9)] group bg-[#153325]">
                          <img
                            src={attractionImagePreview}
                            alt="Cover Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow">
                              Change Photo
                              <input
                                id="attraction-file-input"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/avif"
                                onChange={handleAttractionImageChange}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setAttractionImageFile(null);
                                setAttractionImagePreview('');
                                const fileInput = document.getElementById('attraction-file-input');
                                if (fileInput) fileInput.value = '';
                              }}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[var(--border-app,#C7D7C9)] hover:border-[#153325] rounded-xl bg-slate-50 hover:bg-[#FAF7F2] cursor-pointer transition-all">
                          <div className="flex flex-col items-center gap-1 text-center px-4">
                            <Camera className="w-6 h-6 text-[#5A534E]/70" />
                            <span className="text-xs font-semibold text-[#153325]">
                              Click to select cover photo
                            </span>
                            <span className="text-[10px] text-[#5A534E]">
                              JPG, PNG, WEBP — Recommended 16:9 landscape
                            </span>
                          </div>
                          <input
                            id="attraction-file-input"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            onChange={handleAttractionImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Video Showcase Media */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-[#153325]">
                          Video Clip / Showcase (Optional)
                        </label>
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold">
                          <button
                            type="button"
                            onClick={() => setAttractionVideoInputMode('file')}
                            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                              attractionVideoInputMode === 'file'
                                ? 'bg-white text-[#153325] shadow-xs font-bold'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Upload MP4
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttractionVideoInputMode('url')}
                            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                              attractionVideoInputMode === 'url'
                                ? 'bg-white text-[#153325] shadow-xs font-bold'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Paste Link
                          </button>
                        </div>
                      </div>

                      {attractionVideoInputMode === 'file' ? (
                        <div>
                          <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-[var(--border-app,#C7D7C9)] hover:border-[#153325] rounded-xl bg-slate-50 hover:bg-[#FAF7F2] cursor-pointer transition-all">
                            <div className="flex flex-col items-center gap-0.5 text-center px-4">
                              <Film className="w-5 h-5 text-[#B88B2A]" />
                              <span className="text-[11px] font-semibold text-[#153325]">
                                {attractionVideoFile ? attractionVideoFile.name : 'Upload MP4 or WebM video clip'}
                              </span>
                              <span className="text-[10px] text-[#5A534E]">High-definition 1080p clips up to 50MB</span>
                            </div>
                            <input
                              id="attraction-video-file-input"
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              onChange={(e) => setAttractionVideoFile(e.target.files[0])}
                              className="hidden"
                            />
                          </label>
                          {attractionVideoFile && (
                            <button
                              type="button"
                              onClick={() => {
                                setAttractionVideoFile(null);
                                const vInput = document.getElementById('attraction-video-file-input');
                                if (vInput) vInput.value = '';
                              }}
                              className="mt-1 text-[10px] text-red-600 hover:underline cursor-pointer"
                            >
                              Clear video selection
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            value={attractionVideoUrl}
                            onChange={(e) => setAttractionVideoUrl(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                            placeholder="Direct URL or YouTube video link (e.g. https://...)"
                          />
                          <Play className="w-4 h-4 text-[#5A534E]/60 absolute left-3 top-2.5 pointer-events-none" />
                        </div>
                      )}
                    </div>

                    {/* Exact GPS Coordinates Sub-Card */}
                    <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[var(--border-app,#C7D7C9)] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Navigation className="w-3.5 h-3.5 text-[#B88B2A] fill-current" />
                          <label className="text-xs font-bold text-[#153325]">
                            Exact GPS Coordinates
                          </label>
                        </div>
                        <button
                          type="button"
                          disabled={detectingCoords}
                          onClick={handleDetectAttractionCoords}
                          className="text-[10px] font-bold text-[#153325] bg-[#E8DFC8]/60 hover:bg-[#E8DFC8] px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          {detectingCoords ? (
                            <span className="w-3 h-3 border-2 border-[#153325] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span>📍 Detect Current GPS</span>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-semibold text-[#5A534E] block mb-0.5">Latitude</span>
                          <input
                            type="number"
                            step="any"
                            value={attractionLat}
                            onChange={(e) => setAttractionLat(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-[var(--border-app,#C7D7C9)] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                            placeholder="e.g. 17.652140"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-[#5A534E] block mb-0.5">Longitude</span>
                          <input
                            type="number"
                            step="any"
                            value={attractionLng}
                            onChange={(e) => setAttractionLng(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-[var(--border-app,#C7D7C9)] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                            placeholder="e.g. 120.684120"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-[#5A534E] leading-tight">
                        Enables travelers to navigate directly via Google Maps and pin this sight into their itinerary planner.
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold text-[#153325] mb-1">
                        Attraction Description & Travel Notes <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows="3"
                        value={attractionDesc}
                        onChange={(e) => setAttractionDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325] resize-none"
                        placeholder="Detail the natural features, water depth, trail difficulty, safety reminders, or indigenous folklore..."
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex gap-2">
                      {editingAttractionId && (
                        <button
                          type="button"
                          onClick={handleCancelAttractionEdit}
                          className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#5A534E] hover:text-[#153325] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={attractionSaving}
                        className={`${editingAttractionId ? 'w-2/3' : 'w-full'} py-3 bg-[#153325] hover:bg-[#1D4433] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50`}
                      >
                        {attractionSaving ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-[#B88B2A]" />
                            <span>{editingAttractionId ? 'Update Attraction Details' : 'Publish Tourist Attraction'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Directory Column */}
                <div className="lg:col-span-7 space-y-4 text-left">
                  {/* Directory Header with Live Search & Category Chips */}
                  <div className="bg-white border border-[var(--border-app,#C7D7C9)] p-4 sm:p-5 rounded-2xl shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-serif font-bold text-base text-[#153325] flex items-center gap-2">
                          <span>Active Attractions in {user?.municipalityName || 'Town'}</span>
                          <span className="text-xs bg-[#FAF7F2] text-[#153325] px-2 py-0.5 rounded-full font-sans font-bold border border-[#E8DFC8]">
                            {attractions.length}
                          </span>
                        </h3>
                        <p className="text-xs text-[#5A534E]">
                          Configured sights appear in the municipal travel guide and are discoverable on the interactive map.
                        </p>
                      </div>

                      {/* Search Filter */}
                      <div className="relative w-full sm:w-60">
                        <input
                          type="text"
                          value={dashAttractionSearch}
                          onChange={(e) => setDashAttractionSearch(e.target.value)}
                          placeholder="Search attraction name..."
                          className="w-full pl-8 pr-7 py-1.5 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs text-[#232120] placeholder:text-[#5A534E]/60 focus:outline-none focus:border-[#153325]"
                        />
                        <Search className="w-3.5 h-3.5 text-[#5A534E]/60 absolute left-2.5 top-2 pointer-events-none" />
                        {dashAttractionSearch && (
                          <button
                            type="button"
                            onClick={() => setDashAttractionSearch('')}
                            className="absolute right-2 top-2 text-[#5A534E] hover:text-[#153325] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                      {allCats.map(cat => {
                        const count = cat.id === 'ALL'
                          ? attractions.length
                          : attractions.filter(a => (a.category || '').toLowerCase().includes(cat.id.toLowerCase())).length;

                        if (cat.id !== 'ALL' && count === 0) return null;

                        const isActive = dashAttractionCatFilter === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setDashAttractionCatFilter(cat.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                              isActive
                                ? 'bg-[#153325] text-white font-bold shadow-xs'
                                : 'bg-[#FAF7F2] text-[#5A534E] hover:text-[#153325] hover:bg-[#F3ECE0] border border-[#E8DFC8]'
                            }`}
                          >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-[#5A534E]'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Attractions Grid / Empty State */}
                  {attractions.length === 0 ? (
                    <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-10 text-center shadow-xs">
                      <div className="w-14 h-14 bg-[#153325]/10 text-[#153325] rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Compass className="w-7 h-7 text-[#B88B2A]" />
                      </div>
                      <h4 className="font-serif text-lg font-bold text-[#153325]">
                        No Tourist Attractions Registered for {user?.municipalityName || 'this Municipality'}
                      </h4>
                      <p className="text-xs text-[#5A534E] max-w-md mx-auto mt-2 leading-relaxed">
                        Use the form on the left to add your town's natural wonders (waterfalls, crystal caves, scenic peaks) and cultural landmarks. They will be immediately broadcast on your official town page and discoverable by tourists across the province!
                      </p>
                    </div>
                  ) : filteredAttractions.length === 0 ? (
                    <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-8 text-center shadow-xs">
                      <Compass className="w-8 h-8 text-[#B88B2A] mx-auto mb-2 opacity-60" />
                      <p className="font-serif text-base font-bold text-[#153325]">No attractions match your filter</p>
                      <p className="text-xs text-[#5A534E] mt-1">Try clearing your search keyword or switching categories.</p>
                      <button
                        type="button"
                        onClick={() => { setDashAttractionSearch(''); setDashAttractionCatFilter('ALL'); }}
                        className="mt-3 px-3.5 py-1.5 bg-[#153325] text-white text-xs font-bold rounded-xl hover:bg-[#1D4433] transition-colors cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredAttractions.map(att => {
                        const hasCoords = att.latitude && att.longitude;
                        return (
                          <div
                            key={att.id}
                            className={`bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                              editingAttractionId === att.id
                                ? 'border-[#B88B2A] ring-2 ring-[#B88B2A]/30'
                                : 'border-[var(--border-app,#C7D7C9)]'
                            }`}
                          >
                            <div>
                              {/* Hero Thumbnail with Badges */}
                              <div className="relative aspect-[16/10] bg-[#153325] overflow-hidden">
                                <SafeImage
                                  src={att.image_url}
                                  alt={att.name}
                                  className="w-full h-full object-cover"
                                  fallback="landscape"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 items-center">
                                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-[#153325]/90 text-white backdrop-blur-md shadow-xs border border-white/10">
                                    {att.category}
                                  </span>
                                  {att.video_url && (
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-amber-300 border border-amber-400/40 shadow-xs flex items-center gap-1">
                                      <Play className="w-2.5 h-2.5 fill-current" /> Video
                                    </span>
                                  )}
                                </div>

                                {hasCoords && (
                                  <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white/90 text-[9px] px-2 py-0.5 rounded-md border border-white/15 font-mono flex items-center gap-1">
                                    <Navigation className="w-2.5 h-2.5 text-[#B88B2A] fill-current" />
                                    <span>{parseFloat(att.latitude).toFixed(3)}°, {parseFloat(att.longitude).toFixed(3)}°</span>
                                  </div>
                                )}
                              </div>

                              {/* Card Content */}
                              <div className="p-4">
                                <h4 className="font-serif text-base font-bold text-[#153325] leading-snug mb-1">
                                  {att.name}
                                </h4>
                                {att.location_details && (
                                  <p className="text-xs text-[#5A534E] mb-2 flex items-center gap-1 truncate">
                                    <MapPin className="w-3.5 h-3.5 text-[#B88B2A] flex-shrink-0" />
                                    <span>{att.location_details}</span>
                                  </p>
                                )}
                                <p className="text-xs text-[#5A534E] line-clamp-2 leading-relaxed">
                                  {att.description || 'Scenic attraction listed in the municipality directory.'}
                                </p>
                              </div>
                            </div>

                            {/* Toolbar Footer */}
                            <div className="p-3 border-t border-[var(--border-app,#C7D7C9)] bg-[#FAF7F2]/50 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewAttraction(att)}
                                className="px-2.5 py-1.5 text-xs font-bold text-[#153325] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-[#E8DFC8] flex items-center gap-1 cursor-pointer"
                                title="Preview Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartAttractionEdit(att)}
                                  className="px-3 py-1.5 bg-[#153325] hover:bg-[#1D4433] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <Edit className="w-3 h-3 text-[#B88B2A]" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttraction(att.id)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Attraction"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Modal for Municipal Officer */}
              {previewAttraction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-[#E8DFC8] my-auto text-left">
                    <div className="relative aspect-video bg-[#153325] overflow-hidden rounded-t-2xl">
                      {previewAttraction.video_url ? (
                        previewAttraction.video_url.includes('youtube.com') || previewAttraction.video_url.includes('youtu.be') ? (
                          <iframe
                            src={previewAttraction.video_url.replace('watch?v=', 'embed/')}
                            title={previewAttraction.name}
                            className="w-full h-full object-cover"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            src={previewAttraction.video_url}
                            controls
                            className="w-full h-full object-cover"
                            poster={previewAttraction.image_url}
                          />
                        )
                      ) : (
                        <SafeImage
                          src={previewAttraction.image_url}
                          alt={previewAttraction.name}
                          className="w-full h-full object-cover"
                          fallback="landscape"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setPreviewAttraction(null)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md cursor-pointer transition-colors shadow"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-6 space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#B88B2A]">
                            {previewAttraction.category}
                          </span>
                          {previewAttraction.latitude && previewAttraction.longitude && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${previewAttraction.latitude},${previewAttraction.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-[#153325] hover:underline inline-flex items-center gap-1"
                            >
                              <Navigation className="w-3 h-3 text-[#B88B2A] fill-current" />
                              <span>{parseFloat(previewAttraction.latitude).toFixed(4)}°, {parseFloat(previewAttraction.longitude).toFixed(4)}°</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-[#153325]">
                          {previewAttraction.name}
                        </h3>
                        {previewAttraction.location_details && (
                          <p className="text-xs text-[#5A534E] flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-[#B88B2A]" />
                            <span>{previewAttraction.location_details}</span>
                          </p>
                        )}
                      </div>

                      <div className="prose prose-sm text-xs text-[#5A534E] leading-relaxed">
                        <p className="whitespace-pre-line">{previewAttraction.description}</p>
                      </div>

                      <div className="pt-3 border-t border-[var(--border-app,#C7D7C9)] flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewAttraction(null)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Close Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const att = previewAttraction;
                            setPreviewAttraction(null);
                            handleStartAttractionEdit(att);
                          }}
                          className="px-4 py-2 bg-[#153325] hover:bg-[#1D4433] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5 text-[#B88B2A]" />
                          <span>Edit This Attraction</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Requirements Tab */}
        {activeTab === 'requirements' && (() => {
          const homestayReqs = requirements.filter(r => r.target_type === 'HOMESTAY');
          const guideReqs = requirements.filter(r => r.target_type === 'TOUR_GUIDE');
          const mandatoryCount = requirements.filter(r => r.is_required !== false).length;
          const optionalCount = requirements.filter(r => r.is_required === false).length;
          const pendingSubmissionsCount = submissions.filter(s => s.status === 'PENDING').length;

          const STANDARD_PRESETS = [
            {
              name: "Barangay Business Clearance",
              target: "HOMESTAY",
              required: true,
              desc: "Clearance certificate issued by the Punong Barangay certifying local operation within jurisdiction."
            },
            {
              name: "Mayor's / Municipal Business Permit",
              target: "HOMESTAY",
              required: true,
              desc: "Official municipal permit and business license authorizing tourist lodging operations."
            },
            {
              name: "Sanitary & Health Inspection Clearance",
              target: "HOMESTAY",
              required: true,
              desc: "Certification from the Municipal Health Office ensuring potable water and guest hygiene safety."
            },
            {
              name: "Fire Safety Inspection Certificate (FSIC)",
              target: "HOMESTAY",
              required: true,
              desc: "Bureau of Fire Protection (BFP) clearance verifying operational smoke alarms, fire extinguishers, and marked exits."
            },
            {
              name: "DOT / LGU Eco-Guide Accreditation Certificate",
              target: "TOUR_GUIDE",
              required: true,
              desc: "Official certification proving completion of accredited Cordillera eco-tourism training curriculum."
            },
            {
              name: "First Aid & Basic Life Support (BLS) ID",
              target: "TOUR_GUIDE",
              required: true,
              desc: "Current Red Cross or MDRRMO emergency responder certification card."
            },
            {
              name: "Barangay Residency Clearance",
              target: "TOUR_GUIDE",
              required: true,
              desc: "Proof of residency validating that the guide belongs to the local ancestral domain community."
            },
            {
              name: "Medical Certificate of Fitness for Mountain Guiding",
              target: "TOUR_GUIDE",
              required: false,
              desc: "Annual physician's clearance certifying cardiovascular and physical stamina for rugged trek navigation."
            }
          ];

          const applyPreset = (preset) => {
            setReqName(preset.name);
            setReqTarget(preset.target);
            setReqRequired(preset.required);
            setReqDesc(preset.desc);
            showAlert(`Preset "${preset.name}" loaded into form.`, 'info');
            const formPanel = document.getElementById('requirement-form-panel');
            if (formPanel) {
              formPanel.scrollIntoView({ behavior: 'smooth' });
            }
          };

          const filteredRequirements = requirements.filter(r => {
            const matchesSearch = !reqSearch ||
              r.requirement_name?.toLowerCase().includes(reqSearch.toLowerCase()) ||
              r.description?.toLowerCase().includes(reqSearch.toLowerCase());

            if (!matchesSearch) return false;

            if (reqFilterTarget !== 'ALL' && r.target_type !== reqFilterTarget) {
              return false;
            }

            if (reqFilterMandatory === 'REQUIRED' && r.is_required === false) return false;
            if (reqFilterMandatory === 'OPTIONAL' && r.is_required !== false) return false;

            return true;
          });

          return (
            <div className="space-y-6">
              {/* Top KPI Metrics Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5A534E] uppercase tracking-wider">Total Requirements</span>
                    <FolderClosed className="w-4 h-4 text-[#153325]" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-[#153325] mt-2">{requirements.length}</p>
                  <p className="text-[11px] text-[#5A534E] mt-0.5">
                    {mandatoryCount} Mandatory · {optionalCount} Optional
                  </p>
                </div>

                <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5A534E] uppercase tracking-wider">Homestay Checklist</span>
                    <Home className="w-4 h-4 text-[#B88B2A]" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-[#B88B2A] mt-2">{homestayReqs.length}</p>
                  <p className="text-[11px] text-[#5A534E] mt-0.5">Required documents for lodging</p>
                </div>

                <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5A534E] uppercase tracking-wider">Guide Checklist</span>
                    <Compass className="w-4 h-4 text-[#355C6D]" />
                  </div>
                  <p className="text-2xl font-serif font-bold text-[#355C6D] mt-2">{guideReqs.length}</p>
                  <p className="text-[11px] text-[#5A534E] mt-0.5">Required credentials for guides</p>
                </div>

                <div className="bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#5A534E] uppercase tracking-wider">Audit Queue</span>
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <p className="text-2xl font-serif font-bold text-emerald-800">{pendingSubmissionsCount}</p>
                      <span className="text-xs text-[#5A534E]">pending review</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('review')}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#153325] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#1D4433] transition-all cursor-pointer"
                  >
                    <span>Go to Audit Desk</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#B88B2A]" />
                  </button>
                </div>
              </div>

              {/* LGU Standard Presets Strip */}
              <div className="bg-gradient-to-r from-[#153325]/5 via-[#B88B2A]/10 to-[#153325]/5 border border-[var(--border-app,#C7D7C9)] p-4 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#B88B2A]" />
                    <span className="text-xs font-bold text-[#153325] uppercase tracking-wider">
                      Cordillera Standard Presets: 1-Click Quick-Fill Templates
                    </span>
                  </div>
                  <span className="text-[11px] text-[#5A534E]">Click any preset to pre-fill the form</span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {STANDARD_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="px-3 py-1.5 bg-white border border-[var(--border-app,#C7D7C9)] hover:border-[#153325] rounded-xl text-xs font-medium text-[#232120] hover:text-[#153325] shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                      title={preset.desc}
                    >
                      <span className="text-xs">{preset.target === 'HOMESTAY' ? '🏡' : '🧭'}</span>
                      <span className="font-semibold">{preset.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        preset.required ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {preset.required ? 'Req' : 'Opt'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Workspace: Form (Col-5) & Directory (Col-7) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Column */}
                <div
                  id="requirement-form-panel"
                  className="lg:col-span-5 bg-white border border-[var(--border-app,#C7D7C9)] p-6 rounded-2xl shadow-xs h-fit space-y-4 text-left"
                >
                  <div className="flex justify-between items-center border-b border-[var(--border-app,#C7D7C9)] pb-3">
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#153325] flex items-center gap-1.5">
                        <FolderClosed className="w-4 h-4 text-[#B88B2A]" />
                        <span>{editingReqId ? 'Edit Requirement' : 'Add Accreditation Requirement'}</span>
                      </h3>
                      <p className="text-xs text-[#5A534E] mt-0.5">
                        {editingReqId ? 'Update requirement instructions or target.' : 'Define criteria for municipal homestays or tour guides.'}
                      </p>
                    </div>
                    {editingReqId && (
                      <button
                        type="button"
                        onClick={handleCancelEditRequirement}
                        className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleAddRequirement} className="space-y-4">
                    {/* Target Applicant Switch */}
                    <div>
                      <label className="block text-xs font-bold text-[#153325] mb-1.5">
                        Target Applicant Category <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setReqTarget('HOMESTAY')}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                            reqTarget === 'HOMESTAY'
                              ? 'bg-amber-500/10 border-amber-500/50 shadow-xs'
                              : 'bg-white border-[var(--border-app,#C7D7C9)] hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-xs text-[#153325]">
                            <Home className="w-3.5 h-3.5 text-amber-600" />
                            <span>Homestays</span>
                          </div>
                          <span className="text-[10px] text-[#5A534E]">Lodging & Accommodations</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setReqTarget('TOUR_GUIDE')}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                            reqTarget === 'TOUR_GUIDE'
                              ? 'bg-sky-500/10 border-sky-500/50 shadow-xs'
                              : 'bg-white border-[var(--border-app,#C7D7C9)] hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-xs text-[#153325]">
                            <Compass className="w-3.5 h-3.5 text-sky-600" />
                            <span>Tour Guides</span>
                          </div>
                          <span className="text-[10px] text-[#5A534E]">Trek & Mountain Guides</span>
                        </button>
                      </div>
                    </div>

                    {/* Requirement Name */}
                    <div>
                      <label className="block text-xs font-bold text-[#153325] mb-1">
                        Requirement Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={reqName}
                        onChange={(e) => setReqName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs text-[#232120] placeholder-[#5A534E]/60 focus:outline-none focus:border-[#153325]"
                        placeholder="e.g. Barangay Business Clearance"
                      />
                    </div>

                    {/* Mandatory / Optional Status */}
                    <div>
                      <label className="block text-xs font-bold text-[#153325] mb-1.5">
                        Accreditation Obligation
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setReqRequired(true)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
                            reqRequired
                              ? 'bg-red-500/10 border-red-500/40 text-red-800 shadow-2xs'
                              : 'bg-white border-[var(--border-app,#C7D7C9)] text-[#5A534E]'
                          }`}
                        >
                          🚨 Mandatory (Required)
                        </button>
                        <button
                          type="button"
                          onClick={() => setReqRequired(false)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
                            !reqRequired
                              ? 'bg-slate-100 border-slate-300 text-slate-800 shadow-2xs'
                              : 'bg-white border-[var(--border-app,#C7D7C9)] text-[#5A534E]'
                          }`}
                        >
                          ℹ️ Optional (Supplementary)
                        </button>
                      </div>
                      <p className="text-[10px] text-[#5A534E] mt-1 italic">
                        {reqRequired
                          ? 'Mandatory documents must be endorsed before the applicant receives official municipal endorsement.'
                          : 'Optional documents provide supplementary credentials but will not block accreditation.'}
                      </p>
                    </div>

                    {/* Description & Guidelines */}
                    <div>
                      <label className="block text-xs font-bold text-[#153325] mb-1">
                        Instructions & Formatting Guidelines
                      </label>
                      <textarea
                        rows="3"
                        value={reqDesc}
                        onChange={(e) => setReqDesc(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs text-[#232120] placeholder-[#5A534E]/60 focus:outline-none focus:border-[#153325]"
                        placeholder="Specify issuing department, validity timeline, required stamp, or file formats (PDF, JPG, PNG)..."
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={reqSaving}
                      className="w-full py-2.5 bg-[#153325] hover:bg-[#1D4433] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {reqSaving ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Saving Requirement...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#B88B2A]" />
                          <span>{editingReqId ? 'Update Requirement' : 'Save Requirement to Checklist'}</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Directory Column */}
                <div className="lg:col-span-7 space-y-4 text-left">
                  {/* Search and Filters Header */}
                  <div className="bg-white border border-[var(--border-app,#C7D7C9)] p-4 rounded-2xl space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                      {/* Search */}
                      <div className="relative w-full sm:max-w-xs">
                        <Search className="w-3.5 h-3.5 text-[#5A534E] absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="text"
                          value={reqSearch}
                          onChange={(e) => setReqSearch(e.target.value)}
                          placeholder="Search requirements..."
                          className="w-full pl-8 pr-7 py-1.5 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                        />
                        {reqSearch && (
                          <button
                            onClick={() => setReqSearch('')}
                            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Mandatory Filter */}
                      <select
                        value={reqFilterMandatory}
                        onChange={(e) => setReqFilterMandatory(e.target.value)}
                        className="w-full sm:w-auto px-2.5 py-1.5 bg-white border border-[var(--border-app,#C7D7C9)] rounded-xl text-xs font-semibold text-[#153325] focus:outline-none"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="REQUIRED">Mandatory Only</option>
                        <option value="OPTIONAL">Optional Only</option>
                      </select>
                    </div>

                    {/* Target Filter Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                      {[
                        { id: 'ALL', label: 'All Requirements', count: requirements.length },
                        { id: 'HOMESTAY', label: 'Homestays', count: homestayReqs.length, icon: '🏡' },
                        { id: 'TOUR_GUIDE', label: 'Tour Guides', count: guideReqs.length, icon: '🧭' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setReqFilterTarget(tab.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            reqFilterTarget === tab.id
                              ? 'bg-[#153325] text-white shadow-2xs'
                              : 'bg-slate-100 text-[#5A534E] hover:bg-slate-200'
                          }`}
                        >
                          {tab.icon && <span>{tab.icon}</span>}
                          <span>{tab.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            reqFilterTarget === tab.id ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Requirements List */}
                  {filteredRequirements.length === 0 ? (
                    <div className="text-center py-12 bg-white border border-[var(--border-app,#C7D7C9)] rounded-2xl p-6 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#153325]/10 text-[#153325] flex items-center justify-center mx-auto">
                        <FolderClosed className="w-6 h-6 opacity-70" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-serif font-bold text-sm text-[#153325]">
                          {reqSearch || reqFilterTarget !== 'ALL' || reqFilterMandatory !== 'ALL'
                            ? 'No requirements match your filters'
                            : 'No accreditation requirements defined yet'}
                        </p>
                        <p className="text-xs text-[#5A534E] max-w-sm mx-auto">
                          {reqSearch || reqFilterTarget !== 'ALL' || reqFilterMandatory !== 'ALL'
                            ? 'Try clearing your search keyword or switching category tabs.'
                            : 'Homestay owners and guides will be able to register without uploading files until requirements are configured.'}
                        </p>
                      </div>
                      {reqSearch || reqFilterTarget !== 'ALL' || reqFilterMandatory !== 'ALL' ? (
                        <button
                          onClick={() => {
                            setReqSearch('');
                            setReqFilterTarget('ALL');
                            setReqFilterMandatory('ALL');
                          }}
                          className="px-3.5 py-1.5 bg-[#153325] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => applyPreset(STANDARD_PRESETS[0])}
                          className="px-4 py-2 bg-[#153325] hover:bg-[#1D4433] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#B88B2A]" />
                          <span>Load Standard Barangay Clearance Template</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredRequirements.map((r) => {
                        const relatedSubs = submissions.filter(s => s.requirement_id === r.id);
                        const pendingCount = relatedSubs.filter(s => s.status === 'PENDING').length;
                        const endorsedCount = relatedSubs.filter(s => s.status === 'ENDORSED').length;

                        return (
                          <div
                            key={r.id}
                            className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-2xs bg-white ${
                              editingReqId === r.id
                                ? 'border-[#153325] ring-2 ring-[#153325]/10'
                                : 'border-[var(--border-app,#C7D7C9)] hover:border-[#153325]'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="space-y-1.5 flex-grow">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 ${
                                    r.target_type === 'HOMESTAY'
                                      ? 'bg-amber-500/10 text-amber-800 border border-amber-500/30'
                                      : 'bg-sky-500/10 text-sky-800 border border-sky-500/30'
                                  }`}>
                                    <span>{r.target_type === 'HOMESTAY' ? '🏡' : '🧭'}</span>
                                    <span>{r.target_type === 'HOMESTAY' ? 'Homestay' : 'Tour Guide'}</span>
                                  </span>

                                  {r.is_required !== false ? (
                                    <span className="bg-red-500/10 text-red-700 border border-red-500/30 font-bold px-2 py-0.5 rounded-md text-[9px] tracking-wide uppercase">
                                      Mandatory
                                    </span>
                                  ) : (
                                    <span className="bg-slate-100 text-slate-600 border border-slate-200 font-bold px-2 py-0.5 rounded-md text-[9px] tracking-wide uppercase">
                                      Optional
                                    </span>
                                  )}
                                </div>

                                <h4 className="font-serif font-bold text-slate-800 text-base leading-snug">
                                  {r.requirement_name}
                                </h4>

                                {r.description && (
                                  <p className="text-xs text-[#5A534E] leading-relaxed">
                                    {r.description}
                                  </p>
                                )}

                                {/* Submissions Intelligence Strip */}
                                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#5A534E]">
                                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{relatedSubs.length} Total Submissions</span>
                                  </span>
                                  {pendingCount > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setActiveTab('review')}
                                      className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                                    >
                                      {pendingCount} Pending Audit →
                                    </button>
                                  )}
                                  {endorsedCount > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">
                                      {endorsedCount} Endorsed
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Card Actions */}
                              <div className="flex items-center gap-1 sm:self-start flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleEditRequirement(r)}
                                  className="p-2 text-slate-500 hover:text-[#153325] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                  title="Edit requirement details"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRequirement(r.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                  title="Delete requirement"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Document Review Tab */}
        {activeTab === 'review' && (() => {
          const pendingSubs = submissions.filter(s => s.status === 'PENDING');
          const endorsedSubs = submissions.filter(s => s.status === 'ENDORSED');
          const rejectedSubs = submissions.filter(s => s.status === 'REJECTED');


          const filteredSubs = submissions.filter(s => {
            const matchSearch =
              s.applicant_name?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
              s.requirement_name?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
              s.applicant_role?.toLowerCase().includes(reviewSearch.toLowerCase());
            const matchFilter =
              reviewFilter === 'ALL' ||
              reviewFilter === s.status ||
              (reviewFilter === 'HOMESTAY' && s.applicant_role === 'HOMESTAY_OWNER') ||
              (reviewFilter === 'GUIDE' && s.applicant_role === 'TOUR_GUIDE');
            return matchSearch && matchFilter;
          });

          const handleReview = (subId, status) => {
            const remark = inlineRemarks[subId] || reviewRemarks || 'Processed';
            handleReviewDocument(subId, status, remark);
            setInlineRemarks(prev => { const n = {...prev}; delete n[subId]; return n; });
          };

          const roleColor = (role) => {
            if (role === 'HOMESTAY_OWNER') return 'bg-blue-100 text-blue-800';
            if (role === 'TOUR_GUIDE') return 'bg-violet-100 text-violet-800';
            return 'bg-slate-100 text-slate-600';
          };

          const roleLabel = (role) => role?.replace(/_/g, ' ') || 'Unknown';

          const statusConfig = {
            PENDING: { color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-400', label: 'Pending' },
            ENDORSED: { color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500', label: 'Endorsed' },
            REJECTED: { color: 'bg-red-100 text-red-700', dot: 'bg-red-400', label: 'Rejected' },
          };

          return (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-extrabold text-[#153325] text-lg flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-700" />
                    Document Audit Desk
                  </h3>
                  <p className="text-xs text-[#5A534E] mt-0.5">Review accreditation documents submitted by homestay owners and tour guides.</p>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Submissions', value: submissions.length, icon: FileText, color: 'from-slate-50 to-slate-100', iconBg: 'bg-slate-200', iconColor: 'text-slate-600' },
                  { label: 'Pending Review', value: pendingSubs.length, icon: Clock, color: 'from-amber-50 to-amber-100', iconBg: 'bg-amber-200', iconColor: 'text-amber-700' },
                  { label: 'Endorsed', value: endorsedSubs.length, icon: CheckCircle, color: 'from-emerald-50 to-emerald-100', iconBg: 'bg-emerald-200', iconColor: 'text-emerald-700' },
                  { label: 'Rejected', value: rejectedSubs.length, icon: X, color: 'from-red-50 to-red-100', iconBg: 'bg-red-200', iconColor: 'text-red-600' },
                ].map(({ label, value, icon: Icon, color, iconBg, iconColor }) => (
                  <div key={label} className={`bg-gradient-to-br ${color} rounded-xl p-4 border border-white/80 shadow-sm`}>
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                      </span>
                      <span className="text-[10px] font-bold text-[#5A534E] uppercase tracking-wider leading-tight">{label}</span>
                    </div>
                    <p className="text-2xl font-serif font-bold text-[#153325]">{value}</p>
                  </div>
                ))}
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by applicant name, requirement, or role..."
                    value={reviewSearch}
                    onChange={e => setReviewSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: 'PENDING', label: '⏳ Pending' },
                    { id: 'ENDORSED', label: '✅ Endorsed' },
                    { id: 'REJECTED', label: '❌ Rejected' },
                    { id: 'HOMESTAY', label: '🏠 Homestay' },
                    { id: 'GUIDE', label: '🧭 Guide' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setReviewFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                        reviewFilter === f.id
                          ? 'bg-[#153325] text-white border-[#153325]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Global Remarks Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide mb-1">Global Remark (applied if no per-card remark is set)</p>
                  <input
                    type="text"
                    placeholder="e.g. Document appears invalid — please re-submit with notarized copy..."
                    value={reviewRemarks}
                    onChange={e => setReviewRemarks(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                </div>
              </div>

              {/* Submission Cards */}
              {filteredSubs.length === 0 ? (
                <div className="py-14 flex flex-col items-center gap-3 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <FileCheck className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-600 text-sm">
                    {reviewSearch || reviewFilter !== 'ALL' ? 'No submissions match your filters' : 'No document submissions awaiting audit'}
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    {reviewSearch || reviewFilter !== 'ALL'
                      ? 'Try clearing your search or selecting a different filter.'
                      : 'When homestay owners or tour guides submit accreditation documents, they will appear here for your review.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSubs.map(sub => {
                    const sc = statusConfig[sub.status] || statusConfig.PENDING;
                    const initials = (sub.applicant_name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                    const isHomestay = sub.applicant_role === 'HOMESTAY_OWNER';
                    return (
                      <div
                        key={sub.id}
                        className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
                          sub.status === 'PENDING' ? 'border-amber-200' :
                          sub.status === 'ENDORSED' ? 'border-emerald-200' : 'border-red-100'
                        }`}
                      >
                        {/* Status stripe */}
                        <div className={`h-1 w-full ${sub.status === 'PENDING' ? 'bg-amber-400' : sub.status === 'ENDORSED' ? 'bg-emerald-500' : 'bg-red-400'}`} />

                        <div className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                            {/* Avatar + Info */}
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-extrabold text-sm ${isHomestay ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                                {initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                  <span className="font-extrabold text-[#153325] text-sm truncate">{sub.applicant_name}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${roleColor(sub.applicant_role)}`}>
                                    {roleLabel(sub.applicant_role)}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 truncate">
                                  <span className="font-semibold text-slate-700">Requirement:</span> {sub.requirement_name}
                                </p>
                                {sub.submitted_at && (
                                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Submitted {new Date(sub.submitted_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </p>
                                )}
                                {sub.review_comments && sub.review_comments !== 'Processed' && (
                                  <div className="mt-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Review Note: </span>
                                    <span className="text-[10px] text-slate-600">{sub.review_comments}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Status Badge + Doc Button */}
                            <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wide uppercase ${sc.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                {sc.label}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedDocUrl(sub.document_url)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#153325]/5 hover:bg-[#153325]/10 border border-[#153325]/20 text-[#153325] rounded-lg text-[10px] font-bold transition-all"
                              >
                                <Eye className="w-3 h-3" />
                                View Doc
                              </button>
                            </div>
                          </div>

                          {/* Action Row — only for PENDING */}
                          {sub.status === 'PENDING' && (
                            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                placeholder="Add specific remark for this document (optional)..."
                                value={inlineRemarks[sub.id] || ''}
                                onChange={e => setInlineRemarks(prev => ({ ...prev, [sub.id]: e.target.value }))}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleReview(sub.id, 'ENDORSED')}
                                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs transition-all shadow-sm"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Endorse
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReview(sub.id, 'REJECTED')}
                                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-xs transition-all shadow-sm"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Reviewed state */}
                          {sub.status !== 'PENDING' && (
                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                              {sub.status === 'ENDORSED' ? (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-red-400" />
                              )}
                              <span className={`text-xs font-semibold italic ${sub.status === 'ENDORSED' ? 'text-emerald-600' : 'text-red-500'}`}>
                                {sub.status === 'ENDORSED' ? 'Document endorsed — forwarded for Provincial review' : 'Document rejected — applicant notified to resubmit'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Stakeholders Tab */}
        {activeTab === 'stakeholders' && (
          <div className="space-y-8">
            {/* Homestays */}
            <div>
              <h3 className="font-extrabold text-emerald-950 text-base mb-4 border-b border-slate-100 pb-2">Local Homestays Listings</h3>
              {data.homestays.length === 0 ? (
                <p className="text-slate-450 text-xs py-4 text-center">No homestays registered under this municipality.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-bold bg-slate-50/55">
                        <th className="py-3 px-4">Homestay Name</th>
                        <th className="py-3 px-4">Owner</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.homestays.map((hs) => (
                        <tr key={hs.id} className="border-b border-slate-100 hover:bg-slate-50/40 text-xs text-slate-600">
                          <td className="py-3.5 px-4 font-bold text-slate-800">{hs.name}</td>
                          <td className="py-3.5 px-4">{hs.owner_name}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] tracking-wide uppercase ${
                                hs.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                hs.status === 'ENDORSED' ? 'bg-blue-100 text-blue-800' :
                                hs.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                              {hs.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 flex justify-center gap-2">
                            {hs.status === 'PENDING' && (
                              <button
                                onClick={() => handleEndorseStakeholder(hs.id, 'HOMESTAY')}
                                className="px-3.5 py-1.5 bg-emerald-900 hover:bg-emerald-850 text-white rounded font-bold text-[10px] shadow"
                              >
                                Endorse Profile
                              </button>
                            )}
                            {hs.status === 'ENDORSED' && (
                              <span className="text-blue-600 font-semibold text-[10px] italic">Endorsed — Awaiting Provincial Review</span>
                            )}
                            {(hs.status === 'APPROVED' || hs.status === 'REJECTED') && (
                              <span className="text-slate-400 italic text-[10px]">No pending profile review</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Guides */}
            <div>
              <h3 className="font-extrabold text-emerald-950 text-base mb-4 border-b border-slate-100 pb-2">Accredited Local Tour Guides</h3>
              {data.guides.length === 0 ? (
                <p className="text-slate-450 text-xs py-4 text-center">No tour guides registered under this municipality.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-bold bg-slate-50/55">
                        <th className="py-3 px-4">Guide Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.guides.map((g) => (
                        <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50/40 text-xs text-slate-600">
                          <td className="py-3.5 px-4 font-bold text-slate-800">{g.guide_name}</td>
                          <td className="py-3.5 px-4">{g.email}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] tracking-wide uppercase ${
                                g.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                g.status === 'ENDORSED' ? 'bg-blue-100 text-blue-800' :
                                g.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                              {g.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 flex justify-center gap-2">
                            {g.status === 'PENDING' && (
                              <button
                                onClick={() => handleEndorseStakeholder(g.id, 'GUIDE')}
                                className="px-3.5 py-1.5 bg-emerald-900 hover:bg-emerald-805 text-white rounded font-bold text-[10px] shadow"
                              >
                                Endorse Profile
                              </button>
                            )}
                            {g.status === 'ENDORSED' && (
                              <span className="text-blue-600 font-semibold text-[10px] italic">Endorsed — Awaiting Provincial Review</span>
                            )}
                            {(g.status === 'APPROVED' || g.status === 'REJECTED') && (
                              <span className="text-slate-400 italic text-[10px]">No pending profile review</span>
                            )}
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

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-8">
            {/* Header Masthead */}
            <div className="border-b border-[#E8DFC8] pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#153325] text-white">
                    Official LGU Credentials
                  </span>
                  <span className="text-[10px] font-semibold text-[#B88B2A] uppercase tracking-wider">
                    Republic of the Philippines · DOT CAR
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#153325]">
                  Municipal Tourism Officer Dossier
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
                  Manage your official municipal identity, public contact desk coordinates, and accredited signatory credentials for the Municipality of <strong className="text-[#153325] font-semibold">{user?.municipalityName || 'Abra'}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await refreshUser();
                    showAlert('Officer credentials synchronized.', 'success');
                  }}
                  className="px-3.5 py-2 border border-[#E8DFC8] rounded-xl text-xs font-semibold text-[#153325] hover:bg-stone-50 flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
                  title="Synchronize credentials with Capitol DOT server"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#B88B2A]" />
                  Sync Credentials
                </button>
              </div>
            </div>

            {/* Alert / Feedback message */}
            {profileMsg.text && (
              <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
                profileMsg.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}>
                <div className="flex items-center gap-2">
                  {profileMsg.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                  )}
                  <span>{profileMsg.text}</span>
                </div>
                <button 
                  onClick={() => setProfileMsg({ type: '', text: '' })}
                  className="text-stone-400 hover:text-stone-700 text-xs font-bold px-2 py-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Main Layout: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Official Credential ID Card (col-span-5) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B88B2A] px-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Official Digital Credential Badge
                </div>

                {/* Physical Card Simulation */}
                <div className="bg-gradient-to-b from-[#153325] via-[#1A3D2D] to-[#0F261C] rounded-2xl p-6 text-white shadow-xl border-2 border-[#B88B2A]/40 relative overflow-hidden">
                  
                  {/* Decorative Guilloche/Watermark Background */}
                  <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full border-8 border-white/5 pointer-events-none" />
                  <div className="absolute right-6 top-6 opacity-10 pointer-events-none">
                    <Landmark className="w-32 h-32" />
                  </div>

                  {/* Card Header */}
                  <div className="border-b border-white/15 pb-4 mb-5 text-center relative z-10">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <img
                        src="/abraventure-logo.png"
                        alt="Official Abraventure Seal"
                        className="w-7 h-7 object-contain drop-shadow"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span className="font-serif tracking-wider font-bold text-xs uppercase text-[#FAF7F2]">
                        ABRAVENTURE · PROVINCIAL DOT
                      </span>
                    </div>
                    <p className="text-[9px] font-mono tracking-[0.25em] uppercase text-[#B88B2A]">
                      Republic of the Philippines · Cordillera
                    </p>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-white/90 mt-0.5">
                      Municipal Tourism Officer Credential
                    </p>
                  </div>

                  {/* Officer Portrait & Photo Actions */}
                  <div className="flex flex-col items-center relative z-10">
                    <div className="relative group">
                      <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-[#B88B2A] shadow-lg bg-[#0F261C] flex items-center justify-center">
                        {profilePicPreview ? (
                          <img
                            src={profilePicPreview}
                            alt={profileName || 'Officer Avatar'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-2">
                            <span className="font-serif text-3xl font-black text-[#B88B2A]">
                              {profileName?.charAt(0) || 'M'}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider text-white/40 mt-1 font-mono">
                              No Portrait
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quick Photo Upload Trigger Button */}
                      <label 
                        className="absolute -bottom-2 -right-2 bg-[#B88B2A] hover:bg-[#D4A942] text-[#153325] p-2 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
                        title="Upload official portrait"
                      >
                        <Camera className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePicChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {profilePicFile && (
                      <p className="text-[10px] text-amber-300 mt-2 font-mono flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> New photo staged (click Save below)
                      </p>
                    )}

                    {/* Officer Name & Designation */}
                    <div className="text-center mt-4 w-full">
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-white tracking-wide">
                        {profileName || 'Tourism Officer'}
                      </h3>
                      <div className="inline-flex items-center gap-1 px-3 py-1 mt-1 rounded-full bg-[#B88B2A]/20 border border-[#B88B2A]/50 text-[#FAF7F2] text-xs font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#B88B2A]" />
                        <span>{profileDesignation || 'Municipal Tourism Officer'}</span>
                      </div>
                      <p className="text-xs font-medium text-emerald-200 mt-1.5">
                        Municipality of {user?.municipalityName || 'Abra'}
                      </p>
                    </div>
                  </div>

                  {/* Badge Metadata Details */}
                  <div className="mt-6 pt-4 border-t border-white/10 space-y-2.5 text-xs text-white/80 font-sans relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-white/50">Credential ID</span>
                      <span className="font-mono font-bold text-white text-[11px] tracking-wider">
                        ABRA-MTO-{String(user?.municipalityId || '01').padStart(2, '0')}-{String(user?.id || '101').slice(-3)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-white/50">Accreditation</span>
                      <span className="inline-flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Active in Good Standing
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-white/50">Official Desk</span>
                      <span className="font-semibold text-white truncate max-w-[200px] text-right">
                        {profileAddress || `${user?.municipalityName || 'LGU'} Municipal Hall`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-white/50">Hotline Contact</span>
                      <span className="font-mono text-white/90">
                        {profilePhone || 'Desk line not set'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-white/50">Government Email</span>
                      <span className="font-mono text-white/90 truncate max-w-[200px]">
                        {user?.email}
                      </span>
                    </div>
                  </div>

                  {/* Security QR / Barcode Strip */}
                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between relative z-10 text-[10px] text-white/50 font-mono">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-[#B88B2A]" />
                      <span className="tracking-widest">DOT-CAR-MTO-SECURE</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#B88B2A] font-bold uppercase tracking-wider text-[9px]">
                      <Shield className="w-3 h-3" /> Certified LGU Signatory
                    </div>
                  </div>
                </div>

                {/* Quick Officer Powers Summary Box */}
                <div className="bg-stone-50 border border-[#E8DFC8] rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#153325] flex items-center gap-1.5 uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-[#B88B2A]" /> Delegated Authorities
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Authorized
                    </span>
                  </div>
                  <ul className="text-xs text-stone-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Endorse local homestays and tour guides for Provincial Capitol accreditation.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Curate, verify, and publish municipal attractions, heritage sites, and guided tour packages.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Publish town festival calendars and respond to travelers' DOT inquiries and complaints.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Full Official Profile Editor Form (col-span-7) */}
              <div className="lg:col-span-7 space-y-6">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  
                  {/* Card 1: Official Identity */}
                  <div className="bg-white border border-[#E8DFC8] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
                    <div className="border-b border-[#E8DFC8] pb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-[#153325]/10 text-[#153325]">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-serif text-base font-bold text-[#153325]">
                            Officer Legal Identity & Title
                          </h3>
                          <p className="text-[11px] text-stone-500">
                            Your full name and official title as authorized by the Local Government Unit.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#B88B2A] bg-[#FAF7F2] border border-[#E8DFC8] px-2.5 py-1 rounded-lg">
                        Required
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                          Full Legal Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-[#E8DFC8] rounded-xl text-xs font-semibold text-stone-800 focus:bg-white focus:border-[#153325] focus:outline-none transition-colors"
                            placeholder="e.g. Hon. Maria Santos, Tourism Operations Officer"
                          />
                          <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                          Official Designation / Title
                        </label>
                        <div className="relative mb-2">
                          <input
                            type="text"
                            required
                            value={profileDesignation}
                            onChange={(e) => setProfileDesignation(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-[#E8DFC8] rounded-xl text-xs font-semibold text-stone-800 focus:bg-white focus:border-[#153325] focus:outline-none transition-colors"
                            placeholder="e.g. Municipal Tourism Officer, Tourism Desk Focal Person"
                          />
                          <Award className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                        </div>

                        {/* Quick Designation Presets */}
                        <div className="flex flex-wrap gap-1.5 items-center pt-1">
                          <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Quick Select:</span>
                          {[
                            'Municipal Tourism Officer',
                            'Tourism Operations Officer II',
                            'Tourism Desk Focal Person',
                            'Supervising Tourism Officer'
                          ].map(title => (
                            <button
                              key={title}
                              type="button"
                              onClick={() => setProfileDesignation(title)}
                              className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                                profileDesignation === title
                                  ? 'bg-[#153325] text-white border-[#153325] font-bold'
                                  : 'bg-[#FAF7F2] text-stone-600 border-[#E8DFC8] hover:border-[#153325]'
                              }`}
                            >
                              {title}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                            Government Email
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              disabled
                              value={user?.email || ''}
                              className="w-full pl-10 pr-8 py-2.5 bg-stone-100/70 border border-[#E8DFC8] rounded-xl text-xs font-mono text-stone-500 cursor-not-allowed"
                            />
                            <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                            <Lock className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-3.5" />
                          </div>
                          <p className="text-[10px] text-stone-400 mt-1 font-sans">
                            Official login and notification dispatch address (locked).
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                            Municipality Jurisdiction
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              disabled
                              value={`Municipality of ${user?.municipalityName || 'Abra'}`}
                              className="w-full pl-10 pr-8 py-2.5 bg-stone-100/70 border border-[#E8DFC8] rounded-xl text-xs font-semibold text-stone-600 cursor-not-allowed"
                            />
                            <Landmark className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                            <Lock className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-3.5" />
                          </div>
                          <p className="text-[10px] text-stone-400 mt-1 font-sans">
                            LGU territory assigned by Provincial Tourism Office.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Public Office & Contact Coordinates */}
                  <div className="bg-white border border-[#E8DFC8] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
                    <div className="border-b border-[#E8DFC8] pb-3 flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-[#153325]/10 text-[#153325]">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-serif text-base font-bold text-[#153325]">
                          Tourism Desk Coordinates & Public Assistance
                        </h3>
                        <p className="text-[11px] text-stone-500">
                          Where stakeholders and visitors can reach your municipal tourism assistance desk.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                          Physical Tourism Office Address
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={profileAddress}
                            onChange={(e) => setProfileAddress(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-[#E8DFC8] rounded-xl text-xs font-semibold text-stone-800 focus:bg-white focus:border-[#153325] focus:outline-none transition-colors"
                            placeholder="e.g. Ground Floor, Municipal Hall, Poblacion, Bangued, Abra"
                          />
                          <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1">
                          Appears on official municipal permits and stakeholder submission receipts.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                            Official Hotline / Phone Number
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={profilePhone}
                              onChange={(e) => setProfilePhone(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-[#E8DFC8] rounded-xl text-xs font-semibold text-stone-800 focus:bg-white focus:border-[#153325] focus:outline-none transition-colors"
                              placeholder="e.g. (074) 123-4567 or 0917-123-4567"
                            />
                            <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                          </div>
                          <p className="text-[10px] text-stone-400 mt-1">
                            For urgent travel alerts and stakeholder queries.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                            Public Operating Hours
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              disabled
                              value="Mon - Fri: 8:00 AM - 5:00 PM PST"
                              className="w-full pl-10 pr-4 py-2.5 bg-stone-100/70 border border-[#E8DFC8] rounded-xl text-xs font-semibold text-stone-500 cursor-not-allowed"
                            />
                            <Clock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                          </div>
                          <p className="text-[10px] text-stone-400 mt-1">
                            Standard Civil Service & LGU operational schedule.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Official Portrait Photo Upload */}
                  <div className="bg-white border border-[#E8DFC8] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
                    <div className="border-b border-[#E8DFC8] pb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-[#153325]/10 text-[#153325]">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-serif text-base font-bold text-[#153325]">
                            Official Portrait Photograph
                          </h3>
                          <p className="text-[11px] text-stone-500">
                            Upload a high-resolution professional ID photograph for your digital accreditation card.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-5 p-4 border border-dashed border-[#E8DFC8] rounded-xl bg-[#FAF7F2]/60">
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#E8DFC8] bg-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                        {profilePicPreview ? (
                          <img
                            src={profilePicPreview}
                            alt="Staged Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-stone-300" />
                        )}
                      </div>

                      <div className="flex-1 text-center sm:text-left space-y-1.5">
                        <p className="text-xs font-bold text-[#153325]">
                          {profilePicFile ? profilePicFile.name : 'Select an official headshot file'}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          Recommended: Formal government attire on white or neutral background. Accepts JPG, PNG, WebP up to 5MB.
                        </p>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                          <label className="btn-editorial-outline px-3.5 py-1.5 text-xs text-[#153325] border-[#E8DFC8] hover:bg-white flex items-center gap-1.5 cursor-pointer rounded-lg shadow-2xs font-semibold">
                            <Upload className="w-3.5 h-3.5 text-[#B88B2A]" />
                            {profilePicPreview ? 'Change Photo' : 'Choose Photo'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProfilePicChange}
                              className="hidden"
                            />
                          </label>

                          {profilePicFile && (
                            <button
                              type="button"
                              onClick={() => {
                                setProfilePicFile(null);
                                setProfilePicPreview(user?.profile?.profile_picture_url || user?.municipalityFeaturedImage || '');
                              }}
                              className="px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                            >
                              Discard Staged File
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submission Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="text-xs text-stone-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Updates take effect immediately on municipal receipts and public portal listings.</span>
                    </div>

                    <button
                      type="submit"
                      disabled={profileUpdating}
                      className="w-full sm:w-auto px-8 py-3 bg-[#153325] hover:bg-[#1D4433] text-white font-bold rounded-xl text-xs uppercase tracking-widest cursor-pointer disabled:opacity-55 shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                    >
                      {profileUpdating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-[#B88B2A]" />
                          <span>Saving Officer Dossier...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-[#B88B2A]" />
                          <span>Save & Commit Officer Profile</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Manage Municipality Tab */}
        {activeTab === 'municipality' && (
          <div className="space-y-8">
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-150 pb-2 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-900" />
                Edit Municipality Description
              </h3>

              {munMsg.text && !munImageFile && (
                <div className={`p-4 rounded-xl text-xs font-semibold mb-4 border ${munMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'
                  }`}>
                  {munMsg.text}
                </div>
              )}

              <form onSubmit={handleUpdateMunicipalityProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">
                    About the Municipality (Description)
                  </label>
                  <textarea
                    rows="4"
                    required
                    value={munDescription}
                    onChange={(e) => setMunDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-900"
                    placeholder="Describe the municipality's history, local culture, general attractions..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-805 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                >
                  Update Description
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Image Upload Form */}
              <div className="lg:col-span-1 bg-slate-50 border border-slate-200/60 rounded-2xl p-6 shadow-sm h-fit">
                <h3 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-150 pb-2">
                  Add Banner Image
                </h3>
                {munMsg.text && munImageFile && (
                  <div className={`p-4 rounded-xl text-xs font-semibold mb-4 border ${munMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'
                    }`}>
                    {munMsg.text}
                  </div>
                )}
                <form onSubmit={handleAddMunicipalityImage} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Select File</label>
                    <input
                      id="mun-file-input"
                      type="file"
                      required
                      accept="image/*"
                      onChange={(e) => setMunImageFile(e.target.files[0])}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-950 hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="mun-featured-checkbox"
                      type="checkbox"
                      checked={munIsFeatured}
                      onChange={(e) => setMunIsFeatured(e.target.checked)}
                      className="rounded border-slate-350 text-emerald-900 focus:ring-emerald-900/10 cursor-pointer"
                    />
                    <label htmlFor="mun-featured-checkbox" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      Set as Featured Cover
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={!munImageFile}
                    className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-805 text-white font-bold rounded-xl text-xs cursor-pointer disabled:opacity-55 shadow-sm"
                  >
                    Upload Image
                  </button>
                </form>
              </div>

              {/* Gallery List */}
              <div className="lg:col-span-2 bg-slate-50 border border-slate-200/60 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-150 pb-2">
                  Uploaded Gallery
                </h3>
                {munImages.length === 0 ? (
                  <p className="text-slate-450 text-xs py-8 text-center bg-white border border-slate-100 rounded-xl">
                    No banner images uploaded yet. Default fallback image is currently shown.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {munImages.map((img) => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-205 aspect-video bg-white shadow-sm">
                        <SafeImage
                          src={img.image_url}
                          alt="Municipality image"
                          className="w-full h-full object-cover"
                          fallback="landscape"
                        />
                        {img.is_featured && (
                          <span className="absolute top-2 left-2 bg-amber-500 text-white font-extrabold text-[9px] tracking-wide uppercase px-2 py-0.5 rounded shadow">
                            Featured Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteMunicipalityImage(img.id)}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-750 text-white p-1.5 rounded-lg shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center border border-red-700/10"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

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

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Form */}
          <div className="lg:col-span-1 border border-slate-150 p-6 rounded-2xl bg-slate-50">
            <h3 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-200 pb-2">
              {editingEventId ? 'Edit Event' : 'Add New Event'}
            </h3>
            <form onSubmit={handleEventSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input type="text" required value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" placeholder="e.g. Itneg Weaving Festival" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea rows="3" value={eventDesc} onChange={e => setEventDesc(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select value={eventCategory} onChange={e => setEventCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white">
                  {['Festival', 'Cultural', 'Sports', 'Religious', 'Music', 'Food & Trade', 'Nature', 'Others'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input type="date" required value={eventStartDate} onChange={e => setEventStartDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input type="date" value={eventEndDate} onChange={e => setEventEndDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Venue</label>
                <input type="text" value={eventVenue} onChange={e => setEventVenue(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" placeholder="e.g. Municipal Plaza" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Photo</label>
                <input type="file" accept="image/*" onChange={e => setEventImageFile(e.target.files[0])} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
              </div>
              {eventMsg.text && <p className={`text-xs ${eventMsg.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>{eventMsg.text}</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl">
                  {editingEventId ? 'Update Event' : 'Create Event'}
                </button>
                {editingEventId && <button type="button" onClick={() => setEditingEventId(null)} className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold">Cancel</button>}
              </div>
            </form>
          </div>
          {/* Events List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm mb-2">{events.length} Events Posted</h3>
            {events.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-sm">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                No events yet. Add your first event!
              </div>
            ) : events.map(ev => (
              <div key={ev.id} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4">
                {ev.image_url && <SafeImage src={ev.image_url} alt={ev.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" fallback="square" />}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{ev.category}</span>
                      <h4 className="font-bold text-slate-800 text-sm mt-1">{ev.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{ev.start_date?.split('T')[0]}{ev.end_date ? ` – ${ev.end_date.split('T')[0]}` : ''}{ev.venue ? ` · ${ev.venue}` : ''}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleStartEditEvent(ev)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteEvent(ev.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  {ev.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ev.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tourist Inquiries Tab */}
      {activeTab === 'inquiries' && (
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Tourist Inquiries in {user?.municipalityName}</h2>
          {dotInquiries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm"><MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />No inquiries yet.</div>
          ) : (
            <div className="space-y-3">
              {dotInquiries.map(inq => (
                <div key={inq.id} className={`bg-white border rounded-xl p-4 ${inq.status === 'PENDING' ? 'border-amber-200' : inq.status === 'CONFIRMED' ? 'border-emerald-200' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${inq.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : inq.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : inq.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>{inq.status}</span>
                        <span className="text-xs text-slate-400">{new Date(inq.created_at).toLocaleDateString('en-PH')}</span>
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">{inq.tourist_name} → {inq.homestay_name || inq.guide_name || 'N/A'}</p>
                      <p className="text-xs text-slate-500 mt-1">{inq.message}</p>
                      {inq.payment_proof_url && (
                        <a href={inq.payment_proof_url} target="_blank" rel="noreferrer" className="text-xs text-emerald-700 font-semibold hover:underline mt-1 inline-block">📎 View Payment Proof</a>
                      )}
                      {inq.reply_message && <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-2 mt-2 border border-emerald-100">Reply: {inq.reply_message}</p>}
                    </div>
                    {inq.status === 'PENDING' && (
                      <button onClick={() => setSelectedInquiry(inq.id === selectedInquiry ? null : inq.id)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50">
                        {selectedInquiry === inq.id ? 'Cancel' : 'Reply'}
                      </button>
                    )}
                  </div>
                  {selectedInquiry === inq.id && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                      <input type="text" value={inqReply} onChange={e => setInqReply(e.target.value)} placeholder="Type your reply..." className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" />
                      <button onClick={() => handleInquiryReply(inq.id)} className="px-4 py-2 bg-emerald-900 text-white font-bold text-xs rounded-lg">Send</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Complaints Tab */}
      {activeTab === 'complaints' && (
        <div className="space-y-6">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Tourist Complaints & Feedback</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage and resolve tourist grievances filed in {user.municipalityName}.</p>
            </div>
            <div className="bg-rose-50 text-rose-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-100">
              {complaints.filter(c => c.status === 'PENDING').length} Unresolved Complaints
            </div>
          </div>

          {complaints.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-600 opacity-60" />
              All clear! No complaints submitted for your municipality.
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map(comp => (
                <div key={comp.id} className={`border rounded-2xl p-5 ${comp.status === 'PENDING' ? 'border-amber-200 bg-amber-55/10 bg-amber-50/5' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${comp.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                          {comp.status}
                        </span>
                        <span className="text-xs text-slate-400">Filed by: <strong className="text-slate-600">{comp.tourist_name}</strong> ({comp.tourist_email || 'N/A'})</span>
                        <span className="text-xs text-slate-300">|</span>
                        <span className="text-xs text-slate-400">{new Date(comp.created_at).toLocaleDateString('en-PH')}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-base">{comp.title}</h4>
                      <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-3.5 mt-2 italic">"{comp.description}"</p>
                      
                      {comp.resolution_details && (
                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-950">
                          <p className="font-bold text-emerald-900 mb-1">Resolution Remarks:</p>
                          <p>"{comp.resolution_details}"</p>
                          {comp.resolved_at && (
                            <p className="text-[10px] text-slate-400 mt-1.5 text-right">Resolved on: {new Date(comp.resolved_at).toLocaleDateString('en-PH')}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {comp.status === 'PENDING' && (
                      <button 
                        onClick={() => {
                          setResolvingComplaintId(comp.id);
                          setComplaintResolution('');
                          setResolvingStatus('RESOLVED');
                        }}
                        className="px-3.5 py-1.5 bg-emerald-900 text-white hover:bg-emerald-805 rounded-xl text-xs font-bold cursor-pointer flex-shrink-0"
                      >
                        Resolve
                      </button>
                    )}
                  </div>

                  {/* Inline resolve form */}
                  {resolvingComplaintId === comp.id && (
                    <form onSubmit={handleResolveComplaint} className="mt-4 pt-4 border-t border-slate-150 space-y-3 bg-slate-50 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Enter Resolution Action</span>
                        <div className="flex gap-2">
                          <select 
                            value={resolvingStatus} 
                            onChange={e => setResolvingStatus(e.target.value)}
                            className="bg-white border border-slate-300 text-xs px-2 py-1 rounded focus:outline-none"
                          >
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="INVESTIGATING">INVESTIGATING</option>
                          </select>
                        </div>
                      </div>
                      <textarea
                        required
                        rows="2"
                        value={complaintResolution}
                        onChange={e => setComplaintResolution(e.target.value)}
                        placeholder="Describe details of validation, fines, or mediation performed..."
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button type="submit" className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded font-bold text-[10px] cursor-pointer">Submit Resolution</button>
                        <button type="button" onClick={() => setResolvingComplaintId(null)} className="px-3 py-1.5 border border-slate-300 bg-white text-slate-500 rounded font-semibold text-[10px] cursor-pointer">Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <h2 className="text-lg font-bold text-slate-800">Municipal Analytics Report</h2>
            <div className="flex gap-2 flex-wrap">
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer">
                <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
              </button>
              <button onClick={exportExcel} className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer">
                <FileText className="w-3.5 h-3.5 text-emerald-700" /> Export Excel
              </button>
              <button onClick={exportPDF} className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer">
                <Download className="w-3.5 h-3.5 text-rose-600" /> Export PDF
              </button>
            </div>
          </div>
          {!analytics ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading analytics...</div>
          ) : (
            <div className="space-y-8">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Total Attractions</p>
                  <p className="text-3xl font-black text-emerald-900 mt-1">{analytics.attractionCount}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Total Events</p>
                  <p className="text-3xl font-black text-amber-900 mt-1">{events.length}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Total Inquiries</p>
                  <p className="text-3xl font-black text-blue-900 mt-1">{dotInquiries.length}</p>
                </div>
              </div>

              {/* Monthly Bookings Chart */}
              {analytics.monthlyBookings?.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="font-bold text-slate-800 text-sm mb-4">Monthly Booking Inquiries ({new Date().getFullYear()})</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={analytics.monthlyBookings}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                      <Bar dataKey="total" fill="#0F3D3E" radius={[4, 4, 0, 0]} name="Total" />
                      <Bar dataKey="confirmed" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Confirmed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Homestay Occupancy */}
              {analytics.homestayOccupancy?.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="font-bold text-slate-800 text-sm mb-4">Homestay Booking Count</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.homestayOccupancy} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="homestay" type="category" width={120} tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                      <Bar dataKey="bookings" fill="#6366f1" radius={[0, 4, 4, 0]} name="Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      )}
        </div>
      </main>

      {/* ── Modal: Create / Edit Municipal Video Advertisement ── */}
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
                    {adModalMode === 'create' ? 'Post Municipal Video Advertisement' : 'Edit Municipal Video Advertisement'}
                  </h3>
                  <p className="text-xs text-[#5A534E]">
                    Campaign for <strong>{user?.municipalityName || 'your Municipality'}</strong> featured on Landing Page &amp; Town details page.
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
                    placeholder={`e.g. Discover ${user?.municipalityName || 'Town'} Natural Treasures`}
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
                    placeholder="e.g. Hidden waterfalls & pristine highlands"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#153325]"
                  />
                </div>
              </div>

              {/* Category & Municipality Badge */}
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
                    <option value="Municipal Tourism Spotlight">Municipal Tourism Spotlight</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#153325] mb-1">
                    Designated Municipality
                  </label>
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold flex items-center gap-2">
                    <Landmark className="w-3.5 h-3.5 text-[#B88B2A]" />
                    <span>{user?.municipalityName || 'Your Municipality'}</span>
                    <span className="text-[10px] text-slate-500 font-normal ml-auto">(Assigned LGU)</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#153325] mb-1">Description</label>
                <textarea
                  rows="3"
                  value={adForm.description}
                  onChange={e => setAdForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Detailed promotional description of this municipal attraction, local culture, or adventure..."
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
                  <Camera className="w-4 h-4 text-[#B88B2A]" />
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
                    placeholder={`Explore ${user?.municipalityName || 'Municipality'}`}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#153325]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#153325] mb-1">CTA Destination Link</label>
                  <input
                    type="text"
                    value={adForm.ctaLink}
                    onChange={e => setAdForm(f => ({ ...f, ctaLink: e.target.value }))}
                    placeholder={user?.municipalityId ? `/municipalities/${user.municipalityId}` : '/municipalities'}
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

              {/* Live Status Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="adIsActiveMun"
                  checked={adForm.isActive}
                  onChange={e => setAdForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 text-[#153325] rounded focus:ring-0 cursor-pointer"
                />
                <label htmlFor="adIsActiveMun" className="text-xs font-semibold text-[#153325] cursor-pointer">
                  Publish Immediately (Active on Landing Page and {user?.municipalityName || 'Town'} details page)
                </label>
              </div>

              {adMsg.text && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${adMsg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  {adMsg.text}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowAdModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adFormLoading}
                  className="px-6 py-2 bg-[#153325] hover:bg-[#1D4433] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {adFormLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{adModalMode === 'create' ? 'Publish Advertisement' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MunicipalDashboard;

