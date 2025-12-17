import { siteConfig } from '~/data/site'

// SEO插件 - 全局管理页面标题
export default defineNuxtPlugin(() => {
  // 监听路由变化，自动设置页面标题
  const router = useRouter()

  // 全局函数：设置页面标题
  const setPageTitle = (title) => {
    if (!title) {
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

  // 将函数注入到全局
  window.setPageTitle = setPageTitle

  // 提供给Vue实例使用
  provide('setPageTitle', setPageTitle)

  // 监听路由变化
  router.afterEach((to) => {
    // 如果路由元数据中有标题，使用它
    if (to.meta?.title) {
      setPageTitle(to.meta.title)
    }
  })
})

// 声明全局类型
if (typeof window !== 'undefined') {
  window.setPageTitle = function(title) {
    const siteConfig = window.siteConfig || { title: 'Util', titleSuffix: ' | Util 开发者效率工具箱' }

    if (!title) {
      document.title = siteConfig.title
      return
    }

    if (title.includes(siteConfig.titleSuffix)) {
      document.title = title
    } else {
      document.title = title + siteConfig.titleSuffix
    }
  }
}