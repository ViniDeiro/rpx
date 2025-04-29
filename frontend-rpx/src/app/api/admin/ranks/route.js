import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// GET - Listar todos os ranks
export async function GET(request) {
  try {
    // Verificar se o usuário é admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { status: 'error', error: 'Apenas administradores podem acessar este recurso' },
        { status: 403 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Buscar todos os ranks ordenados por threshold
    const ranks = await db.collection('ranks')
      .find()
      .sort({ threshold: 1 })
      .toArray();

    return NextResponse.json({
      status: 'success',
      data: ranks.map(rank => ({
        ...rank,
        id: rank._id.toString()
      }))
    });
  } catch (error) {
    console.error('Erro ao listar ranks:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao listar ranks: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}

// POST - Criar ou atualizar um rank
export async function POST(request) {
  try {
    // Verificar se o usuário é admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { status: 'error', error: 'Apenas administradores podem acessar este recurso' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      id, // Se fornecido, atualiza o rank existente
      name,
      tier,
      division,
      imageUrl,
      bannerUrl,
      iconUrl,
      threshold,
      color,
      rewards
    } = body;

    // Validar dados obrigatórios
    if (!name || !imageUrl || threshold === undefined) {
      return NextResponse.json(
        { status: 'error', error: 'Dados insuficientes. Nome, imagem e threshold são obrigatórios.' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Verificar se já existe um rank com o mesmo nome e tier
    let existingRank = null;
    if (id) {
      existingRank = await db.collection('ranks').findOne({
        _id: new ObjectId(id)
      });
    } else {
      existingRank = await db.collection('ranks').findOne({
        name,
        tier: tier || '',
        division: division || ''
      });
    }

    let result;
    const rankData = {
      name,
      tier: tier || '',
      division: division || '',
      imageUrl,
      bannerUrl: bannerUrl || '',
      iconUrl: iconUrl || '',
      threshold: Number(threshold),
      color: color || '#CCCCCC',
      rewards: rewards || [],
      updatedAt: new Date(),
      updatedBy: session.user.id || session.user.email
    };

    // Atualizar rank existente ou criar novo
    if (existingRank) {
      result = await db.collection('ranks').updateOne(
        { _id: existingRank._id },
        { $set: rankData }
      );

      // Registrar log de auditoria
      await db.collection('admin_logs').insertOne({
        adminId: session.user.id || session.user.email,
        adminEmail: session.user.email,
        action: 'update_rank',
        entity: 'rank',
        entityId: existingRank._id.toString(),
        details: rankData,
        timestamp: new Date()
      });

      return NextResponse.json({
        status: 'success',
        message: 'Rank atualizado com sucesso',
        rankId: existingRank._id.toString()
      });
    } else {
      // Adicionar campos para criação
      rankData.createdAt = new Date();
      rankData.createdBy = session.user.id || session.user.email;

      result = await db.collection('ranks').insertOne(rankData);

      // Registrar log de auditoria
      await db.collection('admin_logs').insertOne({
        adminId: session.user.id || session.user.email,
        adminEmail: session.user.email,
        action: 'create_rank',
        entity: 'rank',
        entityId: result.insertedId.toString(),
        details: rankData,
        timestamp: new Date()
      });

      return NextResponse.json({
        status: 'success',
        message: 'Rank criado com sucesso',
        rankId: result.insertedId.toString()
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Erro ao gerenciar rank:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao gerenciar rank: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}

// DELETE - Remover um rank
export async function DELETE(request) {
  try {
    // Verificar se o usuário é admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { status: 'error', error: 'Apenas administradores podem acessar este recurso' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { status: 'error', error: 'ID do rank não fornecido' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Verificar se o rank existe
    const rank = await db.collection('ranks').findOne({
      _id: new ObjectId(id)
    });

    if (!rank) {
      return NextResponse.json(
        { status: 'error', error: 'Rank não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se existem usuários usando este rank
    const usersWithRank = await db.collection('users').countDocuments({
      rank: rank.name
    });

    if (usersWithRank > 0) {
      return NextResponse.json({
        status: 'error',
        error: `Não é possível excluir o rank '${rank.name}' pois existem ${usersWithRank} usuários associados a ele.`
      }, { status: 400 });
    }

    // Remover o rank
    await db.collection('ranks').deleteOne({
      _id: new ObjectId(id)
    });

    // Registrar log de auditoria
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id || session.user.email,
      adminEmail: session.user.email,
      action: 'delete_rank',
      entity: 'rank',
      entityId: id,
      details: rank,
      timestamp: new Date()
    });

    return NextResponse.json({
      status: 'success',
      message: 'Rank removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover rank:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao remover rank: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
} 