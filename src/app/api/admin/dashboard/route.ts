// "use client"; // REMOVA ESTA LINHA

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('📊 Buscando dados reais do dashboard...');

    // ✅ 1. BUSCAR DADOS REAIS DO BANCO
    const [
      totalClientes,
      totalProdutos,
      totalInteracoes,
      interacoesRecentes,
      produtosMaisInteragidos,
      clientesAtivos
    ] = await Promise.all([
      // Total de clientes
      prisma.cliente.count(),
      
      // Total de produtos
      prisma.produto.count(),
      
      // Total de interações
      prisma.interacao.count(),
      
      // Interações recentes (últimas 10) - CAMPO CORRETO: createdAt
      prisma.interacao.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }, // ✅ Corrigido
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
          produto: {
            select: {
              id: true,
              nome: true,
              preco: true
            }
          }
        }
      }),

      // Produtos mais interagidos (top 5)
      prisma.interacao.groupBy({
        by: ['produtoId'],
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 5
      }),

      // Clientes que interagiram nos últimos 30 dias - CAMPO CORRETO: createdAt
      prisma.interacao.findMany({
        where: {
          createdAt: { // ✅ Corrigido
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        distinct: ['clienteId'],
        select: {
          clienteId: true
        }
      })
    ]);

    // ✅ 2. CALCULAR MÉTRICAS DERIVADAS
    const clientesAtivosCount = clientesAtivos.length;
    
    // Vendas do mês (baseado nas interações de compra) - CAMPO CORRETO: createdAt
    const vendasMes = await prisma.interacao.count({
      where: {
        tipo: 'compra',
        createdAt: { // ✅ Corrigido
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    // ✅ 3. BUSCAR DETALHES DOS PRODUTOS MAIS INTERAGIDOS - garantir tipos corretos
    const produtosDetalhados = await Promise.all(
      produtosMaisInteragidos.map(async (item) => {
        const produto = await prisma.produto.findUnique({
          where: { id: item.produtoId },
          select: {
            id: true,
            nome: true,
            preco: true,
            imagemUrl: true
          }
        });
        return {
          produto: produto ? {
            ...produto,
            preco: Number(produto.preco) // ✅ Converter para number
          } : null,
          totalInteracoes: item._count.id
        };
      })
    );

    // ✅ 4. FORMATAR ATIVIDADES RECENTES - garantir tipos corretos
    const atividadesRecentes = interacoesRecentes.map(interacao => ({
      id: interacao.id,
      tipo: interacao.tipo,
      conteudo: interacao.conteudo || '',
      data: interacao.createdAt.toISOString(),
      cliente: {
        id: interacao.cliente.id,
        nome: interacao.cliente.nome,
        email: interacao.cliente.email
      },
      produto: {
        id: interacao.produto.id,
        nome: interacao.produto.nome,
        preco: Number(interacao.produto.preco) // ✅ Converter para number
      },
      avaliacao: interacao.avaliacao
    }));

    // ✅ 5. ESTATÍSTICAS POR TIPO DE INTERAÇÃO
    const interacoesPorTipo = await prisma.interacao.groupBy({
      by: ['tipo'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // ✅ 6. INTERAÇÕES DOS ÚLTIMOS 7 DIAS - CAMPO CORRETO: createdAt
    const interacoesUltimos7Dias = await prisma.interacao.findMany({
      where: {
        createdAt: { // ✅ Corrigido
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        createdAt: true, // ✅ Corrigido
        tipo: true
      }
    });

    // Agrupar por dia
    const interacoesPorDia = interacoesUltimos7Dias.reduce((acc, interacao) => {
      const dia = interacao.createdAt.toISOString().split('T')[0]; // ✅ Corrigido
      if (!acc[dia]) {
        acc[dia] = 0;
      }
      acc[dia]++;
      return acc;
    }, {} as Record<string, number>);

    // ✅ 7. DADOS PARA GRÁFICOS
    const graficoInteracoes = Object.entries(interacoesPorDia).map(([dia, quantidade]) => ({
      dia: new Date(dia).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
      quantidade
    }));

    // ✅ 8. CALCULAR TENDÊNCIAS (crescimento vs período anterior) - CAMPOS CORRETOS: createdAt
    const [
      clientesUltimos30Dias,
      clientesPeriodoAnterior,
      produtosUltimos30Dias,
      produtosPeriodoAnterior,
      interacoesUltimos30Dias,
      interacoesPeriodoAnterior
    ] = await Promise.all([
      // Clientes últimos 30 dias
      prisma.cliente.count({
        where: {
          createdAt: { // ✅ Corrigido
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Clientes 30-60 dias atrás
      prisma.cliente.count({
        where: {
          createdAt: { // ✅ Corrigido
            gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Produtos últimos 30 dias
      prisma.produto.count({
        where: {
          createdAt: { // ✅ Corrigido
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Produtos 30-60 dias atrás
      prisma.produto.count({
        where: {
          createdAt: { // ✅ Corrigido
            gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Interações últimos 30 dias
      prisma.interacao.count({
        where: {
          createdAt: { // ✅ Corrigido
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Interações 30-60 dias atrás
      prisma.interacao.count({
        where: {
          createdAt: { // ✅ Corrigido
            gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Calcular percentuais de crescimento
    const calcularCrescimento = (atual: number, anterior: number): { percentual: number; isUp: boolean } => {
      if (anterior === 0) return { percentual: atual > 0 ? 100 : 0, isUp: atual > 0 };
      const percentual = Math.round(((atual - anterior) / anterior) * 100);
      return { percentual: Math.abs(percentual), isUp: percentual >= 0 };
    };

    const tendenciaClientes = calcularCrescimento(clientesUltimos30Dias, clientesPeriodoAnterior);
    const tendenciaProdutos = calcularCrescimento(produtosUltimos30Dias, produtosPeriodoAnterior);
    const tendenciaInteracoes = calcularCrescimento(interacoesUltimos30Dias, interacoesPeriodoAnterior);

    console.log('✅ Dados reais do dashboard carregados:', {
      totalClientes,
      totalProdutos,
      totalInteracoes,
      atividadesRecentes: atividadesRecentes.length,
      produtosMaisInteragidos: produtosDetalhados.length
    });

    // ✅ 9. RETORNAR DADOS COMPLETOS
    return NextResponse.json({
      success: true,
      data: {
        // Estatísticas principais
        totalClientes,
        totalProdutos,
        totalInteracoes,
        vendasMes,
        clientesAtivos: clientesAtivosCount,
        
        // Atividades recentes
        atividadesRecentes,
        
        // Produtos mais interagidos
        produtosMaisInteragidos: produtosDetalhados,
        
        // Dados para gráficos
        graficoInteracoes,
        interacoesPorTipo: interacoesPorTipo.map(item => ({
          tipo: item.tipo,
          quantidade: item._count.id
        })),
        
        // Tendências
        tendencias: {
          clientes: tendenciaClientes,
          produtos: tendenciaProdutos,
          interacoes: tendenciaInteracoes
        },
        
        // Metadados
        dataAtualizacao: new Date().toISOString(),
        periodo: {
          inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          fim: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar dados do dashboard:', error);
    
    // Retornar dados de fallback em caso de erro
    return NextResponse.json({
      success: false,
      error: 'Erro ao carregar dados do dashboard',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      data: {
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
        dataAtualizacao: new Date().toISOString(),
        periodo: {
          inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          fim: new Date().toISOString()
        }
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}