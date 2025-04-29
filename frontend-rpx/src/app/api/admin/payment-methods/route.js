import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Interface para estender o tipo User com a propriedade isAdmin


// Interface para estender o tipo Session com o user extendido


// Interface para métodos de pagamento


/**
 * Verifica se o usuário atual é um administrador
 */
async function isAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    return false;
  }
  
  const { db } = await connectToDatabase();
  const usersCollection = db.collection('users');
  
  const user = await usersCollection.findOne({ email: session.user.email });
  
  return user?.isAdmin === true;
}

/**
 * GET todos os métodos de pagamento ou um específico por ID
 */
export async function GET(req) {
  try {
    // Verificar se o usuário é administrador
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const { db } = await connectToDatabase();
    const paymentMethodsCollection = db.collection('payment_methods');

    // Se um ID específico foi fornecido, retornar apenas esse método de pagamento
    if (id) {
      try {
        const method = await paymentMethodsCollection.findOne({ _id: new ObjectId(id) });
        
        if (!method) {
          return NextResponse.json({ error: 'Método de pagamento não encontrado' }, { status: 404 });
        }
        
        // Garantir que um objeto seguro seja retornado (sem dados sensíveis)
        const safeMethod = {
          ...method,
          apiKey: undefined,
          apiSecret: undefined,
          accessToken: undefined
        };
        
        return NextResponse.json(safeMethod);
      } catch (error) {
        return NextResponse.json({ error: 'ID de método de pagamento inválido' }, { status: 400 });
      }
    }

    // Caso contrário, listar todos os métodos de pagamento
    // Usar toArray() diretamente ao invés de sort() para evitar problemas de tipagem
    const methods = await paymentMethodsCollection.find({}).toArray();
    
    // Remover dados sensíveis antes de retornar
    const safeMethods = methods.map((method) => ({
      ...method,
      apiKey: undefined,
      apiSecret: undefined,
      accessToken: undefined
    }));

    return NextResponse.json(safeMethods);
  } catch (error) {
    console.error('Erro ao buscar métodos de pagamento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Adicionar um novo método de pagamento
export async function POST(req) {
  try {
    // Verificar se o usuário é admin
    if (!await isAdmin()) {
      return NextResponse.json(
        { message: 'Não autorizado. Acesso apenas para administradores.' },
        { status: 403 });
    }
    
    const body = await req.json();
    
    // Validar dados necessários
    if (!body.name || !body.gateway || !body.apiKey) {
      return NextResponse.json(
        { message: 'Dados insuficientes. Nome, gateway e chave API são obrigatórios.' },
        { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se já existe um método com o mesmo gateway
    const existingMethod = await db.collection('payment_methods').findOne({
      gateway: body.gateway,
      isActive: true
    });
    
    if (existingMethod) {
      return NextResponse.json(
        { message: `Já existe um método de pagamento ativo para ${body.gateway}.` },
        { status: 409 });
    }
    
    // Criar novo método de pagamento
    const newMethod = {
      ...body,
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('payment_methods').insertOne(newMethod);
    
    if (!result.insertedId) {
      throw new Error('Falha ao inserir método de pagamento');
    }
    
    return NextResponse.json({
      id: result.insertedId.toString(),
      name: body.name,
      gateway: body.gateway,
      isActive: body.isActive !== undefined ? body.isActive : true
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao criar método de pagamento:', error);
    
    return NextResponse.json(
      { message: 'Erro ao criar método de pagamento' },
      { status: 500 });
  }
}

/**
 * PUT um método de pagamento existente
 */
export async function PUT(req) {
  try {
    // Verificar se o usuário é administrador
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, gateway, active, sandbox, apiKey, apiSecret, accessToken } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do método de pagamento é obrigatório' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const paymentMethodsCollection = db.collection('payment_methods');

    // Verificar se o método existe
    let existingMethod;
    try {
      existingMethod = await paymentMethodsCollection.findOne({ _id: new ObjectId(id) });
      
      if (!existingMethod) {
        return NextResponse.json({ error: 'Método de pagamento não encontrado' }, { status: 404 });
      }
    } catch (error) {
      return NextResponse.json({ error: 'ID de método de pagamento inválido' }, { status: 400 });
    }

    // Preparar o objeto de atualização com os campos fornecidos
    const updateData = {};
    
    if (name) updateData.name = name;
    if (gateway) updateData.gateway = gateway;
    if (apiKey) updateData.apiKey = apiKey;
    if (apiSecret) updateData.apiSecret = apiSecret;
    if (accessToken) updateData.accessToken = accessToken;
    if (sandbox !== undefined) updateData.sandbox = sandbox;
    
    // Se ativando este método como padrão, desativar outros do mesmo gateway
    if (active === true) {
      // Primeiro desativar todos os outros métodos do mesmo gateway
      await paymentMethodsCollection.updateMany(
        { 
          gateway: existingMethod.gateway, 
          _id: { $ne: new ObjectId(id) } 
        },
        { $set: { active: false, updatedAt: new Date() } }
      );
    }
    
    // Incluir active no updateData
    if (active !== undefined) updateData.active = active;
    
    // Incluir updatedAt
    updateData.updatedAt = new Date();
    
    // Atualizar o método de pagamento
    const result = await paymentMethodsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Método de pagamento não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: id,
      ...updateData,
      message: 'Método de pagamento atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao atualizar método de pagamento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE um método de pagamento
 */
export async function DELETE(req) {
  try {
    // Verificar se o usuário é administrador
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do método de pagamento é obrigatório' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const paymentMethodsCollection = db.collection('payment_methods');

    // Verificar se o método existe
    let existingMethod;
    try {
      existingMethod = await paymentMethodsCollection.findOne({ _id: new ObjectId(id) });
      
      if (!existingMethod) {
        return NextResponse.json({ error: 'Método de pagamento não encontrado' }, { status: 404 });
      }
    } catch (error) {
      return NextResponse.json({ error: 'ID de método de pagamento inválido' }, { status: 400 });
    }

    // Verificar se há transações vinculadas a este método de pagamento
    const transactionsCollection = db.collection('transactions');
    const hasTransactions = await transactionsCollection.findOne({ paymentMethodId: id });

    if (hasTransactions) {
      return NextResponse.json(
        { error: 'Este método de pagamento não pode ser excluído pois existem transações associadas a ele' },
        { status: 409 }
      );
    }

    // Excluir o método de pagamento
    const result = await paymentMethodsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Método de pagamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Método de pagamento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir método de pagamento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 