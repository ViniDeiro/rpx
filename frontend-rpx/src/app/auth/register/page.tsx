'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, User, Calendar, Check, Phone, CreditCard } from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    password: '',
    confirmPassword: '',
    birthdate: '',
    terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Adicionar formatação especial para o campo de telefone
    if (name === 'phone') {
      // Remover tudo que não for dígito
      const digits = value.replace(/\D/g, '');
      
      // Aplicar máscara (99) 99999-9999
      let formattedPhone = '';
      if (digits.length <= 2) {
        formattedPhone = digits.length ? `(${digits}` : '';
      } else if (digits.length <= 7) {
        formattedPhone = `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
      } else {
        formattedPhone = `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7, 11)}`;
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedPhone
      }));
    } 
    // Adicionar formatação especial para o campo de CPF
    else if (name === 'cpf') {
      // Remover tudo que não for dígito
      const digits = value.replace(/\D/g, '');
      
      // Aplicar máscara 999.999.999-99
      let formattedCPF = '';
      if (digits.length <= 3) {
        formattedCPF = digits;
      } else if (digits.length <= 6) {
        formattedCPF = `${digits.substring(0, 3)}.${digits.substring(3)}`;
      } else if (digits.length <= 9) {
        formattedCPF = `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6)}`;
      } else {
        formattedCPF = `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9, 11)}`;
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedCPF
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.cpf || !formData.password || !formData.confirmPassword || !formData.birthdate) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return false;
    }

    if (!formData.terms) {
      setError('Você precisa aceitar os termos de uso.');
      return false;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor, forneça um endereço de email válido.');
      return false;
    }

    // Validação básica de telefone (mínimo 10 dígitos)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setError('Por favor, forneça um número de telefone válido com DDD.');
      return false;
    }

    // Validação básica de CPF (exatamente 11 dígitos)
    const cpfDigits = formData.cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      setError('Por favor, forneça um CPF válido com 11 dígitos.');
      return false;
    }

    // Validação básica de senha (mínimo 8 caracteres)
    if (formData.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await register(formData);
      router.push('/');
    } catch (err: any) {
      console.error('Erro no registro:', err);
      setError(err.message || 'Ocorreu um erro durante o registro. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-card-bg border border-gray-700 max-w-md w-full space-y-8 p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-purple-500">Crie sua conta</span>
          </h1>
          <p className="text-gray-300">
            Junte-se a milhares de jogadores
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Nome completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="text-gray-400" size={20} />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="bg-background border border-gray-700 rounded-lg block w-full pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

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
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                Telefone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="text-gray-400" size={20} />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  className="bg-background border border-gray-700 rounded-lg block w-full pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="(99) 99999-9999"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-300 mb-1">
                CPF
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="text-gray-400" size={20} />
                </div>
                <input
                  id="cpf"
                  name="cpf"
                  type="text"
                  autoComplete="off"
                  required
                  className="bg-background border border-gray-700 rounded-lg block w-full pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="999.999.999-99"
                  value={formData.cpf}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="birthdate" className="block text-sm font-medium text-gray-300 mb-1">
                Data de nascimento
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="text-gray-400" size={20} />
                </div>
                <input
                  id="birthdate"
                  name="birthdate"
                  type="date"
                  required
                  className="bg-background border border-gray-700 rounded-lg block w-full pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  value={formData.birthdate}
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
                  autoComplete="new-password"
                  required
                  className="bg-background border border-gray-700 rounded-lg block w-full pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Min. 8 caracteres"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Confirmar senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={20} />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="bg-background border border-gray-700 rounded-lg block w-full pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Confirme sua senha"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-300 focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center mt-4">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded bg-gray-800"
                checked={formData.terms}
                onChange={handleChange}
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
                Eu aceito os{' '}
                <Link href="/terms" className="text-purple-500 hover:text-purple-400">
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link href="/privacy" className="text-purple-500 hover:text-purple-400">
                  Política de Privacidade
                </Link>
              </label>
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
                    Criando conta...
                  </div>
                ) : (
                  'Criar conta'
                )}
              </button>
            </div>
          </div>

          <div className="text-center text-sm text-gray-300 mt-4">
            Já tem uma conta?{' '}
            <Link href="/auth/login" className="font-medium text-purple-500 hover:text-purple-400">
              Fazer login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 