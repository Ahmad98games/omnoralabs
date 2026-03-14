const http = require('http');

http.get('http://localhost:5000/api/products', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log('Success:', parsed.success);
            const products = parsed.data || parsed.products || parsed;
            console.log('Product count:', Array.isArray(products) ? products.length : 'Not an array');
            if (Array.isArray(products) && products.length > 0) {
                console.log('First product sample:', {
                    id: products[0]._id,
                    name: products[0].name,
                    price: typeof products[0].price,
                    image: typeof products[0].image
                });
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
