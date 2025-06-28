// filepath: loja_roupas/src/app/api/produtos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import prisma from "@/lib/prisma"; // ✅ Use a instância global

// Configurar Cloudinary (se você usar)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Helper para upload (opcional)
async function uploadToCloudinary(fileBuffer: Buffer, fileName: string, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: folder,
        public_id: fileName.split('.')[0],
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    ).end(fileBuffer);
  });
}

// GET - Listar produtos
export async function GET(request: NextRequest) {
  try {
    console.log("🛍️ Buscando produtos...");

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const categoria = searchParams.get('categoria');
    const search = searchParams.get('busca');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    const where: any = {
      disponivel: true
    };

    if (categoria && categoria !== 'todas') {
      where.categoria = { equals: categoria, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
        { categoria: { contains: search, mode: 'insensitive' } }
      ];
    }

    const offset = (page - 1) * limit;
    const validOrder = ['asc', 'desc'];
    const validSortBy = ['createdAt', 'preco', 'nome', 'estoque'];
    const finalOrder = validOrder.includes(order) ? order as 'asc' | 'desc' : 'desc';
    const finalSortBy = validSortBy.includes(sortBy) ? sortBy : 'createdAt';

    const [produtos, total] = await Promise.all([
      prisma.produto.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [finalSortBy]: finalOrder },
        include: {
          _count: {
            select: { interacoes: true }
          }
        }
      }),
      prisma.produto.count({ where })
    ]);

    const produtosFormatados = produtos.map(produto => ({
      ...produto,
      preco: Number(produto.preco),
      tamanhos: produto.tamanhos ? JSON.parse(produto.tamanhos) : [],
      cores: produto.cores ? JSON.parse(produto.cores) : [],
      totalInteracoes: produto._count.interacoes
    }));

    console.log(`✅ ${produtos.length} produtos encontrados`);

    return NextResponse.json({
      success: true,
      data: produtosFormatados,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : "Erro desconhecido"
    }, { status: 500 });
  }
}

// POST - Criar produto (com upload de imagens)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const nome = formData.get('nome') as string;
    const descricao = formData.get('descricao') as string;
    const precoStr = formData.get('preco') as string;
    const estoqueStr = formData.get('estoque') as string;
    const imagemUrl = formData.get('imagemUrl') as string;

    // ✅ Validação básica sem tentar acessar URLs externas
    if (!nome || !precoStr || !estoqueStr) {
      return NextResponse.json({
        success: false,
        error: 'Nome, preço e estoque são obrigatórios'
      }, { status: 400 });
    }

    const preco = parseFloat(precoStr);
    const estoque = parseInt(estoqueStr, 10);

    if (isNaN(preco) || preco <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Preço deve ser um número positivo'
      }, { status: 400 });
    }

    if (isNaN(estoque) || estoque < 0) {
      return NextResponse.json({
        success: false,
        error: 'Estoque deve ser um número válido'
      }, { status: 400 });
    }

    // ✅ Verificar se nome já existe
    const produtoExistente = await prisma.produto.findFirst({
      where: { 
        nome: {
          equals: nome.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (produtoExistente) {
      return NextResponse.json({
        success: false,
        error: 'Já existe um produto com este nome'
      }, { status: 409 });
    }

    // ✅ Processar upload de novas imagens
    const uploadedImageUrls: string[] = [];
    const novasImagens = formData.getAll('novasImagens') as File[];
    
    for (const file of novasImagens) {
      if (file && file.size > 0) {
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const uploadedUrl = await uploadToCloudinary(buffer, file.name, 'produtos');
          uploadedImageUrls.push(uploadedUrl);
        } catch (uploadError) {
          console.warn('Erro ao fazer upload de imagem:', uploadError);
          // Continua mesmo se uma imagem falhar
        }
      }
    }

    // ✅ Definir imagem principal
    let imagemPrincipal = '/images/produtos/placeholder.jpg'; // Padrão local
    
    if (imagemUrl && imagemUrl.trim() && !imagemUrl.includes('via.placeholder.com')) {
      imagemPrincipal = imagemUrl.trim();
    } else if (uploadedImageUrls.length > 0) {
      imagemPrincipal = uploadedImageUrls[0];
    }

    // ✅ Criar produto
    const produto = await prisma.produto.create({
      data: {
        nome: nome.trim(),
        descricao: descricao?.trim() || '',
        preco: preco,
        estoque: estoque,
        imagemUrl: imagemPrincipal,
        imagens: uploadedImageUrls,
        disponivel: true,
        categoria: 'Geral' // Categoria padrão
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...produto,
        preco: Number(produto.preco)
      },
      message: 'Produto criado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Erro ao criar produto:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}