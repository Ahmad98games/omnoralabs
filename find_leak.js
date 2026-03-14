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

const srcDir = path.resolve('c:/E-Commerce Website (Full) - Copy (3)/frontend/src');
const files = walk(srcDir);
let foundIssue = false;

files.forEach(f => {
  if (!f.match(/\.(tsx?|jsx?|ts|js)$/)) return;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    // Check all imports
    const match = line.match(/from\s+['"]([^'"]+)['"]/);
    if (match) {
        let pkg = match[1];
        if (pkg.startsWith('.')) {
            const resolvedPath = path.resolve(path.dirname(f), pkg);
            if (!resolvedPath.startsWith(srcDir) && !resolvedPath.includes('node_modules')) {
                console.log("LEAK FOUND!! File: " + f + " line: " + (i+1) + " -> " + line.trim() + " (Resolves to " + resolvedPath + ")");
                foundIssue = true;
            }
        }
    }
  });
});

if(!foundIssue) {
    console.log("No relative leaks found.");
}
