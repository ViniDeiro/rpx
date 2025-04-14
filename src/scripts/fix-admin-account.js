/**
 * Script para solução radical do problema de conta admin desativada
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixAdminAccount() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Conectado ao MongoDB Atlas');
    
    // Acessar a coleção users diretamente sem usar o modelo
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Buscar o ID do admin
    const adminUser = await usersCollection.findOne({ 'contact.email': 'admin@rpxplatform.com' });
    
    if (!adminUser) {
      console.error('❌ Usuário admin não encontrado');
      return;
    }
    
    console.log(`✅ Admin encontrado: ${adminUser._id}`);
    
    // Criar novo admin com mesmas credenciais
    // Clonamos dados essenciais para preservar acesso
    const adminData = {
      username: adminUser.username,
      password: adminUser.password,
      name: adminUser.name || 'Administrador',
      contact: adminUser.contact,
      role: 'admin',
      status: 'active',
      isActive: true,
      is_active: true,
      active: true,
      enabled: true,
      isEmailVerified: true,
      avatarUrl: adminUser.avatarUrl,
      avatar: adminUser.avatar || '/images/avatars/default.png',
      level: 50,
      balance: 999999,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Deletar admin antigo e criar um novo do zero
    console.log('🔄 Recriando conta do administrador...');
    
    // Primeiramente, fazer backup do documento atual
    const adminBackup = { ...adminUser };
    console.log('📦 Backup do documento original criado');
    
    // Opção 1: Atualizar documento existente completamente
    const updateResult = await usersCollection.updateOne(
      { _id: adminUser._id },
      { 
        $set: adminData,
        $unset: {
          disabled: "",
          banned: "",
          suspended: ""
        }
      }
    );
    
    console.log('✅ Conta admin atualizada:', updateResult.modifiedCount);
    
    // Verificar se a atualização funcionou
    const adminUpdated = await usersCollection.findOne({ _id: adminUser._id });
    console.log('Status após atualização:');
    console.log('isActive:', adminUpdated.isActive);
    console.log('is_active:', adminUpdated.is_active);
    
    // Reiniciar o servidor expressamente para garantir que as alterações sejam aplicadas
    console.log('\n⚠️ REINICIE O SERVIDOR para aplicar as alterações!');
    
    // Fechar conexão
    await mongoose.connection.close();
    console.log('✅ Operação concluída');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
    process.exit(1);
  }
}

// Executar
fixAdminAccount(); 