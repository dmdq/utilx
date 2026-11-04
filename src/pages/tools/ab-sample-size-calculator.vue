<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <SplitSquareHorizontal class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">A/B 测试样本量计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">输入基线转化率与目标提升，估算双臂实验每组所需样本量、实验时长与最小可检测提升（MDE）</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 A/B 测试（A/B Test）样本量计算器：基于双侧 z 检验的标准双比例样本量公式，输入基线转化率、最小可检测提升 MDE、显著性水平 α 与统计功效 1−β，
        即可估算每组所需样本量与实验天数；支持「相对提升 / 绝对百分点」两种口径自动换算，附 MDE 灵敏度对照表（平方反比直观呈现）与反向推算（现有样本能测出多小的提升）。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：实验参数 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 实验参数
        </h2>

        <div>
          <label for="ab-baseline" class="text-sm font-medium text-foreground">基线转化率 p₁（%）</label>
          <input
            id="ab-baseline"
            v-model.number="p1Input"
            type="number"
            min="0.1"
            max="99"
            step="0.1"
            class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
          <p class="text-xs text-muted-foreground mt-1">对照组当前的转化率，允许 0.1–99，如 5 表示 5%</p>
        </div>

        <div>
          <label for="ab-mde" class="text-sm font-medium text-foreground">最小可检测提升 MDE</label>
          <div class="flex rounded-lg border border-border overflow-hidden mt-1.5" role="group" aria-label="MDE 口径切换">
            <button
              type="button"
              @click="mdeMode = 'relative'"
              class="flex-1 px-3 py-1.5 text-xs font-medium transition"
              :class="mdeMode === 'relative' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'"
            >
              相对提升 %
            </button>
            <button
              type="button"
              @click="mdeMode = 'absolute'"
              class="flex-1 px-3 py-1.5 text-xs font-medium transition"
              :class="mdeMode === 'absolute' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'"
            >
              绝对百分点 pp
            </button>
          </div>
          <input
            id="ab-mde"
            v-model.number="mdeInput"
            type="number"
            min="0.01"
            step="0.5"
            class="w-full mt-2 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
          <p class="text-xs text-muted-foreground mt-1">{{ mdeHint }}</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="ab-alpha" class="text-sm font-medium text-foreground">显著性水平 α</label>
            <select
              id="ab-alpha"
              v-model.number="alpha"
              class="w-full mt-1.5 px-2.5 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option :value="0.1">0.10（较宽松）</option>
              <option :value="0.05">0.05（常用）</option>
              <option :value="0.01">0.01（严格）</option>
            </select>
          </div>
          <div>
            <label for="ab-power" class="text-sm font-medium text-foreground">统计功效 1−β</label>
            <select
              id="ab-power"
              v-model.number="power"
              class="w-full mt-1.5 px-2.5 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option :value="0.8">0.80（默认）</option>
              <option :value="0.9">0.90</option>
              <option :value="0.95">0.95</option>
            </select>
          </div>
        </div>

        <div class="flex gap-2 pt-1">
          <button
            @click="loadExample"
            class="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >
            <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 载入示例
          </button>
          <button
            @click="resetInputs"
            class="flex-1 px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置
          </button>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          示例口径：基线 5% · 相对提升 5% · α=0.05 · 功效 0.80，载入后右侧结果卡即给出该口径下每组所需样本量的精确值。
        </p>
      </div>

      <!-- 右：结果区（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 结论卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 计算结果
          </h2>

          <div v-if="resultsValid" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">每组所需样本量</p>
                <p class="text-4xl font-bold text-primary leading-tight">{{ formatInt(nPerArm) }}</p>
                <p class="text-xs text-muted-foreground mt-1">用户 / 组</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">两组合计</p>
                <p class="text-2xl font-bold text-foreground leading-tight mt-2">{{ formatInt(totalN) }}</p>
                <p class="text-xs text-muted-foreground mt-1">实验组 + 对照组</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">转化率换算</p>
                <p class="text-xl font-bold text-foreground font-mono leading-tight mt-2">{{ fmtPct(p1Ratio) }} → {{ fmtPct(p2Ratio) }}</p>
                <p class="text-xs text-muted-foreground mt-1">对照 → 实验组</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">α = {{ alpha }}（双侧）</span>
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">功效 1−β = {{ powerPct }}%</span>
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">{{ mdeModeText }}</span>
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">口径：双侧 z 检验 · 合并方差近似</span>
            </div>
            <div v-if="warnings.length" class="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <ul class="text-xs text-muted-foreground space-y-0.5">
                <li v-for="(w, i) in warnings" :key="i">{{ w }}</li>
              </ul>
            </div>
          </div>

          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <TriangleAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">暂无法计算</p>
              <p class="text-xs text-muted-foreground mt-1">请检查参数：基线转化率需在 0.1–99 之间，且提升后的转化率不能达到 100%。</p>
            </div>
          </div>
        </div>

        <!-- 实验时长卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <Timer class="w-5 h-5 mr-2 text-primary" /> 实验时长估算
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
            <div>
              <label for="ab-traffic" class="text-sm font-medium text-foreground">日流量（UV / 天）</label>
              <input
                id="ab-traffic"
                v-model.number="dailyTraffic"
                type="number"
                min="0"
                step="1000"
                class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
            </div>
            <div>
              <label for="ab-share" class="text-sm font-medium text-foreground">单组分流比例（%）</label>
              <input
                id="ab-share"
                v-model.number="trafficShare"
                type="number"
                min="1"
                max="100"
                step="1"
                class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <p class="text-xs text-muted-foreground mt-1">50/50 分流时每组各得 50% 流量</p>
            </div>
            <div class="bg-primary/10 rounded-lg p-4 text-center flex flex-col justify-center">
              <p class="text-xs text-muted-foreground mb-1">预计实验时长</p>
              <p class="text-3xl font-bold text-primary leading-tight">{{ daysText }}</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3">{{ trafficHint }}</p>
        </div>

        <!-- MDE 灵敏度对照表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <Info class="w-5 h-5 mr-2 text-primary" /> MDE 灵敏度对照（同基线）
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">相对提升 MDE</th>
                  <th class="py-2 pr-3 font-medium">对照 → 实验</th>
                  <th class="py-2 pr-3 font-medium text-right">每组样本量</th>
                  <th class="py-2 font-medium text-right">相对当前 MDE</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in sensitivityRowsData"
                  :key="row.mde"
                  class="border-b border-border/60 last:border-0"
                  :class="row.isCurrent ? 'bg-primary/5' : ''"
                >
                  <td class="py-2 pr-3 font-medium text-foreground">+{{ row.mde }}%</td>
                  <td class="py-2 pr-3 font-mono text-muted-foreground">{{ row.p2Text }}</td>
                  <td class="py-2 pr-3 text-right font-mono text-foreground">{{ row.nText }}</td>
                  <td class="py-2 text-right font-mono" :class="row.isCurrent ? 'text-primary font-semibold' : 'text-muted-foreground'">{{ row.ratioText }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground mt-3">
            同基线下，样本量与 MDE 近似平方反比：想测越小的提升，样本量平方级增长。以基线 5%、α=0.05、功效 0.80 为例，检出相对 1% 约需每组 300 万样本，检出 10% 只需约 3.1 万。
          </p>
        </div>

        <!-- 反向小卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground flex items-center mb-3">
            <Calculator class="w-4 h-4 mr-1.5 text-primary" /> 反向推算：若每组只有固定样本量，能检出的最小相对提升
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div v-for="r in reverseRowsData" :key="r.n" class="bg-muted/40 border border-border rounded-lg p-3 text-center">
              <p class="text-xs text-muted-foreground">每组 {{ formatInt(r.n) }} 样本</p>
              <p class="text-xl font-bold text-foreground mt-1">{{ fmtMde(r.mde) }}</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">最小可检测相对提升 MDE</p>
            </div>
          </div>
        </div>

        <!-- 提示条（静态） -->
        <p class="text-xs leading-relaxed p-3 rounded-lg bg-muted/60 text-foreground flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <span>样本量不足就提前下结论是 A/B 测试最常见的自欺；实验时长建议至少覆盖一个完整周期（7 天）以消除周内效应。</span>
        </p>
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
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>A/B 测试样本量计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          在启动 A/B 测试前必须回答两个问题：每组要积累多少用户、实验要跑多少天，结果才可信？本工具围绕双侧 z 检验的双比例样本量公式给出三个视角的答案：
          正向——给定基线转化率、最小可检测提升 MDE、显著性水平 α 与统计功效 1−β，算出每组所需样本量与预计天数；
          反向——给定现有样本量，算出最多能可靠检出的最小提升；横向——用灵敏度对照表展示 MDE 与样本量的平方反比关系，帮助你在「测多小的提升」与「投入多少流量」之间做取舍。全部计算在浏览器本地完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">A/B 测试样本量怎么算？（公式通俗版）</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          样本量由「信号与噪声之比」决定：信号是你想检出的提升幅度 δ = p₂ − p₁，噪声是转化率本身的随机波动。标准公式为
          n = ( z₁₋α/₂·√(2·p̄(1−p̄)) + z₁₋β·√(p₁(1−p₁)+p₂(1−p₂)) )² ÷ (p₂−p₁)²，其中 p̄ = (p₁+p₂)/2。
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed">
          通俗地说：根号里的第一项是「把假阳性控制在 α 以内」的门槛，第二项是「把漏检控制在 β 以内」的门槛，两道门槛相加后要被信号 δ 覆盖，再取平方折算成人数。
          转化率越接近 50% 波动越大、所需样本越多；提升幅度越小，样本量按平方反比膨胀。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">α 和 β 是什么？（第一类 / 第二类错误人话版）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          α（显著性水平）是第一类错误的概率：实验组其实并没有更好，你却宣布有效，相当于「冤枉好人」——α=0.05 意味着长期看每 20 次无差别的实验里约有 1 次报假阳性。
          β 是第二类错误的概率：真实存在的提升没有被检出，相当于「放走真凶」；统计功效 1−β=0.80 表示真实提升有 80% 的把握被检出。
          想同时少冤枉、少漏判，唯一的途径就是增加样本量——α 调小、功效调大都会推高所需样本数。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">MDE 为什么决定样本量？（平方反比）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          MDE（Minimum Detectable Effect，最小可检测效应）是你愿意为之下结论的最小提升。信号越微弱，越需要更多样本把它从随机波动里分辨出来，而且是平方级关系：
          其他条件不变时，MDE 缩小一半，每组样本量约增至 4 倍；MDE 放大一倍，样本量约降为四分之一。这也解释了为什么在低基数指标上「想测 1% 的提升」动辄需要每组数百万样本——
          请先用本页的灵敏度表估算你的指标量级是否撑得起目标 MDE。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">实验要跑多久？（7 天周期效应）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          预计天数 = 每组样本量 ÷（日流量 × 单组分流比例），向上取整。但样本量攒够并不意味着随时可以停：用户行为有很强的周内效应（工作日与周末的访问意愿、转化意愿差异明显），
          实验至少应完整覆盖一个周期（7 天），否则不同实验组可能落在不同的「星期几」上，引入系统性偏差。同理，也不建议每天盯着显著性「偷看」（peeking）——
          一不显著就停、一显著就停会显著抬高假阳性率；若确需中途决策，请使用序贯检验类方法而非固定样本量口径。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">样本量不够怎么办？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          四个方向按优先级尝试：① 提高 MDE——把正式实验留给足够大的改动（改版、新定价、新流程），微调类改动不必开实验；② 换更灵敏的指标或提高基线——把实验放到漏斗更靠后、
          转化率更高的环节，或改用人均时长、客单价等连续指标，方差更小、所需样本更少；③ 接受更长的实验周期，用时间换检出力，并保证覆盖完整周；④ 若流量实在不足，
          如实调低目标功效或改用支持中途决策的序贯/贝叶斯方案，而不是提前停实验宣布胜利——那只是把噪声当成了结论。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">A/B 测试每组需要多少样本？</h3>
            <p class="text-sm text-muted-foreground mt-1">由基线转化率、最小可检测提升 MDE、显著性水平 α 与统计功效 1−β 共同决定。以基线 5%、相对提升 5%（5%→5.25%）、α=0.05、功效 80% 为例，标准双侧 z 检验双比例公式给出每组约 12.2 万个样本；把 MDE 放大到相对 10%（5%→5.5%）则降至每组约 3.1 万。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">α 和 β 有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">α 是第一类错误概率：没有效果却误判为有效（假阳性，冤枉好人），常用 0.05；β 是第二类错误概率：真实提升没有被检出（假阴性，漏掉真凶），功效 1−β 是检出真实提升的把握，常用 0.80。两者越严，所需样本量越大。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">MDE 调大一倍，样本量怎么变？</h3>
            <p class="text-sm text-muted-foreground mt-1">近似平方反比：MDE 放大一倍，每组样本量约降为原来的四分之一；缩小一半则约增至四倍。例如基线 5% 时，检出相对 1% 的提升约需每组 300 万样本，检出 10% 只需约 3.1 万。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">样本量不够就提前下结论会怎样？</h3>
            <p class="text-sm text-muted-foreground mt-1">固定样本量口径下中途「偷看」并提前停止，会让实际假阳性率远超设定的 α——大多数「显著」只是噪声。样本量不足时应提高 MDE、更换更灵敏的指标、接受更长实验周期，或改用序贯检验等支持中途决策的方法。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 固定免责声明 -->
    <div class="flex items-start gap-2 p-4 rounded-lg bg-card border border-border mb-6">
      <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        样本量基于双侧 z 检验与方差齐性近似，适用于大样本比例实验；结果为估算口径，实验平台内置计算器可能采用不同修正（如 CUPED、序贯检验），以平台口径为准。
      </p>
    </div>

    <RelatedTools :currentToolId="'ab-sample-size-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  SplitSquareHorizontal, Calculator, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Timer
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'A/B 测试样本量计算器 - 在线 A/B Test 每组样本量与实验时长估算',
  description: '免费在线 A/B 测试样本量计算器：输入基线转化率、最小可检测提升 MDE、显著性水平 α 与统计功效，基于双侧 z 检验双比例公式估算每组所需样本量与实验天数，支持相对/绝对两种提升口径、MDE 灵敏度对照与反向推算，纯浏览器本地运行不上传',
  keywords: 'ab测试样本量,样本量计算,ab test 计算器,a/b test,转化率实验',
  author: '有条工具',
  ogTitle: 'A/B 测试样本量计算器 - 在线 A/B Test 每组样本量与实验时长估算 | 有条工具',
  ogDescription: '输入基线转化率与目标提升，估算 A/B 实验每组样本量、实验天数与最小可检测提升，支持灵敏度对照与反向推算。',
  ogUrl: 'https://www.util.cn/tools/ab-sample-size-calculator',
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
          name: 'A/B 测试样本量计算器',
          url: 'https://www.util.cn/tools/ab-sample-size-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['正向样本量估算（双侧 z 检验双比例公式）', '相对/绝对两种 MDE 口径换算', 'α 与统计功效可调', '实验时长与分流比例推算', 'MDE 灵敏度对照表', '反向最小可检测提升推算', '浏览器本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: 'A/B 测试样本量计算器', item: 'https://www.util.cn/tools/ab-sample-size-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'A/B 测试每组需要多少样本？',
              acceptedAnswer: { '@type': 'Answer', text: '由基线转化率、最小可检测提升 MDE、显著性水平 α 与统计功效 1−β 共同决定。以基线 5%、相对提升 5%（5%→5.25%）、α=0.05、功效 80% 为例，标准双侧 z 检验双比例公式给出每组约 12.2 万个样本；把 MDE 放大到相对 10% 则降至每组约 3.1 万。' }
            },
            {
              '@type': 'Question',
              name: 'α 和 β 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'α 是第一类错误概率：没有效果却误判为有效（假阳性），常用 0.05；β 是第二类错误概率：真实提升没有被检出（假阴性），功效 1−β 是检出真实提升的把握，常用 0.80。两者越严格，所需样本量越大。' }
            },
            {
              '@type': 'Question',
              name: 'MDE 调大一倍，样本量怎么变？',
              acceptedAnswer: { '@type': 'Answer', text: '近似平方反比：MDE 放大一倍，每组样本量约降为原来的四分之一；缩小一半则约增至四倍。例如基线 5% 时，检出相对 1% 的提升约需每组 300 万样本，检出 10% 只需约 3.1 万。' }
            },
            {
              '@type': 'Question',
              name: '样本量不够就提前下结论会怎样？',
              acceptedAnswer: { '@type': 'Answer', text: '固定样本量口径下中途偷看并提前停止，会让实际假阳性率远超设定的 α，大多数显著只是噪声。应提高 MDE、更换更灵敏的指标、接受更长实验周期，或改用序贯检验等支持中途决策的方法。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// p2 钳制上限：避免 p2 → 1 使方差项归零（0.9999 即 99.99%）
const P2_MAX = 0.9999

// Peter Acklam（2000）正态分位数有理近似：用分段有理式直接从累积概率 p 反解分位数 z，
// 相对误差 < 1.15e-9，远低于本页 1e-4 的校准要求。三段实现：
//   下尾 p < 0.02425          ：q = √(-2·ln p)，用 c/d 两组系数的有理式；
//   中心 0.02425 ≤ p ≤ 0.97575：q = p − 0.5，r = q²，用 a/b 两组系数的有理式；
//   上尾 p > 0.97575          ：由对称性 z(p) = −z(1−p)，复用下尾有理式取负。
const ACKLAM_A = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00]
const ACKLAM_B = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01]
const ACKLAM_C = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00]
const ACKLAM_D = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00]
const ACKLAM_P_LOW = 0.02425

// 正态分布分位数（逆 CDF）：返回 z 使 Φ(z) = p
function zQuantile(p) {
  if (p <= 0) return -Infinity
  if (p >= 1) return Infinity
  if (p < ACKLAM_P_LOW) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (((((ACKLAM_C[0] * q + ACKLAM_C[1]) * q + ACKLAM_C[2]) * q + ACKLAM_C[3]) * q + ACKLAM_C[4]) * q + ACKLAM_C[5]) /
      ((((ACKLAM_D[0] * q + ACKLAM_D[1]) * q + ACKLAM_D[2]) * q + ACKLAM_D[3]) * q + 1)
  }
  if (p <= 1 - ACKLAM_P_LOW) {
    const q = p - 0.5
    const r = q * q
    return (((((ACKLAM_A[0] * r + ACKLAM_A[1]) * r + ACKLAM_A[2]) * r + ACKLAM_A[3]) * r + ACKLAM_A[4]) * r + ACKLAM_A[5]) * q /
      (((((ACKLAM_B[0] * r + ACKLAM_B[1]) * r + ACKLAM_B[2]) * r + ACKLAM_B[3]) * r + ACKLAM_B[4]) * r + 1)
  }
  const q = Math.sqrt(-2 * Math.log(1 - p))
  return -(((((ACKLAM_C[0] * q + ACKLAM_C[1]) * q + ACKLAM_C[2]) * q + ACKLAM_C[3]) * q + ACKLAM_C[4]) * q + ACKLAM_C[5]) /
    ((((ACKLAM_D[0] * q + ACKLAM_D[1]) * q + ACKLAM_D[2]) * q + ACKLAM_D[3]) * q + 1)
}

// 由 p1 与 MDE 求实验组转化率 p2：
//   relative：p2 = p1 ×（1 + mde/100），"提升 5%" 即 p2 = p1 × 1.05；
//   absolute：p2 = p1 + mde/100，"+2 个百分点（pp）" 即 p2 = p1 + 0.02。
// 统一钳制 p2 < P2_MAX，防止方差项为 0 导致公式除零。
function p2Of(p1, mde, mode) {
  const raw = mode === 'absolute' ? p1 + mde / 100 : p1 * (1 + mde / 100)
  return Math.min(raw, P2_MAX)
}

/**
 * 连续（未取整）每组样本量——标准双比例 z 检验公式（H0 合并方差 + H1 非合并方差口径）。
 * 推导：
 *   1. 两臂各 n 个样本。H0（p1 = p2 = p̄，p̄ = (p1+p2)/2）下两组差值的标准误
 *      SE0 = √(2·p̄(1−p̄)/n)（合并二项方差 p̄(1−p̄) × (1/n + 1/n)）；
 *   2. H1（两臂真实率为 p1、p2）下差值的标准误
 *      SE1 = √((p1(1−p1) + p2(1−p2))/n)；
 *   3. 双侧检验在 |Z| > z_{1−α/2} 时拒绝 H0。要同时控制两类错误：
 *        显著性约束：临界差值 c = z_{1−α/2}·SE0（H0 下越界概率 = α）
 *        功效约束：  P(|p̂2−p̂1| > c | H1) = 1−β
 *                    ⇒ √n·δ − z_{1−α/2}·√(2p̄(1−p̄)) ≥ z_{power}·√(p1(1−p1)+p2(1−p2))，δ = p2 − p1
 *   4. 解出 n ≥ ( z_{1−α/2}·√(2p̄(1−p̄)) + z_{power}·√(p1(1−p1)+p2(1−p2)) )² / δ²。
 * 参数非法（比例越界、p2 ≤ p1、α/功效越界）时返回 Infinity。
 */
function sampleSizeContinuous(p1, p2, alpha, power) {
  if (!(p1 > 0 && p1 < 1 && p2 > p1 && p2 <= P2_MAX) || !(alpha > 0 && alpha < 0.5) || !(power > 0 && power < 1)) {
    return Infinity
  }
  const pBar = (p1 + p2) / 2
  const zAlpha = zQuantile(1 - alpha / 2)
  const zPower = zQuantile(power)
  const seH0 = Math.sqrt(2 * pBar * (1 - pBar))
  const seH1 = Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))
  return ((zAlpha * seH0 + zPower * seH1) ** 2) / ((p2 - p1) ** 2)
}

// 每组所需样本量：连续解向上取整（样本只能取整数个）
function sampleSizePerArm(p1, p2, alpha, power) {
  const raw = sampleSizeContinuous(p1, p2, alpha, power)
  return raw === Infinity ? Infinity : Math.ceil(raw)
}

// 实验时长（天）：单组每天可积累 dailyTraffic × share/100 个样本，向上取整进位到整天；
// 无流量或样本量非有限值时返回 Infinity
function daysOf(nPerArm, dailyTraffic, trafficShare) {
  const perDay = dailyTraffic * (trafficShare / 100)
  if (!(perDay > 0) || !Number.isFinite(nPerArm)) return Infinity
  return Math.ceil(nPerArm / perDay)
}

/**
 * 反向 MDE：给定每组样本量 nPerArm，求在 (alpha, power) 下能检出的最小相对提升（%）。
 * 二分口径：在连续（未向上取整）样本量曲线 n(mde) 上反解——n 关于 mde 单调递减且连续；
 * 若直接对取整后的函数二分会引入 ±1 个样本的台阶噪声，故先在连续曲线上收敛
 * （区间按相对半径 1e-9 收缩），收敛后取右端点 hi，满足 n(hi) ∈ (nPerArm−1, nPerArm]，
 * 回代 ceil 后与目标严格一致。p2 达到 P2_MAX 仍需更多样本时返回 Infinity（该样本量检不出任何提升）。
 */
function mdeOf(p1, nPerArm, alpha, power) {
  if (!(nPerArm > 0) || !(p1 > 0 && p1 < 1)) return Infinity
  const hiMax = ((P2_MAX - p1) / p1) * 100 // 相对提升上限：p2 → P2_MAX
  const nMin = sampleSizeContinuous(p1, p2Of(p1, hiMax, 'relative'), alpha, power)
  if (!Number.isFinite(nMin) || nMin > nPerArm) return Infinity
  let lo = 1e-9 // n(lo) → ∞，不变式：n(lo) ≥ nPerArm ≥ n(hi)
  let hi = hiMax
  while (hi - lo > 1e-9 * hi) {
    const mid = (lo + hi) / 2
    const nMid = sampleSizeContinuous(p1, p2Of(p1, mid, 'relative'), alpha, power)
    if (nMid > nPerArm) lo = mid
    else hi = mid
  }
  return hi
}

// 灵敏度表固定四档 MDE（相对提升 %）：直观呈现「想测越小的提升，样本量平方级增长」
const SENSITIVITY_MDES = [1, 3, 5, 10]

function sensitivityRows(p1, alpha, power) {
  return SENSITIVITY_MDES.map((mde) => {
    const p2 = p2Of(p1, mde, 'relative')
    return { mde, p2, n: sampleSizePerArm(p1, p2, alpha, power) }
  })
}

// 反向小卡固定三档每组样本量
const REVERSE_SAMPLES = [1000, 5000, 10000]

function reverseRows(p1, alpha, power) {
  return REVERSE_SAMPLES.map((n) => ({ n, mde: mdeOf(p1, n, alpha, power) }))
}

// 输入钳制：字符串 / 空值 / NaN 回退默认值，越界收紧到 [lo, hi]
function clampNumber(v, lo, hi, fallback) {
  const n = typeof v === 'number' ? v : parseFloat(v)
  if (!Number.isFinite(n)) return fallback
  return Math.min(hi, Math.max(lo, n))
}

// ---------- 格式化（展示层可复用的纯函数） ----------

// 整数千分位；非有限值显示占位符
function formatInt(n) {
  if (!Number.isFinite(n)) return '—'
  return Math.round(n).toLocaleString('zh-CN')
}

// 比例 → 百分比字符串（去掉尾随 0），如 0.0525 → "5.25%"
function fmtPct(p, digits = 2) {
  let s = (p * 100).toFixed(digits)
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '')
  return `${s}%`
}

// MDE 数值 → 显示字符串（大数取整、中数 1 位、小数 2 位小数）
function fmtNum(n) {
  if (!Number.isFinite(n)) return '—'
  if (n >= 100) return `${Math.round(n)}`
  if (n >= 10) return n.toFixed(1)
  return n.toFixed(2)
}

function fmtMde(mde) {
  return Number.isFinite(mde) ? `${fmtNum(mde)}%` : '—'
}

// ---------- 页面状态（交互层） ----------
const DEFAULTS = {
  p1Input: 5,        // 基线转化率（%）
  mdeInput: 5,       // MDE 数值（口径随 mdeMode）
  mdeMode: 'relative',
  alpha: 0.05,
  power: 0.8,
  dailyTraffic: 20000,
  trafficShare: 50
}

const p1Input = ref(DEFAULTS.p1Input)
const mdeInput = ref(DEFAULTS.mdeInput)
const mdeMode = ref(DEFAULTS.mdeMode)
const alpha = ref(DEFAULTS.alpha)
const power = ref(DEFAULTS.power)
const dailyTraffic = ref(DEFAULTS.dailyTraffic)
const trafficShare = ref(DEFAULTS.trafficShare)
const seoContentVisible = ref(true)

function loadExample() {
  p1Input.value = DEFAULTS.p1Input
  mdeInput.value = DEFAULTS.mdeInput
  mdeMode.value = DEFAULTS.mdeMode
  alpha.value = DEFAULTS.alpha
  power.value = DEFAULTS.power
  dailyTraffic.value = DEFAULTS.dailyTraffic
  trafficShare.value = DEFAULTS.trafficShare
}

function resetInputs() {
  loadExample()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 计算管线（钳制 → 纯函数 → 展示） ----------
const p1Ratio = computed(() => clampNumber(p1Input.value, 0.1, 99, DEFAULTS.p1Input) / 100)
const mdeNum = computed(() => clampNumber(mdeInput.value, 0.01, 9999, DEFAULTS.mdeInput))
const p2Ratio = computed(() => p2Of(p1Ratio.value, mdeNum.value, mdeMode.value))
const nPerArm = computed(() => sampleSizePerArm(p1Ratio.value, p2Ratio.value, alpha.value, power.value))
const totalN = computed(() => (Number.isFinite(nPerArm.value) ? nPerArm.value * 2 : Infinity))
const resultsValid = computed(() => Number.isFinite(nPerArm.value))
const powerPct = computed(() => Math.round(power.value * 100))

const warnings = computed(() => {
  const list = []
  const p1Raw = typeof p1Input.value === 'number' ? p1Input.value : parseFloat(p1Input.value)
  if (!Number.isFinite(p1Raw)) {
    list.push('基线转化率未填写或非法，暂按 5% 计算')
  } else if (p1Raw < 0.1 || p1Raw > 99) {
    list.push(`基线转化率需在 0.1–99 之间，已按 ${fmtPct(p1Ratio.value)} 计算`)
  }
  const mdeRaw = typeof mdeInput.value === 'number' ? mdeInput.value : parseFloat(mdeInput.value)
  if (!Number.isFinite(mdeRaw)) {
    list.push('MDE 未填写或非法，暂按 5% 计算')
  } else if (mdeRaw < 0.01) {
    list.push('MDE 至少为 0.01，已按 0.01 计算（对应样本量将非常庞大）')
  }
  if (p2Ratio.value >= P2_MAX) {
    list.push('提升后转化率触及 100% 上限，已按 99.99% 计算，请减小 MDE 或降低基线')
  }
  return list
})

const mdeHint = computed(() => {
  if (mdeMode.value === 'relative') {
    return `口径：实验组 = 基线 ×（1 + MDE%），如基线 5% + 5% → ${fmtPct(p2Of(p1Ratio.value, mdeNum.value, 'relative'))}`
  }
  return `口径：实验组 = 基线 + MDE 个百分点，如基线 5% + 2pp → ${fmtPct(p2Of(p1Ratio.value, mdeNum.value, 'absolute'))}`
})

const mdeModeText = computed(() => {
  return mdeMode.value === 'relative'
    ? `MDE：相对提升 +${fmtNum(mdeNum.value)}%`
    : `MDE：绝对提升 +${fmtNum(mdeNum.value)}pp`
})

// 实验时长：纯函数 daysOf 出整数天，rawDays 判定是否「不足 1 天」
const trafficClamped = computed(() => clampNumber(dailyTraffic.value, 0, 1e9, DEFAULTS.dailyTraffic))
const shareClamped = computed(() => clampNumber(trafficShare.value, 1, 100, DEFAULTS.trafficShare))
const perArmDaily = computed(() => (trafficClamped.value * shareClamped.value) / 100)
const rawDays = computed(() => (perArmDaily.value > 0 ? nPerArm.value / perArmDaily.value : Infinity))
const daysNeeded = computed(() => daysOf(nPerArm.value, trafficClamped.value, shareClamped.value))

const daysText = computed(() => {
  if (!Number.isFinite(rawDays.value)) return '—'
  if (rawDays.value < 1) return '当天即可积累'
  return `${daysNeeded.value} 天`
})

const trafficHint = computed(() => {
  if (!Number.isFinite(rawDays.value) || perArmDaily.value <= 0) {
    return '请填写大于 0 的日流量与分流比例，即可估算实验时长。'
  }
  const perDay = formatInt(perArmDaily.value)
  if (rawDays.value < 1) {
    return `按当前分流，每天每组可积累约 ${perDay} 个样本，当天即可积累完成所需样本量。`
  }
  return `按当前分流，每天每组可积累约 ${perDay} 个样本，预计约 ${daysNeeded.value} 天达到每组 ${formatInt(nPerArm.value)} 的样本量。`
})

// 灵敏度表：固定 1/3/5/10 四档，同基线同 α 同功效
const sensitivityRowsData = computed(() => {
  const cur = nPerArm.value
  return sensitivityRows(p1Ratio.value, alpha.value, power.value).map((row) => ({
    mde: row.mde,
    p2Text: `${fmtPct(p1Ratio.value)} → ${fmtPct(row.p2)}`,
    nText: formatInt(row.n),
    ratioText: Number.isFinite(row.n) && Number.isFinite(cur) && cur > 0 ? `×${(row.n / cur).toFixed(2)}` : '—',
    isCurrent: mdeMode.value === 'relative' && Math.abs(row.mde - mdeNum.value) < 1e-9
  }))
})

// 反向小卡：每组 1000/5000/10000 样本能检出的最小相对提升
const reverseRowsData = computed(() =>
  reverseRows(p1Ratio.value, alpha.value, power.value).map((r) => ({
    n: r.n,
    mde: r.mde
  }))
)

// ---------- 生命周期（SSR 安全：无浏览器 API，仅记录最近使用） ----------
onMounted(() => {
  addRecentTool('ab-sample-size-calculator')
})
</script>
