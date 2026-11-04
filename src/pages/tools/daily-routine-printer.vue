<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <CalendarClock class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">作息计划表打印</h1>
          <p class="text-sm text-muted-foreground mt-1">上学日 / 暑假 / 通勤 / 幼儿园四套模板，A4 竖版贴墙计划表，支持周一到周日打卡格</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线作息时间表制作与打印工具：选择模板场景一键预填全天安排（时间、图标、事项、备注全部可改可排序），
        自动按「以最早时间为日内起点」排序并估算睡眠时长；可切换周一到周日七列周视图，格子支持「点填」或「勾选」两种模式，
        勾选模式打印后为空白复选框 □ 供每晚手写打卡。A4 竖版 10mm 页边距，浏览器直接打印或另存 PDF 贴墙。全部本地编辑、localStorage 自动保存，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 print-grid">
      <!-- 左：编辑面板 -->
      <div class="no-print bg-card border border-border rounded-lg p-6 space-y-4 self-start">
        <h2 class="text-lg font-semibold flex items-center">
          <CalendarClock class="w-5 h-5 mr-2 text-primary" /> 编辑作息表
        </h2>

        <!-- 模板场景 -->
        <div>
          <label for="tplSelect" class="block text-sm font-medium text-foreground mb-1.5">模板场景（切换即整表预填，时间全部可改）</label>
          <select
            id="tplSelect"
            v-model="templateIdModel"
            class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="tpl in TEMPLATES" :key="tpl.id" :value="tpl.id">{{ tpl.label }}</option>
          </select>
          <p class="text-xs text-muted-foreground mt-1">{{ templateHint }}</p>
        </div>

        <!-- 标题 / 副标题 / 激励语 -->
        <div class="space-y-2">
          <input id="titleInput" v-model="title" maxlength="30" placeholder="表格标题" class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <input id="subtitleInput" v-model="subtitle" maxlength="60" placeholder="副标题（姓名 / 日期留空供手写）" class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <input id="mottoInput" v-model="motto" maxlength="30" placeholder="表头激励语" class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <!-- 条目列表 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-medium text-foreground">条目列表（{{ items.length }}/{{ MAX_ITEMS }}，打印表按时间自动排序）</p>
            <label class="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
              <input v-model="showNote" type="checkbox" class="accent-primary w-3.5 h-3.5" />
              备注列
            </label>
          </div>

          <div
            v-for="(it, idx) in items"
            :key="it.id"
            class="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border transition"
            :class="validateItem(it) ? 'bg-muted/40 border-border' : 'bg-red-500/5 border-red-500/50'"
          >
            <input v-model="it.time" maxlength="5" placeholder="07:00" class="w-[72px] px-2 py-1.5 bg-background border border-border border-input rounded-md text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <select v-model="it.icon" class="px-1.5 py-1.5 bg-background border border-border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option v-for="e in EMOJI_PRESETS" :key="e" :value="e">{{ e }}</option>
            </select>
            <input v-model="it.text" maxlength="24" placeholder="事项，如：早读 20 分钟" class="flex-1 min-w-[110px] px-2 py-1.5 bg-background border border-border border-input rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <div class="flex items-center gap-0.5">
              <button type="button" title="上移" class="p-1 rounded text-muted-foreground hover:bg-muted disabled:opacity-30" :disabled="idx === 0" @click="moveRow(idx, -1)">
                <ChevronUp class="w-3.5 h-3.5" />
              </button>
              <button type="button" title="下移" class="p-1 rounded text-muted-foreground hover:bg-muted disabled:opacity-30" :disabled="idx === items.length - 1" @click="moveRow(idx, 1)">
                <ChevronDown class="w-3.5 h-3.5" />
              </button>
              <button type="button" title="删除条目" class="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10" @click="removeRow(it.id)">
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
            <input v-if="showNote" v-model="it.note" maxlength="30" placeholder="备注（可选，打印在事项下方）" class="basis-full px-2 py-1 bg-background border border-border border-input rounded-md text-[11px] text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <p v-if="!items.length" class="text-xs text-muted-foreground p-2.5 rounded bg-muted/40 border border-dashed border-border text-center">
            暂无条目，点下方「添加条目」或切换模板快速填充。
          </p>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="items.length >= MAX_ITEMS"
              @click="addRow"
            >
              <Plus class="w-4 h-4 inline mr-1 -mt-0.5" /> 添加条目
            </button>
            <span v-if="items.length >= MAX_ITEMS" class="flex items-center gap-1 text-xs text-amber-600">
              <TriangleAlert class="w-3.5 h-3.5 shrink-0" /> 已达上限 {{ MAX_ITEMS }} 条（A4 单页排版）
            </span>
          </div>
        </div>

        <!-- 视图模式 -->
        <div class="space-y-2 pt-1 border-t border-border">
          <label class="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50 cursor-pointer select-none">
            <input v-model="weekMode" type="checkbox" class="accent-primary w-4 h-4" />
            <span class="text-sm text-foreground">周视图（周一到周日 7 列打卡表，时间行为轴）</span>
          </label>
          <div v-if="weekMode" class="grid grid-cols-2 gap-2">
            <button
              v-for="m in WEEK_FILL_MODES"
              :key="m.value"
              type="button"
              class="px-3 py-2 rounded-lg border text-xs font-medium transition text-left"
              :class="weekFill === m.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/70'"
              @click="weekFill = m.value"
            >
              {{ m.label }}
            </button>
          </div>
        </div>

        <!-- 统计小卡 -->
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">条目数</p>
            <p class="text-lg font-bold text-foreground">{{ items.length }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">睡眠估算</p>
            <p class="text-sm font-bold text-foreground pt-1">{{ sleepText }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">最早 · 最晚</p>
            <p class="text-sm font-bold font-mono text-foreground pt-1">{{ earliestText }}</p>
          </div>
        </div>
        <p v-if="spanText" class="text-xs text-muted-foreground">全天计划跨度 {{ spanText }}（跨零点段按到 24:00 止口径）。</p>
        <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5" :class="invalidCount > 0 ? 'bg-red-500/10' : ''">
          <TriangleAlert v-if="invalidCount > 0" class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
          <CheckCircle v-else class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
          <span>{{ routineHint }}</span>
        </p>

        <!-- 操作 -->
        <div class="flex flex-wrap gap-2">
          <button type="button" class="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition hover:opacity-90" @click="printSheet">
            <Printer class="w-4 h-4" /> 打印 / 存 PDF
          </button>
          <button type="button" class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground transition" @click="restoreDefault">
            <RefreshCw class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 恢复默认
          </button>
          <button type="button" class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground transition" @click="clearCustom">
            <X class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 清空自定义
          </button>
        </div>
      </div>

      <!-- 右：A4 预览（打印时仅输出表体） -->
      <div class="lg:col-span-2 print-area">
        <div class="no-print flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <LayoutGrid class="w-5 h-5 mr-2 text-primary" /> A4 预览（自动缩放显示）
          </h2>
          <button
            type="button"
            class="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-1.5 transition hover:opacity-90"
            @click="printSheet"
          >
            <Printer class="w-4 h-4" /> 打印此表
          </button>
        </div>

        <div ref="previewWrapRef" class="w-full">
          <div class="preview-holder mx-auto" :style="holderStyle">
            <div ref="previewStackRef" class="print-stack" :style="stackStyle">
              <div class="a4-sheet" :style="sheetStyle">
                <!-- 表头 -->
                <div class="sheet-header">
                  <p class="sheet-title">{{ title || DEFAULT_TITLE }}</p>
                  <p v-if="motto" class="sheet-motto">「{{ motto }}」</p>
                  <p class="sheet-sub">{{ subtitle }}</p>
                  <div class="sheet-rule"></div>
                </div>

                <!-- 单日三列表：时间 / 图标 / 事项（+备注行），斑马纹 + 时间轴左线 -->
                <table v-if="!weekMode" class="sheet-table">
                  <thead>
                    <tr>
                      <th class="th-time">时间</th>
                      <th class="th-icon">图标</th>
                      <th>事项</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in sortedRows" :key="row.id">
                      <td class="t-cell">{{ row.time }}</td>
                      <td class="i-cell">{{ row.icon }}</td>
                      <td class="x-cell">
                        <span>{{ row.text || '　' }}</span>
                        <div v-if="showNote && row.note" class="x-note">{{ row.note }}</div>
                      </td>
                    </tr>
                    <tr v-if="!sortedRows.length">
                      <td class="sheet-empty" colspan="3">暂无条目，请在左侧添加或切换模板</td>
                    </tr>
                  </tbody>
                </table>

                <!-- 周视图：时间轴行 × 周一到周日 7 列 -->
                <table v-else class="sheet-table week-table">
                  <thead>
                    <tr>
                      <th class="th-time">时间 · 事项</th>
                      <th v-for="wd in WEEK_DAY_LABELS" :key="wd" class="th-day">{{ wd }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in weekGrid" :key="row.id">
                      <td class="w-time-cell">
                        <span class="w-time-num">{{ row.time }}</span>
                        <span class="w-time-icon">{{ row.icon }}</span>
                        <span>{{ row.text }}</span>
                      </td>
                      <td
                        v-for="(cell, d) in row.cells"
                        :key="d"
                        class="w-cell"
                        :title="weekFill === 'write' ? '点击填写本周安排' : '点击切换勾选预览，打印后为空白方格'"
                        @click="onCellClick(d, row.time)"
                      >
                        <input
                          v-if="activeCell && activeCell.d === d && activeCell.time === row.time"
                          v-model="cellDraft"
                          v-focus
                          maxlength="12"
                          class="cell-input"
                          @blur="commitWriteCell"
                          @keydown.enter="commitWriteCell"
                          @keydown.esc="cancelWriteCell"
                        />
                        <template v-else>
                          <span v-if="weekFill === 'check'" class="cell-box">□<i v-if="isCheckedCell(d, row.time)" class="cell-tick">✓</i></span>
                          <span v-else class="cell-text" :class="{ 'cell-dash': cell === '—' }">{{ cell }}</span>
                        </template>
                      </td>
                    </tr>
                    <tr v-if="!weekGrid.length">
                      <td class="sheet-empty" :colspan="1 + WEEK_DAY_LABELS.length">暂无条目，请在左侧添加或切换模板</td>
                    </tr>
                  </tbody>
                </table>

                <!-- 底部完成情况栏（打印后手写） -->
                <div class="sheet-footer">
                  <p class="done-label">完成情况（打印后手写）：</p>
                  <p v-if="!weekMode">□ 全部完成　　□ 大部分完成　　□ 需要加油　　我的感受：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿</p>
                  <p v-else>本周坚持天数：＿＿ 天　　<span v-for="wd in WEEK_DAY_LABELS_SHORT" :key="wd" class="done-day">{{ wd }}□ </span>　家长签字：＿＿＿＿＿</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed flex items-start gap-1.5 bg-muted/60 rounded-lg p-3">
          <Info class="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
          <span>打印或另存 PDF 时缩放请选「100% / 实际大小」：本页已按 A4 竖版、10mm 页边距排版，只会输出上方的表格纸面，编辑面板、说明文字与页脚都不会被打印。勾选模式打印后固定为空白 □（屏幕上的 ✓ 仅是预览），贴墙后每晚手写勾选即可。</span>
        </p>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative no-print">
      <button
        type="button"
        @click="toggleSeoContent"
        class="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>作息计划表为什么有用？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          作息表的本质是给一天装上「外部锚点」：固定的起床与入睡时间锚定生物钟，白天的时间段锚定注意力，孩子不需要每次靠「现在该干嘛了」的口头提醒来切换状态。
          而把计划打印在 A4 纸贴上墙，比手机里的提醒多了一层仪式感——看得见、摸得着、可以打勾，完成感从屏幕里的数字变成纸上一个个真实的 □。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么孩子参与制定比执行更重要？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          家长单方面排的表，孩子只是「被执行者」；一起讨论出来的表，孩子才有「这是我的安排」的归属感。
          实操建议：先让孩子说出必须保留的三件事（通常是玩耍、运动、追一集动画），再把作业、阅读等填空进去；
          对时间点的争议可以让他自己拨——本页的时间全部可编辑、可上下排序，正好适合当面演示「挪一格会怎样」。参与过制定的表，执行率显著更高。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">暑假作息怎么安排不崩？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          核心口径：把上学日作息当作基准线，暑假的起床和入睡时间浮动控制在 ±1.5 小时以内。
          完全放飞两三周后，开学前需要花更长时间倒时差，作业冲刺又叠加焦虑，作息基本必崩。
          推荐直接用本页「暑假版」模板：保留晨读、午休等与上学日同构的锚点，把课间换成户外运动、把放学换成兴趣时间，
          「形散神不散」——孩子感觉在玩，生物钟其实没有乱。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">打印之后怎么坚持？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两件事：贴在必经之路（书桌前或冰箱门），以及每晚固定 1 分钟的「勾选时间」。
          勾选比打勾软件有效得多——笔尖划过纸面的动作本身就是收尾仪式。周视图勾选模式打印后是一整页空白 □，
          每天睡前花一分钟和孩子一起逐格打勾，漏掉的就空着，不补、不骂，一周结束后数坚持天数即可。
          表格内容建议每周微调一次，长期不改的表会变成墙纸。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">表格里时间冲突了怎么办？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本页的排序口径是「以最早时间为日内起点」按时间升序排列，不做重叠检测——因为作息表不是课表，重叠往往意味着贪多。
          处理办法按优先级：一是合并（「运动」和「家庭时间」可以合成「饭后散步」）；二是降级（备注列写「精简版 15 分钟」）；三是删（一条永远不会执行的计划只会消耗信心）。
          另外，23:59 之后入睡、或时间写成 25:00 这类非法值，会被标红并排在表尾提醒修正。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">暑假作息怎么安排才不会崩？</h3>
            <p class="text-sm text-muted-foreground mt-1">把上学日作息当基准，起床与入睡浮动控制在 ±1.5 小时以内。用本页「暑假版」模板保留晨读、午休等与上学日同构的锚点，把课间换成户外运动、放学换成兴趣时间。开学前 1-2 周再把时间逐日回调即可，无需痛苦倒时差。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">周视图的勾选模式打印出来是什么样子？</h3>
            <p class="text-sm text-muted-foreground mt-1">勾选模式打印后每个格子都是空白复选框 □，屏幕上的 ✓ 只是预览、不会被打印——留给你贴墙后每晚 1 分钟手写勾选。「点填模式」则相反：在屏幕上直接往格子里填文字（如「足球课」「钢琴」），打印后是每周固定的差异化安排，空白格显示为 —。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">编辑的内容保存在哪里？会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会上传。标题、条目、周格内容、勾选状态全部自动保存在你本机浏览器的 localStorage，换设备或清除浏览器数据会回到模板默认值。需要留存可点「打印 / 存 PDF」另存一份，浏览器打印对话框里选「另存为 PDF」即可。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'daily-routine-printer'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  CalendarClock, Printer, Plus, X, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, LayoutGrid
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '作息计划表打印 - 暑假/儿童每日作息时间表A4打印工具',
  description: '免费在线作息计划表制作与打印工具，上学日、暑假、通勤、幼儿园四套模板一键预填，条目可增删排序与时间校验，支持周一到周日周视图打卡格，自动估算睡眠时长，A4竖版直接打印贴墙，纯本地运行不上传',
  keywords: '作息时间表,暑假计划表,儿童作息,每日计划打印,时间管理表',
  author: '有条工具',
  ogTitle: '作息计划表打印 - 暑假/儿童每日作息时间表A4打印工具 | 有条工具',
  ogDescription: '四套场景模板一键预填，单日/周视图打卡格，自动排序与睡眠时长估算，A4竖版打印贴墙，纯本地运行。',
  ogUrl: 'https://www.util.cn/tools/daily-routine-printer',
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
          name: '作息计划表打印',
          url: 'https://www.util.cn/tools/daily-routine-printer',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['上学日/暑假/通勤/幼儿园四套模板', '条目增删排序与 HH:MM 校验', '周一到周日七列周视图', '点填与勾选两种格子模式', '睡眠时长与计划跨度自动估算', 'A4 竖版 10mm 边距打印', '本地保存不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '作息计划表打印', item: 'https://www.util.cn/tools/daily-routine-printer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '暑假作息怎么安排才不会崩？',
              acceptedAnswer: { '@type': 'Answer', text: '把上学日作息当基准，起床与入睡浮动控制在±1.5小时以内。用暑假版模板保留晨读、午休等与上学日同构的锚点，把课间换成户外运动、放学换成兴趣时间。开学前1-2周再把时间逐日回调即可，无需痛苦倒时差。' }
            },
            {
              '@type': 'Question',
              name: '周视图的勾选模式打印出来是什么样子？',
              acceptedAnswer: { '@type': 'Answer', text: '勾选模式打印后每个格子都是空白复选框□，屏幕上的✓只是预览不会被打印，留给贴墙后每晚1分钟手写勾选。点填模式则相反：在屏幕上往格子里填文字（如足球课、钢琴），打印后是每周固定的差异化安排，空白格显示为—。' }
            },
            {
              '@type': 'Question',
              name: '编辑的内容保存在哪里？会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会上传。标题、条目、周格内容、勾选状态全部自动保存在本机浏览器的localStorage，换设备或清除浏览器数据会回到模板默认值。需要留存可打印对话框选另存为PDF保存一份。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/ // HH:MM，小时 0-23、分 0-59
const DAY_MIN = 1440                          // 一天分钟数
const MAX_ITEMS = 24                          // 条目上限（A4 单页排版容量）
const EMOJI_PRESETS = ['☀️', '📖', '✏️', '🍚', '😴', '⚽️', '🎨', '🧹', '🎵', '🌙']
const WEEK_DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const WEEK_DAY_LABELS_SHORT = ['一', '二', '三', '四', '五', '六', '日']
const WEEK_FILL_MODES = [
  { value: 'write', label: '点填格子（打印格子文字）' },
  { value: 'check', label: '勾选模式（打印空白 □）' }
]
const DEFAULT_TITLE = 'XX 的作息时间表'
const DEFAULT_SUBTITLE = '姓名：________　____年__月__日'
const DEFAULT_MOTTO = '把每一天过成想要的样子'

// 模板场景：时间预填、全部可改；每条含 time/icon/text/note 四字段
const TEMPLATES = [
  {
    id: 'school',
    label: '上学日 · 在校日节奏',
    hint: '起床 6:50、早读、上下午课段、17:30 运动、21:30 熄灯，可直接用作学期工作日表。',
    items: [
      { time: '06:50', icon: '☀️', text: '起床洗漱整理', note: '自己叠被子' },
      { time: '07:10', icon: '🍚', text: '早餐', note: '' },
      { time: '07:40', icon: '📖', text: '早读 20 分钟', note: '' },
      { time: '08:10', icon: '📖', text: '上午上课段', note: '' },
      { time: '12:00', icon: '🍚', text: '午餐', note: '' },
      { time: '12:40', icon: '😴', text: '午休', note: '不超过 40 分钟' },
      { time: '14:00', icon: '📖', text: '下午上课段', note: '' },
      { time: '17:30', icon: '⚽️', text: '户外运动 1 小时', note: '' },
      { time: '18:30', icon: '🍚', text: '晚餐 · 家庭时间', note: '' },
      { time: '19:30', icon: '✏️', text: '作业与整理书包', note: '先复习再动笔' },
      { time: '20:30', icon: '🎨', text: '自由活动', note: '' },
      { time: '21:30', icon: '🌙', text: '睡觉熄灯', note: '' }
    ]
  },
  {
    id: 'summer',
    label: '暑假 · 假期不崩节奏',
    hint: '晨读 + 上午作业 + 午休 + 下午兴趣与运动 + 晚间家庭时间，锚点与上学日同构，浮动 ±1.5 小时。',
    items: [
      { time: '07:30', icon: '☀️', text: '起床洗漱', note: '' },
      { time: '08:00', icon: '📖', text: '晨读古诗 / 英语', note: '' },
      { time: '09:00', icon: '✏️', text: '暑假作业', note: '按页码拆小目标' },
      { time: '11:30', icon: '🧹', text: '家务小帮手', note: '' },
      { time: '12:00', icon: '🍚', text: '午餐', note: '' },
      { time: '13:00', icon: '😴', text: '午休', note: '' },
      { time: '14:30', icon: '🎨', text: '兴趣时间（画画 / 乐器）', note: '' },
      { time: '16:00', icon: '⚽️', text: '户外运动', note: '避开高温时段' },
      { time: '18:00', icon: '🍚', text: '晚餐', note: '' },
      { time: '19:00', icon: '🎵', text: '晚间家庭时间', note: '桌游 / 散步' },
      { time: '20:30', icon: '📖', text: '自由阅读 / 日记', note: '' },
      { time: '21:30', icon: '🌙', text: '睡觉熄灯', note: '' }
    ]
  },
  {
    id: 'commuter',
    label: '工作日通勤版 · 早起自律',
    hint: '早起、通勤听播客、两段深度工作块、下班健身、睡前阅读，22:00 熄灯保证 8.5 小时睡眠窗。',
    items: [
      { time: '06:30', icon: '☀️', text: '早起补水拉伸', note: '' },
      { time: '07:00', icon: '🧹', text: '洗漱早餐', note: '' },
      { time: '07:45', icon: '🎵', text: '通勤（听播客）', note: '' },
      { time: '09:30', icon: '✏️', text: '深度工作块 1', note: '手机免打扰' },
      { time: '12:00', icon: '🍚', text: '午餐 + 散步', note: '' },
      { time: '13:30', icon: '✏️', text: '深度工作块 2', note: '' },
      { time: '17:30', icon: '✏️', text: '收尾与复盘', note: '' },
      { time: '18:15', icon: '⚽️', text: '健身 / 力量训练', note: '' },
      { time: '19:30', icon: '🍚', text: '晚餐', note: '' },
      { time: '20:30', icon: '📖', text: '阅读 45 分钟', note: '' },
      { time: '22:00', icon: '🌙', text: '睡觉熄灯', note: '不带手机上床' }
    ]
  },
  {
    id: 'kindergarten',
    label: '幼儿园版 · 游戏为主',
    hint: '以户外游戏、午睡、绘本亲子共读为主轴，20:30 就寝，适合 3-6 岁学龄前儿童。',
    items: [
      { time: '07:30', icon: '☀️', text: '起床洗漱', note: '' },
      { time: '08:00', icon: '🍚', text: '早餐', note: '' },
      { time: '09:00', icon: '⚽️', text: '户外游戏', note: '' },
      { time: '10:30', icon: '🎨', text: '手工 / 涂鸦', note: '' },
      { time: '11:45', icon: '🍚', text: '午餐', note: '' },
      { time: '12:30', icon: '🧹', text: '小家务 · 收玩具', note: '' },
      { time: '13:00', icon: '😴', text: '午睡', note: '' },
      { time: '15:00', icon: '🎵', text: '律动儿歌', note: '' },
      { time: '15:45', icon: '🎨', text: '自由游戏', note: '' },
      { time: '17:30', icon: '🍚', text: '晚餐', note: '' },
      { time: '19:30', icon: '📖', text: '绘本亲子共读', note: '孩子选书' },
      { time: '20:30', icon: '🌙', text: '睡觉熄灯', note: '' }
    ]
  }
]

// HH:MM → 当日分钟数；非法返回 null
function timeToMin(time) {
  if (typeof time !== 'string' || !TIME_RE.test(time.trim())) return null
  const parts = time.trim().split(':')
  return Number(parts[0]) * 60 + Number(parts[1])
}

// 条目校验：{ time } 必须是合法 HH:MM（25:00、07:60、空串均非法）
function validateItem(item) {
  return !!(item && timeToMin(item.time) !== null)
}

// 排序：口径「以最早时间为日内起点」——按当日分钟数升序即可得到正确的日内顺序，
// 例如睡前条目 21:30 与起床条目 06:50 会排成 06:50 → … → 21:30（跨零点天然落到表尾）；
// 时间为空的条目保持录入先后，统一排在合法条目之后。
function buildRowsOf(items) {
  return (items || []).slice().sort((a, b) => {
    const ka = timeToMin(a && a.time)
    const kb = timeToMin(b && b.time)
    if (ka === null && kb === null) return 0
    if (ka === null) return 1
    if (kb === null) return -1
    return ka - kb
  })
}

// 时段时长：end < start 视为跨零点，按「到当日 24:00 止」口径只计 start → 24:00；
// 返回「X 小时 Y 分」，非法输入返回 null。
function durationOf(start, end) {
  const s = timeToMin(start)
  const e0 = timeToMin(end)
  if (s === null || e0 === null) return null
  const e = e0 < s ? DAY_MIN : e0
  const d = e - s
  return `${Math.floor(d / 60)} 小时 ${d % 60} 分`
}

// 睡眠时长估算口径：入睡条目 = 文本含「睡」或图标为 🌙/😴 的条目里最晚的一条（取夜间，忽略午休）；
// 起床条目 = 文本含「起床」或图标为 ☀️ 的条目里最早的一条；入睡 > 起床 视为跨零点。
// 两类条目任一找不到（例如自定义空白表）→ 返回 null，表示无法估算。
function totalSleepOf(items) {
  let bed = null
  let up = null
  for (const it of items || []) {
    const m = timeToMin(it && it.time)
    if (m === null) continue
    const text = String(it.text || '') + String(it.icon || '')
    if (/睡|🌙|😴/.test(text)) {
      if (bed === null || m > bed) bed = m
    } else if (/起床|☀️/.test(text)) {
      if (up === null || m < up) up = m
    }
  }
  if (bed === null || up === null) return null
  const mins = up + (up <= bed ? DAY_MIN : 0) - bed
  return `${Math.floor(mins / 60)} 小时 ${mins % 60} 分`
}

// 周表格结构：days = 7 个 { label, cells: { 'HH:MM': 文本 } }，items = 作息条目；
// 输出行按 buildRowsOf 升序，每行固定 7 列（列数与 days 实长无关），无内容的格填 '—'。
function weekGridOf(days, items) {
  const rows = buildRowsOf(items)
  const safeDays = (days || []).slice(0, 7)
  return rows.map((r) => ({
    id: r.id,
    time: r.time,
    icon: r.icon,
    text: r.text,
    cells: WEEK_DAY_LABELS.map((_label, d) => {
      const day = safeDays[d]
      const raw = day && day.cells ? String(day.cells[r.time] || '').trim() : ''
      return raw || '—'
    })
  }))
}

// ---------- 组件状态与操作 ----------
const STORAGE_KEY = 'daily-routine-printer:v1'

// 默认条目 id 用自增序列（服务端/客户端同序，避免 hydration 失配）；交互新增用时间+随机后缀
let idSeed = 0
const nextId = () => 'd' + (++idSeed)
const uid = () => 'u' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36)

function cloneTemplateItems(tpl, idFn) {
  return tpl.items.map((it) => ({ id: idFn(), time: it.time, icon: it.icon, text: it.text, note: it.note }))
}

const templateId = ref(TEMPLATES[0].id)
const title = ref(DEFAULT_TITLE)
const subtitle = ref(DEFAULT_SUBTITLE)
const motto = ref(DEFAULT_MOTTO)
const items = ref(cloneTemplateItems(TEMPLATES[0], nextId))
const showNote = ref(false)
const weekMode = ref(false)
const weekFill = ref('check') // 'check' 勾选模式（打印空白 □）| 'write' 点填模式
const weekCells = ref({})     // 'dayIndex|HH:MM' -> 格子文字
const weekChecks = ref({})    // 'dayIndex|HH:MM' -> true（仅屏幕预览，打印固定为 □）
const seoContentVisible = ref(true)

const templateHint = computed(() => {
  const tpl = TEMPLATES.find((t) => t.id === templateId.value)
  return tpl ? tpl.hint : ''
})

// 切换模板 = 整表预填条目并清空周格（标题 / 激励语为用户内容，保留）
function applyTemplate(id) {
  const tpl = TEMPLATES.find((t) => t.id === id) || TEMPLATES[0]
  templateId.value = tpl.id
  items.value = cloneTemplateItems(tpl, uid)
  weekCells.value = {}
  weekChecks.value = {}
  activeCell.value = null
}

const templateIdModel = computed({
  get: () => templateId.value,
  set: (v) => applyTemplate(v)
})

const invalidCount = computed(() => items.value.filter((it) => !validateItem(it)).length)
const sortedRows = computed(() => buildRowsOf(items.value))

const earliest = computed(() => {
  const first = sortedRows.value.find((it) => validateItem(it))
  return first ? timeToMin(first.time) : null
})
const latest = computed(() => {
  const valid = sortedRows.value.filter((it) => validateItem(it))
  return valid.length ? timeToMin(valid[valid.length - 1].time) : null
})
const earliestText = computed(() => {
  if (earliest.value === null || latest.value === null) return '—'
  const fmt = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')
  return fmt(earliest.value) + '–' + fmt(latest.value)
})
const spanText = computed(() => {
  if (earliest.value === null || latest.value === null) return ''
  const fmt = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')
  return durationOf(fmt(earliest.value), fmt(latest.value)) || ''
})
const sleepText = computed(() => totalSleepOf(items.value) || '—')

const routineHint = computed(() => {
  if (invalidCount.value > 0) {
    return `有 ${invalidCount.value} 条时间不是合法 HH:MM（小时 0-23、分 0-59），预览中排在表尾，请修正后再打印。`
  }
  if (!items.value.length) return '还没有条目：点「添加条目」从零开始，或切换模板场景快速预填。'
  return '一切正常：预览按「以最早时间为日内起点」升序排列，21:30 的睡前条目会自动落在 06:50 起床条目之后。'
})

// 条目增删与排序（排序仅影响录入顺序，打印表体始终以时间升序）
function addRow() {
  if (items.value.length >= MAX_ITEMS) return
  let next = 420 // 无合法条目时默认 07:00
  const lastValid = [...items.value].reverse().find((it) => validateItem(it))
  if (lastValid) {
    const m = timeToMin(lastValid.time)
    if (m !== null) next = Math.min(DAY_MIN - 1, m + 30)
  }
  const t = String(Math.floor(next / 60)).padStart(2, '0') + ':' + String(next % 60).padStart(2, '0')
  items.value.push({ id: uid(), time: t, icon: '✏️', text: '', note: '' })
}

function removeRow(id) {
  items.value = items.value.filter((it) => it.id !== id)
}

function moveRow(index, delta) {
  const j = index + delta
  if (j < 0 || j >= items.value.length) return
  const arr = items.value.slice()
  const tmp = arr[index]
  arr[index] = arr[j]
  arr[j] = tmp
  items.value = arr
}

// ---------- 周格交互（点填 / 勾选） ----------
const cellKey = (d, time) => d + '|' + time
const activeCell = ref(null) // { d, time }，仅点填模式瞬时存在
const cellDraft = ref('')
const vFocus = { mounted: (el) => { el.focus(); el.select && el.select() } }

const weekGrid = computed(() => {
  const days = WEEK_DAY_LABELS.map((label, d) => {
    const cells = {}
    for (const k in weekCells.value) {
      if (k.startsWith(d + '|')) cells[k.slice(String(d).length + 1)] = weekCells.value[k]
    }
    return { label, cells }
  })
  return weekGridOf(days, items.value)
})

const isCheckedCell = (d, time) => !!weekChecks.value[cellKey(d, time)]

function onCellClick(d, time) {
  if (!weekMode.value || !validateItem({ time })) return
  if (weekFill.value === 'write') startWriteCell(d, time)
  else toggleCheckCell(d, time)
}

function startWriteCell(d, time) {
  activeCell.value = { d, time }
  cellDraft.value = weekCells.value[cellKey(d, time)] || ''
}

function commitWriteCell() {
  if (!activeCell.value) return
  const k = cellKey(activeCell.value.d, activeCell.value.time)
  const v = cellDraft.value.trim()
  const nextObj = { ...weekCells.value }
  if (v) nextObj[k] = v.slice(0, 12)
  else delete nextObj[k]
  weekCells.value = nextObj
  activeCell.value = null
}

function cancelWriteCell() {
  activeCell.value = null
}

function toggleCheckCell(d, time) {
  const k = cellKey(d, time)
  const nextObj = { ...weekChecks.value }
  if (nextObj[k]) delete nextObj[k]
  else nextObj[k] = true
  weekChecks.value = nextObj
}

// ---------- 打印 / 清空 / 恢复 ----------
function printSheet() {
  window.print()
}

function clearCustom() {
  if (!window.confirm('将清空你编辑的全部条目、周格文字与勾选状态（标题与激励语保留），此操作不可恢复。确定继续吗？')) return
  items.value = []
  weekCells.value = {}
  weekChecks.value = {}
  activeCell.value = null
}

function restoreDefault() {
  const tpl = TEMPLATES.find((t) => t.id === templateId.value) || TEMPLATES[0]
  title.value = DEFAULT_TITLE
  subtitle.value = DEFAULT_SUBTITLE
  motto.value = DEFAULT_MOTTO
  items.value = cloneTemplateItems(tpl, uid)
  weekCells.value = {}
  weekChecks.value = {}
  activeCell.value = null
}

// ---------- 本地持久化（localStorage，读写均 try/catch，仅在 onMounted 后触达） ----------
const persistState = computed(() => ({
  v: 1,
  templateId: templateId.value,
  title: title.value,
  subtitle: subtitle.value,
  motto: motto.value,
  showNote: showNote.value,
  weekMode: weekMode.value,
  weekFill: weekFill.value,
  items: items.value,
  weekCells: weekCells.value,
  weekChecks: weekChecks.value
}))

function persist() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistState.value))
  } catch (e) { /* 隐私模式 / 配额限制：静默 */ }
}

watch(persistState, () => { persist() }, { deep: true })

function restore() {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const s = JSON.parse(raw)
    if (!s || typeof s !== 'object') return
    if (typeof s.title === 'string') title.value = s.title
    if (typeof s.subtitle === 'string') subtitle.value = s.subtitle
    if (typeof s.motto === 'string') motto.value = s.motto
    if (TEMPLATES.some((t) => t.id === s.templateId)) templateId.value = s.templateId
    if (typeof s.showNote === 'boolean') showNote.value = s.showNote
    if (typeof s.weekMode === 'boolean') weekMode.value = s.weekMode
    if (s.weekFill === 'check' || s.weekFill === 'write') weekFill.value = s.weekFill
    if (Array.isArray(s.items)) {
      items.value = s.items
        .filter((x) => x && typeof x === 'object')
        .slice(0, MAX_ITEMS)
        .map((x, i) => ({
          id: x.id != null ? String(x.id) : 'r' + i,
          time: typeof x.time === 'string' ? x.time : '',
          icon: EMOJI_PRESETS.includes(x.icon) ? x.icon : '✏️',
          text: typeof x.text === 'string' ? x.text : '',
          note: typeof x.note === 'string' ? x.note : ''
        }))
    }
    if (s.weekCells && typeof s.weekCells === 'object') weekCells.value = { ...s.weekCells }
    if (s.weekChecks && typeof s.weekChecks === 'object') weekChecks.value = { ...s.weekChecks }
  } catch (e) { /* 存储损坏：静默使用当前默认 */ }
}

// ---------- A4 预览缩放（屏幕缩放到面板宽，打印时还原） ----------
const MM_PX = 96 / 25.4
const SHEET_W_MM = 210
const pageWpx = SHEET_W_MM * MM_PX

const previewWrapRef = ref(null)
const previewStackRef = ref(null)
const previewScale = ref(1)
const stackH = ref(0)
let resizeObserver = null

const sheetStyle = { width: '210mm', minHeight: '297mm', padding: '10mm' }

const holderStyle = computed(() => ({
  width: Math.round(pageWpx * previewScale.value) + 'px',
  height: stackH.value > 0 ? Math.round(stackH.value * previewScale.value) + 'px' : 'auto'
}))

const stackStyle = computed(() => ({
  width: pageWpx + 'px',
  transform: 'scale(' + previewScale.value + ')',
  transformOrigin: 'top left'
}))

function updateScale() {
  const wrap = previewWrapRef.value
  if (!wrap) return
  const avail = wrap.clientWidth
  if (avail > 0) previewScale.value = Math.min(1, (avail - 2) / pageWpx)
  measureStack()
}

function measureStack() {
  if (previewStackRef.value) stackH.value = previewStackRef.value.offsetHeight
}

// 表体内容变化后重测高度（flush: post 确保 DOM 已更新）
watch([items, weekGrid, title, subtitle, motto, showNote, weekMode], () => { measureStack() }, { deep: true, flush: 'post' })

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  restore()
  updateScale()
  if (typeof ResizeObserver !== 'undefined' && previewWrapRef.value) {
    resizeObserver = new ResizeObserver(() => { updateScale() })
    resizeObserver.observe(previewWrapRef.value)
  }
  addRecentTool('daily-routine-printer')
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<style scoped>
/* A4 竖版，10mm 页边距 */
@page {
  size: A4 portrait;
  margin: 10mm;
}

/* 屏幕上的 A4 纸面（白底黑字，独立于站点主题） */
.a4-sheet {
  background: #ffffff;
  color: #111827;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
  border-radius: 2px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 12px;
}
.sheet-header { flex-shrink: 0; }
.sheet-title { font-size: 1.85em; font-weight: 800; text-align: center; letter-spacing: 2px; }
.sheet-motto { text-align: center; color: #4b5563; margin-top: 3px; font-size: 0.95em; }
.sheet-sub { text-align: center; color: #6b7280; margin-top: 5px; font-size: 0.85em; }
.sheet-rule {
  height: 3px;
  background: linear-gradient(90deg, #2563eb, #93c5fd);
  border-radius: 2px;
  margin: 10px 0 12px;
}

.sheet-table { width: 100%; border-collapse: collapse; flex: 1; }
.sheet-table th {
  font-size: 0.85em;
  color: #1f2937;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  padding: 6px 8px;
  text-align: left;
}
.th-time { width: 84px; }
.th-icon { width: 44px; text-align: center !important; }
.th-day { text-align: center !important; width: 11.6%; }

/* 斑马纹 + 时间轴左线（时间列左侧贯穿竖线） */
.sheet-table tbody tr:nth-child(even) td { background: #f5f7fa; }
.sheet-table tbody tr { break-inside: avoid; page-break-inside: avoid; }
.t-cell {
  width: 84px;
  border-left: 3px solid #2563eb;
  padding: 7px 8px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.i-cell { width: 44px; text-align: center; font-size: 1.25em; }
.x-cell { padding: 7px 10px; }
.x-note { color: #6b7280; font-size: 0.85em; margin-top: 2px; }
.sheet-empty { text-align: center; color: #9ca3af; padding: 24px 8px !important; }

/* 周视图 */
.w-time-cell { border-left: 3px solid #2563eb; padding: 5px 7px; white-space: nowrap; font-size: 0.92em; }
.w-time-num { font-weight: 700; font-variant-numeric: tabular-nums; margin-right: 3px; }
.w-time-icon { margin-right: 3px; }
td.w-cell {
  border: 1px solid #d1d5db;
  text-align: center;
  padding: 5px 3px;
  font-size: 0.88em;
  cursor: pointer;
  min-width: 52px;
  position: relative;
  height: 30px;
}
td.w-cell:hover { background: #e0e7ff; }
.cell-box { font-size: 1.2em; color: #6b7280; position: relative; display: inline-block; }
.cell-tick {
  position: absolute;
  left: 55%;
  top: -3px;
  font-style: normal;
  font-size: 0.95em;
  font-weight: 800;
  color: #16a34a;
}
.cell-text { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cell-dash { color: #cbd5e1; }
.cell-input {
  width: 100%;
  border: 1px solid #2563eb;
  border-radius: 3px;
  font-size: 0.95em;
  text-align: center;
  padding: 1px 2px;
  color: #111827;
  background: #ffffff;
}

.sheet-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 2px dashed #9ca3af;
  font-size: 0.88em;
  color: #374151;
  flex-shrink: 0;
}
.done-label { font-weight: 700; margin-bottom: 6px; }
.done-day { margin-right: 6px; white-space: nowrap; }

/* 预览壳层：屏幕上按容器宽缩放，打印还原 */
.preview-holder { overflow: hidden; }

@media print {
  .no-print { display: none !important; }
  /* 左右分栏改通栏，保证纸面完整输出 */
  .print-grid { display: block !important; }
  .print-area { width: auto !important; }
  :global(main) { overflow: visible !important; height: auto !important; }
  .preview-holder { width: auto !important; height: auto !important; overflow: visible !important; }
  .print-stack { transform: none !important; width: auto !important; }
  .a4-sheet {
    width: auto !important;
    min-height: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    overflow: visible !important;
    font-size: 10.5pt;
  }
  td.w-cell:hover { background: transparent; }
  /* 勾选模式：打印固定为空白 □，屏幕预览的 ✓ 不输出 */
  .cell-tick { display: none !important; }
  /* 保留斑马纹 / 表头底色 / 时间轴线 */
  .a4-sheet, .a4-sheet * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>