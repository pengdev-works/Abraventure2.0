import React from 'react';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin, ShieldCheck, Award } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const isDashboardWithSidebar = [
    '/provincial-dashboard',
    '/municipal-dashboard',
    '/owner-dashboard',
    '/guide-dashboard'
  ].includes(location.pathname);

  // Official and Stakeholder Dashboards have their own full-page executive sidebar layout
  if (isDashboardWithSidebar) {
    return <div className="min-h-screen bg-[var(--bg-app,#E3ECE4)] text-[var(--text-primary,#17281D)] transition-colors">{children}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-app,#E3ECE4)] text-[var(--text-primary,#17281D)] transition-colors">
      <Navbar />
      <main className="flex-grow pb-16 lg:pb-0">
        {children}
      </main>
      <MobileBottomNav />

      {/* ── Official Provincial Tourism Office Footer ── */}
      <footer className="bg-[#153325] text-[#FAF7F2] border-t-2 border-[#B88B2A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">

          {/* Masthead Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-10 mb-12 border-b border-[#FAF7F2]/10 gap-6">
            <div className="flex items-center gap-3.5">
              <img
                src="/abraventure-logo.png"
                alt="Abraventure Logo"
                className="w-12 h-12 object-contain drop-shadow-md rounded-lg"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div>
                <span className="font-serif text-2xl font-bold tracking-tight text-[#FAF7F2]">
                  ABRAVENTURE
                </span>
                <p className="text-xs text-[#FAF7F2]/70 tracking-wider uppercase mt-0.5">
                  Integrated Tourism Platform · Provincial Tourism Office (DOT) of Abra
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#FAF7F2]/10 border border-[#FAF7F2]/15 text-[#FAF7F2]/90">
                <Award className="w-3.5 h-3.5 text-[#B88B2A]" />
                <span>DOT Endorsed</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#FAF7F2]/10 border border-[#FAF7F2]/15 text-[#FAF7F2]/90">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B88B2A]" />
                <span>27 Municipalities</span>
              </div>
            </div>
          </div>

          {/* 4-Column Editorial Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14 text-xs">

            {/* Col 1: About Abra */}
            <div>
              <h4 className="font-serif font-bold text-sm tracking-wide text-[#FAF7F2] mb-4">
                About the Platform
              </h4>
              <p className="text-[#FAF7F2]/70 leading-relaxed mb-4">
                ABRAVENTURE is the official integrated tourism and accommodation portal of the Provincial Tourism Office of Abra, Cordillera Administrative Region (CAR). Connecting travelers to accredited homestays, licensed local guides, and municipal tourism desks.
              </p>
              <p className="text-[11px] text-[#B88B2A] font-semibold">
                Capitol Building, Bangued, Abra 2800
              </p>
            </div>

            {/* Col 2: Destinations & Travel */}
            <div>
              <h4 className="font-serif font-bold text-sm tracking-wide text-[#FAF7F2] mb-4">
                Explore Abra
              </h4>
              <ul className="space-y-2.5 text-[#FAF7F2]/75">
                <li>
                  <Link to="/municipalities" className="hover:text-[#B88B2A] transition-colors">
                    All 27 Municipalities
                  </Link>
                </li>
                <li>
                  <Link to="/map" className="hover:text-[#B88B2A] transition-colors">
                    Interactive Province Map
                  </Link>
                </li>
                <li>
                  <Link to="/itinerary" className="hover:text-[#B88B2A] transition-colors">
                    Plan Your Itinerary
                  </Link>
                </li>
                <li>
                  <Link to="/events" className="hover:text-[#B88B2A] transition-colors">
                    Festivals & Cultural Events
                  </Link>
                </li>
                <li>
                  <Link to="/travel-tips" className="hover:text-[#B88B2A] transition-colors">
                    Travel Advisory & Safety Guidelines
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Stakeholders & Governance */}
            <div>
              <h4 className="font-serif font-bold text-sm tracking-wide text-[#FAF7F2] mb-4">
                Stakeholder Portals
              </h4>
              <ul className="space-y-2.5 text-[#FAF7F2]/75">
                <li>
                  <Link to="/register" className="hover:text-[#B88B2A] transition-colors">
                    Register a Homestay Listing
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-[#B88B2A] transition-colors">
                    Apply as Accredited Tour Guide
                  </Link>
                </li>
                <li>
                  <Link to="/portal/login" className="hover:text-[#B88B2A] transition-colors">
                    Municipal Tourism Officer Login
                  </Link>
                </li>
                <li>
                  <Link to="/portal/login" className="hover:text-[#B88B2A] transition-colors">
                    Provincial DOT Admin Login
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-[#B88B2A] transition-colors">
                    Tourist Account Sign In
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Official Contact */}
            <div>
              <h4 className="font-serif font-bold text-sm tracking-wide text-[#FAF7F2] mb-4">
                Provincial Tourism Desk
              </h4>
              <div className="space-y-3 text-[#FAF7F2]/75">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#B88B2A] flex-shrink-0 mt-0.5" />
                  <span>Provincial Capitol Building, Bangued, Abra, CAR</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#B88B2A] flex-shrink-0" />
                  <a href="mailto:tourism@abra.gov.ph" className="hover:text-[#B88B2A] transition-colors">
                    tourism@abra.gov.ph
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#B88B2A] flex-shrink-0" />
                  <span>(074) 752-8200 / +63 917 123 4567</span>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-[#FAF7F2]/10">
                <p className="text-[11px] text-[#FAF7F2]/60">
                  Tourist Assistance Desk: Open Monday–Friday, 8:00 AM – 5:00 PM PHT
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Accreditation Line */}
          <div className="pt-8 border-t border-[#FAF7F2]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FAF7F2]/60">
            <p>
              © {new Date().getFullYear()} Provincial Tourism Office of Abra. Republic of the Philippines. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
              <span>•</span>
              <span>Safety Guidelines</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
