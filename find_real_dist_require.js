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

const files = walk('c:/E-Commerce Website (Full) - Copy (3)/frontend/dist');
let foundIssue = false;

files.forEach(f => {
  if (!f.match(/\.js$/)) return;
  const content = fs.readFileSync(f, 'utf8');
  let searchIndex = 0;
  while ((searchIndex = content.indexOf('require(', searchIndex)) !== -1) {
    const context = content.substring(Math.max(0, searchIndex - 50), Math.min(content.length, searchIndex + 50));
    if (!context.includes('@emotion')) {
        console.log("ACTUAL REQUIRE IN: " + f);
        console.log("Context: " + context);
        foundIssue = true;
    }
    searchIndex += 8;
  }
});

if(!foundIssue) {
    console.log("No non-emotion require() found in dist.");
}
