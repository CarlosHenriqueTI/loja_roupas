// filepath: src/app/api/clientes/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, senha } = body;

    console.log('🔄 Tentativa de login para:', email);

    // Validações
    if (!email || !senha) {
      console.log('❌ Email ou senha não fornecidos');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email e senha são obrigatórios' 
        },
        { status: 400 }
      );
    }

    if (!email.includes('@')) {
      console.log('❌ Email inválido:', email);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email inválido' 
        },
        { status: 400 }
      );
    }

    // Buscar cliente no banco
    const cliente = await prisma.cliente.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        nome: true,
        email: true,
        senha: true,
        telefone: true,
        endereco: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!cliente) {
      console.log('❌ Cliente não encontrado:', email);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email ou senha incorretos' 
        },
        { status: 401 }
      );
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, cliente.senha);

    if (!senhaValida) {
      console.log('❌ Senha incorreta para:', email);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email ou senha incorretos' 
        },
        { status: 401 }
      );
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        clienteId: cliente.id,
        email: cliente.email,
        nome: cliente.nome
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Remover senha do retorno
    const { senha: _, ...clienteSemSenha } = cliente;

    console.log('✅ Login bem-sucedido para:', cliente.nome);

    // ✅ Retornar estrutura padronizada
    return NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        cliente: clienteSemSenha,
        token: token
      }
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}