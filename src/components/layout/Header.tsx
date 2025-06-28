"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  Search, 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  Sun, 
  Moon,
  LogOut,
  Settings,
  ShoppingBag,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  // ✅ Fix hydration issue
  useEffect(() => {
    setMounted(true);
  }, []);

  // Detectar tema escuro
  useEffect(() => {
    if (!mounted) return;
    
    const theme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (theme === 'dark' || (!theme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, [mounted]);

  // ✅ Debug do estado de autenticação
  useEffect(() => {
    if (mounted) {
      console.log('🔍 Header - Estado de autenticação:', {
        isAuthenticated,
        user: user ? { id: user.id, nome: user.nome } : null,
        isLoading
      });
    }
  }, [mounted, isAuthenticated, user, isLoading]);

  // Alternar tema
  const toggleTheme = () => {
    if (!mounted) return;
    
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Lidar com logout
  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setIsMenuOpen(false);
    router.push('/');
  };

  // Navegar para login
  const handleLogin = () => {
    router.push('/clientes/login');
  };

  // Verificar se a página atual está ativa
  const isActive = (path: string) => {
    return pathname === path;
  };

  // Links de navegação
  const navLinks = [
    { href: '/', label: 'Início' },
    { href: '/produtos', label: 'Produtos' },
    { href: '/sobre', label: 'Sobre' },
    { href: '/contato', label: 'Contato' },
  ];

  // Função para obter iniciais do nome
  const getInitials = (nome: string) => {
    if (!nome) return 'U';
    return nome
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // ✅ Prevent rendering until mounted (avoid hydration mismatch)
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">UI</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Urban Icon
              </span>
            </div>
            <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-lg">UI</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Urban Icon
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 ${
                  isActive(link.href)
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <button
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              aria-label="Alternar tema"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Shopping Cart */}
            <button
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors relative"
              aria-label="Carrinho de compras"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </button>

            {/* User Menu */}
            <div className="relative">
              {isLoading ? (
                /* Loading State */
                <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              ) : isAuthenticated && user ? (
                <div>
                  {/* ✅ User Button - Agora mostra o nome corretamente */}
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(user.nome)}
                    </div>
                    <span className="hidden sm:block text-sm font-medium">
                      Olá, {user.nome.split(' ')[0]}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {getInitials(user.nome)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.nome}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Link
                        href="/perfil"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Meu Perfil</span>
                      </Link>
                      
                      <Link
                        href="/pedidos"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <ShoppingBag className="h-4 w-4" />
                        <span>Meus Pedidos</span>
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sair</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Login Button */
                <button
                  onClick={handleLogin}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:block text-sm font-medium">Entrar</span>
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              aria-label="Menu mobile"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                    isActive(link.href)
                      ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                      : 'text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile User Section */}
              {!isLoading && isAuthenticated && user ? (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <div className="px-3 py-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {getInitials(user.nome)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.nome}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    href="/perfil"
                    className="flex items-center space-x-2 px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                    <span>Meu Perfil</span>
                  </Link>
                  
                  <Link
                    href="/pedidos"
                    className="flex items-center space-x-2 px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    <span>Meus Pedidos</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              ) : !isLoading ? (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <button
                    onClick={() => {
                      handleLogin();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
                  >
                    <User className="h-5 w-5" />
                    <span>Entrar</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </nav>

      {/* Overlay para fechar menus ao clicar fora */}
      {(isMenuOpen || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsMenuOpen(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </header>
  );
}