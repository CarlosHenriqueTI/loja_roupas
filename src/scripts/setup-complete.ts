// src/scripts/setup-complete.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupComplete() {
  try {
    console.log('🚀 Iniciando setup completo do ModaStyle...\n');

    // 1. Limpar banco
    console.log('🧹 Limpando banco de dados...');
    await prisma.interacao.deleteMany();
    await prisma.produto.deleteMany();
    await prisma.cliente.deleteMany();
    await prisma.admin.deleteMany();
    console.log('✅ Banco limpo\n');

    // 2. Criar administradores
    console.log('👥 Criando administradores...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    const admins = await prisma.admin.createMany({
      data: [
        {
          nome: 'Super Administrador',
          email: 'superadmin@modastyle.com',
          senha: adminPassword,
          nivelAcesso: 'SUPERADMIN'
        },
        {
          nome: 'Administrador',
          email: 'admin@modastyle.com',
          senha: adminPassword,
          nivelAcesso: 'ADMIN'
        },
        {
          nome: 'Editor',
          email: 'editor@modastyle.com',
          senha: adminPassword,
          nivelAcesso: 'EDITOR'
        }
      ]
    });
    console.log(`✅ ${admins.count} administradores criados\n`);

    // 3. Criar clientes
    console.log('👤 Criando clientes...');
    const clientePassword = await bcrypt.hash('123456', 12);
    
    const clientes = await prisma.cliente.createMany({
      data: [
        {
          nome: 'João Silva',
          email: 'joao@teste.com',
          senha: clientePassword,
          telefone: '(11) 99999-1111',
          endereco: 'Rua A, 123, São Paulo - SP',
          emailVerificado: true
        },
        {
          nome: 'Maria Santos',
          email: 'maria@teste.com',
          senha: clientePassword,
          telefone: '(11) 99999-2222',
          endereco: 'Rua B, 456, São Paulo - SP',
          emailVerificado: true
        },
        {
          nome: 'Pedro Costa',
          email: 'pedro@teste.com',
          senha: clientePassword,
          telefone: '(11) 99999-3333',
          endereco: 'Rua C, 789, São Paulo - SP',
          emailVerificado: false
        }
      ]
    });
    console.log(`✅ ${clientes.count} clientes criados\n`);

    // 4. Criar produtos
    console.log('🛍️ Criando produtos...');
    const produtos = await prisma.produto.createMany({
      data: [
        {
          nome: 'Camiseta Premium Básica',
          descricao: 'Camiseta de algodão premium com corte moderno e toque suave',
          preco: 79.90,
          categoria: 'camisetas',
          tamanhos: JSON.stringify(['PP', 'P', 'M', 'G', 'GG']),
          cores: JSON.stringify(['#000000', '#FFFFFF', '#808080', '#1e40af']),
          estoque: 100,
          disponivel: true,
          destaque: true,
          imagemUrl: 'https://via.placeholder.com/400x400/000000/FFFFFF?text=Camiseta+Premium'
        },
        {
          nome: 'Calça Jeans Slim Fit',
          descricao: 'Calça jeans com modelagem slim e lavação moderna',
          preco: 149.90,
          categoria: 'calcas',
          tamanhos: JSON.stringify(['36', '38', '40', '42', '44', '46']),
          cores: JSON.stringify(['#1e40af', '#374151', '#6b7280']),
          estoque: 75,
          disponivel: true,
          destaque: false,
          imagemUrl: 'https://via.placeholder.com/400x400/1e40af/FFFFFF?text=Calça+Jeans'
        },
        {
          nome: 'Vestido Floral Verão',
          descricao: 'Vestido floral leve e confortável, perfeito para o verão',
          preco: 199.90,
          categoria: 'vestidos',
          tamanhos: JSON.stringify(['PP', 'P', 'M', 'G']),
          cores: JSON.stringify(['#fbbf24', '#ec4899', '#10b981']),
          estoque: 50,
          disponivel: true,
          destaque: true,
          imagemUrl: 'https://via.placeholder.com/400x400/ec4899/FFFFFF?text=Vestido+Floral'
        },
        {
          nome: 'Jaqueta Bomber Urban',
          descricao: 'Jaqueta bomber estilo urbano com acabamento premium',
          preco: 299.90,
          categoria: 'jaquetas',
          tamanhos: JSON.stringify(['P', 'M', 'G', 'GG']),
          cores: JSON.stringify(['#000000', '#059669', '#dc2626']),
          estoque: 30,
          disponivel: true,
          destaque: false,
          imagemUrl: 'https://via.placeholder.com/400x400/000000/FFFFFF?text=Jaqueta+Bomber'
        },
        {
          nome: 'Saia Midi Elegante',
          descricao: 'Saia midi com corte elegante para ocasiões especiais',
          preco: 129.90,
          categoria: 'saias',
          tamanhos: JSON.stringify(['PP', 'P', 'M', 'G']),
          cores: JSON.stringify(['#000000', '#374151', '#7c2d12']),
          estoque: 40,
          disponivel: true,
          destaque: false,
          imagemUrl: 'https://via.placeholder.com/400x400/374151/FFFFFF?text=Saia+Midi'
        },
        {
          nome: 'Blusa Social Feminina',
          descricao: 'Blusa social elegante para ambiente profissional',
          preco: 119.90,
          categoria: 'blusas',
          tamanhos: JSON.stringify(['PP', 'P', 'M', 'G', 'GG']),
          cores: JSON.stringify(['#FFFFFF', '#f3f4f6', '#e5e7eb']),
          estoque: 60,
          disponivel: true,
          destaque: true,
          imagemUrl: 'https://via.placeholder.com/400x400/f3f4f6/374151?text=Blusa+Social'
        }
      ]
    });
    console.log(`✅ ${produtos.count} produtos criados\n`);

    // 5. Buscar IDs para criar interações
    const clientesCriados = await prisma.cliente.findMany();
    const produtosCriados = await prisma.produto.findMany();

    // 6. Criar interações
    console.log('💬 Criando interações...');
    const interacoes = await prisma.interacao.createMany({
      data: [
        {
          tipo: 'COMENTARIO',
          conteudo: 'Produto de excelente qualidade! Super recomendo!',
          clienteId: clientesCriados[0].id,
          produtoId: produtosCriados[0].id
        },
        {
          tipo: 'AVALIACAO',
          conteudo: 'Muito bom, tecido macio e caimento perfeito.',
          nota: 5,
          clienteId: clientesCriados[1].id,
          produtoId: produtosCriados[0].id
        },
        {
          tipo: 'COMENTARIO',
          conteudo: 'Calça muito confortável, comprei duas!',
          clienteId: clientesCriados[2].id,
          produtoId: produtosCriados[1].id
        },
        {
          tipo: 'CURTIDA',
          clienteId: clientesCriados[0].id,
          produtoId: produtosCriados[2].id
        },
        {
          tipo: 'AVALIACAO',
          conteudo: 'Vestido lindo, recebi muitos elogios!',
          nota: 5,
          clienteId: clientesCriados[1].id,
          produtoId: produtosCriados[2].id
        },
        {
          tipo: 'COMPARTILHAMENTO',
          conteudo: 'Compartilhando essa jaqueta incrível!',
          clienteId: clientesCriados[2].id,
          produtoId: produtosCriados[3].id
        },
        {
          tipo: 'COMPRA',
          conteudo: 'Compra realizada com sucesso!',
          clienteId: clientesCriados[0].id,
          produtoId: produtosCriados[0].id
        }
      ]
    });
    console.log(`✅ ${interacoes.count} interações criadas\n`);

    // 7. Estatísticas finais
    console.log('📊 Estatísticas do banco:');
    const stats = await Promise.all([
      prisma.admin.count(),
      prisma.cliente.count(),
      prisma.produto.count(),
      prisma.interacao.count()
    ]);

    console.log(`👥 Administradores: ${stats[0]}`);
    console.log(`👤 Clientes: ${stats[1]}`);
    console.log(`🛍️  Produtos: ${stats[2]}`);
    console.log(`💬 Interações: ${stats[3]}\n`);

    console.log('🎉 Setup completo realizado com sucesso!\n');
    
    console.log('📋 Credenciais de Acesso Admin:');
    console.log('┌─────────────┬─────────────────────────────┬─────────────┐');
    console.log('│ Nível       │ Email                       │ Senha       │');
    console.log('├─────────────┼─────────────────────────────┼─────────────┤');
    console.log('│ SUPERADMIN  │ superadmin@modastyle.com    │ admin123    │');
    console.log('│ ADMIN       │ admin@modastyle.com         │ admin123    │');
    console.log('│ EDITOR      │ editor@modastyle.com        │ admin123    │');
    console.log('└─────────────┴─────────────────────────────┴─────────────┘\n');

    console.log('📋 Credenciais de Cliente:');
    console.log('• Email: joao@teste.com | maria@teste.com | pedro@teste.com');
    console.log('• Senha: 123456 (para todos)\n');

    console.log('🔗 URLs importantes:');
    console.log('• Admin Login: http://localhost:3000/admin/login');
    console.log('• Cliente Login: http://localhost:3000/clientes/login');
    console.log('• Loja: http://localhost:3000');
    console.log('• Prisma Studio: npx prisma studio\n');

    console.log('⚠️  IMPORTANTE:');
    console.log('• Altere as senhas padrão em produção!');
    console.log('• Configure variáveis de ambiente adequadas');
    console.log('• Use HTTPS em produção');

  } catch (error) {
    console.error('❌ Erro no setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupComplete();