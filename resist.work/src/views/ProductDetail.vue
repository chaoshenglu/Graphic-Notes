<template>
  <div class="product-detail">
    <div class="product-titles">
      <h1 class="title-cn">{{ productData?.title_cn || 'No Chinese Title' }}</h1>
      <div class="title-en-container">
        <h2 class="title-en">{{ productData?.title_en || 'No English Title' }}</h2>
        <div class="title-actions">
          <el-button 
            type="primary" 
            :icon="Edit" 
            size="small" 
            circle 
            @click="editTitleEn"
            title="编辑英文标题"
          />
          <el-button 
            type="success" 
            :icon="CopyDocument" 
            size="small" 
            circle 
            @click="copyTitleEn"
            title="复制英文标题"
          />
        </div>
      </div>
    </div>
    <div class="product-ids">
      <div class="id-item">
        <span class="id-label">Product ID:</span>
        <span class="id-value">{{ productData?.product_id || 'N/A' }}</span>
      </div>
      <div class="id-item">
        <span class="id-label">Shopify ID:</span>
        <div class="id-value-container">
          <span class="id-value">{{ productData?.shopify_id || 'N/A' }}</span>
          <div class="id-actions">
            <el-button 
              type="primary" 
              :icon="Edit" 
              size="small" 
              circle 
              @click="editShopifyId"
              title="编辑Shopify ID"
            />
            <el-button 
              type="success" 
              :icon="CopyDocument" 
              size="small" 
              circle 
              @click="copyShopifyId"
              title="复制Shopify ID"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="main-images-section">
      <div class="section-header">
        <h3 class="section-title">主图</h3>
        <el-button 
          type="primary" 
          :icon="Download" 
          size="small" 
          circle 
          @click="downloadAllMainImages"
          title="下载全部主图"
          :disabled="!productData?.main_images_cn?.length"
        />
      </div>
      <div class="main-images-container">
        <div 
          v-for="(image, index) in productData?.main_images_cn || []" 
          :key="index" 
          class="main-image-item"
        >
          <img :src="image" :alt="`主图 ${index + 1}`" />
        </div>
        <div v-if="!productData?.main_images_cn?.length" class="no-images">
          暂无主图
        </div>
      </div>
    </div>
    <div class="sku-section">
      <div class="section-header">
        <h3 class="section-title">规格选择</h3>
        <el-button 
          type="primary" 
          :icon="Download" 
          size="small" 
          circle 
          @click="downloadAllSkuImages"
          title="下载全部SKU图片"
          :disabled="!productData?.sku_data?.length"
        />
      </div>
      <div class="sku-container">
        <div 
          v-for="(sku, index) in productData?.sku_data || []" 
          :key="index" 
          class="sku-item"
          @click="openSkuEditModal(sku, index)"
        >
          <div class="sku-image">
            <img :src="sku.skuImageUrl" :alt="sku.skuNameCn" />
          </div>
          <div class="sku-info">
            <div class="sku-name-cn">{{ sku.skuNameCn }}</div>
            <div class="sku-name-en">{{ sku.skuNameEn || 'No English Name' }}</div>
            <div class="sku-price">{{ sku.price ? `¥${sku.price}` : '价格待定' }}</div>
          </div>
          <div class="sku-edit-hint">
            <el-icon><Edit /></el-icon>
            <span>点击编辑</span>
          </div>
        </div>
        <div v-if="!productData?.sku_data?.length" class="no-sku">
          暂无规格信息
        </div>
      </div>
    </div>
    <div class="detail-images-section">
      <div class="detail-section-header">
        <h3 class="section-title">详情图片</h3>
        <el-button type="primary" @click="syncImagesToCloudflare" :loading="uploading">同步图片到Cloudflare</el-button>
      </div>
      <div class="detail-images-container">
        <div 
          v-for="(image, index) in productData?.detail_images_cn || []" 
          :key="index" 
          class="detail-image-item"
        >
          <img :src="image" :alt="`详情图 ${index + 1}`" />
          <div class="detail-image-actions">
            <el-button
              type="primary"
              :icon="ZoomIn"
              circle
              size="small"
              @click.stop="previewImage(image)"
              title="放大预览"
            />
            <el-button
              type="danger"
              :icon="Delete"
              circle
              size="small"
              @click.stop="confirmDeleteImage(index)"
              title="删除图片"
            />
          </div>
        </div>
        <div v-if="!productData?.detail_images_cn?.length" class="no-images">
          暂无详情图片
        </div>
      </div>
    </div>
    <div class="param-section">
      <div v-html="productData?.param_info_cn || '<p>暂无参数信息</p>'"></div>
    </div>
    
    <!-- SKU编辑弹窗 -->
    <SkuEditModal
      v-model="showSkuEditModal"
      :sku-data="currentEditingSku"
      :product-id="route.params.id"
      :sku-index="currentSkuIndex"
      @save-success="handleSkuSaveSuccess"
    />
    
    <!-- 图片预览弹窗 -->
    <el-dialog
      v-model="showImagePreview"
      title="图片预览"
      width="80%"
      :center="true"
      class="image-preview-dialog"
    >
      <div class="image-preview-container">
        <img 
          :src="previewImageUrl" 
          alt="预览图片"
          class="preview-image"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Edit, CopyDocument, ZoomIn, Delete, Download } from '@element-plus/icons-vue'
import SkuEditModal from '../components/SkuEditModal.vue'
const route = useRoute()
const productData = ref(null)
const loading = ref(false)
const error = ref(null)
const uploading = ref(false)

// SKU编辑相关状态
const showSkuEditModal = ref(false)
const currentEditingSku = ref(null)
const currentSkuIndex = ref(-1)

// 图片预览相关状态
const showImagePreview = ref(false)
const previewImageUrl = ref('')

// 获取产品详情
const fetchProductDetail = async (productId) => {
  try {
    loading.value = true
    const response = await axios.get(`${window.lx_host}/products/${productId}`)
    productData.value = response.data.data
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// 编辑英文标题
const editTitleEn = async () => {
  try {
    const { value } = await ElMessageBox.prompt(
      '请输入新的英文标题',
      '编辑英文标题',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputValue: productData.value?.title_en || '',
        inputPlaceholder: '请输入英文标题'
      }
    )
    
    if (value && value.trim()) {
      await updateProductTitle(value.trim())
    }
  } catch (error) {
    // 用户取消操作
  }
}

// 复制英文标题
const copyTitleEn = async () => {
  const titleEn = productData.value?.title_en
  if (!titleEn) {
    ElMessage.warning('暂无英文标题可复制')
    return
  }
  
  try {
    await navigator.clipboard.writeText(titleEn)
    ElMessage.success('英文标题已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  }
}

// 更新产品标题
const updateProductTitle = async (newTitleEn) => {
  try {
    const productId = route.params.id
    const updateData = {
      ...productData.value,
      title_en: newTitleEn
    }
    
    await axios.put(`${window.lx_host}/products/${productId}`, updateData)
    
    // 更新本地数据
    productData.value.title_en = newTitleEn
    ElMessage.success('英文标题更新成功')
  } catch (error) {
    ElMessage.error('更新失败：' + (error.response?.data?.message || error.message))
  }
}

// 编辑Shopify ID
const editShopifyId = async () => {
  try {
    const { value } = await ElMessageBox.prompt(
      '请输入新的Shopify ID',
      '编辑Shopify ID',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputValue: productData.value?.shopify_id || '',
        inputPlaceholder: '请输入Shopify ID'
      }
    )
    
    if (value && value.trim()) {
      await updateShopifyId(value.trim())
    }
  } catch (error) {
    // 用户取消操作
  }
}

// 复制Shopify ID
const copyShopifyId = async () => {
  const shopifyId = productData.value?.shopify_id
  if (!shopifyId || shopifyId === 'N/A') {
    ElMessage.warning('暂无Shopify ID可复制')
    return
  }
  
  try {
    await navigator.clipboard.writeText(shopifyId)
    ElMessage.success('Shopify ID已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  }
}

// 更新Shopify ID
const updateShopifyId = async (newShopifyId) => {
  try {
    const productId = route.params.id
    const updateData = {
      ...productData.value,
      shopify_id: newShopifyId
    }
    
    await axios.put(`${window.lx_host}/products/${productId}`, updateData)
    
    // 更新本地数据
    productData.value.shopify_id = newShopifyId
    ElMessage.success('Shopify ID更新成功')
  } catch (error) {
    ElMessage.error('更新失败：' + (error.response?.data?.message || error.message))
  }
}

// 打开SKU编辑弹窗
const openSkuEditModal = (sku, index) => {
  currentEditingSku.value = { ...sku }
  currentSkuIndex.value = index
  showSkuEditModal.value = true
}

// 处理SKU保存成功
const handleSkuSaveSuccess = (result) => {
  // 更新本地数据
  if (productData.value && productData.value.sku_data && productData.value.sku_data[result.index]) {
    Object.assign(productData.value.sku_data[result.index], result.data)
  }
}

// 预览图片
const previewImage = (imageUrl) => {
  previewImageUrl.value = imageUrl
  showImagePreview.value = true
}

// 确认删除图片
const confirmDeleteImage = async (index) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这张详情图片吗？',
      '删除确认',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteDetailImage(index)
  } catch (error) {
    // 用户取消操作
  }
}

// 删除详情图片
const deleteDetailImage = async (index) => {
  try {
    const productId = route.params.id
    
    // 创建新的详情图片数组，移除指定索引的图片
    const newDetailImages = [...(productData.value?.detail_images_cn || [])]
    newDetailImages.splice(index, 1)
    
    // 构建更新数据
    const updateData = {
      ...productData.value,
      detail_images_cn: newDetailImages
    }
    
    await axios.put(`${window.lx_host}/products/${productId}`, updateData)
    
    // 更新本地数据
    productData.value.detail_images_cn = newDetailImages
    ElMessage.success('图片删除成功')
  } catch (error) {
    ElMessage.error('删除失败：' + (error.response?.data?.message || error.message))
  }
}

// 下载单张图片
const downloadImage = async (imageUrl, filename) => {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('下载图片失败:', error)
    throw error
  }
}

// 下载全部主图
const downloadAllMainImages = async () => {
  const mainImages = productData.value?.main_images_cn
  if (!mainImages || mainImages.length === 0) {
    ElMessage.warning('暂无主图可下载')
    return
  }
  
  try {
    ElMessage.info('开始下载主图，请稍候...')
    
    for (let i = 0; i < mainImages.length; i++) {
      const imageUrl = mainImages[i]
      const filename = `主图_${i + 1}.jpg`
      await downloadImage(imageUrl, filename)
      
      // 添加延迟避免浏览器阻止多个下载
      if (i < mainImages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    ElMessage.success(`成功下载 ${mainImages.length} 张主图`)
  } catch (error) {
    ElMessage.error('下载失败：' + error.message)
  }
}

// 下载全部SKU图片
const downloadAllSkuImages = async () => {
  const skuData = productData.value?.sku_data
  if (!skuData || skuData.length === 0) {
    ElMessage.warning('暂无SKU图片可下载')
    return
  }
  
  try {
    ElMessage.info('开始下载SKU图片，请稍候...')
    
    for (let i = 0; i < skuData.length; i++) {
      const sku = skuData[i]
      if (sku.skuImageUrl) {
        const filename = `SKU_${sku.skuNameCn || `规格${i + 1}`}.jpg`
        await downloadImage(sku.skuImageUrl, filename)
        
        // 添加延迟避免浏览器阻止多个下载
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

// 同步图片到Cloudflare
const syncImagesToCloudflare = async () => {
  const detailImages = productData.value?.detail_images_cn
  if (!detailImages || detailImages.length === 0) {
    ElMessage.warning('暂无详情图片可同步')
    return
  }
  
  try {
    uploading.value = true
    ElMessage.info(`开始同步 ${detailImages.length} 张详情图片到Cloudflare，请稍候...`)
    
    const uploadedUrls = []
    
    for (let i = 0; i < detailImages.length; i++) {
      const imageUrl = detailImages[i]
      
      try {
        // 获取图片数据
        const response = await fetch(imageUrl)
        if (!response.ok) {
          throw new Error(`获取图片失败: ${response.statusText}`)
        }
        
        const blob = await response.blob()
        
        // 创建FormData
        const formData = new FormData()
        const filename = `detail_image_${Date.now()}_${i + 1}.jpg`
        
        // 创建File对象
        const file = new File([blob], filename, { type: blob.type || 'image/jpeg' })
        formData.append('file', file)
        
        // 上传到Cloudflare R2
        const uploadResponse = await axios.post(`${window.lx_host}/upload-to-r2`, formData, {
          headers: {
            // 不设置Content-Type，让浏览器自动设置multipart/form-data边界
          }
        })
        
        if (uploadResponse.data.success) {
          uploadedUrls.push(uploadResponse.data.url)
          ElMessage.success(`第 ${i + 1} 张图片上传成功`)
        } else {
          throw new Error(uploadResponse.data.message || '上传失败')
        }
        
        // 添加延迟避免请求过于频繁
        if (i < detailImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
      } catch (error) {
        console.error(`上传第 ${i + 1} 张图片失败:`, error)
        ElMessage.error(`第 ${i + 1} 张图片上传失败: ${error.message}`)
      }
    }
    
    if (uploadedUrls.length > 0) {
      ElMessage.success(`成功同步 ${uploadedUrls.length} 张图片到Cloudflare R2`)
      console.log('上传成功的图片URLs:', uploadedUrls)
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

onMounted(() => {
  const productId = route.params.id
  fetchProductDetail(productId)
})
</script>

<style scoped>
.product-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.product-ids {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.id-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.id-label {
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.id-value {
  color: #007bff;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  background: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.id-value-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.id-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.id-actions .el-button {
  transition: all 0.3s ease;
}

.id-actions .el-button:hover {
  transform: scale(1.1);
}

/* Product Titles Section */
.product-titles {
  margin-bottom: 30px;
  text-align: center;
}

.title-cn {
  font-size: 28px;
  font-weight: 700;
  color: #212529;
  margin: 0 0 10px 0;
  line-height: 1.3;
}

.title-en-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.title-en {
  font-size: 20px;
  font-weight: 400;
  color: #6c757d;
  margin: 0;
  line-height: 1.4;
}

.title-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.title-actions .el-button {
  transition: all 0.3s ease;
}

.title-actions .el-button:hover {
  transform: scale(1.1);
}

/* Section Titles */
.section-title {
  font-size: 22px;
  font-weight: 600;
  color: #11192d;
  margin: 30px 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #007bff;
  display: inline-block;
}

/* Main Images Section */
.main-images-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-header .section-title {
  margin: 0;
  margin-bottom: 0;
}

.section-header .el-button {
  transition: all 0.3s ease;
}

.section-header .el-button:hover:not(:disabled) {
  transform: scale(1.1);
}

.detail-section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
}

.detail-section-header .section-title {
  margin: 0;
  margin-bottom: 0;
}

.main-images-container {
  display: flex;
  gap: 15px;
  overflow-x: auto;
  padding: 10px 0;
  scrollbar-width: thin;
  scrollbar-color: #007bff #f1f3f4;
}

.main-images-container::-webkit-scrollbar {
  height: 8px;
}

.main-images-container::-webkit-scrollbar-track {
  background: #f1f3f4;
  border-radius: 4px;
}

.main-images-container::-webkit-scrollbar-thumb {
  background: #007bff;
  border-radius: 4px;
}

.main-image-item {
  flex: 0 0 auto;
  width: 200px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.main-image-item:hover {
  transform: translateY(-5px);
}

.main-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* SKU Section */
.sku-section {
  margin-bottom: 40px;
}

.sku-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 15px 0;
  scrollbar-width: thin;
  scrollbar-color: #007bff #f1f3f4;
}

.sku-container::-webkit-scrollbar {
  height: 8px;
}

.sku-container::-webkit-scrollbar-track {
  background: #f1f3f4;
  border-radius: 4px;
}

.sku-container::-webkit-scrollbar-thumb {
  background: #007bff;
  border-radius: 4px;
}

.sku-item {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 200px;
  background: #fff;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.sku-item:hover {
  border-color: #007bff;
  box-shadow: 0 6px 20px rgba(0, 123, 255, 0.15);
  transform: translateY(-3px);
}

.sku-item:hover .sku-edit-hint {
  opacity: 1;
  transform: translateY(0);
}

.sku-image {
  width: 100%;
  height: 190px;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.sku-image img {
  width: 70%;
  height: 70%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.sku-item:hover .sku-image img {
  transform: scale(1.05);
}

.sku-info {
  padding: 12px;
}

.sku-name-cn {
  font-size: 14px;
  font-weight: 600;
  color: #212529;
  margin-bottom: 4px;
  line-height: 1.3;
}

.sku-name-en {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 8px;
  line-height: 1.2;
}

.sku-price {
  font-size: 16px;
  font-weight: 700;
  color: #dc3545;
}

.sku-edit-hint {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 123, 255, 0.9);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.sku-edit-hint .el-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.sku-edit-hint span {
  font-size: 12px;
}

.detail-images-section {
  margin-bottom: 40px;
}

.detail-images-container {
  display: flex;
  gap: 15px;
  overflow-x: auto;
  padding: 10px 0;
  scrollbar-width: thin;
  scrollbar-color: #007bff #f1f3f4;
}

.detail-images-container::-webkit-scrollbar {
  height: 8px;
}

.detail-images-container::-webkit-scrollbar-track {
  background: #f1f3f4;
  border-radius: 4px;
}

.detail-images-container::-webkit-scrollbar-thumb {
  background: #007bff;
  border-radius: 4px;
}

.detail-image-item {
  flex: 0 0 auto;
  width: 200px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  position: relative;
  cursor: pointer;
}

.detail-image-item:hover {
  transform: scale(1.02);
}

.detail-image-item:hover .detail-image-actions {
  opacity: 1;
  transform: translateY(0);
}

.detail-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-image-actions {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 8px;
}

.detail-image-actions .el-button {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 图片预览弹窗样式 */
.image-preview-dialog :deep(.el-dialog__body) {
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
}

.image-preview-container {
  width: 100%;
  height: 70vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

/* Param Section */
.param-section {
  margin-bottom: 40px;
}

/* No Content Messages */
.no-images,
.no-sku {
  text-align: center;
  padding: 40px;
  color: #6c757d;
  font-size: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
}

/* Responsive Design */
@media (max-width: 768px) {
  .product-detail {
    padding: 15px;
  }
  
  .product-ids {
    flex-direction: column;
    gap: 10px;
  }
  
  .id-value-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .id-actions {
    justify-content: flex-start;
  }
  
  .title-cn {
    font-size: 24px;
  }
  
  .title-en {
    font-size: 18px;
  }
  
  .title-en-container {
    flex-direction: column;
    gap: 10px;
  }
  
  .title-actions {
    justify-content: center;
  }
  
  .section-title {
    font-size: 20px;
  }
  
  .main-image-item {
    width: 250px;
    height: 250px;
  }
  
  .sku-item {
    width: 180px;
  }
  
  .detail-image-item {
    width: 200px;
    height: 200px;
  }
}

@media (max-width: 480px) {
  .main-image-item {
    width: 200px;
    height: 200px;
  }
  
  .sku-item {
    width: 160px;
  }
  
  .detail-image-item {
    width: 180px;
    height: 180px;
  }
}
</style>