/** @type {import('tailwindcss').Config} */
/** Tailwind v4 主要走 CSS；此文件仅作内容扫描参考，不再依赖 DaisyUI */
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
        mono: ['"Share Tech Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
