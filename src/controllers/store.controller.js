/**
 * Controlador da loja
 * Responsável por gerenciar produtos e itens da loja virtual
 */

const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');

class StoreController {
  /**
   * Obter todos os produtos disponíveis na loja
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getAllProducts(req, res, next) {
    try {
      // Simulação de parâmetros de filtro e paginação
      const { category, featured, page = 1, limit = 10 } = req.query;
      
      logger.info('Buscando lista de produtos disponíveis na loja');
      
      // Simulação de produtos da loja
      // Em um ambiente real, buscaria do banco de dados com filtros
      const products = [
        {
          id: 'product_1',
          name: 'Pacote de Diamantes - 100',
          description: 'Pacote com 100 diamantes para usar na plataforma',
          category: 'currency',
          price: 10.00,
          discountPrice: null,
          image: 'https://via.placeholder.com/100?text=100D',
          featured: false,
          popular: true,
          inStock: true
        },
        {
          id: 'product_2',
          name: 'Pacote de Diamantes - 500',
          description: 'Pacote com 500 diamantes para usar na plataforma',
          category: 'currency',
          price: 45.00,
          discountPrice: 40.00,
          image: 'https://via.placeholder.com/100?text=500D',
          featured: true,
          popular: true,
          inStock: true
        },
        {
          id: 'product_3',
          name: 'Pacote de Diamantes - 1000',
          description: 'Pacote com 1000 diamantes para usar na plataforma',
          category: 'currency',
          price: 85.00,
          discountPrice: 75.00,
          image: 'https://via.placeholder.com/100?text=1000D',
          featured: true,
          popular: true,
          inStock: true
        },
        {
          id: 'product_4',
          name: 'VIP Bronze - 30 dias',
          description: 'Assinatura VIP Bronze por 30 dias, oferecendo acesso a apostas exclusivas e bônus diários',
          category: 'subscription',
          price: 29.90,
          discountPrice: null,
          image: 'https://via.placeholder.com/100?text=VIP-B',
          featured: false,
          popular: false,
          inStock: true,
          benefits: [
            'Apostas exclusivas',
            'Bônus diário de 5 diamantes',
            'Participação em torneios VIP'
          ]
        },
        {
          id: 'product_5',
          name: 'VIP Prata - 30 dias',
          description: 'Assinatura VIP Prata por 30 dias, oferecendo acesso a apostas exclusivas, bônus diários e odds melhoradas',
          category: 'subscription',
          price: 49.90,
          discountPrice: 45.90,
          image: 'https://via.placeholder.com/100?text=VIP-S',
          featured: true,
          popular: false,
          inStock: true,
          benefits: [
            'Apostas exclusivas',
            'Bônus diário de 10 diamantes',
            'Participação em torneios VIP',
            'Odds melhoradas em 5%'
          ]
        },
        {
          id: 'product_6',
          name: 'Avatar Premium - Pacote Ninja',
          description: 'Pacote de avatares exclusivos com tema ninja para personalizar seu perfil',
          category: 'cosmetic',
          price: 15.00,
          discountPrice: null,
          image: 'https://via.placeholder.com/100?text=NINJA',
          featured: false,
          popular: false,
          inStock: true
        },
        {
          id: 'product_7',
          name: 'Quadro de Perfil - Pro Player',
          description: 'Quadro exclusivo para perfil que destaca você como jogador profissional',
          category: 'cosmetic',
          price: 20.00,
          discountPrice: 18.00,
          image: 'https://via.placeholder.com/100?text=FRAME',
          featured: false,
          popular: true,
          inStock: true
        },
        {
          id: 'product_8',
          name: 'Skin de Arma - AK Dourada',
          description: 'Skin exclusiva para AK com tema dourado, disponível para resgate no jogo',
          category: 'game_item',
          price: 50.00,
          discountPrice: null,
          image: 'https://via.placeholder.com/100?text=AK-GOLD',
          featured: true,
          popular: true,
          inStock: false
        }
      ];
      
      // Aplicar filtros simulados
      let filteredProducts = [...products];
      
      if (category) {
        filteredProducts = filteredProducts.filter(product => product.category === category);
      }
      
      if (featured === 'true') {
        filteredProducts = filteredProducts.filter(product => product.featured);
      }
      
      // Aplicar paginação simulada
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
      
      // Enviar resposta de sucesso
      res.status(200).json({
        success: true,
        count: filteredProducts.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredProducts.length / limit),
        data: paginatedProducts
      });
    } catch (error) {
      logger.error(`Erro ao buscar produtos da loja: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obter detalhes de um produto específico
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info(`Buscando detalhes do produto: ${id}`);
      
      // Simulação de produto
      // Em um ambiente real, buscaria do banco de dados
      const products = {
        product_1: {
          id: 'product_1',
          name: 'Pacote de Diamantes - 100',
          description: 'Pacote com 100 diamantes para usar na plataforma. Os diamantes são a moeda premium da plataforma RPX e podem ser usados para realizar apostas, comprar itens exclusivos e participar de torneios especiais.',
          category: 'currency',
          price: 10.00,
          discountPrice: null,
          images: [
            'https://via.placeholder.com/300?text=100D-1',
            'https://via.placeholder.com/300?text=100D-2'
          ],
          featured: false,
          popular: true,
          inStock: true,
          details: {
            amount: 100,
            bonus: 0,
            validity: 'Permanente',
            deliveryMethod: 'Instantânea',
            usageRestrictions: 'Não pode ser transferido para outros usuários'
          },
          reviews: [
            {
              id: 'review_1',
              userId: 'user_123',
              username: 'JogadorPro',
              rating: 5,
              comment: 'Ótimo pacote para iniciantes!',
              date: '2023-11-15T14:30:00Z'
            },
            {
              id: 'review_2',
              userId: 'user_456',
              username: 'BetMaster',
              rating: 4,
              comment: 'Bom custo-benefício para apostas pequenas.',
              date: '2023-11-10T09:15:00Z'
            }
          ]
        },
        product_2: {
          id: 'product_2',
          name: 'Pacote de Diamantes - 500',
          description: 'Pacote com 500 diamantes para usar na plataforma. Os diamantes são a moeda premium da plataforma RPX e podem ser usados para realizar apostas, comprar itens exclusivos e participar de torneios especiais.',
          category: 'currency',
          price: 45.00,
          discountPrice: 40.00,
          images: [
            'https://via.placeholder.com/300?text=500D-1',
            'https://via.placeholder.com/300?text=500D-2'
          ],
          featured: true,
          popular: true,
          inStock: true,
          details: {
            amount: 500,
            bonus: 50,
            validity: 'Permanente',
            deliveryMethod: 'Instantânea',
            usageRestrictions: 'Não pode ser transferido para outros usuários'
          },
          reviews: [
            {
              id: 'review_3',
              userId: 'user_789',
              username: 'FireMaster',
              rating: 5,
              comment: 'Melhor custo-benefício da loja!',
              date: '2023-11-18T16:45:00Z'
            }
          ]
        },
        product_5: {
          id: 'product_5',
          name: 'VIP Prata - 30 dias',
          description: 'Assinatura VIP Prata por 30 dias, oferecendo acesso a apostas exclusivas, bônus diários e odds melhoradas. Membros VIP Prata recebem tratamento especial e acesso a promoções e eventos exclusivos.',
          category: 'subscription',
          price: 49.90,
          discountPrice: 45.90,
          images: [
            'https://via.placeholder.com/300?text=VIP-S-1',
            'https://via.placeholder.com/300?text=VIP-S-2',
            'https://via.placeholder.com/300?text=VIP-S-3'
          ],
          featured: true,
          popular: false,
          inStock: true,
          details: {
            duration: '30 dias',
            autoRenew: true,
            cancelAnytime: true
          },
          benefits: [
            {
              title: 'Apostas exclusivas',
              description: 'Acesso a mercados de apostas exclusivos para membros VIP Prata'
            },
            {
              title: 'Bônus diário',
              description: 'Receba 10 diamantes todos os dias durante sua assinatura'
            },
            {
              title: 'Participação em torneios VIP',
              description: 'Acesso gratuito a torneios exclusivos para membros VIP'
            },
            {
              title: 'Odds melhoradas',
              description: 'Receba odds 5% melhores em todas as suas apostas'
            }
          ],
          reviews: [
            {
              id: 'review_4',
              userId: 'user_101',
              username: 'BetKing',
              rating: 5,
              comment: 'Vale muito a pena! As odds melhoradas já pagaram a assinatura.',
              date: '2023-11-20T10:30:00Z'
            },
            {
              id: 'review_5',
              userId: 'user_102',
              username: 'ProGamer22',
              rating: 4,
              comment: 'Os bônus diários são ótimos, mas gostaria de mais torneios VIP.',
              date: '2023-11-05T21:45:00Z'
            }
          ]
        }
      };
      
      const product = products[id];
      
      // Verificar se o produto existe
      if (!product) {
        return next(ApiError.notFound('Produto não encontrado'));
      }
      
      // Enviar resposta de sucesso
      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      logger.error(`Erro ao buscar detalhes do produto: ${error.message}`);
      next(error);
    }
  }

  /**
   * Processar uma compra de produto
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async purchaseProduct(req, res, next) {
    try {
      const { productId, quantity = 1, paymentMethod } = req.body;
      const userId = req.user.id;
      
      logger.info(`Processando compra do produto ${productId} pelo usuário ${userId}`);
      
      // Validação básica simulada
      if (!productId) {
        return next(ApiError.badRequest('ID do produto é obrigatório'));
      }
      
      if (!paymentMethod) {
        return next(ApiError.badRequest('Método de pagamento é obrigatório'));
      }
      
      // Simulação de processamento de compra
      // Em um ambiente real, verificaria estoque, processaria pagamento, etc.
      
      // Simulação de resposta de compra bem-sucedida
      const purchase = {
        id: `purchase_${Date.now()}`,
        userId,
        productId,
        quantity,
        paymentMethod,
        status: 'completed',
        totalPrice: 45.00, // Em um cenário real, seria calculado com base no produto e quantidade
        timestamp: new Date().toISOString(),
        deliveryStatus: 'delivered', // Para itens digitais
        items: [
          {
            id: productId,
            name: 'Pacote de Diamantes - 500',
            quantity,
            unitPrice: 45.00,
            totalPrice: 45.00
          }
        ]
      };
      
      // Enviar resposta de sucesso
      res.status(200).json({
        success: true,
        message: 'Compra realizada com sucesso',
        data: purchase
      });
    } catch (error) {
      logger.error(`Erro ao processar compra: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obter o histórico de compras do usuário
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getPurchaseHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      
      logger.info(`Buscando histórico de compras do usuário ${userId}`);
      
      // Simulação de histórico de compras
      // Em um ambiente real, buscaria do banco de dados
      const purchases = [];
      
      // Gerar algumas compras simuladas
      for (let i = 0; i < 15; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        purchases.push({
          id: `purchase_${1000 + i}`,
          userId,
          productId: `product_${(i % 5) + 1}`,
          productName: i % 5 === 0 ? 'Pacote de Diamantes - 100' :
                        i % 5 === 1 ? 'Pacote de Diamantes - 500' :
                        i % 5 === 2 ? 'Pacote de Diamantes - 1000' :
                        i % 5 === 3 ? 'VIP Bronze - 30 dias' :
                        'VIP Prata - 30 dias',
          quantity: 1,
          paymentMethod: i % 2 === 0 ? 'credit_card' : 'pix',
          status: 'completed',
          totalPrice: i % 5 === 0 ? 10.00 :
                       i % 5 === 1 ? 40.00 :
                       i % 5 === 2 ? 75.00 :
                       i % 5 === 3 ? 29.90 :
                       45.90,
          timestamp: date.toISOString()
        });
      }
      
      // Aplicar paginação simulada
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedPurchases = purchases.slice(startIndex, endIndex);
      
      // Enviar resposta de sucesso
      res.status(200).json({
        success: true,
        count: purchases.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(purchases.length / limit),
        data: paginatedPurchases
      });
    } catch (error) {
      logger.error(`Erro ao buscar histórico de compras: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obter as categorias de produtos disponíveis
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getCategories(req, res, next) {
    try {
      logger.info('Buscando categorias de produtos');
      
      // Simulação de categorias
      // Em um ambiente real, buscaria do banco de dados
      const categories = [
        {
          id: 'currency',
          name: 'Diamantes',
          description: 'Moeda premium para apostas e compras',
          icon: 'diamond',
          products: 3,
          featured: true
        },
        {
          id: 'subscription',
          name: 'Assinaturas VIP',
          description: 'Planos VIP com benefícios exclusivos',
          icon: 'crown',
          products: 2,
          featured: true
        },
        {
          id: 'cosmetic',
          name: 'Cosméticos',
          description: 'Itens para personalizar seu perfil',
          icon: 'brush',
          products: 2,
          featured: false
        },
        {
          id: 'game_item',
          name: 'Itens de Jogo',
          description: 'Skins e itens para usar no Free Fire',
          icon: 'gamepad',
          products: 1,
          featured: true
        }
      ];
      
      // Enviar resposta de sucesso
      res.status(200).json({
        success: true,
        count: categories.length,
        data: categories
      });
    } catch (error) {
      logger.error(`Erro ao buscar categorias: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new StoreController(); 