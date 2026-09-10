import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, AlertCircle, Shield, User, ArrowRight, Eye, EyeOff, CheckCircle2, HelpCircle, X } from 'lucide-react';

const Login = () => {
  const { loginTourist } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Email format inline feedback
  const isEmailValid = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    setLoading(true);

    try {
      const user = await loginTourist(email.trim(), password);
      if (user.role === 'TOURIST') {
        navigate('/tourist-dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Tourist login error:', err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors flex flex-col justify-center items-center px-4 py-10 sm:py-14">
      {/* Top Government Platform Identification */}
      <div className="text-center mb-6 max-w-md w-full">
        <span className="inline-block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] bg-[var(--bg-card-subtle)] px-3 py-1 rounded-full border border-[var(--border-subtle)] mb-2">
          PROVINCIAL TOURISM OFFICE • PROVINCE OF ABRA, PHILIPPINES
        </span>
        <div className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-[var(--text-primary)] uppercase">
          ABRAVENTURE
        </div>
        <div className="text-[9px] font-sans font-semibold tracking-[0.25em] text-[var(--color-gold)] uppercase">
          PROVINCE OF ABRA • CORDILLERA
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md">
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-app)] shadow-sm overflow-hidden text-[var(--text-primary)]">
          {/* Card Header */}
          <div className="px-6 sm:px-8 pt-8 pb-5 text-center border-b border-[var(--border-subtle)]">
            <Link to="/" className="inline-flex justify-center mb-3 group" title="Return to AbraVenture Home">
              <img
                src="/abraventure-logo.png"
                alt="Official Abra Provincial Seal"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </Link>

            {/* Eyebrow Label */}
            <div className="flex justify-center mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-card-subtle)] text-[var(--text-primary)] text-[10px] font-bold uppercase tracking-wider border border-[var(--border-subtle)]">
                <User className="w-3 h-3 text-[var(--color-gold)]" />
                <span>TOURIST & TRAVELER ACCESS</span>
              </div>
            </div>

            {/* Main Heading & Supporting Text */}
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              Sign In to AbraVenture
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed max-w-sm mx-auto">
              Access your saved itineraries, review homestays, discover destinations, and connect with verified local tourism providers.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Error Feedback */}
            {error && (
              <div 
                role="alert" 
                className="mb-5 bg-red-500/10 text-[var(--color-danger)] px-4 py-3 rounded-xl text-xs border border-red-500/30"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[var(--color-danger)] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{error}</span>
                </div>
                {error.includes('Official & Stakeholder Portal') && (
                  <Link
                    to="/portal/login"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-gold)] hover:underline mt-2 pl-6"
                  >
                    <span>Proceed to Official Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email Address */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label 
                    htmlFor="tourist-email" 
                    className="block text-xs font-semibold text-[var(--text-primary)]"
                  >
                    Email Address
                  </label>
                  {isEmailValid && (
                    <span className="text-[10px] text-[var(--color-success)] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Valid email
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--text-muted)] pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="tourist-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-app)] rounded-xl focus:bg-[var(--bg-input-focus)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] text-xs text-[var(--text-primary)] transition-all"
                    placeholder="traveler@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label 
                    htmlFor="tourist-password" 
                    className="block text-xs font-semibold text-[var(--text-primary)]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] text-[var(--color-gold)] hover:underline font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--text-muted)] pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="tourist-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 bg-[var(--bg-input)] border border-[var(--border-app)] rounded-xl focus:bg-[var(--bg-input-focus)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] text-xs text-[var(--text-primary)] transition-all"
                    placeholder="Enter your account password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--text-secondary)] select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border-app)] text-[var(--color-gold)] focus:ring-[var(--color-gold)] cursor-pointer"
                  />
                  <span>Remember me on this browser</span>
                </label>
              </div>

              {/* Primary Submit Button with Loading State */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 btn-editorial-primary text-xs tracking-wider flex justify-center items-center gap-2 cursor-pointer disabled:opacity-60 shadow-sm"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In to Discover Abra</span>
                )}
              </button>
            </form>

            {/* Secondary Tourist Registration Link */}
            <div className="mt-6 text-center text-xs text-[var(--text-secondary)] border-t border-[var(--border-subtle)] pt-5 space-y-3">
              <div>
                Don't have a tourist account?{' '}
                <Link to="/register" className="text-[var(--text-primary)] font-bold hover:text-[var(--color-gold)] transition-colors">
                  Create Account Free
                </Link>
              </div>

              {/* Visually Separated Administrative Link */}
              <div className="bg-[var(--bg-card-subtle)] p-3 rounded-xl border border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Shield className="w-4 h-4 text-[var(--color-gold)] flex-shrink-0" />
                  <span className="text-[11px] font-medium">DOT Officer or Tourism Provider?</span>
                </div>
                <Link
                  to="/portal/login"
                  className="font-bold text-[var(--color-gold)] hover:opacity-80 flex items-center gap-1 text-[11px] transition-colors"
                >
                  <span>Portal Login</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Government Disclaimer */}
        <p className="text-center text-[11px] text-[var(--text-secondary)] mt-4 font-medium">
          Official Tourism Platform • Provincial Government of Abra
        </p>
      </div>

      {/* Forgot Password Helper Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[var(--bg-card)] max-w-sm w-full rounded-2xl border border-[var(--border-app)] p-6 shadow-xl relative text-[var(--text-primary)]">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 text-[var(--text-primary)] mb-3">
              <HelpCircle className="w-5 h-5 text-[var(--color-gold)]" />
              <h3 className="font-serif font-bold text-base">Account Recovery</h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              To recover or reset your AbraVenture tourist account password, please contact the Provincial Tourism Office helpdesk at <strong className="text-[var(--color-gold)]">tourism@abra.gov.ph</strong> or visit Bangued Provincial Capitol.
            </p>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 btn-editorial-primary text-xs"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
