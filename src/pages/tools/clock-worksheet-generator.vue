<template>
  <div class="max-w-8xl mx-auto">
    <!-- 全局 @page 规则：A4 竖版、12mm 页边距 -->
    <component :is="'style'" v-html="printPageCss"></component>

    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Clock class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">认识时钟练习纸</h1>
          <p class="text-sm text-muted-foreground mt-1">看钟写时间与画指针双题型，整点到任意分钟五档难度，A4 可打印附答案页</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线认识时钟练习纸生成器，两种题型：看钟写时间（SVG 钟面带时针分针，下方「____时____分」填写行）与画指针
        （空钟面只印刻度，给出电子时间由孩子画出时针分针）。难度五档可选：整点、半点、一刻（15/45 分）、5 分钟档与任意分钟，
        每页 6/9/12 题、2-3 栏排布，钟面为纯矢量 SVG，打印清晰。可附独立答案页（电子时间文本）。
        填写相同的随机种子随时再生成完全相同的一份卷。全部在浏览器本地生成，不上传任何数据。
      </p>
    </div>

    <div class="print-grid grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：出题设置 -->
      <div class="no-print space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Clock class="w-5 h-5 mr-2 text-primary" /> 题型与难度
            </h2>
          </div>

          <div>
            <label class="block text-xs text-muted-foreground mb-1">题型</label>
            <div class="grid grid-cols-3 gap-1">
              <button
                v-for="t in QTYPE_OPTIONS"
                :key="t.id"
                type="button"
                @click="qType = t.id"
                class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                :class="qType === t.id ? BTN_ON : BTN_OFF"
              >
                {{ t.label }}
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              看钟写时间：钟面画好指针，孩子在下方写出时间；画指针：只印空钟面与电子时间，孩子自己画出时针分针。
            </p>
          </div>

          <div>
            <label class="block text-xs text-muted-foreground mb-1">难度档</label>
            <select v-model="difficulty" :class="SEL_CLS">
              <option v-for="d in DIFFICULTY_OPTIONS" :key="d.id" :value="d.id">{{ d.label }}</option>
            </select>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed">
            钟面指针按标准角度绘制：时针角 =（时 % 12）× 30° + 分 × 0.5°，分针角 = 分 × 6°，
            半点时时针恰好在两个数字之间（如 3:30 时针指向 3 和 4 正中间），与真实钟表一致。
          </p>
        </div>

        <!-- 版式与输出 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 版式与输出
          </h2>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-muted-foreground mb-1">每页题数</label>
              <select v-model.number="count" :class="SEL_CLS">
                <option v-for="n in COUNT_OPTIONS" :key="n" :value="n">{{ n }} 题</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">栏数</label>
              <div class="grid grid-cols-2 gap-1">
                <button
                  v-for="c in COL_OPTIONS"
                  :key="c"
                  type="button"
                  @click="cols = c"
                  class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                  :class="cols === c ? BTN_ON : BTN_OFF"
                >
                  {{ c }} 栏
                </button>
              </div>
            </div>
          </div>

          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="showAnswers" type="checkbox" class="accent-primary w-4 h-4" />
            附加答案页（电子时间文本）
          </label>

          <div>
            <label class="block text-xs text-muted-foreground mb-1">页眉（打印在题目上方，可直接修改）</label>
            <input
              v-model="headerText"
              type="text"
              :class="SEL_CLS"
              placeholder="认识时钟练习 · ____年__月__日 · 姓名____"
            />
          </div>

          <div>
            <label class="block text-xs text-muted-foreground mb-1">随机种子（同一种子 = 同一份卷）</label>
            <input
              v-model="seedInput"
              type="text"
              inputmode="numeric"
              :class="SEL_CLS"
              placeholder="留空则每次随机；如填 42 随时能再出同一份卷"
              @change="applySeedInput"
            />
          </div>

          <div class="grid grid-cols-1 gap-2 pt-1">
            <button
              @click="regenerate"
              class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw class="w-4 h-4" /> 重新生成（换一套题）
            </button>
            <button
              @click="printWorksheet"
              class="w-full px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
            >
              <Printer class="w-4 h-4" /> 打印 / PDF
            </button>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>改任何设置会按当前种子即时重新组卷；只有点「重新生成」才会换新随机种子出新卷。同一种子 + 同样设置 = 逐题完全一致。</span>
          </p>
        </div>
      </div>

      <!-- 右：A4 预览（打印时仅输出题目页与答案页） -->
      <div class="lg:col-span-2 print-area">
        <div class="no-print flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Play class="w-5 h-5 mr-2 text-primary" /> A4 预览
          </h2>
          <div class="inline-flex rounded-lg border border-border overflow-hidden text-sm">
            <button
              type="button"
              @click="viewMode = 'questions'"
              class="px-3 py-1.5 transition"
              :class="viewMode === 'questions' ? 'bg-primary/10 text-primary font-medium' : 'bg-card text-muted-foreground hover:bg-muted/70'"
            >
              题目页
            </button>
            <button
              v-if="showAnswers"
              type="button"
              @click="viewMode = 'answers'"
              class="px-3 py-1.5 transition"
              :class="viewMode === 'answers' ? 'bg-primary/10 text-primary font-medium' : 'bg-card text-muted-foreground hover:bg-muted/70'"
            >
              答案页
            </button>
          </div>
        </div>

        <div class="no-print flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-xs text-muted-foreground">
          <span class="flex items-center gap-1">
            <Info class="w-3.5 h-3.5 shrink-0" />
            共 {{ worksheet.items.length }} 题 · {{ cols }} 栏排版 · 当前种子 {{ activeSeed }}
          </span>
        </div>

        <div class="sheet-scroll w-full">
          <div class="pages-stack mx-auto" style="width: 210mm; max-width: none">
            <!-- 题目页 -->
            <div
              v-show="viewMode === 'questions'"
              class="a4-sheet"
              :class="{ 'sheet-break': showAnswers }"
              :style="sheetStyle"
            >
              <p class="sheet-header">{{ headerText }}</p>
              <div class="q-grid" :style="gridStyle">
                <div v-for="it in worksheet.items" :key="it.no" class="clock-card">
                  <div class="flex items-start gap-1.5">
                    <span class="q-no">{{ it.no }}.</span>
                    <svg viewBox="0 0 100 100" class="clock-svg block">
                      <!-- 表盘 -->
                      <circle cx="50" cy="50" r="46" class="face" />
                      <!-- 60 个刻度（每 5 格一个主刻度） -->
                      <line
                        v-for="i in 60"
                        :key="'t' + i"
                        x1="50"
                        :y1="46 - ((i - 1) % 5 === 0 ? 4.6 : 2.6)"
                        x2="50"
                        y2="46"
                        :transform="'rotate(' + (i - 1) * 6 + ' 50 50)'"
                        :class="(i - 1) % 5 === 0 ? 'tick-major' : 'tick-minor'"
                      />
                      <!-- 数字（仅「看钟写时间」题型的钟面带数字） -->
                      <template v-if="it.type === 'write'">
                        <text
                          v-for="i in 12"
                          :key="'n' + i"
                          :x="numeralX(i)"
                          :y="numeralY(i)"
                          class="numeral"
                        >{{ i }}</text>
                        <!-- 时针：短粗；分针：细长。初始朝 12 点方向，按角度旋转 -->
                        <line
                          x1="50"
                          y1="52"
                          x2="50"
                          y2="28"
                          :transform="'rotate(' + it.hA + ' 50 50)'"
                          class="hand-hour"
                        />
                        <line
                          x1="50"
                          y1="53"
                          x2="50"
                          y2="15"
                          :transform="'rotate(' + it.mA + ' 50 50)'"
                          class="hand-minute"
                        />
                      </template>
                      <!-- 圆心 -->
                      <circle cx="50" cy="50" r="2.2" class="hub" />
                    </svg>
                  </div>
                  <p v-if="it.type === 'write'" class="clock-line">
                    <span class="blank-slot">____</span> 时 <span class="blank-slot">____</span> 分
                  </p>
                  <p v-else class="clock-line given">
                    {{ givenTimeText(it.h, it.m) }} —— 请画出时针和分针
                  </p>
                </div>
              </div>
            </div>
            <!-- 答案页（单独一页，电子时间文本） -->
            <div
              v-if="showAnswers"
              v-show="viewMode === 'answers'"
              class="a4-sheet answer-sheet"
              :style="sheetStyle"
            >
              <p class="sheet-header">{{ headerText }} · 参考答案</p>
              <div class="q-grid" :style="gridStyle">
                <p v-for="a in worksheet.answers" :key="'ans' + a.no" class="q-item q-answer">
                  <span class="q-no">{{ a.no }}.</span>{{ a.answer }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：打印或另存 PDF 时缩放请选「100% / 实际大小」，本页已按 A4 竖版、12mm 页边距排版；打印只会输出题目页（若开启答案页则另起一页附加在卷尾），
          设置面板与页面其余内容不会被打出来。钟面为矢量图形，任意缩放打印都清晰。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>认识时钟练习纸是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          认识时钟练习纸是一款面向幼儿园大班到小学低年级的免费在线钟表练习工具，提供两种互补的题型：
          「看钟写时间」印出带时针分针的 SVG 钟面（时针短粗、分针细长、圆心与 12 个数字刻度齐全），下方留「____时____分」填写行；
          「画指针」只印空钟面与电子时间（如 5:15），由孩子自己画出时针和分针，反向巩固指针与时间的关系。
          难度五档可选：整点、半点、一刻（15/45 分）、5 分钟档与任意分钟；每页 6/9/12 题、2-3 栏 A4 排布，
          可附独立答案页（电子时间文本）。出题使用确定性的 mulberry32 随机数，同一种子配同样设置随时复现同一份卷。
          全部生成与排版都在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">钟面上的指针角度是怎么回事？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          钟面被 12 个数字分成 12 大格，每大格 30°；分针每走 1 分钟转 6°（一圈 60 分钟 = 360°）；时针每小时转 30°，
          每分钟还会跟着多转 0.5°。所以时针角度 =（时数 % 12）× 30° + 分钟数 × 0.5°，分针角度 = 分钟数 × 6°。
          例如 3:30 时分针指向 6（180°），时针在 3 的基础上又走了半格，指向 3 和 4 的正中间（105°）——
          这正是孩子最容易出错的地方：半点时时针不在数字上，而在两个数字之间。本工具生成的钟面严格按这一角度绘制，与真实钟表一致。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">五档难度怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          建议顺序：先「整点」建立「短针指几就是几点」的概念；再「半点」体会时针在两数之间；然后「一刻」练 15 分（分针指 3）
          与 45 分（分针指 9）；「5 分钟档」把分针读数推广到每个大格对应 5 的倍数；最后「任意分钟」结合「分针一小格 = 1 分钟」数小格。
          一年级上学期一般到整点、半点，一年级下学期到半点与一刻，二年级引入 5 分钟与任意分钟（各版本教材略有差异，以孩子教材为准）。
          「画指针」题型适合穿插使用：能写出时间不代表能画出指针，双向往返才是真的掌握。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么同种子能出同一份卷？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          出题随机数使用确定性的 mulberry32 算法：同一种子配同样设置，任何时候、任何设备都生成逐题一致的卷子。
          老师可把同一种子发给全班做到同卷讲评；卷子打丢了填回原种子即可补打。想换新卷，点「重新生成」换新种子。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">孩子总是分不清时针和分针怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">先记口诀「短粗是时针、细长是分针」，再看钟面实物确认。本工具的钟面严格按短粗/细长绘制，可让孩子先只圈出所有短针读「几点」，再只看长针读「几分」，分两步降低难度。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么 3:30 的时针不在 3 上？</h3>
            <p class="text-sm text-muted-foreground mt-1">半点时分针走完半圈（30 分），时针也跟着走了半大格（15°），所以停在 3 和 4 的正中间。这是真实钟表的规律，本工具按「时针角 = 时×30° + 分×0.5°」绘制，可专门用「半点」档帮孩子突破这个易错点。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">「画指针」题型怎么批改？</h3>
            <p class="text-sm text-muted-foreground mt-1">对照答案页的电子时间，检查两点：分针是否准确指向对应刻度、时针是否落在正确位置（半点与一刻档尤其注意时针的中间位置）。建议要求孩子先画分针再画时针，避免画完分针忘记时针位置。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">打印会带出按钮和设置吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。打印样式已隐藏页面其余内容，只输出 A4 题目卷；勾选「附加答案页」时会另起一页单独打印电子时间答案，方便自批或家长批改。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">生成的题目会上传或保存吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有钟面与题目都在你的浏览器里即时生成，不发送任何网络请求，也不做本地存储；想保留哪份卷就把它的种子数字记下来。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'clock-worksheet-generator'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Clock, Printer, RefreshCw,
  ChevronUp, ChevronDown, Info, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '认识时钟练习纸 - 钟表练习题生成打印（看钟写时间/画指针）',
  description: '免费在线认识时钟练习纸生成器：看钟写时间与画指针双题型，SVG 钟面时针分针按标准角度绘制，整点/半点/一刻/5分钟/任意分钟五档难度，每页6/9/12题A4打印并附电子时间答案页，随机种子同码同卷，纯浏览器本地生成',
  keywords: '认识时钟练习纸,钟表练习题打印,看钟写时间,画指针练习,一年级时钟题,钟面生成器',
  author: '有条工具',
  ogTitle: '认识时钟练习纸 - 钟表练习题生成打印 | 有条工具',
  ogDescription: '看钟写时间与画指针双题型，五档难度，SVG 钟面按标准角度绘制，A4 打印附答案页，同种子同卷可复现。',
  ogUrl: 'https://www.util.cn/tools/clock-worksheet-generator',
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
          name: '认识时钟练习纸',
          url: 'https://www.util.cn/tools/clock-worksheet-generator',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '双题型：看钟写时间 / 画指针（空钟面）',
            '五档难度：整点、半点、一刻（15/45）、5 分钟档、任意分钟',
            'SVG 钟面：时针短粗、分针细长，角度按标准公式绘制',
            '每页 6/9/12 题，2-3 栏 A4 排版',
            '独立答案页（电子时间文本）',
            'mulberry32 确定性种子，同种子同卷可复现'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '认识时钟练习纸', item: 'https://www.util.cn/tools/clock-worksheet-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么 3:30 的时针不在 3 上？',
              acceptedAnswer: { '@type': 'Answer', text: '半点时分针走完半圈（30分），时针也跟着走了半大格（15°），所以停在3和4的正中间。本工具按时针角=时×30°+分×0.5°绘制，与真实钟表一致。' }
            },
            {
              '@type': 'Question',
              name: '「画指针」题型怎么批改？',
              acceptedAnswer: { '@type': 'Answer', text: '对照答案页的电子时间，检查分针是否指向对应刻度、时针是否落在正确位置（半点与一刻档注意时针的中间位置）；建议让孩子先画分针再画时针。' }
            },
            {
              '@type': 'Question',
              name: '打印会带出按钮和设置吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。打印样式已隐藏页面其余内容，只输出A4题目卷；勾选附加答案页时会另起一页单独打印电子时间答案，方便自批或家长批改。' }
            },
            {
              '@type': 'Question',
              name: '为什么同种子能出同一份卷？',
              acceptedAnswer: { '@type': 'Answer', text: '出题随机数使用确定性的mulberry32算法：同一种子配同样设置，任何时候任何设备都生成逐题一致的卷子；点重新生成即换新种子出新卷。' }
            }
          ]
        }
      ]
    })
  }]
})

/* PURE-FNS-START（纯函数区：供 node 自测提取，勿在此使用浏览器 API / Vue 响应式） */

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

// [min, max] 闭区间随机整数
function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1))
}

// 时针角度（度，从 12 点方向顺时针）：时针角 =（时 % 12）× 30 + 分 × 0.5
function hourAngle(h, m) {
  return (((h % 12) * 30 + m * 0.5) % 360 + 360) % 360
}

// 分针角度（度，从 12 点方向顺时针）：分针角 = 分 × 6
function minuteAngle(m) {
  return ((m * 6) % 360 + 360) % 360
}

// 电子时间文本：3:30 / 12:00
function formatClockTime(h, m) {
  return h + ':' + String(m).padStart(2, '0')
}

// 画指针题的题面文本：12:00 → 「12时整」，其余 → 「5时15分」
function givenTimeText(h, m) {
  return m === 0 ? h + '时整' : h + '时' + m + '分'
}

// 钟面数字 i（1-12）的坐标（viewBox 100×100，圆心 50,50，数字半径 36.5）
function numeralX(i) {
  return +(50 + 36.5 * Math.sin((i * Math.PI) / 6)).toFixed(2)
}
function numeralY(i) {
  return +(50 - 36.5 * Math.cos((i * Math.PI) / 6) + 2.8).toFixed(2)
}

// 按难度生成一个合法时间（h ∈ 1..12）
function genTime(rng, difficulty) {
  const h = randInt(rng, 1, 12)
  if (difficulty === 'half') return { h, m: 30 }
  if (difficulty === 'quarter') return { h, m: rng() < 0.5 ? 15 : 45 }
  if (difficulty === 'five') return { h, m: randInt(rng, 0, 11) * 5 }
  if (difficulty === 'any') return { h, m: randInt(rng, 0, 59) }
  return { h, m: 0 } // hour 整点
}

// 配置归一化：非法值回退默认
function normalizeClockConfig(config) {
  const c = config && typeof config === 'object' ? config : {}
  return {
    qType: ['write', 'draw', 'mixed'].includes(c.qType) ? c.qType : 'mixed',
    difficulty: ['hour', 'half', 'quarter', 'five', 'any'].includes(c.difficulty) ? c.difficulty : 'five',
    count: Math.min(24, Math.max(1, Math.floor(Number(c.count) || 9)))
  }
}

// 组卷：mixed 时看钟/画指针交替；同卷内去重时间（key = h×60+m）；同 config 同 seed 输出逐题完全一致
function buildClockWorksheet(config, seed) {
  const cfg = normalizeClockConfig(config)
  const rng = mulberry32(Number(seed) >>> 0)
  const slots = []
  for (let i = 0; i < cfg.count; i++) {
    slots.push(cfg.qType === 'mixed' ? (i % 2 === 0 ? 'write' : 'draw') : cfg.qType)
  }
  const items = []
  const answers = []
  const seen = new Set()
  for (let i = 0; i < slots.length; i++) {
    let t = null
    let key = ''
    for (let attempt = 0; attempt < 40; attempt++) {
      t = genTime(rng, cfg.difficulty)
      key = t.h * 60 + t.m
      if (!seen.has(key)) break
    }
    seen.add(key)
    items.push({ no: i + 1, type: slots[i], h: t.h, m: t.m, hA: hourAngle(t.h, t.m), mA: minuteAngle(t.m) })
    answers.push({ no: i + 1, answer: formatClockTime(t.h, t.m) })
  }
  return { items, answers }
}

/* PURE-FNS-END */

// ---------- 页面状态与交互 ----------
const QTYPE_OPTIONS = [
  { id: 'write', label: '看钟写时间' },
  { id: 'draw', label: '画指针' },
  { id: 'mixed', label: '混合' }
]
const DIFFICULTY_OPTIONS = [
  { id: 'hour', label: '整点（分针指 12）' },
  { id: 'half', label: '半点（30 分）' },
  { id: 'quarter', label: '一刻（15 / 45 分）' },
  { id: 'five', label: '5 分钟档' },
  { id: 'any', label: '任意分钟' }
]
const COUNT_OPTIONS = [6, 9, 12]
const COL_OPTIONS = [2, 3]
const DEFAULT_HEADER = '认识时钟练习 · ____年__月__日 · 姓名____'

const BTN_ON = 'bg-primary/10 border-primary/40 text-primary font-medium'
const BTN_OFF = 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'
const SEL_CLS = 'w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const qType = ref('mixed')
const difficulty = ref('five')
const count = ref(9)
const cols = ref(3)
const showAnswers = ref(true)
const headerText = ref(DEFAULT_HEADER)
const seedInput = ref('')
const activeSeed = ref(20261103) // 首屏用固定种子保证 SSR 与客户端渲染一致；onMounted 后换随机种子
const viewMode = ref('questions')
const seoContentVisible = ref(true)

const worksheet = ref({ items: [], answers: [] })

const worksheetConfig = computed(() => ({
  qType: qType.value,
  difficulty: difficulty.value,
  count: count.value
}))

// 按当前种子重新组卷（纯函数，SSR 阶段也可安全执行）
function rebuild() {
  worksheet.value = buildClockWorksheet(worksheetConfig.value, activeSeed.value)
}
watch(worksheetConfig, rebuild)
rebuild()

// 钟面数字坐标与画指针题面文本直接复用纯函数区 numeralX/numeralY/givenTimeText

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(' + cols.value + ', 1fr)',
  columnGap: '8mm',
  rowGap: '8mm',
  alignContent: 'start'
}))

const sheetStyle = computed(() => ({
  width: '210mm',
  minHeight: '297mm',
  padding: '12mm'
}))

// 关闭答案页时若正停留在答案页视图，切回题目页
watch(showAnswers, (v) => {
  if (!v && viewMode.value === 'answers') viewMode.value = 'questions'
})

// 解析种子输入：空或非法返回 null（表示随机）
function seedFromInput() {
  const raw = String(seedInput.value).trim()
  if (raw === '') return null
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? Math.abs(n) >>> 0 : null
}

// 9 位正整数随机种子（仅回调中调用，SSR 安全）
function randomSeed() {
  return Math.floor(Math.random() * 900000000) + 100000000
}

// 手动输入种子后回车 / 失焦：空则视为随机，有值则复现
function applySeedInput() {
  const s = seedFromInput()
  activeSeed.value = s === null ? randomSeed() : s
  rebuild()
}

// 重新生成：换一个新随机种子（同时清空输入框，表示「当前卷来自随机」）
function regenerate() {
  seedInput.value = ''
  activeSeed.value = randomSeed()
  rebuild()
  trackEvent('工具使用', '重新生成', 'clock-worksheet-generator')
}

function printWorksheet() {
  trackEvent('工具结果', '打印', 'clock-worksheet-generator')
  window.print()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// @page 规则单独注入（静态内容，A4 竖版 + 12mm 页边距）
const printPageCss = '@page { size: A4 portrait; margin: 12mm; }'

onMounted(() => {
  activeSeed.value = randomSeed()
  rebuild()
  addRecentTool('clock-worksheet-generator')
})
</script>

<style scoped>
/* 屏幕上的 A4 卷面 */
.a4-sheet {
  background: #ffffff;
  color: #111827;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
  border-radius: 2px;
  overflow: hidden;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
.pages-stack > .a4-sheet + .a4-sheet {
  margin-top: 16px;
}
.sheet-header {
  font-size: 4mm;
  color: #374151;
  border-bottom: 1.5px solid #d1d5db;
  padding-bottom: 3mm;
  margin-bottom: 8mm;
  white-space: pre-wrap;
  font-variant-numeric: tabular-nums;
}
/* 小屏幕上卷面固定 210mm 宽，允许横向滚动查看 */
.sheet-scroll {
  overflow-x: auto;
}

.q-item {
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
  break-inside: avoid;
  page-break-inside: avoid;
}
.q-no {
  display: inline-block;
  min-width: 2.4em;
  color: #6b7280;
}
.q-answer {
  color: #1e40af;
  font-size: 5mm;
}

/* 钟面卡片 */
.clock-card {
  break-inside: avoid;
  page-break-inside: avoid;
}
.clock-card .q-no {
  min-width: 1.4em;
  color: #6b7280;
  font-size: 4.2mm;
}
.clock-svg {
  width: 30mm;
  height: 30mm;
}
.face {
  fill: #ffffff;
  stroke: #111827;
  stroke-width: 1.4;
}
.tick-major {
  stroke: #111827;
  stroke-width: 1.5;
}
.tick-minor {
  stroke: #9ca3af;
  stroke-width: 0.6;
}
.numeral {
  font-size: 8.4px;
  text-anchor: middle;
  fill: #111827;
  font-family: Arial, ui-sans-serif, sans-serif;
}
.hand-hour {
  stroke: #111827;
  stroke-width: 3.6;
  stroke-linecap: round;
}
.hand-minute {
  stroke: #374151;
  stroke-width: 1.9;
  stroke-linecap: round;
}
.hub {
  fill: #111827;
}
.clock-line {
  margin-top: 1.5mm;
  font-size: 4.6mm;
  color: #111827;
  text-align: center;
}
.clock-line.given {
  font-size: 4mm;
  color: #374151;
}
.blank-slot {
  display: inline-block;
  min-width: 12mm;
  border-bottom: 1px solid #6b7280;
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
  .sheet-scroll {
    overflow: visible !important;
  }
  :global(main) {
    overflow: visible !important;
    height: auto !important;
  }
  .pages-stack {
    width: auto !important;
  }
  /* 覆盖 v-show 的 display:none：打印时题目页与答案页都输出 */
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
  /* 答案页另起一页（仅在开启答案页时给题目页加分页符，避免输出空白页） */
  .sheet-break {
    break-after: page;
    page-break-after: always;
  }
}
</style>
