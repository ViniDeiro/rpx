/**
 * Utilitário para gerenciar caminhos de imagens e fornecer fallbacks
 */

export const ImagePaths = {
  // Logo
  logo: '/images/logo.png',
  
  // Avatares e perfis
  avatarPlaceholder: '/images/avatar-placeholder.svg',
  getUserAvatar: (avatarPath?: string) => avatarPath || '/images/avatar-placeholder.svg',
  
  // Times
  teamPlaceholder: '/images/team-placeholder.svg',
  getTeamLogo: (logoPath?: string) => logoPath || '/images/team-placeholder.svg',
  
  // Torneios
  tournamentPlaceholder: '/images/tournament-placeholder.svg',
  getTournamentImage: (imagePath?: string) => imagePath || '/images/tournament-placeholder.svg',
  
  // Utilidades
  isValid: (path?: string) => {
    if (!path) return false;
    // Verificar se é uma URL externa ou um caminho local válido
    return path.startsWith('http') || path.startsWith('/');
  }
};

export default ImagePaths; 