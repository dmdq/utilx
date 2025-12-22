<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">理财收益计算器 - 专业投资收益计算</h1>
      <p class="text-muted-foreground">专业的投资收益计算工具，支持定期存款、基金、债券等多种投资方式，提供收益计算、风险评估和投资组合优化建议，助力财富稳健增长。</p>
    </div>

    <!-- 计算模式选择 -->
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
          收益计算器
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
          投资攻略
        </button>
      </div>
    </div>

    <!-- 计算器内容 -->
    <div v-if="activeTab === 'calculator'">
      <!-- 主要功能区域 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- 输入区域 -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 计算类型选择 -->
          <div class="bg-card rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
              <Target class="w-5 h-5 mr-2 text-primary" />
              计算方式
            </h3>
            <div class="grid grid-cols-3 gap-4">
              <button
                v-for="mode in calculationModes"
                :key="mode.id"
                @click="calculationType = mode.id"
                :class="[
                  'p-4 rounded-lg border-2 transition-all text-center',
                  calculationType === mode.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                ]"
              >
                <component :is="mode.icon" class="w-6 h-6 mx-auto mb-2" />
                <div class="font-medium">{{ mode.name }}</div>
                <div class="text-xs text-muted-foreground mt-1">{{ mode.description }}</div>
              </button>
            </div>
          </div>

          <!-- 单笔投资 -->
          <div v-if="calculationType === 'single'" class="bg-card rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
              <DollarSign class="w-5 h-5 mr-2 text-primary" />
              单笔投资计算
            </h3>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">投资金额 (元)</label>
                <input
                  v-model.number="singleInvestment.principal"
                  type="number"
                  min="0"
                  step="1000"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  @input="calculateSingleInvestment"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">年化收益率 (%)</label>
                <input
                  v-model.number="singleInvestment.rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  @input="calculateSingleInvestment"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">投资期限 (年)</label>
                <input
                  v-model.number="singleInvestment.period"
                  type="number"
                  min="0.1"
                  max="50"
                  step="0.5"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  @input="calculateSingleInvestment"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">计息方式</label>
                <select
                  v-model="singleInvestment.compoundType"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  @change="calculateSingleInvestment"
                >
                  <option value="simple">单利</option>
                  <option value="compound">复利</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 定期定额投资 -->
          <div v-if="calculationType === 'regular'" class="bg-card rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp class="w-5 h-5 mr-2 text-primary" />
              定期定额投资计算
            </h3>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">每月定投金额 (元)</label>
                <input
                  v-model.number="regularInvestment.monthlyAmount"
                  type="number"
                  min="0"
                  step="100"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  @input="calculateRegularInvestment"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">年化收益率 (%)</label>
                <input
                  v-model.number="regularInvestment.rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  @input="calculateRegularInvestment"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">定投期限 (年)</label>
                <input
                  v-model.number="regularInvestment.period"
                  type="number"
                  min="0.1"
                  max="50"
                  step="0.5"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  @input="calculateRegularInvestment"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">定投频率</label>
                <select
                  v-model="regularInvestment.frequency"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  @change="calculateRegularInvestment"
                >
                  <option value="monthly">每月</option>
                  <option value="quarterly">每季度</option>
                  <option value="annually">每年</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 投资组合 -->
          <div v-if="calculationType === 'portfolio'" class="bg-card rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
              <PieChart class="w-5 h-5 mr-2 text-primary" />
              投资组合分析
            </h3>
            <div class="space-y-4">
              <div v-for="(item, index) in portfolio.items" :key="index" class="grid md:grid-cols-4 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2">资产名称</label>
                  <input
                    v-model="item.name"
                    type="text"
                    class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">投资金额 (元)</label>
                  <input
                    v-model.number="item.amount"
                    type="number"
                    min="0"
                    step="1000"
                    class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    @input="calculatePortfolio"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">预期收益率 (%)</label>
                  <input
                    v-model.number="item.rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    @input="calculatePortfolio"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">风险等级</label>
                  <select
                    v-model="item.risk"
                    class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="low">低风险</option>
                    <option value="medium">中风险</option>
                    <option value="high">高风险</option>
                  </select>
                </div>
              </div>
              <button
                @click="addPortfolioItem"
                class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                添加资产
              </button>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-4">
            <button
              @click="performCalculation"
              class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium"
            >
              开始计算
            </button>
            <button
              @click="loadExample"
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
                <BarChart3 class="w-5 h-5 mr-2 text-primary" />
                计算结果
              </h3>
              <div v-if="results" class="space-y-4">
                <div class="p-3 bg-muted rounded-lg">
                  <div class="text-sm text-muted-foreground">投资总额</div>
                  <div class="text-2xl font-bold text-foreground">{{ formatCurrency(results.totalInvestment) }}</div>
                </div>
                <div class="p-3 bg-muted rounded-lg">
                  <div class="text-sm text-muted-foreground">总收益</div>
                  <div class="text-2xl font-bold text-green-600">{{ formatCurrency(results.totalReturn) }}</div>
                </div>
                <div class="p-3 bg-muted rounded-lg">
                  <div class="text-sm text-muted-foreground">收益率</div>
                  <div class="text-2xl font-bold text-primary">{{ results.returnRate }}%</div>
                </div>
                <div class="p-3 bg-muted rounded-lg">
                  <div class="text-sm text-muted-foreground">最终金额</div>
                  <div class="text-2xl font-bold text-foreground">{{ formatCurrency(results.finalAmount) }}</div>
                </div>
              </div>
              <div v-else class="text-center py-8 text-muted-foreground">
                请填写信息并点击计算
              </div>
            </div>

            <!-- 风险评估 -->
            <div v-if="results" class="bg-card rounded-lg p-6">
              <h3 class="text-lg font-semibold mb-4 flex items-center">
                <Shield class="w-5 h-5 mr-2 text-primary" />
                风险评估
              </h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm">风险等级</span>
                  <span class="text-sm font-medium">{{ results.riskLevel }}</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div
                    class="h-2 rounded-full transition-all"
                    :class="results.riskLevel === '低风险' ? 'bg-green-500' : results.riskLevel === '中风险' ? 'bg-yellow-500' : 'bg-red-500'"
                    :style="{ width: results.riskScore + '%' }"
                  ></div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm">建议持有期</span>
                  <span class="text-sm font-medium">{{ results.recommendedPeriod }}</span>
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
          收益分析
        </h3>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-muted/50 rounded-lg">
            <div class="text-2xl font-bold text-primary">{{ results.annualizedReturn }}%</div>
            <div class="text-sm text-muted-foreground">年化收益率</div>
          </div>
          <div class="text-center p-4 bg-muted/50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{{ formatCurrency(results.annualReturn) }}</div>
            <div class="text-sm text-muted-foreground">年收益</div>
          </div>
          <div class="text-center p-4 bg-muted/50 rounded-lg">
            <div class="text-2xl font-bold text-foreground">{{ results.multiplier }}x</div>
            <div class="text-sm text-muted-foreground">收益倍数</div>
          </div>
          <div class="text-center p-4 bg-muted/50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{{ formatCurrency(results.monthlyReturn) }}</div>
            <div class="text-sm text-muted-foreground">月均收益</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 攻略指南内容 -->
    <div v-if="activeTab === 'guide'">
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-3 flex items-center">
            <TrendingUp class="w-5 h-5 mr-2 text-primary" />
            投资基础知识
          </h3>
          <div class="space-y-3 text-sm text-muted-foreground">
            <p><strong>单利计算：</strong>只对本金计算利息，适合定期存款等短期投资。</p>
            <p><strong>复利计算：</strong>利息也会产生利息，适合长期投资，能显著提升收益。</p>
            <p><strong>定期定额：</strong>分散投资时机风险，适合工薪族长期投资策略。</p>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-3 flex items-center">
            <Shield class="w-5 h-5 mr-2 text-primary" />
            风险管理策略
          </h3>
          <div class="space-y-3 text-sm text-muted-foreground">
            <p><strong>分散投资：</strong>不要把所有资金投入单一产品，降低风险。</p>
            <p><strong>资产配置：</strong>根据风险承受能力合理配置股票、债券、现金等。</p>
            <p><strong>定期调整：</strong>根据市场变化和个人情况调整投资组合。</p>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-3 flex items-center">
            <PieChart class="w-5 h-5 mr-2 text-primary" />
            投资产品选择
          </h3>
          <div class="space-y-3 text-sm text-muted-foreground">
            <p><strong>低风险产品：</strong>定期存款、国债、货币基金等，收益稳定但较低。</p>
            <p><strong>中风险产品：</strong>债券基金、混合基金等，收益和风险适中。</p>
            <p><strong>高风险产品：</strong>股票基金、指数基金等，收益潜力大但风险高。</p>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-3 flex items-center">
            <DollarSign class="w-5 h-5 mr-2 text-primary" />
            收益优化技巧
          </h3>
          <div class="space-y-3 text-sm text-muted-foreground">
            <p>利用复利效应，尽早开始投资。</p>
            <p>选择合适的投资期限，平衡收益和流动性需求。</p>
            <p>关注税收优惠产品，提高净收益率。</p>
            <p>定期检视投资组合，及时调整策略。</p>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-3 flex items-center">
            <AlertCircle class="w-5 h-5 mr-2 text-primary" />
            常见投资误区
          </h3>
          <div class="space-y-3 text-sm text-muted-foreground">
            <p><strong>误区1：</strong>追求高收益忽视风险</p>
            <p><strong>误区2：</strong>频繁交易增加成本</p>
            <p><strong>误区3：</strong>缺乏长期投资规划</p>
            <p><strong>误区4：</strong>跟风投资缺乏独立判断</p>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-3 flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" />
            投资计算要点
          </h3>
          <div class="space-y-3 text-sm text-muted-foreground">
            <p>注意区分名义收益率和实际收益率。</p>
            <p>考虑通货膨胀对购买力的影响。</p>
            <p>计算税后收益，了解净回报。</p>
            <p>评估流动性，确保资金可用性。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO内容 -->
    <SeoContent :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Calculator, TrendingUp, PieChart, BarChart3, Info, Target, AlertCircle, FileText, Shield, DollarSign } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

definePageMeta({
  layout: 'default'
})

// SEO配置
useSeoMeta({
  title: '理财收益计算器 - 专业投资收益计算工具 | Util工具箱',
  description: '专业的理财收益计算工具，支持定期存款、基金、债券、理财等多种投资方式，提供收益计算、风险评估和投资组合优化建议。实时计算ROI、复利、定投收益。',
  keywords: '理财计算器,收益计算,投资收益,ROI计算,复利计算,定投计算,基金收益,债券收益,定期存款',
  author: 'Util工具箱',
  ogTitle: '理财收益计算器 - 专业投资收益计算工具',
  ogDescription: '专业的理财收益计算工具，支持多种投资方式，提供收益计算、风险评估和投资组合优化建议。',
  ogImage: 'https://util.cn/images/tools/investment-calculator.png',
  ogUrl: 'https://util.cn/tools/investment-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '理财收益计算器 - 专业投资收益计算',
  twitterDescription: '专业的理财收益计算工具，支持定期存款、基金、债券等多种投资方式，提供收益计算和风险评估。',
  twitterImage: 'https://util.cn/images/tools/investment-calculator.png'
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
            name: '理财收益计算器',
            description: '专业的理财收益计算工具，支持定期存款、基金、债券、理财等多种投资方式，提供收益计算、风险评估和投资组合优化建议',
            url: 'https://util.cn/tools/investment-calculator',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '单利复利计算',
              '定期定额投资',
              '投资组合分析',
              '风险评估分析',
              '收益预测计算',
              'ROI投资回报率',
              '年化收益率',
              '投资建议'
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
                name: '理财收益计算器',
                item: 'https://util.cn/tools/investment-calculator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '什么是复利效应？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': '复利效应是指投资产生的收益会继续产生收益，即利滚利。长期来看，复利效应能显著提升投资回报。年化收益率10%的投资，通过复利效应，10年大约能翻2.6倍。'
                }
              },
              {
                '@type': 'Question',
                name: '如何选择合适的投资产品？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': '选择投资产品需要考虑：1）风险承受能力；2）投资期限；3）收益预期；4）流动性需求；5）税收影响。一般来说，年轻人可以承受较高风险，选择股票基金等；临近退休者应选择保守产品。'
                }
              },
              {
                '@type': 'Question',
                name: '定投有什么优势？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': '定投的优势：1）平摊投资成本，降低时机风险；2）强制储蓄，培养良好投资习惯；3）享受复利效应，长期收益可观；4）操作简单，适合普通投资者；5）心理压力小，避免情绪化决策。'
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
const tool = tools.find(t => t.id === 'investment-calculator')
const category = categories.find(c => c.id === 'finance')

// 状态管理
const activeTab = ref('calculator')
const calculationType = ref('single')

// 计算模式
const calculationModes = [
  { id: 'single', name: '单笔投资', description: '一次性投资收益', icon: DollarSign },
  { id: 'regular', name: '定期定额', description: '定投收益计算', icon: TrendingUp },
  { id: 'portfolio', name: '投资组合', description: '组合收益分析', icon: PieChart }
]

// 单笔投资数据
const singleInvestment = ref({
  principal: 100000,
  rate: 5,
  period: 5,
  compoundType: 'compound'
})

// 定期定额投资数据
const regularInvestment = ref({
  monthlyAmount: 5000,
  rate: 8,
  period: 10,
  frequency: 'monthly'
})

// 投资组合数据
const portfolio = ref({
  items: [
    { name: '股票基金', amount: 50000, rate: 10, risk: 'high' },
    { name: '债券基金', amount: 30000, rate: 4, risk: 'low' },
    { name: '货币基金', amount: 20000, rate: 2.5, risk: 'low' }
  ]
})

// 计算结果
const results = ref(null)

// 格式化货币
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// 计算单笔投资收益
const calculateSingleInvestment = () => {
  const { principal, rate, period, compoundType } = singleInvestment.value

  let finalAmount
  if (compoundType === 'simple') {
    finalAmount = principal * (1 + rate / 100 * period)
  } else {
    finalAmount = principal * Math.pow(1 + rate / 100, period)
  }

  const totalReturn = finalAmount - principal
  const returnRate = ((finalAmount - principal) / principal * 100).toFixed(2)

  return {
    principal,
    finalAmount,
    totalReturn,
    returnRate,
    type: 'single'
  }
}

// 计算定期定额投资收益
const calculateRegularInvestment = () => {
  const { monthlyAmount, rate, period, frequency } = regularInvestment.value

  let periodsPerYear = 12
  if (frequency === 'quarterly') periodsPerYear = 4
  if (frequency === 'annually') periodsPerYear = 1

  const totalPeriods = period * periodsPerYear
  const ratePerPeriod = rate / 100 / periodsPerYear

  const finalAmount = monthlyAmount * ((Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod)
  const totalInvestment = monthlyAmount * totalPeriods
  const totalReturn = finalAmount - totalInvestment
  const returnRate = ((finalAmount - totalInvestment) / totalInvestment * 100).toFixed(2)

  return {
    monthlyAmount,
    finalAmount,
    totalInvestment,
    totalReturn,
    returnRate,
    type: 'regular'
  }
}

// 计算投资组合收益
const calculatePortfolio = () => {
  const { items } = portfolio.value
  const totalInvestment = items.reduce((sum, item) => sum + item.amount, 0)

  // 计算加权平均收益率
  const weightedRate = items.reduce((sum, item) => {
    return sum + (item.amount / totalInvestment) * item.rate
  }, 0)

  const period = 5 // 默认投资期限5年
  const finalAmount = totalInvestment * Math.pow(1 + weightedRate / 100, period)
  const totalReturn = finalAmount - totalInvestment
  const returnRate = ((finalAmount - totalInvestment) / totalInvestment * 100).toFixed(2)

  // 计算风险评分
  const riskScore = items.reduce((sum, item) => {
    const itemRisk = item.risk === 'high' ? 80 : item.risk === 'medium' ? 50 : 20
    return sum + (item.amount / totalInvestment) * itemRisk
  }, 0)

  return {
    totalInvestment,
    finalAmount,
    totalReturn,
    returnRate,
    weightedRate: weightedRate.toFixed(2),
    riskScore: Math.round(riskScore),
    type: 'portfolio'
  }
}

// 添加投资组合项目
const addPortfolioItem = () => {
  portfolio.value.items.push({
    name: '',
    amount: 0,
    rate: 0,
    risk: 'medium'
  })
}

// 执行计算
const performCalculation = () => {
  let calculationResult

  switch (calculationType.value) {
    case 'single':
      calculationResult = calculateSingleInvestment()
      break
    case 'regular':
      calculationResult = calculateRegularInvestment()
      break
    case 'portfolio':
      calculationResult = calculatePortfolio()
      break
  }

  if (calculationResult) {
    // 计算详细分析
    const annualizedReturn = calculationResult.type === 'regular'
      ? calculationResult.returnRate
      : (Math.pow(calculationResult.finalAmount / calculationResult.totalInvestment, 1/5) - 1) * 100

    const annualReturn = calculationResult.type === 'regular'
      ? calculationResult.totalReturn / 5
      : (calculationResult.finalAmount - calculationResult.totalInvestment) / 5

    results.value = {
      ...calculationResult,
      annualizedReturn: annualizedReturn.toFixed(2),
      annualReturn: Math.round(annualReturn),
      multiplier: (calculationResult.finalAmount / calculationResult.totalInvestment).toFixed(2),
      monthlyReturn: Math.round(annualReturn / 12),
      riskLevel: calculationResult.riskScore < 40 ? '低风险' : calculationResult.riskScore < 70 ? '中风险' : '高风险',
      riskScore: calculationResult.riskScore || 30,
      recommendedPeriod: calculationResult.riskScore < 40 ? '1-3年' : calculationResult.riskScore < 70 ? '3-5年' : '5年以上'
    }
  }
}

// 加载示例数据
const loadExample = () => {
  if (calculationType.value === 'single') {
    singleInvestment.value = {
      principal: 100000,
      rate: 6,
      period: 5,
      compoundType: 'compound'
    }
  } else if (calculationType.value === 'regular') {
    regularInvestment.value = {
      monthlyAmount: 5000,
      rate: 8,
      period: 10,
      frequency: 'monthly'
    }
  } else if (calculationType.value === 'portfolio') {
    portfolio.value.items = [
      { name: '股票基金', amount: 50000, rate: 10, risk: 'high' },
      { name: '债券基金', amount: 30000, rate: 4, risk: 'low' },
      { name: '货币基金', amount: 20000, rate: 2.5, risk: 'low' }
    ]
  }
  performCalculation()
}

// 清空数据
const clearData = () => {
  results.value = null
  if (calculationType.value === 'single') {
    singleInvestment.value = {
      principal: 0,
      rate: 0,
      period: 0,
      compoundType: 'compound'
    }
  } else if (calculationType.value === 'regular') {
    regularInvestment.value = {
      monthlyAmount: 0,
      rate: 0,
      period: 0,
      frequency: 'monthly'
    }
  } else if (calculationType.value === 'portfolio') {
    portfolio.value.items = [
      { name: '', amount: 0, rate: 0, risk: 'medium' }
    ]
  }
}

// 页面加载时初始化
onMounted(() => {
  loadExample()
  // 添加到最近使用
  if (tool) {
    addRecentTool(tool.id)
  }
})
</script>