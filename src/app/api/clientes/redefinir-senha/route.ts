import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { isTokenExpired } from '@/lib/tokens';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, novaSenha } = body;

    if (!code || !novaSenha) {
      return NextResponse.json({
        success: false,
        error: 'Código e nova senha são obrigatórios.'
      }, { status: 400 });
    }

    if (novaSenha.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Nova senha deve ter pelo menos 6 caracteres.'
      }, { status: 400 });
    }

    // Buscar cliente pelo código
    const cliente = await prisma.cliente.findUnique({
      where: { resetToken: code }
    });

    if (!cliente) {
      return NextResponse.json({
        success: false,
        error: 'Código inválido ou expirado.'
      }, { status: 400 });
    }

    // Verificar se token expirou
    if (cliente.resetTokenExpira && isTokenExpired(cliente.resetTokenExpira)) {
      return NextResponse.json({
        success: false,
        error: 'Código expirado. Solicite um novo código.'
      }, { status: 400 });
    }

    // Hash da nova senha
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    // Atualizar senha e limpar token
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        senha: senhaHash,
        resetToken: null,
        resetTokenExpira: null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor.'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}