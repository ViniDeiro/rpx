import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId, Collection, FindCursor } from 'mongodb';

// Interface para estender o tipo User com a propriedade isAdmin
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string;
  isAdmin?: boolean;
}

// Interface para estender o tipo Session com o user extendido
interface ExtendedSession {
  user?: ExtendedUser;
  expires: string;
}

// Interface para métodos de pagamento
interface PaymentMethod {
  _id: ObjectId;
  name: string;
  gateway: string;
  active?: boolean;
  sandbox?: boolean;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Verifica se o usuário atual é um administrador
 */
async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions) as ExtendedSession;
  
  if (!session || !session.user || !session.user.email) {
    return false;
  }
  
  const { db } = await connectToDatabase();
  const usersCollection = db.collection('users');
  
  const user = await usersCollection.findOne({ email: session.user.email });
  
  return user?.isAdmin === true;
}

/**
 * GET: Lista todos os métodos de pagamento ou um específico por ID
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar se o usuário é administrador
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
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
export async function POST(req: NextRequest) {
  try {
    // Verificar se o usuário é admin
    if (!await isAdmin()) {
      return NextResponse.json(
        { message: 'Não autorizado. Acesso apenas para administradores.' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // Validar dados necessários
    if (!body.name || !body.gateway || !body.apiKey) {
      return NextResponse.json(
        { message: 'Dados insuficientes. Nome, gateway e chave API são obrigatórios.' },
        { status: 400 }
      );
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
        { status: 400 }
      );
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
      name: newMethod.name,
      gateway: newMethod.gateway,
      isActive: newMethod.isActive
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao criar método de pagamento:', error);
    
    return NextResponse.json(
      { message: 'Erro ao criar método de pagamento' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Atualiza um método de pagamento existente
 */
export async function PUT(req: NextRequest) {
  try {
    // Verificar se o usuário é administrador
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
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
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (gateway) updateData.gateway = gateway;
    if (apiKey) updateData.apiKey = apiKey;
    if (apiSecret) updateData.apiSecret = apiSecret;
    if (accessToken) updateData.accessToken = accessToken;
    if (sandbox !== undefined) updateData.sandbox = sandbox;
    
    // Se ativando este método como padrão, desativar outros do mesmo gateway
    if (active === true) {
      // Primeiro desativar todos os outros métodos do mesmo gateway
      const sameGatewayMethods = await paymentMethodsCollection.find({ 
        gateway: existingMethod.gateway || gateway,
        _id: { $ne: new ObjectId(id) }
      }).toArray();
      
      if (sameGatewayMethods.length > 0) {
        const idsToDeactivate = sameGatewayMethods.map((method) => method._id);
        
        // Desativar outros métodos do mesmo gateway de forma individual
        for (const methodId of idsToDeactivate) {
          await paymentMethodsCollection.updateOne(
            { _id: methodId },
            { $set: { active: false } }
          );
        }
      }
      
      // Definir este como ativo
      updateData.active = true;
    } else if (active === false) {
      updateData.active = false;
    }

    // Atualizar o método de pagamento
    const result = await paymentMethodsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Nenhuma alteração foi feita' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Método de pagamento atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar método de pagamento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Remover um método de pagamento
export async function DELETE(req: NextRequest) {
  try {
    // Verificar se o usuário é admin
    if (!await isAdmin()) {
      return NextResponse.json(
        { message: 'Não autorizado. Acesso apenas para administradores.' },
        { status: 403 }
      );
    }
    
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { message: 'ID do método de pagamento não fornecido' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se o método existe
    const method = await db.collection('payment_methods').findOne({
      _id: new ObjectId(id)
    });
    
    if (!method) {
      return NextResponse.json(
        { message: 'Método de pagamento não encontrado' },
        { status: 404 }
      );
    }
    
    // Excluir método
    await db.collection('payment_methods').deleteOne({
      _id: new ObjectId(id)
    });
    
    return NextResponse.json(
      { message: 'Método de pagamento excluído com sucesso' }
    );
    
  } catch (error) {
    console.error('Erro ao excluir método de pagamento:', error);
    
    return NextResponse.json(
      { message: 'Erro ao excluir método de pagamento' },
      { status: 500 }
    );
  }
} 