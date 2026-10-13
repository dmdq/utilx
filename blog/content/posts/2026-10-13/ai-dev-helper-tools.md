---
title: "AI 编程时代的边角活：代码分享图、截断 JSON、MCP 配置与镜像源"
slug: "ai-dev-helper-tools"
date: 2026-10-13T11:00:00+08:00
draft: false
tags: ['AI编程', 'JSON', 'MCP', '开发环境']
categories: ['效率工具']
author: '有条工具团队'
summary: 'AI 把写代码的主线活了，边角活却更磨人：代码截图中文乱码、LLM 输出的 JSON 断在半截、MCP 配置三家三套、新机配环境换源翻半天。四类高频小坑，用浏览器本地工具一次理顺。'
---

## 主线交给模型，边角活留给了自己

用上 AI 编程之后，写代码的时间确实少了，但四类"边角活"的时间反而涨了：想把 AI 生成的代码发群里讨论，截图工具的中文注释先乱码；让模型输出 JSON，它偏在半截断掉；想给 Cursor 和 Claude 配 MCP，三个客户端三套路径；新电脑配环境，换源命令翻半天。每件事不超过十分钟，一天来四次就是一小时。逐个说解法。

## 代码分享的体面姿势：中文注释不乱码

carbon 一类的代码截图工具好用是好用，但有个中文用户的经典痛点：**默认字体（Hack、Fira Code 这类）只有拉丁字形，不含 CJK**，中文注释在导出的 PNG 里回退成另一个字体，大小和基线都对不齐，整张图立刻显得廉价。想换字体得去改配置，十次分享九次将就着发。此外，公司代码贴到第三方在线截图站，服务端存了什么、留了多久，没人说得清——**截图是图片，代码是资产**。

[代码截图美化器](https://www.util.cn/tools/code-screenshot-beautifier/)用系统字体栈渲染，中文注释和代码属于同一字体族，天然对齐不打架；深色浅色多主题、窗口样式随便挑，一键导出 PNG。整个渲染在浏览器本地完成，贴进去的代码不上传，带敏感信息的片段也可以放心截。步骤三步：贴代码 → 选语言和主题 → 导出发群。

## LLM 输出的 JSON 断了怎么办

让模型导出 100 条数据，输出到第 68 条戛然而止，`JSON.parse` 直接抛错。成因基本就一个：**max_tokens 是输出 token 的硬上限**（不含输入），到顶就截断，OpenAI 风格的接口里 `finish_reason` 会标成 `length`。这笔账可以算：每条记录约 60 token，100 条约 6000 token，max_tokens 只给 4096，4096÷60≈68——**断在第 68 条前后是必然，不是偶然**。

断了的 JSON 有固定三步修复：①剥掉 markdown 围栏（开头的 \`\`\`json 和结尾的 \`\`\`）；②从断点向上按栈配对，补全引号和括号；③清理尾逗号（`[1, 2, ]` 这类模型爱写的写法）。举个例子：

```json
{"todos": [
  {"id": 1, "title": "生成周报", "done": true},
  {"id": 2, "title": "同步任务状态", "done":
```

修复后剥掉无关部分、补上 `]}`，断掉的最后一条不完整，宁缺毋滥剔除：

```json
{"todos": [
  {"id": 1, "title": "生成周报", "done": true}
]}
```

[截断JSON修复器](https://www.util.cn/tools/truncated-json-repair/)把这三步自动做掉，贴进去即出可解析的结果。不过修复只是止损，根治要往上游走：先用[Token计数与API成本计算](https://www.util.cn/tools/token-cost-calculator/)把提示词加期望输出的 token 量算一遍，**max_tokens 一次设够**；再在提示词里约束"只输出 JSON、不要围栏、不要解释"，现成模板可以在[Prompt提示词库](https://www.util.cn/tools/prompt-library/)里挑。

## MCP 配置为什么总写错

MCP（Model Context Protocol）让 AI 客户端能调用外部工具，但三个主流客户端的配置互不通用——**文件名不同、路径不同、作用域不同**，网上的教程又常常混着写，"照抄也不生效"于是成了高频问题。先对照记一遍（以各家官方文档为准）：

- **Cursor**：全局 `~/.cursor/mcp.json`，项目级 `.cursor/mcp.json`
- **Claude Desktop**：macOS 在 `~/Library/Application Support/Claude/claude_desktop_config.json`，Windows 在 `%APPDATA%\Claude\claude_desktop_config.json`
- **Claude Code**：项目根目录 `.mcp.json`（可随仓库共享），用户级在 `~/.claude.json`，也可以命令行 `claude mcp add` 注册

对照之外，还有三个高频错：

1. **文件放错客户端**：把 Claude Desktop 的配置贴进 Cursor 的设置里——Cursor 根本不读那个文件，当然不生效
2. **启动命令写法不对**：command 要给可执行文件，参数拆进 args 数组；Windows 下 npx 是 .cmd 脚本，要包一层 `cmd /c npx` 才能被拉起
3. **改了不重启**：MCP 服务在客户端启动时加载，改完配置要完全退出再打开

嫌对照麻烦就用[MCP配置生成器](https://www.util.cn/tools/mcp-config-generator/)：选目标客户端，填命令和参数，表单直接生成对应路径下的配置 JSON，三家的格式差异它替你记。

## 新机配环境：镜像源一次配齐

新电脑装完 Node 和 Python，第一个 `npm install` 卡十分钟，才想起来没换源。麻烦在于每家工具的配置入口都不一样：npm 写 `~/.npmrc`，pip 有自己的 config 体系，conda 是 `.condarc`，cargo 在 `config.toml`，brew 靠环境变量。最常用的两条命令是：

```bash
npm config set registry https://registry.npmmirror.com
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

不想每家翻一遍文档，用[镜像源配置生成器](https://www.util.cn/tools/mirror-source-generator/)：pip、npm、conda、brew、cargo 逐个勾选，一键生成配置命令和文件片段，新机环境十分钟跑通，剩下的大半天留给正事。

## 顺手速查：两个高频开发小件

边角活不止四件。AI 生成的 SQL 想人肉核对，丢进[SQL格式化工具（开发版）](https://www.util.cn/tools/dev-sql-formatter/)排版对齐再读，多表 JOIN 也不会看串行；git 命令总记不全，[Git命令生成](https://www.util.cn/tools/git-command/)用中文描述操作，直接给出对应命令。另外，AI 生成的代码跑出运行时错误之后，排查还是自己的活，后端三类高频场景（日志参数还原、堆栈定位、连接串核对）的固定套路，见[《后端排查三件套：MyBatis 日志还原、堆栈定位与连接串核对》](https://www.util.cn/blog/articles/backend-debug-log-tools/)。

## 常见问题

### 修复截断 JSON 会伪造数据吗？

不会凭空造数。修复只做语法层的三件事：剥围栏、配对补全括号引号、清尾逗号，断掉的那条记录要么剔除要么置空。**语法可以补全，语义必须自己核**——关键数据建议调大 max_tokens 重新生成，别在残缺输出上硬凑。

### MCP 配置的路径以什么为准？

客户端迭代很快，配置文件位置以各家官方文档为准。生成器给的是当前主流版本的路径，若你的客户端版本较旧、目录结构不同，以本机实际目录为准。

### 镜像源安全吗？

选知名公共镜像（高校 TUNA、云厂商官方源）风险可控；对完整性敏感的场合，安装时校验包的哈希值即可，换源改变的是下载渠道，不是包本身。

## 小结

AI 编程的四类边角活固定成四步：**分享代码用系统字体栈渲染 → 截断 JSON 剥围栏、补括号、清尾逗号 → MCP 配置按客户端对号入座 → 镜像源一键生成**。本文用到的代码截图美化器、截断JSON修复器、MCP配置生成器、镜像源配置生成器，加上 Token 计数、提示词库、SQL 格式化、Git 命令生成，全部在浏览器本地运行——让 AI 碰过的代码和配置，仍然留在你自己的机器上。
