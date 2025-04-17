export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  username?: string;
  role?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSession {
  user: User;
  expires: string;
}

export interface Friend extends Omit<User, 'status'> {
  status?: 'pending' | 'accepted' | 'rejected';
  requestedBy?: string;
  requestedAt?: string;
  acceptedAt?: string;
}

export interface UserWithFriends extends User {
  friends: Friend[];
}

export interface SimplifiedUser {
  id: string;
  name: string;
  image?: string;
  username?: string;
}

export interface UserListItem {
  id: string;
  name: string;
  image?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  lastActive?: string;
} 