const fs = require('fs');
const path = require('path');

// Lista de diretórios a serem movidos temporariamente
const problematicDirs = [
  'src/app/api',
  'src/app/profile/wallet/deposit/success',
  'src/app/profile/wallet/deposit/failure'
];

// Pasta temporária para backup
const backupDir = path.join(__dirname, 'tmp-backup');

// Criar pasta de backup se não existir
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`Diretório de backup criado: ${backupDir}`);
}

// Função para mover diretórios problemáticos
function moveProblematicFiles() {
  console.log('Movendo diretórios problemáticos para backup...');
  
  problematicDirs.forEach(dirPath => {
    const fullPath = path.join(__dirname, dirPath);
    
    // Verificar se o diretório existe
    if (fs.existsSync(fullPath)) {
      // Criar estrutura de diretórios no backup
      const backupDirPath = path.join(backupDir, dirPath);
      const parentDirPath = path.dirname(backupDirPath);
      
      if (!fs.existsSync(parentDirPath)) {
        fs.mkdirSync(parentDirPath, { recursive: true });
      }
      
      // Mover o diretório para o backup
      fs.renameSync(fullPath, backupDirPath);
      
      // Criar um diretório vazio no local original
      fs.mkdirSync(fullPath, { recursive: true });
      
      // Criar um arquivo placeholder
      fs.writeFileSync(
        path.join(fullPath, 'route.js'), 
        `import { NextResponse } from 'next/server';\n\nexport async function GET() {\n  return NextResponse.json({ message: 'API temporariamente indisponível' });\n}\n\nexport async function POST() {\n  return NextResponse.json({ message: 'API temporariamente indisponível' });\n}\n`
      );
      
      console.log(`Movido: ${dirPath}`);
    } else {
      console.log(`Diretório não encontrado: ${dirPath}`);
    }
  });
  
  console.log('Processo concluído!');
}

// Função para restaurar os diretórios
function restoreFiles() {
  console.log('Restaurando diretórios originais...');
  
  problematicDirs.forEach(dirPath => {
    const fullPath = path.join(__dirname, dirPath);
    const backupDirPath = path.join(backupDir, dirPath);
    
    // Verificar se o backup existe
    if (fs.existsSync(backupDirPath)) {
      // Remover o diretório placeholder
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
      
      // Restaurar o diretório original
      fs.renameSync(backupDirPath, fullPath);
      console.log(`Restaurado: ${dirPath}`);
    } else {
      console.log(`Backup não encontrado: ${backupDirPath}`);
    }
  });
  
  console.log('Restauração concluída!');
  
  // Remover diretório de backup se estiver vazio
  try {
    fs.rmdirSync(backupDir, { recursive: true });
    console.log('Diretório de backup removido');
  } catch (err) {
    console.log('Não foi possível remover diretório de backup:', err.message);
  }
}

// Verificar o comando
if (process.argv[2] === 'backup') {
  moveProblematicFiles();
} else if (process.argv[2] === 'restore') {
  restoreFiles();
} else {
  console.log('Uso: node exclude-problem-files.js [backup|restore]');
} 