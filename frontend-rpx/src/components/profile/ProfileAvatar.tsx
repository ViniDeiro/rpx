import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { RankTier } from '@/utils/ranking';

interface ProfileAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  rankTier?: RankTier;
  frameUrl?: string;
  showRankFrame?: boolean;
  avatarUrl?: string;
}

export default function ProfileAvatar({ 
  size = 'md',
  rankTier = 'platinum',
  frameUrl,
  showRankFrame = true,
  avatarUrl
}: ProfileAvatarProps) {
  const { user } = useAuth();
  
  // Determinar a URL da moldura - mostrar apenas se tiver um rank explícito
  let finalFrameUrl = frameUrl;
  
  if (!frameUrl && showRankFrame) {
    // Forçar platinum para demonstração
    const frameFileName = 'platinum';
    const rankFrameUrl = `/images/frames/${frameFileName}.png`;
    console.log('Usando moldura de rank:', rankFrameUrl);
    finalFrameUrl = rankFrameUrl;
  }
  
  // Definir tamanhos com base no parâmetro size
  const sizeConfig = {
    sm: { avatar: 64, frame: 90 },
    md: { avatar: 96, frame: 135 },
    lg: { avatar: 128, frame: 180 }
  }[size];
  
  // Ajustar tamanho da moldura
  let frameSize = sizeConfig.frame;
  let yOffset = -50; // Default -50%
  
  // Determinar a URL do avatar a ser usada
  const finalAvatarUrl = avatarUrl || user?.avatarUrl || '/images/avatar-placeholder.svg';
  
  return (
    <div style={{ 
      position: 'relative', 
      width: sizeConfig.avatar, 
      height: sizeConfig.avatar
    }}>
      {/* MOLDURA - renderizada PRIMEIRO mas com z-index MAIOR */}
      {finalFrameUrl && (
        <div style={{ 
          position: 'absolute',
          top: '50%', 
          left: '50%',
          transform: `translate(-50%, ${yOffset}%)`,
          width: frameSize,
          height: frameSize,
          zIndex: 20,
          pointerEvents: 'none'
        }}>
          <Image 
            src={finalFrameUrl}
            alt={`Moldura de perfil ${rankTier}`}
            fill
            priority
            className="object-contain"
          />
        </div>
      )}
      
      {/* AVATAR - renderizado DEPOIS mas com z-index MENOR */}
      <div style={{ 
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        overflow: 'hidden',
        backgroundColor: '#374151',
        border: !finalFrameUrl ? '4px solid #1F2937' : 'none',
        zIndex: 10
      }}>
        <Image
          src={finalAvatarUrl}
          alt={user?.name || 'Usuário'}
          fill
          priority
          className="object-cover"
        />
      </div>
    </div>
  );
} 