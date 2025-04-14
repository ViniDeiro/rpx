import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import mongoose from 'mongoose';

// Este é um handler de API que lidará com operações relacionadas às verificações de resultados
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar autenticação do administrador
  const session = await getSession({ req });
  if (!session || !session.user || (session.user as any).role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Não autorizado' });
  }

  // Conexão com o MongoDB
  if (!mongoose.connections[0].readyState) {
    try {
      await mongoose.connect(process.env.MONGODB_URI as string);
    } catch (error) {
      console.error('Erro ao conectar com o MongoDB:', error);
      return res.status(500).json({ success: false, message: 'Erro ao conectar com o banco de dados' });
    }
  }

  // Roteamento baseado no método HTTP
  switch (req.method) {
    case 'GET':
      return getVerifications(req, res);
    case 'PUT':
      return updateVerification(req, res);
    case 'POST':
      if (req.query.action === 'approve-all') {
        return approveAllPending(req, res);
      }
      return createVerification(req, res);
    default:
      return res.status(405).json({ success: false, message: 'Método não permitido' });
  }
}

// Obter verificações (com filtros opcionais)
async function getVerifications(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { status, username, matchId, startDate, endDate } = req.query;
    
    // Construir filtro baseado nos parâmetros de consulta
    const filter: any = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (username) {
      filter.username = { $regex: username, $options: 'i' };
    }
    
    if (matchId) {
      filter.matchId = matchId;
    }
    
    // Filtro de data
    if (startDate || endDate) {
      filter.submittedAt = {};
      if (startDate) {
        filter.submittedAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const endDateTime = new Date(endDate as string);
        endDateTime.setHours(23, 59, 59, 999);
        filter.submittedAt.$lte = endDateTime;
      }
    }
    
    // Em produção, usaríamos um modelo Mongoose para acessar o banco de dados
    // const verifications = await VerificationModel.find(filter).sort({ submittedAt: -1 });
    
    // Simular dados para desenvolvimento
    const verifications = Array.from({ length: 15 }).map((_, i) => {
      const statuses = ['pending', 'approved', 'rejected', 'disputed'];
      const status = i < 8 ? 'pending' : statuses[i % statuses.length];
      
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const winner = Math.random() > 0.5 ? 'team1' : 'team2';
      
      return {
        id: `verif-${1000 + i}`,
        matchId: `match-${500 + i}`,
        matchTitle: `Partida #${500 + i} - ${i % 2 === 0 ? 'Squad' : 'Duo'}`,
        submittedBy: `user-${200 + (i % 5)}`,
        username: `usuario${200 + (i % 5)}`,
        submittedAt: date.toISOString(),
        result: {
          winner,
          team1Score: winner === 'team1' ? 3 : 1,
          team2Score: winner === 'team2' ? 3 : 1,
          screenshots: ['https://via.placeholder.com/800x600?text=Screenshot+Partida']
        },
        status,
        prize: 10 * (i % 3 + 1)
      };
    });
    
    // Aplicar filtros simulados para desenvolvimento
    let filteredVerifications = verifications;
    
    if (status && status !== 'all') {
      filteredVerifications = filteredVerifications.filter(v => v.status === status);
    }
    
    if (username) {
      filteredVerifications = filteredVerifications.filter(v => 
        v.username.toLowerCase().includes((username as string).toLowerCase())
      );
    }
    
    if (matchId) {
      filteredVerifications = filteredVerifications.filter(v => v.matchId === matchId);
    }
    
    return res.status(200).json({ success: true, data: filteredVerifications });
  } catch (error) {
    console.error('Erro ao obter verificações:', error);
    return res.status(500).json({ success: false, message: 'Erro ao processar requisição' });
  }
}

// Atualizar verificação (aprovar/rejeitar)
async function updateVerification(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const { status, comment } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status inválido' });
    }
    
    if (status === 'rejected' && !comment) {
      return res.status(400).json({ success: false, message: 'Comentário é obrigatório para rejeição' });
    }
    
    // Em produção, usaríamos um modelo Mongoose para atualizar o registro
    /*
    const verification = await VerificationModel.findById(id);
    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verificação não encontrada' });
    }
    
    verification.status = status;
    verification.reviewedBy = session.user.id;
    verification.reviewedAt = new Date();
    
    if (status === 'rejected') {
      verification.comment = comment;
    }
    
    if (status === 'approved') {
      // Atualizar resultado da partida
      const match = await MatchModel.findById(verification.matchId);
      if (match) {
        match.result = {
          winner: verification.result.winner,
          team1Score: verification.result.team1Score,
          team2Score: verification.result.team2Score,
          verifiedBy: session.user.id,
          verifiedAt: new Date()
        };
        match.status = 'completed';
        await match.save();
        
        // Processar pagamento para o vencedor
        if (verification.result.winner === 'team1') {
          await processPayment(match.team1.captain, verification.prize);
        } else {
          await processPayment(match.team2.captain, verification.prize);
        }
      }
    }
    
    await verification.save();
    */
    
    // Simulação de resposta para desenvolvimento
    return res.status(200).json({ 
      success: true, 
      message: status === 'approved' ? 'Verificação aprovada com sucesso' : 'Verificação rejeitada',
      data: {
        id,
        status,
        reviewedBy: 'admin-user',
        reviewedAt: new Date().toISOString(),
        comment: status === 'rejected' ? comment : undefined
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar verificação:', error);
    return res.status(500).json({ success: false, message: 'Erro ao processar requisição' });
  }
}

// Aprovar todas as verificações pendentes
async function approveAllPending(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Em produção, usaríamos um modelo Mongoose para atualizar múltiplos registros
    /*
    const pendingVerifications = await VerificationModel.find({ status: 'pending' });
    
    // Iniciar transação para garantir atomicidade
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      for (const verification of pendingVerifications) {
        verification.status = 'approved';
        verification.reviewedBy = session.user.id;
        verification.reviewedAt = new Date();
        await verification.save({ session });
        
        // Atualizar resultado da partida
        const match = await MatchModel.findById(verification.matchId).session(session);
        if (match) {
          match.result = {
            winner: verification.result.winner,
            team1Score: verification.result.team1Score,
            team2Score: verification.result.team2Score,
            verifiedBy: session.user.id,
            verifiedAt: new Date()
          };
          match.status = 'completed';
          await match.save({ session });
          
          // Processar pagamento para o vencedor
          if (verification.result.winner === 'team1') {
            await processPayment(match.team1.captain, verification.prize, session);
          } else {
            await processPayment(match.team2.captain, verification.prize, session);
          }
        }
      }
      
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    */
    
    // Simulação de resposta para desenvolvimento
    return res.status(200).json({ 
      success: true, 
      message: 'Todas as verificações pendentes foram aprovadas',
      count: 8 // Número simulado de verificações aprovadas
    });
  } catch (error) {
    console.error('Erro ao aprovar verificações pendentes:', error);
    return res.status(500).json({ success: false, message: 'Erro ao processar requisição' });
  }
}

// Criar verificação (não usado pelo admin, mas incluído para completude da API)
async function createVerification(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { matchId, result, submittedBy, username } = req.body;
    
    if (!matchId || !result || !submittedBy) {
      return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }
    
    // Em produção, usaríamos um modelo Mongoose para criar o registro
    /*
    const verification = new VerificationModel({
      matchId,
      result,
      submittedBy,
      username,
      submittedAt: new Date(),
      status: 'pending'
    });
    
    await verification.save();
    */
    
    // Simulação de resposta para desenvolvimento
    return res.status(201).json({ 
      success: true, 
      message: 'Verificação criada com sucesso',
      data: {
        id: `verif-${Date.now()}`,
        matchId,
        result,
        submittedBy,
        username,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Erro ao criar verificação:', error);
    return res.status(500).json({ success: false, message: 'Erro ao processar requisição' });
  }
} 