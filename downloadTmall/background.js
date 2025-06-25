// background.js - 后台服务脚本

class BackgroundService {
  constructor() {
    this.downloadTasks = new Map();
    this.init();
  }

  init() {
    // 监听来自content script和popup的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // 保持消息通道开放
    });

    // 监听扩展安装事件
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details);
    });

    // 监听下载事件
    chrome.downloads.onChanged.addListener((downloadDelta) => {
      this.handleDownloadChange(downloadDelta);
    });

    console.log('天猫下载助手后台服务已启动');
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'downloadImages':
          await this.downloadImages(message.images, message.isMain, message.productId);
          sendResponse({ success: true });
          break;
        case 'downloadFile':
          await this.downloadFile(message.content, message.filename, message.mimeType);
          sendResponse({ success: true });
          break;
        default:
          sendResponse({ success: false, error: '未知的操作' });
      }
    } catch (error) {
      console.error('处理消息失败:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  handleInstall(details) {
    if (details.reason === 'install') {
      console.log('扩展首次安装');
    } else if (details.reason === 'update') {
      console.log('扩展已更新');
    }
  }

  async downloadImages(imageUrls, isMain, productId) {
    if (!imageUrls || imageUrls.length === 0) return;

    const settings = await this.getSettings(isMain, productId);
    if (!settings.autoDownloadImages) return;

    const maxConcurrent = settings.maxConcurrentDownloads || 2; // 降低并发数
    const folderName = `${settings.downloadPath}`;
    
    console.log(`开始下载 ${imageUrls.length} 张图片，并发数: ${maxConcurrent}`);
    
    let downloadedCount = 0;
    let failedCount = 0;
    const failedUrls = [];
    
    // 分批下载图片
    for (let i = 0; i < imageUrls.length; i += maxConcurrent) {
      const batch = imageUrls.slice(i, i + maxConcurrent);
      const promises = batch.map(async (url, index) => {
        const globalIndex = i + index;
        try {
          // 获取文件扩展名
          const extension = this.getImageExtension(url);
          // 根据产品标题判断是否为主图下载，使用不同的文件名格式
          const prefix = isMain ? 'main' : 'image';
          const filename = `${folderName}/${prefix}-${globalIndex + 1}.${extension}`;
          
          console.log(`开始下载第 ${globalIndex + 1} 张图片: ${url}`);
          const result = await this.downloadImageWithRetry(url, filename, 3);
          
          if (result) {
            downloadedCount++;
            console.log(`成功下载第 ${downloadedCount} 张图片: ${filename}`);
          } else {
            failedCount++;
            failedUrls.push(url);
            console.error(`下载失败: ${url}`);
          }
          return result;
        } catch (error) {
          failedCount++;
          failedUrls.push(url);
          console.error(`下载图片出错 ${url}:`, error);
          return null;
        }
      });
      
      await Promise.allSettled(promises);
      
      // 更新进度
      const progress = Math.min(100, ((i + batch.length) / imageUrls.length) * 100);
      this.sendProgressUpdate(progress);
      
      // 添加延迟避免过快请求
      if (i + maxConcurrent < imageUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 增加延迟
      }
    }
    
    console.log(`下载完成: 成功 ${downloadedCount} 张，失败 ${failedCount} 张`);
    
    // 发送最终完成状态
    this.sendProgressUpdate(100);
  }

  getImageExtension(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      const match = pathname.match(/\.(jpg|jpeg|png|webp|gif)$/i);
      return match ? match[1] : 'jpg';
    } catch {
      return 'jpg';
    }
  }

  async downloadImageWithRetry(url, filename, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`尝试下载 (第${attempt}次): ${url}`);
        const result = await this.downloadImage(url, filename);
        if (result) {
          return result;
        }
        
        if (attempt < maxRetries) {
          console.log(`第${attempt}次下载失败，等待重试...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // 递增延迟
        }
      } catch (error) {
        console.error(`第${attempt}次下载尝试失败:`, error);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }
    return null;
  }

  async downloadImage(url, filename) {
    try {
      // 验证URL格式
      if (!url || !url.startsWith('http')) {
        console.error(`无效的图片URL: ${url}`);
        return null;
      }
      
      const downloadId = await chrome.downloads.download({
        url: url,
        filename: filename,
        conflictAction: 'uniquify'
      });
      
      // 等待下载完成
      return new Promise((resolve) => {
        let resolved = false;
        
        const cleanup = (result) => {
          if (resolved) return;
          resolved = true;
          chrome.downloads.onChanged.removeListener(checkDownload);
          resolve(result);
        };
        
        const checkDownload = (downloadDelta) => {
          if (downloadDelta.id === downloadId) {
            if (downloadDelta.state && downloadDelta.state.current === 'complete') {
              console.log(`下载完成: ${url}`);
              cleanup(downloadId);
            } else if (downloadDelta.state && downloadDelta.state.current === 'interrupted') {
              console.error(`下载中断: ${url}`, downloadDelta.error);
              cleanup(null);
            }
          }
        };
        
        chrome.downloads.onChanged.addListener(checkDownload);
        
        // 设置更长的超时时间
        setTimeout(() => {
          if (!resolved) {
            console.warn(`下载超时: ${url}`);
            cleanup(downloadId); // 超时也认为成功，让Chrome自己处理
          }
        }, 30000); // 增加到30秒
      });
      
    } catch (error) {
      console.error(`下载图片失败 ${url}:`, error);
      return null;
    }
  }

  async downloadFile(content, filename, mimeType) {
    try {
      // 在service worker环境中使用data URL替代Blob URL
      const base64Content = btoa(unescape(encodeURIComponent(content)));
      const dataUrl = `data:${mimeType};base64,${base64Content}`;
      
      const downloadId = await chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        conflictAction: 'uniquify'
      });
      
      return downloadId;
    } catch (error) {
      console.error('下载文件失败:', error);
      throw error;
    }
  }

  async getSettings(isMain, productId) {
    let id = productId || '0';
    return {
      downloadPath: isMain ? `tmall-downloads/${id}` : `tmall-downloads/${id}/detail`,
      autoDownloadImages: true,
      saveFormat: 'json',
      maxConcurrentDownloads: 2 // 降低并发数提高稳定性
    };
  }

  handleDownloadChange(downloadDelta) {
    if (downloadDelta.state && downloadDelta.state.current === 'complete') {
      console.log(`下载完成: ${downloadDelta.id}`);
    } else if (downloadDelta.state && downloadDelta.state.current === 'interrupted') {
      console.log(`下载中断: ${downloadDelta.id}`);
    }
  }

  sendProgressUpdate(progress) {
    chrome.runtime.sendMessage({
      action: 'downloadProgress',
      progress: progress
    }).catch(() => {
      // 忽略发送失败的错误（popup可能已关闭）
    });
  }

  sendErrorUpdate(error) {
    chrome.runtime.sendMessage({
      action: 'downloadError',
      error: error
    }).catch(() => {
      // 忽略发送失败的错误
    });
  }
}

// 初始化后台服务
const backgroundService = new BackgroundService();