<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">概率计算器</h1>
      <p class="text-muted-foreground mb-6">排列组合、概率分布、贝叶斯计算等概率统计工具</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：基础概率计算 -->
      <div class="space-y-6">
        <!-- 基础概率 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">基础概率</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">有利事件数</label>
                <input
                  v-model.number="basicProbability.favorable"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="3"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">总事件数</label>
                <input
                  v-model.number="basicProbability.total"
                  type="number"
                  min="1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="6"
                />
              </div>
            </div>

            <button @click="calculateBasicProbability" class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              计算概率
            </button>

            <div v-if="basicResult.isValid" class="p-3 bg-secondary rounded">
              <div class="text-sm font-medium">P(A) = {{ basicResult.probability }}</div>
              <div class="text-sm"> = {{ (basicResult.probability * 100).toFixed(2) }}%</div>
              <div class="text-sm"> = {{ basicResult.fraction }}</div>
            </div>
          </div>
        </div>

        <!-- 排列组合 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">排列组合</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">总数 n</label>
              <input
                v-model.number="permutation.n"
                type="number"
                min="0"
                class="w-full px-3 py-2 border rounded-lg"
                placeholder="5"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">选取数 r</label>
              <input
                v-model.number="permutation.r"
                type="number"
                min="0"
                class="w-full px-3 py-2 border rounded-lg"
                placeholder="3"
              />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button @click="calculatePermutation" class="px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                排列 P(n,r)
              </button>
              <button @click="calculateCombination" class="px-3 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/80">
                组合 C(n,r)
              </button>
            </div>

            <div v-if="permutationResult.isValid" class="p-3 bg-secondary rounded">
              <div class="text-sm font-medium">排列数: {{ permutationResult.value }}</div>
              <div class="text-xs text-muted-foreground">P({{ permutation.n }},{{ permutation.r }}) = {{ permutationResult.formula }}</div>
            </div>

            <div v-if="combinationResult.isValid" class="p-3 bg-secondary rounded">
              <div class="text-sm font-medium">组合数: {{ combinationResult.value }}</div>
              <div class="text-xs text-muted-foreground">C({{ combination.n }},{{ combination.r }}) = {{ combinationResult.formula }}</div>
            </div>
          </div>
        </div>

        <!-- 条件概率 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">条件概率</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">P(A)</label>
                <input
                  v-model.number="conditionalProbability.pA"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="0.6"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">P(B|A)</label>
                <input
                  v-model.number="conditionalProbability.pBGivenA"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="0.8"
                />
              </div>
            </div>

            <button @click="calculateConditionalProbability" class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              计算 P(A∩B) 和 P(B|A)
            </button>

            <div v-if="conditionalResult.isValid" class="space-y-2">
              <div class="p-3 bg-secondary rounded">
                <div class="text-sm">P(A∩B) = {{ conditionalResult.intersection }}</div>
                <div class="text-sm">P(B|A) = {{ conditionalResult.conditional }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：高级概率计算 -->
      <div class="space-y-6">
        <!-- 贝叶斯定理 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">贝叶斯定理</h3>
          <div class="space-y-4">
            <div class="text-sm text-muted-foreground mb-2">
              P(B|A) = P(A|B) × P(B) / P(A)
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">P(A|B)</label>
                <input
                  v-model.number="bayes.pAGivenB"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="0.9"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">P(B)</label>
                <input
                  v-model.number="bayes.pB"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="0.3"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">P(A)</label>
                <input
                  v-model.number="bayes.pA"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="0.4"
                />
              </div>
            </div>

            <button @click="calculateBayes" class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              计算 P(B|A)
            </button>

            <div v-if="bayesResult.isValid" class="p-3 bg-secondary rounded">
              <div class="text-sm font-medium">P(B|A) = {{ bayesResult.result }}</div>
              <div class="text-xs text-muted-foreground">= ({{ bayes.pAGivenB }} × {{ bayes.pB }}) / {{ bayes.pA }}</div>
            </div>
          </div>
        </div>

        <!-- 二项分布 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">二项分布</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">试验次数 n</label>
                <input
                  v-model.number="binomial.n"
                  type="number"
                  min="1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="10"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">成功概率 p</label>
                <input
                  v-model.number="binomial.p"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="0.5"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">成功次数 k</label>
                <input
                  v-model.number="binomial.k"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="5"
                />
              </div>
            </div>

            <button @click="calculateBinomial" class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              计算概率
            </button>

            <div v-if="binomialResult.isValid" class="space-y-2">
              <div class="p-3 bg-secondary rounded">
                <div class="text-sm font-medium">P(X = {{ binomial.k }}) = {{ binomialResult.probability }}</div>
                <div class="text-xs text-muted-foreground">期望值: {{ binomialResult.expected }}</div>
                <div class="text-xs text-muted-foreground">方差: {{ binomialResult.variance }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 正态分布 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">正态分布</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">均值 μ</label>
                <input
                  v-model.number="normal.mean"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="0"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">标准差 σ</label>
                <input
                  v-model.number="normal.stdDev"
                  type="number"
                  min="0.01"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="1"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">x 值</label>
              <input
                v-model.number="normal.x"
                type="number"
                step="0.01"
                class="w-full px-3 py-2 border rounded-lg"
                placeholder="1.96"
              />
            </div>

            <button @click="calculateNormal" class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              计算概率密度和累积概率
            </button>

            <div v-if="normalResult.isValid" class="p-3 bg-secondary rounded">
              <div class="text-sm">f(x) = {{ normalResult.density }}</div>
              <div class="text-sm">P(X ≤ x) = {{ normalResult.cumulative }}</div>
              <div class="text-sm">Z分数 = {{ normalResult.zScore }}</div>
            </div>
          </div>
        </div>

        <!-- 概率树 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">概率树示例</h3>
          <div class="space-y-4">
            <div class="p-4 bg-secondary rounded">
              <div class="text-sm font-medium mb-2">抛硬币两次</div>
              <div class="text-xs space-y-1">
                <div>• 第一次: 正面(0.5) / 反面(0.5)</div>
                <div>• 第二次: 正面(0.5) / 反面(0.5)</div>
                <div>• P(两次正面) = 0.5 × 0.5 = 0.25</div>
                <div>• P(一正一反) = 0.5 × 0.5 + 0.5 × 0.5 = 0.5</div>
              </div>
            </div>

            <button @click="generateProbabilityTree" class="w-full px-3 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/80">
              生成概率树
            </button>

            <div v-if="probabilityTree" class="p-3 bg-secondary rounded">
              <div class="text-sm font-mono">{{ probabilityTree }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('概率计算器')

// 基础概率
const basicProbability = ref({
  favorable: 3,
  total: 6
})

const basicResult = ref({
  isValid: false,
  probability: 0,
  fraction: ''
})

// 排列组合
const permutation = ref({
  n: 5,
  r: 3
})

const permutationResult = ref({
  isValid: false,
  value: 0,
  formula: ''
})

const combinationResult = ref({
  isValid: false,
  value: 0,
  formula: ''
})

// 条件概率
const conditionalProbability = ref({
  pA: 0.6,
  pBGivenA: 0.8
})

const conditionalResult = ref({
  isValid: false,
  intersection: 0,
  conditional: 0
})

// 贝叶斯
const bayes = ref({
  pAGivenB: 0.9,
  pB: 0.3,
  pA: 0.4
})

const bayesResult = ref({
  isValid: false,
  result: 0
})

// 二项分布
const binomial = ref({
  n: 10,
  p: 0.5,
  k: 5
})

const binomialResult = ref({
  isValid: false,
  probability: 0,
  expected: 0,
  variance: 0
})

// 正态分布
const normal = ref({
  mean: 0,
  stdDev: 1,
  x: 1.96
})

const normalResult = ref({
  isValid: false,
  density: 0,
  cumulative: 0,
  zScore: 0
})

// 概率树
const probabilityTree = ref('')

// 辅助函数
const factorial = (n) => {
  if (n < 0) return 0
  if (n === 0 || n === 1) return 1
  let result = 1
  for (let i = 2; i <= n; i++) {
    result *= i
  }
  return result
}

const combination = (n, r) => {
  if (r > n || r < 0) return 0
  return factorial(n) / (factorial(r) * factorial(n - r))
}

const gcd = (a, b) => {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b !== 0) {
    const temp = b
    b = a % b
    a = temp
  }
  return a
}

// 基础概率计算
const calculateBasicProbability = () => {
  const { favorable, total } = basicProbability.value

  if (total <= 0) {
    alert('总事件数必须大于0')
    return
  }

  if (favorable < 0) {
    alert('有利事件数不能为负')
    return
  }

  const probability = Math.min(favorable / total, 1)
  const divisor = gcd(favorable, total)

  basicResult.value = {
    isValid: true,
    probability: probability.toFixed(4),
    fraction: `${favorable / divisor} / ${total / divisor}`
  }
}

// 排列组合计算
const calculatePermutation = () => {
  const { n, r } = permutation.value

  if (r > n || n < 0 || r < 0) {
    alert('参数无效')
    return
  }

  let result
  if (r > n) {
    result = 0
  } else {
    result = factorial(n) / factorial(n - r)
  }

  permutationResult.value = {
    isValid: true,
    value: result.toLocaleString(),
    formula: `${n}! / ${n - r}!`
  }

  combinationResult.value.isValid = false
}

const calculateCombination = () => {
  const { n, r } = permutation.value

  if (r > n || n < 0 || r < 0) {
    alert('参数无效')
    return
  }

  const result = combination(n, r)

  combinationResult.value = {
    isValid: true,
    value: result.toLocaleString(),
    formula: `${n}! / (${r}! × ${n - r}!)`
  }

  permutationResult.value.isValid = false
}

// 条件概率
const calculateConditionalProbability = () => {
  const { pA, pBGivenA } = conditionalProbability.value

  const intersection = pA * pBGivenA

  conditionalResult.value = {
    isValid: true,
    intersection: intersection.toFixed(4),
    conditional: pBGivenA.toFixed(4)
  }
}

// 贝叶斯定理
const calculateBayes = () => {
  const { pAGivenB, pB, pA } = bayes.value

  if (pA === 0) {
    alert('P(A) 不能为零')
    return
  }

  const result = (pAGivenB * pB) / pA

  bayesResult.value = {
    isValid: true,
    result: result.toFixed(4)
  }
}

// 二项分布
const calculateBinomial = () => {
  const { n, p, k } = binomial.value

  if (k > n || n < 0 || p < 0 || p > 1 || k < 0) {
    alert('参数无效')
    return
  }

  // 二项概率公式: P(X=k) = C(n,k) × p^k × (1-p)^(n-k)
  const comb = combination(n, k)
  const probability = comb * Math.pow(p, k) * Math.pow(1 - p, n - k)

  const expected = n * p
  const variance = n * p * (1 - p)

  binomialResult.value = {
    isValid: true,
    probability: probability.toFixed(6),
    expected: expected.toFixed(4),
    variance: variance.toFixed(4)
  }
}

// 正态分布
const calculateNormal = () => {
  const { mean, stdDev, x } = normal.value

  if (stdDev <= 0) {
    alert('标准差必须大于0')
    return
  }

  // 概率密度函数
  const zScore = (x - mean) / stdDev
  const density = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * zScore * zScore)

  // 累积分布函数（近似）
  const cumulative = normalCDF(zScore)

  normalResult.value = {
    isValid: true,
    density: density.toFixed(6),
    cumulative: cumulative.toFixed(4),
    zScore: zScore.toFixed(4)
  }
}

// 标准正态累积分布函数近似
const normalCDF = (z) => {
  // 使用误差函数近似
  return 0.5 * (1 + erf(z / Math.sqrt(2)))
}

const erf = (x) => {
  // 误差函数近似
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x >= 0 ? 1 : -1
  x = Math.abs(x)

  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return sign * y
}

// 概率树生成
const generateProbabilityTree = () => {
  probabilityTree.value = `硬币抛掷概率树：

第一次抛掷:
├── 正面 (0.5)
│   ├── 第二次正面 (0.5) → HH: 0.25
│   └── 第二次反面 (0.5) → HT: 0.25
└── 反面 (0.5)
    ├── 第二次正面 (0.5) → TH: 0.25
    └── 第二次反面 (0.5) → TT: 0.25

总计概率: 1.0
验证: 0.25 + 0.25 + 0.25 + 0.25 = 1.0 ✓`
}
</script>

<style scoped>
input[type="number"] {
  transition: border-color 0.2s, box-shadow 0.2s;
}

input[type="number"]:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>