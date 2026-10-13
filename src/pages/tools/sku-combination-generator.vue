<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Package class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">SKU规格组合生成</h1>
          <p class="text-sm text-muted-foreground mt-1">颜色×尺码笛卡尔积出 SKU 表，填价导出直接上架</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入颜色、尺码等规格组，工具按组序做笛卡尔积生成全部 SKU 组合表格，逐行填写价格与库存（支持统一价格批量填充），
        一键导出带 UTF-8 BOM 的 CSV（Excel 打开中文不乱码）或复制 TSV 粘贴进电商后台。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 规格组管理 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Shapes class="w-5 h-5 mr-2 text-primary" /> 规格组
          </h2>
          <button
            @click="addGroup"
            :disabled="groups.length >= 6"
            class="text-sm text-primary hover:underline disabled:opacity-40 disabled:no-underline"
          >
            + 添加规格组
          </button>
        </div>

        <div class="space-y-3">
          <div v-for="(group, i) in groups" :key="i" class="bg-muted/40 rounded-lg p-3 space-y-2.5">
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground flex-shrink-0">组{{ i + 1 }}名称</span>
              <input
                v-model="group.name"
                type="text"
                maxlength="12"
                class="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="如：颜色"
              />
              <button
                @click="removeGroup(i)"
                :disabled="groups.length <= 1"
                class="text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:text-muted-foreground"
                aria-label="删除该规格组"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground flex-shrink-0">规格值</span>
              <input
                v-model="group.values"
                type="text"
                class="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="逗号分隔，如：红色,黑色"
              />
            </div>
          </div>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          至少需要两个有效规格组（名称与规格值不为空）才会生成组合；组合按组序固定排列，
          如「颜色 × 尺码」按 红-S、红-M、黑-S、黑-M 的顺序展开，与主流电商后台一致。
        </p>

        <!-- 批量填充 -->
        <div class="border-t border-border pt-4 space-y-3">
          <p class="text-sm font-medium text-foreground">批量填充</p>
          <div class="grid grid-cols-[1fr_auto] gap-2 items-center">
            <input v-model.number="batchPrice" type="number" min="0" step="0.01" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="统一价格（元）" />
            <button
              @click="applyBatchPrice"
              :disabled="rows.length === 0"
              class="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              统一价格
            </button>
          </div>
          <div class="grid grid-cols-[1fr_auto] gap-2 items-center">
            <input v-model.number="batchStock" type="number" min="0" step="1" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="统一库存（件）" />
            <button
              @click="applyBatchStock"
              :disabled="rows.length === 0"
              class="px-4 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              统一库存
            </button>
          </div>
        </div>
      </div>

      <!-- SKU 表格 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <TableProperties class="w-5 h-5 mr-2 text-primary" /> SKU 组合表（{{ rows.length }} 行）
          </h2>
          <div class="flex items-center gap-3">
            <button
              v-if="rows.length > 0"
              @click="copyTsv"
              class="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              复制 TSV
            </button>
            <button
              v-if="rows.length > 0"
              @click="exportCsv"
              class="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <Download class="w-3.5 h-3.5" /> 导出 CSV
            </button>
          </div>
        </div>

        <div v-if="invalidHint" class="p-6 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
          {{ invalidHint }}
        </div>

        <div v-else class="overflow-x-auto border border-border rounded-lg">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-muted/60">
                <th v-for="name in validGroupNames" :key="name" class="px-3 py-2.5 text-left font-medium text-foreground whitespace-nowrap">{{ name }}</th>
                <th class="px-3 py-2.5 text-left font-medium text-foreground whitespace-nowrap">价格（元）</th>
                <th class="px-3 py-2.5 text-left font-medium text-foreground whitespace-nowrap">库存（件）</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.key" class="border-t border-border/60">
                <td v-for="(v, vi) in row.values" :key="vi" class="px-3 py-2 text-foreground whitespace-nowrap">{{ v }}</td>
                <td class="px-2 py-1.5">
                  <input v-model.number="row.price" type="number" min="0" step="0.01" class="w-24 px-2 py-1.5 bg-background border border-input rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="0.00" />
                </td>
                <td class="px-2 py-1.5">
                  <input v-model.number="row.stock" type="number" min="0" step="1" class="w-24 px-2 py-1.5 bg-background border border-input rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="0" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="rows.length > 0" class="text-xs text-muted-foreground leading-relaxed">
          导出的 CSV 含 UTF-8 BOM 头，Excel 直接打开中文不乱码；复制 TSV 可直接粘贴到电商后台的批量 SKU 编辑框。
        </p>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 SKU 规格组合</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            SKU（Stock Keeping Unit）是商品的最小售卖单位：一件「红色 S 码」T恤就是一个 SKU。
            商家在后台按规格（颜色、尺码、口味等）上架时，需要把每个规格组的取值做笛卡尔积，
            得到全部组合并逐个定价、配库存。规格一多，手工排列既容易漏行又容易错位，批量生成表格是标准做法。
          </p>
          <h3 class="text-lg font-semibold text-foreground">组合是怎么展开的</h3>
          <p>
            按「颜色 × 尺码」两组各两个值为例：先固定颜色取「红」，尺码依次 S、M；再取「黑」，尺码依次 S、M，
            得到红-S、红-M、黑-S、黑-M 共 4 行，顺序与主流电商后台一致。三组及以上依此类推：
            组合总数等于各组规格值个数的乘积，例如 3 色 × 4 码 × 2 版型 = 24 个 SKU。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么导出要用 UTF-8 BOM</h3>
          <p>
            CSV 是纯文本格式，本身不声明编码；Excel 在 Windows 上默认按 GBK 解析不带 BOM 的文件，
            UTF-8 中文会显示乱码。文件头加入 UTF-8 BOM（三字节标记 EF BB BF）后，
            Excel 能正确识别编码，双击打开即正常显示中文。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">可以只用一个规格组吗？</span>工具要求至少两个有效规格组；单一规格（如只有颜色）时，可直接在电商后台单规格模式填写，无需生成表格。</li>
            <li><span class="text-foreground font-medium">改了规格值后已填的价格会丢吗？</span>不会。重新生成时按「规格值组合」匹配保留已填的价格与库存，只有变化的组合会被重置。</li>
            <li><span class="text-foreground font-medium">组合数有上限吗？</span>单次最多生成 5000 行以避免浏览器卡顿；超出时请精简规格值或分批生成，多数平台的 SKU 数量本身也有上限。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'sku-combination-generator'" :category="'file'" />

    <!-- 复制成功提示 -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0 translate-y-2"
        leave-active-class="transition duration-200"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div
          v-if="copyMsg"
          class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-foreground text-background text-sm shadow-lg"
        >
          {{ copyMsg }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Package, Shapes, TableProperties, Download, Trash2,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'SKU规格组合生成 - 颜色尺码笛卡尔积表格与CSV导出',
  description: '在线SKU规格组合生成器，颜色尺码等规格组笛卡尔积生成SKU表格，逐行填写价格库存并支持统一价格批量填充，导出UTF-8 BOM的CSV（Excel中文不乱码）或复制TSV，纯本地计算',
  keywords: 'sku组合生成, 规格组合, sku表格, 商品上架, 笛卡尔积, 规格sku批量',
  author: 'Util工具箱',
  ogTitle: 'SKU规格组合生成 - 有条工具',
  ogDescription: '颜色×尺码笛卡尔积出 SKU 表，填价导出直接上架',
  ogUrl: 'https://www.util.cn/tools/sku-combination-generator',
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
          name: 'SKU规格组合生成',
          url: 'https://www.util.cn/tools/sku-combination-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['规格组笛卡尔积组合', '逐行价格库存编辑', '统一价格批量填充', 'CSV导出含UTF-8 BOM', '复制TSV粘贴后台', '改规格保留已填价格']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'SKU规格组合生成', item: 'https://www.util.cn/tools/sku-combination-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '可以只用一个规格组吗？',
              acceptedAnswer: { '@type': 'Answer', text: '工具要求至少两个有效规格组，单一规格可直接在电商后台单规格模式填写。' }
            },
            {
              '@type': 'Question',
              name: '改了规格值后已填的价格会丢吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，重新生成时按规格值组合匹配保留已填价格与库存，仅变化的组合被重置。' }
            },
            {
              '@type': 'Question',
              name: '为什么导出CSV要带UTF-8 BOM？',
              acceptedAnswer: { '@type': 'Answer', text: 'Excel默认按GBK解析无BOM文件导致中文乱码，带BOM头可被正确识别为UTF-8。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'sku-combination-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 常量与状态 ----------
const MAX_ROWS = 5000
const groups = ref([
  { name: '颜色', values: '红色,黑色' },
  { name: '尺码', values: 'S,M' }
])
const batchPrice = ref(null)
const batchStock = ref(null)
const rows = ref([])
const truncated = ref(false)
const seoContentVisible = ref(true)
const copyMsg = ref('')

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 规格解析 ----------
const parseValues = (line) => String(line || '')
  .split(/[,，]/)
  .map(s => s.trim())
  .filter(Boolean)

const validGroups = computed(() => groups.value
  .map(g => ({ name: String(g.name || '').trim(), values: parseValues(g.values) }))
  .filter(g => g.name && g.values.length > 0))
const validGroupNames = computed(() => validGroups.value.map(g => g.name))

const addGroup = () => {
  if (groups.value.length < 6) groups.value.push({ name: '', values: '' })
}
const removeGroup = (i) => {
  if (groups.value.length > 1) groups.value.splice(i, 1)
}

const invalidHint = computed(() => {
  if (validGroups.value.length < 2) {
    return validGroups.value.length === 0
      ? '请至少填写两个规格组的名称与规格值'
      : '至少需要两个有效规格组（名称与规格值不为空）才能生成组合'
  }
  if (truncated.value) return '组合数已达 5000 行上限，仅输出前 5000 行，请精简规格值后分批生成'
  return ''
})

// ---------- 笛卡尔积生成（组序固定；改规格时按 key 保留已填价格库存） ----------
const buildRows = (specs, prevRows) => {
  const prevMap = new Map()
  for (const row of prevRows) prevMap.set(row.key, row)

  const out = []
  let hitCap = false
  const walk = (idx, parts) => {
    if (hitCap) return
    if (idx === specs.length) {
      const values = [...parts]
      const key = values.join('/')
      const prev = prevMap.get(key)
      out.push({ key, values, price: prev ? prev.price : null, stock: prev ? prev.stock : null })
      if (out.length >= MAX_ROWS) hitCap = true
      return
    }
    for (const v of specs[idx].values) {
      parts.push(v)
      walk(idx + 1, parts)
      parts.pop()
      if (hitCap) return
    }
  }
  walk(0, [])
  return { rows: out, hitCap }
}

watch(groups, () => {
  const result = buildRows(validGroups.value, rows.value)
  rows.value = result.rows
  truncated.value = result.hitCap
}, { deep: true })

// 初始生成（纯本地计算，SSR 安全）
rows.value = buildRows(validGroups.value, []).rows

// ---------- 批量填充 ----------
const applyBatchPrice = () => {
  if (batchPrice.value === null || batchPrice.value === '') return
  for (const row of rows.value) row.price = batchPrice.value
}
const applyBatchStock = () => {
  if (batchStock.value === null || batchStock.value === '') return
  for (const row of rows.value) row.stock = batchStock.value
}

// ---------- CSV / TSV（与 node 自测用例保持一致） ----------
const csvEscape = (v) => {
  const s = String(v === null || v === undefined ? '' : v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const buildCsv = (groupNames, rowList) => {
  const head = [...groupNames, '价格', '库存'].map(csvEscape).join(',')
  const lines = rowList.map(r => [...r.values, r.price === null ? '' : r.price, r.stock === null ? '' : r.stock].map(csvEscape).join(','))
  return '\uFEFF' + [head, ...lines].join('\r\n')
}

const buildTsv = (groupNames, rowList) => {
  const head = [...groupNames, '价格', '库存'].join('\t')
  const lines = rowList.map(r => [...r.values, r.price === null ? '' : r.price, r.stock === null ? '' : r.stock].join('\t'))
  return [head, ...lines].join('\n')
}

const exportCsv = () => {
  if (rows.value.length === 0) return
  const blob = new Blob([buildCsv(validGroupNames.value, rows.value)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sku-combinations.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const copyText = async (content, msg) => {
  try {
    await navigator.clipboard.writeText(content)
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = content
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
  copyMsg.value = msg
  setTimeout(() => { copyMsg.value = '' }, 1500)
}

const copyTsv = () => {
  if (rows.value.length === 0) return
  copyText(buildTsv(validGroupNames.value, rows.value), `已复制 ${rows.value.length} 行 TSV，可直接粘贴到后台`)
}
</script>
