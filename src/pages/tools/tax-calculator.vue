<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" :tool="tool" /> -->

    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">税务计算器 - 个人所得税、增值税、企业所得税计算</h1>
      <p class="text-muted-foreground">支持2025年最新税率表，计算个人所得税、增值税、企业所得税等多种税费。包含专项扣除、起征点、税率和速算扣除数等专业计算。</p>
    </div>

    <!-- 税种选择 -->
    <div class="mb-6">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="taxType in taxTypes"
          :key="taxType.id"
          @click="currentTaxType = taxType.id"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            currentTaxType === taxType.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          ]"
        >
          {{ taxType.name }}
        </button>
      </div>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">参数设置</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="clearInput"
            >
              清空
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="loadExample"
            >
              示例数据
            </button>
          </div>
        </div>

        <!-- 个人所得税输入 -->
        <div v-if="currentTaxType === 'personal'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">税前月收入 (元)</label>
            <input
              v-model.number="personalIncome.salary"
              @input="calculateTax"
              type="number"
              min="0"
              step="100"
              placeholder="10000"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">社保基数 (元)</label>
            <input
              v-model.number="personalIncome.socialBase"
              @input="calculateTax"
              type="number"
              min="0"
              step="100"
              placeholder="5000"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">公积金基数 (元)</label>
            <input
              v-model.number="personalIncome.fundBase"
              @input="calculateTax"
              type="number"
              min="0"
              step="100"
              placeholder="5000"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">专项扣除 (元)</label>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm">子女教育</span>
                <input
                  v-model.number="personalIncome.deductions.children"
                  @input="calculateTax"
                  type="number"
                  min="0"
                  step="1000"
                  class="w-32 px-2 py-1 bg-muted border border-border rounded"
                />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">继续教育</span>
                <input
                  v-model.number="personalIncome.deductions.education"
                  @input="calculateTax"
                  type="number"
                  min="0"
                  step="400"
                  class="w-32 px-2 py-1 bg-muted border border-border rounded"
                />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">住房贷款利息</span>
                <input
                  v-model.number="personalIncome.deductions.loan"
                  @input="calculateTax"
                  type="number"
                  min="0"
                  step="1000"
                  class="w-32 px-2 py-1 bg-muted border border-border rounded"
                />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">住房租金</span>
                <input
                  v-model.number="personalIncome.deductions.rent"
                  @input="calculateTax"
                  type="number"
                  min="0"
                  step="1500"
                  class="w-32 px-2 py-1 bg-muted border border-border rounded"
                />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">赡养老人</span>
                <input
                  v-model.number="personalIncome.deductions.elderly"
                  @input="calculateTax"
                  type="number"
                  min="0"
                  step="2000"
                  class="w-32 px-2 py-1 bg-muted border border-border rounded"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 增值税输入 -->
        <div v-if="currentTaxType === 'vat'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">商品类型</label>
            <select
              v-model="vatData.type"
              @change="calculateTax"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="general">一般纳税人 (13%)</option>
              <option value="small">小规模纳税人 (3%)</option>
              <option value="service">服务业 (6%)</option>
              <option value="transport">交通运输业 (9%)</option>
              <option value="construction">建筑业 (9%)</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">含税销售额 (元)</label>
            <input
              v-model.number="vatData.amount"
              @input="calculateTax"
              type="number"
              min="0"
              step="100"
              placeholder="100000"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">进项税额 (元)</label>
            <input
              v-model.number="vatData.inputTax"
              @input="calculateTax"
              type="number"
              min="0"
              step="100"
              placeholder="0"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <!-- 企业所得税输入 -->
        <div v-if="currentTaxType === 'corporate'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">收入总额 (元)</label>
            <input
              v-model.number="corporateData.revenue"
              @input="calculateTax"
              type="number"
              min="0"
              step="1000"
              placeholder="1000000"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">成本费用 (元)</label>
            <input
              v-model.number="corporateData.costs"
              @input="calculateTax"
              type="number"
              min="0"
              step="1000"
              placeholder="600000"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">企业类型</label>
            <select
              v-model="corporateData.type"
              @change="calculateTax"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="general">一般企业 (25%)</option>
              <option value="small">小型微利企业 (20%)</option>
              <option value="tech">高新技术企业 (15%)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">计算结果</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="copyResult"
            >
              复制结果
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="exportResult"
            >
              导出报告
            </button>
          </div>
        </div>

        <div class="flex-1 p-4 bg-muted border border-border rounded-lg overflow-auto">
          <!-- 个人所得税结果 -->
          <div v-if="currentTaxType === 'personal' && result.personal" class="space-y-4">
            <h3 class="text-lg font-semibold mb-3">个人所得税明细</h3>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-muted-foreground">税前工资</p>
                <p class="text-lg font-medium">¥{{ formatCurrency(personalIncome.salary) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">应纳税所得额</p>
                <p class="text-lg font-medium">¥{{ formatCurrency(result.personal.taxableIncome) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">适用税率</p>
                <p class="text-lg font-medium">{{ result.personal.rate }}%</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">速算扣除数</p>
                <p class="text-lg font-medium">¥{{ formatCurrency(result.personal.quickDeduction) }}</p>
              </div>
            </div>

            <div class="border-t pt-4">
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <p class="text-sm text-muted-foreground">社保公积金</p>
                  <p class="text-lg font-medium text-blue-600">-¥{{ formatCurrency(result.personal.social) }}</p>
                </div>
                <div>
                  <p class="text-sm text-muted-foreground">个人所得税</p>
                  <p class="text-lg font-medium text-red-600">-¥{{ formatCurrency(result.personal.tax) }}</p>
                </div>
                <div>
                  <p class="text-sm text-muted-foreground">税后收入</p>
                  <p class="text-lg font-medium text-green-600">¥{{ formatCurrency(result.personal.afterTax) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 增值税结果 -->
          <div v-if="currentTaxType === 'vat' && result.vat" class="space-y-4">
            <h3 class="text-lg font-semibold mb-3">增值税计算明细</h3>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-muted-foreground">不含税销售额</p>
                <p class="text-lg font-medium">¥{{ formatCurrency(result.vat.netAmount) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">销项税额</p>
                <p class="text-lg font-medium">¥{{ formatCurrency(result.vat.outputTax) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">进项税额</p>
                <p class="text-lg font-medium">¥{{ formatCurrency(vatData.inputTax) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">应交增值税</p>
                <p class="text-lg font-medium text-red-600">¥{{ formatCurrency(result.vat.vatPayable) }}</p>
              </div>
            </div>
          </div>

          <!-- 企业所得税结果 -->
          <div v-if="currentTaxType === 'corporate' && result.corporate" class="space-y-4">
            <h3 class="text-lg font-semibold mb-3">企业所得税计算明细</h3>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-muted-foreground">收入总额</p>
                <p class="text-lg font-medium">¥{{ formatCurrency(corporateData.revenue) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">成本费用</p>
                <p class="text-lg font-medium">¥{{ formatCurrency(corporateData.costs) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">利润总额</p>
                <p class="text-lg font-medium">¥{{ formatCurrency(result.corporate.profit) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">适用税率</p>
                <p class="text-lg font-medium">{{ result.corporate.rate }}%</p>
              </div>
            </div>

            <div class="border-t pt-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-muted-foreground">应交企业所得税</p>
                  <p class="text-lg font-medium text-red-600">¥{{ formatCurrency(result.corporate.tax) }}</p>
                </div>
                <div>
                  <p class="text-sm text-muted-foreground">税后净利润</p>
                  <p class="text-lg font-medium text-green-600">¥{{ formatCurrency(result.corporate.afterTax) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 计算按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="calculateTax"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        计算税费
      </button>
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
          什么是税务计算？
        </h2>
        <p class="text-muted-foreground mb-4">
          税务计算是指根据国家税法规定，对个人或企业的收入、利润等按照相应税率计算应纳税额的过程。
          中国的主要税种包括个人所得税、增值税、企业所得税等，每种税都有不同的税率结构和计算方法。
          正确计算税费对于个人财务规划和企业经营管理都具有重要意义。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          2025年个人所得税税率表
        </h2>
        <div class="overflow-x-auto mb-6">
          <table class="w-full border-collapse border border-border">
            <thead>
              <tr class="bg-muted">
                <th class="border border-border px-4 py-2 text-left">级数</th>
                <th class="border border-border px-4 py-2 text-left">全年应纳税所得额</th>
                <th class="border border-border px-4 py-2 text-left">税率(%)</th>
                <th class="border border-border px-4 py-2 text-left">速算扣除数</th>
              </tr>
            </thead>
            <tbody>
              <tr><td class="border border-border px-4 py-2">1</td><td class="border border-border px-4 py-2">不超过36,000元</td><td class="border border-border px-4 py-2">3</td><td class="border border-border px-4 py-2">0</td></tr>
              <tr><td class="border border-border px-4 py-2">2</td><td class="border border-border px-4 py-2">36,000-144,000元</td><td class="border border-border px-4 py-2">10</td><td class="border border-border px-4 py-2">2,520</td></tr>
              <tr><td class="border border-border px-4 py-2">3</td><td class="border border-border px-4 py-2">144,000-300,000元</td><td class="border border-border px-4 py-2">20</td><td class="border border-border px-4 py-2">16,920</td></tr>
              <tr><td class="border border-border px-4 py-2">4</td><td class="border border-border px-4 py-2">300,000-420,000元</td><td class="border border-border px-4 py-2">25</td><td class="border border-border px-4 py-2">31,920</td></tr>
              <tr><td class="border border-border px-4 py-2">5</td><td class="border border-border px-4 py-2">420,000-660,000元</td><td class="border border-border px-4 py-2">30</td><td class="border border-border px-4 py-2">52,920</td></tr>
              <tr><td class="border border-border px-4 py-2">6</td><td class="border border-border px-4 py-2">660,000-960,000元</td><td class="border border-border px-4 py-2">35</td><td class="border border-border px-4 py-2">85,920</td></tr>
              <tr><td class="border border-border px-4 py-2">7</td><td class="border border-border px-4 py-2">超过960,000元</td><td class="border border-border px-4 py-2">45</td><td class="border border-border px-4 py-2">181,920</td></tr>
            </tbody>
          </table>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本税务计算器
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择需要计算的税种类型（个人所得税、增值税、企业所得税）</li>
          <li>输入相应的收入、成本等基础数据</li>
          <li>设置专项扣除、社保公积金等参数（个人所得税）</li>
          <li>点击"计算税费"按钮获取结果</li>
          <li>查看详细的计算明细和各项税费金额</li>
        </ol>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Receipt, Calculator, Copy, Download, HelpCircle, ChevronUp, DollarSign,
  FileText, Lock, Shield, Clock, Type, Wifi, Image, Code,
  Database, Link, Hash, Timer, TrendingUp, FileDiff,
  Globe, FolderOpen, GitBranch
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

definePageMeta({
  layout: 'default'
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'tax-calculator')
const category = categories.find(c => c.id === 'finance')

// 税种类型
const taxTypes = [
  { id: 'personal', name: '个人所得税' },
  { id: 'vat', name: '增值税' },
  { id: 'corporate', name: '企业所得税' }
]

const currentTaxType = ref('personal')

// 个人所得税数据
const personalIncome = ref({
  salary: 10000,
  socialBase: 5000,
  fundBase: 5000,
  deductions: {
    children: 0,
    education: 0,
    loan: 0,
    rent: 0,
    elderly: 0
  }
})

// 增值税数据
const vatData = ref({
  type: 'general',
  amount: 100000,
  inputTax: 0
})

// 企业所得税数据
const corporateData = ref({
  revenue: 1000000,
  costs: 600000,
  type: 'general'
})

// 计算结果
const result = ref({
  personal: null,
  vat: null,
  corporate: null
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Receipt, Calculator, Copy, Download, HelpCircle, ChevronUp, DollarSign,
  FileText, Lock, Shield, Clock, Type, Wifi, Image, Code,
  Database, Link, Hash, Timer, TrendingUp, FileDiff,
  Globe, FolderOpen, GitBranch
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'finance' && t.id !== 'tax-calculator'
  ).slice(0, 4)
  return sameCategory
})

// 格式化货币
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0'
  return new Intl.NumberFormat('zh-CN').format(Math.round(amount))
}

// 计算税费
const calculateTax = () => {
  if (currentTaxType.value === 'personal') {
    calculatePersonalTax()
  } else if (currentTaxType.value === 'vat') {
    calculateVAT()
  } else if (currentTaxType.value === 'corporate') {
    calculateCorporateTax()
  }
}

// 计算个人所得税
const calculatePersonalTax = () => {
  const salary = personalIncome.value.salary
  const socialBase = personalIncome.value.socialBase
  const fundBase = personalIncome.value.fundBase

  // 社保公积金缴纳比例
  const socialRate = 0.105 // 10.5%
  const fundRate = 0.07 // 7%

  const socialPayment = Math.min(salary, socialBase) * socialRate
  const fundPayment = Math.min(salary, fundBase) * fundRate
  const totalSocial = socialPayment + fundPayment

  // 专项扣除
  const deductions = Object.values(personalIncome.value.deductions).reduce((sum, val) => sum + val, 0)

  // 起征点
  const basicDeduction = 5000

  // 应纳税所得额
  const monthlyTaxableIncome = Math.max(0, salary - totalSocial - deductions - basicDeduction)
  const annualTaxableIncome = monthlyTaxableIncome * 12

  // 计算税率和速算扣除数
  let rate = 0
  let quickDeduction = 0

  if (annualTaxableIncome <= 36000) {
    rate = 3
    quickDeduction = 0
  } else if (annualTaxableIncome <= 144000) {
    rate = 10
    quickDeduction = 2520
  } else if (annualTaxableIncome <= 300000) {
    rate = 20
    quickDeduction = 16920
  } else if (annualTaxableIncome <= 420000) {
    rate = 25
    quickDeduction = 31920
  } else if (annualTaxableIncome <= 660000) {
    rate = 30
    quickDeduction = 52920
  } else if (annualTaxableIncome <= 960000) {
    rate = 35
    quickDeduction = 85920
  } else {
    rate = 45
    quickDeduction = 181920
  }

  // 年度应纳税额
  const annualTax = Math.max(0, annualTaxableIncome * rate / 100 - quickDeduction)
  const monthlyTax = annualTax / 12

  // 税后收入
  const afterTax = salary - totalSocial - monthlyTax

  result.value.personal = {
    taxableIncome: monthlyTaxableIncome,
    rate,
    quickDeduction,
    tax: monthlyTax,
    social: totalSocial,
    afterTax
  }
}

// 计算增值税
const calculateVAT = () => {
  const type = vatData.value.type
  const amount = vatData.value.amount
  const inputTax = vatData.value.inputTax || 0

  let rate = 0

  switch (type) {
    case 'general':
      rate = 0.13
      break
    case 'small':
      rate = 0.03
      break
    case 'service':
      rate = 0.06
      break
    case 'transport':
    case 'construction':
      rate = 0.09
      break
  }

  const netAmount = amount / (1 + rate)
  const outputTax = netAmount * rate
  const vatPayable = Math.max(0, outputTax - inputTax)

  result.value.vat = {
    netAmount,
    outputTax,
    vatPayable
  }
}

// 计算企业所得税
const calculateCorporateTax = () => {
  const revenue = corporateData.value.revenue
  const costs = corporateData.value.costs
  const type = corporateData.value.type

  let rate = 0.25

  switch (type) {
    case 'small':
      rate = 0.20
      break
    case 'tech':
      rate = 0.15
      break
  }

  const profit = Math.max(0, revenue - costs)
  const tax = profit * rate
  const afterTax = profit - tax

  result.value.corporate = {
    profit,
    rate: rate * 100,
    tax,
    afterTax
  }
}

// 清空输入
const clearInput = () => {
  if (currentTaxType.value === 'personal') {
    personalIncome.value = {
      salary: 0,
      socialBase: 0,
      fundBase: 0,
      deductions: {
        children: 0,
        education: 0,
        loan: 0,
        rent: 0,
        elderly: 0
      }
    }
  } else if (currentTaxType.value === 'vat') {
    vatData.value = {
      type: 'general',
      amount: 0,
      inputTax: 0
    }
  } else if (currentTaxType.value === 'corporate') {
    corporateData.value = {
      revenue: 0,
      costs: 0,
      type: 'general'
    }
  }

  result.value = {
    personal: null,
    vat: null,
    corporate: null
  }
}

// 加载示例数据
const loadExample = () => {
  if (currentTaxType.value === 'personal') {
    personalIncome.value = {
      salary: 15000,
      socialBase: 8000,
      fundBase: 8000,
      deductions: {
        children: 1000,
        education: 400,
        loan: 1000,
        rent: 1500,
        elderly: 2000
      }
    }
  } else if (currentTaxType.value === 'vat') {
    vatData.value = {
      type: 'general',
      amount: 113000,
      inputTax: 5000
    }
  } else if (currentTaxType.value === 'corporate') {
    corporateData.value = {
      revenue: 2000000,
      costs: 1200000,
      type: 'general'
    }
  }

  calculateTax()
}

// 复制结果
const copyResult = async () => {
  let resultText = '税费计算结果\n\n'

  if (currentTaxType.value === 'personal' && result.value.personal) {
    const r = result.value.personal
    resultText += `个人所得税计算结果：\n`
    resultText += `税前工资：¥${formatCurrency(personalIncome.value.salary)}\n`
    resultText += `社保公积金：¥${formatCurrency(r.social)}\n`
    resultText += `应纳税所得额：¥${formatCurrency(r.taxableIncome)}\n`
    resultText += `适用税率：${r.rate}%\n`
    resultText += `个人所得税：¥${formatCurrency(r.tax)}\n`
    resultText += `税后收入：¥${formatCurrency(r.afterTax)}\n`
  } else if (currentTaxType.value === 'vat' && result.value.vat) {
    const r = result.value.vat
    resultText += `增值税计算结果：\n`
    resultText += `含税销售额：¥${formatCurrency(vatData.value.amount)}\n`
    resultText += `不含税销售额：¥${formatCurrency(r.netAmount)}\n`
    resultText += `销项税额：¥${formatCurrency(r.outputTax)}\n`
    resultText += `进项税额：¥${formatCurrency(vatData.value.inputTax)}\n`
    resultText += `应交增值税：¥${formatCurrency(r.vatPayable)}\n`
  } else if (currentTaxType.value === 'corporate' && result.value.corporate) {
    const r = result.value.corporate
    resultText += `企业所得税计算结果：\n`
    resultText += `收入总额：¥${formatCurrency(corporateData.value.revenue)}\n`
    resultText += `成本费用：¥${formatCurrency(corporateData.value.costs)}\n`
    resultText += `利润总额：¥${formatCurrency(r.profit)}\n`
    resultText += `适用税率：${r.rate}%\n`
    resultText += `企业所得税：¥${formatCurrency(r.tax)}\n`
    resultText += `税后净利润：¥${formatCurrency(r.afterTax)}\n`
  }

  try {
    await navigator.clipboard.writeText(resultText)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 导出结果
const exportResult = () => {
  let resultHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>税费计算结果</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin: 20px 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .item { padding: 10px; border: 1px solid #ddd; }
        .label { font-weight: bold; }
        .value { color: #333; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>税费计算结果报告</h1>
        <p>计算时间：${new Date().toLocaleString('zh-CN')}</p>
      </div>
  `

  if (currentTaxType.value === 'personal' && result.value.personal) {
    const r = result.value.personal
    resultHtml += `
      <div class="section">
        <h2>个人所得税计算结果</h2>
        <div class="grid">
          <div class="item"><span class="label">税前工资：</span><span class="value">¥${formatCurrency(personalIncome.value.salary)}</span></div>
          <div class="item"><span class="label">社保公积金：</span><span class="value">¥${formatCurrency(r.social)}</span></div>
          <div class="item"><span class="label">应纳税所得额：</span><span class="value">¥${formatCurrency(r.taxableIncome)}</span></div>
          <div class="item"><span class="label">适用税率：</span><span class="value">${r.rate}%</span></div>
          <div class="item"><span class="label">个人所得税：</span><span class="value">¥${formatCurrency(r.tax)}</span></div>
          <div class="item"><span class="label">税后收入：</span><span class="value">¥${formatCurrency(r.afterTax)}</span></div>
        </div>
      </div>
    `
  }

  resultHtml += `
    </body>
    </html>
  `

  const blob = new Blob([resultHtml], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `税费计算结果_${new Date().getTime()}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 初始化计算
onMounted(() => {
  calculateTax()
})
</script>