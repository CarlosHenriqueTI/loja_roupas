import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { token, senha } = await request.json();

    if (!token || !senha) {
      return NextResponse.json({
        success: false,
        error: 'Token e senha são obrigatórios'
      }, { status: 400 });
    }

    if (senha.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Senha deve ter pelo menos 6 caracteres'
      }, { status: 400 });
    }

    // Buscar admin pelo token
    const admin = await prisma.admin.findFirst({
      where: {
        tokenConfirmacao: token,
        tokenExpiracao: {
          gte: new Date() // Token ainda válido
        },
        emailVerificado: false
      }
    });

    if (!admin) {
      return NextResponse.json({
        success: false,
        error: 'Token inválido ou expirado'
      }, { status: 400 });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 12);

    // Atualizar admin - ativar conta
    const adminAtivado = await prisma.admin.update({
      where: { id: admin.id },
      data: {
        senha: senhaHash,
        emailVerificado: true,
        tokenConfirmacao: null,
        tokenExpiracao: null,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        nivelAcesso: true,
        emailVerificado: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Conta ativada com sucesso!',
      admin: adminAtivado
    });

  } catch (error) {
    console.error('Erro ao confirmar conta:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Método GET para verificar token
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token não fornecido'
      }, { status: 400 });
    }

    // Verificar se token existe e é válido
    const admin = await prisma.admin.findFirst({
      where: {
        tokenConfirmacao: token,
        tokenExpiracao: {
          gte: new Date()
        },
        emailVerificado: false
      },
      select: {
        id: true,
        nome: true,
        email: true,
        nivelAcesso: true,
        tokenExpiracao: true
      }
    });

    if (!admin) {
      return NextResponse.json({
        success: false,
        error: 'Token inválido ou expirado'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      admin,
      expiresAt: admin.tokenExpiracao
    });

  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}