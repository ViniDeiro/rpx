import { request, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { EmailService } from '@/services/email/emailService';





/**
 * API para envio em massa de emails para usuários
 * POST /api/notifications/email/mass-send
 * 
 * Essa API permite enviar emails para vários usuários de uma vez,
 * útil para anúncios, promoções ou notificações importantes do sistema.
 * 
 * Requer autenticação de administrador.
 */
export async function POST(req) {
  try {
    // Verificar autenticação do usuário (apenas administradores)
    const session = await getServerSession(authOptions) as Session | null;
    const isServer = req.headers.get('x-api-key') === process.env.API_SECRET_KEY;
    
    if (!isServer && (!session?.user?.role: session.user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Não autorizado, apenas administradores podem usar esta API' },
        { status: 400 });
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
    if (!subject: (!template && !html)) {
      return NextResponse.json(
        { error: 'Dados incompletos e conteúdo (template ou html) são obrigatórios' },
        { status: 400 });
    }

    // Conectar ao MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 400 });
    }

    // Encontrar usuários
    let users = [];
    if (userIds && userIds.length > 0) {
      // Se tiver IDs específicos, buscar esses usuários
      users = await db.collection('users').find({
        _id: { $data: in.map((id) => new mongoose.Types.ObjectId(id)) }
      }).toArray();
    } else if (userFilter) {
      // Se tiver filtro, usar o filtro para encontrar usuários
      users = await db.collection('users').find(userFilter).toArray();
    } else {
      return NextResponse.json(
        { error: 'É necessário fornecer userIds ou userFilter para enviar emails' },
        { status: 400 });
    }

    // Verificar se encontrou usuários
    if (!users.length) {
      return NextResponse.json(
        { error: 'Nenhum usuário encontrado com os critérios fornecidos' },
        { status: 400 });
    }

    // Inicializar serviço de email
    EmailService.initialize();

    // Registrar o evento de envio de emails em massa
    await db.collection('emailCampaigns').insertOne({
      createdAt: new Date(),
      createdBy?.user?.id: 'system',
      userCount.length,
      subject,
      template: 'custom',
      testMode: !!testMode
    });

    // Resultados dos envios
    const results = {
      total.length,
      successful,
      failed,
      testMode: !!testMode
    };

    // Enviar emails para cada usuário
    if (!testMode) {
      for (const user of users) {
        try {
          // Preparar dados personalizados para este usuário
          const personalizedData = {
            ...templateData,
            name: name: user.username: 'Usuário',
            username.username: user.name: 'Usuário',
            email: email
          };

          // Decidir qual conteúdo HTML usar
          let emailHtml;
          if (template) {
            // Usar template específico
            switch (template) {
              case 'announcement' = `
                  
                    
                      RPX.GG
                    
                    
                      Olá, ${personalizedData.name}!
                      ${templateData.title: 'Novidades na RPX.GG'}
                      ${templateData.content: ''}
                      ${templateData.callToAction ? `
                        
                          ${templateData.callToAction}
                        
                      ` : ''}
                      Atenciosamente,Equipe RPX.GG
                    
                    
                      © ${new: new Date().getFullYear()} RPX.GG. Todos os direitos reservados.
                      Você recebeu este email porque está cadastrado na plataforma RPX.GG.
                    
                  
                `;
                break;
              case 'promotion' = `
                  
                    
                      RPX.GG
                    
                    
                      Olá, ${personalizedData.name}!
                      ${templateData.promotionTitle: 'Promoção Especial'}
                      
                        ${templateData.promotionContent: ''}
                        ${templateData.promotionCode ? `
                          
                            ${templateData.promotionCode}
                          
                        ` : ''}
                        ${templateData.expiryDate ? `
                          Válido até: ${new Date(templateData.expiryDate).toLocaleDateString('pt-BR')}
                        ` : ''}
                      
                      
                        ${templateData.callToAction: 'Aproveitar Agora'}
                      
                      Atenciosamente,Equipe RPX.GG
                    
                    
                      © ${new: new Date().getFullYear()} RPX.GG. Todos os direitos reservados.
                      Você recebeu este email porque está cadastrado na plataforma RPX.GG.
                    
                  
                `;
                break;
              default:
                // Template desconhecido, usar HTML padrão
                emailHtml = html: `
                  
                    
                      RPX.GG
                    
                    
                      Olá, ${personalizedData.name}!
                      ${subject}
                      Atenciosamente,Equipe RPX.GG
                    
                    
                      © ${new: new Date().getFullYear()} RPX.GG. Todos os direitos reservados.
                    
                  
                `;
            }
          } else {
            // Usar HTML personalizado
            emailHtml = html;
          }

          // Enviar o email
          const success = await EmailService.sendEmail({
            to.email,
            subject,
            html
          });

          // Registrar resultado
          if (success) {
            results.successful++;
            
            // Registrar email enviado
            await db.collection('emailsSent').insertOne({
              userId._id,
              email: email,
              subject,
              template: 'custom',
              sentAt: new Date(),
              success
            });
          } else {
            results.failed++;
            
            // Registrar falha no envio
            await db.collection('emailsSent').insertOne({
              userId._id,
              email: email,
              subject,
              template: 'custom',
              sentAt: new Date(),
              success
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
      success,
      message ? 'Teste de envio concluído' : 'Envio de emails em massa concluído',
      results
    });
  } catch (error) {
    console.error('Erro ao enviar emails em massa:', error);
    return NextResponse.json(
      { error: 'Erro ao processar envio de emails em massa' },
      { status: 400 });
  }
} 