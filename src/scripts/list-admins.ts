import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAdmins() {
  try {
    console.log('👥 Listando administradores do ModaStyle...\n');

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        nivelAcesso: true,
        ultimoLogin: true,
        ultimoLogout: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { nivelAcesso: 'asc' }, // SUPERADMIN primeiro
        { createdAt: 'asc' }
      ]
    });

    if (admins.length === 0) {
      console.log('❌ Nenhum administrador encontrado!');
      console.log('📖 Para criar administradores: npx ts-node src/scripts/create-all-admins.ts');
      return;
    }

    console.log(`📊 Total de administradores: ${admins.length}\n`);

    // Agrupar por nível
    const adminsPorNivel = {
      SUPERADMIN: admins.filter(a => a.nivelAcesso === 'SUPERADMIN'),
      ADMIN: admins.filter(a => a.nivelAcesso === 'ADMIN'),
      EDITOR: admins.filter(a => a.nivelAcesso === 'EDITOR')
    };

    // Exibir cada grupo
    Object.entries(adminsPorNivel).forEach(([nivel, adminsList]) => {
      if (adminsList.length > 0) {
        const emoji = nivel === 'SUPERADMIN' ? '👑' : nivel === 'ADMIN' ? '🛡️' : '📝';
        console.log(`${emoji} ${nivel} (${adminsList.length}):`);
        
        adminsList.forEach(admin => {
          const ultimoLogin = admin.ultimoLogin 
            ? new Date(admin.ultimoLogin).toLocaleDateString('pt-BR')
            : 'Nunca';
          
          const criadoEm = new Date(admin.createdAt).toLocaleDateString('pt-BR');
          
          console.log(`  ├─ ${admin.nome}`);
          console.log(`  │  📧 ${admin.email}`);
          console.log(`  │  🆔 ID: ${admin.id}`);
          console.log(`  │  📅 Criado: ${criadoEm}`);
          console.log(`  │  🔐 Último login: ${ultimoLogin}`);
          console.log(`  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─`);
        });
        console.log();
      }
    });

    console.log('🔧 Comandos úteis:');
    console.log('• Resetar senha: npx ts-node src/scripts/reset-admin-password.ts <email>');
    console.log('• Criar admin: npx ts-node src/scripts/create-all-admins.ts');
    console.log('• Deletar admin: npx ts-node src/scripts/delete-admin.ts <email>');
    console.log('• Verificar banco: npx ts-node src/scripts/check-database.ts');

  } catch (error) {
    console.error('❌ Erro ao listar administradores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAdmins();