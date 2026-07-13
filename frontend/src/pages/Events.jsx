import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Search, Filter, Tag, ArrowRight, Clock, Music, Mountain, Star } from 'lucide-react';
import SafeImage from '../components/SafeImage';

const CATEGORIES = ['All', 'Festival', 'Cultural', 'Sports', 'Religious', 'Music', 'Food & Trade', 'Nature', 'Others'];

const categoryColors = {
  Festival: 'bg-amber-100 text-amber-800',
  Cultural: 'bg-purple-100 text-purple-800',
  Sports: 'bg-blue-100 text-blue-800',
  Religious: 'bg-indigo-100 text-indigo-800',
  Music: 'bg-pink-100 text-pink-800',
  'Food & Trade': 'bg-orange-100 text-orange-800',
  Nature: 'bg-emerald-100 text-emerald-800',
  Others: 'bg-slate-100 text-slate-700',
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
      (ev.municipality_name || '').toLowerCase().includes(search.toLowerCase());
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
    <div className="relative">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(150deg, #0a2526 0%, #0F3D3E 40%, #6b21a8 100%)', minHeight: '340px' }}>
        <div className="absolute inset-0 bg-woven-dark opacity-50" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 text-white/90 text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full mb-6">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Events & Festivals · Province of Abra</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            Festivals & <span className="text-amber-400">Events</span>
          </h1>
          <p className="text-white/60 text-base max-w-xl mx-auto">
            Discover upcoming cultural festivals, community events, and celebrations across all 27 municipalities of Abra.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full"><path d="M0 60L1440 60V30C1200 50 960 60 720 55C480 50 240 40 0 60Z" fill="#f8fafc"/></svg>
        </div>
      </div>

      <div className="bg-slate-50 min-h-screen -mt-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Announcements Banner */}
          {announcements.length > 0 && (
            <div className="mb-8 space-y-3">
              {announcements.slice(0, 2).map(ann => (
                <div key={ann.id} className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white rounded-xl px-5 py-4 flex items-start gap-3">
                  <Star className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm">{ann.title}</p>
                    <p className="text-white/70 text-xs mt-0.5 leading-relaxed">{ann.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search events or municipalities..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-900/30"
                />
              </div>
              {/* Month filter */}
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-900/30 bg-white"
              >
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            {/* Category chips */}
            <div className="flex flex-wrap gap-2 mt-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-900 text-white border-emerald-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-semibold">No events found matching your filters.</p>
              <p className="text-sm mt-1">Try adjusting the search or category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(ev => {
                const ongoing = isOngoing(ev.start_date, ev.end_date);
                const upcoming = isUpcoming(ev.start_date) && !ongoing;
                const past = !ongoing && !upcoming;
                return (
                  <div key={ev.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 ${past ? 'opacity-60' : ''}`}>
                    {/* Image */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      {ev.image_url ? (
                        <SafeImage src={ev.image_url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallback="landscape" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-emerald-50">
                          <Music className="w-12 h-12 text-slate-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      {/* Status badge */}
                      {ongoing && (
                        <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          Ongoing
                        </div>
                      )}
                      {upcoming && (
                        <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide">
                          Upcoming
                        </div>
                      )}
                      {past && (
                        <div className="absolute top-3 left-3 bg-slate-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide">
                          Past
                        </div>
                      )}
                      {/* Category */}
                      <div className="absolute top-3 right-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${categoryColors[ev.category] || categoryColors['Others']}`}>
                          {ev.category}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-extrabold text-slate-800 text-base mb-1 leading-snug line-clamp-2">{ev.title}</h3>
                      {ev.description && (
                        <p className="text-slate-500 text-xs leading-relaxed mb-3 line-clamp-2">{ev.description}</p>
                      )}
                      <div className="space-y-1.5 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>{formatDate(ev.start_date)}{ev.end_date && ` – ${formatDate(ev.end_date)}`}</span>
                        </div>
                        {ev.venue && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>{ev.venue}</span>
                          </div>
                        )}
                        {ev.municipality_name && (
                          <div className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                            <span>{ev.municipality_name}</span>
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
    </div>
  );
};

export default Events;
