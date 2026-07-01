import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Lock, Landmark, AlertCircle, CheckCircle, Compass, Home, Map } from 'lucide-react';

const ROLES = [
  { label: 'Tourist / Traveler', val: 'TOURIST',       icon: '🧭', desc: 'Explore destinations & plan itineraries' },
  { label: 'Homestay Owner',     val: 'HOMESTAY_OWNER', icon: '🏡', desc: 'Register your accommodation' },
  { label: 'Tour Guide',         val: 'TOUR_GUIDE',     icon: '🗺️',  desc: 'Offer guided local experiences' },
  { label: 'Municipal DOT',      val: 'MUNICIPAL_DOT',  icon: '🏛️',  desc: "Manage your municipality's tourism" },
];

const Register = () => {
  const { register }  = useAuth();
  const navigate      = useNavigate();

  const [fullName,       setFullName]       = useState('');
  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [phoneNumber,    setPhoneNumber]    = useState('');
  const [role,           setRole]           = useState('TOURIST');
  const [municipalityId, setMunicipalityId] = useState('');
  const [municipalities, setMunicipalities] = useState([]);
  const [error,          setError]          = useState('');
  const [success,        setSuccess]        = useState('');
  const [loading,        setLoading]        = useState(false);

  useEffect(() => {
    const fetchMunicipalities = async () => {
      try {
        const response = await fetch('/api/municipalities');
        if (response.ok) {
          const data = await response.json();
          setMunicipalities(data);
        }
      } catch (err) {
        console.error('Error fetching municipalities:', err);
      }
    };
    fetchMunicipalities();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (role !== 'TOURIST' && !municipalityId) {
      setError('Please select your registered municipality.');
      setLoading(false);
      return;
    }

    try {
      await register(fullName, email, password, role, phoneNumber, municipalityId);
      setSuccess(
        role === 'TOURIST'
          ? 'Registration successful! You can now log in.'
          : 'Registration submitted! Your account will be active once reviewed by tourism admins.'
      );
      setFullName(''); setEmail(''); setPassword('');
      setPhoneNumber(''); setRole('TOURIST'); setMunicipalityId('');
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900/15 focus:border-emerald-900 text-sm transition-all";

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-woven flex items-center justify-center px-4 py-12">

      {/* Decorative orbs */}
      <div className="fixed top-20 right-10 w-72 h-72 bg-emerald-900/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 left-10 w-72 h-72 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 animate-fadeSlideUp">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">

          {/* Itneg Gold top bar */}
          <div className="h-1 bg-gradient-to-r from-emerald-900 via-amber-500 to-emerald-900" />

          {/* Header */}
          <div className="px-8 pt-8 pb-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Compass className="w-7 h-7 text-amber-500" />
              <span className="font-extrabold text-xl">
                <span className="text-amber-500">ABRA</span>
                <span className="text-emerald-900">VENTURE</span>
              </span>
            </div>
            <div className="divider-gold mx-auto w-12 mb-5" />
            <h2 className="text-2xl font-extrabold text-slate-800">Create Account</h2>
            <p className="text-sm text-slate-400 mt-1">Join the Abra tourism portal</p>
          </div>

          <div className="px-8 pb-8">
            {error && (
              <div className="mb-5 flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100">
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-5 flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-3 rounded-xl text-sm border border-emerald-100">
                <CheckCircle className="w-4.5 h-4.5 flex-shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none"><User className="w-4.5 h-4.5" /></span>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Juan dela Cruz" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none"><Mail className="w-4.5 h-4.5" /></span>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="juan@example.com" />
                </div>
              </div>

              {/* Phone & Password grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Phone</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none"><Phone className="w-4.5 h-4.5" /></span>
                    <input type="text" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputClass} placeholder="09XXXXXXXXX" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none"><Lock className="w-4.5 h-4.5" /></span>
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
                  </div>
                </div>
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => { setRole(item.val); if (item.val === 'TOURIST') setMunicipalityId(''); }}
                      className={`flex flex-col items-start p-3 border rounded-xl text-left cursor-pointer transition-all ${
                        role === item.val
                          ? 'border-emerald-900 bg-emerald-900/5 ring-1 ring-emerald-900/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-base mb-1">{item.icon}</span>
                      <span className={`text-xs font-extrabold ${role === item.val ? 'text-emerald-900' : 'text-slate-700'}`}>
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-400 leading-tight mt-0.5">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Municipality Selector */}
              {role !== 'TOURIST' && (
                <div className="animate-fadeSlideUp">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    <Landmark className="w-3.5 h-3.5 text-emerald-900" />
                    Select Municipality
                  </label>
                  <select
                    required
                    value={municipalityId}
                    onChange={(e) => setMunicipalityId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900/15 focus:border-emerald-900 text-sm transition-all"
                  >
                    <option value="">— Choose Municipality —</option>
                    {municipalities.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Stakeholders must specify their geographic municipality.</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md hover:shadow-emerald-900/25 hover:shadow-lg transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Create Account'}
              </button>
            </form>

            <div className="mt-5 text-center text-sm text-slate-500 border-t border-slate-100 pt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-900 font-bold hover:text-amber-600 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4 font-medium">
          Integrated Tourism Portal · Province of Abra · CAR
        </p>
      </div>
    </div>
  );
};

export default Register;
