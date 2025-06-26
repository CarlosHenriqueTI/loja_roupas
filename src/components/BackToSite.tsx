"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export function BackToSite() {
  return (
    <Link
      href="/"
      className="inline-flex items-center space-x-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors font-medium group"
    >
      <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
      <ShoppingBag className="h-4 w-4" />
      <span>Voltar ao Site</span>
    </Link>
  );
}