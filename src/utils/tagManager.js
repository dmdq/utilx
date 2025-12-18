import { tools } from '~/data/tools'

// 标签名称映射表 - 用于中文URL处理
const tagMappings = {
  'JSON': 'json',
  '格式化': 'formatting',
  '美化': 'beautify',
  '压缩': 'compress',
  '验证': 'validation',
  '解析': 'parsing',
  'XML': 'xml',
  '转换': 'convert',
  '数据格式': 'data-format',
  '序列化': 'serialization',
  'YAML': 'yaml',
  '配置文件': 'config',
  '数据处理': 'data-processing',
  '文本工具': 'text-tool',
  'Base64': 'base64',
  '编码': 'encoding',
  '工具': 'tool',
  '实用': 'practical',
  '在线': 'online',
  'URL': 'url',
  'HTML': 'html',
  '便捷': 'convenient',
  '高效': 'efficient',
  '二维码': 'qrcode',
  '生成': 'generate',
  '加密': 'encryption',
  '解密': 'decryption',
  '安全': 'security',
  '哈希': 'hash',
  '开发者': 'developer',
  '文本处理': 'text-processing',
  '数据分析': 'data-analysis',
  '密码学': 'cryptography',
  '网络': 'network',
  '时间': 'time',
  '图像': 'image',
  '文件': 'file',
  '颜色': 'color',
  '随机': 'random',
  '金融': 'finance',
  '健康': 'health',
  '计算器': 'calculator',
  '正则': 'regex',
  '测试': 'test',
  'API': 'api',
  'HTTP': 'http',
  '端口': 'port',
  '域名': 'domain',
  'IP': 'ip'
}

// 反向映射表
const reverseTagMappings = Object.fromEntries(
  Object.entries(tagMappings).map(([key, value]) => [value, key])
)

class TagManager {
  constructor() {
    this._tagsCache = null
    this._initialized = false
  }

  /**
   * 初始化标签数据
   */
  async init() {
    if (this._initialized) return

    console.log('Initializing tag manager...')
    await this.extractTagsFromTools()
    this._initialized = true
    console.log('Tag manager initialized successfully')
  }

  /**
   * 从tools.js提取标签数据
   */
  async extractTagsFromTools() {
    const tagMap = new Map()
    const tagStats = new Map()

    // 遍历所有工具，提取标签
    tools.forEach(tool => {
      if (tool.tags && Array.isArray(tool.tags)) {
        tool.tags.forEach(tag => {
          if (!tag || typeof tag !== 'string') return

          // 清理标签名称
          const cleanTag = tag.trim()
          if (cleanTag.length === 0) return

          // 添加到标签映射
          if (!tagMap.has(cleanTag)) {
            tagMap.set(cleanTag, {
              name: cleanTag,
              displayName: cleanTag,
              urlName: tagMappings[cleanTag] || this.generateUrlName(cleanTag),
              tools: [],
              toolCount: 0,
              description: this.generateTagDescription(cleanTag),
              categories: new Set()
            })
          }

          // 更新标签信息
          const tagInfo = tagMap.get(cleanTag)
          tagInfo.tools.push(tool)
          tagInfo.toolCount++
          tagInfo.categories.add(tool.category)
        })
      }
    })

    // 转换为数组并排序
    const tagsArray = Array.from(tagMap.values())
      .map(tag => ({
        ...tag,
        categories: Array.from(tag.categories),
        hot: tag.toolCount >= 5, // 5个及以上工具的标签为热门
        popularity: this.calculatePopularity(tag.toolCount, tag.tools)
      }))
      .sort((a, b) => {
        // 按热度、工具数量、名称排序
        if (a.hot && !b.hot) return -1
        if (!a.hot && b.hot) return 1
        if (a.toolCount !== b.toolCount) return b.toolCount - a.toolCount
        return a.name.localeCompare(b.name)
      })

    this._tagsCache = tagsArray
    return tagsArray
  }

  /**
   * 获取所有标签
   */
  getAllTags() {
    return this._tagsCache || []
  }

  /**
   * 根据名称获取标签
   */
  getTagByName(name) {
    if (!this._tagsCache) return null
    return this._tagsCache.find(tag =>
      tag.name === name ||
      tag.displayName === name ||
      tag.urlName === name
    ) || null
  }

  /**
   * 根据URL名称获取标签
   */
  getTagByUrlName(urlName) {
    if (!this._tagsCache) return null

    // 首先尝试直接匹配
    let tag = this._tagsCache.find(t => t.urlName === urlName)

    // 如果没找到，尝试通过反向映射查找
    if (!tag && reverseTagMappings[urlName]) {
      const displayName = reverseTagMappings[urlName]
      tag = this._tagsCache.find(t => t.displayName === displayName)
    }

    return tag || null
  }

  /**
   * 根据标签获取工具列表
   */
  getToolsByTag(tagName) {
    const tag = this.getTagByName(tagName)
    return tag ? tag.tools : []
  }

  /**
   * 搜索标签
   */
  searchTags(query, limit = 20) {
    if (!query || !this._tagsCache) return []

    const searchTerm = query.toLowerCase().trim()
    return this._tagsCache
      .filter(tag =>
        tag.name.toLowerCase().includes(searchTerm) ||
        tag.displayName.toLowerCase().includes(searchTerm) ||
        tag.description?.toLowerCase().includes(searchTerm)
      )
      .slice(0, limit)
  }

  /**
   * 获取热门标签
   */
  getPopularTags(limit = 10) {
    if (!this._tagsCache) return []

    return this._tagsCache
      .filter(tag => tag.hot)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit)
  }

  /**
   * 按分类获取标签
   */
  getTagsByCategory(category) {
    if (!this._tagsCache) return []

    return this._tagsCache.filter(tag =>
      tag.categories.includes(category)
    )
  }

  /**
   * 生成URL友好的标签名称
   */
  generateUrlName(tagName) {
    // 移除特殊字符，只保留字母、数字和中文
    return tagName
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  /**
   * 生成标签描述
   */
  generateTagDescription(tagName) {
    const descriptions = {
      'JSON': 'JSON数据格式化、解析和转换相关工具',
      '格式化': '代码和数据格式化美化工具',
      '转换': '各种数据格式转换工具',
      '编码': '字符编码和解码工具',
      '加密': '数据加密和安全保护工具',
      '工具': '实用工具集合',
      '在线': '在线使用的网络工具',
      '文本处理': '文本编辑和处理工具',
      '开发者': '面向开发者的专业工具',
      '数据分析': '数据统计和分析工具',
      '图像': '图片处理和转换工具',
      '网络': '网络协议和诊断工具',
      '时间': '时间和日期处理工具',
      '金融': '金融计算和理财工具',
      '健康': '健康指标计算工具',
      '随机': '随机数生成器工具'
    }

    return descriptions[tagName] || `${tagName}相关工具集合`
  }

  /**
   * 计算标签热度
   */
  calculatePopularity(toolCount, tools) {
    // 基于工具数量和工具的viewCount计算热度
    const baseScore = toolCount * 10
    const viewScore = tools.reduce((sum, tool) => sum + (tool.viewCount || 0), 0) / 1000
    return baseScore + viewScore
  }

  /**
   * 获取标签统计信息
   */
  getTagStats() {
    if (!this._tagsCache) return null

    const stats = {
      totalTags: this._tagsCache.length,
      hotTags: this._tagsCache.filter(tag => tag.hot).length,
      totalTools: this._tagsCache.reduce((sum, tag) => sum + tag.toolCount, 0),
      categoryDistribution: {}
    }

    // 统计分类分布
    this._tagsCache.forEach(tag => {
      tag.categories.forEach(category => {
        stats.categoryDistribution[category] = (stats.categoryDistribution[category] || 0) + 1
      })
    })

    return stats
  }

  /**
   * 刷新标签缓存
   */
  async refreshCache() {
    this._tagsCache = null
    this._initialized = false
    await this.init()
  }

  /**
   * 获取相关标签
   */
  getRelatedTags(tagName, limit = 5) {
    const targetTag = this.getTagByName(tagName)
    if (!targetTag) return []

    // 基于共同工具分类和类别查找相关标签
    const relatedTags = this._tagsCache
      .filter(tag => {
        if (tag.name === tagName) return false

        // 如果有共同分类，则认为是相关标签
        const hasCommonCategory = tag.categories.some(cat =>
          targetTag.categories.includes(cat)
        )

        // 或者如果有共同工具
        const hasCommonTools = tag.tools.some(tool =>
          targetTag.tools.some(t => t.id === tool.id)
        )

        return hasCommonCategory || hasCommonTools
      })
      .sort((a, b) => {
        // 按相关度排序
        const aCommonCategories = a.categories.filter(cat =>
          targetTag.categories.includes(cat)
        ).length
        const bCommonCategories = b.categories.filter(cat =>
          targetTag.categories.includes(cat)
        ).length

        if (aCommonCategories !== bCommonCategories) {
          return bCommonCategories - aCommonCategories
        }

        return b.toolCount - a.toolCount
      })
      .slice(0, limit)

    return relatedTags
  }
}

// 创建单例实例
const tagManager = new TagManager()

// 在客户端和服务端都可用
export default defineNuxtPlugin(async (nuxtApp) => {
  // 在服务端和客户端都初始化
  if (process.server || process.client) {
    await tagManager.init()
  }

  // 将实例注入到应用上下文
  nuxtApp.provide('tagManager', tagManager)
})

// 直接导出实例，用于在组件中使用
export { tagManager }

// 导出类型定义
export const TagManagerTypes = {
  Tag: {
    name: String,
    displayName: String,
    urlName: String,
    tools: Array,
    toolCount: Number,
    description: String,
    categories: Array,
    hot: Boolean,
    popularity: Number
  }
}