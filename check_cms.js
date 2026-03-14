const axios = require('axios');

async function check() {
    try {
        const res = await axios.get('http://localhost:5000/api/cms/content');
        const content = res.data.content;
        console.log('Keys in content:', Object.keys(content));
        if (content.pages) {
            console.log('Pages keys:', Object.keys(content.pages));
            for (const [key, page] of Object.entries(content.pages)) {
                console.log(`Page: ${key}`, {
                    headlineText: typeof page.headlineText,
                    heroHeadline: typeof page.heroHeadline,
                    layout: Array.isArray(page.layout) ? `Array(${page.layout.length})` : typeof page.layout
                });
            }
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}
check();
