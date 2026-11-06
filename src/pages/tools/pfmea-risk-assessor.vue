<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ShieldAlert class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">PFMEA风险评估</h1>
          <p class="text-sm text-muted-foreground mt-1">失效模式 S/O/D 打分，RPN 与 AIAG-VDA AP 行动优先级双口径</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        逐行录入过程步骤、潜在失效模式、影响、原因与当前控制，并对严重度 S、频度 O、探测度 D 打分（1-10）。
        工具同时输出两套风险口径：传统 RPN = S×O×D（阈值分档可配置）与 AIAG-VDA 2019 手册的行动优先级 AP（高/中/低），
        两者结论可能不同，正好互相校验。支持一键示例填充、按 RPN 或 AP 排序、AP=高 置顶高亮与 CSV 导出，
        全部计算在当前浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 统计条 + 操作区 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-6 flex flex-wrap items-center gap-x-6 gap-y-3">
      <div class="flex items-center gap-4 text-sm">
        <span class="text-muted-foreground">行数 <strong class="text-foreground text-lg">{{ stats.total }}</strong></span>
        <span class="text-muted-foreground">AP高 <strong class="text-lg" :class="stats.high ? 'text-warning' : 'text-foreground'">{{ stats.high }}</strong></span>
        <span class="text-muted-foreground">AP中 <strong class="text-lg" :class="stats.mid ? 'text-primary' : 'text-foreground'">{{ stats.mid }}</strong></span>
        <span class="text-muted-foreground">AP低 <strong class="text-lg text-muted-foreground">{{ stats.low }}</strong></span>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <span class="text-muted-foreground">排序：</span>
        <button
          type="button"
          @click="setSort('rpn')"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition border',
            sortBy === 'rpn' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted hover:bg-muted/80 text-muted-foreground border-border'
          ]"
        >
          RPN 降序
        </button>
        <button
          type="button"
          @click="setSort('ap')"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition border',
            sortBy === 'ap' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted hover:bg-muted/80 text-muted-foreground border-border'
          ]"
        >
          AP 高→低
        </button>
      </div>
      <div class="flex flex-wrap items-center gap-2 ml-auto">
        <button
          type="button"
          @click="fillExample"
          class="px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition flex items-center gap-1.5"
        >
          <Sparkles class="w-4 h-4" /> 一键示例
        </button>
        <button
          type="button"
          @click="addRow"
          class="px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition flex items-center gap-1.5"
        >
          <Plus class="w-4 h-4" /> 添加行
        </button>
        <button
          type="button"
          @click="exportCsv"
          class="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1.5"
        >
          <Download class="w-4 h-4" /> 导出 CSV
        </button>
        <button
          type="button"
          @click="clearAll"
          class="px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-muted-foreground transition flex items-center gap-1.5"
        >
          <Trash2 class="w-4 h-4" /> 清空
        </button>
      </div>
    </div>

    <!-- RPN 阈值配置 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
      <span class="font-medium text-foreground flex items-center gap-1.5"><SlidersHorizontal class="w-4 h-4 text-primary" /> RPN 阈值（实践惯例，非标准规定，可按组织口径调整）</span>
      <label class="flex items-center gap-2 text-muted-foreground">
        RPN ≥
        <input
          v-model.number="rpnHighThreshold"
          type="number" min="1" max="1000" step="1"
          class="w-20 px-2 py-1.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="RPN 高档阈值"
        />
        → 高
      </label>
      <label class="flex items-center gap-2 text-muted-foreground">
        RPN ≥
        <input
          v-model.number="rpnMidThreshold"
          type="number" min="1" max="1000" step="1"
          class="w-20 px-2 py-1.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="RPN 中档阈值"
        />
        → 中（其余为低）
      </label>
    </div>

    <!-- 行列表（输入区） -->
    <div class="mb-6">
      <div v-if="!rows.length" class="bg-card border border-dashed border-border rounded-lg p-10 text-center">
        <ShieldAlert class="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p class="text-sm font-medium text-muted-foreground">还没有失效模式行：点击「一键示例」载入 3 行示范，或「添加行」从头填写</p>
      </div>

      <div v-for="(row, i) in rows" :key="row.id" class="bg-card border border-border rounded-lg p-4 mb-3">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-semibold text-foreground flex items-center gap-2">
            <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">{{ i + 1 }}</span>
            失效模式行
            <span v-if="row.category" class="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{{ row.category }}</span>
          </span>
          <button type="button" @click="removeRow(row.id)" class="p-1.5 text-muted-foreground hover:text-red-600 transition" aria-label="删除该行">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="lg:col-span-2">
            <label class="lbl">过程步骤</label>
            <input v-model="row.process" type="text" class="inp" placeholder="如 螺栓打紧" />
          </div>
          <div class="lg:col-span-2">
            <label class="lbl">潜在失效模式</label>
            <input v-model="row.mode" type="text" class="inp" placeholder="如 螺栓漏打扭矩" />
          </div>
          <div class="lg:col-span-2">
            <label class="lbl">潜在影响（对下工序/客户）</label>
            <input v-model="row.effect" type="text" class="inp" placeholder="如 客户投诉螺栓松动脱落" />
          </div>
          <div>
            <label class="lbl" :title="S_TIP">严重度 S (1-10) <Info class="inline w-3 h-3 text-muted-foreground" /></label>
            <input v-model.number="row.s" type="number" min="1" max="10" step="1" class="inp" :title="S_TIP" @change="clampRow(row, 's')" aria-label="严重度 S" />
          </div>
          <div class="lg:col-span-2">
            <label class="lbl">潜在原因（发生机理）</label>
            <input v-model="row.cause" type="text" class="inp" placeholder="如 打紧工位无漏打防错" />
          </div>
          <div>
            <label class="lbl" :title="O_TIP">频度 O (1-10) <Info class="inline w-3 h-3 text-muted-foreground" /></label>
            <input v-model.number="row.o" type="number" min="1" max="10" step="1" class="inp" :title="O_TIP" @change="clampRow(row, 'o')" aria-label="频度 O" />
          </div>
          <div class="lg:col-span-2">
            <label class="lbl">当前控制（预防/探测）</label>
            <input v-model="row.control" type="text" class="inp" placeholder="如 出库抽检" />
          </div>
          <div>
            <label class="lbl" :title="D_TIP">探测度 D (1-10) <Info class="inline w-3 h-3 text-muted-foreground" /></label>
            <input v-model.number="row.d" type="number" min="1" max="10" step="1" class="inp" :title="D_TIP" @change="clampRow(row, 'd')" aria-label="探测度 D" />
          </div>
          <div>
            <label class="lbl">分类标记（选填）</label>
            <select v-model="row.category" class="inp" aria-label="分类标记">
              <option value="">无标记</option>
              <option value="CC">CC 关键特性</option>
              <option value="SC">SC 重要特性</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 结果表（双口径） -->
    <div v-if="rows.length" class="bg-card border border-border rounded-lg p-4 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <Calculator class="w-5 h-5 mr-2 text-primary" /> 风险评估结果（RPN 与 AP 双口径）
      </h2>
      <p class="text-xs text-muted-foreground mb-3">
        AP 表按 AIAG-VDA 手册口径，具体以组织标准为准；RPN 阈值分档为实践惯例非标准。两种口径结论可能不一致，建议并列呈报、以 AP 为主决定措施优先级。
      </p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[860px]">
          <thead>
            <tr class="text-left text-muted-foreground border-b border-border">
              <th class="py-2 pr-3 font-medium">#</th>
              <th class="py-2 pr-3 font-medium">过程步骤</th>
              <th class="py-2 pr-3 font-medium">潜在失效模式</th>
              <th class="py-2 pr-3 font-medium text-center">S</th>
              <th class="py-2 pr-3 font-medium text-center">O</th>
              <th class="py-2 pr-3 font-medium text-center">D</th>
              <th class="py-2 pr-3 font-medium text-center">RPN</th>
              <th class="py-2 pr-3 font-medium text-center">RPN 档位</th>
              <th class="py-2 pr-3 font-medium text-center">AP 行动优先级</th>
              <th class="py-2 font-medium text-center">分类</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(r, i) in computedRows"
              :key="r.id"
              class="border-b border-border"
              :class="r.ap === 'H' ? 'bg-warning/10' : ''"
            >
              <td class="py-2.5 pr-3 text-muted-foreground">{{ i + 1 }}</td>
              <td class="py-2.5 pr-3">{{ r.process || '____' }}</td>
              <td class="py-2.5 pr-3">{{ r.mode || '____' }}</td>
              <td class="py-2.5 pr-3 text-center">{{ r.s }}</td>
              <td class="py-2.5 pr-3 text-center">{{ r.o }}</td>
              <td class="py-2.5 pr-3 text-center">{{ r.d }}</td>
              <td class="py-2.5 pr-3 text-center font-semibold">{{ r.rpn }}</td>
              <td class="py-2.5 pr-3 text-center">
                <span :class="rpnLevelClass(r.rpnLevel)" class="inline-block px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">{{ r.rpnLevel }}</span>
              </td>
              <td class="py-2.5 pr-3 text-center">
                <span :class="apClass(r.ap)" class="inline-block px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap">{{ apLabel(r.ap) }}</span>
              </td>
              <td class="py-2.5 text-center text-xs">{{ r.category || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
        AP = 高：团队必须制定改进措施或书面论证现有控制充分；AP = 中：应当制定改进措施或经组织裁量论证；AP = 低：可自行选择是否改进。
        严重度 9-10 且 AP 为高/中的失效影响，建议至少由管理层评审。
      </p>
    </div>

    <!-- 说明卡：S/O/D 档位与 AP/RPN 双口径 -->
    <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center text-blue-700 dark:text-blue-400">
        <Info class="w-5 h-5 mr-2" /> S / O / D 档位速查（定性描述为参考口径，可按组织评级表调整）
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
        <div class="bg-card border border-border rounded-lg p-4">
          <p class="font-semibold text-foreground mb-2">严重度 S（影响的严重程度）</p>
          <ul class="space-y-1 text-muted-foreground leading-relaxed">
            <li>9-10：安全/法规相关影响</li>
            <li>7-8：主要功能丧失或降级</li>
            <li>5-6：次要功能丧失或降级</li>
            <li>3-4：轻微影响（外观、轻微性能）</li>
            <li>1-2：几乎无可察觉影响</li>
          </ul>
        </div>
        <div class="bg-card border border-border rounded-lg p-4">
          <p class="font-semibold text-foreground mb-2">频度 O（原因发生频率）</p>
          <ul class="space-y-1 text-muted-foreground leading-relaxed">
            <li>8-10：很高，持续发生</li>
            <li>6-7：高，经常发生</li>
            <li>4-5：中等，偶尔发生</li>
            <li>2-3：低，偶发</li>
            <li>1：极低/通过预防控制基本消除</li>
          </ul>
        </div>
        <div class="bg-card border border-border rounded-lg p-4">
          <p class="font-semibold text-foreground mb-2">探测度 D（缺陷被发现的难易）</p>
          <ul class="space-y-1 text-muted-foreground leading-relaxed">
            <li>7-10：很难探测（无方法/仅随机抽查）</li>
            <li>5-6：中等（人工目视/抽检）</li>
            <li>2-4：容易（自动检测/防错下游拦截）</li>
            <li>1：几乎必然探测出（防错杜绝流出）</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区（可折叠） -->
    <div class="relative">
      <button
        type="button"
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>PFMEA 风险评估与 RPN、AP 双口径是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          PFMEA（过程失效模式与影响分析）是 IATF 16949 与 AIAG-VDA FMEA 手册（2019，业内俗称第五版）框架下对制造过程的风险分析方法：
          逐个过程步骤识别潜在失效模式、影响与原因，评估现有预防/探测控制，并对严重度 S、频度 O、探测度 D 打分（1-10）。
          本工具在同一张表上并排输出两套优先级口径：传统 RPN = S×O×D（可配置阈值分档为高/中/低），
          与新版手册的行动优先级 AP（Action Priority，高/中/低，按手册 AP 评估表查表得出）。两套口径结论可能不同：
          例如 S8/O3/D7 的 RPN=168 属高档，但 AP 只有「中」；而 S5/O5/D4 的 RPN=100 属高档，AP 却是「低」。
          新版方法论明确不推荐把 RPN 阈值作为唯一取舍依据，建议以 AP 为主、RPN 为辅进行措施排序。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">RPN 和 AP 的区别，到底听谁的</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed">
          <li><strong>RPN（风险顺序数）</strong>：S、O、D 三者乘积（1-1000），优点是直观、可跨行横向比较，缺点是同样 RPN 可能对应完全不同的风险结构（如 S10O1D1 与 S2O5D10），且阈值分档只是企业实践惯例，没有标准答案。</li>
          <li><strong>AP（行动优先级）</strong>：AIAG-VDA 2019 手册用查表逻辑替代 RPN 排序，先按 S/O/D 分档组合查手册 AP 表得到高/中/低，强调「严重度优先、频度次之、探测度再次」的权重逻辑，不再给出可乘的数字。</li>
          <li><strong>措施期望</strong>：AP=高，团队必须识别适当的预防/探测改进措施，或论证并文件化「现有控制已充分」；AP=中，应当识别措施或由组织裁量论证；AP=低，可自行选择是否改进。AP 的含义是「降低风险所需行动的优先次序」，不是风险绝对高低。</li>
          <li><strong>管理评审</strong>：严重度 9-10 且 AP 为高或中的失效影响，建议至少由管理层评审，并记录所采取的措施。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">如何使用本工具</h3>
        <ol class="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-4 leading-relaxed">
          <li>点击「一键示例」载入 3 行示范数据感受口径差异，或「添加行」逐行录入；</li>
          <li>每行填写过程步骤、失效模式、影响、原因与当前控制，并对 S/O/D 打 1-10 分（鼠标悬停字段名可看档位速查）；</li>
          <li>关键特性/重要特性可用分类标记 CC/SC 标注，便于追溯到特殊特性清单；</li>
          <li>在结果表中按「RPN 降序」或「AP 高→低」切换排序，AP=高 的行会置顶并以警示色高亮；</li>
          <li>按组织口径调整 RPN 阈值（默认 ≥100 高、≥50 中），确认无误后「导出 CSV」归档或粘贴进报告。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常见问题（FAQ）</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-foreground">AP 表按什么口径？可以自己改吗？</h4>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              本页 AP 查表按 AIAG-VDA FMEA 手册（2019）的行动优先级评估表口径编码，并经多处公开权威转载源逐格交叉核对。
              页面注明：AP 表按 AIAG-VDA 手册口径，具体以组织标准为准——个别企业会按客户特殊要求微调，请以你组织的 PFMEA 评审结论为准。
            </p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">RPN 阈值 100/50 是标准吗？</h4>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              不是。RPN 分档阈值是业内长期形成的实践惯例（常见 ≥100 为高、≥50 为中），没有任何标准强制规定，
              不同企业甚至不同产品线都可能不同。本工具允许在页面上直接修改阈值，结果即时重算。
            </p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">S/O/D 打分应该谁说了算？</h4>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              正式的 PFMEA 由跨职能小组按手册评级表集体评定，本页提供的定性档位速查仅为参考口径（已标注）。
              打分争议时回到定义：S 看后果最严重情形、O 看原因的发生频率（预防控制有效时可降低）、D 看当前探测控制发现缺陷的能力。
            </p>
          </div>
          <div>
            <h4 class="font-semibold text-foreground">数据会上传吗？</h4>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              不会。所有计算与 CSV 生成均在当前浏览器本地完成，不向服务器发送任何内容；需要留存时请及时导出 CSV。
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :current-tool-id="'pfmea-risk-assessor'" :category="'calculate'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  ShieldAlert, Plus, Trash2, Download, Sparkles, Info, ChevronUp, ChevronDown,
  Calculator, SlidersHorizontal
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'PFMEA风险评估 - RPN计算与AIAG-VDA AP行动优先级 | 有条工具',
  description: '在线PFMEA风险评估工具：失效模式 S/O/D 打分 1-10，RPN=S×O×D 阈值分档可配置，AIAG-VDA 2019 AP行动优先级查表双口径对照，AP=高置顶高亮，支持一键示例、排序与CSV导出，浏览器本地计算不上传',
  keywords: 'pfmea,rpn计算,ap行动优先级,fmea表格,失效模式分析,aiag-vda fmea,严重度频度探测度',
  author: '有条工具',
  ogTitle: 'PFMEA风险评估 - RPN与AP双口径对照 | 有条工具',
  ogDescription: 'S/O/D 打分即得 RPN 分档与 AIAG-VDA AP 行动优先级，双口径对照排序，CSV 导出，本地计算',
  ogUrl: 'https://www.util.cn/tools/pfmea-risk-assessor',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'PFMEA风险评估 - RPN计算与AP行动优先级',
  twitterDescription: '失效模式 S/O/D 打分，RPN 与 AIAG-VDA AP 双口径评估，CSV 导出'
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
          name: 'PFMEA风险评估',
          url: 'https://www.util.cn/tools/pfmea-risk-assessor',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'S/O/D 1-10 打分带档位速查',
            'RPN = S×O×D 阈值分档可配置',
            'AIAG-VDA 2019 AP 行动优先级查表',
            'RPN/AP 双口径排序与 AP 高置顶高亮',
            'CC/SC 关键与重要特性分类标记',
            '一键示例与 CSV 导出，本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: 'PFMEA风险评估', item: 'https://www.util.cn/tools/pfmea-risk-assessor/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'AP 表按什么口径？可以自己改吗？',
              acceptedAnswer: { '@type': 'Answer', text: '本页 AP 查表按 AIAG-VDA FMEA 手册（2019）的行动优先级评估表口径编码，并经多处公开权威转载源逐格交叉核对；AP 表按 AIAG-VDA 手册口径，具体以组织标准为准，个别企业会按客户特殊要求微调。' }
            },
            {
              '@type': 'Question',
              name: 'RPN 阈值 100/50 是标准吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。RPN 分档阈值是业内实践惯例（常见 ≥100 为高、≥50 为中），没有标准强制规定，本工具允许直接修改阈值并即时重算。' }
            },
            {
              '@type': 'Question',
              name: 'RPN 和 AP 应该以哪个为准？',
              acceptedAnswer: { '@type': 'Answer', text: 'AIAG-VDA 2019 手册明确不推荐把 RPN 阈值作为唯一取舍依据；AP 是「降低风险所需行动的优先次序」，建议以 AP 为主、RPN 为辅并列呈报。' }
            },
            {
              '@type': 'Question',
              name: '数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有计算与 CSV 生成均在当前浏览器本地完成，不向服务器发送任何内容。' }
            }
          ]
        }
      ]
    })
  }]
})

// ===== PURE-FUNCTIONS-START（可独立 node 单测：不依赖浏览器/Vue） =====
// ---------- AP 查表：AIAG-VDA FMEA 手册（2019）行动优先级 ----------
// 编码前逐格核对来源（2026-11 核对，多源交叉一致后取共识表）：
//   1) Relyence FMEA 软件内置 AP Rules 截图（S/O/D 上下界逐行）及帮助文档
//      https://relyence.com/help/user-guide/fmea-ap.html
//   2) Acadlore《Integrating the FMEA Action Priority Approach with Fuzzy Methods》
//      Table 2 "Action Priority (AP) determination matrix"（同行评审转载，整表一致）
//      https://library.acadlore.com/JIMD/2026/5/1/JIMD_05.01_06.pdf
//   3) Pretesh Biswas《AIAG-VDA Process FMEA》解读（行结构与共识表一致，并注明 DFMEA 与
//      PFMEA 的 AP 表相同）https://preteshbiswas.com/2023/08/21/aiag-vda-process-failure-mode-and-effect-analysis
//   注：fmearatings.com 的转载与上述多源存在多处出入，经交叉核对后未采用。
//   表结构：[S低,S高, O低,O高, D低,D高, AP]；AP 表按 AIAG-VDA 手册口径，具体以组织标准为准。
const AP_ROWS = [
  // 严重度 9-10（安全/法规相关）
  [9, 10, 8, 10, 7, 10, 'H'],
  [9, 10, 8, 10, 5, 6, 'H'],
  [9, 10, 8, 10, 2, 4, 'H'],
  [9, 10, 8, 10, 1, 1, 'H'],
  [9, 10, 6, 7, 7, 10, 'H'],
  [9, 10, 6, 7, 5, 6, 'H'],
  [9, 10, 6, 7, 2, 4, 'H'],
  [9, 10, 6, 7, 1, 1, 'H'],
  [9, 10, 4, 5, 7, 10, 'H'],
  [9, 10, 4, 5, 5, 6, 'H'],
  [9, 10, 4, 5, 2, 4, 'H'],
  [9, 10, 4, 5, 1, 1, 'M'],
  [9, 10, 2, 3, 7, 10, 'H'],
  [9, 10, 2, 3, 5, 6, 'M'],
  [9, 10, 2, 3, 2, 4, 'L'],
  [9, 10, 2, 3, 1, 1, 'L'],
  [9, 10, 1, 1, 1, 10, 'L'],
  // 严重度 7-8（主要功能丧失/降级）
  [7, 8, 8, 10, 7, 10, 'H'],
  [7, 8, 8, 10, 5, 6, 'H'],
  [7, 8, 8, 10, 2, 4, 'H'],
  [7, 8, 8, 10, 1, 1, 'H'],
  [7, 8, 6, 7, 7, 10, 'H'],
  [7, 8, 6, 7, 5, 6, 'H'],
  [7, 8, 6, 7, 2, 4, 'H'],
  [7, 8, 6, 7, 1, 1, 'M'],
  [7, 8, 4, 5, 7, 10, 'H'],
  [7, 8, 4, 5, 5, 6, 'M'],
  [7, 8, 4, 5, 2, 4, 'M'],
  [7, 8, 4, 5, 1, 1, 'M'],
  [7, 8, 2, 3, 7, 10, 'M'],
  [7, 8, 2, 3, 5, 6, 'M'],
  [7, 8, 2, 3, 2, 4, 'L'],
  [7, 8, 2, 3, 1, 1, 'L'],
  [7, 8, 1, 1, 1, 10, 'L'],
  // 严重度 4-6（次要功能受影响）
  [4, 6, 8, 10, 7, 10, 'H'],
  [4, 6, 8, 10, 5, 6, 'H'],
  [4, 6, 8, 10, 2, 4, 'M'],
  [4, 6, 8, 10, 1, 1, 'M'],
  [4, 6, 6, 7, 7, 10, 'M'],
  [4, 6, 6, 7, 5, 6, 'M'],
  [4, 6, 6, 7, 2, 4, 'M'],
  [4, 6, 6, 7, 1, 1, 'L'],
  [4, 6, 4, 5, 7, 10, 'M'],
  [4, 6, 4, 5, 5, 6, 'L'],
  [4, 6, 4, 5, 2, 4, 'L'],
  [4, 6, 4, 5, 1, 1, 'L'],
  [4, 6, 2, 3, 1, 10, 'L'],
  [4, 6, 1, 1, 1, 10, 'L'],
  // 严重度 2-3（轻微影响）
  [2, 3, 8, 10, 7, 10, 'M'],
  [2, 3, 8, 10, 5, 6, 'M'],
  [2, 3, 8, 10, 2, 4, 'L'],
  [2, 3, 8, 10, 1, 1, 'L'],
  [2, 3, 6, 7, 1, 10, 'L'],
  [2, 3, 4, 5, 1, 10, 'L'],
  [2, 3, 2, 3, 1, 10, 'L'],
  [2, 3, 1, 1, 1, 10, 'L'],
  // 严重度 1（几乎无影响）
  [1, 1, 1, 10, 1, 10, 'L']
]

// AP 查表函数：S/O/D 1-10 → 'H' | 'M' | 'L'（非法输入夹取到边界，恒有输出）
function getAp(s, o, d) {
  const sv = Math.min(10, Math.max(1, Math.round(Number(s) || 1)))
  const ov = Math.min(10, Math.max(1, Math.round(Number(o) || 1)))
  const dv = Math.min(10, Math.max(1, Math.round(Number(d) || 1)))
  for (const row of AP_ROWS) {
    if (sv >= row[0] && sv <= row[1] && ov >= row[2] && ov <= row[3] && dv >= row[4] && dv <= row[5]) {
      return row[6]
    }
  }
  return 'L' // 兜底：理论上不可达（AP_ROWS 全覆盖 1000 组合，见单测）
}

// RPN 与分档（阈值为实践惯例，非标准）
function rpnOf(s, o, d) {
  const sv = Math.min(10, Math.max(1, Math.round(Number(s) || 1)))
  const ov = Math.min(10, Math.max(1, Math.round(Number(o) || 1)))
  const dv = Math.min(10, Math.max(1, Math.round(Number(d) || 1)))
  return sv * ov * dv
}

function rpnBand(rpn, high, mid) {
  const hi = Number(high) > 0 ? Number(high) : 100
  const mi = Number(mid) > 0 ? Number(mid) : 50
  if (rpn >= hi) return '高'
  if (rpn >= mi) return '中'
  return '低'
}

function apCn(ap) {
  return ap === 'H' ? '高' : ap === 'M' ? '中' : '低'
}

const AP_ORDER = { H: 0, M: 1, L: 2 }

// 行规范化：任意输入 → 合法行对象
function normalizeRow(raw, id) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const str = (v) => String(v ?? '').slice(0, 300).trim()
  const clamp = (v) => {
    const n = Math.round(Number(v))
    return Number.isFinite(n) ? Math.min(10, Math.max(1, n)) : 5
  }
  const cat = r.category === 'CC' || r.category === 'SC' ? r.category : ''
  return {
    id,
    process: str(r.process),
    mode: str(r.mode),
    effect: str(r.effect),
    s: clamp(r.s),
    cause: str(r.cause),
    o: clamp(r.o),
    control: str(r.control),
    d: clamp(r.d),
    category: cat
  }
}

// 行 → 双口径结果
function computeRow(row, thresholds) {
  const rpn = rpnOf(row.s, row.o, row.d)
  return {
    ...row,
    rpn,
    rpnLevel: rpnBand(rpn, thresholds && thresholds.high, thresholds && thresholds.mid),
    ap: getAp(row.s, row.o, row.d)
  }
}

// 排序：'rpn' → RPN 降序（同分 AP 高在前）；'ap' → AP 高/中/低（同档 RPN 降序）
function sortRows(computedList, mode) {
  const list = [...computedList]
  list.sort((a, b) => {
    if (mode === 'ap') {
      if (a.ap !== b.ap) return AP_ORDER[a.ap] - AP_ORDER[b.ap]
      return b.rpn - a.rpn
    }
    if (a.rpn !== b.rpn) return b.rpn - a.rpn
    return AP_ORDER[a.ap] - AP_ORDER[b.ap]
  })
  return list
}

function apCounts(computedList) {
  const c = { total: computedList.length, high: 0, mid: 0, low: 0 }
  for (const r of computedList) {
    if (r.ap === 'H') c.high += 1
    else if (r.ap === 'M') c.mid += 1
    else c.low += 1
  }
  return c
}

// CSV 生成器（纯文本；下载时再加 BOM 与文件名）
function csvCell(v) {
  const s = String(v ?? '')
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

function buildCsv(rows, thresholds) {
  const th = thresholds || {}
  const head = ['序号', '过程步骤', '潜在失效模式', '潜在影响', '严重度S', '潜在原因', '频度O', '当前控制', '探测度D', '分类', 'RPN', 'RPN档位', 'AP行动优先级']
  const lines = [head.join(',')]
  rows.forEach((r, i) => {
    const c = computeRow(r, th)
    lines.push(
      [
        i + 1,
        c.process,
        c.mode,
        c.effect,
        c.s,
        c.cause,
        c.o,
        c.control,
        c.d,
        c.category,
        c.rpn,
        c.rpnLevel,
        apCn(c.ap)
      ]
        .map(csvCell)
        .join(',')
    )
  })
  return lines.join('\r\n')
}
// ===== PURE-FUNCTIONS-END =====

// ---------- S/O/D 档位 tooltip 速查（参考口径） ----------
const S_TIP = '严重度 S（参考口径）：9-10 安全/法规影响；7-8 主要功能丧失或降级；5-6 次要功能受影响；3-4 轻微影响；1-2 几乎无影响'
const O_TIP = '频度 O（参考口径）：8-10 很高持续发生；6-7 高经常发生；4-5 中等偶尔发生；2-3 低偶发；1 极低或经预防控制基本消除'
const D_TIP = '探测度 D（参考口径）：7-10 很难探测；5-6 中等（人工目视/抽检）；2-4 容易（自动检测/防错拦截）；1 几乎必然探测出'

// ---------- 状态 ----------
let rowSeq = 0
function nextRowId() {
  rowSeq += 1
  return `r${Date.now()}_${rowSeq}`
}

const rows = ref([])
const sortBy = ref('rpn')
const rpnHighThreshold = ref(100)
const rpnMidThreshold = ref(50)
const seoContentVisible = ref(true)

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

const thresholds = computed(() => ({
  high: Number(rpnHighThreshold.value) > 0 ? Number(rpnHighThreshold.value) : 100,
  mid: Number(rpnMidThreshold.value) > 0 ? Number(rpnMidThreshold.value) : 50
}))

// 双口径结果（排序后的展示列表）
const computedRows = computed(() => sortRows(rows.value.map((r) => computeRow(r, thresholds.value)), sortBy.value))

const stats = computed(() => apCounts(rows.value.map((r) => computeRow(r, thresholds.value))))

// ---------- 行操作 ----------
function addRow() {
  rows.value.push(
    normalizeRow({ process: '', mode: '', effect: '', s: 5, cause: '', o: 5, control: '', d: 5, category: '' }, nextRowId())
  )
}

function removeRow(id) {
  rows.value = rows.value.filter((r) => r.id !== id)
}

function clampRow(row, key) {
  row[key] = Math.min(10, Math.max(1, Math.round(Number(row[key])) || 1))
}

function fillExample() {
  addRecentTool('pfmea-risk-assessor')
  const examples = [
    { process: '螺栓打紧', mode: '螺栓漏打扭矩', effect: '客户投诉螺栓松动脱落', s: 8, cause: '打紧工位无漏打防错', o: 3, control: '出库抽检', d: 7, category: 'CC' },
    { process: '扭矩终检', mode: '装配扭矩不足未检出', effect: '整车转向螺母松脱风险', s: 9, cause: '扭矩枪未定期校准', o: 4, control: '无扭矩数据监控', d: 8, category: 'CC' },
    { process: '包装入库', mode: '标签贴错', effect: '客户投诉错装错发', s: 5, cause: '人工贴标易疲劳', o: 5, control: '打包复核', d: 4, category: 'SC' }
  ]
  rows.value = examples.map((e) => normalizeRow(e, nextRowId()))
  trackEvent('工具结果', '计算示例', 'pfmea-risk-assessor')
}

function clearAll() {
  rows.value = []
  trackEvent('工具使用', '清空', 'pfmea-risk-assessor')
}

function setSort(mode) {
  sortBy.value = mode
}

// ---------- 展示样式 ----------
function apClass(ap) {
  return ap === 'H'
    ? 'bg-warning/20 text-warning'
    : ap === 'M'
      ? 'bg-primary/10 text-primary'
      : 'bg-muted text-muted-foreground'
}

function apLabel(ap) {
  return `AP ${apCn(ap)}`
}

function rpnLevelClass(level) {
  return level === '高'
    ? 'bg-warning/20 text-warning'
    : level === '中'
      ? 'bg-primary/10 text-primary'
      : 'bg-muted text-muted-foreground'
}

// ---------- 导出 CSV（浏览器 API 仅在用户交互回调内） ----------
function exportCsv() {
  addRecentTool('pfmea-risk-assessor')
  if (!rows.value.length) {
    alert('请先添加失效模式行或点击「一键示例」后再导出。')
    return
  }
  try {
    const csv = '\uFEFF' + buildCsv(rows.value, thresholds.value)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const today = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `PFMEA风险评估_${today}.csv`
    a.click()
    URL.revokeObjectURL(url)
    trackEvent('工具转化', '导出CSV', 'pfmea-risk-assessor')
  } catch (e) {
    alert('导出失败，请重试或改用截图保存结果表。')
  }
}

// ---------- 生命周期 ----------
onMounted(() => {
  addRecentTool('pfmea-risk-assessor')
})
</script>

<style scoped>
.inp {
  width: 100%;
  padding: 0.5rem 0.625rem;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  color: hsl(var(--foreground));
  font-size: 0.875rem;
  outline: none;
}
.inp:focus {
  box-shadow: 0 0 0 2px hsl(var(--ring));
}
.lbl {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  margin-bottom: 0.25rem;
  cursor: help;
}
</style>
