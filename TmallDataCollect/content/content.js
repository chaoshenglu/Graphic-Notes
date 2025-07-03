// Content Script for Tmall Data Collection
// 这个脚本运行在天猫页面上，用于数据采集

console.log('天猫数据采集器 Content Script 已加载');

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'collectData') {
    console.log('收到数据采集请求');

    // 立即返回true表示异步响应
    (async () => {
      try {
        const collectedData = await collectAllData();
        sendResponse({
          success: true,
          message: '数据采集成功',
          data: collectedData
        });
      } catch (error) {
        console.error('数据采集失败:', error);
        sendResponse({
          success: false,
          error: error.message,
          data: null
        });
      }
    })();

    // 返回true表示异步响应
    return true;
  } else if (request.action === 'getProductId') {
    // 新增：获取商品ID的功能
    try {
      // 尝试多种方式获取商品ID
      let productId = null;

      // 方法1：从URL获取
      const urlMatch = window.location.href.match(/id=(\d+)/);
      if (urlMatch) {
        productId = urlMatch[1];
      }

      // 方法2：从页面元素获取
      if (!productId) {
        const itemIdElement = document.querySelector('[data-item-id]');
        if (itemIdElement) {
          productId = itemIdElement.getAttribute('data-item-id');
        }
      }

      // 方法3：从页面脚本变量获取
      if (!productId) {
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const content = script.textContent;
          const match = content.match(/"itemId"\s*:\s*"?(\d+)"?/);
          if (match) {
            productId = match[1];
            break;
          }
        }
      }

      sendResponse({ productId });
    } catch (error) {
      console.error('获取商品ID失败:', error);
      sendResponse({ productId: null });
    }

    return true;
  }
});

// 主要数据采集函数
async function collectAllData() {
  console.log('开始采集所有数据');

  const data = {
    productId: null,
    title: null,
    video_url: null,
    mainImages: [],
    detailImages: [],
    htmlContent: '',
    skuData: []
  };

  // 1. 采集商品视频（优先执行，其他任务等待完成）
  data.video_url = await collectProductVideo();
  console.log('采集到商品视频:', data.video_url);
  console.log('视频采集任务已完成，开始执行其他采集任务...');

  // 2. 采集商品ID
  data.productId = collectProductId();
  console.log('采集到商品ID:', data.productId);

  // 3. 采集商品标题
  data.title = collectProductTitle();
  console.log('采集到商品标题:', data.title);

  // 4. 采集商品主图
  data.mainImages = await collectMainImages();
  console.log('采集到主图:', data.mainImages);

  // 5. 采集商品细节图
  data.detailImages = await collectDetailImages();
  console.log('采集到细节图:', data.detailImages);

  // 6. 采集商品参数
  data.htmlContent = collectProductParameters();
  console.log('采集到产品参数HTML');

  // 7. 采集SKU数据
  data.skuData = await collectSkuData(data.mainImages);
  console.log('采集到SKU数据:', data.skuData);

  return data;
}

// 采集商品ID
function collectProductId() {
  const urlParams = new URLSearchParams(window.location.search);
  let id = urlParams.get('id');

  if (!id) {
    // 尝试从URL路径中提取ID
    const pathMatch = window.location.pathname.match(/\/(\d+)\.htm/);
    if (pathMatch) {
      id = pathMatch[1];
    }
  }

  return id;
}

// 采集商品标题
function collectProductTitle() {
  let productTitle = document.title.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50);
  productTitle = productTitle.replace("-tmall.com天猫","")
  return productTitle;
}

// 采集商品视频
async function collectProductVideo() {
  return new Promise((resolve) => {
    try {
      console.log('开始采集商品视频...');
      
      // 查找页面中的所有video标签
      const videoElements = document.querySelectorAll('video');
      
      if (videoElements.length === 0) {
        console.log('页面中未找到video标签');
        resolve(null);
        return;
      }
      
      console.log(`找到 ${videoElements.length} 个video标签，取第一个`);
      
      // 取第一个video标签
      const firstVideo = videoElements[0];
      let videoSrc = firstVideo.src;
      
      // 如果src为空，尝试从source子元素获取
      if (!videoSrc) {
        const sourceElement = firstVideo.querySelector('source');
        if (sourceElement) {
          videoSrc = sourceElement.src;
        }
      }
      
      if (!videoSrc) {
        console.log('video标签中未找到有效的src地址');
        resolve(null);
        return;
      }

      // 如果地址不以https://开头，则补齐
      if (!videoSrc.startsWith('https://')) {
        if (videoSrc.startsWith('//')) {
          videoSrc = 'https:' + videoSrc;
        } else if (videoSrc.startsWith('/')) {
          videoSrc = 'https:/' + videoSrc;
        } else {
          videoSrc = 'https://' + videoSrc;
        }
      }
      console.log('最终视频地址:', videoSrc);
      resolve(videoSrc);
    } catch (error) {
      console.error('采集商品视频失败:', error);
      resolve(null);
    }
  });
}

// 采集主图
async function collectMainImages() {
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
        let imageUrl = extractImageUrl(img);

        if (imageUrl) {
          imageUrl = imageUrl.replace('_q50.jpg_.webp','')
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

    return imageUrls;
  } catch (error) {
    console.error('采集主图失败:', error);
    return [];
  }
}

// 采集细节图
async function collectDetailImages() {
  try {
    // 查找所有class="descV8-singleImage-image lazyload"的图片
    const targetImages = document.querySelectorAll('img.descV8-singleImage-image.lazyload');

    if (targetImages.length === 0) {
      throw new Error('未找到指定class的图片');
    }

    console.log(`找到 ${targetImages.length} 个目标图片元素`);

    // 处理懒加载图片
    const imageUrls = await processLazyLoadImages(targetImages);

    return imageUrls;
  } catch (error) {
    console.error('采集细节图失败:', error);
    return [];
  }
}

// 采集产品参数
function collectProductParameters() {
  try {
    // 查找包含baseDropsInfo的div元素
    const baseDropsInfoDiv = document.querySelector('div[class*="baseDropsInfo"]');

    if (!baseDropsInfoDiv) {
      throw new Error('未找到包含baseDropsInfo的div元素');
    }

    console.log('找到产品参数容器:', baseDropsInfoDiv);

    // 克隆元素并清理class属性
    const clonedDiv = baseDropsInfoDiv.cloneNode(true);
    cleanupClassNames(clonedDiv);

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
${clonedDiv.outerHTML}`;

    return htmlContent;
  } catch (error) {
    console.error('采集产品参数失败:', error);
    return '';
  }
}

// 辅助函数：清理class名称
function cleanupClassNames(element) {
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
    cleanupClassNames(child);
  }
}

// 辅助函数：提取图片URL
function extractImageUrl(img) {
  return img.src || img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy');
}

// 辅助函数：触发懒加载
function triggerLazyLoad(img) {
  const event = new Event('scroll');
  window.dispatchEvent(event);

  const intersectionEvent = new Event('intersection');
  img.dispatchEvent(intersectionEvent);
}

// 辅助函数：等待图片加载
function waitForImageLoad(img) {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 10;

    const checkImage = () => {
      attempts++;
      const currentSrc = extractImageUrl(img);

      if (currentSrc) {
        resolve();
      } else if (attempts < maxAttempts) {
        setTimeout(checkImage, 300);
      } else {
        resolve();
      }
    };

    checkImage();
  });
}

// 辅助函数：处理懒加载图片
async function processLazyLoadImages(images) {
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
    triggerLazyLoad(img);

    // 等待图片加载
    await waitForImageLoad(img);

    // 尝试多种方式获取图片URL
    let imageUrl = extractImageUrl(img);

    if (imageUrl) {
      if (!imageUrls.includes(imageUrl)) {
        if (imageUrl == 'https://g.alicdn.com/s.gif') {
          console.log('这张图是分隔线，不要采集');
        } else {
          imageUrls.push(imageUrl);
          console.log(`成功获取第 ${imageUrls.length} 个图片URL: ${imageUrl}`);
        }
      }
    } else {
      console.warn(`第 ${i + 1} 个图片元素未能获取有效URL:`, img);
    }

    // 添加延迟避免过快处理
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return imageUrls;
}

// 采集SKU数据
async function collectSkuData(mainImages) {
  try {
    // 查找所有class包含valueItem的div元素
    const valueItemDivs = document.querySelectorAll('div[class*="valueItem"]');

    if (valueItemDivs.length === 0) {
      console.log('未找到包含valueItem的div元素');
      return [];
    }

    console.log(`找到 ${valueItemDivs.length} 个valueItem元素`);

    const skuData = [];

    for (let index = 0; index < valueItemDivs.length; index++) {
      const div = valueItemDivs[index];
      const spanElement = div.querySelector('span[title]');
      const skuNameCn = spanElement.getAttribute('title');
        if (skuNameCn == '按钮开关'){
          const hasSelectedClass = Array.from(div.classList).some(className => className.includes('isSelected'));
          if (hasSelectedClass){
            console.log('已选中按钮开关')
          }else{
            console.log('现在选中按钮开关')
            div.click();
          }
        }
    }

    // 依次点击每个valueItem元素并采集价格
    for (let index = 0; index < valueItemDivs.length; index++) {
      const div = valueItemDivs[index];
      
      // 跳过包含isDisabled类的元素
      const hasDisabledClass = Array.from(div.classList).some(className => className.includes('isDisabled'));
      if (hasDisabledClass) {
        console.log(`跳过第 ${index + 1} 个valueItem元素（包含isDisabled类）`);
        continue;
      }
      
      try {
        // 查找span元素获取title
        const spanElement = div.querySelector('span[title]');
        if (!spanElement) {
          console.warn(`第 ${index + 1} 个valueItem元素中未找到带title的span`);
          continue;
        }

        const skuNameCn = spanElement.getAttribute('title');
        if (!skuNameCn || skuNameCn == '按钮开关') {
          console.warn(`第 ${index + 1} 个valueItem元素的span没有title属性`);
          continue;
        }

        // 查找img元素获取图片链接
        const imgElement = div.querySelector('img');
        let skuImageUrl = null;

        if (imgElement) {
          // 尝试多种方式获取图片URL
          let imageUrl = extractImageUrl(imgElement);

          if (imageUrl) {
            // 删除链接尾部的"_90x90q30.jpg_.webp"等尺寸参数
            // 先处理复杂的格式：_90x90q30.jpg_.webp
            imageUrl = imageUrl.replace(/_\d+x\d+q\d+\.(jpg|jpeg|png|webp)_\.(jpg|jpeg|png|webp)$/i, '.$1');
            // 再处理简单的格式：_90x90.jpg
            imageUrl = imageUrl.replace(/_\d+x\d+\.(jpg|jpeg|png|webp)$/i, '.$1');
            // 最后处理单数字格式：_90.jpg
            imageUrl = imageUrl.replace(/_\d+\.(jpg|jpeg|png|webp)$/i, '.$1');
            // 处理可能的双扩展名问题：.jpg.jpg -> .jpg
            imageUrl = imageUrl.replace(/\.(jpg|jpeg|png|webp)\.(jpg|jpeg|png|webp)$/i, '.$1');

            skuImageUrl = imageUrl;
          }
        }else{
          skuImageUrl = mainImages[0];
        }

        // 点击当前valueItem元素
        console.log(`点击第 ${index + 1} 个valueItem元素`);
        div.click();
        
        // 等待页面更新价格信息
        await new Promise(resolve => setTimeout(resolve, 900));
        
        // 采集券后价格
        let price = null;
        try {
          const priceElement = document.querySelector('div[class*="MiniPrice"] span[class*="priceText"]');
          if (priceElement) {
            price = priceElement.textContent.trim();
            console.log(`采集到价格: ${price}`);
          } else {
            console.warn(`第 ${index + 1} 个SKU未找到价格元素`);
          }
        } catch (priceError) {
          console.error(`采集第 ${index + 1} 个SKU价格时出错:`, priceError);
        }

        // 构建SKU数据对象
        const skuItem = {
          skuId: null,
          skuNameCn: skuNameCn,
          skuNameEn: null,
          skuImageUrl: skuImageUrl,
          price: price
        };

        skuData.push(skuItem);
        console.log(`成功采集第 ${skuData.length} 个SKU:`, skuItem);

        // 添加延迟避免过快点击
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        console.error(`处理第 ${index + 1} 个valueItem元素时出错:`, error);
      }
    }

    return skuData;

  } catch (error) {
    console.error('采集SKU数据失败:', error);
    return [];
  }
}

// 检查当前页面是否为天猫商品详情页
function isTmallProductPage() {
  return window.location.hostname.includes('tmall.com') &&
    (window.location.pathname.includes('/item.htm') ||
      window.location.pathname.includes('/detail.htm'));
}

// 页面加载完成后的初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

function initialize() {
  if (isTmallProductPage()) {
    console.log('检测到天猫商品详情页');
    // TODO: 在这里添加页面特定的初始化逻辑
  }
}

// 数字计算气泡功能
let calculationBubble = null;

// 创建计算气泡
function createCalculationBubble(x, y, originalNumber, calculatedResult) {
  // 移除已存在的气泡
  removeCalculationBubble();
  
  // 创建气泡元素
  calculationBubble = document.createElement('div');
  calculationBubble.id = 'tmall-calculation-bubble';
  calculationBubble.style.cssText = `
    position: fixed;
    z-index: 10000;
    background: #333;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
    font-family: Arial, sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    pointer-events: auto;
    max-width: 200px;
    word-wrap: break-word;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    cursor: pointer;
  `;
  
  // 设置气泡内容
  calculationBubble.innerHTML = `
    <div style="margin-bottom: 4px; font-weight: bold;">原数字: ${originalNumber}</div>
    <div style="color: #4CAF50;">计算结果: ${calculatedResult}</div>
    <div style="font-size: 12px; color: #ccc; margin-top: 4px;">(${originalNumber} ÷ 7 × 3)</div>
  `;
  
  // 添加到页面
  document.body.appendChild(calculationBubble);
  
  // 计算气泡位置，避免超出屏幕边界
  const bubbleRect = calculationBubble.getBoundingClientRect();
  let left = x + 10;
  let top = y - bubbleRect.height - 10;
  
  // 检查右边界
  if (left + bubbleRect.width > window.innerWidth) {
    left = x - bubbleRect.width - 10;
  }
  
  // 检查上边界
  if (top < 0) {
    top = y + 20;
  }
  
  // 检查下边界
  if (top + bubbleRect.height > window.innerHeight) {
    top = window.innerHeight - bubbleRect.height - 10;
  }
  
  // 设置最终位置
  calculationBubble.style.left = left + 'px';
  calculationBubble.style.top = top + 'px';
  
  // 显示气泡
  setTimeout(() => {
    if (calculationBubble) {
      calculationBubble.style.opacity = '1';
    }
  }, 10);
}

// 移除计算气泡
function removeCalculationBubble() {
  if (calculationBubble) {
    calculationBubble.style.opacity = '0';
    setTimeout(() => {
      if (calculationBubble && calculationBubble.parentNode) {
        calculationBubble.parentNode.removeChild(calculationBubble);
      }
      calculationBubble = null;
    }, 200);
  }
}

// 检查文本是否为纯数字（包括整数和浮点数）
function isPureNumber(text) {
  const trimmedText = text.trim();
  // 匹配整数和浮点数，包括负数
  const numberRegex = /^-?\d+(\.\d+)?$/;
  return numberRegex.test(trimmedText) && !isNaN(parseFloat(trimmedText));
}

// 计算数字：除以7再乘以3
function calculateNumber(number) {
  return Math.round(number * 0.43);
}

// 处理文本选择事件
let isTextSelecting = false;
function handleTextSelection(event) {
  // 移除之前的气泡
  removeCalculationBubble();
  
  // 获取选中的文本
  const selection = window.getSelection();
  const selectedText = selection.toString();
  
  // 检查是否有选中文本且为纯数字
  if (selectedText && isPureNumber(selectedText)) {
    const number = parseFloat(selectedText.trim());
    const calculatedResult = calculateNumber(number);
    
    // 获取鼠标位置
    const mouseX = event.clientX || event.pageX;
    const mouseY = event.clientY || event.pageY;
    
    // 标记正在选择文本，避免立即被点击事件隐藏
    isTextSelecting = true;
    setTimeout(() => {
      isTextSelecting = false;
    }, 500);
    
    // 创建并显示计算气泡
    createCalculationBubble(mouseX, mouseY, selectedText.trim(), calculatedResult);
  }
}

// 监听鼠标抬起事件（文本选择完成）
document.addEventListener('mouseup', handleTextSelection);

// 监听键盘事件（可能通过键盘选择文本）
document.addEventListener('keyup', function(event) {
  // 检查是否是可能导致文本选择的按键
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || 
      event.key === 'ArrowUp' || event.key === 'ArrowDown' ||
      event.key === 'Shift' || event.ctrlKey || event.metaKey) {
    // 延迟一点检查选择，确保选择已完成
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString();
      
      if (selectedText && isPureNumber(selectedText)) {
        const number = parseFloat(selectedText.trim());
        const calculatedResult = calculateNumber(number);
        
        // 获取选择区域的位置
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top;
        
        createCalculationBubble(centerX, centerY, selectedText.trim(), calculatedResult);
      }
    }, 100);
  }
});

// 点击气泡时隐藏气泡
document.addEventListener('click', function(event) {
  // 如果正在选择文本，不处理点击事件
  if (isTextSelecting) {
    return;
  }
  
  // 如果点击的是气泡本身，则隐藏气泡
  if (calculationBubble && calculationBubble.contains(event.target)) {
    removeCalculationBubble();
  }
});

console.log('数字计算气泡功能已加载');