import { useState, useEffect, useCallback } from 'react';

export interface ProfileComment {
  _id: string;
  userId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isHidden?: boolean;
}

export function useProfileComments(userId: string) {
  const [comments, setComments] = useState<ProfileComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/users/${userId}/comments`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar comentários');
      }
      
      const data = await response.json();
      setComments(data.comments);
    } catch (error: any) {
      console.error('Erro ao carregar comentários:', error);
      setError(error.message || 'Erro ao carregar comentários');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (content: string) => {
    if (!userId || !content.trim()) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Você precisa estar autenticado para comentar');
      }
      
      const response = await fetch(`/api/users/${userId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar comentário');
      }
      
      const data = await response.json();
      setComments(prevComments => [data.comment, ...prevComments]);
      
      return data.comment;
    } catch (error: any) {
      console.error('Erro ao adicionar comentário:', error);
      setError(error.message || 'Erro ao adicionar comentário');
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!userId || !commentId) return;
    
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Você precisa estar autenticado para excluir comentários');
      }
      
      const response = await fetch(`/api/users/${userId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir comentário');
      }
      
      setComments(prevComments => prevComments.filter(comment => comment._id !== commentId));
      
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir comentário:', error);
      setError(error.message || 'Erro ao excluir comentário');
      return false;
    }
  };

  const hideComment = async (commentId: string, hide: boolean) => {
    if (!userId || !commentId) return;
    
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Você precisa estar autenticado para moderar comentários');
      }
      
      const response = await fetch(`/api/users/${userId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isHidden: hide }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao moderar comentário');
      }
      
      setComments(prevComments =>
        prevComments.map(comment =>
          comment._id === commentId ? { ...comment, isHidden: hide } : comment
        )
      );
      
      return true;
    } catch (error: any) {
      console.error('Erro ao moderar comentário:', error);
      setError(error.message || 'Erro ao moderar comentário');
      return false;
    }
  };

  return {
    comments,
    loading,
    error,
    submitting,
    fetchComments,
    addComment,
    deleteComment,
    hideComment,
  };
} 