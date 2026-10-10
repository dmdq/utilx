#!/usr/bin/env node

/**
 * 生成 llms.txt —— GEO（生成式引擎优化）文件
 * 规范: https://llmstxt.org/ —— 唯一 H1 + blockquote 简介 + H2 分节的链接列表
 * 让 GPTBot / ClaudeBot / PerplexityBot 等大模型爬虫一次读懂站点结构：
 * 有什么工具、按什么分类、有什么内容页。
 *
 * 数据源与 generate-sitemap.js 完全一致（tools.js / categories.js /
 * wiki-terms.js / collections.js / Hugo 文章 front-matter），
 * 新增工具或文章后随 `npm run sitemap`（已串联）或单独 `npm run llms` 刷新。
 */

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const BASE = 'https://www.util.cn';
const OUT = path.join(__dirname, '../public/llms.txt');

const clean = (s) =>
  String(s || '')
    .replace(/\s+/g, ' ')
    .replace(/[[\]]/g, '')
    .trim();

const link = (name, url, desc) => `- [${clean(name)}](${url})${desc ? ': ' + clean(desc) : ''}`;

/** 解析 Hugo 文章 front matter（title/slug/summary/draft/date） */
function collectPosts() {
  const postsDir = path.join(__dirname, '..', 'blog/content/posts');
  const walk = (dir) => {
    let files = [];
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) files.push(...walk(full));
      else if (item.name.endsWith('.md') && item.name !== '_index.md') files.push(full);
    }
    return files;
  };
  const posts = [];
  for (const file of walk(postsDir)) {
    const head = fs.readFileSync(file, 'utf8').slice(0, 1200);
    if (/^draft:\s*true/m.test(head)) continue;
    const get = (key) => {
      const m = head.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?`, 'm'));
      return m ? m[1].trim() : '';
    };
    const slug = get('slug') || path.basename(file, '.md');
    posts.push({
      slug,
      title: get('title') || slug,
      summary: get('summary'),
      date: get('date'),
    });
  }
  // 按日期倒序，新的在前
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  return posts;
}

async function main() {
  console.log('开始生成 llms.txt ...');

  const load = (rel) => import(pathToFileURL(path.join(__dirname, '..', rel)).href);
  const [{ tools }, { categories }, { wikiTerms }, { collections }] = await Promise.all([
    load('src/data/tools.js'),
    load('src/data/categories.js'),
    load('src/data/wiki-terms.js'),
    load('src/data/collections.js'),
  ]);
  const posts = collectPosts();

  const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const catDesc = Object.fromEntries(categories.map((c) => [c.id, c.description || '']));
  // 按 categories.js 的顺序分组（空分类跳过）
  const byCat = new Map(categories.map((c) => [c.id, []]));
  for (const t of tools) {
    if (byCat.has(t.category)) byCat.get(t.category).push(t);
  }

  const lines = [];

  // ---- 规范要求的唯一 H1 + 简介 blockquote ----
  lines.push(`# 有条工具（Util.cn）`);
  lines.push('');
  lines.push(
    `> 免费在线工具箱：${tools.length} 款工具覆盖 JSON与数据格式、编解码、加密哈希、图片处理、文件转换、开发辅助、设计CSS、健康与金融计算等 ${categories.length} 个分类，另附 AI 百科词条、场景专题与技术博客。所有计算均在浏览器本地完成，不收集、不上传任何用户数据；无广告、无需注册。`
  );
  lines.push('');
  lines.push('本文件为站点结构化索引，全部页面均为静态 HTML，可直接抓取。按分类浏览或按需引用下述链接。');
  lines.push('');
  lines.push(
    `- [首页](${BASE}/): 工具导航与推荐\n` +
      `- [全部工具](${BASE}/all/): ${tools.length} 款工具完整目录\n` +
      `- [场景专题](${BASE}/collections/): ${collections.length} 个按使用场景组织的工具组合\n` +
      `- [AI 百科](${BASE}/wiki/): ${wikiTerms.length} 条大模型相关词条\n` +
      `- [技术博客](${BASE}/blog/): ${posts.length} 篇工具教程与实践文章`
  );
  lines.push('');

  // ---- 工具分类总览 ----
  lines.push(`## 工具分类`);
  lines.push('');
  for (const c of categories) {
    const list = byCat.get(c.id) || [];
    if (!list.length) continue;
    lines.push(link(`${c.name}（${list.length}款）`, `${BASE}/category/${c.id}/`, catDesc[c.id]));
  }
  lines.push('');

  // ---- 每个分类的工具明细 ----
  for (const c of categories) {
    const list = byCat.get(c.id) || [];
    if (!list.length) continue;
    lines.push(`## ${c.name}`);
    lines.push('');
    for (const t of list) {
      lines.push(link(t.name, `${BASE}/tools/${t.id}/`, t.description));
    }
    lines.push('');
  }

  // ---- 场景专题 ----
  lines.push(`## 场景专题`);
  lines.push('');
  for (const c of collections) {
    lines.push(link(c.title, `${BASE}/collections/${c.slug}/`, c.description || c.scene));
  }
  lines.push('');

  // ---- AI 百科词条 ----
  lines.push(`## AI 百科词条`);
  lines.push('');
  for (const w of wikiTerms) {
    lines.push(link(w.term, `${BASE}/wiki/${w.slug}/`, w.summary));
  }
  lines.push('');

  // ---- 博客文章 ----
  lines.push(`## 博客文章`);
  lines.push('');
  for (const p of posts) {
    lines.push(link(p.title, `${BASE}/blog/articles/${p.slug}/`, p.summary));
  }
  lines.push('');

  // ---- Optional：次要页面 ----
  lines.push(`## Optional`);
  lines.push('');
  lines.push(link('关于本站', `${BASE}/about/`, '站点介绍与免责声明'));
  lines.push(link('常见问题', `${BASE}/faq/`, '使用问题解答'));
  lines.push(link('隐私政策', `${BASE}/privacy/`, '数据不出本机的说明'));
  lines.push(link('下载桌面版', `${BASE}/download/`, 'macOS 桌面客户端'));
  lines.push('');

  fs.writeFileSync(OUT, lines.join('\n'), 'utf8');

  console.log(`✅ llms.txt 生成成功！`);
  console.log(`📍 路径: ${OUT}`);
  console.log(`📄 工具 ${tools.length} / 分类 ${categories.length} / 专题 ${collections.length} / 词条 ${wikiTerms.length} / 文章 ${posts.length}`);
  console.log(`📦 文件大小: ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ 生成失败:', err);
    process.exit(1);
  });
}

module.exports = { main };
