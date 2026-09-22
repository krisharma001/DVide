/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"SF Pro"',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'SFMono-Regular',
          'ui-monospace',
          'monospace',
        ],
      },
      colors: {
        ios: {
          blue: '#007AFF',
          green: '#34C759',
          red: '#FF3B30',
          orange: '#FF9500',
          yellow: '#FFCC00',
          purple: '#AF52DE',
          indigo: '#5856D6',
          teal: '#5AC8FA',
          gray: '#8E8E93',
          gray2: '#AEAEB2',
          gray3: '#C7C7CC',
          gray4: '#D1D1D6',
          gray5: '#E5E5EA',
          gray6: '#F2F2F7',
          card: {
            light: 'rgba(255, 255, 255, 0.72)',
            dark: 'rgba(28, 28, 30, 0.72)',
          },
          border: {
            light: 'rgba(0, 0, 0, 0.08)',
            dark: 'rgba(255, 255, 255, 0.12)',
          }
        }
      },
      boxShadow: {
        'glass-sm': '0 2px 8px -1px rgba(0, 0, 0, 0.05), 0 1px 3px -1px rgba(0, 0, 0, 0.03)',
        'glass-md': '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'glass-lg': '0 20px 40px -8px rgba(0, 0, 0, 0.12), 0 10px 20px -4px rgba(0, 0, 0, 0.06)',
        'ios-card': '0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.04)',
        'ios-float': '0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)',
      },
      backdropBlur: {
        'liquid': '24px',
        'glass': '20px',
      }
    },
  },
  plugins: [],
}
