/**
 * 输入验证工具
 */
class Validator {
  /**
   * 验证数字范围
   */
  static validateNumber(value, min = null, max = null, defaultValue = null) {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    
    const num = parseInt(value, 10);
    
    if (isNaN(num)) {
      throw new Error(`无效的数字格式: ${value}`);
    }
    
    if (min !== null && num < min) {
      throw new Error(`数值不能小于 ${min}`);
    }
    
    if (max !== null && num > max) {
      throw new Error(`数值不能大于 ${max}`);
    }
    
    return num;
  }
  
  /**
   * 验证字符串长度
   */
  static validateString(value, minLength = 0, maxLength = null, allowEmpty = true) {
    if (!allowEmpty && (!value || value.trim() === '')) {
      throw new Error('字符串不能为空');
    }
    
    if (!value) {
      return value;
    }
    
    if (value.length < minLength) {
      throw new Error(`字符串长度不能少于 ${minLength} 个字符`);
    }
    
    if (maxLength && value.length > maxLength) {
      throw new Error(`字符串长度不能超过 ${maxLength} 个字符`);
    }
    
    return value;
  }
  
  /**
   * 验证ID格式
   */
  static validateId(value) {
    if (!value) {
      throw new Error('ID不能为空');
    }
    
    const id = parseInt(value, 10);
    
    if (isNaN(id) || id <= 0) {
      throw new Error('ID必须是正整数');
    }
    
    return id;
  }
  
  /**
   * 验证分页游标
   */
  static validatePageInfo(value) {
    if (!value) {
      return null;
    }
    
    // 简单验证base64格式
    try {
      const decoded = Buffer.from(value, 'base64').toString();
      if (!decoded) {
        throw new Error('无效的分页游标');
      }
      return value;
    } catch (error) {
      throw new Error('分页游标格式不正确');
    }
  }
}

/**
 * 产品列表查询参数验证中间件
 */
export const validateProductsQuery = (req, res, next) => {
  try {
    const { limit, page_info, since_id, search } = req.query;
    
    // 验证参数
    req.validatedQuery = {
      limit: Validator.validateNumber(limit, 1, 250, 50),
      page_info: Validator.validatePageInfo(page_info),
      since_id: since_id ? Validator.validateId(since_id) : null,
      search: search ? Validator.validateString(search, 1, 100, true) : null
    };
    
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: '请求参数验证失败',
      details: error.message,
      validParams: {
        limit: '数字，范围1-250，默认50',
        page_info: '分页游标字符串（可选）',
        since_id: '正整数ID（可选）',
        search: '搜索关键词，1-100字符（可选）'
      }
    });
  }
};

/**
 * 产品ID参数验证中间件
 */
export const validateProductId = (req, res, next) => {
  try {
    const { id } = req.params;
    req.validatedParams = {
      id: Validator.validateId(id)
    };
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: '产品ID验证失败',
      details: error.message
    });
  }
};

/**
 * 通用请求体验证中间件
 */
export const validateRequestBody = (schema) => {
  return (req, res, next) => {
    try {
      const errors = [];
      
      for (const [field, rules] of Object.entries(schema)) {
        const value = req.body[field];
        
        // 检查必填字段
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`字段 '${field}' 是必填的`);
          continue;
        }
        
        // 如果字段不存在且不是必填的，跳过验证
        if (value === undefined || value === null) {
          continue;
        }
        
        // 类型验证
        if (rules.type === 'string') {
          req.body[field] = Validator.validateString(
            value, 
            rules.minLength || 0, 
            rules.maxLength || null, 
            !rules.required
          );
        } else if (rules.type === 'number') {
          req.body[field] = Validator.validateNumber(
            value, 
            rules.min || null, 
            rules.max || null
          );
        }
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: '请求体验证失败',
          details: errors
        });
      }
      
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: '请求体验证失败',
        details: error.message
      });
    }
  };
};

export default Validator;