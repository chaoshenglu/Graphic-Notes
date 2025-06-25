import { shopifyApi } from '@shopify/shopify-api';

/**
 * 验证Shopify配置的中间件
 */
export const validateShopifyConfig = (req, res, next) => {
  const requiredEnvVars = [
    'SHOPIFY_API_KEY',
    'SHOPIFY_API_SECRET',
    'SHOPIFY_SHOP_DOMAIN',
    'SHOPIFY_ACCESS_TOKEN'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    return res.status(500).json({
      success: false,
      error: 'Shopify配置不完整',
      details: `缺少环境变量: ${missingVars.join(', ')}`,
      hint: '请检查.env文件中的Shopify配置'
    });
  }

  next();
};

/**
 * 创建Shopify会话的辅助函数
 */
export const createShopifySession = () => {
  return {
    shop: process.env.SHOPIFY_SHOP_DOMAIN,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    id: `offline_${process.env.SHOPIFY_SHOP_DOMAIN}`,
    isOnline: false,
    scope: 'read_products'
  };
};

/**
 * 验证会话有效性
 */
export const validateSession = (session) => {
  if (!session.shop || !session.accessToken) {
    throw new Error('无效的Shopify会话配置');
  }
  
  // 验证店铺域名格式
  if (!session.shop.includes('.myshopify.com')) {
    throw new Error('店铺域名格式不正确，应为: your-shop-name.myshopify.com');
  }
  
  return true;
};