import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  Landmark, 
  Home as HomeIcon, 
  Award, 
  MessageSquare, 
  ListTodo, 
  MapPin, 
  Tag, 
  Send, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  X, 
  Users, 
  Sparkles, 
  Package, 
  Compass,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ItineraryPlanner = () => {
  const { token } = useAuth();
  
  const [itineraries, setItineraries] = useState([]);
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [itinDetails, setItinDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State for creating itinerary
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [mobileTab, setMobileTab] = useState('timeline'); // 'library' or 'timeline'

  // Form State for adding item
  const [selectedDay, setSelectedDay] = useState(1);
  const [activityType, setActivityType] = useState('ATTRACTION'); // 'ATTRACTION', 'HOMESTAY', 'GUIDE', 'CUSTOM'
  const [timeSlot, setTimeSlot] = useState('08:00');
  const [notes, setNotes] = useState('');
  const [customActivityName, setCustomActivityName] = useState('');
  
  // Available lists for selections (fetched from database)
  const [attractions, setAttractions] = useState([]);
  const [homestays, setHomestays] = useState([]);
  const [guides, setGuides] = useState([]);
  
  const [targetId, setTargetId] = useState('');

  // My existing inquiries (for status badges)
  const [myInquiries, setMyInquiries] = useState([]);

  // Inquiry Modal state
  const [inquiryModal, setInquiryModal] = useState(null);
  const [modalForm, setModalForm] = useState({ message: '', numberOfGuests: 1, startDate: '', endDate: '' });
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Import Municipal Package state
  const [showPackageImportModal, setShowPackageImportModal] = useState(false);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [importingPkgId, setImportingPkgId] = useState(null);

  const fetchAvailablePackages = async () => {
    try {
      const res = await fetch('/api/packages');
      if (res.ok) setAvailablePackages(await res.json());
    } catch (err) {
      console.error('Error fetching packages for import:', err);
    }
  };

  const handleOpenPackageImportModal = async () => {
    setShowPackageImportModal(true);
    await fetchAvailablePackages();
  };

  const handleImportPackageDirect = async (packageId) => {
    if (!token) return;
    setImportingPkgId(packageId);
    try {
      const res = await fetch(`/api/packages/${packageId}/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok) {
        setShowPackageImportModal(false);
        await fetchItineraries();
        if (data.itinerary) {
          setSelectedItinerary(data.itinerary);
        }
      } else {
        alert(data.message || 'Failed to import package.');
      }
    } catch (err) {
      console.error(err);
      alert('Error importing package.');
    } finally {
      setImportingPkgId(null);
    }
  };

  // Fetch all itineraries for the tourist
  const fetchItineraries = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/itineraries', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setItineraries(data);
        if (data.length > 0 && !selectedItinerary) {
          setSelectedItinerary(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching itineraries:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch details for the selected itinerary
  const fetchItineraryDetails = async (itinId) => {
    if (!token || !itinId) return;
    try {
      const response = await fetch(`/api/itineraries/${itinId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setItinDetails(data);
      }
    } catch (err) {
      console.error('Error fetching itinerary details:', err);
    }
  };

  // Fetch all listings to populate selection dropdowns
  const fetchAllListings = async () => {
    try {
      const response = await fetch('/api/municipalities');
      if (response.ok) {
        const municipalities = await response.json();
        let allAttractions = [];
        let allHomestays = [];
        let allGuides = [];

        for (const m of municipalities) {
          const detailRes = await fetch(`/api/municipalities/${m.id}`);
          if (detailRes.ok) {
            const details = await detailRes.json();
            allAttractions = [...allAttractions, ...details.attractions.map(a => ({ ...a, municipality_name: m.name }))];
            allHomestays = [...allHomestays, ...details.homestays.map(h => ({ ...h, municipality_name: m.name }))];
            allGuides = [...allGuides, ...details.guides.map(g => ({ ...g, municipality_name: m.name }))];
          }
        }
        setAttractions(allAttractions);
        setHomestays(allHomestays);
        setGuides(allGuides);
      }
    } catch (err) {
      console.error('Error fetching listings for dropdowns:', err);
    }
  };

  // Fetch all tourist's existing inquiries
  const fetchMyInquiries = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/inquiries', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyInquiries(data);
      }
    } catch (err) {
      console.error('Error fetching inquiries:', err);
    }
  };

  const getItemBookingStatus = (item) => {
    if (item.activity_type === 'HOMESTAY' && item.homestay_id) {
      const match = myInquiries.find((inq) => inq.homestay_id === item.homestay_id);
      return match ? { status: match.status, inquiry: match } : null;
    }
    if (item.activity_type === 'GUIDE' && item.guide_id) {
      const match = myInquiries.find((inq) => inq.guide_id === item.guide_id);
      return match ? { status: match.status, inquiry: match } : null;
    }
    return null;
  };

  const handleOpenInquiryModal = (item) => {
    setInquiryModal({
      itemId: item.id,
      itemName: item.activity_type === 'HOMESTAY' ? item.homestay_name : item.guide_name,
      homestayId: item.activity_type === 'HOMESTAY' ? item.homestay_id : null,
      guideId: item.activity_type === 'GUIDE' ? item.guide_id : null,
    });
    setModalForm({
      message: '',
      numberOfGuests: 1,
      startDate: selectedItinerary?.start_date ? selectedItinerary.start_date.substring(0, 10) : '',
      endDate: selectedItinerary?.end_date ? selectedItinerary.end_date.substring(0, 10) : '',
    });
    setModalError('');
    setModalSuccess('');
  };

  const handleSubmitInquiry = async (e) => {
    e.preventDefault();
    if (!modalForm.message.trim()) {
      setModalError('Please enter a message for the operator.');
      return;
    }
    setModalSubmitting(true);
    setModalError('');
    try {
      const formData = new FormData();
      if (inquiryModal.homestayId) formData.append('homestayId', inquiryModal.homestayId);
      if (inquiryModal.guideId) formData.append('guideId', inquiryModal.guideId);
      if (modalForm.startDate) formData.append('startDate', modalForm.startDate);
      if (modalForm.endDate) formData.append('endDate', modalForm.endDate);
      formData.append('numberOfGuests', modalForm.numberOfGuests);
      formData.append('message', modalForm.message);

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setModalError(data.message || 'Failed to send inquiry. Please try again.');
      } else {
        setModalSuccess('Inquiry sent successfully! The operator will reply soon.');
        await fetchMyInquiries();
        setTimeout(() => {
          setInquiryModal(null);
          setModalSuccess('');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setModalError('Network error. Please check your connection.');
    } finally {
      setModalSubmitting(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchItineraries();
      fetchAllListings();
      fetchMyInquiries();
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (selectedItinerary) {
      fetchItineraryDetails(selectedItinerary.id);
    }
  }, [selectedItinerary]);

  const handleCreateItinerary = async (e) => {
    e.preventDefault();
    if (!title) return;

    try {
      const response = await fetch('/api/itineraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, startDate, endDate })
      });

      if (response.ok) {
        const newItin = await response.json();
        setTitle('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setShowCreateForm(false);
        await fetchItineraries();
        setSelectedItinerary(newItin.itinerary);
      }
    } catch (err) {
      console.error('Error creating itinerary:', err);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!selectedItinerary) return;

    const payload = {
      itineraryId: selectedItinerary.id,
      dayNumber: parseInt(selectedDay),
      timeSlot: timeSlot ? `${timeSlot}:00` : null,
      activityType,
      notes,
      attractionId: activityType === 'ATTRACTION' ? targetId : null,
      homestayId: activityType === 'HOMESTAY' ? targetId : null,
      guideId: activityType === 'GUIDE' ? targetId : null,
      customActivityName: activityType === 'CUSTOM' ? customActivityName : null
    };

    try {
      const response = await fetch('/api/itineraries/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setNotes('');
        setCustomActivityName('');
        setTargetId('');
        fetchItineraryDetails(selectedItinerary.id);
      }
    } catch (err) {
      console.error('Error adding itinerary item:', err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      const response = await fetch(`/api/itineraries/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchItineraryDetails(selectedItinerary.id);
      }
    } catch (err) {
      console.error('Error deleting itinerary item:', err);
    }
  };

  const handleDeleteItinerary = async (itinId) => {
    if (!window.confirm('Are you sure you want to remove this travel itinerary?')) return;
    try {
      const response = await fetch(`/api/itineraries/${itinId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSelectedItinerary(null);
        setItinDetails(null);
        fetchItineraries();
      }
    } catch (err) {
      console.error('Error deleting itinerary:', err);
    }
  };

  if (!token) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center min-h-[calc(100vh-16rem)] flex flex-col justify-center items-center">
        <div className="w-16 h-16 rounded-full bg-[#153325]/10 text-[#153325] flex items-center justify-center mb-6">
          <Compass className="w-8 h-8" />
        </div>
        <p className="text-xs uppercase tracking-[0.25em] text-[#B88B2A] font-semibold mb-3">Official Abra Expedition Planner</p>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#153325] font-bold mb-4">
          Plan Your Custom Abra Journey
        </h1>
        <p className="text-sm text-[#5A534E] leading-relaxed max-w-lg mb-8">
          Organize day-by-day schedules across all 27 municipalities. Pin heritage sites, coordinate with DOT-accredited homestays, and hire licensed local tour guides directly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link to="/login" className="btn-editorial-primary px-7 py-3 text-xs tracking-wider">
            Sign In to Access Planner
          </Link>
          <Link to="/municipalities" className="btn-editorial-outline px-6 py-3 text-xs">
            Browse 27 Municipalities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[calc(100vh-16rem)]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 mb-8 border-b border-[#E8DFC8] gap-6">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#B88B2A] font-semibold block mb-2">
            PROVINCE OF ABRA • TOURIST EXPEDITION BUILDER
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#153325]">
            Custom Travel Itinerary
          </h1>
          <p className="text-xs text-[#5A534E] mt-1.5 max-w-2xl leading-relaxed">
            Organize scheduled waypoints across Abra, book accredited accommodations, and link with licensed guides for your expedition.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleOpenPackageImportModal}
            className="btn-editorial-gold px-4 py-2.5 text-xs tracking-wider flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4" /> Import Municipal Package
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-editorial-primary px-4 py-2.5 text-xs tracking-wider flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> {showCreateForm ? 'Close Form' : 'New Expedition'}
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher (Visible on small screens) */}
      <div className="lg:hidden flex bg-[#FAF7F2] p-1 rounded-xl border border-[#E8DFC8] mb-6">
        <button
          type="button"
          onClick={() => setMobileTab('library')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 touch-target ${
            mobileTab === 'library'
              ? 'bg-[#153325] text-white shadow-xs'
              : 'text-[#5A534E] hover:text-[#153325]'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span>My Expeditions ({itineraries.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('timeline')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 touch-target ${
            mobileTab === 'timeline'
              ? 'bg-[#153325] text-white shadow-xs'
              : 'text-[#5A534E] hover:text-[#153325]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Active Timeline</span>
        </button>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Itinerary Library & Create Form */}
        <div className={`lg:col-span-4 space-y-6 ${mobileTab === 'library' ? 'block' : 'hidden lg:block'}`}>
          {/* Create Itinerary Form */}
          {showCreateForm && (
            <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#DCD5C9] shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8DFC8]">
                <h3 className="font-serif text-base font-bold text-[#153325]">Create New Expedition</h3>
                <span className="text-[10px] uppercase font-semibold text-[#B88B2A] tracking-wider">Step 1 of 2</span>
              </div>
              <form onSubmit={handleCreateItinerary} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#232120] mb-1">Trip Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3-Day Tineg Falls & Highlands"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DCD5C9] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325] focus:ring-1 focus:ring-[#153325]/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#232120] mb-1">Expedition Notes</label>
                  <textarea
                    rows="2"
                    placeholder="Brief objective, group members, or special requirements..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#DCD5C9] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325] focus:ring-1 focus:ring-[#153325]/10"
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5A534E] mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DCD5C9] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5A534E] mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DCD5C9] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 btn-editorial-primary text-xs tracking-wider cursor-pointer"
                >
                  Create Expedition Plan
                </button>
              </form>
            </div>
          )}

          {/* List of Saved Itineraries */}
          <div className="bg-white rounded-2xl border border-[#E8DFC8] shadow-xs p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F3ECE0]">
              <h3 className="font-serif text-base font-bold text-[#153325] flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-[#B88B2A]" /> Saved Expeditions
              </h3>
              <span className="text-[10px] font-bold text-[#5A534E] bg-[#F3ECE0] px-2 py-0.5 rounded-full">
                {itineraries.length} Total
              </span>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-xs text-[#5A534E] gap-2">
                <span className="w-5 h-5 border-2 border-[#153325] border-t-transparent rounded-full animate-spin"></span>
                <span>Loading your plans...</span>
              </div>
            ) : itineraries.length === 0 ? (
              <div className="py-8 text-center text-[#5A534E] text-xs">
                <Compass className="w-8 h-8 mx-auto text-[#DCD5C9] mb-2" />
                <p className="font-medium text-[#232120]">No trips created yet.</p>
                <p className="text-[11px] mt-1 text-[#5A534E]">Click "New Expedition" or "Import Municipal Package" to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {itineraries.map((itin) => {
                  const isSelected = selectedItinerary?.id === itin.id;
                  return (
                    <div
                      key={itin.id}
                      onClick={() => {
                        setSelectedItinerary(itin);
                        setMobileTab('timeline');
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#153325] bg-[#FAF7F2] shadow-xs ring-1 ring-[#153325]/15'
                          : 'border-[#E8DFC8] bg-white hover:border-[#B88B2A] hover:bg-[#FAF7F2]/50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-serif font-bold text-[#153325] text-sm line-clamp-1">
                            {itin.title}
                          </h4>
                          {itin.description && (
                            <p className="text-[11px] text-[#5A534E] line-clamp-1 mt-0.5">{itin.description}</p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItinerary(itin.id);
                          }}
                          className="text-[#9E978E] hover:text-red-700 p-1 rounded hover:bg-[#F3ECE0] transition-colors"
                          title="Delete trip"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#E8DFC8]/60 text-[10px]">
                        <span className="font-semibold text-[#5A534E] flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#B88B2A]" />
                          {itin.start_date ? new Date(itin.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible dates'}
                        </span>
                        {isSelected && (
                          <span className="text-[#153325] font-bold uppercase tracking-wider flex items-center gap-1">
                            Active Plan <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Expedition Timeline & Activity Builder */}
        <div className={`lg:col-span-8 space-y-6 ${mobileTab === 'timeline' ? 'block' : 'hidden lg:block'}`}>
          {selectedItinerary ? (
            <div className="space-y-6">
              {/* Trip Header Banner */}
              <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#DCD5C9] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#B88B2A] block mb-1">
                    Selected Itinerary
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-[#153325]">{selectedItinerary.title}</h2>
                  <p className="text-xs text-[#5A534E] mt-1 leading-relaxed max-w-xl">
                    {selectedItinerary.description || 'Custom curated expedition schedule across Abra province.'}
                  </p>
                </div>
                {selectedItinerary.start_date && (
                  <div className="bg-white px-4 py-2.5 rounded-xl border border-[#E8DFC8] flex-shrink-0 text-right md:text-left">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#5A534E] block">Expedition Window</span>
                    <span className="text-xs font-bold text-[#153325]">
                      {new Date(selectedItinerary.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      {selectedItinerary.end_date ? ` — ${new Date(selectedItinerary.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Add Activity or Waypoint to this Itinerary */}
              <div className="bg-white p-6 rounded-2xl border border-[#E8DFC8] shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F3ECE0]">
                  <h3 className="font-serif text-base font-bold text-[#153325] flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#B88B2A]" /> Add Activity or Destination Waypoint
                  </h3>
                  <span className="text-[11px] text-[#5A534E]">Select from accredited directory or add custom note</span>
                </div>

                <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Day Number */}
                  <div>
                    <label className="block text-xs font-semibold text-[#232120] mb-1">Day of Expedition</label>
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#DCD5C9] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325] focus:bg-white"
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                        <option key={d} value={d}>
                          Day {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time Slot */}
                  <div>
                    <label className="block text-xs font-semibold text-[#232120] mb-1">Target Time / Slot</label>
                    <input
                      type="time"
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#DCD5C9] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325] focus:bg-white"
                    />
                  </div>

                  {/* Activity Type */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[#232120] mb-1.5">Activity Classification</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: 'ATTRACTION', label: 'Attraction / Site', icon: Landmark },
                        { key: 'HOMESTAY', label: 'Homestay Stay', icon: HomeIcon },
                        { key: 'GUIDE', label: 'Tour Guide', icon: Award },
                        { key: 'CUSTOM', label: 'Custom Note', icon: Tag },
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const active = activityType === tab.key;
                        return (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => {
                              setActivityType(tab.key);
                              setTargetId('');
                              setCustomActivityName('');
                            }}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                              active
                                ? 'bg-[#153325] text-white border-[#153325]'
                                : 'bg-[#FAF7F2] text-[#5A534E] border-[#DCD5C9] hover:bg-white'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic target dropdown */}
                  {activityType === 'ATTRACTION' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-[#232120] mb-1">Select Natural or Heritage Attraction</label>
                      <select
                        required
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DCD5C9] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325] focus:bg-white"
                      >
                        <option value="">-- Choose Attraction in Abra --</option>
                        {attractions.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.municipality_name}) — {a.category}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {activityType === 'HOMESTAY' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-[#232120] mb-1">Select Verified Homestay Accommodation</label>
                      <select
                        required
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DCD5C9] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325] focus:bg-white"
                      >
                        <option value="">-- Choose Accredited Homestay --</option>
                        {homestays.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({h.municipality_name})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {activityType === 'GUIDE' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-[#232120] mb-1">Select Licensed Tour Guide</label>
                      <select
                        required
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DCD5C9] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325] focus:bg-white"
                      >
                        <option value="">-- Choose Accredited Guide --</option>
                        {guides.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.guide_name} ({g.languages_spoken || 'English / Ilocano / Itneg'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {activityType === 'CUSTOM' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-[#232120] mb-1">Custom Activity Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lunch stopover in Bangued Town Plaza, Abra River bamboo raft"
                        value={customActivityName}
                        onChange={(e) => setCustomActivityName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DCD5C9] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325] focus:bg-white"
                      />
                    </div>
                  )}

                  {/* Notes / Special Instructions */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[#232120] mb-1">Notes & Gear Checklist</label>
                    <input
                      type="text"
                      placeholder="e.g. Early departure required; bring waterproof dry bag for Kaparkan travertine pools..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#DCD5C9] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325] focus:bg-white"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end pt-1">
                    <button
                      type="submit"
                      className="btn-editorial-primary px-6 py-2.5 text-xs tracking-wider cursor-pointer"
                    >
                      Add Waypoint to Itinerary
                    </button>
                  </div>
                </form>
              </div>

              {/* Day-by-Day Timeline */}
              <div className="space-y-8">
                {itinDetails && itinDetails.items.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-[#E8DFC8] p-8">
                    <Clock className="w-10 h-10 mx-auto text-[#DCD5C9] mb-3" />
                    <p className="font-serif font-bold text-base text-[#153325]">Expedition Schedule is Empty</p>
                    <p className="text-xs text-[#5A534E] mt-1 max-w-sm mx-auto">
                      Add destinations, accommodation stops, and guided tours using the form above to build out your travel timeline.
                    </p>
                  </div>
                ) : (
                  <div>
                    {Array.from(new Set(itinDetails?.items.map(item => item.day_number))).sort((a, b) => a - b).map((dayNum) => (
                      <div key={dayNum} className="mb-10 last:mb-0">
                        {/* Day Section Header */}
                        <div className="flex items-center gap-3 mb-5">
                          <span className="font-serif text-lg font-bold text-[#153325] bg-[#FAF7F2] px-4 py-1.5 rounded-lg border border-[#E8DFC8]">
                            Day 0{dayNum} Waypoints
                          </span>
                          <div className="h-[1px] bg-[#E8DFC8] flex-grow"></div>
                        </div>
                        
                        {/* Timeline Spine */}
                        <div className="space-y-4 relative border-l-2 border-[#DCD5C9] pl-6 ml-4">
                          {itinDetails?.items.filter(item => item.day_number === dayNum).map((item) => {
                            const timeFormatted = item.time_slot ? item.time_slot.substring(0, 5) : 'Anytime';
                            const bookingInfo = getItemBookingStatus(item);
                            const isBookable = item.activity_type === 'HOMESTAY' || item.activity_type === 'GUIDE';

                            const statusBadge = bookingInfo ? (
                              {
                                PENDING: (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF7F2] text-[#B88B2A] border border-[#B88B2A]/30">
                                    <Clock className="w-3 h-3" /> PENDING INQUIRY
                                  </span>
                                ),
                                CONFIRMED: (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#153325]/10 text-[#153325] border border-[#153325]/30">
                                    <CheckCircle2 className="w-3 h-3" /> CONFIRMED
                                  </span>
                                ),
                                RESPONDED: (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#355C6D]/10 text-[#355C6D] border border-[#355C6D]/30">
                                    <MessageSquare className="w-3 h-3" /> RESPONDED
                                  </span>
                                ),
                                CANCELLED: (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                    <XCircle className="w-3 h-3" /> CANCELLED
                                  </span>
                                ),
                              }[bookingInfo.status] || null
                            ) : null;

                            return (
                              <div key={item.id} className="relative bg-white p-5 rounded-2xl border border-[#E8DFC8] shadow-2xs hover:shadow-xs transition-shadow">
                                {/* Bullet indicator on line */}
                                <div className="absolute -left-[31px] top-6 w-3 h-3 bg-[#B88B2A] rounded-full border-2 border-white shadow-xs"></div>

                                <div className="flex items-start gap-4">
                                  {/* Icon depending on activity type */}
                                  <div className="p-3 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl text-[#153325] flex-shrink-0">
                                    {item.activity_type === 'ATTRACTION' && <Landmark className="w-5 h-5" />}
                                    {item.activity_type === 'HOMESTAY' && <HomeIcon className="w-5 h-5 text-[#B88B2A]" />}
                                    {item.activity_type === 'GUIDE' && <Award className="w-5 h-5 text-[#355C6D]" />}
                                    {item.activity_type === 'CUSTOM' && <Tag className="w-5 h-5 text-[#5A534E]" />}
                                  </div>

                                  <div className="flex-grow">
                                    <div className="flex justify-between items-start gap-2">
                                      <div>
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-[#FAF7F2] text-[#5A534E] border border-[#E8DFC8]">
                                            {item.activity_type === 'ATTRACTION' && 'Heritage / Attraction'}
                                            {item.activity_type === 'HOMESTAY' && 'Accredited Homestay'}
                                            {item.activity_type === 'GUIDE' && 'Tour Guide'}
                                            {item.activity_type === 'CUSTOM' && 'Custom Activity'}
                                          </span>
                                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5A534E]">
                                            <Clock className="w-3 h-3 text-[#B88B2A]" /> {timeFormatted}
                                          </span>
                                        </div>
                                        <h4 className="font-serif font-bold text-[#153325] text-base">
                                          {item.activity_type === 'ATTRACTION' && item.attraction_name}
                                          {item.activity_type === 'HOMESTAY' && item.homestay_name}
                                          {item.activity_type === 'GUIDE' && `Tour with: ${item.guide_name}`}
                                          {item.activity_type === 'CUSTOM' && item.custom_activity_name}
                                        </h4>
                                      </div>

                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        {isBookable && statusBadge}
                                        <button
                                          onClick={() => handleDeleteItem(item.id)}
                                          className="text-[#9E978E] hover:text-red-700 p-1.5 rounded hover:bg-[#FAF7F2] transition-colors"
                                          title="Remove from schedule"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Notes */}
                                    {item.notes && (
                                      <p className="text-[#5A534E] text-xs mt-2.5 italic bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DFC8]/60">
                                        Note: {item.notes}
                                      </p>
                                    )}

                                    {/* Inquiry Action Buttons */}
                                    {isBookable && (
                                      <div className="mt-3.5 flex justify-end">
                                        {!bookingInfo && (
                                          <button
                                            onClick={() => handleOpenInquiryModal(item)}
                                            className="btn-editorial-primary px-3.5 py-1.5 text-xs tracking-wider flex items-center gap-1.5 cursor-pointer"
                                          >
                                            <Send className="w-3 h-3" /> Send Booking Inquiry
                                          </button>
                                        )}
                                        {(bookingInfo?.status === 'PENDING' || bookingInfo?.status === 'RESPONDED') && (
                                          <Link
                                            to="/tourist-dashboard"
                                            className="btn-editorial-outline px-3.5 py-1.5 text-xs tracking-wider flex items-center gap-1.5"
                                          >
                                            <ExternalLink className="w-3 h-3" /> View In Tourist Dashboard
                                          </Link>
                                        )}
                                        {bookingInfo?.status === 'CONFIRMED' && (
                                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#153325]/10 text-[#153325] text-xs font-bold rounded-lg border border-[#153325]/20">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Booking Confirmed
                                          </span>
                                        )}
                                        {bookingInfo?.status === 'CANCELLED' && (
                                          <button
                                            onClick={() => handleOpenInquiryModal(item)}
                                            className="btn-editorial-outline px-3.5 py-1.5 text-xs tracking-wider flex items-center gap-1.5 cursor-pointer"
                                          >
                                            <Send className="w-3 h-3" /> Re-send Inquiry
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-[#E8DFC8] text-[#5A534E] p-8 shadow-xs flex flex-col justify-center items-center">
              <div className="w-14 h-14 rounded-full bg-[#FAF7F2] border border-[#E8DFC8] flex items-center justify-center mb-4 text-[#153325]">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="font-serif font-bold text-[#153325] text-lg mb-1">Select an Expedition to Begin</h3>
              <p className="text-xs text-[#5A534E] max-w-xs leading-relaxed">
                Choose an existing travel plan from the left panel or create a new one to start scheduling your Abra waypoints.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Inquiry Modal */}
      {inquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#232120]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-[#E8DFC8] animate-fadeIn">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-[#F3ECE0]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#B88B2A] block mb-0.5">
                  Official Operator Inquiry
                </span>
                <h2 className="font-serif font-bold text-[#153325] text-lg">Send Booking Inquiry</h2>
                <p className="text-xs text-[#5A534E] mt-0.5 line-clamp-1">{inquiryModal.itemName}</p>
              </div>
              <button
                onClick={() => setInquiryModal(null)}
                className="p-1.5 rounded-lg hover:bg-[#FAF7F2] text-[#9E978E] hover:text-[#232120] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitInquiry} className="px-6 py-5 space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#232120] mb-1">Check-in / Start Date</label>
                  <input
                    type="date"
                    value={modalForm.startDate}
                    onChange={(e) => setModalForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DCD5C9] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#232120] mb-1">Check-out / End Date</label>
                  <input
                    type="date"
                    value={modalForm.endDate}
                    onChange={(e) => setModalForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DCD5C9] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                  />
                </div>
              </div>

              {/* Number of Guests */}
              <div>
                <label className="block text-xs font-semibold text-[#232120] mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#B88B2A]" /> Number of Travelers
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={modalForm.numberOfGuests}
                  onChange={(e) => setModalForm((f) => ({ ...f, numberOfGuests: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#DCD5C9] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-[#232120] mb-1">
                  Message to Operator <span className="text-[#B88B2A]">*</span>
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Introduce your party, mention any special logistics (4x4 transport, dietary needs, arrival time)..."
                  value={modalForm.message}
                  onChange={(e) => setModalForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#DCD5C9] rounded-lg text-xs text-[#232120] focus:outline-none focus:border-[#153325] resize-none"
                />
              </div>

              {/* Error / Success */}
              {modalError && (
                <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {modalError}
                </div>
              )}
              {modalSuccess && (
                <div className="flex items-center gap-2 text-xs text-[#153325] bg-[#153325]/10 border border-[#153325]/20 rounded-lg px-3 py-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {modalSuccess}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInquiryModal(null)}
                  className="btn-editorial-ghost px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="btn-editorial-primary px-5 py-2 text-xs tracking-wider flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {modalSubmitting ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Sending...</>
                  ) : (
                    <><Send className="w-3.5 h-3.5" /> Submit Inquiry</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Municipal Package Modal */}
      {showPackageImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#232120]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-[#E8DFC8] animate-fadeIn max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-[#F3ECE0] flex-shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#B88B2A] block mb-0.5">
                  OFFICIAL MUNICIPAL PACKAGES
                </span>
                <h2 className="font-serif font-bold text-[#153325] text-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#B88B2A]" /> Import Curated Tour Package
                </h2>
                <p className="text-xs text-[#5A534E] mt-0.5">
                  Select a standardized package curated by Municipal Tourism Officers to import as an editable base itinerary.
                </p>
              </div>
              <button
                onClick={() => setShowPackageImportModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#FAF7F2] text-[#9E978E] hover:text-[#232120] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-grow">
              {availablePackages.length === 0 ? (
                <div className="text-center py-12 text-[#5A534E]">
                  <Package className="w-10 h-10 mx-auto text-[#DCD5C9] mb-2" />
                  <p className="font-serif font-bold text-sm text-[#153325]">No official packages published yet</p>
                  <p className="text-xs mt-1 text-[#5A534E]">Municipal Tourism Officers will publish verified packages here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availablePackages.map((pkg) => (
                    <div key={pkg.id} className="border border-[#E8DFC8] rounded-2xl p-4 bg-[#FAF7F2] hover:bg-white hover:border-[#153325] transition-all flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#153325] bg-white px-2 py-0.5 rounded border border-[#E8DFC8]">
                            {pkg.municipality_name}
                          </span>
                          <span className="text-xs font-bold text-[#B88B2A]">
                            ₱{parseFloat(pkg.price).toLocaleString()}
                          </span>
                        </div>
                        <h3 className="font-serif font-bold text-[#153325] text-sm line-clamp-1">{pkg.title}</h3>
                        <p className="text-xs text-[#5A534E] mt-1 line-clamp-2 leading-relaxed">{pkg.description}</p>
                        {pkg.inclusions && (
                          <div className="text-[10px] text-[#153325] font-medium mt-2 bg-white p-2 rounded-lg border border-[#E8DFC8]">
                            <strong className="text-[#232120]">Inclusions:</strong> {pkg.inclusions}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleImportPackageDirect(pkg.id)}
                        disabled={importingPkgId === pkg.id}
                        className="w-full py-2 btn-editorial-primary text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        {importingPkgId === pkg.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" /> Import Into Planner
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryPlanner;
