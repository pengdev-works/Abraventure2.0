import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  Calendar, 
  User, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  Share2, 
  Check, 
  Compass, 
  Phone, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'
  const [copiedId, setCopiedId] = useState(null);
  const { showToast } = useToast();

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/announcements');
      if (!res.ok) throw new Error('Failed to load advisories');
      const data = await res.json();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      showToast?.('Could not load advisories. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const filteredAnnouncements = useMemo(() => {
    let list = [...announcements];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          (a.title && a.title.toLowerCase().includes(q)) ||
          (a.content && a.content.toLowerCase().includes(q)) ||
          (a.created_by_name && a.created_by_name.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime() || 0;
      const timeB = new Date(b.created_at).getTime() || 0;
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [announcements, searchQuery, sortOrder]);

  const handleCopyShare = async (ann) => {
    try {
      const url = `${window.location.origin}/announcements#advisory-${ann.id}`;
      await navigator.clipboard.writeText(`${ann.title}\n\n${url}`);
      setCopiedId(ann.id);
      showToast?.('Link copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2500);
    } catch (e) {
      showToast?.('Could not copy link.', 'info');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recent';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months === 1) return '1 month ago';
    return `${months} months ago`;
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#232120]">
      {/* ── Editorial Hero Banner ── */}
      <div className="bg-[#153325] text-white pt-12 pb-16 relative overflow-hidden border-b border-[#E8DFC8]">
        {/* Subtle decorative background watermarks */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border-[20px] border-white" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full border-[15px] border-white" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Back to Home & Breadcrumb */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-xs font-medium backdrop-blur-sm transition-colors border border-white/15"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <span className="text-white/40 text-xs">/</span>
            <span className="text-[#D4A942] text-xs font-semibold uppercase tracking-wider">
              Tourism Advisories
            </span>
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B88B2A]/20 border border-[#B88B2A]/40 text-[#D4A942] text-xs font-semibold uppercase tracking-wider mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Provincial Tourism Office · Province of Abra</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl font-bold mb-4 tracking-tight leading-tight">
              Official Tourism Advisories & Bulletins
            </h1>

            <p className="text-white/80 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              Real-time travel safety directives, weather bulletins, provincial announcements, and municipal tourism advisories issued by the Provincial Government of Abra.
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Column: Feed of Advisories (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Search & Filter Bar */}
            <div className="bg-white border border-[#E8DFC8] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8C827A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search advisories by keyword, location, or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl focus:outline-none focus:border-[#153325] focus:ring-1 focus:ring-[#153325] transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-[#8C827A]">Sort:</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  aria-label="Sort advisories"
                  className="text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl px-3 py-2 text-[#232120] font-medium focus:outline-none focus:border-[#153325]"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>

                <button
                  onClick={fetchAnnouncements}
                  title="Refresh advisories"
                  className="p-2 rounded-xl border border-[#E8DFC8] text-[#8C827A] hover:text-[#153325] hover:bg-[#FAF7F2] transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Advisory Count */}
            <div className="flex items-center justify-between text-xs text-[#8C827A] px-1">
              <span>
                Showing <strong className="text-[#153325]">{filteredAnnouncements.length}</strong> {filteredAnnouncements.length === 1 ? 'advisory' : 'advisories'}
                {searchQuery && ` matching "${searchQuery}"`}
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#B88B2A] hover:underline font-medium"
                >
                  Clear search
                </button>
              )}
            </div>

            {/* Advisories Feed */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white border border-[#E8DFC8] rounded-2xl p-6 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
                    <div className="h-6 bg-slate-200 rounded w-3/4 mb-3" />
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-100 rounded w-full" />
                      <div className="h-3 bg-slate-100 rounded w-5/6" />
                      <div className="h-3 bg-slate-100 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="bg-white border border-[#E8DFC8] rounded-2xl p-12 text-center shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#153325]/10 text-[#153325] flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 opacity-60" />
                </div>
                <h3 className="font-serif font-bold text-lg text-[#153325] mb-1">
                  {searchQuery ? 'No matching advisories found' : 'No Active Advisories'}
                </h3>
                <p className="text-xs sm:text-sm text-[#8C827A] max-w-sm mx-auto mb-4">
                  {searchQuery
                    ? `We couldn't find any announcements matching "${searchQuery}". Try modifying your search term.`
                    : 'The Provincial Tourism Office has not published any active bulletins at this time. All travel corridors are operating normally.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-[#153325] text-white text-xs font-semibold hover:bg-[#1d4433] transition-colors"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {filteredAnnouncements.map((ann, idx) => (
                  <article
                    key={ann.id}
                    id={`advisory-${ann.id}`}
                    className="bg-white border border-[#E8DFC8] hover:border-[#B88B2A]/60 rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all relative group"
                  >
                    {/* Header Row: Official Badge & Date */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-[#F0EBE1]">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#153325]/10 text-[#153325] font-semibold text-[11px] tracking-wide uppercase">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#B88B2A]" />
                          Official Notice
                        </span>
                        {idx === 0 && !searchQuery && (
                          <span className="px-2 py-0.5 rounded-md bg-[#B88B2A] text-white text-[10px] font-bold uppercase tracking-wider">
                            Latest
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#8C827A]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(ann.created_at)}
                        </span>
                        {formatRelativeTime(ann.created_at) && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#A69B91]">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(ann.created_at)}
                          </span>
                        )}
                        <button
                          onClick={() => handleCopyShare(ann)}
                          title="Share / Copy Link"
                          className="p-1.5 rounded-lg hover:bg-[#FAF7F2] text-[#8C827A] hover:text-[#153325] transition-colors ml-1"
                        >
                          {copiedId === ann.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#153325] mb-3 leading-snug">
                      {ann.title}
                    </h2>

                    {/* Content (retaining line breaks) */}
                    <div className="text-sm text-[#4A4540] leading-relaxed whitespace-pre-line mb-5 font-normal">
                      {ann.content}
                    </div>

                    {/* Footer: Issuer & Authority */}
                    <div className="pt-4 border-t border-[#F0EBE1] flex items-center justify-between text-xs text-[#8C827A]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#153325]/10 flex items-center justify-center text-[#153325]">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span>
                          Issued by{' '}
                          <strong className="text-[#153325] font-semibold">
                            {ann.created_by_name || 'Provincial Tourism Office'}
                          </strong>
                        </span>
                      </div>
                      <span className="text-[11px] text-[#B88B2A] font-medium hidden sm:inline">
                        DOT Cordillera Verified
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Column: Useful Help & Shortcuts (1 col) */}
          <aside className="space-y-6">
            
            {/* Direct Assistance Box */}
            <div className="bg-[#153325] text-white rounded-2xl p-6 relative overflow-hidden shadow-md">
              <div className="w-10 h-10 rounded-full bg-[#B88B2A]/20 flex items-center justify-center text-[#D4A942] mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg mb-2">Need Field Assistance?</h3>
              <p className="text-xs text-white/80 leading-relaxed mb-4">
                For urgent inquiries regarding trail conditions, weather closures, or municipal permits, reach out directly to the provincial desk.
              </p>
              <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-white/90">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#D4A942]" />
                  <span>Abra PPO: <strong>(074) 752-5001</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#D4A942]" />
                  <span>Provincial Hospital: <strong>(074) 752-5044</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#D4A942]" />
                  <span>Disaster Desk: <strong>(074) 752-5060</strong></span>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-white/10">
                <Link
                  to="/travel-tips"
                  className="block text-center py-2.5 px-4 rounded-xl bg-[#B88B2A] hover:bg-[#a07722] text-white text-xs font-semibold transition-colors"
                >
                  View All Emergency Desks
                </Link>
              </div>
            </div>

            {/* Quick Navigation Card */}
            <div className="bg-white border border-[#E8DFC8] rounded-2xl p-6 shadow-xs">
              <h3 className="font-serif font-bold text-sm text-[#153325] uppercase tracking-wider mb-4">
                Explore Abra safely
              </h3>
              <ul className="space-y-3 text-xs">
                <li>
                  <Link
                    to="/municipalities"
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF7F2] text-[#232120] font-medium transition-colors border border-transparent hover:border-[#E8DFC8]"
                  >
                    <span className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#B88B2A]" />
                      27 Municipalities Directory
                    </span>
                    <span className="text-[#8C827A]">→</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/events"
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF7F2] text-[#232120] font-medium transition-colors border border-transparent hover:border-[#E8DFC8]"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#B88B2A]" />
                      Festivals & Cultural Events
                    </span>
                    <span className="text-[#8C827A]">→</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/map"
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF7F2] text-[#232120] font-medium transition-colors border border-transparent hover:border-[#E8DFC8]"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#B88B2A]" />
                      Interactive Geographic Map
                    </span>
                    <span className="text-[#8C827A]">→</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Official Notice Protocol Disclaimer */}
            <div className="bg-[#FAF7F2] border border-[#E8DFC8] rounded-2xl p-5 text-[11px] text-[#5A534E] leading-relaxed">
              <strong className="text-[#153325] block mb-1">Official Publication Notice:</strong>
              Bulletins posted on this portal are authorized by the Provincial Tourism Office of Abra in coordination with the CAR Regional Department of Tourism and relevant municipal Local Government Units (LGUs).
            </div>

          </aside>

        </div>
      </div>
    </div>
  );
};

export default Announcements;
