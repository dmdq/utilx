<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FilePen class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">述职报告大纲生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">转正 / 晋升 / 年终三场景骨架，要点勾选 + STAR 展开 + 分钟级时间盒，直接出大纲讲稿</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        选择述职场景后自动给出该场景的通行大纲骨架；从要点库勾选要讲的点，每个要点自带引导问题；
        重点项目用 STAR 法则卡逐项填一行，展开为一段完整表述。按 5 / 8 / 10 分钟述职时长自动给各节分配秒级时间盒，
        上台讲话可以对着表推进。大纲可复制为 Markdown，也可直接打印。草稿自动保存在本地浏览器。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：场景 + 时长 + 要点库 + STAR 卡 -->
      <div class="no-print space-y-6">
        <!-- 场景与时长 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ListChecks class="w-5 h-5 mr-2 text-primary" /> 第一步：选场景与时长
          </h2>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">述职场景</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="s in SCENES"
                :key="s.id"
                type="button"
                @click="selectScene(s.id)"
                :class="sceneId === s.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
              >{{ s.label }}</button>
            </div>
            <p class="text-xs text-muted-foreground mt-2">{{ currentScene.desc }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">述职时长</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="m in DURATIONS"
                :key="m"
                type="button"
                @click="minutes = m"
                :class="minutes === m ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
              >{{ m }} 分钟</button>
            </div>
            <p class="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Clock class="w-3.5 h-3.5" /> 各节时间盒按通行配比自动折算，总和恒等于所选时长。
            </p>
          </div>
        </div>

        <!-- 要点库 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 第二步：勾选要点（自带引导问题）
          </h2>
          <div
            v-for="sec in currentScene.sections"
            :key="sec.key"
            class="border border-border rounded-lg p-4"
          >
            <p class="text-sm font-medium text-foreground mb-2">
              {{ sec.title }}
              <span class="text-xs text-muted-foreground font-normal ml-1">已选 {{ checkedCountOf(sec) }}/{{ sec.points.length }}</span>
            </p>
            <div class="space-y-2">
              <label
                v-for="p in sec.points"
                :key="p.id"
                class="flex items-start gap-2 text-sm text-foreground cursor-pointer"
              >
                <input
                  v-model="checkedIds"
                  :value="p.id"
                  type="checkbox"
                  class="mt-0.5 w-4 h-4 rounded border border-border shrink-0"
                />
                <span>
                  <span class="font-medium">{{ p.label }}</span>
                  <span class="block text-xs text-muted-foreground mt-0.5">{{ p.question }}</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- STAR 法则卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="starEnabled" type="checkbox" class="w-4 h-4 rounded border border-border shrink-0" />
            <span class="text-lg font-semibold flex items-center">
              <Star class="w-5 h-5 mr-1.5 text-primary" /> STAR 法则卡（重点项目展开为段落）
            </span>
          </label>
          <p class="text-xs text-muted-foreground leading-relaxed">
            勾选后，填写的 STAR 四要素会拼接为一段完整表述，插入「{{ starHostName }}」一节；逐项引导填一行即可。
          </p>
          <div v-if="starEnabled" class="space-y-3">
            <div v-for="f in STAR_FIELDS" :key="f.key">
              <label :for="'star-' + f.key" class="block text-sm font-medium text-foreground mb-1">{{ f.label }}</label>
              <input
                :id="'star-' + f.key"
                v-model="star[f.key]"
                type="text"
                maxlength="80"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                :placeholder="f.prompt"
              />
            </div>
            <p v-if="starFilledCount < 5" class="text-xs text-muted-foreground">
              还剩 {{ 5 - starFilledCount }} 项未填，未填位置在大纲中以「____」显示。
            </p>
          </div>
        </div>
      </div>

      <!-- 右侧：大纲预览（打印输出区） -->
      <div class="print-area">
        <div class="no-print flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <FilePen class="w-5 h-5 mr-2 text-primary" /> 大纲预览
          </h2>
          <span class="text-xs text-muted-foreground">共 {{ outlineData.sections.length }} 节 · 勾选 {{ checkedTotal }} 点 · {{ minutes }} 分钟</span>
        </div>

        <div class="bg-white text-black border border-border rounded-lg shadow-sm p-6 sm:p-8">
          <p class="text-center text-2xl font-bold mb-1">{{ currentScene.label }}大纲</p>
          <p class="text-center text-sm text-black/70 mb-5">总时长 {{ minutes }} 分钟 · 时间盒标注到节</p>
          <div v-for="(sec, i) in outlineData.sections" :key="sec.key" class="mb-5">
            <div class="flex items-center justify-between border-b border-black/20 pb-1.5 mb-2">
              <p class="font-bold text-[16px]">{{ cnNum(i) }}、{{ sec.title }}</p>
              <span class="text-xs bg-black/5 rounded-full px-2 py-0.5 text-black/70">时间盒 {{ fmtSeconds(sec.seconds) }}</span>
            </div>
            <ul v-if="sec.points.length" class="space-y-1.5">
              <li v-for="p in sec.points" :key="p.label" class="text-[14px] leading-relaxed flex gap-2">
                <span class="shrink-0 mt-0.5 w-3.5 h-3.5 border border-black/40 rounded-sm"></span>
                <span><span class="font-medium">{{ p.label }}</span>——{{ p.question }}</span>
              </li>
            </ul>
            <p v-else class="text-xs text-black/40">（此节暂未勾选要点，可从左侧要点库勾选）</p>
            <blockquote v-if="sec.star" class="mt-2 border-l-4 border-black/30 pl-3 text-[14px] leading-relaxed whitespace-pre-wrap">
              {{ sec.star }}
            </blockquote>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mt-4 no-print">
          <button
            type="button"
            @click="copyOutline"
            class="flex-1 min-w-[120px] px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
          >
            <Copy class="w-4 h-4" /> 复制 Markdown 大纲
          </button>
          <button
            type="button"
            @click="printOutline"
            class="flex-1 min-w-[120px] px-4 py-2.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition flex items-center justify-center gap-1.5"
          >
            <Printer class="w-4 h-4" /> 打印 / 另存 PDF
          </button>
        </div>
        <p class="no-print text-xs text-muted-foreground mt-3">
          打印时只输出右侧大纲纸面。Markdown 可直接粘贴进飞书 / Notion 继续写成逐字稿。
        </p>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="group bg-card border border-border rounded-lg p-6 mb-12 no-print" open>
      <summary class="text-2xl font-bold text-foreground cursor-pointer list-none flex items-center justify-between">
        <span><span class="text-primary mr-2">#</span>关于述职报告</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div class="space-y-4 text-sm text-muted-foreground leading-relaxed mt-4">
        <p>
          述职报告是在主管、HR 或评审面前系统讲清「你做了什么、做得怎么样、凭什么值得转正 / 晋升 / 高绩效」的一次结构化陈述。
          本工具内置转正述职、晋升述职、年终总结三套通行骨架：转正述职围绕岗位认知、工作成果、不足与计划；
          晋升述职按业绩贡献、能力证明、团队影响、未来规划四层展开；年终总结则用年度回顾、亮点项目、数据说话、复盘不足、明年规划收束全年。
          勾选要点后自动生成带引导问题的 Markdown 大纲，并按所选时长折算每节的时间盒。
          <span class="text-foreground font-medium">模板仅供参考，正式文书请结合实际岗位与公司评审口径调整。</span>
        </p>

        <h3 class="text-lg font-semibold text-foreground">述职三忌</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">忌流水账</span>：逐周逐月罗列做过的事，没有主线。评审想听的是「你挑了两三件最有分量的成果讲透」，而不是「你很忙」。</li>
          <li><span class="text-foreground font-medium">忌无数据</span>：通篇「大幅提升」「效果很好」这类形容词。没有数字的成果无法评估，也无法与同级候选人比较。</li>
          <li><span class="text-foreground font-medium">忌甩锅</span>：把不足全部归因于客观条件（需求变动、资源不足）。评审更认可「我可控的部分没做好，我打算这样改」。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground">数据化表达示例</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>「提升了 30%」→「DAU 从 1.0 万到 1.3 万（2025-03 → 2025-09，平台自身环比剔除自然增长）」</li>
          <li>「效率大幅提升」→「人工审核时长从 25 分钟/单降到 8 分钟/单，审核人力从 6 人减到 4 人」</li>
          <li>「带了很多新人」→「带教 2 名新人，3 个月后均可独立承接需求，新人上手周期缩短约一半」</li>
          <li>「系统稳定性变好」→「线上 P0 故障从年均 4 次降到 1 次，可用性从 99.5% 到 99.9%」</li>
        </ul>
        <p>写数据的原则：给绝对值和口径（从多少到多少、统计区间），必要时补相对值；无法给出精确数时给区间也比形容词强。</p>

        <h3 class="text-lg font-semibold text-foreground">STAR 法则怎么用</h3>
        <p>
          STAR 是 Situation（情境）、Task（任务）、Action（行动）、Result（结果）四要素的结构化叙事法，源自行为面试实践，
          也是述职里讲项目的通行框架：一句话交代背景与压力（S），明确你承担的目标（T），突出你的关键动作而非团队动作（A），
          收在可量化的结果上（R）。本工具的 STAR 法则卡逐项引导你填一行，勾选后自动拼接为段落插入大纲。
        </p>

        <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-foreground">5 / 8 / 10 分钟分别适合什么场合？</h4>
            <p class="mt-1">
              5 分钟适合转正述职与批量评审（每人限时短讲）；8 分钟是多数晋升述职的常见限时；10 分钟适合年终述职或需现场演示的场合。
              时间盒按各节通行配比折算，总和恒等于所选时长，超时风险最高的「成果」一节占比最大。
            </p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">要点该全讲还是挑着讲？</h4>
            <p class="mt-1">
              挑着讲。每节勾 1-2 个最有证据的要点即可，其余在大纲里留着当答疑储备。宁可一两个项目讲透，也不要把 10 个项目都念一遍。
            </p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">不足与规划部分怎么写才不扣分？</h4>
            <p class="mt-1">
              不足写「影响产出、且自己可控」的那一项，配上具体改进动作与时间点；规划对齐团队下一阶段目标，写成可验收的目标而不是态度。
              与其写「继续努力」，不如写「下季度把 X 指标从 A 做到 B」。
            </p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">想把目标定得更结构化怎么办？</h4>
            <p class="mt-1">
              规划部分可以配合站内 <a href="/tools/okr-generator/" class="text-primary hover:underline">OKR 生成器</a> 使用：
              把「明年规划」写成 O + KR 的形式，评审更容易验收，明年年终总结也有对照基准。
            </p>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground">参考来源</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>三场景大纲骨架：按各公司 HR 与管理者公开分享的述职评审通行结构（岗位认知/成果/计划、业绩/能力/影响/规划、回顾/亮点/数据/复盘/规划）整理，模板仅供参考，正式文书请结合实际。</li>
          <li>STAR 法则：行为面试通行的情境-任务-行动-结果结构化叙事框架。</li>
          <li>时间盒配比：按「成果类内容占时长 40%-50%」的通行述职建议折算为秒级分配。</li>
        </ul>
        <p class="text-xs">填写内容仅保存在你的浏览器 localStorage 中用于恢复草稿，不上传任何数据。</p>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :current-tool-id="'performance-review-outline'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  FilePen, ListChecks, CheckCircle, Clock, Star, Copy, Printer, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '述职报告大纲生成器 - 转正/晋升/年终述职模板与时间分配',
  description: '在线述职报告大纲生成器：转正述职、晋升述职、年终总结三场景通行骨架，要点库勾选自带引导问题，STAR 法则卡重点项目展开为段落，5/8/10 分钟秒级时间盒自动分配，一键复制 Markdown 与打印，草稿本地保存',
  keywords: '述职报告大纲, 述职报告怎么写, 转正述职模板, 晋升述职PPT大纲, 年终总结大纲, STAR法则, 述职时间分配',
  author: '有条工具',
  ogTitle: '述职报告大纲生成器 - 转正/晋升/年终三场景 | 有条工具',
  ogDescription: '三场景骨架 + 要点勾选 + STAR 展开 + 秒级时间盒，直接生成可打印述职大纲',
  ogUrl: 'https://www.util.cn/tools/performance-review-outline',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '述职报告大纲生成器',
  twitterDescription: '转正/晋升/年终三场景大纲，STAR 展开与时间盒分配，一键复制打印'
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
          name: '述职报告大纲生成器',
          url: 'https://www.util.cn/tools/performance-review-outline',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '转正/晋升/年终三场景大纲骨架',
            '要点库勾选自带引导问题',
            'STAR 法则卡重点项目展开为段落',
            '5/8/10 分钟秒级时间盒自动分配',
            'Markdown 大纲一键复制与打印',
            '草稿本地保存不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '述职报告大纲生成器', item: 'https://www.util.cn/tools/performance-review-outline/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '5 / 8 / 10 分钟分别适合什么述职场合？',
              acceptedAnswer: { '@type': 'Answer', text: '5 分钟适合转正述职与批量评审短讲；8 分钟是多数晋升述职的常见限时；10 分钟适合年终述职或需现场演示的场合。时间盒按各节通行配比折算，总和恒等于所选时长。' }
            },
            {
              '@type': 'Question',
              name: '述职要点该全讲还是挑着讲？',
              acceptedAnswer: { '@type': 'Answer', text: '挑着讲。每节勾 1-2 个最有证据的要点即可，其余留作答疑储备；宁可一两个项目讲透，也不要把十个项目都念一遍。' }
            },
            {
              '@type': 'Question',
              name: 'STAR 法则在述职里怎么用？',
              acceptedAnswer: { '@type': 'Answer', text: 'STAR 是 Situation（情境）、Task（任务）、Action（行动）、Result（结果）的结构化叙事法：一句话交代背景、明确你承担的目标、突出你的关键动作、收在可量化的结果上。本工具的 STAR 法则卡逐项引导填一行并自动拼接为段落。' }
            },
            {
              '@type': 'Question',
              name: '不足与规划部分怎么写才不扣分？',
              acceptedAnswer: { '@type': 'Answer', text: '不足写影响产出且自己可控的一项，配具体改进动作与时间点；规划对齐团队下一阶段目标，写成可验收的目标而不是态度。模板仅供参考，正式文书请结合实际。' }
            }
          ]
        }
      ]
    })
  }]
})

/* ==== PURE:BEGIN ==== */
const CN_NUMS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
const DURATIONS = [5, 8, 10]
const PLACEHOLDER = '____'

// 三场景通行骨架（自核：转正=岗位认知/成果/不足与计划；晋升=业绩/能力/团队影响/规划；年终=回顾/STAR亮点/数据/复盘/规划）
const SCENES = [
  {
    id: 'probation',
    label: '转正述职',
    desc: '围绕「岗位认知—工作成果—不足与计划」三层，重点证明已独立胜任本岗位。',
    sections: [
      {
        key: 'cognition', title: '岗位认知', weight: 2,
        points: [
          { id: 'pb-c1', label: '岗位职责理解', question: '你如何理解这个岗位的核心职责？入职以来这个认知有什么变化？' },
          { id: 'pb-c2', label: '关键考核维度', question: '这个岗位的关键考核维度是什么？你目前处在什么水平？' },
          { id: 'pb-c3', label: '协作关系与流程', question: '你和上下游如何协作？已经跑通了哪些流程？' }
        ]
      },
      {
        key: 'results', title: '工作成果', weight: 5,
        points: [
          { id: 'pb-r1', label: '重点项目成果', question: '入职以来最有分量的一个成果是什么？用数据说明。' },
          { id: 'pb-r2', label: '日常职责达成', question: '日常职责完成情况如何？有什么按时按质的证据？' },
          { id: 'pb-r3', label: '主动改进', question: '有没有主动发现并推动改进的问题或流程？' },
          { id: 'pb-r4', label: '学习与上手速度', question: '多快掌握了业务、工具或代码库？有什么可以证明？' }
        ]
      },
      {
        key: 'gaps', title: '不足与计划', weight: 3,
        points: [
          { id: 'pb-g1', label: '短板与改进措施', question: '你目前的短板是什么？打算怎么补、多久补上？' },
          { id: 'pb-g2', label: '转正后目标', question: '转正后的第一个季度你计划达成什么？' },
          { id: 'pb-g3', label: '需要的支持', question: '你需要主管或公司提供什么支持？' }
        ]
      }
    ]
  },
  {
    id: 'promotion',
    label: '晋升述职',
    desc: '按「业绩贡献—能力证明—团队影响—未来规划」四层，对照下一职级标准举证。',
    sections: [
      {
        key: 'contribution', title: '业绩贡献', weight: 4,
        points: [
          { id: 'pr-c1', label: '核心业绩对照目标', question: '本聘期核心业绩是多少？对照目标完成率如何？' },
          { id: 'pr-c2', label: '关键项目复盘', question: '最能代表你水平的项目是哪个？难度和你个人的贡献分别是什么？' },
          { id: 'pr-c3', label: '长期价值沉淀', question: '你的工作给业务或团队留下了什么可复用的资产？' }
        ]
      },
      {
        key: 'ability', title: '能力证明', weight: 3,
        points: [
          { id: 'pr-a1', label: '能力跃迁', question: '相比上一职级，你证明了自己的哪些能力跃迁？' },
          { id: 'pr-a2', label: '方法论沉淀', question: '你沉淀了什么可复制的方法论？被谁复用过？' },
          { id: 'pr-a3', label: '独立攻坚经历', question: '有没有独立或牵头攻坚复杂问题的经历？' }
        ]
      },
      {
        key: 'team', title: '团队影响', weight: 2,
        points: [
          { id: 'pr-t1', label: '带教与培养', question: '你带教过谁？对方现在能独立做什么了？' },
          { id: 'pr-t2', label: '跨团队推动', question: '你推动过哪些跨团队的协作或标准？' },
          { id: 'pr-t3', label: '氛围与梯队', question: '你对团队氛围或梯队建设做了什么？' }
        ]
      },
      {
        key: 'plan', title: '未来规划', weight: 1,
        points: [
          { id: 'pr-p1', label: '晋升后目标', question: '晋升到下一职级后的第一个目标是什么？' },
          { id: 'pr-p2', label: '业务与团队规划', question: '你打算如何规划业务方向与团队分工？' },
          { id: 'pr-p3', label: '风险与应对', question: '你预判的最大风险是什么？怎么应对？' }
        ]
      }
    ]
  },
  {
    id: 'annual',
    label: '年终总结',
    desc: '用「年度回顾—亮点项目—数据说话—复盘不足—明年规划」收束全年，突出数据与复盘。',
    sections: [
      {
        key: 'review', title: '年度回顾', weight: 3,
        points: [
          { id: 'an-r1', label: '年度关键节点', question: '这一年按季度串起来的关键节点是什么？' },
          { id: 'an-r2', label: '目标完成率', question: '年初定的目标完成率是多少？逐项对照。' },
          { id: 'an-r3', label: '日常职责盘点', question: '日常职责这块全年运转情况如何？' }
        ]
      },
      {
        key: 'star', title: '亮点项目（STAR 展开）', weight: 4,
        points: [
          { id: 'an-s1', label: '用 STAR 讲透一个项目', question: '选一个最有代表性的项目，按情境-任务-行动-结果展开（配合下方 STAR 卡）。' }
        ]
      },
      {
        key: 'data', title: '数据说话', weight: 2,
        points: [
          { id: 'an-d1', label: '核心指标对比', question: '核心指标的期初/期末数据是什么？' },
          { id: 'an-d2', label: '效率与成本', question: '效率提升或成本节约有没有数字？' },
          { id: 'an-d3', label: '口碑与评价', question: '用户、客户或协作方的评价有什么可以引用的？' }
        ]
      },
      {
        key: 'retro', title: '复盘不足', weight: 2,
        points: [
          { id: 'an-x1', label: '未达预期事项', question: '哪些事没达预期？客观与主观原因各占多少？' },
          { id: 'an-x2', label: '改进动作', question: '针对这些不足，你已经开始了什么改进动作？' }
        ]
      },
      {
        key: 'next', title: '明年规划', weight: 3,
        points: [
          { id: 'an-n1', label: '明年核心目标', question: '明年最重要的三个目标是什么？' },
          { id: 'an-n2', label: '个人能力计划', question: '明年你打算补齐什么能力？' },
          { id: 'an-n3', label: '资源与诉求', question: '你需要公司给什么资源或授权？' }
        ]
      }
    ]
  }
]

// STAR 法则卡：各场景下展开段落的挂载小节
const STAR_HOST = { probation: 'results', promotion: 'contribution', annual: 'star' }
const STAR_FIELDS = [
  { key: 'project', label: '项目名称', prompt: '如：商家对账系统重构（一行写清项目与你的角色）' },
  { key: 's', label: 'Situation 背景', prompt: '如：月底对账差错率高，财务每周加班两天（一行写清背景与压力）' },
  { key: 't', label: 'Task 任务', prompt: '如：负责对账核心链路重构，目标差错率降到 0.1% 以下' },
  { key: 'a', label: 'Action 行动', prompt: '如：引入流水对账双跑校验，搭建差异自动归因看板' },
  { key: 'r', label: 'Result 结果', prompt: '如：差错率 0.8%→0.05%，财务月结提前 2 天' }
]

function getScene(sceneId) {
  return SCENES.find((s) => s.id === sceneId) || SCENES[0]
}

// 最大余数法分配时间盒：保证各节秒数总和恒等于总秒数
function allocateByLargestRemainder(weights, total) {
  const sum = weights.reduce((a, b) => a + b, 0) || 1
  const raw = weights.map((w) => (w / sum) * total)
  const base = raw.map(Math.floor)
  let rest = total - base.reduce((a, b) => a + b, 0)
  const order = raw.map((v, i) => ({ i, frac: v - Math.floor(v) })).sort((a, b) => b.frac - a.frac)
  const out = base.slice()
  for (let k = 0; k < rest; k++) out[order[k].i] += 1
  return out
}

// 场景 + 时长 → 各节时间盒（秒），总和 === minutes*60
function allocateTimeboxes(scene, minutes) {
  const total = Math.round(Number(minutes) * 60) || 300
  const secs = allocateByLargestRemainder(scene.sections.map((s) => s.weight), total)
  return scene.sections.map((s, i) => ({ key: s.key, title: s.title, seconds: secs[i] }))
}

function fmtSeconds(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0))
  if (s % 60 === 0) return (s / 60) + ' 分钟'
  return Math.floor(s / 60) + ' 分 ' + (s % 60) + ' 秒'
}

// STAR 四要素展开为段落：空项以 ____ 显示
function buildStarParagraph(star) {
  const f = (v) => {
    const t = String((v === undefined || v === null) ? '' : v).trim()
    return t || PLACEHOLDER
  }
  const s = star && typeof star === 'object' ? star : {}
  return '项目【' + f(s.project) + '】：在「' + f(s.s) + '」的背景下，我承担了「' + f(s.t) +
    '」的任务，通过「' + f(s.a) + '」，最终取得「' + f(s.r) + '」的结果。'
}

function starFilledCount(star) {
  if (!star || typeof star !== 'object') return 0
  return STAR_FIELDS.filter((f) => String(star[f.key] || '').trim()).length
}

// 生成大纲数据：sections（含勾选要点/STAR 段/时间盒）+ Markdown 全文
function buildOutline(sceneId, minutes, checkedIds, star) {
  const scene = getScene(sceneId)
  const boxes = allocateTimeboxes(scene, minutes)
  const checked = new Set(Array.isArray(checkedIds) ? checkedIds : [])
  const useStar = !!(star && star.enabled)
  const starText = useStar ? buildStarParagraph(star) : ''
  const hostKey = STAR_HOST[scene.id] || scene.sections[0].key

  const sections = scene.sections.map((sec, i) => {
    const points = sec.points
      .filter((p) => checked.has(p.id))
      .map((p) => ({ label: p.label, question: p.question }))
    return {
      key: sec.key,
      title: sec.title,
      seconds: boxes[i].seconds,
      points,
      star: sec.key === hostKey && starText ? starText : null
    }
  })

  const lines = ['# 述职报告大纲（' + scene.label + ' · ' + Number(minutes) + ' 分钟）', '']
  lines.push('> 全程约 ' + minutes + ' 分钟，每节标注时间盒，讲话可按秒对表推进。', '')
  let secIdx = 0
  for (const sec of sections) {
    lines.push('## ' + CN_NUMS[secIdx] + '、' + sec.title + '（' + fmtSeconds(sec.seconds) + '）', '')
    secIdx += 1
    if (sec.points.length) {
      for (const p of sec.points) lines.push('- [ ] ' + p.label + '：' + p.question)
      lines.push('')
    }
    if (sec.star) lines.push('> ' + sec.star, '')
  }
  const markdown = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
  return { scene, sections, markdown }
}

function allPointIds(sceneId) {
  const scene = getScene(sceneId)
  return scene.sections.flatMap((s) => s.points.map((p) => p.id))
}
/* ==== PURE:END ==== */

// ---------- 页面状态 ----------
const STORAGE_KEY = 'performance-review-outline'
const sceneId = ref('probation')
const minutes = ref(5)
const checkedIds = ref([])
const starEnabled = ref(false)
const star = reactive({ project: '', s: '', t: '', a: '', r: '' })

const tool = tools.find((t) => t.id === 'performance-review-outline')

const currentScene = computed(() => getScene(sceneId.value))
const starHostName = computed(() => {
  const hostKey = STAR_HOST[sceneId.value] || ''
  const sec = currentScene.value.sections.find((s) => s.key === hostKey)
  return sec ? sec.title : ''
})
const checkedTotal = computed(() => checkedIds.value.length)
const starFilled = computed(() => starFilledCount({ ...star, enabled: starEnabled.value }))

// 生成大纲（预览与复制共用同一份数据）
const outlineData = computed(() =>
  buildOutline(sceneId.value, minutes.value, checkedIds.value, { enabled: starEnabled.value, ...star })
)

function cnNum(idx) {
  return CN_NUMS[Math.max(0, Number(idx) || 0)] || '一'
}

function checkedCountOf(sec) {
  const ids = sec.points.map((p) => p.id)
  return ids.filter((id) => checkedIds.value.includes(id)).length
}

// 切换场景：仅保留属于新场景的勾选要点
function selectScene(id) {
  if (sceneId.value === id) return
  const valid = new Set(allPointIds(id))
  checkedIds.value = checkedIds.value.filter((x) => valid.has(x))
  sceneId.value = id
}

// ---------- 复制与打印 ----------
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

async function copyOutline() {
  try {
    await navigator.clipboard.writeText(outlineData.value.markdown)
    alert('已复制')
  } catch (e) {
    fallbackCopy(outlineData.value.markdown, '已复制')
  }
}

function printOutline() {
  window.print()
}

// ---------- 草稿持久化（localStorage 仅客户端读写） ----------
watch([sceneId, minutes, checkedIds, starEnabled, star], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      scene: sceneId.value,
      minutes: minutes.value,
      checked: checkedIds.value,
      starEnabled: starEnabled.value,
      star: { project: star.project, s: star.s, t: star.t, a: star.a, r: star.r }
    }))
  } catch (e) { /* localStorage 不可用时静默降级 */ }
}, { deep: true })

onMounted(() => {
  if (tool) addRecentTool(tool.id)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const d = JSON.parse(raw)
      if (d && SCENES.some((s) => s.id === d.scene)) sceneId.value = d.scene
      if (d && DURATIONS.includes(d.minutes)) minutes.value = d.minutes
      if (d && Array.isArray(d.checked)) {
        const valid = new Set(allPointIds(sceneId.value))
        checkedIds.value = d.checked.filter((x) => valid.has(x))
      }
      if (d && typeof d.starEnabled === 'boolean') starEnabled.value = d.starEnabled
      if (d && d.star && typeof d.star === 'object') {
        for (const f of STAR_FIELDS) {
          if (typeof d.star[f.key] === 'string') star[f.key] = d.star[f.key]
        }
      }
    }
  } catch (e) { /* 忽略损坏的本地草稿 */ }
})
</script>

<style scoped>
/* 大纲纸面：白底版式 */
.print-area .bg-white {
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }

  .no-print {
    display: none !important;
  }

  .print-area {
    box-shadow: none !important;
  }

  .bg-white {
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
}
</style>
