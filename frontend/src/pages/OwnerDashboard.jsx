import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Home, FileText, Bed, MessageSquare, Upload, CheckCircle, AlertTriangle, Trash2, Calendar, User, Compass } from 'lucide-react';

const OwnerDashboard = () => {
  const { token, user, refreshUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState('documents');
  const [profile, setProfile] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocUrl, setSelectedDocUrl] = useState(null);

  // Profile forms state
  const [hsName, setHsName] = useState('');
  const [hsDesc, setHsDesc] = useState('');
  const [hsAddress, setHsAddress] = useState('');
  const [hsPhone, setHsPhone] = useState('');
  const [hsEmail, setHsEmail] = useState('');
  
  // Room form state
  const [roomType, setRoomType] = useState('Single');
  const [roomPrice, setRoomPrice] = useState('');
  const [roomCapacity, setRoomCapacity] = useState('1');
  const [roomDesc, setRoomDesc] = useState('');
  
  // Inquiry reply state
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [replyText, setReplyText] = useState('');

  const fetchProfileAndRequirements = async () => {
    if (!token || !user) return;
    try {
      // 1. Fetch profile
      const userRes = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
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
        }
      }

      // 2. Fetch requirements of owner's municipality
      const reqRes = await fetch(`/api/requirements/municipality/${user.municipalityId}?targetType=HOMESTAY`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequirements(reqData);
      }

      // 3. Fetch submissions
      const subRes = await fetch('/api/documents/my-submissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubmissions(subData);
      }

      // 4. Fetch received inquiries
      const inqRes = await fetch('/api/inquiries', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (inqRes.ok) {
        const inqData = await inqRes.json();
        setInquiries(inqData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndRequirements();
  }, [token, user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/listings/homestay', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: hsName,
          description: hsDesc,
          address: hsAddress,
          contactPhone: hsPhone,
          contactEmail: hsEmail
        })
      });

      if (response.ok) {
        alert('Homestay profile updated successfully.');
        await fetchProfileAndRequirements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e, requirementId) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('requirementId', requirementId);
    formData.append('document', file);

    try {
      const response = await fetch('/api/documents/submit', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        alert('File uploaded successfully for evaluation.');
        await fetchProfileAndRequirements();
      } else {
        alert('Upload failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('isFeatured', true);
    formData.append('image', file);

    try {
      const response = await fetch('/api/listings/homestay/images', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        alert('Photo uploaded and added to your gallery.');
        await fetchProfileAndRequirements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      const response = await fetch(`/api/listings/homestay/images/${photoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchProfileAndRequirements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!roomPrice) return;

    try {
      const response = await fetch('/api/listings/homestay/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
        alert('Room added successfully.');
        await fetchProfileAndRequirements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Delete this room configuration?')) return;
    try {
      const response = await fetch(`/api/listings/homestay/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchProfileAndRequirements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReplyInquiry = async (e) => {
    e.preventDefault();
    if (!replyText || !selectedInquiry) return;

    try {
      const response = await fetch(`/api/inquiries/reply/${selectedInquiry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ replyMessage: replyText, status: 'RESPONDED' })
      });

      if (response.ok) {
        setReplyText('');
        setSelectedInquiry(null);
        alert('Reply sent successfully to the tourist.');
        await fetchProfileAndRequirements();
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

  const isApproved = profile?.status === 'APPROVED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 pb-5 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider mb-2">
            <Home className="w-4.5 h-4.5 text-amber-500" /> Stakeholder Dashboard
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">Homestay Provider Workspace</h1>
          <p className="text-xs text-slate-450 mt-1">Manage rooms, upload verification documents, and respond to incoming booking inquiries.</p>
        </div>

        {/* Accreditation Status */}
        <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-sm font-bold shadow-sm ${
          isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-250 text-amber-800'
        }`}>
          {isApproved ? (
            <>
              <CheckCircle className="w-5 h-5 text-emerald-900 fill-emerald-900/10" />
              <span>Listing Accredited & Public</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
              <span>Pending DOT Review ({profile?.status || 'PENDING'})</span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-t-2xl shadow-sm mb-6 flex px-6 space-x-6">
        {[
          { id: 'documents', label: 'Accreditation Docs', icon: FileText },
          { id: 'profile', label: 'Homestay Details & Photos', icon: Home },
          { id: 'rooms', label: 'Rooms Configuration', icon: Bed },
          { id: 'inquiries', label: `Inquiries (${inquiries.length})`, icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedInquiry(null);
              }}
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
        
        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div>
            <h3 className="font-bold text-slate-805 text-base mb-2">Accreditation Document Submissions</h3>
            <p className="text-slate-400 text-xs mb-6">
              Upload requirement files specified by the Municipal Tourism Office of {user.municipalityName}. Approved files endorse you to the province.
            </p>

            {requirements.length === 0 ? (
              <p className="text-slate-450 text-xs py-8 text-center bg-slate-50 border border-slate-100 rounded-xl">
                No special accreditation documents configured by your local DOT.
              </p>
            ) : (
              <div className="space-y-4">
                {requirements.map((r) => {
                  const sub = submissions.find((s) => s.requirement_id === r.id);
                  return (
                    <div key={r.id} className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          {r.requirement_name}
                          {r.is_required && (
                            <span className="text-[9px] font-bold tracking-wide uppercase text-red-650 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                              Required
                            </span>
                          )}
                        </h4>
                        {r.description && <p className="text-slate-450 text-xs mt-1">{r.description}</p>}
                        
                        {sub && (
                          <div className="mt-3 text-xs flex items-center gap-4">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] tracking-wide uppercase ${
                              sub.status === 'ENDORSED' ? 'bg-emerald-100 text-emerald-800' :
                              sub.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              Status: {sub.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedDocUrl(sub.document_url)}
                              className="text-emerald-950 font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
                            >
                              View Uploaded File
                            </button>
                          </div>
                        )}
                        
                        {sub?.review_comments && (
                          <p className="mt-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                            <strong>DOT Remarks:</strong> {sub.review_comments}
                          </p>
                        )}
                      </div>

                      {/* Upload button */}
                      <label className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5 self-end md:self-auto">
                        <Upload className="w-4 h-4" />
                        <span>{sub ? 'Resubmit File' : 'Upload File'}</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileUpload(e, r.id)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Details and Photos Tab */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Form */}
            <div>
              <h3 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2">Profile Information</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Homestay Public Name</label>
                  <input
                    type="text"
                    required
                    value={hsName}
                    onChange={(e) => setHsName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Description</label>
                  <textarea
                    rows="4"
                    value={hsDesc}
                    onChange={(e) => setHsDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    placeholder="Describe rooms, local sights, foods, or transportation..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Complete Address</label>
                  <input
                    type="text"
                    required
                    value={hsAddress}
                    onChange={(e) => setHsAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-705 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      required
                      value={hsPhone}
                      onChange={(e) => setHsPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-705 mb-1">Contact Email</label>
                    <input
                      type="email"
                      required
                      value={hsEmail}
                      onChange={(e) => setHsEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-900 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-emerald-800"
                >
                  Save Profile Details
                </button>
              </form>
            </div>

            {/* Photos */}
            <div>
              <h3 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2 flex justify-between items-center">
                <span>Homestay Photo Gallery</span>
                <label className="px-3.5 py-1.5 bg-emerald-900 text-white text-[11px] font-bold rounded-lg cursor-pointer hover:bg-emerald-850 shadow flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> Add Photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </h3>

              {profile?.images && profile.images.length === 0 ? (
                <p className="text-slate-400 text-xs py-8 text-center bg-slate-50 border border-slate-100 rounded-xl">
                  No images uploaded yet. Upload homestay pictures for tourists to browse.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {profile?.images?.map((img) => (
                    <div key={img.id} className="relative rounded-xl overflow-hidden group h-36 bg-slate-100">
                      <img src={img.image_url} alt="Gallery" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleDeletePhoto(img.id)}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow"
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

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-1 border border-slate-150 p-6 rounded-2xl bg-slate-50">
              <h3 className="font-bold text-slate-805 text-sm mb-4 border-b border-slate-205 pb-2">Configure Room</h3>
              <form onSubmit={handleAddRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Room Type</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Single">Single Room</option>
                    <option value="Double">Double Room</option>
                    <option value="Twin">Twin Room</option>
                    <option value="Family">Family Suite</option>
                    <option value="Cabin">Entire Cabin/House</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Price Per Night (₱)</label>
                  <input
                    type="number"
                    required
                    value={roomPrice}
                    onChange={(e) => setRoomPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    placeholder="e.g. 1500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Capacity (Guests)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Description</label>
                  <textarea
                    rows="2"
                    value={roomDesc}
                    onChange={(e) => setRoomDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    placeholder="Amenities like AC, WiFi, private bath..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-900 text-white font-bold rounded-lg text-xs cursor-pointer hover:bg-emerald-800"
                >
                  Save Room Option
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2">
              <h3 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2">Active Room Configurations</h3>
              {profile?.rooms && profile.rooms.length === 0 ? (
                <p className="text-slate-400 text-xs py-8 text-center bg-slate-50 border border-slate-100 rounded-xl">
                  No rooms configured. Add rooms on the left panel to list options.
                </p>
              ) : (
                <div className="space-y-4">
                  {profile?.rooms?.map((rm) => (
                    <div key={rm.id} className="p-4 rounded-xl border border-slate-150 bg-white flex justify-between items-center gap-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{rm.room_type}</h4>
                        <p className="text-slate-450 text-xs mt-0.5">Capacity: {rm.capacity} Guests • {rm.description || 'Basic amenities'}</p>
                        <p className="text-emerald-950 font-bold text-xs mt-1.5">₱{parseFloat(rm.price_per_night).toLocaleString()} / night</p>
                      </div>
                      <button
                        onClick={() => handleDeleteRoom(rm.id)}
                        className="p-2 text-slate-450 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Received Inquiries Tab */}
        {activeTab === 'inquiries' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List of inquiries */}
            <div className="lg:col-span-1 border-r border-slate-100 pr-4 space-y-3 max-h-[500px] overflow-y-auto">
              <h3 className="font-bold text-slate-800 text-sm mb-3">Booking Inquiries Received</h3>
              {inquiries.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">No inquiries received yet.</p>
              ) : (
                inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    onClick={() => setSelectedInquiry(inq)}
                    className={`p-4 rounded-xl border cursor-pointer text-xs transition-all ${
                      selectedInquiry?.id === inq.id
                        ? 'border-emerald-900 bg-emerald-900/5'
                        : 'border-slate-150 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="font-bold text-slate-800">{inq.tourist_name}</h4>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        inq.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {inq.status}
                      </span>
                    </div>
                    {inq.start_date && (
                      <p className="text-slate-450 mt-1 font-semibold">
                        Check-in: {new Date(inq.start_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Inquiry Chat Panel */}
            <div className="lg:col-span-2">
              {selectedInquiry ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                    <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2 mb-2 flex items-center gap-1">
                      <User className="w-4 h-4 text-emerald-900" /> Inquiry Details
                    </h4>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <p><strong>Tourist Name:</strong> {selectedInquiry.tourist_name}</p>
                      <p><strong>Email:</strong> {selectedInquiry.tourist_email}</p>
                      <p><strong>Phone:</strong> {selectedInquiry.tourist_phone || 'None'}</p>
                      {selectedInquiry.start_date && (
                        <p>
                          <strong>Dates:</strong> {new Date(selectedInquiry.start_date).toLocaleDateString()} 
                          {selectedInquiry.end_date ? ` to ${new Date(selectedInquiry.end_date).toLocaleDateString()}` : ''}
                        </p>
                      )}
                      <p><strong>Guests:</strong> {selectedInquiry.number_of_guests}</p>
                    </div>
                  </div>

                  {/* Tourist Message */}
                  <div className="bg-emerald-900/5 border border-emerald-900/10 p-4 rounded-2xl">
                    <p className="text-[10px] font-extrabold text-emerald-950 uppercase tracking-wide mb-1">Tourist Message</p>
                    <p className="text-xs text-slate-700 leading-relaxed font-light">{selectedInquiry.message}</p>
                  </div>

                  {/* Existing Reply */}
                  {selectedInquiry.reply_message && (
                    <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl">
                      <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wide mb-1">Your Response</p>
                      <p className="text-xs text-slate-750 leading-relaxed font-light">{selectedInquiry.reply_message}</p>
                    </div>
                  )}

                  {/* Reply Form */}
                  <form onSubmit={handleReplyInquiry} className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Compose Reply</label>
                    <textarea
                      required
                      rows="3"
                      placeholder="Input GCash details, check-in instructions, confirm availability, or state reservations..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                    ></textarea>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-emerald-900 text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-emerald-850 shadow"
                      >
                        Send Response
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50/50 border border-slate-100 rounded-2xl text-slate-450 p-6 flex flex-col justify-center items-center">
                  <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="font-bold text-sm">Select an Inquiry</p>
                  <p className="text-xs text-slate-500">Pick an inquiry from the left list to review contact details and send replies.</p>
                </div>
              )}
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

export default OwnerDashboard;
