import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AdminPayload {
  adminId: string;
  email: string;
  nivelAcesso: 'SUPERADMIN' | 'ADMIN' | 'EDITOR';
}

export async function verifyAdminToken(request: Request): Promise<{
  success: boolean;
  admin?: AdminPayload;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return {
        success: false,
        error: 'Token de autorização necessário'
      };
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'Urban Icon-admin-secret'
    ) as AdminPayload;

    // Verificar se admin ainda existe
    const admin = await prisma.admin.findUnique({
      where: { id: parseInt(decoded.adminId) },
      select: { id: true, email: true, nivelAcesso: true }
    });

    if (!admin) {
      return {
        success: false,
        error: 'Administrador não encontrado'
      };
    }

    return {
      success: true,
      admin: {
        adminId: admin.id.toString(),
        email: admin.email,
        nivelAcesso: admin.nivelAcesso as 'SUPERADMIN' | 'ADMIN' | 'EDITOR'
      }
    };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return {
      success: false,
      error: 'Token inválido'
    };
  } finally {
    await prisma.$disconnect();
  }
}

export function requireAdminLevel(
  requiredLevel: 'SUPERADMIN' | 'ADMIN' | 'EDITOR'
) {
  return (admin: AdminPayload): boolean => {
    const levels = {
      'SUPERADMIN': 3,
      'ADMIN': 2,
      'EDITOR': 1
    };

    return levels[admin.nivelAcesso] >= levels[requiredLevel];
  };
}