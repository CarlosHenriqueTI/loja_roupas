"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Admin {
  id: number;
  nome: string;
  email: string;
  nivelAcesso: 'EDITOR' | 'ADMIN' | 'SUPERADMIN';
  ultimoLogin?: Date;
}

interface AdminAuthContextType {
  admin: Admin | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (adminData: Admin, tokenData: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth deve ser usado dentro de AdminAuthProvider');
  }
  return context;
};

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const router = useRouter();

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      // ✅ USAR O MESMO NOME DE TOKEN
      const storedToken = localStorage.getItem('admin_token'); // CORRIGIDO
      
      if (!storedToken) {
        console.log('🔍 Nenhum token encontrado');
        setLoading(false);
        return false;
      }

      console.log('🔍 Verificando token admin...');
      
      const response = await fetch('/api/admin/me', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.admin) {
          console.log('✅ Token válido, admin autenticado:', data.admin.nome);
          setAdmin(data.admin);
          setToken(storedToken);
          setIsAuthenticated(true);
          setLoading(false);
          return true;
        }
      }

      console.log('❌ Token inválido ou expirado');
      localStorage.removeItem('admin_token'); // CORRIGIDO
      setAdmin(null);
      setToken(null);
      setIsAuthenticated(false);
      setLoading(false);
      return false;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      localStorage.removeItem('admin_token'); // CORRIGIDO
      setAdmin(null);
      setToken(null);
      setIsAuthenticated(false);
      setLoading(false);
      return false;
    }
  }, []);

  const login = useCallback((adminData: Admin, tokenData: string) => {
    console.log('🔑 Fazendo login do admin:', adminData.nome);
    setAdmin(adminData);
    setToken(tokenData);
    setIsAuthenticated(true);
    localStorage.setItem('admin_token', tokenData); // CORRIGIDO
    setLoading(false);
  }, []);

  // ✅ FUNÇÃO DE LOGOUT CORRIGIDA
  const logout = useCallback(async () => {
    try {
      console.log('👋 Iniciando logout do admin...');
      
      const currentToken = token || localStorage.getItem('admin_token'); // CORRIGIDO
      
      if (currentToken) {
        // Notificar o servidor sobre o logout
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        });
        
        console.log('✅ Logout notificado ao servidor');
      }
    } catch (error) {
      console.error('Erro ao fazer logout no servidor:', error);
    } finally {
      // ✅ LIMPAR ESTADO LOCAL
      setAdmin(null);
      setToken(null);
      setIsAuthenticated(false);
      localStorage.removeItem('admin_token'); // CORRIGIDO
      setLoading(false);
      
      console.log('👋 Admin deslogado - redirecionando para login');
      
      // ✅ REDIRECIONAR PARA LOGIN ADMIN
      router.push('/admin/login');
      
      // ✅ FORÇA ATUALIZAÇÃO DA PÁGINA PARA GARANTIR LIMPEZA COMPLETA
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 100);
    }
  }, [token, router]);

  // Verificar autenticação apenas uma vez ao inicializar
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (mounted) {
        await checkAuth();
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []); // Sem dependências para evitar loops

  const contextValue = React.useMemo(() => ({
    admin,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth
  }), [admin, token, loading, isAuthenticated, login, logout, checkAuth]);

  return (
    <AdminAuthContext.Provider value={contextValue}>
      {children}
    </AdminAuthContext.Provider>
  );
}