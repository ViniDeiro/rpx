import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Lock, Check, ChevronLeft, ChevronRight, ShoppingBag } from 'react-feather';
import { CustomizationItem, isItemUnlocked } from '@/data/customization';
import { useAuth } from '@/contexts/AuthContext';

interface CustomizationSelectorProps {
  type: 'avatar' | 'banner';
  items: CustomizationItem[];
  selectedItemId: string;
  onClose: () => void;
}

export default function CustomizationSelector({ type, items, selectedItemId, onClose }: CustomizationSelectorProps) {
  const { user, updateCustomization, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(selectedItemId);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewItem, setPreviewItem] = useState<CustomizationItem | null>(null);
  
  const itemsPerPage = 6;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = items.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  const handleSelect = async (itemId: string) => {
    setSelectedId(itemId);
  };
  
  const handleSave = async () => {
    if (selectedId === selectedItemId || saving) return;
    
    try {
      setSaving(true);
      await updateCustomization(type, selectedId);
      onClose();
    } catch (error) {
      console.error(`Erro ao salvar ${type}:`, error);
      alert(`Erro ao salvar: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'comum': return 'border-gray-400 bg-gray-600/20';
      case 'raro': return 'border-blue-400 bg-blue-600/20';
      case 'épico': return 'border-purple-400 bg-purple-600/20';
      case 'lendário': return 'border-yellow-400 bg-yellow-600/20';
      default: return 'border-gray-400 bg-gray-600/20';
    }
  };
  
  const getUnlockText = (item: CustomizationItem) => {
    if (item.unlockMethod === 'inicial') return 'Disponível desde o início';
    if (item.unlockMethod === 'level') return `Nível ${item.unlockValue} necessário`;
    if (item.unlockMethod === 'conquista') return `Conquista: ${item.unlockCondition}`;
    if (item.unlockMethod === 'torneio') return `Evento: ${item.unlockCondition}`;
    if (item.unlockMethod === 'compra') return `${item.unlockCondition} ${item.unlockValue} moedas`;
    return 'Bloqueado';
  };
  
  // Verificar se o item está desbloqueado
  const isUnlocked = (item: CustomizationItem) => {
    if (!user) return false;
    return isItemUnlocked(
      item, 
      user.level || 0,
      user.achievements || [],
      user.purchases || []
    );
  };
  
  const handlePreview = (item: CustomizationItem) => {
    if (!isUnlocked(item)) return;
    setPreviewItem(item);
    setPreviewMode(true);
  };

  const closePreview = () => {
    setPreviewMode(false);
    setPreviewItem(null);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl w-full max-w-4xl p-6 shadow-2xl shadow-purple-900/20 border border-purple-500/30 animate-fade-up"
        style={{ animationDuration: '0.3s' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center">
            {type === 'avatar' ? 'Selecionar avatar' : 'Personalizar seu banner'}
            <span className="ml-2 bg-gradient-to-r from-purple-500 to-blue-500 text-xs py-1 px-2 rounded-md">VIP</span>
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {paginatedItems.map(item => {
            const isItemSelected = selectedId === item.id;
            const canUse = isUnlocked(item);
            const rarityClass = getRarityColor(item.rarity);
            
            return (
              <div 
                key={item.id}
                className={`
                  relative rounded-lg overflow-hidden transition-all duration-300 transform
                  ${isItemSelected ? 'scale-[1.02] ring-2 ring-purple-500 shadow-lg shadow-purple-500/30' : 
                    canUse ? 'hover:scale-[1.01]' : 'opacity-75'
                  }
                  ${canUse ? 'cursor-pointer group' : 'cursor-not-allowed grayscale'}
                  border-2 ${isItemSelected ? 'border-purple-500' : `${rarityClass}`}
                  h-full
                `}
              >
                {/* Thumbnail com efeito de hover */}
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
                <div className="p-4 bg-gray-900/80 backdrop-blur-sm flex flex-col h-[120px]">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-white flex items-center">
                      {item.name}
                      {item.unlockMethod === 'compra' && (
                        <span className="ml-2 text-xs text-yellow-400 flex items-center">
                          <ShoppingBag size={12} className="mr-1" /> Premium
                        </span>
                      )}
                    </h3>
                    {!canUse ? (
                      <Lock size={16} className="text-gray-400" />
                    ) : isItemSelected ? (
                      <div className="bg-green-500/20 p-1 rounded-full">
                        <Check size={16} className="text-green-500" />
                      </div>
                    ) : null}
                  </div>
                  
                  {/* Mostrar raridade */}
                  <div className="flex items-center mt-2 mb-1">
                    <span className={`inline-block h-2 w-2 rounded-full mr-2 ${
                      item.rarity === 'comum' ? 'bg-gray-400' :
                      item.rarity === 'raro' ? 'bg-blue-400' :
                      item.rarity === 'épico' ? 'bg-purple-400' :
                      'bg-yellow-400'
                    }`}></span>
                    <span className="text-xs text-gray-300 capitalize">{item.rarity}</span>
                  </div>
                  
                  <p className={`text-sm mt-1 flex-grow ${canUse ? 'text-gray-300' : 'text-red-400'} line-clamp-2`}>
                    {canUse ? item.description : getUnlockText(item)}
                  </p>
                  
                  {/* Botões de ação */}
                  <div className="mt-auto pt-2 flex justify-between">
                    {canUse ? (
                      <button 
                        onClick={() => handleSelect(item.id)}
                        className={`text-xs py-1.5 px-3 rounded-md transition-colors ${
                          isItemSelected ? 'bg-green-600/20 text-green-400 cursor-default' : 'bg-purple-600/30 hover:bg-purple-600/50 text-purple-200'
                        }`}
                      >
                        {isItemSelected ? 'Selecionado' : 'Selecionar'}
                      </button>
                    ) : (
                      item.unlockMethod === 'compra' ? (
                        <button 
                          className="text-xs py-1.5 px-3 rounded-md bg-yellow-600/40 hover:bg-yellow-600/60 text-yellow-200 transition-colors flex items-center gap-1"
                        >
                          <ShoppingBag size={12} /> Comprar ({item.unlockValue})
                        </button>
                      ) : (
                        <span className="text-xs py-1.5 px-3 rounded-md bg-red-500/20 text-red-300">
                          Bloqueado
                        </span>
                      )
                    )}
                  </div>
                </div>
                
                {/* Overlay para itens bloqueados */}
                {!canUse && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-gray-900/80 px-4 py-2 rounded-lg flex items-center space-x-2 backdrop-blur-sm border border-white/10">
                      <Lock size={16} />
                      <span className="text-sm font-medium">Bloqueado</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Paginação com visual aprimorado */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mb-6">
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className={`p-2 rounded-full transition-colors ${
                currentPage === 0 ? 'text-gray-500 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm bg-gray-800 px-4 py-1.5 rounded-full">
              Página {currentPage + 1} de {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages - 1}
              className={`p-2 rounded-full transition-colors ${
                currentPage === totalPages - 1 ? 'text-gray-500 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
        
        {/* Botões de ação */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={selectedId === selectedItemId || saving}
            className={`
              px-4 py-2 rounded-lg transition-colors flex items-center gap-2
              ${selectedId !== selectedItemId && !saving
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white' 
                : 'bg-gray-600 cursor-not-allowed text-gray-300'
              }
            `}
          >
            {saving && (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            )}
            Salvar alterações
          </button>
        </div>
      </div>
      
      {/* Preview Modal para banners */}
      {previewMode && previewItem && type === 'banner' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-5xl p-4">
            <div className="relative w-full h-80 rounded-xl overflow-hidden">
              <Image
                src={previewItem.image}
                alt={previewItem.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center">
                <span className="text-white font-semibold mr-2">{previewItem.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  previewItem.rarity === 'comum' ? 'bg-gray-400 text-gray-900' :
                  previewItem.rarity === 'raro' ? 'bg-blue-500 text-white' :
                  previewItem.rarity === 'épico' ? 'bg-purple-500 text-white' :
                  'bg-yellow-500 text-yellow-900'
                }`}>
                  {previewItem.rarity.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={closePreview}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                Voltar
              </button>
              {selectedId !== previewItem.id && (
                <button
                  onClick={() => {
                    handleSelect(previewItem.id);
                    closePreview();
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-colors"
                >
                  Selecionar este banner
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 