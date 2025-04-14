import { useState } from 'react';
import Image from 'next/image';
import { X, Lock, Check, ChevronLeft, ChevronRight } from 'react-feather';
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
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70">
      <div className="bg-gray-800 rounded-xl w-full max-w-4xl p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {type === 'avatar' ? 'Selecionar avatar' : 'Selecionar banner'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {paginatedItems.map(item => {
            const isItemSelected = selectedId === item.id;
            const canUse = isUnlocked(item);
            const rarityClass = getRarityColor(item.rarity);
            
            return (
              <div 
                key={item.id}
                className={`
                  relative border-2 rounded-lg overflow-hidden transition-all
                  ${isItemSelected ? 'ring-2 ring-purple-500 border-purple-500' : `border-transparent ${rarityClass}`}
                  ${canUse ? 'cursor-pointer hover:border-purple-400' : 'cursor-not-allowed opacity-75'}
                `}
                onClick={() => canUse && handleSelect(item.id)}
              >
                {/* Thumbnail */}
                <div className="aspect-video w-full flex items-center justify-center bg-gray-900 overflow-hidden">
                  {type === 'banner' ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={300}
                      height={80}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="p-4 flex items-center justify-center">
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
                
                {/* Caption */}
                <div className="p-3 bg-gray-900">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{item.name}</h3>
                    {!canUse ? (
                      <Lock size={16} className="text-gray-400" />
                    ) : isItemSelected ? (
                      <Check size={16} className="text-green-500" />
                    ) : null}
                  </div>
                  <p className={`text-xs mt-1 ${canUse ? 'text-gray-400' : 'text-red-400'}`}>
                    {canUse ? item.description : getUnlockText(item)}
                  </p>
                </div>
                
                {/* Overlay para itens bloqueados */}
                {!canUse && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-gray-900/80 px-3 py-1 rounded-full flex items-center space-x-1">
                      <Lock size={14} />
                      <span className="text-xs font-medium">Bloqueado</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mb-6">
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className={`p-2 rounded-full ${currentPage === 0 ? 'text-gray-500 cursor-not-allowed' : 'text-gray-200 hover:bg-gray-700'}`}
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm">
              Página {currentPage + 1} de {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages - 1}
              className={`p-2 rounded-full ${currentPage === totalPages - 1 ? 'text-gray-500 cursor-not-allowed' : 'text-gray-200 hover:bg-gray-700'}`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
        
        {/* Botões de ação */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={selectedId === selectedItemId || saving}
            className={`
              px-4 py-2 rounded-lg transition-colors flex items-center gap-2
              ${selectedId !== selectedItemId && !saving
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'bg-gray-600 cursor-not-allowed'
              }
            `}
          >
            {saving && (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            )}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
} 