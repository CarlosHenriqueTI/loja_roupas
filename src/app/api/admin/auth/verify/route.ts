import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Extrair token do header Authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token de autorização não fornecido'
      }, { status: 401 });
    }

    try {
      // Verificar e decodificar o token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'Urban Icon-admin-secret'
      ) as { adminId: string; email: string; nivelAcesso: string; iat: number; exp: number };

      // Buscar admin no banco para verificar se ainda existe e está ativo
      const admin = await prisma.admin.findUnique({
        where: { id: parseInt(decoded.adminId) },
        select: {
          id: true,
          nome: true,
          email: true,
          nivelAcesso: true,
          ultimoLogin: true,
          createdAt: true
        }
      });

      if (!admin) {
        return NextResponse.json({
          success: false,
          error: 'Administrador não encontrado ou inativo'
        }, { status: 404 });
      }

      // Verificar se o token não expirou (verificação extra)
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        return NextResponse.json({
          success: false,
          error: 'Token expirado'
        }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        message: 'Token válido',
        admin: {
          id: admin.id,
          nome: admin.nome,
          email: admin.email,
          nivelAcesso: admin.nivelAcesso,
          ultimoLogin: admin.ultimoLogin,
          createdAt: admin.createdAt
        },
        tokenInfo: {
          issuedAt: new Date(decoded.iat * 1000),
          expiresAt: new Date(decoded.exp * 1000),
          remainingTime: decoded.exp - now
        }
      });

    } catch (jwtError) {
      console.error('Erro na verificação do JWT:', jwtError);
      
      if (jwtError instanceof jwt.TokenExpiredError) {
        return NextResponse.json({
          success: false,
          error: 'Token expirado'
        }, { status: 401 });
      }
      
      if (jwtError instanceof jwt.JsonWebTokenError) {
        return NextResponse.json({
          success: false,
          error: 'Token inválido'
        }, { status: 401 });
      }

      return NextResponse.json({
        success: false,
        error: 'Erro na verificação do token'
      }, { status: 401 });
    }

  } catch (error) {
    console.error('Erro na verificação de autenticação:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Método POST para refresh do token
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token não fornecido'
      }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'Urban Icon-admin-secret'
      ) as { adminId: string; email: string; nivelAcesso: string; iat: number; exp: number };

      const admin = await prisma.admin.findUnique({
        where: { id: parseInt(decoded.adminId) },
        select: {
          id: true,
          nome: true,
          email: true,
          nivelAcesso: true
        }
      });

      if (!admin) {
        return NextResponse.json({
          success: false,
          error: 'Administrador não encontrado'
        }, { status: 404 });
      }

      // Gerar novo token
      const newToken = jwt.sign(
        { 
          adminId: admin.id,
          email: admin.email,
          nivelAcesso: admin.nivelAcesso
        },
        process.env.JWT_SECRET || 'Urban Icon-admin-secret',
        { 
          expiresIn: '7d'
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Token renovado com sucesso',
        token: newToken,
        admin
      });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (jwtError) {
      return NextResponse.json({
        success: false,
        error: 'Token inválido para renovação'
      }, { status: 401 });
    }

  } catch (error) {
    console.error('Erro na renovação do token:', error);
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}