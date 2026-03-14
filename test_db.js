const mongoose = require('mongoose');

async function checkDB() {
    await mongoose.connect('mongodb://127.0.0.1:27017/omnora_db');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const SiteContent = mongoose.model('SiteContent', new mongoose.Schema({}, { strict: false }));
    
    const defProducts = await Product.countDocuments({ tenant_id: 'default_tenant' });
    const otherProducts = await Product.aggregate([
        { $group: { _id: "$tenant_id", count: { $sum: 1 } } }
    ]);
    
    console.log(`Default Tenant Products: ${defProducts}`);
    console.log(`All Tenants Products:`, otherProducts);

    const siteContents = await SiteContent.aggregate([
        { $group: { _id: "$tenant_id", hasPublished: { $sum: { $cond: [ { $ifNull: ["$published", false] }, 1, 0 ] } } } }
    ]);
    console.log(`Site Contents:`, siteContents);

    process.exit(0);
}

checkDB().catch(console.error);
