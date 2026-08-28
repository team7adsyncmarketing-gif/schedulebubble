const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // We will replace all occurrences of http://localhost:5000 with a global variable or import.meta.env
      // Since it's a vite app, we can use import.meta.env.VITE_API_URL
      // The easiest robust way is just literal replacement:
      const before = content;
      content = content.replace(/http:\/\/localhost:5000/g, '${import.meta.env.VITE_API_URL || "http://localhost:5000"}');
      
      // But if the original string was 'http://localhost:5000/api', replacing it makes it '${import.meta.env...}/api' inside single quotes.
      // So let's fix single quotes to backticks if we injected ${...}
      content = content.replace(/'([^']*\$\{import\.meta\.env\.VITE_API_URL \|\| "http:\/\/localhost:5000"\}[^']*)'/g, '`$1`');
      
      // And fix double quotes to backticks
      content = content.replace(/"([^"]*\$\{import\.meta\.env\.VITE_API_URL \|\| "http:\/\/localhost:5000"\}[^"]*)"/g, '`$1`');
      
      // Wait, there's a problem: what if they had `http://localhost:5000${endpoint}` -> `${import...}${endpoint}`
      // This is perfectly fine in backticks.
      // But wait! What if they had `http://localhost:5000`? It becomes `${import...}`.

      if (content !== before) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Done!');
