// 数据库工具类
class NotesDatabase {
  constructor() {
    this.dbName = 'NotesDB'
    this.version = 1
    this.storeName = 'notes'
    this.db = null
  }

  // 初始化数据库
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => {
        reject(new Error('数据库打开失败'))
      }
      
      request.onsuccess = (event) => {
        this.db = event.target.result
        resolve(this.db)
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // 创建笔记存储对象
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true
          })
          
          // 创建索引
          store.createIndex('userId', 'userId', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
          store.createIndex('updatedAt', 'updatedAt', { unique: false })
        }
      }
    })
  }

  // 保存笔记
  async saveNote(userId, content, title = '') {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const note = {
        userId,
        title: title || this.extractTitle(content),
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const request = store.add(note)
      
      request.onsuccess = () => {
        resolve({ ...note, id: request.result })
      }
      
      request.onerror = () => {
        reject(new Error('保存笔记失败'))
      }
    })
  }

  // 更新笔记
  async updateNote(id, content, title = '') {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      // 先获取现有笔记
      const getRequest = store.get(id)
      
      getRequest.onsuccess = () => {
        const note = getRequest.result
        if (!note) {
          reject(new Error('笔记不存在'))
          return
        }
        
        // 更新笔记
        note.title = title || this.extractTitle(content)
        note.content = content
        note.updatedAt = new Date().toISOString()
        
        const putRequest = store.put(note)
        
        putRequest.onsuccess = () => {
          resolve(note)
        }
        
        putRequest.onerror = () => {
          reject(new Error('更新笔记失败'))
        }
      }
      
      getRequest.onerror = () => {
        reject(new Error('获取笔记失败'))
      }
    })
  }

  // 获取用户的笔记列表（支持分页）
  async getNotesByUser(userId, page = 1, pageSize = 10) {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('userId')
      
      const notes = []
      let count = 0
      let skipped = 0
      const skipCount = (page - 1) * pageSize
      
      // 按创建时间倒序获取
      const request = index.openCursor(IDBKeyRange.only(userId), 'prev')
      
      request.onsuccess = (event) => {
        const cursor = event.target.result
        
        if (cursor) {
          if (skipped < skipCount) {
            skipped++
            cursor.continue()
            return
          }
          
          if (count < pageSize) {
            notes.push(cursor.value)
            count++
            cursor.continue()
          } else {
            // 获取总数
            this.getTotalCount(userId).then(total => {
              resolve({
                notes,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
              })
            })
          }
        } else {
          // 没有更多数据
          this.getTotalCount(userId).then(total => {
            resolve({
              notes,
              total,
              page,
              pageSize,
              totalPages: Math.ceil(total / pageSize)
            })
          })
        }
      }
      
      request.onerror = () => {
        reject(new Error('获取笔记列表失败'))
      }
    })
  }

  // 获取用户笔记总数
  async getTotalCount(userId) {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('userId')
      
      const request = index.count(IDBKeyRange.only(userId))
      
      request.onsuccess = () => {
        resolve(request.result)
      }
      
      request.onerror = () => {
        reject(new Error('获取笔记总数失败'))
      }
    })
  }

  // 根据ID获取笔记
  async getNoteById(id) {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      
      const request = store.get(id)
      
      request.onsuccess = () => {
        resolve(request.result)
      }
      
      request.onerror = () => {
        reject(new Error('获取笔记失败'))
      }
    })
  }

  // 删除笔记
  async deleteNote(id) {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const request = store.delete(id)
      
      request.onsuccess = () => {
        resolve(true)
      }
      
      request.onerror = () => {
        reject(new Error('删除笔记失败'))
      }
    })
  }

  // 从HTML内容中提取标题
  extractTitle(htmlContent) {
    // 创建临时DOM元素来解析HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    
    // 获取纯文本
    const textContent = tempDiv.textContent || tempDiv.innerText || ''
    
    // 取前50个字符作为标题
    const title = textContent.trim().substring(0, 50)
    
    return title || '无标题笔记'
  }
}

// 创建单例实例
const notesDB = new NotesDatabase()

export default notesDB