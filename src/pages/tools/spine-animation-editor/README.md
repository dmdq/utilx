# Spine动画编辑器集成指南

## 项目概述

这是一个基于Web的Spine动画预览和编辑工具，专门为美术人员、策划人员和前端开发人员设计。支持在线编辑Spine动画，并可导出为Cocos Creator和Godot引擎使用的配置。

## 技术栈

- **前端框架**: Vue 3 + TypeScript + Composition API
- **构建工具**: Vite
- **动画渲染**: Spine Player (官方Web播放器)
- **Spine解析**: spine-player官方运行时

## 依赖安装

### 1. 安装Spine Player

```bash
npm install @esotericsoftware/spine-player
# 或者
yarn add @esotericsoftware/spine-player
```

### 2. 引入Spine Player CSS

在项目中引入Spine Player的CSS文件：
```html
<link rel="stylesheet" href="/spine-player/spine-player.css">
```

## 核心功能集成

### 1. Spine Player初始化

在页面中初始化Spine Player：

```typescript
// src/composables/useSpineRuntime.ts
import { spine } from '@esotericsoftware/spine-player'

export function useSpineRuntime() {
  let spinePlayer = null

  const initSpinePlayer = (container: HTMLElement) => {
    spinePlayer = new spine.SpinePlayer(container, {
      // 配置选项
      backgroundColor: '#1a1a1a',
      alpha: true,
      scale: 1
    })

    return spinePlayer
  }

  return { initSpinePlayer }
}
```

### 2. Spine动画加载

```typescript
const loadSpineAnimation = async (skeletonData: string | ArrayBuffer, atlasData: string, textureFile: File) => {
  try {
    if (!spinePlayer) {
      throw new Error('Spine Player 未初始化')
    }

    // 加载动画资源
    await spinePlayer.loadFromData(skeletonData, atlasData, textureFile)

    // 设置配置
    spinePlayer.setAnimation(0, 'idle', true) // 默认播放idle动画
    spinePlayer.scale = 1.0
    spinePlayer.animationState.timeScale = 1.0

    return spinePlayer
  } catch (error) {
    console.error('加载Spine动画失败:', error)
    throw error
  }
}
```

### 3. 文件处理

```typescript
const handleFileUpload = async (files: FileList) => {
  let skeletonFile = null
  let atlasFile = null
  let textureFile = null

  // 分类文件
  Array.from(files).forEach(file => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (['spine', 'json', 'skel'].includes(ext)) {
      skeletonFile = file
    } else if (ext === 'atlas') {
      atlasFile = file
    } else if (['png', 'jpg', 'jpeg'].includes(ext)) {
      textureFile = file
    }
  })

  if (skeletonFile && atlasFile && textureFile) {
    // 读取文件数据
    const skeletonData = await readFileAsText(skeletonFile)
    const atlasText = await readFileAsText(atlasFile)

    // 加载Spine动画
    await loadSpineAnimation(skeletonData, atlasText, textureFile)
  }
}
```

## 页面集成

将以下代码替换现有页面中的模拟代码：

### 1. 替换initializeSpinePlayer函数

```typescript
const initializeSpinePlayer = async () => {
  if (!container.value) return

  // 导入Spine Player
  const { spine } = await import('@esotericsoftware/spine-player')

  spinePlayer = new spine.SpinePlayer(container.value, {
    backgroundColor: backgroundColor.value,
    alpha: true,
    scale: 1.0
  })

  // 设置容器大小
  resizeContainer()
}
```

### 2. 替换loadSpineAnimation函数

```typescript
const loadSpineAnimation = async (skeletonData, atlasText, textureFile) => {
  try {
    if (!spinePlayer) {
      throw new Error('Spine Player 未初始化')
    }

    // 加载动画资源到Spine Player
    await spinePlayer.loadFromData(skeletonData, atlasText, textureFile)

    // 提取动画信息
    const spineData = spinePlayer.skeleton.data
    animations.value = spineData.animations.map(anim => ({
      name: anim.name,
      duration: anim.duration
    }))

    // 提取皮肤信息
    skins.value = spineData.skins.map(skin => ({
      name: skin.name
    }))

    // 提取骨骼信息
    bones.value = extractBoneHierarchy(spineData)

    // 提取插槽信息
    slots.value = spineData.slots.map(slot => ({
      name: slot.name
    }))

    // 设置默认动画
    if (animations.value.length > 0) {
      playAnimation(animations.value[0].name)
    }

  } catch (error) {
    console.error('加载Spine动画失败:', error)
    throw error
  }
}
```

### 3. 添加动画控制函数

```typescript
const updateAnimation = () => {
  if (spinePlayer && isPlaying.value) {
    // 更新播放速度
    spinePlayer.animationState.timeScale = playSpeed.value

    // 更新当前时间（从Spine Player获取）
    if (spinePlayer.animationState && spinePlayer.animationState.tracks[0]) {
      const track = spinePlayer.animationState.tracks[0]
      currentTime.value = track.animationTime

      // 检查是否需要循环
      if (currentTime.value >= totalTime.value) {
        if (!loop.value) {
          isPlaying.value = false
          spinePlayer.animationState.clearTracks()
        }
      }
    }
  }
}
```

## 导出功能实现

### Cocos Creator导出

```typescript
const exportAsCocos = () => {
  const cocosConfig = {
    type: 'spine',
    uuid: generateUUID(),
    _name: currentProject.name,
    _objFlags: 0,
    _native: '',
    userData: {
      skeletonData: currentProject.skeletonData,
      atlasText: currentProject.atlasText,
      textures: Array.from(currentProject.textures.entries()),
      animations: animations.value,
      skins: skins.value,
      defaultAnimation: currentAnimation.value,
      defaultSkin: currentSkin.value,
      scale: defaultScale.value,
      loop: loop.value
    }
  }

  downloadJSON(cocosConfig, `${currentProject.name}-cocos.json`)
}
```

### Godot导出

```typescript
const exportAsGodot = () => {
  const godotConfig = {
    resource_type: 'SpineResource',
    resource_path: `res://spine/${currentProject.name}.tres`,
    config: {
      skeleton_data: currentProject.name + '.json',
      atlas_file: currentProject.name + '.atlas',
      textures: Array.from(currentProject.textures.keys()),
      animations: animations.value,
      skins: skins.value,
      default_animation: currentAnimation.value,
      default_skin: currentSkin.value,
      scale: defaultScale.value
    }
  }

  downloadJSON(godotConfig, `${currentProject.name}-godot.tres`)
}
```

## 性能优化

### 1. 内存管理

```typescript
onUnmounted(() => {
  // 清理Spine Player资源
  if (spinePlayer) {
    spinePlayer.dispose()
    spinePlayer = null
  }

  // 清理文件引用
  currentProject.textures.clear()
})
```

### 2. 渲染优化

```typescript
// 使用对象池
const objectPool = new Map()

const getFromPool = (key) => {
  if (!objectPool.has(key)) {
    objectPool.set(key, [])
  }
  return objectPool.get(key).pop() || createNewObject(key)
}

const returnToPool = (key, object) => {
  objectPool.get(key)?.push(object)
}
```

## 部署注意事项

1. **静态资源**: 确保所有纹理资源可以通过HTTP访问
2. **CORS配置**: 如果从外部加载资源，需要正确配置CORS
3. **内存限制**: 监控内存使用，避免加载过多大型动画
4. **浏览器兼容性**: 确保目标浏览器支持WebGL

## 故障排除

### 常见问题

1. **纹理加载失败**: 检查.atlas文件中的路径是否正确
2. **动画不播放**: 确保动画名称正确且存在
3. **性能问题**: 检查是否有过多的动画实例同时运行
4. **内存泄漏**: 确保正确清理Spine Player资源

### 调试技巧

```typescript
// 启用Spine Player调试信息
spinePlayer?.setDebug(true)

// 监控性能
setInterval(() => {
  if (spinePlayer && spinePlayer.animationState) {
    const fps = Math.round(spinePlayer.fps)
    if (fps < 30) {
      console.warn('性能警告:', fps, 'FPS')
    }
  }
}, 1000)
```

通过以上集成指南，可以将Spine动画编辑器完全集成到现有的工具平台中，提供专业的Spine动画预览和编辑功能。