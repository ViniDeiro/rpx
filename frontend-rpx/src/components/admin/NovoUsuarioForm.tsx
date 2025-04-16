'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, AlertCircle, CheckCircle } from 'react-feather';

export default function NovoUsuarioForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nome: '',
    password: '',
    confirmPassword: '',
    permissao: 'admin'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    // Validar formulário
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }
    
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }
    
    try {
      // Acessando localStorage de forma segura (apenas no cliente)
      let token;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('auth_token');
      }
      
      if (!token) {
        setError('Você precisa estar autenticado');
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('/api/admin/usuarios/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          nome: formData.nome,
          password: formData.password,
          permissao: formData.permissao
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar administrador');
      }
      
      const responseData = await response.json();
      setSuccess(`Administrador ${responseData.admin.username} criado com sucesso!`);
      
      // Limpar o formulário
      setFormData({
        username: '',
        email: '',
        nome: '',
        password: '',
        confirmPassword: '',
        permissao: 'admin'
      });
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/admin/usuarios');
      }, 2000);
      
    } catch (error: any) {
      setError(error.message || 'Ocorreu um erro ao criar o administrador');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <span>{success}</span>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  className="pl-10 block w-full shadow-sm border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Nome completo do administrador"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Nome de usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="pl-10 block w-full shadow-sm border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Nome de usuário"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="pl-10 block w-full shadow-sm border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="pl-10 block w-full shadow-sm border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Senha (mínimo 6 caracteres)"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="pl-10 block w-full shadow-sm border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Confirme a senha"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="permissao" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de permissão
              </label>
              <select
                id="permissao"
                name="permissao"
                value={formData.permissao}
                onChange={handleChange}
                className="block w-full shadow-sm border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="admin">Administrador</option>
                <option value="superadmin">Super Administrador</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Apenas super administradores podem criar outros super administradores.
              </p>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/admin/usuarios')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              disabled={isLoading}
            >
              {isLoading ? 'Criando...' : 'Criar Administrador'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
} 