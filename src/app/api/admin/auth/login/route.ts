import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, senha } = await request.json();

    // Validação dos dados
    if (!email || !senha) {
      return NextResponse.json({
        success: false,
        error: 'Email e senha são obrigatórios'
      }, { status: 400 });
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Formato de email inválido'
      }, { status: 400 });
    }

    // Buscar admin no banco
    const admin = await prisma.admin.findUnique({
      where: { 
        email: email.toLowerCase() 
      }
    });

    if (!admin) {
      return NextResponse.json({
        success: false,
        error: 'Email ou senha incorretos'
      }, { status: 401 });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, admin.senha);
    if (!senhaValida) {
      return NextResponse.json({
        success: false,
        error: 'Email ou senha incorretos'
      }, { status: 401 });
    }

    // Gerar JWT token
    const token = jwt.sign(
      { 
        adminId: admin.id,
        email: admin.email,
        nivelAcesso: admin.nivelAcesso
      },
      process.env.JWT_SECRET || 'modastyle-admin-secret',
      { 
        expiresIn: '7d' // Token válido por 7 dias
      }
    );

    // Atualizar último login
    await prisma.admin.update({
      where: { id: admin.id },
      data: { 
        ultimoLogin: new Date() 
      }
    });

    // Dados do admin para retorno (sem senha)
    const adminData = {
      id: admin.id,
      nome: admin.nome,
      email: admin.email,
      nivelAcesso: admin.nivelAcesso,
      ultimoLogin: new Date()
    };

    return NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      admin: adminData
    });

  } catch (error) {
    console.error('Erro no login admin:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Método OPTIONS para CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}