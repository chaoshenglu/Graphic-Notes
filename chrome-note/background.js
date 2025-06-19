console.log("Background service worker loaded.");

// 监听扩展安装或更新事件
chrome.runtime.onInstalled.addListener(() => {
  console.log("扩展已安装或更新。");
});

// 监听扩展图标点击事件
chrome.action.onClicked.addListener(async (tab) => {
  console.log("扩展图标被点击");
  // 获取当前活动的标签页
  const { id: tabId } = tab;
  if (tabId) {
    // 打开侧边栏
    await chrome.sidePanel.open({ tabId });
  } else {
    console.error("无法获取当前标签页 ID，无法打开侧边栏。");
  }
});

// 设置侧边栏默认状态
chrome.runtime.onInstalled.addListener(() => {
  // 可以在这里设置侧边栏的默认状态
  chrome.sidePanel.setOptions({
    enabled: true,
    path: 'dist/sidebar.html'
  });
  
  // 创建右键菜单
  chrome.contextMenus.create({
    id: "addToNote",
    title: "添加到笔记",
    contexts: ["selection"]
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("创建右键菜单失败:", chrome.runtime.lastError);
    } else {
      console.log("右键菜单创建成功。");
    }
  });
});

// 监听标签页激活事件 (切换标签页)
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError) {
      // 处理错误，例如标签页可能已经关闭
      console.warn(`Error getting tab info: ${chrome.runtime.lastError.message}`);
      return;
    }
    if (tab && tab.url) {
      console.log("Tab activated:", tab.url);
      // 向侧边栏发送消息
      chrome.runtime.sendMessage({ action: "urlChanged", url: tab.url })
        .catch(error => {
          if (error.message.includes("Receiving end does not exist")) {
            console.log("Side panel is not open or listening.");
          } else {
            console.error("Error sending message from onActivated:", error);
          }
        });
    }
  });
});

// 监听标签页更新事件 (例如，在同一标签页内导航)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 检查 URL 是否已更改并且标签页已完成加载
  // 我们也只关心当前活动窗口中的活动标签页的更新
  if (changeInfo.url && tab.active) {
    console.log("Tab updated:", changeInfo.url);
    // 向侧边栏发送消息
    chrome.runtime.sendMessage({ action: "urlChanged", url: changeInfo.url })
      .catch(error => {
        if (error.message.includes("Receiving end does not exist")) {
          console.log("Side panel is not open or listening during onUpdated.");
        } else {
          console.error("Error sending message from onUpdated:", error);
        }
      });
  }
  
  // 检查页面是否已完成加载
  if (changeInfo.status === 'complete' && tab.active) {
    console.log("Page loading complete:", tab.url);
    // 向侧边栏发送页面加载完成的消息
    chrome.runtime.sendMessage({ action: "pageLoaded", url: tab.url })
      .catch(error => {
        if (error.message.includes("Receiving end does not exist")) {
          console.log("Side panel is not open or listening during page load complete.");
        } else {
          console.error("Error sending message for page load complete:", error);
        }
      });
  }
});

// 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => { // 修改为 async
  console.log("右键菜单点击事件触发:", info, tab);
  if (info.menuItemId === "addToNote" && info.selectionText && tab && tab.id) {
    try {
      console.log("右键菜单：尝试直接打开侧边栏...");
      await chrome.sidePanel.open({ tabId: tab.id }); // 直接打开侧边栏，确保在用户手势上下文中
      console.log("右键菜单：侧边栏已打开或已尝试打开。现在尝试立即发送消息...");

      // 尝试立即发送消息
      chrome.runtime.sendMessage({
        action: "addSelectedText",
        text: info.selectionText,
        fromContextMenu: true
      }).catch(error => {
        if (error.message && error.message.includes("Receiving end does not exist")) {
          // 如果第一次发送失败（可能侧边栏刚打开正在加载），则延迟后重试
          console.log("立即发送失败，接收端不存在。延迟1秒后重试...");
          setTimeout(() => {
            console.log("尝试发送 addSelectedText 消息 (延迟后重试)");
            chrome.runtime.sendMessage({
              action: "addSelectedText",
              text: info.selectionText,
              fromContextMenu: true
            }).catch(retryError => {
              console.error("发送 addSelectedText 消息失败 (延迟后重试):", retryError);
            });
          }, 1000); // 延迟1秒
        } else {
          // 其他类型的发送错误
          console.error("发送 addSelectedText 消息失败 (非接收端不存在错误):", error);
        }
      });
    } catch (e) {
      console.error("处理右键菜单点击时出错 (打开侧边栏或发送消息):", e);
    }
  } else if (!(tab && tab.id)) {
    console.warn("右键菜单点击：无法获取有效的 tab.id，无法打开侧边栏或发送消息。");
  } else if (!info.selectionText) {
    console.warn("右键菜单点击：没有选中的文本。");
  }
});

// 监听窗口状态变化事件
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    console.log("窗口失去焦点，可能是最小化或切换到其他应用");
    // 向侧边栏发送消息
    chrome.runtime.sendMessage({ action: "windowStateChanged", state: "minimized" })
      .catch(error => {
        if (error.message.includes("Receiving end does not exist")) {
          console.log("Side panel is not open or listening.");
        } else {
          console.error("Error sending window state message:", error);
        }
      });
  }
});
