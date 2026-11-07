<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ReceiptText class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">开票信息卡生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">录入公司开票资料生成规范抬头卡，税号按 GB 32100-2015 校验，可复制 / 出二维码 / 打印成名片卡</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        填写公司全称、统一社会信用代码、地址电话与开户行账号，右侧生成规范分区的开票信息卡：一键复制全部、
        分字段复制（抬头一行式「公司名 + 税号」最常用），还可生成文本二维码（对方扫码即得完整开票信息），
        或按名片尺寸打印成卡随身携带。税号实时按国家标准 GB 32100-2015 校验位算法验证，录入错误当场提示。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：录入表单 -->
      <div class="no-print bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <IdCard class="w-5 h-5 mr-2 text-primary" /> 开票信息录入
        </h2>

        <div>
          <label for="inv-company" class="block text-sm font-medium text-foreground mb-1">公司全称 <span class="text-red-500">*</span></label>
          <input
            id="inv-company"
            v-model="company"
            type="text"
            maxlength="60"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="与营业执照一致的全称，如 北京某某科技有限公司"
          />
        </div>

        <div>
          <label for="inv-taxno" class="block text-sm font-medium text-foreground mb-1">统一社会信用代码（纳税人识别号）<span class="text-red-500">*</span></label>
          <input
            id="inv-taxno"
            v-model="taxNo"
            type="text"
            maxlength="18"
            spellcheck="false"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-ring uppercase"
            placeholder="18 位，如 91440300708461136T"
          />
          <p
            v-if="taxCheck"
            class="mt-2 text-xs leading-relaxed p-2.5 rounded border flex items-start gap-1.5"
            :class="taxCheck.ok ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'"
          >
            <CheckCircle v-if="taxCheck.ok" class="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <TriangleAlert v-else class="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{{ taxCheck.hint }}</span>
          </p>
          <p v-else class="mt-2 text-xs text-muted-foreground">
            18 位（数字或大写字母，不含 I/O/S/V/Z），本工具按 GB 32100-2015《法人和其他组织统一社会信用代码编码规则》做校验位验证。
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="inv-address" class="block text-sm font-medium text-foreground mb-1">注册地址</label>
            <input
              id="inv-address"
              v-model="address"
              type="text"
              maxlength="80"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="营业执照上的注册地址"
            />
          </div>
          <div>
            <label for="inv-phone" class="block text-sm font-medium text-foreground mb-1">联系电话</label>
            <input
              id="inv-phone"
              v-model="phone"
              type="text"
              maxlength="30"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 010-8888 6666"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="inv-bank" class="block text-sm font-medium text-foreground mb-1">开户银行</label>
            <input
              id="inv-bank"
              v-model="bank"
              type="text"
              maxlength="60"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="开户行全称，如 中国工商银行北京分行"
            />
          </div>
          <div>
            <label for="inv-account" class="block text-sm font-medium text-foreground mb-1">银行账号</label>
            <input
              id="inv-account"
              v-model="account"
              type="text"
              maxlength="30"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="对公账户账号"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">开票类型</label>
          <div class="flex gap-1.5">
            <button
              v-for="t in INVOICE_TYPES"
              :key="t.id"
              type="button"
              @click="invoiceType = t.id"
              :class="invoiceType === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
            >{{ t.label }}</button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">
            专票要求五要素齐全且信息与营业执照一致；普票给个人抬头时通常只需名称即可开具。
          </p>
        </div>
      </div>

      <!-- 右侧：开票卡预览 + 二维码 -->
      <div class="space-y-4">
        <!-- 模式切换 -->
        <div class="no-print flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Eye class="w-5 h-5 mr-2 text-primary" /> 开票信息卡
          </h2>
          <button
            type="button"
            @click="qrMode = !qrMode"
            :class="qrMode ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <QrCode class="w-4 h-4" /> {{ qrMode ? '关闭二维码' : '二维码模式' }}
          </button>
        </div>

        <!-- 名片尺寸卡面 -->
        <div class="overflow-auto card-scroll">
          <div class="inv-card">
            <p class="inv-company">{{ company || '（公司全称）' }}</p>
            <p class="inv-taxno">{{ taxNoNormalized || '（统一社会信用代码）' }}</p>
            <div class="inv-divider"></div>
            <p class="inv-line">地址：{{ address || '____' }}</p>
            <p class="inv-line">电话：{{ phone || '____' }}</p>
            <p class="inv-line">开户行：{{ bank || '____' }}</p>
            <p class="inv-line">账　号：{{ account || '____' }}</p>
            <p class="inv-type">{{ invoiceTypeLabel }}</p>
          </div>
        </div>

        <!-- 二维码 -->
        <div v-if="qrMode" class="no-print bg-muted/50 rounded-xl p-4 flex items-start gap-4">
          <img
            v-if="qrDataUrl"
            :src="qrDataUrl"
            alt="开票信息二维码"
            class="w-32 h-32 rounded-lg border border-border bg-white shrink-0"
          />
          <div v-else class="w-32 h-32 rounded-lg border border-dashed border-border flex items-center justify-center shrink-0">
            <QrCode class="w-8 h-8 text-muted-foreground/40" />
          </div>
          <div class="text-sm leading-relaxed">
            <p class="font-medium text-foreground mb-1">文本二维码</p>
            <p class="text-muted-foreground text-xs mb-1">
              二维码内容为左侧卡片全部信息的纯文本，对方微信 / 相机扫码即可读出完整开票信息，无需逐字誊抄。
            </p>
            <p v-if="qrError" class="text-red-500 text-xs">{{ qrError }}</p>
            <p v-else-if="!qrDataUrl" class="text-muted-foreground/70 text-xs">填写公司全称后自动生成。</p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="no-print flex flex-wrap gap-2">
          <button
            type="button"
            @click="copyAll"
            class="flex-1 min-w-[140px] px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
          >
            <Copy class="w-4 h-4" /> 一键复制全部
          </button>
          <button
            type="button"
            @click="copyOneLine"
            class="flex-1 min-w-[140px] px-4 py-2.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition flex items-center justify-center gap-1.5"
          >
            <Copy class="w-4 h-4" /> 复制抬头一行式
          </button>
          <button
            type="button"
            @click="copyTaxNo"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-muted-foreground transition flex items-center justify-center gap-1.5"
          >
            <Copy class="w-4 h-4" /> 只复制税号
          </button>
          <button
            type="button"
            @click="printCard"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-muted-foreground transition flex items-center justify-center gap-1.5"
          >
            <Printer class="w-4 h-4" /> 打印成卡
          </button>
        </div>
        <p class="no-print text-xs text-muted-foreground">
          「抬头一行式」即「公司全称（税号）」，是发给对方开票时最常用的格式；打印输出为标准名片尺寸（90mm × 54mm），可打印后沿边裁切随身携带。
        </p>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="group bg-card border border-border rounded-lg p-6 mb-12 no-print" open>
      <summary class="text-2xl font-bold text-foreground cursor-pointer list-none flex items-center justify-between">
        <span><span class="text-primary mr-2">#</span>关于开票信息</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div class="space-y-4 text-sm text-muted-foreground leading-relaxed mt-4">
        <p>
          开票信息卡（俗称「开票资料」「发票抬头卡」）是企业对外提供的一张标准化资料，供对方财务在开票时照抄录入。
          信息给错轻则发票冲红重开，重则影响报销与抵扣，本工具按标准分区生成信息卡，支持复制、二维码与名片尺寸打印。
          <span class="text-foreground font-medium">本工具仅做格式整理与校验，不连接税务系统，正式开票请以营业执照与税务机关口径为准。</span>
        </p>

        <h3 class="text-lg font-semibold text-foreground">统一社会信用代码的结构（GB 32100-2015）</h3>
        <p>
          统一社会信用代码共 18 位，依据国家标准 GB 32100-2015《法人和其他组织统一社会信用代码编码规则》编制，
          同时是其纳税人识别号。18 位的构成是：
        </p>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">第 1 位：登记管理部门代码</span>——如 1 机构编制、5 民政、9 工商（市场监管）、Y 其他；</li>
          <li><span class="text-foreground font-medium">第 2 位：机构类别代码</span>——如 1 企业、2 个体、3 农民专业合作社、9 其他；</li>
          <li><span class="text-foreground font-medium">第 3–8 位：登记管理机关行政区划码</span>——6 位数字，对应发证机关辖区；</li>
          <li><span class="text-foreground font-medium">第 9–17 位：主体标识码（组织机构代码）</span>——9 位，含 1 位组织机构校验位；</li>
          <li><span class="text-foreground font-medium">第 18 位：校验位</span>——按标准给出的 31 字符集与权重因子做模 31 运算得出。</li>
        </ul>
        <p>
          校验位算法要点：字符集为 31 个字符「0-9 + A-HJKLMNPQRTUWXY」（不含 I、O、S、V、Z），前 17 位分别乘以权重因子
          1、3、9、27、19、26、16、17、20、29、25、13、8、24、10、30、28 后求和取模 31，再由 31 减去余数得到校验值。
          本工具内置该算法实时校验，录入错一位都会提示。
        </p>

        <h3 class="text-lg font-semibold text-foreground">开票五要素</h3>
        <p>
          开具增值税专用发票时，购买方信息需五要素齐全且与营业执照一致：<span class="text-foreground font-medium">公司名称、纳税人识别号、注册地址、联系电话、开户银行及账号</span>。
          增值税普通发票要求较宽，个人抬头通常只需名称即可；给单位开普票时仍建议提供全称与税号。
          给对方提供开票资料时，最好整卡复制而非分段口述，避免地址电话被漏抄。
        </p>

        <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-foreground">税号 18 位里为什么没有 I、O、Z 这些字母？</h4>
            <p class="mt-1">为避免与数字 1、0、2 等混淆，标准字符集剔除了 I、O、S、V、Z 五个易混字母。如果你录入的代码里出现这些字母，一定是错的。</p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">校验位对了就代表公司真实存在吗？</h4>
            <p class="mt-1">校验位只验证「编码本身没有抄错」，不能验证主体真实性与经营状态。核对主体请以营业执照原件或全国统一社会信用代码公示平台的查询结果为准。</p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">地址电话必须写注册地址吗？</h4>
            <p class="mt-1">专票按规范应填写营业执照上的注册地址与注册电话；实际经营地址不同时，建议同时向开票方说明送达信息，避免发票寄送出错。</p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">要核对条码类信息怎么办？</h4>
            <p class="mt-1">涉及商品条码、物流码等一维码场景，可配合站内 <a href="/tools/barcode-generator/" class="text-primary hover:underline">条形码生成器</a> 使用；本页二维码为文本二维码，扫码即得开票文本。</p>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground">参考来源</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>GB 32100-2015《法人和其他组织统一社会信用代码编码规则》（国家标准全文公开系统）：18 位结构、31 字符集与权重因子、模 31 校验位算法。</li>
          <li>开票五要素：增值税发票开具的通行要求，具体以税务机关最新口径为准。</li>
        </ul>
        <p class="text-xs">填写内容仅在浏览器本地处理与显示，不上传任何数据。</p>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :current-tool-id="'invoice-info-card'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  ReceiptText, IdCard, Eye, QrCode, Copy, Printer, CheckCircle, TriangleAlert, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '开票信息卡生成器 - 发票抬头卡在线生成/税号校验/二维码/名片打印',
  description: '在线开票信息卡生成器：填写公司全称、统一社会信用代码、地址电话与开户行账号，按标准分区生成发票抬头卡，税号按 GB 32100-2015 校验位算法实时验证，支持一键复制全部、抬头一行式复制、文本二维码与名片尺寸打印',
  keywords: '开票信息卡, 发票抬头模板, 统一社会信用代码校验, 税号校验, 开票资料, 公司开票信息, 纳税人识别号',
  author: '有条工具',
  ogTitle: '开票信息卡生成器 - 规范抬头卡一键生成 | 有条工具',
  ogDescription: '分区开票卡 + GB 32100-2015 税号校验 + 文本二维码 + 名片尺寸打印',
  ogUrl: 'https://www.util.cn/tools/invoice-info-card',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '开票信息卡生成器',
  twitterDescription: '开票资料分区成卡，税号实时校验，可复制、可扫码、可打印'
})

// JSON-LD 结构化数据（SoftwareApplication + BreadcrumbList + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '开票信息卡生成器',
          url: 'https://www.util.cn/tools/invoice-info-card',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '标准分区开票信息卡生成',
            '统一社会信用代码 GB 32100-2015 校验位实时验证',
            '一键复制全部与抬头一行式分字段复制',
            '文本二维码扫码即得开票信息',
            '名片尺寸（90mm×54mm）打印成卡可裁切',
            '专票/普票类型标注'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '开票信息卡生成器', item: 'https://www.util.cn/tools/invoice-info-card/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '统一社会信用代码 18 位是怎么构成的？',
              acceptedAnswer: { '@type': 'Answer', text: '按 GB 32100-2015：第 1 位登记管理部门代码、第 2 位机构类别代码、第 3-8 位登记管理机关行政区划码、第 9-17 位主体标识码（组织机构代码）、第 18 位校验位。' }
            },
            {
              '@type': 'Question',
              name: '税号 18 位里为什么没有 I、O、Z 这些字母？',
              acceptedAnswer: { '@type': 'Answer', text: '为避免与数字 1、0、2 等混淆，标准字符集剔除了 I、O、S、V、Z 五个易混字母；录入的代码中出现这些字母一定是错的。' }
            },
            {
              '@type': 'Question',
              name: '校验位对了就代表公司真实存在吗？',
              acceptedAnswer: { '@type': 'Answer', text: '校验位只验证编码本身没有抄错，不能验证主体真实性与经营状态；核对主体请以营业执照或全国统一社会信用代码公示平台查询结果为准。' }
            },
            {
              '@type': 'Question',
              name: '开专票需要提供哪些信息？',
              acceptedAnswer: { '@type': 'Answer', text: '开票五要素：公司名称、纳税人识别号、注册地址、联系电话、开户银行及账号，需与营业执照一致；普票给个人抬头通常只需名称。' }
            }
          ]
        }
      ]
    })
  }]
})

/* ==== PURE:BEGIN ==== */
const INVOICE_TYPES = [
  { id: 'special', label: '增值税专用发票（专票）' },
  { id: 'normal', label: '增值税普通发票（普票）' }
]
const PLACEHOLDER = '____'

// 统一社会信用代码字符集（31 字符，不含 I/O/S/V/Z）与权重因子（GB 32100-2015）
const USCC_CHARSET = '0123456789ABCDEFGHJKLMNPQRTUWXY'
const USCC_WEIGHTS = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28]

function normalizeUscc(raw) {
  return String(raw || '').trim().toUpperCase().replace(/\s+/g, '')
}

// GB 32100-2015 校验位验证：
// 前 17 位字符值 × 权重因子求和 mod 31，C18 = 31 - 余数（余数为 0 时 C18 取 0）
function validateUscc(raw) {
  const code = normalizeUscc(raw)
  if (!/^[0-9A-Z]{18}$/.test(code)) {
    return { ok: false, reason: 'length', code, hint: '' }
  }
  if (!code.split('').every((c) => USCC_CHARSET.includes(c))) {
    return { ok: false, reason: 'charset', code, hint: '' }
  }
  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += USCC_CHARSET.indexOf(code[i]) * USCC_WEIGHTS[i]
  }
  const expectIndex = (31 - (sum % 31)) % 31
  const expect = USCC_CHARSET[expectIndex]
  const ok = expect === code[17]
  return { ok, reason: ok ? 'valid' : 'check', code, expect, hint: '' }
}

// 带提示语的校验结果（供界面与单测共用）
function usccHint(raw) {
  const code = normalizeUscc(raw)
  if (!code) return null
  if (code.length !== 18) {
    return { ok: false, reason: 'length', code, hint: '代码长度为 ' + code.length + ' 位，统一社会信用代码应为 18 位。' }
  }
  if (!code.split('').every((c) => USCC_CHARSET.includes(c))) {
    return { ok: false, reason: 'charset', code, hint: '存在非法字符：统一社会信用代码不含 I、O、S、V、Z，请核对后重录。' }
  }
  const r = validateUscc(code)
  if (r.ok) {
    r.hint = '校验位通过（GB 32100-2015），第 18 位应为 ' + r.expect + '，与录入一致。'
  } else {
    r.hint = '校验位不符：按 GB 32100-2015 算法第 18 位应为 ' + r.expect + '，当前录入为 ' + code[17] + '，请核对是否有抄写错误。'
  }
  return r
}

// 复制文本拼接（分区标注，供复制全部与二维码共用）
function buildCopyAll(info) {
  const g = (v) => String(v === undefined || v === null ? '' : v).trim() || PLACEHOLDER
  const typeLabel = String(info.typeLabel || '').trim() || INVOICE_TYPES[0].label
  const lines = [
    '【公司名称】' + g(info.company),
    '【纳税人识别号】' + g(info.taxNo),
    '【地址、电话】' + g(info.address) + ' ' + g(info.phone),
    '【开户行及账号】' + g(info.bank) + ' ' + g(info.account),
    '【发票类型】' + typeLabel
  ]
  return lines.join('\n')
}

// 抬头一行式：公司全称（税号）
function buildOneLine(info) {
  const g = (v) => String(v === undefined || v === null ? '' : v).trim() || PLACEHOLDER
  return g(info.company) + '（' + g(info.taxNo) + '）'
}

// 组装待复制/编码的全部信息
function buildInfoPayload(fields) {
  const g = (k) => String((fields && fields[k]) ?? '').trim()
  return {
    company: g('company'),
    taxNo: g('taxNo'),
    address: g('address'),
    phone: g('phone'),
    bank: g('bank'),
    account: g('account'),
    typeLabel: g('typeLabel')
  }
}
/* ==== PURE:END ==== */

// ---------- 页面状态 ----------
const company = ref('')
const taxNo = ref('')
const address = ref('')
const phone = ref('')
const bank = ref('')
const account = ref('')
const invoiceType = ref('special')
const qrMode = ref(false)
const qrDataUrl = ref('')
const qrError = ref('')

const tool = tools.find((t) => t.id === 'invoice-info-card')

const invoiceTypeLabel = computed(() => {
  const t = INVOICE_TYPES.find((x) => x.id === invoiceType.value) || INVOICE_TYPES[0]
  return t.label
})

const taxNoNormalized = computed(() => normalizeUscc(taxNo.value))

const info = computed(() => ({
  company: company.value,
  taxNo: taxNoNormalized.value,
  address: address.value,
  phone: phone.value,
  bank: bank.value,
  account: account.value,
  typeLabel: invoiceTypeLabel.value
}))

// 税号实时校验
const taxCheck = computed(() => usccHint(taxNo.value))

const copyAllText = computed(() => buildCopyAll(info.value))
const oneLineText = computed(() => buildOneLine(info.value))

// ---------- 复制 ----------
function fallbackCopy(text, successMsg) {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert(successMsg)
  } catch (e) {
    alert('复制失败，请手动选择文本复制')
  }
}

async function doCopy(text, msg) {
  try {
    await navigator.clipboard.writeText(text)
    alert(msg)
  } catch (e) {
    fallbackCopy(text, msg)
  }
}

function copyAll() {
  doCopy(copyAllText.value, '已复制')
}

function copyOneLine() {
  doCopy(oneLineText.value, '已复制')
}

function copyTaxNo() {
  const code = normalizeUscc(taxNo.value)
  if (!code) {
    alert('请先填写统一社会信用代码')
    return
  }
  doCopy(code, '已复制')
}

function printCard() {
  window.print()
}

// ---------- 二维码（动态 import 站内已安装的 qrcode 包，与站内二维码工具同款实现） ----------
watch([company, taxNo, address, phone, bank, account, invoiceType, qrMode], async () => {
  if (!qrMode.value) return
  qrDataUrl.value = ''
  qrError.value = ''
  if (!company.value.trim()) return
  try {
    const QRCode = await import('qrcode')
    qrDataUrl.value = await QRCode.toDataURL(copyAllText.value, {
      width: 256,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#FFFFFF' }
    })
  } catch (e) {
    qrError.value = '二维码生成失败，请检查输入内容后重试'
  }
})

onMounted(() => {
  if (tool) addRecentTool(tool.id)
})
</script>

<style scoped>
/* 名片尺寸卡面：90mm × 54mm 标准名片比例 */
.inv-card {
  width: 90mm;
  height: 54mm;
  background: #fff;
  color: #111;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 6mm 7mm;
  position: relative;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.inv-company {
  font-size: 13pt;
  font-weight: 700;
  line-height: 1.3;
  word-break: break-all;
}

.inv-taxno {
  font-size: 9.5pt;
  font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
  letter-spacing: 0.08em;
  margin-top: 1.5mm;
  color: #333;
  word-break: break-all;
}

.inv-divider {
  border-top: 1px solid #ddd;
  margin: 2.5mm 0;
}

.inv-line {
  font-size: 7.5pt;
  line-height: 1.7;
  color: #333;
}

.inv-type {
  position: absolute;
  right: 6mm;
  bottom: 4mm;
  font-size: 7pt;
  color: #666;
  border: 1px solid #ccc;
  border-radius: 99px;
  padding: 0.5mm 2.5mm;
}

.card-scroll {
  padding: 4px 2px 8px;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }

  .no-print {
    display: none !important;
  }
}
</style>

<style>
/* 打印成卡：仅保留名片卡面并加裁切虚线框（全局样式，配合页内 .no-print 使用） */
@media print {
  body * {
    visibility: hidden;
  }

  .inv-card,
  .inv-card * {
    visibility: visible;
  }

  .inv-card {
    position: absolute;
    top: 60mm;
    left: 50%;
    transform: translateX(-50%);
    margin: 0;
    border: 1px dashed #999;
    border-radius: 0;
    box-shadow: none;
  }
}
</style>
