#!/usr/bin/env node
/*
 * 计算安全的 V8 堆上限（MB），避免历史上 `--max-old-space-size=8192` 把堆上限
 * 设成等于物理内存——那会让 V8 几乎不主动 GC、堆一路涨到物理内存顶，叠加
 * rolldown 的原生(Rust)压缩内存 + 操作系统占用后总 RSS 超过物理内存，被 macOS
 * 内存压力用 SIGTERM/SIGKILL 杀掉（退出码 143/137），表现为"打包随机 OOM"。
 *
 * 规则：取物理内存的 62.5%、上限 6GB，下限 3GB。8GB 机→5120，16GB 机→6144（封顶）。
 * 历史演变：50%（8GB→4096）在 991 页时仍够用，第 1000 页（2026-11-08 第 36 批）
 * 预渲染阶段 V8 堆 OOM（"Ineffective mark-compacts near heap limit"），实测 5120 可过；
 * 62.5% 仍给 OS+rolldown 原生内存留 3GB，未回到 8192=100% 被 jetsam 杀的老坑。
 * 可用 MAX_HEAP_MB 环境变量覆盖。
 */
const os = require('os')
if (process.env.MAX_HEAP_MB) {
  process.stdout.write(process.env.MAX_HEAP_MB)
  process.exit(0)
}
const totalGB = os.totalmem() / 1073741824
const half = Math.floor((totalGB * 0.625) * 1024) // MB
const heap = Math.min(6144, Math.max(3072, half))
process.stdout.write(String(heap))
