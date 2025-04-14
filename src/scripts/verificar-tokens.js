require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

async function verificarGeracaoTokens() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Conectado ao MongoDB Atlas com sucesso');
    
    // Schema flexível para acessar qualquer campo
    const userSchema = new mongoose.Schema({}, { strict: false });
    
    // Registrar o modelo
    let User;
    try {
      User = mongoose.model('User');
    } catch (e) {
      User = mongoose.model('User', userSchema);
    }
    
    // Buscar o usuário admin
    const email = 'admin@rpxplatform.com';
    const user = await User.findOne({ 'contact.email': email });
    
    if (!user) {
      console.log(`❌ Usuário com email ${email} não encontrado!`);
      return;
    }
    
    console.log('✅ Usuário encontrado:', user._id);
    
    // Verificar as variáveis de ambiente necessárias
    console.log('\n🔍 Verificando variáveis de ambiente:');
    console.log('JWT_SECRET existe:', !!process.env.JWT_SECRET);
    console.log('JWT_REFRESH_SECRET existe:', !!process.env.JWT_REFRESH_SECRET);
    console.log('JWT_EXPIRATION existe:', !!process.env.JWT_EXPIRATION);
    console.log('JWT_REFRESH_EXPIRATION existe:', !!process.env.JWT_REFRESH_EXPIRATION);
    
    // Se não existir JWT_SECRET, verificar o arquivo auth.js ou auth.middleware.js
    if (!process.env.JWT_SECRET) {
      console.log('\n⚠️ JWT_SECRET não encontrado no .env, buscando no código...');
      
      // Tentar encontrar o arquivo de middleware de autenticação
      const possiveisArquivos = [
        path.join(__dirname, '../middleware/auth.js'),
        path.join(__dirname, '../middleware/auth.middleware.js'),
        path.join(__dirname, '../utils/jwt.js'),
        path.join(__dirname, '../utils/auth.js'),
        path.join(__dirname, '../config/jwt.js')
      ];
      
      let secretEncontrado = false;
      for (const arquivo of possiveisArquivos) {
        if (fs.existsSync(arquivo)) {
          console.log(`Arquivo encontrado: ${arquivo}`);
          const conteudo = fs.readFileSync(arquivo, 'utf8');
          
          // Procurar por possíveis definições de JWT_SECRET
          const secretMatches = conteudo.match(/(?:JWT_SECRET|jwtSecret|secret)\s*=\s*['"]([^'"]+)['"]/);
          if (secretMatches && secretMatches[1]) {
            console.log(`✅ Secret encontrado no arquivo: ${secretMatches[1].slice(0, 3)}...`);
            process.env.JWT_SECRET = secretMatches[1];
            secretEncontrado = true;
            break;
          }
        }
      }
      
      if (!secretEncontrado) {
        console.log('❌ Não foi possível encontrar JWT_SECRET no código');
      }
    }
    
    // Tentar gerar um token JWT manualmente para o usuário
    console.log('\n🔄 Tentando gerar token JWT manualmente:');
    
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET não definido');
      }
      
      const payload = {
        userId: user._id,
        email: user.contact?.email || user.email,
        roles: user.roles || ['user']
      };
      
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRATION || '1h'
      });
      
      console.log('✅ Token JWT gerado com sucesso!');
      console.log(`Token: ${token.substring(0, 20)}...`);
      
      // Verificar se o token é válido
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verificado com sucesso!');
      console.log('Payload decodificado:', {
        userId: decoded.userId,
        email: decoded.email,
        roles: decoded.roles,
        exp: new Date(decoded.exp * 1000).toISOString()
      });
      
    } catch (tokenError) {
      console.error('❌ Erro ao gerar/verificar token:', tokenError.message);
    }
    
    // Verificar se o middleware auth está exportando a função generateTokens
    console.log('\n🔍 Verificando implementação de generateTokens:');
    
    try {
      // Tentar importar a função do módulo correto
      const authPath = path.join(__dirname, '../middleware/auth.js');
      
      if (fs.existsSync(authPath)) {
        // Tentar extrair a função generateTokens
        const authContent = fs.readFileSync(authPath, 'utf8');
        console.log('✅ Arquivo de autenticação encontrado');
        
        if (authContent.includes('generateTokens')) {
          console.log('✅ Função generateTokens encontrada no arquivo');
        } else {
          console.log('❌ Função generateTokens não encontrada no arquivo');
        }
        
        // Procurar por funções relacionadas a token
        const tokenFunctions = authContent.match(/function\s+(\w+Token\w*|generate\w*Token\w*)\s*\(/g);
        if (tokenFunctions && tokenFunctions.length > 0) {
          console.log('📋 Funções relacionadas a tokens encontradas:');
          tokenFunctions.forEach(func => console.log(`- ${func.replace(/function\s+|\s*\(/g, '')}`));
        }
      } else {
        console.log('❌ Arquivo de autenticação não encontrado');
      }
    } catch (authError) {
      console.error('❌ Erro ao verificar implementação de auth:', authError.message);
    }
    
    console.log('\n📋 RECOMENDAÇÕES:');
    console.log('1. Verifique se as variáveis JWT_SECRET e JWT_EXPIRATION estão definidas no .env');
    console.log('2. Verifique se a função generateTokens está sendo exportada corretamente');
    console.log('3. Verifique se o token está sendo retornado corretamente na resposta do login');
    console.log('4. Verifique os logs do servidor para identificar erros na geração de token');
    
    // Fechar conexão com o MongoDB
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Erro ao verificar geração de tokens:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(0);
  }
}

// Executar o script
verificarGeracaoTokens(); 