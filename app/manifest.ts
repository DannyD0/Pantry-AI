import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pantry AI",
    short_name: "Pantry AI",
    description: "Minimalist grocery inventory & predictive depletion tracker",
    start_url: "/splash",
    display: "standalone",
    background_color: "#0d0d0d",
    theme_color: "#16a34a",
    orientation: "portrait",
    categories: ["food", "lifestyle", "utilities"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
