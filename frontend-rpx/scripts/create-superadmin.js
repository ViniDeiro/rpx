const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
  try {
    // String de conexão - use a mesma do arquivo de conexão do MongoDB
    const uri = "mongodb+srv://vinideirolopess:c7MVBr6XpIkQwGaZ@cluster0.vocou4s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    
    console.log('Conectando ao MongoDB...');
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Conexão com MongoDB estabelecida');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Verificar se o superadmin já existe
    console.log('Verificando se o superadmin já existe...');
    const existingUser = await usersCollection.findOne({ 
      $or: [
        { username: "master" },
        { email: "vini_deiro@rpx.com" }
      ]
    });
    
    if (existingUser) {
      console.log("O superadmin já existe:", existingUser.username);
      console.log("Email:", existingUser.email);
      await client.close();
      return;
    }
    
    // Hash da senha
    console.log('Criando hash da senha...');
    const hashedPassword = await bcrypt.hash('Vini200!', 10);
    
    // Criar o superadmin
    console.log('Inserindo superadmin no banco de dados...');
    const result = await usersCollection.insertOne({
      username: "master",
      email: "vini_deiro@rpx.com",
      password: hashedPassword,
      role: "superadmin",
      isHidden: true,
      isVerified: true,
      status: "active",
      profile: {
        name: "Administrador Master"
      },
      wallet: {
        balance: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log("Superadmin criado com sucesso!");
    console.log("ID:", result.insertedId);
    console.log("Username: master");
    console.log("Email: vini_deiro@rpx.com");
    console.log("Senha: Vini200!");
    console.log("Role: superadmin");
    
    await client.close();
    console.log('Conexão com MongoDB fechada');
  } catch (error) {
    console.error("Erro ao criar superadmin:", error);
  }
}

// Executar a função imediatamente
createSuperAdmin(); 