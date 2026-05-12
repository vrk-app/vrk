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
    icons: [
      {
        src: "/brand/app-icons/vrk-field-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/app-icons/vrk-field-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
