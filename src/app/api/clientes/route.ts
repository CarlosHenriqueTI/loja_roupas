import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createClienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  telefone: z.string().max(20).optional(),
  endereco: z.string().max(500).optional()
});

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        endereco: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { interacoes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: clientes.map(cliente => ({
        ...cliente,
        totalInteracoes: cliente._count.interacoes
      }))
    });

  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validationResult = createClienteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Dados inválidos',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const dados = validationResult.data;

    // Verificar se email já existe
    const clienteExistente = await prisma.cliente.findUnique({
      where: { email: dados.email.toLowerCase() }
    });

    if (clienteExistente) {
      return NextResponse.json({
        success: false,
        error: 'Email já está cadastrado'
      }, { status: 409 });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(dados.senha, 12);

    // Criar cliente
    const cliente = await prisma.cliente.create({
      data: {
        ...dados,
        email: dados.email.toLowerCase(),
        senha: senhaHash
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        endereco: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: cliente
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}