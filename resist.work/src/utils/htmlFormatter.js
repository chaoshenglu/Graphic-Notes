/**
 * HTML格式化工具
 * 用于格式化HTML代码，使其更易读
 */

/**
 * 格式化HTML代码
 * @param {string} html - 原始HTML代码
 * @param {object} options - 格式化选项
 * @returns {string} 格式化后的HTML代码
 */
export function formatHtml(html, options = {}) {
  if (!html || typeof html !== 'string') {
    return ''
  }

  const {
    indent = '  ', // 缩进字符，默认两个空格
    maxLineLength = 120, // 最大行长度
    preserveNewlines = true // 是否保留原有换行
  } = options

  // 移除多余的空白字符
  let formatted = html.trim()
    .replace(/\s+/g, ' ') // 将多个空白字符替换为单个空格
    .replace(/> </g, '>\n<') // 在标签之间添加换行

  // 定义需要换行的标签
  const blockTags = [
    'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
    'thead', 'tbody', 'tfoot', 'section', 'article',
    'header', 'footer', 'nav', 'main', 'aside'
  ]

  // 在块级标签前后添加换行
  blockTags.forEach(tag => {
    const openTagRegex = new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi')
    const closeTagRegex = new RegExp(`</${tag}>`, 'gi')
    
    formatted = formatted
      .replace(openTagRegex, '\n$&\n')
      .replace(closeTagRegex, '\n$&\n')
  })

  // 分割成行并处理缩进
  const lines = formatted.split('\n').filter(line => line.trim())
  const result = []
  let indentLevel = 0

  lines.forEach(line => {
    const trimmedLine = line.trim()
    
    if (!trimmedLine) return

    // 检查是否是结束标签
    if (trimmedLine.startsWith('</')) {
      indentLevel = Math.max(0, indentLevel - 1)
    }

    // 添加缩进
    const indentedLine = indent.repeat(indentLevel) + trimmedLine
    result.push(indentedLine)

    // 检查是否是开始标签（非自闭合标签）
    if (trimmedLine.startsWith('<') && 
        !trimmedLine.startsWith('</') && 
        !trimmedLine.endsWith('/>') &&
        !isSelfClosingTag(trimmedLine)) {
      indentLevel++
    }
  })

  return result.join('\n')
}

/**
 * 检查是否是自闭合标签
 * @param {string} line - 标签行
 * @returns {boolean}
 */
function isSelfClosingTag(line) {
  const selfClosingTags = [
    'img', 'br', 'hr', 'input', 'meta', 'link',
    'area', 'base', 'col', 'embed', 'source',
    'track', 'wbr'
  ]
  
  return selfClosingTags.some(tag => {
    const regex = new RegExp(`<${tag}(\\s|>)`, 'i')
    return regex.test(line)
  })
}

/**
 * 压缩HTML代码（移除不必要的空白）
 * @param {string} html - HTML代码
 * @returns {string} 压缩后的HTML代码
 */
export function minifyHtml(html) {
  if (!html || typeof html !== 'string') {
    return ''
  }

  return html
    .replace(/\s+/g, ' ') // 将多个空白字符替换为单个空格
    .replace(/> </g, '><') // 移除标签间的空格
    .replace(/^\s+|\s+$/g, '') // 移除首尾空白
}