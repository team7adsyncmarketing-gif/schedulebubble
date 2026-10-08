file_path = r"d:\antigravity\scratch\dm\900n.html"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_id = "b72b4fd9-3614-4b6b-9947-032772bddfed"
new_id = "9103901f-d731-4d2a-9599-71cb6e3f518f"

if old_id in content:
    content = content.replace(old_id, new_id)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("ID updated successfully")
else:
    print("Old ID not found, perhaps already changed?")
