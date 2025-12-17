# Spine动画编辑器使用指南

## ✅ 环境要求已满足

项目已安装以下必要依赖：
- ✅ `pixi.js@latest` - WebGL渲染引擎
- ✅ `@esotericsoftware/spine-webgl@latest` - Spine官方运行时

## 🚀 快速开始

### 1. 准备Spine文件
你需要准备以下类型的文件：

```
必需文件：
├── character.spine      # 或 character.json / character.skel
├── character.atlas       # 图集文件（推荐）
└── character.png         # 纹理文件

或者：
├── skeleton.json         # JSON格式的骨架数据
├── skeleton.atlas        # 图集文件
└── part1.png, part2.png # 多个纹理文件
```

### 2. 导入文件
1. 访问 `/tools/spine-animation-editor/`
2. 将文件拖拽到左侧面板，或点击导入按钮
3. 系统会自动识别文件类型并加载

### 3. 使用功能
- **动画控制**: 播放/暂停/停止/速度调节
- **视图控制**: 缩放/网格/背景色
- **皮肤切换**: 选择不同皮肤预览
- **导出功能**: 导出为各引擎配置

## 🔍 故障排除

### 问题1: 看到黑色背景
**可能原因**:
- 浏览器不支持WebGL
- Spine文件格式不正确
- 纹理文件路径不匹配

**解决方案**:
1. 打开浏览器控制台查看错误信息
2. 确保使用正确的Spine导出文件
3. 检查.atlas文件中的图片路径是否正确

### 问题2: 加载失败
**查看控制台日志**:
```javascript
// 正常加载日志示例:
Pixi.js初始化成功
开始加载Spine动画数据...
找到 4 个动画, 2 个皮肤
Spine动画加载成功
开始播放动画: idle
```

**错误日志示例**:
```javascript
// 纹理文件未找到
纹理文件未找到: character.png

// 文件格式错误
Spine动画加载失败: JSON.parse: unexpected character
```

### 问题3: 依赖问题
运行以下命令重新安装依赖：
```bash
npm install pixi.js @esotericsoftware/spine-webgl
```

## 📁 文件格式说明

### Spine文件格式
- **.spine**: 二进制格式的骨架数据（推荐）
- **.json**: JSON格式的骨架数据
- **.skel**: 二进制格式的骨架数据

### 图集文件 (.atlas)
```
character.png
size: 512,512
format: RGBA8888
filter: Linear,Linear
repeat: none
head
  rotate: false
  xy: 2, 2
  size: 100, 100
  orig: 100, 100
  offset: 0, 0
  index: -1
```

### 纹理文件
- 支持 PNG、JPG、JPEG 格式
- 文件名必须与.atlas文件中的路径一致
- 建议使用PNG格式以支持透明度

## 🎮 支持的Spine版本

编辑器支持大部分Spine版本：
- ✅ Spine 3.8.x
- ✅ Spine 4.0.x
- ✅ Spine 4.1.x
- ✅ Spine 4.2.x

如果遇到版本兼容性问题，请尝试从Spine编辑器重新导出为JSON格式。

## 🛠️ 高级功能

### 自定义背景
在右侧属性面板中可以：
- 选择背景颜色
- 使用预设颜色
- 切换网格显示

### 多引擎导出
- **Cocos Creator**: 导出cocos配置文件
- **Godot**: 导出godot配置文件
- **通用**: 导出JSON配置文件

### 性能优化
- 使用WebGL硬件加速
- 支持高DPI显示器
- 自动内存管理

## 📞 技术支持

如果遇到问题，请：
1. 查看浏览器控制台日志
2. 检查文件格式和路径
3. 尝试使用不同的Spine导出格式
4. 提供错误信息和相关文件以便调试

## 🔗 相关链接

- [Spine官方文档](https://esotericsoftware.com/spine-documentation)
- [Pixi.js官方文档](https://pixijs.io/)
- [WebGL支持检测](test.html)