import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email';
import { generateResetCode, getTokenExpiration } from '@/lib/tokens';

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
      // Por segurança, não revelar que email não existe
      return NextResponse.json({
        success: true,
        message: 'Se o email existir, você receberá um código de recuperação.'
      });
    }

    // Gerar código de reset
    const resetCode = generateResetCode();
    const tokenExpiration = getTokenExpiration(1); // 1 hora

    // Salvar token no banco
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        resetToken: resetCode,
        resetTokenExpira: tokenExpiration
      }
    });

    // Enviar email com código
    try {
      const emailTemplate = emailService.generatePasswordResetEmail(cliente.nome, resetCode);
      await emailService.sendEmail(cliente.email, emailTemplate);
      console.log('Email de recuperação enviado para:', cliente.email);
    } catch (emailError) {
      console.error('Erro ao enviar email de recuperação:', emailError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao enviar email. Tente novamente.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Código de recuperação enviado por email.'
    });

  } catch (error) {
    console.error('Erro ao processar recuperação de senha:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor.'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}