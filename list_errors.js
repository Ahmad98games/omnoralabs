const http = require('http');

http.get('http://localhost:5000/api/analytics/events?type=runtime_error', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log('Events Count:', parsed.events ? parsed.events.length : 0);
            if (parsed.events && parsed.events.length > 0) {
                console.log('Latest Error:', JSON.stringify(parsed.events[0], null, 2));
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Raw data:', data.substring(0, 200));
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
