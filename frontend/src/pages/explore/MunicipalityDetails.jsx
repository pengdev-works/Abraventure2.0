import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import { 
  MapPin, Calendar, HelpCircle, Phone, Mail, Award, CheckCircle, Info, 
  Landmark, Star, MessageSquare, Upload, Image, Home, BedDouble, Users, 
  Package, Sparkles, Send, Clock, ChevronDown, ChevronUp, Film, Video, 
  Play, ExternalLink, Compass, Navigation, Plus, Search, X, ShieldCheck, 
  Check, Share2, Eye, Map, AlertTriangle, ArrowRight, Tag, CheckSquare, Layers, DollarSign 
} from 'lucide-react';
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

// Attraction Category Styling & Icon Helper
const getAttractionCategoryBadge = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('waterfall') || cat.includes('spring') || cat.includes('river') || cat.includes('falls')) {
    return { label: category || 'Waterfall & Spring', icon: '🌊', badgeClass: 'bg-sky-500/10 text-sky-800 border-sky-500/30' };
  }
  if (cat.includes('cave') || cat.includes('rock') || cat.includes('formation')) {
    return { label: category || 'Cave & Rock Formation', icon: '🪨', badgeClass: 'bg-purple-500/10 text-purple-800 border-purple-500/30' };
  }
  if (cat.includes('mountain') || cat.includes('peak') || cat.includes('view') || cat.includes('ridge') || cat.includes('valley')) {
    return { label: category || 'Mountain & Viewpoint', icon: '⛰️', badgeClass: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30' };
  }
  if (cat.includes('historical') || cat.includes('heritage') || cat.includes('church') || cat.includes('spanish') || cat.includes('monument')) {
    return { label: category || 'Historical Landmark', icon: '🏛️', badgeClass: 'bg-amber-500/10 text-[#946E1D] border-amber-500/30' };
  }
  if (cat.includes('cultural') || cat.includes('weaving') || cat.includes('itneg') || cat.includes('tingguian') || cat.includes('craft')) {
    return { label: category || 'Cultural Heritage', icon: '🧵', badgeClass: 'bg-rose-500/10 text-rose-800 border-rose-500/30' };
  }
  return { label: category || 'Natural Landmark', icon: '🌿', badgeClass: 'bg-[#153325]/10 text-[#153325] border-[#153325]/30' };
};

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
  const [pkgSearch, setPkgSearch] = useState('');
  const [pkgDurationFilter, setPkgDurationFilter] = useState('ALL');
  const [pkgSort, setPkgSort] = useState('RECOMMENDED');
  const [selectedPackageModal, setSelectedPackageModal] = useState(null);
  const [loadingPackageModal, setLoadingPackageModal] = useState(false);

  // Events state
  const [events, setEvents] = useState([]);

  // Video Advertisements state
  const [videoAds, setVideoAds] = useState([]);

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
  const [bookedDates, setBookedDates] = useState([]); // confirmed booked ranges

  // Local Attraction Features & Itinerary Planning State
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [attractionSearch, setAttractionSearch] = useState('');
  const [attractionCategoryFilter, setAttractionCategoryFilter] = useState('ALL');
  const [showAddItinModal, setShowAddItinModal] = useState(false);
  const [itinAttraction, setItinAttraction] = useState(null);
  const [userItineraries, setUserItineraries] = useState([]);
  const [selectedItinId, setSelectedItinId] = useState('');
  const [itinDayNumber, setItinDayNumber] = useState(1);
  const [itinTimeSlot, setItinTimeSlot] = useState('09:00');
  const [itinNotes, setItinNotes] = useState('');
  const [itinLoading, setItinLoading] = useState(false);
  const [itinSuccess, setItinSuccess] = useState('');
  const [itinError, setItinError] = useState('');

  const handleOpenAddItin = async (attraction) => {
    setItinAttraction(attraction);
    setItinSuccess('');
    setItinError('');
    setItinNotes(`Explore ${attraction.name}`);
    setShowAddItinModal(true);

    if (token && user?.role === 'TOURIST') {
      try {
        const res = await fetch('/api/itineraries', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const list = await res.json();
          setUserItineraries(list);
          if (list.length > 0) setSelectedItinId(list[0].id);
        }
      } catch (err) {
        console.error('Error fetching user itineraries:', err);
      }
    }
  };

  const handleConfirmAddItin = async (e) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    if (!selectedItinId) {
      setItinError('Please select a trip or create an expedition plan first.');
      return;
    }
    setItinLoading(true);
    setItinError('');
    setItinSuccess('');

    try {
      const res = await fetch('/api/itineraries/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          itineraryId: selectedItinId,
          dayNumber: parseInt(itinDayNumber),
          timeSlot: itinTimeSlot ? `${itinTimeSlot}:00` : null,
          activityType: 'ATTRACTION',
          notes: itinNotes,
          attractionId: itinAttraction.id
        })
      });
      const resData = await res.json();
      if (res.ok) {
        setItinSuccess(`"${itinAttraction.name}" was successfully added to your expedition!`);
        setTimeout(() => {
          setShowAddItinModal(false);
          setItinSuccess('');
        }, 1800);
      } else {
        setItinError(resData.message || 'Failed to add attraction to itinerary.');
      }
    } catch (err) {
      setItinError('Server connection error. Please try again.');
    } finally {
      setItinLoading(false);
    }
  };

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

  // Fetch video advertisements for this municipality
  useEffect(() => {
    if (!id) return;
    fetch(`/api/advertisements/public?municipalityId=${id}`)
      .then(r => r.ok ? r.json() : [])
      .then(setVideoAds)
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

  const openPackageModal = async (pkg) => {
    setSelectedPackageModal(pkg);
    setLoadingPackageModal(true);
    try {
      const res = await fetch(`/api/packages/${pkg.id}`);
      if (res.ok) {
        const det = await res.json();
        setSelectedPackageModal({
          ...pkg,
          ...det.package,
          items: det.items || []
        });
      }
    } catch (err) {
      console.error('Error fetching package modal details:', err);
    } finally {
      setLoadingPackageModal(false);
    }
  };

  const closePackageModal = () => {
    setSelectedPackageModal(null);
    setLoadingPackageModal(false);
  };

  const handleImportPackage = async (pkgId) => {
    if (!token) {
      Swal.fire({
        title: 'Sign In Required',
        text: 'Please sign in with your Tourist account to import this official tour package into your personalized trip planner.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Sign In Now',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#153325',
      }).then((res) => {
        if (res.isConfirmed) navigate('/login');
      });
      return;
    }

    const confirmResult = await Swal.fire({
      title: 'Import Curated Package?',
      text: 'This will add this package and its day-by-day scheduled stops into your personal trip planner as an editable base itinerary.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Import to Planner',
      cancelButtonText: 'Keep Browsing',
      confirmButtonColor: '#153325',
      cancelButtonColor: '#78716c',
    });

    if (!confirmResult.isConfirmed) return;

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
        Swal.fire({
          title: 'Package Imported!',
          text: 'The curated tour package has been successfully copied to your itinerary planner. Redirecting...',
          icon: 'success',
          timer: 1800,
          showConfirmButton: false,
        });
        setTimeout(() => navigate('/itinerary'), 1500);
      } else {
        Swal.fire({
          title: 'Import Failed',
          text: data.message || 'Failed to import tour package.',
          icon: 'error',
          confirmButtonColor: '#153325',
        });
      }
    } catch (err) {
      console.error('Error importing package:', err);
      Swal.fire({
        title: 'Network Error',
        text: 'Failed to communicate with server.',
        icon: 'error',
        confirmButtonColor: '#153325',
      });
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
    ...(videoAds.length > 0 ? [{ id: 'videos', label: `Video Spotlight (${videoAds.length})` }] : []),
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
          {videoAds.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('videos');
                  const tabsElement = document.getElementById('municipality-tabs-bar');
                  if (tabsElement) tabsElement.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#B88B2A] text-[#153325] rounded-xl font-bold text-xs shadow-lg hover:bg-amber-400 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Watch Official Video Spotlight ({videoAds.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Tabs Bar */}
      <div id="municipality-tabs-bar" className="border-b border-[#E8DFC8] bg-[#FAF7F2]/95 backdrop-blur-md sticky top-20 z-40">
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
            {activeTab === 'packages' && (() => {
              const durationFilters = [
                { id: 'ALL', label: 'All Packages', icon: '📦' },
                { id: '1', label: '1 Day (Day Trips)', icon: '☀️' },
                { id: '2', label: '2 Days (Weekend)', icon: '🏕️' },
                { id: '3+', label: '3+ Days (Expeditions)', icon: '⛰️' }
              ];

              const filteredPackages = packages.filter(pkg => {
                const q = pkgSearch.trim().toLowerCase();
                const matchesSearch = !q ||
                  pkg.title?.toLowerCase().includes(q) ||
                  pkg.description?.toLowerCase().includes(q) ||
                  pkg.inclusions?.toLowerCase().includes(q);

                if (!matchesSearch) return false;

                const days = parseInt(pkg.duration_days) || 1;
                if (pkgDurationFilter === '1') return days === 1;
                if (pkgDurationFilter === '2') return days === 2;
                if (pkgDurationFilter === '3+') return days >= 3;
                return true;
              }).sort((a, b) => {
                if (pkgSort === 'PRICE_ASC') return parseFloat(a.price || 0) - parseFloat(b.price || 0);
                if (pkgSort === 'PRICE_DESC') return parseFloat(b.price || 0) - parseFloat(a.price || 0);
                if (pkgSort === 'DURATION_ASC') return (parseInt(a.duration_days) || 1) - (parseInt(b.duration_days) || 1);
                if (pkgSort === 'DURATION_DESC') return (parseInt(b.duration_days) || 1) - (parseInt(a.duration_days) || 1);
                return 0; // RECOMMENDED
              });

              return (
                <div className="space-y-8">
                  {/* Hero / Curated Banner */}
                  <div className="bg-gradient-to-r from-[#153325] via-[#1D4433] to-[#153325] rounded-3xl p-6 sm:p-8 text-[#FAF7F2] shadow-xl border border-[#B88B2A]/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#B88B2A]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                    <div className="relative z-10 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B88B2A]/20 border border-[#B88B2A]/50 text-[#FAF7F2] text-[11px] font-bold uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5 text-[#B88B2A]" /> Official Municipal Tour Packages
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-white/80 font-medium">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Authorized Tourism Desk Rates
                        </span>
                      </div>

                      <div className="max-w-2xl">
                        <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                          Explore {data?.municipality?.name || 'Abra'} with Curated Guided Expeditions
                        </h2>
                        <p className="text-white/80 text-xs sm:text-sm mt-2 leading-relaxed">
                          Handcrafted, all-inclusive itineraries authorized by the {data?.municipality?.name} Municipal Tourism Office. Experience certified guides, authentic Cordillera homestays, and secure trail coordination.
                        </p>
                      </div>

                      {/* Quick Highlight Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        <div className="bg-black/25 backdrop-blur-xs border border-white/10 p-3 rounded-2xl">
                          <p className="text-[10px] uppercase font-bold text-white/70 tracking-wider">Listed Packages</p>
                          <p className="font-serif text-xl font-bold text-[#FAF7F2] mt-0.5">{packages.length}</p>
                        </div>
                        <div className="bg-black/25 backdrop-blur-xs border border-white/10 p-3 rounded-2xl">
                          <p className="text-[10px] uppercase font-bold text-white/70 tracking-wider">Accreditation</p>
                          <p className="font-serif text-xl font-bold text-emerald-300 mt-0.5">100% DOT</p>
                        </div>
                        <div className="bg-black/25 backdrop-blur-xs border border-white/10 p-3 rounded-2xl">
                          <p className="text-[10px] uppercase font-bold text-white/70 tracking-wider">Base Rates</p>
                          <p className="font-serif text-xl font-bold text-[#B88B2A] mt-0.5">Fixed LGU</p>
                        </div>
                        <div className="bg-black/25 backdrop-blur-xs border border-white/10 p-3 rounded-2xl">
                          <p className="text-[10px] uppercase font-bold text-white/70 tracking-wider">Planner Sync</p>
                          <p className="font-serif text-xl font-bold text-cyan-300 mt-0.5">1-Click Save</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Search, Filter Chips & Sort Controls */}
                  <div className="bg-[var(--bg-card,#FAF7F2)] border border-[var(--border-app,#E8DFC8)] p-4 sm:p-5 rounded-2xl space-y-4 shadow-xs">
                    <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                      {/* Search input */}
                      <div className="relative w-full md:max-w-md">
                        <Search className="w-4 h-4 text-[#5A534E] absolute left-3.5 top-3 pointer-events-none" />
                        <input
                          type="text"
                          value={pkgSearch}
                          onChange={(e) => setPkgSearch(e.target.value)}
                          placeholder="Search tour packages, highlights, activities..."
                          className="w-full pl-10 pr-9 py-2.5 bg-white border border-[var(--border-app,#E8DFC8)] rounded-xl text-xs text-[#232120] placeholder-[#5A534E]/60 focus:outline-none focus:border-[#153325] shadow-2xs transition-all"
                        />
                        {pkgSearch && (
                          <button
                            onClick={() => setPkgSearch('')}
                            className="absolute right-3 top-2.5 text-[#5A534E] hover:text-[#232120] p-0.5 rounded-full"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Sort Dropdown */}
                      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <span className="text-xs font-semibold text-[#5A534E] whitespace-nowrap">Sort by:</span>
                        <select
                          value={pkgSort}
                          onChange={(e) => setPkgSort(e.target.value)}
                          className="px-3 py-2 bg-white border border-[var(--border-app,#E8DFC8)] rounded-xl text-xs font-semibold text-[#153325] focus:outline-none focus:border-[#153325] cursor-pointer shadow-2xs"
                        >
                          <option value="RECOMMENDED">✨ Recommended</option>
                          <option value="PRICE_ASC">💵 Price: Low to High</option>
                          <option value="PRICE_DESC">💎 Price: High to Low</option>
                          <option value="DURATION_DESC">⏱️ Longest Trip First</option>
                          <option value="DURATION_ASC">⚡ Quick Day Trips</option>
                        </select>
                      </div>
                    </div>

                    {/* Duration Filter Chips */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {durationFilters.map((tab) => {
                        const isSelected = pkgDurationFilter === tab.id;
                        let count = 0;
                        if (tab.id === 'ALL') count = packages.length;
                        else if (tab.id === '1') count = packages.filter(p => (parseInt(p.duration_days) || 1) === 1).length;
                        else if (tab.id === '2') count = packages.filter(p => (parseInt(p.duration_days) || 1) === 2).length;
                        else if (tab.id === '3+') count = packages.filter(p => (parseInt(p.duration_days) || 1) >= 3).length;

                        return (
                          <button
                            key={tab.id}
                            onClick={() => setPkgDurationFilter(tab.id)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                              isSelected
                                ? 'bg-[#153325] text-white shadow-xs'
                                : 'bg-white border border-[var(--border-app,#E8DFC8)] text-[#5A534E] hover:border-[#153325] hover:text-[#153325]'
                            }`}
                          >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tour Packages Cards Grid */}
                  {filteredPackages.length === 0 ? (
                    <div className="text-center py-16 bg-[var(--bg-card,#FAF7F2)] rounded-3xl border border-[var(--border-app,#E8DFC8)] p-8 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-[#153325]/10 text-[#153325] flex items-center justify-center mx-auto">
                        <Package className="w-8 h-8 opacity-70" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-serif text-xl font-bold text-[#153325]">No tour packages found</p>
                        <p className="text-xs text-[#5A534E] max-w-md mx-auto">
                          {pkgSearch || pkgDurationFilter !== 'ALL'
                            ? "No official packages match your current search or filter criteria. Try resetting your filters to explore other options."
                            : "The Municipal Tourism Office has not published standardized tour packages yet. You can explore local attractions, homestays, and tour guides directly below."}
                        </p>
                      </div>
                      {(pkgSearch || pkgDurationFilter !== 'ALL') && (
                        <button
                          onClick={() => {
                            setPkgSearch('');
                            setPkgDurationFilter('ALL');
                            setPkgSort('RECOMMENDED');
                          }}
                          className="px-4 py-2 bg-[#153325] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1D4433] transition-colors cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {filteredPackages.map(pkg => {
                        return (
                          <div
                            key={pkg.id}
                            className="group bg-[var(--bg-card,#FFFFFF)] rounded-3xl border border-[var(--border-app,#E8DFC8)] hover:border-[#153325] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                          >
                            <div>
                              {/* Package Cover Image Banner */}
                              <div className="img-editorial-wrapper aspect-[16/10] bg-[#153325] relative overflow-hidden">
                                <SafeImage
                                  src={pkg.image_url || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'}
                                  alt={pkg.title}
                                  className="img-editorial w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                                {/* Price Pill Badge (Top Left) */}
                                <div className="absolute top-3 left-3 z-10">
                                  <div className="bg-[#153325]/95 backdrop-blur-md text-[#FAF7F2] font-bold text-xs px-3 py-1 rounded-xl shadow-md border border-white/20 flex items-center gap-1.5">
                                    <span className="text-[#B88B2A] font-extrabold">₱</span>
                                    <span>{parseFloat(pkg.price).toLocaleString()}</span>
                                    <span className="text-[10px] font-normal text-white/80">/ person</span>
                                  </div>
                                </div>

                                {/* Duration Pill Badge (Top Right) */}
                                <div className="absolute top-3 right-3 z-10">
                                  <div className="bg-[#B88B2A] text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{pkg.duration_days} Day{pkg.duration_days > 1 ? 's' : ''}</span>
                                  </div>
                                </div>

                                {/* Bottom Metadata Overlays */}
                                <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between text-[11px] text-white/90">
                                  <span className="flex items-center gap-1 font-semibold">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Verified LGU Itinerary</span>
                                  </span>
                                  <span className="bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md font-mono text-[10px] text-white/90">
                                    {pkg.item_count || 0} Stops Included
                                  </span>
                                </div>
                              </div>

                              {/* Package Details Body */}
                              <div className="p-6 space-y-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#B88B2A]">
                                      {data?.municipality?.name || 'Abra'} TOUR PACKAGE
                                    </span>
                                  </div>
                                  <h3 className="font-serif text-xl font-bold text-[#153325] leading-snug group-hover:text-[#B88B2A] transition-colors">
                                    {pkg.title}
                                  </h3>
                                  {pkg.description && (
                                    <p className="text-[#5A534E] text-xs leading-relaxed line-clamp-2 mt-2">
                                      {pkg.description}
                                    </p>
                                  )}
                                </div>

                                {/* Inclusions Summary */}
                                {pkg.inclusions && (
                                  <div className="bg-[var(--bg-app,#FAF7F2)] p-3.5 rounded-2xl border border-[var(--border-app,#E8DFC8)] space-y-1">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#153325]">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Inclusions & Package Perks</span>
                                    </div>
                                    <p className="text-xs text-[#5A534E] leading-relaxed line-clamp-2 pl-5">
                                      {pkg.inclusions}
                                    </p>
                                  </div>
                                )}

                                {/* Interactive Day Schedule Preview Trigger */}
                                <div className="pt-1">
                                  <button
                                    type="button"
                                    onClick={() => openPackageModal(pkg)}
                                    className="w-full py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-600/30 text-emerald-900 rounded-xl font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <Layers className="w-4 h-4 text-emerald-700" />
                                      <span>View Full Day-by-Day Roadmap ({pkg.item_count || 0} stops)</span>
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Card Action Buttons */}
                            <div className="p-4 sm:p-5 border-t border-[var(--border-app,#E8DFC8)] bg-slate-50/50 flex flex-col sm:flex-row gap-2.5">
                              {/* Direct Inquiry / Booking */}
                              <button
                                type="button"
                                onClick={() => openInquiry('PACKAGE', { id: pkg.id, name: pkg.title, price: pkg.price })}
                                className="flex-1 py-2.5 px-3.5 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5 text-[#B88B2A]" />
                                <span>Book Package</span>
                              </button>

                              {/* Save / Import to Itinerary */}
                              <button
                                type="button"
                                onClick={() => handleImportPackage(pkg.id)}
                                disabled={importingPkgId === pkg.id}
                                className="flex-1 py-2.5 px-3.5 bg-[#153325] hover:bg-[#1D4433] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                              >
                                {importingPkgId === pkg.id ? (
                                  <>
                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Importing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5 text-[#B88B2A]" />
                                    <span>Save to Trip Planner</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Local Attractions Tab */}
            {activeTab === 'attractions' && (() => {
              const allCats = [
                { id: 'ALL', label: 'All Sights', icon: '📍' },
                { id: 'WATERFALL', label: 'Waterfalls & Springs', icon: '🌊' },
                { id: 'CAVE', label: 'Caves & Gorges', icon: '🪨' },
                { id: 'MOUNTAIN', label: 'Peaks & Valleys', icon: '⛰️' },
                { id: 'HISTORICAL', label: 'Historic & Churches', icon: '🏛️' },
                { id: 'CULTURAL', label: 'Cultural & Textile', icon: '🧵' }
              ];

              const filteredAttractions = (attractions || []).filter(a => {
                const matchesSearch = !attractionSearch || 
                  a.name?.toLowerCase().includes(attractionSearch.toLowerCase()) ||
                  a.description?.toLowerCase().includes(attractionSearch.toLowerCase()) ||
                  a.location_details?.toLowerCase().includes(attractionSearch.toLowerCase());
                
                if (!matchesSearch) return false;
                if (attractionCategoryFilter === 'ALL') return true;
                
                const cat = (a.category || '').toUpperCase();
                if (attractionCategoryFilter === 'WATERFALL') return cat.includes('WATERFALL') || cat.includes('SPRING') || cat.includes('FALLS') || cat.includes('RIVER');
                if (attractionCategoryFilter === 'CAVE') return cat.includes('CAVE') || cat.includes('ROCK') || cat.includes('FORMATION');
                if (attractionCategoryFilter === 'MOUNTAIN') return cat.includes('MOUNTAIN') || cat.includes('PEAK') || cat.includes('RIDGE') || cat.includes('VALLEY');
                if (attractionCategoryFilter === 'HISTORICAL') return cat.includes('HISTORICAL') || cat.includes('HERITAGE') || cat.includes('CHURCH') || cat.includes('SPANISH');
                if (attractionCategoryFilter === 'CULTURAL') return cat.includes('CULTURAL') || cat.includes('WEAVING') || cat.includes('ITNEG') || cat.includes('TINGGUIAN');
                return true;
              });

              return (
                <div className="space-y-6">
                  {/* Top Search & Category Filter Bar */}
                  <div className="bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-[#E8DFC8] shadow-xs space-y-4 text-left">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#153325] animate-pulse" />
                          <h3 className="font-serif text-lg sm:text-xl font-bold text-[#153325]">
                            Local Attractions in {municipality.name}
                          </h3>
                        </div>
                        <p className="text-xs text-[#5A534E] mt-0.5">
                          {attractions.length} verified municipal eco-tourism and cultural heritage site{attractions.length !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Search Input */}
                      <div className="relative w-full sm:w-72">
                        <input
                          type="text"
                          value={attractionSearch}
                          onChange={(e) => setAttractionSearch(e.target.value)}
                          placeholder="Search waterfalls, caves, heritage..."
                          className="w-full pl-9 pr-8 py-2 bg-white border border-[#E8DFC8] rounded-xl text-xs text-[#232120] placeholder:text-[#5A534E]/60 focus:outline-none focus:border-[#153325] shadow-2xs"
                        />
                        <Search className="w-4 h-4 text-[#5A534E]/60 absolute left-3 top-2.5 pointer-events-none" />
                        {attractionSearch && (
                          <button
                            onClick={() => setAttractionSearch('')}
                            className="absolute right-2.5 top-2.5 text-[#5A534E] hover:text-[#153325] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {allCats.map(cat => {
                        const count = cat.id === 'ALL'
                          ? (attractions || []).length
                          : (attractions || []).filter(a => {
                              const c = (a.category || '').toUpperCase();
                              if (cat.id === 'WATERFALL') return c.includes('WATERFALL') || c.includes('SPRING') || c.includes('FALLS') || c.includes('RIVER');
                              if (cat.id === 'CAVE') return c.includes('CAVE') || c.includes('ROCK') || c.includes('FORMATION');
                              if (cat.id === 'MOUNTAIN') return c.includes('MOUNTAIN') || c.includes('PEAK') || c.includes('RIDGE') || c.includes('VALLEY');
                              if (cat.id === 'HISTORICAL') return c.includes('HISTORICAL') || c.includes('HERITAGE') || c.includes('CHURCH') || c.includes('SPANISH');
                              if (cat.id === 'CULTURAL') return c.includes('CULTURAL') || c.includes('WEAVING') || c.includes('ITNEG') || c.includes('TINGGUIAN');
                              return false;
                            }).length;

                        if (cat.id !== 'ALL' && count === 0) return null;

                        const isActive = attractionCategoryFilter === cat.id;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setAttractionCategoryFilter(cat.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer touch-target ${
                              isActive
                                ? 'bg-[#153325] text-white shadow-xs font-bold'
                                : 'bg-white text-[#5A534E] hover:text-[#153325] hover:bg-[#F3ECE0] border border-[#E8DFC8]'
                            }`}
                          >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-[#5A534E]'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Attraction Cards Grid */}
                  {filteredAttractions.length === 0 ? (
                    <div className="text-center py-16 text-[#5A534E] bg-[#FAF7F2] rounded-2xl border border-[#E8DFC8] p-8">
                      <Compass className="w-10 h-10 text-[#B88B2A] mx-auto mb-2 opacity-60" />
                      <p className="font-serif text-lg font-bold text-[#153325] mb-1">No attractions match your filter</p>
                      <p className="text-xs">Try clearing your search term or selecting a different category.</p>
                      <button
                        onClick={() => { setAttractionSearch(''); setAttractionCategoryFilter('ALL'); }}
                        className="mt-4 px-4 py-2 bg-[#153325] text-white rounded-xl text-xs font-bold hover:bg-[#1D4433] transition-colors cursor-pointer"
                      >
                        Show All Attractions
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      {filteredAttractions.map(a => {
                        const badge = getAttractionCategoryBadge(a.category);
                        const hasCoords = a.latitude && a.longitude;
                        return (
                          <div
                            key={a.id}
                            className="bg-white rounded-2xl border border-[#E8DFC8] overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                          >
                            <div>
                              {/* Hero Photo with Category & Media Badges */}
                              <div className="relative aspect-[16/10] bg-[#153325] overflow-hidden">
                                <SafeImage
                                  src={a.image_url}
                                  alt={a.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  fallback="landscape"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

                                {/* Category Chip */}
                                <div className="absolute top-3 left-3 flex flex-wrap gap-2 items-center">
                                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border flex items-center gap-1 ${badge.badgeClass}`}>
                                    <span>{badge.icon}</span>
                                    <span>{badge.label}</span>
                                  </span>
                                  {a.video_url && (
                                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-amber-300 border border-amber-400/40 shadow-sm flex items-center gap-1">
                                      <Play className="w-2.5 h-2.5 fill-current" /> Video
                                    </span>
                                  )}
                                </div>

                                {/* Quick Coordinates Pill */}
                                {hasCoords && (
                                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white/90 text-[10px] px-2.5 py-1 rounded-md border border-white/15 font-mono flex items-center gap-1">
                                    <Navigation className="w-2.5 h-2.5 text-[#B88B2A] fill-current" />
                                    <span>{parseFloat(a.latitude).toFixed(3)}°, {parseFloat(a.longitude).toFixed(3)}°</span>
                                  </div>
                                )}
                              </div>

                              {/* Attraction Information */}
                              <div className="p-5">
                                <h3 className="font-serif text-xl font-bold text-[#153325] group-hover:text-[#B88B2A] transition-colors leading-snug mb-1.5">
                                  {a.name}
                                </h3>

                                <div className="flex items-center gap-2 text-xs text-[#5A534E] mb-3">
                                  <MapPin className="w-3.5 h-3.5 text-[#B88B2A] flex-shrink-0" />
                                  <span className="truncate">{a.location_details || `${municipality.name}, Abra`}</span>
                                </div>

                                <p className="text-[#5A534E] text-xs leading-relaxed line-clamp-3 mb-4">
                                  {a.description || 'Explore pristine natural landscapes and cultural heritage in this municipality.'}
                                </p>
                              </div>
                            </div>

                            {/* Action Toolbar */}
                            <div className="p-4 border-t border-[#E8DFC8] bg-[#FAF7F2]/60 flex flex-wrap items-center justify-between gap-2">
                              <button
                                onClick={() => setSelectedAttraction(a)}
                                className="px-3.5 py-2 rounded-xl bg-[#153325] hover:bg-[#1D4433] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer touch-target"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Explore Details</span>
                              </button>

                              <div className="flex items-center gap-2">
                                <Link
                                  to={`/map?search=${encodeURIComponent(a.name)}`}
                                  className="px-3 py-2 rounded-xl bg-white hover:bg-[#F3ECE0] text-[#153325] border border-[#E8DFC8] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer touch-target"
                                  title="View on Interactive Map"
                                >
                                  <Compass className="w-3.5 h-3.5 text-[#B88B2A]" />
                                  <span>Map</span>
                                </Link>

                                <button
                                  onClick={() => handleOpenAddItin(a)}
                                  className="px-3 py-2 rounded-xl bg-[#B88B2A] hover:bg-[#946E1D] text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer touch-target"
                                  title="Add to Itinerary"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Pin to Trip</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Video Features Tab */}
            {activeTab === 'videos' && (
              <div className="space-y-8">
                <div className="bg-[#F3ECE0] border border-[#E8DFC8] p-5 rounded-2xl text-xs text-[#5A534E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#153325] flex items-center gap-2">
                      <Film className="w-4 h-4 text-[#B88B2A]" />
                      <span>Official Video Advertisements &amp; Spotlights</span>
                    </h3>
                    <p className="mt-1 text-slate-600 leading-relaxed">
                      Produced and authorized by the {municipality.name} Municipal Tourism Desk to showcase eco-adventures, cultural traditions, and breathtaking landscapes.
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-full bg-[#153325] text-white text-[11px] font-bold tracking-wider uppercase flex-shrink-0">
                    {videoAds.length} Video{videoAds.length > 1 ? 's' : ''} Featured
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {videoAds.map((ad) => (
                    <div
                      key={ad.id}
                      className="bg-white border border-[#E8DFC8] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
                    >
                      {/* Video Player */}
                      <div className="relative aspect-video bg-black overflow-hidden">
                        <video
                          controls
                          preload="metadata"
                          poster={ad.thumbnail_url}
                          src={ad.video_url}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 pointer-events-none">
                          <span className="bg-[#153325]/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-white/10">
                            {ad.category || 'Eco-Tourism'}
                          </span>
                        </div>
                      </div>

                      {/* Video Info */}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-[11px] text-[#B88B2A] font-semibold mb-1.5">
                            <span>📍 {municipality.name}, Abra</span>
                            {ad.badge_label && (
                              <>
                                <span>•</span>
                                <span className="text-[#5A534E]">{ad.badge_label}</span>
                              </>
                            )}
                          </div>
                          <h4 className="font-serif text-lg font-bold text-[#153325] mb-1">
                            {ad.title}
                          </h4>
                          {ad.subtitle && (
                            <p className="text-xs text-[#B88B2A] font-semibold mb-2">
                              {ad.subtitle}
                            </p>
                          )}
                          <p className="text-xs text-[#5A534E] leading-relaxed mb-4">
                            {ad.description || `Promotional video spotlight highlighting ${municipality.name}, Abra.`}
                          </p>
                        </div>

                        {ad.cta_link && (
                          <div className="pt-4 border-t border-[#F3ECE0] flex items-center justify-between">
                            <Link
                              to={ad.cta_link}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#153325] hover:bg-[#1D4433] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                            >
                              <span>{ad.cta_text || 'Learn More'}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-[#B88B2A]" />
                            </Link>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Official LGU Showcase
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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

      {/* Attraction Details Modal */}
      {selectedAttraction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-[#E8DFC8] my-auto animate-scaleUp text-left">
            {/* Modal Media Header */}
            <div className="relative aspect-video sm:aspect-[21/10] bg-[#153325] overflow-hidden rounded-t-2xl">
              {selectedAttraction.video_url ? (
                selectedAttraction.video_url.includes('youtube.com') || selectedAttraction.video_url.includes('youtu.be') ? (
                  <iframe
                    src={selectedAttraction.video_url.replace('watch?v=', 'embed/')}
                    title={selectedAttraction.name}
                    className="w-full h-full object-cover"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={selectedAttraction.video_url}
                    controls
                    className="w-full h-full object-cover"
                    poster={selectedAttraction.image_url}
                  />
                )
              ) : (
                <SafeImage
                  src={selectedAttraction.image_url}
                  alt={selectedAttraction.name}
                  className="w-full h-full object-cover"
                  fallback="landscape"
                />
              )}
              
              <button
                onClick={() => setSelectedAttraction(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-colors z-10 cursor-pointer shadow-md"
                aria-label="Close attraction details"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute top-3 left-3 flex items-center gap-2">
                {(() => {
                  const b = getAttractionCategoryBadge(selectedAttraction.category);
                  return (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border flex items-center gap-1 ${b.badgeClass}`}>
                      <span>{b.icon}</span>
                      <span>{b.label}</span>
                    </span>
                  );
                })()}
                {selectedAttraction.video_url && (
                  <span className="px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-amber-300 border border-amber-400/40 shadow-sm flex items-center gap-1">
                    <Play className="w-3 h-3 fill-current" /> Video Showcase
                  </span>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <h3 className="font-serif text-2xl font-bold text-[#153325]">
                    {selectedAttraction.name}
                  </h3>
                  {selectedAttraction.latitude && selectedAttraction.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedAttraction.latitude},${selectedAttraction.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#B88B2A] hover:text-[#946E1D] hover:underline"
                    >
                      <Navigation className="w-3.5 h-3.5 fill-current" />
                      <span>{parseFloat(selectedAttraction.latitude).toFixed(4)}°, {parseFloat(selectedAttraction.longitude).toFixed(4)}°</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#5A534E]">
                  <MapPin className="w-3.5 h-3.5 text-[#B88B2A] flex-shrink-0" />
                  <span>{selectedAttraction.location_details || `${municipality.name}, Abra`}</span>
                </div>
              </div>

              {/* Description */}
              <div className="prose prose-sm text-[#5A534E] leading-relaxed text-xs sm:text-sm">
                <p className="whitespace-pre-line">{selectedAttraction.description}</p>
              </div>

              {/* Responsible Eco-Tourism & Safety Advisory */}
              <div className="bg-[#F3ECE0] rounded-xl p-4 border border-[#E8DFC8] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#153325]">
                  <ShieldCheck className="w-4 h-4 text-[#153325] flex-shrink-0" />
                  <span>Responsible Eco-Tourism & Visitor Protocol</span>
                </div>
                <ul className="text-[11px] sm:text-xs text-[#5A534E] space-y-1 list-disc list-inside">
                  <li>Leave No Trace: Please pack out all trash and respect wildlife habitats.</li>
                  <li>Check in at the {municipality.name} Municipal Tourism Desk prior to departure.</li>
                  <li>Hire accredited local tour guides for remote treks, caves, and river navigation.</li>
                  <li>Support local livelihood by patronizing community homestays and indigenous artisans.</li>
                </ul>
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-[#E8DFC8] flex flex-col sm:flex-row items-center justify-between gap-3">
                <Link
                  to={`/map?search=${encodeURIComponent(selectedAttraction.name)}`}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-[#F3ECE0] text-[#153325] border border-[#E8DFC8] text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Compass className="w-4 h-4 text-[#B88B2A]" />
                  <span>Locate on Abra Map</span>
                </Link>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedAttraction(null)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#E8DFC8] text-[#5A534E] hover:text-[#153325] hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const attr = selectedAttraction;
                      setSelectedAttraction(null);
                      handleOpenAddItin(attr);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#153325] hover:bg-[#1D4433] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#B88B2A]" />
                    <span>Pin to My Trip</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Attraction to Itinerary Modal */}
      {showAddItinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-[#E8DFC8] my-auto animate-scaleUp overflow-hidden text-left">
            <div className="h-1.5 bg-gradient-to-r from-[#153325] via-[#B88B2A] to-[#153325]" />
            <div className="p-6 border-b border-[#E8DFC8] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#153325]">
                  Pin to Trip Planner
                </h3>
                <p className="text-xs text-[#5A534E] mt-0.5">
                  {itinAttraction?.name}
                </p>
              </div>
              <button
                onClick={() => setShowAddItinModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-[#5A534E] hover:text-[#153325] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAddItin} className="p-6 space-y-4">
              {itinError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{itinError}</span>
                </div>
              )}
              {itinSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  <span>{itinSuccess}</span>
                </div>
              )}

              {!token ? (
                <div className="text-center py-6 space-y-3 bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DFC8]">
                  <Compass className="w-8 h-8 text-[#B88B2A] mx-auto opacity-70" />
                  <p className="text-xs text-[#5A534E]">
                    Sign in with a Tourist account to add <strong>{itinAttraction?.name}</strong> to your personalized trip itinerary.
                  </p>
                  <Link
                    to="/login"
                    className="inline-block px-5 py-2.5 bg-[#153325] hover:bg-[#1D4433] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    Sign In to Continue
                  </Link>
                </div>
              ) : (
                <>
                  {userItineraries.length === 0 ? (
                    <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DFC8] text-center space-y-2">
                      <p className="text-xs text-[#5A534E]">
                        You haven't created an itinerary plan yet. Create your first Abra trip plan in the Travel Planner!
                      </p>
                      <Link
                        to="/planner"
                        className="inline-block px-4 py-2 bg-[#153325] hover:bg-[#1D4433] text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        Create Trip Plan →
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-[#153325] mb-1">
                          Select Trip / Expedition
                        </label>
                        <select
                          value={selectedItinId}
                          onChange={(e) => setSelectedItinId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-[#E8DFC8] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                          required
                        >
                          {userItineraries.map(itin => (
                            <option key={itin.id} value={itin.id}>
                              {itin.title} ({itin.duration_days} day{itin.duration_days !== 1 ? 's' : ''})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#153325] mb-1">
                            Day Number
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={itinDayNumber}
                            onChange={(e) => setItinDayNumber(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-[#E8DFC8] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#153325] mb-1">
                            Preferred Time
                          </label>
                          <input
                            type="time"
                            value={itinTimeSlot}
                            onChange={(e) => setItinTimeSlot(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-[#E8DFC8] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#153325] mb-1">
                          Personal Activity Notes
                        </label>
                        <textarea
                          rows="2"
                          value={itinNotes}
                          onChange={(e) => setItinNotes(e.target.value)}
                          placeholder="e.g., Morning photo walk, bring dry bag, rent life vest..."
                          className="w-full px-3 py-2 bg-slate-50 border border-[#E8DFC8] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={itinLoading}
                        className="w-full py-2.5 bg-[#153325] hover:bg-[#1D4433] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {itinLoading ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 text-[#B88B2A]" />
                            <span>Save Attraction to Itinerary</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Tour Package Detailed Roadmap Modal */}
      {selectedPackageModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-[var(--border-app,#E8DFC8)] rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-auto relative flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Hero Header with Image */}
            <div className="relative aspect-[21/9] sm:aspect-[24/9] bg-[#153325] flex-shrink-0 overflow-hidden">
              <SafeImage
                src={selectedPackageModal.image_url || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'}
                alt={selectedPackageModal.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
              
              {/* Close Button */}
              <button
                onClick={closePackageModal}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title & Badges in Hero */}
              <div className="absolute bottom-4 left-4 right-4 z-10 text-white space-y-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#B88B2A] text-white font-bold text-[10px] uppercase tracking-wider">
                    {selectedPackageModal.duration_days} Day{selectedPackageModal.duration_days > 1 ? 's' : ''} Expedition
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-900/90 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Official LGU Package
                  </span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold leading-tight drop-shadow-sm text-white">
                  {selectedPackageModal.title}
                </h3>
              </div>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              {/* Package Highlight Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[var(--bg-app,#FAF7F2)] rounded-2xl border border-[var(--border-app,#E8DFC8)] text-left">
                  <span className="text-[10px] uppercase font-bold text-[#5A534E] tracking-wider block">Official Rate</span>
                  <p className="font-serif text-lg font-bold text-[#153325] mt-0.5">
                    ₱{parseFloat(selectedPackageModal.price || 0).toLocaleString()} <span className="text-xs font-normal text-[#5A534E]">/ person</span>
                  </p>
                </div>
                <div className="p-3 bg-[var(--bg-app,#FAF7F2)] rounded-2xl border border-[var(--border-app,#E8DFC8)] text-left">
                  <span className="text-[10px] uppercase font-bold text-[#5A534E] tracking-wider block">Trip Length</span>
                  <p className="font-serif text-lg font-bold text-[#B88B2A] mt-0.5">
                    {selectedPackageModal.duration_days} Days / {Math.max(1, parseInt(selectedPackageModal.duration_days || 1) - 1)} Nights
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1 p-3 bg-[var(--bg-app,#FAF7F2)] rounded-2xl border border-[var(--border-app,#E8DFC8)] text-left">
                  <span className="text-[10px] uppercase font-bold text-[#5A534E] tracking-wider block">Scheduled Stops</span>
                  <p className="font-serif text-lg font-bold text-emerald-800 mt-0.5">
                    {selectedPackageModal.items?.length || selectedPackageModal.item_count || 0} Coordinated Sights
                  </p>
                </div>
              </div>

              {/* Overview Description */}
              {selectedPackageModal.description && (
                <div className="space-y-1 text-left">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#153325]">Package Overview</h4>
                  <p className="text-xs sm:text-sm text-[#5A534E] leading-relaxed">
                    {selectedPackageModal.description}
                  </p>
                </div>
              )}

              {/* Inclusions Box */}
              {selectedPackageModal.inclusions && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-left space-y-2">
                  <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Included Services & Permits</span>
                  </h4>
                  <p className="text-xs text-emerald-950 leading-relaxed pl-5">
                    {selectedPackageModal.inclusions}
                  </p>
                </div>
              )}

              {/* Day by Day Stops Roadmap */}
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-base font-bold text-[#153325] flex items-center gap-2">
                    <Map className="w-4 h-4 text-[#B88B2A]" />
                    <span>Daily Schedule & Coordinated Stops</span>
                  </h4>
                  <span className="text-xs font-mono text-[#5A534E]">
                    {selectedPackageModal.items?.length || 0} Total Activities
                  </span>
                </div>

                {loadingPackageModal ? (
                  <div className="p-8 text-center text-[#5A534E] space-y-2">
                    <div className="w-6 h-6 border-2 border-[#153325] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-semibold">Loading day-by-day itinerary stops...</p>
                  </div>
                ) : (!selectedPackageModal.items || selectedPackageModal.items.length === 0) ? (
                  <div className="p-6 bg-[var(--bg-app,#FAF7F2)] rounded-2xl border border-[var(--border-app,#E8DFC8)] text-center text-[#5A534E] space-y-1">
                    <p className="font-serif font-bold text-sm text-[#153325]">Full Itinerary Briefing Upon Registration</p>
                    <p className="text-xs">
                      Daily timeline and sequence are managed directly by the Municipal Tourism Desk and certified local guides upon booking.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const grouped = (selectedPackageModal.items || []).reduce((acc, item) => {
                        const day = item.day_number || 1;
                        if (!acc[day]) acc[day] = [];
                        acc[day].push(item);
                        return acc;
                      }, {});

                      return Object.entries(grouped)
                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                        .map(([dayNum, itemsInDay]) => (
                          <div key={dayNum} className="border border-[var(--border-app,#E8DFC8)] rounded-2xl p-4 bg-[var(--bg-app,#FAF7F2)] space-y-3">
                            <div className="flex items-center justify-between border-b border-[var(--border-app,#E8DFC8)] pb-2">
                              <span className="px-3 py-1 bg-[#153325] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs">
                                <Calendar className="w-3.5 h-3.5 text-[#B88B2A]" /> Day {dayNum} Roadmap
                              </span>
                              <span className="text-[11px] font-semibold text-[#5A534E]">
                                {itemsInDay.length} Scheduled Stop{itemsInDay.length > 1 ? 's' : ''}
                              </span>
                            </div>

                            <div className="space-y-2.5 pt-1">
                              {itemsInDay.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-white p-3 rounded-xl border border-[var(--border-app,#E8DFC8)] flex items-start gap-3 shadow-2xs"
                                >
                                  {/* Activity Icon */}
                                  <div className="p-2 rounded-xl bg-slate-100 flex-shrink-0 text-slate-700 mt-0.5">
                                    {item.activity_type === 'ATTRACTION' && <MapPin className="w-4 h-4 text-emerald-700" />}
                                    {item.activity_type === 'HOMESTAY' && <Home className="w-4 h-4 text-amber-700" />}
                                    {item.activity_type === 'GUIDE' && <Compass className="w-4 h-4 text-sky-700" />}
                                    {item.activity_type === 'CUSTOM' && <Sparkles className="w-4 h-4 text-purple-700" />}
                                  </div>

                                  <div className="flex-grow min-w-0">
                                    <div className="flex flex-wrap items-center justify-between gap-1">
                                      <p className="font-bold text-[#153325] text-xs sm:text-sm truncate">
                                        {item.activity_type === 'ATTRACTION' && (item.attraction_name || 'Sightseeing Attraction')}
                                        {item.activity_type === 'HOMESTAY' && (item.homestay_name || 'Community Homestay Accommodation')}
                                        {item.activity_type === 'GUIDE' && `Accredited Guide: ${item.guide_name || 'Local Guide'}`}
                                        {item.activity_type === 'CUSTOM' && (item.custom_activity_name || 'Custom Activity')}
                                      </p>
                                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                                        {item.activity_type}
                                      </span>
                                    </div>

                                    {/* Subtitle / address */}
                                    {item.homestay_address && (
                                      <p className="text-[11px] text-[#5A534E] mt-0.5 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-[#B88B2A]" />
                                        {item.homestay_address}
                                      </p>
                                    )}

                                    {/* Notes */}
                                    {item.notes && (
                                      <p className="text-[11px] text-[#5A534E] italic mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        "{item.notes}"
                                      </p>
                                    )}

                                    {/* Quick Link if Attraction */}
                                    {item.activity_type === 'ATTRACTION' && item.attraction_name && (
                                      <div className="mt-2">
                                        <Link
                                          to={`/map?search=${encodeURIComponent(item.attraction_name)}`}
                                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline"
                                        >
                                          <MapPin className="w-3 h-3" />
                                          <span>Locate on Provincial Map</span>
                                        </Link>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                )}
              </div>

              {/* Eco-Tourism Guidelines */}
              <div className="p-4 bg-[#FAF7F2] border border-[#E8DFC8] rounded-2xl text-left space-y-2">
                <h4 className="text-xs font-bold text-[#153325] flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#B88B2A]" />
                  <span>Cordillera Eco-Tourism & Visitor Code</span>
                </h4>
                <ul className="text-xs text-[#5A534E] space-y-1 list-disc list-inside">
                  <li>Respect indigenous customs and Tingguian ancestral domains throughout the journey.</li>
                  <li>Practice "Leave No Trace" — carry your trash and plastic wrappers out.</li>
                  <li>Prepare Philippine Peso (PHP) in cash as cellular/ATM access may be limited on mountain trails.</li>
                  <li>Follow the instructions of your certified local municipal tour guide at all times.</li>
                </ul>
              </div>
            </div>

            {/* Modal Sticky Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-[var(--border-app,#E8DFC8)] bg-slate-50 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <button
                type="button"
                onClick={closePackageModal}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-[#5A534E] hover:text-[#232120] rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close Preview
              </button>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    closePackageModal();
                    openInquiry('PACKAGE', {
                      id: selectedPackageModal.id,
                      name: selectedPackageModal.title,
                      price: selectedPackageModal.price
                    });
                  }}
                  className="px-5 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#B88B2A]" />
                  <span>Book / Send Inquiry</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closePackageModal();
                    handleImportPackage(selectedPackageModal.id);
                  }}
                  disabled={importingPkgId === selectedPackageModal.id}
                  className="px-5 py-2.5 bg-[#153325] hover:bg-[#1D4433] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B88B2A]" />
                  <span>Save to Trip Planner</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MunicipalityDetails;
