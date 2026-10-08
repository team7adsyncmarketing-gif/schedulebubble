import re

file_path = r"d:\antigravity\scratch\dm\900n.html"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inject base script before </head>
base_script = '    <script src="https://schedulebubble.com/tracker.js"></script>\n</head>'
if '<script src="https://schedulebubble.com/tracker.js"></script>' not in content:
    content = content.replace("</head>", base_script)

# 2. Inject demo button right after the body tag opens
demo_code = """
    <!-- DEMO BUTTON TO SHOW BOSS -->
    <div style="background: red; padding: 20px; text-align: center; z-index: 999999; position: relative; width: 100%;">
        <h2 style="color: white; margin-bottom: 10px; font-family: sans-serif;">ScheduleBubble Live Test</h2>
        <button onclick="sendTestLead()" style="padding: 15px 30px; font-size: 20px; cursor: pointer; background: white; color: red; font-weight: bold; border: none; border-radius: 5px;">
            Click Here to Send Fake Lead to CRM
        </button>
    </div>
    
    <script>
        function sendTestLead() {
            if (typeof ScheduleBubble !== 'undefined' && ScheduleBubble.captureLead) {
                ScheduleBubble.captureLead({
                    user_id: "b72b4fd9-3614-4b6b-9947-032772bddfed",
                    name: "Sir's Test Lead",
                    email: "boss@terra-test.com",
                    phone: "9999999999",
                    source: "Hostinger Test Site"
                });
                alert("Boom! The lead was just sent to ScheduleBubble!");
            } else {
                alert("Error: ScheduleBubble tracker not loaded yet.");
            }
        }
    </script>
    <!-- END DEMO BUTTON -->
"""

if "DEMO BUTTON TO SHOW BOSS" not in content:
    # Use regex to find the end of the <body ... > tag
    content = re.sub(r'(<body[^>]*>)', r'\1\n' + demo_code, content, count=1, flags=re.IGNORECASE)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully injected ScheduleBubble tracking codes into 900n.html")
