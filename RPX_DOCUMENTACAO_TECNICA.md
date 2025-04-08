# Documentação Técnica: Projeto RPX - Plataforma de Apostas de Free Fire

## 1. Visão Geral do Projeto

O Projeto RPX é uma plataforma digital focada em competições e apostas de Free Fire, visando promover o crescimento profissional dos jogadores e oferecer oportunidades de investimento. O sistema inclui rankings, premiações mensais, torneios diários e um ambiente de gestão financeira otimizada, com transações e pagamentos automáticos.

### 1.1 Objetivos Principais

- Criar um hub competitivo sustentável para a comunidade de Free Fire
- Automatizar completamente o processo de apostas e pagamentos
- Promover o crescimento profissional de jogadores através de sistemas de ranking e premiações
- Oferecer experiência de usuário superior com processamento em tempo real
- Implementar sistema seguro de transações financeiras

### 1.2 Funcionalidades Principais

- Sistema de torneios com diferentes formatos
- Sistema de apostas automatizado em partidas
- Ranking de jogadores com filtros e classificações
- Loja com itens como lootboxes e pacotes VIP
- Empresariamento de jogadores de destaque
- Sistema de coins e recompensas

## 2. Arquitetura do Sistema

### 2.1 Visão Geral da Arquitetura

- **Frontend**: Next.js + React + TypeScript + TailwindCSS
- **Backend**: Node.js + Express
- **Banco de Dados**: MongoDB (principal) + Redis (cache)
- **Serviços em Tempo Real**: Socket.io
- **Processamento de Pagamentos**: Stripe/MercadoPago

### 2.2 Diagrama de Arquitetura

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│                │     │                │     │                │
│    Cliente     │────►│   API Gateway  │────►│  Microserviços │
│  (Next.js/Web) │     │   (Express)    │     │    (Node.js)   │
│                │◄────│                │◄────│                │
└────────────────┘     └────────────────┘     └────────────────┘
                              │  ▲                    │  ▲
                              │  │                    │  │
                              ▼  │                    ▼  │
                       ┌────────────────┐     ┌────────────────┐
                       │                │     │                │
                       │ Banco de Dados │     │  Serviços de   │
                       │   (MongoDB)    │     │   Terceiros    │
                       │                │     │                │
                       └────────────────┘     └────────────────┘
```

### 2.3 Infraestrutura

- **Desenvolvimento**: Docker para containerização
- **Produção**: AWS (ou similar) com balanceamento de carga
- **CI/CD**: GitHub Actions para integração e deploy contínuos
- **Monitoramento**: AWS CloudWatch, Sentry para erros

## 3. APIs e Integrações

### 3.1 API do Free Fire

A plataforma precisa de integração com dados de partidas de Free Fire. Como a Garena não oferece uma API pública oficial, existem algumas alternativas:

#### 3.1.1 Opções de Integração
- **API não-oficial**: Utilizar scraping de dados de partidas oficiais
- **Parceria com Garena**: Solicitar acesso à API privada (recomendado)
- **API da competição**: Integrar com APIs das ligas oficiais (LBFF, etc.)

#### 3.1.2 Dados Necessários
- Calendário de partidas
- Dados em tempo real durante partidas
- Resultados oficiais de partidas
- Estatísticas de jogadores

### 3.2 Integrações Externas

- **API de Pagamentos**: Stripe/MercadoPago/PagSeguro
- **API de Autenticação**: Auth0/Firebase Auth/JWT próprio
- **API de Notificações**: Firebase Cloud Messaging/OneSignal
- **API de Análise de Dados**: Google Analytics/Mixpanel

## 4. Banco de Dados

### 4.1 Estrutura MongoDB

#### 4.1.1 Collections Principais
- `users`: Dados de usuários
- `matches`: Informações de partidas
- `tournaments`: Estrutura de torneios
- `bets`: Registro de apostas
- `transactions`: Histórico financeiro
- `items`: Itens da loja
- `inventory`: Inventário de usuários

#### 4.1.2 Exemplo de Schema User
```json
{
  "_id": "ObjectId",
  "username": "String",
  "email": "String",
  "password": "String (hashed)",
  "profile": {
    "name": "String",
    "avatar": "String (URL)",
    "level": "Number",
    "created_at": "Date"
  },
  "wallet": {
    "balance": "Number",
    "transactions": ["ObjectId"]
  },
  "stats": {
    "total_bets": "Number",
    "won_bets": "Number",
    "win_rate": "Number",
    "tournaments_joined": "Number",
    "tournaments_won": "Number"
  },
  "roles": ["String"],
  "is_active": "Boolean",
  "last_login": "Date"
}
```

#### 4.1.3 Exemplo de Schema Bet
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "match_id": "ObjectId",
  "amount": "Number",
  "odds": "Number",
  "selection": {
    "team_id": "String",
    "type": "String (win/lose/etc)"
  },
  "status": "String (pending/won/lost/cancelled)",
  "potential_return": "Number",
  "created_at": "Date",
  "settled_at": "Date"
}
```

### 4.2 Redis (Cache)

- Armazenamento de sessões
- Cache de partidas em andamento
- Dados em tempo real durante partidas
- Filas de processamento de resultados

## 5. Sistema de Apostas Automatizado

### 5.1 Rastreamento de Partidas

#### 5.1.1 Crawler de Dados
- Script para monitorar calendário oficial de jogos
- Atualização periódica de informações
- Armazenamento em banco de dados

#### 5.1.2 Agendador
- Sistema para abrir apostas antes das partidas
- Fechamento automático quando partida inicia
- Notificações para usuários

#### 5.1.3 Webhook
- Endpoint para receber atualizações de partidas em tempo real
- Processamento instantâneo de eventos

### 5.2 Motor de Apostas

#### 5.2.1 Processador de Odds
- Algoritmo para cálculo dinâmico de odds
- Ajuste baseado em volume de apostas
- Limitador de risco para a plataforma

#### 5.2.2 Validador de Apostas
- Sistema para validar apostas antes de confirmar
- Verificação de saldo disponível
- Prevenção de apostas duplicadas

#### 5.2.3 Limitador de Riscos
- Mecanismo para limitar apostas por jogo/usuário
- Detecção de padrões suspeitos
- Controle de exposição financeira

### 5.3 Sistema de Resultados

#### 5.3.1 Parser de Resultados
- Sistema para interpretar resultados das partidas
- Recuperação de dados de APIs ou crawlers
- Estruturação para processamento interno

#### 5.3.2 Verificador
- Validação cruzada de resultados para evitar erros
- Múltiplas fontes para confirmação
- Alerta para discrepâncias

#### 5.3.3 Processador de Pagamentos
- Cálculo automático de ganhos
- Execução de pagamentos para carteiras
- Histórico detalhado de transações

### 5.4 Detecção de Fraudes

#### 5.4.1 Monitor de Padrões
- Sistema para detectar apostas suspeitas
- Análise de comportamento de usuários
- Identificação de conluio entre contas

#### 5.4.2 Bloqueio de Contas
- Mecanismo para suspender contas suspeitas
- Processo de revisão manual
- Recuperação de fundos em caso de fraude

## 6. Frontend

### 6.1 Tecnologias

- Next.js para renderização híbrida (SSR/SSG)
- React para interface de usuário
- TypeScript para tipagem estática
- TailwindCSS para estilização
- Socket.io para atualizações em tempo real

### 6.2 Principais Páginas

- Home (Visão geral)
- Torneios (Listagem e detalhes)
- Apostas (Interface principal)
- Rankings (Classificação de jogadores)
- Loja (Lootboxes e itens)
- Perfil (Informações do usuário)
- Carteira (Saldo e transações)

### 6.3 Componentes Principais

- Header (Navegação principal)
- Footer (Links e informações)
- BetSlip (Seleção de apostas)
- MatchCard (Exibição de partidas)
- TournamentList (Lista de torneios)
- UserRanking (Tabela de classificação)
- StoreItem (Itens da loja)

## 7. Backend

### 7.1 Estrutura de APIs

#### 7.1.1 Endpoints Públicos
- `/api/auth/*`: Autenticação e gerenciamento de usuários
- `/api/matches`: Informações sobre partidas
- `/api/tournaments`: Dados de torneios
- `/api/rankings`: Classificações de jogadores
- `/api/store`: Itens da loja

#### 7.1.2 Endpoints Privados (Autenticados)
- `/api/bets`: Gerenciamento de apostas
- `/api/wallet`: Operações financeiras
- `/api/profile`: Informações do perfil
- `/api/inventory`: Itens do usuário

### 7.2 Middlewares

- Autenticação JWT
- Validação de requisições
- Limitação de taxa
- Compressão de resposta
- Logging

### 7.3 Serviços

- AuthService: Gerenciamento de autenticação
- BetService: Motor de apostas
- MatchService: Gerenciamento de partidas
- PaymentService: Processamento de pagamentos
- NotificationService: Sistema de notificações

## 8. Fluxo do Sistema de Apostas Automatizado

### 8.1 Criação de Partida

1. Sistema detecta nova partida oficial via crawler ou API
2. Partida é registrada no banco de dados com status "upcoming"
3. Odds iniciais são calculadas e definidas
4. Partida aparece na interface de apostas

### 8.2 Processo de Apostas

1. Usuário seleciona partida e resultado desejado
2. Sistema calcula potencial retorno baseado nas odds
3. Usuário confirma aposta
4. Sistema valida saldo e limites
5. Aposta é registrada com status "pending"
6. Saldo é debitado da carteira do usuário

### 8.3 Início de Partida

1. Sistema detecta início da partida
2. Apostas são automaticamente fechadas
3. Status da partida muda para "in_progress"
4. Atualizações em tempo real começam a ser enviadas para usuários

### 8.4 Finalização e Processamento

1. Sistema detecta término da partida
2. Resultado oficial é verificado
3. Partida é marcada como "completed"
4. Motor de apostas processa apostas pendentes
5. Apostas ganhadoras são marcadas como "won"
6. Apostas perdedoras são marcadas como "lost"
7. Ganhos são calculados e creditados para apostas ganhadoras
8. Notificações são enviadas aos usuários

## 9. Servidor de Desenvolvimento

### 9.1 Requisitos

- Node.js v16+
- Docker e Docker Compose
- MongoDB
- Redis

### 9.2 Setup do Ambiente

```bash
# Clonar repositório
git clone https://github.com/projeto-rpx/rpx-platform.git
cd rpx-platform

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Iniciar containers Docker
docker-compose up -d

# Iniciar servidor de desenvolvimento
npm run dev
```

### 9.3 Scripts Disponíveis

- `npm run dev`: Inicia servidor de desenvolvimento
- `npm run build`: Compila para produção
- `npm start`: Inicia servidor de produção
- `npm test`: Executa testes
- `npm run db:seed`: Popula banco com dados de teste

## 10. Cronograma de Implementação

### 10.1 Fase 1: Fundação (2-3 semanas)
- Configuração da infraestrutura
- Implementação do banco de dados
- Autenticação de usuários
- Interface básica

### 10.2 Fase 2: Core do Sistema (4-6 semanas)
- Sistema de partidas e torneios
- Motor básico de apostas
- Integração de pagamentos
- Dashboard de usuário

### 10.3 Fase 3: Automação (3-4 semanas)
- Crawler para dados de partidas
- Sistema de resultados automáticos
- Processamento de pagamentos automático
- Notificações em tempo real

### 10.4 Fase 4: Otimização (2-3 semanas)
- Segurança e anti-fraude
- Performance e escalabilidade
- Testes de carga
- Refinamentos da UX

## 11. Segurança

### 11.1 Autenticação e Autorização
- Autenticação baseada em JWT
- Senhas hashadas com bcrypt
- Autorização baseada em papéis
- Proteção contra ataques de força bruta

### 11.2 Segurança de Dados
- Criptografia de dados sensíveis
- Proteção contra SQL Injection
- Validação de entrada de dados
- Sanitização de saída de dados

### 11.3 Segurança de Aplicação
- Proteção contra CSRF
- Proteção contra XSS
- Rate limiting
- HTTPS em todas as comunicações

## 12. Escalabilidade

### 12.1 Estratégias de Escala
- Arquitetura de microserviços
- Balanceamento de carga
- Sharding de banco de dados
- Caching em múltiplas camadas

### 12.2 Otimização de Performance
- Indexação eficiente de banco de dados
- Compressão de respostas
- Lazy loading de componentes
- CDN para assets estáticos

## 13. Monitoramento

### 13.1 Métricas de Sistema
- Uso de CPU/Memória
- Resposta da API
- Queries de banco de dados
- Cache hit/miss ratio

### 13.2 Métricas de Negócio
- Usuários ativos
- Volume de apostas
- Conversão de depósitos
- Retenção de usuários

## 14. Considerações Legais

### 14.1 Regulamentações
- Conformidade com leis de apostas locais
- Termos de serviço claros
- Política de privacidade
- KYC para verificação de idade

### 14.2 Responsabilidade
- Jogo responsável
- Limites de apostas
- Auto-exclusão
- Suporte ao usuário

## 15. Próximos Passos Imediatos

1. Configurar ambiente de desenvolvimento Docker
2. Inicializar banco de dados MongoDB
3. Implementar sistema de autenticação
4. Desenvolver crawler de dados para partidas
5. Criar API mock para simulação de partidas

---

**Documento preparado por:** Equipe de Desenvolvimento RPX  
**Data:** 18/11/2023  
**Versão:** 1.0 