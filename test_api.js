const http = require('http');

const endpoints = [
    '/api/health',
    '/api/cms/content',
    '/api/products?limit=1'
];

async function checkEndpoint(path) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET',
            headers: {
                'X-Api-Version': '1'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log(`PATH: ${path}`);
                console.log(`STATUS: ${res.statusCode}`);
                console.log(`DATA (first 100): ${data.substring(0, 100)}...`);
                console.log('---');
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`PATH: ${path} ERROR: ${e.message}`);
            resolve();
        });
        req.end();
    });
}

async function runAll() {
    for (const p of endpoints) {
        await checkEndpoint(p);
    }
}

runAll();
