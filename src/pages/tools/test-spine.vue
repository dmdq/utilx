<template>
  <div class="test-spine-container">
    <div class="header">
      <h1>Spine 动画编辑器测试页面</h1>
      <p>基于 spine.md 文档的实现参考</p>
    </div>

    <!-- 主要编辑器区域 -->
    <div class="main-editor">
      <!-- 标题区域 -->
      <div class="title-section">
        <h2>Spine动画编辑器</h2>
        <p>在线编辑和预览Spine动画文件</p>
      </div>

      <!-- 功能区域 -->
      <div class="function-section">
        <div class="upload-controls">
          <div
            class="upload-area"
            :class="{ active: isDragging, 'has-files': resourceFiles.length > 0 }"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
          >
            <div class="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 7h10v10"></path>
                <rect x="3" y="7" width="18" height="14" rx="2" stroke-linecap="round"></rect>
              </svg>
            </div>
            <div class="upload-text">
              <p>拖拽文件到此处上传</p>
              <p class="upload-hint">或点击选择文件</p>
            </div>
            <input
              type="file"
              multiple
              accept=".json,.spine,.skel,.atlas,.png,.jpg,.jpeg"
              @change="handleFileSelect"
              class="file-input"
            />
          </div>

          <!-- 已上传文件列表 -->
          <div v-if="resourceFiles.length > 0" class="file-list">
            <h4>已上传文件:</h4>
            <div class="file-items">
              <div
                v-for="(file, index) in resourceFiles"
                :key="index"
                class="file-item"
              >
                <div class="file-info">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                  <span class="file-type">{{ getFileType(file.name) }}</span>
                </div>
                <button
                  class="remove-btn"
                  @click="removeFile(index)"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <button
              :disabled="!canLoadSpine"
              @click="loadSpineAnimation"
              class="load-btn primary"
            >
              🎬 加载Spine动画
            </button>

            <button
              v-if="spineLoaded"
              @click="clearSpineAnimation"
              class="clear-btn"
            >
              🗑️ 清除动画
            </button>
          </div>
        </div>

        <!-- 预览区域 -->
        <div class="preview-section">
          <div class="preview-controls">
            <h3>动画预览</h3>

            <!-- 动画列表 -->
            <div v-if="animations.length > 0" class="animation-list">
              <label>动画列表:</label>
              <select
                v-model="currentAnimation"
                @change="changeAnimation"
                class="animation-select"
              >
                <option v-for="anim in animations" :key="anim" :value="anim">
                  {{ anim }}
                </option>
              </select>
            </div>

            <!-- 播放控制 -->
            <div class="playback-controls">
              <button
                @click="togglePlay"
                :class="play-btn"
                :disabled="!spineLoaded"
              >
                {{ isPlaying ? '⏸️ 暂停' : '▶️ 播放' }}
              </button>

              <div class="speed-control">
                <label>速度: {{ playSpeed }}x</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  v-model="playSpeed"
                  @input="updateSpeed"
                  class="speed-slider"
                />
              </div>
            </div>
          </div>

          <!-- PIXI画布 -->
          <div
            ref="canvasContainer"
            class="pixi-canvas"
            :style="{ width: CANVAS_WIDTH + 'px', height: CANVAS_HEIGHT + 'px' }"
          ></div>
        </div>
      </div>

      <!-- 状态显示区域 -->
      <div class="status-section">
        <h3>状态信息</h3>
        <div class="status-grid">
          <div class="status-item">
            <span class="status-label">加载状态:</span>
            <span :class="status-value">{{ spineLoaded ? '已加载' : '未加载' }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">动画数量:</span>
            <span class="status-value">{{ animations.length }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">当前动画:</span>
            <span class="status-value">{{ currentAnimation || '无' }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">播放状态:</span>
            <span class="status-value">{{ isPlaying ? '播放中' : '已暂停' }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">播放速度:</span>
            <span class="status-value">{{ playSpeed }}x</span>
          </div>
        </div>
      </div>

      <!-- 调试信息区域 -->
      <div class="debug-section">
        <h3>调试信息</h3>
        <div class="debug-console" ref="debugConsole">
          <div class="console-header">
            <span>控制台输出</span>
            <button @click="clearConsole" class="clear-console-btn">清空</button>
          </div>
          <div class="console-content" ref="consoleContent">
            <div v-for="(log, index) in debugLogs" :key="index" class="log-entry">
              <span class="log-time">{{ log.time }}</span>
              <span :class="['log-' + log.type]">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具推荐 -->
    <div class="related-tools">
      <h3>相关工具</h3>
      <div class="tool-grid">
        <a href="/tools/json-formatter" class="tool-item">
          <div class="tool-icon">📄</div>
          <div class="tool-info">
            <h4>JSON格式化工具</h4>
            <p>格式化和验证JSON数据</p>
          </div>
        </a>
        <a href="/tools/svg-code-editor" class="tool-item">
          <div class="tool-icon">🎨</div>
          <div class="tool-info">
            <h4>SVG代码编辑器</h4>
            <p>创建和编辑SVG图形</p>
          </div>
        </a>
        <a href="/tools/image-to-pdf" class="tool-item">
          <div class="tool-icon">📄</div>
          <div class="tool-info">
            <h4>图片转PDF</h4>
            <p>将图片转换为PDF文档</p>
          </div>
        </a>
        <a href="/tools/animation-player" class="tool-item">
          <div class="tool-icon">🎬</div>
          <div class="tool-info">
            <h4>动画播放器</h4>
            <p>播放各种动画格式</p>
          </div>
        </a>
      </div>
    </div>

    <!-- SEO描述区域 -->
    <div class="seo-section">
      <h3>关于Spine动画</h3>
      <div class="seo-content">
        <p>
          Spine是一个强大的2D骨骼动画系统，广泛用于游戏开发。本编辑器基于 PIXI.js 和 pixi-spine 实现，
          支持Spine导出的所有文件格式，包括 .json/.spine (骨架文件)、.atlas (图集文件) 和 .png/.jpg (纹理图片)。
        </p>
        <p>
          使用本编辑器可以在线预览和测试Spine动画，支持多种动画切换、播放速度调整等功能，
          为开发人员提供了便捷的Spine动画调试工具。
        </p>
        <p>
          支持的特性：拖拽上传、实时预览、动画列表、播放控制、速度调节、错误回退等。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'

// 辅助函数 - 读取文件为文本
const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// 辅助函数 - 读取文件为ArrayBuffer
const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// 创建占位符显示
const createPlaceholderDisplay = async (app) => {
  const PIXI = await import('pixi.js')

  // 检查app是否有效
  if (!app || !app.stage) {
    console.error('❌ PIXI应用程序无效，无法创建占位符显示')
    addDebugLog('❌ PIXI应用程序无效，无法创建占位符显示', 'error')
    return
  }

  // 获取安全的屏幕尺寸
  const screenWidth = app.screen?.width || CANVAS_WIDTH || 800
  const screenHeight = app.screen?.height || CANVAS_HEIGHT || 600

  // 创建占位符文本
  const text = new PIXI.Text('Spine动画占位显示\n请上传有效的Spine文件', {
    fontFamily: 'Arial, sans-serif',
    fontSize: 20,
    fill: 0x667eea,
    align: 'center',
    dropShadow: {
      color: 0x000000,
      alpha: 0.1,
      blur: 4,
      distance: 2
    }
  })
  text.anchor.set(0.5)
  text.x = screenWidth / 2
  text.y = screenHeight / 2

  app.stage.addChild(text)
}

// 加载和解析Spine资源
const loadSpineResources = async (skeletonFile, atlasFile, imageFiles) => {
  try {
    addDebugLog('🎭 开始加载Spine资源...', 'info')
    addDebugLog(`📋 文件清单:`, 'info')
    addDebugLog(`  骨架文件: ${skeletonFile?.name || '未找到'}`, 'info')
    addDebugLog(`  图集文件: ${atlasFile?.name || '未找到'}`, 'info')
    addDebugLog(`  纹理文件: ${imageFiles?.map(f => f.name).join(', ') || '未找到'}`, 'info')

    // 动态导入PIXI
    const PIXI = await import('pixi.js')

    // 验证必要的文件
    if (!skeletonFile) {
      throw new Error('缺少骨架文件(.json/.spine/.skel)')
    }
    if (!atlasFile) {
      throw new Error('缺少图集文件(.atlas)')
    }
    if (!imageFiles || imageFiles.length === 0) {
      throw new Error('缺少纹理文件(.png/.jpg/.jpeg)')
    }

    // 加载骨架数据
    addDebugLog('📖 解析骨架文件...', 'info')
    let skeletonData
    try {
      const skeletonText = await readFileAsText(skeletonFile)
      skeletonData = JSON.parse(skeletonText)
      addDebugLog(`✅ 骨架文件解析成功: ${skeletonFile.name}`, 'success')

      if (skeletonData.animations) {
        const animationCount = Object.keys(skeletonData.animations).length
        addDebugLog(`🎬 发现动画: ${animationCount}个`, 'info')
        if (animationCount > 0) {
          addDebugLog(`  动画列表: ${Object.keys(skeletonData.animations).join(', ')}`, 'info')
        }
      }

      if (skeletonData.bones) {
        addDebugLog(`🦴 发现骨骼: ${skeletonData.bones.length}个`, 'info')
      }

      if (skeletonData.slots) {
        addDebugLog(`🎯 发现插槽: ${skeletonData.slots.length}个`, 'info')
      }
    } catch (skeletonError) {
      throw new Error(`骨架文件解析失败: ${skeletonError.message}`)
    }

    // 加载图集数据
    addDebugLog('📚 解析图集文件...', 'info')
    let atlasText
    try {
      atlasText = await readFileAsText(atlasFile)
      addDebugLog(`✅ 图集文件解析成功: ${atlasFile.name}`, 'success')
    } catch (atlasError) {
      throw new Error(`图集文件解析失败: ${atlasError.message}`)
    }

    // 加载纹理文件 - 增强调试版本
    addDebugLog(`🖼️ 开始加载纹理文件 (${imageFiles.length}个)...`, 'info')

    // 输出PIXI.js版本信息
    addDebugLog(`🔍 PIXI.js版本: ${PIXI.VERSION || '未知'}`, 'info')
    addDebugLog(`🔍 可用的PIXI纹理API:`, 'info')
    addDebugLog(`  - PIXI.Assets: ${typeof PIXI.Assets}`, 'info')
    addDebugLog(`  - PIXI.Texture.from: ${typeof PIXI.Texture.from}`, 'info')
    addDebugLog(`  - PIXI.Texture.fromURL: ${typeof PIXI.Texture.fromURL}`, 'info')
    addDebugLog(`  - PIXI.BaseTexture: ${typeof PIXI.BaseTexture}`, 'info')
    addDebugLog(`  - PIXI.utils.TextureCache: ${typeof PIXI.utils?.TextureCache}`, 'info')

    const texturePromises = imageFiles.map(async (file, index) => {
      addDebugLog(`  [${index + 1}/${imageFiles.length}] 准备加载: ${file.name} (${formatFileSize(file.size)})`, 'info')

      const url = URL.createObjectURL(file)
      let texture = null
      let loadMethod = ''

      try {
        // 方法1: 尝试PIXI.Assets.load (最推荐的方式)
        if (typeof PIXI.Assets?.load === 'function') {
          loadMethod = 'PIXI.Assets.load'
          try {
            addDebugLog(`  🔄 尝试 ${loadMethod}...`, 'info')
            const result = await PIXI.Assets.load(url)
            addDebugLog(`  📦 ${loadMethod} 返回类型: ${typeof result}`, 'info')
            addDebugLog(`  📦 ${loadMethod} 返回值是否有效: ${!!result}`, 'info')

            if (result && typeof result === 'object') {
              // 详细检查返回对象结构
              addDebugLog(`  🔍 结果对象结构:`, 'info')
              Object.keys(result).forEach(key => {
                addDebugLog(`    - ${key}: ${typeof result[key]}`, 'info')
              })

              if (result.texture) {
                texture = result.texture
                addDebugLog(`  ✅ 从结果中提取texture: ${!!texture}`, 'success')
              } else if (result.baseTexture) {
                // PIXI v8中baseTexture可能不存在，但仍然尝试
                try {
                  texture = new PIXI.Texture(result.baseTexture)
                  addDebugLog(`  ✅ 从baseTexture创建texture: ${!!texture}`, 'success')
                } catch (btError) {
                  addDebugLog(`  ❌ baseTexture创建失败: ${btError.message}`, 'error')
                }
              } else if (result.default) {
                texture = result.default
                addDebugLog(`  ✅ 使用default属性: ${!!texture}`, 'success')
              } else if (result.image || result.source) {
                texture = result.image || result.source
                addDebugLog(`  ✅ 使用image/source属性: ${!!texture}`, 'success')
              } else {
                // 直接使用结果，它可能本身就是一个纹理
                texture = result
                addDebugLog(`  ✅ 直接使用结果作为texture: ${!!texture}`, 'success')
              }
            } else if (result) {
              // 如果不是对象但是有效值
              texture = result
              addDebugLog(`  ✅ 直接使用结果: ${!!texture}`, 'success')
            }

            if (texture) {
              addDebugLog(`  ✅ ${loadMethod} 成功`, 'success')
            } else {
              addDebugLog(`  ⚠️ ${loadMethod} 无法提取有效纹理，尝试其他方法`, 'warning')
            }
          } catch (error) {
            addDebugLog(`  ❌ ${loadMethod} 失败: ${error.message}`, 'error')
          }
        }

        // 方法2: 尝试PIXI.Texture.fromURL (PIXI v7+)
        if (!texture && typeof PIXI.Texture.fromURL === 'function') {
          loadMethod = 'PIXI.Texture.fromURL'
          try {
            addDebugLog(`  🔄 尝试 ${loadMethod}...`, 'info')
            texture = await PIXI.Texture.fromURL(url)
            addDebugLog(`  ✅ ${loadMethod} 成功: ${!!texture}`, 'success')
          } catch (error) {
            addDebugLog(`  ❌ ${loadMethod} 失败: ${error.message}`, 'error')
          }
        }

        // 方法3: 尝试PIXI.Texture.from (同步调用，异步验证)
        if (!texture && typeof PIXI.Texture.from === 'function') {
          loadMethod = 'PIXI.Texture.from'
          try {
            addDebugLog(`  🔄 尝试 ${loadMethod}...`, 'info')
            texture = PIXI.Texture.from(url)
            addDebugLog(`  📸 ${loadMethod} 立即返回: ${!!texture}`, 'info')

            if (texture) {
              addDebugLog(`  📸 纹理属性: valid=${texture.valid}, width=${texture.width}, height=${texture.height}`, 'info')
              addDebugLog(`  📸 baseTexture: ${!!texture.baseTexture}`, 'info')

              if (texture.baseTexture) {
                addDebugLog(`  📸 baseTexture属性: hasLoaded=${texture.baseTexture.hasLoaded}, width=${texture.baseTexture.width}, height=${texture.baseTexture.height}`, 'info')
              }

              // 等待纹理加载完成
              if (!texture.valid && texture.baseTexture && !texture.baseTexture.hasLoaded) {
                addDebugLog(`  ⏳ 等待纹理加载完成...`, 'info')
                await new Promise(waitResolve => {
                  const checkInterval = setInterval(() => {
                    if (texture.valid || (texture.baseTexture && texture.baseTexture.hasLoaded)) {
                      clearInterval(checkInterval)
                      waitResolve()
                    }
                  }, 50)

                  // 设置超时
                  setTimeout(() => {
                    clearInterval(checkInterval)
                    waitResolve()
                  }, 5000)
                })

                addDebugLog(`  📸 等待后纹理状态: valid=${texture.valid}`, 'info')
              }

              if (texture.valid || (texture.baseTexture && texture.baseTexture.hasLoaded)) {
                addDebugLog(`  ✅ ${loadMethod} 成功`, 'success')
              } else {
                addDebugLog(`  ⚠️ ${loadMethod} 纹理无效，尝试其他方法`, 'warning')
                texture = null
              }
            } else {
              addDebugLog(`  ❌ ${loadMethod} 返回null`, 'error')
            }
          } catch (error) {
            addDebugLog(`  ❌ ${loadMethod} 异常: ${error.message}`, 'error')
            texture = null
          }
        }

        // 方法4: PIXI v8+ 兼容方式 (使用现代API)
        if (!texture) {
          loadMethod = 'PIXI v8+ 现代API'
          try {
            addDebugLog(`  🔄 尝试 ${loadMethod}...`, 'info')

            // PIXI v8+ 方式：使用 Assets.add 和 Assets.load
            const assetId = `user-texture-${Date.now()}-${index}`
            addDebugLog(`  📝 注册资源ID: ${assetId}`, 'info')

            // 安全的版本检查
            const pixiVersion = PIXI.VERSION || ''
            const isV8OrNewer = pixiVersion.startsWith('8') || pixiVersion.startsWith('9')
            addDebugLog(`  📋 PIXI版本检查: ${pixiVersion}, v8+: ${isV8OrNewer}`, 'info')

            // 先添加资源到缓存
            if (PIXI.Assets && PIXI.Assets.add) {
              PIXI.Assets.add(assetId, url)
              addDebugLog(`  ✅ 资源已添加到Assets缓存`, 'info')
            }

            // 然后加载资源
            if (PIXI.Assets && PIXI.Assets.load) {
              const loadedAsset = await PIXI.Assets.load(assetId)
              addDebugLog(`  📦 Assets.load返回类型: ${typeof loadedAsset}`, 'info')
              addDebugLog(`  📦 Assets.load返回有效: ${!!loadedAsset}`, 'info')

              if (loadedAsset) {
                texture = loadedAsset
                addDebugLog(`  ✅ ${loadMethod} 成功`, 'success')
              } else {
                addDebugLog(`  ❌ ${loadMethod} 返回空值`, 'error')
              }
            } else {
              addDebugLog(`  ❌ PIXI.Assets.load不可用`, 'error')
            }

          } catch (error) {
            addDebugLog(`  ❌ ${loadMethod} 失败: ${error.message}`, 'error')
          }
        }

        // 方法5: Canvas API + Texture (最终回退，兼容PIXI v8)
        if (!texture) {
          loadMethod = 'Canvas API转换'
          try {
            addDebugLog(`  🔄 尝试 ${loadMethod}...`, 'info')

            texture = await new Promise((canvasResolve, canvasReject) => {
              const img = new Image()
              img.crossOrigin = 'anonymous'

              img.onload = () => {
                try {
                  addDebugLog(`  📱 Image加载成功: ${img.width}x${img.height}`, 'info')

                  // 创建Canvas元素
                  const canvas = document.createElement('canvas')
                  canvas.width = img.naturalWidth || img.width
                  canvas.height = img.naturalHeight || img.height

                  const ctx = canvas.getContext('2d')
                  if (!ctx) {
                    canvasReject(new Error('无法获取Canvas 2D上下文'))
                    return
                  }

                  // 绘制图像到Canvas
                  ctx.drawImage(img, 0, 0)

                  // 使用Canvas创建纹理 - PIXI v8兼容方式
                  if (PIXI.Texture && PIXI.Texture.from) {
                    // 尝试从Canvas创建纹理
                    const canvasTexture = PIXI.Texture.from(canvas)
                    addDebugLog(`  📸 Canvas纹理创建: ${!!canvasTexture}`, 'info')

                    if (canvasTexture) {
                      addDebugLog(`  📸 Canvas纹理属性: valid=${canvasTexture.valid}, width=${canvasTexture.width}, height=${canvasTexture.height}`, 'info')
                      canvasResolve(canvasTexture)
                    } else {
                      canvasReject(new Error('Canvas纹理创建失败'))
                    }
                  } else {
                    canvasReject(new Error('PIXI.Texture.from不可用'))
                  }
                } catch (canvasError) {
                  canvasReject(canvasError)
                }
              }

              img.onerror = () => {
                canvasReject(new Error(`图像加载失败: ${file.name}`))
              }

              img.src = url
            })

            addDebugLog(`  ✅ ${loadMethod} 成功`, 'success')

          } catch (error) {
            addDebugLog(`  ❌ ${loadMethod} 失败: ${error.message}`, 'error')
          }
        }

        // 验证最终纹理
        if (!texture) {
          throw new Error(`所有纹理加载方法都失败了: ${file.name}`)
        }

        // 获取纹理尺寸 - 兼容不同版本
        let width = 0, height = 0

        // 尝试多个属性来获取尺寸
        if (texture.width && texture.height) {
          width = texture.width
          height = texture.height
        } else if (texture.orig) {
          width = texture.orig.width
          height = texture.orig.height
        } else if (texture.default?.orig) {
          width = texture.default.orig.width
          height = texture.default.orig.height
        }

        // 尝试从源资源获取尺寸
        if (width === 0 || height === 0) {
          const resource = texture.resource || texture.source
          if (resource && resource.width && resource.height) {
            width = resource.width
            height = resource.height
          } else if (resource && resource.naturalWidth && resource.naturalHeight) {
            width = resource.naturalWidth
            height = resource.naturalHeight
          }
        }

        // 最后的回退：从真实的图像元素获取
        if (width === 0 || height === 0) {
          if (texture.baseTexture?.resource) {
            width = texture.baseTexture.resource.width || 0
            height = texture.baseTexture.resource.height || 0
          } else if (texture.baseTexture?.width && texture.baseTexture?.height) {
            width = texture.baseTexture.width
            height = texture.baseTexture.height
          }
        }

        if (width > 0 && height > 0) {
          addDebugLog(`  ✅ 纹理加载成功: ${file.name} (${width}x${height}) [${loadMethod}]`, 'success')
          return { name: file.name, texture, success: true, method: loadMethod }
        } else {
          throw new Error(`无法获取纹理尺寸 (实际尺寸: ${width}x${height}) [${loadMethod}]`)
        }

      } catch (error) {
        addDebugLog(`  ❌ 纹理加载失败: ${file.name} - ${error.message}`, 'error')
        console.warn(`纹理加载详细错误:`, error)
        return { name: file.name, texture: null, success: false, error: error.message, method: loadMethod }
      } finally {
        // 清理URL对象
        URL.revokeObjectURL(url)
      }
    })

    const textureResults = await Promise.all(texturePromises)
    const loadedTextures = textureResults.filter(t => t.success)
    const failedTextures = textureResults.filter(t => !t.success)

    if (loadedTextures.length === 0) {
      throw new Error('所有纹理文件加载失败')
    }

    if (failedTextures.length > 0) {
      addDebugLog(`⚠️ 部分纹理加载失败: ${failedTextures.length}/${imageFiles.length}`, 'warning')
      failedTextures.forEach(t => {
        addDebugLog(`  失败: ${t.name} - ${t.error}`, 'warning')
      })
    }

    const spineData = {
      skeletonData,
      atlas: atlasText,
      textures: loadedTextures.map(t => t.texture)
    }

    addDebugLog(`📋 资源加载完成:`, 'success')
    addDebugLog(`  ✅ 骨架动画: ${Object.keys(skeletonData.animations || {}).length}个`, 'success')
    addDebugLog(`  ✅ 纹理: ${loadedTextures.length}/${imageFiles.length}个`, 'success')

    return { success: true, data: spineData }

  } catch (error) {
    addDebugLog(`❌ 资源加载失败: ${error.message}`, 'error')
    console.error('Spine资源加载失败:', error)
    return { success: false, error: error.message }
  }
}

// 创建Spine对象
const createSpineObject = async (spineResources, app) => {
  try {
    addDebugLog('🎨 开始创建Spine对象...', 'info')

    if (!spineResources.success) {
      throw new Error(`资源加载失败: ${spineResources.error}`)
    }

    if (!spineResources.data) {
      throw new Error('Spine资源数据为空')
    }

    addDebugLog('📋 资源验证:', 'info')
    addDebugLog(`  骨架数据: ${spineResources.data.skeletonData ? '✅' : '❌'}`, 'info')
    addDebugLog(`  纹理数量: ${spineResources.data.textures?.length || 0}`, 'info')

    // 尝试使用pixi-spine
    let spineObject = null

    try {
      addDebugLog('🔍 尝试加载pixi-spine库...', 'info')

      // 动态导入pixi-spine
      const pixiSpine = await import('pixi-spine')

      if (pixiSpine && pixiSpine.Spine) {
        addDebugLog('✅ pixi-spine库加载成功', 'success')
        addDebugLog('🎭 尝试使用pixi-spine.Spine创建对象...', 'info')

        // 验证资源完整性
        addDebugLog('🔧 验证Spine资源完整性...', 'info')
        addDebugLog(`  骨架数据: ${spineResources.data.skeletonData ? '✅' : '❌'}`, 'info')
        addDebugLog(`  图集数据: ${spineResources.data.atlas ? '✅' : '❌'}`, 'info')
        addDebugLog(`  纹理数据: ${spineResources.data.textures.length > 0 ? '✅' : '❌'}`, 'info')

        // 创建Spine对象
        try {
          addDebugLog('🔧 尝试创建Spine实例...', 'info')
          addDebugLog(`🔧 pixi-spine版本: ${pixiSpine.VERSION || '未知'}`, 'info')

          // 验证skeletonData结构
          if (!spineResources.data.skeletonData) {
            throw new Error('skeletonData为空')
          }

          addDebugLog('🔧 skeletonData结构检查:', 'info')
          addDebugLog(`  - skeletons: ${!!spineResources.data.skeletonData.skeletons}`, 'info')
          addDebugLog(`  - animations: ${spineResources.data.skeletonData.animations ? Object.keys(spineResources.data.skeletonData.animations).length : 0}个`, 'info')
          addDebugLog(`  - bones: ${spineResources.data.skeletonData.bones ? spineResources.data.skeletonData.bones.length : 0}个`, 'info')

          spineObject = new pixiSpine.Spine(spineResources.data.skeletonData)
          addDebugLog('✅ pixi-spine.Spine对象创建成功', 'success')
          addDebugLog(`🔧 对象类型: ${spineObject.constructor.name}`, 'info')
          addDebugLog(`🔧 对象属性检查:`, 'info')
          addDebugLog(`  - state: ${!!spineObject.state}`, 'info')
          addDebugLog(`  - skeleton: ${!!spineObject.skeleton}`, 'info')
          addDebugLog(`  - 可播放动画: ${spineObject.spineData ? Object.keys(spineObject.spineData.animations || {}).length : '未知'}个`, 'info')
        } catch (spineCreateError) {
          addDebugLog(`❌ Spine对象创建失败: ${spineCreateError.message}`, 'error')
          addDebugLog(`🔧 错误详情:`, 'info')
          addDebugLog(`  - 错误类型: ${spineCreateError.constructor.name}`, 'info')
          addDebugLog(`  - 错误堆栈: ${spineCreateError.stack?.split('\n')[1] || '无'}`, 'info')

          // 提供更具体的错误信息
          if (spineCreateError.message.includes('substr')) {
            addDebugLog(`💡 可能的原因: pixi-spine版本与PIXI.js v8.14.3不兼容`, 'warning')
            addDebugLog(`💡 建议: 降级到PIXI.js v7.x或升级pixi-spine到支持v8的版本`, 'warning')
          }

          throw spineCreateError
        }

        // 检查Spine对象是否有必要的方法
        if (spineObject.state && typeof spineObject.state.setAnimation === 'function') {
          addDebugLog('✅ Spine对象API验证成功', 'success')

          // 如果有动画，自动播放第一个动画
          const animations = spineResources.data.skeletonData.animations
          if (animations && Object.keys(animations).length > 0) {
            const firstAnimation = Object.keys(animations)[0]
            addDebugLog(`🎬 自动播放第一个动画: ${firstAnimation}`, 'info')
            spineObject.state.setAnimation(0, firstAnimation, true)
          }
        } else {
          addDebugLog('⚠️ Spine对象API不完整，可能影响动画播放', 'warning')
        }

        // 设置纹理到Spine对象
        if (spineResources.data.textures && spineResources.data.textures.length > 0) {
          addDebugLog(`🖼️ 处理纹理绑定: ${spineResources.data.textures.length}个`, 'info')

          // 对于pixi-spine，我们需要确保纹理正确加载和绑定
          spineResources.data.textures.forEach((texture, index) => {
            try {
              // 验证纹理对象并获取尺寸
              if (texture) {
                let width = 0, height = 0

                if (texture.width && texture.height) {
                  width = texture.width
                  height = texture.height
                } else if (texture.orig) {
                  width = texture.orig.width
                  height = texture.orig.height
                }

                if (width > 0 && height > 0) {
                  addDebugLog(`  纹理 ${index + 1} 验证成功 (${width}x${height})`, 'success')
                } else {
                  addDebugLog(`  纹理 ${index + 1} 尺寸信息缺失`, 'warning')
                }
              } else {
                addDebugLog(`  纹理 ${index + 1} 对象为空`, 'warning')
              }
            } catch (textureError) {
              addDebugLog(`  纹理 ${index + 1} 验证失败: ${textureError.message}`, 'error')
            }
          })

          // 尝试将纹理添加到PIXI的全局纹理缓存（如果需要）
          try {
            const textureCache = PIXI.TextureCache || PIXI.utils.TextureCache
            if (textureCache) {
              spineResources.data.textures.forEach((texture, index) => {
                const textureKey = `user-spine-${index}`
                textureCache[textureKey] = texture
                addDebugLog(`  纹理已添加到缓存: ${textureKey}`, 'info')
              })
            }
          } catch (cacheError) {
            addDebugLog(`⚠️ 纹理缓存操作失败: ${cacheError.message}`, 'warning')
          }
        }

      } else {
        addDebugLog('⚠️ pixi-spine库结构异常', 'warning')
        addDebugLog(`pixiSpine对象: ${!!pixiSpine}`, 'info')
        addDebugLog(`Spine构造函数: ${typeof pixiSpine?.Spine}`, 'info')
        throw new Error('pixi-spine库未正确加载或构造函数不存在')
      }

    } catch (spineError) {
      addDebugLog(`⚠️ pixi-spine创建失败: ${spineError.message}`, 'warning')
      addDebugLog('🔧 使用回退方案创建Spine显示对象', 'info')
      console.warn('pixi-spine创建失败，使用回退方案:', spineError)

      // 创建回退显示
      spineObject = await createFallbackSpineDisplay(spineResources.data, app)
    }

    // 设置基本属性
    const screenWidth = app.screen?.width || CANVAS_WIDTH
    const screenHeight = app.screen?.height || CANVAS_HEIGHT

    spineObject.x = screenWidth / 2
    spineObject.y = screenHeight / 2

    // 设置缩放以适应画布
    if (spineObject.width && spineObject.height) {
      const maxScale = Math.min(300 / spineObject.width, 300 / spineObject.height)
      if (maxScale < 1) {
        spineObject.scale.set(maxScale)
        addDebugLog(`🔧 设置缩放比例: ${maxScale.toFixed(2)}`, 'info')
      }
    }

    // 添加交互性
    spineObject.eventMode = 'static'
    spineObject.cursor = 'pointer'

    // 添加点击事件 - 切换动画
    spineObject.on('pointerdown', () => {
      if (spineObject.state && animations.value.length > 1) {
        const currentIndex = animations.value.indexOf(currentAnimation.value)
        const nextIndex = (currentIndex + 1) % animations.value.length
        const nextAnimation = animations.value[nextIndex]

        addDebugLog(`🖱️ 点击切换到动画: ${nextAnimation}`, 'info')
        changeAnimation(nextAnimation)
      }
    })

    // 附加资源数据引用
    spineObject._spineData = spineResources.data

    addDebugLog('🎯 Spine对象配置完成', 'success')
    addDebugLog(`  位置: (${spineObject.x}, ${spineObject.y})`, 'info')
    addDebugLog(`  缩放: ${spineObject.scale.x.toFixed(2)}`, 'info')
    addDebugLog(`  交互性: ✅ (点击切换动画)`, 'info')

    return spineObject

  } catch (error) {
    addDebugLog(`❌ Spine对象创建失败: ${error.message}`, 'error')
    console.error('Spine对象创建失败:', error)
    return null
  }
}

// 创建回退Spine显示
const createFallbackSpineDisplay = async (spineData, app) => {
  // 动态导入PIXI
  const PIXI = await import('pixi.js')

  const container = new PIXI.Container()

  // 创建文本显示
  const text = new PIXI.Text({
    text: 'Spine动画资源\n(回退显示)',
    style: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      fill: 0x667eea,
      align: 'center'
    }
  })
  text.anchor.set(0.5)

  // 如果有纹理，显示第一个纹理
  if (spineData.textures && spineData.textures.length > 0) {
    const sprite = new PIXI.Sprite(spineData.textures[0])
    sprite.anchor.set(0.5)

    // 调整大小
    const maxSize = 200
    const scale = Math.min(maxSize / sprite.width, maxSize / sprite.height)
    sprite.scale.set(scale)

    sprite.y = -30
    container.addChild(sprite)
    text.y = sprite.height / 2 + 30
  } else {
    text.y = 0
  }

  container.addChild(text)

  // 添加动画效果
  let time = 0
  const animate = () => {
    time += 0.016
    container.rotation = Math.sin(time) * 0.05
  }

  app.ticker.add(animate)

  // 添加Spine API兼容
  container.state = {
    setAnimation: (_trackIndex, animationName, _loop) => {
      addDebugLog(`🎬 设置动画: ${animationName}`, 'info')
      text.text = `动画: ${animationName}`
    },
    timeScale: 1.0,
    getCurrent: (_trackIndex) => ({
      animation: { name: 'fallback' },
      loop: true,
      time: 0,
      endTime: 1000
    })
  }

  container.skeleton = {
    data: spineData.skeletonData || { animations: [], bones: [], slots: [] },
    findBone: (_name) => ({ x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }),
    updateWorldTransform: () => {}
  }

  container._animationTicker = animate
  container._spineData = spineData

  return container
}


// 响应式数据
const resourceFiles = ref([])
const isDragging = ref(false)
const canvasContainer = ref(null)
const debugConsole = ref(null)
const consoleContent = ref(null)
const debugLogs = ref([])

const spineLoaded = ref(false)
const isLoading = ref(false)
const animations = ref([])
const currentAnimation = ref('')
const isPlaying = ref(false)
const playSpeed = ref(1.0)

// PIXI相关变量
let app = null
let spineObject = null

// 画布尺寸 - 全局常量
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

// 计算属性
const canLoadSpine = computed(() => {
  const hasSkeleton = resourceFiles.value.some(f =>
    f.name.endsWith('.json') || f.name.endsWith('.spine') || f.name.endsWith('.skel')
  )
  const hasAtlas = resourceFiles.value.some(f => f.name.endsWith('.atlas'))
  const hasImage = resourceFiles.value.some(f =>
    f.name.endsWith('.png') || f.name.endsWith('.jpg') || f.name.endsWith('.jpeg')
  )
  return hasSkeleton && hasAtlas && hasImage
})

// 文件处理方法
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  let validFiles = 0

  files.forEach(file => {
    if (!resourceFiles.value.some(f => f.name === file.name)) {
      // 验证文件类型
      const isValidType = isValidSpineFile(file)

      if (isValidType) {
        resourceFiles.value.push(file)
        addDebugLog(`📁 上传文件: ${file.name} (${formatFileSize(file.size)}) - ${getFileType(file.name)}`, 'success')
        validFiles++
      } else {
        addDebugLog(`❌ 无效文件类型: ${file.name}`, 'error')
      }
    } else {
      addDebugLog(`⚠️ 文件已存在: ${file.name}`, 'warning')
    }
  })

  if (validFiles > 0) {
    addDebugLog(`📋 成功上传 ${validFiles} 个文件，当前共 ${resourceFiles.value.length} 个文件`, 'success')
  }
}

const removeFile = (index) => {
  const removedFile = resourceFiles.value[index]
  resourceFiles.value.splice(index, 1)
  addDebugLog(`🗑️ 移除文件: ${removedFile.name}`, 'info')
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileType = (filename) => {
  if (filename.endsWith('.json') || filename.endsWith('.spine')) return '骨架'
  if (filename.endsWith('.skel')) return '骨架(二进制)'
  if (filename.endsWith('.atlas')) return '图集'
  if (filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return '纹理'
  return '未知'
}

// 验证是否为有效的Spine文件
const isValidSpineFile = (file) => {
  const validExtensions = ['.json', '.spine', '.skel', '.atlas', '.png', '.jpg', '.jpeg']
  const fileName = file.name.toLowerCase()

  for (const ext of validExtensions) {
    if (fileName.endsWith(ext)) {
      return true
    }
  }

  return false
}

// 拖拽处理
const handleDragOver = (event) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (event) => {
  event.preventDefault()
  isDragging.value = false
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragging.value = false

  const files = Array.from(event.dataTransfer.files)
  let validFiles = 0

  files.forEach(file => {
    if (!resourceFiles.value.some(f => f.name === file.name)) {
      // 验证文件类型
      const isValidType = isValidSpineFile(file)

      if (isValidType) {
        resourceFiles.value.push(file)
        addDebugLog(`📁 拖拽上传文件: ${file.name} (${formatFileSize(file.size)}) - ${getFileType(file.name)}`, 'success')
        validFiles++
      } else {
        addDebugLog(`❌ 无效文件类型: ${file.name}`, 'error')
      }
    } else {
      addDebugLog(`⚠️ 文件已存在: ${file.name}`, 'warning')
    }
  })

  if (validFiles > 0) {
    addDebugLog(`📋 成功拖拽上传 ${validFiles} 个文件，当前共 ${resourceFiles.value.length} 个文件`, 'success')
  }
}

// 调试日志
const addDebugLog = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString()
  debugLogs.value.push({
    time: timestamp,
    message,
    type
  })

  // 限制日志数量，保留最新的
  if (debugLogs.value.length > 50) {
    debugLogs.value = debugLogs.value.slice(-50)
  }

  nextTick(() => {
    if (consoleContent.value) {
      const scrollHeight = consoleContent.value.scrollHeight
      consoleContent.value.scrollTop = scrollHeight
    }
  })
}

const clearConsole = () => {
  debugLogs.value = []
  addDebugLog('控制台已清空', 'info')
}

// Spine动画加载
const loadSpineAnimation = async () => {
  addDebugLog('🎯 加载动画按钮被点击', 'info')

  if (!canLoadSpine.value) {
    addDebugLog('❌ 缺少必要文件，无法加载Spine动画', 'error')
    addDebugLog(`📋 当前文件: ${resourceFiles.value.map(f => f.name).join(', ')}`, 'info')
    return
  }

  isLoading.value = true
  addDebugLog('🚀 开始加载Spine动画...', 'info')
  addDebugLog(`📁 骨架文件: ${resourceFiles.value.find(f => f.name.endsWith('.json') || f.name.endsWith('.spine') || f.name.endsWith('.skel'))?.name || '未找到'}`, 'info')
  addDebugLog(`📚 图集文件: ${resourceFiles.value.find(f => f.name.endsWith('.atlas'))?.name || '未找到'}`, 'info')
  addDebugLog(`🖼️ 纹理文件: ${resourceFiles.value.filter(f => f.name.endsWith('.png') || f.name.endsWith('.jpg') || f.name.endsWith('.jpeg')).map(f => f.name).join(', ')}`, 'info')

  try {
    // 动态导入PIXI和pixi-spine
    const PIXI = await import('pixi.js')
    const pixiSpine = await import('pixi-spine')

    addDebugLog('📦 库加载状态', 'info')
    addDebugLog(`  PIXI: ${!!PIXI}`, 'info')
    addDebugLog(`  pixiSpine: ${!!pixiSpine}`, 'info')
    addDebugLog(`  Spine构造函数: ${typeof pixiSpine.Spine}`, 'info')

    // 获取文件
    const skeletonFile = resourceFiles.value.find(f =>
      f.name.endsWith('.json') || f.name.endsWith('.spine') || f.name.endsWith('.skel')
    )
    const atlasFile = resourceFiles.value.find(f => f.name.endsWith('.atlas'))
    const imageFiles = resourceFiles.value.filter(f =>
      f.name.endsWith('.png') || f.name.endsWith('.jpg') || f.name.endsWith('.jpeg')
    )

    // 验证文件
    if (!skeletonFile) {
      throw new Error('缺少骨架文件(.json/.spine/.skel)')
    }
    if (!atlasFile) {
      throw new Error('缺少图集文件(.atlas)')
    }
    if (imageFiles.length === 0) {
      throw new Error('缺少纹理文件(.png/.jpg/.jpeg)')
    }

    addDebugLog('✅ 文件验证通过', 'success')

    // 创建或获取PIXI应用
    if (!app) {
      addDebugLog('🔧 创建新的PIXI应用...', 'info')

      try {
        // 清除容器
        if (canvasContainer.value) {
          canvasContainer.value.innerHTML = ''
          addDebugLog('✅ 清除画布容器', 'success')
        } else {
          throw new Error('画布容器未找到')
        }

        // 使用现代PIXI.js v7+初始化方式
        addDebugLog('🔧 初始化PIXI.Application...', 'info')

        app = new PIXI.Application({
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          backgroundColor: 0x2c3e50,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          hello: false
        })

        addDebugLog('✅ PIXI应用创建成功', 'success')

        // 等待应用初始化完成
        await app.init()

        // 将canvas添加到DOM
        const canvas = app.canvas
        if (canvas) {
          canvas.style.width = CANVAS_WIDTH + 'px'
          canvas.style.height = CANVAS_HEIGHT + 'px'
          canvasContainer.value.appendChild(canvas)
          addDebugLog('✅ Canvas添加到DOM', 'success')
        } else {
          throw new Error('PIXI应用未生成canvas元素')
        }

        addDebugLog(`🔧 PIXI应用验证:`, 'info')
        addDebugLog(`  应用对象: ${!!app}`, 'info')
        addDebugLog(`  舞台对象: ${!!app?.stage}`, 'info')
        addDebugLog(`  渲染器: ${!!app?.renderer}`, 'info')
        addDebugLog(`  Canvas: ${!!app?.canvas}`, 'info')

        // 验证屏幕尺寸
        const screenW = app.screen?.width || CANVAS_WIDTH
        const screenH = app.screen?.height || CANVAS_HEIGHT
        addDebugLog(`📱 屏幕尺寸: ${screenW}x${screenH}`, 'info')

        // 确保渲染器准备就绪
        if (app.renderer) {
          addDebugLog('🎨 渲染器已准备就绪', 'success')
        } else {
          throw new Error('PIXI渲染器未正确初始化')
        }

      } catch (appError) {
        console.error('PIXI应用创建失败:', appError)
        addDebugLog(`❌ PIXI应用创建失败: ${appError.message}`, 'error')

        // 创建简单的HTML canvas回退显示
        createFallbackCanvas(canvasContainer.value, 'PIXI应用初始化失败，请检查库文件是否正确加载')

        throw new Error(`PIXI应用创建失败: ${appError.message}`)
      }
    } else {
      addDebugLog('🔄 使用现有PIXI应用', 'info')
    }

    // 清除之前的spine对象
    if (spineObject && app) {
      app.stage.removeChild(spineObject)
      spineObject.destroy && spineObject.destroy()
      spineObject = null
    }

    // 加载Spine资源
    const spineResources = await loadSpineResources(skeletonFile, atlasFile, imageFiles)

    if (!spineResources.success) {
      throw new Error(spineResources.error)
    }

    // 创建Spine对象
    const spineResult = await createSpineObject(spineResources, app)

    if (spineResult) {
      spineObject = spineResult
      spineLoaded.value = true

      // 提取动画列表
      let extractedAnimations = []

      if (spineResult._spineData && spineResult._spineData.skeletonData && spineResult._spineData.skeletonData.animations) {
        extractedAnimations = Object.keys(spineResult._spineData.skeletonData.animations)
      } else if (spineResources.data && spineResources.data.skeletonData && spineResources.data.skeletonData.animations) {
        // 从加载的资源中提取动画
        extractedAnimations = Object.keys(spineResources.data.skeletonData.animations)
      }

      animations.value = extractedAnimations

      if (extractedAnimations.length > 0) {
        currentAnimation.value = extractedAnimations[0]

        // 自动开始播放第一个动画
        if (spineResult.state && typeof spineResult.state.setAnimation === 'function') {
          try {
            spineResult.state.setAnimation(0, extractedAnimations[0], true)
            spineResult.state.timeScale = playSpeed.value

            // 自动设置为播放状态
            isPlaying.value = true

            addDebugLog(`🎬 自动播放动画: ${extractedAnimations[0]}`, 'success')
          } catch (autoPlayError) {
            addDebugLog(`⚠️ 自动播放失败: ${autoPlayError.message}`, 'warning')
            isPlaying.value = false
          }
        }
      }

      addDebugLog(`✅ Spine动画加载完成!`, 'success')
      addDebugLog(`  🎬 动画数量: ${animations.value.length}`, 'info')
      addDebugLog(`  📋 动画列表: ${animations.value.join(', ')}`, 'info')
      addDebugLog(`  🎵 当前动画: ${currentAnimation.value || '无'}`, 'info')
      addDebugLog(`  ▶️ 播放状态: ${isPlaying.value ? '播放中' : '已暂停'}`, 'info')
    } else {
      throw new Error('Spine对象创建失败')
    }

  } catch (error) {
    console.error('Spine动画加载失败:', error)
    addDebugLog(`❌ Spine动画加载失败: ${error.message}`, 'error')

    // 创建错误显示 - 即使app失败也尝试创建基本的错误显示
    try {
      if (app && app.stage) {
        await createErrorDisplay(app)
      } else {
        // 如果app完全失败，检查是否有回退canvas可以更新
        addDebugLog('❌ PIXI应用程序完全失败，检查回退显示', 'warning')

        if (canvasContainer.value) {
          const existingCanvas = canvasContainer.value.querySelector('canvas')
          if (existingCanvas) {
            const ctx = existingCanvas.getContext('2d')
            if (ctx) {
              ctx.fillStyle = '#ff6b6b'
              ctx.font = '20px Arial'
              ctx.textAlign = 'center'
              ctx.fillText('Spine动画加载失败', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20)
              ctx.fillText(error.message, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20)
              addDebugLog('✅ 更新回退canvas错误信息', 'success')
            }
          }
        }
      }
    } catch (displayError) {
      addDebugLog(`❌ 创建错误显示失败: ${displayError.message}`, 'error')
    }

    spineLoaded.value = false
  } finally {
    isLoading.value = false
  }
}

// 创建回退Canvas
const createFallbackCanvas = (container, message = 'Spine动画加载失败') => {
  if (!container) return

  const fallbackCanvas = document.createElement('canvas')
  fallbackCanvas.width = CANVAS_WIDTH
  fallbackCanvas.height = CANVAS_HEIGHT
  fallbackCanvas.style.width = CANVAS_WIDTH + 'px'
  fallbackCanvas.style.height = CANVAS_HEIGHT + 'px'
  fallbackCanvas.style.backgroundColor = '#2c3e50'

  const ctx = fallbackCanvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#ff6b6b'
    ctx.font = '20px Arial'
    ctx.textAlign = 'center'

    // 绘制错误信息
    ctx.fillText(message, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20)
    ctx.fillText('请检查文件格式和网络连接', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20)

    // 绘制重试提示
    ctx.fillStyle = '#667eea'
    ctx.font = '16px Arial'
    ctx.fillText('点击"重新加载"按钮重试', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60)
  }

  container.innerHTML = ''
  container.appendChild(fallbackCanvas)
  addDebugLog('✅ 创建回退canvas显示', 'success')
}

// 创建错误显示
const createErrorDisplay = async (app) => {
  const PIXI = await import('pixi.js')

  // 检查app是否有效
  if (!app || !app.stage) {
    console.error('❌ PIXI应用程序无效，无法创建错误显示')
    addDebugLog('❌ PIXI应用程序无效，无法创建错误显示', 'error')
    return
  }

  // 获取安全的屏幕尺寸
  const screenWidth = app.screen?.width || CANVAS_WIDTH || 800
  const screenHeight = app.screen?.height || CANVAS_HEIGHT || 600

  console.log('🔧 创建错误显示，屏幕尺寸:', screenWidth, 'x', screenHeight)
  addDebugLog('🔧 开始创建错误显示界面', 'info')

  // 创建错误提示文本
  const text = new PIXI.Text({
    text: 'Spine动画加载失败\n请检查文件格式是否正确',
    style: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 24,
      fill: 0xff6b6b,
      align: 'center',
      dropShadow: {
        color: 0x000000,
        alpha: 0.2,
        blur: 4,
        distance: 2
      }
    }
  })
  text.anchor.set(0.5)
  text.x = screenWidth / 2
  text.y = screenHeight / 2

  app.stage.addChild(text)

  // 创建重试按钮
  const buttonGraphics = new PIXI.Graphics()
  buttonGraphics.roundRect(-60, -30, 120, 60, 5)
  buttonGraphics.fill({ color: 0x4ade80 })
  buttonGraphics.stroke({ color: 0xffffff, width: 2 })

  const buttonText = new PIXI.Text({
    text: '重新加载',
    style: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 18,
      fill: 0xffffff,
      align: 'center'
    }
  })
  buttonText.anchor.set(0.5)
  buttonText.x = 0
  buttonText.y = 0

  buttonGraphics.addChild(buttonText)
  buttonGraphics.eventMode = 'static'
  buttonGraphics.cursor = 'pointer'
  buttonGraphics.x = screenWidth / 2
  buttonGraphics.y = screenHeight / 2 + 50

  buttonGraphics.on('pointerdown', () => {
    loadSpineAnimation()
  })

  app.stage.addChild(buttonGraphics)

  addDebugLog('❌ 创建错误显示完成', 'error')
}

// 清除Spine动画
const clearSpineAnimation = () => {
  try {
    if (spineObject) {
      addDebugLog('🧹 开始清理Spine对象...', 'info')

      // 移除动画ticker
      if (spineObject._animationTicker && app && app.ticker) {
        app.ticker.remove(spineObject._animationTicker)
        addDebugLog('✅ 移除动画ticker', 'success')
      }

      // 从舞台移除
      if (app && app.stage && spineObject.parent) {
        app.stage.removeChild(spineObject)
        addDebugLog('✅ 从舞台移除Spine对象', 'success')
      }

      // 销毁对象
      if (typeof spineObject.destroy === 'function') {
        spineObject.destroy({ children: true, texture: false, baseTexture: false })
        addDebugLog('✅ 销毁Spine对象', 'success')
      }

      // 清理引用
      spineObject = null
      addDebugLog('✅ 清理Spine对象引用', 'success')
    }

    // 重置状态
    spineLoaded.value = false
    animations.value = []
    currentAnimation.value = ''
    isPlaying.value = false

    addDebugLog('🗑️ Spine动画已清除', 'info')

  } catch (error) {
    addDebugLog(`⚠️ 清理Spine动画时出现警告: ${error.message}`, 'warning')
    console.warn('清理Spine动画警告:', error)

    // 强制重置状态
    spineObject = null
    spineLoaded.value = false
    animations.value = []
    currentAnimation.value = ''
    isPlaying.value = false
  }
}

// 动画控制方法
const changeAnimation = (animationName) => {
  if (!animations.value.includes(animationName)) {
    addDebugLog(`⚠️ 动画不存在: ${animationName}`, 'warning')
    return
  }

  currentAnimation.value = animationName
  addDebugLog(`🎬 切换动画: ${animationName}`, 'info')

  if (spineObject && spineObject.state && typeof spineObject.state.setAnimation === 'function') {
    try {
      // 先清除当前动画轨道
      spineObject.state.clearTracks()

      // 设置新动画
      spineObject.state.setAnimation(0, animationName, true)

      // 如果当前是播放状态，确保动画继续播放
      if (isPlaying.value) {
        spineObject.state.timeScale = playSpeed.value
      } else {
        spineObject.state.timeScale = 0
      }

      addDebugLog('✅ 动画切换成功', 'success')
    } catch (error) {
      addDebugLog(`❌ 动画切换失败: ${error.message}`, 'error')
      console.error('动画切换失败:', error)
    }
  } else {
    addDebugLog('⚠️ Spine对象不可用或不支持动画控制', 'warning')
  }
}

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  addDebugLog(`🎮 ${isPlaying.value ? '开始播放' : '暂停播放'}`, 'info')

  if (spineObject && spineObject.state) {
    try {
      if (isPlaying.value) {
        // 开始播放：确保有动画并设置速度
        const animationToPlay = currentAnimation.value || (animations.value.length > 0 ? animations.value[0] : 'idle')

        if (!spineObject.state.getCurrent(0) || spineObject.state.getCurrent(0).animation.name !== animationToPlay) {
          spineObject.state.setAnimation(0, animationToPlay, true)
        }

        spineObject.state.timeScale = playSpeed.value
        addDebugLog(`▶️ 开始播放: ${animationToPlay} (${playSpeed.value}x)`, 'success')
      } else {
        // 暂停播放：将速度设为0
        spineObject.state.timeScale = 0
        addDebugLog('⏸️ 暂停播放', 'success')
      }
    } catch (error) {
      addDebugLog(`❌ 播放控制失败: ${error.message}`, 'error')
      console.error('播放控制失败:', error)
      // 重置播放状态
      isPlaying.value = !isPlaying.value
    }
  } else {
    addDebugLog('⚠️ Spine对象不可用或未初始化', 'warning')
    isPlaying.value = false
  }
}

const updateSpeed = () => {
  addDebugLog(`🔊 速度更新: ${playSpeed.value}x`, 'info')

  if (spineObject && spineObject.state) {
    try {
      // 只在播放状态下更新速度
      if (isPlaying.value) {
        spineObject.state.timeScale = playSpeed.value
        addDebugLog(`✅ 播放速度已更新: ${playSpeed.value}x`, 'success')
      } else {
        addDebugLog('⚠️ 当前为暂停状态，速度将在播放时生效', 'info')
      }
    } catch (error) {
      addDebugLog(`❌ 速度更新失败: ${error.message}`, 'error')
      console.error('速度更新失败:', error)
    }
  } else {
    addDebugLog('⚠️ Spine对象不可用，无法更新速度', 'warning')
  }
}

// 生命周期
onMounted(() => {
  addDebugLog('🚀 test-spine.vue 组件已挂载', 'info')
  addDebugLog('📋 参考 spine.md 文档实现', 'info')
  addDebugLog('🎯 测试 pixi-spine 原生API', 'info')

  // 添加控制台输出重定向
  const originalConsoleLog = console.log
  console.log = (...args) => {
    originalConsoleLog(...args)
    addDebugLog(args.join(' '), 'log')
  }

  const originalConsoleError = console.error
  console.error = (...args) => {
    originalConsoleError(...args)
    addDebugLog(args.join(' '), 'error')
  }
})

onUnmounted(() => {
  try {
    addDebugLog('🧹 开始组件清理...', 'info')

    // 清理Spine对象
    if (spineObject) {
      // 移除动画ticker
      if (spineObject._animationTicker && app && app.ticker) {
        app.ticker.remove(spineObject._animationTicker)
      }

      // 从舞台移除并销毁
      if (app && app.stage && spineObject.parent) {
        app.stage.removeChild(spineObject)
      }

      if (typeof spineObject.destroy === 'function') {
        spineObject.destroy({ children: true, texture: false, baseTexture: false })
      }

      spineObject = null
      addDebugLog('✅ Spine对象已清理', 'success')
    }

    // 清理PIXI应用
    if (app) {
      // 停止渲染
      if (app.ticker) {
        app.ticker.stop()
      }

      // 销毁应用
      app.destroy(true, { children: true, texture: false, baseTexture: false })
      app = null
      addDebugLog('✅ PIXI应用已清理', 'success')
    }

    // 清理全局引用
    if (window.pixiApp === app) {
      window.pixiApp = null
    }

    addDebugLog('✅ 组件清理完成', 'success')

  } catch (error) {
    addDebugLog(`⚠️ 组件清理时出现警告: ${error.message}`, 'warning')
    console.warn('组件清理警告:', error)
  }
})

// 导出测试函数供外部使用
defineExpose({
  loadSpineAnimation,
  clearSpineAnimation,
  addDebugLog
})
</script>

<style scoped>
.test-spine-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #2c3e50;
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.header p {
  color: #666;
  font-size: 1.1rem;
}

.main-editor {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.title-section {
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.title-section h2 {
  font-size: 1.8rem;
  margin-bottom: 8px;
  font-weight: 600;
}

.title-section p {
  font-size: 1rem;
  opacity: 0.9;
}

.function-section {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.upload-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-area {
  border: 2px dashed #cbd5e0;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  background: #f8f9fa;
}

.upload-area:hover {
  border-color: #667eea;
  background: #f0f4ff;
}

.upload-area.active {
  border-color: #667eea;
  background: #e3f2fd;
  transform: scale(1.02);
}

.upload-area.has-files {
  border-style: solid;
  border-color: #667eea;
  background: #f8f9fa;
}

.upload-icon {
  margin-bottom: 16px;
}

.upload-icon svg {
  color: #667eea;
  opacity: 0.8;
}

.upload-text p {
  margin: 0;
  font-weight: 600;
  color: #2c3e50;
}

.upload-hint {
  font-weight: 400;
  color: #666;
  font-size: 0.9rem;
  margin-top: 4px;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.file-list {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.file-list h4 {
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

.file-items {
  display: grid;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.file-item:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.9rem;
}

.file-name {
  font-weight: 600;
  color: #2c3e50;
}

.file-size {
  color: #666;
  font-size: 0.8rem;
}

.file-type {
  color: #888;
  font-size: 0.8rem;
  padding: 2px 6px;
  background: #f0f0f0;
  border-radius: 3px;
  font-size: 0.75rem;
}

.remove-btn {
  padding: 4px 8px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.remove-btn:hover {
  background: #ff5252;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.load-btn.primary {
  background: #667eea;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.load-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.load-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.clear-btn {
  background: #ff6b6b;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.clear-btn:hover {
  background: #ff5252;
}

.preview-section {
  padding: 24px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-controls h3 {
  font-size: 1.2rem;
  color: #2c3e50;
  margin: 0 0 12px 0;
}

.animation-list {
  display: flex;
  align-items: center;
  gap: 8px;
}

.animation-list label {
  font-weight: 600;
  color: #2c3e50;
}

.animation-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 1rem;
  min-width: 150px;
}

.playback-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.play-btn {
  background: #667eea;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.play-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.speed-control {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.speed-control label {
  font-weight: 600;
  color: #2c3e50;
}

.speed-slider {
  width: 100%;
}

.pixi-canvas {
  background: #ecf0f1;
  border: 2px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #666;
}

.status-section {
  padding: 24px;
  background: #f8f9fa;
  border-radius: 8px;
}

.status-section h3 {
  font-size: 1.2rem;
  color: #2c3e50;
  margin: 0 0 16px 0;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.status-value {
  font-weight: 500;
  color: #667eea;
  font-size: 1rem;
}

.debug-section {
  padding: 24px;
  background: #f8f9fa;
  border-radius: 8px;
}

.debug-section h3 {
  font-size: 1.2rem;
  color: #2c3e50;
  margin: 0 0 16px 0;
}

.debug-console {
  background: #1e1e1e;
  border-radius: 6px;
  overflow: hidden;
  max-height: 200px;
  display: flex;
  flex-direction: column;
}

.console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #2c3e50;
  color: white;
  font-weight: 500;
  border-radius: 6px 6px 0 0;
}

.clear-console-btn {
  padding: 4px 8px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
}

.console-content {
  flex: 1;
  padding: 8px 12px;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  line-height: 1.4;
}

.log-entry {
  display: flex;
  gap: 8px;
  padding: 2px 0;
  border-bottom: 1px solid #333;
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.log-time {
  color: #666;
  font-size: 0.85rem;
  min-width: 60px;
}

.log-info {
  color: #4ade80;
}

.log-warning {
  color: #fbbf24;
}

.log-error {
  color: #ff6b6b;
}

.related-tools {
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.related-tools h3 {
  font-size: 1.4rem;
  color: #2c3e50;
  margin: 0 0 16px 0;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
}

.tool-item:hover {
  background: #e3f2fd;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tool-icon {
  font-size: 1.5rem;
  width: 40px;
  text-align: center;
}

.tool-info h4 {
  font-size: 1rem;
  color: #2c3e50;
  margin: 0 0 4px 0;
}

.tool-info p {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.seo-section {
  padding: 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
}

.seo-section h3 {
  font-size: 1.4rem;
  color: #2c3e50;
  margin: 0 0 16px 0;
}

.seo-content {
  color: #4a5568;
  line-height: 1.6;
}

.seo-content p {
  margin: 0 0 12px 0;
}

.seo-content p:last-child {
  margin-bottom: 0;
}
</style>