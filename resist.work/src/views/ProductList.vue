<template>
  <div class="product-list">
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
      
      <el-table-column prop="shopify_id" label="Shopify ID" width="150">
        <template #default="{ row }">
          {{ row.shopify_id || '未设置' }}
        </template>
      </el-table-column>
      
      <el-table-column prop="title_cn" label="产品标题" min-width="200" show-overflow-tooltip />
      
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="viewDetail(row)">
            查看详情
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

// 响应式数据
const productList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取产品列表
const fetchProductList = async () => {
  loading.value = true
  try {
    const response = await axios.get(`${window.lx_host}/products`, {
      params: {
        page: currentPage.value,
        limit: pageSize.value
      }
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

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
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

// 删除产品（功能留空）
const deleteProduct = (row) => {
  ElMessageBox.confirm(
    `确定要删除产品 "${row.title_cn}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    ElMessage.info(`删除产品: ${row.title_cn}`)
    // TODO: 实现删除功能
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 组件挂载时获取数据
onMounted(() => {
  fetchProductList()
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