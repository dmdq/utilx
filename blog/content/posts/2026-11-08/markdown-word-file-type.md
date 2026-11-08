---
title: "Markdown 交 Word、docx 抽文字、看穿改后缀的伪装：三件文件工具"
slug: "markdown-word-file-type"
date: 2026-11-08T09:20:00+08:00
draft: false
tags: ['Markdown转Word', 'docx转文本', '文件类型识别', '文档转换', '文件安全']
categories: ['效率工具']
author: '有条工具团队'
summary: '稿子用 Markdown 写的，客户要 Word 版；收到 .docx 只想抽里面的文字；下载的文件后缀可疑想验明正身——三件新工具各管一段：Markdown 转 Word、Word 转文本、文件类型魔数识别，照例全程本地处理。'
---

## Markdown 和 Word 之间，缺的那座桥

写作工具链分裂成两个世界：自己写用 Markdown（Typora、Obsidian、语雀），交付出去却是 Word（客户、导师、甲方）。两个世界之间转换的工具不少，但多数要求上传稿件到服务器——对没发表的稿子来说，这一步和把日记本借给陌生人没区别。{{< tool id="markdown-to-word" >}}Markdown转Word{{< /tool >}}在浏览器里走完整个流程：marked 解析 Markdown，套上 Word 认的 HTML 头和样式表，直接生成 .doc 文件下载。标题字号递减、表格全边框、代码块等宽灰底、引用块斜体缩进，这些映射都是按 Word 的渲染习惯调过的，打开不需要二次排版。

说明一处诚实的边界：导出的是 .doc 格式（Word 和 WPS 都能直接打开编辑），如果对方严格要求 .docx 后缀，在 Word 里"另存为"一下就好——纯客户端生成 .docx 要嵌入完整的 OOXML 包，那是一整套独立工程，工具页 FAQ 里把原因讲清楚了。字体和字号可以选（宋体/微软雅黑，10.5/12/14pt），图片如果是 base64 内嵌的会直接进文档。

## 反方向：从 docx 里抽文字

反向需求同样常见：收到一份几十页的 .docx，只想要里面的文字内容做二次加工。{{< tool id="docx-to-text" >}}Word转文本{{< /tool >}}把 docx 当 zip 解开（docx 本质就是 OOXML 格式的压缩包），读取 document.xml 逐段还原：标题映射成 # 号，表格还原成 Markdown 表格，换行和制表符都保留。输出支持纯文本和 Markdown 两种模式，可以用来把 Word 报告转进 Notion/Obsidian 这类 Markdown 笔记库。解析全在本地，合同、简历这类敏感文档不过第三方的手。

老 .doc 格式（Office 2003 那种）不是 zip 结构，工具会明确提示先另存为 .docx——这个边界值得说在前面，免得白传一次文件。

## 后缀名是最容易造假的元数据

下载来的文件、群里传的压缩包、邮件附件，后缀说是 .jpg 就真是图片吗？后缀只是文件名的一部分，改它不需要任何权限；文件身份的"身份证"是开头几个字节的魔数（magic number）——PNG 必是 `89 50 4E 47` 开头，PDF 必是 `%PDF-` 开头，这些字节是格式规范写死的。{{< tool id="file-type-detector" >}}文件类型识别{{< /tool >}}读文件头逐条比对 47 种签名：PNG/JPEG/GIF/WebP/HEIC、MP4/MOV、MP3/WAV/FLAC、ZIP/7Z/RAR、EXE/ELF/Mach-O，连 docx/xlsx/pptx 这种 zip 容器都按内部目录细分。文件后缀和真实类型对不上会直接红牌警告——Windows 报毒后改后缀的"图片"、伪装成文档的可执行文件，在这一步都会现形。

## 这一轮把文件链补齐了

加上早前的 {{< tool id="file-encoding-converter" >}}文件编码转换{{< /tool >}}和乱码修复，文件处理的"识别—转换—提取"闭环基本成形：格式不明的先用魔数识别验明正身，编码乱的了解码修复，文档类互相转换。写作场景的两件（Markdown 转 Word、Word 抽文本）收进了[职场文书工具箱](/collections/workplace-writing-kit/)，加上 SVG 转图片、GIF 抽帧这些图像件，[文件处理流水线](/collections/file-ops-pipeline/)专题现在有二十多件工具，日常遇到"这个文件打不开/转不动/不对劲"，先来这里翻一翻。
