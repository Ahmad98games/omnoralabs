const axios = require('axios');
axios.post('http://localhost:5000/api/newsletter/subscribe', { email: 'test@example.com' })
    .then(res => console.log('STATUS:' + res.status))
    .catch(err => {
        if (err.response) console.log('STATUS:' + err.response.status);
        else console.log('ERROR:' + err.message);
    });
