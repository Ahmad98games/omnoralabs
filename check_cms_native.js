const http = require('http');

http.get('http://localhost:5000/api/cms/content', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            const content = parsed.content;
            console.log('Keys in content:', Object.keys(content || {}));
            if (content && content.pages) {
                console.log('Pages Keys:', Object.keys(content.pages));
                for (const [key, page] of Object.entries(content.pages)) {
                    console.log(`Page: ${key}`, {
                        headlineText: typeof page.headlineText,
                        heroHeadline: typeof page.heroHeadline,
                        layout: Array.isArray(page.layout) ? `Array(${page.layout.length})` : typeof page.layout
                    });
                }
            } else {
                console.log('Content or pages missing');
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
