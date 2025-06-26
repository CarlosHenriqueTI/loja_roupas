"use client";

import { usePathname } from "next/navigation";
import Header  from "./Header";  // Mudança: importação nomeada
import Footer from "./Footer";  // Mudança: importação nomeada

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <>
      {!isAdminPage && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {!isAdminPage && <Footer />}
    </>
  );
}