---
title: "JSON 变 Go Struct 和 Pydantic：后端建模的两件生成器"
slug: "dev-config-quartet"
date: 2026-11-03T09:15:00+08:00
draft: false
tags: ['Go', 'Pydantic', 'FastAPI', '代码生成', 'JSON']
categories: ['开发实践']
author: '有条工具团队'
summary: '拿到接口返回的 JSON，手写一遍 Go Struct 或 Pydantic Model 是每个后端都做过的体力活：类型推断、命名转换、tag/alias、嵌套结构，全是机械劳动。新上的两件生成器把这一步压缩成"粘贴—复制"，Go 版过了 go vet 和真实 Unmarshal 冒烟，Python 版过了 ast.parse。'
---

## Go 版：类型推断比想象中讲究

JSON 转 Go Struct 的难点不在模板，在**类型决策**：数字要不要拆 int64/float64（要）、数组元素类型混合怎么办（全数字归并 []float64，其他混合退 []interface{}）、时间字符串要不要识别成 time.Time（可选开关，按 ISO 形状正则）、JSON key 的 snake_case 怎么变成可导出的 PascalCase——还有 URL、ID、API 这类缩写要保持大写而不是变成 Url。

{{< tool id="json-to-go-struct" >}}JSON转Go Struct{{< /tool >}}把这些决策全部参数化：json tag 开关、嵌套内联或独立命名类型、时间识别、数组对象字段并集合并（同一数组里不同对象字段不同时，生成并集结构并注释）。生成的代码按 gofmt 风格列对齐，**本批上线前用真实 Go 工具链验证过：go vet 通过、encoding/json Unmarshal 冒烟测试全对**——不是"看起来像"，是真的能跑。

## Python 版：import 精确性和 FastAPI 口径

Pydantic 是 FastAPI 的地基，Model 写得对不对直接影响请求校验。{{< tool id="json-to-pydantic" >}}JSON转 Pydantic{{< /tool >}}生成 v2 风格的 BaseModel：

- **alias 全套**：JSON 键是 camelCase 时生成 `Field(..., alias="userName")` + `populate_by_name=True`，Python 侧用 snake_case；
- **Optional 标注**：值含 null 的字段自动 `Optional[T] = None`；
- **datetime 识别**：ISO 形状字符串可选映射 datetime 类型；
- **嵌套独立模型**：嵌套对象生成独立 class，且被依赖的类排在前面（生成的代码直接可 import）；
- **import 精确性**：没有时间字段就不会出现 `from datetime import datetime`—— import 干净是给同事看的礼貌。

上线前同样做了语法级验证：生成的代码过 `ast.parse`，是合法 Python。

## 四件配置工具顺手打包

同一批还上了两件配置生成器，凑成"开工四件套"：{{< tool id="editorconfig-generator" >}}EditorConfig 生成器{{< /tool >}}（缩进/行尾/字符集的基础纪律，分节规则支持 Makefile 必须 tab 这种特例）和{{< tool id="prettier-config-generator" >}}Prettier 配置生成器{{< /tool >}}（可视化调参，支持"只输出非默认项"的精简模式——团队里 diff 干净的配置才是好配置）。新仓库第一天把这两个文件放进根目录，能省掉 N 次"你那边怎么缩进不对"的对话。

## 常见问题

### 生成的 Go 代码有 no lint 问题吗？

列对齐按 gofmt 风格输出；建议粘进项目后跑一次 gofmt 兜底。生成器负责结构和语义，格式微调交给工具链是正常工作流。

### Pydantic v1 项目能用吗？

不能直接用。生成的是 v2 语法（ConfigDict、Field 的 v2 语义），v1 项目要么升级，要么手动改 `class Config` 风格——v2 是当前主线，不建议新代码再写 v1。

### 我的接口 JSON 很大，生成器扛得住吗？

常见接口文档规模（几百行）毫秒级。数组的对象合并会遍历全部元素取并集，超大数组会稍慢但正确性不受影响。

## 本章配套工具箱

边读边用：以下工具均在浏览器本地运行，数据不上传。

- {{< tool id="json-to-go-struct" >}}JSON转Go Struct{{< /tool >}}：go vet 验证过的类型推断
- {{< tool id="json-to-pydantic" >}}JSON转Pydantic{{< /tool >}}：FastAPI 口径的 v2 BaseModel
- {{< tool id="editorconfig-generator" >}}EditorConfig生成器{{< /tool >}}：缩进纪律的基础设施
- {{< tool id="prettier-config-generator" >}}Prettier配置生成器{{< /tool >}}：精简模式配置输出
- {{< tool id="json-formatter" >}}JSON格式化{{< /tool >}}：粘贴前的第一步
