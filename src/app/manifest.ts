import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Language buddy",
    short_name: "Language buddy",
    start_url: "/",
    display: "standalone",
    // --color-gray-50, the page background. Literals, like themeColor in layout.tsx:
    // the browser reads the manifest before any stylesheet resolves.
    background_color: "#eff6fd",
    theme_color: "#eff6fd",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
