import re

with open("src/components/layout/AppLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the entire AdsyncLogo component
pattern = r'const AdsyncLogo: React\.FC = \(\) => \{.*?\}\);\s*\}'
replacement = """const AdsyncLogo: React.FC = () => {
  return (
    <div
      className="absolute hidden md:block md:left-[66%] md:top-[52%] md:-translate-x-1/2 md:-translate-y-1/2 scale-75 md:scale-100 transition-all duration-500"
      style={{ zIndex: 15 }}
    >
      <div 
        className="flex items-center gap-4 bg-slate-900 px-6 py-4 rounded-2xl shadow-2xl relative z-20"
        style={{
          boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <img src="/logo.png" alt="ScheduleBubble Logo" className="h-14 w-auto bg-white p-2 rounded-xl" />
      </div>
    </div>
  );
}"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open("src/components/layout/AppLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)

with open("src/components/Footer.tsx", "r", encoding="utf-8") as f:
    f_content = f.read()

f_content = f_content.replace('ADSYNC', 'ScheduleBubble')
with open("src/components/Footer.tsx", "w", encoding="utf-8") as f:
    f.write(f_content)

