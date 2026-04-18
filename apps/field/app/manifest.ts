import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VRK Field",
    short_name: "VRK Field",
    description: "PWA-first field engineer scaffold for the VRK Stage 02 platform baseline",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F7FB",
    theme_color: "#2F6BFF",
    lang: "ru",
  };
}
