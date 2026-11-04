<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <BarChart3 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">关键词密度检查器</h1>
          <p class="text-sm text-muted-foreground mt-1">中英文词频统计、n-gram 密度分析、目标关键词四档判定与堆砌风险预警</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线关键词密度检查工具：粘贴文章全文即可实时统计中英文词频，按一元 / 二元 / 三元 n-gram 三档给出 Top50 词表与密度占比，
        支持目标关键词定向检查（偏弱 / 合理 / 偏高 / 堆砌风险四档判定），任一档位密度超过 5% 自动红色高亮并给出堆砌警示。
        中文按 n-gram 滑窗统计（非语义分词），全部计算在浏览器本地完成，不上传任何文本数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：文章输入与设置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Search class="w-5 h-5 mr-2 text-primary" /> 文章输入与设置
        </h2>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label for="kd-input" class="text-sm font-medium text-foreground">文章全文</label>
            <span class="text-xs text-muted-foreground font-mono">{{ byteDisplay }} / 100KB</span>
          </div>
          <textarea
            id="kd-input"
            v-model="inputText"
            rows="12"
            placeholder="粘贴要分析的文章全文，支持中英文混排……"
            class="w-full h-64 px-3 py-2.5 bg-background border border-border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
          ></textarea>
          <p v-if="isTruncated" class="mt-1.5 text-xs text-amber-600 flex items-start gap-1">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>文本超过 100KB（102400 字节）上限，超出部分已截断，仅分析前 100KB。</span>
          </p>
        </div>

        <div>
          <label for="kd-targets" class="text-sm font-medium text-foreground">目标关键词（可选，逗号分隔）</label>
          <input
            id="kd-targets"
            v-model="targetInput"
            type="text"
            placeholder="如：关键词密度,词频统计"
            class="mt-1.5 w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p class="mt-1 text-xs text-muted-foreground">多个词用逗号、顿号或分号分隔（最多 20 个）；英文短语可含空格，按整词匹配。</p>
        </div>

        <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
          <span>中文没有空格分词，本工具按 n-gram 滑窗统计（非语义分词）；密度判定采用 SEO 经验口径，不是搜索引擎官方标准。</span>
        </p>

        <button
          @click="loadSample"
          class="w-full px-4 py-2.5 bg-primary/10 hover:bg-primary/15 border border-primary/20 rounded-lg text-sm font-medium text-primary transition"
        >
          <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 载入示例（含刻意堆砌段落）
        </button>
      </div>

      <!-- 右侧：分析结果（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <BarChart3 class="w-5 h-5 mr-2 text-primary" /> 分析结果
          </h2>
          <span v-if="hasText" class="text-xs text-muted-foreground">实时分析 · 本地计算</span>
        </div>

        <!-- 空状态 -->
        <div v-if="!hasText" class="h-72 flex flex-col items-center justify-center text-center">
          <BarChart3 class="w-10 h-10 text-primary/30 mb-3" />
          <p class="text-sm font-medium text-muted-foreground">在左侧粘贴文章，或点击「载入示例」立即体验</p>
          <p class="text-xs text-muted-foreground/70 mt-1">支持中英文混排，最长 100KB，全部在浏览器本地计算</p>
        </div>

        <template v-else>
          <!-- 统计条 -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div v-for="stat in statCards" :key="stat.label" class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">{{ stat.label }}</p>
              <p class="text-xl font-bold text-foreground">{{ stat.value }}</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">{{ stat.sub }}</p>
            </div>
          </div>

          <!-- 堆砌警示条 / 正常提示 -->
          <div
            v-if="stuffingList.length"
            class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2"
          >
            <TriangleAlert class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p class="text-xs leading-relaxed text-amber-700">
              以下词密度异常（&gt;5%），可能触发搜索引擎反作弊：{{ stuffingText }}
            </p>
          </div>
          <p
            v-else
            class="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2"
          >
            <CheckCircle class="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span class="text-xs leading-relaxed text-green-700">未发现密度超过 5% 的堆砌词，关键词分布处于安全区间。</span>
          </p>

          <!-- 目标词卡 -->
          <div v-if="targetRows.length" class="border border-border rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-muted/50 border-b border-border text-sm font-medium text-foreground">
              目标关键词检查
            </div>
            <p class="px-4 py-2 text-[11px] text-muted-foreground border-b border-border/60">
              判定口径（SEO 经验带，非官方）：&lt;0.5% 偏弱 · 0.5%~2.5% 合理 · 2.5%~5% 偏高 · &gt;5% 堆砌风险；密度分母 = 中文字符数 + 英文词数。
            </p>
            <div class="divide-y divide-border">
              <div v-for="row in targetRows" :key="row.word" class="px-4 py-2.5 flex items-center justify-between gap-3">
                <p class="text-sm font-medium text-foreground truncate" :title="row.word">{{ row.word }}</p>
                <div class="flex items-center gap-3 flex-shrink-0">
                  <span class="text-xs text-muted-foreground font-mono">{{ row.count }} 次 · {{ row.density.toFixed(2) }}%</span>
                  <span
                    class="inline-block px-2 py-0.5 rounded-full border text-[10px] font-medium whitespace-nowrap"
                    :class="JUDGEMENT_META[row.judgement].class"
                  >{{ JUDGEMENT_META[row.judgement].label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- n-gram 词频表 -->
          <div class="border border-border rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-muted/50 border-b border-border flex flex-wrap items-center justify-between gap-2">
              <div class="flex gap-1">
                <button
                  v-for="level in NGRAM_LEVELS"
                  :key="level.n"
                  @click="activeNgram = level.n"
                  class="px-3 py-1 rounded-md text-xs font-medium transition"
                  :class="activeNgram === level.n ? 'bg-primary text-primary-foreground' : 'bg-background border border-border text-muted-foreground hover:text-foreground'"
                >{{ level.label }}</button>
              </div>
              <span class="text-xs text-muted-foreground">分母 {{ tableDenominator }} 个有效 token · 密度 = 次数 ÷ 分母</span>
            </div>

            <div v-if="tableRows.length" class="max-h-[480px] overflow-y-auto">
              <table class="w-full text-sm">
                <thead class="text-xs text-muted-foreground bg-card sticky top-0">
                  <tr>
                    <th class="text-left font-medium px-4 py-2 w-1/2">词</th>
                    <th class="text-right font-medium px-2 py-2">次数</th>
                    <th class="text-right font-medium px-2 py-2">密度</th>
                    <th class="text-left font-medium px-4 py-2 w-[30%]">占比</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border/60">
                  <tr v-for="row in tableRows" :key="row.phrase" :class="row.density > 5 ? 'bg-red-500/10' : ''">
                    <td class="px-4 py-1.5 font-medium text-foreground truncate max-w-0" :title="row.phrase">{{ row.phrase }}</td>
                    <td class="px-2 py-1.5 text-right font-mono text-muted-foreground">{{ row.count }}</td>
                    <td class="px-2 py-1.5 text-right font-mono" :class="row.density > 5 ? 'text-red-600 font-semibold' : 'text-muted-foreground'">{{ row.density.toFixed(2) }}%</td>
                    <td class="px-4 py-1.5">
                      <div class="h-2 rounded-full bg-muted overflow-hidden">
                        <div class="h-full rounded-full" :class="row.density > 5 ? 'bg-red-500' : 'bg-primary/70'" :style="{ width: barWidthOf(row.density) }"></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="px-4 py-6 text-center text-xs text-muted-foreground">没有可统计的有效词元（可能全部是停用词或标点）</p>
            <p class="px-4 py-2.5 text-[11px] text-muted-foreground border-t border-border/60">
              中文按 n-gram 滑窗统计，非语义分词：一元 = 单字 / 单词，二元 = 相邻两字，三元 = 相邻三字；全部由停用字组成的组合（如「的了」「是的」）不计入。
            </p>
          </div>

          <!-- 操作 -->
          <div class="flex flex-wrap gap-2">
            <button
              @click="copyTopTable"
              :disabled="!tableRows.length"
              class="px-4 py-2 bg-primary/10 hover:bg-primary/15 disabled:opacity-40 disabled:cursor-not-allowed border border-primary/20 rounded-lg text-sm font-medium text-primary transition"
            >
              <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" />
              {{ copyState === 'ok' ? '已复制 Top50' : copyState === 'fail' ? '复制失败，请手动复制' : '复制 Top50（TSV）' }}
            </button>
            <button
              @click="resetAll"
              class="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            >
              <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关键词密度是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          关键词密度（Keyword Density）指目标关键词在一段文本中出现的次数除以总词数得到的百分比：密度 = 关键词出现次数 ÷ 全文总词数 × 100%。
          例如一篇总词数 500 的文章里「关键词密度」出现了 10 次，密度就是 2%。它曾是搜索引擎判断页面主题相关性的重要信号，至今仍是 SEO 文案自检的常用指标。
          本工具的目标词检查采用这一口径：出现次数 ÷（中文字符数 + 英文词数）× 100%；n-gram 词频表则用「该档位剔除纯停用词后的有效 token 数」作分母，两处口径已在界面上分别标注。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">密度多少合适？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          SEO 圈内长期沿用的经验带是 0.5%~2.5%：低于 0.5% 通常说明核心词出现太少、页面相关性偏弱；0.5%~2.5% 属于自然合理；
          2.5%~5% 偏高，建议回头削减重复表达；超过 5% 视为堆砌风险。必须诚实说明：这条分界线是从业者的经验总结，
          Google 与百度从未公布过任何官方密度标准，现代排序算法更看重语义相关性与内容质量，密度只作参考，不要为了数字硬凑。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">关键词堆砌为什么有害？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          关键词堆砌（Keyword Stuffing）指通过反复重复关键词来操纵排名。搜索引擎的反作弊系统（如 Google 的 SpamBrain、百度的飓风 / 惊雷算法）会识别这类异常模式，
          轻则页面被降权、排名下滑，重则整站被清出索引；对读者来说，通篇重复的文本也毫无阅读价值，直接损害信任与转化。
          本工具在任一 n-gram 档位发现密度 &gt;5% 的词时，都会红色高亮并在顶部给出黄色警示条。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">中文分词为什么用 n-gram？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          英文单词之间有空格，切词天然完成；中文书写词与词相连，「关键词密度」到底是一个词还是「关键词 + 密度」两个词，需要语义分词模型才能判断。
          本工具不引入分词库，改用 n-gram 滑窗：一元按单字、二元按相邻两字、三元按相邻三字切分，并剔除全部由停用字组成的组合（如「的了」「是的」）。
          这是词频统计口径而非语义分词，单字结果会偏碎，建议重点看二元 / 三元结果与目标词检查，把 n-gram 表当作观察关键词分布的透镜，而不是精确的词典。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么自然提升关键词分布？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          与其提高重复次数，不如把关键词放到权重更高的三个位置：
          ① 标题（Title / H1）放一次核心词；② 首段第一两句自然复述一次，搜索引擎对开头文本的权重更高；
          ③ 小标题（H2 / H3）里用包含核心词的短句复述一次。其余正文用近义词、长尾变体和上下文语境支撑主题，
          既保证相关性，又让密度自然落在合理区间，读起来也不会重复生硬。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">关键词密度多少合适？</h3>
            <p class="text-sm text-muted-foreground mt-1">业内常用的经验区间是 0.5%~2.5%：低于 0.5% 相关性偏弱，0.5%~2.5% 自然合理，2.5%~5% 偏高，超过 5% 有堆砌风险。注意这是从业者经验口径，Google 和百度从未公布官方密度标准，现代算法更看重内容质量与语义相关性，密度仅作自检参考。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">中文文章的关键词密度是怎么统计的？</h3>
            <p class="text-sm text-muted-foreground mt-1">中文没有空格分词，本工具按 n-gram 滑窗统计：一元按单字、二元按相邻两字、三元按相邻三字切分，并剔除全部由停用字组成的组合（如「的了」）。这是词频统计口径，不是语义分词，建议结合目标词检查与二元 / 三元结果综合判断。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">密度超过多少算关键词堆砌？</h3>
            <p class="text-sm text-muted-foreground mt-1">本工具把任一档位密度超过 5% 作为堆砌警示线并红色高亮。堆砌可能被搜索引擎反作弊算法识别，导致页面降权、排名下滑甚至被清出索引；建议把核心词安排在标题、首段、小标题三处，其余用近义表达与长尾变体自然分散。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'keyword-density-checker'" :category="'text'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  BarChart3, Search, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '关键词密度检查器 - 在线SEO关键词密度检测与堆砌分析工具',
  description: '免费在线关键词密度检查工具：粘贴文章全文，实时统计中英文词频、一元/二元/三元 n-gram 密度占比，支持目标关键词四档判定（偏弱/合理/偏高/堆砌风险），密度超过5%自动堆砌警示，可一键复制Top50词表，纯浏览器本地计算不上传文本',
  keywords: '关键词密度,关键词密度检测,seo 关键词,词频统计,文章关键词分析',
  author: '有条工具',
  ogTitle: '关键词密度检查器 - 在线SEO关键词密度检测工具 | 有条工具',
  ogDescription: 'n-gram 词频统计、目标关键词密度四档判定、堆砌风险预警，本地运行不上传。',
  ogUrl: 'https://www.util.cn/tools/keyword-density-checker',
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
          name: '关键词密度检查器',
          url: 'https://www.util.cn/tools/keyword-density-checker',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['中英文文章词频与密度统计', '一元/二元/三元 n-gram Top50 词表', '目标关键词密度四档判定', '密度超 5% 堆砌风险警示', '100KB 大文本本地分析', '一键复制 Top50 表（TSV）']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本工具', item: 'https://www.util.cn/text/' },
            { '@type': 'ListItem', position: 3, name: '关键词密度检查器', item: 'https://www.util.cn/tools/keyword-density-checker/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '关键词密度多少合适？',
              acceptedAnswer: { '@type': 'Answer', text: '业内常用的经验区间是0.5%~2.5%：低于0.5%相关性偏弱，0.5%~2.5%自然合理，2.5%~5%偏高，超过5%有堆砌风险。注意这是从业者经验口径，Google和百度从未公布官方密度标准，现代算法更看重内容质量与语义相关性，密度仅作自检参考。' }
            },
            {
              '@type': 'Question',
              name: '中文文章的关键词密度是怎么统计的？',
              acceptedAnswer: { '@type': 'Answer', text: '中文没有空格分词，本工具按n-gram滑窗统计：一元按单字、二元按相邻两字、三元按相邻三字切分，并剔除全部由停用字组成的组合（如「的了」）。这是词频统计口径，不是语义分词，建议结合目标词检查与二元/三元结果综合判断。' }
            },
            {
              '@type': 'Question',
              name: '密度超过多少算关键词堆砌？',
              acceptedAnswer: { '@type': 'Answer', text: '本工具把任一档位密度超过5%作为堆砌警示线并红色高亮。堆砌可能被搜索引擎反作弊算法识别，导致页面降权、排名下滑甚至被清出索引；建议把核心词安排在标题、首段、小标题三处，其余用近义表达与长尾变体自然分散。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// UTF-8 字节上限：100KB，超出部分截断后仅分析前段
const MAX_INPUT_BYTES = 102400

// 密度判定经验带（SEO 从业者常用口径，非搜索引擎官方标准）：
// <0.5% 偏弱 / 0.5%~2.5% 合理 / 2.5%~5% 偏高 / >5% 堆砌风险
const DENSITY_BANDS = { weak: 0.5, good: 2.5, high: 5 }

// 停用词表（30 个中文虚字 + 30 个英文虚词，共 60 个）：
// 英文整词命中即剔除；中文 n-gram 仅当每个字都是停用字时才剔除
const STOPWORDS = new Set([
  // 中文虚字
  '的', '了', '吗', '呢', '吧', '啊', '呀', '哦', '嘛', '哈',
  '是', '在', '对', '被', '把', '给', '让', '从', '到', '于',
  '也', '都', '很', '太', '更', '最', '又', '再', '就', '才',
  // 英文虚词（小写）
  'is', 'are', 'was', 'were', 'be', 'been', 'the', 'a', 'an', 'of',
  'and', 'to', 'in', 'on', 'for', 'with', 'at', 'by', 'from', 'as',
  'or', 'but', 'not', 'it', 'this', 'that', 'we', 'you', 'they', 'do'
])

// CJK 汉字判定（基本区 + 扩展 A，务实口径）
const CJK_CHAR_RE = /[\u4e00-\u9fff\u3400-\u4dbf]/

// 两位小数四舍五入（密度展示口径）
function round2(x) {
  return Math.round(x * 100) / 100
}

// 单字符 UTF-8 字节数（增补平面按 4 字节计；入参为完整码点字符）
function utf8CharBytes(ch) {
  const cp = ch.codePointAt(0)
  if (cp < 0x80) return 1
  if (cp < 0x800) return 2
  if (cp < 0x10000) return 3
  return 4
}

// 整段文本的 UTF-8 字节数（优先原生 TextEncoder，环境缺失时回退手算）
function utf8ByteLength(text) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text).length
  let bytes = 0
  for (const ch of text) bytes += utf8CharBytes(ch)
  return bytes
}

// 按字节上限截断文本；按码点迭代切分，不会截断代理对
function truncateByBytes(text, maxBytes) {
  if (utf8ByteLength(text) <= maxBytes) return text
  let bytes = 0
  let out = ''
  for (const ch of text) {
    const b = utf8CharBytes(ch)
    if (bytes + b > maxBytes) break
    bytes += b
    out += ch
  }
  return out
}

// 把文本切成「英文词」与「连续中文段」两类片段：英文小写化；中文保留连续段用于滑窗切分
function segmentsOf(text) {
  const segs = []
  const re = /[a-zA-Z0-9]+(?:['’][a-zA-Z0-9]+)*|[\u4e00-\u9fff\u3400-\u4dbf]+/g
  let m
  while ((m = re.exec(text)) !== null) {
    const seg = m[0]
    segs.push(CJK_CHAR_RE.test(seg[0]) ? { type: 'cjk', value: seg } : { type: 'word', value: seg.toLowerCase() })
  }
  return segs
}

// 三项基础计数：中文字符数 / 英文词数 / 总 token（= 中文字符数 + 英文词数，即 n=1 口径的总词数）
function wordCountOf(text) {
  let cjkChars = 0
  let englishWords = 0
  for (const seg of segmentsOf(text)) {
    if (seg.type === 'cjk') cjkChars += seg.value.length
    else englishWords += 1
  }
  return { cjkChars, englishWords, totalTokens: cjkChars + englishWords }
}

// tokenizeOf(text, n)：n=1/2/3 三档词元序列。
// 英文在任何档位都按整词输出；中文按 n 字滑窗切 n-gram，连续段长度不足 n 时不产出词元。
// 注意：这是词频统计口径，非语义分词。
function tokenizeOf(text, n) {
  const size = Math.max(1, Math.floor(n))
  const tokens = []
  for (const seg of segmentsOf(text)) {
    if (seg.type === 'word') {
      tokens.push(seg.value)
    } else {
      const run = seg.value
      for (let i = 0; i + size <= run.length; i++) tokens.push(run.slice(i, i + size))
    }
  }
  return tokens
}

// 「纯停用词」判定：英文整词命中，或中文 gram 的每个字都命中停用字
function isPureStopword(token, stopwords) {
  if (stopwords.has(token)) return true
  if (token.length > 1 && CJK_CHAR_RE.test(token[0])) {
    for (const ch of token) {
      if (!stopwords.has(ch)) return false
    }
    return true
  }
  return false
}

// 该档位有效 token 总数（剔除纯停用词后），作为 n-gram 密度表的分母
function validTokenTotalOf(text, n, stopwords) {
  let total = 0
  for (const tk of tokenizeOf(text, n)) {
    if (!isPureStopword(tk, stopwords)) total += 1
  }
  return total
}

// 词频表：density = count ÷ 有效 token 总数 × 100（2 位小数），按次数降序取前 50
function freqTableOf(text, n, stopwords) {
  const freq = new Map()
  let total = 0
  for (const tk of tokenizeOf(text, n)) {
    if (isPureStopword(tk, stopwords)) continue
    total += 1
    freq.set(tk, (freq.get(tk) || 0) + 1)
  }
  if (total <= 0) return []
  return Array.from(freq.entries())
    .map(([phrase, count]) => ({ phrase, count, density: round2((count / total) * 100) }))
    .sort((a, b) => b.count - a.count || (a.phrase < b.phrase ? -1 : a.phrase > b.phrase ? 1 : 0))
    .slice(0, 50)
}

// 目标词出现次数：
// 含中文 → 原文子串非重叠计数（跨标点不计）；纯英文/数字 → 整词（或连续词序列）匹配，避免 cat 命中 category
function countTargetInText(text, target) {
  const t = target.trim().toLowerCase()
  if (!t) return 0
  if (CJK_CHAR_RE.test(t[0]) || CJK_CHAR_RE.test(t[t.length - 1])) {
    const hay = text.toLowerCase()
    let count = 0
    let from = hay.indexOf(t)
    while (from !== -1) {
      count += 1
      from = hay.indexOf(t, from + t.length)
    }
    return count
  }
  const words = t.split(/\s+/)
  const tokens = tokenizeOf(text, 1)
  let count = 0
  for (let i = 0; i + words.length <= tokens.length; i++) {
    let matched = true
    for (let j = 0; j < words.length; j++) {
      if (tokens[i + j] !== words[j]) { matched = false; break }
    }
    if (matched) count += 1
  }
  return count
}

// 密度四档判定（边界含于「合理」与「偏高」：0.5% 与 2.5% 归合理，5% 归偏高）
function judgeDensity(density) {
  if (density > DENSITY_BANDS.high) return 'stuffing'
  if (density > DENSITY_BANDS.good) return 'high'
  if (density >= DENSITY_BANDS.weak) return 'good'
  return 'weak'
}

// 目标词定向检查：密度 = 次数 ÷（中文字符数 + 英文词数）× 100（SEO 经典总词数口径）
function targetCheckOf(text, targets) {
  const total = wordCountOf(text).totalTokens
  return targets.map((raw) => {
    const word = String(raw).trim()
    const count = total > 0 ? countTargetInText(text, word) : 0
    const density = total > 0 ? round2((count / total) * 100) : 0
    return { word, count, density, judgement: judgeDensity(density) }
  })
}

// 堆砌警示：该档位下密度 >5% 的词（基于 n-gram 词频表）
function stuffingFlagsOf(text, n, stopwords) {
  return freqTableOf(text, n, stopwords).filter((row) => row.density > DENSITY_BANDS.high)
}

// ---------- 示例文本（约 500 字，第三段为刻意堆砌段落，用于演示堆砌警示） ----------
const SAMPLE_TEXT = [
  '关键词密度是 SEO 优化中最经典的概念之一。写完一篇文章后，可以用关键词密度检查工具统计目标关键词出现的次数，再除以全文总词数，得到一个百分比，用来判断关键词布局是否自然。',
  '一般来说，SEO 圈子公认的经验区间是 0.5% 到 2.5%：低于 0.5% 说明目标关键词出现得太少，页面相关性偏弱；保持在 0.5% 到 2.5% 之间说明关键词布局合理，搜索引擎既能识别页面主题，又不会觉得你在刻意讨好算法；超过 2.5% 就属于偏高，最好回头削减重复表达，让密度回到自然水平。',
  '关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度关键词密度！有些优化人员就是靠这样疯狂堆砌关键词密度起家的，而搜索引擎的反作弊算法专治这种关键词堆砌，轻则页面降权重排，重则整站出局。',
  '想让关键词分布自然，正确做法是：把核心关键词放进标题和首段第一句，在小标题里自然复述一次，结尾再呼应收束，其余位置用近义表达和长尾变体来支撑主题，比如本文就用「关键词布局」「词频统计」来分担核心词的压力，标题点题、开头点题、小标题复述各安排一次，全文读起来通顺，密度也刚好落在合理区间。'
].join('\n\n')

// ---------- 页面状态 ----------
// n-gram 三档 tab 定义
const NGRAM_LEVELS = [
  { n: 1, label: '一元（单字/单词）' },
  { n: 2, label: '二元（相邻两字）' },
  { n: 3, label: '三元（相邻三字）' }
]

// 目标词判定徽章（四色：灰 = 偏弱 / 绿 = 合理 / 黄 = 偏高 / 红 = 堆砌风险）
const JUDGEMENT_META = {
  weak: { label: '偏弱', class: 'bg-muted text-muted-foreground border-border' },
  good: { label: '合理', class: 'bg-green-500/10 text-green-600 border-green-500/20' },
  high: { label: '偏高', class: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  stuffing: { label: '堆砌风险', class: 'bg-red-500/10 text-red-600 border-red-500/20' }
}

const inputText = ref('')
const targetInput = ref('')
const activeNgram = ref(1)
const seoContentVisible = ref(true)
const copyState = ref('idle') // idle | ok | fail

const truncatedText = computed(() => truncateByBytes(inputText.value, MAX_INPUT_BYTES))
const isTruncated = computed(() => utf8ByteLength(inputText.value) > MAX_INPUT_BYTES)
const byteDisplay = computed(() => {
  const bytes = utf8ByteLength(inputText.value)
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
})
const counts = computed(() => wordCountOf(truncatedText.value))
const hasText = computed(() => truncatedText.value.trim().length > 0)

// 目标词解析：逗号/顿号/分号/换行分隔，去空、去重（忽略大小写）、最多 20 个
const targets = computed(() => {
  const seen = new Set()
  const list = []
  for (const raw of targetInput.value.split(/[,，、;；\n]+/)) {
    const word = raw.trim()
    if (!word) continue
    const key = word.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    list.push(word)
    if (list.length >= 20) break
  }
  return list
})

const targetRows = computed(() => targetCheckOf(truncatedText.value, targets.value))
const tableRows = computed(() => freqTableOf(truncatedText.value, activeNgram.value, STOPWORDS))
const tableDenominator = computed(() => validTokenTotalOf(truncatedText.value, activeNgram.value, STOPWORDS))

// 堆砌警示：合并三档结果，同词取最高密度，按密度降序取前 8
const stuffingList = computed(() => {
  const best = new Map()
  for (const n of [1, 2, 3]) {
    for (const row of stuffingFlagsOf(truncatedText.value, n, STOPWORDS)) {
      const prev = best.get(row.phrase)
      if (!prev || row.density > prev.density) best.set(row.phrase, { ...row, n })
    }
  }
  return Array.from(best.values()).sort((a, b) => b.density - a.density).slice(0, 8)
})
const stuffingText = computed(() =>
  stuffingList.value.map((row) => `「${row.phrase}」${row.density.toFixed(2)}%`).join('、')
)

const statCards = computed(() => [
  { label: '总字数', value: counts.value.cjkChars, sub: '中文字符' },
  { label: '英文词数', value: counts.value.englishWords, sub: '按空格/标点切词' },
  { label: '有效 token', value: counts.value.totalTokens, sub: '中文字符+英文词' },
  { label: '目标词数', value: targets.value.length, sub: '定向检查' }
])

// 占比条宽度：相对当前表内最高密度归一化（表格按次数降序，首行即最高密度）
function barWidthOf(density) {
  const max = tableRows.value.length ? tableRows.value[0].density : 0
  if (max <= 0) return '0%'
  return `${Math.max(2, Math.min(100, (density / max) * 100))}%`
}

async function copyTopTable() {
  if (!tableRows.value.length) return
  const lines = ['词\t次数\t密度(%)']
  for (const row of tableRows.value) lines.push(`${row.phrase}\t${row.count}\t${row.density.toFixed(2)}`)
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    copyState.value = 'ok'
  } catch (e) {
    copyState.value = 'fail'
  }
  setTimeout(() => { copyState.value = 'idle' }, 2000)
}

function resetAll() {
  inputText.value = ''
  targetInput.value = ''
  activeNgram.value = 1
  copyState.value = 'idle'
}

function loadSample() {
  inputText.value = SAMPLE_TEXT
  targetInput.value = '关键词密度,词频统计'
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('keyword-density-checker')
})
</script>
