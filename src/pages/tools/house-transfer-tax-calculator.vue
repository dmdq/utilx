<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Home class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">二手房税费计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">买方契税 + 卖方增值税/个税一键估算，2024 契税新政 140㎡ 线、满二满五免征自动判定</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线二手房过户税费计算工具：按 2024 年 12 月契税新政（优惠面积线 90㎡ 提到 140㎡）计算首套/二套契税，
        根据卖方持有年限自动判定增值税「满二免征」（价税分离后 ×5%）与个税「满五唯一免征」，支持核定 1% 与差额 20% 两种计征方式，
        并给出每笔税费的公式代入、买卖双方合计占成交价比例，以及「满二 vs 不满二」「满五唯一 vs 满五不唯一」的免征价值情景对比。
        全部计算在浏览器本地完成，不上传任何数据，买房卖房谈价、核对中介报价单前先算一笔。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Home class="w-5 h-5 mr-2 text-primary" /> 房产与交易信息
        </h2>

        <!-- 成交价 -->
        <div>
          <label for="price-input" class="block text-sm font-medium text-foreground mb-2">成交价（万元）</label>
          <div class="flex">
            <input
              id="price-input"
              v-model.number="priceWan"
              type="number"
              min="1"
              step="1"
              placeholder="200"
              class="w-full px-3 py-2 bg-background text-foreground border border-border border-border rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <span class="px-3 py-2 bg-muted border border-l-0 border-border rounded-r-md text-sm text-muted-foreground">万</span>
          </div>
          <p v-if="!priceValid" class="mt-1 text-xs text-red-500 flex items-center gap-1">
            <TriangleAlert class="w-3 h-3 flex-shrink-0" /> 请输入大于 0 的成交价
          </p>
        </div>

        <!-- 面积 -->
        <div>
          <label for="area-input" class="block text-sm font-medium text-foreground mb-2">建筑面积（㎡）</label>
          <div class="flex">
            <input
              id="area-input"
              v-model.number="areaSqm"
              type="number"
              min="1"
              max="1000"
              step="1"
              placeholder="89"
              class="w-full px-3 py-2 bg-background text-foreground border border-border border-border rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <span class="px-3 py-2 bg-muted border border-l-0 border-border rounded-r-md text-sm text-muted-foreground">㎡</span>
          </div>
          <p v-if="!areaValid" class="mt-1 text-xs text-red-500 flex items-center gap-1">
            <TriangleAlert class="w-3 h-3 flex-shrink-0" /> 面积有效范围为 1-1000㎡
          </p>
          <p v-else class="mt-1 text-xs text-muted-foreground">140㎡ 是 2024 新政的契税优惠面积线</p>
        </div>

        <!-- 买方家庭住房套数 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">买方家庭住房套数</p>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" :class="segClass(isFirstHome)" @click="isFirstHome = true">首套</button>
            <button type="button" :class="segClass(!isFirstHome)" @click="isFirstHome = false">二套及以上</button>
          </div>
        </div>

        <!-- 卖方持有年限 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">卖方持有年限</p>
          <div class="grid grid-cols-2 gap-2 mb-3">
            <button type="button" :class="segClass(yearsSource === 'date')" @click="yearsSource = 'date'">按取得日期自动</button>
            <button type="button" :class="segClass(yearsSource === 'manual')" @click="yearsSource = 'manual'">手动选档位</button>
          </div>

          <div v-if="yearsSource === 'date'">
            <div class="flex items-center gap-2">
              <Calendar class="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                id="buy-date"
                v-model="buyDate"
                type="date"
                :max="todayIso"
                class="flex-1 px-3 py-2 bg-background text-foreground border border-border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
            </div>
            <p class="mt-1.5 text-xs flex items-start gap-1" :class="dateFuture ? 'text-amber-600' : 'text-muted-foreground'">
              <TriangleAlert v-if="dateFuture" class="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>{{ holdingText }}</span>
            </p>
          </div>
          <div v-else class="grid grid-cols-3 gap-2">
            <button
              v-for="opt in manualYearOptions"
              :key="opt.id"
              type="button"
              :class="segClass(manualYears === opt.id)"
              @click="manualYears = opt.id"
            >{{ opt.label }}</button>
          </div>
        </div>

        <!-- 卖方家庭唯一住房 -->
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-medium text-foreground">卖方家庭唯一住房</p>
            <p class="text-xs text-muted-foreground mt-0.5">开启后满 5 年可免个税（满五唯一）</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="卖方是否家庭唯一住房"
            :aria-checked="onlyHome"
            @click="onlyHome = !onlyHome"
            class="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors"
            :class="onlyHome ? 'bg-primary' : 'bg-muted border border-border'"
          >
            <span
              class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
              :class="onlyHome ? 'translate-x-6' : 'translate-x-1'"
            ></span>
          </button>
        </div>

        <!-- 个税计征方式 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">个税计征方式（卖方）</p>
          <div class="space-y-2">
            <label
              class="flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition"
              :class="taxMode === 'rate' ? 'border-primary bg-primary/5' : 'border-border'"
            >
              <input v-model="taxMode" value="rate" type="radio" name="tax-mode" class="mt-0.5">
              <span class="text-sm">
                <span class="font-medium text-foreground">核定 1%</span>
                <span class="block text-xs text-muted-foreground mt-0.5">默认：无法提供购房原值凭证时，按成交价 1% 缴纳</span>
              </span>
            </label>
            <label
              class="flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition"
              :class="taxMode === 'diff' ? 'border-primary bg-primary/5' : 'border-border'"
            >
              <input v-model="taxMode" value="diff" type="radio" name="tax-mode" class="mt-0.5">
              <span class="text-sm">
                <span class="font-medium text-foreground">差额 20%</span>
                <span class="block text-xs text-muted-foreground mt-0.5">能提供原值凭证时，按（卖出价 − 原值）× 20% 缴纳</span>
              </span>
            </label>
          </div>

          <div v-if="taxMode === 'diff'" class="mt-3">
            <label for="original-price" class="block text-sm font-medium text-foreground mb-2">原值（万元）</label>
            <div class="flex">
              <input
                id="original-price"
                v-model.number="originalWan"
                type="number"
                min="0"
                step="1"
                placeholder="如 150"
                class="w-full px-3 py-2 bg-background text-foreground border border-border border-border rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <span class="px-3 py-2 bg-muted border border-l-0 border-border rounded-r-md text-sm text-muted-foreground">万</span>
            </div>
            <p class="mt-1 text-xs text-muted-foreground leading-relaxed">
              原值以契税票 / 购房发票价格为准；未填按 0 计算（差额最大）。差价 ≤ 0（无增值）时个税免征。
            </p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            @click="loadExample"
            class="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >载入示例</button>
          <button
            type="button"
            @click="resetForm"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置
          </button>
        </div>
      </div>

      <!-- 右侧：结果面板（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 校验提示 -->
        <div v-if="!inputValid" class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-2">
          <TriangleAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p class="text-sm text-red-600">请先输入有效的成交价（大于 0 万元）与建筑面积（1-1000㎡），下方结果按当前输入即时估算。</p>
        </div>

        <!-- 买方卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Calculator class="w-5 h-5 mr-2 text-primary" /> 买方税费
            </h2>
            <div class="flex flex-wrap gap-2">
              <span
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border"
                :class="vatBadge.ok ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'"
              >
                <CheckCircle v-if="vatBadge.ok" class="w-3.5 h-3.5" />
                <TriangleAlert v-else class="w-3.5 h-3.5" />
                {{ vatBadge.text }}
              </span>
              <span
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border"
                :class="fiveBadge.ok ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'"
              >
                <CheckCircle v-if="fiveBadge.ok" class="w-3.5 h-3.5" />
                <TriangleAlert v-else class="w-3.5 h-3.5" />
                {{ fiveBadge.text }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">契税（买方缴纳）</p>
              <p class="text-2xl font-bold text-primary">{{ inputValid ? formatYuan(result.deedTax) : '—' }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ deedNoteText }}</p>
              <p class="text-xs text-muted-foreground mt-2 font-mono">{{ deedFormula }}</p>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">买方合计</p>
              <p class="text-2xl font-bold text-foreground">{{ inputValid ? formatYuan(result.buyerTotal) : '—' }}</p>
              <p class="text-xs text-muted-foreground mt-1">占成交价 {{ percentOfAmount(result.buyerTotal, priceYuan) }}</p>
              <p class="text-xs text-muted-foreground mt-2">住宅买方大额税费仅契税，另有登记费约 80 元等规费未计入</p>
            </div>
          </div>
        </div>

        <!-- 卖方卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground flex items-center mb-4">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 卖方税费
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- 增值税 -->
            <div
              class="rounded-lg p-4"
              :class="result.vatFree && inputValid ? 'bg-green-500/5 border border-green-500/20' : 'bg-amber-500/5 border border-amber-500/20'"
            >
              <div class="flex items-center justify-between mb-1">
                <p class="text-xs text-muted-foreground">增值税（不满 2 年征收）</p>
                <span
                  v-if="result.vatFree && inputValid"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-600 border border-green-500/20"
                >
                  <CheckCircle class="w-3 h-3" /> 免征
                </span>
              </div>
              <p class="text-2xl font-bold" :class="result.vatFree && inputValid ? 'text-green-600' : 'text-foreground'">
                {{ result.vatFree && inputValid ? '免征' : (inputValid ? formatYuan(result.vat) : '—') }}
              </p>
              <p class="text-xs text-muted-foreground mt-1">持有 {{ holdingYears }} 年 → {{ vatBadge.ok ? '满二免征' : '不满二按 5% 征收' }}</p>
              <p class="text-xs text-muted-foreground mt-2 font-mono">{{ vatFormula }}</p>
            </div>

            <!-- 个税 -->
            <div
              class="rounded-lg p-4"
              :class="result.individualFree && inputValid ? 'bg-green-500/5 border border-green-500/20' : 'bg-muted/40 border border-border'"
            >
              <div class="flex items-center justify-between mb-1">
                <p class="text-xs text-muted-foreground">个人所得税（{{ taxMode === 'diff' ? '差额 20%' : '核定 1%' }}）</p>
                <span
                  v-if="result.individualFree && inputValid"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-600 border border-green-500/20"
                >
                  <CheckCircle class="w-3 h-3" /> 免征
                </span>
              </div>
              <p class="text-2xl font-bold" :class="result.individualFree && inputValid ? 'text-green-600' : 'text-foreground'">
                {{ result.individualFree && inputValid ? '免征' : (inputValid ? formatYuan(result.individualTax) : '—') }}
              </p>
              <p class="text-xs text-muted-foreground mt-1">{{ taxStatusText }}</p>
              <p class="text-xs text-muted-foreground mt-2 font-mono">{{ taxFormula }}</p>
            </div>
          </div>

          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            增值税为正税口径，城建税及教育费附加（约为正税的 12%）另计未包含；两项税费法定由卖方承担，实际交易中常通过「到手价」转嫁协商，谈价前先算清。
          </p>
        </div>

        <!-- 合计卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground mb-4">双方税费合计</h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-muted/40 border border-border rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">买方合计</p>
              <p class="text-xl font-bold text-foreground">{{ inputValid ? formatYuan(result.buyerTotal) : '—' }}</p>
              <p class="text-xs text-muted-foreground mt-1">占成交价 {{ percentOfAmount(result.buyerTotal, priceYuan) }}</p>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">卖方合计</p>
              <p class="text-xl font-bold text-foreground">{{ inputValid ? formatYuan(result.sellerTotal) : '—' }}</p>
              <p class="text-xs text-muted-foreground mt-1">占成交价 {{ percentOfAmount(result.sellerTotal, priceYuan) }}</p>
            </div>
            <div class="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">双方合计</p>
              <p class="text-xl font-bold text-primary">{{ inputValid ? formatYuan(result.grandTotal) : '—' }}</p>
              <p class="text-xs text-muted-foreground mt-1">占成交价 {{ percentOfAmount(result.grandTotal, priceYuan) }}</p>
            </div>
          </div>
          <p v-if="inputValid" class="text-xs text-muted-foreground mt-3 leading-relaxed">
            按总价 {{ yuanToWanText(priceYuan) }} 估算：买方 {{ percentOfAmount(result.buyerTotal, priceYuan) }}、卖方 {{ percentOfAmount(result.sellerTotal, priceYuan) }}，
            综合税负约 {{ percentOfAmount(result.grandTotal, priceYuan) }}。税费由哪方实际承担（各付 / 买方包税）以买卖合同约定为准。
          </p>
        </div>

        <!-- 情景对比小表 -->
        <div v-if="scenarioRows.length" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground mb-1">免征条件值多少钱 · 情景对比</h2>
          <p class="text-xs text-muted-foreground mb-4">按当前成交价静态推演两条免征线的税费差额，理解「满二」「满五唯一」各能省多少</p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">免征线</th>
                  <th class="py-2 pr-3 font-medium">满足（免征）</th>
                  <th class="py-2 pr-3 font-medium">不满足</th>
                  <th class="py-2 font-medium text-right">免征价值</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in scenarioRows" :key="row.id" class="border-b border-border/60 last:border-0 align-top">
                  <td class="py-2.5 pr-3">
                    <p class="font-medium text-foreground">{{ row.name }}</p>
                    <p class="text-[10px] mt-0.5" :class="row.satisfied ? 'text-green-600' : 'text-muted-foreground'">
                      {{ row.satisfied ? '当前输入已满足' : '当前输入未满足' }}
                    </p>
                  </td>
                  <td class="py-2.5 pr-3 text-green-600 whitespace-nowrap">{{ row.freeText }}</td>
                  <td class="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">{{ row.withoutBenefit }}</td>
                  <td class="py-2.5 text-right font-bold text-green-600 whitespace-nowrap">省 {{ formatYuan(row.saving) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            个税侧按当前选择的计征方式（{{ taxMode === 'diff' ? '差额 20%，含已填原值' : '核定 1%' }}）推演；增值税按价税分离后 5% 正税推演，未含附加。
          </p>
        </div>

        <!-- 提示条 -->
        <div class="bg-muted/60 border border-border rounded-lg p-4 flex items-start gap-2">
          <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            北上广深等城市对增值税可能有 2 年改 5 年的历史差异口径，部分城市已取消普宅标准；家庭套数认定以购房人户籍地与缴存地查册为准。
          </p>
        </div>
      </div>
    </div>

    <!-- 固定免责声明 -->
    <div class="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 mb-6 flex items-start gap-2">
      <TriangleAlert class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        本工具按 2024 年契税新政与现行增值税/个税通用口径估算，仅供对比参考；各地执行细节（家庭套数认定、核定价、附加税）以当地税务与不动产登记中心实收为准。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>二手房税费计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          二手房税费计算器是一款在线房产交易税费估算工具：输入成交价、面积、买方家庭套数、卖方持有年限与唯一住房情况，
          即可同时算出买方契税、卖方增值税与个人所得税三笔主要税费，并给出每笔税费的公式代入过程、买卖双方合计与占成交价的比例。
          工具内置 2024 年 12 月起执行的契税新政税率线（140㎡）、增值税满二免征、个税满五唯一免征等全国通用口径的自动判定，
          还提供「满二 vs 不满二」「满五唯一 vs 满五不唯一」的情景对比，帮你直观看到免征条件值多少钱。所有计算均在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">二手房过户需要交哪些税？</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">一套住宅从卖方名下过户到买方名下，主要涉及三笔税，买卖双方分工如下：</p>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>买方 · 契税：按家庭套数与面积适用 1% / 1.5% / 2%，是买方唯一的大额税费（另有不动产登记费约 80 元等规费，不属于税）。</li>
          <li>卖方 · 增值税及附加：持有不满 2 年按「含税成交价 ÷ 1.05 × 5%」缴纳增值税，城建税与教育费附加约为正税的 12%；满 2 年免征。</li>
          <li>卖方 · 个人所得税：无法提供原值凭证时按成交价 1% 核定征收；能提供原值凭证的可选差额 20%；满五唯一免征。</li>
          <li>印花税：个人销售或购买住房已长期免征；中介费、贷款评估费是服务费，不是税。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">2024 契税新政：140 平方米优惠线怎么算？</h3>
        <p class="text-sm text-muted-foreground mb-3 leading-relaxed">
          自 2024 年 12 月 1 日起，契税优惠面积线由 90㎡ 提高到 140㎡，且全国统一执行——北京、上海、广州、深圳的二套契税不再按 3%，
          也不再区分普通住宅与非普通住宅。完整税率表如下（按家庭在京内/该省内的住房套数认定）：
        </p>
        <div class="overflow-x-auto mb-3">
          <table class="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead class="bg-muted/60">
              <tr>
                <th class="text-left px-3 py-2 font-medium text-foreground">买方家庭套数</th>
                <th class="text-left px-3 py-2 font-medium text-foreground">面积 ≤ 140㎡</th>
                <th class="text-left px-3 py-2 font-medium text-foreground">面积 &gt; 140㎡</th>
                <th class="text-left px-3 py-2 font-medium text-foreground">示例（200 万）</th>
              </tr>
            </thead>
            <tbody class="text-muted-foreground">
              <tr class="border-t border-border">
                <td class="px-3 py-2">首套</td>
                <td class="px-3 py-2">1%</td>
                <td class="px-3 py-2">1.5%</td>
                <td class="px-3 py-2">2 万 / 3 万</td>
              </tr>
              <tr class="border-t border-border">
                <td class="px-3 py-2">二套</td>
                <td class="px-3 py-2">1%</td>
                <td class="px-3 py-2">2%</td>
                <td class="px-3 py-2">2 万 / 4 万</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-sm text-muted-foreground leading-relaxed">
          对比旧政：90㎡ 以下 1%、90-140㎡ 首套 1.5%、二套 2%（北上广深二套 3%）的口径已成为历史。同样是 120㎡ 二套房，
          新政下契税从 3.6 万（3%）降到 1.2 万（1%），140㎡ 线让改善型换房受益最明显。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">满五唯一是什么？怎么认定？</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          「满五唯一」是卖方免征个人所得税的条件：满五 = 该住房取得时间到本次交易满 5 年；
          唯一 = 卖方以家庭为单位（含未成年子女）名下仅有这一套住房。两者同时满足，个税免征；只满五不唯一，仍按核定 1% 或差额 20% 征收。
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed">
          起算时间按「孰先原则」认定：契税完税凭证（契税票）填发日期与不动产权证（房产证）登记日期，哪个早按哪个算——
          很多房子先缴契税后出证，按契税票起算可以提前几个月到一年满五。房改房、继承、赠与、拆迁安置等特殊取得方式另有起算与原值认定规则，本工具按普通商品房口径计算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">增值税满二免征怎么算时间？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          增值税免征线同样按契税票 / 房产证登记日期孰先起算，到申请过户之日满 2 年（含当日）即可免征。
          例如 2023 年 11 月 2 日取得，2025 年 11 月 2 日起申报过户即满二。不满 2 年时，
          增值税 = 含税成交价 ÷ 1.05 × 5%——增值税是价外税，需先做价税分离再乘 5%（100 万的房子约缴 47,619 元），
          另有约为正税 12% 的城建税及教育费附加，本工具展示的是正税部分。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">个税：差额 20% 和核定 1% 怎么选更划算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          核定 1%：提供不了购房原值凭证（契税票、购房发票）时，多数城市按成交价的 1% 核定征收，简单但没有扣除。
          差额 20%：能提供原值凭证时，按（卖出价 − 原值 − 合理费用）× 20% 征收。两者相等的临界点是「增值额 = 卖出价 × 5%」：
          以 200 万卖出为例，原值 190 万（增值 10 万）时两种方式都缴 2 万；原值高于 190 万（增值不足 10 万）选差额 20% 更省，
          低于 190 万（增值更多）则核定 1% 更省。有原值发票且几乎没涨价的次新房，差额方式可能直接触发「无增值差额免征」；满五唯一则两种方式都免征，无需选择。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">本计算器与税务局官方核定口径的差异</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>契税按全国统一新政税率线计算，未处理拆迁重购减免、共有产权房、离婚析产等特殊情形。</li>
          <li>增值税只算正税，未含城建税与教育费附加（约为正税的 12%）；北上广深历史口径差异见页面提示条。</li>
          <li>核定 1% 是常见住宅征收率，部分城市可能按 1.5%-2% 或分区域核定；差额 20% 的原值以税务机关认定的契税票价格及合理费用为准。</li>
          <li>当税务核定价（评估价）低于成交价时按核定价计税；家庭套数认定、最终税额以当地税务与不动产登记中心实收为准。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">二手房过户需要交哪些税？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              买方主要缴契税（首套/二套，140㎡ 及以下 1%、以上 1.5%/2%）；卖方缴增值税及附加（不满 2 年按含税价 ÷1.05×5%，满 2 年免征）
              和个人所得税（核定 1% 或差额 20%，满五唯一免征）。个人住宅买卖印花税免征，另有登记费等小额规费。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">2024 契税新政 140 平方米线是什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              自 2024 年 12 月 1 日起，契税优惠面积线由 90㎡ 提高到 140㎡：家庭首套 140㎡ 及以下按 1%、以上按 1.5%；
              家庭第二套 140㎡ 及以下按 1%、以上按 2%，全国统一执行，北上广深二套不再按 3%。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">满五唯一怎么认定、从什么时候起算？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              满五指持有满 5 年，起算时间按契税完税凭证填发日期与不动产权证登记日期「孰先」原则认定；
              唯一指卖方家庭（含未成年子女）名下除该套外无其他住房。两者同时满足个税免征；只满五不唯一仍按 1% 或差额 20% 征收。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">个税差额 20% 和核定 1% 哪个划算？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              能提供原值凭证时可比较：增值额低于卖出价 5%（即原值高于卖出价的 95%）时差额 20% 更省，增值幅度大时核定 1% 更省。
              以 200 万卖出为例：原值高于 190 万选差额、低于 190 万选核定；无法提供原值凭证则只能核定 1%。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'house-transfer-tax-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Home, Calculator, Info, TriangleAlert, CheckCircle,
  ChevronUp, ChevronDown, RefreshCw, Calendar
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '二手房税费计算器 - 契税/增值税/个税在线估算（2024新政口径）',
  description: '免费二手房过户税费计算器：按 2024 契税新政 140㎡ 优惠线计算首套/二套契税，自动判定增值税满二免征（价税分离 5%）与个税满五唯一免征，支持核定 1% 与差额 20% 双模式、持有年限自动计算与免征价值情景对比，纯浏览器本地运行不上传',
  keywords: '二手房税费计算器,二手房过户费用,契税计算器,2024契税新政140平,满二免增值税,满五唯一免个税,二手房个税差额20%,二手房增值税计算',
  author: '有条工具',
  ogTitle: '二手房税费计算器 - 契税/增值税/个税一键估算 | 有条工具',
  ogDescription: '2024 契税新政 140㎡ 线、满二满五免征自动判定，买方卖方税费与合计占比一目了然。',
  ogUrl: 'https://www.util.cn/tools/house-transfer-tax-calculator',
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
          name: '二手房税费计算器',
          url: 'https://www.util.cn/tools/house-transfer-tax-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '买方契税计算（首套/二套 × 140㎡ 新政税率线）',
            '增值税满二免征判定与价税分离计算',
            '个税满五唯一免征判定',
            '核定 1% / 差额 20% 双计征模式',
            '按取得日期自动计算持有年限（UTC 口径）',
            '满二与满五唯一免征价值情景对比',
            '买方卖方税费合计与占成交价比例',
            '纯本地计算不上传数据'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '二手房税费计算器', item: 'https://www.util.cn/tools/house-transfer-tax-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '二手房过户需要交哪些税？',
              acceptedAnswer: { '@type': 'Answer', text: '买方主要缴契税（首套/二套，140㎡及以下1%、以上1.5%/2%）；卖方缴增值税及附加（不满2年按含税价除以1.05再乘5%，满2年免征）和个人所得税（核定1%或差额20%，满五唯一免征）。个人住宅买卖印花税免征，另有登记费等小额规费。' }
            },
            {
              '@type': 'Question',
              name: '2024 契税新政 140 平方米线是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '自2024年12月1日起，契税优惠面积线由90㎡提高到140㎡：家庭首套140㎡及以下按1%、以上按1.5%；家庭第二套140㎡及以下按1%、以上按2%，全国统一执行，北上广深二套不再按3%。' }
            },
            {
              '@type': 'Question',
              name: '满五唯一怎么认定、从什么时候起算？',
              acceptedAnswer: { '@type': 'Answer', text: '满五指持有满5年，起算时间按契税完税凭证填发日期与不动产权证登记日期孰先原则认定；唯一指卖方家庭（含未成年子女）名下除该套外无其他住房。两者同时满足个税免征；只满五不唯一仍按1%或差额20%征收。' }
            },
            {
              '@type': 'Question',
              name: '个税差额 20% 和核定 1% 哪个划算？',
              acceptedAnswer: { '@type': 'Answer', text: '能提供原值凭证时可比较：增值额低于卖出价5%（即原值高于卖出价的95%）时差额20%更省，增值幅度大时核定1%更省。以200万卖出为例：原值高于190万选差额、低于190万选核定；无法提供原值凭证则只能核定1%。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const DEED_RATES_PCT = { first: { le140: 1, gt140: 1.5 }, second: { le140: 1, gt140: 2 } } // 2024-12 新政：优惠面积线 90㎡ → 140㎡
const VAT_RATE = 0.05          // 增值税征收率 5%
const VAT_DEDUCT = 1.05        // 价税分离分母（增值税为价外税）
const INDIV_RATE_PCT = 1       // 个税核定征收率 1%
const INDIV_DIFF_PCT = 20      // 个税差额征收率 20%
const FULL2_YEARS = 2          // 增值税满二免征线
const FULL5_YEARS = 5          // 个税满五免征线
const MS_PER_DAY = 86400000
// 手动档位对应的有效持有年限：不满二（取不足 2 年的代表值）/ 满二未满五 / 满五
const MANUAL_YEAR_PRESETS = { lt2: 1.9, gte2: 2.0, gte5: 5.0 }
const MANUAL_LABELS = { lt2: '不满 2 年', gte2: '满 2 年（未满 5）', gte5: '满 5 年' }

// 安全取数：非法输入归 0
function numOf(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// 正数化：非法或 <= 0 返回 0
function posNumOf(v) {
  const n = numOf(v)
  return n > 0 ? n : 0
}

/**
 * 买方契税（2024-12 新政全国口径：不再区分普通/非普通住宅与城市差异）
 * 首套 ≤140㎡ → 1%，>140㎡ → 1.5%；二套 ≤140㎡ → 1%，>140㎡ → 2%
 * @param price 成交价（元）
 * @param area  建筑面积（㎡）
 * @param isSecond 买方家庭是否二套及以上
 * @returns {{ratePct: number, amount: number}} ratePct 为百分数值（1 / 1.5 / 2）
 */
function deedTaxOf(price, area, isSecond) {
  const p = posNumOf(price)
  const a = posNumOf(area)
  const tier = a > 0 && a <= 140 ? 'le140' : 'gt140'
  const ratePct = isSecond ? DEED_RATES_PCT.second[tier] : DEED_RATES_PCT.first[tier]
  // 先乘税率百分数再除 100，避免 0.015 之类二进制误差累积
  const amount = Math.round(p * ratePct) / 100
  return { ratePct, amount }
}

// 'YYYY-MM-DD' 字符串或 Date → UTC 年月日（避免时区把日期挪到前一天）；非法返回 null
function utcPartsOf(dateLike) {
  if (dateLike instanceof Date) {
    return Number.isNaN(dateLike.getTime())
      ? null
      : { y: dateLike.getUTCFullYear(), m: dateLike.getUTCMonth(), d: dateLike.getUTCDate() }
  }
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(dateLike == null ? '' : dateLike).trim().slice(0, 10))
  if (!m) return null
  const y = +m[1]
  const mo = +m[2] - 1
  const d = +m[3]
  const dt = new Date(Date.UTC(y, mo, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo || dt.getUTCDate() !== d) return null
  return { y, m: mo, d }
}

function daysBetweenUtc(a, b) {
  return Math.round((Date.UTC(b.y, b.m, b.d) - Date.UTC(a.y, a.m, a.d)) / MS_PER_DAY)
}

// 第 n 个周年日（2/29 归化为当年 2/28）
function anniversaryOf(parts, n) {
  const y = parts.y + n
  const lastDay = new Date(Date.UTC(y, parts.m + 1, 0)).getUTCDate()
  return { y, m: parts.m, d: Math.min(parts.d, lastDay) }
}

/**
 * 持有年限（年，1 位小数，UTC 口径）：按日历周年对齐，周年日精确成立，
 * 小数部分向下取整，保证「满 2 / 满 5」只在真正到周年当日及以后才判定成立。
 * @param buyDate 取得日期（'YYYY-MM-DD' 或 Date）
 * @param today   截止日期（缺省用当前 UTC 日期）
 */
function holdingYearsOf(buyDate, today) {
  const s = utcPartsOf(buyDate)
  let e
  if (today !== undefined) {
    e = utcPartsOf(today)
  } else {
    const n = new Date()
    e = { y: n.getUTCFullYear(), m: n.getUTCMonth(), d: n.getUTCDate() }
  }
  if (!s || !e || daysBetweenUtc(s, e) < 0) return 0
  let whole = e.y - s.y
  if (e.m < s.m || (e.m === s.m && e.d < s.d)) whole -= 1
  if (whole < 0) whole = 0
  const a0 = anniversaryOf(s, whole)
  const a1 = anniversaryOf(s, whole + 1)
  const span = daysBetweenUtc(a0, a1)
  const frac = span > 0 ? daysBetweenUtc(a0, e) / span : 0
  return Math.floor((whole + frac) * 10 + 1e-6) / 10
}

/**
 * 卖方增值税：持有满 2 年免征；不满 2 年按「含税成交价 ÷ 1.05 × 5%」。
 * 注意：增值税是价外税，先价税分离（÷1.05）再乘 5%；此处仅为正税口径，
 * 城建税、教育费附加等附加税另计、未包含在本结果中。
 */
function vatOf(price, years) {
  const p = posNumOf(price)
  const y = numOf(years)
  if (p <= 0) return { amount: 0, free: false, taxable: false }
  if (y >= FULL2_YEARS) return { amount: 0, free: true, taxable: true }
  const amount = Math.round((p / VAT_DEDUCT) * VAT_RATE * 100) / 100
  return { amount, free: false, taxable: true }
}

/**
 * 卖方个人所得税：满五唯一（满 5 年且家庭唯一）免征；
 * 否则 mode='rate' 按成交价 1% 核定；mode='diff' 按（成交价 − 原值）× 20%，
 * 差价 ≤ 0（无增值）时免征并给出原因。
 */
function individualTaxOf(price, years, onlyHome, originalPrice, mode) {
  const p = posNumOf(price)
  const y = numOf(years)
  if (p <= 0) return { amount: 0, free: false, reason: '' }
  if (y >= FULL5_YEARS && onlyHome) return { amount: 0, free: true, reason: '满五唯一免征' }
  if (mode === 'diff') {
    const gain = p - posNumOf(originalPrice)
    if (gain <= 0) return { amount: 0, free: true, reason: '无增值差额免征' }
    const amount = Math.round(gain * INDIV_DIFF_PCT) / 100
    return { amount, free: false, reason: '' }
  }
  const amount = Math.round(p * INDIV_RATE_PCT) / 100
  return { amount, free: false, reason: '' }
}

// 持有档位判定：满二 / 满五 / 档位文案
function holdingStageOf(years) {
  const y = numOf(years)
  return {
    full2: y >= FULL2_YEARS,
    full5: y >= FULL5_YEARS,
    label: y >= FULL5_YEARS ? '满五' : y >= FULL2_YEARS ? '满二（未满五）' : '不满二'
  }
}

/**
 * 全链路汇总（规则引擎入口）
 * @param input { price(元), area(㎡), isSecond, years(年), onlyHome, mode('rate'|'diff'), originalPrice(元) }
 * @returns {{deedTax, deedRatePct, vat, vatFree, individualTax, individualFree, individualReason,
 *            taxFreeFive, buyerTotal, sellerTotal, grandTotal, price, area, years, isSecond, mode}}
 */
function calcAll(input) {
  const price = posNumOf(input && input.price)
  const area = posNumOf(input && input.area)
  const isSecond = !!(input && input.isSecond)
  const years = Math.max(0, numOf(input && input.years))
  const onlyHome = !!(input && input.onlyHome)
  const mode = input && input.mode === 'diff' ? 'diff' : 'rate'
  const originalPrice = posNumOf(input && input.originalPrice)

  const deed = deedTaxOf(price, area, isSecond)
  const vat = vatOf(price, years)
  const itax = individualTaxOf(price, years, onlyHome, originalPrice, mode)

  const buyerTotal = deed.amount
  const sellerTotal = vat.amount + itax.amount
  return {
    deedTax: deed.amount,
    deedRatePct: deed.ratePct,
    vat: vat.amount,
    vatFree: vat.free,
    individualTax: itax.amount,
    individualFree: itax.free,
    individualReason: itax.reason,
    taxFreeFive: price > 0 && years >= FULL5_YEARS && onlyHome,
    buyerTotal,
    sellerTotal,
    grandTotal: buyerTotal + sellerTotal,
    price,
    area,
    years,
    isSecond,
    mode
  }
}

/**
 * 情景对比（静态推演）：两条免征线在当前成交价下「值多少钱」
 * 行 1：增值税 · 满二 vs 不满二；行 2：个税 · 满五唯一 vs 满五不唯一
 */
function scenarioRowsOf(input) {
  const price = posNumOf(input && input.price)
  if (price <= 0) return []
  const years = Math.max(0, numOf(input && input.years))
  const onlyHome = !!(input && input.onlyHome)
  const mode = input && input.mode === 'diff' ? 'diff' : 'rate'
  const originalPrice = posNumOf(input && input.originalPrice)

  const vatNotFree = vatOf(price, 0).amount
  const taxNotOnly = individualTaxOf(price, Math.max(years, FULL5_YEARS), false, originalPrice, mode).amount

  return [
    {
      id: 'vat',
      name: '增值税 · 满二线',
      freeText: '满 2 年：免征（0 元）',
      unfreeLabel: '不满 2 年：',
      unfreeAmount: vatNotFree,
      saving: vatNotFree,
      satisfied: years >= FULL2_YEARS
    },
    {
      id: 'itax',
      name: '个税 · 满五唯一线',
      freeText: '满五唯一：免征（0 元）',
      unfreeLabel: '满五不唯一：',
      unfreeAmount: taxNotOnly,
      saving: taxNotOnly,
      satisfied: years >= FULL5_YEARS && onlyHome
    }
  ]
}

// 金额格式化：整数不带小数，非整数保留 2 位（到分）
function formatYuan(n) {
  const v = Math.round(numOf(n) * 100) / 100
  if (!Number.isFinite(v)) return '—'
  const text = Number.isInteger(v)
    ? v.toLocaleString('zh-CN')
    : v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${text} 元`
}

// 元 → 万（最多 2 位小数），用于公式代入展示，如 2000000 → '200万'
function yuanToWanText(yuan) {
  const v = numOf(yuan)
  if (v <= 0) return '0万'
  const wan = Math.round((v / 10000) * 100) / 100
  return `${wan}万`
}

// 金额占成交价的百分比（2 位小数），成交价无效返回 '—'
function percentOfAmount(amount, price) {
  const p = posNumOf(price)
  if (p <= 0) return '—'
  return `${((posNumOf(amount) / p) * 100).toFixed(2)}%`
}

// ---------- 页面状态 ----------
const seoContentVisible = ref(true)
const todayIso = ref('')          // 仅在 onMounted 填充（SSR 安全）
const priceWan = ref(200)         // 成交价（万元）
const areaSqm = ref(89)           // 建筑面积（㎡）
const isFirstHome = ref(true)     // 买方首套？
const yearsSource = ref('manual') // 'date' 按取得日期自动 | 'manual' 手动档位
const buyDate = ref('')           // 卖方房产取得日期
const manualYears = ref('gte2')   // 手动档位
const onlyHome = ref(true)        // 卖方家庭唯一住房
const taxMode = ref('rate')       // 个税计征：rate 核定 1% | diff 差额 20%
const originalWan = ref(0)        // 购房原值（万元）

const manualYearOptions = [
  { id: 'lt2', label: '不满 2 年' },
  { id: 'gte2', label: '满 2 年' },
  { id: 'gte5', label: '满 5 年' }
]

// ---------- 派生计算 ----------
const priceYuan = computed(() => posNumOf(numOf(priceWan.value) * 10000))
const areaNum = computed(() => numOf(areaSqm.value))
const areaValid = computed(() => areaNum.value >= 1 && areaNum.value <= 1000)
const priceValid = computed(() => priceYuan.value > 0)
const inputValid = computed(() => priceValid.value && areaValid.value)
const originalYuan = computed(() => {
  const o = numOf(originalWan.value)
  return o > 0 ? o * 10000 : 0
})

const holdingYears = computed(() => {
  if (yearsSource.value === 'date') {
    return buyDate.value ? holdingYearsOf(buyDate.value) : 0
  }
  return MANUAL_YEAR_PRESETS[manualYears.value] || 0
})
const holdingStage = computed(() => holdingStageOf(holdingYears.value))
const dateFuture = computed(() =>
  yearsSource.value === 'date' && !!buyDate.value && !!todayIso.value && buyDate.value > todayIso.value
)

const calcInput = computed(() => ({
  price: priceYuan.value,
  area: areaNum.value,
  isSecond: !isFirstHome.value,
  years: holdingYears.value,
  onlyHome: onlyHome.value,
  mode: taxMode.value,
  originalPrice: originalYuan.value
}))
const result = computed(() => calcAll(calcInput.value))
const scenarioRows = computed(() =>
  scenarioRowsOf(calcInput.value).map((row) => ({
    ...row,
    withoutBenefit: `${row.unfreeLabel}${formatYuan(row.unfreeAmount)}`
  }))
)

// ---------- 结果文案 ----------
const holdingText = computed(() => {
  if (yearsSource.value === 'date') {
    if (!buyDate.value) return '请选择房产取得日期，或切换到手动档位'
    if (dateFuture.value) return '取得日期晚于今天，已按 0 年（不满二）计算'
    return `自 ${buyDate.value} 起持有约 ${holdingYears.value} 年（${holdingStage.value.label}）`
  }
  return `按档位「${MANUAL_LABELS[manualYears.value] || '—'}」估算免税条件`
})

const vatBadge = computed(() => holdingYears.value >= 2
  ? { text: '满二免增值税', ok: true }
  : { text: '未满二 · 增值税按 5% 征收', ok: false })

const fiveBadge = computed(() => {
  if (holdingYears.value >= 5 && onlyHome.value) return { text: '满五唯一免个税', ok: true }
  if (holdingYears.value >= 5) return { text: '满五不唯一 · 个税仍需缴纳', ok: false }
  return { text: '未满五 · 不适用满五唯一免征', ok: false }
})

const taxStatusText = computed(() => {
  if (result.value.individualFree) return result.value.individualReason || '免征'
  if (holdingYears.value >= 5) return '满五不唯一，仍需按选定方式缴纳'
  return '未满五，按选定方式缴纳（即使家庭唯一）'
})

const deedNoteText = computed(() => {
  if (!inputValid.value) return '请先输入有效的成交价与面积'
  return `${isFirstHome.value ? '首套' : '二套'} ${areaNum.value}㎡ → 契税优惠税率 ${result.value.deedRatePct}%`
})

const deedFormula = computed(() => inputValid.value
  ? `${yuanToWanText(priceYuan.value)} × ${result.value.deedRatePct}% = ${formatYuan(result.value.deedTax)}`
  : '—')

const vatFormula = computed(() => {
  if (!priceValid.value) return '—'
  if (result.value.vatFree) return `持有 ${holdingYears.value} 年 ≥ 2 年，满二免征`
  return `${yuanToWanText(priceYuan.value)} ÷ 1.05 × 5% ≈ ${formatYuan(result.value.vat)}`
})

const taxFormula = computed(() => {
  if (!priceValid.value) return '—'
  if (result.value.individualFree) return result.value.individualReason || '免征'
  if (taxMode.value === 'diff') {
    return `(${yuanToWanText(priceYuan.value)} − ${yuanToWanText(originalYuan.value)}) × 20% = ${formatYuan(result.value.individualTax)}`
  }
  return `${yuanToWanText(priceYuan.value)} × 1% = ${formatYuan(result.value.individualTax)}`
})

// ---------- 交互（回调内，SSR 安全） ----------
function segClass(active) {
  return active
    ? 'px-3 py-2 rounded-lg border text-sm font-medium transition bg-primary/10 border-primary text-primary'
    : 'px-3 py-2 rounded-lg border text-sm font-medium transition bg-background border-border text-muted-foreground hover:border-primary/50'
}

function pad2(x) {
  return String(x).padStart(2, '0')
}

function localIsoOf(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function isoYearsAgo(n) {
  const d = new Date()
  d.setFullYear(d.getFullYear() - n)
  return localIsoOf(d)
}

// 载入示例：200 万 / 89㎡ / 首套 / 满 3 年（按日期自动）/ 家庭唯一 / 核定 1%
function loadExample() {
  priceWan.value = 200
  areaSqm.value = 89
  isFirstHome.value = true
  yearsSource.value = 'date'
  buyDate.value = isoYearsAgo(3)
  manualYears.value = 'gte2'
  onlyHome.value = true
  taxMode.value = 'rate'
  originalWan.value = 150
}

function resetForm() {
  priceWan.value = 200
  areaSqm.value = 89
  isFirstHome.value = true
  yearsSource.value = 'manual'
  buyDate.value = ''
  manualYears.value = 'gte2'
  onlyHome.value = true
  taxMode.value = 'rate'
  originalWan.value = 0
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  todayIso.value = localIsoOf(new Date())
  addRecentTool('house-transfer-tax-calculator')
})
</script>
