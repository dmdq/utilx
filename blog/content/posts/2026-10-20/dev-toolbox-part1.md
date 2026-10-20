---
title: "开发者的浏览器工具箱（一）：命令生成与项目配置"
slug: "dev-toolbox-part1"
date: 2026-10-20T10:00:00+08:00
draft: false
tags: ['DevOps', '命令行', '配置文件', 'CI/CD', '容器']
categories: ['技术教程']
author: '有条工具团队'
summary: 'Crontab 字段、Docker 参数、YAML 缩进，这些都不该靠记忆。这篇把站内 25 款"把背变成填表"的开发工具收在一页：命令生成、容器与 CI 编排、工程配置、版本规范、域名与 URL 杂项，全部浏览器本地运行，勾选即出结果，复制即用。'
---

## 为什么这页值得收藏

Crontab 字段、Docker 参数、YAML 缩进——记这些不值得。站内 25 款工具把"背"变成"填表"，浏览器本地运行，复制即用。

开发里有一大类工作没有智力含量，只有记忆量：定时任务的第五个字段是几点来着？`--mount` 和 `-v` 有什么区别？Action 的缓存键怎么写？答案是**别背，去生成**。这篇按场景收录 25 款浏览器工具，每款对应一类"每次都要翻文档"的配置活。

## 命令行与定时任务：别背参数

- [Linux命令生成](https://www.util.cn/tools/linux-command/)：用中文描述意图（"查找大于 100M 的文件"），输出可直接粘贴的命令，附带每个参数的解释。
- [Docker命令生成](https://www.util.cn/tools/docker-command/)：勾选端口、挂载、重启策略、环境变量，生成完整 `docker run`，比抄 StackOverflow 的答案更知道自己在跑什么。
- [Crontab生成](https://www.util.cn/tools/crontab-generator/)：五个字段可视化选择，实时显示"下次执行时间"，改完顺带校验语法。
- [SSH配置生成器](https://www.util.cn/tools/ssh-config-generator/)：填主机、IP、用户、跳板机，生成 `~/.ssh/config`，ProxyJump 一步配好，此后 `ssh prod` 替代三行长命令。
- [Git命令生成](https://www.util.cn/tools/git-command/)：回滚、暂存、改历史这些低频高危操作，先让工具把命令列出来再执行，比凭印象敲安全得多。

提交规范怎么落地，可配合站内[《Conventional Commits 工作流》](https://www.util.cn/blog/articles/conventional-commits-workflow/)一起看。

## 容器与 CI：配置文件点点就出来

- [Dockerfile生成器](https://www.util.cn/tools/dockerfile-generator/)：选语言与框架，生成多阶段构建骨架，Node/Python/Go 常见结构都有模板。
- [Docker Compose编辑器](https://www.util.cn/tools/docker-compose-editor/)：可视化增删服务、网络、卷与依赖关系，输出标准 `docker-compose.yml`。
- [K8s YAML生成器](https://www.util.cn/tools/kubernetes-yaml-generator/)：Deployment、Service、ConfigMap 表单化配置，新手最容易错的缩进和 apiVersion 由工具负责。
- [GitHub Actions生成器](https://www.util.cn/tools/github-actions-generator/)：勾选语言、触发条件、缓存和测试命令，直接产出 workflow yml——CI 不再抄别人仓库。完整流水线设计见[《GitHub Actions 完全指南》](https://www.util.cn/blog/articles/github-actions-complete-guide/)。
- [JVM启动参数配置](https://www.util.cn/tools/jvm-args-config/)：内存分区、GC 收集器、性能选项分组讲解，生成 `-Xmx -XX:` 串，每个参数为什么加写得明明白白。

## 工程文件：每个仓库都绕不开的几份配置

- [package.json工具](https://www.util.cn/tools/package-json-tools/)：格式化、校验、分析三合一，字段顺序乱了、脚本写错逗号了，一贴便知。
- [环境变量管理器](https://www.util.cn/tools/env-variable-manager/)：`.env` 格式互转与校验，多行值、引号规则这些坑由它兜底，注意**导出的内容只留在浏览器里**，密钥类文件本来就不该经过任何服务器。
- [.gitignore生成器](https://www.util.cn/tools/gitignore-generator/)：按项目类型与操作系统组合生成，Node + macOS + IDE 三个勾一选，规则一次配齐。
- [ESLint配置生成器](https://www.util.cn/tools/eslint-config-generator/)：选框架生成 ESLint 9 flat config，附赠 `.editorconfig` 和 husky 配套片段，新项目十分钟接好规约。
- [YAML验证格式化工具](https://www.util.cn/tools/yaml-validator-formatter/)：校验 YAML 1.2 并美化结构，K8s 与 CI 报错"indentation problem"时的第一站。
- [AI编程规则生成器](https://www.util.cn/tools/ai-rules-generator/)：勾选技术栈与代码风格，生成 `.cursorrules` / `CLAUDE.md` / `AGENTS.md`，把团队规范喂给 AI 编程助手。

## 规范与版本：接口和数据有章法

- [JSON Schema生成](https://www.util.cn/tools/json-schema/)：贴一段 JSON 反推结构定义，接口文档与表单校验的地基。
- [OpenAPI规范生成器](https://www.util.cn/tools/openapi-spec-generator/)：生成 OpenAPI 3.0 文档，JSON/YAML 双格式导出，前后端对接先立契约。
- [SemVer版本解析比较器](https://www.util.cn/tools/semver-parser/)：解析、比较、批量排序语义化版本，`^` `~` 范围匹配到底覆盖哪些版本，一查便知。
- [Changelog生成器](https://www.util.cn/tools/changelog-generator/)：粘贴 `git log`，按 Keep a Changelog 规范分组生成更新日志。
- [Conventional Commits生成器](https://www.util.cn/tools/commit-message-generator/)：type/scope/breaking 表单化提交信息，和上一条正好组成"提交→日志"的流水线。

## 网络与环境：域名、URL 与速查

- [GoDaddy域名解析](https://www.util.cn/tools/godaddy-dns/)：在线管理 DNS 记录，增删改 A/CNAME/MX 不再翻控制台找入口。
- [URL参数构建器](https://www.util.cn/tools/url-params-builder/)：可视化拼查询参数并自动编码，生成完整 URL，联调时再也不用手数字符。
- [URL Slug生成器](https://www.util.cn/tools/html-slug-generator/)：标题转 URL 友好的 slug，支持多语言与自定义规则，含中文标题的处理策略。
- [MIME类型查询器](https://www.util.cn/tools/mime-type-lookup/)：扩展名与 MIME 双向查询，`Content-Type` 设置错误时先来这里对答案。

## 常见问题

### 这些工具需要注册或上传文件吗？

不需要。本页工具全部在浏览器本地运行，输入的配置、密钥、日志不出本机，也不产生账号依赖，收藏本页即可随时使用。

### 生成器产出的配置可以直接上生产吗？

可以直接作为起点，但建议保留"读一遍"的习惯：生成器的价值是消灭低级错误（拼写、缩进、漏参数），业务相关的取值（副本数、内存上限、触发分支）仍需自己确认。

## 小结

25 款工具各管一段：命令与定时（Linux/Docker/Crontab/SSH/Git）、容器与 CI（Dockerfile/Compose/K8s/Actions/JVM）、工程文件（package.json/.env/.gitignore/ESLint/YAML/AI 规则）、规范与版本（Schema/OpenAPI/SemVer/Changelog/Commits）、网络杂项（DNS/URL/Slug/MIME）。第二篇《调试排障与数据转换》收录另外 25 款，处理"线上出事了"和"格式对不上"这两类场景。
