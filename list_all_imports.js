const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('c:/E-Commerce Website (Full) - Copy (3)/frontend/src');
const imports = new Map();

files.forEach(f => {
  if (!f.match(/\.(tsx?|jsx?|ts|js)$/)) return;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    const match = line.match(/import\s+.*from\s+['"]([^'"]+)['"]/);
    if (match) {
        let pkg = match[1];
        if (!pkg.startsWith('.')) {
            if (!imports.has(pkg)) imports.set(pkg, []);
            imports.get(pkg).push(f);
        }
    }
  });
});

console.log("ALL EXTERNAL IMPORTS:");
for (const [pkg, fList] of imports.entries()) {
    console.log("- " + pkg + " (used in " + fList.length + " files)");
    if(pkg === 'dotenv' || pkg.includes('firebase-admin') || pkg.includes('stripe') || pkg === 'fs' || pkg === 'path' || pkg.includes('backend')) {
        console.log("   => FOUND SUSPECT IN: " + fList.join(', '));
    }
}
