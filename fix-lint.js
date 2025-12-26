// fix-lint.js - pune în root
const fs = require('fs');
const path = require('path');

const fixes = [
  // Șterge unused imports/variables
  [/^.*'_.*' is (defined|assigned).*never used.*$/gm, ''],
  // @ts-ignore → @ts-expect-error
  [/@ts-ignore/g, '@ts-expect-error'],
  // any → unknown (în multe cazuri)
  [/: any(?=\s*[=,)])/g, ': unknown'],
  // Șterge linii goale multiple
  [/\n\s*\n\s*\n/g, '\n\n']
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  fixes.forEach(([pattern, replacement]) => {
    content = content.replace(pattern, replacement);
  });
  fs.writeFileSync(filePath, content);
}

// Procesează toate fișierele .ts/.tsx
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!['node_modules', '.next', 'tests'].includes(file)) {
        walkDir(filePath);
      }
    } else if (/\.(ts|tsx)$/.test(file)) {
      fixFile(filePath);
    }
  });
}

walkDir('./');
console.log('✅ Fixed common patterns');