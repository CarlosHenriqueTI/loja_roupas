import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { isTokenExpired } from '@/lib/tokens';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token de confirmação é obrigatório.'
      }, { status: 400 });
    }

    // Buscar cliente pelo token
    const cliente = await prisma.cliente.findUnique({
      where: { emailToken: token }
    });

    if (!cliente) {
      return NextResponse.json({
        success: false,
        error: 'Token inválido ou expirado.'
      }, { status: 400 });
    }

    // Verificar se token expirou
    if (cliente.emailTokenExpira && isTokenExpired(cliente.emailTokenExpira)) {
      return NextResponse.json({
        success: false,
        error: 'Token expirado. Solicite um novo email de confirmação.'
      }, { status: 400 });
    }

    // Verificar se email já foi verificado
    if (cliente.emailVerificado) {
      return NextResponse.json({
        success: false,
        error: 'Email já foi confirmado.'
      }, { status: 400 });
    }

    // Confirmar email
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        emailVerificado: true,
        emailToken: null,
        emailTokenExpira: null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Email confirmado com sucesso! Agora você pode fazer login.'
    });

  } catch (error) {
    console.error('Erro ao confirmar email:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor.'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}