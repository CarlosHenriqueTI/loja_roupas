"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { 
  Users, 
  Crown, 
  Settings, 
  User, 
  Shield, 
  Search, 
  Filter,
  UserPlus,
  Edit3,
  Trash2,
  Calendar,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { toast } from "sonner";

interface Admin {
  id: number;
  nome: string;
  email: string;
  nivelAcesso: 'SUPERADMIN' | 'ADMIN' | 'EDITOR';
  emailVerificado: boolean;
  ativo: boolean;
  ultimoLogin?: string;
  ultimoLogout?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Administradores() {
  const { admin } = useAdminAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [nivelFilter, setNivelFilter] = useState<string>("all");
  
  // ✅ Refs para controlar toasts e evitar duplicidade
  const fetchingRef = useRef(false);
  const mountedRef = useRef(false);
  const toastRefs = useRef<{ [key: string]: string | number }>({});
  const initialLoadRef = useRef(false); // ✅ Controla se já houve carregamento inicial

  // ✅ Effect para controlar montagem
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      fetchingRef.current = false;
      initialLoadRef.current = false;
      // ✅ Limpar todos os toasts ao desmontar
      Object.values(toastRefs.current).forEach(toastId => {
        toast.dismiss(toastId);
      });
      toastRefs.current = {};
    };
  }, []);

  // ✅ Função para gerenciar toasts sem duplicidade
  const showToast = useCallback((type: 'loading' | 'success' | 'error' | 'info', key: string, title: string, description?: string, showToastUI = true) => {
    // ✅ Se showToastUI for false, não mostrar toast (para carregamento inicial silencioso)
    if (!showToastUI) {
      return null;
    }

    // ✅ Dismiss toast anterior com a mesma chave
    if (toastRefs.current[key]) {
      toast.dismiss(toastRefs.current[key]);
      delete toastRefs.current[key];
    }

    let toastId: string | number;
    
    switch (type) {
      case 'loading':
        toastId = toast.loading(title, { description });
        break;
      case 'success':
        toastId = toast.success(title, { description, duration: 3000 });
        break;
      case 'error':
        toastId = toast.error(title, { description, duration: 5000 });
        break;
      case 'info':
        toastId = toast.info(title, { description, duration: 2000 });
        break;
      default:
        return null;
    }
    
    toastRefs.current[key] = toastId;
    
    // ✅ Auto-limpar referência após o toast expirar
    const duration = type === 'error' ? 5000 : type === 'success' ? 3000 : type === 'loading' ? 10000 : 2000;
    setTimeout(() => {
      if (toastRefs.current[key] === toastId) {
        delete toastRefs.current[key];
      }
    }, duration);
    
    return toastId;
  }, []);

  // ✅ Função de buscar administradores otimizada
  const fetchAdmins = useCallback(async (isInitialLoad = false) => {
    // ✅ Evitar múltiplas requisições simultâneas
    if (fetchingRef.current) {
      console.log('🔄 [Frontend] Fetch já em andamento, ignorando...');
      return;
    }

    if (!mountedRef.current) {
      console.log('🚫 [Frontend] Componente não montado, ignorando fetch');
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('📡 [Frontend] Iniciando busca de administradores...', { isInitialLoad });
      
      // ✅ Toast de loading apenas se não for carregamento inicial OU se for um refresh manual
      const shouldShowToast = !isInitialLoad || initialLoadRef.current;
      
      if (shouldShowToast) {
        showToast('loading', 'fetchAdmins', 'Carregando administradores...', 'Buscando dados do sistema');
      }

      const token = localStorage.getItem('admin_token') || 
                    localStorage.getItem('adminToken') || 
                    localStorage.getItem('authToken');
      
      console.log('🔑 [Frontend] Token encontrado:', token ? 'Sim' : 'Não');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      console.log('📡 [Frontend] Fazendo requisição para /api/admin/administradores');

      const response = await fetch("/api/admin/administradores", {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 [Frontend] Status da resposta:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        if (response.status === 403) {
          throw new Error('Acesso negado. Apenas SUPERADMIN pode visualizar administradores.');
        }
        
        const errorData = await response.json();
        console.error('❌ [Frontend] Erro da API:', errorData);
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [Frontend] Dados recebidos:', { 
        success: data.success, 
        adminsCount: data.admins?.length || 0 
      });
      
      if (data.success && mountedRef.current) {
        setAdmins(data.admins || []);
        
        // ✅ Marcar que o carregamento inicial foi feito
        if (isInitialLoad) {
          initialLoadRef.current = true;
        }
        
        // ✅ Toast de sucesso apenas se mostrou loading
        if (shouldShowToast) {
          showToast('success', 'fetchAdmins', 'Administradores carregados!', 
            `${data.admins?.length || 0} administrador(es) encontrado(s)`);
        }
        
        console.log(`✅ [Frontend] ${data.admins?.length || 0} administradores carregados com sucesso`);
      } else {
        throw new Error(data.error || "Erro ao carregar administradores");
      }
    } catch (err) {
      console.error("❌ [Frontend] Erro ao carregar admins:", err);
      
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      
      if (mountedRef.current) {
        setError(errorMessage);
        
        // ✅ Tratar erros de autenticação
        if (errorMessage.includes('Token') || errorMessage.includes('Sessão') || errorMessage.includes('401')) {
          showToast('error', 'fetchAdmins', 'Sessão expirada', 'Redirecionando para login...');
          
          // ✅ Limpar tokens e redirecionar
          localStorage.removeItem('admin_token');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('authToken');
          
          setTimeout(() => {
            if (mountedRef.current) {
              window.location.href = '/admin/login';
            }
          }, 2000);
          
          return;
        }
        
        // ✅ Toast de erro sempre mostrar (importante para o usuário saber)
        showToast('error', 'fetchAdmins', 'Erro ao carregar administradores', errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [showToast]);

  // ✅ Effect para carregar administradores inicial (SEM TOAST)
  useEffect(() => {
    console.log('🔄 [Frontend] useEffect inicial - Admin:', !!admin, 'InitialLoad:', initialLoadRef.current);
    
    // ✅ Só carregar se admin existe e ainda não foi feito carregamento inicial
    if (admin && mountedRef.current && !initialLoadRef.current) {
      console.log('🚀 [Frontend] Executando carregamento inicial silencioso');
      fetchAdmins(true); // ✅ isInitialLoad = true (sem toast)
    }
  }, [admin?.id, fetchAdmins]);

  // ✅ Função de exclusão otimizada
  const handleDeleteAdmin = useCallback(async (adminId: number, adminNome: string) => {
    // ✅ Verificar se não está tentando deletar a si mesmo
    if (admin?.id === adminId) {
      showToast('error', 'deleteError', 'Ação não permitida', 
        'Você não pode excluir sua própria conta');
      return;
    }

    // ✅ Verificar permissões
    if (admin?.nivelAcesso !== 'SUPERADMIN') {
      showToast('error', 'deleteError', 'Acesso negado', 
        'Apenas SUPERADMIN pode excluir administradores');
      return;
    }

    // ✅ Modal de confirmação personalizado
    const confirmDelete = () => {
      return new Promise<boolean>((resolve) => {
        const confirmToast = toast.custom((t) => (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Confirmar Exclusão
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Deseja excluir o administrador:
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {adminNome}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  toast.dismiss(t);
                  resolve(false);
                }}
                className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t);
                  resolve(true);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        ), {
          duration: Infinity,
          position: 'top-center'
        });
      });
    };

    const shouldDelete = await confirmDelete();
    
    if (!shouldDelete) {
      showToast('info', 'deleteCancel', 'Exclusão cancelada', 'O administrador não foi removido');
      return;
    }

    try {
      // ✅ Toast de loading para exclusão
      showToast('loading', 'deleteAdmin', 'Excluindo administrador...', 
        `Removendo ${adminNome} do sistema`);

      const token = localStorage.getItem('admin_token') || 
                    localStorage.getItem('adminToken') || 
                    localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      console.log(`🗑️ [Frontend] Excluindo admin ID: ${adminId}`);

      const response = await fetch(`/api/admin/administradores/${adminId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 [Frontend] Status da resposta de exclusão:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [Frontend] Erro da API:', errorData);
        throw new Error(errorData.error || 'Erro ao excluir administrador');
      }

      const responseData = await response.json();
      console.log('✅ [Frontend] Admin excluído com sucesso:', responseData);

      // ✅ Atualizar lista local
      if (mountedRef.current) {
        setAdmins(prev => prev.filter(a => a.id !== adminId));
        
        // ✅ Toast de sucesso único
        showToast('success', 'deleteAdmin', 'Administrador excluído!', 
          `${adminNome} foi removido do sistema`);
      }
      
    } catch (error) {
      console.error("❌ [Frontend] Erro ao excluir admin:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // ✅ Toast de erro único
      showToast('error', 'deleteAdmin', 'Erro ao excluir administrador', errorMessage);
    }
  }, [admin, showToast]);

  // ✅ Função para refresh manual da lista (COM TOAST)
  const handleRefresh = useCallback(async () => {
    if (!fetchingRef.current && mountedRef.current) {
      console.log('🔄 [Frontend] Refresh manual solicitado');
      showToast('info', 'refresh', 'Atualizando lista...', 'Recarregando administradores');
      await fetchAdmins(false); // ✅ isInitialLoad = false (com toast)
    }
  }, [fetchAdmins, showToast]);

  // Filtrar administradores
  const filteredAdmins = admins.filter(adminItem => {
    const matchesSearch = adminItem.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adminItem.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = nivelFilter === "all" || adminItem.nivelAcesso === nivelFilter;
    return matchesSearch && matchesFilter;
  });

  // Funções de permissão
  const canDeleteAdmin = (adminToDelete: Admin) => {
    return admin?.nivelAcesso === 'SUPERADMIN' && 
           adminToDelete.id !== admin.id;
  };

  const canCreateAdmin = () => {
    return admin?.nivelAcesso === 'SUPERADMIN';
  };

  // Ícones e estilos por nível
  const getNivelIcon = (nivel: string) => {
    switch (nivel) {
      case 'SUPERADMIN': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'ADMIN': return <Settings className="h-4 w-4 text-blue-500" />;
      case 'EDITOR': return <User className="h-4 w-4 text-green-500" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'SUPERADMIN': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'ADMIN': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      case 'EDITOR': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nunca';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  };

  // ✅ Verificação de acesso melhorada
  if (!admin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Acesso Restrito
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Você precisa estar logado para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  // ✅ Verificação de permissão para visualizar administradores
  if (admin.nivelAcesso !== 'SUPERADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Apenas SUPERADMIN pode visualizar a lista de administradores.
          </p>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <Shield className="h-4 w-4 mr-2" />
            Seu nível: {admin.nivelAcesso}
          </div>
        </div>
      </div>
    );
  }

  // ✅ Loading silencioso na primeira carga
  if (loading && !initialLoadRef.current) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando administradores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Administradores
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gerencie os administradores do sistema ModaStyle
              </p>
            </div>
            
            {canCreateAdmin() && (
              <Link
                href="/admin/administradores/cadastro"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                onClick={() => {
                  showToast('info', 'redirect', 'Redirecionando...', 
                    'Abrindo formulário de cadastro');
                }}
              >
                <UserPlus className="h-5 w-5" />
                Novo Admin
              </Link>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Erro ao carregar dados
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={fetchingRef.current}
                className="ml-auto bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-1 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="md:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={nivelFilter}
                  onChange={(e) => setNivelFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white appearance-none cursor-pointer"
                >
                  <option value="all">Todos os níveis</option>
                  <option value="SUPERADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="EDITOR">Editor</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{admins.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center">
                <Crown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Super Admins</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {admins.filter(a => a.nivelAcesso === 'SUPERADMIN').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {admins.filter(a => a.nivelAcesso === 'ADMIN').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Editores</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {admins.filter(a => a.nivelAcesso === 'EDITOR').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admins List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredAdmins.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {admins.length === 0 ? 'Nenhum administrador encontrado' : 'Nenhum resultado encontrado'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {admins.length === 0 
                  ? 'Não há administradores cadastrados no sistema' 
                  : 'Tente ajustar os filtros de busca'}
              </p>
              {admins.length === 0 && canCreateAdmin() && (
                <Link
                  href="/admin/administradores/cadastro"
                  className="inline-flex items-center gap-2 mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Criar Primeiro Admin
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Administrador
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nível de Acesso
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Último Login
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAdmins.map((adminItem) => (
                    <tr key={adminItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {adminItem.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {adminItem.nome}
                              {adminItem.id === admin?.id && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  Você
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {adminItem.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getNivelColor(adminItem.nivelAcesso)}`}>
                          {getNivelIcon(adminItem.nivelAcesso)}
                          {adminItem.nivelAcesso}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {adminItem.ativo && adminItem.emailVerificado ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-green-600 dark:text-green-400">Ativo</span>
                            </>
                          ) : adminItem.ativo ? (
                            <>
                              <XCircle className="h-4 w-4 text-orange-500" />
                              <span className="text-sm text-orange-600 dark:text-orange-400">Pendente</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-red-600 dark:text-red-400">Inativo</span>
                            </>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {formatDate(adminItem.ultimoLogin || '')}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {formatDate(adminItem.createdAt)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2 justify-end">
                          {(admin?.nivelAcesso === 'SUPERADMIN' || admin?.id === adminItem.id) && (
                            <button
                              onClick={() => {
                                showToast('info', 'editInfo', 'Em desenvolvimento', 
                                  'Funcionalidade de edição será adicionada em breve');
                              }}
                              className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                              title="Editar administrador"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}
                          
                          {canDeleteAdmin(adminItem) && (
                            <button
                              onClick={() => handleDeleteAdmin(adminItem.id, adminItem.nome)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                              title="Excluir administrador"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleRefresh}
            disabled={fetchingRef.current}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
          >
            <div className={`${fetchingRef.current ? 'animate-spin' : ''}`}>🔄</div>
            {fetchingRef.current ? 'Atualizando...' : 'Atualizar Lista'}
          </button>
        </div>
      </div>
    </div>
  );
}