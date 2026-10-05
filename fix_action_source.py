import re

with open("backend/routes/leadRoutes.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "'action_source': 'system_generated'",
    "'action_source': 'website'"
)
content = content.replace(
    "action_source: 'system_generated'",
    "action_source: 'website'"
)

with open("backend/routes/leadRoutes.js", "w", encoding="utf-8") as f:
    f.write(content)
