import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import mongoose from 'mongoose';

// Rota para corrigir o superadmin existente usando comandos diretos do MongoDB
// para evitar problemas de validação com o Mongoose
export async function GET(request: Request) {
  try {
    // Conectar ao banco de dados diretamente
    await connectToDatabase();
    
    // Verificar se a conexão foi estabelecida
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Não foi possível estabelecer conexão com o banco de dados');
    }
    
    // Usar updateOne direto na coleção para contornar validações de esquema
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Encontrar o usuário master e atualizar com força
    const result = await usersCollection.updateOne(
      { username: 'master' },
      { 
        $set: { 
          role: 'admin',  // Primeiro alteramos para admin (valor conhecido como válido)
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        message: 'Usuário master não encontrado' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      message: 'Usuário master corrigido com sucesso',
      updated: result.modifiedCount > 0,
      details: result
    });
    
  } catch (error) {
    console.error('Erro ao corrigir usuário superadmin:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a correção', details: String(error) },
      { status: 500 }
    );
  }
} 