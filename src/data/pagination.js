import { tools } from './tools.js'

/**
 * 全部工具目录分页配置
 *
 * 分页使用真实路径（/all/page/2），而不是 query（/all?page=2），
 * 这样 nuxt generate 能为每一页产出独立静态文件，nginx 可直接命中：
 *   /all/page/2  ->  all/page/2/index.html
 */
export const TOOLS_PAGE_SIZE = 48

export const TOTAL_TOOL_PAGES = Math.max(1, Math.ceil(tools.length / TOOLS_PAGE_SIZE))

/**
 * 页码转规范路径：第 1 页回到 /all，其余为 /all/page/N
 * @param {number} page
 * @returns {string}
 */
export const toolPagePath = (page) => {
  const n = Math.max(1, Number(page) || 1)
  return n === 1 ? '/all' : `/all/page/${n}`
}
