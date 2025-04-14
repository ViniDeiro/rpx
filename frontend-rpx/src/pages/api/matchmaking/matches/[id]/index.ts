import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb/connect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Pegar o ID da partida dos parâmetros da URL
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID da partida é obrigatório' });
  }

  try {
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    if (req.method === 'GET') {
      // Buscar partida pelo ID
      const match = await db.collection('matches').findOne({ id });

      if (!match) {
        return res.status(404).json({ error: 'Partida não encontrada' });
      }

      return res.status(200).json(match);
    }

    // Método não permitido
    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro ao processar solicitação de partida:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
} 