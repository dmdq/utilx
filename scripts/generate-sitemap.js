#!/usr/bin/env node

/**
 * 动态生成 sitemap.xml 文件
 * 扫描 src/pages 目录并生成完整的站点地图
 */

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

// 配置
const config = {
  baseUrl: 'https://www.util.cn',
  outputPath: path.join(__dirname, '../public/sitemap.xml'),
  pagesDir: path.join(__dirname, '../src/pages'),
  currentDate: new Date().toISOString().split('T')[0], // 格式: YYYY-MM-DD
  defaultPriority: {
    // 默认优先级配置
    '/': 1.0,
    '/about': 0.8,
    '/faq': 0.8,
    '/feedback': 0.6,
    '/download': 0.6,
    '/privacy': 0.5,
    '/terms': 0.5,
    '/cookie': 0.5,
    '/settings/notifications': 0.6,
    // 分类页面
    '/ai': 0.9,
    '/all': 0.9,
    '/category/ai': 0.8,
    '/category/all': 0.8,
    '/category/calculate': 0.8,
    '/category/crypto': 0.8,
    '/category/design': 0.8,
    '/category/dev': 0.8,
    '/category/encode': 0.8,
    '/category/finance': 0.8,
    '/category/format': 0.8,
    '/category/health': 0.8,
    '/category/image': 0.8,
    '/category/network': 0.8,
    '/category/others': 0.8,
    '/category/random': 0.8,
    '/category/security': 0.8,
    '/category/text': 0.8,
    '/category/time': 0.8,
    '/category/file': 0.8,
    '/file': 0.8,
    '/wiki': 0.8,
    '/collections': 0.8,
    '/tag': 0.6,
    '/blog': 0.6,
    // 工具页面默认优先级
    '/tools': 0.7,
  },
  defaultChangeFreq: {
    // 默认更新频率
    '/': 'daily',
    '/all': 'daily',
    '/recent': 'daily',
    '/explore': 'weekly',
    '/favorites': 'weekly',
    '/ai': 'weekly',
    '/crypto': 'weekly',
    '/dev': 'weekly',
    '/encode': 'weekly',
    '/format': 'weekly',
    '/image': 'weekly',
    '/network': 'weekly',
    '/text': 'weekly',
    '/time': 'weekly',
    '/category/ai': 'weekly',
    '/category/all': 'weekly',
    '/category/calculate': 'weekly',
    '/category/crypto': 'weekly',
    '/category/design': 'weekly',
    '/category/dev': 'weekly',
    '/category/encode': 'weekly',
    '/category/finance': 'weekly',
    '/category/format': 'weekly',
    '/category/health': 'weekly',
    '/category/image': 'weekly',
    '/category/network': 'weekly',
    '/category/others': 'weekly',
    '/category/random': 'weekly',
    '/category/security': 'weekly',
    '/category/text': 'weekly',
    '/category/time': 'weekly',
    '/category/file': 'weekly',
    '/file': 'weekly',
    '/wiki': 'weekly',
    '/collections': 'weekly',
    '/tag': 'weekly',
    '/blog': 'monthly',
    // 工具页面
    '/tools': 'monthly',
  }
};

/**
 * 递归扫描页面目录
 */
function scanPages(dir, basePath = '') {
  const pages = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        // 递归扫描子目录
        const subPages = scanPages(itemPath, path.join(basePath, item));
        pages.push(...subPages);
      } else if (item.endsWith('.vue')) {
        // 处理 Vue 文件
        let pagePath = basePath;

        // 处理文件名
        const fileName = item.replace('.vue', '');

        if (fileName === 'index') {
          // index.vue 文件，路径就是当前目录
          if (!pagePath) {
            pagePath = '/'; // 根目录的 index.vue
          }
        } else if (fileName.startsWith('[') && fileName.endsWith(']')) {
          // 动态路由，跳过
          continue;
        } else {
          // 普通页面
          pagePath = path.join(pagePath, fileName);
        }

        // 转换为 URL 路径
        const urlPath = pagePath.replace(/\\/g, '/');
        if (urlPath && urlPath !== '/404' && urlPath !== '/500') {
          pages.push(urlPath);
        }
      }
    }
  } catch (error) {
    console.error(`扫描目录失败 ${dir}:`, error.message);
  }

  return pages;
}

/**
 * 获取页面的优先级
 */
function getPriority(path) {
  // 直接匹配
  if (config.defaultPriority[path] !== undefined) {
    return config.defaultPriority[path];
  }

  // 前缀匹配
  for (const [prefix, priority] of Object.entries(config.defaultPriority)) {
    if (path.startsWith(prefix)) {
      return priority * 0.9; // 子页面优先级略低于父页面
    }
  }

  // 默认优先级
  if (path.startsWith('/tools/')) {
    return 0.6; // 工具页面
  } else if (path.startsWith('/category/')) {
    return 0.7; // 分类页面
  } else {
    return 0.5; // 其他页面
  }
}

/**
 * 获取页面的更新频率
 */
function getChangeFreq(path) {
  // 直接匹配
  if (config.defaultChangeFreq[path] !== undefined) {
    return config.defaultChangeFreq[path];
  }

  // 前缀匹配
  for (const [prefix, freq] of Object.entries(config.defaultChangeFreq)) {
    if (path.startsWith(prefix)) {
      return freq;
    }
  }

  // 默认更新频率
  if (path.startsWith('/tools/')) {
    return 'monthly'; // 工具页面更新较少
  } else if (path.startsWith('/blog/')) {
    return 'monthly'; // 博客文章
  } else {
    return 'weekly'; // 其他页面
  }
}

/**
 * 枚举动态路由与站外构建内容（标签详情页 / 词条 / 场景专题 / Hugo 博客文章）
 * 对应数据文件缺失时跳过对应分组，不阻断生成
 */
async function collectDynamicPaths() {
  const extra = [];
  const dataUrl = (p) => pathToFileURL(path.join(__dirname, '..', p)).href;

  // 标签详情页 /tag/<id>/
  try {
    const { tagDefinitions } = await import(dataUrl('src/data/tags.js'));
    for (const t of tagDefinitions || []) {
      if (t && t.id) extra.push(`tag/${encodeURIComponent(t.id)}`);
    }
  } catch (e) {
    console.warn(`⚠️ 跳过标签页: ${e.message}`);
  }

  // 词条库 /wiki/<slug>/
  try {
    const { wikiTerms } = await import(dataUrl('src/data/wiki-terms.js'));
    for (const w of wikiTerms || []) {
      if (w && w.slug) extra.push(`wiki/${w.slug}`);
    }
  } catch (e) {
    console.warn(`⚠️ 跳过词条库: ${e.message}`);
  }

  // 场景专题 /collections/<slug>/
  try {
    const { collections } = await import(dataUrl('src/data/collections.js'));
    for (const c of collections || []) {
      if (c && c.slug) extra.push(`collections/${c.slug}`);
    }
  } catch (e) {
    console.warn(`⚠️ 跳过场景专题: ${e.message}`);
  }

  // Hugo 博客文章 /blog/articles/<slug>/
  try {
    const postsDir = path.join(__dirname, '..', 'blog/content/posts');
    const walkPosts = (dir) => {
      let slugs = [];
      for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) slugs.push(...walkPosts(full));
        else if (item.name.endsWith('.md') && item.name !== '_index.md') slugs.push(full);
      }
      return slugs;
    };
    for (const file of walkPosts(postsDir)) {
      const head = fs.readFileSync(file, 'utf8').slice(0, 800);
      if (/^draft:\s*true/m.test(head)) continue;
      const slugMatch = head.match(/^slug:\s*["']?([^"'\n]+)["']?/m);
      const slug = slugMatch ? slugMatch[1].trim() : path.basename(file, '.md');
      if (slug) extra.push(`blog/articles/${slug}`);
    }
  } catch (e) {
    console.warn(`⚠️ 跳过博客文章: ${e.message}`);
  }

  return extra;
}

/**
 * 生成 URL 节点
 */
function generateUrlNode(path) {
  const loc = config.baseUrl + (path === '/' ? '' : '/' + path);
  const priority = getPriority(path);
  const changefreq = getChangeFreq(path);

  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${config.currentDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
}

/**
 * 生成完整的 sitemap.xml
 */
async function generateSitemap() {
  console.log('开始生成 sitemap.xml...');

  // 扫描静态页面 + 枚举动态路由
  const pages = scanPages(config.pagesDir);
  const dynamicPaths = await collectDynamicPaths();
  const allPaths = [...new Set([...pages, ...dynamicPaths])];

  // 按路径排序
  allPaths.sort();

  // 生成 XML 内容
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

`;

  // 添加所有 URL 节点
  for (const page of allPaths) {
    xml += generateUrlNode(page) + '\n\n';
  }

  xml += `</urlset>`;

  // 写入文件
  fs.writeFileSync(config.outputPath, xml, 'utf8');

  console.log(`✅ sitemap.xml 生成成功！`);
  console.log(`📍 路径: ${config.outputPath}`);
  console.log(`📄 总页面数: ${allPaths.length}（静态 ${pages.length} + 动态 ${dynamicPaths.length}）`);
  console.log(`🗓️ 更新日期: ${config.currentDate}`);

  // 输出页面分类统计
  const stats = {
    root: 0,
    category: 0,
    tools: 0,
    tag: 0,
    wiki: 0,
    collections: 0,
    blog: 0,
    other: 0
  };

  allPaths.forEach(page => {
    const p = page.startsWith('/') ? page : '/' + page;
    if (p === '/') {
      stats.root++;
    } else if (p.startsWith('/category/')) {
      stats.category++;
    } else if (p.startsWith('/tools/')) {
      stats.tools++;
    } else if (p.startsWith('/tag/')) {
      stats.tag++;
    } else if (p.startsWith('/wiki/')) {
      stats.wiki++;
    } else if (p.startsWith('/collections/')) {
      stats.collections++;
    } else if (p.startsWith('/blog/')) {
      stats.blog++;
    } else {
      stats.other++;
    }
  });

  console.log('\n📊 页面分类统计:');
  console.log(`   - 首页: ${stats.root}`);
  console.log(`   - 分类页面: ${stats.category}`);
  console.log(`   - 工具页面: ${stats.tools}`);
  console.log(`   - 标签详情页: ${stats.tag}`);
  console.log(`   - 词条页面: ${stats.wiki}`);
  console.log(`   - 场景专题: ${stats.collections}`);
  console.log(`   - 博客文章: ${stats.blog}`);
  console.log(`   - 其他页面: ${stats.other}`);
}

// 执行生成
if (require.main === module) {
  generateSitemap().catch(err => {
    console.error('❌ 生成失败:', err);
    process.exit(1);
  });
}

module.exports = { generateSitemap };