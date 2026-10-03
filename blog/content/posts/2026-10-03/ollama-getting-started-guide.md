---
title: "Ollama 从安装到跑通：新手完整教程与常见报错"
slug: "ollama-getting-started-guide"
date: 2026-10-03T09:05:00+08:00
draft: false
tags: ['Ollama', '教程', '本地部署']
categories: ['人工智能']
author: '有条工具团队'
summary: '手把手安装 Ollama、拉取模型、调通 REST API，覆盖 OOM、生成速度慢、连接拒绝等高频报错的排查思路，新手照做即可跑通。'
---

## 装完 Ollama 之后，才是新手期

Ollama 的安装只要一分钟，但社区里的大量提问发生在装完之后：模型该拉哪个 tag、为什么生成速度只有 3 Token/s、为什么 API 一直连接拒绝。这篇文章按"安装 → 选模型 → 调参数 → 排报错"的顺序走一遍，跟着做完，Ollama 就算真正跑通了。

## Ollama 是什么：本地模型的"播放器"

Ollama 是一个本地推理引擎（运行时），职责是把打包好的 GGUF 模型文件在本地跑起来——下载、加载、对话、暴露 API，一条命令全包。推理引擎这个概念本身的通俗解释，见[推理引擎词条](https://www.util.cn/wiki/inference-engine/)。

它和 LM Studio 的分工很清晰：**只想在图形界面里点选模型聊天，用 LM Studio；要做开发集成、脚本调用或局域网服务，用 Ollama**。两者底层读的都是 GGUF 格式（见 [GGUF 词条](https://www.util.cn/wiki/gguf/)），选哪个都不影响另一个，硬盘够可以都装。对新手更实际的路径是：先用 LM Studio 建立直觉，再用 Ollama 落地自动化——这也是社区最常见的顺序。

## 安装与第一条命令

到 [ollama.com](https://ollama.com) 下载对应系统的安装包（macOS / Windows / Linux 都有），Linux 用户也可以用一行脚本：`curl -fsSL https://ollama.com/install.sh | sh`。装完执行 `ollama -v` 能打印版本号，就说明服务已就绪。随后在终端执行：

```bash
ollama run qwen3:4b
```

这条命令会自动下载模型并进入对话。配套三个常用命令：

- `ollama list`：查看本地已有模型
- `ollama ps`：查看当前加载的模型、显存占用与 GPU/CPU 分布
- `ollama pull <模型名>`：只下载不进入对话

## 按硬件选模型 tag

模型名后面的数字是参数量，不指定量化时默认拉取 Q4_K_M 档（GGUF 生态的社区默认）。下载前先确认硬件撑得住：用 [GPU 检测与模型推荐工具](https://www.util.cn/tools/gpu-detector/)识别显卡与可用显存，再按下表选 tag：

| 可用显存 | 推荐 tag | 生成速度参考* |
| --- | --- | --- |
| 约 8G | qwen3:4b、llama3.2:3b | 40-80 Token/s |
| 约 16G | qwen3:14b、llama3.1:8b | 20-40 Token/s |
| 约 24G | qwen3:32b、deepseek-r1:32b | 10-25 Token/s |

\* 以 NVIDIA 消费级显卡为参考的量级区间，M 系 Mac 会低一档。三大家族各有什么侧重，见[本地大模型选型指南](https://www.util.cn/blog/articles/local-llm-model-comparison-2026/)。

tag 里还有两个隐藏信息。第一，`qwen3:4b` 这类短名默认是对话指令版、Q4 量化；要精确控制档位可以写全，例如 `qwen3:14b-q4_K_M`。第二，`deepseek-r1:14b` 这类推理模型回答数理题时会先输出一段"思考过程"再给答案，属于正常行为而不是卡住。

## 上下文与 REST API

Ollama 的默认上下文窗口只有 2K-4K Token，长文档一贴进去，后半段就被静默截断。对话内用 `/set parameter num_ctx 8192` 临时调整，或写进 Modelfile 固化。注意 **num_ctx 越大，显存占用越高、生成越慢**，影响机制在[推理速度词条](https://www.util.cn/wiki/inference-speed/)里有展开。不确定一份材料有多少 Token，先用 [Token 计数与 API 成本计算器](https://www.util.cn/tools/token-cost-calculator/)估个数，再决定 num_ctx 给多大。

REST API 是 Ollama 对开发者的主要价值，一个最小可用示例：

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "qwen3:4b",
  "messages": [{"role": "user", "content": "用一句话介绍你自己"}],
  "stream": false,
  "options": {"num_ctx": 8192}
}'
```

两个实用细节：`stream` 默认为 `true`，接口会按行流式返回，做打字机效果靠它；只需要单次补全、不需要维护多轮对话历史时，改用更简单的 `/api/generate` 接口即可。

跑通之后别急着裸写提示词，[Prompt 提示词库](https://www.util.cn/tools/prompt-library/)里有写作/编程/翻译等现成模板，填上变量就能测出模型的真实水平。

## 高频报错排查

**报错一：`model requires more system memory`（内存/显存不足）**

模型或上下文超出了硬件承受范围。降级顺序：换更低量化档 → 换更小参数模型 → 调小 num_ctx。8G 显存硬跑 14B Q4，大概率就是这条报错。

**报错二：生成速度远低于预期**

先执行 `ollama ps` 看 PROCESSOR 列：显示 `100% GPU` 才是全程显卡推理；出现 CPU 参与说明模型没有完全装进显存，速度会掉一个数量级。另一个常见原因是 num_ctx 设得过大，KV Cache 挤占了本该给权重驻留的空间。把配置降到"模型能整体驻留 GPU"，速度立刻恢复。判断标准：**模型权重加上 KV Cache 应控制在可用显存的八成以内**。

**报错三：`connection refused`（连接拒绝）**

API 请求打不通，按顺序检查：Ollama 服务是否在运行（桌面版看菜单栏/托盘图标，命令行环境执行 `ollama serve`）；端口是否为 **11434**；跨机器访问需要设置环境变量 `OLLAMA_HOST=0.0.0.0` 并放行防火墙。

## 常见问题

### Ollama 和 LM Studio 到底装哪个

只聊天，LM Studio 更直观；要 API 集成、定时批量任务或部署给局域网用，Ollama 更合适。拿不准就都装，试用一周自然有答案。唯一要注意的是别让两者同时往显存里塞大模型——一边加载着模型，另一边就容易 OOM，测试前先确认另一个没有占着显存。

### 模型下载到了哪里，能搬家吗

默认在 `~/.ollama/models`（Windows 在用户目录下）。磁盘紧张时设置环境变量 `OLLAMA_MODELS` 指向新路径即可，已下载的模型需要手动迁移过去。

### 为什么聊着聊着模型就"失忆"

上下文超过 num_ctx 后，最早的内容会被截断丢弃，这是机制不是 bug。长对话要么调大 num_ctx（代价是显存与速度），要么定期让它总结前文，再开新会话继续。

## 小结

Ollama 的上手路径就四步：**装好、测硬件、按档拉模型、报错按清单排查**。相关工具都收录在[本地跑大模型场景专题](https://www.util.cn/collections/local-llm-starter/)里；想看一篇从硬件检测到成本核算的完整部署实录，[这篇 16G Mac 实测](https://www.util.cn/blog/articles/run-local-llm-on-16g-mac/)可以对照着做。
