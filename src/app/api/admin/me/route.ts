import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token não fornecido' },
        { status: 401 }
      );
    }

    const token = authorization.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'Urban Icon-admin-secret';

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Buscar admin no banco - USAR adminId
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId }, // CORRIGIDO: usar adminId
      select: {
        id: true,
        nome: true,
        email: true,
        nivelAcesso: true,
        ultimoLogin: true,
        ultimoLogout: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return NextResponse.json(
      { success: false, error: 'Token inválido' },
      { status: 401 }
    );
  } finally {
    await prisma.$disconnect();
  }
}