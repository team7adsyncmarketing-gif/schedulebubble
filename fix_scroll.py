leads_tsx = "src/pages/Leads.tsx"
with open(leads_tsx, 'r', encoding='utf-8') as f:
    content = f.read()

# The bug: "items-center" in flexbox clips the top of elements if they are taller than the screen, preventing scrolling up.
# The fix: Remove items-center, use overflow-y-auto on the wrapper, and add top padding.

old_wrapper = 'className="fixed inset-0 z-[100] flex items-center justify-center p-4"'
new_wrapper = 'className="fixed inset-0 z-[100] flex justify-center p-4 pt-16 sm:pt-24 overflow-y-auto"'

content = content.replace(old_wrapper, new_wrapper)

# Also ensure the modal itself doesn't have a strict max-h that hides content, since the wrapper now scrolls.
content = content.replace('max-h-[90vh] overflow-hidden', '')
content = content.replace('max-h-[90vh] overflow-y-auto', '')

with open(leads_tsx, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed modal scrolling bug")
