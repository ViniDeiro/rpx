# Configuração de Ambiente - Projeto RPX

Este documento descreve as configurações de ambiente necessárias para desenvolvimento, testes e produção do projeto RPX.

## Requisitos

- Node.js >= 16.0.0
- MongoDB Atlas (conta configurada)
- Redis (opcional para desenvolvimento local)
- Acesso ao repositório Git
- Docker e Docker Compose (opcional)

## Configuração Inicial

### 1. Clonando o Repositório

```bash
git clone https://github.com/projeto-rpx/rpx-platform.git
cd rpx-platform
```

### 2. Instalação de Dependências

```bash
# Instalar dependências do backend
npm install

# Instalar dependências do frontend
cd frontend-rpx
npm install
cd ..
```

### 3. Configuração de Variáveis de Ambiente

O projeto usa diferentes arquivos `.env` para diferentes ambientes:

- `.env.development` - Configurações para ambiente de desenvolvimento
- `.env.production` - Configurações para ambiente de produção
- `.env` - Cópia do ambiente atual de trabalho

**Importante**: Para desenvolvimento local, copie o arquivo `.env.development`:

```bash
cp .env.development .env
```

### 4. Configuração do MongoDB Atlas

1. Acesse o [MongoDB Atlas](https://cloud.mongodb.com/) e faça login
2. Crie um novo projeto ou use um existente
3. Crie um cluster (a versão gratuita é suficiente para desenvolvimento)
4. No painel lateral, acesse "Network Access" e adicione seu IP à lista de permissões
5. No painel lateral, acesse "Database Access" e crie um usuário com permissões de leitura/escrita
6. Obtenha a string de conexão e atualize a variável `MONGODB_URI` no seu arquivo `.env`

### 5. Configuração de Credenciais

Para desenvolvimento, você pode usar as credenciais de exemplo nos arquivos `.env.*`. Para produção, substitua os seguintes valores por valores seguros:

- `JWT_SECRET` - String aleatória e complexa para assinatura de tokens JWT
- `SESSION_SECRET` - String aleatória para gerenciamento de sessões
- Credenciais para APIs externas

## Execução do Projeto

### Ambiente de Desenvolvimento

```bash
# Rodar o backend em modo desenvolvimento
npm run dev

# Rodar o frontend em modo desenvolvimento (em outro terminal)
cd frontend-rpx
npm run dev
```

### Ambiente de Produção

```bash
# Construir o projeto para produção
npm run build

# Executar o projeto em modo produção
npm run start:prod
```

### Usando Docker

```bash
# Construir as imagens
npm run docker:build

# Iniciar os containers
npm run docker:up

# Parar os containers
npm run docker:down
```

## Scripts Disponíveis

- `npm run dev` - Executa o backend em modo desenvolvimento
- `npm run build` - Constrói o projeto (backend e frontend) para produção
- `npm run test` - Executa os testes
- `npm run lint` - Verifica o código com o linter
- `npm run db:seed` - Popula o banco de dados com dados de exemplo
- `npm run db:migrate` - Executa migrações no banco de dados
- `npm run deploy` - Simula o deploy para produção

## Solução de Problemas Comuns

### Erro de Conexão com MongoDB

Se você encontrar erros de conexão com o MongoDB:

1. Verifique se o IP atual está na whitelist do MongoDB Atlas
2. Confirme se a string de conexão está correta no arquivo `.env`
3. Verifique se seu usuário e senha do MongoDB estão corretos
4. Confirme se o cluster está ativo no MongoDB Atlas

### Erros de Porta em Uso

Se ocorrer o erro `EADDRINUSE` (porta em uso):

```bash
# Verificar processos usando a porta (Linux/Mac)
lsof -i :3001

# Verificar processos usando a porta (Windows)
netstat -ano | findstr :3001

# Ou matar o processo que está usando a porta
npx kill-port 3001
```

### Problemas com Dependências

Se encontrar problemas com dependências:

```bash
# Limpar cache do npm
npm cache clean --force

# Remover node_modules e reinstalar
rm -rf node_modules
npm install
```

## Contato

Para questões sobre configuração de ambiente, entre em contato com o líder técnico do projeto.

## Recursos Adicionais

- [Documentação do MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [Documentação do Node.js](https://nodejs.org/en/docs/)
- [Documentação do Docker](https://docs.docker.com/)
- [Documentação do Next.js](https://nextjs.org/docs) 