import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema de validação para atualização de cliente
const updateClienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres').optional().nullable(),
  endereco: z.string().max(200, 'Endereço deve ter no máximo 200 caracteres').optional().nullable(),
});
 
// Interface para parâmetros
interface RouteParams {
  params: Promise<{ id: string }>;
}

// Função auxiliar para validar ID
function validateId(id: string): { isValid: boolean; numericId?: number; error?: string } {
  const numericId = parseInt(id, 10);
  
  if (isNaN(numericId)) {
    return { isValid: false, error: 'ID deve ser um número válido' };
  }
  
  if (numericId <= 0) {
    return { isValid: false, error: 'ID deve ser um número positivo' };
  }
  
  return { isValid: true, numericId };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const { isValid, numericId, error } = validateId(resolvedParams.id);
    
    if (!isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error,
          code: 'INVALID_ID'
        }, 
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: numericId },
      include: {
        interacoes: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true,
                imagemUrl: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!cliente) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cliente não encontrado',
          code: 'CLIENT_NOT_FOUND'
        }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: cliente,
      message: 'Cliente encontrado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const { isValid, numericId, error } = validateId(resolvedParams.id);
    
    if (!isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error,
          code: 'INVALID_ID'
        }, 
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: numericId },
      include: {
        _count: {
          select: {
            interacoes: true
          }
        }
      }
    });

    if (!cliente) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cliente não encontrado',
          code: 'CLIENT_NOT_FOUND'
        }, 
        { status: 404 }
      );
    }

    // Verificar se cliente tem interações
    if (cliente._count.interacoes > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não é possível excluir cliente com interações',
          code: 'HAS_INTERACTIONS',
          details: {
            interacoes: cliente._count.interacoes
          }
        }, 
        { status: 409 }
      );
    }

    await prisma.cliente.delete({
      where: { id: numericId }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Cliente excluído com sucesso',
      data: {
        id: cliente.id,
        nome: cliente.nome
      }
    });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const { isValid, numericId, error } = validateId(resolvedParams.id);
    
    if (!isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error,
          code: 'INVALID_ID'
        }, 
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = updateClienteSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dados inválidos',
          details: validationResult.error.errors,
          code: 'VALIDATION_ERROR'
        }, 
        { status: 400 }
      );
    }

    const dadosValidados = validationResult.data;

    // Verificar se email já existe (se estiver sendo alterado)
    if (dadosValidados.email) {
      const clienteExistente = await prisma.cliente.findFirst({
        where: {
          email: dadosValidados.email,
          id: { not: numericId }
        }
      });

      if (clienteExistente) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Email já está em uso',
            code: 'EMAIL_IN_USE'
          }, 
          { status: 409 }
        );
      }
    }

    const cliente = await prisma.cliente.update({
      where: { id: numericId },
      data: {
        ...dadosValidados,
        updatedAt: new Date()
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        endereco: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: cliente,
      message: 'Cliente atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      }, 
      { status: 500 }
    );
  }
}