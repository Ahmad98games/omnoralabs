const http = require('http');

http.get('http://localhost:5000/api/analytics/events', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log('Events Count:', parsed.events ? parsed.events.length : 0);
            if (parsed.events && parsed.events.length > 0) {
                console.log('Event types:', [...new Set(parsed.events.map(e => e.type))]);
                console.log('Latest Event:', JSON.stringify(parsed.events[0], null, 2));
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
