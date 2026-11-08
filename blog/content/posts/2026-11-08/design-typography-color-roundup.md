---
title: "字号、行高、调色板：排版与配色的 16 件细节工具"
slug: "design-typography-color-roundup"
date: 2026-11-08T18:35:00+08:00
draft: false
tags: ['排版', '配色', '设计', '效率工具']
categories: ['效率工具']
author: '有条工具团队'
summary: '页面显得业余，多半输在字号行高没系统和颜色随手选。这篇把站点里 16 件排版与配色工具分成排版、色彩、素材资产三组，从定字号阶梯到配调色板再到备齐图标占位图，一套流程走完。'
---

页面看起来「差点意思」，多半不是布局的锅，而是细节没成体系：字号是随手填的，行高凭感觉，颜色东拼西凑。做官网、写组件库还是搭个人博客，这套规矩立好一次，后面每个页面都省心。站点的排版与配色工具攒到 16 件，这篇分成排版、色彩、素材资产三组理一遍，把「凭感觉」换成「按规则」。

## 排版：把字号行高定明白

中英文混排不知道搭什么字体，先让{{< tool id="font-pairing" >}}字体配对工具{{< /tool >}}推荐几组经过验证的组合。标题正文的字号不成阶梯，{{< tool id="typography-scale" >}}字体比例系统{{< /tool >}}按 1.25、1.333 这类比例一次生成 h1 到正文的整套字号。文字密得喘不过气，用{{< tool id="line-height-calculator" >}}行高计算器{{< /tool >}}按字号算出舒适的行高倍数。大标题想紧凑一点，{{< tool id="letter-spacing-tool" >}}字间距工具{{< /tool >}}帮你定标题收紧、正文放宽的具体数值。版心和卡片尺寸拿不定，{{< tool id="golden-ratio-calculator" >}}黄金比例计算器{{< /tool >}}按 1.618 拆出宽高参考。最后把间距、字号、层级丢给{{< tool id="design-specs-checker" >}}设计规范检查器{{< /tool >}}过一遍，看是否符合常见的网格与层级规范。

## 色彩：从一个主色推整套系统

品牌色只有一个，其余颜色让{{< tool id="color-palette-generator" >}}调色板生成器{{< /tool >}}按主色推辅助色和点缀色，60-30-10 的配比直接给你排好。拾色和 HEX、RGB、HSL 互转这类高频小事，{{< tool id="pro-color-picker" >}}专业取色器{{< /tool >}}一个页面全包。配色方案不能只自己看得清，放进{{< tool id="color-blindness-simulator" >}}色盲模拟器{{< /tool >}}预览一遍，红绿色盲用户能不能区分状态色一目了然。设计变量总不能叫 color1、color2，{{< tool id="color-naming-tool" >}}色彩命名工具{{< /tool >}}给每个色值起个能念出口的名字。不想自建色彩体系，{{< tool id="material-design-colors" >}}Material Design色板{{< /tool >}}和{{< tool id="tailwind-color-palette" >}}Tailwind色板生成器{{< /tool >}}两套现成色阶任选，后者还能按你的主色生成整套 50 到 900 的 Tailwind 变量。

## 素材资产：项目起步的最后一公里

配色排版定了，就差资产落地。站点图标先让{{< tool id="favicon-generator" >}}Favicon生成器{{< /tool >}}从一张图导出全尺寸 favicon 套件，浏览器标签页和 PWA 图标一起搞定。搭 demo 缺配图，{{< tool id="placeholder-image-generator" >}}占位图生成器{{< /tool >}}按尺寸颜色现生成占位，不用四处找图。界面里缺一支线性图标，先去{{< tool id="svg-icon-library" >}}SVG图标库{{< /tool >}}按关键词搜，常用图标基本都有；想把项目里的一堆 SVG 收拢成字体引用，{{< tool id="icon-font-generator" >}}图标字体生成器{{< /tool >}}一键打包，一个 class 就能调用。

16 件工具覆盖了从定规范到备资产的全流程，也都在浏览器本地运行，设计师和前端可以直接当日常工作台用。这一套和 CSS 生成器、图标工具属于同一个生态，收在[前端日常套装](/collections/frontend-daily-pack/)专题里，排版配色之外的一站式目录也在那里。
