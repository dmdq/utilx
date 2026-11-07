<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <MessagesSquare class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">1on1 沟通议程生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">成员与周期管理、四区话题库勾选生成 30 分钟提纲，行动项跨次提醒与历史时间线</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        维护直接汇报成员列表（含沟通周期），从「进度同步 / 成长反馈 / 障碍清除 / 职业发展」四区话题库勾选本次话题，
        自动生成 30 分钟时间盒提纲（开场 5 / 主话题 15 / 行动项 5 / 闲聊 5）；谈话后保存记录，
        未完成的行动项会在下一次 1on1 自动列为「上次遗留」。全部数据保存在本地浏览器，不上传。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：成员 + 话题 + 行动项 -->
      <div class="no-print space-y-6">
        <!-- 成员管理 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Users class="w-5 h-5 mr-2 text-primary" /> 成员与周期
          </h2>
          <div class="flex gap-2">
            <input
              v-model="newMemberName"
              type="text"
              maxlength="20"
              class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="输入成员姓名，如 张三"
              @keyup.enter="addMember"
            />
            <select
              v-model="newMemberCadence"
              class="px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option v-for="c in CADENCES" :key="c.id" :value="c.id">{{ c.label }}</option>
            </select>
            <button
              type="button"
              @click="addMember"
              class="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1"
            >
              <Plus class="w-4 h-4" /> 添加
            </button>
          </div>
          <div v-if="members.length" class="flex flex-wrap gap-1.5">
            <div
              v-for="m in members"
              :key="m.id"
              class="flex items-center gap-0.5"
            >
              <button
                type="button"
                @click="selectMember(m.id)"
                class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5"
                :class="currentMemberId === m.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted hover:bg-muted/80 text-muted-foreground border-border'"
              >
                {{ m.name }}
                <span class="text-[10px] opacity-70">{{ cadenceLabel(m.cadence) }}</span>
                <span
                  v-if="pendingCountOf(m.id)"
                  class="text-[10px] bg-yellow-500/20 text-yellow-600 rounded-full px-1.5"
                  :title="pendingCountOf(m.id) + ' 条未完成行动项'"
                >{{ pendingCountOf(m.id) }}</span>
              </button>
              <button
                type="button"
                @click="removeMember(m.id)"
                class="px-1 text-xs text-muted-foreground hover:text-red-500"
                :aria-label="'删除成员 ' + m.name"
                title="删除成员（历史记录保留）"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p v-else class="text-xs text-muted-foreground">先添加要 1on1 的成员，再开始本次议程。</p>
        </div>

        <!-- 话题库 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <ListChecks class="w-5 h-5 mr-2 text-primary" /> 话题库（勾选进入主话题 15 分钟）
          </h2>
          <div
            v-for="zone in TOPIC_ZONES"
            :key="zone.key"
            class="border border-border rounded-lg p-4"
          >
            <p class="text-sm font-medium text-foreground mb-2">
              {{ zone.name }}
              <span class="text-xs text-muted-foreground font-normal ml-1">{{ zone.hint }}</span>
            </p>
            <div class="space-y-2">
              <label
                v-for="t in zone.topics"
                :key="t.id"
                class="flex items-start gap-2 text-sm text-foreground cursor-pointer"
              >
                <input
                  v-model="checkedTopicIds"
                  :value="t.id"
                  type="checkbox"
                  class="mt-0.5 w-4 h-4 rounded border border-border shrink-0"
                />
                <span>{{ t.text }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 行动项 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <StickyNote class="w-5 h-5 mr-2 text-primary" /> 行动项（谈话中约定）
          </h2>
          <div v-if="pendingActions.length" class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
            <TriangleAlert class="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
            <p class="text-xs leading-relaxed text-foreground">
              <strong>上次遗留（未完成 {{ pendingActions.length }} 条）：</strong>
              {{ pendingActions.map(a => a.text).join('；') }}。开场寒暄后建议先过一遍遗留项，再进入本次话题。
            </p>
          </div>
          <div class="space-y-2">
            <div
              v-for="(a, i) in actions"
              :key="a.id"
              class="flex flex-wrap items-center gap-2"
            >
              <input
                v-model="a.text"
                type="text"
                maxlength="60"
                class="flex-1 min-w-[160px] px-3 py-1.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                :placeholder="'行动项 ' + (i + 1) + '，如：输出接口文档初稿'"
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
                class="px-1.5 text-muted-foreground hover:text-red-500"
                aria-label="删除行动项"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            type="button"
            @click="addAction"
            class="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground transition flex items-center gap-1.5"
          >
            <Plus class="w-3.5 h-3.5" /> 添加行动项
          </button>
        </div>
      </div>

      <!-- 右侧：提纲预览 + 记录时间线 -->
      <div class="space-y-6">
        <!-- 本次议程预览 -->
        <div class="bg-card border border-border rounded-lg p-6 print-area">
          <div class="flex items-center justify-between mb-4 no-print">
            <h2 class="text-lg font-semibold flex items-center">
              <Clock class="w-5 h-5 mr-2 text-primary" /> 本次 1on1 提纲
            </h2>
            <div class="flex gap-2">
              <button
                type="button"
                @click="copyAgenda"
                class="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" /> 复制 Markdown
              </button>
              <button
                type="button"
                @click="printAll"
                class="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition flex items-center gap-1.5"
              >
                <Printer class="w-3.5 h-3.5" /> 打印
              </button>
            </div>
          </div>

          <div v-if="currentMember" class="agenda-paper">
            <p class="text-center text-xl font-bold">{{ date }} 1on1 议程</p>
            <p class="text-center text-sm text-black/60 mb-4">{{ currentMember.name }} · 全程 {{ totalMinutes }} 分钟</p>
            <div v-for="(box, i) in TIMEBOXES" :key="box.key" class="mb-3">
              <p class="font-bold text-[15px] border-b border-black/15 pb-1 mb-1.5">
                {{ cnNum(i) }}、{{ box.label }}（{{ box.minutes }} 分钟）
              </p>
              <ul v-if="box.key === 'topics' && agendaTopics.length" class="space-y-1">
                <li v-for="t in agendaTopics" :key="t.id" class="text-[14px] leading-relaxed">
                  <span class="text-black/50 text-xs mr-1">[{{ zoneNameOf(t.id) }}]</span>{{ t.text }}
                </li>
              </ul>
              <p v-else-if="box.key === 'topics'" class="text-[13px] text-black/40">（从左侧话题库勾选本次主话题）</p>
              <div v-else-if="box.key === 'actions'">
                <p v-if="pendingActions.length" class="text-[13px] font-medium mb-0.5">上次遗留：</p>
                <ul v-if="pendingActions.length" class="space-y-1 mb-2">
                  <li v-for="a in pendingActions" :key="a.recordId + a.text" class="text-[13px] leading-relaxed">
                    ☐ {{ a.text }}（{{ a.recordDate }} 记录）
                  </li>
                </ul>
                <p class="text-[13px] font-medium mb-0.5">本次新约定：</p>
                <ul v-if="actions.length" class="space-y-1">
                  <li v-for="a in actions" :key="a.id" class="text-[13px] leading-relaxed">
                    ☐ {{ a.text || '（待填写）' }}<span v-if="a.owner || a.due">（{{ [a.owner, a.due].filter(Boolean).join(' · ') }}）</span>
                  </li>
                </ul>
                <p v-else class="text-[13px] text-black/40">（谈话中现场记录：事项 / 负责人 / 截止）</p>
              </div>
              <ul v-else class="space-y-1">
                <li v-for="q in box.prompts" :key="q" class="text-[14px] leading-relaxed">{{ q }}</li>
              </ul>
            </div>
          </div>
          <div v-else class="border border-dashed border-border rounded-lg h-48 flex flex-col items-center justify-center text-center px-8 no-print">
            <MessagesSquare class="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p class="text-sm font-medium text-muted-foreground">选择成员后生成 30 分钟议程提纲</p>
          </div>
        </div>

        <!-- 保存本次记录 -->
        <div class="no-print bg-card border border-border rounded-lg p-6 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-base font-semibold flex items-center">
              <Save class="w-4 h-4 mr-1.5 text-primary" /> 保存本次谈话记录
            </h3>
            <label class="text-xs text-muted-foreground flex items-center gap-1.5">
              谈话日期
              <input
                v-model="date"
                type="date"
                class="px-2.5 py-1.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            保存后写入该成员的历史时间线；行动项默认标记为「未完成」，下一次 1on1 自动出现在「上次遗留」提醒里，完成后可在线上标记。
          </p>
          <button
            type="button"
            @click="saveRecord"
            class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
          >
            <Save class="w-4 h-4" /> 保存记录（{{ currentMemberName || '未选成员' }} · {{ date }}）
          </button>
        </div>

        <!-- 历史时间线 -->
        <div class="bg-card border border-border rounded-lg p-6 print-area space-y-4">
          <div class="flex items-center justify-between no-print">
            <h3 class="text-base font-semibold flex items-center">
              <History class="w-4 h-4 mr-1.5 text-primary" /> 历史记录时间线
              <span v-if="currentMember" class="text-xs font-normal text-muted-foreground ml-1">{{ currentMember.name }}</span>
            </h3>
            <button
              type="button"
              @click="printAll"
              class="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition flex items-center gap-1.5"
            >
              <Printer class="w-3.5 h-3.5" /> 打印全部记录
            </button>
          </div>
          <div v-if="currentRecords.length" class="space-y-4">
            <div
              v-for="r in currentRecords"
              :key="r.id"
              class="border border-border rounded-lg p-4 timeline-item"
            >
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-semibold">{{ r.date }}</p>
                <span class="text-xs text-muted-foreground">{{ r.topics.length }} 个话题 · {{ r.actions.length }} 条行动项</span>
              </div>
              <p v-if="r.topics.length" class="text-xs text-muted-foreground mb-1.5">
                议题：{{ r.topics.map(t => t.text).join('；') }}
              </p>
              <div v-if="r.actions.length" class="space-y-1.5">
                <label
                  v-for="(a, ai) in r.actions"
                  :key="ai"
                  class="flex items-start gap-2 text-sm cursor-pointer"
                  :class="a.done ? 'text-muted-foreground line-through' : 'text-foreground'"
                >
                  <input
                    v-model="a.done"
                    type="checkbox"
                    class="mt-0.5 w-4 h-4 rounded border border-border shrink-0"
                    @change="persistState"
                  />
                  <span>
                    {{ a.text }}
                    <span class="text-xs text-muted-foreground ml-1">{{ [a.owner, a.due ? '截止 ' + a.due : ''].filter(Boolean).join(' · ') }}</span>
                  </span>
                </label>
              </div>
              <p v-else class="text-xs text-muted-foreground">（本次未记录行动项）</p>
            </div>
          </div>
          <div v-else class="border border-dashed border-border rounded-lg h-32 flex flex-col items-center justify-center text-center px-8 no-print">
            <History class="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p class="text-sm text-muted-foreground">暂无该成员的历史记录，保存一次谈话后即可看到时间线</p>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="group bg-card border border-border rounded-lg p-6 mb-12 no-print" open>
      <summary class="text-2xl font-bold text-foreground cursor-pointer list-none flex items-center justify-between">
        <span><span class="text-primary mr-2">#</span>关于 1on1 沟通</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div class="space-y-4 text-sm text-muted-foreground leading-relaxed mt-4">
        <p>
          1on1（一对一沟通）是管理者与直接汇报成员之间固定频率、以对方为中心的一对一谈话：它不是进度汇报会，
          而是给成员留出的专属时间——谈进展、谈障碍、也谈成长与职业发展。管理半径越大、日常协作越密集的团队，
          越需要用固定节奏的 1on1 来兜住那些「不开会就不会说」的问题。本工具帮你维护成员与周期、生成 30 分钟议程、
          记录行动项并在下次谈话时提醒遗留。
          <span class="text-foreground font-medium">话题与节奏模板仅供参考，正式沟通请结合团队实际调整。</span>
        </p>

        <h3 class="text-lg font-semibold text-foreground">1on1 为什么重要</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">信息通路</span>：危机、离职倾向、跨团队摩擦这类信息几乎只会出现在一对一场合，团队例会上听不到。</li>
          <li><span class="text-foreground font-medium">信任积累</span>：固定频率、准时开始结束、议题以对方为主，是低成本建立信任的方式；取消 1on1 常被解读为「我不重要」。</li>
          <li><span class="text-foreground font-medium">障碍前置</span>：障碍在 1on1 里被说出来的那一刻，就已经解决了一半；拖到季度复盘的成本要高得多。</li>
          <li><span class="text-foreground font-medium">发展视角</span>：绩效面谈一年一两次，而 1on1 让成长议题有持续发生的固定容器。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground">好问题清单（精选）</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>「最近最有成就感的事是什么？」——找到对方的能量来源；</li>
          <li>「什么阻碍了你？」/「我能帮你清除什么障碍？」——把责任放到管理者一侧；</li>
          <li>「你想学什么？想成为什么样的人？」——把话题从任务拉到发展；</li>
          <li>「我最近给你的反馈里，哪条最有用？」——校准自己的管理动作；</li>
          <li>「如果你是我，下一季度你最想改什么？」——借对方的视角照自己的盲区。</li>
        </ul>
        <p>
          提问原则：多问开放式问题、先听后说、不急于给答案；30 分钟里管理者说话时间最好不超过三分之一。
        </p>

        <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-foreground">多久一次合适？</h4>
            <p class="mt-1">新人或关键项目期每周一次，成熟成员双周一次也足够；单次 30 分钟是常见节奏（开场 5 / 主话题 15 / 行动项 5 / 闲聊收尾 5）。宁可短而稳定，不要一月一次一小时。</p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">成员没话题聊怎么办？</h4>
            <p class="mt-1">从本工具话题库挑 2-3 个勾进议程带着问；也可以先从「上次遗留的行动项」聊起，自然过渡。连续几周没话题本身就是信号，可以聊「为什么没什么可聊」。</p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">行动项总是不了了之怎么办？</h4>
            <p class="mt-1">每次谈话结束时当场确认事项、负责人、截止日；下次开场先过遗留清单。本工具会把未完成行动项自动带到下一次的议程里，避免「说好的事」沉底。</p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">复盘团队会议用什么？</h4>
            <p class="mt-1">
              团队层面的回顾可以配合站内 <a href="/tools/retro-templates/" class="text-primary hover:underline">团队复盘模板</a>：
              KISS / 4Ls / Start-Stop-Continue 三套框架，适合迭代结束后的集体复盘；1on1 与团队复盘互补，一个纵向谈个人，一个横向谈协作。
            </p>
          </div>
        </div>

        <h3 class="text-lg font-semibold text-foreground">参考来源</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>四区话题库：按管理学通行实践整理（Andy Grove《高产出管理》提出的 1on1 是「下属的会议」、以及 The Manager Tools / 《One on One Meeting》通行话题清单），模板仅供参考，正式沟通请结合团队实际。</li>
          <li>30 分钟时间盒：开场 5 / 主话题 15 / 行动项 5 / 闲聊收尾 5 的通行节奏建议。</li>
        </ul>
        <p class="text-xs">成员、记录等数据仅保存在你的浏览器 localStorage 中，不上传任何数据。</p>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :current-tool-id="'one-on-one-agenda'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  MessagesSquare, Users, Plus, Trash2, Clock, ListChecks, StickyNote,
  Save, History, Printer, Copy, ChevronDown, TriangleAlert
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '1on1 沟通议程生成器 - 一对一谈话模板/话题库/行动项跟踪',
  description: '在线 1on1 沟通议程生成器：管理成员与沟通周期，进度同步/成长反馈/障碍清除/职业发展四区话题库勾选生成 30 分钟时间盒提纲，谈话记录历史时间线，未完成行动项跨次自动提醒，数据本地保存不上传',
  keywords: '1on1模板, 一对一沟通, 1on1话题, 管理者面谈, 员工沟通议程, one on one meeting, 团队管理工具',
  author: '有条工具',
  ogTitle: '1on1 沟通议程生成器 - 30 分钟议程/话题库/遗留提醒 | 有条工具',
  ogDescription: '四区话题库勾选生成 30 分钟提纲，行动项跨次提醒，历史时间线本地保存',
  ogUrl: 'https://www.util.cn/tools/one-on-one-agenda',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '1on1 沟通议程生成器',
  twitterDescription: '一对一沟通议程、话题库与行动项跟踪'
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
          name: '1on1 沟通议程生成器',
          url: 'https://www.util.cn/tools/one-on-one-agenda',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '多成员与沟通周期管理（每周/双周/每月）',
            '进度/成长/障碍/发展四区话题库 20 条',
            '30 分钟时间盒议程提纲（5/15/5/5）',
            '行动项记录（事项/负责人/截止）',
            '未完成行动项跨次自动提醒',
            '历史记录时间线与 Markdown 导出打印'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '1on1 沟通议程生成器', item: 'https://www.util.cn/tools/one-on-one-agenda/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '1on1 多久一次合适？',
              acceptedAnswer: { '@type': 'Answer', text: '新人或关键项目期每周一次，成熟成员双周一次也足够；单次 30 分钟是常见节奏（开场 5 / 主话题 15 / 行动项 5 / 闲聊收尾 5）。宁可短而稳定，不要一月一次一小时。' }
            },
            {
              '@type': 'Question',
              name: '1on1 成员没话题聊怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '从话题库挑 2-3 个勾进议程带着问，或先从上次遗留的行动项聊起；连续几周没话题本身就是信号，可以聊「为什么没什么可聊」。' }
            },
            {
              '@type': 'Question',
              name: '1on1 的行动项总是不了了之怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '每次谈话结束当场确认事项、负责人、截止日，下次开场先过遗留清单。本工具会把未完成行动项自动带到下一次议程的「上次遗留」提醒里。' }
            },
            {
              '@type': 'Question',
              name: '1on1 与团队复盘有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '1on1 纵向谈个人（进展、障碍、成长），团队复盘横向谈协作（这次迭代哪里做得好、哪里要改）。两者互补：个人议题用 1on1，集体议题用团队复盘模板。' }
            }
          ]
        }
      ]
    })
  }]
})

/* ==== PURE:BEGIN ==== */
const CN_NUMS = ['一', '二', '三', '四']
const CADENCES = [
  { id: 'weekly', label: '每周', days: 7 },
  { id: 'biweekly', label: '双周', days: 14 },
  { id: 'monthly', label: '每月', days: 30 }
]

// 30 分钟时间盒：开场 5 / 主话题 15 / 行动项 5 / 闲聊 5
const TIMEBOXES = [
  { key: 'open', label: '开场破冰', minutes: 5, prompts: ['最近状态怎么样？精力值按 1-10 打几分？', '（若上次有遗留行动项，先快速过一遍）'] },
  { key: 'topics', label: '主话题讨论', minutes: 15, prompts: [] },
  { key: 'actions', label: '行动项确认', minutes: 5, prompts: [] },
  { key: 'chitchat', label: '闲聊与收尾', minutes: 5, prompts: ['有什么想聊但我没问到的？', '下次 1on1 前你最想推进的一件事是什么？'] }
]

function timeboxTotal(boxes) {
  return (boxes || TIMEBOXES).reduce((a, b) => a + (Number(b.minutes) || 0), 0)
}

// 四区话题库（每区 5-8 条，均为可直接开口的问题句）
const TOPIC_ZONES = [
  {
    key: 'progress',
    name: '进度同步',
    hint: '对齐进展与优先级',
    topics: [
      { id: 'pg1', text: '最近一周最有成就感的事是什么？' },
      { id: 'pg2', text: '手头项目进展到哪一步了？和预期一致吗？' },
      { id: 'pg3', text: '时间分配上有没有失衡的地方？' },
      { id: 'pg4', text: '有哪些事在等别人、或在等我拍板？' },
      { id: 'pg5', text: '下周最重要的一件事是什么？' }
    ]
  },
  {
    key: 'growth',
    name: '成长反馈',
    hint: '能力与反馈循环',
    topics: [
      { id: 'gr1', text: '你最近学到了什么新东西？' },
      { id: 'gr2', text: '有什么技能你觉得需要补强？想学什么？' },
      { id: 'gr3', text: '我最近给你的反馈里，哪条最有用、哪条最没用？' },
      { id: 'gr4', text: '你希望我在哪方面多给你指导？' },
      { id: 'gr5', text: '上次定的发展目标进展如何？' }
    ]
  },
  {
    key: 'blockers',
    name: '障碍清除',
    hint: '扫清拖慢节奏的事',
    topics: [
      { id: 'bl1', text: '什么在拖慢你？流程、人还是资源？' },
      { id: 'bl2', text: '有没有反复出现、让你烦心的问题？' },
      { id: 'bl3', text: '我能帮你清除什么障碍？' },
      { id: 'bl4', text: '团队里有什么摩擦需要我出面协调？' },
      { id: 'bl5', text: '工具或流程上有没有值得升级的地方？' }
    ]
  },
  {
    key: 'career',
    name: '职业发展',
    hint: '把话题拉到长期',
    topics: [
      { id: 'cr1', text: '更长远看，你想成为什么样的人？' },
      { id: 'cr2', text: '当前工作和你的长期目标对齐吗？' },
      { id: 'cr3', text: '有没有想尝试的新方向或新项目？' },
      { id: 'cr4', text: '你觉得自己的优势被充分利用了吗？' },
      { id: 'cr5', text: '如果你是我，下一季度你最想改什么？' }
    ]
  }
]

function topicById(id) {
  for (const z of TOPIC_ZONES) {
    const t = z.topics.find((x) => x.id === id)
    if (t) return { ...t, zone: z.name }
  }
  return null
}

function zoneNameOf(id) {
  const t = topicById(id)
  return t ? t.zone : ''
}

function cadenceLabel(cadenceId) {
  const c = CADENCES.find((x) => x.id === cadenceId) || CADENCES[1]
  return c.label
}

function nextMeetingDate(dateStr, cadenceId) {
  const c = CADENCES.find((x) => x.id === cadenceId) || CADENCES[1]
  const m = String(dateStr || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!m) return ''
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (isNaN(d.getTime())) return ''
  d.setDate(d.getDate() + c.days)
  const pad = (n) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

// 记录按成员隔离过滤：按日期倒序（新的在前）
function recordsOf(records, memberId) {
  return (records || [])
    .filter((r) => r && r.memberId === memberId)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
}

// 跨次遗留行动项：指定成员的全部未完成行动项（按记录日期倒序）
function pendingActionsOf(records, memberId) {
  return recordsOf(records, memberId).flatMap((r) =>
    ((r.actions || []) || [])
      .filter((a) => a && a.text && !a.done)
      .map((a) => ({ text: a.text, owner: a.owner || '', due: a.due || '', recordId: r.id, recordDate: r.date }))
  )
}

// 生成议程 Markdown（含时间盒与遗留清单）
function buildAgendaMarkdown(member, date, checkedTopicIds, pending) {
  const name = (member && member.name) || '成员'
  const topics = (checkedTopicIds || []).map((id) => topicById(id)).filter(Boolean)
  const pend = Array.isArray(pending) ? pending : []
  const lines = []
  lines.push('# 1on1 沟通议程 — ' + name + '（' + (date || '待定') + '）', '')
  lines.push('> 全程 ' + timeboxTotal(TIMEBOXES) + ' 分钟：' + TIMEBOXES.map((b) => b.label + ' ' + b.minutes).join(' / '), '')
  TIMEBOXES.forEach((b, i) => {
    lines.push('## ' + CN_NUMS[i] + '、' + b.label + '（' + b.minutes + ' 分钟）', '')
    if (b.key === 'topics') {
      if (topics.length) {
        for (const t of topics) lines.push('- [' + t.zone + '] ' + t.text)
      } else {
        lines.push('- （从话题库勾选本次主话题）')
      }
      lines.push('')
    } else if (b.key === 'actions') {
      if (pend.length) {
        lines.push('上次遗留（未完成）：')
        for (const a of pend) lines.push('- [ ] ' + a.text + '（' + a.recordDate + ' 记录）')
        lines.push('')
      }
      lines.push('本次新约定（事项 / 负责人 / 截止）：', '- ', '')
    } else {
      for (const q of b.prompts) lines.push('- ' + q)
      lines.push('')
    }
  })
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

function makeId() {
  return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
/* ==== PURE:END ==== */

// ---------- 页面状态 ----------
const STORAGE_KEY = 'one-on-one-agenda'
const members = ref([])
const records = ref([])
const currentMemberId = ref('')
const date = ref('')
const checkedTopicIds = ref([])
const actions = ref([])
const newMemberName = ref('')
const newMemberCadence = ref('weekly')

const tool = tools.find((t) => t.id === 'one-on-one-agenda')

const currentMember = computed(() => members.value.find((m) => m.id === currentMemberId.value) || null)
const currentMemberName = computed(() => (currentMember.value ? currentMember.value.name : ''))
const currentRecords = computed(() => recordsOf(records.value, currentMemberId.value))
const pendingActions = computed(() => pendingActionsOf(records.value, currentMemberId.value))
const agendaTopics = computed(() => checkedTopicIds.value.map((id) => topicById(id)).filter(Boolean))
const totalMinutes = computed(() => timeboxTotal(TIMEBOXES))

function pendingCountOf(memberId) {
  return pendingActionsOf(records.value, memberId).length
}

function cnNum(i) {
  return CN_NUMS[Math.max(0, Number(i) || 0)] || '一'
}

function todayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

// ---------- 成员管理 ----------
function addMember() {
  const name = newMemberName.value.trim()
  if (!name) {
    alert('请输入成员姓名')
    return
  }
  if (members.value.some((m) => m.name === name)) {
    alert('该成员已存在')
    return
  }
  const m = { id: makeId(), name, cadence: newMemberCadence.value }
  members.value.push(m)
  currentMemberId.value = m.id
  checkedTopicIds.value = []
  actions.value = []
  newMemberName.value = ''
  persistState()
}

function removeMember(id) {
  const m = members.value.find((x) => x.id === id)
  if (!m) return
  if (!confirm('删除成员「' + m.name + '」？其历史记录将保留。')) return
  members.value = members.value.filter((x) => x.id !== id)
  if (currentMemberId.value === id) currentMemberId.value = ''
  persistState()
}

function selectMember(id) {
  if (currentMemberId.value === id) return
  currentMemberId.value = id
  checkedTopicIds.value = []
  actions.value = [newAction()]
  const d = todayStr()
  if (!date.value || date.value < d) date.value = d
}

// ---------- 行动项 ----------
function newAction() {
  return { id: makeId(), text: '', owner: currentMemberName.value, due: '', done: false }
}

function addAction() {
  actions.value.push(newAction())
}

function removeAction(id) {
  actions.value = actions.value.filter((a) => a.id !== id)
}

// ---------- 保存记录 ----------
function saveRecord() {
  if (!currentMember.value) {
    alert('请先选择成员')
    return
  }
  if (!date.value) {
    alert('请选择谈话日期')
    return
  }
  const topics = agendaTopics.value.map((t) => ({ id: t.id, zone: t.zone, text: t.text }))
  const cleanActions = actions.value
    .filter((a) => a.text.trim())
    .map((a) => ({ text: a.text.trim(), owner: a.owner.trim(), due: a.due, done: !!a.done }))
  records.value.push({
    id: makeId(),
    memberId: currentMember.value.id,
    memberName: currentMember.value.name,
    date: date.value,
    topics,
    actions: cleanActions
  })
  // 保存后清空本次勾选与行动项，进入下一轮；遗留提醒会自动带上未完成项
  checkedTopicIds.value = []
  actions.value = [newAction()]
  const next = nextMeetingDate(date.value, currentMember.value.cadence)
  if (next && next > date.value) date.value = next
  persistState()
  alert('已保存本次记录' + (next ? '，下次建议日期 ' + next : ''))
}

// ---------- 导出 ----------
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

async function copyAgenda() {
  if (!currentMember.value) {
    alert('请先选择成员')
    return
  }
  const md = buildAgendaMarkdown(currentMember.value, date.value, checkedTopicIds.value, pendingActions.value)
  try {
    await navigator.clipboard.writeText(md)
    alert('已复制')
  } catch (e) {
    fallbackCopy(md, '已复制')
  }
}

function printAll() {
  window.print()
}

// ---------- 持久化（仅客户端） ----------
function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      members: members.value,
      records: records.value,
      currentMemberId: currentMemberId.value,
      date: date.value,
      checkedTopicIds: checkedTopicIds.value,
      actions: actions.value
    }))
  } catch (e) { /* localStorage 不可用时静默降级 */ }
}

onMounted(() => {
  if (tool) addRecentTool(tool.id)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const d = JSON.parse(raw)
      if (d && Array.isArray(d.members)) members.value = d.members
      if (d && Array.isArray(d.records)) records.value = d.records
      if (d && typeof d.currentMemberId === 'string') currentMemberId.value = d.currentMemberId
      if (d && typeof d.date === 'string') date.value = d.date
      if (d && Array.isArray(d.checkedTopicIds)) checkedTopicIds.value = d.checkedTopicIds.filter((id) => topicById(id))
      if (d && Array.isArray(d.actions)) actions.value = d.actions
    }
  } catch (e) { /* 忽略损坏的本地数据 */ }
  if (!date.value) date.value = todayStr()
})
</script>

<style scoped>
.agenda-paper {
  background: #fff;
  color: #111;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 20px 22px;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
}

.timeline-item {
  position: relative;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 12mm;
  }

  .no-print {
    display: none !important;
  }

  .print-area {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin-bottom: 10mm !important;
  }

  .agenda-paper {
    border: none;
    padding: 0;
  }
}
</style>
