require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// URL base da API
const API_BASE_URL = 'http://localhost:3000';

async function testarLoginAdminAPI() {
  try {
    console.log('🔍 Iniciando teste de login admin na API...');
    
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
    
    // Obter o usuário admin para verificar suas propriedades
    const email = 'admin@rpxplatform.com';
    const adminUser = await User.findOne({ 'contact.email': email }).select('+password');
    
    if (!adminUser) {
      console.log(`❌ Usuário com email ${email} não encontrado!`);
      return;
    }
    
    console.log('✅ Usuário admin encontrado:', adminUser._id);
    
    // Verificar se o usuário admin tem as propriedades necessárias
    console.log('\n📊 USUÁRIO NO BANCO DE DADOS:');
    console.log('roles:', adminUser.roles);
    console.log('role:', adminUser.role);
    console.log('isAdmin:', adminUser.isAdmin);
    
    // Testar login na API
    console.log('\n🔄 TESTANDO LOGIN ADMIN NA API:');
    console.log(`Endpoint de login: ${API_BASE_URL}/api/auth/login`);
    
    try {
      // Senha padrão para teste (ajuste conforme necessário)
      const senhaParaTeste = "admin123";
      
      const loginData = {
        email: 'admin@rpxplatform.com',
        password: senhaParaTeste
      };
      
      console.log('📤 Enviando requisição com os dados:', {
        email: loginData.email,
        password: '********' // Ocultando a senha real
      });
      
      // Fazer a requisição de login
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, loginData);
      
      console.log(`✅ Resposta recebida (Status ${response.status})`);
      
      // Analisar a estrutura da resposta
      const respostaCompleta = response.data;
      
      console.log('\n📋 ESTRUTURA COMPLETA DA RESPOSTA:');
      console.log(JSON.stringify(respostaCompleta, null, 2));
      
      // Verificar se a resposta contém os dados do usuário
      let userData = null;
      if (respostaCompleta.data && respostaCompleta.data.user) {
        userData = respostaCompleta.data.user;
        console.log('\n👤 DADOS DO USUÁRIO NA RESPOSTA (data.user):');
      } else if (respostaCompleta.user) {
        userData = respostaCompleta.user;
        console.log('\n👤 DADOS DO USUÁRIO NA RESPOSTA (user):');
      }
      
      if (userData) {
        console.log(JSON.stringify(userData, null, 2));
        
        // Verificar se o usuário tem role/roles de admin
        let temRoleAdmin = false;
        if (userData.roles && Array.isArray(userData.roles) && userData.roles.includes('admin')) {
          console.log('\n✅ O usuário tem a role "admin" no array "roles"');
          temRoleAdmin = true;
        } else if (userData.role === 'admin') {
          console.log('\n✅ O usuário tem a propriedade "role" definida como "admin"');
          temRoleAdmin = true;
        } else {
          console.log('\n❌ O usuário não tem role de admin na resposta!');
        }
        
        // Verificar se a interface está verificando o campo correto
        if (!temRoleAdmin) {
          console.log('\n⚠️ PROBLEMA DETECTADO:');
          console.log('A API não está retornando as roles do usuário admin corretamente.');
          console.log('Verifique a função que prepara os dados de usuário para a resposta da API.');
        } else {
          // Simular a verificação que o frontend faz
          const verificacaoFrontend = userData.roles && userData.roles.includes('admin');
          
          if (!verificacaoFrontend) {
            console.log('\n⚠️ PROBLEMA NA VERIFICAÇÃO DO FRONTEND:');
            console.log('O frontend verifica a condição: userData.roles && userData.roles.includes("admin")');
            console.log('Mas a estrutura dos dados de usuário na resposta não atende a esta condição!');
            
            // Propor solução
            console.log('\n📝 SOLUÇÃO RECOMENDADA:');
            console.log('Modifique o código no frontend para verificar também "role == admin"');
          } else {
            console.log('\n✅ A verificação no frontend deve funcionar corretamente!');
          }
        }
      } else {
        console.log('\n❌ Não foi possível encontrar os dados do usuário na resposta!');
      }
      
    } catch (apiError) {
      console.error('\n❌ Erro ao chamar API de login:', apiError.message);
      
      if (apiError.response) {
        console.log(`Status: ${apiError.response.status}`);
        console.log('Resposta de erro:', apiError.response.data);
      }
    }
    
    // Fechar conexão com o MongoDB
    await mongoose.connection.close();
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

// Executar o script
testarLoginAdminAPI(); 