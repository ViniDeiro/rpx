const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Lista de arquivos com erros específicos
const filesToFix = [
  'src/app/api/admin/badges/route.js',
  'src/app/api/admin/banners/route.js',
  'src/app/api/admin/categorias/route.js',
  'src/app/api/admin/cpf-verifications/route.js',
  'src/app/api/admin/match/[id]/update/route.js',
  'src/app/api/admin/match/[id]/validate/route.js',
  'src/app/api/admin/matches/pending/route.js',
  'src/app/api/admin/matches/route.js'
];

async function fixSpecificFiles() {
  console.log('Iniciando correção de arquivos específicos...');
  
  for (const filePath of filesToFix) {
    try {
      console.log(`Processando: ${filePath}`);
      const fullPath = path.join(process.cwd(), filePath);
      const content = await readFile(fullPath, 'utf8');
      
      let fixedContent = content;
      
      // Correção para badges.map, banners.map, categories.map
      fixedContent = fixedContent.replace(
        /(status: 'success',)\s*\n\s*(\w+)\.map/g, 
        '$1\n      data: $2.map'
      );
      
      // Correção para new: new ObjectId
      fixedContent = fixedContent.replace(
        /new: new ObjectId/g, 
        'new ObjectId'
      );
      
      // Correção para userId: userId: memberId
      fixedContent = fixedContent.replace(
        /userId: (\w+): memberId/g, 
        'userId: $1'
      );
      
      // Correção para Set(...).map(id => new: new
      fixedContent = fixedContent.replace(
        /\.map\(id => new: new ObjectId/g, 
        '.map(id => new ObjectId'
      );
      
      if (content !== fixedContent) {
        await writeFile(fullPath, fixedContent, 'utf8');
        console.log(`✅ Corrigido: ${filePath}`);
      } else {
        console.log(`⚠️ Nenhuma alteração feita em: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao processar arquivo ${filePath}:`, error);
    }
  }
  
  console.log('Processo de correção específica concluído!');
}

// Função para corrigir todos os arquivos na pasta src/app/api
async function findAndFixAllFiles() {
  console.log('Buscando e corrigindo todos os arquivos JS na pasta api...');
  
  const baseDir = path.join(process.cwd(), 'src/app/api');
  const files = [];
  
  async function scanDir(dirPath) {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        await scanDir(entryPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        files.push(entryPath);
      }
    }
  }
  
  await scanDir(baseDir);
  console.log(`Encontrados ${files.length} arquivos JavaScript.`);
  
  for (const file of files) {
    try {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`Processando: ${relativePath}`);
      
      const content = await readFile(file, 'utf8');
      let fixedContent = content;
      
      // Correções para todos os arquivos
      fixedContent = fixedContent.replace(/new: new ObjectId/g, 'new ObjectId');
      fixedContent = fixedContent.replace(/userId: (\w+): memberId/g, 'userId: $1');
      fixedContent = fixedContent.replace(/\.map\(id => new: new ObjectId/g, '.map(id => new ObjectId');
      
      if (content !== fixedContent) {
        await writeFile(file, fixedContent, 'utf8');
        console.log(`✅ Corrigido: ${relativePath}`);
      } else {
        console.log(`⏭️ Sem alterações: ${relativePath}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao processar arquivo ${file}:`, error);
    }
  }
  
  console.log('Correção de todos os arquivos concluída!');
}

// Executar correção específica primeiro, depois corrigir todos os arquivos
async function main() {
  await fixSpecificFiles();
  await findAndFixAllFiles();
  console.log('Processo completo!');
}

main().catch(console.error); 