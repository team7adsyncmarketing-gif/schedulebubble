with open('backend/routes/leadRoutes.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('fbc: "fb.1..",', 'fbc: b.1..,')
content = content.replace('const url = "https://graph.facebook.com/v19.0//events?access_token=";', 'const url = https://graph.facebook.com/v19.0//events?access_token=;')

with open('backend/routes/leadRoutes.js', 'w', encoding='utf-8') as f:
    f.write(content)
