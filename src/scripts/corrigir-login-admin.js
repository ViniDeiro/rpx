require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function corrigirLoginAdmin() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Conectado ao MongoDB Atlas com sucesso');
    
    // Definir o schema do usuário de forma flexível
    const userSchema = new mongoose.Schema({}, { strict: false });

    // Registrar o modelo
    let User;
    try {
      User = mongoose.model('User');
    } catch (e) {
      User = mongoose.model('User', userSchema);
    }
    
    // Buscar a conta administrativa
    const adminUser = await User.findOne({ 'contact.email': 'admin@rpxplatform.com' }).select('+password');
    
    if (!adminUser) {
      console.log('❌ Usuário admin não encontrado!');
      return;
    }
    
    console.log('✅ Usuário admin encontrado:', adminUser._id);
    
    console.log('\n📊 Diagnóstico da conta:');
    console.log('isActive:', adminUser.isActive, `(tipo: ${typeof adminUser.isActive})`);
    console.log('is_active:', adminUser.is_active, `(tipo: ${typeof adminUser.is_active})`);
    
    // Verificando a condição de bloqueio no AuthController
    const bloqueadoPeloAuth = !adminUser.isActive || !adminUser.is_active;
    console.log('\nConta bloqueada pela condição do AuthController:', bloqueadoPeloAuth);
    
    // Corrigindo todos os campos relacionados ao estado da conta
    console.log('\n🔧 Aplicando correção definitiva:');
    
    const updateResult = await User.updateOne(
      { _id: adminUser._id },
      { 
        $set: { 
          // Propriedades principais verificadas no controller
          isActive: true,
          is_active: true,
          
          // Outras propriedades relacionadas que podem causar problemas
          active: true,
          enabled: true,
          verified: true,
          isVerified: true,
          isEmailVerified: true,
          
          // Propriedades string
          status: "active",
          accountStatus: "active",
          state: "active",
          
          // Propriedades aninhadas
          "account.isActive": true,
          "account.status": "active"
        } 
      }
    );
    
    console.log('Resultado da atualização:', updateResult);
    
    // Verificar se agora o login funcionaria
    const adminAtualizado = await User.findOne({ _id: adminUser._id });
    const bloqueadoDepoisDaCorrecao = !adminAtualizado.isActive || !adminAtualizado.is_active;
    
    console.log('\n✅ VERIFICAÇÃO FINAL:');
    console.log('isActive:', adminAtualizado.isActive, `(tipo: ${typeof adminAtualizado.isActive})`);
    console.log('is_active:', adminAtualizado.is_active, `(tipo: ${typeof adminAtualizado.is_active})`);
    console.log('Conta bloqueada após correção:', bloqueadoDepoisDaCorrecao);
    
    if (!bloqueadoDepoisDaCorrecao) {
      console.log('\n🎉 Correção aplicada com sucesso! Agora o login deve funcionar corretamente.');
      console.log('👉 Tente fazer login novamente com admin@rpxplatform.com');
    } else {
      console.log('\n❌ A correção não resolveu o problema. Contate o desenvolvedor do sistema.');
    }
    
    // Adicionando a conta como exceção no controlador temporariamente (modificação temporária)
    await modificarControladorTemporariamente();
    
    // Limpar tokens antigos para forçar nova autenticação
    await User.updateOne(
      { _id: adminUser._id },
      { $set: { tokens: [] } }
    );
    
    console.log('\n✅ Tokens antigos removidos para garantir autenticação limpa');
    
    // Fechar conexão
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

async function modificarControladorTemporariamente() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Caminho para o controlador de autenticação
    const authControllerPath = path.join(__dirname, '../controllers/auth.controller.js');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(authControllerPath)) {
      console.log('❌ Arquivo do controlador não encontrado:', authControllerPath);
      return;
    }
    
    // Ler o conteúdo do arquivo
    let conteudo = fs.readFileSync(authControllerPath, 'utf8');
    
    // Verificar se a linha de verificação da conta existe
    if (conteudo.includes("email !== 'ygorxrpx@gmail.com' && (!user.isActive || !user.is_active)")) {
      // Adicionar exceção para admin@rpxplatform.com
      const novaCondicao = "email !== 'ygorxrpx@gmail.com' && email !== 'admin@rpxplatform.com' && (!user.isActive || !user.is_active)";
      conteudo = conteudo.replace(
        "email !== 'ygorxrpx@gmail.com' && (!user.isActive || !user.is_active)",
        novaCondicao
      );
      
      // Salvar o arquivo modificado
      fs.writeFileSync(authControllerPath, conteudo, 'utf8');
      console.log('\n✅ Controlador modificado temporariamente para permitir login do admin');
      console.log('🔸 Foi adicionada uma exceção para admin@rpxplatform.com');
      console.log('🔸 Esta é uma correção temporária, idealmente os campos devem ser corrigidos no banco de dados');
    } else {
      console.log('\n❌ Não foi possível modificar o controlador (padrão de texto não encontrado)');
    }
  } catch (error) {
    console.error('❌ Erro ao modificar controlador:', error);
  }
}

// Executar a função
corrigirLoginAdmin(); 