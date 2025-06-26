import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { tipo, conteudo, clienteId, produtoId, nota } = await request.json();

    // Validações básicas
    if (!tipo || !clienteId || !produtoId) {
      return NextResponse.json(
        { success: false, error: "Tipo, clienteId e produtoId são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar nota se fornecida
    if (nota !== undefined && nota !== null) {
      if (typeof nota !== 'number' || nota < 1 || nota > 5) {
        return NextResponse.json(
          { success: false, error: "Nota deve ser um número entre 1 e 5" },
          { status: 400 }
        );
      }
    }

    const interacao = await prisma.interacao.create({
      data: {
        tipo,
        conteudo: conteudo || null,
        clienteId: Number(clienteId),
        produtoId: Number(produtoId),
        nota: nota ? Number(nota) : null,
        // createdAt é automático, não precisa ser definido
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
      data: interacao
    });

  } catch (error) {
    console.error("Erro ao criar interação:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}