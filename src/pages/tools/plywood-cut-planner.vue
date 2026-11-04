<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8 print-hide">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Grid3x3 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">板材开料排版器</h1>
          <p class="text-sm text-muted-foreground mt-1">输入零件宽×高×数量，自动生成 1220×2440 等大板的 SVG 排料图、利用率与裁切清单，木工 DIY / 家具定制 / 装修余料下料草稿</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线板材开料排版工具：把要切的零件清单一填，自动按「行优先 + 旋转尝试」策略把零件排到整张大板上，逐板生成可打印的排料图（零件同件同色、翻板件斜纹标注、尺寸直接标在块上），
        并给出每张板与综合利用率、零件总面积、放不下的件与原因、可复制/下载/打印的裁切清单。全部计算在浏览器本地完成，不上传任何数据，零件清单自动保存在本机，刷新不丢。
      </p>
    </div>

    <!-- 算法说明条 -->
    <div class="mb-6 px-3.5 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs sm:text-sm text-foreground leading-relaxed print-hide">
      <div class="flex items-start gap-2">
        <Info class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <span>排料用'行优先+旋转尝试'启发式算法（非最优解）——对开料师傅这是草稿，裁切前请人工复核刀路；锯缝损耗（默认 3mm）可在设置调整。</span>
      </div>
    </div>

    <!-- 交互区：左零件表 / 右排料图 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：参数与零件表 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 print-hide">
        <h2 class="text-lg font-semibold flex items-center">
          <Grid3x3 class="w-5 h-5 mr-2 text-primary" /> 大板与零件
        </h2>

        <!-- 大板规格 -->
        <div>
          <label class="block text-xs text-muted-foreground mb-1" for="sheet-select">大板规格</label>
          <select
            id="sheet-select"
            v-model="sheetSelect"
            class="w-full px-3 py-2 rounded-md border border-border border-border bg-background text-sm text-foreground"
          >
            <option v-for="opt in SHEET_PRESETS" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
          </select>
          <div v-show="sheetSelect === 'custom'" class="flex items-center gap-2 mt-2">
            <input v-model.number="customW" type="number" min="1" max="6000" class="w-full px-3 py-2 rounded-md border border-border border-border bg-background text-sm" placeholder="宽 mm" aria-label="自定义板宽" />
            <span class="text-muted-foreground">×</span>
            <input v-model.number="customH" type="number" min="1" max="6000" class="w-full px-3 py-2 rounded-md border border-border border-border bg-background text-sm" placeholder="高 mm" aria-label="自定义板高" />
          </div>
        </div>

        <!-- 锯缝 + 旋转开关 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-muted-foreground mb-1" for="kerf-input">锯缝 kerf（mm）</label>
            <input id="kerf-input" v-model.number="kerf" type="number" min="0" max="6" step="0.1" class="w-full px-3 py-2 rounded-md border border-border border-border bg-background text-sm" />
          </div>
          <label class="flex items-center gap-2 mt-6 text-sm cursor-pointer select-none">
            <input v-model="allowRotate" type="checkbox" class="w-4 h-4 accent-[#2563eb]" />
            允许旋转翻板
          </label>
        </div>

        <!-- 零件表 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium text-foreground">零件表（{{ rows.length }}/{{ MAX_ROWS }} 行）</p>
            <button
              @click="addRow"
              :disabled="rows.length >= MAX_ROWS"
              class="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus class="w-3.5 h-3.5 inline -mt-0.5 mr-0.5" /> 加一行
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-xs text-muted-foreground">
                  <th class="text-left font-medium pb-1.5 w-6"></th>
                  <th class="text-left font-medium pb-1.5">名称（可选）</th>
                  <th class="text-left font-medium pb-1.5 w-20">宽 mm</th>
                  <th class="text-left font-medium pb-1.5 w-20">高 mm</th>
                  <th class="text-left font-medium pb-1.5 w-16">数量</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in rows" :key="row.uid">
                  <td class="text-xs text-muted-foreground pr-1 align-middle">{{ idx + 1 }}</td>
                  <td class="py-0.5 pr-1">
                    <input v-model="row.name" maxlength="20" class="w-full px-2 py-1.5 rounded-md border border-border border-border bg-background text-sm" placeholder="如：侧板" :aria-label="'第' + (idx + 1) + '行名称'" />
                  </td>
                  <td class="py-0.5 pr-1">
                    <input v-model.number="row.w" type="number" min="0" class="w-full px-2 py-1.5 rounded-md border border-border border-border bg-background text-sm tabular-nums" aria-label="宽" />
                  </td>
                  <td class="py-0.5 pr-1">
                    <input v-model.number="row.h" type="number" min="0" class="w-full px-2 py-1.5 rounded-md border border-border border-border bg-background text-sm tabular-nums" aria-label="高" />
                  </td>
                  <td class="py-0.5">
                    <input v-model.number="row.qty" type="number" :min="MIN_QTY" :max="MAX_QTY" @input="clampRowQty(idx)" class="w-full px-2 py-1.5 rounded-md border border-border border-border bg-background text-sm tabular-nums" aria-label="数量" />
                  </td>
                  <td class="py-0.5 pl-1 align-middle">
                    <button @click="removeRow(idx)" class="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-500/10" :aria-label="'删除第' + (idx + 1) + '行'">
                      <X class="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
                <tr v-show="!rows.length">
                  <td colspan="6" class="py-4 text-center text-xs text-muted-foreground">暂无零件：点「加一行」，或直接载入下方预设</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 预设 -->
        <div>
          <p class="text-xs text-muted-foreground mb-1.5">快速预设</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="p in PRESETS"
              :key="p.id"
              @click="applyPreset(p)"
              class="px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 border border-primary/25 text-xs font-medium text-primary"
            >
              <Play class="w-3 h-3 inline mr-1 -mt-0.5" /> {{ p.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- 右：排料结果 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2 print-hide">
          <h2 class="text-lg font-semibold flex items-center">
            <Grid3x3 class="w-5 h-5 mr-2 text-primary" /> 排料图（{{ result ? result.sheets.length : 0 }} 张板）
          </h2>
          <div v-show="result" class="flex items-center gap-2">
            <button @click="copyCutList" class="px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground">复制清单</button>
            <button @click="downloadCutList" class="px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 border border-border text-xs font-medium text-foreground">
              <Download class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 下载 .txt
            </button>
            <button @click="printPlan" class="px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 border border-primary text-xs font-medium text-white">打印排料图</button>
          </div>
        </div>

        <p v-show="copyHint" class="text-xs text-green-600 flex items-center gap-1 print-hide">
          <CheckCircle class="w-3.5 h-3.5" /> {{ copyHint }}
        </p>

        <!-- 空态 -->
        <div v-show="!result" class="py-14 text-center border-2 border-dashed border-border rounded-lg print-hide">
          <Grid3x3 class="w-9 h-9 text-primary/30 mx-auto mb-2" />
          <p class="text-sm text-muted-foreground">在左侧填好大板尺寸与零件表（宽×高×数量），排料图与利用率会自动生成。</p>
          <p class="text-xs text-muted-foreground/70 mt-1">也可以先点「书架（9 件）」「木托盘（42 件）」预设看效果。</p>
        </div>

        <p v-show="!result && rows.length > 0 && invalidRowCount > 0" class="text-xs text-amber-600 print-hide">
          有 {{ invalidRowCount }} 行零件尺寸或数量无效（需 宽/高 &gt; 0 且 数量 ≥ {{ MIN_QTY }}），已跳过。
        </p>

        <!-- 汇总卡 -->
        <div v-if="result" class="grid grid-cols-3 gap-2 text-center print-hide">
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">大板用量</p>
            <p class="text-xl font-bold text-foreground">{{ result.sheets.length }} 张</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">零件总面积</p>
            <p class="text-xl font-bold text-foreground">{{ resultTotalArea }} ㎡</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">综合利用率</p>
            <p class="text-xl font-bold" :class="result.utilization >= 70 ? 'text-green-600' : 'text-primary'">{{ result.utilization.toFixed(1) }}%</p>
          </div>
        </div>

        <!-- 图例 -->
        <div v-show="result" class="flex flex-wrap items-center gap-4 text-xs text-muted-foreground print-hide">
          <span class="flex items-center gap-1.5">
            <i class="w-3.5 h-3.5 rounded-sm inline-block border border-border" style="background-color: #86efac"></i> 同件同色（按行着色）
          </span>
          <span class="flex items-center gap-1.5">
            <i class="w-3.5 h-3.5 rounded-sm inline-block border border-border" style="background-color: #86efac; background-image: repeating-linear-gradient(45deg, rgba(15,23,42,0.45) 0 2px, transparent 2px 6px)"></i> 斜纹 = 翻板 90°（宽高校换）
          </span>
          <span>块内数字 = 该件在板上的占位尺寸 mm</span>
        </div>

        <!-- 每板 SVG -->
        <div v-for="sv in svgItems" :key="sv.sheetIndex" class="sheet-figure bg-background border border-border rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-semibold text-foreground">板 {{ sv.sheetIndex + 1 }}（{{ sv.placementCount }} 件 · 利用率 <span :class="sv.utilization >= 70 ? 'text-green-600' : 'text-primary'">{{ sv.utilization.toFixed(1) }}%</span>）</p>
            <div class="w-full sm:w-40 h-2 rounded-full bg-muted overflow-hidden print-hide">
              <div class="h-full rounded-full" :class="sv.utilization >= 70 ? 'bg-green-500' : 'bg-primary'" :style="{ width: Math.min(100, sv.utilization) + '%' }"></div>
            </div>
          </div>
          <div v-html="sv.svg"></div>
        </div>

        <!-- 放不下的零件 -->
        <div v-if="result && result.unplaced.length" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 print-hide">
          <p class="text-sm font-semibold text-red-600 flex items-center mb-2">
            <TriangleAlert class="w-4 h-4 mr-1.5" /> 放不进当前大板（{{ result.unplaced.length }} 件）
          </p>
          <ul class="space-y-1 text-xs text-red-600">
            <li v-for="u in result.unplacedInfo" :key="u.id" class="font-mono">
              {{ u.name }} {{ u.w }}×{{ u.h }} —— {{ unplacedReasonText(u.reason) }}
            </li>
          </ul>
          <p class="text-[10px] text-muted-foreground mt-2">「余料不足」指行式排料排不进（已用满 {{ MAX_SHEETS }} 张板上限），并非物理上切不出来——手动补排或调整零件顺序通常还能塞下。</p>
        </div>

        <p v-if="result && !result.unplaced.length && result.sheets.length" class="text-xs text-green-600 flex items-center gap-1.5 print-hide">
          <CheckCircle class="w-3.5 h-3.5" /> 全部 {{ expandedParts.length }} 件零件已排入 {{ result.sheets.length }} 张板。
        </p>

        <p class="text-xs text-muted-foreground leading-relaxed print-hide">
          提示：排料图按零件高度降序逐行摆放，行高取行内最高件，锯缝按每块右/下各一条计损；图上坐标为零件左下角相对板左上角的位置（mm），打印时每张板单独一页。裁切前请先复核齐边料与直角的下刀顺序。
        </p>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative print-hide">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>板材开料排版器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          板材开料排版器是一台跑在浏览器里的「下料草稿机」：你把大板规格（默认 1220×2440 标准板）、锯缝宽度和一堆零件（宽×高×数量）告诉它，
          它按「行优先（shelf）+ 旋转尝试」的启发式策略把零件逐板排布，输出每张板的 SVG 排料图、利用率、放不下的零件和一份可打印的裁切清单。
          适合木工 DIY、家具定制下单前核料、装修现场余料利用等场景，全程本地计算，不上传任何图纸数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">开料为什么要先画图再下锯？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一张 1220×2440 的生态板动辄一两百元，切废一块就是真金白银的损失。先在排料图上把每块零件的落位、刀路走向和翻板方向过一遍，
          能提前发现「零件超出板尺寸」「短边凑不出整行」「余料比预期碎」这三类最常见的翻车点；正式下锯时按图纸逐行切，还能减少板材在推台上反复掉头、
          以及凭记忆切错尺寸的失误。对需要向客户报料的定制师傅，一张排料图 + 裁切清单也比口头估算更有说服力。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">行式排料和最优解差多少？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          诚实地说：二维开料排版是 NP 难问题，零件数量一多，穷举所有组合在现实中不可行。本工具用的行式（shelf）启发式把问题降到线性复杂度，
          优点是结果直观、刀路简单（基本是「一横一竖」的 Guillotine 切法），代价是利用率通常比专业求解器的最优解差 5%~15%——
          比如同一批件最优排 2 张板，行式可能要 3 张。若结果差一张板，可以手动调整零件顺序、改数量拆分或关闭旋转再试；追求极致省料请上 CAM 排料软件，本页定位是快速草稿与备料核对。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">锯缝损耗为什么要算进利用率？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          锯片切下去是有厚度的：普通推台锯锯缝（kerf）约 2.8~3.2mm，每道切口都会变成锯末。40 块零件意味着 80 多条切口，累计损耗可达数千平方毫米——
          相当于半块 A4 纸的板面。不算锯缝的排料图看着「刚好排满」，实际下料必然重叠冲突。本工具按每块零件右、下各预留一条 kerf 锯缝带的口径计算占用面积，
          所以显示的利用率是「含损耗的真实占用」，切缝越宽，能塞的件就越少，这是物理事实而不是算法保守。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">翻板方向与木纹怎么办？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          「允许旋转」只解决尺寸问题，不解决纹理问题：旋转 90° 意味着这块板的木纹方向跟着转，做柜门、桌面这类要顺纹或对纹的件时不能随便翻。
          贴面板还有正反面、崩边方向（一般让锯从正面出）的讲究。所以涉及纹路的家具件建议关掉旋转开关先出一版「不翻板」排料，
          看料够不够；不够再逐件讨论纹理方向与拼接方案，而不是让算法替你决定。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">切完剩下的余料怎么管理？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>每次开料前把本批余料尺寸当作零件加进清单（宽大于 100mm、有利用价值的条料优先排掉），等于给余料做一次「再利用招标」。</li>
          <li>余料按最短边分三档入库：≥300mm 可再开大件、150~300mm 做抽屉板/垫块、&lt;150mm 做样板试刀，超过两年没用上的果断当柴烧，腾地方比留料值钱。</li>
          <li>大板尽量沿对角方向切第一刀，能把余料切成两个长条而不是一个 L 形，长条的后续可用率高得多。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">排料图可以直接拿去裁吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不建议。行式启发式排料是草稿：它不检查齐边、板面瑕疵、纹理方向，也没法保证刀路最省。请人工复核坐标和切割顺序后再下锯，尤其是成批定制件。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">锯缝（kerf）应该填多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">普通推台锯/手提圆锯片约 3mm（默认值），薄齿片 2mm 左右，带合金刀头的专业片可能到 3.2mm。可用一张废板试切一段量一下实际缝隙，本工具允许 0~6mm 之间调整。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">有零件显示放不下怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">看提示原因：「超过板尺寸」是这块件（含翻转）比整张板还大，必须换更大板或拆分件；「余料不足」是行式策略塞不进（含达到 30 张板上限），调整零件行顺序、增删数量或改变 kerf 后往往就能排下。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">图纸数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。排料计算全部在浏览器本地完成，零件清单只存在你当前浏览器的 localStorage 里，不经过任何服务器；清除浏览器数据或换设备后不保留。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'plywood-cut-planner'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Grid3x3, Plus, X, Download, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, Play
} from 'lucide-vue-next'
import { useSeoMeta, useHead } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '板材开料排版器 - 在线1220×2440板材切割排料图生成 | 有条工具',
  description: '免费在线板材开料排版工具，输入大板规格与零件宽高等数量，自动生成SVG排料图、每板利用率与可打印裁切清单，支持锯缝损耗与旋转翻板，木工DIY、家具定制备料、装修余料利用先画图再下锯，纯本地计算不上传',
  keywords: '开料排版,板材切割计算器,1220 2440 开料,家具用料计算,排料图生成',
  author: '有条工具',
  ogTitle: '板材开料排版器 - 在线1220×2440板材切割排料图生成 | 有条工具',
  ogDescription: '行优先+旋转尝试启发式排料，SVG 排料图、锯缝损耗、利用率与裁切清单一键生成，下料前先画图的本地草稿工具。',
  ogUrl: 'https://www.util.cn/tools/plywood-cut-planner',
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
          name: '板材开料排版器',
          url: 'https://www.util.cn/tools/plywood-cut-planner',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['1220×2440 等大板规格与自定义', '零件宽×高×数量清单（最多 40 行）', '行优先+旋转尝试启发式排料', 'SVG 排料图（同件同色/翻板斜纹/尺寸标注）', '锯缝损耗与每板利用率', '裁切清单复制/下载/分页打印', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '板材开料排版器', item: 'https://www.util.cn/tools/plywood-cut-planner/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '排料图可以直接拿去裁吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不建议。行式启发式排料是草稿：它不检查齐边、板面瑕疵、纹理方向，也没法保证刀路最省。请人工复核坐标和切割顺序后再下锯，尤其是成批定制件。' }
            },
            {
              '@type': 'Question',
              name: '锯缝（kerf）应该填多少？',
              acceptedAnswer: { '@type': 'Answer', text: '普通推台锯/手提圆锯片约3mm（默认值），薄齿片2mm左右，专业片可能到3.2mm。可用废板试切量出实际缝隙，本工具支持0~6mm调整。' }
            },
            {
              '@type': 'Question',
              name: '有零件显示放不下怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '看原因：「超过板尺寸」是零件含翻转都比板大，必须换更大板或拆件；「余料不足」是行式策略塞不进（含30张板上限），调整零件行顺序、增删数量或改kerf后往往能排下。' }
            },
            {
              '@type': 'Question',
              name: '图纸数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。排料计算全部在浏览器本地完成，零件清单只存在当前浏览器的localStorage里，不经过任何服务器；清除浏览器数据或换设备后不保留。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MAX_ROWS = 40        // 零件表行数上限
const MAX_QTY = 20         // 单行数量上限
const MIN_QTY = 1          // 单行数量下限
const MAX_SHEETS = 30      // 板数上限，防死循环
const DEFAULT_KERF = 3     // 默认锯缝（普通锯片）

// SVG 用色板：同一零件行按 id 前缀哈希取同一色
const SHEET_PALETTE = ['#bfdbfe', '#fde68a', '#bbf7d0', '#fbcfe8', '#ddd6fe', '#fed7aa', '#99f6e4', '#fef08a', '#c7d2fe', '#fecaca']

// XML/HTML 转义：v-html 注入 SVG 字符串前所有动态内容必须过一遍
function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[c])
}

// 零件表展开为单件：数量复制 + id 化（r行号-序号，同行人共享 r行号 前缀用于着色）
function partsExpandedOf(rows) {
  const out = []
  ;(Array.isArray(rows) ? rows : []).forEach((r, i) => {
    const w = Number(r && r.w)
    const h = Number(r && r.h)
    const qty = Math.min(MAX_QTY, Math.max(0, Math.floor(Number(r && r.qty) || 0)))
    if (!(w > 0) || !(h > 0) || qty <= 0) return
    for (let k = 1; k <= qty; k++) {
      out.push({ id: `r${i + 1}-${k}`, name: String((r && r.name) || `零件${i + 1}`), w, h })
    }
  })
  return out
}

// 零件净面积合计，换算成 ㎡（保留 2 位小数）
function totalAreaOf(parts) {
  const mm2 = (Array.isArray(parts) ? parts : []).reduce((s, p) => s + Math.max(0, p.w * p.h), 0)
  return Math.round((mm2 / 1000000) * 100) / 100
}

// 利用率口径：消费面积 = Σ (件宽+kerf)×(件高+kerf)，即「零件净面积 + 每条右/下锯缝损耗」，
// kerf 通过 placement.cellW / cellH 传入（缺省时退化为纯件面积），除以板面面积得百分比，1 位小数。
function utilizationOf(placements, sheetArea) {
  if (!(sheetArea > 0)) return 0
  const used = (Array.isArray(placements) ? placements : []).reduce(
    (s, p) => s + (p.cellW || p.w) * (p.cellH || p.h), 0
  )
  return Math.round((used / sheetArea) * 1000) / 10
}

// 排入落位（供 SVG / 清单 / 测试断言）：逐板行式排布（非 Guillotine 严格最优，见页面说明）
// 规则：① 先过滤「含翻转都放不下」的单件（记 unplaced，原因 oversize）；
//       ② 其余按高度降序（Array.sort 稳定，同行件保持原始顺序）；
//       ③ 行内按宽顺序放，放不下当前行就收行开新行（y 下移行高+kerf），行高取行内最高件；
//       ④ 落位时先试原方向再试旋转（宽高互换）；本板放不进的留下板；
//       ⑤ 板数达 MAX_SHEETS 仍有剩余 → 记 unplaced，原因 shortage。
// 返回 { sheets:[{placements:[{partId,x,y,w,h,rotated,cellW,cellH}], utilization}], unplaced:[id], unplacedInfo:[{id,name,w,h,reason}], utilization, meta }
function packSheets(parts, sheetW, sheetH, kerf, allowRotate) {
  const k = Math.max(0, Number(kerf) || 0)
  const W = Number(sheetW)
  const H = Number(sheetH)
  const rot = allowRotate !== false
  const unplaced = []
  const unplacedInfo = []
  const queue = []

  if (!(W > 0) || !(H > 0)) {
    // 板尺寸非法：所有件都算放不下
    ;(Array.isArray(parts) ? parts : []).forEach((p) => {
      unplaced.push(p.id)
      unplacedInfo.push({ id: p.id, name: p.name, w: p.w, h: p.h, reason: 'oversize' })
    })
    return { sheets: [], unplaced, unplacedInfo, utilization: 0, meta: { sheetW: W, sheetH: H, kerf: k, allowRotate: rot, parts: Array.isArray(parts) ? parts : [] } }
  }

  const fits = (w, h, x, y) => x + w + k <= W + 1e-9 && y + h + k <= H + 1e-9
  ;(Array.isArray(parts) ? parts : []).forEach((p) => {
    const w = Number(p.w)
    const h = Number(p.h)
    if (!(w > 0) || !(h > 0)) return
    if (fits(w, h, 0, 0) || (rot && fits(h, w, 0, 0))) {
      queue.push(p)
    } else {
      unplaced.push(p.id)
      unplacedInfo.push({ id: p.id, name: p.name, w, h, reason: 'oversize' })
    }
  })
  queue.sort((a, b) => b.h - a.h)

  const area = W * H
  const sheets = []
  let remaining = queue
  while (remaining.length > 0) {
    if (sheets.length >= MAX_SHEETS) {
      remaining.forEach((p) => {
        unplaced.push(p.id)
        unplacedInfo.push({ id: p.id, name: p.name, w: p.w, h: p.h, reason: 'shortage' })
      })
      break
    }
    const placements = []
    const nextRemaining = []
    let x = 0
    let y = 0
    let rowH = 0
    for (const p of remaining) {
      // 方向选项：先原方向，允许时再试宽高互换（正方形无需重复）
      const options = [{ rotated: false, w: p.w, h: p.h }]
      if (rot && p.w !== p.h) options.push({ rotated: true, w: p.h, h: p.w })
      let placed = null
      // 先试当前行两种方向，再试「开新行」（保证行内空间优先被填满）
      for (const o of options) {
        if (fits(o.w, o.h, x, y)) { placed = o; break }
      }
      if (!placed && x > 0 && rowH > 0) {
        for (const o of options) {
          if (fits(o.w, o.h, 0, y + rowH + k)) { placed = { ...o, newRow: true }; break }
        }
      }
      if (!placed) { nextRemaining.push(p); continue }
      if (placed.newRow) {
        y = y + rowH + k
        x = 0
        rowH = 0
      }
      placements.push({
        partId: p.id, x, y, w: placed.w, h: placed.h, rotated: placed.rotated,
        cellW: placed.w + k, cellH: placed.h + k
      })
      x += placed.w + k
      rowH = Math.max(rowH, placed.h)
    }
    if (placements.length === 0) {
      // 理论上到不了这里（预过滤保证每板首件必进），兜底防死循环
      nextRemaining.forEach((p) => {
        unplaced.push(p.id)
        unplacedInfo.push({ id: p.id, name: p.name, w: p.w, h: p.h, reason: 'shortage' })
      })
      break
    }
    sheets.push({ placements, utilization: utilizationOf(placements, area) })
    remaining = nextRemaining
  }

  // 综合利用率 = Σ 消费面积 ÷ (板数 × 板面积)
  const totalUsed = sheets.reduce(
    (s, sh) => s + sh.placements.reduce((t, p) => t + p.cellW * p.cellH, 0), 0
  )
  const utilization = sheets.length ? Math.round((totalUsed / (sheets.length * area)) * 1000) / 10 : 0

  return { sheets, unplaced, unplacedInfo, utilization, meta: { sheetW: W, sheetH: H, kerf: k, allowRotate: rot, parts: Array.isArray(parts) ? parts : [] } }
}

// 放不下原因的文案映射
function unplacedReasonText(reason) {
  if (reason === 'oversize') return '该件超过板尺寸（含翻转）'
  return '余料不足（行式策略或板数上限，人工复核或调整顺序）'
}

// 同行人同色：id 形如 r1-2，取 r1 前缀做哈希
function colorIndexOfPartId(partId) {
  const key = String(partId).split('-')[0]
  let h = 0
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % SHEET_PALETTE.length
}

// 单张板的排料 SVG（纯字符串，可 v-html 注入，动态内容全部转义）
// 零件矩形按板坐标 × scale 换算；翻板件填充 45° 斜纹 pattern；块内标「宽×高」尺寸
function sheetSvg(sheet, placements, scale, namespace) {
  const S = scale > 0 ? scale : 0.4
  const W = sheet.w * S
  const H = sheet.h * S
  const r2 = (n) => Math.round(n * 100) / 100
  const ns = String(namespace === undefined || namespace === null ? '' : namespace).replace(/[^a-z0-9-]/gi, '')
  const defs = SHEET_PALETTE.map((c, i) =>
    `<pattern id="patt-${ns}${i}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
    `<rect width="8" height="8" fill="${c}"></rect>` +
    `<line x1="0" y1="0" x2="0" y2="8" stroke="#1e293b" stroke-opacity="0.35" stroke-width="3"></line>` +
    `</pattern>`
  ).join('')
  let body = `<rect x="1" y="1" width="${r2(W - 2)}" height="${r2(H - 2)}" fill="none" stroke="currentColor" stroke-width="2" stroke-opacity="0.55"></rect>`
  for (const p of placements || []) {
    const ci = colorIndexOfPartId(p.partId)
    const fill = p.rotated ? `url(#patt-${ns}${ci})` : SHEET_PALETTE[ci]
    const px = r2(1 + p.x * S)
    const py = r2(1 + p.y * S)
    const pw = r2(p.w * S)
    const ph = r2(p.h * S)
    body += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="${fill}" stroke="currentColor" stroke-opacity="0.75" stroke-width="1"><title>${escapeXml(`${p.partId}${p.rotated ? '（已翻板）' : ''}`)}</title></rect>`
    // 尺寸标注：块足够宽时居中显示
    if (pw >= 34 && ph >= 13) {
      const fs = ph >= 22 ? 11 : 9
      body += `<text x="${r2(px + pw / 2)}" y="${r2(py + ph / 2 + fs * 0.35)}" text-anchor="middle" font-size="${fs}" fill="currentColor" opacity="0.8">${escapeXml(`${p.w}×${p.h}`)}</text>`
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(W)} ${r2(H)}" class="w-full h-auto block" style="color:#0f172a" role="img" aria-label="排料图">${defs}${body}</svg>`
}

// 可打印裁切清单（纯文本，从板首行汇总每行零件的落位统计）
function cutListTextOf(result) {
  const meta = result.meta || {}
  const byId = new Map((meta.parts || []).map((p) => [p.id, p]))
  const lines = []
  lines.push('板材开料裁切清单')
  lines.push(`板材：${meta.sheetW}×${meta.sheetH}mm　锯缝：${meta.kerf}mm　允许旋转：${meta.allowRotate ? '是' : '否'}`)
  result.sheets.forEach((sh, i) => {
    lines.push('')
    lines.push(`—— 板 ${i + 1}（利用率 ${sh.utilization}%）——`)
    // 按零件行聚合：件数 / 是否翻板
    const agg = new Map()
    for (const p of sh.placements) {
      const part = byId.get(p.partId)
      const name = part ? part.name : p.partId
      const sizeKey = `${name}|${p.w}x${p.h}|${p.rotated ? 'R' : 'N'}`
      const hit = agg.get(sizeKey)
      if (hit) { hit.count += 1; continue }
      agg.set(sizeKey, { name, w: p.w, h: p.h, rotated: p.rotated, x: p.x, y: p.y, count: 1 })
    }
    for (const it of agg.values()) {
      lines.push(`· ${it.name} ${it.w}×${it.h}${it.rotated ? '（翻板）' : ''} × ${it.count}　首件坐标 x=${it.x} y=${it.y}`)
    }
  })
  if (result.unplaced && result.unplaced.length) {
    lines.push('')
    lines.push(`！！放不下 ${result.unplaced.length} 件：`)
    for (const u of result.unplacedInfo || []) {
      lines.push(`· ${u.name} ${u.w}×${u.h} —— ${unplacedReasonText(u.reason)}`)
    }
  }
  lines.push('')
  lines.push(`合计：${result.sheets.length} 张板　零件总面积 ${totalAreaOf(meta.parts || [])} ㎡　综合利用率 ${result.utilization}%`)
  return lines.join('\n')
}

// ---------- 预设（Play 按钮一键载入） ----------
const PRESETS = [
  {
    id: 'bookshelf',
    name: '书架（9 件）',
    sheet: '1220x2440',
    rows: [
      { name: '侧板', w: 350, h: 1200, qty: 2 },
      { name: '层板', w: 350, h: 600, qty: 5 },
      { name: '背板', w: 500, h: 1200, qty: 2 }
    ]
  },
  {
    id: 'pallet',
    name: '木托盘（42 件）',
    sheet: '1220x2440',
    rows: [
      { name: '面板条', w: 100, h: 800, qty: 12 },
      { name: '垫块·上', w: 50, h: 50, qty: 15 },
      { name: '垫块·下', w: 50, h: 50, qty: 15 }
    ]
  }
]

// ---------- 大板规格 ----------
const SHEET_PRESETS = [
  { id: '1220x2440', label: '1220×2440 mm（标准板）', w: 1220, h: 2440 },
  { id: '1220x1830', label: '1220×1830 mm', w: 1220, h: 1830 },
  { id: '1000x2000', label: '1000×2000 mm', w: 1000, h: 2000 },
  { id: 'custom', label: '自定义尺寸', w: 0, h: 0 }
]

// ---------- 页面状态 ----------
let uidCounter = 0
function nextUid() {
  uidCounter += 1
  return `row-${uidCounter}`
}

function makeRow(partial) {
  const r = partial || {}
  return {
    uid: nextUid(),
    name: typeof r.name === 'string' ? r.name.slice(0, 20) : '',
    w: Number.isFinite(Number(r.w)) ? Number(r.w) : 0,
    h: Number.isFinite(Number(r.h)) ? Number(r.h) : 0,
    qty: Math.min(MAX_QTY, Math.max(MIN_QTY, Math.floor(Number(r.qty)) || MIN_QTY))
  }
}

const rows = ref([])
const sheetSelect = ref('1220x2440')
const customW = ref(1220)
const customH = ref(2440)
const kerf = ref(DEFAULT_KERF)
const allowRotate = ref(true)
const seoContentVisible = ref(true)
const copyHint = ref('')
let copyHintTimer = null

const currentSheet = computed(() => {
  if (sheetSelect.value === 'custom') {
    return { w: Math.max(0, Math.floor(Number(customW.value) || 0)), h: Math.max(0, Math.floor(Number(customH.value) || 0)) }
  }
  const hit = SHEET_PRESETS.find((s) => s.id === sheetSelect.value) || SHEET_PRESETS[0]
  return { w: hit.w, h: hit.h }
})

const expandedParts = computed(() => partsExpandedOf(rows.value))

const invalidRowCount = computed(() =>
  rows.value.filter((r) => !(Number(r.w) > 0) || !(Number(r.h) > 0) || !(Math.floor(Number(r.qty)) >= MIN_QTY)).length
)

const result = computed(() => {
  if (!expandedParts.value.length) return null
  const s = currentSheet.value
  if (!(s.w > 0) || !(s.h > 0)) return null
  const k = Math.min(6, Math.max(0, Number(kerf.value) || 0))
  return packSheets(expandedParts.value, s.w, s.h, k, allowRotate.value)
})

// 每张板一个 SVG 项（v-for 用；v-html 内容已由纯函数转义）
const svgItems = computed(() => {
  if (!result.value) return []
  const scale = 620 / Math.max(result.value.meta.sheetW, result.value.meta.sheetH)
  return result.value.sheets.map((sh, i) => ({
    sheetIndex: i,
    svg: sheetSvg({ w: result.value.meta.sheetW, h: result.value.meta.sheetH }, sh.placements, scale, i),
    utilization: sh.utilization,
    placementCount: sh.placements.length
  }))
})

const resultTotalArea = computed(() => (result.value ? totalAreaOf(result.value.meta.parts) : 0))

// ---------- 零件表操作 ----------
function addRow() {
  if (rows.value.length >= MAX_ROWS) return
  rows.value = [...rows.value, makeRow()]
}

function removeRow(index) {
  rows.value = rows.value.filter((_, i) => i !== index)
}

function clampRowQty(index) {
  const list = rows.value
  const r = list[index]
  if (!r) return
  const q = Math.min(MAX_QTY, Math.max(MIN_QTY, Math.floor(Number(r.qty)) || MIN_QTY))
  if (q !== Number(r.qty)) {
    list.splice(index, 1, { ...r, qty: q })
  }
}

function applyPreset(p) {
  rows.value = p.rows.map((r) => makeRow(r))
  sheetSelect.value = p.sheet
}

// ---------- 清单导出（浏览器 API 只在回调里） ----------
function flashHint(text) {
  copyHint.value = text
  if (copyHintTimer !== null) clearTimeout(copyHintTimer)
  copyHintTimer = setTimeout(() => { copyHint.value = '' }, 3200)
}

async function copyCutList() {
  if (!result.value) return
  try {
    await navigator.clipboard.writeText(cutListTextOf(result.value))
    flashHint('裁切清单已复制到剪贴板')
  } catch (e) {
    // clipboard API 不可用（http / 权限）时退化为临时 textarea + execCommand
    try {
      const ta = document.createElement('textarea')
      ta.value = cutListTextOf(result.value)
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      flashHint(ok ? '裁切清单已复制到剪贴板' : '复制失败，请改用「下载 .txt」')
    } catch (e2) {
      flashHint('复制失败，请改用「下载 .txt」')
    }
  }
}

function downloadCutList() {
  if (!result.value) return
  try {
    const blob = new Blob([`\uFEFF${cutListTextOf(result.value)}`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '开料裁切清单.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    flashHint('已下载 开料裁切清单.txt')
  } catch (e) {
    flashHint('下载失败，可改为「复制清单」手动粘贴保存')
  }
}

function printPlan() {
  window.print()
}

function toggleSeoContent() {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- localStorage 持久化（读写都带 try/catch，读只在 onMounted） ----------
const STORE_KEY = 'plywood-cut-planner-v1'

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      rows: rows.value.map((r) => ({ name: r.name, w: r.w, h: r.h, qty: r.qty })),
      sheetSelect: sheetSelect.value,
      customW: customW.value,
      customH: customH.value,
      kerf: kerf.value,
      allowRotate: allowRotate.value
    }))
  } catch (e) {
    // 隐私模式 / 配额不足时忽略存储失败
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return
    if (Array.isArray(data.rows) && data.rows.length) {
      rows.value = data.rows.slice(0, MAX_ROWS).map((r) => makeRow(r))
    }
    if (SHEET_PRESETS.some((s) => s.id === data.sheetSelect)) sheetSelect.value = data.sheetSelect
    const cw = Number(data.customW)
    const ch = Number(data.customH)
    if (cw > 0) customW.value = cw
    if (ch > 0) customH.value = ch
    const k = Number(data.kerf)
    if (Number.isFinite(k)) kerf.value = Math.min(6, Math.max(0, k))
    if (data.allowRotate === true || data.allowRotate === false) allowRotate.value = data.allowRotate
  } catch (e) {
    // 解析失败则沿用当前（空）状态
  }
}

let saveTimer = null
watch([rows, sheetSelect, customW, customH, kerf, allowRotate], () => {
  if (saveTimer !== null) clearTimeout(saveTimer)
  saveTimer = setTimeout(saveState, 400)
}, { deep: true })

onMounted(() => {
  loadState()
  addRecentTool('plywood-cut-planner')
})

onBeforeUnmount(() => {
  if (saveTimer !== null) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  if (copyHintTimer !== null) {
    clearTimeout(copyHintTimer)
    copyHintTimer = null
  }
})
</script>

<style scoped>
@media print {
  .print-hide {
    display: none !important;
  }
  .sheet-figure {
    break-inside: avoid;
  }
  .sheet-figure + .sheet-figure {
    break-before: page;
  }
}
</style>
