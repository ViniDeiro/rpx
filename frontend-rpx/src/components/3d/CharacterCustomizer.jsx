import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Lock, Check, RotateCcw, ShoppingCart, Save } from 'react-feather';
import CharacterViewer from './CharacterViewer';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

// Categorias de skins disponíveis
const SKIN_CATEGORIES = [
  { id: 'all', name: 'Todos' },
  { id: 'basic', name: 'Básicos' },
  { id: 'premium', name: 'Premium' },
  { id: 'special', name: 'Especiais' },
  { id: 'limited', name: 'Limitados' },
];

// Dados mockados de skins (em produção, viria da API)
const AVAILABLE_SKINS = [
  { 
    id: 'default', 
    name: 'Padrão', 
    description: 'Personagem padrão do jogo',
    category: 'basic', 
    price: 0, 
    isDefault: true,
    colors: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12'],
  },
  { 
    id: 'ninja', 
    name: 'Ninja', 
    description: 'Um ninja ágil e furtivo',
    category: 'premium', 
    price: 500,
    colors: ['#000000', '#e74c3c', '#3498db'],
  },
  { 
    id: 'soldier', 
    name: 'Soldado', 
    description: 'Soldado de elite pronto para combate',
    category: 'premium', 
    price: 750,
    colors: ['#5D6D7E', '#145A32', '#922B21'],
  },
  { 
    id: 'explorer', 
    name: 'Explorador', 
    description: 'Explorador de terras desconhecidas',
    category: 'premium', 
    price: 600,
    colors: ['#D35400', '#7D3C98', '#2471A3'],
  },
  { 
    id: 'cyber', 
    name: 'Cyber', 
    description: 'Guerreiro futurista com implantes cibernéticos',
    category: 'special', 
    price: 1200,
    colors: ['#9B59B6', '#3498DB', '#E74C3C', '#2ECC71'],
  },
  { 
    id: 'neon', 
    name: 'Neon', 
    description: 'Brilha no escuro com cores vibrantes',
    category: 'limited', 
    price: 2000,
    colors: ['#F39C12', '#9B59B6', '#2ECC71', '#E74C3C'],
  },
];

// Animações disponíveis para preview
const ANIMATIONS = [
  { id: 'idle', name: 'Parado' },
  { id: 'walk', name: 'Caminhando' },
  { id: 'run', name: 'Correndo' },
  { id: 'dance', name: 'Dançando' },
  { id: 'wave', name: 'Acenando' },
];

export default function CharacterCustomizer() {
  const { user, updateUserData } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSkin, setSelectedSkin] = useState('default');
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedAnimation, setSelectedAnimation] = useState('idle');
  const [loading, setLoading] = useState(false);
  const [ownedSkins, setOwnedSkins] = useState(['default']);
  
  // Carregar skins que o usuário possui
  useEffect(() => {
    if (user) {
      // Em produção, isso viria da API
      const mockOwnedSkins = ['default', 'ninja'];
      setOwnedSkins(mockOwnedSkins);
      
      // Definir a skin ativa do usuário como selecionada
      if (user.activeSkin) {
        setSelectedSkin(user.activeSkin);
      }
    }
  }, [user]);
  
  // Filtrar skins com base na categoria selecionada
  const filteredSkins = AVAILABLE_SKINS.filter(skin => 
    selectedCategory === 'all' || skin.category === selectedCategory
  );
  
  // Verificar se o usuário possui a skin
  const userOwnsSkin = (skinId) => {
    return ownedSkins.includes(skinId);
  };
  
  // Obter dados da skin selecionada
  const currentSkin = AVAILABLE_SKINS.find(skin => skin.id === selectedSkin) || AVAILABLE_SKINS[0];
  
  // Obter cor selecionada atual
  const currentColor = currentSkin.colors[selectedColor] || currentSkin.colors[0];
  
  // Comprar uma nova skin
  const handlePurchaseSkin = async (skin) => {
    if (userOwnsSkin(skin.id)) {
      return toast.error('Você já possui essa skin');
    }
    
    setLoading(true);
    
    try {
      // Em produção, seria uma chamada de API real
      // const response = await api.post('/user/skins/purchase', { skinId: skin.id });
      
      // Simulando resposta da API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Atualizar lista de skins do usuário
      setOwnedSkins(prev => [...prev, skin.id]);
      
      toast.success(`Skin ${skin.name} adquirida com sucesso!`);
      
      // Selecionar a nova skin
      setSelectedSkin(skin.id);
    } catch (error) {
      console.error('Erro ao comprar skin:', error);
      toast.error('Erro ao comprar a skin. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Aplicar skin selecionada ao perfil
  const handleApplySkin = async () => {
    if (!userOwnsSkin(selectedSkin)) {
      return toast.error('Você precisa comprar essa skin primeiro');
    }
    
    setLoading(true);
    
    try {
      // Em produção, seria uma chamada de API real
      // const response = await api.post('/user/skins/apply', { 
      //   skinId: selectedSkin,
      //   colorIndex: selectedColor 
      // });
      
      // Simulando resposta da API
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Atualizar informações do usuário localmente
      updateUserData({ activeSkin: selectedSkin, activeSkinColor: selectedColor });
      
      toast.success('Skin aplicada com sucesso!');
    } catch (error) {
      console.error('Erro ao aplicar skin:', error);
      toast.error('Erro ao aplicar a skin. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-card rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-bold">Personalização de Avatar</h2>
        <p className="text-muted text-sm">Personalize seu avatar com skins exclusivas</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        {/* Visualizador 3D */}
        <div className="lg:col-span-2 bg-card-hover rounded-lg overflow-hidden">
          <div className="h-80 md:h-96 w-full">
            <CharacterViewer 
              skinId={selectedSkin} 
              animation={selectedAnimation}
              controls={true}
              autoRotate={false}
              background="linear-gradient(145deg, #1a2233 0%, #0f172a 100%)"
              height="100%"
              showInfo={false}
              quality="high"
            />
          </div>
          
          {/* Controles de animação */}
          <div className="p-4 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {ANIMATIONS.map(anim => (
                <button
                  key={anim.id}
                  onClick={() => setSelectedAnimation(anim.id)}
                  className={`px-3 py-1 text-sm rounded ${
                    selectedAnimation === anim.id 
                      ? 'bg-primary text-white' 
                      : 'bg-card-hover text-foreground hover:bg-muted'
                  }`}
                >
                  {anim.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Painel de customização */}
        <div className="space-y-4">
          {/* Informações da skin atual */}
          <div className="bg-card-hover rounded-lg p-4">
            <h3 className="font-bold text-lg">{currentSkin.name}</h3>
            <p className="text-muted text-sm mb-3">{currentSkin.description}</p>
            
            {!userOwnsSkin(currentSkin.id) ? (
              <div className="flex justify-between items-center">
                <div className="text-primary font-bold">
                  {currentSkin.price} Créditos
                </div>
                <button
                  onClick={() => handlePurchaseSkin(currentSkin)}
                  disabled={loading}
                  className="btn-primary btn-sm flex items-center gap-2"
                >
                  <ShoppingCart size={16} />
                  Comprar
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div className="text-green-500 flex items-center gap-1">
                  <Check size={16} />
                  <span className="font-medium">Disponível</span>
                </div>
                {currentSkin.id === user?.activeSkin ? (
                  <span className="text-primary font-medium text-sm">Ativo</span>
                ) : (
                  <button
                    onClick={handleApplySkin}
                    disabled={loading}
                    className="btn-primary btn-sm flex items-center gap-2"
                  >
                    <Save size={16} />
                    Aplicar
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Seleção de cor */}
          {currentSkin.colors && currentSkin.colors.length > 0 && (
            <div className="bg-card-hover rounded-lg p-4">
              <h3 className="font-medium text-sm mb-3">Variação de Cor</h3>
              <div className="flex flex-wrap gap-2">
                {currentSkin.colors.map((color, index) => (
                  <button
                    key={index}
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedColor === index 
                        ? 'border-primary shadow-lg' 
                        : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(index)}
                    title={`Cor ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Categorias de skins */}
          <div className="bg-card-hover rounded-lg p-4">
            <h3 className="font-medium text-sm mb-3">Categorias</h3>
            <div className="flex flex-wrap gap-2">
              {SKIN_CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 text-sm rounded ${
                    selectedCategory === category.id 
                      ? 'bg-primary text-white' 
                      : 'bg-card hover:bg-muted'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Lista de skins */}
          <div className="bg-card-hover rounded-lg p-4 overflow-auto max-h-60">
            <h3 className="font-medium text-sm mb-3">Skins Disponíveis</h3>
            <div className="space-y-2">
              {filteredSkins.map(skin => (
                <div 
                  key={skin.id}
                  onClick={() => setSelectedSkin(skin.id)}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                    selectedSkin === skin.id 
                      ? 'bg-primary/20 border-l-4 border-primary' 
                      : 'bg-card hover:bg-card-hover'
                  }`}
                >
                  <div className="w-10 h-10 rounded bg-card-hover flex items-center justify-center">
                    {userOwnsSkin(skin.id) ? (
                      <div className="text-lg font-bold">{skin.name.charAt(0)}</div>
                    ) : (
                      <Lock size={16} className="text-muted" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{skin.name}</div>
                    <div className="text-xs text-muted flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${
                        skin.category === 'basic' ? 'bg-blue-500' :
                        skin.category === 'premium' ? 'bg-purple-500' :
                        skin.category === 'special' ? 'bg-amber-500' : 'bg-red-500'
                      }`}></span>
                      {skin.category === 'basic' ? 'Básico' :
                       skin.category === 'premium' ? 'Premium' :
                       skin.category === 'special' ? 'Especial' : 'Limitado'}
                    </div>
                  </div>
                  <div className="text-sm font-bold">
                    {skin.price === 0 ? (
                      <span className="text-green-500">Grátis</span>
                    ) : (
                      <span className="text-primary">{skin.price}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 