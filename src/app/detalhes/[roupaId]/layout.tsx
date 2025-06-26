import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Detalhes do Produto - ModaStyle",
  description: "Veja todos os detalhes do produto selecionado.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function DetalhesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}