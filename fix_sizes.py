import re

# 1. Update index.html favicon
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()
html = html.replace('<link rel="icon" type="image/svg+xml" href="/vite.svg" />', '<link rel="icon" type="image/png" href="/logo.png" />')
with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

# 2. Increase Navbar logo size in App.tsx
with open("src/App.tsx", "r", encoding="utf-8") as f:
    app_content = f.read()
app_content = app_content.replace('className="h-8 w-auto bg-white p-1 rounded-md transition-all duration-300"', 'className="h-12 w-auto bg-white p-1.5 rounded-md transition-all duration-300"')
with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(app_content)

# 3. Increase floating logo size in AppLayout.tsx
with open("src/components/layout/AppLayout.tsx", "r", encoding="utf-8") as f:
    layout_content = f.read()
layout_content = layout_content.replace('className="h-14 w-auto bg-white p-2 rounded-xl"', 'className="h-24 w-auto bg-white p-2 rounded-xl"')
with open("src/components/layout/AppLayout.tsx", "w", encoding="utf-8") as f:
    f.write(layout_content)
