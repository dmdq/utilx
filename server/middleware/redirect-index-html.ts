export default defineEventHandler((event) => {
  const path = event.node.req.url

  // 将 /blog/index.html 重定向到 /blog/
  if (path?.endsWith('/blog/index.html')) {
    return sendRedirect(event, '/blog/', 301)
  }

  // 通用的 index.html 重定向规则
  if (path?.endsWith('/index.html')) {
    const cleanPath = path.replace('/index.html', '/')
    return sendRedirect(event, cleanPath, 301)
  }
})
