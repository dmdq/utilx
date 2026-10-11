<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Mail class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">HTML邮件签名生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">table+全内联样式，兼容 Gmail / Outlook / 企业微信邮箱 / QQ 邮箱</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        填写姓名、职位、联系方式等信息，实时生成纯 table 布局 + 全内联 style 的 HTML 邮件签名（邮件客户端最兼容的写法），提供简约商务、活泼彩色、极简黑白三套中文模板与横版/竖版两种布局。一键复制后粘贴进邮箱签名设置即可，全部生成在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 表单区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Settings2 class="w-5 h-5 mr-2 text-primary" /> 签名信息
        </h2>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">姓名 *</label>
            <input v-model="cfg.name" type="text" placeholder="张三" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">职位</label>
            <input v-model="cfg.title" type="text" placeholder="产品经理" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">公司</label>
          <input v-model="cfg.company" type="text" placeholder="某某科技有限公司" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">手机</label>
            <input v-model="cfg.phone" type="text" placeholder="13800138000" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">电话</label>
            <input v-model="cfg.tel" type="text" placeholder="010-88886666" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">邮箱</label>
            <input v-model="cfg.email" type="text" placeholder="zhangsan@example.com" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">网站</label>
            <input v-model="cfg.website" type="text" placeholder="https://example.com" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">地址</label>
          <input v-model="cfg.address" type="text" placeholder="杭州市西湖区文三路100号" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">头像 URL（可选）</label>
          <input v-model="cfg.avatar" type="text" placeholder="https://example.com/avatar.png" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <p class="text-xs text-muted-foreground mt-1.5">建议使用 https 正方形图片，邮件客户端中按 80×80 显示</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">主题色</label>
          <div class="flex gap-2">
            <button
              v-for="c in COLOR_PALETTE"
              :key="c"
              @click="cfg.color = c"
              class="w-9 h-9 rounded-lg transition"
              :class="cfg.color === c ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-gray-900' : 'opacity-80 hover:opacity-100'"
              :style="{ backgroundColor: c }"
              :title="c"
            ></button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">模板</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="t in TEMPLATES"
                :key="t.id"
                @click="cfg.template = t.id"
                :class="cfg.template === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ t.label }}</button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">布局</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                @click="cfg.layout = 'h'"
                :class="cfg.layout === 'h' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >横版</button>
              <button
                @click="cfg.layout = 'v'"
                :class="cfg.layout === 'v' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >竖版</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 预览与导出区 -->
      <div class="space-y-4">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Eye class="w-5 h-5 mr-2 text-primary" /> 实时预览
            </h2>
            <button
              @click="copyHtml"
              :disabled="!cfg.name"
              class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check v-if="copied" class="w-4 h-4" />
              <Copy v-else class="w-4 h-4" />
              {{ copied ? '已复制' : '一键复制 HTML' }}
            </button>
          </div>

          <div v-if="cfg.name" class="p-5 bg-white rounded-lg border border-border overflow-x-auto">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-html="signatureHtml"></div>
          </div>
          <div v-else class="p-8 text-center text-muted-foreground text-sm">填写姓名后即可看到签名预览</div>
          <p class="text-xs text-muted-foreground mt-3">
            复制后到邮箱设置的"签名"编辑器中直接粘贴（Ctrl+V / Cmd+V）；已同时写入富文本（text/html）与纯文本（text/plain）两种剪贴板格式。
          </p>
        </div>

        <!-- 查看源码折叠块 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <button @click="showSource = !showSource" class="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition">
            <Code2 class="w-4 h-4" />
            {{ showSource ? '收起 HTML 源码' : '查看 HTML 源码' }}
            <ChevronUp v-if="showSource" class="w-4 h-4" />
            <ChevronDown v-else class="w-4 h-4" />
          </button>
          <pre v-show="showSource" class="mt-3 p-4 bg-muted rounded-lg text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">{{ signatureHtml }}</pre>
        </div>
      </div>
    </div>

    <!-- 使用提示 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        兼容性提示：签名采用 table 布局与全内联样式（邮件客户端会丢弃 style 标签和部分 CSS），字体栈为 -apple-system / PingFang SC / Microsoft YaHei，字号 12-14px；头像请使用 https 外链，部分客户端（如 Outlook）默认可能不显示图片，属于正常现象。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 HTML 邮件签名</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            一份专业的中文邮件签名通常包含姓名、职位、公司、手机、邮箱与官网，既是身份名片也是品牌露出。但邮件客户端（Gmail、Outlook、企业微信邮箱、QQ 邮箱等）对 CSS 的支持非常有限：浮动、flex、外部样式表都可能失效，因此业界标准做法是 table 布局 + 全内联 style。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么必须用 table 加内联样式</h3>
          <p>
            Outlook 使用 Word 渲染引擎、多数网页邮箱会过滤 style 标签并剥离 class，只有写在每个标签 style 属性里的样式能稳定生效。本工具生成的签名全部使用 table/tr/td 结构，分隔竖线用 td 的 border 实现，字体栈为 -apple-system、PingFang SC、Microsoft YaHei，字号控制在 12-14px，保证中文显示清晰不跑版。
          </p>
          <h3 class="text-lg font-semibold text-foreground">三套模板怎么选</h3>
          <p>
            简约商务适合大多数职场场景，主题色只做点缀；活泼彩色适合市场、运营、设计等对外展示岗位，姓名色块更醒目；极简黑白适合律师、财务等需要克制表达的形象。横版信息密度高适合桌面端阅读，竖版更紧凑适合签名末尾附联系方式多的场景，两套布局可随时切换预览。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">粘贴后样式会丢失吗？</span>本工具把 HTML 同时以富文本格式写入剪贴板，粘贴到邮箱签名编辑器时样式随内容一并带入；个别编辑器只接受纯文本时，可改用"查看源码"粘贴到源码/HTML 模式。</li>
            <li><span class="text-foreground font-medium">头像为什么有时显示不出来？</span>部分客户端默认屏蔽外链图片（需点击"显示图片"），建议使用 https 稳定图床的正方形图片。</li>
            <li><span class="text-foreground font-medium">会上传我的信息吗？</span>不会，签名 HTML 完全在浏览器本地生成，填写的内容不经过任何服务器。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'email-signature-generator'" :category="'design'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Mail, Settings2, Eye, Copy, Check, Code2, Info, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'HTML邮件签名生成器 - table+内联样式，兼容Gmail/Outlook/企业微信邮箱',
  description: '中文友好的邮件签名在线生成器，三套模板两种布局，生成纯 table 布局与全内联样式的 HTML 签名，一键复制粘贴到邮箱签名设置，纯本地生成',
  keywords: '邮件签名生成, 邮箱签名模板, html签名, outlook签名, 企业微信邮箱签名, qq邮箱签名',
  author: 'Util工具箱',
  ogTitle: 'HTML邮件签名生成器 - 有条工具',
  ogDescription: 'table+全内联样式签名，兼容 Gmail / Outlook / 企业微信邮箱',
  ogUrl: 'https://www.util.cn/tools/email-signature-generator',
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
          name: 'HTML邮件签名生成器',
          url: 'https://www.util.cn/tools/email-signature-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['三套中文模板', '横版/竖版布局', 'table+全内联样式', '一键复制富文本', '源码查看', '主题色自定义']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '设计工具', item: 'https://www.util.cn/design/' },
            { '@type': 'ListItem', position: 3, name: 'HTML邮件签名生成器', item: 'https://www.util.cn/tools/email-signature-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么邮件签名要用 table 加内联样式？',
              acceptedAnswer: { '@type': 'Answer', text: 'Outlook 用 Word 引擎渲染、网页邮箱会过滤 style 标签和 class，只有内联样式能稳定生效，table 布局兼容性最好。' }
            },
            {
              '@type': 'Question',
              name: '粘贴到邮箱后样式会丢失吗？',
              acceptedAnswer: { '@type': 'Answer', text: '复制时已同时写入 text/html 与 text/plain 两种剪贴板格式，粘贴到签名编辑器即带样式；个别编辑器需切换到源码模式粘贴。' }
            },
            {
              '@type': 'Question',
              name: '头像显示不出来怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '部分客户端默认屏蔽外链图片，收件人点击"显示图片"即可；建议使用 https 图床的正方形图片。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'email-signature-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 常量 ----------
const SIG_FONT = "-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif"
const COLOR_PALETTE = ['#2563eb', '#0d9488', '#16a34a', '#ea580c', '#7c3aed', '#1f2937']
const TEMPLATES = [
  { id: 'biz', label: '简约商务' },
  { id: 'vivid', label: '活泼彩色' },
  { id: 'mono', label: '极简黑白' }
]

// ---------- 状态 ----------
const cfg = ref({
  name: '张三',
  title: '产品经理',
  company: '某某科技有限公司',
  phone: '13800138000',
  tel: '',
  email: 'zhangsan@example.com',
  website: '',
  address: '',
  avatar: '',
  color: '#2563eb',
  template: 'biz',
  layout: 'h'
})
const copied = ref(false)
const showSource = ref(false)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- HTML 生成（table + 全内联样式） ----------
const escHtml = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const buildSignature = (c) => {
  const color = c.color || '#2563eb'
  const tpl = c.template
  const isMono = tpl === 'mono'
  const isVivid = tpl === 'vivid'
  const dividerColor = isMono ? '#d1d5db' : color
  const linkColor = isMono ? '#111827' : color
  const textColor = isMono ? '#111827' : '#374151'
  const labelColor = isMono ? '#6b7280' : '#9ca3af'

  const name = escHtml(c.name)
  const title = escHtml(c.title)
  const company = escHtml(c.company)
  let nameBlock = ''
  if (isVivid) {
    nameBlock = `<span style="background-color:${color};color:#ffffff;padding:2px 8px;border-radius:4px;font-size:14px;font-weight:bold;display:inline-block;">${name}</span>`
    if (c.title) nameBlock += `&nbsp;<span style="font-size:12px;font-weight:bold;color:${color};">${title}</span>`
    if (c.company) nameBlock += `<div style="font-size:12px;color:${textColor};margin-top:4px;">${company}</div>`
  } else if (isMono) {
    nameBlock = `<span style="font-size:14px;font-weight:bold;color:#111827;letter-spacing:1px;">${name}</span>`
    if (c.title) nameBlock += `&nbsp;<span style="font-size:12px;color:#6b7280;">${title}</span>`
    if (c.company) nameBlock += `<div style="font-size:12px;color:#111827;margin-top:4px;">${company}</div>`
  } else {
    nameBlock = `<span style="font-size:14px;font-weight:bold;color:#111827;border-left:3px solid ${color};padding-left:8px;">${name}</span>`
    if (c.title) nameBlock += `&nbsp;<span style="font-size:12px;color:#6b7280;">${title}</span>`
    if (c.company) nameBlock += `<div style="font-size:12px;color:${textColor};margin-top:4px;border-left:3px solid ${color};padding-left:8px;">${company}</div>`
  }

  const lines = []
  const pushLine = (label, valueHtml) => {
    lines.push(`<div style="font-size:12px;line-height:1.7;"><span style="color:${labelColor};">${label}：</span><span style="color:${textColor};">${valueHtml}</span></div>`)
  }
  if (c.phone) pushLine('手机', escHtml(c.phone))
  if (c.tel) pushLine('电话', escHtml(c.tel))
  if (c.email) pushLine('邮箱', `<a href="mailto:${escHtml(c.email)}" style="color:${linkColor};text-decoration:none;">${escHtml(c.email)}</a>`)
  if (c.website) pushLine('网站', `<a href="${escHtml(c.website)}" style="color:${linkColor};text-decoration:none;">${escHtml(c.website)}</a>`)
  if (c.address) pushLine('地址', escHtml(c.address))
  const contactHtml = lines.join('')

  const avatarHtml = c.avatar
    ? `<img src="${escHtml(c.avatar)}" width="80" height="80" alt="${name}" style="width:80px;height:80px;border-radius:8px;border:2px solid ${isMono ? '#d1d5db' : color};display:block;" />`
    : ''

  if (c.layout === 'v') {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${SIG_FONT};border-collapse:collapse;">` +
      (avatarHtml ? `<tr><td style="padding:0 0 10px 0;">${avatarHtml}</td></tr>` : '') +
      `<tr><td style="padding:0 0 6px 0;">${nameBlock}</td></tr>` +
      `<tr><td style="border-top:2px solid ${dividerColor};padding:6px 0 0 0;">${contactHtml}</td></tr>` +
      `</table>`
  }
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${SIG_FONT};border-collapse:collapse;"><tr>` +
    (avatarHtml ? `<td style="padding:0 12px 0 0;vertical-align:middle;">${avatarHtml}</td>` : '') +
    `<td style="width:1px;padding:0;border-right:2px solid ${dividerColor};"></td>` +
    `<td style="padding:0 0 0 14px;vertical-align:top;"><div style="margin-bottom:5px;">${nameBlock}</div>${contactHtml}</td>` +
    `</tr></table>`
}

const signatureHtml = computed(() => buildSignature(cfg.value))

// ---------- 复制（富文本 + 纯文本两种格式） ----------
const copyHtml = async () => {
  const html = signatureHtml.value
  try {
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([html], { type: 'text/plain' })
      })
      await navigator.clipboard.write([item])
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(html)
    } else {
      const ta = document.createElement('textarea')
      ta.value = html
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (e) {
    console.error('复制失败', e)
  }
}
</script>
