import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

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
      ) as { adminId: number };

      console.log('🔐 Logout do admin ID:', decoded.adminId);

      // ✅ REGISTRAR LOGOUT NO BANCO DE DADOS
      await prisma.admin.update({
        where: { id: decoded.adminId },
        data: { 
          ultimoLogout: new Date()
        }
      });

      console.log('✅ Logout registrado no banco de dados');

      return NextResponse.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (jwtError) {
      // Mesmo com token inválido, consideramos logout bem-sucedido
      console.log('⚠️ Token inválido durante logout, mas prosseguindo...');
      return NextResponse.json({
        success: true,
        message: 'Logout realizado'
      });
    }

  } catch (error) {
    console.error('❌ Erro no logout:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

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