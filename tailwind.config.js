/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Custom dark theme palette
                dark: {
                    50: '#f7f7f8',
                    100: '#ececf1',
                    200: '#d9d9e3',
                    300: '#c5c5d2',
                    400: '#acacbe',
                    500: '#8e8ea0',
                    600: '#6e6e80',
                    700: '#4a4a5a',
                    800: '#343541',
                    900: '#202123',
                    950: '#0d0d0f',
                },
                accent: {
                    primary: '#6366f1',
                    secondary: '#8b5cf6',
                    success: '#22c55e',
                    warning: '#f59e0b',
                    danger: '#ef4444',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-in-out',
                'slide-in': 'slideIn 0.3s ease-out',
                'pulse-glow': 'pulseGlow 2s infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideIn: {
                    '0%': { transform: 'translateX(-10px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.5)' },
                    '50%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.8)' },
                },
            },
        },
    },
    plugins: [],
}
