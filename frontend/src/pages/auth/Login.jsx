import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, AlertCircle, Compass, Shield, User, ArrowRight } from 'lucide-react';

const Login = () => {
  const { loginTourist } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginTourist(email, password);
      if (user.role === 'TOURIST') {
        navigate('/tourist-dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#FAF7F2] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fadeIn">
        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-[#E8DFC8] shadow-sm overflow-hidden">
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
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] text-[#153325] text-[10px] font-bold uppercase tracking-wider mb-2 border border-[#E8DFC8]">
                <User className="w-3 h-3 text-[#B88B2A]" />
                <span>Tourist & Traveler Access</span>
              </div>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#153325] tracking-tight">
              Sign In to Abraventure
            </h1>
            <p className="text-xs text-[#5A534E] mt-1.5 leading-relaxed">
              Access your custom itineraries, review homestays, and coordinate with verified local guides.
            </p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-5 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-xs border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
                {error.includes('Official & Stakeholder Portal') && (
                  <Link
                    to="/portal/login"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#153325] hover:underline mt-2 pl-6"
                  >
                    <span>Go to Official & Stakeholder Portal</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#232120] mb-1">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9E978E] pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#DCD5C9] rounded-xl focus:bg-white focus:outline-none focus:border-[#153325] text-xs text-[#232120] transition-all"
                    placeholder="traveler@example.com"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#DCD5C9] rounded-xl focus:bg-white focus:outline-none focus:border-[#153325] text-xs text-[#232120] transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 btn-editorial-primary text-xs tracking-wider flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70 shadow-sm"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Sign In to Discover Abra'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-[#5A534E] border-t border-[#F3ECE0] pt-5 space-y-3">
              <div>
                Don't have a tourist account?{' '}
                <Link to="/register" className="text-[#153325] font-bold hover:text-[#B88B2A] transition-colors">
                  Create Account Free
                </Link>
              </div>

              {/* Stakeholder / DOT Banner */}
              <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DFC8] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#5A534E]">
                  <Shield className="w-4 h-4 text-[#153325] flex-shrink-0" />
                  <span className="text-[11px]">DOT Officer or Host?</span>
                </div>
                <Link
                  to="/portal/login"
                  className="font-bold text-[#B88B2A] hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Portal Login</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#9E978E] mt-4 font-medium">
          Official Tourism Platform • Province of Abra, Philippines
        </p>
      </div>
    </div>
  );
};

export default Login;
