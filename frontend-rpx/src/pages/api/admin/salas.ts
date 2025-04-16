import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb/connect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Conectar ao MongoDB  
  try {
    const { db } = await connectToDatabase();
    
    // Tratamento baseado no método da requisição
    switch (req.method) {
      case 'GET':
        return handleGetSalas(req, res, db);
      case 'POST':
        return handleCreateSala(req, res, db);
      case 'PUT':
        return handleUpdateSala(req, res, db);
      case 'DELETE':
        return handleDeleteSala(req, res, db);
      default:
        return res.status(405).json({ success: false, message: 'Método não permitido' });
    }
  } catch (error) {
    console.error('Erro na conexão com o MongoDB:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor ao conectar com o banco de dados',
      error: (error as Error).message
    });
  }
}

// Buscar todas as salas ou uma sala específica
const handleGetSalas = async (req: NextApiRequest, res: NextApiResponse, db: any) => {
  try {
    const { id } = req.query;
    
    if (id) {
      // Buscar uma sala específica
      const sala = await db.collection('matches').findOne({ 
        _id: id,
        isOfficialRoom: true
      });
      
      if (!sala) {
        return res.status(404).json({ success: false, message: 'Sala não encontrada' });
      }
      
      return res.status(200).json({ success: true, data: sala });
    }
    
    // Buscar todas as salas
    const salas = await db.collection('matches')
      .find({ isOfficialRoom: true })
      .sort({ created_at: -1 })
      .toArray();
    
    return res.status(200).json({ success: true, data: salas });
  } catch (error) {
    console.error('Erro ao buscar salas:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar salas', 
      error: (error as Error).message 
    });
  }
};

// Criar uma nova sala
const handleCreateSala = async (req: NextApiRequest, res: NextApiResponse, db: any) => {
  try {
    const newSala = req.body;
    
    // Validar dados
    if (!newSala.name || !newSala.gameType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados incompletos. Verifique se todos os campos obrigatórios foram fornecidos.' 
      });
    }
    
    // Adicionar campos padrão
    const salaToInsert = {
      ...newSala,
      isOfficialRoom: true,
      created_at: new Date(),
      updated_at: new Date(),
      status: newSala.status || 'waiting'
    };
    
    // Inserir no banco
    const result = await db.collection('matches').insertOne(salaToInsert);
    
    return res.status(201).json({ 
      success: true, 
      data: { ...salaToInsert, _id: result.insertedId } 
    });
  } catch (error) {
    console.error('Erro ao criar sala:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar sala', 
      error: (error as Error).message 
    });
  }
};

// Atualizar uma sala existente
const handleUpdateSala = async (req: NextApiRequest, res: NextApiResponse, db: any) => {
  try {
    const { id } = req.query;
    const updatedSala = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID da sala não fornecido' });
    }
    
    // Atualizar a sala
    const result = await db.collection('matches').updateOne(
      { _id: id, isOfficialRoom: true },
      { 
        $set: { 
          ...updatedSala,
          updated_at: new Date() 
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Sala não encontrada' });
    }
    
    // Buscar a sala atualizada
    const updatedDocument = await db.collection('matches').findOne({ _id: id });
    
    return res.status(200).json({ success: true, data: updatedDocument });
  } catch (error) {
    console.error('Erro ao atualizar sala:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar sala', 
      error: (error as Error).message 
    });
  }
};

// Excluir uma sala
const handleDeleteSala = async (req: NextApiRequest, res: NextApiResponse, db: any) => {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID da sala não fornecido' });
    }
    
    // Excluir a sala
    const result = await db.collection('matches').deleteOne({ _id: id, isOfficialRoom: true });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Sala não encontrada' });
    }
    
    return res.status(200).json({ success: true, message: 'Sala excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir sala:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao excluir sala', 
      error: (error as Error).message 
    });
  }
}; 