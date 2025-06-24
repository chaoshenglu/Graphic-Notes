// 图片转换工具类
// 使用Squoosh将图片转换为WebP格式

// 配置 WASM 文件路径
import.meta.env = import.meta.env || {};
import.meta.env.VITE_PUBLIC_PATH = import.meta.env.VITE_PUBLIC_PATH || '';

/**
 * 使用Squoosh将图片转换为WebP格式
 * @param {Blob} blob - 原始图片Blob对象
 * @param {number} quality - 压缩质量 (0-100)
 * @returns {Promise<Blob>} - 转换后的WebP格式Blob对象
 */
export const convertToWebP = async (blob, quality = 95) => {
  try {
    // 动态导入@jsquash/webp，并确保正确加载WASM文件
    const { encode } = await import('@jsquash/webp');
    
    // 将blob转换为ImageData
    const imageData = await blobToImageData(blob);
    
    // 使用Squoosh编码为WebP，使用简化的配置
    const webpArrayBuffer = await encode(imageData, {
      quality: quality,
      // 减少配置参数，使用默认值
      method: 4,
      filter_strength: 60,
      filter_type: 1,
      segments: 4,
      pass: 1,
      alpha_quality: 100,
      lossless: 0
    });
    
    // 将ArrayBuffer转换为Blob
    return new Blob([webpArrayBuffer], { type: 'image/webp' });
  } catch (error) {
    console.error('WebP转换错误详情:', error);
    throw new Error(`Squoosh WebP转换失败: ${error.message}`);
  }
}

/**
 * 将Blob转换为ImageData
 * @param {Blob} blob - 图片Blob对象
 * @returns {Promise<ImageData>} - ImageData对象
 */
export const blobToImageData = async (blob) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    let objectUrl = null
    
    img.onload = () => {
      let { width, height } = img
      
      // 如果图片宽度大于1080px，按比例缩放
      if (width > 1080) {
        const ratio = 1080 / width
        width = 1080
        height = Math.round(height * ratio)
      }
      
      canvas.width = width
      canvas.height = height
      
      // 绘制缩放后的图片
      ctx.drawImage(img, 0, 0, width, height)
      
      const imageData = ctx.getImageData(0, 0, width, height)
      
      // 清理内存
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
      
      resolve(imageData)
    }
    
    img.onerror = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
      reject(new Error('图片加载失败'))
    }
    
    objectUrl = URL.createObjectURL(blob)
    img.src = objectUrl
  })
}