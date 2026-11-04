<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Banknote class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">复利计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">复利公式、72 法则、名义与实际年化（APY）、定期追加与通胀购买力折现，把「利滚利」算清楚</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线复利计算器：本金按复利频率（年 / 半年 / 季 / 月 / 日）滚存，即时给出期末总额、投入累计与收益；支持定期追加（期初 / 期末、按月或按年）、
        名义年化与实际年化 APY 对照、72 法则翻倍时间，并按年通胀率折算实际购买力。核心算法全部为可独立单测的纯函数，
        计算在浏览器本地完成，参数暂存本机，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Banknote class="w-5 h-5 mr-2 text-primary" /> 复利参数
        </h2>

        <!-- 本金 -->
        <div>
          <label for="ci-principal" class="block text-sm font-medium text-foreground mb-2">本金（元）</label>
          <input
            id="ci-principal"
            v-model.number="principalInput"
            type="number"
            min="0"
            step="1000"
            placeholder="如 100000"
            class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">一次性投入的起始金额，≥ 0</p>
        </div>

        <!-- 名义年利率 -->
        <div>
          <label for="ci-rate" class="block text-sm font-medium text-foreground mb-2">名义年利率（%）</label>
          <input
            id="ci-rate"
            v-model.number="rateInput"
            type="number"
            min="-10"
            max="30"
            step="0.1"
            placeholder="如 6"
            class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>报价口径的年化收益率，范围 -10 ~ 30；实际到手看下方 APY</span>
          </p>
        </div>

        <!-- 复利频率 -->
        <div>
          <label for="ci-freq" class="block text-sm font-medium text-foreground mb-2">复利频率</label>
          <select
            id="ci-freq"
            v-model.number="compoundFreq"
            class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option :value="1">每年（n=1）</option>
            <option :value="2">每半年（n=2）</option>
            <option :value="4">每季度（n=4）</option>
            <option :value="12">每月（n=12）</option>
            <option :value="365">每日（n=365）</option>
          </select>
          <p class="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>一年计息几次，决定实际年化 APY =（1 + r/n）^n − 1</span>
          </p>
        </div>

        <!-- 投资年限 -->
        <div>
          <label for="ci-years" class="block text-sm font-medium text-foreground mb-2">投资年限（年）</label>
          <input
            id="ci-years"
            v-model.number="yearsInput"
            type="number"
            min="1"
            max="80"
            step="1"
            placeholder="如 10"
            class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">滚存年数，范围 1 ~ 80</p>
        </div>

        <!-- 定期追加 -->
        <div class="space-y-3 pt-1 border-t border-border">
          <p class="text-sm font-medium text-foreground">定期追加（选填）</p>
          <div>
            <label for="ci-pmt" class="block text-xs text-muted-foreground mb-1.5">每次追加金额（元）</label>
            <input
              id="ci-pmt"
              v-model.number="pmtInput"
              type="number"
              min="0"
              step="500"
              placeholder="如 2000"
              class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label for="ci-contrib-freq" class="block text-xs text-muted-foreground mb-1.5">追加频率</label>
            <select
              id="ci-contrib-freq"
              v-model="contribFreq"
              class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="month">每月追加</option>
              <option value="year">每年追加</option>
            </select>
          </div>
          <div>
            <span class="block text-xs text-muted-foreground mb-1.5">存入时点</span>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm cursor-pointer transition" :class="timing === 'end' ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-foreground hover:bg-muted/50'">
                <input v-model="timing" type="radio" value="end" class="accent-[hsl(var(--primary))]" /> 期末
              </label>
              <label class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm cursor-pointer transition" :class="timing === 'begin' ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-foreground hover:bg-muted/50'">
                <input v-model="timing" type="radio" value="begin" class="accent-[hsl(var(--primary))]" /> 期初
              </label>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>{{ contribNote }}</span>
          </p>
        </div>

        <!-- 年通胀率 -->
        <div>
          <label for="ci-inflation" class="block text-sm font-medium text-foreground mb-2">年通胀率（%，选填）</label>
          <input
            id="ci-inflation"
            v-model.number="inflationInput"
            type="number"
            min="0"
            max="10"
            step="0.1"
            placeholder="如 2"
            class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">填 0 或留空则不折算；范围 0 ~ 10</p>
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

      <!-- 右侧：结果（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 复利测算结果
        </h2>

        <!-- 结论卡一：期末总额（特大） -->
        <div class="bg-primary/10 rounded-lg p-5 text-center">
          <p class="text-xs text-muted-foreground mb-1">期末总额</p>
          <p class="text-4xl sm:text-5xl font-bold text-primary leading-tight break-all">
            {{ formatMoney(totalFv) }}<span class="text-base font-normal text-muted-foreground ml-1.5">元</span>
          </p>
          <p class="text-xs text-muted-foreground mt-2">{{ totalFvSub }}</p>
        </div>

        <!-- 结论卡二 / 三：投入累计、收益（双色） -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-muted/50 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">投入累计</p>
            <p class="text-2xl font-bold text-foreground break-all">{{ formatMoney(contributed) }}<span class="text-xs font-normal text-muted-foreground ml-0.5">元</span></p>
            <p class="text-xs text-muted-foreground mt-1">本金 + 全部追加</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">收益（复利所得）</p>
            <p class="text-2xl font-bold break-all" :class="gainNum >= 0 ? 'text-green-600' : 'text-red-600'">{{ formatMoney(gainNum) }}<span class="text-xs font-normal text-muted-foreground ml-0.5">元</span></p>
            <p class="text-xs text-muted-foreground mt-1">总额 − 投入累计</p>
          </div>
        </div>

        <!-- 实际购买力行（填通胀时） -->
        <div v-if="showRealValue" class="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 flex items-start gap-2">
          <TrendingUp class="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
          <div class="text-sm">
            <p class="text-foreground">
              按 {{ formatPct(inflationPct, 1) }}% 年通胀折算，{{ yearsNum }} 年后这笔钱的<span class="font-semibold">实际购买力≈ {{ formatMoney(realTotal) }} 元</span>
              <span class="text-muted-foreground">（相当于今天的钱），折损约 {{ formatMoney(lossToToday) }} 元</span>
            </p>
            <p class="text-xs text-muted-foreground mt-1">实际购买力 = 期末总额 ÷（1 + 通胀率）^年数</p>
          </div>
        </div>

        <!-- 状态提示条 -->
        <p class="text-xs leading-relaxed p-3 rounded-lg border flex items-start gap-1.5" :class="statusView.cls">
          <component :is="statusView.icon" class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{{ statusView.text }}</span>
        </p>

        <!-- 按年增长表 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-foreground">按年增长（最多 20 行）</h3>
            <span class="text-xs text-muted-foreground">单位：元</span>
          </div>
          <div v-if="hasInput" class="overflow-x-auto rounded-lg border border-border">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-muted/50 text-muted-foreground">
                  <th class="px-3 py-2 text-right font-medium">年份</th>
                  <th class="px-3 py-2 text-right font-medium">投入累计</th>
                  <th class="px-3 py-2 text-right font-medium">期末总额</th>
                  <th class="px-3 py-2 text-right font-medium">收益</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="row in growthRows" :key="row.year" :class="row.year === yearsNum ? 'bg-primary/5' : ''">
                  <td class="px-3 py-2 text-right text-muted-foreground whitespace-nowrap">第 {{ row.year }} 年</td>
                  <td class="px-3 py-2 text-right font-mono text-foreground">{{ formatMoney(row.contributed) }}</td>
                  <td class="px-3 py-2 text-right font-mono text-foreground font-semibold">{{ formatMoney(row.total) }}</td>
                  <td class="px-3 py-2 text-right font-mono whitespace-nowrap" :class="row.gain >= 0 ? 'text-green-600' : 'text-red-600'">{{ formatMoney(row.gain) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-xs text-muted-foreground p-3 rounded-lg border border-border bg-muted/60 flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>填入本金或定期追加，或点击「载入示例」查看逐年滚存明细。</span>
          </p>
        </div>

        <!-- 72 法则对照卡 -->
        <div>
          <h3 class="text-sm font-semibold text-foreground mb-2">翻倍时间：精确 vs 72 法则</h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-muted/40 border border-border rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">精确翻倍（对数）</p>
              <p class="text-2xl font-bold text-foreground">{{ exactDoubleText }}<span v-if="exactDoubleNum !== null" class="text-xs font-normal text-muted-foreground ml-0.5">年</span></p>
              <p class="text-[10px] text-muted-foreground mt-1">ln2 ÷（n·ln(1+r/n)）</p>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">72 法则估算</p>
              <p class="text-2xl font-bold text-primary">{{ rule72Text }}<span v-if="rule72Num !== null" class="text-xs font-normal text-muted-foreground ml-0.5">年</span></p>
              <p class="text-[10px] text-muted-foreground mt-1">72 ÷ {{ formatPct(ratePct, 1) }}（名义年利率百分数）</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-2">
            {{ doubleHint }}
          </p>
        </div>

        <!-- APY 对照小表 -->
        <div>
          <h3 class="text-sm font-semibold text-foreground mb-2">名义 vs 实际年化 APY（同为 {{ formatPct(ratePct, 1) }}% 名义利率）</h3>
          <div class="overflow-x-auto rounded-lg border border-border">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-muted/50 text-muted-foreground">
                  <th class="px-3 py-2 text-left font-medium">复利频率</th>
                  <th class="px-3 py-2 text-right font-medium">实际年化 APY</th>
                  <th class="px-3 py-2 text-right font-medium">比年复利多</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="row in apyRows" :key="row.label" :class="row.active ? 'bg-primary/5' : ''">
                  <td class="px-3 py-2 text-foreground" :class="row.active ? 'font-semibold text-primary' : ''">{{ row.label }}{{ row.active ? ' · 当前' : '' }}</td>
                  <td class="px-3 py-2 text-right font-mono text-foreground">{{ row.apyText }}</td>
                  <td class="px-3 py-2 text-right font-mono" :class="row.diffNum > 0 ? 'text-green-600' : 'text-muted-foreground'">{{ row.diffText }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 利率敏感度行 -->
        <div>
          <h3 class="text-sm font-semibold text-foreground mb-2">利率敏感度：名义年利率 ±1 个百分点对期末总额的影响</h3>
          <div class="space-y-2">
            <div v-for="band in sensRows" :key="band.key" class="grid grid-cols-3 gap-2 items-center rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
              <span class="text-muted-foreground">{{ band.label }}</span>
              <span class="text-right font-mono text-foreground">{{ formatMoney(band.total) }}</span>
              <span class="text-right font-mono" :class="band.cls">{{ band.deltaText }}</span>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-2">
            其余参数不变，仅把名义年利率上下各移动 1 个百分点；区间越长，±1% 的差距被复利放大得越明显。
          </p>
        </div>

        <!-- 免责声明（固定） -->
        <p class="text-[11px] leading-relaxed text-muted-foreground/80 border-t border-border pt-3">
          {{ DISCLAIMER }}
        </p>
      </div>
    </div>

    <!-- SEO 内容区 -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>复利计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          复利计算器是一款专注「复利数学本身」的在线工具。它把本金按复利频率（年 / 半年 / 季 / 月 / 日）逐年滚存，
          用 FV = P ×（1 + r/n）^(nt) 计算期末总额，再叠加定期追加形成的年金终值；同时给出名义年化与实际年化（APY）对照、
          72 法则翻倍时间、按年增长明细，以及按年通胀率折算后的实际购买力。与站内「理财收益计算器」侧重产品对比不同，
          本工具侧重复利公式的每一个变量意味着什么。全部计算在浏览器本地完成，参数暂存本机 localStorage，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">复利公式怎么读？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          FV = P ×（1 + r/n）^(nt) 里只有四个字母：<strong class="text-foreground">P</strong> 是本金，<strong class="text-foreground">r</strong> 是名义年利率（小数），
          <strong class="text-foreground">n</strong> 是一年计息几次，<strong class="text-foreground">t</strong> 是年数。
          每过一期，账户乘以（1 + r/n）——上一期赚到的利息在下一期继续生息，这就是「利滚利」。
          指数 nt 是总期数：10 年按月复利就是 120 期。把「利息也计息」这件事交给指数函数，时间越长，曲线翘得越陡。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">72 法则怎么用？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          72 法则是一条口算捷径：翻倍年数 ≈ 72 ÷ 名义年利率百分数。6% 年化，翻倍约 72 ÷ 6 = 12 年；
          精确值是 ln2 ÷ ln(1.06) ≈ 11.9 年，误差不到 1%。它的价值不在精确，而在「一秒判断划不划算」：
          收益从 3% 提到 6%，翻倍时间直接从 24 年砍到 12 年——利率翻倍，等待时间就减半。
          本金不大或利率偏高时误差会变大，页面把「精确」与「72 法则」两行并排，便于你随时校准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">单利和复利差多少？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          以 10 万本金、6% 年化、10 年为例：单利只按本金计息，到期 10 万 ×（1 + 6%×10）= 16 万；
          复利按年滚存，到期 10 万 ×（1.06）^10 ≈ 17.91 万，多出约 1.91 万。年限越长差距越夸张——
          同样条件放到 30 年，单利约 28 万、复利约 57.4 万，几乎差出一倍。单利是「本金在赚钱」，复利是「赚到的钱也在赚钱」。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">复利频率重要吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          同样名义 6%，一年只滚一次（年复利）实际年化就是 6.00%；每月滚存（月复利）APY ≈ 6.1678%；每日滚存 APY ≈ 6.1831%。
          看起来只差零点几个百分点，但复利会把它放大：10 万、10 年下，年复利约 17.91 万，月复利约 18.19 万，多约 2,855 元。
          频率越高、越接近连续复利，APY 越接近 e^r − 1（6% 时约 6.1837%）的上限。所以看清「名义」与「实际」是两个数，
          比价时永远问 APY。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">通胀为什么必须算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          复利算的是「数字变大」，通胀决定「能买的东西有没有跟着变大」。6% 名义收益跑赢 2% 通胀，真实购买力年增长其实只有约 4%。
          本工具用实际购买力 = 期末总额 ÷（1 + 通胀率）^年数 折算：10 万 / 6% / 10 年复利出约 17.91 万，按 2% 通胀折回今天约 14.69 万，
          名义上多了 7.9 万，实际购买力只多了约 4.7 万。填上年通胀率，才看得到「到手」的真实增量。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">和「理财收益计算器」怎么分工？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          站内已有 <RouterLink to="/tools/investment-calculator" class="text-primary hover:underline">理财收益计算器</RouterLink>，
          它做的是「多款产品收益对比 + 风险/组合」的横向决策。本复利计算器与之互补：聚焦复利公式本身与它的每个变量——
          复利频率如何抬升 APY、定期追加的期初 / 期末差、72 法则翻倍时间、通胀对购买力的侵蚀。
          想「理解并演算一笔钱如何滚存」用本工具，想「在几个产品间挑一个」用理财计算器。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">复利公式怎么读？</h3>
            <p class="text-sm text-muted-foreground mt-1">FV = P ×（1 + r/n）^(nt)：P 本金、r 名义年利率、n 每年计息次数、t 年数。每期把余额乘以（1 + r/n），上一期的利息在下一期继续生息，指数 nt 是总期数。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">72 法则怎么用？</h3>
            <p class="text-sm text-muted-foreground mt-1">翻倍年数 ≈ 72 ÷ 名义年利率百分数，如 6% 时约 12 年（精确 ln2/ln1.06≈11.9 年）。用于口算判断收益划不划算：利率翻倍，翻倍等待时间减半。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">单利和复利差多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">10 万 / 6% / 10 年：单利 16 万，复利约 17.91 万，多约 1.91 万；放到 30 年，单利约 28 万、复利约 57.4 万，年限越长差距越大。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">复利频率重要吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">重要。同名义 6%，年复利 APY 6.00%、月复利 6.1678%、日复利 6.1831%；10 万 / 10 年下月复利比年复利多约 2,855 元。频率越高越接近 e^r−1 上限，比价请看 APY。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">通胀为什么必须算？</h3>
            <p class="text-sm text-muted-foreground mt-1">名义数字变大不等于购买力变大。实际购买力 = 期末总额 ÷（1+通胀率）^年数；6% 名义 / 2% 通胀，真实增长仅约 4%。填通胀才能看到到手的真实增量。</p>
          </div>
        </div>

        <p class="text-xs leading-relaxed text-muted-foreground/80 border-t border-border mt-8 pt-3">
          {{ DISCLAIMER }}
        </p>
      </div>
    </div>

    <RelatedTools :currentToolId="'compound-interest-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Banknote, Calculator, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, TrendingUp
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const DISCLAIMER = '收益率假设为名义年化，市场有波动，历史收益不代表未来；结果为数学演算，不构成投资建议。'

// ---------- SEO ----------
useSeoMeta({
  title: '复利计算器 - 72 法则 / 名义与实际年化 APY / 通胀购买力在线测算',
  description: '免费在线复利计算器：本金按年/半年/季/月/日复利滚存，即时算出期末总额、投入累计与收益，支持定期追加（期初/期末、按月按年）、名义与实际年化 APY 对照、72 法则翻倍时间与年通胀实际购买力折现，纯浏览器本地运行不上传',
  keywords: '复利计算器,72 法则,复利公式,年金终值,复利翻倍时间',
  author: '有条工具',
  ogTitle: '复利计算器 - 72 法则 / 名义与实际年化 APY / 通胀购买力 | 有条工具',
  ogDescription: '复利公式、APY 对照、72 法则翻倍时间、定期追加与通胀购买力折现，把利滚利算清楚。',
  ogUrl: 'https://www.util.cn/tools/compound-interest-calculator',
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
          name: '复利计算器',
          url: 'https://www.util.cn/tools/compound-interest-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['复利公式 FV=P(1+r/n)^nt 测算', '名义 vs 实际年化 APY 对照', '72 法则翻倍时间', '定期追加年金终值（期初/期末）', '按年增长明细表', '通胀实际购买力折现', '利率 ±1% 敏感度', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '复利计算器', item: 'https://www.util.cn/tools/compound-interest-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: '复利公式怎么读？', acceptedAnswer: { '@type': 'Answer', text: 'FV = P ×（1 + r/n）^(nt)：P 本金、r 名义年利率、n 每年计息次数、t 年数。每期把余额乘以（1 + r/n），上一期的利息在下一期继续生息，指数 nt 是总期数。' } },
            { '@type': 'Question', name: '72 法则怎么用？', acceptedAnswer: { '@type': 'Answer', text: '翻倍年数约等于 72 除以名义年利率百分数，如 6% 时约 12 年（精确 ln2/ln1.06 约 11.9 年）。用于口算判断收益划不划算：利率翻倍，翻倍等待时间减半。' } },
            { '@type': 'Question', name: '单利和复利差多少？', acceptedAnswer: { '@type': 'Answer', text: '10 万本金、6% 年化、10 年：单利 16 万，复利约 17.91 万，多约 1.91 万；放到 30 年单利约 28 万、复利约 57.4 万，年限越长差距越大。' } },
            { '@type': 'Question', name: '复利频率重要吗？', acceptedAnswer: { '@type': 'Answer', text: '重要。同名义 6%，年复利 APY 6.00%、月复利 6.1678%、日复利 6.1831%；10 万 10 年下月复利比年复利多约 2,855 元。频率越高越接近 e^r−1 上限，比价请看 APY。' } },
            { '@type': 'Question', name: '通胀为什么必须算？', acceptedAnswer: { '@type': 'Answer', text: '名义数字变大不等于购买力变大。实际购买力 = 期末总额 ÷（1+通胀率）^年数；6% 名义、2% 通胀真实增长仅约 4%。填通胀才能看到到手的真实增量。' } }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 约定：名义年利率 r 一律用「小数」（0.06 表示 6%）；n 为每年复利期数；
// 金额单位为元；唯 ruleOf72Of 依经验法则惯例接收「百分数」（如 6 表示 6%）。
// 本区不依赖 Vue / 浏览器 API，可原样抽入测试。

// 输入归一化：非有限数按 0
function numOr0(v) {
  const n = Number(v)
  return isFinite(n) ? n : 0
}
// 输入归一化：非有限数按下限，其余夹紧到 [min, max]
function clampNum(v, min, max) {
  const n = Number(v)
  if (!isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

// 实际年化 APY =（1 + r/n）^n − 1。名义 r 相同、n 越大 → APY 越高（利滚利次数更多）。
function apyOf(r, n) {
  if (!isFinite(r) || !isFinite(n) || n <= 0) return 0
  return Math.pow(1 + r / n, n) - 1
}

// 单笔本金终值 FV = P ×（1 + r/n）^(nt)。r 为小数名义利率、n 每年复利期数、t 年数。
function fvLumpOf(P, r, t, n) {
  const p = numOr0(P)
  if (!isFinite(r) || !isFinite(t) || t < 0 || !isFinite(n) || n <= 0) return p
  return p * Math.pow(1 + r / n, n * t)
}

// 年金终值（定期追加）。普通年金（期末）推导：
//   每期期末存入 PMT、共 nt 期、每期利率 i。第 1 笔到终点增值 (1+i)^(nt−1)，
//   最后一笔不增值 (1+i)^0，等比数列求和：
//   FV_end = PMT × [（1+i）^nt − 1] / i   （i≠0）
// 先付年金（期初）：每笔多生一期利息 → FV_begin = FV_end ×（1+i）。
// i→0 时为等差累积，取极限 FV = PMT × nt。
function fvAnnuityOf(PMT, i, nt, timing) {
  const pmt = numOr0(PMT)
  const periods = Math.max(0, Math.round(numOr0(nt)))
  if (periods === 0) return 0
  const rate = isFinite(i) ? i : 0
  let fv
  if (Math.abs(rate) < 1e-12) {
    fv = pmt * periods
  } else {
    fv = pmt * (Math.pow(1 + rate, periods) - 1) / rate
  }
  if (timing === 'begin') fv = fv * (1 + rate)
  return fv
}

// 追加频率 → 每年期数（决定年金网格的期利率与总期数）。
function periodsPerYearOf(contribFreq) {
  return contribFreq === 'month' ? 12 : 1
}

// 期末总额 = 本金复利终值 + 定期追加年金终值。
// 追加网格：freq=月 → 期利率 r/12、总期数 t×12；freq=年 → 期利率 r/1、总期数 t。
function totalFvOf(P, r, t, n, PMT, contribFreq, timing) {
  const na = periodsPerYearOf(contribFreq)
  const rate = isFinite(r) ? r : 0
  const i = rate / na
  const nt = Math.max(0, Math.round(numOr0(t) * na))
  return fvLumpOf(P, r, t, n) + fvAnnuityOf(PMT, i, nt, timing)
}

// 投入累计 = 本金 + 每次追加金额 × 追加总期数。
function contributedOf(P, PMT, contribFreq, t) {
  const na = periodsPerYearOf(contribFreq)
  const nt = Math.max(0, Math.round(numOr0(t) * na))
  return numOr0(P) + numOr0(PMT) * nt
}

// 精确翻倍时间（以「年」计）：令 P(1+r/n)^(nT)=2P → T = ln2 /（n·ln(1+r/n)）。
// n=1 时化简为 ln2/ln(1+r)（即规格所写 ln2/ln(1+r/n) 的年计特例，r=6% 得 11.896）。
// r≤0 或参数无效时无法翻倍，返回 null。
function doubleYearsExactOf(r, n) {
  if (!isFinite(r) || !isFinite(n) || n <= 0 || r <= 0) return null
  const base = 1 + r / n
  if (base <= 0) return null
  return Math.round((Math.LN2 / (n * Math.log(base))) * 1000) / 1000
}

// 72 法则（经验估算翻倍年数）：72 / r，r 用百分数（6 表示 6%）。r≤0 返回 null。
function ruleOf72Of(r) {
  const p = Number(r)
  if (!isFinite(p) || p <= 0) return null
  return Math.round((72 / p) * 1000) / 1000
}

// 实际购买力（剔除通胀）：fv ÷（1 + inflation）^t，inflation 用小数（0.02 表示 2%）。
function realValueOf(fv, inflation, t) {
  const f = numOr0(fv)
  const inf = isFinite(inflation) ? inflation : 0
  const yrs = Math.max(0, numOr0(t))
  return f / Math.pow(1 + inf, yrs)
}

// 逐年增长序列：第 k 年年末 = 本金复利到第 k 年 + 追加年金滚存到第 k 年。
// 表格与总额共用同一口径，保证末行与结论卡一致。
function growthSeries(P, r, t, n, PMT, contribFreq, timing) {
  const na = periodsPerYearOf(contribFreq)
  const i = (isFinite(r) ? r : 0) / na
  const years = Math.max(0, Math.round(numOr0(t)))
  const raw = []
  for (let k = 1; k <= years; k++) {
    const total = fvLumpOf(P, r, k, n) + fvAnnuityOf(PMT, i, k * na, timing)
    const contributed = numOr0(P) + numOr0(PMT) * k * na
    raw.push({ year: k, contributed, total, gain: total - contributed })
  }
  return raw
}

// 把逐年序列均匀抽样到最多 maxRows 行（含首尾），避免长年限表格爆行。
function sampleRows(rows, maxRows = 20) {
  const n = rows.length
  if (n <= maxRows) return rows
  const picked = []
  for (let i = 0; i < maxRows; i++) {
    picked.push(rows[Math.round((i * (n - 1)) / (maxRows - 1))])
  }
  const uniq = new Map(picked.map((r) => [r.year, r]))
  return [...uniq.values()].sort((a, b) => a.year - b.year)
}

// 金额格式化：千分位、最多 0 位小数（元）
function formatMoney(v) {
  const n = Number(v)
  if (!isFinite(n)) return '—'
  return Math.round(n).toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}
// 百分数格式化（输入已是百分数数值，如 6.1678）
function formatPct(v, digits = 2) {
  const n = Number(v)
  if (!isFinite(n)) return '—'
  return n.toFixed(digits)
}

// ---------- 输入状态 ----------
// 隐私说明：金额属敏感信息，仅暂存本机 localStorage，不上传；读写全程 try/catch，
// 浏览器 API 只在 onMounted 与事件回调内使用，SSR 安全。
const STORAGE_KEY = 'util-compound-interest-calculator'
const DEFAULTS = { principal: 0, rate: 5, compoundFreq: 12, years: 10, pmt: 0, timing: 'end', contribFreq: 'month', inflation: 0 }
const EXAMPLE = { principal: 100000, rate: 6, compoundFreq: 12, years: 10, pmt: 2000, timing: 'end', contribFreq: 'month', inflation: 2 }

const principalInput = ref(EXAMPLE.principal)
const rateInput = ref(EXAMPLE.rate)
const compoundFreq = ref(EXAMPLE.compoundFreq)
const yearsInput = ref(EXAMPLE.years)
const pmtInput = ref(EXAMPLE.pmt)
const timing = ref(EXAMPLE.timing)
const contribFreq = ref(EXAMPLE.contribFreq)
const inflationInput = ref(EXAMPLE.inflation)
const seoContentVisible = ref(true)

// ---------- 归一化 ----------
const principalNum = computed(() => Math.max(0, numOr0(principalInput.value)))
const ratePct = computed(() => clampNum(rateInput.value, -10, 30))       // 百分数
const rDec = computed(() => ratePct.value / 100)                          // 小数名义利率
const nPeriods = computed(() => {
  const v = Number(compoundFreq.value)
  return [1, 2, 4, 12, 365].includes(v) ? v : 1
})
const yearsNum = computed(() => Math.round(clampNum(yearsInput.value, 1, 80)))
const pmtNum = computed(() => Math.max(0, numOr0(pmtInput.value)))
const inflationPct = computed(() => clampNum(inflationInput.value, 0, 10))
const hasInput = computed(() => principalNum.value > 0 || pmtNum.value > 0)
const showRealValue = computed(() => inflationPct.value > 0)

// ---------- 核心计算 ----------
const apy = computed(() => apyOf(rDec.value, nPeriods.value))            // 小数
const contributed = computed(() => contributedOf(principalNum.value, pmtNum.value, contribFreq.value, yearsNum.value))
const totalFv = computed(() => totalFvOf(principalNum.value, rDec.value, yearsNum.value, nPeriods.value, pmtNum.value, contribFreq.value, timing.value))
const gainNum = computed(() => totalFv.value - contributed.value)
const realTotal = computed(() => realValueOf(totalFv.value, inflationPct.value / 100, yearsNum.value))
const lossToToday = computed(() => Math.max(0, totalFv.value - realTotal.value))

const totalFvSub = computed(() => {
  const apyPct = formatPct(apy.value * 100, 4)
  return `实际年化 APY ${apyPct}% · ${yearsNum.value} 年 · ${timing.value === 'begin' ? '期初' : '期末'}追加${pmtNum.value > 0 ? `（${contribFreq.value === 'month' ? '按月' : '按年'}）` : '（无追加）'}`
})

const contribNote = computed(() => {
  if (contribFreq.value === 'month') {
    return '按月追加口径：以名义年利率 ÷12 为月期利率，逐月末（期末）或月初（期初）存入，共 年数×12 期。'
  }
  return '按年追加口径：以名义年利率为年期利率，每年年末（期末）或年初（期初）存入，共 年数 期。'
})

// 72 法则对照
const exactDoubleNum = computed(() => doubleYearsExactOf(rDec.value, nPeriods.value))
const rule72Num = computed(() => ruleOf72Of(ratePct.value))
const exactDoubleText = computed(() => (exactDoubleNum.value === null ? '—' : exactDoubleNum.value))
const rule72Text = computed(() => (rule72Num.value === null ? '—' : rule72Num.value))
const doubleHint = computed(() => {
  if (exactDoubleNum.value === null && rule72Num.value === null) {
    return '名义年利率需为正数才能估算翻倍时间。'
  }
  if (exactDoubleNum.value === null) {
    return '利率为负无法翻倍：（1+r）每年都在缩小。'
  }
  if (rule72Num.value === null) {
    return '72 法则要求正利率，当前无法估算。'
  }
  const diff = Math.abs(exactDoubleNum.value - rule72Num.value)
  return `两者相差约 ${diff.toFixed(1)} 年；72 法则在 6%~10% 区间最准，利率越低其低估越明显。`
})

// APY 对照表（年 / 月 / 日 三档）
const apyRows = computed(() => {
  const annual = apyOf(rDec.value, 1) * 100
  return [
    { n: 1, label: '年复利' },
    { n: 12, label: '月复利' },
    { n: 365, label: '日复利' }
  ].map((row) => {
    const val = apyOf(rDec.value, row.n) * 100
    const diff = val - annual
    return {
      label: row.label,
      active: row.n === nPeriods.value,
      apyText: `${val.toFixed(4)}%`,
      diffNum: diff,
      diffText: diff <= 0 ? '基准' : `+${diff.toFixed(4)} 个百分点`
    }
  })
})

// 利率 ±1% 敏感度
const sensRows = computed(() => {
  const build = (key, label, deltaPct) => {
    const r = (clampNum(ratePct.value + deltaPct, -10, 30)) / 100
    const total = totalFvOf(principalNum.value, r, yearsNum.value, nPeriods.value, pmtNum.value, contribFreq.value, timing.value)
    const delta = total - totalFv.value
    return {
      key,
      label,
      total,
      deltaText: deltaPct === 0 ? '当前' : `${delta >= 0 ? '+' : '−'}${formatMoney(Math.abs(delta))}`,
      cls: deltaPct === 0 ? 'text-muted-foreground' : delta >= 0 ? 'text-green-600' : 'text-red-600'
    }
  }
  return [build('up', `${formatPct(ratePct.value, 1)}% +1 → ${formatPct(ratePct.value + 1, 1)}%`, 1), build('base', `${formatPct(ratePct.value, 1)}%（当前）`, 0), build('down', `${formatPct(ratePct.value, 1)}% −1 → ${formatPct(ratePct.value - 1, 1)}%`, -1)]
})

// 增长表行
const growthRows = computed(() => {
  const raw = growthSeries(principalNum.value, rDec.value, yearsNum.value, nPeriods.value, pmtNum.value, contribFreq.value, timing.value)
  return sampleRows(raw, 20)
})

// 状态提示
const statusView = computed(() => {
  if (!hasInput.value) {
    return { icon: Info, cls: 'border-border bg-muted/60 text-muted-foreground', text: '填入本金或定期追加，或点击「载入示例」查看复利滚存效果。' }
  }
  if (rDec.value <= 0) {
    return { icon: TriangleAlert, cls: 'border-amber-500/20 bg-amber-500/10 text-amber-600', text: '名义年利率为零或负：复利不再增长，期末总额≈投入累计，翻倍时间无解。' }
  }
  return { icon: CheckCircle, cls: 'border-green-500/20 bg-green-500/10 text-green-600', text: `复利生效：${yearsNum.value} 年后收益约 ${formatMoney(gainNum.value)} 元，实际年化 APY ${formatPct(apy.value * 100, 4)}%。` }
})

// 输入越界提示
const inputWarning = computed(() => {
  const checks = [
    [principalInput.value, 0, Infinity],
    [rateInput.value, -10, 30],
    [yearsInput.value, 1, 80],
    [pmtInput.value, 0, Infinity],
    [inflationInput.value, 0, 10]
  ]
  const bad = checks.some(([v, min, max]) => {
    if (v === '' || v === null || v === undefined) return false
    const n = Number(v)
    return !isFinite(n) || n < min || n > max
  })
  return bad ? '部分输入超出允许范围，已自动夹紧到有效区间参与计算。' : ''
})

// ---------- 操作 ----------
function loadExample() {
  principalInput.value = EXAMPLE.principal
  rateInput.value = EXAMPLE.rate
  compoundFreq.value = EXAMPLE.compoundFreq
  yearsInput.value = EXAMPLE.years
  pmtInput.value = EXAMPLE.pmt
  timing.value = EXAMPLE.timing
  contribFreq.value = EXAMPLE.contribFreq
  inflationInput.value = EXAMPLE.inflation
}

function resetAll() {
  principalInput.value = DEFAULTS.principal
  rateInput.value = DEFAULTS.rate
  compoundFreq.value = DEFAULTS.compoundFreq
  yearsInput.value = DEFAULTS.years
  pmtInput.value = DEFAULTS.pmt
  timing.value = DEFAULTS.timing
  contribFreq.value = DEFAULTS.contribFreq
  inflationInput.value = DEFAULTS.inflation
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 本机持久化（SSR 安全，try/catch） ----------
function saveState() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      principal: principalInput.value,
      rate: rateInput.value,
      compoundFreq: compoundFreq.value,
      years: yearsInput.value,
      pmt: pmtInput.value,
      timing: timing.value,
      contribFreq: contribFreq.value,
      inflation: inflationInput.value
    }))
  } catch (e) { /* 隐私模式 / 配额溢出，忽略 */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const s = JSON.parse(raw)
    if (!s || typeof s !== 'object') return
    if (typeof s.principal === 'number') principalInput.value = s.principal
    if (typeof s.rate === 'number') rateInput.value = s.rate
    if ([1, 2, 4, 12, 365].includes(s.compoundFreq)) compoundFreq.value = s.compoundFreq
    if (typeof s.years === 'number') yearsInput.value = s.years
    if (typeof s.pmt === 'number') pmtInput.value = s.pmt
    if (s.timing === 'begin' || s.timing === 'end') timing.value = s.timing
    if (s.contribFreq === 'month' || s.contribFreq === 'year') contribFreq.value = s.contribFreq
    if (typeof s.inflation === 'number') inflationInput.value = s.inflation
  } catch (e) { /* 解析失败，保持默认 */ }
}

watch(
  [principalInput, rateInput, compoundFreq, yearsInput, pmtInput, timing, contribFreq, inflationInput],
  () => saveState()
)

onMounted(() => {
  loadState()
  addRecentTool('compound-interest-calculator')
})
</script>
