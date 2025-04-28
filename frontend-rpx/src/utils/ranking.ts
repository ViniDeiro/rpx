// Tipos para o sistema de ranking
export type RankTier = 'unranked' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legend' | 'challenger';
export type RankDivision = '1' | '2' | '3' | null; // null para Legend e Challenger que não têm divisões

export interface Rank {
  tier: RankTier;
  division: RankDivision;
  name: string;
  points: number;
  nextRankPoints: number;
  color: string;
  borderColor: string;
  image: string;
  requiredPointsForPromotion: number;
  nextRank?: string; // Nome do próximo rank
  position?: number; // Posição no ranking (para Legend e Challenger)
}

export interface RankProgress {
  currentPoints: number;
  pointsForNextTier: number;
  pointsForNextDivision: number;
  progressPercentage: number;
  isInPromotionSeries: boolean;
  winsRequired: number;
  promotionWins: number;
  promotionLosses: number;
}

// Configuração de pontos para cada rank
export const RANK_CONFIG = {
  unranked: { min: 0, max: 0 },
  bronze: { 
    '1': { min: 1, max: 99 },
    '2': { min: 100, max: 199 },
    '3': { min: 200, max: 299 },
  },
  silver: { 
    '1': { min: 300, max: 399 },
    '2': { min: 400, max: 499 },
    '3': { min: 500, max: 599 },
  },
  gold: { 
    '1': { min: 600, max: 699 },
    '2': { min: 700, max: 799 },
    '3': { min: 800, max: 899 },
  },
  platinum: { 
    '1': { min: 900, max: 999 },
    '2': { min: 1000, max: 1099 },
    '3': { min: 1100, max: 1199 },
  },
  diamond: { 
    '1': { min: 1200, max: 1299 },
    '2': { min: 1300, max: 1399 },
    '3': { min: 1400, max: 1499 },
  },
  legend: { min: 1500, max: 2000 }, // Baseado em posição (TOP 21-100)
  challenger: { min: 2001, max: Infinity }, // Baseado em posição (TOP 20)
};

// Informações estéticas para cada rank
export const RANK_FRAMES: Record<RankTier, Omit<Partial<Rank>, 'division' | 'points' | 'nextRankPoints' | 'requiredPointsForPromotion'>> = {
  unranked: {
    tier: 'unranked',
    name: 'Novato',
    color: 'from-gray-300 to-gray-400',
    borderColor: 'border-gray-300',
    image: '/images/ranks/unranked.png'
  },
  bronze: {
    tier: 'bronze',
    name: 'Bronze',
    color: 'from-amber-700 to-amber-800',
    borderColor: 'border-amber-700',
    image: '/images/ranks/bronze.png'
  },
  silver: {
    tier: 'silver',
    name: 'Silver',
    color: 'from-gray-400 to-gray-500',
    borderColor: 'border-gray-400',
    image: '/images/ranks/silver.png'
  },
  gold: {
    tier: 'gold',
    name: 'Gold',
    color: 'from-yellow-500 to-yellow-600',
    borderColor: 'border-yellow-500',
    image: '/images/ranks/gold.png'
  },
  platinum: {
    tier: 'platinum',
    name: 'Platinum',
    color: 'from-teal-400 to-teal-500',
    borderColor: 'border-teal-400',
    image: '/images/ranks/platinum.png'
  },
  diamond: {
    tier: 'diamond',
    name: 'Diamond',
    color: 'from-blue-400 to-blue-500',
    borderColor: 'border-blue-400',
    image: '/images/ranks/diamond.png'
  },
  legend: {
    tier: 'legend',
    name: 'Legend',
    color: 'from-purple-500 to-purple-600',
    borderColor: 'border-purple-500',
    image: '/images/ranks/legend.png'
  },
  challenger: {
    tier: 'challenger',
    name: 'Challenger',
    color: 'from-fuchsia-500 to-fuchsia-600',
    borderColor: 'border-fuchsia-500',
    image: '/images/ranks/challenger.png'
  }
};

// Função para calcular o rank baseado nos pontos e posição no ranking
export const calculateRank = (points: number, position?: number): Rank => {
  // Verificar primeiro se está nos rankings de topo
  if (position !== undefined) {
    if (position <= 20) {
      return {
        tier: 'challenger',
        division: null,
        name: 'Challenger',
        points,
        nextRankPoints: Infinity,
        color: RANK_FRAMES.challenger.color || '',
        borderColor: RANK_FRAMES.challenger.borderColor || '',
        image: RANK_FRAMES.challenger.image || '',
        requiredPointsForPromotion: Infinity,
        position
      };
    } else if (position <= 100) {
      return {
        tier: 'legend',
        division: null,
        name: 'Legend',
        points,
        nextRankPoints: Infinity,
        color: RANK_FRAMES.legend.color || '',
        borderColor: RANK_FRAMES.legend.borderColor || '',
        image: RANK_FRAMES.legend.image || '',
        requiredPointsForPromotion: Infinity,
        position
      };
    }
  }

  // Se não tem pontos, é unranked
  if (points === 0) {
    return {
      tier: 'unranked',
      division: null,
      name: 'Novato',
      points: 0,
      nextRankPoints: 1,
      color: RANK_FRAMES.unranked.color || '',
      borderColor: RANK_FRAMES.unranked.borderColor || '',
      image: RANK_FRAMES.unranked.image || '',
      requiredPointsForPromotion: 1,
      nextRank: 'Bronze 1'
    };
  }

  // Determinar o tier e divisão baseado nos pontos
  let tier: RankTier = 'bronze';
  let division: RankDivision = '1';
  let nextRankPoints = 100; // Default para próximo rank
  let requiredPointsForPromotion = 100;
  let nextRank = 'Bronze 2';

  // Verificar cada tier e divisão
  if (points >= 1400) {
    tier = 'diamond';
    division = '3';
    nextRankPoints = 1500;
    requiredPointsForPromotion = 1500;
    nextRank = 'Posição TOP 100';
  } else if (points >= 1300) {
    tier = 'diamond';
    division = '2';
    nextRankPoints = 1400;
    requiredPointsForPromotion = 1400;
    nextRank = 'Diamond 3';
  } else if (points >= 1200) {
    tier = 'diamond';
    division = '1';
    nextRankPoints = 1300;
    requiredPointsForPromotion = 1300;
    nextRank = 'Diamond 2';
  } else if (points >= 1100) {
    tier = 'platinum';
    division = '3';
    nextRankPoints = 1200;
    requiredPointsForPromotion = 1200;
    nextRank = 'Diamond 1';
  } else if (points >= 1000) {
    tier = 'platinum';
    division = '2';
    nextRankPoints = 1100;
    requiredPointsForPromotion = 1100;
    nextRank = 'Platinum 3';
  } else if (points >= 900) {
    tier = 'platinum';
    division = '1';
    nextRankPoints = 1000;
    requiredPointsForPromotion = 1000;
    nextRank = 'Platinum 2';
  } else if (points >= 800) {
    tier = 'gold';
    division = '3';
    nextRankPoints = 900;
    requiredPointsForPromotion = 900;
    nextRank = 'Platinum 1';
  } else if (points >= 700) {
    tier = 'gold';
    division = '2';
    nextRankPoints = 800;
    requiredPointsForPromotion = 800;
    nextRank = 'Gold 3';
  } else if (points >= 600) {
    tier = 'gold';
    division = '1';
    nextRankPoints = 700;
    requiredPointsForPromotion = 700;
    nextRank = 'Gold 2';
  } else if (points >= 500) {
    tier = 'silver';
    division = '3';
    nextRankPoints = 600;
    requiredPointsForPromotion = 600;
    nextRank = 'Gold 1';
  } else if (points >= 400) {
    tier = 'silver';
    division = '2';
    nextRankPoints = 500;
    requiredPointsForPromotion = 500;
    nextRank = 'Silver 3';
  } else if (points >= 300) {
    tier = 'silver';
    division = '1';
    nextRankPoints = 400;
    requiredPointsForPromotion = 400;
    nextRank = 'Silver 2';
  } else if (points >= 200) {
    tier = 'bronze';
    division = '3';
    nextRankPoints = 300;
    requiredPointsForPromotion = 300;
    nextRank = 'Silver 1';
  } else if (points >= 100) {
    tier = 'bronze';
    division = '2';
    nextRankPoints = 200;
    requiredPointsForPromotion = 200;
    nextRank = 'Bronze 3';
  } else if (points >= 1) {
    tier = 'bronze';
    division = '1';
    nextRankPoints = 100;
    requiredPointsForPromotion = 100;
    nextRank = 'Bronze 2';
  }

  return {
    tier,
    division,
    name: `${RANK_FRAMES[tier].name} ${division}`,
    points,
    nextRankPoints,
    color: RANK_FRAMES[tier].color || '',
    borderColor: RANK_FRAMES[tier].borderColor || '',
    image: RANK_FRAMES[tier].image || '',
    requiredPointsForPromotion,
    nextRank
  };
};

// Calcular progresso do rank
export const calculateRankProgress = (rank: Rank): RankProgress => {
  if (rank.tier === 'legend' || rank.tier === 'challenger') {
    // Para Legend e Challenger, o progresso é baseado em posição, não em pontos
    return {
      currentPoints: rank.points,
      pointsForNextTier: Infinity,
      pointsForNextDivision: Infinity,
      progressPercentage: 100, // Já está no topo
      isInPromotionSeries: false,
      winsRequired: 0,
      promotionWins: 0,
      promotionLosses: 0
    };
  }
  
  if (rank.tier === 'unranked') {
    return {
      currentPoints: 0,
      pointsForNextTier: 1,
      pointsForNextDivision: 1,
      progressPercentage: 0,
      isInPromotionSeries: false,
      winsRequired: 0,
      promotionWins: 0,
      promotionLosses: 0
    };
  }
  
  // Para outros ranks, calcular o progresso para o próximo tier/divisão
  const tierConfig = RANK_CONFIG[rank.tier] as { [key: string]: { min: number; max: number } };
  const minPoints = rank.tier === 'bronze' && rank.division === '1' ? 1 : 
                    tierConfig[rank.division as string].min;
  const maxPoints = tierConfig[rank.division as string].max;
  const currentProgress = rank.points - minPoints;
  const totalRange = maxPoints - minPoints;
  const progressPercentage = Math.min((currentProgress / totalRange) * 100, 100);
  
  const pointsForNextDivision = rank.requiredPointsForPromotion - rank.points;
  
  // Série de promoção - ativa quando estiver perto de promover para outra divisão
  const isInPromotionSeries = progressPercentage >= 90;
  
  return {
    currentPoints: rank.points,
    pointsForNextTier: pointsForNextDivision,
    pointsForNextDivision,
    progressPercentage,
    isInPromotionSeries,
    winsRequired: 3, // Simplificado para 3 vitórias para promoção
    promotionWins: 0, // Seria atualizado com dados do backend
    promotionLosses: 0 // Seria atualizado com dados do backend
  };
};

// Calcular pontos ganhos/perdidos por uma partida
export const calculateMatchPoints = (
  isVictory: boolean,
  betAmount: number = 0
): number => {
  // No novo sistema, independente do valor da aposta, os pontos são fixos
  if (isVictory) {
    return 50; // Vitória sempre dá 50 pontos
  } else {
    return -10; // Derrota sempre perde 10 pontos
  }
};

// Determinar rank inicial após partidas de colocação
export const calculateInitialRank = (placementWins: number): Rank => {
  let initialPoints = 0;
  
  // Simplificado para o novo sistema
  initialPoints = placementWins * 50; // Cada vitória dá 50 pontos
  
  return calculateRank(initialPoints);
};

// Exportando funções auxiliares que podem ser removidas ou adaptadas conforme necessário
export const calculateDecay = (lastPlayedDays: number, currentRank: Rank): number => {
  // Função mantida para compatibilidade
  return 0;
};

export const calculateSeasonReset = (currentRank: Rank): number => {
  // Função mantida para compatibilidade
  return currentRank.points;
}; 