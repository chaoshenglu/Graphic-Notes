<template>
  <el-dialog
    v-model="visible"
    title="编辑SKU信息"
    width="500px"
    :before-close="handleClose"
    class="sku-edit-modal"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      label-position="left"
    >
      <el-form-item label="中文名称" prop="skuNameCn">
        <el-input
          v-model="formData.skuNameCn"
          placeholder="请输入中文名称"
          clearable
        />
      </el-form-item>
      
      <el-form-item label="英文名称" prop="skuNameEn">
        <el-input
          v-model="formData.skuNameEn"
          placeholder="请输入英文名称"
          clearable
        />
      </el-form-item>
      
      <el-form-item label="价格" prop="price">
        <el-input-number
          v-model="formData.price"
          :min="0"
          :precision="2"
          :step="0.01"
          placeholder="请输入价格"
          style="width: 100%"
        />
      </el-form-item>
      
      <el-form-item label="SKU图片">
        <div class="sku-image-preview">
          <img 
            v-if="formData.skuImageUrl" 
            :src="formData.skuImageUrl" 
            :alt="formData.skuNameCn"
            class="preview-image"
          />
          <div v-else class="no-image">
            暂无图片
          </div>
        </div>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleSave"
          :loading="saving"
        >
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  skuData: {
    type: Object,
    default: () => ({})
  },
  productId: {
    type: String,
    required: true
  },
  skuIndex: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'save-success'])

const visible = ref(false)
const saving = ref(false)
const formRef = ref()

const formData = reactive({
  skuNameCn: '',
  skuNameEn: '',
  price: null,
  skuImageUrl: ''
})

const rules = {
  skuNameCn: [
    { required: true, message: '请输入中文名称', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格不能小于0', trigger: 'blur' }
  ]
}

// 监听弹窗显示状态
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal && props.skuData) {
    // 初始化表单数据
    Object.assign(formData, {
      skuNameCn: props.skuData.skuNameCn || '',
      skuNameEn: props.skuData.skuNameEn || '',
      price: props.skuData.price || null,
      skuImageUrl: props.skuData.skuImageUrl || ''
    })
  }
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 关闭弹窗
const handleClose = () => {
  visible.value = false
  // 重置表单
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 保存SKU信息
const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    // 验证表单
    await formRef.value.validate()
    
    saving.value = true
    
    // 获取当前产品完整信息
    const productResponse = await axios.get(`${window.lx_host}/products/${props.productId}`)
    const productData = productResponse.data.data
    
    // 更新指定SKU的信息
    if (productData.sku_data && productData.sku_data[props.skuIndex]) {
      productData.sku_data[props.skuIndex] = {
        ...productData.sku_data[props.skuIndex],
        skuNameCn: formData.skuNameCn,
        skuNameEn: formData.skuNameEn,
        price: formData.price,
        skuImageUrl: formData.skuImageUrl
      }
    }
    
    // 调用API更新整个产品信息
    await axios.put(`${window.lx_host}/products/${props.productId}`, productData)
    
    ElMessage.success('SKU信息更新成功')
    
    // 通知父组件保存成功
    emit('save-success', {
      index: props.skuIndex,
      data: {
        skuNameCn: formData.skuNameCn,
        skuNameEn: formData.skuNameEn,
        price: formData.price,
        skuImageUrl: formData.skuImageUrl
      }
    })
    
    // 关闭弹窗
    handleClose()
    
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 表单验证失败
      return
    }
    
    console.error('保存SKU信息失败:', error)
    ElMessage.error('保存失败：' + (error.response?.data?.message || error.message))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.sku-edit-modal :deep(.el-dialog__header) {
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.sku-edit-modal :deep(.el-dialog__title) {
  font-weight: 600;
  color: #212529;
}

.sku-image-preview {
  width: 100px;
  height: 100px;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  color: #6c757d;
  font-size: 12px;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #495057;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__wrapper) {
  width: 100%;
}
</style>