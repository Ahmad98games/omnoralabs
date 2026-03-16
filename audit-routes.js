const fs = require('fs');
const path = require('path');

function auditDir(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            auditDir(fullPath);
            return;
        }
        
        if (!file.endsWith('.js')) return;
        
        const content = fs.readFileSync(fullPath, 'utf-8');
        const hasRouterUsage = content.includes('router.') || content.includes('router (');
        const hasRouterDefine = content.includes('const router =') || content.includes('const router=');
        
        if (hasRouterUsage && !hasRouterDefine) {
            console.log(`[FAIL] ${fullPath} - Uses router but DOES NOT declare it`);
        }
    });
}

console.log('Auditing gsgbackend/routes...');
auditDir('gsgbackend/routes');

console.log('\nAuditing backend/routes...');
auditDir('backend/routes');
