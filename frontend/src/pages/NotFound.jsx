import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  FileQuestion, 
  FileX, 
  AlertTriangle, 
  Home, 
  ArrowLeft, 
  RefreshCw, 
  MapPin, 
  Search, 
  HelpCircle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

const NotFound = ({ 
  isFileError: isFileErrorProp, 
  filePath: filePathProp,
  errorMessage: errorMessageProp 
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Heuristic: check if this is a file request error or generic page 404
  const currentPath = filePathProp || location.pathname;
  const isFileError = Boolean(
    isFileErrorProp ||
    location.state?.type === 'file' ||
    currentPath.includes('/uploads/') ||
    currentPath.includes('/documents/') ||
    currentPath.includes('/files/') ||
    /\.(pdf|jpg|jpeg|png|webp|gif|svg|docx|xlsx|zip)$/i.test(currentPath)
  );

  const fileExt = currentPath.match(/\.([a-z0-9]+)(?:[?#]|$)/i)?.[1]?.toUpperCase() || (isFileError ? 'FILE' : null);
  const title = isFileError ? '404 · File Not Found' : '404 · Page Not Found';
  const subtitle = isFileError
    ? 'The requested file or document does not exist on the server, was deleted, or could not be found.'
    : 'The page you are looking for does not exist, may have been removed, or has an invalid address.';

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full">
        {/* Main Card Container */}
        <div className="relative bg-white dark:bg-[#152B20] border border-[var(--border-app,#C7D7C9)] rounded-3xl shadow-xl overflow-hidden p-8 sm:p-12 text-center backdrop-blur-sm transition-colors">
          
          {/* Subtle decorative background gradient */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#153325] via-[#B88B2A] to-[#153325]" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#B88B2A]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#153325]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Badge & Status Code */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#153325]/10 dark:bg-[#E2EDE5]/10 border border-[#153325]/20 dark:border-[#E2EDE5]/20 text-xs font-bold uppercase tracking-widest text-[#153325] dark:text-[#D4A942] mb-6">
            <ShieldAlert className="w-3.5 h-3.5 text-[#B88B2A]" />
            <span>HTTP 404 · {isFileError ? 'Missing File Asset' : 'Page Not Found'}</span>
          </div>

          {/* Graphic Icon & Visual */}
          <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center rounded-3xl bg-gradient-to-b from-[#FAF7F2] to-[#E3ECE4] dark:from-[#1C3629] dark:to-[#152B20] border-2 border-[#B88B2A]/30 shadow-inner mb-6">
            {isFileError ? (
              <div className="relative">
                <FileX className="w-12 h-12 sm:w-14 sm:h-14 text-rose-600 dark:text-rose-400" />
                {fileExt && (
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 text-[10px] font-black rounded bg-[#153325] text-[#FAF7F2] border border-[#B88B2A]">
                    {fileExt}
                  </span>
                )}
              </div>
            ) : (
              <div className="relative">
                <Compass className="w-12 h-12 sm:w-14 sm:h-14 text-[#153325] dark:text-[#D4A942] animate-spin-slow" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white dark:border-[#152B20]" />
              </div>
            )}
          </div>

          {/* Title and Description */}
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#153325] dark:text-[#FAF7F2] tracking-tight mb-3">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-[#45594C] dark:text-[#8FADA0] max-w-xl mx-auto leading-relaxed mb-6">
            {subtitle}
          </p>

          {/* Resource Path pill */}
          <div className="bg-[#FAF7F2] dark:bg-[#1C3629] border border-[var(--border-app,#C7D7C9)] rounded-xl px-4 py-2.5 max-w-lg mx-auto mb-8 flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs font-bold text-[#B88B2A] uppercase tracking-wider shrink-0">Path:</span>
              <span className="text-xs font-mono text-[#17281D] dark:text-[#E2EDE5] truncate">
                {currentPath || '/unknown'}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900 shrink-0">
              404 NOT FOUND
            </span>
          </div>

          {/* Custom Error Message if provided */}
          {(errorMessageProp || location.state?.message) && (
            <div className="mb-8 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 max-w-lg mx-auto flex items-start gap-2.5 text-left">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{errorMessageProp || location.state?.message}</span>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border-app,#C7D7C9)] bg-white dark:bg-[#1C3629] text-xs font-bold text-[#17281D] dark:text-[#E2EDE5] hover:bg-slate-50 dark:hover:bg-[#253f30] transition-all shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#B88B2A]" />
              <span>Go Back</span>
            </button>

            <button
              type="button"
              onClick={handleReload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border-app,#C7D7C9)] bg-white dark:bg-[#1C3629] text-xs font-bold text-[#17281D] dark:text-[#E2EDE5] hover:bg-slate-50 dark:hover:bg-[#253f30] transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-[#B88B2A]" />
              <span>Try Reloading</span>
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#153325] hover:bg-[#1D4433] text-xs font-bold text-white shadow-md transition-all cursor-pointer"
            >
              <Home className="w-4 h-4 text-[#D4A942]" />
              <span>Return to Home</span>
            </Link>
          </div>

          {/* Helpful Navigation Suggestions */}
          <div className="border-t border-[var(--border-app,#C7D7C9)] pt-8">
            <p className="text-xs font-bold uppercase tracking-wider text-[#45594C] dark:text-[#8FADA0] mb-4">
              Explore Available Abra Destinations
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                to="/municipalities"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FAF7F2] dark:bg-[#1C3629] text-xs font-medium text-[#153325] dark:text-[#E2EDE5] hover:border-[#B88B2A] border border-[var(--border-app,#C7D7C9)] transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-[#B88B2A]" />
                <span>27 Municipalities</span>
              </Link>
              <Link
                to="/map"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FAF7F2] dark:bg-[#1C3629] text-xs font-medium text-[#153325] dark:text-[#E2EDE5] hover:border-[#B88B2A] border border-[var(--border-app,#C7D7C9)] transition-colors"
              >
                <Compass className="w-3.5 h-3.5 text-[#B88B2A]" />
                <span>Interactive Map</span>
              </Link>
              <Link
                to="/events"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FAF7F2] dark:bg-[#1C3629] text-xs font-medium text-[#153325] dark:text-[#E2EDE5] hover:border-[#B88B2A] border border-[var(--border-app,#C7D7C9)] transition-colors"
              >
                <span>Festivals & Events</span>
              </Link>
              <Link
                to="/travel-tips"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FAF7F2] dark:bg-[#1C3629] text-xs font-medium text-[#153325] dark:text-[#E2EDE5] hover:border-[#B88B2A] border border-[var(--border-app,#C7D7C9)] transition-colors"
              >
                <span>Travel Tips</span>
              </Link>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 text-[11px] text-[#45594C]/80 dark:text-[#8FADA0]/80">
            Need assistance with official tourism records or accredited submissions? Contact the Provincial Tourism Office at <span className="font-semibold text-[#153325] dark:text-[#D4A942]">tourism@abra.gov.ph</span>.
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
