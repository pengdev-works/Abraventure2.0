import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  FileX, 
  FileText, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle,
  ShieldAlert
} from 'lucide-react';
import { formatMediaUrl } from './SafeImage';

const DocumentViewerModal = ({ 
  docUrl, 
  onClose, 
  title = 'Document Viewer' 
}) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const formattedUrl = formatMediaUrl(docUrl);
  const isPdf = formattedUrl?.toLowerCase().split('?')[0].endsWith('.pdf');
  const fileName = formattedUrl ? formattedUrl.split('/').pop().split('?')[0] : 'Document';

  // Verify file availability via a lightweight fetch probe
  useEffect(() => {
    if (!formattedUrl) {
      setHasError(true);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setHasError(false);
    setErrorStatus(null);

    // If external URL or data URL, handle directly via media events
    if (formattedUrl.startsWith('http://') || formattedUrl.startsWith('https://') || formattedUrl.startsWith('data:')) {
      if (!isPdf) {
        // Image will trigger onLoad or onError directly
        return () => { isMounted = false; };
      }
    }

    // Probe server endpoint to ensure file is not a 404 or 500
    fetch(formattedUrl, { method: 'HEAD' })
      .then((res) => {
        if (!isMounted) return;
        if (!res.ok) {
          setHasError(true);
          setErrorStatus(res.status);
          setLoading(false);
        } else {
          // If valid and PDF, we can release loading
          if (isPdf) {
            setLoading(false);
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        // Network or CORS error on HEAD: fallback to standard element load
        console.warn('Document probe warning (falling back to element loader):', err.message);
        if (isPdf) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formattedUrl, reloadKey, isPdf]);

  const handleRetry = () => {
    setLoading(true);
    setHasError(false);
    setErrorStatus(null);
    setReloadKey(k => k + 1);
  };

  if (!docUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-modal-title"
    >
      <div className="bg-white dark:bg-[#152B20] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-[var(--border-app,#C7D7C9)] transition-colors">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-app,#C7D7C9)] bg-slate-50/70 dark:bg-[#1C3629]/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#153325]/10 dark:bg-[#E2EDE5]/10 flex items-center justify-center text-[#153325] dark:text-[#D4A942] shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="document-modal-title" className="font-bold text-slate-800 dark:text-[#FAF7F2] text-sm sm:text-base truncate">
                {title}
              </h3>
              <p className="text-[11px] text-[#45594C] dark:text-[#8FADA0] truncate">
                {fileName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {!hasError && (
              <a
                href={formattedUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-900 dark:text-emerald-300 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800/40"
              >
                <Download className="w-3.5 h-3.5 text-[#B88B2A]" />
                <span className="hidden sm:inline">Download / Open</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#253f30] rounded-lg transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50 dark:bg-[#0D1C15] flex flex-col justify-center relative min-h-[50vh] sm:min-h-[65vh]">
          
          {/* Loading Spinner */}
          {loading && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-[#152B20]/80 backdrop-blur-xs z-10 transition-opacity">
              <div className="w-10 h-10 border-3 border-[#153325] dark:border-[#D4A942] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-semibold text-[#45594C] dark:text-[#8FADA0]">
                Retrieving document preview...
              </p>
            </div>
          )}

          {/* Error / 404 State instead of blank page */}
          {hasError ? (
            <div className="max-w-md mx-auto w-full text-center py-8 px-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 mx-auto flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 shadow-sm">
                <FileX className="w-8 h-8" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/70 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 text-[11px] font-bold uppercase tracking-wider mb-3">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{errorStatus === 404 ? 'File 404 · Not Found' : 'File Load Error'}</span>
              </div>

              <h4 className="font-serif text-lg font-bold text-[#153325] dark:text-[#FAF7F2] mb-2">
                File Cannot Be Displayed
              </h4>
              <p className="text-xs text-[#45594C] dark:text-[#8FADA0] leading-relaxed mb-4">
                The requested file does not exist on the server, was deleted, or could not be loaded into this preview window.
              </p>

              <div className="bg-white dark:bg-[#152B20] border border-[var(--border-app,#C7D7C9)] rounded-xl p-3 text-left mb-6">
                <div className="text-[10px] font-bold text-[#B88B2A] uppercase tracking-wider mb-1">
                  Target Resource:
                </div>
                <div className="text-xs font-mono text-[#17281D] dark:text-[#E2EDE5] break-all">
                  {formattedUrl}
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#1C3629] border border-[var(--border-app,#C7D7C9)] text-xs font-bold text-[#17281D] dark:text-[#E2EDE5] hover:bg-slate-50 dark:hover:bg-[#253f30] transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#B88B2A]" />
                  <span>Retry</span>
                </button>

                <a
                  href={formattedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#153325] hover:bg-[#1D4433] text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#D4A942]" />
                  <span>Open URL Directly</span>
                </a>
              </div>
            </div>
          ) : isPdf ? (
            <iframe
              key={`pdf-${reloadKey}`}
              src={formattedUrl}
              className="w-full h-[65vh] rounded-xl border border-[var(--border-app,#C7D7C9)] bg-white shadow-xs"
              title={title}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setHasError(true);
              }}
            />
          ) : (
            <div className="flex justify-center items-center h-[65vh]">
              <img
                key={`img-${reloadKey}`}
                src={formattedUrl}
                alt="Document file preview"
                className="max-w-full max-h-full object-contain rounded-xl shadow-sm border border-[var(--border-app,#C7D7C9)] bg-white"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setHasError(true);
                }}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
