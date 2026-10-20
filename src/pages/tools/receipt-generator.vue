<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Receipt class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">收条收据生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">填交款人与金额自动生成规范收条，金额自动转中文大写，打印签字即用</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        租房押金、借款还款、货款尾款、个人收款都需要一张规范的收条。填写交款人、金额、收款事由、收款方式与日期，
        右侧即时生成标准收条版式：居中大标题「收条」、编号、「今收到……交来……」正文、人民币中文大写金额（防篡改）、
        「立此为据」结语、右下收款人签名处与日期。点击打印即可输出或另存 PDF，全部数据只留在当前浏览器，不上传服务器。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：表单 -->
      <div class="no-print bg-card border border-border rounded-lg p-6 space-y-4 h-fit">
        <h2 class="text-lg font-semibold flex items-center">
          <PenLine class="w-5 h-5 mr-2 text-primary" /> 填写收款信息
        </h2>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">交款人</label>
            <input
              v-model="payer"
              type="text"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 王小明"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">金额（元）</label>
            <input
              v-model.number="amount"
              type="number"
              min="0"
              step="0.01"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 5000"
            />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-foreground mb-2">收款事由</label>
            <input
              v-model="reason"
              type="text"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 2026年10月房屋租金 / 购货款尾款"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">收款方式</label>
            <select
              v-model="method"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">收款日期</label>
            <input
              v-model="dateText"
              type="date"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">收款人 / 单位</label>
            <input
              v-model="payee"
              type="text"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="签字人姓名或单位名称"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">收条编号</label>
            <div class="flex gap-2">
              <input
                v-model="serialNo"
                type="text"
                class="flex-1 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="留空自动生成"
              />
              <button
                @click="nextSerial"
                class="px-3 py-2 text-xs rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition shrink-0"
                title="编号自增"
              >
                +1 自增
              </button>
            </div>
          </div>
        </div>

        <div class="bg-muted/50 rounded-lg p-3 text-sm flex items-center justify-between">
          <span class="text-muted-foreground">大写金额</span>
          <span class="font-bold text-primary tracking-wider">{{ upperText }}</span>
        </div>

        <div class="flex flex-wrap gap-2 text-xs">
          <button
            v-for="preset in amountPresets"
            :key="preset"
            @click="amount = preset"
            class="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition"
          >
            ¥{{ preset.toLocaleString() }}
          </button>
        </div>
      </div>

      <!-- 右：收条预览 -->
      <div class="print-area">
        <div class="no-print flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 收条预览
          </h2>
          <button
            @click="printReceipt"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1.5"
          >
            <Printer class="w-4 h-4" /> 打印 / 另存 PDF
          </button>
        </div>

        <div class="bg-white text-black border border-gray-400 rounded-lg shadow-sm" style="font-family: 'SimSun', 'Songti SC', serif;">
          <!-- 边框内版式 -->
          <div class="p-8 md:p-10">
            <!-- 标题 -->
            <div class="text-center mb-6">
              <p class="text-3xl font-bold tracking-[0.6em]">收 条</p>
            </div>
            <div class="flex justify-end text-[13px] mb-4">
              <span>编号：{{ serialNo || autoSerial }}</span>
            </div>

            <!-- 正文 -->
            <div class="text-[17px] leading-[2.2]">
              <p>
                <span class="indent-block">今收到</span>
                <span class="fill-line">{{ payer || '　　　　　　' }}</span>
                <span>交来</span>
                <span class="fill-line">{{ reason || '　　　　　　　　　' }}</span>
              </p>
              <p>
                <span class="indent-block">人民币（大写）</span>
                <span class="fill-line font-bold">{{ upperText }}</span>
              </p>
              <p>
                <span class="indent-block">小写：￥{{ amountLowerText }}　　收款方式：{{ method }}</span>
              </p>
              <p class="mt-4 indent-block">特立此为据。</p>
            </div>

            <!-- 落款 -->
            <div class="mt-10 text-right text-[15px] leading-[2.4] pr-2">
              <p>收款人（签字/盖章）：<span class="inline-block min-w-[150px] border-b border-dotted border-gray-500 align-bottom">&nbsp;</span></p>
              <p class="text-[14px]">收款人/单位：{{ payee || '＿＿＿＿＿＿' }}</p>
              <p class="text-[14px]">{{ dateChinese }}</p>
            </div>
          </div>
          <!-- 存根 -->
          <div class="border-t-2 border-dashed border-gray-300 px-8 py-3 text-[11px] text-gray-500 flex justify-between">
            <span>存根：今收到{{ payer || '（交款人）' }}交来{{ reason || '（事由）' }}款项￥{{ amountLowerText }}</span>
            <span>No.{{ serialNo || autoSerial }}</span>
          </div>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：打印时仅输出收条本身；大写金额按人民币大写规范自动生成（含角分补「零」、整数结尾「整」）。
          收条为收款凭证，正式场合建议当面书写签名并按手印，本工具版式供规范参考。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>收条怎么写才有效力</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            一张规范的收条通常包含：居中「收条」标题、编号（便于存根核对）、正文写明「今收到 交款人 交来 事由 人民币（大写金额）」、
            注明收款方式、「特立此为据」结语、收款人手写签名（或盖章）与出具日期。要素齐全、语义无歧义的收条，
            在租金、借款、货款等民间往来中是最直接的收款凭证。
          </p>
          <h3 class="text-lg font-semibold text-foreground">金额为什么必须写中文大写</h3>
          <p>
            大写数字（壹贰叁肆伍陆柒捌玖拾佰仟万亿）笔画复杂、难以涂改，是财务凭证防篡改的通行做法。
            规范写法：1234.56 元写作「壹仟贰佰叁拾肆元伍角陆分」；整数无角分时以「整」收尾，如「壹仟元整」；
            元之下只有分时要先补零，如 10.05 元写作「壹拾元零伍分」；金额中间有零只写一个零，如 105 元写作「壹佰零伍元」。
            本工具自动生成大写并保留小写对照，两者不一致时以大写为准。
          </p>
          <h3 class="text-lg font-semibold text-foreground">收条与借条、收据有什么区别</h3>
          <p>
            收条证明「收到了对方交付的钱物」（多为还款、付租金、付货款等既有债务或交易），落款方是收款人；
            借条证明「向对方借了钱」，落款方是借款人；收据多见于经营性收款，通常由单位开具并可作为财税凭证。
            个人之间收到还款写收条即可，务必写清币种、金额、事由，避免「收到多少钱但不清楚为何收款」的歧义。
          </p>
          <h3 class="text-lg font-semibold text-foreground">出具收条的签字与保存细节</h3>
          <p>
            收条由收款人出具并交付款人持有，落款建议手写签名（个人按手印更佳、单位加盖公章），金额大小写不一致时以大写为准；
            分期收款或后续结清的，宜在事由中写明「其中」「尚欠」等字样防止歧义。多联开据时用本页「编号自增」保留连号，
            存根联与交付款人的正联一致，事后核对方便。拍照或扫描存档、保留转账记录与收条互为印证，凭证链更完整。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">打印出来只有收条吗？</span>是的，本页已做打印样式处理，打印或另存 PDF 时隐藏表单与按钮，只输出收条版式（含存根线）。</li>
            <li><span class="text-foreground font-medium">数据会保存在服务器吗？</span>不会。所有内容只存在于当前浏览器页面中，刷新即清空，不上传任何信息。</li>
            <li><span class="text-foreground font-medium">编号怎么自增？</span>留空时按日期自动生成（如 QT-20261020-001）；手动填写后点「+1 自增」按钮即可顺延尾号，连续开收条很方便。</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'receipt-generator'" :category="'file'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Receipt, PenLine, Printer, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '收条收据生成器 - 规范收条模板在线生成与打印',
  description: '在线收条生成器：填写交款人、金额、事由、收款方式即时生成规范收条，金额自动转中文大写防篡改，含编号自增与存根版式，浏览器直接打印或另存PDF，纯本地处理',
  keywords: '收条怎么写, 收据生成器, 收款收条模板, 金额大写转换, 租金收条, 收条打印',
  author: 'Util工具箱',
  ogTitle: '收条收据生成器 - 有条工具',
  ogDescription: '填交款人与金额自动生成规范收条，大小写金额自动转换，打印签字即用',
  ogUrl: 'https://www.util.cn/tools/receipt-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '收条收据生成器',
          url: 'https://www.util.cn/tools/receipt-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['规范收条版式', '金额中文大写自动转换', '编号自动生成与自增', '收款方式选择', '浏览器直接打印', '纯本地处理']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '收条收据生成器', item: 'https://www.util.cn/tools/receipt-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '打印出来只有收条吗？',
              acceptedAnswer: { '@type': 'Answer', text: '是的，页面已处理打印样式，打印或另存PDF时隐藏表单与按钮，只输出收条版式（含存根线）。' }
            },
            {
              '@type': 'Question',
              name: '数据会保存在服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有内容只存在于当前浏览器页面中，刷新即清空，不上传任何信息。' }
            },
            {
              '@type': 'Question',
              name: '金额大写规则是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '使用壹贰叁肆伍陆柒捌玖拾佰仟万亿；中间有零写一个零（105元→壹佰零伍元），无角分写整（1000元→壹仟元整），只有分先补零（10.05元→壹拾元零伍分）。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'receipt-generator')

/* ===== PURE-BEGIN ===== */
// 人民币金额转中文大写（与站内报销工具同源规则，本页自带一份纯实现）
const CN_DIGITS = '零壹贰叁肆伍陆柒捌玖'
const CN_UNITS = ['', '拾', '佰', '仟']
const CN_GROUPS = ['', '万', '亿']

function intToCn(n) {
  if (n <= 0) return ''
  const s = String(n)
  const len = s.length
  let result = ''
  let zeroSeen = false
  for (let i = 0; i < len; i++) {
    const d = Number(s[i])
    const pos = len - 1 - i
    if (d === 0) {
      zeroSeen = true
    } else {
      if (zeroSeen && result !== '') result += '零'
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

function toChineseAmount(amount) {
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

// 金额小写文本（两位小数）
function lowerAmount(amount) {
  const num = Number(amount)
  if (!isFinite(num)) return '0.00'
  return num.toFixed(2)
}

// 日期转中文大写（收条常用：贰零贰陆年壹拾月贰拾日）
function chineseDate(y, m, d) {
  const CN = '零壹贰叁肆伍陆柒捌玖'
  const yearStr = String(y).split('').map(ch => CN[Number(ch)]).join('')
  const numCn = (n) => {
    if (n < 10) return CN[n]
    if (n === 10) return '壹拾'
    if (n < 20) return '壹拾' + CN[n - 10]
    if (n === 20) return '贰拾'
    if (n < 30) return '贰拾' + CN[n - 20]
    return '叁拾'
  }
  return `${yearStr}年${numCn(m)}月${numCn(d)}日`
}

// 编号自增：解析尾部数字+1，无尾数字则追加 -002
function bumpSerial(no) {
  const s = String(no || '').trim()
  const m = s.match(/^(.*?)(\d+)\s*$/)
  if (!m) return s === '' ? '' : s + '-002'
  const numStr = m[2]
  const inc = String(Number(numStr) + 1).padStart(numStr.length, '0')
  return m[1] + inc
}
/* ===== PURE-END ===== */

// ---------- 状态 ----------
const methods = ['现金', '银行转账', '微信', '支付宝']
const amountPresets = [1000, 5000, 10000, 20000]

const payer = ref('')
const amount = ref(0)
const reason = ref('')
const method = ref('现金')
const payee = ref('')
const serialNo = ref('')
const dateText = ref('')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const upperText = computed(() => toChineseAmount(amount.value))
const amountLowerText = computed(() => lowerAmount(amount.value))

const dateParts = computed(() => {
  const m = String(dateText.value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) }
})

const dateChinese = computed(() => {
  const dp = dateParts.value
  if (!dp) return '　　　　年　　月　　日'
  return chineseDate(dp.y, dp.m, dp.d)
})

const autoSerial = computed(() => {
  const dp = dateParts.value
  if (!dp) return 'QT--------'
  return `QT-${dp.y}${String(dp.m).padStart(2, '0')}${String(dp.d).padStart(2, '0')}-001`
})

const nextSerial = () => {
  const cur = String(serialNo.value || '').trim()
  if (cur === '') {
    serialNo.value = autoSerial.value
  } else {
    serialNo.value = bumpSerial(cur)
  }
}

const printReceipt = () => {
  window.print()
}

onMounted(() => {
  if (tool) addRecentTool(tool.id)
  if (!dateText.value) {
    const d = new Date()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    dateText.value = `${d.getFullYear()}-${mm}-${dd}`
  }
})
</script>

<style scoped>
.indent-block {
  text-indent: 2em;
  display: inline-block;
}
.fill-line {
  border-bottom: 1px solid #666;
  padding: 0 0.5em;
  min-width: 4em;
  display: inline-block;
  text-align: center;
}
@media print {
  .no-print {
    display: none !important;
  }
  .print-area {
    box-shadow: none;
  }
  .bg-white {
    border: none !important;
    box-shadow: none !important;
  }
}
</style>
