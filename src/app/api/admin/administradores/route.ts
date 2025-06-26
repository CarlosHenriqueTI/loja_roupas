import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Função para verificar autenticação
async function verifyAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return { success: false, error: 'Token de autorização necessário', status: 401 };
    }

    const token = authHeader.replace('Bearer ', '');
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'modastyle-admin-secret'
    ) as { adminId: number; email: string; nivelAcesso: string };

    // Verificar se admin ainda existe
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
      select: { id: true, email: true, nivelAcesso: true }
    });

    if (!admin) {
      return { success: false, error: 'Administrador não encontrado', status: 404 };
    }

    return {
      success: true,
      admin: {
        adminId: admin.id,
        email: admin.email,
        nivelAcesso: admin.nivelAcesso as 'SUPERADMIN' | 'ADMIN' | 'EDITOR'
      }
    };

  } catch (error) {
    return { success: false, error: 'Token inválido', status: 401 };
  }
}

// Listar administradores
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    // Apenas SUPERADMIN e ADMIN podem listar
    const userLevel = authResult.admin!.nivelAcesso;
    if (userLevel !== 'SUPERADMIN' && userLevel !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        nivelAcesso: true,
        emailVerificado: true,
        ultimoLogin: true,
        ultimoLogout: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ 
      success: true, 
      admins: admins 
    });

  } catch (error) {
    console.error('Erro ao buscar admins:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}