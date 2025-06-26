import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Produtos - ModaStyle",
  description: "Explore nossa coleção completa de roupas premium com as últimas tendências da moda.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function ProdutosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}