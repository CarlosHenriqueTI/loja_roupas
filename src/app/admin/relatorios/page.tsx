"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  VictoryChart, 
  VictoryLine, 
  VictoryBar, 
  VictoryArea, 
  VictoryPie,
  VictoryAxis, 
  VictoryTheme, 
  VictoryTooltip,
  VictoryContainer
} from "victory";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { toast } from "sonner";

interface RelatorioData {
  produtosPorMes: Array<{ mes: string; quantidade: number }>;
  clientesPorMes: Array<{ mes: string; quantidade: number }>;
  interacoesPorTipo: Array<{ tipo: string; quantidade: number }>;
  produtosMaisInteragidos: Array<{ nome: string; interacoes: number }>;
  evolucaoMensal: Array<{ mes: string; produtos: number; clientes: number; interacoes: number }>;
  estatisticasGerais: {
    totalProdutos: number;
    totalClientes: number;
    totalInteracoes: number;
    produtoMaisPopular: string;
    mesComMaisAtividade: string;
    clientesVerificados?: number;
    clientesNaoVerificados?: number;
    categorias?: number;
    ticketMedio?: string;
    periodo?: string;
    dataInicio?: string;
    dataFim?: string;
  };
}

interface FiltroData {
  periodo: "7d" | "30d" | "90d" | "1y" | "all";
  categoria: "all" | "produtos" | "clientes" | "interacoes";
}

export default function AdminRelatorios() {
  // ✅ HOOKS DE AUTENTICAÇÃO
  const { admin } = useAdminAuth();
  const permissions = useAdminPermissions();

  const [relatorioData, setRelatorioData] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltroData>({
    periodo: "30d",
    categoria: "all"
  });
  type TabId = "visao-geral" | "produtos" | "clientes" | "interacoes";
  const [activeTab, setActiveTab] = useState<TabId>("visao-geral");

  // ✅ Refs para controlar toasts e evitar duplicidade
  const fetchingRef = useRef(false);
  const mountedRef = useRef(false);
  const toastRefs = useRef<{ [key: string]: string | number }>({});
  const initialLoadRef = useRef(false);
  const exportingRef = useRef<{ [key: string]: boolean }>({});

  // ✅ Effect para controlar montagem
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      fetchingRef.current = false;
      initialLoadRef.current = false;
      exportingRef.current = {};
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
    const duration = type === 'error' ? 5000 : type === 'success' ? 3000 : type === 'loading' ? 15000 : 2000;
    setTimeout(() => {
      if (toastRefs.current[key] === toastId) {
        delete toastRefs.current[key];
      }
    }, duration);
    
    return toastId;
  }, []);

  // ✅ Função de buscar dados de relatório otimizada
  const fetchRelatorioData = useCallback(async (isInitialLoad = false, isSilent = false) => {
    if (!admin) return;
    
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
      
      console.log(`📊 [Frontend] Buscando relatórios para período: ${filtros.periodo}`, { isInitialLoad, isSilent });
      
      // ✅ Toast de loading apenas se não for carregamento inicial OU se for um refresh manual
      const shouldShowToast = !isSilent && (!isInitialLoad || initialLoadRef.current);
      
      if (shouldShowToast) {
        showToast('loading', 'fetchRelatorios', 
          `Carregando relatórios para ${formatarPeriodo(filtros.periodo).toLowerCase()}...`,
          'Coletando dados analíticos do sistema'
        );
      }
      
      const url = `/api/admin/relatorios?periodo=${filtros.periodo}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📡 [Frontend] Resposta da API de relatórios:', data);
      
      if (data.success && data.data && mountedRef.current) {
        setRelatorioData(data.data);
        
        // ✅ Marcar que o carregamento inicial foi feito
        if (isInitialLoad) {
          initialLoadRef.current = true;
        }
        
        console.log('✅ [Frontend] Dados de relatório carregados:', data.data);
        
        // ✅ Toast de sucesso apenas se mostrou loading
        if (shouldShowToast) {
          showToast('success', 'fetchRelatorios', "Relatórios carregados com sucesso!", 
            `Dados de ${formatarPeriodo(filtros.periodo).toLowerCase()} foram atualizados`);
        }
      } else {
        throw new Error(data.message || "Dados inválidos recebidos da API");
      }

    } catch (error) {
      console.error("❌ [Frontend] Erro ao carregar dados do relatório:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      if (mountedRef.current) {
        setError(errorMessage);
        
        // ✅ Toast de erro sempre mostrar (importante para o usuário saber)
        showToast('error', 'fetchRelatorios', "Erro ao carregar relatórios", errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [filtros.periodo, admin, showToast]);

  // ✅ Effect para carregar dados inicial (SEM TOAST na primeira carga)
  useEffect(() => {
    console.log('🔄 [Frontend] useEffect inicial - Admin:', !!admin, 'InitialLoad:', initialLoadRef.current);
    
    // ✅ Só carregar se admin existe e ainda não foi feito carregamento inicial
    if (admin && mountedRef.current && !initialLoadRef.current) {
      console.log('🚀 [Frontend] Executando carregamento inicial silencioso');
      fetchRelatorioData(true, true); // ✅ isInitialLoad = true, isSilent = true (sem toast)
    }
  }, [admin?.id, fetchRelatorioData]);

  // ✅ Effect para mudança de período (COM TOAST)
  useEffect(() => {
    // ✅ Só executar se já houve carregamento inicial
    if (admin && mountedRef.current && initialLoadRef.current) {
      console.log('🔄 [Frontend] Período alterado, recarregando dados...');
      fetchRelatorioData(false, false); // ✅ não é inicial, não é silencioso (com toast)
    }
  }, [filtros.periodo]); // ✅ Apenas período como dependência

  // ✅ Função para atualizar período sem chamar fetch diretamente
  const handlePeriodoChange = useCallback((novoPeriodo: FiltroData["periodo"]) => {
    if (novoPeriodo !== filtros.periodo) {
      console.log(`📊 [Frontend] Alterando período de ${filtros.periodo} para ${novoPeriodo}`);
      
      showToast('info', 'periodoChange', `Período alterado para ${formatarPeriodo(novoPeriodo)}`, 
        'Recarregando dados...');
      
      setFiltros(prev => ({ ...prev, periodo: novoPeriodo }));
    }
  }, [filtros.periodo, showToast]);

  // ✅ Função para refresh manual (COM TOAST)
  const handleRefreshRelatorios = useCallback(async () => {
    if (!fetchingRef.current && mountedRef.current) {
      console.log('🔄 [Frontend] Refresh manual solicitado');
      showToast('info', 'manualRefresh', 'Atualizando relatórios...', 'Buscando dados mais recentes');
      await fetchRelatorioData(false, false); // ✅ não é inicial, não é silencioso (com toast)
    }
  }, [fetchRelatorioData, showToast]);

  // ✅ FUNÇÃO CORRIGIDA PARA EXPORTAR RELATÓRIOS SEM DUPLICIDADE
  const exportarRelatorio = useCallback(async (formato: "pdf" | "excel" | "csv") => {
    const exportKey = `export_${formato}`;
    
    // ✅ Verificar se já está exportando este formato
    if (exportingRef.current[exportKey]) {
      console.log(`🚫 [Frontend] Já exportando ${formato}, ignorando...`);
      return;
    }

    try {
      if (!relatorioData) {
        showToast('error', 'exportError', 'Nenhum dado disponível para exportação', 
          'Carregue os dados primeiro antes de exportar');
        return;
      }

      exportingRef.current[exportKey] = true;

      // ✅ Toast de loading durante a exportação
      showToast('loading', exportKey, `Gerando relatório em formato ${formato.toUpperCase()}...`,
        'Preparando arquivo para download');

      const dataAtual = new Date();
      const nomeArquivo = `relatorio_modastyle_${filtros.periodo}_${dataAtual.toISOString().split('T')[0]}`;

      // ✅ Pequeno delay para mostrar o loading
      await new Promise(resolve => setTimeout(resolve, 500));

      if (formato === "csv") {
        // ✅ GERAR CSV REAL
        let csvContent = `"Relatório ModaStyle - ${formatarPeriodo(filtros.periodo)}"\n`;
        csvContent += `"Data de Exportação","${dataAtual.toLocaleDateString('pt-BR')}"\n`;
        csvContent += `"Período","${formatarPeriodo(filtros.periodo)}"\n\n`;

        // Estatísticas Gerais
        csvContent += `"=== ESTATÍSTICAS GERAIS ==="\n`;
        csvContent += `"Total de Produtos","${relatorioData.estatisticasGerais.totalProdutos}"\n`;
        csvContent += `"Total de Clientes","${relatorioData.estatisticasGerais.totalClientes}"\n`;
        csvContent += `"Total de Interações","${relatorioData.estatisticasGerais.totalInteracoes}"\n`;
        csvContent += `"Produto Mais Popular","${relatorioData.estatisticasGerais.produtoMaisPopular}"\n`;
        csvContent += `"Mês com Mais Atividade","${relatorioData.estatisticasGerais.mesComMaisAtividade}"\n\n`;

        // Produtos por Mês
        if (relatorioData.produtosPorMes.length > 0) {
          csvContent += `"=== PRODUTOS CADASTRADOS POR MÊS ==="\n`;
          csvContent += `"Mês","Quantidade"\n`;
          relatorioData.produtosPorMes.forEach(item => {
            csvContent += `"${item.mes}","${item.quantidade}"\n`;
          });
          csvContent += `\n`;
        }

        // Clientes por Mês
        if (relatorioData.clientesPorMes.length > 0) {
          csvContent += `"=== NOVOS CLIENTES POR MÊS ==="\n`;
          csvContent += `"Mês","Quantidade"\n`;
          relatorioData.clientesPorMes.forEach(item => {
            csvContent += `"${item.mes}","${item.quantidade}"\n`;
          });
          csvContent += `\n`;
        }

        // Interações por Tipo
        if (relatorioData.interacoesPorTipo.length > 0) {
          csvContent += `"=== INTERAÇÕES POR TIPO ==="\n`;
          csvContent += `"Tipo","Quantidade"\n`;
          relatorioData.interacoesPorTipo.forEach(item => {
            csvContent += `"${item.tipo}","${item.quantidade}"\n`;
          });
          csvContent += `\n`;
        }

        // Produtos Mais Interagidos
        if (relatorioData.produtosMaisInteragidos.length > 0) {
          csvContent += `"=== PRODUTOS MAIS POPULARES ==="\n`;
          csvContent += `"Posição","Produto","Interações"\n`;
          relatorioData.produtosMaisInteragidos.forEach((item, index) => {
            csvContent += `"${index + 1}","${item.nome}","${item.interacoes}"\n`;
          });
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${nomeArquivo}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

      } else if (formato === "excel") {
        // ✅ GERAR ARQUIVO EXCEL (TSV para compatibilidade)
        let tsvContent = `Relatório ModaStyle - ${formatarPeriodo(filtros.periodo)}\t\t\t\n`;
        tsvContent += `Data de Exportação\t${dataAtual.toLocaleDateString('pt-BR')}\t\t\t\n`;
        tsvContent += `Período\t${formatarPeriodo(filtros.periodo)}\t\t\t\n\n`;

        // Estatísticas Gerais
        tsvContent += `=== ESTATÍSTICAS GERAIS ===\t\t\t\n`;
        tsvContent += `Métrica\tValor\t\t\n`;
        tsvContent += `Total de Produtos\t${relatorioData.estatisticasGerais.totalProdutos}\t\t\n`;
        tsvContent += `Total de Clientes\t${relatorioData.estatisticasGerais.totalClientes}\t\t\n`;
        tsvContent += `Total de Interações\t${relatorioData.estatisticasGerais.totalInteracoes}\t\t\n`;
        tsvContent += `Produto Mais Popular\t${relatorioData.estatisticasGerais.produtoMaisPopular}\t\t\n`;
        tsvContent += `Mês com Mais Atividade\t${relatorioData.estatisticasGerais.mesComMaisAtividade}\t\t\n\n`;

        // Evolução Mensal
        if (relatorioData.evolucaoMensal.length > 0) {
          tsvContent += `=== EVOLUÇÃO MENSAL ===\t\t\t\n`;
          tsvContent += `Mês\tProdutos\tClientes\tInterações\n`;
          relatorioData.evolucaoMensal.forEach(item => {
            tsvContent += `${item.mes}\t${item.produtos}\t${item.clientes}\t${item.interacoes}\n`;
          });
          tsvContent += `\n`;
        }

        // Produtos Mais Populares
        if (relatorioData.produtosMaisInteragidos.length > 0) {
          tsvContent += `=== TOP PRODUTOS ===\t\t\t\n`;
          tsvContent += `Posição\tProduto\tInterações\t\n`;
          relatorioData.produtosMaisInteragidos.slice(0, 10).forEach((item, index) => {
            tsvContent += `${index + 1}\t${item.nome}\t${item.interacoes}\t\n`;
          });
        }

        const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${nomeArquivo}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

      } else if (formato === "pdf") {
        // ✅ GERAR HTML PARA PDF
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Relatório ModaStyle</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #8b5cf6; padding-bottom: 15px; }
              .header h1 { color: #8b5cf6; margin: 0; font-size: 28px; }
              .header p { margin: 5px 0; color: #666; }
              .section { margin: 25px 0; }
              .section h2 { color: #8b5cf6; border-left: 4px solid #8b5cf6; padding-left: 10px; margin-bottom: 15px; }
              .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
              .stat-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb; }
              .stat-card h3 { margin: 0 0 8px 0; color: #8b5cf6; font-size: 14px; }
              .stat-card .value { font-size: 24px; font-weight: bold; color: #1f2937; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
              th { background: #8b5cf6; color: white; font-weight: bold; }
              tr:nth-child(even) { background: #f9fafb; }
              .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 15px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🛍️ Relatório ModaStyle</h1>
              <p><strong>Período:</strong> ${formatarPeriodo(filtros.periodo)}</p>
              <p><strong>Data de Exportação:</strong> ${dataAtual.toLocaleDateString('pt-BR')} às ${dataAtual.toLocaleTimeString('pt-BR')}</p>
            </div>

            <div class="section">
              <h2>📊 Estatísticas Gerais</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <h3>Total de Produtos</h3>
                  <div class="value">${relatorioData.estatisticasGerais.totalProdutos.toLocaleString('pt-BR')}</div>
                </div>
                <div class="stat-card">
                  <h3>Total de Clientes</h3>
                  <div class="value">${relatorioData.estatisticasGerais.totalClientes.toLocaleString('pt-BR')}</div>
                </div>
                <div class="stat-card">
                  <h3>Total de Interações</h3>
                  <div class="value">${relatorioData.estatisticasGerais.totalInteracoes.toLocaleString('pt-BR')}</div>
                </div>
                <div class="stat-card">
                  <h3>Produto Mais Popular</h3>
                  <div class="value" style="font-size: 16px;">${relatorioData.estatisticasGerais.produtoMaisPopular}</div>
                </div>
              </div>
            </div>

            ${relatorioData.produtosMaisInteragidos.length > 0 ? `
            <div class="section">
              <h2>🏆 Top 10 Produtos Mais Populares</h2>
              <table>
                <thead>
                  <tr>
                    <th style="width: 60px;">Posição</th>
                    <th>Produto</th>
                    <th style="width: 120px;">Interações</th>
                  </tr>
                </thead>
                <tbody>
                  ${relatorioData.produtosMaisInteragidos.slice(0, 10).map((produto, index) => `
                    <tr>
                      <td style="text-align: center; font-weight: bold;">${index + 1}º</td>
                      <td>${produto.nome}</td>
                      <td style="text-align: center;">${produto.interacoes}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            ${relatorioData.evolucaoMensal.length > 1 ? `
            <div class="section">
              <h2>📈 Evolução Mensal</h2>
              <table>
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Produtos</th>
                    <th>Clientes</th>
                    <th>Interações</th>
                  </tr>
                </thead>
                <tbody>
                  ${relatorioData.evolucaoMensal.map(item => `
                    <tr>
                      <td>${item.mes}</td>
                      <td style="text-align: center;">${item.produtos}</td>
                      <td style="text-align: center;">${item.clientes}</td>
                      <td style="text-align: center;">${item.interacoes}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            ${relatorioData.interacoesPorTipo.length > 0 ? `
            <div class="section">
              <h2>💬 Interações por Tipo</h2>
              <table>
                <thead>
                  <tr>
                    <th>Tipo de Interação</th>
                    <th style="width: 150px;">Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  ${relatorioData.interacoesPorTipo.map(item => `
                    <tr>
                      <td>${item.tipo}</td>
                      <td style="text-align: center;">${item.quantidade}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            <div class="footer">
              <p>Relatório gerado automaticamente pelo sistema ModaStyle</p>
              <p>© ${dataAtual.getFullYear()} ModaStyle - Todos os direitos reservados</p>
            </div>
          </body>
          </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${nomeArquivo}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // ✅ Toast específico para PDF com instruções
        showToast('success', exportKey, "Arquivo HTML gerado!", 
          "Para converter para PDF: Abra o arquivo > Ctrl+P > Salvar como PDF");
        
      }
      
      // ✅ Toast de sucesso para CSV e Excel
      if (formato !== "pdf") {
        showToast('success', exportKey, `Relatório ${formato.toUpperCase()} exportado com sucesso!`, 
          `Arquivo foi baixado para sua máquina`);
      }
      
    } catch (error) {
      console.error("❌ [Frontend] Erro ao exportar relatório:", error);
      showToast('error', exportKey, "Erro ao exportar relatório", 
        "Ocorreu um erro durante a exportação. Tente novamente.");
    } finally {
      exportingRef.current[exportKey] = false;
    }
  }, [relatorioData, filtros.periodo, showToast]);

  const formatarPeriodo = (periodo: string) => {
    switch (periodo) {
      case "7d": return "Últimos 7 dias";
      case "30d": return "Últimos 30 dias";
      case "90d": return "Últimos 90 dias";
      case "1y": return "Último ano";
      case "all": return "Todo período";
      default: return "Período selecionado";
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    trend 
  }: { 
    title: string; 
    value: string | number; 
    icon: React.ReactNode; 
    color: string;
    trend?: { value: number; isUp: boolean };
  }) => (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 ${color} rounded-md flex items-center justify-center`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {typeof value === "number" ? value.toLocaleString('pt-BR') : value}
                </div>
                {trend && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    trend.isUp ? "text-green-600" : "text-red-600"
                  }`}>
                    {trend.isUp ? (
                      <svg className="self-center flex-shrink-0 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="self-center flex-shrink-0 h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {Math.abs(trend.value)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  // ✅ VERIFICAR PERMISSÕES
  if (!admin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Acesso Restrito
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Você precisa estar logado para acessar os relatórios.
          </p>
        </div>
      </div>
    );
  }

  if (!permissions.canViewReports) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Sem Permissão
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Você não tem permissão para visualizar relatórios.
          </p>
        </div>
      </div>
    );
  }

  // ✅ Loading silencioso na primeira carga
  if (loading && !initialLoadRef.current) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Carregando Relatórios
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Coletando dados para {formatarPeriodo(filtros.periodo).toLowerCase()}...
          </p>
        </div>
      </div>
    );
  }

  if (error && !relatorioData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Erro ao carregar relatórios
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          {error}
        </p>
        <button
          onClick={handleRefreshRelatorios}
          disabled={fetchingRef.current}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium transform hover:scale-105 disabled:opacity-50"
        >
          {fetchingRef.current ? '⏳ Carregando...' : '🔄 Tentar Novamente'}
        </button>
      </div>
    );
  }

  if (!relatorioData) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 max-w-md mx-auto">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            Nenhum dado disponível
          </h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Não há dados suficientes para gerar relatórios
          </p>
          <button
            onClick={handleRefreshRelatorios}
            disabled={fetchingRef.current}
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {fetchingRef.current ? '⏳ Carregando...' : '🔄 Tentar Carregar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            📊 Relatórios e Análises
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize métricas e estatísticas da sua loja - {formatarPeriodo(filtros.periodo)}
          </p>
          {relatorioData.estatisticasGerais.dataInicio && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              📅 Período: {new Date(relatorioData.estatisticasGerais.dataInicio).toLocaleDateString('pt-BR')} 
              {' até '} 
              {new Date(relatorioData.estatisticasGerais.dataFim || new Date()).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
        
        <div className="flex gap-3">
          <select
            value={filtros.periodo}
            onChange={(e) => handlePeriodoChange(e.target.value as FiltroData["periodo"])}
            disabled={fetchingRef.current}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="1y">Último ano</option>
            <option value="all">Todo período</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => exportarRelatorio("pdf")}
              className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              disabled={loading || exportingRef.current.export_pdf}
              title="Exportar como HTML/PDF"
            >
              {exportingRef.current.export_pdf ? '⏳' : '📄'} PDF
            </button>
            <button
              onClick={() => exportarRelatorio("excel")}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={loading || exportingRef.current.export_excel}
              title="Exportar como Excel"
            >
              {exportingRef.current.export_excel ? '⏳' : '📊'} Excel
            </button>
            <button
              onClick={() => exportarRelatorio("csv")}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading || exportingRef.current.export_csv}
              title="Exportar como CSV"
            >
              {exportingRef.current.export_csv ? '⏳' : '📋'} CSV
            </button>
          </div>

          <button
            onClick={handleRefreshRelatorios}
            disabled={fetchingRef.current}
            className="px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
          >
            {fetchingRef.current ? '⏳' : '🔄'} {fetchingRef.current ? 'Carregando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Cards de estatísticas gerais */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Produtos"
          value={relatorioData.estatisticasGerais.totalProdutos}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          color="bg-blue-500"
        />

        <StatCard
          title="Total de Clientes"
          value={relatorioData.estatisticasGerais.totalClientes}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
          color="bg-green-500"
        />

        <StatCard
          title="Total de Interações"
          value={relatorioData.estatisticasGerais.totalInteracoes}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
          color="bg-purple-500"
        />

        <StatCard
          title="Produto Mais Popular"
          value={relatorioData.estatisticasGerais.produtoMaisPopular}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
          color="bg-yellow-500"
        />
      </div>

      {/* Tabs de navegação */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[{
            id: "visao-geral",
            label: "Visão Geral"
          },
          {
            id: "produtos",
            label: "Produtos"
          },
          {
            id: "clientes",
            label: "Clientes"
          },
          {
            id: "interacoes",
            label: "Interações"
          }].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo das tabs */}
      {activeTab === "visao-geral" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de evolução mensal */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              📈 Evolução Mensal
            </h3>
            {relatorioData.evolucaoMensal.length > 1 ? (
              <>
                <VictoryChart
                  theme={VictoryTheme.material}
                  height={300}
                  padding={{ left: 60, top: 20, right: 80, bottom: 60 }}
                  containerComponent={<VictoryContainer responsive={true} />}
                >
                  <VictoryAxis dependentAxis />
                  <VictoryAxis />
                  
                  <VictoryLine
                    data={relatorioData.evolucaoMensal}
                    x="mes"
                    y="produtos"
                    style={{ data: { stroke: "#8b5cf6", strokeWidth: 3 } }}
                    animate={{ duration: 1000, onLoad: { duration: 500 } }}
                  />
                  
                  <VictoryLine
                    data={relatorioData.evolucaoMensal}
                    x="mes" 
                    y="clientes"
                    style={{ data: { stroke: "#10b981", strokeWidth: 3 } }}
                    animate={{ duration: 1000, onLoad: { duration: 500 } }}
                  />
                  
                  <VictoryLine
                    data={relatorioData.evolucaoMensal}
                    x="mes" 
                    y="interacoes"
                    style={{ data: { stroke: "#3b82f6", strokeWidth: 3 } }}
                    animate={{ duration: 1000, onLoad: { duration: 500 } }}
                  />
                </VictoryChart>
                
                {/* Legenda */}
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Produtos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Clientes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Interações</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
                <h3 className="text-lg font-medium mb-2">Dados insuficientes</h3>
                <p>Aguarde mais dados serem coletados para visualizar a evolução</p>
              </div>
            )}
          </div>

          {/* Gráfico de pizza - Tipos de interação */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              🍕 Tipos de Interação
            </h3>
            {relatorioData.interacoesPorTipo.length > 0 && relatorioData.interacoesPorTipo[0].tipo !== 'Nenhuma interação' ? (
              <VictoryPie
                data={relatorioData.interacoesPorTipo}
                x="tipo"
                y="quantidade"
                width={400}
                height={300}
                colorScale={["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16"]}
                labelComponent={<VictoryTooltip />}
                animate={{ duration: 1000 }}
                innerRadius={50}
                padAngle={3}
              />
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium mb-2">Nenhuma interação registrada</h3>
                <p>As interações dos clientes aparecerão aqui quando disponíveis</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab de Produtos */}
      {activeTab === "produtos" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Produtos cadastrados por período */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              📦 Produtos Cadastrados por Período
            </h3>
            {relatorioData.produtosPorMes.length > 0 && relatorioData.produtosPorMes[0].mes !== 'Sem dados' ? (
              <VictoryChart
                theme={VictoryTheme.material}
                height={300}
                padding={{ left: 60, top: 20, right: 60, bottom: 60 }}
                containerComponent={<VictoryContainer responsive={true} />}
              >
                <VictoryAxis dependentAxis />
                <VictoryAxis />
                
                <VictoryBar
                  data={relatorioData.produtosPorMes}
                  x="mes"
                  y="quantidade"
                  style={{ data: { fill: "#8b5cf6" } }}
                  animate={{ duration: 1000, onLoad: { duration: 500 } }}
                  cornerRadius={{ top: 5 }}
                />
              </VictoryChart>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-lg font-medium mb-2">Nenhum produto cadastrado</h3>
                <p>Os produtos aparecerão aqui quando forem adicionados</p>
              </div>
            )}
          </div>

          {/* Produtos mais interagidos */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              🏆 Produtos Mais Populares
            </h3>
            <div className="space-y-4">
              {relatorioData.produtosMaisInteragidos.length > 0 && relatorioData.produtosMaisInteragidos[0].nome !== 'Nenhum produto' ? (
                relatorioData.produtosMaisInteragidos.slice(0, 5).map((produto, index) => {
                  const maxInteracoes = Math.max(...relatorioData.produtosMaisInteragidos.map(p => p.interacoes));
                  const porcentagem = maxInteracoes > 0 ? (produto.interacoes / maxInteracoes) * 100 : 0;
                  
                  return (
                    <div key={produto.nome} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                          index === 0 ? "bg-yellow-500" : 
                          index === 1 ? "bg-gray-400" : 
                          index === 2 ? "bg-orange-600" : 
                          "bg-gray-300"
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {produto.nome}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {produto.interacoes} interações
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full transition-all duration-1000" 
                            style={{ width: `${porcentagem}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem]">
                          {Math.round(porcentagem)}%
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <h3 className="text-lg font-medium mb-2">Nenhum produto popular</h3>
                  <p>Os produtos mais interagidos aparecerão aqui</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab de Clientes */}
      {activeTab === "clientes" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              👥 Novos Clientes por Período
            </h3>
            {relatorioData.clientesPorMes.length > 0 && relatorioData.clientesPorMes[0].mes !== 'Sem dados' ? (
              <VictoryChart
                theme={VictoryTheme.material}
                height={300}
                padding={{ left: 60, top: 20, right: 60, bottom: 60 }}
                containerComponent={<VictoryContainer responsive={true} />}
              >
                <VictoryAxis dependentAxis />
                <VictoryAxis />
                
                <VictoryArea
                  data={relatorioData.clientesPorMes}
                  x="mes"
                  y="quantidade"
                  style={{
                    data: { fill: "#10b981", fillOpacity: 0.6, stroke: "#10b981", strokeWidth: 3 }
                  }}
                  animate={{ duration: 1000, onLoad: { duration: 500 } }}
                />
              </VictoryChart>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="text-lg font-medium mb-2">Nenhum cliente cadastrado</h3>
                <p>Novos clientes aparecerão aqui quando se registrarem</p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              📊 Estatísticas de Clientes
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Total de Clientes</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cadastrados na plataforma</p>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {relatorioData.estatisticasGerais.totalClientes}
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Email Verificado</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Contas ativadas</p>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {relatorioData.estatisticasGerais.clientesVerificados || 0}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Não Verificado</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Aguardando ativação</p>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {relatorioData.estatisticasGerais.clientesNaoVerificados || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab de Interações */}
      {activeTab === "interacoes" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              💬 Distribuição de Interações
            </h3>
            {relatorioData.interacoesPorTipo.length > 0 && relatorioData.interacoesPorTipo[0].tipo !== 'Nenhuma interação' ? (
              <VictoryChart
                theme={VictoryTheme.material}
                height={300}
                padding={{ left: 80, top: 20, right: 60, bottom: 60 }}
                containerComponent={<VictoryContainer responsive={true} />}
              >
                <VictoryAxis dependentAxis />
                <VictoryAxis />
                
                <VictoryBar
                  data={relatorioData.interacoesPorTipo}
                  x="tipo"
                  y="quantidade"
                  style={{ data: { fill: "#3b82f6" } }}
                  animate={{ duration: 1000, onLoad: { duration: 500 } }}
                  cornerRadius={{ top: 5 }}
                />
              </VictoryChart>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-lg font-medium mb-2">Nenhuma interação</h3>
                <p>As interações aparecerão aqui quando houver dados disponíveis</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}