const { execSync } = require('child_process');
const fs = require('fs');

try {
    console.log('Running esbuild to bundle frontend/src/main.tsx...');
    const out = execSync('npx -y esbuild frontend/src/main.tsx --bundle --platform=neutral --loader:.tsx=tsx --loader:.ts=ts --loader:.png=dataurl --loader:.svg=text', { encoding: 'utf-8', stdio: 'pipe' });
    fs.writeFileSync('esbuild_frontend_out.txt', 'Success!');
    console.log('Success! No syntax errors.');
} catch (err) {
    console.error('Esbuild failed!');
    fs.writeFileSync('esbuild_frontend_err.txt', err.output ? err.output.join('\n') : err.message);
    console.log('Wrote error to esbuild_frontend_err.txt');
}
