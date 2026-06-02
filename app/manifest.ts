import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pantry AI",
    short_name: "Pantry AI",
    description: "Minimalist grocery inventory & predictive depletion tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0d0d",
    theme_color: "#0d0d0d",
    icons: [],
  }
}
