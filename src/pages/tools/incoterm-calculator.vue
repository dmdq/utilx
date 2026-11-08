<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Globe class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">外贸报价换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">EXW → FOB → CFR → CIF 价格链双向换算，海运费与 110% 保险加成口径，Incoterms 2020 十一术语对照</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线外贸报价换算工具：输入 EXW / FOB / CFR / CIF 任一节点价格与国内运费、出口清关杂费、海运费、保险费率，
        自动沿换算链推出全链路报价——CIF 按「(FOB + 海运费) ÷ (1 − 110% × 保险费率)」的投保加成口径计算，
        支持可选利润加成，并附 Incoterms 2020 十一术语责任分界与适用运输方式对照表。先用本工具把价格算清，
        再用站内商业发票生成器把 PI / CI 制出来，两步衔接成完整报价流程。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5 h-fit">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 输入参数
        </h2>

        <!-- 起始术语 + 价格 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="incoterm-start" class="block text-sm font-medium text-foreground mb-2">起始术语（从哪个价格开始换算）</label>
            <select
              id="incoterm-start"
              v-model="startTerm"
              class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option v-for="t in START_TERMS" :key="t.code" :value="t.code">{{ t.code }}（{{ t.name }}）</option>
            </select>
            <p class="mt-2 text-xs text-muted-foreground">币种无关：换算只用比例，USD / EUR / CNY 报价均可</p>
          </div>
          <div>
            <label for="incoterm-price" class="block text-sm font-medium text-foreground mb-2">{{ startMeta.label }}</label>
            <input
              id="incoterm-price"
              v-model="priceText"
              type="number"
              min="0"
              step="any"
              placeholder="例如 1000"
              class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p v-if="priceError" class="mt-2 text-xs text-red-500 flex items-start gap-1.5">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ priceError }}</span>
            </p>
            <p v-else class="mt-2 text-xs text-muted-foreground">从起点正向逐级加费用，或反向逐级扣除</p>
          </div>
        </div>

        <!-- 费用项 -->
        <div class="space-y-3">
          <span class="block text-sm font-medium text-foreground">费用项（换算链各级增量）</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="incoterm-dom" class="block text-sm font-medium text-foreground mb-2">国内运费（工厂 → 港口）</label>
              <input
                id="incoterm-dom"
                v-model="domText"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                :class="[inputBase, domError ? inputInvalid : '']"
              />
              <p v-if="domError" class="mt-1.5 text-xs text-red-500">{{ domError }}</p>
            </div>
            <div>
              <label for="incoterm-clear" class="block text-sm font-medium text-foreground mb-2">出口清关 / 报关杂费</label>
              <input
                id="incoterm-clear"
                v-model="clearText"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                :class="[inputBase, clearError ? inputInvalid : '']"
              />
              <p v-if="clearError" class="mt-1.5 text-xs text-red-500">{{ clearError }}</p>
            </div>
            <div>
              <label for="incoterm-freight" class="block text-sm font-medium text-foreground mb-2">国际海运费 F（港口 → 目的港）</label>
              <input
                id="incoterm-freight"
                v-model="freightText"
                type="number"
                min="0"
                step="any"
                placeholder="例如 100"
                :class="[inputBase, freightError ? inputInvalid : '']"
              />
              <p v-if="freightError" class="mt-1.5 text-xs text-red-500">{{ freightError }}</p>
            </div>
            <div>
              <label for="incoterm-rate" class="block text-sm font-medium text-foreground mb-2">保险费率 r（%，按 110% 加成计）</label>
              <input
                id="incoterm-rate"
                v-model="rateText"
                type="number"
                min="0"
                step="any"
                placeholder="例如 0.8"
                :class="[inputBase, rateError ? inputInvalid : '']"
              />
              <p v-if="rateError" class="mt-1.5 text-xs text-red-500">{{ rateError }}</p>
              <p v-else class="mt-1.5 text-xs text-muted-foreground">保险费 = CIF × 110% × r；费率 0 时 CIF = FOB + 海运费</p>
            </div>
          </div>
        </div>

        <!-- 利润加成 -->
        <div>
          <label for="incoterm-margin" class="block text-sm font-medium text-foreground mb-2">利润加成（选填，各节点 ×(1+利润率)）</label>
          <input
            id="incoterm-margin"
            v-model="marginText"
            type="number"
            step="any"
            placeholder="留空则不加成；填 10 表示加价 10%"
            :class="[inputBase, marginError ? inputInvalid : '']"
          />
          <p v-if="marginError" class="mt-2 text-xs text-red-500 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ marginError }}</span>
          </p>
          <p v-else class="mt-2 text-xs text-muted-foreground">在基础报价上整体放大，增量同步按比例放大；负利润率不被接受</p>
        </div>

        <!-- 操作 -->
        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            @click="loadExample"
            class="px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition"
          >
            载入示例（FOB 1000 / F 100 / r 0.8%）
          </button>
          <button
            @click="resetForm"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置
          </button>
        </div>
      </div>

      <!-- 结果面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Globe class="w-5 h-5 mr-2 text-primary" /> 全链路报价
          </h2>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">Incoterms 2020 口径</span>
            <template v-if="result">
              <span v-if="copyStatus !== 'idle'" class="text-xs text-muted-foreground">{{ copyStatus === 'ok' ? '已复制' : '复制失败' }}</span>
              <button
                @click="copyResult"
                class="px-2 py-1 border border-border text-xs text-foreground hover:bg-muted transition"
              >复制结果</button>
            </template>
          </div>
        </div>

        <!-- 换算链价格表 -->
        <div v-if="result" class="rounded-lg border border-border overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted-foreground border-b border-border bg-muted/40">
                <th class="px-4 py-2.5 font-medium">术语</th>
                <th class="px-4 py-2.5 font-medium text-right">节点价格</th>
                <th v-if="hasMargin" class="px-4 py-2.5 font-medium text-right">含利润报价</th>
                <th class="px-4 py-2.5 font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in chainRows"
                :key="row.code"
                class="border-b border-border/60 last:border-b-0"
                :class="row.isStart ? 'bg-primary/5' : ''"
              >
                <td class="px-4 py-2.5 whitespace-nowrap">
                  <span class="font-mono font-semibold" :class="row.isStart ? 'text-primary' : 'text-foreground'">{{ row.code }}</span>
                  <span class="block text-[11px] text-muted-foreground">{{ row.name }}</span>
                </td>
                <td class="px-4 py-2.5 text-right font-mono font-medium tabular-nums" :class="row.valueClass">{{ fmtMoney(row.base) }}</td>
                <td v-if="hasMargin" class="px-4 py-2.5 text-right font-mono font-semibold tabular-nums text-primary">{{ fmtMoney(row.quoted) }}</td>
                <td class="px-4 py-2.5 text-xs text-muted-foreground leading-relaxed">
                  <span v-if="row.isStart" class="font-medium text-foreground">起点输入</span>
                  <template v-else>{{ row.note }}</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 负值警告 -->
        <p v-if="hasNegativeNode" class="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>费用项之和超过了起点价格，换算链上出现负值节点（红色显示）：反向倒推 EXW 前请先核对国内费用是否填大。</span>
        </p>

        <!-- 每级增量明细 -->
        <div v-if="result" class="rounded-lg border border-border overflow-hidden">
          <div class="px-4 py-2.5 bg-muted/40 border-b border-border text-sm font-medium text-foreground">
            每级增量明细{{ hasMargin ? '（含利润口径）' : '' }}
          </div>
          <table class="w-full text-sm">
            <tbody>
              <tr v-for="row in incrementRows" :key="row.key" class="border-b border-border/60 last:border-b-0">
                <td class="px-4 py-2.5 whitespace-nowrap font-mono text-muted-foreground">{{ row.from }} → {{ row.to }}</td>
                <td class="px-4 py-2.5">
                  <span class="font-medium text-foreground">{{ row.label }}</span>
                  <span class="block text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{{ row.detail }}</span>
                </td>
                <td class="px-4 py-2.5 text-right font-mono font-medium tabular-nums text-foreground whitespace-nowrap">+{{ fmtMoney(row.delta) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 公式行 -->
        <div v-if="formulaLines" class="bg-muted/50 rounded-lg p-4 space-y-1.5 font-mono text-sm text-foreground overflow-x-auto">
          <p v-for="(line, i) in formulaLines" :key="i" :class="i === formulaLines.length - 1 ? 'text-muted-foreground' : ''">{{ line }}</p>
        </div>

        <!-- 空状态 -->
        <div v-if="!result" class="rounded-lg border border-dashed border-border p-8 text-center">
          <Globe class="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p class="text-sm text-muted-foreground">输入起始价格后自动沿换算链计算</p>
          <p class="text-xs text-muted-foreground/70 mt-1">FOB = EXW + 国内运费 + 清关杂费；CFR = FOB + 海运费；CIF = (FOB + 海运费) ÷ (1 − 110% × 保险费率)</p>
        </div>

        <!-- 免责小字 -->
        <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>换算结果为报价试算参考：实际海运费、保险费率以货代与保险公司报价为准，Incoterms® 2020 规则以国际商会（ICC）官方文本为准。</span>
        </p>
      </div>
    </div>

    <!-- Incoterms 2020 十一术语对照卡 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <Info class="w-5 h-5 mr-2 text-primary" /> Incoterms 2020 十一术语对照卡
      </h2>
      <p class="text-xs text-muted-foreground mb-4">
        2020 版分「任意运输方式」与「仅海运和内河运输」两组；其中 CIP 默认投保 ICC(A) 一切险，CIF 沿用 ICC(C) 最低险别——这是 Incoterms 2020 相对 2010 版最直观的变化之一。
      </p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[760px]">
          <thead>
            <tr class="text-left text-muted-foreground border-b border-border">
              <th class="py-2.5 pr-4 font-medium whitespace-nowrap">术语</th>
              <th class="py-2.5 pr-4 font-medium whitespace-nowrap">中文全称</th>
              <th class="py-2.5 pr-4 font-medium">责任分界（一句话）</th>
              <th class="py-2.5 pr-4 font-medium whitespace-nowrap">适用运输方式</th>
              <th class="py-2.5 font-medium whitespace-nowrap">卖方投保义务</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in INCOTERMS_2020" :key="t.code" class="border-b border-border/60 last:border-b-0 align-top">
              <td class="py-2.5 pr-4 font-mono font-semibold text-primary whitespace-nowrap">{{ t.code }}</td>
              <td class="py-2.5 pr-4 whitespace-nowrap text-foreground">{{ t.name }}</td>
              <td class="py-2.5 pr-4 text-muted-foreground leading-relaxed">{{ t.duty }}</td>
              <td class="py-2.5 pr-4 whitespace-nowrap">
                <span
                  class="px-1.5 py-0.5 rounded text-[11px] font-medium"
                  :class="t.sea ? 'bg-muted text-muted-foreground border border-border' : 'bg-primary/10 text-primary border border-primary/20'"
                >{{ t.mode }}</span>
              </td>
              <td class="py-2.5 text-xs leading-relaxed" :class="t.insNote ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-muted-foreground'">{{ t.ins }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-3 text-xs text-muted-foreground flex items-start gap-1.5">
        <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>
          保险口径速记：CIF 卖方只需投保 ICC(C)（最低险别，仅承保重大意外），CIP 卖方默认须投保 ICC(A)（一切险）——买保险前先核对术语与险别；
          险别可以由双方约定加高，以上为 Incoterms 2020 默认口径。
        </span>
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>外贸报价换算是什么？EXW / FOB / CFR / CIF 一条链算清</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          外贸报价换算器用于在 EXW（出厂价）→ FOB → CFR → CIF 这条出口报价链上做双向换算：给定任一节点的价格和费用项，
          就能推出其余节点的报价。换算关系是逐级叠加的：FOB = EXW + 国内运费 + 出口清关/报关杂费；CFR = FOB + 海运费；
          CIF 按 110% 投保加成口径用公式 CIF = (FOB + 海运费) ÷ (1 − 110% × 保险费率) 计算——不是简单把保费加在 CFR 上，
          因为保险金额按 CIF 价本身加成一成投保，保费反过来依赖 CIF，需要用公式一次求解。
          反向换算时逐级反减即可：CIF × (1 − 110% × 保险费率) − 海运费 = FOB，再减国内费用回到 EXW。
          本页还提供 Incoterms 2020 十一术语的责任分界与适用运输方式对照，方便报价前确认双方义务。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">CIF 价怎么算？为什么公式里是 (1 − 110% × 保险费率)？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          推导一句话：投保加成惯例是「按 CIF 发票金额的 110% 投保」，所以保险费 = CIF × 110% × 保险费率 r，
          而 CIF = FOB + 海运费 + 保险费，把保险费代入移项得 CIF − CIF × 110% × r = FOB + 海运费，
          即 CIF = (FOB + 海运费) ÷ (1 − 110% × r)。代入数字验证：FOB 1000、海运费 100、保险费率 0.8%，
          CIF = 1100 ÷ (1 − 0.0088) = 1109.77，保险费 = 1109.77 × 110% × 0.8% = 9.77，
          校验 1100 + 9.77 = 1109.77 自洽；把 CIF 1109.77 反向代入可得 FOB = 1000，正反闭环。
          本页所有节点按分（两位小数）取整，避免浮点误差在链式换算中放大。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">本工具与商业发票生成器是什么关系？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          分工是「先算价、后制单」：本页只做价格换算——把 EXW 出厂价一路报到 CIF，或把客户还的 CIF 价反推回 FOB 看利润空间；
          而商业发票生成器（invoice-generator）负责填写与制单——买卖双方、行项目、币种、金额大写与打印版式，票面同样支持选择贸易术语。
          典型流程：在本页用 FOB + 海运费 + 保险费率算出对外 CIF 报价 → 确认利润后到商业发票生成器开 Proforma Invoice 给客户确认 →
          成交后再出 Commercial Invoice 用于清关与收汇。两个工具互补不重复，数据都不上传服务器。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">EXW、FOB、CFR、CIF 四个常用术语怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          风险与费用的分界点沿运输链渐次后移：EXW 在卖方工厂交货，买方承担后续一切（新手卖方省事，但买方常压价）；
          FOB 在装运港船上交货，卖方管到出口港（出口方最常用的“主场”术语）；CFR 卖方加付到目的港的运费，但风险仍在装船时转移；
          CIF 在 CFR 基础上卖方再代买保险（最低 ICC(C) 险别）。经验法则：集装箱货多用 FCA/CPT/CIP（货交承运人即转移风险，
          避免幺十风险空窗），散杂货走 FOB/CFR/CIF；客户指定船公司时用 F 类，卖方掌握物流议价权时用 C 类赚取运费差价。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">CIP 和 CIF 的保险有什么区别？（ICC(A) vs ICC(C)）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Incoterms 2020 把两条保险默认线分开了：CIP（任何运输方式）卖方默认须按 ICC(A) 一切险投保——承保范围最宽，
          因为多式联运环节多、风险敞口大；CIF（仅海运）卖方仍只需按 ICC(C) 最低险别投保——只保重大意外（火灾、爆炸、
          船舶沉没等），不保一般外来风险。实务提醒：CIF 报价下单后若货物在堆场被雨淋损，ICC(C) 可能不赔，
          买方要么自行加保、要么在合同中约定卖方按 ICC(A) 投保（保费自然反映在报价里）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Incoterms 2020 相比 2010 版改了什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          与换算相关的要点：一是 CIP 默认险别从 ICC(C) 提高到 ICC(A)，CIF 维持 ICC(C)；二是 FCA 新增「已装船提单」选项，
          买方可指示承运人向卖方签发 on-board B/L，解决集装箱货 FCA 下卖方拿不到提单的信用证痛点；
          三是 DAT（运输终端交货）更名为 DPU（卸货地交货），成为唯一要求卖方卸货的术语。术语总数仍为 11 个、
          分「任意运输方式」（EXW/FCA/CPT/CIP/DAP/DPU/DDP）与「仅海运和内河运输」（FAS/FOB/CFR/CIF）两组。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">CIF 价怎么计算？</h3>
            <p class="text-sm text-muted-foreground mt-1">CIF = (FOB + 海运费) ÷ (1 − 110% × 保险费率)。例如 FOB 1000、海运费 100、保险费率 0.8%：CIF = 1100 ÷ 0.9912 = 1109.77，其中保险费 9.77 = 1109.77 × 110% × 0.8%，满足 1100 + 9.77 = 1109.77 的自洽关系。在本页选择起始术语并输入价格即可自动算全链。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">保险为什么按 110% 加成而不是 100%？</h3>
            <p class="text-sm text-muted-foreground mt-1">国际贸易惯例按「CIF 发票金额加一成」投保，多出的 10% 用于覆盖买方的预期利润和部分费用损失，使货物受损时能按完整利益获赔；110% 是默认值，买卖双方也可另行约定加成比例与险别。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">客户只给我 CIF 价，怎么知道自己的 FOB 成本线？</h3>
            <p class="text-sm text-muted-foreground mt-1">在本页把起始术语切到 CIF 并输入对方报价，填入海运费与保险费率，工具会反向扣除：FOB = CIF × (1 − 110% × 保险费率) − 海运费，EXW 再减国内运费与清关杂费，即可与自有出厂成本对比核算利润。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">保险费率为 0 时怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1">费率填 0 即退化为 CIF = CFR = FOB + 海运费，保险费为 0，公式分母 (1 − 0) = 1 不受影响；常见于买方自加保险（CFR 口径直接把 CIF 行当 CFR 用）或室内交货条款。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">算出来的报价可以直接写进合同吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">本工具给出的是费用口径试算；正式报价与合同还应写明术语全称与地点（如 CIF Hamburg, Incoterms 2020）、币种与汇率、有效期与付款方式，运费与保费以货代/保险公司实际报价为准。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'incoterm-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Globe, Calculator, RefreshCw, Info, ChevronUp, ChevronDown,
  TriangleAlert
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '外贸报价换算器 - EXW/FOB/CFR/CIF 价格链在线计算',
  description: '免费在线外贸报价换算工具：输入 EXW/FOB/CFR/CIF 任一节点价格与国内运费、清关杂费、海运费、保险费率，自动算出全链路报价，CIF 按 (FOB+海运费)÷(1−110%×保险费率) 投保加成口径，支持利润加成，附 Incoterms 2020 十一术语责任对照表，与商业发票生成器配套，纯浏览器本地计算不上传数据',
  keywords: '外贸报价换算,CIF价计算,FOB换算CIF,EXW FOB CFR CIF,Incoterms 2020,保险加成110%,海运费报价,出口报价计算,贸易术语对照,CIP ICC(A)',
  author: '有条工具',
  ogTitle: '外贸报价换算器 - EXW/FOB/CFR/CIF 价格链在线计算 | 有条工具',
  ogDescription: '任一术语价格一键换算全链路报价，110% 保险加成口径，Incoterms 2020 十一术语对照。',
  ogUrl: 'https://www.util.cn/tools/incoterm-calculator',
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
          name: '外贸报价换算器',
          url: 'https://www.util.cn/tools/incoterm-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'EXW → FOB → CFR → CIF 全链路双向换算',
            'CIF = (FOB+海运费)÷(1−110%×保险费率) 投保加成口径',
            '任一节点反推上游价格',
            '可选利润加成，增量同步放大',
            '每级增量明细与保险费自洽校验',
            'Incoterms 2020 十一术语责任与运输方式对照',
            '本地运行不上传数据'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '外贸报价换算器', item: 'https://www.util.cn/tools/incoterm-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'CIF 价怎么计算？',
              acceptedAnswer: { '@type': 'Answer', text: 'CIF = (FOB + 海运费) ÷ (1 − 110% × 保险费率)。例如 FOB 1000、海运费 100、保险费率 0.8%：CIF = 1100 ÷ 0.9912 = 1109.77，其中保险费 9.77 = 1109.77 × 110% × 0.8%，满足 1100 + 9.77 = 1109.77 的自洽关系。' }
            },
            {
              '@type': 'Question',
              name: '保险为什么按 110% 加成而不是 100%？',
              acceptedAnswer: { '@type': 'Answer', text: '国际贸易惯例按 CIF 发票金额加一成（110%）投保，多出的 10% 覆盖买方预期利润与费用损失，使货物受损时能按完整利益获赔；110% 为默认值，双方也可另行约定加成比例与险别。' }
            },
            {
              '@type': 'Question',
              name: '客户只给 CIF 价，怎么反推自己的 FOB 成本线？',
              acceptedAnswer: { '@type': 'Answer', text: '选 CIF 为起始术语并输入对方报价，填海运费与保险费率后反向扣除：FOB = CIF × (1 − 110% × 保险费率) − 海运费，再减国内运费与清关杂费得 EXW，与自有出厂成本对比即可核算利润。' }
            },
            {
              '@type': 'Question',
              name: 'CIP 和 CIF 的保险有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'Incoterms 2020 规定 CIP（任何运输方式）卖方默认须按 ICC(A) 一切险投保；CIF（仅海运）卖方仍只需按 ICC(C) 最低险别投保。多式联运环节多所以 CIP 险别默认更高，双方也可约定加高险别。' }
            },
            {
              '@type': 'Question',
              name: '这个工具和商业发票生成器是什么关系？',
              acceptedAnswer: { '@type': 'Answer', text: '分工是先算价、后制单：本工具只做 EXW/FOB/CFR/CIF 价格换算与利润核算，商业发票生成器负责填写买卖双方与行项目并打印 Proforma/Commercial Invoice，票面同样支持贸易术语，两工具互补不重复。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 金额一律按“分”取整防浮点误差：Math.round(x * 100) / 100
function round2(x) {
  return Math.round(x * 100) / 100
}

// 千分位 + 固定 2 位小数（不使用 toLocaleString，保证 SSR 与浏览器输出一致）
function fmtMoney(n) {
  const rounded = round2(Number(n) || 0)
  const sign = rounded < 0 ? '-' : ''
  const [intPart, decPart] = Math.abs(rounded).toFixed(2).split('.')
  return sign + intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + decPart
}

// 小数展示：最多 6 位，去掉尾零（用于 1.1r、保险费率等比例值，避免 0.0055000000000000005 之类浮点尾巴）
function fmtDec(x) {
  const s = Number(x).toFixed(6)
  return s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
}

// 解析正数：非法或 ≤ 0 返回 null
function parsePositive(text) {
  const n = Number(text)
  return Number.isFinite(n) && n > 0 ? n : null
}

// 解析非负数：空串视为 0；非法或负数返回 null
function parseNonNegative(text) {
  const s = String(text ?? '').trim()
  if (s === '') return 0
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? n : null
}

// 换算链：EXW → FOB → CFR → CIF（正反向通用）
// a) FOB = EXW + 国内运费 + 出口清关/报关杂费
// b) CFR = FOB + 海运费 F
// c) CIF = (FOB + F) / (1 − 1.1 × 保险费率 r)（投保加成 110% 口径，CIF 未知时需满足 CIF = FOB + F + CIF×1.1r）
// costs: { dom, clear, freight, insRate }（insRate 为小数，如 0.008 表示 0.8%）
function buildChain(startTerm, price, costs) {
  const insFactor = 1 - 1.1 * costs.insRate
  if (!(insFactor > 0)) return null // 保险费率过高（r ≥ 1/1.1）时无解
  let exw = null
  let fob = null
  let cfr = null
  let cif = null
  if (startTerm === 'EXW') {
    exw = round2(price)
    fob = round2(exw + costs.dom + costs.clear)
  } else if (startTerm === 'FOB') {
    fob = round2(price)
    exw = round2(fob - costs.dom - costs.clear)
  } else if (startTerm === 'CFR') {
    cfr = round2(price)
    fob = round2(cfr - costs.freight)
    exw = round2(fob - costs.dom - costs.clear)
  } else { // CIF
    cif = round2(price)
    cfr = round2(cif * insFactor)
    fob = round2(cfr - costs.freight)
    exw = round2(fob - costs.dom - costs.clear)
  }
  if (cfr === null) cfr = round2(fob + costs.freight)
  if (cif === null) cif = round2(cfr / insFactor)
  const insurance = round2(cif * 1.1 * costs.insRate)
  return { exw, fob, cfr, cif, insurance, insFactor }
}

// 利润加成：各节点 ×(1 + 利润率)；负利润率拒绝（返回 null）
function applyMargin(chain, marginPct) {
  if (marginPct === null || marginPct < 0) return null
  let quoted = null
  if (marginPct > 0) {
    const m = 1 + marginPct
    quoted = {
      exw: round2(chain.exw * m),
      fob: round2(chain.fob * m),
      cfr: round2(chain.cfr * m),
      cif: round2(chain.cif * m)
    }
  }
  return { ...chain, quoted }
}

// 公式行（代入实际数字，方向感知）
function buildFormulaLines(startTerm, price, costs, chain) {
  const dom = costs.dom
  const clear = costs.clear
  const freight = costs.freight
  const insRate = costs.insRate
  const domSum = `${fmtMoney(dom)} + ${fmtMoney(clear)}`
  const lines = []
  if (startTerm === 'EXW') {
    lines.push(`FOB = EXW + 国内运费 + 清关杂费 = ${fmtMoney(chain.exw)} + ${domSum} = ${fmtMoney(chain.fob)}`)
  } else if (startTerm === 'FOB') {
    lines.push(`EXW = FOB − 国内运费 − 清关杂费 = ${fmtMoney(chain.fob)} − ${domSum} = ${fmtMoney(chain.exw)}`)
  } else if (startTerm === 'CFR') {
    lines.push(`FOB = CFR − 海运费 = ${fmtMoney(chain.cfr)} − ${fmtMoney(freight)} = ${fmtMoney(chain.fob)}`)
    lines.push(`EXW = FOB − 国内运费 − 清关杂费 = ${fmtMoney(chain.fob)} − ${domSum} = ${fmtMoney(chain.exw)}`)
  } else {
    lines.push(`CFR = CIF × (1 − 1.1 × r) = ${fmtMoney(chain.cif)} × ${fmtDec(chain.insFactor)} = ${fmtMoney(chain.cfr)}`)
    lines.push(`FOB = CFR − 海运费 = ${fmtMoney(chain.cfr)} − ${fmtMoney(freight)} = ${fmtMoney(chain.fob)}`)
    lines.push(`EXW = FOB − 国内运费 − 清关杂费 = ${fmtMoney(chain.fob)} − ${domSum} = ${fmtMoney(chain.exw)}`)
  }
  if (startTerm === 'EXW' || startTerm === 'FOB') {
    lines.push(`CFR = FOB + 海运费 = ${fmtMoney(chain.fob)} + ${fmtMoney(freight)} = ${fmtMoney(chain.cfr)}`)
  }
  if (startTerm === 'CIF') {
    lines.push(`CIF = 输入的 CIF 价 = ${fmtMoney(chain.cif)}`)
  } else {
    lines.push(`CIF = (FOB + 海运费) ÷ (1 − 1.1 × r) = (${fmtMoney(chain.fob)} + ${fmtMoney(freight)}) ÷ (1 − ${fmtDec(1.1 * insRate)}) = ${fmtMoney(chain.cif)}`)
  }
  lines.push(`保险费 = CIF × 110% × r = ${fmtMoney(chain.cif)} × 110% × ${fmtDec(insRate)} = ${fmtMoney(chain.insurance)}`)
  const sum = round2(chain.cfr + chain.insurance)
  const check = sum === chain.cif
    ? `自洽校验：CFR + 保险费 = ${fmtMoney(chain.cfr)} + ${fmtMoney(chain.insurance)} = ${fmtMoney(sum)} = CIF ✓`
    : `自洽校验：CFR + 保险费 = ${fmtMoney(sum)}，与 CIF ${fmtMoney(chain.cif)} 有 1 分以内舍入差`
  lines.push(check)
  return lines
}

// ---------- 静态定义 ----------
const START_TERMS = [
  { code: 'EXW', name: '工厂交货', label: 'EXW 出厂价' },
  { code: 'FOB', name: '船上交货', label: 'FOB 价格' },
  { code: 'CFR', name: '成本加运费', label: 'CFR 价格' },
  { code: 'CIF', name: '成本+保险费+运费', label: 'CIF 价格' }
]

// Incoterms 2020 十一术语对照（责任分界 + 适用运输方式 + 卖方投保义务）
// 依据 ICC《Incoterms® 2020》官方规则：CIP 默认 ICC(A)，CIF 沿用 ICC(C)
const INCOTERMS_2020 = [
  { code: 'EXW', name: 'Ex Works 工厂交货', duty: '卖方在其场所（工厂/仓库）将货物交给买方处置即完成交货，买方承担后续运输、出口清关与全部费用风险', mode: '任何运输方式', sea: false, ins: '双方均无投保义务', insNote: false },
  { code: 'FCA', name: 'Free Carrier 货交承运人', duty: '卖方在指定地点把货物交给买方指定的承运人即完成交货；2020 版新增买方可指示承运人向卖方签发已装船提单', mode: '任何运输方式', sea: false, ins: '双方均无投保义务', insNote: false },
  { code: 'CPT', name: 'Carriage Paid To 运费付至', duty: '卖方订立运输合同并支付至指定目的地的运费，货物交给第一承运人时风险即转移给买方', mode: '任何运输方式', sea: false, ins: '双方均无投保义务', insNote: false },
  { code: 'CIP', name: 'Carriage & Insurance Paid To 运费和保险费付至', duty: '卖方付运费并办理货运保险至指定目的地，风险自货交第一承运人起转移给买方', mode: '任何运输方式', sea: false, ins: '卖方默认须按 ICC(A) 一切险投保（2020 版新规）', insNote: true },
  { code: 'DAP', name: 'Delivered At Place 目的地交货', duty: '卖方将货物运到指定目的地、在到达的运输工具上做好卸货准备时交买方处置；进口清关由买方办理', mode: '任何运输方式', sea: false, ins: '双方均无投保义务', insNote: false },
  { code: 'DPU', name: 'Delivered at Place Unloaded 卸货地交货', duty: '卖方将货物运到目的地并完成卸货后交付，是唯一要求卖方负责卸货的术语（2020 版由 DAT 更名扩展而来）', mode: '任何运输方式', sea: false, ins: '双方均无投保义务', insNote: false },
  { code: 'DDP', name: 'Delivered Duty Paid 完税后交货', duty: '卖方承担将货物运至目的地并完成进口清关、缴纳关税等全部费用与风险，卖方义务最大', mode: '任何运输方式', sea: false, ins: '双方均无投保义务', insNote: false },
  { code: 'FAS', name: 'Free Alongside Ship 船边交货', duty: '卖方在指定装运港把货物交到买方指定船只的船边（码头或驳船上）即完成交货，此后费用风险归买方', mode: '仅海运和内河运输', sea: true, ins: '双方均无投保义务', insNote: false },
  { code: 'FOB', name: 'Free On Board 船上交货', duty: '卖方在装运港把货物装上买方指定的船只并完成出口清关，货物装上船时风险转移给买方', mode: '仅海运和内河运输', sea: true, ins: '双方均无投保义务', insNote: false },
  { code: 'CFR', name: 'Cost & Freight 成本加运费', duty: '卖方支付至目的港的运费，但货物装上船时风险即转移，保险由买方自行安排', mode: '仅海运和内河运输', sea: true, ins: '双方均无投保义务', insNote: false },
  { code: 'CIF', name: 'Cost, Insurance & Freight 成本、保险费加运费', duty: '卖方支付至目的港的运费并办理货运保险，风险仍在装运港装船时转移给买方', mode: '仅海运和内河运输', sea: true, ins: '卖方最低按 ICC(C) 险别投保（2020 版沿用）', insNote: true }
]

// ---------- 表单状态 ----------
const startTerm = ref('FOB')
const priceText = ref('1000')
const domText = ref('')
const clearText = ref('')
const freightText = ref('100')
const rateText = ref('0.8')
const marginText = ref('')
const seoContentVisible = ref(true)

// 输入框样式
const inputBase = 'w-full px-2.5 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'
const inputInvalid = 'border-red-500 focus:ring-red-500'

// ---------- 解析与校验 ----------
const parsedPrice = computed(() => parsePositive(priceText.value))
const parsedDom = computed(() => parseNonNegative(domText.value))
const parsedClear = computed(() => parseNonNegative(clearText.value))
const parsedFreight = computed(() => parseNonNegative(freightText.value))
const parsedRate = computed(() => parseNonNegative(rateText.value))
const parsedMargin = computed(() => parseNonNegative(marginText.value))

const priceError = computed(() => (parsedPrice.value === null ? '请输入大于 0 的起始价格' : ''))
const domError = computed(() => (parsedDom.value === null ? '请输入 ≥ 0 的数字' : ''))
const clearError = computed(() => (parsedClear.value === null ? '请输入 ≥ 0 的数字' : ''))
const freightError = computed(() => (parsedFreight.value === null ? '请输入 ≥ 0 的数字' : ''))
const marginError = computed(() => (parsedMargin.value === null ? '利润加成不能为负数，请输入 ≥ 0 的百分比' : ''))
const rateError = computed(() => {
  const r = parsedRate.value
  if (r === null) return '保险费率请输入 ≥ 0 的百分比'
  if (!(1 - 1.1 * (r / 100) > 0)) return '保险费率过高：需满足 1 − 110% × r > 0（r < 90.91%）'
  return ''
})

const startMeta = computed(() => START_TERMS.find((t) => t.code === startTerm.value) || START_TERMS[1])

// ---------- 结果 ----------
const result = computed(() => {
  const price = parsedPrice.value
  if (price === null) return null
  if (parsedDom.value === null || parsedClear.value === null || parsedFreight.value === null) return null
  const r = parsedRate.value
  if (r === null || !(1 - 1.1 * (r / 100) > 0)) return null
  const m = parsedMargin.value
  if (m === null) return null
  const base = buildChain(startTerm.value, price, {
    dom: parsedDom.value,
    clear: parsedClear.value,
    freight: parsedFreight.value,
    insRate: r / 100
  })
  if (!base) return null
  return applyMargin(base, m)
})

const hasMargin = computed(() => !!result.value && !!result.value.quoted)
const hasNegativeNode = computed(() => {
  const r = result.value
  if (!r) return false
  const nodes = r.quoted || r
  return nodes.exw < 0 || nodes.fob < 0 || nodes.cfr < 0 || nodes.cif < 0
})

// 换算链价格表行
const chainRows = computed(() => {
  const r = result.value
  if (!r) return []
  const notes = {
    EXW: startTerm.value === 'EXW' ? '' : '反向推出：FOB − 国内运费 − 清关杂费',
    FOB: '= EXW + 国内运费 + 清关杂费',
    CFR: startTerm.value === 'CIF' ? '= CIF × (1 − 1.1 × 保险费率)' : '= FOB + 海运费',
    CIF: startTerm.value === 'CFR' ? '= CFR ÷ (1 − 1.1 × 保险费率)' : '= (FOB + 海运费) ÷ (1 − 1.1 × 保险费率)'
  }
  const defs = [
    { code: 'EXW', name: '工厂交货', key: 'exw' },
    { code: 'FOB', name: '船上交货', key: 'fob' },
    { code: 'CFR', name: '成本加运费', key: 'cfr' },
    { code: 'CIF', name: '成本+保险费+运费', key: 'cif' }
  ]
  const nodes = r.quoted || r
  return defs.map((d) => ({
    ...d,
    base: r[d.key],
    quoted: r.quoted ? r.quoted[d.key] : null,
    isStart: d.key === startTerm.value.toLowerCase(),
    note: notes[d.code],
    valueClass: nodes[d.key] < 0 ? 'text-red-500' : 'text-foreground'
  }))
})

// 每级增量明细（有利润加成时按含利润口径）
const incrementRows = computed(() => {
  const r = result.value
  if (!r) return []
  const nodes = r.quoted || r
  const costDetail = `国内运费 ${fmtMoney(parsedDom.value)} + 出口清关/报关杂费 ${fmtMoney(parsedClear.value)}`
  return [
    {
      key: 'fob',
      from: 'EXW',
      to: 'FOB',
      label: '国内费用',
      detail: costDetail,
      delta: round2(nodes.fob - nodes.exw)
    },
    {
      key: 'cfr',
      from: 'FOB',
      to: 'CFR',
      label: '海运费 F',
      detail: `国际运输段运费（当前输入 ${fmtMoney(parsedFreight.value)}）`,
      delta: round2(nodes.cfr - nodes.fob)
    },
    {
      key: 'cif',
      from: 'CFR',
      to: 'CIF',
      label: '保险费 I',
      detail: `保险费 = CIF × 110% × ${fmtDec(parsedRate.value / 100)}（110% 投保加成口径）`,
      delta: round2(nodes.cif - nodes.cfr)
    }
  ]
})

const formulaLines = computed(() => {
  const r = result.value
  if (!r) return null
  return buildFormulaLines(startTerm.value, parsedPrice.value, {
    dom: parsedDom.value,
    clear: parsedClear.value,
    freight: parsedFreight.value,
    insRate: parsedRate.value / 100
  }, r)
})

// ---------- 操作 ----------
function loadExample() {
  startTerm.value = 'FOB'
  priceText.value = '1000'
  domText.value = ''
  clearText.value = ''
  freightText.value = '100'
  rateText.value = '0.8'
  marginText.value = ''
}

function resetForm() {
  startTerm.value = 'FOB'
  priceText.value = ''
  domText.value = ''
  clearText.value = ''
  freightText.value = ''
  rateText.value = '0.8'
  marginText.value = ''
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 复制结果 ----------
const copyStatus = ref('idle')
let copyTimer = null

function flashCopy(status) {
  copyStatus.value = status
  if (copyTimer !== null) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copyStatus.value = 'idle'
    copyTimer = null
  }, 1600)
}

function buildResultText() {
  const r = result.value
  if (!r) return ''
  const nodes = r.quoted || r
  const prefix = r.quoted ? `基础口径 EXW ${fmtMoney(r.exw)} / FOB ${fmtMoney(r.fob)} / CFR ${fmtMoney(r.cfr)} / CIF ${fmtMoney(r.cif)}；` : ''
  return `外贸报价换算（${startTerm.value} ${fmtMoney(parsedPrice.value)} 起点）：${prefix}EXW ${fmtMoney(nodes.exw)} / FOB ${fmtMoney(nodes.fob)} / CFR ${fmtMoney(nodes.cfr)} / CIF ${fmtMoney(nodes.cif)}，保险费 ${fmtMoney(r.insurance)}（110% × ${fmtDec(parsedRate.value / 100)} 加成口径）`
}

async function copyResult() {
  const text = buildResultText()
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    flashCopy('ok')
    trackEvent('工具结果', '复制', 'incoterm-calculator')
  } catch (err) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      flashCopy(ok ? 'ok' : 'fail')
      if (ok) trackEvent('工具结果', '复制', 'incoterm-calculator')
    } catch (err2) {
      flashCopy('fail')
    }
  }
}

onMounted(() => {
  addRecentTool('incoterm-calculator')
})
</script>
