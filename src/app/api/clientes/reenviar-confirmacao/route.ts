import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email';
import { generateConfirmationToken, getTokenExpiration } from '@/lib/tokens';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email é obrigatório.'
      }, { status: 400 });
    }

    // Buscar cliente pelo email
    const cliente = await prisma.cliente.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!cliente) {
      return NextResponse.json({
        success: false,
        error: 'Email não encontrado.'
      }, { status: 404 });
    }

    // Verificar se email já foi confirmado
    if (cliente.emailVerificado) {
      return NextResponse.json({
        success: false,
        error: 'Este email já foi confirmado. Você pode fazer login normalmente.'
      }, { status: 400 });
    }

    // Gerar novo token de confirmação
    const confirmationToken = generateConfirmationToken();
    const tokenExpiration = getTokenExpiration(24); // 24 horas

    // Atualizar token no banco
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        emailToken: confirmationToken,
        emailTokenExpira: tokenExpiration
      }
    });

    // Enviar novo email de confirmação
    try {
      const emailTemplate = emailService.generateConfirmationEmail(cliente.nome, confirmationToken);
      await emailService.sendEmail(cliente.email, emailTemplate);
      console.log('Email de confirmação reenviado para:', cliente.email);
    } catch (emailError) {
      console.error('Erro ao reenviar email de confirmação:', emailError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao enviar email. Tente novamente.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email de confirmação reenviado com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao reenviar confirmação:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor.'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}