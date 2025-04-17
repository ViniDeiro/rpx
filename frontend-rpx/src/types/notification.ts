import { ObjectId } from 'mongodb';

export interface User {
  _id: string | ObjectId;
  username: string;
  avatar?: string;
}

export interface LobbyInvite {
  _id: string | ObjectId;
  lobbyId: string | ObjectId;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date | string;
}

export interface FriendRequest {
  _id: string | ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date | string;
}

export interface NotificationData {
  inviter?: User;
  invite?: LobbyInvite;
  requester?: User;
  request?: FriendRequest;
  message?: string;
}

// Interface base para notificações
export interface BaseNotification {
  _id: string | ObjectId;
  type: 'lobby_invite' | 'friend_request' | 'system';
  read: boolean;
  createdAt: Date | string;
}

// Notificação no formato padrão do sistema
export interface StandardNotification extends BaseNotification {
  userId: string | ObjectId;
  data: NotificationData;
}

// Notificação de convite de lobby (formato direto do banco de dados)
export interface DirectLobbyInviteNotification extends BaseNotification {
  inviter: string | ObjectId;
  recipient: string | ObjectId;
  lobbyId: string | ObjectId;
  gameMode?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  inviterName?: string;
  inviterAvatar?: string;
  lobbyName?: string;
}

// União dos tipos para suportar ambos os formatos
export type Notification = StandardNotification | DirectLobbyInviteNotification; 