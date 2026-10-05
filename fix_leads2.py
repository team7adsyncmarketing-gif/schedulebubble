with open('src/App.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("active={activeTab === leads}", "active={activeTab === 'leads'}")
c = c.replace("onClick={() => setActiveTab(leads)}", "onClick={() => setActiveTab('leads')}")
c = c.replace('{activeTab === leads && <Leads />}', "{activeTab === 'leads' && <Leads />}")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('Done')
