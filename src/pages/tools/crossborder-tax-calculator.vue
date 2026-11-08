<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- ⚠️ 政策时效提示横幅（必须显眼） -->
    <div class="mb-6 rounded-lg border border-yellow-500/50 bg-yellow-100 dark:bg-yellow-500/10 p-4 flex items-start gap-3" role="alert">
      <TriangleAlert class="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
      <div class="text-sm leading-relaxed text-yellow-800 dark:text-yellow-400">
        <p>
          <span class="font-bold">政策时效提示：</span>
          跨境电商零售进口「单次 5,000 元 / 年度 26,000 元」限值与「按法定应纳税额 70% 征收」口径，现行依据为
          财关税〔2018〕49号、财税〔2016〕36号；行邮税三档税率现行依据为税委会〔2019〕17号。
          限值与税率历史上多次调整且未来可能变化，<span class="font-bold underline decoration-yellow-600/60 underline-offset-2">一切以海关总署与财政部现行公告为准，本工具为参考试算</span>，
          正式申报以海关审定的完税价格与适用税率为准。
        </p>
        <p class="text-xs mt-1 opacity-80">本页政策口径查证于 2026-11-08（财关税〔2018〕49号限值至今未调整；行邮税 13%/20%/50% 三档 + 抗癌/罕见病药 3% 特档）。</p>
      </div>
    </div>

    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Receipt class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">跨境电商综合税计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">零售进口综合税率试算：(增值税 + 消费税) ÷ (1 − 消费税) × 70%，含 5000/26000 限额判定与行邮税对照</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线跨境电商综合税计算工具：输入商品价格与运费保险费（完税价格 = 零售价 + 运费 + 保险费），选择品类即得综合税率与税额——
        普通商品 9.10%、高档化妆品 23.06% 等，税率构成逐项写明且可编辑以兜底政策变动；
        自动判定单次 5,000 元与年度 26,000 元交易限值，超限提示按一般贸易全额征税；
        附个人自用行邮税 13%/20%/50% 三档对照卡。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5 h-fit">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 输入参数
        </h2>

        <!-- 商品价格 -->
        <div>
          <label for="cbt-price" class="block text-sm font-medium text-foreground mb-2">商品零售价格（元）</label>
          <input
            id="cbt-price"
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
          <p v-else class="mt-2 text-xs text-muted-foreground">按促销到手价填写（不含平台跨境综合税本身）</p>
        </div>

        <!-- 运费保险费 -->
        <div>
          <label for="cbt-ship" class="block text-sm font-medium text-foreground mb-2">运费 + 保险费（选填，计入完税价格）</label>
          <input
            id="cbt-ship"
            v-model="shipText"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            :class="[inputBase, shipError ? inputInvalid : '']"
          />
          <p v-if="shipError" class="mt-1.5 text-xs text-red-500">{{ shipError }}</p>
          <p v-else class="mt-1.5 text-xs text-muted-foreground">完税价格 = 商品零售价格 + 运费 + 保险费（财关税〔2018〕49号口径），超限判定同样以完税价格为准</p>
        </div>

        <!-- 品类 -->
        <div>
          <label for="cbt-category" class="block text-sm font-medium text-foreground mb-2">品类（自动填入税率构成）</label>
          <select
            id="cbt-category"
            v-model.number="categoryIdx"
            @change="applyCategory"
            class="w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="(c, i) in CATEGORIES" :key="c.name" :value="i">{{ c.name }}</option>
          </select>
          <p class="mt-2 text-xs text-muted-foreground">{{ selectedCategory.note }}</p>
        </div>

        <!-- 税率构成（可编辑兜底） -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="cbt-vat" class="block text-sm font-medium text-foreground mb-2">增值税率（%）</label>
            <input
              id="cbt-vat"
              v-model="vatText"
              type="number"
              min="0"
              step="any"
              :class="[inputBase, vatError ? inputInvalid : '']"
            />
            <p v-if="vatError" class="mt-1.5 text-xs text-red-500">{{ vatError }}</p>
          </div>
          <div>
            <label for="cbt-ct" class="block text-sm font-medium text-foreground mb-2">消费税率（%）</label>
            <input
              id="cbt-ct"
              v-model="ctText"
              type="number"
              min="0"
              step="any"
              :class="[inputBase, ctError ? inputInvalid : '']"
            />
            <p v-if="ctError" class="mt-1.5 text-xs text-red-500">{{ ctError }}</p>
          </div>
        </div>
        <p class="text-xs text-muted-foreground flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>税率可直接编辑兜底政策变动：任一税率调整后立即重算。烟酒等复合计税品类请按最新税目查证后手工填入。</span>
        </p>

        <!-- 年度已购累计 -->
        <div>
          <label for="cbt-annual" class="block text-sm font-medium text-foreground mb-2">年度已购累计（选填，本自然年度跨境电商渠道累计完税价格）</label>
          <input
            id="cbt-annual"
            v-model="annualText"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            :class="[inputBase, annualError ? inputInvalid : '']"
          />
          <p v-if="annualError" class="mt-1.5 text-xs text-red-500">{{ annualError }}</p>
          <p v-else class="mt-1.5 text-xs text-muted-foreground">用于判定本单后是否触及 26,000 元年度交易限值</p>
        </div>

        <!-- 操作 -->
        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            @click="loadExample"
            class="px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition"
          >
            载入示例（高档化妆品 1050）
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
            <Receipt class="w-5 h-5 mr-2 text-primary" /> 试算结果
          </h2>
          <div class="flex items-center gap-2">
            <!-- 限额判定徽章 -->
            <span v-if="limitInfo" class="px-2 py-0.5 rounded-full text-xs font-medium" :class="limitInfo.badgeClass">{{ limitInfo.badge }}</span>
            <template v-if="result">
              <span v-if="copyStatus !== 'idle'" class="text-xs text-muted-foreground">{{ copyStatus === 'ok' ? '已复制' : '复制失败' }}</span>
              <button
                @click="copyResult"
                class="px-2 py-1 border border-border text-xs text-foreground hover:bg-muted transition"
              >复制结果</button>
            </template>
          </div>
        </div>

        <!-- 超限警示 -->
        <div v-if="limitInfo && limitInfo.channel !== 'cross'" class="rounded-lg p-3 text-xs leading-relaxed" :class="limitInfo.alertClass">
          <span class="font-bold">{{ limitInfo.alertTitle }}</span>{{ limitInfo.alertText }}
        </div>

        <!-- 三大结果卡 -->
        <div v-if="result" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="rounded-lg border border-border bg-muted/30 p-4">
            <p class="text-xs font-medium text-muted-foreground mb-2">完税价格</p>
            <p class="font-bold text-2xl text-foreground tabular-nums">{{ fmtMoney(result.dutyPrice) }}</p>
            <p class="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">零售价 {{ fmtMoney(result.price) }} + 运保费 {{ fmtMoney(result.ship) }}</p>
          </div>
          <div class="rounded-lg border border-primary/40 bg-primary/5 p-4">
            <p class="text-xs font-medium text-muted-foreground mb-2">综合税率</p>
            <p class="font-bold text-3xl text-primary tabular-nums">{{ fmtPct(result.effectiveRatePct) }}%</p>
            <p class="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">（{{ fmtPct(result.vat) }}% + {{ fmtPct(result.ct) }}%）÷ (1 − {{ fmtPct(result.ct) }}%) × 70%</p>
          </div>
          <div class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <p class="text-xs font-medium text-muted-foreground mb-2">跨境电商综合税额</p>
            <p class="font-bold text-2xl text-amber-600 dark:text-amber-400 tabular-nums">{{ fmtMoney(result.tax) }}</p>
            <p class="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">关税税率限值内暂设为 0%，增值税消费税按 70% 征收</p>
          </div>
        </div>

        <!-- 公式行 -->
        <div v-if="result" class="bg-muted/50 rounded-lg p-4 space-y-1.5 font-mono text-sm text-foreground overflow-x-auto">
          <p>综合税率 = (增值税率 + 消费税率) ÷ (1 − 消费税率) × 70%</p>
          <p class="text-muted-foreground">= ({{ fmtPct(result.vat) }}% + {{ fmtPct(result.ct) }}%) ÷ (1 − {{ fmtPct(result.ct) }}%) × 70% = {{ fmtPct(result.effectiveRatePct) }}%</p>
          <p>综合税额 = 完税价格 × 综合税率 = {{ fmtMoney(result.dutyPrice) }} × {{ fmtPct(result.effectiveRatePct) }}% = {{ fmtMoney(result.tax) }}</p>
          <p class="text-muted-foreground">到手价 = {{ fmtMoney(result.dutyPrice) }} + {{ fmtMoney(result.tax) }} = {{ fmtMoney(result.finalPrice) }}</p>
        </div>

        <!-- 限额判定明细 -->
        <div v-if="limitInfo" class="rounded-lg border border-border overflow-hidden">
          <div class="px-4 py-2.5 bg-muted/40 border-b border-border text-sm font-medium text-foreground">交易限额判定</div>
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b border-border/60 last:border-b-0">
                <td class="px-4 py-2.5 text-muted-foreground whitespace-nowrap">单次交易限值</td>
                <td class="px-4 py-2.5 text-right font-mono text-foreground tabular-nums">5,000.00 元</td>
                <td class="px-4 py-2.5 text-right text-xs whitespace-nowrap" :class="limitInfo.singleOver ? 'text-red-500' : 'text-muted-foreground'">
                  {{ limitInfo.singleOver ? `本单已超 ${fmtMoney(result ? result.dutyPrice - SINGLE_LIMIT : 0)} 元` : `余量 ${fmtMoney(limitInfo.singleRemain)} 元` }}
                </td>
              </tr>
              <tr class="border-b border-border/60 last:border-b-0">
                <td class="px-4 py-2.5 text-muted-foreground whitespace-nowrap">年度交易限值</td>
                <td class="px-4 py-2.5 text-right font-mono text-foreground tabular-nums">26,000.00 元</td>
                <td class="px-4 py-2.5 text-right text-xs whitespace-nowrap" :class="limitInfo.annualOver ? 'text-red-500' : 'text-muted-foreground'">
                  {{ limitInfo.annualOver ? `累计后已超 ${fmtMoney(limitInfo.annualTotal - ANNUAL_LIMIT)} 元` : `余量 ${fmtMoney(limitInfo.annualRemain)} 元` }}
                </td>
              </tr>
              <tr>
                <td colspan="3" class="px-4 py-2.5 text-xs text-muted-foreground leading-relaxed">
                  判定口径：年度累计 = 年度已购 {{ fmtMoney(limitInfo.annualUsed) }} + 本单完税价格 {{ result ? fmtMoney(result.dutyPrice) : '0.00' }} = {{ fmtMoney(limitInfo.annualTotal) }} 元；
                  {{ limitInfo.judgeText }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 空状态 -->
        <div v-if="!result" class="rounded-lg border border-dashed border-border p-8 text-center">
          <Receipt class="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p class="text-sm text-muted-foreground">输入商品价格后自动代入公式计算</p>
          <p class="text-xs text-muted-foreground/70 mt-1">综合税率 = (增值税率 + 消费税率) ÷ (1 − 消费税率) × 70%；普通商品即 13% × 70% = 9.10%</p>
        </div>

        <!-- 免责小字 -->
        <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>税额按展示的四舍五入税率代入计算，与海关实征可能存在分位差；实际应征税款以海关审定的完税价格与现行政策为准。</span>
        </p>
      </div>
    </div>

    <!-- 常见品类税率表 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <Receipt class="w-5 h-5 mr-2 text-primary" /> 常见品类综合税率表（70% 征收口径）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">
        综合税率 = (增值税率 + 消费税率) ÷ (1 − 消费税率) × 70%；每行税率构成写明，如政策调整可在上方计算器中直接编辑税率兜底。
      </p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[680px]">
          <thead>
            <tr class="text-left text-muted-foreground border-b border-border">
              <th class="py-2.5 pr-4 font-medium whitespace-nowrap">品类</th>
              <th class="py-2.5 pr-4 font-medium text-right whitespace-nowrap">增值税率</th>
              <th class="py-2.5 pr-4 font-medium text-right whitespace-nowrap">消费税率</th>
              <th class="py-2.5 pr-4 font-medium text-right whitespace-nowrap">综合税率</th>
              <th class="py-2.5 font-medium">税率构成说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in categoryRows" :key="row.name" class="border-b border-border/60 last:border-b-0 align-top">
              <td class="py-2.5 pr-4 text-foreground whitespace-nowrap">{{ row.name }}</td>
              <td class="py-2.5 pr-4 text-right font-mono text-foreground whitespace-nowrap">{{ row.vat === null ? '—' : fmtPct(row.vat) + '%' }}</td>
              <td class="py-2.5 pr-4 text-right font-mono whitespace-nowrap" :class="row.ct === null ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'">
                {{ row.ct === null ? '复合计税' : fmtPct(row.ct) + '%' }}
              </td>
              <td class="py-2.5 pr-4 text-right font-mono font-semibold whitespace-nowrap" :class="row.rate === null ? 'text-amber-600 dark:text-amber-400' : 'text-primary'">
                {{ row.rate === null ? '另计' : fmtPct(row.rate) + '%' }}
              </td>
              <td class="py-2.5 text-xs text-muted-foreground leading-relaxed">{{ row.note }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-3 text-xs text-muted-foreground flex items-start gap-1.5">
        <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>消费税适用税目与税率以财政部、税务总局现行文件为准（如高档化妆品指销售价格 10 元/毫升（克）及以上的美容修饰及护肤类化妆品、香水；烟酒为从价从量复合计税，不能套用单一税率公式）。政策时效风险高，申报前请核对最新税目。</span>
      </p>
    </div>

    <!-- 行邮税对照卡 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <Info class="w-5 h-5 mr-2 text-primary" /> 行邮税对照卡（个人自用进境物品）
      </h2>
      <p class="text-xs text-muted-foreground mb-4">
        行邮税（进境物品进口税）适用于旅客行李与个人邮寄物品等个人自用进境，与跨境电商零售进口的综合税是两条渠道、不能混用。
        现行三档税率依据税委会〔2019〕17号，自 2019 年 4 月 9 日起施行。
      </p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-muted-foreground border-b border-border">
              <th class="py-2.5 pr-4 font-medium whitespace-nowrap">税档</th>
              <th class="py-2.5 font-medium">常见适用税目（示例）</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in POSTAL_TAX_TIERS" :key="t.label" class="border-b border-border/60 last:border-b-0 align-top">
              <td class="py-2.5 pr-4 font-mono font-semibold whitespace-nowrap" :class="t.special ? 'text-amber-600 dark:text-amber-400' : 'text-primary'">{{ t.label }}</td>
              <td class="py-2.5 text-muted-foreground leading-relaxed">{{ t.items }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul class="mt-3 text-xs text-muted-foreground leading-relaxed space-y-1 list-disc list-inside">
        <li>计税：行邮税 = 进境物品完税价格 × 税率，完税价格由海关依法审定（可查《进境物品归类表》《进境物品完税价格表》）。</li>
        <li>免征：应征进口税税额在人民币 50 元（含）以下的予以免征（海关总署公告 2010 年第 43 号）。</li>
        <li>邮寄限值：个人寄自或寄往港澳台地区物品每次限值 800 元，其他国家/地区每次限值 1,000 元；超限应办理退运或按货物规定通关（单件不可分割且确属个人自用的除外）。</li>
        <li>税率时效风险高，以海关现行政策为准；本工具为参考试算，不构成申报依据。</li>
      </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>跨境电商综合税是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          跨境电子商务零售进口综合税是对通过跨境电商渠道零售进口商品征收的进口环节税：在单次 5,000 元、年度 26,000 元交易限值以内，
          关税税率暂设为 0%，进口环节增值税和消费税取消免征税额、按法定应纳税额的 70% 征收
          （依据财税〔2016〕36号、财关税〔2018〕49号）。综合税率 = (增值税率 + 消费税率) ÷ (1 − 消费税率) × 70%：
          普通商品只有 13% 增值税，综合税率即 13% × 70% = 9.10%；高档化妆品叠加 15% 消费税，
          综合税率为 (13% + 15%) ÷ (1 − 15%) × 70% = 23.06%。税额 = 完税价格 × 综合税率，
          完税价格为实际交易价格，包括商品零售价格、运费和保险费。本工具全部在浏览器本地计算，数据不上传。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">公式为什么是 ÷ (1 − 消费税率) 再 × 70%？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          两步：第一步「÷ (1 − 消费税率)」是因为消费税是价内税——增值税的计税依据里要包含消费税，
          所以先把「不含消费税的货价」还原成「含消费税的组成计税价格」，这也是 vat-calculator 增值税含税/不含税换算器里
          价内税口径的同一原理（本页管进口环节，那页管国内价税分离，互为补充）。第二步「× 70%」是政策优惠本身：
          限值内增值税、消费税按法定应纳税额的 70% 征收，关税暂设为 0%。两个 70% 相关的常见误会：70% 只作用于
          增值税和消费税，不作用于「除以 (1 − 消费税率)」的结构还原。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">单次 5,000 元、年度 26,000 元限值怎么判定？超了怎么办？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          判定基准是完税价格（零售价 + 运费 + 保险费）。单次限值：完税价格超过 5,000 元时，本单不适用 70% 综合税，
          按货物税率全额征收关税和进口环节增值税、消费税——但根据财关税〔2018〕49号，若订单下仅一件商品、
          完税价格超 5,000 元且低于 26,000 元，仍可从跨境电商渠道全额征税放行，交易额计入年度累计；
          超过 26,000 元则按一般贸易管理。年度限值：年度已购累计加本单超过 26,000 元时，整单按一般贸易报关。
          年度额度按自然年度累计，跨年自动重置。限值与税率政策时效风险高，以海关现行政策为准，本工具为参考试算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">跨境电商综合税和行邮税有什么区别？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          渠道不同：综合税针对「电商企业 + 消费者」的跨境电子商务零售进口交易（三单对碰：订单、支付单、运单），
          限额内按 70% 征收；行邮税针对个人自用的进境物品（旅客行李、个人邮寄），不看交易三单、按税目三档
          （13%/20%/50%，抗癌药和罕见病药品 3%）征收，税额 50 元（含）以下免征。同一个人海淘行为走错渠道
          可能触发退运或补税：通过电商平台下单的走综合税，亲友直邮/自带的自用物品走行邮税。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">普通 9.10%、高档化妆品 23.06% 是怎么来的？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          普通商品：增值税 13%、消费税 0，综合税率 = (13% + 0) ÷ (1 − 0) × 70% = 9.10%——这也是大多数百货、
          家居、数码、母婴商品的「标准档」。高档化妆品：增值税 13%、消费税 15%，
          (13% + 15%) ÷ (1 − 15%) × 70% = 28% ÷ 85% × 70% = 23.06%。再往上是高档手表（消费税 20%）：
          33% ÷ 80% × 70% = 28.88%；贵重首饰及珠宝玉石（消费税 5%）：18% ÷ 95% × 70% = 13.26%。
          消费税为 0 时公式退化为「增值税率 × 70%」，不会出现除零问题；消费税率必须小于 100%。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">跨境电商综合税怎么计算？</h3>
            <p class="text-sm text-muted-foreground mt-1">综合税率 = (增值税率 + 消费税率) ÷ (1 − 消费税率) × 70%，税额 = 完税价格 × 综合税率。例如普通商品 1,000 元（增值税 13%、消费税 0）：税率 9.10%，税额 91.00 元，到手 1,091.00 元；完税价格要加上运费和保险费。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">高档化妆品为什么是 23.06%？</h3>
            <p class="text-sm text-muted-foreground mt-1">(13% + 15%) ÷ (1 − 15%) × 70% = 28% ÷ 85% × 70% ≈ 23.06%。分母 (1 − 15%) 是把价内消费税还原进计税基础，70% 是跨境电商零售进口环节增值税消费税的征收率优惠。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">超过单次 5,000 元限值怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">完税价格超 5,000 元的单不适用 70% 综合税，按货物税率全额征收关税和进口环节增值税消费税；若订单下仅一件不可分割商品且低于年度 26,000 元限值，可全额征税放行并计入年度累计，超年度限值则按一般贸易管理。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">年度 26,000 元额度怎么累计、用完了还能买吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">按自然年度累计跨境电商零售进口完税价格，跨年自动重置。累计超 26,000 元后，新订单整单按一般贸易报关征税，额度恢复前不再适用 70% 综合税；可在下单前用本工具把「年度已购累计」填入预判本单走向。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">本工具算的税额能直接当申报金额用吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不能。限值、税率政策时效风险高，且海关按审定完税价格征税，本工具为参考试算；正式以跨境电商综合税申报时，以海关现行公告与订单实际审定结果为准。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'crossborder-tax-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Receipt, Calculator, RefreshCw, Info, ChevronUp, ChevronDown, TriangleAlert
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '跨境电商综合税计算器 - 零售进口综合税率与行邮税在线试算',
  description: '免费在线跨境电商综合税计算工具：跨境零售进口综合税率 = (增值税率+消费税率)÷(1−消费税率)×70%，普通商品 9.10%、高档化妆品 23.06%，完税价格含运费口径，单次 5000 元年度 26000 元限额判定，常见品类税率表可编辑兜底，附行邮税 13%/20%/50% 三档对照卡，以海关现行政策为准，纯本地计算不上传',
  keywords: '跨境电商综合税,跨境零售进口税率,跨境电商税收计算,综合税率计算,行邮税,进口税计算,海淘税费,高档化妆品消费税,5000元限额,26000元年度限值',
  author: '有条工具',
  ogTitle: '跨境电商综合税计算器 - 零售进口综合税率与行邮税在线试算 | 有条工具',
  ogDescription: '70% 征收口径、9.10%/23.06% 常用税率、5000/26000 限额判定与行邮税对照卡。',
  ogUrl: 'https://www.util.cn/tools/crossborder-tax-calculator',
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
          name: '跨境电商综合税计算器',
          url: 'https://www.util.cn/tools/crossborder-tax-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '综合税率 = (增值税率+消费税率)÷(1−消费税率)×70%',
            '普通商品 9.10% / 高档化妆品 23.06% 等品类速查',
            '完税价格含运费保险费口径',
            '单次 5000 元 / 年度 26000 元限额判定',
            '税率构成逐项写明且可编辑兜底政策变动',
            '行邮税 13%/20%/50% 三档对照卡',
            '本地运行不上传数据'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '跨境电商综合税计算器', item: 'https://www.util.cn/tools/crossborder-tax-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '跨境电商综合税怎么计算？',
              acceptedAnswer: { '@type': 'Answer', text: '综合税率 = (增值税率 + 消费税率) ÷ (1 − 消费税率) × 70%，税额 = 完税价格 × 综合税率。例如普通商品 1,000 元（增值税 13%、消费税 0）：税率 9.10%，税额 91.00 元；完税价格包括商品零售价格、运费和保险费。' }
            },
            {
              '@type': 'Question',
              name: '高档化妆品为什么是 23.06%？',
              acceptedAnswer: { '@type': 'Answer', text: '(13% + 15%) ÷ (1 − 15%) × 70% = 28% ÷ 85% × 70% ≈ 23.06%。分母 (1 − 消费税率) 是把价内消费税还原进计税基础，70% 是跨境电商零售进口环节增值税消费税的征收率。' }
            },
            {
              '@type': 'Question',
              name: '超过单次 5,000 元限值怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '完税价格超 5,000 元的单不适用 70% 综合税，按货物税率全额征收关税和进口环节增值税消费税；若订单下仅一件不可分割商品且低于年度 26,000 元限值，可全额征税放行并计入年度累计，超年度限值则按一般贸易管理。' }
            },
            {
              '@type': 'Question',
              name: '年度 26,000 元额度怎么累计？',
              acceptedAnswer: { '@type': 'Answer', text: '按自然年度累计跨境电商零售进口完税价格，跨年自动重置；累计超 26,000 元后新订单整单按一般贸易报关征税，额度恢复前不再适用 70% 综合税。' }
            },
            {
              '@type': 'Question',
              name: '综合税和行邮税有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '综合税针对跨境电商零售进口交易（限额内增值税消费税按 70% 征收、关税暂设 0%）；行邮税针对个人自用进境物品（行李、邮寄），按 13%/20%/50% 三档（抗癌药罕见病药 3%）征收，税额 50 元（含）以下免征。两条渠道不能混用。' }
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

// 百分比展示：2 位小数（税率以百分数口径参与公式展示）
function fmtPct(pct) {
  return (Math.round(pct * 100) / 100).toFixed(2)
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

// 跨境电子商务零售进口综合税率（百分数口径）：
// 综合税率 = (增值税率 + 消费税率) ÷ (1 − 消费税率) × 70%
// 入参用百分数（vatPct=13 表示 13%）；消费税率 ≥ 100% 时无解（除零保护）返回 null
function comprehensiveRatePct(vatPct, ctPct) {
  if (!(ctPct < 100)) return null
  return (vatPct + ctPct) / (100 - ctPct) * 70
}

// 交易限额判定（依据财关税〔2018〕49号）：
// 1) 完税价格 > 年度限值 → 直接一般贸易；
// 2) 完税价格 > 单次限值（但 ≤ 年度限值）→ 按货物税率全额征税（单件不可分割商品可全额征税放行并计入年度累计）；
// 3) 年度已购累计 + 本单完税价格 > 年度限值 → 按一般贸易报关；
// 4) 其余 → 限额内，适用 70% 综合税。
function judgeLimit(dutyPrice, annualUsed, singleLimit, annualLimit) {
  if (dutyPrice > annualLimit) return { channel: 'general', reason: 'overAnnualOnce' }
  if (dutyPrice > singleLimit) return { channel: 'full', reason: 'overSingle' }
  if (annualUsed + dutyPrice > annualLimit) return { channel: 'general', reason: 'overAnnual' }
  return { channel: 'cross', reason: 'within' }
}

// 综合税额 = 完税价格 × 综合税率（税率用展示口径的 2 位小数百分数，保证公式代入自洽）
function comprehensiveTax(dutyPrice, effectiveRatePct) {
  return round2(dutyPrice * effectiveRatePct / 100)
}

// ---------- 静态定义 ----------
// 单次 / 年度交易限值（财关税〔2018〕49号，2019-01-01 施行，政策时效风险高以海关现行公告为准）
const SINGLE_LIMIT = 5000
const ANNUAL_LIMIT = 26000

// 常见品类税率表（vat/ct 为百分数；ct 为 null 表示复合计税需按最新税目另计）
const CATEGORIES = [
  { name: '普通商品（家居/数码/服饰/百货）', vat: 13, ct: 0, note: '增值税 13%、不征消费税，综合税率 9.10%，是多数品类的标准档' },
  { name: '食品、饮料、保健品、母婴用品', vat: 13, ct: 0, note: '增值税 13%、不征消费税，综合税率 9.10%' },
  { name: '普通化妆品', vat: 13, ct: 0, note: '2016 年 10 月起普通化妆品不再征收消费税，综合税率 9.10%（高档化妆品除外）' },
  { name: '高档化妆品（香水/高档护肤美容修饰类）', vat: 13, ct: 15, note: '增值税 13% + 消费税 15%：28% ÷ 85% × 70% = 23.06%' },
  { name: '贵重首饰及珠宝玉石', vat: 13, ct: 5, note: '增值税 13% + 消费税 5%：18% ÷ 95% × 70% = 13.26%（金银铂钻零售环节等具体税目以现行文件为准）' },
  { name: '高档手表', vat: 13, ct: 20, note: '增值税 13% + 消费税 20%（销售价格 1 万元以上）：33% ÷ 80% × 70% = 28.88%' },
  { name: '烟、酒（从价从量复合计税）', vat: 13, ct: null, note: '消费税为「比例 + 定额」复合计税，不能套用单一税率公式，请按最新税目税率查证后手工填入消费税率' }
]

// 行邮税三档对照（税委会〔2019〕17号，2019-04-09 施行；另抗癌/罕见病药按 3%）
const POSTAL_TAX_TIERS = [
  { label: '13%', items: '书报刊物、食品饮料、金银、家具、玩具、药品、计算机信息设备等多数个人自用物品', special: false },
  { label: '20%', items: '运动用品（不含高尔夫球具）、钓鱼用品、纺织品、摄像机、家电等', special: false },
  { label: '50%', items: '烟、酒、贵重首饰及珠宝玉石、高尔夫球具、高档手表等', special: false },
  { label: '3%（特档）', items: '抗癌药品、罕见病药品（国家规定减按 3% 征收进口环节增值税的进口药品按货物税率征税的除外）', special: true }
]

// ---------- 表单状态 ----------
const priceText = ref('1000')
const shipText = ref('')
const categoryIdx = ref(0)
const vatText = ref('13')
const ctText = ref('0')
const annualText = ref('')
const seoContentVisible = ref(true)

// 输入框样式
const inputBase = 'w-full px-3 py-2.5 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'
const inputInvalid = 'border-red-500 focus:ring-red-500'

const selectedCategory = computed(() => CATEGORIES[categoryIdx.value] || CATEGORIES[0])

// 品类切换时回填税率构成（烟酒等复合计税品类清空消费税率待用户查证填入）
function applyCategory() {
  const c = selectedCategory.value
  vatText.value = c.vat === null ? '' : String(c.vat)
  ctText.value = c.ct === null ? '' : String(c.ct)
}

// ---------- 解析与校验 ----------
const parsedPrice = computed(() => parsePositive(priceText.value))
const parsedShip = computed(() => parseNonNegative(shipText.value))
const parsedVat = computed(() => parseNonNegative(vatText.value))
const parsedCt = computed(() => parseNonNegative(ctText.value))
const parsedAnnual = computed(() => parseNonNegative(annualText.value))

const priceError = computed(() => (parsedPrice.value === null ? '请输入大于 0 的商品价格' : ''))
const shipError = computed(() => (parsedShip.value === null ? '请输入 ≥ 0 的数字' : ''))
const annualError = computed(() => (parsedAnnual.value === null ? '请输入 ≥ 0 的数字' : ''))
const vatError = computed(() => {
  const v = parsedVat.value
  if (v === null) return '增值税率请输入 ≥ 0 的百分比'
  if (v >= 100) return '增值税率需小于 100%'
  return ''
})
const ctError = computed(() => {
  const c = parsedCt.value
  if (c === null) return '消费税率请输入 ≥ 0 的百分比（不征消费税填 0）'
  if (c >= 100) return '消费税率需小于 100%，否则公式除零无解'
  return ''
})

// ---------- 结果 ----------
const result = computed(() => {
  const price = parsedPrice.value
  if (price === null) return null
  if (parsedShip.value === null || parsedAnnual.value === null) return null
  const vat = parsedVat.value
  const ct = parsedCt.value
  if (vat === null || ct === null || vat >= 100 || !(ct < 100)) return null
  const ratePct = comprehensiveRatePct(vat, ct)
  if (ratePct === null) return null
  const effectiveRatePct = round2(ratePct)
  const dutyPrice = round2(price + parsedShip.value)
  const tax = comprehensiveTax(dutyPrice, effectiveRatePct)
  return {
    price: round2(price),
    ship: round2(parsedShip.value),
    dutyPrice,
    vat,
    ct,
    ratePct,
    effectiveRatePct,
    tax,
    finalPrice: round2(dutyPrice + tax)
  }
})

// 限额判定信息
const limitInfo = computed(() => {
  const r = result.value
  if (!r) return null
  const j = judgeLimit(r.dutyPrice, parsedAnnual.value, SINGLE_LIMIT, ANNUAL_LIMIT)
  const annualTotal = round2(parsedAnnual.value + r.dutyPrice)
  const base = {
    channel: j.channel,
    reason: j.reason,
    annualUsed: parsedAnnual.value,
    annualTotal,
    singleRemain: round2(SINGLE_LIMIT - r.dutyPrice),
    annualRemain: round2(ANNUAL_LIMIT - annualTotal),
    singleOver: r.dutyPrice > SINGLE_LIMIT,
    annualOver: annualTotal > ANNUAL_LIMIT
  }
  if (j.channel === 'cross') {
    return {
      ...base,
      badge: '限额内 · 70% 综合税',
      badgeClass: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20',
      judgeText: '本单在单次与年度限值内，适用跨境电商零售进口综合税（关税暂设 0%，增值税消费税按 70% 征收）。'
    }
  }
  if (j.channel === 'full') {
    return {
      ...base,
      badge: '超单次限值 · 全额征税',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      alertTitle: '本单完税价格超过 5,000 元单次限值：',
      alertText: '不适用 70% 综合税，按货物税率全额征收关税和进口环节增值税、消费税（税率因 HS 编码而异）。若订单下仅一件不可分割商品且低于年度限值，可全额征税放行并计入年度累计；下方综合税数字仅供对照参考。',
      alertClass: 'bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300',
      judgeText: '完税价格超单次限值，按货物税率全额征税（不再适用 70% 综合税）；交易额计入年度累计。'
    }
  }
  return {
    ...base,
    badge: '超年度限值 · 一般贸易',
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
    alertTitle: '本单累计后超出 26,000 元年度交易限值：',
    alertText: '整单按一般贸易管理报关征税（关税 + 全额增值税、消费税，税率因 HS 编码而异），不适用跨境电商综合税；下方综合税数字仅供对照参考。',
    alertClass: 'bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-300',
    judgeText: '年度已购累计 + 本单完税价格超过年度限值，整单按一般贸易报关。'
  }
})

// 品类税率表行（综合税率动态计算）
const categoryRows = computed(() =>
  CATEGORIES.map((c) => ({
    name: c.name,
    vat: c.vat,
    ct: c.ct,
    rate: c.ct === null ? null : comprehensiveRatePct(c.vat, c.ct),
    note: c.note
  }))
)

// ---------- 操作 ----------
function loadExample() {
  priceText.value = '1050'
  shipText.value = ''
  categoryIdx.value = 3
  applyCategory()
  annualText.value = ''
}

function resetForm() {
  priceText.value = ''
  shipText.value = ''
  categoryIdx.value = 0
  vatText.value = '13'
  ctText.value = '0'
  annualText.value = ''
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
  const limit = limitInfo.value
  return `跨境电商综合税试算：完税价格 ${fmtMoney(r.dutyPrice)} 元（零售 ${fmtMoney(r.price)} + 运保费 ${fmtMoney(r.ship)}），增值税 ${fmtPct(r.vat)}% + 消费税 ${fmtPct(r.ct)}%，综合税率 ${fmtPct(r.effectiveRatePct)}%，税额 ${fmtMoney(r.tax)} 元，到手 ${fmtMoney(r.finalPrice)} 元；${limit ? limit.badge : ''}`
}

async function copyResult() {
  const text = buildResultText()
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    flashCopy('ok')
    trackEvent('工具结果', '复制', 'crossborder-tax-calculator')
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
      if (ok) trackEvent('工具结果', '复制', 'crossborder-tax-calculator')
    } catch (err2) {
      flashCopy('fail')
    }
  }
}

onMounted(() => {
  addRecentTool('crossborder-tax-calculator')
})
</script>
