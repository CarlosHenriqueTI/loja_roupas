import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get("periodo") || "30d";
    
    console.log(`📊 Gerando relatórios para período: ${periodo}`);

    // Calcular data de início baseada no período
    const agora = new Date();
    let dataInicio: Date;

    switch (periodo) {
      case "7d":
        dataInicio = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        dataInicio = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        dataInicio = new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        dataInicio = new Date(agora.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "all":
      default:
        dataInicio = new Date(0); // Desde o início dos tempos
        break;
    }

    console.log(`📅 Filtrando dados desde: ${dataInicio.toISOString()}`);

    // ✅ USAR CAMPOS CORRETOS DO SCHEMA
    const [produtos, clientes, interacoes] = await Promise.all([
      prisma.produto.findMany({
        where: periodo === "all" ? {} : {
          createdAt: {
            gte: dataInicio
          }
        },
        select: {
          id: true,
          nome: true,
          createdAt: true,
          categoria: true,
          preco: true
        }
      }),
      prisma.cliente.findMany({
        where: periodo === "all" ? {} : {
          createdAt: {
            gte: dataInicio
          }
        },
        select: {
          id: true,
          nome: true,
          createdAt: true,
          emailVerificado: true
        }
      }),
      prisma.interacao.findMany({
        where: periodo === "all" ? {} : {
          createdAt: {
            gte: dataInicio
          }
        },
        select: { 
          tipo: true,
          createdAt: true,
          produto: {
            select: {
              id: true,
              nome: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ]);

    console.log(`📈 Dados filtrados: ${produtos.length} produtos, ${clientes.length} clientes, ${interacoes.length} interações`);

    // Determinar número de períodos baseado no filtro
    let numPeriodos: number;
    let tipoPeridodo: 'dias' | 'semanas' | 'meses';
    
    switch (periodo) {
      case "7d":
        numPeriodos = 7;
        tipoPeridodo = 'dias';
        break;
      case "30d":
        numPeriodos = 6; // 6 períodos de 5 dias
        tipoPeridodo = 'semanas';
        break;
      case "90d":
        numPeriodos = 3; // 3 meses
        tipoPeridodo = 'meses';
        break;
      case "1y":
        numPeriodos = 12; // 12 meses
        tipoPeridodo = 'meses';
        break;
      case "all":
      default:
        numPeriodos = 6; // Últimos 6 meses
        tipoPeridodo = 'meses';
        break;
    }

    // Gerar dados por período
    const mesesData = [];

    if (tipoPeridodo === 'dias') {
      // Para 7 dias - um ponto por dia
      for (let i = numPeriodos - 1; i >= 0; i--) {
        const data = new Date(agora.getTime() - i * 24 * 60 * 60 * 1000);
        const proximoDia = new Date(data.getTime() + 24 * 60 * 60 * 1000);
        
        const produtosDoPeríodo = produtos.filter(p => {
          const criadoEm = new Date(p.createdAt);
          return criadoEm >= data && criadoEm < proximoDia;
        }).length;

        const clientesDoPeríodo = clientes.filter(c => {
          const criadoEm = new Date(c.createdAt);
          return criadoEm >= data && criadoEm < proximoDia;
        }).length;

        const interacoesDoPeríodo = interacoes.filter(i => {
          const criadaEm = new Date(i.createdAt);
          return criadaEm >= data && criadaEm < proximoDia;
        }).length;

        mesesData.push({
          mes: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          produtos: produtosDoPeríodo,
          clientes: clientesDoPeríodo,
          interacoes: interacoesDoPeríodo,
          quantidade: produtosDoPeríodo
        });
      }
    } else if (tipoPeridodo === 'semanas' && periodo === "30d") {
      // Para 30 dias - 6 períodos de 5 dias
      for (let i = numPeriodos - 1; i >= 0; i--) {
        const dataFim = new Date(agora.getTime() - i * 5 * 24 * 60 * 60 * 1000);
        const dataInicioPeriodo = new Date(dataFim.getTime() - 5 * 24 * 60 * 60 * 1000);
        
        const produtosDoPeríodo = produtos.filter(p => {
          const criadoEm = new Date(p.createdAt);
          return criadoEm >= dataInicioPeriodo && criadoEm < dataFim;
        }).length;

        const clientesDoPeríodo = clientes.filter(c => {
          const criadoEm = new Date(c.createdAt);
          return criadoEm >= dataInicioPeriodo && criadoEm < dataFim;
        }).length;

        const interacoesDoPeríodo = interacoes.filter(i => {
          const criadaEm = new Date(i.createdAt);
          return criadaEm >= dataInicioPeriodo && criadaEm < dataFim;
        }).length;

        mesesData.push({
          mes: `${dataInicioPeriodo.getDate()}/${dataInicioPeriodo.getMonth() + 1}`,
          produtos: produtosDoPeríodo,
          clientes: clientesDoPeríodo,
          interacoes: interacoesDoPeríodo,
          quantidade: produtosDoPeríodo
        });
      }
    } else {
      // Para meses
      const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      for (let i = numPeriodos - 1; i >= 0; i--) {
        const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        const proximoMes = new Date(agora.getFullYear(), agora.getMonth() - i + 1, 1);
        
        const produtosDoMes = produtos.filter(p => {
          const criadoEm = new Date(p.createdAt);
          return criadoEm >= data && criadoEm < proximoMes;
        }).length;

        const clientesDoMes = clientes.filter(c => {
          const criadoEm = new Date(c.createdAt);
          return criadoEm >= data && criadoEm < proximoMes;
        }).length;

        const interacoesDoMes = interacoes.filter(i => {
          const criadaEm = new Date(i.createdAt);
          return criadaEm >= data && criadaEm < proximoMes;
        }).length;

        mesesData.push({
          mes: mesesNomes[data.getMonth()],
          produtos: produtosDoMes,
          clientes: clientesDoMes,
          interacoes: interacoesDoMes,
          quantidade: produtosDoMes
        });
      }
    }

    // Agrupar interações por tipo
    const tiposInteracao = interacoes.reduce((acc, interacao) => {
      const tipo = interacao.tipo || 'Outros';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const interacoesPorTipo = Object.entries(tiposInteracao).map(([tipo, quantidade]) => ({
      tipo: tipo === 'COMENTARIO' ? 'Comentários' :
            tipo === 'AVALIACAO' ? 'Avaliações' :
            tipo === 'CURTIDA' ? 'Curtidas' :
            tipo === 'COMPARTILHAMENTO' ? 'Compartilhamentos' :
            tipo === 'COMPRA' ? 'Compras' :
            tipo === 'VISUALIZACAO' ? 'Visualizações' :
            tipo === 'RESPOSTA_ADMIN' ? 'Respostas Admin' : 
            tipo === 'comentario' ? 'Comentários' :
            tipo === 'avaliacao' ? 'Avaliações' :
            tipo === 'curtida' ? 'Curtidas' :
            tipo === 'compartilhamento' ? 'Compartilhamentos' :
            tipo === 'compra' ? 'Compras' :
            tipo === 'visualizacao' ? 'Visualizações' : tipo,
      quantidade
    }));

    // Produtos mais interagidos (no período)
    const produtosInteracoes = interacoes.reduce((acc, interacao) => {
      if (interacao.produto) {
        const produtoId = interacao.produto.id;
        const produtoNome = interacao.produto.nome;
        
        if (!acc[produtoId]) {
          acc[produtoId] = {
            nome: produtoNome,
            interacoes: 0
          };
        }
        acc[produtoId].interacoes++;
      }
      return acc;
    }, {} as Record<number, { nome: string; interacoes: number }>);

    const produtosMaisInteragidos = Object.values(produtosInteracoes)
      .sort((a, b) => b.interacoes - a.interacoes)
      .slice(0, 10);

    // Estatísticas
    const produtoMaisPopular = produtosMaisInteragidos.length > 0 
      ? produtosMaisInteragidos[0].nome 
      : 'Nenhum produto';

    const mesComMaisAtividade = mesesData.reduce((prev, current) => 
      (current.interacoes > prev.interacoes) ? current : prev, mesesData[0] || { mes: 'N/A', interacoes: 0 }
    ).mes;

    const clientesVerificados = clientes.filter(c => c.emailVerificado).length;
    const clientesNaoVerificados = clientes.length - clientesVerificados;

    // ✅ GARANTIR QUE OS DADOS NUNCA SEJAM VAZIOS
    const relatorioData = {
      produtosPorMes: mesesData.length > 0 ? mesesData : [{
        mes: 'Sem dados',
        quantidade: 0,
        produtos: 0,
        clientes: 0,
        interacoes: 0
      }],
      clientesPorMes: mesesData.length > 0 ? mesesData : [{
        mes: 'Sem dados',
        quantidade: 0,
        produtos: 0,
        clientes: 0,
        interacoes: 0
      }],
      interacoesPorTipo: interacoesPorTipo.length > 0 ? interacoesPorTipo : [{
        tipo: 'Nenhuma interação',
        quantidade: 0
      }],
      produtosMaisInteragidos: produtosMaisInteragidos.length > 0 ? produtosMaisInteragidos : [{
        nome: 'Nenhum produto',
        interacoes: 0
      }],
      evolucaoMensal: mesesData.length > 0 ? mesesData : [{
        mes: 'Sem dados',
        produtos: 0,
        clientes: 0,
        interacoes: 0,
        quantidade: 0
      }],
      estatisticasGerais: {
        totalProdutos: produtos.length,
        totalClientes: clientes.length,
        totalInteracoes: interacoes.length,
        produtoMaisPopular,
        mesComMaisAtividade,
        clientesVerificados,
        clientesNaoVerificados,
        categorias: Array.from(new Set(produtos.map(p => p.categoria).filter(Boolean))).length,
        ticketMedio: produtos.length > 0 
          ? (produtos.reduce((acc, p) => acc + Number(p.preco), 0) / produtos.length).toFixed(2)
          : '0.00',
        periodo,
        dataInicio: dataInicio.toISOString(),
        dataFim: agora.toISOString()
      }
    };

    console.log(`✅ Relatório gerado para período ${periodo}:`, {
      produtos: produtos.length,
      clientes: clientes.length,
      interacoes: interacoes.length,
      periodos: mesesData.length
    });
    
    return NextResponse.json({
      success: true,
      data: relatorioData
    });

  } catch (error) {
    console.error('❌ Erro ao gerar relatórios:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}