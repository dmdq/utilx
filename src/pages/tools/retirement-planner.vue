<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">退休储蓄规划器 - 制定完善的养老计划</h1>
      <p class="text-muted-foreground">专业的退休规划工具，计算退休目标储蓄金额和月储蓄建议，考虑通胀率和多种收入来源，帮助您制定合理的退休规划，享受体面的退休生活。</p>
    </div>

    <!-- 规划模式选择 -->
    <div class="mb-6">
      <div class="flex flex-wrap gap-2">
        <button
          @click="activeTab = 'calculator'"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeTab === 'calculator'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          ]"
        >
          <Calculator class="w-4 h-4 inline mr-2" />
          规划计算器
        </button>
        <button
          @click="activeTab = 'guide'"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeTab === 'guide'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          ]"
        >
          <FileText class="w-4 h-4 inline mr-2" />
          攻略指南
        </button>
      </div>
    </div>

    <!-- 计算器内容 -->
    <div v-if="activeTab === 'calculator'">
      <!-- 主要功能区域 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- 输入区域 -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 基础信息 -->
          <div class="bg-card rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
              <Target class="w-5 h-5 mr-2 text-primary" />
              基础信息
            </h3>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">当前年龄</label>
                <input
                  v-model.number="currentAge"
                  type="number"
                  min="18"
                  max="100"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">计划退休年龄</label>
                <input
                  v-model.number="retirementAge"
                  type="number"
                  min="50"
                  max="80"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">预期寿命</label>
                <input
                  v-model.number="lifeExpectancy"
                  type="number"
                  min="70"
                  max="120"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">当前月收入 (元)</label>
                <input
                  v-model.number="currentMonthlyIncome"
                  type="number"
                  min="0"
                  step="1000"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">当前月支出 (元)</label>
                <input
                  v-model.number="currentMonthlyExpenses"
                  type="number"
                  min="0"
                  step="1000"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">当前储蓄 (元)</label>
                <input
                  v-model.number="currentSavings"
                  type="number"
                  min="0"
                  step="10000"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">退休后生活水平 (%)</label>
                <input
                  v-model.number="retirementLifestyle"
                  type="number"
                  min="30"
                  max="150"
                  step="10"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div class="text-xs text-muted-foreground mt-1">占当前收入的百分比</div>
              </div>
            </div>
          </div>

          <!-- 退休后收入来源 -->
          <div class="bg-card rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
              <DollarSign class="w-5 h-5 mr-2 text-primary" />
              退休后收入来源
            </h3>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">社保养老金 (元/月)</label>
                <input
                  v-model.number="socialPension"
                  type="number"
                  min="0"
                  step="100"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">企业年金 (元/月)</label>
                <input
                  v-model.number="companyPension"
                  type="number"
                  min="0"
                  step="100"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">租金收入 (元/月)</label>
                <input
                  v-model.number="rentalIncome"
                  type="number"
                  min="0"
                  step="100"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">其他收入 (元/月)</label>
                <input
                  v-model.number="otherIncome"
                  type="number"
                  min="0"
                  step="100"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <!-- 投资参数 -->
          <div class="bg-card rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 class="w-5 h-5 mr-2 text-primary" />
              投资参数
            </h3>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">通胀率 (%)</label>
                <input
                  v-model.number="inflationRate"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">工作期间年化收益率 (%)</label>
                <input
                  v-model.number="workingReturnRate"
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">退休后年化收益率 (%)</label>
                <input
                  v-model.number="retirementReturnRate"
                  type="number"
                  min="0"
                  max="15"
                  step="0.5"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div class="text-xs text-muted-foreground mt-1">保守策略</div>
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">工资增长率 (%)</label>
                <input
                  v-model.number="salaryGrowthRate"
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-4">
            <button
              @click="calculateRetirementNeeds"
              class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium"
            >
              开始计算
            </button>
            <button
              @click="loadExampleData"
              class="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              加载示例
            </button>
            <button
              @click="clearData"
              class="px-6 py-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              清空数据
            </button>
          </div>
        </div>

        <!-- 右侧结果展示 -->
        <div class="lg:col-span-1">
          <div class="sticky top-6 space-y-6">
            <!-- 计算结果 -->
            <div class="bg-card rounded-lg p-6">
              <h3 class="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp class="w-5 h-5 mr-2 text-primary" />
                计算结果
              </h3>
              <div v-if="results" class="space-y-4">
                <div class="p-3 bg-muted rounded-lg">
                  <div class="text-sm text-muted-foreground">退休所需总金额</div>
                  <div class="text-2xl font-bold text-primary">{{ formatCurrency(results.totalNeeded) }}</div>
                </div>
                <div class="p-3 bg-muted rounded-lg">
                  <div class="text-sm text-muted-foreground">建议月储蓄金额</div>
                  <div class="text-2xl font-bold text-foreground">{{ formatCurrency(results.monthlySavings) }}</div>
                </div>
                <div class="p-3 bg-muted rounded-lg">
                  <div class="text-sm text-muted-foreground">退休后月支出</div>
                  <div class="text-xl font-bold text-foreground">{{ formatCurrency(results.retirementMonthlyExpenses) }}</div>
                </div>
                <div class="p-3 bg-muted rounded-lg">
                  <div class="text-sm text-muted-foreground">退休后月收入</div>
                  <div class="text-xl font-bold text-green-600">{{ formatCurrency(results.retirementMonthlyIncome) }}</div>
                </div>
              </div>
              <div v-else class="text-center py-8 text-muted-foreground">
                请填写信息并点击计算
              </div>
            </div>

            <!-- 健康度指示器 -->
            <div v-if="results" class="bg-card rounded-lg p-6">
              <h3 class="text-lg font-semibold mb-4 flex items-center">
                <Shield class="w-5 h-5 mr-2 text-primary" />
                规划健康度
              </h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm">储蓄进度</span>
                  <span class="text-sm font-medium">{{ results.savingsProgress }}%</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div
                    class="h-2 rounded-full transition-all"
                    :class="results.savingsProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'"
                    :style="{ width: Math.min(results.savingsProgress, 100) + '%' }"
                  ></div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm">退休准备度</span>
                  <span class="text-sm font-medium">{{ results.readiness }}%</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div
                    class="h-2 rounded-full transition-all"
                    :class="results.readiness >= 80 ? 'bg-green-500' : results.readiness >= 50 ? 'bg-yellow-500' : 'bg-red-500'"
                    :style="{ width: results.readiness + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 详细分析 -->
      <div v-if="results" class="bg-card rounded-lg p-6">
        <h3 class="text-xl font-semibold mb-4 flex items-center">
          <Info class="w-6 h-6 mr-2 text-primary" />
          详细分析
        </h3>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-muted/50 rounded-lg">
            <div class="text-2xl font-bold text-primary">{{ results.yearsToRetirement }}</div>
            <div class="text-sm text-muted-foreground">距离退休(年)</div>
          </div>
          <div class="text-center p-4 bg-muted/50 rounded-lg">
            <div class="text-2xl font-bold text-foreground">{{ results.yearsInRetirement }}</div>
            <div class="text-sm text-muted-foreground">退休生活(年)</div>
          </div>
          <div class="text-center p-4 bg-muted/50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{{ formatCurrency(results.totalRetirementIncome) }}</div>
            <div class="text-sm text-muted-foreground">退休总收入</div>
          </div>
          <div class="text-center p-4 bg-muted/50 rounded-lg">
            <div class="text-2xl font-bold text-red-600">{{ formatCurrency(results.shortfall) }}</div>
            <div class="text-sm text-muted-foreground">资金缺口</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 攻略指南内容 -->
    <div v-if="activeTab === 'guide'">
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-3 flex items-center">
            <PiggyBank class="w-5 h-5 mr-2 text-primary" />
            退休规划基础
          </h3>
          <div class="space-y-3 text-sm text-muted-foreground">
            <p>退休规划应该越早开始越好，充分利用复利效应。一般来说，退休储蓄目标应该是退休前年收入的10-12倍。</p>
            <p>制定退休计划时需要考虑：预期寿命、通胀率、医疗费用、生活品质等因素。</p>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-3 flex items-center">
            <TrendingUp class="w-5 h-5 mr-2 text-primary" />
            投资策略建议
          </h3>
          <div class="space-y-3 text-sm text-muted-foreground">
            <p><strong>年轻时期(20-40岁)：</strong>可以承受较高风险，主要投资股票等成长型资产。</p>
            <p><strong>中年时期(40-55岁)：</strong>平衡风险与收益，逐步增加债券等稳定资产比重。</p>
            <p><strong>临近退休(55岁以上)：</strong>以保守为主，主要投资债券、存款等低风险资产。</p>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-3 flex items-center">
            <Shield class="w-5 h-5 mr-2 text-primary" />
            风险管理
          </h3>
          <div class="space-y-3 text-sm text-muted-foreground">
            <p>建立紧急备用金，通常是6-12个月的生活开支。</p>
            <p>购买足够的保险，包括医疗保险、意外保险等。</p>
            <p>定期检视和调整退休计划，确保符合实际情况。</p>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-3 flex items-center">
            <DollarSign class="w-5 h-5 mr-2 text-primary" />
            收入来源多元化
          </h3>
          <div class="space-y-3 text-sm text-muted-foreground">
            <p>不要完全依赖单一收入来源。建议构建多元化退休收入：</p>
            <ul class="list-disc list-inside space-y-1">
              <li>社保养老金</li>
              <li>企业年金</li>
              <li>个人投资收益</li>
              <li>房产租金</li>
              <li>其他投资收益</li>
            </ul>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-3 flex items-center">
            <AlertCircle class="w-5 h-5 mr-2 text-primary" />
            常见误区
          </h3>
          <div class="space-y-3 text-sm text-muted-foreground">
            <p><strong>误区1：</strong>认为有社保就够了</p>
            <p><strong>误区2：</strong>开始时间太晚</p>
            <p><strong>误区3：</strong>低估医疗费用</p>
            <p><strong>误区4：</strong>没有考虑通胀因素</p>
            <p><strong>误区5：</strong>投资过于保守</p>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-3 flex items-center">
            <Calendar class="w-5 h-5 mr-2 text-primary" />
            时间节点规划
          </h3>
          <div class="space-y-3 text-sm text-muted-foreground">
            <p><strong>25-30岁：</strong>开始退休储蓄，建立投资组合</p>
            <p><strong>30-40岁：</strong>加大储蓄力度，优化投资配置</p>
            <p><strong>40-50岁：</strong>检视退休进度，调整储蓄目标</p>
            <p><strong>50-60岁：</strong>降低投资风险，准备退休生活</p>
            <p><strong>60岁以上：</strong>享受退休生活，合理规划支出</p>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO内容 -->
    <SeoContent :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Calculator, TrendingUp, Target, PiggyBank, AlertCircle, Info, Calendar, DollarSign, BarChart3, Shield, FileText } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

definePageMeta({
  layout: 'default'
})

// SEO配置
useSeoMeta({
  title: '退休储蓄规划器 - 专业退休养老计划制定工具 | Util工具箱',
  description: '专业的退休储蓄规划工具，计算退休目标储蓄金额和月储蓄建议，考虑通胀率和多种收入来源，帮助制定合理的退休规划。支持多种投资策略和风险评估。',
  keywords: '退休规划,退休计算器,养老金计算,退休储蓄,养老规划,退休金,退休年龄,退休生活',
  author: 'Util工具箱',
  ogTitle: '退休储蓄规划器 - 专业退休养老计划制定工具',
  ogDescription: '专业的退休规划工具，计算退休目标储蓄金额和月储蓄建议，考虑通胀率和多种收入来源，帮助制定合理的退休规划。',
  ogImage: 'https://util.cn/images/tools/retirement-planner.png',
  ogUrl: 'https://util.cn/tools/retirement-planner',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '退休储蓄规划器 - 专业退休养老计划制定',
  twitterDescription: '专业的退休规划工具，计算退休目标储蓄金额和月储蓄建议，考虑通胀率和多种收入来源。',
  twitterImage: 'https://util.cn/images/tools/retirement-planner.png'
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
            name: '退休储蓄规划器',
            description: '专业的退休储蓄规划工具，计算退休目标储蓄金额和月储蓄建议，考虑通胀率和多种收入来源',
            url: 'https://util.cn/tools/retirement-planner',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '退休目标计算',
              '月储蓄建议',
              '通胀率考虑',
              '多种收入来源',
              '投资策略规划',
              '风险评估分析',
              '退休准备度评估',
              '详细规划指导'
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
                name: '退休储蓄规划器',
                item: 'https://util.cn/tools/retirement-planner'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '什么是退休储蓄规划？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': '退休储蓄规划是根据个人财务状况、退休目标和生活预期，制定系统的储蓄和投资计划。包括确定退休年龄、计算所需退休资金、规划储蓄和投资策略、评估风险承受能力等。'
                }
              },
              {
                '@type': 'Question',
                name: '如何计算退休需要的总金额？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': '退休所需资金计算：1）确定退休后年支出；2）考虑通胀率调整；3）计算退休期间总支出；4）减去预期退休收入；5）考虑投资收益；6）得出总储蓄目标。通常为退休前年收入的10-12倍。'
                }
              },
              {
                '@type': 'Question',
                name: '什么时候开始退休规划比较好？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': '退休规划越早开始越好，理想时间是开始工作后立即开始。20-30岁开始可以充分利用复利效应，每月储蓄较少也能达到目标。30-40岁开始需要加大储蓄力度，40-50岁开始需要更积极的投资策略。'
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
const tool = tools.find(t => t.id === 'retirement-planner')
const category = categories.find(c => c.id === 'finance')

// 状态管理
const activeTab = ref('calculator')

// 基础信息
const currentAge = ref(30)
const retirementAge = ref(60)
const lifeExpectancy = ref(85)
const currentMonthlyIncome = ref(15000)
const currentMonthlyExpenses = ref(8000)
const currentSavings = ref(100000)
const retirementLifestyle = ref(70) // 退休后生活水平占当前收入的百分比

// 退休后收入来源
const socialPension = ref(3000) // 社保养老金
const companyPension = ref(1500) // 企业年金
const rentalIncome = ref(0) // 租金收入
const otherIncome = ref(0) // 其他收入

// 投资参数
const inflationRate = ref(3) // 通胀率
const workingReturnRate = ref(7) // 工作期间年化收益率
const retirementReturnRate = ref(4) // 退休后年化收益率（保守策略）
const salaryGrowthRate = ref(5) // 工资增长率

// 计算结果
const results = ref(null)
const showResults = ref(false)

// 格式化货币
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// 计算退休所需总金额
const calculateRetirementNeeds = () => {
  const yearsToRetirement = retirementAge.value - currentAge.value
  const yearsInRetirement = lifeExpectancy.value - retirementAge.value

  // 计算退休后月度支出（考虑通胀）
  const realRetirementMonthlyExpenses = (currentMonthlyIncome.value * retirementLifestyle.value / 100)
  const retirementMonthlyExpenses = realRetirementMonthlyExpenses * Math.pow(1 + inflationRate.value / 100, yearsToRetirement)

  // 退休后月收入
  const retirementMonthlyIncome = socialPension.value + companyPension.value + rentalIncome.value + otherIncome.value

  // 退休后每月需要补充的金额
  const monthlyShortfall = Math.max(0, retirementMonthlyExpenses - retirementMonthlyIncome)

  // 计算退休所需总金额
  const totalNeeded = monthlyShortfall * 12 * yearsInRetirement

  // 当前储蓄到退休时的价值
  const futureValueOfCurrentSavings = currentSavings.value * Math.pow(1 + workingReturnRate.value / 100, yearsToRetirement)

  // 需要额外储蓄的金额
  const additionalSavingsNeeded = Math.max(0, totalNeeded - futureValueOfCurrentSavings)

  // 计算每月需要储蓄的金额
  const monthlySavingsNeeded = additionalSavingsNeeded > 0 ?
    (additionalSavingsNeeded * workingReturnRate.value / 100 / 12) /
    (Math.pow(1 + workingReturnRate.value / 100 / 12, yearsToRetirement * 12) - 1) : 0

  // 计算退休总收入
  const totalRetirementIncome = retirementMonthlyIncome * 12 * yearsInRetirement

  // 计算资金缺口
  const shortfall = monthlyShortfall * 12 * yearsInRetirement

  // 计算储蓄进度
  const savingsProgress = Math.min(100, (futureValueOfCurrentSavings / totalNeeded) * 100)

  // 计算退休准备度
  const readiness = Math.min(100, (futureValueOfCurrentSavings / totalNeeded) * 100 +
    ((retirementAge.value - currentAge.value) / 35) * 50)

  results.value = {
    totalNeeded,
    monthlySavings: monthlySavingsNeeded,
    retirementMonthlyExpenses,
    retirementMonthlyIncome,
    yearsToRetirement,
    yearsInRetirement,
    totalRetirementIncome,
    shortfall,
    savingsProgress: Math.round(savingsProgress),
    readiness: Math.round(readiness)
  }

  showResults.value = true
}

// 加载示例数据
const loadExampleData = () => {
  currentAge.value = 30
  retirementAge.value = 60
  lifeExpectancy.value = 85
  currentMonthlyIncome.value = 15000
  currentMonthlyExpenses.value = 8000
  currentSavings.value = 100000
  retirementLifestyle.value = 70
  socialPension.value = 3000
  companyPension.value = 1500
  rentalIncome.value = 0
  otherIncome.value = 0
  inflationRate.value = 3
  workingReturnRate.value = 7
  retirementReturnRate.value = 4
  salaryGrowthRate.value = 5
}

// 清空数据
const clearData = () => {
  currentAge.value = 30
  retirementAge.value = 60
  lifeExpectancy.value = 85
  currentMonthlyIncome.value = 0
  currentMonthlyExpenses.value = 0
  currentSavings.value = 0
  retirementLifestyle.value = 70
  socialPension.value = 0
  companyPension.value = 0
  rentalIncome.value = 0
  otherIncome.value = 0
  inflationRate.value = 3
  workingReturnRate.value = 7
  retirementReturnRate.value = 4
  salaryGrowthRate.value = 5
  results.value = null
  showResults.value = false
}

// 页面加载时初始化
onMounted(() => {
  loadExampleData()
  // 添加到最近使用
  if (tool) {
    addRecentTool(tool.id)
  }
})
</script>