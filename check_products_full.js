const http = require('http');

const options = {
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/products',
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'X-Api-Version': '1'
    }
};

const req = http.get(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Body start:', data.substring(0, 500));
    });
});

req.on('error', (e) => {
    console.error('Problem with request:', e.message);
});
