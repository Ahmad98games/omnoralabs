const http = require('http');

http.get('http://localhost:5000/api/products', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Raw response head (100 chars):', data.substring(0, 100));
        try {
            const parsed = JSON.parse(data);
            console.log('Parsed type:', typeof parsed);
            console.log('Parsed keys:', Object.keys(parsed));
        } catch (e) {
            console.log('Parse error:', e.message);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
