import React from 'react';
import { Phone, AlertTriangle, Heart, Flame, Shield, Wifi, Droplets, Mountain, CheckCircle2, Info, Compass, ShieldCheck } from 'lucide-react';

const EMERGENCY_CONTACTS = [
  {
    category: 'Police & Security Enforcement',
    icon: Shield,
    contacts: [
      { name: 'Abra Provincial Police Office (PPO)', number: '(074) 752-5001', note: 'Bangued Headquarters' },
      { name: 'National Emergency Hotline', number: '911', note: '24/7 Nationwide Desk' },
      { name: 'Bangued Municipal Police Station', number: '(074) 752-8888', note: 'Capital Town Desk' },
    ],
  },
  {
    category: 'Medical & Emergency Health',
    icon: Heart,
    contacts: [
      { name: 'Abra Provincial Hospital', number: '(074) 752-5044', note: 'Bangued, Abra' },
      { name: 'Philippine Red Cross – CAR Regional Office', number: '(074) 442-5588', note: 'Regional Dispatch' },
      { name: 'DOH CAR Emergency Command Line', number: '(074) 442-7949', note: 'Cordillera Region' },
    ],
  },
  {
    category: 'Fire & Search Rescue',
    icon: Flame,
    contacts: [
      { name: 'Bureau of Fire Protection – Abra HQ', number: '(074) 752-5003', note: 'Bangued Station' },
      { name: 'BFP National Hotline', number: '160', note: 'Emergency Line' },
    ],
  },
  {
    category: 'Disaster Risk & Calamity (PDRRMO)',
    icon: AlertTriangle,
    contacts: [
      { name: 'Abra Provincial Disaster Risk Reduction Office', number: '(074) 752-5060', note: 'Disaster Operations' },
      { name: 'NDRRMC Central Hotline', number: '(02) 8911-1406', note: 'National Desk' },
      { name: 'Office of Civil Defense CAR', number: '(074) 300-0446', note: 'Regional Operations' },
    ],
  },
];

const TRAVEL_TIPS = [
  {
    icon: Mountain,
    title: 'Highland Treks & Eco-Sites',
    tips: [
      'Always hire an accredited local guide — terrain in Tineg, Tubo, and Lacub involves river crossings and steep ridgelines.',
      'Register your party at the municipal tourism desk or barangay hall prior to ascending mountain trails.',
      'Carry minimum 2 liters of potable water per traveler for full-day wilderness expeditions.',
      'Wear sturdy hiking boots or grippy aqua shoes; Kaparkan travertine limestone is slippery when wet.',
      'Strict Leave No Trace policy — carry out all food containers and protect ancestral land ecology.',
    ],
  },
  {
    icon: Wifi,
    title: 'Connectivity & Offline Preparedness',
    tips: [
      'Cellular data is limited in remote highlands beyond municipality town centers.',
      'Download offline navigation maps and essential contact cards prior to departing Bangued.',
      'Brief your homestay host or local barangay officer on your daily trail itinerary and expected return time.',
      'Central Bangued, Tayum, and Bucay town squares offer stable telecommunication coverage.',
    ],
  },
  {
    icon: Droplets,
    title: 'Health, Gear & Weather Advisories',
    tips: [
      'Bring personal prescription medication — regional pharmacies are clustered mainly in Bangued.',
      'Apply eco-safe insect repellent and biodegradable sunblock to protect natural river habitats.',
      'Review weather bulletins — rivers and waterfalls swell rapidly during monsoons (June to October).',
      'Respect ancestral Itneg (Tingguian) customs; request permission prior to photographing sacred rituals.',
    ],
  },
  {
    icon: CheckCircle2,
    title: 'Accreditation & Booking Protocols',
    tips: [
      'Book verified homestays through ABRAVENTURE for municipal-vetted safety standards and fair rates.',
      'Keep digital copies of booking vouchers and guide accreditation IDs saved on your mobile device.',
      'Present valid government identification at municipal tourism checkpoints.',
      'Respect community quiet hours and local house traditions in rural barangays.',
    ],
  },
];

const TravelTips = () => {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#232120]">
      {/* ── Editorial Hero Banner ── */}
      <div className="bg-[#153325] text-white pt-16 pb-20 relative overflow-hidden border-b border-[#E8DFC8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#B88B2A] font-semibold block mb-3">
            PROVINCIAL TRAVEL ADVICE & SAFETY PROTOCOLS
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4 tracking-tight leading-tight">
            Travel Guidelines & Emergency Desk
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Essential field advisories, cultural etiquette, and emergency dispatch contact numbers for a safe, respectful, and fulfilling expedition across Abra.
          </p>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">

        {/* Official Safety Notice */}
        <div className="bg-white border border-[#B88B2A]/40 rounded-2xl p-6 mb-12 flex items-start gap-4 shadow-2xs">
          <div className="p-3 rounded-xl bg-[#FAF7F2] text-[#B88B2A] border border-[#E8DFC8] flex-shrink-0">
            <AlertTriangle className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-[#153325] text-base">Provincial Highland Travel Advisory</h2>
            <p className="text-[#5A534E] text-xs sm:text-sm mt-1 leading-relaxed">
              Abra features rugged Cordillera mountain ranges with sparse mobile signal in remote interior barangays. Always trek with an accredited local tour guide, register at the municipal tourism desk upon arrival, and inform your homestay host of your day schedule.
            </p>
          </div>
        </div>

        {/* Travel Guidelines Grid */}
        <div className="mb-14">
          <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#E8DFC8]">
            <h2 className="font-serif text-2xl font-bold text-[#153325] flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#B88B2A]" /> Expedition Guidelines & Etiquette
            </h2>
            <span className="text-xs text-[#5A534E] uppercase tracking-wider font-semibold">Official Code of Conduct</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TRAVEL_TIPS.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.title}
                  className="bg-white rounded-2xl border border-[#E8DFC8] shadow-2xs p-6 hover:border-[#153325] transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFC8] text-[#153325]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif font-bold text-[#153325] text-base">{section.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {section.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-[#5A534E] leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-[#B88B2A] flex-shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Emergency Contacts Section */}
        <div>
          <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#E8DFC8]">
            <h2 className="font-serif text-2xl font-bold text-[#153325] flex items-center gap-2">
              <Phone className="w-5 h-5 text-[#B88B2A]" /> Emergency & Disaster Response Hotlines
            </h2>
            <span className="text-xs text-[#5A534E] uppercase tracking-wider font-semibold">24/7 Provincial Dispatch</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {EMERGENCY_CONTACTS.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.category} className="bg-white rounded-2xl border border-[#E8DFC8] shadow-2xs overflow-hidden flex flex-col">
                  <div className="px-6 py-4 flex items-center gap-3 border-b border-[#F3ECE0] bg-[#FAF7F2]">
                    <Icon className="w-5 h-5 text-[#153325]" />
                    <h3 className="font-serif font-bold text-sm text-[#153325]">{section.category}</h3>
                  </div>
                  <div className="divide-y divide-[#F3ECE0]">
                    {section.contacts.map((c, i) => (
                      <div key={i} className="px-6 py-3.5 flex items-center justify-between hover:bg-[#FAF7F2]/50 transition-colors">
                        <div>
                          <p className="font-serif font-bold text-[#153325] text-xs">{c.name}</p>
                          {c.note && <p className="text-[#5A534E] text-[10px] mt-0.5">{c.note}</p>}
                        </div>
                        <a
                          href={`tel:${c.number.replace(/[^0-9+]/g, '')}`}
                          className="btn-editorial-primary px-3 py-1.5 text-xs tracking-wider flex items-center gap-1.5 shadow-2xs"
                        >
                          <Phone className="w-3 h-3 text-[#B88B2A]" />
                          {c.number}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Government Safety Standards Banner */}
        <div className="mt-12 rounded-2xl p-8 text-center bg-[#153325] text-white border border-[#1D4433] shadow-sm">
          <div className="max-w-xl mx-auto">
            <ShieldCheck className="w-10 h-10 text-[#B88B2A] mx-auto mb-3" />
            <h3 className="font-serif font-bold text-white text-xl mb-2">Government-Backed Tourism Standards</h3>
            <p className="text-white/80 text-xs sm:text-sm leading-relaxed mb-4">
              ABRAVENTURE operates in direct alignment with the Provincial Tourism Office of Abra and Municipal Tourism Desks. For tour verification, guide inquiries, or immediate municipal assistance, visit your host municipal town hall.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TravelTips;
