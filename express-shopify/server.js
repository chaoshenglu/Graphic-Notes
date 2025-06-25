import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import express from 'express';
import dotenv from 'dotenv';
import { validateShopifyConfig, createShopifySession, validateSession } from './middleware/auth.js';
import Logger, { requestLogger, errorLogger } from './middleware/logger.js';
import { rateLimitAPI } from './middleware/rateLimit.js';
import { validateProductsQuery, validateProductId } from './middleware/validation.js';

// 加载环境变量
dotenv.config();

// 初始化Shopify API
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || 'APIKeyFromPartnersDashboard',
  apiSecretKey: process.env.SHOPIFY_API_SECRET || 'APISecretFromPartnersDashboard',
  scopes: ['read_products'],
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
      health: '/health - 健康检查'
    },
    features: [
      '输入参数验证',
      '速率限制保护',
      '详细日志记录',
      '完善错误处理',
      'CORS支持'
    ]
  });
});

// 健康检查端点
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
    },
    shopifyConfig: {
      hasApiKey: !!process.env.SHOPIFY_API_KEY,
      hasApiSecret: !!process.env.SHOPIFY_API_SECRET,
      hasShopDomain: !!process.env.SHOPIFY_SHOP_DOMAIN,
      hasAccessToken: !!process.env.SHOPIFY_ACCESS_TOKEN
    }
  };
  
  res.json(healthCheck);
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
    const client = new shopify.clients.Rest({ session });
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

    const client = new shopify.clients.Rest({ session });
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
  Logger.info(`🌍 运行环境: ${process.env.NODE_ENV || 'development'}`);
  Logger.info(`📚 API文档:`);
  Logger.info(`   GET /api/products - 获取产品列表（支持分页）`);
  Logger.info(`   GET /api/products/:id - 获取产品详情`);
  Logger.info(`📋 分页参数:`);
  Logger.info(`   limit: 每页数量 (1-250, 默认50)`);
  Logger.info(`   page_info: 分页游标`);
  Logger.info(`   since_id: 从指定ID开始获取`);
  Logger.info(`🔧 功能特性:`);
  Logger.info(`   ✅ 输入参数验证`);
  Logger.info(`   ✅ 速率限制保护`);
  Logger.info(`   ✅ 详细日志记录`);
  Logger.info(`   ✅ 完善错误处理`);
  
  // 环境配置检查
  const requiredEnvVars = ['SHOPIFY_API_KEY', 'SHOPIFY_API_SECRET', 'SHOPIFY_SHOP_DOMAIN', 'SHOPIFY_ACCESS_TOKEN'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    Logger.warn(`⚠️  缺少环境变量: ${missingVars.join(', ')}`);
    Logger.warn(`请确保.env文件包含所有必需的Shopify配置`);
  } else {
    Logger.info(`✅ Shopify配置检查通过`);
  }
});