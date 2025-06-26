import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const produtoId = searchParams.get("produtoId");

    let whereClause = {};
    if (produtoId) {
      whereClause = { produtoId: parseInt(produtoId) };
    }

    const interacoes = await prisma.interacao.findMany({
      where: whereClause,
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
      },
      orderBy: {
        id: "desc"
      }
    });

    return NextResponse.json({
      success: true,
      data: interacoes
    });

  } catch (error) {
    console.error("Erro ao buscar interações:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}