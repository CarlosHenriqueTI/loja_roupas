import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// ✅ Função para verificar autenticação (corrigida)
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

    // Verificar se admin ainda existe
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
      select: { 
        id: true, 
        email: true, 
        nivelAcesso: true,
        status: true,
        ativo: true
      }
    });

    if (!admin) {
      return { success: false, error: 'Administrador não encontrado', status: 404 };
    }

    // SUPERADMIN sempre pode, outros precisam estar ativos
    if (admin.nivelAcesso !== 'SUPERADMIN' && admin.status !== 'ATIVO') {
      return { 
        success: false, 
        error: `Conta não está ativa (Status: ${admin.status})`, 
        status: 403 
      };
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
    return { success: false, error: 'Token inválido ou expirado', status: 401 };
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

// ✅ GET - Obter dados de um administrador específico
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

    const adminId = parseInt(params.id);
    
    if (isNaN(adminId)) {
      return NextResponse.json(
        { success: false, error: 'ID de administrador inválido' },
        { status: 400 }
      );
    }

    // Verificar permissões
    const isOwnAccount = authResult.admin!.adminId === adminId;
    const isSuperAdmin = authResult.admin!.nivelAcesso === 'SUPERADMIN';

    if (!isOwnAccount && !isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
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
    console.error('❌ [API] Erro ao consultar admin:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ✅ PUT - Editar administrador (ATUALIZADO)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 [API] Iniciando edição do admin ID:', params.id);

    // Verificar autenticação
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      console.log('❌ [API] Falha na autenticação:', authResult.error);
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 401 }
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
    const { nome, email, nivelAcesso, senha, status } = body;

    console.log('📋 [API] Dados recebidos:', { 
      adminId, 
      nome, 
      email, 
      nivelAcesso,
      status,
      temSenha: !!senha,
      requesterAdmin: authResult.admin!.adminId 
    });

    // Validações básicas
    if (!nome || nome.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Nome deve ter pelo menos 2 caracteres' },
        { status: 400 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Verificar se admin a ser editado existe
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

    // Verificar permissões
    const isOwnAccount = authResult.admin!.adminId === adminId;
    const isSuperAdmin = authResult.admin!.nivelAcesso === 'SUPERADMIN';

    // Regras de permissão
    if (!isOwnAccount && !isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Você só pode editar sua própria conta ou ser SUPERADMIN' },
        { status: 403 }
      );
    }

    // SUPERADMIN não pode ter nível alterado por outros
    if (adminExistente.nivelAcesso === 'SUPERADMIN' && !isOwnAccount) {
      if (nivelAcesso && nivelAcesso !== 'SUPERADMIN') {
        return NextResponse.json(
          { success: false, error: 'Não é possível alterar o nível de um SUPERADMIN' },
          { status: 403 }
        );
      }
    }

    // Verificar se email já existe (se mudou)
    if (email !== adminExistente.email) {
      const emailExists = await prisma.admin.findUnique({
        where: { email: email },
        select: { id: true }
      });

      if (emailExists && emailExists.id !== adminId) {
        return NextResponse.json(
          { success: false, error: 'Este email já está em uso por outro administrador' },
          { status: 400 }
        );
      }
    }

    // Preparar dados para atualização
    const updateData: any = {
      nome: nome.trim(),
      email: email.toLowerCase().trim(),
      updatedAt: new Date()
    };

    // Apenas SUPERADMIN pode alterar nível de acesso e status
    if (isSuperAdmin && !isOwnAccount) {
      if (nivelAcesso && ['SUPERADMIN', 'ADMIN', 'EDITOR'].includes(nivelAcesso)) {
        updateData.nivelAcesso = nivelAcesso;
      }
      
      if (status && ['ATIVO', 'INATIVO', 'SUSPENSO', 'BLOQUEADO', 'PENDENTE', 'EXCLUIDO'].includes(status)) {
        updateData.status = status;
        
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
      }
    }

    // Se senha foi fornecida, criptografar
    if (senha && senha.length >= 6) {
      const saltRounds = 12;
      updateData.senha = await bcrypt.hash(senha, saltRounds);
      updateData.senhaDefinida = true;
    } else if (senha && senha.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    console.log('🔄 [API] Dados para atualização:', { ...updateData, senha: updateData.senha ? '[CRIPTOGRAFADA]' : undefined });

    // Atualizar administrador
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

    console.log('✅ [API] Admin atualizado com sucesso:', {
      adminId: adminAtualizado.id,
      nome: adminAtualizado.nome,
      email: adminAtualizado.email,
      nivelAcesso: adminAtualizado.nivelAcesso
    });

    return NextResponse.json({
      success: true,
      message: 'Administrador atualizado com sucesso',
      data: adminAtualizado
    });

  } catch (error) {
    console.error('❌ [API] Erro ao editar admin:', error);
    
    // Verificar se é erro do Prisma
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { success: false, error: 'Administrador não encontrado' },
          { status: 404 }
        );
      }
      if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json(
          { success: false, error: 'Email já está em uso' },
          { status: 400 }
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

// ✅ DELETE - Deletar admin (apenas SUPERADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    // Apenas SUPERADMIN pode deletar
    if (!checkAdminLevel(authResult.admin!.nivelAcesso, 'SUPERADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Apenas SUPERADMIN pode deletar administradores' },
        { status: 403 }
      );
    }

    const adminId = parseInt(params.id);

    // Não pode deletar a si mesmo
    if (authResult.admin!.adminId === adminId) {
      return NextResponse.json(
        { success: false, error: 'Você não pode deletar sua própria conta' },
        { status: 400 }
      );
    }

    // Verificar se admin existe
    const adminExistente = await prisma.admin.findUnique({
      where: { id: adminId }
    });

    if (!adminExistente) {
      return NextResponse.json(
        { success: false, error: 'Administrador não encontrado' },
        { status: 404 }
      );
    }

    // Deletar admin
    await prisma.admin.delete({
      where: { id: adminId }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Administrador deletado com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao deletar admin:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}