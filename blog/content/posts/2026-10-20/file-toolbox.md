---
title: "文件处理工具箱：转换、查看、隐私清理"
slug: "file-toolbox"
date: 2026-10-20T11:55:00+08:00
draft: false
tags: ['文件处理', '编码转换', '压缩包', '证书', '隐私清理']
categories: ['效率工具']
author: '有条工具团队'
summary: '压缩包不想解压只想看一眼、老文件打开全是乱码、.env 要变成 JSON、发照片前得抹掉 GPS——这些活的共同点是"操作对象是一个文件"，不是粘贴板里的一段文本。这篇把站内文件级工具按查看、编码、转换、配置、隐私加密五条线收齐，全部浏览器本地处理，文件不出本机。'
---

## 这篇只管"文件级"操作

站内已经有数据格式互转的聚合篇（JSON/XML/YAML 那些，见[《数据格式化与互转》](https://www.util.cn/blog/articles/format-toolbox/))，也有图片处理全家桶，所以这篇划清边界：**只管你手上有一个真实文件的场景**——要打开看、要改编码、要换格式、要上锁。粘贴板文本级的小工具不在此列。这么切的好处是：文件比文本更敏感，也更容易"传出去就收不回"，下面每一项的共同底座都是**本地处理、不上传**。

## 只看不折腾：文件查看类

- [ZIP 压缩包查看器](https://www.util.cn/tools/zip-viewer/)：先列内容清单、预览文本文件、只取需要的那一个下载——为一份文件解压整个压缩包的时代过去了。
- [目录树生成器](https://www.util.cn/tools/directory-tree/)：选个文件夹出 ASCII/Markdown 树，支持排除 node_modules 和限制深度，写文档晒结构一步到位。
- [Excel 表格查看转换器](https://www.util.cn/tools/excel-viewer/)：xlsx/xls/csv 不装 Office 直接看，多 Sheet 切换，还能导出 JSON/CSV/Markdown。
- [图片信息查看](https://www.util.cn/tools/image-info/)：尺寸、格式、EXIF 一屏看全——和下面的清理工具是一对，先看再删。
- 拿到别人发的接口文档文件？[Swagger 查看器](https://www.util.cn/tools/swagger-viewer/) 直接把 Swagger/OpenAPI 文件渲染成可读文档，不装 Postman。
- 老系统导出的大 XML 要定位字段，用 [XPath 测试器](https://www.util.cn/tools/xpath-tester/) 写表达式精确取出节点，比 Ctrl+F 靠谱。

## 中文乱码专项

文件名对了内容还是花的，八成是编码问题。批量修走 [文件编码批量转换器](https://www.util.cn/tools/file-encoding-converter/)：多个文件一次检测 UTF-8/GBK/Big5 等编码并统一转成 UTF-8，老项目源码目录整树处理首选。只有一段文本、想逆向还原"锟斤拷"的，用 [文本乱码修复器](https://www.util.cn/tools/mojibake-fixer/)：按 UTF-8/GBK/Big5 误读关系给出多条修复链候选、逐个对比。转完后 Excel 打不开的，检查一下 BOM——[BOM 处理工具](https://www.util.cn/tools/bom-handling/) 管 UTF 系列的字节顺序标记检测与增删，三个工具构成一条完整的乱码治理流水线。

## 转换与导出：文件的格式搬家

表格类交给 [CSV 格式转换器](https://www.util.cn/tools/csv-converter/)：CSV/TSV 一键转 JSON、Markdown、HTML、YAML，分隔符与表头自动识别。视频字幕走 [字幕工具箱](https://www.util.cn/tools/subtitle-toolbox/)：SRT 与 VTT 互转、时间轴整体平移、按倍率缩放、去重复行——视频重新剪辑后音字幕对不上就是它救的场。文章发布用 [Markdown 导出器](https://www.util.cn/tools/markdown-exporter/)：转成带样式和代码高亮的独立 HTML 文件，可直接发人。照片要归档成 PDF，[图片转 PDF](https://www.util.cn/tools/image-to-pdf/) 多图合并导出（图片家族的更多玩法见图片处理篇）。开发侧的文件搬家还有两枚：[Postman 集合转换器](https://www.util.cn/tools/postman-collection-converter/) 把 Collection 文件转成 cURL/OpenAPI 等格式，[图片 Base64 互转](https://www.util.cn/tools/base64-image/) 把图片文件变成功内联的 Data URI。粘贴来的代码乱糟糟先过 [代码格式化](https://www.util.cn/tools/code-format/)，要盘一个项目的规模则用 [代码行数统计器](https://www.util.cn/tools/loc-counter/)：代码、注释、空行分开算，支持 20+ 语言的注释规则。

## 配置与证书：小文件大用途

`.env` 在 CI、docker-compose、文档之间搬运时格式总对不上，[.env 与 JSON 转换器](https://www.util.cn/tools/env-json-converter/) 双向转，引号、注释、export 前缀都认，还校验键名。拿到一张 `.pem` 不知道是什么证书、什么时候过期？[PEM 证书解析器](https://www.util.cn/tools/pem-parser/) 本地解析 X.509：主体、有效期、SAN、指纹一目了然，私钥公钥也能识别——运维交接和排查 HTTPS 报错时省掉 openssl 命令行的记忆负担。

## 隐私与上锁：发出去之前那一步

两件事必须在"发送"之前做：清元数据、加密。[EXIF 清除器](https://www.util.cn/tools/exif-cleaner/) 抹掉照片里的 GPS 定位、拍摄设备等隐私信息，支持 PNG/JPEG/WebP 输出——发旅行照到公网群聊的前置动作。[文件加密解密器](https://www.util.cn/tools/file-encryptor/) 用 AES-256-GCM 给任意文件上密码锁，附带密码强度检测，文件全程不出浏览器；要传给云盘的合同和财务表，先锁再传。

## 常见问题

### 这些工具处理大文件会不会很慢？

本地处理的瓶颈在你机器的内存而非网速，常见办公文件（几十 MB 的压缩包、Excel、图片）都在舒适区内；GB 级视频音频不属于文件工具链的目标场景。好处是没有排队和上传等待，也没有"文件传到别人服务器"的这层风险。

### 忘记加密文件的密码能找回吗？

不能。工具的设计是"锁为你自己装"：没有口令就没有解密，任何找回方案等价于后门。建议重要文件配一份离线记录的口令，或先用小文件验证流程再批量加密。

## 小结

五条线各管一段：**查看**（zip/目录树/Excel/图片信息/Swagger/XML）让你不折腾也能看到内容；**编码**（批量转码/乱码修复/BOM）治中文文件的历史病；**转换**（CSV/字幕/Markdown/图片转 PDF/集合互转/Base64/代码格式化与统计）负责格式搬家；**配置**（.env/PEM）接管开发运维的小文件；**隐私**（EXIF 清除/文件加密）守住发送前的最后一道门。文件比文本敏感——合同、照片、源码、证书都不该经过第三方服务器，这批工具全部本地运行，正好把这条原则落到实处。
