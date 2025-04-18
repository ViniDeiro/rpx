import React from 'react';
import PropTypes from 'prop-types';
import {
  Announcement as AnnouncementIcon,
  SystemUpdateAlt as SystemIcon,
  SportsEsports as GameIcon,
  EmojiEvents as TournamentIcon,
  Group as TeamIcon,
  Message as MessageIcon,
  Notifications as DefaultIcon
} from '@mui/icons-material';

/**
 * Componente que renderiza o ícone apropriado para cada tipo de notificação
 */
const NotificationIcon = ({ type, size = 'medium', color = 'primary' }) => {
  // Função para determinar o tamanho do ícone
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      case 'medium':
      default:
        return 'medium';
    }
  };

  // Dicionário de ícones por tipo
  const iconMap = {
    announcement: <AnnouncementIcon fontSize={getIconSize()} color={color} />,
    system: <SystemIcon fontSize={getIconSize()} color={color} />,
    game: <GameIcon fontSize={getIconSize()} color={color} />,
    tournament: <TournamentIcon fontSize={getIconSize()} color={color} />,
    team: <TeamIcon fontSize={getIconSize()} color={color} />,
    message: <MessageIcon fontSize={getIconSize()} color={color} />,
    default: <DefaultIcon fontSize={getIconSize()} color={color} />
  };

  // Retorna o ícone apropriado ou o ícone padrão se o tipo não for reconhecido
  return iconMap[type] || iconMap.default;
};

NotificationIcon.propTypes = {
  /** Tipo de notificação */
  type: PropTypes.oneOf([
    'announcement', 
    'system', 
    'game', 
    'tournament', 
    'team', 
    'message'
  ]),
  /** Tamanho do ícone */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Cor do ícone (usando as cores do tema Material-UI) */
  color: PropTypes.string
};

NotificationIcon.defaultProps = {
  type: 'default',
  size: 'medium',
  color: 'primary'
};

export default NotificationIcon; 