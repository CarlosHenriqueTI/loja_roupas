"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Facebook, 
  Instagram, 
  Twitter,
  Heart,
  ArrowUp
} from "lucide-react";

export default function Footer() {
  const [mounted, setMounted] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!mounted) {
    return null;
  }

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">UI</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Urban Icon
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              Sua loja de roupas favorita com as melhores tendências da moda. 
              Qualidade, estilo e preços que cabem no seu bolso.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Links Rápidos
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/produtos" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">
                  Produtos
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href="/contato" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Categorias */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Categorias
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/produtos?categoria=feminino" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">
                  Moda Feminina
                </Link>
              </li>
              <li>
                <Link href="/produtos?categoria=masculino" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">
                  Moda Masculina
                </Link>
              </li>
              <li>
                <Link href="/produtos?categoria=acessorios" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">
                  Acessórios
                </Link>
              </li>
              <li>
                <Link href="/produtos?categoria=calcados" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">
                  Calçados
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Contato
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  Rua das Flores, 123<br />
                  Centro, São Paulo - SP
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  (11) 99999-9999
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  contato@UrbanIcon.com
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Linha divisória */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © 2024 Urban Icon. Todos os direitos reservados.
            </p>
            <div className="flex items-center space-x-1 mt-4 sm:mt-0">
              <span className="text-gray-600 dark:text-gray-400 text-sm">
                Feito com
              </span>
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">
                pela nossa equipe
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Voltar ao Topo */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-110 z-50"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </footer>
  );
}