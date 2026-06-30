import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Landmark, Compass, FolderClosed, CheckSquare, Plus, Trash2, Edit, AlertCircle, FileCheck, CheckCircle, User, Upload, Mail, Phone } from 'lucide-react';

const MunicipalDashboard = () => {
  const { token, user, refreshUser } = useAuth();
  
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
  const [attractionName, setAttractionName] = useState('');
  const [attractionDesc, setAttractionDesc] = useState('');
  const [attractionCategory, setAttractionCategory] = useState('Nature');
  const [attractionImage, setAttractionImage] = useState('');
  const [attractionLoc, setAttractionLoc] = useState('');

  const [reqName, setReqName] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqTarget, setReqTarget] = useState('HOMESTAY');
  const [reqRequired, setReqRequired] = useState(true);

  const [reviewRemarks, setReviewRemarks] = useState('');

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
  }, [token, user]);

  const handleAddAttraction = async (e) => {
    e.preventDefault();
    if (!attractionName || !attractionDesc) return;
    
    try {
      const response = await fetch('/api/municipalities/attractions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: attractionName,
          description: attractionDesc,
          category: attractionCategory,
          imageUrl: attractionImage,
          locationDetails: attractionLoc
        })
      });

      if (response.ok) {
        setAttractionName('');
        setAttractionDesc('');
        setAttractionImage('');
        setAttractionLoc('');
        alert('Attraction added successfully.');
        await fetchData();
      }
    } catch (err) {
      console.error(err);
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
        alert('Accreditation requirement added successfully.');
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRequirement = async (reqId) => {
    if (!window.confirm('Delete this requirement? Existing documents will be affected.')) return;
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
        alert(`Document marked as ${status.toLowerCase()}.`);
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
        alert('Stakeholder endorsed successfully.');
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
      <div className="border-b border-slate-200 bg-white rounded-t-2xl shadow-sm mb-6 flex px-6 space-x-6">
        {[
          { id: 'attractions', label: 'Local Attractions', icon: Compass },
          { id: 'requirements', label: 'Accreditation Requirements', icon: FolderClosed },
          { id: 'review', label: 'Review Documents', icon: CheckSquare },
          { id: 'stakeholders', label: 'Stakeholders Endorsements', icon: FileCheck },
          { id: 'municipality', label: 'Manage Municipality', icon: Landmark },
          { id: 'profile', label: 'My DOT Profile', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-bold text-sm cursor-pointer transition-all flex items-center gap-2 ${
                activeTab === tab.id
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
            <div className="lg:col-span-1 border border-slate-150 p-6 rounded-2xl bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-200 pb-2">Add Tourist Attraction</h3>
              <form onSubmit={handleAddAttraction} className="space-y-4">
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
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={attractionImage}
                    onChange={(e) => setAttractionImage(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    placeholder="https://..."
                  />
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
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-900 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-emerald-800"
                >
                  Save Attraction
                </button>
              </form>
            </div>

            {/* List of Attractions */}
            <div className="lg:col-span-2">
              <h3 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2">Active Attractions in {user.municipalityName}</h3>
              <p className="text-slate-400 text-xs mb-4">Attractions configured here appear in public municipality profiles for tourists.</p>
              <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 text-xs text-center text-slate-500">
                Manage attractions list via your dashboard. (Configured from database seed and additions).
              </div>
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
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                            r.target_type === 'HOMESTAY' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
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
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] tracking-wide uppercase ${
                            sub.status === 'ENDORSED' ? 'bg-emerald-100 text-emerald-800' :
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
                            {hs.status !== 'PENDING' && (
                              <span className="text-slate-400 italic">No pending profile review</span>
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
                            {g.status !== 'PENDING' && (
                              <span className="text-slate-400 italic">No pending profile review</span>
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
                <div className={`p-4 rounded-xl text-xs font-semibold mb-4 ${
                  profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
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
                <div className={`p-4 rounded-xl text-xs font-semibold mb-4 border ${
                  munMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'
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
                  <div className={`p-4 rounded-xl text-xs font-semibold mb-4 border ${
                    munMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'
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
                        <img
                          src={img.image_url}
                          alt="Municipality image"
                          className="w-full h-full object-cover"
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
    </div>
  );
};

export default MunicipalDashboard;
