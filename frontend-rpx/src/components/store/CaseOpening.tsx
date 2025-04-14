'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, ChevronRight, Archive, Star, DollarSign, Gift, AlertTriangle } from 'react-feather';
import { formatCurrency } from '@/utils/formatters';

// Tipos de raridade com cores e efeitos
const rarities = {
  common: { name: 'Comum', color: '#b0c3d9', glow: 'rgba(176, 195, 217, 0.5)' },
  uncommon: { name: 'Incomum', color: '#5e98d9', glow: 'rgba(94, 152, 217, 0.5)' },
  rare: { name: 'Raro', color: '#4b69ff', glow: 'rgba(75, 105, 255, 0.6)' },
  mythical: { name: 'Místico', color: '#8847ff', glow: 'rgba(136, 71, 255, 0.7)' },
  legendary: { name: 'Lendário', color: '#d32ce6', glow: 'rgba(211, 44, 230, 0.8)' },
  ancient: { name: 'Ancião', color: '#eb4b4b', glow: 'rgba(235, 75, 75, 0.9)' },
  arcana: { name: 'Arcano', color: '#e4ae39', glow: 'rgba(228, 174, 57, 1)' },
};

// Tipo para as recompensas das caixas
interface ItemReward {
  id: string;
  name: string;
  description: string;
  image: string;
  type: 'avatar' | 'banner' | 'skin' | 'effect'; 
  rarity: keyof typeof rarities;
  chance: number; // Probabilidade em percentual (1-100)
}

// Tipo para as caixas
interface Case {
  id: string;
  name: string;
  description: string;
  price: number;
  discount?: number;
  image: string;
  possibleRewards: ItemReward[];
}

// Caixas de exemplo
const sampleCases: Case[] = [
  {
    id: 'case-basic',
    name: 'Caixa Básica',
    description: 'Contém itens comuns e incomuns, com chance pequena de itens raros.',
    price: 10,
    image: '/images/cases/basic-case.png',
    possibleRewards: [
      { 
        id: 'avatar-1', 
        name: 'Avatar Básico', 
        description: 'Um avatar básico para seu perfil.',
        image: '/images/avatars/blue.svg', 
        type: 'avatar', 
        rarity: 'common',
        chance: 25
      },
      { 
        id: 'avatar-2', 
        name: 'Avatar Verde', 
        description: 'Um avatar verde para seu perfil.',
        image: '/images/avatars/green.svg', 
        type: 'avatar', 
        rarity: 'uncommon',
        chance: 15
      },
      { 
        id: 'banner-1', 
        name: 'Banner Iniciante', 
        description: 'Um banner simples para seu perfil.',
        image: '/images/banners/banner1.png', 
        type: 'banner', 
        rarity: 'common',
        chance: 30
      },
      { 
        id: 'effect-1', 
        name: 'Efeito de Perfil', 
        description: 'Um efeito visual para seu perfil.',
        image: '/images/cases/rewards/effect-basic.png', 
        type: 'effect', 
        rarity: 'rare',
        chance: 5
      },
    ]
  },
  {
    id: 'case-premium',
    name: 'Caixa Premium',
    description: 'Contém principalmente itens raros, com chances médias para ítens místicos.',
    price: 25,
    discount: 10,
    image: '/images/cases/premium-case.png',
    possibleRewards: [
      { 
        id: 'avatar-3', 
        name: 'Avatar Raro', 
        description: 'Um avatar raro para seu perfil.',
        image: '/images/avatars/purple.svg', 
        type: 'avatar', 
        rarity: 'rare',
        chance: 20
      },
      { 
        id: 'banner-2', 
        name: 'Banner Premium', 
        description: 'Um banner premium para seu perfil.',
        image: '/images/banners/banner2.png', 
        type: 'banner', 
        rarity: 'rare',
        chance: 25
      },
      { 
        id: 'skin-1', 
        name: 'Skin Arma de Fogo', 
        description: 'Uma skin exclusiva para sua arma.',
        image: '/images/cases/rewards/skin-weapon.png', 
        type: 'skin', 
        rarity: 'mythical',
        chance: 10
      },
    ]
  },
  {
    id: 'case-legendary',
    name: 'Caixa Lendária',
    description: 'Contém itens místicos e lendários, com chances pequenas para itens anciões e arcanos.',
    price: 50,
    image: '/images/cases/legendary-case.png',
    possibleRewards: [
      { 
        id: 'avatar-4', 
        name: 'Avatar Místico', 
        description: 'Um avatar místico para seu perfil.',
        image: '/images/cases/rewards/avatar-mythical.png', 
        type: 'avatar', 
        rarity: 'mythical',
        chance: 20
      },
      { 
        id: 'banner-3', 
        name: 'Banner Lendário', 
        description: 'Um banner lendário para seu perfil.',
        image: '/images/cases/rewards/banner-legendary.png', 
        type: 'banner', 
        rarity: 'legendary',
        chance: 15
      },
      { 
        id: 'skin-2', 
        name: 'Skin Lendária', 
        description: 'Uma skin lendária para seu personagem.',
        image: '/images/cases/rewards/skin-legendary.png', 
        type: 'skin', 
        rarity: 'legendary',
        chance: 8
      },
      { 
        id: 'effect-2', 
        name: 'Efeito Ancião', 
        description: 'Um efeito visual ancião para seu perfil.',
        image: '/images/cases/rewards/effect-ancient.png', 
        type: 'effect', 
        rarity: 'ancient',
        chance: 5
      },
      { 
        id: 'effect-3', 
        name: 'Efeito Arcano', 
        description: 'Um efeito visual arcano para seu perfil.',
        image: '/images/cases/rewards/effect-arcana.png', 
        type: 'effect', 
        rarity: 'arcana',
        chance: 2
      },
    ]
  }
];

export const CaseOpening = () => {
  const [isOpening, setIsOpening] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemReward | null>(null);
  const [rouletteItems, setRouletteItems] = useState<ItemReward[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [userBalance, setUserBalance] = useState(100); // Saldo simulado do usuário
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  
  // Seleciona uma caixa para abrir
  const selectCase = (caseItem: Case) => {
    setSelectedCase(caseItem);
  };
  
  // Iniciar a abertura da caixa
  const openCase = () => {
    if (!selectedCase) return;
    
    // Verificar se o usuário tem saldo suficiente
    if (userBalance < selectedCase.price) {
      setInsufficientFunds(true);
      setTimeout(() => setInsufficientFunds(false), 3000);
      return;
    }
    
    // Deduzir o preço da caixa do saldo
    setUserBalance(prev => prev - selectedCase.price);
    
    // Iniciar animação de abertura
    setIsOpening(true);
    
    // Gerar itens para a roleta
    const generatedItems = generateRouletteItems(selectedCase);
    setRouletteItems(generatedItems);
    
    // Simular a roleta e selecionar um item
    setTimeout(() => {
      // Obter o item que vai "ganhar" (geralmente é pré-determinado pelo servidor)
      // Aqui estamos pegando o item no meio da roleta para dar a impressão que parou nele
      const winningItem = generatedItems[Math.floor(generatedItems.length / 2)];
      setSelectedItem(winningItem);
      
      // Parar a roleta e iniciar a revelação após 4 segundos
      setTimeout(() => {
        setIsOpening(false);
        setIsRevealing(true);
      }, 4000);
    }, 500);
  };
  
  // Gerar itens para a roleta - em um sistema real, isto seria feito no servidor
  const generateRouletteItems = (caseItem: Case): ItemReward[] => {
    const items: ItemReward[] = [];
    
    // Determinar o item vencedor baseado nas probabilidades
    // Em um sistema real, isto seria determinado pelo servidor
    const winningIndex = determineWinningItem(caseItem.possibleRewards);
    const winningItem = caseItem.possibleRewards[winningIndex];
    
    // Gerar 50 itens para a roleta, com o item vencedor no meio
    for (let i = 0; i < 50; i++) {
      if (i === 25) {
        // Coloca o item vencedor no meio
        items.push(winningItem);
      } else {
        // Gera um item aleatório dos possíveis itens
        const randomIndex = Math.floor(Math.random() * caseItem.possibleRewards.length);
        items.push(caseItem.possibleRewards[randomIndex]);
      }
    }
    
    return items;
  };
  
  // Determinar qual item o usuário vai ganhar com base nas probabilidades
  const determineWinningItem = (possibleRewards: ItemReward[]): number => {
    // Soma de todas as chances
    const totalChance = possibleRewards.reduce((sum, item) => sum + item.chance, 0);
    
    // Gerar um número aleatório entre 0 e a soma total
    const randomValue = Math.random() * totalChance;
    
    // Encontrar o item correspondente a esse valor
    let accumulatedChance = 0;
    for (let i = 0; i < possibleRewards.length; i++) {
      accumulatedChance += possibleRewards[i].chance;
      if (randomValue <= accumulatedChance) {
        return i;
      }
    }
    
    // Retornar o último item por segurança
    return possibleRewards.length - 1;
  };
  
  // Fechar a revelação e voltar ao estado inicial
  const closeReveal = () => {
    setIsRevealing(false);
    setSelectedItem(null);
  };
  
  return (
    <div className="w-full">
      {/* Saldo do usuário */}
      <div className="flex justify-between items-center mb-8 bg-card-bg p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <DollarSign className="text-yellow-500" size={24} />
          <div>
            <div className="text-sm text-gray-400">Seu saldo</div>
            <div className="font-bold text-xl">{formatCurrency(userBalance)}</div>
          </div>
        </div>
        
        <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-semibold flex items-center gap-2">
          <DollarSign size={18} />
          Adicionar Fundos
        </button>
      </div>
      
      {/* Aviso de fundos insuficientes */}
      <AnimatePresence>
        {insufficientFunds && (
          <motion.div 
            className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <AlertTriangle className="text-red-500" size={20} />
            <p className="text-red-500">Saldo insuficiente para abrir esta caixa. Adicione mais fundos para continuar.</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Lista de caixas disponíveis */}
      {!isOpening && !isRevealing && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Caixas Disponíveis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleCases.map((caseItem) => (
              <CaseCard 
                key={caseItem.id} 
                caseItem={caseItem} 
                isSelected={selectedCase?.id === caseItem.id}
                onSelect={() => selectCase(caseItem)}
                onOpen={openCase}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Animação de abertura da caixa */}
      {isOpening && rouletteItems.length > 0 && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="w-full max-w-4xl px-4">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Abrindo: {selectedCase?.name}</h2>
              <button 
                onClick={() => setIsOpening(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <CaseRoulette items={rouletteItems} />
            
            <div className="mt-8 text-center">
              <p className="text-gray-300 animate-pulse">Abrindo caixa...</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Animação de revelação do item */}
      {isRevealing && selectedItem && (
        <ItemReveal item={selectedItem} onClose={closeReveal} />
      )}
    </div>
  );
};

// Componente para exibir cada caixa
interface CaseCardProps {
  caseItem: Case;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}

const CaseCard: React.FC<CaseCardProps> = ({ caseItem, isSelected, onSelect, onOpen }) => {
  return (
    <motion.div
      className={`bg-card-bg border-2 rounded-xl p-6 flex flex-col items-center transition-all ${
        isSelected ? 'border-purple-500 bg-purple-900/10' : 'border-gray-700 hover:border-gray-600'
      }`}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      onClick={onSelect}
    >
      <div className="relative w-32 h-32 mb-4">
        <Image
          src={caseItem.image}
          alt={caseItem.name}
          fill
          className="object-contain"
          // Usar imagem genérica se a imagem específica não estiver disponível
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/cases/default-case.png';
          }}
        />
        
        {caseItem.discount && (
          <div className="absolute -top-3 -right-3 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{caseItem.discount}%
          </div>
        )}
      </div>
      
      <h3 className="text-xl font-bold mb-1">{caseItem.name}</h3>
      <p className="text-gray-400 text-sm text-center mb-4 h-12 overflow-hidden">{caseItem.description}</p>
      
      <div className="flex items-center justify-between w-full mt-auto">
        <div className="flex items-center">
          <DollarSign className="text-yellow-500" size={18} />
          <span className="font-bold">
            {caseItem.discount 
              ? <span>
                  <span className="line-through text-gray-500 text-sm mr-1">{formatCurrency(caseItem.price)}</span>
                  {formatCurrency(caseItem.price * (1 - caseItem.discount / 100))}
                </span>
              : formatCurrency(caseItem.price)
            }
          </span>
        </div>
        
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Archive size={14} />
          <span>{caseItem.possibleRewards.length} itens</span>
        </div>
      </div>
      
      {isSelected && (
        <motion.button
          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg w-full flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          <Gift size={18} />
          Abrir Caixa
        </motion.button>
      )}
    </motion.div>
  );
};

// Componente de roleta - similar ao CS
interface CaseRouletteProps {
  items: ItemReward[];
}

const CaseRoulette: React.FC<CaseRouletteProps> = ({ items }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className="relative overflow-hidden h-40 bg-gray-900 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      {/* Marcador central */}
      <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-yellow-500 z-20 transform -translate-x-1/2"></div>
      <div className="absolute top-0 h-full w-24 left-1/2 transform -translate-x-1/2 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.7) 100%)',
          boxShadow: 'inset 0 0 20px 10px rgba(0, 0, 0, 0.3)'
        }}
      ></div>
      
      {/* Luz de destaque */}
      <div className="absolute top-0 bottom-0 left-1/2 w-40 transform -translate-x-1/2 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(138, 43, 226, 0.2) 0%, transparent 70%)',
        }}
      ></div>
      
      <div className="relative h-full" ref={containerRef}>
        <motion.div
          className="absolute top-0 flex items-center h-full"
          initial={{ x: 0 }}
          animate={{
            x: [0, -3000, -4000, -4100, -4150],
          }}
          transition={{
            duration: 4,
            times: [0, 0.5, 0.85, 0.95, 1],
            ease: "easeOut"
          }}
        >
          {items.map((item, index) => (
            <motion.div
              key={`${item.id}-${index}`}
              className="flex-shrink-0 w-48 h-32 mx-1 rounded-lg flex items-center justify-center relative border-2"
              style={{
                borderColor: rarities[item.rarity].color,
                background: `linear-gradient(to bottom, rgba(40, 40, 60, 0.8), rgba(25, 25, 35, 0.8))`,
                boxShadow: `0 0 10px ${rarities[item.rarity].glow}`
              }}
            >
              <div className="absolute inset-0 opacity-10" 
                style={{ 
                  background: `linear-gradient(135deg, ${rarities[item.rarity].color}33, transparent 70%)` 
                }} 
              />
              
              <div className="text-center p-2">
                <div className="relative w-20 h-20 mx-auto mb-1">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/avatar-placeholder.svg';
                    }}
                  />
                </div>
                <p className="text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis w-40 mx-auto" 
                  style={{ color: rarities[item.rarity].color }}
                >
                  {item.name}
                </p>
                <p className="text-xs text-gray-400">
                  {rarities[item.rarity].name}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

// Componente de revelação do item
interface ItemRevealProps {
  item: ItemReward;
  onClose: () => void;
}

const ItemReveal: React.FC<ItemRevealProps> = ({ item, onClose }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  
  useEffect(() => {
    // Mostrar confetti depois de um pequeno delay
    const timer = setTimeout(() => {
      setShowConfetti(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative text-center w-full max-w-xl"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Fundo de gradiente */}
          <motion.div
            className="absolute inset-0 rounded-3xl opacity-30"
            style={{ 
              background: `radial-gradient(circle at center, ${rarities[item.rarity].color}80 0%, transparent 70%)`,
              filter: 'blur(30px)'
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: [0, 0.3, 0.2], 
              scale: [0.5, 1.2, 1],
            }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          />
          
          {/* Efeito de partículas para items raros+ */}
          {showConfetti && ['legendary', 'ancient', 'arcana'].includes(item.rarity) && (
            <>
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{ 
                    background: rarities[item.rarity].color,
                    boxShadow: `0 0 5px ${rarities[item.rarity].color}`,
                    top: '50%',
                    left: '50%'
                  }}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    opacity: 0,
                    scale: 0 
                  }}
                  animate={{ 
                    x: Math.cos(i * 12 * Math.PI / 180) * (100 + Math.random() * 200), 
                    y: Math.sin(i * 12 * Math.PI / 180) * (100 + Math.random() * 200),
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.2]
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity, 
                    repeatType: 'loop',
                    delay: Math.random() * 0.5,
                    ease: "easeOut"
                  }}
                />
              ))}
            </>
          )}
          
          <motion.div
            className="relative z-10 bg-card-bg rounded-2xl overflow-hidden pb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* Banner Superior */}
            <div 
              className="py-6 px-4 text-center relative overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, rgba(30,30,40,0.8), rgba(20,20,30,0.8))` 
              }}
            >
              <div 
                className="absolute inset-0" 
                style={{ 
                  background: `linear-gradient(to right, transparent, ${rarities[item.rarity].color}33, transparent)`,
                  backgroundSize: '200% 100%'
                }}
              />
              
              <motion.h2
                className="text-2xl md:text-3xl font-bold mb-1 relative"
                style={{ color: rarities[item.rarity].color }}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Parabéns!
              </motion.h2>
              
              <motion.p 
                className="text-gray-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                Você conseguiu um item <span style={{ color: rarities[item.rarity].color }}>{rarities[item.rarity].name}</span>!
              </motion.p>
            </div>
            
            {/* Conteúdo */}
            <div className="p-6">
              <motion.div
                className="relative w-40 h-40 mx-auto mb-6"
                initial={{ scale: 0, rotateY: 180 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{ 
                  delay: 0.8, 
                  duration: 0.8,
                  type: "spring",
                  stiffness: 100
                }}
              >
                <div 
                  className="absolute inset-0 rounded-full" 
                  style={{ 
                    background: `radial-gradient(circle at center, ${rarities[item.rarity].color}33 0%, transparent 70%)`,
                    filter: 'blur(15px)'
                  }} 
                />
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-contain"
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/avatar-placeholder.svg';
                  }}
                />
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-r from-transparent via-gray-700/30 to-transparent h-px w-full my-4"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
              />
              
              <motion.h3
                className="text-xl font-bold mb-2"
                style={{ color: rarities[item.rarity].color }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                {item.name}
              </motion.h3>
              
              <motion.div
                className="flex items-center justify-center mb-4 gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.5 }}
              >
                <span className="text-sm py-1 px-2 rounded" style={{ 
                  backgroundColor: `${rarities[item.rarity].color}22`,
                  color: rarities[item.rarity].color,
                  border: `1px solid ${rarities[item.rarity].color}44`
                }}>
                  {rarities[item.rarity].name}
                </span>
                
                <span className="text-sm py-1 px-2 rounded bg-gray-800 text-gray-300">
                  {item.type === 'avatar' && 'Avatar'}
                  {item.type === 'banner' && 'Banner'}
                  {item.type === 'skin' && 'Skin'}
                  {item.type === 'effect' && 'Efeito'}
                </span>
              </motion.div>
              
              <motion.p
                className="text-gray-300 text-sm mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6, duration: 0.5 }}
              >
                {item.description}
              </motion.p>
              
              <motion.button
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 mx-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.5 }}
                onClick={onClose}
              >
                <span>Continuar</span>
                <ChevronRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CaseOpening; 