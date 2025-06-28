import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// ✅ Função para verificar autenticação - CORRIGIDA
async function verifyAdminAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return { success: false, error: 'Token de autorização necessário', status: 401 };
    }

    const token = authHeader.replace('Bearer ', '');
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'Urban Icon-admin-secret'
    ) as { adminId: number; email: string; nivelAcesso: string };

    console.log('🔍 [API] Token decodificado:', { 
      adminId: decoded.adminId, 
      email: decoded.email, 
      nivelAcesso: decoded.nivelAcesso 
    });

    // Verificar se admin ainda existe
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
      select: { 
        id: true, 
        email: true, 
        nivelAcesso: true,
        status: true,
        ativo: true,
        emailVerificado: true
      }
    });

    console.log('👤 [API] Admin encontrado no DB:', admin);

    if (!admin) {
      return { success: false, error: 'Administrador não encontrado', status: 404 };
    }

    // ✅ VALIDAÇÃO MAIS FLEXÍVEL - aceitar SUPERADMIN mesmo se status não for ATIVO
    if (admin.nivelAcesso === 'SUPERADMIN') {
      // SUPERADMIN sempre pode fazer alterações, mesmo se status não estiver perfeito
      console.log('👑 [API] SUPERADMIN detectado - permitindo acesso');
      
      // Se SUPERADMIN não está ATIVO, corrigir automaticamente
      if (admin.status !== 'ATIVO') {
        console.log('🔧 [API] Corrigindo status do SUPERADMIN para ATIVO');
        await prisma.admin.update({
          where: { id: admin.id },
          data: { 
            status: 'ATIVO',
            ativo: true,
            emailVerificado: true 
          }
        });
        admin.status = 'ATIVO';
      }
    } else {
      // Para outros níveis, verificar se está ativo
      if (admin.status !== 'ATIVO') {
        return { 
          success: false, 
          error: `Conta de administrador não está ativa (Status: ${admin.status})`, 
          status: 403 
        };
      }
    }

    return {
      success: true,
      admin: {
        adminId: admin.id,
        email: admin.email,
        nivelAcesso: admin.nivelAcesso as 'SUPERADMIN' | 'ADMIN' | 'EDITOR'
      }
    };

  } catch (error) {
    console.error('❌ [API] Erro na verificação de auth:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return { success: false, error: 'Token inválido', status: 401 };
    }
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, error: 'Token expirado', status: 401 };
    }
    return { success: false, error: 'Erro na autenticação', status: 401 };
  }
}

// ✅ Função para verificar nível de acesso
function checkAdminLevel(currentLevel: string, requiredLevel: string): boolean {
  const levels = {
    'SUPERADMIN': 3,
    'ADMIN': 2,
    'EDITOR': 1
  };
  
  return (levels[currentLevel as keyof typeof levels] || 0) >= (levels[requiredLevel as keyof typeof levels] || 0);
}

// ✅ PATCH - Alterar status de um administrador
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 [API] Iniciando alteração de status do admin ID:', params.id);

    // Verificar autenticação
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      console.log('❌ [API] Falha na autenticação:', authResult.error);
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    console.log('✅ [API] Autenticação válida para admin:', authResult.admin);

    // Apenas SUPERADMIN pode alterar status
    if (!checkAdminLevel(authResult.admin!.nivelAcesso, 'SUPERADMIN')) {
      console.log('❌ [API] Acesso negado - nível insuficiente:', authResult.admin!.nivelAcesso);
      return NextResponse.json(
        { success: false, error: 'Apenas SUPERADMIN pode alterar status de administradores' },
        { status: 403 }
      );
    }

    const adminId = parseInt(params.id);
    
    if (isNaN(adminId)) {
      return NextResponse.json(
        { success: false, error: 'ID de administrador inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    console.log('📋 [API] Dados recebidos:', { 
      adminId, 
      status, 
      requesterAdmin: authResult.admin!.adminId 
    });

    // Validar status
    const statusValidos = ['ATIVO', 'INATIVO', 'SUSPENSO', 'BLOQUEADO', 'PENDENTE', 'EXCLUIDO'];
    if (!status || !statusValidos.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status inválido. Use: ' + statusValidos.join(', ') },
        { status: 400 }
      );
    }

    // Verificar se admin existe
    const adminExistente = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { 
        id: true, 
        nome: true, 
        email: true, 
        nivelAcesso: true,
        status: true
      }
    });

    if (!adminExistente) {
      console.log('❌ [API] Admin não encontrado:', adminId);
      return NextResponse.json(
        { success: false, error: 'Administrador não encontrado' },
        { status: 404 }
      );
    }

    console.log('📋 [API] Admin a ser alterado:', adminExistente);

    // Impedir auto-desativação (exceto se for para ATIVO)
    if (authResult.admin!.adminId === adminId && status !== 'ATIVO') {
      console.log('❌ [API] Tentativa de auto-desativação bloqueada');
      return NextResponse.json(
        { success: false, error: 'Você não pode desativar sua própria conta' },
        { status: 400 }
      );
    }

    // Atualizar campos relacionados baseado no status
    const updateData: any = { 
      status: status,
      updatedAt: new Date()
    };

    // Ajustar campos relacionados
    switch (status) {
      case 'ATIVO':
        updateData.ativo = true;
        updateData.emailVerificado = true;
        break;
      case 'INATIVO':
      case 'SUSPENSO':
      case 'BLOQUEADO':
      case 'EXCLUIDO':
        updateData.ativo = false;
        break;
      case 'PENDENTE':
        updateData.ativo = true;
        updateData.emailVerificado = false;
        break;
    }

    console.log('🔄 [API] Dados para atualização:', updateData);

    // Atualizar status
    const adminAtualizado = await prisma.admin.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        nivelAcesso: true,
        status: true,
        ativo: true,
        emailVerificado: true,
        ultimoLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('✅ [API] Status alterado com sucesso:', {
      adminId: adminAtualizado.id,
      nome: adminAtualizado.nome,
      statusAnterior: adminExistente.status,
      statusNovo: adminAtualizado.status
    });

    return NextResponse.json({
      success: true,
      message: `Status alterado para ${status} com sucesso`,
      data: adminAtualizado
    });

  } catch (error) {
    console.error('❌ [API] Erro ao alterar status:', error);
    
    // Verificar se é erro do Prisma
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { success: false, error: 'Administrador não encontrado' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ✅ GET - Obter status atual de um administrador (opcional)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    // Apenas SUPERADMIN pode consultar status
    if (!checkAdminLevel(authResult.admin!.nivelAcesso, 'SUPERADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const adminId = parseInt(params.id);
    
    if (isNaN(adminId)) {
      return NextResponse.json(
        { success: false, error: 'ID de administrador inválido' },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        nome: true,
        email: true,
        nivelAcesso: true,
        status: true,
        ativo: true,
        emailVerificado: true,
        ultimoLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Administrador não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: admin
    });

  } catch (error) {
    console.error('❌ [API] Erro ao consultar status:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ✅ OPTIONS - Para CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}