<template>
  <div class="min-h-screen">
    <div class="max-w-7xl mx-auto">
      <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <span class="font-bold">Shopify</span>
            <el-input
              v-model="searchQuery"
              placeholder="搜索商品名称..."
              class="w-80"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <i class="i-carbon-search text-gray-400"></i>
              </template>
            </el-input>
            <el-button type="primary" @click="refreshProducts" :loading="loading">
              <i class="i-carbon-restart mr-2"></i>
              刷新
            </el-button>
          </div>
          <div class="text-sm text-gray-500">
            共 {{ totalProducts }} 个商品
          </div>
        </div>
      </div>

      <!-- 商品表格 -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <el-table
          :data="products"
          v-loading="loading"
          element-loading-text="正在加载商品数据..."
          class="w-full"
          :header-cell-style="{ backgroundColor: '#f8fafc', color: '#374151', fontWeight: '600' }"
        >          
          <el-table-column label="image" width="120" align="center">
            <template #default="{ row }">
              <div class="flex justify-center">
                <img
                  :src="row.image || '/placeholder-image.png'"
                  :alt="row.title"
                  class="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  @error="handleImageError"
                />
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="title" label="title" min-width="200">
            <template #default="{ row }">
              <div class="font-medium text-gray-900 truncate" :title="row.title">
                {{ row.title }}
              </div>
              <div class="text-sm text-gray-500 mt-1 flex items-center" v-if="row.id">
                <span>Shopify ID: {{ row.id }}</span>
                <el-button
                  type="primary"
                  size="small"
                  text
                  @click="copyToClipboard(row.id)"
                  class="ml-2 p-1"
                  :title="`复制商品ID: ${row.id}`"
                >
                  <i class="i-carbon-copy text-xs"></i>
                </el-button>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="product_type" label="product type" width="120" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.product_type || '未分类' }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="price" width="120" align="center">
            <template #default="{ row }">
              <div class="font-semibold text-green-600" v-if="row.variants && row.variants.length > 0">
                ${{ row.variants[0].price }}
              </div>
              <div class="text-gray-400" v-else>-</div>
            </template>
          </el-table-column>

          <el-table-column label="inventory" width="100" align="center">
            <template #default="{ row }">
              <div v-if="row.variants && row.variants.length > 0">
                <el-tag
                  :type="getStockTagType(row.variants[0].inventory_quantity)"
                  size="small"
                >
                  {{ row.variants[0].inventory_quantity || 0 }}
                </el-tag>
              </div>
              <div class="text-gray-400" v-else>-</div>
            </template>
          </el-table-column>

          <el-table-column label="vendor" width="100" align="center">
            <template #default="{ row }">
              <div class="text-sm text-gray-600">
                {{ row.vendor }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="actions" width="120" align="center" fixed="right">
            <template #default="{ row }">
              <div class="flex justify-center space-x-2">
                <el-button
                  type="primary"
                  size="small"
                  @click="viewProduct(row)"
                  link
                >
                  查看
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="p-4 border-t border-gray-200">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="totalProducts"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            class="flex justify-center"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const loading = ref(false)
const products = ref([])
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const totalProducts = ref(0)

// 分页信息存储
const paginationInfo = ref({
  hasNextPage: false,
  hasPreviousPage: false,
  nextPageInfo: null,
  previousPageInfo: null
})

// 分页历史记录，用于存储每页的分页信息
const pageHistory = ref(new Map())

// 注意：由于使用API分页，不再需要客户端的过滤和分页计算属性
// 搜索和分页都通过API参数处理

const fetchProducts = async () => {
  loading.value = true
  try {
    // 构建API请求参数
    const params = new URLSearchParams({
      limit: pageSize.value.toString()
    })
    
    // 如果有搜索查询，添加到参数中（这里假设API支持搜索）
    if (searchQuery.value) {
      params.append('search', searchQuery.value)
    }
    
    // 使用分页历史记录进行分页
    if (currentPage.value > 1) {
      const pageInfo = pageHistory.value.get(currentPage.value)
      if (pageInfo) {
        params.append('page_info', pageInfo)
      }
    }
    
    // 调用Shopify API
    const response = await fetch(`http://localhost:3000/api/products?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      // 处理产品数据，确保图片字段正确
      const processedProducts = result.data.products.map(product => ({
        ...product,
        image: product.images && product.images.length > 0 
          ? product.images[0].src 
          : null
      }))
      
      products.value = processedProducts
      
      // 更新分页信息
       if (result.data.pagination) {
         paginationInfo.value = {
           hasNextPage: result.data.pagination.hasNextPage || false,
           hasPreviousPage: result.data.pagination.hasPreviousPage || false,
           nextPageInfo: result.data.pagination.nextPageInfo || null,
           previousPageInfo: result.data.pagination.previousPageInfo || null
         }
         
         // 保存下一页的分页信息到历史记录
         if (result.data.pagination.nextPageInfo) {
           pageHistory.value.set(currentPage.value + 1, result.data.pagination.nextPageInfo)
         }
         
         // 更新总数
         if (result.data.pagination.totalCount) {
           totalProducts.value = result.data.pagination.totalCount
         } else {
           // 如果没有总数信息，估算总数
           totalProducts.value = currentPage.value * pageSize.value + (paginationInfo.value.hasNextPage ? 1 : 0)
         }
       } else {
         // 如果没有分页信息，使用当前返回的数量
         totalProducts.value = processedProducts.length
         paginationInfo.value = {
           hasNextPage: false,
           hasPreviousPage: false,
           nextPageInfo: null,
           previousPageInfo: null
         }
       }
      
      ElMessage.success(`成功获取 ${processedProducts.length} 个商品`)
    } else {
      throw new Error(result.error || '获取商品失败')
    }
    
  } catch (error) {
    console.error('获取商品失败:', error)
    
    // 根据错误类型显示不同的错误信息
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      ElMessage.error('无法连接到服务器，请确保API服务正在运行 (http://localhost:3000)')
    } else if (error.message.includes('HTTP error')) {
      ElMessage.error(`服务器错误: ${error.message}`)
    } else {
      ElMessage.error(`获取商品数据失败: ${error.message}`)
    }
    
    // 清空商品列表
    products.value = []
    totalProducts.value = 0
  } finally {
    loading.value = false
  }
}

const refreshProducts = () => {
  currentPage.value = 1
  pageHistory.value.clear() // 清理分页历史记录
  fetchProducts()
}

const handleSearch = () => {
  currentPage.value = 1
  pageHistory.value.clear() // 清理分页历史记录
  fetchProducts()
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
  pageHistory.value.clear() // 清理分页历史记录
  fetchProducts()
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  fetchProducts()
}

const getStockTagType = (quantity) => {
  if (quantity === 0) return 'danger'
  if (quantity < 10) return 'warning'
  return 'success'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const handleImageError = (event) => {
  event.target.src = 'https://via.placeholder.com/150/cccccc/666666?text=No+Image'
}

const viewProduct = (product) => {
  ElMessage.info(`查看商品: ${product.title}`)
  // 这里可以跳转到商品详情页或打开详情弹窗
}

const editProduct = (product) => {
  ElMessage.info(`编辑商品: ${product.title}`)
  // 这里可以跳转到编辑页面或打开编辑弹窗
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(`商品ID已复制到剪贴板: ${text}`)
  } catch (error) {
    console.error('复制失败:', error)
    // 降级方案：使用传统的复制方法
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      ElMessage.success(`商品ID已复制到剪贴板: ${text}`)
    } catch (fallbackError) {
      ElMessage.error('复制失败，请手动复制')
    }
    document.body.removeChild(textArea)
  }
}

onMounted(() => {
  document.title = 'Shopify商品管理'
  fetchProducts()
})
</script>