<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <Activity class="w-8 h-8 text-primary" />
        <h1 class="text-3xl font-bold text-foreground">宠物年龄换算器 - 狗猫年龄与人类年龄互转工具</h1>
      </div>
      <p class="text-muted-foreground">免费在线宠物年龄换算器，支持狗猫年龄与人类年龄双向换算。狗按体型（小型/中型/大型）分段计算，采用"首年 15 岁、次年 24 岁"的科学折算方式，比简单的"乘 7"更准确，并附 1-20 岁完整对照表。</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：宠物年龄 → 人类年龄 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">宠物年龄 → 人类年龄</h3>

          <!-- 宠物类型 -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-foreground">宠物类型</label>
            <div class="flex flex-wrap gap-2">
              <button
                @click="selectPetType('dog')"
                :class="[
                  'px-4 py-2 rounded-lg transition text-sm',
                  petType === 'dog'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                狗
              </button>
              <button
                @click="selectPetType('cat')"
                :class="[
                  'px-4 py-2 rounded-lg transition text-sm',
                  petType === 'cat'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                猫
              </button>
            </div>
          </div>

          <!-- 狗体型 -->
          <div v-if="petType === 'dog'" class="mb-4">
            <label class="block text-sm font-medium mb-2 text-foreground">狗体型</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="size in dogSizes"
                :key="size.key"
                @click="dogSize = size.key"
                :class="[
                  'px-4 py-2 rounded-lg transition text-sm',
                  dogSize === size.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                {{ size.label }}
              </button>
            </div>
          </div>

          <!-- 宠物年龄输入 -->
          <div>
            <label class="block text-sm font-medium mb-2 text-foreground">宠物年龄</label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="petYears"
                type="number"
                step="1"
                min="0"
                class="flex-1 px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="岁"
              >
              <span class="text-muted-foreground">岁</span>
              <input
                v-model.number="petMonths"
                type="number"
                step="1"
                min="0"
                max="11"
                class="flex-1 px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="月"
              >
              <span class="text-muted-foreground">个月</span>
            </div>
            <p class="text-xs text-muted-foreground mt-1">支持小数，如 2 岁半填 2 岁 6 个月</p>
          </div>

          <!-- 换算结果 -->
          <div v-if="petAge > 0" class="mt-6 p-6 bg-muted rounded-lg text-center">
            <p class="text-sm text-muted-foreground mb-1">相当于人类年龄</p>
            <p class="text-4xl font-bold text-green-600 dark:text-green-400">
              {{ humanAgeFromPet }} <span class="text-lg font-medium">岁</span>
            </p>
            <p class="text-sm text-muted-foreground mt-2">
              {{ typeLabel }}，宠物年龄 {{ petAgeText }}
            </p>
          </div>
          <div v-else class="mt-6 p-6 text-center text-muted-foreground bg-muted rounded-lg">
            请输入宠物年龄开始换算
          </div>
        </div>
      </div>

      <!-- 右侧：人类年龄 → 宠物年龄 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">人类年龄 → 宠物年龄</h3>

          <div>
            <label class="block text-sm font-medium mb-2 text-foreground">人类年龄（岁）</label>
            <input
              v-model.number="humanAgeInput"
              type="number"
              step="1"
              min="0"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="如 40"
            >
            <p class="text-xs text-muted-foreground mt-1">按左侧选择的宠物类型与体型反推</p>
          </div>

          <!-- 换算结果 -->
          <div v-if="humanAgeInput > 0" class="mt-6 p-6 bg-muted rounded-lg text-center">
            <p class="text-sm text-muted-foreground mb-1">相当于{{ typeLabel }}</p>
            <p class="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {{ petAgeFromHuman }}
            </p>
            <p class="text-sm text-muted-foreground mt-2">
              即约 {{ petAgeFromHumanDetail }}
            </p>
          </div>
          <div v-else class="mt-6 p-6 text-center text-muted-foreground bg-muted rounded-lg">
            请输入人类年龄开始换算
          </div>
        </div>
      </div>
    </div>

    <!-- 年龄对照表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold text-foreground mb-4">{{ typeLabel }}年龄对照表（1-20 岁）</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border text-muted-foreground">
              <th class="py-2 px-3 text-left">宠物年龄</th>
              <th class="py-2 px-3 text-left">相当于人类</th>
              <th class="py-2 px-3 text-left">生命阶段参考</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in ageTable"
              :key="row.petAge"
              class="border-b border-border/60 hover:bg-muted/50"
              :class="row.petAge === Math.floor(petAge) ? 'bg-primary/5 font-medium' : ''"
            >
              <td class="py-2 px-3 text-foreground">{{ row.petAge }} 岁</td>
              <td class="py-2 px-3 text-foreground">{{ row.humanAge }} 岁</td>
              <td class="py-2 px-3 text-muted-foreground">{{ row.stage }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <ChevronDown v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h3 class="text-xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是宠物年龄换算器？
        </h3>
        <p class="text-muted-foreground mb-4">
          宠物年龄换算器是一款免费的狗猫年龄与人类年龄双向换算工具。宠物衰老速度并不均匀：
          第一年发育极快（相当于人类 15 岁），第二年结束时约相当于 24 岁，此后才进入平稳的衰老节奏。
          本工具按这一规律分段折算，狗还细分为小型、中型、大型三种体型（体型越大衰老越快），比流传的"乘 7"算法更接近兽医界的共识。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h3>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择宠物类型：狗或猫</li>
          <li>若选择狗，进一步选择体型（小型 ≤10kg / 中型 10-25kg / 大型 >25kg）</li>
          <li>在"宠物年龄 → 人类年龄"中输入宠物年龄（岁 + 月），查看对应的人类年龄</li>
          <li>在"人类年龄 → 宠物年龄"中输入人类年龄，反推相当于宠物几岁</li>
          <li>查看下方 1-20 岁完整对照表与生命阶段参考</li>
        </ol>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          换算规则说明
        </h3>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>第 1 年</strong>: 宠物 1 岁时约相当于人类 15 岁（年内按月线性折算）</li>
          <li><strong>第 2 年</strong>: 第 2 年增长 9 岁，宠物 2 岁时约相当于人类 24 岁</li>
          <li><strong>2 岁以后</strong>: 每增加 1 岁，猫增加 4 岁人类年龄</li>
          <li><strong>狗按体型</strong>: 小型犬每岁 +4、中型犬每岁 +5、大型犬每岁 +6</li>
          <li><strong>反解</strong>: 人类年龄 → 宠物年龄按上述规则反向求解</li>
        </ul>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h3>
        <div class="space-y-4">
          <div v-for="(faq, index) in faqs" :key="index">
            <h4 class="text-base font-semibold text-foreground">{{ faq.q }}</h4>
            <p class="text-muted-foreground mt-1">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Activity, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { addRecentTool } from '~/composables/useTools'

// 添加到最近使用
addRecentTool('pet-age-calculator')

// 常见问题（与页面 SEO 区、JSON-LD FAQPage 保持一致）
const faqs = [
  {
    q: '"狗的一岁等于人七岁"准确吗？',
    a: '不准确。"乘 7"是按狗平均寿命约为人类 1/7 的粗略线性折算，忽略了宠物早期发育极快、后期放缓、且体型影响衰老速度的事实。更科学的分段算法是：第 1 年折 15 岁人龄、第 2 年折到 24 岁，之后每年按体型增加 4-6 岁。例如中型犬 5 岁约等于人类 39 岁，而"乘 7"只算 35 岁。'
  },
  {
    q: '为什么大型犬比小型犬老得快？',
    a: '研究普遍发现狗体型越大寿命越短：小型犬（≤10kg）常活到 14-16 岁，中型犬（10-25kg）约 12-14 岁，大型犬（>25kg）多在 10-12 岁左右。生长期短、生长速度快被认为与细胞氧化压力相关，因此本工具对大型犬采用每年 +6 岁的更快折算速度。'
  },
  {
    q: '猫的年龄怎么换算成人类年龄？',
    a: '猫的折算规律与狗类似但不分体型：1 岁约相当于人类 15 岁，2 岁约相当于 24 岁，之后每增加 1 岁加 4 岁人类年龄。例如猫 3 岁约等于人类 28 岁，10 岁约等于 56 岁。家猫寿命普遍可达 15-20 岁，20 岁的猫已相当于人类 96 岁。'
  }
]

// SEO配置
useSeoMeta({
  title: '宠物年龄换算器 - 狗猫年龄与人类年龄互转工具 | Util工具箱',
  description: '免费在线宠物年龄换算器，狗猫年龄与人类年龄双向换算。狗按体型分段、首年15岁次年24岁的科学算法，比乘7更准确，附1-20岁完整对照表。',
  keywords: '狗年龄计算器,狗年龄换算,猫年龄换算,宠物年龄,狗狗几岁,猫几岁,狗一岁等于人几岁',
  author: 'Util工具箱',
  ogTitle: '宠物年龄换算器 - 狗猫年龄与人类年龄互转工具',
  ogDescription: '狗猫年龄与人类年龄双向换算，按体型分段的科学算法，比"乘7"更准确。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '宠物年龄换算器',
  twitterDescription: '狗猫年龄与人类年龄双向换算，按体型分段的科学算法。'
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
            name: '宠物年龄换算器',
            description: '狗猫年龄与人类年龄双向换算，按体型分段的科学算法',
            url: 'https://www.util.cn/tools/pet-age-calculator',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '狗年龄换算',
              '猫年龄换算',
              '按体型分段',
              '人类年龄反解',
              '1-20岁对照表'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: '宠物年龄换算器',
                item: 'https://www.util.cn/tools/pet-age-calculator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: faqs.map(faq => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a
              }
            }))
          }
        ]
      })
    }
  ]
})

// 宠物类型与体型
type PetType = 'dog' | 'cat'
type DogSize = 'small' | 'medium' | 'large'

const dogSizes: { key: DogSize, label: string }[] = [
  { key: 'small', label: '小型 ≤10kg' },
  { key: 'medium', label: '中型 10-25kg' },
  { key: 'large', label: '大型 >25kg' }
]

const petType = ref<PetType>('dog')
const dogSize = ref<DogSize>('medium')

const selectPetType = (type: PetType) => {
  petType.value = type
}

// 2 岁后每宠物岁增加的人类岁数
const yearlyGain = computed(() => {
  if (petType.value === 'cat') return 4
  if (dogSize.value === 'small') return 4
  if (dogSize.value === 'medium') return 5
  return 6
})

const typeLabel = computed(() => {
  if (petType.value === 'cat') return '猫'
  const sizeLabel = dogSizes.find(s => s.key === dogSize.value)
  return sizeLabel ? `犬（${sizeLabel.label}）` : '犬'
})

// 宠物岁 → 人岁
const petToHuman = (age: number): number => {
  if (!isFinite(age) || age <= 0) return 0
  if (age <= 1) return age * 15
  if (age <= 2) return 15 + (age - 1) * 9
  return 24 + (age - 2) * yearlyGain.value
}

// 人岁 → 宠物岁（反解）
const humanToPet = (humanAge: number): number => {
  if (!isFinite(humanAge) || humanAge <= 0) return 0
  if (humanAge <= 15) return humanAge / 15
  if (humanAge <= 24) return 1 + (humanAge - 15) / 9
  return 2 + (humanAge - 24) / yearlyGain.value
}

// 左侧：宠物年龄输入
const petYears = ref<number>(5)
const petMonths = ref<number>(0)

const petAge = computed(() => {
  const y = petYears.value > 0 ? petYears.value : 0
  const m = petMonths.value > 0 ? petMonths.value : 0
  return y + m / 12
})

const humanAgeFromPet = computed(() => {
  if (petAge.value <= 0) return 0
  const value = petToHuman(petAge.value)
  return Math.round(value * 10) / 10
})

const petAgeText = computed(() => {
  const y = Math.floor(petAge.value)
  const m = Math.round((petAge.value - y) * 12)
  if (m === 0) return `${y} 岁`
  return `${y} 岁 ${m} 个月`
})

// 右侧：人类年龄输入
const humanAgeInput = ref<number>(39)

const petAgeFromHuman = computed(() => {
  if (!humanAgeInput.value || humanAgeInput.value <= 0) return '—'
  const value = humanToPet(humanAgeInput.value)
  return `${(Math.round(value * 10) / 10).toFixed(1)} 岁`
})

const petAgeFromHumanDetail = computed(() => {
  if (!humanAgeInput.value || humanAgeInput.value <= 0) return ''
  let years = Math.floor(petAgeFromHumanValue())
  let months = Math.round((petAgeFromHumanValue() - years) * 12)
  if (months >= 12) {
    years += 1
    months = 0
  }
  if (months === 0) return `${years} 岁`
  return `${years} 岁 ${months} 个月`
})

const petAgeFromHumanValue = (): number => {
  if (!humanAgeInput.value || humanAgeInput.value <= 0) return 0
  return humanToPet(humanAgeInput.value)
}

// 年龄对照表（1-20 岁）
const stageOf = (petAgeValue: number): string => {
  if (petAgeValue <= 1) return '幼年期'
  if (petAgeValue <= 2) return '少年期'
  if (petAgeValue <= 7) return '壮年期'
  if (petAgeValue <= 10) return '中年期'
  if (petAgeValue <= 14) return '中老年期'
  return '老年期'
}

const ageTable = computed(() => {
  const rows: { petAge: number, humanAge: number, stage: string }[] = []
  for (let age = 1; age <= 20; age++) {
    rows.push({
      petAge: age,
      humanAge: Math.round(petToHuman(age)),
      stage: stageOf(age)
    })
  }
  return rows
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
