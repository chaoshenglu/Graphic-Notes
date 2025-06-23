<template>
  <div class="product-detail">
    <div class="product-titles">
      <h1 class="title-cn">{{ productData?.title_cn || 'No Chinese Title' }}</h1>
      <h2 class="title-en">{{ productData?.title_en || 'No English Title' }}</h2>
    </div>
    <div class="product-ids">
      <div class="id-item">
        <span class="id-label">Product ID:</span>
        <span class="id-value">{{ productData?.product_id || 'N/A' }}</span>
      </div>
      <div class="id-item">
        <span class="id-label">Shopify ID:</span>
        <span class="id-value">{{ productData?.shopify_id || 'N/A' }}</span>
      </div>
    </div>
    <div class="main-images-section">
      <h3 class="section-title">主图展示</h3>
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
      <h3 class="section-title">规格选择</h3>
      <div class="sku-container">
        <div 
          v-for="(sku, index) in productData?.sku_data || []" 
          :key="index" 
          class="sku-item"
        >
          <div class="sku-image">
            <img :src="sku.skuImageUrl" :alt="sku.skuNameCn" />
          </div>
          <div class="sku-info">
            <div class="sku-name-cn">{{ sku.skuNameCn }}</div>
            <div class="sku-name-en">{{ sku.skuNameEn || 'No English Name' }}</div>
            <div class="sku-price">{{ sku.price ? `¥${sku.price}` : '价格待定' }}</div>
          </div>
        </div>
        <div v-if="!productData?.sku_data?.length" class="no-sku">
          暂无规格信息
        </div>
      </div>
    </div>
    <div class="detail-images-section">
      <h3 class="section-title">详情图片</h3>
      <div class="detail-images-container">
        <div 
          v-for="(image, index) in productData?.detail_images_cn || []" 
          :key="index" 
          class="detail-image-item"
        >
          <img :src="image" :alt="`详情图 ${index + 1}`" />
        </div>
        <div v-if="!productData?.detail_images_cn?.length" class="no-images">
          暂无详情图片
        </div>
      </div>
    </div>
    <div class="param-section">
      <div v-html="productData?.param_info_cn || '<p>暂无参数信息</p>'"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
const route = useRoute()
const productData = ref(null)
const loading = ref(false)
const error = ref(null)

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

onMounted(() => {
  const productId = route.params.id || '784411309594'
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

.title-en {
  font-size: 20px;
  font-weight: 400;
  color: #6c757d;
  margin: 0;
  line-height: 1.4;
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
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 200px;
  background: #fff;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.sku-item:hover {
  border-color: #007bff;
  box-shadow: 0 6px 20px rgba(0, 123, 255, 0.15);
  transform: translateY(-3px);
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
}

.detail-image-item:hover {
  transform: scale(1.02);
}

.detail-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  
  .title-cn {
    font-size: 24px;
  }
  
  .title-en {
    font-size: 18px;
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