# Guia de Teste de Notificações de Convites para Lobby

Este documento descreve como testar e depurar o sistema de notificações de convites para lobby na plataforma RPX.GG.

## Problema Relatado

As notificações de convite para lobby não estão chegando corretamente para os usuários, impedindo que eles aceitem os convites e entrem nos lobbies.

## Ferramentas de Teste

Foram criados dois scripts para ajudar a testar e depurar o sistema de notificações:

1. **Script de Linha de Comando**: `frontend-rpx/src/scripts/test-lobby-invite.js`
2. **Script de Debug do Cliente**: `frontend-rpx/src/scripts/debug-notifications.js`

## Métodos de Teste

### 1. Teste no Servidor (Backend)

Para testar a criação de convites e notificações diretamente no banco de dados:

```bash
# Instalar dependências necessárias
npm install mongodb dotenv

# Criar um convite manualmente
node src/scripts/test-lobby-invite.js create <lobbyId> <userId> <recipientId>

# Listar convites pendentes para um usuário
node src/scripts/test-lobby-invite.js list <userId>

# Verificar notificações para um usuário
node src/scripts/test-lobby-invite.js check <userId>
```

Para obter os IDs necessários, você pode:
- Usar a ferramenta do MongoDB Compass para visualizar as coleções `users` e `lobbies`
- Ou usar o painel de administração da plataforma para ver os IDs dos usuários e lobbies

### 2. Teste no Cliente (Frontend)

Para testar e depurar as notificações no navegador:

1. Acesse a plataforma RPX.GG e faça login
2. Abra o console do desenvolvedor (F12 ou Ctrl+Shift+I)
3. Cole o conteúdo do script `frontend-rpx/src/scripts/debug-notifications.js` no console
4. O script iniciará automaticamente a depuração e exibirá informações sobre o sistema de notificações

Comandos disponíveis no console:

```javascript
// Buscar notificações manualmente
RPXDebug.notifications.fetchNotifications()

// Forçar a atualização do componente de notificações
RPXDebug.notifications.simulateLobbyInvite()

// Verificar a configuração do serviço de notificações push
RPXDebug.notifications.checkPushService()

// Iniciar a depuração completa
RPXDebug.startFullDebug()
```

## Fluxo de Teste Recomendado

1. **Preparação:**
   - Identifique dois usuários de teste (um para enviar e outro para receber convites)
   - Garanta que ambos estão com seus browsers abertos e logados na plataforma

2. **Verificação Inicial:**
   - Execute o comando para listar convites pendentes para o usuário receptor
   - Execute o comando para verificar notificações do usuário receptor
   - No navegador do usuário receptor, use o script de debug para verificar notificações

3. **Criação de Convite:**
   - No navegador do usuário emissor, crie um lobby e envie um convite para o receptor
   - OU use o script de linha de comando para criar um convite manualmente

4. **Verificação do Convite:**
   - Execute novamente os comandos para listar convites e verificar notificações
   - No navegador do receptor, use o script de debug para forçar a busca de notificações

5. **Análise de Logs:**
   - Verifique os logs do servidor para identificar possíveis erros na criação de convites ou notificações
   - Verifique os logs no console do navegador para identificar problemas na exibição das notificações

## Possíveis Problemas e Soluções

### Problema 1: Convites são criados mas as notificações não aparecem

Possíveis causas:
- A notificação não está sendo criada no banco de dados
- O polling de notificações não está funcionando corretamente
- O componente de notificações não está renderizando os convites

Solução:
1. Verifique se a notificação existe no banco de dados usando o script de teste
2. Force a busca de notificações usando o script de debug no cliente
3. Verifique se há erros no console do navegador

### Problema 2: Notificações aparecem mas o botão de aceitar não funciona

Possíveis causas:
- Erro na API de aceitação de convites
- IDs incorretos ou inválidos sendo passados para a API
- Problemas de permissão ou autenticação

Solução:
1. Verifique os logs do servidor quando tenta aceitar o convite
2. Use o script de debug para interceptar as chamadas de API
3. Verifique se os IDs de convite estão corretos no banco de dados

### Problema 3: Notificações não atualizam em tempo real

Possíveis causas:
- O intervalo de polling é muito longo
- Problemas com o serviço de websocket (se usado)
- Cache de dados antigos

Solução:
1. Verifique a configuração do intervalo de polling (padrão é 10 segundos)
2. Force a atualização manual das notificações usando o script de debug
3. Limpe o cache do navegador e teste novamente

## Dicas Adicionais

- Use o script de depuração no cliente em duas janelas lado a lado para ver o fluxo completo
- Verifique os logs do servidor em tempo real para identificar problemas
- Teste com diferentes navegadores para descartar problemas específicos de navegador

## Relatando Problemas

Ao relatar problemas com o sistema de notificações, inclua:

1. IDs dos usuários envolvidos no teste
2. ID do lobby e do convite (se disponíveis)
3. Logs do servidor relevantes
4. Screenshots ou logs do console do navegador
5. Passos específicos para reproduzir o problema 