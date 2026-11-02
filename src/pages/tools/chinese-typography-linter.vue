<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Type class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">中文排版检查器</h1>
          <p class="text-sm text-muted-foreground mt-1">中英文空格、全半角标点、重复标点、"的地得"混淆一站式文案检查</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线中文排版检查工具：按《中文文案排版指北》与主流中文媒体规范检查文案——中英文与数字之间补空格、全角字母数字转半角、
        重复标点与异形省略号压缩、夹在中文里的半角标点转全角、"的地得"高频混淆提示、英文引号转中文引号、感叹号滥用提醒。
        每条规则可单独开关，支持逐条修复与一键全部修复，问题在原文中按级别高亮标注。全部检查在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：规则开关 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <ListChecks class="w-5 h-5 mr-2 text-primary" /> 检查规则
        </h2>
        <p class="text-xs text-muted-foreground leading-relaxed">
          共 {{ LINTER_RULES.length }} 条规则，已开启 <span class="text-foreground font-medium">{{ activeRuleCount }}</span> 条。
          品牌名、代码、公式等特殊内容可关闭对应规则；开关状态自动保存在本地。
        </p>

        <div class="space-y-1">
          <div
            v-for="rule in LINTER_RULES"
            :key="rule.id"
            class="flex items-start gap-3 py-2.5 border-b border-border/60 last:border-0"
          >
            <button
              type="button"
              role="switch"
              :aria-checked="ruleEnabled[rule.id] ? 'true' : 'false'"
              :aria-label="`开关规则：${rule.name}`"
              class="mt-0.5 relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors"
              :class="ruleEnabled[rule.id] ? 'bg-primary' : 'bg-muted border border-border'"
              @click="toggleRule(rule.id)"
            >
              <span
                class="inline-block h-4 w-4 mt-0.5 ml-0.5 rounded-full bg-white shadow transition-transform"
                :class="ruleEnabled[rule.id] ? 'translate-x-4' : 'translate-x-0'"
              ></span>
            </button>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-medium text-foreground">{{ rule.name }}</span>
                <span
                  class="inline-block px-1.5 py-0.5 rounded border text-[10px] font-medium"
                  :class="LEVEL_META[rule.level].badgeClass"
                >{{ LEVEL_META[rule.level].label }}</span>
                <span
                  v-if="ruleEnabled[rule.id] && issuesByRule[rule.id]"
                  class="text-[10px] text-muted-foreground"
                >{{ issuesByRule[rule.id] }} 处</span>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">{{ rule.desc }}</p>
            </div>
          </div>
        </div>

        <p class="text-[11px] leading-relaxed text-muted-foreground bg-muted/50 rounded-lg p-2.5">
          规则出处：整理自《中文文案排版指北》（sparanoid/chinese-copywriting-guidelines）与少数派、公众号等主流中文媒体的排版约定。
          排版规范是约定不是法律，按你的发布平台要求灵活取舍。
        </p>
      </div>

      <!-- 右：输入 + 检查结果（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Type class="w-5 h-5 mr-2 text-primary" /> 待检查文本
          </h2>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-3 py-1.5 text-sm rounded-lg border border-border bg-muted hover:bg-muted/80 text-foreground transition"
              @click="loadSample"
            >载入示例</button>
            <button
              type="button"
              class="px-3 py-1.5 text-sm rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition flex items-center"
              @click="runCheck"
            >
              <Play class="w-4 h-4 mr-1.5" /> 开始检查
            </button>
          </div>
        </div>

        <textarea
          :value="inputText"
          rows="9"
          class="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
          placeholder="粘贴需要检查的中文文案、公众号文章、报告草稿……（上限 50KB，超出自动截断）"
          spellcheck="false"
          @input="onTextareaInput"
        ></textarea>

        <div class="flex items-center justify-between text-xs text-muted-foreground">
          <span>{{ inputText.length }} 字符 · 约 {{ textKbText }} KB / 50 KB</span>
          <span>检查实时进行，修改后结果自动更新</span>
        </div>

        <p
          v-if="truncatedTip"
          class="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5"
        >文本超过 50KB 上限，已截断保留前 50KB，请分段粘贴检查。</p>

        <!-- 统计条 -->
        <div class="grid grid-cols-4 gap-2 text-center">
          <div class="bg-muted/50 rounded-lg p-2.5">
            <p class="text-[10px] text-muted-foreground mb-0.5">问题总数</p>
            <p class="text-xl font-bold text-foreground">{{ issues.length }}</p>
          </div>
          <div class="bg-red-500/10 rounded-lg p-2.5">
            <p class="text-[10px] text-red-600 mb-0.5 flex items-center justify-center"><TriangleAlert class="w-3 h-3 mr-1" />错误</p>
            <p class="text-xl font-bold text-red-600">{{ levelCounts.error }}</p>
          </div>
          <div class="bg-amber-500/10 rounded-lg p-2.5">
            <p class="text-[10px] text-amber-600 mb-0.5">建议</p>
            <p class="text-xl font-bold text-amber-600">{{ levelCounts.warn }}</p>
          </div>
          <div class="bg-sky-500/10 rounded-lg p-2.5">
            <p class="text-[10px] text-sky-600 mb-0.5">风格</p>
            <p class="text-xl font-bold text-sky-600">{{ levelCounts.style }}</p>
          </div>
        </div>

        <!-- 问题列表 -->
        <div class="space-y-2">
          <h3 class="text-base font-semibold flex items-center">
            <TriangleAlert class="w-4 h-4 mr-1.5 text-primary" /> 问题列表（按出现位置排序）
          </h3>

          <p
            v-if="!issues.length"
            class="text-sm text-muted-foreground bg-muted/40 border border-border rounded-lg p-4 flex items-start gap-2"
          >
            <CheckCircle class="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span v-if="inputText">未发现问题：在已开启的规则下，这份文案的排版是规范的。</span>
            <span v-else>在上方粘贴文本或点击「载入示例」，检查结果会显示在这里。</span>
          </p>

          <div v-else class="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            <div
              v-for="(issue, idx) in issuesWithMeta"
              :key="idx + '-' + issue.ruleId + '-' + issue.index"
              class="border border-border rounded-lg p-3"
            >
              <div class="flex items-center gap-2 flex-wrap text-xs">
                <span
                  class="inline-block px-1.5 py-0.5 rounded border font-medium"
                  :class="LEVEL_META[issue.level].badgeClass"
                >{{ LEVEL_META[issue.level].label }}</span>
                <span class="font-medium text-foreground">{{ issue.ruleName }}</span>
                <span class="text-muted-foreground">{{ issue.loc }}</span>
              </div>
              <p class="text-sm text-foreground mt-1.5">{{ issue.message }}</p>
              <p class="text-xs font-mono bg-muted/60 rounded p-2 mt-1.5 break-all text-foreground">
                {{ issue.ctx.headEllipsis }}{{ issue.ctx.before }}<mark class="rounded px-0.5" :class="LEVEL_MARK_CLASS[issue.level]">{{ issue.ctx.frag }}</mark>{{ issue.ctx.after }}{{ issue.ctx.tailEllipsis }}
              </p>
              <div class="flex items-center justify-between gap-2 mt-2 flex-wrap">
                <p class="text-xs text-muted-foreground">{{ issue.suggestion }}</p>
                <button
                  v-if="issue.fixText"
                  type="button"
                  class="px-2.5 py-1 text-xs rounded-md border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-medium transition flex-shrink-0"
                  @click="fixSingle(issue)"
                >一键修复此条</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 原文预览 -->
        <div class="space-y-2">
          <h3 class="text-base font-semibold flex items-center">
            <CheckCircle class="w-4 h-4 mr-1.5 text-primary" /> 原文预览（问题高亮）
          </h3>
          <p
            v-if="!inputText"
            class="text-sm text-muted-foreground bg-muted/40 border border-border rounded-lg p-4"
          >暂无内容：粘贴文本后，这里会按级别用底纹标注每个问题片段。</p>
          <!-- 内容全部先经 escapeHtml 转义再注入高亮 span，粘贴带标签的文本也安全 -->
          <div
            v-else
            class="whitespace-pre-wrap break-all text-sm leading-relaxed bg-muted/40 border border-border rounded-lg p-4 max-h-80 overflow-y-auto text-foreground"
            v-html="previewHtml"
          ></div>
          <p class="text-xs text-muted-foreground">
            <span class="inline-block w-2 h-2 rounded-sm bg-red-500/60 align-middle mr-1"></span>错误
            <span class="inline-block w-2 h-2 rounded-sm bg-amber-500/60 align-middle ml-2 mr-1"></span>建议
            <span class="inline-block w-2 h-2 rounded-sm bg-sky-500/60 align-middle ml-2 mr-1"></span>风格提示
            · 预览已做 HTML 转义，粘贴带标签的内容也安全。
          </p>
        </div>

        <!-- 操作区 -->
        <div class="flex flex-wrap gap-2 pt-1 border-t border-border/60">
          <button
            type="button"
            class="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition flex items-center"
            @click="fixAllIssues"
          >
            <Wand2 class="w-4 h-4 mr-1.5" /> 全部自动修复
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 border border-border text-foreground text-sm font-medium transition"
            @click="copyFixedText"
          >复制修复后文本</button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 border border-border text-foreground text-sm font-medium transition flex items-center"
            @click="resetRuleSwitches"
          >
            <RefreshCw class="w-4 h-4 mr-1.5" /> 重置开关
          </button>
        </div>
      </div>
    </div>

    <!-- 静态提示条 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-6 flex items-start gap-2.5">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-sm text-muted-foreground leading-relaxed">
        排版规范是约定不是法律：品牌名、代码、公式等特殊内容可关闭对应规则；全部处理在本地完成。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>中文排版检查器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          中文排版检查器是一款在线文案规范检查工具。它内置 9 条可独立开关的排版规则，覆盖中英文之间加空格、数字与中文之间加空格、
          全角字母数字转半角、重复标点压缩、中文语句里的半角标点转全角、"的地得"高频混淆提示、异形省略号（... / 。。。）转「……」、
          英文引号转中文引号以及感叹号滥用提醒。每条问题都标出所在行、字与上下文摘录，可单条修复，也可一键全部修复；
          规则体系整理自《中文文案排版指北》（github.com/sparanoid/chinese-copywriting-guidelines）与主流中文媒体的排版约定。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">中英文之间为什么要加空格？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          《中文文案排版指北》建议：中英文、数字与中文之间加一个半角空格，让中西文字型互不粘连，阅读节奏更平稳。苹果官方中文文案、
          少数派等主流中文媒体都遵循这一约定。这个习惯俗称「盘古之白」，来源于活字排版时代的中西文混排间隙。
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed">
          它也是有争议的约定：一种观点认为现代排版引擎与浏览器能自动处理字距（ CSS 的 text-autospace 等），不必手动加空格；
          另一种观点认为在网页、公众号等无法精细控制字距的场景里，手动空格仍是目前最稳妥的方案。本工具把「加空格」作为默认建议，
          你可以按发布平台的要求关闭对应规则。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">全角和半角什么时候用？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          简单口径：中文语境里出现的标点用全角（，。：；！？「」），英文字母与数字一律用半角（abc123）。全角数字（１２３）、
          全角字母（ＡＢＣ）是中文输入法全角模式的历史遗留，在正文里显得松散且不利于检索，应转回半角。
          本工具的「全角数字/字母检测」规则会把 ０-９、Ａ-Ｚ、ａ-ｚ 一键转成半角。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">"的地得"怎么区分？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          口诀：<span class="text-foreground font-medium">名词前面用「的」，动词前面用「地」，动词后面用「得」。</span>
        </p>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>的 + 名词：美丽的风景、开心的日子（定语）。</li>
          <li>地 + 动词：开心地跑、认真地写（状语，修饰"怎么跑"）。</li>
          <li>动词 + 得：跑得快、说得好（补语，补充"跑得怎么样"）。</li>
        </ul>
        <p class="text-sm text-muted-foreground leading-relaxed mt-2">
          因为三字同音 dé/de，日常写作里最容易混。本工具按高频错配组合表提示（如「开心的跑」「跑的快」「来的及」），
          但「的地得」的判断依赖语义，只做提示、不自动修改，请结合口诀人工确认。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">公众号文章排版检查清单</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>中英文、数字与中文之间是否加了半角空格（本工具规则 1、2）。</li>
          <li>是否有全角数字、全角字母残留，尤其是从 Word、聊天记录粘贴的段落（规则 3）。</li>
          <li>感叹号、问号是否连打两三个，句末是否用了「。。」或「...」（规则 4、7）。</li>
          <li>逗号、冒号、引号是否在中文里用了半角（规则 5、8）。</li>
          <li>每段是否出现三连感叹号，语气是否过强（规则 9）。</li>
          <li>正文里的「的地得」是否用对（规则 6）。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">和 Word 拼写检查的区别？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Word 的拼写和语法检查以词典与语法规则为底，擅长抓错别字、主谓搭配这类"语言错误"；本工具查的是"排版格式"——空格、
          全半角、标点形态这些 Word 基本不管的层面。两者互补：先用本工具把格式规范一遍，再交给 Word/校对查语言问题。
          另外本工具完全在浏览器本地运行，不联网、不上传，适合处理未发布的稿件。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">中英文之间一定要加空格吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不是强制标准，而是《中文文案排版指北》与主流中文媒体遵循的排版约定，好处是中西文混排更易读。若你的平台或品牌规范不允许，关闭规则 1、2 即可。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么有的问题不能一键修复？</h3>
            <p class="text-sm text-muted-foreground mt-1">「的地得」混淆和感叹号滥用依赖语义判断，机器自动改容易改错，所以只给出位置与建议，由你确认后手动修改。其余规则（空格、全半角、标点）都是机械替换，可放心自动修复。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">粘贴的文本会被上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。检查、修复、复制全部在你的浏览器内完成，不发送任何网络请求；规则开关状态仅保存在本机 localStorage。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'chinese-typography-linter'" :category="'text'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Type, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, Play, Wand2, ListChecks
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '中文排版检查器 - 在线中英文空格/标点/的地得文案检查工具',
  description: '免费在线中文排版检查工具，按《中文文案排版指北》检查文案：中英文与数字间加空格、全角字母数字转半角、重复标点与异形省略号压缩、半角标点转全角、的地得混淆提示、英文引号转中文引号、感叹号滥用提醒，支持单条与一键修复，9 条规则可独立开关，纯本地运行不上传',
  keywords: '中文排版,文案检查,空格规范,标点检查,公众号排版',
  author: '有条工具',
  ogTitle: '中文排版检查器 - 在线文案排版规范检查工具 | 有条工具',
  ogDescription: '中英文空格、全半角标点、重复标点、的地得混淆一站式检查与修复，规则可开关，全部本地完成。',
  ogUrl: 'https://www.util.cn/tools/chinese-typography-linter',
  ogType: 'website',
  twitterCard: 'summary_large_image'
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
          name: '中文排版检查器',
          url: 'https://www.util.cn/tools/chinese-typography-linter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['中英文之间自动加空格', '数字与中文间距检查', '全角数字字母转半角', '重复标点压缩（省略号白名单）', '中文语句半角标点转全角', '的地得混淆提示', '异形省略号转……', '英文引号转中文引号', '感叹号滥用提醒', '问题高亮预览与一键修复', '规则可独立开关', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本处理', item: 'https://www.util.cn/text/' },
            { '@type': 'ListItem', position: 3, name: '中文排版检查器', item: 'https://www.util.cn/tools/chinese-typography-linter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '中英文之间一定要加空格吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不是强制标准，而是《中文文案排版指北》与主流中文媒体遵循的排版约定，好处是中西文混排更易读。若你的平台或品牌规范不允许，可关闭对应规则。' }
            },
            {
              '@type': 'Question',
              name: '为什么有的问题不能一键修复？',
              acceptedAnswer: { '@type': 'Answer', text: '「的地得」混淆和感叹号滥用依赖语义判断，机器自动改容易改错，所以只给出位置与建议。其余规则（空格、全半角、标点形态）都是机械替换，可以放心自动修复。' }
            },
            {
              '@type': 'Question',
              name: '粘贴的文本会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。检查、修复、复制全部在浏览器本地完成，不发送任何网络请求；规则开关状态仅保存在本机 localStorage。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MAX_INPUT_BYTES = 50 * 1024 // 输入上限：50KB（按 UTF-8 字节计）
const FIX_MAX_PASSES = 4          // fixAllOf 最大轮数：修复会暴露新的相邻问题（如全角转半角后缺空格、"第3天"夹心边界），多轮直至收敛

const CJK_CLASS = '\\u4e00-\\u9fa5'
const CJK_RE = /[\u4e00-\u9fa5]/

// HTML 转义：任何内容注入 v-html 前必须先经过它
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 行首偏移表 + 二分查行号：lineColOf(text, index) → { line, col }（均从 1 起）
function buildLineStarts(text) {
  const starts = [0]
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') starts.push(i + 1)
  }
  return starts
}

function lineColOf(text, index, lineStarts) {
  const starts = Array.isArray(lineStarts) ? lineStarts : buildLineStarts(text)
  const idx = Math.max(0, Math.min(index, text.length))
  let lo = 0
  let hi = starts.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (starts[mid] <= idx) lo = mid
    else hi = mid - 1
  }
  return { line: lo + 1, col: idx - starts[lo] + 1 }
}

// UTF-8 字节数（纯函数口径，不依赖 TextEncoder，SSR 安全）
function utf8ByteLengthOfCodePoint(cp) {
  if (cp < 0x80) return 1
  if (cp < 0x800) return 2
  if (cp < 0x10000) return 3
  return 4
}

function utf8LengthOf(text) {
  let total = 0
  for (let i = 0; i < text.length; i++) {
    const cp = text.codePointAt(i)
    total += utf8ByteLengthOfCodePoint(cp)
    if (cp > 0xffff) i++
  }
  return total
}

// 按字节截断，不在多字节字符中间劈开；返回 { text, truncated }
function truncateByBytesUtf8(text, maxBytes) {
  let total = 0
  let i = 0
  while (i < text.length) {
    const cp = text.codePointAt(i)
    const len = utf8ByteLengthOfCodePoint(cp)
    if (total + len > maxBytes) return { text: text.slice(0, i), truncated: true }
    total += len
    i += cp > 0xffff ? 2 : 1
  }
  return { text, truncated: false }
}

// ---------- 规则 1：中英文之间加空格（字母/符号，数字归规则 2 避免重复计数） ----------
const CJK_LATIN_BOUNDARY_RE = new RegExp('([' + CJK_CLASS + '])([A-Za-z_$])|([A-Za-z_$])([' + CJK_CLASS + '])', 'g')

function checkCjkLatinSpace(text) {
  const issues = []
  CJK_LATIN_BOUNDARY_RE.lastIndex = 0
  let m
  while ((m = CJK_LATIN_BOUNDARY_RE.exec(text)) !== null) {
    const cjkFirst = m[1] !== undefined
    issues.push({
      index: m.index,
      length: 2,
      message: cjkFirst ? '中文与英文/符号之间应加一个半角空格' : '英文/符号与中文之间应加一个半角空格',
      suggestion: '加一个半角空格（如「中文 English」）',
      fixText: cjkFirst ? m[1] + ' ' + m[2] : m[3] + ' ' + m[4]
    })
  }
  return issues
}

// ---------- 规则 2：数字与中文之间加空格（独立规则，便于单独关闭） ----------
const CJK_DIGIT_BOUNDARY_RE = new RegExp('([' + CJK_CLASS + '])([0-9])|([0-9])([' + CJK_CLASS + '])', 'g')

function checkCjkDigitSpace(text) {
  const issues = []
  CJK_DIGIT_BOUNDARY_RE.lastIndex = 0
  let m
  while ((m = CJK_DIGIT_BOUNDARY_RE.exec(text)) !== null) {
    const cjkFirst = m[1] !== undefined
    issues.push({
      index: m.index,
      length: 2,
      message: cjkFirst ? '中文与数字之间应加一个半角空格' : '数字与中文之间应加一个半角空格',
      suggestion: '加一个半角空格（如「跑了 5 公里」）',
      fixText: cjkFirst ? m[1] + ' ' + m[2] : m[3] + ' ' + m[4]
    })
  }
  return issues
}

// ---------- 规则 3：全角数字/字母（０-９ Ａ-Ｚ ａ-ｚ）转半角 ----------
const FULLWIDTH_ALNUM_RE = /[\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A]+/g

function toHalfWidthChar(ch) {
  return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
}

function checkFullwidthAlnum(text) {
  const issues = []
  FULLWIDTH_ALNUM_RE.lastIndex = 0
  let m
  while ((m = FULLWIDTH_ALNUM_RE.exec(text)) !== null) {
    const fixed = m[0].split('').map(toHalfWidthChar).join('')
    issues.push({
      index: m.index,
      length: m[0].length,
      message: '全角数字/字母应改为半角',
      suggestion: `「${m[0]}」→「${fixed}」`,
      fixText: fixed
    })
  }
  return issues
}

// ---------- 规则 4：重复标点压缩（…… 与 ……！组合白名单；。。。 归规则 7 处理） ----------
const REPEATED_PUNCT_RE = /([。！？、，；：!?])\1{1,}/g

function checkRepeatedPunct(text) {
  const issues = []
  REPEATED_PUNCT_RE.lastIndex = 0
  let m
  while ((m = REPEATED_PUNCT_RE.exec(text)) !== null) {
    const run = m[0]
    if (run[0] === '。' && run.length >= 3) continue // 三连句号按省略号处理（规则 7）
    issues.push({
      index: m.index,
      length: run.length,
      message: `连续重复的标点「${run}」建议压缩为一个`,
      suggestion: `压缩为「${run[0]}」即可表达同样语气`,
      fixText: run[0]
    })
  }
  return issues
}

// ---------- 规则 5：夹在中文里的半角标点转全角（六类：逗号 句号 分号 冒号 问号 感叹号 + 括号） ----------
const HW_TO_FW_PUNCT = {
  ',': '，', '.': '。', ';': '；', ':': '：', '?': '？', '!': '！',
  '(': '（', ')': '）', '[': '［', ']': '］'
}
const HW_PUNCT_IN_CJK_RE = new RegExp('([' + CJK_CLASS + '])([,.;:?!])(?=[' + CJK_CLASS + '])', 'g')
const HW_BRACKET_IN_CJK_RE = new RegExp('([' + CJK_CLASS + '])([\\[(])|([\\])])(?=[' + CJK_CLASS + '])', 'g')

function checkHalfwidthPunctInCjk(text) {
  const issues = []
  HW_PUNCT_IN_CJK_RE.lastIndex = 0
  let m
  while ((m = HW_PUNCT_IN_CJK_RE.exec(text)) !== null) {
    const hw = m[2]
    issues.push({
      index: m.index + 1,
      length: 1,
      message: '中文语句中的半角标点应使用全角',
      suggestion: `「${hw}」→「${HW_TO_FW_PUNCT[hw]}」`,
      fixText: HW_TO_FW_PUNCT[hw]
    })
  }
  HW_BRACKET_IN_CJK_RE.lastIndex = 0
  while ((m = HW_BRACKET_IN_CJK_RE.exec(text)) !== null) {
    const hw = m[2] !== undefined ? m[2] : m[3]
    const idx = m[2] !== undefined ? m.index + 1 : m.index
    issues.push({
      index: idx,
      length: 1,
      message: '紧贴中文的半角括号应使用全角',
      suggestion: `「${hw}」→「${HW_TO_FW_PUNCT[hw]}」`,
      fixText: HW_TO_FW_PUNCT[hw]
    })
  }
  return issues
}

// ---------- 规则 6：的地得高频混淆（style，只提示不自动修） ----------
const DE_ADVERB_RE = /(开心|高兴|认真|努力|慢慢|轻轻|悄悄|偷偷|大声|小声|急忙|刻苦|仔细|耐心)的(跑|走|跳|飞|笑|说|看|写|读|唱|做|干|想|听|吃|喝|玩|喊|问|算|画|讲|聊)/g
const DE_COMPLEMENT_RE = /(跑|走|跳|飞|爬|冲|说|做|干|写|算|看|听|吃|喝|睡|办|改|学|练|买|累|饿|热|冷|忙|唱|画)的(?=(快|慢|好|对|错|差|完|到|出|清|早|晚|多|少|紧|松|稳|准|值|不))/g
const DE_ALWAYS_WRONG_LIST = [
  { wrong: '来的及', right: '来得及' },
  { wrong: '看的见', right: '看得见' },
  { wrong: '听的见', right: '听得见' },
  { wrong: '觉的', right: '觉得' }
]

function checkDeDeConfusion(text) {
  const issues = []
  DE_ADVERB_RE.lastIndex = 0
  let m
  while ((m = DE_ADVERB_RE.exec(text)) !== null) {
    issues.push({
      index: m.index,
      length: m[0].length,
      message: '修饰动词应用「地」而不是「的」',
      suggestion: `「${m[1]}的${m[2]}」→「${m[1]}地${m[2]}」（动词前面用「地」）`
    })
  }
  DE_COMPLEMENT_RE.lastIndex = 0
  while ((m = DE_COMPLEMENT_RE.exec(text)) !== null) {
    issues.push({
      index: m.index,
      length: 2,
      message: '动词后的补语前应用「得」而不是「的」',
      suggestion: `「${m[1]}的${m[2]}」→「${m[1]}得${m[2]}」（动词后面用「得」）`
    })
  }
  for (const pair of DE_ALWAYS_WRONG_LIST) {
    let from = 0
    let at = text.indexOf(pair.wrong, from)
    while (at !== -1) {
      issues.push({
        index: at,
        length: pair.wrong.length,
        message: `「${pair.wrong}」是高频错别字`,
        suggestion: `改为「${pair.right}」`
      })
      from = at + pair.wrong.length
      at = text.indexOf(pair.wrong, from)
    }
  }
  return issues
}

// ---------- 规则 7：异形省略号（... 或 。。。 → ……） ----------
const ELLIPSIS_RE = /\.{3,}|。{3,}/g

function checkEllipsisForm(text) {
  const issues = []
  ELLIPSIS_RE.lastIndex = 0
  let m
  while ((m = ELLIPSIS_RE.exec(text)) !== null) {
    issues.push({
      index: m.index,
      length: m[0].length,
      message: '省略号应使用「……」，不建议用三个点或连续句号代替',
      suggestion: `「${m[0]}」→「……」`,
      fixText: '……'
    })
  }
  return issues
}

// ---------- 规则 8：英文引号包裹中文 → 中文引号（style） ----------
const EN_DQ_WITH_CJK_RE = /"([^"\n]*[\u4e00-\u9fa5][^"\n]*)"/g
const EN_SQ_WITH_CJK_RE = /'([^'\n]*[\u4e00-\u9fa5][^'\n]*)'/g

function checkQuoteUnify(text) {
  const issues = []
  EN_DQ_WITH_CJK_RE.lastIndex = 0
  let m
  while ((m = EN_DQ_WITH_CJK_RE.exec(text)) !== null) {
    issues.push({
      index: m.index,
      length: m[0].length,
      message: '包裹中文内容的英文引号应替换为中文引号',
      suggestion: `「${m[0]}」→「“${m[1]}”」`,
      fixText: '“' + m[1] + '”'
    })
  }
  EN_SQ_WITH_CJK_RE.lastIndex = 0
  while ((m = EN_SQ_WITH_CJK_RE.exec(text)) !== null) {
    issues.push({
      index: m.index,
      length: m[0].length,
      message: '包裹中文内容的英文单引号应替换为中文单引号',
      suggestion: `「${m[0]}」→「‘${m[1]}’」`,
      fixText: '‘' + m[1] + '’'
    })
  }
  return issues
}

// ---------- 规则 9：一段 ≥3 个感叹号（style，只提示） ----------
function checkExclamationOveruse(text) {
  const issues = []
  let offset = 0
  const paragraphs = text.split('\n')
  for (const para of paragraphs) {
    const marks = []
    for (let i = 0; i < para.length; i++) {
      if (para[i] === '！' || para[i] === '!') marks.push(i)
    }
    if (marks.length >= 3) {
      const last = marks[marks.length - 1]
      issues.push({
        index: offset + marks[0],
        length: last - marks[0] + 1,
        message: `本段出现 ${marks.length} 个感叹号，语气过强`,
        suggestion: '保留 1 个即可表达强烈语气'
      })
    }
    offset += para.length + 1
  }
  return issues
}

// ---------- 修复编排：从后往前替换避免位移 ----------
function applyFixes(text, issues) {
  const fixable = issues
    .filter((it) => typeof it.fixText === 'string')
    .sort((a, b) => b.index - a.index)
  let out = text
  for (const it of fixable) {
    if (it.index < 0 || it.index + it.length > out.length) continue
    out = out.slice(0, it.index) + it.fixText + out.slice(it.index + it.length)
  }
  return out
}

// ---------- 规则注册表（每条规则独立函数 + 统一注册） ----------
const LINTER_RULES = [
  {
    id: 'cjk-latin-space',
    name: '中英文之间加空格',
    level: 'error',
    desc: '中文与英文单词、符号之间加一个半角空格；已有空格不会重复加。数字间距由下一条规则单独控制。',
    check: checkCjkLatinSpace,
    fixable: true
  },
  {
    id: 'cjk-digit-space',
    name: '数字与中文之间加空格',
    level: 'error',
    desc: '数字与汉字相邻时补一个半角空格（如「跑了 5 公里」）。不想给数字加空格的发布平台可单独关闭本条。',
    check: checkCjkDigitSpace,
    fixable: true
  },
  {
    id: 'fullwidth-alnum',
    name: '全角数字/字母转半角',
    level: 'error',
    desc: '０-９、Ａ-Ｚ、ａ-ｚ 属于输入法全角模式的历史遗留，正文里应转为半角。',
    check: checkFullwidthAlnum,
    fixable: true
  },
  {
    id: 'repeated-punct',
    name: '重复标点压缩',
    level: 'warn',
    desc: '同级标点连续出现两个及以上时压缩为一个；「……」与「……！」为规范用法不提示，三连句号归省略号规则处理。',
    check: checkRepeatedPunct,
    fixable: true
  },
  {
    id: 'halfwidth-punct-in-cjk',
    name: '半角标点夹在中文里',
    level: 'warn',
    desc: '两侧都是中文时，逗号、句号、问号、感叹号、分号、冒号及括号应使用全角形态。',
    check: checkHalfwidthPunctInCjk,
    fixable: true
  },
  {
    id: 'de-de-confusion',
    name: '"的地得"混淆提示',
    level: 'style',
    desc: '按高频错配组合表提示「开心的跑」「跑的快」「来的及」类问题。依赖语义，只提示不自动修改。',
    check: checkDeDeConfusion,
    fixable: false
  },
  {
    id: 'ellipsis-form',
    name: '异形省略号',
    level: 'warn',
    desc: '三个半角点（...）或三连句号（。。。）应替换为规范省略号「……」。',
    check: checkEllipsisForm,
    fixable: true
  },
  {
    id: 'quote-unify',
    name: '中文引号统一',
    level: 'style',
    desc: '英文引号包裹中文内容时替换为中文引号「“”」「‘’」；只包含英文的引号不会改动。',
    check: checkQuoteUnify,
    fixable: true
  },
  {
    id: 'exclamation-overuse',
    name: '感叹号滥用',
    level: 'style',
    desc: '同一段落出现 3 个及以上感叹号时提醒控制语气，只提示不自动修改。',
    check: checkExclamationOveruse,
    fixable: false
  }
]

// 统一派生每条规则的 fixAll：先 check 再从后往前替换
for (const rule of LINTER_RULES) {
  rule.fixAll = function fixAll(text) {
    return applyFixes(text, rule.check(text))
  }
}

const ruleById = {}
for (const rule of LINTER_RULES) ruleById[rule.id] = rule

// 运行单条规则并补充规则元信息
function runRule(rule, text) {
  return rule.check(text).map((it) => ({
    ...it,
    ruleId: rule.id,
    ruleName: rule.name,
    level: rule.level
  }))
}

// 汇总多条规则的问题，按出现位置排序（同位置按注册表顺序）
function collectIssues(text, rules) {
  const all = []
  for (const rule of rules) all.push(...runRule(rule, text))
  return all.sort((a, b) => a.index - b.index)
}

// 全部自动修复编排：依次应用各规则的 fixAll，多轮执行直到收敛
function fixAllOf(text, rules) {
  let out = text
  for (let pass = 0; pass < FIX_MAX_PASSES; pass++) {
    let changed = false
    for (const rule of rules) {
      const fixed = rule.fixAll(out)
      if (fixed !== out) changed = true
      out = fixed
    }
    if (!changed) break
  }
  return out
}

// 预览 HTML：先整段转义，再在转义后的片段外包裹高亮 span；重叠问题只标第一处
const LEVEL_MARK_CLASS = {
  error: 'bg-red-500/25',
  warn: 'bg-amber-500/25',
  style: 'bg-sky-500/25'
}

function buildPreviewHtml(text, issues) {
  const sorted = issues.slice().sort((a, b) => a.index - b.index)
  let html = ''
  let pos = 0
  for (const it of sorted) {
    const start = it.index
    const end = it.index + it.length
    if (start < pos || end > text.length || end <= start) continue
    html += escapeHtml(text.slice(pos, start))
    html += '<mark class="rounded px-0.5 ' + (LEVEL_MARK_CLASS[it.level] || '') + '">' + escapeHtml(text.slice(start, end)) + '</mark>'
    pos = end
  }
  html += escapeHtml(text.slice(pos))
  return html
}

// 问题上下文摘录（前后各取 pad 字）
function contextOf(text, issue, pad) {
  const P = typeof pad === 'number' ? pad : 16
  const start = Math.max(0, issue.index - P)
  const fragStart = Math.min(issue.index, text.length)
  const fragEnd = Math.min(issue.index + issue.length, text.length)
  const end = Math.min(text.length, fragEnd + P)
  return {
    headEllipsis: start > 0 ? '…' : '',
    tailEllipsis: end < text.length ? '…' : '',
    before: text.slice(start, fragStart),
    frag: text.slice(fragStart, fragEnd),
    after: text.slice(fragEnd, end)
  }
}

// ---------- 示例文本（塞满典型错误） ----------
const SAMPLE_TEXT = [
  '今天给大家推荐一款超好用的笔记软件Notion，我用了一年多,真心觉得不错~',
  '我发现这个APP真的很好用,它的界面非常漂亮,大家都说的好！！',
  '限时特价１９９元,机会难得,快来抢购吧！！！错过的话你会后悔的...',
  '客服说ｏｋ马上给你发货,记得给个五星好评哦~',
  '他说:这款产品真的很好用,而且外观也很漂亮,大家都说买的值。',
  '他跑了5公里就累的不行了,速度也只有每小时3公里,真的很慢...',
  '她小声的说了句"真的假的"就走了,留下满屋子的尴尬...'
].join('\n')

// ---------- 页面状态与交互 ----------
const LEVEL_META = {
  error: { label: '错误', badgeClass: 'bg-red-500/10 text-red-600 border-red-500/20' },
  warn: { label: '建议', badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  style: { label: '风格', badgeClass: 'bg-sky-500/10 text-sky-600 border-sky-500/20' }
}

const RULES_STORAGE_KEY = 'chinese-typography-linter:rules'

const inputText = ref('')
const ruleEnabled = reactive(Object.fromEntries(LINTER_RULES.map((r) => [r.id, true])))
const truncatedTip = ref(false)
const seoContentVisible = ref(true)

const activeRules = computed(() => LINTER_RULES.filter((r) => ruleEnabled[r.id]))
const activeRuleCount = computed(() => activeRules.value.length)
const fixableActiveRules = computed(() => activeRules.value.filter((r) => r.fixable))

const issues = computed(() => collectIssues(inputText.value, activeRules.value))

const levelCounts = computed(() => ({
  error: issues.value.filter((it) => it.level === 'error').length,
  warn: issues.value.filter((it) => it.level === 'warn').length,
  style: issues.value.filter((it) => it.level === 'style').length
}))

const issuesByRule = computed(() => {
  const map = {}
  for (const it of issues.value) map[it.ruleId] = (map[it.ruleId] || 0) + 1
  return map
})

const lineStarts = computed(() => buildLineStarts(inputText.value))

const textKbText = computed(() => (utf8LengthOf(inputText.value) / 1024).toFixed(1))

const issuesWithMeta = computed(() =>
  issues.value.map((it) => {
    const loc = lineColOf(inputText.value, it.index, lineStarts.value)
    return {
      ...it,
      loc: `第 ${loc.line} 行 · 第 ${loc.col} 字`,
      ctx: contextOf(inputText.value, it)
    }
  })
)

const previewHtml = computed(() => buildPreviewHtml(inputText.value, issues.value))

// ---------- 事件处理（回调内使用浏览器 API，SSR 安全） ----------
function onTextareaInput(e) {
  const result = truncateByBytesUtf8(e.target.value, MAX_INPUT_BYTES)
  inputText.value = result.text
  truncatedTip.value = result.truncated
  if (result.truncated) e.target.value = result.text
}

function loadSample() {
  inputText.value = SAMPLE_TEXT
  truncatedTip.value = false
}

function runCheck() {
  if (!inputText.value.trim()) {
    alert('请先在文本框粘贴内容，或点击「载入示例」体验。')
    return
  }
  if (!issues.value.length) {
    alert('检查完成：未发现任何问题，这份文案的排版很规范！')
    return
  }
  alert(`检查完成：共发现 ${issues.value.length} 处问题 — 错误 ${levelCounts.value.error} / 建议 ${levelCounts.value.warn} / 风格 ${levelCounts.value.style}。`)
}

function fixSingle(issue) {
  if (typeof issue.fixText !== 'string') return
  const beforeCount = issues.value.length
  inputText.value = applyFixes(inputText.value, [issue])
  alert(`已修复该处「${issue.ruleName}」问题：问题总数 ${beforeCount} → ${issues.value.length}。`)
}

function fixAllIssues() {
  if (!issues.value.length) {
    alert('当前没有需要修复的问题。')
    return
  }
  const beforeCount = issues.value.length
  const beforeText = inputText.value
  const afterText = fixAllOf(beforeText, fixableActiveRules.value)
  if (afterText === beforeText) {
    alert('没有可自动修复的问题（剩余提示都需要结合语义人工确认）。')
    return
  }
  inputText.value = afterText
  alert(`自动修复完成：问题总数 ${beforeCount} → ${issues.value.length}。剩余提示（如"的地得"）请人工确认。`)
}

function copyFixedText() {
  const fixed = fixAllOf(inputText.value, fixableActiveRules.value)
  if (!fixed.trim()) {
    alert('当前没有可复制的内容。')
    return
  }
  const fallbackCopy = () => {
    const ta = document.createElement('textarea')
    ta.value = fixed
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      alert('已复制修复后的文本。')
    } catch (err) {
      alert('复制失败，请在预览区手动全选复制。')
    }
    document.body.removeChild(ta)
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fixed).then(() => alert('已复制修复后的文本。'), fallbackCopy)
  } else {
    fallbackCopy()
  }
}

function toggleRule(ruleId) {
  ruleEnabled[ruleId] = !ruleEnabled[ruleId]
  persistRuleSwitches()
}

function resetRuleSwitches() {
  for (const rule of LINTER_RULES) ruleEnabled[rule.id] = true
  persistRuleSwitches()
  alert('已恢复默认：全部 9 条规则开启。')
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// localStorage 持久化（隐私模式等异常场景静默降级）
function persistRuleSwitches() {
  try {
    const payload = {}
    for (const rule of LINTER_RULES) payload[rule.id] = !!ruleEnabled[rule.id]
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(payload))
  } catch (err) { /* 存储不可用时忽略 */ }
}

function restoreRuleSwitches() {
  try {
    const raw = localStorage.getItem(RULES_STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    for (const rule of LINTER_RULES) {
      if (typeof saved[rule.id] === 'boolean') ruleEnabled[rule.id] = saved[rule.id]
    }
  } catch (err) { /* 解析失败保持默认全开 */ }
}

onMounted(() => {
  restoreRuleSwitches()
  addRecentTool('chinese-typography-linter')
})
</script>
