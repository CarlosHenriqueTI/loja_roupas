// src/scripts/seed-all.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAll() {
  try {
    console.log('🌱 Populando banco de dados...');

    // 1. Criar Admin
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.admin.create({
      data: {
        nome: 'Administrador',
        email: 'admin@modastyle.com',
        senha: adminPassword,
        nivelAcesso: 'SUPERADMIN'
      }
    });
    console.log('✅ Admin criado:', admin.email);

    // 2. Criar Clientes
    const clientePassword = await bcrypt.hash('123456', 12);
    const clientes = await prisma.cliente.createMany({
      data: [
        {
          nome: 'João Silva',
          email: 'joao@teste.com',
          senha: clientePassword,
          telefone: '(11) 99999-1111',
          endereco: 'Rua A, 123'
        },
        {
          nome: 'Maria Santos',
          email: 'maria@teste.com',
          senha: clientePassword,
          telefone: '(11) 99999-2222',
          endereco: 'Rua B, 456'
        }
      ]
    });
    console.log('✅ Clientes criados:', clientes.count);

    // 3. Criar Produtos
    const produtos = await prisma.produto.createMany({
      data: [
        {
          nome: 'Camiseta Básica',
          descricao: 'Camiseta 100% algodão',
          preco: 49.90,
          categoria: 'camisetas',
          tamanhos: JSON.stringify(['P', 'M', 'G']),
          cores: JSON.stringify(['#000000', '#FFFFFF']),
          estoque: 50,
          destaque: true
        },
        {
          nome: 'Calça Jeans',
          descricao: 'Calça jeans slim fit',
          preco: 129.90,
          categoria: 'calcas',
          tamanhos: JSON.stringify(['36', '38', '40', '42']),
          cores: JSON.stringify(['#1e40af', '#374151']),
          estoque: 30,
          destaque: false
        },
        {
          nome: 'Vestido Floral',
          descricao: 'Vestido estampado para verão',
          preco: 89.90,
          categoria: 'vestidos',
          tamanhos: JSON.stringify(['PP', 'P', 'M', 'G']),
          cores: JSON.stringify(['#f97316', '#ec4899']),
          estoque: 20,
          destaque: true
        }
      ]
    });
    console.log('✅ Produtos criados:', produtos.count);

    // 4. Buscar IDs criados para interações
    const clientesCriados = await prisma.cliente.findMany();
    const produtosCriados = await prisma.produto.findMany();

    // 5. Criar Interações
    const interacoes = await prisma.interacao.createMany({
      data: [
        {
          tipo: 'COMENTARIO',
          conteudo: 'Produto de ótima qualidade!',
          avaliacao: 5,
          clienteId: clientesCriados[0].id,
          produtoId: produtosCriados[0].id
        },
        {
          tipo: 'AVALIACAO',
          conteudo: 'Muito bom, recomendo!',
          avaliacao: 4,
          clienteId: clientesCriados[1].id,
          produtoId: produtosCriados[0].id
        },
        {
          tipo: 'CURTIDA',
          clienteId: clientesCriados[0].id,
          produtoId: produtosCriados[1].id
        }
      ]
    });
    console.log('✅ Interações criadas:', interacoes.count);

    console.log('🎉 Dados populados com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao popular dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAll();