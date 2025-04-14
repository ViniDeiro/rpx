/**
 * Script simples e direto para criar usuário admin
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Conectar diretamente ao MongoDB
async function createAdminUser() {
  try {
    // Mostrar a string de conexão (com senha oculta)
    const connectionString = process.env.MONGODB_URI || '';
    console.log('Usando conexão:', connectionString.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://$1:****@'));
    
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Conectado ao MongoDB Atlas com sucesso');
    
    // Definir o schema do usuário diretamente
    const userSchema = new mongoose.Schema({
      username: String,
      password: String,
      name: String,
      contact: {
        email: String,
        phone: String
      },
      role: String,
      isEmailVerified: Boolean,
      level: Number,
      balance: Number
    });

    // Registrar o modelo
    let User;
    try {
      User = mongoose.model('User');
    } catch (e) {
      User = mongoose.model('User', userSchema);
    }
    
    // Verificar se já existe usuário com esse email
    const existingUser = await User.findOne({ 'contact.email': 'admin@rpxplatform.com' });
    
    if (existingUser) {
      console.log('Usuário já existe:', existingUser._id);
      
      // Atualizar para admin se necessário
      if (existingUser.role !== 'admin') {
        await User.updateOne(
          { _id: existingUser._id },
          { $set: { role: 'admin' } }
        );
        console.log('Usuário atualizado para admin');
      }
    } else {
      // Criptografar senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Criar usuário admin
      const newAdmin = new User({
        username: 'admin',
        password: hashedPassword,
        name: 'Administrador',
        contact: {
          email: 'admin@rpxplatform.com',
          phone: '11999999999'
        },
        role: 'admin',
        isEmailVerified: true,
        level: 50,
        balance: 999999
      });
      
      // Salvar no banco
      await newAdmin.save();
      console.log('✅ Admin criado com sucesso!', newAdmin._id);
    }
    
    // Mostrar todos os usuários no banco para verificação
    const allUsers = await User.find({}).select('username contact.email role');
    console.log('\nLista de usuários no banco:');
    console.log(allUsers);
    
    // Fechar conexão
    await mongoose.connection.close();
    console.log('Conexão encerrada');
    
  } catch (error) {
    console.error('Erro ao criar admin:', error);
    process.exit(1);
  }
}

// Executar
createAdminUser(); 