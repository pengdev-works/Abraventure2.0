import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, MapPin } from 'lucide-react';
import SafeImage from '../../components/common/SafeImage';

const CATEGORIES = ['All', 'Heritage', 'Nature', 'Eco-Tourism', 'Highland', 'Riverside'];

const Municipalities = () => {
  const [municipalities, setMunicipalities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
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

  const uniqueMunicipalities = Array.from(
    new Map((municipalities || []).map(m => [m.id, m])).values()
  );

  const filteredMunicipalities = uniqueMunicipalities.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === 'All' ||
      (m.description || '').toLowerCase().includes(selectedCategory.toLowerCase());
    return matchSearch && matchCat;
  });

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    const grid = document.getElementById('directory-grid');
    if (grid) {
      grid.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#FAF7F2] text-[#232120] font-sans min-h-screen">

      {/* ── Editorial Header ── */}
      <section className="bg-[#153325] text-white pt-20 pb-20 border-b border-[#E8DFC8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4A942] mb-3 inline-block">
            Official Provincial Registry
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-white">
            The 27 Municipalities of Abra
          </h1>
          <p className="text-sm sm:text-base text-white/80 leading-relaxed mb-10 font-normal">
            From historic lowlands along the Abra River to mist-shrouded northern rainforests and southern mountain peaks. Discover certified local accommodations, accredited tour guides, and protected natural landmarks.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mb-8">
            <Search className="w-4 h-4 text-[#5A534E] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by municipality name or keyword (e.g. Bangued, Tineg, Kaparkan)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#FAF7F2] text-[#232120] placeholder:text-[#5A534E]/70 pl-11 pr-4 py-3.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#B88B2A] border border-[#E8DFC8]"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#B88B2A] text-white shadow-sm'
                    : 'bg-[#1D4433] text-white/80 hover:bg-[#2D5D46]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Directory Grid ── */}
      <section id="directory-grid" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pb-4 mb-10 border-b border-[#E8DFC8]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#5A534E]">
            Showing {filteredMunicipalities.length} {filteredMunicipalities.length === 1 ? 'Municipality' : 'Municipalities'}
          </p>
          <span className="text-xs text-[#153325] font-semibold">
            Official Provincial Tourism Directory
          </span>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <p className="text-sm font-semibold text-[#5A534E]">Loading destination directory…</p>
          </div>
        ) : filteredMunicipalities.length === 0 ? (
          <div className="py-20 text-center bg-[#F3ECE0] rounded-lg border border-[#E8DFC8] p-8">
            <p className="font-serif text-lg font-bold text-[#153325] mb-1">No municipalities found</p>
            <p className="text-xs text-[#5A534E]">Try adjusting your search terms or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMunicipalities.map((m) => {
              const imageSrc = m.dot_profile_pic || m.featured_image_url;
              const isSeal = imageSrc && !imageSrc.includes('images.unsplash.com');

              return (
                <Link
                  key={`mun-${m.id}-${m.name}`}
                  to={`/municipalities/${m.id}`}
                  className="group flex flex-col text-left border border-[#E8DFC8] rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
                >
                  {/* Photo / Emblem container */}
                  {isSeal ? (
                    <div className="img-editorial-wrapper aspect-[16/10] bg-gradient-to-b from-[#10271D] via-[#153325] to-[#1A3F2E] relative overflow-hidden flex items-center justify-center">
                      {/* Subtle concentric watermark rings for prestige government seal feel */}
                      <div className="absolute w-44 h-44 rounded-full border border-[#D4A942]/15 pointer-events-none" />
                      <div className="absolute w-56 h-56 rounded-full border border-white/5 pointer-events-none" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,169,66,0.1)_0%,transparent_70%)] pointer-events-none" />

                      {/* Official Seal Medallion following the circle */}
                      <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-white shadow-2xl ring-4 ring-[#D4A942]/70 border-2 border-white flex items-center justify-center group-hover:scale-105 group-hover:ring-[#D4A942] transition-all duration-300">
                        <SafeImage
                          src={imageSrc}
                          alt={`${m.name} Official Seal`}
                          className="w-full h-full object-cover rounded-full"
                          fallback="landscape"
                        />
                      </div>

                      <div className="absolute top-3 right-3 z-20">
                        <span className="bg-[#153325]/90 backdrop-blur-sm text-[#FAF7F2] text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded border border-[#D4A942]/40 shadow-xs">
                          Official Seal
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="img-editorial-wrapper aspect-[16/10] bg-[#153325] relative overflow-hidden">
                      <SafeImage
                        src={imageSrc}
                        alt={m.name}
                        className="img-editorial w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        fallback="landscape"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                      <div className="absolute top-3 right-3 z-10">
                        <span className="bg-[#153325]/85 backdrop-blur-sm text-[#FAF7F2] text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded border border-white/10">
                          Abra · CAR
                        </span>
                      </div>
                    </div>
                  )}

                {/* Content */}
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#153325] mb-2 group-hover:text-[#B88B2A] transition-colors">
                      {m.name}
                    </h3>
                    <p className="text-xs text-[#5A534E] leading-relaxed line-clamp-3 mb-6">
                      {m.description || `Explore natural mountain landscapes, eco-tourism sites, and cultural heritage in ${m.name}, Abra.`}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E8DFC8] flex items-center justify-between text-xs font-bold text-[#153325]">
                    <span>Explore Destination</span>
                    <ArrowRight className="w-4 h-4 text-[#B88B2A] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
          </div>
        )}
      </section>

    </div>
  );
};

export default Municipalities;
