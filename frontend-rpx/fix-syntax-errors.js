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

// Função para corrigir erros de sintaxe comuns
function fixSyntaxErrors(content) {
  // Corrigir erros de status nas respostas JSON
  content = content.replace(/{\s*status\s*\);/g, '{ status: 400 });');
  content = content.replace(/{\s*status\s*\)/g, '{ status: 400 }');
  
  // Corrigir chamadas do ObjectId
  content = content.replace(/(_id)\s+ObjectId/g, '$1: new ObjectId');
  content = content.replace(/\{\s*_id\s+ObjectId/g, '{ _id: new ObjectId');
  
  // Corrigir erros de propriedades e instanciação
  content = content.replace(/(\w+):\s*(\w+),\s*threshold,/g, '$1: \'$2\', threshold: 0,');
  content = content.replace(/name:\s*'([^']+)',\s*threshold,/g, 'name: \'$1\', threshold: 0,');
  
  // Corrigir erros em configurações de campos
  content = content.replace(/(\w+)\s*\|\|/g, '$1:');
  content = content.replace(/(\w+)\s*Date\(\)/g, '$1: new Date()');
  
  // Corrigir erros de objetos incompletos
  content = content.replace(/(\w+),\s*updatedBy\.user\.id/g, '$1, updatedBy: session.user.id');
  
  // Corrigir erros de dot notation para acessar propriedades
  content = content.replace(/(\w+)\.(\w+)\.toString\(\)/g, '$1.$2 ? $1.$2.toString() : ""');
  
  // Corrigir erros em objetos e listas
  content = content.replace(/,\s*\$in\s*'([^']+)'\s*,\s*'([^']+)'\s*]/g, ', $in: [\'$1\', \'$2\']');
  content = content.replace(/,\s*\$in\s*]/g, ', $in: []');
  
  return content;
}

// Função principal para processar os arquivos
function processFiles(dir) {
  let filesFixed = 0;
  
  walkSync(dir, (filePath) => {
    if (filePath.endsWith('.js') && filePath.includes('route.js')) {
      console.log(`Verificando: ${filePath}`);
      
      try {
        // Ler o conteúdo atual do arquivo
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Aplicar as correções
        const fixedContent = fixSyntaxErrors(content);
        
        // Se houve mudanças, salvar o arquivo
        if (content !== fixedContent) {
          fs.writeFileSync(filePath, fixedContent, 'utf8');
          console.log(`✅ Corrigido: ${filePath}`);
          filesFixed++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar ${filePath}:`, error);
      }
    }
  });
  
  console.log(`\nProcessamento concluído! ${filesFixed} arquivos foram corrigidos.`);
}

// Diretórios a serem processados
const apiDir = path.join(__dirname, 'src', 'app', 'api');

// Iniciar processamento
console.log('Iniciando correção de erros de sintaxe...\n');
processFiles(apiDir); 