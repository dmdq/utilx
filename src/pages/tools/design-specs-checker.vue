<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">设计规范检查器</h1>
      <p class="text-muted-foreground mb-6">检查设计系统一致性，确保间距、字号、颜色等符合设计规范</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：输入和设置 -->
      <div class="space-y-6">
        <!-- 设计系统配置 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">设计系统配置</h3>
          <div class="space-y-4">
            <!-- 预设系统 -->
            <div>
              <label class="block text-sm font-medium mb-2">选择预设系统</label>
              <select v-model="selectedSystem" @change="applyPresetSystem" class="w-full px-3 py-2 border rounded-lg">
                <option value="">自定义配置</option>
                <option value="material">Material Design</option>
                <option value="ios">Human Interface Guidelines</option>
                <option value="antdesign">Ant Design</option>
                <option value="bootstrap">Bootstrap</option>
                <option value="tailwind">Tailwind CSS</option>
              </select>
            </div>

            <!-- 间距系统 -->
            <div>
              <h4 class="text-sm font-semibold mb-3">间距系统 (px)</h4>
              <div class="grid grid-cols-4 gap-2">
                <input
                  v-for="(spacing, index) in spacingSystem"
                  :key="index"
                  v-model.number="spacingSystem[index]"
                  type="number"
                  min="0"
                  max="100"
                  class="px-2 py-1 border rounded text-sm"
                  :placeholder="`${index * 4}`"
                />
              </div>
              <button
                @click="addSpacingValue"
                class="mt-2 w-full px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80"
              >
                添加间距值
              </button>
            </div>

            <!-- 字体系统 -->
            <div>
              <h4 class="text-sm font-semibold mb-3">字体大小 (px)</h4>
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs w-16">标题1</span>
                  <input
                    v-model.number="fontSizes.h1"
                    type="number"
                    min="10"
                    max="100"
                    class="flex-1 px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs w-16">标题2</span>
                  <input
                    v-model.number="fontSizes.h2"
                    type="number"
                    min="10"
                    max="100"
                    class="flex-1 px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs w-16">标题3</span>
                  <input
                    v-model.number="fontSizes.h3"
                    type="number"
                    min="10"
                    max="100"
                    class="flex-1 px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs w-16">正文</span>
                  <input
                    v-model.number="fontSizes.body"
                    type="number"
                    min="10"
                    max="100"
                    class="flex-1 px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs w-16">小字</span>
                  <input
                    v-model.number="fontSizes.small"
                    type="number"
                    min="10"
                    max="100"
                    class="flex-1 px-2 py-1 border rounded text-sm"
                  />
                </div>
              </div>
            </div>

            <!-- 颜色系统 -->
            <div>
              <h4 class="text-sm font-semibold mb-3">颜色系统</h4>
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs w-16">主色</span>
                  <input
                    type="color"
                    v-model="colors.primary"
                    class="w-12 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    v-model="colors.primary"
                    class="flex-1 px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs w-16">辅色</span>
                  <input
                    type="color"
                    v-model="colors.secondary"
                    class="w-12 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    v-model="colors.secondary"
                    class="flex-1 px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs w-16">成功</span>
                  <input
                    type="color"
                    v-model="colors.success"
                    class="w-12 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    v-model="colors.success"
                    class="flex-1 px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs w-16">警告</span>
                  <input
                    type="color"
                    v-model="colors.warning"
                    class="w-12 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    v-model="colors.warning"
                    class="flex-1 px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs w-16">错误</span>
                  <input
                    type="color"
                    v-model="colors.error"
                    class="w-12 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    v-model="colors.error"
                    class="flex-1 px-2 py-1 border rounded text-sm"
                  />
                </div>
              </div>
            </div>

            <!-- 圆角系统 -->
            <div>
              <h4 class="text-sm font-semibold mb-3">圆角 (px)</h4>
              <div class="grid grid-cols-2 gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs">小</span>
                  <input
                    v-model.number="borderRadius.small"
                    type="number"
                    min="0"
                    max="50"
                    class="flex-1 px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs">中</span>
                  <input
                    v-model.number="borderRadius.medium"
                    type="number"
                    min="0"
                    max="50"
                    class="flex-1 px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs">大</span>
                  <input
                    v-model.number="borderRadius.large"
                    type="number"
                    min="0"
                    max="50"
                    class="flex-1 px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs">圆</span>
                  <input
                    v-model.number="borderRadius.full"
                    type="number"
                    min="0"
                    max="50"
                    class="flex-1 px-2 py-1 border rounded text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 检查规则 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">检查规则</h3>
          <div class="space-y-3">
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                v-model="checkRules.spacing"
                class="rounded"
              />
              <span class="text-sm">检查间距一致性</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                v-model="checkRules.typography"
                class="rounded"
              />
              <span class="text-sm">检查字体规范</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                v-model="checkRules.colors"
                class="rounded"
              />
              <span class="text-sm">检查颜色使用</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                v-model="checkRules.borderRadius"
                class="rounded"
              />
              <span class="text-sm">检查圆角规范</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                v-model="checkRules.contrast"
                class="rounded"
              />
              <span class="text-sm">检查对比度</span>
            </label>
          </div>
        </div>

        <!-- 导入/导出 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">配置管理</h3>
          <div class="space-y-3">
            <button
              @click="exportConfig"
              class="w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
            >
              导出配置
            </button>
            <button
              @click="importConfig"
              class="w-full px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/80"
            >
              导入配置
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：检查结果 -->
      <div class="space-y-6">
        <!-- 检查按钮 -->
        <div class="bg-card rounded-lg p-6 border">
          <button
            @click="runDesignCheck"
            class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            开始检查
          </button>
        </div>

        <!-- 检查结果概览 -->
        <div v-if="checkResults" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">检查结果概览</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center p-4 bg-green-50 rounded-lg">
              <div class="text-2xl font-bold text-green-600">{{ checkResults.passed }}</div>
              <div class="text-sm text-green-600">通过</div>
            </div>
            <div class="text-center p-4 bg-red-50 rounded-lg">
              <div class="text-2xl font-bold text-red-600">{{ checkResults.failed }}</div>
              <div class="text-sm text-red-600">失败</div>
            </div>
          </div>
          <div class="mt-4">
            <div class="flex items-center justify-between text-sm mb-2">
              <span>总体评分</span>
              <span class="font-medium">{{ checkResults.score }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all"
                :class="getScoreBarClass(checkResults.score)"
                :style="{ width: `${checkResults.score}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 详细问题列表 -->
        <div v-if="checkResults && checkResults.issues.length > 0" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">发现的问题</h3>
          <div class="space-y-3 max-h-96 overflow-y-auto">
            <div
              v-for="(issue, index) in checkResults.issues"
              :key="index"
              class="p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div class="flex items-start gap-3">
                <Icon name="AlertCircle" class="w-5 h-5 text-red-500 mt-0.5" />
                <div class="flex-1">
                  <h4 class="font-medium text-red-800">{{ issue.title }}</h4>
                  <p class="text-sm text-red-600 mt-1">{{ issue.description }}</p>
                  <div v-if="issue.suggestion" class="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                    <strong>建议：</strong> {{ issue.suggestion }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 通过的检查项 -->
        <div v-if="checkResults && checkResults.passedItems.length > 0" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">通过的检查项</h3>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="(item, index) in checkResults.passedItems"
              :key="index"
              class="flex items-center gap-2 p-2 bg-green-50 rounded text-sm"
            >
              <Icon name="CheckCircle" class="w-4 h-4 text-green-500" />
              <span class="text-green-700">{{ item }}</span>
            </div>
          </div>
        </div>

        <!-- 设计系统预览 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">设计系统预览</h3>
          <div class="space-y-4">
            <!-- 间距预览 -->
            <div>
              <h4 class="text-sm font-medium mb-2">间距系统</h4>
              <div class="space-y-1">
                <div
                  v-for="(spacing, index) in spacingSystem"
                  :key="index"
                  class="flex items-center gap-2"
                >
                  <div
                    class="bg-primary rounded"
                    :style="{ width: `${spacing}px`, height: `${spacing}px` }"
                  ></div>
                  <span class="text-xs">{{ spacing }}px</span>
                </div>
              </div>
            </div>

            <!-- 字体预览 -->
            <div>
              <h4 class="text-sm font-medium mb-2">字体系统</h4>
              <div class="space-y-1">
                <h1 :style="{ fontSize: fontSizes.h1 + 'px' }">标题1 - {{ fontSizes.h1 }}px</h1>
                <h2 :style="{ fontSize: fontSizes.h2 + 'px' }">标题2 - {{ fontSizes.h2 }}px</h2>
                <h3 :style="{ fontSize: fontSizes.h3 + 'px' }">标题3 - {{ fontSizes.h3 }}px</h3>
                <p :style="{ fontSize: fontSizes.body + 'px' }">正文 - {{ fontSizes.body }}px</p>
                <p :style="{ fontSize: fontSizes.small + 'px' }">小字 - {{ fontSizes.small }}px</p>
              </div>
            </div>

            <!-- 颜色预览 -->
            <div>
              <h4 class="text-sm font-medium mb-2">颜色系统</h4>
              <div class="grid grid-cols-5 gap-2">
                <div
                  v-for="(color, name) in colors"
                  :key="name"
                  class="text-center"
                >
                  <div
                    class="w-full h-12 rounded mb-1"
                    :style="{ backgroundColor: color }"
                  ></div>
                  <span class="text-xs">{{ name }}</span>
                </div>
              </div>
            </div>

            <!-- 圆角预览 -->
            <div>
              <h4 class="text-sm font-medium mb-2">圆角系统</h4>
              <div class="grid grid-cols-2 gap-2">
                <div
                  class="bg-primary p-3"
                  :style="{ borderRadius: borderRadius.small + 'px' }"
                >
                  <span class="text-white text-xs">小圆角 {{ borderRadius.small }}px</span>
                </div>
                <div
                  class="bg-secondary p-3"
                  :style="{ borderRadius: borderRadius.medium + 'px' }"
                >
                  <span class="text-xs">中圆角 {{ borderRadius.medium }}px</span>
                </div>
                <div
                  class="bg-success p-3"
                  :style="{ borderRadius: borderRadius.large + 'px' }"
                >
                  <span class="text-white text-xs">大圆角 {{ borderRadius.large }}px</span>
                </div>
                <div
                  class="bg-info p-3"
                  :style="{ borderRadius: borderRadius.full + 'px' }"
                >
                  <span class="text-white text-xs">完全圆角 {{ borderRadius.full }}px</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      @change="handleFileImport"
      class="hidden"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { AlertCircle, CheckCircle } from 'lucide-vue-next'

// SEO设置
useSeoMeta({
  title: '设计规范检查器 - 在线检查UI设计系统规范一致性',
  description: '免费设计规范检查器，检查间距、字号、颜色、圆角等设计元素是否符合设计规范，确保UI系统一致性。支持多种设计标准检查和导出配置，专业的前端设计和开发工具。',
  keywords: ['设计规范检查器', 'UI设计规范', '设计系统检查', '间距规范检查', '字号规范', '颜色规范检查', '设计一致性', '前端设计工具', '设计系统验证', 'UI组件规范', '设计标准检查', '网页设计规范'],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '设计规范检查器',
    description: '免费的在线设计规范检查工具，检查UI设计系统一致性，支持间距、字号、颜色等设计元素规范验证。',
    url: 'https://util.iskytrip.com/tools/design-specs-checker',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    featureList: [
      '设计规范检查',
      '间距系统验证',
      '字号规范检查',
      '颜色规范验证',
      '圆角规范检查',
      '设计系统配置',
      '规范配置导入导出',
      '多设计标准支持'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: 'UI设计师、前端开发者'
    }
  }
})

// 设计系统配置
const selectedSystem = ref('')
const spacingSystem = ref([4, 8, 12, 16, 20, 24, 32, 40, 48, 64])
const fontSizes = ref({
  h1: 32,
  h2: 24,
  h3: 20,
  body: 16,
  small: 14
})
const colors = ref({
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444'
})
const borderRadius = ref({
  small: 4,
  medium: 8,
  large: 12,
  full: 9999
})

// 检查规则
const checkRules = ref({
  spacing: true,
  typography: true,
  colors: true,
  borderRadius: true,
  contrast: true
})

// 检查结果
const checkResults = ref(null)

// 文件输入引用
const fileInput = ref(null)

// 预设系统配置
const presetSystems = {
  material: {
    spacingSystem: [4, 8, 16, 24, 32, 48, 64, 96, 128],
    fontSizes: { h1: 57, h2: 45, h3: 36, body: 16, small: 14 },
    colors: {
      primary: '#1976d2',
      secondary: '#424242',
      success: '#388e3c',
      warning: '#f57c00',
      error: '#d32f2f'
    },
    borderRadius: {
      small: 4,
      medium: 8,
      large: 16,
      full: 9999
    }
  },
  ios: {
    spacingSystem: [4, 8, 12, 16, 20, 24, 32, 44, 48, 64],
    fontSizes: { h1: 34, h2: 28, h3: 22, body: 17, small: 15 },
    colors: {
      primary: '#007aff',
      secondary: '#8e8e93',
      success: '#34c759',
      warning: '#ff9500',
      error: '#ff3b30'
    },
    borderRadius: {
      small: 6,
      medium: 10,
      large: 14,
      full: 9999
    }
  },
  antdesign: {
    spacingSystem: [4, 8, 12, 16, 20, 24, 32, 40, 48],
    fontSizes: { h1: 38, h2: 30, h3: 24, body: 14, small: 12 },
    colors: {
      primary: '#1890ff',
      secondary: '#8c8c8c',
      success: '#52c41a',
      warning: '#faad14',
      error: '#f5222d'
    },
    borderRadius: {
      small: 2,
      medium: 6,
      large: 8,
      full: 9999
    }
  },
  bootstrap: {
    spacingSystem: [4, 8, 12, 16, 20, 24, 30, 36, 40, 48],
    fontSizes: { h1: 40, h2: 32, h3: 28, body: 16, small: 14 },
    colors: {
      primary: '#0d6efd',
      secondary: '#6c757d',
      success: '#198754',
      warning: '#ffc107',
      error: '#dc3545'
    },
    borderRadius: {
      small: 2,
      medium: 4,
      large: 6,
      full: 9999
    }
  },
  tailwind: {
    spacingSystem: [4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64],
    fontSizes: { h1: 36, h2: 30, h3: 24, body: 16, small: 14 },
    colors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    borderRadius: {
      small: 2,
      medium: 6,
      large: 12,
      full: 9999
    }
  }
}

// 方法
const applyPresetSystem = () => {
  if (!selectedSystem.value) return

  const preset = presetSystems[selectedSystem.value]
  if (preset) {
    spacingSystem.value = [...preset.spacingSystem]
    fontSizes.value = { ...preset.fontSizes }
    colors.value = { ...preset.colors }
    borderRadius.value = { ...preset.borderRadius }
  }
}

const addSpacingValue = () => {
  const lastValue = spacingSystem.value[spacingSystem.value.length - 1] || 0
  spacingSystem.value.push(lastValue + 4)
}

const runDesignCheck = () => {
  const issues = []
  const passedItems = []

  // 检查间距系统
  if (checkRules.value.spacing) {
    if (spacingSystem.value.length < 5) {
      issues.push({
        title: '间距值不足',
        description: '建议至少定义5个间距值以构建完整的间距系统',
        suggestion: '添加4px, 8px, 16px, 24px, 32px等基础间距值'
      })
    } else {
      const isConsistent = spacingSystem.value.every((val, index) => {
        if (index === 0) return true
        const prev = spacingSystem.value[index - 1]
        return val >= prev && val % 4 === 0
      })

      if (isConsistent) {
        passedItems.push('间距系统符合4px基准规则')
      } else {
        issues.push({
          title: '间距不一致',
          description: '间距值应遵循4px基准的倍数关系',
          suggestion: '调整间距值为4的倍数，如8px, 12px, 16px等'
        })
      }
    }
  }

  // 检查字体系统
  if (checkRules.value.typography) {
    const fontRatio = fontSizes.value.h1 / fontSizes.value.body
    if (fontRatio < 1.8 || fontRatio > 3) {
      issues.push({
        title: '标题字体比例不合适',
        description: `H1与正文的字体比例为${fontRatio.toFixed(2)}，建议在1.8-2.5之间`,
        suggestion: '调整H1字体大小，使其与正文保持良好的视觉层次'
      })
    } else {
      passedItems.push('字体系统层级合理')
    }

    if (fontSizes.value.h2 >= fontSizes.value.h1) {
      issues.push({
        title: '字体大小层级错误',
        description: 'H2字体大小不应大于或等于H1',
        suggestion: '调整H2字体大小，使其小于H1但大于H3'
      })
    }
  }

  // 检查颜色系统
  if (checkRules.value.colors) {
    const colorCount = Object.keys(colors.value).length
    if (colorCount < 3) {
      issues.push({
        title: '颜色数量不足',
        description: '建议至少定义3个系统颜色（主色、辅色、状态色）',
        suggestion: '添加主色、辅色、成功、警告、错误等基础颜色'
      })
    } else {
      passedItems.push('颜色系统完整')
    }
  }

  // 检查圆角系统
  if (checkRules.value.borderRadius) {
    if (borderRadius.value.small >= borderRadius.value.medium) {
      issues.push({
        title: '圆角层级错误',
        description: '小圆角不应大于或等于中等圆角',
        suggestion: '调整圆角值，确保小<中<大的层级关系'
      })
    } else {
      passedItems.push('圆角系统层级合理')
    }
  }

  // 检查对比度
  if (checkRules.value.contrast) {
    const primaryContrast = getContrastRatio(colors.value.primary, '#ffffff')
    if (primaryContrast < 4.5) {
      issues.push({
        title: '主色对比度不足',
        description: '主色与白色背景的对比度低于4.5，可能影响可读性',
        suggestion: '调整主色使其与白色背景的对比度达到4.5以上'
      })
    } else {
      passedItems.push('颜色对比度符合WCAG标准')
    }
  }

  // 计算分数
  const totalChecks = issues.length + passedItems.length
  const passedCount = passedItems.length
  const score = totalChecks > 0 ? Math.round((passedCount / totalChecks) * 100) : 0

  checkResults.value = {
    passed: passedCount,
    failed: issues.length,
    score,
    issues,
    passedItems
  }
}

const getContrastRatio = (color1, color2) => {
  // 简化的对比度计算，实际应该使用更精确的算法
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) return 1

  const l1 = getLuminance(rgb1)
  const l2 = getLuminance(rgb2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

const getLuminance = (rgb) => {
  const { r, g, b } = rgb
  const [rs, gs, bs] = [r, g, b].map(val => {
    val = val / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

const getScoreBarClass = (score) => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

const exportConfig = () => {
  const config = {
    spacingSystem: spacingSystem.value,
    fontSizes: fontSizes.value,
    colors: colors.value,
    borderRadius: borderRadius.value,
    checkRules: checkRules.value
  }

  const json = JSON.stringify(config, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = 'design-system.json'
  a.click()

  URL.revokeObjectURL(url)
}

const importConfig = () => {
  fileInput.value?.click()
}

const handleFileImport = (event) => {
  const file = event.target.files[0]
  if (file && file.type === 'application/json') {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result)

        if (config.spacingSystem) spacingSystem.value = config.spacingSystem
        if (config.fontSizes) fontSizes.value = config.fontSizes
        if (config.colors) colors.value = config.colors
        if (config.borderRadius) borderRadius.value = config.borderRadius
        if (config.checkRules) checkRules.value = config.checkRules
      } catch (error) {
        console.error('配置文件格式错误:', error)
      }
    }
    reader.readAsText(file)
  }
}
</script>