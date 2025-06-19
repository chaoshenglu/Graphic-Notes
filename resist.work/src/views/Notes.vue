<template>
  <div class="notes-module">
    <!-- 笔记列表模式 -->
    <div v-if="!currentNote" class="notes-list-container">
      <div class="list-header">
        <h2 class="list-title">我的笔记</h2>
        <button @click="createNewNote" class="new-note-btn">
          ✨ 新建笔记
        </button>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="notes.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h3 class="empty-title">还没有笔记</h3>
        <p class="empty-description">点击"新建笔记"开始记录你的想法</p>
      </div>
      
      <div v-else class="notes-grid">
        <div 
          v-for="note in notes" 
          :key="note.id" 
          class="note-card"
          @click="openNote(note.id)"
        >
          <div class="note-title">{{ note.title }}</div>
          <div class="note-preview">{{ getPreviewText(note.content) }}</div>
          <div class="note-meta">
            <div class="note-date">
              <span>🕒</span>
              <span>{{ formatDate(note.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分页控件 -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          ← 上一页
        </button>
        
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        
        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          下一页 →
        </button>
      </div>
    </div>
    
    <!-- 编辑器模式 -->
    <div v-else class="editor-container">        
      <RichEditor 
        :noteId="currentNote.id" 
        :initialContent="currentNote.content"
        :initialTitle="currentNote.title"
        @noteSaved="handleNoteSaved"
        @noteUpdated="handleNoteUpdated"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import RichEditor from '../components/RichEditor.vue'
import notesDB from '../utils/database.js'

// 应用状态
const notes = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalPages = ref(0)
const totalNotes = ref(0)
const loading = ref(false)
const currentNote = ref(null)
const userId = ref(null)

// 初始化
onMounted(async () => {
  try {
    userId.value = 1
    loadNotes()
  } catch (error) {
    console.error('初始化失败:', error)
  }
})

// 加载笔记列表
async function loadNotes() {
  try {
    loading.value = true
    
    const result = await notesDB.getNotesByUser(
      userId.value, 
      currentPage.value, 
      pageSize.value
    )
    
    notes.value = result.notes
    totalPages.value = result.totalPages
    totalNotes.value = result.total
  } catch (error) {
    console.error('加载笔记列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 切换页码
async function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  
  currentPage.value = page
  await loadNotes()
}

// 创建新笔记
function createNewNote() {
  currentNote.value = { id: null, content: '', title: '' }
}

// 打开笔记
async function openNote(noteId) {
  try {
    loading.value = true
    const note = await notesDB.getNoteById(noteId)
    currentNote.value = note
  } catch (error) {
    console.error('打开笔记失败:', error)
    alert('打开笔记失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 返回笔记列表
function backToList() {
  currentNote.value = null
  loadNotes() // 刷新列表
}

// 处理笔记保存事件
function handleNoteSaved(note) {
  backToList()
}

// 处理笔记更新事件
function handleNoteUpdated(note) {
  backToList()
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取笔记内容预览文本
function getPreviewText(htmlContent) {
  if (!htmlContent) return '暂无内容'
  
  // 创建临时DOM元素来解析HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlContent
  
  // 获取纯文本
  const textContent = tempDiv.textContent || tempDiv.innerText || ''
  
  // 取前120个字符作为预览
  const preview = textContent.trim().substring(0, 120)
  
  return preview || '暂无内容'
}
</script>

<style scoped>
/* 笔记模块样式 */
.notes-module {
  animation: fadeIn 0.3s ease;
}

.notes-list-container {
  animation: fadeIn 0.3s ease;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.list-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.new-note-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  color: white;
  border: none;
  padding: 0.875rem 1.75rem;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}

.new-note-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.new-note-btn:hover::before {
  left: 100%;
}

.new-note-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
  font-size: 1rem;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.empty-description {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.note-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.note-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, var(--primary-color), #7c3aed);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.note-card:hover::before {
  transform: scaleX(1);
}

.note-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.note-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-preview {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.note-date {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.page-btn {
  background: white;
  border: 1px solid var(--border-color);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
  padding: 0.75rem 1rem;
}

/* 编辑器容器样式 */
.editor-container {
  animation: slideIn 0.3s ease;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notes-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .note-card {
    padding: 1rem;
  }
  
  .list-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .new-note-btn {
    width: 100%;
    justify-content: center;
  }
  
  .pagination {
    gap: 0.25rem;
  }
  
  .page-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }
}
</style>