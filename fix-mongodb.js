const { MongoClient } = require('mongodb');

async function fixDatabase() {
  const uri = 'mongodb+srv://vinideirolopess:R0KCnSZ4NcpnyM7X@cluster0.vocou4s.mongodb.net/';
  const client = new MongoClient(uri);
  
  try {
    console.log('Conectando ao MongoDB Atlas...');
    await client.connect();
    console.log('Conexão bem-sucedida!');
    
    const db = client.db('test');
    const usersCollection = db.collection('users');
    
    // 1. Verificar os usuários com username nulo
    const nullUsernameUsers = await usersCollection.find({ username: null }).toArray();
    console.log(`Encontrados ${nullUsernameUsers.length} usuários com username nulo`);
    
    if (nullUsernameUsers.length > 0) {
      console.log('Informações dos usuários com username nulo:');
      console.log(JSON.stringify(nullUsernameUsers, null, 2));
      
      // 2. Atualizar usuários com username nulo
      for (const user of nullUsernameUsers) {
        const baseUsername = (user.name || 'user').toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
        const randomSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        const newUsername = `${baseUsername}_${randomSuffix}`;
        
        console.log(`Atualizando usuário ${user._id} com novo username: ${newUsername}`);
        
        const result = await usersCollection.updateOne(
          { _id: user._id }, 
          { $set: { username: newUsername } }
        );
        
        console.log(`Usuário atualizado: ${result.modifiedCount} documento(s) modificado(s)`);
      }
    }
    
    // 3. Verificar os usuários no banco de dados
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`Total de usuários no banco de dados: ${allUsers.length}`);
    console.log('Lista de usuários:');
    console.log(JSON.stringify(allUsers, null, 2));
    
    // 4. Verificar e corrigir índices
    console.log('Verificando índices na coleção users...');
    const indexes = await usersCollection.indexes();
    console.log('Índices existentes:');
    console.log(JSON.stringify(indexes, null, 2));
    
    console.log('Verificação e correção concluídas!');
  } catch (error) {
    console.error('Erro durante a correção:', error);
  } finally {
    await client.close();
    console.log('Conexão com MongoDB fechada');
  }
}

// Executar o script
fixDatabase()
  .then(() => console.log('Script concluído!'))
  .catch(err => console.error('Erro no script principal:', err)); 