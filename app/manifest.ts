import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aura System",
    short_name: "Aura",
    description:
      "Aura System AI ajuda a monitorar movimentações financeiras e gerar insights com IA.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/IconAurian.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/IconAurian.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
