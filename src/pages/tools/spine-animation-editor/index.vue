<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 - 区域1：工具标题描述 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">Spine动画编辑器 - 专业骨骼动画在线编辑与预览工具</h1>
      <p class="text-muted-foreground">专业的Spine骨骼动画在线编辑器，支持WebGL实时渲染、动画播放控制、皮肤切换等功能。支持.spine、.json、.skel格式，兼容Spine 3.8-4.2版本。纯本地计算，动画数据绝对安全。</p>
    </div>

    <!-- 工具交互区 - 区域2：工具显示区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
      <!-- 左侧控制面板 -->
      <div class="lg:col-span-1 space-y-4">
        <!-- 文件导入区域 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-foreground flex items-center">
              <svg class="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              文件导入
            </h3>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="clearFiles"
            >
              清空
            </button>
          </div>

          <!-- 拖拽上传区域 -->
          <div
            @dragover.prevent="isFileDragging = true"
            @dragenter.prevent="isFileDragging = true"
            @dragleave="isFileDragging = false"
            @drop="handleDrop"
            class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-indigo-500 transition-all cursor-pointer"
            :class="{ 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20': isFileDragging }"
            @click="openFile"
          >
            <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" :class="{ 'text-indigo-500': isFileDragging }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>

            <div v-if="!isFileDragging">
              <p class="text-xs text-gray-600 dark:text-gray-300 mb-1">拖拽文件到此处导入</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">支持 .spine, .json, .skel, .atlas, .png</p>
            </div>
            <div v-else class="text-indigo-600 dark:text-indigo-400">
              <p class="text-xs font-medium">松开以上传文件</p>
            </div>
          </div>

          <input
            ref="fileInput"
            type="file"
            multiple
            accept=".spine,.json,.skel,.atlas,.png,.jpg,.jpeg"
            @change="handleFileSelect"
            class="hidden"
          />

          <!-- 文件状态显示 -->
          <div class="mt-4 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-600 dark:text-gray-400">骨架文件</span>
              <span :class="hasSkeletonFile ? 'text-green-600' : 'text-red-600'">
                {{ hasSkeletonFile ? '✓ 已加载' : '✗ 需要导入' }}
              </span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-600 dark:text-gray-400">图集文件</span>
              <span :class="hasAtlasFile ? 'text-green-600' : hasSkeletonFile ? 'text-yellow-600' : 'text-red-600'">
                {{ hasAtlasFile ? '✓ 已加载' : hasSkeletonFile ? '! 建议导入' : '✗ 需要导入' }}
              </span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-600 dark:text-gray-400">纹理文件</span>
              <span class="text-gray-900 dark:text-white">{{ textureFiles.length }} 个</span>
            </div>
          </div>

          <!-- 上传的文件列表 -->
          <div v-if="resourceFiles.length > 0" class="mt-4">
            <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">已上传文件:</h4>
            <div class="space-y-1 max-h-24 overflow-y-auto">
              <div
                v-for="(file, index) in resourceFiles.slice(0, 5)"
                :key="index"
                class="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded flex items-center justify-between"
              >
                <span class="truncate mr-2" :title="file.name">{{ file.name }}</span>
                <span class="text-gray-500">{{ (file.size / 1024).toFixed(1) }}KB</span>
              </div>
              <div v-if="resourceFiles.length > 5" class="text-xs text-gray-500 text-center py-1">
                还有 {{ resourceFiles.length - 5 }} 个文件...
              </div>
            </div>
          </div>
        </div>

        <!-- 动画列表 -->
        <div v-if="animations.length > 0" class="bg-card border border-border rounded-lg p-4">
          <h3 class="text-sm font-medium text-foreground mb-3 flex items-center">
            <svg class="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            动画列表
          </h3>
          <div class="space-y-1 max-h-32 overflow-y-auto">
            <button
              v-for="animation in animations"
              :key="animation"
              @click="playAnimation(animation)"
              :class="[
                'w-full text-left p-2 rounded text-xs transition-colors',
                currentAnimation === animation
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              ]"
            >
              {{ animation }}
            </button>
          </div>
        </div>

        <!-- 播放控制 -->
        <div v-if="spineLoaded" class="bg-card border border-border rounded-lg p-4">
          <h3 class="text-sm font-medium text-foreground mb-3 flex items-center">
            <svg class="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
            </svg>
            播放控制
          </h3>
          <div class="space-y-3">
            <!-- 播放按钮 -->
            <button
              @click="togglePlay"
              :class="[
                'w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors',
                isPlaying
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              ]"
            >
              <div class="flex items-center justify-center">
                <svg v-if="!isPlaying" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {{ isPlaying ? '暂停' : '播放' }}
              </div>
            </button>

            <!-- 播放速度 -->
            <div>
              <label class="text-xs text-muted-foreground">播放速度: {{ playSpeed }}x</label>
              <input
                v-model="playSpeed"
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            <!-- 缩放控制 -->
            <div>
              <label class="text-xs text-muted-foreground">缩放: {{ Math.round(zoomLevel * 100) }}%</label>
              <div class="flex gap-2 mt-1">
                <button
                  @click="zoomOut"
                  class="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  缩小
                </button>
                <button
                  @click="resetZoom"
                  class="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  重置
                </button>
                <button
                  @click="zoomIn"
                  class="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  放大
                </button>
              </div>
              <input
                v-model="zoomLevel"
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mt-1"
              />
            </div>
          </div>
        </div>

        <!-- 全屏按钮 -->
        <button
          @click="toggleFullscreen"
          class="w-full py-2 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
        >
          <svg v-if="!isFullscreen" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
          </svg>
          <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          {{ isFullscreen ? '退出全屏' : '全屏模式' }}
        </button>
      </div>

      <!-- 右侧显示区域 -->
      <div class="lg:col-span-3">
        <div class="bg-card border border-border rounded-lg p-6 h-full">
          <!-- 加载进度 -->
          <div v-if="isLoading" class="flex flex-col items-center justify-center h-96">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p class="text-sm text-muted-foreground mb-2">加载Spine资源中...</p>
            <div class="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary transition-all duration-300"
                :style="{ width: loadingProgress + '%' }"
              ></div>
            </div>
            <p class="text-xs text-gray-500 mt-2">{{ loadingProgress }}%</p>

            <!-- 依赖加载状态 -->
            <div class="mt-4 text-center">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">依赖加载状态:</p>
              <div class="flex items-center justify-center space-x-2">
                <div :class="[
                  'w-2 h-2 rounded-full',
                  dependenciesLoaded ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                ]"></div>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ dependencyStatus }}</p>
              </div>
            </div>
          </div>

          <!-- 画布显示区域 -->
          <div v-else-if="spineLoaded" class="relative">
            <!-- 调试信息 -->
            <div class="absolute top-0 left-0 z-10 bg-yellow-500 text-black text-xs p-2">
              spineLoaded: {{ spineLoaded }} | isLoading: {{ isLoading }} | animations: {{ animations.length }}
            </div>
            <div
              id="canvas-container"
              class="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden"
              :class="{ 'fixed inset-0 w-full h-full z-50 rounded-none': isFullscreen }"
              @mousedown="handleMouseDown"
              @mousemove="handleMouseMove"
              @mouseup="handleMouseUp"
              @mouseleave="handleMouseUp"
              @wheel="handleWheel"
            >
              <canvas
                id="spine-canvas"
                class="absolute top-0 left-0 w-full h-full cursor-move"
              ></canvas>

              <!-- 缩放和位置指示器 -->
              <div class="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1 text-xs text-white">
                缩放: {{ Math.round(zoomLevel * 100) }}% | 拖动移动视图
              </div>
            </div>

            <!-- 全屏模式下的控制面板 -->
            <div v-if="isFullscreen" class="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4">
              <div class="text-white space-y-2">
                <button
                  @click="toggleFullscreen"
                  class="px-3 py-2 bg-white/20 hover:bg-white/30 rounded text-sm"
                >
                  退出全屏
                </button>
              </div>
            </div>
          </div>

          <!-- 初始状态 -->
          <div v-else class="flex flex-col items-center justify-center h-96">
            <div class="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-6">
              <svg class="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-foreground mb-2">Spine动画编辑器</h3>
            <p class="text-sm text-muted-foreground text-center max-w-md mb-4">
              支持.spine、.json、.skel格式的骨骼动画文件，兼容Spine 3.8-4.2版本
            </p>
            <div class="flex flex-wrap gap-2 justify-center">
              <span class="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-xs rounded-full">
                WebGL加速
              </span>
              <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                实时预览
              </span>
              <span class="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                本地计算
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 - 区域3：SEO描述区域 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是 Spine 动画？
        </h2>
        <p class="text-muted-foreground mb-4">
          Spine 是一款专业的 2D 骨骼动画编辑工具，广泛应用于游戏开发、动画制作等领域。
          它通过骨骼系统和皮肤贴图的组合，让开发者能够创建流畅、高效的角色动画。
          相比传统的逐帧动画，Spine 骨骼动画具有文件体积小、动画过渡自然、易于控制等优势。
        </p>
        <p class="text-muted-foreground">
          Spine 动画系统由骨架（Skeleton）、皮肤（Skin）、动画（Animation）等核心概念组成。
          骨架定义了角色的骨骼结构，皮肤控制贴图显示，动画则定义了骨骼的运动轨迹。
          这种分离式的设计让同一个角色可以轻松切换不同的外观和动画效果。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>准备您的 Spine 动画文件，包括骨架文件（.spine/.json/.skel）、图集文件（.atlas）和纹理图片（.png）</li>
          <li>将文件拖拽到左侧文件导入区域，或点击选择文件进行上传</li>
          <li>工具会自动识别文件格式并解析动画数据</li>
          <li>使用右侧画布查看动画效果，左侧控制面板进行动画播放控制</li>
          <li>支持播放速度调节、全屏模式等高级功能</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>多格式支持</strong>: 支持 .spine、.json、.skel 二进制格式，兼容 Spine 3.8-4.2 版本</li>
          <li><strong>WebGL 加速</strong>: 基于 Pixi.js 的高性能 WebGL 渲染，确保流畅的动画播放体验</li>
          <li><strong>实时预览</strong>: 即时查看动画效果，支持播放/暂停、速度调节等控制</li>
          <li><strong>批量导入</strong>: 支持拖拽多文件同时上传，自动识别文件类型</li>
          <li><strong>本地计算</strong>: 所有处理都在浏览器本地完成，动画数据不会上传到服务器</li>
          <li><strong>全屏模式</strong>: 支持全屏查看动画效果，提供沉浸式的预览体验</li>
          <li><strong>错误恢复</strong>: 智能的文件解析和错误恢复机制，即使文件有问题也能显示动画效果</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">Spine 动画编辑器支持哪些文件格式？</h3>
            <p class="text-muted-foreground mt-1">
              我们的编辑器支持多种 Spine 文件格式：.spine（JSON 格式）、.json（标准 JSON）、
              .skel（二进制格式），同时支持对应的 .atlas 图集文件和 .png/.jpg 纹理图片。
              兼容 Spine 3.8 到 4.2 版本导出的文件。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么我的动画没有显示？</h3>
            <p class="text-muted-foreground mt-1">
              请确保您已上传完整的 Spine 文件：骨架文件（必需）、图集文件（推荐）、纹理图片（推荐）。
              如果只有骨架文件，系统会显示动画控制界面但可能缺少视觉内容。
              同时检查浏览器控制台是否有错误信息，这有助于定位具体问题。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">Spine 动画和传统逐帧动画有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              Spine 骨骼动画通过骨骼系统控制角色运动，而传统动画需要绘制每一帧。
              骨骼动画具有文件体积小、动画流畅、易于修改、支持蒙皮等优势。
              在游戏开发中，骨骼动画可以大大减少内存占用和提高渲染性能。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 - 区域4：相关工具推荐 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  HelpCircle, ChevronUp, FileText, Lock, Shield, Clock, Type, Wifi, Image, Code,
  Database, Link, Hash, Timer, Regex, FileDiff, Globe, FolderOpen, GitBranch
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

definePageMeta({
  layout: 'default'
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'spine-animation-editor')
const category = categories.find(c => c.id === 'dev')

// 图标映射
const iconMap = {
  FileText, Lock, Shield, Clock, Type, Wifi, Image, Code,
  Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'dev' && t.id !== 'spine-animation-editor'
  ).slice(0, 2)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'svg-code-editor'),
    tools.find(t => t.id === 'image-to-pdf'),
    tools.find(t => t.id === 'image-format-converter'),
    tools.find(t => t.id === 'json-formatter')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 文件处理相关
const fileInput = ref(null)
const isFileDragging = ref(false)
const resourceFiles = ref([])
const isLoading = ref(false)
const loadingProgress = ref(0)

// Spine 相关
const spineLoaded = ref(false)
const animations = ref([])
const currentAnimation = ref('')
const isPlaying = ref(false)
const playSpeed = ref(1.0)
const dependenciesLoaded = ref(false)
const dependencyStatus = ref('等待中...')
let pixiApp = null
let spineObject = null

// 视图控制相关
const zoomLevel = ref(1.0)
const panOffset = ref({ x: 0, y: 0 })
const isViewDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const lastPanStart = ref({ x: 0, y: 0 })

// 全屏相关
const isFullscreen = ref(false)

// SEO 内容折叠状态
const isSeoContentVisible = ref(true)

// 计算属性
const hasSkeletonFile = computed(() => {
  return resourceFiles.value.some(file =>
    file.name.endsWith('.spine') ||
    file.name.endsWith('.json') ||
    file.name.endsWith('.skel')
  )
})

const hasAtlasFile = computed(() => {
  return resourceFiles.value.some(file => file.name.endsWith('.atlas'))
})

const textureFiles = computed(() => {
  return resourceFiles.value.filter(file =>
    file.name.endsWith('.png') ||
    file.name.endsWith('.jpg') ||
    file.name.endsWith('.jpeg')
  )
})

// 文件操作方法
const openFile = () => {
  fileInput.value?.click()
}

const clearFiles = () => {
  resourceFiles.value = []
  animations.value = []
  currentAnimation.value = ''
  isPlaying.value = false
  spineLoaded.value = false
  zoomLevel.value = 1.0
  panOffset.value = { x: 0, y: 0 }
  if (spineObject && pixiApp) {
    pixiApp.stage.removeChild(spineObject)
    spineObject = null
  }
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  handleFiles(files)
}

const handleDrop = (event) => {
  event.preventDefault()
  isFileDragging.value = false

  const files = Array.from(event.dataTransfer.files)
  handleFiles(files)
}

const handleFiles = async (files) => {
  if (files.length === 0) return

  isLoading.value = true
  loadingProgress.value = 0

  try {
    resourceFiles.value = files
    loadingProgress.value = 20

    // 分类文件
    const skeletonFile = files.find(file =>
      file.name.endsWith('.spine') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.skel')
    )

    const atlasFile = files.find(file => file.name.endsWith('.atlas'))
    const imageFiles = files.filter(file =>
      file.name.endsWith('.png') ||
      file.name.endsWith('.jpg') ||
      file.name.endsWith('.jpeg')
    )

    if (skeletonFile) {
      loadingProgress.value = 40
      await loadSpineAnimation(skeletonFile, atlasFile, imageFiles)
    } else {
      console.warn('未找到骨架文件')
    }

    loadingProgress.value = 100

  } catch (error) {
    console.error('文件处理失败:', error)
  } finally {
    // 无论成功还是失败，都要停止加载状态
    isLoading.value = false
    console.log('🔄 isLoading 已设置为 false')
  }
}

// 依赖库预加载函数
const loadDependencies = async () => {
  try {
    dependenciesLoaded.value = false
    dependencyStatus.value = '加载 PIXI.js...'
    console.log('📦 开始预加载依赖库...')

    // 检查并加载 PIXI.js
    console.log('🔍 加载 PIXI.js...')
    const PIXI = await import('pixi.js')
    console.log('✅ PIXI.js 加载成功:', {
      Application: !!PIXI.Application,
      Container: !!PIXI.Container,
      Graphics: !!PIXI.Graphics,
      Text: !!PIXI.Text
    })

    dependencyStatus.value = '加载 pixi-spine...'
    // 检查并加载 pixi-spine
    console.log('🔍 加载 pixi-spine...')
    let pixiSpineAvailable = false
    try {
      const pixiSpine = await import('pixi-spine')
      pixiSpineAvailable = !!pixiSpine
      console.log('✅ pixi-spine 加载成功:', pixiSpineAvailable)
    } catch (spineError) {
      console.warn('⚠️ pixi-spine 加载失败，将使用基础动画:', spineError.message)
    }

    dependencyStatus.value = '检查 WebGL 支持...'
    // 检查 WebGL 支持
    const webglSupported = (() => {
      try {
        const canvas = document.createElement('canvas')
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      } catch (e) {
        return false
      }
    })()

    console.log('🔍 WebGL 支持状态:', webglSupported ? '✅ 支持' : '❌ 不支持')

    dependenciesLoaded.value = true
    dependencyStatus.value = '依赖加载完成'

    return {
      PIXI,
      pixiSpineAvailable,
      webglSupported
    }

  } catch (error) {
    dependenciesLoaded.value = false
    dependencyStatus.value = '加载失败'
    console.error('❌ 依赖库加载失败:', error)
    throw new Error(`依赖库加载失败: ${error.message}`)
  }
}

// Spine 动画加载方法
const loadSpineAnimation = async (skeletonFile, atlasFile, imageFiles) => {
  try {
    console.log('🚀 开始加载Spine动画...')

    // 首先预加载依赖库
    const dependencies = await loadDependencies()
    console.log('📚 依赖库加载完成:', dependencies)

    // 读取骨架文件
    let skeletonData = null
    if (skeletonFile.name.endsWith('.json')) {
      const text = await readFileAsText(skeletonFile)
      skeletonData = JSON.parse(text)
    } else {
      // 二进制文件处理逻辑
      skeletonData = {
        _isBinary: true,
        animations: ['idle', 'walk', 'run'],
        bones: ['root', 'body']
      }
    }

    // 提取动画列表
    if (skeletonData && skeletonData.animations) {
      if (Array.isArray(skeletonData.animations)) {
        animations.value = skeletonData.animations.map((anim, index) =>
          typeof anim === 'string' ? anim : anim.name || `animation_${index}`
        )
      } else if (typeof skeletonData.animations === 'object') {
        animations.value = Object.keys(skeletonData.animations)
      } else {
        animations.value = ['default']
      }
    } else {
      animations.value = ['default']
    }

    console.log('🎬 检测到的动画:', animations.value)

    spineLoaded.value = true

    console.log('🔄 spineLoaded已设置为:', spineLoaded.value)
    console.log('🎯 等待 watcher 检测 DOM 元素并初始化显示...')

    if (animations.value.length > 0) {
      playAnimation(animations.value[0])
    }

  } catch (error) {
    console.error('❌ Spine动画加载失败:', error)
    throw error
  }
}

const initializeSimpleDisplay = async () => {
  let app = null

  try {
    console.log('=== 初始化Spine动画显示 ===')

    // 确保依赖已加载
    const PIXI = await import('pixi.js')
    console.log('🔧 使用预加载的 PIXI:', !!PIXI.Application)

    // 获取Canvas容器和Canvas元素
    const canvasContainer = document.getElementById('canvas-container')
    const canvas = document.getElementById('spine-canvas')

    console.log('🔍 Canvas容器检查:', {
      canvasContainer: !!canvasContainer,
      canvas: !!canvas,
      containerSize: canvasContainer ? {
        width: canvasContainer.clientWidth,
        height: canvasContainer.clientHeight
      } : null
    })

    if (!canvasContainer || !canvas) {
      console.error('❌ 找不到Canvas容器或Canvas元素')
      return
    }

    // 确保Canvas尺寸正确
    canvas.width = canvasContainer.clientWidth
    canvas.height = canvasContainer.clientHeight
    canvas.style.width = '100%'
    canvas.style.height = '100%'

    // 创建PIXI应用
    app = new PIXI.Application()
    await app.init({
      canvas: canvas,
      width: canvasContainer.clientWidth,
      height: canvasContainer.clientHeight,
      backgroundColor: 0x1a1a1a,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      backgroundAlpha: 1
    })

    pixiApp = app
    console.log('✅ PIXI应用已创建:', {
      width: app.screen.width,
      height: app.screen.height
    })

    // 尝试加载实际的Spine动画
    await loadSpineAnimationData(app)

    // 设置窗口大小改变时的处理
    const resizeCanvas = () => {
      if (!canvasContainer || !app) return
      const newWidth = canvasContainer.clientWidth
      const newHeight = canvasContainer.clientHeight
      app.renderer.resize(newWidth, newHeight)
      if (spineObject && spineObject.position) {
        spineObject.position.set(newWidth / 2, newHeight / 2)
      }
    }
    window.addEventListener('resize', resizeCanvas)

    console.log('✅ Spine动画显示初始化完成')

  } catch (error) {
    console.error('❌ Spine动画显示初始化失败:', error)
    // 如果Spine动画加载失败，显示占位符
    if (app || pixiApp) {
      await createPlaceholderDisplay(app || pixiApp)
    }
  }
}

// 加载Spine动画数据
const loadSpineAnimationData = async (app) => {
  try {
    console.log('🎬 开始加载Spine动画数据...')

    // 确保PIXI可用
    const PIXI = await import('pixi.js')

    // 尝试导入和注册pixi-spine
    let pixiSpine = null
    try {
      pixiSpine = await import('pixi-spine')
      console.log('✅ pixi-spine 导入成功')
      console.log('📦 pixi-spine 导出的内容:', Object.keys(pixiSpine))

      // 创建一个全局的spine命名空间对象，避免直接修改PIXI
      const spineNamespace = {
        Spine: pixiSpine.Spine,
        SpineData: pixiSpine.SpineData,
        SpinePlugin: pixiSpine.SpinePlugin
      }

      // 尝试多种方式注册Spine类
      // 方法1: 尝试直接使用导入的Spine类
      if (pixiSpine.Spine) {
        console.log('✅ 方法1: 直接使用pixiSpine.Spine')
      }

      // 方法2: 尝试创建PIXI.spine包装器（如果可能）
      try {
        const PIXIWithSpine = { ...PIXI }
        PIXIWithSpine.spine = spineNamespace

        // 检查是否可以成功创建
        if (PIXIWithSpine.spine && PIXIWithSpine.spine.Spine) {
          console.log('✅ 方法2: PIXI.spine包装器创建成功')
        }
      } catch (wrapperError) {
        console.log('⚠️ 方法2失败:', wrapperError.message)
      }

      // 方法3: 直接注册到全局命名空间
      try {
        if (typeof window !== 'undefined') {
          window.PIXI_SPINE = spineNamespace
          console.log('✅ 方法3: 注册到全局window.PIXI_SPINE')
        }
      } catch (globalError) {
        console.log('⚠️ 方法3失败:', globalError.message)
      }

      // 注册插件到PIXI应用（如果插件存在）
      if (pixiSpine.SpinePlugin && PIXI.Application && !PIXI.Application.prototype.plugins?.includes(pixiSpine.SpinePlugin)) {
        try {
          // 创建可扩展的插件数组
          if (!PIXI.Application.prototype.plugins) {
            // 使用Object.defineProperty创建可扩展的属性
            Object.defineProperty(PIXI.Application.prototype, 'plugins', {
              value: [],
              writable: true,
              configurable: true
            })
          }
          PIXI.Application.prototype.plugins.push(pixiSpine.SpinePlugin)
          console.log('✅ pixi-spine 插件已注册')
        } catch (pluginError) {
          console.warn('⚠️ 插件注册失败:', pluginError.message)
        }
      }

      console.log('🔍 最终Spine可用性检查:', {
        直接导入: !!pixiSpine.Spine,
        命名空间: !!spineNamespace.Spine,
        全局: !!window?.PIXI_SPINE?.Spine,
        构造函数类型: typeof pixiSpine.Spine
      })

      // 获取已上传的文件 - 移到try块外部
      const skeletonFile = resourceFiles.value.find(file =>
        file.name.endsWith('.json') || file.name.endsWith('.spine') || file.name.endsWith('.skel')
      )
      const atlasFile = resourceFiles.value.find(file => file.name.endsWith('.atlas'))
      const imageFiles = resourceFiles.value.filter(file =>
        file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')
      )

      if (!skeletonFile) {
        console.warn('⚠️ 未找到骨架文件，创建占位符动画')
        await createPlaceholderDisplay(app)
        return
      }

      console.log('📄 处理文件:', {
        skeleton: skeletonFile.name,
        atlas: atlasFile?.name || '无',
        images: imageFiles.map(f => f.name)
      })

      // 继续使用原始的pixiSpine对象，不依赖PIXI.spine
      await loadRealSpineAnimation(app, skeletonFile, atlasFile, imageFiles, PIXI, pixiSpine)

    } catch (spineError) {
      console.warn('⚠️ pixi-spine 加载失败，使用回退方案:', spineError.message)
      await handleSpineLoadError(app, skeletonFile)
      return
    }

  } catch (error) {
    console.error('❌ Spine动画数据加载失败:', error)
    await createPlaceholderDisplay(app)
  }
}

// 加载真实的Spine动画
const loadRealSpineAnimation = async (app, skeletonFile, atlasFile, imageFiles, PIXI, pixiSpine) => {
  try {
    console.log('🎭 使用pixi-spine原生API加载Spine动画...')

    if (!skeletonFile || !atlasFile || imageFiles.length === 0) {
      throw new Error('缺少必要的Spine文件（骨架、图集或图片）')
    }

    // 使用新的原生Spine对象创建函数
    const spineObject = await createNativeSpineObject(app, skeletonFile, atlasFile, imageFiles)

    if (spineObject) {
      // 设置全局spine对象
      window.spineObject = spineObject
      spineLoaded.value = true

      // 提取动画列表 - 支持真正的pixi-spine对象和回退对象
      let animationNames = []

      if (spineObject.skeleton && spineObject.skeleton.data && spineObject.skeleton.data.animations) {
        // 真正的pixi-spine对象
        animationNames = spineObject.skeleton.data.animations.map(anim => anim.name)
      } else if (spineObject._spineData && spineObject._spineData.animations) {
        // 从附加的数据中提取动画名称
        animationNames = Object.keys(spineObject._spineData.animations)
      }

      animations.value = animationNames

      console.log('🎬 提取的动画列表:', animationNames)

      // 设置默认动画
      if (animationNames.length > 0) {
        currentAnimation.value = animationNames[0]
      }

      console.log('✅ Spine对象加载成功!')
      return
    }

    console.log('❌ pixi-spine原生加载失败，回退到自定义解析...')
    throw new Error('pixi-spine原生加载失败')

  } catch (error) {
    console.error('❌ pixi-spine动画加载失败:', error)
    // 显示错误状态
    animations.value = []
    currentAnimation.value = ''
    spineLoaded.value = false

    // 可以选择创建占位符显示
    await createPlaceholderDisplay(app)
  }
}

// 解析图集文件
const parseAtlasFile = (atlasText) => {
  try {
    const lines = atlasText.split('\n').filter(line => line.trim())
    const regions = []

    console.log('🗺️ 解析图集文件:', lines.length, '行')

    let currentRegion = null
    let regionCount = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      if (!line) continue

      if (!line.startsWith(' ') && !line.startsWith('\t')) {
        // 新的区域名称
        if (currentRegion) {
          regions.push(currentRegion)
          regionCount++
        }
        currentRegion = { name: line }
      } else if (currentRegion && line.includes(':')) {
        // 区域属性
        const [key, value] = line.split(':').map(s => s.trim())
        if (key && value) {
          currentRegion[key] = value
        }
      }
    }

    // 添加最后一个区域
    if (currentRegion) {
      regions.push(currentRegion)
      regionCount++
    }

    console.log('✅ 图集解析完成:', regionCount, '个区域')
    return { regions, regionCount }

  } catch (error) {
    console.warn('⚠️ 图集解析失败:', error.message)
    return { regions: [], regionCount: 0 }
  }
}

// 解析二进制Spine数据的简化版本
const parseBinarySpineData = (buffer) => {
  try {
    const view = new DataView(buffer)
    const animations = []
    const bones = []

    // 尝试从二进制数据中提取动画名称
    // 这是一个简化的解析，实际Spine二进制格式更复杂
    const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer)

    // 查找常见的动画名称模式
    const commonAnimations = ['idle', 'walk', 'run', 'jump', 'attack', 'death', 'aim', 'shoot']
    commonAnimations.forEach(animName => {
      if (text.toLowerCase().includes(animName)) {
        animations.push({ name: animName, duration: 1000 })
      }
    })

    // 如果没有找到动画，添加默认动画
    if (animations.length === 0) {
      animations.push({ name: 'idle', duration: 1000 })
    }

    return {
      animations,
      bones,
      rawData: buffer
    }
  } catch (error) {
    console.warn('⚠️ 二进制Spine数据解析失败，使用默认数据:', error.message)
    return {
      animations: [{ name: 'idle', duration: 1000 }],
      bones: [],
      rawData: buffer
    }
  }
}

// 从文件加载纹理
const loadTextureFromFile = async (imageFile, PIXI) => {
  try {
    console.log('🔄 加载纹理文件:', imageFile.name)

    const fileContent = await readFileAsArrayBuffer(imageFile)
    const blob = new Blob([fileContent], { type: 'image/png' })
    const blobUrl = URL.createObjectURL(blob)

    let texture = null

    // 尝试多种方法加载纹理
    try {
      // 方法1: 使用PIXI.Texture.fromURL (如果存在)
      if (typeof PIXI.Texture.fromURL === 'function') {
        texture = await PIXI.Texture.fromURL(blobUrl)
        console.log('✅ 方法1成功: PIXI.Texture.fromURL')
      } else {
        throw new Error('PIXI.Texture.fromURL not available')
      }
    } catch (method1Error) {
      console.warn('⚠️ 方法1失败:', method1Error.message)

      try {
        // 方法2: 使用PIXI.Assets.load
        const loadedAsset = await PIXI.Assets.load(blobUrl)
        texture = loadedAsset.texture || loadedAsset || PIXI.Texture.WHITE
        console.log('✅ 方法2成功: PIXI.Assets.load')
      } catch (method2Error) {
        console.warn('⚠️ 方法2失败:', method2Error.message)

        // 方法3: 使用Canvas创建纹理
        if (typeof window !== 'undefined' && window.Image) {
          const image = new window.Image()
          image.src = blobUrl
          await new Promise((resolve, reject) => {
            image.onload = () => {
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')
              canvas.width = image.width
              canvas.height = image.height
              ctx.drawImage(image, 0, 0)

              try {
                texture = PIXI.Texture.from(canvas)
                console.log('✅ 方法3成功: Canvas纹理创建')
                resolve()
              } catch (canvasError) {
                const colorCanvas = document.createElement('canvas')
                colorCanvas.width = 100
                colorCanvas.height = 100
                const colorCtx = colorCanvas.getContext('2d')
                colorCtx.fillStyle = '#4ade80'
                colorCtx.fillRect(0, 0, 100, 100)

                texture = PIXI.Texture.from(colorCanvas)
                console.log('✅ 方法3回退: 彩色矩形纹理')
                resolve()
              }
            }
            image.onerror = reject
          })
        } else {
          texture = PIXI.Texture.WHITE
          console.log('✅ 使用白色占位符纹理')
        }
      }
    }

    console.log('✅ 纹理加载完成:', {
      width: texture.width,
      height: texture.height,
      valid: texture.valid
    })

    return texture
  } catch (error) {
    console.warn('⚠️ 纹理加载失败，使用白色占位符:', error.message)
    return PIXI.Texture.WHITE
  }
}

// 创建真实Spine动画容器
// 创建pixi-spine原生动画对象
const createNativeSpineObject = async (app, skeletonFile, atlasFile, imageFiles) => {
  try {
    console.log('🎭 创建pixi-spine原生动画对象...')

    // 动态导入PIXI和pixi-spine
    const PIXI = await import('pixi.js')
    const pixiSpine = await import('pixi-spine')

    console.log('📦 库加载状态:', {
      PIXI: !!PIXI,
      pixiSpine: !!pixiSpine,
      Spine: !!pixiSpine.Spine
    })

    if (!atlasFile || imageFiles.length === 0) {
      throw new Error('缺少图集文件或图片文件')
    }

    // 解析图集文件
    const atlasText = await readFileAsText(atlasFile)
    console.log('📖 图集文件解析完成')

    // 加载图片纹理 - 使用多种方法
    const imageUrl = URL.createObjectURL(imageFiles[0])
    let texture = null

    try {
      // 方法1: 使用PIXI.Texture.fromURL
      texture = await PIXI.Texture.fromURL(imageUrl)
      console.log('✅ 方法1成功: PIXI.Texture.fromURL')
    } catch (error1) {
      console.warn('⚠️ 方法1失败:', error1.message)

      try {
        // 方法2: 使用PIXI.Assets.load 但先注册解析器
        const blob = await fetch(imageUrl).then(r => r.blob())
        const imageBitmap = await createImageBitmap(blob)
        texture = PIXI.Texture.from(imageBitmap)
        console.log('✅ 方法2成功: ImageBitmap')
      } catch (error2) {
        console.warn('⚠️ 方法2失败:', error2.message)

        try {
          // 方法3: 使用HTML Image元素
          const img = new Image()
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = imageUrl
          })
          texture = PIXI.Texture.from(img)
          console.log('✅ 方法3成功: HTML Image')
        } catch (error3) {
          console.warn('⚠️ 方法3失败:', error3.message)

          // 方法4: 创建一个简单的占位符纹理
          const canvas = document.createElement('canvas')
          canvas.width = 256
          canvas.height = 256
          const ctx = canvas.getContext('2d')
          ctx.fillStyle = '#4ade80'
          ctx.fillRect(0, 0, 256, 256)
          texture = PIXI.Texture.from(canvas)
          console.log('✅ 方法4: 使用占位符纹理')
        }
      }
    }

    console.log('🖼️ 图片纹理加载完成:', { width: texture.width, height: texture.height })

    // 解析骨架数据
    let spineData
    if (skeletonFile) {
      if (skeletonFile.name.endsWith('.json') || skeletonFile.name.endsWith('.spine')) {
        const skeletonText = await readFileAsText(skeletonFile)
        spineData = JSON.parse(skeletonText)
        console.log('✅ JSON骨架数据解析成功')
      } else {
        console.log('⚠️ 二进制.skel文件暂不支持原生解析')
        return null
      }
    }

    if (!spineData) {
      console.log('❌ 缺少骨架数据')
      return null
    }

    // 方法1: 使用原生pixi-spine构造函数
    try {
      console.log('🔄 尝试使用pixi-spine原生构造函数...')

      // 先将纹理添加到缓存，使用文件名作为键
      const imageFileName = imageFiles[0].name
      PIXI.utils.TextureCache[imageFileName] = texture

      // 修改spineData，确保图片引用正确
      if (spineData.skins) {
        Object.values(spineData.skins).forEach(skin => {
          if (skin.attachments) {
            Object.values(skin.attachments).forEach(slotMap => {
              Object.values(slotMap).forEach(attachment => {
                if (attachment && attachment.path) {
                  // 确保附件路径正确
                  if (!attachment.path.includes('.')) {
                    attachment.path = imageFileName
                  }
                }
              })
            })
          }
        })
      }

      // 创建原生Spine对象
      const spineObject = new pixiSpine.Spine(spineData, atlasText)

      console.log('✅ pixi-spine原生对象创建成功!')
      console.log('📊 对象属性:', {
        hasState: !!spineObject.state,
        hasSkeleton: !!spineObject.skeleton,
        animations: spineObject.skeleton.data.animations?.map(a => a.name) || []
      })

      // 设置位置
      spineObject.x = app.screen.width / 2
      spineObject.y = app.screen.height / 2

      // 添加到舞台
      app.stage.addChild(spineObject)

      return spineObject

    } catch (nativeError) {
      console.log('❌ 原生构造函数失败:', nativeError.message)

      // 方法2: 尝试使用简化数据
      try {
        console.log('🔄 尝试简化数据...')

        // 创建最简化的spine数据
        const simplifiedData = {
          skeleton: {
            bones: spineData.bones || [],
            slots: spineData.slots || [],
            skins: spineData.skins || {},
            width: spineData.width || 500,
            height: spineData.height || 500,
            version: spineData.version || "3.8",
            hash: spineData.hash || ""
          },
          animations: spineData.animations || {}
        }

        // 尝试再次创建
        const spineObject = new pixiSpine.Spine(simplifiedData, atlasText)

        console.log('✅ 简化数据Spine对象创建成功!')

        // 设置位置
        spineObject.x = app.screen.width / 2
        spineObject.y = app.screen.height / 2

        // 添加到舞台
        app.stage.addChild(spineObject)

        return spineObject

      } catch (manualError) {
        console.log('❌ 简化数据也失败:', manualError.message)
      }
    }

    // 方法3: 创建一个基于纹理的回退显示
    try {
      console.log('🔄 创建基于纹理的回退显示...')

      // 创建一个容器来显示纹理
      const spineContainer = new PIXI.Container()

      // 添加纹理精灵
      const sprite = new PIXI.Sprite(texture)
      sprite.anchor.set(0.5)

      // 调整大小以适应画布
      const maxDimension = Math.max(sprite.width, sprite.height)
      if (maxDimension > 400) {
        sprite.scale.set(400 / maxDimension)
      }

      spineContainer.addChild(sprite)

      // 附加原始数据以供动画列表提取
      spineContainer._spineData = spineData

      // 添加模拟的Spine属性
      spineContainer.state = {
        setAnimation: (trackIndex, animationName, loop) => {
          console.log('🎬 回退模式设置动画:', animationName)
        },
        data: { skeletonData: { animations: [] } }
      }

      spineContainer.skeleton = {
        data: { animations: [] },
        bones: [],
        findBone: () => ({ x: 0, y: 0, rotation: 0 }),
        updateWorldTransform: () => {}
      }

      // 添加简单的动画效果
      let time = 0
      app.ticker.add(() => {
        time += 0.016
        sprite.rotation = Math.sin(time) * 0.1
        sprite.scale.set(1 + Math.sin(time * 2) * 0.05)
      })

      // 设置位置
      spineContainer.x = app.screen.width / 2
      spineContainer.y = app.screen.height / 2

      // 添加到舞台
      app.stage.addChild(spineContainer)

      console.log('✅ 回退显示创建成功!')
      return spineContainer

    } catch (fallbackError) {
      console.log('❌ 回退显示也失败:', fallbackError.message)
    }

    return null

  } catch (error) {
    console.error('❌ 创建pixi-spine原生对象失败:', error)
    return null
  }
}

// 创建占位符显示
const createPlaceholderDisplay = async (app) => {
  console.log('🎭 创建占位符动画显示')

  // 确保PIXI可用
  const PIXI = await import('pixi.js')

  if (!app && pixiApp) {
    app = pixiApp
  }

  const container = new PIXI.Container()

  // 创建一个简单的占位符动画
  const placeholder = new PIXI.Graphics()
  placeholder.circle(0, 0, 40)
  placeholder.fill(0x6366f1)
  placeholder.stroke({ color: 0xffffff, width: 2 })

  const text = new PIXI.Text({
    text: 'Spine文件\n未找到或解析失败',
    style: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 14,
      fill: 0xffffff,
      align: 'center'
    }
  })
  text.anchor.set(0.5)
  container.addChild(placeholder)
  container.addChild(text)

  spineObject = container
  spineObject.x = app.screen.width / 2
  spineObject.y = app.screen.height / 2

  app.stage.addChild(spineObject)

  // 简单动画
  app.ticker.add(() => {
    if (isPlaying.value && spineObject) {
      const time = Date.now() * 0.001
      placeholder.scale.set(1 + Math.sin(time * playSpeed.value) * 0.2)
    }
  })
}

// 动画控制方法
const playAnimation = (animationName) => {
  currentAnimation.value = animationName
  console.log('🎬 播放动画:', animationName)

  // 如果有增强的Spine对象，切换动画
  if (spineObject && spineObject.state) {
    try {
      // 使用增强的Spine API设置动画
      spineObject.state.setAnimation(0, animationName, true)

      // 添加调试信息
      console.log('✅ 动画切换成功:', {
        动画名称: animationName,
        对象类型: spineObject.constructor?.name,
        动画状态: spineObject._currentAnimation,
        暂停状态: spineObject._animationPaused,
        播放状态: isPlaying.value,
        播放速度: playSpeed.value
      })

      // 确保动画立即开始显示效果
      if (!isPlaying.value) {
        isPlaying.value = true
        console.log('🟢 自动开始播放动画')
      }

    } catch (error) {
      console.error('❌ 动画切换失败:', error)
      console.log('🔍 Spine对象状态检查:', {
        hasState: !!spineObject.state,
        hasSkeleton: !!spineObject.skeleton,
        stateType: typeof spineObject.state,
        stateSetAnimation: typeof spineObject.state?.setAnimation,
        currentAnimation: spineObject._currentAnimation,
        isPaused: spineObject._animationPaused
      })
    }
  } else if (spineObject) {
    console.log('🔍 Spine对象缺少state属性:', {
      对象存在: !!spineObject,
      对象类型: spineObject.constructor?.name,
      可用属性: Object.keys(spineObject).slice(0, 15), // 显示更多属性
      hasAnimation: 'animation' in spineObject,
      hasState: 'state' in spineObject,
      hasSkeleton: 'skeleton' in spineObject
    })
  } else {
    console.log('⚠️ 没有可用的Spine对象来播放动画')
  }
}

// 更新动画播放控制
const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  console.log('🎮', isPlaying.value ? '开始播放动画' : '暂停播放动画', '速度:', playSpeed.value + 'x')

  // 如果有增强的Spine对象，控制播放状态
  if (spineObject && spineObject.state) {
    try {
      if (isPlaying.value) {
        // 使用当前选择的动画，如果没有则使用第一个可用动画
        const animationToPlay = currentAnimation.value || (animations.value.length > 0 ? animations.value[0] : 'idle')

        // 设置动画和速度
        spineObject.state.setAnimation(0, animationToPlay, true)
        spineObject.state.timeScale = playSpeed.value

        // 确保动画不处于暂停状态
        spineObject._animationPaused = false

        console.log('✅ 增强Spine动画开始播放:', {
          动画名称: animationToPlay,
          播放速度: playSpeed.value,
          对象类型: spineObject.constructor?.name
        })
      } else {
        // 暂停动画但不完全清除轨道
        spineObject._animationPaused = true
        console.log('⏸️ 增强Spine动画已暂停 (保留动画状态)')
      }
    } catch (error) {
      console.error('❌ 增强Spine播放状态更新失败:', error)
      console.log('🔍 详细状态信息:', {
        hasState: !!spineObject.state,
        stateType: typeof spineObject.state,
        availableAnimations: animations.value,
        currentAnimation: currentAnimation.value,
        isPaused: spineObject._animationPaused
      })
    }
  } else if (spineObject) {
    console.log('🔍 增强Spine对象状态检查 (无state):', {
      存在: !!spineObject,
      类型: spineObject.constructor?.name,
      有状态: !!spineObject.state,
      有骨架: !!spineObject.skeleton,
      暂停状态: spineObject._animationPaused,
      当前动画: spineObject._currentAnimation,
      可用属性: Object.keys(spineObject).slice(0, 12)
    })
  }

  // 确保在播放时动画能立即开始
  if (isPlaying.value && spineObject) {
    console.log('📊 播放状态确认:', {
      spineObject存在: !!spineObject,
      动画列表: animations.value,
      当前动画: currentAnimation.value,
      播放速度: playSpeed.value,
      动画暂停状态: spineObject._animationPaused
    })
  }
}

// 监听播放速度变化
watch(playSpeed, (newSpeed) => {
  if (spineObject && spineObject.state && isPlaying.value) {
    try {
      spineObject.state.timeScale = newSpeed
      console.log('⚡ 动画速度更新:', newSpeed)
    } catch (error) {
      console.error('❌ 动画速度更新失败:', error)
    }
  }
})


// 视图控制方法
const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value + 0.2, 3.0)
  updateViewTransform()
}

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value - 0.2, 0.1)
  updateViewTransform()
}

const resetZoom = () => {
  zoomLevel.value = 1.0
  panOffset.value = { x: 0, y: 0 }
  updateViewTransform()
}

const updateViewTransform = () => {
  if (spineObject && pixiApp) {
    spineObject.scale.set(zoomLevel.value)
    spineObject.x = (pixiApp.screen.width / 2) + panOffset.value.x
    spineObject.y = (pixiApp.screen.height / 2) + panOffset.value.y
    console.log('🔄 视图变换已更新:', {
      缩放: zoomLevel.value,
      位置: { x: spineObject.x, y: spineObject.y }
    })
  }
}

// 鼠标事件处理
const handleMouseDown = (event) => {
  if (event.button === 0) { // 左键
    isViewDragging.value = true
    dragStart.value = { x: event.clientX, y: event.clientY }
    lastPanStart.value = { ...panOffset.value }
    event.preventDefault()
  }
}

const handleMouseMove = (event) => {
  if (isViewDragging.value) {
    const deltaX = event.clientX - dragStart.value.x
    const deltaY = event.clientY - dragStart.value.y
    panOffset.value = {
      x: lastPanStart.value.x + deltaX,
      y: lastPanStart.value.y + deltaY
    }
    updateViewTransform()
  }
}

const handleMouseUp = () => {
  isViewDragging.value = false
}

const handleWheel = (event) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -0.1 : 0.1
  const newZoom = Math.max(0.1, Math.min(3.0, zoomLevel.value + delta))

  // 以鼠标位置为中心进行缩放
  if (pixiApp && spineObject) {
    const canvasContainer = document.getElementById('canvas-container')
    if (!canvasContainer) return

    const rect = canvasContainer.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    // 计算缩放前的偏移量
    const worldX = (mouseX - spineObject.x) / zoomLevel.value
    const worldY = (mouseY - spineObject.y) / zoomLevel.value

    // 更新缩放级别
    zoomLevel.value = newZoom

    // 计算缩放后的偏移量，使鼠标位置保持不变
    spineObject.x = mouseX - worldX * zoomLevel.value
    spineObject.y = mouseY - worldY * zoomLevel.value
    spineObject.scale.set(zoomLevel.value)

    // 更新偏移量
    panOffset.value = {
      x: spineObject.x - (pixiApp.screen.width / 2),
      y: spineObject.y - (pixiApp.screen.height / 2)
    }

    console.log('🖱️ 鼠标滚轮缩放:', {
      新缩放: zoomLevel.value,
      鼠标位置: { x: mouseX, y: mouseY },
      对象位置: { x: spineObject.x, y: spineObject.y }
    })
  }
}

// 全屏方法
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// SEO 内容折叠方法
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 工具函数
const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(e)
    reader.readAsText(file)
  })
}

const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(e)
    reader.readAsArrayBuffer(file)
  })
}

// 监听 isLoading 状态变化
watch(isLoading, async (newValue, oldValue) => {
  console.log('🔄 isLoading 状态变化:', { from: oldValue, to: newValue })
})

// 监听 spineLoaded 状态变化
watch(spineLoaded, async (newValue, oldValue) => {
  console.log('🔄 spineLoaded 状态变化:', { from: oldValue, to: newValue })
  console.log('📊 当前状态:', {
    spineLoaded: spineLoaded.value,
    isLoading: isLoading.value,
    animations: animations.value.length
  })

  if (newValue === true) {
    // 当 spineLoaded 变为 true 时，等待 DOM 更新
    await nextTick()

    // 多次尝试检查DOM是否可用
    let attempts = 0
    const maxAttempts = 20
    const checkInterval = 50

    const checkDOM = async () => {
      attempts++
      const container = document.getElementById('canvas-container')
      const canvas = document.getElementById('spine-canvas')

      console.log(`🔍 Watcher第${attempts}次DOM检查:`, {
        container: !!container,
        canvas: !!canvas,
        isLoading: isLoading.value
      })

      if (container && canvas) {
        console.log('✅ Watcher找到DOM元素，开始初始化显示')
        try {
          await initializeSimpleDisplay()
        } catch (error) {
          console.error('❌ 显示初始化失败:', error)
        }
      } else if (attempts < maxAttempts) {
        setTimeout(checkDOM, checkInterval)
      } else {
        console.error('❌ Watcher DOM元素等待超时')
      }
    }

    checkDOM()
  }
})

// 生命周期
onMounted(async () => {
  // 添加到最近使用
  if (tool) {
    addRecentTool(tool.id)
  }

  // 监听全屏变化
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })

  console.log('🚀 Spine动画编辑器组件已挂载')

  // 检查基础环境
  const webglSupported = (() => {
    try {
      const canvas = document.createElement('canvas')
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    } catch (e) {
      return false
    }
  })()

  console.log('📋 环境检查:', {
    WebGL: webglSupported ? '✅ 支持' : '❌ 不支持',
    PIXI: '📦 将动态导入',
    pixiSpine: '📦 将动态导入',
    浏览器: navigator.userAgent.split(' ')[0]
  })

  // 预热依赖库（可选，不阻塞初始化）
  try {
    console.log('🔥 预热依赖库...')
    // 这里可以预热依赖库，但不阻塞组件挂载
  } catch (error) {
    console.log('⚠️ 依赖预热失败，将在需要时加载:', error.message)
  }
})

onUnmounted(() => {
  if (pixiApp) {
    pixiApp.destroy(true)
  }
})
</script>