// filepath: src/app/api/clientes/cadastro/route.ts
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email';
import { generateConfirmationToken, getTokenExpiration } from '@/lib/tokens';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { nome, email, senha, telefone, endereco } = body;

    // Validações
    if (!nome || !email || !senha) {
      return NextResponse.json({ 
        success: false,
        error: 'Nome, email e senha são obrigatórios.' 
      }, { status: 400 });
    }

    nome = String(nome).trim();
    email = String(email).trim().toLowerCase();
    senha = String(senha);

    if (nome.length < 3) {
      return NextResponse.json({ 
        success: false,
        error: 'O nome deve ter pelo menos 3 caracteres.' 
      }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ 
        success: false,
        error: 'Formato de email inválido.' 
      }, { status: 400 });
    }

    if (senha.length < 6) {
      return NextResponse.json({ 
        success: false,
        error: 'A senha deve ter pelo menos 6 caracteres.' 
      }, { status: 400 });
    }

    // Verificar se email já existe
    const clienteExistente = await prisma.cliente.findUnique({
      where: { email: email },
    });

    if (clienteExistente) {
      return NextResponse.json({ 
        success: false,
        error: 'Este email já está cadastrado.' 
      }, { status: 409 });
    }

    // Gerar token de confirmação
    const confirmationToken = generateConfirmationToken();
    const tokenExpiration = getTokenExpiration(24); // 24 horas

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    // Criar cliente
    const novoCliente = await prisma.cliente.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        telefone: telefone || null,
        endereco: endereco || null,
        emailVerificado: false,
        emailToken: confirmationToken,
        emailTokenExpira: tokenExpiration,
      },
    });

    // Enviar email de confirmação
    try {
      const emailTemplate = emailService.generateConfirmationEmail(nome, confirmationToken);
      await emailService.sendEmail(email, emailTemplate);
      console.log('Email de confirmação enviado para:', email);
    } catch (emailError) {
      console.error('Erro ao enviar email de confirmação:', emailError);
      // Não falhar o cadastro se email falhar
    }

    // Remover dados sensíveis da resposta
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { senha: _, emailToken, ...clienteSemSenha } = novoCliente;

    return NextResponse.json({
      success: true,
      message: 'Cadastro realizado com sucesso! Verifique seu email para confirmar a conta.',
      data: {
        id: String(clienteSemSenha.id),
        nome: clienteSemSenha.nome,
        email: clienteSemSenha.email,
        emailVerificado: clienteSemSenha.emailVerificado
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erro no cadastro do cliente:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ 
          success: false,
          error: 'Este email já está cadastrado.' 
        }, { status: 409 });
      }
    }
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor.' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}