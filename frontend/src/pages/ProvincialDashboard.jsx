import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Landmark, ShieldCheck, Star, Users, Home, Award, Calendar, AlertCircle, FileText, CheckCircle, BarChart3 } from 'lucide-react';

const ProvincialDashboard = () => {
  const { token, user } = useAuth();
  
  const [data, setData] = useState({ homestays: [], guides: [], municipalAdmins: [] });
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('accounts');
  const [remarks, setRemarks] = useState('');
  const [inquiries, setInquiries] = useState([]);

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/listings/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const resData = await response.json();
        setData(resData);
      }
      
      // Also fetch inquiries for analytics
      const inqResponse = await fetch('/api/inquiries', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (inqResponse.ok) {
        const inqData = await inqResponse.json();
        setInquiries(inqData);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleApprove = async (id, type, status) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/listings/approve/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, status, remarks: remarks || 'Processed by Provincial DOT' })
      });

      if (response.ok) {
        setRemarks('');
        await fetchDashboardData();
      } else {
        const err = await response.json();
        alert(err.message || 'Action failed.');
      }
    } catch (err) {
      console.error('Error in approval action:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 min-h-[calc(100vh-16rem)]">
        <div className="w-12 h-12 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Analytics counts
  const totalHomestays = data.homestays.length;
  const approvedHomestays = data.homestays.filter(h => h.status === 'APPROVED').length;
  const totalGuides = data.guides.length;
  const approvedGuides = data.guides.filter(g => g.status === 'APPROVED').length;
  const pendingMunAdmins = data.municipalAdmins.filter(m => m.status === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4.5 h-4.5 text-amber-500 fill-amber-500" /> Provincial Office Portal
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800">Provincial DOT Admin Control Panel</h1>
        <p className="text-xs text-slate-450 mt-1">Verify local listings, approve municipal accounts, and monitor Abra tourism metrics.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Approved Homestays</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{approvedHomestays} / {totalHomestays}</h3>
          </div>
          <div className="bg-emerald-50 text-emerald-900 p-3.5 rounded-xl">
            <Home className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Approved Guides</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{approvedGuides} / {totalGuides}</h3>
          </div>
          <div className="bg-emerald-50 text-emerald-900 p-3.5 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pending Mun DOTs</span>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingMunAdmins}</h3>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3.5 rounded-xl">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tourist Inquiries</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{inquiries.length}</h3>
          </div>
          <div className="bg-emerald-50 text-emerald-900 p-3.5 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-t-2xl shadow-sm mb-6 flex px-6 space-x-6 overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: 'accounts', label: 'Municipal Accounts Request', icon: Landmark },
          { id: 'listings', label: 'Stakeholders Review List', icon: FileText },
          { id: 'analytics', label: 'Tourism Analytics', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setRemarks('');
              }}
              className={`py-4 px-1 border-b-2 font-bold text-sm cursor-pointer transition-all flex items-center gap-2 flex-shrink-0 ${
                activeTab === tab.id
                  ? 'border-emerald-900 text-emerald-950'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Remarks text area for approvals */}
      {activeTab !== 'analytics' && (
        <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-xl mb-6">
          <label className="block text-xs font-bold text-slate-700 mb-1">Approval/Rejection Comments (Remarks)</label>
          <input
            type="text"
            placeholder="Type reason or audit comments here before approving or rejecting..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-900"
          />
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-white border border-slate-200 rounded-b-2xl shadow-sm p-6">
        
        {/* Accounts Tab */}
        {activeTab === 'accounts' && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Municipal DOT Registrations</h2>
            {data.municipalAdmins.length === 0 ? (
              <p className="text-slate-450 text-xs py-8 text-center">No Municipal DOT registration requests found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-bold bg-slate-50/55">
                      <th className="py-3 px-4">Municipality</th>
                      <th className="py-3 px-4">Full Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.municipalAdmins.map((adm) => (
                      <tr key={adm.id} className="border-b border-slate-100 hover:bg-slate-50/40 text-xs text-slate-600">
                        <td className="py-3.5 px-4 font-bold text-emerald-950">{adm.municipality_name}</td>
                        <td className="py-3.5 px-4 font-semibold">{adm.full_name}</td>
                        <td className="py-3.5 px-4">{adm.email}</td>
                        <td className="py-3.5 px-4">{adm.phone_number}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] tracking-wide uppercase ${
                            adm.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            adm.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {adm.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 flex justify-center gap-2">
                          {adm.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(adm.id, 'MUNICIPAL_DOT', 'APPROVED')}
                                className="px-3 py-1 bg-emerald-900 hover:bg-emerald-800 text-white rounded font-bold hover:shadow"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApprove(adm.id, 'MUNICIPAL_DOT', 'REJECTED')}
                                className="px-3 py-1 bg-red-650 hover:bg-red-700 text-white rounded font-bold hover:shadow"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {adm.status !== 'PENDING' && <span className="text-slate-400 italic">No actions</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <div className="space-y-8">
            {/* Homestays Section */}
            <div>
              <h3 className="font-extrabold text-emerald-950 text-base mb-4 border-b border-slate-100 pb-2">Homestay Verification Audits</h3>
              {data.homestays.length === 0 ? (
                <p className="text-slate-450 text-xs py-4 text-center">No homestays registered.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-bold bg-slate-50/55">
                        <th className="py-3 px-4">Homestay Name</th>
                        <th className="py-3 px-4">Owner Name</th>
                        <th className="py-3 px-4">Municipality</th>
                        <th className="py-3 px-4">Submitted Docs</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.homestays.map((h) => {
                        const endorsedDocsCount = h.documents.filter(d => d.status === 'ENDORSED').length;
                        const totalDocsCount = h.documents.length;
                        
                        return (
                          <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50/40 text-xs text-slate-600">
                            <td className="py-3.5 px-4 font-bold text-slate-800">{h.name}</td>
                            <td className="py-3.5 px-4">{h.owner_name}</td>
                            <td className="py-3.5 px-4">{h.municipality_name}</td>
                            <td className="py-3.5 px-4 font-medium text-emerald-950">
                              {endorsedDocsCount} / {totalDocsCount} Endorsed
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] tracking-wide uppercase ${
                                h.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                h.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {h.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 flex justify-center gap-2">
                              {h.status !== 'APPROVED' && (
                                <button
                                  onClick={() => handleApprove(h.id, 'HOMESTAY', 'APPROVED')}
                                  className="px-3 py-1 bg-emerald-900 hover:bg-emerald-800 text-white rounded font-bold hover:shadow"
                                >
                                  Approve
                                </button>
                              )}
                              {h.status !== 'REJECTED' && (
                                <button
                                  onClick={() => handleApprove(h.id, 'HOMESTAY', 'REJECTED')}
                                  className="px-3 py-1 bg-red-650 hover:bg-red-700 text-white rounded font-bold hover:shadow"
                                >
                                  Reject
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Tour Guides Section */}
            <div>
              <h3 className="font-extrabold text-emerald-950 text-base mb-4 border-b border-slate-100 pb-2">Tour Guide Verification Audits</h3>
              {data.guides.length === 0 ? (
                <p className="text-slate-450 text-xs py-4 text-center">No tour guides registered.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-bold bg-slate-50/55">
                        <th className="py-3 px-4">Guide Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Municipality</th>
                        <th className="py-3 px-4">Submitted Docs</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.guides.map((g) => {
                        const endorsedDocsCount = g.documents.filter(d => d.status === 'ENDORSED').length;
                        const totalDocsCount = g.documents.length;
                        
                        return (
                          <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50/40 text-xs text-slate-600">
                            <td className="py-3.5 px-4 font-bold text-slate-800">{g.guide_name}</td>
                            <td className="py-3.5 px-4">{g.email}</td>
                            <td className="py-3.5 px-4">{g.municipality_name}</td>
                            <td className="py-3.5 px-4 font-medium text-emerald-950">
                              {endorsedDocsCount} / {totalDocsCount} Endorsed
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] tracking-wide uppercase ${
                                g.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                g.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {g.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 flex justify-center gap-2">
                              {g.status !== 'APPROVED' && (
                                <button
                                  onClick={() => handleApprove(g.id, 'GUIDE', 'APPROVED')}
                                  className="px-3 py-1 bg-emerald-900 hover:bg-emerald-800 text-white rounded font-bold hover:shadow"
                                >
                                  Approve
                                </button>
                              )}
                              {g.status !== 'REJECTED' && (
                                <button
                                  onClick={() => handleApprove(g.id, 'GUIDE', 'REJECTED')}
                                  className="px-3 py-1 bg-red-650 hover:bg-red-700 text-white rounded font-bold hover:shadow"
                                >
                                  Reject
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Province-Wide Performance Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box 1: Accreditation Completion Rates */}
              <div className="p-6 rounded-2xl border border-slate-100 shadow-sm bg-slate-50">
                <h4 className="font-bold text-slate-800 text-sm mb-4">Accreditation Completion Rates</h4>
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-slate-700">
                      <span>Homestay approval rate</span>
                      <span>{totalHomestays > 0 ? Math.round((approvedHomestays / totalHomestays) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-900 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${totalHomestays > 0 ? (approvedHomestays / totalHomestays) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-slate-700">
                      <span>Tour guide approval rate</span>
                      <span>{totalGuides > 0 ? Math.round((approvedGuides / totalGuides) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-900 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${totalGuides > 0 ? (approvedGuides / totalGuides) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: Total Inquiry Distribution */}
              <div className="p-6 rounded-2xl border border-slate-100 shadow-sm bg-slate-50">
                <h4 className="font-bold text-slate-800 text-sm mb-3">Recent Booking Inquiries Activity</h4>
                {inquiries.length === 0 ? (
                  <p className="text-slate-400 text-xs py-4 text-center">No inquiry transactions recorded.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {inquiries.slice(0, 5).map((inq) => (
                      <div key={inq.id} className="p-3 bg-white border border-slate-100 rounded-xl text-xs flex justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-800">{inq.tourist_name}</p>
                          <p className="text-slate-400 text-[10px]">
                            {inq.homestay_name ? `Homestay: ${inq.homestay_name}` : `Guide: ${inq.guide_name}`}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] h-fit ${
                          inq.status === 'CONFIRMED' || inq.status === 'RESPONDED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inq.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProvincialDashboard;
