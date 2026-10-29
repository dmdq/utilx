export default defineNuxtPlugin((nuxtApp) => {
  // 只在生产环境且客户端执行
  if (process.client && process.env.NODE_ENV === 'production') {
    // 加载百度统计代码
    window._hmt = window._hmt || [];
    (function() {
      var hm = document.createElement('script');
      hm.src = 'https://hm.baidu.com/hm.js?e4eecf762fcb8bc3aa16d8d07593a20f';
      document.head.appendChild(hm);
    })();

    // SPA 客户端路由切换不会触发百度统计自动上报，手动补报 PV
    // （hm.js 加载时会自动统计首次进入页面，afterEach 首跳跳过避免重复计数）
    var firstNavigation = true;
    nuxtApp.$router.afterEach((to) => {
      if (firstNavigation) {
        firstNavigation = false;
        return;
      }
      window._hmt.push(['_trackPageview', to.fullPath]);
    });
  }
})
