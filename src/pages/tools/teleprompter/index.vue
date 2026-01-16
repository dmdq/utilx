<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">在线提词器 - 自媒体视频录制专用提词工具</h1>
      <p class="text-muted-foreground">专业在线提词器，支持滚动速度调节、字体大小自定义、镜像模式、背景色切换。为自媒体创作者、直播主提供沉浸式提词体验，录制视频不再忘词。完全免费，无需下载。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
      <!-- 左侧控制面板 -->
      <div class="lg:col-span-1 space-y-4">
        <!-- 内容编辑 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <h3 class="text-sm font-medium text-foreground mb-3 flex items-center">
            <svg class="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            提词内容
          </h3>
          <textarea
            v-model="scriptText"
            class="w-full h-48 px-3 py-2 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="在此输入你的提词内容...&#10;&#10;支持实时编辑，开始滚动后将自动隐藏编辑器。&#10;&#10;快捷键：&#10;空格键 - 暂停/继续&#10;ESC - 退出全屏&#10;↑/↓ - 调整速度"
          ></textarea>
          <div class="flex gap-2 mt-3">
            <button
              @click="loadSample"
              class="flex-1 px-3 py-2 text-xs bg-muted hover:bg-muted/80 rounded text-muted-foreground transition-colors"
            >
              加载示例
            </button>
            <button
              @click="clearText"
              class="flex-1 px-3 py-2 text-xs bg-muted hover:bg-muted/80 rounded text-muted-foreground transition-colors"
            >
              清空内容
            </button>
          </div>
        </div>

        <!-- 滚动控制 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <h3 class="text-sm font-medium text-foreground mb-3 flex items-center">
            <svg class="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
            </svg>
            滚动控制
          </h3>

          <!-- 播放按钮 -->
          <button
            @click="toggleScroll"
            :class="[
              'w-full py-3 px-4 rounded-lg text-sm font-medium transition-colors mb-4',
              isScrolling
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            ]"
          >
            <div class="flex items-center justify-center">
              <svg v-if="!isScrolling" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <svg v-else class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {{ isScrolling ? '暂停滚动' : '开始滚动' }}
            </div>
          </button>

          <!-- 滚动速度 -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs text-muted-foreground">滚动速度</label>
              <span class="text-xs font-medium text-primary">{{ scrollSpeed }}%</span>
            </div>
            <input
              v-model.number="scrollSpeed"
              type="range"
              min="1"
              max="100"
              class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div class="flex justify-between text-xs text-muted-foreground mt-1">
              <span>慢</span>
              <span>快</span>
            </div>
          </div>

          <!-- 快捷速度预设 -->
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="preset in speedPresets"
              :key="preset.value"
              @click="scrollSpeed = preset.value"
              :class="[
                'px-2 py-1 text-xs rounded transition-colors',
                scrollSpeed === preset.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- 显示设置 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <h3 class="text-sm font-medium text-foreground mb-3 flex items-center">
            <svg class="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
            </svg>
            显示设置
          </h3>

          <!-- 字体大小 -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs text-muted-foreground">字体大小</label>
              <span class="text-xs font-medium text-primary">{{ fontSize }}px</span>
            </div>
            <input
              v-model.number="fontSize"
              type="range"
              min="20"
              max="120"
              step="5"
              class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <!-- 镜像模式 -->
          <div class="space-y-2 mb-4">
            <div class="flex items-center justify-between">
              <label class="text-xs text-muted-foreground">水平镜像</label>
              <button
                @click="mirrorHorizontal = !mirrorHorizontal"
                :class="[
                  'w-12 h-6 rounded-full transition-colors relative',
                  mirrorHorizontal ? 'bg-primary' : 'bg-muted'
                ]"
              >
                <span
                  :class="[
                    'absolute top-1 w-4 h-4 rounded-full transition-transform bg-white',
                    mirrorHorizontal ? 'left-7' : 'left-1'
                  ]"
                ></span>
              </button>
            </div>
            <div class="flex items-center justify-between">
              <label class="text-xs text-muted-foreground">垂直镜像</label>
              <button
                @click="mirrorVertical = !mirrorVertical"
                :class="[
                  'w-12 h-6 rounded-full transition-colors relative',
                  mirrorVertical ? 'bg-primary' : 'bg-muted'
                ]"
              >
                <span
                  :class="[
                    'absolute top-1 w-4 h-4 rounded-full transition-transform bg-white',
                    mirrorVertical ? 'left-7' : 'left-1'
                  ]"
                ></span>
              </button>
            </div>
          </div>

          <!-- 背景色选择 -->
          <div class="mb-4">
            <label class="text-xs text-muted-foreground block mb-2">背景颜色</label>
            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="color in backgroundColors"
                :key="color.value"
                @click="backgroundColor = color.value"
                :class="[
                  'w-8 h-8 rounded-lg border-2 transition-all',
                  backgroundColor === color.value
                    ? 'border-primary scale-110'
                    : 'border-transparent hover:scale-105'
                ]"
                :style="{ backgroundColor: color.value }"
                :title="color.name"
              ></button>
            </div>
          </div>

          <!-- 文字颜色 -->
          <div>
            <label class="text-xs text-muted-foreground block mb-2">文字颜色</label>
            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="color in textColors"
                :key="color.value"
                @click="textColor = color.value"
                :class="[
                  'w-8 h-8 rounded-lg border-2 transition-all',
                  textColor === color.value
                    ? 'border-primary scale-110'
                    : 'border-transparent hover:scale-105'
                ]"
                :style="{ backgroundColor: color.value }"
                :title="color.name"
              ></button>
            </div>
          </div>
        </div>

        <!-- 全屏按钮 -->
        <button
          @click="toggleFullscreen"
          class="w-full py-3 px-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-lg text-sm font-medium transition-all text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-xl"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
          </svg>
          全屏模式 (沉浸式体验)
        </button>
      </div>

      <!-- 右侧提词显示区域 -->
      <div class="lg:col-span-3">
        <div
          ref="teleprompterContainer"
          class="relative bg-card border border-border rounded-lg overflow-hidden"
          :style="{
            backgroundColor: backgroundColor,
            height: isFullscreen ? '100vh' : '600px'
          }"
          :class="{
            'fixed inset-0 z-50 rounded-none border-none': isFullscreen
          }"
        >
          <!-- 提词文字显示区域 -->
          <div
            ref="scrollContainer"
            class="h-full overflow-y-auto scrollbar-hide px-8 py-12"
            :class="{
              'scale-x-[-1]': mirrorHorizontal,
              'scale-y-[-1]': mirrorVertical
            }"
          >
            <div
              class="max-w-4xl mx-auto leading-relaxed whitespace-pre-wrap break-words"
              :style="{
                fontSize: fontSize + 'px',
                color: textColor,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontWeight: '500',
                lineHeight: '1.8'
              }"
            >
              {{ scriptText || '请输入或粘贴你的提词内容...' }}
            </div>
          </div>

          <!-- 滚动指示器 -->
          <div
            v-if="!isFullscreen"
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div
              class="w-64 h-1 bg-primary/30 rounded-full"
              :class="{ 'animate-pulse': isScrolling }"
            ></div>
          </div>

          <!-- 全屏模式下的浮动控制 -->
          <div
            v-if="isFullscreen"
            class="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-md rounded-2xl px-6 py-4 flex items-center gap-6"
          >
            <!-- 播放/暂停 -->
            <button
              @click="toggleScroll"
              class="text-white hover:text-primary transition-colors"
            >
              <svg v-if="!isScrolling" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <svg v-else class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </button>

            <!-- 速度控制 -->
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <input
                v-model.number="scrollSpeed"
                type="range"
                min="1"
                max="100"
                class="w-32 h-2 bg-white/30 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span class="text-white text-sm font-medium min-w-[3rem]">{{ scrollSpeed }}%</span>
            </div>

            <!-- 退出全屏 -->
            <button
              @click="toggleFullscreen"
              class="text-white hover:text-primary transition-colors"
              title="退出全屏 (ESC)"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- 空状态提示 -->
          <div
            v-if="!scriptText && !isFullscreen"
            class="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div class="text-center">
              <div class="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <p class="text-muted-foreground text-sm">在左侧输入你的提词内容</p>
              <p class="text-muted-foreground text-xs mt-1">支持全屏模式和快捷键控制</p>
            </div>
          </div>
        </div>

        <!-- 快捷键提示 -->
        <div v-if="!isFullscreen" class="mt-4 p-4 bg-muted/50 rounded-lg">
          <h4 class="text-xs font-medium text-muted-foreground mb-2">快捷键</h4>
          <div class="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span><kbd class="px-1.5 py-0.5 bg-background border border-border rounded">空格</kbd> 暂停/继续</span>
            <span><kbd class="px-1.5 py-0.5 bg-background border border-border rounded">↑</kbd> <kbd class="px-1.5 py-0.5 bg-background border border-border rounded">↓</kbd> 调整速度</span>
            <span><kbd class="px-1.5 py-0.5 bg-background border border-border rounded">ESC</kbd> 退出全屏</span>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <svg v-if="!isSeoContentVisible" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
        </svg>
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是提词器？
        </h2>
        <p class="text-muted-foreground mb-4">
          提词器（Teleprompter）是一种用于演讲、视频录制、直播等场景的辅助设备，能够将文字内容以滚动方式显示在屏幕上，
          让演讲者可以一边看着镜头一边阅读台词，避免忘词或频繁看稿的尴尬。
          现代提词器通常采用半透明玻璃反射技术，将文字反射到演讲者面前的镜片上。
        </p>
        <p class="text-muted-foreground">
          在线提词器则将这一功能数字化，通过网页或应用程序实现文字滚动显示。
          相比传统硬件提词器，在线提词器更加便捷、经济，只需要一台电脑、平板或手机即可使用。
          特别适合自媒体创作者、网络主播、教师、演讲者等群体使用。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用在线提词器
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>将你的演讲稿、台词或提词内容复制到左侧的编辑框中</li>
          <li>根据需要调整字体大小、背景颜色和文字颜色，确保清晰易读</li>
          <li>设置合适的滚动速度，建议先慢速练习，找到适合自己的节奏</li>
          <li>点击"开始滚动"或按空格键开始自动滚动</li>
          <li>如需专业提词器效果，点击"全屏模式"并开启镜像功能</li>
          <li>使用快捷键控制：空格暂停、方向键调速、ESC退出全屏</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>自由滚动控制</strong>: 支持多种滚动速度（1-100档），可随时暂停和继续</li>
          <li><strong>镜像模式</strong>: 支持水平和垂直镜像，适配专业提词器设备</li>
          <li><strong>自定义外观</strong>: 字体大小、背景颜色、文字颜色完全可调</li>
          <li><strong>沉浸式全屏</strong>: 全屏模式提供真正的专业提词体验</li>
          <li><strong>快捷键操作</strong>: 空格暂停、方向键调速、ESC退出全屏，操作更流畅</li>
          <li><strong>实时编辑</strong>: 可随时修改内容，无需中断录制</li>
          <li><strong>完全免费</strong>: 无需下载安装，打开浏览器即可使用</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          使用技巧
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>语速同步</strong>: 调整滚动速度使其与你的语速同步，建议录制前多练习</li>
          <li><strong>标记重点</strong>: 用表情符号或特殊符号标记重要内容，如 ★ 或 🔥</li>
          <li><strong>分段录制</strong>: 将长内容分段，每段单独录制，后期拼接效果更好</li>
          <li><strong>设备放置</strong>: 将设备放在摄像头正后方或使用专业提词器支架</li>
          <li><strong>环境光线</strong>: 确保屏幕亮度适中，避免反光影响阅读</li>
          <li><strong>提前试录</strong>: 正式录制前先试录一遍，熟悉内容和节奏</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是镜像模式？何时需要使用？</h3>
            <p class="text-muted-foreground mt-1">
              镜像模式是将文字水平或垂直翻转显示的功能。当你使用专业提词器设备（半透明玻璃反射装置）时，
              需要开启镜像模式，因为反射会让文字再次翻转，镜像可以确保最终看到的文字是正向的。
              如果你直接对着屏幕看，则不需要开启镜像模式。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何找到合适的滚动速度？</h3>
            <p class="text-muted-foreground mt-1">
              建议从较低的速度开始（如20-30%），边读边调整，找到与你的语速匹配的速度。
              可以先大声朗读几段内容，观察文字滚动是否与你的阅读同步。
              不同内容可能需要不同速度，建议每次录制前都调整一下。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">提词器可以用于哪些场景？</h3>
            <p class="text-muted-foreground mt-1">
              提词器适用场景非常广泛：自媒体视频录制、网络直播、在线教学、产品演示、
              演讲发言、新闻播报、节目主持、会议汇报等。任何需要脱稿发言但又不方便拿稿子的场景都可以使用提词器。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">使用提词器会影响演讲自然度吗？</h3>
            <p class="text-muted-foreground mt-1">
              熟练使用提词器不会影响自然度，反而能提升表现。关键是要多练习，
              熟悉内容后眼神可以偶尔离开提词器与观众交流。
              使用大字体和合适的速度，让你的眼睛不需要频繁移动，看起来更自然。
              建议录制前多次练习，直到能够流畅地表达。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  Video, Type, Image, Palette, Code, FileText, Lock, Shield, Clock, Wifi,
  Database, Link, Hash, Timer, Regex, FileDiff, Globe, FolderOpen
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: '在线提词器 - 自媒体视频录制提词工具 | Util.cn',
  description: '专业在线提词器，支持滚动速度调节、字体大小自定义、镜像模式、背景色切换。为自媒体创作者、直播主提供沉浸式提词体验，录制视频不再忘词。完全免费，无需下载。',
  keywords: '提词器,在线提词器,视频提词器,直播提词器,免费提词器,提词器app,录制提词,演讲提词,自媒体提词',
  author: 'Util工具箱',
  ogTitle: '在线提词器 - 自媒体视频录制提词工具',
  ogDescription: '专业在线提词器，支持滚动速度调节、镜像模式、全屏沉浸式体验。完全免费，无需下载。',
  ogUrl: 'https://www.util.cn/tools/teleprompter',
  ogType: 'website'
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
            name: '在线提词器',
            description: '专业在线提词器，支持滚动速度调节、字体大小自定义、镜像模式、背景色切换。为自媒体创作者提供沉浸式提词体验。',
            url: 'https://www.util.cn/tools/teleprompter',
            applicationCategory: 'MultimediaApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '可调节滚动速度',
              '字体大小自定义',
              '镜像模式支持',
              '背景颜色切换',
              '全屏沉浸式体验',
              '快捷键控制',
              '实时编辑内容',
              '完全免费使用'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: '在线提词器',
                item: 'https://www.util.cn/tools/teleprompter'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '什么是镜像模式？何时需要使用？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': '镜像模式是将文字水平或垂直翻转显示的功能。当你使用专业提词器设备（半透明玻璃反射装置）时，需要开启镜像模式，因为反射会让文字再次翻转，镜像可以确保最终看到的文字是正向的。'
                }
              },
              {
                '@type': 'Question',
                name: '如何找到合适的滚动速度？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': '建议从较低的速度开始（如20-30%），边读边调整，找到与你的语速匹配的速度。可以先大声朗读几段内容，观察文字滚动是否与你的阅读同步。'
                }
              },
              {
                '@type': 'Question',
                name: '提词器可以用于哪些场景？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': '提词器适用场景非常广泛：自媒体视频录制、网络直播、在线教学、产品演示、演讲发言、新闻播报、节目主持、会议汇报等。任何需要脱稿发言但又不方便拿稿子的场景都可以使用提词器。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'teleprompter')
const category = categories.find(c => c.id === 'design')

// 图标映射
const iconMap = {
  Video, Type, Image, Palette, Code, FileText, Lock, Shield, Clock, Wifi,
  Database, Link, Hash, Timer, Regex, FileDiff, Globe, FolderOpen
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'design' && t.id !== 'teleprompter'
  ).slice(0, 2)

  const recommended = [
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'text-diff-tool'),
    tools.find(t => t.id === 'markdown-editor'),
    tools.find(t => t.id === 'color-converter')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 提词内容
const scriptText = ref('')

// 滚动控制
const isScrolling = ref(false)
const scrollSpeed = ref(30)
let scrollAnimationId = null

// 显示设置
const fontSize = ref(48)
const mirrorHorizontal = ref(false)
const mirrorVertical = ref(false)
const backgroundColor = ref('#000000')
const textColor = ref('#ffffff')

// 全屏控制
const isFullscreen = ref(false)

// 容器引用
const scrollContainer = ref(null)
const teleprompterContainer = ref(null)

// SEO 内容折叠状态
const isSeoContentVisible = ref(true)

// 速度预设
const speedPresets = [
  { label: '慢速', value: 15 },
  { label: '中速', value: 30 },
  { label: '快速', value: 60 }
]

// 背景颜色选项
const backgroundColors = [
  { name: '纯黑', value: '#000000' },
  { name: '深灰', value: '#1a1a1a' },
  { name: '深蓝', value: '#0a1929' },
  { name: '深紫', value: '#1a0a2e' },
  { name: '白色', value: '#ffffff' }
]

// 文字颜色选项
const textColors = [
  { name: '纯白', value: '#ffffff' },
  { name: '浅黄', value: '#fef08a' },
  { name: '浅绿', value: '#86efac' },
  { name: '纯黑', value: '#000000' },
  { name: '灰色', value: '#6b7280' }
]

// 滚动动画
const startScrolling = () => {
  if (scrollAnimationId) {
    cancelAnimationFrame(scrollAnimationId)
  }

  const scroll = () => {
    if (scrollContainer.value && isScrolling.value) {
      const speed = scrollSpeed.value / 10
      scrollContainer.value.scrollTop += speed
      scrollAnimationId = requestAnimationFrame(scroll)
    }
  }

  scrollAnimationId = requestAnimationFrame(scroll)
}

const stopScrolling = () => {
  if (scrollAnimationId) {
    cancelAnimationFrame(scrollAnimationId)
    scrollAnimationId = null
  }
}

// 切换滚动状态
const toggleScroll = () => {
  isScrolling.value = !isScrolling.value
  if (isScrolling.value) {
    startScrolling()
  } else {
    stopScrolling()
  }
}

// 监听速度变化
watch(scrollSpeed, () => {
  if (isScrolling.value) {
    stopScrolling()
    startScrolling()
  }
})

// 加载示例内容
const loadSample = () => {
  scriptText.value = `欢迎来到在线提词器！

这是一个专为自媒体创作者、演讲者设计的专业提词工具。

使用技巧：
• 调整滚动速度以匹配你的语速
• 使用全屏模式获得最佳体验
• 开启镜像模式适配专业提词器设备
• 使用快捷键：空格暂停、方向键调速

现在，你可以替换这段文字，开始你的提词之旅了！

祝你录制顺利！`
}

// 清空内容
const clearText = () => {
  if (scriptText.value && confirm('确定要清空所有内容吗？')) {
    scriptText.value = ''
  }
}

// 全屏控制
const toggleFullscreen = () => {
  if (!isFullscreen.value) {
    isFullscreen.value = true
    if (teleprompterContainer.value?.requestFullscreen) {
      teleprompterContainer.value.requestFullscreen()
    }
  } else {
    isFullscreen.value = false
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
  }
}

// SEO 内容折叠
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 快捷键处理
const handleKeyPress = (e) => {
  // 空格键 - 暂停/继续
  if (e.code === 'Space' && !e.target.matches('textarea, input')) {
    e.preventDefault()
    toggleScroll()
  }

  // ESC - 退出全屏
  if (e.code === 'Escape' && isFullscreen.value) {
    e.preventDefault()
    toggleFullscreen()
  }

  // 上箭头 - 减速
  if (e.code === 'ArrowUp' && !e.target.matches('textarea, input')) {
    e.preventDefault()
    scrollSpeed.value = Math.max(1, scrollSpeed.value - 5)
  }

  // 下箭头 - 加速
  if (e.code === 'ArrowDown' && !e.target.matches('textarea, input')) {
    e.preventDefault()
    scrollSpeed.value = Math.min(100, scrollSpeed.value + 5)
  }
}

// 监听全屏变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

// 生命周期
onMounted(() => {
  // 添加到最近使用
  if (tool) {
    addRecentTool(tool.id)
  }

  // 加载示例内容
  loadSample()

  // 监听键盘事件
  document.addEventListener('keydown', handleKeyPress)

  // 监听全屏变化
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  console.log('📹 提词器已加载')
})

onUnmounted(() => {
  // 停止滚动
  stopScrolling()

  // 移除事件监听
  document.removeEventListener('keydown', handleKeyPress)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<style scoped>
/* 隐藏滚动条但保持可滚动 */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* 范围滑块样式优化 */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: hsl(var(--primary));
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: hsl(var(--primary));
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* kbd 样式 */
kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  font-weight: 500;
}
</style>
