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
const imports = new Set();
let foundIssue = false;

files.forEach(f => {
  if (!f.match(/\.(tsx?|jsx?)$/)) return;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach(line => {
    const match = line.match(/import\s+.*from\s+['"]([^'"]+)['"]/);
    if (match) {
        let pkg = match[1];
        imports.add(pkg);
        if(pkg.includes('backend') || pkg === 'stripe' || pkg === 'dotenv' || pkg === 'fs' || pkg === 'path' || pkg === 'jsonwebtoken') {
            console.log("SUSPICIOUS IMPORT FOUND in " + f + ": " + line.trim());
            foundIssue = true;
        }
    }
    const matchRequire = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (matchRequire) {
        console.log("REQUIRE FOUND in " + f + ": " + line.trim());
        foundIssue = true;
    }
  });
});
if(!foundIssue) {
    console.log("No obvious suspicious imports found.");
}
