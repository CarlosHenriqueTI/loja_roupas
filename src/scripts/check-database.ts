// src/scripts/check-database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔄 Verificando conexão com banco de dados...');
    console.log('🔗 URL do banco:', process.env.DATABASE_URL ? 'Configurada ✅' : 'NÃO CONFIGURADA ❌');
    
    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão com banco de dados estabelecida\n');
    
    // Verificar estrutura das tabelas
    console.log('📋 Verificando estrutura do banco...');
    
    // Contar registros em cada tabela
    const stats = await Promise.all([
      prisma.admin.count().catch(() => 0),
      prisma.cliente.count().catch(() => 0),
      prisma.produto.count().catch(() => 0),
      prisma.interacao.count().catch(() => 0)
    ]);

    console.log('📊 Estatísticas do banco:');
    console.log(`👥 Administradores: ${stats[0]}`);
    console.log(`👤 Clientes: ${stats[1]}`);
    console.log(`🛍️  Produtos: ${stats[2]}`);
    console.log(`💬 Interações: ${stats[3]}\n`);

    // Verificar administradores detalhadamente
    if (stats[0] > 0) {
      console.log('👥 Administradores por nível:');
      
      const adminsPorNivel = await Promise.all([
        prisma.admin.count({ where: { nivelAcesso: 'SUPERADMIN' } }),
        prisma.admin.count({ where: { nivelAcesso: 'ADMIN' } }),
        prisma.admin.count({ where: { nivelAcesso: 'EDITOR' } })
      ]);

      console.log(`  👑 SUPERADMIN: ${adminsPorNivel[0]}`);
      console.log(`  🛡️  ADMIN: ${adminsPorNivel[1]}`);
      console.log(`  📝 EDITOR: ${adminsPorNivel[2]}\n`);

      // Listar todos os admins
      const admins = await prisma.admin.findMany({
        select: {
          id: true,
          nome: true,
          email: true,
          nivelAcesso: true,
          ultimoLogin: true,
          createdAt: true
        },
        orderBy: [
          { nivelAcesso: 'asc' },
          { createdAt: 'asc' }
        ]
      });

      console.log('📋 Lista de administradores:');
      admins.forEach(admin => {
        const ultimoLogin = admin.ultimoLogin 
          ? new Date(admin.ultimoLogin).toLocaleDateString('pt-BR')
          : 'Nunca';
        
        const emoji = admin.nivelAcesso === 'SUPERADMIN' ? '👑' : 
                     admin.nivelAcesso === 'ADMIN' ? '🛡️' : '📝';
        
        console.log(`  ${emoji} ${admin.nome} (${admin.email})`);
        console.log(`    🆔 ID: ${admin.id} | 🔐 Último login: ${ultimoLogin}`);
      });
      console.log();
    } else {
      console.log('⚠️  Nenhum administrador encontrado!');
      console.log('📖 Para criar administradores: npx ts-node src/scripts/create-all-admins.ts\n');
    }

    // Verificar se há dados de exemplo
    const temDadosExemplo = stats[1] > 0 && stats[2] > 0;
    
    if (!temDadosExemplo) {
      console.log('💡 Dicas:');
      console.log('• Para popular com dados de exemplo: npx ts-node src/scripts/setup-complete.ts');
      console.log('• Para criar apenas admins: npx ts-node src/scripts/create-all-admins.ts');
      console.log('• Para limpar banco: npx ts-node src/scripts/reset-database.ts');
    }

    console.log('\n🔧 Scripts disponíveis:');
    console.log('• npx ts-node src/scripts/list-admins.ts - Listar administradores');
    console.log('• npx ts-node src/scripts/reset-admin-password.ts <email> - Resetar senha');
    console.log('• npx ts-node src/scripts/delete-admin.ts <email> - Deletar admin');
    console.log('• npx ts-node src/scripts/test-neon-connection.ts - Testar conexão');

  } catch (error) {
    console.error('❌ Erro ao verificar banco de dados:', error);
    console.log('\n🔧 Possíveis soluções:');
    console.log('1. Verificar se a DATABASE_URL está correta no .env.local');
    console.log('2. Executar: npx prisma generate');
    console.log('3. Executar: npx prisma db push');
    console.log('4. Verificar conexão com internet/VPN');
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();