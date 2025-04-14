"use client";

import React from 'react';
import CharacterDemo from '../../components/2d/CharacterDemo';
import '../../components/2d/Character2D.css';

export default function CharacterDemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-8">
      <div className="container px-4 mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Demonstração de Personagens RPX</h1>
        <CharacterDemo />
      </div>
    </div>
  );
} 