<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Shapes class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">决策执行框架卡</h1>
          <p class="text-sm text-muted-foreground mt-1">5W2H 定计划、PDCA 管循环、艾森豪威尔四象限排优先级，三套框架结构化填表</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        把「决定要做的事」装进三套经典框架：5W2H 七问把模糊意图追问成可执行计划卡；PDCA 四步按轮次记录循环改进，
        支持多轮保存回看；艾森豪威尔矩阵按「重要/紧急」两个开关把任务自动落进四象限并给出每格行动建议。
        各框架独立保存草稿到本机浏览器，全部框架支持复制 Markdown 与打印。全部处理本地完成，不上传数据。
      </p>
    </div>

    <!-- 框架切换 -->
    <div class="no-print flex flex-wrap gap-2 mb-6">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        type="button"
        @click="activeTab = tab.key"
        :class="activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
      >
        <component :is="tab.icon" class="w-4 h-4" /> {{ tab.label }}
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：按框架切换的表单 -->
      <div class="no-print space-y-4">
        <!-- ① 5W2H -->
        <template v-if="activeTab === '5w2h'">
          <div class="bg-card border border-border rounded-lg p-6">
            <h2 class="text-lg font-semibold flex items-center mb-1">
              <ClipboardList class="w-5 h-5 mr-2 text-primary" /> 执行计划卡（5W2H）
            </h2>
            <p class="text-xs text-muted-foreground mb-4">七问追问：What 定交付物，Why 定价值，其余五问把人、时、地、法、本定清楚</p>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">计划主题</label>
                <input v-model="fw5.topic" type="text" class="fld" placeholder="如：上线会员积分商城" />
              </div>
              <div v-for="f in FIELDS_5W2H" :key="f.key" class="border border-border rounded-lg p-3">
                <label class="block text-sm font-medium text-foreground mb-1">{{ f.q }} {{ f.cn }}</label>
                <p class="text-xs text-muted-foreground mb-2">提示：{{ f.hint }}<br />示例：{{ f.example }}</p>
                <textarea v-model="fw5[f.key]" rows="2" class="fld resize-y" :placeholder="f.placeholder" :aria-label="`${f.q} ${f.cn}`"></textarea>
              </div>
            </div>
          </div>
        </template>

        <!-- ② PDCA -->
        <template v-else-if="activeTab === 'pdca'">
          <div class="bg-card border border-border rounded-lg p-6">
            <h2 class="text-lg font-semibold flex items-center mb-1">
              <Repeat class="w-5 h-5 mr-2 text-primary" /> PDCA 循环
            </h2>
            <p class="text-xs text-muted-foreground mb-4">
              Plan 定假设与指标，Do 小步执行，Check 拿数据对照，Act 定「固化或改进」——每轮保存后开始下一轮
            </p>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">循环主题</label>
                <input v-model="pdca.topic" type="text" class="fld" placeholder="如：落地页转化率优化" />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">本轮周期备注（可选）</label>
                <input v-model="pdca.roundDate" type="text" class="fld" placeholder="如 2026-11 第 1 轮 / 第 1-2 周" />
              </div>
              <div v-for="s in PDCA_STEPS" :key="s.key" class="border border-border rounded-lg p-3">
                <label class="block text-sm font-medium text-foreground mb-1">{{ s.q }} {{ s.cn }}</label>
                <p class="text-xs text-muted-foreground mb-2">提示：{{ s.hint }}</p>
                <textarea v-model="pdca.current[s.key]" rows="2" class="fld resize-y" :placeholder="s.placeholder" :aria-label="`${s.q} ${s.cn}`"></textarea>
              </div>
              <div class="flex flex-wrap gap-2">
                <button type="button" @click="saveRound" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition">
                  <Save class="w-4 h-4" /> 保存为本轮（第 {{ pdca.rounds.length + 1 }} 轮）并开始下一轮
                </button>
              </div>
            </div>
          </div>

          <!-- 已保存轮次 -->
          <div class="bg-card border border-border rounded-lg p-6">
            <h3 class="text-base font-semibold flex items-center mb-3">
              <ListChecks class="w-4 h-4 mr-2 text-primary" /> 已保存轮次（{{ pdca.rounds.length }}）
            </h3>
            <p v-if="!pdca.rounds.length" class="text-sm text-muted-foreground">还没有保存任何轮次。填好上方四步后点「保存为本轮」，轮次会按顺序累积，方便回看改进轨迹。</p>
            <div v-for="(r, i) in pdca.rounds" :key="r.no" class="border border-border rounded-lg p-3 mb-2">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-bold text-primary">第 {{ r.no }} 轮 <span v-if="r.date" class="font-normal text-muted-foreground">（{{ r.date }}）</span></span>
                <button type="button" @click="removeRound(i)" class="p-1 text-muted-foreground hover:text-red-600 transition" aria-label="删除该轮">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
              <p class="text-xs text-muted-foreground leading-relaxed">
                <span class="text-foreground font-medium">Plan：</span>{{ r.plan || '（未填）' }}｜
                <span class="text-foreground font-medium">Do：</span>{{ r.do || '（未填）' }}｜
                <span class="text-foreground font-medium">Check：</span>{{ r.check || '（未填）' }}｜
                <span class="text-foreground font-medium">Act：</span>{{ r.act || '（未填）' }}
              </p>
            </div>
          </div>
        </template>

        <!-- ③ 艾森豪威尔四象限 -->
        <template v-else>
          <div class="bg-card border border-border rounded-lg p-6">
            <h2 class="text-lg font-semibold flex items-center mb-1">
              <LayoutGrid class="w-5 h-5 mr-2 text-primary" /> 任务清单（艾森豪威尔四象限）
            </h2>
            <p class="text-xs text-muted-foreground mb-3">录入任务后勾选「重要」「紧急」两个维度，任务自动落进对应象限</p>
            <div v-for="(t, i) in tasks" :key="i" class="flex flex-wrap items-center gap-2 mb-2">
              <input v-model="t.name" type="text" class="fld flex-1 min-w-[160px]" placeholder="任务名（如 完成季度复盘报告）" :aria-label="`任务${i + 1} 名称`" />
              <label class="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer select-none">
                <input v-model="t.important" type="checkbox" class="w-4 h-4" /> 重要
              </label>
              <label class="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer select-none">
                <input v-model="t.urgent" type="checkbox" class="w-4 h-4" /> 紧急
              </label>
              <button type="button" @click="removeTask(i)" class="p-2 text-muted-foreground hover:text-red-600 transition" aria-label="删除该任务">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
            <button type="button" @click="addTask" class="mt-1 px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground transition flex items-center gap-1">
              <Plus class="w-3.5 h-3.5" /> 添加任务
            </button>
          </div>

          <!-- 四象限行动建议卡 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="qk in QUADRANT_ORDER"
              :key="qk"
              class="bg-card border border-border rounded-xl p-4 border-t-4"
              :class="QUADRANTS[qk].cls"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-bold text-foreground">{{ qk }} {{ QUADRANTS[qk].title }}</span>
                <span class="text-xs font-bold px-2 py-0.5 rounded" :class="QUADRANTS[qk].badgeCls">{{ QUADRANTS[qk].action }}</span>
              </div>
              <p class="text-xs text-muted-foreground leading-relaxed mb-2">{{ QUADRANTS[qk].advice }}</p>
              <ul class="space-y-1">
                <li v-for="t in grouped[qk]" :key="t.id" class="text-sm text-foreground flex items-start gap-1.5">
                  <span class="text-primary">·</span><span>{{ t.name }}</span>
                </li>
              </ul>
              <p v-if="!grouped[qk].length" class="text-xs text-muted-foreground">（暂无任务）</p>
            </div>
          </div>
        </template>

        <!-- 操作（共用） -->
        <div class="bg-card border border-border rounded-lg p-6 flex flex-wrap gap-2">
          <button type="button" @click="copyMarkdown" class="flex-1 min-w-[130px] px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5">
            <Copy class="w-4 h-4" /> 复制当前框架 Markdown
          </button>
          <button type="button" @click="printReport" class="flex-1 min-w-[100px] px-4 py-2.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition flex items-center justify-center gap-1.5">
            <Printer class="w-4 h-4" /> 打印
          </button>
          <button type="button" @click="clearActive" class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-muted-foreground transition flex items-center justify-center gap-1.5">
            <Eraser class="w-4 h-4" /> 清空当前框架
          </button>
        </div>
        <p class="text-xs text-muted-foreground">三个框架的草稿独立保存在本机浏览器，切换标签互不影响。</p>
      </div>

      <!-- 右：预览 -->
      <div class="print-area">
        <div class="no-print flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Printer class="w-5 h-5 mr-2 text-primary" /> 框架卡预览
          </h2>
          <button type="button" @click="printReport" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1.5">
            <Printer class="w-4 h-4" /> 打印
          </button>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 preview-panel">
          <!-- 5W2H 预览 -->
          <div v-if="activeTab === '5w2h'">
            <h3 class="text-xl font-bold text-foreground mb-1">执行计划卡（5W2H）</h3>
            <p class="text-sm text-primary font-medium mb-4">{{ fw5.topic.trim() || '（计划主题待填）' }}</p>
            <div class="space-y-2.5">
              <div v-for="f in FIELDS_5W2H" :key="f.key" class="bg-muted/50 rounded-xl p-3">
                <p class="text-xs font-bold text-primary mb-1">{{ f.q }} · {{ f.cn }}</p>
                <p class="text-sm text-foreground whitespace-pre-wrap break-words">{{ fw5[f.key].trim() || '（待填）' }}</p>
              </div>
            </div>
          </div>

          <!-- PDCA 预览 -->
          <div v-else-if="activeTab === 'pdca'">
            <h3 class="text-xl font-bold text-foreground mb-1">PDCA 循环</h3>
            <p class="text-sm text-primary font-medium mb-4">{{ pdca.topic.trim() || '（循环主题待填）' }}</p>
            <div class="bg-muted/50 rounded-xl p-3 mb-3">
              <p class="text-xs font-bold text-primary mb-1">进行中：第 {{ pdca.rounds.length + 1 }} 轮{{ pdca.roundDate.trim() ? '（' + pdca.roundDate.trim() + '）' : '' }}</p>
              <p v-for="s in PDCA_STEPS" :key="s.key" class="text-sm text-foreground leading-relaxed">
                <span class="font-medium">{{ s.q }}：</span>{{ pdca.current[s.key].trim() || '（待填）' }}
              </p>
            </div>
            <div v-if="pdca.rounds.length">
              <h4 class="text-sm font-bold text-foreground mb-2">已保存 {{ pdca.rounds.length }} 轮</h4>
              <div v-for="r in pdca.rounds" :key="r.no" class="bg-muted/50 rounded-xl p-3 mb-2">
                <p class="text-xs font-bold text-primary mb-1">第 {{ r.no }} 轮{{ r.date ? '（' + r.date + '）' : '' }}</p>
                <p class="text-sm text-foreground leading-relaxed"><span class="font-medium">Plan：</span>{{ r.plan || '（未填）' }}</p>
                <p class="text-sm text-foreground leading-relaxed"><span class="font-medium">Do：</span>{{ r.do || '（未填）' }}</p>
                <p class="text-sm text-foreground leading-relaxed"><span class="font-medium">Check：</span>{{ r.check || '（未填）' }}</p>
                <p class="text-sm text-foreground leading-relaxed"><span class="font-medium">Act：</span>{{ r.act || '（未填）' }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-muted-foreground">（暂无已保存轮次）</p>
          </div>

          <!-- 四象限预览 -->
          <div v-else>
            <h3 class="text-xl font-bold text-foreground mb-4">优先级四象限</h3>
            <div class="grid grid-cols-2 gap-3">
              <div v-for="qk in QUADRANT_ORDER" :key="qk" class="bg-muted/50 rounded-xl p-3 border-t-4" :class="QUADRANTS[qk].cls">
                <p class="text-xs font-bold text-foreground mb-1">{{ qk }} {{ QUADRANTS[qk].title }} <span class="text-primary">{{ QUADRANTS[qk].action }}</span></p>
                <ul class="space-y-1">
                  <li v-for="t in grouped[qk]" :key="t.id" class="text-sm text-foreground">· {{ t.name }}</li>
                </ul>
                <p v-if="!grouped[qk].length" class="text-xs text-muted-foreground">（无）</p>
              </div>
            </div>
          </div>
        </div>
        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">预览随左侧填写实时更新；打印时仅输出本预览内容。</p>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="no-print bg-card border border-border rounded-lg p-6 mb-8">
      <summary class="text-lg font-semibold cursor-pointer select-none text-foreground flex items-center">
        <span class="text-primary mr-2">#</span>5W2H、PDCA、四象限分别什么时候用？三框架对照与常见问题
      </summary>
      <div class="space-y-4 text-sm text-muted-foreground leading-relaxed mt-4">
        <h3 class="text-lg font-semibold text-foreground">三框架适用场景对照</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">5W2H——定计划：</span>一件事决定要做但还说不清楚时，用七问把 What（交付什么）、Why（为什么值得做）、Who（谁负责）、When（何时完成）、Where（在哪落地）、How（怎么做）、How much（成本与收益）一次追问完。输出的计划卡可以直接当立项页或任务说明用。</li>
          <li><span class="text-foreground font-medium">PDCA——管循环：</span>需要持续迭代的事（转化率优化、质量改进、习惯养成）用四步循环跑：Plan 假设与指标、Do 小步执行、Check 数据对照、Act 固化或改进，然后进入下一轮。按轮次保存的意义就在回看：第几轮改了什么、哪轮开始有效。</li>
          <li><span class="text-foreground font-medium">艾森豪威尔四象限——排优先级：</span>事情多到做不完时，用重要/紧急两个维度把任务分进四格：重要且紧急马上做，重要不紧急计划做（真正拉开差距的一格），不重要紧急授权做，不重要不紧急减少做。</li>
        </ul>
        <p>
          一个典型组合用法：用四象限挑出本周要事 → 对要事用 5W2H 写出计划卡 → 执行阶段用 PDCA 逐轮迭代。三套框架分别解决「选哪件」「怎么做」「怎么改」。
        </p>
        <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><span class="text-foreground font-medium">5W2H 每问都要写满吗？</span>不必。What/Why/When/Who 四问是底线，缺了任何一件计划就不可执行；Where/How much 视事情性质取舍，但 How much 建议尽量写——成本不清的计划最容易中途翻车。</li>
          <li><span class="text-foreground font-medium">PDCA 一轮应该多大？</span>以「能拿到一次可对照的数据」为界：短则一周，长则一个月。轮次太长会失去迭代意义，太短则数据噪声盖过信号。</li>
          <li><span class="text-foreground font-medium">四象限里「紧急但不重要」的任务太多怎么办？</span>这是流程问题不是个人问题：把高频出现的 Q3 任务模板化、自动化或授权出去；如果授权不了，说明组织分工有待调整，先把重复项记录下来再谈。</li>
          <li><span class="text-foreground font-medium">填写内容会上传吗？</span>不会。三个框架的草稿都保存在当前浏览器 localStorage 中且互相独立，换设备或清除浏览器数据会丢失，请及时复制或打印。</li>
        </ul>
        <h3 class="text-lg font-semibold text-foreground">延伸工具</h3>
        <p>
          如果你的「要事」需要设定目标与关键结果并跟踪达成，可以配合 <a href="/tools/okr-generator/" class="text-primary hover:underline">OKR 生成器</a> 把计划升级为可度量的目标管理。
        </p>
        <h3 class="text-lg font-semibold text-foreground">来源与口径说明</h3>
        <p>
          5W2H 追问法源于拉迪亚德·吉卜林「五个忠实仆人」（5W）并补充 How 与 How much 后成为管理学通用工具；PDCA 循环由沃特·休哈特提出、
          威廉·戴明推广（故亦称戴明环）；艾森豪威尔矩阵得名于德怀特·艾森豪威尔的决策原则，经史蒂芬·柯维《高效能人士的七个习惯》广泛传播。
          本工具的提示语与行动建议为教学口径的简化整理，输出为参考模板。
        </p>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :current-tool-id="'decision-framework-cards'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  Shapes, ClipboardList, Repeat, LayoutGrid, ListChecks, Plus, Trash2,
  Save, Printer, Copy, Check, Eraser
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '决策执行框架卡 - 5W2H/PDCA/四象限三套框架在线填表',
  description: '免费在线决策执行框架工具：5W2H 七问生成执行计划卡（每问带提示语与示例）、PDCA 四步循环按轮次保存改进记录、艾森豪威尔矩阵按重要/紧急自动落四象限并给出行动建议，各框架独立草稿、复制 Markdown、打印，本地处理不上传',
  keywords: '5W2H分析,PDCA循环,艾森豪威尔矩阵,任务四象限,决策框架,优先级排序,执行计划模板,时间管理四象限',
  author: '有条工具',
  ogTitle: '决策执行框架卡 - 5W2H/PDCA/四象限三合一 | 有条工具',
  ogDescription: '5W2H 定计划、PDCA 管循环、四象限排优先级，结构化填表导出行动清单。',
  ogUrl: 'https://www.util.cn/tools/decision-framework-cards',
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
          name: '决策执行框架卡',
          url: 'https://www.util.cn/tools/decision-framework-cards',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['5W2H 七问结构化计划卡（每问带提示语与示例）', 'PDCA 四步填表并支持多轮次保存回看', '艾森豪威尔四象限按重要/紧急自动落格', '每象限附行动建议卡', '三框架草稿独立保存', '复制 Markdown 与打印', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '决策执行框架卡', item: 'https://www.util.cn/tools/decision-framework-cards/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '5W2H、PDCA、四象限分别什么时候用？',
              acceptedAnswer: { '@type': 'Answer', text: '5W2H 用于把决定要做的事追问成可执行计划；PDCA 用于需要持续迭代的事按轮次循环改进；四象限用于事情多时按重要/紧急排优先级。三者分别解决「选哪件」「怎么做」「怎么改」。' }
            },
            {
              '@type': 'Question',
              name: 'PDCA 一轮应该多大？',
              acceptedAnswer: { '@type': 'Answer', text: '以「能拿到一次可对照的数据」为界，短则一周、长则一个月。太长失去迭代意义，太短则数据噪声盖过信号。' }
            },
            {
              '@type': 'Question',
              name: '「紧急但不重要」的任务太多怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '这是流程问题：把高频出现的第三象限任务模板化、自动化或授权出去，并把重复项记录下来推动分工调整。' }
            },
            {
              '@type': 'Question',
              name: '填写内容会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。三个框架的草稿都保存在当前浏览器 localStorage 中且互相独立，换设备或清除浏览器数据会丢失，请及时复制或打印。' }
            }
          ]
        }
      ]
    })
  }]
})

/* ==== PURE:BEGIN ==== */
const PLACEHOLDER = '（待填）'

// ---------- ① 5W2H ----------
const FIELDS_5W2H = [
  { key: 'what', q: 'What', cn: '做什么', hint: '具体的交付物是什么？写成可验收的一句话', example: '上线会员积分商城 H5（含兑换与明细页）' },
  { key: 'why', q: 'Why', cn: '为什么做', hint: '解决什么问题、带来什么价值？关联业务指标', example: '提升老用户月活与复购率' },
  { key: 'who', q: 'Who', cn: '谁来做', hint: '写姓名与分工，不写部门名；谁拍板也要写', example: '负责人小李；视觉小王；验收人张总监' },
  { key: 'when', q: 'When', cn: '何时完成', hint: '关键节点与最终截止日，日期精确到天', example: '11-20 提测，11-27 灰度，11-30 全量' },
  { key: 'where', q: 'Where', cn: '在哪落地', hint: '范围、渠道或使用场景；不涉及地点时可写适用对象', example: 'App「我的」页新入口，面向全体会员' },
  { key: 'how', q: 'How', cn: '怎么做', hint: '关键步骤与方案路径，先做什么后做什么', example: '复用现有优惠券系统，新增积分兑换接口与活动页' },
  { key: 'howMuch', q: 'How much', cn: '成本/收益', hint: '要投入多少资源，预期产出多少？两侧都写', example: '2 人 × 3 周；预期月活 +5%、复购率 +1.2pct' }
]

// 草稿规范化（5W2H）
function normalize5w2hDraft(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const str = (v) => String(v ?? '').slice(0, 4000)
  const d = { topic: str(r.topic) }
  FIELDS_5W2H.forEach((f) => { d[f.key] = str(r[f.key]) })
  return d
}

// 5W2H 计划卡 Markdown（七问恒完整导出，未填显示「待填」）
function build5w2hMarkdown(f) {
  const d = normalize5w2hDraft(f)
  const lines = []
  lines.push('# 执行计划卡（5W2H）' + (d.topic.trim() ? '：' + d.topic.trim() : ''))
  lines.push('')
  FIELDS_5W2H.forEach((f) => {
    lines.push(`- **${f.q} ${f.cn}**：${d[f.key].trim() || PLACEHOLDER}`)
  })
  return lines.join('\n')
}

// ---------- ② PDCA ----------
const PDCA_STEPS = [
  { key: 'plan', q: 'Plan', cn: '计划', hint: '本轮假设是什么？改什么、预期指标变化多少？', placeholder: '如：把 CTA 按钮从灰改为主色，预期点击率 3.2%→3.8%' },
  { key: 'do', q: 'Do', cn: '执行', hint: '实际做了什么改动？范围、样本与执行时间', placeholder: '如：11-03 在 20% 流量灰度上线新版按钮' },
  { key: 'check', q: 'Check', cn: '检查', hint: '数据结果与假设对照：达标、未达还是方向反了？', placeholder: '如：点击率 3.5%，未达 3.8% 但显著高于对照' },
  { key: 'act', q: 'Act', cn: '处理', hint: '固化（全量）、调整后再试，还是放弃该假设？', placeholder: '如：全量发布；下一轮测试按钮文案而非颜色' }
]

// 草稿规范化（PDCA，含多轮次）
function normalizePdcaDraft(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const str = (v) => String(v ?? '').slice(0, 4000)
  const cur = r.current && typeof r.current === 'object' ? r.current : {}
  const current = {}
  PDCA_STEPS.forEach((s) => { current[s.key] = str(cur[s.key]) })
  const rounds = (Array.isArray(r.rounds) ? r.rounds : []).slice(0, 60).map((rd, i) => {
    const o = rd && typeof rd === 'object' ? rd : {}
    const entry = { no: Number(o.no) > 0 ? Math.floor(Number(o.no)) : i + 1, date: str(o.date).slice(0, 60) }
    PDCA_STEPS.forEach((s) => { entry[s.key] = str(o[s.key]) })
    return entry
  })
  return { topic: str(r.topic), roundDate: str(r.roundDate).slice(0, 60), current, rounds }
}

// 保存本轮：把 current 追加为下一轮（编号自动递增），并返回新的空 current
function savePdcaRound(current, rounds, date) {
  const r = current && typeof current === 'object' ? current : {}
  const list = Array.isArray(rounds) ? rounds : []
  const entry = { no: list.length + 1, date: String(date || '').trim().slice(0, 60) }
  PDCA_STEPS.forEach((s) => { entry[s.key] = String(r[s.key] ?? '').trim() })
  const hasContent = PDCA_STEPS.some((s) => entry[s.key])
  const next = {}
  PDCA_STEPS.forEach((s) => { next[s.key] = '' })
  if (!hasContent) return { rounds: list.slice(), entry: null, current: next, saved: false }
  return { rounds: [...list, entry], entry, current: next, saved: true }
}

// PDCA Markdown（当前轮 + 全部历史轮次）
function buildPdcaMarkdown(p) {
  const d = normalizePdcaDraft(p)
  const lines = []
  lines.push('# PDCA 循环' + (d.topic.trim() ? '：' + d.topic.trim() : ''))
  lines.push('')
  lines.push(`## 下一轮（进行中）${d.roundDate.trim() ? '——' + d.roundDate.trim() : ''}`)
  lines.push('')
  PDCA_STEPS.forEach((s) => {
    lines.push(`- ${s.q} ${s.cn}：${d.current[s.key].trim() || PLACEHOLDER}`)
  })
  if (d.rounds.length) {
    lines.push('')
    lines.push(`## 已保存轮次（${d.rounds.length} 轮）`)
    d.rounds.forEach((r) => {
      lines.push('')
      lines.push(`### 第 ${r.no} 轮${r.date ? '（' + r.date + '）' : ''}`)
      lines.push('')
      PDCA_STEPS.forEach((s) => {
        lines.push(`- ${s.q} ${s.cn}：${r[s.key] || '（未填）'}`)
      })
    })
  }
  return lines.join('\n')
}

// ---------- ③ 艾森豪威尔四象限 ----------
const QUADRANTS = {
  Q1: {
    title: '重要且紧急', action: '马上做',
    advice: '危机、临期任务。预留当天第一块整段时间集中处理；处理完顺手复盘为什么会拖到紧急，争取下次在 Q2 拦住它。',
    cls: 'border-t-red-500/60', badgeCls: 'bg-red-500/10 text-red-600 dark:text-red-400'
  },
  Q2: {
    title: '重要不紧急', action: '计划做',
    advice: '成长、防患、体系建设。每周固定时间块推进，给它们明确的截止日；这一格决定长期产出，是四格里最不能省的一格。',
    cls: 'border-t-success', badgeCls: 'bg-success/10 text-success'
  },
  Q3: {
    title: '不重要但紧急', action: '授权做',
    advice: '临时请求、例行事务。能授权就授权、能批量就批量，把高频项固化成流程或模板，减少对整块时间的打断。',
    cls: 'border-t-yellow-500/60', badgeCls: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
  },
  Q4: {
    title: '不重要不紧急', action: '减少做',
    advice: '琐事与消耗。能删就删、能合并就合并；如果说不清删掉它的代价，那这个代价多半不存在。',
    cls: 'border-t-border', badgeCls: 'bg-muted text-muted-foreground'
  }
}
const QUADRANT_ORDER = ['Q1', 'Q2', 'Q3', 'Q4']

// 落格逻辑：重要+紧急→Q1；重要不紧急→Q2；不重要紧急→Q3；两者皆无→Q4
function quadrantOf(important, urgent) {
  const i = Boolean(important)
  const u = Boolean(urgent)
  if (i && u) return 'Q1'
  if (i && !u) return 'Q2'
  if (!i && u) return 'Q3'
  return 'Q4'
}

// 任务列表按象限分组（过滤空任务名）
function groupTasks(tasks) {
  const list = (Array.isArray(tasks) ? tasks : []).filter((t) => {
    const o = t && typeof t === 'object' ? t : {}
    return String(o.name ?? '').trim()
  })
  const grouped = { Q1: [], Q2: [], Q3: [], Q4: [] }
  list.forEach((t, idx) => {
    const name = String(t.name).trim()
    grouped[quadrantOf(t.important, t.urgent)].push({ id: idx, name })
  })
  return grouped
}

// 草稿规范化（四象限任务列表）
function normalizeTasksDraft(raw) {
  return (Array.isArray(raw) ? raw : []).slice(0, 100).map((t) => {
    const o = t && typeof t === 'object' ? t : {}
    return { name: String(o.name ?? '').slice(0, 300), important: Boolean(o.important), urgent: Boolean(o.urgent) }
  })
}

// 四象限 Markdown
function buildEisenhowerMarkdown(tasks) {
  const grouped = groupTasks(tasks)
  const lines = []
  lines.push('# 优先级四象限（艾森豪威尔矩阵）')
  QUADRANT_ORDER.forEach((qk) => {
    lines.push('')
    lines.push(`## ${qk} ${QUADRANTS[qk].title} → ${QUADRANTS[qk].action}`)
    lines.push('')
    if (grouped[qk].length) {
      grouped[qk].forEach((t, i) => lines.push(`${i + 1}. ${t.name}`))
    } else {
      lines.push('（无任务）')
    }
    lines.push('')
    lines.push(`> 行动建议：${QUADRANTS[qk].advice}`)
  })
  return lines.join('\n')
}
/* ==== PURE:END ==== */

// ---------- 状态 ----------
const TABS = [
  { key: '5w2h', label: '5W2H 计划卡', icon: ClipboardList },
  { key: 'pdca', label: 'PDCA 循环', icon: Repeat },
  { key: 'eisenhower', label: '四象限优先级', icon: LayoutGrid }
]
const KEYS_5W2H = 'decision-framework-cards.5w2h.draft-v1'
const KEYS_PDCA = 'decision-framework-cards.pdca.draft-v1'
const KEYS_EISE = 'decision-framework-cards.eisenhower.draft-v1'

const activeTab = ref('5w2h')
const copyDone = ref(false)

// ① 5W2H
const fw5 = reactive({ topic: '', what: '', why: '', who: '', when: '', where: '', how: '', howMuch: '' })

// ② PDCA
const pdca = reactive({
  topic: '',
  roundDate: '',
  current: { plan: '', do: '', check: '', act: '' },
  rounds: []
})
const saveRound = () => {
  const res = savePdcaRound(pdca.current, pdca.rounds, pdca.roundDate)
  if (!res.saved) {
    alert('本轮四步都还没填，先写点内容再保存。')
    return
  }
  pdca.rounds = res.rounds
  PDCA_STEPS.forEach((s) => { pdca.current[s.key] = '' })
}
const removeRound = (i) => {
  pdca.rounds.splice(i, 1)
  pdca.rounds.forEach((r, idx) => { r.no = idx + 1 })
}

// ③ 四象限
const tasks = reactive([])
const addTask = () => tasks.push({ name: '', important: false, urgent: false })
const removeTask = (i) => tasks.splice(i, 1)
const grouped = computed(() => groupTasks(tasks))

// 导出内容
const markdownText = computed(() => {
  if (activeTab.value === '5w2h') return build5w2hMarkdown(fw5)
  if (activeTab.value === 'pdca') return buildPdcaMarkdown(pdca)
  return buildEisenhowerMarkdown(tasks)
})

// ---------- 草稿（三框架独立保存，仅客户端读写） ----------
const restore = () => {
  if (typeof localStorage === 'undefined') return
  try {
    const raw5 = localStorage.getItem(KEYS_5W2H)
    if (raw5) {
      const d = normalize5w2hDraft(JSON.parse(raw5))
      Object.keys(d).forEach((k) => { fw5[k] = d[k] })
    }
  } catch (e) { /* 忽略损坏草稿 */ }
  try {
    const rawP = localStorage.getItem(KEYS_PDCA)
    if (rawP) {
      const d = normalizePdcaDraft(JSON.parse(rawP))
      pdca.topic = d.topic
      pdca.roundDate = d.roundDate
      PDCA_STEPS.forEach((s) => { pdca.current[s.key] = d.current[s.key] })
      pdca.rounds = d.rounds
    }
  } catch (e) { /* 忽略损坏草稿 */ }
  try {
    const rawE = localStorage.getItem(KEYS_EISE)
    if (rawE) {
      normalizeTasksDraft(JSON.parse(rawE)).forEach((t) => tasks.push(t))
    }
  } catch (e) { /* 忽略损坏草稿 */ }
}

const persist5 = () => {
  if (typeof localStorage === 'undefined') return
  try { localStorage.setItem(KEYS_5W2H, JSON.stringify(normalize5w2hDraft(fw5))) } catch (e) { /* 静默 */ }
}
const persistP = () => {
  if (typeof localStorage === 'undefined') return
  try { localStorage.setItem(KEYS_PDCA, JSON.stringify(normalizePdcaDraft(pdca))) } catch (e) { /* 静默 */ }
}
const persistE = () => {
  if (typeof localStorage === 'undefined') return
  try { localStorage.setItem(KEYS_EISE, JSON.stringify(normalizeTasksDraft(tasks))) } catch (e) { /* 静默 */ }
}

const clearActive = () => {
  if (activeTab.value === '5w2h') {
    Object.keys(fw5).forEach((k) => { fw5[k] = '' })
    try { localStorage.removeItem(KEYS_5W2H) } catch (e) { /* 忽略 */ }
  } else if (activeTab.value === 'pdca') {
    pdca.topic = ''
    pdca.roundDate = ''
    PDCA_STEPS.forEach((s) => { pdca.current[s.key] = '' })
    pdca.rounds = []
    try { localStorage.removeItem(KEYS_PDCA) } catch (e) { /* 忽略 */ }
  } else {
    tasks.splice(0, tasks.length)
    try { localStorage.removeItem(KEYS_EISE) } catch (e) { /* 忽略 */ }
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

onMounted(() => {
  addRecentTool('decision-framework-cards')
  restore()
  // 首次访问预置 2 条空任务行
  if (!tasks.length) { addTask(); addTask() }
  watch(normalize5w2hDraft.bind(null, fw5), persist5)
  watch(normalizePdcaDraft.bind(null, pdca), persistP)
  watch(normalizeTasksDraft.bind(null, tasks), persistE)
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
.preview-panel {
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
@media print {
  .no-print {
    display: none !important;
  }
  .preview-panel {
    border: none !important;
    background: transparent !important;
  }
}
</style>

<style>
@media print {
  header {
    display: none !important;
  }
}
</style>
