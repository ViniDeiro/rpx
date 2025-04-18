# Sistema de Notificações da RPX.GG

Este documento descreve como configurar e utilizar o sistema de notificações da plataforma RPX.GG, que inclui notificações por email e notificações push.

## Índice

1. [Visão Geral](#visão-geral)
2. [Configuração de Email](#configuração-de-email)
3. [Configuração de Push Notifications](#configuração-de-push-notifications)
4. [APIs Disponíveis](#apis-disponíveis)
5. [Exemplos de Uso](#exemplos-de-uso)
6. [Resolução de Problemas](#resolução-de-problemas)

## Visão Geral

O sistema de notificações da RPX.GG consiste em dois componentes principais:

1. **Serviço de Email**: Permite enviar emails transacionais (verificação de conta, reset de senha, etc.) e emails em massa (anúncios, promoções).
2. **Serviço de Notificações Push**: Permite enviar notificações para dispositivos dos usuários, mesmo quando não estão com o site aberto.

## Configuração de Email

### Requisitos

- Conta em um provedor SMTP (SendGrid, Mailgun, etc.)
- Acesso ao painel administrativo para configurar as credenciais

### Passos para Configurar

1. **Configurar variáveis de ambiente**: 
   Adicione as seguintes variáveis no arquivo `.env` do projeto:

   ```
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_SECURE=false  # true para SSL
   EMAIL_USER=seu-usuario
   EMAIL_PASSWORD=sua-senha
   EMAIL_SENDER=no-reply@rpx.gg
   ```

2. **Testar o envio**:
   Você pode testar o envio de emails usando a API de teste em:
   `POST /api/notifications/email/test`

   ```json
   {
     "to": "destinatario@exemplo.com",
     "subject": "Email de Teste",
     "text": "Este é um email de teste"
   }
   ```

## Configuração de Push Notifications

### Requisitos

- Projeto no Firebase com Firebase Cloud Messaging (FCM) ativado
- Chave VAPID para notificações web push

### Passos para Configurar

1. **Configurar Firebase**:
   - Criar projeto no [Firebase Console](https://console.firebase.google.com/)
   - Ativar o Firebase Cloud Messaging
   - Gerar chave VAPID para web push

2. **Configurar variáveis de ambiente**:
   Adicione as seguintes variáveis no arquivo `.env`:

   ```
   # Firebase Cliente
   NEXT_PUBLIC_FIREBASE_API_KEY=sua-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=seu-app-id
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=sua-chave-vapid

   # Firebase Admin
   FIREBASE_ADMIN_PROJECT_ID=seu-projeto
   FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com
   FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nSua chave privada\n-----END PRIVATE KEY-----\n
   ```

3. **Configurar Service Worker**:
   - O arquivo `firebase-messaging-sw.js` deve estar na pasta `public`
   - Execute `npm run update-sw` para atualizar o arquivo com suas credenciais
   - Durante a build (`npm run build`), o script de atualização é executado automaticamente

4. **Testar as notificações**:
   Você pode testar as notificações push usando a API de teste:
   `POST /api/notifications/push/test`

   ```json
   {
     "userId": "id-do-usuario",
     "title": "Notificação de Teste",
     "body": "Esta é uma notificação de teste"
   }
   ```

## APIs Disponíveis

### Email

- `POST /api/notifications/email/mass-send`: Envio em massa de emails
- `POST /api/notifications/email/verification`: Envio de email de verificação
- `POST /api/notifications/email/password-reset`: Envio de email de reset de senha
- `POST /api/notifications/email/match`: Envio de notificação de partida
- `POST /api/notifications/email/payment`: Envio de confirmação de pagamento

### Push Notifications

- `POST /api/send-push`: Envio de notificação push
- `POST /api/push-tokens`: Registro de token de dispositivo
- `DELETE /api/push-tokens`: Remoção de token de dispositivo

## Exemplos de Uso

### Enviar Email de Verificação

```javascript
import { EmailService } from '@/services/email/emailService';

// Enviar email de verificação
await EmailService.sendVerificationEmail(
  'usuario@exemplo.com',
  'Nome do Usuário',
  'https://rpx.gg/verificar?token=12345'
);
```

### Enviar Notificação Push

```javascript
import { PushNotificationService } from '@/services/push/pushNotificationService';

// Obter token do dispositivo
const token = await PushNotificationService.getToken();

// Enviar notificação
await PushNotificationService.sendPushNotification(token, {
  title: 'Nova partida',
  body: 'Você tem uma nova partida disponível!'
});
```

### Enviar Email em Massa

```javascript
// Enviar para todos os usuários ativos
fetch('/api/notifications/email/mass-send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userFilter: { status: 'active' },
    subject: 'Novidades na RPX.GG',
    template: 'announcement',
    templateData: {
      title: 'Chegou a nova temporada!',
      content: '<p>Prepare-se para novos desafios e recompensas!</p>',
      callToAction: 'Saiba Mais',
      callToActionUrl: 'https://rpx.gg/novidades'
    }
  })
});
```

## Resolução de Problemas

### Emails não estão sendo enviados

1. **Verifique as credenciais SMTP**: Certifique-se de que as credenciais estão corretas
2. **Verifique logs de erro**: Consulte os logs para ver mensagens de erro detalhadas
3. **Teste com outro provedor**: Alguns provedores podem bloquear emails de teste

### Notificações Push não funcionam

1. **Verificar permissões do navegador**: O usuário precisa conceder permissão para notificações
2. **Verificar Service Worker**: Certifique-se de que o Service Worker está registrado corretamente
3. **Verificar Firebase Console**: Verifique se há erros no console do Firebase
4. **Testar em diferentes navegadores**: Alguns navegadores têm restrições específicas

### Outros problemas

Para outros problemas ou dúvidas, entre em contato com a equipe de desenvolvimento em `dev@rpx.gg`. 