import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Calendar, MapPin, ShieldCheck, ArrowRight, Star, Mountain, Waves, TreePine } from 'lucide-react';

const Home = () => {
  return (
    <div className="relative">

      {/* ── Hero Section ────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0a2526 0%, #0F3D3E 35%, #1E2A6E 75%, #0d1a3a 100%)',
          minHeight: '620px',
        }}
      >
        {/* Woven texture overlay */}
        <div className="absolute inset-0 bg-woven-dark opacity-60" />

        {/* Decorative mountain silhouette */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none pointer-events-none">
          <svg viewBox="0 0 1440 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 220L180 80L360 140L540 40L720 100L900 20L1080 90L1260 50L1440 120V220H0Z" fill="rgba(15,61,62,0.3)" />
            <path d="M0 220L240 120L480 160L720 60L960 130L1200 80L1440 150V220H0Z" fill="rgba(10,25,26,0.5)" />
            <path d="M0 220L1440 220V180C1200 190 960 210 720 195C480 180 240 200 0 220Z" fill="#f8fafc" />
          </svg>
        </div>

        {/* Decorative orbs */}
        <div className="absolute top-16 right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-32 left-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-40 text-center">
          {/* Province badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 text-white/90 text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full mb-8 animate-fadeSlideDown">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Province of Abra · Cordillera Administrative Region</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight mb-6 animate-slideDown">
            Explore the Heart of
            <span className="block text-gradient-abra mt-1">Cordillera Abra</span>
          </h1>

          <p className="text-base md:text-lg text-white/65 mb-10 max-w-2xl mx-auto leading-relaxed font-light animate-fadeSlideUp delay-200">
            From Kaparkan's limestone terraces to Itneg heritage weaving villages — discover
            verified homestays, accredited local guides, and hidden gems across all 27 municipalities.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fadeSlideUp delay-300">
            <Link to="/municipalities" className="btn-abra-primary text-sm">
              <MapPin className="w-4 h-4" />
              Explore Municipalities
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/itinerary" className="btn-abra-secondary text-sm">
              <Calendar className="w-4 h-4 text-amber-400" />
              Plan Your Itinerary
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-14 flex justify-center gap-8 md:gap-14 animate-fadeSlideUp delay-400">
            {[
              { value: '27', label: 'Municipalities', icon: MapPin },
              { value: '100+', label: 'Attractions', icon: Mountain },
              { value: '50+', label: 'Eco-Sites', icon: TreePine },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <s.icon className="w-4 h-4 text-amber-400/70 mb-0.5" />
                <span className="text-2xl md:text-3xl font-extrabold text-white">{s.value}</span>
                <span className="text-[10px] text-white/50 font-semibold uppercase tracking-widest">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features Section ─────────────────────────────── */}
      <div className="bg-woven py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block text-xs font-extrabold tracking-[0.2em] uppercase text-amber-600 bg-amber-50 border border-amber-200/60 px-4 py-1.5 rounded-full mb-4">
              Why Abraventure
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-emerald-900 leading-tight">
              Abra's Unified Tourism Ecosystem
            </h2>
            <div className="divider-gold mx-auto mt-4 mb-5 w-20" />
            <p className="text-slate-500 text-sm leading-relaxed">
              ABRAVENTURE connects travelers with verified homestay owners and accredited local guides
              under direct supervision of Municipal and Provincial Tourism Offices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                color: 'text-emerald-700',
                bg: 'bg-emerald-50',
                border: 'border-emerald-100',
                glow: 'group-hover:border-emerald-300',
                title: '100% Verified',
                subtitle: 'Accredited Stakeholders',
                desc: 'Every homestay and tour guide is evaluated and endorsed by the local Municipal Tourism Office before public listing.',
              },
              {
                icon: MapPin,
                color: 'text-amber-700',
                bg: 'bg-amber-50',
                border: 'border-amber-100',
                glow: 'group-hover:border-amber-300',
                title: 'All 27 Municipalities',
                subtitle: 'Complete Coverage',
                desc: "From Bangued's heritage churches to Tineg's Kaparkan Falls and Tubo's highland peaks — the full Abra experience.",
              },
              {
                icon: Calendar,
                color: 'text-indigo-700',
                bg: 'bg-indigo-50',
                border: 'border-indigo-100',
                glow: 'group-hover:border-indigo-300',
                title: 'Itinerary Planner',
                subtitle: 'Day-by-Day Planning',
                desc: 'Create full travel schedules with pinned attractions, accredited homestays, and tour guide bookings in one workspace.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className={`group bg-white rounded-2xl p-7 border ${card.border} ${card.glow} shadow-sm card-hover transition-all duration-300`}
              >
                <div className={`${card.bg} ${card.color} p-3.5 rounded-xl w-fit mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">{card.subtitle}</p>
                <h3 className="text-lg font-extrabold text-slate-800 mb-2">{card.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Kaparkan Showcase Section ────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F3D3E 0%, #0a2c2d 50%, #111e45 100%)' }}
      >
        <div className="absolute inset-0 bg-woven-dark opacity-40" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Text */}
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 text-amber-400 font-extrabold uppercase tracking-widest text-[10px] mb-4">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                Featured Attraction
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-snug">
                Kaparkan Falls<br />
                <span className="text-amber-400 text-2xl font-bold">Tineg, Abra</span>
              </h2>
              <div className="divider-gold mb-6 w-16" />
              <p className="text-white/60 text-sm md:text-base leading-relaxed mb-6">
                A majestic multi-tiered spring waterfall shaped into natural stone terraced pools.
                Managed by the Tineg Tourism Office — hire an accredited local guide for a safe,
                unforgettable trek through the Cordillera wilderness.
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                {['Natural Wonder', 'Eco-Tourism', 'Guided Trek', 'Itneg Territory'].map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-white/10 text-white/70 rounded-full text-xs font-semibold border border-white/10">
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                to="/municipalities"
                className="inline-flex items-center gap-2 text-amber-400 font-bold hover:text-amber-300 transition-colors group"
              >
                <span>Explore all Destinations</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Image */}
            <div className="w-full lg:w-[520px] flex-shrink-0">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <img
                  src="../uploads/images (4).jpg?w=800&auto=format&fit=crop&q=80"
                  alt="Kaparkan Falls, Tineg Abra"
                  className="w-full h-[360px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div className="bg-black/50 backdrop-blur-sm px-3 py-2 rounded-xl">
                    <p className="text-white font-bold text-sm">Kaparkan Falls</p>
                    <p className="text-white/60 text-xs">Tineg, Abra · Cordillera</p>
                  </div>
                  <div className="bg-amber-500/90 backdrop-blur-sm px-3 py-2 rounded-xl">
                    <p className="text-emerald-950 font-extrabold text-xs">UNESCO Heritage Area</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Itneg Culture Strip ──────────────────────────── */}
      <div className="bg-amber-50 border-y border-amber-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-center">
            {[
              { label: 'Natural Dye Capital', sub: 'of the Philippines', icon: '🎨' },
              { label: 'Itneg Weaving', sub: 'Living Heritage', icon: '🧵' },
              { label: 'Spanish-Era Churches', sub: 'National Cultural Treasures', icon: '⛪' },
              { label: 'Kaparkan Falls', sub: 'Cordillera Wonder', icon: '💧' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1">
                <span className="text-2xl mb-1">{item.icon}</span>
                <p className="font-extrabold text-emerald-900 text-sm">{item.label}</p>
                <p className="text-amber-700 text-[10px] font-semibold uppercase tracking-wider">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA Section ─────────────────────────────────── */}
      <div className="bg-woven py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-emerald-900 rounded-3xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-woven-dark opacity-50" />
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            {/* Decorative orbs */}
            <div className="absolute -top-12 -right-12 w-56 h-56 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 text-center px-6 py-16 md:py-20 max-w-2xl mx-auto">
              <span className="inline-block text-xs font-extrabold tracking-widest uppercase text-amber-400 bg-amber-400/10 border border-amber-400/20 px-4 py-1.5 rounded-full mb-5">
                Join the Platform
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
                Are you a Local Tourism Stakeholder?
              </h2>
              <p className="text-white/55 text-sm max-w-lg mx-auto leading-relaxed mb-8">
                Register your homestay or apply as an accredited tour guide. Fulfill your municipality's
                documentary requirements online and get endorsed to the Provincial DOT.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/register" className="btn-abra-primary">
                  Apply as Stakeholder
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-white/20 text-white hover:border-white/40 hover:bg-white/5 font-semibold text-sm transition-all"
                >
                  Login to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
