content = """import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, CheckCircle2, Search, ArrowUpRight, Phone, Mail, Loader2, Target, Code2, Terminal, X } from 'lucide-react';

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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const response = await fetch("http://localhost:5000/api/leads?user_id=" + user.id);
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

  const markAsQualified = async (leadId: string) => {
    setUpdatingId(leadId);
    try {
      const response = await fetch("http://localhost:5000/api/leads/" + leadId + "/status", {
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
        <button 
          onClick={() => setIsSetupOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-all shadow-sm border border-slate-200/60 dark:border-slate-700"
        >
          <Code2 className="w-4 h-4" /> Setup Instructions
        </button>
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

      {/* Setup Instructions Modal */}
      {isSetupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsSetupOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white dark:bg-[#0c101a] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-white/[0.08] animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsSetupOpen(false)} 
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <Terminal className="w-5 h-5 text-indigo-500" />
                </div>
                API Integration Guide
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
              
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button 
                  onClick={() => setIsSetupOpen(false)} 
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                >
                  I've completed setup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;"""

with open('src/pages/Leads.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
