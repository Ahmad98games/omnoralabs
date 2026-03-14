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
const badRequires = [];

files.forEach(f => {
  if (!f.match(/\.(tsx?|jsx?)$/)) return;
  const content = fs.readFileSync(f, 'utf8');
  if (/\brequire\s*\(/.test(content)) badRequires.push(f + ' (has require() call)');
  if (/from\s+['"](fs|path|os|crypto|events|child_process|dotenv|stripe)['"]/.test(content)) badRequires.push(f + ' (has node module import fs/path/etc)');
  // check for backend import
  if (content.includes('../backend') || content.includes('../../backend')) {
     badRequires.push(f + ' (imports from backend)');
  }
  if (content.includes('import stripe') || content.includes('import Stripe from "stripe"')) {
     badRequires.push(f + ' (imports stripe node module)');
  }
  // catch anything like "require('..."
  if (content.includes("require('") || content.includes('require("')) {
     badRequires.push(f + ' (has require string literal)');
  }
});
console.log(badRequires.join('\n'));
