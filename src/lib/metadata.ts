import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ModaStyle - Loja de Roupas Premium",
  description:
    "Descubra sua essência através da moda. Peças únicas para pessoas únicas com qualidade premium e design exclusivo.",
  keywords: ["moda", "roupas", "fashion", "estilo", "premium", "qualidade", "modastyle"],
  authors: [{ name: "ModaStyle Team" }],
  openGraph: {
    title: "ModaStyle - Loja de Roupas Premium",
    description:
      "Descubra sua essência através da moda. Peças únicas para pessoas únicas.",
    type: "website",
    locale: "pt_BR",
  },
  robots: "index, follow",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};