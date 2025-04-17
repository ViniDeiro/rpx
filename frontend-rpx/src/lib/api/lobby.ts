import axios from 'axios';

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  [key: string]: any;
}

/**
 * Aceita um convite de lobby
 * @param inviteId ID do convite a ser aceito
 * @returns Resposta com status do aceite
 */
export async function acceptLobbyInvite(inviteId: string): Promise<ApiResponse> {
  try {
    const response = await axios.post('/api/lobby/invite/accept', {
      inviteId,
    });
    
    // Adapta o formato de resposta para um padrão consistente
    return {
      success: response.data.status === 'success',
      message: response.data.message || response.data.error,
      data: response.data,
      lobbyId: response.data.lobbyId,
    };
  } catch (error: any) {
    console.error('Erro ao aceitar convite de lobby:', error);
    return {
      success: false,
      message: error.response?.data?.error || 'Falha ao aceitar o convite',
    };
  }
}

/**
 * Rejeita um convite de lobby
 * @param inviteId ID do convite a ser rejeitado
 * @returns Resposta com status da rejeição
 */
export async function rejectLobbyInvite(inviteId: string): Promise<ApiResponse> {
  try {
    const response = await axios.post('/api/lobby/invite/reject', {
      inviteId,
    });
    
    // Adapta o formato de resposta para um padrão consistente
    return {
      success: response.data.status === 'success',
      message: response.data.message || response.data.error,
      data: response.data,
    };
  } catch (error: any) {
    console.error('Erro ao rejeitar convite de lobby:', error);
    return {
      success: false,
      message: error.response?.data?.error || 'Falha ao rejeitar o convite',
    };
  }
}

/**
 * Cria um novo lobby
 * @param lobbyData Dados do novo lobby
 * @returns Resposta com o ID do lobby criado
 */
export async function createLobby(lobbyData: any): Promise<ApiResponse> {
  try {
    const response = await axios.post('/api/lobby', lobbyData);
    
    return {
      success: response.data.status === 'success',
      message: response.data.message,
      data: response.data,
      lobbyId: response.data.lobbyId,
    };
  } catch (error: any) {
    console.error('Erro ao criar lobby:', error);
    return {
      success: false,
      message: error.response?.data?.error || 'Falha ao criar o lobby',
    };
  }
}

/**
 * Envia um convite de lobby para um amigo
 * @param lobbyId ID do lobby
 * @param friendId ID do amigo a ser convidado
 * @returns Resposta com status do envio
 */
export async function sendLobbyInvite(lobbyId: string, friendId: string): Promise<ApiResponse> {
  try {
    const response = await axios.post('/api/lobby/invite/send', {
      lobbyId,
      friendId,
    });
    
    return {
      success: response.data.status === 'success',
      message: response.data.message || response.data.error,
      data: response.data,
    };
  } catch (error: any) {
    console.error('Erro ao enviar convite de lobby:', error);
    return {
      success: false,
      message: error.response?.data?.error || 'Falha ao enviar o convite',
    };
  }
}

/**
 * Busca os detalhes de um lobby específico
 * @param lobbyId ID do lobby
 * @returns Dados do lobby
 */
export async function getLobbyDetails(lobbyId: string): Promise<ApiResponse> {
  try {
    const response = await axios.get(`/api/lobby/${lobbyId}`);
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('Erro ao buscar detalhes do lobby:', error);
    return {
      success: false,
      message: error.response?.data?.error || 'Falha ao buscar detalhes do lobby',
    };
  }
} 