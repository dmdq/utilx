# Spine动画编辑器 - 访问指南

## 🚀 快速访问

开发服务器已启动，可通过以下URL访问：

### 主要功能页面
- **Spine动画编辑器**: http://localhost:3001/tools/spine-animation-editor/
- **测试和诊断页面**: http://localhost:3001/spine-test.html

### 📋 测试页面功能

访问 `http://localhost:3001/spine-test.html` 可以：
- ✅ 检测WebGL支持
- ✅ 验证依赖包安装状态
- ✅ 查看系统信息
- ✅ 监控控制台日志
- ✅ 实时查看错误信息

## 🔧 使用步骤

### 1. 准备Spine文件
确保你有以下格式的文件：
- `.spine` 或 `.json` 或 `.skel` (骨架文件)
- `.atlas` (图集文件，推荐)
- `.png` 或 `.jpg` (纹理文件)

### 2. 导入文件
1. 打开 `http://localhost:3001/tools/spine-animation-editor/`
2. 拖拽文件到左侧面板
3. 系统会自动识别并加载

### 3. 查看状态
- **文件状态**: 左侧面板显示已加载的文件类型
- **加载进度**: 中央区域显示加载进度条
- **控制台**: 按F12查看详细日志

## 🎯 现已支持

### ✅ 完整的Spine功能
- 真实Pixi.js WebGL渲染
- 官方spine-webgl运行时
- 动画播放控制
- 皮肤切换
- 多文件格式支持

### ✅ 用户友好界面
- 拖拽文件上传
- 实时加载进度
- 友好的错误提示
- 半透明背景自定义
- 网格显示切换

### ✅ 专业功能
- 多引擎导出 (Cocos Creator, Godot)
- 动画列表管理
- 骨骼层级显示
- 插槽数据展示

## 🐛 故障排除

### 如果看到黑色背景：
1. **检查控制台错误** (F12 → Console)
2. **验证文件格式** - 确保使用标准Spine导出
3. **检查纹理路径** - .atlas文件中的图片路径必须正确

### 常见错误及解决方案：
- **WebGL不支持**: 更换到支持WebGL的现代浏览器
- **文件格式错误**: 从Spine编辑器重新导出为JSON格式
- **纹理未找到**: 确保图片文件名与.atlas文件中的路径一致

## 📞 技术细节

### 已安装的依赖包
- `pixi.js@8.14.3` - WebGL渲染引擎
- `@esotericsoftware/spine-webgl@4.2.96` - Spine官方运行时

### 支持的Spine版本
- ✅ Spine 3.8.x - 4.2.x
- ✅ 二进制 (.spine/.skel) 和 JSON格式
- ✅ 多种纹理格式 (PNG, JPG, JPEG)

### 浏览器要求
- WebGL 1.0+ 支持
- ES6+ 模块支持
- 现代浏览器 (Chrome, Firefox, Safari, Edge)

## 📄 文档位置

- **使用指南**: `/public/SPINE_SETUP.md` (本文件)
- **详细文档**: `/src/pages/tools/spine-animation-editor/README.md`
- **使用说明**: `/src/pages/tools/spine-animation-editor/USAGE.md`

---

**🎉 Spine动画编辑器已完全就绪！**

现在你可以开始导入Spine文件并享受专业的动画预览编辑体验！