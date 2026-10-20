# 打包 OOM 根因分析与修复（2026-10-20）

## 症状
500+→641 页规模后，`npm run generate` 反复被杀，进程退出码 **143（SIGTERM）/137（SIGKILL）**，日志无 V8 "JavaScript heap out of memory" 字样，死在打包或预渲染阶段，**时好时坏不确定**。

## 根因：配置问题，不是环境/代码问题

`NODE_OPTIONS='--max-old-space-size=8192 --max-semi-space-size=1024'` 写死在构建脚本里，而本机物理内存就是 **8GB**。三重错误叠加：

1. **堆上限 = 物理内存**（`max-old-space-size=8192`）。V8 认为"还有 8GB 可用"，于是**几乎不主动 GC**，堆一路涨到逼近 8GB。
2. **semi-space 1024MB ×（新生代双半区）= 2GB** 长期被 V8 保留，纯浪费。
3. 峰值 RSS = **V8 堆(→8GB) + rolldown 的原生 Rust 压缩内存 + OS/其他** > 8GB 物理 → macOS 内存压力（jetsam）对进程先发 **SIGTERM（退出码 128+15=143）**，再 SIGKILL(137)。所以看不到 V8 自己的 OOM 报错——是**操作系统先杀的**，不是 JS 堆溢出。

这也解释了"时好时坏"：堆 cap 顶到物理内存=**零余量**，只要并发有别的内存占用（孤儿构建进程、并行 agent、系统缓存）就被挤爆；清干净偶发能过。

## 为什么 Next.js / Astro 几百页不 OOM（关键对比）

| | Astro | Next.js 静态导出 | 本项目 Nuxt generate |
|---|---|---|---|
| V8 堆上限 | 默认（物理的一半左右） | 默认 | **写死 = 物理内存 8192** ← 唯一异常项 |
| 页面产出模型 | 每页独立子进程渲染，流式写盘，内存恒定低 | React 流式渲染，逐路由，默认堆 | **单进程 nitro worker 一次性预渲染 641 路由**，模块图整包常驻 |
| 内存特征 | 常数级、进程用完即回收 | 较平 | 峰值高、进程存活久、GC 行为被超大 cap 抑制 |

Nuxt 的预渲染本就比 Astro/Next 吃内存（同一进程持全量应用图 + 批量渲染），**再配一个等于物理内存的堆上限**，等于取消了 V8 的自我限流 → 撞上系统墙。把 cap 降到物理内存的一半，V8 会在预算内主动 GC，总占用受控，构建稳定完成（代价是 GC 更勤、变慢，但不再被杀）。

## 修复（已实施）

1. 新增 `scripts/heap-size.cjs`：按物理内存自动算堆上限——`min(6GB, max(3GB, 总内存×50%))`。8GB→**4096**，16GB→6144。可用环境变量 `MAX_HEAP_MB` 覆盖。
2. `package.json` 的 `generate` / `build:nuxt` 改为 `--max-old-space-size=$(node scripts/heap-size.cjs) --max-semi-space-size=256`（semi 1024→256）。
3. 同步修 `package-static.sh`、`scripts/build-optimized.sh`、`build-simple.sh`、`fix-blog-build.sh`、`dev-ultra-fast.sh` 里所有写死的 8192。
4. （上一轮已做）`nuxt.config.ts` 的 `rollup-plugin-visualizer` 改为仅 `ANALYZE=1` 时启用，去掉打包期收集 stats 的额外内存。

## 验证

- 用 `4096` 堆 + 清理孤儿进程后跑完整 `nuxt generate`：**16m50s 成功**，产出 641 工具页、零 `[500]`、`.output/public` 完整可部署。
- 对比：同机、同代码，`8192` 那次在第 6-7 分钟被 OS 杀（143）。堆大小是唯一变量。
- 耗时变长（约 10-17min）是 V8 主动 GC 的代价，换来稳定不崩，符合预期。

## 若将来仍需更快的构建（可选优化，未做）

- **分页/降 GC**：预渲染是主要耗时，可 `nitro.prerender.concurrency` 提到 3-4（内存有余时），或给大机（16GB+）跑——helper 会自动放大堆。
- **`tool-tutorials.json`（346KB）** 现由 default layout 的 `TutorialLinks.vue` 静态 import，会进每个工具页的 SSR bundle；如需再压内存可改为运行期一次性共享或瘦身，但当前非瓶颈。
- 保留 `payloadExtraction: true`、esbuild 压缩（此前 terser 才是最大内存杀手，已换）。
- 部署机内存不足时，先 `pkill -f "nuxt generate"` 清孤儿再构建；孤儿 worker 进程会占锁（.nuxt/build.lock）并吃掉数 GB。

## 结论一句话
是**配置问题**：`max-old-space-size` 被写死成等于物理内存，取消了 V8 的内存自限，叠加 Nuxt 单进程全量预渲染的原生占用，被 macOS 内存压力杀；改堆上限=物理一半后稳定通过，与 Next/Astro 的差异在于二者从不设这么大的堆 cap。
