import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * BackToTop — Circular Scroll-to-Top button adhering strictly to the
 * ABRAVENTURE design system and accessibility requirements.
 *
 * Appears after 400px scroll threshold with a 250ms smooth transition.
 * Adapts to Dark Mode (Forest green / Gold icon) & Light Mode (Cream / Forest green icon).
 */
const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsVisible(window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial position
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`fixed z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-md flex items-center justify-center cursor-pointer transition-all duration-250 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-offset-2
        /* Positioning: 32px from edge on desktop, raised above mobile bottom nav on mobile */
        right-4 sm:right-6 lg:right-8 bottom-[80px] lg:bottom-8
        /* Light Mode: White/Cream surface with deep forest icon */
        bg-white text-[#153325] border border-[#E8DFC8] hover:bg-[#FAF7F2] hover:text-[#09231C] hover:border-[#B88B2A]
        /* Dark Mode: Elevated Forest green surface with Gold icon */
        dark:bg-[#0E2F24] dark:text-[var(--color-gold)] dark:border-[#285044] dark:hover:bg-[#153E31] dark:hover:text-[var(--color-gold-300)] dark:hover:border-[var(--color-gold)]/60
        /* Hover lift */
        hover:-translate-y-0.5 active:translate-y-0
        /* Visibility & Enter/Exit animation */
        ${isVisible
          ? 'opacity-100 visible translate-y-0 pointer-events-auto'
          : 'opacity-0 invisible translate-y-2.5 pointer-events-none'
        }
      `}
    >
      <ArrowUp className="w-5 h-5 transition-transform duration-200" />
    </button>
  );
};

export default BackToTop;
