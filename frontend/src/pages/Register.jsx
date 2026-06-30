import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Lock, Landmark, AlertCircle, CheckCircle } from 'lucide-react';

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
    // Fetch all municipalities for selection
    const fetchMunicipalities = async () => {
      try {
        const response = await fetch('/api/municipalities');
        if (response.ok) {
          const data = await response.json();
          setMunicipalities(data);
        } else {
          console.error('Failed to fetch municipalities');
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

    // Validate that stakeholders select their municipality
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
          : 'Registration submitted successfully! Your account will be active once reviewed by tourism admins.'
      );
      
      // Reset form
      setFullName('');
      setEmail('');
      setPassword('');
      setPhoneNumber('');
      setRole('TOURIST');
      setMunicipalityId('');

      setTimeout(() => {
        navigate('/login');
      }, 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center px-4 py-16 bg-slate-50">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-900 to-amber-500"></div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800">Create Account</h2>
          <p className="text-sm text-slate-450 mt-1">Join the ABRAVENTURE tourism portal</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-3 rounded-lg text-sm border border-emerald-200">
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-700" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-705 mb-1">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900/20 focus:border-emerald-900 text-sm transition-all"
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-705 mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900/20 focus:border-emerald-900 text-sm transition-all"
                placeholder="john.doe@example.com"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-semibold text-slate-705 mb-1">Phone Number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Phone className="w-5 h-5" />
              </span>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900/20 focus:border-emerald-900 text-sm transition-all"
                placeholder="0917XXXXXXX"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-705 mb-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900/20 focus:border-emerald-900 text-sm transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-slate-705 mb-1">Account Role</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Tourist / Guest', val: 'TOURIST' },
                { label: 'Homestay Owner', val: 'HOMESTAY_OWNER' },
                { label: 'Tour Guide', val: 'TOUR_GUIDE' },
                { label: 'Municipal DOT', val: 'MUNICIPAL_DOT' },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => {
                    setRole(item.val);
                    if (item.val === 'TOURIST') setMunicipalityId('');
                  }}
                  className={`py-2 px-3 border rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    role === item.val
                      ? 'border-emerald-900 bg-emerald-900/5 text-emerald-950 font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Municipality selection (Conditional) */}
          {role !== 'TOURIST' && (
            <div className="animate-fadeIn">
              <label className="block text-sm font-semibold text-slate-750 mb-1 flex items-center gap-1">
                <Landmark className="w-4 h-4 text-emerald-900" />
                Select Municipality
              </label>
              <select
                required
                value={municipalityId}
                onChange={(e) => setMunicipalityId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900/20 focus:border-emerald-900 text-sm transition-all"
              >
                <option value="">-- Choose Municipality --</option>
                {municipalities.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                Stakeholders and Municipal admins must specify their geographic municipality.
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-550 border-t border-slate-100 pt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-950 font-bold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
