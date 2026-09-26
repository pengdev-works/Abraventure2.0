import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import QRCode from 'qrcode';
import {
  Package, MapPin, Calendar, Users, Clock, Bus, CheckCircle2,
  XCircle, AlertCircle, ShieldCheck, ArrowLeft, Download, Share2,
  Upload, Check, Home, Compass, Phone, Mail, Award, DollarSign
} from 'lucide-react';
import SafeImage from '../../components/common/SafeImage';

const TourPackageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pkg, setPkg] = useState(null);
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
    fetchPackageDetails();
    fetchSchedules();
  }, [id]);

  const fetchPackageDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tour-packages/${id}`);
      const data = await res.json();
      if (res.ok && data.package) {
        setPkg(data.package);
        if (data.package.homestay_options && data.package.homestay_options.length > 0) {
          setSelectedHomestay(data.package.homestay_options[0]);
        }
      } else {
        Swal.fire('Error', 'Package not found', 'error');
        navigate('/tour-packages');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`/api/tour-packages/${id}/schedules`);
      const data = await res.json();
      if (data.schedules) {
        // filter open future schedules
        const valid = data.schedules.filter(s => s.status === 'OPEN' && s.available_slots > 0);
        setSchedules(valid);
        if (valid.length > 0) {
          setSelectedDate(valid[0].schedule_date?.split('T')[0] || valid[0].schedule_date);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Selected schedule object
  const activeSchedule = schedules.find(
    s => (s.schedule_date?.split('T')[0] || s.schedule_date) === selectedDate
  );

  const maxAvailableForDate = activeSchedule ? activeSchedule.available_slots : (pkg?.daily_capacity || 20);
  const pricePerPax = parseFloat(pkg?.price_per_pax || 0);
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
        travel_date: selectedDate,
        number_of_tourists: parseInt(numberOfTourists),
        transport_choice: selectedTransport,
        homestay_name: selectedHomestay || null,
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
        // Generate QR code
        try {
          const qr = await QRCode.toDataURL(data.booking.booking_reference, {
            width: 260,
            margin: 2,
            color: { dark: '#153325', light: '#FFFFFF' },
          });
          setQrCodeUrl(qr);
        } catch (qrErr) {
          console.error('QR generation error:', qrErr);
        }

        Swal.fire({
          title: 'Booking Confirmed!',
          text: `Booking Reference: ${data.booking.booking_reference}. Please save your QR verification pass.`,
          icon: 'success',
        });
      } else {
        Swal.fire('Booking Failed', data.message || 'Could not complete booking', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'An unexpected error occurred', 'error');
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
        Swal.fire('Uploaded!', 'Proof of payment submitted for Tourism Office verification.', 'success');
        setShowPaymentModal(false);
        setConfirmedBooking(prev => ({ ...prev, payment_status: 'PROOF_SUBMITTED' }));
      } else {
        Swal.fire('Upload Failed', data.message, 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to upload proof', 'error');
    } finally {
      setUploadingProof(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#153325] border-t-transparent"></div>
      </div>
    );
  }

  if (!pkg) return null;

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 text-[#2E3330]">
      {/* Top Banner Navigation */}
      <div className="bg-white border-b border-[#EBE5DA] py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/tour-packages"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#153325] hover:text-[#1E4D37] transition"
          >
            <ArrowLeft size={16} /> Back to Tour Packages
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-[#E7F3EC] text-[#1E6040] font-bold px-2.5 py-1 rounded-full border border-[#B2DBC3]">
              DOT Verified Package
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-96 w-full bg-stone-900">
        <SafeImage
          src={pkg.cover_image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80'}
          alt={pkg.title}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        <div className="absolute bottom-0 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 text-white">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-[#153325]/90 backdrop-blur-md text-[#A3F3CA] text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/20 flex items-center gap-1">
              <MapPin size={14} /> {pkg.municipality}, Abra
            </span>
            {pkg.package_type === 'MULTI_MUNICIPALITY' && (
              <span className="bg-[#2563EB]/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                🌐 Multi-Municipality Circuit
              </span>
            )}
            <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Clock size={14} /> {pkg.duration_days} Day(s) {pkg.duration_nights > 0 ? `· ${pkg.duration_nights} Night(s)` : ''}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-serif text-white tracking-tight mb-2">
            {pkg.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-stone-300">
            <span>Organized by: <strong className="text-white">{pkg.creator_name || `${pkg.municipality} Tourism Office`}</strong></span>
            <span>•</span>
            <span>Vehicle: <strong className="text-white">{pkg.transport_mode || 'Coordinated'}</strong></span>
            <span>•</span>
            <span>Max Group: <strong className="text-white">{pkg.max_pax} pax</strong></span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Information Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Card */}
            <div className="bg-white rounded-2xl border border-[#EBE5DA] p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-extrabold text-[#153325] mb-4 flex items-center gap-2">
                <Compass size={22} className="text-[#B88B2A]" /> Package Overview
              </h2>
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                {pkg.description || 'Join this curated package tour around the cultural and natural gems of Abra.'}
              </p>

              {/* Multi-municipality participating badges */}
              {pkg.package_type === 'MULTI_MUNICIPALITY' && Array.isArray(pkg.participating_municipalities) && pkg.participating_municipalities.length > 0 && (
                <div className="mt-6 pt-6 border-t border-stone-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
                    Participating Municipalities in this Circuit
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {pkg.participating_municipalities.map((m, idx) => {
                      const name = typeof m === 'string' ? m : m.municipality;
                      return (
                        <span key={idx} className="bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                          <MapPin size={13} /> {name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Itinerary Timeline */}
            <div className="bg-white rounded-2xl border border-[#EBE5DA] p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-extrabold text-[#153325] mb-6 flex items-center gap-2">
                <Calendar size={22} className="text-[#B88B2A]" /> Tour Itinerary
              </h2>

              {pkg.itinerary ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[#FAF8F5] rounded-xl border border-stone-200 text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                    {pkg.itinerary}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-stone-500 italic">
                  Detailed day-by-day itinerary will be provided upon booking confirmation.
                </div>
              )}
            </div>

            {/* Inclusions & Exclusions */}
            <div className="bg-white rounded-2xl border border-[#EBE5DA] p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-extrabold text-[#153325] mb-6 flex items-center gap-2">
                <ShieldCheck size={22} className="text-[#B88B2A]" /> Inclusions & Exclusions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600" /> What's Included
                  </h3>
                  {Array.isArray(pkg.inclusions) && pkg.inclusions.length > 0 ? (
                    <ul className="space-y-2 text-xs text-stone-700">
                      {pkg.inclusions.map((inc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-stone-500">Includes accredited tour guide, local entrance fees, and coordination.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <XCircle size={16} className="text-rose-600" /> What's Excluded
                  </h3>
                  {Array.isArray(pkg.exclusions) && pkg.exclusions.length > 0 ? (
                    <ul className="space-y-2 text-xs text-stone-700">
                      {pkg.exclusions.map((exc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-rose-500 font-bold">✕</span>
                          <span>{exc}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-stone-500">Personal souvenirs, optional tips, and personal travel insurance.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Homestays & Tour Guides */}
            <div className="bg-white rounded-2xl border border-[#EBE5DA] p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-extrabold text-[#153325] mb-4 flex items-center gap-2">
                <Home size={22} className="text-[#B88B2A]" /> Homestays & Accredited Guides
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-stone-200">
                  <div className="text-xs font-bold text-stone-800 mb-2 flex items-center gap-1.5">
                    <Home size={15} className="text-[#153325]" /> Verified Homestays
                  </div>
                  {Array.isArray(pkg.homestay_options) && pkg.homestay_options.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-stone-600">
                      {pkg.homestay_options.map((h, i) => (
                        <li key={i}>• {h}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-stone-500">Homestay arranged per municipal tourism guidelines.</p>
                  )}
                </div>

                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-stone-200">
                  <div className="text-xs font-bold text-stone-800 mb-2 flex items-center gap-1.5">
                    <Award size={15} className="text-[#B88B2A]" /> Accredited Local Guides
                  </div>
                  {Array.isArray(pkg.tour_guide_names) && pkg.tour_guide_names.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-stone-600">
                      {pkg.tour_guide_names.map((g, i) => (
                        <li key={i}>• {g}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-stone-500">Assigned DOT-accredited municipal tour guides.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Logistics & Meeting Points */}
            <div className="bg-white rounded-2xl border border-[#EBE5DA] p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-extrabold text-[#153325] mb-4 flex items-center gap-2">
                <Bus size={22} className="text-[#B88B2A]" /> Meeting & Transportation Points
              </h2>

              <div className="space-y-3 text-xs sm:text-sm text-stone-700">
                <div className="flex items-start gap-2">
                  <strong className="text-stone-900 w-32 shrink-0">Assembly Point:</strong>
                  <span>{pkg.meeting_point || 'Abra Provincial Capitol, Bangued'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <strong className="text-stone-900 w-32 shrink-0">Dropoff Point:</strong>
                  <span>{pkg.dropoff_point || 'Abra Provincial Capitol, Bangued'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <strong className="text-stone-900 w-32 shrink-0">Tourism Contact:</strong>
                  <span>{pkg.contact_person || 'Tourism Officer'} ({pkg.contact_number || 'Available on booking'})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Booking Card or Confirmation */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {!confirmedBooking ? (
                /* Booking Card */
                <div className="bg-white rounded-2xl border border-[#EBE5DA] p-6 shadow-md">
                  <div className="border-b border-stone-100 pb-4 mb-5">
                    <div className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Total Package Rate</div>
                    <div className="text-3xl font-black text-[#153325] mt-1">
                      ₱{pricePerPax.toLocaleString()}
                      <span className="text-xs font-normal text-stone-500"> / tourist</span>
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">
                      Daily capacity: <strong>{pkg.daily_capacity || 30} tourists</strong>
                    </div>
                  </div>

                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    {/* Schedule Date Selection */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        Select Travel Date *
                      </label>
                      {schedules.length > 0 ? (
                        <select
                          required
                          value={selectedDate}
                          onChange={e => setSelectedDate(e.target.value)}
                          className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 focus:outline-none focus:border-[#153325]"
                        >
                          {schedules.map(s => {
                            const dateStr = s.schedule_date?.split('T')[0] || s.schedule_date;
                            return (
                              <option key={s.id} value={dateStr}>
                                {new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} ({s.available_slots} slots left)
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
                          className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 focus:outline-none focus:border-[#153325]"
                        />
                      )}
                    </div>

                    {/* Number of Tourists */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-stone-700">Number of Tourists</label>
                        <span className="text-[10px] text-stone-500">Max {maxAvailableForDate} slots</span>
                      </div>
                      <div className="flex items-center border border-stone-300 rounded-xl bg-[#FAF8F5] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setNumberOfTourists(Math.max(1, numberOfTourists - 1))}
                          className="px-3 py-2 text-stone-600 hover:bg-stone-200 text-sm font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={maxAvailableForDate}
                          value={numberOfTourists}
                          onChange={e => setNumberOfTourists(Math.max(1, Math.min(maxAvailableForDate, parseInt(e.target.value) || 1)))}
                          className="w-full text-center bg-transparent text-xs font-bold text-stone-800 focus:outline-none py-2"
                        />
                        <button
                          type="button"
                          onClick={() => setNumberOfTourists(Math.min(maxAvailableForDate, numberOfTourists + 1))}
                          className="px-3 py-2 text-stone-600 hover:bg-stone-200 text-sm font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Transport Option */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        Transport Preference
                      </label>
                      <select
                        value={selectedTransport}
                        onChange={e => setSelectedTransport(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 focus:outline-none focus:border-[#153325]"
                      >
                        <option value="INCLUDED">Join Package Transport ({pkg.transport_mode || 'Jeepney/Van'})</option>
                        <option value="OWN_VEHICLE">Convoy with Own Vehicle</option>
                      </select>
                    </div>

                    {/* Homestay Option (if available) */}
                    {Array.isArray(pkg.homestay_options) && pkg.homestay_options.length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1.5">
                          Homestay Selection
                        </label>
                        <select
                          value={selectedHomestay}
                          onChange={e => setSelectedHomestay(e.target.value)}
                          className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 focus:outline-none focus:border-[#153325]"
                        >
                          {pkg.homestay_options.map((h, i) => (
                            <option key={i} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Special Requests */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        Special Requests / Dietary Needs
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Any allergies, senior citizens, or specific preferences..."
                        value={specialRequests}
                        onChange={e => setSpecialRequests(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl p-2 text-xs text-stone-800 focus:outline-none focus:border-[#153325]"
                      />
                    </div>

                    {/* Price Breakdown */}
                    <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-stone-200 space-y-1.5 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>₱{pricePerPax.toLocaleString()} × {numberOfTourists} tourist(s)</span>
                        <span>₱{totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-extrabold text-stone-900 pt-1.5 border-t border-stone-200 text-sm">
                        <span>Total Payable:</span>
                        <span className="text-[#153325]">₱{totalPrice.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="w-full bg-[#153325] text-white py-3 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider hover:bg-[#1E4D37] transition shadow-md flex items-center justify-center gap-2"
                    >
                      {bookingLoading ? (
                        <span>Processing Reservation...</span>
                      ) : (
                        <>
                          <CheckCircle2 size={16} /> Book Package Now
                        </>
                      )}
                    </button>

                    <p className="text-[10px] text-stone-400 text-center leading-tight">
                      Reservation requires Tourism Office confirmation & payment verification.
                    </p>
                  </form>
                </div>
              ) : (
                /* Post-Booking QR Confirmation Card */
                <div className="bg-white rounded-2xl border-2 border-[#1E6040] p-6 shadow-xl space-y-4 text-center">
                  <div className="w-12 h-12 bg-[#E7F3EC] text-[#1E6040] rounded-full flex items-center justify-center mx-auto">
                    <Check size={24} />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-[#E7F3EC] px-2.5 py-0.5 rounded-full">
                      Booking Registered
                    </span>
                    <h3 className="text-base font-extrabold text-stone-900 mt-2">
                      {confirmedBooking.booking_reference}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Travel Date: <strong>{confirmedBooking.travel_date?.split('T')[0]}</strong> ({confirmedBooking.number_of_tourists} Pax)
                    </p>
                  </div>

                  {/* QR Code Canvas */}
                  {qrCodeUrl && (
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 inline-block shadow-inner">
                      <img src={qrCodeUrl} alt="Booking QR Code" className="w-44 h-44 mx-auto rounded-lg" />
                      <div className="text-[10px] text-stone-400 font-mono mt-1">
                        Scan for on-site checkpoint verification
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-stone-600 bg-[#FAF8F5] p-3 rounded-xl text-left space-y-1">
                    <div><strong>Status:</strong> {confirmedBooking.status}</div>
                    <div><strong>Payment:</strong> {confirmedBooking.payment_status}</div>
                    <div><strong>Total:</strong> ₱{parseFloat(confirmedBooking.total_amount).toLocaleString()}</div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full bg-[#B88B2A] text-white py-2.5 px-4 rounded-xl text-xs font-bold hover:bg-[#946E1D] transition flex items-center justify-center gap-2"
                    >
                      <Upload size={14} /> Upload Payment Proof
                    </button>

                    <a
                      href={qrCodeUrl}
                      download={`Abra-Tour-QR-${confirmedBooking.booking_reference}.png`}
                      className="w-full border border-stone-300 text-stone-700 py-2 px-4 rounded-xl text-xs font-bold hover:bg-stone-50 transition flex items-center justify-center gap-2"
                    >
                      <Download size={14} /> Save QR Code
                    </a>

                    <Link
                      to="/dashboard/tourist"
                      className="block text-center text-xs text-[#153325] font-semibold hover:underline pt-1"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <h3 className="text-base font-extrabold text-[#153325]">
                Upload Proof of Payment
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-stone-400 hover:text-stone-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-stone-600 space-y-2">
              <p>Please send payment of <strong>₱{parseFloat(confirmedBooking?.total_amount || 0).toLocaleString()}</strong> via GCash or Landbank to:</p>
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 font-mono text-[11px] text-stone-800">
                <div><strong>GCash:</strong> 0917-555-ABRA (Abra Tourism Trust)</div>
                <div><strong>Reference:</strong> {confirmedBooking?.booking_reference}</div>
              </div>
            </div>

            <form onSubmit={handleUploadPaymentProof} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
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
                  className="w-full text-xs text-stone-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#153325] file:text-white hover:file:bg-[#1E4D37]"
                />
              </div>

              {proofPreview && (
                <div className="h-40 rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
                  <img src={proofPreview} alt="Receipt preview" className="w-full h-full object-contain" />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 border border-stone-300 text-stone-700 py-2.5 rounded-xl text-xs font-bold hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingProof || !proofFile}
                  className="flex-1 bg-[#153325] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#1E4D37] transition flex items-center justify-center gap-2"
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
