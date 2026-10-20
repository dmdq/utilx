---
title: "配置文件别再抄了：从 CI、ESLint 到 ER 图，九个生成器一次讲透"
slug: "dev-config-generators"
date: 2026-10-20T09:25:00+08:00
draft: false
tags: ['GitHub Actions', 'ESLint', 'Dockerfile', 'ER图', '提示词工程']
categories: ['技术教程']
author: '有条工具团队'
summary: '新仓库开工要手搓 workflow、flat config、Dockerfile，画库表现在要截图 Mermaid，连给 AI 的规范文件都靠复制粘贴——工程配置这件事早该模板化。六个新生成器加三位老将，浏览器里点选生成，全部本地计算不上传。'
---

## 每个新仓库的第一小时，都在抄配置

初始化项目最消耗的不是写代码，是把 CI、lint、容器、提交规范四套配置凑齐：官方文档一遍遍开、别人的仓库一段段抄，抄完还不敢保证版本兼容。**配置的共性是一次编写长期复用，正适合生成器干**。这篇按"仓库流水线→数据库→文档→AI 协作"四段过一遍这九款工具。

## 仓库流水线：workflow、lint、Dockerfile

[GitHub Actions生成器](https://www.util.cn/tools/github-actions-generator/)勾选语言、触发条件、缓存和测试命令，直接产出可下载的 workflow yml。生成后记得手动补两处：Node 项目把 actions/cache 的 key 写成 `cache-npm-{hashFiles('package-lock.json')}`，锁文件一变缓存自动失效；并发控制加一句 `concurrency: ${{ github.workflow }}-${{ github.ref }}`，同分支连续推送就不会互相打架。两条纪律顺手记住：私有源凭证和部署令牌只放仓库 Secrets，写进 yml 等于明文广播；jobs 加一句 timeout-minutes: 15，卡死的测试会自行失败，不会把执行时长耗到整晚。

[ESLint配置生成器](https://www.util.cn/tools/eslint-config-generator/)按框架和严格程度出 **ESLint 9 的 flat config**（eslint.config.js），顺带生成 .editorconfig 和 husky 预提交片段。flat config 与老 .eslintrc 不兼容，迁移项目要确认团队所有人删掉旧文件，否则本地 CI 结果不一致。上线节奏上，第一次引入只建议把语法级错误保持 error，风格类降为 warn——一次全开严格模式就是满屏上千条红线，团队的下一次动作一定是把 lint 关掉。

[Dockerfile生成器](https://www.util.cn/tools/dockerfile-generator/)可视化选基础镜像和构建步骤，Node、Python、Go 多框架覆盖。构建优先选多阶段：编译层用完整镜像，最终层只拷产物，Node 应用能把镜像从接近 1GB 压到一百多兆——瘦身收益几乎全在这一步。配合 [Conventional Commits生成器](https://www.util.cn/tools/commit-message-generator/)的表单式提交信息（type/scope/breaking/footer），仓库从第一次提交起就是规范形态。

## 提交历史变现：git log 变 Release Notes

发版写更新日志是典型的"人人都讨厌、人人都得写"。[Changelog生成器](https://www.util.cn/tools/changelog-generator/)粘贴 git log，按 Keep a Changelog 规范把 feat/fix/perf 归入 Added/Fixed/Changed 分组。前提是提交信息本身规范——这正好接上上一段的 Commits 生成器：**前者保证日志可解析，后者保证解析有结果**，两个一起用，写 Release Notes 的时间从半小时缩到一分钟。版本号也随之有据可依：破坏性变更升主版本、新功能升次版本、修 bug 升修订号——看分组后内容堆在哪一类，版本号不用靠感觉。

## 库表现形图，文档现现公式

接手陌生系统第一件事是看懂表关系。[DDL转ER图](https://www.util.cn/tools/ddl-to-er-diagram/)粘贴建表语句，自动出 Mermaid erDiagram 并可导出 PNG：`users` 表的外键 `user_id` 指向它时，图上会画出 `USERS ||--o{ ORDERS : ""` 这样的一对多连线，**表多了不用逐个点，主键外键关系一眼成型**。技术文档里的公式交给 [LaTeX公式渲染](https://www.util.cn/tools/latex-formula-render/)：本地 KaTeX 即时渲染，复制图片或导出 PNG，贴进周报、课件、README 都不用挂外部图床。输入用标准 LaTeX 语法，比如贝叶斯公式写成 P(A|B)=\frac{P(B|A)P(A)}{P(B)}，看到分式和条件竖线在页面上渲染到位，再导出也不迟。

## 给 AI 写规范，给提示词留版本

AI 结对编程的最大隐性成本，是每次对话都要重新交代"我们项目用什么栈、什么风格"。[AI编程规则生成器](https://www.util.cn/tools/ai-rules-generator/)勾选技术栈与代码风格，生成 `.cursorrules`、`CLAUDE.md`、`AGENTS.md` 三种规范文件，丢进仓库根目录，AI 每次进场自动带上项目背景。规范内容宁缺毋滥，只写三类：技术栈与版本、命名与目录约定、禁止执行的命令——"依赖只用 pnpm 安装"写一句，就少一轮返工对话。规范会改，改完怎么确认改动方向正确？[Prompt版本对比](https://www.util.cn/tools/prompt-diff-checker/)逐字对比两版提示词，高亮增删并统计字符、行数和估算 token——**新增 96 个英文字符约 24 token（按 4 字符≈1 token 估）**，改提示词前先看清 token 增量，别让它悄悄吃掉上下文预算。对比的最佳时机是改版之前：先存旧版、改完即比，若高亮里除了新增还混着意外删除，误删的约束句当场就能逮住。

## 常见问题

### 生成器产出的配置能直接用吗？

能跑，但建议人工过一遍再提交。生成器解决的是"从零到八十分"，业务特有部分（私有源凭证、部署环境、特殊构建参数）仍要自己补，改完存进仓库版本控制。

### ER 图的连线方向代表什么？

`||--o{` 读作"一边恰好一个，另一边零或多个"。箭头指向多的一方；若关系是 1:1 用 `||--||`。工具按外键推断，没建外键约束的表关系要手工补线。

### Token 估算靠谱吗？

按字符数估只是量级参考，各模型分词器不同，中文和代码的实际值偏差更大。判断"改完提示词会不会爆上下文"够用，精确计费以模型 API 返回的 usage 为准。

## 小结

九款工具覆盖四段工程日常：**workflow、flat config、Dockerfile、规范提交与日志变现、DDL 出图、公式渲染、AI 规范与提示词 diff**。技术栈、表结构、提示词这些都是项目资产，在浏览器里点选生成即可，全部本地计算不上传。
