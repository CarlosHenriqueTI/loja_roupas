import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { interacaoId, resposta, adminId, produtoId } = await request.json();

    // Validações
    if (!resposta || !resposta.trim()) {
      return NextResponse.json(
        { success: false, error: "Resposta é obrigatória" },
        { status: 400 }
      );
    }

    if (!adminId) {
      return NextResponse.json(
        { success: false, error: "ID do admin é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a interação original existe
    if (interacaoId) {
      const interacaoOriginal = await prisma.interacao.findUnique({
        where: { id: interacaoId }
      });

      if (!interacaoOriginal) {
        return NextResponse.json(
          { success: false, error: "Interação original não encontrada" },
          { status: 404 }
        );
      }
    }

    // Verificar se o admin existe
    const admin = await prisma.admin.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin não encontrado" },
        { status: 404 }
      );
    }

    // Criar a resposta do admin
    const respostaInteracao = await prisma.interacao.create({
      data: {
        tipo: 'RESPOSTA_ADMIN',
        conteudo: resposta,
        clienteId: adminId, // Admin como "cliente" para esta resposta
        produtoId: produtoId ? Number(produtoId) : 1, // Produto obrigatório
        // createdAt é automático
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        produto: {
          select: {
            id: true,
            nome: true,
            imagemUrl: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: respostaInteracao
    });

  } catch (error) {
    console.error("Erro ao criar resposta:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}