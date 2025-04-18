const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Caminho para o arquivo firebase-messaging-sw.js na pasta public
const swPath = path.join(__dirname, '../public/firebase-messaging-sw.js');

// Ler o conteúdo atual do arquivo
fs.readFile(swPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erro ao ler firebase-messaging-sw.js:', err);
    return;
  }

  // Substituir as variáveis de ambiente
  let updatedContent = data
    .replace('FIREBASE_API_KEY', process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '')
    .replace('FIREBASE_AUTH_DOMAIN', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '')
    .replace('FIREBASE_PROJECT_ID', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '')
    .replace('FIREBASE_STORAGE_BUCKET', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '')
    .replace('FIREBASE_MESSAGING_SENDER_ID', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '')
    .replace('FIREBASE_APP_ID', process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '');

  // Escrever o conteúdo atualizado no arquivo
  fs.writeFile(swPath, updatedContent, 'utf8', (err) => {
    if (err) {
      console.error('Erro ao atualizar firebase-messaging-sw.js:', err);
      return;
    }
    console.log('firebase-messaging-sw.js atualizado com sucesso!');
  });
}); 