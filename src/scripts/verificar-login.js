require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function verificarLogin() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Conectado ao MongoDB Atlas com sucesso');
    
    // Schema flexível para acessar qualquer campo
    const userSchema = new mongoose.Schema({}, { strict: false });
    
    // Registrar o modelo
    let User;
    try {
      User = mongoose.model('User');
    } catch (e) {
      User = mongoose.model('User', userSchema);
    }
    
    // Buscar o usuário admin
    const email = 'admin@rpxplatform.com';
    const user = await User.findOne({ 'contact.email': email }).select('+password');
    
    if (!user) {
      console.log(`❌ Usuário com email ${email} não encontrado!`);
      return;
    }
    
    console.log('✅ Usuário encontrado:', user._id);
    
    // Simulando a verificação do login como no AuthController
    console.log('\n🔍 Simulando verificação do AuthController:');
    
    // Verificando a condição de login
    const loginPermitido = !(user.isActive === false || user.is_active === false);
    
    console.log(`Email testado: ${email}`);
    console.log(`isActive: ${user.isActive} (${typeof user.isActive})`);
    console.log(`is_active: ${user.is_active} (${typeof user.is_active})`);
    console.log(`A condição (!(user.isActive === false || user.is_active === false)): ${loginPermitido}`);
    
    // Verificando a condição completa com a exceção para o email ygorxrpx@gmail.com
    const emailExcecao = 'ygorxrpx@gmail.com';
    const ehEmailExcecao = email === emailExcecao;
    
    const loginBloqueadoCondicaoCompleta = email !== emailExcecao && (!user.isActive || !user.is_active);
    console.log(`\nCondição completa do bloqueio com exceção para ${emailExcecao}:`);
    console.log(`Email verificado é a exceção: ${ehEmailExcecao}`);
    console.log(`Condição de bloqueio (email !== '${emailExcecao}' && (!isActive || !is_active)): ${loginBloqueadoCondicaoCompleta}`);
    
    if (loginBloqueadoCondicaoCompleta) {
      console.log(`\n❌ Conta ${email} seria bloqueada pela condição de login no AuthController!`);
      // Verificando quais campos estão causando o bloqueio
      if (!user.isActive) console.log('- Campo isActive está false ou undefined');
      if (!user.is_active) console.log('- Campo is_active está false ou undefined');
    } else {
      console.log(`\n✅ Conta ${email} seria permitida pela condição de login no AuthController!`);
    }
    
    // Verificando se há propriedades undefined/null que podem estar causando o problema
    console.log('\n🔍 Verificando valores undefined/null que podem causar problemas:');
    if (user.isActive === undefined) console.log('- isActive é undefined!');
    if (user.is_active === undefined) console.log('- is_active é undefined!');
    if (user.isActive === null) console.log('- isActive é null!');
    if (user.is_active === null) console.log('- is_active é null!');
    
    // Forçando os campos novamente com tipo booleano explícito
    console.log('\n🔄 Forçando atualização com tipos booleanos explícitos:');
    const updateResult = await User.updateOne(
      { _id: user._id },
      { 
        $set: { 
          // Usando Boolean() para garantir o tipo correto
          isActive: true,
          is_active: true
        }
      }
    );
    
    console.log('Resultado da atualização:', updateResult);
    
    // Verificando o tipo após a atualização
    const userAtualizado = await User.findOne({ _id: user._id });
    console.log('\n✅ VERIFICAÇÃO FINAL:');
    console.log(`isActive: ${userAtualizado.isActive} (${typeof userAtualizado.isActive})`);
    console.log(`is_active: ${userAtualizado.is_active} (${typeof userAtualizado.is_active})`);
    
    // Fechando a conexão
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Erro ao verificar login:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(0);
  }
}

// Executar
verificarLogin(); 