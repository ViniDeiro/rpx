/**
 * Script para ativar a conta de um usuário desativado no banco de dados
 * Modo de uso: node activate_user.js email@exemplo.com
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// URL de conexão do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rpx-platform';

console.log('Conectando ao MongoDB:', MONGODB_URI.substr(0, 20) + '...');

// Não definindo schema específico para poder acessar todos os campos
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado ao MongoDB com sucesso');
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error.message);
    process.exit(1);
  }
}

async function checkAndActivateUser(email) {
  try {
    // Buscar o usuário pelo email
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`Usuário com email ${email} não encontrado.`);
      return false;
    }

    // Imprimir a estrutura completa do documento
    console.log('Estrutura do documento do usuário:');
    console.log(JSON.stringify(user.toObject(), null, 2));
    
    // Verificar todas as propriedades possíveis de status
    console.log('\nEstado atual das propriedades de status:');
    console.log('user.isActive =', user.isActive);
    console.log('user.status =', user.status);
    console.log('user.account?.isActive =', user.account?.isActive);
    console.log('user.active =', user.active);
    console.log('user.enabled =', user.enabled);
    
    // Atualizar todas as propriedades possíveis relacionadas a status
    console.log('\nAtualizando propriedades:');
    
    let changes = false;
    
    // Atualizar isActive se existir
    if (user.isActive === false) {
      user.isActive = true;
      console.log('- Definido user.isActive = true');
      changes = true;
    }
    
    // Atualizar status se existir
    if (user.status && (user.status === 'inactive' || user.status === 'suspended' || user.status === 'disabled' || user.status === 'banned')) {
      user.status = 'active';
      console.log('- Definido user.status = "active"');
      changes = true;
    }
    
    // Atualizar account.isActive se existir
    if (user.account && user.account.isActive === false) {
      user.account.isActive = true;
      console.log('- Definido user.account.isActive = true');
      changes = true;
    }
    
    // Atualizar active se existir
    if (user.active === false) {
      user.active = true;
      console.log('- Definido user.active = true');
      changes = true;
    }
    
    // Atualizar enabled se existir
    if (user.enabled === false) {
      user.enabled = true;
      console.log('- Definido user.enabled = true');
      changes = true;
    }
    
    // Salvar as alterações
    if (changes) {
      await user.save();
      console.log(`\nO usuário ${email} foi atualizado com sucesso.`);
      return true;
    } else {
      console.log(`\nNenhuma alteração necessária para o usuário ${email}.`);
      return true;
    }
  } catch (error) {
    console.error('Erro ao verificar/ativar usuário:', error.message);
    return false;
  }
}

async function main() {
  // Pegar o email do usuário dos argumentos da linha de comando
  const email = process.argv[2];

  if (!email) {
    console.error('Por favor, forneça o email do usuário que deseja ativar.');
    console.error('Exemplo: node activate_user.js email@exemplo.com');
    process.exit(1);
  }

  try {
    // Conectar ao banco de dados
    await connectToDatabase();

    // Verificar e ativar o usuário
    const success = await checkAndActivateUser(email);

    // Encerrar a conexão com o banco de dados
    await mongoose.connection.close();

    if (success) {
      console.log('Operação concluída com sucesso.');
      process.exit(0);
    } else {
      console.error('Falha ao ativar o usuário.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Erro inesperado:', error.message);
    process.exit(1);
  }
}

// Executar o script
main(); 