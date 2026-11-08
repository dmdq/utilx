#!/usr/bin/env node
/**
 * 全站 SEO 体检（1000 款节点专项）
 * 用法：node scripts/seo-audit.js [--site .output/public]
 * 输出：控制台摘要 + docs/SEO_AUDIT_<date>.md
 * 覆盖：TDK 重复度 / 标题描述长度 / 关键词蚕食 / 静态产物死链 / 博客内链深度 / 专题覆盖
 */
const fs = require('fs')
const path = require('path')

const root = process.cwd()
const args = process.argv.slice(2)
const siteIdx = args.indexOf('--site')
const siteDir = siteIdx >= 0 ? args[siteIdx + 1] : null
const today = new Date().toISOString().slice(0, 10)
const outPath = path.join(root, 'docs', `SEO_AUDIT_${today}.md`)

// ---------- 数据加载 ----------
const toolsSrc = fs.readFileSync(path.join(root, 'src/data/tools.js'), 'utf8')
  .replace('export const tools', 'module.exports')
fs.writeFileSync('/tmp/seo-tools.cjs', toolsSrc)
const tools = require('/tmp/seo-tools.cjs')

const lines = []
const sec = (t) => lines.push(`\n## ${t}\n`)
const row = (s) => lines.push(s)

// ---------- 1. TDK 重复度 ----------
sec('1. 注册表 TDK 重复度')
const nameCount = {}
const descCount = {}
for (const t of tools) {
  nameCount[t.name] = (nameCount[t.name] || 0) + 1
  descCount[t.description] = (descCount[t.description] || 0) + 1
}
const dupNames = Object.entries(nameCount).filter(([, n]) => n > 1)
const dupDescs = Object.entries(descCount).filter(([, n]) => n > 1)
row(`- 工具总数：${tools.length}`)
row(`- **重名工具：${dupNames.length} 组**${dupNames.length ? '：' + dupNames.map(([n, c]) => `${n}×${c}`).join('、') : ''}`)
row(`- **重复描述：${dupDescs.length} 组**${dupDescs.length ? '：' + dupDescs.slice(0, 10).map(([n, c]) => `${n.slice(0, 18)}…×${c}`).join('、') : ''}`)
// 描述前 16 字相同视为近似（同质化模板预警）
const prefixCount = {}
for (const t of tools) {
  const k = t.description.slice(0, 16)
  prefixCount[k] = (prefixCount[k] || 0) + 1
}
const nearDescs = Object.entries(prefixCount).filter(([, n]) => n >= 3)
row(`- 描述前缀雷同（≥3 款同开头 16 字）：${nearDescs.length} 组${nearDescs.length ? '：' + nearDescs.slice(0, 8).map(([n, c]) => `${n}…×${c}`).join('、') : ''}`)

// ---------- 2. 标题/描述长度 ----------
sec('2. 名称与描述长度分布')
const nameLens = tools.map((t) => t.name.length)
const descLens = tools.map((t) => t.description.length)
const pct = (arr, p) => arr.slice().sort((a, b) => a - b)[Math.floor(arr.length * p)]
row(`- 名称长度：中位 ${pct(nameLens, 0.5)}，P90 ${pct(nameLens, 0.9)}，最长 ${Math.max(...nameLens)}（>10 字 ${nameLens.filter((l) => l > 10).length} 款）`)
row(`- 描述长度：中位 ${pct(descLens, 0.5)}，P90 ${pct(descLens, 0.9)}；过短(<20字) ${descLens.filter((l) => l < 20).length} 款，过长(>75字) ${descLens.filter((l) => l > 75).length} 款`)
const shortDescs = tools.filter((t) => t.description.length < 20).slice(0, 8)
if (shortDescs.length) row(`  - 过短示例：${shortDescs.map((t) => `${t.id}(${t.description.length}字)`).join('、')}`)

// ---------- 3. 关键词蚕食 ----------
sec('3. 关键词蚕食（同一关键词 ≥3 款工具声明）')
const kwMap = {}
for (const t of tools) {
  for (const k of t.keywords || []) {
    const key = k.toLowerCase().trim()
    ;(kwMap[key] = kwMap[key] || []).push(t.id)
  }
}
const kwConflicts = Object.entries(kwMap).filter(([_, ids]) => ids.length >= 3).sort((a, b) => b[1].length - a[1].length)
row(`- 共 ${kwConflicts.length} 个关键词被 ≥3 款工具声明；Top10：`)
for (const [kw, ids] of kwConflicts.slice(0, 10)) row(`  - \`${kw}\` ×${ids.length}：${ids.slice(0, 6).join(', ')}${ids.length > 6 ? ' …' : ''}`)

// ---------- 4. 博客内链深度 ----------
sec('4. 博客→工具内链深度')
const postsDir = path.join(root, 'blog/content/posts')
const refCount = {}
let files = 0
const walk = (d) => {
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f)
    if (fs.statSync(fp).isDirectory()) walk(fp)
    else if (f.endsWith('.md')) {
      files++
      const c = fs.readFileSync(fp, 'utf8')
      // 三种引用口径：绝对/相对 URL 与 {{< tool id="x" >}} 短码（与 check-blog-coverage 同口径）
      for (const m of c.matchAll(/tools\/([a-z0-9-]+)/g)) refCount[m[1]] = (refCount[m[1]] || 0) + 1
      for (const m of c.matchAll(/\{\{< tool id="([a-z0-9-]+)" >\}\}/g)) refCount[m[1]] = (refCount[m[1]] || 0) + 1
    }
  }
}
if (fs.existsSync(postsDir)) walk(postsDir)
const refLens = tools.map((t) => refCount[t.id] || 0)
const zero = tools.filter((t) => !refCount[t.id])
const one = tools.filter((t) => refCount[t.id] === 1)
row(`- 文章 ${files} 篇；被引中位 ${pct(refLens, 0.5)}，P90 ${pct(refLens, 0.9)}`)
row(`- **零引用工具：${zero.length} 款**${zero.length ? '：' + zero.slice(0, 10).map((t) => t.id).join(', ') + (zero.length > 10 ? ' …' : '') : ''}`)
row(`- 仅 1 篇引用：${one.length} 款（覆盖达标但深度单薄，持续用聚合文加深）`)

// ---------- 5. 专题覆盖 ----------
sec('5. 专题（collections）覆盖')
const colSrc = fs.readFileSync(path.join(root, 'src/data/collections.js'), 'utf8').replace('export const collections', 'module.exports')
fs.writeFileSync('/tmp/seo-collections.cjs', colSrc)
const collections = require('/tmp/seo-collections.cjs')
const covered = new Set(collections.flatMap((c) => c.tools))
row(`- 专题 ${collections.length} 个，收录 ${covered.size} 款工具（去重），覆盖率 ${(covered.size / tools.length * 100).toFixed(1)}%`)
row(`- 未入任何专题：${tools.length - covered.size} 款（画像关联工具不强制入专题，但聚簇潜力见 37 批实施记录）`)
const dupInCol = {}
for (const c of collections) for (const id of c.tools) (dupInCol[id] = dupInCol[id] || []).push(c.slug)
const multiCol = Object.entries(dupInCol).filter(([_, s]) => s.length >= 3)
row(`- 同时入 ≥3 个专题的工具：${multiCol.length} 款${multiCol.length ? '：' + multiCol.slice(0, 5).map(([id, s]) => `${id}(${s.length})`).join('、') : ''}`)

// ---------- 6. 静态产物死链扫描 ----------
let dead = {}
sec('6. 静态产物死链扫描' + (siteDir ? '' : '（未传 --site，跳过）'))
if (siteDir && fs.existsSync(siteDir)) {
  let htmlCount = 0
  dead = {}
  const targetExists = (p) => {
    const clean = decodeURIComponent(p.split('?')[0].split('#')[0])
    if (!clean.startsWith('/')) return true
    const fp = path.join(siteDir, clean)
    if (fs.existsSync(fp)) {
      if (fs.statSync(fp).isFile()) return true
      if (fs.existsSync(path.join(fp, 'index.html'))) return true
    }
    if (fs.existsSync(fp + '.html')) return true
    if (fs.existsSync(path.join(fp, 'index.html'))) return true
    return false
  }
  const walkHtml = (d) => {
    for (const f of fs.readdirSync(d)) {
      const fp = path.join(d, f)
      const st = fs.statSync(fp)
      if (st.isDirectory()) walkHtml(fp)
      else if (f.endsWith('.html')) {
        htmlCount++
        // 剥离 code/pre 块：示例代码里的 href 字符串不是真链接（< 已转义为 &lt;）
        const c = fs.readFileSync(fp, 'utf8').replace(/<(code|pre)[\s\S]*?<\/\1>/gi, '')
        for (const m of c.matchAll(/href="(\/[^"#?]*)"/g)) {
          // 上下文判定：href 前紧邻 &lt;（转义标签开头）属代码示例文本，非真链接
          if (c.slice(Math.max(0, m.index - 80), m.index).includes('&lt;')) continue
          const href = m[1]
          if (href.startsWith('//')) continue
          if (!targetExists(href)) {
            const rel = path.relative(siteDir, fp)
            ;(dead[href] = dead[href] || []).push(rel)
          }
        }
      }
    }
  }
  walkHtml(siteDir)
  const deadEntries = Object.entries(dead)
  row(`- 扫描 HTML ${htmlCount} 个；**站内死链 ${deadEntries.length} 个目标**（引用页面数合计 ${deadEntries.reduce((a, [, v]) => a + v.length, 0)}）`)
  for (const [href, pages] of deadEntries.slice(0, 20)) row(`  - \`${href}\` ← ${pages.slice(0, 3).join(', ')}${pages.length > 3 ? ` 等 ${pages.length} 页` : ''}`)
} else if (siteDir) {
  row(`- ⚠️ 目录不存在：${siteDir}`)
}

// ---------- 汇总 ----------
const summary = [
  `# 全站 SEO 体检报告（${today}，全站 ${tools.length} 款节点）`,
  '',
  `> 生成方式：npm run seo-audit（可加 --site .output/public 扫描静态产物死链）。数值为当次运行快照，修复后重跑对比。`,
].join('\n') + '\n' + lines.join('\n') + '\n'
fs.writeFileSync(outPath, summary)
console.log(`✅ 报告已生成：${outPath}`)
console.log(`   重名 ${dupNames.length} | 重描述 ${dupDescs.length} | 蚕食词 ${kwConflicts.length} | 零引用 ${zero.length} | 专题覆盖 ${(covered.size / tools.length * 100).toFixed(1)}%${siteDir ? ' | 死链 ' + Object.keys(dead || {}).length : ''}`)
