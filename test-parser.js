const fs = require('fs');
const path = require('path');
const vm = require('vm');

let output = '';

function checkSyntax(filePath) {
    try {
        const code = fs.readFileSync(filePath, 'utf-8');
        // Node's native compiler
        new vm.Script(code, { filename: filePath });
    } catch (err) {
        if (err.message.includes('await')) {
            output += `[ILLEGAL_AWAIT] ${filePath}\nError: ${err.message}\n${err.stack}\n\n`;
        } else if (err instanceof SyntaxError) {
             // Catch all syntax errors just in case
             output += `[SYNTAX_ERROR] ${filePath}\nError: ${err.message}\n\n`;
        }
    }
}

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(f => {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory() && !full.includes('node_modules') && !full.includes('.git') && !full.includes('frontend')) {
            walk(full);
        } else if (f.endsWith('.js')) {
            checkSyntax(full);
        }
    });
}

console.log('Parsing all .js files using vm.Script...');
walk('./gsgbackend');
walk('./backend');
walk('./api');

fs.writeFileSync('parse_errors.txt', output || 'No illegal awaits found!');
console.log('Done! Wrote results to parse_errors.txt');
