import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const base = isGithubActions && repoName ? `/${repoName}/` : "/";
const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf-8")) as {
  version: string;
};

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/icon-192.svg",
        "icons/icon-512.svg",
        "offline.html",
      ],
      manifest: {
        name: "墨韵 MoYun",
        short_name: "墨韵",
        description: "多音源在线音乐播放器，支持主题与 PWA",
        theme_color: "#333333",
        background_color: "#fdf6e3",
        display: "standalone",
        orientation: "any",
        start_url: ".",
        scope: ".",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "icons/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
        ],
      },
      workbox: {
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,svg,ico,png,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === "https://music-api.gdstudio.xyz",
            handler: "NetworkFirst",
            options: {
              cacheName: "gd-music-api-cache",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "font",
            handler: "CacheFirst",
            options: {
              cacheName: "font-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@components": resolve(__dirname, "src/components"),
      "@core": resolve(__dirname, "src/core"),
      "@assets": resolve(__dirname, "src/assets"),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/howler")) return "howler";
          if (
            id.includes("node_modules/vue") ||
            id.includes("node_modules/pinia") ||
            id.includes("node_modules/@vue")
          ) {
            return "vue";
          }
        },
      },
    },
  },
});
