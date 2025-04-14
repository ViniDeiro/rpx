import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';

// Definir interface para partidas
interface Match {
  id: string;
  title?: string;
  mode: string;
  type: string;
  status: string;
  teamSize?: number;
  platform?: string;
  entryFee: number;
  prize: number;
  playersJoined: number;
  totalPlayers: number;
  startTime?: string;
  createdAt: string;
  createdBy: string;
  teams?: any[];
}

// GET - Listar partidas disponíveis
export async function GET(req: NextRequest) {
  try {
    // Obter parâmetros de consulta
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const mode = url.searchParams.get('mode');
    const type = url.searchParams.get('type');
    const platform = url.searchParams.get('platform');
    const status = url.searchParams.get('status') || 'waiting';
    const minEntryFee = url.searchParams.get('minEntryFee') ? parseFloat(url.searchParams.get('minEntryFee')!) : undefined;
    const maxEntryFee = url.searchParams.get('maxEntryFee') ? parseFloat(url.searchParams.get('maxEntryFee')!) : undefined;
    const teamSize = url.searchParams.get('teamSize') ? parseInt(url.searchParams.get('teamSize')!) : undefined;
    
    // Calcular o skip para paginação
    const skip = (page - 1) * limit;
    
    // Preparar filtro de consulta
    const filter: any = {};
    
    if (mode) filter.mode = mode;
    if (type) filter.type = type;
    if (platform) filter.platform = platform;
    if (status) filter.status = status;
    if (teamSize) filter.teamSize = teamSize;
    
    // Filtrar por valor de entrada
    if (minEntryFee !== undefined || maxEntryFee !== undefined) {
      filter.entryFee = {};
      if (minEntryFee !== undefined) filter.entryFee.$gte = minEntryFee;
      if (maxEntryFee !== undefined) filter.entryFee.$lte = maxEntryFee;
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
    
    // Buscar partidas
    const matches = await db.collection('matches')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Contar total de partidas para paginação
    const total = await db.collection('matches').countDocuments(filter);
    
    // Processar e formatar os dados das partidas
    const formattedMatches: Match[] = matches.map((match: any) => ({
      id: match._id.toString(),
      title: match.title || `Partida #${match._id.toString().substring(0, 6)}`,
      mode: match.mode,
      type: match.type,
      status: match.status,
      teamSize: match.teamSize,
      platform: match.platform,
      entryFee: match.entryFee || 0,
      prize: match.prize || 0,
      playersJoined: match.playersJoined || 0,
      totalPlayers: match.totalPlayers || 0,
      startTime: match.startTime,
      createdAt: match.createdAt,
      createdBy: match.createdBy
    }));
    
    // Retornar dados
    return NextResponse.json({
      matches: formattedMatches,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar partidas:', error);
    return NextResponse.json(
      { error: 'Erro ao listar partidas' },
      { status: 500 }
    );
  }
}

// POST - Criar nova partida (requer autenticação)
export async function POST(req: NextRequest) {
  // Nota: Esta é apenas uma estrutura básica para a criação de partidas
  // A implementação completa exigiria autenticação e muitas validações adicionais
  
  return NextResponse.json(
    { message: 'Funcionalidade de criação de partida em implementação' },
    { status: 501 }
  );
} 