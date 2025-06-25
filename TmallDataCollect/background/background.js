// Background Service Worker for Tmall Data Collection Extension

console.log('天猫数据采集器 Background Script 已启动');

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  console.log('扩展已安装/更新:', details.reason);
  
  if (details.reason === 'install') {
    // 首次安装时的逻辑
    console.log('欢迎使用天猫数据采集器!');
  }
});

// 监听来自content script和popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background收到消息:', request);
  
  switch (request.action) {
    case 'getData':
      // 处理数据获取请求
      handleGetData(request, sendResponse);
      return true; // 保持消息通道开放
      
    case 'saveData':
      // 处理数据保存请求
      handleSaveData(request, sendResponse);
      return true;
      
    default:
      console.log('未知的消息类型:', request.action);
  }
});

// 处理数据获取
function handleGetData(request, sendResponse) {
  // TODO: 实现数据获取逻辑
  console.log('处理数据获取请求');
  
  sendResponse({
    success: true,
    message: '数据获取功能待实现',
    data: null
  });
}

// 处理数据保存
function handleSaveData(request, sendResponse) {
  // TODO: 实现数据保存逻辑
  console.log('处理数据保存请求:', request.data);
  
  // 使用Chrome Storage API保存数据
  chrome.storage.local.set({
    collectedData: request.data,
    timestamp: Date.now()
  }, () => {
    sendResponse({
      success: true,
      message: '数据保存成功'
    });
  });
}

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // 检查是否为天猫页面
    if (tab.url.includes('tmall.com')) {
      console.log('检测到天猫页面:', tab.url);
      // TODO: 可以在这里添加页面检测逻辑
    }
  }
});