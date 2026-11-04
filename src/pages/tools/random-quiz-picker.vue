<template>
  <div class="max-w-8xl mx-auto">
    <!-- 全局 @page 规则：A4 竖版、12mm 页边距（打印对话框中缩放保持 100% 即与预览一致） -->
    <component :is="'style'" v-html="printPageCss"></component>

    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Shuffle class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">随机抽题组卷</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴题库随机抽 N 题成卷，选项可打乱、同种子同卷可复现，A4 打印附独立答案页</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线随机抽题组卷工具：把整理好的题库整段粘贴进来，自动解析题干、选项、答案与解析，按设定数量随机抽题组成一份练习卷；
        支持打乱选项顺序（答案字母同步更新，不会错位）、mulberry32 种子同卷复现、A4 试卷直接打印并附单独分页的答案页，
        也可一键复制试卷 / 答案纯文本。全部解析与生成都在浏览器本地完成，题库不上传，适合老师布置作业、家长组卷与考前自测。
      </p>
    </div>

    <div class="print-grid grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：题库与出卷设置 -->
      <div class="no-print space-y-6">
        <!-- 题库粘贴 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Play class="w-5 h-5 mr-2 text-primary" /> 题库粘贴
            </h2>
            <span class="text-xs text-muted-foreground">已解析 {{ bankStats.total }} 题</span>
          </div>

          <textarea
            v-model="bankText"
            rows="12"
            :placeholder="bankPlaceholder"
            :class="INP_CLS + ' font-mono text-xs leading-relaxed'"
          ></textarea>

          <div class="flex items-center justify-between gap-2 text-xs">
            <span class="text-muted-foreground">已输入 {{ (bankBytes / 1024).toFixed(1) }} KB / 上限 500 KB</span>
            <span v-if="bankOverLimit" class="flex items-center gap-1 text-amber-600">
              <TriangleAlert class="w-3.5 h-3.5 shrink-0" /> 超限，仅解析前 500KB
            </span>
          </div>

          <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
            <span>题库格式：题目之间空一行；选项行以 A. B. 开头；答案行写「答案：X」。解析会带进答案页。</span>
          </p>
        </div>

        <!-- 出卷设置 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <RefreshCw class="w-5 h-5 mr-2 text-primary" /> 出卷设置
          </h2>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-muted-foreground mb-1">抽取数量（题库共 {{ bankStats.total }} 题）</label>
              <input
                v-model.number="pickCount"
                type="number"
                min="1"
                :max="Math.max(1, bankStats.total)"
                :class="INP_CLS"
              />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">随机种子（同种子 = 同一份卷）</label>
              <input
                v-model="seedInput"
                type="text"
                inputmode="numeric"
                :class="INP_CLS"
                placeholder="留空则每次随机"
                @change="applySeedInput"
              />
            </div>
          </div>
          <p v-if="countHint" class="text-xs text-amber-600 flex items-center gap-1">
            <TriangleAlert class="w-3.5 h-3.5 shrink-0" /> {{ countHint }}
          </p>

          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="shuffleOpts" type="checkbox" class="accent-primary w-4 h-4" />
            打乱选项顺序（答案字母同步更新）
          </label>

          <div class="border-t border-border pt-4 space-y-3">
            <p class="text-sm font-medium text-foreground">卷头（打印在试卷顶部）</p>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">试卷标题</label>
              <input v-model="paperTitle" type="text" :class="INP_CLS" />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">考试信息行</label>
              <input v-model="paperInfo" type="text" :class="INP_CLS" />
            </div>
          </div>

          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="showAnswerPage" type="checkbox" class="accent-primary w-4 h-4" />
            附带答案页（打印时另起一页，含解析）
          </label>

          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>改题库或设置会按当前种子即时重新组卷；点「重新抽题」才换新随机种子出新卷。同一种子 + 同题库 + 同设置 = 逐题一致。</span>
          </p>

          <div class="grid grid-cols-1 gap-2 pt-1">
            <button
              @click="regenerate"
              class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw class="w-4 h-4" /> 重新抽题（换一套题）
            </button>
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="printPaper"
                class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
              >
                <Printer class="w-4 h-4" /> 打印 / PDF
              </button>
              <button
                @click="copyPaper"
                class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle v-if="copiedPaper" class="w-4 h-4 text-green-500" />
                <Copy v-else class="w-4 h-4" />
                {{ copiedPaper ? '已复制' : '复制试卷' }}
              </button>
            </div>
            <button
              @click="copyAnswers"
              class="w-full px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
            >
              <CheckCircle v-if="copiedAnswers" class="w-4 h-4 text-green-500" />
              <Copy v-else class="w-4 h-4" />
              {{ copiedAnswers ? '已复制' : '复制答案文本' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 右：A4 预览（打印时仅输出试卷页与答案页） -->
      <div class="lg:col-span-2 print-area">
        <div class="no-print flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Shuffle class="w-5 h-5 mr-2 text-primary" /> 试卷预览（A4）
          </h2>
          <div class="inline-flex rounded-lg border border-border overflow-hidden text-sm">
            <button
              type="button"
              @click="viewMode = 'questions'"
              class="px-3 py-1.5 transition"
              :class="viewMode === 'questions' ? 'bg-primary/10 text-primary font-medium' : 'bg-card text-muted-foreground hover:bg-muted/70'"
            >
              试卷
            </button>
            <button
              v-if="showAnswerPage"
              type="button"
              @click="viewMode = 'answers'"
              class="px-3 py-1.5 transition"
              :class="viewMode === 'answers' ? 'bg-primary/10 text-primary font-medium' : 'bg-card text-muted-foreground hover:bg-muted/70'"
            >
              答案页
            </button>
          </div>
        </div>

        <!-- 题库解析统计条 -->
        <div class="no-print flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-xs text-muted-foreground">
          <span class="flex items-center gap-1">
            <Info class="w-3.5 h-3.5 shrink-0" />
            共 {{ bankStats.total }} 题 · 选择题 {{ bankStats.choice }} · 简答/填空 {{ bankStats.short }} · 当前种子 {{ effectiveSeed }}<template v-if="seedIsRandom">（随机）</template>
          </span>
          <span v-if="bankStats.missing > 0" class="flex items-center gap-1 text-amber-600">
            <TriangleAlert class="w-3.5 h-3.5 shrink-0" /> {{ bankStats.missing }} 题未标答案，答案页将以「未标答案」占位
          </span>
          <span
            v-if="paper.questions.length"
            class="flex items-center gap-1 text-green-600"
          >
            <CheckCircle class="w-3.5 h-3.5 shrink-0" /> 已抽出 {{ paper.questions.length }} 题
          </span>
        </div>

        <div ref="previewWrapRef" class="w-full">
          <div class="preview-holder mx-auto" :style="holderStyle">
            <div ref="previewStackRef" class="pages-stack" :style="stackStyle">
              <!-- 试卷页 -->
              <div
                v-show="viewMode === 'questions'"
                class="a4-sheet"
                :class="{ 'sheet-break': showAnswerPage }"
              >
                <p class="sheet-title">{{ paperTitle }}</p>
                <p class="sheet-info">{{ paperInfo }}</p>
                <div v-if="paper.questions.length" class="q-list">
                  <div v-for="q in paper.questions" :key="q.no" class="q-block">
                    <p class="q-stem">
                      <span class="q-no">{{ q.no }}.</span><span class="q-stem-text">{{ q.stem }}</span>
                    </p>
                    <p v-for="opt in q.options" :key="opt.letter" class="q-opt">
                      <span class="opt-letter">{{ opt.letter }}.</span>{{ opt.text }}
                    </p>
                    <p v-if="!q.options.length" class="q-blank"></p>
                  </div>
                </div>
                <p v-else class="sheet-empty">
                  题库为空：在左侧粘贴题目（题目之间空一行）后即可在此预览试卷。
                </p>
              </div>
              <!-- 答案页（单独一页：题号 + 答案字母/答案文本 + 解析） -->
              <div
                v-if="showAnswerPage"
                v-show="viewMode === 'answers'"
                class="a4-sheet"
              >
                <p class="sheet-title">{{ paperTitle }} · 参考答案</p>
                <p class="sheet-info">共 {{ answerRows.length }} 题 · 解析随答案附在对应题号下</p>
                <div v-if="answerRows.length" class="ans-list">
                  <div v-for="a in answerRows" :key="a.no" class="ans-item">
                    <p class="ans-line"><span class="q-no">{{ a.no }}.</span>{{ a.missing ? '未标答案' : a.answer }}</p>
                    <p v-if="a.explain" class="ans-explain">解析：{{ a.explain }}</p>
                  </div>
                </div>
                <p v-else class="sheet-empty">暂无题目。</p>
              </div>
            </div>
          </div>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：打印或另存 PDF 时缩放请选「100% / 实际大小」，本页已按 A4 竖版、12mm 页边距排版；打印只会输出试卷页（若开启答案页则另起一页附加在卷尾，解析一并带出），
          设置面板与页面其余内容不会被打出来。题目较多时会自动分页，每道题完整不断行。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>随机抽题组卷是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          随机抽题组卷是一款面向老师、家长与自测者的免费在线出卷工具。把整理好的题库整段粘贴进输入框，工具会按空行宽容解析出每道题的题干、选项（A. / A、 / (A) 三种写法都认）、
          答案（答案：B / 答案:B / 【答案】B 均可，多选支持「A、C」）与解析；再设定抽取数量，用 Fisher-Yates 算法从题库中随机抽题组卷，可选择打乱选项顺序——答案字母按新位置同步重映射，不会错位。
          出卷随机数使用确定性的 mulberry32：同一种子配同一题库，任何时候都能逐题复现同一份卷。试卷按 A4 排版可直接打印，答案页单独分页输出，
          也可以一键复制试卷与答案的纯文本。全部解析与生成都在浏览器本地完成，题库不上传。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么快速建题库？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          建库三步：① 每道题写完后空一行再写下一题，题目之间以空行分隔；② 选择题的选项各占一行，以「A.」「A、」或「(A)」开头（最多 6 个选项 A-F），
          题干行开头的「1.」「12、」「（3）」等序号前缀会自动剥离，不用手动删；③ 答案另起一行写「答案：B」（中英文冒号、「【答案】B」写法都认），
          需要解析再写一行「解析：……」，解析只会出现在答案页，不会印在试卷上。没有选项行的题自动按简答 / 填空题处理，答案直接写文字即可。
          从 Word / WPS 文档粘贴时，建议把「自动编号」转成普通文字（手打的 1. 序号工具也会剥离）；全角句号、全角冒号等中文标点都能正常识别，题间空行一定要保留。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">随机抽题对复习有什么意义？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          认知心理学把「主动回忆」带来的记忆巩固称为测试效应（自测效应）：与其反复阅读笔记，不如合上材料做题——提取一次记忆，比再读三遍更有效。
          用本工具从大题库里随机抽 10-20 题限时自测，每次抽到的组合都不同，覆盖面自然铺开；对照答案页批改后，错的题回到对应章节补漏。
          相比从头到尾按顺序刷题，随机抽题还能避免「背位置、背题号」，更接近真实考试的提取情境。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">选项打乱有什么作用？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          固定顺序的题库做几轮后，很容易记住「这题选 C」而不是记住知识点本身。打开「打乱选项顺序」后，每道选择题的选项会随机重排，
          答案字母按新位置同步重映射——正确选项的内容不变，只是字母换了，不会出现答案错位。该开关只作用于有 2 个及以上选项的选择题；
          简答、填空题没有选项，不受影响。打印前如果想让某次练习保持题库原序，关掉开关即可。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">同种子同卷有什么场景？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          工具的随机数来自确定性的 mulberry32 算法：给定同一个种子数字，随机序列完全固定，因此「同一种子 + 同一题库 + 同样设置」在任何时候、任何设备上都会生成逐题一致的卷子。
          典型场景：老师把种子数字连同页面链接发给家长，全班打印出同一份卷，便于统一讲评；卷子打丢了，填回原种子即可补打；
          想要另一套题，点「重新抽题」换新种子，或把不同种子分给不同小组做 AB 卷。注意：修改题库内容或抽题设置后，同一种子生成的卷子也会随之变化。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">和在线考试系统有什么差别？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本工具定位是「纸卷打印」：产出物是一份可打印的 A4 试卷和答案页，不组织在线答题、不自动判分、不统计成绩，也不需要注册登录。
          适合课堂随测、家庭练习、培训机构内部分层出卷等纸笔场景；如果你需要在线作答、自动批改、错题本和成绩分析，那是在线考试系统的职责。
          两者并不冲突：日常用本工具低成本出卷刷题，正式统考再交给考试平台。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">题库支持什么格式？答案怎么写？</h3>
            <p class="text-sm text-muted-foreground mt-1">题目之间空一行；选项行以 A. 、A、 或 (A) 开头（最多 6 个）；答案行写「答案：B」（中英文冒号、「【答案】B」均可，多选可写「A、C」）；「解析：」行选填，只出现在答案页。没有选项的题自动按简答/填空处理，答案写文字即可。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">打乱选项后答案会不会错位？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。打乱只重排选项顺序，答案字母会按新位置同步重映射，正确选项的内容保持不变；简答/填空题没有选项，不受影响。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">同一个种子生成的卷子完全一样吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">是。同一种子配同一题库与相同设置，逐题完全一致，可用来布置全班同卷或补打丢卷；修改题库或设置后，同一种子的结果会随之变化。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">题库内容会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。解析、抽题、排版全部在浏览器本地完成，不发送任何网络请求，也不做本地存储；换题库直接覆盖输入框即可。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'random-quiz-picker'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Shuffle, Printer, Copy, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '随机抽题组卷 - 在线题库抽题出卷打印工具（带答案页）',
  description: '免费在线随机抽题组卷工具：粘贴题库自动解析题干、选项与答案，按数量随机抽题成卷，选项可打乱且答案字母同步更新，mulberry32 种子同卷可复现，A4 试卷直接打印并附独立答案页，支持复制试卷与答案纯文本，纯浏览器本地处理不上传',
  keywords: '随机抽题,组卷工具,题库抽题,考试出卷,练习题生成',
  author: '有条工具',
  ogTitle: '随机抽题组卷 - 在线题库抽题出卷打印工具（带答案页） | 有条工具',
  ogDescription: '粘贴题库随机抽题成卷，选项可打乱，同种子同卷可复现，A4 打印附独立答案页。',
  ogUrl: 'https://www.util.cn/tools/random-quiz-picker',
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
          name: '随机抽题组卷',
          url: 'https://www.util.cn/tools/random-quiz-picker',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '粘贴题库宽容解析：题干/选项/答案/解析',
            'Fisher-Yates 随机抽题，数量自动钳制',
            '选项打乱且答案字母同步重映射',
            'mulberry32 确定性种子，同种子同卷可复现',
            'A4 试卷打印，答案页单独分页输出',
            '试卷与答案一键复制纯文本',
            '纯浏览器本地处理不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '随机抽题组卷', item: 'https://www.util.cn/tools/random-quiz-picker/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '题库支持什么格式？答案怎么写？',
              acceptedAnswer: { '@type': 'Answer', text: '题目之间空一行；选项行以 A.、A、或 (A) 开头（最多6个）；答案行写「答案：B」（中英文冒号、「【答案】B」均可，多选可写「A、C」）；「解析：」行选填，只出现在答案页。没有选项的题自动按简答/填空处理，答案写文字即可。' }
            },
            {
              '@type': 'Question',
              name: '打乱选项后答案会不会错位？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。打乱只重排选项顺序，答案字母会按新位置同步重映射，正确选项的内容保持不变；简答/填空题没有选项，不受影响。' }
            },
            {
              '@type': 'Question',
              name: '同一个种子生成的卷子完全一样吗？',
              acceptedAnswer: { '@type': 'Answer', text: '是。同一种子配同一题库与相同设置，逐题完全一致，可用来布置全班同卷或补打丢卷；修改题库或设置后，同一种子的结果会随之变化。' }
            },
            {
              '@type': 'Question',
              name: '题库内容会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。解析、抽题、排版全部在浏览器本地完成，不发送任何网络请求，也不做本地存储；换题库直接覆盖输入框即可。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MAX_BANK_BYTES = 500 * 1024 // 题库输入上限：500KB
const OPTION_LETTERS = 'ABCDEF'   // 选项字母池（最多 6 个选项）

// mulberry32 确定性伪随机数发生器（标准实现）：同一种子产生完全相同的 [0,1) 序列
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 字符串的 UTF-8 字节数（限制题库 500KB 用）
function byteLengthOf(text) {
  return new TextEncoder().encode(String(text)).length
}

// 单个码点的 UTF-8 字节数（1-4 字节）
function charBytesOf(code) {
  if (code < 0x80) return 1
  if (code < 0x800) return 2
  if (code < 0x10000) return 3
  return 4
}

// 按字节上限截断文本（在码点边界截断，避免切出半个字符）
function truncateBytesOf(text, maxBytes) {
  const s = String(text)
  let out = ''
  let bytes = 0
  for (const ch of s) {
    const b = charBytesOf(ch.codePointAt(0))
    if (bytes + b > maxBytes) break
    out += ch
    bytes += b
  }
  return out
}

// 剥离题干行的序号前缀：如 "1." "12、" "3．" "(4)" "（5）"（只剥离一次）
function stripIndexPrefixOf(line) {
  return line.replace(/^\s*(?:\d{1,3}\s*[.、．]|[（(]\s*\d{1,3}\s*[）)])\s*/, '')
}

const ANSWER_RE = /^\s*(?:【\s*答案\s*】|答案\s*[:：])\s*(.*)$/
const EXPLAIN_RE = /^\s*(?:【\s*解析\s*】|解析\s*[:：])\s*(.*)$/
const OPT_PAREN_RE = /^\s*[（(]\s*([A-Fa-f])\s*[）)]\s*(.*)$/ // (A) xxx
const OPT_DOT_RE = /^\s*([A-Fa-f])\s*[.、．]\s*(.*)$/          // A. xxx / A、xxx

// 答案归一化：选择题提取字母（支持 B / BC / B、C / B. 风能 等写法），简答题保留原文；缺失返回 undefined
function normalizeAnswerOf(raw, hasOptions) {
  const s = String(raw === undefined || raw === null ? '' : raw).trim()
  if (!s) return undefined
  if (!hasOptions) return s.replace(/[。．.、\s]+$/, '') || undefined
  const letters = []
  const rest = s.replace(/[A-Fa-f]/g, (ch) => { letters.push(ch.toUpperCase()); return '' })
  const sepOnly = rest.replace(/[\s、，,．.\/()（）]/g, '')
  if (letters.length && sepOnly === '') return [...new Set(letters)].join('')
  if (letters.length && /^\s*[、，,．.\/]/.test(rest)) return letters[0]
  return s
}

// 宽容解析题库文本 → [{ stem, options:[{letter,text}], answer?, explain? }]
// 规则：题目之间以空行分隔；题干行自动剥离序号前缀；选项行 A. / A、 / (A) 三种写法（0-6 个）；
//       答案行 / 解析行可选；无选项的题视为简答/填空题；答案缺失时 answer 为 undefined（统计层计为「未标答案」）
function parseQuestionsOf(text) {
  const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n')
  const blocks = []
  let cur = []
  for (const line of lines) {
    if (line.trim() === '') {
      if (cur.length) { blocks.push(cur); cur = [] }
    } else {
      cur.push(line)
    }
  }
  if (cur.length) blocks.push(cur)

  const questions = []
  for (const block of blocks) {
    let stem = ''
    const options = []
    let answerRaw
    let explain = ''
    for (const rawLine of block) {
      const line = rawLine.trim()
      if (!line) continue
      const ansM = ANSWER_RE.exec(line)
      if (ansM) { answerRaw = ansM[1]; continue }
      const expM = EXPLAIN_RE.exec(line)
      if (expM) { explain = expM[1].trim(); continue }
      const parenM = OPT_PAREN_RE.exec(line)
      if (parenM) { options.push({ letter: parenM[1].toUpperCase(), text: parenM[2].trim() }); continue }
      const dotM = OPT_DOT_RE.exec(line)
      if (dotM) { options.push({ letter: dotM[1].toUpperCase(), text: dotM[2].trim() }); continue }
      stem = stem ? stem + '\n' + line : stripIndexPrefixOf(line)
    }
    if (!stem && !options.length) continue
    questions.push({
      stem,
      options,
      answer: normalizeAnswerOf(answerRaw, options.length > 0),
      explain: explain || undefined
    })
  }
  return questions
}

// 题库统计：总题数 / 选择题数 / 简答填空数 / 未标答案数
function bankStatsOf(questions) {
  const list = Array.isArray(questions) ? questions : []
  let choice = 0
  let short = 0
  let missing = 0
  for (const q of list) {
    if (q && Array.isArray(q.options) && q.options.length > 0) choice += 1
    else short += 1
    if (!q || !q.answer) missing += 1
  }
  return { total: list.length, choice, short, missing }
}

// Fisher-Yates 不可变抽题：不修改原数组，返回前 n 道题（n 钳制到 [0, 题库数]）
function pickQuestionsOf(pool, n, rng) {
  const src = Array.isArray(pool) ? pool : []
  const count = Math.max(0, Math.min(src.length, Math.floor(Number(n) || 0)))
  const copy = src.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
  }
  return copy.slice(0, count)
}

// 选项打乱（仅 ≥2 选项题）：选项顺序随机重排，答案字母按新位置重映射；
// 不变量：正确选项的文本保持不变；选项少于 2 个时原样返回同一引用
function shuffleOptionsOf(q, rng) {
  const opts = q && Array.isArray(q.options) ? q.options : []
  if (opts.length < 2) return q
  const order = opts.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = order[i]
    order[i] = order[j]
    order[j] = tmp
  }
  const newOpts = order.map((oldIdx, pos) => ({
    letter: OPTION_LETTERS[pos],
    text: opts[oldIdx].text
  }))
  const letterMap = {}
  order.forEach((oldIdx, pos) => { letterMap[opts[oldIdx].letter] = OPTION_LETTERS[pos] })
  let answer = q.answer
  if (typeof answer === 'string' && /^[A-Fa-f\s、，,．.]+$/.test(answer)) {
    const letters = answer.match(/[A-Fa-f]/g)
    if (letters && letters.length) {
      const remapped = letters.map((ch) => letterMap[ch.toUpperCase()] || ch.toUpperCase())
      answer = [...new Set(remapped)].sort().join('')
    }
  }
  return Object.assign({}, q, { options: newOpts, answer })
}

// 答案页结构：[{ no, answer, missing, explain }]（answer 为答案字母或简答文本）
function answerSheetOf(picked) {
  const list = Array.isArray(picked) ? picked : []
  return list.map((q, i) => ({
    no: i + 1,
    answer: q && q.answer ? String(q.answer) : '',
    missing: !(q && q.answer),
    explain: q && q.explain ? String(q.explain) : ''
  }))
}

// 纯文本版试卷（导出/复制用）：withAnswer=true 时每题附带「答案：」与「解析：」行
function plainTextOf(picked, withAnswer) {
  const list = Array.isArray(picked) ? picked : []
  const lines = []
  list.forEach((q, i) => {
    const no = i + 1
    const stem = q && q.stem ? String(q.stem) : ''
    lines.push(no + '. ' + stem)
    const opts = q && Array.isArray(q.options) ? q.options : []
    for (const opt of opts) {
      lines.push('   ' + opt.letter + '. ' + (opt.text == null ? '' : String(opt.text)))
    }
    if (withAnswer) {
      lines.push('答案：' + (q && q.answer ? String(q.answer) : '未标答案'))
      if (q && q.explain) lines.push('解析：' + String(q.explain))
    }
  })
  return lines.join('\n')
}

// ---------- 页面状态与交互 ----------
const INP_CLS = 'w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const bankPlaceholder = [
  '在此粘贴题库，题目之间空一行，例如：',
  '',
  '1. 地球绕太阳一周的时间大约是？',
  'A. 一天',
  'B. 一年',
  '答案：B',
  '解析：公转周期约 365 天。',
  '',
  '无选项的题会自动按简答 / 填空题处理。'
].join('\n')

// 默认示例题库：覆盖三种选项写法、多选、简答与解析，保证首屏即可看到完整效果（SSR 一致）
const DEFAULT_BANK = [
  '1. 地球绕太阳公转一周的时间大约是？',
  'A. 一天',
  'B. 一个月',
  'C. 一年',
  'D. 十年',
  '答案：C',
  '解析：地球公转周期约为 365.25 天，即一年。',
  '',
  '2. 下列属于可再生能源的是（　）。',
  'A、煤炭',
  'B、石油',
  'C、风能',
  'D、天然气',
  '答案：C',
  '',
  '3. 《静夜思》的作者是谁？',
  'A. 李白',
  'B. 杜甫',
  'C. 白居易',
  '答案：A',
  '',
  '4. 1 字节等于多少比特？',
  '(A) 4 比特',
  '(B) 8 比特',
  '(C) 16 比特',
  '答案：B',
  '',
  '5. 中国的首都是______。',
  '答案：北京',
  '解析：填空题，答案为北京。',
  '',
  '6. 一个正方体有几个面？',
  'A. 4 个',
  'B. 6 个',
  'C. 8 个',
  '答案：B',
  '',
  '7. 简答：水的化学式是什么？',
  '答案：H₂O',
  '',
  '8. 下列哪些是哺乳动物？（多选）',
  'A. 蝙蝠',
  'B. 鲸鱼',
  'C. 鳄鱼',
  'D. 海豚',
  '答案：A、B、D',
  '解析：蝙蝠、鲸鱼、海豚都是哺乳动物，鳄鱼是爬行动物。'
].join('\n')

const bankText = ref(DEFAULT_BANK)
const pickCount = ref(5)
const shuffleOpts = ref(false)
const seedInput = ref('2026')
const activeSeed = ref(2026) // 固定默认种子，保证 SSR 与客户端首屏渲染一致
const paperTitle = ref('随机抽题练习卷')
const paperInfo = ref('姓名：________　　班级：________　　日期：________')
const showAnswerPage = ref(true)
const viewMode = ref('questions')
const seoContentVisible = ref(true)
const copiedPaper = ref(false)
const copiedAnswers = ref(false)
let copiedPaperTimer = null
let copiedAnswersTimer = null

// 种子解析：空或非数字返回 null（表示随机）
function seedFromInput() {
  const raw = String(seedInput.value).trim()
  if (raw === '') return null
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? Math.abs(n) >>> 0 : null
}

// 9 位正整数随机种子（仅在回调中调用，SSR 安全）
function randomSeed() {
  return Math.floor(Math.random() * 900000000) + 100000000
}

const parsedSeed = computed(() => seedFromInput())
const effectiveSeed = computed(() => (parsedSeed.value !== null ? parsedSeed.value : activeSeed.value))
const seedIsRandom = computed(() => parsedSeed.value === null)

// 题库解析与 500KB 限制（超限截断到码点边界后解析）
const bankBytes = computed(() => byteLengthOf(bankText.value))
const bankOverLimit = computed(() => bankBytes.value > MAX_BANK_BYTES)
const bank = computed(() =>
  parseQuestionsOf(bankOverLimit.value ? truncateBytesOf(bankText.value, MAX_BANK_BYTES) : bankText.value)
)
const bankStats = computed(() => bankStatsOf(bank.value))

// 抽取数量钳制到 [1, 题库上限]，越界给出提示
const effectiveCount = computed(() =>
  Math.max(1, Math.min(bankStats.value.total, Math.floor(Number(pickCount.value) || 1)))
)
const countHint = computed(() => {
  const total = bankStats.value.total
  if (!total) return ''
  const want = Math.floor(Number(pickCount.value) || 1)
  if (want > total) return '题库共 ' + total + ' 题，抽取数量已按上限 ' + total + ' 题处理'
  if (want < 1) return '抽取数量至少为 1 题，已自动调整'
  return ''
})

// 组卷：同一 rng 流先抽题、再打乱选项；同种子 + 同题库 + 同设置 = 逐题一致（纯计算，SSR 安全）
const paper = computed(() => {
  const pool = bank.value
  if (!pool.length) return { questions: [], seed: effectiveSeed.value }
  const rng = mulberry32(effectiveSeed.value >>> 0)
  const picked = pickQuestionsOf(pool, effectiveCount.value, rng)
  const chosen = shuffleOpts.value ? picked.map((q) => shuffleOptionsOf(q, rng)) : picked
  return {
    questions: chosen.map((q, i) => Object.assign({}, q, { no: i + 1 })),
    seed: effectiveSeed.value
  }
})
const answerRows = computed(() => answerSheetOf(paper.value.questions))

// 关闭答案页时若正停留在答案页视图，切回试卷
watch(showAnswerPage, (v) => {
  if (!v && viewMode.value === 'answers') viewMode.value = 'questions'
})

function applySeedInput() {
  // 输入框为空 / 非法时视为随机：立刻生成一个随机种子，保证当前卷稳定可看
  if (seedFromInput() === null) activeSeed.value = randomSeed()
}

// 重新抽题：换新随机种子（同时清空输入框，表示当前卷来自随机）
function regenerate() {
  seedInput.value = ''
  activeSeed.value = randomSeed()
}

function printPaper() {
  window.print()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 剪贴板写入：优先 Clipboard API，非安全上下文回退 execCommand（仅回调中调用，SSR 安全）
async function writeClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return true
  } catch (err) {
    return false
  }
}

async function copyPaper() {
  const ok = await writeClipboard(plainTextOf(paper.value.questions, false))
  if (ok) {
    copiedPaper.value = true
    if (copiedPaperTimer) clearTimeout(copiedPaperTimer)
    copiedPaperTimer = setTimeout(() => {
      copiedPaper.value = false
      copiedPaperTimer = null
    }, 2000)
  }
}

async function copyAnswers() {
  const ok = await writeClipboard(plainTextOf(paper.value.questions, true))
  if (ok) {
    copiedAnswers.value = true
    if (copiedAnswersTimer) clearTimeout(copiedAnswersTimer)
    copiedAnswersTimer = setTimeout(() => {
      copiedAnswers.value = false
      copiedAnswersTimer = null
    }, 2000)
  }
}

// ---------- A4 预览缩放（mm 为单位，屏幕缩放预览、打印还原物理尺寸） ----------
const MM_PX = 96 / 25.4
const SHEET_W_MM = 210
const pageWpx = SHEET_W_MM * MM_PX
const previewWrapRef = ref(null)
const previewStackRef = ref(null)
const previewScale = ref(1)
const stackH = ref(0)
let resizeObserver = null

const holderStyle = computed(() => ({
  width: pageWpx * previewScale.value + 'px',
  height: stackH.value > 0 ? stackH.value * previewScale.value + 'px' : 'auto'
}))

const stackStyle = computed(() => ({
  width: pageWpx + 'px',
  transform: 'scale(' + previewScale.value + ')',
  transformOrigin: 'top left'
}))

function updateScale() {
  const wrap = previewWrapRef.value
  if (!wrap) return
  const avail = wrap.clientWidth
  if (avail > 0) previewScale.value = Math.min(1, (avail - 2) / pageWpx)
  if (previewStackRef.value) stackH.value = previewStackRef.value.offsetHeight
}

// @page 规则单独注入（静态内容，A4 竖版 + 12mm 页边距）
const printPageCss = '@page { size: A4 portrait; margin: 12mm; }'

onMounted(() => {
  updateScale()
  if (typeof ResizeObserver !== 'undefined' && previewWrapRef.value) {
    resizeObserver = new ResizeObserver(updateScale)
    resizeObserver.observe(previewWrapRef.value)
    if (previewStackRef.value) resizeObserver.observe(previewStackRef.value)
  }
  addRecentTool('random-quiz-picker')
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (copiedPaperTimer) {
    clearTimeout(copiedPaperTimer)
    copiedPaperTimer = null
  }
  if (copiedAnswersTimer) {
    clearTimeout(copiedAnswersTimer)
    copiedAnswersTimer = null
  }
})
</script>

<style scoped>
/* 屏幕上的 A4 卷面 */
.a4-sheet {
  width: 210mm;
  min-height: 297mm;
  padding: 12mm 14mm;
  background: #ffffff;
  color: #111827;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
  border-radius: 2px;
  overflow: hidden;
  font-size: 10.5pt;
  line-height: 1.55;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.pages-stack > .a4-sheet + .a4-sheet {
  margin-top: 16px;
}
.sheet-title {
  font-size: 15pt;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.05em;
}
.sheet-info {
  font-size: 9pt;
  color: #374151;
  text-align: center;
  border-bottom: 1.5px solid #d1d5db;
  padding-bottom: 3mm;
  margin: 2mm 0 6mm;
  white-space: pre-wrap;
}
.q-block {
  margin-bottom: 4.5mm;
  break-inside: avoid;
  page-break-inside: avoid;
}
.q-stem {
  font-variant-numeric: tabular-nums;
}
.q-no {
  display: inline-block;
  min-width: 2.2em;
  color: #6b7280;
}
.q-stem-text {
  white-space: pre-line;
}
.q-opt {
  padding-left: 2.2em;
  font-variant-numeric: tabular-nums;
}
.opt-letter {
  display: inline-block;
  min-width: 1.6em;
  color: #374151;
}
/* 简答/填空题（无选项）预留手写作答线 */
.q-blank {
  height: 8mm;
  border-bottom: 1px solid #9ca3af;
  margin: 2mm 0 0 2.2em;
}
.sheet-empty {
  color: #6b7280;
  font-size: 10pt;
  text-align: center;
  padding: 24mm 0;
}
.ans-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 8mm;
  row-gap: 2.5mm;
  align-content: start;
}
.ans-item {
  break-inside: avoid;
  page-break-inside: avoid;
}
.ans-line {
  font-weight: 600;
  color: #1e40af;
  font-variant-numeric: tabular-nums;
}
.ans-explain {
  font-size: 8.5pt;
  font-weight: 400;
  color: #4b5563;
  line-height: 1.45;
  margin-top: 0.5mm;
}

@media print {
  .no-print {
    display: none !important;
  }
  /* 打印时放开布局壳层：左右分栏改为通栏，保证 A4 卷面完整输出 */
  .print-grid {
    display: block !important;
  }
  .print-area {
    width: auto !important;
  }
  :global(main) {
    overflow: visible !important;
    height: auto !important;
  }
  .preview-holder {
    width: auto !important;
    height: auto !important;
  }
  .pages-stack {
    transform: none !important;
    width: auto !important;
  }
  /* 覆盖 v-show 的 display:none：打印时试卷页与答案页都输出 */
  .a4-sheet {
    display: block !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    width: auto !important;
    min-height: 0 !important;
    padding: 0 !important;
    margin-top: 0 !important;
  }
  .pages-stack > .a4-sheet + .a4-sheet {
    margin-top: 0 !important;
  }
  /* 答案页另起一页（仅在开启答案页时给试卷页加分页符，避免输出空白页） */
  .sheet-break {
    break-after: page;
    page-break-after: always;
  }
}
</style>
