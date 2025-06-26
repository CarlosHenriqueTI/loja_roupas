import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAdminAuth, checkAdminLevel } from '@/middleware/adminAuth';

const prisma = new PrismaClient();

// GET - Listar clientes (com autenticação admin)
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('📋 [API] Iniciando busca de clientes...');
    
    // ✅ Verificar autenticação admin
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      console.error('❌ [API] Falha na autenticação:', authResult.error);
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    console.log(`🔑 [API] Admin autenticado: ${authResult.admin?.nome} (${authResult.admin?.nivelAcesso})`);

    // ✅ Verificar se admin tem permissão para ver clientes
    if (!checkAdminLevel(authResult.admin!.nivelAcesso, 'EDITOR')) {
      console.error('❌ [API] Nível de acesso insuficiente');
      return NextResponse.json(
        { success: false, error: 'Acesso negado - Nível insuficiente' },
        { status: 403 }
      );
    }

    // ✅ Parâmetros de consulta com validação
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10'))); // Máximo 50 por página
    const search = url.searchParams.get('search')?.trim() || '';
    const filter = url.searchParams.get('filter') || 'todos';

    console.log(`📊 [API] Parâmetros: página=${page}, limite=${limit}, busca="${search}", filtro="${filter}"`);

    // ✅ Calcular skip
    const skip = (page - 1) * limit;

    // ✅ Construir where clause otimizada
    const whereClause: any = {};

    // Filtro de busca otimizado
    if (search && search.length >= 2) { // Busca apenas com 2+ caracteres
      whereClause.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // ✅ Filtros específicos otimizados
    switch (filter) {
      case 'ativos':
        whereClause.ativo = true;
        break;
      case 'inativos':
        whereClause.ativo = false;
        break;
      case 'com_interacoes':
        whereClause.ativo = true;
        whereClause.interacoes = {
          some: {}
        };
        break;
      case 'muito_ativos':
        whereClause.ativo = true;
        // Para "muito ativos", vamos usar uma consulta mais eficiente
        break;
      case 'sem_atividade':
        whereClause.ativo = true;
        whereClause.interacoes = {
          none: {}
        };
        break;
    }

    console.log('🔍 [API] Where clause:', JSON.stringify(whereClause, null, 2));

    // ✅ Executar consultas em paralelo para melhor performance
    const queryStart = Date.now();
    
    let clientesQuery;
    let totalQuery;

    if (filter === 'muito_ativos') {
      // ✅ Consulta especial para clientes muito ativos
      clientesQuery = prisma.cliente.findMany({
        where: {
          ...whereClause,
          ativo: true
        },
        include: {
          _count: {
            select: {
              interacoes: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }).then(clientes => 
        clientes.filter(c => (c._count?.interacoes || 0) >= 10)
      );

      totalQuery = prisma.cliente.findMany({
        where: {
          ...whereClause,
          ativo: true
        },
        include: {
          _count: {
            select: {
              interacoes: true
            }
          }
        }
      }).then(clientes => 
        clientes.filter(c => (c._count?.interacoes || 0) >= 10).length
      );
    } else {
      // ✅ Consulta normal otimizada
      clientesQuery = prisma.cliente.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              interacoes: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' } // Mais recentes primeiro
        ],
        take: limit
      });

      totalQuery = prisma.cliente.count({ where: whereClause });
    }

    // ✅ Executar ambas as consultas em paralelo
    const [clientes, totalItems] = await Promise.all([
      clientesQuery,
      totalQuery
    ]);

    const queryTime = Date.now() - queryStart;
    console.log(`⚡ [API] Consulta executada em ${queryTime}ms`);
    console.log(`📊 [API] Encontrados ${clientes.length} clientes de ${totalItems} total`);

    // ✅ Calcular paginação
    const totalPages = Math.ceil(totalItems / limit);

    // ✅ Preparar resposta otimizada
    const response = {
      success: true,
      data: clientes,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      meta: {
        queryTime: queryTime,
        totalTime: Date.now() - startTime,
        filter: filter,
        search: search || null,
        adminLevel: authResult.admin?.nivelAcesso
      }
    };

    console.log(`✅ [API] Resposta preparada em ${Date.now() - startTime}ms total`);

    return NextResponse.json(response);

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [API] Erro ao buscar clientes (${totalTime}ms):`, error);
    
    // ✅ Log detalhado do erro
    if (error instanceof Error) {
      console.error('❌ [API] Stack trace:', error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor ao buscar clientes',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  } finally {
    // ✅ Garantir desconexão do Prisma
    await prisma.$disconnect();
  }
}