import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Calendar, HelpCircle, Phone, Mail, Award, CheckCircle, Info, Landmark, Star, MessageSquare, Upload, Image, Home, BedDouble, Users, Package, Sparkles, Send, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import SafeImage, { formatMediaUrl } from '../../components/common/SafeImage';

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

  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attractions');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Tour Packages state
  const [packages, setPackages] = useState([]);
  const [expandedPkgId, setExpandedPkgId] = useState(null);
  const [packageDetails, setPackageDetails] = useState({});
  const [importingPkgId, setImportingPkgId] = useState(null);

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
  const [bookedDates, setBookedDates] = useState([]); // confirmed booked ranges

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
  }, [id]);

  // Fetch packages for this municipality
  useEffect(() => {
    if (!id) return;
    fetch(`/api/packages?municipalityId=${id}`)
      .then(r => r.ok ? r.json() : [])
      .then(setPackages)
      .catch(console.error);
  }, [id]);

  const toggleExpandPackage = async (pkgId) => {
    if (expandedPkgId === pkgId) {
      setExpandedPkgId(null);
      return;
    }
    setExpandedPkgId(pkgId);
    if (!packageDetails[pkgId]) {
      try {
        const res = await fetch(`/api/packages/${pkgId}`);
        if (res.ok) {
          const det = await res.json();
          setPackageDetails(prev => ({ ...prev, [pkgId]: det.items }));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleImportPackage = async (pkgId) => {
    if (!token) {
      alert('Please sign in as a tourist to save this package into your itinerary planner.');
      navigate('/login');
      return;
    }
    setImportingPkgId(pkgId);
    try {
      const res = await fetch(`/api/packages/${pkgId}/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/itinerary');
      } else {
        alert(data.message || 'Failed to import package.');
      }
    } catch (err) {
      console.error('Error importing package:', err);
      alert('Error importing package to itinerary.');
    } finally {
      setImportingPkgId(null);
    }
  };

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
    setBookedDates([]);
    // Fetch booked dates for this homestay/guide
    const param = type === 'HOMESTAY' ? `homestayId=${item.id}` : `guideId=${item.id}`;
    fetch(`/api/inquiries/booked-dates?${param}`)
      .then(r => r.ok ? r.json() : [])
      .then(setBookedDates)
      .catch(console.error);
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

  const TABS = [
    { id: 'packages', label: `Tour Packages (${packages.length})` },
    { id: 'attractions', label: `Attractions (${attractions.length})` },
    { id: 'homestays', label: `Homestays (${homestays.length})` },
    { id: 'guides', label: `Guides (${guides.length})` },
    { id: 'events', label: `Events (${events.length})` },
    { id: 'gallery', label: 'Photo Gallery' },
    { id: 'reviews', label: 'Reviews' },
  ];

  return (
    <div>
      {/* Banner */}
      <div
        className="relative bg-cover bg-center min-h-[380px] flex items-end text-white transition-all duration-1000 overflow-hidden bg-[#153325]"
        style={{ backgroundImage: `linear-gradient(to top, rgba(21,51,37,0.95) 0%, rgba(21,51,37,0.4) 60%, rgba(21,51,37,0.7) 100%), url('${bannerImages[currentImageIndex]}')` }}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12 pt-24">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4A942]">
              Province of Abra · Cordillera
            </span>
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-white mb-3">
            {municipality.name}
          </h1>
          <p className="text-white/85 text-sm sm:text-base max-w-3xl leading-relaxed font-normal">
            {municipality.description || 'Discover pristine natural wonder, rich Itneg weaving heritage, and accredited homestays in Abra.'}
          </p>
        </div>
      </div>

      {/* Sticky Tabs Bar */}
      <div className="border-b border-[#E8DFC8] bg-[#FAF7F2]/95 backdrop-blur-md sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 overflow-x-auto whitespace-nowrap scrollbar-none">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-bold text-xs tracking-wider uppercase cursor-pointer transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-[#153325] text-[#153325]'
                    : 'border-transparent text-[#5A534E] hover:text-[#153325]'
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
          {/* Main Column */}
          <div className="lg:col-span-3">

            {/* Tour Packages Tab */}
            {activeTab === 'packages' && (
              <div>
                <div className="bg-[#F3ECE0] border border-[#E8DFC8] p-4 rounded-md mb-8 text-xs text-[#5A534E]">
                  <p className="font-semibold text-[#153325] mb-1">Official Municipal Tour Packages</p>
                  Curated itineraries authorized by the Municipal Tourism Desk. You can book a package directly or import it into your personal trip planner.
                </div>

                {packages.length === 0 ? (
                  <div className="text-center py-16 text-[#5A534E] bg-[#F3ECE0] rounded-md border border-[#E8DFC8] p-8">
                    <p className="font-serif text-lg font-bold text-[#153325] mb-1">No tour packages listed yet.</p>
                    <p className="text-xs">Explore attractions, homestays, and local guides below.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {packages.map(pkg => {
                      const isExpanded = expandedPkgId === pkg.id;
                      const items = packageDetails[pkg.id] || [];

                      return (
                        <div key={pkg.id} className="bg-white rounded-lg border border-[#E8DFC8] overflow-hidden flex flex-col justify-between">
                          <div>
                            {/* Package Header Image */}
                            <div className="img-editorial-wrapper aspect-[16/10] bg-[#153325] relative">
                              <SafeImage
                                src={pkg.image_url || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'}
                                alt={pkg.title}
                                className="img-editorial w-full h-full object-cover"
                              />
                              <div className="absolute top-3 left-3">
                                <span className="bg-[#153325]/90 text-[#FAF7F2] font-bold text-[11px] px-2.5 py-1 rounded">
                                  ₱{parseFloat(pkg.price).toLocaleString()} / person
                                </span>
                              </div>
                              <div className="absolute top-3 right-3">
                                <span className="bg-[#B88B2A] text-white font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded">
                                  {pkg.duration_days} Day{pkg.duration_days > 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>

                            {/* Body details */}
                            <div className="p-5 space-y-3">
                              <h3 className="font-serif text-xl font-bold text-[#153325] leading-snug line-clamp-1">{pkg.title}</h3>
                              {pkg.description && (
                                <p className="text-[#5A534E] text-xs leading-relaxed line-clamp-3">{pkg.description}</p>
                              )}

                              {pkg.inclusions && (
                                <div className="bg-[#F3ECE0] p-3 rounded-md border border-[#E8DFC8]">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#153325] block mb-0.5">Inclusions</span>
                                  <p className="text-xs text-[#5A534E]">{pkg.inclusions}</p>
                                </div>
                              )}

                              {/* Expandable Day Schedule */}
                              <div className="border-t border-[#E8DFC8] pt-3">
                                <button
                                  onClick={() => toggleExpandPackage(pkg.id)}
                                  className="w-full flex justify-between items-center text-xs font-bold text-[#153325] py-1 cursor-pointer"
                                >
                                  <span>{isExpanded ? 'Hide Schedule' : `View Daily Stops (${pkg.item_count || 0})`}</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>

                                {isExpanded && (
                                  <div className="mt-3 space-y-2 text-xs bg-[#FAF7F2] p-3 rounded border border-[#E8DFC8]">
                                    {items.length === 0 ? (
                                      <p className="text-[#5A534E] italic text-[11px]">Loading stops...</p>
                                    ) : (
                                      items.map((pi, idx) => (
                                        <div key={idx} className="flex items-start gap-2 border-b border-[#E8DFC8]/60 pb-2 last:border-0 last:pb-0">
                                          <span className="bg-[#153325] text-white font-bold text-[10px] px-1.5 py-0.5 rounded flex-shrink-0">
                                            Day {pi.day_number}
                                          </span>
                                          <div>
                                            <p className="font-bold text-[#153325] text-xs">
                                              {pi.activity_type === 'ATTRACTION' && pi.attraction_name}
                                              {pi.activity_type === 'HOMESTAY' && pi.homestay_name}
                                              {pi.activity_type === 'GUIDE' && `Guided: ${pi.guide_name}`}
                                              {pi.activity_type === 'CUSTOM' && pi.custom_activity_name}
                                            </p>
                                            {pi.notes && <p className="text-[11px] text-[#5A534E] italic">{pi.notes}</p>}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => openInquiry('PACKAGE', { id: pkg.id, name: pkg.title, price: pkg.price })}
                              className="flex-1 py-2 px-3 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" /> Book Package
                            </button>

                            <button
                              onClick={() => handleImportPackage(pkg.id)}
                              disabled={importingPkgId === pkg.id}
                              className="btn-editorial-primary w-full !py-2.5 text-xs font-semibold"
                            >
                              {importingPkgId === pkg.id ? (
                                <span>Importing...</span>
                              ) : (
                                <span>Save to My Itinerary</span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Attractions Tab */}
            {activeTab === 'attractions' && (
              <div>
                {attractions.length === 0 ? (
                  <div className="text-center py-16 text-[#5A534E] bg-[#F3ECE0] rounded-md border border-[#E8DFC8] p-8">
                    <p className="font-serif text-lg font-bold text-[#153325] mb-1">No attractions listed yet.</p>
                    <p className="text-xs">Attractions will appear once endorsed by the municipal desk.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {attractions.map(a => (
                      <div key={a.id} className="bg-white rounded-lg border border-[#E8DFC8] overflow-hidden flex flex-col justify-between">
                        <div>
                          <div className="img-editorial-wrapper aspect-[16/10] bg-[#153325]">
                            <SafeImage src={a.image_url} alt={a.name} className="img-editorial w-full h-full object-cover" fallback="landscape" />
                          </div>
                          <div className="p-6">
                            <span className="editorial-tag mb-3 inline-block">{a.category || 'Natural Landmark'}</span>
                            <h3 className="font-serif text-2xl font-bold text-[#153325] mb-2">{a.name}</h3>
                            <p className="text-[#5A534E] text-xs leading-relaxed mb-4">{a.description}</p>
                            {a.video_url && (
                              <div className="mb-4">
                                <video
                                  src={formatMediaUrl(a.video_url)}
                                  controls
                                  className="w-full max-h-52 object-cover rounded-md border border-[#E8DFC8] bg-black"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        {a.location_details && (
                          <div className="text-xs text-[#5A534E] border-t border-[#E8DFC8] px-6 py-3 bg-[#FAF7F2] flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#B88B2A]" />
                            <span>{a.location_details}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Homestays Tab */}
            {activeTab === 'homestays' && (
              <div>
                <p className="text-xs text-[#5A534E] mb-6 p-4 bg-[#F3ECE0] rounded-md border border-[#E8DFC8]">
                  Verified homestays in {municipality.name} comply with Municipal and Provincial DOT standards. Experience authentic Abra hospitality and home-cooked regional meals.
                </p>
                {homestays.length === 0 ? (
                  <div className="text-center py-16 text-[#5A534E] bg-[#F3ECE0] rounded-md border border-[#E8DFC8] p-8">
                    <p className="font-serif text-lg font-bold text-[#153325] mb-1">No accredited homestays yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {homestays.map(h => {
                      const revList = reviews.homestays[h.id] || [];
                      const avg = avgRating(revList);
                      const photos = h.images || [];
                      const arrangements = h.sleeping_arrangements || [];
                      return (
                        <div key={h.id} className="bg-white rounded-lg border border-[#E8DFC8] overflow-hidden flex flex-col justify-between">
                          <div>
                            {/* Photo container */}
                            <div className="img-editorial-wrapper aspect-[16/10] bg-[#153325] relative">
                              <SafeImage
                                src={photos.length > 0 ? photos[0].image_url : 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800'}
                                alt={h.name}
                                className="img-editorial w-full h-full object-cover"
                                fallback="landscape"
                              />
                              <div className="absolute top-3 left-3">
                                <span className="bg-[#153325]/90 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded">
                                  DOT Accredited
                                </span>
                              </div>
                            </div>

                            <div className="p-6">
                              <h3 className="font-serif text-2xl font-bold text-[#153325] mb-1">{h.name}</h3>
                              <p className="text-xs text-[#5A534E] mb-3 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#B88B2A]" /> {h.address}
                              </p>

                              {/* Star rating */}
                              <div className="flex items-center gap-1.5 mb-4">
                                <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(avg) ? 'fill-[#B88B2A] text-[#B88B2A]' : 'text-slate-200'}`} />)}</div>
                                <span className="text-xs text-[#5A534E]">{avg > 0 ? avg.toFixed(1) : 'New listing'} ({revList.length})</span>
                              </div>

                              <p className="text-[#5A534E] text-xs leading-relaxed mb-4">{h.description}</p>

                              {/* Sleeping arrangements */}
                              {arrangements.length > 0 && (
                                <div className="mb-4 bg-[#F3ECE0] rounded-md p-3 border border-[#E8DFC8]">
                                  <p className="text-[10px] font-bold text-[#153325] uppercase tracking-wider mb-1.5">
                                    Accommodations
                                  </p>
                                  <div className="space-y-1">
                                    {arrangements.map((rm, i) => (
                                      <div key={i} className="flex items-center gap-2 text-xs text-[#5A534E]">
                                        <span className="font-semibold text-[#153325]">{rm.room_type}</span>
                                        <span>·</span>
                                        <span>Up to {rm.capacity} guests</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="p-6 pt-0 flex flex-col gap-2">
                            <button
                              onClick={() => openInquiry('HOMESTAY', h)}
                              className="btn-editorial-primary w-full !py-2.5 text-xs font-semibold"
                            >
                              Send Booking Inquiry
                            </button>
                            {user?.role === 'TOURIST' && (
                              <button
                                onClick={() => setReviewTarget({ type: 'HOMESTAY', id: h.id, name: h.name })}
                                className="btn-editorial-outline w-full !py-2 text-xs font-semibold"
                              >
                                Write a Review
                              </button>
                            )}
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
                  <div className="text-center py-16 text-[#5A534E] bg-[#F3ECE0] rounded-md border border-[#E8DFC8] p-8">
                    <p className="font-serif text-lg font-bold text-[#153325] mb-1">No accredited tour guides listed yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {guides.map(g => {
                      const revList = reviews.guides[g.id] || [];
                      const avg = avgRating(revList);
                      return (
                        <div key={g.id} className="bg-white rounded-lg border border-[#E8DFC8] overflow-hidden flex flex-col justify-between p-6">
                          <div>
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-16 h-16 rounded-full overflow-hidden border border-[#E8DFC8] bg-[#153325] flex-shrink-0">
                                <SafeImage src={g.profile_picture_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'} alt={g.guide_name} className="w-full h-full object-cover" fallback="avatar" />
                              </div>
                              <div>
                                <h3 className="font-serif text-xl font-bold text-[#153325]">
                                  {g.guide_name}
                                </h3>
                                <p className="text-xs text-[#5A534E]">Languages: {g.languages_spoken}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  {[1,2,3,4,5].map(s=><Star key={s} className={`w-3 h-3 ${s<=Math.round(avg)?'fill-[#B88B2A] text-[#B88B2A]':'text-slate-200'}`}/>)}
                                  <span className="text-xs text-[#5A534E] ml-1">{avg > 0 ? avg.toFixed(1) : 'New'} ({revList.length})</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-[#5A534E] text-xs leading-relaxed mb-4">{g.bio}</p>
                            <div className="space-y-1.5 text-xs text-[#5A534E] bg-[#F3ECE0] p-3 rounded-md border border-[#E8DFC8] mb-6">
                              <p><strong className="text-[#153325]">Specialties:</strong> {g.services_offered}</p>
                              <p><strong className="text-[#153325]">Territory:</strong> {g.areas_covered}</p>
                              {g.price_rate && <p className="text-[#153325] font-bold">Standard Rate: ₱{parseFloat(g.price_rate).toLocaleString()} / day</p>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button onClick={() => openInquiry('GUIDE', g)} className="btn-editorial-primary w-full !py-2.5 text-xs font-semibold">
                              Inquire with Guide
                            </button>
                            {user?.role === 'TOURIST' && (
                              <button
                                onClick={() => setReviewTarget({ type: 'GUIDE', id: g.id, name: g.guide_name })}
                                className="btn-editorial-outline w-full !py-2 text-xs font-semibold"
                              >
                                Write a Review
                              </button>
                            )}
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
                  <div className="text-center py-16 bg-[#F3ECE0] rounded-md border border-[#E8DFC8] p-8">
                    <p className="font-serif text-lg font-bold text-[#153325] mb-1">No upcoming events scheduled.</p>
                    <Link to="/events" className="text-xs font-bold text-[#153325] hover:underline mt-2 inline-block">Browse all province events →</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {events.map(ev => (
                      <div key={ev.id} className="bg-white rounded-lg border border-[#E8DFC8] overflow-hidden">
                        {ev.image_url && <SafeImage src={ev.image_url} alt={ev.title} className="w-full h-44 object-cover" fallback="landscape" />}
                        <div className="p-6">
                          <span className="editorial-tag mb-2 inline-block">{ev.category}</span>
                          <h3 className="font-serif text-xl font-bold text-[#153325] mb-2">{ev.title}</h3>
                          <p className="text-[#5A534E] text-xs mb-4 line-clamp-2">{ev.description}</p>
                          <div className="flex items-center gap-2 text-xs text-[#5A534E] pt-3 border-t border-[#E8DFC8]">
                            <Calendar className="w-3.5 h-3.5 text-[#B88B2A]" />
                            {formatDate(ev.start_date)}{ev.end_date && ` – ${formatDate(ev.end_date)}`}
                          </div>
                          {ev.venue && <div className="flex items-center gap-2 text-xs text-[#5A534E] mt-1"><MapPin className="w-3.5 h-3.5 text-[#B88B2A]" /> {ev.venue}</div>}
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
                {bannerImages.length === 0 ? (
                  <div className="text-center py-16 text-[#5A534E] bg-[#F3ECE0] rounded-md border border-[#E8DFC8] p-8">
                    <p className="font-serif text-lg font-bold text-[#153325]">No gallery images uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {bannerImages.map((img, idx) => (
                      <div key={idx} className="img-editorial-wrapper aspect-square bg-[#153325] rounded-md border border-[#E8DFC8]">
                        <img src={img} alt="Gallery view" className="img-editorial w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-8">
                {homestays.map(h => {
                  const revList = reviews.homestays[h.id] || [];
                  const avg = avgRating(revList);
                  return (
                    <div key={h.id} className="bg-white rounded-lg border border-[#E8DFC8] p-6">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E8DFC8]">
                        <div>
                          <span className="editorial-tag mb-1 inline-block">Homestay</span>
                          <h3 className="font-serif text-xl font-bold text-[#153325]">{h.name}</h3>
                        </div>
                        <div className="text-right">
                          <div className="flex justify-end gap-0.5 mb-1">
                            {[1,2,3,4,5].map(s=><Star key={s} className={`w-4 h-4 ${s<=Math.round(avg)?'fill-[#B88B2A] text-[#B88B2A]':'text-slate-200'}`}/>)}
                          </div>
                          <span className="text-xs text-[#5A534E]">{avg > 0 ? avg.toFixed(1) : 'No ratings'} · {revList.length} reviews</span>
                        </div>
                      </div>
                      {revList.length === 0 ? (
                        <p className="text-[#5A534E] text-xs text-center py-4">No reviews yet for this homestay.</p>
                      ) : (
                        <div className="space-y-4">
                          {revList.map(rev => (
                            <div key={rev.id} className="border-b border-[#E8DFC8]/40 pb-4">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-[#153325] text-sm">{rev.reviewer_name || 'Verified Traveler'}</p>
                                <div className="flex gap-0.5">{[1,2,3,4,5].map(s=><Star key={s} className={`w-3.5 h-3.5 ${s<=rev.rating?'fill-[#B88B2A] text-[#B88B2A]':'text-slate-200'}`}/>)}</div>
                              </div>
                              {rev.comment && <p className="text-[#5A534E] text-xs leading-relaxed">{rev.comment}</p>}
                              <p className="text-[#5A534E]/60 text-[10px] mt-1">{formatDate(rev.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {localDOT ? (
              <div className="bg-white rounded-lg border border-[#E8DFC8] p-6 text-center sticky top-36">
                <div className="w-20 h-20 rounded-full overflow-hidden border border-[#E8DFC8] mb-3 mx-auto bg-[#153325]">
                  <SafeImage src={localDOT.profile_picture_url || municipality.featured_image_url} alt={localDOT.officer_name} className="w-full h-full object-cover" fallback="avatar" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#153325] leading-tight">{localDOT.officer_name}</h3>
                <p className="text-[11px] text-[#B88B2A] font-semibold uppercase tracking-wider mt-0.5">{localDOT.designation || 'Municipal Tourism Officer'}</p>
                <div className="border-t border-[#E8DFC8] my-4 pt-4 text-left space-y-2.5 text-xs text-[#5A534E]">
                  <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-[#B88B2A] flex-shrink-0 mt-0.5" /><span>{localDOT.office_address || 'Municipal Tourism Desk'}</span></div>
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#B88B2A] flex-shrink-0" /><a href={`mailto:${localDOT.officer_email}`} className="hover:underline truncate text-[#153325] font-medium">{localDOT.officer_email}</a></div>
                  {localDOT.officer_phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#B88B2A] flex-shrink-0" /><span>{localDOT.officer_phone}</span></div>}
                </div>
              </div>
            ) : (
              <div className="bg-[#F3ECE0] rounded-lg border border-[#E8DFC8] p-6 text-center text-xs text-[#5A534E] py-10 sticky top-36">
                <p className="font-serif text-sm font-bold text-[#153325]">Municipal Tourism Desk</p>
                <p className="mt-1 text-[11px]">{municipality.name}, Abra</p>
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

              {/* Booked Dates Availability Notice */}
              {bookedDates.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5">
                  <p className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Already Booked — Choose Different Dates
                  </p>
                  <div className="space-y-1">
                    {bookedDates.map((range, i) => {
                      const start = new Date(range.start_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
                      const end = range.end_date ? new Date(range.end_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : start;
                      return (
                        <div key={i} className="flex items-center gap-1.5 text-[10px] text-amber-700 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                          {start === end ? start : `${start} — ${end}`}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
              <p className="text-[10px] text-slate-400 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                💡 Once the host confirms and replies with payment details (e.g. GCash number), you can send payment and upload proof from your <strong>Dashboard → My Bookings</strong>.
              </p>
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
