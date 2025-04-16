import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { verifyToken } from './jwt';
import { getAuthUrl, getJwtSecret } from '@/lib/environment';

// Estendendo a interface Session para incluir os campos adicionais
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string;
    }
  }
}

// Configurações de autenticação para NextAuth
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciais inválidas');
        }

        try {
          const { db } = await connectToDatabase();
          
          // Buscar o usuário pelo email
          const user = await db.collection('users').findOne({ email: credentials.email });
          
          if (!user) {
            throw new Error('Usuário não encontrado');
          }
          
          // Aqui você deve implementar a verificação de senha
          // Por simplicidade, estou apenas simulando que a verificação foi bem sucedida
          
          return {
            id: user._id.toString(),
            name: user.name || user.username,
            email: user.email,
            username: user.username
          };
        } catch (error) {
          console.error('Erro na autenticação:', error);
          throw new Error('Falha na autenticação');
        }
      }
    })
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.sub || '';
        session.user.username = token.name || '';
      }
      return session;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: getJwtSecret(),
  debug: process.env.NODE_ENV !== 'production',
};

// Exporta as funções do módulo middleware
export * from './middleware'; 