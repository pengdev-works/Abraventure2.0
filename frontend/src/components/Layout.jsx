import React from 'react';
import Navbar from './Navbar';
import { Link } from 'react-router-dom';
import { Compass, MapPin, Mountain, Waves } from 'lucide-react';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0a2526 0%, #0F3D3E 50%, #0d1a3a 100%)' }}
      >
        {/* Woven texture overlay */}
        <div className="absolute inset-0 bg-woven-dark opacity-50" />

        {/* Itneg gold top divider */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

        {/* Decorative orbs */}
        <div className="absolute -top-12 right-16 w-56 h-56 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 left-8 w-56 h-56 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

          {/* Main footer grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {/* Brand column */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <Compass className="w-7 h-7 text-amber-400" />
                <span className="font-extrabold text-xl">
                  <span className="text-amber-400">ABRA</span>
                  <span className="text-white">VENTURE</span>
                </span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs">
                Integrated Tourism Information and Homestay Management System for the Province of Abra,
                Cordillera Administrative Region.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/70 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
                  🎨 Natural Dye Capital · Philippines
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white/40 mb-4">Explore</h4>
              <ul className="space-y-2.5">
                {[
                  { to: '/',              label: 'Home' },
                  { to: '/municipalities', label: 'All 27 Municipalities' },
                  { to: '/itinerary',     label: 'Itinerary Planner' },
                  { to: '/register',      label: 'Register as Stakeholder' },
                  { to: '/login',         label: 'Login to Dashboard' },
                ].map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-white/50 hover:text-amber-400 transition-colors font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* About Abra */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white/40 mb-4">About Abra</h4>
              <ul className="space-y-2 text-sm text-white/50 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5 flex-shrink-0">🧵</span>
                  <span>Itneg (Tingguian) weaving heritage — living cultural art</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5 flex-shrink-0">💧</span>
                  <span>Kaparkan Falls — Cordillera's limestone terrace wonder</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5 flex-shrink-0">⛪</span>
                  <span>Spanish-era churches — National Cultural Treasures</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5 flex-shrink-0">🎉</span>
                  <span>Arya Abra & Sakuting Festival celebrations</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

          {/* Bottom row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <p className="text-xs text-white/35">
              © {new Date().getFullYear()} Provincial Tourism Office (DOT) of Abra. All rights reserved.
            </p>
            <div className="flex items-center gap-3 text-xs text-white/35">
              <span>Verified Stakeholders</span>
              <span className="w-1 h-1 bg-amber-400/40 rounded-full" />
              <span>Accredited Guides & Homestays</span>
              <span className="w-1 h-1 bg-amber-400/40 rounded-full" />
              <span>27 Municipalities</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
