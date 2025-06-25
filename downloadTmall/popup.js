// popup.js - 扩展弹窗的主要逻辑

class PopupController {
  constructor() {
    this.init();
  }

  async init() {
    // 获取DOM元素
    this.downloadBtn = document.getElementById('downloadBtn');
    this.downloadMainImagesBtn = document.getElementById('downloadMainImagesBtn');
    this.downloadProductParametersBtn = document.getElementById('downloadProductParameters');
    this.status = document.getElementById('status');
    this.progress = document.getElementById('progress');
    this.progressFill = document.getElementById('progressFill');
    this.progressText = document.getElementById('progressText');
    
    // 绑定事件监听器
    this.downloadBtn.addEventListener('click', () => this.handleDownload());
    this.downloadMainImagesBtn.addEventListener('click', () => this.handleDownloadMainImages());
    this.downloadProductParametersBtn.addEventListener('click', () => this.handleDownloadProductParameters());
    
    // 检查当前页面状态
    await this.checkPageStatus();
  }

  async checkPageStatus() {
    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('tmall.com') && !tab.url.includes('taobao.com')) {
        this.updateStatus('请在天猫或淘宝页面使用此扩展', 'warning');
        this.downloadBtn.disabled = true;
        this.downloadMainImagesBtn.disabled = true;
        this.downloadProductParametersBtn.disabled = true;
        return;
      }
      
      // 尝试与content script通信
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: 'getPageInfo'
        });
        
        if (response && response.success) {
          this.updateStatus('页面已就绪，点击开始下载指定图片', 'info');
          this.downloadBtn.disabled = false;
          this.downloadMainImagesBtn.disabled = false;
          this.downloadProductParametersBtn.disabled = false;
        } else {
          throw new Error('页面脚本未响应');
        }
      } catch (error) {
        this.updateStatus('页面脚本未加载，请刷新页面后重试', 'warning');
        this.downloadBtn.disabled = true;
        this.downloadMainImagesBtn.disabled = true;
        this.downloadProductParametersBtn.disabled = true;
      }
    } catch (error) {
      console.error('检查页面状态失败:', error);
      this.updateStatus('检查页面状态失败', 'error');
      this.downloadBtn.disabled = true;
      this.downloadMainImagesBtn.disabled = true;
      this.downloadProductParametersBtn.disabled = true;
    }
  }

  updateStatus(message, type = 'info') {
    const statusElement = this.status.querySelector('p');
    statusElement.textContent = message;
    
    // 移除之前的状态类
    this.status.classList.remove('status-success', 'status-error', 'status-warning');
    
    // 添加新的状态类
    if (type !== 'info') {
      this.status.classList.add(`status-${type}`);
    }
  }

  async handleDownload() {
    try {
      this.updateStatus('正在查找指定图片...', 'info');
      this.showProgress();
      
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 检查是否在天猫页面
      if (!tab.url.includes('tmall.com') && !tab.url.includes('taobao.com')) {
        throw new Error('请在天猫或淘宝页面使用此扩展');
      }
      
      // 向内容脚本发送下载消息
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'startDownload'
      });
      
      if (response && response.success) {
        const data = response.data;
        this.updateStatus(`找到 ${data.imageCount} 张图片，开始下载...`, 'success');
        this.updateProgress(20);
        
        // 监听下载进度
        this.listenForProgress();
      } else {
        throw new Error(response?.error || '启动下载失败');
      }
    } catch (error) {
      console.error('下载失败:', error);
      let errorMessage = error.message;
      
      // 处理特定的错误类型
      if (error.message.includes('Could not establish connection')) {
        errorMessage = '无法连接到页面脚本，请刷新页面后重试';
      } else if (error.message.includes('Receiving end does not exist')) {
        errorMessage = '页面脚本未加载，请确保在天猫商品页面并刷新页面';
      }
      
      this.updateStatus(`下载失败: ${errorMessage}`, 'error');
      this.hideProgress();
    }
  }

  async handleDownloadMainImages() {
    try {
      this.updateStatus('正在查找主图...', 'info');
      this.showProgress();
      
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 检查是否在天猫页面
      if (!tab.url.includes('tmall.com') && !tab.url.includes('taobao.com')) {
        throw new Error('请在天猫或淘宝页面使用此扩展');
      }
      
      // 向内容脚本发送下载主图消息
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'downloadMainImages'
      });
      
      if (response && response.success) {
        const data = response.data;
        this.updateStatus(`找到 ${data.imageCount} 张主图，开始下载...`, 'success');
        this.updateProgress(20);
        
        // 监听下载进度
        this.listenForProgress();
      } else {
        throw new Error(response?.error || '启动主图下载失败');
      }
    } catch (error) {
      console.error('主图下载失败:', error);
      let errorMessage = error.message;
      
      // 处理特定的错误类型
      if (error.message.includes('Could not establish connection')) {
        errorMessage = '无法连接到页面脚本，请刷新页面后重试';
      } else if (error.message.includes('Receiving end does not exist')) {
        errorMessage = '页面脚本未加载，请确保在天猫商品页面并刷新页面';
      }
      
      this.updateStatus(`主图下载失败: ${errorMessage}`, 'error');
      this.hideProgress();
    }
  }

  async handleDownloadProductParameters() {
    try {
      this.updateStatus('正在查找产品参数...', 'info');
      this.showProgress();
      
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 检查是否在天猫页面
      if (!tab.url.includes('tmall.com') && !tab.url.includes('taobao.com')) {
        throw new Error('请在天猫或淘宝页面使用此扩展');
      }
      
      // 向内容脚本发送下载产品参数消息
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'downloadProductParameters'
      });
      
      if (response && response.success) {
        this.updateStatus(`找到产品参数，开始下载...`, 'success');
        this.updateProgress(100);
        
        setTimeout(() => {
          this.hideProgress();
        }, 2000);
      } else {
        throw new Error(response?.error || '启动产品参数下载失败');
      }
    } catch (error) {
      console.error('产品参数下载失败:', error);
      let errorMessage = error.message;
      
      // 处理特定的错误类型
      if (error.message.includes('Could not establish connection')) {
        errorMessage = '无法连接到页面脚本，请刷新页面后重试';
      } else if (error.message.includes('Receiving end does not exist')) {
        errorMessage = '页面脚本未加载，请确保在天猫商品页面并刷新页面';
      }
      
      this.updateStatus(`产品参数下载失败: ${errorMessage}`, 'error');
      this.hideProgress();
    }
  }

  showProgress() {
    this.progress.style.display = 'block';
    this.updateProgress(0);
  }

  hideProgress() {
    this.progress.style.display = 'none';
  }

  updateProgress(percent) {
    this.progressFill.style.width = `${percent}%`;
    this.progressText.textContent = `${Math.round(percent)}%`;
  }

  listenForProgress() {
    // 监听来自background script的进度更新
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'downloadProgress') {
        this.updateProgress(message.progress);
        
        if (message.progress >= 100) {
          this.updateStatus('下载完成！', 'success');
          setTimeout(() => {
            this.hideProgress();
          }, 2000);
        }
      } else if (message.action === 'downloadError') {
        this.updateStatus(`下载错误: ${message.error}`, 'error');
        this.hideProgress();
      }
    });
  }
}

// 当DOM加载完成时初始化
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

// 添加一些CSS类的样式支持
const style = document.createElement('style');
style.textContent = `
  .status-success {
    border-left-color: #28a745 !important;
    background-color: #d4edda !important;
  }
  
  .status-error {
    border-left-color: #dc3545 !important;
    background-color: #f8d7da !important;
  }
  
  .status-warning {
    border-left-color: #ffc107 !important;
    background-color: #fff3cd !important;
  }
`;
document.head.appendChild(style);