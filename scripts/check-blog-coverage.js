#!/usr/bin/env node

/**
 * 博客→工具覆盖率门禁
 * 用法：
 *   node scripts/check-blog-coverage.js            # 警告模式（exit 0，用于构建链）
 *   node scripts/check-blog-coverage.js --strict   # 红线模式（低于阈值 exit 1，用于发布 SOP）
 * 检查项：
 *   1. 全站工具博客覆盖率（红线 --strict 时 < 50% 失败）
 *   2. 单分类零引用工具数（> 30 警告 / strict 下 > 40 失败）
 *   3. 最近 14 天新落地工具无任何文章引用 → 点名（SOP 断档信号）
 */

const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')

const strict = process.argv.includes('--strict')
const ROOT = path.join(__dirname, '..')

async function main() {
  const { tools } = await import(pathToFileURL(path.join(ROOT, 'src/data/tools.js')).href)
  const tutorialsFile = path.join(ROOT, 'src/data/tool-tutorials.json')
  if (!fs.existsSync(tutorialsFile)) {
    console.log('⚠️ tool-tutorials.json 不存在，先运行 npm run sitemap')
    process.exit(strict ? 1 : 0)
  }
  const map = JSON.parse(fs.readFileSync(tutorialsFile, 'utf8'))

  const covered = tools.filter((t) => map[t.id])
  const pct = Math.round((covered.length / tools.length) * 100)
  let fail = false

  console.log(`📊 博客→工具覆盖率: ${covered.length}/${tools.length} = ${pct}%`)
  if (strict && pct < 50) { console.log('❌ 覆盖率低于 50% 红线'); fail = true }
  else if (pct < 50) { console.log('⚠️ 覆盖率低于 50%（应安排聚合文/旧文改造）') }

  // 分类级
  const byCat = {}
  for (const t of tools) {
    byCat[t.category] = byCat[t.category] || { total: 0, zero: [] }
    byCat[t.category].total++
    if (!map[t.id]) byCat[t.category].zero.push(t.id)
  }
  for (const [c, s] of Object.entries(byCat)) {
    if (s.zero.length > 40 && strict) { console.log(`❌ ${c}: ${s.zero.length}/${s.total} 零引用（>40）`); fail = true }
    else if (s.zero.length > 30) console.log(`⚠️ ${c}: ${s.zero.length}/${s.total} 零引用（>30，建议安排分类聚合文）`)
  }

  // 新落地断档检测
  const cutoff = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)
  const fresh = tools.filter((t) => (t.lastUpdated || '') >= cutoff && !map[t.id])
  if (fresh.length) {
    console.log(`🔴 近 14 天新工具无任何教程推文（批次 SOP 断档 ${fresh.length} 款）:`)
    console.log('   ' + fresh.map((t) => t.id).join(', '))
    if (strict) fail = true
  }

  if (fail) { console.log('门禁未通过 (--strict)'); process.exit(1) }
  console.log(fresh.length || pct < 50 ? '✅ 检查完成（存在警告，见上）' : '✅ 全部通过')
}

main().catch((e) => { console.error(e); process.exit(1) })
