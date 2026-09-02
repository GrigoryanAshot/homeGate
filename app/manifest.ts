import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Touch SmartGate",
    short_name: "SmartGate",
    description: "Smart rollup gate control",
    start_url: "/smartgate-demo",
    scope: "/",
    id: "/smartgate-demo",
    display: "standalone",
    orientation: "portrait",
    background_color: "#e8f2ff",
    theme_color: "#e8f2ff",
    lang: "hy",
    icons: [
      {
        src: "/img/logo5-pwa-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/img/logo5-pwa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/img/logo5-pwa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
