const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Função para criar diretório se não existir
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Diretório criado: ${dirPath}`);
  } else {
    console.log(`Diretório já existe: ${dirPath}`);
  }
}

// Função para copiar arquivos recursivamente
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Arquivo copiado: ${srcPath} -> ${destPath}`);
    }
  }
}

// Executar limpeza
try {
  console.log('Limpando diretório dist...');
  if (fs.existsSync('../dist')) {
    fs.rmSync('../dist', { recursive: true, force: true });
  }
} catch (err) {
  console.error('Erro ao limpar diretório:', err);
}

// Criar diretório dist
try {
  console.log('Criando diretório dist...');
  ensureDir('../dist');
} catch (err) {
  console.error('Erro ao criar diretório dist:', err);
}

// Copiar arquivos do backend
try {
  console.log('Copiando arquivos do backend...');
  copyDir('../src', '../dist/src');
} catch (err) {
  console.error('Erro ao copiar arquivos do backend:', err);
}

// Copiar arquivo .env.production para .env (se existir)
try {
  const envSource = '../.env.production';
  const envDest = '../dist/.env';
  
  if (fs.existsSync(envSource)) {
    fs.copyFileSync(envSource, envDest);
    console.log(`Arquivo copiado: ${envSource} -> ${envDest}`);
  } else {
    console.log('Arquivo .env.production não encontrado, criando .env vazio');
    fs.writeFileSync(envDest, '');
  }
} catch (err) {
  console.error('Erro ao copiar arquivo .env:', err);
}

// Construir o frontend
try {
  console.log('Construindo o frontend...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Frontend construído com sucesso');
} catch (err) {
  console.error('Erro ao construir o frontend:', err);
}

console.log('Processo de build concluído!'); 