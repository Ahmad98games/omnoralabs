const fs = require('fs');
const path = require('path');

function requireDir(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
        const fullPath = path.join(__dirname, dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            // requireDir(path.join(dirPath, file)); // skip nested for now or handle relative
            return;
        }
        if (!file.endsWith('.js')) return;
        
        try {
            require(fullPath);
        } catch (e) {
            // We ONLY care about SyntaxError: 'await' is only valid in async functions
            if (e.message.includes('await is only valid') || e.name === 'SyntaxError') {
                console.log(`[SYNTAX_FAIL] ${fullPath}: ${e.message}`);
            }
        }
    });
}

console.log('Auditing gsgbackend/routes...');
requireDir('gsgbackend/routes');

console.log('Auditing gsgbackend/controllers...');
requireDir('gsgbackend/controllers');

console.log('Auditing api folder...');
requireDir('api');
