/**
 * Script para verificar se as credenciais funcionam
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model'); // Importar o modelo corretamente

async function checkUserLogin() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Conectado ao MongoDB Atlas com sucesso');
    
    // Credenciais para teste
    const email = 'admin@rpxplatform.com';
    const password = 'admin123';
    
    console.log(`Tentando autenticar usuário: ${email}`);
    
    // Buscar o usuário pelo email
    const user = await User.findOne({ 'contact.email': email });
    
    if (!user) {
      console.error('❌ Usuário não encontrado!');
      process.exit(1);
    }
    
    console.log('✅ Usuário encontrado:', user._id);
    console.log('- Username:', user.username);
    console.log('- Email:', user.contact.email);
    console.log('- Role:', user.role);
    
    // Verificar senha usando o método direto do bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (isMatch) {
      console.log('✅ Senha correta!');
    } else {
      console.error('❌ Senha incorreta!');
      
      // Atualizar a senha manualmente
      console.log('Atualizando senha...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      user.password = hashedPassword;
      await user.save();
      
      console.log('✅ Senha atualizada!');
    }
    
    // Fechar conexão
    await mongoose.connection.close();
    console.log('Conexão encerrada');
    
  } catch (error) {
    console.error('Erro:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Executar
checkUserLogin(); 