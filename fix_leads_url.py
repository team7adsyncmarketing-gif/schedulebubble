with open('src/pages/Leads.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('http://localhost:5000', 'https://schedulebubble.onrender.com')

with open('src/pages/Leads.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
