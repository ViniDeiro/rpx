import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Verificar se o usuário é admin
async function isAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.id) {
    return false;
  }
  
  const { db } = await connectToDatabase();
  
  const user = await db.collection('users').findOne({
    _id: new ObjectId(session.user.id)
  });
  
  return user && user.isAdmin === true;
}

// GET - Obter estatísticas da loja
export async function GET(request) {
  try {
    // Verificar se o usuário é admin
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar este recurso.' },
        { status: 403 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // 1. Total de produtos
    const totalProducts = await db.collection('products').countDocuments();
    
    // 2. Total de produtos por categoria
    const productsByCategory = await db.collection('products').aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    // 3. Vendas recentes (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSales = await db.collection('orders')
      .find({ createdAt: { $gte: thirtyDaysAgo } })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    // 4. Total de vendas por mês (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const salesByMonth = await db.collection('orders').aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { 
            year: { $year: '$createdAt' }, 
            month: { $month: '$createdAt' } 
          },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]).toArray();
    
    return NextResponse.json({
      totalProducts,
      productsByCategory,
      recentSales: recentSales.map(sale => ({
        id: sale._id ? sale._id.toString() : "",
        user: sale.userId,
        total: sale.totalAmount,
        date: sale.createdAt
      })),
      salesByMonth: salesByMonth.map(item => ({
        year: item._id.year,
        month: item._id.month,
        total: item.total,
        count: item.count
      }))
    });
    
  } catch (error) {
    console.error('Erro ao obter estatísticas da loja:', error);
    return NextResponse.json(
      { error: 'Erro ao obter estatísticas da loja', details: error.message },
      { status: 500 }
    );
  }
} 