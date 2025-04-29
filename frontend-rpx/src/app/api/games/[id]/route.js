import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

// Usar a string de conexão diretamente em vez de depender da variável de ambiente
const MONGODB_URI = 'mongodb+srv://vinideirolopess:c7MVBr6XpIkQwGaZ@cluster0.vocou4s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// GET /api/games/[id] - Obter informações de um jogo específico
export async function GET(request, { params }) {
  try {
    // Conectar diretamente ao MongoDB sem depender de uma função externa
    if (!mongoose.connection.readyState) {
      await mongoose.connect(MONGODB_URI);
    }

    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('Conexão com o banco de dados não estabelecida');
    }
    
    // Buscar o jogo pelo ID, convertendo a string para ObjectId
    const game = await db.collection('games').findOne({ 
      _id: new ObjectId(params.id) 
    });
    
    if (!game) {
      return NextResponse.json(
        { error: 'Jogo não encontrado' },
        { status);
    }
    
    return NextResponse.json({
      status: 'success',
      game
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do jogo:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar detalhes do jogo' },
      { status);
  }
} 