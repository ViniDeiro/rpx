import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { RankTier } from '@/utils/ranking';

// Mapeamento fixo de usuários para ranks - alinhado com profile/[username]/page.tsx
const USER_RANKS: Record<string, {tier: RankTier, name: string, points: number, nextRank: string}> = {
  'joao': {
    tier: 'bronze',
    name: 'Bronze',
    points: 150,
    nextRank: 'Silver'
  },
  'julia': {
    tier: 'silver',
    name: 'Silver',
    points: 350,
    nextRank: 'Gold'
  },
  'bianca': {
    tier: 'gold',
    name: 'Gold',
    points: 750,
    nextRank: 'Platinum'
  },
  'yuri': {
    tier: 'platinum',
    name: 'Platinum',
    points: 950,
    nextRank: 'Diamond'
  },
  'dacruz': {
    tier: 'diamond',
    name: 'Diamond',
    points: 1350,
    nextRank: 'Legend'
  },
  'vini': {
    tier: 'legend',
    name: 'Legend',
    points: 1600,
    nextRank: 'Challenger'
  },
  'ygorx': {
    tier: 'challenger',
    name: 'Challenger',
    points: 2100,
    nextRank: 'Top 10'
  },
  'luiz': {
    tier: 'unranked',
    name: 'Unranked',
    points: 0,
    nextRank: 'Bronze'
  }
};

interface ProfileAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  rankTier?: RankTier;
  frameUrl?: string;
  showRankFrame?: boolean;
  avatarUrl?: string;
  username?: string; // Adicionando username como prop
}

export default function ProfileAvatar({ 
  size = 'md',
  rankTier,
  frameUrl,
  showRankFrame = true,
  avatarUrl,
  username
}: ProfileAvatarProps) {
  const { user } = useAuth();
  
  // Primeiro verificar se este é um dos usuários fixos
  const currentUsername = username || user?.username;
  
  console.log('ProfileAvatar - Props recebidas:', { 
    username, 
    currentUsername, 
    rankTier, 
    frameUrl, 
    showRankFrame 
  });
  
  // IMPORTANTE - NOVA LÓGICA: Verificar primeiro e prioritariamente se o usuário está no USER_RANKS
  let effectiveRankTier: RankTier = 'unranked';
  
  // PRIORIDADE ABSOLUTA: USER_RANKS para usuários fixos conhecidos
  if (currentUsername && USER_RANKS[currentUsername]) {
    effectiveRankTier = USER_RANKS[currentUsername].tier;
    console.log(`PRIORIDADE ABSOLUTA: Usando USER_RANKS para ${currentUsername}: ${effectiveRankTier}`);
  } 
  // Somente se não for um usuário fixo, considerar outras opções
  else if (rankTier) {
    effectiveRankTier = rankTier;
    console.log(`Usando rankTier passado como prop: ${effectiveRankTier}`);
  } 
  else if (user?.rank?.tier) {
    effectiveRankTier = user.rank.tier as RankTier;
    console.log(`Usando rank do usuário atual: ${effectiveRankTier}`);
  } 
  else {
    console.log('Fallback para unranked');
  }
  
  // Determinar a URL da moldura
  let finalFrameUrl = frameUrl;
  
  if (!frameUrl && showRankFrame && effectiveRankTier !== 'unranked') {
    const rankFrameUrl = `/images/frames/${effectiveRankTier}.png`;
    console.log('Usando moldura de rank:', rankFrameUrl, 'para tier:', effectiveRankTier);
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
            alt={`Moldura de perfil ${effectiveRankTier}`}
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