require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// URL base da API
// Altere para a URL correta do seu servidor
const API_BASE_URL = 'http://localhost:3000';

async function testarLoginAPI() {
  try {
    console.log('🔍 Iniciando teste de login direto na API...');
    
    // Conectar ao MongoDB para obter a senha do admin
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
    
    // Obter o usuário admin para saber se a senha está em hash
    const email = 'admin@rpxplatform.com';
    const adminUser = await User.findOne({ 'contact.email': email }).select('+password');
    
    if (!adminUser) {
      console.log(`❌ Usuário com email ${email} não encontrado!`);
      return;
    }
    
    console.log('✅ Usuário admin encontrado:', adminUser._id);
    
    // Verificar se a senha está em hash (começa com $2a$ ou $2b$ para bcrypt)
    const senhaEmHash = adminUser.password && (adminUser.password.startsWith('$2a$') || adminUser.password.startsWith('$2b$'));
    console.log(`Senha está em hash: ${senhaEmHash ? 'Sim' : 'Não'}`);
    
    // Testar login API diretamente
    console.log('\n🔄 TESTANDO LOGIN NA API:');
    console.log(`Endpoint de login: ${API_BASE_URL}/api/auth/login`);
    
    try {
      // Usando uma senha padrão para o teste se o admin não tiver uma senha definida
      const senhaParaTeste = "admin123";
      
      const loginData = {
        email: 'admin@rpxplatform.com',
        password: senhaParaTeste
      };
      
      console.log('📤 Enviando requisição com os dados:', {
        email: loginData.email,
        password: '********' // Ocultando a senha real
      });
      
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, loginData);
      
      console.log(`✅ Resposta recebida (Status ${response.status}):`);
      console.log('Headers:', response.headers);
      
      // Verificar se o token foi retornado no corpo da resposta
      if (response.data && response.data.data && response.data.data.token) {
        console.log('✅ Token JWT recebido com sucesso!');
        console.log(`Token: ${response.data.data.token.substring(0, 20)}...`);
        
        if (response.data.data.refreshToken) {
          console.log('✅ Refresh Token recebido com sucesso!');
          console.log(`Refresh Token: ${response.data.data.refreshToken.substring(0, 20)}...`);
        } else {
          console.log('❌ Refresh Token não encontrado na resposta!');
        }
      } else {
        console.log('❌ Token não encontrado na resposta!');
        console.log('Estrutura da resposta:', JSON.stringify(response.data, null, 2));
      }
      
    } catch (apiError) {
      console.error('❌ Erro ao chamar API de login:', apiError.message);
      
      if (apiError.response) {
        console.log(`Status: ${apiError.response.status}`);
        console.log('Resposta de erro:', apiError.response.data);
      }
    }
    
    // Verificar logs do servidor para erros
    console.log('\n🔍 VERIFICANDO LOGS RECENTES DO SERVIDOR:');
    const logPath = path.join(process.cwd(), 'logs', 'app.log');
    
    if (fs.existsSync(logPath)) {
      // Ler as últimas 50 linhas do arquivo de log
      const logContent = fs.readFileSync(logPath, 'utf8');
      const logLines = logContent.split('\n').slice(-50);
      
      console.log('Últimas 50 linhas do log do servidor:');
      logLines.forEach(line => {
        // Destacar linhas de erro
        if (line.includes('ERROR') || line.includes('error')) {
          console.log(`❌ ${line}`);
        } 
        // Destacar linhas relacionadas a token
        else if (line.includes('token') || line.includes('Token') || line.includes('JWT')) {
          console.log(`🔑 ${line}`);
        }
        // Destacar linhas relacionadas a login
        else if (line.includes('login') || line.includes('Login')) {
          console.log(`👤 ${line}`);
        }
      });
    } else {
      console.log(`❓ Arquivo de log não encontrado em ${logPath}`);
    }
    
    // Verificar configurações do frontend relacionadas a autenticação
    console.log('\n🔍 VERIFICANDO CONFIGURAÇÕES DO FRONTEND:');
    
    const possiveisArquivosFrontend = [
      path.join(process.cwd(), 'frontend', 'src', 'services', 'auth.service.js'),
      path.join(process.cwd(), 'frontend', 'src', 'utils', 'auth.js'),
      path.join(process.cwd(), 'frontend', 'src', 'context', 'AuthContext.js'),
      path.join(process.cwd(), 'frontend', 'src', 'store', 'auth.js')
    ];
    
    let frontendEncontrado = false;
    for (const arquivo of possiveisArquivosFrontend) {
      if (fs.existsSync(arquivo)) {
        console.log(`✅ Arquivo de autenticação frontend encontrado: ${arquivo}`);
        frontendEncontrado = true;
        
        // Ler o conteúdo do arquivo
        const conteudo = fs.readFileSync(arquivo, 'utf8');
        
        // Procurar por funções de processamento de token
        if (conteudo.includes('token')) {
          console.log('📋 Arquivo contém referências a tokens');
          
          // Verificar se o arquivo processa corretamente a resposta da API
          if (conteudo.includes('data.data.token') || conteudo.includes('response.data.data.token')) {
            console.log('✅ O frontend parece processar a estrutura correta da resposta da API');
          } else if (conteudo.includes('data.token') || conteudo.includes('response.data.token')) {
            console.log('⚠️ O frontend pode estar esperando uma estrutura diferente (data.token ao invés de data.data.token)');
          }
        }
        
        break;
      }
    }
    
    if (!frontendEncontrado) {
      console.log('❓ Nenhum arquivo de autenticação frontend encontrado nos caminhos verificados');
    }
    
    console.log('\n📋 RECOMENDAÇÕES:');
    console.log('1. Verifique a configuração CORS no servidor para garantir que o frontend possa acessar a API');
    console.log('2. Verifique se o frontend está processando corretamente a estrutura da resposta da API');
    console.log('3. Reinicie o servidor após todas as modificações');
    console.log('4. Limpe os cookies do navegador e tente fazer login novamente');
    console.log(`5. Use a URL correta da API: ajuste a URL ${API_BASE_URL} no script se necessário`);
    
    // Gerar um exemplo de como o frontend deve processar a resposta
    console.log('\n📝 EXEMPLO DE CÓDIGO PARA O FRONTEND PROCESSAR O LOGIN:');
    console.log(`
// Exemplo usando axios
async function login(email, password) {
  try {
    const response = await axios.post('${API_BASE_URL}/api/auth/login', { email, password });
    
    // Verificar se a resposta contém os dados esperados
    if (response.data && response.data.data && response.data.data.token) {
      // Salvar o token no localStorage ou em cookies
      localStorage.setItem('token', response.data.data.token);
      
      // Salvar o refresh token, se existir
      if (response.data.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
      
      return true;
    } else {
      console.error('Estrutura de resposta inesperada:', response.data);
      return false;
    }
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}
    `);
    
    // Fechar conexão com o MongoDB
    await mongoose.connection.close();
    console.log('\n✅ Testes concluídos!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(0);
  }
}

// Executar o script
testarLoginAPI(); 