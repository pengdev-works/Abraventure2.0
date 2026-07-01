import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Compass, Mountain, TreePine, Waves } from 'lucide-react';

const categoryColors = {
  Nature:     'bg-emerald-100 text-emerald-800',
  Heritage:   'bg-amber-100 text-amber-800',
  Cultural:   'bg-indigo-100 text-indigo-800',
  Adventure:  'bg-orange-100 text-orange-800',
};

const Municipalities = () => {
  const [municipalities, setMunicipalities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMunicipalities = async () => {
      try {
        const response = await fetch('/api/municipalities');
        if (response.ok) {
          const data = await response.json();
          setMunicipalities(data);
        }
      } catch (err) {
        console.error('Error fetching municipalities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMunicipalities();
  }, []);

  const filteredMunicipalities = municipalities.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* ── Hero Banner ─────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0a2526 0%, #0F3D3E 30%, #1E2A6E 70%, #0d1a3a 100%)',
        }}
      >
        {/* Woven texture */}
        <div className="absolute inset-0 bg-woven-dark opacity-50" />

        {/* Decorative orbs */}
        <div className="absolute top-8 right-16 w-72 h-72 bg-amber-400/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-16 left-8 w-56 h-56 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 text-white/85 text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full mb-6 animate-fadeSlideDown">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Province of Abra · Cordillera Region</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-5 tracking-tight leading-tight animate-slideDown">
            Discover the <span className="text-gradient-abra">27 Municipalities</span>
          </h1>
          <p className="text-white/60 text-sm md:text-lg leading-relaxed max-w-2xl mx-auto mb-10 animate-fadeSlideUp delay-200">
            From vibrant Bangued to the majestic Kaparkan Falls of Tineg — explore accredited homestays,
            local tour guides, and hidden gems across every municipality.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-lg mx-auto animate-fadeSlideUp delay-300">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Search a municipality (e.g. Bangued, Tineg, La Paz)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-5 py-4 bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-400/30 text-sm text-slate-800 font-medium placeholder:text-slate-400 transition-all"
            />
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-10 md:gap-16 mt-12 animate-fadeSlideUp delay-400">
            {[
              { icon: MapPin,    label: 'Municipalities',   value: '27'   },
              { icon: Mountain,  label: 'Attractions',      value: '100+' },
              { icon: TreePine,  label: 'Eco-Tourism Sites',value: '50+'  },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-white/80">
                <stat.icon className="w-4.5 h-4.5 mb-1.5 text-amber-400" />
                <span className="text-2xl md:text-3xl font-extrabold text-white">{stat.value}</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold mt-0.5 text-white/55">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wave transition */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none pointer-events-none">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40L48 35C96 30 192 20 288 22C384 24 480 38 576 44C672 50 768 48 864 42C960 36 1056 26 1152 24C1248 22 1344 28 1392 31L1440 34V80H0V40Z" fill="#f8fafc" />
          </svg>
        </div>
      </div>

      {/* ── Municipality Grid ───────────────────────────── */}
      <div className="bg-woven min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-18">

          {/* Section Title */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-emerald-900">
                All Destinations
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {filteredMunicipalities.length}{' '}
                {filteredMunicipalities.length === 1 ? 'municipality' : 'municipalities'} found
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-semibold">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live data from DOT
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-28">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-400 font-semibold animate-pulse">Loading destinations...</p>
              </div>
            </div>
          ) : filteredMunicipalities.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <Search className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-lg font-bold text-slate-700">No municipalities match your search.</p>
              <p className="text-sm text-slate-400 mt-1">Try a different spelling or browse all destinations.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMunicipalities.map((m, index) => (
                <Link
                  key={m.id}
                  to={`/municipalities/${m.id}`}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-400 flex flex-col border border-slate-100"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  {/* Card Image */}
                  <div className="relative h-52 overflow-hidden bg-emerald-900">
                    <img
                      src={m.dot_profile_pic || m.featured_image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80'}
                      alt={m.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600 ease-out"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Location badge */}
                    <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-md text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/15 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-amber-400" />
                      Abra · CAR
                    </div>

                    {/* Name */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-white text-xl font-extrabold tracking-wide drop-shadow-lg mb-0.5">
                        {m.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-amber-400/90 text-[10px] font-bold uppercase tracking-widest">
                        <Compass className="w-3 h-3" />
                        <span>Municipality · Cordillera</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <p className="text-slate-500 text-[13px] leading-relaxed mb-5 line-clamp-2">
                      {m.description || 'Explore scenic Cordillera landscapes and rich local cultural heritage.'}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-emerald-900 font-extrabold text-xs tracking-wide group-hover:text-amber-600 transition-colors">
                        Explore Destination
                      </span>
                      <div className="w-8 h-8 rounded-full bg-emerald-900 group-hover:bg-amber-500 flex items-center justify-center transition-all duration-300 shadow-sm">
                        <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>

                  {/* Gold bottom glow on hover */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Municipalities;
