file_path = "src/pages/Leads.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix inline code blocks causing horizontal overflow (adding break-all)
content = content.replace("bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400 font-mono text-sm", "bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400 font-mono text-sm break-all")
content = content.replace("bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono text-sm", "bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono text-sm break-all")

# 2. Fix the Tabs so they don't get squished by the close button on mobile
content = content.replace('className="flex border-b border-slate-200 dark:border-slate-800 pt-2 px-2"', 'className="flex flex-col sm:flex-row border-b border-slate-200 dark:border-slate-800 pt-12 sm:pt-2 px-2 gap-2 sm:gap-0"')
content = content.replace('className="absolute right-4 top-4 p-2', 'className="absolute right-2 top-2 sm:right-4 sm:top-4 p-2')

# 3. Fix the container overflow
content = content.replace('className="relative bg-white dark:bg-[#0c101a] rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col', 'className="relative bg-white dark:bg-[#0c101a] rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden mb-10')

# 4. Fix pre blocks on mobile
content = content.replace('className="bg-[#0f172a] text-slate-50 p-4 sm:p-6 rounded-xl overflow-x-auto', 'className="bg-[#0f172a] text-slate-50 p-3 sm:p-6 rounded-xl overflow-x-auto max-w-[calc(100vw-3rem)] sm:max-w-none text-xs sm:text-sm')
content = content.replace('className="text-sm font-mono leading-relaxed"', 'className="text-xs sm:text-sm font-mono leading-relaxed"')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed mobile layout for Leads.tsx")
