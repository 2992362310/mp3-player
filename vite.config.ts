import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const base = isGithubActions && repoName ? `/${repoName}/` : "/";

export default defineConfig({
  base,
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.svg", "icons/icon-512.svg"],
      manifest: {
        name: "MoYun 手绘播放器",
        short_name: "MoYun",
        description: "手绘风格多音源在线音乐播放器",
        theme_color: "#333333",
        background_color: "#fdf6e3",
        display: "standalone",
        orientation: "portrait",
        start_url: ".",
        scope: ".",
        icons: [
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
          {
            src: "icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === "https://music-api.gdstudio.xyz",
            handler: "NetworkFirst",
            options: {
              cacheName: "gd-music-api-cache",
              networkTimeoutSeconds: 6,
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24,
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
  },
});
