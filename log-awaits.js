const fs = require('fs');
const path = require('path');

let output = '';

function auditFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.includes('await')) return;

    const lines = content.split('\n');
    lines.forEach((line, index) => {
        if (line.includes('await')) {
            output += `[AWAIT] ${filePath}:${index + 1} -> ${line.trim()}\n`;
        }
    });
}

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(f => {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory() && !full.includes('node_modules') && !full.includes('.git') && !full.includes('frontend')) {
            walk(full);
        } else if (f.endsWith('.js')) {
            auditFile(full);
        }
    });
}

console.log('Scanning gsgbackend & backend...');
walk('./gsgbackend');
walk('./backend');
walk('./api');

fs.writeFileSync('awaits.txt', output);
console.log('Done! Wrote results to awaits.txt');
