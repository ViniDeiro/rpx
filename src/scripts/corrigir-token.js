require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

async function corrigirProblemaToken() {
  try {
    console.log('🔍 Iniciando diagnóstico do problema de token...');
    
    // Verificar arquivo .env
    const envPath = path.join(process.cwd(), '.env');
    let envConteudo = '';
    
    if (fs.existsSync(envPath)) {
      envConteudo = fs.readFileSync(envPath, 'utf8');
      console.log('✅ Arquivo .env encontrado');
    } else {
      console.log('❌ Arquivo .env não encontrado. Criando um novo...');
      envConteudo = 'MONGODB_URI=mongodb://localhost:27017/rpxplatform\n';
    }
    
    // Verificar se JWT_SECRET existe no .env
    const temJwtSecret = envConteudo.includes('JWT_SECRET=');
    
    if (!temJwtSecret) {
      console.log('❌ JWT_SECRET não encontrado no .env. Adicionando...');
      
      // Extrair segredo do arquivo auth.js ou definir um novo
      let jwtSecret = '';
      
      const authPath = path.join(__dirname, '../middleware/auth.js');
      if (fs.existsSync(authPath)) {
        const authContent = fs.readFileSync(authPath, 'utf8');
        const secretMatch = authContent.match(/JWT_SECRET\s*=\s*process\.env\.JWT_SECRET\s*\|\|\s*['"](.*?)['"]/);
        
        if (secretMatch && secretMatch[1]) {
          jwtSecret = secretMatch[1];
          console.log(`✅ JWT_SECRET extraído do arquivo auth.js: ${jwtSecret.slice(0, 3)}...`);
        }
      }
      
      if (!jwtSecret) {
        jwtSecret = 'rpx-platform-secret-' + Math.random().toString(36).substring(2, 15);
        console.log(`✅ Novo JWT_SECRET gerado: ${jwtSecret.slice(0, 3)}...`);
      }
      
      // Adicionar ao arquivo .env
      envConteudo += `\nJWT_SECRET=${jwtSecret}\n`;
      envConteudo += `JWT_EXPIRES_IN=8h\n`;
      envConteudo += `REFRESH_TOKEN_SECRET=${jwtSecret}-refresh\n`;
      envConteudo += `REFRESH_TOKEN_EXPIRES_IN=7d\n`;
      
      fs.writeFileSync(envPath, envConteudo);
      console.log('✅ Arquivo .env atualizado com as configurações de JWT');
      
      // Forçar reload das variáveis de ambiente
      Object.assign(process.env, {
        JWT_SECRET: jwtSecret,
        JWT_EXPIRES_IN: '8h',
        REFRESH_TOKEN_SECRET: `${jwtSecret}-refresh`,
        REFRESH_TOKEN_EXPIRES_IN: '7d'
      });
    }
    
    // Conectar ao MongoDB para verificar o modelo de usuário
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Conectado ao MongoDB Atlas com sucesso');
    
    // Verificar o modelo de usuário
    const userSchema = new mongoose.Schema({}, { strict: false });
    
    let User;
    try {
      User = mongoose.model('User');
    } catch (e) {
      User = mongoose.model('User', userSchema);
    }
    
    // Verificar método addRefreshToken no modelo User
    const email = 'admin@rpxplatform.com';
    const adminUser = await User.findOne({ 'contact.email': email });
    
    if (!adminUser) {
      console.log('❌ Usuário admin não encontrado. Não é possível verificar o modelo.');
      return;
    }
    
    console.log('✅ Usuário admin encontrado:', adminUser._id);
    
    // Verificar e consertar o método addRefreshToken
    const userModelPath = path.join(__dirname, '../models/user.model.js');
    
    if (fs.existsSync(userModelPath)) {
      let userModelContent = fs.readFileSync(userModelPath, 'utf8');
      console.log('✅ Arquivo de modelo do usuário encontrado');
      
      // Verificar se o modelo tem o método addRefreshToken
      const temAddRefreshToken = userModelContent.includes('addRefreshToken');
      
      if (!temAddRefreshToken) {
        console.log('❌ Método addRefreshToken não encontrado no modelo. Adicionando...');
        
        // Encontrar a posição para adicionar o método (antes do module.exports)
        const moduleExportsIndex = userModelContent.indexOf('module.exports');
        
        if (moduleExportsIndex !== -1) {
          // Adicionar o método addRefreshToken antes do module.exports
          const metodoAddRefreshToken = `
/**
 * Método para adicionar um refresh token
 */
userSchema.methods.addRefreshToken = async function(refreshToken) {
  // Inicializar array de tokens se não existir
  if (!this.refreshTokens) {
    this.refreshTokens = [];
  }
  
  // Limitar o número de tokens por usuário (opcional)
  if (this.refreshTokens.length >= 5) {
    // Remover o token mais antigo
    this.refreshTokens.shift();
  }
  
  // Adicionar o novo token
  this.refreshTokens.push(refreshToken);
  
  // Salvar o usuário
  return this.save();
};

`;
          
          // Inserir o método na posição correta
          userModelContent = userModelContent.slice(0, moduleExportsIndex) + 
                            metodoAddRefreshToken + 
                            userModelContent.slice(moduleExportsIndex);
          
          // Salvar o arquivo atualizado
          fs.writeFileSync(userModelPath, userModelContent);
          console.log('✅ Método addRefreshToken adicionado ao modelo de usuário');
        } else {
          console.log('❌ Não foi possível encontrar a posição para adicionar o método');
        }
      } else {
        console.log('✅ Método addRefreshToken já existe no modelo');
      }
    } else {
      console.log('❌ Arquivo de modelo do usuário não encontrado');
    }
    
    // Verificar e consertar o modelo de usuário para incluir o campo refreshTokens
    console.log('\n🔧 Verificando schema do usuário para o campo refreshTokens...');
    
    // Verificar se o usuário admin tem o array refreshTokens
    const temRefreshTokens = adminUser.refreshTokens !== undefined;
    
    if (!temRefreshTokens) {
      console.log('❌ Campo refreshTokens não encontrado no usuário admin. Adicionando...');
      
      // Atualizar o usuário para adicionar o campo refreshTokens
      await User.updateOne(
        { _id: adminUser._id },
        { $set: { refreshTokens: [] } }
      );
      
      console.log('✅ Campo refreshTokens adicionado ao usuário admin');
    } else {
      console.log('✅ Campo refreshTokens já existe no usuário admin');
    }
    
    // Testar geração de token
    console.log('\n🔄 Testando geração de tokens para o usuário admin...');
    
    try {
      // Gerar token JWT
      const payload = { id: adminUser._id };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
      });
      
      // Gerar refresh token
      const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || `${process.env.JWT_SECRET}-refresh`, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
      });
      
      console.log('✅ Tokens gerados com sucesso!');
      console.log(`Token: ${token.substring(0, 20)}...`);
      console.log(`Refresh Token: ${refreshToken.substring(0, 20)}...`);
      
      // Verificar se o token é válido
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verificado com sucesso!');
      console.log('Payload decodificado:', {
        id: decoded.id,
        exp: new Date(decoded.exp * 1000).toISOString()
      });
      
      // Adicionar o refresh token ao usuário
      if (typeof adminUser.addRefreshToken === 'function') {
        await adminUser.addRefreshToken(refreshToken);
        console.log('✅ Refresh token adicionado ao usuário com sucesso!');
      } else {
        // Alternativa se o método não existir
        if (!adminUser.refreshTokens) {
          adminUser.refreshTokens = [];
        }
        adminUser.refreshTokens.push(refreshToken);
        await adminUser.save();
        console.log('✅ Refresh token adicionado manualmente ao usuário com sucesso!');
      }
    } catch (tokenError) {
      console.error('❌ Erro ao gerar/verificar token:', tokenError.message);
    }
    
    console.log('\n📋 RECOMENDAÇÕES:');
    console.log('1. Reinicie o servidor para aplicar as alterações nas variáveis de ambiente');
    console.log('2. Limpe os cookies do navegador e tente fazer login novamente');
    console.log('3. Utilize as seguintes credenciais para login:');
    console.log('   - Email: admin@rpxplatform.com');
    console.log('   - Senha: (utilize a senha original)');
    
    // Fechar conexão com o MongoDB
    await mongoose.connection.close();
    console.log('\n✅ Diagnóstico e correção concluídos!');
    
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(0);
  }
}

// Executar o script
corrigirProblemaToken(); 