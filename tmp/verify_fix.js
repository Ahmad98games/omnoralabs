const axios = require('axios');

async function check() {
    try {
        console.log('--- Checking localhost CMS content (Default Tenant) ---');
        const res = await axios.get('http://127.0.0.1:5000/api/cms/content');
        console.log('Status:', res.status);
        console.log('Data Success:', res.data.success);
        console.log('Tenant Id:', res.data.tenant_id);
    } catch (err) {
        console.error('Check failed:', err.response ? err.response.data : err.message);
    }
}

check();
