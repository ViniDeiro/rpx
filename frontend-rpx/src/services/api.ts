import axios from 'axios';

// Criar uma instância do axios com configuração para incluir cookies
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptador para adicionar o token de autenticação do localStorage
api.interceptors.request.use(
  (config) => {
    // Verificar se estamos no navegador (client-side)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador para tratamento global de erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Verificar se o erro é de autenticação (401)
    if (error.response && error.response.status === 401) {
      // Se estamos no navegador, podemos redirecionar para a página de login
      if (typeof window !== 'undefined') {
        // Limpar o token do localStorage
        localStorage.removeItem('token');
        
        // Verificar se já não estamos na página de login
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 