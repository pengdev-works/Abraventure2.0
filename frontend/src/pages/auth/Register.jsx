import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  User, Mail, Phone, Lock, AlertCircle, CheckCircle2, 
  Eye, EyeOff, ArrowRight, ShieldCheck, Check, Sparkles, Building2
} from 'lucide-react';

const Register = () => {
  const { register, loginTourist } = useAuth();
  const navigate = useNavigate();

  // 5 Explicit Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility controls
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Policy & Terms
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 5 Password Policy Criteria
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

  const criteriaCount = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  // Password strength calculation
  const getStrengthMeta = () => {
    if (password.length === 0) return { label: 'Empty', color: 'bg-stone-200', text: 'text-stone-400', percent: 0 };
    if (criteriaCount <= 2) return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600', percent: 25 };
    if (criteriaCount === 3) return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600', percent: 50 };
    if (criteriaCount === 4) return { label: 'Good', color: 'bg-sky-600', text: 'text-sky-600', percent: 75 };
    return { label: 'Strong', color: 'bg-emerald-600', text: 'text-emerald-700', percent: 100 };
  };

  const strengthMeta = getStrengthMeta();
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const isPhoneValid = phoneNumber.length === 0 || /^09\d{9}$/.test(phoneNumber.replace(/\s+/g, ''));
  const isEmailValid = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!fullName.trim() || !email.trim() || !phoneNumber.trim() || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isEmailValid) {
      setError('Please enter a valid email address.');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (!/^09\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 11-digit Philippine mobile number starting with 09 (e.g. 09123456789).');
      return;
    }

    if (criteriaCount < 5) {
      setError('Password must satisfy all 5 security requirements listed below.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and re-type.');
      return;
    }

    if (!agreedToTerms) {
      setError('You must accept the Terms of Use and Privacy Policy to proceed.');
      return;
    }

    setLoading(true);

    try {
      // Tourist accounts are registered with role: 'TOURIST'
      await register(fullName.trim(), email.trim(), password, 'TOURIST', cleanPhone, null);
      setIsSuccess(true);
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Unable to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAfterSuccess = async () => {
    try {
      await loginTourist(email.trim(), password);
      navigate('/tourist-dashboard');
    } catch {
      navigate('/login');
    }
  };

  const inputClasses = "w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-app)] rounded-xl focus:bg-[var(--bg-input-focus)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] text-xs text-[var(--text-primary)] transition-all";

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors flex flex-col justify-center items-center px-4 py-10 sm:py-14">
      {/* Top Government Platform Identification */}
      <div className="text-center mb-6 max-w-lg w-full">
        <span className="inline-block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] bg-[var(--bg-card-subtle)] px-3 py-1 rounded-full border border-[var(--border-subtle)] mb-2">
          PROVINCIAL TOURISM OFFICE • PROVINCE OF ABRA, PHILIPPINES
        </span>
        <div className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-[var(--text-primary)] uppercase">
          JOIN ABRAVENTURE
        </div>
      </div>

      <div className="w-full max-w-lg">
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-app)] shadow-sm overflow-hidden text-[var(--text-primary)]">
          {/* Card Header */}
          <div className="px-6 sm:px-8 pt-8 pb-5 text-center border-b border-[var(--border-subtle)]">
            <Link to="/" className="inline-flex justify-center mb-3 group" title="Return to Home">
              <img
                src="/abraventure-logo.png"
                alt="Abraventure Official Logo"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </Link>

            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-gold)] font-bold block mb-1">
              TOURIST & TRAVELER MEMBERSHIP
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              Create Your AbraVenture Account
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed max-w-md mx-auto">
              Create an account to save destinations, build itineraries, review tourism experiences, and plan your trip around Abra.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {/* SUCCESS STATE */}
            {isSuccess ? (
              <div className="text-center py-6 animate-fadeIn">
                <div className="w-16 h-16 bg-[var(--color-primary)]/15 text-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--color-primary)]/30">
                  <Sparkles className="w-8 h-8 text-[var(--color-gold)]" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)] mb-2">
                  Welcome to AbraVenture!
                </h2>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed mb-6">
                  Your account has been created successfully. You are now authorized to curate personal itineraries, bookmark local attractions, and book verified homestays.
                </p>
                <div className="p-4 bg-[var(--bg-card-subtle)] rounded-xl border border-[var(--border-subtle)] mb-6 text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Account Name:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Registered Email:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Classification:</span>
                    <span className="font-semibold text-[var(--text-primary)]">Verified Tourist / Traveler</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleContinueAfterSuccess}
                  className="w-full py-3 btn-editorial-primary text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>Continue to AbraVenture</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* REGISTRATION FORM */
              <>
                {error && (
                  <div role="alert" className="mb-5 flex items-start gap-2.5 bg-red-50 text-red-800 px-4 py-3 rounded-xl text-xs border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {/* Field 1: Full Legal Name */}
                  <div>
                    <label htmlFor="reg-fullname" className="block text-xs font-semibold text-[#232120] mb-1">
                      1. Full Legal Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9E978E] pointer-events-none">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        id="reg-fullname"
                        type="text"
                        name="fullName"
                        autoComplete="name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={inputClasses}
                        placeholder="Maria Santos"
                      />
                    </div>
                  </div>

                  {/* Field 2: Email Address */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="reg-email" className="block text-xs font-semibold text-[#232120]">
                        2. Email Address <span className="text-red-500">*</span>
                      </label>
                      {isEmailValid && (
                        <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Valid format
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9E978E] pointer-events-none">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        id="reg-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClasses}
                        placeholder="maria@example.com"
                      />
                    </div>
                  </div>

                  {/* Field 3: Mobile Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="reg-phone" className="block text-xs font-semibold text-[#232120]">
                        3. Mobile Number <span className="text-red-500">*</span>
                      </label>
                      {phoneNumber && isPhoneValid && (
                        <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Valid PH number
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9E978E] pointer-events-none">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        id="reg-phone"
                        type="tel"
                        name="phoneNumber"
                        autoComplete="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className={inputClasses}
                        placeholder="09XXXXXXXXX"
                      />
                    </div>
                    <p className="text-[10px] text-[#5A534E] mt-1">Used for booking SMS alerts and trip notifications.</p>
                  </div>

                  {/* Field 4: Password */}
                  <div>
                    <label htmlFor="reg-password" className="block text-xs font-semibold text-[#232120] mb-1">
                      4. Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9E978E] pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-2.5 bg-[#FAF7F2] border border-[#DCD5C9] rounded-xl focus:bg-white focus:outline-none focus:border-[#153325] focus:ring-1 focus:ring-[#153325] text-xs text-[#232120] transition-all"
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5A534E] hover:text-[#153325] transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {password.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-[#5A534E] font-medium">Password Strength:</span>
                          <span className={`font-bold ${strengthMeta.text}`}>{strengthMeta.label}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#FAF7F2] border border-[#E8DFC8] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${strengthMeta.color}`}
                            style={{ width: `${strengthMeta.percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Live Password Requirements Checklist */}
                    <div className="mt-3 p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFC8] text-[11px] space-y-1.5">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#153325] mb-1">
                        Password Requirements
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
                        <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-[#5A534E]'}`}>
                          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasMinLength ? 'bg-emerald-600 text-white' : 'border border-[#9E978E]'}`}>
                            {hasMinLength ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '•'}
                          </span>
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-700 font-semibold' : 'text-[#5A534E]'}`}>
                          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasUpper ? 'bg-emerald-600 text-white' : 'border border-[#9E978E]'}`}>
                            {hasUpper ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '•'}
                          </span>
                          <span>One uppercase letter</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-700 font-semibold' : 'text-[#5A534E]'}`}>
                          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasLower ? 'bg-emerald-600 text-white' : 'border border-[#9E978E]'}`}>
                            {hasLower ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '•'}
                          </span>
                          <span>One lowercase letter</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-semibold' : 'text-[#5A534E]'}`}>
                          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasNumber ? 'bg-emerald-600 text-white' : 'border border-[#9E978E]'}`}>
                            {hasNumber ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '•'}
                          </span>
                          <span>One number</span>
                        </div>
                        <div className={`flex items-center gap-1.5 sm:col-span-2 ${hasSpecial ? 'text-emerald-700 font-semibold' : 'text-[#5A534E]'}`}>
                          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasSpecial ? 'bg-emerald-600 text-white' : 'border border-[#9E978E]'}`}>
                            {hasSpecial ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '•'}
                          </span>
                          <span>One special character (!@#$%^&*...)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Field 5: Confirm Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="reg-confirm-password" className="block text-xs font-semibold text-[#232120]">
                        5. Confirm Password <span className="text-red-500">*</span>
                      </label>
                      {passwordsMatch && (
                        <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Passwords match
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9E978E] pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="reg-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-2.5 bg-[#FAF7F2] border border-[#DCD5C9] rounded-xl focus:bg-white focus:outline-none focus:border-[#153325] focus:ring-1 focus:ring-[#153325] text-xs text-[#232120] transition-all"
                        placeholder="Re-enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        aria-pressed={showConfirmPassword}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5A534E] hover:text-[#153325] transition-colors cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Terms and Privacy Policy Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#5A534E] select-none">
                      <input
                        type="checkbox"
                        required
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-[#DCD5C9] text-[#153325] focus:ring-[#153325] cursor-pointer flex-shrink-0"
                      />
                      <span className="leading-relaxed text-[11px]">
                        I agree to the <strong className="text-[#153325]">Terms of Use</strong> and <strong className="text-[#153325]">Privacy Policy</strong> of the Provincial Tourism Office of Abra.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button with Loading State */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 mt-3 btn-editorial-primary text-xs tracking-wider flex justify-center items-center gap-2 cursor-pointer disabled:opacity-60 shadow-sm"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <span>Create Tourist Account</span>
                    )}
                  </button>
                </form>

                {/* Footnotes & Redirection */}
                <div className="mt-6 text-center text-xs text-[var(--text-secondary)] border-t border-[var(--border-subtle)] pt-5 space-y-3">
                  <div>
                    Already have an account?{' '}
                    <Link to="/login" className="text-[var(--text-primary)] font-bold hover:text-[var(--color-gold)] transition-colors">
                      Sign In
                    </Link>
                  </div>

                  {/* Tourism Provider Onboarding Callout */}
                  <div className="bg-[var(--bg-card-subtle)] p-3.5 rounded-xl border border-[var(--border-subtle)] text-left text-xs flex items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-[var(--text-primary)] block text-[11px]">
                        Applying as a Homestay Host or Tour Guide?
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)]">
                        Accreditation onboarding requires official document verification.
                      </span>
                    </div>
                    <Link
                      to="/apply/provider"
                      className="font-bold text-[var(--color-gold)] hover:opacity-80 flex items-center gap-1 text-[11px] flex-shrink-0"
                    >
                      <span>Apply Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Government Disclaimer */}
        <p className="text-center text-[11px] text-[var(--text-secondary)] mt-4 font-medium">
          Official Tourism Platform • Provincial Government of Abra
        </p>
      </div>
    </div>
  );
};

export default Register;
