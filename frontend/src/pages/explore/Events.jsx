import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Search, Tag, Music, Star, Clock, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import SafeImage from '../../components/common/SafeImage';

const CATEGORIES = ['All', 'Festival', 'Cultural', 'Sports', 'Religious', 'Music', 'Food & Trade', 'Nature', 'Others'];

const categoryColors = {
  Festival: 'bg-[#B88B2A]/15 text-[#946E1D] border-[#B88B2A]/30',
  Cultural: 'bg-[#153325]/10 text-[#153325] border-[#153325]/20',
  Sports: 'bg-[#355C6D]/15 text-[#355C6D] border-[#355C6D]/30',
  Religious: 'bg-[#FAF7F2] text-[#5A534E] border-[#E8DFC8]',
  Music: 'bg-[#B88B2A]/15 text-[#946E1D] border-[#B88B2A]/30',
  'Food & Trade': 'bg-[#FAF7F2] text-[#946E1D] border-[#E8DFC8]',
  Nature: 'bg-[#153325]/10 text-[#153325] border-[#153325]/20',
  Others: 'bg-[#FAF7F2] text-[#5A534E] border-[#E8DFC8]',
};

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS = ['All Months', ...monthNames];

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [evRes, annRes] = await Promise.all([
          fetch('/api/events'),
          fetch('/api/announcements'),
        ]);
        if (evRes.ok) setEvents(await evRes.json());
        if (annRes.ok) setAnnouncements(await annRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filtered = events.filter(ev => {
    const matchSearch = ev.title.toLowerCase().includes(search.toLowerCase()) ||
      (ev.municipality_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (ev.description || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'All' || ev.category === selectedCategory;
    const matchMonth = selectedMonth === 'All Months' ||
      new Date(ev.start_date).getMonth() === monthNames.indexOf(selectedMonth);
    return matchSearch && matchCat && matchMonth;
  });

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isUpcoming = (d) => d && new Date(d) >= new Date();
  const isOngoing = (start, end) => {
    const now = new Date();
    return new Date(start) <= now && (!end || new Date(end) >= now);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#232120]">
      {/* ── Editorial Hero Banner ── */}
      <div className="bg-[#153325] text-white pt-16 pb-20 relative overflow-hidden border-b border-[#E8DFC8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#B88B2A] font-semibold block mb-3">
            OFFICIAL PROVINCIAL TOURISM CALENDAR
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4 tracking-tight leading-tight">
            Festivals & Cultural Heritage
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Experience the foundational celebrations of Abra—from the grand Arya Abra Festival and Tingguian ancestral dances to municipality town fiestas and bamboo river regattas.
          </p>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Official Announcements */}
        {announcements.length > 0 && (
          <div className="mb-10 space-y-3">
            {announcements.slice(0, 2).map(ann => (
              <div key={ann.id} className="bg-white border border-[#B88B2A]/40 rounded-2xl p-5 shadow-2xs flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFC8] flex-shrink-0 text-[#B88B2A]">
                  <Star className="w-5 h-5 fill-[#B88B2A]/20" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B88B2A] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8DFC8]">
                    Official Provincial Bulletin
                  </span>
                  <h3 className="font-serif font-bold text-base text-[#153325] mt-1.5">{ann.title}</h3>
                  <p className="text-[#5A534E] text-xs mt-1 leading-relaxed">{ann.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search & Filter Controls */}
        <div className="bg-white border border-[#E8DFC8] rounded-2xl shadow-2xs p-6 mb-10">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E978E]" />
              <input
                type="text"
                placeholder="Search event title, celebration, or municipality..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#DCD5C9] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325] focus:bg-white placeholder:text-[#9E978E]"
              />
            </div>
            {/* Month Filter */}
            <div className="w-full md:w-56">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#DCD5C9] rounded-xl text-xs font-semibold text-[#232120] focus:outline-none focus:border-[#153325] cursor-pointer"
              >
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-[#F3ECE0]">
            <span className="text-[11px] font-bold text-[#5A534E] uppercase tracking-wider mr-2">Category:</span>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#153325] text-white border-[#153325] shadow-xs'
                    : 'bg-[#FAF7F2] text-[#5A534E] border-[#E8DFC8] hover:border-[#153325] hover:text-[#153325]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#E8DFC8]">
          <h2 className="font-serif text-2xl font-bold text-[#153325]">
            Provincial Schedule of Events
          </h2>
          <span className="text-xs text-[#5A534E] font-medium bg-[#FAF7F2] px-3 py-1 rounded-full border border-[#E8DFC8]">
            {filtered.length} {filtered.length === 1 ? 'Event Listed' : 'Events Listed'}
          </span>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-[#153325] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-[#5A534E]">Loading events schedule…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8DFC8] p-16 text-center shadow-xs">
            <Calendar className="w-12 h-12 mx-auto text-[#DCD5C9] mb-3" />
            <p className="font-serif text-lg font-bold text-[#153325]">No events found</p>
            <p className="text-xs text-[#5A534E] mt-1 max-w-sm mx-auto">
              There are no listed events matching your search or category filter. Try clearing your search or selecting a different month.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(ev => {
              const ongoing = isOngoing(ev.start_date, ev.end_date);
              const upcoming = isUpcoming(ev.start_date) && !ongoing;
              const past = !ongoing && !upcoming;

              return (
                <div
                  key={ev.id}
                  className={`bg-white rounded-2xl border border-[#E8DFC8] shadow-2xs overflow-hidden flex flex-col group hover:border-[#153325] hover:shadow-xs transition-all duration-300 ${
                    past ? 'opacity-75 bg-[#FAF7F2]/50' : ''
                  }`}
                >
                  {/* Event Cover Image */}
                  <div className="relative h-48 bg-[#153325] overflow-hidden">
                    {ev.image_url ? (
                      <SafeImage
                        src={ev.image_url}
                        alt={ev.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        fallback="landscape"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#153325] text-white/40">
                        <Music className="w-10 h-10 mb-1" />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Abra Festival</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Status badge */}
                    <div className="absolute top-3 left-3">
                      {ongoing && (
                        <div className="bg-[#153325] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm border border-white/20">
                          <span className="w-2 h-2 bg-[#B88B2A] rounded-full animate-ping" />
                          Ongoing Now
                        </div>
                      )}
                      {upcoming && (
                        <div className="bg-[#B88B2A] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                          Upcoming
                        </div>
                      )}
                      {past && (
                        <div className="bg-[#5A534E] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          Past Event
                        </div>
                      )}
                    </div>

                    {/* Category badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${categoryColors[ev.category] || categoryColors['Others']}`}>
                        {ev.category}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-[#153325] text-lg mb-2 leading-snug group-hover:text-[#B88B2A] transition-colors">
                        {ev.title}
                      </h3>
                      {ev.description && (
                        <p className="text-[#5A534E] text-xs leading-relaxed mb-4 line-clamp-3">
                          {ev.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[#F3ECE0] space-y-2 text-xs text-[#5A534E]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#B88B2A] flex-shrink-0" />
                        <span className="font-semibold text-[#232120]">
                          {formatDate(ev.start_date)}
                          {ev.end_date && ` – ${formatDate(ev.end_date)}`}
                        </span>
                      </div>
                      {ev.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#153325] flex-shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </div>
                      )}
                      {ev.municipality_name && (
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-[#5A534E] flex-shrink-0" />
                          <span>{ev.municipality_name}, Abra</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
