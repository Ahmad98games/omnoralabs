const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('c:/E-Commerce Website (Full) - Copy (3)/frontend');
let foundIssue = false;

files.forEach(f => {
  if (!f.match(/\.(tsx?|jsx?|ts|js|html)$/)) return;
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('require(') || content.includes('require (')) {
     console.log("REQUIRE LOCATED: " + f);
     foundIssue = true;
  }
});
if(!foundIssue) {
    console.log("No require found in entire frontend folder.");
}
