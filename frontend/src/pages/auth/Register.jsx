import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Lock, Landmark, AlertCircle, CheckCircle, Compass, Home, Map } from 'lucide-react';

const ROLES = [
  { label: 'Tourist / Traveler', val: 'TOURIST', icon: '🧭', desc: 'Explore destinations & plan itineraries' },
  { label: 'Homestay Host', val: 'HOMESTAY_OWNER', icon: '🏡', desc: 'Register verified homestay' },
  { label: 'Licensed Tour Guide', val: 'TOUR_GUIDE', icon: '🗺️', desc: 'Offer certified local tours' },
  { label: 'Municipal DOT Officer', val: 'MUNICIPAL_DOT', icon: '🏛️', desc: 'Administer municipal directory' },
];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('TOURIST');
  const [municipalityId, setMunicipalityId] = useState('');
  const [municipalities, setMunicipalities] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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

    const passwordPolicy = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordPolicy.test(password)) {
      setError('Password must be at least 8 characters long and contain both letters and numbers.');
      setLoading(false);
      return;
    }

    try {
      await register(fullName, email, password, role, phoneNumber, municipalityId);
      setSuccess(
        role === 'TOURIST'
          ? 'Registration successful! You can now log in.'
          : 'Registration submitted! Your account will be active once reviewed by tourism administrators.'
      );
      setFullName(''); setEmail(''); setPassword('');
      setPhoneNumber(''); setRole('TOURIST'); setMunicipalityId('');
      setTimeout(() => navigate('/login'), 3500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#DCD5C9] rounded-xl focus:bg-white focus:outline-none focus:border-[#153325] text-xs text-[#232120] transition-all";

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#FAF7F2] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg relative z-10 animate-fadeIn">
        <div className="bg-white rounded-2xl border border-[#E8DFC8] shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-5 text-center border-b border-[#F3ECE0]">
            <Link to="/" className="inline-flex justify-center mb-3 group" title="Return to Home">
              <img
                src="/abraventure-logo.png"
                alt="Abraventure Official Logo"
                className="w-16 h-16 sm:w-18 sm:h-18 object-contain filter drop-shadow-md group-hover:scale-105 transition-transform"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </Link>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#B88B2A] font-bold block mb-1">
              JOIN ABRAVENTURE
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#153325]">
              Create New Account
            </h1>
            <p className="text-xs text-[#5A534E] mt-1 leading-relaxed">
              Register as a visitor or apply as an accredited tourism stakeholder
            </p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-5 flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-xs border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-5 flex items-center gap-2 bg-[#153325]/10 text-[#153325] px-4 py-3 rounded-xl text-xs border border-[#153325]/20 font-medium">
                <CheckCircle className="w-4 h-4 flex-shrink-0 text-[#153325]" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-[#232120] mb-1">Full Legal Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9E978E] pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Maria Santos"
                  />
                </div>
              </div>

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
                    className={inputClass}
                    placeholder="maria@example.com"
                  />
                </div>
              </div>

              {/* Phone & Password grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#232120] mb-1">Mobile Contact</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9E978E] pointer-events-none">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={inputClass}
                      placeholder="09XXXXXXXXX"
                    />
                  </div>
                </div>
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
                      className={inputClass}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#232120] mb-2">Account Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => { setRole(item.val); if (item.val === 'TOURIST') setMunicipalityId(''); }}
                      className={`flex flex-col items-start p-3 border rounded-xl text-left cursor-pointer transition-all ${
                        role === item.val
                          ? 'border-[#153325] bg-[#FAF7F2] ring-1 ring-[#153325]/20 shadow-2xs'
                          : 'border-[#E8DFC8] bg-white hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <span className="text-base mb-1">{item.icon}</span>
                      <span className={`font-serif font-bold text-xs ${role === item.val ? 'text-[#153325]' : 'text-[#232120]'}`}>
                        {item.label}
                      </span>
                      <span className="text-[10px] text-[#5A534E] leading-tight mt-0.5">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Municipality Selector */}
              {role !== 'TOURIST' && (
                <div className="animate-fadeIn">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-[#232120] mb-1">
                    <Landmark className="w-3.5 h-3.5 text-[#153325]" />
                    Registered Municipality
                  </label>
                  <select
                    required
                    value={municipalityId}
                    onChange={(e) => setMunicipalityId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DCD5C9] rounded-xl focus:bg-white focus:outline-none focus:border-[#153325] text-xs text-[#232120] transition-all"
                  >
                    <option value="">— Choose Municipality in Abra —</option>
                    {municipalities.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-[#5A534E] mt-1">Local operators must specify their official host municipality.</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 btn-editorial-primary text-xs tracking-wider flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70 shadow-sm"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Complete Registration'}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-[#5A534E] border-t border-[#F3ECE0] pt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-[#153325] font-bold hover:text-[#B88B2A] transition-colors">
                Sign In
              </Link>
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

export default Register;
