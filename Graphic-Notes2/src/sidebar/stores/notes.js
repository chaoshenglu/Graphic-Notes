import { defineStore } from 'pinia'

export const useNotesStore = defineStore('notes', () => {
  const baseUrl = 'http://8.138.32.80/'
  const userId = 1 // Hardcoded userId

  // Helper function to extract domain from URL
  const getDomainFromUrl = (url) => {
    try {
      return new URL(url).hostname
    } catch (error) {
      console.error('Invalid URL for domain extraction:', url, error)
      return '' // Or handle appropriately
    }
  }

  /**
   * 创建笔记
   * @param {object} noteData - { title, content, url, is_public }
   */
  const createNote = async (noteData) => {
    const domain = getDomainFromUrl(noteData.url)
    if (!domain) {
      throw new Error('Invalid URL, cannot extract domain.')
    }
    try {
      const response = await fetch(`${baseUrl}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          title: noteData.title,
          content: noteData.content,
          domain: domain,
          url: noteData.url,
          is_public: noteData.is_public || false,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error creating note:', error)
      throw error
    }
  }

  /**
   * 删除笔记
   * @param {string} noteId
   */
  const deleteNote = async (noteId) => {
    try {
      const response = await fetch(`${baseUrl}/notes/${noteId}?user_id=${userId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      // DELETE typically returns 204 No Content or some confirmation
      if (response.status === 204) {
        return { success: true, message: 'Note deleted successfully.' }
      }
      return await response.json()
    } catch (error) {
      console.error('Error deleting note:', error)
      throw error
    }
  }

  /**
   * 修改笔记
   * @param {string} noteId
   * @param {object} noteUpdateData - { title, content, is_public }
   */
  const updateNote = async (noteId, noteUpdateData) => {
    try {
      const response = await fetch(`${baseUrl}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId, // API spec in test.http includes user_id in body for PUT
          ...noteUpdateData,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error updating note:', error)
      throw error
    }
  }

  /**
   * 根据URL和用户ID查询笔记
   * @param {string} url
   */
  const getNoteByUrl = async (url) => {
    try {
      const encodedUrl = encodeURIComponent(url)
      const response = await fetch(`${baseUrl}/notes/url?url=${encodedUrl}&user_id=${userId}`)
      if (!response.ok) {
        if (response.status === 404) { // Note not found is a valid case
          return null
        }
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching note by URL:', error)
      throw error
    }
  }

  /**
   * 查询某个用户的全部笔记
   * @param {number} page
   * @param {number} pageSize
   */
  const getUserNotes = async (page = 1, pageSize = 5, keyword="") => {
    try {
      const response = await fetch(`${baseUrl}/notes/user/${userId}?page=${page}&pageSize=${pageSize}&keyword=${keyword}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching user notes:', error)
      throw error
    }
  }

  return {
    createNote,
    deleteNote,
    updateNote,
    getNoteByUrl,
    getUserNotes,
    getDomainFromUrl,
  }
})
