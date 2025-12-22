<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">个人养老金计算器 - 个税抵扣与退休收益分析</h1>
      <p class="text-muted-foreground">计算个人养老金缴费的个税抵扣优惠，预测退休收益，支持多方案对比分析。帮助您充分利用税收优惠，合理规划退休生活。</p>
    </div>

    <!-- 政策说明卡片 -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
      <div class="flex items-start gap-4">
        <div class="p-2 bg-blue-500 text-white rounded-lg">
          <Info class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-semibold text-blue-900 mb-2">2024年个人养老金政策要点</h3>
          <ul class="text-sm text-blue-800 space-y-1">
            <li>• 年度缴费上限12,000元，可享受个税抵扣</li>
            <li>• 缴费阶段投资收益免税，退休领取时按规定缴税</li>
            <li>• 达到退休年龄、完全丧失劳动能力、出国（境）定居等条件可领取</li>
            <li>• 投资产品包括储蓄存款、理财产品、商业养老保险、公募基金等</li>
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

        <!-- 个税抵扣计算输入 -->
        <div v-if="currentMode === 'tax'" class="space-y-4">
          <!-- 个人基本信息 -->
          <div class="bg-card rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-4">个人基本信息</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">月收入（元）</label>
                <input
                  v-model.number="taxData.monthlyIncome"
                  @input="calculateTaxSavings"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="15000"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">社保公积金基数（元）</label>
                <input
                  v-model.number="taxData.socialBase"
                  @input="calculateTaxSavings"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="12000"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">专项附加扣除（元/月）</label>
                <input
                  v-model.number="taxData.specialDeductions"
                  @input="calculateTaxSavings"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="2000"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p class="text-xs text-muted-foreground mt-1">包括子女教育、住房贷款/租金、赡养老人等</p>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">养老金年缴费（元）</label>
                <select
                  v-model.number="taxData.pensionContribution"
                  @change="calculateTaxSavings"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option :value="12000">12,000元（最高档）</option>
                  <option :value="10000">10,000元</option>
                  <option :value="8000">8,000元</option>
                  <option :value="6000">6,000元</option>
                  <option :value="4000">4,000元</option>
                  <option :value="0">暂不缴费</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 退休收益预测输入 -->
        <div v-if="currentMode === 'retirement'" class="space-y-4">
          <!-- 个人基本信息 -->
          <div class="bg-card rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-4">基本信息</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">当前年龄</label>
                <input
                  v-model.number="retirementData.currentAge"
                  @input="calculateRetirement"
                  type="number"
                  min="18"
                  max="60"
                  placeholder="30"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">退休年龄</label>
                <select
                  v-model.number="retirementData.retirementAge"
                  @change="calculateRetirement"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option :value="55">55岁</option>
                  <option :value="60">60岁</option>
                  <option :value="65">65岁</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">当前账户余额（元）</label>
                <input
                  v-model.number="retirementData.currentBalance"
                  @input="calculateRetirement"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">年缴费金额（元）</label>
                <select
                  v-model.number="retirementData.annualContribution"
                  @change="calculateRetirement"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option :value="12000">12,000元</option>
                  <option :value="10000">10,000元</option>
                  <option :value="8000">8,000元</option>
                  <option :value="6000">6,000元</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 投资收益假设 -->
          <div class="bg-card rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-4">投资收益假设</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">预期年化收益率（%）</label>
                <select
                  v-model.number="retirementData.expectedReturn"
                  @change="calculateRetirement"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option :value="3">3%（保守型）</option>
                  <option :value="5">5%（稳健型）</option>
                  <option :value="7">7%（平衡型）</option>
                  <option :value="10">10%（积极型）</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">缴费年增长率（%）</label>
                <input
                  v-model.number="retirementData.contributionGrowth"
                  @input="calculateRetirement"
                  type="number"
                  min="0"
                  max="20"
                  step="1"
                  placeholder="5"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p class="text-xs text-muted-foreground mt-1">考虑工资增长导致的缴费增加</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 方案对比输入 -->
        <div v-if="currentMode === 'comparison'" class="space-y-4">
          <div class="bg-card rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-4">对比方案设置</h3>

            <div class="space-y-4">
              <div v-for="(plan, index) in comparisonPlans" :key="index" class="border rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-medium">方案 {{ index + 1 }}</h4>
                  <button
                    v-if="index > 0"
                    @click="removePlan(index)"
                    class="text-red-500 hover:text-red-700 text-sm"
                  >
                    删除
                  </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-sm font-medium mb-1">开始年龄</label>
                    <input
                      v-model.number="plan.startAge"
                      @input="calculateComparison"
                      type="number"
                      min="18"
                      max="60"
                      placeholder="25"
                      class="w-full px-2 py-1 bg-muted border border-border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">年缴费（元）</label>
                    <select
                      v-model.number="plan.annualContribution"
                      @change="calculateComparison"
                      class="w-full px-2 py-1 bg-muted border border-border rounded text-sm"
                    >
                      <option :value="12000">12,000</option>
                      <option :value="8000">8,000</option>
                      <option :value="6000">6,000</option>
                      <option :value="4000">4,000</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">收益率（%）</label>
                    <select
                      v-model.number="plan.expectedReturn"
                      @change="calculateComparison"
                      class="w-full px-2 py-1 bg-muted border border-border rounded text-sm"
                    >
                      <option :value="3">3%</option>
                      <option :value="5">5%</option>
                      <option :value="7">7%</option>
                      <option :value="10">10%</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                v-if="comparisonPlans.length < 4"
                @click="addPlan"
                class="w-full py-2 border border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                + 添加对比方案
              </button>
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

        <!-- 个税抵扣结果 -->
        <div v-if="currentMode === 'tax'" class="space-y-4">
          <!-- 节税效果总览 -->
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4 text-green-900">节税效果总览</h3>

            <div class="text-center mb-4">
              <div class="text-4xl font-bold text-green-600 mb-2">
                {{ formatCurrency(taxResults.annualTaxSavings) }}
              </div>
              <p class="text-sm text-green-700">年节税金额</p>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="text-center p-3 bg-white/50 rounded">
                <div class="font-semibold text-green-800">{{ formatCurrency(taxResults.monthlyTaxSavings) }}</div>
                <div class="text-green-600">月节税金额</div>
              </div>
              <div class="text-center p-3 bg-white/50 rounded">
                <div class="font-semibold text-green-800">{{ taxResults.savingsRate }}%</div>
                <div class="text-green-600">节税比例</div>
              </div>
            </div>
          </div>

          <!-- 收入对比分析 -->
          <div class="bg-card rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4">收入对比分析</h3>

            <div class="space-y-3">
              <div class="flex justify-between items-center p-3 bg-muted/50 rounded">
                <span class="text-sm">缴费前月收入</span>
                <span class="font-medium">{{ formatCurrency(taxResults.beforePensionIncome) }}</span>
              </div>
              <div class="flex justify-between items-center p-3 bg-muted/50 rounded">
                <span class="text-sm">缴费后月收入</span>
                <span class="font-medium">{{ formatCurrency(taxResults.afterPensionIncome) }}</span>
              </div>
              <div class="flex justify-between items-center p-3 bg-muted/50 rounded">
                <span class="text-sm">月收入变化</span>
                <span :class="taxResults.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ taxResults.incomeChange >= 0 ? '+' : '' }}{{ formatCurrency(taxResults.incomeChange) }}
                </span>
              </div>
              <div class="flex justify-between items-center p-3 bg-muted/50 rounded">
                <span class="text-sm">实际缴费成本</span>
                <span class="font-medium text-blue-600">{{ formatCurrency(taxResults.netCost) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 退休收益预测结果 -->
        <div v-if="currentMode === 'retirement'" class="space-y-4">
          <!-- 退休收益总览 -->
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4 text-blue-900">退休收益预测</h3>

            <div class="text-center mb-4">
              <div class="text-4xl font-bold text-blue-600 mb-2">
                {{ formatCurrency(retirementResults.totalAtRetirement) }}
              </div>
              <p class="text-sm text-blue-700">退休时账户总额</p>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="text-center p-3 bg-white/50 rounded">
                <div class="font-semibold text-blue-800">{{ formatCurrency(retirementResults.totalContributions) }}</div>
                <div class="text-blue-600">累计缴费本金</div>
              </div>
              <div class="text-center p-3 bg-white/50 rounded">
                <div class="font-semibold text-blue-800">{{ formatCurrency(retirementResults.totalReturns) }}</div>
                <div class="text-blue-600">投资收益总额</div>
              </div>
            </div>

            <div class="mt-4 p-3 bg-white/50 rounded">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-blue-800">预计月养老金</span>
                <span class="font-bold text-blue-600">{{ formatCurrency(retirementResults.monthlyPension) }}</span>
              </div>
            </div>
          </div>

          <!-- 收益构成分析 -->
          <div class="bg-card rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4">收益构成分析</h3>

            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>本金占比</span>
                  <span>{{ retirementResults.principalPercentage }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full bg-blue-500"
                    :style="{ width: retirementResults.principalPercentage + '%' }"
                  ></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>投资收益占比</span>
                  <span>{{ retirementResults.returnPercentage }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full bg-green-500"
                    :style="{ width: retirementResults.returnPercentage + '%' }"
                  ></div>
                </div>
              </div>
            </div>

            <div class="mt-4 p-3 bg-blue-50 rounded">
              <p class="text-xs text-blue-700">
                <strong>复利效应：</strong>投资收益占总余额的{{ retirementResults.returnPercentage }}%，体现了长期投资的复利效应。
              </p>
            </div>
          </div>
        </div>

        <!-- 方案对比结果 -->
        <div v-if="currentMode === 'comparison'" class="space-y-4">
          <div class="bg-card rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4">方案对比结果</h3>

            <div class="space-y-4">
              <div v-for="(plan, index) in comparisonResults" :key="index"
                   class="border rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-medium">方案 {{ index + 1 }}</h4>
                  <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {{ plan.tag }}
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div class="text-muted-foreground">退休总额</div>
                    <div class="font-semibold">{{ formatCurrency(plan.totalAtRetirement) }}</div>
                  </div>
                  <div>
                    <div class="text-muted-foreground">累计缴费</div>
                    <div class="font-semibold">{{ formatCurrency(plan.totalContributions) }}</div>
                  </div>
                  <div>
                    <div class="text-muted-foreground">投资收益</div>
                    <div class="font-semibold">{{ formatCurrency(plan.totalReturns) }}</div>
                  </div>
                  <div>
                    <div class="text-muted-foreground">月养老金</div>
                    <div class="font-semibold">{{ formatCurrency(plan.monthlyPension) }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 最佳方案推荐 -->
            <div v-if="comparisonResults.length > 0" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <Award class="w-5 h-5 text-green-600" />
                <span class="font-medium text-green-900">推荐方案</span>
              </div>
              <p class="text-sm text-green-800">
                基于收益最大化原则，推荐选择方案{{ recommendedPlan + 1 }}，
                预计退休时账户余额{{ formatCurrency(comparisonResults[recommendedPlan]?.totalAtRetirement || 0) }}。
              </p>
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
          <h4 class="font-medium mb-3 text-green-600 flex items-center gap-2">
            <Calculator class="w-4 h-4" />
            税务优化建议
          </h4>
          <ul class="space-y-2 text-sm">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>充分利用年度12,000元缴费上限</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>在年度汇算清缴时申报扣除</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>配合其他专项附加扣除使用</span>
            </li>
          </ul>
        </div>

        <!-- 投资策略建议 -->
        <div>
          <h4 class="font-medium mb-3 text-blue-600 flex items-center gap-2">
            <TrendingUp class="w-4 h-4" />
            投资策略建议
          </h4>
          <ul class="space-y-2 text-sm">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>根据年龄和风险承受能力选择产品</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>采用定期定额投资策略</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>长期持有享受复利效应</span>
            </li>
          </ul>
        </div>

        <!-- 退休规划建议 -->
        <div>
          <h4 class="font-medium mb-3 text-purple-600 flex items-center gap-2">
            <Target class="w-4 h-4" />
            退休规划建议
          </h4>
          <ul class="space-y-2 text-sm">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <span>尽早开始缴费，享受复利增长</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <span>定期评估调整缴费计划</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <span>考虑通货膨胀对退休金的影响</span>
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
    <RelatedTools :category="'finance'" :current-tool-id="'pension-calculator'" />

    <!-- SEO内容 -->
    <SeoContent :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Info, Calculator, TrendingUp, Target, Award, CheckCircle, ChevronDown } from 'lucide-vue-next'
import RelatedTools from '~/components/RelatedTools.vue'
import SeoContent from '~/components/SeoContent.vue'

// 计算模式
const calculationModes = [
  { id: 'tax', name: '个税抵扣' },
  { id: 'retirement', name: '退休收益' },
  { id: 'comparison', name: '方案对比' }
]

const currentMode = ref('tax')

// 个税抵扣数据
const taxData = reactive({
  monthlyIncome: 15000,
  socialBase: 12000,
  specialDeductions: 2000,
  pensionContribution: 12000
})

// 退休收益数据
const retirementData = reactive({
  currentAge: 30,
  retirementAge: 60,
  currentBalance: 0,
  annualContribution: 12000,
  expectedReturn: 7,
  contributionGrowth: 5
})

// 方案对比数据
const comparisonPlans = reactive([
  {
    startAge: 25,
    annualContribution: 12000,
    expectedReturn: 7
  },
  {
    startAge: 30,
    annualContribution: 8000,
    expectedReturn: 5
  },
  {
    startAge: 35,
    annualContribution: 6000,
    expectedReturn: 3
  }
])

// 计算结果
const taxResults = reactive({
  annualTaxSavings: 0,
  monthlyTaxSavings: 0,
  savingsRate: 0,
  beforePensionIncome: 0,
  afterPensionIncome: 0,
  incomeChange: 0,
  netCost: 0
})

const retirementResults = reactive({
  totalAtRetirement: 0,
  totalContributions: 0,
  totalReturns: 0,
  monthlyPension: 0,
  principalPercentage: 0,
  returnPercentage: 0
})

const comparisonResults = ref([])

// FAQ数据
const faqs = reactive([
  {
    question: '个人养老金和基本养老金有什么区别？',
    answer: '个人养老金是自愿参加的补充养老保险，由个人缴费，享受税收优惠，投资收益免税。基本养老金是国家强制的社会保险，由单位和个人共同缴费，保障基本生活。个人养老金是对基本养老金的补充。'
  },
  {
    question: '什么人可以参加个人养老金？',
    answer: '在中国境内参加城镇职工基本养老保险或者城乡居民基本养老保险的劳动者，都可以参加个人养老金制度。包括企业职工、机关事业单位人员、灵活就业人员等。'
  },
  {
    question: '每年最多能缴多少？什么时候可以取？',
    answer: '每年缴费上限为12,000元。达到领取基本养老金年龄、完全丧失劳动能力、出国（境）定居，或者国家规定的其他情形，可以领取个人养老金。'
  },
  {
    question: '个税抵扣怎么申请？需要什么材料？',
    answer: '通过个人所得税APP进行申报，或者在年度汇算清缴时填报。需要提供个人养老金资金账户信息，缴费凭证由开户银行提供。抵扣额度为缴费金额，最高12,000元/年。'
  },
  {
    question: '月薪5000元以下的人参加有意义吗？',
    answer: '即使月薪5000元以下，参加个人养老金仍有意义。虽然当前节税效果不明显，但可以享受投资收益免税，通过长期投资积累退休资金，且未来收入增长后可以继续享受税收优惠。'
  },
  {
    question: '个人养老金的收益率大概是多少？',
    answer: '根据投资产品不同，收益率差异较大。储蓄存款约2-3%，理财产品3-5%，公募基金可能更高但也有风险。建议根据年龄和风险承受能力选择合适的产品组合。'
  },
  {
    question: '如果身故，账户里的钱怎么办？',
    answer: '参加人死亡后，其个人养老金资金账户中的资产可以继承。法定继承人或者指定受益人可以一次性领取账户内的全部资金。'
  },
  {
    question: '可以提前取出吗？有什么条件？',
    answer: '一般情况下不可以提前取出。只有在达到退休年龄、完全丧失劳动能力、出国（境）定居等法定情形下才能领取。这也是为了保证养老资金的专款专用。'
  }
])

const showAllFAQs = ref(false)

// 个税计算函数
const calculateTax = (taxableIncome) => {
  // 个税税率表（2024年标准）
  const taxBrackets = [
    { min: 0, max: 3000, rate: 0.03, deduction: 0 },
    { min: 3000, max: 12000, rate: 0.10, deduction: 210 },
    { min: 12000, max: 25000, rate: 0.20, deduction: 1410 },
    { min: 25000, max: 35000, rate: 0.25, deduction: 2660 },
    { min: 35000, max: 55000, rate: 0.30, deduction: 4410 },
    { min: 55000, max: 80000, rate: 0.35, deduction: 7160 },
    { min: 80000, max: Infinity, rate: 0.45, deduction: 15160 }
  ]

  for (const bracket of taxBrackets) {
    if (taxableIncome > bracket.min && taxableIncome <= bracket.max) {
      return taxableIncome * bracket.rate - bracket.deduction
    }
  }
  return 0
}

// 计算个税抵扣
const calculateTaxSavings = () => {
  // 月度计算
  const monthlyPensionContribution = taxData.pensionContribution / 12

  // 计算应纳税所得额（缴费前）
  const socialInsurance = Math.min(taxData.socialBase, 0.3 * taxData.monthlyIncome) // 假设社保费率30%
  const taxableIncomeBefore = taxData.monthlyIncome - 5000 - socialInsurance - taxData.specialDeductions

  // 计算应纳税所得额（缴费后）
  const taxableIncomeAfter = Math.max(0, taxableIncomeBefore - monthlyPensionContribution)

  // 计算个税
  const taxBefore = calculateTax(taxableIncomeBefore)
  const taxAfter = calculateTax(taxableIncomeAfter)

  // 计算结果
  const monthlyTaxSavings = Math.max(0, taxBefore - taxAfter)
  const annualTaxSavings = monthlyTaxSavings * 12
  const savingsRate = taxData.pensionContribution > 0 ? (annualTaxSavings / taxData.pensionContribution * 100) : 0

  const socialInsuranceMonthly = socialInsurance
  const beforePensionIncome = taxData.monthlyIncome - socialInsuranceMonthly - taxBefore
  const afterPensionIncome = taxData.monthlyIncome - socialInsuranceMonthly - monthlyPensionContribution - taxAfter
  const incomeChange = afterPensionIncome - beforePensionIncome
  const netCost = monthlyPensionContribution - monthlyTaxSavings

  // 更新结果
  Object.assign(taxResults, {
    annualTaxSavings,
    monthlyTaxSavings,
    savingsRate: savingsRate.toFixed(1),
    beforePensionIncome,
    afterPensionIncome,
    incomeChange,
    netCost: netCost * 12 // 年化净成本
  })
}

// 计算退休收益
const calculateRetirement = () => {
  const years = retirementData.retirementAge - retirementData.currentAge

  if (years <= 0) {
    Object.assign(retirementResults, {
      totalAtRetirement: 0,
      totalContributions: 0,
      totalReturns: 0,
      monthlyPension: 0,
      principalPercentage: 0,
      returnPercentage: 0
    })
    return
  }

  let totalBalance = retirementData.currentBalance
  let totalContributions = retirementData.currentBalance

  // 计算复合增长
  for (let i = 0; i < years; i++) {
    // 考虑缴费增长
    const contributionGrowthFactor = Math.pow(1 + retirementData.contributionGrowth / 100, i)
    const annualContribution = retirementData.annualContribution * contributionGrowthFactor

    // 年初投入
    totalBalance += annualContribution
    totalContributions += annualContribution

    // 年末收益
    totalBalance *= (1 + retirementData.expectedReturn / 100)
  }

  const totalReturns = totalBalance - totalContributions
  const monthlyPension = totalBalance / 240 // 假设20年领取期

  const principalPercentage = totalContributions > 0 ? (totalContributions / totalBalance * 100) : 0
  const returnPercentage = 100 - principalPercentage

  Object.assign(retirementResults, {
    totalAtRetirement: Math.round(totalBalance),
    totalContributions: Math.round(totalContributions),
    totalReturns: Math.round(totalReturns),
    monthlyPension: Math.round(monthlyPension),
    principalPercentage: principalPercentage.toFixed(1),
    returnPercentage: returnPercentage.toFixed(1)
  })
}

// 计算方案对比
const calculateComparison = () => {
  const results = comparisonPlans.map(plan => {
    const years = 60 - plan.startAge // 假设统一60岁退休
    let totalBalance = 0
    let totalContributions = 0

    for (let i = 0; i < years; i++) {
      totalBalance += plan.annualContribution
      totalContributions += plan.annualContribution
      totalBalance *= (1 + plan.expectedReturn / 100)
    }

    const totalReturns = totalBalance - totalContributions
    const monthlyPension = totalBalance / 240

    return {
      totalAtRetirement: Math.round(totalBalance),
      totalContributions: Math.round(totalContributions),
      totalReturns: Math.round(totalReturns),
      monthlyPension: Math.round(monthlyPension),
      tag: getPlanTag(plan)
    }
  })

  comparisonResults.value = results
}

// 获取方案标签
const getPlanTag = (plan) => {
  if (plan.startAge <= 25) return '早期'
  if (plan.startAge <= 30) return '适中'
  if (plan.expectedReturn >= 7) return '积极'
  if (plan.expectedReturn <= 3) return '保守'
  return '平衡'
}

// 获取推荐方案
const recommendedPlan = computed(() => {
  if (comparisonResults.value.length === 0) return 0
  return comparisonResults.value.reduce((maxIndex, current, index, array) =>
    current.totalAtRetirement > array[maxIndex].totalAtRetirement ? index : maxIndex, 0
  )
})

// UI辅助函数
const getInputTitle = () => {
  switch (currentMode.value) {
    case 'tax': return '个税抵扣参数'
    case 'retirement': return '退休规划参数'
    case 'comparison': return '对比方案设置'
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
      monthlyIncome: 0,
      socialBase: 0,
      specialDeductions: 0,
      pensionContribution: 0
    })
  } else if (currentMode.value === 'retirement') {
    Object.assign(retirementData, {
      currentAge: 30,
      retirementAge: 60,
      currentBalance: 0,
      annualContribution: 12000,
      expectedReturn: 7,
      contributionGrowth: 5
    })
  }

  // 重新计算
  if (currentMode.value === 'tax') calculateTaxSavings()
  else if (currentMode.value === 'retirement') calculateRetirement()
  else calculateComparison()
}

// 加载示例数据
const loadExample = () => {
  if (currentMode.value === 'tax') {
    Object.assign(taxData, {
      monthlyIncome: 15000,
      socialBase: 12000,
      specialDeductions: 2000,
      pensionContribution: 12000
    })
    calculateTaxSavings()
  } else if (currentMode.value === 'retirement') {
    Object.assign(retirementData, {
      currentAge: 30,
      retirementAge: 60,
      currentBalance: 20000,
      annualContribution: 12000,
      expectedReturn: 7,
      contributionGrowth: 5
    })
    calculateRetirement()
  } else {
    // 方案对比使用默认数据
    calculateComparison()
  }
}

// 添加对比方案
const addPlan = () => {
  if (comparisonPlans.length < 4) {
    comparisonPlans.push({
      startAge: 30,
      annualContribution: 8000,
      expectedReturn: 5
    })
    calculateComparison()
  }
}

// 移除对比方案
const removePlan = (index) => {
  comparisonPlans.splice(index, 1)
  calculateComparison()
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

// SEO设置
useSeoMeta({
  title: '个人养老金计算器 - 个税抵扣与退休收益分析',
  description: '免费个人养老金计算器，计算个税抵扣优惠和退休收益预测，支持多方案对比分析。帮助您充分利用税收优惠，合理规划退休生活，享受复利增长。',
  keywords: ['个人养老金计算器', '个税抵扣', '养老金税收优惠', '退休规划', '养老理财', '养老金收益计算', '个税筹划', '退休金计算', '养老保险', '税收递延'],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '个人养老金计算器',
    description: '免费的在线个人养老金计算工具，支持个税抵扣计算、退休收益预测、多方案对比分析，帮助充分利用税收优惠进行退休规划。',
    url: 'https://util.iskytrip.com/tools/pension-calculator',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    featureList: [
      '个税抵扣计算',
      '退休收益预测',
      '多方案对比',
      '税收优惠分析',
      '复利效应计算',
      '退休规划建议',
      '投资策略推荐',
      'FAQ问答'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: '个人养老金参与者'
    }
  }
})

// 初始化
faqs.forEach(faq => {
  faq.isOpen = false
})

// 计算初始结果
calculateTaxSavings()
</script>