#!/usr/bin/env node

/**
 * 生成工具页→教程文章的反向映射 src/data/tool-tutorials.json
 * 扫描 blog/content/posts 每篇文章的工具引用（util.cn/tools/ 链接 + {{< tool id >}} shortcode），
 * 结合 front matter 的 title/summary/slug/date 输出 { toolId: [{slug,title,date,summary}] }。
 * 每个工具最多保留最近 3 篇；供工具页 TutorialLinks 组件与覆盖率门禁使用。
 * 新文章发布后随 `npm run sitemap` 自动刷新。
 */

const fs = require('fs')
const path = require('path')

const POSTS = path.join(__dirname, '..', 'blog', 'content', 'posts')
const OUT = path.join(__dirname, '..', 'src', 'data', 'tool-tutorials.json')
const MAX_PER_TOOL = 3

function walk(dir) {
  let files = []
  for (const i of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, i.name)
    if (i.isDirectory()) files.push(...walk(p))
    else if (i.name.endsWith('.md') && i.name !== '_index.md') files.push(p)
  }
  return files
}

function parsePost(file) {
  const raw = fs.readFileSync(file, 'utf8')
  const head = raw.slice(0, 1200)
  const get = (key) => {
    const m = head.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?`, 'm'))
    return m ? m[1].trim() : ''
  }
  const slug = get('slug') || path.basename(file, '.md')
  if (/^draft:\s*true/m.test(head)) return null
  // 工具引用：绝对链接 + shortcode id 两种来源
  const ids = new Set()
  for (const m of raw.matchAll(/util\.cn\/tools\/([a-z0-9-]+)\//g)) ids.add(m[1])
  for (const m of raw.matchAll(/\{\{<\s*tool\s+id="([a-z0-9-]+)"/g)) ids.add(m[1])
  return { slug, title: get('title') || slug, date: get('date'), summary: get('summary'), ids: [...ids] }
}

const map = {}
let posts = 0
for (const f of walk(POSTS)) {
  const p = parsePost(f)
  if (!p) continue
  posts++
  for (const id of p.ids) {
    ;(map[id] = map[id] || []).push({ slug: p.slug, title: p.title, date: p.date, summary: p.summary })
  }
}

// 每工具按日期倒序取最近 3 篇；空数组键不落盘
const out = {}
for (const [id, list] of Object.entries(map)) {
  list.sort((a, b) => (a.date < b.date ? 1 : -1))
  out[id] = list.slice(0, MAX_PER_TOOL)
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 0), 'utf8')
console.log(`✅ tool-tutorials.json 生成：扫描 ${posts} 篇文章，映射 ${Object.keys(out).length} 个工具`)
