with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add the render component
if '{activeTab === \'leads\' && <Leads />}' not in content:
    content = content.replace('{activeTab === \'dashboard\' && <Dashboard />}', '{activeTab === \'dashboard\' && <Dashboard />}\n            {activeTab === \'leads\' && <Leads />}')

# Add mobile button
mobile_search = "<button onClick={() => { setActiveTab('queues'); setMobileMenuOpen(false); }}"
mobile_replace = "<button onClick={() => { setActiveTab('leads'); setMobileMenuOpen(false); }} className={w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all }>Leads</button>\n              " + mobile_search

if "setActiveTab('leads'); setMobileMenuOpen(false);" not in content:
    content = content.replace(mobile_search, mobile_replace)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
