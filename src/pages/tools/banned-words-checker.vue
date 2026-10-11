<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ShieldCheck class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">广告法违禁词检测</h1>
          <p class="text-sm text-muted-foreground mt-1">详情页/直播话术发布前自查极限词，分级高亮 + 替换建议</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        《广告法》对"最佳、第一、国家级"等绝对化用语和虚假宣传用语有明确禁令，电商详情页、直播话术、朋友圈文案发布前都应自查。本工具内置 120+ 常见违禁词，按绝对化极限词、权威背书、欺骗误导、医疗功效四级分组，粘贴文本即分级高亮命中词、统计各级命中数，点击命中词可查看替换建议，还支持临时追加自定义词。全部检测在浏览器本地完成，文本不会上传。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <FileSearch class="w-5 h-5 mr-2 text-primary" /> 待检测文本
        </h2>
        <textarea
          v-model="inputText"
          rows="10"
          class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          placeholder="粘贴商品详情、直播话术、推广文案等文本，例如：全网最低价，国家级品质，彻底根除脱发"
        ></textarea>
        <div class="flex items-center justify-between text-xs text-muted-foreground">
          <span>{{ inputText.length }} 字</span>
          <button
            v-if="inputText"
            @click="inputText = ''"
            class="hover:text-destructive transition-colors"
          >清空</button>
        </div>

        <!-- 自定义追加词 -->
        <div class="border-t border-border pt-4">
          <label class="block text-sm font-medium text-foreground mb-2">自定义追加词（每行一个，仅本次生效）</label>
          <textarea
            v-model="customInput"
            rows="4"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="例如行业黑话、平台敏感词等，每行一个"
          ></textarea>
          <p v-if="customWords.length" class="text-xs text-muted-foreground mt-1">已追加 {{ customWords.length }} 个自定义词</p>
        </div>
      </div>

      <!-- 右侧：检测结果 -->
      <div class="space-y-4">
        <!-- 统计面板 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <BarChart3 class="w-5 h-5 mr-2 text-primary" /> 检测统计
          </h2>
          <div class="bg-muted/50 rounded-lg p-4 text-center mb-4">
            <p class="text-xs text-muted-foreground mb-1">命中词总数</p>
            <p :class="totalCount > 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'" class="text-3xl font-bold">
              {{ totalCount }}
            </p>
            <p class="text-xs text-muted-foreground mt-1">{{ totalCount > 0 ? '建议逐条核对并替换' : '未检测到内置违禁词，仍请结合语境自查' }}</p>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="g in groupDefs"
              :key="g.key"
              class="rounded-lg p-3 flex items-center justify-between"
              :class="g.chipBg"
            >
              <span class="text-xs font-medium" :class="g.text">{{ g.shortLabel }}</span>
              <span class="text-lg font-bold" :class="g.text">{{ groupCount(g.key) }}</span>
            </div>
          </div>
        </div>

        <!-- 高亮结果 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <Highlighter class="w-5 h-5 mr-2 text-primary" /> 分级高亮
          </h2>
          <div
            v-if="inputText"
            class="bg-muted/50 rounded-lg p-4 text-sm leading-7 whitespace-pre-wrap break-all text-foreground"
          >
            <template v-for="(seg, i) in segments" :key="i">
              <button
                v-if="seg.match"
                @click="selectedMatch = seg.match"
                class="rounded px-0.5 font-medium underline decoration-dotted underline-offset-2 transition-all"
                :class="[groupOf(seg.match.group).chipBg, groupOf(seg.match.group).text, selectedMatch === seg.match ? 'ring-2 ring-offset-0 ring-primary' : '']"
                :title="'点击查看替换建议'"
              >{{ seg.text }}</button>
              <template v-else>{{ seg.text }}</template>
            </template>
          </div>
          <div v-else class="p-8 text-center text-muted-foreground text-sm">
            粘贴文本后自动检测
          </div>

          <!-- 替换建议 -->
          <div v-if="selectedMatch" class="bg-primary/5 border border-primary/30 rounded-lg p-4 mt-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="font-bold text-foreground">"{{ selectedMatch.word }}"</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="[groupOf(selectedMatch.group).chipBg, groupOf(selectedMatch.group).text]">
                {{ groupOf(selectedMatch.group).shortLabel }}
              </span>
              <button
                @click="selectedMatch = null"
                class="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
            <p class="text-xs text-muted-foreground mb-2">替换建议（仅供参考，请结合产品实际）：</p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="s in suggestionsFor(selectedMatch.word)"
                :key="s"
                class="px-2.5 py-1 bg-background border border-border rounded-full text-xs text-foreground"
              >{{ s }}</span>
            </div>
            <p v-if="!suggestionsFor(selectedMatch.word).length" class="text-xs text-muted-foreground">
              暂无内置建议，可改用中性描述或删除该表述
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 词表总览（可折叠） -->
    <div class="relative mb-8">
      <button
        @click="wordListVisible = !wordListVisible"
        class="w-full flex items-center justify-between bg-card border border-border rounded-lg px-6 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span class="font-semibold text-foreground flex items-center">
          <BookOpen class="w-5 h-5 mr-2 text-primary" /> 内置词表总览（{{ totalWordCount }} 词）
        </span>
        <ChevronUp v-if="wordListVisible" class="w-5 h-5 text-muted-foreground" />
        <ChevronDown v-else class="w-5 h-5 text-muted-foreground" />
      </button>
      <div v-show="wordListVisible" class="bg-card border border-t-0 border-border rounded-b-lg p-6 space-y-5">
        <div v-for="g in groupDefs.filter(x => x.key !== 'custom')" :key="'list' + g.key">
          <h3 class="text-sm font-semibold mb-2" :class="g.text">{{ g.label }}（{{ g.words.length }}）</h3>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="w in g.words"
              :key="w"
              class="px-2 py-0.5 rounded text-xs bg-muted/60 text-muted-foreground"
            >{{ w }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="seoContentVisible = !seoContentVisible"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>广告法违禁词为什么要自查</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            《中华人民共和国广告法》第九条明确禁止使用"国家级""最高级""最佳"等用语，虚假宣传、诱导互动、非药品宣称疗效等也都是高频处罚原因。平台对违禁词的审核往往比法规更严格，轻则限流下架，重则罚款。发布前用工具过一遍词，是成本最低的合规动作。
          </p>
          <h3 class="text-lg font-semibold text-foreground">词表的分级依据</h3>
          <p>
            本工具把 120+ 常见违禁词分为四级：A 级绝对化极限词（最、第一、独家、全网等）是《广告法》明文禁止的重点；B 级权威背书类（国家级、免检、专家推荐等）涉及无法证实的权威背书；C 级欺骗误导类（免费送、点击有奖、史上、永久等）属于虚假承诺与诱导；D 级医疗功效类（根治、消炎、减肥等）是非药品不得宣称的功效表述。
          </p>
          <h3 class="text-lg font-semibold text-foreground">命中之后怎么改</h3>
          <p>
            点击高亮词可查看替换建议，思路是把"断言式夸大"换成"可证实的描述"：最→超/更，第一→领先，独家→原创，彻底根除→改善/缓解。替换后请确认新表述依然真实、有依据，避免为了绕开检测而二次夸大。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">检测出违禁词一定会被处罚吗？</span>不一定，执法会结合语境与证据，例如新闻报道、他人评价中的"最"并非广告用语；但商业推广文案中出现即有风险，建议直接替换更稳妥。</li>
            <li><span class="text-foreground font-medium">词表可以补充吗？</span>可以。右侧"自定义追加词"支持每行一个临时加入行业黑话或平台敏感词，仅在本次会话生效，刷新后恢复内置词表。</li>
            <li><span class="text-foreground font-medium">替换建议可以直接照抄吗？</span>建议仅供参考，替换后仍需保证表述真实、可证实；如"改善"也需有相应依据，不能构成新的夸大宣传。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'banned-words-checker'" :category="'text'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  ShieldCheck, FileSearch, BarChart3, Highlighter, BookOpen,
  X, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '广告法违禁词检测 - 极限词分级高亮与替换建议',
  description: '在线广告法违禁词检测工具：内置 120+ 极限词/权威背书/欺骗误导/医疗功效四级词表，粘贴文案分级高亮命中词、统计各级命中数，点击查看替换建议，支持自定义追加词，纯本地检测',
  keywords: '违禁词检测, 极限词查询, 广告法违禁词, 电商违禁词, 文案合规检测, 极限词替换',
  author: 'Util工具箱',
  ogTitle: '广告法违禁词检测 - 有条工具',
  ogDescription: '详情页/直播话术发布前自查极限词，分级高亮+替换建议',
  ogUrl: 'https://www.util.cn/tools/banned-words-checker',
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
          name: '广告法违禁词检测',
          url: 'https://www.util.cn/tools/banned-words-checker',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['120+ 内置违禁词', '四级分组高亮', '各级命中统计', '点击查看替换建议', '自定义追加词', '纯本地检测不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本工具', item: 'https://www.util.cn/text/' },
            { '@type': 'ListItem', position: 3, name: '广告法违禁词检测', item: 'https://www.util.cn/tools/banned-words-checker/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '检测出违禁词一定会被处罚吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不一定，执法会结合语境与证据；但商业推广文案中出现即有风险，建议直接替换更稳妥。' }
            },
            {
              '@type': 'Question',
              name: '词表可以补充吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以，"自定义追加词"支持每行一个临时加入行业黑话或平台敏感词，仅在本次会话生效。' }
            },
            {
              '@type': 'Question',
              name: '替换建议可以直接照抄吗？',
              acceptedAnswer: { '@type': 'Answer', text: '建议仅供参考，替换后仍需保证表述真实、可证实，不能构成新的夸大宣传。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'banned-words-checker')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 分级词表（120+ 词） ----------
const groupDefs = [
  {
    key: 'a',
    label: 'A 绝对化极限词',
    shortLabel: 'A 极限词',
    chipBg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    words: [
      '最', '最佳', '最好', '最低价', '最便宜', '第一', 'NO.1', '顶尖', '顶级', '极致',
      '极品', '绝对', '终极', '唯一', '首个', '独家', '独创', '全网', '全国第一', '世界级',
      '宇宙级', '王牌', '冠军', '销量冠军', '100%', '100分', '最低', '最高', '最大', '最小',
      '最强', '最优', '最先进', '最优秀', '最畅销', '最高级', '首选', '空前', '绝无仅有', '无敌',
      '百分百', '全网第一', '全网最低', '销量第一', '行业第一', '完美', '独一无二', '遥遥领先'
    ]
  },
  {
    key: 'b',
    label: 'B 权威背书类',
    shortLabel: 'B 权威背书',
    chipBg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    words: [
      '国家级', '国家领导人推荐', '质量免检', '免检产品', '专家推荐', '权威认证', '驰名商标',
      '特供', '专供', '国宴', '国家认证', '国家推荐', '领导人推荐', '免检', '名牌', '中国名牌',
      '著名商标', '权威', '专家', '特制', '国家机关推荐', '质检免检', '国际认证'
    ]
  },
  {
    key: 'c',
    label: 'C 欺骗误导类',
    shortLabel: 'C 欺骗误导',
    chipBg: 'bg-violet-500/10',
    text: 'text-violet-600 dark:text-violet-400',
    words: [
      '免费送', '点击有奖', '全民免单', '秒杀全网', '史上', '史无前例', '万年不遇', '永久',
      '万年', '绝不反弹', '永不', '彻底根除', '点击领奖', '立即有奖', '中奖', '抽奖', '稳赚',
      '稳赚不赔', '零风险', '保本', '翻倍收益', '躺赚', '错过等十年', '仅此一次', '最后一天',
      '绝不再来', '秒杀'
    ]
  },
  {
    key: 'd',
    label: 'D 医疗功效类（非药品禁用）',
    shortLabel: 'D 医疗功效',
    chipBg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    words: [
      '根治', '治愈', '消炎', '杀菌', '活血化瘀', '丰胸', '减肥', '特效', '药到病除', '无副作用',
      '疗效', '康复', '痊愈', '抗菌', '抑菌', '止痛', '降血压', '降血糖', '降血脂', '增强免疫',
      '延年益寿', '祛斑', '生发'
    ]
  },
  {
    key: 'custom',
    label: '自定义词',
    shortLabel: '自定义',
    chipBg: 'bg-pink-500/10',
    text: 'text-pink-600 dark:text-pink-400',
    words: []
  }
]

// ---------- 替换建议映射（30+ 条） ----------
const replacementMap = {
  '最': ['超', '更'],
  '最佳': ['优选', '上佳'],
  '最好': ['更好', '口碑不错'],
  '最低价': ['实惠价', '心动价'],
  '最便宜': ['实惠', '划算'],
  '第一': ['领先', '名列前茅'],
  'NO.1': ['热销', '人气款'],
  '顶尖': ['资深', '专业'],
  '顶级': ['高端', '优质'],
  '极致': ['用心', '讲究'],
  '极品': ['上品', '佳品'],
  '绝对': ['放心', '靠谱'],
  '终极': ['进阶', '升级款'],
  '唯一': ['独特', '少见'],
  '首个': ['新推出', '较早推出'],
  '独家': ['原创', '自有'],
  '独创': ['原创', '自研'],
  '全网': ['多平台', '线上'],
  '世界级': ['高水准', '专业级'],
  '王牌': ['主打', '明星款'],
  '冠军': ['热销', '领先'],
  '国家级': ['高标准', '严选'],
  '免检': ['严格质检'],
  '专家推荐': ['用户好评'],
  '权威认证': ['第三方检测'],
  '特供': ['定制', '精选'],
  '专供': ['定制', '精选'],
  '史上': ['近年来'],
  '永久': ['长效', '持久'],
  '永不': ['持久'],
  '彻底根除': ['改善', '缓解'],
  '根治': ['调理', '改善'],
  '治愈': ['改善', '缓解'],
  '消炎': ['舒缓', '清爽'],
  '杀菌': ['清洁', '净爽'],
  '减肥': ['塑形', '轻体'],
  '丰胸': ['塑形'],
  '特效': ['用心配方'],
  '免费送': ['优惠活动', '有赠品'],
  '点击有奖': ['参与互动'],
  '秒杀全网': ['限时优惠'],
  '百分百': ['高占比'],
  '完美': ['出色', '用心']
}

// ---------- 状态 ----------
const inputText = ref('')
const customInput = ref('')
const selectedMatch = ref(null)
const wordListVisible = ref(false)
const seoContentVisible = ref(true)

const customWords = computed(() => customInput.value
  .split(/\n+/)
  .map(s => s.trim())
  .filter(Boolean))

const totalWordCount = computed(() => groupDefs
  .filter(g => g.key !== 'custom')
  .reduce((sum, g) => sum + g.words.length, 0))

// ---------- 检测 ----------
const matches = computed(() => {
  const text = inputText.value
  if (!text) return []
  const all = []
  const sources = groupDefs.map(g => ({ group: g.key, words: g.key === 'custom' ? customWords.value : g.words }))
  sources.forEach(({ group, words }) => {
    words.forEach(w => {
      if (!w) return
      let idx = text.indexOf(w)
      while (idx !== -1) {
        all.push({ start: idx, end: idx + w.length, word: w, group })
        idx = text.indexOf(w, idx + 1)
      }
    })
  })
  // 同一位置优先最长词，去重叠
  all.sort((x, y) => x.start - y.start || (y.end - y.start) - (x.end - x.start))
  const result = []
  let lastEnd = -1
  all.forEach(m => {
    if (m.start >= lastEnd) {
      result.push(m)
      lastEnd = m.end
    }
  })
  return result
})

const segments = computed(() => {
  const text = inputText.value
  if (!text) return []
  const segs = []
  let cursor = 0
  matches.value.forEach(m => {
    if (m.start > cursor) segs.push({ text: text.slice(cursor, m.start), match: null })
    segs.push({ text: m.word, match: m })
    cursor = m.end
  })
  if (cursor < text.length) segs.push({ text: text.slice(cursor), match: null })
  return segs
})

const totalCount = computed(() => matches.value.length)

const groupCount = (key) => matches.value.filter(m => m.group === key).length

const groupOf = (key) => groupDefs.find(g => g.key === key) || groupDefs[groupDefs.length - 1]

const suggestionsFor = (word) => replacementMap[word] || []
</script>
