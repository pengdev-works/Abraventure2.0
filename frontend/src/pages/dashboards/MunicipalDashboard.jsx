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
  Camera, Building2, QrCode, Award, Check, Clock, Shield, Lock, RefreshCw, Sparkles
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

  const [reqName, setReqName] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqTarget, setReqTarget] = useState('HOMESTAY');
  const [reqRequired, setReqRequired] = useState(true);

  const [reviewRemarks, setReviewRemarks] = useState('');

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
  }, [token, user]);

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
      // Keep existing URL when editing and no new file was chosen
      formData.append('imageUrl', pkgImageUrl);
    }

    try {
      const url = editingPkgId ? `/api/packages/${editingPkgId}` : '/api/packages';
      const method = editingPkgId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }, // NO Content-Type header; browser sets multipart boundary
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
    setPkgImagePreview(pkg.image_url || ''); // show current image as preview

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

  const handleDeletePackage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this municipal package?')) return;
    try {
      const response = await fetch(`/api/packages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        showAlert('Package deleted successfully.', 'success');
        fetchPackages();
      }
    } catch (err) {
      console.error(err);
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
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAttractionLat(pos.coords.latitude.toFixed(6));
        setAttractionLng(pos.coords.longitude.toFixed(6));
        showAlert('GPS coordinates detected successfully!', 'success');
      },
      (err) => {
        showAlert('Failed to acquire GPS location. Please type latitude & longitude manually.', 'error');
      }
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
    setAttractionImageFile(null);
    setAttractionImagePreview(att.image_url || '');
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
  };

  const handleAttractionSubmit = async (e) => {
    e.preventDefault();
    if (!attractionName || !attractionDesc) return;

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
        showAlert(editingAttractionId ? 'Attraction updated successfully.' : 'Attraction added successfully.', 'success');
        handleCancelAttractionEdit();
        await fetchMunicipalityData();
      } else {
        showAlert(resData.message || 'Failed to save attraction.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Server error saving attraction.', 'error');
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
    if (!reqName) return;

    try {
      const response = await fetch('/api/requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requirementName: reqName,
          description: reqDesc,
          targetType: reqTarget,
          isRequired: reqRequired
        })
      });

      if (response.ok) {
        setReqName('');
        setReqDesc('');
        showAlert('Accreditation requirement added successfully.', 'success');
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRequirement = async (reqId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Delete this requirement? Existing documents will be affected.',
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
      const response = await fetch(`/api/requirements/${reqId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewDocument = async (subId, status) => {
    try {
      const response = await fetch(`/api/documents/review/${subId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, reviewComments: reviewRemarks || 'Processed' })
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
        {activeTab === 'packages' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Col: Create/Edit Form (col-span-5) */}
            <div className="lg:col-span-5 border border-slate-200 p-6 rounded-2xl bg-slate-50/50 h-fit space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-800" />
                  {editingPkgId ? 'Edit Tour Package' : 'Create Municipal Tour Package'}
                </h3>
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
                    className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              {pkgMsg.text && (
                <div className={`p-3 rounded-lg text-xs font-semibold ${pkgMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {pkgMsg.text}
                </div>
              )}

              <form onSubmit={handlePackageSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Package Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3D2N Tineg Eco-Adventure & Kaparkan Falls"
                    value={pkgTitle}
                    onChange={(e) => setPkgTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Price per Person (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 3500"
                      value={pkgPrice}
                      onChange={(e) => setPkgPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Days)</label>
                    <input
                      type="number"
                      min="1"
                      max="14"
                      required
                      value={pkgDuration}
                      onChange={(e) => setPkgDuration(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cover Image</label>

                  {/* Image preview */}
                  {pkgImagePreview && (
                    <div className="mb-2 relative group w-full h-36 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img src={pkgImagePreview} alt="Cover preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setPkgImageFile(null); setPkgImagePreview(''); setPkgImageUrl(''); }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-80 hover:opacity-100 transition-all cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* File picker */}
                  <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-300 hover:border-emerald-700 rounded-xl bg-slate-50 hover:bg-emerald-50 cursor-pointer transition-all">
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-emerald-700" />
                      <span className="text-[11px] text-slate-500">
                        {pkgImageFile ? pkgImageFile.name : 'Click to upload cover image'}
                      </span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, WEBP — max 10MB</span>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handlePkgImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Inclusions Summary</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 Nights Homestay, Accredited Guide, Environmental Fees, Transfers"
                    value={pkgInclusions}
                    onChange={(e) => setPkgInclusions(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows="3"
                    placeholder="Overview of what tourists will experience in this municipal package..."
                    value={pkgDesc}
                    onChange={(e) => setPkgDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-800 resize-none"
                  />
                </div>

                {/* Day-by-Day Package Item Builder */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" /> Day Schedule Items ({pkgItems.length})
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddPkgItem}
                      className="px-2.5 py-1 bg-emerald-900 text-white rounded text-[11px] font-bold hover:bg-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Stop
                    </button>
                  </div>

                  {pkgItems.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic text-center py-3 bg-white rounded border border-dashed border-slate-200">
                      No stops added yet. Click "Add Stop" to include attractions, homestays, or guides in this package schedule.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {pkgItems.map((item, idx) => (
                        <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 relative shadow-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded">
                              Stop #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemovePkgItem(idx)}
                              className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Day #</label>
                              <select
                                value={item.dayNumber}
                                onChange={(e) => handlePkgItemChange(idx, 'dayNumber', e.target.value)}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px]"
                              >
                                {[...Array(parseInt(pkgDuration || 1)).keys()].map(d => (
                                  <option key={d + 1} value={d + 1}>Day {d + 1}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Type</label>
                              <select
                                value={item.activityType}
                                onChange={(e) => handlePkgItemChange(idx, 'activityType', e.target.value)}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px]"
                              >
                                <option value="ATTRACTION">Attraction</option>
                                <option value="HOMESTAY">Homestay</option>
                                <option value="GUIDE">Tour Guide</option>
                                <option value="CUSTOM">Custom Activity</option>
                              </select>
                            </div>
                          </div>

                          {item.activityType === 'ATTRACTION' && (
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Select Attraction</label>
                              <select
                                value={item.targetId}
                                onChange={(e) => handlePkgItemChange(idx, 'targetId', e.target.value)}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px]"
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
                              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Select Homestay</label>
                              <select
                                value={item.targetId}
                                onChange={(e) => handlePkgItemChange(idx, 'targetId', e.target.value)}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px]"
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
                              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Select Tour Guide</label>
                              <select
                                value={item.targetId}
                                onChange={(e) => handlePkgItemChange(idx, 'targetId', e.target.value)}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px]"
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
                              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Custom Title</label>
                              <input
                                type="text"
                                placeholder="e.g. Traditional Abra Basi Tasting"
                                value={item.customActivityName}
                                onChange={(e) => handlePkgItemChange(idx, 'customActivityName', e.target.value)}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px]"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  {editingPkgId ? 'Update Tour Package' : 'Publish Tour Package'}
                </button>
              </form>
            </div>

            {/* Right Col: Package Cards List (col-span-7) */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>Published Municipal Packages ({packagesList.length})</span>
                <span className="text-xs font-normal text-slate-500">Visible to all tourists on municipality page</span>
              </h3>

              {packagesList.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600 font-bold text-sm">No packages created yet</p>
                  <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                    Create official municipal packages on the left form so tourists can book them as-is or import them into their trip planner.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packagesList.map(pkg => (
                    <div key={pkg.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        {pkg.image_url ? (
                          <div className="h-36 w-full overflow-hidden relative">
                            <SafeImage src={pkg.image_url} alt={pkg.title} className="w-full h-full object-cover" />
                            <span className="absolute top-3 right-3 bg-emerald-900/90 backdrop-blur-md text-amber-300 font-black text-xs px-2.5 py-1 rounded-full shadow-md">
                              ₱{parseFloat(pkg.price).toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <div className="h-28 bg-emerald-900/10 flex items-center justify-center relative border-b border-slate-100">
                            <Package className="w-10 h-10 text-emerald-900/40" />
                            <span className="absolute top-3 right-3 bg-emerald-900 text-amber-300 font-black text-xs px-2.5 py-1 rounded-full shadow-md">
                              ₱{parseFloat(pkg.price).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                              {pkg.duration_days} Day{pkg.duration_days > 1 ? 's' : ''}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {pkg.item_count || 0} scheduled stops
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{pkg.title}</h4>
                          {pkg.description && (
                            <p className="text-slate-500 text-xs mt-1 line-clamp-2">{pkg.description}</p>
                          )}
                          {pkg.inclusions && (
                            <p className="text-[11px] text-emerald-900 font-medium mt-2 bg-emerald-50 p-2 rounded-lg border border-emerald-100/60">
                              Includes: {pkg.inclusions}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
                        <button
                          onClick={() => handleEditPackage(pkg)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attractions Tab */}
        {activeTab === 'attractions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-1 border border-slate-150 p-6 rounded-2xl bg-slate-50 h-fit">
              <h3 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-200 pb-2">
                {editingAttractionId ? 'Edit Tourist Attraction' : 'Add Tourist Attraction'}
              </h3>
              <form onSubmit={handleAttractionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Attraction Name</label>
                  <input
                    type="text"
                    required
                    value={attractionName}
                    onChange={(e) => setAttractionName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    placeholder="e.g. Libtec Crystal Cave"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Description</label>
                  <textarea
                    required
                    rows="3"
                    value={attractionDesc}
                    onChange={(e) => setAttractionDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    placeholder="Provide details about travel safety, hiking, or scenery..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Category</label>
                  <select
                    value={attractionCategory}
                    onChange={(e) => setAttractionCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Waterfall">Waterfall / Spring</option>
                    <option value="Cave">Cave / Rock Formation</option>
                    <option value="Historical">Historical Site</option>
                    <option value="Mountain">Mountain / Viewpoint</option>
                    <option value="Cultural">Cultural Landmark</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Upload Photo</label>
                  <input
                    id="attraction-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAttractionImageChange}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-950 hover:file:bg-emerald-100 cursor-pointer"
                  />
                  {attractionImagePreview && (
                    <div className="mt-3 relative rounded-lg overflow-hidden border border-slate-205 aspect-video bg-white">
                      <img src={attractionImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setAttractionImageFile(null);
                          setAttractionImagePreview('');
                          const fileInput = document.getElementById('attraction-file-input');
                          if (fileInput) fileInput.value = '';
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-750 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Upload Video Clip */}
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Upload Video Clip (MP4/WebM)</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setAttractionVideoFile(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-900 hover:file:bg-amber-100 cursor-pointer"
                  />
                  <div className="mt-1">
                    <input
                      type="text"
                      value={attractionVideoUrl}
                      onChange={(e) => setAttractionVideoUrl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      placeholder="Or paste direct video URL (e.g. https://.../spot.mp4)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Location Details</label>
                  <input
                    type="text"
                    value={attractionLoc}
                    onChange={(e) => setAttractionLoc(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    placeholder="Barangay name, landmarks..."
                  />
                </div>

                {/* Exact Coordinates (Latitude & Longitude) */}
                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Exact GPS Coordinates</label>
                    <button
                      type="button"
                      onClick={handleDetectAttractionCoords}
                      className="text-[10px] font-extrabold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      📍 Detect Coords
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500">Latitude</span>
                      <input
                        type="number"
                        step="any"
                        value={attractionLat}
                        onChange={(e) => setAttractionLat(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        placeholder="e.g. 17.765123"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500">Longitude</span>
                      <input
                        type="number"
                        step="any"
                        value={attractionLng}
                        onChange={(e) => setAttractionLng(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        placeholder="e.g. 120.781234"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {editingAttractionId && (
                    <button
                      type="button"
                      onClick={handleCancelAttractionEdit}
                      className="w-1/2 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className={`${editingAttractionId ? 'w-1/2' : 'w-full'} py-2.5 bg-emerald-900 hover:bg-emerald-805 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors`}
                  >
                    {editingAttractionId ? 'Update' : 'Save Attraction'}
                  </button>
                </div>
              </form>
            </div>

            {/* List of Attractions */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-slate-805 text-base mb-2 border-b border-slate-100 pb-2">Active Attractions in {user.municipalityName}</h3>
              <p className="text-slate-450 text-xs mb-4">Attractions configured here appear in the public municipality details page for travelers.</p>
              {attractions.length === 0 ? (
                <div className="p-8 border border-slate-150 rounded-2xl bg-slate-50 text-center text-slate-450 text-xs">
                  No tourist attractions configured yet. Use the form on the left to add one!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attractions.map((att) => (
                    <div key={att.id} className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm flex flex-col">
                      <div className="h-40 w-full bg-slate-100 relative">
                        {att.image_url ? (
                          <SafeImage src={att.image_url} alt={att.name} className="w-full h-full object-cover" fallback="landscape" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                            <Compass className="w-8 h-8" />
                          </div>
                        )}
                        <span className="absolute top-2.5 left-2.5 bg-emerald-900 text-white font-extrabold text-[9px] tracking-wide uppercase px-2 py-0.5 rounded shadow">
                          {att.category}
                        </span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm">{att.name}</h4>
                          {att.location_details && (
                            <p className="text-slate-450 text-[10px] mt-1 font-semibold flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" /> {att.location_details}
                            </p>
                          )}
                          <p className="text-slate-550 text-xs mt-2.5 line-clamp-3 leading-relaxed">{att.description}</p>
                        </div>
                        <div className="flex gap-2 mt-4 pt-3.5 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleStartAttractionEdit(att)}
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-500" /> Edit Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttraction(att.id)}
                            className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-650 text-[10px] font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-550" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Requirements Tab */}
        {activeTab === 'requirements' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-1 border border-slate-150 p-6 rounded-2xl bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-200 pb-2">Add Requirement</h3>
              <form onSubmit={handleAddRequirement} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Requirement Name</label>
                  <input
                    type="text"
                    required
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    placeholder="e.g. Barangay Clearance"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Description</label>
                  <textarea
                    rows="2"
                    value={reqDesc}
                    onChange={(e) => setReqDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    placeholder="Instructions for application, formatting..."
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-705 mb-1">Target</label>
                    <select
                      value={reqTarget}
                      onChange={(e) => setReqTarget(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="HOMESTAY">Homestays</option>
                      <option value="TOUR_GUIDE">Tour Guides</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-705 mb-1">Required?</label>
                    <select
                      value={reqRequired ? 'true' : 'false'}
                      onChange={(e) => setReqRequired(e.target.value === 'true')}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="true">Yes</option>
                      <option value="false">Optional</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-900 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-emerald-800"
                >
                  Configure Requirement
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2">
              <h3 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2">Accreditation Requirements List</h3>
              {requirements.length === 0 ? (
                <p className="text-slate-400 text-xs py-8 text-center bg-slate-50 border border-slate-100 rounded-xl">
                  No municipality requirements defined yet. Homestay owners and guides will register without uploading files.
                </p>
              ) : (
                <div className="space-y-3">
                  {requirements.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl border border-slate-150 bg-white flex justify-between items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{r.requirement_name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${r.target_type === 'HOMESTAY' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                            }`}>
                            {r.target_type}
                          </span>
                          {r.is_required && (
                            <span className="bg-red-50 text-red-600 border border-red-100 font-bold px-2 py-0.5 rounded text-[8px] tracking-wide uppercase">
                              Required
                            </span>
                          )}
                        </div>
                        {r.description && <p className="text-slate-450 text-xs mt-1">{r.description}</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteRequirement(r.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Document Review Tab */}
        {activeTab === 'review' && (
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2">Digital Document Audit Desk</h3>

            {/* Comments Input */}
            <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-xl mb-6">
              <label className="block text-xs font-bold text-slate-700 mb-1">Feedback Remarks (Optional)</label>
              <input
                type="text"
                placeholder="Type instructions or reasons before endorsing or rejecting a document..."
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
              />
            </div>

            {submissions.length === 0 ? (
              <p className="text-slate-450 text-xs py-8 text-center">No document submissions awaiting audit.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-bold bg-slate-50/55">
                      <th className="py-3 px-4">Applicant</th>
                      <th className="py-3 px-4">Requirement</th>
                      <th className="py-3 px-4">Document File</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50/40 text-xs text-slate-650">
                        <td className="py-3.5 px-4 font-semibold text-slate-850">
                          {sub.applicant_name} <span className="text-[10px] text-slate-450 font-normal">({sub.applicant_role.replace('_', ' ')})</span>
                        </td>
                        <td className="py-3.5 px-4">{sub.requirement_name}</td>
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => setSelectedDocUrl(sub.document_url)}
                            className="text-emerald-950 font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
                          >
                            View Uploaded File
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] tracking-wide uppercase ${sub.status === 'ENDORSED' ? 'bg-emerald-100 text-emerald-800' :
                              sub.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 flex justify-center gap-2">
                          {sub.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleReviewDocument(sub.id, 'ENDORSED')}
                                className="px-3 py-1 bg-emerald-900 hover:bg-emerald-800 text-white rounded font-bold text-[10px]"
                              >
                                Endorse File
                              </button>
                              <button
                                onClick={() => handleReviewDocument(sub.id, 'REJECTED')}
                                className="px-3 py-1 bg-red-650 hover:bg-red-750 text-white rounded font-bold text-[10px]"
                              >
                                Reject File
                              </button>
                            </>
                          )}
                          {sub.status !== 'PENDING' && (
                            <span className="text-slate-400 italic text-[10px]">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

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
    </div>
  );
};

export default MunicipalDashboard;

