export default defineNuxtPlugin(() => {
  // 只在生产环境且客户端执行
  if (process.client && process.env.NODE_ENV === 'production') {
    // 加载51la统计代码
    (function() {
      var la = document.createElement('script');
      la.charset = 'UTF-8';
      la.id = 'LA_COLLECT';
      la.src = '//sdk.51.la/js-sdk-pro.min.js';
      document.head.appendChild(la);

      la.onload = function() {
        if (typeof LA !== 'undefined') {
          LA.init({id:"3OM52V0xJAPv6ozF",ck:"3OM52V0xJAPv6ozF"});
        }
      };
    })();
  }
})