/**
 * 简单的内存速率限制器
 */
class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 100) {
    this.windowMs = windowMs; // 时间窗口（毫秒）
    this.maxRequests = maxRequests; // 最大请求数
    this.requests = new Map(); // 存储请求记录
    
    // 定期清理过期记录
    setInterval(() => {
      this.cleanup();
    }, this.windowMs);
  }
  
  /**
   * 检查是否超过速率限制
   */
  isRateLimited(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier);
    
    // 移除过期的请求记录
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    this.requests.set(identifier, validRequests);
    
    // 检查是否超过限制
    if (validRequests.length >= this.maxRequests) {
      return {
        limited: true,
        resetTime: Math.min(...validRequests) + this.windowMs,
        remaining: 0
      };
    }
    
    // 记录当前请求
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return {
      limited: false,
      resetTime: now + this.windowMs,
      remaining: this.maxRequests - validRequests.length
    };
  }
  
  /**
   * 清理过期记录
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

// 创建不同的速率限制器
const apiLimiter = new RateLimiter(60000, 100); // 每分钟100次请求
const strictLimiter = new RateLimiter(60000, 30); // 每分钟30次请求

/**
 * 创建速率限制中间件
 */
export const createRateLimit = (limiter = apiLimiter, keyGenerator = null) => {
  return (req, res, next) => {
    // 生成标识符（默认使用IP地址）
    const identifier = keyGenerator ? keyGenerator(req) : req.ip || req.connection.remoteAddress;
    
    const result = limiter.isRateLimited(identifier);
    
    // 设置响应头
    res.set({
      'X-RateLimit-Limit': limiter.maxRequests,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    });
    
    if (result.limited) {
      return res.status(429).json({
        success: false,
        error: '请求过于频繁',
        message: `每分钟最多允许 ${limiter.maxRequests} 次请求`,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      });
    }
    
    next();
  };
};

// 预定义的速率限制中间件
export const rateLimitAPI = createRateLimit(apiLimiter);
export const rateLimitStrict = createRateLimit(strictLimiter);

export default { createRateLimit, rateLimitAPI, rateLimitStrict };