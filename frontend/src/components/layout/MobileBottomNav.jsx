import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Compass, MapPin, Map as MapIcon, Calendar, User, ShieldCheck } from 'lucide-react';

const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Determine user's dashboard link
  const getAccountLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'PROVINCIAL_DOT': return '/provincial-dashboard';
      case 'MUNICIPAL_DOT': return '/municipal-dashboard';
      case 'HOMESTAY_OWNER': return '/owner-dashboard';
      case 'TOUR_GUIDE': return '/guide-dashboard';
      case 'TOURIST': return '/tourist-dashboard';
      default: return '/login';
    }
  };

  const accountLink = getAccountLink();
  const isAccountActive = ['/login', '/register', '/portal/login', '/tourist-dashboard', '/owner-dashboard', '/guide-dashboard', '/municipal-dashboard', '/provincial-dashboard'].includes(location.pathname);

  const navItems = [
    {
      label: 'Explore',
      path: '/',
      icon: Compass,
      isActive: location.pathname === '/'
    },
    {
      label: 'Destinations',
      path: '/municipalities',
      icon: MapPin,
      isActive: location.pathname.startsWith('/municipalities')
    },
    {
      label: 'Map',
      path: '/map',
      icon: MapIcon,
      isActive: location.pathname === '/map'
    },
    {
      label: 'Itinerary',
      path: '/itinerary',
      icon: Calendar,
      isActive: location.pathname === '/itinerary'
    },
    {
      label: user ? 'Account' : 'Sign In',
      path: accountLink,
      icon: user ? (user.role.includes('DOT') ? ShieldCheck : User) : User,
      isActive: isAccountActive
    }
  ];

  return (
    <aside
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#FAF7F2]/95 dark:bg-[#0D1C15]/95 backdrop-blur-lg border-t border-[#E8DFC8] dark:border-[#2A4338] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)] safe-bottom transition-colors"
    >
      <div className="grid grid-cols-5 h-14 max-w-lg mx-auto items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center h-full py-1 px-1 select-none transition-all active:scale-95 touch-target ${
                active
                  ? 'text-[#153325] dark:text-[#E2EDE5] font-bold'
                  : 'text-[#5A534E] dark:text-[#8FADA0] hover:text-[#153325] dark:hover:text-white'
              }`}
            >
              <div
                className={`relative flex items-center justify-center w-8 h-7 rounded-full transition-all ${
                  active
                    ? 'bg-[#B88B2A]/20 dark:bg-[#B88B2A]/30 text-[#946E1D] dark:text-[#D4A942]'
                    : ''
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform ${active ? 'scale-110' : ''}`} />
                {active && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#B88B2A]" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[58px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

export default MobileBottomNav;
