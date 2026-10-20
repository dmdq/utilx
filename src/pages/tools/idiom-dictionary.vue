<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Library class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">成语词典接龙</h1>
          <p class="text-sm text-muted-foreground mt-1">高频成语查询释义 + 首尾字接龙 + 随机挑战</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        内置 {{ idiomCount }} 条高频成语（非全量），每条附拼音与简明释义。支持按成语、拼音或释义关键字查询；
        成语接龙按「尾字接首字」自动给出可选路径，也可随机起头；随机挑战可看释义猜成语、看尾字接龙；
        喜欢的成语可加入收藏并在本机浏览器暂存，随时用学习卡片自测。全部数据与计算都在本地完成。
      </p>
    </div>

    <!-- 选项卡 -->
    <div class="flex flex-wrap gap-1.5 mb-6">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        @click="activeTab = tab.key"
        :class="activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
        class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
        <span v-if="tab.key === 'favorites' && favorites.length > 0" class="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-[10px]">{{ favorites.length }}</span>
      </button>
    </div>

    <!-- ① 查询 -->
    <div v-show="activeTab === 'query'" class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-4">
        <Search class="w-5 h-5 mr-2 text-primary" /> 成语查询
      </h2>
      <input
        v-model="searchKeyword"
        type="text"
        class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="输入成语、字或拼音，如：守株待兔 / 兔 / shou zhu"
      />
      <p class="text-xs text-muted-foreground mt-2">
        {{ searchKeyword.trim() ? '共匹配 ' + searchResults.length + ' 条' : '输入关键词开始检索，留空时展示随机 20 条' }}
      </p>
      <div class="mt-4 space-y-2">
        <div
          v-for="it in displayResults"
          :key="it.idiom"
          class="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border/50"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-foreground">
              {{ it.idiom }}
              <span class="ml-2 font-normal text-xs text-muted-foreground">{{ it.pinyin }}</span>
            </p>
            <p class="text-xs text-muted-foreground mt-1 leading-relaxed">{{ it.meaning }}</p>
          </div>
          <button
            @click="toggleFavorite(it)"
            :class="isFavorite(it.idiom) ? 'text-yellow-500' : 'text-muted-foreground hover:text-foreground'"
            class="p-1.5 transition-colors"
            :title="isFavorite(it.idiom) ? '取消收藏' : '收藏'"
          >
            <Star class="w-4 h-4" :fill="isFavorite(it.idiom) ? 'currentColor' : 'none'" />
          </button>
          <button
            @click="startChainFrom(it)"
            class="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors flex-shrink-0"
          >接龙</button>
        </div>
        <p v-if="searchResults.length === 0" class="p-6 text-center text-sm text-muted-foreground">
          没有匹配的成语，试试更短或不同的关键词（本库仅收录 {{ idiomCount }} 条高频成语）
        </p>
      </div>
    </div>

    <!-- ② 成语接龙 -->
    <div v-show="activeTab === 'chain'" class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-4">
        <Shuffle class="w-5 h-5 mr-2 text-primary" /> 成语接龙
      </h2>

      <div v-if="!chainCurrent" class="flex flex-wrap gap-2 items-center mb-2">
        <input
          v-model="chainInput"
          type="text"
          class="flex-1 min-w-[200px] px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="输入一个库内成语作为起点，如：一心一意"
        />
        <button @click="startChainFromInput" class="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all">开始接龙</button>
        <button @click="randomChainStart" class="flex items-center gap-1.5 px-4 py-2.5 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-sm font-medium transition-all">
          <Dice5 class="w-4 h-4" /> 随机起头
        </button>
      </div>
      <p v-if="chainError" class="text-xs text-red-500 mb-2">{{ chainError }}</p>

      <template v-if="chainCurrent">
        <!-- 当前成语卡片 -->
        <div class="p-4 bg-primary/10 rounded-lg mb-4">
          <p class="text-xl font-bold text-foreground">
            {{ chainCurrent.idiom }}
            <span class="text-sm font-normal text-muted-foreground ml-2">{{ chainCurrent.pinyin }}</span>
          </p>
          <p class="text-xs text-muted-foreground mt-1 leading-relaxed">{{ chainCurrent.meaning }}</p>
          <p class="text-sm text-foreground mt-2">
            下一个请以
            <span class="px-1.5 py-0.5 bg-primary text-primary-foreground rounded font-bold">{{ chainCurrent.last }}</span>
            字开头：
          </p>
        </div>

        <!-- 可选路径 -->
        <div v-if="chainCandidates.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
          <button
            v-for="c in chainCandidates"
            :key="c.idiom"
            @click="stepChain(c)"
            class="text-left p-3 bg-muted/50 hover:bg-accent rounded-lg border border-border/50 transition-colors"
          >
            <p class="text-sm font-semibold text-foreground">{{ c.idiom }}</p>
            <p class="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{{ c.meaning }}</p>
          </button>
        </div>
        <div v-else class="p-4 bg-muted/50 rounded-lg mb-4 text-sm text-muted-foreground">
          「{{ chainCurrent.last }}」字开头暂无候选成语（非全量词库所致），请重新开始换一个起点。
        </div>

        <!-- 接龙轨迹 -->
        <div class="p-4 bg-muted/30 border border-border/50 rounded-lg mb-4">
          <p class="text-xs text-muted-foreground mb-2">本条接龙共 {{ chainHistory.length }} 环</p>
          <div class="flex flex-wrap items-center gap-1.5">
            <template v-for="(h, i) in chainHistory" :key="h.idiom">
              <span class="px-2 py-1 bg-card border border-border rounded text-xs text-foreground">{{ h.idiom }}</span>
              <ArrowRight v-if="i < chainHistory.length - 1" class="w-3 h-3 text-muted-foreground" />
            </template>
          </div>
        </div>

        <div class="flex gap-2">
          <button @click="resetChain" class="flex items-center gap-1.5 px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-sm font-medium transition-all">
            <RotateCcw class="w-4 h-4" /> 重新开始
          </button>
          <button @click="randomChainStart" class="flex items-center gap-1.5 px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-sm font-medium transition-all">
            <Dice5 class="w-4 h-4" /> 换一个随机起点
          </button>
        </div>
      </template>
    </div>

    <!-- ③ 随机挑战 -->
    <div v-show="activeTab === 'challenge'" class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-4">
        <Trophy class="w-5 h-5 mr-2 text-primary" /> 随机成语挑战
      </h2>

      <div class="flex flex-wrap items-center gap-2 mb-4">
        <button
          @click="startMeaningChallenge"
          :class="challengeType === 'meaning' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
          class="px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
        >看释义猜成语</button>
        <button
          @click="startCharChallenge"
          :class="challengeType === 'char' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
          class="px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
        >按尾字接龙</button>
        <span class="ml-auto text-xs text-muted-foreground">得分 {{ scoreRight }} / {{ scoreTotal }}</span>
      </div>

      <div v-if="!challengeItem" class="p-8 text-center text-sm text-muted-foreground">
        选择一种玩法开始挑战：释义猜成语考验积累，按尾字接龙考验反应。
      </div>

      <template v-else>
        <div class="p-4 bg-muted/50 rounded-lg mb-3">
          <p v-if="challengeType === 'meaning'" class="text-sm text-foreground leading-relaxed">
            释义：{{ challengeItem.meaning }}
            <span class="text-xs text-muted-foreground">（{{ challengeItem.idiom.length }} 个字，首字「{{ challengeItem.first }}」）</span>
          </p>
          <p v-else class="text-sm text-foreground">
            请接「{{ challengeItem.idiom }}」的尾字——写出以
            <span class="px-1.5 py-0.5 bg-primary text-primary-foreground rounded font-bold">{{ challengeItem.last }}</span>
            字开头的库内成语（点击可揭晓答案）
          </p>
        </div>

        <div class="flex gap-2 mb-3">
          <input
            v-model="challengeInput"
            type="text"
            class="flex-1 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="输入你的答案"
            @keyup.enter="submitChallenge"
          />
          <button @click="submitChallenge" class="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all">提交</button>
        </div>

        <p v-if="challengeResult" :class="challengeResult.ok ? 'text-green-600 dark:text-green-400' : 'text-red-500'" class="text-sm mb-3">
          {{ challengeResult.text }}
        </p>

        <div class="flex gap-2">
          <button @click="revealChallengeAnswer" class="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-sm font-medium transition-all">查看答案</button>
          <button @click="nextChallenge" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all">
            <Sparkles class="w-4 h-4" /> 下一题
          </button>
        </div>
        <p v-if="showAnswer" class="mt-3 text-sm text-foreground">
          答案：{{ challengeItem.idiom }}（{{ challengeItem.pinyin }}）—— {{ challengeItem.meaning }}
        </p>
      </template>
    </div>

    <!-- ④ 收藏与学习卡片 -->
    <div v-show="activeTab === 'favorites'" class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-2">
        <Heart class="w-5 h-5 mr-2 text-primary" /> 我的收藏（学习卡片）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">收藏仅保存在本机浏览器，不上传服务器；点卡片可翻面查看释义进行自测。</p>

      <div v-if="favoriteItems.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="f in favoriteItems"
          :key="f.idiom"
          @click="toggleReveal(f.idiom)"
          class="cursor-pointer p-4 bg-muted/50 hover:bg-accent rounded-lg border border-border/50 transition-colors select-none"
        >
          <p class="text-base font-bold text-foreground">{{ f.idiom }}</p>
          <p class="text-xs text-muted-foreground mt-0.5">{{ f.pinyin }}</p>
          <p v-if="revealedSet.includes(f.idiom)" class="text-xs text-foreground mt-2 leading-relaxed">{{ f.meaning }}</p>
          <p v-else class="text-xs text-primary mt-2">点击显示释义</p>
          <div class="mt-2 flex gap-2">
            <button @click.stop="startChainFrom(f)" class="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20">接龙</button>
            <button @click.stop="toggleFavorite(f)" class="px-2 py-1 text-xs bg-muted text-muted-foreground hover:bg-muted/70 rounded-md">取消收藏</button>
          </div>
        </div>
      </div>
      <div v-else class="p-8 text-center text-sm text-muted-foreground">
        还没有收藏。去「成语查询」里点 ★ 收藏你喜欢的成语吧。
      </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>成语查询与接龙怎么玩</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            本工具内置 {{ idiomCount }} 条高频成语（非全量词典），每条包含成语本体、拼音（不标声调）与一句话释义。
            查询支持三种命中方式：按成语字面、按拼音音节（如 shou zhu）、按释义关键字（如 侥幸），方便从任何一侧切入记忆。
          </p>
          <h3 class="text-lg font-semibold text-foreground">成语接龙的规则是什么</h3>
          <p>
            通用规则是「后一个成语的首字等于前一个成语的尾字」，本工具严格按同字相接实现（如「守株待兔」只能接「兔死狐悲」这类以兔字开头的成语，不同音同字的「图」不算）。
            由于词库只收高频条目，个别生僻尾字可能无候选，此时换一个起点即可；正式比赛可自愿放宽到同音相接。
          </p>
          <h3 class="text-lg font-semibold text-foreground">怎么用接龙和学习卡片积累成语</h3>
          <p>
            接龙强迫你在「尾字」这一维度检索记忆，比单纯背诵更接近实际运用；查到一个好成语先点 ★ 收藏，
            收藏卡片默认遮住释义、点击翻面，先回想再对答案，相当于内置了一张自测闪卡。每天用「随机挑战」出 10 题，
            释义猜成语与按尾字接龙交替，积累速度会明显快于通读词典。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">接龙为什么接不上？</span>本库仅收录 {{ idiomCount }} 条高频成语，非全量词典，某些尾字（如「日」「山」之外的生僻字）没有可接条目属正常现象，可重新开始换起点。</li>
            <li><span class="text-foreground font-medium">收藏会丢吗？</span>收藏保存在当前浏览器的 localStorage，不上传服务器；清除浏览器数据或换设备会重置，重要收藏请及时记录。</li>
            <li><span class="text-foreground font-medium">拼音为什么不标声调？</span>本库拼音采用不带声调的音节，用于辅助检索与朗读定位；精确声调请以权威词典为准，释义也为一句话精简版，教学场景请核对教材。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'idiom-dictionary'" :category="'text'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Library, Search, Shuffle, Trophy, Heart, Star, Dice5, ArrowRight,
  RotateCcw, Sparkles, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '成语词典接龙 - 高频成语查询释义与首尾字接龙挑战',
  description: '在线成语词典与成语接龙工具，内置300余条高频成语的拼音与释义，支持按成语、拼音、释义查询，首尾字同字接龙自动给出可选路径，附看释义猜成语与尾字接龙随机挑战，收藏与学习卡片本机暂存',
  keywords: '成语接龙, 成语词典, 成语查询, 成语意思, 四字成语大全, 成语接龙规则',
  author: 'Util工具箱',
  ogTitle: '成语词典接龙 - 有条工具',
  ogDescription: '高频成语库查询释义，首尾字接龙与随机挑战',
  ogUrl: 'https://www.util.cn/tools/idiom-dictionary',
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
          name: '成语词典接龙',
          url: 'https://www.util.cn/tools/idiom-dictionary',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['高频成语库查询', '拼音与释义检索', '首尾字同字接龙', '可选路径展示', '看释义猜成语挑战', '收藏与学习卡片']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本工具', item: 'https://www.util.cn/text/' },
            { '@type': 'ListItem', position: 3, name: '成语词典接龙', item: 'https://www.util.cn/tools/idiom-dictionary/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '成语接龙的规则是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '后一个成语的首字等于前一个成语的尾字，本工具按同字相接实现，正式比赛可自愿放宽为同音相接。' }
            },
            {
              '@type': 'Question',
              name: '接龙为什么接不上？',
              acceptedAnswer: { '@type': 'Answer', text: '本库仅收录三百余条高频成语而非全量词典，个别尾字没有可接条目属正常现象，换一个起点即可。' }
            },
            {
              '@type': 'Question',
              name: '收藏会丢吗？',
              acceptedAnswer: { '@type': 'Answer', text: '收藏仅保存在当前浏览器 localStorage，不上传服务器；清除浏览器数据或更换设备会重置。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'idiom-dictionary')

const FAV_KEY = 'idiom-favs'

/* ==== PURE:BEGIN ==== */
const IDIOM_RAW = [
  ['一心一意', 'yi xin yi yi', '心思专一，毫不动摇'],
  ['三心二意', 'san xin er yi', '犹豫不定，用心不专'],
  ['意味深长', 'yi wei shen chang', '话语含蓄深远，耐人寻味'],
  ['意气风发', 'yi qi feng fa', '精神振奋，气概昂扬'],
  ['意想不到', 'yi xiang bu dao', '在预料之外，出乎意料'],
  ['一意孤行', 'yi yi gu xing', '不听劝告，固执地按自己的想法行事'],
  ['一诺千金', 'yi nuo qian jin', '一个承诺价值千金，形容说话极讲信用'],
  ['一鸣惊人', 'yi ming jing ren', '平时没有突出表现，一下子做出惊人成绩'],
  ['一鼓作气', 'yi gu zuo qi', '趁劲头足的时候一下子把事情做完'],
  ['一劳永逸', 'yi lao yong yi', '辛苦一次，以后就可以不再费力'],
  ['一丝不苟', 'yi si bu gou', '做事认真细致，一点儿不马虎'],
  ['一视同仁', 'yi shi tong ren', '同样看待，不分亲疏厚薄'],
  ['一举两得', 'yi ju liang de', '做一件事得到两种好处'],
  ['一帆风顺', 'yi fan feng shun', '非常顺利，毫无波折挫折'],
  ['一衣带水', 'yi yi dai shui', '仅隔一水并不遥远，形容往来方便'],
  ['一望无际', 'yi wang wu ji', '一眼看不到边，形容辽阔'],
  ['一知半解', 'yi zhi ban jie', '知道得不全面，理解得不透彻'],
  ['一见钟情', 'yi jian zhong qing', '一见面就产生深厚的感情'],
  ['一挥而就', 'yi hui er jiu', '一动笔就写成，形容才思敏捷'],
  ['一目十行', 'yi mu shi xing', '一眼看十行，形容阅读速度极快'],
  ['一日千里', 'yi ri qian li', '原形容马跑得很快，后比喻进展极快'],
  ['一本正经', 'yi ben zheng jing', '形容很规矩很庄重，有时带讽刺意味'],
  ['一五一十', 'yi wu yi shi', '叙述时清楚有序而无遗漏'],
  ['一败涂地', 'yi bai tu di', '形容失败到不可收拾的地步'],
  ['一言九鼎', 'yi yan jiu ding', '一句话分量极重，形容言语有极大的作用'],
  ['一言难尽', 'yi yan nan jin', '事情曲折复杂，不是一句话能说清楚的'],
  ['一箭双雕', 'yi jian shuang diao', '原指射箭技艺高超，现比喻做一件事达到两个目的'],
  ['一网打尽', 'yi wang da jin', '比喻全部抓住或彻底肃清'],
  ['一贫如洗', 'yi pin ru xi', '穷得像水洗过一样，形容穷得一无所有'],
  ['一表人才', 'yi biao ren cai', '形容人相貌仪表端庄出色'],
  ['一呼百应', 'yi hu bai ying', '一人呼喊百人响应，形容响应者众多'],
  ['一落千丈', 'yi luo qian zhang', '形容地位声誉境况等急剧下降'],
  ['一见如故', 'yi jian ru gu', '初次见面就像老朋友一样合得来'],
  ['一尘不染', 'yi chen bu ran', '形容非常清洁，也指品质高洁不受坏习气影响'],
  ['一成不变', 'yi cheng bu bian', '一经形成永不改变，形容守旧不变'],
  ['一往无前', 'yi wang wu qian', '无所畏惧地一直向前'],
  ['一蹴而就', 'yi cu er jiu', '迈一步就成功，比喻事情轻而易举就能完成'],
  ['一清二楚', 'yi qing er chu', '十分清楚明白'],
  ['一字千金', 'yi zi qian jin', '增删一字价值千金，形容诗文精妙价值极高'],
  ['一窍不通', 'yi qiao bu tong', '没有一窍是通的，比喻一点儿也不懂'],
  ['一蹶不振', 'yi jue bu zhen', '一摔倒就再也爬不起来，比喻受挫后再也振作不起来'],
  ['一叶知秋', 'yi ye zhi qiu', '看见一片落叶就知道秋天来临，比喻由细微迹象预见趋势'],
  ['一叶障目', 'yi ye zhang mu', '一片叶子挡在眼前就看不见泰山，比喻被局部现象迷惑看不到全局'],
  ['一石二鸟', 'yi shi er niao', '扔一颗石子打到两只鸟，比喻做一件事得到两种好处'],
  ['一飞冲天', 'yi fei chong tian', '一飞就直冲天空，比喻平时默默无闻的人突然做出惊人成绩'],
  ['四通八达', 'si tong ba da', '四面八方都能通达，形容交通极便利'],
  ['四平八稳', 'si ping ba wen', '形容说话做事稳当，也指只求不出差错缺乏进取'],
  ['四面八方', 'si mian ba fang', '各个方面或各个地方'],
  ['四分五裂', 'si fen wu lie', '形容分散、不完整、不团结'],
  ['五湖四海', 'wu hu si hai', '泛指全国各地，也指世界各地'],
  ['五花八门', 'wu hua ba men', '比喻变化多端或花样繁多'],
  ['五光十色', 'wu guang shi se', '形容色彩鲜艳，花样繁多'],
  ['五颜六色', 'wu yan liu se', '形容色彩复杂，花样繁多'],
  ['五谷丰登', 'wu gu feng deng', '年成好，粮食丰收'],
  ['五体投地', 'wu ti tou di', '两手两膝和头着地，比喻敬佩到了极点'],
  ['六神无主', 'liu shen wu zhu', '形容心慌意乱，拿不定主意'],
  ['七上八下', 'qi shang ba xia', '形容心里慌乱不安'],
  ['七嘴八舌', 'qi zui ba she', '人多口杂，你一言我一语说个不停'],
  ['七手八脚', 'qi shou ba jiao', '形容人多手杂，动作忙乱'],
  ['八仙过海', 'ba xian guo hai', '比喻各自拿出本领互相比赛'],
  ['八面玲珑', 'ba mian ling long', '形容人处世圆滑，各方面都应付得很周到'],
  ['九霄云外', 'jiu xiao yun wai', '九重天外，形容远得无影无踪'],
  ['九牛一毛', 'jiu niu yi mao', '许多牛身上的一根毛，比喻极大数量中微不足道的一点'],
  ['十全十美', 'shi quan shi mei', '十分完美，毫无欠缺'],
  ['十拿九稳', 'shi na jiu wen', '比喻很有把握'],
  ['十万火急', 'shi wan huo ji', '形容事情紧急到了极点'],
  ['百发百中', 'bai fa bai zhong', '每次都命中，形容射击准确，也比喻料事有把握'],
  ['百家争鸣', 'bai jia zheng ming', '各种学术流派自由争论的繁荣景象'],
  ['百折不挠', 'bai zhe bu nao', '无论受多少挫折都不退缩，形容意志坚强'],
  ['百依百顺', 'bai yi bai shun', '一切都由着别人，毫不违抗'],
  ['百战百胜', 'bai zhan bai sheng', '每战必胜，形容所向无敌'],
  ['百感交集', 'bai gan jiao ji', '各种感触交织在一起'],
  ['百思不解', 'bai si bu jie', '反复思索仍然不能理解'],
  ['百花齐放', 'bai hua qi fang', '比喻艺术上不同形式和风格的自由发展'],
  ['百尺竿头', 'bai chi gan tou', '比喻道行造诣虽深，仍须继续努力'],
  ['千方百计', 'qian fang bai ji', '想尽、用尽一切办法'],
  ['千军万马', 'qian jun wan ma', '形容兵马很多，声势浩大'],
  ['千言万语', 'qian yan wan yu', '说的话很多'],
  ['千山万水', 'qian shan wan shui', '山山水水很多，形容路途艰难遥远'],
  ['千辛万苦', 'qian xin wan ku', '各种各样的辛苦艰难'],
  ['千载难逢', 'qian zai nan feng', '一千年也难得遇到，形容机会极其难得'],
  ['千钧一发', 'qian jun yi fa', '千钧重量系在一根头发上，比喻情势极其危急'],
  ['千篇一律', 'qian pian yi lv', '一千篇文章一个样子，比喻事物只有一种形式毫无变化'],
  ['千变万化', 'qian bian wan hua', '形容变化极多'],
  ['万紫千红', 'wan zi qian hong', '形容百花齐放、色彩艳丽的繁荣景象'],
  ['万众一心', 'wan zhong yi xin', '千万人一条心，形容团结一致'],
  ['万无一失', 'wan wu yi shi', '绝对不会失误，形容非常有把握'],
  ['万象更新', 'wan xiang geng xin', '事物或景象改换了样子，出现一番新气象'],
  ['万事如意', 'wan shi ru yi', '一切符合心意，常用祝颂语'],
  ['万水千山', 'wan shui qian shan', '万道河千重山，形容路途艰难遥远'],
  ['万古长青', 'wan gu chang qing', '像松柏一样永远苍翠，比喻精神或友谊永不衰退'],
  ['守株待兔', 'shou zhu dai tu', '守着树桩等待兔子撞死，比喻不想努力而心存侥幸，妄想不劳而获'],
  ['画蛇添足', 'hua she tian zu', '画蛇添上脚，比喻做多余的事反而有害无益'],
  ['亡羊补牢', 'wang yang bu lao', '羊丢了才修补羊圈，比喻出了问题及时补救还不算迟'],
  ['对牛弹琴', 'dui niu tan qin', '对着牛弹琴，比喻对不懂道理的人讲道理，也讥笑说话不看对象'],
  ['指鹿为马', 'zhi lu wei ma', '把鹿说成是马，比喻公然歪曲事实、颠倒是非'],
  ['塞翁失马', 'sai weng shi ma', '比喻坏事在一定条件下可变为好事，不必急于悲观'],
  ['马到成功', 'ma dao cheng gong', '战马一到就取胜，形容迅速取得成功'],
  ['马马虎虎', 'ma ma hu hu', '形容做事草率不认真，也形容将就凑合'],
  ['老马识途', 'lao ma shi tu', '老马认识路，比喻有经验的人熟悉情况能起引导作用'],
  ['龙飞凤舞', 'long fei feng wu', '多形容书法笔势有力、活泼舒展'],
  ['画龙点睛', 'hua long dian jing', '画龙后点上眼睛使龙飞走，比喻在关键处加上精辟语句使内容更生动'],
  ['叶公好龙', 'ye gong hao long', '口头说喜欢某事物，实际上并不喜欢'],
  ['车水马龙', 'che shui ma long', '车如流水马如游龙，形容繁华热闹'],
  ['虎头蛇尾', 'hu tou she wei', '头大如虎尾细如蛇，比喻做事起初声势很大后来劲头很小'],
  ['如虎添翼', 'ru hu tian yi', '好像老虎长了翅膀，比喻强有力者又增添生力军'],
  ['骑虎难下', 'qi hu nan xia', '骑在虎背上难于下来，比喻事情进行中途不能中止'],
  ['狐假虎威', 'hu jia hu wei', '狐狸借老虎的威势吓百兽，比喻倚仗别人的势力欺压人'],
  ['调虎离山', 'diao hu li shan', '设法使老虎离开山头，比喻用计使对方离开有利地方以便行事'],
  ['放虎归山', 'fang hu gui shan', '把老虎放回山去，比喻放走敌手留下祸根'],
  ['龙腾虎跃', 'long teng hu yue', '像龙飞腾像虎跳跃，形容动作矫健有力或奋起行动'],
  ['狼吞虎咽', 'lang tun hu yan', '形容吃东西又猛又急'],
  ['鸡飞狗跳', 'ji fei gou tiao', '形容因恐惧而惊扰纷乱的景象'],
  ['鸡犬不宁', 'ji quan bu ning', '连鸡狗都不得安宁，形容搅扰得很厉害'],
  ['鹤立鸡群', 'he li ji qun', '像鹤站在鸡群中，比喻才能或仪表出众'],
  ['呆若木鸡', 'dai ruo mu ji', '呆得像木头鸡，形容因恐惧或惊讶而发愣的样子'],
  ['井底之蛙', 'jing di zhi wa', '井底的青蛙只见井口大的天，比喻见识狭小的人'],
  ['杯弓蛇影', 'bei gong she ying', '把杯中弓影误认为蛇，比喻疑神疑鬼自相惊扰'],
  ['打草惊蛇', 'da cao jing she', '打草惊动了草中的蛇，比喻行事不慎使对方觉察'],
  ['如鱼得水', 'ru yu de shui', '像鱼得到水一样，比喻得到很投合的人或很合适的环境'],
  ['鱼目混珠', 'yu mu hun zhu', '拿鱼眼睛冒充珍珠，比喻以假乱真'],
  ['狡兔三窟', 'jiao tu san ku', '狡猾的兔子有三个洞穴，比喻藏身的地方多便于避祸'],
  ['兔死狐悲', 'tu si hu bei', '兔子死了狐狸感到悲伤，比喻因同类的不幸而感到悲伤'],
  ['羊入虎口', 'yang ru hu kou', '羊落入老虎口中，比喻置身于极危险的境地'],
  ['顺手牵羊', 'shun shou qian yang', '比喻趁势把别人的东西拿走'],
  ['盲人摸象', 'mang ren mo xiang', '比喻只凭片面了解就对全貌乱加猜测'],
  ['蜻蜓点水', 'qing ting dian shui', '蜻蜓在水面轻轻触碰，比喻做事肤浅不深入'],
  ['螳臂当车', 'tang bi dang che', '螳螂举前腿想拦住车子，比喻不自量力去做力所不及的事'],
  ['蛛丝马迹', 'zhu si ma ji', '从蜘蛛丝和马行过的痕迹寻找线索，比喻与事物有联系的线索'],
  ['鸦雀无声', 'ya que wu sheng', '连乌鸦麻雀的声音都没有，形容非常静'],
  ['莺歌燕舞', 'ying ge yan wu', '黄莺歌唱小燕飞舞，形容大好春光或蓬勃兴旺的景象'],
  ['鹏程万里', 'peng cheng wan li', '像大鹏那样飞行万里，比喻前程远大'],
  ['鸠占鹊巢', 'jiu zhan que chao', '斑鸠抢占喜鹊窝，比喻强占别人的住处或位置'],
  ['鹤发童颜', 'he fa tong yan', '白发像仙鹤羽毛、面色如儿童红润，形容老年人气色好'],
  ['风花雪月', 'feng hua xue yue', '原指四季美景，后多指堆砌景物的诗文，也比喻男女情爱'],
  ['雪中送炭', 'xue zhong song tan', '下雪天给人送炭取暖，比喻在别人急需时给予帮助'],
  ['雨后春笋', 'yu hou chun sun', '春雨后竹笋纷纷出土，比喻新生事物迅速大量涌现'],
  ['风和日丽', 'feng he ri li', '和风习习阳光灿烂，形容晴朗暖和的天气'],
  ['风雨同舟', 'feng yu tong zhou', '在风雨中同乘一条船，比喻共同经历逆境'],
  ['风平浪静', 'feng ping lang jing', '没有风浪，比喻平静无事'],
  ['风起云涌', 'feng qi yun yong', '大风刮起乌云涌现，比喻事物迅速兴起声势浩大'],
  ['春风得意', 'chun feng de yi', '形容事情如意、心境愉快'],
  ['春光明媚', 'chun guang ming mei', '形容春天景物鲜明可爱'],
  ['骄阳似火', 'jiao yang si huo', '强烈的阳光像火一样热，形容天气非常炎热'],
  ['秋高气爽', 'qiu gao qi shuang', '形容秋季天空晴朗、气候凉爽宜人'],
  ['冰天雪地', 'bing tian xue di', '形容冰雪漫天盖地、非常寒冷'],
  ['天寒地冻', 'tian han di dong', '形容天气极为寒冷'],
  ['水滴石穿', 'shui di shi chuan', '水滴不断能把石头击穿，比喻坚持不懈事情终能成功'],
  ['水落石出', 'shui luo shi chu', '水落下去石头就露出来，比喻事情的真相完全显露'],
  ['杯水车薪', 'bei shui che xin', '用一杯水救一车着火的柴草，比喻力量太小无济于事'],
  ['山清水秀', 'shan qing shui xiu', '形容风景优美'],
  ['青山绿水', 'qing shan lv shui', '青翠的山、碧绿的水，泛称美好山河'],
  ['高山流水', 'gao shan liu shui', '比喻知音难遇或乐曲高妙'],
  ['崇山峻岭', 'chong shan jun ling', '高大陡峻的山岭'],
  ['人山人海', 'ren shan ren hai', '人群如山似海，形容人聚集得非常多'],
  ['波澜壮阔', 'bo lan zhuang kuo', '形容水面辽阔，现比喻声势雄壮或规模宏大'],
  ['昙花一现', 'tan hua yi xian', '昙花开放后即凋谢，比喻美好事物出现一下就消逝'],
  ['花好月圆', 'hua hao yue yuan', '花正盛开月正圆满，比喻美好圆满，多用于祝贺新婚'],
  ['花团锦簇', 'hua tuan jin cu', '形容五彩缤纷、绚丽多彩的景象'],
  ['柳暗花明', 'liu an hua ming', '垂柳浓密鲜花夺目，比喻困境之后又现新的转机'],
  ['走马观花', 'zou ma guan hua', '骑在马上看花，比喻粗略地观察事物'],
  ['锦上添花', 'jin shang tian hua', '在锦上再绣花，比喻好上加美、美上添美'],
  ['众星捧月', 'zhong xing peng yue', '许多星星衬托月亮，比喻众人拥戴一人或众物围绕一物'],
  ['齐头并进', 'qi tou bing jin', '几方面同时前进，多形容几件事情或几项任务同时进行'],
  ['日积月累', 'ri ji yue lei', '一天一天、一月一月地不断积累'],
  ['夜以继日', 'ye yi ji ri', '晚上连着白天，形容加紧工作或学习'],
  ['争分夺秒', 'zheng fen duo miao', '不放过一分一秒，形容对时间抓得很紧'],
  ['光阴似箭', 'guang yin si jian', '时间如射出的箭一般快，形容时间消逝迅速'],
  ['日月如梭', 'ri yue ru suo', '太阳和月亮像穿梭一样来去，形容时间过得很快'],
  ['度日如年', 'du ri ru nian', '过一天像过一年那样长，形容日子很不好过'],
  ['白驹过隙', 'bai ju guo xi', '像骏马在缝隙前飞快越过，形容时间过得极快'],
  ['稍纵即逝', 'shao zong ji shi', '稍微一放松就消失了，形容时间或机会极易失去'],
  ['日新月异', 'xin xin ri yi', '每天每月都有新的变化，形容发展进步很快'],
  ['古往今来', 'gu wang jin lai', '从古到今，泛指很长一段时间'],
  ['长年累月', 'chang nian lei yue', '形容经历很多年月，时间很长'],
  ['晴天霹雳', 'qing tian pi li', '晴天打响雷，比喻突然发生的令人震惊的意外事件'],
  ['电闪雷鸣', 'dian shan lei ming', '闪电飞光雷声轰鸣，形容声势迅猛'],
  ['眉清目秀', 'mei qing mu xiu', '形容人容貌清秀不俗气'],
  ['仪表堂堂', 'yi biao tang tang', '形容人的容貌端正、风度威严'],
  ['亭亭玉立', 'ting ting yu li', '形容女子身材细长，也形容花木形体挺拔'],
  ['虎背熊腰', 'hu bei xiong yao', '背宽厚如虎腰粗壮如熊，形容人身体魁梧健壮'],
  ['骨瘦如柴', 'gu shou ru chai', '形容消瘦到极点'],
  ['面黄肌瘦', 'mian huang ji shou', '脸色发黄身体消瘦，形容营养不良或有病的样子'],
  ['心平气和', 'xin ping qi he', '心情平静，态度温和'],
  ['目瞪口呆', 'mu deng kou dai', '形容因吃惊或害怕而发愣的样子'],
  ['手舞足蹈', 'shou wu zu dao', '两手舞动两脚跳起，形容高兴到了极点'],
  ['指手画脚', 'zhi shou hua jiao', '形容说话时兼用手势示意，也形容轻率地指点批评'],
  ['交头接耳', 'jiao tou jie er', '两个人凑在一起低声说话'],
  ['耳濡目染', 'er ru mu ran', '经常听到看到，不知不觉地受到影响'],
  ['耳闻目睹', 'er wen mu du', '亲耳听到，亲眼看到'],
  ['头重脚轻', 'tou zhong jiao qing', '头脑发胀脚下无力，形容身体不适，也比喻基础不牢固'],
  ['首屈一指', 'shou qu yi zhi', '扳指头时先弯下大拇指，表示位居第一'],
  ['目中无人', 'mu zhong wu ren', '眼里没有别人，形容骄傲自大'],
  ['一目了然', 'yi mu liao ran', '一眼就看得很清楚'],
  ['面面俱到', 'mian mian ju dao', '各方面都照顾到，没有遗漏'],
  ['心中有数', 'xin zhong you shu', '对情况有基本了解，处理事情有一定把握'],
  ['心想事成', 'xiang xin shi cheng', '心里想到的都能实现，多用于祝福'],
  ['提心吊胆', 'ti xin diao dan', '形容十分担心或害怕'],
  ['心惊肉跳', 'xin jing rou tiao', '担心灾祸临头，恐慌不安'],
  ['心急如焚', 'xin ji ru fen', '心里急得像着了火一样，形容非常着急'],
  ['心花怒放', 'xin hua nu fang', '心里高兴得像花儿盛开，形容极其高兴'],
  ['喜笑颜开', 'xi xiao yan kai', '因为高兴而笑容满面'],
  ['兴高采烈', 'xing gao cai lie', '形容兴致高，精神饱满'],
  ['垂头丧气', 'chui tou sang qi', '形容因失败或不顺利而情绪低落的样子'],
  ['愁眉苦脸', 'chou mei ku lian', '皱着眉头哭丧着脸，形容愁苦的神色'],
  ['悲欢离合', 'bei huan li he', '悲伤欢乐离散聚拢，泛指生活中的各种境遇'],
  ['喜怒哀乐', 'xi nu ai le', '高兴烦恼生气悲伤，泛指人的不同感情'],
  ['忐忑不安', 'tan te bu an', '心神极为不定，形容心里七上八下'],
  ['坐立不安', 'zuo li bu an', '坐着也不是站着也不是，形容心情紧张情绪不安'],
  ['如坐针毡', 'ru zuo zhen zhan', '像坐在插着针的毡子上，形容心神不定'],
  ['大惊失色', 'da jing shi se', '非常惊恐，脸色都变了'],
  ['泰然处之', 'tai ran chu zhi', '形容遇到困难时沉着镇定，毫不在意'],
  ['镇定自若', 'zhen ding zi ruo', '情况紧急时不慌不乱，当作没什么事一样'],
  ['若无其事', 'ruo wu qi shi', '像没有那回事一样，形容遇事沉着镇定'],
  ['从容不迫', 'cong rong bu po', '不慌不忙，沉着镇定'],
  ['暴跳如雷', 'bao tiao ru lei', '急怒时跳脚大喊，形容又急又怒大发脾气的样子'],
  ['怒火中烧', 'nu huo zhong shao', '怒火在心中燃烧，形容心中怀着极大的愤怒'],
  ['无忧无虑', 'wu you wu lv', '没有一点忧愁和顾虑'],
  ['心满意足', 'xin man yi zu', '形容心中非常满意'],
  ['称心如意', 'chen xin ru yi', '事情的发展完全符合心意'],
  ['喜出望外', 'xi chu wang wai', '遇到意外的喜事而特别高兴'],
  ['心旷神怡', 'xin kuang shen yi', '心境开阔，精神愉快'],
  ['赏心悦目', 'shang xin yue mu', '看到美好的景物而身心愉快'],
  ['乐不思蜀', 'le bu si shu', '快乐得不再想念蜀国，比喻乐而忘返或乐而忘本'],
  ['喜上眉梢', 'xi shang mei shao', '喜悦的心情从眉眼上表现出来'],
  ['锲而不舍', 'qie er bu she', '不停地雕刻，比喻有恒心、有毅力'],
  ['持之以恒', 'chi zhi yi heng', '长久地坚持下去'],
  ['坚持不懈', 'jian chi bu xie', '坚持到底，一点不松懈'],
  ['废寝忘食', 'fei qin wang shi', '顾不得睡觉忘记吃饭，形容非常勤奋专心'],
  ['孜孜不倦', 'zi zi bu juan', '勤奋努力，不知疲倦'],
  ['悬梁刺股', 'xuan liang ci gu', '头悬梁锥刺股，形容刻苦学习'],
  ['凿壁偷光', 'zao bi tou guang', '凿穿墙壁借邻家烛光读书，形容家贫而读书刻苦'],
  ['囊萤映雪', 'nang ying ying xue', '袋装萤火虫、借雪光读书，形容勤学苦读'],
  ['手不释卷', 'shou bu shi juan', '书本不离手，形容勤奋好学'],
  ['全神贯注', 'quan shen guan zhu', '全部精神集中在一点，形容注意力高度集中'],
  ['聚精会神', 'ju jing hui shen', '集中精神，专心致志'],
  ['专心致志', 'zhuan xin zhi zhi', '把心思全放在上面，形容一心一意'],
  ['卧薪尝胆', 'wo xin chang dan', '睡柴草尝苦胆，形容人刻苦自励、发奋图强'],
  ['破釜沉舟', 'po fu chen zhou', '打破饭锅凿沉渡船，比喻下决心不顾一切干到底'],
  ['背水一战', 'bei shui yi zhan', '背靠水作战，比喻处于绝境时为求生路而决一死战'],
  ['愚公移山', 'yu gong yi shan', '比喻坚持不懈地改造自然，坚定不移地斗争'],
  ['精卫填海', 'jing wei tian hai', '精卫衔石填海，比喻意志坚决、不畏艰难'],
  ['闻鸡起舞', 'wen ji qi wu', '听到鸡叫就起来舞剑，比喻有志之士及时奋发'],
  ['熟能生巧', 'shu neng sheng qiao', '熟练了就能产生巧妙的办法'],
  ['勤能补拙', 'qin neng bu zhuo', '后天的勤奋能够弥补先天的笨拙'],
  ['发奋图强', 'fa fen tu qiang', '下定决心，努力追求进步'],
  ['脚踏实地', 'jiao ta shi di', '脚踏到实地，比喻做事踏实认真'],
  ['循序渐进', 'xun xu er jin', '学习工作按一定步骤逐渐深入或提高'],
  ['精益求精', 'jing yi qiu jing', '已经很好了，还要求更好'],
  ['兢兢业业', 'jing ye jing ye', '形容做事谨慎、勤恳踏实'],
  ['实事求是', 'shi shi qiu shi', '从实际情况出发，正确地认识和对待事物'],
  ['事半功倍', 'shi ban gong bei', '费力小而收效大，指做事得法'],
  ['事倍功半', 'shi bei gong ban', '费力大而收效小，指方法不当'],
  ['水到渠成', 'shui dao qu cheng', '水流到的地方自然成渠，比喻条件成熟事情自然成功'],
  ['瓜熟蒂落', 'gua shu di luo', '瓜熟后蒂自然脱落，比喻时机成熟事情自然成功'],
  ['半途而废', 'ban tu er fei', '路走到一半就停了，比喻做事有始无终不能坚持'],
  ['前功尽弃', 'qian gong jin qi', '以前的努力全部白费'],
  ['功亏一篑', 'gong kui yi kui', '堆山只差一筐土而没有完成，比喻只差最后一点而未能做成'],
  ['再接再厉', 'zai jie zai li', '一次又一次地继续努力'],
  ['迎刃而解', 'ying ren er jie', '竹子劈开口就顺刀而裂，比喻主要问题解决后其他问题就容易解决'],
  ['势如破竹', 'shi ru po zhu', '形势像劈竹子一样一节接一节，比喻节节胜利毫无阻碍'],
  ['旗开得胜', 'qi kai de sheng', '旗帜一展开就打了胜仗，比喻事情一开始就取得好成绩'],
  ['大功告成', 'da gong gao cheng', '指巨大工程或重要任务宣告完成'],
  ['功成名就', 'gong cheng ming jiu', '功绩建立了，名声也有了'],
  ['对症下药', 'dui zheng xia yao', '针对病情用药，比喻针对具体情况决定解决办法'],
  ['因材施教', 'yin cai shi jiao', '针对学习者的志趣能力等具体情况施行不同的教育'],
  ['因地制宜', 'yin di zhi yi', '根据各地的具体情况制定适宜的办法'],
  ['有的放矢', 'you di fang shi', '对着靶子放箭，比喻说话做事有针对性'],
  ['无的放矢', 'wu di fang shi', '没有目标乱射箭，比喻说话做事没有明确目的'],
  ['胸有成竹', 'xiong you cheng zhu', '画竹前竹已成形于胸中，比喻做事之前已有通盘考虑'],
  ['纸上谈兵', 'zhi shang tan bing', '在纸面上谈论用兵，比喻空谈理论不能解决实际问题'],
  ['刻舟求剑', 'ke zhou qiu jian', '在船帮刻记号找落水的剑，比喻拘泥成例不知变通'],
  ['缘木求鱼', 'yuan mu qiu yu', '爬到树上去找鱼，比喻方向方法不对不可能达到目的'],
  ['拔苗助长', 'ba miao zhu zhang', '把禾苗拔高帮它生长，比喻违反规律急于求成反而坏事'],
  ['掩耳盗铃', 'yan er dao ling', '捂住耳朵去偷铃铛，比喻自己欺骗自己'],
  ['自相矛盾', 'zi xiang mao dun', '比喻自己说话做事前后抵触'],
  ['买椟还珠', 'mai du huan zhu', '买下木匣退还珍珠，比喻没有眼力取舍不当'],
  ['画饼充饥', 'hua bing chong ji', '画个饼来解饿，比喻用空想来安慰自己'],
  ['望梅止渴', 'wang mei zhi ke', '想到梅子流口水而止渴，比喻愿望无法实现用空想安慰'],
  ['望洋兴叹', 'wang yang xing tan', '面对大海感叹自身渺小，比喻力量不够无可奈何'],
  ['滥竽充数', 'lan yu chong shu', '不会吹竽的人混在乐队里，比喻无本领的冒充有本领'],
  ['邯郸学步', 'han dan xue bu', '去邯郸学走路结果忘了怎么走，比喻盲目模仿反失本能'],
  ['东施效颦', 'dong shi xiao pin', '丑女学美女皱眉更显得丑，比喻胡乱模仿效果适得其反'],
  ['班门弄斧', 'ban men nong fu', '在鲁班门前舞弄斧子，比喻在行家面前卖弄本领'],
  ['南辕北辙', 'nan yuan bei zhe', '要到南却驾车向北，比喻行动和目的正好相反'],
  ['背道而驰', 'bei dao er chi', '朝相反的方向跑，比喻彼此方向目标完全相反'],
  ['异曲同工', 'yi qu tong gong', '不同的曲调演得同样好，比喻做法不同效果一样'],
  ['殊途同归', 'shu tu tong gui', '走不同的路到同一地方，比喻方法不同结果一致'],
  ['大同小异', 'da tong xiao yi', '大体相同，略有差异'],
  ['举一反三', 'ju yi fan san', '从一件事情类推而知道许多事情'],
  ['触类旁通', 'chu lei pang tong', '掌握某一类知识后推知同类其他事物'],
  ['温故知新', 'wen gu zhi xin', '温习旧的知识得到新的理解和体会'],
  ['学以致用', 'xue yi zhi yong', '学习能够应用于实际'],
  ['博览群书', 'bo lan qun shu', '广泛阅读各种书籍，形容读书很多'],
  ['融会贯通', 'rong hui guan tong', '把各方面的知识融合贯穿，得到透彻理解'],
  ['字斟句酌', 'zi zhen ju zhuo', '对每一字每一句都仔细推敲，形容态度慎重'],
  ['咬文嚼字', 'yao wen jiao zi', '过分地斟酌字句，多指死抠字眼而不领会实质'],
  ['囫囵吞枣', 'hu lun tun zao', '把枣整个咽下不辨滋味，比喻对事物不加分析思考'],
  ['过目不忘', 'guo mu bu wang', '看过就不再忘记，形容记忆力非常强'],
  ['出口成章', 'chu kou cheng zhang', '说出话来就成文章，形容文思敏捷口才好'],
  ['文思泉涌', 'wen si quan yong', '行文思路像泉水奔涌，形容才思敏捷'],
  ['才高八斗', 'cai gao ba dou', '形容人文才极高'],
  ['学富五车', 'xue fu wu che', '读书多，学识丰富'],
  ['满腹经纶', 'man fu jing lun', '形容人极有才干和谋略'],
  ['出类拔萃', 'chu lei ba cui', '超出同类之上，多指人的品德才能'],
  ['名列前茅', 'ming lie qian mao', '名次排在前面'],
  ['脱颖而出', 'tuo ying er chu', '锥尖透出布袋，比喻才能全部显露出来'],
  ['后来居上', 'hou lai ju shang', '后来的超过先前的'],
  ['人才辈出', 'ren cai bei chu', '有才能的人不断地大量涌现'],
  ['藏龙卧虎', 'cang long wo hu', '指隐藏着未被发现的人才'],
  ['卧虎藏龙', 'wo hu cang long', '隐藏着的人才，比喻人才深藏不露'],
  ['口若悬河', 'kou ruo xuan he', '讲起话来滔滔不绝像瀑布倾泻，形容能说会辩'],
  ['滔滔不绝', 'tao tao bu jue', '像流水一样连续不断，指话很多说起来没完'],
  ['妙语连珠', 'miao yu lian zhu', '巧妙风趣的话一个接一个'],
  ['对答如流', 'da da ru liu', '回答问话像流水一样快，形容口才好反应快'],
  ['夸夸其谈', 'kua kua qi tan', '说话浮夸，不切实际'],
  ['侃侃而谈', 'kan kan er tan', '理直气壮、从容不迫地说话'],
  ['谈笑风生', 'tan xiao feng sheng', '谈话时有说有笑，兴致高而有风趣'],
  ['言简意赅', 'yan jian yi gai', '话不多但意思完备，形容说话写文章简明扼要'],
  ['言外之意', 'yan wai zhi yi', '话里暗含的没有直接说出的意思'],
  ['指桑骂槐', 'zhi sang ma huai', '指着桑树骂槐树，比喻表面上骂这个人实际骂那个人'],
  ['旁敲侧击', 'pang qiao ce ji', '不从正面点明而从侧面曲折表达'],
  ['开门见山', 'kai men jian shan', '打开门就看见山，比喻说话写文章直截了当谈正题'],
  ['单刀直入', 'dan dao zhi ru', '用短刀直接刺入，比喻说话直截了当不绕弯子'],
  ['直截了当', 'zhi jie liao dang', '形容说话做事爽快干脆'],
  ['拐弯抹角', 'guai wan mo jiao', '形容说话绕弯，不直截了当'],
  ['苦口婆心', 'ku kou po xin', '像善心的老太婆那样不厌其烦地好心劝说'],
  ['语重心长', 'yu zhong xin chang', '言辞恳切，情意深长'],
  ['振聋发聩', 'zhen long fa kui', '发出的声响使耳聋的人也能听见，比喻唤醒糊涂麻木的人'],
  ['掷地有声', 'zhi di you sheng', '扔在地上会发出声响，形容话语豪迈有力'],
  ['一针见血', 'yi zhen jian xue', '比喻说话直截了当，切中要害'],
  ['入木三分', 'ru mu san fen', '笔力透入木板三分，形容书法有力或见解深刻'],
  ['头头是道', 'tou tou shi dao', '形容说话做事很有条理'],
  ['自言自语', 'zi yan zi yu', '自己跟自己说话'],
  ['哑口无言', 'ya kou wu yan', '像哑巴一样说不出话，形容理屈词穷'],
  ['理直气壮', 'li zhi qi zhuang', '理由充分，说话气势就壮'],
  ['理屈词穷', 'li qu ci qiong', '理由站不住脚，无话可说'],
  ['强词夺理', 'qiang ci duo li', '本来没理硬说有理'],
  ['胡言乱语', 'hu yan luan yu', '没有根据、不合实际地说，或说没有条理的话'],
  ['流言蜚语', 'liu yan fei yu', '背后散布的没有根据的坏话'],
  ['道听途说', 'dao ting tu shuo', '路上听来又传开的话，泛指没有根据的传闻'],
  ['以讹传讹', 'yi e chuan e', '把不正确的说法错误地传开，越传越错'],
  ['众说纷纭', 'zhong shuo fen yun', '人多嘴杂，议论纷纷不一'],
  ['莫衷一是', 'mo zhong yi shi', '意见分歧，不能得出一致的结论'],
  ['各执一词', 'ge zhi yi ci', '各人坚持各人的说法，意见不一致'],
  ['异口同声', 'yi kou tong sheng', '不同的人说出同样的话，形容大家意见一致'],
  ['畅所欲言', 'chang suo yu yan', '痛痛快快地把要说的话都说出来'],
  ['各抒己见', 'ge shu ji jian', '各人发表自己的意见'],
  ['议论纷纷', 'yi lun fen fen', '各种意见的言论多而杂乱'],
  ['喋喋不休', 'die die bu xiu', '唠唠叨叨，说个没完'],
  ['良药苦口', 'liang yao ku kou', '好药味苦难吃，比喻恳切劝告虽逆耳但有好处'],
  ['忠言逆耳', 'zhong yan ni er', '恳切的劝告听起来不顺耳，但对行事有帮助'],
  ['千真万确', 'qian zhen wan que', '形容情况非常确实'],
  ['将信将疑', 'jiang xin jiang yi', '有点相信，又有点怀疑'],
  ['半信半疑', 'ban xin ban yi', '有点相信，又有点怀疑'],
  ['无中生有', 'wu zhong sheng you', '把没有的说成有，比喻凭空捏造'],
  ['信以为真', 'xin yi wei zhen', '把假的当作真的'],
  ['名不虚传', 'ming bu xu chuan', '传出的名声与实际相符，确实很好'],
  ['名副其实', 'ming fu qi shi', '名声或名称与实际相符'],
  ['徒有虚名', 'tu you xu ming', '空有名望，有名无实'],
  ['有名无实', 'you ming wu shi', '空有名义，实际并不相符'],
  ['表里如一', 'biao li ru yi', '表面和内心一个样，形容言行思想完全一致'],
  ['表里不一', 'biao li bu yi', '表面和内在不一样'],
  ['心口如一', 'xin kou ru yi', '心里想的和嘴上说的一样，形容诚实直率'],
  ['口是心非', 'kou shi xin fei', '嘴上说的和心里想的不一致'],
  ['言行一致', 'yan xing yi zhi', '说的和做的一个样'],
  ['言而有信', 'yan er you xin', '说话守信用'],
  ['说一不二', 'shuo yi bu er', '说怎样就怎样，形容说话算数'],
  ['光明磊落', 'guang ming lei luo', '胸怀坦白，正大光明'],
  ['明目张胆', 'ming mu zhang dan', '公开地、无所顾忌地做坏事'],
  ['阳奉阴违', 'yang feng yin wei', '表面遵从，暗地违背'],
  ['朝三暮四', 'zhao san mu si', '比喻常常变卦，反复无常'],
  ['见异思迁', 'jian yi si qian', '看见不同的事物就改变主意，指意志不坚定'],
  ['完美无缺', 'wan mei wu que', '完善美好，没有缺点'],
  ['无可挑剔', 'wu ke tiao ti', '挑不出一点毛病，形容很完美'],
  ['美中不足', 'mei zhong bu zu', '虽然很好，但还有缺陷'],
  ['川流不息', 'chuan liu bu xi', '像水流一样连续不断'],
  ['人声鼎沸', 'ren sheng ding fei', '人群的声音像锅里的水沸腾，形容人声嘈杂喧闹'],
  ['座无虚席', 'zuo wu xu xi', '座位没有空着的，形容出席的人很多'],
  ['门庭若市', 'men ting ruo shi', '门前像市场一样热闹，形容来往的人很多'],
  ['济济一堂', 'ji ji yi tang', '形容许多有才能的人聚集在一起'],
  ['水泄不通', 'shui xie bu tong', '连水都流不出去，形容十分拥挤或包围严密'],
  ['铺天盖地', 'pu tian gai di', '形容来势猛，声势大，到处都是'],
  ['漫山遍野', 'man shan bian ye', '山上和田野里到处都是，形容很多'],
  ['排山倒海', 'pai shan dao hai', '推开高山翻倒大海，形容力量强盛声势浩大'],
  ['惊天动地', 'jing tian dong di', '惊动天地，形容声势或意义极大'],
  ['震耳欲聋', 'zhen er yu long', '耳朵都快震聋了，形容声音很大'],
  ['响彻云霄', 'xiang che yun xiao', '声音直达高空，形容声音响亮'],
  ['井然有序', 'jing ran you xu', '整整齐齐，次序分明，条理清楚'],
  ['有条不紊', 'you tiao bu wen', '有条理有次序，一点不乱'],
  ['乱七八糟', 'luan qi ba zao', '形容毫无秩序条理，乱得不成样子'],
  ['横七竖八', 'heng qi shu ba', '形容纵横杂乱'],
  ['赫赫有名', 'he he you ming', '声名非常显赫'],
  ['默默无闻', 'mo mo wu wen', '做事无声无息，无人知晓，没有名声'],
  ['家喻户晓', 'jia yu hu xiao', '家家户户都知道，形容人所共知'],
  ['众所周知', 'zhong suo zhou zhi', '大家普遍知道的'],
  ['鲜为人知', 'xian wei ren zhi', '很少有人知道'],
  ['名扬四海', 'ming yang si hai', '名声传遍天下，形容非常有名'],
  ['流芳百世', 'liu fang bai shi', '好名声永远流传后世'],
  ['遗臭万年', 'yi chou wan nian', '坏名声永远被人唾骂'],
  ['臭名远扬', 'chou ming yuan yang', '坏名声传得很远'],
  ['永垂不朽', 'yong chui bu xiu', '光辉事迹和伟大精神永远流传，不会磨灭'],
  ['名垂青史', 'ming chui qing shi', '姓名事迹载入史册，形容功业巨大'],
  ['平步青云', 'ping bu qing yun', '一步就登上青云，比喻一下子轻易升到高位'],
  ['飞黄腾达', 'fei huang teng da', '骏马奔腾飞驰，比喻官职地位很快高升'],
  ['出人头地', 'chu ren tou di', '超出一般人，高人一等'],
  ['衣锦还乡', 'yi jin huan xiang', '富贵后穿锦衣回故乡，形容功成名就后荣归故里'],
  ['荣华富贵', 'rong hua fu gui', '兴盛显达，钱财众多'],
  ['富可敌国', 'fu ke di guo', '私人的财富可与国家资财匹敌，形容十分富有'],
  ['日进斗金', 'ri jin dou jin', '一天能收进一斗黄金，形容发财迅速'],
  ['粗茶淡饭', 'cu cha dan fan', '简单的饮食，形容生活简朴'],
  ['丰衣足食', 'feng yi zu shi', '穿的吃的都很丰富，形容生活富裕'],
  ['饥寒交迫', 'ji han jiao po', '饥饿与寒冷一齐逼来，形容生活极端贫困'],
  ['家徒四壁', 'jia tu si bi', '家里只有四面墙，形容十分贫穷'],
  ['身无分文', 'shen wu fen wen', '身上一文钱也没有，形容非常贫穷'],
  ['安居乐业', 'an ju le ye', '安定地生活，愉快地工作'],
  ['国泰民安', 'guo tai min an', '国家太平，人民安乐'],
  ['世外桃源', 'shi wai tao yuan', '理想中美好安乐的所在，也指环境幽静生活安逸的地方'],
  ['天涯海角', 'tian ya hai jiao', '天的边际海的角落，形容极远的地方'],
  ['天南海北', 'tian nan hai bei', '形容距离遥远的不同地区，也指谈话漫无边际'],
  ['四海为家', 'si hai wei jia', '任何地方都可以当作自己的家，也指志在四方'],
  ['走南闯北', 'zou nan chuang bei', '走过南方北方，形容四处闯荡，见过世面'],
  ['东奔西走', 'dong ben xi zou', '到处奔波，多指为生活或某事四处奔走'],
  ['跋山涉水', 'ba shan she shui', '翻山越岭蹚水过河，形容旅途艰苦'],
  ['翻山越岭', 'fan shan yue ling', '翻越不少山头，形容野外劳作或旅途的艰辛'],
  ['风尘仆仆', 'feng chen pu pu', '形容旅途奔波，忙碌劳累'],
  ['浪迹天涯', 'lang ji tian ya', '到处流浪，足迹遍天下'],
  ['天各一方', 'tian ge yi fang', '各在一方，形容彼此相隔遥远'],
  ['近在咫尺', 'jin zai zhi chi', '距离近得像在眼前'],
  ['远走高飞', 'yuan zou gao fei', '像鸟一样飞向远方，指离开现状去远方寻求发展'],
  ['白发苍苍', 'bai fa cang cang', '头发灰白，形容人的苍老'],
  ['老当益壮', 'lao dang yi zhuang', '年纪虽老而志气更加旺盛'],
  ['老态龙钟', 'lao tai long zhong', '形容年老体衰，行动不灵便'],
  ['返老还童', 'fan lao huan tong', '由衰老恢复青春，形容老年人充满活力'],
  ['朝气蓬勃', 'zhao qi peng bo', '充满了生命和活力'],
  ['生机勃勃', 'sheng ji bo bo', '富有朝气与生命力，旺盛向上'],
  ['死气沉沉', 'si qi chen chen', '形容气氛不活跃或精神消沉'],
  ['情同手足', 'qing tong shou zu', '情谊如手和脚一样分不开，形容亲如兄弟'],
  ['志同道合', 'zhi tong dao he', '志趣意见相同'],
  ['患难与共', 'huan nan yu gong', '共同承担困难和危险'],
  ['推心置腹', 'tui xin zhi fu', '把赤诚的心交给别人，比喻真心待人'],
  ['肝胆相照', 'gan dan xiang zhao', '比喻以真心相见'],
  ['萍水相逢', 'ping shui xiang feng', '像浮萍随水漂泊偶然聚在一起的碰面，比喻素不相识的人偶然相遇'],
  ['齐心协力', 'qi xin xie li', '认识一致，共同努力'],
  ['众志成城', 'zhong zhi cheng cheng', '万众一心像城墙一样坚固，比喻团结起来力量无比'],
  ['同舟共济', 'tong zhou gong ji', '同坐一条船过河，比喻同心协力战胜困难'],
  ['群策群力', 'qun ce qun li', '大家一起想办法出力量'],
  ['集思广益', 'ji si guang yi', '集中众人智慧，广泛吸收有益的意见'],
  ['相辅相成', 'xiang fu xiang cheng', '两件事物互相配合、互相补充，缺一不可'],
  ['相得益彰', 'xiang de yi zhang', '互相配合使双方的长处更能显现'],
  ['水乳交融', 'shui ru jiao rong', '像水和乳汁融合，比喻关系非常融洽'],
  ['浑然一体', 'hun ran yi ti', '融合成一个整体，不可分割'],
  ['天衣无缝', 'tian yi wu feng', '仙女的衣服没有衣缝，比喻事物周密没有破绽'],
  ['恰到好处', 'qia dao hao chu', '说话做事正好达到最适当的分寸'],
  ['恰如其分', 'qia ru qi fen', '办事说话端正恰当，合乎分寸'],
  ['过犹不及', 'guo you bu ji', '事情做过了头就跟做得不够一样，都是不好的'],
  ['量力而行', 'liang li er xing', '按照自己力量的大小去做，不勉强'],
  ['三思而行', 'san si er xing', '反复考虑然后再做'],
  ['深思熟虑', 'shen si shu lv', '深入细致地反复考虑'],
  ['深谋远虑', 'shen mou yuan lv', '计划周密，考虑长远'],
  ['高瞻远瞩', 'gao zhan yuan zhu', '站得高看得远，比喻眼光远大'],
  ['高谈阔论', 'gao tan kuo lun', '漫无边际地大发议论，多含贬义'],
  ['眼高手低', 'yan gao shou di', '要求的标准高，但实际能力低'],
  ['志大才疏', 'zhi da cai shu', '志向大而才能小'],
  ['好高骛远', 'hao gao wu yuan', '不切实际地追求过高的目标'],
  ['以卵击石', 'yi luan ji shi', '拿鸡蛋碰石头，比喻不自量力自取失败'],
  ['不自量力', 'bu zi liang li', '过高地估计自己的力量'],
  ['力不从心', 'li bu cong xin', '心里想做但力量不够'],
  ['无能为力', 'wu neng wei li', '用不上力量，没有能力去做或力量达不到'],
  ['微不足道', 'wei bu zu dao', '微小得很，不值得一提'],
  ['举足轻重', 'ju zhong qing qing', '一举一动都关系全局，指处于重要地位'],
  ['杞人忧天', 'qi ren you tian', '杞国有人怕天塌地陷而忧愁，比喻不必要的忧虑'],
  ['居安思危', 'ju an si wei', '处在安乐时要想到可能出现的危险'],
  ['防患未然', 'fang huan wei ran', '在事故或灾害尚未发生时加以预防'],
  ['未雨绸缪', 'wei yu chou mou', '天没下雨先修补门窗，比喻事先做好准备'],
  ['防微杜渐', 'fang wei du jian', '错误或坏事刚冒头时就加制止，不让其发展'],
  ['见微知著', 'jian wei zhi zhu', '见到一点苗头就能知道它将来的发展和实质'],
  ['因小失大', 'yin xiao shi da', '为了小的利益而造成大的损失'],
  ['舍本逐末', 'she ben zhu mo', '抛弃根本去追求枝节，比喻抓不住重点只在细节上用心'],
  ['本末倒置', 'ben mo dao zhi', '把主要的和次要的位置弄颠倒了'],
  ['断章取义', 'duan zhang qu yi', '不顾全篇原意，孤立截取其中一段一句来引用'],
  ['以偏概全', 'yi pian gai quan', '用片面的观点看待整体问题'],
  ['一孔之见', 'yi kong zhi jian', '从一个小窟窿里看到的，比喻狭隘片面的见解'],
  ['管中窥豹', 'guan zhong kui bao', '从竹管里看豹只看到一块斑纹，比喻只见局部不见全貌'],
  ['坐井观天', 'zuo jing guan tian', '坐在井底看天，比喻眼光狭小所见有限'],
  ['迫在眉睫', 'po zai mei jie', '事情已逼近眼前，十分紧迫'],
  ['燃眉之急', 'ran mei zhi ji', '像火烧眉毛那样急迫，形容非常紧迫的事情'],
  ['岌岌可危', 'ji ji ke wei', '形容十分危险，快要倾覆灭亡'],
  ['摇摇欲坠', 'yao yao yu zhui', '摇晃着就要掉下来，形容极其危险或不稳固']
]

// 由原始三元组构建成语条目：{idiom, pinyin, meaning, first, last}
const buildIdioms = (raw) => raw.map(item => ({
  idiom: item[0],
  pinyin: item[1],
  meaning: item[2],
  first: item[0].charAt(0),
  last: item[0].charAt(item[0].length - 1)
}))

const IDIOMS = buildIdioms(IDIOM_RAW)

const normalizeChar = (ch) => String(ch || '').trim().charAt(0)

// 查询：命中成语字面 / 拼音音节（忽略空格） / 释义关键字；留空返回随机前 20 条
const searchIdioms = (kw, pool) => {
  const list = pool || IDIOMS
  const k = String(kw || '').trim().toLowerCase()
  if (!k) return list.slice(0, 20)
  const nospace = k.replace(/\s/g, '')
  return list.filter(it =>
    it.idiom.indexOf(k) >= 0 ||
    it.pinyin.replace(/\s/g, '').indexOf(nospace) >= 0 ||
    it.meaning.indexOf(k) >= 0
  )
}

// 接龙一步：返回首字等于当前成语尾字的候选（排除自身），无匹配返回空数组
const chainStep = (cur, pool) => {
  const list = pool || IDIOMS
  const s = String(cur || '').trim()
  if (!s) return []
  const last = normalizeChar(s.charAt(s.length - 1))
  return list.filter(it => normalizeChar(it.first) === last && it.idiom !== s)
}

const findIdiom = (name, pool) => {
  const list = pool || IDIOMS
  const t = String(name || '').trim()
  if (!t) return null
  return list.find(it => it.idiom === t) || null
}

const pickRandom = (pool) => {
  const list = pool || IDIOMS
  return list[Math.floor(Math.random() * list.length)]
}

// 校验按尾字接龙的答案：须在库内且首字匹配
const checkChainAnswer = (input, fromChar, pool) => {
  const t = String(input || '').trim()
  const it = findIdiom(t, pool)
  if (!it) return { ok: false, reason: '「' + t + '」不在本工具收录范围内' }
  if (normalizeChar(it.first) !== normalizeChar(fromChar)) {
    return { ok: false, reason: '首字应为「' + normalizeChar(fromChar) + '」，而「' + it.idiom + '」以「' + it.first + '」开头' }
  }
  return { ok: true, item: it }
}
/* ==== PURE:END ==== */

// ---------- 状态 ----------
const activeTab = ref('query')
const searchKeyword = ref('')
const chainInput = ref('')
const chainError = ref('')
const chainCurrent = ref(null)
const chainHistory = ref([])
const challengeType = ref('')
const challengeItem = ref(null)
const challengeInput = ref('')
const challengeResult = ref(null)
const showAnswer = ref(false)
const scoreRight = ref(0)
const scoreTotal = ref(0)
const favorites = ref([])
const revealedSet = ref([])
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const TABS = [
  { key: 'query', label: '成语查询', icon: Search },
  { key: 'chain', label: '成语接龙', icon: Shuffle },
  { key: 'challenge', label: '随机挑战', icon: Trophy },
  { key: 'favorites', label: '收藏卡片', icon: Heart }
]

const idiomCount = IDIOMS.length

const searchResults = computed(() => searchIdioms(searchKeyword.value))
const displayResults = computed(() => searchResults.value.slice(0, 30))

const chainCandidates = computed(() => {
  if (!chainCurrent.value) return []
  return chainStep(chainCurrent.value.idiom).slice(0, 12)
})

const favoriteItems = computed(() => favorites.value.map(name => findIdiom(name)).filter(Boolean))

const isFavorite = (name) => favorites.value.includes(name)

const toggleReveal = (name) => {
  const idx = revealedSet.value.indexOf(name)
  if (idx >= 0) revealedSet.value.splice(idx, 1)
  else revealedSet.value.push(name)
}

// ---------- 收藏持久化（守卫） ----------
const persistFavorites = () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(favorites.value))
  } catch (e) { /* 隐私模式静默 */ }
}

const restoreFavorites = () => {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(FAV_KEY)
    if (!raw) return
    const arr = JSON.parse(raw)
    if (Array.isArray(arr)) favorites.value = arr.filter(x => typeof x === 'string')
  } catch (e) { /* 损坏则忽略 */ }
}

const toggleFavorite = (it) => {
  const idx = favorites.value.indexOf(it.idiom)
  if (idx >= 0) favorites.value.splice(idx, 1)
  else favorites.value.push(it.idiom)
  persistFavorites()
}

// ---------- 接龙 ----------
const startChainFrom = (it) => {
  chainCurrent.value = it
  chainHistory.value = [it]
  chainInput.value = ''
  chainError.value = ''
  activeTab.value = 'chain'
}

const startChainFromInput = () => {
  const it = findIdiom(chainInput.value)
  if (!it) {
    chainError.value = '未收录该成语或输入不完整，请从「成语查询」确认后再试'
    return
  }
  startChainFrom(it)
}

const randomChainStart = () => { startChainFrom(pickRandom()) }

const stepChain = (it) => {
  chainCurrent.value = it
  chainHistory.value.push(it)
  chainError.value = ''
}

const resetChain = () => {
  chainCurrent.value = null
  chainHistory.value = []
  chainError.value = ''
}

// ---------- 挑战 ----------
const startMeaningChallenge = () => {
  challengeType.value = 'meaning'
  challengeItem.value = pickRandom()
  challengeInput.value = ''
  challengeResult.value = null
  showAnswer.value = false
}

const startCharChallenge = () => {
  challengeType.value = 'char'
  challengeItem.value = pickRandom()
  challengeInput.value = ''
  challengeResult.value = null
  showAnswer.value = false
}

const nextChallenge = () => {
  if (challengeType.value === 'char') startCharChallenge()
  else startMeaningChallenge()
}

const revealChallengeAnswer = () => { showAnswer.value = true }

const submitChallenge = () => {
  if (!challengeItem.value) return
  const answer = String(challengeInput.value).trim()
  if (!answer) return
  scoreTotal.value += 1

  if (challengeType.value === 'meaning') {
    const ok = answer === challengeItem.value.idiom
    if (ok) scoreRight.value += 1
    challengeResult.value = ok
      ? { ok: true, text: '回答正确：' + challengeItem.value.idiom }
      : { ok: false, text: '不对哦，正确答案是：' + challengeItem.value.idiom + '（' + challengeItem.value.pinyin + '）' }
    showAnswer.value = true
  } else {
    const check = checkChainAnswer(answer, challengeItem.value.last)
    if (check.ok) scoreRight.value += 1
    challengeResult.value = check.ok
      ? { ok: true, text: '接得好！' + check.item.idiom + '：' + check.item.meaning }
      : { ok: false, text: '不算过关：' + check.reason + '。参考答案：' + (chainStep(challengeItem.value.idiom)[0] || { idiom: '（本库暂无可接条目）' }).idiom }
    if (!check.ok) showAnswer.value = true
  }
}

onMounted(() => {
  if (tool) addRecentTool(tool.id)
  restoreFavorites()
})
</script>
