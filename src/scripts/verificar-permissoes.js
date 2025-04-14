require('dotenv').config();
const mongoose = require('mongoose');

async function verificarECorrigirRoles() {
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
    const adminUser = await User.findOne({ 'contact.email': email });
    
    if (!adminUser) {
      console.log(`❌ Usuário com email ${email} não encontrado!`);
      return;
    }
    
    console.log('✅ Usuário admin encontrado:', adminUser._id);
    
    // Verificar as permissões atuais
    console.log('\n🔍 VERIFICANDO PERMISSÕES:');
    console.log('roles:', adminUser.roles);
    console.log('role:', adminUser.role);
    console.log('isAdmin:', adminUser.isAdmin);
    
    // Verificar problemas potenciais
    const problemas = [];
    
    if (!adminUser.roles) {
      problemas.push('❌ Campo "roles" não existe');
    } else if (!Array.isArray(adminUser.roles)) {
      problemas.push('❌ Campo "roles" não é um array');
    } else if (!adminUser.roles.includes('admin')) {
      problemas.push('❌ Role "admin" não está no array "roles"');
    }
    
    if (!adminUser.role) {
      problemas.push('❌ Campo "role" não existe');
    } else if (adminUser.role !== 'admin') {
      problemas.push('❌ Campo "role" não está definido como "admin"');
    }
    
    if (problemas.length > 0) {
      console.log('\n⚠️ PROBLEMAS ENCONTRADOS:');
      problemas.forEach(problema => console.log(problema));
      
      console.log('\n🔧 APLICANDO CORREÇÕES:');
      
      // Preparar objeto com atualizações
      const updateObj = {};
      
      // Corrigir campo 'roles'
      if (!adminUser.roles || !Array.isArray(adminUser.roles)) {
        updateObj.roles = ['admin', 'user'];
        console.log('✅ Definindo roles = ["admin", "user"]');
      } else if (!adminUser.roles.includes('admin')) {
        updateObj.roles = [...adminUser.roles, 'admin'];
        console.log(`✅ Adicionando "admin" ao array roles existente: ${adminUser.roles}`);
      }
      
      // Corrigir campo 'role'
      if (!adminUser.role || adminUser.role !== 'admin') {
        updateObj.role = 'admin';
        console.log('✅ Definindo role = "admin"');
      }
      
      // Corrigir outros campos potencialmente úteis
      updateObj.isAdmin = true;
      updateObj.permissions = updateObj.permissions || ['all'];
      
      // Aplicar atualizações
      const resultado = await User.updateOne(
        { _id: adminUser._id },
        { $set: updateObj }
      );
      
      console.log('\n✅ Resultado da atualização:', resultado);
      
      // Verificar usuário após atualização
      const adminAtualizado = await User.findOne({ 'contact.email': email });
      console.log('\n📊 PERMISSÕES APÓS ATUALIZAÇÃO:');
      console.log('roles:', adminAtualizado.roles);
      console.log('role:', adminAtualizado.role);
      console.log('isAdmin:', adminAtualizado.isAdmin);
      
      console.log('\n✅ Correções aplicadas com sucesso!');
      console.log('👉 Faça logout e tente novamente o login como administrador');
    } else {
      console.log('\n✅ Não foram encontrados problemas nas permissões do usuário admin!');
      
      // Verificar formato da resposta da API
      console.log('\n🔍 O problema pode estar na interpretação dos dados pela interface:');
      console.log('1. Verifique se o frontend está buscando corretamente "roles" ou "role"');
      console.log('2. Limpe o cache/cookies do navegador e tente novamente');
      console.log('3. Teste o login do admin usando o script de teste');
    }
    
    // Fechar conexão com o MongoDB
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

// Executar o script
verificarECorrigirRoles(); 