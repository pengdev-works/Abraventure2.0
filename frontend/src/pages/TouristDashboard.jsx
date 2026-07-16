import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Calendar, MessageSquare, AlertCircle, Star, CreditCard, 
  Upload, FileText, CheckCircle, Clock, ChevronRight, HelpCircle,
  Megaphone, Plus, Info, ShieldCheck, MapPin
} from 'lucide-react';

const TouristDashboard = () => {
  const { token, user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  
  const [loading, setLoading] = useState(true);
  
  // Payment proof state
  const [uploadingPaymentId, setUploadingPaymentId] = useState(null);
  const [paymentFile, setPaymentFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Selected booking for chat view
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Complaint form state
  const [selectedMunId, setSelectedMunId] = useState('');
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintError, setComplaintError] = useState('');
  const [complaintSuccess, setComplaintSuccess] = useState('');

  // Review form state
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null); // { id, type, name }
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const headers = { 'Authorization': `Bearer ${token}` };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/inquiries', { headers });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/complaints', { headers });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
    }
  };

  const fetchMunicipalities = async () => {
    try {
      const res = await fetch('/api/municipalities');
      if (res.ok) {
        const data = await res.json();
        setMunicipalities(data);
      }
    } catch (err) {
      console.error('Error fetching municipalities:', err);
    }
  };

  const initDashboard = async () => {
    if (!token) return;
    setLoading(true);
    await Promise.all([fetchBookings(), fetchComplaints(), fetchMunicipalities()]);
    setLoading(false);
  };

  useEffect(() => {
    initDashboard();
  }, [token]);

  const handleUploadPaymentProof = async (bookingId) => {
    if (!paymentFile) {
      setUploadError('Please select a file to upload.');
      return;
    }
    setUploadError('');
    setUploadSuccess('');
    
    const formData = new FormData();
    formData.append('paymentProof', paymentFile);

    try {
      const res = await fetch(`/api/inquiries/${bookingId}/payment`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setUploadSuccess('Payment proof uploaded successfully!');
        setPaymentFile(null);
        setUploadingPaymentId(null);
        await fetchBookings();
      } else {
        setUploadError(data.message || 'Failed to upload payment proof.');
      }
    } catch (err) {
      setUploadError('Server error uploading payment proof.');
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!selectedMunId || !complaintTitle || !complaintDesc) {
      setComplaintError('All fields are required.');
      return;
    }
    setComplaintError('');
    setComplaintSuccess('');
    setSubmittingComplaint(true);

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: complaintTitle,
          description: complaintDesc,
          municipalityId: selectedMunId
        })
      });
      const data = await res.json();
      if (res.ok) {
        setComplaintSuccess('Complaint submitted successfully. Local officers have been notified.');
        setComplaintTitle('');
        setComplaintDesc('');
        setSelectedMunId('');
        await fetchComplaints();
      } else {
        setComplaintError(data.message || 'Failed to submit complaint.');
      }
    } catch (err) {
      setComplaintError('Server error submitting complaint.');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handleOpenReviewModal = (booking) => {
    setReviewBookingId(booking.id);
    if (booking.homestay_id) {
      setReviewTarget({ id: booking.homestay_id, type: 'HOMESTAY', name: booking.homestay_name });
    } else if (booking.guide_id) {
      setReviewTarget({ id: booking.guide_id, type: 'GUIDE', name: booking.guide_name });
    }
    setRating(5);
    setReviewComment('');
    setReviewError('');
    setReviewSuccess('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.');
      return;
    }
    setReviewError('');
    setReviewSuccess('');
    setSubmittingReview(true);

    const payload = {
      rating,
      comment: reviewComment,
      homestayId: reviewTarget.type === 'HOMESTAY' ? reviewTarget.id : null,
      guideId: reviewTarget.type === 'GUIDE' ? reviewTarget.id : null
    };

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setReviewSuccess('Thank you! Your review has been submitted.');
        setTimeout(() => {
          setReviewBookingId(null);
          setReviewTarget(null);
        }, 1500);
      } else {
        setReviewError(data.message || 'Failed to submit review.');
      }
    } catch (err) {
      setReviewError('Server error submitting review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-amber-50 text-amber-800 border border-amber-200',
      CONFIRMED: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      CANCELLED: 'bg-red-50 text-red-800 border border-red-200',
      RESPONDED: 'bg-indigo-50 text-indigo-800 border border-indigo-200'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 min-h-[calc(100vh-16rem)]">
        <div className="w-12 h-12 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeBookingsCount = bookings.filter(b => b.status === 'CONFIRMED').length;
  const pendingPaymentsCount = bookings.filter(b => b.status === 'CONFIRMED' && !b.payment_proof_url).length;
  const pendingComplaintsCount = complaints.filter(c => c.status === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-955 via-emerald-900 to-indigo-950 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border border-emerald-800/20 mb-8 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Tourist Account</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Welcome Back, {user?.fullName}!</h1>
            <p className="text-sm text-white/70 mt-1.5 font-light">Manage your verified homestays, tour guides, itineraries, and feedback reports all in one place.</p>
          </div>
          
          <div className="flex gap-3">
            <Link 
              to="/itinerary" 
              className="px-5 py-2.5 bg-white text-emerald-950 hover:bg-slate-50 transition-all font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4 text-emerald-900" />
              My Itinerary Planner
            </Link>
            <Link 
              to="/municipalities" 
              className="px-5 py-2.5 bg-amber-505 text-white bg-amber-500 hover:bg-amber-600 transition-all font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
            >
              <MapPin className="w-4 h-4" />
              Explore Attractions
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Bookings', value: bookings.length, icon: FileText, color: 'bg-emerald-50 text-emerald-905 border-emerald-100' },
          { label: 'Active Trips', value: activeBookingsCount, icon: CheckCircle, color: 'bg-indigo-50 text-indigo-905 border-indigo-100' },
          { label: 'Pending Payments', value: pendingPaymentsCount, icon: CreditCard, color: 'bg-amber-50 text-amber-800 border-amber-100' },
          { label: 'Feedback & Complaints', value: complaints.length, icon: AlertCircle, color: 'bg-rose-50 text-rose-800 border-rose-100' }
        ].map((s, index) => {
          const Icon = s.icon;
          return (
            <div key={index} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">{s.label}</span>
                <h3 className="text-2xl font-black text-slate-800">{s.value}</h3>
              </div>
              <div className={`${s.color} p-3 rounded-xl border flex-shrink-0`}><Icon className="w-5 h-5" /></div>
            </div>
          );
        })}
      </div>

      {/* Tab Selectors */}
      <div className="border-b border-slate-200 bg-white rounded-t-2xl shadow-sm mb-6 flex px-6 space-x-6 overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: 'bookings', label: 'My Bookings & Payments', icon: CreditCard },
          { id: 'complaints', label: 'Complaints & Feedback Hub', icon: Megaphone }
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

      {/* Main Tab Content */}
      <div className="bg-white border border-slate-200 rounded-b-2xl shadow-sm p-6 min-h-[400px]">
        
        {/* Bookings & Payments Tab */}
        {activeTab === 'bookings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-slate-200 rounded-2xl overflow-hidden" style={{minHeight: '520px'}}>
              {/* Booking List */}
              <div className="lg:col-span-1 border-r border-slate-200 bg-slate-50 flex flex-col">
                <div className="px-4 py-3 border-b border-slate-200 bg-white">
                  <h2 className="font-bold text-slate-800 text-sm">My Bookings</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">{bookings.length} inquiry{bookings.length !== 1 ? 's' : ''} sent</p>
                </div>
                {bookings.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <Calendar className="w-10 h-10 text-slate-200 mb-2" />
                    <p className="text-xs font-bold text-slate-500">No bookings yet</p>
                    <Link to="/municipalities" className="mt-3 text-[10px] bg-emerald-900 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-800">Browse Homestays</Link>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {bookings.map((booking) => {
                      const isHomestay = !!booking.homestay_id;
                      const targetName = isHomestay ? booking.homestay_name : booking.guide_name;
                      return (
                        <div
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={`px-4 py-3 cursor-pointer transition-colors ${
                            selectedBooking?.id === booking.id
                              ? 'bg-emerald-900/8 border-l-4 border-emerald-900'
                              : 'hover:bg-slate-100/70 border-l-4 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isHomestay ? 'bg-emerald-100' : 'bg-sky-100'}`}>
                              {isHomestay
                                ? <Calendar className="w-4 h-4 text-emerald-800" />
                                : <ChevronRight className="w-4 h-4 text-sky-800 rotate-90" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="font-bold text-slate-800 text-xs truncate">{targetName}</p>
                                {getStatusBadge(booking.status)}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">{booking.message}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {isHomestay ? '🏠 Homestay' : '🧭 Tour Guide'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Conversation View */}
              <div className="lg:col-span-2 flex flex-col bg-white">
                {selectedBooking ? (
                  (() => {
                    const isHomestay = !!selectedBooking.homestay_id;
                    const targetName = isHomestay ? selectedBooking.homestay_name : selectedBooking.guide_name;
                    const dateString = selectedBooking.start_date
                      ? `${new Date(selectedBooking.start_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}${selectedBooking.end_date ? ' – ' + new Date(selectedBooking.end_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : ''}`
                      : null;
                    return (
                      <>
                        {/* Chat Header */}
                        <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center gap-3 flex-shrink-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isHomestay ? 'bg-emerald-100' : 'bg-sky-100'}`}>
                            {isHomestay ? <Calendar className="w-4 h-4 text-emerald-800" /> : <ChevronRight className="w-4 h-4 text-sky-800 rotate-90" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 text-sm">{targetName}</p>
                            <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 mt-0.5">
                              <span>{isHomestay ? '🏠 Homestay' : '🧭 Tour Guide'}</span>
                              {dateString && <span>📅 {dateString}</span>}
                              {selectedBooking.number_of_guests && <span>👥 {selectedBooking.number_of_guests} guest(s)</span>}
                              {selectedBooking.total_amount && <span>💰 ₱{parseFloat(selectedBooking.total_amount).toLocaleString()}</span>}
                            </div>
                          </div>
                          {getStatusBadge(selectedBooking.status)}
                        </div>

                        {/* Chat Bubbles */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50" style={{minHeight: '220px', maxHeight: '280px'}}>
                          {/* Tourist message — RIGHT (it's you) */}
                          <div className="flex items-end gap-2 flex-row-reverse">
                            <div className="w-7 h-7 rounded-full bg-emerald-900 flex items-center justify-center flex-shrink-0 mb-0.5">
                              <span className="text-xs font-bold text-white">{(user?.fullName || 'Y')[0].toUpperCase()}</span>
                            </div>
                            <div className="max-w-[75%]">
                              <p className="text-[10px] text-slate-400 mb-1 mr-1 text-right">You</p>
                              <div className="bg-emerald-900 rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
                                <p className="text-xs text-white leading-relaxed">{selectedBooking.message}</p>
                              </div>
                            </div>
                          </div>

                          {/* Host reply — LEFT */}
                          {selectedBooking.reply_message ? (
                            <div className="flex items-end gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 ${isHomestay ? 'bg-emerald-100' : 'bg-sky-100'}`}>
                                <span className={`text-xs font-bold ${isHomestay ? 'text-emerald-800' : 'text-sky-800'}`}>{isHomestay ? 'H' : 'G'}</span>
                              </div>
                              <div className="max-w-[75%]">
                                <p className="text-[10px] text-slate-400 mb-1 ml-1">{isHomestay ? 'Host' : 'Guide'}</p>
                                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                                  <p className="text-xs text-slate-700 leading-relaxed">{selectedBooking.reply_message}</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-end gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 ${isHomestay ? 'bg-emerald-50' : 'bg-sky-50'}`}>
                                <span className={`text-xs font-bold ${isHomestay ? 'text-emerald-400' : 'text-sky-400'}`}>{isHomestay ? 'H' : 'G'}</span>
                              </div>
                              <div className="bg-white border border-dashed border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2.5">
                                <p className="text-xs text-slate-400 italic">Waiting for {isHomestay ? 'host' : 'guide'} to reply...</p>
                              </div>
                            </div>
                          )}

                          {selectedBooking.status === 'CONFIRMED' && (
                            <div className="text-center"><span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">✅ Booking Confirmed</span></div>
                          )}
                          {selectedBooking.status === 'CANCELLED' && (
                            <div className="text-center"><span className="text-[10px] bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full">❌ Booking Declined</span></div>
                          )}
                          {selectedBooking.status === 'RESPONDED' && (
                            <div className="text-center"><span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full">💬 {isHomestay ? 'Host' : 'Guide'} has replied — awaiting their confirmation</span></div>
                          )}
                        </div>

                        {/* Bottom Actions */}
                        <div className="border-t border-slate-200 bg-white flex-shrink-0 p-4 space-y-2">
                          <p className="text-[10px] text-slate-400 text-center">Ref: #{selectedBooking.id.substring(0,8)}</p>

                          {/* Contact host card shown when replied but not yet confirmed */}
                          {selectedBooking.status === 'RESPONDED' && (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs space-y-1.5">
                              <p className="font-bold text-blue-800 text-[11px]">The host has replied! 🏠</p>
                              <p className="text-slate-600 text-[10px]">They will confirm your booking soon. You can also reach them directly:</p>
                              {selectedBooking.tourist_email && (
                                <a href={`mailto:${selectedBooking.tourist_email}`} className="flex items-center gap-1.5 text-[10px] text-blue-700 font-semibold hover:underline">
                                  ✉️ {selectedBooking.tourist_email}
                                </a>
                              )}
                              {selectedBooking.tourist_phone && (
                                <a href={`tel:${selectedBooking.tourist_phone}`} className="flex items-center gap-1.5 text-[10px] text-blue-700 font-semibold hover:underline">
                                  📞 {selectedBooking.tourist_phone}
                                </a>
                              )}
                            </div>
                          )}

                          {selectedBooking.status === 'CONFIRMED' && (
                            selectedBooking.payment_proof_url ? (
                              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-850 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-bold">Payment Proof Submitted</p>
                                  <a href={selectedBooking.payment_proof_url} target="_blank" rel="noreferrer" className="underline text-[10px] hover:text-emerald-950">View File</a>
                                </div>
                              </div>
                            ) : uploadingPaymentId === selectedBooking.id ? (
                              <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                                <p className="text-xs font-bold text-slate-700">Upload GCash / Bank Transfer Proof</p>
                                <input type="file" accept="image/*" onChange={e => setPaymentFile(e.target.files[0])} className="w-full text-[10px] border border-slate-200 rounded p-1 bg-white cursor-pointer" />
                                {uploadError && <p className="text-[10px] text-red-600">{uploadError}</p>}
                                {uploadSuccess && <p className="text-[10px] text-emerald-700">{uploadSuccess}</p>}
                                <div className="flex gap-2">
                                  <button onClick={() => handleUploadPaymentProof(selectedBooking.id)} className="flex-1 py-2 bg-emerald-900 text-white rounded-xl font-bold text-xs hover:bg-emerald-800">Submit Proof</button>
                                  <button onClick={() => { setUploadingPaymentId(null); setPaymentFile(null); }} className="py-2 px-4 border border-slate-200 text-slate-500 rounded-xl font-semibold text-xs hover:bg-slate-50">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => setUploadingPaymentId(selectedBooking.id)} className="w-full py-2.5 border border-dashed border-sky-300 text-sky-800 bg-sky-50/50 rounded-xl font-bold text-xs hover:bg-sky-50 transition-colors flex items-center justify-center gap-1.5">
                                <Upload className="w-3.5 h-3.5" /> Upload GCash / Bank Proof
                              </button>
                            )
                          )}

                          {selectedBooking.status === 'CONFIRMED' && (
                            <button onClick={() => handleOpenReviewModal(selectedBooking)} className="w-full py-2.5 border border-amber-200 text-amber-800 bg-amber-50/50 hover:bg-amber-50 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Write a Review
                            </button>
                          )}

                          {selectedBooking.status === 'PENDING' && (
                            <p className="text-[10px] text-center text-slate-400 italic">Your inquiry has been sent. Waiting for the {isHomestay ? 'host' : 'guide'} to reply.</p>
                          )}
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                    <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
                    <p className="font-bold text-sm text-slate-600">Select a booking</p>
                    <p className="text-xs mt-1">Choose a booking from the left to view your conversation with the host.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Complaints Hub Tab */}
        {activeTab === 'complaints' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* File a complaint Form */}
            <div className="lg:col-span-1 border border-slate-200 p-6 rounded-2xl bg-slate-50 h-fit">
              <div className="flex items-center gap-1.5 text-rose-800 font-extrabold text-xs uppercase tracking-wider mb-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Submit Feedback / Complaint
              </div>
              <h3 className="font-extrabold text-slate-800 text-base mb-4 border-b border-slate-200 pb-2">Tourist Grievance Form</h3>
              
              <form onSubmit={handleSubmitComplaint} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Municipality *</label>
                  <select
                    required
                    value={selectedMunId}
                    onChange={e => setSelectedMunId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="">-- Select Municipality --</option>
                    {municipalities.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Topic / Subject Title *</label>
                  <input
                    type="text"
                    required
                    value={complaintTitle}
                    onChange={e => setComplaintTitle(e.target.value)}
                    placeholder="e.g. Overcharged tour rates, Safety concerns..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description *</label>
                  <textarea
                    required
                    rows="4"
                    value={complaintDesc}
                    onChange={e => setComplaintDesc(e.target.value)}
                    placeholder="Please specify dates, locations, and names of individuals/listings involved to help local tourism officers investigate."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                {complaintError && <p className="text-xs text-red-655 text-red-600 font-semibold">{complaintError}</p>}
                {complaintSuccess && <p className="text-xs text-emerald-705 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg">{complaintSuccess}</p>}

                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="w-full py-2.5 bg-rose-650 hover:bg-rose-700 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {submittingComplaint ? 'Submitting...' : 'File Official Complaint'}
                </button>
              </form>
            </div>

            {/* List of submitted complaints */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>My Submitted Complaints ({complaints.length})</span>
                <span className="text-xs font-medium text-slate-400">Reports filed directly to DOT offices</span>
              </h2>

              {complaints.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                  <Megaphone className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <h3 className="font-bold text-slate-700 text-sm">No complaints submitted</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Thank you for helping keep Abra safe. If you encounter violations or concerns, use the form on the left to notify local authorities.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.map((complaint) => {
                    const isPending = complaint.status === 'PENDING';
                    return (
                      <div key={complaint.id} className="border border-slate-200 rounded-2xl p-5 bg-white relative overflow-hidden">
                        {/* Status bar */}
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isPending ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                            {complaint.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Submitted on {new Date(complaint.created_at).toLocaleDateString('en-PH')}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-850 text-sm mb-1">{complaint.title}</h4>
                        <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wide flex items-center gap-1 mb-2">
                          <MapPin className="w-3.5 h-3.5" /> {complaint.municipality_name} Municipality
                        </div>

                        <p className="text-xs text-slate-550 leading-relaxed font-light bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-slate-600">
                          {complaint.description}
                        </p>

                        {/* Resolution Remarks */}
                        {complaint.resolution_details ? (
                          <div className="mt-4 p-4 border border-emerald-100 bg-emerald-50/50 rounded-xl">
                            <div className="flex items-center gap-1.5 text-emerald-850 font-bold text-xs mb-1">
                              <CheckCircle className="w-4 h-4 text-emerald-700" />
                              Official Resolution Status:
                            </div>
                            <p className="text-xs text-emerald-950 font-medium font-light">"{complaint.resolution_details}"</p>
                            {complaint.resolved_at && (
                              <div className="text-[9px] text-slate-400 mt-2 text-right">
                                Resolved on {new Date(complaint.resolved_at).toLocaleDateString('en-PH')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50/40 px-3 py-1.5 rounded-xl border border-amber-100/40 w-fit">
                            <Clock className="w-3.5 h-3.5" /> Awaiting review and action by {complaint.municipality_name} DOT Tourism officers.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* Review Modal Form */}
      {reviewBookingId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-w-md w-full relative">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Leave a Review</h3>
            <p className="text-xs text-slate-450 mb-4">Submit your feedback on <span className="font-semibold text-emerald-900">{reviewTarget?.name}</span>.</p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-705 mb-1.5">Rating (1 to 5 Stars)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star 
                        className={`w-8 h-8 ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-705 mb-1">Your Review / Comments</label>
                <textarea
                  rows="3"
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Share your stay experience, guide support, accuracy..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {reviewError && <p className="text-xs text-red-600 font-semibold">{reviewError}</p>}
              {reviewSuccess && <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 p-2 rounded">{reviewSuccess}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => { setReviewBookingId(null); setReviewTarget(null); }}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TouristDashboard;
