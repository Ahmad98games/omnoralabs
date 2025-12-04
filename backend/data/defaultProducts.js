// In-memory product data from legacy website
// This serves as a fallback when MongoDB is not available

const defaultProducts = [
    {
        _id: '1',
        name: 'Calm Lavender Bath Bomb',
        description: 'Soothing lavender with chamomile for a restful soak',
        price: 899,
        image: '/images/main/calm lavender.png',
        category: 'bath-bombs',
        featured: true,
        details: 'A gentle, skin-kind bath bomb infused with natural lavender essential oil, chamomile extract, and shea butter. pH-balanced and suitable for sensitive skin.',
        ingredients: ['Sodium Bicarbonate', 'Citric Acid', 'Lavender Oil', 'Chamomile Extract', 'Shea Butter'],
        size: '180g',
        skinType: 'All skin types',
        inStock: true
    },
    {
        _id: '2',
        name: 'Breathe Eucalyptus Bath Bomb',
        description: 'Eucalyptus and peppermint for clarity and refresh',
        price: 949,
        image: '/images/main/breath bath.png',
        category: 'bath-bombs',
        featured: true,
        details: 'Refreshing blend with eucalyptus and peppermint essential oils to awaken the senses. Enriched with cocoa butter to leave skin soft.',
        ingredients: ['Sodium Bicarbonate', 'Citric Acid', 'Eucalyptus Oil', 'Peppermint Oil', 'Cocoa Butter'],
        size: '180g',
        skinType: 'Normal to oily',
        inStock: true
    },
    {
        _id: '3',
        name: 'Glow Citrus Bath Bomb',
        description: 'Bright citrus with vitamin E for a mood lift',
        price: 899,
        image: '/images/main/Glow Citrus Bath Bomb.png',
        category: 'bath-bombs',
        featured: true,
        details: 'Uplifting notes of orange and lemon with vitamin E and sweet almond oil to nourish and soften skin.',
        ingredients: ['Sodium Bicarbonate', 'Citric Acid', 'Orange Oil', 'Lemon Oil', 'Vitamin E', 'Almond Oil'],
        size: '180g',
        skinType: 'All skin types',
        inStock: true
    },
    {
        _id: '4',
        name: 'Rose Comfort Bath Bomb',
        description: 'Soft rose and vanilla for gentle comfort',
        price: 999,
        image: '/images/main/rose.png',
        category: 'bath-bombs',
        featured: false,
        details: 'Calming blend of rose and vanilla with kaolin clay to soothe and oat kernel flour to calm the skin barrier.',
        ingredients: ['Sodium Bicarbonate', 'Citric Acid', 'Rose Oil', 'Vanilla', 'Kaolin Clay', 'Colloidal Oat'],
        size: '180g',
        skinType: 'Dry & sensitive',
        inStock: true
    },
    {
        _id: '5',
        name: 'Balance Green Tea Bath Bomb',
        description: 'Green tea antioxidants for balanced skin',
        price: 949,
        image: '/images/main/green tea.png',
        category: 'bath-bombs',
        featured: false,
        details: 'Green tea extract and jojoba oil help support a healthy skin barrier while offering a serene soak.',
        ingredients: ['Sodium Bicarbonate', 'Citric Acid', 'Green Tea Extract', 'Jojoba Oil'],
        size: '180g',
        skinType: 'Combination',
        inStock: true
    },
    {
        _id: '6',
        name: 'Unwind Chamomile Bath Bomb',
        description: 'Chamomile and calendula for calming downtime',
        price: 899,
        image: '/images/main/unvind.png',
        category: 'bath-bombs',
        featured: false,
        details: 'Chamomile and calendula extracts help soothe while coconut oil leaves skin soft and comfortable.',
        ingredients: ['Sodium Bicarbonate', 'Citric Acid', 'Chamomile Extract', 'Calendula Extract', 'Coconut Oil'],
        size: '180g',
        skinType: 'Sensitive',
        inStock: true
    }
];

module.exports = defaultProducts;
