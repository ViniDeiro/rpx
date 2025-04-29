// Script para criar um usuário de teste no MongoDB
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    console.log('Conectando ao MongoDB...');
    // Conectar ao MongoDB (localhost por padrão)
    const uri = 'mongodb://localhost:27017/rpx-database'; 
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Conexão com MongoDB estabelecida');
    
    const db = client.db('rpx-database');
    const users = db.collection('users');
    
    // Verificar se o usuário já existe
    const existingUser = await users.findOne({ email: 'teste@rpx.com' });
    if (existingUser) {
      console.log('Usuário de teste já existe, atualizando senha...');
      
      // Gerar senha hash
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('teste123', salt);
      
      // Atualizar usuário
      await users.updateOne(
        { email: 'teste@rpx.com' },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('Senha do usuário de teste atualizada com sucesso');
    } else {
      console.log('Criando novo usuário de teste...');
      
      // Gerar senha hash
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('teste123', salt);
      
      // Criar usuário de teste
      const testUser = {
        username: 'usuarioteste',
        email: 'teste@rpx.com',
        password: hashedPassword,
        name: 'Usuário Teste',
        role: 'user',
        createdAt: new Date(),
        wallet: {
          balance: 100
        },
        stats: {
          matches: 0,
          wins: 0,
          losses: 0
        }
      };
      
      await users.insertOne(testUser);
      console.log('Usuário de teste criado com sucesso');
    }
    
    console.log('\nDados para login:');
    console.log('Email: teste@rpx.com');
    console.log('Senha: teste123');
    
    await client.close();
    console.log('Conexão fechada');
  } catch (error) {
    console.error('Erro ao criar usuário de teste:', error);
  }
}

createTestUser(); 