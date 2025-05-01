import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

const CadastroPage: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [usuario, setUsuario] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [termos, setTermos] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  
  const router = useRouter();
  const { register } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!nome || !email || !senha || !confirmaSenha || !usuario || !dataNascimento) {
      setErro('Preencha todos os campos obrigatórios');
      return;
    }
    
    if (senha !== confirmaSenha) {
      setErro('As senhas não coincidem');
      return;
    }
    
    if (!termos) {
      setErro('Você precisa aceitar os termos de uso');
      return;
    }
    
    // Verificar idade
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    if (idade < 18) {
      setErro('Você precisa ter pelo menos 18 anos para se cadastrar');
      return;
    }
    
    setErro('');
    setCarregando(true);
    
    try {
      await register({
        name: nome,
        email,
        password: senha,
        username: usuario,
        birthdate: dataNascimento,
        acceptTerms: termos,
        acceptMarketing: marketing
      });
      
      // Redirecionar para a página de login com mensagem de sucesso
      router.push('/login?registered=true');
    } catch (error: any) {
      setErro(error.message || 'Erro ao realizar cadastro');
      setCarregando(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-rpx-dark py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Cadastro | RPX - Plataforma de Competições e Apostas de Free Fire</title>
        <meta name="description" content="Crie sua conta na plataforma RPX para participar de torneios e apostas de Free Fire" />
      </Head>
      
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-center text-3xl font-bold text-rpx-orange">RPX</h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Crie sua conta</h2>
          <p className="mt-2 text-center text-sm text-white/70">
            Ou{' '}
            <Link href="/login" className="font-medium text-rpx-orange hover:text-orange-500">
              faça login se já possui uma conta
            </Link>
          </p>
        </div>
        
        <div className="bg-rpx-blue/20 p-8 rounded-lg">
          {erro && (
            <div className="mb-6 bg-red-500/20 border border-red-500 text-white p-3 rounded">
              {erro}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-white">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rpx-orange focus:border-rpx-orange bg-white/10 text-white"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="usuario" className="block text-sm font-medium text-white">
                  Nome de Usuário <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="usuario"
                    name="usuario"
                    type="text"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rpx-orange focus:border-rpx-orange bg-white/10 text-white"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white">
                  Email <span className="text-red-500">*</span>
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
                <label htmlFor="data-nascimento" className="block text-sm font-medium text-white">
                  Data de Nascimento <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="data-nascimento"
                    name="data-nascimento"
                    type="date"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rpx-orange focus:border-rpx-orange bg-white/10 text-white"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                  />
                </div>
                <p className="mt-1 text-xs text-white/70">Você precisa ter pelo menos 18 anos</p>
              </div>
              
              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-white">
                  Senha <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="senha"
                    name="senha"
                    type="password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rpx-orange focus:border-rpx-orange bg-white/10 text-white"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>
                <p className="mt-1 text-xs text-white/70">Mínimo de 8 caracteres</p>
              </div>
              
              <div>
                <label htmlFor="confirma-senha" className="block text-sm font-medium text-white">
                  Confirme a Senha <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="confirma-senha"
                    name="confirma-senha"
                    type="password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-white/20 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rpx-orange focus:border-rpx-orange bg-white/10 text-white"
                    value={confirmaSenha}
                    onChange={(e) => setConfirmaSenha(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mt-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="termos"
                    name="termos"
                    type="checkbox"
                    className="h-4 w-4 text-rpx-orange focus:ring-rpx-orange border-white/20 rounded bg-white/10"
                    checked={termos}
                    onChange={(e) => setTermos(e.target.checked)}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="termos" className="text-white">
                    Eu li e aceito os <Link href="/termos" className="text-rpx-orange">Termos de Uso</Link> e <Link href="/privacidade" className="text-rpx-orange">Política de Privacidade</Link> <span className="text-red-500">*</span>
                  </label>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="marketing"
                    name="marketing"
                    type="checkbox"
                    className="h-4 w-4 text-rpx-orange focus:ring-rpx-orange border-white/20 rounded bg-white/10"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="marketing" className="text-white">
                    Desejo receber notificações sobre torneios, promoções e novidades
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rpx-orange hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rpx-orange"
                disabled={carregando}
              >
                {carregando ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Criando conta...
                  </span>
                ) : 'Criar Conta'}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-rpx-blue/20 text-white">Ou registre-se com</span>
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
        
        <div className="text-center text-sm text-white/70 mt-6">
          <p>Ao se cadastrar, você concorda em seguir nossas <Link href="/regras" className="text-rpx-orange">Regras da Comunidade</Link>.</p>
        </div>
      </div>
    </div>
  );
};

export default CadastroPage; 