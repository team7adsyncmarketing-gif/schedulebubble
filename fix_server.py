import re

with open("backend/server.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add the require statement for leadRoutes
if "const leadRoutes = require('./routes/leadRoutes');" not in content:
    content = re.sub(
        r"const userRoutes = require\('\./routes/userRoutes'\);", 
        "const userRoutes = require('./routes/userRoutes');\nconst leadRoutes = require('./routes/leadRoutes');", 
        content
    )

# Add the app.use for leadRoutes
if "app.use('/api/leads', leadRoutes);" not in content:
    content = re.sub(
        r"app\.use\('/api/users', userRoutes\);", 
        "app.use('/api/users', userRoutes);\napp.use('/api/leads', leadRoutes);", 
        content
    )

with open("backend/server.js", "w", encoding="utf-8") as f:
    f.write(content)
