'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, ArrowLeft, Check, X, Save, AlertTriangle, Edit, Eye, EyeOff } from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileSettings() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    phone: '',
    birthdate: '',
    cpf: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [changePassword, setChangePassword] = useState(false);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setRedirecting(true);
      // Aguardar 1 segundo antes de redirecionar
      const timer = setTimeout(() => {
        router.push('/auth/login');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, router]);

  // Preencher o formulário com os dados do usuário quando disponíveis
  useEffect(() => {
    if (user) {
      console.log('Dados completos do usuário:', JSON.stringify(user, null, 2));
      
      setFormData({
        username: user.username || '',
        email: user.email || '',
        name: user.profile?.name || user.name || '',
        phone: user.phone || '',
        birthdate: user.birthdate ? new Date(user.birthdate).toISOString().split('T')[0] : '',
        cpf: user.cpf || '',
        password: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      console.log('Dados do usuário carregados para o formulário:', {
        username: user.username,
        email: user.email,
        name: user.profile?.name || user.name,
        phone: user.phone,
        birthdate: user.birthdate,
        cpf: user.cpf
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditing) {
      setIsEditing(true);
      return;
    }
    
    // Limpar mensagens anteriores
    setMessage({ type: '', text: '' });
    
    try {
      setIsSubmitting(true);
      
      // Se estiver alterando senha
      if (changePassword) {
        if (!formData.password) {
          setMessage({ type: 'error', text: 'A senha atual é obrigatória para atualizar a senha' });
          setIsSubmitting(false);
          return;
        }
        
        if (formData.newPassword !== formData.confirmPassword) {
          setMessage({ type: 'error', text: 'A nova senha e a confirmação não correspondem' });
          setIsSubmitting(false);
          return;
        }
        
        if (formData.newPassword && formData.newPassword.length < 8) {
          setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 8 caracteres' });
          setIsSubmitting(false);
          return;
        }
        
        try {
          // Obter token de autenticação
          const token = localStorage.getItem('auth_token');
          if (!token) {
            throw new Error('Não há token de autenticação. Faça login novamente.');
          }
          
          console.log('Enviando solicitação de alteração de senha...');
          
          // Chamada direta para o endpoint de alteração de senha
          const response = await fetch('/api/users/password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ 
              currentPassword: formData.password,
              newPassword: formData.newPassword
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao atualizar senha');
          }
          
          const data = await response.json();
          console.log('Resposta da alteração de senha:', data);
          
          setMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
          
          // Limpar campos de senha
          setFormData(prev => ({
            ...prev,
            password: '',
            newPassword: '',
            confirmPassword: ''
          }));
          
          // Desativar edição e alteração de senha
          setIsEditing(false);
          setChangePassword(false);
        } catch (error: any) {
          console.error('Erro ao alterar senha:', error);
          setMessage({ type: 'error', text: error.message || 'Erro ao alterar senha. Tente novamente.' });
          return;
        } finally {
          setIsSubmitting(false);
        }
      } else {
        // Atualização de dados de perfil (sem senha)
        const updatedUserData: any = {
          username: formData.username,
          email: formData.email,
          profile: {
            name: formData.name,
          },
          phone: formData.phone,
          cpf: formData.cpf,
          birthdate: formData.birthdate || undefined,
        };
        
        await updateUser(updatedUserData);
        
        setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
        setIsEditing(false);
        
        // Limpar a mensagem após 3 segundos
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar dados:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao atualizar dados. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função de debug - remover em produção
  const debugUser = () => {
    if (user) {
      console.log('Dados completos do usuário:', JSON.stringify(user, null, 2));
      alert('Dados do usuário exibidos no console');
    } else {
      console.log('Usuário não encontrado ou não autenticado');
      alert('Usuário não encontrado');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0D0A2A] to-[#120821] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0D0A2A] to-[#120821] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <Lock size={48} className="text-primary/80 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">Acesso Restrito</h2>
          <p className="text-white/70 mb-4">Você precisa estar logado para acessar esta página. Redirecionando para o login...</p>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A2A] text-white pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center mb-6">
          <Link 
            href="/profile" 
            className="mr-4 p-2 rounded-full hover:bg-[#232048] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Configurações</h1>
          
          {/* Botão de debug - remover em produção */}
          <button 
            type="button" 
            onClick={debugUser}
            className="ml-auto px-3 py-1 text-xs bg-gray-700 rounded-md hover:bg-gray-600"
          >
            Debug
          </button>
        </div>

        {message.text && (
          <div className={`
            mb-6 p-4 rounded-lg flex items-center gap-3
            ${message.type === 'success' ? 'bg-green-900/30 border border-green-700' : ''}
            ${message.type === 'error' ? 'bg-red-900/30 border border-red-700' : ''}
          `}>
            {message.type === 'success' && <Check size={20} className="text-green-500" />}
            {message.type === 'error' && <AlertTriangle size={20} className="text-red-500" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Card principal */}
        <div className="bg-[#171335] rounded-xl shadow-xl border border-[#3D2A85]/20 overflow-hidden">
          <div className="p-6 border-b border-[#3D2A85]/20">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <User size={20} className="text-primary" />
              Dados da Conta
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Gerencie as informações da sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome de usuário */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium mb-2">
                    Nome de usuário
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-[#232048] border border-[#3D2A85]/50 rounded-lg px-4 py-2.5 text-white placeholder-[#A89ECC]/50 disabled:opacity-70"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-[#232048] border border-[#3D2A85]/50 rounded-lg px-4 py-2.5 text-white placeholder-[#A89ECC]/50 disabled:opacity-70"
                  />
                </div>

                {/* Nome completo */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-[#232048] border border-[#3D2A85]/50 rounded-lg px-4 py-2.5 text-white placeholder-[#A89ECC]/50 disabled:opacity-70"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-[#232048] border border-[#3D2A85]/50 rounded-lg px-4 py-2.5 text-white placeholder-[#A89ECC]/50 disabled:opacity-70"
                  />
                </div>

                {/* Data de nascimento */}
                <div>
                  <label htmlFor="birthdate" className="block text-sm font-medium mb-2">
                    Data de nascimento
                  </label>
                  <input
                    type="date"
                    id="birthdate"
                    name="birthdate"
                    value={formData.birthdate}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-[#232048] border border-[#3D2A85]/50 rounded-lg px-4 py-2.5 text-white placeholder-[#A89ECC]/50 disabled:opacity-70"
                  />
                </div>

                {/* CPF */}
                <div>
                  <label htmlFor="cpf" className="block text-sm font-medium mb-2">
                    CPF
                  </label>
                  <input
                    type="text"
                    id="cpf"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full bg-[#232048] border border-[#3D2A85]/50 rounded-lg px-4 py-2.5 text-white placeholder-[#A89ECC]/50 disabled:opacity-70"
                  />
                </div>
              </div>

              {/* Opção de alterar senha */}
              {isEditing && (
                <div className="pt-4 border-t border-[#3D2A85]/20">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="change-password"
                      checked={changePassword}
                      onChange={() => setChangePassword(!changePassword)}
                      className="mr-2 h-4 w-4 accent-primary rounded"
                    />
                    <label htmlFor="change-password" className="text-sm cursor-pointer">
                      Alterar senha
                    </label>
                  </div>

                  {changePassword && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      {/* Senha atual */}
                      <div className="md:col-span-2">
                        <label htmlFor="password" className="block text-sm font-medium mb-2">
                          Senha atual
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-[#232048] border border-[#3D2A85]/50 rounded-lg px-4 py-2.5 text-white pr-10"
                          />
                          <button 
                            type="button" 
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Nova senha */}
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                          Nova senha
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          className="w-full bg-[#232048] border border-[#3D2A85]/50 rounded-lg px-4 py-2.5 text-white"
                        />
                      </div>

                      {/* Confirmar nova senha */}
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                          Confirmar nova senha
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="w-full bg-[#232048] border border-[#3D2A85]/50 rounded-lg px-4 py-2.5 text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-[#3D2A85]/20 flex justify-end">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setChangePassword(false);
                      // Restaurar dados originais
                      if (user) {
                        setFormData({
                          username: user.username || '',
                          email: user.email || '',
                          name: user.profile?.name || user.name || '',
                          phone: user.phone || '',
                          birthdate: user.birthdate ? new Date(user.birthdate).toISOString().split('T')[0] : '',
                          cpf: user.cpf || '',
                          password: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                      }
                    }}
                    className="mr-3 px-4 py-2 rounded-lg text-white bg-[#232048] hover:bg-[#2c2957] transition-colors flex items-center gap-2"
                  >
                    <X size={16} />
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-white bg-primary hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processando...
                    </>
                  ) : isEditing ? (
                    <>
                      <Save size={16} />
                      Salvar alterações
                    </>
                  ) : (
                    <>
                      <Edit size={16} />
                      Editar informações
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Card de Segurança */}
        <div className="bg-[#171335] rounded-xl shadow-xl border border-[#3D2A85]/20 overflow-hidden mt-6">
          <div className="p-6 border-b border-[#3D2A85]/20">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Lock size={20} className="text-primary" />
              Segurança
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Ajustes de segurança da sua conta
            </p>
          </div>

          <div className="p-6">
            <Link 
              href="/profile/settings/password" 
              className="block w-full text-left bg-[#232048] hover:bg-[#2c2957] transition-colors p-4 rounded-lg flex items-center justify-between"
            >
              <div>
                <h3 className="font-medium">Alterar senha</h3>
                <p className="text-sm text-gray-400">Atualize sua senha de acesso</p>
              </div>
              <ArrowLeft size={18} className="transform rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 