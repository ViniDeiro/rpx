import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth/jwt';
import { BANNERS, AVATARS, isItemUnlocked } from '@/data/customization';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar método HTTP
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Não autorizado' });
    }

    const userData = verifyToken(token);
    if (!userData) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Extrair dados da requisição
    const { type, itemId } = req.body;

    // Validar entrada
    if (!type || !itemId || !['avatar', 'banner'].includes(type)) {
      return res.status(400).json({ message: 'Dados inválidos' });
    }

    // Verificar se o item existe
    const items = type === 'avatar' ? AVATARS : BANNERS;
    const item = items.find(i => i.id === itemId);
    
    if (!item) {
      return res.status(404).json({ message: `${type === 'avatar' ? 'Avatar' : 'Banner'} não encontrado` });
    }

    // Verificar se o usuário pode usar este item
    const canUse = isItemUnlocked(
      item,
      userData.level || 1,
      userData.achievements || [],
      userData.purchases || []
    );

    if (!canUse) {
      return res.status(403).json({ message: `Este ${type} está bloqueado para você` });
    }

    // No modo simulado, a atualização é feita no frontend
    // Aqui simulamos o que seria feito no backend
    const updatedUser = {
      ...userData,
      ...(type === 'avatar' ? { avatarId: itemId } : { bannerId: itemId })
    };

    // Retornar usuário atualizado
    return res.status(200).json({
      message: `${type === 'avatar' ? 'Avatar' : 'Banner'} atualizado com sucesso`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar customização:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
} 