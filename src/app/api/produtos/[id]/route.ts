import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Helper para fazer upload de um buffer para o Cloudinary
async function uploadToCloudinary(fileBuffer: Buffer, fileName: string, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: folder,
        public_id: `${folder}/${fileName.split('.')[0]}_${Date.now()}`,
        overwrite: true,
        format: 'webp',
        quality: 'auto:good',
        fetch_format: 'auto'
      },
      (error, result) => {
        if (error) {
          console.error('Erro no upload para Cloudinary:', error);
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Falha no upload sem erro específico'));
        }
      }
    ).end(fileBuffer);
  });
}

// Função de validação de ID (implementada)
function validateId(id: string): { isValid: boolean; numericId: number | null; error: string | null } {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    return { isValid: false, numericId: null, error: 'ID de produto inválido. Deve ser um número positivo.' };
  }
  return { isValid: true, numericId, error: null };
}

// Função para buscar produto (existente)
async function findProduct(id: number) {
  return await prisma.produto.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          interacoes: true,
        },
      },
    },
  });
}

// GET - Buscar produto específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isValid, numericId, error: idError } = validateId(params.id);
    if (!isValid || numericId === null) {
      return NextResponse.json({ success: false, error: idError, code: 'INVALID_ID' }, { status: 400 });
    }

    const produto = await findProduct(numericId);

    if (!produto) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Produto não encontrado',
          code: 'PRODUCT_NOT_FOUND'
        }, 
        { status: 404 }
      );
    }

    const produtoCompleto = {
      ...produto,
      totalInteracoes: produto._count.interacoes,
      disponivel: produto.estoque > 0,
      precoFormatado: `R$ ${produto.preco.toFixed(2).replace('.', ',')}`,
    };

    return NextResponse.json(
      { 
        success: true, 
        data: produtoCompleto,
        message: 'Produto encontrado com sucesso'
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=300',
        }
      }
    );
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
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

// PUT/PATCH - Atualizar produto (com upload de imagens)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isValid, numericId, error: idError } = validateId(params.id);
    if (!isValid || numericId === null) {
      return NextResponse.json({ success: false, error: idError, code: 'INVALID_ID' }, { status: 400 });
    }

    const formData = await request.formData();
    const nome = formData.get('nome') as string;
    const descricao = formData.get('descricao') as string | null;
    const precoStr = formData.get('preco') as string;
    const estoqueStr = formData.get('estoque') as string;
    const imagemUrlPrincipal = formData.get('imagemUrl') as string | null; // Imagem principal existente ou nova

    // URLs de imagens existentes a serem mantidas (o frontend deve enviar isso se quiser manter)
    const imagensExistentesStr = formData.get('imagensExistentes') as string | null; 
    let imagensExistentes: string[] = [];
    if (imagensExistentesStr) {
        try {
            imagensExistentes = JSON.parse(imagensExistentesStr);
        } catch (e) {
            console.warn("Formato inválido para imagensExistentes:", e);
        }
    }


    const preco = parseFloat(precoStr);
    const estoque = parseInt(estoqueStr, 10);

    if (!nome || isNaN(preco) || preco <= 0 || isNaN(estoque) || estoque < 0) {
      return NextResponse.json({ success: false, error: 'Dados inválidos. Verifique nome, preço e estoque.' }, { status: 400 });
    }

    const produtoExistente = await prisma.produto.findUnique({ where: { id: numericId }});
    if (!produtoExistente) {
        return NextResponse.json({ success: false, error: 'Produto não encontrado para atualização' }, { status: 404 });
    }

    const uploadedImageUrls: string[] = [];
    // Processar upload de novas imagens
    const files = formData.getAll('novasImagens') as File[]; // 'novasImagens' é o nome do campo no FormData

    for (const file of files) {
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const cloudinaryUrl = await uploadToCloudinary(buffer, file.name, `loja_roupas/produtos/${numericId}`);
        uploadedImageUrls.push(cloudinaryUrl);
      }
    }
    
    const dataToUpdate: any = {
      nome,
      descricao: descricao || undefined,
      preco,
      estoque,
      imagemUrl: imagemUrlPrincipal || produtoExistente.imagemUrl, // Mantém a antiga se nenhuma nova for enviada
    };

    // Combina imagens existentes (se enviadas pelo frontend) com as novas
    const todasImagens = Array.from(new Set([...imagensExistentes, ...uploadedImageUrls]));
    dataToUpdate.imagens = todasImagens;

    const produtoAtualizado = await prisma.produto.update({
      where: { id: numericId },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: produtoAtualizado, message: "Produto atualizado com sucesso." });

  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
        return NextResponse.json({ success: false, error: 'Produto não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: 'Erro interno do servidor ao atualizar produto' }, { status: 500 });
  }
}

// ✅ DELETE - Excluir produto (CORRIGIDO - EXCLUSÃO EM CASCATA)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    console.log(`🗑️ [API] Iniciando exclusão do produto ID: ${params.id}`);
    
    const { isValid, numericId, error: idError } = validateId(params.id);
    
    if (!isValid || numericId === null) {
      console.error('❌ [API] ID de produto inválido:', params.id);
      return NextResponse.json(
        { 
          success: false, 
          error: idError,
          code: 'INVALID_ID'
        }, 
        { status: 400 }
      );
    }

    const produto = await findProduct(numericId);
    if (produto === null) {
      console.error('❌ [API] Produto não encontrado:', numericId);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Produto não encontrado',
          code: 'PRODUCT_NOT_FOUND'
        }, 
        { status: 404 }
      );
    }

    console.log(`📋 [API] Produto encontrado: ${produto.nome} com ${produto._count.interacoes} interações`);

    // ✅ EXCLUSÃO EM CASCATA - Deletar interações primeiro se existirem
    if (produto._count.interacoes > 0) {
      console.log(`🔗 [API] Deletando ${produto._count.interacoes} interações do produto...`);
      
      const deletedInteracoes = await prisma.interacao.deleteMany({
        where: { produtoId: numericId }
      });
      
      console.log(`✅ [API] ${deletedInteracoes.count} interações deletadas`);
    }

    // ✅ Opcional: Deletar imagens do Cloudinary
    // TODO: Implementar limpeza de imagens do Cloudinary se necessário
    // if (produto.imagens && produto.imagens.length > 0) {
    //   const publicIds = produto.imagens.map(url => /* extrair public_id da url */);
    //   await cloudinary.api.delete_resources(publicIds);
    // }
    // if (produto.imagemUrl) {
    //   // extrair public_id e deletar
    // }

    // ✅ Deletar produto
    console.log(`🗑️ [API] Deletando produto: ${produto.nome}`);
    
    const produtoExcluido = await prisma.produto.delete({
      where: { id: numericId }
    });

    const totalTime = Date.now() - startTime;
    console.log(`✅ [API] Produto ${produto.nome} (ID: ${numericId}) excluído com sucesso em ${totalTime}ms`);

    return NextResponse.json(
      { 
        success: true, 
        data: {
          id: produtoExcluido.id,
          nome: produtoExcluido.nome,
          interacoesRemovidas: produto._count.interacoes
        },
        message: 'Produto excluído com sucesso',
        meta: {
          executionTime: totalTime,
          interacoesRemovidas: produto._count.interacoes,
          timestamp: new Date().toISOString()
        }
      },
      { status: 200 }
    );

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [API] Erro ao excluir produto (${totalTime}ms):`, error);
    
    if (error instanceof Error) {
      console.error('❌ [API] Stack trace:', error.stack);
    }
    
    // ✅ Tratamento de erros específicos do Prisma
    if (error instanceof Error && (error as any).code === 'P2003') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não é possível excluir produto pois ele está referenciado em outros registros (ex: pedidos).',
          code: 'FOREIGN_KEY_CONSTRAINT'
        }, 
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor ao excluir produto',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
        code: 'INTERNAL_ERROR'
      }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH - Atualização parcial (alias para PUT, pois PUT já lida com FormData e campos opcionais)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params });
}

// Tratamento para métodos não permitidos
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

