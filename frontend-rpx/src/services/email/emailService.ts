import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

/**
 * Configuração do serviço de email
 */
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * Dados do email
 */
interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Classe responsável pelo serviço de envio de emails
 */
export class EmailService {
  private static transporter: nodemailer.Transporter;
  private static defaultSender = process.env.EMAIL_SENDER || 'no-reply@rpx.gg';
  private static isInitialized = false;

  /**
   * Inicializa o serviço de email
   */
  static initialize() {
    if (this.isInitialized) return;

    try {
      const emailConfig: EmailConfig = {
        host: process.env.EMAIL_HOST || '',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASSWORD || ''
        }
      };

      // Verificar se todas as configurações necessárias estão presentes
      if (!emailConfig.host || !emailConfig.auth.user || !emailConfig.auth.pass) {
        console.error('Configuração de email incompleta. O serviço de email não será inicializado.');
        return;
      }

      this.transporter = nodemailer.createTransport(emailConfig);
      this.isInitialized = true;
      console.log('Serviço de email inicializado com sucesso.');
    } catch (error) {
      console.error('Erro ao inicializar serviço de email:', error);
    }
  }

  /**
   * Envia um email
   * @param emailData Dados do email a ser enviado
   * @returns Promise com o resultado do envio
   */
  static async sendEmail(emailData: EmailData): Promise<boolean> {
    if (!this.isInitialized) {
      this.initialize();
      if (!this.isInitialized) {
        console.error('Serviço de email não inicializado. Email não enviado.');
        return false;
      }
    }

    try {
      const mailOptions = {
        from: emailData.from || this.defaultSender,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text || '',
        html: emailData.html,
        attachments: emailData.attachments || []
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email enviado com sucesso:', info.messageId);
      return true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }

  /**
   * Envia email de verificação de conta
   * @param email Email do usuário
   * @param name Nome do usuário
   * @param verificationLink Link para verificação da conta
   * @returns Promise com o resultado do envio
   */
  static async sendVerificationEmail(email: string, name: string, verificationLink: string): Promise<boolean> {
    const subject = 'RPX Platform - Verificação de conta';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background: linear-gradient(to right, #6930c3, #5e60ce); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">RPX Platform</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none;">
          <p>Olá, <strong>${name}</strong>!</p>
          <p>Obrigado por se cadastrar na RPX Platform. Para verificar sua conta, clique no botão abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #6930c3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verificar minha conta</a>
          </div>
          <p>Se você não solicitou o cadastro, ignore este email.</p>
          <p>O link acima expirará em 24 horas.</p>
          <p>Atenciosamente,<br>Equipe RPX Platform</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #777; font-size: 12px;">
          <p>© ${new Date().getFullYear()} RPX Platform. Todos os direitos reservados.</p>
        </div>
      </div>
    `;
    
    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  /**
   * Envia email de notificação de partida
   * @param email Email do usuário
   * @param name Nome do usuário
   * @param matchData Dados da partida
   * @returns Promise com o resultado do envio
   */
  static async sendMatchNotification(email: string, name: string, matchData: any): Promise<boolean> {
    const subject = 'RPX Platform - Nova partida disponível';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background: linear-gradient(to right, #6930c3, #5e60ce); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">RPX Platform</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none;">
          <p>Olá, <strong>${name}</strong>!</p>
          <p>Uma nova partida está disponível para você na plataforma:</p>
          <div style="background-color: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Modo de jogo:</strong> ${matchData.gameMode}</p>
            <p><strong>Adversário:</strong> ${matchData.opponent}</p>
            <p><strong>Valor da aposta:</strong> R$ ${matchData.betAmount}</p>
            <p><strong>Horário:</strong> ${new Date(matchData.scheduledTime).toLocaleString('pt-BR')}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/match/${matchData.matchId}" style="background-color: #6930c3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Ver detalhes da partida</a>
          </div>
          <p>Boa sorte!</p>
          <p>Atenciosamente,<br>Equipe RPX Platform</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #777; font-size: 12px;">
          <p>© ${new Date().getFullYear()} RPX Platform. Todos os direitos reservados.</p>
        </div>
      </div>
    `;
    
    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  /**
   * Envia email de notificação de pagamento
   * @param email Email do usuário
   * @param name Nome do usuário
   * @param paymentData Dados do pagamento
   * @returns Promise com o resultado do envio
   */
  static async sendPaymentNotification(email: string, name: string, paymentData: any): Promise<boolean> {
    const subject = 'RPX Platform - Confirmação de pagamento';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background: linear-gradient(to right, #6930c3, #5e60ce); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">RPX Platform</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none;">
          <p>Olá, <strong>${name}</strong>!</p>
          <p>Seu pagamento foi processado com sucesso:</p>
          <div style="background-color: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p><strong>ID da transação:</strong> ${paymentData.transactionId}</p>
            <p><strong>Valor:</strong> R$ ${paymentData.amount}</p>
            <p><strong>Data:</strong> ${new Date(paymentData.date).toLocaleString('pt-BR')}</p>
            <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">Aprovado</span></p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/perfil/transacoes" style="background-color: #6930c3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Ver minhas transações</a>
          </div>
          <p>Obrigado por utilizar nossos serviços!</p>
          <p>Atenciosamente,<br>Equipe RPX Platform</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #777; font-size: 12px;">
          <p>© ${new Date().getFullYear()} RPX Platform. Todos os direitos reservados.</p>
        </div>
      </div>
    `;
    
    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  /**
   * Envia email de recuperação de senha
   * @param email Email do usuário
   * @param name Nome do usuário
   * @param resetLink Link para resetar a senha
   * @returns Promise com o resultado do envio
   */
  static async sendPasswordResetEmail(email: string, name: string, resetLink: string): Promise<boolean> {
    const subject = 'RPX Platform - Recuperação de senha';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background: linear-gradient(to right, #6930c3, #5e60ce); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">RPX Platform</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none;">
          <p>Olá, <strong>${name}</strong>!</p>
          <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #6930c3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Redefinir minha senha</a>
          </div>
          <p>Se você não solicitou a redefinição de senha, ignore este email.</p>
          <p>O link acima expirará em 1 hora.</p>
          <p>Atenciosamente,<br>Equipe RPX Platform</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #777; font-size: 12px;">
          <p>© ${new Date().getFullYear()} RPX Platform. Todos os direitos reservados.</p>
        </div>
      </div>
    `;
    
    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }
} 