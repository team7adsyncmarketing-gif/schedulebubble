with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if 'import Leads from' not in content:
    content = content.replace('import Queues from ''./pages/Queues'';', 'import Queues from ''./pages/Queues'';\nimport Leads from ''./pages/Leads'';')

# Add desktop nav pill
if '<NavPill label="Leads"' not in content:
    content = content.replace('<NavPill label="Queues"', '<NavPill label="Leads" active={activeTab === ''leads''} onClick={() => setActiveTab(''leads'')} />\n                  <NavPill label="Queues"')

# Add mobile nav item
if 'setActiveTab(''leads'')' not in content and 'Mobile dropdown' in content:
    content = content.replace('<button onClick={() => { setActiveTab(''queues'');', '<button onClick={() => { setActiveTab(''leads''); setMobileMenuOpen(false); }} className={w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all }>Leads</button>\n              <button onClick={() => { setActiveTab(''queues'');')

# Add component renderer
if '<Leads />' not in content:
    content = content.replace('{activeTab === ''queues'' && <Queues />}', '{activeTab === ''leads'' && <Leads />}\n            {activeTab === ''queues'' && <Queues />}')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
