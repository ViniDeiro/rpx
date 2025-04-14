/**
 * Script para criar um usuário administrador
 * 
 * Para executar: node src/scripts/create-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectToDatabase } = require('../config/database');
const User = require('../models/user.model'); // Importação correta do modelo

// Administrador padrão
const adminData = {
  username: 'admin',
  password: 'admin123',
  name: 'Administrador',
  contact: {
    email: 'admin@rpxplatform.com',
    phone: '11999999999'
  },
  role: 'admin', // De acordo com o schema (role, não roles)
  isEmailVerified: true,
  level: 50,
  balance: 999999
};

// Função para criar admin
async function createAdmin() {
  try {
    console.log('Conectando ao banco de dados...');
    await connectToDatabase();
    console.log('✅ Conectado com sucesso ao MongoDB');

    // Verificar se o admin já existe
    console.log('Verificando se o administrador já existe...');
    const existingAdmin = await User.findOne({ 'contact.email': adminData.contact.email });
    
    if (existingAdmin) {
      console.log('⚠️ Administrador já existe com este email. ID:', existingAdmin._id);
      console.log('Detalhes do admin:', {
        username: existingAdmin.username,
        email: existingAdmin.contact.email,
        role: existingAdmin.role
      });
      
      // Verificar se já é admin
      if (existingAdmin.role !== 'admin') {
        console.log('Atualizando papel para admin...');
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ Usuário atualizado para administrador com sucesso!');
      }
    } else {
      // Criar novo administrador
      console.log('Criando novo administrador...');
      
      // Criptografar senha manualmente
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);
      
      // Criar documento diretamente
      const admin = new User({
        ...adminData,
        password: hashedPassword
      });
      
      // Salvar o administrador
      const savedAdmin = await admin.save();
      
      console.log('✅ Administrador criado com sucesso!');
      console.log('Detalhes do admin:', {
        id: savedAdmin._id,
        username: savedAdmin.username,
        email: savedAdmin.contact.email,
        role: savedAdmin.role
      });
      console.log('\nCREDENCIAIS DE ACESSO:');
      console.log('Email: admin@rpxplatform.com');
      console.log('Senha: admin123');
    }
    
    // Encerrar a conexão com o banco de dados
    console.log('\nDesconectando do banco de dados...');
    await mongoose.connection.close();
    console.log('✅ Desconectado do MongoDB');
    
    console.log('\nPROCESSO CONCLUÍDO!');
  } catch (error) {
    console.error('❌ Erro ao criar administrador:', error);
    // Encerrar a conexão com o banco de dados em caso de erro
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Executar a função
createAdmin(); 