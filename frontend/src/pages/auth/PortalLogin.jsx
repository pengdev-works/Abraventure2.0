import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Lock, Mail, AlertCircle, Shield, Building2, Home, 
  UserCheck, ArrowLeft, KeyRound, Eye, EyeOff, CheckCircle2, ArrowRight
} from 'lucide-react';

const PortalLogin = () => {
  const { loginPortal } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('officer');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide your email address and password.');
      return;
    }

    setLoading(true);

    try {
      const user = await loginPortal(email.trim(), password);
      switch (user.role) {
        case 'PROVINCIAL_DOT':  navigate('/provincial-dashboard'); break;
        case 'MUNICIPAL_DOT':   navigate('/municipal-dashboard');  break;
        case 'HOMESTAY_OWNER':  navigate('/owner-dashboard');      break;
        case 'TOUR_GUIDE':      navigate('/guide-dashboard');      break;
        default:                navigate('/');
      }
    } catch (err) {
      console.error('Portal login error:', err);
      setError(err.message || 'Authentication failed. Please verify your official credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[var(--color-forest-950)] flex items-center justify-center px-4 py-12 relative overflow-hidden text-[var(--color-cream-100)]">
      <div className="w-full max-w-lg relative z-10 animate-fadeIn">
        {/* Back Link */}
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-[var(--color-cream-200)]/70 hover:text-white transition-colors font-medium">
            <ArrowLeft className="w-3.5 h-3.5 text-[var(--color-gold)]" />
            <span>Return to Public Website</span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-app)] shadow-2xl overflow-hidden text-[var(--text-primary)]">
          {/* Top Security Banner */}
          <div className="bg-[var(--color-forest-900)] px-6 py-3 flex items-center justify-between text-[var(--color-cream-100)] border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Shield className="w-4 h-4 text-[var(--color-gold)]" />
              <span className="tracking-wider uppercase text-[10px]">OFFICIAL GOVERNMENT & STAKEHOLDER PORTAL</span>
            </div>
            <span className="text-[9px] uppercase font-bold px-2.5 py-0.5 rounded bg-[var(--color-forest-950)] text-[var(--color-gold)] border border-[var(--color-gold)]/30">
              Verified Access
            </span>
          </div>

          {/* Header */}
          <div className="px-6 sm:px-8 pt-8 pb-4 text-center border-b border-[var(--border-subtle)]">
            <Link to="/" className="inline-flex justify-center mb-3 group" title="Return to Home">
              <img
                src="/abraventure-logo.png"
                alt="Abraventure Official Logo"
                className="w-16 h-16 sm:w-18 sm:h-18 object-contain filter drop-shadow-md group-hover:scale-105 transition-transform"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </Link>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-gold)] font-bold block mb-1">
              PROVINCE OF ABRA • TOURISM DESK
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Administrative Portal
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
              Provincial DOT, Municipal Tourism Officers & Accredited Tourism Providers
            </p>

            {/* Role Tab Selector */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[var(--bg-input)] rounded-xl border border-[var(--border-app)] mt-5">
              <button
                type="button"
                onClick={() => { setActiveTab('officer'); setError(''); }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'officer'
                    ? 'bg-[var(--color-primary)] text-[var(--color-cream-100)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>DOT Officer Login</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('stakeholder'); setError(''); }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'stakeholder'
                    ? 'bg-[var(--color-primary)] text-[var(--color-cream-100)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Host / Guide Login</span>
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Tab Context Notice Banner */}
            <div className="mb-5 p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-[var(--color-gold)] flex-shrink-0 mt-0.5" />
              <div>
                {activeTab === 'officer' ? (
                  <p>
                    Authorized access for <strong className="text-[var(--text-primary)]">Provincial Tourism Officers</strong> and <strong className="text-[var(--text-primary)]">Municipal Tourism Officers</strong> of Abra.
                  </p>
                ) : (
                  <p>
                    Access for approved and accredited <strong className="text-[var(--text-primary)]">Homestay Hosts</strong> and <strong className="text-[var(--text-primary)]">Licensed Tour Guides</strong>.
                  </p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div role="alert" className="mb-5 bg-red-500/10 text-[var(--color-danger)] px-4 py-3 rounded-xl text-xs border border-red-500/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[var(--color-danger)] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{error}</span>
                </div>
                {error.includes('still under review') && (
                  <p className="mt-2 text-[11px] text-[var(--text-secondary)] pl-6">
                    Our tourism officers are currently validating your accreditation requirements. You will receive an update once reviewed.
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email Address */}
              <div>
                <label htmlFor="portal-email" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  {activeTab === 'officer' ? 'Official Email Address' : 'Account Email'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--text-muted)] pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="portal-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-app)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]"
                    placeholder={activeTab === 'officer' ? "officer@abra.gov.ph" : "host@abraventure.ph"}
                  />
                </div>
              </div>

              {/* Password with Show/Hide Toggle */}
              <div>
                <label htmlFor="portal-password" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--text-muted)] pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="portal-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 bg-[var(--bg-input)] border border-[var(--border-app)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 btn-editorial-gold text-xs tracking-wider flex justify-center items-center gap-2 cursor-pointer disabled:opacity-60 shadow-sm"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Authenticate & Open Dashboard</span>
                  </>
                )}
              </button>
            </form>

            {/* Bottom Links */}
            <div className="mt-6 text-center text-xs text-[var(--text-secondary)] border-t border-[var(--border-subtle)] pt-5 space-y-2.5">
              <div>
                New Tourism Provider?{' '}
                <Link to="/apply/provider" className="text-[var(--text-primary)] font-bold hover:text-[var(--color-gold)] transition-colors">
                  Submit Provider Application
                </Link>
              </div>
              <div className="text-[11px]">
                Visiting tourist?{' '}
                <Link to="/login" className="text-[var(--text-primary)] font-semibold hover:underline">
                  Sign in to Tourist Account
                </Link>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-[var(--color-cream-200)]/50 mt-4 font-medium">
          Provincial Tourism Office • Bangued Provincial Capitol, Abra
        </p>
      </div>
    </div>
  );
};

export default PortalLogin;
