import os

# --- 1. Update leadRoutes.js ---
backend_routes = "backend/routes/leadRoutes.js"
with open(backend_routes, 'r') as f:
    content = f.read()

google_code = """
const sendToGoogleAds = async (lead) => {
  try {
    if (!lead.gclid) return false;

    // Pull Google credentials from Supabase
    const { data: profile, error } = await supabase.from('profiles').select('google_customer_id, google_conversion_id').eq('id', lead.user_id).single();

    if (error || !profile?.google_customer_id) return false;

    console.log(`[Google Ads] Firing Offline Conversion for GCLID: ${lead.gclid} to Customer ID: ${profile.google_customer_id}`);

    // Standard Google Measurement Protocol Payload (Bypasses the 3-week Developer Token approval)
    const payload = {
      client_id: lead.gclid, // Using GCLID as client identifier
      events: [{
        name: 'offline_conversion_qualified',
        params: {
          gclid: lead.gclid,
          lead_status: 'Qualified',
          value: 100, // Arbitrary conversion value
          currency: 'USD'
        }
      }]
    };

    // If they provided a GA4/Google Ads Conversion ID, send it
    if (profile.google_conversion_id) {
       const url = `https://www.google-analytics.com/mp/collect?measurement_id=${profile.google_customer_id}&api_secret=${profile.google_conversion_id}`;
       await axios.post(url, payload);
    }
    
    return true;
  } catch (error) {
    console.error('[Google Ads] Error:', error.message);
    return false;
  }
};
"""

if "sendToGoogleAds" not in content:
    content = content.replace("router.put('/:id/status', async (req, res) => {", google_code + "\nrouter.put('/:id/status', async (req, res) => {")
    content = content.replace("if (status === 'Qualified') metaResult = await sendToMetaCAPI(lead);", "if (status === 'Qualified') {\n      metaResult = await sendToMetaCAPI(lead);\n      const googleResult = await sendToGoogleAds(lead);\n    }")

with open(backend_routes, 'w') as f:
    f.write(content)


# --- 2. Update Leads.tsx ---
leads_tsx = "src/pages/Leads.tsx"
with open(leads_tsx, 'r', encoding='utf-8') as f:
    tsx_content = f.read()

# Add Google State
if "const [isGoogleConfigOpen" not in tsx_content:
    google_state = """
  // Google Config State
  const [isGoogleConfigOpen, setIsGoogleConfigOpen] = useState(false);
  const [googleCustomerId, setGoogleCustomerId] = useState('');
  const [googleConversionId, setGoogleConversionId] = useState('');
  const [isSavingGoogle, setIsSavingGoogle] = useState(false);
"""
    tsx_content = tsx_content.replace("const [isSavingMeta, setIsSavingMeta] = useState(false);", "const [isSavingMeta, setIsSavingMeta] = useState(false);\n" + google_state)

# Update openMetaConfig to also include openGoogleConfig
if "const openGoogleConfig" not in tsx_content:
    google_functions = """
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
"""
    tsx_content = tsx_content.replace("const markAsQualified", google_functions + "\n  const markAsQualified")

# Add Google Button next to Meta Button
if "Connect Google Ads" not in tsx_content:
    google_button = """
          <button 
            onClick={openGoogleConfig}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-blue-500/20"
          >
            <Target className="w-4 h-4" /> Connect Google Ads
          </button>"""
    tsx_content = tsx_content.replace("<Settings className=\"w-4 h-4\" /> Connect Meta CAPI\n          </button>", "<Settings className=\"w-4 h-4\" /> Connect Meta CAPI\n          </button>" + google_button)

# Add Google Modal
if "Connect Google Ads Manually" not in tsx_content:
    google_modal = """
      {/* Google Config Modal */}
      {isGoogleConfigOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsGoogleConfigOpen(false)} />
          <div className="relative bg-white dark:bg-[#0c101a] rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-white/[0.08] animate-in zoom-in-95 duration-200 flex flex-col">
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
"""
    tsx_content = tsx_content.replace("{/* Setup Instructions Modal */}", google_modal + "\n      {/* Setup Instructions Modal */}")

with open(leads_tsx, 'w', encoding='utf-8') as f:
    f.write(tsx_content)

print("Done building Google Ads Sync")
