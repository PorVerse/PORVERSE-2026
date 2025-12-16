const fs = require('fs');
const glob = require('glob');

const files = glob.sync('**/*.{ts,tsx}', { 
  ignore: ['node_modules/**', '.next/**', 'scripts/**'] 
});

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/process\.env\.([A-Z_]+)/g, "process.env['$1']");
  fs.writeFileSync(file, content);
});

console.log('✅ Fixed env access in', files.length, 'files');
