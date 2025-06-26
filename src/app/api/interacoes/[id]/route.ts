import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    // Verificar se a interação existe
    const interacao = await prisma.interacao.findUnique({
      where: { id },
    });

    if (!interacao) {
      return NextResponse.json(
        { success: false, error: "Interação não encontrada" },
        { status: 404 }
      );
    }

    // Deletar a interação
    await prisma.interacao.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Interação excluída com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir interação:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Opcional: GET para buscar uma interação específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const interacao = await prisma.interacao.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        produto: {
          select: {
            id: true,
            nome: true,
            imagemUrl: true,
          },
        },
      },
    });

    if (!interacao) {
      return NextResponse.json(
        { success: false, error: "Interação não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: interacao,
    });
  } catch (error) {
    console.error("Erro ao buscar interação:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}