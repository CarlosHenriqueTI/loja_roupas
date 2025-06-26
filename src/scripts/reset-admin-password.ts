import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const email = process.argv[2];
    const novaSenha = process.argv[3];

    if (!email) {
      console.log('❌ Email é obrigatório!');
      console.log('📖 Uso: npx ts-node src/scripts/reset-admin-password.ts <email> [nova-senha]');
      console.log('📖 Exemplo: npx ts-node src/scripts/reset-admin-password.ts admin@modastyle.com nova123');
      return;
    }

    // Verificar se admin existe
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        nome: true,
        email: true,
        nivelAcesso: true
      }
    });

    if (!admin) {
      console.log(`❌ Administrador não encontrado: ${email}`);
      console.log('\n📋 Administradores disponíveis:');
      
      const admins = await prisma.admin.findMany({
        select: { email: true, nome: true, nivelAcesso: true }
      });
      
      admins.forEach(a => {
        console.log(`  • ${a.email} (${a.nome}) - ${a.nivelAcesso}`);
      });
      
      return;
    }

    // Gerar nova senha se não foi fornecida
    const senhaFinal = novaSenha || `temp${Math.random().toString(36).slice(2, 8)}`;
    const senhaHash = await bcrypt.hash(senhaFinal, 12);

    // Atualizar senha
    await prisma.admin.update({
      where: { id: admin.id },
      data: { 
        senha: senhaHash,
        updatedAt: new Date()
      }
    });

    console.log('✅ Senha resetada com sucesso!');
    console.log('\n📋 Detalhes:');
    console.log(`👤 Nome: ${admin.nome}`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🛡️  Nível: ${admin.nivelAcesso}`);
    console.log(`🔑 Nova senha: ${senhaFinal}`);
    
    console.log('\n⚠️  IMPORTANTE:');
    console.log('• Faça login imediatamente e altere a senha');
    console.log('• Não compartilhe esta senha temporária');
    console.log(`• URL de login: http://localhost:3000/admin/login`);

  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();