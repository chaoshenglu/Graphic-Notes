<template>
  <div class="detail-generate">
    <div class="card">
      <div class="card-header">
        <h2>生成产品详情页</h2>
      </div>
      <div class="card-body">
        <!-- 输入框区域 -->
        <div class="input-group">
          <div class="form-field">
            <label for="id-input">ID:</label>
            <input 
              id="id-input"
              v-model="formData.id" 
              type="text" 
              class="form-input" 
              placeholder="请输入ID"
            />
          </div>
          <div class="form-field">
            <label for="count-input">图片数量:</label>
            <input 
              id="count-input"
              v-model="formData.count" 
              type="number" 
              class="form-input" 
              placeholder="请输入图片数量"
              min="1"
            />
          </div>
        </div>
        
        <!-- 生成按钮 -->
        <div class="button-group">
          <button 
            @click="generateCode" 
            class="btn btn-primary"
            :disabled="!formData.id || !formData.count"
          >
            生成源代码
          </button>
        </div>
        
        <!-- 代码展示区域 -->
        <div v-if="showCodeArea" class="code-section">
          <label for="code-area">生成的代码:</label>
          <textarea 
            id="code-area"
            v-model="generatedCode" 
            class="code-textarea"
            placeholder="生成的代码将在这里显示..."
            rows="10"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// 表单数据
const formData = reactive({
  id: '',
  count: 1
})

// 生成的代码
const generatedCode = ref('')
// 是否显示代码区域
const showCodeArea = ref(false)

// 生成随机字符串
const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789{}[]();,.<>/?"\':|-=+_*&^%$#@!~`'
  const codeTemplates = [
    'function generateImage(id, count) {\n  const images = [];\n  for(let i = 0; i < count; i++) {\n    images.push(`image_${id}_${i}.jpg`);\n  }\n  return images;\n}',
    'const config = {\n  id: "{{ID}}",\n  count: {{COUNT}},\n  format: "jpg",\n  quality: 0.8\n};\n\nconst result = processImages(config);',
    'import { createImage } from "./utils";\n\nclass ImageGenerator {\n  constructor(id, count) {\n    this.id = id;\n    this.count = count;\n  }\n  \n  generate() {\n    return Array.from({length: this.count}, (_, i) => \n      createImage(this.id + "_" + i)\n    );\n  }\n}'
  ]
  
  // 随机选择一个模板
  let template = codeTemplates[Math.floor(Math.random() * codeTemplates.length)]
  
  // 替换模板中的占位符
  template = template.replace(/{{ID}}/g, formData.id)
  template = template.replace(/{{COUNT}}/g, formData.count)
  
  // 添加一些随机字符
  const randomSuffix = Array.from({length: 20}, () => 
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('')
  
  return template + '\n\n// Random: ' + randomSuffix
}

// 生成源代码
const generateCode = () => {
  generatedCode.value = generateRandomCode()
  showCodeArea.value = true
}
</script>

<style scoped>
.detail-generate {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--surface);
}

.card-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.card-body {
  padding: 1.5rem;
}

.input-group {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgb(79 70 229 / 0.1);
}

.button-group {
  margin-bottom: 1.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
  box-shadow: var(--shadow-md);
}

.code-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.code-section label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.code-textarea {
  width: 100%;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8125rem;
  line-height: 1.5;
  background: #f8fafc;
  resize: vertical;
  min-height: 200px;
}

.code-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgb(79 70 229 / 0.1);
}

@media (max-width: 768px) {
  .detail-generate {
    padding: 1rem;
  }
  
  .card-header,
  .card-body {
    padding: 1rem;
  }
}
</style>