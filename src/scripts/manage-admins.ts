import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface MenuOption {
  key: string;
  description: string;
  action: () => Promise<void>;
}

async function manageAdmins() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
  };

  const showMenu = () => {
    console.log('\n🛡️  GERENCIADOR DE ADMINISTRADORES - ModaStyle');
    console.log('═══════════════════════════════════════════════\n');
    console.log('1️⃣  Listar administradores');
    console.log('2️⃣  Criar novo administrador');
    console.log('3️⃣  Resetar senha');
    console.log('4️⃣  Alterar nível de acesso');
    console.log('5️⃣  Deletar administrador');
    console.log('6️⃣  Estatísticas do sistema');
    console.log('0️⃣  Sair\n');
  };

  const listarAdmins = async () => {
    console.log('\n👥 ADMINISTRADORES CADASTRADOS');
    console.log('────────────────────────────────\n');
    
    const admins = await prisma.admin.findMany({
      orderBy: [{ nivelAcesso: 'asc' }, { createdAt: 'asc' }]
    });

    if (admins.length === 0) {
      console.log('❌ Nenhum administrador encontrado!');
      return;
    }

    admins.forEach((admin, index) => {
      const emoji = admin.nivelAcesso === 'SUPERADMIN' ? '👑' : 
                   admin.nivelAcesso === 'ADMIN' ? '🛡️' : '📝';
      
      const ultimoLogin = admin.ultimoLogin 
        ? new Date(admin.ultimoLogin).toLocaleDateString('pt-BR')
        : 'Nunca';

      console.log(`${index + 1}. ${emoji} ${admin.nome}`);
      console.log(`   📧 ${admin.email}`);
      console.log(`   🛡️  ${admin.nivelAcesso}`);
      console.log(`   🔐 Último login: ${ultimoLogin}`);
      console.log(`   📅 Criado: ${new Date(admin.createdAt).toLocaleDateString('pt-BR')}\n`);
    });
  };

  const criarAdmin = async () => {
    console.log('\n👤 CRIAR NOVO ADMINISTRADOR');
    console.log('──────────────────────────────\n');

    const nome = await question('Digite o nome: ');
    if (!nome.trim()) {
      console.log('❌ Nome é obrigatório!');
      return;
    }

    const email = await question('Digite o email: ');
    if (!email.includes('@')) {
      console.log('❌ Email inválido!');
      return;
    }

    // Verificar se email já existe
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingAdmin) {
      console.log('❌ Email já está em uso!');
      return;
    }

    console.log('\nNíveis disponíveis:');
    console.log('1 - EDITOR (Edição de produtos)');
    console.log('2 - ADMIN (Gerenciamento completo)');
    console.log('3 - SUPERADMIN (Acesso total)');
    
    const nivelEscolha = await question('Escolha o nível (1-3): ');
    const niveis = ['EDITOR', 'ADMIN', 'SUPERADMIN'];
    const nivel = niveis[parseInt(nivelEscolha) - 1];

    if (!nivel) {
      console.log('❌ Nível inválido!');
      return;
    }

    const senha = await question('Digite a senha temporária: ');
    if (senha.length < 6) {
      console.log('❌ Senha deve ter pelo menos 6 caracteres!');
      return;
    }

    try {
      const senhaHash = await bcrypt.hash(senha, 12);
      
      const admin = await prisma.admin.create({
        data: {
          nome: nome.trim(),
          email: email.toLowerCase().trim(),
          senha: senhaHash,
          nivelAcesso: nivel as any
        }
      });

      console.log('\n✅ Administrador criado com sucesso!');
      console.log(`👤 Nome: ${admin.nome}`);
      console.log(`📧 Email: ${admin.email}`);
      console.log(`🛡️  Nível: ${admin.nivelAcesso}`);
      console.log(`🔑 Senha: ${senha}`);
    } catch (error) {
      console.log('❌ Erro ao criar administrador:', error);
    }
  };

  const resetarSenha = async () => {
    console.log('\n🔐 RESETAR SENHA DE ADMINISTRADOR');
    console.log('───────────────────────────────────\n');

    await listarAdmins();
    
    const email = await question('Digite o email do administrador: ');
    
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!admin) {
      console.log('❌ Administrador não encontrado!');
      return;
    }

    const novaSenha = await question('Digite a nova senha: ');
    if (novaSenha.length < 6) {
      console.log('❌ Senha deve ter pelo menos 6 caracteres!');
      return;
    }

    try {
      const senhaHash = await bcrypt.hash(novaSenha, 12);
      
      await prisma.admin.update({
        where: { id: admin.id },
        data: { senha: senhaHash }
      });

      console.log('✅ Senha resetada com sucesso!');
      console.log(`👤 ${admin.nome} (${admin.email})`);
      console.log(`🔑 Nova senha: ${novaSenha}`);
    } catch (error) {
      console.log('❌ Erro ao resetar senha:', error);
    }
  };

  const alterarNivel = async () => {
    console.log('\n🛡️  ALTERAR NÍVEL DE ACESSO');
    console.log('────────────────────────────\n');

    await listarAdmins();
    
    const email = await question('Digite o email do administrador: ');
    
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!admin) {
      console.log('❌ Administrador não encontrado!');
      return;
    }

    console.log(`\nNível atual: ${admin.nivelAcesso}`);
    console.log('\nNovos níveis disponíveis:');
    console.log('1 - EDITOR');
    console.log('2 - ADMIN');
    console.log('3 - SUPERADMIN');
    
    const nivelEscolha = await question('Escolha o novo nível (1-3): ');
    const niveis = ['EDITOR', 'ADMIN', 'SUPERADMIN'];
    const novoNivel = niveis[parseInt(nivelEscolha) - 1];

    if (!novoNivel) {
      console.log('❌ Nível inválido!');
      return;
    }

    try {
      await prisma.admin.update({
        where: { id: admin.id },
        data: { nivelAcesso: novoNivel as any }
      });

      console.log('✅ Nível alterado com sucesso!');
      console.log(`👤 ${admin.nome}`);
      console.log(`🛡️  ${admin.nivelAcesso} → ${novoNivel}`);
    } catch (error) {
      console.log('❌ Erro ao alterar nível:', error);
    }
  };

  const deletarAdmin = async () => {
    console.log('\n🗑️  DELETAR ADMINISTRADOR');
    console.log('─────────────────────────\n');

    await listarAdmins();
    
    const email = await question('Digite o email do administrador: ');
    
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!admin) {
      console.log('❌ Administrador não encontrado!');
      return;
    }

    // Verificar se não é o último SUPERADMIN
    if (admin.nivelAcesso === 'SUPERADMIN') {
      const superAdminCount = await prisma.admin.count({
        where: { nivelAcesso: 'SUPERADMIN' }
      });

      if (superAdminCount <= 1) {
        console.log('❌ Não é possível deletar o último SUPERADMIN!');
        return;
      }
    }

    console.log(`\n⚠️  Você está prestes a deletar:`);
    console.log(`👤 ${admin.nome} (${admin.email})`);
    console.log(`🛡️  ${admin.nivelAcesso}`);
    
    const confirmacao = await question('\nDigite "CONFIRMAR" para prosseguir: ');
    
    if (confirmacao !== 'CONFIRMAR') {
      console.log('❌ Operação cancelada.');
      return;
    }

    try {
      await prisma.admin.delete({
        where: { id: admin.id }
      });

      console.log('✅ Administrador deletado com sucesso!');
    } catch (error) {
      console.log('❌ Erro ao deletar administrador:', error);
    }
  };

  const mostrarEstatisticas = async () => {
    console.log('\n📊 ESTATÍSTICAS DO SISTEMA');
    console.log('─────────────────────────\n');

    const stats = await Promise.all([
      prisma.admin.count(),
      prisma.admin.count({ where: { nivelAcesso: 'SUPERADMIN' } }),
      prisma.admin.count({ where: { nivelAcesso: 'ADMIN' } }),
      prisma.admin.count({ where: { nivelAcesso: 'EDITOR' } }),
      prisma.cliente.count(),
      prisma.produto.count(),
      prisma.interacao.count()
    ]);

    console.log(`👥 Total de administradores: ${stats[0]}`);
    console.log(`  👑 SUPERADMIN: ${stats[1]}`);
    console.log(`  🛡️  ADMIN: ${stats[2]}`);
    console.log(`  📝 EDITOR: ${stats[3]}\n`);
    
    console.log(`👤 Clientes: ${stats[4]}`);
    console.log(`🛍️  Produtos: ${stats[5]}`);
    console.log(`💬 Interações: ${stats[6]}\n`);

    // Últimos logins
    const ultimosLogins = await prisma.admin.findMany({
      where: { ultimoLogin: { not: null } },
      orderBy: { ultimoLogin: 'desc' },
      take: 5,
      select: {
        nome: true,
        email: true,
        ultimoLogin: true,
        nivelAcesso: true
      }
    });

    if (ultimosLogins.length > 0) {
      console.log('🔐 Últimos logins:');
      ultimosLogins.forEach(admin => {
        const data = new Date(admin.ultimoLogin!).toLocaleString('pt-BR');
        const emoji = admin.nivelAcesso === 'SUPERADMIN' ? '👑' : 
                     admin.nivelAcesso === 'ADMIN' ? '🛡️' : '📝';
        console.log(`  ${emoji} ${admin.nome} - ${data}`);
      });
    }
  };

  try {
    console.log('🚀 Iniciando Gerenciador de Administradores...\n');

    while (true) {
      showMenu();
      const opcao = await question('Escolha uma opção: ');

      switch (opcao) {
        case '1':
          await listarAdmins();
          break;
        case '2':
          await criarAdmin();
          break;
        case '3':
          await resetarSenha();
          break;
        case '4':
          await alterarNivel();
          break;
        case '5':
          await deletarAdmin();
          break;
        case '6':
          await mostrarEstatisticas();
          break;
        case '0':
          console.log('👋 Saindo...');
          rl.close();
          return;
        default:
          console.log('❌ Opção inválida!');
      }

      await question('\nPressione Enter para continuar...');
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

manageAdmins();