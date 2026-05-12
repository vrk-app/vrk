import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VRK",
    short_name: "VRK",
    description: "Рабочий веб-интерфейс VRK для управления компанией и оборудованием",
    start_url: "/login",
    display: "standalone",
    background_color: "#F5F7FB",
    theme_color: "#2F6BFF",
    lang: "ru",
    icons: [
      {
        src: "/brand/app-icons/vrk-web-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/app-icons/vrk-web-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
