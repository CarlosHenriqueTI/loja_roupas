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
      process.env.JWT_SECRET || 'Urban Icon-admin-secret'
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
    console.log('📡 [API] Recebida requisição para listar administradores');
    
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      console.log('❌ [API] Falha na autenticação:', authResult.error);
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    // Apenas SUPERADMIN pode listar administradores
    if (authResult.admin.nivelAcesso !== 'SUPERADMIN') {
      console.log('❌ [API] Acesso negado - nível insuficiente:', authResult.admin.nivelAcesso);
      return NextResponse.json(
        { success: false, error: 'Apenas SUPERADMIN pode visualizar administradores' },
        { status: 403 }
      );
    }

    console.log('✅ [API] Autenticação válida, buscando administradores...');

    // Buscar todos os administradores (incluindo campo status)
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        nivelAcesso: true,
        emailVerificado: true,
        ativo: true,
        status: true, // ✅ INCLUIR CAMPO STATUS
        ultimoLogin: true,
        ultimoLogout: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { nivelAcesso: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    console.log(`✅ [API] ${admins.length} administradores encontrados`);

    return NextResponse.json({ 
      success: true, 
      admins: admins 
    });

  } catch (error) {
    console.error('❌ [API] Erro ao buscar admins:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}