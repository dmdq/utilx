# OpenSpec AI 助手使用指南

为 AI 编码助手使用 OpenSpec 进行规范驱动开发的指导文档。

## TL;DR 快速检查清单

- **搜索现有工作**: `openspec spec list --long`, `openspec list` (仅全文搜索时使用 `rg`)
- **确定范围**: 新功能 vs 修改现有功能
- **选择唯一的 `change-id`**: kebab-case 格式，动词引导 (`add-`, `update-`, `remove-`, `refactor-`)
- **构建文档**: `proposal.md`, `tasks.md`, `design.md` (仅需要时)，以及每个受影响功能的增量规格
- **编写增量**: 使用 `## ADDED|MODIFIED|REMOVED|RENAMED Requirements`；每个需求至少包含一个 `#### Scenario:`
- **验证**: `openspec validate [change-id] --strict` 并修复问题
- **请求批准**: 在提案批准前不要开始实施

## 三阶段工作流程

### 阶段一：创建变更

在以下情况下创建提案：
- **添加功能或特性**
- **进行破坏性更改** (API、架构)
- **更改架构或模式**
- **性能优化** (改变行为)
- **更新安全模式**

**触发词示例：**
- "帮我创建变更提案"
- "帮我规划变更"
- "帮我创建提案"
- "我想创建规格提案"
- "我想创建规格"

**模糊匹配指导：**
- 包含以下之一: `proposal`, `change`, `spec`
- 结合以下之一: `create`, `plan`, `make`, `start`, `help`

**跳过提案的情况：**
- **错误修复** (恢复预期行为)
- **拼写错误、格式、注释**
- **依赖更新** (非破坏性)
- **配置更改**
- **现有行为的测试**

**工作流程**
1. **审查上下文**: 查看 `openspec/project.md`, `openspec list` 和 `openspec list --specs` 了解当前状态
2. **选择唯一 ID**: 选择动词引导的 `change-id` 并在 `openspec/changes/<id>/` 下构建 `proposal.md`, `tasks.md`, 可选的 `design.md` 和规格增量
3. **编写增量规格**: 使用 `## ADDED|MODIFIED|REMOVED Requirements` 并为每个需求至少包含一个 `#### Scenario:`
4. **验证提案**: 运行 `openspec validate <id> --strict` 并在分享前解决问题

### 阶段二：实施变更

按顺序完成这些任务并将其标记为 TODO。

1. **阅读 proposal.md** - 理解要构建的内容
2. **阅读 design.md** (如果存在) - 审查技术决策
3. **阅读 tasks.md** - 获取实施清单
4. **按序实施任务** - 按顺序完成
5. **确认完成** - 在更新状态前确保 `tasks.md` 中的每个项目都已完成
6. **更新清单** - 所有工作完成后，将每个任务设置为 `- [x]` 使清单反映实际情况
7. **批准关口** - 在提案审查和批准前不要开始实施

### 阶段三：归档变更

部署后，创建单独的 PR 来：
- 移动 `changes/[name]/` → `changes/archive/YYYY-MM-DD-[name]/`
- 如果功能发生变化，更新 `specs/`
- 对于仅工具更改，使用 `openspec archive <change-id> --skip-specs --yes` (始终明确传递 change ID)
- 运行 `openspec validate --strict` 确认归档的变更通过检查

## 任何任务前的准备

**上下文检查清单：**
- [ ] 阅读 `specs/[capability]/spec.md` 中的相关规格
- [ ] 检查 `changes/` 中的待处理变更是否存在冲突
- [ ] 阅读 `openspec/project.md` 了解约定
- [ ] 运行 `openspec list` 查看活跃变更
- [ ] 运行 `openspec list --specs` 查看现有功能

**创建规格前：**
- 始终检查功能是否已存在
- 优先修改现有规格而非创建重复项
- 使用 `openspec show [spec]` 审查当前状态
- 如果请求不明确，在构建前询问 1-2 个澄清问题

### 搜索指导
- **枚举规格**: `openspec spec list --long` (或 `--json` 用于脚本)
- **枚举变更**: `openspec list` (或 `openspec change list --json` - 已弃用但仍可用)
- **显示详情**:
  - 规格: `openspec show <spec-id> --type spec` (使用 `--json` 进行过滤)
  - 变更: `openspec show <change-id> --json --deltas-only`
- **全文搜索** (使用 ripgrep): `rg -n "Requirement:|Scenario:" openspec/specs`

## 快速开始

### CLI 命令

```bash
# 基本命令
openspec list                  # 列出活跃变更
openspec list --specs          # 列出规格
openspec show [item]           # 显示变更或规格
openspec validate [item]       # 验证变更或规格
openspec archive <change-id> [--yes|-y]   # 部署后归档 (添加 --yes 用于非交互运行)

# 项目管理
openspec init [path]           # 初始化 OpenSpec
openspec update [path]         # 更新指导文件

# 交互模式
openspec show                  # 提示选择
openspec validate              # 批量验证模式

# 调试
openspec show [change] --json --deltas-only
openspec validate [change] --strict
```

### 命令标志

- `--json` - 机器可读输出
- `--type change|spec` - 区分项目类型
- `--strict` - 全面验证
- `--no-interactive` - 禁用提示
- `--skip-specs` - 归档时不更新规格
- `--yes`/`-y` - 跳过确认提示 (非交互式归档)

## 目录结构

```
openspec/
├── project.md              # 项目约定
├── specs/                  # 当前真实状态 - 已构建的内容
│   └── [capability]/       # 单一专注的功能
│       ├── spec.md         # 需求和场景
│       └── design.md       # 技术模式
├── changes/                # 提案 - 应该更改的内容
│   ├── [change-name]/
│   │   ├── proposal.md     # 为什么、什么、影响
│   │   ├── tasks.md        # 实施清单
│   │   ├── design.md       # 技术决策 (可选; 参见标准)
│   │   └── specs/          # 增量更改
│   │       └── [capability]/
│   │           └── spec.md # ADDED/MODIFIED/REMOVED
│   └── archive/            # 已完成的变更
```

## 创建变更提案

### 决策树

```
收到新请求?
├─ 修复恢复规格行为的错误? → 直接修复
├─ 拼写错误/格式/注释? → 直接修复
├─ 新功能/能力? → 创建提案
├─ 破坏性更改? → 创建提案
├─ 架构更改? → 创建提案
└─ 不清楚? → 创建提案 (更安全)
```

### 提案结构

1. **创建目录**: `changes/[change-id]/` (kebab-case, 动词引导, 唯一)

2. **编写 proposal.md:**
```markdown
# 变更: [变更的简要描述]

## 为什么
[1-2 句话说明问题/机会]

## 什么更改
- [变更列表]
- [用 **BREAKING** 标记破坏性更改]

## 影响
- 受影响的规格: [功能列表]
- 受影响的代码: [关键文件/系统]
```

3. **创建规格增量**: `specs/[capability]/spec.md`
```markdown
## ADDED Requirements
### Requirement: 新功能
系统 SHALL 提供...

#### Scenario: 成功案例
- **WHEN** 用户执行操作
- **THEN** 预期结果

## MODIFIED Requirements
### Requirement: 现有功能
[完整的修改后需求]

## REMOVED Requirements
### Requirement: 旧行功能
**原因**: [为什么删除]
**迁移**: [如何处理]
```
如果多个功能受影响，在 `changes/[change-id]/specs/<capability>/spec.md` 下创建多个增量文件—每个功能一个。

4. **创建 tasks.md:**
```markdown
## 1. 实施
- [ ] 1.1 创建数据库架构
- [ ] 1.2 实施 API 端点
- [ ] 1.3 添加前端组件
- [ ] 1.4 编写测试
```

5. **需要时创建 design.md:**
如果适用以下任何情况，创建 `design.md`；否则省略：
- 跨领域变更 (多个服务/模块) 或新架构模式
- 新外部依赖或重要数据模型更改
- 安全性、性能或迁移复杂性
- 编码前从技术决策中受益的模糊性

最小 `design.md` 框架:
```markdown
## 上下文
[背景、约束、利益相关者]

## 目标 / 非目标
- 目标: [...]
- 非目标: [...]

## 决策
- 决策: [什么和为什么]
- 考虑的替代方案: [选项 + 理由]

## 风险 / 权衡
- [风险] → 缓解措施

## 迁移计划
[步骤、回滚]

## 未决问题
- [...]
```

## 规格文件格式

### 关键：场景格式化

**正确** (使用 #### 标题):
```markdown
#### Scenario: 用户登录成功
- **WHEN** 提供有效凭据
- **THEN** 返回 JWT 令牌
```

**错误** (不要使用项目符号或粗体):
```markdown
- **Scenario: 用户登录**  ❌
**Scenario**: 用户登录     ❌
### Scenario: 用户登录      ❌
```

每个需求必须至少有一个场景。

### 需求措辞
- 对规范性要求使用 SHALL/MUST (避免 should/may，除非故意非规范性)

### 增量操作

- `## ADDED Requirements` - 新能力
- `## MODIFIED Requirements` - 更改行为
- `## REMOVED Requirements` - 弃用功能
- `## RENAMED Requirements` - 名称更改

标题匹配 `trim(header)` - 忽略空白。

#### 何时使用 ADDED vs MODIFIED
- **ADDED**: 引入能够独立作为需求存在的新功能或子功能。当更改是正交的（例如，添加"斜杠命令配置"）而不是更改现有需求语义时，优先使用 ADDED。
- **MODIFIED**: 更改现有需求的行为、范围或验收标准。始终粘贴完整的更新需求内容（标题 + 所有场景）。归档器将用您提供的内容替换整个需求；部分增量将在归档时丢失详细信息。

使用 MODIFIED 需求的正确方法：
1) 在 `openspec/specs/<capability>/spec.md` 中定位现有需求
2) 复制整个需求块 (从 `### Requirement: ...` 到其场景)
3) 将其粘贴在 `## MODIFIED Requirements` 下并编辑以反映新行为
4) 确保标题文本完全匹配 (空白不敏感) 并至少保留一个 `#### Scenario:`

RENAMED 示例：
```markdown
## RENAMED Requirements
- FROM: `### Requirement: Login`
- TO: `### Requirement: User Authentication`
```

## 故障排除

### 常见错误

**"变更必须至少有一个增量"**
- 检查 `changes/[name]/specs/` 存在且包含 .md 文件
- 验证文件有操作前缀 (## ADDED Requirements)

**"需求必须至少有一个场景"**
- 检查场景使用 `#### Scenario:` 格式 (4 个 # 号)
- 不要使用项目符号或粗体作为场景标题

**场景解析静默失败**
- 需要精确格式: `#### Scenario: 名称`
- 调试使用: `openspec show [change] --json --deltas-only`

### 验证提示

```bash
# 始终使用严格模式进行全面检查
openspec validate [change] --strict

# 调试增量解析
openspec show [change] --json | jq '.deltas'

# 检查特定需求
openspec show [spec] --json -r 1
```

## 快乐路径脚本

```bash
# 1) 探索当前状态
openspec spec list --long
openspec list
# 可选全文搜索:
# rg -n "Requirement:|Scenario:" openspec/specs
# rg -n "^#|Requirement:" openspec/changes

# 2) 选择 change id 并构建
CHANGE=add-two-factor-auth
mkdir -p openspec/changes/$CHANGE/{specs/auth}
printf "## 为什么\n...\n\n## 什么更改\n- ...\n\n## 影响\n- ...\n" > openspec/changes/$CHANGE/proposal.md
printf "## 1. 实施\n- [ ] 1.1 ...\n" > openspec/changes/$CHANGE/tasks.md

# 3) 添加增量 (示例)
cat > openspec/changes/$CHANGE/specs/auth/spec.md << 'EOF'
## ADDED Requirements
### Requirement: 双因素认证
用户必须在登录期间提供第二个因素。

#### Scenario: 需要 OTP
- **WHEN** 提供有效凭据时
- **THEN** 需要 OTP 挑战
EOF

# 4) 验证
openspec validate $CHANGE --strict
```

## 多功能示例

```
openspec/changes/add-2fa-notify/
├── proposal.md
├── tasks.md
└── specs/
    ├── auth/
    │   └── spec.md   # ADDED: 双因素认证
    └── notifications/
        └── spec.md   # ADDED: OTP 邮件通知
```

auth/spec.md
```markdown
## ADDED Requirements
### Requirement: 双因素认证
...
```

notifications/spec.md
```markdown
## ADDED Requirements
### Requirement: OTP 邮件通知
...
```

## 最佳实践

### 简约优先
- 默认到 <100 行新代码
- 单文件实现直到证明不足
- 没有明确理由避免框架
- 选择无聊、已证明的模式

### 复杂性触发器
仅在以下情况下添加复杂性：
- 性能数据显示当前解决方案太慢
- 具体规模要求 (>1000 用户, >100MB 数据)
- 多个已证实用例需要抽象

### 清晰引用
- 使用 `file.ts:42` 格式表示代码位置
- 将规格引用为 `specs/auth/spec.md`
- 链接相关变更和 PR

### 功能命名
- 使用动词-名词: `user-auth`, `payment-capture`
- 每个功能单一用途
- 10 分钟可理解性规则
- 如果描述需要 "AND" 则拆分

### 变更 ID 命名
- 使用 kebab-case，简短描述: `add-two-factor-auth`
- 优先使用动词引导前缀: `add-`, `update-`, `remove-`, `refactor-`
- 确保唯一性；如果被占用，附加 `-2`, `-3` 等

## 工具选择指南

| 任务 | 工具 | 为什么 |
|------|------|-----|
| 按模式查找文件 | Glob | 快速模式匹配 |
| 搜索代码内容 | Grep | 优化的正则搜索 |
| 读取特定文件 | Read | 直接文件访问 |
| 探索未知范围 | Task | 多步调查 |

## 错误恢复

### 变更冲突
1. 运行 `openspec list` 查看活跃变更
2. 检查重叠规格
3. 与变更所有者协调
4. 考虑合并提案

### 验证失败
1. 使用 `--strict` 标志运行
2. 检查 JSON 输出获取详情
3. 验证规格文件格式
4. 确保场景格式正确

### 缺失上下文
1. 首先阅读 project.md
2. 检查相关规格
3. 审查最近的归档
4. 请求澄清

## 快速参考

### 阶段指示器
- `changes/` - 已提议，尚未构建
- `specs/` - 已构建并部署
- `archive/` - 已完成的变更

### 文件用途
- `proposal.md` - 为什么和什么
- `tasks.md` - 实施步骤
- `design.md` - 技术决策
- `spec.md` - 需求和行为

### CLI 要点
```bash
openspec list              # 进行中有什么？
openspec show [item]       # 查看详情
openspec validate --strict # 是否正确？
openspec archive <change-id> [--yes|-y]  # 标记完成 (自动化时添加 --yes)
```

**记住：规格是真实状态。变更是提案。保持它们同步。**

---

## Util.cn 项目特定指南

### 项目触发词 (中文)

**Util.cn 项目特定的触发模式：**
- "添加新工具到 Util.cn"
- "修复工具页面路由问题"
- "优化 Nuxt 4 配置"
- "修复首页 404 错误"
- "添加 Vue 组件"
- "更新 Tailwind 配置"
- "修改工具分类"
- "优化性能问题"

**工具选择指南 - Util.cn 特定：**

| 任务 | 推荐工具 | 文件位置 | 说明 |
|------|----------|----------|------|
| Nuxt 配置问题 | 编辑 nuxt.config.ts | 项目根目录 | 核心配置文件 |
| 路由问题 | 检查 src/pages/ | src/pages/ | Nuxt 页面目录 |
| 组件开发 | src/components/ui/ | src/components/ui/ | UI组件库 |
| 工具功能 | src/pages/tools/ | src/pages/tools/ | 工具页面 |
| 数据管理 | src/data/ | src/data/ | 工具数据文件 |
| 样式问题 | src/assets/css/ | src/assets/css/ | 样式文件 |
| 工具函数 | src/utils/ | src/utils/ | 工具函数库 |
| 组合式 API | src/composables/ | src/composables/ | Vue 组合式API |

### 项目约束提醒

**在创建变更时始终考虑：**
- ✅ **本地计算原则**: 所有处理在浏览器本地完成
- ✅ **无广告承诺**: 永不添加广告内容
- ✅ **数据隐私**: 不上传用户数据到服务器
- ✅ **性能要求**: 工具响应时间 < 2秒
- ✅ **内存限制**: 单个工具内存使用 < 50MB
- ✅ **浏览器兼容**: 支持现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+)

**开发约定：**
- 使用 TypeScript + Vue 3 Composition API
- 遵循 Tailwind CSS 工具类模式
- 组件命名使用 PascalCase
- 工具文件命名使用 kebab-case
- 所有组件支持深色模式
- 必须有可访问性支持

### 常见 Util.cn 变更类型

**添加新工具：**
```markdown
# 变更: add-[tool-name]-tool

## 什么更改
- 添加新的 [工具名称] 工具页面
- 实现核心功能逻辑
- 添加到相应工具分类

## 影响
- 受影响的规格: tool-details, tool-categories
- 受影响的代码: src/pages/tools/, src/data/tools.js
```

**修复路由问题：**
```markdown
# 变更: fix-[issue]-routing

## 为什么
- 当前页面出现 404 错误
- Vue Router 无法正确解析路径

## 什么更改
- 修复 Nuxt 4 配置问题
- 更新路径别名设置
- 确保页面正确扫描

## 影响
- 受影响的规格: app-core
- 受影响的代码: nuxt.config.ts
```

**性能优化：**
```markdown
# 变更: optimize-[component]-performance

## 为什么
- 当前加载时间超过 2 秒阈值
- 用户反馈响应慢

## 什么更改
- 实现代码分割
- 优化组件渲染
- 添加加载状态

## 影响
- 受影响的规格: ui-components
- 受影响的代码: src/components/
```

### CLI 命令 - Util.cn 示例

```bash
# 查看项目当前状态
openspec spec list --long
openspec list --specs

# 创建新工具提案
CHANGE=add-pdf-merger-tool
mkdir -p openspec/changes/$CHANGE/{specs/tool-details}
# ... 创建提案文件

# 验证提案
openspec validate $CHANGE --strict

# 实施完成后归档
openspec archive $CHANGE --yes
```

记住：Util.cn 始终保持"无广告、本地计算、即开即用"的核心价值观！