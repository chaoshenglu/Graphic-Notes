<template>
  <div class="editor-wrapper">
    <!-- 编辑器头部操作栏 -->
    <div class="editor-actions">
      <div class="title-input-container">
        <input 
          v-model="noteTitle"
          type="text" 
          placeholder="请输入笔记标题..."
          class="title-input"
          maxlength="100"
        >
      </div>
      <button @click="saveNote" :disabled="isSaving" class="save-btn btn btn-success">
        <span v-if="isSaving">💾 保存中...</span>
        <span v-else>{{ noteId ? '💾 更新笔记' : '💾 保存笔记' }}</span>
      </button>
    </div>
    
    <div class="rich-editor card">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-group">
          <button 
            @click="execCommand('bold')"
            :class="{ active: isActive('bold') }"
            class="toolbar-btn"
            title="加粗"
          >
            <strong>B</strong>
          </button>
          
          <button 
            @click="execCommand('italic')"
            :class="{ active: isActive('italic') }"
            class="toolbar-btn"
            title="斜体"
          >
            <em>I</em>
          </button>
          
          <button 
            @click="execCommand('underline')"
            :class="{ active: isActive('underline') }"
            class="toolbar-btn"
            title="下划线"
          >
            <u>U</u>
          </button>
          
          <button 
            @click="execCommand('strikeThrough')"
            :class="{ active: isActive('strikeThrough') }"
            class="toolbar-btn"
            title="删除线"
          >
            <s>S</s>
          </button>
        </div>
        
        <div class="toolbar-separator"></div>
        
        <div class="toolbar-group">
          <!-- 文字颜色 -->
          <div class="color-picker">
            <label for="textColor" class="color-label">🎨</label>
            <input 
              type="color" 
              id="textColor"
              @change="changeTextColor"
              value="#000000"
              class="color-input"
            >
          </div>
          
          <!-- 字号选择 -->
          <select @change="changeFontSize" title="字号" class="font-size-select">
            <option value="1">小号</option>
            <option value="3" selected>正常</option>
            <option value="5">大号</option>
            <option value="7">特大</option>
          </select>
        </div>
        
        <div class="toolbar-separator"></div>
        
        <div class="toolbar-group">
          <!-- 撤销和前进 -->
          <button 
            @click="undo"
            :disabled="!canUndo"
            class="toolbar-btn"
            title="撤销"
          >
            ↶
          </button>
          
          <button 
            @click="redo"
            :disabled="!canRedo"
            class="toolbar-btn"
            title="重做"
          >
            ↷
          </button>
        </div>
        
        <div class="toolbar-separator"></div>
        
        <div class="toolbar-group">
          <div class="drag-hint">
            📎 拖拽图片到编辑区域
          </div>
        </div>
      </div>
      
      <!-- 编辑区域 -->
      <div 
        ref="editor"
        class="editor-content"
        contenteditable="true"
        @input="handleInput"
        @keydown="handleKeydown"
        @mouseup="updateToolbar"
        @keyup="updateToolbar"
        @paste="handlePaste"
        @drop="handleDrop"
        @dragenter="handleDragEnter"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        placeholder="开始记录你的想法..."
      >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, defineProps, defineEmits } from 'vue'
import notesDB from '../utils/database.js'

const props = defineProps({
  noteId: {
    type: Number,
    default: null
  },
  initialContent: {
    type: String,
    default: ''
  },
  initialTitle: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['noteSaved', 'noteUpdated'])

const editor = ref(null)
const noteTitle = ref('')
const canUndo = ref(false)
const canRedo = ref(false)
const history = ref([])
const historyIndex = ref(-1)
const maxHistory = 50
const isSaving = ref(false)

async function saveNote() {
  if (isSaving.value) return
  
  try {
    isSaving.value = true
    const content = editor.value.innerHTML.trim()
    const title = noteTitle.value.trim()
    
    if (!title) {
      alert('请输入笔记标题')
      return
    }
    
    if (!content || content === '<br>' || content === '<div><br></div>') {
      alert('请输入笔记内容')
      return
    }
    
    const userId = 1
    
    if (props.noteId) {
      // 更新现有笔记
      const updatedNote = await notesDB.updateNote(props.noteId, content, title)
      console.log('笔记更新成功:', updatedNote)
      emit('noteUpdated', updatedNote)
      alert('笔记更新成功！')
    } else {
      // 保存新笔记
      const savedNote = await notesDB.saveNote(userId, content, title)
      console.log('笔记保存成功:', savedNote)
      emit('noteSaved', savedNote)
      alert('笔记保存成功！')
    }
  } catch (error) {
    console.error('保存笔记失败:', error)
    alert('保存笔记失败: ' + error.message)
  } finally {
    isSaving.value = false
  }
}

// 执行编辑命令
const execCommand = (command, value = null) => {
  document.execCommand(command, false, value)
  saveState()
  updateToolbar()
  editor.value.focus()
}

// 检查命令是否激活
const isActive = (command) => {
  return document.queryCommandState(command)
}

// 改变文字颜色
const changeTextColor = (event) => {
  // 确保编辑器有焦点
  editor.value.focus()
  
  // 如果没有选中文本，尝试恢复之前的选区或选中所有内容
  const selection = window.getSelection()
  if (selection.rangeCount === 0 || selection.isCollapsed) {
    // 如果没有选区，选中编辑器中的所有内容
    const range = document.createRange()
    range.selectNodeContents(editor.value)
    selection.removeAllRanges()
    selection.addRange(range)
  }
  
  execCommand('foreColor', event.target.value)
}

// 改变字号
const changeFontSize = (event) => {
  execCommand('fontSize', event.target.value)
}

// 保存状态到历史记录
const saveState = () => {
  const content = editor.value.innerHTML
  
  // 如果内容没有变化，不保存
  if (history.value[historyIndex.value] === content) {
    return
  }
  
  // 删除当前位置之后的历史记录
  history.value = history.value.slice(0, historyIndex.value + 1)
  
  // 添加新状态
  history.value.push(content)
  historyIndex.value++
  
  // 限制历史记录数量
  if (history.value.length > maxHistory) {
    history.value.shift()
    historyIndex.value--
  }
  
  updateUndoRedo()
}

// 撤销
const undo = () => {
  if (canUndo.value) {
    historyIndex.value--
    editor.value.innerHTML = history.value[historyIndex.value]
    updateUndoRedo()
    updateToolbar()
  }
}

// 前进
const redo = () => {
  if (canRedo.value) {
    historyIndex.value++
    editor.value.innerHTML = history.value[historyIndex.value]
    updateUndoRedo()
    updateToolbar()
  }
}

// 更新撤销/前进按钮状态
const updateUndoRedo = () => {
  canUndo.value = historyIndex.value > 0
  canRedo.value = historyIndex.value < history.value.length - 1
}

// 处理输入
const handleInput = () => {
  saveState()
}

// 处理键盘事件
const handleKeydown = (event) => {
  // Ctrl+Z 撤销
  if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
    event.preventDefault()
    undo()
  }
  // Ctrl+Y 或 Ctrl+Shift+Z 前进
  else if ((event.ctrlKey && event.key === 'y') || 
           (event.ctrlKey && event.shiftKey && event.key === 'z')) {
    event.preventDefault()
    redo()
  }
}

// 更新工具栏状态
const updateToolbar = () => {
  // 这里可以添加更新工具栏按钮状态的逻辑
}

// 处理粘贴事件
const handlePaste = (event) => {
  // 检查剪贴板中是否有图片
  const items = (event.clipboardData || event.originalEvent.clipboardData).items
  
  for (const item of items) {
    if (item.type.indexOf('image') === 0) {
      event.preventDefault()
      
      const blob = item.getAsFile()
      convertImageToBase64(blob, insertImageAsBase64)
      return
    }
  }
}

// 处理拖拽事件
const handleDrop = (event) => {
  event.preventDefault()
  
  // 移除拖拽样式
  editor.value.classList.remove('drag-over')
  
  const files = event.dataTransfer.files
  
  for (const file of files) {
    if (file.type.indexOf('image') === 0) {
      convertImageToBase64(file, insertImageAsBase64)
      return
    }
  }
}

// 处理拖拽进入事件
const handleDragEnter = (event) => {
  event.preventDefault()
  
  // 立即获取焦点
  editor.value.focus()
  
  // 添加拖拽样式
  editor.value.classList.add('drag-over')
}

// 阻止默认拖拽行为并维持视觉反馈
const handleDragOver = (event) => {
  event.preventDefault()
  
  // 确保拖拽样式保持
  if (!editor.value.classList.contains('drag-over')) {
    editor.value.classList.add('drag-over')
  }
}

// 处理拖拽离开事件
const handleDragLeave = (event) => {
  // 只有当鼠标真正离开编辑器区域时才移除样式
  if (!editor.value.contains(event.relatedTarget)) {
    editor.value.classList.remove('drag-over')
  }
}

// 将图片转换为Base64
const convertImageToBase64 = (file, callback) => {
  const reader = new FileReader()
  
  reader.onload = (e) => {
    const base64String = e.target.result
    callback(base64String)
  }
  
  reader.readAsDataURL(file)
}

// 将Base64图片插入编辑器
const insertImageAsBase64 = (base64String) => {
  document.execCommand('insertHTML', false, `<img src="${base64String}" style="max-width: 100%;" />`)
  saveState()
}

// 初始化
onMounted(() => {
  // 加载初始内容和标题
  nextTick(() => {
    if (props.initialContent) {
      editor.value.innerHTML = props.initialContent
    }
    if (props.initialTitle) {
      noteTitle.value = props.initialTitle
    }
    saveState()
  })
})
</script>

<style scoped>
.editor-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

.title-input-container {
  flex: 1;
}

.title-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  background: white;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.title-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgb(79 70 229 / 0.1), var(--shadow-md);
}

.title-input::placeholder {
  color: var(--text-secondary);
  font-weight: 400;
}

.save-btn {
  font-size: 0.9375rem;
  font-weight: 600;
  padding: 0.875rem 1.75rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.rich-editor {
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.toolbar {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border-color);
  gap: 1rem;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolbar-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  min-width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-weight: 500;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.toolbar-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-btn:disabled:hover {
  background: white;
  transform: none;
  box-shadow: none;
}

.toolbar-separator {
  width: 1px;
  height: 1.5rem;
  background: var(--border-color);
  margin: 0 0.5rem;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem;
  border-radius: var(--radius-md);
  background: white;
  border: 1px solid var(--border-color);
}

.color-label {
  font-size: 0.875rem;
  cursor: pointer;
}

.color-input {
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  padding: 0;
  background: none;
}

.font-size-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  height: 2.25rem;
  min-width: 5rem;
  transition: all 0.2s ease;
}

.font-size-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgb(79 70 229 / 0.1);
}

.drag-hint {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  font-style: italic;
  padding: 0.25rem 0.5rem;
  background: rgba(79, 70, 229, 0.05);
  border-radius: var(--radius-sm);
  border: 1px dashed var(--primary-color);
}

.editor-content {
  min-height: 400px;
  padding: 2rem;
  outline: none;
  line-height: 1.7;
  font-size: 1rem;
  color: var(--text-primary);
  position: relative;
  background: white;
  transition: all 0.2s ease;
}

.editor-content:empty::before {
  content: attr(placeholder);
  color: var(--text-secondary);
  font-style: italic;
  pointer-events: none;
  position: absolute;
  top: 2rem;
  left: 2rem;
}

.editor-content:focus {
  background: #fefefe;
}

.editor-content.drag-over {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(124, 58, 237, 0.05));
  border: 2px dashed var(--primary-color);
  border-radius: var(--radius-md);
}

.editor-content p {
  margin: 0 0 1rem 0;
}

.editor-content p:last-child {
  margin-bottom: 0;
}

.editor-content h1,
.editor-content h2,
.editor-content h3,
.editor-content h4,
.editor-content h5,
.editor-content h6 {
  margin: 1.5rem 0 1rem 0;
  font-weight: 600;
  color: var(--text-primary);
}

.editor-content h1:first-child,
.editor-content h2:first-child,
.editor-content h3:first-child,
.editor-content h4:first-child,
.editor-content h5:first-child,
.editor-content h6:first-child {
  margin-top: 0;
}

.editor-content img {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  margin: 1.5rem 0;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.editor-content img:hover {
  box-shadow: var(--shadow-lg);
  transform: scale(1.02);
}

.editor-content blockquote {
  margin: 1.5rem 0;
  padding: 1rem 1.5rem;
  border-left: 4px solid var(--primary-color);
  background: var(--surface);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  font-style: italic;
  color: var(--text-secondary);
}

.editor-content ul,
.editor-content ol {
  margin: 1rem 0;
  padding-left: 2rem;
}

.editor-content li {
  margin: 0.5rem 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .title-input-container {
    max-width: none;
  }
  
  .title-input {
    padding: 0.75rem;
    font-size: 0.9375rem;
  }
  
  .save-btn {
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
  }
  
  .toolbar {
    padding: 0.75rem 1rem;
    gap: 0.75rem;
  }
  
  .toolbar-group {
    gap: 0.25rem;
  }
  
  .toolbar-btn {
    padding: 0.375rem 0.5rem;
    min-width: 2rem;
    height: 2rem;
    font-size: 0.8125rem;
  }
  
  .font-size-select {
    height: 2rem;
    font-size: 0.8125rem;
    min-width: 4rem;
  }
  
  .editor-content {
    padding: 1.5rem 1rem;
    min-height: 300px;
  }
  
  .editor-content:empty::before {
    top: 1.5rem;
    left: 1rem;
  }
  
  .drag-hint {
    display: none;
  }
}

@media (max-width: 480px) {
  .title-input {
    padding: 0.625rem;
    font-size: 0.875rem;
  }
  
  .save-btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.8125rem;
  }
  
  .toolbar {
    padding: 0.5rem;
    gap: 0.5rem;
  }
  
  .editor-content {
    padding: 1rem;
  }
  
  .editor-content:empty::before {
    top: 1rem;
    left: 1rem;
  }
}
</style>