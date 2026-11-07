<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Mail class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">商务邮件模板库</h1>
          <p class="text-sm text-muted-foreground mt-1">催款 / 报价 / 邀约 / 致歉 / 拒绝 / 暂停 / 感谢 8 场景模板，参数化替换一键出信</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        选场景 → 填参数（对方称呼、项目名、金额、日期……）→ 右侧实时合成完整邮件（主题 / 称呼 / 正文 / 落款）。
        高频场景附英文版一键切换；每个模板附一条使用要点，避开商务写作的措辞红线。全部替换在本地完成，内容不上传。
        <span class="text-foreground font-medium">模板仅供参考，正式文书请结合实际业务与合同条款调整。</span>
      </p>
    </div>

    <!-- 场景 Tab -->
    <div class="no-print mb-4">
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="s in SCENES"
          :key="s.id"
          type="button"
          @click="selectScene(s.id)"
          :class="currentSceneId === s.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
          class="px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
        >{{ s.name }}</button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：版本切换 + 参数表单 -->
      <div class="no-print space-y-4">
        <!-- 版本与语言 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-lg font-semibold flex items-center">
              <FileText class="w-5 h-5 mr-2 text-primary" /> {{ currentScene.name }}
              <span v-if="currentVariants.length > 1" class="text-sm font-normal text-muted-foreground ml-1">（{{ currentVariants.length }} 个版本）</span>
            </h2>
            <div v-if="currentVariant && currentVariant.en" class="flex gap-1.5">
              <button
                v-for="lg in LANGS"
                :key="lg.id"
                type="button"
                @click="lang = lg.id"
                :class="lang === lg.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              >{{ lg.label }}</button>
            </div>
          </div>

          <div v-if="currentVariants.length > 1" class="flex flex-wrap gap-1.5">
            <button
              v-for="v in currentVariants"
              :key="v.id"
              type="button"
              @click="selectVariant(v.id)"
              :class="currentVariantId === v.id ? 'bg-primary/10 text-primary border-primary/40' : 'bg-muted hover:bg-muted/80 text-muted-foreground border-border'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
            >{{ v.variant }}</button>
          </div>

          <div v-if="currentVariant" class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
            <TriangleAlert class="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
            <p class="text-xs leading-relaxed text-foreground">
              <strong>使用要点：</strong>{{ currentVariant.tip }}
            </p>
          </div>

          <p v-if="lang === 'en' && currentVariant && currentVariant.en" class="text-xs text-muted-foreground">
            英文版与中文版共用同一组参数，填一次即可生成双语信件；英文语境中日期与金额建议按国际惯例书写（如 Nov 7, 2026 / USD 8,000）。
          </p>
        </div>

        <!-- 参数表单 -->
        <div v-if="currentVariant" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 class="text-base font-semibold flex items-center">
            <PenLine class="w-4 h-4 mr-2 text-primary" /> 填写参数
            <span class="text-xs font-normal text-muted-foreground ml-2">未填写的占位符以「____」显示，可打印后手写补填</span>
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="f in currentVariant.fields" :key="f.key">
              <label :for="'bf-' + f.key" class="block text-sm font-medium text-foreground mb-1">{{ f.label }}</label>
              <input
                :id="'bf-' + f.key"
                v-model="form[f.key]"
                type="text"
                maxlength="60"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                :placeholder="f.placeholder"
              />
            </div>
          </div>
          <div class="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              @click="copyLetter"
              class="flex-1 min-w-[140px] px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
            >
              <Copy class="w-4 h-4" /> 一键复制完整邮件
            </button>
            <button
              type="button"
              @click="copySubject"
              class="px-4 py-2.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition flex items-center justify-center gap-1.5"
            >
              <Copy class="w-4 h-4" /> 只复制主题
            </button>
            <button
              type="button"
              @click="resetForm"
              class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-muted-foreground transition flex items-center justify-center gap-1.5"
            >
              <RotateCw class="w-4 h-4" /> 清空
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：邮件预览 -->
      <div class="bg-card border border-border rounded-lg p-6 preview-panel">
        <h2 class="text-lg font-semibold flex items-center mb-4 no-print">
          <Eye class="w-5 h-5 mr-2 text-primary" /> 邮件预览（实时合成）
        </h2>
        <div v-if="composed" class="bg-white text-black border border-border rounded-lg shadow-sm p-6 sm:p-8 letter-paper">
          <p class="text-sm mb-4 pb-3 border-b border-black/15">
            <span class="text-black/50 mr-2">主题：</span>
            <span class="font-medium">{{ composed.subject }}</span>
          </p>
          <p class="text-[15px] font-medium mb-3">{{ composed.salutation }}</p>
          <p class="text-[15px] leading-[1.9] whitespace-pre-wrap mb-3">{{ composed.body }}</p>
          <p v-if="composed.closing" class="text-[15px] mb-3">{{ composed.closing }}</p>
          <p class="text-[14px] leading-[1.8] whitespace-pre-wrap text-black/80 text-right">{{ composed.signature }}</p>
        </div>
        <div v-else class="border border-dashed border-border rounded-lg h-64 flex flex-col items-center justify-center text-center px-8 no-print">
          <Mail class="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p class="text-sm font-medium text-muted-foreground">选择场景并填写参数后，此处实时生成邮件</p>
        </div>
        <p class="no-print text-xs text-muted-foreground mt-3">
          发送前请核对：金额与账期数字、对方与公司名称是否有错别字、附件是否已上传。催款类邮件建议在电话或即时消息沟通之后再发，作为正式留痕。
        </p>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="group bg-card border border-border rounded-lg p-6 mb-12 no-print" open>
      <summary class="text-2xl font-bold text-foreground cursor-pointer list-none flex items-center justify-between">
        <span><span class="text-primary mr-2">#</span>关于商务邮件</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div class="space-y-4 text-sm text-muted-foreground leading-relaxed mt-4">
        <p>
          商务邮件是合作双方最常用的正式沟通载体：它比即时消息有留痕效力，比电话更从容，也最能体现一方职业化程度。
          本工具内置催款提醒、报价跟进、会议邀约、合作邀约、延迟交付致歉、委婉拒绝、项目暂停通知、年终感谢八类高频场景，
          每类给出参数化模板，填空即可合成完整邮件；催款（正式版）、报价跟进、会议邀约、延迟致歉四个高频场景另附英文版。
          <span class="text-foreground font-medium">模板仅供参考，正式文书请结合实际业务与合同条款调整。</span>
        </p>

        <h3 class="text-lg font-semibold text-foreground">商务邮件的标准结构</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">主题行</span>：一句话说清「事项 + 关键数字/期限」，让收件人不点开也知道轻重，如「付款提醒：A 项目 5.8 万元已逾期 12 天」。</li>
          <li><span class="text-foreground font-medium">称呼</span>：顶格写「职务/姓氏 + 好」，首次联系用全称，英文用 Dear + 姓氏。</li>
          <li><span class="text-foreground font-medium">正文三段</span>：首段一句话交代来意；中段给事实与数字（时间、金额、进度）；末段给出明确的下一步动作与截止点。</li>
          <li><span class="text-foreground font-medium">落款</span>：姓名 + 公司 + 日期（必要时加职务与联系方式），英文用 Best regards / Sincerely。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground">催款函的正确步骤：提醒 → 催告 → 法务</h3>
        <ol class="list-decimal pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">私下提醒</span>：逾期先电话或即时消息私下确认是否流程延误，给对方台阶，多数账款止步于这一步。</li>
          <li><span class="text-foreground font-medium">书面催告</span>：私下未果再发正式函件，写清合同依据、金额、逾期天数、付款期限与后果，保持语气克制、立场明确，并留存送达记录。</li>
          <li><span class="text-foreground font-medium">法务介入</span>：催告后仍不付的，整理合同、对账单、往来记录交法务处理（律师函 / 支付令 / 诉讼），同时评估继续合作的价值。</li>
        </ol>
        <p>措辞红线：催款先私下、函件留痕不人身攻击；致歉必须给补救方案与新交付日；拒绝给真实理由并留后续合作钩子；砍价拒绝先讲价值再给替代让步。</p>

        <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-foreground">模板里的占位符没填完会怎样？</h4>
            <p class="mt-1">未填写的占位符会以「____」显示，方便打印后手工补填；但金额、日期、期限这类关键数字建议务必在电子版填好再发，避免歧义。</p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">催款邮件一上来就发正式版吗？</h4>
            <p class="mt-1">不建议。先用友好版或私下沟通确认；确认对方确实拖欠且无合理解释后，再升级到正式版并明确期限与后果。升级路径本身就是后续主张权利的证据链。</p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">英文邮件有什么要注意的？</h4>
            <p class="mt-1">称呼用 Dear + 姓氏（Mr./Ms. 或直接姓），避免直译中文客套；结尾用 Best regards 或 Sincerely；日期写 Nov 7, 2026 这类格式，金额标清币种（USD 8,000）。</p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">要给很多人发同样内容的信怎么办？</h4>
            <p class="mt-1">
              可配合站内 <a href="/tools/mail-merge-tool/" class="text-primary hover:underline">批量文本生成器</a>：
              把本页模板正文复制过去，把对方称呼、项目名等参数改写成 <code v-pre>{{字段}}</code>，再贴上名单 CSV 即可批量生成个性化邮件。
            </p>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground">参考来源</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>八类场景模板：按外贸与商务礼仪通行书信结构（主题 / 称呼 / 正文三段 / 落款）及常见商务信函范本整理，模板仅供参考，正式文书请结合实际。</li>
          <li>催款步骤（提醒 → 催告 → 法务）：通行的应收账款催收实践路径，涉及诉讼请咨询执业律师。</li>
          <li>英文版措辞：参照国际商务信函（Business Correspondence）通行格式。</li>
        </ul>
        <p class="text-xs">所有替换均在你的浏览器本地完成，填写内容不上传。</p>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :current-tool-id="'business-letter-templates'" :category="'text'" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Mail, FileText, PenLine, Copy, RotateCw, Eye, TriangleAlert, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '商务邮件模板库 - 催款/报价/邀约/致歉等8场景中英文模板在线生成',
  description: '在线商务邮件模板库：催款提醒（友好/正式）、报价跟进、会议邀约、合作邀约、延迟交付致歉、委婉拒绝、项目暂停通知、年终感谢 8 场景参数化模板，填空实时合成主题/称呼/正文/落款，4 个高频场景附英文版，一键复制，本地处理不上传',
  keywords: '商务邮件模板, 催款函模板, 催款邮件怎么写, 英文商务邮件模板, 会议邀请邮件, 合作邀约邮件, 延迟交付道歉信, 拒绝合作话术',
  author: '有条工具',
  ogTitle: '商务邮件模板库 - 8 场景参数化模板 | 有条工具',
  ogDescription: '催款/报价/邀约/致歉/拒绝/暂停/感谢 8 场景，填参数实时合成完整邮件，附英文版',
  ogUrl: 'https://www.util.cn/tools/business-letter-templates',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '商务邮件模板库',
  twitterDescription: '8 场景参数化商务邮件模板，填空即得，一键复制'
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
          name: '商务邮件模板库',
          url: 'https://www.util.cn/tools/business-letter-templates',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '催款/报价/邀约/致歉/拒绝/暂停/感谢 8 场景模板',
            '参数化占位符填空实时合成邮件',
            '催款与致歉分场景措辞要点提示',
            '4 个高频场景英文版一键切换',
            '一键复制完整邮件或主题',
            '本地替换不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本工具', item: 'https://www.util.cn/text/' },
            { '@type': 'ListItem', position: 3, name: '商务邮件模板库', item: 'https://www.util.cn/tools/business-letter-templates/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '商务邮件的标准结构是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '主题行（事项+关键数字/期限）、顶格称呼、正文三段（来意、事实与数字、下一步动作）、落款（姓名+公司+日期）。本工具按此结构逐段合成邮件。' }
            },
            {
              '@type': 'Question',
              name: '催款邮件一上来就发正式版吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不建议。逾期先私下沟通确认是否流程延误；确认对方拖欠且无合理解释后，再发正式催告函并明确期限与后果，最后一步才是法务介入。模板仅供参考，正式文书请结合实际。' }
            },
            {
              '@type': 'Question',
              name: '英文商务邮件有什么要注意的？',
              acceptedAnswer: { '@type': 'Answer', text: '称呼用 Dear + 姓氏，避免直译中文客套；结尾用 Best regards 或 Sincerely；日期按 Nov 7, 2026 格式，金额标清币种如 USD 8,000。' }
            },
            {
              '@type': 'Question',
              name: '要给很多人发同样内容的信怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '可配合站内批量文本生成器：把模板正文复制过去，将参数改写成 {{字段}} 占位符，贴上名单 CSV 即可批量生成个性化邮件。' }
            }
          ]
        }
      ]
    })
  }]
})

/* ==== PURE:BEGIN ==== */
const PLACEHOLDER = '____'
const LANGS = [{ id: 'zh', label: '中文版' }, { id: 'en', label: 'English' }]

// 常用字段（各模板复用，占位符统一 {{中文字段}}）
const F = {
  salutation: { key: '对方称呼', label: '对方称呼', placeholder: '如 王经理' },
  company: { key: '对方公司', label: '对方公司', placeholder: '如 某某贸易有限公司' },
  project: { key: '项目名', label: '项目/订单名', placeholder: '如 3 月度对账单' },
  amount: { key: '金额', label: '金额', placeholder: '如 ¥58,000（英文版写 USD 8,000）' },
  sender: { key: '发件人', label: '你的姓名', placeholder: '如 李明' },
  myCompany: { key: '我方公司', label: '你的公司', placeholder: '如 某某科技有限公司' },
  date: { key: '日期', label: '发信日期', placeholder: '如 2026-11-07' }
}

function signBlock() {
  return '{{发件人}}\n{{我方公司}}\n{{日期}}'
}

// 占位符替换：缺失字段渲染为 ____，不残留 {{ }}
function fillTemplate(text, values) {
  return String(text)
    .replace(/\{\{\s*([^}]+?)\s*\}\}/g, (m, key) => {
      const v = values ? values[key] : undefined
      const s = v === undefined || v === null ? '' : String(v).trim()
      return s || PLACEHOLDER
    })
    .replace(/\{\{[^}]*\}\}/g, PLACEHOLDER)
}

// 提取模板文本中的全部占位符（去重，保持出现顺序）
function extractPlaceholders(text) {
  const re = /\{\{\s*([^}]+?)\s*\}\}/g
  const seen = new Set()
  const out = []
  let m
  while ((m = re.exec(String(text || ''))) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1])
      out.push(m[1])
    }
  }
  return out
}

// 合成邮件：subject / salutation / body / closing / signature / fullText
function composeLetter(tpl, values, lang) {
  const t = lang === 'en' && tpl.en ? tpl.en : tpl.zh
  const subject = fillTemplate(t.subject, values)
  const salutation = fillTemplate(t.salutation, values)
  const body = fillTemplate(t.body, values)
  const closing = fillTemplate(t.closing, values)
  const signature = fillTemplate(t.signature, values)
  const lines = []
  if (subject) lines.push('主题：' + subject)
  lines.push(salutation, body)
  if (closing) lines.push(closing)
  lines.push(signature)
  return { subject, salutation, body, closing, signature, fullText: lines.join('\n') }
}

// 场景 × 版本模板（zh 必有；en 为可选英文版）
const SCENES = [
  {
    id: 'payment',
    name: '催款提醒',
    variants: [
      {
        id: 'payment-friendly',
        variant: '友好版',
        tip: '催款先私下沟通（电话/微信），邮件作为正式留痕；友好版适合逾期初期的第一次提醒，账期节点仍要写明确。',
        fields: [F.salutation, F.company, F.project, F.amount, { key: '付款日', label: '约定付款日', placeholder: '如 2026-10-31' }, F.myCompany, F.sender, F.date],
        zh: {
          subject: '账期提醒：「{{项目名}}」款项待付（{{金额}}）',
          salutation: '{{对方称呼}}您好：',
          body: '冒昧打扰。我们在系统里核对了一下账：{{对方公司}}的「{{项目名}}」款项 {{金额}}，按约定应于 {{付款日}} 付讫，目前尚未到账，估计是流程上有些延误。\n\n麻烦您方便时帮忙确认一下付款安排；如款项已在流程中，请忽略本条提醒。若对账有出入，随时联系我们，我们积极配合核对。\n\n期待您的回复，也感谢一直以来的支持！',
          closing: '顺祝商祺！',
          signature: signBlock()
        },
        en: null
      },
      {
        id: 'payment-formal',
        variant: '正式版',
        tip: '正式函用于私下沟通未果后的书面催告：写清合同依据、金额、期限与后续措施，用词克制但立场明确，并保留送达记录。',
        fields: [F.salutation, F.company, F.project, F.amount, { key: '付款日', label: '约定付款日', placeholder: '如 2026-10-31' }, F.myCompany, F.sender, F.date],
        zh: {
          subject: '付款提醒函：「{{项目名}}」逾期未付（{{金额}}）',
          salutation: '{{对方称呼}}您好：',
          body: '我司与{{对方公司}}就「{{项目名}}」合作产生的合同款项 {{金额}}，按合同约定应于 {{付款日}} 前支付；截至本函发出之日，该笔款项仍未到账，已超出约定付款日。\n\n现正式提请贵司于收到本函后 7 个工作日内完成付款，并将付款凭证发送至我司。如贵司存在付款障碍，请于同一期限内书面告知我司，双方协商处理。\n\n如逾期仍未付款，我司将依据合同约定主张相应逾期责任，届时可能对双方合作及后续项目排期产生影响，望贵司重视并妥善处理。',
          closing: '此致\n敬礼！',
          signature: signBlock()
        },
        en: {
          subject: 'Payment Reminder: Overdue Payment for {{项目名}} ({{金额}})',
          salutation: 'Dear {{对方称呼}},',
          body: 'I am writing to formally remind you that the payment of {{金额}} for "{{项目名}}", which was due on {{付款日}}, remains outstanding.\n\nWe kindly request that the payment be completed within 7 business days upon receipt of this letter, with the remittance advice sent to our accounting contact. Should there be any obstacle preventing timely payment, please notify us in writing within the same period so that we can discuss a solution together.\n\nPlease note that continued non-payment may require us to pursue remedies as stipulated in the contract, which could affect our ongoing cooperation. We appreciate your prompt attention to this matter.',
          closing: 'Best regards,',
          signature: signBlock()
        }
      }
    ]
  },
  {
    id: 'quote',
    name: '报价跟进',
    variants: [
      {
        id: 'quote-followup',
        variant: '标准版',
        tip: '报价跟进别空问「考虑得怎么样」，要带新信息（答疑、有效期、下一步动作）给对方一个回复的台阶。',
        fields: [F.salutation, F.company, F.project, F.amount, { key: '报价有效期', label: '报价有效期至', placeholder: '如 2026-11-30' }, F.myCompany, F.sender, F.date],
        zh: {
          subject: '跟进：「{{项目名}}」报价（{{金额}}）',
          salutation: '{{对方称呼}}您好：',
          body: '前几天我们向{{对方公司}}提交了「{{项目名}}」的报价（合计 {{金额}}），想跟进一下您的评估进展。\n\n如果您在对比方案时还有疑问——比如交付周期、售后支持或付款方式——我可以在您方便的时间安排一次 15 分钟的简短沟通，把细节讲清楚。该报价在 {{报价有效期}} 内有效；超期后如原材料价格波动较大，可能需要重新核算。\n\n无论本次是否合作，都期待您的反馈。',
          closing: '顺祝商祺！',
          signature: signBlock()
        },
        en: {
          subject: 'Follow-up: Quotation for {{项目名}} ({{金额}})',
          salutation: 'Dear {{对方称呼}},',
          body: 'I hope this message finds you well. I am following up on the quotation we submitted to {{对方公司}} for "{{项目名}}" ({{金额}}) and would like to check how your evaluation is going.\n\nIf you have any questions regarding delivery schedule, after-sales support, or payment terms, I would be happy to arrange a brief 15-minute call at your convenience. Please kindly note that the quotation remains valid until {{报价有效期}}.\n\nWe look forward to your feedback, whether or not we proceed this time.',
          closing: 'Best regards,',
          signature: signBlock()
        }
      }
    ]
  },
  {
    id: 'meeting',
    name: '会议邀约',
    variants: [
      {
        id: 'meeting-invite',
        variant: '标准版',
        tip: '会议邀约写清时间、地点、议程三要素，并主动给出冲突改期通道，减少来回拉扯。',
        fields: [F.salutation, { key: '会议主题', label: '会议主题', placeholder: '如 Q4 供应商对账会议' }, { key: '会议时间', label: '会议时间', placeholder: '如 2026-11-14（周五）14:00-15:00' }, { key: '会议时长', label: '预计时长', placeholder: '如 1 小时' }, { key: '会议地点', label: '地点/会议链接', placeholder: '如 3 号楼 402 会议室 / 腾讯会议号 xxx' }, { key: '议程摘要', label: '议程摘要', placeholder: '如 1. 对账差异复盘 2. 下季度排期' }, F.myCompany, F.sender, F.date],
        zh: {
          subject: '会议邀请：「{{会议主题}}」（{{会议时间}}）',
          salutation: '{{对方称呼}}您好：',
          body: '诚邀您参加「{{会议主题}}」专题会议，具体安排如下：\n\n时间：{{会议时间}}（预计 {{会议时长}}）\n地点：{{会议地点}}\n议程：{{议程摘要}}\n\n如该时间与您的安排冲突，请回复方便的时段，我们将尽量调整；若有希望提前讨论的议题，也欢迎一并告知，我们会加入议程。',
          closing: '顺祝商祺！',
          signature: signBlock()
        },
        en: {
          subject: 'Meeting Invitation: {{会议主题}} on {{会议时间}}',
          salutation: 'Dear {{对方称呼}},',
          body: 'I would like to invite you to a meeting on "{{会议主题}}". The details are as follows:\n\nTime: {{会议时间}} (expected duration: {{会议时长}})\nLocation: {{会议地点}}\nAgenda: {{议程摘要}}\n\nIf the proposed time does not suit you, please suggest alternative slots and we will adjust accordingly. Topics you would like to add to the agenda are also welcome.',
          closing: 'Best regards,',
          signature: signBlock()
        }
      }
    ]
  },
  {
    id: 'cooperation',
    name: '合作邀约',
    variants: [
      {
        id: 'cooperation-invite',
        variant: '标准版',
        tip: '合作邀约别只讲自己想得到什么，先写清「对方能得到什么」，并给出低成本的第一步（如 30 分钟线上沟通）。',
        fields: [F.salutation, F.company, { key: '合作方向', label: '合作方向', placeholder: '如 跨境物流渠道共建' }, { key: '我方简介', label: '我方简介', placeholder: '如 主营东南亚仓配，服务 300+ 商家' }, { key: '预期收益', label: '对方预期收益', placeholder: '如 物流成本预计可降 15%，共享双方客群' }, F.myCompany, F.sender, F.date],
        zh: {
          subject: '合作邀约：「{{合作方向}}」（{{我方公司}}）',
          salutation: '{{对方称呼}}您好：',
          body: '一直关注{{对方公司}}在{{合作方向}}上的动作，很认同你们的思路。我是{{我方公司}}的{{发件人}}，先简单介绍我们团队：{{我方简介}}。\n\n我们希望探讨双方在{{合作方向}}上的合作机会，对贵司而言：{{预期收益}}。如果您有兴趣，下一步可以先约一次 30 分钟的线上沟通，我们把各自的资源盘一遍，再判断是否值得深入。\n\n期待您的回复。',
          closing: '顺祝商祺！',
          signature: signBlock()
        },
        en: null
      }
    ]
  },
  {
    id: 'apology',
    name: '延迟交付致歉',
    variants: [
      {
        id: 'delivery-apology',
        variant: '标准版',
        tip: '致歉信的关键是给补救方案与新的明确交付日，并主动建立进度同步机制；只道歉不给方案等于二次伤害。',
        fields: [F.salutation, F.project, { key: '约定交付日', label: '原约定交付日', placeholder: '如 2026-10-20' }, { key: '新交付日', label: '新交付日', placeholder: '如 2026-11-10' }, { key: '延迟原因', label: '延迟原因', placeholder: '如 核心物料供货中断 12 天' }, { key: '补救方案', label: '补救方案', placeholder: '如 分两批先交付 60% 急需部分，并减免本期 5% 费用' }, F.myCompany, F.sender, F.date],
        zh: {
          subject: '致歉与进度更新：「{{项目名}}」交付延迟',
          salutation: '{{对方称呼}}您好：',
          body: '首先向您致歉：原定 {{约定交付日}} 交付的「{{项目名}}」出现延迟，原因是{{延迟原因}}，责任在我们，不做任何推脱。\n\n经内部重新排期，新交付日为 {{新交付日}}。为降低对您业务的影响，我们将提供以下补救：{{补救方案}}。\n\n自本周起，您将在每周五收到书面进度更新；如进度再有任何变化，我们会第一时间同步。再次为给您带来的不便致歉，也感谢您的理解与信任。',
          closing: '此致\n敬礼！',
          signature: signBlock()
        },
        en: {
          subject: 'Sincere Apology and Updated Timeline for {{项目名}}',
          salutation: 'Dear {{对方称呼}},',
          body: 'I am writing to sincerely apologize: the delivery of "{{项目名}}", originally scheduled for {{约定交付日}}, has been delayed due to {{延迟原因}}. The responsibility lies entirely with us, and we make no excuses.\n\nAfter re-planning internally, the new delivery date is {{新交付日}}. To minimize the impact on your business, we will provide the following remedies: {{补救方案}}.\n\nStarting this week, you will receive a written progress update every Friday, and we will notify you immediately should there be any further change. We apologize again for the inconvenience and truly appreciate your understanding.',
          closing: 'Sincerely,',
          signature: signBlock()
        }
      }
    ]
  },
  {
    id: 'decline',
    name: '拒绝对话术',
    variants: [
      {
        id: 'decline-coop',
        variant: '委婉拒绝合作',
        tip: '拒绝要给一个真实、不贬低对方的理由，并留一个「未来再合作」的钩子；模糊拖延比明确拒绝更伤关系。',
        fields: [F.salutation, F.company, { key: '合作事项', label: '合作事项', placeholder: '如 联名产品开发' }, { key: '拒绝原因', label: '拒绝原因', placeholder: '如 本季度产能已排满，无法保证交付质量' }, { key: '保持联系方式', label: '保持联系的方式', placeholder: '如 每季度行业沙龙，欢迎保持交流' }, F.myCompany, F.sender, F.date],
        zh: {
          subject: '关于「{{合作事项}}」的回复',
          salutation: '{{对方称呼}}您好：',
          body: '非常感谢{{对方公司}}的信任，以及「{{合作事项}}」的合作邀约——我们认真评估了方案。\n\n很遗憾，结合我们当前的{{拒绝原因}}，短期内无法按贵司期望的规模推进这项合作。与其勉强接下、耽误双方时间，我们更愿意坦诚相告。\n\n虽然这次暂无法成行，但非常希望保持联系（{{保持联系方式}}），待条件成熟时第一时间对接。也预祝贵司项目顺利。',
          closing: '顺祝商祺！',
          signature: signBlock()
        },
        en: null
      },
      {
        id: 'decline-price',
        variant: '委婉拒绝砍价',
        tip: '拒绝砍价不硬顶：先给价格背后的价值依据，再在不降价的框架内给替代让步（分期、减范围、延长服务）。',
        fields: [F.salutation, F.project, { key: '报价金额', label: '报价金额', placeholder: '如 ¥120,000' }, { key: '价值说明', label: '价值说明', placeholder: '如 含 2 年质保与驻场实施，报价为成本加合理利润' }, { key: '可让步项', label: '可让步方向', placeholder: '如 货款分两期支付，或先做核心模块二期再谈' }, F.myCompany, F.sender, F.date],
        zh: {
          subject: '关于「{{项目名}}」价格的说明',
          salutation: '{{对方称呼}}您好：',
          body: '感谢您对「{{项目名}}」的认可。关于价格，我们的报价 {{报价金额}} 是在成本与交付质量之间认真核算后的结果，实难再降：{{价值说明}}。\n\n如果预算确实有压力，我们愿意从这两个方向想办法：{{可让步项}}——在不牺牲交付质量的前提下，把总成本谈进您的预算区间。\n\n价格上我们希望保持透明一致：同一口径面对所有客户，这也是长期合作的信任基础。期待与您找到双方都舒服的方案。',
          closing: '顺祝商祺！',
          signature: signBlock()
        },
        en: null
      }
    ]
  },
  {
    id: 'pause',
    name: '项目暂停通知',
    variants: [
      {
        id: 'project-pause',
        variant: '标准版',
        tip: '暂停通知要写清起点、原因、已完成工作的归属与预计恢复时间，并主动谈结算口径，避免留下扯皮的尾巴。',
        fields: [F.salutation, F.project, { key: '暂停起始日', label: '暂停起始日', placeholder: '如 2026-11-15' }, { key: '暂停原因', label: '暂停原因', placeholder: '如 甲方预算调整，Q4 相关预算冻结' }, { key: '预计恢复时间', label: '预计恢复时间', placeholder: '如 2027 年 2 月（以预算批复为准）' }, { key: '已完成部分', label: '已完成部分说明', placeholder: '如 需求调研与原型已完成并归档' }, F.myCompany, F.sender, F.date],
        zh: {
          subject: '项目进展通知：「{{项目名}}」自 {{暂停起始日}} 起暂停',
          salutation: '{{对方称呼}}您好：',
          body: '经内部评估，需向您同步：「{{项目名}}」自 {{暂停起始日}} 起暂停推进，原因是{{暂停原因}}。\n\n截至暂停日，项目已完成的部分包括：{{已完成部分}}，相关成果已归档保管；已发生费用按合同约定结算，我们随时配合对账。\n\n目前预计恢复时间为{{预计恢复时间}}；恢复前如需调整方案或处理结算事宜，请随时与我们联系。给贵司带来的不确定性，敬请谅解。',
          closing: '此致\n敬礼！',
          signature: signBlock()
        },
        en: null
      }
    ]
  },
  {
    id: 'thanks',
    name: '年终感谢',
    variants: [
      {
        id: 'year-end-thanks',
        variant: '标准版',
        tip: '年终感谢信贵在具体：写一件只有双方知道的合作细节，比十句套话更能维系关系。',
        fields: [F.salutation, F.company, { key: '年度合作事项', label: '年度合作事项', placeholder: '如 三期交付、联合发布会、渠道共建' }, { key: '亮点时刻', label: '亮点时刻', placeholder: '如 双十一当天双方团队通宵保障大促零故障' }, { key: '明年期待', label: '明年期待', placeholder: '如 把合作扩展到华南仓网' }, F.myCompany, F.sender, F.date],
        zh: {
          subject: '一路同行——年终致谢',
          salutation: '{{对方称呼}}您好：',
          body: '又到岁末。回望这一年，{{对方公司}}与我们携手推进了{{年度合作事项}}，每一项顺利落地都离不开您的支持，其中{{亮点时刻}}尤其让人印象深刻。\n\n合作中难免有需要磨合的地方，感谢贵司始终以解决问题为先的态度。新的一年，我们期待{{明年期待}}；也提前祝您和团队新年顺遂、业绩长虹。',
          closing: '顺祝商祺！',
          signature: signBlock()
        },
        en: null
      }
    ]
  }
]

function getVariant(variantId) {
  for (const s of SCENES) {
    const v = s.variants.find((x) => x.id === variantId)
    if (v) return v
  }
  return null
}

// 由表单构建替换值表（未填字段留空 → 合成时显示 ____）
function buildValues(form) {
  const values = {}
  for (const s of SCENES) {
    for (const v of s.variants) {
      for (const f of v.fields) {
        values[f.key] = String((form && form[f.key]) ?? '').trim()
      }
    }
  }
  return values
}

// 初始化表单
function initForm(variant) {
  const form = {}
  for (const f of variant.fields) form[f.key] = ''
  return form
}
/* ==== PURE:END ==== */

// ---------- 页面状态 ----------
const currentSceneId = ref('payment')
const currentVariantId = ref('payment-friendly')
const lang = ref('zh')
const form = reactive(initForm(getVariant('payment-friendly')))

const tool = tools.find((t) => t.id === 'business-letter-templates')

const currentScene = computed(() => SCENES.find((s) => s.id === currentSceneId.value) || SCENES[0])
const currentVariants = computed(() => currentScene.value.variants)
const currentVariant = computed(() => getVariant(currentVariantId.value) || currentVariants.value[0])
const hasEnglish = computed(() => !!(currentVariant.value && currentVariant.value.en))

// 英文版不存在时自动回退中文
const effectiveLang = computed(() => (lang.value === 'en' && hasEnglish.value ? 'en' : 'zh'))

const values = computed(() => buildValues(form))
const composed = computed(() => composeLetter(currentVariant.value, values.value, effectiveLang.value))

// 切换场景 / 版本：按模板字段重置表单（保留共有字段已填内容与日期）
function selectScene(id) {
  if (currentSceneId.value === id) return
  const scene = SCENES.find((s) => s.id === id)
  if (!scene) return
  currentSceneId.value = id
  selectVariant(scene.variants[0].id)
}

function selectVariant(variantId) {
  const tpl = getVariant(variantId)
  if (!tpl) return
  const prev = { ...form }
  Object.keys(form).forEach((k) => delete form[k])
  Object.assign(form, initForm(tpl))
  for (const f of tpl.fields) {
    if (prev[f.key]) form[f.key] = prev[f.key]
  }
  currentVariantId.value = tpl.id
  if (!tpl.en) lang.value = 'zh'
}

function resetForm() {
  Object.assign(form, initForm(currentVariant.value))
}

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

async function copyLetter() {
  try {
    await navigator.clipboard.writeText(composed.value.fullText)
    alert('已复制')
  } catch (e) {
    fallbackCopy(composed.value.fullText, '已复制')
  }
}

async function copySubject() {
  try {
    await navigator.clipboard.writeText(composed.value.subject)
    alert('已复制')
  } catch (e) {
    fallbackCopy(composed.value.subject, '已复制')
  }
}

// 日期字段默认今天（仅客户端设置，避免 SSR 不一致）
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  const d = new Date()
  const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  if (!form['日期']) form['日期'] = today
})
</script>

<style scoped>
.letter-paper {
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
}
@media print {
  .no-print {
    display: none !important;
  }
  .letter-paper {
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
}
</style>
