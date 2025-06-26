import nodemailer from 'nodemailer';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT!),
      secure: false, // true para 465, false para outras portas
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });
  }

  async sendEmail(to: string, template: EmailTemplate) {
    try {
      const info = await this.transporter.sendMail({
        from: `"ModaStyle" <${process.env.SMTP_USER}>`,
        to: to,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });

      console.log('Email enviado:', info.messageId);
      return info;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw error;
    }
  }

  generateConfirmationEmail(nome: string, confirmationToken: string): EmailTemplate {
    const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/clientes/confirmar-email?token=${confirmationToken}`;
    
    return {
      subject: '✨ Confirme seu cadastro - ModaStyle',
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirme seu cadastro</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background-color: #f8fafc;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #9333ea, #ec4899); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .header h1 { 
              font-size: 28px; 
              margin-bottom: 10px; 
              font-weight: 700;
            }
            .header p { 
              font-size: 16px; 
              opacity: 0.9; 
            }
            .content { 
              padding: 40px 30px; 
            }
            .greeting { 
              font-size: 20px; 
              margin-bottom: 20px; 
              color: #1f2937;
              font-weight: 600;
            }
            .text { 
              margin-bottom: 25px; 
              color: #4b5563; 
              font-size: 16px;
            }
            .button-container { 
              text-align: center; 
              margin: 35px 0; 
            }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #9333ea, #ec4899); 
              color: white; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 12px; 
              font-weight: 600; 
              font-size: 16px;
              box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
              transition: transform 0.2s;
            }
            .button:hover { 
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(147, 51, 234, 0.4);
            }
            .link-box { 
              background: #f3f4f6; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 25px 0;
              border-left: 4px solid #9333ea;
            }
            .link-box p { 
              margin-bottom: 10px; 
              font-weight: 600; 
              color: #374151;
            }
            .link-text { 
              word-break: break-all; 
              font-family: 'Courier New', monospace; 
              font-size: 14px; 
              color: #6b7280;
              background: white;
              padding: 12px;
              border-radius: 6px;
              border: 1px solid #d1d5db;
            }
            .warning { 
              background: #fef3c7; 
              border: 1px solid #f59e0b; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 25px 0;
            }
            .warning-title { 
              font-weight: 600; 
              color: #92400e; 
              margin-bottom: 8px;
            }
            .warning-text { 
              color: #b45309; 
              font-size: 14px;
            }
            .features { 
              background: #f0f9ff; 
              padding: 25px; 
              border-radius: 8px; 
              margin: 30px 0;
            }
            .features h3 { 
              color: #0c4a6e; 
              margin-bottom: 15px; 
              font-size: 18px;
            }
            .features ul { 
              list-style: none; 
            }
            .features li { 
              color: #0369a1; 
              margin-bottom: 8px; 
              padding-left: 20px;
              position: relative;
            }
            .features li:before { 
              content: "✨"; 
              position: absolute; 
              left: 0;
            }
            .footer { 
              background: #f9fafb; 
              padding: 30px; 
              text-align: center; 
              border-top: 1px solid #e5e7eb;
            }
            .footer p { 
              color: #6b7280; 
              font-size: 14px; 
              margin-bottom: 10px;
            }
            .logo { 
              font-size: 24px; 
              font-weight: 700; 
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">ModaStyle</div>
              <h1>🎉 Bem-vindo à ModaStyle!</h1>
              <p>Sua jornada de estilo começa aqui</p>
            </div>
            
            <div class="content">
              <div class="greeting">Olá, ${nome}!</div>
              
              <p class="text">
                Que alegria ter você conosco! Obrigado por se cadastrar na ModaStyle. 
                Para completar seu cadastro e começar a explorar nossa coleção exclusiva, 
                você precisa confirmar seu email.
              </p>
              
              <div class="button-container">
                <a href="${confirmationUrl}" class="button">
                  ✨ Confirmar Meu Email
                </a>
              </div>
              
              <div class="link-box">
                <p>Ou copie e cole este link no seu navegador:</p>
                <div class="link-text">${confirmationUrl}</div>
              </div>
              
              <div class="warning">
                <div class="warning-title">⏰ Importante:</div>
                <div class="warning-text">
                  Este link expira em 24 horas por segurança. Se expirar, você pode solicitar um novo cadastro.
                </div>
              </div>
              
              <div class="features">
                <h3>🛍️ O que você encontrará na ModaStyle:</h3>
                <ul>
                  <li>Peças exclusivas e de qualidade premium</li>
                  <li>Entrega rápida e segura</li>
                  <li>Ofertas especiais para membros</li>
                  <li>Experiência de compra personalizada</li>
                  <li>Atendimento especializado</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>ModaStyle</strong> - Seu estilo, nossa paixão</p>
              <p>Se você não se cadastrou na ModaStyle, pode ignorar este email.</p>
              <p>© 2024 ModaStyle. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Olá, ${nome}!
        
        Bem-vindo à ModaStyle! Para completar seu cadastro, confirme seu email clicando no link abaixo:
        
        ${confirmationUrl}
        
        Este link expira em 24 horas.
        
        O que você encontrará na ModaStyle:
        ✨ Peças exclusivas e de qualidade premium
        🚚 Entrega rápida e segura  
        💝 Ofertas especiais para membros
        📱 Experiência de compra personalizada
        
        Se você não se cadastrou na ModaStyle, pode ignorar este email.
        
        © 2024 ModaStyle
      `
    };
  }

  generatePasswordResetEmail(nome: string, resetCode: string): EmailTemplate {
    return {
      subject: '🔐 Código para redefinir sua senha - ModaStyle',
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redefinir senha</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background-color: #f8fafc;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #dc2626, #ea580c); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .header h1 { 
              font-size: 28px; 
              margin-bottom: 10px; 
              font-weight: 700;
            }
            .content { 
              padding: 40px 30px; 
            }
            .greeting { 
              font-size: 20px; 
              margin-bottom: 20px; 
              color: #1f2937;
              font-weight: 600;
            }
            .text { 
              margin-bottom: 25px; 
              color: #4b5563; 
              font-size: 16px;
            }
            .code-container { 
              text-align: center; 
              margin: 35px 0; 
            }
            .code { 
              background: #1f2937; 
              color: #10b981; 
              font-size: 32px; 
              font-weight: 700; 
              padding: 20px 30px; 
              border-radius: 12px; 
              letter-spacing: 8px; 
              font-family: 'Courier New', monospace;
              display: inline-block;
              box-shadow: 0 4px 12px rgba(31, 41, 55, 0.3);
            }
            .warning { 
              background: #fef3c7; 
              border: 1px solid #f59e0b; 
              padding: 25px; 
              border-radius: 8px; 
              margin: 30px 0;
            }
            .warning-title { 
              font-weight: 600; 
              color: #92400e; 
              margin-bottom: 15px;
              font-size: 18px;
            }
            .warning-list { 
              color: #b45309; 
              margin-left: 20px;
            }
            .warning-list li { 
              margin-bottom: 8px;
            }
            .security { 
              background: #ecfdf5; 
              padding: 25px; 
              border-radius: 8px; 
              margin: 30px 0;
              border-left: 4px solid #10b981;
            }
            .security h3 { 
              color: #065f46; 
              margin-bottom: 15px; 
              font-size: 18px;
            }
            .security ul { 
              color: #047857; 
              margin-left: 20px;
            }
            .security li { 
              margin-bottom: 8px;
            }
            .footer { 
              background: #f9fafb; 
              padding: 30px; 
              text-align: center; 
              border-top: 1px solid #e5e7eb;
            }
            .footer p { 
              color: #6b7280; 
              font-size: 14px; 
              margin-bottom: 10px;
            }
            .logo { 
              font-size: 24px; 
              font-weight: 700; 
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">ModaStyle</div>
              <h1>🔐 Redefinir Senha</h1>
            </div>
            
            <div class="content">
              <div class="greeting">Olá, ${nome}!</div>
              
              <p class="text">
                Recebemos uma solicitação para redefinir a senha da sua conta na ModaStyle. 
                Use o código abaixo na página de redefinição de senha:
              </p>
              
              <div class="code-container">
                <div class="code">${resetCode}</div>
              </div>
              
              <div class="warning">
                <div class="warning-title">⚠️ Importante:</div>
                <ul class="warning-list">
                  <li>Este código expira em <strong>1 hora</strong></li>
                  <li>Use apenas uma vez</li>
                  <li>Não compartilhe com ninguém</li>
                  <li>Se não foi você, ignore este email</li>
                </ul>
              </div>
              
              <p class="text">
                Se você não solicitou esta redefinição, pode ignorar este email. 
                Sua senha permanecerá inalterada e sua conta estará segura.
              </p>
              
              <div class="security">
                <h3>🛡️ Dicas de Segurança:</h3>
                <ul>
                  <li>Use uma senha com pelo menos 8 caracteres</li>
                  <li>Combine letras maiúsculas, minúsculas, números e símbolos</li>
                  <li>Evite informações pessoais óbvias</li>
                  <li>Não reutilize senhas de outras contas</li>
                  <li>Considere usar um gerenciador de senhas</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>ModaStyle</strong> - Segurança em primeiro lugar</p>
              <p>Este é um email automático, não responda.</p>
              <p>© 2024 ModaStyle. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Olá, ${nome}!
        
        Recebemos uma solicitação para redefinir a senha da sua conta na ModaStyle.
        
        Código de verificação: ${resetCode}
        
        IMPORTANTE:
        - Este código expira em 1 hora
        - Use apenas uma vez
        - Não compartilhe com ninguém
        
        Se você não solicitou esta redefinição, pode ignorar este email.
        
        Dicas de segurança:
        • Use uma senha com pelo menos 8 caracteres
        • Combine letras, números e símbolos
        • Evite informações pessoais óbvias
        • Não reutilize senhas de outras contas
        
        © 2024 ModaStyle
      `
    };
  }
}

export const emailService = new EmailService();