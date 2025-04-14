import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getModels } from '@/lib/mongodb/models';
import { connectToDatabase } from '@/lib/mongodb/connect';

// Segredo para o JWT (idealmente deve vir de variáveis de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET() {
  console.log('Requisição de perfil de usuário recebida');
  
  try {
    // Obter o header de autorização
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('Requisição sem token de autorização válido');
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 }
      );
    }

    // Extrair o token
    const token = authorization.split(' ')[1];
    
    try {
      // Verificar o token
      console.log('Verificando token JWT...');
      const decodedToken = jwt.verify(token, JWT_SECRET) as any;
      console.log('Token verificado com sucesso');
      
      // Conectar ao banco de dados
      console.log('Conectando ao MongoDB...');
      await connectToDatabase();
      console.log('Conexão com MongoDB estabelecida');
      
      // Obter modelo de usuário
      const { User } = await getModels();
      
      // Buscar usuário pelo ID
      console.log(`Buscando usuário com ID: ${decodedToken.userId}`);
      const user = await User.findById(decodedToken.userId);
      
      if (!user) {
        console.log('Usuário não encontrado no banco de dados');
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        );
      }
      
      console.log(`Usuário encontrado: ${user.username}`);
      
      // Preparar dados do usuário para resposta
      const userData = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile || {},
        balance: user.wallet?.balance || 0,
        stats: user.stats || {}
      };
      
      console.log('Retornando dados do perfil do usuário');
      return NextResponse.json({
        message: 'Perfil do usuário obtido com sucesso',
        user: userData
      });
    } catch (tokenError) {
      console.error('Erro ao verificar token:', tokenError);
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Erro ao obter perfil do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
} 