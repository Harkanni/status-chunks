import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      workbox: {
        globIgnores: ["**/ffmpeg/**"],
      },
      manifest: {
        name: "Status Splitter",
        short_name: "Status Splitter",
        description:
          "Split long videos into perfectly sized clips for WhatsApp, Instagram, Telegram and more — processed entirely on your device. No uploads, no cloud processing.",
        theme_color: "#09090B",
        background_color: "#09090B",
        display: "standalone",
        start_url: "/app/",
        scope: "/app/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "favicon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "favicon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },
  base: "/app/",
});
