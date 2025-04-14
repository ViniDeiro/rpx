# Guia de Deploy - RPX Platform

Este guia descreve como hospedar a plataforma RPX em uma VPS usando aaPanel e Cloudflare.

## 1. Preparação da VPS

### 1.1. Instalar o aaPanel

Acesse sua VPS via SSH e instale o aaPanel:

```bash
wget -O install.sh http://www.aapanel.com/script/install_6.0_en.sh
bash install.sh
```

Siga as instruções na tela para completar a instalação.

### 1.2. Configurar o aaPanel

1. Acesse o painel de administração (geralmente http://SEU_IP:8888)
2. Vá para "App Store" e instale:
   - Nginx
   - MySQL (se necessário para o backend)
   - PHP (se necessário para o backend)
   - Node.js (versão 16 ou superior)
   - PM2 (gerenciador de processos para Node.js)

### 1.3. Configurar o Site no aaPanel

1. Vá para "Website" > "Add site"
2. Configure:
   - Nome do domínio: seu-dominio.com
   - Pasta raiz: /www/wwwroot/seu-dominio.com
   - Criar certificado SSL (opcional, pois usaremos o Cloudflare)
   - Configurar banco de dados (se necessário)

## 2. Deploy do Frontend (Next.js)

### 2.1. Preparar os Arquivos

Na sua máquina local:

1. Construa a aplicação:
   ```bash
   cd frontend-rpx
   npm run build
   ```

2. Comprima a aplicação:
   ```bash
   tar -czf rpx-frontend.tar.gz .next node_modules public package.json package-lock.json next.config.js .env.production
   ```

3. Transfira o arquivo para a VPS:
   ```bash
   scp rpx-frontend.tar.gz usuario@seu-servidor:/tmp/
   ```

### 2.2. Configurar o Frontend na VPS

1. Acesse a VPS via SSH:
   ```bash
   ssh usuario@seu-servidor
   ```

2. Extraia os arquivos no diretório do site:
   ```bash
   cd /www/wwwroot/seu-dominio.com
   tar -xzf /tmp/rpx-frontend.tar.gz
   ```

3. Configure o PM2:
   ```bash
   # Instale o PM2 globalmente se ainda não tiver feito
   npm install -g pm2
   
   # Copie o arquivo ecosystem.config.js para o servidor
   scp ecosystem.config.js usuario@seu-servidor:/www/wwwroot/seu-dominio.com/
   
   # Inicie a aplicação com PM2
   cd /www/wwwroot/seu-dominio.com
   pm2 start ecosystem.config.js
   
   # Configure o PM2 para iniciar automaticamente após reboot
   pm2 save
   pm2 startup
   ```

### 2.3. Configurar o Nginx

1. No aaPanel, vá para "Website" > seu site > "Set"
2. Clique em "Rewrite" e adicione uma nova regra ou edite a configuração diretamente:

```nginx
# Em configurações do site (rewrite ou arquivo de configuração)
location / {
  proxy_pass http://localhost:3000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection 'upgrade';
  proxy_set_header Host $host;
  proxy_cache_bypass $http_upgrade;
}

# Para cacheamento de recursos estáticos
location /_next/static/ {
  alias /www/wwwroot/seu-dominio.com/.next/static/;
  expires 30d;
  access_log off;
}

location /static/ {
  alias /www/wwwroot/seu-dominio.com/public/static/;
  expires 30d;
  access_log off;
}
```

3. Reinicie o Nginx:
   ```bash
   # Via aaPanel ou comando
   /etc/init.d/nginx reload
   ```

## 3. Configuração do Cloudflare

### 3.1. Adicionar Domínio ao Cloudflare

1. Crie uma conta no Cloudflare se ainda não tiver
2. Adicione seu domínio
3. Atualize os nameservers no seu registrador de domínio para os fornecidos pelo Cloudflare
4. Aguarde a propagação dos nameservers (pode levar até 24 horas)

### 3.2. Configurar DNS

1. No painel do Cloudflare, vá para a seção "DNS"
2. Adicione um registro A apontando para o IP da sua VPS:
   - Tipo: A
   - Nome: @ (ou www para subdomínio)
   - Valor: [IP da sua VPS]
   - Proxy: Ativado (nuvem laranja)

### 3.3. Configurar SSL

1. Vá para "SSL/TLS" > "Visão geral"
2. Selecione o modo "Full" ou "Full (strict)"

### 3.4. Otimização de Performance

1. Vá para "Speed" > "Optimization"
2. Ative:
   - Auto Minify (HTML, CSS, JavaScript)
   - Brotli
   - Rocket Loader (opcional)

3. Configure Page Rules (opcional):
   - Cache Everything para recursos estáticos
   - Bypass Cache para rotas dinâmicas

## 4. Manutenção e Updates

### 4.1. Atualizar o Frontend

Para atualizar a aplicação:

```bash
# Na sua máquina local
cd frontend-rpx
git pull  # ou atualize o código
npm ci
npm run build
tar -czf rpx-frontend.tar.gz .next node_modules public package.json package-lock.json next.config.js .env.production
scp rpx-frontend.tar.gz usuario@seu-servidor:/tmp/

# Na VPS
cd /www/wwwroot/seu-dominio.com
mv .next .next-backup  # backup
tar -xzf /tmp/rpx-frontend.tar.gz
pm2 restart rpx-frontend
```

### 4.2. Monitoramento

1. Verifique o status da aplicação:
   ```bash
   pm2 status
   pm2 logs rpx-frontend
   ```

2. Configure monitoramento no aaPanel

3. Use o Cloudflare Analytics para monitorar tráfego

## 5. Configuração de Segurança

### 5.1. Firewall

1. No aaPanel, configure o firewall para permitir apenas as portas necessárias (80, 443, 22)

2. No Cloudflare:
   - Ative WAF (Web Application Firewall)
   - Configure regras de segurança

### 5.2. Rate Limiting

Configure rate limiting no Cloudflare para evitar abusos.

## 6. Backup

Configure backups automáticos no aaPanel para os arquivos do site e banco de dados.

---

## Solução de Problemas

### Aplicação não inicia com PM2
Verifique os logs:
```bash
pm2 logs rpx-frontend
```

### Erro 502 Bad Gateway
Verifique se o serviço Node.js está rodando:
```bash
pm2 status
```

### Problemas com SSL/TLS
Verifique a configuração do Cloudflare e certifique-se de que o modo SSL está correto.

### Problemas de Permissão
Ajuste as permissões dos arquivos na VPS:
```bash
chown -R www:www /www/wwwroot/seu-dominio.com
chmod -R 755 /www/wwwroot/seu-dominio.com
``` 