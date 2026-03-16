const https = require('https');

https.get('https://omnoralabs.vercel.app/api/cms/content?diag=1', (res) => {
    let data = '';
    
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', JSON.stringify(res.headers, null, 2));

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            console.log('BODY:', JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
            console.log('BODY (Raw):', data);
        }
    });

}).on('error', (err) => {
    console.log('FAIL:', err.message);
});
