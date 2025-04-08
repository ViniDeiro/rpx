import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !senha) {
      setErro('Preencha todos os campos');
      return;
    }
    
    setErro('');
    setCarregando(true);
    
    // Simulação de login (aqui seria integrado com a API)
    setTimeout(() => {
      if (email === 'demo@rpx.com' && senha === 'senha123') {
        // Login bem-sucedido
        router.push('/');
      } else {
        setErro('Email ou senha incorretos');
        setCarregando(false);
      }
    }, 1500);
  };
  
  return (
    <div className="min-h-screen bg-rpx-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Login | RPX - Plataforma de Competições e Apostas de Free Fire</title>
        <meta name="description" content="Faça login na plataforma RPX para participar de torneios e apostas de Free Fire" />
      </Head>
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-rpx-orange">RPX</h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Entre na sua conta</h2>
          <p className="mt-2 text-center text-sm text-white/70">
            Ou{' '}
            <Link href="/cadastro" className="font-medium text-rpx-orange hover:text-orange-500">
              crie uma nova conta
            </Link>
          </p>
        </div>
        
        <div className="mt-8 bg-rpx-blue/20 p-8 rounded-lg">
          {erro && (
            <div className="mb-4 bg-red-500/20 border border-red-500 text-white p-3 rounded">
              {erro}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rpx-orange focus:border-rpx-orange bg-white/10 text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rpx-orange focus:border-rpx-orange bg-white/10 text-white"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-rpx-orange focus:ring-rpx-orange border-white/20 rounded bg-white/10"
                  checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-white">
                  Lembrar-me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/recuperar-senha" className="font-medium text-rpx-orange hover:text-orange-500">
                  Esqueceu sua senha?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rpx-orange hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rpx-orange"
                disabled={carregando}
              >
                {carregando ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Entrando...
                  </span>
                ) : 'Entrar'}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-rpx-blue/20 text-white">Ou continue com</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div>
                <button
                  className="w-full inline-flex justify-center py-2 px-4 border border-white/20 rounded-md shadow-sm bg-white/10 text-sm font-medium text-white hover:bg-white/20"
                >
                  Google
                </button>
              </div>
              <div>
                <button
                  className="w-full inline-flex justify-center py-2 px-4 border border-white/20 rounded-md shadow-sm bg-white/10 text-sm font-medium text-white hover:bg-white/20"
                >
                  Facebook
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center text-sm text-white/70">
          <p>Ao fazer login, você concorda com os nossos <Link href="/termos" className="text-rpx-orange">Termos de Uso</Link> e <Link href="/privacidade" className="text-rpx-orange">Política de Privacidade</Link>.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 