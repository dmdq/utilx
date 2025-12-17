import { siteConfig } from '~/data/site'

/**
 * 设置页面标题，自动添加SEO后缀
 * @param {string} title - 页面标题（不包含后缀）
 */
export const setPageTitle = (title) => {
  if (typeof document === 'undefined') {
    // SSR环境，跳过
    return
  }

  if (!title) {
    // 如果没有提供标题，使用默认标题
    document.title = siteConfig.title
    return
  }

  // 检查标题是否已经包含后缀
  if (title.includes(siteConfig.titleSuffix)) {
    document.title = title
  } else {
    document.title = title + siteConfig.titleSuffix
  }
}

/**
 * 获取完整的页面标题（包含后缀）
 * @param {string} title - 页面标题（不包含后缀）
 * @returns {string} 完整的页面标题
 */
export const getFullPageTitle = (title) => {
  if (!title) {
    return siteConfig.title
  }

  if (title.includes(siteConfig.titleSuffix)) {
    return title
  }

  return title + siteConfig.titleSuffix
}

/**
 * 为工具页面生成标题
 * @param {string} toolName - 工具名称
 * @param {string} toolDescription - 工具描述（可选）
 * @returns {string} 完整的工具页面标题
 */
export const generateToolPageTitle = (toolName, toolDescription = '') => {
  if (toolDescription) {
    return `${toolName} - ${toolDescription}`
  }
  return `${toolName} - 在线工具`
}

/**
 * 为分类页面生成标题
 * @param {string} categoryName - 分类名称
 * @param {string} categoryDescription - 分类描述（可选）
 * @returns {string} 完整的分类页面标题
 */
export const generateCategoryPageTitle = (categoryName, categoryDescription = '') => {
  if (categoryDescription) {
    return `${categoryName} - ${categoryDescription}`
  }
  return `${categoryName} - 工具集合`
}

/**
 * Vue 3 Composable - 用于管理页面标题
 * @returns {Object} 包含SEO相关函数的对象
 */
export const useSEO = () => {
  const setPageTitleComposable = (title) => {
    // 使用 useHead 来设置页面标题（适用于SSR）
    const fullTitle = getFullPageTitle(title)
    useHead({
      title: fullTitle
    })

    // 同时设置document.title（适用于客户端）
    if (typeof document !== 'undefined') {
      document.title = fullTitle
    }
  }

  return {
    setPageTitle: setPageTitleComposable,
    getFullPageTitle,
    generateToolPageTitle,
    generateCategoryPageTitle,
    siteConfig
  }
}