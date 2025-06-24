<template>
  <div class="max-w-6xl mx-auto p-5 font-sans">
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-gray-800 mb-3 leading-tight">{{ productData?.title_cn || 'No Chinese Title' }}</h1>
      <div class="flex items-center justify-center gap-4 flex-wrap">
        <h2 class="text-xl font-normal text-gray-600 m-0 leading-relaxed">{{ productData?.title_en || 'No English Title' }}</h2>
        <div class="flex gap-2 items-center">
          <el-button 
            type="primary" 
            :icon="Edit" 
            size="small" 
            circle 
            @click="editTitleEn"
            title="编辑英文标题"
            class="transition-transform duration-300 hover:scale-110"
          />
          <el-button 
            type="success" 
            :icon="CopyDocument" 
            size="small" 
            circle 
            @click="copyTitleEn"
            title="复制英文标题"
            class="transition-transform duration-300 hover:scale-110"
          />
        </div>
      </div>
    </div>
    <div class="flex items-center gap-5 mb-5 flex-wrap">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-gray-900 text-15px">Product ID:</span>
        <span class="text-blue-600 text-15px bg-white px-2 py-1 rounded border border-gray-300">{{ productData?.product_id || 'N/A' }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="font-semibold text-gray-900 text-15px">Shopify ID:</span>
        <span class="text-blue-600 text-15px bg-white px-2 py-1 rounded border border-gray-300">{{ productData?.shopify_id || 'N/A' }}</span>
      </div>
      <div class="flex gap-2 items-center">
        <el-button 
          type="primary" 
          :icon="Edit" 
          size="small" 
          circle 
          @click="editShopifyId"
          title="编辑Shopify ID"
          class="transition-transform duration-300 hover:scale-110"
        />
        <el-button 
          type="success" 
          :icon="CopyDocument" 
          size="small" 
          circle 
          @click="copyShopifyId"
          title="复制Shopify ID"
          class="transition-transform duration-300 hover:scale-110"
        />
      </div>
    </div>
    <div class="mb-10">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-20px font-semibold text-gray-900 m-0 pb-2 inline-block" style="border-bottom: 2px solid #007bff;">主图</h3>
        <el-button 
          type="primary" 
          :icon="Download" 
          size="small" 
          circle 
          @click="downloadAllMainImages"
          title="下载全部主图"
          :disabled="!productData?.main_images_cn?.length"
          class="transition-transform duration-300 hover:scale-110 disabled:hover:scale-100"
        />
      </div>
      <div class="flex gap-4 overflow-x-auto py-3">
        <div 
          v-for="(image, index) in productData?.main_images_cn || []" 
          :key="index" 
          class="flex-shrink-0 w-50 h-50 rounded-xl overflow-hidden transition-transform duration-300 hover:-translate-y-1"
        >
          <img :src="image" :alt="`主图 ${index + 1}`" class="w-full h-full object-cover" />
        </div>
        <div v-if="!productData?.main_images_cn?.length" class="text-center py-10 text-gray-600 text-base bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 w-full">
          暂无主图
        </div>
      </div>
    </div>
    <div class="mb-10">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-20px font-semibold text-gray-900 m-0 pb-2 inline-block"  style="border-bottom: 2px solid #007bff;">规格选择</h3>
        <el-button 
          type="primary" 
          :icon="Download" 
          size="small" 
          circle 
          @click="downloadAllSkuImages"
          title="下载全部SKU图片"
          :disabled="!productData?.sku_data?.length"
          class="transition-transform duration-300 hover:scale-110 disabled:hover:scale-100"
        />
      </div>
      <div class="flex gap-4 overflow-x-auto py-4">
        <div 
          v-for="(sku, index) in productData?.sku_data || []" 
          :key="index" 
          class="flex-shrink-0 flex flex-col items-center justify-center w-50 bg-white border-2 border-gray-200 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer relative hover:border-blue-600 hover:shadow-xl hover:-translate-y-1 group"
          @click="openSkuEditModal(sku, index)"
        >
          <div class="w-full h-48 overflow-hidden flex items-center justify-center">
            <img :src="sku.skuImageUrl" :alt="sku.skuNameCn" class="w-3/5 h-3/5 object-cover transition-transform duration-300 group-hover:scale-105" />
          </div>
          <div class="p-3">
            <div class="text-sm font-semibold text-gray-800 mb-1 leading-tight">{{ sku.skuNameCn }}</div>
            <div class="text-xs text-gray-600 mb-2 leading-tight">{{ sku.skuNameEn || 'No English Name' }}</div>
            <div class="text-base font-bold text-red-600">{{ sku.price ? `¥${sku.price}` : '价格待定' }}</div>
          </div>
          <div class="absolute inset-0 bg-blue-600/90 text-white flex flex-col items-center justify-center opacity-0 translate-y-3 transition-all duration-300 text-sm font-medium group-hover:opacity-100 group-hover:translate-y-0">
            <el-icon class="text-6 mb-1"><Edit /></el-icon>
            <span class="text-xs">点击编辑</span>
          </div>
        </div>
        <div v-if="!productData?.sku_data?.length" class="text-center py-10 text-gray-600 text-base bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 w-full">
          暂无规格信息
        </div>
      </div>
    </div>
    <div class="mb-10">
      <div class="flex items-end justify-between mb-4">
        <h3 class="text-20px font-semibold text-gray-900 m-0 pb-2 inline-block"  style="border-bottom: 2px solid #007bff;">详情图片</h3>
        <el-button type="primary" @click="syncImagesToCloudflare" :loading="uploading">同步图片到Cloudflare</el-button>
      </div>
      <div class="flex gap-4 overflow-x-auto py-3">
        <div 
          v-for="(image, index) in productData?.detail_images_cn || []" 
          :key="index" 
          class="flex-shrink-0 w-50 h-50 rounded-lg overflow-hidden transition-transform duration-300 relative cursor-pointer hover:scale-102 group"
        >
          <img :src="image" :alt="`详情图 ${index + 1}`" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-black/50 flex items-center justify-center gap-3 opacity-0 transition-opacity duration-300 rounded-lg group-hover:opacity-100">
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
        <div v-if="!productData?.detail_images_cn?.length" class="text-center py-10 text-gray-600 text-base bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 w-full">
          暂无详情图片
        </div>
      </div>
    </div>
    <div class="mb-10" style="position: relative;">
      <div style="position: absolute;right: 0;top:0;">
        <el-button 
          type="primary" 
          :icon="Edit" 
          @click="editParamHtml"
          class="transition-transform duration-300 hover:scale-105"
        >
          编辑HTML
        </el-button>
        <el-button 
          type="primary" 
          :icon="Edit" 
          @click="translateParamHtml"
          class="transition-transform duration-300 hover:scale-105"
        >
          翻译HTML
        </el-button>
      </div>
      <div v-html="productData?.param_info_cn || '<p>暂无中文参数信息</p>'"></div>
      <div style="position: relative;">
        <div style="position: absolute;right: 0;top:0;">
        <el-button 
          type="primary" 
          :icon="Edit" 
          @click="editEnglishParamHtml"
          class="transition-transform duration-300 hover:scale-105"
        >
          编辑HTML
        </el-button>
      </div>
      <div v-html="productData?.param_info_en || '<p>暂无英文信息</p>'"></div>
      </div>
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
    >
      <div class="w-full h-70vh flex justify-center items-center bg-black p-0">
        <img 
          :src="previewImageUrl" 
          alt="预览图片"
          class="max-w-full max-h-full object-contain rounded"
        />
      </div>
    </el-dialog>
    
    <!-- HTML编辑弹窗 -->
    <el-dialog
      v-model="showHtmlEditModal"
      :title="editingLanguage === 'cn' ? '编辑中文参数信息HTML' : '编辑英文参数信息HTML'"
      width="70%"
      :center="true"
      class="mt-5vh mb-5vh max-h-90vh flex flex-col"
    >
      <el-input
        v-model="editingHtmlContent"
        type="textarea"
        placeholder="请输入HTML内容"
        class="font-mono text-sm leading-relaxed"
        :autosize="{ minRows: 25, maxRows: 35 }"
      />
      <template #footer>
        <span class="flex justify-end gap-3">
          <el-button @click="showHtmlEditModal = false">取消</el-button>
          <el-button type="warning" @click="cleanTitleAttributes">清理</el-button>
          <el-button type="primary" @click="saveParamHtml" :loading="savingHtml">保存</el-button>
        </span>
      </template>
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
import { convertToWebP } from '../utils/imageConverter.js'
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

// HTML编辑相关状态
const showHtmlEditModal = ref(false)
const editingHtmlContent = ref('')
const savingHtml = ref(false)
const editingLanguage = ref('cn') // 'cn' 表示编辑中文，'en' 表示编辑英文

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

// 编辑参数HTML
const editParamHtml = () => {
  editingHtmlContent.value = productData.value?.param_info_cn || ''
  editingLanguage.value = 'cn'
  showHtmlEditModal.value = true
}

// 编辑英文版参数HTML
const editEnglishParamHtml = () => {
  editingHtmlContent.value = productData.value?.param_info_en || ''
  editingLanguage.value = 'en'
  showHtmlEditModal.value = true
}

// 翻译HTML
const translateParamHtml = async () => {
  const paramInfoCn = productData.value?.param_info_cn
  if (!paramInfoCn || paramInfoCn.trim() === '') {
    ElMessage.warning('暂无中文参数信息可翻译')
    return
  }
  
  try {
    ElMessage.info('正在翻译参数信息，请稍候...')
    
    // 调用豆包API进行翻译
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.lx_doubao}`
      },
      body: JSON.stringify({
        model: 'doubao-seed-1-6-250615',
        messages: [
          {
            content: [
              {
                text: `请将下面的代码中的中文翻译成英文(翻译后按原代码格式返回)：${paramInfoCn}`,
                type: 'text'
              }
            ],
            role: 'user'
          }
        ]
      })
    })
    
    if (!response.ok) {
      throw new Error(`翻译API请求失败: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (result.choices && result.choices.length > 0) {
      const translatedContent = result.choices[0].message.content
      
      // 更新产品数据中的英文参数信息
      const productId = route.params.id
      const updateData = {
        ...productData.value,
        param_info_en: translatedContent
      }
      
      // 保存到数据库
      await axios.put(`${window.lx_host}/products/${productId}`, updateData)
      
      // 更新本地数据
      productData.value.param_info_en = translatedContent
      
      ElMessage.success('参数信息翻译并保存成功')
    } else {
      throw new Error('翻译API返回数据格式异常')
    }
    
  } catch (error) {
    console.error('翻译失败:', error)
    ElMessage.error('翻译失败：' + (error.message || '未知错误'))
  }
}

// 保存参数HTML
const saveParamHtml = async () => {
  try {
    savingHtml.value = true
    const productId = route.params.id
    
    // 根据当前编辑的语言决定更新哪个字段
    const updateData = {
      ...productData.value
    }
    
    if (editingLanguage.value === 'cn') {
      updateData.param_info_cn = editingHtmlContent.value
    } else {
      updateData.param_info_en = editingHtmlContent.value
    }
    
    await axios.put(`${window.lx_host}/products/${productId}`, updateData)
    
    // 更新本地数据
    if (editingLanguage.value === 'cn') {
      productData.value.param_info_cn = editingHtmlContent.value
      ElMessage.success('中文参数信息更新成功')
    } else {
      productData.value.param_info_en = editingHtmlContent.value
      ElMessage.success('英文参数信息更新成功')
    }
    
    showHtmlEditModal.value = false
  } catch (error) {
    ElMessage.error('更新失败：' + (error.response?.data?.message || error.message))
  } finally {
    savingHtml.value = false
  }
}

// 清理HTML中的title属性
const cleanTitleAttributes = () => {
  try {
    const content = editingHtmlContent.value
    if (!content) {
      ElMessage.warning('暂无内容可清理')
      return
    }
    // 匹配模式：title="任何内容"（包括转义字符）
    const titlePattern = /\s+title="[^"]*"/g
    const matches = content.match(titlePattern)
    let newContent = content
    if (!matches) {
      console.log('未找到title属性')
    }else{
      newContent = content.replace(titlePattern, '')
    }    
    newContent = newContent.replace("豪蒂（家装灯饰）","Hauty")
    newContent = newContent.replace("豪蒂","Hauty")
    newContent = newContent.replace("10年","1年")
    editingHtmlContent.value = newContent
  } catch (error) {
    console.log(error)
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
    const newDetailImages = [...(productData.value?.detail_images_cn || [])]
    newDetailImages.splice(index, 1)
    const updateData = {
      ...productData.value,
      detail_images_cn: newDetailImages
    }
    await axios.put(`${window.lx_host}/products/${productId}`, updateData)
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
        const filename = `${productData.value.product_id}/detail/${i + 1}.webp`
        const file = new File([webpBlob], filename, { type: 'image/webp' })
        formData.append('file', file)
        
        // 上传到Cloudflare R2
        const uploadResponse = await axios.post(`${window.lx_host}/upload-to-r2`, formData, {
          headers: {}
        })
        
        if (uploadResponse.data.success) {
          uploadedUrls.push(uploadResponse.data.url)
          ElMessage.success(`第 ${i + 1} 张图片已通过Squoosh转换为WebP格式并上传成功`)
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
      ElMessage.success(`成功使用Squoosh将 ${uploadedUrls.length} 张图片转换为WebP格式并同步到Cloudflare R2`)
      console.log('通过Squoosh转换并上传成功的WebP图片URLs:', uploadedUrls)
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