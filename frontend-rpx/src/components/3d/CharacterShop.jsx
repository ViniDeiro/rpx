import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ShoppingCart, Star, Clock, DollarSign, Eye, ArrowLeft, ArrowRight } from 'react-feather';
import Link from 'next/link';
import CharacterViewer from './CharacterViewer';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

// Dados mockados das ofertas em destaque
const FEATURED_SKINS = [
  {
    id: 'cyber',
    name: 'Cyber Warrior',
    description: 'Guerreiro futurista com implantes cibernéticos e armadura avançada.',
    price: 1200,
    discount: 20,
    originalPrice: 1500,
    category: 'special',
    isNew: true,
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
  },
  {
    id: 'neon',
    name: 'Neon Assassin',
    description: 'Assassino equipado com tecnologia neon que brilha no escuro.',
    price: 2000,
    discount: 0,
    originalPrice: 2000,
    category: 'limited',
    isNew: true,
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 dias
  },
  {
    id: 'explorer',
    name: 'Explorador Destemido',
    description: 'Aventureiro especializado em explorar os terrenos mais perigosos.',
    price: 600,
    discount: 15,
    originalPrice: 700,
    category: 'premium',
    isNew: false,
  },
];

// Dados mockados de coleções de skins
const COLLECTIONS = [
  {
    id: 'fighters',
    name: 'Coleção Guerreiros',
    skins: ['soldier', 'ninja'],
    bonusItem: 'Emote exclusivo "Desafio"',
    discount: 15,
    price: 1000,
    originalPrice: 1250,
  },
  {
    id: 'elites',
    name: 'Coleção Elite',
    skins: ['cyber', 'neon'],
    bonusItem: 'Animação de entrada "Explosão Neon"',
    discount: 25,
    price: 2400,
    originalPrice: 3200,
  }
];

export default function CharacterShop() {
  const { user, updateUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [previewSkin, setPreviewSkin] = useState(null);
  const [previewCollection, setPreviewCollection] = useState(null);
  const [ownedSkins, setOwnedSkins] = useState(['default']);
  
  // Carregar skins que o usuário possui
  useEffect(() => {
    if (user) {
      // Em produção, isso viria da API
      const mockOwnedSkins = ['default', 'ninja'];
      setOwnedSkins(mockOwnedSkins);
    }
  }, [user]);
  
  // Verificar se o usuário possui a skin
  const userOwnsSkin = (skinId) => {
    return ownedSkins.includes(skinId);
  };
  
  // Comprar uma skin
  const handlePurchaseSkin = async (skin) => {
    if (!user) {
      toast.error('Faça login para comprar skins');
      return;
    }
    
    if (userOwnsSkin(skin.id)) {
      toast.error('Você já possui essa skin');
      return;
    }
    
    setLoading(true);
    
    try {
      // Em produção, seria uma chamada de API real
      // const response = await api.post('/store/purchase', { 
      //   itemId: skin.id,
      //   itemType: 'skin',
      //   price: skin.price 
      // });
      
      // Simulando resposta da API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Atualizar lista de skins do usuário
      setOwnedSkins(prev => [...prev, skin.id]);
      
      toast.success(`Skin ${skin.name} adquirida com sucesso!`);
      
      // Resetar preview
      setPreviewSkin(null);
    } catch (error) {
      console.error('Erro ao comprar skin:', error);
      toast.error('Erro ao comprar a skin. Verifique seu saldo.');
    } finally {
      setLoading(false);
    }
  };
  
  // Comprar uma coleção
  const handlePurchaseCollection = async (collection) => {
    if (!user) {
      toast.error('Faça login para comprar coleções');
      return;
    }
    
    const allSkinsOwned = collection.skins.every(skinId => userOwnsSkin(skinId));
    
    if (allSkinsOwned) {
      toast.error('Você já possui todas as skins desta coleção');
      return;
    }
    
    setLoading(true);
    
    try {
      // Em produção, seria uma chamada de API real
      // const response = await api.post('/store/purchase', { 
      //   itemId: collection.id,
      //   itemType: 'collection',
      //   price: collection.price 
      // });
      
      // Simulando resposta da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar lista de skins do usuário
      const newSkins = collection.skins.filter(skinId => !userOwnsSkin(skinId));
      setOwnedSkins(prev => [...prev, ...newSkins]);
      
      toast.success(`Coleção ${collection.name} adquirida com sucesso!`);
      
      // Resetar preview
      setPreviewCollection(null);
    } catch (error) {
      console.error('Erro ao comprar coleção:', error);
      toast.error('Erro ao comprar a coleção. Verifique seu saldo.');
    } finally {
      setLoading(false);
    }
  };
  
  // Formatar tempo restante
  const formatTimeRemaining = (date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff <= 0) return "Expirado";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h restantes`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m restantes`;
    }
  };
  
  const featured = FEATURED_SKINS[featuredIndex];
  
  return (
    <div className="bg-card rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-bold">Loja de Skins</h2>
        <p className="text-muted text-sm">Adquira skins exclusivas para seu personagem</p>
      </div>
      
      <div className="p-4 space-y-8">
        {/* Destaques */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Star className="text-yellow-500" size={20} />
            Destaques da Semana
          </h3>
          
          <div className="relative bg-gradient-to-r from-primary/20 to-card-hover rounded-lg overflow-hidden">
            {/* Controles de navegação */}
            <div className="absolute top-1/2 left-4 -translate-y-1/2 z-10">
              <button 
                onClick={() => setFeaturedIndex((prev) => (prev === 0 ? FEATURED_SKINS.length - 1 : prev - 1))}
                className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-full"
              >
                <ArrowLeft size={20} />
              </button>
            </div>
            
            <div className="absolute top-1/2 right-4 -translate-y-1/2 z-10">
              <button 
                onClick={() => setFeaturedIndex((prev) => (prev === FEATURED_SKINS.length - 1 ? 0 : prev + 1))}
                className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-full"
              >
                <ArrowRight size={20} />
              </button>
            </div>
            
            {/* Carrossel de destaques */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              {/* Informações do destaque */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xl font-bold">{featured.name}</h4>
                  <p className="text-muted">{featured.description}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  {featured.discount > 0 && (
                    <div className="bg-primary text-white px-2 py-1 text-xs font-bold rounded">
                      -{featured.discount}%
                    </div>
                  )}
                  
                  {featured.isNew && (
                    <div className="bg-green-500 text-white px-2 py-1 text-xs font-bold rounded">
                      NOVO
                    </div>
                  )}
                  
                  {featured.expiresAt && (
                    <div className="flex items-center gap-1 text-amber-500 text-sm">
                      <Clock size={14} />
                      {formatTimeRemaining(featured.expiresAt)}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-primary">
                    {featured.price} <span className="text-sm">créditos</span>
                  </div>
                  
                  {featured.discount > 0 && (
                    <div className="text-muted line-through text-sm">
                      {featured.originalPrice}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    disabled={loading || userOwnsSkin(featured.id)}
                    onClick={() => handlePurchaseSkin(featured)}
                    className={`btn-primary flex items-center gap-2 ${userOwnsSkin(featured.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {userOwnsSkin(featured.id) ? (
                      'Adquirido'
                    ) : (
                      <>
                        <ShoppingCart size={16} />
                        Comprar Agora
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setPreviewSkin(featured.id)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Eye size={16} />
                    Visualizar
                  </button>
                </div>
              </div>
              
              {/* Visualizador 3D */}
              <div className="h-80 w-full">
                <CharacterViewer 
                  skinId={featured.id} 
                  animation="idle"
                  controls={false}
                  autoRotate={true}
                  background="linear-gradient(145deg, #0d1829 0%, #111827 100%)"
                  height="100%"
                  showInfo={false}
                />
              </div>
            </div>
            
            {/* Indicadores de slide */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
              {FEATURED_SKINS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setFeaturedIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === featuredIndex ? 'w-8 bg-primary' : 'w-2 bg-gray-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Coleções */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <DollarSign className="text-green-500" size={20} />
            Coleções com Desconto
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COLLECTIONS.map(collection => (
              <div 
                key={collection.id}
                className="bg-card-hover rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-bold">{collection.name}</h4>
                    <div className="bg-primary text-white px-2 py-1 text-xs font-bold rounded">
                      -{collection.discount}%
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    {collection.skins.map(skinId => (
                      <div 
                        key={skinId}
                        className={`w-12 h-12 rounded-full bg-card flex items-center justify-center border-2 ${
                          userOwnsSkin(skinId) ? 'border-green-500' : 'border-muted'
                        }`}
                      >
                        <span className="text-lg font-bold">
                          {skinId.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-sm text-muted mb-3">
                    <p>Inclui {collection.skins.length} skins + {collection.bonusItem}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="text-xl font-bold text-primary">
                      {collection.price} <span className="text-xs">créditos</span>
                    </div>
                    
                    <div className="text-muted line-through text-sm">
                      {collection.originalPrice}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      disabled={loading || collection.skins.every(skinId => userOwnsSkin(skinId))}
                      onClick={() => handlePurchaseCollection(collection)}
                      className={`btn-primary btn-sm flex items-center gap-2 ${
                        collection.skins.every(skinId => userOwnsSkin(skinId)) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {collection.skins.every(skinId => userOwnsSkin(skinId)) ? (
                        'Adquirido'
                      ) : (
                        <>
                          <ShoppingCart size={14} />
                          Comprar
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setPreviewCollection(collection)}
                      className="btn-secondary btn-sm flex items-center gap-2"
                    >
                      <Eye size={14} />
                      Visualizar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Link para personalização */}
        <div className="text-center p-4 bg-card-hover rounded-lg">
          <p className="text-muted mb-3">
            Já possui skins e deseja personalizar seu personagem?
          </p>
          <Link href="/profile/customize" className="btn-primary">
            Ir para Personalização
          </Link>
        </div>
      </div>
      
      {/* Modal de Preview de Skin */}
      {previewSkin && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg overflow-hidden max-w-2xl w-full">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-bold">Visualização de Skin</h3>
              <button 
                onClick={() => setPreviewSkin(null)}
                className="text-muted hover:text-foreground"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="h-96">
                <CharacterViewer 
                  skinId={previewSkin} 
                  controls={true}
                  autoRotate={false}
                  background="linear-gradient(145deg, #0d1829 0%, #111827 100%)"
                  height="100%"
                  quality="high"
                />
              </div>
              
              <div className="flex justify-center gap-4 mt-4">
                {ANIMATIONS.map(anim => (
                  <button
                    key={anim.id}
                    onClick={() => {
                      const viewer = document.querySelector(`[data-animation="${anim.id}"]`);
                      if (viewer) viewer.click();
                    }}
                    className="px-3 py-1 text-sm rounded bg-card-hover hover:bg-muted"
                  >
                    {anim.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-border flex justify-end">
              <button
                onClick={() => setPreviewSkin(null)}
                className="btn-secondary mr-2"
              >
                Fechar
              </button>
              
              {!userOwnsSkin(previewSkin) && (
                <button
                  onClick={() => {
                    const skin = FEATURED_SKINS.find(s => s.id === previewSkin);
                    if (skin) handlePurchaseSkin(skin);
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <ShoppingCart size={16} />
                  Comprar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Preview de Coleção */}
      {previewCollection && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg overflow-hidden max-w-4xl w-full">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-bold">
                Visualização de Coleção: {previewCollection.name}
              </h3>
              <button 
                onClick={() => setPreviewCollection(null)}
                className="text-muted hover:text-foreground"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {previewCollection.skins.map((skinId, index) => (
                  <div key={skinId} className="space-y-2">
                    <h4 className="font-medium text-center">
                      {AVAILABLE_SKINS.find(s => s.id === skinId)?.name || `Skin ${index + 1}`}
                    </h4>
                    <div className="h-64 w-full">
                      <CharacterViewer 
                        skinId={skinId} 
                        controls={true}
                        autoRotate={false}
                        background="linear-gradient(145deg, #0d1829 0%, #111827 100%)"
                        height="100%"
                      />
                    </div>
                    <div className="text-center text-sm text-muted">
                      {userOwnsSkin(skinId) ? 'Já adquirido' : 'Não adquirido'}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-card-hover rounded-lg">
                <h4 className="font-medium mb-2">Bônus da Coleção:</h4>
                <p className="text-muted">{previewCollection.bonusItem}</p>
              </div>
            </div>
            
            <div className="p-4 border-t border-border flex justify-between items-center">
              <div className="text-lg font-bold text-primary">
                {previewCollection.price} <span className="text-xs">créditos</span>
                <span className="text-muted line-through text-sm ml-2">
                  {previewCollection.originalPrice}
                </span>
              </div>
              
              <div>
                <button
                  onClick={() => setPreviewCollection(null)}
                  className="btn-secondary mr-2"
                >
                  Fechar
                </button>
                
                {!previewCollection.skins.every(skinId => userOwnsSkin(skinId)) && (
                  <button
                    onClick={() => handlePurchaseCollection(previewCollection)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <ShoppingCart size={16} />
                    Comprar Coleção
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 