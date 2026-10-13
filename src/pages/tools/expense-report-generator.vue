<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Receipt class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">报销单生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">填写费用明细生成规范报销单，金额大小写自动转换，浏览器直接打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        填写报销人、部门、事由与费用明细，右侧即时生成规范的费用报销单版式：明细表格、合计金额自动转换为人民币大写、
        留出公司抬头与签字审批栏。点击打印按钮即可通过浏览器打印或另存为 PDF，全部数据仅在本地处理，不上传服务器。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：表单 -->
      <div class="no-print bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <PenLine class="w-5 h-5 mr-2 text-primary" /> 填写报销信息
        </h2>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">报销人</label>
            <input
              v-model="reporter"
              type="text"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="姓名"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">部门</label>
            <input
              v-model="department"
              type="text"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 市场部"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">报销日期</label>
            <input
              v-model="reportDate"
              type="date"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">单据张数</label>
            <input
              v-model.number="receiptCount"
              type="number"
              min="0"
              step="1"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">报销事由</label>
          <input
            v-model="reason"
            type="text"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 10 月客户拜访差旅报销"
          />
        </div>

        <!-- 明细行 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-foreground">费用明细（{{ items.length }} 行）</label>
            <button
              @click="addItem"
              class="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition flex items-center gap-1"
            >
              <Plus class="w-3.5 h-3.5" /> 添加明细
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="(item, index) in items"
              :key="item.id"
              class="grid grid-cols-[96px_1fr_88px_auto] gap-2 items-center"
            >
              <select
                v-model="item.type"
                class="px-2 py-2 bg-background border border-input rounded-lg text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option v-for="t in expenseTypes" :key="t" :value="t">{{ t }}</option>
              </select>
              <input
                v-model="item.note"
                type="text"
                class="px-2 py-2 bg-background border border-input rounded-lg text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                :placeholder="`第 ${index + 1} 行备注，如 地铁通勤`"
              />
              <input
                v-model.number="item.amount"
                type="number"
                min="0"
                step="0.01"
                class="px-2 py-2 bg-background border border-input rounded-lg text-foreground text-xs text-right focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="金额"
              />
              <button
                @click="removeItem(index)"
                class="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                :disabled="items.length <= 1"
                aria-label="删除该明细行"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div class="bg-muted/50 rounded-lg p-3 text-sm flex items-center justify-between">
          <span class="text-muted-foreground">合计金额</span>
          <span class="font-bold text-primary">¥{{ fmt(total) }}</span>
        </div>
      </div>

      <!-- 右：报销单预览 -->
      <div class="print-area">
        <div class="no-print flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 报销单预览
          </h2>
          <button
            @click="printReport"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1.5"
          >
            <Printer class="w-4 h-4" /> 打印 / 另存 PDF
          </button>
        </div>

        <div class="bg-white text-black border border-gray-400 rounded-lg p-6 md:p-8 text-sm shadow-sm">
          <!-- 抬头（公司留空待填） -->
          <div class="flex items-end justify-between border-b-2 border-gray-800 pb-3 mb-4">
            <div>
              <p class="text-xs text-gray-500">公司名称（盖章处留空）：</p>
              <p class="text-xl font-bold tracking-widest mt-1">费 用 报 销 单</p>
            </div>
            <p class="text-xs text-gray-600">附单据：{{ receiptCount || 0 }} 张</p>
          </div>

          <!-- 基本信息 -->
          <div class="grid grid-cols-2 gap-y-2 gap-x-4 mb-4 text-[13px]">
            <p><span class="text-gray-500">报销人：</span><span class="border-b border-dotted border-gray-400 inline-block min-w-[110px] px-1">{{ reporter }}</span></p>
            <p><span class="text-gray-500">部门：</span><span class="border-b border-dotted border-gray-400 inline-block min-w-[110px] px-1">{{ department }}</span></p>
            <p><span class="text-gray-500">日期：</span><span class="px-1">{{ reportDate }}</span></p>
            <p><span class="text-gray-500">单据张数：</span><span class="px-1">{{ receiptCount || 0 }} 张</span></p>
            <p class="col-span-2"><span class="text-gray-500">报销事由：</span><span class="border-b border-dotted border-gray-400 inline-block min-w-[300px] px-1">{{ reason }}</span></p>
          </div>

          <!-- 明细表 -->
          <table class="w-full border-collapse text-[13px] mb-4">
            <thead>
              <tr class="bg-gray-100">
                <th class="border border-gray-400 px-2 py-1.5 w-12">序号</th>
                <th class="border border-gray-400 px-2 py-1.5 w-24">费用类型</th>
                <th class="border border-gray-400 px-2 py-1.5 text-left">事由 / 备注</th>
                <th class="border border-gray-400 px-2 py-1.5 w-28 text-right">金额（元）</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in items" :key="item.id">
                <td class="border border-gray-400 px-2 py-1.5 text-center">{{ index + 1 }}</td>
                <td class="border border-gray-400 px-2 py-1.5 text-center">{{ item.type }}</td>
                <td class="border border-gray-400 px-2 py-1.5">{{ item.note || '—' }}</td>
                <td class="border border-gray-400 px-2 py-1.5 text-right">{{ fmt(item.amount) }}</td>
              </tr>
              <tr v-if="items.length === 0">
                <td class="border border-gray-400 px-2 py-3 text-center text-gray-400" colspan="4">暂无明细</td>
              </tr>
              <tr class="font-bold">
                <td class="border border-gray-400 px-2 py-1.5 text-center" colspan="3">合计（小写）</td>
                <td class="border border-gray-400 px-2 py-1.5 text-right">¥{{ fmt(total) }}</td>
              </tr>
              <tr>
                <td class="border border-gray-400 px-2 py-1.5" colspan="4">
                  <span class="text-gray-500">合计金额（大写）：</span>
                  <span class="font-bold tracking-wider">人民币{{ rmbUpperText }}</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 签字栏 -->
          <div class="grid grid-cols-4 gap-2 text-[12px] text-gray-700 pt-2">
            <p>报销人签字：________</p>
            <p>部门审批：________</p>
            <p>财务审核：________</p>
            <p>领导审批：________</p>
          </div>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：打印时仅输出报销单据；公司抬头留空待手工填写，金额大写按人民币大写规范自动转换（含角分、"整"字处理）。
        </p>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于报销单</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            费用报销单是企业内部常用的财务凭证，需要完整载明报销人、部门、日期、事由、费用明细与合计金额，
            并由报销人与各级审批人签字。本工具生成的版式遵循常见财务规范：明细逐行列示、合计金额同时给出小写与大写、
            预留公司抬头与签批栏，打印后即可走线下审批流程。
          </p>
          <h3 class="text-lg font-semibold text-foreground">人民币大写的书写规范</h3>
          <p>
            金额大写使用壹、贰、叁、肆、伍、陆、柒、捌、玖、拾、佰、仟、万、亿、元、角、分、零、整等字，
            例如 1234.56 元写作"壹仟贰佰叁拾肆元伍角陆分"。规则要点：数字中间有零时写一个"零"（如 105 元写作壹佰零伍元）；
            末尾无角分时写"整"字（如 1000 元写作壹仟元整）；只有分没有角时先补"零"（如 10.05 元写作壹拾元零伍分）。
            大写金额可以防止篡改，是财务凭证的硬性要求。
          </p>
          <h3 class="text-lg font-semibold text-foreground">一张规范的报销单要包含哪些要素</h3>
          <p>
            常见要求包括：公司抬头或名称（便于区分报销主体）、报销人姓名与所属部门、报销日期、报销事由、
            逐行列示的费用明细（类型、金额、备注）、附单据张数、合计金额的小写与大写，以及报销人签字与部门、财务、领导审批栏。
            缺少大写金额或签字栏的报销单常会被财务退回重填。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">打印出来只有报销单吗？</span>是的，页面已对打印样式做了处理，打印或另存 PDF 时会隐藏表单与按钮，只输出报销单据本身。</li>
            <li><span class="text-foreground font-medium">数据会保存在服务器吗？</span>不会。所有填写内容仅存在于当前浏览器页面中，刷新后清空，适合涉及差旅与商务费用的敏感信息。</li>
            <li><span class="text-foreground font-medium">金额大写与公司财务要求不一致怎么办？</span>少数公司对"整""零"的处理有内部细则，生成后请对照本单位财务模板核对，必要时手工订正。</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'expense-report-generator'" :category="'file'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Receipt, PenLine, Printer, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '报销单生成器 - 费用报销单模板在线生成与打印',
  description: '在线报销单生成器，填写报销人、部门、事由与费用明细即时生成规范费用报销单，合计金额自动转人民币大写，浏览器直接打印或另存 PDF，纯本地处理不上传',
  keywords: '报销单生成, 费用报销单模板, 报销单打印, 大写金额转换, 人民币大写, 报销模板',
  author: 'Util工具箱',
  ogTitle: '报销单生成器 - 有条工具',
  ogDescription: '填写明细生成规范报销单，大小写金额自动转换，浏览器直接打印',
  ogUrl: 'https://www.util.cn/tools/expense-report-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '报销单生成器',
          url: 'https://www.util.cn/tools/expense-report-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['费用明细增删', '人民币大写自动转换', '规范报销单版式', '浏览器直接打印', '纯本地处理']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '报销单生成器', item: 'https://www.util.cn/tools/expense-report-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '打印出来只有报销单吗？',
              acceptedAnswer: { '@type': 'Answer', text: '是的，页面已对打印样式做了处理，打印或另存 PDF 时隐藏表单与按钮，只输出报销单据本身。' }
            },
            {
              '@type': 'Question',
              name: '数据会保存在服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有填写内容仅存在于当前浏览器页面中，刷新后清空，适合敏感费用信息。' }
            },
            {
              '@type': 'Question',
              name: '人民币大写规则是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '使用壹贰叁肆伍陆柒捌玖拾佰仟万亿，中间有零写一个零，末尾无角分写整，如 1234.56 元写作壹仟贰佰叁拾肆元伍角陆分。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'expense-report-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  if (!reportDate.value) {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    reportDate.value = `${d.getFullYear()}-${m}-${day}`
  }
})

// ---------- 状态 ----------
const expenseTypes = ['交通', '餐饮', '住宿', '办公', '通讯', '其他']
const reporter = ref('')
const department = ref('')
const reportDate = ref('')
const receiptCount = ref(1)
const reason = ref('')
const items = ref([{ id: 1, type: '交通', amount: 0, note: '' }])
let itemSeq = 1

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const fmt = (v) => (isFinite(v) ? (Number(v) || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00')

const addItem = () => {
  itemSeq += 1
  items.value.push({ id: itemSeq, type: '交通', amount: 0, note: '' })
}

const removeItem = (index) => {
  if (items.value.length <= 1) return
  items.value.splice(index, 1)
}

const total = computed(() => items.value.reduce((s, it) => s + (Number(it.amount) || 0), 0))

// ---------- 人民币大写转换 ----------
const CN_DIGITS = '零壹贰叁肆伍陆柒捌玖'
const CN_UNITS = ['', '拾', '佰', '仟']
const CN_GROUPS = ['', '万', '亿']

const intToCn = (n) => {
  if (n <= 0) return ''
  const s = String(n)
  const len = s.length
  let result = ''
  let zeroSeen = false
  for (let i = 0; i < len; i++) {
    const d = +s[i]
    const pos = len - 1 - i
    if (d === 0) {
      zeroSeen = true
    } else {
      if (zeroSeen && result) result += '零'
      result += CN_DIGITS[d] + CN_UNITS[pos % 4]
      zeroSeen = false
    }
    if (pos % 4 === 0) {
      const g = CN_GROUPS[pos / 4]
      const groupVal = Math.floor(n / Math.pow(10, pos)) % 10000
      if (g && groupVal > 0) result += g
    }
  }
  return result
}

const toRmbUpper = (amount) => {
  const num = Number(amount)
  if (!isFinite(num)) return '零元整'
  const fenTotal = Math.round(Math.abs(num) * 100)
  if (fenTotal === 0) return '零元整'
  const yuan = Math.floor(fenTotal / 100)
  const jiao = Math.floor(fenTotal / 10) % 10
  const fen = fenTotal % 10
  let out = num < 0 ? '负' : ''
  if (yuan > 0) out += intToCn(yuan) + '元'
  if (jiao === 0 && fen === 0) {
    out += '整'
  } else {
    if (yuan > 0 && jiao === 0) out += '零'
    if (jiao > 0) out += CN_DIGITS[jiao] + '角'
    if (fen > 0) out += CN_DIGITS[fen] + '分'
  }
  return out
}

const rmbUpperText = computed(() => toRmbUpper(total.value))

const printReport = () => {
  window.print()
}
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
}
</style>
