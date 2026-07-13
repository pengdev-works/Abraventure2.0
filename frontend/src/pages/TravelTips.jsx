import React from 'react';
import { Phone, AlertTriangle, Heart, Flame, Shield, Wifi, Droplets, Mountain, CheckCircle, Info } from 'lucide-react';

const EMERGENCY_CONTACTS = [
  {
    category: 'Police & Security',
    icon: Shield,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    contacts: [
      { name: 'Abra Provincial Police Office (PPO)', number: '(074) 752-5001', note: 'Bangued, Abra' },
      { name: 'National Emergency Hotline', number: '911', note: 'Nationwide' },
      { name: 'Bangued Police Station', number: '(074) 752-8888', note: 'Capital town' },
    ],
  },
  {
    category: 'Medical & Health',
    icon: Heart,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-100',
    contacts: [
      { name: 'Abra General Hospital', number: '(074) 752-5044', note: 'Bangued, Abra' },
      { name: 'Philippine Red Cross – CAR', number: '(074) 442-5588', note: 'Baguio City' },
      { name: 'DOH CAR Emergency', number: '(074) 442-7949', note: '' },
    ],
  },
  {
    category: 'Fire & Rescue',
    icon: Flame,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    contacts: [
      { name: 'Bureau of Fire Protection – Abra', number: '(074) 752-5003', note: 'Bangued HQ' },
      { name: 'BFP National Emergency', number: '160', note: 'Nationwide' },
    ],
  },
  {
    category: 'Disaster & Calamity',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    contacts: [
      { name: 'Abra PDRRMO', number: '(074) 752-5060', note: 'Provincial Disaster Risk Reduction' },
      { name: 'NDRRMC Hotline', number: '(02) 8911-1406', note: 'National' },
      { name: 'OCD CAR', number: '(074) 300-0446', note: 'Office of Civil Defense' },
    ],
  },
];

const TRAVEL_TIPS = [
  {
    icon: Mountain,
    title: 'Trekking & Eco-Sites',
    tips: [
      'Always hire an accredited local guide — terrain can be unpredictable.',
      'Register your trek at the nearest Barangay Hall before departure.',
      'Bring at least 2 liters of water per person for full-day treks.',
      'Wear proper footwear; Kaparkan Falls and Lapat Falls have slippery trails.',
      'Leave no trace — pack out all your waste.',
    ],
  },
  {
    icon: Wifi,
    title: 'Connectivity & Communications',
    tips: [
      'Mobile signal is weak or absent in remote barangays like Tineg and Tubo.',
      'Download offline maps (Google Maps, Maps.me) before your trip.',
      'Inform someone of your itinerary and expected return time.',
      'DITO and Globe have the widest coverage in Abra mountains.',
    ],
  },
  {
    icon: Droplets,
    title: 'Health & Safety',
    tips: [
      'Bring personal medications — pharmacies are scarce outside Bangued.',
      'Wear sunscreen and insect repellent for outdoor activities.',
      'Boil or filter water from mountain springs before drinking.',
      'Check weather forecasts — flash floods can occur during rainy season (Jun–Oct).',
      'Respect local customs and ask permission before photographing community rituals.',
    ],
  },
  {
    icon: CheckCircle,
    title: 'Booking & Documentation',
    tips: [
      'Book verified homestays through ABRAVENTURE for accredited accommodations only.',
      'Keep your booking confirmation and tour guide contact numbers offline.',
      'Bring a valid government ID — some sites require visitor registration.',
      'Respect check-in/out times and house rules of your homestay.',
    ],
  },
];

const TravelTips = () => {
  return (
    <div className="relative">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(150deg, #0a2526 0%, #0F3D3E 50%, #1a3a6e 100%)', minHeight: '300px' }}>
        <div className="absolute inset-0 bg-woven-dark opacity-40" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/15 text-white/90 text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full mb-6">
            <Info className="w-4 h-4 text-amber-400" />
            Safety First · Province of Abra
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Travel Tips & <span className="text-amber-400">Emergency Contacts</span>
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Stay safe and prepared as you explore the beautiful highlands and heritage sites of Abra.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full"><path d="M0 60L1440 60V30C1200 50 960 60 720 55C480 50 240 40 0 60Z" fill="#f8fafc"/></svg>
        </div>
      </div>

      <div className="bg-slate-50 -mt-1 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* Alert banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-10 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 text-sm">Important Safety Notice</p>
              <p className="text-amber-800 text-xs mt-1 leading-relaxed">
                Abra has mountainous terrain with limited infrastructure in remote areas. Always plan ahead, travel with a registered guide, and inform your homestay or a trusted contact of your daily plans.
              </p>
            </div>
          </div>

          {/* Travel Tips Grid */}
          <h2 className="text-2xl font-extrabold text-emerald-900 mb-6">📋 Travel Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
            {TRAVEL_TIPS.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-sm">{section.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {section.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Emergency Contacts */}
          <h2 className="text-2xl font-extrabold text-emerald-900 mb-6">📞 Emergency Contacts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {EMERGENCY_CONTACTS.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.category} className={`bg-white rounded-2xl border ${section.border} shadow-sm overflow-hidden`}>
                  <div className={`${section.bg} px-6 py-4 flex items-center gap-3 border-b ${section.border}`}>
                    <Icon className={`w-5 h-5 ${section.color}`} />
                    <h3 className={`font-extrabold text-sm ${section.color}`}>{section.category}</h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {section.contacts.map((c, i) => (
                      <div key={i} className="px-6 py-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800 text-xs">{c.name}</p>
                          {c.note && <p className="text-slate-400 text-[10px] mt-0.5">{c.note}</p>}
                        </div>
                        <a href={`tel:${c.number}`} className="flex items-center gap-1.5 bg-emerald-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors">
                          <Phone className="w-3 h-3" />
                          {c.number}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom note */}
          <div className="mt-10 bg-emerald-900 text-white rounded-2xl p-6 text-center">
            <p className="font-extrabold text-lg mb-2">🛡️ Your Safety is Our Priority</p>
            <p className="text-white/70 text-sm max-w-xl mx-auto">
              ABRAVENTURE partners with the Provincial Tourism Office of Abra to ensure all verified listings maintain safety standards. For complaints or urgent concerns, contact us through your Municipal Tourism Office.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelTips;
