leads_tsx = "src/pages/Leads.tsx"
with open(leads_tsx, 'r', encoding='utf-8') as f:
    content = f.read()

# Add a toast notification state
state_code = """  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [integrationTab, setIntegrationTab] = useState<'website' | 'zapier'>('website');
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: '', type: 'success'});
"""
content = content.replace("  const [isSetupOpen, setIsSetupOpen] = useState(false);\n  const [integrationTab, setIntegrationTab] = useState<'website' | 'zapier'>('website');", state_code)

# Function to show toast
toast_func = """
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({show: true, message, type});
    setTimeout(() => setToast({show: false, message: '', type: 'success'}), 4000);
  };

  const markAsQualified"""
content = content.replace("  const markAsQualified", toast_func)

# Update markAsQualified to use the toast and read meta_capi_fired
old_qualified = """      if (response.ok) {
        fetchLeads();
      }"""
new_qualified = """      if (response.ok) {
        fetchLeads();
        if (data.meta_capi_fired) {
           showToast("Success! Lead data securely synced to Meta Conversions API ??", 'success');
        } else if (data.googleResult) {
           showToast("Success! Lead data synced to Google Ads API ??", 'success');
        } else {
           showToast("Lead Qualified (No API sync was configured or matched)", 'error');
        }
      }"""
if "fetchLeads();\n      }" in content:
    content = content.replace(old_qualified, new_qualified)

# Add Toast UI to the top of the render
toast_ui = """
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-top-10 fade-in duration-300 font-medium text-sm border ${toast.type === 'success' ? 'bg-green-500/10 text-green-700 border-green-500/20 backdrop-blur-md' : 'bg-slate-800 text-white border-slate-700'}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}"""
content = content.replace("      {/* Header */}", toast_ui)

with open(leads_tsx, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added UI Feedback Toast for Meta CAPI")
