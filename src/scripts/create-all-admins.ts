import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAllAdmins() {
  try {
    console.log('🚀 Criando administradores ModaStyle...\n');

    const admins = [
      {
        nome: 'João Silva - Super Admin',
        email: 'superadmin@modastyle.com',
        senha: 'super123',
        nivelAcesso: 'SUPERADMIN' as const,
        descricao: 'Acesso total ao sistema - pode criar/deletar outros admins'
      },
      {
        nome: 'Maria Santos - Admin',
        email: 'admin@modastyle.com',
        senha: 'admin123',
        nivelAcesso: 'ADMIN' as const,
        descricao: 'Gerenciamento de produtos, clientes e relatórios'
      },
      {
        nome: 'Pedro Costa - Editor',
        email: 'editor@modastyle.com',
        senha: 'editor123',
        nivelAcesso: 'EDITOR' as const,
        descricao: 'Edição de produtos e conteúdo'
      }
    ];

    for (const adminData of admins) {
      // Verificar se já existe
      const existingAdmin = await prisma.admin.findUnique({
        where: { email: adminData.email }
      });

      if (existingAdmin) {
        console.log(`⚠️  ${adminData.nivelAcesso} já existe: ${adminData.email}`);
        console.log(`   📝 Para resetar a senha, use: npx ts-node src/scripts/reset-admin-password.ts ${adminData.email}\n`);
        continue;
      }

      // Hash da senha
      const senhaHash = await bcrypt.hash(adminData.senha, 12);

      // Criar admin
      const admin = await prisma.admin.create({
        data: {
          nome: adminData.nome,
          email: adminData.email,
          senha: senhaHash,
          nivelAcesso: adminData.nivelAcesso
        }
      });

      console.log(`✅ ${adminData.nivelAcesso} criado com sucesso!`);
      console.log(`   👤 Nome: ${admin.nome}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   🔑 Senha: ${adminData.senha}`);
      console.log(`   🛡️  Nível: ${admin.nivelAcesso}`);
      console.log(`   📝 Descrição: ${adminData.descricao}\n`);
    }

    console.log('🎉 Processo concluído!');
    console.log('\n📋 Credenciais de Login:');
    console.log('┌─────────────┬─────────────────────────────┬─────────────┐');
    console.log('│ Nível       │ Email                       │ Senha       │');
    console.log('├─────────────┼─────────────────────────────┼─────────────┤');
    console.log('│ SUPERADMIN  │ superadmin@modastyle.com    │ super123    │');
    console.log('│ ADMIN       │ admin@modastyle.com         │ admin123    │');
    console.log('│ EDITOR      │ editor@modastyle.com        │ editor123   │');
    console.log('└─────────────┴─────────────────────────────┴─────────────┘');
    
    console.log('\n🔗 URLs importantes:');
    console.log('• Login Admin: http://localhost:3000/admin/login');
    console.log('• Dashboard: http://localhost:3000/admin/dashboard');
    console.log('• Administradores: http://localhost:3000/admin/administradores');
    
    console.log('\n⚠️  IMPORTANTE:');
    console.log('• Altere as senhas após o primeiro login!');
    console.log('• Apenas SUPERADMIN pode criar novos administradores');
    console.log('• Use senhas fortes em produção');
    
  } catch (error) {
    console.error('❌ Erro ao criar administradores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAllAdmins();