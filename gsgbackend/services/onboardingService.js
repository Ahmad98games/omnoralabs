/**
 * onboardingService.js
 * Handles seller store creation, template seeding, and COD activation.
 */
const logger = require('./logger');

// Lazy-require models to avoid circular deps at startup
const getModels = () => ({
    PaymentMethod: require('../models/PaymentMethod'),
    SiteContent: require('../models/SiteContent'),
    Product: require('../models/Product'),
});

// ─── Template layouts ─────────────────────────────────────────────────────────

const TEMPLATES = {
    fashion: require('../templates/home/fashion.json'),
    electronics: require('../templates/home/electronics.json'),
    general: require('../templates/home/general.json'),
};

// ─── Core functions ───────────────────────────────────────────────────────────

/**
 * Step 1: Initialise payment methods for a new seller (COD enabled by default)
 */
async function enableCOD(sellerId) {
    const { PaymentMethod } = getModels();
    const existing = await PaymentMethod.findOne({ sellerId });
    if (existing) return existing;
    return PaymentMethod.create({ sellerId, methods: { cod: true } });
}

/**
 * Step 2: Clone a store layout template and assign it to the seller
 */
async function applyTemplate(sellerId, niche = 'general') {
    const { SiteContent } = getModels();
    const template = TEMPLATES[niche] || TEMPLATES.general;

    const existing = await SiteContent.findOne({ sellerId, pageId: 'home' });
    if (existing) {
        existing.layout = template.layout;
        existing.configuration = template.configuration || {};
        if (existing.save) await existing.save();
        else await SiteContent.findOneAndUpdate(
            { sellerId, pageId: 'home' },
            { layout: template.layout, configuration: template.configuration || {} }
        );
    } else {
        await SiteContent.create({
            sellerId,
            pageId: 'home',
            layout: template.layout,
            configuration: template.configuration || {},
        });
    }

    return { success: true, niche, blocksApplied: template.layout?.length ?? 0 };
}

/**
 * Step 3: Seed 3 demo products for a new seller so their store isn't empty
 */
async function seedDemoProducts(sellerId, storeName = 'My Store') {
    const { Product } = getModels();

    const demos = [
        {
            sellerId,
            name: `${storeName} — Featured Item`,
            description: 'A beautiful product to showcase your store.',
            price: 2499,
            stock: 50,
            category: 'Featured',
            isDemo: true,
            images: ['/placeholder-product-1.jpg'],
        },
        {
            sellerId,
            name: `${storeName} — Best Seller`,
            description: 'Your best-selling item goes here.',
            price: 1799,
            stock: 100,
            category: 'Best Sellers',
            isDemo: true,
            images: ['/placeholder-product-2.jpg'],
        },
        {
            sellerId,
            name: `${storeName} — New Arrival`,
            description: 'Show your latest arrivals here.',
            price: 3199,
            stock: 30,
            category: 'New Arrivals',
            isDemo: true,
            images: ['/placeholder-product-3.jpg'],
        },
    ];

    await Promise.all(demos.map(p => Product.create(p)));
    logger.info(`ONBOARDING: Seeded 3 demo products for seller ${sellerId}`);
    return { seeded: demos.length };
}

/**
 * Full onboarding launch — combines all steps
 */
async function launchStore(sellerId, { niche, storeName }) {
    try {
        const [payment, template, products] = await Promise.all([
            enableCOD(sellerId),
            applyTemplate(sellerId, niche),
            seedDemoProducts(sellerId, storeName),
        ]);

        logger.info(`ONBOARDING: Store launched for ${sellerId} — niche: ${niche}`);
        return { success: true, payment, template, products };
    } catch (err) {
        logger.error('ONBOARDING: launchStore failed', { sellerId, error: err.message });
        throw err;
    }
}

module.exports = { enableCOD, applyTemplate, seedDemoProducts, launchStore };
