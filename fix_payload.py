import re

with open("backend/routes/leadRoutes.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "    if (testCode) {\n      payload.test_event_code = testCode;\n    }\n\n    const url",
    "    if (testCode) {\n      payload.test_event_code = testCode;\n    }\n\n    console.log('[Meta Payload]:', JSON.stringify(payload, null, 2));\n\n    const url"
)

with open("backend/routes/leadRoutes.js", "w", encoding="utf-8") as f:
    f.write(content)
