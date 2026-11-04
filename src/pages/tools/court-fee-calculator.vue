<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Landmark class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">法院诉讼费计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按国务院令第 481 号《诉讼费用交纳办法》第 13 / 14 条口径，分段累计计算案件受理费、保全费与执行费</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线诉讼费计算器：输入诉讼标的额，按《诉讼费用交纳办法》第 13 条财产案件 10 档「分段累计」标准逐档算出案件受理费
        （1 万以下 50 元 → 2000 万以上 0.5%，超额累退），并支持非财产案件按件标准、离婚财产分割加收、保全费（上限 5000 元）与
        执行费（执行后交纳）的组合测算，一键得出受理费 + 保全费 + 执行费合计；内置「简易程序减半」开关与调解结案减半提示。
        全部计算在浏览器本地完成，不上传、不保存任何金额数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 案件与费用信息
        </h2>

        <!-- 案件类型 -->
        <div>
          <label for="court-case-type" class="block text-sm font-medium text-foreground mb-2">案件类型</label>
          <select
            id="court-case-type"
            v-model="caseTypeId"
            @change="onCaseTypeChange"
            class="w-full px-2.5 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="c in CASE_TYPES" :key="c.id" :value="c.id">{{ c.label }}</option>
          </select>
        </div>

        <!-- 财产案件：标的额 -->
        <div v-if="activeCaseType.id === 'property'">
          <label for="court-claim" class="block text-sm font-medium text-foreground mb-2">诉讼标的额（诉讼请求金额或价额）</label>
          <div class="flex items-center gap-2">
            <input
              id="court-claim"
              v-model.number="claimAmount"
              type="number"
              min="0"
              step="1000"
              placeholder="如 100000"
              class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">元</span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>按第 13 条第 1 项「分段累计」交纳：不超过 1 万元每件 50 元，超出部分按 2.5% 逐档递减至 0.5%。</span>
          </p>
        </div>

        <!-- 非财产案件：按件金额 -->
        <div v-else>
          <label for="court-percase" class="block text-sm font-medium text-foreground mb-2">案件受理费（按件，法院核定）</label>
          <div class="flex items-center gap-2">
            <input
              id="court-percase"
              v-model.number="perCaseAmount"
              type="number"
              min="0"
              step="10"
              class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">元</span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-1.5">
            法定幅度：{{ fmtMoney(activeCaseType.min) }} 元{{ activeCaseType.max !== activeCaseType.min ? ' 至 ' + fmtMoney(activeCaseType.max) + ' 元' : '' }}{{ activeCaseType.max !== activeCaseType.min ? '，具体由法院在幅度内核定，省级政府可结合本地实际制定具体标准' : '（第 13 条第 2 项第 4 目）' }}。
          </p>
          <p v-if="activeCaseType.id === 'divorce'" class="text-xs text-muted-foreground leading-relaxed mt-1.5">
            涉及财产分割的：财产总额不超过 20 万元的不另行交纳；超过 20 万元的部分按 0.5% 交纳，可在下方补充。
          </p>
          <p v-if="activeCaseType.id === 'personality'" class="text-xs text-muted-foreground leading-relaxed mt-1.5">
            涉及损害赔偿的：赔偿金额不超过 5 万元的不另行交纳；超过 5 万至 10 万元的部分按 1%、超过 10 万元的部分按 0.5% 另行交纳。
          </p>
        </div>

        <!-- 离婚：财产分割总额 -->
        <div v-if="activeCaseType.id === 'divorce'">
          <label for="court-divorce-property" class="block text-sm font-medium text-foreground mb-2">涉及财产分割的财产总额（可选）</label>
          <div class="flex items-center gap-2">
            <input
              id="court-divorce-property"
              v-model.number="divorcePropertyTotal"
              type="number"
              min="0"
              step="10000"
              placeholder="不涉及填 0"
              class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">元</span>
          </div>
          <p v-if="divorceExtra > 0" class="text-xs leading-relaxed mt-1.5 p-2 rounded bg-muted/60 text-foreground">
            财产分割加收：超过 20 万元部分 {{ fmtMoney(divorcePropertyTotal - 200000) }} 元 × 0.5% = {{ fmtMoney(divorceExtra) }} 元
          </p>
        </div>

        <!-- 简易程序减半 -->
        <div class="p-3 rounded-lg border border-border bg-muted/30">
          <label class="flex items-start gap-2 cursor-pointer">
            <input v-model="simplifyHalf" type="checkbox" class="w-4 h-4 mt-0.5 rounded border border-border" />
            <span>
              <span class="text-sm font-medium text-foreground">适用简易程序审理（受理费减半）</span>
              <span class="block text-xs text-muted-foreground leading-relaxed mt-0.5">《办法》第 16 条：适用简易程序审理的案件减半交纳案件受理费。仅减「案件受理费」，不影响保全费与执行费。</span>
            </span>
          </label>
        </div>

        <!-- 保全费 -->
        <div>
          <label for="court-preserve" class="block text-sm font-medium text-foreground mb-2">申请保全的财产数额（不申请填 0）</label>
          <div class="flex items-center gap-2">
            <input
              id="court-preserve"
              v-model.number="preserveAmount"
              type="number"
              min="0"
              step="10000"
              class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">元</span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-1.5">
            第 14 条第 2 项：不超过 1000 元或不涉财产的每件 30 元；1000–10 万部分 1%；超 10 万部分 0.5%，最高不超过 5000 元。
          </p>
        </div>

        <!-- 执行费 -->
        <div>
          <label for="court-execute" class="block text-sm font-medium text-foreground mb-2">申请执行的金额（不申请填 0）</label>
          <div class="flex items-center gap-2">
            <input
              id="court-execute"
              v-model.number="executeAmount"
              type="number"
              min="0"
              step="10000"
              class="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">元</span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-1.5">
            第 14 条第 1 项：不超过 1 万元每件 50 元；1–50 万部分 1.5%；50–500 万部分 1%；500–1000 万部分 0.5%；超 1000 万部分 0.1%。
          </p>
        </div>

        <!-- 校验错误 -->
        <p v-if="inputError" class="text-xs leading-relaxed text-red-500 p-2 rounded bg-red-500/10 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ inputError }}</span>
        </p>

        <!-- 操作 -->
        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            @click="loadExample"
            class="px-3 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            载入示例
          </button>
          <button
            @click="resetAll"
            class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1 -mt-0.5" /> 重置
          </button>
        </div>
      </div>

      <!-- 右侧：测算结果 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <ReceiptText class="w-5 h-5 mr-2 text-primary" /> 诉讼费测算结果
        </h2>

        <template v-if="canCalc">
          <!-- 合计卡 -->
          <div class="bg-primary/10 rounded-lg p-4 space-y-2">
            <div class="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p class="text-xs text-muted-foreground mb-1">预计诉讼费合计（受理费{{ simplifyHalf ? '减半后' : '' }} + 保全费 + 执行费）</p>
                <p class="text-3xl font-bold text-primary">¥{{ fmtMoney(grandTotal) }}</p>
              </div>
              <span v-if="simplifyHalf" class="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 font-medium">简易程序减半已启用</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="p-2 rounded bg-background">
                <p class="text-[10px] text-muted-foreground">案件受理费</p>
                <p class="text-sm font-bold text-foreground">{{ fmtMoney(acceptanceFinal) }}</p>
              </div>
              <div class="p-2 rounded bg-background">
                <p class="text-[10px] text-muted-foreground">保全费</p>
                <p class="text-sm font-bold text-foreground">{{ fmtMoney(preservation.total) }}</p>
              </div>
              <div class="p-2 rounded bg-background">
                <p class="text-[10px] text-muted-foreground">执行费</p>
                <p class="text-sm font-bold text-foreground">{{ fmtMoney(execution) }}</p>
              </div>
            </div>
          </div>

          <!-- 受理费明细 -->
          <div class="border border-border rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
              <p class="text-sm font-semibold text-foreground">案件受理费（第 13 条）</p>
              <p class="text-sm font-mono text-foreground">
                <template v-if="simplifyHalf">
                  <span class="line-through text-muted-foreground">{{ fmtMoney(acceptance.total) }}</span>
                  → {{ fmtMoney(acceptanceFinal) }}
                </template>
                <template v-else>{{ fmtMoney(acceptance.total) }}</template>
              </p>
            </div>

            <!-- 财产案件：分档累计明细 -->
            <table v-if="activeCaseType.id === 'property' && acceptance.rows.length" class="w-full text-sm">
              <thead>
                <tr class="text-xs text-muted-foreground border-b border-border">
                  <th class="px-4 py-2 text-left font-medium">分档</th>
                  <th class="px-4 py-2 text-right font-medium">计费部分</th>
                  <th class="px-4 py-2 text-right font-medium">比例</th>
                  <th class="px-4 py-2 text-right font-medium">费用</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in acceptance.rows" :key="i" class="border-b border-border/40 last:border-0">
                  <td class="px-4 py-2 text-foreground">{{ row.label }}</td>
                  <td class="px-4 py-2 text-right text-muted-foreground font-mono">{{ row.portionLabel }}</td>
                  <td class="px-4 py-2 text-right text-muted-foreground font-mono">{{ row.rateLabel }}</td>
                  <td class="px-4 py-2 text-right font-mono text-foreground">{{ fmtMoney(row.fee) }}</td>
                </tr>
                <tr class="bg-muted/30">
                  <td class="px-4 py-2 font-medium text-foreground" colspan="3">分段累计合计</td>
                  <td class="px-4 py-2 text-right font-mono font-bold text-foreground">{{ fmtMoney(acceptance.total) }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="px-4 py-3 text-sm text-muted-foreground leading-relaxed">
              {{ activeCaseType.label }}按件交纳：本页按 {{ fmtMoney(perCaseAmount) }} 元计（法定幅度 {{ fmtMoney(activeCaseType.min) }}–{{ fmtMoney(activeCaseType.max) }} 元，以法院核定为准）<span v-if="acceptance.extra > 0">，另按财产分割超 20 万部分加收 {{ fmtMoney(acceptance.extra) }} 元</span>。
            </p>
          </div>

          <!-- 保全费 / 执行费提示 -->
          <p v-if="preservation.capped" class="text-xs leading-relaxed p-2.5 rounded bg-yellow-500/10 text-foreground flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <span>按实际保全财产数额计算的保全费超过 5000 元，已按《办法》第 14 条第 2 项封顶收取 5000 元。</span>
          </p>
          <p v-if="execution > 0" class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>执行申请费不由申请人预交，执行后交纳（《办法》第 20 条）；没有执行金额的每件 50–500 元。</span>
          </p>

          <!-- 调解结案减半提示 -->
          <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>调解结案提示：以调解方式结案或者当事人申请撤诉的，减半交纳案件受理费（《办法》第 15 条）。该减半与简易程序减半能否叠加、如何计算，各地法院掌握不一，本工具默认不叠加，最终以法院核定为准。</span>
          </p>
        </template>

        <!-- 输入不完整时的空状态 -->
        <div v-else class="text-center text-muted-foreground py-16">
          <TriangleAlert class="w-10 h-10 mx-auto mb-3 text-yellow-500" />
          <p class="text-sm">请先完善左侧输入：{{ inputError }}。</p>
          <p class="text-xs text-muted-foreground/70 mt-1">也可以点击「载入示例」先看一条完整测算：标的 10 万元 + 保全 20 万元 + 执行 50 万元。</p>
        </div>
      </div>
    </div>

    <!-- 免责声明（页面固定、显著位置） -->
    <p class="text-xs text-muted-foreground leading-relaxed mb-8 p-3 rounded-lg bg-muted/40 border border-border flex items-start gap-1.5">
      <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <span>本工具按国务院令第 481 号《诉讼费用交纳办法》现行条文口径估算，仅供计算参考，不构成法律意见；
      减半规则的叠加、幅度内按件金额及最终收费以受诉法院核定为准，个别案件类型（知识产权、破产、支付令等）另有标准，重要事项请咨询受诉法院或执业律师。</span>
    </p>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoVisible" class="bg-card border border-border rounded-lg p-6 mb-12 overflow-x-auto">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是法院诉讼费计算器？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          法院诉讼费计算器是一款在线诉讼成本测算工具，依据 2007 年公布施行的《诉讼费用交纳办法》（国务院令第 481 号）第 13 条、第 14 条的分档标准：
          输入诉讼标的额即可按「分段累计、超额累退」规则逐档算出财产案件受理费，同时测算申请保全费与执行费，组合得出预计总支出；
          支持非财产案件的按件标准、离婚财产分割 0.5% 加收、简易程序减半开关与调解结案减半提示。
          全部计算在浏览器本地完成，不保存任何输入。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">财产案件受理费怎么算？</h3>
        <p class="text-sm text-muted-foreground mb-3 leading-relaxed">
          《办法》第 13 条第 1 项：财产案件根据诉讼请求的金额或者价额，按照下列比例<b class="text-foreground">分段累计</b>交纳——
          不超过 1 万元的部分每件 50 元；超过 1 万至 10 万元的部分按 2.5%；10 万至 20 万元部分 2%；20 万至 50 万元部分 1.5%；
          50 万至 100 万元部分 1%；100 万至 200 万元部分 0.9%；200 万至 500 万元部分 0.8%；500 万至 1000 万元部分 0.7%；
          1000 万至 2000 万元部分 0.6%；超过 2000 万元的部分 0.5%。每段只对「超出上一档的部分」计费，越高的部分费率越低。
          例：标的 10 万元 = 50 + 9 万 × 2.5% = 2300 元；标的 500 万元 = 46800 元；标的 1000 万元 = 81800 元。
        </p>
        <table class="w-full text-sm border border-border rounded-lg overflow-hidden mb-2 min-w-[520px]">
          <thead>
            <tr class="text-xs text-muted-foreground bg-muted/40 border-b border-border">
              <th class="px-3 py-2 text-left font-medium">标的额区间</th>
              <th class="px-3 py-2 text-right font-medium">费率</th>
              <th class="px-3 py-2 text-right font-medium">速算公式（金额 × 费率 + 速算数）</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in QUICK_TABLE" :key="i" class="border-b border-border/40 last:border-0">
              <td class="px-3 py-1.5 text-foreground">{{ row.range }}</td>
              <td class="px-3 py-1.5 text-right text-muted-foreground font-mono">{{ row.rate }}</td>
              <td class="px-3 py-1.5 text-right text-muted-foreground font-mono">{{ row.quick }}</td>
            </tr>
          </tbody>
        </table>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">非财产案件按件交多少？</h3>
        <ul class="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-2 leading-relaxed">
          <li>离婚案件：每件 50 元至 300 元；涉及财产分割、财产总额不超过 20 万元的不另行交纳，超过 20 万元的部分按 0.5% 交纳。</li>
          <li>侵害姓名权、名称权、肖像权、名誉权、荣誉权以及其他人格权案件：每件 100 元至 500 元；涉及损害赔偿的，5 万元以下不另行交纳，5 万至 10 万元部分按 1%、超过 10 万元部分按 0.5% 交纳。</li>
          <li>其他非财产案件：每件 50 元至 100 元。</li>
          <li>劳动争议案件：每件 10 元（追索劳动报酬的案件还可以不预交受理费）。</li>
          <li>管辖权异议不成立的：每件 50 元至 100 元。</li>
          <li>知识产权民事案件：无争议金额的每件 500 元至 1000 元；有争议金额的按财产案件标准。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">保全费和执行费怎么算？</h3>
        <p class="text-sm text-muted-foreground mb-3 leading-relaxed">
          <b class="text-foreground">保全费</b>（第 14 条第 2 项）：按实际保全的财产数额——不超过 1000 元或不涉财产的每件 30 元；
          1000 至 10 万元部分按 1%；超过 10 万元部分按 0.5%；但最多不超过 5000 元。
          速算：1000–10 万 = 数额 × 1% + 20；超 10 万 = 数额 × 0.5% + 520（如保全 20 万元 = 1520 元）。
          <b class="text-foreground">执行费</b>（第 14 条第 1 项）：执行金额不超过 1 万元的每件 50 元；1 万至 50 万元部分 1.5%；
          50 万至 500 万元部分 1%；500 万至 1000 万元部分 0.5%；超过 1000 万元部分 0.1%。
          速算：1–50 万 = 金额 × 1.5% − 100；50–500 万 = 金额 × 1% + 2400；500–1000 万 = 金额 × 0.5% + 27400（如执行 50 万元 = 7400 元）。
          注意：执行申请费不由申请人预交，<b class="text-foreground">执行后交纳</b>（第 20 条）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">简易程序和调解结案能省多少？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          《办法》第 16 条：适用简易程序审理的案件<b class="text-foreground">减半</b>交纳案件受理费（标的 10 万元案件由 2300 元降为 1150 元）；
          第 15 条：以<b class="text-foreground">调解方式结案或者当事人申请撤诉</b>的，减半交纳案件受理费。
          两项减半仅针对「案件受理费」，不影响保全费、执行费与第 11 条的证人、鉴定等实际支出费用；
          两项能否叠加适用各地法院掌握不一，最终以法院核定为准。此外，被告提起反诉、有独立请求权第三人提出合并审理请求的，分别减半交纳（第 18 条）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">诉讼费最终由谁承担？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          《办法》第 29 条：诉讼费用由<b class="text-foreground">败诉方</b>负担，胜诉方自愿承担的除外；
          部分胜诉、部分败诉的，由法院根据案件具体情况决定双方各自负担的数额。
          预交只是程序要求：原告、上诉人按通知预交，被告反诉的由被告预交；经调解达成协议的，诉讼费负担由双方协商（第 31 条）。
          因此本工具算出的是「预交口径」的预计金额，结算多退少补。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">标的 10 万元要交多少受理费？</h3>
            <p class="text-sm text-muted-foreground mt-1">50 元（1 万以下固定）+ 9 万 × 2.5% = 2300 元。若适用简易程序审理则减半为 1150 元；调解结案或撤诉的同样减半。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">保全 20 万元收多少保全费？</h3>
            <p class="text-sm text-muted-foreground mt-1">超过 10 万元部分适用 0.5%：20 万 × 0.5% + 520 = 1520 元。保全费最高不超过 5000 元，不超过 1000 元或不涉财产的每件 30 元。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">执行 50 万元收多少执行费？</h3>
            <p class="text-sm text-muted-foreground mt-1">50 万 × 1.5% − 100 = 7400 元。执行申请费不由申请人预交，执行后交纳（《办法》第 20 条）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">劳动争议案件交多少诉讼费？</h3>
            <p class="text-sm text-muted-foreground mt-1">劳动争议案件每件 10 元（《办法》第 13 条第 2 项第 4 目）；追索劳动报酬的案件还可以不预交案件受理费。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">简易程序减半后调解结案还能再减吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">第 16 条简易程序减半与第 15 条调解结案（或撤诉）减半是两条独立规则，能否叠加计算各地法院掌握不一，本工具默认不叠加，最终以法院核定为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">算出的诉讼费是最终要交的吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">是「预交口径」的预计金额。案件受理费由原告 / 上诉人预交，保全费由申请人预交，执行费执行后交纳；结算时由败诉方负担、多退少补，幅度内按件金额以法院核定为准。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :current-tool-id="'court-fee-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Landmark, Calculator, ReceiptText, Info, TriangleAlert,
  ChevronUp, ChevronDown, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '法院诉讼费计算器 - 案件受理费/保全费/执行费在线计算',
  description: '免费在线诉讼费计算器：按《诉讼费用交纳办法》（国务院令第 481 号）第 13、14 条口径，输入标的额分段累计计算财产案件受理费（10 档超额累退），支持非财产案件按件、保全费（上限 5000 元）、执行费与简易程序减半开关，组合输出费用合计，纯浏览器本地计算',
  keywords: '诉讼费计算器,法院收费标准,案件受理费计算,保全费计算,court fee calculator,诉讼费 8 档,诉讼费 10 档,执行费计算,诉讼费用交纳办法,简易程序减半',
  author: '有条工具',
  ogTitle: '法院诉讼费计算器 - 案件受理费/保全费/执行费在线计算 | 有条工具',
  ogDescription: '受理费 10 档分段累计 + 保全费 + 执行费组合测算，简易程序减半一键切换。',
  ogUrl: 'https://www.util.cn/tools/court-fee-calculator',
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
          name: '法院诉讼费计算器',
          url: 'https://www.util.cn/tools/court-fee-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '财产案件受理费 10 档分段累计（《诉讼费用交纳办法》第 13 条）',
            '非财产案件按件标准（离婚 / 人格权 / 劳动争议 / 管辖权异议等）',
            '离婚财产分割超 20 万部分 0.5% 加收',
            '保全费测算与 5000 元封顶判定（第 14 条第 2 项）',
            '执行费测算与执行后交纳提示（第 14 条第 1 项、第 20 条）',
            '受理费 + 保全费 + 执行费组合合计',
            '简易程序减半开关与调解结案减半提示（第 15 / 16 条）',
            '纯本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '法院诉讼费计算器', item: 'https://www.util.cn/tools/court-fee-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '标的 10 万元要交多少受理费？',
              acceptedAnswer: { '@type': 'Answer', text: '50 元（1 万以下固定）+ 9 万 × 2.5% = 2300 元。若适用简易程序审理则减半为 1150 元；调解结案或撤诉的同样减半。' }
            },
            {
              '@type': 'Question',
              name: '保全 20 万元收多少保全费？',
              acceptedAnswer: { '@type': 'Answer', text: '超过 10 万元部分适用 0.5%：20 万 × 0.5% + 520 = 1520 元。保全费最高不超过 5000 元，不超过 1000 元或不涉财产的每件 30 元。' }
            },
            {
              '@type': 'Question',
              name: '执行 50 万元收多少执行费？',
              acceptedAnswer: { '@type': 'Answer', text: '50 万 × 1.5% − 100 = 7400 元。执行申请费不由申请人预交，执行后交纳（《诉讼费用交纳办法》第 20 条）。' }
            },
            {
              '@type': 'Question',
              name: '劳动争议案件交多少诉讼费？',
              acceptedAnswer: { '@type': 'Answer', text: '劳动争议案件每件 10 元（《诉讼费用交纳办法》第 13 条第 2 项第 4 目）；追索劳动报酬的案件还可以不预交案件受理费。' }
            },
            {
              '@type': 'Question',
              name: '简易程序减半后调解结案还能再减吗？',
              acceptedAnswer: { '@type': 'Answer', text: '第 16 条简易程序减半与第 15 条调解结案（或撤诉）减半是两条独立规则，能否叠加计算各地法院掌握不一，最终以法院核定为准。' }
            },
            {
              '@type': 'Question',
              name: '算出的诉讼费是最终要交的吗？',
              acceptedAnswer: { '@type': 'Answer', text: '是「预交口径」的预计金额。案件受理费由原告、上诉人预交，保全费由申请人预交，执行费执行后交纳；结算时由败诉方负担、多退少补，幅度内按件金额以法院核定为准。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 金额入参收敛：非有限数值或 ≤0 按 0 处理
function moneyOf(v) {
  const n = Number(v)
  return isFinite(n) && n > 0 ? n : 0
}

// 保留 2 位小数（规避浮点误差）
function round2(x) {
  return Math.round((x + Number.EPSILON) * 100) / 100
}

// 金额展示：千分位 + 固定 2 位小数（手工实现，避免 SSR 与浏览器 locale 差异导致 hydration 不一致）
function fmtMoney(n) {
  const v = round2(Number(n) || 0)
  const sign = v < 0 ? '-' : ''
  const parts = Math.abs(v).toFixed(2).split('.')
  return sign + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1]
}

// 案件受理费分档（《办法》第 13 条第 1 项，财产案件分段累计、超额累退）。
// 第一档为固定 50 元/件；其余各档只对「超出上一档上限的部分」按费率计费。
const PROPERTY_TIERS = [
  { upTo: 10000, rate: 0, label: '不超过 1 万元' },
  { upTo: 100000, rate: 0.025, label: '1 万 – 10 万元部分' },
  { upTo: 200000, rate: 0.02, label: '10 万 – 20 万元部分' },
  { upTo: 500000, rate: 0.015, label: '20 万 – 50 万元部分' },
  { upTo: 1000000, rate: 0.01, label: '50 万 – 100 万元部分' },
  { upTo: 2000000, rate: 0.009, label: '100 万 – 200 万元部分' },
  { upTo: 5000000, rate: 0.008, label: '200 万 – 500 万元部分' },
  { upTo: 10000000, rate: 0.007, label: '500 万 – 1000 万元部分' },
  { upTo: 20000000, rate: 0.006, label: '1000 万 – 2000 万元部分' },
  { upTo: Infinity, rate: 0.005, label: '超过 2000 万元部分' }
]

// 财产案件受理费：分段累加，返回总额与逐档明细
function acceptanceFeeBreakdown(amount) {
  const a = moneyOf(amount)
  if (a <= 0) return { total: 0, rows: [] }
  const rows = []
  let prev = 0
  let total = 0
  for (const tier of PROPERTY_TIERS) {
    if (a > prev) {
      const portion = Math.min(a, tier.upTo) - prev
      const isFixed = prev === 0
      const fee = isFixed ? 50 : portion * tier.rate
      total += fee
      rows.push({
        label: tier.label,
        portion,
        portionLabel: isFixed ? '每件固定' : fmtMoney(portion),
        rateLabel: isFixed ? '50 元 / 件' : (tier.rate * 100).toFixed(1).replace(/\.0$/, '') + '%',
        fee: round2(fee)
      })
    }
    prev = tier.upTo
  }
  return { total: round2(total), rows }
}

// 保全费（《办法》第 14 条第 2 项）：≤1000 或不涉财产 30 元；1000–10 万部分 1%；超 10 万部分 0.5%；封顶 5000 元
function preservationFeeOf(amount) {
  const a = moneyOf(amount)
  if (a <= 0) return { total: 0, capped: false }
  let fee
  if (a <= 1000) fee = 30
  else fee = 30 + (Math.min(a, 100000) - 1000) * 0.01 + (a > 100000 ? (a - 100000) * 0.005 : 0)
  const capped = fee > 5000
  return { total: round2(Math.min(fee, 5000)), capped }
}

// 执行费（《办法》第 14 条第 1 项第 2 目）：≤1 万 50 元；1–50 万部分 1.5%；50–500 万部分 1%；500–1000 万部分 0.5%；超 1000 万部分 0.1%
const EXECUTION_TIERS = [
  { upTo: 10000, rate: 0 },
  { upTo: 500000, rate: 0.015 },
  { upTo: 5000000, rate: 0.01 },
  { upTo: 10000000, rate: 0.005 },
  { upTo: Infinity, rate: 0.001 }
]

function executionFeeOf(amount) {
  const a = moneyOf(amount)
  if (a <= 0) return 0
  let prev = 0
  let total = 0
  for (const tier of EXECUTION_TIERS) {
    if (a > prev) {
      total += prev === 0 ? 50 : (Math.min(a, tier.upTo) - prev) * tier.rate
    }
    prev = tier.upTo
  }
  return round2(total)
}

// 非财产案件类型（《办法》第 13 条第 2 项及第（四）（六）目）：min / max 为法定幅度
const CASE_TYPES = [
  { id: 'property', label: '财产案件（按标的额分段累计）', min: 0, max: 0 },
  { id: 'divorce', label: '离婚案件', min: 50, max: 300 },
  { id: 'personality', label: '侵害人格权案件', min: 100, max: 500 },
  { id: 'other', label: '其他非财产案件', min: 50, max: 100 },
  { id: 'labor', label: '劳动争议案件', min: 10, max: 10 },
  { id: 'jurisdiction', label: '管辖权异议（异议不成立）', min: 50, max: 100 }
]

// 离婚财产分割加收：财产总额超过 20 万元的部分按 0.5% 交纳
function divorceExtraFee(propertyTotal) {
  return round2(Math.max(0, moneyOf(propertyTotal) - 200000) * 0.005)
}

// SEO 区速算公式表（展示用；与分段累计口径等价，已用节点断言校验）
const QUICK_TABLE = [
  { range: '不超过 1 万元', rate: '—', quick: '每件 50 元' },
  { range: '1 万 – 10 万元', rate: '2.5%', quick: '金额 × 2.5% − 200' },
  { range: '10 万 – 20 万元', rate: '2%', quick: '金额 × 2% + 300' },
  { range: '20 万 – 50 万元', rate: '1.5%', quick: '金额 × 1.5% + 1300' },
  { range: '50 万 – 100 万元', rate: '1%', quick: '金额 × 1% + 3800' },
  { range: '100 万 – 200 万元', rate: '0.9%', quick: '金额 × 0.9% + 4800' },
  { range: '200 万 – 500 万元', rate: '0.8%', quick: '金额 × 0.8% + 6800' },
  { range: '500 万 – 1000 万元', rate: '0.7%', quick: '金额 × 0.7% + 11800' },
  { range: '1000 万 – 2000 万元', rate: '0.6%', quick: '金额 × 0.6% + 21800' },
  { range: '超过 2000 万元', rate: '0.5%', quick: '金额 × 0.5% + 41800' }
]

// ---------- 页面状态 ----------
const TOOL_ID = 'court-fee-calculator'
const caseTypeId = ref('property')
const claimAmount = ref(100000)
const perCaseAmount = ref(50)
const divorcePropertyTotal = ref(0)
const simplifyHalf = ref(false)
const preserveAmount = ref(200000)
const executeAmount = ref(500000)
const seoVisible = ref(true)

const toggleSeoContent = () => { seoVisible.value = !seoVisible.value }

// ---------- 计算与展示派生 ----------
const activeCaseType = computed(() => CASE_TYPES.find((c) => c.id === caseTypeId.value) || CASE_TYPES[0])

const inputError = computed(() => {
  if (activeCaseType.value.id === 'property' && !(moneyOf(claimAmount.value) > 0)) {
    return '请输入大于 0 的诉讼标的额'
  }
  return ''
})

const canCalc = computed(() => !inputError.value)

// 受理费：财产案件走分段累计；非财产案件按件（用户可改）+ 离婚财产分割加收
const acceptance = computed(() => {
  const ct = activeCaseType.value
  if (ct.id === 'property') {
    const bd = acceptanceFeeBreakdown(claimAmount.value)
    return { total: bd.total, rows: bd.rows, extra: 0 }
  }
  const base = moneyOf(perCaseAmount.value)
  const extra = ct.id === 'divorce' ? divorceExtraFee(divorcePropertyTotal.value) : 0
  return { total: round2(base + extra), rows: [], extra }
})

// 简易程序减半（第 16 条）：仅对案件受理费减半，保全费与执行费不减
const acceptanceFinal = computed(() => round2(acceptance.value.total * (simplifyHalf.value ? 0.5 : 1)))

const preservation = computed(() => preservationFeeOf(preserveAmount.value))
const execution = computed(() => executionFeeOf(executeAmount.value))

const grandTotal = computed(() => round2(acceptanceFinal.value + preservation.value.total + execution.value))

// ---------- 交互 ----------
function onCaseTypeChange() {
  const ct = activeCaseType.value
  if (ct.id !== 'property') perCaseAmount.value = ct.min // 切到非财产类型时，按件金额预填幅度下限
}

function loadExample() {
  caseTypeId.value = 'property'
  claimAmount.value = 100000
  perCaseAmount.value = 50
  divorcePropertyTotal.value = 0
  simplifyHalf.value = false
  preserveAmount.value = 200000
  executeAmount.value = 500000
}

function resetAll() {
  caseTypeId.value = 'property'
  claimAmount.value = ''
  perCaseAmount.value = 50
  divorcePropertyTotal.value = 0
  simplifyHalf.value = false
  preserveAmount.value = 0
  executeAmount.value = 0
}

// ---------- 生命周期 ----------
onMounted(() => {
  addRecentTool(TOOL_ID)
})
</script>
