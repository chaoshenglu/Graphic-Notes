import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { translator } from '../utils/translator.js'

/**
 * 产品数据操作相关的组合式函数
 */
export function useProductData() {
  const loading = ref(false)
  const savingHtml = ref(false)
  const apiProcessingStatus = ref(null) // null: 未开始, 'processing': 处理中, 'success': 成功, 'error': 失败

  /**
   * 获取产品详情
   * @param {string} productId - 产品ID
   * @returns {Promise<Object>} 产品数据
   */
  const fetchProductDetail = async (productId) => {
    try {
      loading.value = true
      const response = await axios.get(`${window.lx_host}/products/${productId}`)
      if (!response.data.data.cate) {
        response.data.data.cate = "Not decided"
      }
      return response.data.data
    } catch (error) {
      throw new Error(error.message)
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新产品数据的通用方法
   * @param {string} productId - 产品ID
   * @param {Object} updateData - 更新的数据
   * @param {string} successMessage - 成功提示信息
   */
  const updateProduct = async (productId, updateData, successMessage = '更新成功') => {
    try {
      await axios.put(`${window.lx_host}/products/${productId}`, updateData)
      ElMessage.success(successMessage)
      return true
    } catch (error) {
      ElMessage.error('更新失败：' + (error.response?.data?.message || error.message))
      throw error
    }
  }

  /**
   * 更新英文价格（按0.43比例）
   * @param {string} productId - 产品ID
   * @param {Object} productData - 产品数据
   */
  const updateEnPrice = async (productId, productData) => {
    if (productData?.sku_data && productData.sku_data.length > 0) {
      productData.sku_data.forEach(sku => {
        if (sku.price) {
          const originalPrice = parseFloat(sku.price)
          sku.price_en = Math.round(originalPrice * 0.43)
          console.log(`${originalPrice} => ${sku.price_en}`)
        }
      })
      const updateData = { ...productData }
      await updateProduct(productId, updateData, '美元价格已更新')
      return productData
    }
  }

  /**
   * 翻译SKU名称
   * @param {string} productId - 产品ID
   * @param {Object} productData - 产品数据
   */
  const translateSku = async (productId, productData) => {
    // 先更新价格
    if (productData?.sku_data && productData.sku_data.length > 0) {
      productData.sku_data.forEach(sku => {
        if (sku.price) {
          const originalPrice = parseFloat(sku.price)
          sku.price_en = Math.round(originalPrice * 0.43)
          console.log(`${originalPrice} => ${sku.price_en}`)
        }
      })
    }

    if (!productData?.sku_data || productData.sku_data.length === 0) {
      ElMessage.warning('暂无SKU数据可翻译')
      return productData
    }

    try {
      ElMessage.info('正在翻译SKU名称，请稍候...')
      const skuNamesToTranslate = productData.sku_data
        .filter(sku => sku.skuNameCn && sku.skuNameCn.trim())
        .map(sku => sku.skuNameCn)

      if (skuNamesToTranslate.length === 0) {
        ElMessage.warning('没有找到需要翻译的SKU中文名称')
        return productData
      }

      // 将多个SKU名称用#符号连接成一个句子
      const combinedQuery = skuNamesToTranslate.join('#')

      const translatePromise = new Promise((resolve, reject) => {
        translator.translate(
          combinedQuery,
          'zh',
          'en',
          (data) => {
            if (data && data.trans_result && data.trans_result.length > 0) {
              resolve(data.trans_result[0].dst)
            } else {
              reject(new Error('翻译结果格式异常'))
            }
          },
          (error) => {
            reject(new Error('翻译失败: ' + error))
          }
        )
      })

      const translatedText = await translatePromise
      // 通过#符号拆分翻译结果
      const translatedNames = translatedText.split('#')

      // 创建翻译映射
      const translationMap = {}
      skuNamesToTranslate.forEach((originalName, index) => {
        if (index < translatedNames.length) {
          translationMap[originalName] = translatedNames[index].trim()
        }
      })

      const sku_data_translated = productData.sku_data.map(sku => {
        const translatedName = translationMap[sku.skuNameCn]
        return {
          ...sku,
          skuNameEn: translatedName || sku.skuNameEn
        }
      })

      const updateData = {
        ...productData,
        sku_data: sku_data_translated
      }

      await updateProduct(productId, updateData, `SKU翻译完成，共翻译了 ${Object.keys(translationMap).length} 个SKU名称`)
      return { ...productData, sku_data: sku_data_translated }
    } catch (error) {
      console.error('翻译SKU失败:', error)
      ElMessage.error('翻译失败：' + (error.message || '未知错误'))
      throw error
    }
  }

  /**
   * 保存产品分类
   * @param {string} productId - 产品ID
   * @param {Object} productData - 产品数据
   * @param {string} newCate - 新分类
   */
  const saveCate = async (productId, productData, newCate) => {
    const updateData = {
      ...productData,
      cate: newCate
    }
    await updateProduct(productId, updateData, '分类更新成功')
    return { ...productData, cate: newCate }
  }

  /**
   * 翻译参数信息
   * @param {string} productId - 产品ID
   * @param {Object} productData - 产品数据
   */
  const translateParamHtml = async (productId, productData) => {
    let paramInfoCn = productData?.param_info_cn
    if (!paramInfoCn || paramInfoCn.trim() === '') {
      ElMessage.warning('暂无中文参数信息可翻译')
      return productData
    }

    try {
      apiProcessingStatus.value = 'processing'
      ElMessage.info('正在翻译参数信息，请稍候...')
      // 删除<style>...</style>部分
      const cleanedParamInfoCn = paramInfoCn.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      if (!cleanedParamInfoCn || cleanedParamInfoCn.trim() === '') {
        ElMessage.warning('删除样式后暂无内容可翻译')
        apiProcessingStatus.value = 'error'
        return productData
      }

      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.lx_doubao}`
        },
        body: JSON.stringify({
          model: 'doubao-seed-1-6-flash-250615',
          messages: [
            {
              content: [
                {
                  text: `请将下面的代码中的中文翻译成英文，请注意'彩色玻璃'要翻译成'Stained Glass'(翻译后按原代码格式返回，不要使用 Markdown 格式)：${cleanedParamInfoCn}`,
                  type: 'text'
                }
              ],
              role: 'user'
            }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`翻译API请求失败: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.choices && result.choices.length > 0) {
        const translatedContent = result.choices[0].message.content
        const updateData = {
          ...productData,
          param_info_en: translatedContent
        }
        await updateProduct(productId, updateData, '参数信息翻译并保存成功')
        apiProcessingStatus.value = 'success'
        ElMessage.success('参数信息翻译完成')
        return { ...productData, param_info_en: translatedContent }
      } else {
        throw new Error('翻译API返回数据格式异常')
      }
    } catch (error) {
      console.error('翻译失败:', error)
      apiProcessingStatus.value = 'error'
      ElMessage.error('翻译失败：' + (error.message || '未知错误'))
      throw error
    }
  }

  /**
   * 保存参数HTML
   * @param {string} productId - 产品ID
   * @param {Object} productData - 产品数据
   * @param {string} htmlContent - HTML内容
   * @param {string} language - 语言类型 ('cn' | 'en')
   */
  const saveParamHtml = async (productId, productData, htmlContent, language) => {
    try {
      savingHtml.value = true
      const updateData = { ...productData }
      
      if (language === 'cn') {
        updateData.param_info_cn = htmlContent
      } else {
        updateData.param_info_en = htmlContent
      }
      
      const successMessage = language === 'cn' ? '中文参数信息更新成功' : '英文参数信息更新成功'
      await updateProduct(productId, updateData, successMessage)
      
      return {
        ...productData,
        [language === 'cn' ? 'param_info_cn' : 'param_info_en']: htmlContent
      }
    } finally {
      savingHtml.value = false
    }
  }

  /**
   * 更新Shopify ID
   * @param {string} productId - 产品ID
   * @param {string} shopifyId - Shopify ID
   */
  const updateShopifyId = async (productId, shopifyId) => {
    const updateData = { shopify_id: shopifyId }
    await updateProduct(productId, updateData, 'Shopify ID更新成功')
    return shopifyId
  }

  /**
   * 编辑Shopify ID
   * @param {string} productId - 产品ID
   * @param {string} currentShopifyId - 当前Shopify ID
   */
  const editShopifyId = async (productId, currentShopifyId = '') => {
    try {
      const { value } = await ElMessageBox.prompt(
        '请输入新的Shopify ID',
        '编辑Shopify ID',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          inputValue: currentShopifyId,
          inputPlaceholder: '请输入Shopify ID'
        }
      )
      if (value && value.trim()) {
        return await updateShopifyId(productId, value.trim())
      }
    } catch (error) {
      // 用户取消操作
      return null
    }
  }

  /**
   * 删除详情图片
   * @param {string} productId - 产品ID
   * @param {Object} productData - 产品数据
   * @param {number} index - 图片索引
   */
  const deleteDetailImage = async (productId, productData, index) => {
    const newDetailImages = [...(productData?.detail_images_cn || [])]
    newDetailImages.splice(index, 1)
    const updateData = {
      ...productData,
      detail_images_cn: newDetailImages
    }
    await updateProduct(productId, updateData, '图片删除成功')
    return { ...productData, detail_images_cn: newDetailImages }
  }

  /**
   * 更新产品HTML
   * @param {string} productId - 产品ID
   * @param {Object} productData - 产品数据
   * @param {string} productHtml - 产品HTML内容
   */
  const updateProductHtml = async (productId, productData, productHtml) => {
    const updateData = {
      ...productData,
      product_html: productHtml
    }
    await updateProduct(productId, updateData, 'product_html更新成功')
    return { ...productData, product_html: productHtml }
  }

  /**
   * 生成详情图片HTML
   * @param {Object} productData - 产品数据
   */
  const generateDetailImagesHtml = (productData) => {
    const id = productData.product_id
    const count = productData.detail_images_cn.length || []
    const imageUrls = []
    for (let i = 1; i <= count; i++) {
      imageUrls.push(`https://img.tiffanylamps.art/${id}/detail/${i}.webp`)
    }
    imageUrls.push('https://img.tiffanylamps.art/bottom.webp')
    if (productData.cate == 'Floor Lamp') {
      imageUrls.push('https://img.tiffanylamps.art/floor-lamp-switch.webp')
    } else if (productData.cate == 'Not decided') {
      imageUrls.push('https://img.tiffanylamps.art/floor-lamp-switch.webp')
      imageUrls.push('https://img.tiffanylamps.art/not-floor-lamp-switch.webp')
    } else {
      imageUrls.push('https://img.tiffanylamps.art/not-floor-lamp-switch.webp')
    }
    const imgTags = imageUrls.map(url => `  <img src="${url}">`).join('\n')
    return `<div style="display: flex;flex-direction: column;border-radius: 8px;box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);overflow: hidden;">\n${imgTags}\n</div>`
  }

  /**
   * 清理标题属性
   * @param {string} content - HTML内容
   */
  const cleanTitleAttributes = async (content) => {
    try {
      if (!content) {
        ElMessage.warning('暂无内容可清理')
        return content
      }
      // 匹配模式：title="任何内容"（包括转义字符）
      const titlePattern = /\s+title="[^"]*"/g
      const matches = content.match(titlePattern)
      let newContent = content
      if (!matches) {
        console.log('未找到title属性')
      } else {
        newContent = content.replace(titlePattern, '')
      }
      newContent = newContent.replace("豪蒂（家装灯饰）", "Hauty")
      newContent = newContent.replace("豪蒂", "Hauty")
      newContent = newContent.replace("10年", "3年")
      newContent = newContent.replace("5年", "3年")
      newContent = newContent.replace("其他/other", "")
      newContent = newContent.replace("其他/other", "")
      // 使用API接口整理数据：
      try {
        apiProcessingStatus.value = 'processing'
        ElMessage.info('正在整理参数信息，请稍候...')
        // 提取<style>...</style>部分
        const styleMatches = newContent.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []
        // 删除<style>...</style>部分
        const cleanedParamInfoCn = newContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.lx_doubao}`
          },
          body: JSON.stringify({
            model: 'doubao-seed-1-6-flash-250615',
            messages: [
              {
                content: [
                  {
                    text: `请将下面的代码中的"灯具是否带光源"对应的值改为"光源将作为赠品赠送"，将"颜色分类"对应的值改为"中国广东"，然后将"颜色分类"四个字改为"产地"，不要在代码中增加注释，不要使用 Markdown 格式，直接返回代码本体。：${cleanedParamInfoCn}`,
                    type: 'text'
                  }
                ],
                role: 'user'
              }
            ]
          })
        })
        if (!response.ok) {
          throw new Error(`请求失败: ${response.statusText}`)
        }
        const result = await response.json()
        if (result.choices && result.choices.length > 0) {
          let message_content = result.choices[0].message.content
          // 重新添加<style>标签
          if (styleMatches.length > 0) {
            message_content = styleMatches.join('') + message_content
          }
          apiProcessingStatus.value = 'success'
          ElMessage.success('参数信息整理完成')
          return message_content
        } else {
          throw new Error('API返回数据格式异常')
        }
      } catch (error) {
        console.error('失败:', error)
        apiProcessingStatus.value = 'error'
        ElMessage.error('失败：' + (error.message || '未知错误'))
        return newContent
      }
    } catch (error) {
      console.log(error)
      return content
    }
  }

  /**
   * 同步产品HTML到Shopify
   * @param {Object} productData - 产品数据
   */
  const synchronizeProductHtmlToShopify = async (productData) => {
    let param_info_en = productData.param_info_en || ""
    let param_info_cn = productData.param_info_cn || ""
    param_info_en = param_info_en.replace(`<p class="section-title">Parameter information</p>`, '')
    param_info_cn = param_info_cn.replace(`<p class="section-title">Parameter information</p>`, '')
    const shopify_id = productData.shopify_id || ''
    const product_html = productData.product_html || ''
    
    if (shopify_id == '') {
      ElMessage.error('缺少Shopify ID，无法同步')
      return
    }
    if (product_html == '') {
      ElMessage.error('缺少product_html，无法同步')
      return
    }
    if (param_info_en == '') {
      ElMessage.error('缺少param_info_en，无法同步')
      return
    }
    if (param_info_cn == '') {
      ElMessage.error('缺少param_info_cn，无法同步')
      return
    }
    
    try {
      ElMessage.info('正在同步商品信息到Shopify，请稍候...')
      const prefix = `<p class="section-title">Parameter information</p>`
      let updateData = {
        "body_html": prefix + param_info_en + param_info_cn + product_html
      }
      console.log('updateData :', updateData);
      const response = await axios.put(
        `http://192.168.1.12:3000/api/products/${shopify_id}`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      if (response.data.success) {
        ElMessage.success('商品信息已成功同步到Shopify')
        console.log('Shopify同步成功:', response.data)
      } else {
        throw new Error(response.data.message || '同步失败')
      }
    } catch (error) {
      console.error('同步到Shopify失败:', error)
      const errorMessage = error.response?.data?.message || error.message || '同步失败'
      ElMessage.error(`同步到Shopify失败: ${errorMessage}`)
    }
  }

  /**
   * 同步产品信息到Shopify
   * @param {Object} productData - 产品数据
   */
  const synchronizeProductInfoToShopify = async (productData) => {
    let param_info_en = productData.param_info_en || ""
    let param_info_cn = productData.param_info_cn || ""
    param_info_en = param_info_en.replace(`<p class="section-title">Parameter information</p>`, '')
    param_info_cn = param_info_cn.replace(`<p class="section-title">Parameter information</p>`, '')
    const shopify_id = productData.shopify_id || ''
    const product_html = productData.product_html || ''
    const title_en = productData.title_en || ''

    if (shopify_id == '') {
      ElMessage.error('缺少Shopify ID，无法同步')
      return
    }
    if (product_html == '') {
      ElMessage.error('缺少product_html，无法同步')
      return
    }
    if (title_en == '') {
      ElMessage.error('缺少title_en，无法同步')
      return
    }
    if (param_info_en == '') {
      ElMessage.error('缺少param_info_en，无法同步')
      return
    }
    if (param_info_cn == '') {
      ElMessage.error('缺少param_info_cn，无法同步')
      return
    }
    
    try {
      ElMessage.info('正在同步商品信息到Shopify，请稍候...')
      const prefix = `<p class="section-title">Parameter information</p>`
      let updateData = {
        "title": title_en,
        "product_type": productData.cate,
        "vendor": "Hauty",
        "body_html": prefix + param_info_en + param_info_cn + product_html
      }

      if (productData.sku_data && productData.sku_data.length) {
        let values = []
        let updateData_variants = []
        for (let i = 0; i < productData.sku_data.length; i++) {
          let sku = productData.sku_data[i]
          values.push(sku.skuNameCn)
          updateData_variants.push({
            "price": sku.price_en,
            "compare_at_price": Math.round(sku.price_en * 1.2),
            "title": sku.skuNameEn,
            "option1": sku.skuNameEn
          })
        }
        let option = {
          "name": "style",
          "values": values
        }
        let updateData_options = [option]
        updateData.options = updateData_options
        updateData.variants = updateData_variants
      }
      const response = await axios.put(`http://192.168.1.12:3000/api/products/${shopify_id}`, updateData, {
        headers: {
          'Content-Type': 'application/json'
        }
      }
      )
      if (response.data.success) {
        ElMessage.success('商品信息已成功同步到Shopify')
        console.log('Shopify同步成功:', response.data)
      } else {
        throw new Error(response.data.message || '同步失败')
      }
    } catch (error) {
      console.error('同步到Shopify失败:', error)
      const errorMessage = error.response?.data?.message || error.message || '同步失败'
      ElMessage.error(`同步到Shopify失败: ${errorMessage}`)
    }
  }

  /**
   * 同步SKU到Shopify
   * @param {Object} productData - 产品数据
   */
  const synchronizeSkuToShopify = async (productData) => {
    const shopify_id = productData.shopify_id || ''
    if (shopify_id == '') {
      ElMessage.error('缺少Shopify ID，无法同步')
      return
    }
    try {
      ElMessage.info('正在同步商品信息到Shopify，请稍候...')
      let updateData = {}
      if (productData.sku_data && productData.sku_data.length) {
        let values = []
        let updateData_variants = []
        for (let i = 0; i < productData.sku_data.length; i++) {
          let sku = productData.sku_data[i]
          values.push(sku.skuNameCn)
          updateData_variants.push({
            "price": sku.price_en,
            "compare_at_price": Math.round(sku.price_en * 1.2),
            "title": sku.skuNameEn,
            "option1": sku.skuNameEn
          })
        }
        let option = {
          "name": "style",
          "values": values
        }
        let updateData_options = [option]
        updateData.options = updateData_options
        updateData.variants = updateData_variants
      }
      console.log('updateData :', updateData);
      const response = await axios.put(
        `http://192.168.1.12:3000/api/products/${shopify_id}`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      if (response.data.success) {
        ElMessage.success('sku已成功同步到Shopify')
      } else {
        throw new Error(response.data.message || '同步失败')
      }
    } catch (error) {
      console.error('同步sku到Shopify失败:', error)
      const errorMessage = error.response?.data?.message || error.message || '同步失败'
      ElMessage.error(`同步sku到Shopify失败: ${errorMessage}`)
    }
  }

  return {
    loading,
    savingHtml,
    apiProcessingStatus,
    fetchProductDetail,
    updateProduct,
    updateEnPrice,
    translateSku,
    saveCate,
    translateParamHtml,
    saveParamHtml,
    updateShopifyId,
    editShopifyId,
    deleteDetailImage,
    updateProductHtml,
    generateDetailImagesHtml,
    cleanTitleAttributes,
    synchronizeProductHtmlToShopify,
    synchronizeProductInfoToShopify,
    synchronizeSkuToShopify
  }
}