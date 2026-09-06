import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, MapPin, Calendar, Users, Star,
  Compass, ShieldCheck, Map, ArrowUpRight, Check,
  Play, Pause, Volume2, VolumeX, Film, Video, Sparkles
} from 'lucide-react';
import SafeImage, { formatMediaUrl } from '../../components/common/SafeImage';

/* ─── Static Abra Cultural Highlights ────────────────────────── */
const CULTURAL_STORIES = [
  {
    tag: 'Living Heritage',
    title: 'Itneg Backstrap Weaving',
    desc: 'Woven on indigenous backstrap looms, Tingguian textiles feature sacred Binakol (optical whirlpool motifs) and Inabel cloth passed down across generations.',
    image: '/uploads/itneg-weaving.jpg',
    fallback: 'landscape'
  },
  {
    tag: 'Craft Capital',
    title: 'Natural Dye Capital of the Philippines',
    desc: 'From Tayum indigo leaves to mahogany and narra barks, Abra artisans cultivate organic color pigments recognized nationwide for sustainable textile artistry.',
    image: '/uploads/natural-dyes.jpg',
    fallback: 'landscape'
  },
  {
    tag: 'Colonial Architecture',
    title: 'Centuries-Old Spanish Churches',
    desc: 'National Cultural Treasures like the 19th-century brick Baroque church of Santa Catalina de Alejandria in Tayum stand as living testaments to Abra history.',
    image: '/uploads/tayum-church.jpg',
    fallback: 'landscape'
  }
];

/* ─── The Abra Experience: 6 Core Editorial Pillars ──────────── */
const EXPERIENCES = [
  {
    category: 'Adventure',
    title: 'Follow the River',
    desc: 'Brave the emerald travertine pools of Kaparkan, trek misty mountain gorges, and navigate the rushing Abra River rapids.',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    link: '/municipalities'
  },
  {
    category: 'Culture',
    title: 'Stories from the Mountains',
    desc: 'Centuries-old Tingguian backstrap weaving, sacred Binakol whirlpool motifs, and ancestral oral histories.',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
    link: '/events'
  },
  {
    category: 'Food',
    title: 'Taste Abra',
    desc: 'Fresh handmade Abra Miki simmered with native chicken, raw Cordillera forest honey, and upland Arabica coffee.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    link: '/municipalities'
  },
  {
    category: 'Heritage',
    title: 'Colonial Stone & Spanish Brick',
    desc: 'Centuries-old red-brick Baroque churches, historic plaza belltowers, and Spanish-era ancestral homes in Tayum.',
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80',
    link: '/municipalities'
  },
  {
    category: 'Nature',
    title: 'Highland Cloud Seas & Ridges',
    desc: 'Unspoiled Cordillera frontiers in Tubo, Boliney, and Malibcong where sunrise reveals vast rolling cloud inversions.',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    link: '/map'
  },
  {
    category: 'Community',
    title: 'Stay with Local Families',
    desc: 'Rest in certified village homestays, learn local recipes, and experience genuine Cordillera warmth and hospitality.',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    link: '/municipalities'
  }
];

/* ─── Local Abra Food Specialties ────────────────────────────── */
const LOCAL_FOODS = [
  {
    name: 'Abra Miki',
    category: 'Traditional Noodle Broth',
    desc: 'Handmade fresh egg noodles steeped in a rich, comforting annatto-orange broth with native shredded chicken, crispy chicharon, and hard-boiled egg.',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
    origin: 'Bangued & Peñarrubia'
  },
  {
    name: 'Wild Cordillera Forest Honey',
    category: 'Native Forest Harvest',
    desc: 'Raw, unpasteurized amber honey gathered sustainably from giant wild bee colonies deep in the virgin canopy forests of Tineg and Malibcong.',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80',
    origin: 'Tineg & Malibcong'
  },
  {
    name: 'Highland Shade-Grown Arabica',
    category: 'Single-Origin Coffee',
    desc: 'Cultivated by indigenous farmers at altitudes exceeding 1,300m above sea level, producing a velvety cup with notes of cocoa and mountain cane.',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    origin: 'Tubo & Boliney'
  }
];

/* ─── Curated Trip Styles for Guided Itinerary Builder ───────── */
const TRIP_STYLES = [
  { id: 'nature', label: 'Nature & Waterfalls', desc: 'Kaparkan terraced pools, Tineg river rapids, and lush valleys' },
  { id: 'heritage', label: 'Heritage & Culture', desc: 'Spanish-era brick churches, Itneg weaving villages, and museum tours' },
  { id: 'trekking', label: 'Highland Trekking', desc: 'Mount Poswey, Tubo mountain ridges, and sacred ancestral trails' },
  { id: 'relaxation', label: 'Quiet Stays & Food', desc: 'Riverside homestays, Abra coffee tasting, and scenic mountain views' }
];

const SAMPLE_ITINERARIES = {
  1: {
    title: '1-Day Abra Heritage & River Highlights',
    stops: [
      { time: '08:00 AM', place: 'Bangued Capitol & Cassamata Hill', note: 'Panoramic valley view & provincial welcome' },
      { time: '11:30 AM', place: 'Tayum Heritage Church & Loom Weavers', note: 'Visit accredited Itneg textile workshops' },
      { time: '03:00 PM', place: 'Calaba Bridge & Abra Riverbanks', note: 'Sunset view along the iconic steel expanse' }
    ]
  },
  2: {
    title: '2-Day Eco-Adventure & Kaparkan Springs',
    stops: [
      { time: 'Day 1 · 06:00 AM', place: 'Kaparkan Falls Travertine Terraces, Tineg', note: 'Full-day spring trek with accredited local guide' },
      { time: 'Day 1 · 06:00 PM', place: 'Tineg Community Homestay', note: 'Verified local host dinner & stargazing' },
      { time: 'Day 2 · 09:00 AM', place: 'Danglas Pine Ridge Trail & Return', note: 'Scenic highland overlook & local coffee' }
    ]
  },
  3: {
    title: '3-Day Complete Abra Mountain & Cultural Expedition',
    stops: [
      { time: 'Day 1', place: 'Bangued Heritage Town & Itneg Textile Trail', note: 'Tayum Baroque church & indigo dye workshops' },
      { time: 'Day 2', place: 'Kaparkan Falls Travertine Pools, Tineg', note: 'Guided eco-trek through northern rainforests' },
      { time: 'Day 3', place: 'Tubo Highland Ridge & Sunrise Overlook', note: 'Southern Cordillera peaks and ancestral lands' }
    ]
  },
  4: {
    title: '4+ Days Grand Abra Cordillera Immersion',
    stops: [
      { time: 'Day 1–2', place: 'Tineg & Northern Abra Wilderness', note: 'Kaparkan pools, river traverses, and mountain homestays' },
      { time: 'Day 3', place: 'Central Abra Heritage Valley', note: 'Bangued, Bucay historical ruins, and local gastronomy' },
      { time: 'Day 4+', place: 'Highland Municipalities of Tubo & Boliney', note: 'High altitude ridges, hot springs, and cultural exchange' }
    ]
  }
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT: Home
═══════════════════════════════════════════════════════════════ */
const Home = () => {
  const navigate = useNavigate();

  /* ─── State ─── */
  const [heroConfig, setHeroConfig] = useState({
    badge_text: 'Province of Abra · Cordillera Administrative Region',
    title: 'Where adventure feels authentic.',
    subtitle: 'Explore mountains, rivers, heritage towns, local culture, food, and unforgettable places across 27 municipalities.',
    video_url: null,
    background_image_url: null,
  });

  const [municipalities, setMunicipalities] = useState([]);
  const [muniLoading, setMuniLoading] = useState(true);
  const [stats, setStats] = useState({ municipalities: 27, homestays: 0, guides: 0, attractions: 0 });
  const [announcements, setAnnouncements] = useState([]);

  /* ─── Search Widget State ─── */
  const [searchMuni, setSearchMuni] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [travelers, setTravelers] = useState(2);

  /* ─── Interactive Itinerary Teaser State ─── */
  const [selectedStyle, setSelectedStyle] = useState('nature');
  const [selectedDays, setSelectedDays] = useState(3);

  /* ─── Video Advertisements Showcase State ─── */
  const [videoAds, setVideoAds] = useState([]);
  const [activeAdIndex, setActiveAdIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const adVideoRef = useRef(null);

  useEffect(() => {
    fetch('/api/advertisements/public')
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        if (Array.isArray(d) && d.length > 0) {
          setVideoAds(d);
        }
      })
      .catch(err => console.error('Error fetching public video ads:', err));
  }, []);

  const togglePlay = () => {
    if (!adVideoRef.current) return;
    if (adVideoRef.current.paused) {
      adVideoRef.current.play();
      setIsPlaying(true);
    } else {
      adVideoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!adVideoRef.current) return;
    adVideoRef.current.muted = !adVideoRef.current.muted;
    setIsMuted(adVideoRef.current.muted);
  };

  /* ─── Data Fetching ─── */
  useEffect(() => {
    fetch('/api/announcements/hero')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.title) setHeroConfig(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMuniLoading(true);
    fetch('/api/municipalities')
      .then(r => r.ok ? r.json() : [])
      .then(async (list) => {
        // Enrich first 8 municipalities with counts
        const enriched = await Promise.all(
          list.slice(0, 8).map(async (m) => {
            try {
              const detail = await fetch(`/api/municipalities/${m.id}`);
              if (!detail.ok) return m;
              const d = await detail.json();
              return {
                ...m,
                attraction_count: d.attractions?.length ?? 0,
                homestay_count: d.homestays?.length ?? 0,
                guide_count: d.guides?.length ?? 0,
                images: d.municipality?.images ?? [],
                featured_image_url: d.municipality?.featured_image_url ?? m.featured_image_url,
              };
            } catch {
              return m;
            }
          })
        );
        setMunicipalities(enriched);
        setMuniLoading(false);
      })
      .catch(() => setMuniLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/announcements/public-stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/announcements')
      .then(r => r.ok ? r.json() : [])
      .then(d => setAnnouncements(d.slice(0, 3)))
      .catch(() => {});
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchMuni) params.set('municipality', searchMuni);
    if (searchType !== 'all') params.set('type', searchType);
    navigate(`/municipalities${params.toString() ? '?' + params.toString() : ''}`);
  };

  const muniNames = municipalities.map(m => m.name);

  return (
    <div className="bg-[#FAF7F2] text-[#232120] font-sans overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════
          1. HERO SECTION (Photography First, Editorial Typography)
      ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] lg:min-h-[95vh] flex flex-col justify-between bg-[#153325] text-white">

        {/* Hero Background Image / Video with warm, natural grading */}
        {heroConfig.background_image_url ? (
          <img
            src={formatMediaUrl(heroConfig.background_image_url)}
            alt="Scenic Abra Landscape"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-75"
          />
        ) : (
          <div className="absolute inset-0 bg-[#153325]">
            <img
              src="/uploads/images (4).jpg"
              alt="Kaparkan Falls, Abra"
              className="w-full h-full object-cover object-center opacity-65"
              onError={(e) => {
                // Fallback to elegant gradient if file is missing
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Video override if configured */}
        {heroConfig.video_url && (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-45 pointer-events-none"
            src={formatMediaUrl(heroConfig.video_url)}
          />
        )}

        {/* Scrim Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#153325] via-[#153325]/40 to-[#153325]/60" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 lg:pt-40 pb-12 sm:pb-16 flex flex-col justify-end">
          <div className="max-w-3xl">

            {/* Editorial Category Tag */}
            <div className="inline-flex items-center gap-2 mb-4 sm:mb-6">
              <span className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.25em] text-[#D4A942]">
                Discover Abra, Philippines
              </span>
              <span className="w-8 h-px bg-[#D4A942]/60" />
            </div>

            {/* Confident Large Headline */}
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-4 sm:mb-6">
              Where adventure <br className="hidden sm:inline" />
              <span className="italic font-normal text-[#F3ECE0]">feels authentic.</span>
            </h1>

            {/* Understated Description */}
            <p className="text-sm sm:text-lg text-white/85 leading-relaxed max-w-2xl mb-8 sm:mb-10 font-sans font-normal">
              Explore travertine waterfalls, rushing rivers, living Itneg weaving traditions, Spanish-era heritage towns, and warm accredited homestays across 27 municipalities.
            </p>

            {/* Intentional, Responsive CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-8 sm:mb-12">
              <Link to="/municipalities" className="btn-editorial-gold text-center touch-target flex items-center justify-center">
                Explore Abra
              </Link>
              <Link to="/itinerary" className="btn-editorial-secondary text-center touch-target flex items-center justify-center">
                Plan Your Trip
              </Link>
            </div>
          </div>

          {/* Streamlined Search Bar (Clean, Quiet, High Utility) */}
          <div className="w-full max-w-4xl bg-[#FAF7F2] text-[#232120] p-4 sm:p-5 rounded-xl shadow-xl border border-[#E8DFC8]">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-center">

              {/* Municipality Select */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5A534E] mb-1">
                  Destination
                </label>
                <select
                  value={searchMuni}
                  onChange={(e) => setSearchMuni(e.target.value)}
                  className="w-full bg-[#F3ECE0] border border-[#E8DFC8] rounded-lg py-2.5 px-3 text-xs font-semibold text-[#232120] focus:outline-none focus:border-[#153325] touch-target"
                >
                  <option value="">All 27 Municipalities</option>
                  {muniNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Experience Type */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5A534E] mb-1">
                  Experience Type
                </label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full bg-[#F3ECE0] border border-[#E8DFC8] rounded-lg py-2.5 px-3 text-xs font-semibold text-[#232120] focus:outline-none focus:border-[#153325] touch-target"
                >
                  <option value="all">Stays & Experiences</option>
                  <option value="homestay">Verified Homestays</option>
                  <option value="guide">Accredited Guides</option>
                  <option value="attraction">Tourist Attractions</option>
                </select>
              </div>

              {/* Group Size */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5A534E] mb-1">
                  Travelers
                </label>
                <select
                  value={travelers}
                  onChange={(e) => setTravelers(Number(e.target.value))}
                  className="w-full bg-[#F3ECE0] border border-[#E8DFC8] rounded-lg py-2.5 px-3 text-xs font-semibold text-[#232120] focus:outline-none focus:border-[#153325] touch-target"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>

              {/* Submit Search */}
              <div className="flex flex-col sm:col-span-3 lg:col-span-1 pt-1 sm:pt-0">
                <label className="hidden lg:block text-[10px] font-bold uppercase tracking-wider text-transparent mb-1">
                  Action
                </label>
                <button
                  onClick={handleSearch}
                  className="btn-editorial-primary w-full !py-3 !px-4 text-xs font-bold touch-target flex items-center justify-center gap-2 rounded-lg"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Abra</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          2. OFFICIAL VERIFICATION & TRUST STRIP (Mobile Optimized 2x2)
      ══════════════════════════════════════════════════════ */}
      <section className="bg-[#F3ECE0] border-y border-[#E8DFC8] py-5 sm:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 text-left">
            <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-0 rounded-xl bg-white/50 sm:bg-transparent border border-[#E8DFC8]/60 sm:border-0">
              <span className="w-2 h-2 rounded-full bg-[#153325] flex-shrink-0 mt-1.5" />
              <div>
                <p className="font-semibold text-xs text-[#153325] leading-snug">Official DOT Endorsement</p>
                <p className="text-[10px] sm:text-[11px] text-[#5A534E] mt-0.5">Provincial Tourism Office</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-0 rounded-xl bg-white/50 sm:bg-transparent border border-[#E8DFC8]/60 sm:border-0">
              <span className="w-2 h-2 rounded-full bg-[#B88B2A] flex-shrink-0 mt-1.5" />
              <div>
                <p className="font-semibold text-xs text-[#153325] leading-snug">27 Municipal Desks</p>
                <p className="text-[10px] sm:text-[11px] text-[#5A534E] mt-0.5">Direct LGU verification</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-0 rounded-xl bg-white/50 sm:bg-transparent border border-[#E8DFC8]/60 sm:border-0">
              <span className="w-2 h-2 rounded-full bg-[#355C6D] flex-shrink-0 mt-1.5" />
              <div>
                <p className="font-semibold text-xs text-[#153325] leading-snug">Accredited Guides</p>
                <p className="text-[10px] sm:text-[11px] text-[#5A534E] mt-0.5">Certified mountain & culture</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-0 rounded-xl bg-white/50 sm:bg-transparent border border-[#E8DFC8]/60 sm:border-0">
              <span className="w-2 h-2 rounded-full bg-[#2D5D46] flex-shrink-0 mt-1.5" />
              <div>
                <p className="font-semibold text-xs text-[#153325] leading-snug">Verified Homestays</p>
                <p className="text-[10px] sm:text-[11px] text-[#5A534E] mt-0.5">Compliant with safety rules</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          2B. DISCOVER ABRA: EDITORIAL INTRODUCTION
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#E8DFC8]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 text-left">
            <span className="editorial-tag mb-4">
              More than a destination
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#153325] leading-[1.15] mb-6">
              A place of mountains, rivers, heritage, and stories waiting to be discovered.
            </h2>
            <p className="text-sm sm:text-base text-[#5A534E] leading-relaxed mb-8 font-normal">
              Tucked deep within the Cordillera Administrative Region, Abra is a province shaped by dramatic limestone gorges, living Tingguian backstrap traditions, and centuries of Spanish Baroque stonecraft. From quiet riverside communities to the misty travertine terraces of Tineg, every journey here is real.
            </p>
            <div className="pt-6 border-t border-[#E8DFC8] flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#153325]">
                  27 Municipalities.
                </h3>
                <p className="font-serif text-xl italic text-[#B88B2A]">
                  One unforgettable province.
                </p>
              </div>
              <Link to="/municipalities" className="inline-flex items-center gap-2 text-sm font-bold text-[#153325] hover:text-[#B88B2A] transition-colors">
                <span>Explore the municipalities</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-6">
            <div className="img-editorial-wrapper rounded-lg aspect-[4/3] bg-[#153325] shadow-xl border border-[#E8DFC8]">
              <SafeImage
                src="/uploads/images (6).jpg"
                alt="Panoramic view across Abra Cordillera"
                className="img-editorial w-full h-full object-cover"
                fallback="landscape"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-[#153325]/90 backdrop-blur-sm p-4 rounded text-white text-xs border border-white/10">
                <p className="font-serif font-bold text-sm text-[#FAF7F2]">Cordillera Mountain Frontier</p>
                <p className="text-white/70 text-[11px] mt-0.5">Where the road leads to something real.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          2C. ABRA IN MOTION: OFFICIAL PROVINCIAL VIDEO SPOTLIGHT & ADVERTISEMENT SHOWCASE
      ══════════════════════════════════════════════════════ */}
      {videoAds.length > 0 && (
        <section className="py-20 sm:py-28 bg-[#0D241A] text-white border-y border-[#2D5D46] relative overflow-hidden">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#B88B2A]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#355C6D]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-6 border-b border-white/10">
              <div className="text-left">
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-[#B88B2A] animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4A942]">
                    Provincial Tourism Campaign · Official Spotlight
                  </span>
                </div>
                <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight">
                  Abra in Motion.
                </h2>
              </div>
              <p className="text-sm text-white/70 max-w-md leading-relaxed text-left">
                Experience the living rhythm of the Cordillera — from thunderous emerald cascades to indigenous backstrap weaving and highland celebrations.
              </p>
            </div>

            {/* Main Stage: Cinema Video Player + Campaign Panel */}
            {(() => {
              const currentAd = videoAds[activeAdIndex] || videoAds[0];
              if (!currentAd) return null;

              return (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    {/* Left: Cinematic Video Showcase (7 Columns) */}
                    <div className="lg:col-span-7">
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-[#B88B2A]/30 group">
                        <video
                          ref={adVideoRef}
                          key={currentAd.id}
                          autoPlay
                          loop
                          muted={isMuted}
                          playsInline
                          poster={currentAd.thumbnail_url ? formatMediaUrl(currentAd.thumbnail_url) : undefined}
                          className="w-full h-full object-cover"
                          src={formatMediaUrl(currentAd.video_url)}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />

                        {/* Top-Left Category & Municipality Badges */}
                        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 pointer-events-none">
                          <span className="bg-[#153325]/90 backdrop-blur-md text-[#FAF7F2] text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-md border border-white/10 shadow-sm">
                            {currentAd.category || 'Eco-Tourism'}
                          </span>
                          {currentAd.municipality_name && (
                            <span className="bg-[#B88B2A]/90 backdrop-blur-md text-[#153325] text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md shadow-sm">
                              📍 {currentAd.municipality_name}, Abra
                            </span>
                          )}
                        </div>

                        {/* Bottom Video Quick Controls */}
                        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/15">
                          <button
                            type="button"
                            onClick={togglePlay}
                            className="p-2 text-white hover:text-[#B88B2A] transition-colors cursor-pointer rounded-lg hover:bg-white/10"
                            title={isPlaying ? 'Pause Video' : 'Play Video'}
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={toggleMute}
                            className="p-2 text-white hover:text-[#B88B2A] transition-colors cursor-pointer rounded-lg hover:bg-white/10 flex items-center gap-1 text-xs"
                            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                          >
                            {isMuted ? (
                              <>
                                <VolumeX className="w-4 h-4" />
                                <span className="text-[10px] font-semibold pr-1">Muted</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-semibold pr-1 text-emerald-400">Audio On</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right: Editorial Campaign Information (5 Columns) */}
                    <div className="lg:col-span-5 text-left flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] font-mono tracking-widest uppercase text-[#B88B2A] bg-[#B88B2A]/15 px-2.5 py-0.5 rounded-full border border-[#B88B2A]/30">
                            {currentAd.badge_label || 'Official Provincial DOT Spotlight'}
                          </span>
                        </div>

                        <h3 className="font-serif text-2xl sm:text-4xl font-bold text-white leading-tight mb-3">
                          {currentAd.title}
                        </h3>

                        {currentAd.subtitle && (
                          <p className="font-serif italic text-base sm:text-lg text-[#F3ECE0]/90 mb-4">
                            “{currentAd.subtitle}”
                          </p>
                        )}

                        <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-8">
                          {currentAd.description || 'Discover verified homestays, accredited tour guides, and breathtaking natural wonders through official tourism campaigns.'}
                        </p>
                      </div>

                      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <Link
                          to={currentAd.cta_link || '/municipalities'}
                          className="btn-editorial-gold inline-flex items-center justify-center gap-2 text-xs font-bold py-3 px-6 shadow-lg"
                        >
                          <span>{currentAd.cta_text || 'Explore Destination'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-white/60">
                          <ShieldCheck className="w-4 h-4 text-[#B88B2A] flex-shrink-0" />
                          <span>Endorsed by Provincial Tourism Office</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Playlist / Selector Strip if more than 1 ad */}
                  {videoAds.length > 1 && (
                    <div className="pt-6 border-t border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                          More Provincial Video Campaigns ({videoAds.length})
                        </span>
                        <span className="text-[11px] text-[#B88B2A]">
                          Click any feature to watch
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {videoAds.map((ad, idx) => {
                          const isActive = idx === activeAdIndex;
                          return (
                            <button
                              key={ad.id}
                              type="button"
                              onClick={() => {
                                setActiveAdIndex(idx);
                                setIsPlaying(true);
                              }}
                              className={`group text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[#153325] border-[#B88B2A] shadow-md ring-1 ring-[#B88B2A]'
                                  : 'bg-black/30 border-white/10 hover:border-white/30 hover:bg-black/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-12 rounded-lg bg-black/60 overflow-hidden flex-shrink-0 relative border border-white/10">
                                  {ad.thumbnail_url ? (
                                    <SafeImage
                                      src={formatMediaUrl(ad.thumbnail_url)}
                                      alt={ad.title}
                                      className="w-full h-full object-cover"
                                      fallback="landscape"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#153325]">
                                      <Film className="w-5 h-5 text-[#B88B2A]" />
                                    </div>
                                  )}
                                  <div className={`absolute inset-0 flex items-center justify-center ${
                                    isActive ? 'bg-[#B88B2A]/30' : 'bg-black/40 group-hover:bg-black/20'
                                  }`}>
                                    <Play className={`w-3.5 h-3.5 ${isActive ? 'text-[#B88B2A] fill-[#B88B2A]' : 'text-white'}`} />
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-bold text-[#B88B2A] truncate">
                                    {ad.municipality_name ? `${ad.municipality_name}, Abra` : ad.category}
                                  </p>
                                  <p className={`text-xs font-semibold truncate ${isActive ? 'text-white font-bold' : 'text-white/80 group-hover:text-white'}`}>
                                    {ad.title}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          3. DESTINATIONS: EDITORIAL PHOTO-DRIVEN SHOWCASE
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 pb-6 border-b border-[#E8DFC8]">
          <div>
            <span className="editorial-tag mb-3">
              Destinations
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#153325] tracking-tight">
              Featured Places
            </h2>
          </div>
          <p className="text-sm text-[#5A534E] max-w-md leading-relaxed">
            From the travertine terraces of Tineg to historic colonial streets in Tayum and the mountain ridges of Tubo.
          </p>
        </div>

        {/* Editorial Asymmetrical Layout: 1 Dominant Feature + 2 Companions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">

          {/* Main Hero Destination: Kaparkan Falls / Tineg (7 Columns) */}
          <div className="lg:col-span-7 flex flex-col justify-between group">
            <div className="img-editorial-wrapper rounded-lg aspect-[16/10] bg-[#153325] mb-6">
              <SafeImage
                src="/uploads/images (4).jpg"
                alt="Kaparkan Falls, Tineg, Abra"
                className="img-editorial w-full h-full object-cover"
                fallback="landscape"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-[#153325]/85 backdrop-blur-sm text-[#FAF7F2] text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded">
                  Tineg, Abra
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#B88B2A] uppercase tracking-wider mb-2">
                <span>Natural Wonder</span>
                <span>•</span>
                <span>Travertine Spring Cascades</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#153325] mb-3 group-hover:text-[#B88B2A] transition-colors">
                Kaparkan Falls
              </h3>
              <p className="text-sm text-[#5A534E] leading-relaxed mb-4">
                A multi-tiered natural travertine waterfall shaped into terraced emerald pools deep in the Cordillera forest. Guided treks required via accredited local tour guides.
              </p>
              <Link to="/municipalities" className="btn-editorial-ghost text-xs">
                <span>Explore Tineg & Kaparkan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 2 Companion Destinations (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col gap-10">

            {/* Companion 1: Tayum Heritage */}
            <div className="group">
              <div className="img-editorial-wrapper rounded-lg aspect-[16/9] bg-[#153325] mb-4">
                <SafeImage
                  src="/uploads/images (5).jpg"
                  alt="Tayum Heritage Town"
                  className="img-editorial w-full h-full object-cover"
                  fallback="landscape"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-[#153325]/85 backdrop-blur-sm text-[#FAF7F2] text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded">
                    Tayum, Abra
                  </span>
                </div>
              </div>
              <div className="text-[11px] font-semibold text-[#B88B2A] uppercase tracking-wider mb-1">
                Colonial Architecture & Weaving
              </div>
              <h4 className="font-serif text-xl font-bold text-[#153325] mb-2 group-hover:text-[#B88B2A] transition-colors">
                Tayum Heritage Village
              </h4>
              <p className="text-xs text-[#5A534E] leading-relaxed mb-3">
                Century-old Spanish Baroque brick church, colonial ancestral estates, and natural indigo loom weaving.
              </p>
              <Link to="/municipalities" className="btn-editorial-ghost text-xs">
                <span>View Tayum</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Companion 2: Tubo Mountain Ridges */}
            <div className="group">
              <div className="img-editorial-wrapper rounded-lg aspect-[16/9] bg-[#153325] mb-4">
                <SafeImage
                  src="/uploads/images (6).jpg"
                  alt="Tubo Highlands"
                  className="img-editorial w-full h-full object-cover"
                  fallback="landscape"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-[#153325]/85 backdrop-blur-sm text-[#FAF7F2] text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded">
                    Tubo, Abra
                  </span>
                </div>
              </div>
              <div className="text-[11px] font-semibold text-[#B88B2A] uppercase tracking-wider mb-1">
                Highland Peaks & Ridge Hikes
              </div>
              <h4 className="font-serif text-xl font-bold text-[#153325] mb-2 group-hover:text-[#B88B2A] transition-colors">
                Tubo Highland Valleys
              </h4>
              <p className="text-xs text-[#5A534E] leading-relaxed mb-3">
                Rugged mountain borders connecting Abra to Mountain Province with sunrise sea-of-clouds viewpoints.
              </p>
              <Link to="/municipalities" className="btn-editorial-ghost text-xs">
                <span>View Tubo</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

          </div>

        </div>

        {/* Municipality Grid (Open, Photography-Driven, No Generic Repeating Cards) */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-serif text-2xl font-bold text-[#153325]">
              Explore by Municipality
            </h3>
            <Link to="/municipalities" className="text-xs font-bold text-[#153325] hover:text-[#B88B2A] transition-colors flex items-center gap-1">
              <span>View all 27 municipalities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {municipalities.slice(0, 4).map((m) => (
              <Link
                key={m.id}
                to={`/municipalities/${m.id}`}
                className="group flex flex-col text-left"
              >
                <div className="img-editorial-wrapper aspect-[4/3] rounded-lg bg-[#153325] mb-4">
                  <SafeImage
                    src={m.featured_image_url || (m.images && m.images[0]?.image_url)}
                    alt={m.name}
                    className="img-editorial w-full h-full object-cover"
                    fallback="landscape"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h4 className="font-serif text-lg font-bold text-[#153325] group-hover:text-[#B88B2A] transition-colors">
                  {m.name}
                </h4>
                <p className="text-xs text-[#5A534E] line-clamp-2 mt-1 mb-2">
                  {m.description || `Discover natural landscapes, homestays, and local heritage in ${m.name}, Abra.`}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-[#5A534E] font-medium pt-2 border-t border-[#E8DFC8]/60 mt-auto">
                  <span>{m.attraction_count || 0} Attractions</span>
                  <span>•</span>
                  <span>{m.homestay_count || 0} Stays</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════
          3B. EXPERIENCE ABRA DIFFERENTLY (6 Core Pillars)
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#E8DFC8]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 pb-6 border-b border-[#E8DFC8]">
          <div className="text-left">
            <span className="editorial-tag mb-3">
              The Abra Experience
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#153325] tracking-tight">
              Experience Abra differently.
            </h2>
          </div>
          <p className="text-sm text-[#5A534E] max-w-md leading-relaxed text-left">
            Six dimensions of travel that connect you directly to the land, people, rivers, and centuries of preserved heritage.
          </p>
        </div>

        {/* 6 Photography-Driven Categories (No Generic Icons) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
          {EXPERIENCES.map((exp, idx) => (
            <Link
              key={idx}
              to={exp.link}
              className="group flex flex-col justify-between"
            >
              <div>
                <div className="img-editorial-wrapper aspect-[16/10] rounded-lg bg-[#153325] mb-5">
                  <SafeImage
                    src={exp.image}
                    alt={exp.title}
                    className="img-editorial w-full h-full object-cover"
                    fallback="landscape"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-[#153325]/90 backdrop-blur-sm text-[#FAF7F2] text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded border border-white/10">
                      {exp.category}
                    </span>
                  </div>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#153325] mb-2 group-hover:text-[#B88B2A] transition-colors">
                  {exp.title}
                </h3>
                <p className="text-xs text-[#5A534E] leading-relaxed mb-4">
                  {exp.desc}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[#153325] group-hover:text-[#B88B2A] transition-colors">
                <span>Explore {exp.category}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          3C. TASTE ABRA (Gastronomy & Local Harvest)
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-[#153325] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left: Editorial Intro (5 Columns) */}
            <div className="lg:col-span-5 text-left">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4A942] mb-3 inline-block">
                Local Gastronomy
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight mb-6">
                Taste Abra.
              </h2>
              <p className="text-sm sm:text-base text-white/80 leading-relaxed mb-8">
                Abra cuisine is anchored in fresh river harvests, indigenous forest foraging, and hearty highland comfort. From steaming bowls of annatto-infused Abra Miki noodles to raw wild honey and shade-grown Cordillera Arabica, every flavor carries a sense of place.
              </p>
              <Link to="/municipalities" className="btn-editorial-gold">
                <span>Explore Local Food & Markets</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>

            {/* Right: Food Cards (7 Columns) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              {LOCAL_FOODS.map((food, idx) => (
                <div key={idx} className="bg-[#1D4433] rounded-lg overflow-hidden border border-[#2D5D46] flex flex-col justify-between">
                  <div className="img-editorial-wrapper aspect-[4/3] bg-[#0C1E16]">
                    <SafeImage
                      src={food.image}
                      alt={food.name}
                      className="img-editorial w-full h-full object-cover"
                      fallback="landscape"
                    />
                  </div>
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#D4A942] block mb-1">
                        {food.category}
                      </span>
                      <h4 className="font-serif text-base font-bold text-white mb-1.5">
                        {food.name}
                      </h4>
                      <p className="text-[11px] text-white/70 leading-relaxed mb-3">
                        {food.desc}
                      </p>
                    </div>
                    <p className="text-[10px] text-[#D4A942]/80 font-medium pt-2 border-t border-[#2D5D46]">
                      📍 {food.origin}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          3D. STAY A LITTLE LONGER & MEET YOUR LOCAL GUIDE
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

          {/* Left Column: Featured Homestay (7 Columns) */}
          <div className="lg:col-span-7 text-left flex flex-col justify-between">
            <div>
              <span className="editorial-tag mb-3">
                Verified Accommodations
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#153325] tracking-tight mb-4">
                Stay a little longer.
              </h2>
              <p className="text-sm text-[#5A534E] leading-relaxed mb-8">
                Certified homestays provide safe, clean, and culturally immersive lodgings vetted by municipal tourism desks.
              </p>

              {/* Dominant Featured Stay */}
              <div className="border border-[#E8DFC8] rounded-lg overflow-hidden bg-white shadow-sm group">
                <div className="img-editorial-wrapper aspect-[16/9] bg-[#153325] relative">
                  <SafeImage
                    src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&auto=format&fit=crop&q=80"
                    alt="Casa Abra Heritage Homestay"
                    className="img-editorial w-full h-full object-cover"
                    fallback="landscape"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#153325]/90 backdrop-blur-sm text-[#FAF7F2] text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded border border-white/10">
                      Tayum Heritage District
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-[#153325]/90 backdrop-blur-sm text-white px-3 py-1 rounded text-xs font-bold">
                    ₱1,200 <span className="font-normal text-white/70">/ night</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="font-serif text-2xl font-bold text-[#153325] group-hover:text-[#B88B2A] transition-colors">
                      Casa De Tayum Heritage Homestay
                    </h3>
                    <div className="flex items-center text-[#B88B2A] text-xs font-bold">
                      <span>★ 4.9</span>
                      <span className="text-[#5A534E] font-normal ml-1">(24 reviews)</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#5A534E] leading-relaxed mb-4">
                    Colonial timber residence within walking distance of Santa Catalina Church and traditional natural indigo dyeing workshops. Hosted by accredited local residents.
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-[#E8DFC8]">
                    <span className="text-[11px] font-semibold text-[#153325]">
                      ✓ DOT & Municipal Desk Endorsed
                    </span>
                    <Link to="/municipalities" className="btn-editorial-ghost text-xs">
                      <span>View Stays in Abra</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Humanized Guide Showcase (5 Columns) */}
          <div className="lg:col-span-5 text-left flex flex-col justify-between">
            <div>
              <span className="editorial-tag mb-3">
                Accredited Local Guides
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#153325] tracking-tight mb-4">
                Meet your local guide.
              </h2>
              <p className="text-sm text-[#5A534E] leading-relaxed mb-8">
                Certified community guides lead river traverses, sacred mountain trails, and cultural immersions safely.
              </p>

              {/* Humanized Guide Card */}
              <div className="border border-[#E8DFC8] rounded-lg overflow-hidden bg-white shadow-sm p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#153325] flex-shrink-0 border border-[#E8DFC8]">
                    <SafeImage
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80"
                      alt="Juan Dela Cruz, Accredited Tour Guide"
                      className="w-full h-full object-cover"
                      fallback="avatar"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#153325]">
                      Juan Dela Cruz
                    </h3>
                    <p className="text-xs font-semibold text-[#B88B2A]">
                      DOT-Accredited Mountain & Eco Guide
                    </p>
                    <p className="text-[11px] text-[#5A534E] mt-0.5">
                      📍 Tineg, Abra · 8+ Years Experience
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-[#F3ECE0] rounded-md border border-[#E8DFC8] mb-5">
                  <p className="font-serif italic text-xs text-[#232120] leading-relaxed">
                    “The trail to Kaparkan is about more than reaching the water. It is about understanding the river, respecting the ancestral Tingguian forests, and traveling with care. Let me show you the Abra I know.”
                  </p>
                </div>

                <div className="space-y-2 text-xs text-[#5A534E] mb-6">
                  <div className="flex items-center justify-between">
                    <span>Expertise:</span>
                    <span className="font-semibold text-[#153325]">Kaparkan Treks, River Navigation</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Languages:</span>
                    <span className="font-semibold text-[#153325]">Ilokano, Tagalog, English, Itneg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Accreditation:</span>
                    <span className="font-semibold text-[#153325]">CAR-DOT Guide #2024-ABR-041</span>
                  </div>
                </div>

                <Link to="/municipalities" className="btn-editorial-primary w-full text-center text-xs justify-center">
                  <span>Connect with Certified Guides</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          4. ABRA MUNICIPALITIES & INTERACTIVE MAP EXPLORER
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-[#F3ECE0] border-y border-[#E8DFC8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left: Editorial Story on the 27 Municipalities (5 Columns) */}
            <div className="lg:col-span-5 text-left">
              <span className="editorial-tag mb-4">
                Geography & Regions
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#153325] leading-tight mb-6">
                27 Municipalities.<br />
                <span className="italic font-normal">One Cordillera Province.</span>
              </h2>
              <p className="text-sm text-[#5A534E] leading-relaxed mb-6">
                Abra's unique geography spans from the central heritage valley along the Abra River to the high mountain headwaters of Tineg, Tubo, and Malibcong.
              </p>

              {/* Clean region list (no heavy badges) */}
              <div className="space-y-4 mb-8">
                <div className="p-3.5 bg-[#FAF7F2] rounded-md border border-[#E8DFC8]">
                  <p className="font-serif font-bold text-sm text-[#153325]">Central Heritage Valley</p>
                  <p className="text-xs text-[#5A534E] mt-0.5">Bangued, Tayum, Bucay, Peñarrubia, Pidigan</p>
                </div>
                <div className="p-3.5 bg-[#FAF7F2] rounded-md border border-[#E8DFC8]">
                  <p className="font-serif font-bold text-sm text-[#153325]">Northern Rainforests & Waterfalls</p>
                  <p className="text-xs text-[#5A534E] mt-0.5">Tineg, Danglas, San Juan, Lagayan, La Paz</p>
                </div>
                <div className="p-3.5 bg-[#FAF7F2] rounded-md border border-[#E8DFC8]">
                  <p className="font-serif font-bold text-sm text-[#153325]">Highland Ridges & Sacred Ancestral Lands</p>
                  <p className="text-xs text-[#5A534E] mt-0.5">Tubo, Boliney, Daguioman, Bucloc, Malibcong, Sallapadan</p>
                </div>
              </div>

              <Link to="/map" className="btn-editorial-primary">
                <Map className="w-4 h-4" />
                <span>Open Interactive Map</span>
              </Link>
            </div>

            {/* Right: Map Showcase Preview (7 Columns) */}
            <div className="lg:col-span-7">
              <div className="relative rounded-lg overflow-hidden border border-[#E8DFC8] shadow-lg bg-[#153325]">
                <div className="aspect-[16/10] relative flex items-center justify-center p-8 text-center text-white">
                  <img
                    src="/uploads/images (6).jpg"
                    alt="Abra Topography Preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-35"
                  />
                  <div className="relative z-10 max-w-md">
                    <div className="w-12 h-12 rounded-full bg-[#B88B2A]/20 border border-[#B88B2A] flex items-center justify-center mx-auto mb-4 text-[#D4A942]">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-white mb-2">
                      Abra Living Geo-Map
                    </h3>
                    <p className="text-xs text-white/80 leading-relaxed mb-6">
                      Explore boundary polygons of all 27 municipalities, pinned natural attractions, verified homestays, and tour guide meeting points.
                    </p>
                    <Link to="/map" className="btn-editorial-gold text-xs !py-2.5 !px-5">
                      Explore Full Map
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          5. CULTURE & HERITAGE: AUTHENTIC ABRA STORYTELLING
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-16 text-left">
          <span className="editorial-tag mb-3">
            Identity & Tradition
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#153325] tracking-tight">
            Culture & Heritage
          </h2>
          <p className="text-sm text-[#5A534E] leading-relaxed mt-4">
            Abra is the ancestral home of the Tingguian (Itneg) people, known for sacred geometric weaving, natural dye forestry, and resilient highland traditions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {CULTURAL_STORIES.map((story, i) => (
            <div key={i} className="flex flex-col text-left group">
              <div className="img-editorial-wrapper aspect-[4/3] rounded-lg bg-[#153325] mb-5">
                <SafeImage
                  src={story.image}
                  alt={story.title}
                  className="img-editorial w-full h-full object-cover"
                  fallback={story.fallback}
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-[#FAF7F2] text-[#153325] text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded border border-[#E8DFC8]">
                    {story.tag}
                  </span>
                </div>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#153325] mb-2 group-hover:text-[#B88B2A] transition-colors">
                {story.title}
              </h3>
              <p className="text-xs text-[#5A534E] leading-relaxed">
                {story.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          6. GUIDED ITINERARY PLANNER TEASER
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-[#153325] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4A942]">
              Trip Concierge
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight mt-3 mb-4">
              Plan your Abra adventure
            </h2>
            <p className="text-sm text-white/75 leading-relaxed">
              Curate your day-by-day travel schedule with verified homestays, accredited guides, and destinations.
            </p>
          </div>

          {/* Interactive Guided Selector */}
          <div className="max-w-4xl mx-auto bg-[#1D4433] border border-[#2D5D46] rounded-lg p-6 sm:p-8 mb-10">

            {/* Step 1: Trip Style */}
            <div className="mb-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#D4A942] mb-3 text-left">
                1. What kind of trip are you looking for?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TRIP_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-3 text-left rounded-md border transition-all text-xs font-semibold ${
                      selectedStyle === style.id
                        ? 'bg-[#B88B2A] text-white border-[#B88B2A]'
                        : 'bg-[#153325] text-white/80 border-[#2D5D46] hover:border-[#D4A942]'
                    }`}
                  >
                    <p className="font-bold">{style.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Duration */}
            <div className="mb-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#D4A942] mb-3 text-left">
                2. How many days?
              </label>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4].map(days => (
                  <button
                    key={days}
                    onClick={() => setSelectedDays(days)}
                    className={`flex-1 py-2.5 rounded-md border text-xs font-bold transition-all ${
                      selectedDays === days
                        ? 'bg-[#B88B2A] text-white border-[#B88B2A]'
                        : 'bg-[#153325] text-white/80 border-[#2D5D46] hover:border-[#D4A942]'
                    }`}
                  >
                    {days === 4 ? '4+ Days' : `${days} ${days === 1 ? 'Day' : 'Days'}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Generated Preview */}
            <div className="p-5 bg-[#153325] rounded-md border border-[#2D5D46] text-left">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2D5D46]">
                <h4 className="font-serif font-bold text-base text-[#FAF7F2]">
                  {SAMPLE_ITINERARIES[selectedDays].title}
                </h4>
                <span className="text-[10px] font-bold text-[#D4A942] uppercase tracking-wider">
                  Suggested Route
                </span>
              </div>
              <div className="space-y-3">
                {SAMPLE_ITINERARIES[selectedDays].stops.map((stop, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <span className="font-bold text-[#D4A942] min-w-[70px] flex-shrink-0">
                      {stop.time}
                    </span>
                    <div>
                      <p className="font-semibold text-white">{stop.place}</p>
                      <p className="text-[11px] text-white/60">{stop.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="mt-8 text-center">
              <Link to="/itinerary" className="btn-editorial-gold !py-3 !px-8 text-sm">
                Open Full Itinerary Workspace
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          7. PLATFORM STATS & OFFICIAL BROADCASTS
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#E8DFC8]">

        {/* Quiet, Confident Numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 text-center">
          <div>
            <p className="font-serif text-4xl sm:text-5xl font-bold text-[#153325]">
              {stats.municipalities || 27}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-[#5A534E] mt-1">
              Municipalities
            </p>
            <p className="text-[11px] text-[#5A534E]/70">Full province coverage</p>
          </div>
          <div>
            <p className="font-serif text-4xl sm:text-5xl font-bold text-[#153325]">
              {stats.homestays || '—'}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-[#5A534E] mt-1">
              Verified Homestays
            </p>
            <p className="text-[11px] text-[#5A534E]/70">Accredited by Tourism Offices</p>
          </div>
          <div>
            <p className="font-serif text-4xl sm:text-5xl font-bold text-[#153325]">
              {stats.guides || '—'}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-[#5A534E] mt-1">
              Accredited Guides
            </p>
            <p className="text-[11px] text-[#5A534E]/70">DOT-certified professionals</p>
          </div>
          <div>
            <p className="font-serif text-4xl sm:text-5xl font-bold text-[#153325]">
              {stats.attractions || '—'}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-[#5A534E] mt-1">
              Listed Destinations
            </p>
            <p className="text-[11px] text-[#5A534E]/70">Eco-sites & cultural landmarks</p>
          </div>
        </div>

        {/* Official Tourism Announcements Bulletin */}
        {announcements.length > 0 && (
          <div className="pt-10 border-t border-[#E8DFC8]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold text-[#153325]">
                Official Tourism Advisories
              </h3>
              <span className="text-[11px] text-[#5A534E] font-medium">
                Provincial Tourism Office (DOT) of Abra
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {announcements.map((a) => (
                <div key={a.id} className="p-5 bg-[#F3ECE0] rounded-md border border-[#E8DFC8]">
                  <p className="font-serif font-bold text-sm text-[#153325] mb-2 line-clamp-1">
                    {a.title}
                  </p>
                  <p className="text-xs text-[#5A534E] leading-relaxed line-clamp-3 mb-3">
                    {a.content}
                  </p>
                  <span className="text-[10px] text-[#5A534E]/80">
                    {new Date(a.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>

      {/* ══════════════════════════════════════════════════════
          8. STAKEHOLDER PATHWAYS (For Travelers, Owners, Guides & Desks)
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">

          {/* Card 1: Homestay Owners */}
          <div className="p-8 bg-[#F3ECE0] rounded-lg border border-[#E8DFC8] flex flex-col justify-between">
            <div>
              <span className="editorial-tag mb-3">
                For Accommodations
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#153325] mb-3">
                List Your Homestay
              </h3>
              <p className="text-xs text-[#5A534E] leading-relaxed mb-6">
                Register your local property, submit municipal accreditation requirements digitally, and welcome verified travelers across the province.
              </p>
            </div>
            <Link to="/register" className="btn-editorial-primary text-xs w-fit">
              Register Property
            </Link>
          </div>

          {/* Card 2: Tour Guides */}
          <div className="p-8 bg-[#F3ECE0] rounded-lg border border-[#E8DFC8] flex flex-col justify-between">
            <div>
              <span className="editorial-tag mb-3">
                For Local Guides
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#153325] mb-3">
                Accredited Tour Guides
              </h3>
              <p className="text-xs text-[#5A534E] leading-relaxed mb-6">
                Get endorsed by your Municipal Tourism Office, publish guided trek packages (Kaparkan, mountain ridges), and manage traveler bookings.
              </p>
            </div>
            <Link to="/register" className="btn-editorial-primary text-xs w-fit">
              Apply as Guide
            </Link>
          </div>

          {/* Card 3: Municipal Officers */}
          <div className="p-8 bg-[#153325] text-white rounded-lg border border-[#1D4433] flex flex-col justify-between">
            <div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#D4A942] bg-[#1D4433] px-2.5 py-0.5 rounded mb-3 border border-[#2D5D46]">
                Municipal DOT Desk
              </span>
              <h3 className="font-serif text-2xl font-bold text-white mb-3">
                Municipal Governance
              </h3>
              <p className="text-xs text-white/75 leading-relaxed mb-6">
                Endorse local listings, resolve tourist inquiries and grievance reports, update attractions, and download official municipal statistics.
              </p>
            </div>
            <Link to="/portal/login" className="btn-editorial-gold text-xs w-fit">
              Access Desk Portal
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
};

export default Home;
