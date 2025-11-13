import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aura System",
    short_name: "Aura",
    description:
      "Aura System AI ajuda a monitorar movimentações financeiras e gerar insights com IA.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    icons: [
      {
        src: "/IconAurian.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
