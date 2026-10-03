---
title: "Git 提交规范落地：Conventional Commits 与自动 Changelog"
slug: "conventional-commits-workflow"
date: 2026-10-03T10:30:00+08:00
draft: false
tags: ['Git', '提交规范', 'Changelog']
categories: ['开发实践']
author: '有条工具团队'
summary: '提交信息是团队的公共记忆。从 type、scope、breaking 的速成口诀，到把 git log 一键转成规范 Changelog，两步把提交规范落成习惯而不是口号。'
---

## 为什么提交信息值得规范

"fix bug""修改了一些东西"——这类提交信息三个月后连作者自己都看不懂。提交规范不是形式主义，它带来三个实打实的收益：

1. **自动生成 Changelog**：type 标明了每条提交的性质，工具能据此直接分组生成更新日志，发版不再靠回忆。
2. **快速定位问题**：`git log --grep`、按 scope 过滤、配合 bisect 逐步回退时，一眼看懂每一步改了什么。
3. **自动决定版本号**：feat 对应 minor、fix 对应 patch、breaking 对应 major，语义化版本可以交给规则推断，不用人拍脑袋。

对比一下：

```text
// 随手写的，没人知道它改了什么
fix bug
update

// 规范的，一眼看懂动了哪个模块、什么性质、是否破坏兼容
fix(auth): 登录态过期后未清除本地 token，导致循环跳转
feat(api)!: 用户接口分页参数从 page 改为 offset，不兼容旧调用
```

## 七要素速成：一条合格提交长什么样

Conventional Commits 的骨架是：

```text
<type>(<scope>): <描述>

[可选 body：解释为什么改]

[可选 footer：BREAKING CHANGE、关联 issue]
```

type 常用十来个，先记最高频的六个：**feat**（新功能）、**fix**（修缺陷）、**docs**（文档）、**refactor**（重构）、**perf**（性能）、**chore**（杂务），其余的（style、test、build、ci、revert）用到再查。

和版本号的对应关系是整套规范的杠杆，必须背下来：

- **fix → PATCH**：1.2.3 → 1.2.4
- **feat → MINOR**：1.2.3 → 1.3.0
- **breaking change → MAJOR**：1.2.3 → 2.0.0，写法是在 type 后加 `!`（如 `feat!:`），或在 footer 里写 `BREAKING CHANGE: 迁移说明`

scope 是可选括号，标明改动范围（模块名、包名），团队内部统一粒度即可。

## 用生成器拼标准提交

背不下格式没关系，[Conventional Commits 生成器](https://www.util.cn/tools/commit-message-generator/)把它做成了表单：选 type、填 scope 和描述、勾选是否 breaking，**生成规范的提交信息**，复制即用。它还带**历史记录**，提交前翻一翻最近的格式保持一致，比翻规范文档快。

实操节奏建议：日常小改动直接手写，规范背熟后就是四个字段的事；涉及 breaking 或多个 scope 的大改动用表单拼，确保 footer 里的迁移说明不漏。

## 从 git log 到 Changelog

发版日最烦的活是写 Changelog，规范提交让这件事变成"粘贴加分组"。先导出上个版本以来的提交：

```bash
git log v1.2.0..HEAD --pretty=format:"- %s (%h)"
```

把输出粘进 [Changelog 生成器](https://www.util.cn/tools/changelog-generator/)，它会按 **Keep a Changelog** 规范自动分组：feat 归入 Added、fix 归入 Fixed、标记废弃的归入 Deprecated，输出结构完整的更新日志。你要做的只剩把描述润色成用户视角的措辞——"fix: 修复 xxx"改成"修复了 xxx"。

## 团队推广：靠机制不靠自觉

- 规范落地靠工具链：社区标准做法是 **commitlint** 校验格式 + **husky** 挂在 commit-msg 钩子上，不合规范的提交直接被拒，一天就能配好。
- 但先把规范本身讲清楚再上工具，否则大家只会研究怎么绕过检查。本文的 type 语义、breaking 写法、版本号对应关系，整理成一页贴进团队 README 就够。
- 未推送的提交写错了用 `git commit --amend` 补救；已推送的批量修正用 rebase，注意别动别人已经基于它开发的提交。

## 常见问题

### chore 和 docs 会触发版本发布吗？

按默认约定不会——只有 feat、fix 和 breaking change 影响语义化版本号。chore、docs、refactor 这类既不修缺陷也不加功能，发不发版看团队自己的策略。

### scope 必须写吗？

规范里它是可选项。建议单体仓库按模块写（auth、api、web），monorepo 按包名写，同一仓库保持一种粒度就好。

### 历史遗留的不规范提交怎么办？

不用回头补写。生成 Changelog 时它们无法被自动分组，发版时人工检查补齐即可，重要的是从下一条提交开始规范。

## 小结

提交规范的价值不在"好看"，而在让机器能读懂历史：**type 定性质，scope 定范围，breaking 定版本**。拼提交用 [Conventional Commits 生成器](https://www.util.cn/tools/commit-message-generator/)，发版用 [Changelog 生成器](https://www.util.cn/tools/changelog-generator/)，两个工具都收录在[前端日常工具包](https://www.util.cn/collections/frontend-daily-pack/)专题里。规范这东西，落地第一周最难，之后就是顺手的习惯。
