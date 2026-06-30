import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, Trash2, Clock, Landmark, Home as HomeIcon, Award, MessageSquare, ListTodo, MapPin, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

const ItineraryPlanner = () => {
  const { token, user } = useAuth();
  
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

  useEffect(() => {
    if (token) {
      fetchItineraries();
      fetchAllListings();
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
    if (!window.confirm('Are you sure you want to delete this itinerary?')) return;
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
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 min-h-[calc(100vh-16rem)] flex flex-col justify-center items-center">
        <Calendar className="w-16 h-16 text-slate-300 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Itinerary Planner</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-sm">
          Plan your day-by-day Abra vacation! Pin local attractions, homestays, and tour guides. Log in to start planning.
        </p>
        <Link to="/login" className="px-6 py-2.5 bg-emerald-900 text-white rounded-full font-semibold hover:bg-emerald-800 shadow-md">
          Sign In to Access Planner
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[calc(100vh-16rem)]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-905 flex items-center gap-2">
            <Calendar className="w-8 h-8 text-amber-500" /> Travel Itinerary Planner
          </h1>
          <p className="text-xs text-slate-450 mt-1">Organize your schedules across Abra's municipalities</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Itinerary
        </button>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Pane - Trip Select & Creation */}
        <div className="lg:col-span-4 space-y-6">
          {/* Create Itinerary Form */}
          {showCreateForm && (
            <div className="bg-white p-6 rounded-2xl border border-emerald-900/10 shadow-md animate-fadeIn">
              <h3 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2">Create New Trip</h3>
              <form onSubmit={handleCreateItinerary} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trip Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3-Day Tineg Adventure"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows="2"
                    placeholder="Brief notes about this travel itinerary..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none"
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-900 text-white font-bold rounded-lg text-xs cursor-pointer hover:bg-emerald-800"
                >
                  Create Trip
                </button>
              </form>
            </div>
          )}

          {/* List of Itineraries */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-1 border-b border-slate-100 pb-2">
              <ListTodo className="w-5 h-5 text-emerald-900" /> Your Itineraries
            </h3>
            {loading ? (
              <div className="py-8 flex justify-center">
                <span className="w-6 h-6 border-2 border-emerald-900 border-t-transparent rounded-full animate-spin"></span>
              </div>
            ) : itineraries.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">No itineraries found. Create one above to start!</p>
            ) : (
              <div className="space-y-3">
                {itineraries.map((itin) => (
                  <div
                    key={itin.id}
                    onClick={() => setSelectedItinerary(itin)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedItinerary?.id === itin.id
                        ? 'border-emerald-900 bg-emerald-900/5 shadow-sm'
                        : 'border-slate-150 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{itin.title}</h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItinerary(itin.id);
                        }}
                        className="text-slate-400 hover:text-red-650 p-1 rounded hover:bg-slate-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {itin.description && (
                      <p className="text-slate-450 text-xs mt-1 line-clamp-1">{itin.description}</p>
                    )}
                    <p className="text-[10px] font-semibold text-slate-500 mt-2 bg-slate-100 px-2 py-0.5 rounded w-fit">
                      {itin.start_date ? new Date(itin.start_date).toLocaleDateString() : 'No date'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane - Timeline Grid & Item Form */}
        <div className="lg:col-span-8 space-y-6">
          {selectedItinerary ? (
            <div className="space-y-6">
              {/* Header Details */}
              <div className="bg-white p-6 rounded-2xl border border-slate-205 shadow-sm flex flex-col justify-between md:flex-row md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{selectedItinerary.title}</h2>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{selectedItinerary.description || 'Travel plan across Abra.'}</p>
                  {selectedItinerary.start_date && (
                    <p className="text-xs text-emerald-950 font-bold mt-2">
                      Trip Duration: {new Date(selectedItinerary.start_date).toLocaleDateString()}
                      {selectedItinerary.end_date ? ` to ${new Date(selectedItinerary.end_date).toLocaleDateString()}` : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Add Item to this Itinerary Form */}
              <div className="bg-white p-6 rounded-2xl border border-slate-205 shadow-sm">
                <h3 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2 flex items-center gap-1">
                  <Plus className="w-5 h-5 text-emerald-900" /> Add Activity or Destination
                </h3>
                <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Day Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Day of Trip</label>
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white"
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                        <option key={d} value={d}>
                          Day {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time slot */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Time (Slot)</label>
                    <input
                      type="time"
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white"
                    />
                  </div>

                  {/* Activity Type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Activity Type</label>
                    <select
                      value={activityType}
                      onChange={(e) => {
                        setActivityType(e.target.value);
                        setTargetId('');
                        setCustomActivityName('');
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white"
                    >
                      <option value="ATTRACTION">Local Tourist Attraction</option>
                      <option value="HOMESTAY">Accredited Homestay</option>
                      <option value="GUIDE">Accredited Tour Guide</option>
                      <option value="CUSTOM">Custom Notes/Activity</option>
                    </select>
                  </div>

                  {/* Dynamic target dropdown */}
                  {activityType === 'ATTRACTION' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Select Attraction</label>
                      <select
                        required
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white"
                      >
                        <option value="">-- Choose Attraction --</option>
                        {attractions.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.municipality_name}) - {a.category}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {activityType === 'HOMESTAY' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Select Homestay</label>
                      <select
                        required
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white"
                      >
                        <option value="">-- Choose Homestay --</option>
                        {homestays.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({h.municipality_name})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {activityType === 'GUIDE' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Select Tour Guide</label>
                      <select
                        required
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white"
                      >
                        <option value="">-- Choose Guide --</option>
                        {guides.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.guide_name} ({g.languages_spoken})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {activityType === 'CUSTOM' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Activity Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lunch at Local Carinderia"
                        value={customActivityName}
                        onChange={(e) => setCustomActivityName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white"
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Instructions</label>
                    <input
                      type="text"
                      placeholder="e.g. Bring extra camera batteries, wear comfortable hiking boots..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-emerald-900 text-white font-bold rounded-lg text-xs cursor-pointer hover:bg-emerald-800 shadow-sm"
                    >
                      Add Activity
                    </button>
                  </div>
                </form>
              </div>

              {/* Day-by-Day Timeline Display */}
              <div className="space-y-6">
                {itinDetails && itinDetails.items.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-450 p-8 shadow-sm">
                    <Clock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-semibold text-sm">Your schedule is empty.</p>
                    <p className="text-xs mt-1">Select days and add activities above to map out your adventure!</p>
                  </div>
                ) : (
                  <div>
                    {/* Group by Day */}
                    {Array.from(new Set(itinDetails?.items.map(item => item.day_number))).sort((a, b) => a - b).map((dayNum) => (
                      <div key={dayNum} className="mb-8">
                        <h3 className="font-extrabold text-lg text-emerald-950 mb-4 bg-emerald-900/5 py-1.5 px-4 rounded-lg w-fit border border-emerald-900/10">
                          Day {dayNum} Schedule
                        </h3>
                        
                        <div className="space-y-4 relative border-l-2 border-emerald-900/10 pl-6 ml-4">
                          {itinDetails?.items.filter(item => item.day_number === dayNum).map((item) => {
                            const timeFormatted = item.time_slot ? item.time_slot.substring(0, 5) : 'Anytime';
                            
                            return (
                              <div key={item.id} className="relative bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                                {/* Bullet indicator on line */}
                                <div className="absolute -left-[31px] top-6 w-3 h-3 bg-amber-500 rounded-full border-2 border-white shadow-sm"></div>

                                {/* Icon depending on activity type */}
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 flex-shrink-0">
                                  {item.activity_type === 'ATTRACTION' && <Landmark className="w-5 h-5 text-emerald-900" />}
                                  {item.activity_type === 'HOMESTAY' && <HomeIcon className="w-5 h-5 text-amber-600" />}
                                  {item.activity_type === 'GUIDE' && <Award className="w-5 h-5 text-sky-600" />}
                                  {item.activity_type === 'CUSTOM' && <Tag className="w-5 h-5 text-slate-500" />}
                                </div>

                                <div className="flex-grow">
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      {/* Header / Name */}
                                      <h4 className="font-bold text-slate-805 text-sm">
                                        {item.activity_type === 'ATTRACTION' && item.attraction_name}
                                        {item.activity_type === 'HOMESTAY' && item.homestay_name}
                                        {item.activity_type === 'GUIDE' && `Tour with Guide: ${item.guide_name}`}
                                        {item.activity_type === 'CUSTOM' && item.custom_activity_name}
                                      </h4>
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                                        <Clock className="w-3.5 h-3.5 text-slate-405" /> {timeFormatted}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100"
                                      title="Remove from schedule"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {/* Notes */}
                                  {item.notes && (
                                    <p className="text-slate-500 text-xs mt-2 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                      Note: {item.notes}
                                    </p>
                                  )}
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
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-205 text-slate-450 p-8 shadow-sm flex flex-col justify-center items-center">
              <Calendar className="w-16 h-16 text-slate-250 mb-3" />
              <h3 className="font-bold text-slate-800 text-lg mb-1">Select an Itinerary</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Pick a trip from the left sidebar or create a new one to begin editing your schedule.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItineraryPlanner;
