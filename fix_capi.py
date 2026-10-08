backend_routes = "backend/routes/leadRoutes.js"
with open(backend_routes, 'r') as f:
    content = f.read()

# Remove the strict fbclid requirement so Instant Forms can work using just email/phone matching
content = content.replace("if (!lead.fbclid) return false;", "if (!lead.fbclid && !lead.email && !lead.phone) return false;")

# Make sure fbc is only added if fbclid exists
old_fbc = "fbc: 'fb.1.' + eventTime + '.' + lead.fbclid,"
new_fbc = "...(lead.fbclid ? { fbc: 'fb.1.' + eventTime + '.' + lead.fbclid } : {}),"
content = content.replace(old_fbc, new_fbc)

with open(backend_routes, 'w') as f:
    f.write(content)
print("Updated leadRoutes.js for Instant Forms")
