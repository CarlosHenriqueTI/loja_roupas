// filepath: src/app/api/clientes/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma"; // ✅ Use a instância global
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
        emailVerificado: true, // ✅ Adicione este campo
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

    // ✅ VERIFICAR SE O EMAIL FOI CONFIRMADO
    if (!cliente.emailVerificado) {
      console.log('❌ Email não confirmado para:', email);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.',
          needsEmailConfirmation: true // ✅ Flag para o front identificar
        },
        { status: 403 }
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

    // Retornar estrutura padronizada
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
  }
  // ❌ REMOVA o finally com prisma.$disconnect()
}