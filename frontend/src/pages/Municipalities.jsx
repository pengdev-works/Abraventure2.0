import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Compass, Mountain, Trees } from 'lucide-react';

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
      {/* Hero Banner */}
      <div
        className="relative bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(6, 78, 59, 0.92), rgba(6, 78, 59, 0.7), rgba(217, 119, 6, 0.55)), url('/uploads/abra.webp')`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full mb-6">
            <Compass className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Province of Abra · Cordillera Region</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-5 tracking-tight leading-tight">
            Discover the <span className="text-amber-400">27 Municipalities</span>
          </h1>
          <p className="text-white/75 text-sm md:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            From the vibrant capital of Bangued to the majestic Kaparkan Falls of Tineg — explore accredited homestays, local tour guides, and hidden gems across every municipality.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-lg mx-auto">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-emerald-900/50">
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

          {/* Stats Row */}
          <div className="flex justify-center gap-8 md:gap-14 mt-10">
            {[
              { icon: MapPin, label: 'Municipalities', value: '27' },
              { icon: Mountain, label: 'Attractions', value: '100+' },
              { icon: Trees, label: 'Eco-Tourism Sites', value: '50+' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-white/80">
                <stat.icon className="w-5 h-5 mb-1.5 text-amber-400" />
                <span className="text-2xl md:text-3xl font-extrabold text-white">{stat.value}</span>
                <span className="text-[11px] uppercase tracking-wider font-semibold mt-0.5">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40L48 35C96 30 192 20 288 22C384 24 480 38 576 44C672 50 768 48 864 42C960 36 1056 26 1152 24C1248 22 1344 28 1392 31L1440 34V80H1392C1344 80 1248 80 1152 80C1056 80 960 80 864 80C768 80 672 80 576 80C480 80 384 80 288 80C192 80 96 80 48 80H0V40Z" fill="#f8fafc"/>
          </svg>
        </div>
      </div>

      {/* Municipality Cards Grid */}
      <div className="bg-slate-50 min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

          {/* Section Title */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-emerald-950">
                All Destinations
              </h2>
              <p className="text-xs text-slate-450 mt-1 font-medium">
                {filteredMunicipalities.length} {filteredMunicipalities.length === 1 ? 'municipality' : 'municipalities'} found
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-28">
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {filteredMunicipalities.map((m, index) => (
                <Link
                  key={m.id}
                  to={`/municipalities/${m.id}`}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 flex flex-col border border-slate-200/50"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  {/* Card Image */}
                  <div className="relative h-56 overflow-hidden bg-slate-100">
                    <img
                      src={m.dot_profile_pic || m.featured_image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=90'}
                      alt={m.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    {/* Multi-layer gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Floating Badge */}
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      Abra
                    </div>

                    {/* Bottom Card Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-white text-xl font-extrabold tracking-wide drop-shadow-lg mb-1">
                        {m.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-amber-400/90 text-[10px] font-bold uppercase tracking-widest">
                        <Compass className="w-3.5 h-3.5" />
                        <span>Municipality · Cordillera</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <p className="text-slate-500 text-[13px] leading-relaxed mb-5 line-clamp-2">
                      {m.description || 'Explore scenic landscapes and local cultural tourism destinations.'}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-emerald-900 font-extrabold text-xs tracking-wide group-hover:text-amber-600 transition-colors duration-300">
                        Explore Destination
                      </span>
                      <div className="w-8 h-8 rounded-full bg-emerald-900 group-hover:bg-amber-500 flex items-center justify-center transition-all duration-300 shadow-md">
                        <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
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
