const { MongoClient } = require('mongodb');

async function checkUsers() {
  const uri = 'mongodb+srv://vinideirolopess:R0KCnSZ4NcpnyM7X@cluster0.vocou4s.mongodb.net/';
  const client = new MongoClient(uri);
  
  try {
    console.log('Conectando ao MongoDB Atlas...');
    await client.connect();
    console.log('Conexão bem-sucedida!');
    
    // Acessar o banco de dados 'test' e a coleção 'users'
    const db = client.db('test');
    const usersCollection = db.collection('users');
    
    // Contar o número total de usuários
    const userCount = await usersCollection.countDocuments();
    console.log(`Total de usuários no banco de dados: ${userCount}`);
    
    // Listar todos os usuários
    const users = await usersCollection.find({}).toArray();
    
    console.log('Lista de usuários:');
    // Mostrar os dados dos usuários sem exibir a senha
    users.forEach((user, index) => {
      console.log(`\nUsuário ${index + 1}:`);
      console.log(`ID: ${user._id}`);
      console.log(`Nome: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Username: ${user.username || 'Não definido'}`);
      console.log(`Saldo: ${user.balance}`);
      console.log(`Data de criação: ${user.createdAt}`);
    });
    
  } catch (error) {
    console.error('Erro ao verificar usuários:', error);
  } finally {
    await client.close();
    console.log('\nConexão com MongoDB fechada');
  }
}

// Executar o script
checkUsers()
  .then(() => console.log('Verificação concluída!'))
  .catch(err => console.error('Erro no script principal:', err)); 