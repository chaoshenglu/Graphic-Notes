<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div class="max-w-7xl mx-auto">
      <!-- 页面标题 -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Shopify 商品管理</h1>
        <p class="text-gray-600">管理和查看您的 Shopify 店铺商品</p>
      </div>

      <!-- 操作栏 -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-4">
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
              <i class="i-carbon-refresh mr-2"></i>
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
          <el-table-column type="index" label="序号" width="80" align="center" />
          
          <el-table-column label="商品图片" width="120" align="center">
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

          <el-table-column prop="title" label="商品名称" min-width="200">
            <template #default="{ row }">
              <div class="font-medium text-gray-900 truncate" :title="row.title">
                {{ row.title }}
              </div>
              <div class="text-sm text-gray-500 mt-1" v-if="row.vendor">
                品牌: {{ row.vendor }}
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="product_type" label="商品类型" width="120" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.product_type || '未分类' }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="价格" width="120" align="center">
            <template #default="{ row }">
              <div class="font-semibold text-green-600" v-if="row.variants && row.variants.length > 0">
                ${{ row.variants[0].price }}
              </div>
              <div class="text-gray-400" v-else>-</div>
            </template>
          </el-table-column>

          <el-table-column label="库存" width="100" align="center">
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

          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.status === 'active' ? 'success' : 'warning'"
                size="small"
              >
                {{ row.status === 'active' ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="创建时间" width="150" align="center">
            <template #default="{ row }">
              <div class="text-sm text-gray-600">
                {{ formatDate(row.created_at) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" align="center" fixed="right">
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
                <el-button
                  type="warning"
                  size="small"
                  @click="editProduct(row)"
                  link
                >
                  编辑
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

// 计算属性 - 过滤后的商品
const filteredProducts = computed(() => {
  if (!searchQuery.value) {
    return mockProducts.value
  }
  return mockProducts.value.filter(product => 
    product.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    product.vendor.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 计算属性 - 当前页商品
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredProducts.value.slice(start, end)
})

// 方法
const fetchProducts = async () => {
  loading.value = true
  try {
    // 这里应该调用“获取产品列表”API接口
    // http://localhost:3000/api/products?limit=10
    products.value = paginatedProducts.value
    totalProducts.value = filteredProducts.value.length
    
  } catch (error) {
    console.error('获取商品失败:', error)
    ElMessage.error('获取商品数据失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}

const refreshProducts = () => {
  currentPage.value = 1
  fetchProducts()
}

const handleSearch = () => {
  currentPage.value = 1
  products.value = paginatedProducts.value
  totalProducts.value = filteredProducts.value.length
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
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

// 生命周期
onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
/* 自定义样式可以在这里添加，主要使用 UnoCSS */
.el-table {
  --el-table-border-color: #e5e7eb;
}

.el-pagination {
  --el-pagination-button-color: #6b7280;
  --el-pagination-hover-color: #3b82f6;
}
</style>
