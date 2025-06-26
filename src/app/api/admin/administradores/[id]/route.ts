import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Função para verificar autenticação (mesma da API anterior)
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

// Deletar admin específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    // Apenas SUPERADMIN pode deletar
    if (authResult.admin!.nivelAcesso !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, error: 'Apenas SUPERADMIN pode deletar administradores' },
        { status: 403 }
      );
    }

    const adminId = parseInt(params.id);

    // Não pode deletar a si mesmo
    if (authResult.admin!.adminId === adminId) {
      return NextResponse.json(
        { success: false, error: 'Você não pode deletar sua própria conta' },
        { status: 400 }
      );
    }

    // Verificar se admin existe
    const adminExistente = await prisma.admin.findUnique({
      where: { id: adminId }
    });

    if (!adminExistente) {
      return NextResponse.json(
        { success: false, error: 'Administrador não encontrado' },
        { status: 404 }
      );
    }

    // Deletar admin
    await prisma.admin.delete({
      where: { id: adminId }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Administrador deletado com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao deletar admin:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}