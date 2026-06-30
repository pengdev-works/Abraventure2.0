import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Calendar, MapPin, ShieldCheck, ArrowRight, Star } from 'lucide-react';

const Home = () => {
  return (
    <div className="relative">
      {/* Hero Section */}
      <div 
        className="relative bg-cover bg-center h-[550px] flex items-center justify-center text-center px-4"
        style={{ 
          backgroundImage: `linear-gradient(rgba(15, 61, 62, 0.75), rgba(16, 24, 32, 0.9)), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80')` 
        }}
      >
        <div className="max-w-4xl mx-auto text-white">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 animate-slideDown">
            Discover the Natural Splendor of <span className="text-amber-500">Abra</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-200 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
            Discover breathtaking waterfalls, historical Spanish sites, and verified local homestays across all 27 municipalities.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/municipalities"
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Municipalities</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/itinerary"
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-white/50 font-semibold rounded-full backdrop-blur-sm hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5 text-amber-500" />
              <span>Plan Your Itinerary</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-emerald-900 mb-4">
            Abra's Unified Tourism Ecosystem
          </h2>
          <p className="text-slate-650 text-base leading-relaxed">
            ABRAVENTURE connects tourists with verified homestay owners and accredited local tour guides under the direct supervision of Municipal and Provincial Tourism Offices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="bg-emerald-50 p-4 rounded-xl text-emerald-900 w-fit mb-6">
              <ShieldCheck className="w-8 h-8 text-emerald-900" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">100% Verified Stakes</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Every room and tour guide on our platform is evaluated and accredited by the local Municipal Tourism Office before appearing publicly.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="bg-emerald-50 p-4 rounded-xl text-emerald-900 w-fit mb-6">
              <MapPin className="w-8 h-8 text-emerald-900" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">All 27 Municipalities</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              From the capital Bangued to Tineg's waterfalls and Tubo's high peaks, explore Abra's entire geographical landscape.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="bg-emerald-50 p-4 rounded-xl text-emerald-900 w-fit mb-6">
              <Calendar className="w-8 h-8 text-emerald-900" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Itinerary Planner</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Create day-by-day travel schedules, pin accredited homestays, hire tour guides, and list local attractions all in a single workspace.
            </p>
          </div>
        </div>
      </div>

      {/* Showcase Section */}
      <div className="bg-emerald-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="max-w-xl">
            <span className="text-amber-500 font-bold uppercase tracking-wider text-xs flex items-center gap-1 mb-3">
              <Star className="w-4 h-4 fill-amber-500" /> Highlight Attraction
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Kaparkan Falls in Tineg</h2>
            <p className="text-emerald-100 text-sm md:text-base leading-relaxed mb-6">
              Kaparkan Falls (also known as Mulawin Falls) is a majestic multi-tiered spring waterfall shaped like stone terraced pools. Tineg Tourism Office manages visitor entries, and hiring an accredited local tour guide ensures a safe, remarkable trek.
            </p>
            <Link
              to="/municipalities"
              className="inline-flex items-center gap-2 text-amber-500 font-bold hover:text-amber-450 hover:underline"
            >
              <span>Explore more destinations</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="w-full lg:w-[500px] h-[350px] rounded-2xl overflow-hidden shadow-2xl relative">
            <img 
              src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80" 
              alt="Kaparkan Falls, Abra" 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg text-xs text-white">
              Kaparkan Falls • Tineg, Abra
            </div>
          </div>
        </div>
      </div>

      {/* CTA / Stakeholder Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="glassmorphism border border-slate-200/60 p-12 rounded-3xl max-w-4xl mx-auto bg-gradient-to-br from-white to-slate-50">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-4">Are you a Local Tourism Stakeholder?</h2>
          <p className="text-slate-500 text-sm max-w-2xl mx-auto leading-relaxed mb-8">
            Register your homestay facility or apply as an accredited tour guide. Fulfill your municipality's documentary requirements online, and get endorsed to the Provincial DOT for public display!
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-full shadow-md transition-all hover:scale-105"
            >
              Apply as Stakeholder
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 border border-slate-350 hover:bg-slate-50 text-slate-700 font-semibold rounded-full transition-all hover:scale-105"
            >
              Login to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
