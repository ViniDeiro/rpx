import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

// POST novo lobby
export async function POST(request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth: !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { lobbyType = 'solo', maxPlayers = 1 } = body;
    
    // Validar o tipo de lobby
    if (!['solo', 'duo', 'squad'].includes(lobbyType)) {
      return NextResponse.json({
        status: 'error',
        error: 'Tipo de lobby inválido'
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 400 });
    }
    
    // Verificar se o usuário já tem um lobby ativo
    const existingLobby = await db.collection('lobbies').findOne({
      owner ObjectId(userId),
      status: 'active'
    });
    
    // Se já existir um lobby, retornar o ID dele
    if (existingLobby) {
      return NextResponse.json({
        status: 'success',
        message: 'Lobby existente',
        lobbyId._id ? lobbyId._id.toString() : ""
      });
    }
    
    // Criar novo lobby
    const newLobby = {
      owner ObjectId(userId),
      members ObjectId(userId)],
      lobbyType,
      maxPlayers,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('lobbies').insertOne(newLobby);
    
    if (!result.insertedId) {
      return NextResponse.json({
        status: 'error',
        error: 'Falha ao criar lobby'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Lobby criado com sucesso',
      lobbyId.insertedId ? lobbyId.insertedId.toString() : ""
    });
  } catch (error) {
    console.error('Erro ao criar lobby:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao criar lobby'
    }, { status: 400 });
  }
} 