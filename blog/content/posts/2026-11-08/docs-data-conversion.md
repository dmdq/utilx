---
title: "导出 EPUB、通讯录转 vCard、PPT 抽文字：文档转换的三个长尾场景"
slug: "docs-data-conversion"
date: 2026-11-08T12:20:00+08:00
draft: false
tags: ['EPUB制作', 'vCard转换', 'PPT转文本', '文档转换']
categories: ['效率工具']
author: '有条工具团队'
summary: '网文要进电子书阅读器、几百个联系人要进新手机、拿到 PPT 只想要里面的字——三个冷门但真实的转换需求，对应三件新工具：EPUB 电子书制作、vCard 联系人转换、PPT 转文本。'
---

## EPUB：TXT 小说进阅读器的正经姿势

手机阅读器（微信读书例外）对 TXT 的排版支持参差不齐，章节识别全靠猜；EPUB 是电子书的通用格式，章节结构是文件里明确写好的。{{< tool id="epub-maker" >}}EPUB电子书制作{{< /tool >}}上传 TXT 或 Markdown，自动按"第X章/第X节/卷/部"切分章节（切分规则可以自定义正则），填上书名作者，生成的 EPUB 按规范组包——mimetype、目录、章节、样式一应俱全，导入 Apple Books、Kobo、静读天下都能正确显示章节目录。本地组包，网文作者的存稿不出本机。

## vCard：几百个联系人，不该一条条敲

换手机、导客户名单、把 Excel 里的联系人表灌进微信通讯录，手工输入是最慢的路。{{< tool id="vcard-converter" >}}vCard联系人转换{{< /tool >}}把 CSV/Excel 表转成 .vcf（列和字段的对应关系自己选，姓名/电话/邮箱/组织/备注），手机通讯录直接导入；反方向也行——从手机导出的 vcf 转回 CSV 做表格管理。格式细节都处理了：多电话号码拆行、逗号分号转义、折行合并，生成的文件各平台认。顺带提醒：Excel 导出的 CSV 常是 GBK 编码，转换发现乱码时先用[文件编码转换](/tools/file-encoding-converter/)转 UTF-8 再来。

## PPT 转文本：要的是讲稿，不是幻灯片

拿到一份几十页的 PPT，老板说"你把内容整理成文档"。一页页复制粘贴是笨办法。{{< tool id="pptx-to-text" >}}PPT转文本{{< /tool >}}把 pptx 解包后按页提取所有文字：标题占位符和正文分开、表格文字也能抽出来、演讲者备注可选带上，输出纯文本或 Markdown 大纲——直接就是一份现成的讲稿。页码排序是按数字排的（slide10 不会排在 slide2 前面，这类小细节见多了才知道值得写）。

加上之前的 {{< tool id="docx-to-text" >}}Word转文本{{< /tool >}}，"从常见文档里抽文字"这件事 Word 和 PPT 都覆盖了。写作场景的 EPUB 和 Word 互转收在[职场文书工具箱](/collections/workplace-writing-kit/)，转换类的工具持续在[文件处理流水线](/collections/file-ops-pipeline/)里攒着。
