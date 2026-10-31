---
title: "网站上线前的 SEO 三件套：robots.txt、sitemap.xml 和 meta 标签"
slug: "seo-meta-toolkit"
date: 2026-10-31T08:05:00+08:00
draft: false
tags: ['SEO', 'robots.txt', 'sitemap', 'meta 标签', '站长工具']
categories: ['开发实践']
author: '有条工具团队'
summary: '网站做完就完了吗？搜索引擎还进不来。这篇把上线前最基础的三件事一次讲清：robots.txt 决定爬虫能抓什么，sitemap.xml 告诉搜索引擎你有哪些页面，meta 标签决定你在搜索结果里长什么样。三个都能在浏览器里本地生成，复制粘贴就能用。'
---

## 先弄清三件事各管什么

很多新站上线一个月还搜不到，排查下来往往卡在最基础的环节。搜索引擎找内容分三步：**先读 robots.txt 确认哪里能去，再顺着链接和 sitemap 发现页面，最后把结果展示成一条摘要**。这三步分别对应三件配置，缺一步都会让收录打折：

- **robots.txt**：站点根目录的"门卫须知"，告诉爬虫哪些路径不用抓（后台、登录页、搜索结果页）；
- **sitemap.xml**：一份页面清单，尤其是没有内链指向的"孤岛页"，靠它才被搜索引擎知道；
- **meta 标签**：title 和 description 决定搜索结果里那行蓝字和灰字写什么，OG 标签决定链接被分享到聊天工具时出不出卡片。

## robots.txt：两行也能写，但别写错

robots.txt 的语法极简：一组 User-agent 对应若干条 Allow/Disallow。但语法越简单，越容易犯想当然的错——最经典的两个：路径不以 `/` 开头整条规则失效；想允许子目录却被更长的 Disallow 拦住（规则冲突时**按最长匹配**，不是按顺序）。

{{< tool id="robots-txt-generator" >}}robots.txt 生成器{{< /tool >}}把这些细节固化成了表单：爬虫分组（Googlebot、Bingbot、百度各一组，Crawl-delay 旁边老老实实标注了 Google 不支持这个字段）、逐条规则带校验、Sitemap 地址挂在末尾。内置的 WordPress 模板把 /wp-admin/、/?s= 这类后台和搜索路径预先配好，预设之外点一下速查卡就能追加 /cart、/checkout 这类电商路径。生成后复制到站点根目录，浏览器直接访问 你的域名/robots.txt 能看到内容就是放对了。

## sitemap.xml：什么时候需要，怎么生成

内容少的静态站可以不做 sitemap——搜索引擎顺着内链就能爬完。但页面一多、或者存在"没有任何内链指向"的页面（活动页、旧的深度文章），sitemap 就值得做。{{< tool id="sitemap-generator" >}}sitemap.xml 生成器{{< /tool >}}接受每行一个 URL 的列表，自动补协议、去重、校验格式，lastmod 可以统一设也可以逐条跟在 URL 后面，生成完整 XML 下载后传到根目录。

两点实用提醒：一是 changefreq 和 priority 这两个字段 Google 已基本忽略，填上无害但别指望它们影响排名，工具的说明里也如实写了这一点；二是单文件上限 5 万 URL 或 50MB，更大的站要拆分 sitemap index，这在工具的超限提示里会直接告诉你。生成后提交到 [Google Search Console](https://search.google.com/search-console)、Bing 工具和百度站长平台，几小时内就能看到"已发现"的统计。

## meta 标签：决定你在搜索结果里的"门面"

同样一条搜索结果，title 写得好的点击率能差出几倍。{{< tool id="meta-tags-generator" >}}Meta 标签生成器{{< /tool >}}的核心不是拼字符串，是三个实时反馈：

- **长度判定**：title 超 30 个中文字（约 60 字符）会在结果里被截断，description 的合理区间在 78-165 字符之间，输入框旁的红黄绿状态实时变化；
- **SERP 预览**：右边的模拟卡片按 Google 风格渲染，蓝标题、绿网址、灰摘要，截断会真实发生——写的有多长，看到的就有多短；
- **OG 卡片**：og:title / og:image / og:description 一并生成，链接发到 Telegram、Slack、Twitter 时会带出预览卡（微信部分场景走自己的 JS-SDK，覆盖度有限，工具里也如实说明）。

生成的是缩进好的 HTML，粘到 `<head>` 里就能用。如果页面还有结构化数据需求，站内的{{< tool id="json-ld-generator" >}}JSON-LD 生成器{{< /tool >}}和{{< tool id="open-graph-validator" >}}OG 校验器{{< /tool >}}正好接在后面，一套配齐。

## 上线前的十分钟清单

1. 生成 robots.txt 传到根目录，浏览器访问确认；
2. 把全部页面 URL 灌进 sitemap 生成器，下载上传，去三大站长平台提交；
3. 每类页面（首页/列表/详情）各配一组 meta 标签，SERP 预览里确认不截断；
4. 两周后回站长平台看收录数字，有页面没进来就回头查 robots 是否误伤。

## 常见问题

### Disallow 自己的页面会不会导致不收录？

robots.txt 只是"不抓"，不等于"从索引删除"——如果别的站点链接了这个 URL，搜索引擎仍可能只显示地址不显示摘要。想真正从索引里去掉，要在页面里用 meta robots 的 noindex（生成器里有这个选项），两者配合才是完整方案。

### sitemap 提交了但收录很慢，正常吗？

正常。新站的首次收录周期常以周计，sitemap 只负责"告知"，不负责"加速"。持续更新内容、保持内链健康，比反复重新提交有用。

### meta 标签多久改一次？

title 别频繁动（搜索引擎要重新评估），description 和 OG 图可以按活动节奏更新。改完用站内的{{< tool id="html-slug-generator" >}}SEO 链接检查{{< /tool >}}确认 URL 侧没被牵连。

## 本章配套工具箱

边读边用：以下工具均在浏览器本地运行，数据不上传。

- {{< tool id="robots-txt-generator" >}}robots.txt 生成器{{< /tool >}}：爬虫分组与规则校验，WordPress 预设
- {{< tool id="sitemap-generator" >}}sitemap.xml 生成器{{< /tool >}}：URL 列表转规范 XML，去重与超限提示
- {{< tool id="meta-tags-generator" >}}Meta 标签生成器{{< /tool >}}：SERP 预览 + 长度判定 + OG/Twitter 卡片
- {{< tool id="json-ld-generator" >}}JSON-LD 生成器{{< /tool >}}：结构化数据补充
- {{< tool id="open-graph-validator" >}}OG 校验器{{< /tool >}}：分享卡片检查
