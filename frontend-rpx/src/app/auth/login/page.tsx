'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, AlertTriangle } from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, isSimulatedMode } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Preencher com os dados demo se estiver em modo simulado
  useEffect(() => {
    if (isSimulatedMode) {
      setFormData({
        email: 'demo@rpx.com',
        password: 'senha123',
        remember: true
      });
    }
  }, [isSimulatedMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      router.push('/profile');
    } catch (err: any) {
      console.error('Erro no login:', err);
      setError(err.message || 'Email ou senha incorretos. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Facilitar login durante desenvolvimento
  const handleDemoLogin = async () => {
    setFormData({
      email: 'demo@rpx.com',
      password: 'senha123',
      remember: true
    });
    
    setIsLoading(true);

    try {
      await login('demo@rpx.com', 'senha123');
      router.push('/profile');
    } catch (err: any) {
      console.error('Erro no login demo:', err);
      setError(err.message || 'Erro ao fazer login demo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-card-bg border border-gray-700 max-w-md w-full space-y-8 p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-purple-500">Entrar na sua conta</span>
          </h1>
          <p className="text-gray-300">
            Insira suas credenciais para acessar
          </p>
        </div>

        {isSimulatedMode && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-md flex items-start gap-3">
            <AlertTriangle className="mt-0.5 flex-shrink-0" size={18} />
            <div>
              <p className="font-medium">Modo Simulado Ativo</p>
              <p className="text-sm">O sistema está operando sem conexão com o banco de dados. Os dados são simulados e não serão salvos permanentemente.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-gray-400" size={20} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="bg-background border border-gray-700 rounded-lg block w-full pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="seu-email@exemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={20} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="bg-background border border-gray-700 rounded-lg block w-full pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Sua senha"
                  value={formData.password}
                  onChange={handleChange}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-300 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded bg-gray-800"
                  checked={formData.remember}
                  onChange={handleChange}
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-300">
                  Lembrar de mim
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/recover" className="text-purple-500 hover:text-purple-400">
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Entrando...
                  </div>
                ) : (
                  'Entrar'
                )}
              </button>
            </div>
            
            {/* Botão de login demo */}
            <div>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full flex justify-center py-2 px-4 border border-purple-500/30 rounded-lg shadow-sm text-purple-400 bg-transparent hover:bg-purple-500/10 focus:outline-none"
              >
                Login de demonstração
              </button>
            </div>
          </div>

          <div className="text-center text-sm text-gray-300 mt-4">
            Ainda não tem uma conta?{' '}
            <Link href="/auth/register" className="font-medium text-purple-500 hover:text-purple-400">
              Criar conta
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 