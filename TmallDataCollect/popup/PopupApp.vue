<template>
  <div class="popup-container">
    <div class="header">
      <h2>天猫数据采集器</h2>
    </div>
    <div class="content">
      <div class="status" :class="statusClass">
        {{ statusText }}
      </div>
      <div class="flex flex-row">
        <button class="collect-btn" style="margin-right: 10px;" @click="lightCollect">
        简单采集
        </button>
        <button class="collect-btn" style="margin-left: 10px;" @click="handleCollect" :disabled="isCollecting">
        {{ isCollecting ? '采集中...' : '完整采集' }}
      </button>
      </div>

      <!-- 数据显示区域 -->
      <div v-if="productData" class="data-display">
        <textarea class="data-textarea" :value="formatProductData" readonly rows="30"></textarea>
        <div style="display: flex;flex-direction: row;align-items: center;">
          <button class="copy-btn" @click="updateDetailImages">detail_img</button>
          <button class="copy-btn" @click="updateSku">sku</button>
          <button class="copy-btn" @click="updateVideoUrl">video</button>
          <button class="copy-btn" @click="uploadData">add</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

export default {
  name: 'PopupApp',
  setup() {
    const isCollecting = ref(false)
    const statusText = ref('准备就绪')
    const statusClass = ref('ready')
    const productData = ref(null)

    // 新增：从localStorage获取数据的函数
    const getDataFromLocalStorage = (productId) => {
      try {
        const key = `tmall_product_${productId}`
        const storedData = localStorage.getItem(key)
        return storedData ? JSON.parse(storedData) : null
      } catch (error) {
        console.error('从localStorage读取数据失败:', error)
        return null
      }
    }

    // 新增：保存数据到localStorage的函数
    const saveDataToLocalStorage = (data) => {
      try {
        const key = `tmall_product_${data.product_id}`
        localStorage.setItem(key, JSON.stringify(data))
        console.log('数据已保存到localStorage:', key)
      } catch (error) {
        console.error('保存数据到localStorage失败:', error)
      }
    }

    // 新增：获取当前页面商品ID的函数
    const getCurrentProductId = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab.url.includes('tmall.com')) {
          return null
        }

        // 从URL中提取商品ID
        const urlMatch = tab.url.match(/id=(\d+)/)
        if (urlMatch) {
          return urlMatch[1]
        }

        // 如果URL中没有ID，尝试从页面获取
        return new Promise((resolve) => {
          chrome.tabs.sendMessage(tab.id, { action: 'getProductId' }, (response) => {
            if (chrome.runtime.lastError) {
              resolve(null)
            } else {
              resolve(response?.productId || null)
            }
          })
        })
      } catch (error) {
        console.error('获取商品ID失败:', error)
        return null
      }
    }

    // 新增：初始化时尝试加载已保存的数据
    const loadSavedData = async () => {
      const productId = await getCurrentProductId()
      if (productId) {
        const savedData = getDataFromLocalStorage(productId)
        if (savedData) {
          productData.value = savedData
          statusText.value = '已加载保存的数据'
          statusClass.value = 'success'

          // 3秒后重置状态文本
          setTimeout(() => {
            statusText.value = '准备就绪'
            statusClass.value = 'ready'
          }, 3000)
        }
      }
    }

    // 组件挂载时加载保存的数据
    onMounted(() => {
      loadSavedData()
    })

    const lightCollect = async () => {
      try {
        isCollecting.value = true
        statusText.value = '正在简单采集...'
        statusClass.value = 'collecting'
        productData.value = null // 清空之前的数据

        // 检查当前标签页是否为天猫页面
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab.url.includes('tmall.com')) {
          throw new Error('请在天猫商品详情页使用此扩展')
        }

        // 发送消息给content script进行简单数据采集
        const result = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('采集超时，请确保页面已完全加载'))
          }, 30000)

          chrome.tabs.sendMessage(tab.id, { action: 'lightCollectData' }, (response) => {
            clearTimeout(timeout)
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message))
            } else if (response) {
              resolve(response)
            } else {
              reject(new Error('未收到响应，请刷新页面后重试'))
            }
          })
        })

        if (result && result.success) {
          if (result.data) {
            const { productId, title, mainImages } = result.data
            
            // 查询数据库中是否已存在此商品
            statusText.value = '正在查询数据库...'
            try {
              const checkResponse = await axios.get(`https://api.tiffanylamps.com.cn/products/${productId}`)
              
              if (checkResponse.data.success && checkResponse.data.data) {
                // 商品已存在，更新标题和主图
                statusText.value = '商品已存在，正在更新...'
                const updateData = {
                  title_cn: title,
                  main_images_cn: mainImages
                }
                const updateResponse = await axios.put(`https://api.tiffanylamps.com.cn/products/${productId}`, updateData)
                
                if (updateResponse.data.success) {
                  statusText.value = '商品更新成功！'
                  statusClass.value = 'success'
                } else {
                  throw new Error(updateResponse.data.message || '更新失败')
                }
              } else {
                // 商品不存在，创建新商品
                statusText.value = '商品不存在，正在创建...'
                const createData = {
                  product_id: productId,
                  title_cn: title,
                  main_images_cn: mainImages
                }
                const createResponse = await axios.post('https://api.tiffanylamps.com.cn/products', createData)
                
                if (createResponse.data.success) {
                  statusText.value = '商品创建成功！'
                  statusClass.value = 'success'
                } else {
                  throw new Error(createResponse.data.message || '创建失败')
                }
              }
            } catch (apiError) {
              if (apiError.response && apiError.response.status === 404) {
                // 商品不存在，创建新商品
                statusText.value = '商品不存在，正在创建...'
                const createData = {
                  product_id: productId,
                  title_cn: title,
                  main_images_cn: mainImages
                }
                const createResponse = await axios.post('https://api.tiffanylamps.com.cn/products', createData)
                
                if (createResponse.data.success) {
                  statusText.value = '商品创建成功！'
                  statusClass.value = 'success'
                } else {
                  throw new Error(createResponse.data.message || '创建失败')
                }
              } else {
                throw apiError
              }
            }
            
            // 构建简单的商品数据用于显示
            const collectedData = {
              product_id: productId,
              title_cn: title,
              main_images_cn: mainImages,
              detail_images_cn: [],
              param_info_cn: '',
              video_url: '',
              sku_data: []
            }
            
            productData.value = collectedData
            saveDataToLocalStorage(collectedData)
          } else {
            statusText.value = '用户取消采集'
            statusClass.value = 'ready'
          }
        } else {
          throw new Error(result?.error || '采集失败')
        }
      } catch (error) {
        console.error('简单采集过程中出现错误:', error)
        let errorMessage = error.message
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message
        }
        statusText.value = `简单采集失败: ${errorMessage}`
        statusClass.value = 'ready'
        productData.value = null
      } finally {
        isCollecting.value = false
        // 3秒后重置状态（但保留数据显示）
        setTimeout(() => {
          if (statusText.value.includes('成功') || statusText.value.includes('用户取消采集')) {
            statusText.value = '准备就绪'
            statusClass.value = 'ready'
          }
        }, 3000)
      }
    }

    const uploadData = async () => {
      try {
        statusText.value = '正在上传...'
        statusClass.value = 'collecting'
        
        const response = await axios.post('https://api.tiffanylamps.com.cn/products', productData.value)
        const { data } = response
        
        if (data.success) {
          statusText.value = '上传成功'
          statusClass.value = 'success'
        } else {
          statusText.value = `上传失败：${data.message}`
          statusClass.value = 'ready'
        }
      } catch (error) {
        console.error('上传失败:', error)
        let errorMessage = '网络错误'
        
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }
        
        statusText.value = `上传失败：${errorMessage}`
        statusClass.value = 'ready'
      } finally {
        // 3秒后重置状态文本
        setTimeout(() => {
          if (statusText.value.includes('上传成功') || statusText.value.includes('上传失败')) {
            statusText.value = '准备就绪'
            statusClass.value = 'ready'
          }
        }, 3000)
      }
    }

    // 新增：格式化商品数据用于显示
    const formatProductData = computed(() => {
      if (!productData.value) return ''
      return JSON.stringify(productData.value, null, 2)
    })

    const updateDetailImages = async () => {
      if (!productData.value || !productData.value.product_id) {
        statusText.value = '没有可更新的商品数据'
        statusClass.value = 'ready'
        return
      }

      try {
        statusText.value = '正在更新细节图...'
        statusClass.value = 'collecting'
        const productId = productData.value.product_id
        const update_data = {
          detail_images_cn:productData.value.detail_images_cn
        }
        const response = await axios.put(`https://api.tiffanylamps.com.cn/products/${productId}`, update_data)
        const { data } = response
        if (data.success) {
          statusText.value = '细节图更新成功'
          statusClass.value = 'success'
        } else {
          statusText.value = `细节图失败：${data.message || '未知错误'}`
          statusClass.value = 'ready'
        }
      } catch (error) {
        console.error('细节图更新失败:', error)
        let errorMessage = '网络错误'
        
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }
        
        statusText.value = `细节图更新失败：${errorMessage}`
        statusClass.value = 'ready'
      } finally {
        // 3秒后重置状态文本
        setTimeout(() => {
          if (statusText.value.includes('细节图更新成功') || statusText.value.includes('细节图更新失败')) {
            statusText.value = '准备就绪'
            statusClass.value = 'ready'
          }
        }, 3000)
      }
    }

    // 辅助函数：清理class名称
    const cleanupClassNames = (element) => {
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

    const handleCollect = async () => {
      try {
        isCollecting.value = true
        statusText.value = '正在采集数据...'
        statusClass.value = 'collecting'
        productData.value = null // 清空之前的数据

        // 检查当前标签页是否为天猫页面
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab.url.includes('tmall.com')) {
          throw new Error('请在天猫商品详情页使用此扩展')
        }

        // 发送消息给content script进行数据采集
        const result = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('采集超时，请确保页面已完全加载'))
          }, 150000)

          chrome.tabs.sendMessage(tab.id, { action: 'collectData' }, (response) => {
            clearTimeout(timeout)
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message))
            } else if (response) {
              resolve(response)
            } else {
              reject(new Error('未收到响应，请刷新页面后重试'))
            }
          })
        })

        if (result && result.success) {
          if (result.data) {
            // 构建商品JSON
            const collectedData = {
              product_id: result.data.productId,
              title_cn: result.data.title,
              detail_images_cn: result.data.detailImages,
              main_images_cn: result.data.mainImages,
              param_info_cn: result.data.htmlContent,
              video_url: result.data.video_url,
              sku_data: result.data.skuData || []
            }

            // 保存到localStorage
            saveDataToLocalStorage(collectedData)

            productData.value = collectedData
            statusText.value = '采集完成！'
            statusClass.value = 'success'
          } else {
            statusText.value = '用户取消采集'
            statusClass.value = 'ready'
          }
        } else {
          throw new Error(result?.error || '采集失败')
        }
      } catch (error) {
        console.error('采集过程中出现错误:', error)
        statusText.value = `采集失败: ${error.message}`
        statusClass.value = 'ready'
        productData.value = null
      } finally {
        isCollecting.value = false
        // 3秒后重置状态（但保留数据显示）
        setTimeout(() => {
          if (statusText.value.includes('采集完成') || statusText.value.includes('复制') || statusText.value.includes('用户取消采集')) {
            statusText.value = '准备就绪'
            statusClass.value = 'ready'
          }
        }, 3000)
      }
    }

    const updateVideoUrl = async () => {
      if (!productData.value || !productData.value.product_id) {
        statusText.value = '没有可更新的商品数据'
        statusClass.value = 'ready'
        return
      }

      try {
        statusText.value = '正在采集视频URL...'
        statusClass.value = 'collecting'
        
        // 检查当前标签页是否为天猫页面
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab.url.includes('tmall.com')) {
          throw new Error('请在天猫商品详情页使用此功能')
        }

        // 调用content script采集视频URL
        const videoResult = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('视频采集超时'))
          }, 10000)

          chrome.tabs.sendMessage(tab.id, { action: 'collectVideo' }, (response) => {
            clearTimeout(timeout)
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message))
            } else {
              resolve(response)
            }
          })
        })

        // 更新productData中的video_url
        if (videoResult && videoResult.video_url) {
          productData.value.video_url = videoResult.video_url
          statusText.value = '正在更新video_url到服务器...'
        } else {
          statusText.value = '未采集到视频URL，使用现有数据更新...'
        }

        const productId = productData.value.product_id
        const updateData = {
          video_url: productData.value.video_url || ''
        }
        const response = await axios.put(`https://api.tiffanylamps.com.cn/products/${productId}`, updateData)
        const { data } = response
        if (data.success) {
          statusText.value = 'video_url更新成功'
          statusClass.value = 'success'
          saveDataToLocalStorage(productData.value)
        } else {
          statusText.value = `video_url更新失败：${data.message || '未知错误'}`
          statusClass.value = 'ready'
        }
      } catch (error) {
        console.error('video_url更新失败:', error)
        let errorMessage = '网络错误'
        
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }
        
        statusText.value = `video_url更新失败：${errorMessage}`
        statusClass.value = 'ready'
      } finally {
        // 3秒后重置状态文本
        setTimeout(() => {
          if (statusText.value.includes('video_url更新成功') || statusText.value.includes('video_url更新失败')) {
            statusText.value = '准备就绪'
            statusClass.value = 'ready'
          }
        }, 3000)
      }
    }

    const updateSku = async () => {
      if (!productData.value || !productData.value.product_id) {
        statusText.value = '没有可更新的商品数据'
        statusClass.value = 'ready'
        return
      }

      try {
        statusText.value = '正在更新SKU数据...'
        statusClass.value = 'collecting'
        const productId = productData.value.product_id
        const updateData = {
          sku_data: productData.value.sku_data || []
        }
        const response = await axios.put(`https://api.tiffanylamps.com.cn/products/${productId}`, updateData)
        const { data } = response
        if (data.success) {
          statusText.value = 'SKU数据更新成功'
          statusClass.value = 'success'
          saveDataToLocalStorage(productData.value)
        } else {
          statusText.value = `SKU更新失败：${data.message || '未知错误'}`
          statusClass.value = 'ready'
        }
      } catch (error) {
        console.error('SKU更新失败:', error)
        let errorMessage = '网络错误'
        
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }
        
        statusText.value = `SKU更新失败：${errorMessage}`
        statusClass.value = 'ready'
      } finally {
        // 3秒后重置状态文本
        setTimeout(() => {
          if (statusText.value.includes('SKU数据更新成功') || statusText.value.includes('SKU更新失败')) {
            statusText.value = '准备就绪'
            statusClass.value = 'ready'
          }
        }, 3000)
      }
    }
    
    return {
      isCollecting,
      statusText,
      statusClass,
      productData,
      formatProductData,
      handleCollect,
      lightCollect,
      uploadData,
      updateSku,
      updateDetailImages,
      updateVideoUrl
    }
  }
}
</script>

<style scoped>
.popup-container {
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.status {
  padding: 2px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  min-width: 100px;
}

.status.ready {
  color: #28a745;
}

.status.collecting {
  color: #ffc107;
}

.status.success {
  color: #28a745;
}

.collect-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100px;
}

.collect-btn:hover:not(:disabled) {
  background: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.collect-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.collect-btn:active:not(:disabled) {
  transform: translateY(0);
}

.data-display {
  width: 100%;
  height: 100%;
  max-width: 400px;
  margin-top: 0px;
}

.data-display h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.data-textarea {
  width: 100%;
  height: 350px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  padding: 8px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  line-height: 1.4;
  resize: vertical;
  box-sizing: border-box;
}

.copy-btn {
  width: 100%;
  background: rgba(40, 167, 69, 0.9);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.3s ease;
}

.copy-btn:hover {
  background: rgba(40, 167, 69, 1);
  transform: translateY(-1px);
}

.copy-btn:active {
  transform: translateY(0);
}
</style>