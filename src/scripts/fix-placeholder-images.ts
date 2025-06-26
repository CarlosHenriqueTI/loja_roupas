import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPlaceholderImages() {
  try {
    console.log('🧹 Limpando produtos com imagens problemáticas...');
    
    // 1. Atualizar produtos com URLs de placeholder problemáticas
    const produtosAtualizados = await prisma.produto.updateMany({
      where: {
        OR: [
          { imagemUrl: { contains: 'via.placeholder.com' } },
          { imagemUrl: { contains: 'placeholder.com' } },
          { imagemUrl: null },
          { imagemUrl: '' }
        ]
      },
      data: {
        imagemUrl: '/images/produtos/placeholder.jpg'
      }
    });
    
    console.log(`✅ ${produtosAtualizados.count} produtos atualizados com nova imagem padrão`);
    
    // 2. Limpar arrays de imagens problemáticas
    const todosProdutos = await prisma.produto.findMany({
      where: {
        imagens: { isEmpty: false }
      }
    });
    
    for (const produto of todosProdutos) {
      const imagensLimpas = produto.imagens.filter(img => 
        !img.includes('via.placeholder.com') && 
        !img.includes('placeholder.com') &&
        img.trim() !== ''
      );
      
      if (imagensLimpas.length !== produto.imagens.length) {
        await prisma.produto.update({
          where: { id: produto.id },
          data: {
            imagens: imagensLimpas.length > 0 ? imagensLimpas : []
          }
        });
        console.log(`🧹 Produto ${produto.id} - imagens limpas`);
      }
    }
    
    console.log('🎉 Limpeza de imagens concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao limpar imagens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPlaceholderImages();