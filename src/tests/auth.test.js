/**
 * Testes para os endpoints de autenticação
 */

const request = require('supertest');
const { app, createTestUser } = require('./setup');

describe('Auth API Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const userData = {
        name: 'Novo Usuário',
        email: 'novo@example.com',
        password: 'Senha123@',
        username: 'novousuario'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });
    
    it('deve falhar ao registrar com email já existente', async () => {
      const userData = {
        name: 'Usuário Existente',
        email: 'existente@example.com',
        password: 'Senha123@',
        username: 'usuarioexistente'
      };
      
      // Registrar usuário
      await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      // Tentar registrar novamente com o mesmo email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toHaveProperty('email');
    });
    
    it('deve falhar ao registrar com senha fraca', async () => {
      const userData = {
        name: 'Usuário Senha Fraca',
        email: 'senhafraca@example.com',
        password: '123456', // Senha fraca
        username: 'usuariosenhafraca'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toHaveProperty('password');
    });
  });
  
  describe('POST /api/auth/login', () => {
    it('deve fazer login com sucesso usando email', async () => {
      const userData = {
        name: 'Usuário Login',
        email: 'login@example.com',
        password: 'Senha123@',
        username: 'usuariologin'
      };
      
      // Registrar usuário
      await createTestUser(userData);
      
      // Fazer login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.user.email).toBe(userData.email);
    });
    
    it('deve fazer login com sucesso usando username', async () => {
      const userData = {
        name: 'Usuário Login Username',
        email: 'loginusername@example.com',
        password: 'Senha123@',
        username: 'loginusername'
      };
      
      // Registrar usuário
      await createTestUser(userData);
      
      // Fazer login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: userData.password
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.user.username).toBe(userData.username);
    });
    
    it('deve falhar ao fazer login com credenciais inválidas', async () => {
      const userData = {
        name: 'Usuário Credenciais',
        email: 'credenciais@example.com',
        password: 'Senha123@',
        username: 'usuariocredenciais'
      };
      
      // Registrar usuário
      await createTestUser(userData);
      
      // Tentar login com senha incorreta
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'SenhaErrada123@'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('POST /api/auth/refresh', () => {
    it('deve atualizar o token com sucesso', async () => {
      const userData = {
        name: 'Usuário Refresh',
        email: 'refresh@example.com',
        password: 'Senha123@',
        username: 'usuariorefresh'
      };
      
      // Registrar usuário
      await createTestUser(userData);
      
      // Fazer login para obter tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });
      
      // Obter refresh token do cookie
      const cookies = loginResponse.headers['set-cookie'];
      const refreshTokenCookie = cookies.find(cookie => cookie.startsWith('refreshToken='));
      
      // Tentar obter novo access token usando refresh token
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshTokenCookie);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
    });
    
    it('deve falhar ao tentar atualizar sem refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('POST /api/auth/logout', () => {
    it('deve fazer logout com sucesso', async () => {
      const userData = {
        name: 'Usuário Logout',
        email: 'logout@example.com',
        password: 'Senha123@',
        username: 'usuariologout'
      };
      
      // Registrar usuário
      await createTestUser(userData);
      
      // Fazer login para obter tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });
      
      const { accessToken } = loginResponse.body.data;
      const cookies = loginResponse.headers['set-cookie'];
      const refreshTokenCookie = cookies.find(cookie => cookie.startsWith('refreshToken='));
      
      // Fazer logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', refreshTokenCookie);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verificar se o cookie foi removido
      expect(response.headers['set-cookie']).toBeDefined();
      const logoutCookies = response.headers['set-cookie'];
      const clearedCookie = logoutCookies.find(cookie => 
        cookie.startsWith('refreshToken=') && cookie.includes('Max-Age=0')
      );
      expect(clearedCookie).toBeDefined();
    });
  });
}); 