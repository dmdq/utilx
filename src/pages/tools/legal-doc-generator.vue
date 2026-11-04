<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileSignature class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">法律文书生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">房屋租赁合同 / 授权委托书 / 委托书 / 保密协议 / 劳务协议，五套模板填写即得可打印文书</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        内置五套常用民事文书模板：选择模板 → 按字段填写甲乙双方、金额、期限、地址等信息 → 右侧纸张样式实时预览，
        未填写的空位以「____」显示，关键信息缺失会给出必填提示。授权委托书支持逐项勾选代理权限注入正文。
        生成结果可一键复制全文，也可直接打印或另存 PDF 签字用印。全部内容仅在当前浏览器本地处理，不上传任何数据。
      </p>
    </div>

    <!-- 免责声明（显著） -->
    <div class="no-print mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3" role="alert">
      <TriangleAlert class="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
      <p class="text-sm text-foreground leading-relaxed">
        <strong>免责声明：</strong>本工具模板仅供参考，不构成法律意见，重大事项请咨询执业律师并按当地要求修订。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：模板选择 + 字段表单 -->
      <div class="no-print space-y-6">
        <!-- 模板选择 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <FileText class="w-5 h-5 mr-2 text-primary" /> 第一步：选择文书模板
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              v-for="tpl in TEMPLATES"
              :key="tpl.id"
              type="button"
              @click="selectTemplate(tpl.id)"
              :class="[
                'px-3 py-2.5 rounded-lg text-sm font-medium transition border',
                currentTemplateId === tpl.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground border-border'
              ]"
            >
              {{ tpl.name }}
            </button>
          </div>
        </div>

        <!-- 字段表单 -->
        <div v-if="currentTemplate" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <PenLine class="w-5 h-5 mr-2 text-primary" /> 第二步：填写「{{ currentTemplate.name }}」信息
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="field in currentTemplate.fields" :key="field.key" :class="field.full ? 'sm:col-span-2' : ''">
              <label class="block text-sm font-medium mb-1" :class="field.required ? 'text-foreground' : 'text-muted-foreground'">
                {{ field.label }}
                <span v-if="field.required" class="text-red-500 ml-0.5">*</span>
                <span v-else class="text-xs text-muted-foreground ml-1">（选填）</span>
              </label>
              <textarea
                v-if="field.type === 'textarea'"
                v-model="form[field.key]"
                rows="2"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                :placeholder="field.placeholder"
              ></textarea>
              <input
                v-else-if="field.type === 'date'"
                v-model="form[field.key]"
                type="date"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                v-else-if="field.type === 'select'"
                v-model="form[field.key]"
                class="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <input
                v-else
                v-model="form[field.key]"
                :type="field.type === 'number' ? 'number' : 'text'"
                class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                :placeholder="field.placeholder"
              />
              <p v-if="field.hint" class="text-xs text-muted-foreground mt-1">{{ field.hint }}</p>
            </div>
          </div>

          <!-- 代理权限勾选（授权委托书专用） -->
          <div v-if="currentTemplate.powers" class="border border-border rounded-lg p-4">
            <p class="text-sm font-medium text-foreground mb-2">
              代理权限（至少勾选一项）<span class="text-red-500 ml-0.5">*</span>
            </p>
            <div class="space-y-2">
              <label
                v-for="power in currentTemplate.powers"
                :key="power"
                class="flex items-start gap-2 text-sm text-foreground cursor-pointer"
              >
                <input
                  v-model="selectedPowers"
                  :value="power"
                  type="checkbox"
                  class="mt-0.5 w-4 h-4 rounded border border-border shrink-0"
                />
                <span>{{ power }}</span>
              </label>
            </div>
          </div>

          <!-- 必填校验提示 -->
          <p
            v-if="missingRequired.length"
            class="text-xs leading-relaxed text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 flex items-start gap-1.5"
          >
            <TriangleAlert class="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>还有 {{ missingRequired.length }} 项必填信息未填写：{{ missingRequired.join('、') }}。未填写的空位在预览中以「____」显示。</span>
          </p>

          <!-- 使用提示 -->
          <div class="bg-muted/50 border border-border rounded-lg p-4">
            <p class="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
              <Info class="w-4 h-4 text-primary" /> 使用提示
            </p>
            <ul class="space-y-1.5 text-xs text-muted-foreground leading-relaxed list-disc list-inside">
              <li v-for="(tip, i) in currentTemplate.tips" :key="i">{{ tip }}</li>
            </ul>
          </div>

          <!-- 操作按钮 -->
          <div class="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              @click="copyDoc"
              class="flex-1 min-w-[120px] px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
            >
              <Copy class="w-4 h-4" /> 复制全文
            </button>
            <button
              type="button"
              @click="printDoc"
              class="flex-1 min-w-[120px] px-4 py-2.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition flex items-center justify-center gap-1.5"
            >
              <Printer class="w-4 h-4" /> 打印 / 另存 PDF
            </button>
            <button
              type="button"
              @click="resetForm"
              class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-muted-foreground transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw class="w-4 h-4" /> 清空重填
            </button>
          </div>
        </div>
      </div>

      <!-- 右：纸张预览（打印输出区） -->
      <div class="print-area">
        <div class="no-print flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 文书预览
          </h2>
          <button
            type="button"
            @click="printDoc"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1.5"
          >
            <Printer class="w-4 h-4" /> 打印 / 另存 PDF
          </button>
        </div>

        <div v-if="currentTemplate" class="bg-white text-black border border-border rounded-lg shadow-sm overflow-hidden">
          <div class="p-6 sm:p-10 font-serif" style="font-family: 'SimSun', 'Songti SC', 'STSong', serif;">
            <p class="text-center text-2xl font-bold tracking-[0.5em] mb-6">{{ currentTemplate.name }}</p>
            <template v-for="(block, bi) in renderedBlocks" :key="bi">
              <p v-if="block.kind === 'h'" class="font-bold text-[16px] leading-[1.9] mt-4 mb-1">{{ block.text }}</p>
              <p v-else-if="block.kind === 'f'" class="whitespace-pre-wrap text-[16px] leading-[1.9] mb-3">{{ block.text }}</p>
              <p v-else-if="block.kind === 'para'" class="whitespace-pre-wrap indent-[2em] text-[16px] leading-[1.9] mb-3">{{ block.text }}</p>
              <div
                v-else-if="block.kind === 'sign'"
                class="mt-8 mb-2 flex flex-wrap gap-8"
                :class="block.right.length ? 'justify-between' : 'justify-start'"
              >
                <div class="text-[16px] leading-[2.4] min-w-[38%]">
                  <p v-for="(ln, li) in block.left" :key="li">
                    {{ ln }}<span v-if="ln.endsWith('：')" class="sign-line">&nbsp;</span>
                  </p>
                </div>
                <div v-if="block.right.length" class="text-[16px] leading-[2.4] min-w-[38%]">
                  <p v-for="(ln, li) in block.right" :key="li">
                    {{ ln }}<span v-if="ln.endsWith('：')" class="sign-line">&nbsp;</span>
                  </p>
                </div>
              </div>
            </template>
          </div>
        </div>
        <div
          v-else
          class="bg-card border border-dashed border-border rounded-lg h-[420px] flex flex-col items-center justify-center text-center px-8"
        >
          <FileSignature class="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p class="text-sm font-medium text-muted-foreground">选择模板并填写信息后，此处生成文书预览</p>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：打印或另存 PDF 时仅输出纸张内的文书正文。请各方当事人在签名处当场手写签名（按手印）后再交付使用。
        </p>
      </div>
    </div>

    <!-- SEO 内容长尾区（可折叠） -->
    <div class="relative no-print">
      <button
        type="button"
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>法律文书生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          法律文书生成器是一款在线文书排版辅助工具，内置房屋租赁合同、授权委托书、委托书、保密协议、劳务协议五套常用模板。
          模板条款参照市面通用范本整理，覆盖当事人信息、权利义务、违约责任、争议解决等完整结构；填写甲乙双方、
          标的金额、期限、地址、签署日期等字段后即可在纸张样式中实时预览，未填写的位置以「____」留空，方便打印后手工补填。
          生成结果可复制为纯文本，也可直接打印或另存 PDF，交由当事人签字（按手印）后使用。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">五套模板分别适用于什么场景</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed">
          <li><strong>房屋租赁合同</strong>：个人住房出租、承租，含押金退还、房屋维修、腾退交房、提前解约与违约金等常用条款。</li>
          <li><strong>授权委托书</strong>：委托他人代办事务或参加诉讼，代理权限逐项勾选注入正文，明确委托期限与责任承担。</li>
          <li><strong>委托书</strong>：就单一事项（如代为领取证件、办理手续）出具的简易委托，写明事项、权限与有效期即可。</li>
          <li><strong>保密协议</strong>：合作或用工中约定保密义务，列明保密信息范围、保密期限与违约金。</li>
          <li><strong>劳务协议</strong>：个人或主体之间建立劳务关系（非劳动关系）时使用，约定劳务内容、报酬与支付日。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">如何使用本工具</h3>
        <ol class="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-4 leading-relaxed">
          <li>在「第一步」中选择需要的文书模板；</li>
          <li>在「第二步」中按字段填写信息，带 * 为必填项，授权委托书需勾选代理权限；</li>
          <li>右侧纸张预览实时更新，空位显示「____」，可对照补填；</li>
          <li>点击「复制全文」或「打印 / 另存 PDF」，由各方当事人签名、按手印后使用。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">授权委托书和委托书有什么区别</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          授权委托书侧重「授权」：核心是逐项列明代理权限（代为签署、代收款项、诉讼代理等），受托人在权限范围内实施的行为
          由委托人承担后果，常用于房产、银行、诉讼等需要明确授权边界的事项。委托书侧重「委托办理」：就某一具体事项
          （如代领证书）出具，篇幅简短，写清事项、权限说明与有效期即可。两者都应由委托人本人签字并按手印，
          重要事项建议同时附身份证复印件并按用证单位要求核验原件。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">劳务协议和劳动合同有什么区别</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          劳动合同受劳动法律法规调整，用工方需承担社会保险、最低工资、经济补偿、工伤责任等法定义务；
          劳务协议建立的是平等主体之间的劳务关系，报酬、期限、职责以双方约定为准，一般不适用劳动关系中的上述规定。
          如果实际用工具有人身从属性（固定上下班、接受考勤管理、持续稳定用工），即使签的是劳务协议，
          也可能被认定为事实劳动关系。请根据真实用工关系选择文书，必要时应签订劳动合同。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常见问题（FAQ）</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-foreground">这些模板可以直接使用吗？</h4>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              模板按市面通用范本整理，条款为常见写法，仅供参考，不构成法律意见。请结合实际交易情况增删条款，
              标的较大、涉及担保或履行周期长的事项，建议先请执业律师审核后再签署。
            </p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">房屋租赁合同要重点核对哪些条款？</h4>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              重点核对：租金与支付方式、押金退还条件、维修责任划分、提前解约与违约金、腾退与费用结清。
              签约前核验房产证与出租人身份，签约后保留房产证复印件与押金收据，交房时书面确认设施清单与水电表底数。
            </p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">未填写的空位怎么办？</h4>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              预览中空位以「____」显示，可在打印后用笔手工补填，建议同时在补填处由双方签字或按手印确认，
              防止事后对内容产生争议。带 * 的必填项未填时，表单下方会给出提示。
            </p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">填写的内容会被上传吗？</h4>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              不会。所有替换、排版都在当前浏览器本地完成，不向服务器发送任何填写内容；
              在公共电脑上使用后建议关闭页面或清空表单再离开。
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :current-tool-id="'legal-doc-generator'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  FileSignature, FileText, PenLine, Printer, Copy, RefreshCw,
  ChevronUp, ChevronDown, TriangleAlert, Info
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '法律文书生成器 - 租房合同/授权书/委托书/保密协议模板在线生成 | 有条工具',
  description: '在线法律文书生成器：内置房屋租赁合同、授权委托书、委托书、保密协议、劳务协议五套通用模板，按字段填写即可实时预览打印，代理权限逐项勾选，空位留白可手写补填，一键复制或打印另存PDF，纯浏览器本地处理不上传',
  keywords: '租房合同模板,授权书生成器,委托书模板,保密协议模板,contract template generator,法律文书模板,劳务协议模板',
  author: '有条工具',
  ogTitle: '法律文书生成器 - 五套常用文书模板在线生成 | 有条工具',
  ogDescription: '租房合同、授权委托书、委托书、保密协议、劳务协议模板，填写字段即得可打印文书，本地处理不上传',
  ogUrl: 'https://www.util.cn/tools/legal-doc-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '法律文书生成器 - 常用文书模板在线生成',
  twitterDescription: '五套通用文书模板，字段化填写，实时预览打印，本地处理不上传'
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
          name: '法律文书生成器',
          url: 'https://www.util.cn/tools/legal-doc-generator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '五套常用文书模板（租赁合同/授权委托书/委托书/保密协议/劳务协议）',
            '字段化填写与实时纸张预览',
            '授权委托书代理权限逐项勾选注入',
            '必填校验与空位留白提示',
            '一键复制全文与打印另存 PDF',
            '本地处理不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '法律文书生成器', item: 'https://www.util.cn/tools/legal-doc-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '这些法律文书模板可以直接使用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '模板按市面通用范本整理，仅供参考，不构成法律意见。请结合实际情况增删条款，标的较大、涉及担保或履行周期长的事项，建议先请执业律师审核后再签署。' }
            },
            {
              '@type': 'Question',
              name: '授权委托书的代理权限应该怎么写？',
              acceptedAnswer: { '@type': 'Answer', text: '代理权限应逐项列明（如代为签署合同、代收款项、诉讼代理等），避免笼统写“全权委托”；委托人本人签字并按手印，重要事项建议附身份证复印件并按用证单位要求核验原件。' }
            },
            {
              '@type': 'Question',
              name: '房屋租赁合同要重点核对哪些条款？',
              acceptedAnswer: { '@type': 'Answer', text: '重点核对租金与支付方式、押金退还条件、维修责任划分、提前解约与违约金、腾退与费用结清等条款；签约前核验房产证与出租人身份，签约后保留房产证复印件与押金收据。' }
            },
            {
              '@type': 'Question',
              name: '填写的内容会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有替换与排版都在当前浏览器本地完成，不向服务器发送任何填写内容；在公共电脑上使用后建议清空表单再离开。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const CN_NUMS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
const PLACEHOLDER = '____'

// 'YYYY-MM-DD' → 'YYYY年M月D日'，空或非法 → '____'
function formatCnDate(raw) {
  const m = String(raw || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!m) return PLACEHOLDER
  return `${Number(m[1])}年${Number(m[2])}月${Number(m[3])}日`
}

// 勾选的代理权限 → 中文序号清单文本；未勾选 → '____'
function renderPowers(selected) {
  const list = Array.isArray(selected)
    ? selected.map((s) => String(s).trim()).filter(Boolean)
    : []
  if (!list.length) return PLACEHOLDER
  return list.map((p, i) => `${CN_NUMS[i] || i + 1}、${p}`).join('；\n') + '。'
}

// 将模板文本中的 {{字段}} 替换为填写值，空值/未知字段一律渲染为 '____'
function fillText(text, values) {
  return String(text)
    .replace(/\{\{(\w+)\}\}/g, (m, key) => {
      const v = values ? values[key] : undefined
      return v === undefined || v === null || v === '' ? PLACEHOLDER : String(v)
    })
    .replace(/\{\{[^}]*\}\}/g, PLACEHOLDER)
}

// 由表单数据构建替换值表：文本字段去首尾空格，日期字段转中文格式，powers 特殊渲染
function buildValues(form, tpl) {
  const values = {}
  for (const f of tpl.fields) {
    const raw = String((form && form[f.key]) ?? '').trim()
    values[f.key] = f.type === 'date' ? formatCnDate(raw) : raw
  }
  if (tpl.powers) values.powers = renderPowers(form && form.powers)
  return values
}

// 渲染整份文书为块结构（kind: para 缩进段 / h 条款标题 / f 顶格段 / sign 落款）
function renderBlocks(tpl, values) {
  return tpl.text.map((b) => {
    if (typeof b === 'string') return { kind: 'para', text: fillText(b, values) }
    if (b.h) return { kind: 'h', text: fillText(b.h, values) }
    if (b.f) return { kind: 'f', text: fillText(b.f, values) }
    return {
      kind: 'sign',
      left: ((b.sign && b.sign.left) || []).map((l) => fillText(l, values)),
      right: ((b.sign && b.sign.right) || []).map((l) => fillText(l, values))
    }
  })
}

// 拼接整份文书为多行纯文本（供复制）
function buildDocText(tpl, values) {
  const out = [tpl.name, '']
  for (const b of tpl.text) {
    if (typeof b === 'string') {
      out.push(fillText(b, values), '')
    } else if (b.h) {
      out.push(fillText(b.h, values), '')
    } else if (b.f) {
      out.push(fillText(b.f, values), '')
    } else {
      out.push(((b.sign && b.sign.left) || []).map((l) => fillText(l, values)).join('\n'), '')
      const rightLines = ((b.sign && b.sign.right) || []).map((l) => fillText(l, values)).join('\n')
      if (rightLines) out.push(rightLines, '')
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

// 必填校验：返回未填写的必填字段名称列表（含代理权限）
function missingFields(tpl, form) {
  const missing = []
  for (const f of tpl.fields) {
    if (!f.required) continue
    const v = String((form && form[f.key]) ?? '').trim()
    if (!v) missing.push(f.label)
  }
  if (tpl.powers && !(Array.isArray(form && form.powers) && form.powers.length)) {
    missing.push('代理权限（至少勾选一项）')
  }
  return missing
}

// 按模板字段初始化表单对象（select 取第一个选项为默认值）
function initForm(tpl) {
  const form = {}
  for (const f of tpl.fields) {
    form[f.key] = f.type === 'select' && Array.isArray(f.options) && f.options.length ? f.options[0] : ''
  }
  return form
}

// 模板文本块约定：字符串 = 首行缩进 2 字符的正文段；{ h } = 条款标题（加粗顶格）；
// { f } = 顶格行（当事人信息、权限清单）；{ sign: { left, right } } = 双栏落款
const TEMPLATES = [
  {
    id: 'rental',
    name: '房屋租赁合同',
    tips: [
      '签署前建议核验房产证（不动产权证）与出租人身份是否一致，可将房产证复印件、押金收据作为合同附件一并保存。',
      '交房时建议与房东共同确认家具家电清单及水电燃气表底数并书面签字，退租时按清单交接，可大幅减少押金纠纷。'
    ],
    fields: [
      { key: 'partyA', label: '甲方（出租人）', required: true, type: 'text', placeholder: '如 张三' },
      { key: 'partyAId', label: '甲方身份证号', required: false, type: 'text', placeholder: '选填' },
      { key: 'partyB', label: '乙方（承租人）', required: true, type: 'text', placeholder: '如 李四' },
      { key: 'partyBId', label: '乙方身份证号', required: false, type: 'text', placeholder: '选填' },
      { key: 'address', label: '房屋坐落地址', required: true, type: 'text', full: true, placeholder: '如 北京市朝阳区××路××号××小区××号楼××单元××室' },
      { key: 'area', label: '建筑面积（平方米）', required: false, type: 'text', placeholder: '如 89' },
      { key: 'rent', label: '月租金（元/月）', required: true, type: 'number', placeholder: '如 3500' },
      { key: 'payment', label: '租金支付方式', required: true, type: 'select', options: ['押一付三', '押一付一', '押二付一', '季付', '半年付', '年付'] },
      { key: 'deposit', label: '押金（元）', required: true, type: 'number', placeholder: '如 3500' },
      { key: 'termStart', label: '租赁起始日', required: true, type: 'date' },
      { key: 'termEnd', label: '租赁到期日', required: true, type: 'date' },
      { key: 'signDate', label: '签署日期', required: true, type: 'date' }
    ],
    text: [
      { f: '出租人（甲方）：{{partyA}}\n身份证号：{{partyAId}}\n承租人（乙方）：{{partyB}}\n身份证号：{{partyBId}}' },
      '根据《中华人民共和国民法典》及有关法律法规的规定，甲乙双方在平等、自愿、协商一致的基础上，就房屋租赁事宜达成如下协议：',
      { h: '第一条 房屋基本情况' },
      '甲方将坐落于{{address}}的房屋（建筑面积约{{area}}平方米）出租给乙方居住使用。乙方确认已实地查看房屋及附属设施，对房屋现状无异议。',
      { h: '第二条 租赁期限' },
      '租赁期限自{{termStart}}起至{{termEnd}}止。租赁期满本合同终止；乙方需继续承租的，应提前30日与甲方协商并另行签订书面合同。',
      { h: '第三条 租金与押金' },
      '月租金为人民币{{rent}}元，按{{payment}}方式支付。乙方应于签署本合同当日向甲方支付押金人民币{{deposit}}元；租赁期满或合同解除后，乙方结清水费、电费、燃气费、物业费等费用，且房屋及附属设施无损坏的，甲方应于乙方腾退交房当日将押金无息退还乙方。',
      { h: '第四条 甲方权利义务' },
      '1. 甲方保证对该房屋享有合法所有权或出租权，房屋不存在权属争议；\n2. 甲方应保证房屋主体结构及附属设施设备处于可正常使用状态，并按约定时间交付房屋；\n3. 租赁期内甲方不得单方提高租金，无正当理由不得提前收回房屋。',
      { h: '第五条 乙方权利义务' },
      '1. 乙方应按约定按时足额支付租金，并承担使用房屋产生的水费、电费、燃气费、物业费、网络费等费用；\n2. 乙方应合理使用房屋及附属设施，不得擅自改变房屋结构和用途，未经甲方书面同意不得将房屋全部或部分转租给第三人；\n3. 租赁期满或合同解除后，乙方应及时腾退房屋，并将房屋及附属设施按交接时的状态（自然损耗除外）交还甲方。',
      { h: '第六条 房屋维修' },
      '租赁期内，房屋主体结构及附属设施设备的自然损坏由甲方负责维修并承担费用；因乙方使用不当造成损坏的，由乙方负责修复或照价赔偿。房屋及设施影响正常使用、甲方经乙方催告后不及时维修的，乙方可代为维修，合理费用凭有效凭证由甲方承担。',
      { h: '第七条 合同解除与违约责任' },
      '1. 经双方协商一致，可以解除本合同；\n2. 一方需提前解除本合同的，应提前30日书面通知对方；\n3. 乙方逾期支付租金超过15日，或擅自转租、擅自改变房屋用途的，甲方有权解除合同并要求乙方限期腾退房屋；\n4. 甲方无正当理由提前收回房屋的，应向乙方支付相当于一个月租金的违约金；乙方无正当理由提前退租的，应向甲方支付相当于一个月租金的违约金；\n5. 一方违约给对方造成损失，违约金不足以弥补实际损失的，还应就不足部分予以赔偿。',
      { h: '第八条 争议解决' },
      '本合同履行过程中发生争议的，双方应友好协商解决；协商不成的，任何一方均可向房屋所在地有管辖权的人民法院提起诉讼。',
      { h: '第九条 其他' },
      '本合同未尽事宜，双方可另行签订补充协议，补充协议与本合同具有同等法律效力。本合同一式两份，甲乙双方各执一份，自双方签字（按手印）之日起生效。',
      { sign: { left: ['甲方（签字）：', '签署日期：{{signDate}}'], right: ['乙方（签字）：', '签署日期：{{signDate}}'] } }
    ]
  },
  {
    id: 'poa',
    name: '授权委托书',
    tips: [
      '授权委托书需委托人本人签字并按手印；办理房产、银行、诉讼等重要事项时，建议同时附委托人身份证复印件，并按受托单位要求现场核验身份。',
      '代理权限应逐项勾选、写明确切，不宜笼统写「全权委托」；事项办结后建议及时收回委托书或书面撤销委托，避免被越权使用。'
    ],
    fields: [
      { key: 'principal', label: '委托人', required: true, type: 'text', placeholder: '如 张三' },
      { key: 'principalId', label: '委托人身份证号', required: false, type: 'text', placeholder: '选填' },
      { key: 'agent', label: '受托人', required: true, type: 'text', placeholder: '如 李四' },
      { key: 'agentId', label: '受托人身份证号', required: false, type: 'text', placeholder: '选填' },
      { key: 'termStart', label: '委托期限起始日', required: true, type: 'date' },
      { key: 'termEnd', label: '委托期限截止日', required: true, type: 'date' },
      { key: 'signDate', label: '签署日期', required: true, type: 'date' }
    ],
    powers: [
      '代为签署与委托事项有关的合同、协议及文件',
      '代为收取款项、办理结算及领取相关财物',
      '代为办理房产买卖、租赁、登记等相关手续',
      '代为办理银行存取款、社保等业务手续',
      '代为参加诉讼、仲裁活动（诉讼代理）',
      '代为承认、放弃、变更诉讼请求，进行和解、调解',
      '代为签收法律文书及相关通知'
    ],
    text: [
      { f: '委托人：{{principal}}\n身份证号：{{principalId}}\n受托人：{{agent}}\n身份证号：{{agentId}}' },
      '委托人因故不能亲自办理相关事宜，特委托受托人作为代理人，代为办理下列委托事项。',
      { h: '一、代理权限' },
      { f: '{{powers}}' },
      { h: '二、委托期限' },
      '委托期限自{{termStart}}起至{{termEnd}}止。',
      '受托人在上述委托权限内实施的行为，委托人均予以承认，由此产生的法律后果由委托人承担。受托人无转委托权。',
      { h: '三、其他' },
      '本委托书自委托人签字（按手印）之日起生效，至委托期限届满或委托人书面撤销委托时终止。本委托书一式两份，委托人与受托人各执一份。',
      { sign: { left: ['委托人（签字并按手印）：', '签署日期：{{signDate}}'] } }
    ]
  },
  {
    id: 'commission',
    name: '委托书',
    tips: [
      '受托人办理事项时宜随身携带本委托书及双方身份证件原件或复印件，便于有关单位核验身份。',
      '委托事项与权限应写具体（如「代为领取不动产权证书」），避免只写「办理相关事宜」导致被拒办或越权。'
    ],
    fields: [
      { key: 'principal', label: '委托人', required: true, type: 'text', placeholder: '如 张三' },
      { key: 'principalId', label: '委托人身份证号', required: false, type: 'text', placeholder: '选填' },
      { key: 'agent', label: '受托人', required: true, type: 'text', placeholder: '如 李四' },
      { key: 'agentId', label: '受托人身份证号', required: false, type: 'text', placeholder: '选填' },
      { key: 'matter', label: '委托事项', required: true, type: 'text', full: true, placeholder: '如 代为领取不动产权证书' },
      { key: 'detail', label: '委托权限说明', required: false, type: 'textarea', full: true, placeholder: '如：有权提交申请材料、签收相关文书（留空则以 ____ 显示）' },
      { key: 'validUntil', label: '委托有效期至', required: true, type: 'date' },
      { key: 'signDate', label: '签署日期', required: true, type: 'date' }
    ],
    text: [
      { f: '委托人：{{principal}}\n身份证号：{{principalId}}\n受托人：{{agent}}\n身份证号：{{agentId}}' },
      '本人{{principal}}因故不能亲自办理{{matter}}的相关手续，特委托上述受托人作为我的代理人，代表本人办理该事项。',
      { h: '一、委托权限' },
      { f: '{{detail}}' },
      { h: '二、委托期限与责任' },
      '本委托书自签署之日起至{{validUntil}}止有效，委托期限届满或委托事项办结后自动失效。受托人在上述委托权限内实施的行为，本人均予以承认，由此产生的法律后果由本人承担。',
      { h: '三、其他' },
      '本委托书一式两份，委托人与受托人各执一份。受托人办理委托事项时，可向有关单位出示本委托书及身份证明。',
      { sign: { left: ['委托人（签字并按手印）：', '签署日期：{{signDate}}'] } }
    ]
  },
  {
    id: 'nda',
    name: '保密协议',
    tips: [
      '保密信息范围应尽量列明（如技术资料、客户名单、经营数据），范围应当合理，过宽或过窄都可能影响实际约束效果。',
      '一方为企业主体的应加盖公章并由法定代表人或授权代表签字；个人主体签字并按手印。涉及重大商业秘密的建议先咨询执业律师。'
    ],
    fields: [
      { key: 'partyA', label: '甲方（披露方）', required: true, type: 'text', placeholder: '如 北京××科技有限公司 或 张三' },
      { key: 'partyAId', label: '甲方证件号码（身份证号/统一社会信用代码）', required: false, type: 'text', placeholder: '选填' },
      { key: 'partyB', label: '乙方（接收方）', required: true, type: 'text', placeholder: '如 李四' },
      { key: 'partyBId', label: '乙方证件号码（身份证号/统一社会信用代码）', required: false, type: 'text', placeholder: '选填' },
      { key: 'secretScope', label: '保密信息范围', required: true, type: 'textarea', full: true, placeholder: '如 技术资料、客户名单、报价体系、经营数据' },
      { key: 'purpose', label: '保密目的（知悉原因）', required: true, type: 'text', full: true, placeholder: '如 因双方合作项目需要' },
      { key: 'years', label: '保密期限（年）', required: true, type: 'number', placeholder: '如 3' },
      { key: 'penalty', label: '违约金（元）', required: true, type: 'number', placeholder: '如 100000' },
      { key: 'signDate', label: '签署日期', required: true, type: 'date' }
    ],
    text: [
      { f: '甲方（披露方）：{{partyA}}\n证件号码：{{partyAId}}\n乙方（接收方）：{{partyB}}\n证件号码：{{partyBId}}' },
      '鉴于甲方拥有{{secretScope}}等保密信息，因{{purpose}}需向乙方披露，为保护甲方合法权益，双方根据《中华人民共和国民法典》等有关法律法规，本着平等自愿、诚实信用的原则，订立本协议：',
      { h: '第一条 保密信息的范围' },
      '本协议所称保密信息，包括{{secretScope}}，以及双方在往来过程中以书面、口头、电子数据等形式传递的、标注保密或依其性质应当视为保密的信息。',
      { h: '第二条 乙方的保密义务' },
      '1. 乙方仅得为{{purpose}}之目的使用保密信息，不得用于其他用途；\n2. 未经甲方书面同意，乙方不得向任何第三方披露、提供或允许第三方使用保密信息；\n3. 乙方应采取不低于保护自身同类信息的合理措施妥善保管保密信息，防止泄露、丢失；\n4. 合作终止或甲方提出要求时，乙方应及时返还或销毁载有保密信息的全部资料，并出具书面确认。',
      { h: '第三条 保密期限' },
      '保密期限自本协议签署之日起{{years}}年，期限届满前上述保密义务持续有效。',
      { h: '第四条 违约责任' },
      '乙方违反本协议约定的，应向甲方支付违约金人民币{{penalty}}元；违约金不足以弥补甲方实际损失的，乙方还应就不足部分承担赔偿责任。',
      { h: '第五条 争议解决' },
      '因本协议引起的或与本协议有关的争议，双方应友好协商解决；协商不成的，任何一方均可向甲方所在地有管辖权的人民法院提起诉讼。',
      { h: '第六条 其他' },
      '本协议一式两份，甲乙双方各执一份，自双方签字（盖章）之日起生效。本协议未尽事宜，双方可另行签订补充协议。',
      { sign: { left: ['甲方（签字/盖章）：', '签署日期：{{signDate}}'], right: ['乙方（签字/盖章）：', '签署日期：{{signDate}}'] } }
    ]
  },
  {
    id: 'labor-service',
    name: '劳务协议',
    tips: [
      '劳务关系与劳动关系在社保缴纳、经济补偿、工伤认定等方面适用规则不同：如需建立劳动关系，应依法签订劳动合同并缴纳社会保险。',
      '建议写明劳务报酬数额与支付时间，报酬通过银行转账支付并备注「劳务费」，保留支付凭证。'
    ],
    fields: [
      { key: 'partyA', label: '甲方（接受劳务方）', required: true, type: 'text', placeholder: '如 北京××家政服务部 或 张三' },
      { key: 'partyAId', label: '甲方证件号码', required: false, type: 'text', placeholder: '选填' },
      { key: 'partyB', label: '乙方（提供劳务方）', required: true, type: 'text', placeholder: '如 李四' },
      { key: 'partyBId', label: '乙方身份证号', required: false, type: 'text', placeholder: '选填' },
      { key: 'workContent', label: '劳务内容', required: true, type: 'textarea', full: true, placeholder: '如 家庭保洁、临时性文员协助等' },
      { key: 'workAddress', label: '工作地点', required: true, type: 'text', full: true, placeholder: '如 北京市朝阳区××路××号' },
      { key: 'termStart', label: '协议起始日', required: true, type: 'date' },
      { key: 'termEnd', label: '协议截止日', required: true, type: 'date' },
      { key: 'salary', label: '劳务报酬（元/月）', required: true, type: 'number', placeholder: '如 4500' },
      { key: 'payDay', label: '报酬支付日', required: true, type: 'text', placeholder: '如 每月15日' },
      { key: 'signDate', label: '签署日期', required: true, type: 'date' }
    ],
    text: [
      { f: '甲方（接受劳务方）：{{partyA}}\n乙方（提供劳务方）：{{partyB}}\n身份证号：{{partyBId}}' },
      '根据《中华人民共和国民法典》等有关法律法规，甲乙双方经平等自愿协商，就乙方为甲方提供劳务事宜达成如下协议：',
      { h: '第一条 协议期限' },
      '本协议期限自{{termStart}}起至{{termEnd}}止。',
      { h: '第二条 劳务内容与地点' },
      '乙方为甲方提供{{workContent}}等劳务，工作地点为{{workAddress}}。乙方应按约定完成劳务任务，遵守甲方合理的安排及安全规范。',
      { h: '第三条 劳务报酬' },
      '甲方向乙方支付劳务报酬人民币{{salary}}元/月，于{{payDay}}支付；相关税费依法处理。',
      { h: '第四条 双方权利义务' },
      '1. 甲方应为乙方提供必要的劳务条件和安全的工作环境；\n2. 乙方应诚实守信、勤勉尽责地提供劳务，不得损害甲方或第三方的合法权益；\n3. 双方确认本协议建立的是劳务关系，双方权利义务以本协议约定为准；\n4. 乙方在提供劳务过程中因故意或重大过失造成甲方或第三方损失的，应承担相应赔偿责任。',
      { h: '第五条 协议解除与违约责任' },
      '1. 经双方协商一致，可以解除本协议；任何一方提前解除本协议的，应提前7日通知对方；\n2. 乙方不能按要求完成劳务任务，经甲方提出后仍未改进的，甲方有权解除本协议；\n3. 甲方无正当理由未按约定支付劳务报酬的，乙方有权要求甲方及时支付；\n4. 一方违约给对方造成损失的，应承担相应赔偿责任。',
      { h: '第六条 争议解决' },
      '因履行本协议发生争议的，双方应协商解决；协商不成的，任何一方均可依法向有管辖权的人民法院提起诉讼。',
      { h: '第七条 其他' },
      '本协议一式两份，甲乙双方各执一份，自双方签字之日起生效。未尽事宜，双方可另行协商签订补充协议。',
      { sign: { left: ['甲方（签字/盖章）：', '签署日期：{{signDate}}'], right: ['乙方（签字）：', '签署日期：{{signDate}}'] } }
    ]
  }
]

// ---------- 表单状态 ----------
const currentTemplateId = ref(TEMPLATES[0].id)
const currentTemplate = computed(() => TEMPLATES.find((t) => t.id === currentTemplateId.value) || TEMPLATES[0])
const form = reactive(initForm(TEMPLATES[0]))
const selectedPowers = ref([])
const seoContentVisible = ref(true)

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// 切换模板：保留两套模板共有的已填字段，其余重置
function selectTemplate(id) {
  if (currentTemplateId.value === id) return
  const tpl = TEMPLATES.find((t) => t.id === id)
  if (!tpl) return
  const prev = { ...form }
  Object.keys(form).forEach((k) => delete form[k])
  const fresh = initForm(tpl)
  for (const key of Object.keys(fresh)) {
    form[key] = prev[key] !== undefined && prev[key] !== null ? prev[key] : fresh[key]
  }
  selectedPowers.value = []
  currentTemplateId.value = tpl.id
  addRecentTool('legal-doc-generator')
}

// ---------- 校验与派生 ----------
const missingRequired = computed(() =>
  missingFields(currentTemplate.value, { ...form, powers: selectedPowers.value })
)

const renderedBlocks = computed(() => renderBlocks(currentTemplate.value, buildValues({ ...form, powers: selectedPowers.value }, currentTemplate.value)))

const docText = computed(() => buildDocText(currentTemplate.value, buildValues({ ...form, powers: selectedPowers.value }, currentTemplate.value)))

// ---------- 操作 ----------
async function copyDoc() {
  addRecentTool('legal-doc-generator')
  if (missingRequired.value.length) {
    alert('还有必填信息未填写：' + missingRequired.value.join('、') + '。请补全后再复制全文。')
    return
  }
  try {
    await navigator.clipboard.writeText(docText.value)
    alert('文书全文已复制到剪贴板，可粘贴到备忘录或聊天工具发送给对方确认。')
  } catch (e) {
    alert('复制失败，请在预览区手动选择文本复制。')
  }
}

function printDoc() {
  addRecentTool('legal-doc-generator')
  if (missingRequired.value.length) {
    alert('还有必填信息未填写：' + missingRequired.value.join('、') + '。请补全后再打印，或确认空位需留白手工填写。')
    return
  }
  window.print()
}

function resetForm() {
  Object.assign(form, initForm(currentTemplate.value))
  selectedPowers.value = []
}

onMounted(() => {
  addRecentTool('legal-doc-generator')
})
</script>

<style scoped>
.sign-line {
  display: inline-block;
  min-width: 120px;
  border-bottom: 1px solid #444;
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
    border-radius: 0 !important;
    box-shadow: none !important;
  }
}
</style>

<style>
@media print {
  header {
    display: none !important;
  }
}
</style>
