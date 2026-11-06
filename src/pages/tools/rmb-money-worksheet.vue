<template>
  <div class="max-w-8xl mx-auto">
    <!-- 全局 @page 规则：A4 竖版、12mm 页边距 -->
    <component :is="'style'" v-html="printPageCss"></component>

    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Coins class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">人民币练习纸</h1>
          <p class="text-sm text-muted-foreground mt-1">元角分换算、比大小、找零应用与面额认识四题型，一二年级分难度，A4 可打印附答案页</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线人民币认识与换算练习纸生成器，四种题型：元角分换算（1元=?角、3元5角=?角、45角=?元?角，答案唯一构造）、
        比大小（3元5角 ○ 4元，填 &gt; &lt; =）、找零应用题（买 X 元物品付 Y 元应找回多少，保证付出大于价钱）与面额认识
        （简笔 SVG 示意的硬币 / 纸币写面额，非仿真钞票图案）。难度分一年级（1 元以内角分）与二年级（含几十元与整元找零）两档，
        每页 6/9/12 题、2-3 栏 A4 排布，可附独立答案页。填写相同的随机种子随时再生成完全相同的一份卷。
        全部在浏览器本地生成，不上传任何数据。
      </p>
    </div>

    <div class="print-grid grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：出题设置 -->
      <div class="no-print space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Coins class="w-5 h-5 mr-2 text-primary" /> 题型与难度
            </h2>
            <span class="text-xs text-muted-foreground">已选 {{ types.length }} / {{ TYPE_OPTIONS.length }} 种</span>
          </div>

          <!-- 题型多选（至少保留 1 种） -->
          <div class="grid grid-cols-2 gap-2">
            <label
              v-for="opt in TYPE_OPTIONS"
              :key="opt.id"
              class="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition"
              :class="types.includes(opt.id) ? 'bg-primary/10 border-primary/40 text-primary font-medium' : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'"
            >
              <input
                type="checkbox"
                class="accent-primary w-4 h-4"
                :checked="types.includes(opt.id)"
                @change="toggleType(opt.id, $event)"
              />
              {{ opt.label }}
            </label>
          </div>
          <p v-if="typeTip" class="text-xs text-amber-600 flex items-center gap-1">
            <TriangleAlert class="w-3.5 h-3.5 shrink-0" /> {{ typeTip }}
          </p>

          <div>
            <label class="block text-xs text-muted-foreground mb-1">难度档</label>
            <div class="grid grid-cols-2 gap-1">
              <button
                v-for="g in GRADE_OPTIONS"
                :key="g.id"
                type="button"
                @click="grade = g.id"
                class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                :class="grade === g.id ? BTN_ON : BTN_OFF"
              >
                {{ g.label }}
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              一年级：金额不超过 1 元，练角与分（1元=10角、1角=10分）；二年级：加入几元几十元与整元找零（如买 45 元付 50 元找回 5 元）。
            </p>
          </div>
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
            附加答案页（卷尾单独一页）
          </label>

          <div>
            <label class="block text-xs text-muted-foreground mb-1">页眉（打印在题目上方，可直接修改）</label>
            <input
              v-model="headerText"
              type="text"
              :class="SEL_CLS"
              placeholder="人民币练习 · ____年__月__日 · 姓名____"
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
                <div v-for="it in worksheet.items" :key="it.no" class="money-item">
                  <!-- 面额认识：简笔 SVG 示意图（硬币=圆，纸币=矩形），非仿真钞票 -->
                  <template v-if="it.kind === 'denom'">
                    <p class="money-text">
                      <span class="q-no">{{ it.no }}.</span>{{ it.text }}
                    </p>
                    <div class="denom-figure">
                      <svg
                        v-if="it.shape === 'coin'"
                        viewBox="0 0 96 64"
                        class="denom-svg"
                      >
                        <circle cx="48" cy="32" r="27" class="coin-outer" />
                        <circle cx="48" cy="32" r="21.5" class="coin-inner" />
                        <text x="48" y="38" class="denom-text">{{ it.denom }}</text>
                      </svg>
                      <svg
                        v-else
                        viewBox="0 0 130 64"
                        class="denom-svg denom-svg-note"
                      >
                        <rect x="2" y="2" width="126" height="60" rx="3" class="note-rect" />
                        <rect x="10" y="10" width="26" height="16" class="note-corner" />
                        <text x="73" y="36" class="denom-text denom-text-big">{{ it.denom }}</text>
                        <text x="73" y="53" class="note-caption">人民币练习示意</text>
                      </svg>
                    </div>
                  </template>
                  <!-- 换算 / 比大小 / 找零：文字题干 + 答题空线 -->
                  <template v-else>
                    <p class="money-text">
                      <span class="q-no">{{ it.no }}.</span>{{ it.text }}
                    </p>
                    <p v-if="it.kind === 'change'" class="money-blank-line">应找回 <span class="blank-slot"></span></p>
                  </template>
                </div>
              </div>
              <p class="sheet-footnote">注：卷内钱币图形均为简笔练习示意，非仿真钞票图案。</p>
            </div>
            <!-- 答案页（单独一页，仅题号 + 答案） -->
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
          设置面板与页面其余内容不会被打出来。卷内钱币均为简笔示意图形（避免仿真钞票外观），仅用于面额认读教学。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>人民币练习纸是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          人民币练习纸是一款面向小学一二年级的免费在线货币练习工具，四种题型按所选配额混编成卷：
          元角分换算（如 1元=?角、3元5角=?角、45角=?元?角，全部按唯一答案构造）、比大小（3元5角 ○ 4元，填 &gt; &lt; =）、
          找零应用题（买 X 元物品付出 Y 元应找回多少，构造时保证付出大于价钱、找零非负）与面额认识
          （简笔 SVG 示意的硬币与纸币图形写面额）。难度两档：一年级控制在 1 元以内练角与分，二年级加入几元几十元与整元找零。
          每页 6/9/12 题、2-3 栏 A4 排布，可附独立答案页。出题使用确定性的 mulberry32 随机数，同一种子配同样设置随时复现同一份卷。
          卷内钱币均为简笔示意图形（圆+面额字 / 矩形+面额字，并注明「人民币练习示意」），刻意避免仿真钞票外观，仅用于教学。
          全部生成与排版都在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">元角分换算怎么教？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          核心是两条进率：1元 = 10角，1角 = 10分，因此 1元 = 100分。换算时先统一单位再计算：
          「3元5角 = ?角」把 3 元换成 30 角再加 5 角得 35 角；反过来「45角 = ?元?角」用 45 ÷ 10 商 4 余 5，得 4元5角。
          建议让孩子口述过程（几元就是几十角、再加上几角），而不是死记结论。一年级先在 1 元以内把 10 进率练熟，
          二年级再扩展到几十元；本工具的两档难度即按这个边界划分，换算题全部按唯一答案构造，答案页可直接对照批改。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">找零应用题的解题与验算</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          找零的基本关系是「找回 = 付出 − 用去」。低年级常用「凑十法」口算：买 45 元的物品付 50 元，从 45 数到 50 是 5，
          所以找回 5 元。验算用加法回代：找回的 5 元 + 用去的 45 元 = 付出的 50 元，对上了才算做对。
          本工具生成找零题时保证付出金额大于物品价钱、找零非负，一年级档控制在整元 10 元以内，
          二年级档加入几十元的价钱与 50/100 元整元付款，与课本应用题口径一致。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么图形是简笔示意？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          人民币图样受《人民币图样使用管理办法》约束，日常教学材料不应复制仿真钞票图案。本工具的面额认识题使用刻意的简笔示意：
          硬币画成「圆 + 面额字」、纸币画成「矩形 + 面额字」，并标注「人民币练习示意」小字，卷脚也注明非仿真钞票。
          这样既满足「看图写面额」的训练目的，又避免任何仿制嫌疑。面额认识更重要的环节是拿真币或儿童教具钱币
          让孩子摸一摸、比一比大小与颜色，练习纸用来巩固「数字 + 单位 = 面额」的读法。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">一年级和二年级档有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">一年级档所有金额不超过 1 元，练角与分的进率（1元=10角、1角=10分）；二年级档加入几元到几十元的金额与整元找零（如买 45 元付 50 元找回 5 元），换算题的数字也相应变大。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">比大小题的圈里填什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">比较两边金额后填 &gt;、&lt; 或 =。建议先统一单位再比较（如 3元5角 = 35角，再和 4元 = 40角 比），答案页给出符号，批改时让孩子说一说「怎么比出来的」。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">打印会带出按钮和设置吗？图形会太「像真钱」吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。打印样式只输出 A4 题目卷，界面自动隐藏；卷内钱币是刻意简化的示意图形（圆或矩形加面额字），并标注「人民币练习示意」，不是仿真钞票图案，请放心打印。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么同种子能出同一份卷？</h3>
            <p class="text-sm text-muted-foreground mt-1">出题随机数使用确定性的 mulberry32 算法：同一种子配同样设置，任何时候任何设备都生成逐题一致的卷子；点「重新生成」即换新种子出新卷。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">生成的题目会上传或保存吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有题目都在你的浏览器里即时生成，不发送任何网络请求，也不做本地存储；想保留哪份卷就把它的种子数字记下来。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'rmb-money-worksheet'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Coins, Printer, RefreshCw, TriangleAlert,
  ChevronUp, ChevronDown, Info, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '人民币练习纸 - 元角分换算与找零练习题生成打印 | 有条工具',
  description: '免费在线人民币练习纸生成器：元角分换算、比大小、找零应用题与面额认识四题型，一年级（1元内角分）二年级（几十元与整元找零）两档难度，简笔SVG钱币示意非仿真钞票，A4打印附答案页，随机种子同码同卷，纯浏览器本地生成',
  keywords: '人民币练习题,元角分换算练习,找零应用题,认识人民币一年级,钱币面额认识,人民币练习纸打印',
  author: '有条工具',
  ogTitle: '人民币练习纸 - 元角分换算与找零练习题生成打印 | 有条工具',
  ogDescription: '换算、比大小、找零、面额认识四题型，一二年级分难度，简笔钱币示意，A4 打印附答案页，同种子同卷可复现。',
  ogUrl: 'https://www.util.cn/tools/rmb-money-worksheet',
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
          name: '人民币练习纸',
          url: 'https://www.util.cn/tools/rmb-money-worksheet',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '四题型：元角分换算 / 比大小 / 找零应用题 / 面额认识',
            '一年级（1元内角分）与二年级（几十元与整元找零）两档难度',
            '换算题唯一答案构造，找零题保证付出大于价钱',
            '简笔 SVG 钱币示意（非仿真钞票图案）',
            '每页 6/9/12 题，2-3 栏 A4 排版，独立答案页',
            'mulberry32 确定性种子，同种子同卷可复现'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '人民币练习纸', item: 'https://www.util.cn/tools/rmb-money-worksheet/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '一年级和二年级档有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '一年级档所有金额不超过1元，练角与分的进率（1元=10角、1角=10分）；二年级档加入几元到几十元的金额与整元找零（如买45元付50元找回5元）。' }
            },
            {
              '@type': 'Question',
              name: '比大小题的圈里填什么？',
              acceptedAnswer: { '@type': 'Answer', text: '比较两边金额后填>、<或=。建议先统一单位再比较（如3元5角=35角，再和4元=40角比），答案页给出符号。' }
            },
            {
              '@type': 'Question',
              name: '打印会带出按钮和设置吗？图形会太像真钱吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。打印样式只输出A4题目卷；卷内钱币是刻意简化的示意图形（圆或矩形加面额字），并标注人民币练习示意，不是仿真钞票图案。' }
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

// 金额统一成「角」：a 元 b 角 = a×10 + b 角
function toJiao(a, b) {
  return a * 10 + b
}

// 换算题构造器（核心形式）：a元b角 = ?角，答案唯一为 a×10+b 角
function qYuanJiaoToJiao(a, b) {
  return { kind: 'convert', form: 'yj', a, b, text: a + '元' + b + '角 = ?角', answer: (a * 10 + b) + '角' }
}

// 元角分换算题（一年级 ≤1 元练角分；二年级含几十元）；每种形式答案唯一
function genConvert(rng, grade) {
  if (grade === 'g1') {
    const f = randInt(rng, 0, 4)
    if (f === 0) return { kind: 'convert', form: 'fixed', text: '1元 = ?角', answer: '10角' }
    if (f === 1) return { kind: 'convert', form: 'fixed', text: '1元 = ?分', answer: '100分' }
    if (f === 2) {
      const x = randInt(rng, 1, 9)
      return { kind: 'convert', form: 'jf', x, text: x + '角 = ?分', answer: (x * 10) + '分' }
    }
    if (f === 3) return qYuanJiaoToJiao(1, randInt(rng, 1, 9))
    const b = randInt(rng, 1, 9)
    return { kind: 'convert', form: 'reverse', a: 1, b, text: (10 + b) + '角 = ?元?角', answer: '1元' + b + '角' }
  }
  const f = randInt(rng, 0, 3)
  if (f === 0) {
    const a = randInt(rng, 2, 9)
    return { kind: 'convert', form: 'y', a, text: a + '元 = ?角', answer: (a * 10) + '角' }
  }
  if (f === 1) return qYuanJiaoToJiao(randInt(rng, 2, 9), randInt(rng, 1, 9))
  if (f === 2) {
    const x = randInt(rng, 2, 9) * 10 + randInt(rng, 1, 9) // 21..98 且个位非 0
    return { kind: 'convert', form: 'reverse', a: Math.floor(x / 10), b: x % 10, text: x + '角 = ?元?角', answer: Math.floor(x / 10) + '元' + (x % 10) + '角' }
  }
  const a = randInt(rng, 1, 2)
  return { kind: 'convert', form: 'fixed', text: a + '元 = ?分', answer: (a * 100) + '分' }
}

// 金额文本：b 为 0 时省略「0角」
function amountText(a, b) {
  return b === 0 ? a + '元' : a + '元' + b + '角'
}

// 比大小题：两个金额（不同书写形式）填 > < =
function genCompare(rng, grade) {
  if (grade === 'g1') {
    const r = rng()
    if (r < 0.2) {
      return { kind: 'compare', lv: 10, rv: 10, text: '10角 ○ 1元', answer: '=' }
    }
    if (r < 0.55) {
      const x = randInt(rng, 1, 9)
      return rng() < 0.5
        ? { kind: 'compare', lv: x, rv: 10, text: x + '角 ○ 1元', answer: '<' }
        : { kind: 'compare', lv: 10, rv: x, text: '1元 ○ ' + x + '角', answer: '>' }
    }
    const x = randInt(rng, 1, 9)
    const y = randInt(rng, 1, 9)
    const lv = x
    const rv = y
    return { kind: 'compare', lv, rv, text: x + '角 ○ ' + y + '角', answer: lv > rv ? '>' : lv < rv ? '<' : '=' }
  }
  const r = rng()
  if (r < 0.2) {
    // 构造相等：a元b角 ○ (a×10+b)角
    const a = randInt(rng, 1, 9)
    const b = randInt(rng, 1, 9)
    const v = toJiao(a, b)
    return { kind: 'compare', lv: v, rv: v, text: amountText(a, b) + ' ○ ' + v + '角', answer: '=' }
  }
  if (r < 0.6) {
    const a = randInt(rng, 1, 9)
    const b = randInt(rng, 0, 9)
    const c = randInt(rng, 1, 9)
    const lv = toJiao(a, b)
    const rv = c * 10
    return { kind: 'compare', lv, rv, text: amountText(a, b) + ' ○ ' + amountText(c, 0), answer: lv > rv ? '>' : lv < rv ? '<' : '=' }
  }
  const a = randInt(rng, 1, 9)
  const b = randInt(rng, 0, 9)
  const c = randInt(rng, 1, 9)
  const d = randInt(rng, 0, 9)
  const lv = toJiao(a, b)
  const rv = toJiao(c, d)
  return { kind: 'compare', lv, rv, text: amountText(a, b) + ' ○ ' + amountText(c, d), answer: lv > rv ? '>' : lv < rv ? '<' : '=' }
}

// 找零应用题：买 price 元物品付 pay 元（保证 pay > price），应找回 pay − price 元（非负唯一）
const CHANGE_ITEMS_G1 = ['一支铅笔', '一块橡皮', '一本练习本', '把小尺子', '张贴纸', '根棒棒糖']
const CHANGE_ITEMS_G2 = ['一个书包', '一盏台灯', '一个篮球', '把雨伞', '一辆玩具车', '个保温杯']
function genChange(rng, grade) {
  if (grade === 'g1') {
    const price = randInt(rng, 1, 9)
    const pay = rng() < 0.5 ? 10 : randInt(rng, price + 1, 10)
    const item = CHANGE_ITEMS_G1[randInt(rng, 0, CHANGE_ITEMS_G1.length - 1)]
    return {
      kind: 'change',
      price,
      pay,
      text: '买' + item + '用去' + price + '元，付出' + pay + '元，应找回多少元？',
      answer: (pay - price) + '元'
    }
  }
  const price = randInt(rng, 11, 99)
  const pay = rng() < 0.5 ? 100 : Math.ceil((price + 1) / 10) * 10 // 不低于 price+1 的 10 的倍数，恒 > price
  const item = CHANGE_ITEMS_G2[randInt(rng, 0, CHANGE_ITEMS_G2.length - 1)]
  return {
    kind: 'change',
    price,
    pay,
    text: '买' + item + '用去' + price + '元，付出' + pay + '元，应找回多少元？',
    answer: (pay - price) + '元'
  }
}

// 面额认识题：一年级 1角/5角/1元；二年级加入 5/10/20/50/100 元纸币面额
function genDenom(rng, grade) {
  const pool = grade === 'g1'
    ? ['1角', '5角', '1元']
    : ['5角', '1元', '5元', '10元', '20元', '50元', '100元']
  const denom = pool[randInt(rng, 0, pool.length - 1)]
  const isCoin = denom === '1角' || denom === '5角' || (denom === '1元' && rng() < 0.5)
  return {
    kind: 'denom',
    denom,
    shape: isCoin ? 'coin' : 'note',
    text: '写出下面钱币的面额',
    answer: denom
  }
}

// 按题型派发生成 1 题
function genMoneyQuestion(kind, grade, rng) {
  if (kind === 'convert') return genConvert(rng, grade)
  if (kind === 'compare') return genCompare(rng, grade)
  if (kind === 'change') return genChange(rng, grade)
  return genDenom(rng, grade)
}

// 配置归一化：题型集合按固定顺序规范化、非法值回退默认
function normalizeMoneyConfig(config) {
  const c = config && typeof config === 'object' ? config : {}
  const rawTypes = Array.isArray(c.types) ? c.types : []
  const types = ['convert', 'compare', 'change', 'denom'].filter((t) => rawTypes.includes(t))
  return {
    types: types.length ? types : ['convert'],
    grade: c.grade === 'g2' ? 'g2' : 'g1',
    count: Math.min(24, Math.max(1, Math.floor(Number(c.count) || 9)))
  }
}

// 组卷：题型均等配额 + 确定性洗牌 + 去重重试；同 config 同 seed 输出逐题完全一致
function buildMoneyWorksheet(config, seed) {
  const cfg = normalizeMoneyConfig(config)
  const rng = mulberry32(Number(seed) >>> 0)
  const slots = []
  for (let i = 0; i < cfg.count; i++) slots.push(cfg.types[i % cfg.types.length])
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = slots[i]
    slots[i] = slots[j]
    slots[j] = tmp
  }
  const items = []
  const answers = []
  const seen = new Set()
  for (let i = 0; i < slots.length; i++) {
    let q = null
    for (let attempt = 0; attempt < 12; attempt++) {
      q = genMoneyQuestion(slots[i], cfg.grade, rng)
      if (!seen.has(q.text)) break
    }
    seen.add(q.text)
    items.push({ no: i + 1, ...q })
    answers.push({ no: i + 1, answer: q.answer })
  }
  return { items, answers }
}

/* PURE-FNS-END */

// ---------- 页面状态与交互 ----------
const TYPE_OPTIONS = [
  { id: 'convert', label: '元角分换算' },
  { id: 'compare', label: '比大小' },
  { id: 'change', label: '找零应用' },
  { id: 'denom', label: '面额认识' }
]
const GRADE_OPTIONS = [
  { id: 'g1', label: '一年级（1元内角分）' },
  { id: 'g2', label: '二年级（几十元+找零）' }
]
const COUNT_OPTIONS = [6, 9, 12]
const COL_OPTIONS = [2, 3]
const DEFAULT_HEADER = '人民币练习 · ____年__月__日 · 姓名____'

const BTN_ON = 'bg-primary/10 border-primary/40 text-primary font-medium'
const BTN_OFF = 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'
const SEL_CLS = 'w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const types = ref(['convert', 'compare', 'change', 'denom'])
const grade = ref('g1')
const count = ref(9)
const cols = ref(2)
const showAnswers = ref(true)
const headerText = ref(DEFAULT_HEADER)
const seedInput = ref('')
const activeSeed = ref(20261104) // 首屏用固定种子保证 SSR 与客户端渲染一致；onMounted 后换随机种子
const viewMode = ref('questions')
const seoContentVisible = ref(true)
const typeTip = ref('')

const worksheet = ref({ items: [], answers: [] })

const worksheetConfig = computed(() => ({
  types: types.value.slice(),
  grade: grade.value,
  count: count.value
}))

// 按当前种子重新组卷（纯函数，SSR 阶段也可安全执行）
function rebuild() {
  worksheet.value = buildMoneyWorksheet(worksheetConfig.value, activeSeed.value)
}
watch(worksheetConfig, rebuild)
rebuild()

// 关闭答案页时若正停留在答案页视图，切回题目页
watch(showAnswers, (v) => {
  if (!v && viewMode.value === 'answers') viewMode.value = 'questions'
})

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(' + cols.value + ', 1fr)',
  columnGap: '8mm',
  rowGap: '7mm',
  alignContent: 'start'
}))

const sheetStyle = computed(() => ({
  width: '210mm',
  minHeight: '297mm',
  padding: '12mm'
}))

// 题型开关：至少保留 1 种，试图全关时回拨并提示
function toggleType(id, e) {
  const checked = e.target.checked
  const next = checked ? [...types.value, id] : types.value.filter((t) => t !== id)
  if (!next.length) {
    e.target.checked = true
    typeTip.value = '至少需要保留 1 种题型'
    return
  }
  types.value = next
  typeTip.value = ''
}

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
  trackEvent('工具使用', '重新生成', 'rmb-money-worksheet')
}

function printWorksheet() {
  trackEvent('工具结果', '打印', 'rmb-money-worksheet')
  window.print()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// @page 规则单独注入（静态内容，A4 竖版 + 12mm 页边距）
const printPageCss = '@page { size: A4 portrait; margin: 12mm; }'

onMounted(() => {
  activeSeed.value = randomSeed()
  rebuild()
  addRecentTool('rmb-money-worksheet')
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
.sheet-footnote {
  margin-top: 10mm;
  font-size: 3.2mm;
  color: #9ca3af;
  text-align: center;
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

.money-item {
  break-inside: avoid;
  page-break-inside: avoid;
}
.money-text {
  font-size: 4.6mm;
  line-height: 1.7;
  color: #111827;
  font-variant-numeric: tabular-nums;
}
.money-text .q-no {
  min-width: 1.8em;
  font-size: 4mm;
  color: #6b7280;
}
.money-blank-line {
  margin-top: 2mm;
  padding-left: 3.6em;
  font-size: 4.6mm;
  color: #111827;
}
.blank-slot {
  display: inline-block;
  min-width: 16mm;
  border-bottom: 1px solid #6b7280;
}

/* 简笔钱币示意（非仿真） */
.denom-figure {
  margin-top: 2mm;
  padding-left: 3.6em;
}
.denom-svg {
  width: 30mm;
  height: 16.5mm;
}
.denom-svg-note {
  width: 38mm;
}
.coin-outer {
  fill: #ffffff;
  stroke: #6b7280;
  stroke-width: 1.6;
}
.coin-inner {
  fill: none;
  stroke: #d1d5db;
  stroke-width: 1;
  stroke-dasharray: 3 2;
}
.note-rect {
  fill: #ffffff;
  stroke: #6b7280;
  stroke-width: 1.6;
}
.note-corner {
  fill: none;
  stroke: #d1d5db;
  stroke-width: 1;
}
.denom-text {
  font-size: 15px;
  font-weight: 700;
  text-anchor: middle;
  fill: #374151;
  font-family: Arial, ui-sans-serif, sans-serif;
}
.denom-text-big {
  font-size: 19px;
}
.note-caption {
  font-size: 7px;
  text-anchor: middle;
  fill: #9ca3af;
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
