<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <TrendingDown class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">补仓成本摊薄计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">补仓后新成本、回本价、浮盈浮亏与「补多少能回到目标成本」反推，先算再补</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线补仓成本摊薄计算器：填入原持仓（股数、成本价）与补仓计划（可加第二笔），按加权平均即时算出新成本价与总投入；
        回本价就是摊薄后的成本价，页面用大数字直读，并用「跌 20% 需涨 25%」对照表破除「跌多少涨多少就回本」的直觉误差；
        还支持反推——想回到某个目标成本，按现价需要补入多少股。核心算法全部为可独立单测的纯函数，
        计算在浏览器本地完成，参数暂存本机，不上传任何数据。补仓摊薄不等于降低风险，先看页内风险提示。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <TrendingDown class="w-5 h-5 mr-2 text-primary" /> 持仓与补仓
        </h2>

        <!-- 原持仓 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">原持仓</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="ad-qty0" class="block text-xs text-muted-foreground mb-1.5">持股数量（股）</label>
              <input
                id="ad-qty0"
                v-model.number="qty0Input"
                type="number"
                min="0"
                step="100"
                placeholder="如 1000"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label for="ad-cost0" class="block text-xs text-muted-foreground mb-1.5">持仓成本价（元/股）</label>
              <input
                id="ad-cost0"
                v-model.number="cost0Input"
                type="number"
                min="0"
                step="0.01"
                placeholder="如 20"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        <!-- 补仓计划 -->
        <div class="space-y-3 pt-1 border-t border-border">
          <p class="text-sm font-medium text-foreground">补仓计划（选填）</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="ad-qty1" class="block text-xs text-muted-foreground mb-1.5">第一笔补入股数（股）</label>
              <input
                id="ad-qty1"
                v-model.number="qty1Input"
                type="number"
                min="0"
                step="100"
                placeholder="如 1000"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label for="ad-price1" class="block text-xs text-muted-foreground mb-1.5">第一笔补入价（元/股）</label>
              <input
                id="ad-price1"
                v-model.number="price1Input"
                type="number"
                min="0"
                step="0.01"
                placeholder="如 10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <label for="ad-add-second" class="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              id="ad-add-second"
              v-model="addSecond"
              type="checkbox"
              class="accent-[hsl(var(--primary))]"
            />
            再加一笔补仓（分两批补）
          </label>
          <div v-if="addSecond" class="grid grid-cols-2 gap-3">
            <div>
              <label for="ad-qty2" class="block text-xs text-muted-foreground mb-1.5">第二笔补入股数（股）</label>
              <input
                id="ad-qty2"
                v-model.number="qty2Input"
                type="number"
                min="0"
                step="100"
                placeholder="如 500"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label for="ad-price2" class="block text-xs text-muted-foreground mb-1.5">第二笔补入价（元/股）</label>
              <input
                id="ad-price2"
                v-model.number="price2Input"
                type="number"
                min="0"
                step="0.01"
                placeholder="如 8"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        <!-- 现价 -->
        <div class="pt-1 border-t border-border">
          <label for="ad-current" class="block text-sm font-medium text-foreground mb-2">现价（元/股，选填）</label>
          <input
            id="ad-current"
            v-model.number="currentInput"
            type="number"
            min="0"
            step="0.01"
            placeholder="如 12"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>用于查看浮动盈亏，以及「回到目标成本需补多少股」的反推</span>
          </p>
        </div>

        <!-- 目标成本反推 -->
        <div class="pt-1 border-t border-border">
          <label for="ad-target" class="block text-sm font-medium text-foreground mb-2">目标成本（元/股，选填）</label>
          <input
            id="ad-target"
            v-model.number="targetInput"
            type="number"
            min="0"
            step="0.1"
            placeholder="如 15"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>反推口径：以现价补入多少股后，加权平均成本恰好降到这个数</span>
          </p>
        </div>

        <!-- 输入异常提示 -->
        <p v-if="inputWarning" class="text-xs leading-relaxed text-red-500 p-2 rounded bg-red-500/10 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ inputWarning }}</span>
        </p>

        <!-- 操作按钮 -->
        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            @click="loadExample"
            class="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-sm font-medium text-primary transition"
          >
            <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 载入示例
          </button>
          <button
            @click="resetAll"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置
          </button>
        </div>
      </div>

      <!-- 右侧：结果 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 摊薄测算结果
        </h2>

        <template v-if="hasPosition">
          <!-- 结论卡：回本价（特大） -->
          <div class="bg-primary/10 rounded-lg p-5 text-center">
            <p class="text-xs text-muted-foreground mb-1">回本价（= 摊薄后的新成本价）</p>
            <p class="text-4xl sm:text-5xl font-bold text-primary leading-tight break-all">
              {{ formatMoney2(stats.avgCost) }}<span class="text-base font-normal text-muted-foreground ml-1.5">元/股</span>
            </p>
            <p class="text-xs text-muted-foreground mt-2">
              总投入 {{ formatMoney2(stats.totalCost) }} 元 ÷ 总股数 {{ formatInt(stats.totalShares) }} 股；现价升破此价，整体持仓即回本
            </p>
          </div>

          <!-- 摊薄前后对照 -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">原持仓成本价</p>
              <p class="text-2xl font-bold text-foreground break-all">{{ originalAvgText }}</p>
              <p class="text-xs text-muted-foreground mt-1">仅原持仓口径</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">新成本价（加权平均）</p>
              <p class="text-2xl font-bold text-primary break-all">{{ formatMoney2(stats.avgCost) }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ dilutionText }}</p>
            </div>
          </div>

          <!-- 总股数 / 总投入 -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-muted/40 border border-border rounded-lg p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">总股数</p>
              <p class="text-lg font-bold text-foreground">{{ formatInt(stats.totalShares) }}<span class="text-xs font-normal text-muted-foreground ml-1">股</span></p>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">总投入</p>
              <p class="text-lg font-bold text-foreground">{{ formatMoney2(stats.totalCost) }}<span class="text-xs font-normal text-muted-foreground ml-1">元</span></p>
            </div>
          </div>

          <!-- 仓位构成可视化：补仓占总投入比例 -->
          <div v-if="addonCost > 0" class="space-y-1.5">
            <div class="flex h-3 rounded-full overflow-hidden bg-muted border border-border" role="img" :aria-label="`原持仓占 ${origPctText}，补仓占 ${addonPctText}`">
              <div class="bg-primary/70" :style="{ width: origPctWidth }"></div>
              <div class="bg-primary/30" :style="{ width: addonPctWidth }"></div>
            </div>
            <p class="text-xs text-muted-foreground">
              仓位构成：原持仓 {{ formatMoney2(origCost) }} 元（{{ origPctText }}）｜补仓 {{ formatMoney2(addonCost) }} 元（{{ addonPctText }}）——补仓占比越高，单票敞口越大
            </p>
          </div>

          <!-- 现价浮动盈亏 -->
          <div v-if="hasCurrent" class="rounded-lg border border-border p-4">
            <div class="flex items-center justify-between gap-3 mb-1.5">
              <p class="text-sm font-medium text-foreground">现价 {{ formatMoney2(currentNum) }} 元/股下的浮动盈亏</p>
              <p class="text-lg font-bold whitespace-nowrap" :class="stats.pl >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ plText }}<span class="text-xs font-normal text-muted-foreground ml-1">元</span>
              </p>
            </div>
            <p class="text-xs text-muted-foreground">盈亏比例 =（现价 − 新成本）÷ 新成本 = {{ plPctText }}</p>
          </div>

          <!-- 直觉破除卡：跌 X% 需涨 Y% -->
          <div class="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
            <h3 class="text-sm font-semibold text-foreground">跌了要涨多少才回本？（不是跌幅的镜像）</h3>
            <p v-if="drawdownInfo" class="text-sm text-muted-foreground leading-relaxed">
              按摊薄后成本 {{ formatMoney2(stats.avgCost) }} 元计：现价较成本<span class="text-red-600 font-semibold">跌 {{ pctText(drawdownInfo.drawdown) }}</span>，
              需反弹 <span class="text-green-600 font-semibold">{{ pctText(drawdownInfo.recovery) }}</span> 才能回本——不是 {{ pctText(drawdownInfo.drawdown) }}。
              <span v-if="unaveragedInfo">若不补仓（原成本 {{ formatMoney2(unaveragedInfo.cost) }} 元），需反弹 {{ pctText(unaveragedInfo.recovery) }}；补仓摊薄的作用，就是把回本门槛从后者压到前者。</span>
            </p>
            <p v-else class="text-sm text-muted-foreground leading-relaxed">
              填入低于新成本的现价，这里会按你的持仓给出真实的回本涨幅。
            </p>
            <div class="grid grid-cols-4 gap-2">
              <div v-for="rel in recoveryRows" :key="rel.d" class="bg-background border border-border rounded-lg px-2 py-2 text-center">
                <p class="text-[10px] text-muted-foreground">跌 {{ rel.dLabel }}%</p>
                <p class="text-sm font-bold text-foreground">涨 {{ rel.rLabel }}%</p>
              </div>
            </div>
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              关系式：需涨 = 1 ÷（1 − 跌幅）− 1。跌 20% 后价格只剩 80%，0.8 × 1.25 = 1，所以是涨 25%；跌幅越大不对称越夸张。
            </p>
          </div>

          <!-- 反推卡：回到目标成本需补多少股 -->
          <div class="rounded-lg border border-border p-4 space-y-2">
            <h3 class="text-sm font-semibold text-foreground">补多少能回到目标成本？</h3>
            <p v-if="targetResult.kind === 'idle'" class="text-xs text-muted-foreground leading-relaxed">
              在左侧填入目标成本（可先填现价），这里会反推需要补入的股数。
            </p>
            <p v-else-if="targetResult.kind === 'needCurrent'" class="text-xs leading-relaxed text-amber-600 p-2 rounded bg-amber-500/10 flex items-start gap-1.5">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>反推以「现价」补入的股数，请先在左侧填入现价。</span>
            </p>
            <p v-else-if="targetResult.kind === 'needPosition'" class="text-xs text-muted-foreground leading-relaxed">
              请先填入原持仓（股数与成本价）。
            </p>
            <p v-else-if="targetResult.kind === 'reached'" class="text-xs leading-relaxed text-green-600 p-2 rounded bg-green-500/10 flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>当前持仓成本 {{ formatMoney2(stats.avgCost) }} 元/股，已不高于目标 {{ formatMoney2(targetNum) }} 元，无需补仓。</span>
            </p>
            <p v-else-if="targetResult.kind === 'impossible'" class="text-xs leading-relaxed text-amber-600 p-2 rounded bg-amber-500/10 flex items-start gap-1.5">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>目标 {{ formatMoney2(targetNum) }} 元不高于现价 {{ formatMoney2(currentNum) }} 元：以现价补入再多，加权成本也只能无限逼近现价而降不到目标之下。请调高目标成本，或等待更低的价格再补。</span>
            </p>
            <template v-else>
              <p class="text-sm text-muted-foreground leading-relaxed">
                按合计持仓 {{ formatInt(stats.totalShares) }} 股 @ {{ formatMoney2(stats.avgCost) }} 元、以现价 {{ formatMoney2(currentNum) }} 元补入：
                约需 <span class="text-primary font-bold">{{ formatInt(Math.ceil(targetResult.shares)) }}</span> 股，
                补入后新成本 ≈ {{ formatMoney2(targetResult.newAvg) }} 元/股。
              </p>
              <p class="text-[11px] text-muted-foreground leading-relaxed">
                反推公式 q = q₀ ×（c₀ − 目标成本）÷（目标成本 − 现价）。A 股实际申报按 100 股（1 手）整数倍，向上取整到手后成本会略低于目标。
              </p>
            </template>
          </div>
        </template>

        <p v-else class="text-xs text-muted-foreground p-3 rounded-lg border border-border bg-muted/60 flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
          <span>填入原持仓（股数、成本价）开始计算，或点击「载入示例」查看 1000 股 @20 元、现价 10 元补 1000 股的摊薄效果。</span>
        </p>

        <!-- 风险提示卡（固定展示） -->
        <div class="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 flex items-start gap-2">
          <ShieldAlert class="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
          <div class="text-sm space-y-1">
            <p class="font-semibold text-foreground">补仓摊薄 ≠ 降低风险</p>
            <p class="text-muted-foreground leading-relaxed">
              摊薄只改变「成本」这个数字，不改变标的本身的风险；补仓是把更多资金投入同一只标的，实质是<span class="text-foreground font-medium">加大单票敞口</span>。
              跌势未止时补仓，新资金同样承受下跌，可能<span class="text-foreground font-medium">越补越亏</span>。
              金额较大时，建议先用仓位上限约束单票最大投入，再决定是否补仓。本页为数学演算，不构成投资建议。
            </p>
          </div>
        </div>

        <!-- 免责声明（固定） -->
        <p class="text-[11px] leading-relaxed text-muted-foreground/80 border-t border-border pt-3">
          {{ DISCLAIMER }}
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
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>补仓成本摊薄计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          补仓成本摊薄计算器是一款专注「补仓数学」的在线工具。它把原持仓与一到两笔补仓按加权平均合并，
          即时给出<span class="text-foreground">新成本价、总股数与总投入</span>，并把<span class="text-foreground">回本价</span>用大数字直读——回本价就是摊薄后的成本价，
          现价升破它整体即回本。填入现价后，工具会算出浮动盈亏额与比例，并用「跌 20% 需涨 25%」的对照表破除
          「跌了多少涨回多少就回本」的直觉误差；还可以反向求解：想把成本摊到某个目标价，按现价需要补入多少股。
          全部计算在浏览器本地完成，参数暂存本机 localStorage，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">什么时候会用到？</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed mb-4">
          <li><strong class="text-foreground">被套后想补仓</strong>：先算清「补多少、成本降到多少、回本价是多少」，再决定动不动手，而不是凭感觉往下摊。</li>
          <li><strong class="text-foreground">分批建仓</strong>：分两批、三笔买入后，看综合成本与现价下的浮盈浮亏，决定下一批的价格与数量。</li>
          <li><strong class="text-foreground">给直觉纠偏</strong>：用「跌 X% 需涨 Y%」对照表看清回本涨幅的真实门槛，评估值不值得为摊薄而加仓。</li>
          <li><strong class="text-foreground">检视仓位</strong>：仓位构成条显示补仓占总投入的比例，提醒自己单票敞口有没有越摊越大。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">摊薄成本与回本价的公式</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          新成本价 =（原投入 + 补仓投入）÷ 总股数，即各批次「股数 × 成交价」的加权平均。例：1000 股 @20 元（投入 2 万），
          现价 10 元补 1000 股（投入 1 万），新成本 = 30000 ÷ 2000 = 15 元/股，回本价也是 15 元/股。
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          回本涨幅的关系式：需涨 = 1 ÷（1 − 跌幅）− 1。跌 10% 需涨 11.1%，跌 20% 需涨 25%，跌 30% 需涨 42.9%，跌 50% 需涨 100%。
          补仓不改变这个不对称性，但能把「起点」从原成本换成更低的新成本——本例中回本门槛从「现价 12 涨回 20（+66.7%）」
          压到「涨回 15（+25%）」。
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed">
          反推公式：q = q₀ ×（c₀ − 目标成本）÷（目标成本 − 现价），其中 q₀ 为现有股数、c₀ 为现有成本。
          目标成本必须落在现价与现有成本之间：目标 ≥ 现有成本时无需补仓；目标 ≤ 现价时数学上无法达成。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div v-for="(faq, index) in faqs" :key="index">
            <h3 class="text-base font-semibold text-foreground">{{ faq.q }}</h3>
            <p class="text-sm text-muted-foreground mt-1">{{ faq.a }}</p>
          </div>
        </div>

        <p class="text-xs leading-relaxed text-muted-foreground/80 border-t border-border mt-8 pt-3">
          {{ DISCLAIMER }}
        </p>
      </div>
    </div>

    <RelatedTools :currentToolId="'average-down-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  TrendingDown, Calculator, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, ShieldAlert
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const DISCLAIMER = '补仓摊薄不等于降低风险，补仓实质是加大单票敞口；本页为数学演算，不构成投资建议，股市有风险，决策需谨慎。'

// ---------- FAQ（页面 SEO 区与 JSON-LD FAQPage 共用） ----------
const faqs = [
  {
    q: '补仓后的新成本怎么算？',
    a: '按加权平均：新成本 =（原投入 + 补仓投入）÷ 总股数。例如原 1000 股 @20 元（投入 2 万），现价 10 元再补 1000 股（投入 1 万），新成本 = 30000 ÷ 2000 = 15 元/股。'
  },
  {
    q: '回本价为什么就是摊薄后的成本价？',
    a: '持仓整体盈亏 =（现价 − 成本价）× 总股数，现价等于成本价时盈亏恰好为零，所以回本价就是摊薄后的加权平均成本。本页用大数字直读回本价，不必再换算。'
  },
  {
    q: '跌 20% 为什么不是涨 20% 就能回本？',
    a: '跌 20% 后价格只剩原来的 80%，回到原价需涨 25%（0.8 × 1.25 = 1）。跌幅越大不对称越夸张：跌 30% 需涨 42.9%，跌 50% 需涨 100%。补仓把成本从 20 摊到 15，等于把回本门槛从「需涨 66.7%」压到「需涨 25%」。'
  },
  {
    q: '补多少能回到目标成本？',
    a: '反推公式 q = q₀ ×（c₀ − 目标成本）÷（目标成本 − 现价）。目标成本必须落在现价与原成本之间：目标 ≥ 原成本无需补仓，目标 ≤ 现价则数学上无法达成。例：1000 股 @20、现价 10、目标 15，需以现价补 1000 股。'
  },
  {
    q: '补仓摊薄是不是就降低了风险？',
    a: '不是。摊薄只改变成本数字，不改变标的本身的风险；补仓是把更多资金投入同一只标的，实质是加大单票敞口。跌势未止时补仓可能越补越亏，金额较大时建议先用仓位上限约束单票最大投入。本工具仅为数学演算，不构成投资建议。'
  }
]

// ---------- SEO ----------
useSeoMeta({
  title: '补仓成本摊薄计算器 - 回本价与加仓成本在线测算 | 有条工具',
  description: '免费在线补仓成本摊薄计算器：填入原持仓与补仓计划，按加权平均算出新成本价、总股数与总投入，回本价大数字直读；跌 20% 需涨 25% 对照表破除回本直觉误差，支持反推回到目标成本需补股数，纯浏览器本地运行不上传',
  keywords: '补仓成本计算,摊薄成本,回本价计算,加仓成本,补仓多少能回本',
  author: '有条工具',
  ogTitle: '补仓成本摊薄计算器 - 回本价与加仓成本在线测算 | 有条工具',
  ogDescription: '补仓后新成本、回本价、浮盈浮亏与「补多少回到目标成本」反推，先算再补。',
  ogUrl: 'https://www.util.cn/tools/average-down-calculator',
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
          name: '补仓成本摊薄计算器',
          url: 'https://www.util.cn/tools/average-down-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['补仓后新成本价（加权平均）', '回本价=摊薄成本大数字直读', '浮动盈亏额与比例', '跌 X% 需涨 Y% 对照表', '反推回到目标成本需补股数', '支持两笔补仓计划与仓位构成可视化', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '补仓成本摊薄', item: 'https://www.util.cn/tools/average-down-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: { '@type': 'Answer', text: faq.a }
          }))
        }
      ]
    })
  }]
})

/* ==== 纯函数（node 自测提取区）begin ==== */
// 约定：股数/价格/金额均为 Number；成本价为「元/股」；盈亏比例用小数（-0.2 表示 -20%）。
// 本区不依赖 Vue / 浏览器 API，可原样抽入测试。

// 输入归一化：非有限数按 0
function numOr0(v) {
  const n = Number(v)
  return isFinite(n) ? n : 0
}

// 组合持仓统计。lots = [{ qty, price }, ...]，仅计入 qty>0 且 price>0 的有效批次。
// 返回 { totalShares 总股数, totalCost 总投入, avgCost 新成本价(加权平均,空仓为 null),
//        breakeven 回本价(恒等于新成本价,空仓为 null), pl 现价下浮动盈亏额, plPct 盈亏比例(小数,空仓为 null) }
function positionStatsOf(lots, currentPrice) {
  let totalShares = 0
  let totalCost = 0
  const arr = Array.isArray(lots) ? lots : []
  for (const lot of arr) {
    const q = numOr0(lot && lot.qty)
    const c = numOr0(lot && lot.price)
    if (q > 0 && c > 0) {
      totalShares += q
      totalCost += q * c
    }
  }
  if (totalShares <= 0) {
    return { totalShares: 0, totalCost: 0, avgCost: null, breakeven: null, pl: 0, plPct: null }
  }
  const avgCost = totalCost / totalShares
  const cur = numOr0(currentPrice)
  const pl = (cur - avgCost) * totalShares
  const plPct = (cur - avgCost) / avgCost
  return { totalShares, totalCost, avgCost, breakeven: avgCost, pl, plPct }
}

// 反推：现有 q0 股 @ c0 元，以现价 p 元补入 q 股，使 (q0*c0 + q*p)/(q0+q) = target。
// 解方程得 q = q0*(c0 - target)/(target - p)。
// 目标 ≥ 原成本 → 已达标返回 0；目标 ≤ 现价 → 数学上不可达返回 null；参数非法返回 null。
function sharesForTargetCost(q0, c0, p, target) {
  const q = numOr0(q0)
  const c = numOr0(c0)
  const pr = numOr0(p)
  const t = numOr0(target)
  if (q <= 0 || c <= 0 || pr <= 0 || t <= 0) return null
  if (t >= c) return 0
  if (t <= pr) return null
  const need = (q * (c - t)) / (t - pr)
  // 向上取到 1e-6 股精度，抵消浮点误差；显示层再按整股 / 手数取整
  return Math.ceil(need * 1e6) / 1e6
}

// 回本涨幅：跌 d（小数）后需涨 1/(1-d) - 1 才能回本。d <= 0 返回 0；d >= 1（归零）返回 null。
function recoveryGainOf(drawdown) {
  const d = numOr0(drawdown)
  if (d <= 0) return 0
  if (d >= 1) return null
  return 1 / (1 - d) - 1
}

// 自测断言集（锚点 / 反推 / 多笔 / 除零 / 正收益 / 回本涨幅关系）
function runAverageDownSelfTests() {
  const t = []
  const eq = (name, got, want, tol) => {
    const e = typeof tol === 'number' ? tol : 1e-9
    const ok = (got === null || want === null || typeof got === 'boolean')
      ? got === want
      : Math.abs(got - want) <= e
    t.push({ name, got, want, pass: ok })
  }
  // 锚点：1000@20 + 1000@10 → 新成本 15.00、回本价 15.00
  const s1 = positionStatsOf([{ qty: 1000, price: 20 }, { qty: 1000, price: 10 }], 12)
  eq('锚点·总股数 2000', s1.totalShares, 2000)
  eq('锚点·总投入 30000', s1.totalCost, 30000)
  eq('锚点·新成本(加权平均) 15.00', s1.avgCost, 15)
  eq('锚点·回本价=新成本价', s1.breakeven, s1.avgCost)
  eq('锚点·现价12浮亏 -6000', s1.pl, -6000)
  eq('锚点·现价12亏幅 -20%', s1.plPct, -0.2)
  // 反推：原 1000 股@20、现价 10、目标 15 → 需补 1000 股（(1000×20+1000×10)/2000=15）
  eq('反推·1000@20现价10目标15 → 1000股', sharesForTargetCost(1000, 20, 10, 15), 1000)
  eq('反推·结果代回验证均价=目标', positionStatsOf([{ qty: 1000, price: 20 }, { qty: sharesForTargetCost(1000, 20, 10, 15), price: 10 }], 12).avgCost, 15)
  eq('反推·目标≥原成本 → 0股', sharesForTargetCost(1000, 20, 10, 20), 0)
  eq('反推·目标≤现价 → null', sharesForTargetCost(1000, 20, 10, 9), null)
  // 多笔：三批合计
  const s3 = positionStatsOf([{ qty: 1000, price: 20 }, { qty: 500, price: 12 }, { qty: 500, price: 8 }], 15)
  eq('多笔·三批总投入 30000', s3.totalCost, 30000)
  eq('多笔·三批均价 15.00', s3.avgCost, 15)
  // 除零 / 非法输入
  const s0 = positionStatsOf([], 12)
  eq('除零·空持仓均价 null', s0.avgCost, null)
  eq('除零·空持仓盈亏 0', s0.pl, 0)
  eq('除零·q0=0 反推 null', sharesForTargetCost(0, 20, 10, 15), null)
  eq('除零·NaN 成本反推 null', sharesForTargetCost(1000, NaN, 10, 15), null)
  // 现价高于成本的正收益
  const s2 = positionStatsOf([{ qty: 1000, price: 10 }], 12)
  eq('正收益·浮盈 +2000', s2.pl, 2000)
  eq('正收益·幅度 +20%', s2.plPct, 0.2)
  // 回本涨幅关系
  eq('关系·跌20%需涨25%', recoveryGainOf(0.2), 0.25)
  eq('关系·跌50%需涨100%', recoveryGainOf(0.5), 1)
  eq('关系·跌10%需涨11.11%', recoveryGainOf(0.1), 1 / 0.9 - 1)
  eq('关系·未跌需涨0', recoveryGainOf(0), 0)
  eq('关系·跌幅100% → null', recoveryGainOf(1), null)
  return t
}
/* ==== 纯函数（node 自测提取区）end ==== */

// ---------- 输入状态 ----------
// 隐私说明：持仓数据属敏感信息，仅暂存本机 localStorage，不上传；读写全程 try/catch，
// 浏览器 API 只在 onMounted 与事件回调内使用，SSR 安全。
const STORAGE_KEY = 'util-average-down-calculator'
const DEFAULTS = { qty0: 1000, cost0: 20, qty1: 0, price1: 0, addSecond: false, qty2: 0, price2: 0, current: 0, target: 0 }
const EXAMPLE = { qty0: 1000, cost0: 20, qty1: 1000, price1: 10, addSecond: false, qty2: 0, price2: 0, current: 12, target: 15 }

const qty0Input = ref(EXAMPLE.qty0)
const cost0Input = ref(EXAMPLE.cost0)
const qty1Input = ref(EXAMPLE.qty1)
const price1Input = ref(EXAMPLE.price1)
const addSecond = ref(EXAMPLE.addSecond)
const qty2Input = ref(EXAMPLE.qty2)
const price2Input = ref(EXAMPLE.price2)
const currentInput = ref(EXAMPLE.current)
const targetInput = ref(EXAMPLE.target)
const seoContentVisible = ref(true)

// ---------- 归一化 ----------
const currentNum = computed(() => Math.max(0, numOr0(currentInput.value)))
const targetNum = computed(() => Math.max(0, numOr0(targetInput.value)))
const hasCurrent = computed(() => currentNum.value > 0)

const plannedLots = computed(() => {
  const lots = [
    { qty: qty0Input.value, price: cost0Input.value },
    { qty: qty1Input.value, price: price1Input.value }
  ]
  if (addSecond.value) lots.push({ qty: qty2Input.value, price: price2Input.value })
  return lots
})

// ---------- 核心计算 ----------
const stats = computed(() => positionStatsOf(plannedLots.value, currentNum.value))
const hasPosition = computed(() => stats.value.totalShares > 0 && stats.value.avgCost !== null)

// 原持仓口径（用于摊薄前后对照）
const origQty = computed(() => Math.max(0, numOr0(qty0Input.value)))
const origCost = computed(() => Math.max(0, numOr0(qty0Input.value)) * Math.max(0, numOr0(cost0Input.value)))
const origAvg = computed(() => {
  const c = numOr0(cost0Input.value)
  return origQty.value > 0 && c > 0 ? c : null
})
const origAvgText = computed(() => (origAvg.value === null ? '—' : formatMoney2(origAvg.value)))
const addonCost = computed(() => Math.max(0, stats.value.totalCost - origCost.value))
const addonPct = computed(() => (stats.value.totalCost > 0 ? addonCost.value / stats.value.totalCost : 0))

const dilutionText = computed(() => {
  if (addonCost.value > 0 && origAvg.value === null) return '未填原持仓，无摊薄对照'
  if (origAvg.value === null || addonCost.value <= 0) return '与原成本一致（无补仓或无有效批次）'
  const delta = stats.value.avgCost - origAvg.value
  const pct = delta / origAvg.value
  return `${delta >= 0 ? '+' : '−'}${formatMoney2(Math.abs(delta))} 元（${pct >= 0 ? '+' : '−'}${(Math.abs(pct) * 100).toFixed(2)}%）`
})

// 仓位构成条
const origPct = computed(() => 1 - addonPct.value)
const origPctText = computed(() => (origPct.value * 100).toFixed(1) + '%')
const addonPctText = computed(() => (addonPct.value * 100).toFixed(1) + '%')
const origPctWidth = computed(() => Math.min(100, Math.max(0, origPct.value * 100)) + '%')
const addonPctWidth = computed(() => Math.min(100, Math.max(0, addonPct.value * 100)) + '%')

// 现价浮动盈亏
const plText = computed(() => {
  if (!hasCurrent.value || stats.value.avgCost === null) return '—'
  const sign = stats.value.pl >= 0 ? '+' : '−'
  return `${sign}${formatMoney2(Math.abs(stats.value.pl))}`
})
const plPctText = computed(() => {
  if (!hasCurrent.value || stats.value.plPct === null) return '—'
  const sign = stats.value.plPct >= 0 ? '+' : '−'
  return `${sign}${(Math.abs(stats.value.plPct) * 100).toFixed(2)}%`
})

// 回本涨幅：现价相对新成本的跌幅与所需反弹
const drawdownInfo = computed(() => {
  if (!hasCurrent.value || stats.value.avgCost === null) return null
  const avg = stats.value.avgCost
  if (currentNum.value >= avg) return null
  const d = 1 - currentNum.value / avg
  return { drawdown: d, recovery: recoveryGainOf(d) }
})
// 若不补仓（原成本口径）的对照
const unaveragedInfo = computed(() => {
  if (!hasCurrent.value || origAvg.value === null) return null
  if (currentNum.value >= origAvg.value) return null
  const d = 1 - currentNum.value / origAvg.value
  return { cost: origAvg.value, drawdown: d, recovery: recoveryGainOf(d) }
})

// 参考对照表：跌 10% / 20% / 30% / 50% 各需涨多少
const recoveryRows = computed(() => [0.1, 0.2, 0.3, 0.5].map((d) => ({
  d,
  dLabel: String(Math.round(d * 100)),
  rLabel: (recoveryGainOf(d) * 100).toFixed(1)
})))

// 反推结果
const targetResult = computed(() => {
  const t = targetNum.value
  if (t <= 0) return { kind: 'idle' }
  if (!hasCurrent.value) return { kind: 'needCurrent' }
  const q0 = stats.value.totalShares
  const c0 = stats.value.avgCost
  if (q0 <= 0 || c0 === null) return { kind: 'needPosition' }
  const shares = sharesForTargetCost(q0, c0, currentNum.value, t)
  if (shares === null) return { kind: 'impossible' }
  if (shares === 0) return { kind: 'reached' }
  const newAvg = positionStatsOf(plannedLots.value.concat([{ qty: shares, price: currentNum.value }]), currentNum.value).avgCost
  return { kind: 'ok', shares, newAvg }
})

// ---------- 格式化 ----------
function formatMoney2(v) {
  const n = Number(v)
  if (!isFinite(n)) return '—'
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatInt(v) {
  const n = Number(v)
  if (!isFinite(n)) return '—'
  return Math.round(n).toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}
function pctText(x) {
  const n = Number(x)
  if (!isFinite(n)) return '—'
  return `${(n * 100).toFixed(1)}%`
}

// ---------- 输入越界提示 ----------
const inputWarning = computed(() => {
  const checks = [
    [qty0Input.value, 0, Infinity],
    [cost0Input.value, 0, Infinity],
    [qty1Input.value, 0, Infinity],
    [price1Input.value, 0, Infinity],
    [currentInput.value, 0, Infinity],
    [targetInput.value, 0, Infinity]
  ]
  if (addSecond.value) {
    checks.push([qty2Input.value, 0, Infinity], [price2Input.value, 0, Infinity])
  }
  const bad = checks.some(([v, min, max]) => {
    if (v === '' || v === null || v === undefined) return false
    const n = Number(v)
    return !isFinite(n) || n < min || n > max
  })
  return bad ? '部分输入超出允许范围，已按 0 参与计算（股数与价格需为非负数）。' : ''
})

// ---------- 操作 ----------
function loadExample() {
  qty0Input.value = EXAMPLE.qty0
  cost0Input.value = EXAMPLE.cost0
  qty1Input.value = EXAMPLE.qty1
  price1Input.value = EXAMPLE.price1
  addSecond.value = EXAMPLE.addSecond
  qty2Input.value = EXAMPLE.qty2
  price2Input.value = EXAMPLE.price2
  currentInput.value = EXAMPLE.current
  targetInput.value = EXAMPLE.target
}

function resetAll() {
  qty0Input.value = DEFAULTS.qty0
  cost0Input.value = DEFAULTS.cost0
  qty1Input.value = DEFAULTS.qty1
  price1Input.value = DEFAULTS.price1
  addSecond.value = DEFAULTS.addSecond
  qty2Input.value = DEFAULTS.qty2
  price2Input.value = DEFAULTS.price2
  currentInput.value = DEFAULTS.current
  targetInput.value = DEFAULTS.target
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 本机持久化（SSR 安全，try/catch） ----------
function saveState() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      qty0: qty0Input.value,
      cost0: cost0Input.value,
      qty1: qty1Input.value,
      price1: price1Input.value,
      addSecond: addSecond.value,
      qty2: qty2Input.value,
      price2: price2Input.value,
      current: currentInput.value,
      target: targetInput.value
    }))
  } catch (e) { /* 隐私模式 / 配额溢出，忽略 */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const s = JSON.parse(raw)
    if (!s || typeof s !== 'object') return
    if (typeof s.qty0 === 'number') qty0Input.value = s.qty0
    if (typeof s.cost0 === 'number') cost0Input.value = s.cost0
    if (typeof s.qty1 === 'number') qty1Input.value = s.qty1
    if (typeof s.price1 === 'number') price1Input.value = s.price1
    if (typeof s.addSecond === 'boolean') addSecond.value = s.addSecond
    if (typeof s.qty2 === 'number') qty2Input.value = s.qty2
    if (typeof s.price2 === 'number') price2Input.value = s.price2
    if (typeof s.current === 'number') currentInput.value = s.current
    if (typeof s.target === 'number') targetInput.value = s.target
  } catch (e) { /* 解析失败，保持默认 */ }
}

watch(
  [qty0Input, cost0Input, qty1Input, price1Input, addSecond, qty2Input, price2Input, currentInput, targetInput],
  () => saveState()
)

onMounted(() => {
  loadState()
  addRecentTool('average-down-calculator')
  // 纯函数自测（锚点 / 反推 / 多笔 / 除零 / 正收益 / 关系），仅控制台输出
  const results = runAverageDownSelfTests()
  const failed = results.filter((r) => !r.pass)
  if (failed.length > 0) {
    console.warn(`[average-down-calculator] 自测 ${failed.length}/${results.length} 条未通过`, failed)
  } else {
    console.info(`[average-down-calculator] 自测通过 ${results.length}/${results.length} 条断言`)
  }
})
</script>
