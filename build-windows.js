const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Iniciando processo de build para Windows');

// Limpar diretório dist
console.log('🧹 Limpando diretório dist...');
try {
  if (fs.existsSync('./dist')) {
    fs.rmSync('./dist', { recursive: true, force: true });
  }
  console.log('  ✓ Diretório dist limpo');
} catch (error) {
  console.error('  ✗ Falha ao limpar diretório dist:', error);
  process.exit(1);
}

// Criar diretório dist
console.log('📁 Criando diretório dist...');
try {
  fs.mkdirSync('./dist', { recursive: true });
  console.log('  ✓ Diretório dist criado');
} catch (error) {
  console.error('  ✗ Falha ao criar diretório dist:', error);
  process.exit(1);
}

// Copiar arquivos do backend
console.log('📋 Copiando arquivos do backend...');
try {
  function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) {
      console.error(`  ✗ Diretório de origem não existe: ${src}`);
      return;
    }
    
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src, { withFileTypes: true });
    
    for (const item of items) {
      const srcPath = path.join(src, item.name);
      const destPath = path.join(dest, item.name);
      
      if (item.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  copyRecursive('./src', './dist/src');
  console.log('  ✓ Arquivos do backend copiados');
} catch (error) {
  console.error('  ✗ Falha ao copiar arquivos do backend:', error);
  process.exit(1);
}

// Copiar arquivo .env.production se existir
console.log('🔑 Verificando arquivo .env.production...');
try {
  if (fs.existsSync('./.env.production')) {
    fs.copyFileSync('./.env.production', './dist/.env');
    console.log('  ✓ Arquivo .env.production copiado para dist/.env');
  } else {
    console.log('  i Arquivo .env.production não encontrado, pulando...');
  }
} catch (error) {
  console.error('  ✗ Falha ao copiar arquivo .env.production:', error);
  // Não interromper o processo por causa disso
}

// Construir o frontend
console.log('🏗️ Construindo o frontend...');
try {
  process.chdir('./frontend-rpx');
  console.log('  i Diretório atual: ' + process.cwd());
  
  // Mover arquivos problemáticos antes do build
  console.log('  i Removendo arquivos problemáticos...');
  execSync('node exclude-problem-files.js backup', { stdio: 'inherit' });
  
  console.log('  i Executando: npm run build:windows');
  execSync('npm run build:windows', { stdio: 'inherit' });
  
  // Restaurar arquivos após o build
  console.log('  i Restaurando arquivos originais...');
  execSync('node exclude-problem-files.js restore', { stdio: 'inherit' });
  
  console.log('  ✓ Frontend construído com sucesso');
  process.chdir('..');
} catch (error) {
  // Tentar restaurar os arquivos em caso de erro
  try {
    console.log('  ! Erro no build, tentando restaurar arquivos...');
    execSync('node exclude-problem-files.js restore', { stdio: 'inherit' });
  } catch (restoreError) {
    console.error('  ✗ Falha ao restaurar arquivos:', restoreError);
  }
  
  process.chdir('..');
  console.error('  ✗ Falha ao construir frontend:', error);
  process.exit(1);
}

console.log('🎉 Processo de build concluído com sucesso!'); 