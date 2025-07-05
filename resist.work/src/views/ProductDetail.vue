<template>
  <div class="max-w-6xl mx-auto p-5 font-sans">
    <div class="fixed left-5px top-100px flex flex-col" v-if="productData">
      <el-button class="mt-6px ml-12px" v-if="productData.product_html" @click="previewProductHtml">
        预览product_html
      </el-button>
      <el-button class="mt-6px ml-12px" v-else @click="previewProductHtml" type="danger">product_html为空</el-button>
      <el-button class="mt-10px" @click="synchronizeSkuToShopify">同步sku到shopify</el-button>
      <el-button class="mt-10px" @click="synchronizeProductHtmlToShopify">同步细节图到shopify</el-button>
      <el-button class="mt-10px" :disabled="productData.is_ok == 1"
        @click="synchronizeProductInfoToShopify">全部同步到shopify</el-button>

      <el-button class="mt-30px" @click="editAtShopify">前往shopify编辑</el-button>
      <el-button class="mt-10px" @click="viewShopifyDetail">查看shopify详情页</el-button>
      <el-button class="mt-10px" @click="viewTmallDetail">查看天猫详情页</el-button>

      <span class="mt-30px">核对清单：</span>
      <span class="mt-10px ml-12px">1.sku价格，首尾核对</span>
      <span class="mt-10px ml-12px">2.sku翻译先优化中文</span>
      <span class="mt-10px ml-12px">3.细节图，首尾核对</span>
      <span class="mt-10px ml-12px">4.参数：彩色玻璃，质保年限等</span>
      <span class="mt-10px ml-12px">5.not-floor-lamp-switch.webp</span>
    </div>
    <div class="flex" style="position: fixed;top:100px;left:320px;cursor: pointer;">
      <img src="/src/assets/back.svg" @click="backToList">
    </div>
    <div class="mb-8 text-center" v-if="productData">
      <h1 v-if="productData.seo_title_cn" class="text-3xl font-bold text-gray-800 mb-3 leading-tight line-through"
        @click="copyText(productData.title_cn)">{{
          productData.title_cn }}
      </h1>
      <h1 v-else class="text-3xl font-bold text-gray-800 mb-3 leading-tight" @click="copyText(productData.title_cn)">{{
        productData.title_cn || '-' }}
      </h1>

      <div class="flex items-center justify-center gap-4 flex-wrap" v-if="productData.seo_title_cn">
        <h2 class="text-xl font-normal text-gray-600 m-0 leading-relaxed" @click="copyText(productData.seo_title_cn)">{{
          productData.seo_title_cn}}</h2>
      </div>

      <div class="flex items-center justify-center gap-4 flex-wrap">
        <div class="flex flex-col" v-if="productData">
          <h2 v-if="productData.title_en" class="text-base font-normal text-gray-600 m-0 leading-relaxed"
            @click="copyText(productData.title_en)">{{
              productData.title_en
            }}</h2>
          <h2 v-if="productData.seo_title_en" class="text-base font-normal text-gray-600 m-0 leading-relaxed"
            @click="copyText(productData.seo_title_en)">{{ productData.seo_title_en }}</h2>
        </div>
        <div class="flex gap-2 items-center">
          <el-button type="primary" :icon="HelpFilled" size="small" circle @click="generateTwoSeoTitle"
            title="用豆包AI生成新标题" class="transition-transform duration-300 hover:scale-110" />
          <el-button type="primary" :icon="Edit" size="small" circle @click="editTitle" title="编辑标题"
            class="transition-transform duration-300 hover:scale-110" />
        </div>
      </div>
    </div>
    <div class="flex items-center gap-5 mb-5 flex-wrap">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-gray-900 text-15px">Product ID:</span>
        <span class="text-blue-600 text-15px bg-white px-2 py-1 rounded border border-gray-300"
          @click=copyText(productData?.product_id)>{{
            productData?.product_id || 'N/A' }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="font-semibold text-gray-900 text-15px">Shopify ID:</span>
        <span class="text-blue-600 text-15px bg-white px-2 py-1 rounded border border-gray-300"
          @click=copyText(productData?.shopify_id)>{{
            productData?.shopify_id || 'N/A' }}</span>
      </div>
      <div class="flex gap-2 items-center">
        <el-button type="primary" :icon="Edit" size="small" circle @click="editShopifyId" title="编辑Shopify ID"
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
        <div class="flex">
          <el-button v-if="productData && productData.video_url" type="primary" size="small"
            @click="deleteVideo">删除视频</el-button>
          <el-button v-if="productData && productData.video_url" type="primary" size="small" @click="previewVideo"
            :title="productData.video_url">视频</el-button>
          <el-button type="primary" :icon="Download" size="small" circle @click="downloadAllMainImages" title="下载全部主图"
            :disabled="!productData?.main_images_cn?.length"
            class="transition-transform duration-300 hover:scale-110 disabled:hover:scale-100" />
        </div>
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
          <el-button type="primary" size="small" @click="fanyiSku">翻译</el-button>
          <el-button type="primary" size="small" @click="updateEnPrice">美元</el-button>
          <el-button type="primary" :icon="Download" size="small" circle @click="downloadAllSkuImages" title="下载全部SKU图片"
            :disabled="!productData?.sku_data?.length"
            class="transition-transform duration-300 hover:scale-110 disabled:hover:scale-100" />
        </div>
      </div>
      <div class="flex flex-wrap gap-4 py-4">
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
            <div class="flex">
              <div class="text-base font-bold text-red-600">{{ sku.price_en ? `$${sku.price_en}` : '-' }}</div>
              <div class="text-base font-bold text-gray-800 ml-20px">{{ sku.price ? `¥${sku.price}` : '-' }}</div>
            </div>
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
        <div class="flex">
          <el-button type="primary" @click="deleteSuffixImages(17)"
            :loading="uploading">删除最后17张</el-button>
          <el-button type="primary" @click="deleteSuffixImages(7)"
            :loading="uploading">删除最后7张</el-button>
          <el-button type="primary" @click="deleteSuffixImages(4)"
            :loading="uploading">删除最后4张</el-button>
          <el-button type="primary" @click="handleSyncImagesToCloudflare"
            :loading="uploading">同步图片到Cloudflare</el-button>
        </div>
      </div>
      <div class="flex gap-4 flex-wrap py-3">
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
        <el-button type="primary" @click="translateParamHtml" :loading="apiProcessingStatus === 'processing'"
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

    <!-- 标题编辑弹窗 -->
    <TitleEditModal v-model="showTitleEditModal" :product-id="route.params.id" :title-data="productData"
      @save-success="handleTitleSaveSuccess" />

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
        <div class="flex justify-between items-center">
          <!-- API处理状态显示 -->
          <div class="flex items-center gap-2">
            <el-icon v-if="apiProcessingStatus === 'processing'" class="is-loading text-blue-500">
              <Loading />
            </el-icon>
            <el-icon v-else-if="apiProcessingStatus === 'success'" class="text-green-500">
              <SuccessFilled />
            </el-icon>
            <el-icon v-else-if="apiProcessingStatus === 'error'" class="text-red-500">
              <CircleCloseFilled />
            </el-icon>
            <span v-if="apiProcessingStatus === 'processing'" class="text-blue-500 text-sm">正在处理中...</span>
            <span v-else-if="apiProcessingStatus === 'success'" class="text-green-500 text-sm">处理成功</span>
            <span v-else-if="apiProcessingStatus === 'error'" class="text-red-500 text-sm">处理失败</span>
          </div>

          <span class="flex justify-end gap-3">
            <el-button @click="showHtmlEditModal = false">取消</el-button>
            <el-button type="warning" @click="cleanTitleAttributes"
              :loading="apiProcessingStatus === 'processing'">整理</el-button>
            <el-button type="primary" @click="saveParamHtml" :loading="savingHtml">保存</el-button>
          </span>
        </div>
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
import { Edit, CopyDocument, ZoomIn, Delete, Download, HelpFilled, Loading, SuccessFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import SkuEditModal from '../components/SkuEditModal.vue'
import TitleEditModal from '../components/TitleEditModal.vue'
import { useImageOperations } from '../composables/useImageOperations.js'
import { useProductData } from '../composables/useProductData.js'
import { formatHtml } from '../utils/htmlFormatter.js'
const route = useRoute()
const productData = ref(null)
const error = ref(null)
const router = useRouter()

const {
  uploading,
  downloadAllMainImages: downloadAllMainImagesComposable,
  downloadAllSkuImages: downloadAllSkuImagesComposable,
  syncImagesToCloudflare,
  previewImage: previewImageComposable,
} = useImageOperations()

const downloadAllMainImages = async () => {
  await downloadAllMainImagesComposable(productData.value)
}

const downloadAllSkuImages = async () => {
  await downloadAllSkuImagesComposable(productData.value)
}

const {
  savingHtml,
  apiProcessingStatus,
  fetchProductDetail: fetchProductDetailComposable,
  updateEnPrice: updateEnPriceComposable,
  translateSku: translateSkuComposable,
  saveCate: saveCateComposable,
  translateParamHtml: translateParamHtmlComposable,
  saveParamHtml: saveParamHtmlComposable,
  editShopifyId: editShopifyIdComposable,
  deleteDetailImage: deleteDetailImageComposable,
  updateProductHtml: updateProductHtmlComposable,
  generateDetailImagesHtml: generateDetailImagesHtmlComposable,
  cleanTitleAttributes: cleanTitleAttributesComposable,
  synchronizeProductHtmlToShopify: synchronizeProductHtmlToShopifyComposable,
  synchronizeProductInfoToShopify: synchronizeProductInfoToShopifyComposable,
  synchronizeSkuToShopify: synchronizeSkuToShopifyComposable
} = useProductData()

const showSkuEditModal = ref(false)
const currentEditingSku = ref(null)
const currentSkuIndex = ref(-1)
const showImagePreview = ref(false)
const previewImageUrl = ref('')
const showHtmlEditModal = ref(false)
const editingHtmlContent = ref('')
const editingLanguage = ref('cn') // 'cn' 表示编辑中文，'en' 表示编辑英文
const showProductHtmlEditModal = ref(false)
const editingProductHtmlContent = ref('')
const showTitleEditModal = ref(false)

function editAtShopify() {
  const url = `https://admin.shopify.com/store/a1jefv-w4/products/${row.shopify_id}`
  window.open(url, '_blank')
}

function viewShopifyDetail() {
  const suffix = productData.value.title_en.replace(/\s+/g, '-').toLowerCase()
  const url = `https://tiffanylamps.art/products/${suffix}`
  window.open(url, '_blank')
}

function viewTmallDetail() {
  const url = `https://detail.tmall.com/item.htm?id=${row.product_id}`
  window.open(url, '_blank')
}

async function deleteVideo() {
  const updateData = {
    video_url: ''
  }
  const productId = route.params.id
  await axios.put(`${window.lx_host}/products/${productId}`, updateData)
  fetchProductDetail(productId)
}

function copyText(e) {
  navigator.clipboard.writeText(e)
  ElMessage.success('已复制到剪贴板')
}

function previewVideo() {
  window.open(productData.value.video_url, '_blank')
}

async function generateTwoSeoTitle() {
  try {
    // 检查必要的数据
    if (!productData.value?.title_cn) {
      ElMessage.error('缺少产品中文标题，无法生成SEO标题')
      return
    }

    if (!productData.value?.main_images_cn?.[0]) {
      ElMessage.error('缺少产品主图，无法生成SEO标题')
      return
    }

    const old_title = productData.value.title_cn || ''
    const main_img = productData.value.main_images_cn[0]
    const prompt1 = `如图所示，这是一款蒂凡尼灯饰产品，它的原标题为${old_title}，请为其生成中文SEO标题（适用于天猫平台）和英文SEO标题（适用于shopify平台）。`
    const prompt2 = `请使用JSON格式返回两个新生成的标题，并将这两个字段分别命名为'seo_title_cn'和'seo_title_en'，参考下面的格式：`
    const prompt3 = `{"seo_title_cn": "蒂凡尼灯","seo_title_en":"tiffany lamp"}，不要使用Markdown格式，不要添加注释`
    const prompt = prompt1 + prompt2 + prompt3

    const msg_content = [
      {
        "image_url": {
          "url": main_img
        },
        "type": "image_url"
      },
      {
        "text": prompt,
        "type": "text"
      }
    ]

    ElMessage.info('正在使用豆包AI生成SEO标题，请稍候...')

    // 调用豆包AI模型API
    const response = await axios.post('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      "model": "doubao-1.5-thinking-vision-pro-250428",
      "messages": [
        {
          "content": msg_content,
          "role": "user"
        }
      ]
    }, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${window.lx_doubao}`
      }
    })

    // 解析AI返回的结果
    const aiResponse = response.data?.choices?.[0]?.message?.content
    if (!aiResponse) {
      throw new Error('AI返回结果为空')
    }

    // 尝试解析JSON格式的标题
    let titleData
    try {
      // 清理可能的markdown格式
      const cleanResponse = aiResponse.replace(/```json\n?|```\n?/g, '').trim()
      titleData = JSON.parse(cleanResponse)
    } catch (parseError) {
      throw new Error('AI返回的结果格式不正确，无法解析JSON')
    }

    const { seo_title_cn, seo_title_en } = titleData

    if (!seo_title_cn || !seo_title_en) {
      throw new Error('AI返回的标题数据不完整')
    }

    // 更新产品信息到数据库
    const productId = route.params.id
    const updateData = {
      seo_title_cn: seo_title_cn,
      seo_title_en: seo_title_en
    }

    await axios.put(`${window.lx_host}/products/${productId}`, updateData)

    // 更新本地数据
    productData.value.seo_title_cn = seo_title_cn
    productData.value.seo_title_en = seo_title_en

    ElMessage.success('两个SEO标题生成并更新成功')

  } catch (error) {
    console.error('生成SEO标题失败:', error)

    if (error.response?.status === 401) {
      ElMessage.error('API密钥无效，请检查ARK_API_KEY配置')
    } else if (error.response?.status === 429) {
      ElMessage.error('API调用频率超限，请稍后重试')
    } else if (error.response?.data?.error?.message) {
      ElMessage.error(`AI服务错误: ${error.response.data.error.message}`)
    } else if (error.message.includes('AI返回')) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('生成SEO标题失败：' + (error.message || '未知错误'))
    }
  }
}

function editTitle() {
  showTitleEditModal.value = true
}

const handleTitleSaveSuccess = (titleData) => {
  // 更新本地数据
  productData.value.title_cn = titleData.title_cn
  productData.value.title_en = titleData.title_en
  productData.value.seo_title_cn = titleData.seo_title_cn
  productData.value.seo_title_en = titleData.seo_title_en
}

const updateEnPrice = async () => {
  const productId = route.params.id
  const updatedData = await updateEnPriceComposable(productId, productData.value)
  if (updatedData) {
    productData.value = updatedData
  }
}

const fanyiSku = async () => {
  const productId = route.params.id
  try {
    const updatedData = await translateSkuComposable(productId, productData.value)
    if (updatedData) {
      productData.value = updatedData
    }
  } catch (error) {
    // 错误处理已在 composable 中完成
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

const synchronizeSkuToShopify = async () => {
  await synchronizeSkuToShopifyComposable(productData.value)
}

const fetchProductDetail = async (productId) => {
  try {
    const data = await fetchProductDetailComposable(productId)
    productData.value = data
  } catch (err) {
    error.value = err.message
  }
}

const saveCate = async (newCate) => {
  const productId = route.params.id
  const updatedData = await saveCateComposable(productId, productData.value, newCate)
  if (updatedData) {
    productData.value = updatedData
  }
}

const editParamHtml = () => {
  const rawHtml = productData.value?.param_info_cn || ''
  editingHtmlContent.value = formatHtml(rawHtml)
  editingLanguage.value = 'cn'
  showHtmlEditModal.value = true
}

const editEnglishParamHtml = () => {
  const rawHtml = productData.value?.param_info_en || ''
  editingHtmlContent.value = formatHtml(rawHtml)
  editingLanguage.value = 'en'
  showHtmlEditModal.value = true
}

const translateParamHtml = async () => {
  // 重置API状态
  apiProcessingStatus.value = null

  const productId = route.params.id
  const updatedData = await translateParamHtmlComposable(productId, productData.value)
  if (updatedData) {
    productData.value = updatedData
  }
}

const saveParamHtml = async () => {
  const productId = route.params.id
  const updatedData = await saveParamHtmlComposable(productId, productData.value, editingHtmlContent.value, editingLanguage.value)
  if (updatedData) {
    productData.value = updatedData
    showHtmlEditModal.value = false
  }
}

const editShopifyId = async () => {
  const productId = route.params.id
  const newShopifyId = await editShopifyIdComposable(productId, productData.value?.shopify_id || '')
  if (newShopifyId) {
    productData.value.shopify_id = newShopifyId
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
  previewImageComposable(imageUrl, (url, show) => {
    previewImageUrl.value = url
    showImagePreview.value = show
  })
}

const deleteDetailImage = async (index) => {
  const productId = route.params.id
  const updatedData = await deleteDetailImageComposable(productId, productData.value, index)
  if (updatedData) {
    productData.value = updatedData
  }
}

const generateDetailImagesHtml = () => {
  return generateDetailImagesHtmlComposable(productData.value)
}

const updateProductHtml = async () => {
  let new_product_html = ''
  if (showProductHtmlEditModal.value) {
    new_product_html = editingProductHtmlContent.value
  } else {
    new_product_html = generateDetailImagesHtml()
  }
  const productId = route.params.id
  const updatedData = await updateProductHtmlComposable(productId, productData.value, new_product_html)
  if (updatedData) {
    productData.value = updatedData
    showProductHtmlEditModal.value = false
  }
}

async function handleSyncImagesToCloudflare() {
  try {
    const data = await fetchProductDetailComposable(productId)
    productData.value = data
    syncImagesToCloudflare(productData.value, updateProductHtml)
  } catch (err) {
    error.value = err.message
  }
}

const cleanTitleAttributes = async () => {
  apiProcessingStatus.value = null
  const updatedData = await cleanTitleAttributesComposable(productData.value?.param_info_cn || '')
  if (updatedData) {
    editingHtmlContent.value = updatedData
    if (editingLanguage.value === 'cn') {
      productData.value.param_info_cn = updatedData
    }
  }
}

onMounted(() => {
  document.title = 'Hauty商品详情'
  const productId = route.params.id
  fetchProductDetail(productId)
})

const synchronizeProductHtmlToShopify = async () => {
  await synchronizeProductHtmlToShopifyComposable(productData.value)
}

const synchronizeProductInfoToShopify = async () => {
  await synchronizeProductInfoToShopifyComposable(productData.value)
  const updateData = {
    is_ok: 1
  }
  const productId = route.params.id
  await axios.put(`${window.lx_host}/products/${productId}`, updateData)
}

const deleteSuffixImages = async (count) => {
  if (!productData.value?.detail_images_cn || productData.value.detail_images_cn.length === 0) {
    ElMessage.warning('暂无图片可删除')
    return
  }
  
  const currentLength = productData.value.detail_images_cn.length
  if (currentLength <= count) {
    ElMessage.warning(`图片数量不足${count}张`)
    return
  }
  
  try {
    // 删除最后count个元素
    const newDetailImages = [...productData.value.detail_images_cn]
    newDetailImages.splice(-count, count)
    const updateData = {
      detail_images_cn: newDetailImages
    }
    await axios.put(`${window.lx_host}/products/${route.params.id}`, updateData)
    productData.value.detail_images_cn = newDetailImages
    ElMessage.success(`成功删除最后${count}张图片，剩余${newDetailImages.length}张图片`)
  } catch (error) {
    console.error('删除图片失败:', error)
    ElMessage.error('删除图片失败：' + (error.response?.data?.message || error.message))
  }
}

</script>