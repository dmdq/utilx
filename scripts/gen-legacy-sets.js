#!/usr/bin/env node
/**
 * 生成「老页面 SEO 缺口清单」src/data/legacy-seo.json（AutoToolSeo.vue 消费）
 * 判定口径（对每个注册工具的页面源码扫描）：
 *   noRelated   —— 页面未引用 <RelatedTools>（布局注入相关工具推荐）
 *   noJsonLd    —— 页面无任何 JSON-LD / @type 结构化数据（布局注入 WebApplication schema）
 *   noSeoMeta   —— 页面既无 useSeoMeta 也无 useHead/useMeta 标题设置（布局注入 meta 回退）
 * 手动补齐某页后重跑本脚本即可把 id 移出集合（npm run gen:legacy-seo）。
 */
const fs = require('fs')
const path = require('path')
const root = path.join(__dirname, '..')
const toolsDir = path.join(root, 'src/pages/tools')

const toolsSrc = fs.readFileSync(path.join(root, 'src/data/tools.js'), 'utf8')
  .replace('export const tools', 'module.exports')
fs.writeFileSync('/tmp/gen-legacy-tools.cjs', toolsSrc)
const tools = require('/tmp/gen-legacy-tools.cjs')

const noRelated = []
const noJsonLd = []
const noSeoMeta = []

for (const t of tools) {
  const file = path.join(toolsDir, t.id + '.vue')
  const dir = path.join(toolsDir, t.id, 'index.vue')
  const src = fs.existsSync(file) ? fs.readFileSync(file, 'utf8')
    : fs.existsSync(dir) ? fs.readFileSync(dir, 'utf8') : null
  if (src == null) continue // 注册无页面由 seo-audit 另行监测
  if (!src.includes('RelatedTools')) noRelated.push(t.id)
  if (!/@type|application\/ld\+json|JSON-LD/i.test(src)) noJsonLd.push(t.id)
  if (!/useSeoMeta|useHead\s*\(|useMeta\s*\(/.test(src)) noSeoMeta.push(t.id)
}

const out = { noRelated, noJsonLd, noSeoMeta, generatedAt: new Date().toISOString() }
fs.writeFileSync(path.join(root, 'src/data/legacy-seo.json'), JSON.stringify(out, null, 2))
console.log(`legacy-seo.json 已生成：noRelated ${noRelated.length} | noJsonLd ${noJsonLd.length} | noSeoMeta ${noSeoMeta.length}`)
