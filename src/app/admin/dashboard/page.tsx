"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Users, 
  Package, 
  TrendingUp, 
  MessageSquare,
  Clock,
  AlertTriangle,
  BarChart3,
  UserPlus,
  ShoppingCart,
  Activity,
  Star,
  TrendingDown
} from "lucide-react";
import Link from "next/link";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { toast } from "sonner";

// Interface DashboardData
interface DashboardData {
  totalClientes: number;
  totalProdutos: number;
  totalInteracoes: number;
  vendasMes: number;
  clientesAtivos: number;
  atividadesRecentes: Array<{
    id: number;
    tipo: string;
    conteudo: string;
    data: string;
    cliente: { 
      id: number;
      nome: string; 
      email: string;
    };
    produto: { 
      id: number;
      nome: string; 
      preco: number | string;
    };
    avaliacao?: number;
  }>;
  produtosMaisInteragidos: Array<{
    produto: {
      id: number;
      nome: string;
      preco: number | string;
      imagemUrl?: string;
    };
    totalInteracoes: number;
  }>;
  graficoInteracoes: Array<{
    dia: string;
    quantidade: number;
  }>;
  interacoesPorTipo: Array<{
    tipo: string;
    quantidade: number;
  }>;
  tendencias: {
    clientes: { percentual: number; isUp: boolean };
    produtos: { percentual: number; isUp: boolean };
    interacoes: { percentual: number; isUp: boolean };
  };
  dataAtualizacao: string;
  periodo?: {
    inicio: string;
    fim: string;
  };
}

export default function AdminDashboard() {
  const { admin } = useAdminAuth();
  const permissions = useAdminPermissions();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalClientes: 0,
    totalProdutos: 0,
    totalInteracoes: 0,
    vendasMes: 0,
    clientesAtivos: 0,
    atividadesRecentes: [],
    produtosMaisInteragidos: [],
    graficoInteracoes: [],
    interacoesPorTipo: [],
    tendencias: {
      clientes: { percentual: 0, isUp: true },
      produtos: { percentual: 0, isUp: true },
      interacoes: { percentual: 0, isUp: true }
    },
    dataAtualizacao: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // ✅ CORRIGIR: Função de fetch com toast único
  const fetchDashboardData = useCallback(async (showToast = false) => {
    let loadingToast: string | number | undefined;
    
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Carregando dados do dashboard...');
      
      // ✅ Só mostrar toast se solicitado explicitamente
      if (showToast) {
        loadingToast = toast.loading('Atualizando dashboard...', {
          description: 'Coletando dados em tempo real'
        });
      }

      const response = await fetch("/api/admin/dashboard", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📡 Resposta da API dashboard:', result);
      
      if (result.success && result.data) {
        setDashboardData(result.data);
        console.log('✅ Dados do dashboard carregados:', result.data);
        
        // ✅ Só mostrar toast de sucesso se foi uma atualização manual
        if (showToast && loadingToast) {
          toast.dismiss(loadingToast);
          toast.success('Dashboard atualizado!', {
            description: `${result.data.totalClientes} clientes • ${result.data.totalProdutos} produtos • ${result.data.totalInteracoes} interações`,
            duration: 3000,
          });
        }
        
        // ✅ Para carregamento inicial, apenas log silencioso
        if (isInitialLoad) {
          console.log('✅ Dashboard carregado silenciosamente na inicialização');
          setIsInitialLoad(false);
        }
      } else {
        throw new Error(result.error || "Erro ao carregar dados do dashboard");
      }
      } catch (err) {
      console.error("❌ Erro ao carregar dados do dashboard:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      
      // ✅ Só mostrar toast de erro se foi uma tentativa explícita
      if (showToast && loadingToast) {
        toast.dismiss(loadingToast);
      }
      if (showToast) {
        toast.error('Erro ao atualizar dashboard', {
          description: errorMessage,
          action: {
            label: "Tentar novamente",
            onClick: () => fetchDashboardData(true)
          },
          duration: 5000,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isInitialLoad]);

  // ✅ CORRIGIR: useEffect sem toast no carregamento inicial
  useEffect(() => {
    if (admin) {
      // Carregamento inicial silencioso
      fetchDashboardData(false);
    }
  }, [admin, fetchDashboardData]);

  // ✅ CORRIGIR: Função de atualização manual com toast
  const handleManualRefresh = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Funções utilitárias
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  const formatPrice = (price: number | string): string => {
    try {
      const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
      
      if (isNaN(numericPrice)) {
        return 'R$ 0,00';
      }
      
      return `R$ ${numericPrice.toFixed(2).replace('.', ',')}`;
    } catch (error) {
      console.error('Erro ao formatar preço:', error, price);
      return 'R$ 0,00';
    }
  };

  const getActivityIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'compra':
        return <ShoppingCart className="h-4 w-4 text-green-600" />;
      case 'avaliacao':
        return <Star className="h-4 w-4 text-yellow-600" />;
      case 'comentario':
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'visualizacao':
        return <Activity className="h-4 w-4 text-blue-600" />;
      case 'curtida':
        return <Star className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'compra':
        return 'bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'avaliacao':
        return 'bg-yellow-100 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'comentario':
        return 'bg-purple-100 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800';
      case 'visualizacao':
        return 'bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      case 'curtida':
        return 'bg-red-100 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      default:
        return 'bg-gray-100 border-gray-200 dark:bg-gray-700/50 dark:border-gray-600';
    }
  };

  const getTrendIcon = (isUp: boolean) => {
    return isUp ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getTrendColor = (isUp: boolean) => {
    return isUp ? 'text-green-500' : 'text-red-500';
  };

  const getQuickActions = () => {
    const actions = [];

    if (permissions.canManageProducts) {
      actions.push({
        title: "Adicionar Produto",
        description: "Novo item ao catálogo",
        icon: <Package className="h-5 w-5" />,
        href: "/admin/produtos",
        color: "bg-green-500 hover:bg-green-600",
        onClick: () => {
          toast.info("Redirecionando para produtos...", {
            description: "Abrindo página de gerenciamento de produtos"
          });
        }
      });
    }

    if (permissions.canViewClients) {
      actions.push({
        title: "Ver Clientes",
        description: "Gerenciar usuários",
        icon: <Users className="h-5 w-5" />,
        href: "/admin/clientes",
        color: "bg-blue-500 hover:bg-blue-600",
        onClick: () => {
          toast.info("Redirecionando para clientes...", {
            description: "Abrindo página de gerenciamento de clientes"
          });
        }
      });
    }

    if (permissions.canViewReports) {
      actions.push({
        title: "Relatórios",
        description: "Análises e métricas",
        icon: <BarChart3 className="h-5 w-5" />,
        href: "/admin/relatorios",
        color: "bg-purple-500 hover:bg-purple-600",
        onClick: () => {
          toast.info("Redirecionando para relatórios...", {
            description: "Abrindo página de relatórios e análises"
          });
        }
      });
    }

    if (permissions.canManageAdmins) {
      actions.push({
        title: "Administradores",
        description: "Controle de acesso",
        icon: <UserPlus className="h-5 w-5" />,
        href: "/admin/administradores",
        color: "bg-red-500 hover:bg-red-600",
        onClick: () => {
          toast.info("Redirecionando para administradores...", {
            description: "Abrindo página de gerenciamento de administradores"
          });
        }
      });
    }

    return actions;
  };

  if (loading && isInitialLoad) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="w-20 h-20 border-4 border-purple-200 dark:border-purple-800 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Carregando Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Coletando dados do sistema...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Erro ao carregar dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          {error}
        </p>
        <button
          onClick={() => {
            // ✅ Toast único para retry
            toast.info('Tentando reconectar...', {
              description: 'Recarregando dados do dashboard'
            });
            fetchDashboardData(true);
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium transform hover:scale-105"
        >
          🔄 Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header de Boas-vindas */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Bem-vindo, {admin?.nome}! 👋
            </h1>
            <p className="text-purple-100 text-lg">
              Aqui estão os dados da sua loja ModaStyle
            </p>
            <p className="text-purple-200 text-sm mt-2">
              📊 Última atualização: {formatDate(dashboardData.dataAtualizacao)}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <BarChart3 className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.totalClientes.toLocaleString()}
              </div>
              <div className={`text-sm font-medium flex items-center gap-1 ${getTrendColor(dashboardData.tendencias.clientes.isUp)}`}>
                {getTrendIcon(dashboardData.tendencias.clientes.isUp)}
                {dashboardData.tendencias.clientes.percentual}%
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Total de Clientes
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Usuários registrados na plataforma
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.totalProdutos.toLocaleString()}
              </div>
              <div className={`text-sm font-medium flex items-center gap-1 ${getTrendColor(dashboardData.tendencias.produtos.isUp)}`}>
                {getTrendIcon(dashboardData.tendencias.produtos.isUp)}
                {dashboardData.tendencias.produtos.percentual}%
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Produtos Cadastrados
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Itens disponíveis no catálogo
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.totalInteracoes.toLocaleString()}
              </div>
              <div className={`text-sm font-medium flex items-center gap-1 ${getTrendColor(dashboardData.tendencias.interacoes.isUp)}`}>
                {getTrendIcon(dashboardData.tendencias.interacoes.isUp)}
                {dashboardData.tendencias.interacoes.percentual}%
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Total de Interações
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Engajamento dos usuários
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.vendasMes.toLocaleString()}
              </div>
              <div className="text-sm text-blue-500 font-medium">Este mês</div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Vendas do Mês
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Compras realizadas
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
              <Activity className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.clientesAtivos.toLocaleString()}
              </div>
              <div className="text-sm text-green-500 font-medium">30 dias</div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Clientes Ativos
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Com interações recentes
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Atividades Recentes */}
        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Atividades Recentes
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Últimas interações dos clientes
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {dashboardData.atividadesRecentes.length} atividades
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {dashboardData.atividadesRecentes.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhuma atividade recente
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    As interações dos clientes aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.atividadesRecentes.map((atividade) => (
                    <div
                      key={atividade.id}
                      className={`flex items-start space-x-4 p-4 rounded-xl border transition-colors hover:shadow-sm ${getActivityColor(atividade.tipo)}`}
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                        {getActivityIcon(atividade.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          <span className="capitalize font-semibold">{atividade.tipo}</span> de{' '}
                          <span className="font-semibold text-purple-600">{atividade.cliente.nome}</span>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Produto: <span className="font-medium">{atividade.produto.nome}</span>
                          {atividade.produto.preco && (
                            <span className="ml-2 text-green-600 font-medium">
                              {formatPrice(atividade.produto.preco)}
                            </span>
                          )}
                        </p>
                        {atividade.conteudo && atividade.conteudo.trim() !== '' && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
                            "{atividade.conteudo}"
                          </p>
                        )}
                        {atividade.avaliacao && (
                          <div className="flex items-center mt-1">
                            <Star className="h-3 w-3 text-yellow-500 mr-1" />
                            <span className="text-xs text-yellow-600 font-medium">
                              {atividade.avaliacao}/5 estrelas
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatDate(atividade.data)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ações Rápidas */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Ações Rápidas
            </h3>
            <div className="space-y-3">
              {getQuickActions().map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  onClick={action.onClick}
                  className={`flex items-center space-x-3 p-3 rounded-xl text-white ${action.color} transition-all transform hover:scale-105 shadow-md`}
                >
                  {action.icon}
                  <div>
                    <p className="font-medium">{action.title}</p>
                    <p className="text-sm opacity-90">{action.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Produtos Mais Populares */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Produtos Mais Populares
            </h3>
            <div className="space-y-3">
              {dashboardData.produtosMaisInteragidos.length === 0 ? (
                <div className="text-center py-4">
                  <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Nenhum produto com interações</p>
                </div>
              ) : (
                dashboardData.produtosMaisInteragidos.slice(0, 5).map((item, index) => (
                  <div key={item.produto.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.produto.nome}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.totalInteracoes} interações
                      </p>
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      {formatPrice(item.produto.preco)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Informações do Sistema */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sistema
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Seu Nível</span>
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {admin?.nivelAcesso}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Online
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Dados</span>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Tempo Real
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ CORRIGIR: Botão de Atualização com toast único */}
      <div className="flex justify-center">
        <button
          onClick={handleManualRefresh}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
        >
          <BarChart3 className="h-5 w-5" />
          {loading ? 'Atualizando...' : 'Atualizar Dados'}
        </button>
      </div>
    </div>
  );
}