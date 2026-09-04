import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Calendar, MessageSquare, AlertCircle, Star, CreditCard, 
  Upload, FileText, CheckCircle, Clock, ChevronRight, HelpCircle,
  Megaphone, Plus, Info, ShieldCheck, MapPin, Compass, ArrowRight, Check
} from 'lucide-react';
import DarkModeToggle from '../../components/common/DarkModeToggle';

const TouristDashboard = () => {
  const { token, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'bookings');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && t !== activeTab) {
      setActiveTab(t);
    }
  }, [searchParams]);
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
  const [reviewTarget, setReviewTarget] = useState(null);
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
        setComplaintSuccess('Feedback submitted. Municipal Tourism Desk has been officially notified.');
        setComplaintTitle('');
        setComplaintDesc('');
        setSelectedMunId('');
        await fetchComplaints();
      } else {
        setComplaintError(data.message || 'Failed to submit feedback.');
      }
    } catch (err) {
      setComplaintError('Server error submitting feedback.');
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
      PENDING: 'bg-[#FAF7F2] text-[#B88B2A] border border-[#B88B2A]/30',
      CONFIRMED: 'bg-[#153325]/10 text-[#153325] border border-[#153325]/30',
      CANCELLED: 'bg-red-50 text-red-700 border border-red-200',
      RESPONDED: 'bg-[#355C6D]/10 text-[#355C6D] border border-[#355C6D]/30'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 min-h-[calc(100vh-16rem)] bg-[#FAF7F2]">
        <div className="w-8 h-8 border-2 border-[#153325] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeBookingsCount = bookings.filter(b => b.status === 'CONFIRMED').length;
  const pendingPaymentsCount = bookings.filter(b => b.status === 'CONFIRMED' && !b.payment_proof_url).length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#232120] pb-20">
      {/* ── Top Header Banner ── */}
      <div className="bg-[#153325] text-white pt-10 pb-12 border-b border-[#E8DFC8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 text-[#B88B2A] text-[10px] font-bold uppercase tracking-[0.2em] px-3.5 py-1 rounded-full mb-3 border border-white/10">
              <Compass className="w-3.5 h-3.5" />
              <span>Tourist Travel Workspace</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Mabuhay, {user?.fullName || 'Traveler'}
            </h1>
            <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Manage your direct bookings with accredited homestays and licensed guides, upload payment confirmations, and file inquiries with municipal desks.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap items-center">
            <DarkModeToggle />
            <Link 
              to="/itinerary" 
              className="btn-editorial-gold px-4 py-2 text-xs tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5" />
              Expedition Planner
            </Link>
            <Link 
              to="/municipalities" 
              className="btn-editorial-outline px-4 py-2 text-xs text-white border-white/20 hover:bg-white/10 flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              Explore 27 Municipalities
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Inquiries', value: bookings.length, icon: FileText },
            { label: 'Confirmed Stays/Tours', value: activeBookingsCount, icon: CheckCircle },
            { label: 'Awaiting Payment Proof', value: pendingPaymentsCount, icon: CreditCard },
            { label: 'Grievance / Reports', value: complaints.length, icon: AlertCircle }
          ].map((s, index) => {
            const Icon = s.icon;
            return (
              <div key={index} className="bg-white p-5 rounded-2xl border border-[#E8DFC8] shadow-2xs flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-[#5A534E] uppercase tracking-wider block mb-0.5">{s.label}</span>
                  <h3 className="font-serif text-2xl font-bold text-[#153325]">{s.value}</h3>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFC8] text-[#153325] flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Tab Selectors */}
        <div className="border-b border-[#E8DFC8] bg-white rounded-t-2xl shadow-2xs flex px-6 space-x-6 overflow-x-auto whitespace-nowrap">
          {[
            { id: 'bookings', label: 'Bookings & Direct Chat', icon: CreditCard },
            { id: 'complaints', label: 'Municipal Feedback & Grievance Desk', icon: Megaphone }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchParams({ tab: tab.id });
                }}
                className={`py-4 px-1 border-b-2 font-serif text-sm font-bold cursor-pointer transition-all flex items-center gap-2 flex-shrink-0 ${
                  isActive
                    ? 'border-[#153325] text-[#153325]'
                    : 'border-transparent text-[#5A534E] hover:text-[#232120]'
                }`}
              >
                <Icon className="w-4 h-4 text-[#B88B2A]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Tab Content */}
        <div className="bg-white border border-t-0 border-[#E8DFC8] rounded-b-2xl shadow-2xs p-6 min-h-[420px]">
          
          {/* Bookings & Payments Tab */}
          {activeTab === 'bookings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-[#E8DFC8] rounded-2xl overflow-hidden" style={{minHeight: '520px'}}>
              {/* Booking List */}
              <div className="lg:col-span-1 border-r border-[#E8DFC8] bg-[#FAF7F2] flex flex-col">
                <div className="px-5 py-3.5 border-b border-[#E8DFC8] bg-white">
                  <h2 className="font-serif font-bold text-[#153325] text-sm">Active Inquiries</h2>
                  <p className="text-[10px] text-[#5A534E] mt-0.5">{bookings.length} total recorded inquiry</p>
                </div>
                {bookings.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <Calendar className="w-10 h-10 text-[#DCD5C9] mb-2" />
                    <p className="font-serif text-xs font-bold text-[#153325]">No bookings yet</p>
                    <p className="text-[11px] text-[#5A534E] mt-1 max-w-xs">Reach out to homestay hosts or tour guides from the directory.</p>
                    <Link to="/municipalities" className="mt-3 btn-editorial-primary text-[10px] px-3.5 py-1.5">Browse Directory</Link>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto divide-y divide-[#E8DFC8]/60">
                    {bookings.map((booking) => {
                      const isHomestay = !!booking.homestay_id;
                      const targetName = isHomestay ? booking.homestay_name : booking.guide_name;
                      const isSelected = selectedBooking?.id === booking.id;
                      return (
                        <div
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={`px-4 py-3.5 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-white border-l-4 border-[#153325] shadow-2xs'
                              : 'hover:bg-white/60 border-l-4 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-[#E8DFC8] flex items-center justify-center flex-shrink-0 text-[#153325]">
                              {isHomestay ? <Calendar className="w-4 h-4" /> : <Compass className="w-4 h-4 text-[#B88B2A]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="font-serif font-bold text-[#153325] text-xs truncate">{targetName}</p>
                                {getStatusBadge(booking.status)}
                              </div>
                              <p className="text-[11px] text-[#5A534E] truncate mt-0.5">{booking.message}</p>
                              <span className="text-[9px] uppercase tracking-wider font-semibold text-[#5A534E] block mt-0.5">
                                {isHomestay ? 'Accredited Homestay' : 'Tour Guide'}
                              </span>
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
                        <div className="px-6 py-4 border-b border-[#E8DFC8] bg-[#FAF7F2] flex items-center justify-between gap-3 flex-shrink-0">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider font-bold text-[#B88B2A] block">
                              {isHomestay ? 'Homestay Direct Communication' : 'Guide Direct Communication'}
                            </span>
                            <h3 className="font-serif font-bold text-[#153325] text-base">{targetName}</h3>
                            <div className="flex flex-wrap gap-3 text-[11px] text-[#5A534E] mt-1">
                              {dateString && <span>📅 {dateString}</span>}
                              {selectedBooking.number_of_guests && <span>👥 {selectedBooking.number_of_guests} guest(s)</span>}
                              {selectedBooking.total_amount && <span className="font-bold text-[#153325]">💰 ₱{parseFloat(selectedBooking.total_amount).toLocaleString()}</span>}
                            </div>
                          </div>
                          {getStatusBadge(selectedBooking.status)}
                        </div>

                        {/* Chat Bubbles */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white" style={{minHeight: '220px', maxHeight: '300px'}}>
                          {/* Tourist message */}
                          <div className="flex items-end gap-2 flex-row-reverse">
                            <div className="w-7 h-7 rounded-full bg-[#153325] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                              {(user?.fullName || 'Y')[0].toUpperCase()}
                            </div>
                            <div className="max-w-[75%]">
                              <p className="text-[10px] text-[#5A534E] mb-1 mr-1 text-right">You</p>
                              <div className="bg-[#153325] text-white rounded-2xl rounded-br-xs px-4 py-2.5 shadow-2xs">
                                <p className="text-xs leading-relaxed">{selectedBooking.message}</p>
                              </div>
                            </div>
                          </div>

                          {/* Host reply */}
                          {selectedBooking.reply_message ? (
                            <div className="flex items-end gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#FAF7F2] border border-[#E8DFC8] text-[#153325] flex items-center justify-center flex-shrink-0 text-xs font-bold">
                                {isHomestay ? 'H' : 'G'}
                              </div>
                              <div className="max-w-[75%]">
                                <p className="text-[10px] text-[#5A534E] mb-1 ml-1">{isHomestay ? 'Host Operator' : 'Tour Guide'}</p>
                                <div className="bg-[#FAF7F2] border border-[#E8DFC8] rounded-2xl rounded-bl-xs px-4 py-2.5">
                                  <p className="text-xs text-[#232120] leading-relaxed">{selectedBooking.reply_message}</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-end gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#FAF7F2] border border-[#E8DFC8] text-[#9E978E] flex items-center justify-center flex-shrink-0 text-xs">
                                …
                              </div>
                              <div className="bg-[#FAF7F2] border border-dashed border-[#DCD5C9] rounded-2xl rounded-bl-xs px-4 py-2.5">
                                <p className="text-xs text-[#5A534E] italic">Awaiting response from local operator...</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bottom Actions */}
                        <div className="border-t border-[#E8DFC8] bg-[#FAF7F2] p-4 space-y-3">
                          <p className="text-[10px] text-[#5A534E] text-center">Inquiry Reference: #{selectedBooking.id.substring(0,8)}</p>

                          {selectedBooking.status === 'CONFIRMED' && (
                            selectedBooking.payment_proof_url ? (
                              <div className="bg-white border border-[#153325]/20 rounded-xl p-3 text-xs flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[#153325] font-medium">
                                  <Check className="w-4 h-4 text-[#153325]" />
                                  <span>Payment Confirmation Submitted</span>
                                </div>
                                <a href={selectedBooking.payment_proof_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#B88B2A] hover:underline">View Receipt</a>
                              </div>
                            ) : uploadingPaymentId === selectedBooking.id ? (
                              <div className="space-y-2 bg-white border border-[#E8DFC8] rounded-xl p-4">
                                <p className="text-xs font-bold text-[#153325]">Upload GCash / Bank Deposit Slip</p>
                                <input type="file" accept="image/*" onChange={e => setPaymentFile(e.target.files[0])} className="w-full text-xs border border-[#DCD5C9] rounded-lg p-1.5 bg-[#FAF7F2] cursor-pointer" />
                                {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
                                {uploadSuccess && <p className="text-xs text-[#153325] font-medium">{uploadSuccess}</p>}
                                <div className="flex gap-2 pt-1">
                                  <button onClick={() => handleUploadPaymentProof(selectedBooking.id)} className="btn-editorial-primary text-xs px-4 py-2 flex-1">Submit Proof</button>
                                  <button onClick={() => { setUploadingPaymentId(null); setPaymentFile(null); }} className="btn-editorial-ghost text-xs px-4 py-2">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => setUploadingPaymentId(selectedBooking.id)} className="w-full py-2.5 btn-editorial-outline text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer">
                                <Upload className="w-3.5 h-3.5" /> Upload Payment Deposit Confirmation
                              </button>
                            )
                          )}

                          {selectedBooking.status === 'CONFIRMED' && (
                            <button onClick={() => handleOpenReviewModal(selectedBooking)} className="w-full py-2 btn-editorial-gold text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer">
                              <Star className="w-3.5 h-3.5" /> Leave Review for Operator
                            </button>
                          )}
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#5A534E]">
                    <MessageSquare className="w-10 h-10 text-[#DCD5C9] mb-2" />
                    <p className="font-serif font-bold text-sm text-[#153325]">Select an Inquiry</p>
                    <p className="text-xs mt-1 text-[#5A534E]">Choose a booking from the left list to review operator replies and upload receipts.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Complaints & Feedback Tab */}
          {activeTab === 'complaints' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* File a complaint Form */}
              <div className="lg:col-span-1 border border-[#E8DFC8] p-6 rounded-2xl bg-[#FAF7F2] h-fit">
                <div className="flex items-center gap-1.5 text-[#B88B2A] font-bold text-xs uppercase tracking-wider mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Official Grievance Desk
                </div>
                <h3 className="font-serif font-bold text-[#153325] text-base mb-4 border-b border-[#E8DFC8] pb-2">
                  Submit Feedback or Report
                </h3>
                
                <form onSubmit={handleSubmitComplaint} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#232120] mb-1">Target Municipality *</label>
                    <select
                      required
                      value={selectedMunId}
                      onChange={e => setSelectedMunId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DCD5C9] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                    >
                      <option value="">-- Select Municipality in Abra --</option>
                      {municipalities.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#232120] mb-1">Subject Title *</label>
                    <input
                      type="text"
                      required
                      value={complaintTitle}
                      onChange={e => setComplaintTitle(e.target.value)}
                      placeholder="e.g. Overcharged tour rates, trail safety..."
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DCD5C9] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#232120] mb-1">Detailed Explanation *</label>
                    <textarea
                      required
                      rows="4"
                      value={complaintDesc}
                      onChange={e => setComplaintDesc(e.target.value)}
                      placeholder="Specify dates, exact locations, and names of individuals/listings involved to assist municipal tourism officers..."
                      className="w-full px-3.5 py-2 bg-white border border-[#DCD5C9] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325] resize-none"
                    />
                  </div>

                  {complaintError && <p className="text-xs text-red-600 font-semibold">{complaintError}</p>}
                  {complaintSuccess && <p className="text-xs text-[#153325] font-semibold bg-[#153325]/10 border border-[#153325]/20 p-2.5 rounded-lg">{complaintSuccess}</p>}

                  <button
                    type="submit"
                    disabled={submittingComplaint}
                    className="w-full py-2.5 btn-editorial-primary text-xs tracking-wider cursor-pointer disabled:opacity-50"
                  >
                    {submittingComplaint ? 'Submitting...' : 'File Official Report'}
                  </button>
                </form>
              </div>

              {/* List of submitted complaints */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E8DFC8]">
                  <h2 className="font-serif font-bold text-[#153325] text-lg">My Submitted Reports ({complaints.length})</h2>
                  <span className="text-xs text-[#5A534E]">Filed directly with Municipal Tourism Desks</span>
                </div>

                {complaints.length === 0 ? (
                  <div className="text-center py-16 bg-[#FAF7F2] rounded-2xl border border-[#E8DFC8]">
                    <Megaphone className="w-10 h-10 mx-auto text-[#DCD5C9] mb-2" />
                    <h3 className="font-serif font-bold text-[#153325] text-sm">No reports filed</h3>
                    <p className="text-xs text-[#5A534E] mt-1 max-w-sm mx-auto">Thank you for helping keep Abra safe and welcoming for all travelers.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {complaints.map((complaint) => {
                      const isPending = complaint.status === 'PENDING';
                      return (
                        <div key={complaint.id} className="border border-[#E8DFC8] rounded-2xl p-5 bg-white">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${isPending ? 'bg-[#FAF7F2] text-[#B88B2A] border border-[#B88B2A]/30' : 'bg-[#153325]/10 text-[#153325] border border-[#153325]/30'}`}>
                              {complaint.status}
                            </span>
                            <span className="text-[10px] text-[#5A534E]">
                              Submitted on {new Date(complaint.created_at).toLocaleDateString('en-PH')}
                            </span>
                          </div>

                          <h4 className="font-serif font-bold text-[#153325] text-base mb-1">{complaint.title}</h4>
                          <div className="text-[10px] text-[#B88B2A] font-bold uppercase tracking-wider flex items-center gap-1 mb-2">
                            <MapPin className="w-3.5 h-3.5" /> {complaint.municipality_name} Municipality
                          </div>

                          <p className="text-xs text-[#5A534E] leading-relaxed bg-[#FAF7F2] border border-[#E8DFC8]/60 rounded-xl p-3">
                            {complaint.description}
                          </p>

                          {complaint.resolution_details ? (
                            <div className="mt-4 p-3.5 border border-[#153325]/20 bg-[#153325]/5 rounded-xl">
                              <div className="flex items-center gap-1.5 text-[#153325] font-bold text-xs mb-1">
                                <CheckCircle className="w-4 h-4" />
                                Official Municipal Resolution:
                              </div>
                              <p className="text-xs text-[#232120] font-medium">"{complaint.resolution_details}"</p>
                              {complaint.resolved_at && (
                                <div className="text-[9px] text-[#5A534E] mt-2 text-right">
                                  Resolved on {new Date(complaint.resolved_at).toLocaleDateString('en-PH')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#B88B2A] bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-[#E8DFC8] w-fit">
                              <Clock className="w-3.5 h-3.5" /> Awaiting review and action by {complaint.municipality_name} Tourism officers.
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
      </div>

      {/* Review Modal Form */}
      {reviewBookingId && (
        <div className="fixed inset-0 bg-[#232120]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-[#E8DFC8] max-w-md w-full relative animate-fadeIn">
            <h3 className="font-serif font-bold text-[#153325] text-lg mb-1">Leave a Review</h3>
            <p className="text-xs text-[#5A534E] mb-4">Share your feedback on <span className="font-bold text-[#153325]">{reviewTarget?.name}</span>.</p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#232120] mb-1.5">Rating (1 to 5 Stars)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star 
                        className={`w-7 h-7 ${star <= rating ? 'text-[#B88B2A] fill-[#B88B2A]' : 'text-[#DCD5C9]'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#232120] mb-1">Your Review & Remarks</label>
                <textarea
                  rows="3"
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Share details regarding guide punctuality, room comfort, hospitality, cultural accuracy..."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DCD5C9] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                />
              </div>

              {reviewError && <p className="text-xs text-red-600 font-semibold">{reviewError}</p>}
              {reviewSuccess && <p className="text-xs text-[#153325] font-semibold bg-[#153325]/10 border border-[#153325]/20 p-2 rounded">{reviewSuccess}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-editorial-primary text-xs px-4 py-2 flex-1 cursor-pointer"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => { setReviewBookingId(null); setReviewTarget(null); }}
                  className="btn-editorial-ghost text-xs px-4 py-2 cursor-pointer"
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
