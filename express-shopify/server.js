import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import express from 'express';
import dotenv from 'dotenv';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';
import { validateShopifyConfig, createShopifySession, validateSession } from './middleware/auth.js';
import Logger, { requestLogger, errorLogger } from './middleware/logger.js';
import { rateLimitAPI } from './middleware/rateLimit.js';
import { validateProductsQuery, validateProductId, validateRequestBody } from './middleware/validation.js';

// 加载环境变量
dotenv.config();

// 配置代理
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

if (proxyUrl) {
  Logger.info(`使用代理服务器: ${proxyUrl}`);
} else {
  Logger.info('未配置代理服务器');
}

// 初始化Shopify API
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || 'APIKeyFromPartnersDashboard',
  apiSecretKey: process.env.SHOPIFY_API_SECRET || 'APISecretFromPartnersDashboard',
  scopes: ['read_products', 'write_products'],
  hostName: process.env.HOST_NAME || 'ngrok-tunnel-address',
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false,
});

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志记录
app.use(requestLogger);

// 速率限制
app.use('/api', rateLimitAPI);

// CORS中间件
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Shopify配置验证
app.use('/api', validateShopifyConfig);

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: 'Shopify Express API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      products: '/api/products - 获取产品列表（支持分页）',
      productDetail: '/api/products/:id - 获取产品详情',
      updateProduct: '/api/products/:id - 修改产品信息（PUT）',
      updateProductSEO: '/api/products/:id/seo - 更新产品SEO信息（PUT）',
      productMetafields: '/api/products/:id/metafields - 获取产品metafields',
      createMetafield: '/api/products/:id/metafields - 创建产品metafield（POST）',
      updateMetafield: '/api/products/:id/metafields/:metafield_id - 更新产品metafield（PUT）',
      testProxy: '/api/test-proxy - 测试代理连接'
    },
    features: [
      '输入参数验证',
      '速率限制保护',
      '详细日志记录',
      '完善错误处理',
      'CORS支持',
      '代理连接测试'
    ]
  });
});

// 代理测试端点
app.get('/api/test-proxy', async (req, res) => {
  try {
    Logger.info('开始测试代理连接');
    
    const testUrls = [
      'https://www.google.com',
      'https://www.facebook.com',
      'https://openai.com'
    ];
    
    const results = [];
    
    for (const url of testUrls) {
      try {
        const startTime = Date.now();
        
        // 使用node-fetch进行测试，支持代理配置
        const fetchOptions = {
          method: 'GET',
          timeout: 10000, // 10秒超时
          headers: {
            'User-Agent': 'Express-Shopify-Proxy-Test/1.0'
          }
        };
        
        // 如果配置了代理，添加代理设置
        if (agent) {
          fetchOptions.agent = agent;
        }
        
        const response = await fetch(url, fetchOptions);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        results.push({
          url,
          status: 'success',
          statusCode: response.status,
          responseTime: `${responseTime}ms`,
          proxyUsed: !!agent,
          proxyUrl: agent ? proxyUrl : null
        });
        
        Logger.info(`代理测试成功: ${url} - ${response.status} (${responseTime}ms)`);
        
      } catch (error) {
        results.push({
          url,
          status: 'failed',
          error: error.message,
          proxyUsed: !!agent,
          proxyUrl: agent ? proxyUrl : null
        });
        
        Logger.warn(`代理测试失败: ${url} - ${error.message}`);
      }
    }
    
    const successCount = results.filter(r => r.status === 'success').length;
    const totalCount = results.length;
    
    res.json({
      success: true,
      data: {
        proxyConfigured: !!agent,
        proxyUrl: agent ? proxyUrl : null,
        testResults: results,
        summary: {
          total: totalCount,
          success: successCount,
          failed: totalCount - successCount,
          successRate: `${Math.round((successCount / totalCount) * 100)}%`
        }
      },
      message: agent 
        ? `代理测试完成，成功率: ${Math.round((successCount / totalCount) * 100)}%` 
        : `直连测试完成，成功率: ${Math.round((successCount / totalCount) * 100)}%`
    });
    
  } catch (error) {
    Logger.error('代理测试失败', error);
    res.status(500).json({
      success: false,
      error: '代理测试失败',
      details: error.message,
      proxyConfigured: !!agent,
      proxyUrl: agent ? proxyUrl : null
    });
  }
});

// 获取产品列表API（支持分页）
app.get('/api/products', validateProductsQuery, async (req, res) => {
  try {
    // 使用验证后的查询参数
    const { limit, page_info, since_id, search } = req.validatedQuery;
    
    Logger.info('获取产品列表请求', { limit, page_info, since_id, search });

    // 创建Shopify会话
    const session = createShopifySession();
    validateSession(session);

    // 构建查询参数
    const queryParams = {
      limit: limit
    };

    if (page_info) {
      queryParams.page_info = page_info;
    }
    
    if (since_id) {
      queryParams.since_id = since_id;
    }
    
    if (search) {
      queryParams.title = search;
    }

    // 调用Shopify API获取产品
    const client = new shopify.clients.Rest({ 
      session,
      ...(agent && { httpAgent: agent, httpsAgent: agent })
    });
    const products = await client.get({
      path: 'products',
      query: queryParams
    });

    // 获取分页信息
    const pageInfo = products.pageInfo || {};
    const productList = products.body?.products || [];
    
    // 返回结果
    res.json({
      success: true,
      data: {
        products: productList,
        pagination: {
          hasNextPage: pageInfo.hasNext || false,
          hasPreviousPage: pageInfo.hasPrevious || false,
          nextPageInfo: pageInfo.nextPageParameters?.page_info || null,
          previousPageInfo: pageInfo.previousPageParameters?.page_info || null,
          currentLimit: limit,
          totalCount: productList.length
        }
      },
      message: search ? `成功搜索到 ${productList.length} 个包含"${search}"的产品` : `成功获取 ${productList.length} 个产品`
    });

    Logger.info(search ? `成功搜索到 ${productList.length} 个包含"${search}"的产品` : `成功获取 ${productList.length} 个产品`);

  } catch (error) {
    Logger.error('获取产品列表失败', error);
    
    // 根据错误类型返回不同的错误信息
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      return res.status(401).json({
        success: false,
        error: '未授权访问，请检查API密钥和访问令牌',
        details: error.message,
        hint: '请确认.env文件中的SHOPIFY_API_KEY和SHOPIFY_ACCESS_TOKEN配置正确'
      });
    }
    
    if (error.message.includes('Not Found') || error.message.includes('404')) {
      return res.status(404).json({
        success: false,
        error: '店铺未找到，请检查店铺域名',
        details: error.message,
        hint: '请确认.env文件中的SHOPIFY_SHOP_DOMAIN配置正确'
      });
    }
    
    if (error.message.includes('无效的Shopify会话配置') || error.message.includes('店铺域名格式不正确')) {
      return res.status(400).json({
        success: false,
        error: 'Shopify配置错误',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.message : '请联系管理员'
    });
  }
});

// 获取单个产品详情
app.get('/api/products/:id', validateProductId, async (req, res) => {
  try {
    const { id: productId } = req.validatedParams;
    
    Logger.info('获取产品详情请求', { productId });
    
    const session = createShopifySession();
    validateSession(session);

    const client = new shopify.clients.Rest({ 
      session,
      ...(agent && { httpAgent: agent, httpsAgent: agent })
    });
    const product = await client.get({
      path: `products/${productId}`
    });

    const productData = product.body?.product || product.body;
    
    res.json({
      success: true,
      data: productData,
      message: '成功获取产品详情'
    });
    
    Logger.info('成功获取产品详情', { productId, title: productData?.title });

  } catch (error) {
    Logger.error('获取产品详情失败', error);
    
    if (error.message.includes('Not Found') || error.message.includes('404')) {
      return res.status(404).json({
        success: false,
        error: '产品未找到',
        details: error.message,
        hint: `产品ID ${productId} 不存在或已被删除`
      });
    }
    
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      return res.status(401).json({
        success: false,
        error: '未授权访问，请检查API密钥和访问令牌',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.message : '请联系管理员'
    });
  }
});

// 修改产品信息
app.put('/api/products/:id', 
  validateProductId,
  validateRequestBody({
    title: { type: 'string', maxLength: 255 },
    product_type: { type: 'string', maxLength: 255 },
    vendor: { type: 'string', maxLength: 255 },
    body_html: { type: 'string', maxLength: 65535 },
    variants: { type: 'array' },
    options: { type: 'array' }
  }),
  async (req, res) => {
    try {
      const { id: productId } = req.validatedParams;
      const { title, product_type, vendor, body_html, variants, options } = req.body;
      
      // 检查是否至少提供了一个要更新的字段
      if (!title && !product_type && !vendor && body_html === undefined && !variants && !options) {
        return res.status(400).json({
          success: false,
          error: '请求参数错误',
          message: '至少需要提供一个要更新的字段（title, product_type, vendor, body_html, variants, options）'
        });
      }
      
      Logger.info('修改产品信息请求', { productId, fields: Object.keys(req.body) });
      
      const session = createShopifySession();
      validateSession(session);

      // 构建更新数据
      const updateData = { product: {} };
      if (title !== undefined) updateData.product.title = title;
      if (product_type !== undefined) updateData.product.product_type = product_type;
      if (vendor !== undefined) updateData.product.vendor = vendor;
      if (body_html !== undefined) updateData.product.body_html = body_html;
      if (variants !== undefined) updateData.product.variants = variants;
      if (options !== undefined) updateData.product.options = options;

      const client = new shopify.clients.Rest({ 
        session,
        ...(agent && { httpAgent: agent, httpsAgent: agent })
      });
      
      const updatedProduct = await client.put({
        path: `products/${productId}`,
        data: updateData
      });

      const productData = updatedProduct.body?.product || updatedProduct.body;
      
      res.json({
        success: true,
        data: productData,
        message: '产品信息修改成功'
      });
      
      Logger.info('产品信息修改成功', { 
        productId, 
        title: productData?.title,
        updatedFields: Object.keys(req.body)
      });

    } catch (error) {
      Logger.error('修改产品信息失败', error);
      
      if (error.message.includes('Not Found') || error.message.includes('404')) {
        return res.status(404).json({
          success: false,
          error: '产品未找到',
          details: error.message,
          hint: `产品ID ${req.validatedParams.id} 不存在或已被删除`
        });
      }
      
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        return res.status(401).json({
          success: false,
          error: '未授权访问，请检查API密钥和访问令牌',
          details: error.message,
          hint: '修改产品需要write_products权限'
        });
      }
      
      if (error.message.includes('Forbidden') || error.message.includes('403')) {
        return res.status(403).json({
          success: false,
          error: '权限不足',
          details: error.message,
          hint: '当前API密钥没有修改产品的权限，请检查Shopify应用权限配置'
        });
      }
      
      if (error.message.includes('Unprocessable Entity') || error.message.includes('422')) {
        return res.status(422).json({
          success: false,
          error: '数据验证失败',
          details: error.message,
          hint: '请检查提交的产品数据格式是否正确'
        });
      }

      res.status(500).json({
        success: false,
        error: '服务器内部错误',
        details: process.env.NODE_ENV === 'development' ? error.message : '请联系管理员'
      });
    }
  }
);

// 更新产品SEO信息
app.put('/api/products/:id/seo',
  validateProductId,
  validateRequestBody({
    seo_description: { type: 'string', maxLength: 320 },
    seo_title: { type: 'string', maxLength: 100 }
  }),
  async (req, res) => {
    try {
      const { id: productId } = req.validatedParams;
      const { seo_description, seo_title } = req.body;
      
      // 检查是否至少提供了一个要更新的SEO字段
      if (!seo_description && !seo_title) {
        return res.status(400).json({
          success: false,
          error: '请求参数错误',
          message: '至少需要提供一个要更新的SEO字段（seo_description, seo_title）'
        });
      }
      
      Logger.info('更新产品SEO信息请求', { productId, fields: Object.keys(req.body) });
      
      const session = createShopifySession();
      validateSession(session);

      // 构建GraphQL mutation
      const seoInput = {};
      if (seo_title !== undefined) seoInput.title = seo_title;
      if (seo_description !== undefined) seoInput.description = seo_description;
      
      const mutation = `
        mutation {
          productUpdate(input: {
            id: "gid://shopify/Product/${productId}",
            seo: {
              ${seo_title !== undefined ? `title: "${seo_title.replace(/"/g, '\\"')}"` : ''}
              ${seo_title !== undefined && seo_description !== undefined ? ',' : ''}
              ${seo_description !== undefined ? `description: "${seo_description.replace(/"/g, '\\"')}"` : ''}
            }
          }) {
            product {
              id
              seo {
                title
                description
              }
            }
            userErrors {
              field
              message
            }
          }
        }`;

      const client = new shopify.clients.Graphql({ 
        session,
        ...(agent && { httpAgent: agent, httpsAgent: agent })
      });
      
      const updatedProduct = await client.query({
        data: mutation
      });

      // 检查GraphQL错误
      if (updatedProduct.body.errors) {
        Logger.error('GraphQL执行错误', {
          errors: updatedProduct.body.errors,
          productId
        });
        
        return res.status(400).json({
          success: false,
          error: 'GraphQL执行错误',
          details: updatedProduct.body.errors
        });
      }
      
      // 检查用户错误
      if (updatedProduct.body.data.productUpdate.userErrors && updatedProduct.body.data.productUpdate.userErrors.length > 0) {
        Logger.error('产品SEO更新失败', {
          userErrors: updatedProduct.body.data.productUpdate.userErrors,
          productId
        });
        
        return res.status(400).json({
          success: false,
          error: '产品SEO更新失败',
          details: updatedProduct.body.data.productUpdate.userErrors
        });
      }

      const productData = updatedProduct.body.data.productUpdate.product;
      
      res.json({
        success: true,
        data: {
          id: productData.id,
          seo: productData.seo
        },
        message: '产品SEO信息更新成功'
      });
      
      Logger.info('产品SEO信息更新成功', { 
        productId, 
        title: productData?.title,
        updatedFields: Object.keys(req.body)
      });

    } catch (error) {
      Logger.error('更新产品SEO信息失败', error);
      
      if (error.message.includes('Not Found') || error.message.includes('404')) {
        return res.status(404).json({
          success: false,
          error: '产品未找到',
          details: error.message,
          hint: `产品ID ${req.validatedParams.id} 不存在或已被删除`
        });
      }
      
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        return res.status(401).json({
          success: false,
          error: '未授权访问，请检查API密钥和访问令牌',
          details: error.message,
          hint: '修改产品SEO信息需要write_products权限'
        });
      }
      
      if (error.message.includes('Forbidden') || error.message.includes('403')) {
        return res.status(403).json({
          success: false,
          error: '权限不足',
          details: error.message,
          hint: '当前API密钥没有修改产品的权限，请检查Shopify应用权限配置'
        });
      }
      
      if (error.message.includes('Unprocessable Entity') || error.message.includes('422')) {
        return res.status(422).json({
          success: false,
          error: 'SEO数据验证失败',
          details: error.message,
          hint: '请检查SEO数据格式：seo_description不超过320字符，seo_title不超过70字符'
        });
      }

      res.status(500).json({
        success: false,
        error: '服务器内部错误',
        details: process.env.NODE_ENV === 'development' ? error.message : '请联系管理员'
      });
    }
  }
);

// 获取产品metafields
app.get('/api/products/:id/metafields', validateProductId, async (req, res) => {
  try {
    const { id: productId } = req.validatedParams;
    
    Logger.info('获取产品metafields请求', { productId });
    
    const session = createShopifySession();
    validateSession(session);

    const client = new shopify.clients.Rest({ 
      session,
      ...(agent && { httpAgent: agent, httpsAgent: agent })
    });
    const metafields = await client.get({
      path: `products/${productId}/metafields`
    });

    const metafieldsData = metafields.body?.metafields || metafields.body || [];
    
    res.json({
      success: true,
      data: metafieldsData,
      message: `成功获取产品 ${productId} 的 ${metafieldsData.length} 个metafields`
    });
    
    Logger.info('成功获取产品metafields', { productId, count: metafieldsData.length });

  } catch (error) {
    Logger.error('获取产品metafields失败', error);
    
    if (error.message.includes('Not Found') || error.message.includes('404')) {
      return res.status(404).json({
        success: false,
        error: '产品未找到',
        details: error.message,
        hint: `产品ID ${req.validatedParams.id} 不存在或已被删除`
      });
    }
    
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      return res.status(401).json({
        success: false,
        error: '未授权访问，请检查API密钥和访问令牌',
        details: error.message,
        hint: '获取metafields需要read_product_metafields权限'
      });
    }

    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.message : '请联系管理员'
    });
  }
});

// 创建产品metafield
app.post('/api/products/:id/metafields',
  validateProductId,
  validateRequestBody({
    namespace: { type: 'string', required: true, maxLength: 20 },
    key: { type: 'string', required: true, maxLength: 30 },
    value: { required: true },
    type: { type: 'string', required: true }
  }),
  async (req, res) => {
    try {
      const { id: productId } = req.validatedParams;
      const { namespace, key, value, type, description } = req.body;
      
      Logger.info('创建产品metafield请求', { productId, namespace, key, type });
      
      const session = createShopifySession();
      validateSession(session);

      // 构建metafield数据
      const metafieldData = {
        metafield: {
          namespace,
          key,
          value,
          type
        }
      };
      
      if (description) {
        metafieldData.metafield.description = description;
      }

      const client = new shopify.clients.Rest({ 
        session,
        ...(agent && { httpAgent: agent, httpsAgent: agent })
      });
      
      const createdMetafield = await client.post({
        path: `products/${productId}/metafields`,
        data: metafieldData
      });

      const metafieldResult = createdMetafield.body?.metafield || createdMetafield.body;
      
      res.json({
        success: true,
        data: metafieldResult,
        message: 'Metafield创建成功'
      });
      
      Logger.info('Metafield创建成功', { 
        productId, 
        metafieldId: metafieldResult?.id,
        namespace,
        key
      });

    } catch (error) {
      Logger.error('创建产品metafield失败', error);
      
      if (error.message.includes('Not Found') || error.message.includes('404')) {
        return res.status(404).json({
          success: false,
          error: '产品未找到',
          details: error.message,
          hint: `产品ID ${req.validatedParams.id} 不存在或已被删除`
        });
      }
      
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        return res.status(401).json({
          success: false,
          error: '未授权访问，请检查API密钥和访问令牌',
          details: error.message,
          hint: '创建metafields需要write_product_metafields权限'
        });
      }
      
      if (error.message.includes('Unprocessable Entity') || error.message.includes('422')) {
        return res.status(422).json({
          success: false,
          error: '数据验证失败',
          details: error.message,
          hint: '请检查metafield数据格式，确保namespace、key、value和type字段正确'
        });
      }

      res.status(500).json({
        success: false,
        error: '服务器内部错误',
        details: process.env.NODE_ENV === 'development' ? error.message : '请联系管理员'
      });
    }
  }
);

// 更新产品metafield
app.put('/api/products/:id/metafields/:metafield_id',
  validateProductId,
  validateRequestBody({
    value: { required: true },
    type: { type: 'string' }
  }),
  async (req, res) => {
    try {
      const { id: productId } = req.validatedParams;
      const { metafield_id: metafieldId } = req.params;
      const { value, type, description } = req.body;
      
      // 验证metafield_id
      if (!metafieldId || !/^\d+$/.test(metafieldId)) {
        return res.status(400).json({
          success: false,
          error: '请求参数错误',
          message: 'metafield_id必须是有效的数字ID'
        });
      }
      
      Logger.info('更新产品metafield请求', { productId, metafieldId });
      
      const session = createShopifySession();
      validateSession(session);

      // 构建更新数据
      const updateData = {
        metafield: {
          id: parseInt(metafieldId),
          value
        }
      };
      
      if (type) {
        updateData.metafield.type = type;
      }
      
      if (description !== undefined) {
        updateData.metafield.description = description;
      }

      const client = new shopify.clients.Rest({ 
        session,
        ...(agent && { httpAgent: agent, httpsAgent: agent })
      });
      
      const updatedMetafield = await client.put({
        path: `products/${productId}/metafields/${metafieldId}`,
        data: updateData
      });

      const metafieldResult = updatedMetafield.body?.metafield || updatedMetafield.body;
      
      res.json({
        success: true,
        data: metafieldResult,
        message: 'Metafield更新成功'
      });
      
      Logger.info('Metafield更新成功', { 
        productId, 
        metafieldId,
        namespace: metafieldResult?.namespace,
        key: metafieldResult?.key
      });

    } catch (error) {
      Logger.error('更新产品metafield失败', error);
      
      if (error.message.includes('Not Found') || error.message.includes('404')) {
        return res.status(404).json({
          success: false,
          error: 'Metafield未找到',
          details: error.message,
          hint: `产品ID ${req.validatedParams.id} 或 Metafield ID ${req.params.metafield_id} 不存在`
        });
      }
      
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        return res.status(401).json({
          success: false,
          error: '未授权访问，请检查API密钥和访问令牌',
          details: error.message,
          hint: '更新metafields需要write_product_metafields权限'
        });
      }
      
      if (error.message.includes('Unprocessable Entity') || error.message.includes('422')) {
        return res.status(422).json({
          success: false,
          error: '数据验证失败',
          details: error.message,
          hint: '请检查metafield数据格式，确保value和type字段正确'
        });
      }

      res.status(500).json({
        success: false,
        error: '服务器内部错误',
        details: process.env.NODE_ENV === 'development' ? error.message : '请联系管理员'
      });
    }
  }
);

// 错误处理中间件
app.use(errorLogger);
app.use((err, req, res, next) => {
  Logger.error('未处理的错误', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    details: process.env.NODE_ENV === 'development' ? err.message : '请联系管理员',
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    message: `路径 ${req.originalUrl} 未找到`
  });
});

// 启动服务器
app.listen(PORT, () => {
  Logger.info(`🚀 Express Shopify API 服务器启动成功`);
  Logger.info(`📍 服务地址: http://localhost:${PORT}`);
  Logger.info(`📚 API文档:`);
  Logger.info(`   GET /api/products - 获取产品列表（支持分页）`);
  Logger.info(`   GET /api/products/:id - 获取产品详情`);
  Logger.info(`   PUT /api/products/:id - 修改产品信息`);
  Logger.info(`   PUT /api/products/:id/seo - 更新产品SEO信息（需要body: {seo_description?, seo_title?}）`);
  Logger.info(`   GET /api/products/:id/metafields - 获取产品metafields`);
  Logger.info(`   POST /api/products/:id/metafields - 创建产品metafield`);
  Logger.info(`   PUT /api/products/:id/metafields/:metafield_id - 更新产品metafield`);
  Logger.info(`   GET /api/test-proxy - 测试代理连接`);
});