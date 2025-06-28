"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Shield,
  Info
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { toast } from "sonner";

interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  dataNascimento?: string;
  createdAt: string;
  updatedAt: string;
  ativo: boolean;
  status: string; // Novo campo status
  _count?: {
    interacoes: number;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function AdminClientes() {
  const { admin } = useAdminAuth();
  const permissions = useAdminPermissions();
  
  // ✅ Ref para controlar se o componente foi montado
  const mountedRef = useRef(false);
  const fetchingRef = useRef(false);
  
  // Estados principais
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("todos");
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  // Estados de modais
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);

  // Estados de carregamento específicos
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ✅ Função para obter token de autenticação
  const getAuthToken = useCallback(() => {
    const token = localStorage.getItem('adminToken') || 
                  localStorage.getItem('admin_token') || 
                  localStorage.getItem('authToken');
    
    console.log('🔑 [Frontend] Token encontrado:', token ? 'Sim' : 'Não');
    return token;
  }, []);

  // ✅ Função de buscar clientes corrigida para evitar loops
  const fetchClientes = useCallback(async () => {
    // ✅ Evitar múltiplas requisições simultâneas
    if (fetchingRef.current) {
      console.log('🔄 [Frontend] Fetch já em andamento, ignorando...');
      return;
    }

    // ✅ Verificar se o componente ainda está montado
    if (!mountedRef.current) {
      console.log('🚫 [Frontend] Componente não montado, ignorando fetch');
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      
      const startTime = Date.now();
      console.log('📋 [Frontend] Iniciando carregamento de clientes...');
      
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }
      
      // ✅ Parâmetros otimizados
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        search: searchTerm.length >= 2 ? searchTerm : '',
        filter: selectedFilter
      });

      console.log('📡 [Frontend] Enviando requisição:', `/api/admin/clientes?${params}`);

      const response = await fetch(`/api/admin/clientes?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const requestTime = Date.now() - startTime;
      console.log(`📡 [Frontend] Resposta recebida em ${requestTime}ms - Status: ${response.status}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        if (response.status === 403) {
          throw new Error('Acesso negado. Verifique suas permissões.');
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📡 [Frontend] Dados recebidos:', {
        success: data.success,
        clientesCount: data.data?.length || 0,
        totalItems: data.pagination?.totalItems || 0
      });
      
      if (data.success) {
        // ✅ Verificar novamente se o componente está montado antes de atualizar estado
        if (mountedRef.current) {
          setClientes(data.data || []);
          
          if (data.pagination) {
            setPagination(data.pagination);
          }
          
          console.log(`✅ [Frontend] ${data.data?.length || 0} clientes carregados com sucesso`);
        }
      } else {
        throw new Error(data.error || 'Erro ao carregar clientes');
      }
    } catch (error) {
      console.error("❌ [Frontend] Erro ao carregar clientes:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('Token') || errorMessage.includes('Sessão') || errorMessage.includes('401')) {
        toast.error("Sessão expirada", {
          description: "Redirecionando para login...",
          duration: 3000
        });
        
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('authToken');
        
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
        
        return;
      }
      
      if (errorMessage.includes('Acesso negado')) {
        toast.error("Acesso negado", {
          description: "Você não tem permissão para visualizar clientes",
          duration: 4000
        });
        return;
      }
      
      // ✅ Só mostrar toast se o componente ainda estiver montado
      if (mountedRef.current) {
        toast.error("Erro ao carregar clientes", {
          description: errorMessage,
          action: {
            label: "Tentar novamente",
            onClick: () => fetchClientes()
          }
        });
        
        setClientes([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [pagination.currentPage, pagination.itemsPerPage, searchTerm, selectedFilter, getAuthToken]);

  // ✅ Função de exclusão otimizada
  const handleDeleteCliente = useCallback(async (cliente: Cliente) => {
    if (!cliente) {
      toast.error("Cliente inválido");
      return;
    }

    if (!permissions.canDeleteClients) {
      const accessLevel = permissions.getAccessLevel();
      toast.error("Acesso negado", {
        description: `Seu nível (${accessLevel.level}) não permite excluir clientes. Apenas SUPERADMIN pode realizar esta ação.`,
        duration: 5000
      });
      return;
    }

    setDeletingId(cliente.id);
    
    const loadingToast = toast.loading(`Excluindo cliente...`, {
      description: `Removendo ${cliente.nome} do sistema`
    });

    try {
      console.log(`🗑️ [Frontend] Excluindo cliente: ${cliente.nome} (ID: ${cliente.id})`);
      
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }
      
      const response = await fetch(`/api/admin/clientes/${cliente.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 [Frontend] Status da resposta de exclusão:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ [Frontend] Cliente excluído com sucesso:', responseData);
        
        // ✅ Atualizar lista local
        setClientes(prev => prev.filter(c => c.id !== cliente.id));
        
        // ✅ Atualizar paginação
        setPagination(prev => ({
          ...prev,
          totalItems: Math.max(0, prev.totalItems - 1),
          totalPages: Math.ceil(Math.max(0, prev.totalItems - 1) / prev.itemsPerPage)
        }));
        
        toast.dismiss(loadingToast);
        toast.success("Cliente excluído com sucesso! 🗑️", {
          description: `${cliente.nome} foi removido permanentemente do sistema`,
          duration: 4000
        });
        
        setShowDeleteModal(false);
        setClienteParaExcluir(null);
        
      } else {
        let errorMessage = 'Erro ao excluir cliente';
        
        try {
          const errorData = await response.json();
          console.error('❌ [Frontend] Erro da API:', errorData);
          
          if (response.status === 401) {
            errorMessage = 'Sessão expirada. Faça login novamente.';
            return;
          }
          
          if (response.status === 403) {
            errorMessage = 'Permissão insuficiente para excluir clientes.';
          }
          
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('❌ [Frontend] Erro ao parsear resposta:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error("❌ [Frontend] Erro ao excluir cliente:", error);
      
      toast.dismiss(loadingToast);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao excluir cliente';
      
      toast.error("Erro ao excluir cliente", {
        description: errorMessage,
        duration: 5000
      });
    } finally {
      setDeletingId(null);
    }
  }, [permissions, getAuthToken]);

  // ✅ Função para confirmar exclusão
  const confirmDeleteCliente = useCallback((cliente: Cliente) => {
    if (!permissions.canDeleteClients) {
      const accessLevel = permissions.getAccessLevel();
      toast.error("Operação não permitida", {
        description: `Seu nível (${accessLevel.level}) não permite excluir clientes`,
        duration: 4000
      });
      return;
    }
    
    setClienteParaExcluir(cliente);
    setShowDeleteModal(true);
  }, [permissions]);

  // ✅ Effect para controlar montagem do componente
  useEffect(() => {
    mountedRef.current = true;
    console.log('🔄 [Frontend] Componente montado');
    
    return () => {
      mountedRef.current = false;
      fetchingRef.current = false;
      console.log('🔄 [Frontend] Componente desmontado');
    };
  }, []);

  // ✅ Effect para carregar clientes inicial (sem dependências que causam loops)
  useEffect(() => {
    console.log('🔄 [Frontend] useEffect inicial - Admin:', !!admin, 'CanView:', permissions.canViewClients);
    if (admin && permissions.canViewClients && mountedRef.current) {
      fetchClientes();
    }
  }, [admin?.id, permissions.canViewClients]); // ✅ Usar admin.id em vez de admin completo

  // ✅ Effect para mudança de página
  useEffect(() => {
    if (mountedRef.current && admin && permissions.canViewClients) {
      fetchClientes();
    }
  }, [pagination.currentPage]); // ✅ Apenas página

  // ✅ Effect para mudança de filtro
  useEffect(() => {
    if (mountedRef.current && admin && permissions.canViewClients) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      // ✅ Pequeno delay para garantir que o estado foi atualizado
      setTimeout(() => {
        if (mountedRef.current) {
          fetchClientes();
        }
      }, 50);
    }
  }, [selectedFilter]); // ✅ Apenas filtro

  // ✅ Effect para busca com debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (mountedRef.current && admin && permissions.canViewClients) {
        if (searchTerm === "" || searchTerm.length >= 2) {
          setPagination(prev => ({ ...prev, currentPage: 1 }));
          // ✅ Pequeno delay para garantir que o estado foi atualizado
          setTimeout(() => {
            if (mountedRef.current) {
              fetchClientes();
            }
          }, 50);
        }
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]); // ✅ Apenas searchTerm

  // ✅ Função para mudança de página sem chamar fetchClientes diretamente
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.currentPage) {
      console.log(`📄 [Frontend] Mudando para página ${newPage}`);
      setPagination(prev => ({ ...prev, currentPage: newPage }));
      toast.info(`Página ${newPage}`);
    }
  }, [pagination.totalPages, pagination.currentPage]);

  // Funções utilitárias
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  const getClienteStatus = (cliente: Cliente) => {
    // Usar o novo campo status em vez de lógica complexa
    const statusInfo = {
      'ATIVO': { 
        label: 'Ativo', 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
      },
      'INATIVO': { 
        label: 'Inativo', 
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-400' 
      },
      'SUSPENSO': { 
        label: 'Suspenso', 
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' 
      },
      'BLOQUEADO': { 
        label: 'Bloqueado', 
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
      },
      'PENDENTE': { 
        label: 'Pendente', 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
      }
    };

    return statusInfo[cliente.status] || statusInfo['INATIVO'];
  };

  // ✅ Verificação de acesso melhorada
  if (!permissions.canViewClients) {
    const accessLevel = permissions.getAccessLevel();
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <Shield className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Acesso Negado
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4">
          Você não tem permissão para visualizar a lista de clientes.
        </p>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${accessLevel.badge}`}>
          <Shield className="h-4 w-4 mr-2" />
          {accessLevel.level}
        </div>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
          {accessLevel.description}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Clientes
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie os clientes da sua loja
            </p>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${permissions.getAccessLevel().badge}`}>
              <Shield className="h-3 w-3 mr-1" />
              {permissions.getAccessLevel().level}
            </div>
          </div>
        </div>
        
        {permissions.canCreateClients ? (
          <button
            onClick={() => {
              setClienteSelecionado(null);
              setModoEdicao(false);
              setShowClienteModal(true);
              toast.info("Abrindo formulário de novo cliente");
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
          >
            <UserPlus className="h-5 w-5" />
            Novo Cliente
          </button>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <Info className="h-4 w-4" />
            <span className="text-sm">Sem permissão para criar clientes</span>
          </div>
        )}
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou email (mín. 2 caracteres)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 dark:bg-gray-700 dark:text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20"
              >
                <option value="todos">Todos os clientes</option>
                <option value="ativos">Apenas ativos</option>
                <option value="inativos">Apenas inativos</option>
                <option value="muito_ativos">Muito ativos (10+ interações)</option>
                <option value="com_interacoes">Com interações</option>
                <option value="sem_atividade">Sem atividade</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {pagination.totalItems}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {clientes.filter(c => c.ativo).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {clientes.filter(c => !c.ativo).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Inativos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {clientes.filter(c => c.ativo && (c._count?.interacoes || 0) >= 10).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Muito Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {clientes.filter(c => c.ativo && (c._count?.interacoes || 0) > 0 && (c._count?.interacoes || 0) < 10).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Com Atividade</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {clientes.filter(c => c.ativo && (c._count?.interacoes || 0) === 0).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sem Atividade</div>
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando clientes...</p>
            </div>
          </div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm 
                ? 'Tente ajustar os filtros ou termo de busca'
                : 'Quando clientes se cadastrarem, eles aparecerão aqui'
              }
            </p>
            {permissions.canCreateClients && !searchTerm && (
              <button
                onClick={() => {
                  setClienteSelecionado(null);
                  setModoEdicao(false);
                  setShowClienteModal(true);
                }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                <UserPlus className="h-5 w-5" />
                Cadastrar Primeiro Cliente
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">
                      Contato
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">
                      Interações
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">
                      Cadastro
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {clientes.map((cliente) => {
                    const status = getClienteStatus(cliente);
                    const isDeleting = deletingId === cliente.id;
                    
                    return (
                      <tr key={cliente.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isDeleting ? 'opacity-50' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {cliente.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {cliente.nome}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ID: {cliente.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-900 dark:text-white">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              {cliente.email}
                            </div>
                            {cliente.telefone && (
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                {cliente.telefone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {cliente._count?.interacoes || 0}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">
                              {(cliente._count?.interacoes || 0) === 1 ? 'interação' : 'interações'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="text-gray-900 dark:text-white">
                              {formatDate(cliente.createdAt)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {permissions.canViewClientDetails && (
                              <button
                                onClick={() => {
                                  setClienteSelecionado(cliente);
                                  setModoEdicao(false);
                                  setShowClienteModal(true);
                                  toast.info(`Visualizando perfil de ${cliente.nome}`);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                title="Visualizar detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            
                            {permissions.canEditClients && (
                              <button
                                onClick={() => {
                                  setClienteSelecionado(cliente);
                                  setModoEdicao(true);
                                  setShowClienteModal(true);
                                  toast.info(`Editando cliente ${cliente.nome}`);
                                }}
                                className="p-2 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                                title="Editar cliente"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            
                            {permissions.canDeleteClients ? (
                              <button
                                onClick={() => confirmDeleteCliente(cliente)}
                                disabled={isDeleting}
                                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Excluir cliente (apenas SUPERADMIN)"
                              >
                                {isDeleting ? (
                                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            ) : (
                              <div className="p-2 text-gray-300 cursor-not-allowed" title="Sem permissão para excluir">
                                <Trash2 className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ✅ Paginação corrigida */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando {Math.min((pagination.currentPage - 1) * pagination.itemsPerPage + 1, pagination.totalItems)} até {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} de {pagination.totalItems} clientes
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage <= 1}
                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <span className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                    {pagination.currentPage} de {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && clienteParaExcluir && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
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
              
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Você está prestes a excluir o cliente:
                </p>
                <div className="font-medium text-gray-900 dark:text-white">
                  {clienteParaExcluir.nome}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {clienteParaExcluir.email}
                </div>
                {clienteParaExcluir._count && clienteParaExcluir._count.interacoes > 0 && (
                  <div className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                    ⚠️ Este cliente possui {clienteParaExcluir._count.interacoes} interação(ões) que também serão removidas
                  </div>
                )}
                
                <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <Shield className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      Operação restrita a SUPERADMIN
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setClienteParaExcluir(null);
                    toast.info("Exclusão cancelada");
                  }}
                  disabled={deletingId === clienteParaExcluir.id}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteCliente(clienteParaExcluir)}
                  disabled={deletingId === clienteParaExcluir.id || !permissions.canDeleteClients}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deletingId === clienteParaExcluir.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Excluir Cliente
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}