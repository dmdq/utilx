# 有条工具（Util.cn）系统体检报告

- **体检日期**：2026-10-09
- **体检基线**：main @ 0f5d510，全站 503 工具 / 16 分类 / 57 篇博客
- **体检范围**：git 仓库卫生、依赖安全、工具注册表完整性、构建/部署链路、PWA 资产、代码层隐患
- **方法**：静态核查 + 自写校验脚本（注册表 vs 磁盘页面逐一对账）+ `pnpm audit`（官方源）+ 构建产物 `.output/public` 实测 + 线上响应头实测

---

## 总体结论

**核心数据非常健康，问题集中在 PWA 资产断链、Service Worker 双注册打架、依赖漏洞三块。**

| 维度 | 评价 | 说明 |
|---|---|---|
| 工具注册表完整性 | ★★★★★ | 503 工具：重复 id 0、孤儿页 0、死链 0、分类映射 16/16、图标映射全覆盖 |
| 博客/内容管道 | ★★★★★ | 0 草稿、无未来日期雷、/blog/ 预渲染排除已生效 |
| 依赖安全 | ★★☆☆☆ | 直接依赖 2 个 critical（jspdf）+ 多个 high 可升即修；xlsx 无修复版 |
| PWA 资产一致性 | ★★☆☆☆ | 图标全部 404、双 manifest 并存、双 Service Worker 互相覆盖 |
| 工程卫生 | ★★★☆☆ | .env.local 入库、.git 128MB 松散对象、死配置/死脚本若干 |

---

## P1 — 高优先级（有真实用户/安全影响）

### 1. PWA 图标全部 404，安装体验破图
两个 manifest（静态 `public/manifest.json` 与 vite-pwa 生成的 `manifest.webmanifest`）的 icons 都指向 `logo/logo-96/128/256/512.png`，但 `public/logo/` 目录**不存在**；`nuxt.config.ts:327` 引用的 `/icon-192.png`（apple-touch-icon）同样不存在。实测 `.output/public/logo/` 不存在。

**影响**：PWA 安装到桌面/主屏显示破图或默认图标，Lighthouse PWA 项必挂。
**整改**：用现有 logo 生成 96/128/256/512 四个尺寸放入 `public/logo/`，并补 `icon-192.png`、`icon-512.png`；生成后重新 `npm run build:static` 验证产物里有 `logo/` 目录。

### 2. 双 Service Worker 注册互相覆盖
`src/plugins/pwa.client.js:7` 手动注册 `/sw-push.js`（手写版，cache-first、静态资源列表硬编码），同时 vite-pwa（`registerType: 'autoUpdate'`，注入 workbox 版 `/sw.js`）。两者同 scope `/`：

- 手写 `public/sw.js` 在构建时已被 workbox 生成的 sw.js **覆盖**（源码里是死代码）；
- `sw-push.js` 却真实注册，与注入的 workbox SW 同 scope 竞争控制权，最终谁接管取决于注册时序——缓存策略不可预期，`util-static-v1` 旧缓存可能长期滞留；
- `pwa.client.js:23` 还有原生 `confirm()` 更新弹窗，与 autoUpdate 模式矛盾，打扰用户。

**整改**：二选一并删掉另一套。推荐保留 vite-pwa workbox：删除 `public/sw.js`、`public/sw-push.js`，`pwa.client.js` 去掉 SW 注册与 confirm 逻辑（保留 install prompt 部分可选）；推送推送（gcm_sender_id 还是占位注释"需要替换为您的"）未真正配置，一并清理或补全。

### 3. jspdf 存在 2 个 critical 漏洞（随客户端发布）
`jspdf ^3.0.4`：PDF 注入→任意 JS 执行（多个 high）、HTML Injection（critical，≤4.2.0）、LFI/路径穿越（critical，≤3.0.4）。修复版 **4.2.1**（已发布）。jsPDF 被用户用来导出 PDF，属于真实攻击面（解析/生成恶意文档场景）。

**整改**：`pnpm up jspdf@4.2.1`（major 升级，注意 API breaking changes，重点回归用到 jsPDF 的工具页）。

### 4. nuxt 4.2.2 落后多个安全修复
最新 4.6.0。关键修复：**≥4.4.7 修 NuxtLink 对 `javascript:`/`data:` URL 的反射 XSS**（与本站工具页渲染用户输入的场景相关）、`navigateTo` 开放重定向；**≥4.5.1 修 island 端点 RCE**（静态部署无 server，风险低但 dev 模式暴露）。

**整改**：升到 ≥4.5.1（建议直接 4.6.0），升级后跑 `nuxt generate` 全量 + 抽样工具页回归。另：`dev` 脚本带 `--host`，devtools+dev server 会暴露到局域网（devtools 有 critical RCE 修复 <3.3.1），不要在不可信网络下 `--host` 起 dev。

---

## P2 — 中优先级（卫生、一致性、效能）

### 5. xlsx 0.18.5：npm 上无修复版的已知漏洞
Prototype Pollution（<0.19.3）+ ReDoS（<0.20.2），**npm registry 永远停在 0.18.5**（SheetJS 转自有 CDN）。纯本地解析场景下攻击面=用户自己解析恶意文件，风险可控但应处置：
- 方案 A：依赖源换成 `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`；
- 方案 B：迁移 exceljs；
- 至少：在 README/此报告记录已知风险与不升级理由。

### 6. 其余直接依赖漏洞（有修复版，顺手升）
| 包 | 当前 | 问题 | 修复 |
|---|---|---|---|
| exifreader | ^4.33.1 | high DoS（恶意 ICC/HEIC） | 升 4.47.0（低风险） |
| node-forge | ^1.4.0 | high：RSA PKCS#1 v1.5 验签缺陷，npm 无修复版 | 关注上游；本站仅加密/签名工具用到，记录风险 |
| 构建链传递依赖（tar/minimatch/rollup/simple-git/vite 等） | — | 103 high 多在此 | `pnpm up` 传递刷新 + `pnpm dedupe`，定期滚动 |

### 7. `.env.local` 被 git 跟踪
`git ls-files` 确认入库。当前内容只有 CHOKIDAR/NODE_OPTIONS（无秘密），但违背 `.env*` 惯例，将来一旦写入真实密钥就直接泄露。
**整改**：`git rm --cached .env.local`，`.gitignore` 补 `.env.local`（untrack 不影响本地使用）。顺带：`.env` 的 `CUSTOM_HEAD_SCRIPTS` 是多行带引号值（51.la 统计），依赖 dotenv 多行语法，`CUSTOM_FOOTER_SCRIPTS` 值疑似残留 `===`，建议人工核对统计脚本注入是否生效。

### 8. .git 膨胀：128MB 松散对象 + 22MB 大文件反复入库
- `git count-objects`：松散对象 128MiB（pack 仅 15.86MiB）→ 跑一次 `git gc` 可回收。
- `blog/public/index.json`（Hugo 全文搜索索引）单文件 22MB、已提交 16 次，是仓库膨胀主力。建议：Hugo 模板精简索引字段（只留 title/href/摘要）或 minify；是否把 `blog/public` 移出 git 属于既有约定，**需你拍板**，本报告只记录成本。

### 9. 线上缺安全响应头 + HTML 无缓存策略
实测 `https://www.util.cn/` 响应头：只有 HSTS，**没有 CSP / X-Content-Type-Options / X-Frame-Options / Referrer-Policy / Permissions-Policy**；HTML 也没显式 Cache-Control（靠浏览器启发式缓存，发版后有陈旧窗口）。`nuxt.config.security.js` 里写好了一套安全头但**全仓库无任何引用，是死配置**（且其 CSP `connect-src api.iskytrip.com` 来源不明，真启用会挡掉 51.la 统计）。`routeRules` 里 20 条 cache-control 在 `nuxt generate` 静态部署下也不生效（nginx 不吃 Nitro headers）。
**整改**：在 nginx 层补安全头 + 缓存策略（HTML `no-cache`、`_nuxt/**` `immutable`）；删除或改写 `nuxt.config.security.js`。

### 10. 双 manifest 并存
构建产物同时有 `manifest.json`（静态文件）与 `manifest.webmanifest`（vite-pwa 生成），内容重复、图标都坏；构建出的 HTML 只链接静态版，vite-pwa 的 webManifest 配置实际被遮蔽。
**整改**：与 P1-1 图标修复一并收敛成一份（推荐交给 vite-pwa 管，删静态 `public/manifest.json`；或反向）。

---

## P3 — 低优先级 / 观察项

11. **死脚本/死配置清理**：`package.json` 的 `dev:v4` 指向根目录不存在的 `nuxt.config.v4.ts`（文件实际在 `cfg/`）；`start` = `nuxt start` 在 Nuxt 4 已不存在；`cfg/` 里 4 个 nuxt 配置变体属于历史试验，可归档。
12. **页面组织不一致 + 垃圾文件**：503 个工具页里 501 个是 `<id>.vue`，2 个是 `<id>/index.vue`（spine-animation-editor、teleprompter）——功能正常但建议统一；`src/pages/tools/` 下有 4 个 `.vue.bak`（investment-calculator、quick-notes、retirement-planner、speed-calculator），可直接删。
13. **package.json 细节**：`@types/qrcode` 应移到 devDependencies；`version: "v1.1.0"` 带非 semver 的 `v` 前缀。
14. **README 过时**：还写着"200+个工具页面"，实际 503。
15. **SSR 隐患残留低**：全站仅 3 页用 `immediate: true` watch，启发式扫描提示 `clipboard-manager-pro.vue`、`json-to-model.vue` 同文件使用浏览器 API 且无 `import.meta.server`/`process.client` 守卫——大概率在 onMounted 里，建议人工复核一遍（xml-to-model 已修）。
16. **sortOrder 冲突 4 组**：dev#1050（jvm-args-config vs code-snippet-converter）、finance#1360/1370/1380——同分类内排序不稳定，不影响功能，顺手改成不重复即可。
17. **目录双 public 约定**：`srcDir: 'src/'` 下 `dir.public` 解析到不存在的 `src/public`，静态资源实际靠根 `public/` + `nitro.publicAssets` 挂载——能跑但两套约定并存，建议在 README 注明，防新人踩坑。
18. **磁盘占用**（均已 gitignore，仅占本地盘）：`public/blog/` 106MB + `blog/public/` 106MB（Hugo 产物双份，可改 `hugo -d ../public/blog` 免一份拷贝，需改 `blog:build` 脚本验证）+ `.output/` 158MB + 根目录 27MB zip + 768KB stats.html。

---

## 体检中确认健康的部分（保持现状）

- 注册表 503 工具与磁盘页面**逐一对账通过**：无重复 id、无孤儿页、无死链（目录式页面初判为死链，已复核排除）、16 分类映射完整、`toolIcons.js` 图标全覆盖（0 个兜底依赖）。
- 博客：0 草稿、最新文章日期 2026-10-03（全部已过发布时间，无未来日期静默跳过风险）；预渲染 `ignore: [/^\/blog\//]` 已生效。
- `.env` 本体未入库；`stats.html`、`utilx-static-*.zip`、`.DS_Store`、`dist` 软链均已正确 gitignore。
- 内存参数固化（build:nuxt/generate 内置 8GB 堆）、payloadExtraction、PWA 4MiB 预缓存上限等既往修复均在位。

## 建议整改顺序

1. **半天内**：P1-1 图标（生成 4+2 个 PNG）→ P1-3 `pnpm up jspdf@4.2.1` + exifreader → P2-7 `git rm --cached .env.local` → `git gc`。
2. **一个下午**：P1-2 双 SW 收敛（删手写 SW + 清 pwa.client.js）→ P2-10 双 manifest 收敛 → P1-4 nuxt 升级（4.2.2→4.6.0，`nuxt generate` 全量回归 + 抽样 10 页）。
3. **择机**：P2-9 nginx 安全头/缓存策略 → xlsx 源切换决策 → P3 清理批次（死脚本、.bak、sortOrder、README）。
4. **需拍板**：`blog/public` 是否移出 git；xlsx 换源方案 A/B。
