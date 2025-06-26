// src/scripts/test-neon-connection.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNeonConnection() {
  try {
    console.log('🔄 Testando conexão com Neon PostgreSQL...');
    console.log('🔗 Database URL:', process.env.DATABASE_URL ? 'Configurada' : 'NÃO CONFIGURADA');
    
    // Testar conexão básica
    await prisma.$connect();
    console.log('✅ Conexão com Neon estabelecida com sucesso!');
    
    // Testar query básica
    const result = await prisma.$queryRaw`SELECT version()` as { version: string }[];
    console.log('📊 Versão PostgreSQL:', result[0]?.version || 'Não disponível');
    
    // Verificar tabelas existentes
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    ` as { table_name: string }[];
    
    console.log('📋 Tabelas no banco:', tables.map(t => t.table_name));
    
    // Contar registros em cada tabela (se existirem)
    try {
      const adminCount = await prisma.admin.count();
      console.log(`👥 Administradores: ${adminCount}`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log('⚠️  Tabela Admin ainda não existe - execute prisma migrate');
    }
    
    try {
      const produtoCount = await prisma.produto.count();
      console.log(`🛍️  Produtos: ${produtoCount}`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log('⚠️  Tabela Produto ainda não existe - execute prisma migrate');
    }
    
    try {
      const clienteCount = await prisma.cliente.count();
      console.log(`👤 Clientes: ${clienteCount}`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log('⚠️  Tabela Cliente ainda não existe - execute prisma migrate');
    }
    
    console.log('\n🎉 Teste de conexão Neon concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na conexão com Neon:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('connect')) {
        console.log('\n🔧 Possíveis soluções:');
        console.log('1. Verificar se o banco Neon está ativo (não em sleep)');
        console.log('2. Verificar credenciais na DATABASE_URL');
        console.log('3. Verificar se o IP está liberado no Neon');
        console.log('4. Verificar conexão com internet');
      }
      
      if (error.message.includes('password')) {
        console.log('\n🔧 Problema de autenticação:');
        console.log('1. Verificar usuário e senha na DATABASE_URL');
        console.log('2. Regenerar senha no painel do Neon se necessário');
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

testNeonConnection();