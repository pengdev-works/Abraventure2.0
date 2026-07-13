import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, HelpCircle, Phone, Mail, Award, CheckCircle, Info, Landmark, Star, Map, MessageSquare, Upload, Image } from 'lucide-react';
import SafeImage from '../components/SafeImage';

// Leaflet Map Component (lazy-loaded to avoid SSR issues)
const AttractionMap = ({ attractions, homestays }) => {
  const [MapComponents, setMapComponents] = useState(null);

  useEffect(() => {
    // Dynamically import leaflet to avoid SSR issues
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
    ]).then(([rl, L]) => {
      // Fix default marker icons
      delete L.default.Icon.Default.prototype._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      setMapComponents({ MapContainer: rl.MapContainer, TileLayer: rl.TileLayer, Marker: rl.Marker, Popup: rl.Popup });
    }).catch(console.error);
  }, []);

  if (!MapComponents) return (
    <div className="flex items-center justify-center h-64 bg-slate-100 rounded-xl text-slate-400 text-sm">
      <div className="text-center">
        <Map className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p>Loading map...</p>
      </div>
    </div>
  );

  const { MapContainer, TileLayer, Marker, Popup } = MapComponents;

  const allPoints = [
    ...attractions.filter(a => a.latitude && a.longitude).map(a => ({ ...a, type: 'attraction' })),
    ...homestays.filter(h => h.latitude && h.longitude).map(h => ({ ...h, type: 'homestay' })),
  ];

  const center = allPoints.length > 0
    ? [parseFloat(allPoints[0].latitude), parseFloat(allPoints[0].longitude)]
    : [17.5946, 120.4551]; // Abra default center

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: '400px' }}>
      <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {allPoints.map((pt, i) => (
          <Marker key={i} position={[parseFloat(pt.latitude), parseFloat(pt.longitude)]}>
            <Popup>
              <div>
                <p className="font-bold text-sm">{pt.name}</p>
                <p className="text-xs text-slate-500">{pt.type === 'attraction' ? '🏞️ Attraction' : '🏠 Homestay'}</p>
                {pt.location_details && <p className="text-xs">{pt.location_details}</p>}
                {pt.address && <p className="text-xs">{pt.address}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

// Star Rating Component
const StarRating = ({ rating, onChange, size = 'w-6 h-6' }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(s => (
      <button
        key={s}
        type="button"
        onClick={() => onChange && onChange(s)}
        className={`${size} transition-colors ${onChange ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <Star className={`${size} ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
      </button>
    ))}
  </div>
);

const MunicipalityDetails = () => {
  const { id } = useParams();
  const { user, token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attractions');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Events state
  const [events, setEvents] = useState([]);

  // Reviews state
  const [reviews, setReviews] = useState({ homestays: {}, guides: {} });
  const [reviewTarget, setReviewTarget] = useState(null); // { type: 'HOMESTAY'|'GUIDE', id, name }
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const bannerImages = data?.municipality?.images && data.municipality.images.length > 0
    ? data.municipality.images.map((img) => img.image_url)
    : [data?.municipality?.featured_image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=90'];

  // Slideshow
  useEffect(() => {
    if (bannerImages.length <= 1) return;
    const interval = setInterval(() => setCurrentImageIndex(prev => (prev + 1) % bannerImages.length), 4500);
    return () => clearInterval(interval);
  }, [bannerImages]);

  // Booking/Inquiry Modal State
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryTarget, setInquiryTarget] = useState(null);
  const [inquiryDateStart, setInquiryDateStart] = useState('');
  const [inquiryDateEnd, setInquiryDateEnd] = useState('');
  const [inquiryGuests, setInquiryGuests] = useState('1');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState('');
  const [inquiryError, setInquiryError] = useState('');
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(`/api/municipalities/${id}`);
        if (response.ok) setData(await response.json());
      } catch (err) {
        console.error('Error fetching details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  // Fetch events for this municipality
  useEffect(() => {
    if (!id) return;
    fetch(`/api/events?municipalityId=${id}`)
      .then(r => r.ok ? r.json() : [])
      .then(setEvents)
      .catch(console.error);
  }, [id]);

  // Fetch reviews for all homestays and guides
  useEffect(() => {
    if (!data) return;
    const fetchReviews = async () => {
      const reviewMap = { homestays: {}, guides: {} };
      await Promise.all([
        ...data.homestays.map(async h => {
          const r = await fetch(`/api/reviews?homestayId=${h.id}`);
          if (r.ok) reviewMap.homestays[h.id] = await r.json();
        }),
        ...data.guides.map(async g => {
          const r = await fetch(`/api/reviews?guideId=${g.id}`);
          if (r.ok) reviewMap.guides[g.id] = await r.json();
        }),
      ]);
      setReviews(reviewMap);
    };
    fetchReviews();
  }, [data]);

  const openInquiry = (type, item) => {
    setInquiryTarget({ type, item });
    setShowInquiryModal(true);
    setInquirySuccess('');
    setInquiryError('');
    setInquiryMessage('');
    setInquiryDateStart('');
    setInquiryDateEnd('');
    setPaymentProofFile(null);
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setInquiryLoading(true);
    setInquiryError('');
    setInquirySuccess('');
    if (!token) { setInquiryError('You must be signed in to send booking inquiries.'); setInquiryLoading(false); return; }
    try {
      const formData = new FormData();
      formData.append('homestayId', inquiryTarget.type === 'HOMESTAY' ? inquiryTarget.item.id : '');
      formData.append('guideId', inquiryTarget.type === 'GUIDE' ? inquiryTarget.item.id : '');
      formData.append('startDate', inquiryDateStart || '');
      formData.append('endDate', inquiryDateEnd || '');
      formData.append('numberOfGuests', inquiryGuests);
      formData.append('message', inquiryMessage);
      if (paymentProofFile) formData.append('paymentProof', paymentProofFile);

      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const resJson = await response.json();
      if (response.ok) {
        setInquirySuccess('Inquiry sent successfully! The stakeholder will reply on your dashboard.');
        setTimeout(() => setShowInquiryModal(false), 3000);
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

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token || !reviewTarget) return;
    setReviewLoading(true);
    setReviewMsg('');
    try {
      const body = { rating: reviewRating, comment: reviewComment };
      if (reviewTarget.type === 'HOMESTAY') body.homestayId = reviewTarget.id;
      if (reviewTarget.type === 'GUIDE') body.guideId = reviewTarget.id;
      const r = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (r.ok) {
        setReviewMsg('Review submitted successfully!');
        setReviewTarget(null);
        setReviewRating(5);
        setReviewComment('');
        // Refresh reviews
        const refetch = await fetch(`/api/reviews?${reviewTarget.type === 'HOMESTAY' ? 'homestayId' : 'guideId'}=${reviewTarget.id}`);
        if (refetch.ok) {
          const updated = await refetch.json();
          setReviews(prev => ({
            ...prev,
            [reviewTarget.type === 'HOMESTAY' ? 'homestays' : 'guides']: {
              ...prev[reviewTarget.type === 'HOMESTAY' ? 'homestays' : 'guides'],
              [reviewTarget.id]: updated,
            },
          }));
        }
      } else {
        setReviewMsg(d.message || 'Failed to submit review.');
      }
    } catch (err) {
      setReviewMsg('Server error.');
    } finally {
      setReviewLoading(false);
    }
  };

  const avgRating = (revList) => {
    if (!revList || revList.length === 0) return 0;
    return revList.reduce((s, r) => s + r.rating, 0) / revList.length;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  if (loading) return (
    <div className="flex justify-center items-center py-24 min-h-[calc(100vh-16rem)]">
      <div className="w-12 h-12 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
      <p className="text-lg">Municipality not found.</p>
      <Link to="/municipalities" className="text-emerald-950 font-bold hover:underline mt-2 inline-block">Return to list</Link>
    </div>
  );

  const { municipality, attractions, homestays, guides, localDOT } = data;
  const mapAttractions = attractions || [];
  const mapHomestays = homestays || [];

  const TABS = [
    { id: 'attractions', label: `Attractions (${attractions.length})` },
    { id: 'homestays', label: `Homestays (${homestays.length})` },
    { id: 'guides', label: `Guides (${guides.length})` },
    { id: 'events', label: `Events (${events.length})` },
    { id: 'map', label: 'Interactive Map' },
    { id: 'gallery', label: 'Photo Gallery' },
    { id: 'reviews', label: 'Reviews' },
  ];

  return (
    <div>
      {/* Banner */}
      <div
        className="relative bg-cover bg-center h-80 flex items-end text-white transition-all duration-1000"
        style={{ backgroundImage: `linear-gradient(rgba(16, 24, 32, 0.4), rgba(16, 24, 32, 0.95)), url('${bannerImages[currentImageIndex]}')` }}
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
          <div className="flex space-x-6 overflow-x-auto whitespace-nowrap scrollbar-none">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-bold text-sm cursor-pointer transition-all flex-shrink-0 flex items-center gap-1.5 ${
                  activeTab === tab.id ? 'border-emerald-900 text-emerald-950' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.id === 'map' && <Map className="w-3.5 h-3.5" />}
                {tab.id === 'reviews' && <Star className="w-3.5 h-3.5" />}
                {tab.id === 'events' && <Calendar className="w-3.5 h-3.5" />}
                {tab.id === 'gallery' && <Image className="w-3.5 h-3.5" />}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-3">

            {/* Attractions Tab */}
            {activeTab === 'attractions' && (
              <div>
                {attractions.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
                    <Landmark className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-semibold text-lg">No attractions uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {attractions.map(a => (
                      <div key={a.id} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm flex flex-col">
                        <div className="h-48 bg-slate-100">
                          <img src={a.image_url || 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800'} alt={a.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-6 flex-grow flex flex-col justify-between">
                          <div>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-950 font-semibold text-xs tracking-wider uppercase mb-3 inline-block">{a.category || 'Sightseeing'}</span>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{a.name}</h3>
                            <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-4">{a.description}</p>
                          </div>
                          {a.location_details && (
                            <div className="text-xs text-slate-400 border-t border-slate-100 pt-3 flex items-start gap-1">
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
                    <Landmark className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-semibold text-lg">No accredited homestays yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {homestays.map(h => {
                      const revList = reviews.homestays[h.id] || [];
                      const avg = avgRating(revList);
                      return (
                        <div key={h.id} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm flex flex-col">
                          <div className="h-48 bg-slate-100 relative">
                              <SafeImage src={h.images && h.images.length > 0 ? h.images[0].image_url : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'} alt={h.name} className="w-full h-full object-cover" fallback="landscape" />
                            <div className="absolute top-3 right-3 bg-emerald-900 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-amber-400" /> Verified
                            </div>
                          </div>
                          <div className="p-6 flex-grow flex flex-col justify-between">
                            <div>
                              <h3 className="text-xl font-bold text-slate-800 mb-1">{h.name}</h3>
                              <p className="text-xs text-slate-400 mb-2 flex items-center gap-0.5"><MapPin className="w-3.5 h-3.5" /> {h.address}</p>
                              {/* Rating */}
                              <div className="flex items-center gap-1.5 mb-3">
                                <div className="flex gap-0.5">{[1,2,3,4,5].map(s=><Star key={s} className={`w-3.5 h-3.5 ${s<=Math.round(avg)?'fill-amber-400 text-amber-400':'text-slate-200'}`}/>)}</div>
                                <span className="text-xs text-slate-500">{avg > 0 ? avg.toFixed(1) : 'No reviews'} ({revList.length})</span>
                              </div>
                              <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-3">{h.description}</p>
                            </div>
                            <div className="border-t border-slate-100 pt-4 mt-2 flex flex-col gap-2">
                              <button onClick={() => openInquiry('HOMESTAY', h)} className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-bold rounded-xl transition-all">
                                Book / Send Inquiry
                              </button>
                              {user?.role === 'TOURIST' && (
                                <button
                                  onClick={() => setReviewTarget({ type: 'HOMESTAY', id: h.id, name: h.name })}
                                  className="w-full py-2 border border-amber-300 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-50 transition-all"
                                >
                                  <Star className="w-3.5 h-3.5 inline mr-1" /> Write a Review
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Guides Tab */}
            {activeTab === 'guides' && (
              <div>
                {guides.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
                    <Landmark className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-semibold text-lg">No accredited tour guides yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {guides.map(g => {
                      const revList = reviews.guides[g.id] || [];
                      const avg = avgRating(revList);
                      return (
                        <div key={g.id} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm flex flex-col">
                          <div className="p-6 flex-grow flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-100 bg-slate-100 flex-shrink-0">
                                   <SafeImage src={g.profile_picture_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'} alt={g.guide_name} className="w-full h-full object-cover" fallback="square" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-1.5">
                                    {g.guide_name}
                                    <span className="bg-emerald-50 text-emerald-950 p-0.5 rounded-full" title="Accredited Guide"><Award className="w-4 h-4 text-emerald-800" /></span>
                                  </h3>
                                  <p className="text-xs text-slate-400">Languages: {g.languages_spoken}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    {[1,2,3,4,5].map(s=><Star key={s} className={`w-3 h-3 ${s<=Math.round(avg)?'fill-amber-400 text-amber-400':'text-slate-200'}`}/>)}
                                    <span className="text-xs text-slate-500 ml-1">{avg > 0 ? avg.toFixed(1) : 'No reviews'} ({revList.length})</span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-slate-500 text-xs leading-relaxed mb-4">{g.bio}</p>
                              <div className="space-y-1.5 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <p><strong className="text-slate-700">Services:</strong> {g.services_offered}</p>
                                <p><strong className="text-slate-700">Covers:</strong> {g.areas_covered}</p>
                                {g.price_rate && <p className="text-emerald-950 font-bold">Rate: ₱{parseFloat(g.price_rate).toLocaleString()} / day</p>}
                              </div>
                            </div>
                            <div className="border-t border-slate-100 pt-4 mt-6 flex flex-col gap-2">
                              <button onClick={() => openInquiry('GUIDE', g)} className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-bold rounded-xl transition-all">
                                Hire / Inquire Guide
                              </button>
                              {user?.role === 'TOURIST' && (
                                <button
                                  onClick={() => setReviewTarget({ type: 'GUIDE', id: g.id, name: g.guide_name })}
                                  className="w-full py-2 border border-amber-300 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-50 transition-all"
                                >
                                  <Star className="w-3.5 h-3.5 inline mr-1" /> Write a Review
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div>
                {events.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-semibold text-slate-500">No events posted for this municipality yet.</p>
                    <Link to="/events" className="text-emerald-900 font-bold text-sm hover:underline mt-2 inline-block">Browse all Abra events →</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {events.map(ev => (
                      <div key={ev.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {ev.image_url && <img src={ev.image_url} alt={ev.title} className="w-full h-36 object-cover" />}
                        <div className="p-5">
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{ev.category}</span>
                          <h3 className="font-extrabold text-slate-800 text-base mt-2 mb-1">{ev.title}</h3>
                          <p className="text-slate-500 text-xs mb-3 line-clamp-2">{ev.description}</p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(ev.start_date)}{ev.end_date && ` – ${formatDate(ev.end_date)}`}
                          </div>
                          {ev.venue && <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1"><MapPin className="w-3.5 h-3.5" /> {ev.venue}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Gallery Tab */}
            {activeTab === 'gallery' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Municipality Media Gallery</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Photos uploaded by local DOT and verified accounts</p>
                  </div>
                  <Link
                    to={`/municipalities/${id}/gallery`}
                    className="text-xs text-emerald-700 font-bold hover:underline bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100/60"
                  >
                    View Fullscreen Gallery →
                  </Link>
                </div>
                {bannerImages.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
                    <Image className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-semibold text-lg">No photos uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {bannerImages.map((img, idx) => (
                      <div key={idx} className="aspect-square bg-slate-100 rounded-xl overflow-hidden shadow-sm border border-slate-100 relative group">
                        <img src={img} alt="Gallery view" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Link
                            to={`/municipalities/${id}/gallery`}
                            className="text-white text-xs font-bold bg-emerald-950 px-3.5 py-1.5 rounded-full hover:bg-emerald-900 transition-all shadow-md"
                          >
                            Enlarge
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Map Tab */}
            {activeTab === 'map' && (
              <div>
                <div className="mb-4 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded-full inline-block" /> Attractions</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-full inline-block" /> Homestays</span>
                </div>
                <AttractionMap attractions={mapAttractions} homestays={mapHomestays} />
                {mapAttractions.filter(a => !a.latitude).length > 0 && (
                  <p className="text-xs text-slate-400 mt-3 text-center">Some locations are not yet mapped. The Municipal DOT will update coordinates soon.</p>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-8">
                {/* Homestay Reviews */}
                {homestays.map(h => {
                  const revList = reviews.homestays[h.id] || [];
                  const avg = avgRating(revList);
                  return (
                    <div key={h.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">🏠 Homestay</p>
                          <h3 className="font-extrabold text-slate-800">{h.name}</h3>
                        </div>
                        <div className="text-right">
                          <div className="flex justify-end gap-0.5 mb-1">
                            {[1,2,3,4,5].map(s=><Star key={s} className={`w-4 h-4 ${s<=Math.round(avg)?'fill-amber-400 text-amber-400':'text-slate-200'}`}/>)}
                          </div>
                          <span className="text-xs text-slate-500">{avg > 0 ? avg.toFixed(1) : 'No ratings'} · {revList.length} reviews</span>
                        </div>
                      </div>
                      {revList.length === 0 ? (
                        <p className="text-slate-400 text-xs text-center py-4">No reviews yet. Be the first to review!</p>
                      ) : (
                        <div className="space-y-4">
                          {revList.map(rev => (
                            <div key={rev.id} className="border-b border-slate-50 pb-4">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-slate-800 text-sm">{rev.reviewer_name || 'Anonymous'}</p>
                                <div className="flex gap-0.5">{[1,2,3,4,5].map(s=><Star key={s} className={`w-3.5 h-3.5 ${s<=rev.rating?'fill-amber-400 text-amber-400':'text-slate-200'}`}/>)}</div>
                              </div>
                              {rev.comment && <p className="text-slate-500 text-xs leading-relaxed">{rev.comment}</p>}
                              <p className="text-slate-300 text-[10px] mt-1">{formatDate(rev.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Guide Reviews */}
                {guides.map(g => {
                  const revList = reviews.guides[g.id] || [];
                  const avg = avgRating(revList);
                  return (
                    <div key={g.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">🎒 Tour Guide</p>
                          <h3 className="font-extrabold text-slate-800">{g.guide_name}</h3>
                        </div>
                        <div className="text-right">
                          <div className="flex justify-end gap-0.5 mb-1">
                            {[1,2,3,4,5].map(s=><Star key={s} className={`w-4 h-4 ${s<=Math.round(avg)?'fill-amber-400 text-amber-400':'text-slate-200'}`}/>)}
                          </div>
                          <span className="text-xs text-slate-500">{avg > 0 ? avg.toFixed(1) : 'No ratings'} · {revList.length} reviews</span>
                        </div>
                      </div>
                      {revList.length === 0 ? (
                        <p className="text-slate-400 text-xs text-center py-4">No reviews yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {revList.map(rev => (
                            <div key={rev.id} className="border-b border-slate-50 pb-4">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-slate-800 text-sm">{rev.reviewer_name || 'Anonymous'}</p>
                                <div className="flex gap-0.5">{[1,2,3,4,5].map(s=><Star key={s} className={`w-3.5 h-3.5 ${s<=rev.rating?'fill-amber-400 text-amber-400':'text-slate-200'}`}/>)}</div>
                              </div>
                              {rev.comment && <p className="text-slate-500 text-xs leading-relaxed">{rev.comment}</p>}
                              <p className="text-slate-300 text-[10px] mt-1">{formatDate(rev.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!user && (
                  <div className="text-center py-6 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-sm text-amber-800"><Link to="/login" className="font-bold underline">Sign in</Link> as a tourist to write a review.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {localDOT ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col items-center text-center self-start sticky top-24">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs tracking-wider uppercase mb-4">
                  <Award className="w-4 h-4 text-amber-500" /> Tourism Office
                </div>
                <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-100 mb-3 bg-slate-100 shadow-inner flex-shrink-0">
                  <img src={localDOT.profile_picture_url || municipality.featured_image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'} alt={localDOT.officer_name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm leading-tight">{localDOT.officer_name}</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{localDOT.designation || 'Tourism Officer'}</p>
                <div className="w-full border-t border-slate-100 my-4 pt-4 text-left space-y-2.5 text-xs text-slate-500">
                  <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" /><span>{localDOT.office_address || 'Municipal Hall'}</span></div>
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400 flex-shrink-0" /><a href={`mailto:${localDOT.officer_email}`} className="hover:underline truncate text-emerald-950 font-medium">{localDOT.officer_email}</a></div>
                  {localDOT.officer_phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400 flex-shrink-0" /><span>{localDOT.officer_phone}</span></div>}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm text-center text-xs text-slate-400 py-10 sticky top-24">
                <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold">Tourism Office</p>
                <p className="mt-1 text-[11px]">No active Tourism Officer registered yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800">Rate & Review</h3>
              <button onClick={() => setReviewTarget(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <p className="text-xs text-slate-500 mb-4">{reviewTarget.name}</p>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Your Rating</label>
                <StarRating rating={reviewRating} onChange={setReviewRating} size="w-8 h-8" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Comment (optional)</label>
                <textarea
                  rows="3"
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-900/30"
                />
              </div>
              {reviewMsg && <p className={`text-xs ${reviewMsg.includes('success') ? 'text-emerald-700' : 'text-red-600'}`}>{reviewMsg}</p>}
              <button type="submit" disabled={reviewLoading} className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50">
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 relative animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-900 to-amber-500" />
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Send Booking Inquiry</h3>
                <p className="text-xs text-slate-400">To: {inquiryTarget.type === 'HOMESTAY' ? inquiryTarget.item.name : inquiryTarget.item.guide_name}</p>
              </div>
              <button onClick={() => setShowInquiryModal(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg text-lg">✕</button>
            </div>
            <form onSubmit={handleInquirySubmit} className="p-6 space-y-4">
              {inquiryError && <div className="flex items-center gap-1.5 bg-red-50 text-red-600 p-3 rounded-lg text-xs border border-red-200"><Info className="w-4 h-4" /><span>{inquiryError}</span></div>}
              {inquirySuccess && <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 p-3 rounded-lg text-xs border border-emerald-200"><CheckCircle className="w-4 h-4" /><span>{inquirySuccess}</span></div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input type="date" required value={inquiryDateStart} onChange={e => setInquiryDateStart(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input type="date" value={inquiryDateEnd} onChange={e => setInquiryDateEnd(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Guests</label>
                <input type="number" min="1" required value={inquiryGuests} onChange={e => setInquiryGuests(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
                <textarea required rows="3" value={inquiryMessage} onChange={e => setInquiryMessage(e.target.value)} placeholder="Ask about details, rooms, pricing, GCash number..." className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs" />
              </div>
              {/* Payment Proof Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <Upload className="w-3.5 h-3.5 inline mr-1" /> Payment Proof (optional)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => setPaymentProofFile(e.target.files[0])}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50"
                />
                <p className="text-[10px] text-slate-400 mt-1">Upload GCash screenshot or bank transfer receipt if you've already paid.</p>
              </div>
              {!token && (
                <div className="text-center text-xs text-slate-400 border border-slate-100 p-2 rounded-lg bg-amber-50/50">
                  <Link to="/login" className="text-emerald-950 font-bold hover:underline">Sign In</Link> to contact this provider.
                </div>
              )}
              <button type="submit" disabled={inquiryLoading || !token} className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
                {inquiryLoading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Send Inquiry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MunicipalityDetails;
