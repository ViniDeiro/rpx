import { NextRequest } from 'next/server';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    name?: string;
    email?: string;
    username?: string;
    role?: string;
  };
} 