import os
import re

def replace_in_file(filepath, pattern, replacement):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {filepath}")

# 1. App.tsx (Navbar Logo)
app_tsx_path = "src/App.tsx"
# Replace the Hexagon icon and "AdSync Marketing" text with the new logo
app_pattern = r'<div className="bg-indigo-600 p-2 rounded-xl group-hover:scale-110.*?</svg>\s*</div>\s*<span className="font-bold text-xl tracking-tight bg-clip-text text-transparent[^>]*>.*?AdSync Marketing\s*</span>'
app_replacement = r'<img src="/logo.png" alt="ScheduleBubble Logo" className="h-8 w-auto dark:bg-white dark:p-1 dark:rounded-md transition-all duration-300" />'
replace_in_file(app_tsx_path, app_pattern, app_replacement)

# 2. AppLayout.tsx (Center floating logo)
applayout_tsx_path = "src/components/layout/AppLayout.tsx"
# Replace the SVG and Adsync text with the new logo
applayout_pattern = r'<div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">.*?</svg>\s*</div>\s*\{/\*\s*Adsync Text\s*\*/\}\s*<div className="flex flex-col justify-center">\s*<span[^>]*>\s*ADSYNC\s*</span>\s*<span[^>]*>\s*MARKETING\s*</span>\s*</div>'
applayout_replacement = r'<img src="/logo.png" alt="ScheduleBubble Logo" className="h-16 w-auto drop-shadow-md bg-white p-2 rounded-xl" />'
replace_in_file(applayout_tsx_path, applayout_pattern, applayout_replacement)

# Also catch the alternative if the SVG div doesn't match perfectly, replace the inner contents of the motion.div
applayout_pattern_2 = r'<motion\.div[^>]*className="flex items-center gap-4 bg-slate-900.*?>.*?</motion\.div>'
applayout_replacement_2 = r'<motion.div className="flex items-center gap-4 bg-slate-900 px-8 py-5 rounded-2xl border border-slate-700/50 shadow-2xl relative z-20">\n<img src="/logo.png" alt="ScheduleBubble Logo" className="h-12 w-auto bg-white p-2 rounded-xl" />\n</motion.div>'
replace_in_file(applayout_tsx_path, applayout_pattern_2, applayout_replacement_2)

# 3. Footer
footer_path = "src/components/Footer.tsx"
footer_pattern = r'AdSync Marketing'
footer_replacement = r'ScheduleBubble'
replace_in_file(footer_path, footer_pattern, footer_replacement)

print("Done!")
