---
title: "EPUB 解剖：一个 ZIP 如何装下一本书，mimetype 为何必须第一个且不压缩"
slug: "epub-container-anatomy"
date: 2026-11-10T09:00:00+08:00
draft: false
tags: ['EPUB', '电子书', 'ZIP', '文件格式']
categories: ['技术笔记']
author: '有条工具团队'
summary: 'EPUB 3 的本质是一个改了打包规矩的 ZIP：mimetype 条目必须排第一、必须 STORE 不压缩，META-INF/container.xml 指路，OPF 清单串起章节与双目录（EPUB 3 的 nav 加兼容旧阅读器的 toc.ncx）。这篇按规范逐层拆开 .epub，并讲 TXT/Markdown 按章节切分的正则细节与为什么全程可以在浏览器里完成。'
---

## 把书做成压缩包

把 .epub 改后缀为 .zip，任何解压软件都能打开——EPUB 的容器就是 ZIP，学名叫 OCF（Open Container Format）。但它是带家规的 ZIP：规矩定得极细，细到第一条文件怎么放。这些家规不是为了美观，而是为了让阅读器在最恶劣的情况下也能认出「这是一本 EPUB」。

OCF 的第一条硬性要求：ZIP 里必须有一个叫 `mimetype` 的文件，内容固定为 `application/epub+zip`，**必须是第一个条目，必须以 STORE 方式（不压缩）写入，且不带额外字段**。三个「必须」合起来达到一个效果——文件开头 38 字节左右就是这串明文 MIME 类型（ZIP 头本身 30 字节 + 文件名 8 字节）。阅读器只需读几十个字节就能判断格式，不必解析整个中央目录；反过来，若把 mimetype 压缩或排到后面，部分阅读器直接拒开。{{< tool id="epub-maker" >}}EPUB电子书制作{{< /tool >}}组包时把这条例外写死在代码里：`zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })`，其余文件才逐个 DEFLATE 压缩入场（ZIP 内部的压缩正是[上篇拆过的 DEFLATE](/blog/articles/deflate-gzip-anatomy/)，压缩家族在这里会师）。

## 从 container.xml 到 spine：一本书的地图

mimetype 之外，OCF 只再约定一件事：`META-INF/container.xml` 必须存在，其中 `rootfile` 元素指向真正的包描述文件（OPF）。为什么隔这一层而不直接规定 OPF 的位置？因为容器与内容解耦——一本书的 XHTML、图片放哪个子目录由制作工具自便，container.xml 是唯一的指路牌。

OPF（content.opf）是全书的中枢，三大件：

```xml
<package version="3.0" unique-identifier="book-id">
  <metadata>  dc:title / dc:creator / dc:language / dc:identifier(UUID) / dcterms:modified  </metadata>
  <manifest>  每个文件一个 item：id + href + media-type  </manifest>
  <spine toc="ncx">  阅读顺序：<itemref idref="..." /> 的有序列表  </spine>
</package>
```

metadata 里两处讲究：`dc:identifier` 要被头部 `unique-identifier` 引用，作为这本书的全球唯一身份（工具用浏览器端生成的 UUID v4 填充）；`dcterms:modified` 是 EPUB 3 的必填项——最后一次修改时间戳，阅读器靠它判断缓存的新旧。manifest 是「有什么」，spine 是「按什么顺序读」：一本排版精美的书若忘把某章写进 spine，那一章就成了幽灵文件——在包里，却永远不会被翻到。

## 双目录：EPUB 3 的考古学

目录是 EPUB 里最有「地质层」感的部分。EPUB 2 时代的目录叫 toc.ncx——从 DAISY 有声书标准借来的 XML 结构（media-type 至今还是 `application/x-dtbncx+xml`，dtb 即 Digital Talking Book），navMap 里一层层 navPoint 挂出章节树。EPUB 3 换成了 XHTML 的 nav.xhtml：目录就是普通网页，`properties="nav"` 标记它的身份，`epub:type="toc"` 声明语义，阅读器、浏览器、人，三方面都能读。

按理说新王登基旧制可废，但市面上十几年的 EPUB 2 阅读器还活着——Kindle 早期固件、老款电纸书、若干手机阅读 App 只认 ncx。于是规范的兼容策略是两份都带：nav.xhtml 给新阅读器，toc.ncx 给旧设备，spine 上 `toc="ncx"` 一行把两者挂上钩；nav 自身进 spine 时标 `linear="no"`——目录不算正文的「一页」，线性阅读时跳过。工具默认同时生成两份目录，微信读书、Apple Books、Calibre、静读天下新旧通吃，就是这个双轨设计的直接受益。

## TXT 到 EPUB：切章是门手艺

容器之外，另一半工程在内容预处理。中文网文和公版书的 TXT 几乎都以「第一章」「第十二章」「第一百零三回」分行开章，切分正则要把数字的半角全角、汉字数字、单位异体都兜住：

```js
/^\s*第\s*[0-9０-９一二三四五六七八九十百千零〇两]+\s*[章节回卷部篇]/
```

全角０-９、零〇两的异体、章节目回卷部篇的通假，每多兜一种，老书源就少一批「全书一章」。Markdown 输入则认行首的一二级标题（`#`/`##`），更深的标题留在正文里当小节。边界策略同样要紧：第一个章节标记之前还有正文，归入自动生成的「前言」章；识别不到任何标记时全书降级为单章并提示改用自定义正则，而不是静默产出结构错误的书；相邻两个标记之间没有正文的空章，并入上一章，避免目录里出现点不开的死标题。切好的每章转成一个 XHTML 文件——标题转义、Markdown 行内语法转 HTML——再配上极简样式表，整包交给浏览器里的 JSZip 压缩成 .epub，全程不经过服务器。

## ZIP 家族的识别问题

EPUB、docx、pptx、apk 都是「ZIP 换个皮」：中央目录一翻就知道。{{< tool id="file-type-detector" >}}文件类型识别{{< /tool >}}的流程正是如此——先命中 ZIP 签名 PK\x03\x04，再扫中央目录细分出具体子格式。所以一个改名为 .zip 的 .epub 能被认出来，一个改名为 .epub 的空压缩包也会现形。

从 TXT 到能进书架的 .epub，这条制作线连同写作、排版工具，都收在[写作者工具箱](/collections/writer-toolkit/)专题里；文件识别、格式互转的兄弟工具，则在[文件处理流水线](/collections/file-ops-pipeline/)里排队待命。
