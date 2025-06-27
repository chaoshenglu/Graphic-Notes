<template>
  <div class="max-w-6xl mx-auto p-5 font-sans">
    <div class="fixed left-5px top-100px flex flex-col">
      <el-button class="mt-6px ml-12px" v-if="productData && productData.product_html" @click="previewProductHtml">
        预览product_html
      </el-button>
      <el-button class="mt-6px ml-12px" v-else @click="previewProductHtml">product_html为空</el-button>
      <el-button class="mt-10px" @click="synchronizeProductInfoToShopify">同步商品到shopify</el-button>
      <el-button class="mt-10px" @click="synchronizeSkuToShopify">同步sku到shopify</el-button>
      <el-button class="mt-10px" @click="synchronizeProductHtmlToShopify">同步细节图到shopify</el-button>
    </div>
    <div class="flex" style="position: fixed;top:100px;left:320px;cursor: pointer;">
      <img src="/src/assets/back.svg" @click="backToList">
    </div>
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-gray-800 mb-3 leading-tight">{{ productData?.title_cn || 'No Chinese Title' }}
      </h1>
      <div class="flex items-center justify-center gap-4 flex-wrap">
        <h2 class="text-xl font-normal text-gray-600 m-0 leading-relaxed">{{ productData?.title_en || 'No English Title'
          }}</h2>
        <div class="flex gap-2 items-center">
          <el-button type="primary" :icon="Edit" size="small" circle @click="editTitleEn" title="编辑英文标题"
            class="transition-transform duration-300 hover:scale-110" />
          <el-button type="success" :icon="CopyDocument" size="small" circle @click="copyTitleEn" title="复制英文标题"
            class="transition-transform duration-300 hover:scale-110" />
        </div>
      </div>
    </div>
    <div class="flex items-center gap-5 mb-5 flex-wrap">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-gray-900 text-15px">Product ID:</span>
        <span class="text-blue-600 text-15px bg-white px-2 py-1 rounded border border-gray-300">{{
          productData?.product_id || 'N/A' }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="font-semibold text-gray-900 text-15px">Shopify ID:</span>
        <span class="text-blue-600 text-15px bg-white px-2 py-1 rounded border border-gray-300">{{
          productData?.shopify_id || 'N/A' }}</span>
      </div>
      <div class="flex gap-2 items-center">
        <el-button type="primary" :icon="Edit" size="small" circle @click="editShopifyId" title="编辑Shopify ID"
          class="transition-transform duration-300 hover:scale-110" />
        <el-button type="success" :icon="CopyDocument" size="small" circle @click="copyShopifyId" title="复制Shopify ID"
          class="transition-transform duration-300 hover:scale-110" />
      </div>
    </div>
    <div style="display: flex;flex-direction: row;align-items: center;margin-bottom: 20px;">
      <span class="font-semibold text-gray-900 text-15px mr-10px">分类:</span>
      <el-radio-group v-model="productData.cate" v-if="productData && productData.cate">
        <el-radio value="Not decided" size="large">Not decided</el-radio>
        <el-radio value="Night Light" size="large">Night Light</el-radio>
        <el-radio value="Table Lamp" size="large">Table Lamp</el-radio>
        <el-radio value="Wall Lamp" size="large">Wall Lamp</el-radio>
        <el-radio value="Chandelier" size="large">Chandelier</el-radio>
        <el-radio value="Ceiling Lamp" size="large">Ceiling Lamp</el-radio>
        <el-radio value="Floor Lamp" size="large">Floor Lamp</el-radio>
      </el-radio-group>
      <el-button class="ml-15px" @click="saveCate(productData?.cate)">保存分类</el-button>
    </div>
    <div class="mb-10">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-20px font-semibold text-gray-900 m-0 pb-2 inline-block"
          style="border-bottom: 2px solid #007bff;">主图</h3>
        <el-button type="primary" :icon="Download" size="small" circle @click="downloadAllMainImages" title="下载全部主图"
          :disabled="!productData?.main_images_cn?.length"
          class="transition-transform duration-300 hover:scale-110 disabled:hover:scale-100" />
      </div>
      <div class="flex gap-4 overflow-x-auto py-3">
        <div v-for="(image, index) in productData?.main_images_cn || []" :key="index"
          class="flex-shrink-0 w-50 h-50 rounded-xl overflow-hidden transition-transform duration-300 hover:-translate-y-1">
          <img :src="image" :alt="`主图 ${index + 1}`" class="w-full h-full object-cover" />
        </div>
        <div v-if="!productData?.main_images_cn?.length"
          class="text-center py-10 text-gray-600 text-base bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 w-full">
          暂无主图
        </div>
      </div>
    </div>
    <div class="mb-10">
      <div class="flex items-center justify-between mb-4">
        <h3 v-if="productData" class="text-20px font-semibold text-gray-900 m-0 pb-2 inline-block"
          style="border-bottom: 2px solid #007bff;">规格选择【{{ productData.sku_data.length }}】</h3>
        <div class="flex">
          <img src="/src/assets/fanyi.png" style="cursor: pointer;margin-right: 16px;" @click="fanyiSku">
          <el-button type="primary" :icon="Download" size="small" circle @click="downloadAllSkuImages" title="下载全部SKU图片"
            :disabled="!productData?.sku_data?.length"
            class="transition-transform duration-300 hover:scale-110 disabled:hover:scale-100" />
        </div>
      </div>
      <div class="flex gap-4 overflow-x-auto py-4">
        <div v-for="(sku, index) in productData?.sku_data || []" :key="index"
          class="flex-shrink-0 flex flex-col items-center justify-center w-50 bg-white border-2 border-gray-200 rounded-xl overflow-hidden relative">
          <div class="text-6 absolute top-4px left-4px cursor-pointer w-16px" @click="openSkuEditModal(sku, index)">
            <el-icon>
            <Edit />
          </el-icon>
          </div>
          <div class="w-full h-48 overflow-hidden flex items-center justify-center">
            <img :src="sku.skuImageUrl" :alt="sku.skuNameCn"
              class="w-3/5 h-3/5 object-cover transition-transform duration-300 group-hover:scale-105" />
          </div>
          <div class="p-3">
            <div class="text-sm font-semibold text-gray-800 mb-1 leading-tight">{{ sku.skuNameCn }}</div>
            <div class="text-xs text-gray-600 mb-2 leading-tight">{{ sku.skuNameEn || 'No English Name' }}</div>
            <div v-if="sku.skuNameEn" class="text-base font-bold text-red-600">{{ sku.price ? `$${sku.price}` : '-' }}
            </div>
            <div v-else class="text-base font-bold text-red-600">{{ sku.price ? `¥${sku.price}` : '-' }}</div>
          </div>
        </div>
        <div v-if="!productData?.sku_data?.length"
          class="text-center py-10 text-gray-600 text-base bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 w-full">
          暂无规格信息
        </div>
      </div>
    </div>
    <div class="mb-10">
      <div class="flex items-end justify-between mb-4">
        <h3 class="text-20px font-semibold text-gray-900 m-0 pb-2 inline-block"
          style="border-bottom: 2px solid #007bff;">详情图片</h3>
        <el-button type="primary" @click="syncImagesToCloudflare" :loading="uploading">同步图片到Cloudflare</el-button>
      </div>
      <div class="flex gap-4 overflow-x-auto py-3">
        <div v-for="(image, index) in productData?.detail_images_cn || []" :key="index"
          class="flex-shrink-0 w-50 h-50 rounded-lg overflow-hidden transition-transform duration-300 relative cursor-pointer hover:scale-102 group">
          <img :src="image" :alt="`详情图 ${index + 1}`" class="w-full h-full object-cover" />
          <div
            class="absolute inset-0 bg-black/50 flex items-center justify-center gap-3 opacity-0 transition-opacity duration-300 rounded-lg group-hover:opacity-100">
            <el-button type="primary" :icon="ZoomIn" circle size="small" @click.stop="previewImage(image)"
              title="放大预览" />
            <el-button type="danger" :icon="Delete" circle size="small" @click.stop="deleteDetailImage(index)"
              title="删除图片" />
          </div>
        </div>
        <div v-if="!productData?.detail_images_cn?.length"
          class="text-center py-10 text-gray-600 text-base bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 w-full">
          暂无详情图片
        </div>
      </div>
    </div>
    <div class="mb-10" style="position: relative;">
      <div style="position: absolute;right: 0;top:0;">
        <el-button type="primary" :icon="Edit" @click="editParamHtml"
          class="transition-transform duration-300 hover:scale-105">
          编辑HTML
        </el-button>
        <el-button type="primary" :icon="Edit" @click="translateParamHtml"
          class="transition-transform duration-300 hover:scale-105">
          翻译HTML
        </el-button>
      </div>
      <div v-html="productData?.param_info_cn || '<p>暂无中文参数信息</p>'"></div>
      <div style="position: relative;">
        <div style="position: absolute;right: 0;top:0;">
          <el-button type="primary" :icon="Edit" @click="editEnglishParamHtml"
            class="transition-transform duration-300 hover:scale-105">
            编辑HTML
          </el-button>
        </div>
        <div v-html="productData?.param_info_en || '<p>暂无英文信息</p>'"></div>
      </div>
    </div>

    <!-- SKU编辑弹窗 -->
    <SkuEditModal v-model="showSkuEditModal" :sku-data="currentEditingSku" :product-id="route.params.id"
      :sku-index="currentSkuIndex" @save-success="handleSkuSaveSuccess" />

    <!-- 图片预览弹窗 -->
    <el-dialog v-model="showImagePreview" title="图片预览" width="80%" :center="true">
      <div class="w-full h-70vh flex justify-center items-center bg-black p-0">
        <img :src="previewImageUrl" alt="预览图片" class="max-w-full max-h-full object-contain rounded" />
      </div>
    </el-dialog>

    <!-- HTML编辑弹窗 -->
    <el-dialog v-model="showHtmlEditModal" :title="editingLanguage === 'cn' ? '编辑中文参数信息HTML' : '编辑英文参数信息HTML'"
      width="70%" :center="true" class="mt-5vh mb-5vh max-h-90vh flex flex-col">
      <el-input v-model="editingHtmlContent" type="textarea" placeholder="请输入HTML内容"
        class="font-mono text-sm leading-relaxed" :autosize="{ minRows: 25, maxRows: 35 }" />
      <template #footer>
        <span class="flex justify-end gap-3">
          <el-button @click="showHtmlEditModal = false">取消</el-button>
          <el-button type="warning" @click="cleanTitleAttributes">清理</el-button>
          <el-button type="primary" @click="saveParamHtml" :loading="savingHtml">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="showProductHtmlEditModal" title="编辑图片详情页" width="70%" :center="true"
      class="mt-5vh mb-5vh max-h-90vh flex flex-col">
      <el-input v-model="editingProductHtmlContent" type="textarea" placeholder="请输入HTML内容"
        class="font-mono text-sm leading-relaxed" :autosize="{ minRows: 25, maxRows: 35 }" />
      <template #footer>
        <span class="flex justify-end gap-3">
          <el-button @click="showProductHtmlEditModal = false">取消</el-button>
          <el-button type="primary" @click="updateProductHtml">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Edit, CopyDocument, ZoomIn, Delete, Download } from '@element-plus/icons-vue'
import SkuEditModal from '../components/SkuEditModal.vue'
import { convertToWebP } from '../utils/imageConverter.js'
import { translator } from '../utils/translator.js'
const route = useRoute()
const productData = ref(null)
const loading = ref(false)
const error = ref(null)
const uploading = ref(false)
const router = useRouter()
const showSkuEditModal = ref(false)
const currentEditingSku = ref(null)
const currentSkuIndex = ref(-1)
const showImagePreview = ref(false)
const previewImageUrl = ref('')
const showHtmlEditModal = ref(false)
const editingHtmlContent = ref('')
const savingHtml = ref(false)
const editingLanguage = ref('cn') // 'cn' 表示编辑中文，'en' 表示编辑英文
const showProductHtmlEditModal = ref(false)
const editingProductHtmlContent = ref('')

async function fanyiSku() {
  if (productData.value?.sku_data && productData.value.sku_data.length > 0) {
    productData.value.sku_data.forEach(sku => {
      if (sku.price) {
        const originalPrice = parseFloat(sku.price)
        sku.price = Math.round(originalPrice * 0.43)
        console.log(`${originalPrice} => ${sku.price}`)
      }
    })
  }

  if (!productData.value?.sku_data || productData.value.sku_data.length === 0) {
    ElMessage.warning('暂无SKU数据可翻译')
    return
  }
  try {
    ElMessage.info('正在翻译SKU名称，请稍候...')
    const skuNamesToTranslate = productData.value.sku_data
      .filter(sku => sku.skuNameCn && sku.skuNameCn.trim())
      .map(sku => sku.skuNameCn)
    if (skuNamesToTranslate.length === 0) {
      ElMessage.warning('没有找到需要翻译的SKU中文名称')
      return
    }
    // 将多个SKU名称用*符号连接成一个句子
    const combinedQuery = skuNamesToTranslate.join('*')
    
    const translatePromise = new Promise((resolve, reject) => {
      translator.translate(
        combinedQuery,
        'zh',
        'en',
        (data) => {
          if (data && data.trans_result && data.trans_result.length > 0) {
            resolve(data.trans_result[0].dst)
          } else {
            reject(new Error('翻译结果格式异常'))
          }
        },
        (error) => {
          reject(new Error('翻译失败: ' + error))
        }
      )
    })
    const translatedText = await translatePromise
    
    // 通过*符号拆分翻译结果
    const translatedNames = translatedText.split('*')
    
    // 创建翻译映射
    const translationMap = {}
    skuNamesToTranslate.forEach((originalName, index) => {
      if (index < translatedNames.length) {
        translationMap[originalName] = translatedNames[index].trim()
      }
    })
    const sku_data_translated = productData.value.sku_data.map(sku => {
      const translatedName = translationMap[sku.skuNameCn]
      return {
        ...sku,
        skuNameEn: translatedName || sku.skuNameEn
      }
    })
    const productId = route.params.id
    const updateData = {
      ...productData.value,
      sku_data: sku_data_translated
    }
    await axios.put(`${window.lx_host}/products/${productId}`, updateData)
    productData.value.sku_data = sku_data_translated
    ElMessage.success(`SKU翻译完成，共翻译了 ${Object.keys(translationMap).length} 个SKU名称`)
  } catch (error) {
    console.error('翻译SKU失败:', error)
    ElMessage.error('翻译失败：' + (error.message || '未知错误'))
  }
}

function backToList() {
  router.push({
    name: 'ProductList',
  })
}

function previewProductHtml() {
  editingProductHtmlContent.value = productData.value?.product_html || ''
  showProductHtmlEditModal.value = true
}

// 同步商品sku到Shopify
const synchronizeSkuToShopify = async () => {
  const shopify_id = productData.value.shopify_id || ''
  if (shopify_id == '') {
    ElMessage.error('缺少Shopify ID，无法同步')
    return
  }
  try {
    ElMessage.info('正在同步商品信息到Shopify，请稍候...')
    let updateData = {}
    if (productData.value.sku_data && productData.value.sku_data.length) {
      let values = []
      let updateData_variants = []
      for (let i = 0; i < productData.value.sku_data.length; i++) {
        let sku = productData.value.sku_data[i]
        values.push(sku.skuNameCn)
        updateData_variants.push({
          "price": sku.price,
          "compare_at_price": Math.round(sku.price * 1.2),
          "title": sku.skuNameEn,
          "option1": sku.skuNameEn
        })
      }
      let option = {
        "name": "style",
        "values": values
      }
      let updateData_options = [option]
      updateData.options = updateData_options
      updateData.variants = updateData_variants
    }
    console.log('updateData :', updateData);
    const response = await axios.put(
      `http://localhost:3000/api/products/${shopify_id}`,
      updateData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    if (response.data.success) {
      ElMessage.success('sku已成功同步到Shopify')
    } else {
      throw new Error(response.data.message || '同步失败')
    }
  } catch (error) {
    console.error('同步sku到Shopify失败:', error)
    const errorMessage = error.response?.data?.message || error.message || '同步失败'
    ElMessage.error(`同步sku到Shopify失败: ${errorMessage}`)
  }
}

const fetchProductDetail = async (productId) => {
  try {
    loading.value = true
    const response = await axios.get(`${window.lx_host}/products/${productId}`)
    if (!response.data.data.cate) {
      response.data.data.cate = "Not decided"
    }
    productData.value = response.data.data
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const editTitleEn = async () => {
  try {
    const { value } = await ElMessageBox.prompt(
      '请输入新的英文标题',
      '编辑英文标题',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputValue: productData.value?.title_en || ' Tiffany Lamp',
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

const saveCate = async (newCate) => {
  try {
    const productId = route.params.id
    const updateData = {
      ...productData.value,
      cate: newCate
    }
    await axios.put(`${window.lx_host}/products/${productId}`, updateData)
    productData.value.cate = newCate
    ElMessage.success('分类更新成功')
  } catch (error) {
    ElMessage.error('更新失败：' + (error.response?.data?.message || error.message))
  }
}

const updateProductTitle = async (newTitleEn) => {
  try {
    const productId = route.params.id
    const updateData = {
      ...productData.value,
      title_en: newTitleEn
    }
    await axios.put(`${window.lx_host}/products/${productId}`, updateData)
    productData.value.title_en = newTitleEn
    ElMessage.success('英文标题更新成功')
  } catch (error) {
    ElMessage.error('更新失败：' + (error.response?.data?.message || error.message))
  }
}

const editParamHtml = () => {
  editingHtmlContent.value = productData.value?.param_info_cn || ''
  editingLanguage.value = 'cn'
  showHtmlEditModal.value = true
}

const editEnglishParamHtml = () => {
  editingHtmlContent.value = productData.value?.param_info_en || ''
  editingLanguage.value = 'en'
  showHtmlEditModal.value = true
}

const translateParamHtml = async () => {
  let paramInfoCn = productData.value?.param_info_cn
  if (!paramInfoCn || paramInfoCn.trim() === '') {
    ElMessage.warning('暂无中文参数信息可翻译')
    return
  }
  try {
    ElMessage.info('正在翻译参数信息，请稍候...')
    // 删除<style>...</style>部分
    const cleanedParamInfoCn = paramInfoCn.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    if (!cleanedParamInfoCn || cleanedParamInfoCn.trim() === '') {
      ElMessage.warning('删除样式后暂无内容可翻译')
      return
    }
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.lx_doubao}`
      },
      body: JSON.stringify({
        model: 'doubao-seed-1-6-flash-250615',
        messages: [
          {
            content: [
              {
                text: `请将下面的代码中的中文翻译成英文(翻译后按原代码格式返回，不要使用 Markdown 格式)：${cleanedParamInfoCn}`,
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
      const productId = route.params.id
      const updateData = {
        ...productData.value,
        param_info_en: translatedContent
      }
      await axios.put(`${window.lx_host}/products/${productId}`, updateData)
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

const saveParamHtml = async () => {
  try {
    savingHtml.value = true
    const productId = route.params.id
    const updateData = {
      ...productData.value
    }
    if (editingLanguage.value === 'cn') {
      updateData.param_info_cn = editingHtmlContent.value
    } else {
      updateData.param_info_en = editingHtmlContent.value
    }
    await axios.put(`${window.lx_host}/products/${productId}`, updateData)
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

const updateShopifyId = async (newShopifyId) => {
  try {
    const productId = route.params.id
    const updateData = {
      ...productData.value,
      shopify_id: newShopifyId
    }
    await axios.put(`${window.lx_host}/products/${productId}`, updateData)
    productData.value.shopify_id = newShopifyId
    ElMessage.success('Shopify ID更新成功')
  } catch (error) {
    ElMessage.error('更新失败：' + (error.response?.data?.message || error.message))
  }
}

const openSkuEditModal = (sku, index) => {
  currentEditingSku.value = { ...sku }
  currentSkuIndex.value = index
  showSkuEditModal.value = true
}

const handleSkuSaveSuccess = (result) => {
  if (productData.value && productData.value.sku_data && productData.value.sku_data[result.index]) {
    Object.assign(productData.value.sku_data[result.index], result.data)
  }
}

const previewImage = (imageUrl) => {
  previewImageUrl.value = imageUrl
  showImagePreview.value = true
}

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
      const filename = `${productData.value.product_id}_${i + 1}.jpg`
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
        const filename = `${i + 1}.【${sku.skuNameEn}】${sku.price}.jpg`
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

const generateDetailImagesHtml = () => {
  const id = productData.value.product_id
  const count = productData.value.detail_images_cn.length || []
  const imageUrls = []
  for (let i = 1; i <= count; i++) {
    imageUrls.push(`https://tiffanylamps.art/${id}/detail/${i}.webp`)
  }
  imageUrls.push('https://tiffanylamps.art/bottom.webp')
  if (productData.value.cate == 'Floor Lamp') {
    imageUrls.push('https://tiffanylamps.art/floor-lamp-switch.webp')
  } else if (productData.value.cate == 'Not decided') {
    imageUrls.push('https://tiffanylamps.art/floor-lamp-switch.webp')
    imageUrls.push('https://tiffanylamps.art/not-floor-lamp-switch.webp')
  } else {
    imageUrls.push('https://tiffanylamps.art/not-floor-lamp-switch.webp')
  }
  const imgTags = imageUrls.map(url => `  <img src="${url}">`).join('\n')
  return `<div style="display: flex;flex-direction: column;border-radius: 8px;box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);overflow: hidden;">\n${imgTags}\n</div>`
}

const updateProductHtml = async () => {
  let new_product_html = ''
  if (showProductHtmlEditModal.value) {
    new_product_html = editingProductHtmlContent.value
  } else {
    new_product_html = generateDetailImagesHtml()
  }
  try {
    const productId = route.params.id
    const updateData = {
      ...productData.value,
      product_html: new_product_html
    }
    await axios.put(`${window.lx_host}/products/${productId}`, updateData)
    productData.value.product_html = new_product_html
    ElMessage.success('product_html更新成功')
    showProductHtmlEditModal.value = false
  } catch (error) {
    ElMessage.error('更新失败：' + (error.response?.data?.message || error.message))
  }
}

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
      console.log('通过Squoosh转换并上传成功的WebP图片URLs:', uploadedUrls)
      updateProductHtml()
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

const cleanTitleAttributes = async () => {
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
    } else {
      newContent = content.replace(titlePattern, '')
    }
    newContent = newContent.replace("豪蒂（家装灯饰）", "Hauty")
    newContent = newContent.replace("豪蒂", "Hauty")
    newContent = newContent.replace("10年", "3年")
    newContent = newContent.replace("其他/other", "")
    // 使用API接口整理数据：
    try {
      ElMessage.info('正在整理参数信息，请稍候...')
      // 提取<style>...</style>部分
      const styleMatches = newContent.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []
      // 删除<style>...</style>部分
      const cleanedParamInfoCn = newContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.lx_doubao}`
        },
        body: JSON.stringify({
          model: 'doubao-seed-1-6-flash-250615',
          messages: [
            {
              content: [
                {
                  text: `请将下面的代码中的"灯具是否带光源"对应的值改为"光源将作为赠品赠送"，将"颜色分类"对应的值改为"中国广东"，然后将"颜色分类"四个字改为"产地"，不要在代码中增加注释，不要使用 Markdown 格式，直接返回代码本体。：${cleanedParamInfoCn}`,
                  type: 'text'
                }
              ],
              role: 'user'
            }
          ]
        })
      })
      if (!response.ok) {
        throw new Error(`请求失败: ${response.statusText}`)
      }
      const result = await response.json()
      if (result.choices && result.choices.length > 0) {
        let message_content = result.choices[0].message.content
        // 重新添加<style>标签
        if (styleMatches.length > 0) {
          message_content = styleMatches.join('') + message_content
        }
        editingHtmlContent.value = message_content
      } else {
        throw new Error('API返回数据格式异常')
      }
    } catch (error) {
      console.error('失败:', error)
      ElMessage.error('失败：' + (error.message || '未知错误'))
    }
  } catch (error) {
    console.log(error)
  }
}

onMounted(() => {
  document.title = 'Hauty商品详情'
  const productId = route.params.id
  fetchProductDetail(productId)
})

const synchronizeProductHtmlToShopify = async () => {
  let param_info_en = productData.value.param_info_en || ""
  let param_info_cn = productData.value.param_info_cn || ""
  param_info_en = param_info_en.replace(`<p class="section-title">Parameter information</p>`, '')
  param_info_cn = param_info_cn.replace(`<p class="section-title">Parameter information</p>`, '')
  const shopify_id = productData.value.shopify_id || ''
  const product_html = productData.value.product_html || ''
  if (shopify_id == '') {
    ElMessage.error('缺少Shopify ID，无法同步')
    return
  }
  if (product_html == '') {
    ElMessage.error('缺少product_html，无法同步')
    return
  }
  if (param_info_en == '') {
    ElMessage.error('缺少param_info_en，无法同步')
    return
  }
  if (param_info_cn == '') {
    ElMessage.error('缺少param_info_cn，无法同步')
    return
  }
  try {
    ElMessage.info('正在同步商品信息到Shopify，请稍候...')
    const prefix = `<p class="section-title">Parameter information</p>`
    let updateData = {
      "body_html": prefix + param_info_en + param_info_cn + product_html
    }
    console.log('updateData :', updateData);
    const response = await axios.put(
      `http://localhost:3000/api/products/${shopify_id}`,
      updateData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    if (response.data.success) {
      ElMessage.success('商品信息已成功同步到Shopify')
      console.log('Shopify同步成功:', response.data)
    } else {
      throw new Error(response.data.message || '同步失败')
    }
  } catch (error) {
    console.error('同步到Shopify失败:', error)
    const errorMessage = error.response?.data?.message || error.message || '同步失败'
    ElMessage.error(`同步到Shopify失败: ${errorMessage}`)
  }
}

const synchronizeProductInfoToShopify = async () => {
  let param_info_en = productData.value.param_info_en || ""
  let param_info_cn = productData.value.param_info_cn || ""
  param_info_en = param_info_en.replace(`<p class="section-title">Parameter information</p>`, '')
  param_info_cn = param_info_cn.replace(`<p class="section-title">Parameter information</p>`, '')
  const shopify_id = productData.value.shopify_id || ''
  const product_html = productData.value.product_html || ''
  const title_en = productData.value.title_en || ''

  if (shopify_id == '') {
    ElMessage.error('缺少Shopify ID，无法同步')
    return
  }
  if (product_html == '') {
    ElMessage.error('缺少product_html，无法同步')
    return
  }
  if (title_en == '') {
    ElMessage.error('缺少title_en，无法同步')
    return
  }
  if (param_info_en == '') {
    ElMessage.error('缺少param_info_en，无法同步')
    return
  }
  if (param_info_cn == '') {
    ElMessage.error('缺少param_info_cn，无法同步')
    return
  }
  try {
    ElMessage.info('正在同步商品信息到Shopify，请稍候...')
    const prefix = `<p class="section-title">Parameter information</p>`
    let updateData = {
      "title": title_en,
      "product_type": productData.value.cate,
      "vendor": "Hauty",
      "body_html": prefix + param_info_en + param_info_cn + product_html
    }

    if (productData.value.sku_data && productData.value.sku_data.length) {
      let values = []
      let updateData_variants = []
      for (let i = 0; i < productData.value.sku_data.length; i++) {
        let sku = productData.value.sku_data[i]
        values.push(sku.skuNameCn)
        updateData_variants.push({
          "price": sku.price,
          "compare_at_price": Math.round(sku.price * 1.2),
          "title": sku.skuNameEn,
          "option1": sku.skuNameEn
        })
      }
      let option = {
        "name": "style",
        "values": values
      }
      let updateData_options = [option]
      updateData.options = updateData_options
      updateData.variants = updateData_variants
    }
    const response = await axios.put(`http://localhost:3000/api/products/${shopify_id}`,updateData, {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    if (response.data.success) {
      ElMessage.success('商品信息已成功同步到Shopify')
      console.log('Shopify同步成功:', response.data)
    } else {
      throw new Error(response.data.message || '同步失败')
    }
  } catch (error) {
    console.error('同步到Shopify失败:', error)
    const errorMessage = error.response?.data?.message || error.message || '同步失败'
    ElMessage.error(`同步到Shopify失败: ${errorMessage}`)
  }
}
</script>