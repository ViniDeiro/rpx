'use client';

import React from 'react';
import { AuthProvider as ContextAuthProvider } from '@/contexts/AuthContext';

export default function AuthProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ContextAuthProvider>
      {children}
    </ContextAuthProvider>
  );
} 