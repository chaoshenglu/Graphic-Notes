# 天猫数据采集器

一个用于采集天猫商品详情页数据的Chrome扩展程序。

## 功能特性

- 🆔 **商品ID采集**: 自动提取商品ID
- 📝 **商品标题采集**: 获取商品标题信息
- 🖼️ **主图采集**: 采集商品主要展示图片
- 📸 **细节图采集**: 采集商品详情页中的细节图片
- 📋 **产品参数采集**: 提取商品规格参数信息
- 🚀 **一键上传**: 将采集的数据上传到后端API

## 安装说明

### 1. 安装依赖
```bash
npm install
```

### 2. 构建项目
```bash
npm run build
```

### 3. 加载扩展到Chrome
1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 目录

## 使用方法

1. 访问任意天猫商品详情页
2. 点击浏览器工具栏中的扩展图标
3. 在弹出的窗口中点击"开始采集数据"按钮
4. 等待采集完成，数据将自动上传到后端

## 开发说明

### 项目结构
```
├── manifest.json          # Chrome扩展配置文件
├── popup/                 # 弹窗界面
│   ├── popup.html        # 弹窗HTML
│   ├── popup.js          # 弹窗入口脚本
│   └── PopupApp.vue      # Vue组件
├── content/               # 内容脚本
│   └── content.js        # 页面数据采集逻辑
├── background/            # 后台脚本
│   └── background.js     # 后台服务
└── 采集逻辑文档/           # 各种采集逻辑的说明文档
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 配置后端API

在 `popup/PopupApp.vue` 文件中修改后端API地址：

```javascript
// 将此行中的URL替换为你的实际后端API地址
await axios.post('https://your-backend-api.com/products', productData)
```

## 采集的数据格式

```json
{
  "product_id": "商品ID",
  "title": "商品标题",
  "main_images": ["主图URL数组"],
  "detail_images": ["细节图URL数组"],
  "htmlContent": "产品参数HTML内容"
}
```

## 技术栈

- **Vue 3**: 前端框架
- **Vite**: 构建工具
- **Axios**: HTTP客户端
- **Chrome Extension API**: 浏览器扩展API

## 注意事项

1. 此扩展仅适用于天猫商品详情页
2. 需要确保网络连接正常以便上传数据
3. 某些图片可能需要时间加载，请耐心等待采集完成
4. 使用前请确保已配置正确的后端API地址

## 许可证

MIT License