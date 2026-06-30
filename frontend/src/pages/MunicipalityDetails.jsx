import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, HelpCircle, Phone, Mail, Award, CheckCircle, Info, Landmark } from 'lucide-react';

const MunicipalityDetails = () => {
  const { id } = useParams();
  const { user, token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attractions');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const bannerImages = data?.municipality?.images && data.municipality.images.length > 0
    ? data.municipality.images.map((img) => img.image_url)
    : [data?.municipality?.featured_image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=90'];

  // Slideshow interval
  useEffect(() => {
    if (bannerImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % bannerImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [bannerImages]);

  // Booking/Inquiry Modal State
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryTarget, setInquiryTarget] = useState(null); // { type: 'HOMESTAY'|'GUIDE', item: object }
  const [inquiryDateStart, setInquiryDateStart] = useState('');
  const [inquiryDateEnd, setInquiryDateEnd] = useState('');
  const [inquiryGuests, setInquiryGuests] = useState('1');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState('');
  const [inquiryError, setInquiryError] = useState('');
  const [inquiryLoading, setInquiryLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(`/api/municipalities/${id}`);
        if (response.ok) {
          const resData = await response.json();
          setData(resData);
        }
      } catch (err) {
        console.error('Error fetching details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const openInquiry = (type, item) => {
    setInquiryTarget({ type, item });
    setShowInquiryModal(true);
    setInquirySuccess('');
    setInquiryError('');
    setInquiryMessage('');
    setInquiryDateStart('');
    setInquiryDateEnd('');
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setInquiryLoading(true);
    setInquiryError('');
    setInquirySuccess('');

    if (!token) {
      setInquiryError('You must be signed in to send booking inquiries.');
      setInquiryLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          homestayId: inquiryTarget.type === 'HOMESTAY' ? inquiryTarget.item.id : null,
          guideId: inquiryTarget.type === 'GUIDE' ? inquiryTarget.item.id : null,
          startDate: inquiryDateStart || null,
          endDate: inquiryDateEnd || null,
          numberOfGuests: parseInt(inquiryGuests),
          message: inquiryMessage,
        })
      });

      const resJson = await response.json();
      if (response.ok) {
        setInquirySuccess('Inquiry sent successfully! The stakeholder will reply on your dashboard.');
        setTimeout(() => {
          setShowInquiryModal(false);
        }, 3000);
      } else {
        setInquiryError(resJson.message || 'Failed to send inquiry.');
      }
    } catch (err) {
      console.error(err);
      setInquiryError('Server error sending inquiry.');
    } finally {
      setInquiryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 min-h-[calc(100vh-16rem)]">
        <div className="w-12 h-12 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <p className="text-lg">Municipality not found.</p>
        <Link to="/municipalities" className="text-emerald-950 font-bold hover:underline mt-2 inline-block">
          Return to list
        </Link>
      </div>
    );
  }

  const { municipality, attractions, homestays, guides, localDOT } = data;

  return (
    <div>
      {/* Banner */}
      <div
        className="relative bg-cover bg-center h-80 flex items-end text-white transition-all duration-1000"
        style={{
          backgroundImage: `linear-gradient(rgba(16, 24, 32, 0.4), rgba(16, 24, 32, 0.95)), url('${bannerImages[currentImageIndex]}')`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-10">
          <div className="flex items-center gap-2 mb-2 text-amber-500 text-sm font-semibold tracking-wider uppercase">
            <Landmark className="w-4 h-4" /> Municipality Profile
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-wide mb-3">{municipality.name}</h1>
          <p className="text-slate-200 text-sm md:text-base max-w-3xl leading-relaxed font-light">
            {municipality.description || 'Welcome to Abra province.'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'attractions', label: `Attractions (${attractions.length})` },
              { id: 'homestays', label: `Homestays (${homestays.length})` },
              { id: 'guides', label: `Accredited Guides (${guides.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-bold text-sm cursor-pointer transition-all ${activeTab === tab.id
                    ? 'border-emerald-900 text-emerald-950'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left/Main Column */}
          <div className="lg:col-span-3">

            {/* Attractions Tab */}
            {activeTab === 'attractions' && (
              <div>
                {attractions.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
                    <Landmark className="w-12 h-12 mx-auto text-slate-355 mb-3" />
                    <p className="font-semibold text-lg">No attractions uploaded yet.</p>
                    <p className="text-sm mt-1">Local Municipal DOT will configure points of interest soon.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {attractions.map((a) => (
                      <div key={a.id} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm flex flex-col justify-between">
                        <div className="h-48 bg-slate-100">
                          <img
                            src={a.image_url || 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800'}
                            alt={a.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-6 flex-grow flex flex-col justify-between">
                          <div>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-950 font-semibold text-xs tracking-wider uppercase mb-3 inline-block">
                              {a.category || 'Sightseeing'}
                            </span>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{a.name}</h3>
                            <p className="text-slate-505 text-xs leading-relaxed mb-4 line-clamp-4">{a.description}</p>
                          </div>
                          {a.location_details && (
                            <div className="text-xs text-slate-455 border-t border-slate-100 pt-3 flex items-start gap-1">
                              <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                              <span>{a.location_details}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Homestays Tab */}
            {activeTab === 'homestays' && (
              <div>
                {homestays.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
                    <Landmark className="w-12 h-12 mx-auto text-slate-355 mb-3" />
                    <p className="font-semibold text-lg">No accredited homestays yet.</p>
                    <p className="text-sm mt-1">Homestays in this municipality are pending verification or accreditation.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {homestays.map((h) => (
                      <div key={h.id} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm flex flex-col justify-between">
                        <div className="h-48 bg-slate-100 relative">
                          <img
                            src={h.images && h.images.length > 0 ? h.images[0].image_url : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
                            alt={h.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 right-3 bg-emerald-900 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>Verified</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex-grow flex flex-col justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-slate-800 mb-1">{h.name}</h3>
                            <p className="text-xs text-slate-400 mb-3 flex items-center gap-0.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {h.address}
                            </p>
                            <p className="text-slate-505 text-xs leading-relaxed mb-4 line-clamp-3">{h.description}</p>
                          </div>

                          <div className="border-t border-slate-100 pt-4 mt-2">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-xs font-semibold text-slate-455 uppercase">Contact Owner</span>
                              <div className="text-right">
                                <span className="text-xs text-slate-400">{h.contact_phone}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => openInquiry('HOMESTAY', h)}
                              className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer text-center"
                            >
                              Book / Send Inquiry
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Guides Tab */}
            {activeTab === 'guides' && (
              <div>
                {guides.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
                    <Landmark className="w-12 h-12 mx-auto text-slate-355 mb-3" />
                    <p className="font-semibold text-lg">No accredited tour guides yet.</p>
                    <p className="text-sm mt-1">Tour guides in this municipality are pending municipal evaluation.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {guides.map((g) => (
                      <div key={g.id} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm flex flex-col justify-between">
                        <div className="p-6 flex-grow flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-100 bg-slate-100 flex-shrink-0">
                                <img
                                  src={g.profile_picture_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                                  alt={g.guide_name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-1.5">
                                  {g.guide_name}
                                  <span className="bg-emerald-50 text-emerald-950 p-0.5 rounded-full" title="Accredited Guide">
                                    <Award className="w-4 h-4 text-emerald-800" />
                                  </span>
                                </h3>
                                <p className="text-xs text-slate-400">Languages: {g.languages_spoken}</p>
                              </div>
                            </div>

                            <p className="text-slate-505 text-xs leading-relaxed mb-4">{g.bio}</p>

                            <div className="space-y-1.5 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <p><strong className="text-slate-700">Services:</strong> {g.services_offered}</p>
                              <p><strong className="text-slate-700">Covers:</strong> {g.areas_covered}</p>
                              {g.price_rate && (
                                <p className="text-emerald-950 font-bold">Rate: ₱{parseFloat(g.price_rate).toLocaleString()} / day</p>
                              )}
                            </div>
                          </div>

                          {/* Action */}
                          <div className="border-t border-slate-100 pt-4 mt-6">
                            <button
                              onClick={() => openInquiry('GUIDE', g)}
                              className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer text-center"
                            >
                              Hire / Inquire Guide
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column (Local DOT Profile Sidebar) */}
          <div className="lg:col-span-1">
            {localDOT ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col items-center text-center self-start sticky top-24">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs tracking-wider uppercase mb-4">
                  <Award className="w-4 h-4 text-amber-500 fill-amber-500/10" />
                  <span>Tourism Office</span>
                </div>

                <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-100 mb-3 bg-slate-100 shadow-inner flex-shrink-0">
                  <img
                    src={localDOT.profile_picture_url || municipality.featured_image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=60'}
                    alt={localDOT.officer_name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h3 className="font-bold text-slate-805 text-sm leading-tight">{localDOT.officer_name}</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{localDOT.designation || 'Tourism Officer'}</p>

                <div className="w-full border-t border-slate-100 my-4 pt-4 text-left space-y-2.5 text-xs text-slate-500">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span className="leading-snug">{localDOT.office_address || 'Municipal Hall'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <a href={`mailto:${localDOT.officer_email}`} className="hover:underline truncate text-emerald-950 font-medium">{localDOT.officer_email}</a>
                  </div>
                  {localDOT.officer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>{localDOT.officer_phone}</span>
                    </div>
                  )}
                </div>
                <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-450 text-left mt-2 leading-relaxed">
                  <strong>Need help?</strong> Contact the local tourism desk for accreditation validation or itinerary assistance.
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm text-center self-start text-xs text-slate-400 py-10 sticky top-24">
                <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold">Tourism Office</p>
                <p className="mt-1 text-[11px]">No active Tourism Officer registered for this municipality yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 relative animate-scaleUp">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-900 to-amber-500"></div>

            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Send Booking Inquiry</h3>
                <p className="text-xs text-slate-400">To: {inquiryTarget.type === 'HOMESTAY' ? inquiryTarget.item.name : inquiryTarget.item.guide_name}</p>
              </div>
              <button
                onClick={() => setShowInquiryModal(false)}
                className="text-slate-400 hover:text-slate-600 font-semibold p-1 hover:bg-slate-50 rounded-lg text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInquirySubmit} className="p-6 space-y-4">
              {inquiryError && (
                <div className="flex items-center gap-1.5 bg-red-50 text-red-650 p-3 rounded-lg text-xs border border-red-200">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <span>{inquiryError}</span>
                </div>
              )}

              {inquirySuccess && (
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-850 p-3 rounded-lg text-xs border border-emerald-250">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-700" />
                  <span>{inquirySuccess}</span>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date / Tour Date</label>
                  <input
                    type="date"
                    required
                    value={inquiryDateStart}
                    onChange={(e) => setInquiryDateStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date (optional)</label>
                  <input
                    type="date"
                    value={inquiryDateEnd}
                    onChange={(e) => setInquiryDateEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-900"
                  />
                </div>
              </div>

              {/* Guest Count */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Guests</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={inquiryGuests}
                  onChange={(e) => setInquiryGuests(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message to Provider</label>
                <textarea
                  required
                  rows="3"
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none"
                  placeholder="Ask about details, specific rooms, pricing options, GCash details, or guide itineraries..."
                ></textarea>
              </div>

              {!token && (
                <div className="text-center text-xs text-slate-450 border border-slate-100 p-2 rounded-lg bg-amber-50/50">
                  You are not logged in. Please{' '}
                  <Link to="/login" className="text-emerald-950 font-bold hover:underline">
                    Sign In
                  </Link>{' '}
                  to contact this provider.
                </div>
              )}

              <button
                type="submit"
                disabled={inquiryLoading || !token}
                className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {inquiryLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'Send Inquiry'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MunicipalityDetails;
