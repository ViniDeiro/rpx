import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb/connect';
import User from '@/models/User';
import { generateToken, generateUserResponse } from '@/lib/auth/jwt';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Só aceita método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Método não permitido' 
    });
  }

  try {
    // Verifica se o corpo da requisição existe
    if (!req.body) {
      console.error('Corpo da requisição vazio ou inválido');
      return res.status(400).json({
        success: false,
        message: 'Corpo da requisição inválido',
      });
    }

    // Tentativa de conexão com o banco de dados
    console.log('Tentando conectar ao MongoDB...');
    try {
      const db = await connectToDatabase();
      if (!db) {
        console.error('Falha ao conectar ao banco de dados - conexão retornou null');
        return res.status(500).json({ 
          success: false,
          message: 'Erro de conexão com o banco de dados' 
        });
      }
      console.log('Conexão com MongoDB estabelecida com sucesso');
    } catch (dbConnectError) {
      console.error('Erro ao conectar ao MongoDB:', dbConnectError);
      return res.status(500).json({ 
        success: false,
        message: 'Erro ao conectar ao banco de dados. Tente novamente mais tarde.'
      });
    }

    // Extrai e loga todos os campos para debug
    const { name, email, password, birthdate, phone, cpf, username: providedUsername } = req.body;
    console.log('Dados recebidos:', { 
      name, 
      email, 
      birthdate: birthdate || 'não fornecido', 
      phone: phone || 'não fornecido',
      cpf: cpf ? 'fornecido' : 'não fornecido',
      hasUsername: !!providedUsername 
    });

    // Validação básica
    if (!name || !email || !password) {
      console.log('Campos obrigatórios ausentes:', { 
        name: !!name, 
        email: !!email, 
        password: !!password 
      });
      return res.status(400).json({ 
        success: false,
        message: 'Por favor, preencha todos os campos obrigatórios' 
      });
    }

    try {
      // Verifica se o email já está em uso
      console.log('Verificando se email já está em uso:', email);
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log('Email já em uso');
        return res.status(400).json({ 
          success: false,
          message: 'Este email já está em uso' 
        });
      }
      console.log('Email disponível para uso');

      // Verifica se o CPF já está em uso (se fornecido)
      if (cpf) {
        console.log('Verificando se CPF já está em uso...');
        const existingCPF = await User.findOne({ cpf: cpf.replace(/\D/g, '') });
        if (existingCPF) {
          console.log('CPF já cadastrado');
          return res.status(400).json({
            success: false,
            message: 'Este CPF já está cadastrado'
          });
        }
        console.log('CPF disponível para uso');
      }

      // Gera um username baseado no nome, removendo espaços e caracteres especiais
      const baseUsername = name
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '_');
      
      // Adiciona um número aleatório para garantir unicidade
      const randomSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      const username = providedUsername || `${baseUsername}_${randomSuffix}`;

      console.log('Username gerado:', username);

      try {
        // Processa o CPF para armazenar apenas dígitos
        const formattedCPF = cpf ? cpf.replace(/\D/g, '') : null;

        // Cria o novo usuário com Mongoose
        console.log('Iniciando criação do novo usuário...');
        const newUser = new User({
          name,
          email,
          password,
          username,
          birthdate: birthdate || null,
          phone: phone || null,
          cpf: formattedCPF,
          balance: 500,
        });

        // Salvando no banco de dados
        console.log('Salvando usuário no MongoDB...');
        const savedUser = await newUser.save();
        console.log('Usuário salvo com sucesso!');
        
        // Gerar token JWT
        console.log('Gerando token JWT...');
        const token = generateToken(savedUser);
        console.log('Token gerado com sucesso');
        
        // Retornar resposta com dados do usuário e token
        const userData = generateUserResponse(savedUser);
        
        // Responder com sucesso
        return res.status(201).json({
          success: true,
          data: {
            user: userData,
            token,
          },
        });
      } catch (dbError: any) {
        console.error('Erro ao criar ou salvar usuário:', dbError);
        
        // Erro de chave duplicada (username, email ou CPF)
        if (dbError.code === 11000) {
          const field = Object.keys(dbError.keyPattern || {})[0];
          console.error(`Violação de unicidade: ${field} já existe`);
          
          if (field === 'username') {
            // Se for username duplicado, tenta com outro sufixo
            const newSuffix = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
            console.log('Tentando com novo username...');
            req.body.username = `${baseUsername}_${newSuffix}`;
            return handler(req, res); // Tenta novamente
          }
          
          const fieldMap = {
            'email': 'Email',
            'username': 'Nome de usuário',
            'cpf': 'CPF'
          };
          
          return res.status(400).json({ 
            success: false,
            message: `${fieldMap[field as keyof typeof fieldMap] || field} já está em uso` 
          });
        }
        
        // Erro de validação
        if (dbError.name === 'ValidationError') {
          const errors = Object.values(dbError.errors).map((e: any) => e.message);
          console.error('Erros de validação:', errors);
          return res.status(400).json({ 
            success: false,
            message: errors.join(', ') 
          });
        }
        
        // Outros erros do banco de dados
        console.error('Erro não classificado do MongoDB:', dbError);
        return res.status(500).json({ 
          success: false,
          message: 'Erro ao salvar usuário no banco de dados' 
        });
      }
    } catch (queryError) {
      console.error('Erro ao verificar usuário existente:', queryError);
      return res.status(500).json({ 
        success: false,
        message: 'Erro ao verificar disponibilidade de email' 
      });
    }
  } catch (error: any) {
    console.error('Erro fatal ao registrar usuário:', error);
    console.error('Stack trace:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao registrar usuário',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
} 