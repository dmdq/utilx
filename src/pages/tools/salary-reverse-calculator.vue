<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ArrowLeftRight class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">税前税后互推计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">给目标到手反推税前工资，或输入税前算到手：五险一金 + 专项附加扣除 + 累计预扣个税，与站内个税计算器同口径</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        税前税后工资互推工具：正向输入税前月薪，依次扣除五险一金个人部分（养老 8% + 医疗 2% + 失业 0.5%，公积金另按比例）、
        专项附加扣除（月均）与 5000 元基本减除费用，按累计预扣法（年综合所得税率表，与站内税务计算器同口径）计算个人所得税，
        得到手月薪；反向输入目标到手，用二分法迭代（误差 &lt; 0.01 元）反推所需税前工资。
        结果同时给出「月均口径」与「逐月累计预扣循环表」——真实累计预扣下首月个税低、年末个税高，全年合计与月均口径一致，页面已注明差异与适用场景。
        金额全部按 0.01 元定点处理，纯浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <!-- 模式切换 -->
    <div class="mb-6">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="m in MODES"
          :key="m.id"
          type="button"
          @click="mode = m.id"
          class="px-4 py-2 rounded-lg text-sm font-medium transition"
          :class="mode === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'"
        >
          {{ m.label }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> {{ mode === 'forward' ? '税前 → 到手' : '到手 → 税前' }}：输入参数
          </h2>
          <button
            type="button"
            class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
            @click="loadExample"
          >
            示例数据
          </button>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">{{ mode === 'forward' ? '税前月薪（元）' : '目标到手月薪（元）' }}</label>
          <input
            v-if="mode === 'forward'"
            v-model.number="grossInput"
            type="number"
            min="0"
            step="100"
            :class="SEL_CLS"
            placeholder="20000"
          />
          <input
            v-else
            v-model.number="targetNetInput"
            type="number"
            min="0"
            step="100"
            :class="SEL_CLS"
            placeholder="16730"
          />
        </div>

        <!-- 五险一金 -->
        <div class="border-t border-border pt-4 space-y-3">
          <p class="text-sm font-medium text-foreground">五险一金（个人缴纳部分）</p>
          <div>
            <label class="block text-xs text-muted-foreground mb-1">缴费基数档</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="b in BASE_MODES"
                :key="b.id"
                type="button"
                @click="baseMode = b.id"
                class="px-2 py-2 rounded-lg border text-xs font-medium transition"
                :class="baseMode === b.id ? BTN_ON : BTN_OFF"
              >
                {{ b.label }}
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {{ baseModeTip }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-muted-foreground mb-1">基数下限（元 / 月）</label>
              <input v-model.number="baseFloor" type="number" min="0" step="100" :class="SEL_CLS" />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">基数上限（元 / 月）</label>
              <input v-model.number="baseCap" type="number" min="0" step="500" :class="SEL_CLS" />
            </div>
          </div>
          <div>
            <label class="block text-xs text-muted-foreground mb-1">公积金个人比例（%，无则填 0）</label>
            <input v-model.number="fundPct" type="number" min="0" max="12" step="1" :class="SEL_CLS" placeholder="0" />
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            个人比例口径：养老 8% + 医疗 2% + 失业 0.5% = 10.5%（多数城市常见值，各地略有差异，如部分城市失业为 0.2%-1%）；
            公积金个人比例一般 5%-12%，由单位选择，按当地基数上下限执行。公积金比例计入后，个人缴纳的公积金在限额内免征个税。
          </p>
        </div>

        <!-- 专项附加扣除（月均，与站内税务计算器同结构） -->
        <div class="border-t border-border pt-4 space-y-2">
          <p class="text-sm font-medium text-foreground">专项附加扣除（月均，元）</p>
          <div v-for="d in SPECIAL_FIELDS" :key="d.key" class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">{{ d.label }}</span>
            <input
              v-model.number="specials[d.key]"
              type="number"
              min="0"
              step="100"
              class="w-32 px-2 py-1 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            与站内<a href="/tools/tax-calculator/" class="text-primary underline">税务计算器</a>同口径：子女教育 / 继续教育 / 住房贷款利息 / 住房租金 / 赡养老人。
            住房贷款利息与住房租金不可同时享受；此处填每月分摊额（年扣除额 ÷ 12）。
          </p>
        </div>
      </div>

      <!-- 结果区 -->
      <div class="space-y-4">
        <!-- 反推失败提示 -->
        <div v-if="mode === 'reverse' && reverseResult && !reverseResult.ok" class="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 text-sm text-amber-700">
          目标到手超出可实现的范围（可能过高或低于五险一金后余额），请检查输入数值与基数档设置。
        </div>

        <!-- 月均口径汇总卡 -->
        <div v-if="summary" class="bg-muted/50 rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-foreground">计算结果（月均口径）</h3>
            <button
              type="button"
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground flex items-center gap-1"
              @click="copyResult"
            >
              <Copy class="w-3.5 h-3.5" /> 复制结果
            </button>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="bg-background border border-border rounded-lg p-3">
              <p class="text-xs text-muted-foreground">{{ mode === 'forward' ? '税前月薪' : '反推税前月薪' }}</p>
              <p class="text-lg font-semibold text-foreground">¥{{ money(summary.gross) }}</p>
            </div>
            <div class="bg-background border border-border rounded-lg p-3">
              <p class="text-xs text-muted-foreground">五险一金个人部分</p>
              <p class="text-lg font-semibold text-amber-600">-¥{{ money(summary.social) }}</p>
            </div>
            <div class="bg-background border border-border rounded-lg p-3">
              <p class="text-xs text-muted-foreground">月应纳税所得额</p>
              <p class="text-lg font-semibold text-foreground">¥{{ money(summary.taxable) }}</p>
            </div>
            <div class="bg-background border border-border rounded-lg p-3">
              <p class="text-xs text-muted-foreground">个人所得税（月均）</p>
              <p class="text-lg font-semibold text-red-600">-¥{{ money(summary.tax) }}</p>
            </div>
            <div class="col-span-2 bg-primary/10 border border-primary/30 rounded-lg p-3">
              <p class="text-xs text-primary/80">{{ mode === 'forward' ? '到手月薪（月均）' : '校验到手月薪（月均）' }}</p>
              <p class="text-2xl font-bold text-primary">¥{{ money(summary.net) }}</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            适用税率档：{{ summary.bracketLabel }}（按年累计预扣的月均口径；基本减除费用 5000 元/月，专项附加扣除月均 ¥{{ money(summary.special) }}/月）。
            <template v-if="mode === 'reverse'">二分法迭代 {{ BISECT_ITERS }} 次收敛，到手误差 &lt; ¥0.01。</template>
          </p>
        </div>

        <!-- 逐月累计预扣循环表 -->
        <div v-if="summary && cycleRows.length" class="bg-muted/50 rounded-xl p-4">
          <h3 class="font-semibold text-foreground mb-2">逐月累计预扣循环表（月薪恒定时）</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-xs border-collapse">
              <thead>
                <tr class="text-muted-foreground border-b border-border">
                  <th class="px-2 py-1.5 text-left">月份</th>
                  <th class="px-2 py-1.5 text-right">税前</th>
                  <th class="px-2 py-1.5 text-right">五险一金</th>
                  <th class="px-2 py-1.5 text-right">累计应纳税所得额</th>
                  <th class="px-2 py-1.5 text-right">当月个税</th>
                  <th class="px-2 py-1.5 text-right">当月到手</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in cycleRows" :key="r.month" class="border-b border-border/60">
                  <td class="px-2 py-1.5">{{ r.month }} 月</td>
                  <td class="px-2 py-1.5 text-right tabular-nums">{{ money(r.gross) }}</td>
                  <td class="px-2 py-1.5 text-right tabular-nums">{{ money(r.social) }}</td>
                  <td class="px-2 py-1.5 text-right tabular-nums">{{ money(r.cumTaxable) }}</td>
                  <td class="px-2 py-1.5 text-right tabular-nums text-red-600">{{ money(r.monthTax) }}</td>
                  <td class="px-2 py-1.5 text-right tabular-nums text-green-700">{{ money(r.monthNet) }}</td>
                </tr>
                <tr class="font-semibold">
                  <td class="px-2 py-1.5">全年</td>
                  <td class="px-2 py-1.5 text-right tabular-nums">{{ money(cycleTotal.gross) }}</td>
                  <td class="px-2 py-1.5 text-right tabular-nums">{{ money(cycleTotal.social) }}</td>
                  <td class="px-2 py-1.5 text-right tabular-nums">—</td>
                  <td class="px-2 py-1.5 text-right tabular-nums text-red-600">{{ money(cycleTotal.tax) }}</td>
                  <td class="px-2 py-1.5 text-right tabular-nums text-green-700">{{ money(cycleTotal.net) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            累计预扣法下，年初累计应纳税所得额低、适用低税率档，<strong>首月个税最低</strong>；随着累计额攀升跳档，<strong>年末月份个税最高</strong>；
            全年合计与「月均口径」完全一致。因此拿 1 月到手对比 offer 时会偏高，请以月均或全年口径比较（首月 / 年末差异说明见下方 SEO 区）。
          </p>
        </div>
      </div>
    </div>

    <!-- 年终奖单独计税联动说明卡 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <div class="flex items-start gap-3">
        <div class="p-2 bg-primary/10 rounded-lg shrink-0">
          <Gift class="w-5 h-5 text-primary" />
        </div>
        <div class="text-sm text-muted-foreground leading-relaxed">
          <p class="font-semibold text-foreground mb-1">年终奖单独计税提示（与月薪互推联动）</p>
          <p>
            全年一次性奖金可选择<strong>单独计税</strong>：奖金 ÷ 12 按月度换算税率表定档，应纳税额 = 奖金 × 税率 − 速算扣除数，每个纳税年度只能用一次，
            且不并入月薪的累计预扣。因此 offer 谈「月薪 × N + 年终奖 M」时，本页算的是 N 的月均到手，M 需单独测算——
            建议配合站内<a href="/tools/year-end-bonus-calculator/" class="text-primary underline">年终奖计算器</a>使用，
            两边相加才是完整的年度现金到手。注意奖金 ÷12 落在税率档临界点（如 36000、144000）时存在「多发一元、多缴数千元」的无效区间，可参考该工具的避坑建议。
          </p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="group bg-card border border-border rounded-lg mb-12">
      <summary class="cursor-pointer select-none px-6 py-4 text-lg font-semibold text-foreground flex items-center justify-between">
        <span><span class="text-primary mr-2">#</span>为什么到手 ≠ 税前 − 个税？公式与口径说明</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div class="px-6 pb-6">
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          到手工资不等于税前减个税，中间还隔着一层<strong>五险一金个人缴纳部分</strong>：养老 8% + 医疗 2% + 失业 0.5%（多数城市个人合计约 10.5%，各地略有差异，
          部分城市失业保险个人为 0.2%-1%），公积金个人比例一般 5%-12% 由单位选择。个税的计税依据也不是税前工资，而是
          <strong>应纳税所得额 = 税前 − 五险一金个人部分 − 专项附加扣除 − 5000 元基本减除费用</strong>。
          本页计算公式：应纳税额 = 应纳税所得额 × 适用税率 − 速算扣除数（按年综合所得 7 级超额累进税率表的月均口径，与站内税务计算器同口径）；
          到手 = 税前 − 五险一金个人部分 − 个税。金额按 0.01 元定点处理。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">综合所得月度换算税率表（年表 ÷ 12，与税务计算器一致）</h3>
        <div class="overflow-x-auto mb-4">
          <table class="w-full border-collapse border border-border text-sm">
            <thead>
              <tr class="bg-muted">
                <th class="border border-border px-3 py-2 text-left">级数</th>
                <th class="border border-border px-3 py-2 text-left">月应纳税所得额（年表换算）</th>
                <th class="border border-border px-3 py-2 text-left">税率</th>
                <th class="border border-border px-3 py-2 text-left">月速算扣除数</th>
              </tr>
            </thead>
            <tbody>
              <tr><td class="border border-border px-3 py-2">1</td><td class="border border-border px-3 py-2">不超过 3,000 元（36,000/年）</td><td class="border border-border px-3 py-2">3%</td><td class="border border-border px-3 py-2">0</td></tr>
              <tr><td class="border border-border px-3 py-2">2</td><td class="border border-border px-3 py-2">3,000-12,000 元（36,000-144,000/年）</td><td class="border border-border px-3 py-2">10%</td><td class="border border-border px-3 py-2">210</td></tr>
              <tr><td class="border border-border px-3 py-2">3</td><td class="border border-border px-3 py-2">12,000-25,000 元（144,000-300,000/年）</td><td class="border border-border px-3 py-2">20%</td><td class="border border-border px-3 py-2">1,410</td></tr>
              <tr><td class="border border-border px-3 py-2">4</td><td class="border border-border px-3 py-2">25,000-35,000 元（300,000-420,000/年）</td><td class="border border-border px-3 py-2">25%</td><td class="border border-border px-3 py-2">2,660</td></tr>
              <tr><td class="border border-border px-3 py-2">5</td><td class="border border-border px-3 py-2">35,000-55,000 元（420,000-660,000/年）</td><td class="border border-border px-3 py-2">30%</td><td class="border border-border px-3 py-2">4,410</td></tr>
              <tr><td class="border border-border px-3 py-2">6</td><td class="border border-border px-3 py-2">55,000-80,000 元（660,000-960,000/年）</td><td class="border border-border px-3 py-2">35%</td><td class="border border-border px-3 py-2">7,160</td></tr>
              <tr><td class="border border-border px-3 py-2">7</td><td class="border border-border px-3 py-2">超过 80,000 元（960,000/年以上）</td><td class="border border-border px-3 py-2">45%</td><td class="border border-border px-3 py-2">15,160</td></tr>
            </tbody>
          </table>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">累计预扣 vs 月度速算：首月与年末为什么不一样？</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          工资薪金个税的实际扣缴方法是<strong>累计预扣法</strong>：累计应纳税所得额 = 截至 当月的应纳税所得额之和，按年税率表算出累计应预扣税额，再减去已预扣部分得到当月扣税。
          月薪恒定时，年初累计额低、落在 3% 档，首月扣税最少；累计额逐月攀升跳入 10%、20% 档后，年末月份扣税明显变高——
          但全年 12 个月合计恰好等于「月均口径」（月应纳税所得额 × 12 找年表、再 ÷ 12）算出的税额。
          因此本页在汇总卡里用月均口径（便于跨 offer 对比、反推税前），同时给出逐月循环表还原真实扣缴节奏；
          「按年累计预扣月均口径估算」的含义即在此：它不是某一个月的真实扣税，而是全年平均后的月度税负。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">offer 对比怎么用？</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          三个口径比总包才公平：① 月薪部分用本页「到手→税前」或「税前→到手」互推成月均到手；② 年终奖用
          <a href="/tools/year-end-bonus-calculator/" class="text-primary underline">年终奖计算器</a>按单独计税测算税后；
          ③ 加总为「年度到手现金」再比较。同城中两家公司五险一金基数档不同（一家按下限、一家按实际工资），税前相同到手也可能差数百元，
          把基数档与公积金比例一并填入本页即可还原差异。需要更细的社保口径（单位部分、医疗档次）可配合
          <a href="/tools/social-insurance-calculator/" class="text-primary underline">五险一金计算器</a>使用。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">口径与来源说明</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          税率表与专项附加扣除结构与站内<a href="/tools/tax-calculator/" class="text-primary underline">税务计算器</a>保持一致（年综合所得 7 级超额累进税率表，
          起征点 5000 元/月）；五险一金个人比例取多数城市常见口径（养老 8%、医疗 2%、失业 0.5%、公积金 0-12% 由单位选择），
          各地比例与基数上下限以当地社保 / 公积金部门公布为准；专项附加扣除标准以《个人所得税专项附加扣除办法》及年度衔接公告为准。
          本页为估算工具，实际到手以工资条与单位扣缴为准。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么到手 16730 元对应的税前是 20000，而不是 16730 ÷ (1−税率)？</h3>
            <p class="text-sm text-muted-foreground mt-1">因为个税是对「应纳税所得额」征税而非对全额工资征税：先扣五险一金 2100 和 5000 减除费用，12900 的应税部分按 20% 档月均缴 1170。简单按比例除会同时错算五险基数与税基，必须逐项扣除后迭代反推（本页二分法误差 &lt; 0.01 元）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">反推结果和工资条对不上？</h3>
            <p class="text-sm text-muted-foreground mt-1">常见原因：① 公积金比例或基数档与公司实际不同；② 专项附加扣除填法不同（本页为月均）；③ 工资条当月是累计预扣的真实扣税，首月低于、年末高于月均口径；④ 存在加班 / 补贴等非固定收入。请按工资条口径调整输入后再比。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">「按基数下限缴」是什么意思？</h3>
            <p class="text-sm text-muted-foreground mt-1">部分公司为控制成本，五险一金按当地基数下限（通常为社平工资的 60%）而非实际工资缴纳，个人部分因此变少、到手变多，但公积金账户入账也变少，且严格来说与「按实际工资足额缴纳」的合规口径存在差异。本页提供下限 / 实际工资 / 上限三档便于模拟。</p>
          </div>
        </div>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :currentToolId="'salary-reverse-calculator'" :category="'finance'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { ArrowLeftRight, Calculator, Copy, Gift, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '税前税后互推计算器 - 到手反推税前工资（五险一金+专项附加扣除+累计预扣）',
  description: '免费在线税前税后工资互推工具：正向算到手、反向二分法反推税前月薪（误差<0.01元），五险一金个人部分（养老8%+医疗2%+失业0.5%+公积金）、专项附加扣除与累计预扣个税，与站内税务计算器同口径，提供逐月累计预扣循环表与首月年末差异说明，年终奖单独计税联动',
  keywords: '税前税后计算,到手反推税前,税后工资计算器,五险一金计算,累计预扣法,个税计算,offer对比,工资互推',
  author: '有条工具',
  ogTitle: '税前税后互推计算器 - 到手反推税前工资 | 有条工具',
  ogDescription: '五险一金 + 专项附加扣除 + 累计预扣同口径互推，逐月循环表与月均口径双视角，误差小于 0.01 元。',
  ogUrl: 'https://www.util.cn/tools/salary-reverse-calculator',
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
          name: '税前税后互推计算器',
          url: 'https://www.util.cn/tools/salary-reverse-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '到手 → 税前：二分法反推，误差 < 0.01 元',
            '税前 → 到手：五险一金 + 专项附加扣除 + 个税逐项扣除',
            '累计预扣法与站内税务计算器同口径（年 7 级超额累进税率表）',
            '月均口径汇总 + 逐月累计预扣循环表（首月 / 年末差异）',
            '五险一金基数档：下限 / 实际工资 / 上限三选',
            '年终奖单独计税联动说明，金额 0.01 元定点'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '财务工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '税前税后互推计算器', item: 'https://www.util.cn/tools/salary-reverse-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么到手 16730 对应税前 20000？',
              acceptedAnswer: { '@type': 'Answer', text: '个税对应纳税所得额征税：税前 20000 先扣五险一金 2100（按 10.5%）和 5000 基本减除费用，应税 12900 按年表月均口径缴个税 1170，到手 16730。按比例直接换算会错算五险基数与税基，需逐项扣除后二分法反推。' }
            },
            {
              '@type': 'Question',
              name: '累计预扣法和月度速算有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '累计预扣法按年初至当月的累计应纳税所得额定档扣税：首月个税最低，年末最高，全年合计等于月均口径。月均口径适合跨 offer 对比与反推，本页两种视角都给出。' }
            },
            {
              '@type': 'Question',
              name: '五险一金个人比例是多少？',
              acceptedAnswer: { '@type': 'Answer', text: '多数城市个人部分为养老 8% + 医疗 2% + 失业 0.5% 合计约 10.5%，公积金个人 5%-12% 由单位选择，各地比例与基数上下限有差异，以当地公布为准。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// 年综合所得 7 级超额累进税率表（与站内 tax-calculator 同口径）：[年应纳税所得额上限, 税率, 速算扣除数]
const ANNUAL_BRACKETS = [
  [36000, 0.03, 0],
  [144000, 0.10, 2520],
  [300000, 0.20, 16920],
  [420000, 0.25, 31920],
  [660000, 0.30, 52920],
  [960000, 0.35, 85920],
  [Infinity, 0.45, 181920]
]

// 月度换算表（年表 ÷ 12）：对恒定月薪，年表法 annualTax(月应税×12)/12 ≡ 月表法 月应税×税率−月速算扣除数
const MONTHLY_BRACKETS = [
  [3000, 0.03, 0],
  [12000, 0.10, 210],
  [25000, 0.20, 1410],
  [35000, 0.25, 2660],
  [55000, 0.30, 4410],
  [80000, 0.35, 7160],
  [Infinity, 0.45, 15160]
]

// 累计应纳税所得额 → 累计应预扣税额（累计预扣法核心）
function annualTaxOn(cumTaxable) {
  const t = Math.max(0, Number(cumTaxable) || 0)
  for (const [limit, rate, quick] of ANNUAL_BRACKETS) {
    if (t <= limit) return t * rate - quick
  }
  return t * 0.45 - 181920
}

// 月均口径个税：月应税 × 12 查年表再 ÷12（等价于月度换算表）
function monthlyAvgTaxOn(monthlyTaxable) {
  return annualTaxOn((Math.max(0, Number(monthlyTaxable) || 0)) * 12) / 12
}

// 月度换算表查档（展示用）
function monthlyBracketOf(monthlyTaxable) {
  const t = Math.max(0, Number(monthlyTaxable) || 0)
  for (let i = 0; i < MONTHLY_BRACKETS.length; i++) {
    const [limit, rate, quick] = MONTHLY_BRACKETS[i]
    if (t <= limit) return { level: i + 1, rate, quick }
  }
  return { level: 7, rate: 0.45, quick: 15160 }
}

// 金额 0.01 元定点：round2 后再格式化（禁止对裸浮点直接 toFixed 链）
function round2(v) {
  const x = Number(v)
  if (!Number.isFinite(x)) return 0
  return Math.round((x + Number.EPSILON) * 100) / 100
}
function money(v) {
  return round2(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 五险一金个人部分：基数档 actual/floor/cap ×（10.5% + 公积金%）
function socialOf(gross, params) {
  const g = Math.max(0, Number(gross) || 0)
  let base = g
  if (params.baseMode === 'floor') base = Math.max(0, Number(params.baseFloor) || 0)
  else if (params.baseMode === 'cap') base = Math.max(0, Number(params.baseCap) || 0)
  const rate = 0.105 + (Number(params.fundPct) || 0) / 100
  return base * rate
}

// 月度汇总（月均口径）：税前 / 五险一金 / 应税 / 个税 / 到手
function calcSummary(gross, params) {
  const g = Math.max(0, Number(gross) || 0)
  const social = socialOf(g, params)
  const special = Math.max(0, Number(params.specialMonthly) || 0)
  const taxable = Math.max(0, g - social - special - 5000)
  const tax = Math.max(0, monthlyAvgTaxOn(taxable))
  const net = g - social - tax
  const bracket = taxable > 0 ? monthlyBracketOf(taxable) : { level: 1, rate: 0.03, quick: 0 }
  const bracketLabel = taxable > 0
    ? '月度换算表第 ' + bracket.level + ' 级（' + Math.round(bracket.rate * 100) + '%，月速算扣除 ' + bracket.quick + ' 元）'
    : '免税（应纳税所得额为 0）'
  return { gross: g, social, special, taxable, tax, net, bracketLabel }
}

// 逐月累计预扣循环表（月薪恒定）：当月扣税 = 累计应预扣 − 已预扣
function calcCycle(gross, params) {
  const s = calcSummary(gross, params)
  const rows = []
  let prevCumTax = 0
  for (let m = 1; m <= 12; m++) {
    const cumTaxable = s.taxable * m
    const cumTax = Math.max(0, annualTaxOn(cumTaxable))
    const monthTax = cumTax - prevCumTax
    prevCumTax = cumTax
    rows.push({ month: m, gross: s.gross, social: s.social, cumTaxable, monthTax, monthNet: s.gross - s.social - monthTax })
  }
  const total = rows.reduce(
    (acc, r) => ({ gross: acc.gross + r.gross, social: acc.social + r.social, tax: acc.tax + r.monthTax, net: acc.net + r.monthNet }),
    { gross: 0, social: 0, tax: 0, net: 0 }
  )
  return { rows, total, taxableMonthly: s.taxable, social: s.social }
}

// 净额函数（单调递增）：二分法求「到手 = 目标」的税前工资
function netOf(gross, params) {
  const s = calcSummary(gross, params)
  return s.net
}
const BISECT_ITERS = 50
function bisectGross(targetNet, params) {
  const target = Number(targetNet) || 0
  let lo = 0
  let hi = Math.max(20000, target * 3)
  // 确认上界足够（净额单调递增，净额(hi) < 目标则无解）
  if (netOf(hi, params) < target) {
    let h = hi
    while (h < 1e8 && netOf(h, params) < target) h *= 2
    if (h >= 1e8) return { ok: false, gross: NaN, net: NaN, iters: BISECT_ITERS }
    hi = h
  }
  for (let i = 0; i < BISECT_ITERS; i++) {
    const mid = (lo + hi) / 2
    if (netOf(mid, params) < target) lo = mid
    else hi = mid
  }
  const gross = (lo + hi) / 2
  const achieved = netOf(gross, params)
  return { ok: Math.abs(achieved - target) < 0.01, gross, net: achieved, iters: BISECT_ITERS }
}

// 复制用文本
function summaryText(s, cycle) {
  const lines = []
  lines.push('税前税后互推计算结果（月均口径）')
  lines.push('税前月薪：¥' + money(s.gross))
  lines.push('五险一金个人部分：¥' + money(s.social))
  lines.push('月应纳税所得额：¥' + money(s.taxable))
  lines.push('个人所得税（月均）：¥' + money(s.tax))
  lines.push('到手月薪（月均）：¥' + money(s.net))
  if (cycle && cycle.total) {
    lines.push('全年个税合计：¥' + money(cycle.total.tax))
    lines.push('全年到手合计：¥' + money(cycle.total.net))
  }
  return lines.join('\n')
}

// ---------- 页面状态与交互 ----------
const MODES = [
  { id: 'forward', label: '税前 → 到手' },
  { id: 'reverse', label: '到手 → 税前' }
]
const BASE_MODES = [
  { id: 'floor', label: '按基数下限' },
  { id: 'actual', label: '按实际工资' },
  { id: 'cap', label: '按基数上限' }
]
const SPECIAL_FIELDS = [
  { key: 'children', label: '子女教育' },
  { key: 'education', label: '继续教育' },
  { key: 'loan', label: '住房贷款利息' },
  { key: 'rent', label: '住房租金' },
  { key: 'elderly', label: '赡养老人' }
]
const BTN_ON = 'bg-primary/10 border-primary/40 text-primary font-medium'
const BTN_OFF = 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'
const SEL_CLS = 'w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const mode = ref('forward')
const grossInput = ref(20000)
const targetNetInput = ref(16730)
const baseMode = ref('actual')
const baseFloor = ref(5000)
const baseCap = ref(35000)
const fundPct = ref(0)
const specials = reactive({ children: 0, education: 0, loan: 0, rent: 0, elderly: 0 })

const baseModeTip = computed(() => {
  if (baseMode.value === 'floor') return '按当地基数下限缴纳（常为社平工资 60%），个人扣得少、到手多，但公积金入账也少（下限可改）。'
  if (baseMode.value === 'cap') return '按当地基数上限缴纳（常为社平工资 300%），高薪时个人扣缴封顶（上限可改）。'
  return '五险一金按实际税前工资全额缴纳（最常见口径）。'
})

// 计算参数（保持两页口径一致的结构）
const params = computed(() => ({
  baseMode: baseMode.value,
  baseFloor: baseFloor.value,
  baseCap: baseCap.value,
  fundPct: fundPct.value,
  specialMonthly: SPECIAL_FIELDS.reduce((sum, f) => sum + (Number(specials[f.key]) || 0), 0)
}))

const summary = computed(() => {
  if (mode.value === 'forward') {
    return calcSummary(grossInput.value, params.value)
  }
  const r = bisectGross(targetNetInput.value, params.value)
  if (!r.ok) return null
  return calcSummary(r.gross, params.value)
})

const reverseResult = computed(() => {
  if (mode.value !== 'reverse') return null
  return bisectGross(targetNetInput.value, params.value)
})

const cycle = computed(() => {
  if (!summary.value) return null
  return calcCycle(summary.value.gross, params.value)
})

const cycleRows = computed(() => (cycle.value ? cycle.value.rows : []))
const cycleTotal = computed(() => (cycle.value ? cycle.value.total : { gross: 0, social: 0, tax: 0, net: 0 }))

async function copyResult() {
  if (!summary.value) return
  try {
    await navigator.clipboard.writeText(summaryText(summary.value, cycle.value))
    window.alert('已复制')
  } catch (err) {
    window.alert('复制失败，请手动选择结果复制')
  }
}

function loadExample() {
  grossInput.value = 20000
  targetNetInput.value = 16730
  baseMode.value = 'actual'
  baseFloor.value = 5000
  baseCap.value = 35000
  fundPct.value = 0
  specials.children = 0
  specials.education = 0
  specials.loan = 0
  specials.rent = 0
  specials.elderly = 0
}

onMounted(() => {
  addRecentTool('salary-reverse-calculator')
})
</script>
