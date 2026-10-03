<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <User class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">身份证号校验解析器</h1>
          <p class="text-sm text-muted-foreground mt-1">校验位验证 + 省市/生日/属相/性别解析，15 位自动转 18 位</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入 15 或 18 位身份证号，按国家标准校验码算法（加权求和模 11）验证合法性，并解析省份、出生日期、生肖、性别与年龄。支持批量校验与脱敏显示，全部计算在浏览器本地完成，号码不上传任何服务器。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <FileText class="w-5 h-5 mr-2 text-primary" /> 输入号码
          </h2>

          <!-- 模式切换 -->
          <div class="grid grid-cols-2 gap-1.5">
            <button
              @click="mode = 'single'"
              :class="mode === 'single' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >单个校验</button>
            <button
              @click="mode = 'batch'"
              :class="mode === 'batch' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >批量校验</button>
          </div>

          <!-- 单个输入 -->
          <div v-if="mode === 'single'">
            <label class="block text-sm font-medium text-foreground mb-2">身份证号（15 或 18 位）</label>
            <input
              v-model="idInput"
              type="text"
              maxlength="18"
              placeholder="例如：110101199003077758"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              spellcheck="false"
            />
          </div>

          <!-- 批量输入 -->
          <div v-else>
            <label class="block text-sm font-medium text-foreground mb-2">批量输入（每行一个号码）</label>
            <textarea
              v-model="batchText"
              class="w-full h-40 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="每行一个身份证号，例如：&#10;110101199003077758&#10;44030119950101001X"
              spellcheck="false"
            ></textarea>
          </div>

          <!-- 脱敏开关 -->
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-foreground">脱敏显示（保留前 6 位与后 4 位）</span>
            <button
              type="button"
              @click="mask = !mask"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="mask ? 'bg-primary' : 'bg-muted'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="mask ? 'translate-x-6' : 'translate-x-1'"
              ></span>
            </button>
          </label>

          <!-- 隐私说明 -->
          <div class="bg-muted/50 rounded-lg p-3 flex items-start gap-2.5">
            <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p class="text-xs text-muted-foreground leading-relaxed">
              身份证号属于敏感个人信息。本工具的校验与解析全部在你的浏览器本地完成，输入的号码不会上传到任何服务器；如需截图或分享结果，建议开启脱敏显示。
            </p>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 校验规则说明
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 将前 17 位数字分别乘以权重 7 9 10 5 8 4 2 1 6 3 7 9 10 5 8 4 2 后求和</li>
            <li>• 对 11 取模，按映射 <span class="font-mono text-foreground">10X98765432</span> 得到第 18 位校验码</li>
            <li>• 第 1-2 位为省级代码，第 3-4 位为地市级代码（区县级码表未内置）</li>
            <li>• 第 17 位奇数为男性、偶数为女性；15 位号码按 19xx 出生补齐后转换</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：结果 -->
      <div class="bg-card border border-border rounded-lg">
        <div class="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" />
            {{ mode === 'single' ? '解析结果' : '批量校验结果' }}
          </h2>
          <button
            v-if="mode === 'batch' && batchResults.length > 0"
            @click="copyText(batchOutputText)"
            class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
          >
            <Copy class="w-3.5 h-3.5" /> 复制结果
          </button>
          <button
            v-else-if="mode === 'single' && singleResult.state === 'done'"
            @click="copySingleResult"
            class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
          >
            <Copy class="w-3.5 h-3.5" /> 复制解析
          </button>
        </div>

        <div class="p-6">
          <!-- 单个结果 -->
          <template v-if="mode === 'single'">
            <div v-if="singleResult.state === 'format'" class="py-12 text-center">
              <AlertTriangle class="w-10 h-10 mx-auto mb-3 text-destructive" />
              <p class="text-sm text-destructive font-medium mb-1">格式不正确</p>
              <p class="text-xs text-muted-foreground">请输入 15 位纯数字或 18 位（末位可为 X）的身份证号</p>
            </div>
            <div v-else-if="singleResult.state === 'empty'" class="py-16 text-center">
              <User class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">输入身份证号后，这里会显示校验与解析结果</p>
            </div>
            <div v-else>
              <!-- 状态横幅 -->
              <div class="rounded-lg p-4 mb-5 flex items-start gap-3" :class="singleResult.valid ? 'bg-primary/10' : 'bg-muted/50'">
                <CheckCircle v-if="singleResult.valid" class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <AlertTriangle v-else class="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-medium" :class="singleResult.valid ? 'text-primary' : 'text-destructive'">
                    {{ singleResult.valid ? '校验通过，号码格式合法' : '校验未通过' }}
                  </p>
                  <p v-if="!singleResult.valid" class="text-xs text-muted-foreground mt-0.5">{{ singleResult.reasons.join('；') }}</p>
                </div>
              </div>

              <div class="text-sm">
                <div class="flex items-center justify-between py-2.5 border-b border-border/50">
                  <span class="text-muted-foreground flex-shrink-0">转换后号码（18 位）</span>
                  <span class="font-mono text-foreground font-medium break-all text-right">
                    {{ mask ? maskId(singleResult.id18) : singleResult.id18 }}
                    <span v-if="singleResult.converted" class="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-sans">15 位已转换</span>
                  </span>
                </div>
                <div class="flex items-center justify-between py-2.5 border-b border-border/50">
                  <span class="text-muted-foreground">校验位（第 18 位）</span>
                  <span class="text-foreground font-medium">
                    实际 {{ singleResult.id18.slice(17) }} · 期望 {{ singleResult.expected }}
                    <span :class="singleResult.checkOk ? 'text-primary' : 'text-destructive'">（{{ singleResult.checkOk ? '通过' : '不符' }}）</span>
                  </span>
                </div>
                <div class="flex items-center justify-between py-2.5 border-b border-border/50">
                  <span class="text-muted-foreground">省份（第 1-2 位）</span>
                  <span class="text-foreground font-medium">
                    {{ singleResult.province ? singleResult.province + '（' + singleResult.provCode + '）' : '未知代码 ' + singleResult.provCode }}
                  </span>
                </div>
                <div class="flex items-center justify-between py-2.5 border-b border-border/50">
                  <span class="text-muted-foreground">城市/区县（第 3-4 位）</span>
                  <span class="text-foreground font-medium">代码 {{ singleResult.cityCode }} · 区县级码表未内置</span>
                </div>
                <div class="flex items-center justify-between py-2.5 border-b border-border/50">
                  <span class="text-muted-foreground">出生日期（第 7-14 位）</span>
                  <span class="text-foreground font-medium">
                    {{ singleResult.dateStr }}
                    <span :class="singleResult.birthValid ? 'text-muted-foreground' : 'text-destructive'">（{{ singleResult.birthValid ? '合法日期' : '日期非法' }}）</span>
                  </span>
                </div>
                <div class="flex items-center justify-between py-2.5 border-b border-border/50">
                  <span class="text-muted-foreground">属相生肖</span>
                  <span class="text-foreground font-medium">{{ singleResult.birthValid ? singleResult.zodiac : '—' }}</span>
                </div>
                <div class="flex items-center justify-between py-2.5 border-b border-border/50">
                  <span class="text-muted-foreground">性别（第 17 位奇男偶女）</span>
                  <span class="text-foreground font-medium">{{ singleResult.gender }}</span>
                </div>
                <div class="flex items-center justify-between py-2.5">
                  <span class="text-muted-foreground">年龄</span>
                  <span class="text-foreground font-medium">{{ singleResult.birthValid ? singleResult.age + ' 岁' : '—' }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- 批量结果 -->
          <template v-else>
            <div v-if="batchResults.length === 0" class="py-16 text-center">
              <List class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">在左侧每行输入一个身份证号，批量校验结果会显示在这里</p>
            </div>
            <div v-else>
              <p class="text-xs text-muted-foreground mb-3">
                共 {{ batchResults.length }} 条 · 有效 <span class="text-primary font-medium">{{ batchValidCount }}</span> · 无效 <span class="text-destructive font-medium">{{ batchInvalidCount }}</span>
              </p>
              <div class="max-h-[28rem] overflow-auto rounded-lg border border-border">
                <table class="w-full text-xs">
                  <thead class="bg-muted/50 text-muted-foreground sticky top-0">
                    <tr>
                      <th class="px-3 py-2 text-left font-medium whitespace-nowrap">号码（18 位）</th>
                      <th class="px-3 py-2 text-left font-medium whitespace-nowrap">结果</th>
                      <th class="px-3 py-2 text-left font-medium">说明</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border/50">
                    <tr v-for="(r, i) in batchResults" :key="i">
                      <td class="px-3 py-2 font-mono text-foreground whitespace-nowrap">{{ mask ? maskId(r.id18) : r.id18 }}</td>
                      <td class="px-3 py-2 whitespace-nowrap">
                        <span :class="r.ok ? 'text-primary font-medium' : 'text-destructive font-medium'">{{ r.ok ? '有效' : '无效' }}</span>
                      </td>
                      <td class="px-3 py-2 text-muted-foreground">{{ r.summary }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于身份证号校验解析器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            我国现行的 18 位居民身份证号由 17 位数字本体码与 1 位校验码组成：第 1-6 位是地址码（省、市、县），第 7-14 位是出生日期码，第 15-17 位是顺序码（第 17 位奇男偶女），第 18 位是根据 ISO 7064:1983 MOD 11-2 算法计算出的校验码。本工具完整实现了这套校验逻辑，可用于注册表单预检、数据清洗、录入核对等场景。
          </p>
          <h3 class="text-lg font-semibold text-foreground">校验码是怎么算出来的</h3>
          <p>
            将前 17 位数字分别乘以权重 7、9、10、5、8、4、2、1、6、3、7、9、10、5、8、4、2 后求和，除以 11 取余数，再按映射表「10X98765432」查出对应字符作为第 18 位。例如余数为 2 则校验码为 X。15 位老号码（1999 年前签发）缺少世纪位与校验码，本工具会自动补「19」并计算校验码转换为 18 位。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">号码合法代表真实存在吗？</span>不代表。校验通过仅说明编码格式正确，是否为真实发放的证件号取决于公安机关的签发记录。</li>
            <li><span class="text-foreground font-medium">为什么看不到区县信息？</span>区县级行政区划代码数量庞大且每年调整，本工具仅内置 34 个省级码表，第 3-4 位只显示地市级代码。</li>
            <li><span class="text-foreground font-medium">属相是怎么推算的？</span>按出生年份对 12 取模对应鼠、牛、虎、兔、龙、蛇、马、羊、猴、鸡、狗、猪，以农历年为界的精确属相可能因跨年日期存在误差。</li>
            <li><span class="text-foreground font-medium">数据会上传吗？</span>不会。校验、解析、批量处理全部在浏览器本地完成，刷新页面后输入即消失，请放心使用。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'id-card-validator'" :category="'text'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  User, FileText, CheckCircle, AlertTriangle, Info, Copy, List,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '身份证号校验解析器 - 身份证校验位验证与信息解析',
  description: '在线身份证号校验工具，按国标算法验证18位身份证校验位，解析省市、出生日期、属相生肖、性别与年龄，15位自动转18位，支持批量校验与脱敏显示，纯本地处理不上传',
  keywords: '身份证校验, 身份证号解析, 身份证校验位计算, 15位转18位, 身份证归属地查询, 属相推算, 身份证批量校验',
  author: 'Util工具箱',
  ogTitle: '身份证号校验解析器 - 有条工具',
  ogDescription: '校验身份证号合法性，解析省市/生日/属相/性别，纯本地处理不上传',
  ogUrl: 'https://www.util.cn/tools/id-card-validator',
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
          name: '身份证号校验解析器',
          url: 'https://www.util.cn/tools/id-card-validator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['校验位验证', '省市码表解析', '15位转18位', '属相性别年龄解析', '批量校验', '脱敏显示']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本工具', item: 'https://www.util.cn/text/' },
            { '@type': 'ListItem', position: 3, name: '身份证号校验解析器', item: 'https://www.util.cn/tools/id-card-validator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '身份证号校验通过就代表号码真实存在吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不代表。校验通过仅说明号码符合国家标准编码规则，是否真实发放需以公安机关记录为准。' }
            },
            {
              '@type': 'Question',
              name: '15 位身份证号可以校验吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以。工具会自动在出生年份前补 19 并计算校验码，转换为 18 位号码后再进行校验与解析。' }
            },
            {
              '@type': 'Question',
              name: '输入的身份证号会上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，所有校验与解析均在浏览器本地完成，号码不出设备，并提供脱敏显示。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'id-card-validator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const mode = ref('single')
const idInput = ref('')
const batchText = ref('')
const mask = ref(false)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 常量 ----------
const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
const CHECK_MAP = '10X98765432'
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
const PROVINCES = {
  11: '北京', 12: '天津', 13: '河北', 14: '山西', 15: '内蒙古',
  21: '辽宁', 22: '吉林', 23: '黑龙江',
  31: '上海', 32: '江苏', 33: '浙江', 34: '安徽', 35: '福建', 36: '江西', 37: '山东',
  41: '河南', 42: '湖北', 43: '湖南', 44: '广东', 45: '广西', 46: '海南',
  50: '重庆', 51: '四川', 52: '贵州', 53: '云南', 54: '西藏',
  61: '陕西', 62: '甘肃', 63: '青海', 64: '宁夏', 65: '新疆',
  71: '台湾', 81: '香港', 82: '澳门'
}

// ---------- 校验引擎 ----------
const computeCheckDigit = (id17) => {
  let sum = 0
  for (let i = 0; i < 17; i++) sum += Number(id17[i]) * WEIGHTS[i]
  return CHECK_MAP[sum % 11]
}

const to18 = (id15) => {
  if (!/^\d{15}$/.test(id15)) return null
  const base = id15.slice(0, 6) + '19' + id15.slice(6)
  return base + computeCheckDigit(base)
}

const parseId = (rawInput) => {
  const raw = String(rawInput || '').trim().toUpperCase().replace(/\s/g, '')
  if (!raw) return { state: 'empty' }

  let id18 = raw
  let converted = false
  if (/^\d{15}$/.test(raw)) {
    id18 = to18(raw)
    converted = true
  } else if (!/^\d{17}[\dX]$/.test(raw)) {
    return { state: 'format', raw }
  }

  const expected = computeCheckDigit(id18)
  const checkOk = id18[17] === expected

  const provCode = id18.slice(0, 2)
  const province = PROVINCES[provCode] || null
  const cityCode = id18.slice(2, 4)

  const y = Number(id18.slice(6, 10))
  const m = Number(id18.slice(10, 12))
  const d = Number(id18.slice(12, 14))
  const dateStr = id18.slice(6, 10) + '-' + id18.slice(10, 12) + '-' + id18.slice(12, 14)
  const dt = new Date(y, m - 1, d)
  const now = new Date()
  const birthValid = dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
    && y >= 1800 && y <= now.getFullYear()

  const gender = Number(id18[16]) % 2 === 1 ? '男' : '女'
  const zodiac = ZODIAC[((y - 4) % 12 + 12) % 12]
  let age = now.getFullYear() - y
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1
  if (age < 0) age = 0

  const reasons = []
  if (!checkOk) reasons.push('第 18 位校验码与计算值不符')
  if (!province) reasons.push('省份代码 ' + provCode + ' 不存在')
  if (!birthValid) reasons.push('出生日期 ' + dateStr + ' 非法')

  return {
    state: 'done', raw, id18, converted,
    checkOk, expected, province, provCode, cityCode,
    dateStr, birthValid, gender, age, zodiac,
    valid: checkOk && birthValid && !!province,
    reasons
  }
}

const maskId = (id18) => id18.slice(0, 6) + '********' + id18.slice(14)

// ---------- 结果 ----------
const singleResult = computed(() => parseId(idInput.value))

const batchResults = computed(() => {
  return batchText.value.split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const r = parseId(line)
      if (r.state === 'format') {
        return { id18: '—', ok: false, summary: '格式错误：请输入 15 位数字或 18 位（末位可为 X）' }
      }
      return {
        id18: r.id18,
        ok: r.valid,
        summary: r.valid
          ? r.gender + ' · ' + (r.province || '未知省份') + ' · ' + r.dateStr
          : r.reasons.join('；')
      }
    })
})

const batchValidCount = computed(() => batchResults.value.filter(r => r.ok).length)
const batchInvalidCount = computed(() => batchResults.value.length - batchValidCount.value)

const batchOutputText = computed(() => {
  return batchResults.value
    .map(r => (mask.value ? maskId(r.id18) : r.id18) + '\t' + (r.ok ? '有效' : '无效') + ' · ' + r.summary)
    .join('\n')
})

const singleOutputText = computed(() => {
  const r = singleResult.value
  if (r.state !== 'done') return ''
  return [
    '号码：' + (mask.value ? maskId(r.id18) : r.id18),
    '校验：' + (r.checkOk ? '通过' : '不符（期望 ' + r.expected + '）'),
    '省份：' + (r.province || '未知代码 ' + r.provCode),
    '城市/区县：代码 ' + r.cityCode + '（区县级码表未内置）',
    '出生日期：' + r.dateStr + (r.birthValid ? '' : '（非法）'),
    '属相：' + (r.birthValid ? r.zodiac : '—'),
    '性别：' + r.gender,
    '年龄：' + (r.birthValid ? r.age + ' 岁' : '—')
  ].join('\n')
})

// ---------- 复制（clipboard + execCommand 降级） ----------
const copyText = async (text) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制')
  } catch (err) {
    // 降级方案：使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制')
  }
}

const copySingleResult = () => copyText(singleOutputText.value)
</script>
