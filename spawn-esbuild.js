const { execSync } = require('child_process');
const fs = require('fs');

try {
    console.log('Running esbuild bundle...');
    const out = execSync('npx -y esbuild api/index.js --bundle --platform=node', { encoding: 'utf-8', stdio: 'pipe' });
    fs.writeFileSync('esbuild_out.txt', out);
    console.log('Success! Wrote bundle to esbuild_out.txt');
} catch (err) {
    console.error('Esbuild failed!');
    fs.writeFileSync('esbuild_err.txt', err.output ? err.output.join('\n') : err.message);
    console.log('Wrote error to esbuild_err.txt');
}
