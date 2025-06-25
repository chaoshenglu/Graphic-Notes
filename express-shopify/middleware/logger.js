/**
 * 简单的日志记录工具
 */
class Logger {
  static info(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  static error(message, error = null) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`);
    if (error) {
      console.error('Error details:', error);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
  }

  static warn(message, data = null) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  static debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
}

/**
 * 请求日志记录中间件
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;
  
  Logger.info(`${method} ${url} - IP: ${ip}`);
  
  // 记录响应时间
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    Logger.info(`${method} ${url} - ${statusCode} - ${duration}ms`);
  });
  
  next();
};

/**
 * API错误日志记录中间件
 */
export const errorLogger = (err, req, res, next) => {
  Logger.error(`API Error in ${req.method} ${req.url}`, {
    error: err.message,
    stack: err.stack,
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  next(err);
};

export default Logger;