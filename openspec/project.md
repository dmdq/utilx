# Util.cn - 有条工具 项目上下文

## Purpose
Util.cn 是一个现代化的开发者工具箱，提供80+实用工具，涵盖开发、加密、文本处理、图像处理等多个领域。项目遵循"无广告、纯本地计算、即开即用"的理念，保护用户数据隐私。

## Tech Stack
- **前端框架**: Vue.js 3.5.25 + Nuxt.js 4.2.2
- **样式框架**: Tailwind CSS 3.4.0
- **图标库**: Lucide Vue Next
- **桌面端**: Tauri 2.9.1 (跨平台桌面应用)
- **PWA支持**: @vite-pwa/nuxt
- **打包工具**: Vite 7.2.7
- **包管理**: npm/pnpm

## Project Conventions

### 代码风格
- **语言**: TypeScript + JavaScript
- **组件**: Vue 3 Composition API
- **样式**: Tailwind CSS utility classes
- **文件命名**:
  - 组件文件：PascalCase (例: `AppButton.vue`)
  - 工具文件：kebab-case (例: `utils/helpers.js`)
  - 页面文件：kebab-case (例: `crypto-tools.vue`)

### 架构模式
- **组件化设计**: 可复用的UI组件库 (`src/components/ui/`)
- **页面路由**: Nuxt.js 文件系统路由
- **状态管理**: Vue 3 Composition API + `reactive`
- **工具分类**: 按功能模块组织 (`src/pages/tools/`)

### 目录结构
```
src/
├── components/          # 可复用组件
│   ├── ui/             # UI基础组件库
│   └── [feature]/      # 功能组件
├── pages/              # 页面路由
│   ├── tools/          # 工具页面
│   └── [category]/     # 分类页面
├── utils/              # 工具函数
├── assets/             # 静态资源
└── composables/        # 组合式API
```

### 测试策略
- **组件测试**: Vue Test Utils (计划中)
- **E2E测试**: Playwright (计划中)
- **手动测试**: 开发阶段功能验证
- **性能测试**: Vite 内置性能分析

### Git Workflow
- **主分支**: `main` (生产环境)
- **开发分支**: `develop` (开发环境)
- **功能分支**: `feature/[feature-name]`
- **修复分支**: `fix/[bug-description]`
- **提交格式**: Conventional Commits
  - `feat`: 新功能
  - `fix`: 修复
  - `docs`: 文档
  - `style`: 格式
  - `refactor`: 重构
  - `test`: 测试
  - `chore`: 构建/工具

## Domain Context

### 工具分类
- **编码解码**: Base64, URL, HTML, Unicode, 二进制转换
- **加密安全**: MD5, SHA, AES, RSA, JWT, BCrypt, UUID, HMAC
- **文本处理**: Markdown编辑器, 字符统计, 格式化
- **时间日期**: 时间戳转换, 时区处理, 计算器
- **数据格式**: JSON, YAML, XML, SQL格式化
- **网络工具**: 端口检查, WHOIS查询, URL解析
- **图像处理**: 图片压缩, 格式转换, EXIF读取
- **开发工具**: 正则测试, Hash生成, QR码

### 核心特性
- **本地计算**: 所有处理在浏览器本地完成
- **响应式设计**: 支持桌面和移动设备
- **主题切换**: 深色/浅色主题支持
- **离线使用**: PWA支持，可离线工作
- **无广告**: 干净的使用体验
- **数据隐私**: 不上传用户数据

## Important Constraints

### 技术约束
- **浏览器兼容**: 支持现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+)
- **包体积控制**: 优化初始加载时间
- **性能要求**: 工具响应时间 < 2秒
- **内存限制**: 单个工具内存使用 < 50MB

### 业务约束
- **数据安全**: 禁止用户数据上传到服务器
- **隐私保护**: 不使用用户追踪分析
- **免费使用**: 所有工具永久免费
- **无广告承诺**: 永不添加广告内容

### 合规要求
- **开源协议**: MIT License
- **数据保护**: 符合GDPR要求
- **无障碍**: WCAG 2.1 AA级别 (逐步实现)

## External Dependencies

### 核心依赖
- **Vue生态**: Vue.js, Nuxt.js, VueUse
- **UI样式**: Tailwind CSS, Lucide图标
- **加密库**: crypto-js, jsencrypt
- **文档解析**: marked, jsPDF
- **图像处理**: exifreader, jszip
- **桌面端**: Tauri核心库

### 开发依赖
- **构建工具**: Vite, TypeScript
- **代码质量**: ESLint, Prettier
- **测试工具**: Vitest, Playwright
- **部署工具**: GitHub Actions

### 外部服务
- **CDN**: 静态资源分发
- **域名解析**: DNS服务
- **SSL证书**: 自动证书管理

## 特殊约定

### 组件开发
- 使用自定义UI组件库替代第三方UI框架
- 组件必须有完整的TypeScript类型定义
- 所有组件支持深色模式
- 组件必须有可访问性支持 (aria标签等)

### 工具开发
- 每个工具独立成页，支持直接访问
- 工具间可以共享基础组件和工具函数
- 工具界面保持一致的交互模式
- 支持键盘快捷操作

### 性能优化
- 按需加载第三方库
- 优化打包体积和加载时间
- 使用Web Workers处理重计算任务
- 实现虚拟滚动处理大量数据

### 安全要求
- 所有用户输入必须进行验证和清理
- 防止XSS和CSRF攻击
- 使用Content Security Policy
- 定期更新依赖库安全版本