process.env.USE_LOCAL_DB = 'true';
const Product = require('./models/Product');
const bootstrap = require('./bootstrap');

const buildFilters = (query, tenantId) => {
    const filters = { tenant_id: tenantId || 'default_tenant' };
    if (query.category) {
        filters.category = query.category.toLowerCase();
    }
    return filters;
};

async function check() {
    try {
        await bootstrap();

        const tenantId = 'default_tenant';
        const query = {};
        const filters = buildFilters(query, tenantId);

        console.log(`Debug Filters: ${JSON.stringify(filters)}`);

        const count = await Product.countDocuments(filters);
        console.log(`Count with Filters: ${count}`);

        const results = await Product.find(filters).limit(10);
        console.log(`Results found: ${results.length}`);

        if (results.length > 0) {
            console.log(`First item matches: ${results[0].tenant_id === tenantId}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
