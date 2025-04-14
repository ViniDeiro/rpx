import { useState } from 'react';
import Image from 'next/image';
import { Edit } from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';
import { BANNERS } from '@/data/customization';
import CustomizationSelector from './CustomizationSelector';

export default function ProfileBanner() {
  const { user } = useAuth();
  const [showSelector, setShowSelector] = useState(false);
  
  // Encontrar o banner correto com base no ID do usuário
  const defaultBannerId = 'default';
  const bannerId = user?.bannerId || defaultBannerId;
  const banner = BANNERS.find(b => b.id === bannerId) || BANNERS.find(b => b.id === defaultBannerId)!;
  
  return (
    <div className="relative w-full">
      {/* Banner */}
      <div className="w-full h-36 md:h-48 lg:h-60 relative overflow-hidden rounded-t-xl">
        <Image
          src={banner.image}
          alt={banner.name}
          fill
          priority
          className="object-cover"
        />
        
        {/* Gradiente superior para suavizar sobreposição do header */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
        
        {/* Botão de edição */}
        <button 
          onClick={() => setShowSelector(true)}
          className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 p-2 rounded-full transition-colors"
          aria-label="Editar banner"
        >
          <Edit size={16} />
        </button>
      </div>
      
      {/* Modal de seleção de banner */}
      {showSelector && (
        <CustomizationSelector 
          type="banner"
          items={BANNERS}
          selectedItemId={bannerId}
          onClose={() => setShowSelector(false)}
        />
      )}
    </div>
  );
} 