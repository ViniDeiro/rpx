import React from 'react';
import Head from 'next/head';
import CharacterDemo from '../components/2d/CharacterDemo';

export default function CharacterDemoPage() {
  return (
    <>
      <Head>
        <title>Demonstração de Personagens RPX</title>
        <meta name="description" content="Demonstração de personagens 2D para o projeto RPX" />
      </Head>
      
      <main>
        <CharacterDemo />
      </main>
    </>
  );
} 