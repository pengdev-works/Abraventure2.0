import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import QRCode from 'qrcode';
import {
  Package, MapPin, Calendar, Users, Clock, Bus, CheckCircle2,
  XCircle, AlertCircle, ShieldCheck, ArrowLeft, Download, Share2,
  Upload, Check, Home, Compass, Phone, Mail, Award, DollarSign,
  ChevronRight, Sparkles, Navigation, Info, Eye
} from 'lucide-react';
import SafeImage from '../../components/common/SafeImage';

const TourPackageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pkg, setPkg] = useState(null);
  const [items, setItems] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [selectedDate, setSelectedDate] = useState('');
  const [numberOfTourists, setNumberOfTourists] = useState(1);
  const [selectedTransport, setSelectedTransport] = useState('INCLUDED');
  const [selectedHomestay, setSelectedHomestay] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Success Confirmation State
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  useEffect(() => {
    fetchPackageFullDetails();
  }, [id]);

  const fetchPackageFullDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tour-packages/${id}`);
      const data = await res.json();

      if (res.ok && data.package) {
        setPkg(data.package);
        setItems(data.items || []);
        setMunicipalities(data.municipalities || []);

        // Schedules from package details or separate fetch
        const schedList = (data.schedules || []).filter(
          s => (s.is_available !== false) && ((s.max_capacity - (s.reserved_count || 0)) > 0)
        );
        setSchedules(schedList);

        if (schedList.length > 0) {
          const firstDate = schedList[0].travel_date?.split('T')[0] || schedList[0].travel_date;
          setSelectedDate(firstDate);
        }

        if (data.package.homestay_options && data.package.homestay_options.length > 0) {
          setSelectedHomestay(data.package.homestay_options[0]);
        }
      } else {
        // Fallback to fetch schedules if not included
        Swal.fire('Error', data.message || 'Package not found', 'error');
        navigate('/tour-packages');
      }
    } catch (err) {
      console.error('Error fetching package details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Selected schedule object
  const activeSchedule = schedules.find(
    s => (s.travel_date?.split('T')[0] || s.travel_date) === selectedDate
  );

  const maxAvailableForDate = activeSchedule
    ? Math.max(1, (activeSchedule.max_capacity || 30) - (activeSchedule.reserved_count || 0))
    : (pkg?.max_capacity || pkg?.daily_capacity || 30);

  // Exact price calculation - handles DB column 'price' as well as 'price_per_pax'
  const pricePerPax = parseFloat(pkg?.price ?? pkg?.price_per_pax ?? 0);
  const totalPrice = pricePerPax * numberOfTourists;

  // Handle Booking Submit
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      Swal.fire({
        title: 'Sign In Required',
        text: 'Please log in as a tourist to book this tour package.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Sign In',
        confirmButtonColor: '#153325',
      }).then(r => {
        if (r.isConfirmed) navigate('/login');
      });
      return;
    }

    if (!selectedDate) {
      Swal.fire('Date Required', 'Please select an available travel date.', 'warning');
      return;
    }

    if (numberOfTourists > maxAvailableForDate) {
      Swal.fire('Slots Exceeded', `Only ${maxAvailableForDate} slots remaining for this date.`, 'warning');
      return;
    }

    setBookingLoading(true);
    try {
      const payload = {
        travelDate: selectedDate,
        travel_date: selectedDate,
        numberOfTourists: parseInt(numberOfTourists),
        number_of_tourists: parseInt(numberOfTourists),
        transportChoice: selectedTransport,
        transport_choice: selectedTransport,
        homestay_name: selectedHomestay || null,
        specialRequests: specialRequests || null,
        special_requests: specialRequests || null,
      };

      const res = await fetch(`/api/tour-packages/${id}/book`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.booking) {
        setConfirmedBooking(data.booking);
        // Generate QR code pass
        try {
          const qr = await QRCode.toDataURL(data.booking.booking_reference, {
            width: 280,
            margin: 2,
            color: { dark: '#153325', light: '#FFFFFF' },
          });
          setQrCodeUrl(qr);
        } catch (qrErr) {
          console.error('QR generation error:', qrErr);
        }

        Swal.fire({
          title: 'Booking Confirmed!',
          text: `Booking Reference: ${data.booking.booking_reference}. Your reservation has been registered with the Tourism Office.`,
          icon: 'success',
          confirmButtonColor: '#153325',
        });
      } else {
        Swal.fire('Booking Failed', data.message || 'Could not complete booking', 'error');
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      Swal.fire('Error', 'An unexpected network error occurred', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  // Upload Payment Proof
  const handleUploadPaymentProof = async (e) => {
    e.preventDefault();
    if (!proofFile || !confirmedBooking) return;

    setUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append('proof_image', proofFile);

      const res = await fetch(`/api/tour-packages/bookings/${confirmedBooking.id}/payment-proof`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          title: 'Receipt Submitted!',
          text: 'Proof of payment submitted for Tourism Office verification.',
          icon: 'success',
          confirmButtonColor: '#153325',
        });
        setShowPaymentModal(false);
        setConfirmedBooking(prev => ({ ...prev, payment_status: 'PROOF_SUBMITTED' }));
      } else {
        Swal.fire('Upload Failed', data.message || 'Could not upload payment proof', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to upload proof', 'error');
    } finally {
      setUploadingProof(false);
    }
  };

  // Parse Inclusions: handle string or array cleanly
  const parseInclusionsList = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      return raw
        .split(/[\n,;•]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    return [];
  };

  const inclusionsList = parseInclusionsList(pkg?.inclusions);
  const exclusionsList = parseInclusionsList(pkg?.exclusions);

  // Group items by day
  const groupedItems = items.reduce((acc, item) => {
    const day = item.day_number || 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-app,#FAF7F2)] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#153325] border-t-[#B88B2A] rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-[#5A534E] tracking-wider uppercase">Loading Tour Package...</p>
      </div>
    );
  }

  if (!pkg) return null;

  const municipalityDisplay = pkg.municipality_name || pkg.municipality || 'Abra';
  const coverImageSrc = pkg.image_url || pkg.cover_image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80';

  return (
    <div className="min-h-screen bg-[var(--bg-app,#FAF7F2)] text-[#2E3330] pb-24 transition-colors">
      {/* Top Breadcrumb & Return Bar */}
      <div className="bg-white dark:bg-[#162218] border-b border-[var(--border-app,#E8DFC8)] dark:border-[#223529] py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-[#5A534E] dark:text-[#96ADA0]">
            <Link
              to="/tour-packages"
              className="inline-flex items-center gap-1.5 font-bold text-[#153325] dark:text-[#E2EDE5] hover:text-[#B88B2A] transition-colors"
            >
              <ArrowLeft size={15} /> All Packages
            </Link>
            <ChevronRight size={13} className="text-stone-400" />
            <span className="text-[#B88B2A] font-semibold">{municipalityDisplay}</span>
            <ChevronRight size={13} className="text-stone-400" />
            <span className="truncate max-w-[220px] text-stone-700 dark:text-stone-300 font-medium">{pkg.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs bg-[#E7F3EC] dark:bg-[#1E302A] text-[#1E6040] dark:text-[#4AA87E] font-bold px-3 py-1 rounded-full border border-[#B2DBC3] dark:border-[#2E4A39]">
              <ShieldCheck size={14} className="text-[#1E6040] dark:text-[#4AA87E]" />
              DOT Verified Package
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Editorial Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden shadow-lg border border-[var(--border-app,#C7D7C9)] dark:border-[#223529] bg-[#0F2F25] min-h-[380px] sm:min-h-[460px] flex items-end">
          <SafeImage
            src={coverImageSrc}
            alt={pkg.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />

          {/* Hero Content Overlay */}
          <div className="relative z-10 p-6 sm:p-10 text-white w-full">
            <div className="flex flex-wrap gap-2.5 mb-3.5">
              <span className="bg-[#153325]/90 backdrop-blur-md text-[#A3F3CA] text-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-400/30 flex items-center gap-1.5 shadow-xs">
                <MapPin size={14} /> {municipalityDisplay}, Abra
              </span>

              {pkg.package_type === 'MULTI_MUNICIPALITY' ? (
                <span className="bg-[#2563EB]/90 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                  <Compass size={14} /> Multi-Municipality Circuit
                </span>
              ) : (
                <span className="bg-[#B88B2A]/90 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                  <Sparkles size={14} /> Municipal Curated Tour
                </span>
              )}

              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                <Clock size={14} /> {pkg.duration_days} Day{pkg.duration_days > 1 ? 's' : ''} {pkg.duration_nights > 0 ? `· ${pkg.duration_nights} Night(s)` : ''}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-serif text-white tracking-tight mb-3 drop-shadow-sm max-w-4xl">
              {pkg.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-stone-200 pt-1">
              <span className="flex items-center gap-1.5">
                <Award size={15} className="text-[#D4A942]" />
                Organized by: <strong className="text-white ml-1">{pkg.creator_name || `${municipalityDisplay} Tourism Office`}</strong>
              </span>
              <span className="hidden sm:inline text-white/40">•</span>
              <span className="flex items-center gap-1.5">
                <Bus size={15} className="text-[#D4A942]" />
                Vehicle: <strong className="text-white ml-1">{pkg.transport_option || pkg.transport_mode || 'Tourism Jeepney/Van'}</strong>
              </span>
              <span className="hidden sm:inline text-white/40">•</span>
              <span className="flex items-center gap-1.5">
                <Users size={15} className="text-[#D4A942]" />
                Capacity: <strong className="text-white ml-1">Up to {pkg.max_capacity || 30} tourists</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left 2 Columns: Itinerary, Details, Stops with Aligned Images */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Card */}
            <div className="bg-white dark:bg-[#162218] rounded-3xl border border-[var(--border-app,#C7D7C9)] dark:border-[#223529] p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-[#E8DFC8] dark:border-[#223529] pb-3">
                <h2 className="text-xl font-bold font-serif text-[#153325] dark:text-[#E2EDE5] flex items-center gap-2">
                  <Compass size={22} className="text-[#B88B2A]" />
                  Package Overview
                </h2>
                <span className="text-xs font-bold text-[#B88B2A] bg-[#FAF7F2] dark:bg-[#1E302A] px-3 py-1 rounded-full border border-[#E8DFC8] dark:border-[#2E4A39]">
                  Curated Itinerary
                </span>
              </div>

              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                {pkg.description || 'Experience the authentic nature, culture, and hospitality of Abra with this fully coordinated tour package.'}
              </p>

              {/* Multi-municipality participating badges */}
              {pkg.package_type === 'MULTI_MUNICIPALITY' && municipalities.length > 0 && (
                <div className="mt-6 pt-5 border-t border-[#E8DFC8] dark:border-[#223529]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">
                    Participating Municipalities in this Circuit
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {municipalities.map((m, idx) => (
                      <span
                        key={idx}
                        className="bg-[#EFF6FF] dark:bg-[#1E302A] text-[#1E40AF] dark:text-[#93C5FD] border border-[#BFDBFE] dark:border-[#2E4A39] text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                      >
                        <MapPin size={13} /> {m.municipality_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Day-by-Day Stops & Activities Timeline with Aligned Images */}
            <div className="bg-white dark:bg-[#162218] rounded-3xl border border-[var(--border-app,#C7D7C9)] dark:border-[#223529] p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-[#E8DFC8] dark:border-[#223529] pb-3">
                <h2 className="text-xl font-bold font-serif text-[#153325] dark:text-[#E2EDE5] flex items-center gap-2">
                  <Calendar size={22} className="text-[#B88B2A]" />
                  Day-by-Day Schedule & Stops
                </h2>
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                  {items.length > 0 ? `${items.length} stop(s) scheduled` : `${pkg.duration_days} Day(s)`}
                </span>
              </div>

              {items.length > 0 ? (
                <div className="space-y-6">
                  {Object.keys(groupedItems)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map(dayNum => {
                      const dayStops = groupedItems[dayNum];
                      return (
                        <div key={dayNum} className="space-y-3">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#153325] text-white text-xs font-bold shadow-2xs">
                            <Clock size={13} className="text-[#D4A942]" /> Day {dayNum} Program
                          </div>

                          <div className="space-y-3 pl-2 sm:pl-3 border-l-2 border-[#B88B2A]/40">
                            {dayStops.map((stop, sIdx) => {
                              const stopImage = stop.attraction_image || stop.guide_image || (stop.activity_type === 'HOMESTAY' ? coverImageSrc : null);
                              const stopTitle = stop.activity_type === 'ATTRACTION'
                                ? (stop.attraction_name || 'Attraction Visit')
                                : stop.activity_type === 'HOMESTAY'
                                ? (stop.homestay_name || 'Verified Homestay Stay')
                                : stop.activity_type === 'GUIDE'
                                ? `Accredited Guide: ${stop.guide_name || 'Local Guide'}`
                                : (stop.custom_activity_name || 'Tour Activity');

                              return (
                                <div
                                  key={stop.id || sIdx}
                                  className="bg-[#FAF7F2] dark:bg-[#1E2E24] rounded-2xl border border-[var(--border-app,#E8DFC8)] dark:border-[#2E4A39] p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all hover:border-[#153325] dark:hover:border-[#4AA87E]"
                                >
                                  {/* Stop Image Thumbnail - Uniform Aligned Container */}
                                  <div className="w-full sm:w-36 h-28 shrink-0 rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 relative shadow-2xs">
                                    {stopImage ? (
                                      <SafeImage
                                        src={stopImage}
                                        alt={stopTitle}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-stone-400 bg-stone-100 dark:bg-stone-800">
                                        {stop.activity_type === 'ATTRACTION' ? <Compass size={24} className="text-[#153325]" /> :
                                         stop.activity_type === 'HOMESTAY' ? <Home size={24} className="text-[#B88B2A]" /> :
                                         <Award size={24} className="text-[#153325]" />}
                                        <span className="text-[10px] font-semibold mt-1 text-stone-500 uppercase">
                                          {stop.activity_type}
                                        </span>
                                      </div>
                                    )}
                                    <span className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                                      Stop #{sIdx + 1}
                                    </span>
                                  </div>

                                  {/* Stop Information */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#153325] dark:text-[#A3F3CA] bg-[#153325]/10 dark:bg-[#A3F3CA]/15 px-2 py-0.5 rounded-md">
                                        {stop.activity_type}
                                      </span>
                                      {stop.time_slot && (
                                        <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                                          ⏰ {stop.time_slot.slice(0, 5)}
                                        </span>
                                      )}
                                      {stop.attraction_category && (
                                        <span className="text-[11px] text-[#B88B2A] font-semibold">
                                          • {stop.attraction_category}
                                        </span>
                                      )}
                                    </div>

                                    <h4 className="font-bold text-sm sm:text-base text-[#153325] dark:text-[#E2EDE5] leading-snug">
                                      {stopTitle}
                                    </h4>

                                    {stop.homestay_address && (
                                      <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                                        <MapPin size={12} /> {stop.homestay_address}
                                      </p>
                                    )}

                                    {stop.notes && (
                                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed bg-white/70 dark:bg-black/20 p-2 rounded-lg border border-stone-200/60 dark:border-stone-700/60">
                                        {stop.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="bg-[#FAF7F2] dark:bg-[#1E2E24] rounded-2xl border border-[var(--border-app,#E8DFC8)] dark:border-[#2E4A39] p-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#153325]/10 dark:bg-white/10 flex items-center justify-center mx-auto text-[#153325] dark:text-[#A3F3CA]">
                    <Compass size={24} />
                  </div>
                  <h3 className="font-bold text-sm text-[#153325] dark:text-[#E2EDE5]">
                    Coordinated Itinerary by {municipalityDisplay} Tourism Office
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300 max-w-lg mx-auto leading-relaxed">
                    This official {pkg.duration_days}-day itinerary coordinates accredited attractions, local transfers, and registered mountain guides. Detailed pickup schedule and guide contacts are provided upon reservation.
                  </p>
                </div>
              )}
            </div>

            {/* Inclusions & Exclusions */}
            <div className="bg-white dark:bg-[#162218] rounded-3xl border border-[var(--border-app,#C7D7C9)] dark:border-[#223529] p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-[#E8DFC8] dark:border-[#223529] pb-3">
                <h2 className="text-xl font-bold font-serif text-[#153325] dark:text-[#E2EDE5] flex items-center gap-2">
                  <ShieldCheck size={22} className="text-[#B88B2A]" />
                  What's Included & Excluded
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                    Inclusions
                  </h3>
                  {inclusionsList.length > 0 ? (
                    <ul className="space-y-2.5">
                      {inclusionsList.map((inc, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-300">
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm shrink-0">✓</span>
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-300">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>Accredited DOT Tour Guide coordination</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>Environmental and local entrance fees</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>Coordinated local jeepney/van transportation</span>
                      </li>
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                    <XCircle size={16} className="text-rose-600 dark:text-rose-400" />
                    Exclusions
                  </h3>
                  {exclusionsList.length > 0 ? (
                    <ul className="space-y-2.5">
                      {exclusionsList.map((exc, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-300">
                          <span className="text-rose-500 font-extrabold text-sm shrink-0">✕</span>
                          <span>{exc}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-300">
                      <li className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold">✕</span>
                        <span>Personal souvenirs and artisan crafts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold">✕</span>
                        <span>Meals and drinks outside scheduled itinerary</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold">✕</span>
                        <span>Personal travel and medical insurance</span>
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Logistics & Meeting Points */}
            <div className="bg-white dark:bg-[#162218] rounded-3xl border border-[var(--border-app,#C7D7C9)] dark:border-[#223529] p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold font-serif text-[#153325] dark:text-[#E2EDE5] mb-4 flex items-center gap-2">
                <Bus size={22} className="text-[#B88B2A]" />
                Meeting & Transportation Logistics
              </h2>

              <div className="space-y-3 text-xs sm:text-sm text-stone-700 dark:text-stone-300 bg-[#FAF7F2] dark:bg-[#1E2E24] p-4 sm:p-5 rounded-2xl border border-[var(--border-app,#E8DFC8)] dark:border-[#2E4A39]">
                <div className="flex items-start gap-3">
                  <strong className="text-stone-900 dark:text-white w-32 shrink-0">Assembly Point:</strong>
                  <span>{pkg.meeting_point || `${municipalityDisplay} Municipal Hall / Tourism Assistance Desk`}</span>
                </div>
                <div className="flex items-start gap-3">
                  <strong className="text-stone-900 dark:text-white w-32 shrink-0">Dropoff Point:</strong>
                  <span>{pkg.dropoff_point || 'Bangued Transport Terminal / Abra Provincial Capitol'}</span>
                </div>
                <div className="flex items-start gap-3">
                  <strong className="text-stone-900 dark:text-white w-32 shrink-0">Tourism Contact:</strong>
                  <span>{pkg.contact_person || `${municipalityDisplay} Tourism Officer`} ({pkg.contact_number || 'Available upon confirmed pass'})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Booking Card & Availability */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {!confirmedBooking ? (
                /* Booking Card */
                <div className="bg-white dark:bg-[#162218] rounded-3xl border border-[var(--border-app,#C7D7C9)] dark:border-[#223529] p-6 shadow-md text-left">
                  {/* Total Package Rate Highlight */}
                  <div className="border-b border-[#E8DFC8] dark:border-[#223529] pb-4 mb-5">
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">
                      Official Package Rate
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-[#153325] dark:text-[#A3F3CA] mt-1 font-serif">
                      ₱{pricePerPax.toLocaleString()}
                      <span className="text-xs font-normal text-stone-500 dark:text-stone-400"> / tourist</span>
                    </div>
                    <div className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 flex items-center justify-between">
                      <span>Daily capacity: <strong>{maxAvailableForDate} slots</strong></span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        DOT Regulated
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    {/* Schedule Date Selection */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                        Select Travel Date *
                      </label>
                      {schedules.length > 0 ? (
                        <select
                          required
                          value={selectedDate}
                          onChange={e => setSelectedDate(e.target.value)}
                          className="w-full bg-[#FAF7F2] dark:bg-[#1E2E24] border border-[var(--border-app,#C7D7C9)] dark:border-[#2E4A39] rounded-xl px-3 py-2.5 text-xs font-medium text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#153325]"
                        >
                          {schedules.map(s => {
                            const dateStr = s.travel_date?.split('T')[0] || s.travel_date;
                            const remaining = (s.max_capacity || 30) - (s.reserved_count || 0);
                            return (
                              <option key={s.id} value={dateStr}>
                                {new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} ({remaining} slot{remaining !== 1 ? 's' : ''} left)
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <input
                          required
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={selectedDate}
                          onChange={e => setSelectedDate(e.target.value)}
                          className="w-full bg-[#FAF7F2] dark:bg-[#1E2E24] border border-[var(--border-app,#C7D7C9)] dark:border-[#2E4A39] rounded-xl px-3 py-2.5 text-xs font-medium text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#153325]"
                        />
                      )}
                    </div>

                    {/* Number of Tourists Stepper */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Number of Tourists</label>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400">Max {maxAvailableForDate} slots</span>
                      </div>
                      <div className="flex items-center border border-[var(--border-app,#C7D7C9)] dark:border-[#2E4A39] rounded-xl bg-[#FAF7F2] dark:bg-[#1E2E24] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setNumberOfTourists(Math.max(1, numberOfTourists - 1))}
                          className="px-3.5 py-2 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 text-sm font-bold cursor-pointer transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={maxAvailableForDate}
                          value={numberOfTourists}
                          onChange={e => setNumberOfTourists(Math.max(1, Math.min(maxAvailableForDate, parseInt(e.target.value) || 1)))}
                          className="w-full text-center bg-transparent text-xs font-bold text-stone-800 dark:text-stone-100 focus:outline-none py-2"
                        />
                        <button
                          type="button"
                          onClick={() => setNumberOfTourists(Math.min(maxAvailableForDate, numberOfTourists + 1))}
                          className="px-3.5 py-2 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 text-sm font-bold cursor-pointer transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Transport Option */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                        Transportation Preference
                      </label>
                      <select
                        value={selectedTransport}
                        onChange={e => setSelectedTransport(e.target.value)}
                        className="w-full bg-[#FAF7F2] dark:bg-[#1E2E24] border border-[var(--border-app,#C7D7C9)] dark:border-[#2E4A39] rounded-xl px-3 py-2 text-xs font-medium text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#153325]"
                      >
                        <option value="INCLUDED">Join Package Transport ({pkg.transport_option || pkg.transport_mode || 'Tourism Jeepney/Van'})</option>
                        <option value="OWN">Convoy with Own Vehicle / Private</option>
                      </select>
                    </div>

                    {/* Homestay Selection if homestays available */}
                    {Array.isArray(pkg.homestay_options) && pkg.homestay_options.length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                          Assigned Homestay Option
                        </label>
                        <select
                          value={selectedHomestay}
                          onChange={e => setSelectedHomestay(e.target.value)}
                          className="w-full bg-[#FAF7F2] dark:bg-[#1E2E24] border border-[var(--border-app,#C7D7C9)] dark:border-[#2E4A39] rounded-xl px-3 py-2 text-xs font-medium text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#153325]"
                        >
                          {pkg.homestay_options.map((h, i) => (
                            <option key={i} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Special Requests */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                        Special Inquiries / Senior / Dietary
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Any senior citizens, children, or special dietary needs..."
                        value={specialRequests}
                        onChange={e => setSpecialRequests(e.target.value)}
                        className="w-full bg-[#FAF7F2] dark:bg-[#1E2E24] border border-[var(--border-app,#C7D7C9)] dark:border-[#2E4A39] rounded-xl p-2.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#153325] resize-none"
                      />
                    </div>

                    {/* Price Calculation Breakdown */}
                    <div className="bg-[#FAF7F2] dark:bg-[#1E2E24] p-4 rounded-2xl border border-[var(--border-app,#E8DFC8)] dark:border-[#2E4A39] space-y-2 text-xs">
                      <div className="flex justify-between text-stone-600 dark:text-stone-300">
                        <span>₱{pricePerPax.toLocaleString()} × {numberOfTourists} tourist{numberOfTourists > 1 ? 's' : ''}</span>
                        <span>₱{totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-extrabold text-stone-900 dark:text-white pt-2 border-t border-stone-200 dark:border-stone-700 text-sm">
                        <span>Total Package Payable:</span>
                        <span className="text-[#153325] dark:text-[#A3F3CA] text-base font-serif">
                          ₱{totalPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Book Now Button */}
                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="w-full bg-[#153325] hover:bg-[#1D4433] text-white py-3.5 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {bookingLoading ? (
                        <span>Submitting Reservation...</span>
                      ) : (
                        <>
                          <CheckCircle2 size={16} /> Book Package Now
                        </>
                      )}
                    </button>

                    <p className="text-[10px] text-stone-500 dark:text-stone-400 text-center leading-tight">
                      Official reservation issued under Provincial Tourism Office guidelines.
                    </p>
                  </form>
                </div>
              ) : (
                /* Post-Booking QR Confirmation Card */
                <div className="bg-white dark:bg-[#162218] rounded-3xl border-2 border-[#1E6040] p-6 shadow-xl space-y-4 text-center">
                  <div className="w-12 h-12 bg-[#E7F3EC] dark:bg-[#1E302A] text-[#1E6040] dark:text-[#4AA87E] rounded-full flex items-center justify-center mx-auto">
                    <Check size={24} />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-[#E7F3EC] dark:bg-[#1E302A] px-2.5 py-0.5 rounded-full">
                      Booking Registered
                    </span>
                    <h3 className="text-base font-extrabold text-stone-900 dark:text-white mt-2 font-mono">
                      {confirmedBooking.booking_reference}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                      Travel Date: <strong>{confirmedBooking.travel_date?.split('T')[0]}</strong> ({confirmedBooking.number_of_tourists} Pax)
                    </p>
                  </div>

                  {/* QR Code Canvas */}
                  {qrCodeUrl && (
                    <div className="p-3 bg-white rounded-2xl border border-stone-200 dark:border-stone-700 inline-block shadow-inner">
                      <img src={qrCodeUrl} alt="Booking QR Code" className="w-48 h-48 mx-auto rounded-lg" />
                      <div className="text-[10px] text-stone-500 font-mono mt-1">
                        Scan for on-site checkpoint verification
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-stone-700 dark:text-stone-300 bg-[#FAF7F2] dark:bg-[#1E2E24] p-3.5 rounded-2xl text-left space-y-1.5 border border-[var(--border-app,#E8DFC8)] dark:border-[#2E4A39]">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Status:</span>
                      <strong className="text-[#153325] dark:text-[#A3F3CA]">{confirmedBooking.status}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Payment:</span>
                      <strong className="text-[#B88B2A]">{confirmedBooking.payment_status}</strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-stone-200 dark:border-stone-700">
                      <span className="font-bold">Total Amount:</span>
                      <strong className="font-serif text-sm">₱{parseFloat(confirmedBooking.total_amount).toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full bg-[#B88B2A] hover:bg-[#946E1D] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Upload size={14} /> Upload Payment Proof
                    </button>

                    <a
                      href={qrCodeUrl}
                      download={`Abra-Tour-QR-${confirmedBooking.booking_reference}.png`}
                      className="w-full border border-[var(--border-app,#C7D7C9)] dark:border-[#2E4A39] text-stone-700 dark:text-stone-200 py-2 px-4 rounded-xl text-xs font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition flex items-center justify-center gap-2"
                    >
                      <Download size={14} /> Save QR Code Pass
                    </a>

                    <Link
                      to="/dashboard/tourist"
                      className="block text-center text-xs text-[#153325] dark:text-[#A3F3CA] font-semibold hover:underline pt-1"
                    >
                      Go to Tourist Dashboard →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Proof Upload Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#162218] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-[var(--border-app,#C7D7C9)] dark:border-[#223529]">
            <div className="flex justify-between items-center border-b border-[#E8DFC8] dark:border-[#223529] pb-3">
              <h3 className="text-base font-extrabold text-[#153325] dark:text-[#E2EDE5] font-serif">
                Upload Proof of Payment
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-stone-600 dark:text-stone-300 space-y-2">
              <p>
                Please settle payment of <strong>₱{parseFloat(confirmedBooking?.total_amount || 0).toLocaleString()}</strong> via GCash or Landbank:
              </p>
              <div className="bg-[#FAF7F2] dark:bg-[#1E2E24] p-3 rounded-xl border border-[var(--border-app,#E8DFC8)] dark:border-[#2E4A39] font-mono text-[11px] text-stone-800 dark:text-stone-200 space-y-1">
                <div><strong>GCash:</strong> 0917-555-ABRA (Abra Tourism Trust)</div>
                <div><strong>Reference:</strong> {confirmedBooking?.booking_reference}</div>
              </div>
            </div>

            <form onSubmit={handleUploadPaymentProof} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Payment Receipt / Screenshot *
                </label>
                <input
                  required
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      setProofFile(file);
                      setProofPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full text-xs text-stone-600 dark:text-stone-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#153325] file:text-white hover:file:bg-[#1E4D37] cursor-pointer"
                />
              </div>

              {proofPreview && (
                <div className="h-44 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900">
                  <img src={proofPreview} alt="Receipt preview" className="w-full h-full object-contain" />
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 border border-[var(--border-app,#C7D7C9)] dark:border-[#2E4A39] text-stone-700 dark:text-stone-200 py-2.5 rounded-xl text-xs font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingProof || !proofFile}
                  className="flex-1 bg-[#153325] hover:bg-[#1D4433] text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {uploadingProof ? 'Uploading...' : 'Submit Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourPackageDetail;
