import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyAdminAuth, checkAdminLevel } from '@/middleware/adminAuth';

const prisma = new PrismaClient();

// Buscar admin específico
export async function GET(
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

    const adminId = parseInt(params.id);
    
    // Admins podem ver apenas seus próprios dados, ADMIN+ podem ver todos
    const canViewAll = checkAdminLevel(authResult.admin!.nivelAcesso, 'ADMIN');
    const isOwnProfile = authResult.admin!.adminId === adminId;

    if (!canViewAll && !isOwnProfile) {
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
        ultimoLogin: true,
        ultimoLogout: true,
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
    console.error('Erro ao buscar admin:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Atualizar admin
export async function PUT(
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

    const adminId = parseInt(params.id);
    const body = await request.json();
    const { nome, email, senha, nivelAcesso } = body;

    // Verificar permissões
    const canEditAll = checkAdminLevel(authResult.admin!.nivelAcesso, 'ADMIN');
    const isOwnProfile = authResult.admin!.adminId === adminId;

    if (!canEditAll && !isOwnProfile) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Se não é SUPERADMIN, não pode alterar nível de acesso
    if (nivelAcesso && !checkAdminLevel(authResult.admin!.nivelAcesso, 'SUPERADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Apenas SUPERADMIN pode alterar níveis de acesso' },
        { status: 403 }
      );
    }

    // Validações
    const updateData: any = {};

    if (nome) {
      if (nome.trim().length < 3) {
        return NextResponse.json({ 
          success: false, 
          error: 'Nome deve ter pelo menos 3 caracteres' 
        }, { status: 400 });
      }
      updateData.nome = nome.trim();
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Formato de email inválido' 
        }, { status: 400 });
      }

      // Verificar se email já existe (exceto o próprio admin)
      const emailExistente = await prisma.admin.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (emailExistente && emailExistente.id !== adminId) {
        return NextResponse.json({ 
          success: false, 
          error: 'Email já está em uso' 
        }, { status: 409 });
      }

      updateData.email = email.toLowerCase().trim();
    }

    if (senha) {
      if (senha.length < 6) {
        return NextResponse.json({ 
          success: false, 
          error: 'A senha deve ter pelo menos 6 caracteres' 
        }, { status: 400 });
      }
      updateData.senha = await bcrypt.hash(senha, 12);
    }

    if (nivelAcesso) {
      const niveisValidos = ['SUPERADMIN', 'ADMIN', 'EDITOR'];
      if (!niveisValidos.includes(nivelAcesso)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Nível de acesso inválido' 
        }, { status: 400 });
      }
      updateData.nivelAcesso = nivelAcesso;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nenhum dado fornecido para atualização' 
      }, { status: 400 });
    }

    updateData.updatedAt = new Date();

    const adminAtualizado = await prisma.admin.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        nivelAcesso: true,
        ultimoLogin: true,
        ultimoLogout: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Administrador atualizado com sucesso',
      data: adminAtualizado 
    });

  } catch (error) {
    console.error('Erro ao atualizar admin:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Deletar admin (apenas SUPERADMIN)
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