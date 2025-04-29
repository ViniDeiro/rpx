const fs = require('fs');
const path = require('path');

// Função para percorrer diretórios recursivamente
function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkSync(filePath, callback);
    } else {
      callback(filePath);
    }
  });
}

// Função para converter o conteúdo TypeScript para JavaScript
function convertTsToJs(content) {
  // Remover interfaces completas
  content = content.replace(/interface\s+[A-Za-z0-9_]+\s*\{[\s\S]*?\}/g, '');
  
  // Remover exportação de interfaces e tipos
  content = content.replace(/export\s+(?:interface|type)\s+[A-Za-z0-9_]+[\s\S]*?(?:;|\})/g, '');
  
  // Remover importações do tipo
  content = content.replace(/import\s+type\s+.*?;/g, '');
  content = content.replace(/import\s+\{\s*(?:[^{}]*?,\s*)?type\s+[^{}]*\}\s+from\s+['"][^'"]+['"];/g, '');
  
  // Remover anotações de tipo em parâmetros de funções
  content = content.replace(/:\s*[A-Za-z0-9_<>[\]|&{}?,.\s]+(?=[,)])/g, '');
  
  // Remover tipos genéricos
  content = content.replace(/<[^>]+>/g, '');
  
  // Remover assinaturas de tipo para objetos de parâmetros
  content = content.replace(/{\s*params\s*}:\s*{\s*params\s*:\s*{\s*[a-zA-Z]+\s*:\s*[a-zA-Z]+\s*}\s*}/g, '{ params }');
  
  // Corrigir erros de sintaxe em operações map
  content = content.replace(/(\w+)\.map\(/g, 'data: $1.map(');
  
  // Corrigir erros de propriedades de objeto em operações map
  content = content.replace(/(_id)\._id\.toString\(\)/g, 'id: $1.toString()');
  content = content.replace(/(email)\.email/g, 'email: $1');
  content = content.replace(/(name)\.name/g, 'name: $1');
  
  // Remover anotações de tipo do erro
  content = content.replace(/\(error: any\)/g, '(error)');
  content = content.replace(/error:\s*[A-Za-z]+/g, 'error');
  
  // Substituir NextRequest por request
  content = content.replace(/NextRequest/g, 'request');
  
  // Remover tipos em arrays e parâmetros de funções 
  content = content.replace(/\(([a-zA-Z0-9_]+):\s*[A-Za-z0-9_<>[\]|&{}]+\)/g, '($1)');
  
  // Remover definições de tipo restantes
  content = content.replace(/type\s+[A-Za-z0-9_]+\s*=[\s\S]*?;/g, '');
  
  return content;
}

// Função para corrigir arquivos JavaScript que foram convertidos incorretamente
function fixJsFiles(dir) {
  walkSync(dir, (filePath) => {
    if (filePath.endsWith('route.js')) {
      console.log(`Corrigindo: ${filePath}`);
      
      // Ler o conteúdo do arquivo
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Converter conteúdo
      content = convertTsToJs(content);
      
      // Salvar o arquivo corrigido
      fs.writeFileSync(filePath, content, 'utf8');
    }
  });
}

// Função principal
function main() {
  const apiDir = path.join(__dirname, 'src', 'app', 'api');
  
  if (!fs.existsSync(apiDir)) {
    console.error('Diretório API não encontrado:', apiDir);
    return;
  }
  
  console.log('Corrigindo arquivos JavaScript convertidos...');
  
  // Corrigir arquivos JavaScript existentes
  fixJsFiles(apiDir);
  
  console.log('Correção concluída!');
}

// Executar função principal
main(); 