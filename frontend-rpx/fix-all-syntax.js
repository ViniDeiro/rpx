const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Diretório base do projeto
const baseDir = path.join(__dirname, 'src/app/api');

// Função para buscar todos os arquivos .js recursivamente
async function findJsFiles(dir) {
  const files = [];
  
  async function _scanDir(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        await _scanDir(fullPath);
      } else if (entry.isFile() && fullPath.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  }
  
  await _scanDir(dir);
  return files;
}

// Função para corrigir erros comuns em um arquivo
async function fixFile(filePath) {
  console.log(`Processando: ${filePath}`);
  
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Lista de padrões para substituição
    const replacements = [
      // Correções para condicionais
      { pattern: /!isAuth\s*:\s*!userId/g, replacement: '!isAuth || !userId' },
      { pattern: /!session\s*:\s*!session\.user/g, replacement: '!session || !session.user' },
      { pattern: /!lobbyId\s*:\s*!(.+?)Id/g, replacement: '!lobbyId || !$1Id' },
      { pattern: /!([\w]+?)\s*:\s*!([\w]+?)\)/g, replacement: '!$1 || !$2)' },
      
      // Correções para expressions com new
      { pattern: /const\s+(\w+)\s*=\s*new\s*:\s*new\s+Date\(\)/g, replacement: 'const $1 = new Date()' },
      
      // Correções para objetos
      { pattern: /(\w+)\s+ObjectId\((\w+)\)/g, replacement: '$1: new ObjectId($2)' },
      { pattern: /\$pull\s*:\s*{\s*(\w+)\s+/g, replacement: '$pull: { $1: ' },
      { pattern: /\$in\s+([\w\.\[\]]+)\]/g, replacement: '$in: $1]' },
      
      // Correções para JSON.stringify
      { pattern: /id\s*:\s*_id\.toString\(\)/g, replacement: 'id: _id.toString()' },
      { pattern: /(\w+)\.(\w+)\s*\?\s*(\w+)\.(\w+)\.toString\(\)\s*:\s*""/g, replacement: '$1.$2 ? $3.$4.toString() : ""' },
      { pattern: /status\.status/g, replacement: 'status: status' },
      
      // Correções para projeções
      { pattern: /projection\s*:\s*{\s*_id\s*,\s*username\s*,\s*avatar/g, replacement: 'projection: { _id: 1, username: 1, avatar: 1' },
      
      // Correções para data
      { pattern: /data\s*,/g, replacement: 'data: {' },
      { pattern: /data\s*:\s*(\w+)\.map/g, replacement: '$1.map' },
      { pattern: /createdAt\s*$/g, replacement: 'createdAt: new Date()' },
      { pattern: /read\s*,/g, replacement: 'read: false,' },
      
      // Correções para lobbyId.toString() etc
      { pattern: /lobbyId\.toString\(\)/g, replacement: 'lobbyId.toString()' },
      { pattern: /matchId\.insertedId\s*\?\s*matchId\.insertedId\.toString\(\)\s*:\s*""/g, replacement: 'matchId: matchId.insertedId ? matchId.insertedId.toString() : ""' },
      
      // Correções variadas
      { pattern: /sort\(\{\s*timestamp\)/g, replacement: 'sort({ timestamp: 1' },
      { pattern: /processed\s*:\s*{\s*\$ne\s*}/g, replacement: 'processed: { $ne: true }' },
      { pattern: /if\s*\(\s*memberCount\s+(\d+)/g, replacement: 'if (memberCount < $1' },
      
      // Correções para userIds etc
      { pattern: /userId\s*(\w+)\.toString\(\)/g, replacement: 'userId: $1.toString()' },
      { pattern: /userId\s*,/g, replacement: 'userId: memberId,' },
      
      // Correções para tipos
      { pattern: /\${(\w+)\.(\w+)\s*:\s*'(\w+)'}/g, replacement: '${$1.$2 || \'$3\'}' },
      { pattern: /\$or\s*\[/g, replacement: '$or: [' },
    ];
    
    // Aplicar todos os padrões de substituição
    let fixedContent = content;
    for (const { pattern, replacement } of replacements) {
      fixedContent = fixedContent.replace(pattern, replacement);
    }
    
    // Salvar o arquivo só se houver alterações
    if (content !== fixedContent) {
      await writeFile(filePath, fixedContent, 'utf8');
      console.log(`✅ Corrigido: ${filePath}`);
    } else {
      console.log(`⏭️ Sem alterações: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
  }
}

// Função principal
async function main() {
  try {
    console.log('🔍 Buscando arquivos JavaScript...');
    const files = await findJsFiles(baseDir);
    console.log(`🔎 Encontrados ${files.length} arquivos.`);
    
    for (const file of files) {
      await fixFile(file);
    }
    
    console.log('✨ Processo concluído!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

main().catch(console.error); 