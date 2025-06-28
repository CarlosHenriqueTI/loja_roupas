import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { tipo, conteudo, clienteId, produtoId, nota } = await request.json();

    // Só permite COMENTARIO ou AVALIACAO
    const tipoNormalizado = (tipo || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (tipoNormalizado !== "COMENTARIO" && tipoNormalizado !== "AVALIACAO") {
      return NextResponse.json(
        { success: false, error: "Só é permitido COMENTARIO ou AVALIACAO" },
        { status: 400 }
      );
    }

    // Comentário precisa de texto, avaliação precisa de nota
    if (tipoNormalizado === "COMENTARIO" && (!conteudo || !conteudo.trim())) {
      return NextResponse.json(
        { success: false, error: "Comentário não pode ser vazio" },
        { status: 400 }
      );
    }
    if (tipoNormalizado === "AVALIACAO" && (typeof nota !== 'number' || nota < 1 || nota > 5)) {
      return NextResponse.json(
        { success: false, error: "Avaliação deve ser um número entre 1 e 5" },
        { status: 400 }
      );
    }

    const interacao = await prisma.interacao.create({
      data: {
        tipo: tipoNormalizado,
        conteudo: conteudo || null,
        clienteId: Number(clienteId),
        produtoId: Number(produtoId),
        nota: tipoNormalizado === "AVALIACAO" ? Number(nota) : null,
      },
      include: {
        cliente: { select: { id: true, nome: true, email: true } },
        produto: { select: { id: true, nome: true, imagemUrl: true } }
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