<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">保险费计算器</h1>
      <p class="text-muted-foreground mb-6">计算寿险、健康险、车险等保险费用，支持多产品对比和保费优化建议</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-6">
        <!-- 保险类型选择 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">保险类型</h3>
          <div class="space-y-3">
            <label class="flex items-center">
              <input
                v-model="insuranceType"
                type="radio"
                value="life"
                class="mr-2"
                @change="resetCalculator"
              />
              <span class="text-sm">寿险</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="insuranceType"
                type="radio"
                value="health"
                class="mr-2"
                @change="resetCalculator"
              />
              <span class="text-sm">健康险</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="insuranceType"
                type="radio"
                value="car"
                class="mr-2"
                @change="resetCalculator"
              />
              <span class="text-sm">车险</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="insuranceType"
                type="radio"
                value="property"
                class="mr-2"
                @change="resetCalculator"
              />
              <span class="text-sm">财产险</span>
            </label>
          </div>
        </div>

        <!-- 基础信息 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">基础信息</h3>
          <div class="space-y-4">
            <div v-if="insuranceType !== 'car'">
              <label class="block text-sm font-medium mb-2">年龄</label>
              <input
                v-model.number="age"
                type="number"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入年龄"
                @input="calculatePremium"
              />
            </div>

            <div v-if="insuranceType === 'car'">
              <label class="block text-sm font-medium mb-2">车辆价值（万元）</label>
              <input
                v-model.number="carValue"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入车辆价值"
                @input="calculatePremium"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">保额（万元）</label>
              <input
                v-model.number="coverage"
                type="number"
                step="1"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入保额"
                @input="calculatePremium"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">保险期限（年）</label>
              <select
                v-model.number="period"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                @change="calculatePremium"
              >
                <option value="1">1年</option>
                <option value="5">5年</option>
                <option value="10">10年</option>
                <option value="20">20年</option>
                <option value="30">30年</option>
                <option value="终身">终身</option>
              </select>
            </div>

            <div v-if="insuranceType !== 'property'">
              <label class="block text-sm font-medium mb-2">性别</label>
              <select
                v-model="gender"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                @change="calculatePremium"
              >
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 附加选项 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">附加选项</h3>
          <div class="space-y-4">
            <div v-if="insuranceType === 'health'">
              <label class="flex items-center">
                <input
                  v-model="includeCriticalIllness"
                  type="checkbox"
                  class="mr-2"
                  @change="calculatePremium"
                />
                <span class="text-sm">包含重疾险</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="includeAccident"
                  type="checkbox"
                  class="mr-2"
                  @change="calculatePremium"
                />
                <span class="text-sm">包含意外险</span>
              </label>
            </div>

            <div v-if="insuranceType === 'car'">
              <label class="flex items-center">
                <input
                  v-model="includeComprehensive"
                  type="checkbox"
                  class="mr-2"
                  @change="calculatePremium"
                />
                <span class="text-sm">包含商业险</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="includeTheft"
                  type="checkbox"
                  class="mr-2"
                  @change="calculatePremium"
                />
                <span class="text-sm">包含盗抢险</span>
              </label>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">免赔额（元）</label>
              <input
                v-model.number="deductible"
                type="number"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入免赔额"
                @input="calculatePremium"
              />
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="grid grid-cols-3 gap-2">
          <button
            @click="resetCalculator"
            class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg"
          >
            重置
          </button>
          <button
            @click="compareProducts"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            产品对比
          </button>
          <button
            @click="exportQuote"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            导出报价
          </button>
        </div>
      </div>

      <!-- 右侧：计算结果 -->
      <div class="space-y-6">
        <!-- 保费结果 -->
        <div v-if="premiumResult" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">保费计算结果</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-blue-50 rounded-lg">
                <div class="text-sm text-blue-600 mb-1">年保费</div>
                <div class="text-xl font-bold text-blue-800">
                  ¥{{ premiumResult.yearlyPremium.toFixed(2) }}
                </div>
              </div>
              <div class="p-3 bg-green-50 rounded-lg">
                <div class="text-sm text-green-600 mb-1">月保费</div>
                <div class="text-xl font-bold text-green-800">
                  ¥{{ premiumResult.monthlyPremium.toFixed(2) }}
                </div>
              </div>
            </div>

            <div v-if="period !== '终身'" class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-purple-50 rounded-lg">
                <div class="text-sm text-purple-600 mb-1">总保费</div>
                <div class="text-xl font-bold text-purple-800">
                  ¥{{ premiumResult.totalPremium.toFixed(2) }}
                </div>
              </div>
              <div class="p-3 bg-yellow-50 rounded-lg">
                <div class="text-sm text-yellow-600 mb-1">保障杠杆</div>
                <div class="text-xl font-bold text-yellow-800">
                  {{ premiumResult.leverageRatio.toFixed(1) }}倍
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 保费明细 -->
        <div v-if="premiumResult" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">保费构成</h3>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">基础保费：</span>
              <span class="font-medium">¥{{ premiumResult.basePremium.toFixed(2) }}</span>
            </div>
            <div v-if="premiumResult.additionalPremium > 0" class="flex justify-between text-sm">
              <span class="text-muted-foreground">附加险保费：</span>
              <span class="font-medium">¥{{ premiumResult.additionalPremium.toFixed(2) }}</span>
            </div>
            <div v-if="deductible > 0" class="flex justify-between text-sm">
              <span class="text-muted-foreground">免赔额优惠：</span>
              <span class="font-medium text-green-600">-¥{{ premiumResult.deductibleDiscount.toFixed(2) }}</span>
            </div>
            <div class="pt-3 border-t">
              <div class="flex justify-between font-medium">
                <span>最终保费：</span>
                <span>¥{{ premiumResult.finalPremium.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 产品推荐 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">产品推荐</h3>
          <div class="space-y-3">
            <div class="p-3 border rounded-lg">
              <div class="font-medium mb-1">经济型方案</div>
              <div class="text-sm text-muted-foreground">基础保障，保费较低</div>
              <div class="text-xs text-green-600 mt-1">适合预算有限的用户</div>
            </div>
            <div class="p-3 border rounded-lg">
              <div class="font-medium mb-1">标准型方案</div>
              <div class="text-sm text-muted-foreground">全面保障，性价比高</div>
              <div class="text-xs text-blue-600 mt-1">适合大多数用户需求</div>
            </div>
            <div class="p-3 border rounded-lg">
              <div class="font-medium mb-1">高端型方案</div>
              <div class="text-sm text-muted-foreground">高额保障，服务优质</div>
              <div class="text-xs text-purple-600 mt-1">适合高净值人群</div>
            </div>
          </div>
        </div>

        <!-- 保险建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">投保建议</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>建议年收入的5-10%用于保险支出</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>优先配置基础保障，再考虑理财型保险</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>定期评估保额需求，及时调整保障方案</span>
            </div>
            <div class="flex items-start gap-2">
              <AlertCircle class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>如实告知健康状况，避免理赔纠纷</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CheckCircle, AlertCircle } from 'lucide-vue-next'

// SEO设置
useSeoMeta({
  title: '保险费计算器 - 在线计算寿险、健康险、车险保费',
  description: '免费保险费计算器，支持计算寿险、健康险、车险、财产险等保险费用，提供产品对比和保费优化建议，帮助您选择合适的保险产品。专业的保险规划工具，支持多种保险类型计算和保障方案分析。',
  keywords: ['保险费计算器', '寿险计算', '健康险保费', '车险计算', '保险对比', '保费优化', '保险规划工具', '人身保险', '财产保险', '重疾险计算', '意外险计算', '保险理财', '保障方案'],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '保险费计算器',
    description: '免费的在线保险费用计算工具，支持寿险、健康险、车险、财产险等多种保险类型的保费计算和产品对比。',
    url: 'https://util.iskytrip.com/tools/insurance-premium-calculator',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    featureList: [
      '寿险保费计算',
      '健康险费用计算',
      '车险保费计算',
      '财产险费用计算',
      '保险产品对比',
      '保费优化建议',
      '保障杠杆计算'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: '保险购买者'
    }
  }
})

// 状态管理
const insuranceType = ref('life')
const age = ref(30)
const carValue = ref(20)
const coverage = ref(50)
const period = ref(20)
const gender = ref('male')
const includeCriticalIllness = ref(false)
const includeAccident = ref(false)
const includeComprehensive = ref(true)
const includeTheft = ref(false)
const deductible = ref(0)

const premiumResult = ref(null)

// 计算保费
const calculatePremium = () => {
  if (!coverage.value || coverage.value <= 0) return

  let basePremium = 0
  let additionalPremium = 0

  // 基础保费计算（简化模型）
  switch (insuranceType.value) {
    case 'life':
      basePremium = calculateLifePremium()
      if (includeCriticalIllness.value) {
        additionalPremium += basePremium * 0.3
      }
      break

    case 'health':
      basePremium = calculateHealthPremium()
      if (includeCriticalIllness.value) {
        additionalPremium += basePremium * 0.4
      }
      if (includeAccident.value) {
        additionalPremium += basePremium * 0.2
      }
      break

    case 'car':
      basePremium = calculateCarPremium()
      if (includeComprehensive.value) {
        additionalPremium += carValue.value * 10000 * 0.02
      }
      if (includeTheft.value) {
        additionalPremium += carValue.value * 10000 * 0.005
      }
      break

    case 'property':
      basePremium = coverage.value * 10000 * 0.001
      break
  }

  // 免赔额优惠
  let deductibleDiscount = 0
  if (deductible.value > 0) {
    deductibleDiscount = Math.min(basePremium * 0.2, deductible.value * 0.1)
  }

  const finalPremium = basePremium + additionalPremium - deductibleDiscount
  const monthlyPremium = finalPremium / 12

  // 计算总保费
  let totalPremium = 0
  let leverageRatio = 0

  if (period.value !== '终身') {
    totalPremium = finalPremium * period.value
    leverageRatio = (coverage.value * 10000) / finalPremium
  }

  premiumResult.value = {
    basePremium,
    additionalPremium,
    deductibleDiscount,
    finalPremium,
    yearlyPremium: finalPremium,
    monthlyPremium,
    totalPremium,
    leverageRatio
  }
}

// 计算寿险保费
const calculateLifePremium = () => {
  const baseRate = 0.002 // 基础费率
  const ageFactor = 1 + (age.value - 30) * 0.02 // 年龄因子
  const genderFactor = gender.value === 'male' ? 1.1 : 1.0 // 性别因子
  const periodFactor = period.value === '终身' ? 1.5 : 1 + period.value * 0.01

  return coverage.value * 10000 * baseRate * ageFactor * genderFactor * periodFactor
}

// 计算健康险保费
const calculateHealthPremium = () => {
  const baseRate = 0.003
  const ageFactor = 1 + (age.value - 30) * 0.03
  const genderFactor = gender.value === 'female' ? 1.05 : 1.0

  return coverage.value * 10000 * baseRate * ageFactor * genderFactor
}

// 计算车险保费
const calculateCarPremium = () => {
  // 交强险固定费用
  const compulsoryInsurance = 950
  // 商业险基础费率
  const commercialRate = 0.015

  return compulsoryInsurance + carValue.value * 10000 * commercialRate
}

// 重置计算器
const resetCalculator = () => {
  age.value = 30
  carValue.value = 20
  coverage.value = 50
  period.value = 20
  gender.value = 'male'
  includeCriticalIllness.value = false
  includeAccident.value = false
  includeComprehensive.value = true
  includeTheft.value = false
  deductible.value = 0
  premiumResult.value = null
}

// 产品对比
const compareProducts = () => {
  alert('产品对比功能开发中，将提供多家保险公司产品对比')
}

// 导出报价
const exportQuote = () => {
  if (!premiumResult.value) return

  const quote = `保险报价单
保险类型: ${getInsuranceTypeName(insuranceType.value)}
保额: ¥${coverage.value}万
保险期限: ${period.value}${period.value === '终身' ? '' : '年'}
被保险人: ${gender.value === 'male' ? '男' : '女'}${insuranceType !== 'car' ? age.value + '岁' : ''}

保费详情:
年保费: ¥${premiumResult.value.yearlyPremium.toFixed(2)}
月保费: ¥${premiumResult.value.monthlyPremium.toFixed(2)}
基础保费: ¥${premiumResult.value.basePremium.toFixed(2)}
附加险保费: ¥${premiumResult.value.additionalPremium.toFixed(2)}
免赔额优惠: ¥${premiumResult.value.deductibleDiscount.toFixed(2)}
最终保费: ¥${premiumResult.value.finalPremium.toFixed(2)}

生成时间: ${new Date().toLocaleDateString()}`

  navigator.clipboard.writeText(quote)
  alert('保险报价单已复制到剪贴板')
}

// 获取保险类型名称
const getInsuranceTypeName = (type) => {
  const names = {
    life: '寿险',
    health: '健康险',
    car: '车险',
    property: '财产险'
  }
  return names[type] || type
}

// 初始化计算
calculatePremium()
</script>

<style scoped>
input:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>