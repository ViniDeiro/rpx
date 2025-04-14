import { useState } from 'react';
import Image from 'next/image';
import { Edit, User } from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';
import FileUploadAvatar from './FileUploadAvatar';
import { RankTier, RANK_FRAMES } from '@/utils/ranking';

interface ProfileAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  showEditButton?: boolean;
  rankTier?: RankTier; // Tier do rank do usuário
}

export default function ProfileAvatar({ 
  size = 'md', 
  showEditButton = true, 
  rankTier 
}: ProfileAvatarProps) {
  const { user, updateUserAvatar } = useAuth();
  const [showUploader, setShowUploader] = useState(false);
  
  // Classes baseadas no tamanho
  const sizeClasses = {
    sm: {
      container: 'w-16 h-16',
      border: 'border-4',
      editButton: 'w-6 h-6'
    },
    md: {
      container: 'w-24 h-24 -mt-12',
      border: 'border-4',
      editButton: 'w-8 h-8'
    },
    lg: {
      container: 'w-32 h-32 -mt-16',
      border: 'border-6',
      editButton: 'w-10 h-10'
    }
  }[size];
  
  // Funções para a moldura de rank
  const getRankColors = (tier?: RankTier) => {
    if (!tier) return { stroke: '#B45309', fill: '#D97706', highlight: '#F59E0B' };
    
    switch(tier) {
      case 'bronze': return { stroke: '#B45309', fill: '#D97706', highlight: '#F59E0B' };
      case 'prata': return { stroke: '#6B7280', fill: '#9CA3AF', highlight: '#D1D5DB' };
      case 'ouro': return { stroke: '#D97706', fill: '#F59E0B', highlight: '#FBBF24' };
      case 'platina': return { stroke: '#0D9488', fill: '#14B8A6', highlight: '#2DD4BF' };
      case 'diamante': return { stroke: '#3B82F6', fill: '#60A5FA', highlight: '#93C5FD' };
      case 'mestre': return { stroke: '#7E22CE', fill: '#A855F7', highlight: '#C084FC' };
      case 'challenger': return { stroke: '#C026D3', fill: '#E879F9', highlight: '#F0ABFC' };
      default: return { stroke: '#B45309', fill: '#D97706', highlight: '#F59E0B' };
    }
  };
  
  // Verificar se é um tier de alta classificação
  const isHighTier = rankTier ? ['diamante', 'mestre', 'challenger'].includes(rankTier) : false;
  const colors = getRankColors(rankTier);
  
  // Renderizar gemas para tiers superiores
  const renderGems = () => {
    if (!isHighTier) return null;
    
    return (
      <>
        {/* Gemas nos pontos norte, sul, leste, oeste */}
        <circle cx="110" cy="20" r="6" fill={colors.highlight} />
        <circle cx="110" cy="200" r="6" fill={colors.highlight} />
        <circle cx="20" cy="110" r="6" fill={colors.highlight} />
        <circle cx="200" cy="110" r="6" fill={colors.highlight} />
        
        {/* Para challenger, adicionar gemas extras */}
        {rankTier === 'challenger' && (
          <>
            <circle cx="50" cy="50" r="5" fill={colors.highlight} />
            <circle cx="170" cy="50" r="5" fill={colors.highlight} />
            <circle cx="50" cy="170" r="5" fill={colors.highlight} />
            <circle cx="170" cy="170" r="5" fill={colors.highlight} />
          </>
        )}
      </>
    );
  };

  // Manipulador de upload de imagem
  const handleFileSelected = async (file: File) => {
    try {
      await updateUserAvatar(file);
      setShowUploader(false);
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
    }
  };
  
  return (
    <div className="relative">
      {/* Avatar */}
      <div className={`${sizeClasses.container} relative rounded-full overflow-hidden ${sizeClasses.border} border-gray-800 bg-gray-700 z-10`}>
        <Image
          src={user?.avatarUrl || '/images/avatar-placeholder.svg'}
          alt={user?.name || 'Usuário'}
          fill
          priority
          className="object-cover"
        />
      </div>
      
      {/* Moldura de rank (definição SVG direta) - apenas se rankTier for fornecido */}
      {rankTier && (
        <div className="absolute inset-[-12%] w-[124%] h-[124%] z-0">
          <svg width="100%" height="100%" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Círculo base */}
            <circle cx="110" cy="110" r="105" stroke={colors.stroke} strokeWidth={isHighTier ? 6 : 4} fill="none" />
            
            {/* Detalhes decorativos nos pontos cardeais */}
            <path d="M110 5 L120 15 L110 25 L100 15 Z" fill={colors.fill} />
            <path d="M110 215 L120 205 L110 195 L100 205 Z" fill={colors.fill} />
            <path d="M5 110 L15 120 L25 110 L15 100 Z" fill={colors.fill} />
            <path d="M215 110 L205 120 L195 110 L205 100 Z" fill={colors.fill} />
            
            {/* Arcos decorativos */}
            <path d="M40 40 A100 100 0 0 1 180 40" stroke={colors.fill} strokeWidth="3" fill="none" />
            <path d="M40 180 A100 100 0 0 0 180 180" stroke={colors.fill} strokeWidth="3" fill="none" />
            
            {/* Detalhes adicionais para tiers altos */}
            {renderGems()}
            
            {/* Detalhes especiais para diamante */}
            {rankTier === 'diamante' && (
              <>
                <line x1="30" y1="30" x2="45" y2="45" stroke={colors.highlight} strokeWidth="2" strokeLinecap="round" />
                <line x1="190" y1="30" x2="175" y2="45" stroke={colors.highlight} strokeWidth="2" strokeLinecap="round" />
                <line x1="30" y1="190" x2="45" y2="175" stroke={colors.highlight} strokeWidth="2" strokeLinecap="round" />
                <line x1="190" y1="190" x2="175" y2="175" stroke={colors.highlight} strokeWidth="2" strokeLinecap="round" />
              </>
            )}
            
            {/* Imagem do rank no topo da moldura */}
            <foreignObject x="85" y="-15" width="50" height="50">
              {rankTier && RANK_FRAMES[rankTier] && (
                <div className="w-full h-full flex items-center justify-center">
                  <img 
                    src={RANK_FRAMES[rankTier].image} 
                    alt={RANK_FRAMES[rankTier].name} 
                    className="w-8 h-8"
                  />
                </div>
              )}
            </foreignObject>
          </svg>
        </div>
      )}
      
      {/* Botão de upload */}
      {showEditButton && (
        <button
          onClick={() => setShowUploader(true)}
          className={`absolute bottom-0 right-0 z-20 ${sizeClasses.editButton} rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary-dark transition-colors`}
        >
          <Edit size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
        </button>
      )}
      
      {/* Modal de upload */}
      {showUploader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-card-bg rounded-xl w-full max-w-md p-6 animate-fade-in">
            <h2 className="text-xl font-bold mb-4">Atualizar foto de perfil</h2>
            <FileUploadAvatar 
              onFileSelected={handleFileSelected} 
              currentImageUrl={user?.avatarUrl}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowUploader(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 