# Util.cn - 开发者工具箱 | Developer Toolbox

<div align="center">
  <img src="public/favicon.ico" alt="Util.cn Logo" width="80">

  [![Vue.js](https://img.shields.io/badge/Vue.js-3.5.25-green)](https://vuejs.org/)
  [![Nuxt.js](https://img.shields.io/badge/Nuxt.js-3.20.2-blue)](https://nuxt.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.0-38B2AC)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
  [![GitHub stars](https://img.shields.io/github/stars/dmdq/utilx?style=social)](https://github.com/dmdq/utilx/stargazers)
  [![GitHub forks](https://img.shields.io/github/forks/dmdq/utilx?style=social)](https://github.com/dmdq/utilx/network)
  [![GitHub issues](https://img.shields.io/github/issues/dmdq/utilx)](https://github.com/dmdq/utilx/issues)

  **🚀 现代化的开发者工具箱，无广告 · 纯本地计算 · 即开即用**

  **中文文档** | [English Documentation](README.en.md)
</div>

---

<img src="public/snapshot.png" alt="Util.cn Snapshot" width="640">


## ✨ 特性

- 🎯 **80+ 实用工具** - 涵盖开发、加密、文本处理、图像处理等多个领域
- 🌙 **深色/浅色主题** - 支持主题切换，保护你的眼睛
- 📱 **响应式设计** - 完美适配桌面和移动设备
- ⚡ **纯前端计算** - 所有计算都在浏览器本地完成，保护数据隐私
- 🚫 **完全无广告** - 干净的使用体验，专注于工具本身
- 🎨 **现代UI设计** - 基于 Tailwind CSS 的精美界面
- 📁 **文件处理** - 支持拖拽上传文件处理
- 💾 **本地存储** - 收藏夹和最近使用记录自动保存

## 🛠️ 工具分类

### 📊 数据格式化
- JSON 格式化、压缩、转YAML/XML/CSV
- SQL 格式化美化
- XML 格式化
- YAML 格式化
- Markdown 编辑器

### 🔐 编码解码
- Base64 编码/解码/图片转Base64
- URL 编码/解码
- HTML 编码/解码
- Unicode 编码转换
- 二进制/十六进制转换

### 🔒 加密安全
- MD5/SHA 哈希生成
- AES 加密/解密
- RSA 加密/解密/密钥生成
- JWT 解析/验证
- BCrypt 密码生成/验证
- UUID 生成
- HMAC 生成器

### ⏰ 时间日期
- Unix 时间戳转换
- 时区转换
- 日期计算器
- Cron 表达式生成/解析
- 倒计时器
- 秒表

### 📝 文本处理
- 正则表达式测试/生成/速查
- 文本对比
- 大小写转换
- 文本替换/计数
- 摩斯电码
- Lorem Ipsum 生成

### 🌐 网络工具
- HTTP 客户端
- IP 地址查询
- DNS 查询
- User Agent 解析
- 端口检查
- SSL 证书检查
- WebSocket 测试

### 🖼️ 图像处理
- 图片压缩/转换/裁剪/合并
- 水印添加
- EXIF 信息查看
- ICO 图标生成

### 👨‍💻 开发辅助
- API 文档生成
- Mock 数据生成
- SQL 模型生成
- XML 模型生成
- 代码格式化
- Git/Linux/Docker 命令生成

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm 或 yarn 或 pnpm

### 安装
```bash
# 克隆项目
git clone https://github.com/dmdq/utilx.git

# 进入项目目录
cd utilx

# 安装依赖
npm install
# 或
yarn install
# 或
pnpm install
```

### 开发
```bash
# 启动开发服务器
npm run dev
# 或
yarn dev
# 或
pnpm dev

# 访问 http://localhost:3000
```

### 构建
```bash
# 构建生产版本
npm run build
# 或
yarn build
# 或
pnpm build

# 启动生产服务器
npm run start
# 或
yarn start
# 或
pnpm start
```

### 静态生成
```bash
# 生成静态网站
npm run generate
# 或
yarn generate
# 或
pnpm generate
```

## 📁 项目结构

```
utilx/
├── src/                    # 源代码
│   ├── assets/            # 静态资源
│   ├── components/        # Vue 组件
│   │   ├── Breadcrumb.vue # 面包屑导航
│   │   ├── Footer.vue     # 页脚组件
│   │   ├── Sidebar.vue    # 侧边栏
│   │   └── ...
│   ├── composables/       # Vue 组合式函数
│   ├── data/             # 数据文件
│   │   ├── categories.js  # 工具分类
│   │   └── tools.js       # 工具定义
│   ├── layouts/          # 布局组件
│   ├── pages/            # 页面组件
│   └── plugins/          # 插件
├── public/               # 公共资源
├── app.vue              # 根组件
└── nuxt.config.ts       # Nuxt 配置
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 📝 添加新工具

我们欢迎新工具的贡献！请参考以下步骤：

1. 在 `src/data/tools.js` 中添加新工具定义
2. 在 `src/pages/tools/` 目录下创建工具页面
3. 更新 `src/data/categories.js` 如需要新分类
4. 提交 Pull Request

## 🌟 致谢

感谢以下开源项目：
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Nuxt.js](https://nuxt.com/) - Vue 应用框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Lucide](https://lucide.dev/) - 精美的图标库
- [CryptoJS](https://cryptojs.gitbook.io/) - JavaScript 加密库

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 📧 联系方式

- 📧 邮箱：skyin.lewis@gmail.com
- 🐛 问题反馈：[GitHub Issues](https://github.com/dmdq/utilx/issues)
- 💬 功能建议：[GitHub Discussions](https://github.com/dmdq/utilx/discussions)

---

<div align="center">
  由 Util.cn 团队用 ❤️ 制作

  [⭐ 如果这个项目对你有帮助，请给我们一个 Star！](https://github.com/dmdq/utilx)
</div>