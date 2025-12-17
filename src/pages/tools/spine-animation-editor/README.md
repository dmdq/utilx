# Spine动画编辑器集成指南

## 项目概述

这是一个基于Web的Spine动画预览和编辑工具，专门为美术人员、策划人员和前端开发人员设计。支持在线编辑Spine动画，并可导出为Cocos Creator和Godot引擎使用的配置。

## 技术栈

- **前端框架**: Vue 3 + TypeScript + Composition API
- **构建工具**: Vite
- **动画渲染**: Pixi.js (WebGL渲染，性能最佳)
- **Spine解析**: spine-ts官方运行时

## 依赖安装

### 1. 安装Pixi.js

```bash
npm install pixi.js
# 或者
yarn add pixi.js
```

### 2. 安装Spine运行时

```bash
npm install @esotericsoftware/spine-webgl
# 或者
yarn add @esotericsoftware/spine-webgl
```

### 3. 安装类型定义（TypeScript）

```bash
npm install --save-dev @types/pixi.js
# 或者
yarn add --dev @types/pixi.js
```

## 核心功能集成

### 1. Pixi.js初始化

在页面中初始化Pixi.js应用：

```typescript
// src/composables/useSpineRuntime.ts
import * as PIXI from 'pixi.js'
import * as spine from '@esotericsoftware/spine-webgl'

export function useSpineRuntime() {
  let app = null
  let spineInstance = null

  const initPixiApp = (canvas: HTMLCanvasElement) => {
    app = new PIXI.Application({
      view: canvas,
      backgroundColor: 0x1a1a1a,
      antialias: true,
      resolution: window.devicePixelRatio || 1
    })

    // 启动渲染循环
    app.ticker.add(update)
  }

  const update = (delta: number) => {
    if (spineInstance && animationState) {
      // 更新动画状态
      animationState.update(app.ticker.deltaMS / 1000)
      animationState.apply(spineInstance.skeleton)
      spineInstance.skeleton.updateWorldTransform()
    }
  }

  return { initPixiApp, update }
}
```

### 2. Spine动画加载

```typescript
const loadSpineAnimation = async (skeletonData: ArrayBuffer, atlasText: string) => {
  try {
    // 创建纹理图集
    const atlas = new spine.TextureAtlas(atlasText, (path) => {
      // 加载纹理图片
      return PIXI.Texture.from(path)
    })

    // 创建附件加载器
    const atlasLoader = new spine.AtlasAttachmentLoader(atlas)

    // 解析骨架数据
    const binaryReader = new spine.BinaryReader(new DataView(skeletonData))
    const skeletonBinary = new spine.SkeletonBinary(atlasLoader)
    skeletonBinary.scale = 1.0

    const skeletonData = skeletonBinary.readSkeletonData(binaryReader)

    // 创建骨架实例
    const skeleton = new spine.Skeleton(skeletonData)
    skeleton.setToSetupPose()

    // 创建动画状态
    const animationStateData = new spine.AnimationStateData(skeletonData)
    const animationState = new spine.AnimationState(animationStateData)

    // 创建Spine精灵并添加到舞台
    spineInstance = new PIXI.spine.Spine(skeletonData)
    app.stage.addChild(spineInstance)

    // 设置动画状态
    spineInstance.state = animationState

    return { skeleton, animationState, spineInstance }
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
  const textureFiles = []

  // 分类文件
  Array.from(files).forEach(file => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (['spine', 'json', 'skel'].includes(ext)) {
      skeletonFile = file
    } else if (ext === 'atlas') {
      atlasFile = file
    } else if (['png', 'jpg', 'jpeg'].includes(ext)) {
      textureFiles.push(file)
    }
  })

  if (skeletonFile) {
    // 读取骨架数据
    const skeletonData = await readFileAsArrayBuffer(skeletonFile)
    const atlasText = atlasFile ? await readFileAsText(atlasFile) : ''

    // 加载纹理
    for (const textureFile of textureFiles) {
      const texture = await createImageBitmap(textureFile)
      PIXI.BaseImage.from(texture)
    }

    // 加载Spine动画
    await loadSpineAnimation(skeletonData, atlasText)
  }
}
```

## 页面集成

将以下代码替换现有页面中的模拟代码：

### 1. 替换initializePixi函数

```typescript
const initializePixi = async () => {
  if (!canvas.value) return

  // 导入Pixi.js
  const PIXI = await import('pixi.js')

  pixiApp = new PIXI.Application({
    view: canvas.value,
    backgroundColor: parseInt(backgroundColor.value.replace('#', '0x')),
    antialias: true,
    resolution: window.devicePixelRatio || 1
  })

  // 添加到渲染循环
  pixiApp.ticker.add(updateAnimation)

  // 设置画布大小
  resizeCanvas()
}
```

### 2. 替换loadSpineAnimation函数

```typescript
const loadSpineAnimation = async (spineData, atlasText) => {
  try {
    // 导入Spine运行时
    const spine = await import('@esotericsoftware/spine-webgl')

    // 解析纹理图集
    const atlas = new spine.TextureAtlas(atlasText, (path) => {
      // 从已加载的纹理中获取
      const texture = currentProject.textures.get(path)
      return PIXI.Texture.from(texture)
    })

    // 创建附件加载器
    const atlasLoader = new spine.AtlasAttachmentLoader(atlas)

    // 解析骨架数据
    const binaryReader = new spine.BinaryReader(new DataView(spineData))
    const skeletonBinary = new spine.SkeletonBinary(atlasLoader)
    skeletonBinary.scale = 1.0

    const skeletonData = skeletonBinary.readSkeletonData(binaryReader)

    // 创建Spine实例
    spineInstance = new PIXI.spine.Spine(skeletonData)
    pixiApp.stage.addChild(spineInstance)

    // 设置动画状态
    animationState = spineInstance.state

    // 提取动画信息
    animations.value = skeletonData.animations.map(anim => ({
      name: anim.name,
      duration: anim.duration
    }))

    // 提取皮肤信息
    skins.value = skeletonData.skins.map(skin => ({
      name: skin.name
    }))

    // 提取骨骼信息
    bones.value = extractBoneHierarchy(skeletonData)

    // 提取插槽信息
    slots.value = skeletonData.slots.map(slot => ({
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

### 3. 添加动画更新函数

```typescript
const updateAnimation = (delta) => {
  if (spineInstance && animationState && isPlaying.value) {
    // 更新动画时间
    animationState.update(delta * playSpeed.value)
    animationState.apply(spineInstance.skeleton)
    spineInstance.skeleton.updateWorldTransform()

    // 更新当前时间
    if (currentAnimation.value) {
      currentTime.value += delta * playSpeed.value

      // 检查是否需要循环
      if (currentTime.value >= totalTime.value) {
        if (loop.value) {
          currentTime.value = 0
        } else {
          currentTime.value = totalTime.value
          isPlaying.value = false
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
  // 清理Pixi.js资源
  if (pixiApp) {
    pixiApp.destroy(true, { children: true, texture: true, baseTexture: true })
  }

  // 清理Spine资源
  if (spineInstance) {
    spineInstance.destroy()
  }

  // 清理纹理
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
4. **内存泄漏**: 确保正确清理Pixi.js和Spine资源

### 调试技巧

```typescript
// 启用Spine调试信息
spine.webgl.SpineDebug = true

// 监控渲染性能
pixiApp.ticker.add((delta) => {
  const fps = Math.round(1000 / (delta * 16.67))
  if (fps < 30) {
    console.warn('性能警告:', fps, 'FPS')
  }
})
```

通过以上集成指南，可以将Spine动画编辑器完全集成到现有的工具平台中，提供专业的Spine动画预览和编辑功能。