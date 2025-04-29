import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Exportar o handler de autenticação do NextAuth.js
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 