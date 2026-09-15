import re

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Replace the previous logo.png favicon with standard favicon_io tags
pattern = r'<link rel="icon" type="image/png" href="/logo\.png" />'
replacement = """<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="manifest" href="/site.webmanifest" />"""

if pattern in html or re.search(pattern, html):
    html = re.sub(pattern, replacement, html)
else:
    # Fallback if it's still pointing to vite.svg or something else
    html = re.sub(r'<link rel="icon" type="image/[^"]+" href="/[^"]+" />', replacement, html)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
print("Updated index.html")
