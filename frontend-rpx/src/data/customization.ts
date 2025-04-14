export type UnlockMethod = 'inicial' | 'level' | 'conquista' | 'torneio' | 'compra';

export interface CustomizationItem {
  id: string;
  name: string;
  description: string;
  image: string;
  rarity: 'comum' | 'raro' | 'épico' | 'lendário';
  unlockMethod: UnlockMethod;
  unlockCondition: string;
  unlockValue: number;
}

export const BANNERS: CustomizationItem[] = [
  // Banners iniciais
  {
    id: 'default',
    name: 'Padrão',
    description: 'Banner padrão do sistema',
    image: '/images/banners/default.svg',
    rarity: 'comum',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'blue_gradient',
    name: 'Gradiente Azul',
    description: 'Um elegante gradiente azul',
    image: '/images/banners/blue_gradient.svg',
    rarity: 'comum',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'green_gradient',
    name: 'Gradiente Verde',
    description: 'Um elegante gradiente verde',
    image: '/images/banners/green_gradient.svg',
    rarity: 'comum',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'purple_gradient',
    name: 'Gradiente Roxo',
    description: 'Um elegante gradiente roxo',
    image: '/images/banners/purple_gradient.svg',
    rarity: 'comum',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  
  // Banners desbloqueáveis por nível
  {
    id: 'stars',
    name: 'Estrelas Noturnas',
    description: 'Um céu estrelado para seu perfil',
    image: '/images/banners/stars.svg',
    rarity: 'raro',
    unlockMethod: 'level',
    unlockCondition: 'atingir nível',
    unlockValue: 5
  },
  {
    id: 'geometric',
    name: 'Geométrico',
    description: 'Padrões geométricos modernos',
    image: '/images/banners/geometric.svg',
    rarity: 'raro',
    unlockMethod: 'level',
    unlockCondition: 'atingir nível',
    unlockValue: 10
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Luzes neon vibrantes',
    image: '/images/banners/neon.svg',
    rarity: 'épico',
    unlockMethod: 'level',
    unlockCondition: 'atingir nível',
    unlockValue: 15
  },
  {
    id: 'cyber',
    name: 'Cyberpunk',
    description: 'Design futurista cyberpunk',
    image: '/images/banners/cyber.svg',
    rarity: 'épico',
    unlockMethod: 'level',
    unlockCondition: 'atingir nível',
    unlockValue: 20
  },
  
  // Banners desbloqueáveis por conquistas
  {
    id: 'champion',
    name: 'Campeão',
    description: 'Reservado para verdadeiros campeões',
    image: '/images/banners/champion.svg',
    rarity: 'épico',
    unlockMethod: 'conquista',
    unlockCondition: 'vencer torneio regional',
    unlockValue: 1
  },
  {
    id: 'golden',
    name: 'Dourado',
    description: 'O brilho do ouro para os vencedores',
    image: '/images/banners/golden.svg',
    rarity: 'lendário',
    unlockMethod: 'conquista',
    unlockCondition: 'vencer torneio nacional',
    unlockValue: 1
  },
  
  // Banners temáticos (torneios)
  {
    id: 'worldcup',
    name: 'Copa do Mundo',
    description: 'Temático da Copa do Mundo',
    image: '/images/banners/worldcup.svg',
    rarity: 'épico',
    unlockMethod: 'torneio',
    unlockCondition: 'participar do evento da Copa',
    unlockValue: 1
  },
  {
    id: 'league',
    name: 'Liga dos Campeões',
    description: 'Temático da Liga dos Campeões',
    image: '/images/banners/league.svg',
    rarity: 'épico',
    unlockMethod: 'torneio',
    unlockCondition: 'participar do evento da Liga',
    unlockValue: 1
  },
  
  // Banners exclusivos (compráveis)
  {
    id: 'vip',
    name: 'VIP',
    description: 'Banner exclusivo para membros VIP',
    image: '/images/banners/vip.svg',
    rarity: 'lendário',
    unlockMethod: 'compra',
    unlockCondition: 'adquirir na loja por',
    unlockValue: 5000
  },
  {
    id: 'diamond',
    name: 'Diamante',
    description: 'Luxo e exclusividade',
    image: '/images/banners/diamond.svg',
    rarity: 'lendário',
    unlockMethod: 'compra',
    unlockCondition: 'adquirir na loja por',
    unlockValue: 10000
  }
];

export const AVATARS: CustomizationItem[] = [
  // Avatares iniciais
  {
    id: 'default',
    name: 'Padrão',
    description: 'Avatar padrão do sistema',
    image: '/images/avatars/default.svg',
    rarity: 'comum',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'blue',
    name: 'Azul',
    description: 'Avatar com tema azul',
    image: '/images/avatars/blue.svg',
    rarity: 'comum',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'green',
    name: 'Verde',
    description: 'Avatar com tema verde',
    image: '/images/avatars/green.svg',
    rarity: 'comum',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'purple',
    name: 'Roxo',
    description: 'Avatar com tema roxo',
    image: '/images/avatars/purple.svg',
    rarity: 'comum',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  
  // Avatares desbloqueáveis por nível
  {
    id: 'ninja',
    name: 'Ninja',
    description: 'Um ninja misterioso',
    image: '/images/avatars/ninja.svg',
    rarity: 'raro',
    unlockMethod: 'level',
    unlockCondition: 'atingir nível',
    unlockValue: 5
  },
  {
    id: 'rocket',
    name: 'Foguete',
    description: 'Para os que estão decolando',
    image: '/images/avatars/rocket.svg',
    rarity: 'raro',
    unlockMethod: 'level',
    unlockCondition: 'atingir nível',
    unlockValue: 10
  },
  
  // Avatares desbloqueáveis por conquistas
  {
    id: 'crown',
    name: 'Coroa',
    description: 'Uma coroa para a realeza',
    image: '/images/avatars/crown.svg',
    rarity: 'épico',
    unlockMethod: 'conquista',
    unlockCondition: 'ganhar 10 apostas consecutivas',
    unlockValue: 1
  },
  {
    id: 'trophy',
    name: 'Troféu',
    description: 'Um troféu para os campeões',
    image: '/images/avatars/trophy.svg',
    rarity: 'lendário',
    unlockMethod: 'conquista',
    unlockCondition: 'vencer um torneio oficial',
    unlockValue: 1
  },
  
  // Avatares exclusivos (compráveis)
  {
    id: 'dragon',
    name: 'Dragão',
    description: 'Um poderoso dragão',
    image: '/images/avatars/dragon.svg',
    rarity: 'épico',
    unlockMethod: 'compra',
    unlockCondition: 'adquirir na loja por',
    unlockValue: 3000
  },
  {
    id: 'phoenix',
    name: 'Fênix',
    description: 'Uma fênix renascida das cinzas',
    image: '/images/avatars/phoenix.svg',
    rarity: 'lendário',
    unlockMethod: 'compra',
    unlockCondition: 'adquirir na loja por',
    unlockValue: 7500
  }
];

// Função auxiliar para verificar se um item está desbloqueado
export function isItemUnlocked(item: CustomizationItem, userLevel: number, userAchievements: string[], userPurchases: string[]): boolean {
  if (item.unlockMethod === 'inicial') {
    return true;
  }
  
  if (item.unlockMethod === 'level') {
    return userLevel >= item.unlockValue;
  }
  
  if (item.unlockMethod === 'conquista') {
    return userAchievements.includes(item.id);
  }
  
  if (item.unlockMethod === 'torneio') {
    return userAchievements.includes(`tournament_${item.id}`);
  }
  
  if (item.unlockMethod === 'compra') {
    return userPurchases.includes(item.id);
  }
  
  return false;
} 