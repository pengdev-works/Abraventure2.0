import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, Compass } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
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
      const user = await login(email, password);
      switch (user.role) {
        case 'PROVINCIAL_DOT':  navigate('/provincial-dashboard'); break;
        case 'MUNICIPAL_DOT':   navigate('/municipal-dashboard');  break;
        case 'HOMESTAY_OWNER':  navigate('/owner-dashboard');      break;
        case 'TOUR_GUIDE':      navigate('/guide-dashboard');      break;
        default:                navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-woven flex items-center justify-center px-4 py-12">

      {/* Decorative background orbs */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-emerald-900/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-72 h-72 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fadeSlideUp">
        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">

          {/* Itneg Gold top bar */}
          <div className="h-1 bg-gradient-to-r from-emerald-900 via-amber-500 to-emerald-900" />

          {/* Logo + Heading */}
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-5">
              <Compass className="w-7 h-7 text-amber-500" />
              <span className="font-extrabold text-xl">
                <span className="text-amber-500">ABRA</span>
                <span className="text-emerald-900">VENTURE</span>
              </span>
            </div>
            <div className="divider-gold mx-auto w-12 mb-5" />
            <h2 className="text-2xl font-extrabold text-slate-800 leading-tight">Welcome Back</h2>
            <p className="text-sm text-slate-400 mt-1">Sign in to your tourism dashboard</p>
          </div>

          <div className="px-8 pb-8">
            {error && (
              <div className="mb-5 flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100">
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Mail className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900/15 focus:border-emerald-900 text-sm transition-all"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Lock className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900/15 focus:border-emerald-900 text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md hover:shadow-emerald-900/25 hover:shadow-lg transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500 border-t border-slate-100 pt-5">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-900 font-bold hover:text-amber-600 transition-colors">
                Register here
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-xs text-slate-400 mt-4 font-medium">
          Integrated Tourism Portal · Province of Abra · CAR
        </p>
      </div>
    </div>
  );
};

export default Login;
