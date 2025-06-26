"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  endereco?: string;
  dataNascimento?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
          const userData = JSON.parse(storedUser);
          console.log('🔍 Usuário encontrado no localStorage:', userData);
          setUser(userData);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [mounted]);

  const login = async (email: string, senha: string) => {
    // ✅ Validação no frontend
    if (!email || !senha) {
      throw new Error('Email e senha são obrigatórios');
    }

    if (!email.includes('@')) {
      throw new Error('Email inválido');
    }

    if (senha.length < 3) {
      throw new Error('Senha deve ter pelo menos 3 caracteres');
    }

    setIsLoading(true);
    try {
      console.log('🔄 Tentando fazer login para:', email);
      
      const response = await fetch('/api/clientes/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          senha: senha.trim() 
        }),
      });

      const data = await response.json();
      console.log('📥 Resposta completa da API:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha na autenticação');
      }

      // ✅ Extrair dados do usuário e token de forma mais flexível
      let userData;
      let token;

      // Primeiro, tentar extrair o usuário
      if (data.data?.cliente) {
        userData = data.data.cliente;
      } else if (data.data?.user) {
        userData = data.data.user;
      } else if (data.cliente) {
        userData = data.cliente;
      } else if (data.user) {
        userData = data.user;
      } else if (data.data && typeof data.data === 'object' && data.data.id) {
        userData = data.data;
      } else {
        console.error('❌ Estrutura de usuário não reconhecida:', data);
        throw new Error('Dados do usuário não encontrados na resposta');
      }

      // Depois, tentar extrair o token
      if (data.data?.token) {
        token = data.data.token;
      } else if (data.token) {
        token = data.token;
      } else if (userData?.token) {
        token = userData.token;
      } else {
        // ✅ Se não tiver token, gerar um simples para permitir o login
        console.warn('⚠️ Token não fornecido pela API, gerando token temporário');
        token = `temp_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      console.log('👤 Dados do usuário extraídos:', userData);
      console.log('🔑 Token extraído:', token ? 'Presente' : 'Ausente');

      // ✅ Validar dados essenciais do usuário
      if (!userData) {
        throw new Error('Dados do usuário não encontrados');
      }

      // Garantir que o ID seja um número
      if (userData.id) {
        userData.id = typeof userData.id === 'string' ? parseInt(userData.id) : userData.id;
      }

      if (!userData.id || (!userData.nome && !userData.name) || !userData.email) {
        console.error('❌ Dados incompletos do usuário:', {
          id: userData.id,
          nome: userData.nome || userData.name,
          email: userData.email
        });
        throw new Error('Dados essenciais do usuário estão faltando (ID, nome ou email)');
      }

      // ✅ Normalizar dados do usuário
      const finalUserData = {
        ...userData,
        nome: userData.nome || userData.name || 'Usuário',
        id: userData.id
      };

      // ✅ Salvar no localStorage e atualizar estado
      localStorage.setItem('user', JSON.stringify(finalUserData));
      localStorage.setItem('token', token);
      setUser(finalUserData);
      
      console.log('✅ Login realizado com sucesso:', finalUserData.nome);
      console.log('💾 Dados salvos no localStorage');

    } catch (error) {
      console.error('❌ Erro no login:', error);
      // Limpar qualquer estado inconsistente
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    console.log('✅ Logout realizado com sucesso');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('✅ Dados do usuário atualizados:', updatedUser.nome);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  console.log('🔄 AuthProvider state:', {
    isAuthenticated: !!user,
    user: user ? { id: user.id, nome: user.nome, email: user.email } : null,
    isLoading
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}