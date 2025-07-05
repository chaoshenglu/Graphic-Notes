<template>
  <el-dialog v-model="visible" title="编辑标题" width="600px" :center="true" @close="handleClose">
    <el-form :model="formData" label-width="120px" label-position="left">
      <el-form-item label="中文标题:">
        <el-input v-model="formData.title_cn" placeholder="请输入中文标题" />
      </el-form-item>
      
      <el-form-item label="英文标题:">
        <el-input v-model="formData.title_en" placeholder="请输入英文标题" />
      </el-form-item>
      
      <el-form-item label="中文SEO标题:">
        <el-input v-model="formData.seo_title_cn" placeholder="请输入中文SEO标题" />
      </el-form-item>
      
      <el-form-item label="英文SEO标题:">
        <el-input v-model="formData.seo_title_en" placeholder="请输入英文SEO标题" />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <span class="flex justify-end gap-3">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  productId: {
    type: String,
    required: true
  },
  titleData: {
    type: Object,
    default: () => ({
      title_cn: '',
      title_en: '',
      seo_title_cn: '',
      seo_title_en: ''
    })
  }
})

const emit = defineEmits(['update:modelValue', 'save-success'])

const visible = ref(false)
const saving = ref(false)
const formData = ref({
  title_cn: '',
  title_en: '',
  seo_title_cn: '',
  seo_title_en: ''
})

// 监听弹框显示状态
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal) {
    // 弹框打开时，初始化表单数据
    formData.value = {
      title_cn: props.titleData.title_cn || '',
      title_en: props.titleData.title_en || '',
      seo_title_cn: props.titleData.seo_title_cn || '',
      seo_title_en: props.titleData.seo_title_en || ''
    }
  }
})

// 监听弹框关闭
watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

const handleClose = () => {
  visible.value = false
}

const handleSave = async () => {
  try {
    saving.value = true
    
    // 调用API保存数据
    const updateData = {
      title_cn: formData.value.title_cn,
      title_en: formData.value.title_en,
      seo_title_cn: formData.value.seo_title_cn,
      seo_title_en: formData.value.seo_title_en
    }
    
    await axios.put(`${window.lx_host}/products/${props.productId}`, updateData)
    
    ElMessage.success('标题保存成功')
    
    // 通知父组件保存成功
    emit('save-success', formData.value)
    
    // 关闭弹框
    handleClose()
    
  } catch (error) {
    console.error('保存标题失败:', error)
    ElMessage.error('保存标题失败：' + (error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.el-form-item {
  margin-bottom: 20px;
}
</style>