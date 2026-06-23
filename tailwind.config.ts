/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#333333", light: "#555555", muted: "#888888" },
        paper: { DEFAULT: "#f5f5f5", alt: "#eaeaea", dark: "#d0d0d0" },
      },
      fontFamily: {
        kai: ['"KaiTi"', '"楷体"', '"STKaiti"', '"华文楷体"', "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      borderRadius: {
        ink: "4px",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        moyun: {
          ...require("daisyui/src/theming/themes")["light"],
          primary: "#333333",
          "primary-content": "#f5f5f5",
          secondary: "#555555",
          "secondary-content": "#f5f5f5",
          accent: "#888888",
          "accent-content": "#f5f5f5",
          neutral: "#555555",
          "neutral-content": "#f5f5f5",
          "base-100": "#f5f5f5",
          "base-200": "#eaeaea",
          "base-300": "#d0d0d0",
          "base-content": "#333333",
          info: "#888888",
          success: "#555555",
          warning: "#888888",
          error: "#555555",
        },
      },
    ],
    darkTheme: false,
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
};
