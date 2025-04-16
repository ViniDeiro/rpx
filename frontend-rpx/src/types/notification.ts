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

export interface Notification {
  _id: string | ObjectId;
  userId: string | ObjectId;
  type: 'lobby_invite' | 'friend_request' | 'system';
  read: boolean;
  data: NotificationData;
  createdAt: Date | string;
} 