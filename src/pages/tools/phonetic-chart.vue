<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Ear class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">英语 48 音标表</h1>
          <p class="text-sm text-muted-foreground mt-1">国际音标（DJ 音标体系）48 个全览：20 个元音 + 28 个辅音，每个音标配 2 个例词、口型/舌位要点，支持点选放大与清浊成对排布</p>
        </div>
      </div>
      <p class="text-muted-foreground no-print">
        在线英语音标表：按英式 DJ 音标体系收录 48 个音标——单元音 12 个（iː ɪ e æ ɑː ɒ ɔː ʊ uː ʌ ɜː ə）、双元音 8 个（eɪ aɪ ɔɪ əʊ aʊ ɪə eə ʊə）、
        清浊成对辅音 10 对（p/b t/d k/g f/v s/z θ/ð ʃ/ʒ tʃ/dʒ tr/dr ts/dz）与其他辅音 8 个（m n ŋ h l r w j）。
        每个音标配 2 个带音标标注的例词与一句发音要点，点击音标可放大查看；另附清浊对齐排布与 ɪ vs iː、æ vs e、θ vs s 易混音对比卡，可按 A4 打印成发音墙贴。
      </p>
      <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 no-print">
        <TriangleAlert class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed text-foreground">
          音标口径为英式 DJ（Jones）体系 48 音标，例词按英式发音标注（如 go /ɡəʊ/、near /nɪə(r)/，(r) 仅在连读时读出）；
          美式发音（如 go /ɡoʊ/、r 音节卷舌）差异见下方说明，具体读音以权威词典为准。
        </p>
      </div>
    </div>

    <!-- 主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：分类 + 易混音 -->
      <div class="space-y-6 no-print">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Search class="w-5 h-5 mr-2 text-primary" /> 分类浏览
          </h2>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="tab in CATEGORY_TABS"
              :key="tab.id"
              @click="activeCat = tab.id"
              class="px-2 py-2 rounded-lg border text-xs font-medium transition text-left"
              :class="activeCat === tab.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
            >
              {{ tab.label }}
              <span class="opacity-70 ml-1">{{ tab.count }}</span>
            </button>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            元音 20 = 单元音 12（长音 5：iː ɑː ɔː uː ɜː；短音 7：ɪ e æ ʌ ɒ ʊ ə）+ 双元音 8；
            辅音 28 = 清浊成对 10 对（20 个）+ 其他 8 个。总数 48 由词表实时统计。
          </p>
          <div class="border-t border-border pt-3">
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">操作</p>
            <button
              @click="printCard"
              class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:border-primary/40 transition flex items-center justify-center gap-2"
            >
              <Printer class="w-4 h-4 text-primary" /> A4 打印发音墙贴
            </button>
          </div>
        </div>

        <!-- 易混音对比 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h3 class="text-sm font-semibold text-foreground flex items-center">
            <Lightbulb class="w-4 h-4 mr-2 text-primary" /> 易混音对比卡
          </h3>
          <div
            v-for="pair in CONFUSABLE_PAIRS"
            :key="pair.title"
            class="bg-muted/50 rounded-xl p-4"
          >
            <p class="font-semibold text-foreground text-sm mb-1">{{ pair.title }}</p>
            <p class="text-xs text-muted-foreground leading-relaxed">{{ pair.tip }}</p>
            <p class="text-xs text-foreground font-mono mt-1.5">{{ pair.words }}</p>
          </div>
        </div>
      </div>

      <!-- 右侧：音标网格 + 选中详情 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
            <h2 class="text-lg font-semibold flex items-center">
              <Ear class="w-5 h-5 mr-2 text-primary" /> {{ activeCatLabel }}
            </h2>
            <span class="text-xs text-muted-foreground">点击音标查看例词与发音要点</span>
          </div>

          <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 print-grid">
            <button
              v-for="p in filteredPhonetics"
              :key="p.ipa + p.cat"
              @click="selectedIpa = p.ipa"
              class="rounded-xl border px-1 py-3 transition text-center"
              :class="selectedIpa === p.ipa ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary/50 hover:bg-primary/5'"
            >
              <p class="text-xl font-bold font-mono leading-tight">{{ p.ipa }}</p>
              <p class="text-[10px] opacity-70 mt-1 truncate px-1" :title="p.word1">{{ p.word1 }}</p>
            </button>
          </div>
          <p v-if="filteredPhonetics.length === 0" class="text-xs text-muted-foreground text-center py-4">
            该分类暂无音标。
          </p>
        </div>

        <!-- 选中音标放大卡 -->
        <div v-if="selected" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-4">
              <span class="text-5xl font-bold text-primary font-mono">{{ selected.ipa }}</span>
              <div>
                <p class="text-sm font-semibold text-foreground">{{ categoryLabelOf(selected.cat) }}</p>
                <p class="text-xs text-muted-foreground mt-0.5">发音要点</p>
              </div>
            </div>
            <button @click="selectedIpa = null" class="text-xs text-muted-foreground hover:text-foreground no-print">收起</button>
          </div>
          <div class="bg-muted/50 rounded-xl p-4">
            <p class="text-sm text-foreground leading-relaxed">{{ selected.tip }}</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-sm font-semibold text-foreground font-mono">{{ selected.word1 }}</p>
              <p class="text-xs text-muted-foreground font-mono mt-0.5">{{ selected.ipa1 }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">{{ selected.zh1 }}</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-sm font-semibold text-foreground font-mono">{{ selected.word2 }}</p>
              <p class="text-xs text-muted-foreground font-mono mt-0.5">{{ selected.ipa2 }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">{{ selected.zh2 }}</p>
            </div>
          </div>
          <p v-if="selected.note" class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>{{ selected.note }}</span>
          </p>
        </div>

        <!-- 清浊成对排布 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h3 class="text-sm font-semibold text-foreground flex items-center">
            <Volume2 class="w-4 h-4 mr-2 text-primary" /> 清浊成对辅音（10 对）· 上清下浊，声带振动与否是唯一区别
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">组</th>
                  <th class="py-2 pr-3 font-medium">清辅音（声带不振动）</th>
                  <th class="py-2 pr-3 font-medium">浊辅音（声带振动）</th>
                  <th class="py-2 pr-3 font-medium">发音方式</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="pair in PAIRED_CONSONANTS"
                  :key="pair.n"
                  class="border-b border-border/50"
                >
                  <td class="py-2 pr-3 text-xs text-muted-foreground">{{ pair.n }}</td>
                  <td class="py-2 pr-3">
                    <button @click="selectByIpa(pair.voiceless.ipa)" class="font-mono font-bold text-foreground text-base hover:text-primary transition">{{ pair.voiceless.ipa }}</button>
                    <span class="ml-2 text-xs text-muted-foreground font-mono">{{ pair.voiceless.word1 }}</span>
                  </td>
                  <td class="py-2 pr-3">
                    <button @click="selectByIpa(pair.voiced.ipa)" class="font-mono font-bold text-foreground text-base hover:text-primary transition">{{ pair.voiced.ipa }}</button>
                    <span class="ml-2 text-xs text-muted-foreground font-mono">{{ pair.voiced.word1 }}</span>
                  </td>
                  <td class="py-2 text-xs text-muted-foreground">{{ pair.manner }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            判断清浊的小技巧：手指按住喉咙发音，能感到振动的是浊辅音（如 /b/），没有振动的是清辅音（如 /p/）；
            清浊成对在发音部位与方法上完全相同，只是声带振动不同。tr/dr、ts/dz 两对是 DJ 音标体系特有的划分（KK 音标不单列）。
          </p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-8 no-print" open>
      <summary class="text-xl font-bold text-foreground cursor-pointer select-none list-none flex items-center gap-2">
        <span class="text-primary">#</span> 英语 48 音标表：体系说明与常见问题
      </summary>
      <div class="mt-4 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          国际音标（IPA）是记录语音的通用符号体系，但「英语到底有几个音标」取决于所选体系。国内教材广泛采用的是英式 DJ 音标体系（源自 Daniel Jones《英语发音词典》），
          共 48 个音标：元音 20 个（单元音 12 + 双元音 8）、辅音 28 个（清浊成对 10 对 + 其他 8 个）。本页按此口径整理，每个音标都给出例词与口型/舌位要点。
        </p>

        <h3 class="text-lg font-semibold text-foreground">英式 vs 美式音标差异</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><b class="text-foreground">双元音写法：</b>英式 go /ɡəʊ/、home /həʊm/，美式写作 /ɡoʊ/、/hoʊm/，是同一个音的两种标注习惯。</li>
          <li><b class="text-foreground">r 音：</b>美式为卷舌音（car /kɑːr/、near /nɪr/），英式仅在元音前读 r（car /kɑː/，连读时 near it 读出 r）。本页例词用 (r) 表示「可读可不读」。</li>
          <li><b class="text-foreground">元音数量：</b>美式 KK 体系常并入 /ə/ 与 /ʌ/、不单列 tr/dr/ts/dz，故常称 44 音标；DJ 体系为 48 音标。</li>
          <li><b class="text-foreground">ə 与 ɜː：</b>ə（schwa）只出现在非重读音节（about、banana），ɜː 是重读长元音（bird、her），两者写法相近但长短与重音不同。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground">为什么是 48 个（DJ 音标体系）？</h3>
        <p>
          DJ 体系把英语音位拆到最细：元音按长短与口型分为单元音 12 个（5 长 + 7 短）与双元音 8 个（合口双元音 5 个：eɪ aɪ ɔɪ əʊ aʊ；集中双元音 3 个：ɪə eə ʊə）；
          辅音按发音部位与清浊排列成 10 对（爆破音 p/b t/d k/g，摩擦音 f/v s/z θ/ð ʃ/ʒ，破擦音 tʃ/dʒ、tr/dr、ts/dz），
          再加上 8 个不成对的响辅音（鼻音 m n ŋ、滑音 w j、边音 l、齿间音 h 与 r）。10×2 + 8 + 20 = 48。
        </p>

        <h3 class="text-lg font-semibold text-foreground">自然拼读与音标的关系</h3>
        <p>
          自然拼读（Phonics）教的是「字母组合 → 常见读音」的对应规律，能覆盖约 80% 的常见词，适合儿童母语式启蒙；
          音标则是精确注音工具，任何单词都能唯一标注，适合查生词与纠音。两者不冲突：拼读解决「见词能读」的默认规则，
          音标解决「不规则词与精确发音」。常见词拼读优先，生难词查音标，是更实用的组合策略。
        </p>

        <h3 class="text-lg font-semibold text-foreground">常见问题 (FAQ)</h3>
        <div class="space-y-3">
          <div>
            <p class="font-semibold text-foreground">/ə/ 和 /ɜː/ 有什么区别？</p>
            <p>发音部位相近（舌位居中），区别在长短与重音：/ə/ 短促模糊，只出现在非重读音节（about /əˈbaʊt/ 的第一个音）；/ɜː/ 是重读长元音，舌位略低更紧张（bird /bɜːd/、her /hɜː/）。</p>
          </div>
          <div>
            <p class="font-semibold text-foreground">θ / ð 怎么发？和 s / z 差在哪？</p>
            <p>θ、ð 是齿间音：舌尖轻触上齿背让气流摩擦通过（think、this），不振动声带是 θ，振动是 ð；s、z 则是舌尖接近上齿龈。中文没有齿间音，初学常把 think 读成 sink——对着镜子检查舌尖是否伸到上下齿之间。</p>
          </div>
          <div>
            <p class="font-semibold text-foreground">tr/dr、ts/dz 算不算独立音标？</p>
            <p>DJ 体系（尤其国内教材）把 tr、dr、ts、dz 单列，凑成辅音 28 个；当代 IPA 更严格的分析把它们视为辅音连缀（t+r、t+s）。按体系学即可，发音上注意 ts/dz 不加卷舌、tr/dr 圆唇送气。</p>
          </div>
          <div>
            <p class="font-semibold text-foreground">音标数据以什么为准？</p>
            <p>48 音标清单按 IPA 英式 DJ 口径与国内主流教材音标表两源交叉核对整理；例词读音以剑桥/牛津学习者词典实际标注为准，个别词英美读音不同已用 (r) 等标注说明。</p>
          </div>
        </div>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :currentToolId="'phonetic-chart'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Ear, Search, Printer, Lightbulb, Volume2, Info, TriangleAlert
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '英语48音标表 - 国际音标发音大全（元音20+辅音28，例词+口型要点）',
  description: '在线英语48音标表：DJ音标体系48个音标全览，单元音12、双元音8、清浊成对辅音10对与其他辅音8，每个音标配2个例词与口型舌位要点，支持点选放大、清浊对齐排布、易混音对比与A4打印',
  keywords: '48个音标表,国际音标发音,英语音标,元音辅音,清浊辅音,音标口型',
  author: '有条工具',
  ogTitle: '英语48音标表 - 国际音标发音大全 | 有条工具',
  ogDescription: '48 个音标：元音 20 + 辅音 28，例词、口型舌位要点、清浊对齐排布与易混音对比。',
  ogUrl: 'https://www.util.cn/tools/phonetic-chart',
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
          name: '英语48音标表',
          url: 'https://www.util.cn/tools/phonetic-chart',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'DJ 音标体系 48 音标：元音 20 + 辅音 28',
            '每个音标 2 个带音标标注例词',
            '口型/舌位发音要点一句话',
            '分类浏览：单元音/双元音/清辅音/浊辅音/其他',
            '点选音标放大卡',
            '清浊成对辅音 10 对对齐排布',
            '易混音对比卡（ɪ vs iː、æ vs e、θ vs s）',
            'A4 打印发音墙贴'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '英语48音标表', item: 'https://www.util.cn/tools/phonetic-chart/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '/ə/ 和 /ɜː/ 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '发音部位相近，区别在长短与重音：/ə/ 短促模糊，只出现在非重读音节（about）；/ɜː/ 是重读长元音（bird、her），舌位略低更紧张。' }
            },
            {
              '@type': 'Question',
              name: 'θ / ð 怎么发？和 s / z 差在哪？',
              acceptedAnswer: { '@type': 'Answer', text: 'θ、ð 是齿间音：舌尖轻触上齿背让气流摩擦通过，θ 不振动声带、ð 振动；s、z 舌尖接近上齿龈。中文没有齿间音，注意 think 不要读成 sink。' }
            },
            {
              '@type': 'Question',
              name: 'tr/dr、ts/dz 算不算独立音标？',
              acceptedAnswer: { '@type': 'Answer', text: 'DJ 体系（尤其国内教材）把它们单列凑成辅音 28 个；当代 IPA 分析多视为辅音连缀（t+r、t+s）。按体系学即可，发音注意 ts/dz 不卷舌、tr/dr 圆唇送气。' }
            },
            {
              '@type': 'Question',
              name: '英语为什么是 48 个音标？',
              acceptedAnswer: { '@type': 'Answer', text: '48 音标是英式 DJ 音标体系的口径：元音 20（单元音 12 + 双元音 8）+ 辅音 28（清浊成对 10 对 + 其他 8 个）。美式 KK 体系划分不同，常称 44 音标。' }
            }
          ]
        }
      ]
    })
  }]
})

// ===== DATA-BEGIN（纯逻辑与数据，可独立单测） =====
// 数据口径：英式 DJ 音标体系 48 音标（IPA 口径两源交叉核对）。
// 元音 20：单元音 12（长 5 + 短 7）+ 双元音 8；辅音 28：清浊成对 10 对 + 其他 8。
// cat：unit 单元音 / diph 双元音 / voiceless 清辅音 / voiced 浊辅音 / other 其他；
// pair：成对辅音序号 1-10（清浊各标同一序号），不成对为 0。
const PHONETICS = [
  // —— 单元音 12 ——
  { ipa: 'iː', cat: 'unit', pair: 0, tip: '舌尖抵下齿，嘴角向两侧绷开如微笑，舌面高抬，音要拉长。', word1: 'sea', ipa1: '/siː/', zh1: '海', word2: 'meet', ipa2: '/miːt/', zh2: '遇见', note: '美式同音；注意与短音 /ɪ/ 区分长短与紧张度。' },
  { ipa: 'ɪ', cat: 'unit', pair: 0, tip: '口型比 iː 松半开，舌位略低靠前，短促放松，不拉长。', word1: 'sit', ipa1: '/sɪt/', zh1: '坐', word2: 'big', ipa2: '/bɪɡ/', zh2: '大的', note: '' },
  { ipa: 'e', cat: 'unit', pair: 0, tip: '口半开，嘴角略向两侧，舌前部稍抬，短促清晰（旧教材也写作 /ɛ/）。', word1: 'bed', ipa1: '/bed/', zh1: '床', word2: 'get', ipa2: '/ɡet/', zh2: '得到', note: '' },
  { ipa: 'æ', cat: 'unit', pair: 0, tip: '口张大如「啊」，但嘴角向左右咧开，舌前部压低，短促。', word1: 'cat', ipa1: '/kæt/', zh1: '猫', word2: 'map', ipa2: '/mæp/', zh2: '地图', note: '中文没有这个音，注意与 /e/ 区分开口度。' },
  { ipa: 'ɑː', cat: 'unit', pair: 0, tip: '口大开，舌身压低后缩，喉部放松，音拉长（美式 r 音节需卷舌）。', word1: 'car', ipa1: '/kɑː(r)/', zh1: '汽车', word2: 'father', ipa2: '/ˈfɑːðə(r)/', zh2: '父亲', note: '' },
  { ipa: 'ɒ', cat: 'unit', pair: 0, tip: '口圆而张大，舌身低平后缩，短促（美式常并入 /ɑː/ 或 /ɔː/）。', word1: 'dog', ipa1: '/dɒɡ/', zh1: '狗', word2: 'box', ipa2: '/bɒks/', zh2: '盒子', note: '' },
  { ipa: 'ɔː', cat: 'unit', pair: 0, tip: '双唇收圆向前突出，舌后部抬高，音拉长（美式多卷舌 /ɔːr/）。', word1: 'door', ipa1: '/dɔː(r)/', zh1: '门', word2: 'ball', ipa2: '/bɔːl/', zh2: '球', note: '' },
  { ipa: 'ʊ', cat: 'unit', pair: 0, tip: '双唇收圆但不突出，舌后部略抬，短促放松。', word1: 'book', ipa1: '/bʊk/', zh1: '书', word2: 'put', ipa2: '/pʊt/', zh2: '放', note: '' },
  { ipa: 'uː', cat: 'unit', pair: 0, tip: '双唇紧圆前突如吹哨，舌后部高抬，音拉长。', word1: 'food', ipa1: '/fuːd/', zh1: '食物', word2: 'blue', ipa2: '/bluː/', zh2: '蓝色的', note: '' },
  { ipa: 'ʌ', cat: 'unit', pair: 0, tip: '口微开，舌身放松居中略低，短促（常被误读成汉语「阿」，口要更松）。', word1: 'cup', ipa1: '/kʌp/', zh1: '杯子', word2: 'sun', ipa2: '/sʌn/', zh2: '太阳', note: '美式重读位置相近。' },
  { ipa: 'ɜː', cat: 'unit', pair: 0, tip: '舌位居中略抬，双唇不圆不扁，重读长音（美式卷舌 /ɜːr/）。', word1: 'bird', ipa1: '/bɜːd/', zh1: '鸟', word2: 'her', ipa2: '/hɜː(r)/', zh2: '她（宾格）', note: '' },
  { ipa: 'ə', cat: 'unit', pair: 0, tip: '口腔完全放松，舌位居中，只出现在非重读音节，轻而短。', word1: 'about', ipa1: '/əˈbaʊt/', zh1: '关于', word2: 'banana', ipa2: '/bəˈnɑːnə/', zh2: '香蕉', note: '英语最高频音标，非重读音节大多读它。' },
  // —— 双元音 8（合口 5 + 集中 3）——
  { ipa: 'eɪ', cat: 'diph', pair: 0, tip: '从 /e/ 滑向 /ɪ/：前音清晰响亮，后音短促模糊，口型由半开收小。', word1: 'day', ipa1: '/deɪ/', zh1: '天', word2: 'make', ipa2: '/meɪk/', zh2: '制作', note: '' },
  { ipa: 'aɪ', cat: 'diph', pair: 0, tip: '从 /ɑː/ 滑向 /ɪ/：起点口大，终点口小，如「爱」但口型滑动明显。', word1: 'time', ipa1: '/taɪm/', zh1: '时间', word2: 'five', ipa2: '/faɪv/', zh2: '五', note: '' },
  { ipa: 'ɔɪ', cat: 'diph', pair: 0, tip: '从 /ɔː/ 滑向 /ɪ/：先圆唇后展唇，如「哦伊」快速连读。', word1: 'boy', ipa1: '/bɔɪ/', zh1: '男孩', word2: 'toy', ipa2: '/tɔɪ/', zh2: '玩具', note: '' },
  { ipa: 'əʊ', cat: 'diph', pair: 0, tip: '从 /ə/ 滑向 /ʊ/：起点轻圆，终点圆唇收小（美式写作 /oʊ/）。', word1: 'go', ipa1: '/ɡəʊ/', zh1: '去', word2: 'home', ipa2: '/həʊm/', zh2: '家', note: '英式标 əʊ、美式标 oʊ，为同一音的不同标注。' },
  { ipa: 'aʊ', cat: 'diph', pair: 0, tip: '从 /ɑː/ 滑向 /ʊ/：口由大圆到小圆，如「澳」但滑动完整。', word1: 'now', ipa1: '/naʊ/', zh1: '现在', word2: 'house', ipa2: '/haʊs/', zh2: '房子', note: '' },
  { ipa: 'ɪə', cat: 'diph', pair: 0, tip: '从 /ɪ/ 滑向 /ə/：前短后轻，靠向中央（美式多为 /ɪr/ 卷舌）。', word1: 'near', ipa1: '/nɪə(r)/', zh1: '近的', word2: 'ear', ipa2: '/ɪə(r)/', zh2: '耳朵', note: '(r) 仅在连读时读出。' },
  { ipa: 'eə', cat: 'diph', pair: 0, tip: '从 /e/ 滑向 /ə/：口半开保持，尾音滑向中央轻收。', word1: 'hair', ipa1: '/heə(r)/', zh1: '头发', word2: 'care', ipa2: '/keə(r)/', zh2: '关心', note: '' },
  { ipa: 'ʊə', cat: 'diph', pair: 0, tip: '从 /ʊ/ 滑向 /ə/：先圆唇短促，再滑向中央；现代口语常并入 /ɔː/。', word1: 'tour', ipa1: '/tʊə(r)/', zh1: '旅行', word2: 'sure', ipa2: '/ʃʊə(r)/', zh2: '确定的', note: '' },
  // —— 清辅音 10（成对）——
  { ipa: 'p', cat: 'voiceless', pair: 1, tip: '双唇紧闭憋气后突然放开送气，声带不振动（词首强送气）。', word1: 'pen', ipa1: '/pen/', zh1: '钢笔', word2: 'map', ipa2: '/mæp/', zh2: '地图', note: '与 /b/ 仅声带振动不同。' },
  { ipa: 't', cat: 'voiceless', pair: 2, tip: '舌尖抵上齿龈憋气后弹开送气，声带不振动。', word1: 'ten', ipa1: '/ten/', zh1: '十', word2: 'sit', ipa2: '/sɪt/', zh2: '坐', note: '' },
  { ipa: 'k', cat: 'voiceless', pair: 3, tip: '舌后部抵软腭憋气后放开送气，声带不振动。', word1: 'key', ipa1: '/kiː/', zh1: '钥匙', word2: 'book', ipa2: '/bʊk/', zh2: '书', note: '' },
  { ipa: 'f', cat: 'voiceless', pair: 4, tip: '上齿轻咬下唇，气流摩擦而出，声带不振动。', word1: 'five', ipa1: '/faɪv/', zh1: '五', word2: 'life', ipa2: '/laɪf/', zh2: '生活', note: '' },
  { ipa: 's', cat: 'voiceless', pair: 5, tip: '舌尖接近上齿龈留细缝，气流摩擦成丝，声带不振动。', word1: 'sun', ipa1: '/sʌn/', zh1: '太阳', word2: 'miss', ipa2: '/mɪs/', zh2: '错过', note: '' },
  { ipa: 'θ', cat: 'voiceless', pair: 6, tip: '舌尖轻触上齿背，气流从齿间摩擦而出，声带不振动。', word1: 'think', ipa1: '/θɪŋk/', zh1: '思考', word2: 'mouth', ipa2: '/maʊθ/', zh2: '嘴', note: '中文没有齿间音，勿读成 /s/。' },
  { ipa: 'ʃ', cat: 'voiceless', pair: 7, tip: '舌尖抬向硬腭前部，双唇略前突，气流摩擦（如「嘘」但更用力）。', word1: 'she', ipa1: '/ʃiː/', zh1: '她', word2: 'fish', ipa2: '/fɪʃ/', zh2: '鱼', note: '' },
  { ipa: 'tʃ', cat: 'voiceless', pair: 8, tip: '先堵气如 /t/ 再摩擦放开如 /ʃ/，破擦而出，声带不振动。', word1: 'chair', ipa1: '/tʃeə(r)/', zh1: '椅子', word2: 'each', ipa2: '/iːtʃ/', zh2: '每个', note: '' },
  { ipa: 'tr', cat: 'voiceless', pair: 9, tip: '舌身卷起贴硬腭，圆唇送气弹开，近似「串」的声母（DJ 体系单列）。', word1: 'tree', ipa1: '/triː/', zh1: '树', word2: 'try', ipa2: '/traɪ/', zh2: '尝试', note: '当代 IPA 多视为 /t/+/r/ 连缀。' },
  { ipa: 'ts', cat: 'voiceless', pair: 10, tip: '舌尖抵上齿龈发 /t/ 后接 /s/ 摩擦，不卷舌（DJ 体系单列）。', word1: 'cats', ipa1: '/kæts/', zh1: '猫（复数）', word2: 'meets', ipa2: '/miːts/', zh2: '遇见（三单）', note: '注意与汉语「吃」的卷舌声母区分。' },
  // —— 浊辅音 10（成对）——
  { ipa: 'b', cat: 'voiced', pair: 1, tip: '与 /p/ 部位相同：双唇闭塞后放开，但声带振动、送气弱。', word1: 'bag', ipa1: '/bæɡ/', zh1: '包', word2: 'cab', ipa2: '/kæb/', zh2: '出租车', note: '' },
  { ipa: 'd', cat: 'voiced', pair: 2, tip: '与 /t/ 部位相同：舌尖抵上齿龈弹开，声带振动。', word1: 'dog', ipa1: '/dɒɡ/', zh1: '狗', word2: 'read', ipa2: '/riːd/', zh2: '读', note: '' },
  { ipa: 'ɡ', cat: 'voiced', pair: 3, tip: '与 /k/ 部位相同：舌后抵软腭放开，声带振动。', word1: 'go', ipa1: '/ɡəʊ/', zh1: '去', word2: 'big', ipa2: '/bɪɡ/', zh2: '大的', note: '音标写 ɡ（U+0261）或 g 均常见。' },
  { ipa: 'v', cat: 'voiced', pair: 4, tip: '与 /f/ 部位相同：上齿咬下唇摩擦，声带振动。', word1: 'very', ipa1: '/ˈveri/', zh1: '非常', word2: 'love', ipa2: '/lʌv/', zh2: '爱', note: '' },
  { ipa: 'z', cat: 'voiced', pair: 5, tip: '与 /s/ 部位相同：齿龈摩擦，声带振动（似蜂鸣）。', word1: 'zoo', ipa1: '/zuː/', zh1: '动物园', word2: 'rose', ipa2: '/rəʊz/', zh2: '玫瑰', note: '' },
  { ipa: 'ð', cat: 'voiced', pair: 6, tip: '与 /θ/ 部位相同：舌尖触上齿背摩擦，声带振动。', word1: 'this', ipa1: '/ðɪs/', zh1: '这个', word2: 'mother', ipa2: '/ˈmʌðə(r)/', zh2: '母亲', note: '功能词（this/that/the）里几乎都是 ð。' },
  { ipa: 'ʒ', cat: 'voiced', pair: 7, tip: '与 /ʃ/ 部位相同：硬腭前部摩擦，声带振动，出现频率低。', word1: 'usually', ipa1: '/ˈjuːʒuəli/', zh1: '通常', word2: 'measure', ipa2: '/ˈmeʒə(r)/', zh2: '测量', note: '' },
  { ipa: 'dʒ', cat: 'voiced', pair: 8, tip: '与 /tʃ/ 部位相同：先堵后擦破擦而出，声带振动。', word1: 'job', ipa1: '/dʒɒb/', zh1: '工作', word2: 'page', ipa2: '/peɪdʒ/', zh2: '页', note: '' },
  { ipa: 'dr', cat: 'voiced', pair: 9, tip: '与 /tr/ 部位相同：卷舌圆唇弹开，声带振动（DJ 体系单列）。', word1: 'drive', ipa1: '/draɪv/', zh1: '驾驶', word2: 'dream', ipa2: '/driːm/', zh2: '梦想', note: '' },
  { ipa: 'dz', cat: 'voiced', pair: 10, tip: '与 /ts/ 部位相同：/t/ 接 /z/，声带振动（DJ 体系单列）。', word1: 'beds', ipa1: '/bedz/', zh1: '床（复数）', word2: 'words', ipa2: '/wɜːdz/', zh2: '单词（复数）', note: '' },
  // —— 其他 8 ——
  { ipa: 'm', cat: 'other', pair: 0, tip: '双唇闭合，气流从鼻腔泄出，声带振动（闭口鼻音）。', word1: 'moon', ipa1: '/muːn/', zh1: '月亮', word2: 'some', ipa2: '/sʌm/', zh2: '一些', note: '' },
  { ipa: 'n', cat: 'other', pair: 0, tip: '舌尖抵上齿龈，气流从鼻腔泄出，声带振动。', word1: 'nose', ipa1: '/nəʊz/', zh1: '鼻子', word2: 'nine', ipa2: '/naɪn/', zh2: '九', note: '' },
  { ipa: 'ŋ', cat: 'other', pair: 0, tip: '舌后部抵软腭，气流从鼻腔泄出，声带振动（汉语方言「嗯」近似）。', word1: 'sing', ipa1: '/sɪŋ/', zh1: '唱歌', word2: 'long', ipa2: '/lɒŋ/', zh2: '长的', note: '只出现在元音后的 k/g 组合环境。' },
  { ipa: 'h', cat: 'other', pair: 0, tip: '气流从声门轻呼而出如哈气，声带不振动，口型随后续元音变化。', word1: 'hat', ipa1: '/hæt/', zh1: '帽子', word2: 'hand', ipa2: '/hænd/', zh2: '手', note: '' },
  { ipa: 'l', cat: 'other', pair: 0, tip: '舌尖抵上齿龈让气流从两侧通过；元音后（如 feel）舌后部抬起的「暗 L」。', word1: 'leg', ipa1: '/leɡ/', zh1: '腿', word2: 'feel', ipa2: '/fiːl/', zh2: '感觉', note: '元音前是「明 L」，元音后偏含糊。' },
  { ipa: 'r', cat: 'other', pair: 0, tip: '舌尖卷起靠近硬腭但不接触，双唇略圆，声带振动（英式不碰触）。', word1: 'red', ipa1: '/red/', zh1: '红色的', word2: 'rain', ipa2: '/reɪn/', zh2: '雨', note: '美式 r 卷舌更明显且元音后保留。' },
  { ipa: 'w', cat: 'other', pair: 0, tip: '双唇收圆很快滑向后面的元音，声带振动（半元音）。', word1: 'we', ipa1: '/wiː/', zh1: '我们', word2: 'window', ipa2: '/ˈwɪndəʊ/', zh2: '窗户', note: '' },
  { ipa: 'j', cat: 'other', pair: 0, tip: '舌前部抬向硬腭很快滑向元音，声带振动（半元音，如「爷」的声母）。', word1: 'yes', ipa1: '/jes/', zh1: '是的', word2: 'year', ipa2: '/jɪə(r)/', zh2: '年', note: '音标 j 不等于字母 j（字母 j 读 /dʒ/）。' }
]

// 分类元信息
const CATEGORY_META = {
  unit: { label: '单元音' },
  diph: { label: '双元音' },
  voiceless: { label: '清辅音' },
  voiced: { label: '浊辅音' },
  other: { label: '其他辅音' }
}
const CATEGORY_ORDER = ['unit', 'diph', 'voiceless', 'voiced', 'other']

function categoryLabelOf(cat) {
  return (CATEGORY_META[cat] && CATEGORY_META[cat].label) || cat
}

// 清浊成对：pair 序号 1-10，每对恰含一个清辅音与一个浊辅音
function buildPairs(rows) {
  const byPair = {}
  rows.forEach((p) => {
    if (p.pair > 0) {
      if (!byPair[p.pair]) byPair[p.pair] = {}
      byPair[p.pair][p.cat] = p
    }
  })
  const MANNER = {
    1: '双唇爆破音', 2: '齿龈爆破音', 3: '软腭爆破音', 4: '唇齿摩擦音', 5: '齿龈摩擦音',
    6: '齿间摩擦音', 7: '硬腭前摩擦音', 8: '齿龈后破擦音', 9: '卷舌破擦连缀', 10: '齿龈破擦连缀'
  }
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    .filter((n) => byPair[n] && byPair[n].voiceless && byPair[n].voiced)
    .map((n) => ({ n, voiceless: byPair[n].voiceless, voiced: byPair[n].voiced, manner: MANNER[n] }))
}

// 易混音对比卡
const CONFUSABLE_PAIRS = [
  {
    title: 'ɪ vs iː（短音 vs 长音）',
    tip: '不只是长短：iː 嘴角绷紧如微笑（bead），ɪ 口型放松半开（bid）。先把紧张度分开，再谈长短；ship /ʃɪp/ 与 sheep /ʃiːp/ 一松一紧，别都读成「一」。',
    words: 'ship /ʃɪp/ 船 ↔ sheep /ʃiːp/ 羊 · bit /bɪt/ ↔ beat /biːt/'
  },
  {
    title: 'æ vs e（口大 vs 口小）',
    tip: 'e 口半开（bed），æ 口张大且嘴角向两侧咧开（bad）。中文没有 æ，初学易把 bad 读成 bed——对镜子看开口度：bad 能放进两指，bed 约一指。',
    words: 'bad /bæd/ 坏 ↔ bed /bed/ 床 · sad /sæd/ ↔ said /sed/'
  },
  {
    title: 'θ vs s（齿间 vs 齿龈）',
    tip: 'θ 舌尖要伸到上下齿之间轻触上齿背（think），s 舌尖接近上齿龈不露齿间缝（sink）。对着镜子确认舌尖位置，think 不是「兴克」，thanks 也不是「三克斯」。',
    words: 'think /θɪŋk/ ↔ sink /sɪŋk/ · mouse /maʊs/ ↔ mouth /maʊθ/'
  }
]
// ===== DATA-END =====

// ---------- UI 常量 ----------
const CATEGORY_TABS = [
  { id: 'all', label: '全部' },
  ...CATEGORY_ORDER.map((c) => ({ id: c, label: CATEGORY_META[c].label }))
]
CATEGORY_TABS.forEach((tab) => {
  tab.count = tab.id === 'all' ? PHONETICS.length : PHONETICS.filter((p) => p.cat === tab.id).length
})
const PAIRED_CONSONANTS = buildPairs(PHONETICS)

// ---------- 响应式状态 ----------
const activeCat = ref('all')
const selectedIpa = ref(null)

// ---------- 派生 ----------
const filteredPhonetics = computed(() => (activeCat.value === 'all' ? PHONETICS : PHONETICS.filter((p) => p.cat === activeCat.value)))
const activeCatLabel = computed(() => {
  const tab = CATEGORY_TABS.find((t) => t.id === activeCat.value)
  return (tab && tab.label) || '音标总表'
})
const selected = computed(() => (PHONETICS.find((p) => p.ipa === selectedIpa.value) || null))

// ---------- 交互（浏览器 API 仅在回调内，SSR 安全） ----------
function selectByIpa(ipa) {
  selectedIpa.value = ipa
  trackEvent('工具结果', '音标点选', 'phonetic-chart')
}

function printCard() {
  window.print()
}

onMounted(() => {
  addRecentTool('phonetic-chart')
})
</script>

<style scoped>
@media print {
  @page {
    size: A4 landscape;
    margin: 10mm;
  }

  .no-print {
    display: none !important;
  }

  .print-grid {
    grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
  }
}
</style>
