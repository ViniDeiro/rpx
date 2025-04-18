'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileComments, ProfileComment } from '@/hooks/useProfileComments';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreHorizontal, Trash2, AlertTriangle, Eye, EyeOff, MessageCircle } from 'react-feather';
import Image from 'next/image';

interface ProfileCommentsProps {
  userId: string;
  isOwnProfile: boolean;
}

const ProfileComments: React.FC<ProfileCommentsProps> = ({ userId, isOwnProfile }) => {
  const { user, isAuthenticated } = useAuth();
  const { 
    comments, 
    loading, 
    error, 
    submitting, 
    addComment, 
    deleteComment, 
    hideComment 
  } = useProfileComments(userId);
  
  const [commentText, setCommentText] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Fechar menu quando clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) return;
    
    const result = await addComment(commentText);
    if (result) {
      setCommentText('');
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      });
    } catch (error) {
      return 'Data desconhecida';
    }
  };
  
  const canModerate = (comment: ProfileComment) => {
    if (!user) return false;
    
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';
    const isProfileOwner = userId === user.id;
    
    return isAdmin || isProfileOwner;
  };
  
  const canDelete = (comment: ProfileComment) => {
    if (!user) return false;
    
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';
    const isProfileOwner = userId === user.id;
    const isCommentAuthor = comment.authorId === user.id;
    
    return isAdmin || isProfileOwner || isCommentAuthor;
  };
  
  return (
    <div className="bg-[#171335] rounded-xl shadow-xl border border-[#3D2A85]/20 overflow-hidden mt-6">
      <div className="p-6 border-b border-[#3D2A85]/20">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageCircle size={20} className="text-primary" />
          Comentários
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {isOwnProfile 
            ? 'Comentários deixados no seu perfil' 
            : 'Deixe um comentário neste perfil'}
        </p>
      </div>
      
      {/* Formulário para adicionar comentário */}
      {isAuthenticated && (
        <div className="p-6 border-b border-[#3D2A85]/20">
          <form onSubmit={handleSubmit}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escreva um comentário..."
              className="w-full bg-[#232048] border border-[#3D2A85]/50 rounded-lg px-4 py-3 text-white placeholder-[#A89ECC]/50 min-h-[100px] resize-y"
              maxLength={500}
              disabled={submitting}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-400">
                {commentText.length}/500 caracteres
              </span>
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="px-4 py-2 rounded-lg text-white bg-primary hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Comentar'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Mensagem para usuários não autenticados */}
      {!isAuthenticated && (
        <div className="p-6 border-b border-[#3D2A85]/20 bg-[#231f45]/50 text-center">
          <p className="text-gray-400">
            Faça login para deixar um comentário
          </p>
        </div>
      )}
      
      {/* Lista de comentários */}
      <div className="divide-y divide-[#3D2A85]/20">
        {loading ? (
          <div className="p-6 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-400">Carregando comentários...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center flex items-center justify-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            <p className="text-red-400">{error}</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-400">Nenhum comentário ainda</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div 
              key={comment._id} 
              className={`p-6 relative ${comment.isHidden ? 'opacity-50' : ''}`}
            >
              <div className="flex gap-4">
                {/* Avatar do autor */}
                <div className="flex-shrink-0">
                  {comment.authorAvatar ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#3D2A85] flex items-center justify-center text-white">
                      {comment.authorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                {/* Conteúdo */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{comment.authorName}</div>
                      <div className="text-xs text-gray-400">
                        {formatDate(comment.createdAt)}
                        {comment.isHidden && ' • Ocultado'}
                      </div>
                    </div>
                    
                    {/* Menu de ações */}
                    {(canDelete(comment) || canModerate(comment)) && (
                      <div className="relative" ref={menuRef}>
                        <button
                          onClick={() => setActiveMenu(activeMenu === comment._id ? null : comment._id)}
                          className="text-gray-400 hover:text-white p-1"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        
                        {activeMenu === comment._id && (
                          <div className="absolute right-0 top-8 z-10 bg-[#232048] border border-[#3D2A85]/50 rounded-lg shadow-lg overflow-hidden w-40">
                            {canDelete(comment) && (
                              <button
                                onClick={() => {
                                  deleteComment(comment._id);
                                  setActiveMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-[#3D2A85]/30 flex items-center gap-2"
                              >
                                <Trash2 size={14} />
                                Excluir
                              </button>
                            )}
                            
                            {canModerate(comment) && (
                              <button
                                onClick={() => {
                                  hideComment(comment._id, !comment.isHidden);
                                  setActiveMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-[#3D2A85]/30 flex items-center gap-2"
                              >
                                {comment.isHidden ? (
                                  <>
                                    <Eye size={14} />
                                    Mostrar
                                  </>
                                ) : (
                                  <>
                                    <EyeOff size={14} />
                                    Ocultar
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-white/90 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProfileComments; 