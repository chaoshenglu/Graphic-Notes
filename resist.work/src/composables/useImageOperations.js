import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { convertToWebP } from '../utils/imageConverter.js'
import axios from 'axios'

/**
 * 图片操作相关的组合式函数
 */
export function useImageOperations() {
  const uploading = ref(false)

  /**
   * 下载单张图片并转换为WebP格式
   * @param {string} imageUrl - 图片URL
   * @param {string} filename - 文件名
   */
  const downloadImage = async (imageUrl, filename) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const webpBlob = await convertToWebP(blob, 95)
      const webpFilename = filename.replace(/\.[^.]+$/, '.webp')
      const url = window.URL.createObjectURL(webpBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = webpFilename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('下载图片失败:', error)
      throw error
    }
  }

  /**
   * 下载视频文件
   * @param {string} videoUrl - 视频URL
   * @param {string} productId - 产品ID
   */
  const downloadVideo = async (videoUrl, productId) => {
    if (!videoUrl) {
      return
    }

    try {
      // 显示下载提示
      const loadingToast = document.createElement('div')
      loadingToast.textContent = '正在下载视频...'
      loadingToast.style.cssText = 'position:fixed;top:20px;right:20px;background:#333;color:white;padding:10px;border-radius:5px;z-index:9999'
      document.body.appendChild(loadingToast)

      // 获取视频文件
      const response = await fetch(videoUrl)
      if (!response.ok) {
        throw new Error('下载失败')
      }

      const blob = await response.blob()

      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${productId}`

      // 触发下载
      document.body.appendChild(a)
      a.click()

      // 清理
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      document.body.removeChild(loadingToast)

    } catch (error) {
      console.error('下载视频失败:', error)
      alert('下载视频失败，请检查网络连接或视频链接是否有效')
    }
  }

  /**
   * 下载所有主图
   * @param {Object} productData - 产品数据
   */
  const downloadAllMainImages = async (productData) => {
    // 先下载视频（如果有）
    if (productData?.video_url) {
      await downloadVideo(productData.video_url, productData.product_id)
    }

    const mainImages = productData?.main_images_cn
    if (!mainImages || mainImages.length === 0) {
      ElMessage.warning('暂无主图可下载')
      return
    }

    try {
      ElMessage.info('开始下载主图，请稍候...')
      for (let i = 0; i < mainImages.length; i++) {
        const imageUrl = mainImages[i]
        const filename = `${productData.product_id}_${i + 1}.jpg`
        await downloadImage(imageUrl, filename)
        if (i < mainImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      ElMessage.success(`成功下载 ${mainImages.length} 张主图`)
    } catch (error) {
      ElMessage.error('下载失败：' + error.message)
    }
  }

  /**
   * 下载所有SKU图片
   * @param {Object} productData - 产品数据
   */
  const downloadAllSkuImages = async (productData) => {
    const skuData = productData?.sku_data
    if (!skuData || skuData.length === 0) {
      ElMessage.warning('暂无SKU图片可下载')
      return
    }

    try {
      ElMessage.info('开始下载SKU图片，请稍候...')
      for (let i = 0; i < skuData.length; i++) {
        const sku = skuData[i]
        if (sku.skuImageUrl) {
          const filename = `${i + 1}.【${sku.skuNameEn}】${sku.price_en}.jpg`
          await downloadImage(sku.skuImageUrl, filename)
          if (i < skuData.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
      }
      const validSkuCount = skuData.filter(sku => sku.skuImageUrl).length
      ElMessage.success(`成功下载 ${validSkuCount} 张SKU图片`)
    } catch (error) {
      ElMessage.error('下载失败：' + error.message)
    }
  }

  /**
   * 同步图片到Cloudflare R2
   * @param {Object} productData - 产品数据
   * @param {Function} updateProductHtml - 更新产品HTML的回调函数
   */
  const syncImagesToCloudflare = async (productData, updateProductHtml) => {
    const detailImages = productData?.detail_images_cn
    if (!detailImages || detailImages.length === 0) {
      ElMessage.warning('暂无详情图片可同步')
      return
    }

    try {
      uploading.value = true
      ElMessage.info(`开始同步 ${detailImages.length} 张详情图片到Cloudflare（使用Squoosh转换为WebP格式），请稍候...`)
      const uploadedUrls = []

      for (let i = 0; i < detailImages.length; i++) {
        const imageUrl = detailImages[i]
        try {
          const response = await fetch(imageUrl)
          if (!response.ok) {
            throw new Error(`获取图片失败: ${response.statusText}`)
          }

          const blob = await response.blob()
          ElMessage.info(`正在使用Squoosh转换第 ${i + 1} 张图片为WebP格式...`)
          const webpBlob = await convertToWebP(blob)

          const formData = new FormData()
          const filename = `${productData.product_id}/detail/${i + 1}.webp`
          const file = new File([webpBlob], filename, { type: 'image/webp' })
          formData.append('file', file)

          const uploadResponse = await axios.post(`${window.lx_host}/upload-to-r2`, formData, {
            headers: {}
          })

          if (uploadResponse.data.success) {
            uploadedUrls.push(uploadResponse.data.url)
            ElMessage.success(`第 ${i + 1} 张图片已通过Squoosh转换为WebP格式并上传成功`)
          } else {
            throw new Error(uploadResponse.data.message || '上传失败')
          }

          if (i < detailImages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        } catch (error) {
          console.error(`上传第 ${i + 1} 张图片失败:`, error)
          ElMessage.error(`第 ${i + 1} 张图片上传失败: ${error.message}`)
        }
      }

      if (uploadedUrls.length > 0) {
        ElMessage.success(`成功使用Squoosh将 ${uploadedUrls.length} 张图片转换为WebP格式并同步到Cloudflare R2`)
        if (updateProductHtml) {
          await updateProductHtml()
        }
      } else {
        ElMessage.error('没有图片上传成功')
      }
    } catch (error) {
      console.error('同步图片失败:', error)
      ElMessage.error('同步失败：' + error.message)
    } finally {
      uploading.value = false
    }
  }

  /**
   * 预览图片
   * @param {string} imageUrl - 图片URL
   * @param {Function} setPreviewData - 设置预览数据的回调函数
   */
  const previewImage = (imageUrl, setPreviewData) => {
    if (setPreviewData) {
      setPreviewData(imageUrl, true)
    }
  }

  return {
    uploading,
    downloadImage,
    downloadVideo,
    downloadAllMainImages,
    downloadAllSkuImages,
    syncImagesToCloudflare,
    previewImage
  }
}