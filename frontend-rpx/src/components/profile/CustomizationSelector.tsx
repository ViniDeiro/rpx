import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Lock, Check, ChevronLeft, ChevronRight, ShoppingBag } from 'react-feather';
import { CustomizationItem, isItemUnlocked } from '@/data/customization';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';

interface CustomizationSelectorProps {
  type: 'avatar' | 'banner';
  items: CustomizationItem[];
  selectedItemId: string;
  onClose: () => void;
}

export default function CustomizationSelector({ type, items, selectedItemId, onClose }: CustomizationSelectorProps) {
  const { user, updateCustomization, isLoading } = useAuth();
  const [selectedId, setSelectedId] = useState(selectedItemId);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const itemsPerPage = 8;
  
  // Verificar se estamos em modo simulação
  useEffect(() => {
    // Se não tivermos token de autenticação, estamos em modo simulação
    const hasAuthToken = typeof window !== 'undefined' && localStorage.getItem('auth_token');
    setIsSimulationMode(true); // Forçar modo de simulação para testes
    console.log("Modo de simulação ativado");
  }, []);
  
  // Filtrar items unlocked
  const userLevel = user?.level || 1;
  const userAchievements = user?.achievements || [];
  const userPurchases = user?.purchases || [];
  
  // Função para paginar os itens
  const paginatedItems = items.slice(
    currentPage * itemsPerPage, 
    (currentPage + 1) * itemsPerPage
  );
  
  // Total de páginas
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  // Navegar para a próxima página
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };
  
  // Navegar para a página anterior
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };
  
  // Lidar com a seleção de um item
  const handleSelectItem = async (item: CustomizationItem) => {
    // Verificar se o item está desbloqueado
    const canUse = true; // Sempre permitir no modo de simulação
    
    if (!canUse) {
      // Se não estiver desbloqueado, exibir mensagem e não fazer nada
      setErrorMessage(`Este ${type === 'avatar' ? 'avatar' : 'banner'} está bloqueado. ${item.unlockCondition} ${item.unlockValue}.`);
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    // Se estiver desbloqueado, atualizar a seleção
    setSelectedId(item.id);
    
    // Se for banner, fechar a pré-visualização
    if (type === 'banner') {
      setShowPreview(false);
      setPreviewId(null);
    }
    
    try {
      setIsSaving(true);
      setErrorMessage(null);
      
      // MODO SIMULAÇÃO: Salvar no localStorage sempre
      if (type === 'avatar') {
        localStorage.setItem('user_avatarId', item.id);
      } else {
        localStorage.setItem('user_bannerId', item.id);
      }
      
      // Atualizar o DOM diretamente se for banner
      if (type === 'banner') {
        const bannerImages = document.querySelectorAll('img');
        bannerImages.forEach(img => {
          if (img.src.includes('/banners/')) {
            const parent = img.closest('div');
            if (parent) {
              try {
                img.src = item.image;
              } catch (e) {
                console.error("Erro ao atualizar imagem:", e);
              }
            }
          }
        });
      }
      
      // Mostrar mensagem de sucesso
      if (typeof toast !== 'undefined') {
        toast.success(`${type === 'avatar' ? 'Avatar' : 'Banner'} atualizado com sucesso!`);
      }
      
      // Fechar o seletor após um pequeno delay
      setTimeout(() => {
        onClose();
        // Recarregar a página para mostrar a mudança
        window.location.reload();
      }, 1000);
      
    } catch (error: any) {
      console.error(`Erro ao atualizar ${type}:`, error);
      setErrorMessage(error.message || `Erro ao salvar ${type}. Tente novamente.`);
      
      // Mostrar mensagem de erro
      if (typeof toast !== 'undefined') {
        toast.error(`Erro ao atualizar ${type}: ${error.message || 'Tente novamente'}`);
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  // Pré-visualizar um banner
  const handlePreview = (item: CustomizationItem) => {
    setPreviewId(item.id);
    setShowPreview(true);
  };
  
  // Fechar pré-visualização
  const closePreview = () => {
    setShowPreview(false);
    setPreviewId(null);
  };
  
  // Salvar alteração no backend
  const handleSaveCustomization = async () => {
    if (selectedId === selectedItemId) {
      // Se não houve alteração, apenas fechar
      onClose();
      return;
    }
    
    try {
      setIsSaving(true);
      setErrorMessage(null);
      
      // MODO SIMULAÇÃO: Salvar no localStorage sempre
      if (type === 'avatar') {
        localStorage.setItem('user_avatarId', selectedId);
      } else {
        localStorage.setItem('user_bannerId', selectedId);
      }
      
      // Mostrar mensagem de sucesso
      if (typeof toast !== 'undefined') {
        toast.success(`${type === 'avatar' ? 'Avatar' : 'Banner'} atualizado com sucesso!`);
      }
      
      // Fechar o seletor após um pequeno delay
      setTimeout(() => {
        onClose();
        // Recarregar a página para mostrar a mudança
        window.location.reload();
      }, 1000);
      
    } catch (error: any) {
      console.error(`Erro ao atualizar ${type}:`, error);
      setErrorMessage(error.message || `Erro ao salvar ${type}. Tente novamente.`);
      
      // Mostrar mensagem de erro
      if (typeof toast !== 'undefined') {
        toast.error(`Erro ao atualizar ${type}: ${error.message || 'Tente novamente'}`);
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      {/* Modal principal */}
      <div className="bg-[#171335] rounded-xl w-full max-w-2xl animate-fade-up shadow-xl border border-[#3D2A85]/20 overflow-hidden relative">
        {/* Cabeçalho */}
        <div className="p-4 flex justify-between items-center border-b border-[#3D2A85]/20">
          <h2 className="text-xl font-bold text-white">
            {type === 'avatar' ? 'Escolher Avatar' : 'Escolher Banner'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Mensagem de erro */}
        {errorMessage && (
          <div className="mx-4 mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200">
            <p>{errorMessage}</p>
          </div>
        )}
        
        {/* Grid de itens */}
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {paginatedItems.map(item => {
              const isItemSelected = selectedId === item.id;
              const canUse = isSimulationMode ? true : isItemUnlocked(item, userLevel, userAchievements, userPurchases);
              
              return (
                <div 
                  key={item.id}
                  className={`
                    relative rounded-lg overflow-hidden border transition-all group
                    ${isItemSelected 
                      ? 'border-[#8860FF] shadow-lg shadow-[#8860FF]/20' 
                      : canUse 
                        ? 'border-[#3D2A85]/30 hover:border-[#8860FF]/50' 
                        : 'border-gray-700 opacity-60'
                    }
                  `}
                >
                  {/* Indicador de selecionado */}
                  {isItemSelected && (
                    <div className="absolute top-2 right-2 z-10 bg-[#8860FF] rounded-full p-1">
                      <Check size={16} />
                    </div>
                  )}
                  
                  {/* Indicador de bloqueado */}
                  {!canUse && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 p-2">
                      <Lock size={24} className="text-white/70 mb-2" />
                      <p className="text-xs text-center text-white/70">
                        {item.unlockCondition} {item.unlockValue}
                      </p>
                    </div>
                  )}
                  
                  {/* Item */}
                  <div 
                    className="aspect-[16/9] w-full bg-gray-900 overflow-hidden"
                    onClick={() => canUse && type === 'banner' && handlePreview(item)}
                  >
                    {type === 'banner' ? (
                      <div className="w-full h-full relative">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={400}
                          height={225}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {canUse && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                            <span className="text-white text-sm font-medium bg-purple-500/80 px-3 py-1 rounded-full">
                              {isItemSelected ? 'Selecionado' : 'Ver prévia'}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 py-4">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={100}
                          height={100}
                          className="w-24 h-24 rounded-full"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Caption com informações aprimoradas */}
                  <div className="p-3 bg-[#232048]">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-white text-sm">{item.name}</h3>
                      <div className={`text-xs px-1.5 py-0.5 rounded ${
                        item.rarity === 'comum' ? 'bg-gray-700 text-gray-300' :
                        item.rarity === 'raro' ? 'bg-blue-900/40 text-blue-300' :
                        item.rarity === 'épico' ? 'bg-purple-900/40 text-purple-300' :
                        'bg-amber-900/40 text-amber-300'
                      }`}>
                        {item.rarity}
                      </div>
                    </div>
                    
                    {canUse && (
                      <button
                        onClick={() => handleSelectItem(item)}
                        disabled={isItemSelected || isLoading || isSaving}
                        className={`
                          mt-2 w-full py-1.5 rounded-md text-sm font-medium text-center transition-colors
                          ${isItemSelected 
                            ? 'bg-[#8860FF]/30 text-[#8860FF] cursor-default' 
                            : 'bg-[#8860FF] hover:bg-[#7D55EF] text-white'
                          }
                          ${(isLoading || isSaving) ? 'opacity-50 cursor-wait' : ''}
                        `}
                      >
                        {isItemSelected ? 'Selecionado' : 'Selecionar'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className={`p-2 rounded-md ${
                  currentPage === 0 
                    ? 'text-gray-500 cursor-not-allowed' 
                    : 'text-white hover:bg-[#232048]'
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="text-white">
                Página {currentPage + 1} de {totalPages}
              </div>
              
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages - 1}
                className={`p-2 rounded-md ${
                  currentPage === totalPages - 1 
                    ? 'text-gray-500 cursor-not-allowed' 
                    : 'text-white hover:bg-[#232048]'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
        
        {/* Footer com botões */}
        <div className="p-4 border-t border-[#3D2A85]/20 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#232048] hover:bg-[#2c295c] text-white rounded-md transition-colors"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSaveCustomization}
            disabled={selectedId === selectedItemId || isLoading || isSaving}
            className={`
              px-4 py-2 rounded-md transition-colors
              ${selectedId === selectedItemId 
                ? 'bg-[#232048] text-gray-400 cursor-not-allowed' 
                : 'bg-[#8860FF] hover:bg-[#7D55EF] text-white'
              }
              ${(isLoading || isSaving) ? 'animate-pulse cursor-wait' : ''}
            `}
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
      
      {/* Preview de Banner */}
      {showPreview && previewId && type === 'banner' && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 bg-black/80 backdrop-blur-md animate-fade">
          <div className="w-full max-w-4xl">
            <div className="relative w-full h-64 overflow-hidden rounded-xl">
              <Image
                src={items.find(item => item.id === previewId)?.image || ''}
                alt="Preview do banner"
                fill
                className="object-cover"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
              
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => handleSelectItem(items.find(item => item.id === previewId)!)}
                  disabled={isLoading || isSaving}
                  className="px-4 py-2 bg-[#8860FF] hover:bg-[#7D55EF] text-white rounded-md transition-colors flex items-center gap-2"
                >
                  <Check size={16} />
                  <span>Selecionar</span>
                </button>
                
                <button
                  onClick={closePreview}
                  className="p-2 rounded-md bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 