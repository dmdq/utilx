<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">年终奖计算器 - 个税优化与发放方案分析</h1>
      <p class="text-muted-foreground">精确计算年终奖个税，提供最优发放策略，帮助您合法节税。支持多种发放方案对比分析，智能避税率陷阱。</p>
    </div>

    <!-- 政策说明卡片 -->
    <div class="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6 mb-8">
      <div class="flex items-start gap-4">
        <div class="p-2 bg-red-500 text-white rounded-lg">
          <Info class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-semibold text-red-900 mb-2">2024年年终奖个税政策要点</h3>
          <ul class="text-sm text-red-800 space-y-1">
            <li>• 年终奖可选择单独计税或并入综合所得计税</li>
            <li>• 单独计税时，按月换算后确定税率和速算扣除数</li>
            <li>• 适用3%-45%七级超额累进税率表</li>
            <li>• 每个纳税年度只能使用一次单独计税优惠</li>
            <li>• 分拆发放可能影响节税效果</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 计算模式切换 -->
    <div class="mb-6">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="mode in calculationModes"
          :key="mode.id"
          @click="currentMode = mode.id"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            currentMode === mode.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          ]"
        >
          {{ mode.name }}
        </button>
      </div>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">{{ getInputTitle() }}</label>
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

        <!-- 个税计算输入 -->
        <div v-if="currentMode === 'tax'" class="space-y-4">
          <!-- 年终奖信息 -->
          <div class="bg-card rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-4">年终奖信息</h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">年终奖金额（元）</label>
                <input
                  v-model.number="taxData.bonusAmount"
                  @input="calculateBonusTax"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="50000"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">计税方式</label>
                <div class="space-y-2">
                  <label class="flex items-center">
                    <input
                      type="radio"
                      v-model="taxData.calculationMethod"
                      value="separate"
                      @change="calculateBonusTax"
                      class="mr-2"
                    />
                    <span class="text-sm">单独计税（推荐）</span>
                  </label>
                  <label class="flex items-center">
                    <input
                      type="radio"
                      v-model="taxData.calculationMethod"
                      value="combined"
                      @change="calculateBonusTax"
                      class="mr-2"
                    />
                    <span class="text-sm">并入综合所得计税</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- 月度工资信息 -->
          <div class="bg-card rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-4">月度工资信息</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">当月工资（元）</label>
                <input
                  v-model.number="taxData.monthlySalary"
                  @input="calculateBonusTax"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="12000"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">社保公积金（元）</label>
                <input
                  v-model.number="taxData.socialInsurance"
                  @input="calculateBonusTax"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="2000"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">专项附加扣除（元）</label>
                <input
                  v-model.number="taxData.specialDeductions"
                  @input="calculateBonusTax"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="2000"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">其他扣除（元）</label>
                <input
                  v-model.number="taxData.otherDeductions"
                  @input="calculateBonusTax"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 发放方案输入 -->
        <div v-if="currentMode === 'optimization'" class="space-y-4">
          <!-- 方案设置 -->
          <div class="bg-card rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-4">发放方案设置</h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">总年终奖金额（元）</label>
                <input
                  v-model.number="optimizationData.totalBonus"
                  @input="calculateOptimization"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="100000"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">当月工资（元）</label>
                <input
                  v-model.number="optimizationData.monthlySalary"
                  @input="calculateOptimization"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="12000"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">优化目标</label>
                <select
                  v-model="optimizationData.optimizationGoal"
                  @change="calculateOptimization"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="maximizeAfterTax">最大化税后收入</option>
                  <option value="minimizeTaxRate">最小化实际税率</option>
                  <option value="balanced">均衡月度收入</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧结果展示区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">计算结果</label>
          <div class="text-xs text-muted-foreground">
            {{ getCurrentTime() }}
          </div>
        </div>

        <!-- 个税计算结果 -->
        <div v-if="currentMode === 'tax'" class="space-y-4">
          <!-- 个税结果总览 -->
          <div class="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4 text-red-900">个税计算结果</h3>

            <div class="text-center mb-4">
              <div class="text-4xl font-bold text-red-600 mb-2">
                {{ formatCurrency(taxResults.afterTaxAmount) }}
              </div>
              <p class="text-sm text-red-700">税后年终奖</p>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="text-center p-3 bg-white/50 rounded">
                <div class="font-semibold text-red-800">{{ formatCurrency(taxResults.taxAmount) }}</div>
                <div class="text-red-600">应纳税额</div>
              </div>
              <div class="text-center p-3 bg-white/50 rounded">
                <div class="font-semibold text-red-800">{{ taxResults.effectiveRate }}%</div>
                <div class="text-red-600">实际税率</div>
              </div>
            </div>
          </div>

          <!-- 税率详情 -->
          <div class="bg-card rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4">税率详情</h3>

            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm">适用税率</span>
                <span class="font-medium">{{ taxResults.applicableRate }}%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">速算扣除数</span>
                <span class="font-medium">{{ formatCurrency(taxResults.quickDeduction) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">应纳税所得额</span>
                <span class="font-medium">{{ formatCurrency(taxResults.taxableAmount) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">节税建议</span>
                <span class="font-medium text-green-600">{{ getTaxOptimizationAdvice() }}</span>
              </div>
            </div>
          </div>

          <!-- 税率区间提示 -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4" v-if="taxResults.rateWarning">
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p class="text-sm text-blue-800 font-medium mb-1">{{ taxResults.rateWarning }}</p>
                <p class="text-xs text-blue-700">建议调整年终奖金额以获得更优的税负。</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 发放优化结果 -->
        <div v-if="currentMode === 'optimization'" class="space-y-4">
          <!-- 最优方案 -->
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4 text-green-900">最优发放方案</h3>

            <div class="text-center mb-4">
              <div class="text-4xl font-bold text-green-600 mb-2">
                {{ formatCurrency(optimizationResults.bestScenario?.afterTaxTotal || 0) }}
              </div>
              <p class="text-sm text-green-700">最优方案税后收入</p>
            </div>

            <div class="bg-white/50 rounded-lg p-4">
              <h4 class="font-medium text-green-900 mb-2">{{ optimizationResults.bestScenario?.name }}</h4>
              <p class="text-sm text-green-800">{{ optimizationResults.bestScenario?.description }}</p>
            </div>
          </div>

          <!-- 方案对比表 -->
          <div class="bg-card rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4">方案对比分析</h3>

            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-2">发放方式</th>
                    <th class="text-right py-2">税额</th>
                    <th class="text-right py-2">到手金额</th>
                    <th class="text-right py-2">实际税率</th>
                    <th class="text-center py-2">推荐</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(scenario, index) in optimizationResults.scenarios"
                    :key="index"
                    :class="{ 'bg-green-50': scenario.isBest }"
                  >
                    <td class="py-2">{{ scenario.name }}</td>
                    <td class="text-right py-2">{{ formatCurrency(scenario.taxAmount) }}</td>
                    <td class="text-right py-2 font-medium">{{ formatCurrency(scenario.afterTaxAmount) }}</td>
                    <td class="text-right py-2">{{ scenario.effectiveRate }}%</td>
                    <td class="text-center py-2">
                      <span
                        v-if="scenario.isBest"
                        class="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                      >
                        推荐
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 节税效果 -->
          <div class="bg-card rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4">节税效果</h3>

            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm">相比一次性发放</span>
                <span class="font-medium text-green-600">+{{ formatCurrency(optimizationResults.taxSavings) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">节税比例</span>
                <span class="font-medium text-green-600">{{ optimizationResults.savingsRate }}%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">税率降低</span>
                <span class="font-medium text-green-600">-{{ optimizationResults.rateReduction }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细分析报告 -->
    <div class="bg-card rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">财务建议</h3>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 税务优化建议 -->
        <div>
          <h4 class="font-medium mb-3 text-red-600 flex items-center gap-2">
            <Calculator class="w-4 h-4" />
            税务优化建议
          </h4>
          <ul class="space-y-2 text-sm">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span>避免年终奖金额落入高税率区间</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span>考虑分拆发放以降低整体税负</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span>合理选择计税方式，单独计税通常更优</span>
            </li>
          </ul>
        </div>

        <!-- 发放策略建议 -->
        <div>
          <h4 class="font-medium mb-3 text-blue-600 flex items-center gap-2">
            <TrendingUp class="w-4 h-4" />
            发放策略建议
          </h4>
          <ul class="space-y-2 text-sm">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>避开36,000元、96,000元等税率临界点</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>考虑与月度工资的协调发放</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>分散到不同月份发放可降低税负</span>
            </li>
          </ul>
        </div>

        <!-- 合规提醒 -->
        <div>
          <h4 class="font-medium mb-3 text-yellow-600 flex items-center gap-2">
            <AlertTriangle class="w-4 h-4" />
            合规提醒
          </h4>
          <ul class="space-y-2 text-sm">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>确保发放方案符合税法规定</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>及时进行个税申报和缴纳</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>保留相关凭证和资料备查</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- FAQ常见问题 -->
    <div class="bg-card rounded-lg p-6 mb-8">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold">常见问题解答</h3>
        <button
          @click="toggleAllFAQs"
          class="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          {{ showAllFAQs ? '收起全部' : '展开全部' }}
        </button>
      </div>

      <div class="space-y-4">
        <div v-for="(faq, index) in faqs" :key="index" class="border rounded-lg">
          <button
            @click="toggleFAQ(index)"
            class="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <span class="font-medium">{{ faq.question }}</span>
            <ChevronDown
              class="w-4 h-4 transition-transform"
              :class="{ 'rotate-180': faq.isOpen }"
            />
          </button>
          <div
            v-show="faq.isOpen || showAllFAQs"
            class="px-4 pb-3 text-sm text-muted-foreground"
          >
            <div v-html="faq.answer"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具推荐 -->
    <RelatedTools :category="'finance'" :current-tool-id="'year-end-bonus-calculator'" />

    <!-- SEO内容 -->
    <SeoContent :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Info, Calculator, TrendingUp, Target, AlertTriangle, CheckCircle, ChevronDown, Gift } from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

definePageMeta({
  layout: 'default'
})

// SEO配置
useSeoMeta({
  title: '年终奖计算器 - 个税计算与发放优化方案 | Util工具箱',
  description: '专业年终奖个税计算工具，支持单独计税和综合计税两种模式，提供最优发放策略和合法节税方案。智能避税率陷阱，帮您最大化年终奖收入。',
  keywords: '年终奖计算器,年终奖个税,个税计算,税率陷阱,节税优化,年终奖发放方案,个税筹划,合法避税',
  author: 'Util工具箱',
  ogTitle: '年终奖计算器 - 专业个税优化与节税工具',
  ogDescription: '精确计算年终奖个税，提供最优发放策略，合法节税。智能避税率陷阱，帮您最大化年终奖收入。',
  ogImage: 'https://util.cn/images/tools/year-end-bonus-calculator.png',
  ogUrl: 'https://util.cn/tools/year-end-bonus-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '年终奖计算器 - 个税优化与发放方案分析',
  twitterDescription: '专业年终奖个税计算工具，支持单独计税和综合计税，提供最优发放策略，合法节税。',
  twitterImage: 'https://util.cn/images/tools/year-end-bonus-calculator.png'
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
            name: '年终奖计算器',
            description: '专业年终奖个税计算工具，支持单独计税和综合计税，提供最优发放策略和合法节税方案',
            url: 'https://util.cn/tools/year-end-bonus-calculator',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '年终奖个税计算',
              '单独计税优化',
              '综合计税对比',
              '税率陷阱识别',
              '发放方案分析',
              '节税策略建议',
              '多方案对比',
              '税后收入计算'
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
                name: '年终奖计算器',
                item: 'https://util.cn/tools/year-end-bonus-calculator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '年终奖个税如何计算？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': '年终奖个税可选择单独计税或并入综合所得计税。单独计税时，将年终奖除以12个月，按月换算后确定税率和速算扣除数，然后按全额计算应纳税额。每个纳税年度只能使用一次单独计税优惠。'
                }
              },
              {
                '@type': 'Question',
                name: '什么是年终奖税率陷阱？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': '年终奖税率陷阱是指在某些临界点附近，多发1元钱可能导致多交数千元个税的现象。主要出现在36000元、144000元、300000元、420000元、660000元、960000元等临界点。'
                }
              },
              {
                '@type': 'Question',
                name: '如何优化年终奖发放方案？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': '优化年终奖发放：1）避开税率陷阱临界点；2）合理分配月薪和年终奖比例；3）考虑分拆发放；4）充分利用专项扣除；5）对比单独计税和综合计税效果；6）结合其他收入进行整体税务筹划。'
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
const tool = tools.find(t => t.id === 'year-end-bonus-calculator')
const category = categories.find(c => c.id === 'finance')

// 计算模式
const calculationModes = [
  { id: 'tax', name: '个税计算' },
  { id: 'optimization', name: '发放优化' }
]

const currentMode = ref('tax')

// 个税计算数据
const taxData = reactive({
  bonusAmount: 50000,
  monthlySalary: 12000,
  socialInsurance: 2000,
  specialDeductions: 2000,
  otherDeductions: 0,
  calculationMethod: 'separate'
})

// 发放优化数据
const optimizationData = reactive({
  totalBonus: 100000,
  monthlySalary: 12000,
  optimizationGoal: 'maximizeAfterTax'
})

// 计算结果
const taxResults = reactive({
  taxableAmount: 0,
  applicableRate: 0,
  quickDeduction: 0,
  taxAmount: 0,
  afterTaxAmount: 0,
  effectiveRate: 0,
  rateWarning: ''
})

const optimizationResults = reactive({
  bestScenario: null,
  scenarios: [],
  taxSavings: 0,
  savingsRate: 0,
  rateReduction: 0
})

// FAQ数据
const faqs = reactive([
  {
    question: '年终奖个税是怎么计算的？',
    answer: '年终奖个税有两种计算方式：<br>1. <strong>单独计税</strong>：将年终奖除以12，按照按月换算后的税率表确定适用税率和速算扣除数，单独计算个税。<br>2. <strong>合并计税</strong>：将年终奖并入当月综合所得，一并计算个税。<br>通常情况下，单独计税对纳税人更有利。'
  },
  {
    question: '年终奖金额在多少时税负最重？',
    answer: '根据年终奖单独计税的税率表，以下几个金额区间的税负较重：<br>• 36,000-38,000元（税率25%）<br>• 96,000-104,000元（税率35%）<br>• 420,000-660,000元（税率45%）<br>• 超过960,000元（税率45%）<br>建议避免年终奖金额刚好落入这些高税率区间。'
  },
  {
    question: '年终奖分几次发放最节税？',
    answer: '分拆发放的效果取决于多种因素：<br>• 如果年终奖金额较高，分拆到合理区间可以降低整体税负<br>• 分2-3个月发放通常比较合适<br>• 但需要注意分拆后的每笔金额也要避免落入高税率区间<br>• 同时要考虑实际的资金需求和现金流安排'
  },
  {
    question: '年终奖和12月工资一起发有什么影响？',
    answer: '年终奖和12月工资一起发放可能会产生以下影响：<br>• 如果选择合并计税，会提高当月适用税率，增加整体税负<br>• 即使选择单独计税，也会影响12月工资的计税结果<br>• 建议错开发放时间，或将年终奖拆分到不同月份发放'
  },
  {
    question: '年终奖计税的优惠政策有哪些？',
    answer: '2023-2027年期间，年终奖计税有以下优惠政策：<br>• 居民个人取得全年一次性奖金，可选择单独计税<br>• 选择单独计税的，以全年一次性奖金收入除以12个月得到的数额确定税率<br>• 该优惠政策在一个纳税年度内只能使用一次<br>• 企业可代扣代缴，也可由个人自行申报'
  },
  {
    question: '离职后年终奖怎么计税？',
    answer: '离职后年终奖的计税规则：<br>• 如果在离职当年发放，仍按全年一次性奖金处理<br>• 可以选择单独计税或合并计税<br>• 计税时需要考虑全年的收入情况<br>• 建议咨询专业税务师获得具体指导'
  },
  {
    question: '2024年还有年终奖优惠政策吗？',
    answer: '是的，根据国家税务总局公告，年终奖单独计税优惠政策延续到2027年12月31日：<br>• 居民个人取得全年一次性奖金，可以选择单独计税<br>• 也可以选择并入当年综合所得计算个人所得税<br>• 该优惠在一个纳税年度内只能适用一次'
  },
  {
    question: '如何避免年终奖的"税率陷阱"？',
    answer: '避免年终奖"税率陷阱"的方法：<br>• 合理规划年终奖金额，避免恰好落入高税率临界点<br>• 考虑分拆发放到合理区间<br>• 避开36,000、96,000、420,000等临界金额<br>• 使用专业的年终奖计算工具进行测算'
  }
])

const showAllFAQs = ref(false)

// 年终奖税率表（单独计税）
const bonusTaxTable = [
  { min: 0, max: 3000, rate: 0.03, deduction: 0 },
  { min: 3000, max: 12000, rate: 0.10, deduction: 210 },
  { min: 12000, max: 25000, rate: 0.20, deduction: 1410 },
  { min: 25000, max: 35000, rate: 0.25, deduction: 2660 },
  { min: 35000, max: 55000, rate: 0.30, deduction: 4410 },
  { min: 55000, max: 80000, rate: 0.35, deduction: 7160 },
  { min: 80000, max: Infinity, rate: 0.45, deduction: 15160 }
]

// 综合所得税税率表
const incomeTaxTable = [
  { min: 0, max: 3000, rate: 0.03, deduction: 0 },
  { min: 3000, max: 12000, rate: 0.10, deduction: 210 },
  { min: 12000, max: 25000, rate: 0.20, deduction: 1410 },
  { min: 25000, max: 35000, rate: 0.25, deduction: 2660 },
  { min: 35000, max: 55000, rate: 0.30, deduction: 4410 },
  { min: 55000, max: 80000, rate: 0.35, deduction: 7160 },
  { min: 80000, max: Infinity, rate: 0.45, deduction: 15160 }
]

// 获取税率
const getTaxRate = (amount, taxTable) => {
  for (const bracket of taxTable) {
    if (amount > bracket.min && amount <= bracket.max) {
      return bracket
    }
  }
  return taxTable[taxTable.length - 1]
}

// 计算年终奖个税（单独计税）
const calculateSeparateBonusTax = (bonusAmount) => {
  const monthlyEquivalent = bonusAmount / 12
  const taxRateInfo = getTaxRate(monthlyEquivalent, bonusTaxTable)

  const taxAmount = bonusAmount * taxRateInfo.rate - taxRateInfo.deduction

  return {
    taxableAmount: bonusAmount,
    applicableRate: taxRateInfo.rate * 100,
    quickDeduction: taxRateInfo.deduction,
    taxAmount: Math.max(0, taxAmount),
    afterTaxAmount: bonusAmount - taxAmount
  }
}

// 计算综合所得税
const calculateCombinedTax = (monthlySalary, bonusAmount, socialInsurance, specialDeductions, otherDeductions) => {
  const totalIncome = monthlySalary + bonusAmount
  const basicDeduction = 5000
  const totalDeductions = socialInsurance + specialDeductions + otherDeductions

  const taxableIncome = Math.max(0, totalIncome - basicDeduction - totalDeductions)
  const taxRateInfo = getTaxRate(taxableIncome, incomeTaxTable)

  return taxableIncome * taxRateInfo.rate - taxRateInfo.deduction
}

// 计算年终奖个税
const calculateBonusTax = () => {
  if (taxData.calculationMethod === 'separate') {
    // 单独计税
    const result = calculateSeparateBonusTax(taxData.bonusAmount)
    Object.assign(taxResults, {
      ...result,
      effectiveRate: taxData.bonusAmount > 0 ? (result.taxAmount / taxData.bonusAmount * 100) : 0
    })

    // 检查税率警告
    checkRateWarning()
  } else {
    // 合并计税
    const monthlyTax = calculateCombinedTax(
      taxData.monthlySalary,
      taxData.bonusAmount,
      taxData.socialInsurance,
      taxData.specialDeductions,
      taxData.otherDeductions
    )

    const monthlyTaxWithoutBonus = calculateCombinedTax(
      taxData.monthlySalary,
      0,
      taxData.socialInsurance,
      taxData.specialDeductions,
      taxData.otherDeductions
    )

    const bonusTax = monthlyTax - monthlyTaxWithoutBonus
    const effectiveRate = taxData.bonusAmount > 0 ? (bonusTax / taxData.bonusAmount * 100) : 0

    Object.assign(taxResults, {
      taxableAmount: taxData.bonusAmount,
      applicableRate: '根据综合所得税率表',
      quickDeduction: '包含在综合所得中',
      taxAmount: Math.max(0, bonusTax),
      afterTaxAmount: taxData.bonusAmount - bonusTax,
      effectiveRate: effectiveRate.toFixed(2)
    })
  }
}

// 检查税率警告
const checkRateWarning = () => {
  const amount = taxData.bonusAmount
  const taxRateInfo = getTaxRate(amount / 12, bonusTaxTable)

  // 检查是否接近税率跳跃点
  const rateJumpPoints = [36000, 96000, 420000, 660000]
  const tolerance = 2000 // 2000元容差

  for (const point of rateJumpPoints) {
    if (Math.abs(amount - point) <= tolerance) {
      taxResults.rateWarning = `年终奖金额 ${formatCurrency(amount)} 接近税率临界点 ${formatCurrency(point)}，建议调整金额以优化税负`
      return
    }
  }

  taxResults.rateWarning = ''
}

// 获取税负优化建议
const getTaxOptimizationAdvice = () => {
  if (!taxResults.rateWarning) {
    return '当前方案合理，建议保持'
  }

  const amount = taxData.bonusAmount
  if (amount < 36000) {
    return '可适当增加金额以优化税负'
  } else if (amount < 42000) {
    return '建议调整到36,000元以下或42,000元以上'
  } else {
    return '建议分拆发放或咨询专业税务师'
  }
}

// 计算发放优化方案
const calculateOptimization = () => {
  const scenarios = []

  // 一次性发放
  const lumpSum = calculateSeparateBonusTax(optimizationData.totalBonus)
  scenarios.push({
    name: '一次性发放',
    description: '全部年终奖一次性发放',
    taxAmount: lumpSum.taxAmount,
    afterTaxAmount: lumpSum.afterTaxAmount,
    effectiveRate: (lumpSum.taxAmount / optimizationData.totalBonus * 100).toFixed(2),
    months: 1,
    monthlyAmount: optimizationData.totalBonus,
    isBest: false
  })

  // 分拆发放（2-12个月）
  for (let months = 2; months <= 12; months++) {
    const monthlyAmount = optimizationData.totalBonus / months
    let totalTax = 0
    let totalAfterTax = 0

    for (let i = 0; i < months; i++) {
      const monthlyResult = calculateSeparateBonusTax(monthlyAmount)
      totalTax += monthlyResult.taxAmount
      totalAfterTax += monthlyResult.afterTaxAmount
    }

    scenarios.push({
      name: `分${months}个月发放`,
      description: `每月发放 ${formatCurrency(monthlyAmount)}`,
      taxAmount: totalTax,
      afterTaxAmount: totalAfterTax,
      effectiveRate: (totalTax / optimizationData.totalBonus * 100).toFixed(2),
      months: months,
      monthlyAmount: monthlyAmount,
      isBest: false
    })
  }

  // 找出最优方案
  let bestScenario = scenarios[0]
  for (let i = 1; i < scenarios.length; i++) {
    let isBetter = false

    switch (optimizationData.optimizationGoal) {
      case 'maximizeAfterTax':
        isBetter = scenarios[i].afterTaxAmount > bestScenario.afterTaxAmount
        break
      case 'minimizeTaxRate':
        isBetter = parseFloat(scenarios[i].effectiveRate) < parseFloat(bestScenario.effectiveRate)
        break
      case 'balanced':
        // 综合考虑税后收入和月度均衡
        const currentScore = scenarios[i].afterTaxAmount / scenarios[i].months
        const bestScore = bestScenario.afterTaxAmount / bestScenario.months
        isBetter = currentScore > bestScore
        break
    }

    if (isBetter) {
      bestScenario = scenarios[i]
    }
  }

  bestScenario.isBest = true

  // 计算节税效果
  const lumpSumScenario = scenarios[0]
  const taxSavings = lumpSumScenario.taxAmount - bestScenario.taxAmount
  const savingsRate = (taxSavings / lumpSumScenario.taxAmount * 100).toFixed(1)

  // 计算税率降低
  const lumpSumRate = parseFloat(lumpSumScenario.effectiveRate)
  const bestRate = parseFloat(bestScenario.effectiveRate)
  const rateReduction = (lumpSumRate - bestRate).toFixed(1)

  Object.assign(optimizationResults, {
    bestScenario,
    scenarios: scenarios.sort((a, b) => b.afterTaxAmount - a.afterTaxAmount),
    taxSavings: taxSavings,
    savingsRate: savingsRate,
    rateReduction: rateReduction
  })
}

// UI辅助函数
const getInputTitle = () => {
  switch (currentMode.value) {
    case 'tax': return '个税计算参数'
    case 'optimization': return '发放方案设置'
    default: return '参数设置'
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const getCurrentTime = () => {
  return new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 清空输入
const clearInput = () => {
  if (currentMode.value === 'tax') {
    Object.assign(taxData, {
      bonusAmount: 0,
      monthlySalary: 0,
      socialInsurance: 0,
      specialDeductions: 0,
      otherDeductions: 0,
      calculationMethod: 'separate'
    })
    calculateBonusTax()
  } else if (currentMode.value === 'optimization') {
    Object.assign(optimizationData, {
      totalBonus: 0,
      monthlySalary: 0,
      optimizationGoal: 'maximizeAfterTax'
    })
    calculateOptimization()
  }
}

// 加载示例数据
const loadExample = () => {
  if (currentMode.value === 'tax') {
    Object.assign(taxData, {
      bonusAmount: 80000,
      monthlySalary: 15000,
      socialInsurance: 2200,
      specialDeductions: 2000,
      otherDeductions: 0,
      calculationMethod: 'separate'
    })
    calculateBonusTax()
  } else if (currentMode.value === 'optimization') {
    Object.assign(optimizationData, {
      totalBonus: 120000,
      monthlySalary: 15000,
      optimizationGoal: 'maximizeAfterTax'
    })
    calculateOptimization()
  }
}

// 切换FAQ
const toggleFAQ = (index) => {
  faqs[index].isOpen = !faqs[index].isOpen
}

// 切换所有FAQ
const toggleAllFAQs = () => {
  showAllFAQs.value = !showAllFAQs.value
  faqs.forEach(faq => {
    faq.isOpen = false
  })
}

// 初始化
faqs.forEach(faq => {
  faq.isOpen = false
})

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 计算初始结果
calculateBonusTax()
</script>