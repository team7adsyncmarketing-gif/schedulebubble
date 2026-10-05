with open('public/tracker.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const SCHEDULEBUBBLE_API_URL = 'https://api.schedulebubble.com';", "const SCHEDULEBUBBLE_API_URL = 'https://schedulebubble.onrender.com';")

with open('public/tracker.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
