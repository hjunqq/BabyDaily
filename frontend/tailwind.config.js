/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'sakura-pink': '#FFB7C5',
                'sakura-text': '#5A3A2E',
                'sakura-bg': '#FFF7F9',
                'sakura-bg-alt': '#F9F5F3',
                'sakura-accent': '#E0FFFF',
            },
            fontFamily: {
                'display': ['"Varela Round"', 'sans-serif'],
                'sans': ['"Nunito"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
