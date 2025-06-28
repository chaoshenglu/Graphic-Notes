<template>
  <div class="p-6 max-w-md mx-auto">
    <h2 class="text-2xl font-bold mb-6 text-gray-800">设置</h2>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Host</label>
        <input 
          v-model="host"
          type="text" 
          placeholder="请输入Host地址"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">API Key</label>
        <input 
          v-model="apikey"
          placeholder="请输入API Key"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <el-button type="primary" @click="saveSettings" class="w-full">
        保存设置
      </el-button >
      
      <div v-if="saveMessage" class="text-center text-sm" :class="saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'">
        {{ saveMessage.text }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const host = ref('')
const apikey = ref('')
const saveMessage = ref(null)

onMounted(() => {
  const savedHost = window.localStorage.getItem('lx_host')
  const savedApikey = window.localStorage.getItem('lx_doubao')
  
  if (savedHost) {
    host.value = savedHost
  }
  if (savedApikey) {
    apikey.value = savedApikey
  }
})

const saveSettings = () => {
  try {
    window.localStorage.setItem('lx_host', host.value)
    window.localStorage.setItem('lx_doubao', apikey.value)
    window.lx_host =  host.value
    window.lx_doubao =  apikey.value
    saveMessage.value = {
      type: 'success',
      text: '设置保存成功！'
    }
    setTimeout(() => {
      saveMessage.value = null
    }, 3000)
  } catch (error) {
    saveMessage.value = {
      type: 'error',
      text: '保存失败，请重试！'
    }
    setTimeout(() => {
      saveMessage.value = null
    }, 3000)
  }
}
</script>