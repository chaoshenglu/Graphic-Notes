<template>
  <div class="product-list">
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <img src="/src/assets/tmall.webp" style="width: 100px;">
            <el-input
              v-model="searchQuery"
              style="flex-shrink:0;"
              placeholder="搜索商品名称/product_id/shopify_id"
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
            共 {{ total }} 个商品
          </div>
        </div>
      </div>
    <el-table 
      :data="productList" 
      v-loading="loading"
      style="width: 100%"
      stripe
    >
      <el-table-column label="主图" width="120">
        <template #default="{ row }">
          <el-image
            v-if="row.main_images_cn && row.main_images_cn[0]"
            :src="row.main_images_cn[0]"
            style="width: 80px; height: 80px"
            fit="cover"
            :preview-src-list="[row.main_images_cn[0]]"
            :preview-teleported="true"
          />
          <span v-else>暂无图片</span>
        </template>
      </el-table-column>
      
      <el-table-column prop="product_id" label="产品ID" width="150" />
      
      <el-table-column prop="is_ugly" label="是否推荐" width="190">
        <template #default="{ row }">
          {{ row.is_ugly ? '❌' : '👍' }}
        </template>
      </el-table-column>
      
      <el-table-column prop="title_cn" label="产品标题" min-width="200" show-overflow-tooltip />
      
      <el-table-column prop="is_ok" label="核对数据" width="90">
        <template #default="{ row }">
            <el-tag v-if="row.is_ok" type="success" class="cursor-pointer" @click="switchIsOk(row)">已核对</el-tag>
            <el-tag v-else type="info" @click="switchIsOk(row)" class="cursor-pointer">未核对</el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="290" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="viewDetail(row)">
            查看
          </el-button>
          <el-button type="primary" size="small" @click="viewTmallDetail(row)">
            天猫
          </el-button>
          <el-button type="primary" size="small" @click="viewShopifyDetail(row)">
            独立站
          </el-button>
          <el-button type="danger" size="small" @click="deleteProduct(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页组件 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const searchQuery = ref('')
// 响应式数据
const productList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 搜索防抖定时器
let searchTimer = null

// 搜索功能 - 支持商品名称/product_id/shopify_id搜索
function handleSearch() {
  // 清除之前的定时器
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  
  // 设置防抖，500ms后执行搜索
  searchTimer = setTimeout(() => {
    // 重置到第一页
    currentPage.value = 1
    // 重新获取产品列表
    fetchProductList()
  }, 500)
}

// 刷新产品列表
function refreshProducts() {
  // 清空搜索条件
  searchQuery.value = ''
  // 重置到第一页
  currentPage.value = 1
  // 重新获取产品列表
  fetchProductList()
}

function viewTmallDetail(row) {
  const url = `https://detail.tmall.com/item.htm?id=${row.product_id}`
  window.open(url, '_blank')
}

function viewShopifyDetail(row) {
  const url = `https://admin.shopify.com/store/a1jefv-w4/products/${row.shopify_id}`
  window.open(url, '_blank')
}

const switchIsOk = async (row) => {
  let current_is_ok = row.is_ok || 0
  try {
    const productId = row.product_id
    console.log('row :', row);
    console.log('productId :', productId);
    const updateData = {
      ...row,
      is_ok: current_is_ok == 0 ? 1 : 0
    }
    await axios.put(`${window.lx_host}/products/${productId}`, updateData)
    row.is_ok = !row.is_ok
  } catch (error) {
    ElMessage.error('更新失败：' + (error.response?.data?.message || error.message))
  }
}

// 获取产品列表
const fetchProductList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    
    // 如果有搜索关键词，添加到参数中
    if (searchQuery.value && searchQuery.value.trim()) {
      params.keyword = searchQuery.value.trim()
    }
    
    const response = await axios.get(`${window.lx_host}/products`, {
      params
    })
    
    if (response.data.success) {
      productList.value = response.data.data
      total.value = response.data.pagination.total
    } else {
      ElMessage.error('获取产品列表失败')
    }
  } catch (error) {
    console.error('获取产品列表错误:', error)
    ElMessage.error('网络请求失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchProductList()
}

// 当前页改变
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchProductList()
}

// 查看详情
const viewDetail = (row) => {
  if (!row.product_id) {
    ElMessage.error('产品ID不存在，无法查看详情')
    return
  }
  
  // 跳转到产品详情页面
  router.push({
    name: 'ProductDetail',
    params: {
      id: row.product_id
    }
  })
}

// 删除产品 (DELETE /products/:id)
const deleteProduct = (row) => {
  if (!row.product_id) {
    ElMessage.error('产品ID不存在，无法删除')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除产品 "${row.title_cn}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      loading.value = true
      const response = await axios.delete(`${window.lx_host}/products/${row.product_id}`)
      
      if (response.data.success) {
        ElMessage.success('产品删除成功')
        // 如果当前页只有一条数据且不是第一页，则跳转到上一页
        if (productList.value.length === 1 && currentPage.value > 1) {
          currentPage.value--
        }
        // 重新获取产品列表
        await fetchProductList()
      } else {
        ElMessage.error(response.data.message || '删除失败')
      }
    } catch (error) {
      console.error('删除产品错误:', error)
      if (error.response && error.response.status === 404) {
        ElMessage.error('产品不存在或已被删除')
      } else {
        ElMessage.error('删除失败，请稍后重试')
      }
    } finally {
      loading.value = false
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

onMounted(() => {
  document.title = 'Hauty商品列表'
  fetchProductList()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
})
</script>

<style scoped>
.product-list {
  padding: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.el-image {
  border-radius: 4px;
}
</style>