<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Languages class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">不规则动词速查表</h1>
          <p class="text-sm text-muted-foreground mt-1">180 个常用英语不规则动词：原形 / 过去式 / 过去分词 / 中文释义，按 AAA、ABB、ABA、ABC 四类变化分组，支持隐藏列自测与 10 词小测验</p>
        </div>
      </div>
      <p class="text-muted-foreground no-print">
        在线不规则动词表：按「AAA 三态同形（cut-cut-cut）、ABB 过去式与过去分词同形（build-built-built）、ABA 过去分词与原形同形（come-came-come）、ABC 三态各不同（begin-began-begun）」四类分组，
        支持按原形或中文模糊搜索、按变化类型筛选；自带「默写模式」隐藏过去式与过去分词两列、点击单元格逐格揭示，以及随机抽 10 词的小测验（输入判分）。
        筛选结果可一键复制为 TSV 直接粘贴进 Excel，也可按 A4 打印成速查卡。全部数据在浏览器本地完成查询，不上传任何信息。
      </p>
      <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 no-print">
        <TriangleAlert class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed text-foreground">
          词表按维基词典《英语不规则动词附录》与剑桥/牛津学习者词典词表交叉核对整理（含英美式差异备注，如 learn-learnt/learned、get-got/gotten）；
          部分动词拼写同形但读音变化（read /riːd/→/red/），以权威词典为准。
        </p>
      </div>
    </div>

    <!-- 主体：检索 + 速查表 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：检索控制 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 no-print">
        <h2 class="text-lg font-semibold flex items-center">
          <Search class="w-5 h-5 mr-2 text-primary" /> 检索与筛选
        </h2>

        <!-- 搜索 -->
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="输入原形或中文，如 build / 建造 / 吃"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            aria-label="清除搜索"
          >
            清除
          </button>
        </div>

        <!-- 变化类型 tab -->
        <div>
          <p class="text-xs text-muted-foreground mb-1.5">变化类型</p>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="tab in TYPE_TABS"
              :key="tab.id"
              @click="activeType = tab.id"
              class="px-2 py-1.5 rounded-lg border text-xs font-medium transition text-left"
              :class="activeType === tab.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
            >
              {{ tab.label }}
              <span class="opacity-70 ml-1">{{ tab.count }}</span>
            </button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-2 leading-relaxed">{{ activeTypeHint }}</p>
        </div>

        <!-- 默写模式开关 -->
        <div class="border-t border-border pt-3">
          <button
            @click="toggleHideMode"
            class="w-full px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
            :class="hideMode ? 'bg-primary text-primary-foreground' : 'border border-border bg-background text-foreground hover:border-primary/40'"
          >
            <Eraser class="w-4 h-4" /> {{ hideMode ? '默写模式：已隐藏两列（点击关闭）' : '开启默写模式（隐藏过去式/过去分词）' }}
          </button>
          <p class="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
            开启后过去式与过去分词列显示为「···」，点击单元格逐格揭示，先默想再点击验证。
          </p>
          <button
            v-if="hideMode"
            @click="revealed = {}"
            class="mt-2 w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-muted-foreground hover:text-foreground transition"
          >
            重新隐藏全部
          </button>
        </div>

        <!-- 小测验 -->
        <div class="border-t border-border pt-3">
          <button
            @click="startQuiz"
            class="w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <Brain class="w-4 h-4" /> 随机抽 10 词小测验
          </button>
          <p class="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
            从当前筛选结果中随机抽 10 个动词（不足 10 个则全部抽中），补写过去式与过去分词后判分。
          </p>
        </div>
      </div>

      <!-- 右侧：速查表 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
          <h2 class="text-lg font-semibold flex items-center">
            <Languages class="w-5 h-5 mr-2 text-primary" /> 不规则动词速查表
          </h2>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs text-muted-foreground font-mono">当前 {{ filteredVerbs.length }} 词</span>
            <button
              @click="copyTsv"
              class="px-3 py-1.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-xs font-medium text-foreground transition"
            >
              <Copy class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-primary" /> 复制 TSV（可贴 Excel）
            </button>
            <button
              @click="printCard"
              class="px-3 py-1.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-xs font-medium text-foreground transition"
            >
              <Printer class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-primary" /> A4 打印
            </button>
          </div>
        </div>

        <div class="overflow-x-auto print-table-card">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-muted-foreground border-b border-border">
                <th class="py-2 pr-3 font-medium">原形</th>
                <th class="py-2 pr-3 font-medium">过去式</th>
                <th class="py-2 pr-3 font-medium">过去分词</th>
                <th class="py-2 pr-3 font-medium">中文释义</th>
                <th class="py-2 font-medium">类型</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="v in filteredVerbs"
                :key="v.id"
                class="border-b border-border/50 hover:bg-muted/50 transition"
              >
                <td class="py-2 pr-3 font-semibold text-foreground whitespace-nowrap font-mono">{{ v.base }}</td>
                <td class="py-2 pr-3 font-mono whitespace-nowrap">
                  <template v-if="hideMode && !isRevealed(v, 'past')">
                    <button
                      @click="revealCell(v, 'past')"
                      class="px-2 py-0.5 rounded-md bg-muted/70 text-muted-foreground text-xs hover:text-primary transition"
                      aria-label="点击揭示过去式"
                    >···</button>
                  </template>
                  <span v-else class="text-foreground">{{ v.past }}</span>
                  <span v-if="v.pastAlt && (!hideMode || isRevealed(v, 'past'))" class="ml-1 text-[10px] text-muted-foreground">/{{ v.pastAlt }}</span>
                </td>
                <td class="py-2 pr-3 font-mono whitespace-nowrap">
                  <template v-if="hideMode && !isRevealed(v, 'pp')">
                    <button
                      @click="revealCell(v, 'pp')"
                      class="px-2 py-0.5 rounded-md bg-muted/70 text-muted-foreground text-xs hover:text-primary transition"
                      aria-label="点击揭示过去分词"
                    >···</button>
                  </template>
                  <span v-else class="text-foreground">{{ v.pp }}</span>
                  <span v-if="v.ppAlt && (!hideMode || isRevealed(v, 'pp'))" class="ml-1 text-[10px] text-muted-foreground">/{{ v.ppAlt }}</span>
                </td>
                <td class="py-2 pr-3 text-xs text-muted-foreground">{{ v.zh }}</td>
                <td class="py-2">
                  <span
                    class="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                    :class="TYPE_BADGE[v.type]"
                  >{{ v.type }}</span>
                </td>
              </tr>
              <tr v-if="filteredVerbs.length === 0">
                <td colspan="5" class="py-8 text-center text-xs text-muted-foreground">
                  没有匹配「{{ searchQuery }}」的不规则动词：试试原形（如 drink）、中文（如 喝）或切换类型筛选。
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed no-print">
          提示：斜杠标注为另一常用变体（英美式差异），小测验中两种写法都判对。read 拼写三态同形但过去式读音变为 /red/。
          复制的 TSV 含表头，列依次为：原形 / 过去式 / 过去分词 / 中文释义 / 类型，直接粘贴进 Excel 即可分列。
        </p>
      </div>
    </div>

    <!-- 小测验面板 -->
    <div v-if="quizActive" class="bg-card border border-border rounded-lg p-6 mb-6 no-print">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Brain class="w-5 h-5 mr-2 text-primary" /> 10 词小测验（{{ quizItems.length }} 题）
        </h2>
        <div class="flex items-center gap-2">
          <button
            @click="submitQuiz"
            class="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium transition"
          >
            <CheckCircle class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> 交卷判分
          </button>
          <button
            @click="startQuiz"
            class="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:border-primary/40 transition"
          >
            <RotateCcw class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-primary" /> 换一组
          </button>
          <button
            @click="quizActive = false"
            class="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-muted-foreground hover:text-foreground transition"
          >
            收起测验
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="(item, idx) in quizItems"
          :key="item.id"
          class="bg-muted/50 rounded-xl p-4"
        >
          <p class="text-sm font-semibold text-foreground mb-2">
            <span class="text-muted-foreground mr-2">{{ idx + 1 }}.</span>
            <span class="font-mono">{{ item.base }}</span>
            <span class="text-xs text-muted-foreground ml-2 font-normal">{{ item.zh }}</span>
            <span
              class="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
              :class="TYPE_BADGE[item.type]"
            >{{ item.type }}</span>
          </p>
          <div class="grid grid-cols-2 gap-2">
            <input
              v-model="item.pastIn"
              type="text"
              placeholder="过去式"
              class="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <input
              v-model="item.ppIn"
              type="text"
              placeholder="过去分词"
              class="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <p v-if="quizDone" class="text-xs mt-2 leading-relaxed">
            <span :class="judgeItemFor(item).pastOk ? 'text-green-600' : 'text-red-500'">过去式：{{ judgeItemFor(item).pastOk ? '√' : '× 应为 ' + answerPast(item) }}</span>
            <span class="mx-1.5 text-border">|</span>
            <span :class="judgeItemFor(item).ppOk ? 'text-green-600' : 'text-red-500'">过去分词：{{ judgeItemFor(item).ppOk ? '√' : '× 应为 ' + answerPp(item) }}</span>
          </p>
        </div>
      </div>

      <div v-if="quizDone" class="mt-4 bg-muted/50 rounded-xl p-4 flex items-center gap-4">
        <p class="text-2xl font-bold" :class="quizScore >= 8 ? 'text-green-600' : quizScore >= 5 ? 'text-primary' : 'text-destructive'">
          {{ quizScore }} / {{ quizItems.length * 2 }}
        </p>
        <p class="text-sm text-muted-foreground">
          每词两空共 {{ quizItems.length * 2 }} 分：全对记 1 词满分。{{ quizScore === quizItems.length * 2 ? '全对，记得很牢！' : '错的词看下方「应为」，回到表格里再默写一遍加深记忆。' }}
        </p>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-8 no-print" open>
      <summary class="text-xl font-bold text-foreground cursor-pointer select-none list-none flex items-center gap-2">
        <span class="text-primary">#</span> 不规则动词速查表：记忆口诀与常见问题
      </summary>
      <div class="mt-4 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          英语不规则动词不按「-ed」规则变化，过去式与过去分词各有独立形态。本页按变化形态分成四组（AAA / ABB / ABA / ABC），
          每组内部形态规律一致，分组记忆比逐词背诵省力得多。配合默写模式与小测验，可把 180 个常用词分轮次刷完。
        </p>

        <h3 class="text-lg font-semibold text-foreground">四类变化规律口诀</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="bg-muted/50 rounded-xl p-4">
            <p class="font-semibold text-foreground mb-1">AAA · 三态同形</p>
            <p class="font-mono text-foreground text-xs mb-1">cut-cut-cut · put-put-put · let-let-let</p>
            <p class="text-xs">口诀「剪放让关原样搬」：cut 剪、put 放、let 让、shut 关、hit 打、cost 花费……动词完全不变，只需注意 read 拼写不变但读音 /riːd/→/red/。</p>
          </div>
          <div class="bg-muted/50 rounded-xl p-4">
            <p class="font-semibold text-foreground mb-1">ABB · 过去式与过去分词同形</p>
            <p class="font-mono text-foreground text-xs mb-1">build-built-built · buy-bought-bought</p>
            <p class="text-xs">口诀「过去分词跟着过去式走」：本组数量最大，按尾音再分小族记：-ought/-aught 族（buy/bring/think/teach/catch/fight）、-t 族（keep/sleep/feel/leave/lose）、-ung/-unk 族（win/sit/stick/hold）。</p>
          </div>
          <div class="bg-muted/50 rounded-xl p-4">
            <p class="font-semibold text-foreground mb-1">ABA · 过去分词与原形同形</p>
            <p class="font-mono text-foreground text-xs mb-1">come-came-come · run-ran-run</p>
            <p class="text-xs">口诀「转一圈回到原形」：仅 come、become、run、overcome 四个常用词，中间过去式变为 -ame/-an，分词却回到开头——是四类里最少也最好记的一组。</p>
          </div>
          <div class="bg-muted/50 rounded-xl p-4">
            <p class="font-semibold text-foreground mb-1">ABC · 三态各不同</p>
            <p class="font-mono text-foreground text-xs mb-1">begin-began-begun · go-went-gone</p>
            <p class="text-xs">口诀「i-a-u 三级跳」：大量动词走 i→a→u 元音递进（begin/drink/sing/swim/ring/sink），另有 -ew/-own 族（blow/fly/grow/know/throw）与 -en 分词族（eat/fall/give/take/break/write）。</p>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground">高频易错词对比</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="bg-muted/50 rounded-xl p-4">
            <p class="font-semibold text-foreground mb-1">lie / lay / lain 与 lay / laid / laid</p>
            <p class="text-xs leading-relaxed">lie（躺，不及物）→ lay → lain；lay（放置，及物，必须带宾语）→ laid → laid。lie 的过去式恰好也是 lay，最易混淆：判断标准看有没有宾语——「He lay on the bed（躺）」无宾语，「He laid the book on the table（放）」有宾语。另外 lie（说谎）是规则变化 lied-lied。</p>
          </div>
          <div class="bg-muted/50 rounded-xl p-4">
            <p class="font-semibold text-foreground mb-1">rise / rose / risen 与 raise / raised / raised</p>
            <p class="text-xs leading-relaxed">rise（上升，不及物）→ rose → risen；raise（举起/提高，及物）→ raised → raised。如「The sun rises（日出）」与「Raise your hand（举手）」。同理：hang（悬挂）hung-hung，「绞死」用 hanged-hanged；fall（跌落）fell-fallen 与 fell（砍倒，felled）也是一对。</p>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground">常见问题 (FAQ)</h3>
        <div class="space-y-3">
          <div>
            <p class="font-semibold text-foreground">为什么 learn 有 learnt 和 learned 两种过去式？</p>
            <p>英式英语偏好不规则形式 learnt / dreamt / spelt / smelt / burnt / leapt，美式英语偏好规则形式 learned / dreamed / spelled / smelled / burned / leaped。两种都正确，考试写作保持一致即可；本表以斜杠并列标注，小测验中两种写法都判对。</p>
          </div>
          <div>
            <p class="font-semibold text-foreground">get 的过去分词是 got 还是 gotten？</p>
            <p>英式英语用 got，美式英语用 gotten（表示「获得」义；但 have got 表「拥有」是英式固定用法）。本表主列 got、备注 gotten，测验中两者均判对。</p>
          </div>
          <div>
            <p class="font-semibold text-foreground">怎么高效记住这 180 个词？</p>
            <p>三步法：① 先按类型分组，记住每组的「形状规律」而不是单词；② 用默写模式盖住过去式与过去分词两列，按组逐词默想后点击揭示，错的做标记；③ 每天 2-3 组开一次 10 词小测验，错的词次日重复。ABC 组词多，优先记 i-a-u 族和 -en 分词族。</p>
          </div>
          <div>
            <p class="font-semibold text-foreground">数据以什么为准？</p>
            <p>词表以维基词典《English irregular verbs 附录》与剑桥/牛津学习者词典词表两源交叉核对整理，收录 180 个最常用动词并标注英美式差异；例词读音、派生用法等请以权威词典为准。</p>
          </div>
        </div>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :currentToolId="'irregular-verbs-table'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Languages, Search, Copy, Printer, Brain, Eraser, CheckCircle, RotateCcw, TriangleAlert
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '不规则动词速查表 - 180个英语动词过去式过去分词对照（AAA/ABB/ABA/ABC分组）',
  description: '在线不规则动词表：180个常用英语不规则动词按AAA、ABB、ABA、ABC四类变化分组，含中文释义与英美式差异标注，支持搜索筛选、隐藏列默写、随机10词小测验判分、TSV复制与A4打印，纯浏览器本地运行',
  keywords: '不规则动词表,英语动词过去式,过去分词表,AAA ABB ABC动词,动词变化速查,lie lay lain',
  author: '有条工具',
  ogTitle: '不规则动词速查表 - 180个英语动词过去式过去分词对照 | 有条工具',
  ogDescription: '按 AAA/ABB/ABA/ABC 四类变化分组的不规则动词表，默写模式 + 10 词小测验 + TSV 导出。',
  ogUrl: 'https://www.util.cn/tools/irregular-verbs-table',
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
          name: '不规则动词速查表',
          url: 'https://www.util.cn/tools/irregular-verbs-table',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '180 个常用不规则动词按 AAA/ABB/ABA/ABC 四类分组',
            '原形 / 过去式 / 过去分词 / 中文释义四字段对照',
            '原形与中文模糊搜索、类型筛选',
            '默写模式：隐藏过去式过去分词列，点击单元格揭示',
            '随机抽 10 词小测验并自动判分',
            '筛选结果一键复制 TSV（可粘贴 Excel）',
            'A4 打印速查卡'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '不规则动词速查表', item: 'https://www.util.cn/tools/irregular-verbs-table/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么 learn 有 learnt 和 learned 两种过去式？',
              acceptedAnswer: { '@type': 'Answer', text: '英式英语偏好不规则形式 learnt/dreamt/spelt/smelt/burnt，美式英语偏好规则形式 learned/dreamed/spelled/smelled/burned。两种都正确，写作保持一致即可。' }
            },
            {
              '@type': 'Question',
              name: 'get 的过去分词是 got 还是 gotten？',
              acceptedAnswer: { '@type': 'Answer', text: '英式英语用 got，美式英语用 gotten（表「获得」义）。本表主列 got、备注 gotten，两种写法在小测验中均判对。' }
            },
            {
              '@type': 'Question',
              name: '怎么高效记住这 180 个不规则动词？',
              acceptedAnswer: { '@type': 'Answer', text: '先按 AAA/ABB/ABA/ABC 四类记住形状规律，再用默写模式盖住两列逐词默想并点击揭示，最后每天开一次 10 词小测验，错的词次日重复。' }
            },
            {
              '@type': 'Question',
              name: '不规则动词数据以什么为准？',
              acceptedAnswer: { '@type': 'Answer', text: '词表以维基词典《English irregular verbs 附录》与剑桥/牛津学习者词典词表两源交叉核对整理，收录 180 个最常用动词并标注英美式差异，以权威词典为准。' }
            }
          ]
        }
      ]
    })
  }]
})

// ===== DATA-BEGIN（纯逻辑与数据，可独立单测） =====
// 数据口径：维基词典 Appendix:English irregular verbs 与剑桥/牛津学习者词典词表两源交叉核对；
// 主列取最常用形式，pastAlt/ppAlt 为并列变体（英美式差异），type 为变化类型（AAA/ABB/ABA/ABC）。
const VERBS = [
  // —— AAA：原形=过去式=过去分词 ——
  { base: 'cut', past: 'cut', pp: 'cut', zh: '切；割', type: 'AAA' },
  { base: 'put', past: 'put', pp: 'put', zh: '放；摆', type: 'AAA' },
  { base: 'let', past: 'let', pp: 'let', zh: '让；允许', type: 'AAA' },
  { base: 'set', past: 'set', pp: 'set', zh: '放置；设置', type: 'AAA' },
  { base: 'hit', past: 'hit', pp: 'hit', zh: '打；击中', type: 'AAA' },
  { base: 'hurt', past: 'hurt', pp: 'hurt', zh: '使受伤；疼痛', type: 'AAA' },
  { base: 'cost', past: 'cost', pp: 'cost', zh: '花费；值（多少钱）', type: 'AAA' },
  { base: 'read', past: 'read', pp: 'read', zh: '读（拼写同形，读音 /riːd/→/red/）', type: 'AAA' },
  { base: 'shut', past: 'shut', pp: 'shut', zh: '关上；合上', type: 'AAA' },
  { base: 'split', past: 'split', pp: 'split', zh: '劈开；使分裂', type: 'AAA' },
  { base: 'spread', past: 'spread', pp: 'spread', zh: '传播；展开', type: 'AAA' },
  { base: 'bet', past: 'bet', pp: 'bet', zh: '打赌（也用 betted）', type: 'AAA', pastAlt: 'betted', ppAlt: 'betted' },
  { base: 'burst', past: 'burst', pp: 'burst', zh: '爆炸；突然发作', type: 'AAA' },
  { base: 'cast', past: 'cast', pp: 'cast', zh: '投掷；铸型', type: 'AAA' },
  { base: 'broadcast', past: 'broadcast', pp: 'broadcast', zh: '播送；广播（也用 broadcasted）', type: 'AAA', pastAlt: 'broadcasted', ppAlt: 'broadcasted' },
  { base: 'forecast', past: 'forecast', pp: 'forecast', zh: '预报；预测', type: 'AAA' },
  { base: 'quit', past: 'quit', pp: 'quit', zh: '停止；辞职（英式也用 quitted）', type: 'AAA', pastAlt: 'quitted', ppAlt: 'quitted' },
  { base: 'wet', past: 'wet', pp: 'wet', zh: '弄湿（英式也用 wetted）', type: 'AAA', pastAlt: 'wetted', ppAlt: 'wetted' },
  { base: 'sweat', past: 'sweat', pp: 'sweat', zh: '出汗（也用 sweated）', type: 'AAA', pastAlt: 'sweated', ppAlt: 'sweated' },
  { base: 'spit', past: 'spit', pp: 'spit', zh: '吐痰；吐出（英式过去式 spat）', type: 'AAA', pastAlt: 'spat', ppAlt: 'spat' },
  { base: 'rid', past: 'rid', pp: 'rid', zh: '使摆脱（英式也用 ridded）', type: 'AAA', pastAlt: 'ridded', ppAlt: 'ridded' },
  { base: 'shed', past: 'shed', pp: 'shed', zh: '流出；脱落', type: 'AAA' },
  { base: 'slit', past: 'slit', pp: 'slit', zh: '撕开；切开一条缝', type: 'AAA' },
  { base: 'thrust', past: 'thrust', pp: 'thrust', zh: '刺入；猛推', type: 'AAA' },
  { base: 'offset', past: 'offset', pp: 'offset', zh: '抵消；补偿', type: 'AAA' },
  { base: 'output', past: 'output', pp: 'output', zh: '输出（计算/工业用语）', type: 'AAA' },
  { base: 'upset', past: 'upset', pp: 'upset', zh: '使心烦；打翻', type: 'AAA' },
  { base: 'knit', past: 'knit', pp: 'knit', zh: '编织（英式也用 knitted）', type: 'AAA', ppAlt: 'knitted' },
  { base: 'bid', past: 'bid', pp: 'bid', zh: '出价；投标（「吩咐」义时 bid-bade-bidden）', type: 'AAA' },
  { base: 'reset', past: 'reset', pp: 'reset', zh: '重置；复位', type: 'AAA' },
  { base: 'input', past: 'input', pp: 'input', zh: '输入（计算用语）', type: 'AAA' },
  // —— ABA：过去分词与原形同形 ——
  { base: 'come', past: 'came', pp: 'come', zh: '来；到来', type: 'ABA' },
  { base: 'become', past: 'became', pp: 'become', zh: '成为；变得', type: 'ABA' },
  { base: 'run', past: 'ran', pp: 'run', zh: '跑；经营', type: 'ABA' },
  { base: 'overcome', past: 'overcame', pp: 'overcome', zh: '克服；战胜', type: 'ABA' },
  // —— ABB：过去式与过去分词同形 ——
  { base: 'bring', past: 'brought', pp: 'brought', zh: '带来；引起', type: 'ABB' },
  { base: 'build', past: 'built', pp: 'built', zh: '建造；建立', type: 'ABB' },
  { base: 'buy', past: 'bought', pp: 'bought', zh: '买；相信', type: 'ABB' },
  { base: 'catch', past: 'caught', pp: 'caught', zh: '捕捉；赶上', type: 'ABB' },
  { base: 'teach', past: 'taught', pp: 'taught', zh: '教；教导', type: 'ABB' },
  { base: 'think', past: 'thought', pp: 'thought', zh: '想；认为', type: 'ABB' },
  { base: 'feel', past: 'felt', pp: 'felt', zh: '感觉；摸起来', type: 'ABB' },
  { base: 'find', past: 'found', pp: 'found', zh: '找到；发现', type: 'ABB' },
  { base: 'get', past: 'got', pp: 'got', zh: '得到；变得（美式过去分词 gotten）', type: 'ABB', ppAlt: 'gotten' },
  { base: 'have', past: 'had', pp: 'had', zh: '有；已经（助动词）', type: 'ABB' },
  { base: 'hear', past: 'heard', pp: 'heard', zh: '听见；听说', type: 'ABB' },
  { base: 'hold', past: 'held', pp: 'held', zh: '拿着；举行', type: 'ABB' },
  { base: 'keep', past: 'kept', pp: 'kept', zh: '保持；保存', type: 'ABB' },
  { base: 'lay', past: 'laid', pp: 'laid', zh: '放置；下蛋', type: 'ABB' },
  { base: 'lead', past: 'led', pp: 'led', zh: '带领；导致', type: 'ABB' },
  { base: 'leave', past: 'left', pp: 'left', zh: '离开；留下', type: 'ABB' },
  { base: 'lose', past: 'lost', pp: 'lost', zh: '丢失；输掉', type: 'ABB' },
  { base: 'make', past: 'made', pp: 'made', zh: '制作；使成为', type: 'ABB' },
  { base: 'mean', past: 'meant', pp: 'meant', zh: '意指；打算', type: 'ABB' },
  { base: 'meet', past: 'met', pp: 'met', zh: '遇见；满足', type: 'ABB' },
  { base: 'pay', past: 'paid', pp: 'paid', zh: '支付；付出代价', type: 'ABB' },
  { base: 'say', past: 'said', pp: 'said', zh: '说；表明', type: 'ABB' },
  { base: 'sell', past: 'sold', pp: 'sold', zh: '卖；出售', type: 'ABB' },
  { base: 'send', past: 'sent', pp: 'sent', zh: '发送；派遣', type: 'ABB' },
  { base: 'sit', past: 'sat', pp: 'sat', zh: '坐；开会', type: 'ABB' },
  { base: 'sleep', past: 'slept', pp: 'slept', zh: '睡觉', type: 'ABB' },
  { base: 'spend', past: 'spent', pp: 'spent', zh: '花费；度过', type: 'ABB' },
  { base: 'stand', past: 'stood', pp: 'stood', zh: '站立；忍受', type: 'ABB' },
  { base: 'understand', past: 'understood', pp: 'understood', zh: '理解；懂', type: 'ABB' },
  { base: 'withstand', past: 'withstood', pp: 'withstood', zh: '抵挡；经受', type: 'ABB' },
  { base: 'tell', past: 'told', pp: 'told', zh: '告诉；辨别', type: 'ABB' },
  { base: 'win', past: 'won', pp: 'won', zh: '获胜；赢得', type: 'ABB' },
  { base: 'bend', past: 'bent', pp: 'bent', zh: '弯曲；使弯曲', type: 'ABB' },
  { base: 'dig', past: 'dug', pp: 'dug', zh: '挖；挖出', type: 'ABB' },
  { base: 'feed', past: 'fed', pp: 'fed', zh: '喂养；进食', type: 'ABB' },
  { base: 'fight', past: 'fought', pp: 'fought', zh: '打架；斗争', type: 'ABB' },
  { base: 'hang', past: 'hung', pp: 'hung', zh: '悬挂（「绞死」用 hanged-hanged）', type: 'ABB', ppAlt: 'hanged' },
  { base: 'learn', past: 'learnt', pp: 'learnt', zh: '学习；得知（美式 learned）', type: 'ABB', pastAlt: 'learned', ppAlt: 'learned' },
  { base: 'light', past: 'lit', pp: 'lit', zh: '点燃；照亮（也用 lighted）', type: 'ABB', ppAlt: 'lighted' },
  { base: 'lend', past: 'lent', pp: 'lent', zh: '借出；贷款', type: 'ABB' },
  { base: 'shoot', past: 'shot', pp: 'shot', zh: '射击；拍摄', type: 'ABB' },
  { base: 'smell', past: 'smelt', pp: 'smelt', zh: '闻；发臭（美式 smelled）', type: 'ABB', pastAlt: 'smelled', ppAlt: 'smelled' },
  { base: 'speed', past: 'sped', pp: 'sped', zh: '加速（也用 speeded）', type: 'ABB', pastAlt: 'speeded', ppAlt: 'speeded' },
  { base: 'spell', past: 'spelt', pp: 'spelt', zh: '拼写；意味着（美式 spelled）', type: 'ABB', pastAlt: 'spelled', ppAlt: 'spelled' },
  { base: 'spill', past: 'spilt', pp: 'spilt', zh: '洒出；溢出（美式 spilled）', type: 'ABB', pastAlt: 'spilled', ppAlt: 'spilled' },
  { base: 'spoil', past: 'spoilt', pp: 'spoilt', zh: '溺爱；破坏（美式 spoiled）', type: 'ABB', pastAlt: 'spoiled', ppAlt: 'spoiled' },
  { base: 'stick', past: 'stuck', pp: 'stuck', zh: '粘住；坚持', type: 'ABB' },
  { base: 'strike', past: 'struck', pp: 'struck', zh: '打击；罢工（过去分词也用 stricken）', type: 'ABB', ppAlt: 'stricken' },
  { base: 'sweep', past: 'swept', pp: 'swept', zh: '打扫；席卷', type: 'ABB' },
  { base: 'swing', past: 'swung', pp: 'swung', zh: '摇摆；挥动', type: 'ABB' },
  { base: 'deal', past: 'dealt', pp: 'dealt', zh: '处理；发牌', type: 'ABB' },
  { base: 'dream', past: 'dreamt', pp: 'dreamt', zh: '做梦；梦想（美式 dreamed）', type: 'ABB', pastAlt: 'dreamed', ppAlt: 'dreamed' },
  { base: 'flee', past: 'fled', pp: 'fled', zh: '逃跑；逃避', type: 'ABB' },
  { base: 'bleed', past: 'bled', pp: 'bled', zh: '流血；放血', type: 'ABB' },
  { base: 'breed', past: 'bred', pp: 'bred', zh: '饲养；繁殖', type: 'ABB' },
  { base: 'creep', past: 'crept', pp: 'crept', zh: '爬行；蹑手蹑脚', type: 'ABB' },
  { base: 'kneel', past: 'knelt', pp: 'knelt', zh: '跪下（也用 kneeled）', type: 'ABB', pastAlt: 'kneeled', ppAlt: 'kneeled' },
  { base: 'lean', past: 'leant', pp: 'leant', zh: '倚靠；倾斜（美式 leaned）', type: 'ABB', pastAlt: 'leaned', ppAlt: 'leaned' },
  { base: 'leap', past: 'leapt', pp: 'leapt', zh: '跳跃；猛涨（美式 leaped）', type: 'ABB', pastAlt: 'leaped', ppAlt: 'leaped' },
  { base: 'seek', past: 'sought', pp: 'sought', zh: '寻找；寻求', type: 'ABB' },
  { base: 'shine', past: 'shone', pp: 'shone', zh: '照耀（「擦亮」也用 shined）', type: 'ABB', ppAlt: 'shined' },
  { base: 'weep', past: 'wept', pp: 'wept', zh: '哭泣；渗出', type: 'ABB' },
  { base: 'burn', past: 'burnt', pp: 'burnt', zh: '燃烧；烧毁（美式 burned）', type: 'ABB', pastAlt: 'burned', ppAlt: 'burned' },
  { base: 'dwell', past: 'dwelt', pp: 'dwelt', zh: '居住；详述（美式 dwelled）', type: 'ABB', pastAlt: 'dwelled', ppAlt: 'dwelled' },
  { base: 'cling', past: 'clung', pp: 'clung', zh: '紧握；依附', type: 'ABB' },
  { base: 'sting', past: 'stung', pp: 'stung', zh: '刺痛；叮咬', type: 'ABB' },
  { base: 'string', past: 'strung', pp: 'strung', zh: '用线串起；上弦', type: 'ABB' },
  { base: 'wring', past: 'wrung', pp: 'wrung', zh: '绞；拧', type: 'ABB' },
  { base: 'wind', past: 'wound', pp: 'wound', zh: '缠绕；上发条', type: 'ABB' },
  { base: 'spin', past: 'spun', pp: 'spun', zh: '旋转；纺纱', type: 'ABB' },
  { base: 'mislead', past: 'misled', pp: 'misled', zh: '误导；引入歧途', type: 'ABB' },
  { base: 'rebuild', past: 'rebuilt', pp: 'rebuilt', zh: '重建；改造', type: 'ABB' },
  { base: 'oversleep', past: 'overslept', pp: 'overslept', zh: '睡过头', type: 'ABB' },
  { base: 'overspend', past: 'overspent', pp: 'overspent', zh: '超支；花超', type: 'ABB' },
  { base: 'sling', past: 'slung', pp: 'slung', zh: '吊挂；投掷', type: 'ABB' },
  { base: 'fling', past: 'flung', pp: 'flung', zh: '猛投；抛', type: 'ABB' },
  { base: 'rethink', past: 'rethought', pp: 'rethought', zh: '反思；重新考虑', type: 'ABB' },
  { base: 'slide', past: 'slid', pp: 'slid', zh: '滑动；下滑（过去分词也用 slidden）', type: 'ABB', ppAlt: 'slidden' },
  { base: 'grind', past: 'ground', pp: 'ground', zh: '磨碎；碾', type: 'ABB' },
  { base: 'bind', past: 'bound', pp: 'bound', zh: '捆绑；装订', type: 'ABB' },
  { base: 'lie', past: 'lied', pp: 'lied', zh: '说谎（「躺卧」为 lie-lay-lain）', type: 'ABB' },
  { base: 'fit', past: 'fitted', pp: 'fitted', zh: '适合；合身（美式口语也用 fit）', type: 'ABB', pastAlt: 'fit', ppAlt: 'fit' },
  // —— ABC：三者各不同 ——
  { base: 'be', past: 'was/were', pp: 'been', zh: '是；在（过去式 am/is/are 变形）', type: 'ABC' },
  { base: 'begin', past: 'began', pp: 'begun', zh: '开始；着手', type: 'ABC' },
  { base: 'break', past: 'broke', pp: 'broken', zh: '打破；中断', type: 'ABC' },
  { base: 'choose', past: 'chose', pp: 'chosen', zh: '选择；挑选', type: 'ABC' },
  { base: 'do', past: 'did', pp: 'done', zh: '做；执行', type: 'ABC' },
  { base: 'draw', past: 'drew', pp: 'drawn', zh: '画；拉', type: 'ABC' },
  { base: 'drink', past: 'drank', pp: 'drunk', zh: '喝；饮酒', type: 'ABC' },
  { base: 'drive', past: 'drove', pp: 'driven', zh: '驾驶；驱动', type: 'ABC' },
  { base: 'eat', past: 'ate', pp: 'eaten', zh: '吃；侵蚀', type: 'ABC' },
  { base: 'fall', past: 'fell', pp: 'fallen', zh: '掉落；变成', type: 'ABC' },
  { base: 'fly', past: 'flew', pp: 'flown', zh: '飞；驾驶（飞机）', type: 'ABC' },
  { base: 'forget', past: 'forgot', pp: 'forgotten', zh: '忘记', type: 'ABC' },
  { base: 'forgive', past: 'forgave', pp: 'forgiven', zh: '原谅；宽恕', type: 'ABC' },
  { base: 'freeze', past: 'froze', pp: 'frozen', zh: '冻结；结冰', type: 'ABC' },
  { base: 'give', past: 'gave', pp: 'given', zh: '给；提供', type: 'ABC' },
  { base: 'go', past: 'went', pp: 'gone', zh: '去；变得', type: 'ABC' },
  { base: 'grow', past: 'grew', pp: 'grown', zh: '生长；种植', type: 'ABC' },
  { base: 'hide', past: 'hid', pp: 'hidden', zh: '藏；隐瞒', type: 'ABC' },
  { base: 'know', past: 'knew', pp: 'known', zh: '知道；认识', type: 'ABC' },
  { base: 'ride', past: 'rode', pp: 'ridden', zh: '骑；乘', type: 'ABC' },
  { base: 'ring', past: 'rang', pp: 'rung', zh: '按铃；（钟）响', type: 'ABC' },
  { base: 'rise', past: 'rose', pp: 'risen', zh: '上升；起身', type: 'ABC' },
  { base: 'see', past: 'saw', pp: 'seen', zh: '看见；理解', type: 'ABC' },
  { base: 'shake', past: 'shook', pp: 'shaken', zh: '摇动；握手', type: 'ABC' },
  { base: 'sing', past: 'sang', pp: 'sung', zh: '唱歌', type: 'ABC' },
  { base: 'sink', past: 'sank', pp: 'sunk', zh: '下沉；降低（过去分词也用 sunken）', type: 'ABC', pastAlt: 'sunk', ppAlt: 'sunken' },
  { base: 'speak', past: 'spoke', pp: 'spoken', zh: '说话；演讲', type: 'ABC' },
  { base: 'steal', past: 'stole', pp: 'stolen', zh: '偷；窃取', type: 'ABC' },
  { base: 'swim', past: 'swam', pp: 'swum', zh: '游泳', type: 'ABC' },
  { base: 'take', past: 'took', pp: 'taken', zh: '拿；带走', type: 'ABC' },
  { base: 'throw', past: 'threw', pp: 'thrown', zh: '扔；投掷', type: 'ABC' },
  { base: 'wake', past: 'woke', pp: 'woken', zh: '醒来；唤醒（也用 waked）', type: 'ABC', pastAlt: 'waked', ppAlt: 'waked' },
  { base: 'wear', past: 'wore', pp: 'worn', zh: '穿；磨损', type: 'ABC' },
  { base: 'write', past: 'wrote', pp: 'written', zh: '写；写作', type: 'ABC' },
  { base: 'bear', past: 'bore', pp: 'born', zh: '承受；生育（过去分词 born 表「出生」，borne 表「生育/承受」）', type: 'ABC', ppAlt: 'borne' },
  { base: 'bite', past: 'bit', pp: 'bitten', zh: '咬；叮', type: 'ABC' },
  { base: 'blow', past: 'blew', pp: 'blown', zh: '吹；爆炸', type: 'ABC' },
  { base: 'arise', past: 'arose', pp: 'arisen', zh: '出现；产生', type: 'ABC' },
  { base: 'awake', past: 'awoke', pp: 'awoken', zh: '唤醒；觉醒', type: 'ABC' },
  { base: 'forbid', past: 'forbade', pp: 'forbidden', zh: '禁止；不许（过去式也用 forbad）', type: 'ABC', pastAlt: 'forbad' },
  { base: 'mistake', past: 'mistook', pp: 'mistaken', zh: '弄错；误解', type: 'ABC' },
  { base: 'overtake', past: 'overtook', pp: 'overtaken', zh: '赶上；超过', type: 'ABC' },
  { base: 'rewrite', past: 'rewrote', pp: 'rewritten', zh: '重写；改写', type: 'ABC' },
  { base: 'sew', past: 'sewed', pp: 'sewn', zh: '缝纫（过去分词也用 sewed）', type: 'ABC', ppAlt: 'sewed' },
  { base: 'sow', past: 'sowed', pp: 'sown', zh: '播种（过去分词也用 sowed）', type: 'ABC', ppAlt: 'sowed' },
  { base: 'saw', past: 'sawed', pp: 'sawn', zh: '锯开（过去分词也用 sawed）', type: 'ABC', ppAlt: 'sawed' },
  { base: 'spring', past: 'sprang', pp: 'sprung', zh: '弹跳；跃起（过去式也用 sprung）', type: 'ABC', pastAlt: 'sprung' },
  { base: 'strive', past: 'strove', pp: 'striven', zh: '努力；奋斗（也用 strived）', type: 'ABC', pastAlt: 'strived', ppAlt: 'strived' },
  { base: 'swear', past: 'swore', pp: 'sworn', zh: '发誓；咒骂', type: 'ABC' },
  { base: 'swell', past: 'swelled', pp: 'swollen', zh: '膨胀；肿胀（过去分词也用 swelled）', type: 'ABC', ppAlt: 'swelled' },
  { base: 'tear', past: 'tore', pp: 'torn', zh: '撕裂；扯破', type: 'ABC' },
  { base: 'tread', past: 'trod', pp: 'trodden', zh: '踩；踏（过去分词也用 trod）', type: 'ABC', ppAlt: 'trod' },
  { base: 'weave', past: 'wove', pp: 'woven', zh: '编织；迂回行进', type: 'ABC' },
  { base: 'withdraw', past: 'withdrew', pp: 'withdrawn', zh: '撤回；取款', type: 'ABC' },
  { base: 'show', past: 'showed', pp: 'shown', zh: '展示；放映（过去分词也用 showed）', type: 'ABC', ppAlt: 'showed' },
  { base: 'stink', past: 'stank', pp: 'stunk', zh: '发臭；招人厌（过去式也用 stunk）', type: 'ABC', pastAlt: 'stunk' },
  { base: 'shrink', past: 'shrank', pp: 'shrunk', zh: '收缩；退缩（过去分词也用 shrunken）', type: 'ABC', pastAlt: 'shrunk', ppAlt: 'shrunken' },
  { base: 'lie', past: 'lay', pp: 'lain', zh: '躺；平卧（「说谎」为 lie-lied-lied）', type: 'ABC' },
  { base: 'undo', past: 'undid', pp: 'undone', zh: '解开；撤销', type: 'ABC' },
  { base: 'redo', past: 'redid', pp: 'redone', zh: '重做；再做', type: 'ABC' },
  { base: 'shave', past: 'shaved', pp: 'shaven', zh: '剃；刮（过去分词也用 shaved）', type: 'ABC', ppAlt: 'shaved' },
  { base: 'overthrow', past: 'overthrew', pp: 'overthrown', zh: '推翻；打倒', type: 'ABC' },
  { base: 'undergo', past: 'underwent', pp: 'undergone', zh: '经受；接受（手术等）', type: 'ABC' }
].map((v, i) => ({ ...v, id: i }))

// 变化类型元信息（标签 + 规律提示 + 徽章色）
const TYPE_META = {
  AAA: { label: 'AAA 三态同形', hint: '原形、过去式、过去分词完全同形，如 cut-cut-cut。', badge: 'bg-primary/15 text-primary' },
  ABB: { label: 'ABB 过去分词随过去式', hint: '过去式与过去分词同形，如 build-built-built。', badge: 'bg-blue-500/15 text-blue-600' },
  ABA: { label: 'ABA 分词回到原形', hint: '过去分词与原形同形，如 come-came-come。', badge: 'bg-green-500/15 text-green-600' },
  ABC: { label: 'ABC 三态各不同', hint: '三种形态互不相同，如 begin-began-begun。', badge: 'bg-amber-500/15 text-amber-600' }
}
const TYPE_ORDER = ['AAA', 'ABB', 'ABA', 'ABC']

// 类型一致性：每个动词必须满足其标注的形态规律（AAA 三同、ABB 后两同、ABA 首尾同、ABC 互异）
function typeConsistent(v) {
  const { base, past, pp, type } = v
  if (type === 'AAA') return base === past && past === pp
  if (type === 'ABB') return base !== past && past === pp
  if (type === 'ABA') return base !== past && past !== pp && base === pp
  if (type === 'ABC') return base !== past && past !== pp && base !== pp
  return false
}

// 搜索：原形/过去式/过去分词/中文/类型 小写包含匹配
function matchVerb(v, query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return true
  return [v.base, v.past, v.pp, v.pastAlt || '', v.ppAlt || '', v.zh, v.type]
    .join(' ').toLowerCase().includes(q)
}

function filterVerbs(rows, type, query) {
  return rows.filter((v) => (type === 'all' || v.type === type) && matchVerb(v, query))
}

// TSV 导出：表头 + 筛选结果（可粘贴 Excel 分列）
function buildTsv(rows) {
  const header = ['原形', '过去式', '过去分词', '中文释义', '类型'].join('\t')
  const lines = rows.map((v) => [v.base, v.pastAlt ? `${v.past}/${v.pastAlt}` : v.past, v.ppAlt ? `${v.pp}/${v.ppAlt}` : v.pp, v.zh, v.type].join('\t'))
  return [header].concat(lines).join('\n')
}

// 小测验判分：大小写/空格归一后比对主形式与并列变体
function normAns(s) {
  return String(s ?? '').trim().toLowerCase().replace(/\s+/g, '')
}
function accepted(list, alt) {
  const arr = [list, alt].filter(Boolean).map(normAns)
  return arr
}
function judgeItem(v, pastIn, ppIn) {
  const pastOk = normAns(pastIn) !== '' && accepted(v.past, v.pastAlt).includes(normAns(pastIn))
  const ppOk = normAns(ppIn) !== '' && accepted(v.pp, v.ppAlt).includes(normAns(ppIn))
  return { pastOk, ppOk, correct: pastOk && ppOk }
}
// ===== DATA-END =====

// ---------- UI 常量 ----------
const TYPE_TABS = [
  { id: 'all', label: '全部' },
  ...TYPE_ORDER.map((t) => ({ id: t, label: TYPE_META[t].label.split(' ')[0] }))
]
TYPE_TABS.forEach((tab) => {
  tab.count = tab.id === 'all' ? VERBS.length : VERBS.filter((v) => v.type === tab.id).length
})

const TYPE_BADGE = Object.fromEntries(TYPE_ORDER.map((t) => [t, TYPE_META[t].badge]))

// ---------- 响应式状态 ----------
const searchQuery = ref('')
const activeType = ref('all')
const hideMode = ref(false)
const revealed = ref({})
const quizActive = ref(false)
const quizDone = ref(false)
const quizItems = ref([])

// ---------- 派生 ----------
const filteredVerbs = computed(() => filterVerbs(VERBS, activeType.value, searchQuery.value))
const activeTypeHint = computed(() => (activeType.value === 'all' ? '点击类型查看规律提示；总数与各组计数由词表实时统计，四组之和恒等于总词数。' : TYPE_META[activeType.value].hint))
const quizScore = computed(() => (quizDone.value ? quizItems.value.reduce((sum, it) => sum + (judgeItem(it, it.pastIn, it.ppIn).correct ? 2 : (judgeItem(it, it.pastIn, it.ppIn).pastOk || judgeItem(it, it.pastIn, it.ppIn).ppOk ? 1 : 0)), 0) : 0))

// ---------- 交互（浏览器 API 仅在回调内，SSR 安全） ----------
function toggleHideMode() {
  hideMode.value = !hideMode.value
  revealed.value = {}
}

function isRevealed(v, col) {
  return Boolean(revealed.value[`${v.id}-${col}`])
}

function revealCell(v, col) {
  revealed.value = { ...revealed.value, [`${v.id}-${col}`]: true }
}

function startQuiz() {
  const pool = filteredVerbs.value.slice()
  if (!pool.length) {
    alert('当前筛选结果为空，请先调整搜索词或类型筛选')
    return
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  quizItems.value = pool.slice(0, Math.min(10, pool.length)).map((v) => ({ ...v, pastIn: '', ppIn: '' }))
  quizDone.value = false
  quizActive.value = true
}

function judgeItemFor(item) {
  return judgeItem(item, item.pastIn, item.ppIn)
}

function submitQuiz() {
  if (!quizItems.value.length) return
  quizDone.value = true
  trackEvent('工具结果', '小测验判分', 'irregular-verbs-table')
}

function answerPast(item) {
  return item.pastAlt ? `${item.past} / ${item.pastAlt}` : item.past
}

function answerPp(item) {
  return item.ppAlt ? `${item.pp} / ${item.ppAlt}` : item.pp
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制')
    trackEvent('工具结果', '复制', 'irregular-verbs-table')
  } catch (err) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      alert(ok ? '已复制' : '复制失败，请手动选择复制')
    } catch (err2) {
      alert('复制失败，请手动选择复制')
    }
  }
}

function copyTsv() {
  copyText(buildTsv(filteredVerbs.value))
}

function printCard() {
  window.print()
}

onMounted(() => {
  addRecentTool('irregular-verbs-table')
})
</script>

<style scoped>
@media print {
  @page {
    size: A4 portrait;
    margin: 10mm;
  }

  .no-print {
    display: none !important;
  }

  .print-table-card {
    border: none !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  table {
    font-size: 10.5px;
  }
}
</style>
