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
  if (content.includes('require(') || content.includes('require (')) {
     console.log("REQUIRE LOCATED IN DIST FILE: " + f);
     // print the surrounding 100 characters
     const index = content.indexOf('require');
     console.log("Context: " + content.substring(Math.max(0, index - 50), Math.min(content.length, index + 50)));
     foundIssue = true;
  }
});
if(!foundIssue) {
    console.log("No require found in dist files.");
}
