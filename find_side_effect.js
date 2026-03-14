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
let foundIssue = false;

files.forEach(f => {
  if (!f.match(/\.(tsx?|jsx?|ts|js)$/)) return;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    const match = line.match(/^\s*import\s+['"]([^'"]+)['"]/);
    if (match) {
        let pkg = match[1];
        if (!pkg.startsWith('.')) {
            console.log("SIDE-EFFECT IMPORT in " + f + ":" + (i+1) + " -> " + line.trim());
            foundIssue = true;
        }
    }
  });
});
if(!foundIssue) {
    console.log("No non-relative side-effect imports found.");
}
