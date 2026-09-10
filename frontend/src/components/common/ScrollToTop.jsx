import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * ScrollToTop — resets scroll position smoothly on page navigation,
 * while respecting browser Back/Forward (POP) history restoration.
 * Place this as the first child inside <BrowserRouter>.
 */
const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // If user navigated via browser Back/Forward (POP), do not force scroll to top
    if (navType === 'POP' && !hash) {
      return;
    }

    // In-page hash target
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Smooth scroll to top of new page
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [pathname, search, hash, navType]);

  return null;
};

export default ScrollToTop;
