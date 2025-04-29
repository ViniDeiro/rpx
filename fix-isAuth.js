const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Lista de arquivos que precisam ser corrigidos para !isAuth: !userId
const filesToFixIsAuth = [
  'src/app/api/user/bets/route.js',
  'src/app/api/tournaments/[id]/matches/[matchId]/result/route.js',
  'src/app/api/matches/submit-result/route.js',
  'src/app/api/matches/configure-room/route.js',
  'src/app/api/notifications/route.js',
  'src/app/api/notifications/count/route.js',
  'src/app/api/matchmaking/cancel/route.js',
  'src/app/api/lobby/route.js',
  'src/app/api/match/[id]/evidence/route.js',
  'src/app/api/lobby/matchmaking/route.js',
  'src/app/api/lobby/kick/route.js',
  'src/app/api/match/[id]/bet/route.js',
  'src/app/api/lobby/invite/route.js',
  'src/app/api/lobby/invite/send/route.js',
  'src/app/api/lobby/invite/accept/route.js',
  'src/app/api/lobby/invite/reject/route.js'
];

// Lista de arquivos que precisam ser corrigidos para !session: !session.user
const filesToFixSession = [
  'src/app/api/tournaments/[id]/matches/[matchId]/result/route.js',
  'src/app/api/test-lobby-invite/route.js',
  'src/app/api/matchmaking/find/route.js',
  'src/app/api/notifications/count/route.js',
  'src/app/api/matches/submit-result/route.js',
  'src/app/api/matches/configure-room/route.js',
  'src/app/api/lobby/invite/reject/route.js'
];

async function fixFiles() {
  console.log('Iniciando correção dos arquivos...');
  
  // Corrigir !isAuth: !userId para !isAuth || !userId
  for (const filePath of filesToFixIsAuth) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const content = await readFile(fullPath, 'utf8');
      const fixedContent = content.replace(/!isAuth\s*:\s*!userId/g, '!isAuth || !userId');
      await writeFile(fullPath, fixedContent, 'utf8');
      console.log(`Arquivo corrigido (isAuth): ${filePath}`);
    } catch (error) {
      console.error(`Erro ao processar o arquivo ${filePath}:`, error);
    }
  }

  // Corrigir !session: !session.user para !session || !session.user
  for (const filePath of filesToFixSession) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const content = await readFile(fullPath, 'utf8');
      const fixedContent = content.replace(/!session\s*:\s*!session\.user(\.id)?/g, '!session || !session.user$1');
      await writeFile(fullPath, fixedContent, 'utf8');
      console.log(`Arquivo corrigido (session): ${filePath}`);
    } catch (error) {
      console.error(`Erro ao processar o arquivo ${filePath}:`, error);
    }
  }
  
  console.log('Processo concluído!');
}

fixFiles().catch(console.error); 