<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sun class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">光伏并网回本计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">家庭并网电站：年发电量 / 年收益 / 静态回本年限 / 25 年累计净收益试算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线光伏并网回本计算器：输入装机容量、年有效利用小时（附一类 / 二类 / 三类资源区常识区间）、自用比例与自用 / 上网双电价、
        系统投资（元/W × 装机 或 总价直填），按「年发电量 = 装机 × 利用小时 × 系统效率 0.8」「年收益 = 自用电量 × 自用电价 + 上网电量 × 上网电价」
        即时测算静态回本年限与含衰减的 25 年累计净收益。与「太阳能离网配置计算器」分工不同——本页面向<strong class="text-foreground">并网系统的投资回本与收益</strong>，
        离网场景（板功率 / 电池容量 / 控制器选型）请用离网页。核心算法为可独立单测的纯函数，全部在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径提示条 -->
    <div class="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-2">
      <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
      <p class="text-sm leading-relaxed text-amber-600">
        口径说明：系统效率按 <strong>0.8 固定系数</strong>（已覆盖逆变器效率、直流线损、灰尘遮挡与温度折损）；上网电价默认按
        燃煤发电基准价口径，各地不同，以电网实际结算为准；年有效利用小时参考区间为常识口径，以当地实际辐照与气象数据为准；
        回本为静态测算，未含资金折现、电价波动与运维费用。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Sun class="w-5 h-5 mr-2 text-primary" /> 电站参数
        </h2>

        <!-- 装机与利用小时 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="sp-capacity" class="block text-sm font-medium text-foreground mb-1.5">装机容量（kW）</label>
            <input
              id="sp-capacity"
              v-model.number="capacityInput"
              type="number"
              min="0"
              step="0.5"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">屋顶面积参考：约 5~10 ㎡ 装 1 kW</p>
          </div>
          <div>
            <label for="sp-hours" class="block text-sm font-medium text-foreground mb-1.5">年有效利用小时（h）</label>
            <input
              id="sp-hours"
              v-model.number="hoursInput"
              type="number"
              min="0"
              step="50"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">每 kW 装机一年实际发电的小时数折算</p>
          </div>
        </div>

        <!-- 资源区参考 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">资源区参考（点击填入区间中值）</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="zone in ZONE_PRESETS"
              :key="zone.key"
              @click="hoursInput = zone.hours"
              class="px-3 py-2 rounded-lg border border-border text-left text-sm cursor-pointer transition"
              :class="hoursInput === zone.hours ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/50'"
            >
              <span class="block font-medium">{{ zone.label }}</span>
              <span class="block text-xs text-muted-foreground mt-0.5 font-mono">{{ zone.range }}</span>
            </button>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-2 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>
              一类（1400 h 以上）：西北 / 高原，如宁夏、青海、甘肃、内蒙古西部；二类（1100–1400 h）：华北 / 黄淮，如北京、山东、河北、苏北；
              三类（900–1100 h）：长江中下游 / 西南 / 华南，如江浙、两湖、四川、广东。以上为常识参考区间，<span class="text-foreground">以当地实际与气象数据为准</span>
              （Global Solar Atlas / NASA POWER / 当地气象局辐照资料）。
            </span>
          </p>
        </div>

        <!-- 自用比例 -->
        <div>
          <label for="sp-ratio" class="block text-sm font-medium text-foreground mb-2">自用比例（%）</label>
          <input
            id="sp-ratio"
            v-model.number="ratioInput"
            type="number"
            min="0"
            max="100"
            step="5"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="opt in RATIO_PRESETS"
              :key="opt.value"
              @click="ratioInput = opt.value"
              class="px-2.5 py-1 rounded-md border border-border text-xs cursor-pointer transition"
              :class="ratioInput === opt.value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'"
            >{{ opt.label }}</button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">自用替代市电更值钱（0.5~0.6 元/度），上网只拿燃煤基准价——白天用电多的家庭比例越高收益越好</p>
        </div>

        <!-- 双电价 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="sp-selfprice" class="block text-sm font-medium text-foreground mb-1.5">自用电价（元/kWh）</label>
            <input
              id="sp-selfprice"
              v-model.number="selfPriceInput"
              type="number"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">通常取当地居民 / 工商业电价</p>
          </div>
          <div>
            <label for="sp-feedprice" class="block text-sm font-medium text-foreground mb-1.5">上网电价（元/kWh）</label>
            <input
              id="sp-feedprice"
              v-model.number="feedPriceInput"
              type="number"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">燃煤基准价口径，各地不同，以电网结算为准</p>
          </div>
        </div>

        <!-- 投资口径 -->
        <div class="space-y-3 pt-1 border-t border-border">
          <p class="text-sm font-medium text-foreground">系统投资口径</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="costMode = 'perWatt'"
              class="px-3 py-2 rounded-lg border border-border text-sm cursor-pointer transition"
              :class="costMode === 'perWatt' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/50'"
            >按 元/W × 装机</button>
            <button
              @click="costMode = 'total'"
              class="px-3 py-2 rounded-lg border border-border text-sm cursor-pointer transition"
              :class="costMode === 'total' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/50'"
            >直接填系统总价</button>
          </div>
          <div>
            <label v-if="costMode === 'perWatt'" for="sp-perwatt" class="block text-xs text-muted-foreground mb-1.5">单价（元/W，常见 2.5~4）</label>
            <input
              v-if="costMode === 'perWatt'"
              id="sp-perwatt"
              v-model.number="perWattInput"
              type="number"
              min="0"
              step="0.1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <label v-if="costMode === 'total'" for="sp-total" class="block text-xs text-muted-foreground mb-1.5">系统总价（元，含组件 / 逆变器 / 支架 / 施工 / 并网）</label>
            <input
              v-if="costMode === 'total'"
              id="sp-total"
              v-model.number="totalInput"
              type="number"
              min="0"
              step="100"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <!-- 年衰减率 -->
        <div>
          <label for="sp-decay" class="block text-sm font-medium text-foreground mb-1.5">年衰减率（%）</label>
          <input
            id="sp-decay"
            v-model.number="decayInput"
            type="number"
            min="0"
            max="10"
            step="0.1"
            class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">组件首年约 2%、其后每年约 0.4~0.55% 线性衰减；此处按年均简化口径逐年递减</p>
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
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 回本测算
        </h2>

        <!-- 结论卡：静态回本年限（特大） -->
        <div v-if="paybackNum !== null" class="bg-primary/10 rounded-lg p-5 text-center">
          <p class="text-xs text-muted-foreground mb-1">静态回本年限（总投资 ÷ 年收益）</p>
          <p class="text-4xl sm:text-5xl font-bold text-primary leading-tight">
            {{ fmtYear(paybackNum) }}<span class="text-base font-normal text-muted-foreground ml-1.5">年</span>
          </p>
          <p class="text-xs text-muted-foreground mt-2">
            投资 {{ formatMoney2(costNum) }} 元 ÷ 首年年收益 {{ formatMoney2(revenue.total) }} 元
          </p>
          <p v-if="paybackNum > 25" class="text-xs text-amber-600 mt-2">
            回本年限已超过组件 25 年功率质保期，请谨慎评估投资（电价 / 利用小时 / 报价可能高估）。
          </p>
        </div>
        <div v-else class="bg-primary/10 rounded-lg p-5 text-center">
          <p class="text-xs text-muted-foreground mb-1">静态回本年限</p>
          <p class="text-lg font-semibold text-muted-foreground">暂无法测算</p>
          <p class="text-xs text-muted-foreground mt-2">需要装机容量、利用小时、电价与投资均为正数（左侧填入后自动计算）</p>
        </div>

        <!-- 小卡：年发电量 / 首年年收益 / 25 年累计净收益 -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-xs text-muted-foreground mb-1">年发电量</p>
            <p class="text-lg font-bold text-foreground">{{ fmtQty(genKwh) }}<span class="text-xs font-normal text-muted-foreground ml-1">kWh</span></p>
            <p class="text-[11px] text-muted-foreground mt-0.5">装机 × 小时 × 0.8</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-xs text-muted-foreground mb-1">首年年收益</p>
            <p class="text-lg font-bold text-foreground">{{ formatMoney2(revenue.total) }}<span class="text-xs font-normal text-muted-foreground ml-1">元</span></p>
            <p class="text-[11px] text-muted-foreground mt-0.5">自用 + 上网合计</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-xs text-muted-foreground mb-1">25 年累计净收益</p>
            <p class="text-lg font-bold" :class="netProfit25 >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">{{ formatMoney2(netProfit25) }}<span class="text-xs font-normal text-muted-foreground ml-1">元</span></p>
            <p class="text-[11px] text-muted-foreground mt-0.5">含年均 {{ fmtPrice(decayNum) }}% 衰减递减</p>
          </div>
        </div>

        <!-- 收益明细 -->
        <div v-if="revenue.total > 0" class="overflow-x-auto rounded-lg border border-border">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-muted/50 text-muted-foreground">
                <th class="px-3 py-2 text-left font-medium">去向</th>
                <th class="px-3 py-2 text-right font-medium">年电量</th>
                <th class="px-3 py-2 text-right font-medium">电价</th>
                <th class="px-3 py-2 text-right font-medium">年收益</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr>
                <td class="px-3 py-2 text-foreground">自用（替代市电）</td>
                <td class="px-3 py-2 text-right font-mono text-foreground">{{ fmtQty(revenue.selfKwh) }} kWh</td>
                <td class="px-3 py-2 text-right font-mono text-foreground">{{ fmtPrice(selfPriceNum) }} 元</td>
                <td class="px-3 py-2 text-right font-mono text-foreground font-semibold">{{ formatMoney2(revenue.selfAmount) }} 元</td>
              </tr>
              <tr>
                <td class="px-3 py-2 text-foreground">上网（卖给电网）</td>
                <td class="px-3 py-2 text-right font-mono text-foreground">{{ fmtQty(revenue.feedKwh) }} kWh</td>
                <td class="px-3 py-2 text-right font-mono text-foreground">{{ fmtPrice(feedPriceNum) }} 元</td>
                <td class="px-3 py-2 text-right font-mono text-foreground font-semibold">{{ formatMoney2(revenue.feedAmount) }} 元</td>
              </tr>
              <tr class="bg-primary/5">
                <td class="px-3 py-2 font-semibold text-foreground">合计</td>
                <td class="px-3 py-2 text-right font-mono text-foreground font-semibold">{{ fmtQty(genKwh) }} kWh</td>
                <td class="px-3 py-2 text-right text-muted-foreground">—</td>
                <td class="px-3 py-2 text-right font-mono text-primary font-bold">{{ formatMoney2(revenue.total) }} 元</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 25 年口径 -->
        <div v-if="paybackNum !== null" class="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
          <h3 class="text-sm font-semibold text-foreground">25 年口径（年均 {{ fmtPrice(decayNum) }}% 线性衰减，第 n 年 = 首年 × (1 − 衰减 × (n−1))）</h3>
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-background border border-border rounded-lg p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">25 年累计发电量</p>
              <p class="text-lg font-bold text-foreground">{{ fmtQty(cumGen25) }}<span class="text-xs font-normal text-muted-foreground ml-1">kWh</span></p>
            </div>
            <div class="bg-background border border-border rounded-lg p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">25 年累计收益</p>
              <p class="text-lg font-bold text-foreground">{{ formatMoney2(cumRevenue25) }}<span class="text-xs font-normal text-muted-foreground ml-1">元</span></p>
            </div>
            <div class="bg-background border border-border rounded-lg p-3 text-center">
              <p class="text-xs text-muted-foreground mb-1">扣除投资后净收益</p>
              <p class="text-lg font-bold" :class="netProfit25 >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">{{ formatMoney2(netProfit25) }}<span class="text-xs font-normal text-muted-foreground ml-1">元</span></p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            第 25 年出力约为首年的 {{ Math.round(year25Factor * 100) }}%；以上为理想口径，未含运维、逆变器更换、限电与电价波动。
          </p>
        </div>

        <!-- 回验与自检锚点 -->
        <div class="bg-muted/50 border border-border rounded-lg p-3 text-xs leading-relaxed text-muted-foreground">
          <p>
            回验：{{ fmtQty(capacityNum) }} kW × {{ fmtQty(hoursNum) }} h × 0.8 = {{ fmtQty(genKwh) }} kWh；
            自用 {{ fmtQty(revenue.selfKwh) }} kWh × {{ fmtPrice(selfPriceNum) }} 元 + 上网 {{ fmtQty(revenue.feedKwh) }} kWh × {{ fmtPrice(feedPriceNum) }} 元
            = 首年年收益 {{ formatMoney2(revenue.total) }} 元；回本 = 投资 {{ formatMoney2(costNum) }} 元 ÷ {{ formatMoney2(revenue.total) }} 元 = {{ paybackNum !== null ? fmtYear(paybackNum) : '—' }} 年。
          </p>
          <p class="mt-1.5">
            自检锚点（锁进随页自测）：10 kW × 1200 h × 0.8 = 9,600 kWh；3 元/W × 10 kW = 30,000 元；
            全额上网 0.5 元/kWh → 年收益 4,800 元 → 回本 6.25 年；本页默认参数（自用 30%、自用 0.55 / 上网 0.39）→ 年收益 4,204.80 元 → 回本约 7.13 年。
          </p>
        </div>

        <!-- 免责声明（固定） -->
        <p class="text-[11px] leading-relaxed text-muted-foreground/80 border-t border-border pt-3">
          {{ DISCLAIMER }}
        </p>
      </div>
    </div>

    <!-- 诚实卡：决策前必读的风险 -->
    <div class="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-5 space-y-2.5">
      <h2 class="text-base font-semibold text-foreground flex items-center">
        <ShieldAlert class="w-5 h-5 mr-2 text-amber-500" /> 决策前必读：算得出来 ≠ 装得成、赚得到
      </h2>
      <ul class="space-y-2 text-sm text-muted-foreground leading-relaxed">
        <li class="flex items-start gap-1.5">
          <span class="mt-0.5 text-amber-500">•</span>
          <span><span class="text-foreground">补贴政策已退坡</span>：国家层面户用补贴已结束，个别地方补贴以当地发改 / 电网文件为准，不要把补贴计入回本依据。</span>
        </li>
        <li class="flex items-start gap-1.5">
          <span class="mt-0.5 text-amber-500">•</span>
          <span><span class="text-foreground">屋顶产权与物业同意</span>：农村自建房、城市小区屋顶的产权 / 使用权必须清晰，小区还需物业与业主同意，否则无法并网。</span>
        </li>
        <li class="flex items-start gap-1.5">
          <span class="mt-0.5 text-amber-500">•</span>
          <span><span class="text-foreground">并网手续与消纳</span>：需向电网公司申请（备案、装表、签购售电合同），部分地区变压器容量有限、存在限电或暂缓受理的可能。</span>
        </li>
        <li class="flex items-start gap-1.5">
          <span class="mt-0.5 text-amber-500">•</span>
          <span><span class="text-foreground">组件 25 年功率质保 ≠ 收益保证</span>：质保承诺的是功率衰减上限，不是发电收益；逆变器通常 10 年左右需更换，是一笔额外支出。</span>
        </li>
        <li class="flex items-start gap-1.5">
          <span class="mt-0.5 text-amber-500">•</span>
          <span><span class="text-foreground">台风、冰雹等极端天气风险</span>：支架抗风与组件抗冲击等级要核对，损失可能不在质保范围内；建议确认财产 / 光伏保险条款。</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>光伏并网回本计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          光伏并网回本计算器是一款面向<strong class="text-foreground">家庭并网电站</strong>的投资收益试算工具。它回答三个问题：
          一年能发多少电（装机 × 年有效利用小时 × 系统效率 0.8）、一年能赚多少钱（自用电量 × 自用电价 + 上网电量 × 上网电价的双电价口径）、
          几年能回本（总投资 ÷ 年收益的静态回本年限），并按年均衰减率逐年递减累加出 25 年累计净收益。
          年有效利用小时附一类 / 二类 / 三类资源区的常识参考区间，投资支持「元/W × 装机」与「总价直填」两种口径，
          方便直接拿报价单比价。全部计算在浏览器本地完成，参数暂存本机 localStorage，不上传任何数据。
        </p>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          与本站 <NuxtLink to="/tools/solar-panel-sizer" class="text-primary hover:underline">太阳能离网配置计算器</NuxtLink>
          分工不同：那个页面解决「没有电网时怎么配系统」（负载清单 → 电池容量 → 板功率 → 控制器，按最差月保供电）；
          本页解决「并网了划算不划算」（发电量、双电价收益、回本、25 年收益），不做离网选型。
          家用电器的耗电与电费估算可参考 <NuxtLink to="/tools/electricity-calculator" class="text-primary hover:underline">电器耗电量计算器</NuxtLink>。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">什么时候会用到？</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed mb-4">
          <li><strong class="text-foreground">装前测算</strong>：屋顶大概能装几 kW、当地利用小时多少，先估一遍回本年限再决定要不要深入询价。</li>
          <li><strong class="text-foreground">报价比价</strong>：把各家报价单的元/W（或总价）填进来，同口径下比回本年限与 25 年净收益。</li>
          <li><strong class="text-foreground">自用比例决策</strong>：对比全额上网与提高自用比例（错峰用电 / 加装储能）两种方案的收益差。</li>
          <li><strong class="text-foreground">资源区初筛</strong>：用一类 / 二类 / 三类资源区常识区间快速判断项目所在地大致收益水平。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">计算公式与口径</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed mb-2">
          <li><strong class="text-foreground">年发电量</strong> = 装机容量（kW）× 年有效利用小时（h）× 系统效率 0.8（固定系数，已覆盖逆变器效率、直流线损、灰尘遮挡与温度折损）</li>
          <li><strong class="text-foreground">年收益</strong> = 自用电量 × 自用电价 + 上网电量 × 上网电价（自用电量 = 年发电量 × 自用比例，其余上网）</li>
          <li><strong class="text-foreground">静态回本年限</strong> = 系统总投资 ÷ 年收益（未含资金折现、电价波动与运维费用）</li>
          <li><strong class="text-foreground">25 年累计净收益</strong> = Σ 第 n 年收益 − 总投资，其中第 n 年收益 = 首年收益 × (1 − 年衰减率 × (n−1))，年均衰减简化口径</li>
        </ul>
        <p class="text-xs text-muted-foreground leading-relaxed mb-4">
          组件实际衰减为首年约 2%、其后每年约 0.4~0.55% 线性，本页按年均衰减率简化逐年递减；若需要逐年精确曲线，请以组件厂商质保函为准。
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

    <RelatedTools :current-tool-id="'solar-payback-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Sun, Info, Calculator, TriangleAlert, ShieldAlert,
  ChevronUp, ChevronDown, RefreshCw, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const DISCLAIMER = '本页为静态数学演算与常识参考，不构成投资建议或收益承诺；电价、利用小时、衰减与政策以当地电网、气象数据与主管部门文件为准。'

// ---------- FAQ（页面 SEO 区与 JSON-LD FAQPage 共用） ----------
const faqs = [
  {
    q: '家庭光伏电站一般几年回本？',
    a: '按本页默认参数（10 kW、1200 h、自用比例 30%、自用 0.55 / 上网 0.39 元、3 元/W）测算约 7.13 年；若全额上网按 0.5 元/kWh 则约 6.25 年。常见家庭并网电站静态回本约 5~10 年，取决于当地辐照（利用小时）、系统报价与自用比例，建议用自己的实际参数试算。'
  },
  {
    q: '自用比例为什么对收益影响很大？',
    a: '自用部分替代的是 0.5~0.6 元/度的市电，上网部分只拿约 0.35~0.45 元/度的燃煤基准价口径电价，每度自用比上网多赚 0.1~0.25 元。白天用电多的家庭（自住、居家办公、有冰箱空调常载）自用比例高、收益更好；纯全额上网则完全按上网电价结算。'
  },
  {
    q: '年有效利用小时数怎么取？',
    a: '常识参考区间：一类资源区（西北 / 高原）1400 h 以上，二类资源区（华北 / 黄淮）1100–1400 h，三类资源区（长江中下游 / 西南 / 华南）900–1100 h。精确值请查 Global Solar Atlas、NASA POWER 或当地气象局辐照数据，并结合屋顶朝向、倾角与遮挡修正，以当地实际为准。'
  },
  {
    q: '25 年累计净收益是怎么算的？',
    a: '按年均衰减率逐年递减累加：第 n 年收益 = 首年收益 × (1 − 年衰减率 × (n−1))，把 25 年加总后减去系统总投资。默认年衰减 0.5% 时，第 25 年出力约为首年的 88%。组件实际衰减为首年约 2%、其后每年约 0.4~0.55% 线性，年均口径是简化近似。'
  },
  {
    q: '这个工具和「太阳能离网配置计算器」有什么区别？',
    a: '本工具面向并网系统：电价结算、不需要电池，算的是发电量、双电价收益、回本年限与 25 年累计净收益。离网配置计算器面向无电网场景（房车、船屋、庭院、基站等）：按最差月峰值日照配板功率、按自给天数与放电深度配电池容量、再选控制器，目标是保供电不断电。装并网电站看本页，离网选型用离网页。'
  }
]

// ---------- SEO ----------
useSeoMeta({
  title: '光伏并网回本计算器 - 家庭光伏发电年收益与回本年限测算 | 有条工具',
  description: '免费在线光伏并网回本计算器：装机×年有效利用小时×0.8 算年发电量，自用+上网双电价算年收益，静态回本年限与含衰减的25年累计净收益，一二三类资源区利用小时参考，元/W或总价投资口径，本地运行不上传',
  keywords: '光伏回本, 家庭光伏收益, 光伏发电划算吗, 太阳能发电回本, 光伏投资, 并网光伏, 光伏年发电量',
  author: '有条工具',
  ogTitle: '光伏并网回本计算器 - 家庭光伏年收益与回本年限测算 | 有条工具',
  ogDescription: '装机×利用小时×0.8 算发电量，自用+上网双电价算收益，静态回本与 25 年累计净收益一目了然。',
  ogUrl: 'https://www.util.cn/tools/solar-payback-calculator',
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
          name: '光伏并网回本计算器',
          url: 'https://www.util.cn/tools/solar-payback-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '年发电量 = 装机 × 年有效利用小时 × 系统效率 0.8',
            '自用 + 上网双电价分开计收益',
            '元/W × 装机 或 总价直填两种投资口径',
            '静态回本年限（总投资 ÷ 年收益）',
            '25 年累计净收益（含年均衰减逐年递减）',
            '一类/二类/三类资源区利用小时常识参考',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '光伏并网回本', item: 'https://www.util.cn/tools/solar-payback-calculator/' }
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
// 约定：容量单位 kW，电量单位 kWh，金额单位元；系统效率 0.8 为固定系数；
// 衰减为年均线性口径：第 n 年 = 首年 × max(0, 1 − 衰减 × (n−1))。
// 本区不依赖 Vue / 浏览器 API，可原样抽入测试。

// 系统效率固定系数（覆盖逆变器效率、直流线损、灰尘遮挡与温度折损）
const SYSTEM_EFF = 0.8

// 输入归一化：非有限数按 0
function numOr0(v) {
  const n = Number(v)
  return isFinite(n) ? n : 0
}

// 年发电量（kWh）= 装机 kW × 年有效利用小时 × 0.8（负值归 0）
function annualGenerationKwh(capacityKw, sunHours) {
  return Math.max(0, numOr0(capacityKw)) * Math.max(0, numOr0(sunHours)) * SYSTEM_EFF
}

// 系统投资（元）：perWatt 模式 = 元/W × kW × 1000；total 模式 = 总价直填
function systemCost(capacityKw, costMode, perWatt, total) {
  if (costMode === 'total') return Math.max(0, numOr0(total))
  return Math.max(0, numOr0(perWatt)) * Math.max(0, numOr0(capacityKw)) * 1000
}

// 年收益拆分（元）：自用电量 × 自用电价 + 上网电量 × 上网电价；比例按 0~1 截断
function annualRevenueKwh(genKwh, selfUseRatio, selfPrice, feedPrice) {
  const g = Math.max(0, numOr0(genKwh))
  const r = Math.min(1, Math.max(0, numOr0(selfUseRatio)))
  const sp = Math.max(0, numOr0(selfPrice))
  const fp = Math.max(0, numOr0(feedPrice))
  const selfKwh = g * r
  const feedKwh = g * (1 - r)
  const selfAmount = selfKwh * sp
  const feedAmount = feedKwh * fp
  return { selfKwh, feedKwh, selfAmount, feedAmount, total: selfAmount + feedAmount }
}

// 静态回本年限（年）= 投资 ÷ 年收益；投资或年收益非正 → null（无法回本 / 除零）
function paybackYears(cost, annualRevenue) {
  const c = numOr0(cost)
  const r = numOr0(annualRevenue)
  if (!(c > 0) || !(r > 0)) return null
  return c / r
}

// 含衰减的累计值（发电量或收益通用）：Σ_{n=1..years} base × max(0, 1 − decay × (n−1))
// 重衰减使系数触 0 后按 0 计（不再为负）。
function cumulativeWithDecay(years, base, decayRate) {
  const y = Math.floor(Math.max(0, numOr0(years)))
  const b = Math.max(0, numOr0(base))
  const d = Math.max(0, numOr0(decayRate))
  let total = 0
  for (let n = 1; n <= y; n++) total += b * Math.max(0, 1 - d * (n - 1))
  return total
}

// 自测断言集（锚点链路 / 默认参数 / 全自用与比例越界 / 衰减累加与 clamp / 除零 / 非法输入）
function runSolarPaybackSelfTests() {
  const t = []
  const eq = (name, got, want, tol) => {
    const e = typeof tol === 'number' ? tol : 1e-9
    const ok = (typeof got === 'string' || typeof want === 'string')
      ? got === want
      : ((got === null || want === null) ? got === want : Math.abs(got - want) <= e)
    t.push({ name, got, want, pass: ok })
  }
  // 锚点：10kW × 1200h × 0.8 = 9600 kWh；3 元/W × 10kW = 30000 元；全额上网 0.5 元 → 4800 元/年 → 回本 6.25 年
  const g0 = annualGenerationKwh(10, 1200)
  eq('锚点·年发电量 9600 kWh', g0, 9600)
  eq('锚点·系统效率固定 0.8（发电量 ÷ (10×1200)）', g0 / (10 * 1200), 0.8)
  eq('锚点·投资 30000 元（3 元/W × 10kW）', systemCost(10, 'perWatt', 3, 0), 30000)
  const rev0 = annualRevenueKwh(g0, 0, 0.55, 0.5)
  eq('锚点·全额上网年收益 4800 元（0.5 元/kWh）', rev0.total, 4800)
  eq('锚点·静态回本 6.25 年', paybackYears(30000, 4800), 6.25)
  // 链路闭环：发电量 → 收益 → 回本 与手算互相咬合
  eq('链路·发电量×电价=收益（9600×0.5）', rev0.total, 10 * 1200 * 0.8 * 0.5)
  eq('链路·投资÷收益=回本（30000÷4800）', paybackYears(systemCost(10, 'perWatt', 3, 0), rev0.total), (3 * 10 * 1000) / (10 * 1200 * 0.8 * 0.5))
  // 默认参数：自用 30%，自用 0.55 / 上网 0.39
  const rd = annualRevenueKwh(9600, 0.3, 0.55, 0.39)
  eq('默认·自用电量 2880 kWh', rd.selfKwh, 2880)
  eq('默认·上网电量 6720 kWh', rd.feedKwh, 6720)
  eq('默认·自用金额 1584 元', rd.selfAmount, 1584)
  eq('默认·上网金额 2620.80 元', rd.feedAmount, 2620.8)
  eq('默认·年收益 4204.80 元', rd.total, 9600 * (0.3 * 0.55 + 0.7 * 0.39))
  eq('默认·静态回本 ≈7.1347 年', paybackYears(30000, rd.total), 30000 / (9600 * (0.3 * 0.55 + 0.7 * 0.39)))
  // 全自用与比例越界
  eq('全自用·收益 5280 元', annualRevenueKwh(9600, 1, 0.55, 0.39).total, 5280)
  eq('越界·150% 按 100% 计 5280 元', annualRevenueKwh(9600, 1.5, 0.55, 0.39).total, 5280)
  eq('越界·-20% 按 0% 计 3744 元', annualRevenueKwh(9600, -0.2, 0.55, 0.39).total, 3744)
  // 25 年衰减累加（年均口径）：Σ 系数 = 25 − 0.005×300 = 23.5
  eq('衰减·25年累计系数 23.5', cumulativeWithDecay(25, 1, 0.005), 23.5)
  eq('衰减·25年累计收益 112800（4800×23.5）', cumulativeWithDecay(25, 4800, 0.005), 4800 * 23.5)
  eq('衰减·0衰减 25年 120000', cumulativeWithDecay(25, 4800, 0), 120000)
  eq('衰减·净收益 82800（全额上网锚点口径）', cumulativeWithDecay(25, 4800, 0.005) - 30000, 82800)
  eq('衰减·重衰减 clamp（5%×25年 → 4800×10.5）', cumulativeWithDecay(25, 4800, 0.05), 4800 * 10.5)
  eq('默认·25年累计净收益 68812.80', cumulativeWithDecay(25, rd.total, 0.005) - 30000, 4204.8 * 23.5 - 30000)
  // 除零与非法输入
  eq('除零·年收益 0 → 回本 null', paybackYears(30000, 0), null)
  eq('除零·投资 0 → 回本 null', paybackYears(0, 4800), null)
  eq('非法·小时数 -5 → 发电 0', annualGenerationKwh(10, -5), 0)
  eq('非法·容量 NaN → 发电 0', annualGenerationKwh(NaN, 1200), 0)
  eq('投资模式·总价直填 25000 不受元/W 影响', systemCost(10, 'total', 99, 25000), 25000)
  return t
}
/* ==== 纯函数（node 自测提取区）end ==== */

// ---------- 资源区与快捷比例（常识参考，可编辑） ----------
const ZONE_PRESETS = [
  { key: 'z1', label: '一类资源区', range: '1400 h 以上', hours: 1500 },
  { key: 'z2', label: '二类资源区', range: '1100–1400 h', hours: 1250 },
  { key: 'z3', label: '三类资源区', range: '900–1100 h', hours: 1000 }
]
const RATIO_PRESETS = [
  { value: 0, label: '0% 全额上网' },
  { value: 30, label: '30%' },
  { value: 50, label: '50%' },
  { value: 80, label: '80%' },
  { value: 100, label: '100% 全自用' }
]

// ---------- 输入状态 ----------
// 隐私说明：参数仅暂存本机 localStorage，不上传；读写全程 try/catch，
// 浏览器 API 只在 onMounted 与事件回调内使用，SSR 安全。
const STORAGE_KEY = 'util-solar-payback-calculator'
const DEFAULTS = { capacity: 10, hours: 1200, ratio: 30, selfPrice: 0.55, feedPrice: 0.39, costMode: 'perWatt', perWatt: 3, total: 30000, decay: 0.5 }
const EXAMPLE = { capacity: 10, hours: 1200, ratio: 30, selfPrice: 0.55, feedPrice: 0.39, costMode: 'perWatt', perWatt: 3, total: 30000, decay: 0.5 }

const capacityInput = ref(EXAMPLE.capacity)
const hoursInput = ref(EXAMPLE.hours)
const ratioInput = ref(EXAMPLE.ratio)
const selfPriceInput = ref(EXAMPLE.selfPrice)
const feedPriceInput = ref(EXAMPLE.feedPrice)
const costMode = ref(EXAMPLE.costMode)
const perWattInput = ref(EXAMPLE.perWatt)
const totalInput = ref(EXAMPLE.total)
const decayInput = ref(EXAMPLE.decay)
const seoContentVisible = ref(true)

// ---------- 归一化 ----------
const capacityNum = computed(() => Math.max(0, numOr0(capacityInput.value)))
const hoursNum = computed(() => Math.max(0, numOr0(hoursInput.value)))
const ratioNum = computed(() => Math.min(100, Math.max(0, numOr0(ratioInput.value))) / 100)
const selfPriceNum = computed(() => Math.max(0, numOr0(selfPriceInput.value)))
const feedPriceNum = computed(() => Math.max(0, numOr0(feedPriceInput.value)))
const decayNum = computed(() => Math.max(0, numOr0(decayInput.value)))

// ---------- 核心计算 ----------
const genKwh = computed(() => annualGenerationKwh(capacityNum.value, hoursNum.value))
const costNum = computed(() => systemCost(capacityNum.value, costMode.value, perWattInput.value, totalInput.value))
const revenue = computed(() => annualRevenueKwh(genKwh.value, ratioNum.value, selfPriceNum.value, feedPriceNum.value))
const paybackNum = computed(() => paybackYears(costNum.value, revenue.value.total))
const cumGen25 = computed(() => cumulativeWithDecay(25, genKwh.value, decayNum.value / 100))
const cumRevenue25 = computed(() => cumulativeWithDecay(25, revenue.value.total, decayNum.value / 100))
const netProfit25 = computed(() => cumRevenue25.value - costNum.value)
const year25Factor = computed(() => Math.max(0, 1 - (decayNum.value / 100) * 24))

// ---------- 输入越界提示 ----------
const inputWarning = computed(() => {
  const checks = [
    [capacityInput.value, 0, 1e6],
    [hoursInput.value, 0, 8760],
    [ratioInput.value, 0, 100],
    [selfPriceInput.value, 0, 100],
    [feedPriceInput.value, 0, 100],
    [perWattInput.value, 0, 1000],
    [totalInput.value, 0, 1e8],
    [decayInput.value, 0, 10]
  ]
  const bad = checks.some(([v, min, max]) => {
    if (v === '' || v === null || v === undefined) return false
    const n = Number(v)
    return !isFinite(n) || n < min || n > max
  })
  return bad ? '部分输入超出允许范围，已按 0 参与计算（容量、小时、比例、电价、投资与衰减需为合法非负数）。' : ''
})

// ---------- 格式化 ----------
function formatMoney2(v) {
  const n = Number(v)
  if (!isFinite(n)) return '—'
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtQty(v) {
  const n = Number(v)
  if (!isFinite(n)) return '0'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
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
  capacityInput.value = EXAMPLE.capacity
  hoursInput.value = EXAMPLE.hours
  ratioInput.value = EXAMPLE.ratio
  selfPriceInput.value = EXAMPLE.selfPrice
  feedPriceInput.value = EXAMPLE.feedPrice
  costMode.value = EXAMPLE.costMode
  perWattInput.value = EXAMPLE.perWatt
  totalInput.value = EXAMPLE.total
  decayInput.value = EXAMPLE.decay
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
      capacity: capacityInput.value,
      hours: hoursInput.value,
      ratio: ratioInput.value,
      selfPrice: selfPriceInput.value,
      feedPrice: feedPriceInput.value,
      costMode: costMode.value,
      perWatt: perWattInput.value,
      total: totalInput.value,
      decay: decayInput.value
    }))
  } catch (e) { /* 隐私模式 / 配额溢出，忽略 */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const s = JSON.parse(raw)
    if (!s || typeof s !== 'object') return
    if (typeof s.capacity === 'number') capacityInput.value = s.capacity
    if (typeof s.hours === 'number') hoursInput.value = s.hours
    if (typeof s.ratio === 'number') ratioInput.value = s.ratio
    if (typeof s.selfPrice === 'number') selfPriceInput.value = s.selfPrice
    if (typeof s.feedPrice === 'number') feedPriceInput.value = s.feedPrice
    if (s.costMode === 'perWatt' || s.costMode === 'total') costMode.value = s.costMode
    if (typeof s.perWatt === 'number') perWattInput.value = s.perWatt
    if (typeof s.total === 'number') totalInput.value = s.total
    if (typeof s.decay === 'number') decayInput.value = s.decay
  } catch (e) { /* 解析失败，保持默认 */ }
}

watch(
  [capacityInput, hoursInput, ratioInput, selfPriceInput, feedPriceInput, costMode, perWattInput, totalInput, decayInput],
  () => saveState()
)

onMounted(() => {
  loadState()
  addRecentTool('solar-payback-calculator')
  // 纯函数自测（锚点链路 / 默认参数 / 越界 / 衰减累加 / 除零 / 非法输入），仅控制台输出
  const results = runSolarPaybackSelfTests()
  const failed = results.filter((r) => !r.pass)
  if (failed.length > 0) {
    console.warn(`[solar-payback-calculator] 自测 ${failed.length}/${results.length} 条未通过`, failed)
  } else {
    console.info(`[solar-payback-calculator] 自测通过 ${results.length}/${results.length} 条断言`)
  }
})
</script>
