import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAdminAuth, checkAdminLevel } from '@/middleware/adminAuth';

const prisma = new PrismaClient();

// DELETE - Excluir cliente específico (apenas SUPERADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    console.log(`🗑️ [API] Iniciando exclusão do cliente ID: ${params.id}`);
    
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

    // ✅ Verificar se admin tem permissão para deletar clientes (apenas SUPERADMIN)
    if (!checkAdminLevel(authResult.admin!.nivelAcesso, 'SUPERADMIN')) {
      console.error('❌ [API] Nível de acesso insuficiente para deletar cliente');
      return NextResponse.json(
        { success: false, error: 'Acesso negado - Apenas SUPERADMIN pode excluir clientes' },
        { status: 403 }
      );
    }

    const clienteId = parseInt(params.id);

    if (isNaN(clienteId)) {
      console.error('❌ [API] ID de cliente inválido:', params.id);
      return NextResponse.json(
        { success: false, error: 'ID de cliente inválido' },
        { status: 400 }
      );
    }

    // ✅ Verificar se cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        _count: {
          select: {
            interacoes: true
          }
        }
      }
    });

    if (!cliente) {
      console.error('❌ [API] Cliente não encontrado:', clienteId);
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    console.log(`📋 [API] Cliente encontrado: ${cliente.nome} com ${cliente._count.interacoes} interações`);

    // ✅ Deletar interações primeiro (se existirem)
    if (cliente._count.interacoes > 0) {
      console.log(`🔗 [API] Deletando ${cliente._count.interacoes} interações do cliente...`);
      
      const deletedInteracoes = await prisma.interacao.deleteMany({
        where: { clienteId }
      });
      
      console.log(`✅ [API] ${deletedInteracoes.count} interações deletadas`);
    }

    // ✅ Deletar cliente
    console.log(`🗑️ [API] Deletando cliente: ${cliente.nome}`);
    
    const deletedCliente = await prisma.cliente.delete({
      where: { id: clienteId }
    });

    const totalTime = Date.now() - startTime;
    console.log(`✅ [API] Cliente ${cliente.nome} (ID: ${clienteId}) excluído com sucesso em ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      message: 'Cliente excluído com sucesso',
      data: {
        id: deletedCliente.id,
        nome: deletedCliente.nome,
        email: deletedCliente.email,
        interacoesRemovidas: cliente._count.interacoes
      },
      meta: {
        executionTime: totalTime,
        adminId: authResult.admin?.adminId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [API] Erro ao excluir cliente (${totalTime}ms):`, error);
    
    if (error instanceof Error) {
      console.error('❌ [API] Stack trace:', error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor ao excluir cliente',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET - Obter cliente específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`📋 [API] Buscando cliente ID: ${params.id}`);
    
    // ✅ Verificar autenticação admin
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      console.error('❌ [API] Falha na autenticação:', authResult.error);
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    // ✅ Verificar se admin tem permissão para ver clientes
    if (!checkAdminLevel(authResult.admin!.nivelAcesso, 'EDITOR')) {
      console.error('❌ [API] Nível de acesso insuficiente');
      return NextResponse.json(
        { success: false, error: 'Acesso negado - Nível insuficiente' },
        { status: 403 }
      );
    }

    const clienteId = parseInt(params.id);

    if (isNaN(clienteId)) {
      return NextResponse.json(
        { success: false, error: 'ID de cliente inválido' },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        _count: {
          select: {
            interacoes: true
          }
        },
        interacoes: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            tipo: true,
            createdAt: true
          }
        }
      }
    });

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cliente
    });

  } catch (error) {
    console.error('❌ [API] Erro ao buscar cliente:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor ao buscar cliente'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}