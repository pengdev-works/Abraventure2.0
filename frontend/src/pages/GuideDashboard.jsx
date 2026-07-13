import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { Award, FileText, User, MessageSquare, Upload, CheckCircle, AlertTriangle, Trash2, Calendar, Star } from 'lucide-react';

const GuideDashboard = () => {
  const { token, user } = useAuth();
  const { showAlert } = useAlert();
  
  const [activeTab, setActiveTab] = useState('documents');
  const [profile, setProfile] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocUrl, setSelectedDocUrl] = useState(null);

  // Profile forms state
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState('');
  const [services, setServices] = useState('');
  const [areas, setAreas] = useState('');
  const [priceRate, setPriceRate] = useState('');
  const [profilePic, setProfilePic] = useState(null);

  // Inquiry reply state
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Reviews received
  const [receivedReviews, setReceivedReviews] = useState([]);

  // Availability calendar
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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
          setBio(uData.profile.bio || '');
          setLanguages(uData.profile.languages_spoken || '');
          setServices(uData.profile.services_offered || '');
          setAreas(uData.profile.areas_covered || '');
          setPriceRate(uData.profile.price_rate || '');
        }
      }

      // 2. Fetch requirements of guide's municipality
      const reqRes = await fetch(`/api/requirements/municipality/${user.municipalityId}?targetType=TOUR_GUIDE`, {
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
    fetchReceivedReviews();
  }, [token, user]);

  const fetchReceivedReviews = async () => {
    if (!token) return;
    try {
      const r = await fetch('/api/reviews/received', { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setReceivedReviews(await r.json());
    } catch (err) { console.error(err); }
  };

  const handleConfirmBooking = async (id) => {
    try {
      await fetch(`/api/inquiries/reply/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ replyMessage: 'Your tour guide booking is confirmed! We will meet at the agreed location.', status: 'CONFIRMED' }),
      });
      await fetchProfileAndRequirements();
    } catch (err) { console.error(err); }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await fetch(`/api/inquiries/reply/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ replyMessage: 'Sorry, this booking has been cancelled. Please contact us to reschedule.', status: 'CANCELLED' }),
      });
      await fetchProfileAndRequirements();
    } catch (err) { console.error(err); }
  };

  const buildCalendarDays = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const confirmedBookings = inquiries.filter(i => i.status === 'CONFIRMED' && i.start_date);
    const bookedDates = new Set();
    confirmedBookings.forEach(b => {
      const start = new Date(b.start_date);
      const end = b.end_date ? new Date(b.end_date) : new Date(b.start_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getFullYear() === calendarYear && d.getMonth() === calendarMonth) bookedDates.add(d.getDate());
      }
    });
    return { firstDay, daysInMonth, bookedDates };
  };

  const avgRating = receivedReviews.length > 0
    ? (receivedReviews.reduce((s, r) => s + r.rating, 0) / receivedReviews.length).toFixed(1)
    : null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('bio', bio);
    formData.append('languagesSpoken', languages);
    formData.append('servicesOffered', services);
    formData.append('areasCovered', areas);
    formData.append('priceRate', priceRate ? parseFloat(priceRate) : 0);
    if (profilePic) {
      formData.append('profilePicture', profilePic);
    }

    try {
      const response = await fetch('/api/listings/guide', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        showAlert('Guide profile updated successfully.', 'success');
        setProfilePic(null);
        await fetchProfileAndRequirements();
      } else {
        showAlert('Update failed.', 'error');
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
        showAlert('File uploaded successfully for evaluation.', 'success');
        await fetchProfileAndRequirements();
      } else {
        showAlert('Upload failed.', 'error');
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
        showAlert('Reply sent successfully to the tourist.', 'success');
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
            <Award className="w-4.5 h-4.5 text-amber-500" /> Stakeholder Dashboard
          </div>
          <h1 className="text-3xl font-extrabold text-slate-805">Tour Guide Workspace</h1>
          <p className="text-xs text-slate-450 mt-1">Manage services, upload accreditation papers, and respond to tourists inquiries.</p>
        </div>

        {/* Accreditation Status */}
        <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-sm font-bold shadow-sm ${
          isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-250 text-amber-800'
        }`}>
          {isApproved ? (
            <>
              <CheckCircle className="w-5 h-5 text-emerald-900 fill-emerald-900/10" />
              <span>Accreditation Approved</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
              <span>Accreditation Under Review</span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-t-2xl shadow-sm mb-6 flex px-6 space-x-6 overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: 'documents', label: 'Accreditation Docs', icon: FileText },
          { id: 'profile', label: 'Guide Details & Photo', icon: User },
          { id: 'inquiries', label: `Inquiries (${inquiries.length})`, icon: MessageSquare },
          { id: 'calendar', label: 'Availability Calendar', icon: Calendar },
          { id: 'reviews', label: `My Reviews (${receivedReviews.length})`, icon: Star },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedInquiry(null);
              }}
              className={`py-4 px-1 border-b-2 font-bold text-sm cursor-pointer transition-all flex items-center gap-2 flex-shrink-0 ${
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
              Upload local accreditation requirement files required by the Municipal DOT of {user.municipalityName}. Fulfilling all items triggers municipal endorsement.
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

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <h3 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2">Profile Information</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Languages Spoken</label>
                  <input
                    type="text"
                    required
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    placeholder="e.g. English, Tagalog, Ilokano"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">About Me (Bio)</label>
                  <textarea
                    rows="4"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    placeholder="Write a brief background about your tour guide experience, credentials..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Services Offered</label>
                  <input
                    type="text"
                    required
                    value={services}
                    onChange={(e) => setServices(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    placeholder="e.g. Hiking, waterfalls tour, food tasting, historical walking tour"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Areas Covered</label>
                  <input
                    type="text"
                    required
                    value={areas}
                    onChange={(e) => setAreas(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    placeholder="e.g. Kaparkan Falls, Tineg rivers, Bangued city proper"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Daily Price Rate (₱)</label>
                  <input
                    type="number"
                    required
                    value={priceRate}
                    onChange={(e) => setPriceRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    placeholder="e.g. 1500"
                  />
                </div>
                
                {/* Photo Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-705 mb-1">Upload Profile Picture</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfilePic(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-950 hover:file:bg-emerald-100"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-900 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-emerald-800"
                >
                  Save Guide details
                </button>
              </form>
            </div>

            {/* Profile Card Preview */}
            <div className="lg:col-span-1 border border-slate-150 p-6 rounded-2xl bg-slate-50 flex flex-col items-center text-center">
              <h3 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-200 pb-2 w-full">Card Preview</h3>
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-emerald-900/10 bg-slate-200 flex-shrink-0">
                <img
                  src={profile?.profile_picture_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                  alt="Guide Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="font-bold text-slate-800 text-base flex items-center gap-1">
                {user.fullName}
                {isApproved && <CheckCircle className="w-4 h-4 text-emerald-900 fill-emerald-900/10" />}
              </h4>
              <p className="text-xs text-slate-450 mt-0.5">{user.municipalityName} Tour Guide</p>
              
              <div className="w-full text-left space-y-2 mt-6 text-xs text-slate-500 border-t border-slate-200 pt-4">
                <p><strong>Languages:</strong> {languages || 'Not configured'}</p>
                <p><strong>Areas:</strong> {areas || 'Not configured'}</p>
                <p className="text-emerald-950 font-bold">Daily Rate: ₱{priceRate ? parseFloat(priceRate).toLocaleString() : '0.00'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Received Inquiries Tab */}
        {activeTab === 'inquiries' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List of inquiries */}
            <div className="lg:col-span-1 border-r border-slate-100 pr-4 space-y-3 max-h-[500px] overflow-y-auto">
              <h3 className="font-bold text-slate-800 text-sm mb-3">Tour Inquiries Received</h3>
              {inquiries.length === 0 ? (
                <p className="text-slate-450 text-xs py-4 text-center">No inquiries received yet.</p>
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
                        Tour Date: {new Date(inq.start_date).toLocaleDateString()}
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
                      <User className="w-4 h-4 text-emerald-900" /> Tourist Details
                    </h4>
                    <div className="space-y-1.5 text-xs text-slate-650">
                      <p><strong>Tourist Name:</strong> {selectedInquiry.tourist_name}</p>
                      <p><strong>Email:</strong> {selectedInquiry.tourist_email}</p>
                      <p><strong>Phone:</strong> {selectedInquiry.tourist_phone || 'None'}</p>
                      {selectedInquiry.start_date && (
                        <p><strong>Tour Date:</strong> {new Date(selectedInquiry.start_date).toLocaleDateString()}</p>
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

        {/* Availability Calendar */}
        {activeTab === 'calendar' && (() => {
          const { firstDay, daysInMonth, bookedDates } = buildCalendarDays();
          const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
          return (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 text-base">Guide Availability Calendar</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => { let m=calendarMonth-1,y=calendarYear; if(m<0){m=11;y--;} setCalendarMonth(m);setCalendarYear(y); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">‹</button>
                  <span className="text-sm font-bold text-slate-800 min-w-[130px] text-center">{MONTH_NAMES[calendarMonth]} {calendarYear}</span>
                  <button onClick={() => { let m=calendarMonth+1,y=calendarYear; if(m>11){m=0;y++;} setCalendarMonth(m);setCalendarYear(y); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">›</button>
                </div>
              </div>
              <div className="flex gap-4 text-xs mb-4">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-400 rounded-full"/> Booked</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded-full"/> Available</span>
              </div>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-7 bg-emerald-900">
                  {dayNames.map(d => <div key={d} className="text-center text-white text-[10px] font-bold uppercase py-2">{d}</div>)}
                </div>
                <div className="grid grid-cols-7">
                  {Array.from({length: firstDay}).map((_,i) => <div key={`e-${i}`} className="h-12 bg-slate-50 border border-slate-100"/>)}
                  {Array.from({length: daysInMonth},(_,i)=>i+1).map(day => {
                    const isBooked = bookedDates.has(day);
                    const isToday = day===new Date().getDate() && calendarMonth===new Date().getMonth() && calendarYear===new Date().getFullYear();
                    return (
                      <div key={day} className={`h-12 border border-slate-100 flex items-center justify-center ${isBooked?'bg-red-50':'bg-white hover:bg-emerald-50'}`}>
                        <span className={`text-xs font-semibold ${isBooked?'text-red-600':isToday?'text-white':'text-slate-700'} ${isToday?'bg-emerald-900 rounded-full w-6 h-6 flex items-center justify-center':''}`}>{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3 text-center">Red = Booked tour days (confirmed). Green = Available.</p>
            </div>
          );
        })()}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">Tourist Reviews</h3>
              {avgRating && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400"/>
                  <span className="font-black text-amber-900 text-lg">{avgRating}</span>
                  <span className="text-xs text-amber-700">/ 5 ({receivedReviews.length} reviews)</span>
                </div>
              )}
            </div>
            {receivedReviews.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm"><Star className="w-10 h-10 mx-auto mb-2 opacity-30"/> No reviews yet.</div>
            ) : (
              <div className="space-y-4">
                {receivedReviews.map(rev => (
                  <div key={rev.id} className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-slate-800 text-sm">{rev.reviewer_name || 'Anonymous'}</p>
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(s=><Star key={s} className={`w-4 h-4 ${s<=rev.rating?'fill-amber-400 text-amber-400':'text-slate-200'}`}/>)}</div>
                    </div>
                    {rev.comment && <p className="text-slate-600 text-xs leading-relaxed">{rev.comment}</p>}
                    <p className="text-slate-300 text-[10px] mt-2">{new Date(rev.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div> {/* <-- Closes Tab Content container */}

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

export default GuideDashboard;
