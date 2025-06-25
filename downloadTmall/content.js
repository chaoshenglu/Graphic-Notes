// content.js - 天猫页面内容脚本

class TmallDownloader {
  constructor() {
    this.isDownloading = false;
    this.downloadQueue = [];
    this.init();
  }

  init() {
    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // 保持消息通道开放
    });

    // 页面加载完成后的初始化
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onPageReady());
    } else {
      this.onPageReady();
    }
  }

  onPageReady() {
    console.log('天猫下载助手已加载');
    this.detectPageType();
  }

  detectPageType() {
    const url = window.location.href;

    if (url.includes('/item.htm')) {
      this.pageType = 'product';
      console.log('检测到商品详情页');
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'startDownload':
          const result = await this.startDownload();
          sendResponse({ success: true, data: result });
          break;

        case 'getPageInfo':
          const pageInfo = this.getPageInfo();
          sendResponse({ success: true, data: pageInfo });
          break;

        case 'stopDownload':
          this.stopDownload();
          sendResponse({ success: true });

        case 'downloadMainImages':
          const mainImagesResult = await this.downloadMainImages();
          sendResponse({ success: true, data: mainImagesResult });
          break;

        case 'downloadProductParameters':
          const productParametersResult = await this.downloadProductParameters();
          sendResponse({ success: true, data: productParametersResult });
          break;

        default:
          sendResponse({ success: false, error: '未知的操作' });
      }
    } catch (error) {
      console.error('处理消息失败:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async startDownload() {
    if (this.isDownloading) {
      throw new Error('下载已在进行中');
    }

    this.isDownloading = true;

    try {
      // 直接查找并下载指定class的图片
      return await this.downloadSpecificImages();
    } finally {
      this.isDownloading = false;
    }
  }

  async downloadSpecificImages() {
    // 查找所有class="descV8-singleImage-image lazyload"的图片
    const targetImages = document.querySelectorAll('img.descV8-singleImage-image.lazyload');

    if (targetImages.length === 0) {
      throw new Error('未找到指定class的图片');
    }

    console.log(`找到 ${targetImages.length} 个目标图片元素`);
    // 获取当前网页的链接，并从网页链接的参数中获取id
    const urlParams = new URLSearchParams(window.location.search);
    let id = urlParams.get('id');
    let count = targetImages.length;

    // 将id和count保存到localStorage中
    if (id) {
      localStorage.setItem(`tmall_count_${id}`, count.toString());
      console.log(`已保存商品ID ${id} 的图片数量: ${count}`);
    }

    // 处理懒加载图片
    const imageUrls = await this.processLazyLoadImages(targetImages);

    if (imageUrls.length === 0) {
      throw new Error('未找到有效的图片URL');
    }

    console.log(`获取到 ${imageUrls.length} 个有效图片URL:`, imageUrls);

    // 发送图片URL到background script进行下载
    chrome.runtime.sendMessage({
      action: 'downloadImages',
      images: imageUrls,
      isMain: false,
      productId: id
    });

    return {
      message: `找到 ${imageUrls.length} 张图片，开始下载`,
      imageCount: imageUrls.length,
      images: imageUrls
    };
  }

  async downloadMainImages() {
    if (this.isDownloading) {
      throw new Error('下载已在进行中');
    }

    this.isDownloading = true;

    try {
      // 查找class包含thumbnails的ul标签
      const thumbnailsUl = document.querySelector('ul[class*="thumbnails"]');

      if (!thumbnailsUl) {
        throw new Error('未找到包含thumbnails的ul标签');
      }

      console.log('找到thumbnails容器:', thumbnailsUl);

      // 提取ul中的所有li元素
      const liElements = thumbnailsUl.querySelectorAll('li');

      if (liElements.length === 0) {
        throw new Error('thumbnails容器中未找到li元素');
      }

      console.log(`找到 ${liElements.length} 个li元素`);

      // 提取li中的img的src
      const imageUrls = [];

      for (let i = 0; i < liElements.length; i++) {
        const li = liElements[i];
        const img = li.querySelector('img');

        if (img) {
          // 尝试多种属性获取图片URL
          let imageUrl = this.extractImageUrl(img);

          if (imageUrl && this.isValidImageUrl(imageUrl)) {
            // 确保URL是完整的
            imageUrl = this.normalizeImageUrl(imageUrl);

            // 去除URL参数中的尺寸限制，获取原图
            imageUrl = imageUrl.replace(/_\d+x\d+\./g, '.');
            imageUrl = imageUrl.replace(/_\d+\./g, '.');

            if (!imageUrls.includes(imageUrl)) {
              imageUrls.push(imageUrl);
              console.log(`成功获取第 ${imageUrls.length} 个主图URL: ${imageUrl}`);
            }
          } else {
            console.warn(`第 ${i + 1} 个li元素中的img未能获取有效URL:`, img);
          }
        } else {
          console.log(`第 ${i + 1} 个li元素中未找到img标签`);
        }
      }

      if (imageUrls.length === 0) {
        throw new Error('未找到有效的主图URL');
      }

      console.log(`获取到 ${imageUrls.length} 个有效主图URL:`, imageUrls);
      // 获取当前网页的链接，并从网页链接的参数中获取id
      const urlParams = new URLSearchParams(window.location.search);
      let id = urlParams.get('id');
      // 发送图片URL到background script进行下载
      chrome.runtime.sendMessage({
        action: 'downloadImages',
        images: imageUrls,
        isMain: true,
        productId: id
      });

      return {
        message: `找到 ${imageUrls.length} 张主图，开始下载`,
        imageCount: imageUrls.length,
        images: imageUrls
      };
    } finally {
      this.isDownloading = false;
    }
  }

  async processLazyLoadImages(images) {
    const imageUrls = [];

    console.log(`开始处理 ${images.length} 个懒加载图片`);

    for (let i = 0; i < images.length; i++) {
      const img = images[i];

      console.log(`处理第 ${i + 1} 个图片元素`);

      // 滚动到图片位置触发懒加载
      img.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 等待页面稳定
      await new Promise(resolve => setTimeout(resolve, 200));

      // 尝试触发懒加载的多种方式
      this.triggerLazyLoad(img);

      // 等待图片加载
      await this.waitForImageLoad(img);

      // 尝试多种方式获取图片URL
      let imageUrl = this.extractImageUrl(img);

      if (imageUrl && this.isValidImageUrl(imageUrl)) {
        // 确保URL是完整的
        imageUrl = this.normalizeImageUrl(imageUrl);

        // 去除URL参数中的尺寸限制，获取原图
        imageUrl = imageUrl.replace(/_(\d+x\d+|\d+)\.(jpg|jpeg|png|webp)/i, '.$2');

        if (!imageUrls.includes(imageUrl)) {
          imageUrls.push(imageUrl);
          console.log(`成功获取第 ${imageUrls.length} 个图片URL: ${imageUrl}`);
        }
      } else {
        console.warn(`第 ${i + 1} 个图片元素未能获取有效URL:`, img);
      }

      // 添加延迟避免过快处理
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`处理完成，共获取 ${imageUrls.length} 个有效图片URL`);
    return imageUrls;
  }

  triggerLazyLoad(img) {
    // 触发多种可能的懒加载事件
    const events = ['scroll', 'resize', 'load'];
    events.forEach(eventType => {
      const event = new Event(eventType, { bubbles: true });
      img.dispatchEvent(event);
      window.dispatchEvent(event);
    });

    // 尝试触发Intersection Observer
    if (window.IntersectionObserver) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            observer.disconnect();
          }
        });
      });
      observer.observe(img);
      setTimeout(() => observer.disconnect(), 1000);
    }
  }

  extractImageUrl(img) {
    // 尝试多种属性获取图片URL
    const urlAttributes = [
      'src',
      'data-src',
      'data-original',
      'data-lazy-src',
      'data-url',
      'data-img',
      'data-image'
    ];

    for (const attr of urlAttributes) {
      const url = attr === 'src' ? img.src : img.getAttribute(attr);
      if (url && this.isValidImageUrl(url)) {
        return url;
      }
    }

    // 检查dataset
    if (img.dataset) {
      for (const key in img.dataset) {
        if (key.toLowerCase().includes('src') || key.toLowerCase().includes('url') || key.toLowerCase().includes('img')) {
          const url = img.dataset[key];
          if (url && this.isValidImageUrl(url)) {
            return url;
          }
        }
      }
    }

    return null;
  }

  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (url.includes('data:image')) return false;
    if (url.includes('placeholder')) return false;
    if (url.includes('loading')) return false;
    if (url.length < 10) return false;
    return true;
  }

  normalizeImageUrl(imageUrl) {
    if (imageUrl.startsWith('//')) {
      return 'https:' + imageUrl;
    } else if (imageUrl.startsWith('/')) {
      return window.location.origin + imageUrl;
    }
    return imageUrl;
  }

  getPageInfo() {
    return {
      type: this.pageType,
      url: window.location.href,
      title: document.title,
      isDownloading: this.isDownloading
    };
  }

  stopDownload() {
    this.isDownloading = false;
    this.downloadQueue = [];
  }


  waitForImageLoad(img) {
    return new Promise((resolve) => {
      let resolved = false;

      // 监听图片加载事件
      const onLoad = () => {
        console.log('图片加载完成:', img.src);
        cleanup();
      };

      const onError = () => {
        console.warn('图片加载失败:', img.src);
        cleanup(); // 即使出错也继续
      };

      const cleanup = () => {
        if (resolved) return;
        resolved = true;
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
        resolve();
      };

      // 如果图片已经有有效的src，等待一小段时间后返回
      if (img.src && this.isValidImageUrl(img.src)) {
        setTimeout(cleanup, 100);
        return;
      }

      img.addEventListener('load', onLoad);
      img.addEventListener('error', onError);

      // 定期检查图片是否已加载
      const checkInterval = setInterval(() => {
        if (resolved) {
          clearInterval(checkInterval);
          return;
        }

        if (img.src && this.isValidImageUrl(img.src) && img.complete) {
          clearInterval(checkInterval);
          cleanup();
        }
      }, 200);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (!resolved) {
          console.warn('图片加载超时:', img);
          cleanup();
        }
      }, 3000);
    });
  }

  async downloadProductParameters() {
    if (this.isDownloading) {
      throw new Error('下载已在进行中');
    }

    this.isDownloading = true;

    let imagesDiv = "";
    // 获取当前网页的链接，并从网页链接的参数中获取id
    const urlParams = new URLSearchParams(window.location.search);
    let id = urlParams.get('id');
    if (id) {
      const count = localStorage.getItem(`tmall_count_${id}`);
      if (count) {
        const imageUrls = []
        for (let i = 1; i <= count; i++) {
          imageUrls.push(`https://tiffanylamps.art/${id}/detail/image-${i}.webp`)
        }

        // 生成img标签
        const imgTags = imageUrls.map(url => `  <img src="${url}">`).join('\n')

        // 生成完整的HTML代码
        imagesDiv = `<div style="display: flex; flex-direction: column;border-radius: 8px;box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);overflow: hidden;">\n${imgTags}\n</div>`
      }
    }

    try {
      // 查找包含baseDropsInfo的div元素
      const baseDropsInfoDiv = document.querySelector('div[class*="baseDropsInfo"]');

      if (!baseDropsInfoDiv) {
        throw new Error('未找到包含baseDropsInfo的div元素');
      }

      console.log('找到产品参数容器:', baseDropsInfoDiv);

      // 获取产品标题作为文件名
      const productTitle = document.title.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50);

      // 克隆元素并清理class属性
      const clonedDiv = baseDropsInfoDiv.cloneNode(true);
      this.cleanupClassNames(clonedDiv);

      // 创建完整的HTML内容
      const htmlContent = `
    <style>
        .section-title {
            color: #11192d;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 16px;
        }

        .product-info {
            max-width: 1100px;
            margin-bottom: 15px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .table-wrapper {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
        }
        
        .info-item {
            display: flex;
            border-bottom: 1px solid #e8e8e8;
            min-height: 48px;
        }
        
        .info-item:last-child {
            border-bottom: none;
        }
        
        .info-item-title {
            flex: 0 0 120px;
            padding: 12px 16px;
            background-color: #f8f9fa;
            border-right: 1px solid #e8e8e8;
            font-weight: 500;
            color: #333333;
            display: flex;
            align-items: center;
            font-size: 14px;
        }
        
        .info-item-content {
            flex: 1;
            padding: 12px 16px;
            color: #666666;
            display: flex;
            align-items: center;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .info-item:nth-child(odd) {
            grid-column: 1;
        }
        
        .info-item:nth-child(even) {
            grid-column: 2;
            border-left: 1px solid #e8e8e8;
        }
        
        @media (max-width: 768px) {
            .table-wrapper {
                grid-template-columns: 1fr;
            }
            
            .info-item:nth-child(even) {
                grid-column: 1;
                border-left: none;
            }
            
            .info-item-title {
                flex: 0 0 100px;
                font-size: 13px;
            }
            
            .info-item-content {
                font-size: 13px;
            }
        }
    </style>
</head>
<body>
<p class="section-title">Parameter information</p>
    ${clonedDiv.outerHTML}
<p class="section-title">Graphic details</p>
    ${imagesDiv}
</body>`;

      // 发送到background script进行下载
      chrome.runtime.sendMessage({
        action: 'downloadFile',
        content: htmlContent,
        filename: `tmall-downloads/参数-${productTitle}.html`,
        mimeType: 'text/html'
      });

      return {
        message: '产品参数已保存为HTML文件',
        filename: `参数-${productTitle}.html`
      };
    } finally {
      this.isDownloading = false;
    }
  }

  cleanupClassNames(element) {
    if (element.className) {
      const currentClass = element.className;
      let newClass = '';
      if (currentClass.includes('baseDropsInfo')) {
        newClass = 'product-info';
      } else if (currentClass.includes('tableWrapper')) {
        newClass = 'table-wrapper';
      } else if (currentClass.includes('infoItem') && !currentClass.includes('infoItemTitle') && !currentClass.includes('infoItemContent')) {
        newClass = 'info-item';
      } else if (currentClass.includes('infoItemTitle')) {
        newClass = 'info-item-title';
      } else if (currentClass.includes('infoItemContent')) {
        newClass = 'info-item-content';
      }
      element.className = newClass;
    }

    for (const child of element.children) {
      this.cleanupClassNames(child);
    }
  }
}

// 初始化下载器
const tmallDownloader = new TmallDownloader();