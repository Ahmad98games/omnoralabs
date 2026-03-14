const http = require('http');

http.get('http://localhost:5000/api/cms/content', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Raw response head (100 chars):', data.substring(0, 100));
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
