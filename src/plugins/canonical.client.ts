export default defineNuxtPlugin((nuxtApp) => {
  const route = useRoute()
  const router = useRouter()
  const config = useRuntimeConfig()

  // 获取基础URL
  const baseUrl = config.public.siteUrl || 'https://www.util.cn'

  // 构建规范URL
  const getCanonicalUrl = (path: string) => {
    return baseUrl + (path === '/' ? '' : path)
  }

  // 初始设置 canonical URL
  useHead({
    link: [
      {
        rel: 'canonical',
        href: getCanonicalUrl(route.path)
      }
    ]
  })

  // 监听路由变化
  router.afterEach((to) => {
    // 更新 canonical URL
    const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement

    if (canonicalLink) {
      canonicalLink.href = getCanonicalUrl(to.path)
    } else {
      // 如果没有找到，创建一个新的
      const link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      link.setAttribute('href', getCanonicalUrl(to.path))
      document.head.appendChild(link)
    }
  })
})