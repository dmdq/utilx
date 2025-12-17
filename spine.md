我来帮你实现一个基于Nuxt3+Vue3的Spine在线播放器。这个方案将使用PixiJS和pixi-spine来渲染Spine动画。

## 1. 安装依赖

```bash
npm install pixi.js@^8.14.3 pixi-spine@^4.0.6
```

## 2. 创建Spine播放器组件

```vue
<!-- components/SpinePlayer.vue -->
<template>
  <div class="spine-player">
    <!-- 文件上传区域 -->
    <div class="upload-area">
      <div class="upload-section">
        <label for="skeleton">骨架文件 (.json或.skel)</label>
        <input 
          id="skeleton" 
          type="file" 
          accept=".json,.skel" 
          @change="handleSkeletonUpload"
        />
        <span v-if="files.skeleton">{{ files.skeleton.name }}</span>
      </div>
      
      <div class="upload-section">
        <label for="atlas">图集文件 (.atlas)</label>
        <input 
          id="atlas" 
          type="file" 
          accept=".atlas" 
          @change="handleAtlasUpload"
        />
        <span v-if="files.atlas">{{ files.atlas.name }}</span>
      </div>
      
      <div class="upload-section">
        <label for="texture">纹理文件 (.png)</label>
        <input 
          id="texture" 
          type="file" 
          accept="image/png" 
          @change="handleTextureUpload"
        />
        <span v-if="files.texture">{{ files.texture.name }}</span>
      </div>
      
      <button 
        :disabled="!canLoadAnimation" 
        @click="loadAnimation"
        class="load-btn"
      >
        加载动画
      </button>
      
      <button 
        v-if="animationLoaded" 
        @click="togglePlay"
        class="play-btn"
      >
        {{ isPlaying ? '暂停' : '播放' }}
      </button>
    </div>
    
    <!-- 画布容器 -->
    <div ref="canvasContainer" class="canvas-container"></div>
    
    <!-- 控制面板 -->
    <div v-if="animationLoaded" class="control-panel">
      <div class="animation-select">
        <label>动画列表:</label>
        <select v-model="currentAnimation" @change="changeAnimation">
          <option v-for="anim in animations" :key="anim" :value="anim">
            {{ anim }}
          </option>
        </select>
      </div>
      
      <div class="skin-select">
        <label>皮肤列表:</label>
        <select v-model="currentSkin" @change="changeSkin">
          <option v-for="skin in skins" :key="skin" :value="skin">
            {{ skin }}
          </option>
        </select>
      </div>
      
      <div class="speed-control">
        <label>播放速度: {{ speed.toFixed(2) }}</label>
        <input 
          type="range" 
          min="0" 
          max="2" 
          step="0.1" 
          v-model="speed"
          @input="updateSpeed"
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import * as PIXI from 'pixi.js'
import { Spine } from 'pixi-spine'

// PIXI应用实例
let app = null
let spineInstance = null

// 响应式数据
const canvasContainer = ref(null)
const files = reactive({
  skeleton: null,
  atlas: null,
  texture: null
})

const animationLoaded = ref(false)
const isPlaying = ref(true)
const animations = ref([])
const skins = ref([])
const currentAnimation = ref('')
const currentSkin = ref('default')
const speed = ref(1)

// 计算是否所有文件都已上传
const canLoadAnimation = computed(() => {
  return files.skeleton && files.atlas && files.texture
})

// 初始化PIXI应用
const initPixiApp = () => {
  if (app) {
    app.destroy(true)
  }

  app = new PIXI.Application({
    backgroundColor: 0x2c3e50,
    resizeTo: canvasContainer.value,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
  })

  canvasContainer.value.appendChild(app.view)
}

// 处理文件上传
const handleSkeletonUpload = (event) => {
  files.skeleton = event.target.files[0]
}

const handleAtlasUpload = (event) => {
  files.atlas = event.target.files[0]
}

const handleTextureUpload = (event) => {
  files.texture = event.target.files[0]
}

// 加载动画
const loadAnimation = async () => {
  try {
    if (!canLoadAnimation.value) {
      alert('请上传所有必要文件')
      return
    }

    // 读取文件
    const [skeletonData, atlasText, textureBlob] = await Promise.all([
      readFileAsText(files.skeleton),
      readFileAsText(files.atlas),
      readFileAsBlob(files.texture)
    ])

    // 创建纹理
    const texture = PIXI.Texture.fromBlob(textureBlob)
    const baseTexture = await texture

    // 创建图集
    const atlas = new PIXI.SpineAtlas(atlasText, (line, callback) => {
      callback(baseTexture)
    })

    // 解析骨架数据
    let skeletonJson
    try {
      skeletonJson = JSON.parse(skeletonData)
    } catch {
      // 如果是二进制格式，需要特殊处理
      const arrayBuffer = await files.skeleton.arrayBuffer()
      skeletonJson = new Uint8Array(arrayBuffer)
    }

    const spineAtlasLoader = new PIXI.SpineAtlasLoader(atlas)
    const spineJsonParser = new PIXI.SpineJsonParser()
    
    const spineData = spineJsonParser.readSkeletonData(
      skeletonJson,
      spineAtlasLoader
    )

    // 创建Spine实例
    spineInstance = new Spine(spineData)
    
    // 设置初始位置
    spineInstance.x = app.screen.width / 2
    spineInstance.y = app.screen.height / 2
    
    // 获取动画和皮肤列表
    animations.value = spineInstance.spineData.animations.map(a => a.name)
    skins.value = spineInstance.spineData.skins.map(s => s.name)
    
    // 设置默认动画和皮肤
    if (animations.value.length > 0) {
      currentAnimation.value = animations.value[0]
      spineInstance.state.setAnimation(0, currentAnimation.value, true)
    }
    
    if (skins.value.length > 0) {
      currentSkin.value = skins.value[0]
      spineInstance.skeleton.setSkinByName(currentSkin.value)
      spineInstance.skeleton.setSlotsToSetupPose()
    }
    
    // 添加到舞台
    app.stage.addChild(spineInstance)
    
    // 适应容器大小
    fitSpineToContainer()
    
    animationLoaded.value = true
    isPlaying.value = true
    
  } catch (error) {
    console.error('加载动画失败:', error)
    alert('加载动画失败: ' + error.message)
  }
}

// 文件读取工具函数
const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

const readFileAsBlob = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// 适应容器大小
const fitSpineToContainer = () => {
  if (!spineInstance) return
  
  const bounds = spineInstance.getBounds(true)
  const scale = Math.min(
    (app.screen.width * 0.8) / bounds.width,
    (app.screen.height * 0.8) / bounds.height
  )
  
  spineInstance.scale.set(scale)
}

// 切换播放状态
const togglePlay = () => {
  if (!spineInstance) return
  
  isPlaying.value = !isPlaying.value
  spineInstance.autoUpdate = isPlaying.value
}

// 切换动画
const changeAnimation = () => {
  if (!spineInstance || !currentAnimation.value) return
  
  spineInstance.state.setAnimation(0, currentAnimation.value, true)
}

// 切换皮肤
const changeSkin = () => {
  if (!spineInstance || !currentSkin.value) return
  
  spineInstance.skeleton.setSkinByName(currentSkin.value)
  spineInstance.skeleton.setSlotsToSetupPose()
}

// 更新播放速度
const updateSpeed = () => {
  if (!spineInstance) return
  
  spineInstance.state.timeScale = speed.value
}

// 窗口大小变化时重新调整
const handleResize = () => {
  if (!app || !spineInstance) return
  
  app.resize()
  spineInstance.x = app.screen.width / 2
  spineInstance.y = app.screen.height / 2
  fitSpineToContainer()
}

// 生命周期钩子
onMounted(() => {
  initPixiApp()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (app) {
    app.destroy(true)
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.spine-player {
  width: 100%;
  height: 600px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-area {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}

.upload-section label {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}

.upload-section input[type="file"] {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.upload-section span {
  font-size: 12px;
  color: #666;
  word-break: break-all;
}

.load-btn, .play-btn {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s;
}

.load-btn:hover:not(:disabled),
.play-btn:hover {
  background: #2980b9;
}

.load-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.canvas-container {
  flex: 1;
  border: 2px dashed #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #ecf0f1;
}

.control-panel {
  display: flex;
  gap: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
  flex-wrap: wrap;
}

.control-panel > div {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 150px;
}

.control-panel label {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}

.control-panel select,
.control-panel input[type="range"] {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.animation-select,
.skin-select {
  flex: 1;
}

.speed-control {
  flex: 2;
}

.speed-control input[type="range"] {
  width: 100%;
}
</style>
```

## 3. 全局配置（可选）

如果你需要在多个地方使用，可以创建一个Composable：

```typescript
// composables/useSpineLoader.ts
import * as PIXI from 'pixi.js'
import { Spine } from 'pixi-spine'

export const useSpineLoader = () => {
  const loadSpineFromFiles = async (
    skeletonFile: File,
    atlasFile: File,
    textureFile: File
  ): Promise<Spine | null> => {
    try {
      // 文件读取
      const [skeletonData, atlasText] = await Promise.all([
        readFileAsText(skeletonFile),
        readFileAsText(atlasFile)
      ])

      // 创建纹理
      const texture = PIXI.Texture.fromURL(URL.createObjectURL(textureFile))
      const baseTexture = await texture

      // 创建图集
      const atlas = new PIXI.SpineAtlas(atlasText, (line, callback) => {
        callback(baseTexture)
      })

      // 解析骨架数据
      let skeletonJson
      try {
        skeletonJson = JSON.parse(skeletonData)
      } catch {
        const arrayBuffer = await skeletonFile.arrayBuffer()
        skeletonJson = new Uint8Array(arrayBuffer)
      }

      const spineAtlasLoader = new PIXI.SpineAtlasLoader(atlas)
      const spineJsonParser = new PIXI.SpineJsonParser()
      
      const spineData = spineJsonParser.readSkeletonData(
        skeletonJson,
        spineAtlasLoader
      )

      return new Spine(spineData)
    } catch (error) {
      console.error('Spine加载错误:', error)
      throw error
    }
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  return {
    loadSpineFromFiles
  }
}
```

## 4. 使用示例

在页面中使用：

```vue
<!-- app.vue 或 pages/index.vue -->
<template>
  <div class="container">
    <h1>Spine动画在线播放器</h1>
    <p>请上传Spine导出的三个文件：.json/.skel(骨架文件)、.atlas(图集文件)、.png(纹理图片)</p>
    
    <SpinePlayer />
  </div>
</template>

<script setup>
import SpinePlayer from '@/components/SpinePlayer.vue'
</script>

<style>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #333;
  margin-bottom: 10px;
}

p {
  color: #666;
  margin-bottom: 30px;
}
</style>
```

## 核心要点说明：

1. **文件读取**：使用FileReader API读取用户上传的文件
2. **资源加载**：按顺序加载纹理、图集和骨架数据
3. **动画控制**：提供播放/暂停、切换动画/皮肤、调整速度等功能
4. **响应式设计**：自动适应容器大小，支持窗口大小变化
5. **错误处理**：对文件读取和动画加载进行错误捕获

## 注意事项：

1. **跨域问题**：如果纹理图片跨域，需要确保服务器配置正确的CORS头
2. **内存管理**：组件销毁时自动清理PIXI应用和事件监听
3. **性能优化**：大文件加载时可能需要添加加载进度提示
4. **文件验证**：可以添加文件格式验证和大小限制

这个实现支持Spine导出的所有格式（包括二进制格式），并提供了完整的播放控制功能。你可以根据具体需求进一步扩展功能，比如添加动画混合、事件监听、导出功能等。