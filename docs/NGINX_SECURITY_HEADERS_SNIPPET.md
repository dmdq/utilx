# Nginx 安全头与缓存策略配置片段

> 对应体检报告 P2-9（2026-10-09）：实测线上仅有 HSTS，缺安全响应头，HTML 无显式 Cache-Control。
> 本片段部署在服务器 nginx 上（仓库配置改不了线上），加到 `server { }` 块即可。

## 配置片段

```nginx
# ---- 安全响应头 ----
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

# CSP 注意：站点使用 51.la 统计（sdk.51.la / cli.51.la），
# Vue 运行时需要内联事件，Vite 产物需要自身脚本，故 script-src 需放行 'unsafe-inline'
# （若未来要收紧，需要先把 51.la 改为 nonce 加载、模板去掉内联事件）
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://sdk.51.la https://cli.51.la; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://cli.51.la https://sdk.51.la; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; upgrade-insecure-requests" always;

# ---- 缓存策略（静态站关键：HTML 不缓存，指纹资源长缓存）----
# HTML：每次协商校验，发版即刻生效
location ~* \.html$ {
    add_header Cache-Control "no-cache, must-revalidate" always;
    # 上面的安全头在嵌套 location 会被覆盖，需重复继承或放到 server 级并用 always
    try_files $uri $uri/ $uri/index.html =404;
}

# 带 hash 的构建产物：一年 immutable
location /_nuxt/ {
    add_header Cache-Control "public, max-age=31536000, immutable" always;
}

# 图片/字体等静态资源
location ~* \.(png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot)$ {
    add_header Cache-Control "public, max-age=2592000" always;
}
```

## 部署注意事项

1. **`add_header` 继承陷阱**：nginx 的 `add_header` 在子 `location` 里定义后会**整体覆盖**父级——如果按上面拆了多个 location，安全头要么挪到每个 location，要么只在 `server` 级写、location 里不再出现任何 `add_header`（推荐前者，缓存头必须按资源类型区分）。
2. **CSP 先观察后启用**：上线前先用 `Content-Security-Policy-Report-Only` 同值跑几天，看浏览器控制台/报告确认 51.la、Hugo 博客内联脚本、PWA（manifest.webmanifest、sw.js）都没被拦，再切成强制头。
3. **`X-Frame-Options` vs `frame-ancestors`**：新浏览器以 CSP 的 `frame-ancestors` 为准；`SAMEORIGIN` 比原死配置里的 `DENY` 更稳妥（不影响站内预览）。
4. **不要照抄旧 `nuxt.config.security.js`**：其中 `connect-src api.iskytrip.com` 与本站无关（已确认该文件从未被引用，本次整改已删除），`frame-src 'none'` 会连自站 iframe 预览一起禁掉。
5. **部署后验证**：
   ```bash
   curl -sI https://www.util.cn/ | grep -iE 'content-security|x-content-type|x-frame|referrer|permissions|cache-control'
   curl -sI https://www.util.cn/_nuxt/$(curl -s https://www.util.cn/ | grep -o '_nuxt/[^"]*\.js' | head -1 | cut -d/ -f2) | grep -i cache-control
   ```
   预期：HTML 返回 `no-cache, must-revalidate` 与全部安全头；`_nuxt` 资源返回 `immutable`。
