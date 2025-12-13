# Util - Apple Silicon macOS 打包指南

## 📦 概述

本指南介绍如何为 Apple Silicon (M1/M2/M3) macOS 打包 Util 应用，支持通用二进制（Universal Binary），同时兼容 Intel 和 Apple Silicon 架构。

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装所有必需的依赖
./scripts/install-dependencies.sh
```

### 2. 构建应用

```bash
# 完整构建（包括前端和 Tauri）
./scripts/build-apple-silicon.sh

# 或者分步构建
./scripts/build-apple-silicon.sh frontend  # 仅构建前端
./scripts/build-apple-silicon.sh tauri     # 仅构建 Tauri
./scripts/build-apple-silicon.sh dmg       # 仅创建 DMG
```

### 3. 代码签名（可选）

```bash
# 设置环境变量
export CODESIGN_IDENTITY="Developer ID Application: Your Name"

# 运行构建和签名
./scripts/build-apple-silicon.sh
```

### 4. 公证（可选，需要 Apple 开发者账户）

```bash
# 设置环境变量
export APPLE_ID="your@apple.id"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="your-team-id"

# 运行公证
./scripts/notarize-app.sh
```

## 📁 文件结构

```
util/
├── scripts/
│   ├── build-apple-silicon.sh    # 主打包脚本
│   ├── notarize-app.sh           # 公证脚本
│   ├── install-dependencies.sh   # 依赖安装脚本
│   └── create-dmg-config.json    # DMG 配置
├── src-tauri/
│   ├── tauri.conf.json           # Tauri 配置
│   ├── entitlements.plist        # macOS 权限配置
│   └── icons/                    # 应用图标
├── dist/                         # 构建输出目录
│   ├── Util.app                  # 应用程序
│   └── Util-1.0.0-universal.dmg # DMG 安装包
└── .output/public/               # 前端构建输出
```

## ⚙️ 配置说明

### Tauri 配置 (tauri.conf.json)

- **minimumSystemVersion**: "11.0" - 最低支持 macOS Big Sur
- **hardenedRuntime**: true - 启用硬运行时
- **entitlements**: "entitlements.plist" - 权限配置文件

### 权限配置 (entitlements.plist)

包含以下权限：
- JIT 编译支持（用于 JavaScript）
- 网络客户端访问
- 文件读写权限
- Apple Events 支持

### 环境变量

#### 代码签名
```bash
export CODESIGN_IDENTITY="Developer ID Application: Your Name"
```

#### 公证
```bash
export APPLE_ID="your@apple.id"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="ABCD123456"
```

## 🔧 构建选项

### 支持的架构

- **aarch64-apple-darwin**: Apple Silicon (M1/M2/M3)
- **x86_64-apple-darwin**: Intel
- **universal-apple-darwin**: 通用二进制（推荐）

### 构建目标

- **app**: macOS 应用程序 (.app)
- **dmg**: 磁盘映像安装包

### 前端构建

脚本会自动检测是否已有前端构建：
- 如果存在 `.output/public`，则跳过前端构建
- 否则会运行 `npm run generate` 或 `pnpm run generate`

## 📋 构建步骤详解

### 1. 依赖检查

- Rust 和 Cargo
- 目标平台 (aarch64-apple-darwin, x86_64-apple-darwin)
- Node.js 和包管理器

### 2. 清理和准备

- 清理旧的构建文件
- 创建输出目录

### 3. 前端构建

- 生成静态文件到 `.output/public`
- 用于 Tauri 的 `frontendDist` 配置

### 4. Tauri 构建

- 分别构建 arm64 和 x86_64 版本
- 使用 `lipo` 合并通用二进制

### 5. 代码签名

- 使用开发者证书签名
- 验证签名有效性

### 6. DMG 创建

- 使用 create-dmg 或 hdiutil
- 包含应用程序和 Applications 快捷方式

### 7. 公证（可选）

- 上传到 Apple 公证服务
- 等待处理完成
- 装订公证票据

## 🎯 最佳实践

### 1. 版本管理

更新 `tauri.conf.json` 中的版本号：
```json
{
  "version": "1.0.1",
  "bundle": {
    "macOS": {
      "infoPlist": {
        "CFBundleVersion": "1.0.1",
        "CFBundleShortVersionString": "1.0.1"
      }
    }
  }
}
```

### 2. 代码签名

- 使用有效的开发者证书
- 保持证书最新
- 测试签名后的应用

### 3. 公证

- 分发前进行公证
- 使用 App 专用密码（不是 Apple ID 密码）
- 保存公证请求 UUID 用于跟踪

### 4. 测试

- 在不同 macOS 版本上测试
- 测试 Intel 和 Apple Silicon
- 验证安装和卸载流程

## 🚨 常见问题

### Q: 构建失败，提示找不到目标平台
A: 运行 `rustup target add aarch64-apple-darwin x86_64-apple-darwin`

### Q: 代码签名失败
A: 检查证书是否有效，确保证书名称正确

### Q: 公证失败
A: 确认 Apple 开发者账户状态，检查 App 专用密码

### Q: 应用启动失败
A: 检查 entitlements.plist 配置，确认权限设置正确

### Q: DMG 创建失败
A: 确保有足够的磁盘空间，检查图标文件是否存在

## 📚 参考资源

- [Tauri 官方文档](https://tauri.app/)
- [Apple 代码签名指南](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Apple 公证服务](https://developer.apple.com/forums/tags/notarization)
- [macOS 权限配置](https://developer.apple.com/documentation/bundleresources/entitlements)

## 🆘 获取帮助

如果遇到问题，可以：

1. 检查构建脚本的帮助信息：
   ```bash
   ./scripts/build-apple-silicon.sh help
   ./scripts/notarize-app.sh help
   ```

2. 查看详细的构建输出
3. 检查 Apple 开发者控制台
4. 参考 Tauri 官方文档和社区

---

**注意**: 代码签名和公证需要 Apple 开发者账户（99 美元/年）。如果不签名，应用仍可运行，但用户需要手动允许运行。