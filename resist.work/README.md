# Express Shopify API

一个基于Express.js的Shopify产品管理API服务，支持获取产品列表和产品详情，包含完整的分页功能。

服务将在 `http://localhost:3000` 启动。

## API接口

### 获取产品列表

```http
GET /api/products
```

#### 查询参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `limit` | number | 50 | 每页返回的产品数量（最大250） |
| `page_info` | string | - | 分页游标，用于获取下一页或上一页 |
| `since_id` | number | - | 从指定产品ID开始获取 |

#### 示例请求

```bash
# 获取前50个产品
curl "http://localhost:3000/api/products"

# 获取前10个产品
curl "http://localhost:3000/api/products?limit=10"

# 使用分页游标获取下一页
curl "http://localhost:3000/api/products?page_info=eyJsYXN0X2lkIjo..."

# 从指定ID开始获取
curl "http://localhost:3000/api/products?since_id=123456789"
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 123456789,
        "title": "产品名称",
        "handle": "product-handle",
        "body_html": "产品描述",
        "vendor": "品牌名称",
        "product_type": "产品类型",
        "created_at": "2023-01-01T00:00:00-00:00",
        "updated_at": "2023-01-01T00:00:00-00:00",
        "published_at": "2023-01-01T00:00:00-00:00",
        "template_suffix": null,
        "status": "active",
        "published_scope": "web",
        "tags": "标签1, 标签2",
        "admin_graphql_api_id": "gid://shopify/Product/123456789",
        "variants": [...],
        "options": [...],
        "images": [...]
      }
    ],
    "pagination": {
      "hasNextPage": true,
      "hasPreviousPage": false,
      "nextPageInfo": "eyJsYXN0X2lkIjo...",
      "previousPageInfo": null,
      "currentLimit": 50,
      "totalCount": 50
    }
  },
  "message": "成功获取 50 个产品"
}
```

### 获取产品详情

```http
GET /api/products/:id
```

#### 示例请求

```bash
curl "http://localhost:3000/api/products/123456789"
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 123456789,
    "title": "产品名称",
    // ... 完整的产品信息
  },
  "message": "成功获取产品详情"
}
```

### 健康检查

```http
GET /health
```

用于监控服务状态和配置信息。

#### 响应示例

```json
{
  "status": "OK",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "version": "1.0.0",
  "memory": {
    "used": 45.67,
    "total": 128.00
  },
  "shopifyConfig": {
    "hasApiKey": true,
    "hasApiSecret": true,
    "hasShopDomain": true,
    "hasAccessToken": true
  }
}
```

## 错误处理

API使用标准的HTTP状态码和JSON错误响应：

```json
{
  "success": false,
  "error": "错误描述",
  "details": "详细错误信息"
}
```
