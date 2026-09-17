import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, Compass, User, Mail, Phone, Lock, FileText, Upload, 
  CheckCircle2, AlertCircle, ArrowRight, Shield, Building2, 
  Eye, EyeOff, Check, Copy, Info, Sparkles, MapPin, Award, Landmark
} from 'lucide-react';

const FALLBACK_MUNICIPALITIES = [
  { id: 1, name: 'Bangued' }, { id: 2, name: 'Boliney' }, { id: 3, name: 'Bucay' },
  { id: 4, name: 'Bucloc' }, { id: 5, name: 'Daguioman' }, { id: 6, name: 'Danglas' },
  { id: 7, name: 'Dolores' }, { id: 8, name: 'La Paz' }, { id: 9, name: 'Lacub' },
  { id: 10, name: 'Lagangilang' }, { id: 11, name: 'Lagayan' }, { id: 12, name: 'Langiden' },
  { id: 13, name: 'Licuan-Baay' }, { id: 14, name: 'Luba' }, { id: 15, name: 'Malibcong' },
  { id: 16, name: 'Manabo' }, { id: 17, name: 'Peñarrubia' }, { id: 18, name: 'Pidigan' },
  { id: 19, name: 'Pilar' }, { id: 20, name: 'Sallapadan' }, { id: 21, name: 'San Isidro' },
  { id: 22, name: 'San Juan' }, { id: 23, name: 'San Quintin' }, { id: 24, name: 'Tayum' },
  { id: 25, name: 'Tineg' }, { id: 26, name: 'Tubo' }, { id: 27, name: 'Villaviciosa' }
];

const ProviderApply = () => {
  const { applyProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial type from URL query param or state
  const queryParams = new URLSearchParams(location.search);
  const initialType = queryParams.get('type') === 'guide' || location.state?.providerType === 'guide'
    ? 'guide'
    : (queryParams.get('type') === 'homestay' || location.state?.providerType === 'homestay'
      ? 'homestay'
      : (queryParams.get('type') === 'municipal_office' || location.state?.providerType === 'municipal_office' ? 'municipal_office' : null));

  const [providerType, setProviderType] = useState(initialType);
  const [municipalities, setMunicipalities] = useState(FALLBACK_MUNICIPALITIES);

  // Common Personal Information
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [municipalityId, setMunicipalityId] = useState('');

  // Homestay Specific Details
  const [homestayName, setHomestayName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [barangay, setBarangay] = useState('');
  const [numberOfRooms, setNumberOfRooms] = useState('2');
  const [maxGuestCapacity, setMaxGuestCapacity] = useState('6');
  const [description, setDescription] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');

  // Tour Guide Specific Details
  const [guideName, setGuideName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('3');
  const [languagesSpoken, setLanguagesSpoken] = useState('English, Tagalog, Ilokano');
  const [areasCovered, setAreasCovered] = useState('Kaparkan Falls, Tineg, Bangued');
  const [specializations, setSpecializations] = useState('Eco-Trek, Travertine Waterfalls, Cultural Immersion');
  const [bio, setBio] = useState('');

  // Municipal Tourism Office Specific Details
  const [officeName, setOfficeName] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [contactPersonDesignation, setContactPersonDesignation] = useState('');
  const [officePhone, setOfficePhone] = useState('');
  const [officeEmail, setOfficeEmail] = useState('');

  // Documents
  const [validIdFile, setValidIdFile] = useState(null);
  const [accreditationDocFile, setAccreditationDocFile] = useState(null);
  const [supportingDocFile, setSupportingDocFile] = useState(null);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedData, setSubmittedData] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Password Policy Checks
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
  const criteriaCount = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  // Load municipalities from API
  useEffect(() => {
    const fetchMunicipalities = async () => {
      try {
        const res = await fetch('/api/municipalities');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setMunicipalities(data);
          }
        }
      } catch {
        // Keeps fallback 27 municipalities
      }
    };
    fetchMunicipalities();
  }, []);

  const handleCopyRef = () => {
    if (submittedData?.referenceNumber) {
      navigator.clipboard.writeText(submittedData.referenceNumber);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!providerType) {
      setError('Please select a provider type before continuing.');
      return;
    }

    if (!fullName.trim() || !email.trim() || !phoneNumber.trim() || !password || !confirmPassword || !municipalityId) {
      setError('Please complete all required personal and municipal details.');
      return;
    }

    // Email format validation
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!isEmailValid) {
      setError('Please enter a valid email address.');
      return;
    }

    // Philippine phone number validation (09XXXXXXXXX)
    const isPhoneValid = /^09\d{9}$/.test(phoneNumber.trim());
    if (!isPhoneValid) {
      setError('Phone number must be in Philippine format: 09XXXXXXXXX (11 digits).');
      return;
    }

    if (criteriaCount < 5) {
      setError('Password must meet all 5 security complexity criteria.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (providerType === 'homestay' && (!homestayName.trim() || !propertyAddress.trim())) {
      setError('Please provide the Homestay Name and Property Address.');
      return;
    }

    if (providerType === 'guide' && !licenseNumber.trim()) {
      setError('Please provide your Tour Guide Accreditation / License Number.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('providerType', providerType === 'homestay' ? 'HOMESTAY_OWNER' : providerType === 'guide' ? 'TOUR_GUIDE' : 'MUNICIPAL_OFFICE');
      formData.append('fullName', fullName.trim());
      formData.append('email', email.trim());
      formData.append('phoneNumber', phoneNumber.trim());
      formData.append('password', password);
      formData.append('confirmPassword', confirmPassword);
      formData.append('municipalityId', municipalityId);

      if (providerType === 'homestay') {
        formData.append('homestayName', homestayName.trim());
        formData.append('propertyAddress', propertyAddress.trim());
        formData.append('barangay', barangay.trim());
        formData.append('numberOfRooms', numberOfRooms);
        formData.append('maxGuestCapacity', maxGuestCapacity);
        formData.append('description', description.trim());
        formData.append('businessPhone', businessPhone.trim() || phoneNumber.trim());
        formData.append('businessEmail', businessEmail.trim() || email.trim());
      } else if (providerType === 'guide') {
        formData.append('guideName', guideName.trim() || fullName.trim());
        formData.append('licenseNumber', licenseNumber.trim());
        formData.append('yearsOfExperience', yearsOfExperience);
        formData.append('languagesSpoken', languagesSpoken.trim());
        formData.append('areasCovered', areasCovered.trim());
        formData.append('specializations', specializations.trim());
        formData.append('bio', bio.trim());
      } else {
        formData.append('officeName', officeName.trim());
        formData.append('officeAddress', officeAddress.trim());
        formData.append('contactPersonDesignation', contactPersonDesignation.trim());
        formData.append('officePhone', officePhone.trim() || phoneNumber.trim());
        formData.append('officeEmail', officeEmail.trim() || email.trim());
      }

      if (validIdFile) formData.append('validId', validIdFile);
      if (accreditationDocFile) formData.append('accreditationDoc', accreditationDocFile);
      if (supportingDocFile) formData.append('supportingDoc', supportingDocFile);

      const result = await applyProvider(formData);
      setSubmittedData({
        referenceNumber: result.referenceNumber,
        status: result.status || 'Pending Review',
        providerType,
        email: email.trim(),
        name: fullName.trim(),
        municipalityName: municipalities.find(m => String(m.id) === String(municipalityId))?.name || 'Abra'
      });
    } catch (err) {
      console.error('Provider onboarding failed:', err);
      setError(err.message || 'Failed to submit provider application. Please review your fields and try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-app)] rounded-xl focus:bg-[var(--bg-input-focus)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] text-xs text-[var(--text-primary)] transition-all";

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors py-10 sm:py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Top Header */}
        <div className="text-center mb-8">
          <span className="inline-block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] bg-[var(--bg-card-subtle)] px-3.5 py-1 rounded-full border border-[var(--border-subtle)] mb-2.5">
            PROVINCIAL TOURISM OFFICE • ACCREDITATION DESK
          </span>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
            Become an Accredited Tourism Provider
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 max-w-xl mx-auto leading-relaxed">
            Apply to become a verified tourism provider listed on ABRAVENTURE. Help travelers discover authentic Cordilleran hospitality and pristine landscapes.
          </p>
        </div>

        {/* SUCCESS VIEW */}
        {submittedData ? (
          <div className="bg-white rounded-2xl border border-[#E8DFC8] p-6 sm:p-10 shadow-sm animate-fadeIn text-center">
            <div className="w-16 h-16 bg-[#B88B2A]/15 text-[#B88B2A] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#B88B2A]/30">
              <Award className="w-8 h-8 text-[#B88B2A]" />
            </div>

            <span className="inline-block px-3 py-1 bg-amber-50 text-[#946E1D] border border-amber-200 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2">
              Application Status: {submittedData.status}
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#153325] mb-2">
              Application Submitted
            </h2>
            <p className="text-xs sm:text-sm text-[#5A534E] max-w-lg mx-auto leading-relaxed mb-6">
              Your accreditation application has been received and is currently under review by the Provincial Tourism Office of Abra and your host Municipal Tourism Office.
            </p>

            {/* Reference Number Banner */}
            <div className="bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl p-5 max-w-md mx-auto mb-6 text-left">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A534E] block mb-1">
                Official Reference Number
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-base sm:text-lg font-bold text-[#153325] tracking-wide">
                  {submittedData.referenceNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="px-2.5 py-1 text-[11px] font-semibold text-[#153325] bg-white border border-[#DCD5C9] rounded-lg hover:bg-[#FAF7F2] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedRef ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-[#E8DFC8] text-[11px] text-[#5A534E] space-y-1">
                <div className="flex justify-between">
                  <span>Applicant:</span>
                  <span className="font-semibold text-[#153325]">{submittedData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Municipality:</span>
                  <span className="font-semibold text-[#153325]">{submittedData.municipalityName}, Abra</span>
                </div>
                <div className="flex justify-between">
                  <span>Classification:</span>
                  <span className="font-semibold text-[#153325]">
                    {submittedData.providerType === 'homestay' ? 'Homestay Accommodation' : submittedData.providerType === 'guide' ? 'Licensed Local Guide' : 'Municipal Tourism Office'}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Steps Card */}
            <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 max-w-md mx-auto mb-8 text-left text-xs text-[#5A534E] flex items-start gap-3">
              <Info className="w-5 h-5 text-[#B88B2A] flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-[#153325]">What happens next?</strong> Municipal Tourism Officers will inspect your accreditation credentials. Upon authorization, your provider account will be activated and you can sign in through the <strong className="text-[#153325]">Administrative Portal</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <Link
                to="/portal/login"
                className="w-full sm:w-auto flex-1 py-2.5 btn-editorial-gold text-xs tracking-wider text-center"
              >
                Go to Portal Login
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto flex-1 py-2.5 btn-editorial-outline text-xs tracking-wider text-center"
              >
                Return to Website
              </Link>
            </div>
          </div>
        ) : (
          /* ONBOARDING FLOW */
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-app)] shadow-sm overflow-hidden text-[var(--text-primary)]">
            {/* Step 1: Provider Type Selection */}
            <div className="p-6 sm:p-8 border-b border-[var(--border-subtle)]">
              <div className="mb-4 text-center sm:text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-gold)] block mb-1">
                  STEP 1 OF 2 • CLASSIFICATION
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                  What type of tourism provider are you?
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Select your provider category to view the relevant accreditation criteria.
                </p>
              </div>

              {/* Three Large Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* 1. HOMESTAY HOST CARD */}
                <div
                  role="radio"
                  aria-checked={providerType === 'homestay'}
                  tabIndex={0}
                  onClick={() => setProviderType('homestay')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProviderType('homestay'); } }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer text-left relative focus:outline-none focus:ring-2 focus:ring-[#B88B2A] ${
                    providerType === 'homestay'
                      ? 'border-[#B88B2A] bg-[#153325]/5 shadow-sm ring-1 ring-[#B88B2A]'
                      : 'border-[#E8DFC8] hover:border-[#153325]/40 hover:bg-[#FAF7F2]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      providerType === 'homestay' ? 'bg-[#153325] text-[#FAF7F2]' : 'bg-[#FAF7F2] text-[#153325] border border-[#E8DFC8]'
                    }`}>
                      <Home className="w-5 h-5" />
                    </div>
                    {providerType === 'homestay' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#B88B2A] bg-white px-2 py-0.5 rounded-full border border-[#B88B2A]">
                        <Check className="w-3 h-3 stroke-[3]" /> Selected
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#153325] mb-1">
                    Homestay Host
                  </h3>
                  <p className="text-xs text-[#5A534E] leading-relaxed">
                    Register your accommodation and apply for tourism accreditation.
                  </p>
                </div>

                {/* 2. LICENSED TOUR GUIDE CARD */}
                <div
                  role="radio"
                  aria-checked={providerType === 'guide'}
                  tabIndex={0}
                  onClick={() => setProviderType('guide')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProviderType('guide'); } }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer text-left relative focus:outline-none focus:ring-2 focus:ring-[#B88B2A] ${
                    providerType === 'guide'
                      ? 'border-[#B88B2A] bg-[#153325]/5 shadow-sm ring-1 ring-[#B88B2A]'
                      : 'border-[#E8DFC8] hover:border-[#153325]/40 hover:bg-[#FAF7F2]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      providerType === 'guide' ? 'bg-[#153325] text-[#FAF7F2]' : 'bg-[#FAF7F2] text-[#153325] border border-[#E8DFC8]'
                    }`}>
                      <Compass className="w-5 h-5" />
                    </div>
                    {providerType === 'guide' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#B88B2A] bg-white px-2 py-0.5 rounded-full border border-[#B88B2A]">
                        <Check className="w-3 h-3 stroke-[3]" /> Selected
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#153325] mb-1">
                    Licensed Tour Guide
                  </h3>
                  <p className="text-xs text-[#5A534E] leading-relaxed">
                    Apply to be listed as a verified local tour guide.
                  </p>
                </div>

                {/* 3. MUNICIPAL TOURISM OFFICE CARD */}
                <div
                  role="radio"
                  aria-checked={providerType === 'municipal_office'}
                  tabIndex={0}
                  onClick={() => setProviderType('municipal_office')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProviderType('municipal_office'); } }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer text-left relative focus:outline-none focus:ring-2 focus:ring-[#B88B2A] ${
                    providerType === 'municipal_office'
                      ? 'border-[#B88B2A] bg-[#153325]/5 shadow-sm ring-1 ring-[#B88B2A]'
                      : 'border-[#E8DFC8] hover:border-[#153325]/40 hover:bg-[#FAF7F2]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      providerType === 'municipal_office' ? 'bg-[#153325] text-[#FAF7F2]' : 'bg-[#FAF7F2] text-[#153325] border border-[#E8DFC8]'
                    }`}>
                      <Landmark className="w-5 h-5" />
                    </div>
                    {providerType === 'municipal_office' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#B88B2A] bg-white px-2 py-0.5 rounded-full border border-[#B88B2A]">
                        <Check className="w-3 h-3 stroke-[3]" /> Selected
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#153325] mb-1">
                    Municipal Tourism Office
                  </h3>
                  <p className="text-xs text-[#5A534E] leading-relaxed">
                    Register your LGU tourism office and manage local destinations.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Application Form */}
            {providerType ? (
              <div className="p-6 sm:p-8 animate-fadeIn">
                {error && (
                  <div role="alert" className="mb-6 flex items-start gap-2.5 bg-red-50 text-red-800 px-4 py-3 rounded-xl text-xs border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  {/* Section A: Personal Information */}
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#153325] flex items-center gap-2 pb-2 border-b border-[#F3ECE0]">
                      <User className="w-4 h-4 text-[#B88B2A]" />
                      <span>Personal Information</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      {/* Full Legal Name */}
                      <div className="sm:col-span-2">
                        <label htmlFor="pa-fullname" className="block text-xs font-semibold text-[#232120] mb-1">
                          Full Legal Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="pa-fullname"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={inputClasses}
                          placeholder="e.g. Juan De La Cruz"
                        />
                      </div>

                      {/* Email Address */}
                      <div>
                        <label htmlFor="pa-email" className="block text-xs font-semibold text-[#232120] mb-1">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="pa-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={inputClasses}
                          placeholder="juan@example.ph"
                          autoComplete="email"
                        />
                      </div>

                      {/* Mobile Number */}
                      <div>
                        <label htmlFor="pa-phone" className="block text-xs font-semibold text-[#232120] mb-1">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="pa-phone"
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className={inputClasses}
                          placeholder="09XXXXXXXXX"
                          autoComplete="tel"
                          maxLength={11}
                        />
                      </div>

                      {/* Password */}
                      <div>
                        <label htmlFor="pa-password" className="block text-xs font-semibold text-[#232120] mb-1">
                          Account Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            id="pa-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`${inputClasses} pr-10`}
                            placeholder="Minimum 8 characters"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5A534E] hover:text-[#153325] cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label htmlFor="pa-confirm-password" className="block text-xs font-semibold text-[#232120]">
                            Confirm Password <span className="text-red-500">*</span>
                          </label>
                          {passwordsMatch && (
                            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Matched
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            id="pa-confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`${inputClasses} pr-10`}
                            placeholder="Re-enter password"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5A534E] hover:text-[#153325] cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password criteria chips */}
                    <div className="mt-2.5 p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFC8] text-[11px] grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center">
                      <span className={`py-1 rounded ${hasMinLength ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-[#5A534E]'}`}>
                        8+ Chars
                      </span>
                      <span className={`py-1 rounded ${hasUpper ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-[#5A534E]'}`}>
                        Uppercase
                      </span>
                      <span className={`py-1 rounded ${hasLower ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-[#5A534E]'}`}>
                        Lowercase
                      </span>
                      <span className={`py-1 rounded ${hasNumber ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-[#5A534E]'}`}>
                        Number
                      </span>
                      <span className={`py-1 rounded col-span-2 sm:col-span-1 ${hasSpecial ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-[#5A534E]'}`}>
                        Symbol
                      </span>
                    </div>
                  </div>

                  {/* Section B: Provider-Specific Details */}
                  {providerType === 'municipal_office' ? (
                    <div>
                      <h3 className="font-serif text-base font-bold text-[#153325] flex items-center gap-2 pb-2 border-b border-[#F3ECE0]">
                        <Landmark className="w-4 h-4 text-[#B88B2A]" />
                        <span>Municipal Tourism Office Information</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {/* Office Name */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Office / LGU Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={officeName}
                            onChange={(e) => setOfficeName(e.target.value)}
                            className={inputClasses}
                            placeholder="e.g. Municipality of Bangued — Tourism Office"
                          />
                        </div>

                        {/* Municipality */}
                        <div>
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Municipality <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={municipalityId}
                            onChange={(e) => setMunicipalityId(e.target.value)}
                            className={inputClasses}
                          >
                            <option value="">— Select Municipality in Abra —</option>
                            {municipalities.map((m) => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Contact Person Designation */}
                        <div>
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Contact Person &amp; Designation
                          </label>
                          <input
                            type="text"
                            value={contactPersonDesignation}
                            onChange={(e) => setContactPersonDesignation(e.target.value)}
                            className={inputClasses}
                            placeholder="e.g. Juan Cruz — Municipal Tourism Officer"
                          />
                        </div>

                        {/* Office Address */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Office Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={officeAddress}
                            onChange={(e) => setOfficeAddress(e.target.value)}
                            className={inputClasses}
                            placeholder="Municipal Hall, Poblacion, Municipality, Abra"
                          />
                        </div>

                        {/* Office Phone */}
                        <div>
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Office Contact Number
                          </label>
                          <input
                            type="tel"
                            value={officePhone}
                            onChange={(e) => setOfficePhone(e.target.value)}
                            className={inputClasses}
                            placeholder="Same as mobile or landline"
                          />
                        </div>

                        {/* Office Email */}
                        <div>
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Official Office Email
                          </label>
                          <input
                            type="email"
                            value={officeEmail}
                            onChange={(e) => setOfficeEmail(e.target.value)}
                            className={inputClasses}
                            placeholder="tourism@municipality.gov.ph"
                          />
                        </div>
                      </div>
                    </div>
                  ) : providerType === 'homestay' ? (
                    <div>
                      <h3 className="font-serif text-base font-bold text-[#153325] flex items-center gap-2 pb-2 border-b border-[#F3ECE0]">
                        <Building2 className="w-4 h-4 text-[#B88B2A]" />
                        <span>Business & Property Information</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {/* Homestay Name */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Homestay Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={homestayName}
                            onChange={(e) => setHomestayName(e.target.value)}
                            className={inputClasses}
                            placeholder="e.g. Kaparkan Mountain Haven Homestay"
                          />
                        </div>

                        {/* Municipality */}
                        <div>
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Municipality <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={municipalityId}
                            onChange={(e) => setMunicipalityId(e.target.value)}
                            className={inputClasses}
                          >
                            <option value="">— Select Municipality in Abra —</option>
                            {municipalities.map((m) => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Barangay */}
                        <div>
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Barangay
                          </label>
                          <input
                            type="text"
                            value={barangay}
                            onChange={(e) => setBarangay(e.target.value)}
                            className={inputClasses}
                            placeholder="e.g. Poblacion / Alaoa"
                          />
                        </div>

                        {/* Property Address */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Complete Property Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={propertyAddress}
                            onChange={(e) => setPropertyAddress(e.target.value)}
                            className={inputClasses}
                            placeholder="Sitio / Street, Barangay, Municipality, Abra"
                          />
                        </div>

                        {/* Rooms & Capacity */}
                        <div>
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Number of Guest Rooms
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={numberOfRooms}
                            onChange={(e) => setNumberOfRooms(e.target.value)}
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Maximum Guest Capacity
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={maxGuestCapacity}
                            onChange={(e) => setMaxGuestCapacity(e.target.value)}
                            className={inputClasses}
                          />
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Homestay Description
                          </label>
                          <textarea
                            rows="3"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={inputClasses}
                            placeholder="Describe your accommodation, amenities, homecooked meals, and nearby attractions..."
                          />
                        </div>

                        {/* Business Contact Numbers */}
                        <div>
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Business Contact Number
                          </label>
                          <input
                            type="tel"
                            value={businessPhone}
                            onChange={(e) => setBusinessPhone(e.target.value)}
                            className={inputClasses}
                            placeholder="Same as mobile or landline"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Business / Inquiries Email
                          </label>
                          <input
                            type="email"
                            value={businessEmail}
                            onChange={(e) => setBusinessEmail(e.target.value)}
                            className={inputClasses}
                            placeholder="Same as personal or official homestay email"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-serif text-base font-bold text-[#153325] flex items-center gap-2 pb-2 border-b border-[#F3ECE0]">
                        <Compass className="w-4 h-4 text-[#B88B2A]" />
                        <span>Professional Guide Information</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {/* Guide Display Name */}
                        <div>
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Guide / Display Name
                          </label>
                          <input
                            type="text"
                            value={guideName}
                            onChange={(e) => setGuideName(e.target.value)}
                            className={inputClasses}
                            placeholder="e.g. Kuya Juan (Kaparkan Guide)"
                          />
                        </div>

                        {/* License Number */}
                        <div>
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Tour Guide License / Accreditation No. <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={licenseNumber}
                            onChange={(e) => setLicenseNumber(e.target.value)}
                            className={inputClasses}
                            placeholder="DOT-CAR-TG-2026-XXXX"
                          />
                        </div>

                        {/* Municipality Base */}
                        <div>
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Host / Base Municipality <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={municipalityId}
                            onChange={(e) => setMunicipalityId(e.target.value)}
                            className={inputClasses}
                          >
                            <option value="">— Select Municipality in Abra —</option>
                            {municipalities.map((m) => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Years of Experience */}
                        <div>
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Years of Experience
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={yearsOfExperience}
                            onChange={(e) => setYearsOfExperience(e.target.value)}
                            className={inputClasses}
                          />
                        </div>

                        {/* Languages Spoken */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Languages Spoken
                          </label>
                          <input
                            type="text"
                            value={languagesSpoken}
                            onChange={(e) => setLanguagesSpoken(e.target.value)}
                            className={inputClasses}
                            placeholder="English, Tagalog, Ilokano, Itneg"
                          />
                        </div>

                        {/* Areas Covered */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Areas / Municipalities Covered
                          </label>
                          <input
                            type="text"
                            value={areasCovered}
                            onChange={(e) => setAreasCovered(e.target.value)}
                            className={inputClasses}
                            placeholder="e.g. Tineg (Kaparkan Falls), Bangued, Tayum, Tubo Highland Treks"
                          />
                        </div>

                        {/* Specializations */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Specializations
                          </label>
                          <input
                            type="text"
                            value={specializations}
                            onChange={(e) => setSpecializations(e.target.value)}
                            className={inputClasses}
                            placeholder="e.g. Travertine Treks, River Spelunking, Ancestral Weaving, Bird Watching"
                          />
                        </div>

                        {/* Short Biography */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#232120] mb-1">
                            Short Biography & Experience
                          </label>
                          <textarea
                            rows="3"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className={inputClasses}
                            placeholder="Share your guiding history, mountaineering background, and local safety training..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section C: Accreditation & Documents */}
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#153325] flex items-center gap-2 pb-2 border-b border-[#F3ECE0]">
                      <FileText className="w-4 h-4 text-[#B88B2A]" />
                      <span>Documents & Accreditation Proof</span>
                    </h3>
                    <p className="text-xs text-[#5A534E] mt-1 mb-4">
                      Upload clear photo copies or PDF files (max 10MB each) to expedite municipal validation.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Doc 1: Valid Identification */}
                      <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFC8] flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#153325] block mb-1">
                            1. Valid Government ID
                          </span>
                          <p className="text-[11px] text-[#5A534E] leading-tight mb-2">
                            Passport, Driver's License, or PhilID.
                          </p>
                        </div>
                        <label className="block">
                          <span className="text-[10px] font-semibold text-[#153325] bg-white border border-[#DCD5C9] py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer hover:bg-[#FAF7F2] transition-colors truncate">
                            <Upload className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{validIdFile ? validIdFile.name : 'Choose File'}</span>
                          </span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file && file.size > 10 * 1024 * 1024) {
                                setError('Valid ID file must be under 10 MB.');
                                e.target.value = '';
                                return;
                              }
                              setValidIdFile(file || null);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Doc 2: Accreditation Certificate / License */}
                      <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFC8] flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#153325] block mb-1">
                            2. Accreditation Document
                          </span>
                          <p className="text-[11px] text-[#5A534E] leading-tight mb-2">
                            {providerType === 'homestay' ? "DOT Accreditation / Mayor's Permit." : "DOT Guide License / Certificate."}
                          </p>
                        </div>
                        <label className="block">
                          <span className="text-[10px] font-semibold text-[#153325] bg-white border border-[#DCD5C9] py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer hover:bg-[#FAF7F2] transition-colors truncate">
                            <Upload className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{accreditationDocFile ? accreditationDocFile.name : 'Choose File'}</span>
                          </span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file && file.size > 10 * 1024 * 1024) {
                                setError('Accreditation document must be under 10 MB.');
                                e.target.value = '';
                                return;
                              }
                              setAccreditationDocFile(file || null);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Doc 3: Supporting Documents */}
                      <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFC8] flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#153325] block mb-1">
                            3. Supporting Documents
                          </span>
                          <p className="text-[11px] text-[#5A534E] leading-tight mb-2">
                            Barangay clearance, photos, or training cert.
                          </p>
                        </div>
                        <label className="block">
                          <span className="text-[10px] font-semibold text-[#153325] bg-white border border-[#DCD5C9] py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer hover:bg-[#FAF7F2] transition-colors truncate">
                            <Upload className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{supportingDocFile ? supportingDocFile.name : 'Choose File'}</span>
                          </span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file && file.size > 10 * 1024 * 1024) {
                                setError('Supporting document must be under 10 MB.');
                                e.target.value = '';
                                return;
                              }
                              setSupportingDocFile(file || null);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Official Governance Advisory Banner */}
                  <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DFC8] flex items-start gap-3 text-xs text-[#5A534E]">
                    <Shield className="w-5 h-5 text-[#153325] flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Your application will be reviewed by the appropriate tourism office before your provider account is activated.
                      No public listings will be displayed until official accreditation is endorsed by your Municipal Tourism Officer and approved by the Provincial DOT.
                    </p>
                  </div>

                  {/* Primary Application Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 btn-editorial-primary text-xs tracking-wider flex justify-center items-center gap-2 cursor-pointer disabled:opacity-60 shadow-sm"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <span>Submit Accreditation Application</span>
                    )}
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        )}

        {/* Footnote Link to Public Tourist Login */}
        <div className="mt-6 text-center text-xs text-[#5A534E] space-y-2">
          <div>
            Already an accredited provider?{' '}
            <Link to="/portal/login" className="text-[#153325] font-bold hover:text-[#B88B2A] transition-colors">
              Access Official Portal
            </Link>
          </div>
          <div>
            Visiting tourist looking to register?{' '}
            <Link to="/register" className="text-[#153325] font-semibold hover:underline">
              Create Tourist Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderApply;
