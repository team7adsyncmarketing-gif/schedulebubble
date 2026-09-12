import os

def replace_in_file(filepath, old_str, new_str):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    if old_str in content:
        new_content = content.replace(old_str, new_str)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {filepath}")
    else:
        print(f"String not found in {filepath}")

# 1. App.tsx (Navbar Logo)
app_old = """<div className="bg-indigo-600 p-2 rounded-xl group-hover:scale-110 group-hover:bg-indigo-500 
transition-all duration-300 shadow-[0_0_18px_rgba(79,70,229,0.45)]">
                  <Hexagon className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r 
from-indigo-600 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-500 
group-hover:to-indigo-500 transition-all duration-300">
                AdSync Marketing
                </span>"""

app_new = """<img src="/logo.png" alt="ScheduleBubble Logo" className="h-8 w-auto bg-white p-1 rounded-md transition-all duration-300" />"""

# Due to potential line ending/indentation differences, let's just do a more forgiving replace for App.tsx
with open("src/App.tsx", "r", encoding="utf-8") as f:
    app_content = f.read()
import re
app_content = re.sub(r'<div className="bg-indigo-600 p-2.*?</span>', app_new, app_content, flags=re.DOTALL)
with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(app_content)
print("Updated App.tsx via regex")

# 2. AppLayout.tsx (Center floating logo)
with open("src/components/layout/AppLayout.tsx", "r", encoding="utf-8") as f:
    layout_content = f.read()

layout_new = """<img src="/logo.png" alt="ScheduleBubble Logo" className="h-12 w-auto bg-white p-2 rounded-xl" />"""
layout_content = re.sub(r'<div className="w-12 h-12 rounded-xl bg-indigo-600.*?</div>\s*</motion.div>', layout_new + '\n        </motion.div>', layout_content, flags=re.DOTALL)

with open("src/components/layout/AppLayout.tsx", "w", encoding="utf-8") as f:
    f.write(layout_content)
print("Updated AppLayout.tsx via regex")

