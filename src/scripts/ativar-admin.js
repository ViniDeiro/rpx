/**
 * Script para ativar a conta do admin existente
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function ativarContaAdmin() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Conectado ao MongoDB Atlas com sucesso');
    
    // Definir o schema do usuário diretamente de forma flexível
    const userSchema = new mongoose.Schema({}, { strict: false });

    // Registrar o modelo
    let User;
    try {
      User = mongoose.model('User');
    } catch (e) {
      User = mongoose.model('User', userSchema);
    }
    
    // Buscar o usuário admin
    const adminUser = await User.findOne({ 'contact.email': 'admin@rpxplatform.com' });
    
    if (!adminUser) {
      console.log('❌ Usuário admin não encontrado!');
      return;
    }
    
    console.log('✅ Usuário admin encontrado:', adminUser._id);
    console.log('\n📊 Status atual:');
    console.log('- isActive:', adminUser.isActive);
    console.log('- is_active:', adminUser.is_active);
    console.log('- active:', adminUser.active);
    console.log('- status:', adminUser.status);
    console.log('- accountStatus:', adminUser.accountStatus);
    console.log('- isEmailVerified:', adminUser.isEmailVerified);
    
    // Atualizar todos os possíveis campos relacionados a status na coleção de usuários
    const updateResult = await User.updateOne(
      { _id: adminUser._id },
      { 
        $set: { 
          // Campos booleanos de ativação
          isActive: true, 
          is_active: true,
          active: true,
          enabled: true,
          "account.isActive": true,
          isEmailVerified: true,
          
          // Campos de string de status
          status: "active",
          accountStatus: "active",
          state: "active",
          "account.status": "active"
        } 
      }
    );
    
    console.log('\n🔄 Resultado da atualização:', updateResult);
    
    // Verificar se a atualização funcionou
    const adminAtualizado = await User.findOne({ _id: adminUser._id });
    console.log('\n✅ VERIFICAÇÃO PÓS-ATUALIZAÇÃO:');
    console.log('- isActive:', adminAtualizado.isActive);
    console.log('- is_active:', adminAtualizado.is_active);
    console.log('- active:', adminAtualizado.active);
    console.log('- status:', adminAtualizado.status);
    console.log('- accountStatus:', adminAtualizado.accountStatus);
    
    // Limpar tokens antigos para forçar nova autenticação
    console.log('\n🔄 Limpando tokens antigos...');
    await User.updateOne(
      { _id: adminUser._id },
      { $set: { tokens: [] } }
    );
    
    console.log('\n✅ Conta de administrador ativada com sucesso!');
    console.log('👉 Agora você pode fazer login com o usuário admin@rpxplatform.com');
    
    // Fechar conexão
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Erro ao ativar conta admin:', error);
  } finally {
    // Garantir que a conexão seja fechada mesmo em caso de erro
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(0);
  }
}

// Executar a função
ativarContaAdmin(); 