import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import Swal from 'sweetalert2';
import { Landmark, Compass, FolderClosed, CheckSquare, Plus, Trash2, Edit, AlertCircle, FileCheck, CheckCircle, User, Upload, Mail, Phone, MapPin, X, Calendar, BarChart3, MessageSquare, Star, Download, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import SafeImage from '../components/SafeImage';

const MunicipalDashboard = () => {
  const { token, user, refreshUser } = useAuth();
  const { showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState('attractions');
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
  }, [token, user]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider mb-2">
          <Landmark className="w-4.5 h-4.5 text-amber-500 fill-amber-500" /> Municipal Office Portal
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800">{user.municipalityName} DOT Dashboard</h1>
        <p className="text-xs text-slate-450 mt-1">Manage attractions, enforce accreditation requirements, and endorse local stakeholders.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-t-2xl shadow-sm mb-6 flex px-6 space-x-6 overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: 'attractions', label: 'Local Attractions', icon: Compass },
          { id: 'requirements', label: 'Accreditation Requirements', icon: FolderClosed },
          { id: 'review', label: 'Review Documents', icon: CheckSquare },
          { id: 'stakeholders', label: 'Stakeholders Endorsements', icon: FileCheck },
          { id: 'events', label: 'Events & Festivals', icon: Calendar },
          { id: 'inquiries', label: 'Tourist Inquiries', icon: MessageSquare },
          { id: 'complaints', label: 'Tourist Complaints', icon: AlertCircle },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          { id: 'municipality', label: 'Manage Municipality', icon: Landmark },
          { id: 'profile', label: 'My DOT Profile', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-bold text-sm cursor-pointer transition-all flex items-center gap-2 flex-shrink-0 ${activeTab === tab.id
                  ? 'border-emerald-900 text-emerald-950'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-slate-200 rounded-b-2xl shadow-sm p-6">

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <h3 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2">DOT Officer Profile</h3>

              {profileMsg.text && (
                <div className={`p-4 rounded-xl text-xs font-semibold mb-4 ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
                  }`}>
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none"
                      placeholder="Officer Full Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none"
                      placeholder="Contact Phone Number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Official Designation</label>
                    <input
                      type="text"
                      required
                      value={profileDesignation}
                      onChange={(e) => setProfileDesignation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none"
                      placeholder="e.g. Tourism Officer, Municipal Officer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Office Address</label>
                    <input
                      type="text"
                      required
                      value={profileAddress}
                      onChange={(e) => setProfileAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none"
                      placeholder="e.g. Municipal Hall, Tourism Office"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={profileUpdating}
                  className="px-6 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs cursor-pointer disabled:opacity-55"
                >
                  {profileUpdating ? 'Saving Profile...' : 'Save DOT Profile'}
                </button>
              </form>
            </div>

            {/* Preview Card */}
            <div className="lg:col-span-1 border border-slate-150 p-6 rounded-2xl bg-slate-50 flex flex-col items-center text-center">
              <h3 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-200 pb-2 w-full">DOT Profile Preview</h3>
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-emerald-900/10 bg-slate-200 flex-shrink-0">
                <img
                  src={user?.municipalityFeaturedImage || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200'}
                  alt="DOT Officer"
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="font-bold text-slate-805 text-base">{profileName || 'Tourism Officer'}</h4>
              <p className="text-xs text-slate-450 mt-0.5">{profileDesignation || 'Municipal DOT'}</p>

              <div className="w-full text-left space-y-2 mt-6 border-t border-slate-200 pt-4 text-xs text-slate-550">
                <p><strong>Office:</strong> {profileAddress || 'Municipal Hall'}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Phone:</strong> {profilePhone || 'Not provided'}</p>
                <p><strong>Municipality:</strong> {user?.municipalityName}</p>
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
  );
};

export default MunicipalDashboard;
