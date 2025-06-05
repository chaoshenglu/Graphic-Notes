<template>
  <div id="app-container">
    <div class="actions-bar">
      <button class="top-btn" @click="handleAll" :disabled="isLoading">
        {{ viewMode === "editor" ? "全部" : "返回" }}
      </button>
      <button v-if="viewMode === 'editor'" class="top-btn" @click="handleRefresh" :disabled="isSaveButtonDisabled">
        刷新
      </button>
      <button v-if="viewMode === 'editor'" class="top-btn" @click="handleDelete" :disabled="isSaveButtonDisabled">
        删除
      </button>
      <button v-if="viewMode === 'editor'" class="top-btn" @click="handleSave" :disabled="isSaveButtonDisabled">
        保存
      </button>
      <input v-if="viewMode === 'list'" v-model="keyword" type="text" placeholder="搜索..." class="search-input"
        @keyup.enter="handleSearchEnter" />
      <img src="/images/search.svg" class="search-icon" @click="handleSearch">
      <video ref="saveAnimation" muted playsinline class="save-animation" :class="{ visible: isAnimationVisible }"
        @ended="hideAnimation">
        <source src="/images/save.webm" type="video/webm" />
      </video>
    </div>

    <div v-if="viewMode === 'editor' && showEditor" class="rich-text-editor">
      <div class="title-input-container">
        <input type="text" v-model="currentNoteTitle" placeholder="请输入笔记标题" class="note-title-input"
          @focus="handleTitleFocus" />
      </div>

      <div class="toolbar">
        <button @click="execCommand('bold')"><b>B</b></button>
        <button @click="execCommand('italic')"><i>I</i></button>
        <select @change="changeFontSize($event.target.value)">
          <option value="1">10px</option>
          <option value="2">13px</option>
          <option value="3" selected>16px</option>
          <option value="4">18px</option>
          <option value="5">24px</option>
          <option value="6">32px</option>
          <option value="7">48px</option>
        </select>
        <input type="color" @input="changeTextColor($event.target.value)" />
        <button @click="execCommand('strikeThrough')"><s>S</s></button>
        <button @click="execCommand('underline')"><u>U</u></button>
      </div>
      <div ref="editor" class="editor-area" contenteditable="true" @input="onInput" @paste="handlePaste"
        @blur="handleEditorBlurAfterOneSecond" @dragover="handleDragOver" @dragleave="handleDragLeave"
        @drop="handleDrop"></div>
    </div>

    <!-- All Notes List View -->
    <div v-if="viewMode === 'list'" class="notes-list-container">
      <ul v-if="paginatedNotes.length > 0" class="notes-list">
        <li v-for="note in paginatedNotes" :key="note.id" @click="handleNoteClick(note)" class="note-item">
          <div class="note-content">
            <div class="note-title">{{ note.title || "无标题笔记" }}</div>
            <div class="note-url" :title="note.url">{{ note.url }}</div>
          </div>
          <img src="/images/preview.svg" @mouseenter="showPreview(note)" @mouseleave="hidePreview"
            style="width: 20px;height: 20px;">
          <img src="/images/delete.svg" @click.stop="confirmDeleteNote(note)"
            style="width: 20px;height: 20px;margin-left: 10px;">
        </li>
      </ul>
      <p v-else-if="!isLoading && allNotes.length === 0">没有找到笔记。</p>
      <p v-else-if="isLoading && allNotes.length === 0">正在加载笔记...</p>
      <div v-if="totalPages > 1" class="pagination">
        <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
        <span>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">
          下一页
        </button>
      </div>

      <!-- 笔记预览窗口 -->
      <div v-if="previewVisible" class="note-preview" :style="previewPosition" @mouseenter="previewHovered = true"
        @mouseleave="mouseleavePreviewView">
        <div class="preview-header">
          <div class="preview-title">{{ previewNote.title || "无标题笔记" }}</div>
          <div class="preview-url">{{ previewNote.url }}</div>
        </div>
        <div class="preview-content" v-html="previewNote.content"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useNotesStore } from "./stores/notes";

const showEditor = computed(() => {
  return currentUrl.value && currentUrl.value != "chrome://newtab/";
});

const isSaveButtonDisabled = computed(() => {
  return isLoading.value || !currentUrl.value || currentUrl.value === "chrome://newtab/";
});
const notesStore = useNotesStore();
const editor = ref(null);
const content = ref(""); // 跟踪编辑器的 HTML 内容，将由 onInput 设置
// 添加一个变量来存储当前笔记中的图片URL和key的映射
const noteImages = ref(new Map());
const currentUrl = ref("");
const currentNoteId = ref(null);
const currentNoteTitle = ref("");
const isLoading = ref(false);
const viewMode = ref("editor"); // 'editor' or 'list'
const allNotes = ref([]);
const currentPage = ref(1);
const notesPerPage = ref(10);
const totalNotes = ref(0);
const totalPages = ref(0);
const saveAnimation = ref(null);
const isAnimationVisible = ref(false);
const skipNextAutoSave = ref(false); // 添加一个标志来控制是否跳过下一次自动保存
const keyword = ref("");

// 添加预览相关的状态变量
const previewVisible = ref(false);
const previewNote = ref({});
const previewPosition = ref({ top: '0px', left: '0px' });
const previewHovered = ref(false); // 添加标志，表示鼠标是否悬停在预览窗口上

// 显示笔记预览
const showPreview = (note) => {
  previewNote.value = note;
  previewVisible.value = true;
};

const mouseleavePreviewView = (note) => {
  previewHovered.value = false;
  hidePreview()
};

// 隐藏笔记预览
const hidePreview = () => {
  // 使用setTimeout延迟关闭预览窗口，给鼠标从note-item移动到预览窗口的时间
  setTimeout(() => {
    if (!previewHovered.value) {
      previewVisible.value = false;
    }
  }, 100);
};

const handleTitleFocus = () => {
  skipNextAutoSave.value = true; // 设置跳过下一次自动保存
};

const execCommand = (command, value = null) => {
  if (editor.value) {
    editor.value.focus();
    document.execCommand(command, false, value);
    updateContent();
  }
};

const changeFontSize = (size) => {
  if (editor.value) {
    editor.value.focus();
    document.execCommand("fontSize", false, size);
    updateContent();
  }
};

const changeTextColor = (color) => {
  if (editor.value) {
    editor.value.focus();
    document.execCommand("foreColor", false, color);
    updateContent();
  }
};

const updateContent = () => {
  if (editor.value) {
    const newContent = editor.value.innerHTML;
    // 检查是否有图片被删除
    checkDeletedImages(content.value, newContent);
    // 更新内容
    content.value = newContent;
  }
};

const getCurrentTabInfo = async () => {
  return new Promise((resolve, reject) => {
    if (chrome && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0 && tabs[0].url) {
          resolve({
            url: tabs[0].url,
            title: tabs[0].title || "",
          });
        } else {
          resolve({
            url: "",
            title: "",
          });
        }
      });
    } else {
      resolve({
        url: "",
        title: "",
      });
    }
  });
};

onMounted(async () => {
  if (editor.value) {
    document.execCommand("fontSize", false, "3"); // 设置默认字号
    editor.value.focus();
  }
  try {
    const { url: url } = await getCurrentTabInfo();
    currentUrl.value = url;
    loadNoteForCurrentUrl(url)
  } catch (error) {
    console.error("初始加载时出错:", error);
  }

  // 监听来自后台脚本的消息（例如 URL 更改）
  if (chrome && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "addSelectedText" && message.text) {
        // 如果当前在列表视图，切换到编辑器视图
        if (viewMode.value === "list") {
          viewMode.value = "editor";
        }

        // 处理添加选中文本的函数
        const processSelectedText = () => {
          setTimeout(() => {
            if (editor.value) {
              // 在当前光标位置或末尾插入选中的文本
              editor.value.innerHTML = content.value;
              const selection = window.getSelection();
              if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const textNode = document.createTextNode(message.text);
                range.insertNode(textNode);
                range.collapse(false);
              } else {
                // 如果没有选中范围，在末尾插入
                editor.value.innerHTML += message.text;
              }
              updateContent();
              handleSave();
            }
          }, 200);
        };

        // 如果消息来自右键菜单且侧边栏正在加载，等待加载完成
        if (message.fromContextMenu && isLoading.value) {
          // 创建一个检查器，每100ms检查一次加载状态
          const checkLoadingStatus = () => {
            if (!isLoading.value) {
              // 加载完成后，等待DOM更新，然后处理选中文本
              setTimeout(processSelectedText, 200);
            } else {
              // 如果仍在加载，继续检查
              setTimeout(checkLoadingStatus, 100);
            }
          };
          // 开始检查加载状态
          checkLoadingStatus();
        } else {
          // 如果不是来自右键菜单或侧边栏已加载完成，直接处理
          setTimeout(processSelectedText, 200);
        }

      }
      if (message.action === "urlChanged" && message.url) {
        // 仅当视图模式为编辑器时，才响应 URL 更改自动加载笔记
        // 如果用户正在查看所有笔记的列表，则不应自动切换视图或重新加载
        if (viewMode.value === "editor" && currentUrl.value !== message.url) {
          console.log("从后台收到新的 URL (编辑器模式):", message.url);

          // 保存当前URL的笔记，然后再处理新URL
          const oldUrl = currentUrl.value;
          const oldContent = content.value;
          const oldTitle = currentNoteTitle.value;

          // 只有当有内容且不是新标签页时才保存
          if (oldUrl && oldUrl !== "chrome://newtab/" && oldContent.trim() && !skipNextAutoSave.value) {
            console.log("标签页切换前自动保存笔记，URL:", oldUrl);

            // 先保存当前笔记，不改变currentUrl
            (async () => {
              try {
                isLoading.value = true;
                const noteContent = editor.value ? editor.value.innerHTML : oldContent;

                const existingNoteResponse = await notesStore.getNoteByUrl(oldUrl);
                const existingNote =
                  existingNoteResponse &&
                    existingNoteResponse.success &&
                    existingNoteResponse.data &&
                    existingNoteResponse.data.length > 0
                    ? existingNoteResponse.data[0]
                    : null;

                if (existingNote) {
                  // 更新现有笔记
                  console.log("更新现有笔记:", existingNote.id, "URL:", oldUrl);
                  await notesStore.updateNote(existingNote.id, {
                    title: oldTitle || `笔记`,
                    content: noteContent,
                  });
                } else {
                  // 创建新笔记
                  console.log("创建新笔记，URL:", oldUrl);
                  await notesStore.createNote({
                    title: oldTitle || `笔记`,
                    content: noteContent,
                    url: oldUrl,
                  });
                }

                // 保存完成后，更新URL并加载新笔记
                currentUrl.value = message.url;
                await loadNoteForCurrentUrl(message.url);
              } catch (error) {
                console.error("切换标签页保存笔记时出错:", error);
                // 即使保存失败，也要更新URL并加载新笔记
                currentUrl.value = message.url;
                await loadNoteForCurrentUrl(message.url);
              } finally {
                isLoading.value = false;
              }
            })();
          } else {
            // 如果没有内容或是新标签页，直接更新URL并加载新笔记
            currentUrl.value = message.url;
            loadNoteForCurrentUrl(message.url);
          }
        } else if (
          viewMode.value === "list" &&
          currentUrl.value !== message.url
        ) {
          // 如果在列表视图中，只更新 currentUrl 以便"返回"按钮知道要加载哪个笔记
          console.log(
            "从后台收到新的 URL (列表模式，仅更新 currentUrl):",
            message.url
          );
          currentUrl.value = message.url;
        }
      } else if (message.action === "pageLoaded" && message.url) {
        // 处理页面加载完成的消息
        if (viewMode.value === "editor" && currentUrl.value === message.url) {
          console.log("页面加载完成，重新加载笔记:", message.url);
          // 页面加载完成后，再次调用loadNoteForCurrentUrl
          loadNoteForCurrentUrl(message.url);
        }
      } else if (message.action === "windowStateChanged") {
        if (viewMode.value === "editor" && currentUrl.value && currentUrl.value !== "chrome://newtab/" && content.value.trim() && !skipNextAutoSave.value) {
          console.log("窗口失去焦点，可能是最小化或切换到其他应用 => 自动保存笔记");
          handleSave();
        }
      }
    });
  }
});

// 帮助函数，确保在执行关键操作前 URL 是最新的并且笔记已加载
const ensureLatestUrlAndLoadNote = async () => {
  isLoading.value = true; // 在此检查期间显示加载指示器
  try {
    const { url: latestUrl } = await getCurrentTabInfo();
    if (currentUrl.value !== latestUrl) {
      console.warn(
        `检测到 URL 不匹配。侧边栏 URL: ${currentUrl.value}, 实际标签页 URL: ${latestUrl}。正在更新并重新加载笔记。`
      );
      currentUrl.value = latestUrl;
      await loadNoteForCurrentUrl(latestUrl); // 这也会更新 currentNoteId 和 currentNoteTitle
    } else {
      // 如果 URL 相同，但编辑器为空且存在 currentNoteId，则尝试从 content ref 恢复
      if (
        editor.value &&
        !editor.value.innerHTML &&
        currentNoteId.value &&
        content.value
      ) {
        editor.value.innerHTML = content.value;
      } else if (
        editor.value &&
        !editor.value.innerHTML &&
        !currentNoteId.value
      ) {
        // 如果 URL 相同，编辑器为空，且没有笔记 ID，则尝试加载
        await loadNoteForCurrentUrl(latestUrl);
      }
    }
  } catch (error) {
    console.error("确保最新 URL 和加载笔记时出错:", error);
    isLoading.value = false;
    throw error;
  } finally {
    // isLoading.value = false; // loadNoteForCurrentUrl 和其他调用者会处理这个
  }
};

const handleRefresh = async () => {
  skipNextAutoSave.value = true; // 设置跳过下一次自动保存
  isLoading.value = true;
  try {
    const { url: latestUrl } = await getCurrentTabInfo();
    currentUrl.value = latestUrl; // 确保 currentUrl 是最新的
    await loadNoteForCurrentUrl(currentUrl.value); // 强制从存储中重新加载
  } catch (error) {
    console.error("刷新操作期间出错:", error);
  } finally {
    isLoading.value = false;
  }
};

const fetchNotesForPage = async (page) => {
  isLoading.value = true;
  try {
    const response = await notesStore.getUserNotes(page, notesPerPage.value, keyword.value);
    if (response && response.success && response.data) {
      allNotes.value = response.data.notes || [];
      currentPage.value = response.data.currentPage || page;
      notesPerPage.value = response.data.pageSize || notesPerPage.value;
      totalNotes.value = response.data.totalNotes || 0;
      totalPages.value = response.data.totalPages || 0;
    } else {
      console.warn(`获取第 ${page} 页笔记失败:`, response);
      allNotes.value = [];
    }
  } catch (error) {
    console.error(`获取第 ${page} 页笔记时出错:`, error);
    allNotes.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handleSearchEnter = async () => {
  if (viewMode.value === "list") {
    await fetchNotesForPage(1);
  }
};

const handleSearch = async () => {
  if (viewMode.value === "editor") {
    skipNextAutoSave.value = true; // 设置跳过下一次自动保存
    if (currentNoteId.value) {
      const { url: url } = await getCurrentTabInfo();
      const domain = notesStore.getDomainFromUrl(url);
      keyword.value = domain;
    }
    viewMode.value = "list";
    await fetchNotesForPage(1);
  } else {
    await fetchNotesForPage(1);
  }
};

const handleAll = async () => {
  if (viewMode.value === "editor") {
    skipNextAutoSave.value = true; // 设置跳过下一次自动保存
    viewMode.value = "list";
    keyword.value = "";
    await fetchNotesForPage(1);
  } else {
    viewMode.value = "editor";
    setTimeout(() => {
      editor.value.innerHTML = content.value
    }, 200);
  }
};

const handleNoteClick = async (note) => {
  viewMode.value = "editor";
  const newTab = await chrome.tabs.create({ url: note.url, active: true });
  tabToActivateId = newTab.id;
  try {
    await loadNoteForCurrentUrl(currentUrl.value);
  } catch (error) {
    console.error("返回编辑器时加载笔记出错:", error);
  }
};

// 添加确认删除笔记的函数
const confirmDeleteNote = async (note) => {
  if (confirm(`确定要删除笔记 "${note.title || "无标题笔记"}" 吗？`)) {
    isLoading.value = true;
    try {
      await notesStore.deleteNote(note.id);
      // 删除成功后刷新当前页的笔记列表
      await fetchNotesForPage(currentPage.value);
    } catch (error) {
      console.error("删除笔记时出错:", error);
      alert(`删除笔记失败: ${error.message}`);
    } finally {
      isLoading.value = false;
    }
  }
};

const paginatedNotes = computed(() => {
  return allNotes.value;
});

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    fetchNotesForPage(currentPage.value + 1);
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    fetchNotesForPage(currentPage.value - 1);
  }
};

const handleDelete = async () => {
  skipNextAutoSave.value = true; // 设置跳过下一次自动保存
  isLoading.value = true;
  try {
    await ensureLatestUrlAndLoadNote();
    if (!currentNoteId.value) {
      alert("当前页面没有可删除的笔记。");
      isLoading.value = false;
      return;
    }
    if (!confirm("确定要删除当前页面的笔记吗？")) {
      isLoading.value = false;
      return;
    }
    await notesStore.deleteNote(currentNoteId.value);
    if (editor.value) editor.value.innerHTML = "";
    content.value = "";
    currentNoteId.value = null;
    currentNoteTitle.value = "";
  } catch (error) {
    console.error("删除笔记时出错:", error);
    alert(`删除笔记失败: ${error.message}`);
  } finally {
    isLoading.value = false;
  }
};

// 修改handlePaste函数，记录上传的图片信息
const handlePaste = async (event) => {
  const items = (event.clipboardData || event.originalEvent.clipboardData)
    ?.items;
  if (!items) return;

  let imageFile = null;
  for (const item of items) {
    if (item.type.indexOf("image") !== -1) {
      imageFile = item.getAsFile();
      break;
    }
  }

  if (imageFile) {
    event.preventDefault(); // 阻止默认的粘贴行为（例如，将图片作为 base64 插入）
    isLoading.value = true;
    try {
      if (window.uploadImage) {
        
      }
    } catch (error) {
      console.error("粘贴图片并上传时出错:", error);
    } finally {
      isLoading.value = false;
    }
  }
  // 如果粘贴的不是图片，则允许默认行为
};

const onInput = () => {
  updateContent();
};

// 添加检查删除图片的函数
const checkDeletedImages = (oldContent, newContent) => {
  // 如果noteImages为空，不需要检查
  if (noteImages.value.size === 0) return;

  // 创建临时DOM元素来解析HTML内容
  const oldDiv = document.createElement('div');
  oldDiv.innerHTML = oldContent;
  const oldImages = oldDiv.querySelectorAll('img');

  const newDiv = document.createElement('div');
  newDiv.innerHTML = newContent;
  const newImages = newDiv.querySelectorAll('img');

  // 获取旧内容中的所有图片URL
  const oldImageUrls = new Set();
  oldImages.forEach(img => {
    if (img.src) oldImageUrls.add(img.src);
  });

  // 获取新内容中的所有图片URL
  const newImageUrls = new Set();
  newImages.forEach(img => {
    if (img.src) newImageUrls.add(img.src);
  });

  // 找出在旧内容中存在但在新内容中不存在的图片URL
  const deletedImageUrls = [...oldImageUrls].filter(url => !newImageUrls.has(url));

  // 对于每个被删除的图片URL，删除对应的OSS文件
  deletedImageUrls.forEach(async (url) => {
    const key = noteImages.value.get(url);
    if (key && window.deleteImage) {
      const deleted = await window.deleteImage(key);
      if (deleted) {
        console.log(`成功删除OSS中的图片: ${key}`);
        // 从映射中移除该图片
        noteImages.value.delete(url);
      } else {
        console.error(`删除OSS中的图片失败: ${key}`);
      }
    }
  });
};

const loadNoteForCurrentUrl = async (urlToLoad) => {
  if (!urlToLoad) {
    console.warn("没有为 loadNoteForCurrentUrl 提供 URL");
    if (editor.value) editor.value.innerHTML = "";
    content.value = "";
    currentNoteId.value = null;
    currentNoteTitle.value = "";
    return;
  }

  isLoading.value = true;
  try {
    const response = await notesStore.getNoteByUrl(urlToLoad);
    const { title: pageTitle } = await getCurrentTabInfo();
    if (
      response &&
      response.success &&
      response.data &&
      response.data.length > 0
    ) {
      const actualNote = response.data[0];
      if (editor.value) editor.value.innerHTML = actualNote.content || "";
      content.value = actualNote.content || "";
      currentNoteId.value = actualNote.id;
      // 如果笔记标题为空，使用页面标题
      currentNoteTitle.value = actualNote.title || pageTitle || "";

      // 解析笔记内容中的图片信息
      parseNoteImages(actualNote.content || "");
    } else {
      if (editor.value) editor.value.innerHTML = "";
      content.value = "";
      currentNoteId.value = null;
      // 未获取到笔记时，使用页面标题
      currentNoteTitle.value = pageTitle || "";
    }
  } catch (error) {
    console.error("加载笔记时出错:", error);
    if (editor.value) editor.value.innerHTML = "";
    content.value = "";
    currentNoteId.value = null;
    currentNoteTitle.value = "";
  } finally {
    isLoading.value = false;
  }
};

// 添加解析笔记图片的函数
const parseNoteImages = (noteContent) => {
  // 清空当前的图片映射
  noteImages.value.clear();

  // 如果笔记内容为空，直接返回
  if (!noteContent) return;

  // 创建临时DOM元素来解析HTML内容
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = noteContent;

  // 获取所有图片元素
  const images = tempDiv.querySelectorAll('img');

  // 对于每个图片，尝试从src和data-key属性中提取信息
  images.forEach(img => {
    const src = img.getAttribute('src');
    const key = img.getAttribute('data-key');

    if (src && key) {
      // 如果同时有src和data-key属性，直接使用
      noteImages.value.set(src, key);
    } else if (src) {
      // 如果只有src属性，尝试从URL中提取key
      // 假设URL格式为：https://bucket.region.aliyuncs.com/key
      const urlParts = src.split('/');
      const possibleKey = urlParts[urlParts.length - 1];
      if (possibleKey && possibleKey.includes('.')) {
        noteImages.value.set(src, possibleKey);
      }
    }
  });
};
async function handleSave(noSkip) {
  if (noSkip === 1) {
    console.log("来自自动保存");
  } else {
    console.log("来自手动保存");
    skipNextAutoSave.value = true; // 设置跳过下一次自动保存
  }
  isLoading.value = true;
  try {
    // 保存当前标题，以便在加载后恢复
    const currentTitle = currentNoteTitle.value;

    // 确保URL是最新的并加载相关笔记
    await ensureLatestUrlAndLoadNote();

    // 恢复标题值，防止被清空
    currentNoteTitle.value = currentTitle;

    if (!currentUrl.value) {
      alert("无法获取当前URL，无法保存笔记。");
      isLoading.value = false;
      return;
    }
    console.log("🚀 ~ handleSave ~ currentUrl.value:", currentUrl.value);
    const noteContent = editor.value ? editor.value.innerHTML : content.value;

    const existingNoteResponse = await notesStore.getNoteByUrl(
      currentUrl.value
    );
    const existingNote =
      existingNoteResponse &&
        existingNoteResponse.success &&
        existingNoteResponse.data &&
        existingNoteResponse.data.length > 0
        ? existingNoteResponse.data[0]
        : null;

    if (existingNote) {
      // 已有笔记，执行更新操作
      console.log("更新现有笔记:", existingNote.id);
      const updatedNote = await notesStore.updateNote(existingNote.id, {
        title: currentNoteTitle.value || `笔记`,
        content: noteContent,
      });
      currentNoteId.value = existingNote.id;
      // 确保标题不被覆盖，除非服务器返回了不同的标题
      if (updatedNote.title && updatedNote.title !== currentTitle) {
        currentNoteTitle.value = updatedNote.title;
      }
      // 播放保存成功动画
      playAnimation();
    } else {
      // 没有笔记，执行创建操作
      const newNote = await notesStore.createNote({
        title: currentNoteTitle.value || `笔记`,
        content: noteContent,
        url: currentUrl.value,
      });
      currentNoteId.value = newNote.id;
      // 确保标题不被覆盖，除非服务器返回了不同的标题
      if (newNote.title && newNote.title !== currentTitle) {
        currentNoteTitle.value = newNote.title;
      }
      // 播放保存成功动画
      playAnimation();
    }
  } catch (error) {
    console.error("保存笔记时出错:", error);

    if (noSkip === 1) {
      console.log("自动保存的时候，不弹出错误");
    } else {
      alert(`保存笔记失败: ${error.message}`);
    }

  } finally {
    isLoading.value = false;
  }
}

const playAnimation = () => {
  if (saveAnimation.value) {
    isAnimationVisible.value = true;
    saveAnimation.value.currentTime = 0;
    saveAnimation.value.playbackRate = 2.0; // 设置播放速度为2倍
    saveAnimation.value.play().catch((err) => {
      console.error("播放动画失败:", err);
      hideAnimation();
    });
  }
};

const hideAnimation = () => {
  setTimeout(() => {
    isAnimationVisible.value = false;
    if (saveAnimation.value) {
      saveAnimation.value.pause();
    }
  }, 500);
};

const handleEditorBlurAfterOneSecond = async () => {
  setTimeout(() => {
    handleEditorBlur();
  }, 200);
};

const handleEditorBlur = async () => {
  if (skipNextAutoSave.value) {
    skipNextAutoSave.value = false;
    return;
  }
  if (content.value.trim()) {
    console.log("当编辑器失去焦点时自动保存");
    await handleSave(1);
  }
};

const handleDragOver = (event) => {
  event.preventDefault();
  if (editor.value) {
    editor.value.classList.add('drag-over');
  }
};

const handleDragLeave = (event) => {
  event.preventDefault();
  if (editor.value) {
    editor.value.classList.remove('drag-over');
  }
};

const handleDrop = async (event) => {
  event.preventDefault();
  if (editor.value) {
    editor.value.classList.remove('drag-over');
  }

  const items = event.dataTransfer?.files;
  if (!items || items.length === 0) return;

  let imageFile = null;
  for (const item of items) {
    if (item.type.indexOf('image') !== -1) {
      imageFile = item;
      break;
    }
  }

  if (imageFile) {
    isLoading.value = true;
    try {
      if (window.uploadImage) {
        
        
      } else {

      }
    } catch (error) {
      console.error("拖拽图片时出错:", error);
    } finally {
      isLoading.value = false;
    }
  }
};
</script>

<style scoped>
#app-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 150px);
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.actions-bar {
  margin-bottom: 15px;
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
}

.rich-text-editor {
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
  box-sizing: border-box;
}

.toolbar {
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #ccc;
  background-color: #f5f5f5;
  flex-shrink: 0;
  /* Prevent toolbar from shrinking */
}

.toolbar button,
.toolbar select,
.toolbar input[type="color"] {
  margin-right: 8px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  cursor: pointer;
  background-color: #fff;
}

.toolbar button:hover,
.toolbar select:hover {
  background-color: #e0e0e0;
}

.toolbar input[type="color"] {
  width: 30px;
  height: 30px;
  padding: 2px;
}

.editor-area {
  flex-grow: 1;
  overflow-y: auto;
  padding: 12px;
  outline: none;
  font-size: 16px;
  text-align: left;
  width: 100%;
  box-sizing: border-box;
  transition: border 0.3s ease;
}

.editor-area.drag-over {
  border: 2px dashed #4a90e2;
  background-color: rgba(74, 144, 226, 0.05);
}

.editor-area ::v-deep img {
  display: block;
  max-width: 100%;
  width: 100% !important;
  height: auto;
  object-fit: contain;
}

.notes-list-container {
  width: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notes-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1;
  overflow-y: auto;
}

.note-item {
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-content {
  flex: 1;
  overflow: hidden;
}

.note-item:hover {
  background-color: #f8f8f8;
}

.note-title {
  font-weight: bold;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-note-btn {
  background-color: #f1f1f1;
  color: black;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 8px;
}

.delete-note-btn:hover {
  background-color: #ff7875;
  color: white;
}

.note-url {
  font-size: 0.9em;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid #eee;
  flex-shrink: 0;
}

.pagination button {
  margin: 0 10px;
  padding: 5px 10px;
  cursor: pointer;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.save-animation {
  width: 32px;
  height: 32px;
  object-fit: contain;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease;
}

.save-animation.visible {
  opacity: 1;
  visibility: visible;
}

.top-btn {
  margin-right: 8px;
  background-color: #f1f1f1;
}

.title-input-container {
  padding: 8px;
  border-bottom: 1px solid #ccc;
  background-color: #f5f5f5;
}

.note-title-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 16px;
  box-sizing: border-box;
}

.search-icon {
  width: 20px;
  height: 20px;
  position: absolute;
  top: 8px;
  right: 4px;
  cursor: pointer;
}

.search-input {
  width: 60%;
  border: 1px solid #ccc;
  border-radius: 6px;
  margin-left: 10px;
  margin-right: 10px;
  height: 32px;
}

/* 笔记预览窗口样式 */
.note-preview {
  position: fixed;
  width: 270px;
  height: calc(100vh - 150px);
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-header {
  padding: 10px;
  border-bottom: 1px solid #eee;
  background-color: #f8f8f8;
}

.preview-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.preview-url {
  font-size: 0.9em;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-content {
  padding: 10px;
  overflow-y: auto;
  font-size: 14px;
}

.preview-content ::v-deep img {
  max-width: 100%;
  height: auto;
}
</style>
