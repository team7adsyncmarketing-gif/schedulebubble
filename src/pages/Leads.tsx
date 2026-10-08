import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, CheckCircle2, Search, ArrowUpRight, Phone, Mail, Loader2, Target, Code2, Terminal, X, Settings } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  source: string;
}

const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [integrationTab, setIntegrationTab] = useState<'website' | 'zapier'>('website');
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: '', type: 'success'});

  const [user, setUser] = useState<any>(null);

  const [isMetaConfigOpen, setIsMetaConfigOpen] = useState(false);
  const [pixelId, setPixelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  // Google Config State
  const [isGoogleConfigOpen, setIsGoogleConfigOpen] = useState(false);
  const [googleCustomerId, setGoogleCustomerId] = useState('');
  const [googleConversionId, setGoogleConversionId] = useState('');
  const [isSavingGoogle, setIsSavingGoogle] = useState(false);


  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const response = await fetch("https://schedulebubble.onrender.com/api/leads?user_id=" + user.id);
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const openMetaConfig = async () => {
    setIsMetaConfigOpen(true);
    if (user) {
       const { data } = await supabase.from('profiles').select('meta_pixel_id, meta_access_token').eq('id', user.id).single();
       if (data) {
          setPixelId(data.meta_pixel_id || '');
          setAccessToken(data.meta_access_token || '');
       }
    }
  };

  const saveMetaConfig = async () => {
    if (!user) return;
    setIsSavingMeta(true);
    try {
      const { error } = await supabase.from('profiles').update({
        meta_pixel_id: pixelId,
        meta_access_token: accessToken
      }).eq('id', user.id);
      
      if (error) throw error;
      setIsMetaConfigOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingMeta(false);
    }
  };

  
  const openGoogleConfig = async () => {
    setIsGoogleConfigOpen(true);
    if (user) {
       const { data } = await supabase.from('profiles').select('google_customer_id, google_conversion_id').eq('id', user.id).single();
       if (data) {
          setGoogleCustomerId(data.google_customer_id || '');
          setGoogleConversionId(data.google_conversion_id || '');
       }
    }
  };

  const saveGoogleConfig = async () => {
    if (!user) return;
    setIsSavingGoogle(true);
    try {
      const { error } = await supabase.from('profiles').update({
        google_customer_id: googleCustomerId,
        google_conversion_id: googleConversionId
      }).eq('id', user.id);
      
      if (error) throw error;
      setIsGoogleConfigOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingGoogle(false);
    }
  };


  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({show: true, message, type});
    setTimeout(() => setToast({show: false, message: '', type: 'success'}), 4000);
  };

  const markAsQualified = async (leadId: string) => {
    setUpdatingId(leadId);
    try {
      const response = await fetch("https://schedulebubble.onrender.com/api/leads/" + leadId + "/status", {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Qualified' }),
      });
      
      if (response.ok) {
        const { meta_capi_fired } = await response.json();
        setLeads(leads.map(l => l.id === leadId ? { ...l, status: 'Qualified' } : l));
        
        if (meta_capi_fired) {
          console.log("Successfully synced to Meta CAPI!");
        }
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <Users className="w-7 h-7 text-indigo-500" />
            </div>
            Lead Engine
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Manage your incoming leads and sync qualified conversions back to Meta to optimize your ad spend.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={openMetaConfig}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-indigo-500/20"
          >
            <Settings className="w-4 h-4" /> Connect Meta CAPI
          </button>
          <button 
            onClick={openGoogleConfig}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-blue-500/20"
          >
            <Target className="w-4 h-4" /> Connect Google Ads
          </button>
          <button 
            onClick={() => setIsSetupOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-all shadow-sm border border-slate-200/60 dark:border-slate-700"
          >
            <Code2 className="w-4 h-4" /> Setup Instructions
          </button>
        </div>
      </div>

      <div className="bg-white/60 dark:bg-[#0c101a]/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
        <div className="p-5 border-b border-slate-200/60 dark:border-white/[0.08] flex items-center justify-between">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-semibold">
              <Target className="w-3.5 h-3.5" /> Meta CAPI Ready
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200/60 dark:border-white/[0.08]">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Code2 className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No leads captured yet</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">
                        Install your tracking snippet on your website to automatically capture and sync leads here.
                      </p>
                      <button 
                        onClick={() => setIsSetupOpen(true)}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25"
                      >
                        View Installation Guide
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{lead.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{new Date(lead.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-400" /> {lead.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {lead.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {lead.source || 'Website Form'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {lead.status === 'Qualified' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Qualified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" /> New
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {lead.status !== 'Qualified' && (
                        <button
                          onClick={() => markAsQualified(lead.id)}
                          disabled={updatingId === lead.id}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
                        >
                          {updatingId === lead.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                          Qualify & Sync
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Meta Config Modal */}
      {isMetaConfigOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center p-4 pt-16 sm:pt-24 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsMetaConfigOpen(false)} />
          <div className="relative bg-white dark:bg-[#0c101a] rounded-3xl shadow-2xl w-full max-w-md  border border-slate-200 dark:border-white/[0.08] animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Connect Meta Manually</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Conversions API Access Token</label>
                  <input 
                    type="password" 
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white"
                    placeholder="EAAI..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meta Pixel ID (Dataset ID)</label>
                  <input 
                    type="text" 
                    value={pixelId}
                    onChange={(e) => setPixelId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white"
                    placeholder="123456789..."
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button 
                  onClick={() => setIsMetaConfigOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveMetaConfig}
                  disabled={isSavingMeta}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  {isSavingMeta && <Loader2 className="w-4 h-4 animate-spin" />}
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {/* Google Config Modal */}
      {isGoogleConfigOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center p-4 pt-16 sm:pt-24 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsGoogleConfigOpen(false)} />
          <div className="relative bg-white dark:bg-[#0c101a] rounded-3xl shadow-2xl w-full max-w-md  border border-slate-200 dark:border-white/[0.08] animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Connect Google Ads</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Google Ads / GA4 Measurement ID</label>
                  <input 
                    type="text" 
                    value={googleCustomerId}
                    onChange={(e) => setGoogleCustomerId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white"
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API Secret Key</label>
                  <input 
                    type="password" 
                    value={googleConversionId}
                    onChange={(e) => setGoogleConversionId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white"
                    placeholder="Secret Key..."
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button 
                  onClick={() => setIsGoogleConfigOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveGoogleConfig}
                  disabled={isSavingGoogle}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  {isSavingGoogle && <Loader2 className="w-4 h-4 animate-spin" />}
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Setup Instructions Modal */}
      {isSetupOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center p-4 pt-16 sm:pt-24 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsSetupOpen(false)} />
          
          <div className="relative bg-white dark:bg-[#0c101a] rounded-3xl shadow-2xl w-full max-w-3xl  border border-slate-200 dark:border-white/[0.08] animate-in zoom-in-95 duration-200 flex flex-col">
            <button 
              onClick={() => setIsSetupOpen(false)} 
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 transition-colors z-10 bg-white/50 dark:bg-black/50 backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setIntegrationTab('website')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${integrationTab === 'website' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Website Forms (HTML)
              </button>
              <button 
                onClick={() => setIntegrationTab('zapier')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${integrationTab === 'zapier' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Meta Instant Forms (Zapier)
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto">
              
              {integrationTab === 'website' && (
                <div className="animate-in fade-in duration-300">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-2 pr-8">
                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                      <Terminal className="w-5 h-5 text-indigo-500" />
                    </div>
                    Website Integration Guide
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Follow these two simple steps to integrate your website forms with the Lead Engine. Your Account ID is already pre-filled.
                  </p>
                  
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs">1</span> 
                        Add Base Script
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                        Place this script anywhere inside the <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">{"<head>"}</code> tag of your website.
                      </p>
                      <div className="bg-slate-900 dark:bg-black rounded-xl p-4 font-mono text-xs sm:text-sm text-green-400 overflow-x-auto shadow-inner border border-white/10">
                        <pre>{'<script src="https://schedulebubble.com/tracker.js"></script>'}</pre>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs">2</span> 
                        Capture Lead Data
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                        Trigger this Javascript function exactly when a user successfully submits your contact form.
                      </p>
                      <div className="bg-slate-900 dark:bg-black rounded-xl p-4 font-mono text-xs sm:text-sm text-sky-400 overflow-x-auto shadow-inner border border-white/10">
                        <pre>
{`ScheduleBubble.captureLead({
    user_id: "${user?.id || 'YOUR_USER_ID_HERE'}",
    name: "John Doe",
    email: "john@example.com",
    phone: "1234567890",
    source: "Website Contact Form"
});`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {integrationTab === 'zapier' && (
                <div className="animate-in fade-in duration-300">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-2 pr-8">
                    <div className="p-2 bg-orange-500/10 rounded-xl">
                      <Target className="w-5 h-5 text-orange-500" />
                    </div>
                    Zapier Webhook Guide
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Use this guide to connect Facebook Lead Ads (Instant Forms) to ScheduleBubble without touching any website code.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-2">
                        Step 1: The Zapier Trigger
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Create a Zap with <strong>"Facebook Lead Ads"</strong> as the App and <strong>"New Lead"</strong> as the Event. Select your specific form.
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-2">
                        Step 2: The Action Settings
                      </h3>
                      <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2 list-disc list-inside mb-4">
                        <li><strong>App:</strong> Webhooks by Zapier</li>
                        <li><strong>Event:</strong> Custom Request (POST)</li>
                        <li><strong>URL:</strong> <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded text-slate-700 dark:text-slate-300">https://schedulebubble.onrender.com/api/leads</code></li>
                        <li><strong>Headers:</strong> Content-Type: application/json</li>
                      </ul>
                      
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase">Data Payload (JSON)</h4>
                      <div className="bg-slate-900 dark:bg-black rounded-xl p-4 font-mono text-xs sm:text-sm text-orange-400 overflow-x-auto shadow-inner border border-white/10">
                        <pre>
{`{
  "user_id": "${user?.id || 'YOUR_USER_ID_HERE'}",
  "name": "Map Zapier Full Name here",
  "email": "Map Zapier Email here",
  "phone": "Map Zapier Phone here",
  "source": "Meta Instant Form"
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button 
                  onClick={() => setIsSetupOpen(false)} 
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                >
                  Close Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;