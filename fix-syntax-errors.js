const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Diretório base onde estão os arquivos de API
const API_DIR = path.join(__dirname, 'frontend-rpx', 'src', 'app', 'api');
console.log('Diretório alvo:', API_DIR);

// Diretório alternativo (caso o primeiro não exista)
const ALT_API_DIR = path.join(__dirname, 'src', 'app', 'api');
console.log('Diretório alternativo:', ALT_API_DIR);

// Padrões de correção - cada entrada contém um padrão regex e sua substituição
const corrections = [
  // Corrigir interface em arquivos .js
  {
    pattern: /\/\/ Interface .+\n+interface\s+(\w+)/g,
    replacement: '// Definição de $1\n// Nota: interfaces removidas de arquivos .js'
  },
  // Corrigir declarações de interface
  {
    pattern: /interface\s+(\w+)\s*\{[^}]*\}/g,
    replacement: '/* Interface $1 removida de arquivo JS */'
  },
  // Corrigir ObjectId e Types.ObjectId
  {
    pattern: /_id\s*\:\s*mongoose\.Types\.ObjectId\(([^)]+)\)/g,
    replacement: '_id: new mongoose.Types.ObjectId($1)'
  },
  {
    pattern: /_id\s*mongoose\.Types\.ObjectId\(([^)]+)\)/g,
    replacement: '_id: new mongoose.Types.ObjectId($1)'
  },
  {
    pattern: /\{\s*_id\s*\:\s*([^}]+)\s*\}/g,
    replacement: function(match, id) {
      if (id.includes('mongoose.Types.ObjectId') && !id.includes('new mongoose.Types.ObjectId')) {
        return match.replace(/mongoose\.Types\.ObjectId\(([^)]+)\)/, 'new mongoose.Types.ObjectId($1)');
      }
      return match;
    }
  },
  // Corrigir operadores de comparação
  {
    pattern: /(\w+)\s*\:\s*(\w+)\s*([=!<>]+)\s*([^,;{}]+)/g,
    replacement: function(match, prop, var1, op, var2) {
      // Se parece com uma comparação, não um objeto
      if (op === '=' || op === '==' || op === '===' || op === '!=' || op === '!==' || op === '<' || op === '>') {
        return `${prop}: ${var1} ${op} ${var2}`;
      }
      return match;
    }
  },
  // Corrigir desestruturação
  {
    pattern: /const\s*\{([^}]+)\}\s*=\s*req\.body\s*\;/g,
    replacement: function(match, props) {
      const cleanedProps = props.split(',').map(p => p.trim()).join(', ');
      return `const { ${cleanedProps} } = req.body;`;
    }
  },
  // Corrigir regex MongoDB
  {
    pattern: /\{\s*\$regex\s*\:\s*([^,}]+),\s*\$options\s*\:\s*\'i\'\s*\}/g,
    replacement: '{ $regex: $1, $options: \'i\' }'
  },
  // Corrigir operadores em MongoDB
  {
    pattern: /\{\s*\$ne\s*\:\s*([^}]+)\s*\}/g,
    replacement: '{ $ne: $1 }'
  },
  // Corrigir filtros $or em MongoDB
  {
    pattern: /\$or\s*\:\s*\[\s*([^\]]+)\s*\]/g,
    replacement: function(match, content) {
      // Apenas retorna o match original, mas podemos adicionar lógica específica aqui se necessário
      return match;
    }
  },
  // Corrigir erros de chaves em objetos
  {
    pattern: /(\w+)(\s*)\}\s*\;/g,
    replacement: function(match, prop, space) {
      // Verifica se falta uma vírgula ou dois pontos
      if (!prop.includes(':') && !prop.includes(',')) {
        return `${prop}${space}}`;
      }
      return match;
    }
  },
  // Corrigir aspas em strings
  {
    pattern: /\'([^']*)\'\s*\:\s*\'([^']*)\'/g,
    replacement: '\'$1\': \'$2\''
  },
  // Corrigir parênteses em status
  {
    pattern: /\}\s*,\s*\{\s*status\s*\)\s*;/g,
    replacement: '}, { status: 400 });'
  },
  // Corrigir { ping);
  {
    pattern: /\{\s*ping\s*\)\s*;/g,
    replacement: '{ ping: 1 });'
  },
  // Corrigir fechamento de parênteses errados
  {
    pattern: /\{\s*status\s*\)\s*;/g,
    replacement: '{ status: 400 });'
  },
  // Corrigir objeto com status
  {
    pattern: /\},\s*\{\s*status\s*\)\s*;/g,
    replacement: '}, { status: 400 });'
  },
  // Corrigir acesso de propriedade com ponto
  {
    pattern: /userId\.user\.id\s*\}/g,
    replacement: 'userId }'
  },
  // Corrigir string em chave de objeto
  {
    pattern: /\{\s*([^}:]+)\s*\}/g,
    replacement: function(match, content) {
      // Se não houver ":" no conteúdo, é provável que seja um objeto mal formado
      if (!content.includes(':') && !content.includes(',') && !content.includes('(')) {
        return `{ ${content.trim()}: true }`;
      }
      return match;
    }
  },
  // Corrigir retornos de objeto com IDs
  {
    pattern: /return\s*\{\s*isAuth\s*,\s*error\s*,\s*userId\.user\.id\s*\}\;/g,
    replacement: 'return { isAuth, error, userId: userId?.user?.id };'
  },
  // Corrigir problemas com response e status
  {
    pattern: /NextResponse\.json\(\{([^}]+)\}\s*,\s*\{\s*status\)\s*;/g,
    replacement: 'NextResponse.json({$1}, { status: 400 });'
  },
  // Corrigir problemas específicos de retorno com acesso a userId
  {
    pattern: /\}\s*,\s*database\s*\)\s*;/g,
    replacement: '} });'
  }
];

// Correções específicas para os arquivos com erros
const specificFileCorrections = {
  'test-lobby-invite/route.js': [
    {
      pattern: /database\)\;/g,
      replacement: '});'
    }
  ],
  'test/mongodb/route.js': [
    {
      pattern: /\{\s*ping\)\;/g,
      replacement: '{ ping: 1 });'
    }
  ],
  'tournaments/[id]/matches/[matchId]/result/route.js': [
    {
      pattern: /return\s*\{\s*isAuth\s*,\s*error\s*,\s*userId\.user\.id\s*\}\;/g,
      replacement: 'return { isAuth, error, userId: userId?.user?.id };'
    }
  ],
  'tournaments/[id]/matches/route.js': [
    {
      pattern: /\}\s*,\s*\{\s*status\)\;/g,
      replacement: '}, { status: 400 });'
    }
  ],
  'tournaments/[id]/register/route.js': [
    {
      pattern: /\}\s*,\s*\{\s*status\)\;/g,
      replacement: '}, { status: 400 });'
    }
  ]
};

// Função para processar um arquivo
async function processFile(filePath) {
  // Verifique se é um arquivo .js ou .ts
  if (!filePath.endsWith('.js') && !filePath.endsWith('.ts')) {
    return false;
  }

  console.log(`Processando arquivo: ${filePath}`);

  try {
    const content = await readFile(filePath, 'utf8');
    let newContent = content;
    let changed = false;

    // Aplicar correções gerais
    for (const { pattern, replacement } of corrections) {
      const oldContent = newContent;
      if (typeof replacement === 'function') {
        newContent = newContent.replace(pattern, replacement);
      } else {
        newContent = newContent.replace(pattern, replacement);
      }
      if (oldContent !== newContent) {
        changed = true;
      }
    }
    
    // Verificar se há correções específicas para este arquivo
    const fileName = filePath.replace(/\\/g, '/').split('/').slice(-2).join('/');
    
    if (specificFileCorrections[fileName]) {
      console.log(`Aplicando correções específicas para ${fileName}`);
      
      for (const { pattern, replacement } of specificFileCorrections[fileName]) {
        const oldContent = newContent;
        if (typeof replacement === 'function') {
          newContent = newContent.replace(pattern, replacement);
        } else {
          newContent = newContent.replace(pattern, replacement);
        }
        if (oldContent !== newContent) {
          changed = true;
        }
      }
    }

    // Se o conteúdo mudou, salve o arquivo
    if (changed) {
      await writeFile(filePath, newContent);
      console.log(`✓ Corrigido: ${filePath}`);
      return true;
    } else {
      console.log(`✓ Sem alterações: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ Erro ao processar ${filePath}:`, error);
    return false;
  }
}

// Função para verificar arquivos específicos
async function fixSpecificFile(filePath, baseDir) {
  try {
    const fullPath = path.join(baseDir, filePath);
    
    // Verificar se o arquivo existe
    if (!await dirExists(fullPath)) {
      console.log(`Arquivo específico não encontrado: ${fullPath}`);
      return false;
    }
    
    console.log(`Corrigindo arquivo específico: ${fullPath}`);
    return await processFile(fullPath);
  } catch (error) {
    console.error(`Erro ao processar arquivo específico ${filePath}:`, error);
    return false;
  }
}

// Função para verificar se um diretório existe
async function dirExists(dir) {
  return new Promise(resolve => {
    fs.access(dir, fs.constants.F_OK, (err) => resolve(!err));
  });
}

// Lista de arquivos específicos para corrigir
const specificFilesToFix = [
  'test-lobby-invite/route.js',
  'test/mongodb/route.js',
  'tournaments/[id]/matches/[matchId]/result/route.js',
  'tournaments/[id]/matches/route.js',
  'tournaments/[id]/register/route.js'
];

// Função principal
async function main() {
  console.log('Iniciando correção de erros de sintaxe em arquivos de API...');
  console.log('Verificando se os diretórios existem...');
  
  try {
    // Verificar qual diretório existe
    const mainApiDirExists = await dirExists(API_DIR);
    const altApiDirExists = await dirExists(ALT_API_DIR);
    
    let targetDir;
    
    if (mainApiDirExists) {
      console.log(`Usando diretório principal: ${API_DIR}`);
      targetDir = API_DIR;
    } else if (altApiDirExists) {
      console.log(`Usando diretório alternativo: ${ALT_API_DIR}`);
      targetDir = ALT_API_DIR;
    } else {
      console.error('Nenhum diretório de API encontrado!');
      
      // Tentar listar os diretórios no diretório atual para diagnóstico
      console.log('Conteúdo do diretório atual:');
      const currentDirFiles = await readdir(__dirname);
      console.log(currentDirFiles);
      
      return;
    }
    
    // Corrigir arquivos específicos primeiro
    console.log('Corrigindo arquivos com erros específicos...');
    let fixedCount = 0;
    
    for (const specificFile of specificFilesToFix) {
      if (await fixSpecificFile(specificFile, targetDir)) {
        fixedCount++;
      }
    }
    
    console.log(`Arquivos específicos corrigidos: ${fixedCount}`);
    
    // Processar todos os arquivos da API
    // console.log('Processando todos os arquivos da API...');
    // const fixedFiles = await processDirectory(targetDir);
    // console.log(`Concluído! Total de arquivos corrigidos: ${fixedFiles + fixedCount}`);
  } catch (error) {
    console.error('Erro ao processar diretórios:', error);
  }
}

main(); 