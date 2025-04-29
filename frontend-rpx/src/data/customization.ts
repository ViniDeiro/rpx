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
  
  // Banners PNG disponíveis
  {
    id: 'banner_1',
    name: 'Banner 1',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (1).png',
    rarity: 'raro',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_2',
    name: 'Banner 2',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (2).png',
    rarity: 'raro',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_3',
    name: 'Banner 3',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (3).png',
    rarity: 'raro',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_4',
    name: 'Banner 4',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (4).png',
    rarity: 'raro',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_7',
    name: 'Banner 7',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (7).png',
    rarity: 'raro',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_8',
    name: 'Banner 8',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (8).png',
    rarity: 'raro',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_9',
    name: 'Banner 9',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (9).png',
    rarity: 'raro',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_10',
    name: 'Banner 10',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (10).png',
    rarity: 'raro',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_11',
    name: 'Banner 11',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (11).png',
    rarity: 'épico',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_12',
    name: 'Banner 12',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (12).png',
    rarity: 'épico',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_14',
    name: 'Banner 14',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (14).png',
    rarity: 'épico',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_15',
    name: 'Banner 15',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (15).png',
    rarity: 'épico',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_17',
    name: 'Banner 17',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (17).png',
    rarity: 'épico',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_18',
    name: 'Banner 18',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (18).png',
    rarity: 'épico',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_19',
    name: 'Banner 19',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (19).png',
    rarity: 'épico',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_20',
    name: 'Banner 20',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (20).png',
    rarity: 'épico',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_22',
    name: 'Banner 22',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (22).png',
    rarity: 'épico',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_23',
    name: 'Banner 23',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (23).png',
    rarity: 'épico',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_24',
    name: 'Banner 24',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (24).png',
    rarity: 'épico',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_25',
    name: 'Banner 25',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (25).png',
    rarity: 'lendário',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_26',
    name: 'Banner 26',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (26).png',
    rarity: 'lendário',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_27',
    name: 'Banner 27',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (27).png',
    rarity: 'lendário',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_28',
    name: 'Banner 28',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (28).png',
    rarity: 'lendário',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_29',
    name: 'Banner 29',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (29).png',
    rarity: 'lendário',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_31',
    name: 'Banner 31',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (31).png',
    rarity: 'lendário',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_32',
    name: 'Banner 32',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (32).png',
    rarity: 'lendário',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_33',
    name: 'Banner 33',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (33).png',
    rarity: 'lendário',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_35',
    name: 'Banner 35',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (35).png',
    rarity: 'lendário',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'banner_36',
    name: 'Banner 36',
    description: 'Banner temático especial',
    image: '/images/banners/Banner (36).png',
    rarity: 'lendário',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  
  // Banners com nomes personalizados
  {
    id: 'coringa',
    name: 'Coringa',
    description: 'Banner temático do Coringa',
    image: '/images/banners/coringa.png',
    rarity: 'lendário',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'dosh',
    name: 'Dosh',
    description: 'Banner temático Dosh',
    image: '/images/banners/dosh.png',
    rarity: 'lendário',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'girl_samurai',
    name: 'Samurai Feminina',
    description: 'Banner temático de samurai feminina',
    image: '/images/banners/girl_samurai.png',
    rarity: 'lendário',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'goku',
    name: 'Goku',
    description: 'Banner temático de Goku',
    image: '/images/banners/goku.png',
    rarity: 'lendário',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'josh',
    name: 'Josh',
    description: 'Banner temático Josh',
    image: '/images/banners/josh.png',
    rarity: 'lendário',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'samurai',
    name: 'Samurai',
    description: 'Banner temático de samurai',
    image: '/images/banners/samurai.png',
    rarity: 'lendário',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
  },
  {
    id: 'zosh',
    name: 'Zosh',
    description: 'Banner temático Zosh',
    image: '/images/banners/zosh.png',
    rarity: 'lendário',
    unlockMethod: 'inicial',
    unlockCondition: 'disponível desde o início',
    unlockValue: 0
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