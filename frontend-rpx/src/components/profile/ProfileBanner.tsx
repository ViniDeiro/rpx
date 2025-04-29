import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Edit } from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';
import { BANNERS } from '@/data/customization';
import CustomizationSelector from './CustomizationSelector';

export default function ProfileBanner() {
  const { user } = useAuth();
  const [showSelector, setShowSelector] = useState(false);
  const [bannerId, setBannerId] = useState('default');
  
  // Verificar se temos um banner salvo no localStorage (modo simulação)
  useEffect(() => {
    // Tentar obter do localStorage primeiro
    const storedBannerId = localStorage.getItem('user_bannerId');
    console.log("Banner ID do localStorage:", storedBannerId);
    
    if (storedBannerId) {
      setBannerId(storedBannerId);
    } else if (user?.bannerId) {
      setBannerId(user.bannerId);
    }
  }, [user?.bannerId]);
  
  // Encontrar o banner correto
  const defaultBannerId = 'default';
  const banner = BANNERS.find(b => b.id === bannerId);
  
  // Se não encontrar o banner, usar o padrão
  const finalBanner = banner || BANNERS.find(b => b.id === defaultBannerId)!;
  
  console.log("Banner atual:", finalBanner?.name, finalBanner?.image);
  
  return (
    <div className="w-full flex justify-center bg-[#0D0A2A]">
      <div className="w-full max-w-[73.5%] h-56 sm:h-60 md:h-72 relative overflow-hidden mb-0">
        {/* Banner image */}
        <Image
          src={finalBanner.image}
          alt={finalBanner.name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 73.5vw"
          className="object-cover"
        />
        
        {/* Gradiente de sobreposição */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0A2A] via-transparent to-[#0D0A2A]/60"></div>
        
        {/* Botão de editar */}
        <button 
          onClick={() => setShowSelector(true)}
          className="absolute bottom-4 right-4 bg-[#171335]/70 hover:bg-[#171335]/90 backdrop-blur-sm p-2 rounded-md flex items-center gap-2 text-white text-sm transition-all duration-200 border border-[#3D2A85]/30 z-10"
        >
          <Edit size={16} />
          <span>Editar Banner</span>
        </button>
        
        {/* Modal de seleção de banner */}
        {showSelector && (
          <CustomizationSelector 
            type="banner"
            items={BANNERS}
            selectedItemId={bannerId}
            onClose={() => {
              setShowSelector(false);
              // Forçar recarregamento da página para mostrar o novo banner
              window.location.reload();
            }}
          />
        )}
      </div>
    </div>
  );
} 