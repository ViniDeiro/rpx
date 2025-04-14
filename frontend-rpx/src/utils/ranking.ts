// Tipos para o sistema de ranking
export type RankTier = 'bronze' | 'prata' | 'ouro' | 'platina' | 'diamante' | 'mestre' | 'challenger';
export type RankDivision = 'IV' | 'III' | 'II' | 'I' | null; // null para Mestre e Challenger que não têm divisões

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
  bronze: { min: 0, max: 299 },
  prata: { min: 300, max: 699 },
  ouro: { min: 700, max: 1199 },
  platina: { min: 1200, max: 1799 },
  diamante: { min: 1800, max: 2499 },
  mestre: { min: 2500, max: 3499 },
  challenger: { min: 3500, max: Infinity },
};

// Informações estéticas para cada rank
export const RANK_FRAMES: Record<RankTier, Omit<Rank, 'division' | 'points' | 'nextRankPoints' | 'requiredPointsForPromotion'>> = {
  bronze: {
    tier: 'bronze',
    name: 'Bronze',
    color: 'from-amber-700 to-amber-800',
    borderColor: 'border-amber-700',
    image: '/images/ranks/bronze.svg'
  },
  prata: {
    tier: 'prata',
    name: 'Prata',
    color: 'from-gray-400 to-gray-500',
    borderColor: 'border-gray-400',
    image: '/images/ranks/prata.svg'
  },
  ouro: {
    tier: 'ouro',
    name: 'Ouro',
    color: 'from-yellow-500 to-yellow-600',
    borderColor: 'border-yellow-500',
    image: '/images/ranks/ouro.svg'
  },
  platina: {
    tier: 'platina',
    name: 'Platina',
    color: 'from-teal-400 to-teal-500',
    borderColor: 'border-teal-400',
    image: '/images/ranks/platina.svg'
  },
  diamante: {
    tier: 'diamante',
    name: 'Diamante',
    color: 'from-blue-400 to-blue-500',
    borderColor: 'border-blue-400',
    image: '/images/ranks/diamond.svg'
  },
  mestre: {
    tier: 'mestre',
    name: 'Mestre',
    color: 'from-purple-500 to-purple-600',
    borderColor: 'border-purple-500',
    image: '/images/ranks/mestre.svg'
  },
  challenger: {
    tier: 'challenger',
    name: 'Challenger',
    color: 'from-fuchsia-500 to-fuchsia-600',
    borderColor: 'border-fuchsia-500',
    image: '/images/ranks/challenger.svg'
  }
};

// Função para calcular o rank baseado nos pontos
export const calculateRank = (points: number): Rank => {
  // Determinar o tier (bronze, prata, etc.)
  let tier: RankTier = 'bronze';
  for (const [t, range] of Object.entries(RANK_CONFIG)) {
    if (points >= range.min && points <= range.max) {
      tier = t as RankTier;
      break;
    }
  }

  // Calcular divisão (IV, III, II, I) para tiers que têm divisões
  let division: RankDivision = null;
  if (tier !== 'mestre' && tier !== 'challenger') {
    const tierRange = RANK_CONFIG[tier].max - RANK_CONFIG[tier].min;
    const divisionSize = tierRange / 4;
    const tierProgress = points - RANK_CONFIG[tier].min;
    
    if (tierProgress < divisionSize) division = 'IV';
    else if (tierProgress < divisionSize * 2) division = 'III';
    else if (tierProgress < divisionSize * 3) division = 'II';
    else division = 'I';
  }

  // Calcular pontos necessários para o próximo tier
  const tierIndex = Object.keys(RANK_CONFIG).indexOf(tier);
  const nextTier = Object.keys(RANK_CONFIG)[tierIndex + 1] as RankTier | undefined;
  const nextRankPoints = nextTier ? RANK_CONFIG[nextTier].min : Infinity;
  
  // Pontos necessários para promoção (próxima divisão ou próximo tier)
  let requiredPointsForPromotion;
  if (tier !== 'mestre' && tier !== 'challenger' && division !== 'I') {
    // Promoção para próxima divisão no mesmo tier
    const tierRange = RANK_CONFIG[tier].max - RANK_CONFIG[tier].min;
    const divisionSize = tierRange / 4;
    const currentDivIndex = ['IV', 'III', 'II', 'I'].indexOf(division as string);
    requiredPointsForPromotion = RANK_CONFIG[tier].min + (currentDivIndex + 1) * divisionSize;
  } else if (nextTier) {
    // Promoção para o próximo tier
    requiredPointsForPromotion = RANK_CONFIG[nextTier].min;
  } else {
    // Já está no rank mais alto
    requiredPointsForPromotion = Infinity;
  }

  return {
    tier,
    division,
    name: `${RANK_FRAMES[tier].name}${division ? ' ' + division : ''}`,
    points,
    nextRankPoints,
    color: RANK_FRAMES[tier].color,
    borderColor: RANK_FRAMES[tier].borderColor,
    image: RANK_FRAMES[tier].image,
    requiredPointsForPromotion
  };
};

// Calcular progresso do rank
export const calculateRankProgress = (rank: Rank): RankProgress => {
  const tierConfig = RANK_CONFIG[rank.tier];
  const currentTierMin = tierConfig.min;
  const currentTierMax = tierConfig.max;
  
  let pointsForNextTier = Infinity;
  let pointsForNextDivision = Infinity;
  let progressPercentage = 0;
  
  if (rank.tier !== 'challenger') {
    const nextTierKey = Object.keys(RANK_CONFIG)[Object.keys(RANK_CONFIG).indexOf(rank.tier) + 1] as RankTier;
    if (nextTierKey) {
      pointsForNextTier = RANK_CONFIG[nextTierKey].min - rank.points;
    }
  }
  
  if (rank.tier !== 'mestre' && rank.tier !== 'challenger' && rank.division) {
    const divisionSize = (currentTierMax - currentTierMin) / 4;
    const divisionIndex = ['IV', 'III', 'II', 'I'].indexOf(rank.division);
    const currentDivisionMin = currentTierMin + divisionSize * divisionIndex;
    const currentDivisionMax = currentTierMin + divisionSize * (divisionIndex + 1);
    
    pointsForNextDivision = divisionIndex < 3 
      ? currentDivisionMax - rank.points 
      : pointsForNextTier;
    
    // Progresso percentual dentro da divisão atual
    progressPercentage = ((rank.points - currentDivisionMin) / (currentDivisionMax - currentDivisionMin)) * 100;
  } else {
    // Progresso percentual dentro do tier (para Mestre e Challenger)
    const totalPointsInTier = currentTierMax - currentTierMin;
    const pointsInCurrentTier = rank.points - currentTierMin;
    progressPercentage = Math.min((pointsInCurrentTier / totalPointsInTier) * 100, 100);
  }
  
  // Série de promoção - ativa quando estiver perto de promover para outra divisão ou tier
  const isInPromotionSeries = rank.tier !== 'challenger' && (
    (rank.division === 'I' && rank.points >= currentTierMax - 50) || 
    (rank.division !== null && rank.division !== 'I' && progressPercentage >= 90)
  );
  
  return {
    currentPoints: rank.points,
    pointsForNextTier,
    pointsForNextDivision,
    progressPercentage,
    isInPromotionSeries,
    winsRequired: rank.division === 'I' ? 5 : 3, // Mais jogos para promoção de tier
    promotionWins: 0, // Seria atualizado com dados do backend
    promotionLosses: 0 // Seria atualizado com dados do backend
  };
};

// Calcular pontos ganhos/perdidos por uma partida
export const calculateMatchPoints = (
  isVictory: boolean,
  matchType: 'normal' | 'ranked' | 'tournament',
  streak: number = 0,
  isMvp: boolean = false,
  tournamentCompleted: boolean = false
): number => {
  let points = 0;
  
  // Pontos base por tipo de partida
  if (isVictory) {
    switch (matchType) {
      case 'normal':
        points += 20;
        break;
      case 'ranked':
        points += 25;
        break;
      case 'tournament':
        points += 30;
        break;
    }
    
    // Bônus por sequência de vitórias
    const streakBonus = Math.min(streak * 2, 10);
    points += streakBonus;
    
    // Bônus por ser MVP
    if (isMvp) points += 5;
    
  } else {
    // Pontos perdidos por derrota
    switch (matchType) {
      case 'normal':
        points -= 10;
        break;
      case 'ranked':
        points -= 15;
        break;
      case 'tournament':
        points -= 10; // Penalidade reduzida em torneios
        break;
    }
  }
  
  // Bônus por completar torneio, independente do resultado
  if (tournamentCompleted && matchType === 'tournament') {
    points += 15;
  }
  
  return points;
};

// Calcular decaimento de pontos por inatividade
export const calculateDecay = (lastPlayedDays: number, currentRank: Rank): number => {
  if (lastPlayedDays < 15) return 0;
  
  const daysInactive = lastPlayedDays - 14; // Começa a decair após 14 dias
  const decayPoints = daysInactive * 5; // 5 pontos por dia
  
  // Limite de decaimento: uma divisão principal (não pode cair mais que isso)
  const maxDecay = currentRank.tier === 'bronze' 
    ? 0 // Não decai no Bronze
    : RANK_CONFIG[currentRank.tier].min - currentRank.points + 1; // +1 para garantir que não caia de tier
  
  return Math.min(decayPoints, Math.max(0, maxDecay));
};

// Calcular pontos mantidos após reset de temporada
export const calculateSeasonReset = (currentRank: Rank): number => {
  const resetPercentages: Record<RankTier, number> = {
    bronze: 1.0, // 100%
    prata: 0.8,  // 80%
    ouro: 0.7,   // 70%
    platina: 0.6, // 60%
    diamante: 0.5, // 50%
    mestre: 0.4,  // 40%
    challenger: 0.3 // 30%
  };
  
  return Math.floor(currentRank.points * resetPercentages[currentRank.tier]);
};

// Determinar rank inicial após partidas de colocação
export const calculateInitialRank = (placementWins: number): Rank => {
  let initialPoints = 0;
  
  if (placementWins <= 2) {
    // Bronze IV
    initialPoints = RANK_CONFIG.bronze.min;
  } else if (placementWins <= 4) {
    // Bronze II
    const divisionSize = (RANK_CONFIG.bronze.max - RANK_CONFIG.bronze.min) / 4;
    initialPoints = RANK_CONFIG.bronze.min + divisionSize * 2;
  } else if (placementWins <= 6) {
    // Prata IV
    initialPoints = RANK_CONFIG.prata.min;
  } else if (placementWins <= 8) {
    // Prata II
    const divisionSize = (RANK_CONFIG.prata.max - RANK_CONFIG.prata.min) / 4;
    initialPoints = RANK_CONFIG.prata.min + divisionSize * 2;
  } else {
    // Ouro IV
    initialPoints = RANK_CONFIG.ouro.min;
  }
  
  return calculateRank(initialPoints);
}; 