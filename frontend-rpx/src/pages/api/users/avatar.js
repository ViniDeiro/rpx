import { NextApiRequest, NextApiResponse } from 'next';
import { getBackendUrl } from '@/utils/apiConfig';

/**
 * Endpoint para upload de avatar
 * Recebe dados base64 da imagem e os encaminha para o backend
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados da imagem não fornecidos' 
      });
    }
    
    // Obter token de autenticação do cabeçalho
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }
    
    // Enviar para o backend
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/users/avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({ imageData }),
    });
    
    const data = await response.json();
    
    // Retornar a resposta do backend
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Erro ao processar o upload do avatar:', error);
    return res.status(500).json({
      success: false,
      message: 'Ocorreu um erro ao processar o upload. Tente novamente mais tarde.'
    });
  }
} 