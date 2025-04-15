import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { RankTier } from '@/utils/ranking';

interface ProfileAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  rankTier?: RankTier; // Mantido apenas para compatibilidade, não será usado
}

export default function ProfileAvatar({ 
  size = 'md'
}: ProfileAvatarProps) {
  const { user } = useAuth();
  
  // Classes baseadas no tamanho
  const sizeClasses = {
    sm: {
      container: 'w-16 h-16',
      border: 'border-4'
    },
    md: {
      container: 'w-24 h-24',
      border: 'border-4'
    },
    lg: {
      container: 'w-32 h-32',
      border: 'border-6'
    }
  }[size];
  
  return (
    <div className={`${sizeClasses.container} relative rounded-full overflow-hidden ${sizeClasses.border} border-gray-800 bg-gray-700`}>
      <Image
        src={user?.avatarUrl || '/images/avatar-placeholder.svg'}
        alt={user?.name || 'Usuário'}
        fill
        priority
        className="object-cover"
      />
    </div>
  );
} 