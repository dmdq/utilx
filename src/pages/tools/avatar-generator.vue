<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">头像生成器</h1>
      <p class="text-muted-foreground">生成个性化头像，支持多种风格和自定义选项</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：设置 -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">头像设置</h2>

        <!-- 头像类型 -->
        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-3">头像类型</h3>
          <div class="grid grid-cols-3 gap-2">
            <button
              @click="avatarType = 'initials'"
              :class="['p-2 rounded text-xs transition-colors', avatarType === 'initials' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
            >
              首字母
            </button>
            <button
              @click="avatarType = 'pattern'"
              :class="['p-2 rounded text-xs transition-colors', avatarType === 'pattern' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
            >
              几何图案
            </button>
            <button
              @click="avatarType = 'gradient'"
              :class="['p-2 rounded text-xs transition-colors', avatarType === 'gradient' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']"
            >
              渐变色
            </button>
          </div>
        </div>

        <!-- 首字母设置 -->
        <div v-if="avatarType === 'initials'" class="bg-muted p-4 rounded-lg space-y-4">
          <h3 class="font-medium text-sm">首字母设置</h3>

          <div>
            <label class="text-xs text-muted-foreground mb-1 block">输入文字</label>
            <input
              v-model="initials"
              type="text"
              maxlength="2"
              class="w-full p-2 border border-border rounded-lg text-sm"
              placeholder="最多2个字符"
              @input="updatePreview"
            >
          </div>

          <div>
            <label class="text-xs text-muted-foreground mb-1 block">字体大小</label>
            <input
              v-model.number="fontSize"
              type="range"
              min="40"
              max="120"
              @input="updatePreview"
              class="w-full"
            >
          </div>
        </div>

        <!-- 图案设置 -->
        <div v-if="avatarType === 'pattern'" class="bg-muted p-4 rounded-lg space-y-4">
          <h3 class="font-medium text-sm">图案设置</h3>

          <div>
            <label class="text-xs text-muted-foreground mb-1 block">图案样式</label>
            <select v-model="patternStyle" @change="updatePreview" class="w-full p-2 border border-border rounded text-sm">
              <option value="circles">圆形</option>
              <option value="squares">方形</option>
              <option value="triangles">三角形</option>
              <option value="lines">线条</option>
              <option value="dots">点阵</option>
            </select>
          </div>

          <div>
            <div class="flex justify-between text-xs mb-1">
              <label>图案密度</label>
              <span>{{ patternDensity }}</span>
            </div>
            <input
              v-model.number="patternDensity"
              type="range"
              min="3"
              max="10"
              @input="updatePreview"
              class="w-full"
            >
          </div>
        </div>

        <!-- 渐变设置 -->
        <div v-if="avatarType === 'gradient'" class="bg-muted p-4 rounded-lg space-y-4">
          <h3 class="font-medium text-sm">渐变设置</h3>

          <div>
            <label class="text-xs text-muted-foreground mb-1 block">渐变方向</label>
            <select v-model="gradientDirection" @change="updatePreview" class="w-full p-2 border border-border rounded text-sm">
              <option value="diagonal">对角线</option>
              <option value="horizontal">水平</option>
              <option value="vertical">垂直</option>
              <option value="radial">放射</option>
            </select>
          </div>
        </div>

        <!-- 颜色设置 -->
        <div class="bg-muted p-4 rounded-lg space-y-4">
          <h3 class="font-medium text-sm">颜色设置</h3>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">主颜色</label>
              <div class="flex gap-2">
                <input
                  v-model="primaryColor"
                  type="color"
                  @input="updatePreview"
                  class="w-12 h-10 rounded cursor-pointer"
                >
                <input
                  v-model="primaryColor"
                  type="text"
                  @input="updatePreview"
                  class="flex-1 p-2 border border-border rounded text-sm font-mono"
                >
              </div>
            </div>
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">次要颜色</label>
              <div class="flex gap-2">
                <input
                  v-model="secondaryColor"
                  type="color"
                  @input="updatePreview"
                  class="w-12 h-10 rounded cursor-pointer"
                >
                <input
                  v-model="secondaryColor"
                  type="text"
                  @input="updatePreview"
                  class="flex-1 p-2 border border-border rounded text-sm font-mono"
                >
              </div>
            </div>
          </div>

          <div v-if="avatarType === 'initials'">
            <label class="text-xs text-muted-foreground mb-1 block">文字颜色</label>
            <div class="flex gap-2">
              <input
                v-model="textColor"
                type="color"
                @input="updatePreview"
                class="w-12 h-10 rounded cursor-pointer"
              >
              <input
                v-model="textColor"
                type="text"
                @input="updatePreview"
                class="flex-1 p-2 border border-border rounded text-sm font-mono"
              >
            </div>
          </div>

          <!-- 预设配色 -->
          <div>
            <label class="text-xs text-muted-foreground mb-2 block">预设配色</label>
            <div class="grid grid-cols-8 gap-1">
              <button
                v-for="(color, index) in presetColors"
                :key="index"
                @click="applyPreset(color)"
                class="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                :style="{ backgroundColor: color.primary }"
              ></button>
            </div>
          </div>
        </div>

        <!-- 形状设置 -->
        <div class="bg-muted p-4 rounded-lg space-y-4">
          <h3 class="font-medium text-sm">形状设置</h3>

          <div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="isRounded" @change="updatePreview" class="rounded">
              <span class="text-sm">圆形头像</span>
            </label>
          </div>

          <div v-if="!isRounded">
            <div class="flex justify-between text-xs mb-1">
              <label>圆角大小</label>
              <span>{{ borderRadius }}px</span>
            </div>
            <input
              v-model.number="borderRadius"
              type="range"
              min="0"
              max="50"
              @input="updatePreview"
              class="w-full"
            >
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-3">快速操作</h3>
          <div class="flex gap-2">
            <button @click="randomize" class="flex-1 p-2 bg-primary text-primary-foreground rounded hover:opacity-90 text-sm">
              随机生成
            </button>
            <button @click="resetSettings" class="flex-1 p-2 bg-background hover:bg-muted rounded text-sm">
              重置
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：预览 -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">预览</h2>

        <div class="bg-muted rounded-lg p-4">
          <div class="grid grid-cols-3 gap-4">
            <!-- 不同尺寸预览 -->
            <div class="text-center">
              <p class="text-xs text-muted-foreground mb-2">64px</p>
              <canvas
                ref="canvas64"
                width="64"
                height="64"
                class="mx-auto"
              ></canvas>
            </div>
            <div class="text-center">
              <p class="text-xs text-muted-foreground mb-2">128px</p>
              <canvas
                ref="canvas128"
                width="128"
                height="128"
                class="mx-auto"
              ></canvas>
            </div>
            <div class="text-center">
              <p class="text-xs text-muted-foreground mb-2">256px</p>
              <canvas
                ref="canvas256"
                width="256"
                height="256"
                class="mx-auto"
              ></canvas>
            </div>
          </div>
        </div>

        <!-- 大尺寸预览 -->
        <div class="bg-muted rounded-lg p-4">
          <p class="text-xs text-muted-foreground mb-2">512px 预览</p>
          <canvas
            ref="canvas512"
            width="512"
            height="512"
            class="max-w-full h-auto rounded-lg"
          ></canvas>
        </div>

        <!-- 下载 -->
        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-3">下载头像</h3>
          <div class="grid grid-cols-3 gap-2">
            <button @click="downloadAvatar(128)" class="p-2 bg-background hover:bg-muted rounded text-xs">
              128x128
            </button>
            <button @click="downloadAvatar(256)" class="p-2 bg-background hover:bg-muted rounded text-xs">
              256x256
            </button>
            <button @click="downloadAvatar(512)" class="p-2 bg-background hover:bg-muted rounded text-xs">
              512x512
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useSeoMeta } from '#app'

const canvas64 = ref(null)
const canvas128 = ref(null)
const canvas256 = ref(null)
const canvas512 = ref(null)

const avatarType = ref('initials')
const initials = ref('U')
const fontSize = ref(80)
const patternStyle = ref('circles')
const patternDensity = ref(5)
const gradientDirection = ref('diagonal')
const primaryColor = ref('#3B82F6')
const secondaryColor = ref('#8B5CF6')
const textColor = ref('#FFFFFF')
const isRounded = ref(true)
const borderRadius = ref(0)

const presetColors = [
  { primary: '#EF4444', secondary: '#F87171', text: '#FFFFFF' },
  { primary: '#F97316', secondary: '#FB923C', text: '#FFFFFF' },
  { primary: '#F59E0B', secondary: '#FBBF24', text: '#FFFFFF' },
  { primary: '#10B981', secondary: '#34D399', text: '#FFFFFF' },
  { primary: '#3B82F6', secondary: '#60A5FA', text: '#FFFFFF' },
  { primary: '#6366F1', secondary: '#818CF8', text: '#FFFFFF' },
  { primary: '#8B5CF6', secondary: '#A78BFA', text: '#FFFFFF' },
  { primary: '#EC4899', secondary: '#F472B6', text: '#FFFFFF' }
]

onMounted(() => {
  updatePreview()
})

const updatePreview = () => {
  nextTick(() => {
    if (canvas64.value) drawAvatar(canvas64.value, 64)
    if (canvas128.value) drawAvatar(canvas128.value, 128)
    if (canvas256.value) drawAvatar(canvas256.value, 256)
    if (canvas512.value) drawAvatar(canvas512.value, 512)
  })
}

const drawAvatar = (canvas, size) => {
  const ctx = canvas.getContext('2d')
  const halfSize = size / 2

  // 清除画布
  ctx.clearRect(0, 0, size, size)

  // 绘制形状
  ctx.save()
  if (isRounded.value) {
    ctx.beginPath()
    ctx.arc(halfSize, halfSize, halfSize, 0, Math.PI * 2)
    ctx.clip()
  } else {
    roundRect(ctx, 0, 0, size, size, borderRadius.value)
    ctx.clip()
  }

  if (avatarType.value === 'initials') {
    // 绘制背景
    ctx.fillStyle = primaryColor.value
    ctx.fillRect(0, 0, size, size)

    // 绘制文字
    ctx.fillStyle = textColor.value
    ctx.font = `bold ${fontSize.value * (size / 256)}px Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials.value.toUpperCase(), halfSize, halfSize)
  } else if (avatarType.value === 'pattern') {
    // 绘制背景
    ctx.fillStyle = primaryColor.value
    ctx.fillRect(0, 0, size, size)

    // 绘制图案
    ctx.fillStyle = secondaryColor.value
    const cellSize = size / patternDensity.value

    for (let x = 0; x < patternDensity.value; x++) {
      for (let y = 0; y < patternDensity.value; y++) {
        const cx = x * cellSize + cellSize / 2
        const cy = y * cellSize + cellSize / 2

        if (patternStyle.value === 'circles') {
          ctx.beginPath()
          ctx.arc(cx, cy, cellSize / 3, 0, Math.PI * 2)
          ctx.fill()
        } else if (patternStyle.value === 'squares') {
          ctx.fillRect(cx - cellSize / 4, cy - cellSize / 4, cellSize / 2, cellSize / 2)
        } else if (patternStyle.value === 'triangles') {
          ctx.beginPath()
          ctx.moveTo(cx, cy - cellSize / 4)
          ctx.lineTo(cx + cellSize / 4, cy + cellSize / 4)
          ctx.lineTo(cx - cellSize / 4, cy + cellSize / 4)
          ctx.closePath()
          ctx.fill()
        } else if (patternStyle.value === 'lines') {
          ctx.fillRect(x * cellSize, cy - 1, cellSize, 2)
        } else if (patternStyle.value === 'dots') {
          ctx.beginPath()
          ctx.arc(cx, cy, cellSize / 6, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  } else if (avatarType.value === 'gradient') {
    // 绘制渐变
    let gradient
    if (gradientDirection.value === 'diagonal') {
      gradient = ctx.createLinearGradient(0, 0, size, size)
    } else if (gradientDirection.value === 'horizontal') {
      gradient = ctx.createLinearGradient(0, 0, size, 0)
    } else if (gradientDirection.value === 'vertical') {
      gradient = ctx.createLinearGradient(0, 0, 0, size)
    } else if (gradientDirection.value === 'radial') {
      gradient = ctx.createRadialGradient(halfSize, halfSize, 0, halfSize, halfSize, halfSize)
    }

    gradient.addColorStop(0, primaryColor.value)
    gradient.addColorStop(1, secondaryColor.value)

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }

  ctx.restore()
}

const roundRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

const applyPreset = (preset) => {
  primaryColor.value = preset.primary
  secondaryColor.value = preset.secondary
  textColor.value = preset.text
  updatePreview()
}

const randomize = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  initials.value = chars[Math.floor(Math.random() * chars.length)] + (Math.random() > 0.5 ? chars[Math.floor(Math.random() * chars.length)] : '')

  const preset = presetColors[Math.floor(Math.random() * presetColors.length)]
  applyPreset(preset)

  const types = ['initials', 'pattern', 'gradient']
  avatarType.value = types[Math.floor(Math.random() * types.length)]
}

const resetSettings = () => {
  avatarType.value = 'initials'
  initials.value = 'U'
  fontSize.value = 80
  patternStyle.value = 'circles'
  patternDensity.value = 5
  gradientDirection.value = 'diagonal'
  primaryColor.value = '#3B82F6'
  secondaryColor.value = '#8B5CF6'
  textColor.value = '#FFFFFF'
  isRounded.value = true
  borderRadius.value = 0
  updatePreview()
}

const downloadAvatar = (size) => {
  const canvas = size === 128 ? canvas128.value : size === 256 ? canvas256.value : canvas512.value
  if (!canvas) return

  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = `avatar_${size}x${size}.png`
  link.click()
}

useSeoMeta({
  title: '头像生成器 - 在线头像创建工具',
  description: '免费在线头像生成器，支持首字母头像、几何图案、渐变色等多种风格。',
  keywords: ['头像', 'avatar', '头像生成', '用户头像', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('头像生成器')
</script>
