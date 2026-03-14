const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

async function checkCMS() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const SiteContent = require('./backend/models/SiteContent');

        const content = await SiteContent.findOne({ tenant_id: 'default_tenant' });
        console.log('CMS CONTENT (default_tenant):');
        console.log(JSON.stringify(content, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCMS();
