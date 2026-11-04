<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Landmark class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">公文红头排版生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">按 GB/T 9704-2012 惯用口径排版红头文件：红头大字、发文字号、红色分隔线、标题、缩进正文与右空四字落款</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        填写发文机关标志（红头）、发文字号（年份用六角括号〔〕）、标题、主送机关、正文（空行分段）与成文日期，
        即可在 A4 比例纸张上生成 GB/T 9704-2012 风格的公文版式：红色发文机关标志居中、发文字号居中、
        横贯版心的红色分隔线、标题居中、正文两端对齐且首行缩进 2 字符、成文日期右空四字，可选附件说明与版记抄送栏。
        支持一键打印 / 另存 PDF 与纯文本复制，全部内容仅在当前浏览器本地处理，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：内容输入 -->
      <div class="no-print bg-card border border-border rounded-lg p-6 space-y-4 h-fit">
        <h2 class="text-lg font-semibold flex items-center">
          <PenLine class="w-5 h-5 mr-2 text-primary" /> 填写公文内容
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">发文机关标志（红头）<span class="text-red-500 ml-0.5">*</span></label>
          <input
            v-model="form.org"
            type="text"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 有条工具办公室"
          />
          <p class="text-xs text-muted-foreground mt-1">一般使用机关全称或规范化简称，以红色大字居中显示</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">发文字号</label>
          <input
            v-model="form.docNumber"
            type="text"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 util发〔2026〕15号"
          />
          <p class="text-xs text-muted-foreground mt-1 flex items-start gap-1">
            <Info class="w-3 h-3 shrink-0 mt-0.5" />
            <span>文号由「机关代字＋年份＋序号」组成，年份须用六角括号〔〕括注（不能用方括号 [] 或圆括号），如：util发〔2026〕15号</span>
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">标题<span class="text-red-500 ml-0.5">*</span></label>
          <input
            v-model="form.title"
            type="text"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 关于开展2026年度安全生产检查的通知"
          />
          <p class="text-xs text-muted-foreground mt-1">一般由「发文机关＋事由＋文种」组成，居中排布</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">主送机关</label>
          <input
            v-model="form.to"
            type="text"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 各部门、各直属机构："
          />
          <p class="text-xs text-muted-foreground mt-1">编排时居左顶格，机关名称后标全角冒号</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">正文<span class="text-red-500 ml-0.5">*</span></label>
          <textarea
            v-model="form.body"
            rows="10"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如：&#10;&#10;为进一步规范××工作，经研究，决定开展2026年度安全生产检查。现将有关事项通知如下。&#10;&#10;各单位要高度重视，认真组织实施，确保检查工作落到实处。"
          ></textarea>
          <p class="text-xs text-muted-foreground mt-1">空一行即分段；段首自动缩进 2 字符并两端对齐，无需输入全角空格</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">成文日期</label>
            <input
              v-model="form.date"
              type="date"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1">按「右空四字」落款，署名在其上方居中</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">附件说明（选填）</label>
            <textarea
              v-model="form.attachments"
              rows="2"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="每行一个附件名称&#10;如：&#10;2026年度检查工作安排表"
            ></textarea>
            <p class="text-xs text-muted-foreground mt-1">每行一个附件名称，无需输入「附件」二字</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">抄送（选填）</label>
          <textarea
            v-model="form.cc"
            rows="2"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 各区县局、各直属单位"
          ></textarea>
          <p class="text-xs text-muted-foreground mt-1">多个抄送机关用逗号分隔，末尾加句号；将排版在文末版记分隔线内</p>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            @click="copyDoc"
            class="flex-1 min-w-[120px] px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
          >
            <Copy class="w-4 h-4" /> 复制纯文本
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

      <!-- 右：A4 纸张预览（打印输出区） -->
      <div class="print-area">
        <div class="no-print flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 公文预览（A4）
          </h2>
          <button
            type="button"
            @click="printDoc"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1.5"
          >
            <Printer class="w-4 h-4" /> 打印 / 另存 PDF
          </button>
        </div>

        <div class="bg-white text-black border border-border rounded-lg shadow-sm overflow-hidden a4-paper">
          <div
            class="px-[7.5%] pt-[7%] pb-[6%]"
            style="font-family: 'FangSong', 'FangSong_GB2312', 'STFangsong', 'FangSong SC', '仿宋', serif;"
          >
            <!-- 发文机关标志（红头大字） -->
            <p
              :class="ORG_CLASS"
              style="font-family: 'STZhongsong', 'SimSun', 'Songti SC', 'STSong', serif;"
            >{{ orgDisplay }}</p>
            <!-- 发文字号（红色分隔线上方，居中） -->
            <p class="text-center text-[15px] mt-7 mb-2 tracking-wider">{{ docNumberDisplay }}</p>
            <!-- 红色分隔线（横贯版心） -->
            <div :class="RED_LINE_CLASS"></div>
            <!-- 标题 -->
            <h2
              :class="TITLE_CLASS"
              style="font-family: 'STZhongsong', 'SimSun', 'Songti SC', 'STSong', serif;"
            >{{ titleDisplay }}</h2>
            <!-- 主送机关（居左顶格） -->
            <p :class="TO_CLASS">{{ toDisplay }}</p>
            <!-- 正文（两端对齐，首行缩进 2 字符） -->
            <p v-for="(para, i) in bodyParas" :key="i" :class="BODY_PARA_CLASS">{{ para }}</p>
            <!-- 附件说明（正文下空一行，左空二字） -->
            <p
              v-if="attachList.length"
              class="text-[16px] leading-[2] mt-5 whitespace-pre-wrap"
              style="padding-left: 2em; text-indent: -2em;"
            >附件：{{ attachList.join('\n') }}</p>
            <!-- 发文机关署名 + 成文日期（右空四字） -->
            <div :class="DATE_BLOCK_CLASS">
              <div class="inline-block text-center">
                <p v-if="orgName">{{ orgName }}</p>
                <p>{{ dateDisplay }}</p>
              </div>
            </div>
            <!-- 版记：抄送栏 -->
            <template v-if="ccDisplay">
              <div class="mt-12" style="border-top: 2px solid #000;"></div>
              <p :class="CC_CLASS">抄送：{{ ccDisplay }}</p>
              <div style="border-top: 1px solid #000;"></div>
            </template>
          </div>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：打印或另存 PDF 时仅输出纸张内容，红头与红色分隔线按打印原色输出。内容超过一页时打印会自动分页。
        </p>
      </div>
    </div>

    <!-- 版式口径提示卡 -->
    <div class="no-print bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center text-blue-700 dark:text-blue-400">
        <Info class="w-5 h-5 mr-2" /> 版式口径说明
      </h2>
      <ul class="list-decimal list-inside space-y-2 text-sm text-muted-foreground mt-3 leading-relaxed">
        <li>本工具按 GB/T 9704-2012《党政机关公文格式》惯用口径<strong>简化实现</strong>：字号、字距、行距与真实红头版式存在差异。</li>
        <li>版式要点已按标准口径处理：发文机关标志红色居中；发文字号编排于红色分隔线之上；标题居中；主送机关顶格；正文每段首行缩进 2 字符、两端对齐；成文日期右空四字、发文机关署名在其上方居中；抄送编排在文末版记分隔线内。</li>
        <li>份号、密级和保密期限、紧急程度、附注、印发机关和印发日期等要素未纳入；正式发文请以机关办公系统或专业公文排版软件的输出为准。</li>
        <li>本工具仅作版式演示与草拟参考，不具有公文法定效力；涉密文件请勿在本工具录入。</li>
      </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>公文红头排版生成器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          公文红头排版生成器是一款在线红头文件排版辅助工具。填写发文机关标志、发文字号、标题、主送机关、正文与成文日期，
          工具会按 GB/T 9704-2012 的惯用口径自动完成排版：红色发文机关标志居中、发文字号居中、其下 4mm 处印一条横贯版心的红色分隔线、
          标题居中排布、正文两端对齐且每个自然段首行缩进 2 字符、成文日期右空四字、发文机关署名在成文日期上方居中，
          填写了抄送机关时文末自动生成版记分隔线与抄送栏。生成的版面以 A4 比例纸张预览，可一键打印或另存 PDF，也可复制纯文本。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">如何使用本工具</h3>
        <ol class="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-4 leading-relaxed">
          <li>填写发文机关标志（红头）与发文字号，年份使用六角括号〔〕；</li>
          <li>填写标题、主送机关与正文，正文用空行分段，无需手动输入段首空格；</li>
          <li>选择成文日期，按需填写附件说明与抄送；</li>
          <li>在右侧 A4 纸张预览中核对版式，点击「打印 / 另存 PDF」或「复制纯文本」。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">发文字号里的六角括号怎么输入</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          公文年份使用全角六角括号〔〕（U+3014、U+3015）括注，不能用方括号 [ ] 或圆括号 ( )。
          大多数中文输入法可在「符号 → 标点」面板中找到，或直接复制本页示例「util发〔2026〕15号」中的括号使用。
          发文字号由机关代字、年份、序号组成，如「×办发〔2026〕15号」中的「办发」为机关代字，「15」为当年发文序号。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">成文日期为什么要「右空四字」</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          按 GB/T 9704-2012，单一机关行文时，成文日期一般右空四字编排，发文机关署名在成文日期之上、以成文日期为准居中编排。
          成文日期用阿拉伯数字将年、月、日标全，如「2026年1月15日」。「右空四字」指日期右端距版心右边缘空出四个字符的位置，
          这是公文落款的惯用版式，本工具已按此口径自动处理。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常见问题（FAQ）</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-foreground">红头文件的「红头」指什么？</h4>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              「红头」指文件首页上端套红的发文机关标志，通常以红色大字居中印制，是公文的法定版头要素之一；
              其下是发文字号和一条横贯版心的红色分隔线，合称「文头」。红头不是随意加的装饰，其位置、字号、颜色都有版式规范。
            </p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">生成的公文具有法定效力吗？</h4>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              没有。本工具仅作版式演示与草拟参考，输出内容未经发文机关审核签发流程，不具有公文法定效力。
              正式发文应经本机关办公系统或专业公文排版软件排版，并履行核稿、签发、用印程序。
            </p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">正文分段有什么讲究？</h4>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              公文正文每个自然段首行缩进 2 字符、回行顶格。在本工具中只需用空行分段，段首缩进由版式自动处理；
              结构层次序数（一、（一）、1.、（1））请按公文惯用层次使用。
            </p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">填写的内容会被上传吗？</h4>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              不会。所有排版均在当前浏览器本地完成，不向服务器发送任何内容；涉密或敏感文件请勿在任何在线工具中录入，
              本工具也不例外。
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :current-tool-id="'official-document-generator'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Landmark, PenLine, Printer, Copy, RefreshCw,
  ChevronUp, ChevronDown, Info
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '公文红头排版生成器 - 红头文件模板在线排版打印 | 有条工具',
  description: '在线公文红头排版生成器：填写发文机关标志、发文字号（六角括号）、标题、主送机关、正文与成文日期，按 GB/T 9704-2012 惯用口径生成红头文件版式，红色分隔线、首行缩进两字符、成文日期右空四字、版记抄送栏自动排版，支持一键打印另存PDF与纯文本复制，浏览器本地处理不上传',
  keywords: '红头文件模板,公文排版,公文生成器,红头文件生成,official document generator,发文笺,发文字号六角括号',
  author: '有条工具',
  ogTitle: '公文红头排版生成器 - GB/T 9704 红头文件在线排版 | 有条工具',
  ogDescription: '填写要素自动生成红头文件版式：红头大字、红色分隔线、缩进正文、右空四字落款与抄送栏，可打印',
  ogUrl: 'https://www.util.cn/tools/official-document-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '公文红头排版生成器 - 红头文件在线排版',
  twitterDescription: '按 GB/T 9704-2012 惯用口径排版红头文件，一键打印或复制纯文本，本地处理不上传'
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
          name: '公文红头排版生成器',
          url: 'https://www.util.cn/tools/official-document-generator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'GB/T 9704-2012 惯用口径红头版式',
            '发文机关标志与红色分隔线',
            '发文字号六角括号口径提示',
            '正文首行缩进两字符两端对齐',
            '成文日期右空四字与署名居中',
            '附件说明与版记抄送栏',
            'A4 比例纸张预览与打印另存 PDF',
            '纯文本复制、本地处理不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '公文红头排版生成器', item: 'https://www.util.cn/tools/official-document-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '红头文件的「红头」指什么？',
              acceptedAnswer: { '@type': 'Answer', text: '「红头」指文件首页上端套红的发文机关标志，以红色大字居中印制，其下是发文字号和一条横贯版心的红色分隔线，合称文头，其位置、字号、颜色均有版式规范。' }
            },
            {
              '@type': 'Question',
              name: '发文字号里的六角括号怎么输入？',
              acceptedAnswer: { '@type': 'Answer', text: '公文年份使用全角六角括号〔〕（U+3014、U+3015）括注，不能用方括号或圆括号；可在中文输入法符号面板找到，或直接复制工具页示例中的括号使用。' }
            },
            {
              '@type': 'Question',
              name: '生成的公文具有法定效力吗？',
              acceptedAnswer: { '@type': 'Answer', text: '没有。本工具仅作版式演示与草拟参考，正式发文应经本机关办公系统排版并履行核稿、签发、用印程序。' }
            },
            {
              '@type': 'Question',
              name: '填写的内容会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有排版均在当前浏览器本地完成，不向服务器发送任何内容；涉密或敏感文件请勿在任何在线工具中录入。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// GB/T 9704-2012 简化版式的关键样式常量（预览与单测共用）
const ORG_CLASS = 'text-center font-bold text-[36px] sm:text-[42px] leading-[1.3] tracking-[0.12em] text-red-600'
const RED_LINE_CLASS = 'w-full h-[2px] bg-red-600'
const TITLE_CLASS = 'text-center font-bold text-[22px] leading-[1.6] mt-7 mb-6 whitespace-pre-wrap'
const TO_CLASS = 'text-[16px] leading-[1.9] mb-1 whitespace-pre-wrap'
const BODY_PARA_CLASS = 'text-[16px] leading-[2] text-justify indent-[2em] mb-1 whitespace-pre-wrap'
const DATE_BLOCK_CLASS = 'flex justify-end pr-[4em] mt-10 text-[16px] leading-[2]'
const CC_CLASS = 'pl-[1em] text-[14px] leading-[1.9] py-1.5 whitespace-pre-wrap'

const DOC_DATE_EMPTY = '＿＿＿＿年＿＿月＿＿日'

// 'YYYY-MM-DD' → 'YYYY年M月D日'（成文日期用阿拉伯数字标全年月日），空或非法 → 全角占位
function formatDocDate(raw) {
  const m = String(raw || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!m) return DOC_DATE_EMPTY
  return `${Number(m[1])}年${Number(m[2])}月${Number(m[3])}日`
}

// 正文按空行分段，段内保留换行；空正文 → ['____']
function splitBodyParas(raw) {
  const list = String(raw ?? '')
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  return list.length ? list : ['____']
}

// 附件说明按行拆分
function attachLines(raw) {
  return String(raw ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

// 通用占位：空值 → '____'
function docTextValue(raw) {
  const v = String(raw ?? '').trim()
  return v || '____'
}

// 拼接整份公文为纯文本（供复制）：段首以两个全角空格缩进
function buildOfficialText(form) {
  const org = String((form && form.org) ?? '').trim() || '____'
  const docNumber = String((form && form.docNumber) ?? '').trim() || '____'
  const title = String((form && form.title) ?? '').trim() || '____'
  const to = String((form && form.to) ?? '').trim()
  const lines = [org, '', docNumber, '', title, '']
  if (to) lines.push(to)
  for (const p of splitBodyParas(form && form.body)) lines.push('　　' + p, '')
  const attach = attachLines(form && form.attachments)
  if (attach.length) lines.push('附件：' + attach.join('\n'), '')
  if (org !== '____') lines.push(org)
  lines.push(formatDocDate(form && form.date), '')
  const cc = String((form && form.cc) ?? '').trim()
  if (cc) lines.push('抄送：' + cc)
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

// ---------- 表单状态 ----------
const EMPTY_FORM = { org: '', docNumber: '', title: '', to: '', body: '', date: '', attachments: '', cc: '' }
const form = reactive({ ...EMPTY_FORM })
const seoContentVisible = ref(true)

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 派生显示值 ----------
const orgDisplay = computed(() => docTextValue(form.org))
const orgName = computed(() => String(form.org || '').trim())
const docNumberDisplay = computed(() => docTextValue(form.docNumber))
const titleDisplay = computed(() => docTextValue(form.title))
const toDisplay = computed(() => {
  const v = String(form.to || '').trim()
  return v ? v : '____：'
})
const bodyParas = computed(() => splitBodyParas(form.body))
const attachList = computed(() => attachLines(form.attachments))
const ccDisplay = computed(() => String(form.cc || '').trim())
const dateDisplay = computed(() => formatDocDate(form.date))
const plainText = computed(() => buildOfficialText(form))

// ---------- 操作 ----------
function addRecent() {
  addRecentTool('official-document-generator')
}

async function copyDoc() {
  addRecent()
  try {
    await navigator.clipboard.writeText(plainText.value)
    alert('公文纯文本已复制到剪贴板（段首以全角空格缩进），可粘贴到备忘录或办公系统继续编辑。')
  } catch (e) {
    alert('复制失败，请在预览区手动选择文本复制。')
  }
}

function printDoc() {
  addRecent()
  window.print()
}

function resetForm() {
  Object.assign(form, EMPTY_FORM)
}

onMounted(() => {
  addRecentTool('official-document-generator')
})
</script>

<style scoped>
/* A4 纸张比例（210mm × 297mm）；内容超出时容器随内容增高，打印时自动分页 */
.a4-paper {
  aspect-ratio: 210 / 297;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
@media print {
  .no-print {
    display: none !important;
  }
  .print-area {
    box-shadow: none;
  }
  .a4-paper {
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
  .bg-white {
    border: none !important;
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
@page {
  size: A4 portrait;
  margin: 0;
}
</style>
