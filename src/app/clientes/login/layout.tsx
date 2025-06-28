import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Login - Urban Icon",
  description: "Faça login em sua conta Urban Icon para acessar produtos exclusivos.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}