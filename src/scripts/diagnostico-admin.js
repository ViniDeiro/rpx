
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

async function diagnosticoContaAdmin() {
  try {
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Conectado ao MongoDB Atlas com sucesso');
    
    
    const userSchema = new mongoose.Schema({}, { strict: false });

    
    let User;
    try {
      User = mongoose.model('User');
    } catch (e) {
      User = mongoose.model('User', userSchema);
    }
    
    
    const adminUser = await User.findOne({ 'contact.email': 'admin@rpxplatform.com' });
    
    if (!adminUser) {
      console.log('❌ Usuário admin não encontrado!');
      return;
    }
    
    console.log('✅ Usuário admin encontrado:', adminUser._id);
    
    
    const adminDoc = adminUser.toObject();
    
    
    fs.writeFileSync('admin-structure.json', JSON.stringify(adminDoc, null, 2));
    console.log('✅ Estrutura completa salva em admin-structure.json');
    
    
    console.log('\n🔍 DIAGNÓSTICO DE CAMPOS DE ATIVAÇÃO:');
    
    
    function encontrarCamposDeAtivacao(obj, caminho = '') {
      for (const [chave, valor] of Object.entries(obj)) {
        const caminhoAtual = caminho ? `${caminho}.${chave}` : chave;
        
        
        if (
          typeof chave === 'string' && 
          (
            chave.toLowerCase().includes('activ') || 
            chave.toLowerCase().includes('ativ') ||
            chave.toLowerCase().includes('enabled') ||
            chave.toLowerCase().includes('status') ||
            chave.toLowerCase().includes('state')
          )
        ) {
          console.log(`${caminhoAtual}: ${valor} (${typeof valor})`);
        }
        
        // Continuar verificando recursivamente se for um objeto
        if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
          encontrarCamposDeAtivacao(valor, caminhoAtual);
        }
      }
    }
    
    encontrarCamposDeAtivacao(adminDoc);
    
    // Verificar especificamente os campos que usamos na condição de login
    console.log('\n🛑 VERIFICAÇÃO DA CONDIÇÃO DE LOGIN:');
    console.log(`isActive: ${adminUser.isActive} (${typeof adminUser.isActive})`);
    console.log(`is_active: ${adminUser.is_active} (${typeof adminUser.is_active})`);
    
    // Verificar a condição exata usada no AuthController
    const condicaoLoginAtendida = !(adminUser.isActive === false || adminUser.is_active === false);
    console.log(`\nCondição de login (!(isActive === false || is_active === false)): ${condicaoLoginAtendida}`);
    
    if (!condicaoLoginAtendida) {
      if (adminUser.isActive === false) console.log('⚠️ isActive é false, o que está causando bloqueio');
      if (adminUser.is_active === false) console.log('⚠️ is_active é false, o que está causando bloqueio');
    }
    
    // Tentar atualizar a conta com todas as possibilidades
    console.log('\n🔄 TENTANDO ATUALIZAÇÃO MAIS AGRESSIVA:');
    
    // Usar updateOne com upsert para forçar criação dos campos necessários
    const updateResult = await User.updateOne(
      { _id: adminUser._id },
      { 
        $set: { 
          // Força campos booleanos
          isActive: true, 
          is_active: true,
          active: true,
          enabled: true,
          isEmailVerified: true,
          
          // Campos de string
          status: "active",
          accountStatus: "active",
          state: "active",
          
          // Campos aninhados
          "account.isActive": true,
          "account.status": "active",
          
          // Forçar conversão de tipos
          disabled: false,
          suspended: false,
          banned: false
        }
      },
      { upsert: true } // Força criação dos campos
    );
    
    console.log('Resultado da atualização:', updateResult);
    
    // Verificar se a atualização funcionou
    const adminAtualizado = await User.findOne({ _id: adminUser._id });
    console.log('\n✅ VERIFICAÇÃO PÓS-ATUALIZAÇÃO:');
    console.log(`isActive: ${adminAtualizado.isActive} (${typeof adminAtualizado.isActive})`);
    console.log(`is_active: ${adminAtualizado.is_active} (${typeof adminAtualizado.is_active})`);
    
    const condicaoLoginAtendidaAgora = !(adminAtualizado.isActive === false || adminAtualizado.is_active === false);
    console.log(`\nCondição de login após atualização: ${condicaoLoginAtendidaAgora}`);
    
    // Remover qualquer token de JWT para forçar nova autenticação
    console.log('\n🔄 LIMPANDO TOKENS DE AUTENTICAÇÃO:');
    if (adminUser.tokens && adminUser.tokens.length > 0) {
      console.log(`Removendo ${adminUser.tokens.length} tokens`);
      await User.updateOne(
        { _id: adminUser._id },
        { $set: { tokens: [] } }
      );
    } else {
      console.log('Não há tokens para limpar');
    }
    
    // Fechar conexão
    await mongoose.connection.close();
    console.log('\n✅ Diagnóstico concluído e conexão encerrada');
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
    process.exit(1);
  }
}

// Executar
diagnosticoContaAdmin(); 