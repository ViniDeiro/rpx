import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      // Mostrar feedback visual
      document.body.style.cursor = 'wait';
      
      // Fazer chamada à API de logout
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Falha ao desconectar');
      }
      
      // Limpar qualquer dado local
      if (typeof window !== 'undefined') {
        // Limpar localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('rpx-admin-auth');
        
        // Limpar sessionStorage
        sessionStorage.clear();
        
        // Forçar limpeza de cookies via JavaScript como backup
        document.cookie.split(';').forEach(c => {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });
      }
      
      // Aviso e redirecionamento
      alert('Você foi desconectado com sucesso!');
      
      // Redirecionar para a página de login
      window.location.href = '/admin/login'; // Usar window.location para recarregar completamente
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      alert('Erro ao desconectar. Tente novamente.');
    } finally {
      document.body.style.cursor = 'default';
    }
  };
  
  return (
    <button
      onClick={handleLogout}
      className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
    >
      <LogOut className="w-5 h-5 mr-3 text-gray-500" />
      <span>Sair</span>
    </button>
  );
} 