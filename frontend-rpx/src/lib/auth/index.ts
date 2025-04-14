import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';

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
  providers: [],
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
  },
};

// Exporta as funções do módulo middleware
export * from './middleware'; 