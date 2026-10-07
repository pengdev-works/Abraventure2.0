import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, MapPin, Calendar, Users, Clock, Bus, Search, Filter,
  ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Compass, Heart
} from 'lucide-react';
import SafeImage from '../../components/common/SafeImage';
import ExpandableText from '../../components/common/ExpandableText';

const MUNICIPALITIES = [
  'All Municipalities', 'Bangued', 'Boliney', 'Bucay', 'Bucloc', 'Daguioman', 'Danglas', 'Dolores',
  'La Paz', 'Lacub', 'Lagangilang', 'Lagayan', 'Langiden', 'Licuan-Baay',
  'Luba', 'Malibcong', 'Manabo', 'Peñarrubia', 'Pidigan', 'Pilar', 'Sallapadan',
  'San Isidro', 'San Juan', 'San Quintin', 'Tayum', 'Tineg', 'Tubo', 'Villaviciosa'
];

const TourPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMuni, setSelectedMuni] = useState('All Municipalities');
  const [selectedType, setSelectedType] = useState('ALL'); // 'ALL' | 'MULTI_MUNICIPALITY' | 'DAY_TOUR' | 'MULTI_DAY'
  const [priceSort, setPriceSort] = useState('DEFAULT'); // 'DEFAULT' | 'ASC' | 'DESC'

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      // Backend returns plain array; only PUBLISHED packages are returned by default
      const res = await fetch('/api/tour-packages');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.packages || []);
      setPackages(list);
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = packages
    .filter(pkg => {
      const muniName = pkg.municipality_name || pkg.municipality || '';
      const matchSearch =
        (pkg.title || '').toLowerCase().includes(search.toLowerCase()) ||
        muniName.toLowerCase().includes(search.toLowerCase()) ||
        (pkg.description || '').toLowerCase().includes(search.toLowerCase());

      const matchMuni =
        selectedMuni === 'All Municipalities' ||
        muniName === selectedMuni ||
        (Array.isArray(pkg.participating_municipalities) && pkg.participating_municipalities.some(m => (typeof m === 'string' ? m : m.municipality) === selectedMuni));

      const matchType =
        selectedType === 'ALL'
          ? true
          : selectedType === 'MULTI_MUNICIPALITY'
          ? pkg.package_type === 'MULTI_MUNICIPALITY'
          : selectedType === 'DAY_TOUR'
          ? pkg.duration_days === 1
          : pkg.duration_days > 1;

      return matchSearch && matchMuni && matchType;
    })
    .sort((a, b) => {
      const priceA = parseFloat(a.price || a.price_per_pax || 0);
      const priceB = parseFloat(b.price || b.price_per_pax || 0);
      if (priceSort === 'ASC') return priceA - priceB;
      if (priceSort === 'DESC') return priceB - priceA;
      return 0;
    });

  return (
    <div className="min-h-screen bg-[var(--bg-app,#FAF7F2)] pb-24 text-[#2E3330] transition-colors">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-[#153325] via-[#1E4D37] to-[#2D6A4F] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#85E3B3]/20 text-[#A3F3CA] border border-[#85E3B3]/30 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs">
            <Compass size={14} /> Curated Tourism Circuits
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 font-serif">
            Abra Tour Packages & Circuits
          </h1>
          <p className="text-base sm:text-lg text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
            Experience hand-crafted heritage tours, scenic mountain circuits, accredited homestays, and local transportation verified by the Provincial & Municipal Tourism Offices.
          </p>

          {/* Quick Search in Hero */}
          <div className="mt-8 max-w-2xl mx-auto bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-xl flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3.5 text-emerald-200" size={18} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search packages, destinations, or keywords..."
                className="w-full bg-transparent text-white placeholder-emerald-200/70 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:bg-white/10"
              />
            </div>
            <select
              value={selectedMuni}
              onChange={e => setSelectedMuni(e.target.value)}
              className="bg-[#153325]/80 text-white border border-white/20 px-4 py-2.5 rounded-xl text-sm focus:outline-none"
            >
              {MUNICIPALITIES.map(m => (
                <option key={m} value={m} className="text-gray-900">{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Filters Bar */}
        <div className="bg-white dark:bg-[#162218] rounded-2xl shadow-sm border border-[var(--border-app,#C7D7C9)] dark:border-[#223529] p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'All Packages' },
              { id: 'MULTI_MUNICIPALITY', label: '🌐 Multi-Municipality' },
              { id: 'DAY_TOUR', label: '☀️ Day Tours' },
              { id: 'MULTI_DAY', label: '🌙 Multi-Day Adventures' },
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === type.id
                    ? 'bg-[#153325] text-white shadow-sm'
                    : 'bg-[#FAF7F2] dark:bg-[#1E2E24] text-[#5A534E] dark:text-[#96ADA0] hover:bg-[#E8DFC8] dark:hover:bg-[#253f30]'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7A736E] dark:text-[#96ADA0]">
            <span>Sort by:</span>
            <select
              value={priceSort}
              onChange={e => setPriceSort(e.target.value)}
              className="bg-[#FAF7F2] dark:bg-[#1E2E24] border border-[var(--border-app,#C7D7C9)] dark:border-[#223529] rounded-xl px-2.5 py-1.5 text-xs text-[#2E3330] dark:text-stone-100 focus:outline-none"
            >
              <option value="DEFAULT">Featured</option>
              <option value="ASC">Price: Low to High</option>
              <option value="DESC">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#153325] dark:text-[#E2EDE5] flex items-center gap-2 font-serif">
            <Package size={20} className="text-[#B88B2A]" />
            Available Packages ({filtered.length})
          </h2>
          {search && (
            <button
              onClick={() => { setSearch(''); setSelectedMuni('All Municipalities'); setSelectedType('ALL'); }}
              className="text-xs text-[#B88B2A] hover:underline font-semibold cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Package Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="bg-white dark:bg-[#162218] rounded-3xl border border-[var(--border-app,#C7D7C9)] dark:border-[#223529] p-4 h-96 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#162218] rounded-3xl border border-[var(--border-app,#C7D7C9)] dark:border-[#223529] p-12 text-center max-w-lg mx-auto shadow-sm">
            <Package size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
            <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200">No tour packages found</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 mb-6">
              Try adjusting your search criteria or selecting a different municipality.
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedMuni('All Municipalities'); setSelectedType('ALL'); }}
              className="bg-[#153325] hover:bg-[#1D4433] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(pkg => {
              const hasMulti = pkg.package_type === 'MULTI_MUNICIPALITY';
              const pkgPrice = parseFloat(pkg.price ?? pkg.price_per_pax ?? 0);
              return (
                <div
                  key={pkg.id}
                  className="bg-white dark:bg-[#162218] rounded-3xl border border-[var(--border-app,#C7D7C9)] dark:border-[#223529] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                >
                  {/* Image & Badges */}
                  <div className="relative h-52 overflow-hidden bg-stone-900">
                    <SafeImage
                      src={pkg.image_url || pkg.cover_image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                      <span className="bg-[#153325]/90 backdrop-blur-sm text-[#A3F3CA] text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <MapPin size={12} /> {pkg.municipality_name || pkg.municipality || 'Abra'}
                      </span>
                      {hasMulti && (
                        <span className="bg-[#2563EB]/90 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                          🌐 Multi-Muni
                        </span>
                      )}
                    </div>

                    {/* Duration badge */}
                    <div className="absolute bottom-3 left-3 text-white">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
                        <Clock size={13} />
                        {pkg.duration_days} Day{pkg.duration_days > 1 ? 's' : ''}
                        {pkg.duration_nights > 0 ? ` · ${pkg.duration_nights} Night${pkg.duration_nights > 1 ? 's' : ''}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-base font-bold text-stone-900 dark:text-[#E2EDE5] group-hover:text-[#153325] dark:group-hover:text-[#A3F3CA] transition line-clamp-1 mb-2 font-serif">
                      {pkg.title}
                    </h3>
                    <ExpandableText
                      text={pkg.description || 'Explore the wonders and cultural heritage of Abra with an organized package itinerary.'}
                      clampLines={2}
                      className="mb-4"
                      textClass="text-xs text-stone-600 dark:text-stone-300 leading-relaxed"
                    />

                    {/* Key Attributes */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-600 dark:text-stone-300 bg-[#FAF7F2] dark:bg-[#1E2E24] p-3 rounded-2xl mb-4 border border-[var(--border-app,#E8DFC8)] dark:border-[#2E4A39]">
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-[#153325] dark:text-[#A3F3CA]" />
                        <span>Up to {pkg.max_capacity || pkg.max_pax || 30} pax</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bus size={14} className="text-[#153325] dark:text-[#A3F3CA]" />
                        <span>{pkg.transport_option || pkg.transport_mode || 'Jeepney/Van'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <ShieldCheck size={14} className="text-[#059669] dark:text-[#4AA87E]" />
                        <span>Tourism Office Verified</span>
                      </div>
                    </div>

                    {/* Footer / Price & Link */}
                    <div className="mt-auto pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-stone-400 dark:text-stone-400 font-semibold uppercase tracking-wider">Starts at</div>
                        <div className="text-lg font-black text-[#153325] dark:text-[#A3F3CA] font-serif">
                          ₱{pkgPrice.toLocaleString()}
                          <span className="text-[11px] font-normal text-stone-500 dark:text-stone-400"> / pax</span>
                        </div>
                      </div>

                      <Link
                        to={`/tour-packages/${pkg.id}`}
                        className="inline-flex items-center gap-1.5 bg-[#153325] hover:bg-[#1D4433] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
                      >
                        Details <ArrowRight size={14} />
                      </Link>
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

export default TourPackages;
