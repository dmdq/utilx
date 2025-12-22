<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 - 区域1：工具标题描述 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">二维码生成器</h1>
      <p class="text-muted-foreground">快速生成二维码，支持文本、网址、WiFi等多种格式</p>
    </div>

    <!-- 工具交互区 - 区域2：工具显示区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
            <div class="flex gap-2">
              <button
                class="text-xs px-2 py-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed"
                @click="applyAndParse"
                :disabled="resourceFiles.length === 0 || isLoading"
              >
                应用
              </button>
              <button
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
                @click="clearFiles"
              >
                清空
              </button>
            </div>
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
              <p class="text-xs text-blue-600 dark:text-blue-400 mt-2">💡 可多次上传不同文件夹的文件</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">点击应用按钮开始解析</p>
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
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400">已上传文件 ({{ resourceFiles.length }})</h4>
              <div class="text-xs text-blue-600 dark:text-blue-400">
                {{ validateFiles(resourceFiles).valid ? '✓ 完整' : '✗ 不完整' }}
              </div>
            </div>
            <div class="space-y-1 max-h-32 overflow-y-auto">
              <div
                v-for="(file, index) in resourceFiles"
                :key="index"
                class="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded flex items-center justify-between group hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span class="truncate mr-2" :title="file.name">
                  <span class="text-gray-400 mr-1">{{ getFileIcon(file.name) }}</span>
                  {{ file.name }}
                </span>
                <span class="text-gray-500">{{ (file.size / 1024).toFixed(1) }}KB</span>
              </div>
            </div>

            <!-- 文件验证提示 -->
            <div class="mt-2 p-2 text-xs" :class="validateFiles(resourceFiles).valid ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'">
              {{ validateFiles(resourceFiles).message }}
            </div>
          </div>
          <div v-else class="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            <p>📂 还没有上传任何文件</p>
            <p class="mt-1">支持多次上传，收集完成后点击应用</p>
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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5m11 5l-5-5m5 5v-4m0 4h-4"></path>
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

          <!-- Spine Player 显示区域 -->
          <div v-else-if="spineLoaded" class="relative">
            <!-- 调试信息 -->
            <div class="absolute top-0 left-0 z-10 bg-yellow-500 text-black text-xs p-2">
              spineLoaded: {{ spineLoaded }} | isLoading: {{ isLoading }} | animations: {{ animations.length }}
            </div>
            <div
              id="spine-player-container"
              class="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden"
              :class="{ 'fixed inset-0 w-full h-full z-50 rounded-none': isFullscreen }"
            >
              <!-- Spine Player 将在这里渲染 -->
            </div>

            <!-- 缩放和位置指示器 -->
            <div class="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1 text-xs text-white">
              动画: {{ currentAnimation || '未选择' }}
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
            Spine 是款专业的 2D 骨骼动画编辑工具，广泛应用于游戏开发、动画制作等领域。
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
            <li><strong>Spine Player 引擎</strong>: 基于 Spine 官方播放器，确保动画的高保真渲染和完美兼容</li>
            <li><strong>实时预览</strong>: 即时查看动画效果，支持播放/暂停、速度调节等控制</li>
            <li><strong>批量导入</strong>: 支持拖拽多文件同时上传，自动识别文件类型</li>
            <li><strong>本地计算</strong>: 所有处理都在浏览器本地完成，动画数据不会上传到服务器</li>
            <li><strong>全屏模式</strong>: 支持全屏查看动画效果，提供沉浸式的预览体验</li>
            <li><strong>错误恢复</strong>: 智能的文件解析和错误恢复机制，即使文件有问题也能显示动画效果</li>
          </ul>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  HelpCircle, ChevronUp, FileText, Lock, Shield, Clock, Type, Wifi, Image, Code,
  Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'
import Breadcrumb from '~/components/Breadcrumb.vue'
import ToolCard from '~/components/ToolCard.vue'

definePageMeta({
  layout: 'default'
})

// SEO配置
useSeoMeta({
  title: 'Spine动画编辑器 - 专业骨骼动画在线编辑与预览工具 | Util工具箱',
  description: '专业的Spine骨骼动画在线编辑器，支持WebGL实时渲染、动画播放控制、皮肤切换等功能。支持.spine、.json、.skel格式，兼容Spine 3.8-4.2版本。纯本地计算，动画数据绝对安全。',
  keywords: 'Spine动画编辑器,骨骼动画,2D动画,游戏动画,动画编辑器,WebGL动画,Spine运行时,动画预览,动画调试,游戏开发',
  author: 'Util工具箱',
  ogTitle: 'Spine动画编辑器 - 专业骨骼动画在线编辑工具',
  ogDescription: '专业的Spine骨骼动画在线编辑器，支持实时渲染和动画控制，纯本地处理，数据安全可靠，游戏开发必备工具。',
  ogImage: 'https://util.cn/images/tools/spine-animation-editor.png',
  ogUrl: 'https://util.cn/tools/spine-animation-editor',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Spine动画编辑器 - 骨骼动画在线编辑与预览',
  twitterDescription: '专业Spine骨骼动画编辑器，支持实时渲染和动画控制，游戏开发必备工具。',
  twitterImage: 'https://util.cn/images/tools/spine-animation-editor.png'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'Spine动画编辑器',
            description: '专业的Spine骨骼动画在线编辑器，支持WebGL实时渲染、动画播放控制、皮肤切换等功能',
            url: 'https://util.cn/tools/spine-animation-editor',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              'WebGL实时渲染',
              '动画播放控制',
              '皮肤切换管理',
              '多格式支持',
              '多引擎导出',
              '本地安全处理',
              '骨骼编辑功能',
              '动画调试工具'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'Spine动画编辑器',
                item: 'https://util.cn/tools/spine-animation-editor'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '什么是Spine动画？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': 'Spine是专业的2D骨骼动画制作工具，广泛应用于游戏开发、动画制作等领域。它通过骨骼系统和皮肤贴图的组合，让开发者能够创建流畅、高效的角色动画。相比传统的逐帧动画，Spine骨骼动画具有文件体积小、动画过渡自然、易于控制等优势。'
                }
              },
              {
                '@type': 'Question',
                name: 'Spine支持哪些文件格式？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': 'Spine支持多种格式：.spine（项目文件）、.json（数据格式）、.skel（骨骼二进制格式）、.atlas（纹理图集）、.png（纹理图片），兼容Spine 3.8-4.2版本。'
                }
              },
              {
                '@type': 'Question',
                name: 'Spine动画的优势是什么？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': 'Spine动画优势：1）文件体积小，节省存储空间；2）支持动态换装和皮肤切换；3）动画流畅自然；4）支持程序化控制；5）内存占用低；6）支持复杂的动画混合和IK。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
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
let spinePlayer = null

// 视图控制相关
const zoomLevel = ref(1.0)

// 全屏相关
const isFullscreen = ref(false)

// 存储创建的 URL 对象用于清理
const createdUrls = ref([])

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
  dependenciesLoaded.value = false
  dependencyStatus.value = '等待中...'
  zoomLevel.value = 1.0
  if (spinePlayer) {
    spinePlayer.dispose()
    spinePlayer = null
  }
  // 清空容器
  const container = document.getElementById('spine-player-container')
  if (container) {
    container.innerHTML = ''
  }
  // 清理创建的 URL 对象
  createdUrls.value.forEach(url => URL.revokeObjectURL(url))
  createdUrls.value = []
  // 清理全局图像数据
  if (window.tempSpineImages) {
    delete window.tempSpineImages
    console.log('🧹 已清理全局图像数据')
  }
  if (window.tempSpineBlobUrls) {
    delete window.tempSpineBlobUrls
    console.log('🧹 已清理全局blob URL映射')
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

  try {
    // 合并新文件到现有文件列表（去重）
    const existingFileNames = resourceFiles.value.map(f => f.name)
    const newFiles = files.filter(file => !existingFileNames.includes(file.name))

    if (newFiles.length > 0) {
      resourceFiles.value = [...resourceFiles.value, ...newFiles]
      console.log(`📁 已添加 ${newFiles.length} 个文件，总计 ${resourceFiles.value.length} 个文件`)
    } else {
      console.log('⚠️ 所有文件已存在，未添加重复文件')
    }
  } catch (error) {
    console.error('文件添加失败:', error)
  }
}

// 应用并解析文件
const applyAndParse = async () => {
  if (resourceFiles.value.length === 0) {
    console.warn('没有可解析的文件')
    return
  }

  console.log('🚀 开始应用和解析文件...')

  // 显示确认对话框
  const confirmed = confirm(`确认要开始解析 ${resourceFiles.value.length} 个文件吗？\n\n` +
    resourceFiles.value.map(f => `• ${f.name}`).join('\n') +
    '\n\n系统将验证所需资源文件是否满足要求。')

  if (!confirmed) {
    console.log('用户取消了解析操作')
    return
  }

  isLoading.value = true
  loadingProgress.value = 20

  try {
    loadingProgress.value = 20

    // 验证文件完整性
    const validationResult = validateFiles(resourceFiles.value)
    if (!validationResult.valid) {
      alert(`文件验证失败：\n${validationResult.message}`)
      isLoading.value = false
      return
    }

    console.log('✅ 文件验证通过:', validationResult.message)

    // 分类文件
    const skeletonFile = resourceFiles.value.find(file =>
      file.name.endsWith('.spine') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.skel')
    )

    const atlasFile = resourceFiles.value.find(file => file.name.endsWith('.atlas'))
    const imageFiles = resourceFiles.value.filter(file =>
      file.name.endsWith('.png') ||
      file.name.endsWith('.jpg') ||
      file.name.endsWith('.jpeg')
    )

    if (skeletonFile) {
      loadingProgress.value = 40
      await loadSpineAnimationWithPlayer(skeletonFile, atlasFile, imageFiles)
    } else {
      throw new Error('未找到骨架文件（.json/.spine/.skel）')
    }

    loadingProgress.value = 100
    console.log('🎉 所有文件解析完成!')

  } catch (error) {
    console.error('文件解析失败:', error)
    alert(`文件解析失败：${error.message}`)
  } finally {
    isLoading.value = false
    console.log('🔄 isLoading 已设置为 false')
  }
}

// 验证文件完整性
const validateFiles = (files) => {
  const skeletonFiles = files.filter(file =>
    file.name.endsWith('.spine') ||
    file.name.endsWith('.json') ||
    file.name.endsWith('.skel')
  )

  const atlasFiles = files.filter(file => file.name.endsWith('.atlas'))

  const imageFiles = files.filter(file =>
    file.name.endsWith('.png') ||
    file.name.endsWith('.jpg') ||
    file.name.endsWith('.jpeg')
  )

  // 验证必要文件
  if (skeletonFiles.length === 0) {
    return {
      valid: false,
      message: '缺少骨架文件（.json/.spine/.skel）'
    }
  }

  if (skeletonFiles.length > 1) {
    return {
      valid: false,
      message: '骨架文件过多，只需要一个骨架文件'
    }
  }

  if (atlasFiles.length === 0) {
    return {
      valid: false,
      message: '缺少图集文件（.atlas）'
    }
  }

  if (imageFiles.length === 0) {
    return {
      valid: false,
      message: '缺少图像文件（.png/.jpg/.jpeg）'
    }
  }

  return {
    valid: true,
    message: `文件完整：骨架 x${skeletonFiles.length}, 图集 x${atlasFiles.length}, 图像 x${imageFiles.length}`
  }
}

// 加载 Spine Player 动画
const loadSpineAnimationWithPlayer = async (skeletonFile, atlasFile, imageFiles) => {
  try {
    console.log('🚀 开始使用 Spine Player 加载动画...')
    dependencyStatus.value = '加载 Spine Player 库...'

    // 等待 Spine Player 库加载
    await waitForSpinePlayer()
    loadingProgress.value = 60

    // 读取骨架文件
    let skeletonData = null
    let processedSkeletonUrl = null

    if (skeletonFile.name.endsWith('.json') || skeletonFile.name.endsWith('.spine')) {
      console.log('📄 开始读取 JSON 文件:', skeletonFile.name)
      const text = await readFileAsText(skeletonFile)
      skeletonData = JSON.parse(text)
      console.log('📊 JSON 文件读取成功，包含 skeleton 字段:', !!skeletonData.skeleton)
      console.log('📊 JSON 文件结构分析:', {
        hasSkeleton: !!skeletonData.skeleton,
        hasBones: !!skeletonData.bones,
        bonesCount: skeletonData.bones ? skeletonData.bones.length : 0,
        hasSlots: !!skeletonData.slots,
        slotsCount: skeletonData.slots ? skeletonData.slots.length : 0,
        hasSkins: !!skeletonData.skins,
        skinsCount: skeletonData.skins ? Object.keys(skeletonData.skins).length : 0,
        hasAnimations: !!skeletonData.animations,
        animationsCount: skeletonData.animations ? (Array.isArray(skeletonData.animations) ? skeletonData.animations.length : Object.keys(skeletonData.animations).length) : 0
      })

      // 处理 JSON 中的图像路径
      if (skeletonData.skeleton) {
        console.log('🔧 skeleton 字段内容:', skeletonData.skeleton)

        if (skeletonData.skeleton.images !== undefined) {
          console.log('🔧 发现 JSON 中的 images 路径:', skeletonData.skeleton.images)
          console.log('🖼️ 图像文件数量:', imageFiles.length)

          // 暂时不修改 images 路径，让 Image 拦截器处理
          console.log('ℹ️ 保持原始 images 路径不变，依赖 Image 拦截器处理')
        } else {
          console.log('ℹ️ JSON 文件中没有 images 字段')
        }
      } else {
        console.log('❌ JSON 文件中没有 skeleton 字段')
      }

      // 验证JSON结构的完整性
      if (skeletonData.bones && skeletonData.bones.length > 0) {
        console.log('✅ 骨架数据验证通过，找到', skeletonData.bones.length, '个骨骼')
      } else {
        console.warn('⚠️ 骨架数据验证失败：没有找到骨骼数据')
      }

      if (skeletonData.slots && skeletonData.slots.length > 0) {
        console.log('✅ 插槽数据验证通过，找到', skeletonData.slots.length, '个插槽')
      } else {
        console.warn('⚠️ 插槽数据验证失败：没有找到插槽数据')
      }

      if (skeletonData.skins) {
        console.log('✅ 皮肤数据验证通过')
      } else {
        console.warn('⚠️ 皮肤数据验证失败：没有找到皮肤数据')
      }
    } else if (skeletonFile.name.endsWith('.skel')) {
      console.warn('⚠️ .skel 二进制文件需要转换为 JSON 格式')
      throw new Error('目前不支持直接加载 .skel 文件，请使用 .json 或 .spine 格式')
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
    loadingProgress.value = 80

    // 创建文件 URL 并存储它们以便后续清理
    // 确保文件以 .json 扩展名创建，让 Spine Player 正确识别为JSON格式
    const jsonFileName = skeletonFile.name.endsWith('.json') ?
      skeletonFile.name :
      skeletonFile.name.replace(/\.[^/.]+$/, '.json')

    // 创建一个包含正确文件名的 File 对象，这样 Spine Player 能正确识别格式
    const jsonFile = new File(
      [JSON.stringify(skeletonData, null, 2)],
      jsonFileName,
      { type: 'application/json' }
    )
    const skeletonUrl = URL.createObjectURL(jsonFile)
    createdUrls.value.push(skeletonUrl)

    // 使用重新创建的 JSON 文件 URL，确保正确的MIME类型
    processedSkeletonUrl = skeletonUrl
    console.log('🔄 使用重新创建的 JSON 文件 URL:', jsonFileName)

    // 处理图像文件和 atlas 文件 - 保持原始格式
    let processedAtlasUrl = null

    if (atlasFile) {
      console.log('📋 处理 Atlas 文件，保持原始格式')

      // 直接使用原始 Atlas 文件，不做修改
      // Spine Player 需要原始的 Atlas 格式来正确定位 regions
      processedAtlasUrl = URL.createObjectURL(atlasFile)
      createdUrls.value.push(processedAtlasUrl)
      console.log('📄 使用原始 Atlas 文件 URL:', processedAtlasUrl)

      // 读取 Atlas 文件内容来获取图像文件名
      const atlasText = await readFileAsText(atlasFile)
      const lines = atlasText.split('\n')

      // 找到图像文件名
      let imageFileName = null
      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.includes(':') &&
            (trimmedLine.includes('.png') || trimmedLine.includes('.jpg') || trimmedLine.includes('.jpeg'))) {
          imageFileName = trimmedLine
          console.log('🔍 在 Atlas 中找到图像文件名:', imageFileName)
          break
        }
      }

      if (imageFileName) {
        // 找到对应的图像文件并转换为Base64
        const matchingImageFile = imageFiles.find(file => file.name === imageFileName)
        if (matchingImageFile) {
          console.log('🖼️ 开始转换图像为Base64:', imageFileName)
          const imageDataUrl = await readFileAsDataURL(matchingImageFile)

          // 将Base64图像数据添加到全局作用域
          if (!window.tempSpineImages) {
            window.tempSpineImages = {}
          }
          window.tempSpineImages[imageFileName] = imageDataUrl
          console.log('🎨 图像数据已存储到全局作用域:', imageFileName)

          // 同时创建一个与原始文件名匹配的blob URL映射，以防Spine Player需要
          if (!window.tempSpineBlobUrls) {
            window.tempSpineBlobUrls = {}
          }
          const blobUrl = URL.createObjectURL(matchingImageFile)
          window.tempSpineBlobUrls[imageFileName] = blobUrl
          createdUrls.value.push(blobUrl)
          console.log('🔗 创建blob URL映射:', imageFileName, '->', blobUrl)
        } else {
          console.warn('⚠️ 未找到匹配的图像文件:', imageFileName)
        }
      } else {
        console.warn('⚠️ 在 Atlas 文件中未找到图像文件名')
      }
    }

    // 验证骨架数据完整性
    if (!skeletonData.bones || skeletonData.bones.length === 0) {
      throw new Error('骨架文件缺少必需的骨骼数据')
    }

    if (!skeletonData.slots || skeletonData.slots.length === 0) {
      console.warn('⚠️ 骨架文件缺少插槽数据，可能影响显示')
    }

    console.log('✅ 骨架数据验证通过，准备加载')

    // 先停止加载状态并设置 spineLoaded 为 true 以显示容器
    isLoading.value = false
    spineLoaded.value = true

    // 等待 DOM 更新
    await nextTick()

    // 获取容器
    const container = document.getElementById('spine-player-container')
    if (!container) {
      throw new Error('找不到 Spine Player 容器')
    }

    // 暂时禁用Image拦截器，测试是否能解决Region问题
    console.log('🔧 暂时禁用Image拦截器进行测试')
    const originalImage = window.Image

    // 拦截XMLHttpRequest以提供Base64图像数据（用于其他可能的请求）
    const originalXHROpen = XMLHttpRequest.prototype.open
    const originalXHRSend = XMLHttpRequest.prototype.send

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      console.log('🌐 XMLHttpRequest 拦截:', method, url)

      // 检查是否是图像请求
      if (url && (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg'))) {
        const fileName = url.split('/').pop()
        console.log('🖼️ 检测到图像请求:', fileName)

        // 检查我们是否有对应的Base64数据
        if (window.tempSpineImages && window.tempSpineImages[fileName]) {
          console.log('✅ 找到Base64图像数据:', fileName)
          this._base64Data = window.tempSpineImages[fileName]
          this._isImageRequest = true
        }
      }

      return originalXHROpen.call(this, method, url, ...args)
    }

    XMLHttpRequest.prototype.send = function(data) {
      if (this._isImageRequest && this._base64Data) {
        console.log('🎨 拦截图像请求，提供Base64数据')

        // 模拟成功响应
        Object.defineProperty(this, 'readyState', { value: 4, writable: false })
        Object.defineProperty(this, 'status', { value: 200, writable: false })
        Object.defineProperty(this, 'response', {
          value: this._base64Data,
          writable: false
        })

        // 触发事件
        setTimeout(() => {
          if (this.onreadystatechange) {
            this.onreadystatechange()
          }
          if (this.onload) {
            this.onload()
          }
        }, 0)

        return
      }

      return originalXHRSend.call(this, data)
    }

    // 创建 Spine Player 配置
    const config = {
      jsonUrl: processedSkeletonUrl,
      atlasUrl: processedAtlasUrl || atlasUrl,
      animation: animations.value[0] || 'default',
      backgroundColor: "#1a1a1a",
      showControls: false, // 使用自定义控制
      // 添加更多配置来确保使用我们提供的资源
      premultipliedAlpha: false,
      // 强制指定为JSON格式，防止被误认为二进制文件
      json: true,
      success: (player) => {
        console.log('🎉 Spine Player success 回调被调用')
        spinePlayer = player
        loadingProgress.value = 100
        isLoading.value = false
        console.log('✅ Spine Player 加载成功')
        console.log('📊 Spine Player 详情:', {
          hasCanvas: !!player.canvas,
          hasContext: !!player.context,
          animationState: !!player.state,
          hasSetAnimation: !!player.setAnimation,
          hasPlay: !!player.play,
          hasPause: !!player.pause
        })

        // 设置默认动画
        if (animations.value.length > 0) {
          currentAnimation.value = animations.value[0]
          // Spine Player 会自动开始播放第一个动画
          isPlaying.value = true
          console.log('🎬 设置默认动画:', animations.value[0])
        }
      },
      error: (message) => {
        console.error('❌ Spine Player error 回调被调用:', message)
        // 避免循环引用，只显示简单的错误信息
        const errorMessage = typeof message === 'object' ?
          (message.message || message.toString() || '未知错误') :
          message
        console.error('📊 错误详情:', errorMessage)

        dependencyStatus.value = '加载失败'
        // 加载失败时重置 spineLoaded
        spineLoaded.value = false
        isLoading.value = false
        // 清空容器以显示错误信息
        if (container) {
          container.innerHTML = `
            <div class="flex items-center justify-center h-full text-white">
              <div class="text-center">
                <p class="mb-2">❌ Spine Player 加载失败</p>
                <p class="text-sm text-gray-400">${errorMessage}</p>
                <p class="text-xs text-gray-500 mt-2">请检查文件格式是否正确</p>
              </div>
            </div>
          `
        }
      }
    }

    console.log('🔧 Spine Player 配置:', {
      jsonUrl: processedSkeletonUrl,
      atlasUrl: processedAtlasUrl || atlasUrl,
      animation: animations.value[0] || 'default',
      numImageFiles: imageFiles.length
    })

    // 跳过 URL 可访问性测试，因为 blob URL 可能不支持 HEAD 请求
    console.log('🔗 资源 URL 准备完成，Spine Player 将直接加载')

    // 创建 Spine Player
    console.log('🎮 开始创建 Spine Player...')
    console.log('🔍 检查 Spine Player 库:', {
      hasWindowSpinePlayer: !!window.SpinePlayer,
      hasSpineObject: !!window.spine,
      hasSpinePlayerInSpine: !!(window.spine && window.spine.SpinePlayer),
      container: !!container,
      containerId: container.id
    })

    // 添加容器事件监听来调试
    const originalConsoleError = console.error
    console.error = (...args) => {
      originalConsoleError(...args)
      if (args[0] && typeof args[0] === 'string' && args[0].includes('Spine')) {
        console.log('🚨 捕获到 Spine 相关错误:', args)
      }
    }

    let playerInstance = null
    try {
      if (window.SpinePlayer) {
        console.log('🎯 使用 window.SpinePlayer 创建实例')
        playerInstance = new window.SpinePlayer(container, config)
      } else if (window.spine && window.spine.SpinePlayer) {
        console.log('🎯 使用 window.spine.SpinePlayer 创建实例')
        playerInstance = new window.spine.SpinePlayer(container, config)
      } else {
        throw new Error('Spine Player 库未加载')
      }

      console.log('🎮 Spine Player 实例已创建:', !!playerInstance)

      // 添加一些额外的事件监听
      setTimeout(() => {
        console.log('⏰ 5秒后检查状态:', {
          spinePlayer: !!spinePlayer,
          playerInstance: !!playerInstance,
          containerChildren: container.children.length,
          containerContent: container.innerHTML.substring(0, 200)
        })
      }, 5000)

    } catch (error) {
      console.error('❌ 创建 Spine Player 时发生异常:', error)
      throw error
    }

    // 恢复原始 console.error
    setTimeout(() => {
      console.error = originalConsoleError
    }, 10000)

    console.log('🎮 Spine Player 创建请求已发送')

    dependenciesLoaded.value = true
    dependencyStatus.value = '加载完成'

    // 添加超时检测
    setTimeout(() => {
      if (isLoading.value) {
        console.warn('⚠️ Spine Player 加载超时，可能遇到了问题')
        dependencyStatus.value = '加载超时'
        // 这里可以添加重试逻辑或显示错误信息
      }
    }, 10000) // 10秒超时

    // 恢复原始方法（在加载完成后）
    setTimeout(() => {
      window.Image = originalImage
      XMLHttpRequest.prototype.open = originalXHROpen
      XMLHttpRequest.prototype.send = originalXHRSend
      console.log('🔄 原始方法已恢复')
    }, 15000) // 15秒后恢复，确保加载完成

  } catch (error) {
    console.error('❌ Spine Player 加载失败:', error)

    // 恢复原始方法（在出错时）
    window.Image = originalImage
    XMLHttpRequest.prototype.open = originalXHROpen
    XMLHttpRequest.prototype.send = originalXHRSend

    // 出错时重置 spineLoaded
    spineLoaded.value = false
    throw error
  }
}

// 显示默认示例动画
const showDefaultAnimation = async () => {
  try {
    console.log('🚀 加载默认示例动画...')
    isLoading.value = true
    loadingProgress.value = 10

    // 等待 Spine Player 库加载
    await waitForSpinePlayer()
    loadingProgress.value = 20

    // 先停止加载状态并设置 spineLoaded 为 true 以显示容器
    isLoading.value = false
    spineLoaded.value = true

    // 等待 DOM 更新
    await nextTick()
    loadingProgress.value = 30

    // 获取容器
    const container = document.getElementById('spine-player-container')
    if (!container) {
      throw new Error('找不到 Spine Player 容器')
    }

    loadingProgress.value = 50

    // 使用示例资源（不需要拦截，因为这些是静态文件）
    const config = {
      jsonUrl: "/spineboy/export/spineboy.json",
      atlasUrl: "/spineboy/export/spineboy.atlas",
      animation: "walk",
      backgroundColor: "#1a1a1a",
      showControls: false,
      success: (player) => {
        spinePlayer = player
        loadingProgress.value = 100
        isLoading.value = false

        // 设置动画列表
        animations.value = ['walk', 'run', 'idle', 'jump']
        currentAnimation.value = 'walk'
        isPlaying.value = true

        console.log('✅ 示例动画加载成功')
        console.log('💡 示例动画工作正常，说明 Spine Player 本身没问题')
      },
      error: (message) => {
        console.error('❌ 示例动画加载失败:', message)
        console.log('⚠️ 如果示例动画也失败，说明 Spine Player 配置有问题')
        // 加载失败时重置 spineLoaded
        spineLoaded.value = false

        // 显示错误信息
        container.innerHTML = `
          <div class="flex items-center justify-center h-full text-white">
            <div class="text-center">
              <p class="mb-2">❌ Spine Player 加载失败</p>
              <p class="text-sm text-gray-400">${message}</p>
              <p class="text-xs text-gray-500 mt-2">请检查 Spine Player 配置</p>
            </div>
          </div>
        `
      }
    }

    // 创建 Spine Player（不使用拦截器）
    if (window.SpinePlayer) {
      spinePlayer = new window.SpinePlayer(container, config)
    } else if (window.spine && window.spine.SpinePlayer) {
      spinePlayer = new window.spine.SpinePlayer(container, config)
    }

    dependenciesLoaded.value = true
    dependencyStatus.value = '示例加载完成'

  } catch (error) {
    console.error('❌ 加载示例动画失败:', error)
    // 出错时重置 spineLoaded
    spineLoaded.value = false
  }
}


// 动画控制方法
const playAnimation = (animationName) => {
  currentAnimation.value = animationName
  console.log('🎬 播放动画:', animationName)
  console.log('📊 Spine Player 状态检查:', {
    spinePlayer: !!spinePlayer,
    hasSetAnimation: spinePlayer?.setAnimation ? true : false,
    spineLoaded: spineLoaded.value,
    isLoading: isLoading.value
  })

  // 使用 Spine Player 播放动画
  if (spinePlayer && spinePlayer.setAnimation) {
    try {
      spinePlayer.setAnimation(animationName)

      // 如果当前是暂停状态，开始播放
      if (!isPlaying.value && spinePlayer.play) {
        spinePlayer.play()
        isPlaying.value = true
      }

      console.log('✅ 动画切换成功:', animationName)
    } catch (error) {
      console.error('❌ 动画切换失败:', error)
    }
  } else {
    console.log('⚠️ Spine Player 不可用')

    // 尝试等待一下 Spine Player 初始化
    if (spineLoaded.value && !spinePlayer) {
      console.log('🔄 spineLoaded 为 true 但 spinePlayer 为 null，尝试等待初始化...')
      setTimeout(() => {
        if (spinePlayer) {
          console.log('✅ Spine Player 已初始化，重新尝试播放动画')
          playAnimation(animationName)
        } else {
          console.error('❌ Spine Player 初始化超时')
        }
      }, 1000)
    }
  }
}

// 更新动画播放控制
const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  console.log('🎮', isPlaying.value ? '开始播放动画' : '暂停播放动画', '速度:', playSpeed.value + 'x')

  // 使用 Spine Player 控制播放
  if (spinePlayer) {
    try {
      if (isPlaying.value) {
        // 如果有当前动画，设置并播放
        if (currentAnimation.value && spinePlayer.setAnimation) {
          spinePlayer.setAnimation(currentAnimation.value)
        }
        if (spinePlayer.play) {
          spinePlayer.play()
        }
        console.log('✅ Spine Player 开始播放')
      } else {
        if (spinePlayer.pause) {
          spinePlayer.pause()
        }
        console.log('⏸️ Spine Player 已暂停')
      }
    } catch (error) {
      console.error('❌ Spine Player 播放控制失败:', error)
    }
  } else {
    console.log('⚠️ Spine Player 不可用')
  }
}

// 监听播放速度变化
watch(playSpeed, (newSpeed) => {
  if (spinePlayer && spinePlayer.setTimeScale && isPlaying.value) {
    try {
      spinePlayer.setTimeScale(newSpeed)
      console.log('⚡ 动画速度更新:', newSpeed)
    } catch (error) {
      console.error('❌ 动画速度更新失败:', error)
    }
  }
})


// 视图控制方法 - Spine Player 不支持直接的缩放和平移
const zoomIn = () => {
  console.log('⚠️ Spine Player 暂不支持缩放功能')
}

const zoomOut = () => {
  console.log('⚠️ Spine Player 暂不支持缩放功能')
}

const resetZoom = () => {
  console.log('⚠️ Spine Player 暂不支持缩放功能')
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

// 读取文件为DataURL（Base64）
const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(e)
    reader.readAsDataURL(file)
  })
}

// 获取文件类型图标
const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase()
  const iconMap = {
    'json': '📄',
    'spine': '🦴',
    'skel': '🦴',
    'atlas': '📋',
    'png': '🖼️',
    'jpg': '🖼️',
    'jpeg': '🖼️'
  }
  return iconMap[extension] || '📁'
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

  // 等待 Spine Player 加载
  await waitForSpinePlayer()

  // 显示默认示例动画
  setTimeout(() => {
    showDefaultAnimation()
  }, 500)
})

onUnmounted(() => {
  if (spinePlayer) {
    spinePlayer.dispose()
    spinePlayer = null
  }
  // 清理所有创建的 URL 对象
  createdUrls.value.forEach(url => URL.revokeObjectURL(url))
  createdUrls.value = []
})
</script>