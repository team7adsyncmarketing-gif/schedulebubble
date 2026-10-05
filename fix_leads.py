with open('src/pages/Leads.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('fetch(http://localhost:5000/api/leads?user_id= + user.id)', 'fetch("http://localhost:5000/api/leads?user_id=" + user.id)')
content = content.replace('fetch(http://localhost:5000/api/leads/ + leadId + /status', 'fetch("http://localhost:5000/api/leads/" + leadId + "/status"')

with open('src/pages/Leads.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
