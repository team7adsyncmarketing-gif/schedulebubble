import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the broken line
broken_line_regex = r'<button onClick=\{\(\) => \{ setActiveTab\(\'leads\'\); setMobileMenuOpen\(false\); \}\} className=\{w-full.*?Transition-all \}>Leads</button>'
# Wait, let's just delete the broken line and rewrite it.
content = re.sub(r'<button onClick=\{\(\) => \{ setActiveTab\(\'leads\'\); setMobileMenuOpen\(false\); \}\} className=\{.*?>Leads</button>\n\s*', '', content)

mobile_search = "<button onClick={() => { setActiveTab('queues'); setMobileMenuOpen(false); }}"
mobile_replace = "<button onClick={() => { setActiveTab('leads'); setMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'leads' ? 'bg-indigo-600/10 text-indigo-500 dark:text-indigo-300 border border-indigo-500/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Leads</button>\n              " + mobile_search

if "setActiveTab('leads'); setMobileMenuOpen(false);" not in content:
    content = content.replace(mobile_search, mobile_replace)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
