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
  AlertTriangle,
  UserCheck,
  UserX,
  Clock4,
  Ban
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { toast } from "sonner";

// ✅ Interface atualizada com campo status
interface Admin {
  id: number;
  nome: string;
  email: string;
  nivelAcesso: 'SUPERADMIN' | 'ADMIN' | 'EDITOR';
  emailVerificado: boolean;
  ativo: boolean;
  status: 'ATIVO' | 'INATIVO' | 'SUSPENSO' | 'BLOQUEADO' | 'PENDENTE' | 'EXCLUIDO';
  ultimoLogin?: string;
  ultimoLogout?: string;
  createdAt: string;
  updatedAt: string;
}

// ✅ NOVO: Utilitários para status
const STATUS_CONFIG = {
  ATIVO: {
    label: 'Ativo',
    icon: CheckCircle,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    description: 'Conta ativa e funcionando'
  },
  INATIVO: {
    label: 'Inativo',
    icon: XCircle,
    color: 'text-gray-600 bg-gray-100 dark:bg-gray-700/50 dark:text-gray-400',
    description: 'Conta temporariamente desativada'
  },
  SUSPENSO: {
    label: 'Suspenso',
    icon: AlertTriangle,
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
    description: 'Conta suspensa por violação'
  },
  BLOQUEADO: {
    label: 'Bloqueado',
    icon: Ban,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    description: 'Conta bloqueada permanentemente'
  },
  PENDENTE: {
    label: 'Pendente',
    icon: Clock4,
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
    description: 'Aguardando verificação de email'
  },
  EXCLUIDO: {
    label: 'Excluído',
    icon: UserX,
    color: 'text-red-800 bg-red-200 dark:bg-red-900/50 dark:text-red-300',
    description: 'Conta marcada para exclusão'
  }
} as const;

export default function Administradores() {
  const { admin } = useAdminAuth();
  
  // ✅ TODOS OS ESTADOS NO INÍCIO
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [nivelFilter, setNivelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [editFormData, setEditFormData] = useState({
    nome: '',
    email: '',
    nivelAcesso: 'EDITOR' as 'SUPERADMIN' | 'ADMIN' | 'EDITOR',
    status: 'ATIVO' as 'ATIVO' | 'INATIVO' | 'SUSPENSO' | 'BLOQUEADO' | 'PENDENTE' | 'EXCLUIDO',
    senha: '',
    confirmarSenha: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  // ✅ TODOS OS REFS NO INÍCIO
  const fetchingRef = useRef(false);
  const mountedRef = useRef(false);
  const toastRefs = useRef<{ [key: string]: string | number }>({});
  const initialLoadRef = useRef(false);

  // ✅ TODOS OS EFFECTS E CALLBACKS NO INÍCIO
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      fetchingRef.current = false;
      initialLoadRef.current = false;
      Object.values(toastRefs.current).forEach(toastId => {
        toast.dismiss(toastId);
      });
      toastRefs.current = {};
    };
  }, []);

  const showToast = useCallback((type: 'loading' | 'success' | 'error' | 'info', key: string, title: string, description?: string, showToastUI = true) => {
    if (!showToastUI) {
      return null;
    }

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
    
    const duration = type === 'error' ? 5000 : type === 'success' ? 3000 : type === 'loading' ? 10000 : 2000;
    setTimeout(() => {
      if (toastRefs.current[key] === toastId) {
        delete toastRefs.current[key];
      }
    }, duration);
    
    return toastId;
  }, []);

  const fetchAdmins = useCallback(async (isInitialLoad = false) => {
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
        
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `Erro ${response.status}: ${response.statusText}` };
        }
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
        
        if (isInitialLoad) {
          initialLoadRef.current = true;
        }
        
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
        
        if (errorMessage.includes('Token') || errorMessage.includes('Sessão') || errorMessage.includes('401')) {
          showToast('error', 'fetchAdmins', 'Sessão expirada', 'Redirecionando para login...');
          
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
        
        showToast('error', 'fetchAdmins', 'Erro ao carregar administradores', errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [showToast]);

  const handleChangeStatus = useCallback(async (adminId: number, adminNome: string, novoStatus: string) => {
    if (admin?.nivelAcesso !== 'SUPERADMIN') {
      showToast('error', 'statusError', 'Acesso negado', 
        'Apenas SUPERADMIN pode alterar status de administradores');
      return;
    }

    if (admin?.id === adminId && novoStatus !== 'ATIVO') {
      showToast('error', 'statusError', 'Ação não permitida', 
        'Você não pode desativar sua própria conta');
      return;
    }

    const statusConfig = STATUS_CONFIG[novoStatus as keyof typeof STATUS_CONFIG];
    
    const confirmChange = () => {
      return new Promise<boolean>((resolve) => {
        const confirmToast = toast.custom((t) => (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <statusConfig.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Alterar Status
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {statusConfig.description}
                </p>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Alterar status de <strong>{adminNome}</strong> para:
              </p>
              <p className={`font-medium inline-flex items-center gap-1 px-2 py-1 rounded mt-1 text-xs ${statusConfig.color}`}>
                <statusConfig.icon className="h-3 w-3" />
                {statusConfig.label}
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
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        ), {
          duration: Infinity,
          position: 'top-center'
        });
      });
    };

    const shouldChange = await confirmChange();
    
    if (!shouldChange) {
      showToast('info', 'statusCancel', 'Alteração cancelada', 'O status não foi modificado');
      return;
    }

    try {
      showToast('loading', 'changeStatus', 'Alterando status...', 
        `Atualizando status de ${adminNome}`);

      const token = localStorage.getItem('admin_token') || 
                    localStorage.getItem('adminToken') || 
                    localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      console.log(`🔄 [Frontend] Alterando status do admin ID: ${adminId} para: ${novoStatus}`);

      const response = await fetch(`/api/admin/administradores/${adminId}/status`, {
        method: "PATCH",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: novoStatus })
      });

      console.log('📡 [Frontend] Status da resposta de alteração:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [Frontend] Erro da API:', errorData);
        throw new Error(errorData.error || 'Erro ao alterar status');
      }

      const responseData = await response.json();
      console.log('✅ [Frontend] Status alterado com sucesso:', responseData);

      if (mountedRef.current) {
        setAdmins(prev => prev.map(a => 
          a.id === adminId 
            ? { ...a, status: novoStatus as any }
            : a
        ));
        
        showToast('success', 'changeStatus', 'Status alterado!', 
          `${adminNome} agora está ${statusConfig.label.toLowerCase()}`);
      }
      
    } catch (error) {
      console.error("❌ [Frontend] Erro ao alterar status:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      showToast('error', 'changeStatus', 'Erro ao alterar status', errorMessage);
    }
  }, [admin, showToast]);

  const handleDeleteAdmin = useCallback(async (adminId: number, adminNome: string) => {
    if (admin?.id === adminId) {
      showToast('error', 'deleteError', 'Ação não permitida', 
        'Você não pode excluir sua própria conta');
      return;
    }

    if (admin?.nivelAcesso !== 'SUPERADMIN') {
      showToast('error', 'deleteError', 'Acesso negado', 
        'Apenas SUPERADMIN pode excluir administradores');
      return;
    }

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

      if (mountedRef.current) {
        setAdmins(prev => prev.filter(a => a.id !== adminId));
        
        showToast('success', 'deleteAdmin', 'Administrador excluído!', 
          `${adminNome} foi removido do sistema`);
      }
      
    } catch (error) {
      console.error("❌ [Frontend] Erro ao excluir admin:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      showToast('error', 'deleteAdmin', 'Erro ao excluir administrador', errorMessage);
    }
  }, [admin, showToast]);

  const handleRefresh = useCallback(async () => {
    if (!fetchingRef.current && mountedRef.current) {
      console.log('🔄 [Frontend] Refresh manual solicitado');
      showToast('info', 'refresh', 'Atualizando lista...', 'Recarregando administradores');
      await fetchAdmins(false);
    }
  }, [fetchAdmins, showToast]);

  // ✅ FUNÇÕES PARA EDIÇÃO - MOVIDAS PARA APÓS OS OUTROS CALLBACKS
  const canEditAdmin = useCallback((adminToEdit: Admin) => {
    const isOwnAccount = admin?.id === adminToEdit.id;
    const isSuperAdmin = admin?.nivelAcesso === 'SUPERADMIN';
    
    return isOwnAccount || isSuperAdmin;
  }, [admin]);

  const handleEditAdmin = useCallback((adminToEdit: Admin) => {
    if (!canEditAdmin(adminToEdit)) {
      showToast('error', 'editError', 'Acesso negado', 
        'Você não tem permissão para editar este administrador');
      return;
    }

    setEditingAdmin(adminToEdit);
    setEditFormData({
      nome: adminToEdit.nome,
      email: adminToEdit.email,
      nivelAcesso: adminToEdit.nivelAcesso,
      status: adminToEdit.status,
      senha: '',
      confirmarSenha: ''
    });
  }, [canEditAdmin, showToast]);

  const handleCloseEditModal = useCallback(() => {
    setEditingAdmin(null);
    setEditFormData({
      nome: '',
      email: '',
      nivelAcesso: 'EDITOR',
      status: 'ATIVO',
      senha: '',
      confirmarSenha: ''
    });
    setEditLoading(false);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingAdmin) return;

    // Validações
    if (!editFormData.nome.trim()) {
      showToast('error', 'editValidation', 'Nome obrigatório', 
        'Por favor, preencha o nome do administrador');
      return;
    }

    if (!editFormData.email.trim() || !editFormData.email.includes('@')) {
      showToast('error', 'editValidation', 'Email inválido', 
        'Por favor, forneça um email válido');
      return;
    }

    if (editFormData.senha && editFormData.senha.length < 6) {
      showToast('error', 'editValidation', 'Senha muito curta', 
        'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (editFormData.senha !== editFormData.confirmarSenha) {
      showToast('error', 'editValidation', 'Senhas não coincidem', 
        'A confirmação de senha deve ser igual à senha');
      return;
    }

    try {
      setEditLoading(true);
      
      showToast('loading', 'saveEdit', 'Salvando alterações...', 
        `Atualizando dados de ${editFormData.nome}`);

      const token = localStorage.getItem('admin_token') || 
                    localStorage.getItem('adminToken') || 
                    localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const updateData: any = {
        nome: editFormData.nome.trim(),
        email: editFormData.email.trim().toLowerCase(),
      };

      // Apenas incluir senha se foi fornecida
      if (editFormData.senha) {
        updateData.senha = editFormData.senha;
      }

      // SUPERADMIN pode alterar nível e status de outros
      if (admin?.nivelAcesso === 'SUPERADMIN' && admin.id !== editingAdmin.id) {
        updateData.nivelAcesso = editFormData.nivelAcesso;
        updateData.status = editFormData.status;
      }

      console.log(`🔄 [Frontend] Editando admin ID: ${editingAdmin.id}`, updateData);

      const response = await fetch(`/api/admin/administradores/${editingAdmin.id}`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      console.log('📡 [Frontend] Status da resposta de edição:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [Frontend] Erro da API:', errorData);
        throw new Error(errorData.error || 'Erro ao editar administrador');
      }

      const responseData = await response.json();
      console.log('✅ [Frontend] Admin editado com sucesso:', responseData);

      // Atualizar lista local
      if (mountedRef.current) {
        setAdmins(prev => prev.map(a => 
          a.id === editingAdmin.id 
            ? { ...a, ...responseData.data }
            : a
        ));
        
        showToast('success', 'saveEdit', 'Administrador atualizado!', 
          `${editFormData.nome} foi atualizado com sucesso`);
        
        handleCloseEditModal();
      }
      
    } catch (error) {
      console.error("❌ [Frontend] Erro ao editar admin:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      showToast('error', 'saveEdit', 'Erro ao salvar', errorMessage);
    } finally {
      setEditLoading(false);
    }
  }, [editingAdmin, editFormData, admin, handleCloseEditModal, showToast]);

  // ✅ EFFECT PARA CARREGAMENTO INICIAL
  useEffect(() => {
    console.log('🔄 [Frontend] useEffect inicial - Admin:', !!admin, 'InitialLoad:', initialLoadRef.current);
    
    if (admin && mountedRef.current && !initialLoadRef.current) {
      console.log('🚀 [Frontend] Executando carregamento inicial silencioso');
      fetchAdmins(true);
    }
  }, [admin?.id, fetchAdmins]);

  // ✅ FILTRO ATUALIZADO com status
  const filteredAdmins = admins.filter(adminItem => {
    const matchesSearch = adminItem.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adminItem.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNivel = nivelFilter === "all" || adminItem.nivelAcesso === nivelFilter;
    const matchesStatus = statusFilter === "all" || adminItem.status === statusFilter;
    return matchesSearch && matchesNivel && matchesStatus;
  });

  // Funções de permissão
  const canDeleteAdmin = (adminToDelete: Admin) => {
    return admin?.nivelAcesso === 'SUPERADMIN' && 
           adminToDelete.id !== admin.id;
  };

  const canChangeStatus = (adminToChange: Admin) => {
    return admin?.nivelAcesso === 'SUPERADMIN' && 
           (adminToChange.id !== admin.id || adminToChange.status === 'ATIVO');
  };

  const canCreateAdmin = () => {
    return admin?.nivelAcesso === 'SUPERADMIN';
  };

  // ✅ FUNÇÃO ATUALIZADA para status
  const getStatusInfo = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.INATIVO;
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

  // ✅ ESTATÍSTICAS ATUALIZADAS
  const adminStats = {
    total: admins.length,
    ativo: admins.filter(a => a.status === 'ATIVO').length,
    pendente: admins.filter(a => a.status === 'PENDENTE').length,
    inativo: admins.filter(a => a.status === 'INATIVO').length,
    superadmin: admins.filter(a => a.nivelAcesso === 'SUPERADMIN').length,
    adminLevel: admins.filter(a => a.nivelAcesso === 'ADMIN').length,
    editor: admins.filter(a => a.nivelAcesso === 'EDITOR').length
  };

  // Coloque os returns condicionais DEPOIS dos hooks!
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
                Gerencie os administradores do sistema Urban Icon
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

        {/* ✅ FILTROS ATUALIZADOS com Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
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
            <div className="lg:w-48">
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
            {/* ✅ NOVO: Filtro por Status */}
            <div className="lg:w-48">
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white appearance-none cursor-pointer"
                >
                  <option value="all">Todos os status</option>
                  <option value="ATIVO">Ativo</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="INATIVO">Inativo</option>
                  <option value="SUSPENSO">Suspenso</option>
                  <option value="BLOQUEADO">Bloqueado</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ STATS ATUALIZADAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{adminStats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ativos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{adminStats.ativo}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center">
                <Clock4 className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{adminStats.pendente}</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{adminStats.superadmin}</p>
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
                  {filteredAdmins.map((adminItem) => {
                    const statusInfo = getStatusInfo(adminItem.status);
                    
                    function renderEditButton(adminItem: Admin): import("react").ReactNode {
                      throw new Error("Function not implemented.");
                    }

                    return (
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

                        {/* ✅ STATUS ATUALIZADO */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              <statusInfo.icon className="h-3 w-3" />
                              {statusInfo.label}
                            </span>
                            {/* Dropdown para alterar status */}
                            {canChangeStatus(adminItem) && (
                              <div className="relative group">
                                <button className="text-gray-400 hover:text-gray-600 p-1">
                                  ⚙️
                                </button>
                                <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                                  <div className="p-2 space-y-1 min-w-[140px]">
                                    {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                                      <button
                                        key={status}
                                        onClick={() => handleChangeStatus(adminItem.id, adminItem.nome, status)}
                                        className={`w-full text-left px-3 py-2 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                                          adminItem.status === status ? 'bg-gray-100 dark:bg-gray-700' : ''
                                        }`}
                                      >
                                        <config.icon className="h-3 w-3" />
                                        {config.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
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
                                onClick={() => handleEditAdmin(adminItem)}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ✅ MODAL DE EDIÇÃO - MANTENHA NO FINAL DO COMPONENTE */}
        {editingAdmin && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <Edit3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Editar Administrador
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {admin?.id === editingAdmin.id ? 'Editando sua conta' : `Editando ${editingAdmin.nome}`}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleCloseEditModal}
                  disabled={editLoading}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={editFormData.nome}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Digite o nome completo"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    disabled={editLoading}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Digite o email"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    disabled={editLoading}
                  />
                </div>

                {/* Nível de Acesso */}
                {admin?.nivelAcesso === 'SUPERADMIN' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nível de Acesso
                    </label>
                    <select
                      value={editFormData.nivelAcesso}
                      onChange={(e) => setEditFormData(prev => ({ 
                        ...prev, 
                        nivelAcesso: e.target.value as any 
                      }))}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      disabled={editLoading}
                    >
                      <option value="EDITOR">Editor</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPERADMIN">Super Admin</option>
                    </select>
                  </div>
                )}

                {/* Status */}
                {admin?.nivelAcesso === 'SUPERADMIN' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status da Conta
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData(prev => ({ 
                        ...prev, 
                        status: e.target.value as any 
                      }))}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      disabled={editLoading}
                    >
                      <option value="ATIVO">Ativo</option>
                      <option value="INATIVO">Inativo</option>
                      <option value="PENDENTE">Pendente</option>
                      <option value="SUSPENSO">Suspenso</option>
                      <option value="BLOQUEADO">Bloqueado</option>
                    </select>
                  </div>
                )}

                {/* Senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nova Senha (opcional)
                  </label>
                  <input
                    type="password"
                    value={editFormData.senha}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, senha: e.target.value }))}
                    placeholder="Digite uma nova senha (mínimo 6 caracteres)"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    disabled={editLoading}
                  />
                  {editFormData.senha && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Deixe em branco para manter a senha atual
                    </p>
                  )}
                </div>

                {/* Confirmar Senha */}
                {editFormData.senha && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirmar Nova Senha *
                    </label>
                    <input
                      type="password"
                      value={editFormData.confirmarSenha}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                      placeholder="Confirme a nova senha"
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      disabled={editLoading}
                    />
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleCloseEditModal}
                  disabled={editLoading}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading || !editFormData.nome.trim() || !editFormData.email.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {editLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}