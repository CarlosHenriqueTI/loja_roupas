import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AdminPayload {
  adminId: number;
  email: string;
  nivelAcesso: 'SUPERADMIN' | 'ADMIN' | 'EDITOR';
  nome?: string;
  iat?: number;
  exp?: number;
}

export async function verifyAdminAuth(request: NextRequest): Promise<{
  success: boolean;
  admin?: AdminPayload;
  error?: string;
  status?: number;
}> {
  try {
    console.log('🔐 [Auth] Verificando autenticação admin...');
    
    // Extrair token do header
    const authHeader = request.headers.get('authorization');
    console.log('🔑 [Auth] Header Authorization:', authHeader ? 'Presente' : 'Ausente');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ [Auth] Token de autorização ausente ou formato inválido');
      return {
        success: false,
        error: 'Token de autorização necessário',
        status: 401
      };
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('❌ [Auth] Token não fornecido');
      return {
        success: false,
        error: 'Token não fornecido',
        status: 401
      };
    }

    console.log('🔍 [Auth] Token extraído, verificando...');

    // ✅ Verificar se JWT_SECRET existe
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('❌ [Auth] JWT_SECRET não configurado no ambiente');
      return {
        success: false,
        error: 'Configuração de segurança inválida',
        status: 500
      };
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, jwtSecret) as AdminPayload;
    console.log('✅ [Auth] Token decodificado:', { 
      adminId: decoded.adminId, 
      email: decoded.email, 
      nivelAcesso: decoded.nivelAcesso 
    });

    // ✅ Verificar se admin ainda existe e está ativo
    const admin = await prisma.admin.findUnique({
      where: { 
        id: decoded.adminId
      },
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
      console.error('❌ [Auth] Admin não encontrado:', decoded.adminId);
      return {
        success: false,
        error: 'Administrador não encontrado',
        status: 401
      };
    }

    console.log('✅ [Auth] Admin verificado:', { 
      id: admin.id, 
      nome: admin.nome, 
      nivelAcesso: admin.nivelAcesso 
    });

    return {
      success: true,
      admin: {
        adminId: admin.id,
        email: admin.email,
        nome: admin.nome,
        nivelAcesso: admin.nivelAcesso as 'SUPERADMIN' | 'ADMIN' | 'EDITOR'
      }
    };

  } catch (error) {
    console.error('❌ [Auth] Erro na verificação:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      console.error('❌ [Auth] Token expirado');
      return {
        success: false,
        error: 'Token expirado',
        status: 401
      };
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('❌ [Auth] Token inválido');
      return {
        success: false,
        error: 'Token inválido',
        status: 401
      };
    }

    return {
      success: false,
      error: 'Erro na verificação de autenticação',
      status: 500
    };
  } finally {
    await prisma.$disconnect();
  }
}

export function checkAdminLevel(
  adminLevel: 'SUPERADMIN' | 'ADMIN' | 'EDITOR',
  requiredLevel: 'SUPERADMIN' | 'ADMIN' | 'EDITOR'
): boolean {
  const levels = {
    'SUPERADMIN': 3,
    'ADMIN': 2,
    'EDITOR': 1
  };

  const hasPermission = levels[adminLevel] >= levels[requiredLevel];
  console.log(`🔒 [Auth] Verificação de nível: ${adminLevel} >= ${requiredLevel} = ${hasPermission}`);
  
  return hasPermission;
}