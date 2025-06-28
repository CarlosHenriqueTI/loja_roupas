"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  BarChart3, 
  LogOut, 
  User, 
  ChevronDown,
  Shield,
  UserPlus,
  MessageSquare
} from 'lucide-react';
import { AdminAuthProvider, useAdminAuth } from '@/context/AdminAuthContext';
import { toast } from "sonner";

// Layout wrapper que usa o contexto
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { admin, loading, isAuthenticated, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    if (!loading) {
      setAuthChecked(true);
      
      // Se não está autenticado e não está na página de login, redirecionar
      if (!isAuthenticated && pathname !== "/admin/login") {
        console.log('❌ Admin não autenticado, redirecionando para login');
        toast.error("Acesso negado", {
          description: "Você precisa fazer login para continuar",
        });
        router.push('/admin/login');
        return;
      }

      // Debug: Log do admin autenticado
      if (isAuthenticated && admin) {
        console.log('✅ Admin autenticado:', admin.nome);
      }
    }
  }, [loading, isAuthenticated, authChecked, router, admin?.nome, pathname]);

  // ✅ FUNÇÃO DE LOGOUT MELHORADA
  const handleLogout = async () => {
    try {
      console.log('🔄 Executando logout...');
      
      const logoutToast = toast.loading("Fazendo logout...");
      
      await logout();
      
      toast.dismiss(logoutToast);
      toast.success("Logout realizado com sucesso!", {
        description: "Até logo!",
      });
      
      console.log('✅ Logout concluído');
    } catch (error) {
      console.error('❌ Erro durante logout:', error);
      toast.error("Erro ao fazer logout", {
        description: "Mas você será redirecionado mesmo assim",
      });
      // Mesmo com erro, redirecionar para login
      router.push('/admin/login');
    }
  };

  // Não aplicar o layout na página de login
  if (pathname === "/admin/login") {
    return <div className="min-h-screen">{children}</div>;
  }

  // Loading state - apenas enquanto verifica autenticação
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Carregando painel...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Verificando autenticação
          </p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado após verificação, não mostrar nada
  if (!isAuthenticated || !admin) {
    return null;
  }

  // Navegação
  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Produtos', href: '/admin/produtos', icon: Package },
    { name: 'Clientes', href: '/admin/clientes', icon: Users },
    { name: 'Relatórios', href: '/admin/relatorios', icon: BarChart3 },
    ...(admin.nivelAcesso === 'SUPERADMIN' ? [
      { name: 'Administradores', href: '/admin/administradores', icon: Shield }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 flex flex-col`}>
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              {sidebarOpen && (
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Urban Icon</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
                </div>
              )}
            </div>
          </div>

          {/* Navegação */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${sidebarOpen ? 'mr-3' : ''}`} />
                  {sidebarOpen && item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                {sidebarOpen && (
                  <>
                    <div className="ml-3 flex-1 text-left">
                      <p className="text-sm font-medium truncate">{admin.nome}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{admin.email}</p>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>

              {userMenuOpen && sidebarOpen && (
                <div className="absolute bottom-full mb-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {admin.nivelAcesso}
                </span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Layout principal que fornece o contexto
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  );
}