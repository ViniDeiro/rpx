import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { EmailService } from '@/services/email/emailService';

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string;
  role?: string;
}

interface Session {
  user: User;
}

/**
 * API para envio em massa de emails para usuários
 * POST /api/notifications/email/mass-send
 * 
 * Essa API permite enviar emails para vários usuários de uma vez,
 * útil para anúncios, promoções ou notificações importantes do sistema.
 * 
 * Requer autenticação de administrador.
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação do usuário (apenas administradores)
    const session = await getServerSession(authOptions) as Session | null;
    const isServer = req.headers.get('x-api-key') === process.env.API_SECRET_KEY;
    
    if (!isServer && (!session?.user?.role || session.user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Não autorizado, apenas administradores podem usar esta API' },
        { status: 401 }
      );
    }

    // Obter dados da requisição
    const body = await req.json();
    const { 
      userIds, // Array de IDs de usuários para enviar emails 
      userFilter, // Objeto de filtro para encontrar usuários no banco
      subject, // Assunto do email
      template, // Template de email a ser usado (opcional)
      templateData, // Dados para o template
      html, // HTML personalizado (caso não use template)
      testMode // Se verdadeiro, apenas simula o envio sem realmente enviar os emails
    } = body;

    // Validar dados básicos
    if (!subject || (!template && !html)) {
      return NextResponse.json(
        { error: 'Dados incompletos: assunto e conteúdo (template ou html) são obrigatórios' },
        { status: 400 }
      );
    }

    // Conectar ao MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }

    // Encontrar usuários
    let users = [];
    if (userIds && userIds.length > 0) {
      // Se tiver IDs específicos, buscar esses usuários
      users = await db.collection('users').find({
        _id: { $in: userIds.map((id: string) => new mongoose.Types.ObjectId(id)) }
      }).toArray();
    } else if (userFilter) {
      // Se tiver filtro, usar o filtro para encontrar usuários
      users = await db.collection('users').find(userFilter).toArray();
    } else {
      return NextResponse.json(
        { error: 'É necessário fornecer userIds ou userFilter para enviar emails' },
        { status: 400 }
      );
    }

    // Verificar se encontrou usuários
    if (!users.length) {
      return NextResponse.json(
        { error: 'Nenhum usuário encontrado com os critérios fornecidos' },
        { status: 404 }
      );
    }

    // Inicializar serviço de email
    EmailService.initialize();

    // Registrar o evento de envio de emails em massa
    await db.collection('emailCampaigns').insertOne({
      createdAt: new Date(),
      createdBy: session?.user?.id || 'system',
      userCount: users.length,
      subject,
      template: template || 'custom',
      testMode: !!testMode
    });

    // Resultados dos envios
    const results = {
      total: users.length,
      successful: 0,
      failed: 0,
      testMode: !!testMode
    };

    // Enviar emails para cada usuário
    if (!testMode) {
      for (const user of users) {
        try {
          // Preparar dados personalizados para este usuário
          const personalizedData = {
            ...templateData,
            name: user.name || user.username || 'Usuário',
            username: user.username || user.name || 'Usuário',
            email: user.email
          };

          // Decidir qual conteúdo HTML usar
          let emailHtml;
          if (template) {
            // Usar template específico
            switch (template) {
              case 'announcement':
                emailHtml = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                    <div style="background: linear-gradient(to right, #6930c3, #5e60ce); padding: 20px; border-radius: 8px 8px 0 0;">
                      <h1 style="color: white; margin: 0; text-align: center;">RPX.GG</h1>
                    </div>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none;">
                      <p>Olá, <strong>${personalizedData.name}</strong>!</p>
                      <h2>${templateData.title || 'Novidades na RPX.GG'}</h2>
                      <div>${templateData.content || ''}</div>
                      ${templateData.callToAction ? `
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="${templateData.callToActionUrl || 'https://rpx.gg'}" style="background-color: #6930c3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">${templateData.callToAction}</a>
                        </div>
                      ` : ''}
                      <p>Atenciosamente,<br>Equipe RPX.GG</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px; color: #777; font-size: 12px;">
                      <p>© ${new Date().getFullYear()} RPX.GG. Todos os direitos reservados.</p>
                      <p>Você recebeu este email porque está cadastrado na plataforma RPX.GG.</p>
                    </div>
                  </div>
                `;
                break;
              case 'promotion':
                emailHtml = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                    <div style="background: linear-gradient(to right, #6930c3, #5e60ce); padding: 20px; border-radius: 8px 8px 0 0;">
                      <h1 style="color: white; margin: 0; text-align: center;">RPX.GG</h1>
                    </div>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none;">
                      <p>Olá, <strong>${personalizedData.name}</strong>!</p>
                      <h2>${templateData.promotionTitle || 'Promoção Especial'}</h2>
                      <div style="background-color: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin: 20px 0;">
                        ${templateData.promotionContent || ''}
                        ${templateData.promotionCode ? `
                          <div style="margin: 15px 0; text-align: center;">
                            <div style="background-color: #f5f5f5; border: 1px dashed #999; padding: 10px; display: inline-block; font-family: monospace; font-size: 18px; letter-spacing: 2px;">${templateData.promotionCode}</div>
                          </div>
                        ` : ''}
                        ${templateData.expiryDate ? `
                          <p style="color: #d32f2f; text-align: center; font-weight: bold;">Válido até: ${new Date(templateData.expiryDate).toLocaleDateString('pt-BR')}</p>
                        ` : ''}
                      </div>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${templateData.callToActionUrl || 'https://rpx.gg/promocoes'}" style="background-color: #6930c3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">${templateData.callToAction || 'Aproveitar Agora'}</a>
                      </div>
                      <p>Atenciosamente,<br>Equipe RPX.GG</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px; color: #777; font-size: 12px;">
                      <p>© ${new Date().getFullYear()} RPX.GG. Todos os direitos reservados.</p>
                      <p>Você recebeu este email porque está cadastrado na plataforma RPX.GG.</p>
                    </div>
                  </div>
                `;
                break;
              default:
                // Template desconhecido, usar HTML padrão
                emailHtml = html || `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                    <div style="background: linear-gradient(to right, #6930c3, #5e60ce); padding: 20px; border-radius: 8px 8px 0 0;">
                      <h1 style="color: white; margin: 0; text-align: center;">RPX.GG</h1>
                    </div>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none;">
                      <p>Olá, <strong>${personalizedData.name}</strong>!</p>
                      <p>${subject}</p>
                      <p>Atenciosamente,<br>Equipe RPX.GG</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px; color: #777; font-size: 12px;">
                      <p>© ${new Date().getFullYear()} RPX.GG. Todos os direitos reservados.</p>
                    </div>
                  </div>
                `;
            }
          } else {
            // Usar HTML personalizado
            emailHtml = html;
          }

          // Enviar o email
          const success = await EmailService.sendEmail({
            to: user.email,
            subject,
            html: emailHtml
          });

          // Registrar resultado
          if (success) {
            results.successful++;
            
            // Registrar email enviado
            await db.collection('emailsSent').insertOne({
              userId: user._id,
              email: user.email,
              subject,
              template: template || 'custom',
              sentAt: new Date(),
              success: true
            });
          } else {
            results.failed++;
            
            // Registrar falha no envio
            await db.collection('emailsSent').insertOne({
              userId: user._id,
              email: user.email,
              subject,
              template: template || 'custom',
              sentAt: new Date(),
              success: false
            });
          }
        } catch (error) {
          // Em caso de erro, continuar com os próximos usuários
          console.error(`Erro ao enviar email para ${user.email}:`, error);
          results.failed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: testMode ? 'Teste de envio concluído' : 'Envio de emails em massa concluído',
      results
    });
  } catch (error) {
    console.error('Erro ao enviar emails em massa:', error);
    return NextResponse.json(
      { error: 'Erro ao processar envio de emails em massa' },
      { status: 500 }
    );
  }
} 