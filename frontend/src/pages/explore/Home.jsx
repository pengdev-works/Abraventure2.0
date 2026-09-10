import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, MapPin, Calendar, Users,
  Compass, Map, ChevronRight, ChevronDown,
  ChevronLeft, Leaf, Bell, Play, Pause, Volume2, VolumeX, ExternalLink, BookOpen
} from 'lucide-react';
import SafeImage, { formatMediaUrl } from '../../components/common/SafeImage';

/* ─── Featured Destinations Data (Mockup Item 1) ───────────────── */
const FEATURED_DESTINATIONS = [
  {
    id: 1,
    name: 'Kaparkan Falls',
    location: 'Tineg, Abra',
    tag: 'Nature',
    tagColor: 'bg-[#2F7D5A] text-white',
    desc: 'A hidden paradise of cascading waterfalls and natural travertine pools.',
    image: '/uploads/kaparkan-falls.jpg',
    link: '/municipalities'
  },
  {
    id: 2,
    name: 'Ar-Arbis Falls',
    location: 'Lagayan, Abra',
    tag: 'Nature',
    tagColor: 'bg-[#2F7D5A] text-white',
    desc: 'A majestic twin falls surrounded by lush greenery and cool springs.',
    image: '/uploads/ar-arbis-falls.jpg',
    link: '/municipalities'
  },
  {
    id: 3,
    name: 'Apao Rolling Hills',
    location: 'Tineg, Abra',
    tag: 'Adventure',
    tagColor: 'bg-[#B88B2A] text-white',
    desc: 'Breathtaking views, endless hills, perfect for adventure seekers.',
    image: '/uploads/apao-rolling-hills.jpg',
    link: '/municipalities'
  },
  {
    id: 4,
    name: 'La Paz Weaving Community',
    location: 'La Paz, Abra',
    tag: 'Culture',
    tagColor: 'bg-[#922E28] text-white',
    desc: 'Experience the rich tradition of Abel weaving and local craftsmanship.',
    image: '/uploads/la-paz-weaving.jpg',
    link: '/municipalities'
  }
];

/* ─── Culture & Heritage Stories Carousel ─────────────────────── */
const CULTURE_STORIES = [
  {
    title: 'Abel Weaving & Tingguian Traditions',
    category: 'OUR CULTURE & HERITAGE',
    desc: 'Discover the rich cultural heritage of Abra through its indigenous communities, traditional crafts, and living traditions passed across generations on backstrap looms.',
    image: '/uploads/abel-weaving-tingguian.jpg',
    link: '/events'
  },
  {
    title: 'Natural Indigo Dye Heritage of Tayum',
    category: 'ORGANIC LIVING CRAFT',
    desc: 'Tayum master artisans extract deep indigo and plant pigments from Cordillera flora, establishing Abra as a national center of sustainable natural dye heritage.',
    image: '/uploads/tayum-natural-dyes.jpg',
    link: '/events'
  },
  {
    title: 'Century-Old Spanish Brick Baroque Treasures',
    category: 'HISTORICAL ARCHITECTURE',
    desc: 'National Cultural Treasures like Santa Catalina de Alejandria Church in Tayum stand with red clay brick facades carved with indigenous Tingguian motifs.',
    image: '/uploads/tayum-baroque-church.jpg',
    link: '/municipalities'
  }
];


/* ─── Upcoming Events Data (Mockup Item 4) ─────────────────────── */
const UPCOMING_EVENTS = [
  {
    id: 1,
    title: 'Abra Provincial Hermosa Festival',
    location: 'Bangued, Abra',
    month: 'OCT',
    day: '12',
    tag: 'CULTURE',
    tagColor: 'bg-[#922E28] text-white',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 2,
    title: 'Mountain Camping Experience',
    location: 'Tineg, Abra',
    month: 'OCT',
    day: '18',
    tag: 'ADVENTURE',
    tagColor: 'bg-[#2F7D5A] text-white',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 3,
    title: 'Abra River Festival',
    location: 'Bucay, Abra',
    month: 'OCT',
    day: '25',
    tag: 'FESTIVAL',
    tagColor: 'bg-[#B88B2A] text-white',
    image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 4,
    title: 'Local Crafts Fair',
    location: 'La Paz, Abra',
    month: 'NOV',
    day: '02',
    tag: 'CULTURE',
    tagColor: 'bg-[#922E28] text-white',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80'
  }
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT: Home
═══════════════════════════════════════════════════════════════ */
const Home = () => {
  const navigate = useNavigate();

  /* ─── Hero Config from /api/announcements/hero ─── */
  const [heroConfig, setHeroConfig] = useState({
    badge_text: 'Discover Abra • Cordillera',
    title: 'Discover the Soul of Abra',
    subtitle: 'Majestic mountains, rich culture, historic heritage, crystal-clear rivers, and unforgettable local experiences await you in the Land of Promise.',
    video_url: null,
    background_image_url: null,
  });

  /* ─── Search Widget State ─── */
  const [searchDestination, setSearchDestination] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchActivity, setSearchActivity] = useState('');

  /* ─── Culture Story Carousel Index ─── */
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  /* ─── Municipalities from backend API ─── */
  const [municipalities, setMunicipalities] = useState([]);

  /* ─── Trust / Verification Stats ─── */
  const [stats, setStats] = useState({ municipalities: 27, homestays: 0, guides: 0, attractions: 0 });

  /* ─── Official Announcements ─── */
  const [announcements, setAnnouncements] = useState([]);

  /* ─── Video Advertisements ─── */
  const [videoAds, setVideoAds] = useState([]);
  const [activeAdIndex, setActiveAdIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const adVideoRef = useRef(null);

  useEffect(() => {
    fetch('/api/announcements/hero')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.subtitle) setHeroConfig(prev => ({ ...prev, ...d })); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/municipalities')
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (Array.isArray(d) && d.length > 0) setMunicipalities(d); })
      .catch(() => {});
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
      .then(d => { if (Array.isArray(d)) setAnnouncements(d.slice(0, 3)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/advertisements/public')
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (Array.isArray(d) && d.length > 0) setVideoAds(d); })
      .catch(() => {});
  }, []);

  /* ─── Hero Scroll Indicator State ─── */
  const [heroScrolled, setHeroScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setHeroScrolled(window.scrollY > 80);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ─── Scroll Reveal Intersection Observer ─── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [announcements, videoAds]);

  const scrollToExplore = () => {
    const el = document.getElementById('destinations');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchDestination.trim();
    if (query) {
      navigate(`/municipalities?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/municipalities');
    }
  };

  const nextStory = () => setActiveStoryIndex((prev) => (prev + 1) % CULTURE_STORIES.length);
  const prevStory = () => setActiveStoryIndex((prev) => (prev - 1 + CULTURE_STORIES.length) % CULTURE_STORIES.length);
  const activeStory = CULTURE_STORIES[activeStoryIndex];
  const activeAd = videoAds[activeAdIndex] || null;
  const muniNames = municipalities.map(m => m.name);

  const togglePlay = () => {
    if (!adVideoRef.current) return;
    if (isPlaying) { adVideoRef.current.pause(); } else { adVideoRef.current.play(); }
    setIsPlaying(!isPlaying);
  };
  const toggleMute = () => {
    if (!adVideoRef.current) return;
    adVideoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors select-text">

      {/* ══════════════════════════════════════════════════════
          1. FULL-BLEED CINEMATIC HERO SECTION
      ══════════════════════════════════════════════════════ */}
      <section id="explore" className="relative min-h-[90vh] lg:min-h-[96vh] flex flex-col justify-between overflow-visible bg-[#09231C]">
        {/* Panoramic Mountain Landscape with Winding Abra River */}
        <div className="absolute inset-0 z-0">
          {heroConfig.video_url ? (
            <video
              src={formatMediaUrl(heroConfig.video_url)}
              className="w-full h-full object-cover object-center"
              autoPlay loop muted playsInline
            />
          ) : heroConfig.background_image_url ? (
            <img src={formatMediaUrl(heroConfig.background_image_url)} alt="Scenic Abra Landscape" className="w-full h-full object-cover object-center" />
          ) : (
            <img
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=2000&auto=format&fit=crop&q=85"
              alt="Majestic Abra Cordillera Mountains and River Valley"
              className="w-full h-full object-cover object-center"
            />
          )}
          {/* Multi-layered cinematic gradient overlays for high text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09231C] via-[#09231C]/45 to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09231C]/80 via-[#09231C]/30 to-transparent" />
        </div>

        {/* Hero Narrative Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 lg:pt-44 pb-20 sm:pb-28 text-left">
          <div className="max-w-2xl">
            {/* Small Eyebrow Label */}
            <p className="text-[11px] sm:text-xs font-sans font-bold uppercase tracking-[0.3em] text-[var(--color-gold-300)] mb-3 sm:mb-4 drop-shadow-sm">
              {heroConfig.badge_text || 'Discover Abra • Cordillera'}
            </p>

            {/* Headline — driven by Content Management → Homepage Hero & Video */}
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08] mb-4 sm:mb-6 drop-shadow-md">
              {heroConfig.title || 'Discover the Soul of Abra'}
            </h1>

            {/* Supporting Description */}
            <p className="text-sm sm:text-base text-white/90 leading-relaxed font-normal mb-8 sm:mb-10 max-w-xl drop-shadow-sm">
              {heroConfig.subtitle}
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Link
                to="/municipalities"
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-[var(--color-gold)] text-[#09231C] hover:bg-[var(--color-gold-400)] transition-all shadow-lg hover:shadow-xl cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Abra</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/itinerary"
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-black/25 hover:bg-black/40 text-white border border-white/40 hover:border-white transition-all backdrop-blur-sm cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Plan Your Journey</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Script Signature Accent & Subtle Scroll Indicator */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16 flex items-center justify-between">
          <button
            type="button"
            onClick={scrollToExplore}
            aria-label="Scroll to explore destinations"
            className={`inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-[var(--color-cream-100)]/75 hover:text-[var(--color-gold)] transition-all duration-300 cursor-pointer group ${
              heroScrolled ? 'opacity-0 pointer-events-none -translate-y-2' : 'opacity-100 translate-y-0'
            }`}
          >
            <ChevronDown className="w-4 h-4 text-[var(--color-gold)] transition-transform duration-300 group-hover:translate-y-0.5" />
            <span>Scroll to explore</span>
          </button>

          <p className="font-serif italic text-base sm:text-lg text-[var(--color-cream-100)]/80 tracking-wide drop-shadow-md hidden md:block">
            Mountains · Culture · Heritage · Rivers · People
          </p>
        </div>

        {/* ── Floating Search Bar Widget (Overlaps into Next Section) ── */}
        <div className="relative z-20 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mb-10 sm:-mb-12">
          <form
            onSubmit={handleSearch}
            className="bg-[#09231C]/92 dark:bg-[#09231C]/95 backdrop-blur-xl border border-[var(--border-subtle)]/30 rounded-2xl p-3 sm:p-4 shadow-2xl text-white"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-center">
              {/* Field 1: Destination */}
              <div className="lg:col-span-4 flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                <MapPin className="w-5 h-5 text-[var(--color-gold)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <label htmlFor="search-dest" className="block text-[10px] uppercase font-bold tracking-wider text-[var(--color-cream-200)]/60">
                    Where do you want to go?
                  </label>
                  <input
                    id="search-dest"
                    type="text"
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    placeholder={muniNames.length > 0 ? `e.g. ${muniNames[0]}` : 'Search destinations...'}
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-white/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Field 2: Date Selector */}
              <div className="lg:col-span-3 flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                <Calendar className="w-5 h-5 text-[var(--color-gold)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <label htmlFor="search-date" className="block text-[10px] uppercase font-bold tracking-wider text-[var(--color-cream-200)]/60">
                    When?
                  </label>
                  <input
                    id="search-date"
                    type="text"
                    onFocus={(e) => (e.target.type = 'date')}
                    onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    placeholder="Select date"
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-white/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Field 3: Type Dropdown */}
              <div className="lg:col-span-3 flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                <Users className="w-5 h-5 text-[var(--color-gold)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <label htmlFor="search-activity" className="block text-[10px] uppercase font-bold tracking-wider text-[var(--color-cream-200)]/60">
                    Type
                  </label>
                  <select
                    id="search-activity"
                    value={searchActivity}
                    onChange={(e) => setSearchActivity(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-white focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-[#0F2F25] text-white">All Activities</option>
                    <option value="waterfalls" className="bg-[#0F2F25] text-white">Waterfalls & Springs</option>
                    <option value="trekking" className="bg-[#0F2F25] text-white">Mountain Trekking</option>
                    <option value="culture" className="bg-[#0F2F25] text-white">Culture & Weaving</option>
                    <option value="heritage" className="bg-[#0F2F25] text-white">Historic Churches</option>
                    <option value="homestays" className="bg-[#0F2F25] text-white">Accredited Homestays</option>
                  </select>
                </div>
              </div>

              {/* Field 4: Search Button */}
              <div className="lg:col-span-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-5 rounded-xl font-bold text-xs sm:text-sm bg-[var(--color-gold)] text-[#09231C] hover:bg-[var(--color-gold-400)] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          1B. OFFICIAL TRAVEL ADVISORY / ANNOUNCEMENT BANNER
      ══════════════════════════════════════════════════════ */}
      {announcements.length > 0 && (
        <section className="bg-[#0F2F25] border-b border-[#1D4433] pt-16 sm:pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-gold)]/20 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-[var(--color-gold)]" />
                </div>
                <div>
                  <h2 className="font-serif text-base sm:text-lg font-bold text-white leading-tight">Official Tourism Advisories</h2>
                  <p className="text-[11px] text-white/60">Provincial Tourism Office (DOT) of Abra</p>
                </div>
              </div>
              <Link to="/announcements" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-gold)] hover:underline self-start sm:self-auto group shrink-0">
                <span>View All Advisories</span><ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {announcements.map((a) => (
                <div key={a.id} className="p-5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-[var(--color-gold)]/40 transition-all text-left">
                  <p className="font-serif font-bold text-sm text-white mb-2 line-clamp-1">{a.title}</p>
                  <p className="text-xs text-white/70 leading-relaxed line-clamp-3 mb-3">{a.content}</p>
                  <span className="text-[10px] text-white/50">{new Date(a.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          2. TRUST & VERIFICATION STATS STRIP
      ══════════════════════════════════════════════════════ */}
      <section className={`bg-[var(--bg-card)] border-b border-[var(--border-app)] py-5${announcements.length === 0 ? ' pt-16 sm:pt-20' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#153325] flex-shrink-0 mt-1 hidden sm:block" />
              <div><p className="font-bold text-sm text-[var(--text-primary)]">{stats.municipalities || 27} Municipalities</p><p className="text-[11px] text-[var(--text-secondary)]">Official DOT endorsement</p></div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B88B2A] flex-shrink-0 mt-1 hidden sm:block" />
              <div><p className="font-bold text-sm text-[var(--text-primary)]">{stats.homestays > 0 ? `${stats.homestays}+ Homestays` : 'Verified Homestays'}</p><p className="text-[11px] text-[var(--text-secondary)]">Safety-compliant stays</p></div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#355C6D] flex-shrink-0 mt-1 hidden sm:block" />
              <div><p className="font-bold text-sm text-[var(--text-primary)]">{stats.guides > 0 ? `${stats.guides}+ Guides` : 'Accredited Guides'}</p><p className="text-[11px] text-[var(--text-secondary)]">Certified mountain guides</p></div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2D5D46] flex-shrink-0 mt-1 hidden sm:block" />
              <div><p className="font-bold text-sm text-[var(--text-primary)]">{stats.attractions > 0 ? `${stats.attractions}+ Attractions` : 'Tourist Sites'}</p><p className="text-[11px] text-[var(--text-secondary)]">Eco-sites & landmarks</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          3. FEATURED DESTINATIONS / DISCOVER ABRA
      ══════════════════════════════════════════════════════ */}
      <section id="destinations" className="reveal-on-scroll pt-20 sm:pt-24 pb-16 sm:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-10 pb-4 border-b border-[var(--border-subtle)]">
          <div className="text-left">
            <span className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.25em] text-[var(--color-gold)] block mb-1">
              Featured Destinations
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
              Discover Abra
            </h2>
          </div>
          <Link
            to="/municipalities"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--color-gold)] transition-colors group"
          >
            <span>View All Destinations</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 4-Column Destinations Grid matching mockup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_DESTINATIONS.map((dest, idx) => (
            <div
              key={dest.id}
              className={`bg-[var(--bg-card)] rounded-2xl border border-[var(--border-app)] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group text-left reveal-on-scroll stagger-${(idx % 4) + 1}`}
            >
              {/* Image Container with Badge */}
              <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-forest-900)]">
                <img
                  src={dest.image}
                  alt={dest.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${dest.tagColor} shadow-sm`}>
                    {dest.tag}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--color-gold)] transition-colors mb-1">
                    {dest.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mb-3">
                    <MapPin className="w-3.5 h-3.5 text-[var(--color-gold)] shrink-0" />
                    <span>{dest.location}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                    {dest.desc}
                  </p>
                </div>

                {/* Bottom Action Arrow */}
                <div className="pt-4 mt-4 border-t border-[var(--border-subtle)] flex items-center justify-end">
                  <Link
                    to={dest.link}
                    aria-label={`Explore ${dest.name}`}
                    className="w-8 h-8 rounded-full border border-[var(--border-app)] flex items-center justify-center text-[var(--text-secondary)] group-hover:border-[var(--color-gold)] group-hover:bg-[var(--color-gold)] group-hover:text-[#09231C] transition-all"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          3. "PLAN YOUR ABRA ADVENTURE" DARK FOREST STRIP
      ══════════════════════════════════════════════════════ */}
      <section id="itinerary" className="reveal-on-scroll bg-[#0E2F24] text-white py-16 px-4 sm:px-6 lg:px-8 border-y border-[#174638]">
        <div className="max-w-7xl mx-auto">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 text-left">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
                Plan Your Abra Adventure
              </h2>
              <p className="text-xs sm:text-sm text-white/80 max-w-xl leading-relaxed">
                Create meaningful journeys and experience the best of Abra in just a few steps.
              </p>
            </div>
            <Link
              to="/itinerary"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--color-gold)] hover:underline self-start sm:self-auto group"
            >
              <span>View How It Works</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* 3-Step Column Grid with Dividers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Step 1 */}
            <div className="flex flex-col md:pr-6">
              <div className="w-12 h-12 rounded-full border border-[var(--color-gold)]/50 bg-[var(--color-gold)]/15 text-[var(--color-gold)] flex items-center justify-center mb-5">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white mb-2">
                1. Explore Destinations
              </h3>
              <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                Discover hidden gems, natural wonders, and cultural sites across the province.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:px-6 md:border-l border-white/10">
              <div className="w-12 h-12 rounded-full border border-[var(--color-gold)]/50 bg-[var(--color-gold)]/15 text-[var(--color-gold)] flex items-center justify-center mb-5">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white mb-2">
                2. Build Your Itinerary
              </h3>
              <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                Plan your trip, save your favorite spots, and manage your schedule.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:pl-6 md:border-l border-white/10">
              <div className="w-12 h-12 rounded-full border border-[var(--color-gold)]/50 bg-[var(--color-gold)]/15 text-[var(--color-gold)] flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white mb-2">
                3. Experience Local Culture
              </h3>
              <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                Meet local communities, support local businesses, and immerse yourself in Abra's heritage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          4. TWO-COLUMN FEATURE SHOWCASE (MAP & CULTURE)
      ══════════════════════════════════════════════════════ */}
      <section id="map" className="reveal-on-scroll py-20 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

          {/* Left Card: Explore Abra Interactive Map Showcase */}
          <div className="bg-[#09231C] text-white rounded-2xl border border-[#285044] p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden shadow-xl min-h-[380px] text-left">
            {/* Topographic Background Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <circle cx="80%" cy="30%" r="180" fill="none" stroke="#C99A2E" strokeWidth="1" strokeOpacity="0.4" />
                <circle cx="80%" cy="30%" r="130" fill="none" stroke="#C99A2E" strokeWidth="1" strokeOpacity="0.3" />
                <circle cx="80%" cy="30%" r="80" fill="none" stroke="#C99A2E" strokeWidth="1" strokeOpacity="0.5" />
              </svg>
            </div>

            <div className="relative z-10 max-w-sm mb-6">
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
                Explore Abra <br />
                Interactive Map
              </h3>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-6">
                Find destinations, homestays, food spots, and more — all in one map.
              </p>
              <Link
                to="/map"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[var(--color-gold)] text-[#09231C] hover:bg-[var(--color-gold-400)] transition-all shadow-md"
              >
                <span>Open Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Visual Vector Map with Pinned Towns & Legend */}
            <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Map Outline & Pins */}
              <div className="flex items-center gap-3 flex-wrap">
                {['Tineg', 'Bangued', 'Lagayan', 'San Quintin', 'Bucay'].map((town) => (
                  <span
                    key={town}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[var(--color-gold-300)]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] animate-pulse" />
                    <span>{town}</span>
                  </span>
                ))}
              </div>

              {/* Map Legend */}
              <div className="flex items-center gap-3 text-[10px] text-white/60 shrink-0">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Attractions
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Homestays
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Events
                </span>
              </div>
            </div>
          </div>

          {/* Right Card: Our Culture & Heritage (Abel Weaving Split Card) */}
          <div id="culture" className="bg-[var(--bg-card)] text-[var(--text-primary)] rounded-2xl border border-[var(--border-app)] shadow-xl overflow-hidden flex flex-col sm:flex-row text-left min-h-[380px]">
            {/* Left Photo */}
            <div className="sm:w-1/2 relative min-h-[220px] sm:min-h-full bg-[var(--color-forest-900)] overflow-hidden">
              <img
                src={activeStory.image}
                alt={activeStory.title}
                loading="lazy"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent sm:hidden" />
            </div>

            {/* Right Content */}
            <div className="sm:w-1/2 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-gold)] block mb-1.5">
                  {activeStory.category}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[var(--text-primary)] leading-tight mb-3">
                  {activeStory.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {activeStory.desc}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <Link
                  to={activeStory.link}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border-app)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors"
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {/* Carousel Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={prevStory}
                    aria-label="Previous cultural story"
                    className="w-7 h-7 rounded-full border border-[var(--border-app)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={nextStory}
                    aria-label="Next cultural story"
                    className="w-7 h-7 rounded-full border border-[var(--border-app)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          5. "WHAT'S HAPPENING IN ABRA" (UPCOMING EVENTS)
      ══════════════════════════════════════════════════════ */}
      <section id="events" className="reveal-on-scroll py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <div className="flex items-end justify-between mb-10 pb-4 border-b border-[var(--border-subtle)]">
          <div className="text-left">
            <span className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.25em] text-[var(--color-gold)] block mb-1">
              Upcoming Events
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
              What's Happening in Abra
            </h2>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--color-gold)] transition-colors group"
          >
            <span>View All Events</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 4-Card Events Grid matching mockup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {UPCOMING_EVENTS.map((event, idx) => (
            <Link
              key={event.id}
              to="/events"
              className={`bg-[var(--bg-card)] rounded-2xl border border-[var(--border-app)] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group text-left reveal-on-scroll stagger-${(idx % 4) + 1}`}
            >
              {/* Image with Overlaid Date Badge */}
              <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-forest-900)]">
                <img
                  src={event.image}
                  alt={event.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Date Badge */}
                <div className="absolute top-3 left-3 bg-white text-[#1C2420] rounded-xl px-2.5 py-1.5 shadow-md text-center leading-none border border-black/5">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-[#7B847F]">
                    {event.month}
                  </span>
                  <span className="block text-base font-bold font-serif text-[#0F2F25] mt-0.5">
                    {event.day}
                  </span>
                </div>
              </div>

              {/* Event Content */}
              <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-serif text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--color-gold)] transition-colors mb-2 line-clamp-2">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mb-3">
                    <MapPin className="w-3.5 h-3.5 text-[var(--color-gold)] shrink-0" />
                    <span>{event.location}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${event.tagColor}`}>
                    {event.tag}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          6. VIDEO ADVERTISEMENT SHOWCASE
      ══════════════════════════════════════════════════════ */}
      {videoAds.length > 0 && activeAd && (
        <section id="spotlight" className="reveal-on-scroll py-20 sm:py-28 bg-[#0D241A] text-white border-y border-[#2D5D46] relative overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#B88B2A]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#355C6D]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-white/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-gold)] block mb-2">Abra in Motion</span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">Official Provincial Spotlight</h2>
                <p className="text-xs text-white/60 mt-1">Explore Abra through the lens of the Provincial Tourism Office</p>
              </div>
              {videoAds.length > 1 && (
                <div className="flex items-center gap-2">
                  {videoAds.map((_, idx) => (
                    <button key={idx} onClick={() => setActiveAdIndex(idx)} aria-label={`Ad ${idx + 1}`} className={`h-2 rounded-full transition-all cursor-pointer ${idx === activeAdIndex ? 'bg-[var(--color-gold)] w-5' : 'bg-white/30 hover:bg-white/60 w-2'}`} />
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 relative rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl">
                {activeAd.video_url ? (
                  <>
                    <video ref={adVideoRef} src={formatMediaUrl(activeAd.video_url)} className="w-full h-full object-cover" autoPlay loop muted={isMuted} playsInline onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'} className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-all cursor-pointer">
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'} className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-all cursor-pointer">
                        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </>
                ) : (
                  <img src={formatMediaUrl(activeAd.thumbnail_url || activeAd.image_url)} alt={activeAd.title} loading="lazy" className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80'; }} />
                )}
              </div>
              <div className="lg:col-span-4 flex flex-col gap-5 text-left">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-gold)] block mb-2">{activeAd.category || 'Provincial Feature'}</span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-white leading-tight mb-3">{activeAd.title}</h3>
                  {activeAd.description && <p className="text-xs text-white/70 leading-relaxed line-clamp-4">{activeAd.description}</p>}
                </div>
                {activeAd.link_url && (
                  <a href={activeAd.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[var(--color-gold)] text-[#09231C] hover:bg-[var(--color-gold-400)] transition-all shadow-md w-fit">
                    <span>Learn More</span><ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {videoAds.length > 1 && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-white/50 mb-3">More Features</p>
                    <div className="flex flex-col gap-2">
                      {videoAds.filter((_, i) => i !== activeAdIndex).slice(0, 2).map((ad, i) => (
                        <button key={ad.id || i} onClick={() => setActiveAdIndex(videoAds.indexOf(ad))} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer text-left">
                          <div className="w-12 h-9 rounded-md overflow-hidden bg-white/10 shrink-0">
                            <img src={formatMediaUrl(ad.thumbnail_url || ad.image_url)} alt={ad.title} loading="lazy" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                          </div>
                          <p className="text-xs font-semibold text-white/80 line-clamp-1">{ad.title}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          7. STAKEHOLDER PATHWAYS
      ══════════════════════════════════════════════════════ */}
      <section id="join" className="reveal-on-scroll py-20 sm:py-24 bg-[var(--bg-card)] border-t border-[var(--border-app)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left mb-10">
            <span className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.25em] text-[var(--color-gold)] block mb-1">Join the Platform</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">Grow Abra Tourism Together</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-8 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-app)] flex flex-col justify-between hover:shadow-lg transition-all">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#153325]/10 dark:bg-[var(--color-gold)]/10 flex items-center justify-center mb-5"><Map className="w-5 h-5 text-[#153325] dark:text-[var(--color-gold)]" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-gold)] block mb-2">For Accommodations</span>
                <h3 className="font-serif text-xl font-bold text-[var(--text-primary)] mb-3">List Your Homestay</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6">Register your local property, submit municipal accreditation requirements digitally, and welcome verified travelers across the province.</p>
              </div>
              <Link to="/register" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[#153325] text-white hover:bg-[#0E2F24] transition-all shadow-sm w-fit">
                <span>Register Property</span><ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="p-8 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-app)] flex flex-col justify-between hover:shadow-lg transition-all">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#153325]/10 dark:bg-[var(--color-gold)]/10 flex items-center justify-center mb-5"><Compass className="w-5 h-5 text-[#153325] dark:text-[var(--color-gold)]" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-gold)] block mb-2">For Local Guides</span>
                <h3 className="font-serif text-xl font-bold text-[var(--text-primary)] mb-3">Accredited Tour Guides</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6">Get endorsed by your Municipal Tourism Office, publish guided trek packages, and manage traveler bookings.</p>
              </div>
              <Link to="/register" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[#153325] text-white hover:bg-[#0E2F24] transition-all shadow-sm w-fit">
                <span>Apply as Guide</span><ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="p-8 bg-[#153325] text-white rounded-2xl border border-[#1D4433] flex flex-col justify-between hover:shadow-lg transition-all">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[var(--color-gold)]/15 flex items-center justify-center mb-5"><BookOpen className="w-5 h-5 text-[var(--color-gold)]" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-gold)] block mb-2">Municipal DOT Desk</span>
                <h3 className="font-serif text-xl font-bold text-white mb-3">Municipal Governance</h3>
                <p className="text-xs text-white/75 leading-relaxed mb-6">Endorse local listings, resolve tourist inquiries, update attractions, and download official municipal statistics.</p>
              </div>
              <Link to="/portal/login" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[var(--color-gold)] text-[#09231C] hover:bg-[var(--color-gold-400)] transition-all shadow-sm w-fit">
                <span>Access Desk Portal</span><ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          8. PANORAMIC CALL TO ACTION BANNER
      ══════════════════════════════════════════════════════ */}
      <section id="cta" className="reveal-on-scroll relative py-24 sm:py-32 overflow-hidden bg-[#09231C]">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80"
            alt="Panoramic Cordillera Mountains of Abra"
            loading="lazy"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09231C] via-[#09231C]/60 to-[#09231C]/40" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <span className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.3em] text-[var(--color-gold-300)] block mb-3 drop-shadow-sm">
            Explore • Experience • Support Local
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4 drop-shadow-md">
            Your Abra story starts here.
          </h2>
          <p className="text-xs sm:text-base text-white/85 leading-relaxed max-w-xl mx-auto mb-8 drop-shadow-sm">
            Plan your next adventure and be part of a sustainable tourism future.
          </p>
          <Link
            to="/municipalities"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-[var(--color-gold)] text-[#09231C] hover:bg-[var(--color-gold-400)] transition-all shadow-xl hover:shadow-2xl cursor-pointer"
          >
            <span>Explore Destinations</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Home;
