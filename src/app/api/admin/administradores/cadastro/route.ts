import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAdminAuth, checkAdminLevel } from '@/middleware/adminAuth';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Configurar transporter do nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Função para enviar email de confirmação
async function enviarEmailConfirmacao(email: string, nome: string, token: string) {
  const confirmationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/confirmar-conta?token=${token}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Confirmação de Conta - ModaStyle</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { 
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); 
          color: white; 
          padding: 30px; 
          text-align: center; 
          border-radius: 10px 10px 0 0; 
        }
        .content { 
          background: #f9fafb; 
          padding: 30px; 
          border-radius: 0 0 10px 10px; 
          border: 1px solid #e5e7eb;
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); 
          color: white; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: bold; 
          margin: 20px 0; 
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          font-size: 12px; 
          color: #666; 
        }
        .warning {
          background: #fef3cd;
          border: 1px solid #fde047;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛍️ ModaStyle</h1>
          <h2>Bem-vindo ao Sistema Administrativo!</h2>
        </div>
        <div class="content">
          <h3>Olá, ${nome}!</h3>
          <p>Sua conta de administrador foi criada com sucesso no sistema ModaStyle.</p>
          <p>Para ativar sua conta e definir sua senha, clique no botão abaixo:</p>
          
          <div style="text-align: center;">
            <a href="${confirmationUrl}" class="button">
              ✅ Confirmar Conta e Definir Senha
            </a>
          </div>
          
          <div class="warning">
            <p><strong>⚠️ Importante:</strong></p>
            <ul>
              <li>Este link é válido por 24 horas</li>
              <li>Após a confirmação, você poderá definir sua senha</li>
              <li>Mantenha suas credenciais seguras</li>
              <li>Você ainda não pode fazer login até confirmar sua conta</li>
            </ul>
          </div>
          
          <p>Se você não solicitou esta conta, ignore este email.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          
          <p><strong>Link direto (copie e cole se o botão não funcionar):</strong></p>
          <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">
            ${confirmationUrl}
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ModaStyle - Sistema Administrativo</p>
          <p>Este é um email automático, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"ModaStyle Admin" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '🔐 Confirme sua conta de administrador - ModaStyle',
    html: htmlContent,
  });
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    // Apenas SUPERADMIN pode criar novos admins
    if (!checkAdminLevel(authResult.admin!.nivelAcesso, 'SUPERADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Apenas SUPERADMIN pode criar novos administradores' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nome, email, nivelAcesso } = body;

    // Validações
    if (!nome || !email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nome e email são obrigatórios' 
      }, { status: 400 });
    }

    if (nome.trim().length < 3) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nome deve ter pelo menos 3 caracteres' 
      }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Formato de email inválido' 
      }, { status: 400 });
    }

    // Verificar se email já existe
    const adminExistente = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (adminExistente) {
      return NextResponse.json({ 
        success: false, 
        error: 'Este email já está cadastrado no sistema' 
      }, { status: 409 });
    }

    // Validar nível de acesso
    const niveisValidos = ['SUPERADMIN', 'ADMIN', 'EDITOR'];
    if (nivelAcesso && !niveisValidos.includes(nivelAcesso)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nível de acesso inválido' 
      }, { status: 400 });
    }

    // Gerar token de confirmação
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Criar admin pendente (sem senha ainda)
    const novoAdmin = await prisma.admin.create({
      data: {
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        senha: '', // Senha será definida na confirmação
        nivelAcesso: nivelAcesso || 'EDITOR',
        emailVerificado: false,
        tokenConfirmacao: confirmationToken,
        tokenExpiracao: tokenExpiry,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        nivelAcesso: true,
        emailVerificado: true,
        createdAt: true
      }
    });

    // Enviar email de confirmação
    try {
      await enviarEmailConfirmacao(email, nome, confirmationToken);
      console.log('✅ Email de confirmação enviado para:', email);
    } catch (emailError) {
      console.error('❌ Erro ao enviar email:', emailError);
      
      // Deletar admin criado se email falhou
      await prisma.admin.delete({
        where: { id: novoAdmin.id }
      });
      
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao enviar email de confirmação. Verifique as configurações SMTP.' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Administrador criado com sucesso! Email de confirmação enviado.',
      data: {
        ...novoAdmin,
        emailEnviado: true,
        instrucoes: 'O administrador deve verificar o email e clicar no link para ativar a conta.'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Listar administradores
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    // Apenas SUPERADMIN e ADMIN podem listar
    if (!checkAdminLevel(authResult.admin!.nivelAcesso, 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        nivelAcesso: true,
        emailVerificado: true,
        ultimoLogin: true,
        ultimoLogout: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ 
      success: true, 
      admins: admins 
    });

  } catch (error) {
    console.error('Erro ao buscar admins:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}