import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Código secreto para configuração inicial
const FIX_SECRET = process.env.FIX_SECRET || 'fix_admin_123456';

// GET: Corrigir papel de administrador
export async function GET(request) {
  try {
    // Verificar código secreto para segurança
    const { searchParams } = new URL(request.url);
    const secretCode = searchParams.get('secretCode');
    
    if (secretCode !== FIX_SECRET) {
      console.log('Tentativa de corrigir admin com código inválido');
      // Retornar 404 como se a rota não existisse para segurança
      return new NextResponse(null, { status: 404 });
    }
    
    // Obter a sessão atual (se houver)
    const session = await getServerSession(authOptions);
    let userId = searchParams.get('userId');
    
    // Se não foi especificado um ID e há sessão, usar o ID da sessão
    if (!userId && session?.user?.id) {
      userId = session.user.id;
    }
    
    // Se ainda não temos ID, retornar erro
    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário não fornecido' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Atualizar o usuário para papel de admin
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          isAdmin: true,
          role: 'admin',
          updatedAt: new Date()
        }
      }
    );
    
    // Verificar se a atualização funcionou
    const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { _id: 1, username: 1, email: 1, isAdmin: 1, role: 1 } }
    );
    
    if (!updatedUser || !updatedUser.isAdmin) {
      return NextResponse.json(
        { error: 'Falha ao corrigir permissões do administrador' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Permissões de administrador corrigidas com sucesso',
      user: {
        id: updatedUser._id.toString(),
        username: updatedUser.username,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Erro ao corrigir permissões de administrador:', error);
    return NextResponse.json(
      { error: 'Erro ao corrigir permissões de administrador' },
      { status: 500 }
    );
  }
} 