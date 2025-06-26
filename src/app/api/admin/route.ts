import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyAdminAuth, checkAdminLevel } from '@/middleware/adminAuth';

const prisma = new PrismaClient();

// Listar admins (apenas SUPERADMIN e ADMIN)
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    // Apenas SUPERADMIN e ADMIN podem listar
    if (!checkAdminLevel(authResult.admin!.nivelAcesso, 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        nivelAcesso: true,
        ultimoLogin: true,
        ultimoLogout: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ 
      success: true, 
      data: admins 
    });

  } catch (error) {
    console.error('Erro ao buscar admins:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Criar novo admin (apenas SUPERADMIN)
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    // Apenas SUPERADMIN pode criar novos admins
    if (!checkAdminLevel(authResult.admin!.nivelAcesso, 'SUPERADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Apenas SUPERADMIN pode criar novos administradores' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nome, email, senha, nivelAcesso } = body;

    // Validações
    if (!nome || !email || !senha) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nome, email e senha são obrigatórios' 
      }, { status: 400 });
    }

    if (senha.length < 6) {
      return NextResponse.json({ 
        success: false, 
        error: 'A senha deve ter pelo menos 6 caracteres' 
      }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Formato de email inválido' 
      }, { status: 400 });
    }

    // Verificar se email já existe
    const adminExistente = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (adminExistente) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email já está em uso' 
      }, { status: 409 });
    }

    // Validar nível de acesso
    const niveisValidos = ['SUPERADMIN', 'ADMIN', 'EDITOR'];
    if (nivelAcesso && !niveisValidos.includes(nivelAcesso)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nível de acesso inválido' 
      }, { status: 400 });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 12);

    // Criar admin
    const novoAdmin = await prisma.admin.create({
      data: {
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        senha: senhaHash,
        nivelAcesso: nivelAcesso || 'EDITOR'
      },
      select: {
        id: true,
        nome: true,
        email: true,
        nivelAcesso: true,
        createdAt: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Administrador criado com sucesso',
      data: novoAdmin 
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar admin:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}