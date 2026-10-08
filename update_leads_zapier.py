leads_tsx = "src/pages/Leads.tsx"
with open(leads_tsx, 'r', encoding='utf-8') as f:
    content = f.read()

# Add the integrationTab state
state_code = """  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [integrationTab, setIntegrationTab] = useState<'website' | 'zapier'>('website');"""
content = content.replace("const [isSetupOpen, setIsSetupOpen] = useState(false);", state_code)

# Replace the entire Setup Instructions Modal
old_modal_start = "{/* Setup Instructions Modal */}"
old_modal_end = "      {/* Setup Instructions Modal */}" # The second one

# I will find the boundaries manually to be safe
start_idx = content.find("{/* Setup Instructions Modal */}")
# Find the end of the modal (it ends right before the final `</div>` of the component)
end_idx = content.find("    </div>\n  );\n};")

if start_idx != -1 and end_idx != -1:
    new_modal = """{/* Setup Instructions Modal */}
      {isSetupOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsSetupOpen(false)} />
          
          <div className="relative bg-white dark:bg-[#0c101a] rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-slate-200 dark:border-white/[0.08] animate-in zoom-in-95 duration-200 flex flex-col">
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
      )}\n"""
    
    content = content[:start_idx] + new_modal + content[end_idx:]

with open(leads_tsx, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated leads with Zapier instructions")
