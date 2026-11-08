<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <PlugZap class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">家电能效对比计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">两台电器按标牌耗电量算年电费差，购机差价几年省回来，买前算账</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线家电能效对比工具：两台电器分别输入耗电量——优先读<strong class="text-foreground">能效标牌上的「年耗电量 kWh/年」÷ 365</strong>（最可靠），
        或按「功率 W × 日均使用小时」估算（两种输入模式可切换）——即时算出两台的年耗电量与年电费、年电费差，
        再结合购机差价给出「差价回本年限 = 购机差价 ÷ 年电费差」；差价为 0 或负数时直接提示便宜的更划算。
        附能效等级科普（一级能效 ≠ 省钱）。核心算法为可独立单测的纯函数，全部在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径提示条 -->
    <div class="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-2">
      <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
      <p class="text-sm leading-relaxed text-amber-600">
        口径说明：标牌「年耗电量」是标准工况实测口径，比功率 × 时长估算可靠；冰箱、空调等间歇运行电器按功率 × 24 小时会明显高估。
        电价默认 0.55 元/度，请按当地账单或阶梯电价均价修改；回本年限为静态测算，未含电价调整与维修差异。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <PlugZap class="w-5 h-5 mr-2 text-primary" /> 两台电器参数
        </h2>

        <!-- 电器 A -->
        <div class="rounded-lg border border-border p-4 space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-foreground">电器 A</p>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                @click="switchMode('A', 'label')"
                class="px-2.5 py-1.5 rounded-md border border-border text-xs cursor-pointer transition"
                :class="modeA === 'label' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'"
              >标牌年耗电量</button>
              <button
                @click="switchMode('A', 'power')"
                class="px-2.5 py-1.5 rounded-md border border-border text-xs cursor-pointer transition"
                :class="modeA === 'power' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'"
              >功率 × 时长</button>
            </div>
          </div>
          <div>
            <label for="aec-nameA" class="block text-xs text-muted-foreground mb-1.5">备注名（可选）</label>
            <input
              id="aec-nameA"
              v-model="nameA"
              type="text"
              maxlength="12"
              placeholder="如：一级能效款"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div v-if="modeA === 'label'">
            <label for="aec-annualA" class="block text-sm font-medium text-foreground mb-1.5">年耗电量（kWh/年）</label>
            <input
              id="aec-annualA"
              v-model.number="annualAInput"
              type="number"
              min="0"
              step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">能效标识上印有「年耗电量 kWh/年」（冰箱 / 洗衣机 / 空调等通常有），填入后自动 ÷365 折算日耗</p>
          </div>
          <div v-else class="grid grid-cols-2 gap-3">
            <div>
              <label for="aec-wattsA" class="block text-sm font-medium text-foreground mb-1.5">功率（W）</label>
              <input
                id="aec-wattsA"
                v-model.number="wattsAInput"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label for="aec-hoursA" class="block text-sm font-medium text-foreground mb-1.5">日均使用（h/天）</label>
              <input
                id="aec-hoursA"
                v-model.number="hoursAInput"
                type="number"
                min="0"
                max="24"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <p class="col-span-2 text-xs text-muted-foreground">适合无标牌数据的电器；压缩机间歇运行的电器（冰箱）优先用标牌年耗电量</p>
          </div>
          <p class="text-xs text-muted-foreground font-mono">
            折算：日耗 ≈ {{ fmtNum(dailyA) }} kWh/天 · 年耗 {{ fmtNum(kwhA) }} kWh/年
          </p>
        </div>

        <!-- 电器 B -->
        <div class="rounded-lg border border-border p-4 space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-foreground">电器 B</p>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                @click="switchMode('B', 'label')"
                class="px-2.5 py-1.5 rounded-md border border-border text-xs cursor-pointer transition"
                :class="modeB === 'label' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'"
              >标牌年耗电量</button>
              <button
                @click="switchMode('B', 'power')"
                class="px-2.5 py-1.5 rounded-md border border-border text-xs cursor-pointer transition"
                :class="modeB === 'power' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'"
              >功率 × 时长</button>
            </div>
          </div>
          <div>
            <label for="aec-nameB" class="block text-xs text-muted-foreground mb-1.5">备注名（可选）</label>
            <input
              id="aec-nameB"
              v-model="nameB"
              type="text"
              maxlength="12"
              placeholder="如：三级能效款"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div v-if="modeB === 'label'">
            <label for="aec-annualB" class="block text-sm font-medium text-foreground mb-1.5">年耗电量（kWh/年）</label>
            <input
              id="aec-annualB"
              v-model.number="annualBInput"
              type="number"
              min="0"
              step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">与 A 保持同一口径对比（都读标牌，或都按功率估算）</p>
          </div>
          <div v-else class="grid grid-cols-2 gap-3">
            <div>
              <label for="aec-wattsB" class="block text-sm font-medium text-foreground mb-1.5">功率（W）</label>
              <input
                id="aec-wattsB"
                v-model.number="wattsBInput"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label for="aec-hoursB" class="block text-sm font-medium text-foreground mb-1.5">日均使用（h/天）</label>
              <input
                id="aec-hoursB"
                v-model.number="hoursBInput"
                type="number"
                min="0"
                max="24"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <p class="col-span-2 text-xs text-muted-foreground">日耗 = 功率 × 小时 ÷ 1000；间歇运行的电器按实际运行时长折算，不要按 24h 算</p>
          </div>
          <p class="text-xs text-muted-foreground font-mono">
            折算：日耗 ≈ {{ fmtNum(dailyB) }} kWh/天 · 年耗 {{ fmtNum(kwhB) }} kWh/年
          </p>
        </div>

        <!-- 电价与购机价 -->
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label for="aec-elec" class="block text-sm font-medium text-foreground mb-1.5">电价（元/kWh）</label>
            <input
              id="aec-elec"
              v-model.number="elecPriceInput"
              type="number"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label for="aec-priceA" class="block text-sm font-medium text-foreground mb-1.5">A 购机价（元）</label>
            <input
              id="aec-priceA"
              v-model.number="priceAInput"
              type="number"
              min="0"
              step="50"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label for="aec-priceB" class="block text-sm font-medium text-foreground mb-1.5">B 购机价（元）</label>
            <input
              id="aec-priceB"
              v-model.number="priceBInput"
              type="number"
              min="0"
              step="50"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <p class="text-xs text-muted-foreground -mt-2">购机价指到手总价（含安装延保等），用于算「省电的一台贵多少」</p>

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
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 对比结果
        </h2>

        <!-- 结论卡：分四种状态 -->
        <div v-if="!cmpValid" class="bg-muted/50 rounded-lg p-5 text-center">
          <p class="text-sm text-muted-foreground">请先填入两台电器的耗电量与电价（电价需大于 0，至少一台有耗电）</p>
        </div>
        <div v-else-if="cmp.annualSaving === 0" class="bg-muted/50 rounded-lg p-5 text-center">
          <p class="text-base font-semibold text-foreground mb-1">两台耗电相同</p>
          <p class="text-sm text-muted-foreground">按购机价选便宜的即可，能效对比没有意义。</p>
        </div>
        <div v-else-if="cmp.priceGap <= 0" class="bg-green-500/5 border border-green-500/30 rounded-lg p-5 text-center">
          <p class="text-base font-semibold text-green-600 dark:text-green-400 mb-1">便宜的更划算，直接选它</p>
          <p class="text-sm text-muted-foreground">
            更省电的 {{ saverName }} 价格并不更高（{{ cmp.priceGap === 0 ? '两台同价' : `反而便宜 ${formatMoney2(Math.abs(cmp.priceGap))} 元` }}），
            不存在回本周期——省电又省钱。
          </p>
        </div>
        <div v-else class="bg-primary/10 rounded-lg p-5 text-center">
          <p class="text-xs text-muted-foreground mb-1">差价回本年限（购机差价 ÷ 年电费差）</p>
          <p class="text-4xl sm:text-5xl font-bold text-primary leading-tight">
            {{ fmtYear(cmp.payback) }}<span class="text-base font-normal text-muted-foreground ml-1.5">年</span>
          </p>
          <p class="text-xs text-muted-foreground mt-2">
            更省电的 {{ saverName }} 贵 {{ formatMoney2(cmp.priceGap) }} 元，
            每年省电费 {{ formatMoney2(cmp.annualSaving) }} 元
          </p>
          <p class="text-xs text-muted-foreground mt-1.5">
            若回本年限超过电器的预期使用年限（如冰箱约 10~12 年、空调约 10 年），差价可能省不回来。
          </p>
        </div>

        <!-- 对比表 -->
        <div v-if="cmpValid" class="overflow-x-auto rounded-lg border border-border">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-muted/50 text-muted-foreground">
                <th class="px-3 py-2 text-left font-medium">指标</th>
                <th class="px-3 py-2 text-right font-medium">{{ nameA || '电器 A' }}</th>
                <th class="px-3 py-2 text-right font-medium">{{ nameB || '电器 B' }}</th>
                <th class="px-3 py-2 text-right font-medium">差（B − A）</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr>
                <td class="px-3 py-2 text-foreground">日耗电量</td>
                <td class="px-3 py-2 text-right font-mono text-foreground">{{ fmtNum(dailyA) }} kWh</td>
                <td class="px-3 py-2 text-right font-mono text-foreground">{{ fmtNum(dailyB) }} kWh</td>
                <td class="px-3 py-2 text-right font-mono text-muted-foreground">{{ fmtSigned(dailyB - dailyA) }} kWh</td>
              </tr>
              <tr>
                <td class="px-3 py-2 text-foreground">年耗电量</td>
                <td class="px-3 py-2 text-right font-mono text-foreground">{{ fmtNum(cmp.kwhA) }} kWh</td>
                <td class="px-3 py-2 text-right font-mono text-foreground">{{ fmtNum(cmp.kwhB) }} kWh</td>
                <td class="px-3 py-2 text-right font-mono text-muted-foreground">{{ fmtSigned(cmp.kwhDiff) }} kWh</td>
              </tr>
              <tr>
                <td class="px-3 py-2 text-foreground">年电费</td>
                <td class="px-3 py-2 text-right font-mono text-foreground font-semibold">{{ formatMoney2(cmp.costA) }} 元</td>
                <td class="px-3 py-2 text-right font-mono text-foreground font-semibold">{{ formatMoney2(cmp.costB) }} 元</td>
                <td class="px-3 py-2 text-right font-mono text-primary font-bold">{{ fmtSigned(cmp.costDiff) }} 元</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 差额结论 -->
        <div v-if="cmpValid && cmp.annualSaving > 0" class="rounded-lg border border-border bg-muted/40 p-4">
          <p class="text-sm text-foreground leading-relaxed">
            <span class="font-semibold">{{ saverName }}</span> 每年少耗
            <span class="font-mono">{{ fmtNum(Math.abs(cmp.kwhDiff)) }}</span> kWh、
            省电费 <span class="font-mono text-green-600 dark:text-green-400">{{ formatMoney2(cmp.annualSaving) }}</span> 元，
            两台购机差价 <span class="font-mono">{{ formatMoney2(Math.abs(cmp.priceGap)) }}</span> 元
            （{{ cmp.priceGap > 0 ? `${saverName} 更贵` : `${saverName} 更便宜` }}）。
          </p>
        </div>

        <!-- 回验与自检锚点 -->
        <div class="bg-muted/50 border border-border rounded-lg p-3 text-xs leading-relaxed text-muted-foreground">
          <p>
            回验：A 年耗 {{ fmtNum(cmp.kwhA) }} × {{ fmtPrice(elecPriceNum) }} 元 = {{ formatMoney2(cmp.costA) }} 元/年，
            B 年耗 {{ fmtNum(cmp.kwhB) }} × {{ fmtPrice(elecPriceNum) }} 元 = {{ formatMoney2(cmp.costB) }} 元/年，
            年电费差 {{ formatMoney2(cmp.annualSaving) }} 元；回本 = 差价 {{ formatMoney2(Math.abs(cmp.priceGap)) }} 元 ÷
            {{ formatMoney2(cmp.annualSaving) }} 元 = {{ cmp.payback !== null ? fmtYear(cmp.payback) : '—' }} 年。
          </p>
          <p class="mt-1.5">
            自检锚点（锁进随页自测）：A 0.8 kWh/天（标牌 292 kWh/年）vs B 1.2 kWh/天（438 kWh/年），电价 0.55 元
            → 年耗电差 146.0 kWh、年电费差 80.30 元；差价 800 元 → 回本 9.96 年。
          </p>
        </div>

        <!-- 免责声明（固定） -->
        <p class="text-[11px] leading-relaxed text-muted-foreground/80 border-t border-border pt-3">
          {{ DISCLAIMER }}
        </p>
      </div>
    </div>

    <!-- 能效等级科普卡 -->
    <div class="mb-6 rounded-lg border border-border bg-card p-5 space-y-2.5">
      <h2 class="text-base font-semibold text-foreground flex items-center">
        <Lightbulb class="w-5 h-5 mr-2 text-primary" /> 能效等级科普：等级高 ≠ 一定划算
      </h2>
      <ul class="space-y-2 text-sm text-muted-foreground leading-relaxed">
        <li class="flex items-start gap-1.5">
          <span class="mt-0.5 text-primary">•</span>
          <span><span class="text-foreground">一级能效不等于省钱</span>：一级能效往往更贵，是否值得取决于「购机差价 ÷ 年电费差」的回本年限与使用频率；
            冰箱、空调这类全年高频运行的大电器才容易把差价省回来。</span>
        </li>
        <li class="flex items-start gap-1.5">
          <span class="mt-0.5 text-primary">•</span>
          <span><span class="text-foreground">低频使用的电器能效意义小</span>：小烤箱、电水壶、便携暖风机一年用不了几次，
            一级与三级能效的年电费差可能只有几块钱，为高能效等级多花的钱几乎省不回来。</span>
        </li>
        <li class="flex items-start gap-1.5">
          <span class="mt-0.5 text-primary">•</span>
          <span><span class="text-foreground">标牌年耗电量是最可靠的数</span>：能效标识上的「年耗电量 kWh/年」是标准工况实测口径；
            自己按「功率 × 24h」估算冰箱等间歇运行电器会明显高估，能读标牌就不要手算。</span>
        </li>
      </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>家电能效对比计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          家电能效对比计算器是一款买前算账工具：把候选的两台电器（比如一级能效和三级能效的冰箱）放在一起，
          分别输入耗电量与购机价，工具自动算出两台的年耗电量、年电费、年电费差，并给出「差价回本年限」——
          更省电的那台贵出来的钱，按每年省下的电费几年能省回来。耗电量优先推荐读能效标牌上的「年耗电量 kWh/年」
          （÷365 折算日耗），也可以切换成「功率 W × 日均小时」模式手算。电价默认 0.55 元/度，可按当地账单修改。
          全部计算在浏览器本地完成，参数暂存本机 localStorage，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">什么时候会用到？</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed mb-4">
          <li><strong class="text-foreground">买冰箱 / 空调 / 洗衣机前</strong>：同容量两台能效等级不同、差价几百上千，算算几年省回来再决定。</li>
          <li><strong class="text-foreground">一级 vs 二级 / 三级能效</strong>：验证导购说的「一级能效更省钱」在你的使用强度下是否成立。</li>
          <li><strong class="text-foreground">旧机换新机</strong>：老电器 vs 新能效机型的年电费差，估算换机的节能收益。</li>
          <li><strong class="text-foreground">商家话术验证</strong>：把「省电 30%」这类宣传折算成具体金额，看清值不值差价。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">计算公式</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed mb-2">
          <li><strong class="text-foreground">日耗电量</strong>：标牌模式 = 年耗电量（kWh/年）÷ 365；功率模式 = 功率（W）× 日均小时 ÷ 1000</li>
          <li><strong class="text-foreground">年耗电量</strong> = 日耗电量 × 365；<strong class="text-foreground">年电费</strong> = 年耗电量 × 电价</li>
          <li><strong class="text-foreground">年电费差</strong> = 两台年电费之差的绝对值（更省电的一台每年省的钱）</li>
          <li><strong class="text-foreground">差价回本年限</strong> = 购机差价 ÷ 年电费差（省电的一台不更贵时，直接给「便宜的更划算」提示，无需回本）</li>
        </ul>
        <p class="text-xs text-muted-foreground leading-relaxed mb-4">
          例（本页默认示例）：A 0.8 kWh/天（标牌 292 kWh/年）、B 1.2 kWh/天（438 kWh/年），电价 0.55 元 →
          年耗电差 146 kWh、年电费差 80.30 元；A 贵 800 元 → 800 ÷ 80.30 ≈ 9.96 年回本。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div v-for="(faq, index) in faqs" :key="index">
            <h3 class="text-base font-semibold text-foreground">{{ faq.q }}</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">{{ faq.a }}</p>
          </div>
        </div>

        <p class="text-xs leading-relaxed text-muted-foreground/80 border-t border-border mt-8 pt-3">
          {{ DISCLAIMER }}
        </p>
      </div>
    </div>

    <RelatedTools :current-tool-id="'appliance-energy-comparison'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  PlugZap, Calculator, TriangleAlert, Lightbulb,
  ChevronUp, ChevronDown, RefreshCw, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const DISCLAIMER = '本页为静态数学演算与选购参考，不构成购买建议；实际耗电量以产品工况、使用习惯与当地电价为准，能效数据以能效标识与产品说明书为准。'

// ---------- FAQ（页面 SEO 区与 JSON-LD FAQPage 共用） ----------
const faqs = [
  {
    q: '一级能效一定更省钱吗？',
    a: '不一定。一级能效机型往往更贵，是否划算取决于「购机差价 ÷ 年电费差」的回本年限，以及使用频率：冰箱、空调这类全年高频运行的大电器，几年内省回差价很常见；小烤箱、电水壶这类低频电器，一级与三级的年电费差可能只有几块钱，为等级多花的钱几乎省不回来。'
  },
  {
    q: '能效标牌上的年耗电量在哪里看？',
    a: '中国能效标识的右下角或参数栏印有「年耗电量 kWh/年」，冰箱、洗衣机、空调、热水器等通常都有。这是标准工况下的实测口径，比功率 × 时长手算可靠得多，直接把它填进本工具即可（会自动 ÷365 折算日耗）。'
  },
  {
    q: '差价几年回本是怎么算的？',
    a: '回本年限 = 更省电那台贵出的购机价 ÷ 两台年电费差。例：A 每年省 80.30 元电费、比 B 贵 800 元 → 800 ÷ 80.30 ≈ 9.96 年。如果省电的一台反而更便宜或同价，就无所谓回本——便宜的更划算。参考标准：回本年限明显小于电器预期使用年限（冰箱约 10~12 年）才值得为能效多花钱。'
  },
  {
    q: '没有标牌年耗电量的电器怎么估？',
    a: '切到「功率 × 时长」模式：日耗（kWh）= 功率（W）× 日均使用小时 ÷ 1000，年耗 = 日耗 × 365。注意间歇运行的电器：冰箱压缩机不是 24 小时连续工作，按功率 × 24 会明显高估，优先用标牌数；空调达到设定温度会降频停机，长时间运行的耗电通常低于满功率估算。'
  },
  {
    q: '回本年限多长算值得为能效多花钱？',
    a: '没有统一标准，常用参考是：回本年限不超过电器预期使用年限的一半较稳妥（冰箱按 10~12 年寿命，回本 5 年以内比较踏实）。若回本年限超过使用年限，差价基本省不回来，通常不如买便宜的那台，把差价留在手里。'
  }
]

// ---------- SEO ----------
useSeoMeta({
  title: '家电能效对比计算器 - 两台电器年电费差与差价回本测算 | 有条工具',
  description: '免费在线家电能效对比工具：两台电器按标牌年耗电量（÷365）或功率×时长算年耗电与年电费差，结合购机差价算「差价几年省回来」的回本年限，差价为0或负数提示便宜更划算，附一级能效≠省钱科普，本地运行不上传',
  keywords: '能效等级, 家电耗电, 年电费计算, 一级能效, 电费对比, 能效标识, 差价回本',
  author: '有条工具',
  ogTitle: '家电能效对比计算器 - 两台电器年电费差与差价回本测算 | 有条工具',
  ogDescription: '标牌年耗电量或功率×时长算年电费差，购机差价几年省回来，买前算账。',
  ogUrl: 'https://www.util.cn/tools/appliance-energy-comparison',
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
          name: '家电能效对比计算器',
          url: 'https://www.util.cn/tools/appliance-energy-comparison',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '两台电器年耗电量 / 年电费对比（B − A 差额表）',
            '标牌年耗电量 ÷365 或 功率×时长 两种输入模式切换',
            '年电费差与购机差价一目了然',
            '差价回本年限 = 购机差价 ÷ 年电费差',
            '差价为 0 或负数给「便宜的更划算」提示',
            '能效等级科普（一级能效 ≠ 省钱）',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '家电能效对比', item: 'https://www.util.cn/tools/appliance-energy-comparison/' }
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
// 约定：电量单位 kWh，金额单位元；标牌年耗电量口径 ÷365 折算日耗；
// 回本口径 = 省电的一台贵出的购机价 ÷ 两台年电费差（绝对值）。
// 本区不依赖 Vue / 浏览器 API，可原样抽入测试。

// 输入归一化：非有限数按 0，负值归 0
function numOr0(v) {
  const n = Number(v)
  return isFinite(n) ? Math.max(0, n) : 0
}

// 标牌年耗电量（kWh/年）→ 日耗（kWh/天）
function dailyKwhFromAnnual(annualKwh) {
  return numOr0(annualKwh) / 365
}

// 日耗（kWh/天）→ 年耗（kWh/年）
function annualKwhFromDaily(dailyKwh) {
  return numOr0(dailyKwh) * 365
}

// 功率（W）× 日均小时（h/天）→ 日耗（kWh/天）
function dailyKwhFromPower(watts, hoursPerDay) {
  return numOr0(watts) * numOr0(hoursPerDay) / 1000
}

// 对比核心：年耗电/年电费/差额/回本年限。
// saverIsA：电费更低的一台（相同按 A）；priceGap：省电的一台贵多少（≤0 = 不更贵/更便宜）；
// payback：仅当省电的一台更贵且年电费差 > 0 时有值，否则 null。
function comparison(annualA, annualB, priceA, priceB, elecPrice) {
  const ka = numOr0(annualA)
  const kb = numOr0(annualB)
  const p = numOr0(elecPrice)
  const pa = numOr0(priceA)
  const pb = numOr0(priceB)
  const costA = ka * p
  const costB = kb * p
  const kwhDiff = kb - ka
  const costDiff = costB - costA
  const saverIsA = costA <= costB
  const annualSaving = Math.abs(costDiff)
  const priceGap = saverIsA ? pa - pb : pb - pa
  let payback = null
  if (priceGap > 0 && annualSaving > 0) payback = priceGap / annualSaving
  return { kwhA: ka, kwhB: kb, costA, costB, kwhDiff, costDiff, saverIsA, annualSaving, priceGap, payback }
}

// 自测断言集（标牌反推 / 功率换算 / 锚点链路 / 差价边界 / 除零 / 非法输入）
function runApplianceCompareSelfTests() {
  const t = []
  const eq = (name, got, want, tol) => {
    const e = typeof tol === 'number' ? tol : 1e-9
    const ok = (typeof got === 'string' || typeof want === 'string')
      ? got === want
      : ((got === null || want === null) ? got === want : Math.abs(got - want) <= e)
    t.push({ name, got, want, pass: ok })
  }
  // 输入模式换算
  eq('标牌·292 kWh/年 → 0.8 kWh/天', dailyKwhFromAnnual(292), 292 / 365)
  eq('标牌·0.8 kWh/天 → 年耗 292 kWh', annualKwhFromDaily(0.8), 292)
  eq('功率·1500W × 2h = 3 kWh/天', dailyKwhFromPower(1500, 2), 3)
  eq('功率·60W × 24h = 1.44 kWh/天', dailyKwhFromPower(60, 24), 1.44)
  // 锚点：A 0.8 vs B 1.2 kWh/天，电价 0.55 → 年差 146.0 kWh、电费差 80.30 元；差价 800 → 回本 9.96 年
  const ka = annualKwhFromDaily(0.8)
  const kb = annualKwhFromDaily(1.2)
  const cmp = comparison(ka, kb, 3000, 2200, 0.55)
  eq('锚点·A 年耗电 292 kWh', ka, 292)
  eq('锚点·B 年耗电 438 kWh', kb, 438)
  eq('锚点·年耗电差 146.0 kWh', cmp.kwhDiff, 146)
  eq('锚点·A 年电费 160.60 元', cmp.costA, 292 * 0.55)
  eq('锚点·B 年电费 240.90 元', cmp.costB, 438 * 0.55)
  eq('锚点·年电费差 80.30 元', cmp.annualSaving, (438 - 292) * 0.55)
  eq('锚点·回本 ≈9.9626 年', cmp.payback, 800 / ((438 - 292) * 0.55))
  eq('锚点·回本两位小数文本 9.96', cmp.payback.toFixed(2), '9.96')
  // 差价边界
  eq('差价·0 元 → 回本 null（便宜更划算提示）', comparison(292, 438, 2200, 2200, 0.55).payback, null)
  eq('差价·省电机更便宜 → 回本 null', comparison(292, 438, 2200, 3000, 0.55).payback, null)
  eq('差价·省电机贵 500 元 → 回本 ≈6.2266 年', comparison(292, 438, 2700, 2200, 0.55).payback, 500 / ((438 - 292) * 0.55))
  // 方向镜像：B 更省且 B 贵 800 元 → 回本一致
  const mirror = comparison(438, 292, 2200, 3000, 0.55)
  eq('方向·B 更省时 saverIsA=false', mirror.saverIsA, false)
  eq('方向·镜像回本 ≈9.9626 年', mirror.payback, 800 / ((438 - 292) * 0.55))
  // 除零与非法输入
  eq('除零·两台耗电相同 → 回本 null', comparison(292, 292, 3000, 2200, 0.55).payback, null)
  eq('除零·电价 0 → 回本 null', comparison(292, 438, 3000, 2200, 0).payback, null)
  eq('非法·NaN 日耗 → 年耗 0', annualKwhFromDaily(NaN), 0)
  eq('非法·负功率 → 日耗 0', dailyKwhFromPower(-100, 5), 0)
  eq('非法·标牌负年耗 → 日耗 0', dailyKwhFromAnnual(-292), 0)
  eq('非法·负购机价按 0 计 → 回本 null', comparison(292, 438, -100, 2200, 0.55).payback, null)
  return t
}
/* ==== 纯函数（node 自测提取区）end ==== */

// ---------- 输入状态 ----------
// 隐私说明：参数仅暂存本机 localStorage，不上传；读写全程 try/catch，
// 浏览器 API 只在 onMounted 与事件回调内使用，SSR 安全。
const STORAGE_KEY = 'util-appliance-energy-comparison'
const DEFAULTS = {
  nameA: '', nameB: '', modeA: 'label', modeB: 'label',
  annualA: 292, wattsA: 100, hoursA: 8,
  annualB: 438, wattsB: 150, hoursB: 8,
  elecPrice: 0.55, priceA: 3000, priceB: 2200
}
const EXAMPLE = { ...DEFAULTS }

const nameA = ref(EXAMPLE.nameA)
const nameB = ref(EXAMPLE.nameB)
const modeA = ref(EXAMPLE.modeA)
const modeB = ref(EXAMPLE.modeB)
const annualAInput = ref(EXAMPLE.annualA)
const wattsAInput = ref(EXAMPLE.wattsA)
const hoursAInput = ref(EXAMPLE.hoursA)
const annualBInput = ref(EXAMPLE.annualB)
const wattsBInput = ref(EXAMPLE.wattsB)
const hoursBInput = ref(EXAMPLE.hoursB)
const elecPriceInput = ref(EXAMPLE.elecPrice)
const priceAInput = ref(EXAMPLE.priceA)
const priceBInput = ref(EXAMPLE.priceB)
const seoContentVisible = ref(true)

// ---------- 输入模式切换（互转当前值，保持口径连续） ----------
function switchMode(which, mode) {
  const isA = which === 'A'
  const curMode = isA ? modeA.value : modeB.value
  if (curMode === mode) return
  if (isA) {
    if (mode === 'power') {
      const daily = dailyKwhFromAnnual(annualAInput.value)
      hoursAInput.value = 8
      wattsAInput.value = Math.round(daily * 1000 / 8)
    } else {
      const daily = dailyKwhFromPower(wattsAInput.value, hoursAInput.value)
      annualAInput.value = Math.round(daily * 365)
    }
    modeA.value = mode
  } else {
    if (mode === 'power') {
      const daily = dailyKwhFromAnnual(annualBInput.value)
      hoursBInput.value = 8
      wattsBInput.value = Math.round(daily * 1000 / 8)
    } else {
      const daily = dailyKwhFromPower(wattsBInput.value, hoursBInput.value)
      annualBInput.value = Math.round(daily * 365)
    }
    modeB.value = mode
  }
}

// ---------- 归一化 ----------
const elecPriceNum = computed(() => numOr0(elecPriceInput.value))
const kwhA = computed(() => (modeA.value === 'label'
  ? annualKwhFromDaily(dailyKwhFromAnnual(annualAInput.value))
  : annualKwhFromDaily(dailyKwhFromPower(wattsAInput.value, hoursAInput.value))))
const kwhB = computed(() => (modeB.value === 'label'
  ? annualKwhFromDaily(dailyKwhFromAnnual(annualBInput.value))
  : annualKwhFromDaily(dailyKwhFromPower(wattsBInput.value, hoursBInput.value))))
const dailyA = computed(() => dailyKwhFromAnnual(kwhA.value))
const dailyB = computed(() => dailyKwhFromAnnual(kwhB.value))

// ---------- 核心计算 ----------
const cmp = computed(() => comparison(kwhA.value, kwhB.value, priceAInput.value, priceBInput.value, elecPriceInput.value))
const cmpValid = computed(() => elecPriceNum.value > 0 && (kwhA.value > 0 || kwhB.value > 0))
const saverName = computed(() => (cmp.value.saverIsA ? (nameA.value || '电器 A') : (nameB.value || '电器 B')))

// ---------- 输入越界提示 ----------
const inputWarning = computed(() => {
  const checks = [
    [annualAInput.value, 0, 1e5],
    [annualBInput.value, 0, 1e5],
    [wattsAInput.value, 0, 1e5],
    [wattsBInput.value, 0, 1e5],
    [hoursAInput.value, 0, 24],
    [hoursBInput.value, 0, 24],
    [elecPriceInput.value, 0, 100],
    [priceAInput.value, 0, 1e7],
    [priceBInput.value, 0, 1e7]
  ]
  const bad = checks.some(([v, min, max]) => {
    if (v === '' || v === null || v === undefined) return false
    const n = Number(v)
    return !isFinite(n) || n < min || n > max
  })
  return bad ? '部分输入超出允许范围，已按 0 参与计算（耗电量、功率、时长、电价与购机价需为合法非负数）。' : ''
})

// ---------- 格式化 ----------
function formatMoney2(v) {
  const n = Number(v)
  if (!isFinite(n)) return '—'
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtNum(v) {
  const n = Number(v)
  if (!isFinite(n)) return '0'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}
function fmtSigned(v) {
  const n = Number(v)
  if (!isFinite(n)) return '—'
  const body = n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
  return n > 0 ? `+${body}` : body
}
function fmtPrice(v) {
  const n = Number(v)
  if (!isFinite(n)) return '0.00'
  return n.toFixed(2)
}
function fmtYear(v) {
  const n = Number(v)
  if (!isFinite(n)) return '—'
  return n.toFixed(2)
}

// ---------- 操作 ----------
function loadExample() {
  nameA.value = EXAMPLE.nameA
  nameB.value = EXAMPLE.nameB
  modeA.value = EXAMPLE.modeA
  modeB.value = EXAMPLE.modeB
  annualAInput.value = EXAMPLE.annualA
  wattsAInput.value = EXAMPLE.wattsA
  hoursAInput.value = EXAMPLE.hoursA
  annualBInput.value = EXAMPLE.annualB
  wattsBInput.value = EXAMPLE.wattsB
  hoursBInput.value = EXAMPLE.hoursB
  elecPriceInput.value = EXAMPLE.elecPrice
  priceAInput.value = EXAMPLE.priceA
  priceBInput.value = EXAMPLE.priceB
}

function resetAll() {
  loadExample()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 本机持久化（SSR 安全，try/catch） ----------
function saveState() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      nameA: nameA.value,
      nameB: nameB.value,
      modeA: modeA.value,
      modeB: modeB.value,
      annualA: annualAInput.value,
      wattsA: wattsAInput.value,
      hoursA: hoursAInput.value,
      annualB: annualBInput.value,
      wattsB: wattsBInput.value,
      hoursB: hoursBInput.value,
      elecPrice: elecPriceInput.value,
      priceA: priceAInput.value,
      priceB: priceBInput.value
    }))
  } catch (e) { /* 隐私模式 / 配额溢出，忽略 */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const s = JSON.parse(raw)
    if (!s || typeof s !== 'object') return
    if (typeof s.nameA === 'string') nameA.value = s.nameA.slice(0, 12)
    if (typeof s.nameB === 'string') nameB.value = s.nameB.slice(0, 12)
    if (s.modeA === 'label' || s.modeA === 'power') modeA.value = s.modeA
    if (s.modeB === 'label' || s.modeB === 'power') modeB.value = s.modeB
    if (typeof s.annualA === 'number') annualAInput.value = s.annualA
    if (typeof s.wattsA === 'number') wattsAInput.value = s.wattsA
    if (typeof s.hoursA === 'number') hoursAInput.value = s.hoursA
    if (typeof s.annualB === 'number') annualBInput.value = s.annualB
    if (typeof s.wattsB === 'number') wattsBInput.value = s.wattsB
    if (typeof s.hoursB === 'number') hoursBInput.value = s.hoursB
    if (typeof s.elecPrice === 'number') elecPriceInput.value = s.elecPrice
    if (typeof s.priceA === 'number') priceAInput.value = s.priceA
    if (typeof s.priceB === 'number') priceBInput.value = s.priceB
  } catch (e) { /* 解析失败，保持默认 */ }
}

watch(
  [nameA, nameB, modeA, modeB, annualAInput, wattsAInput, hoursAInput, annualBInput, wattsBInput, hoursBInput, elecPriceInput, priceAInput, priceBInput],
  () => saveState()
)

onMounted(() => {
  loadState()
  addRecentTool('appliance-energy-comparison')
  // 纯函数自测（标牌反推 / 功率换算 / 锚点链路 / 差价边界 / 除零 / 非法输入），仅控制台输出
  const results = runApplianceCompareSelfTests()
  const failed = results.filter((r) => !r.pass)
  if (failed.length > 0) {
    console.warn(`[appliance-energy-comparison] 自测 ${failed.length}/${results.length} 条未通过`, failed)
  } else {
    console.info(`[appliance-energy-comparison] 自测通过 ${results.length}/${results.length} 条断言`)
  }
})
</script>
