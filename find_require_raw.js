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
let found = false;

files.forEach(f => {
  if (!f.match(/\.(tsx?|jsx?|js|ts)$/)) return;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('require(') || line.includes('require (')) {
        console.log("FOUND require in " + f + ":" + (i+1) + " -> " + line.trim());
        found = true;
    }
  });
});

if(!found) console.log("Absolutely no require() found.");
