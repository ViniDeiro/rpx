# RPX Platform - Plataforma de Apostas Esportivas para E-Sports

![RPX Platform Logo](./docs/images/logo.png)

## Sobre o Projeto

RPX Platform é uma plataforma de apostas esportivas especializada em E-Sports, oferecendo aos fãs a oportunidade de apostar em seus jogos e times favoritos. A plataforma suporta diversos jogos competitivos, com foco inicial em Free Fire, CS:GO, League of Legends e Valorant.

## Funcionalidades Principais

- **Sistema de Apostas**: Aposte em diversas modalidades e mercados
- **Partidas ao Vivo**: Acompanhe estatísticas e resultados em tempo real
- **Carteira Digital**: Gerencie depósitos, saques e histórico de transações
- **Perfil de Usuário**: Acompanhe seu histórico de apostas e estatísticas
- **Torneios e Rankings**: Participe de torneios especiais e veja os melhores apostadores
- **Bônus e Promoções**: Aproveite bônus de cadastro e promoções regulares

## Estrutura do Projeto

O projeto é dividido em duas partes principais:

### Backend (Node.js/Express)

```
src/
├── config/           # Configurações da aplicação
├── controllers/      # Controladores para lógica de negócio
├── middleware/       # Middlewares do Express (auth, validação)
├── models/           # Modelos do MongoDB
├── routes/           # Rotas da API
├── services/         # Serviços de lógica de negócio
├── utils/            # Utilitários e helpers
├── app.js            # Configuração do Express
└── server.js         # Ponto de entrada da aplicação
```

### Frontend (Next.js)

```
frontend-rpx/
├── public/           # Arquivos estáticos
├── src/              # Código-fonte
│   ├── app/          # Páginas da aplicação (App Router)
│   ├── components/   # Componentes React reutilizáveis
│   ├── contexts/     # Contextos React (auth, etc)
│   ├── hooks/        # Hooks customizados
│   ├── lib/          # Bibliotecas e utilitários
│   ├── services/     # Serviços de API
│   └── styles/       # Estilos globais e temas
└── next.config.js    # Configuração do Next.js
```

## Tecnologias Utilizadas

### Backend
- **Node.js** e **Express** - Framework web
- **MongoDB** - Banco de dados
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação e autorização
- **Socket.io** - Comunicação em tempo real
- **Winston** - Sistema de logging

### Frontend
- **Next.js** - Framework React com SSR
- **React** - Biblioteca de UI
- **Tailwind CSS** - Framework CSS
- **Jotai** - Gerenciamento de estado
- **React Query** - Gerenciamento de dados assíncronos
- **Axios** - Cliente HTTP
- **React Hook Form** - Gerenciamento de formulários

## Requisitos

- Node.js v14+
- MongoDB 4.4+
- NPM ou Yarn

## Configuração e Instalação

### Configuração do Backend

1. Clone o repositório
   ```bash
   git clone https://github.com/seu-usuario/rpx-platform.git
   cd rpx-platform
   ```

2. Instale as dependências
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente: crie um arquivo `.env` baseado no `.env.example`
   ```
   MONGODB_URI=mongodb://localhost:27017/rpx-platform
   JWT_SECRET=seu_segredo_jwt
   PORT=3001
   NODE_ENV=development
   ```

4. Execute o backend
   ```bash
   npm run dev
   ```

### Configuração do Frontend

1. Navegue até a pasta do frontend
   ```bash
   cd frontend-rpx
   ```

2. Instale as dependências
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente: crie um arquivo `.env.local`
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

4. Execute o frontend
   ```bash
   npm run dev
   ```

5. Acesse a aplicação em `http://localhost:3000`

## Documentação da API

A documentação detalhada da API está disponível em `/api/docs` quando o servidor está em execução.

### Endpoints Principais

- **Autenticação**: `/api/auth/` - registro, login, refresh token
- **Usuários**: `/api/users/` - gerenciamento de perfis
- **Partidas**: `/api/matches/` - listar e gerenciar partidas
- **Apostas**: `/api/bets/` - criar e gerenciar apostas
- **Carteira**: `/api/wallet/` - operações financeiras
- **Torneios**: `/api/tournaments/` - competições
- **Equipes**: `/api/teams/` - equipes e jogadores

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Equipe

- Desenvolvedor Backend - [Nome]
- Desenvolvedor Frontend - [Nome]
- UX/UI Designer - [Nome]

## Contato

Para mais informações, entre em contato conosco pelo email: contato@rpxplatform.com.br 