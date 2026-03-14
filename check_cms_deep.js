const http = require('http');

function printType(obj, prefix = '') {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        for (const key in obj) {
            const val = obj[key];
            if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                console.log(`${prefix}${key}: Object {${Object.keys(val).join(', ')}}`);
            } else {
                console.log(`${prefix}${key}: ${typeof val}${Array.isArray(val) ? '[]' : ''}`);
            }
        }
    }
}

http.get('http://localhost:5000/api/cms/content', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            const content = parsed.content;
            if (!content) return console.log('No content');

            console.log('--- Configuration ---');
            printType(content.configuration, '  ');

            console.log('--- Pages ---');
            if (content.pages) {
                for (const pageName in content.pages) {
                    console.log(`  Page: ${pageName}`);
                    printType(content.pages[pageName], '    ');
                }
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
