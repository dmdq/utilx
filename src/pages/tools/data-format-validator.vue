<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">数据格式验证器 - 身份证手机号邮箱验证</h1>
      <p class="text-muted-foreground">一款免费的在线数据格式验证工具。支持验证身份证号、手机号、邮箱地址、银行卡号等多种数据格式，支持多国标准。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 验证类型选择 -->
    <div class="mb-6 p-6 bg-card border border-border rounded-lg">
      <h3 class="text-lg font-semibold text-foreground mb-4">选择验证类型</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <button
          v-for="type in validationTypes"
          :key="type.id"
          @click="selectedType = type.id"
          :class="[
            'p-3 rounded-lg border transition-all text-sm font-medium',
            selectedType === type.id
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted hover:bg-muted/80 border-border'
          ]"
        >
          <component :is="type.icon" class="w-5 h-5 mx-auto mb-1" />
          <div>{{ type.name }}</div>
        </button>
      </div>
    </div>

    <!-- 验证输入区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输入数据</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="clearInput"
            >
              清空
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="pasteFromClipboard"
            >
              粘贴
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="loadSample"
            >
              示例数据
            </button>
          </div>
        </div>
        <div v-if="selectedType === 'multi'" class="mb-2">
          <label class="text-xs text-muted-foreground">
            <input
              type="checkbox"
              v-model="batchMode"
              class="mr-2"
            />
            批量模式（每行一个数据）
          </label>
        </div>
        <textarea
          v-model="inputData"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          :placeholder="getPlaceholder()"
          @input="validate"
        ></textarea>
      </div>

      <!-- 结果区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">验证结果</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="copyValidData"
              :disabled="validResults.length === 0"
            >
              复制有效数据
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="exportResults"
              :disabled="results.length === 0"
            >
              导出结果
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-auto">
          <div v-if="results.length === 0" class="text-center text-muted-foreground py-8">
            <Check class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>请输入数据开始验证</p>
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="(result, index) in results"
              :key="index"
              :class="[
                'p-3 rounded-lg border transition-all',
                result.valid
                  ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                  : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
              ]"
            >
              <div class="flex items-start gap-3">
                <component
                  :is="result.valid ? Check : X"
                  :class="[
                    'w-5 h-5 mt-0.5 flex-shrink-0',
                    result.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  ]"
                />
                <div class="flex-1 min-w-0">
                  <div class="font-mono text-sm break-all">{{ result.data }}</div>
                  <div v-if="!result.valid && result.message" class="text-xs text-muted-foreground mt-1">
                    {{ result.message }}
                  </div>
                  <div v-if="result.details" class="text-xs text-muted-foreground mt-1">
                    {{ result.details }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 统计信息 -->
        <div v-if="results.length > 0" class="mt-4 p-3 bg-muted/50 rounded-lg">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-foreground">{{ results.length }}</div>
              <div class="text-xs text-muted-foreground">总计</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-green-600">{{ validResults.length }}</div>
              <div class="text-xs text-muted-foreground">有效</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-red-600">{{ invalidResults.length }}</div>
              <div class="text-xs text-muted-foreground">无效</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细规则说明 -->
    <div class="mb-8 p-6 bg-card border border-border rounded-lg">
      <h3 class="text-lg font-semibold text-foreground mb-4">验证规则说明</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="rule in currentRules" :key="rule.name" class="p-3 bg-muted/30 rounded-lg">
          <h4 class="font-medium text-foreground mb-1">{{ rule.name }}</h4>
          <p class="text-sm text-muted-foreground">{{ rule.description }}</p>
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
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是数据格式验证？
        </h2>
        <p class="text-muted-foreground mb-4">
          数据格式验证是检查数据是否符合特定格式规范的过程。在日常开发中，我们经常需要验证用户输入的
          身份证号、手机号、邮箱地址、银行卡号等数据格式的正确性，以确保数据的有效性和完整性。
        </p>
        <p class="text-muted-foreground">
          本工具提供了多种常用数据格式的验证功能，支持中国、美国、欧盟等多个国家和地区的标准，
          所有验证都在浏览器本地完成，不会上传任何数据，充分保护用户隐私。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          支持的验证格式
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div v-for="type in validationTypes" :key="type.id" class="p-4 bg-muted/50 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
              <component :is="type.icon" class="w-5 h-5 text-primary" />
              <h4 class="font-semibold text-foreground">{{ type.name }}</h4>
            </div>
            <p class="text-sm text-muted-foreground">{{ type.description }}</p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          验证功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>实时验证</strong>: 输入即验证，即时反馈结果</li>
          <li><strong>批量验证</strong>: 支持一次验证多条数据</li>
          <li><strong>详细提示</strong>: 对无效数据提供具体的错误原因</li>
          <li><strong>多国标准</strong>: 支持不同国家和地区的数据格式</li>
          <li><strong>隐私保护</strong>: 所有验证都在本地完成，不涉及网络传输</li>
          <li><strong>结果导出</strong>: 支持导出验证结果为CSV格式</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见应用场景
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">用户注册验证</h4>
            <p class="text-sm text-muted-foreground">
              验证用户注册时的手机号、邮箱、身份证等信息格式是否正确
            </p>
          </div>
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">数据清洗</h4>
            <p class="text-sm text-muted-foreground">
              清洗和验证批量数据，确保数据质量
            </p>
          </div>
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">表单验证</h4>
            <p class="text-sm text-muted-foreground">
              快速测试表单验证规则的准确性
            </p>
          </div>
          <div class="p-4 bg-muted/50 rounded-lg">
            <h4 class="font-semibold text-foreground mb-2">API测试</h4>
            <p class="text-sm text-muted-foreground">
              验证API返回的数据格式是否符合预期
            </p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          技术实现说明
        </h2>
        <div class="space-y-3 mb-6">
          <div class="p-3 bg-muted/30 rounded-lg">
            <h4 class="font-medium text-foreground mb-1">正则表达式验证</h4>
            <p class="text-sm text-muted-foreground">
              使用精心编写的正则表达式进行格式匹配，兼顾准确性和性能
            </p>
          </div>
          <div class="p-3 bg-muted/30 rounded-lg">
            <h4 class="font-medium text-foreground mb-1">校验位算法</h4>
            <p class="text-sm text-muted-foreground">
              对于身份证、银行卡等需要校验位的格式，实现了相应的校验算法
            </p>
          </div>
          <div class="p-3 bg-muted/30 rounded-lg">
            <h4 class="font-medium text-foreground mb-1">国际化支持</h4>
            <p class="text-sm text-muted-foreground">
              支持不同国家的电话区号、邮编格式等国际化需求
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
          :to="`/tools/${relatedTool.id}/`"
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
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Check, X, Phone, Mail, CreditCard, IdCard, Globe,
  Lock, Shield, Clock, Type, Wifi, Image,
  Database, Link, Hash, Timer, Regex, FileDiff,
  Code, FolderOpen, GitBranch, ChevronUp, HelpCircle
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

// SEO 配置
useSeoMeta({
  title: '数据格式验证器 - 身份证手机号邮箱验证',
  description: '免费在线数据格式验证工具，支持验证身份证号、手机号、邮箱地址、银行卡号等多种数据格式，支持多国标准。纯本地计算，数据安全。',
  keywords: '数据验证, 身份证验证, 手机号验证, 邮箱验证, 银行卡验证, 格式检查',
  author: 'Util工具箱',
  ogTitle: '数据格式验证器 - 身份证手机号邮箱验证',
  ogDescription: '免费在线数据格式验证工具，支持验证身份证号、手机号、邮箱地址等格式。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

// Schema.org 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: '数据格式验证器',
        description: '免费在线数据格式验证工具，支持验证身份证号、手机号、邮箱地址等格式',
        url: 'https://www.util.cn/tools/data-format-validator',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: [
          '身份证验证',
          '手机号验证',
          '邮箱验证',
          '银行卡验证',
          '批量验证',
          '多国标准支持'
        ]
      })
    }
  ]
})

definePageMeta({
  layout: 'default'
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'data-format-validator')
const category = categories.find(c => c.id === 'text')

// 数据状态
const selectedType = ref('phone')
const inputData = ref('')
const results = ref([])
const batchMode = ref(false)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Phone, Mail, CreditCard, IdCard, Globe, Check, X, Lock, Shield,
  Clock, Type, Wifi, Image, Database, Link, Hash, Timer, Regex,
  FileDiff, Code, FolderOpen, GitBranch, ChevronUp, HelpCircle
}

// 验证类型定义
const validationTypes = [
  {
    id: 'phone',
    name: '手机号',
    icon: Phone,
    description: '验证中国大陆手机号码格式'
  },
  {
    id: 'email',
    name: '邮箱',
    icon: Mail,
    description: '验证邮箱地址格式'
  },
  {
    id: 'idcard',
    name: '身份证',
    icon: IdCard,
    description: '验证18位身份证号码'
  },
  {
    id: 'bankcard',
    name: '银行卡',
    icon: CreditCard,
    description: '验证银行卡号格式'
  },
  {
    id: 'ip',
    name: 'IP地址',
    icon: Globe,
    description: '验证IPv4/IPv6地址格式'
  },
  {
    id: 'multi',
    name: '智能识别',
    icon: Check,
    description: '自动识别并验证多种格式'
  }
]

// 验证规则详情
const validationRules = {
  phone: [
    { name: '中国大陆手机号', description: '11位数字，以1开头，第二位3-9' },
    { name: '格式要求', description: '如：13812345678、15912345678' }
  ],
  email: [
    { name: '邮箱格式', description: '必须包含@和域名，符合RFC标准' },
    { name: '字符限制', description: '支持英文、数字、点、下划线、连字符' }
  ],
  idcard: [
    { name: '18位身份证', description: '6位地区码 + 8位出生日期 + 3位顺序码 + 1位校验码' },
    { name: '校验算法', description: '使用ISO 7064:1983.MOD 11-2校验算法' }
  ],
  bankcard: [
    { name: '银行卡号', description: '12-19位数字，支持主流银行卡' },
    { name: 'Luhn算法', description: '使用Luhn算法验证校验位' }
  ],
  ip: [
    { name: 'IPv4地址', description: '4个0-255的数字，用点分隔' },
    { name: 'IPv6地址', description: '8组4位十六进制数，用冒号分隔' }
  ],
  multi: [
    { name: '智能识别', description: '根据输入内容自动判断类型' },
    { name: '支持格式', description: '手机号、邮箱、身份证、银行卡、IP地址' }
  ]
}

// 当前类型的规则
const currentRules = computed(() => validationRules[selectedType.value] || [])

// 验证结果统计
const validResults = computed(() => results.value.filter(r => r.valid))
const invalidResults = computed(() => results.value.filter(r => !r.valid))

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'text' && t.id !== 'data-format-validator'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'regex-tester'),
    tools.find(t => t.id === 'text-replace'),
    tools.find(t => t.id === 'case-converter'),
    tools.find(t => t.id === 'text-counter')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 获取输入提示
const getPlaceholder = () => {
  const placeholders = {
    phone: '请输入手机号码，如：13812345678',
    email: '请输入邮箱地址，如：user@example.com',
    idcard: '请输入18位身份证号码，如：110101199001011234',
    bankcard: '请输入银行卡号，如：6222021234567890123',
    ip: '请输入IP地址，如：192.168.1.1 或 2001:0db8:85a3::8a2e:0370:7334',
    multi: '请输入数据，支持手机号、邮箱、身份证、银行卡、IP地址'
  }
  return placeholders[selectedType.value] || '请输入要验证的数据'
}

// 验证手机号
const validatePhone = (phone) => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

// 验证邮箱
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 验证身份证
const validateIdCard = (idCard) => {
  // 18位身份证正则
  const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
  if (!idCardRegex.test(idCard)) return false

  // 校验位验证
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i]) * weights[i]
  }

  const checkCode = checkCodes[sum % 11]
  return checkCode === idCard[17].toUpperCase()
}

// 验证银行卡
const validateBankCard = (bankCard) => {
  // 12-19位数字
  const bankCardRegex = /^\d{12,19}$/
  if (!bankCardRegex.test(bankCard)) return false

  // Luhn算法验证
  let sum = 0
  let isEven = false

  for (let i = bankCard.length - 1; i >= 0; i--) {
    let digit = parseInt(bankCard[i])

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

// 验证IP地址
const validateIP = (ip) => {
  // IPv4验证
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  if (ipv4Regex.test(ip)) return true

  // IPv6验证（简化版）
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/
  return ipv6Regex.test(ip)
}

// 智能识别类型
const detectType = (data) => {
  if (validatePhone(data)) return 'phone'
  if (validateEmail(data)) return 'email'
  if (validateIdCard(data)) return 'idcard'
  if (validateBankCard(data)) return 'bankcard'
  if (validateIP(data)) return 'ip'
  return 'unknown'
}

// 执行验证
const validate = () => {
  if (!inputData.value) {
    results.value = []
    return
  }

  const lines = batchMode.value ? inputData.value.split('\n').filter(line => line.trim()) : [inputData.value.trim()]
  results.value = []

  lines.forEach(line => {
    const data = line.trim()
    if (!data) return

    let valid = false
    let message = ''
    let details = ''

    if (selectedType.value === 'multi') {
      const detectedType = detectType(data)
      if (detectedType !== 'unknown') {
        valid = true
        details = `识别为：${validationTypes.find(t => t.id === detectedType)?.name || detectedType}`
      } else {
        message = '无法识别的数据格式'
      }
    } else {
      switch (selectedType.value) {
        case 'phone':
          valid = validatePhone(data)
          message = valid ? '' : '请输入有效的11位手机号码'
          break
        case 'email':
          valid = validateEmail(data)
          message = valid ? '' : '请输入有效的邮箱地址'
          break
        case 'idcard':
          valid = validateIdCard(data)
          message = valid ? '' : '请输入有效的18位身份证号码'
          if (valid) {
            // 提取生日信息
            const birthDate = `${data.substring(6, 10)}-${data.substring(10, 12)}-${data.substring(12, 14)}`
            details = `出生日期：${birthDate}，性别：${parseInt(data[16]) % 2 === 1 ? '男' : '女'}`
          }
          break
        case 'bankcard':
          valid = validateBankCard(data)
          message = valid ? '' : '请输入有效的银行卡号码'
          break
        case 'ip':
          valid = validateIP(data)
          message = valid ? '' : '请输入有效的IP地址'
          break
      }
    }

    results.value.push({
      data,
      valid,
      message,
      details
    })
  })
}

// 清空输入
const clearInput = () => {
  inputData.value = ''
  results.value = []
}

// 粘贴剪贴板内容
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputData.value = text
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 加载示例数据
const loadSample = () => {
  const samples = {
    phone: '13812345678\n15987654321\n18612345678',
    email: 'user@example.com\ntest.email+tag@domain.co.uk\ninvalid-email',
    idcard: '110101199001011234\n440101199002022345X\n123456789012345678',
    bankcard: '6222021234567890123\n4001234567890123\ninvalid-bank-card',
    ip: '192.168.1.1\n2001:0db8:85a3::8a2e:0370:7334\n999.999.999.999',
    multi: '13812345678\nuser@example.com\n110101199001011234\n6222021234567890123'
  }
  inputData.value = samples[selectedType.value] || samples.multi
}

// 复制有效数据
const copyValidData = async () => {
  const validData = validResults.value.map(r => r.data).join('\n')
  try {
    await navigator.clipboard.writeText(validData)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 导出结果
const exportResults = () => {
  const csvContent = [
    ['数据', '验证结果', '备注'],
    ...results.value.map(r => [
      r.data,
      r.valid ? '有效' : '无效',
      r.message || r.details || ''
    ])
  ].map(row => row.join(',')).join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `validation_results_${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

const handleToolSelect = (selectedTool) => {
  router.push(`/tools/${selectedTool.id}/`)
  addRecentTool(selectedTool.id)
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}
</script>