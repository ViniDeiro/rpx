/**
 * Configuração do Swagger para documentação da API
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const packageJson = require('../../package.json');

// Opções de configuração do Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RPX Platform API',
      version: packageJson.version || '1.0.0',
      description: 'API para a plataforma RPX de apostas em E-Sports',
      license: {
        name: 'Privada',
        url: 'https://rpxplatform.com.br/terms'
      },
      contact: {
        name: 'Equipe RPX',
        url: 'https://rpxplatform.com.br',
        email: 'api@rpxplatform.com.br'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Autenticação',
        description: 'Endpoints para autenticação e gerenciamento de sessões'
      },
      {
        name: 'Usuários',
        description: 'Operações relacionadas a usuários'
      },
      {
        name: 'Partidas',
        description: 'Endpoints para gerenciamento de partidas'
      },
      {
        name: 'Apostas',
        description: 'Operações para apostas e mercados'
      },
      {
        name: 'Carteira',
        description: 'Gerenciamento de saldo e transações'
      },
      {
        name: 'Torneios',
        description: 'Endpoints para gerenciamento de torneios'
      },
      {
        name: 'Equipes',
        description: 'Operações relacionadas a equipes e jogadores'
      },
      {
        name: 'Rankings',
        description: 'Endpoints para classificações e rankings'
      },
      {
        name: 'Notificações',
        description: 'Gerenciamento de notificações do usuário'
      }
    ]
  },
  // Caminhos para os arquivos com anotações de documentação
  apis: [
    './src/routes/*.js',
    './src/models/*.js',
    './src/middleware/*.js',
    './src/docs/*.js',    // Arquivos JS de documentação
    './src/docs/*.yaml'   // Arquivos YAML adicionais de documentação
  ]
};

// Gerar especificação do Swagger
const swaggerSpec = swaggerJsdoc(options);

// Função para configurar o Swagger no Express
const setupSwagger = (app) => {
  // Rota para a UI do Swagger
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'RPX Platform API Docs'
  }));
  
  // Rota para o JSON da especificação do Swagger
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  console.log('Swagger documentação configurada em /api/docs');
};

module.exports = {
  setupSwagger
}; 