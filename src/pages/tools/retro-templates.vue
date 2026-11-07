<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <RefreshCw class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">团队复盘模板</h1>
          <p class="text-sm text-muted-foreground mt-1">KISS / 4Ls / Start-Stop-Continue 三套框架，便利贴式填区、投票聚焦、行动项跟踪与会话存档</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        选择复盘框架后按区分条填写（便利贴式，可多行），点击条目右侧按钮 +1 票聚焦 Top 争议项；
        谈妥的行动写入行动项区（事项 / 负责人 / 截止）。整轮复盘可存档到本地（按日期多轮保存），
        下次会前一键调回；也可导出 Markdown 或直接打印。数据仅保存在本地浏览器，不上传。
      </p>
    </div>

    <!-- 框架 Tab + 会话信息 -->
    <div class="no-print mb-4 flex flex-wrap items-center gap-3">
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="f in FRAMEWORKS"
          :key="f.id"
          type="button"
          @click="switchFramework(f.id)"
          :class="frameworkId === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
          class="px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
        >{{ f.name }}</button>
      </div>
      <div class="flex flex-wrap items-center gap-2 ml-auto">
        <input
          v-model="sessionTitle"
          type="text"
          maxlength="40"
          class="w-44 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="本轮主题，如：迭代 24 复盘"
        />
        <input
          v-model="sessionDate"
          type="date"
          class="px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          @click="archiveSession"
          class="px-3.5 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition flex items-center gap-1.5"
        >
          <Save class="w-4 h-4" /> 存档本轮
        </button>
        <button
          type="button"
          @click="copyMarkdown"
          class="px-3.5 py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition flex items-center gap-1.5"
        >
          <Copy class="w-4 h-4" /> 导出 Markdown
        </button>
        <button
          type="button"
          @click="printAll"
          class="px-3.5 py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition flex items-center gap-1.5"
        >
          <Printer class="w-4 h-4" /> 打印
        </button>
        <button
          type="button"
          @click="clearBoard"
          class="px-3.5 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground transition flex items-center gap-1.5"
        >
          <RotateCw class="w-4 h-4" /> 清空重填
        </button>
      </div>
    </div>

    <!-- 复盘区（便利贴墙） -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <div
        v-for="zone in currentFramework.zones"
        :key="zone.key"
        class="bg-card border border-border rounded-lg p-4 flex flex-col"
      >
        <div class="flex items-center justify-between mb-3">
          <div>
            <p class="font-semibold text-foreground">{{ zone.name }}</p>
            <p class="text-xs text-muted-foreground">{{ zone.hint }}</p>
          </div>
          <span class="text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground">{{ zoneItems(zone.key).length }} 条</span>
        </div>

        <div class="space-y-2 flex-1">
          <div
            v-for="item in zoneItems(zone.key)"
            :key="item.id"
            class="flex items-start gap-1.5 rounded-lg border p-2 transition-all"
            :class="isTop(zone.key, item.id) ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'"
          >
            <textarea
              v-model="item.text"
              rows="2"
              maxlength="120"
              class="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              :placeholder="zone.placeholder"
            ></textarea>
            <div class="flex flex-col items-center gap-1 shrink-0">
              <button
                type="button"
                @click="vote(zone.key, item.id)"
                class="px-1.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-0.5 min-w-[44px] justify-center"
                :class="item.votes > 0 ? 'bg-primary/10 text-primary' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                :title="'+1 票（当前 ' + item.votes + ' 票）'"
              >
                <Vote class="w-3.5 h-3.5" />{{ item.votes }}
              </button>
              <button
                type="button"
                @click="removeItem(zone.key, item.id)"
                class="px-1 text-muted-foreground hover:text-red-500"
                aria-label="删除条目"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          @click="addItem(zone.key)"
          class="mt-3 w-full px-3 py-2 border border-dashed border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition flex items-center justify-center gap-1.5"
        >
          <Plus class="w-3.5 h-3.5" /> 添加便利贴
        </button>
      </div>

      <!-- 行动项区（在 4 列布局中占据最后一格） -->
      <div class="bg-card border border-border rounded-lg p-4 sm:col-span-2 xl:col-span-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <p class="font-semibold text-foreground flex items-center">
              <ListChecks class="w-4 h-4 mr-1.5 text-primary" /> 行动项（事项 / 负责人 / 截止）
            </p>
            <p class="text-xs text-muted-foreground">复盘的产出只有写进行动项才会发生；下轮存档后可跨会话检索跟踪。</p>
          </div>
          <button
            type="button"
            @click="addAction"
            class="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground transition flex items-center gap-1.5"
          >
            <Plus class="w-3.5 h-3.5" /> 添加行动项
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div
            v-for="(a, i) in actions"
            :key="a.id"
            class="flex flex-wrap items-center gap-2"
          >
            <span class="text-xs text-muted-foreground w-5 text-center">{{ i + 1 }}.</span>
            <input
              v-model="a.text"
              type="text"
              maxlength="80"
              class="flex-1 min-w-[160px] px-2.5 py-1.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              :placeholder="'行动项 ' + (i + 1) + '，如：接口超时统一改为 5 秒'"
            />
            <input
              v-model="a.owner"
              type="text"
              maxlength="15"
              class="w-24 px-2.5 py-1.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="负责人"
            />
            <input
              v-model="a.due"
              type="date"
              class="w-36 px-2.5 py-1.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              @click="removeAction(a.id)"
              class="px-1 text-muted-foreground hover:text-red-500"
              aria-label="删除行动项"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
        <p v-if="!actions.length" class="text-xs text-muted-foreground">暂无行动项，讨论收敛后点击「添加行动项」记录。</p>
      </div>
    </div>

    <!-- 会话存档列表 -->
    <div class="no-print bg-card border border-border rounded-lg p-6 mb-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold flex items-center">
          <History class="w-5 h-5 mr-2 text-primary" /> 会话存档（{{ sessions.length }} 轮）
        </h2>
        <p class="text-xs text-muted-foreground">按日期多轮保存，可调回查看或继续编辑。</p>
      </div>
      <div v-if="sessions.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <div
          v-for="s in sessions"
          :key="s.id"
          class="border rounded-lg p-3.5 transition"
          :class="s.frameworkId === frameworkId ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/30'"
        >
          <div class="flex items-center justify-between mb-1.5">
            <p class="text-sm font-semibold">{{ s.title }}</p>
            <span class="text-xs text-muted-foreground">{{ s.date }}</span>
          </div>
          <p class="text-xs text-muted-foreground mb-2">
            {{ s.frameworkName }} · {{ countItems(s) }} 条观点 · {{ (s.actions || []).length }} 条行动项
          </p>
          <p v-if="(s.actions || []).length" class="text-xs text-muted-foreground mb-2 leading-relaxed">
            行动：{{ s.actions.map(a => a.text).filter(Boolean).join('；') }}
          </p>
          <div class="flex gap-1.5">
            <button
              type="button"
              @click="loadSession(s.id)"
              class="px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium hover:bg-primary/20 transition"
            >调回编辑</button>
            <button
              type="button"
              @click="deleteSession(s.id)"
              class="px-2.5 py-1 bg-muted hover:bg-muted/80 text-muted-foreground rounded-md text-xs font-medium transition"
            >删除</button>
          </div>
        </div>
      </div>
      <p v-else class="text-sm text-muted-foreground">暂无存档。填完一轮后点击「存档本轮」，下次复盘前可随时调回。</p>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="group bg-card border border-border rounded-lg p-6 mb-12 no-print" open>
      <summary class="text-2xl font-bold text-foreground cursor-pointer list-none flex items-center justify-between">
        <span><span class="text-primary mr-2">#</span>关于团队复盘</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div class="space-y-4 text-sm text-muted-foreground leading-relaxed mt-4">
        <p>
          团队复盘（Retrospective）是敏捷团队在迭代或项目节点上回顾协作方式的固定仪式：不是汇报做了什么，
          而是回答「哪些做法要继续、哪些要改」。本工具内置三套通行框架——KISS（Keep/Improve/Start/Stop）、
          4Ls（Liked/Learned/Lacked/Longed for）、Start-Stop-Continue，支持分区填条、投票聚焦与行动项跟踪，
          并可按日期多轮存档。
          <span class="text-foreground font-medium">框架与节奏模板仅供参考，正式复盘请结合团队实际调整。</span>
        </p>

        <h3 class="text-lg font-semibold text-foreground">复盘会怎么开：35 分钟节奏</h3>
        <ol class="list-decimal pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">写（10 分钟）</span>：每人静默往各区贴便利贴，先写事实不讨论，避免被先发言的人带偏；</li>
          <li><span class="text-foreground font-medium">分类（5 分钟）</span>：合并重复项，相近观点归到一起，必要时补几个区；</li>
          <li><span class="text-foreground font-medium">讨论（15 分钟）</span>：按投票从高到低逐条过，每条讨论收敛到「要不要改、怎么改」；</li>
          <li><span class="text-foreground font-medium">行动（5 分钟）</span>：把选中的改进写成行动项（事项 / 负责人 / 截止），数量宁少勿多——一轮能落实 2-3 条就够。</li>
        </ol>
        <p>投票的价值就在第三步之前：时间有限时，票数让团队先聊「最多人关心的事」，而不是谁声音大聊谁。</p>

        <h3 class="text-lg font-semibold text-foreground">三套框架怎么选</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">KISS</span>：最通用的四象限（保持/改进/开始/停止），兼顾「做得好的」与「要停的」，适合大多数迭代复盘；</li>
          <li><span class="text-foreground font-medium">4Ls</span>：Liked / Learned / Lacked / Longed for，从情绪与收获切入，适合项目收尾或氛围偏沉的团队；</li>
          <li><span class="text-foreground font-medium">Start-Stop-Continue</span>：只看行动取向，最轻量，适合时间紧或第一次开复盘的团队。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground">心理安全：对事不对人</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>条目写现象与影响，不写名字与动机——「需求评审平均延后 2 天」可以，「某某总是拖延」不行；</li>
          <li>主持人先示范：管理者自己贴一条自我改进项，让大家看到「自我批评」是被允许的；</li>
          <li>讨论时先复述对方的观点再补充，避免「你不对，因为……」式的开场；</li>
          <li>匿名预热：第一次开复盘时可以让大家先匿名写贴再讨论，降低防御。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-foreground">上一轮复盘的行动项怎么跟踪？</h4>
            <p class="mt-1">每轮「存档」后，存档卡片会列出该轮行动项；开会前调回上一轮，先过一遍行动项完成情况再开新一轮，形成闭环。</p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">讨论总是发散收不了尾怎么办？</h4>
            <p class="mt-1">用投票把讨论限定在 Top 3 条内；每条讨论只回答两个问题——「根因是什么」「下一步谁在什么时候做什么」，不答完不进入下一条。</p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">个人议题去哪里谈？</h4>
            <p class="mt-1">涉及个人表现与成长的话题不适合放在集体复盘里，可移步站内 1on1 沟通议程工具单独安排一对一沟通。</p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">复盘后要把结论固化成什么？</h4>
            <p class="mt-1">
              行动项要么进任务系统指定负责人与截止日，要么在下轮复盘开场强制过进度；无法跟踪的「共识」约等于没有。
              需要把目标定得更结构化时，可配合站内 OKR 生成器使用。
            </p>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground">参考来源</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>三套框架（KISS / 4Ls / Start-Stop-Continue）：敏捷回顾（Retrospective）通行框架，结构与区名按社区通行用法整理，模板仅供参考，正式复盘请结合团队实际。</li>
          <li>35 分钟节奏（写 10 / 分类 5 / 讨论 15 / 行动 5）：常见迭代回顾会节奏建议。</li>
          <li>心理安全与「对事不对人」原则：复盘引导（Facilitation）通行实践。</li>
        </ul>
        <p class="text-xs">复盘内容仅保存在你的浏览器 localStorage 中，不上传任何数据。</p>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :current-tool-id="'retro-templates'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  RefreshCw, StickyNote, Plus, Trash2, Vote, Save, History, Printer, Copy,
  ChevronDown, RotateCw, ListChecks
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '团队复盘模板 - KISS/4Ls/Start-Stop-Continue 复盘会工具在线使用',
  description: '在线团队复盘模板：KISS、4Ls、Start-Stop-Continue 三套敏捷复盘框架，便利贴式分区填条、点击投票聚焦 Top 争议项、行动项跟踪（事项/负责人/截止），多轮会话按日期存档到本地，支持导出 Markdown 与打印',
  keywords: '复盘模板, 敏捷回顾, KISS复盘法, 4Ls复盘, 迭代复盘, 团队复盘会, retrospective',
  author: '有条工具',
  ogTitle: '团队复盘模板 - 三套框架投票与行动项跟踪 | 有条工具',
  ogDescription: 'KISS / 4Ls / Start-Stop-Continue 三框架便利贴复盘，投票聚焦、行动项跟踪、多轮存档',
  ogUrl: 'https://www.util.cn/tools/retro-templates',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '团队复盘模板',
  twitterDescription: '三套复盘框架、投票聚焦与行动项跟踪，多轮存档本地保存'
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
          name: '团队复盘模板',
          url: 'https://www.util.cn/tools/retro-templates',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'KISS / 4Ls / Start-Stop-Continue 三套复盘框架',
            '便利贴式分区多行填条',
            '条目投票 +1 聚焦 Top 争议项',
            '行动项记录（事项/负责人/截止）',
            '多轮会话按日期本地存档与调回',
            'Markdown 导出与打印'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '团队复盘模板', item: 'https://www.util.cn/tools/retro-templates/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '复盘会怎么开？35 分钟节奏是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '写 10 分钟（静默贴便利贴）、分类 5 分钟（合并重复）、讨论 15 分钟（按投票从高到低）、行动 5 分钟（写成带负责人与截止的行动项）。模板仅供参考，正式复盘请结合团队实际。' }
            },
            {
              '@type': 'Question',
              name: 'KISS、4Ls、Start-Stop-Continue 三套框架怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: 'KISS 四象限最通用，适合大多数迭代复盘；4Ls 从情绪与收获切入，适合项目收尾；Start-Stop-Continue 最轻量，适合时间紧或第一次开复盘的团队。' }
            },
            {
              '@type': 'Question',
              name: '复盘会上的心理安全怎么做？',
              acceptedAnswer: { '@type': 'Answer', text: '条目写现象与影响、不写名字与动机；主持人先贴一条自我改进项示范；讨论先复述对方观点再补充；第一次复盘可先匿名写贴再讨论。' }
            },
            {
              '@type': 'Question',
              name: '上一轮复盘的行动项怎么跟踪？',
              acceptedAnswer: { '@type': 'Answer', text: '每轮存档后，存档卡片列出该轮行动项；下次开会前调回上一轮，先过一遍行动项完成情况再开新一轮，形成闭环。' }
            }
          ]
        }
      ]
    })
  }]
})

/* ==== PURE:BEGIN ==== */
// 三套复盘框架（区名与键位固定）
const FRAMEWORKS = [
  {
    id: 'kiss',
    name: 'KISS 复盘法',
    zones: [
      { key: 'keep', name: 'Keep 保持', hint: '做得好、要继续保持的', placeholder: '如：每日站会控制在 10 分钟内' },
      { key: 'improve', name: 'Improve 改进', hint: '在做了、但可以更好的', placeholder: '如：评审到开发平均等待 2 天' },
      { key: 'start', name: 'Start 开始', hint: '下一步该新启动的', placeholder: '如：需求冻结窗口期' },
      { key: 'stop', name: 'Stop 停止', hint: '应该停掉的', placeholder: '如：口头传需求不再记录' }
    ]
  },
  {
    id: 'fourls',
    name: '4Ls 复盘法',
    zones: [
      { key: 'liked', name: 'Liked 喜欢', hint: '这次做得好的', placeholder: '如：故障演练提前暴露了备份问题' },
      { key: 'learned', name: 'Learned 学到', hint: '新学到的经验', placeholder: '如：大促容量要按峰值 1.5 倍估算' },
      { key: 'lacked', name: 'Lacked 缺乏', hint: '缺少的资源或能力', placeholder: '如：缺压测环境，回归靠手点' },
      { key: 'longed', name: 'Longed for 渴望', hint: '希望拥有的', placeholder: '如：希望需求变更走统一看板' }
    ]
  },
  {
    id: 'ssc',
    name: 'Start-Stop-Continue',
    zones: [
      { key: 'start', name: 'Start 开始', hint: '开始做', placeholder: '如：每个需求带验收标准' },
      { key: 'stop', name: 'Stop 停止', hint: '停止做', placeholder: '如：停止在群里散排期' },
      { key: 'continue', name: 'Continue 继续', hint: '继续做', placeholder: '如：继续双周联合评审' }
    ]
  }
]

function getFramework(id) {
  return FRAMEWORKS.find((f) => f.id === id) || FRAMEWORKS[0]
}

// 空白工作区：框架各区的条目列表 + 行动项
function emptyItems(framework) {
  const items = {}
  for (const z of framework.zones) items[z.key] = []
  return items
}

let itemSeq = 0
function newItem(text) {
  itemSeq += 1
  return { id: 'i' + itemSeq, text: String(text || ''), votes: 0 }
}

// 投票 +1（不可为负，返回新计数）
function voteItem(items, zoneKey, itemId, delta) {
  const list = items && items[zoneKey]
  if (!list) return -1
  const item = list.find((x) => x.id === itemId)
  if (!item) return -1
  const d = Number(delta) === -1 ? -1 : 1
  item.votes = Math.max(0, item.votes + d)
  return item.votes
}

// 区内 Top 项：票数最高且 >0 的条目 id 集合
function topVotedIds(items, zoneKey) {
  const list = (items && items[zoneKey]) || []
  const max = list.reduce((m, x) => Math.max(m, Number(x.votes) || 0), 0)
  if (max <= 0) return new Set()
  return new Set(list.filter((x) => (Number(x.votes) || 0) === max).map((x) => x.id))
}

// 导出 Markdown：含各框架区名与全部条目（带票数）、行动项
function buildMarkdown(framework, title, date, items, actions) {
  const lines = []
  lines.push('# 团队复盘 — ' + framework.name + (title ? '（' + title + '）' : ''), '')
  if (date) lines.push('> 复盘日期：' + date, '')
  for (const z of framework.zones) {
    const list = (items && items[z.key]) || []
    const top = topVotedIds(items, z.key)
    lines.push('## ' + z.name + '（' + list.length + ' 条）', '')
    if (list.length) {
      for (const x of list) {
        const votes = (Number(x.votes) || 0) > 0 ? '（' + x.votes + ' 票）' : ''
        const badge = top.has(x.id) && (Number(x.votes) || 0) > 0 ? '[Top]' : ''
        lines.push('- ' + (x.text.trim() || '（未填写）') + votes + badge)
      }
    } else {
      lines.push('- （暂无条目）')
    }
    lines.push('')
  }
  const acts = Array.isArray(actions) ? actions.filter((a) => a && String(a.text).trim()) : []
  lines.push('## 行动项（' + acts.length + ' 条）', '')
  if (acts.length) {
    for (const a of acts) {
      const meta = [a.owner ? '负责人：' + a.owner : '', a.due ? '截止：' + a.due : ''].filter(Boolean).join('，')
      lines.push('- [ ] ' + String(a.text).trim() + (meta ? '（' + meta + '）' : ''))
    }
    lines.push('')
  } else {
    lines.push('- （暂无行动项）', '')
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

// 会话存档：保存一轮（按日期倒序插入），按 id 检索与删除
function insertSession(sessions, session) {
  const list = [session].concat(Array.isArray(sessions) ? sessions.filter((s) => s && s.id !== session.id) : [])
  return list.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
}

function findSession(sessions, sessionId) {
  return (sessions || []).find((s) => s && s.id === sessionId) || null
}

function removeSession(sessions, sessionId) {
  return (sessions || []).filter((s) => s && s.id !== sessionId)
}

// 跨会话行动项检索：按会话 id 取该轮全部行动项
function actionsOfSession(sessions, sessionId) {
  const s = findSession(sessions, sessionId)
  return s ? ((s.actions || []).filter((a) => a && a.text)) : []
}

function countSessionItems(session) {
  if (!session || !session.items) return 0
  return Object.values(session.items).reduce((a, list) => a + (Array.isArray(list) ? list.length : 0), 0)
}

function todayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
/* ==== PURE:END ==== */

// ---------- 页面状态 ----------
const STORAGE_KEY = 'retro-templates'
const frameworkId = ref('kiss')
const sessionTitle = ref('')
const sessionDate = ref('')
const items = reactive(emptyItems(FRAMEWORKS[0]))
const actions = ref([])
const sessions = ref([])

const tool = tools.find((t) => t.id === 'retro-templates')

const currentFramework = computed(() => getFramework(frameworkId.value))

function zoneItems(zoneKey) {
  return items[zoneKey] || []
}

function isTop(zoneKey, itemId) {
  return topVotedIds(items, zoneKey).has(itemId)
}

// 每个框架独立工作区：切换时暂存当前、恢复目标框架（避免互相串数据）
const workspaces = {}

function switchFramework(id) {
  if (frameworkId.value === id) return
  workspaces[frameworkId.value] = snapshot()
  frameworkId.value = id
  const saved = workspaces[id]
  restore(saved || { title: sessionTitle.value, date: sessionDate.value, items: emptyItems(getFramework(id)), actions: [] })
}

function snapshot() {
  return {
    title: sessionTitle.value,
    date: sessionDate.value,
    items: JSON.parse(JSON.stringify(items)),
    actions: actions.value.map((a) => ({ ...a }))
  }
}

function restore(state) {
  sessionTitle.value = state.title || ''
  sessionDate.value = state.date || todayStr()
  // 目标框架各区重建（框架变化时区键可能不同）
  const fresh = emptyItems(currentFramework.value)
  for (const k of Object.keys(fresh)) {
    fresh[k] = (state.items && state.items[k] ? state.items[k] : []).map((x) => ({
      id: x.id || 'x' + Math.random().toString(36).slice(2, 8),
      text: String(x.text || ''),
      votes: Math.max(0, Number(x.votes) || 0)
    }))
  }
  Object.keys(items).forEach((k) => delete items[k])
  Object.assign(items, fresh)
  actions.value = (state.actions || []).map((a) => ({ ...a }))
}

function makeId() {
  return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// ---------- 条目与投票 ----------
function addItem(zoneKey) {
  if (!items[zoneKey]) items[zoneKey] = []
  items[zoneKey].push(newItem(''))
}

function removeItem(zoneKey, itemId) {
  items[zoneKey] = (items[zoneKey] || []).filter((x) => x.id !== itemId)
}

function vote(zoneKey, itemId) {
  voteItem(items, zoneKey, itemId, 1)
  persistState()
}

// ---------- 行动项 ----------
function addAction() {
  actions.value.push({ id: makeId(), text: '', owner: '', due: '' })
}

function removeAction(id) {
  actions.value = actions.value.filter((a) => a.id !== id)
}

// ---------- 会话存档 ----------
function archiveSession() {
  const hasContent = countSessionItems({ items }) > 0 || actions.value.some((a) => a.text.trim())
  if (!hasContent) {
    alert('当前没有可存档的内容，先填写复盘条目或行动项。')
    return
  }
  const snap = snapshot()
  const session = {
    id: makeId(),
    date: snap.date || todayStr(),
    title: snap.title || currentFramework.value.name,
    frameworkId: frameworkId.value,
    frameworkName: currentFramework.value.name,
    items: snap.items,
    actions: snap.actions.filter((a) => a.text.trim())
  }
  sessions.value = insertSession(sessions.value, session)
  persistState()
  alert('已存档本轮（' + session.date + ' · ' + session.title + '），行动项 ' + session.actions.length + ' 条')
}

function loadSession(id) {
  const s = findSession(sessions.value, id)
  if (!s) return
  if (FRAMEWORKS.some((f) => f.id === s.frameworkId)) {
    frameworkId.value = s.frameworkId
  }
  restore({ title: s.title, date: s.date, items: s.items, actions: s.actions })
  persistState()
}

function deleteSession(id) {
  const s = findSession(sessions.value, id)
  if (!s) return
  if (!confirm('删除存档「' + s.title + '（' + s.date + '）」？')) return
  sessions.value = removeSession(sessions.value, id)
  persistState()
}

function clearBoard() {
  if (!confirm('清空当前画板？已存档的会话不受影响。')) return
  restore({ title: '', date: todayStr(), items: emptyItems(currentFramework.value), actions: [] })
  persistState()
}

// ---------- 导出 ----------
const markdownText = computed(() => buildMarkdown(currentFramework.value, sessionTitle.value, sessionDate.value, items, actions.value))

function fallbackCopy(text, successMsg) {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert(successMsg)
  } catch (e) {
    alert('复制失败，请手动选择文本复制')
  }
}

async function copyMarkdown() {
  try {
    await navigator.clipboard.writeText(markdownText.value)
    alert('已复制')
  } catch (e) {
    fallbackCopy(markdownText.value, '已复制')
  }
}

function printAll() {
  window.print()
}

// ---------- 持久化（仅客户端） ----------
let persistTimer = null
function persistState() {
  if (persistTimer) return
  persistTimer = setTimeout(() => {
    persistTimer = null
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        frameworkId: frameworkId.value,
        sessions: sessions.value,
        draft: snapshot()
      }))
    } catch (e) { /* localStorage 不可用时静默降级 */ }
  }, 300)
}

watch([frameworkId, sessionTitle, sessionDate, items, actions], () => {
  persistState()
}, { deep: true })

onMounted(() => {
  if (tool) addRecentTool(tool.id)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const d = JSON.parse(raw)
      if (d && Array.isArray(d.sessions)) sessions.value = d.sessions
      const fid = d && d.frameworkId && getFramework(d.frameworkId) ? d.frameworkId : 'kiss'
      if (fid !== frameworkId.value) frameworkId.value = fid
      restore(d && d.draft ? d.draft : { title: '', date: '', items: emptyItems(currentFramework.value), actions: [] })
    } else {
      sessionDate.value = todayStr()
    }
  } catch (e) { /* 忽略损坏的本地数据 */ }
  if (!sessionDate.value) sessionDate.value = todayStr()
})
</script>

<style scoped>
@media print {
  @page {
    size: A4 portrait;
    margin: 12mm;
  }

  .no-print {
    display: none !important;
  }
}
</style>
