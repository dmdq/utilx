---
title: "把 Markdown 变成 Word：一条跨越 40 年的兼容链"
slug: "markdown-to-word-compat-chain"
date: 2026-11-09T06:25:00+08:00
draft: false
tags: ['Markdown', 'Word', 'OOXML', '文档转换']
categories: ['技术笔记']
author: '有条工具团队'
summary: 'Markdown 2004 年才出生，Word 的二进制 .doc 1983 年就有了。本文拆解两代格式之间的兼容链：OLE2、OOXML 与 Word 自家的 HTML 方言——mso 命名空间、条件注释与 @page 页面参数，缺一个命名空间 Word 就按普通网页降级打开。'
---

Markdown 2004 年才由 Gruber 与 Swartz 定下第一版规范，Word 的二进制 .doc 格式 1983 年就随 Word 1.0 面世——两端之间隔着二十一年、三代文件格式。可今天在网页里把 Markdown 一键变成 .doc、点开就能用 Word 和 WPS 编辑，依然是件轻松的事。这条通路能成立，靠的不是什么新协议，而是 Word 自己留着的一条上世纪九十年代的老路。本文把这条链拆开看。

## 三代格式

第一代是 .doc：二进制私有格式，装在 OLE2 复合文档容器里——容器内部像一个微型文件系统，文档切成扇区存放，还带自己的目录结构。闭源、复杂，第三方解析它基本靠猜。这也解释了为什么网页工具几乎不会去碰 .doc：光是读懂这个容器，就是一门独立的功课。

第二代是 .docx：OOXML，2007 年随 Office 2007 登场。它本质是 ZIP 加 XML——把扩展名改成 zip 解开，能看到一个完整的「包」：[Content_Types].xml 声明包里各部件的类型，word/document.xml 存正文，styles.xml 存样式，还有一组关系文件把这些部件连起来。

第三代不是新格式，而是一条通道：Word 从 97 起就能「打开网页」，把 HTML 当文档读进来、当成可以编辑的内容。对纯前端网页工具来说，第三条才是捷径——生成一个内容为 Word 方言 HTML 的文件，扩展名写成 .doc，Word 打开时认出里面的 Office 命名空间，就按文档来处理。

## Word 的 HTML 兼容层

重点来了：Word 认的不是标准 HTML，而是带它自家命名空间的一套方言。骨架是三样东西——html 标签上的 `xmlns:w="urn:schemas-microsoft-com:office:word"` 命名空间声明；`<!--[if gte mso 9]>` 条件注释里的 w:WordDocument 文档设置（视图、缩放等）；`@page WordSection1` 页面参数（纸型与页边距）。除此之外还有一批 mso- 前缀的样式属性，负责 Word 特有的排版行为。

一个 Word 兼容 .doc 的开头大致长这样：

```html
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>@page WordSection1 { size: 595.3pt 841.9pt; margin: 72pt 90pt; }</style>
```

条件注释只有 Word 一家的处理逻辑会执行，别的程序当普通注释跳过——当年是浏览器大战的产物，如今成了给 Word 递纸条的暗道。元素层面的映射也全是按 Word 的渲染习惯调出来的：标题按级别字号递减；表格要 border-collapse 折叠边框再加实线，并配上 mso- 前缀的表格间距属性把 Word 默认的单元格外边距压掉，不然 Word 里线是双的；行内代码与代码块用 Consolas 等宽字体、浅灰纯色底——Word 对 mso 背景要求纯色，渐变和透明都会出问题；正文再挂上 mso 的孤寡行控制，让分页行为贴近文档而不是网页。这套拼图缺一块，后果不是报错，而是降级：缺了命名空间，Word 就按「普通网页」打开——能看，但没有页面设置，编辑行为也不对。

## 为什么不做 .docx

既然 .docx 是正牌格式，为什么纯前端工具不直接生成它？算一笔工程账就明白：在浏览器里生成 .docx，等于要在浏览器里组装一个完整的 OOXML 包——ZIP 容器、[Content_Types].xml、document.xml、styles.xml、关系文件一样不能少，还得跟着 Word 的版本演进持续维护。这是一个独立的工程，与「转换文本」这件事的主目标完全不成比例。而 .doc（HTML 载体）Word 与 WPS 都能直接打开编辑，生成的成本接近于零，性价比完胜。真需要 .docx，在 Word 里「另存为」一下就好——从 .doc 到 .docx 这一步，Word 自己最擅长。

工程决策里最有意思的就是这种「借道」：看起来绕远，实际上是把最难的一段路（OOXML 打包）交给最擅长它的软件去做，自己只做最轻的一段（HTML 生成）。判断哪段该自己做、哪段该借力，比埋头把整条路都铺一遍重要得多。

## 反方向反而简单

有趣的是，反方向的解析比正向的生成容易得多。docx 是 ZIP 加 XML，解开读 word/document.xml 就能拿到全文——段落是 w:p，文本片段在 w:t 里，表格是 w:tbl，换行是 w:br。结构规整、标签名写死（OOXML 标准把命名空间前缀固定为 w:），甚至不必上完整的 XML 解析器，一个字符串解析器按字面量匹配标签就能重组全文——这类标签的属性值只含十六进制 ID 或数字，不含大于号，字符串定位就是安全的；表格嵌套进单元格也只需要一个深度计数就能匹配。

{{< tool id="docx-to-text" >}}Word转文本{{< /tool >}}就是这么工作的：在浏览器本地解压 docx，用字符串解析器按段落（w:p）、文本片段（w:t）、换行（w:br）、制表符（w:tab）重组正文，把标题样式映射为 Markdown 的 # 级别、表格（w:tbl）转换为 Markdown 表格，XML 实体自动解码。{{< tool id="pptx-to-text" >}}PPT转文本{{< /tool >}}走同一条路：pptx 解开后按页解析 ppt/slides/slideN.xml，以形状（p:sp）为分界提取 a:t 节点里的文字，标题占位符自动识别，连演讲者备注（notesSlides）都能带出来——幻灯片按真实页码排序，不按文件名字典序，导出可选纯文本或 Markdown。两件工具都只解「自己那层 XML」，解不开的复杂结构就如实放过，不硬凑内容——取文本这件事，忠实比聪明重要。

## 正向：一条链走到底

正向的转换把前面的兼容层串起来：{{< tool id="markdown-to-word" >}}Markdown转Word{{< /tool >}}先用 marked 按 GitHub Flavored Markdown 规则把文本解析为 HTML——表格、删除线、任务列表都覆盖，输入带防抖预览，改一行立刻能看到转换效果；再注入 Word 可识别的文档设置与元素样式，页面尺寸、页边距、标题字号、表格边框、等宽代码块逐一映射；最后组装成 Word 兼容的 .doc 供下载，粘贴 Markdown 或拖入 .md 文件均可，全程在浏览器本地完成，不上传服务器。

从 1983 年的二进制容器，到 1997 年的网页通道，再到今天的浏览器本地转换——Markdown 落进 Word 的这条路，每一环都是历史叠出来的兼容层：旧格式为了存活不断收留新邻居，新格式为了普及不得不搭旧桥。理解了这条链，再看到「网页也能导出 Word」就不会觉得神奇——那只是三十年的层叠还在稳稳地承重。同链路的其他文档转换工具，连同上面几件，都收在[职场文书工具箱](/collections/workplace-writing-kit/)专题里，按场景排布，随取随用。
