import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, AlertCircle, Compass, Shield, Building2, Home, UserCheck, ArrowLeft, KeyRound } from 'lucide-react';

const PortalLogin = () => {
  const { loginPortal } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('officer');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginPortal(email, password);
      switch (user.role) {
        case 'PROVINCIAL_DOT':  navigate('/provincial-dashboard'); break;
        case 'MUNICIPAL_DOT':   navigate('/municipal-dashboard');  break;
        case 'HOMESTAY_OWNER':  navigate('/owner-dashboard');      break;
        case 'TOUR_GUIDE':      navigate('/guide-dashboard');      break;
        default:                navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please verify your official credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#153325] flex items-center justify-center px-4 py-12 relative overflow-hidden text-white">
      <div className="w-full max-w-lg relative z-10 animate-fadeIn">
        {/* Back Link */}
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors font-medium">
            <ArrowLeft className="w-3.5 h-3.5 text-[#B88B2A]" />
            <span>Return to Public Website</span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8DFC8] shadow-2xl overflow-hidden text-[#232120]">
          {/* Top Security Banner */}
          <div className="bg-[#1D4433] px-6 py-3 flex items-center justify-between text-white border-b border-[#153325]">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Shield className="w-4 h-4 text-[#B88B2A]" />
              <span className="tracking-wider uppercase text-[10px]">OFFICIAL GOVERNMENT & STAKEHOLDER PORTAL</span>
            </div>
            <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-[#153325] text-[#B88B2A] border border-[#B88B2A]/30">
              Verified Access
            </span>
          </div>

          {/* Header */}
          <div className="px-8 pt-8 pb-4 text-center border-b border-[#F3ECE0]">
            <Link to="/" className="inline-flex justify-center mb-3 group" title="Return to Home">
              <img
                src="/abraventure-logo.png"
                alt="Abraventure Official Logo"
                className="w-16 h-16 sm:w-18 sm:h-18 object-contain filter drop-shadow-md group-hover:scale-105 transition-transform"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </Link>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B2A] font-bold block mb-1">
              PROVINCE OF ABRA • TOURISM DESK
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#153325]">
              Administrative Portal
            </h1>
            <p className="text-xs text-[#5A534E] mt-1.5 leading-relaxed">
              Provincial DOT, Municipal Tourism Officers & Accredited Tourism Providers
            </p>

            {/* Role Tab Selector */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-[#DCD5C9] mt-5">
              <button
                type="button"
                onClick={() => setActiveTab('officer')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'officer'
                    ? 'bg-[#153325] text-white shadow-xs'
                    : 'text-[#5A534E] hover:text-[#153325]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>DOT Officer Login</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stakeholder')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'stakeholder'
                    ? 'bg-[#153325] text-white shadow-xs'
                    : 'text-[#5A534E] hover:text-[#153325]'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Host / Guide Login</span>
              </button>
            </div>
          </div>

          <div className="p-8">
            {/* Context Info Banner */}
            <div className="mb-5 p-3 rounded-xl bg-white border border-[#E8DFC8] text-xs text-[#5A534E] flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-[#B88B2A] flex-shrink-0 mt-0.5" />
              <div>
                {activeTab === 'officer' ? (
                  <p>Authorized entrance for <strong className="text-[#153325]">Provincial Tourism Officers</strong> and <strong className="text-[#153325]">Municipal Tourism Officers</strong> of Abra.</p>
                ) : (
                  <p>Access portal for accredited <strong className="text-[#153325]">Homestay Hosts</strong> and licensed <strong className="text-[#153325]">Tour Guides</strong>.</p>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-5 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-xs border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#232120] mb-1">Official Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9E978E] pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DCD5C9] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                    placeholder={activeTab === 'officer' ? "officer@abra.gov.ph" : "host@abraventure.ph"}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-[#232120] mb-1">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9E978E] pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DCD5C9] rounded-xl text-xs text-[#232120] focus:outline-none focus:border-[#153325]"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 btn-editorial-gold text-xs tracking-wider flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70 shadow-sm"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Authenticate & Open Dashboard</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-[#5A534E] border-t border-[#F3ECE0] pt-5 space-y-2">
              <div>
                New Officer or Operator?{' '}
                <Link to="/register" className="text-[#153325] font-bold hover:text-[#B88B2A] transition-colors">
                  Submit Accreditation Registration
                </Link>
              </div>
              <div className="text-[11px]">
                Visiting tourist?{' '}
                <Link to="/login" className="text-[#153325] font-semibold hover:underline">
                  Sign in to Tourist Account
                </Link>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-white/50 mt-4 font-medium">
          Provincial Tourism Office • Bangued Provincial Capitol, Abra
        </p>
      </div>
    </div>
  );
};

export default PortalLogin;
