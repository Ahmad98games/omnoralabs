/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'royal-blue': '#1B365D',
                'blush-pink': '#FADADD',
                'muted-gold': '#C5A059',
                'warm-white': '#F9F9F9',
                'obsidian': '#050505',
                'champagne': '#F1D592',
                'charcoal': '#1A1A1A',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
            },
        },
    },
    plugins: [],
}
