---
title: "替换、拼音、参考文献：19 件文本处理工具大盘点"
slug: "text-processing-roundup"
date: 2026-11-08T19:25:00+08:00
draft: false
tags: ['文本处理', '文本清洗', '拼音转换', '写作工具']
categories: ['效率工具']
author: '有条工具团队'
summary: '从 PDF 复制来的稿子满是空格、API 字段要统一命名风格、论文参考文献卡在国标格式——这篇把站点 19 件文本处理工具分成四组：清洗整理、格式转换、中文向和写作向。'
---

从 PDF 里粘出一段稿子，字与字之间塞满诡异空格；改一个 API 字段名要动几十处；交论文时参考文献卡在国标格式上——文本处理的麻烦大多不在「写」，而在「收拾」。站点里的文本工具已经攒到 19 件，这篇按四组过一遍，哪类脏活都能找到对应的刷子。

## 清洗与整理：先把文本弄干净

批量改术语、统一字段名，交给支持正则的{{< tool id="text-replace" >}}文本替换{{< /tool >}}，一次到位。从 PDF 复制来的字间空格、全角空格，用{{< tool id="text-whitespace" >}}空格格式化工具{{< /tool >}}一键清理；段首该缩进的没缩进、缩进深浅不一，{{< tool id="text-indent" >}}文本缩进格式化工具{{< /tool >}}统一样式。中英混排里全角逗号和半角逗号混着用，{{< tool id="full-half-converter" >}}全角半角转换工具{{< /tool >}}按需全转。英文段落要在全大写、全小写、首字母大写之间切换，{{< tool id="case-converter" >}}大小写转换{{< /tool >}}随点随换；整篇小写的英文稿，{{< tool id="sentence-case" >}}句首大写工具{{< /tool >}}按句子自动补大写。改 API 命名风格，{{< tool id="camel-case-converter" >}}命名格式转换{{< /tool >}}在 camelCase、snake_case、kebab-case 之间互转，不用手抠下划线。想知道一段话倒着念什么样、或做个回文测试，{{< tool id="text-reverse" >}}文本倒置工具{{< /tool >}}整个翻过来。最后兜底的是{{< tool id="line-operations" >}}行操作工具{{< /tool >}}，去重、排序、删空行、加行号，一堆日志先过一遍再交给下一站。

## 格式转换：换一副骨架

网页正文想存成纯文本，{{< tool id="html-to-text" >}}HTML转纯文本工具{{< /tool >}}把标签样式全部剥干净。逗号、制表符分隔的数据要贴进文档，{{< tool id="text-to-table" >}}文本转表格工具{{< /tool >}}直接变出可复制的表格。从一大段里抽出邮箱、手机号、URL、日期，{{< tool id="text-extractor" >}}文本提取器{{< /tool >}}一把抓全。章节编号在罗马数字和阿拉伯数字之间来回换，{{< tool id="roman-numeral-converter" >}}罗马数字转换{{< /tool >}}即输即得；合同金额要大写、章节要「一二三」，{{< tool id="chinese-number-converter" >}}中文数字转换器{{< /tool >}}双向都能转。

## 中文向：拼音与成语

给课文、生词表加注拼音，{{< tool id="pinyin-converter" >}}拼音转换工具{{< /tool >}}声调齐全，多音字也能按词消歧。写作卡词想找个贴切的成语，{{< tool id="idiom-dictionary" >}}成语词典接龙{{< /tool >}}查释义顺便还能玩接龙。

## 写作向：统计、转义与参考文献

交稿前心里没底，{{< tool id="text-statistics" >}}文本统计分析工具{{< /tool >}}把字数、词频、可读性一次报齐。文本要塞进各类系统又怕特殊字符闹脾气，{{< tool id="text-escape" >}}文本转义工具{{< /tool >}}统一转义再粘贴。论文参考文献最磨人，{{< tool id="gbt7714-citation-generator" >}}GB/T 7714引文生成器{{< /tool >}}按国标格式直接生成，条目字段填好就出标准样式。

这 19 件全部本地运行，长文粘贴也不上传。文本处理完常要交给下一环——排版、转格式、生成文档，可以在[写作者工具箱](/collections/writer-toolkit/)专题里接着挑趁手的。
