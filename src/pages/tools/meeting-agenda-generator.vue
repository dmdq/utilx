<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ListChecks class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">会议议程生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">议题时间盒自动累计总时长，自动排起止时刻表，导出 Markdown 或 A4 打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        填写会议信息后逐条录入议题：每条议题设提出人、类型（讨论/决策/通报）与时间盒分钟数，工具自动累计总时长并与预定会议时长对比
        （超时红牌 / 剩余绿牌），同时从开始时刻自动累加生成每个议题的起止时刻表。附会前材料清单勾选与会后行动项留空框架，
        支持周例会/项目评审/复盘会/头脑风暴一键套模板，可复制 Markdown 议程或直接打印 A4 议程表，草稿自动保存在本机浏览器。全部处理本地完成，不上传数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：表单区 -->
      <div class="no-print space-y-4">
        <!-- 模板预设 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Sparkles class="w-5 h-5 mr-2 text-primary" /> 模板预设
          </h2>
          <p class="text-xs text-muted-foreground mb-3">点击一键填充典型议题框架，可再逐条修改（会覆盖当前议题列表）</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tpl in TEMPLATE_KEYS"
              :key="tpl"
              type="button"
              @click="applyTemplate(tpl)"
              class="px-3.5 py-2 rounded-lg text-xs font-medium bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground transition"
            >{{ tpl }}</button>
          </div>
        </div>

        <!-- 会议信息 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <CalendarDays class="w-5 h-5 mr-2 text-primary" /> 会议信息
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-foreground mb-1">会议主题</label>
              <input v-model="form.title" type="text" class="fld" placeholder="如：产品周例会" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">日期</label>
              <input v-model="form.date" type="date" class="fld" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">开始时刻</label>
              <input v-model="form.startTime" type="time" class="fld" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">地点</label>
              <input v-model="form.location" type="text" class="fld" placeholder="如：3F 会议室 / 线上会议链接" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">主持人</label>
              <input v-model="form.host" type="text" class="fld" placeholder="如：张三" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">预定会议时长（分钟）</label>
              <input v-model.number="form.plannedMinutes" type="number" min="0" max="600" class="fld" placeholder="如 60" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-foreground mb-1">参会人（每行一人）</label>
              <textarea v-model="form.attendees" rows="3" class="fld resize-y" placeholder="如：&#10;李四（产品）&#10;王五（研发）&#10;赵六（设计）"></textarea>
            </div>
          </div>
        </div>

        <!-- 议题列表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <ListChecks class="w-5 h-5 mr-2 text-primary" /> 议题（每条一个时间盒）
          </h2>
          <p class="text-xs text-muted-foreground mb-3">为每条议题设提出人与时间盒分钟数，工具自动排起止时刻并累计总时长</p>

          <div v-for="(t, i) in form.topics" :key="i" class="flex flex-wrap gap-2 mb-2 items-start">
            <span class="w-6 h-8 flex items-center justify-center text-xs text-muted-foreground">{{ i + 1 }}</span>
            <input v-model="t.name" type="text" class="fld flex-1 min-w-[160px]" placeholder="议题名（如 上周行动项回顾）" :aria-label="`议题${i + 1} 名称`" />
            <input v-model="t.owner" type="text" class="fld w-[110px]" placeholder="提出人" :aria-label="`议题${i + 1} 提出人`" />
            <select v-model="t.type" class="fld w-[92px]" :aria-label="`议题${i + 1} 类型`">
              <option v-for="ty in TOPIC_TYPES" :key="ty" :value="ty">{{ ty }}</option>
            </select>
            <input v-model.number="t.minutes" type="number" min="0" max="480" class="fld w-[86px]" placeholder="分钟" :aria-label="`议题${i + 1} 时间盒分钟`" />
            <button type="button" @click="removeTopic(i)" class="p-2 text-muted-foreground hover:text-red-600 transition" aria-label="删除该议题">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
          <button type="button" @click="addTopic" class="mt-1 px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground transition flex items-center gap-1">
            <Plus class="w-3.5 h-3.5" /> 添加议题
          </button>

          <!-- 时长对比告警条 -->
          <div v-if="cmpInfo" class="mt-4 rounded-xl p-4 bg-muted/50" :class="cmpInfo.cls">
            <p class="text-sm font-medium flex items-center gap-2">
              <Clock class="w-4 h-4" /> {{ cmpInfo.text }}
            </p>
          </div>
        </div>

        <!-- 会前材料清单 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <PackageOpen class="w-5 h-5 mr-2 text-primary" /> 会前材料清单
          </h2>
          <p class="text-xs text-muted-foreground mb-3">勾选已备齐的材料，随议程一起发出，方便参会人提前预读</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label
              v-for="m in MATERIAL_ITEMS"
              :key="m.key"
              class="flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition"
              :class="materialChecks[m.key] ? 'bg-primary/5 border-primary/40' : 'bg-background border-border hover:border-primary/30'"
            >
              <input v-model="materialChecks[m.key]" type="checkbox" class="accent-current w-4 h-4" />
              <span class="text-sm text-foreground">{{ m.label }}</span>
            </label>
          </div>
        </div>

        <!-- 会后行动项 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <ClipboardList class="w-5 h-5 mr-2 text-primary" /> 会后行动项（留空框架）
          </h2>
          <p class="text-xs text-muted-foreground mb-3">会上确认后当场填写：事项、负责人、截止时间；导出的议程表会保留空行供现场补填</p>
          <div v-for="(a, i) in form.actions" :key="i" class="flex flex-wrap gap-2 mb-2">
            <input v-model="a.task" type="text" class="fld flex-1 min-w-[180px]" placeholder="行动事项" :aria-label="`行动项${i + 1} 事项`" />
            <input v-model="a.owner" type="text" class="fld w-[120px]" placeholder="负责人" :aria-label="`行动项${i + 1} 负责人`" />
            <input v-model="a.due" type="text" class="fld w-[130px]" placeholder="截止（如 11-15）" :aria-label="`行动项${i + 1} 截止`" />
            <button type="button" @click="removeAction(i)" class="p-2 text-muted-foreground hover:text-red-600 transition" aria-label="删除该行动项">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
          <button type="button" @click="addAction" class="mt-1 px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground transition flex items-center gap-1">
            <Plus class="w-3.5 h-3.5" /> 添加行动项
          </button>
        </div>

        <!-- 操作 -->
        <div class="bg-card border border-border rounded-lg p-6 flex flex-wrap gap-2">
          <button type="button" @click="copyMarkdown" class="flex-1 min-w-[130px] px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5">
            <Copy class="w-4 h-4" /> 复制 Markdown 议程
          </button>
          <button type="button" @click="printReport" class="flex-1 min-w-[110px] px-4 py-2.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition flex items-center justify-center gap-1.5">
            <Printer class="w-4 h-4" /> 打印 A4 议程
          </button>
          <button type="button" @click="clearDraft" class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-muted-foreground transition flex items-center justify-center gap-1.5">
            <Eraser class="w-4 h-4" /> 清空
          </button>
        </div>
      </div>

      <!-- 右：A4 预览 -->
      <div class="print-area">
        <div class="no-print flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 议程预览（A4）
          </h2>
          <button type="button" @click="printReport" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1.5">
            <Printer class="w-4 h-4" /> 打印
          </button>
        </div>
        <div class="bg-white text-black border border-border rounded-lg shadow-sm overflow-hidden a4-paper">
          <div class="px-[8%] py-[7%]" v-html="previewHtml"></div>
        </div>
        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：起止时刻表按「开始时刻 + 各议题时间盒」自动累加；打印或另存 PDF 时仅输出纸张内容，超过一页自动分页。
        </p>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="no-print bg-card border border-border rounded-lg p-6 mb-8">
      <summary class="text-lg font-semibold cursor-pointer select-none text-foreground flex items-center">
        <span class="text-primary mr-2">#</span>会议议程怎么写才高效？时间盒与开会的三个准备
      </summary>
      <div class="space-y-4 text-sm text-muted-foreground leading-relaxed mt-4">
        <h3 class="text-lg font-semibold text-foreground">时间盒（timeboxing）为什么能防跑题</h3>
        <p>
          时间盒指给每个议题预先分配固定时长，到点即收束。它从两个方向治住「会越开越长」：一是帕金森定律——工作会自动膨胀填满可用时间，
          议题不限定时，闲聊就会填满整场；二是锚定效应——有了明确分钟数，提出人会先把结论准备好、只讲必要信息，
          讨论也能在临界点自然触发「此事另约专场」的决策，而不是在主线会议上无限蔓延。本工具把每个议题的分钟数累加成总时长，
          与预定会议时长实时对比：超时亮红牌提醒裁议题，有剩余亮绿牌提示可以加议题或提前散会，并按开始时刻自动排出每个议题的起止时刻表。
        </p>
        <h3 class="text-lg font-semibold text-foreground">高效会议的三个准备</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">议程提前发：</span>至少提前一个工作日把议程（议题、提出人、时间盒）发给全部参会人，不接受「会上即兴加题」入主议程；本工具生成的 Markdown 议程可直接粘贴到 IM 或日历邀请。</li>
          <li><span class="text-foreground font-medium">材料提前读：</span>数据、方案、PPT、预读文档随议程一并发出并勾入材料清单，会上只做讨论与决策，不做「现场念文档」的无效时间。</li>
          <li><span class="text-foreground font-medium">责任提前定：</span>每条议题写明提出人（谁负责讲清楚），会后行动项当场写明负责人与截止时间——没有负责人和截止时间的结论等于没有结论。</li>
        </ul>
        <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">议题类型「讨论/决策/通报」有什么讲究？</span>通报类议题原则上不安排现场讨论（会前预读＋现场答疑即可）；讨论类必须产出结论或进入决策；决策类要写清决策人与备选项。把通报压到最短，是把会开短的第一杠杆。</li>
          <li><span class="text-foreground font-medium">总时长超过预定时长怎么办？</span>红牌告警时优先砍通报类议题（转成会前材料）、合并同类议题，或把大议题拆成「本次决策范围＋另约专场」，而不是简单延长会议。</li>
          <li><span class="text-foreground font-medium">会后行动项留在议程里有什么用？</span>行动项与议程同一份文档，散会后立即补齐负责人与截止时间，下次例会第一条议题即「回顾上次行动项」，形成闭环；本工具已预置空行框架供现场填写。</li>
          <li><span class="text-foreground font-medium">填写内容会上传吗？</span>不会。全部计算与草稿保存在你当前浏览器的 localStorage 中，换设备或清除浏览器数据会丢失，重要议程请及时复制或打印。</li>
        </ul>
        <h3 class="text-lg font-semibold text-foreground">延伸工具</h3>
        <p>
          会开完后需要整理纪要，可配合 <a href="/tools/meeting-minutes/" class="text-primary hover:underline">会议纪要生成器</a>；
          想量化会议本身的开销、说服团队砍会议，试试 <a href="/tools/meeting-cost-calculator/" class="text-primary hover:underline">会议成本计算器</a>。
        </p>
        <h3 class="text-lg font-semibold text-foreground">来源与口径说明</h3>
        <p>
          议程结构与时间盒方法整理自通行的会议管理实践（时间盒、帕金森定律与「议程先行」均为公开的项目管理与效率方法论，无专有口径）；
          议题三分类（讨论/决策/通报）为常见团队实践的简化整理。本工具输出为参考模板，具体会议纪律以组织制度为准。
        </p>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :current-tool-id="'meeting-agenda-generator'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  ListChecks, CalendarDays, ClipboardList, Clock, Plus, Trash2,
  Copy, Check, Printer, Eraser, Sparkles, PackageOpen
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '会议议程生成器 - 议题时间盒自动排起止时刻表模板',
  description: '免费在线会议议程生成器：逐条录入议题并设时间盒分钟数，自动累计总时长与预定时长对比告警（超时红/剩余绿），自动生成起止时刻表，附会前材料清单与会后行动项框架，周例会/项目评审/复盘会/头脑风暴模板一键套用，支持复制 Markdown 与 A4 打印，草稿本地保存不上传',
  keywords: '会议议程生成器,会议议程模板,会议议程怎么写,时间盒,timeboxing,开会时间安排,会议流程表,周例会议程',
  author: '有条工具',
  ogTitle: '会议议程生成器 - 时间盒排期一键出议程 | 有条工具',
  ogDescription: '议题时间盒自动累计总时长，自动排起止时刻表，附材料清单与行动项框架，Markdown 复制或 A4 打印。',
  ogUrl: 'https://www.util.cn/tools/meeting-agenda-generator',
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
          name: '会议议程生成器',
          url: 'https://www.util.cn/tools/meeting-agenda-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['议题时间盒分钟数设置并自动累计总时长', '总时长与预定会议时长对比告警（超时红/剩余绿）', '按开始时刻自动累加生成议题起止时刻表', '讨论/决策/通报议题类型标注', '会前材料清单勾选', '会后行动项留空框架', '周例会/项目评审/复盘会/头脑风暴模板预设', '导出 Markdown 与 A4 打印', '草稿本机保存不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '会议议程生成器', item: 'https://www.util.cn/tools/meeting-agenda-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '时间盒（timeboxing）为什么能防跑题？',
              acceptedAnswer: { '@type': 'Answer', text: '给每个议题预先分配固定时长并到点收束：一方面帕金森定律下不限定时的讨论会膨胀填满会议；另一方面有时间盒压力，提出人会提前准备结论、只讲必要信息，讨论到临界点自然转向「另约专场」。' }
            },
            {
              '@type': 'Question',
              name: '总时长超过预定会议时长怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '优先把通报类议题转为会前材料、合并同类议题，或把大议题拆成「本次决策范围＋另约专场」，而不是简单延长会议。生成器会在超时时亮红牌提示。' }
            },
            {
              '@type': 'Question',
              name: '起止时刻表是怎么排的？',
              acceptedAnswer: { '@type': 'Answer', text: '按你填的会议开始时刻，依议题顺序把各议题时间盒分钟数逐条累加：每条议题的开始时刻等于上一条结束时刻，最后一条的结束时刻即会议预计结束时间。' }
            },
            {
              '@type': 'Question',
              name: '填写内容会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。全部计算与草稿保存在当前浏览器 localStorage 中，不上传服务器；换设备或清除浏览器数据会丢失，请及时复制或打印。' }
            }
          ]
        }
      ]
    })
  }]
})

/* ==== PURE:BEGIN ==== */
const TOPIC_TYPES = ['讨论', '决策', '通报']
const MATERIAL_ITEMS = [
  { key: 'data', label: '数据/报表' },
  { key: 'plan', label: '方案文档' },
  { key: 'ppt', label: '演示 PPT' },
  { key: 'pre', label: '预读文档' }
]
const PLACEHOLDER = '____'

// 模板预设：一键填充典型议题框架
const AGENDA_TEMPLATES = {
  '周例会': [
    { name: '上次行动项回顾', owner: '主持人', type: '通报', minutes: 10 },
    { name: '各成员本周进展同步', owner: '全员', type: '讨论', minutes: 30 },
    { name: '本周问题与风险', owner: '主持人', type: '讨论', minutes: 15 },
    { name: '下周计划与分工', owner: '主持人', type: '决策', minutes: 15 },
    { name: '其他事项', owner: '全员', type: '通报', minutes: 5 }
  ],
  '项目评审': [
    { name: '项目进度与里程碑回顾', owner: '项目经理', type: '通报', minutes: 20 },
    { name: '关键偏差与原因分析', owner: '项目经理', type: '讨论', minutes: 25 },
    { name: '风险与跨团队依赖', owner: '各模块负责人', type: '讨论', minutes: 15 },
    { name: '资源与排期调整决策', owner: '决策人', type: '决策', minutes: 20 },
    { name: '行动项确认', owner: '主持人', type: '决策', minutes: 10 }
  ],
  '复盘会': [
    { name: '目标与结果回顾', owner: '负责人', type: '通报', minutes: 10 },
    { name: '数据对比与差距分析', owner: '负责人', type: '讨论', minutes: 25 },
    { name: '亮点与不足原因剖析', owner: '全员', type: '讨论', minutes: 30 },
    { name: '经验总结与改进措施', owner: '全员', type: '决策', minutes: 20 },
    { name: '改进行动项与责任人', owner: '主持人', type: '决策', minutes: 10 }
  ],
  '头脑风暴': [
    { name: '问题与目标说明', owner: '主持人', type: '通报', minutes: 10 },
    { name: '自由发散（不评判）', owner: '全员', type: '讨论', minutes: 40 },
    { name: '想法归类与收敛', owner: '主持人', type: '讨论', minutes: 20 },
    { name: '候选方案优先级讨论', owner: '全员', type: '决策', minutes: 15 },
    { name: '下一步验证安排', owner: '主持人', type: '决策', minutes: 5 }
  ]
}
const TEMPLATE_KEYS = Object.keys(AGENDA_TEMPLATES)

function escapeHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 'HH:MM' → 当日分钟数；非法返回 null
function parseHM(raw) {
  const m = String(raw || '').trim().match(/^(\d{1,2}):(\d{1,2})$/)
  if (!m) return null
  const h = Number(m[1]); const mi = Number(m[2])
  if (h > 23 || mi > 59) return null
  return h * 60 + mi
}

// 分钟数 → 'HH:MM'（跨小时自动进位，超过 24h 取模）
function fmtHM(mins) {
  const m = ((Number(mins) || 0) % 1440 + 1440) % 1440
  const h = Math.floor(m / 60)
  const mi = m % 60
  return String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0')
}

// 议题分钟数规范化：非法/负数 → 0
function normMinutes(v) {
  const n = Number(v)
  if (!isFinite(n) || n <= 0) return 0
  return Math.round(n)
}

// 过滤出有效议题行（有名称或有时长）
function validTopics(topics) {
  const arr = Array.isArray(topics) ? topics : []
  return arr
    .map((t) => {
      const o = t && typeof t === 'object' ? t : {}
      return {
        name: String(o.name ?? '').trim(),
        owner: String(o.owner ?? '').trim(),
        type: TOPIC_TYPES.includes(o.type) ? o.type : '讨论',
        minutes: normMinutes(o.minutes)
      }
    })
    .filter((t) => t.name || t.minutes > 0)
}

// 起止时刻表：从开始时刻逐条累加；开始时刻非法时起止为 '—'
function buildSchedule(topics, startTime) {
  const list = validTopics(topics)
  let cur = parseHM(startTime)
  return list.map((t) => {
    const start = cur === null ? '—' : fmtHM(cur)
    if (cur !== null) cur += t.minutes
    const end = cur === null ? '—' : fmtHM(cur)
    return { ...t, start, end }
  })
}

// 总时长（分钟）
function totalMinutes(topics) {
  return validTopics(topics).reduce((s, t) => s + t.minutes, 0)
}

// 与预定时长对比：planned 无效 → 'none'；total>planned → 'over'；相等 → 'exact'；否则 'under'
function timeCompare(total, planned) {
  const p = Number(planned)
  if (!isFinite(p) || p <= 0) return 'none'
  if (total > p) return 'over'
  if (total === p) return 'exact'
  return 'under'
}

// 按行拆分参会人
function splitLines(text) {
  return String(text || '').split('\n').map((s) => s.trim()).filter(Boolean)
}

// 草稿规范化
function normalizeAgendaDraft(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const str = (v) => String(v ?? '').slice(0, 4000)
  const meta = r.meta && typeof r.meta === 'object' ? r.meta : {}
  const material = r.materialChecks && typeof r.materialChecks === 'object' ? r.materialChecks : {}
  return {
    meta: {
      title: str(meta.title),
      date: str(meta.date),
      startTime: str(meta.startTime),
      location: str(meta.location),
      host: str(meta.host),
      plannedMinutes: normMinutes(meta.plannedMinutes) || '',
      attendees: str(meta.attendees)
    },
    topics: (Array.isArray(r.topics) ? r.topics : []).slice(0, 40).map((t) => {
      const o = t && typeof t === 'object' ? t : {}
      return {
        name: str(o.name),
        owner: str(o.owner),
        type: TOPIC_TYPES.includes(o.type) ? o.type : '讨论',
        minutes: Number(o.minutes) > 0 ? Number(o.minutes) : ''
      }
    }),
    materialChecks: MATERIAL_ITEMS.reduce((acc, m) => {
      acc[m.key] = Boolean(material[m.key])
      return acc
    }, {}),
    actions: (Array.isArray(r.actions) ? r.actions : []).slice(0, 30).map((a) => {
      const o = a && typeof a === 'object' ? a : {}
      return { task: str(o.task), owner: str(o.owner), due: str(o.due) }
    })
  }
}

// Markdown 议程（含全部议题行、材料清单与行动项框架）
function buildAgendaMarkdown(f) {
  const d = normalizeAgendaDraft(f)
  const meta = d.meta
  const schedule = buildSchedule(d.topics, meta.startTime)
  const total = totalMinutes(d.topics)
  const cmp = timeCompare(total, meta.plannedMinutes)

  const lines = []
  lines.push('# 会议议程：' + (meta.title.trim() || '（未命名会议）'))
  lines.push('')
  const attendeeList = splitLines(meta.attendees).join('、') || '（待定）'
  lines.push('- 会议时间：' + (meta.date || '（待定）') + ' ' + (meta.startTime || '（待定）'))
  lines.push('- 地点：' + (meta.location.trim() || '（待定）'))
  lines.push('- 主持人：' + (meta.host.trim() || '（待定）'))
  lines.push('- 参会人：' + attendeeList)
  const plannedTxt = Number(meta.plannedMinutes) > 0 ? Number(meta.plannedMinutes) + ' 分钟' : '（未设定）'
  let cmpTxt = ''
  if (cmp === 'over') cmpTxt = `（超时 ${total - Number(meta.plannedMinutes)} 分钟，需裁减议题）`
  else if (cmp === 'under') cmpTxt = `（剩余 ${Number(meta.plannedMinutes) - total} 分钟）`
  else if (cmp === 'exact') cmpTxt = '（刚好占满）'
  lines.push(`- 预定时长：${plannedTxt}｜议程合计：${total} 分钟${cmpTxt}`)
  lines.push('')
  lines.push('## 议程安排（起止时刻）')
  lines.push('')
  lines.push('| # | 议题 | 类型 | 提出人 | 时长 | 起止 |')
  lines.push('| --- | --- | --- | --- | --- | --- |')
  if (schedule.length === 0) {
    lines.push('| 1 | （待填写） | 讨论 |  | 0 | — |')
  } else {
    schedule.forEach((t, i) => {
      lines.push(`| ${i + 1} | ${t.name || '（未命名议题）'} | ${t.type} | ${t.owner || '—'} | ${t.minutes} 分钟 | ${t.start}-${t.end} |`)
    })
  }
  lines.push('')
  lines.push('## 会前材料清单')
  lines.push('')
  MATERIAL_ITEMS.forEach((m) => {
    lines.push(`- [${d.materialChecks[m.key] ? 'x' : ' '}] ${m.label}`)
  })
  lines.push('')
  lines.push('## 会后行动项（会上当场填写）')
  lines.push('')
  lines.push('| # | 事项 | 负责人 | 截止 |')
  lines.push('| --- | --- | --- | --- |')
  const actions = d.actions.length ? d.actions : [{ task: '', owner: '', due: '' }]
  actions.forEach((a, i) => {
    lines.push(`| ${i + 1} | ${a.task || ' '} | ${a.owner || ' '} | ${a.due || ' '} |`)
  })
  return lines.join('\n')
}

// A4 议程 HTML（预览与打印共用，全部转义）
function buildAgendaHtml(f) {
  const d = normalizeAgendaDraft(f)
  const meta = d.meta
  const schedule = buildSchedule(d.topics, meta.startTime)
  const total = totalMinutes(d.topics)
  const cmp = timeCompare(total, meta.plannedMinutes)
  const TBL = 'width:100%;border-collapse:collapse;font-size:12px;'
  const TD = 'border:1px solid #888;padding:5px 7px;vertical-align:top;line-height:1.6;'
  const THH = TD + 'background:#f5f5f5;text-align:left;font-weight:bold;white-space:nowrap;'
  const txt = (s) => (String(s ?? '').trim() ? escapeHtml(s) : PLACEHOLDER)

  const cmpText = cmp === 'over'
    ? `<span style="color:#dc2626;font-weight:bold;">超时 ${total - Number(meta.plannedMinutes)} 分钟，请裁减议题</span>`
    : cmp === 'under'
      ? `<span style="color:#16a34a;font-weight:bold;">剩余 ${Number(meta.plannedMinutes) - total} 分钟</span>`
      : cmp === 'exact'
        ? '<span style="color:#16a34a;font-weight:bold;">刚好占满预定时长</span>'
        : ''

  const scheduleRows = schedule.length
    ? schedule.map((t, i) => `<tr><td style="${TD}">${i + 1}</td><td style="${TD}">${txt(t.name)}</td><td style="${TD}">${txt(t.type)}</td><td style="${TD}">${txt(t.owner)}</td><td style="${TD}">${t.minutes} 分钟</td><td style="${TD}">${txt(t.start === '—' ? '' : t.start)} - ${txt(t.end === '—' ? '' : t.end)}</td></tr>`).join('')
    : `<tr><td style="${TD}">1</td><td style="${TD}">${PLACEHOLDER}</td><td style="${TD}">${PLACEHOLDER}</td><td style="${TD}">${PLACEHOLDER}</td><td style="${TD}">${PLACEHOLDER}</td><td style="${TD}">${PLACEHOLDER}</td></tr>`

  const materialHtml = MATERIAL_ITEMS
    .map((m) => `<li style="margin:2px 0;">${d.materialChecks[m.key] ? '√ 已备' : '□ 未备'}：${escapeHtml(m.label)}</li>`)
    .join('')

  const actions = d.actions.length ? d.actions : [{ task: '', owner: '', due: '' }]
  const actionRows = actions
    .map((a, i) => `<tr><td style="${TD}">${i + 1}</td><td style="${TD}">${txt(a.task)}</td><td style="${TD}">${txt(a.owner)}</td><td style="${TD}">${txt(a.due)}</td></tr>`)
    .join('')

  return [
    `<h1 style="text-align:center;font-size:21px;font-weight:bold;margin:0 0 4px;letter-spacing:0.1em;">会议议程</h1>`,
    `<p style="text-align:center;font-size:11px;color:#555;margin:0 0 14px;">${escapeHtml(meta.title.trim() || '（未命名会议）')}</p>`,
    `<table style="${TBL}">`,
    `<tr><th style="${THH}">日期时间</th><td style="${TD}">${txt(meta.date)} ${txt(meta.startTime)}</td><th style="${THH}">地点</th><td style="${TD}">${txt(meta.location)}</td></tr>`,
    `<tr><th style="${THH}">主持人</th><td style="${TD}">${txt(meta.host)}</td><th style="${THH}">参会人</th><td style="${TD}">${txt(splitLines(meta.attendees).join('、'))}</td></tr>`,
    `<tr><th style="${THH}">预定时长</th><td style="${TD}">${Number(meta.plannedMinutes) > 0 ? Number(meta.plannedMinutes) + ' 分钟' : PLACEHOLDER}</td><th style="${THH}">议程合计</th><td style="${TD}">${total} 分钟 ${cmpText}</td></tr>`,
    `</table>`,
    `<h2 style="font-size:15px;font-weight:bold;margin:16px 0 6px;padding:4px 8px;background:#efefef;border-left:4px solid #333;">议程安排（起止时刻）</h2>`,
    `<table style="${TBL}"><tr><th style="${THH}">#</th><th style="${THH}">议题</th><th style="${THH}">类型</th><th style="${THH}">提出人</th><th style="${THH}">时长</th><th style="${THH}">起止</th></tr>${scheduleRows}</table>`,
    `<h2 style="font-size:15px;font-weight:bold;margin:16px 0 6px;padding:4px 8px;background:#efefef;border-left:4px solid #333;">会前材料清单</h2>`,
    `<ul style="margin:0;padding-left:20px;font-size:12px;line-height:1.7;">${materialHtml}</ul>`,
    `<h2 style="font-size:15px;font-weight:bold;margin:16px 0 6px;padding:4px 8px;background:#efefef;border-left:4px solid #333;">会后行动项（会上当场填写）</h2>`,
    `<table style="${TBL}"><tr><th style="${THH}">#</th><th style="${THH}">事项</th><th style="${THH}">负责人</th><th style="${THH}">截止</th></tr>${actionRows}</table>`,
    `<p style="font-size:10px;color:#666;margin-top:14px;text-align:center;">本议程由有条工具会议议程生成器生成；「____」为待填空位。</p>`
  ].join('')
}
/* ==== PURE:END ==== */

// ---------- 状态 ----------
const DRAFT_KEY = 'meeting-agenda-generator.draft-v1'

const form = reactive({
  meta: { title: '', date: '', startTime: '', location: '', host: '', plannedMinutes: '', attendees: '' },
  topics: [],
  actions: []
})
const materialChecks = reactive({ data: false, plan: false, ppt: false, pre: false })
const copyDone = ref(false)

const addTopic = () => form.topics.push({ name: '', owner: '', type: '讨论', minutes: '' })
const removeTopic = (i) => form.topics.splice(i, 1)
const addAction = () => form.actions.push({ task: '', owner: '', due: '' })
const removeAction = (i) => form.actions.splice(i, 1)

const applyTemplate = (key) => {
  const tpl = AGENDA_TEMPLATES[key]
  if (!tpl) return
  form.topics = tpl.map((t) => ({ ...t }))
}

// 时长对比告警条
const cmpInfo = computed(() => {
  const total = totalMinutes(form.topics)
  const cmp = timeCompare(total, form.meta.plannedMinutes)
  if (cmp === 'none') return null
  if (cmp === 'over') {
    return {
      cls: 'bg-red-500/10 text-red-600 dark:text-red-400',
      text: `议程合计 ${total} 分钟，超出预定 ${Number(form.meta.plannedMinutes)} 分钟 ${total - Number(form.meta.plannedMinutes)} 分钟（红牌：建议裁减议题或另约专场）`
    }
  }
  if (cmp === 'exact') {
    return { cls: 'bg-success/10 text-success', text: `议程合计 ${total} 分钟，刚好占满预定时长` }
  }
  return {
    cls: 'bg-success/10 text-success',
    text: `议程合计 ${total} 分钟，剩余 ${Number(form.meta.plannedMinutes) - total} 分钟（绿牌：可加议题或提前散会）`
  }
})

const previewHtml = computed(() => buildAgendaHtml(form))
const markdownText = computed(() => buildAgendaMarkdown(form))

// ---------- 草稿（localStorage 仅在客户端读写） ----------
const buildDraft = () => normalizeAgendaDraft({
  meta: form.meta,
  topics: form.topics,
  materialChecks,
  actions: form.actions
})

const restore = () => {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    const d = normalizeAgendaDraft(JSON.parse(raw))
    Object.keys(d.meta).forEach((k) => { form.meta[k] = d.meta[k] })
    form.topics = d.topics
    form.actions = d.actions
    MATERIAL_ITEMS.forEach((m) => { materialChecks[m.key] = d.materialChecks[m.key] })
  } catch (e) { /* 草稿损坏则忽略 */ }
}

const persist = () => {
  if (typeof localStorage === 'undefined') return
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(buildDraft())) } catch (e) { /* 隐私模式静默 */ }
}

const clearDraft = () => {
  form.meta = { title: '', date: '', startTime: '', location: '', host: '', plannedMinutes: '', attendees: '' }
  form.topics = []
  form.actions = []
  MATERIAL_ITEMS.forEach((m) => { materialChecks[m.key] = false })
  if (typeof localStorage !== 'undefined') {
    try { localStorage.removeItem(DRAFT_KEY) } catch (e) { /* 忽略 */ }
  }
}

const printReport = () => { window.print() }

let copyTimer = null
const copyMarkdown = async () => {
  try {
    await navigator.clipboard.writeText(markdownText.value)
    copyDone.value = true
    alert('已复制')
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copyDone.value = false }, 2000)
  } catch (e) { /* 剪贴板不可用时用户可手动复制 */ }
}

// 生命周期：草稿恢复 + 自动保存 watcher 都挂在客户端
onMounted(() => {
  addRecentTool('meeting-agenda-generator')
  restore()
  // 首次访问预置留空框架：2 条议题行 + 3 条行动项行
  if (!form.topics.length) { addTopic(); addTopic() }
  if (!form.actions.length) { addAction(); addAction(); addAction() }
  watch(buildDraft, persist)
})
</script>

<style scoped>
.fld {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  color: hsl(var(--foreground));
  font-size: 0.875rem;
  outline: none;
}
.fld:focus {
  box-shadow: 0 0 0 2px hsl(var(--ring));
}
.a4-paper {
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
@media print {
  .no-print {
    display: none !important;
  }
  .a4-paper {
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
  .bg-white {
    border: none !important;
    box-shadow: none !important;
  }
}
</style>

<style>
@media print {
  header {
    display: none !important;
  }
}
@page {
  size: A4 portrait;
  margin: 0;
}
</style>
