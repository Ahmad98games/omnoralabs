const fs = require('fs');
const path = require('path');

let output = '';

function auditFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.includes('await')) return;

    const lines = content.split('\n');
    lines.forEach((line, index) => {
        // Look for .map( or .forEach( or any callback that might use await illegally
        // This is a simple heuristic, but we can also look for arrow functions with await
        if (line.includes('await') && (line.includes('.map') || line.includes('.forEach') || line.includes('=>'))) {
            output += `[AWAIT_CHECK] ${filePath}:${index + 1} -> ${line.trim()}\n`;
        }
    });
}

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(f => {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory() && !full.includes('node_modules') && !full.includes('.git')) {
            walk(full);
        } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')) {
            auditFile(full);
        }
    });
}

console.log('Scanning frontend/src for suspicious awaits...');
walk('./frontend/src');

fs.writeFileSync('frontend_awaits.txt', output || 'No suspicious awaits found!');
console.log('Done! Wrote results to frontend_awaits.txt');
