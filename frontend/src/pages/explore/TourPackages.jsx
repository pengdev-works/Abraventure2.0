import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, MapPin, Calendar, Users, Clock, Bus, Search, Filter,
  ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Compass, Heart
} from 'lucide-react';
import SafeImage from '../../components/common/SafeImage';

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
      const res = await fetch('/api/tour-packages');
      const data = await res.json();
      if (data.packages) {
        // Only public approved & published packages
        setPackages(data.packages.filter(p => p.status === 'APPROVED' && p.is_published));
      }
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = packages
    .filter(pkg => {
      const matchSearch =
        pkg.title.toLowerCase().includes(search.toLowerCase()) ||
        (pkg.municipality || '').toLowerCase().includes(search.toLowerCase()) ||
        (pkg.description || '').toLowerCase().includes(search.toLowerCase());

      const matchMuni =
        selectedMuni === 'All Municipalities' ||
        pkg.municipality === selectedMuni ||
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
      if (priceSort === 'ASC') return parseFloat(a.price_per_pax) - parseFloat(b.price_per_pax);
      if (priceSort === 'DESC') return parseFloat(b.price_per_pax) - parseFloat(a.price_per_pax);
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 text-[#2E3330]">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-[#153325] via-[#1E4D37] to-[#2D6A4F] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#85E3B3]/20 text-[#A3F3CA] border border-[#85E3B3]/30 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
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
        <div className="bg-white rounded-2xl shadow-sm border border-[#EBE5DA] p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedType === type.id
                    ? 'bg-[#153325] text-white shadow-sm'
                    : 'bg-[#F2EDE4] text-[#5A534E] hover:bg-[#E5DFD4]'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7A736E]">
            <span>Sort by:</span>
            <select
              value={priceSort}
              onChange={e => setPriceSort(e.target.value)}
              className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-lg px-2.5 py-1.5 text-xs text-[#2E3330] focus:outline-none"
            >
              <option value="DEFAULT">Featured</option>
              <option value="ASC">Price: Low to High</option>
              <option value="DESC">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#153325] flex items-center gap-2">
            <Package size={20} className="text-[#B88B2A]" />
            Available Packages ({filtered.length})
          </h2>
          {search && (
            <button
              onClick={() => { setSearch(''); setSelectedMuni('All Municipalities'); setSelectedType('ALL'); }}
              className="text-xs text-[#B88B2A] hover:underline font-semibold"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Package Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="bg-white rounded-2xl border border-[#EBE5DA] p-4 h-96 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EBE5DA] p-12 text-center max-w-lg mx-auto shadow-sm">
            <Package size={48} className="mx-auto text-stone-300 mb-3" />
            <h3 className="text-lg font-bold text-stone-800">No tour packages found</h3>
            <p className="text-xs text-stone-500 mt-1 mb-6">
              Try adjusting your search criteria or selecting a different municipality.
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedMuni('All Municipalities'); setSelectedType('ALL'); }}
              className="bg-[#153325] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#1E4D37] transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(pkg => {
              const hasMulti = pkg.package_type === 'MULTI_MUNICIPALITY';
              return (
                <div
                  key={pkg.id}
                  className="bg-white rounded-2xl border border-[#EBE5DA] overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group"
                >
                  {/* Image & Badges */}
                  <div className="relative h-52 overflow-hidden">
                    <SafeImage
                      src={pkg.cover_image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                      <span className="bg-[#153325]/90 backdrop-blur-sm text-[#A3F3CA] text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <MapPin size={12} /> {pkg.municipality}
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
                    <h3 className="text-base font-bold text-stone-900 group-hover:text-[#153325] transition line-clamp-1 mb-2">
                      {pkg.title}
                    </h3>
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-4">
                      {pkg.description || 'Explore the wonders and cultural heritage of Abra with an organized package itinerary.'}
                    </p>

                    {/* Key Attributes */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-500 bg-[#FAF8F5] p-3 rounded-xl mb-4">
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-[#153325]" />
                        <span>Up to {pkg.max_pax} pax</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bus size={14} className="text-[#153325]" />
                        <span>{pkg.transport_mode || 'Jeepney/Van'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2 text-stone-600">
                        <ShieldCheck size={14} className="text-[#059669]" />
                        <span>Tourism Office Verified</span>
                      </div>
                    </div>

                    {/* Footer / Price & Link */}
                    <div className="mt-auto pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Starts at</div>
                        <div className="text-lg font-black text-[#153325]">
                          ₱{parseFloat(pkg.price_per_pax || 0).toLocaleString()}
                          <span className="text-[11px] font-normal text-stone-500"> / pax</span>
                        </div>
                      </div>

                      <Link
                        to={`/tour-packages/${pkg.id}`}
                        className="inline-flex items-center gap-1.5 bg-[#153325] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#1E4D37] transition shadow-sm"
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
