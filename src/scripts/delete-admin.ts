import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

async function deleteAdmin() {
  try {
    const email = process.argv[2];

    if (!email) {
      console.log('❌ Email é obrigatório!');
      console.log('📖 Uso: npx ts-node src/scripts/delete-admin.ts <email>');
      console.log('📖 Exemplo: npx ts-node src/scripts/delete-admin.ts editor@modastyle.com');
      return;
    }

    // Verificar se admin existe
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        nome: true,
        email: true,
        nivelAcesso: true,
        createdAt: true
      }
    });

    if (!admin) {
      console.log(`❌ Administrador não encontrado: ${email}`);
      return;
    }

    // Verificar se não é o último SUPERADMIN
    if (admin.nivelAcesso === 'SUPERADMIN') {
      const superAdminCount = await prisma.admin.count({
        where: { nivelAcesso: 'SUPERADMIN' }
      });

      if (superAdminCount <= 1) {
        console.log('❌ Não é possível deletar o último SUPERADMIN!');
        console.log('📖 Crie outro SUPERADMIN antes de deletar este.');
        return;
      }
    }

    // Mostrar informações do admin
    console.log('⚠️  Você está prestes a deletar o seguinte administrador:');
    console.log(`👤 Nome: ${admin.nome}`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🛡️  Nível: ${admin.nivelAcesso}`);
    console.log(`📅 Criado: ${new Date(admin.createdAt).toLocaleDateString('pt-BR')}`);

    // Confirmar exclusão
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const resposta = await new Promise<string>((resolve) => {
      rl.question('\n❓ Tem certeza que deseja deletar? (digite "CONFIRMAR" para prosseguir): ', resolve);
    });

    rl.close();

    if (resposta !== 'CONFIRMAR') {
      console.log('❌ Operação cancelada.');
      return;
    }

    // Deletar admin
    await prisma.admin.delete({
      where: { id: admin.id }
    });

    console.log('✅ Administrador deletado com sucesso!');
    console.log(`📧 ${admin.email} foi removido do sistema.`);

    // Mostrar admins restantes
    const adminsRestantes = await prisma.admin.count();
    console.log(`📊 Administradores restantes: ${adminsRestantes}`);

  } catch (error) {
    console.error('❌ Erro ao deletar administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAdmin();