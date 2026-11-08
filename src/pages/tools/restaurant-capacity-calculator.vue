<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Utensils class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">翻台率产能计算</h1>
          <p class="text-sm text-muted-foreground mt-1">理论/现实翻台率分层估算 · 日产能餐位次与营收预估 · 目标营收反推座位数或翻台率</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        开餐馆、评估店面的产能计算器：按营业时段、用餐时长与清台时间算出理论翻台率（每桌全天串行最多翻几轮），
        再乘以峰值集中系数得到现实翻台率——客流不会均匀铺满全天，午晚高峰重叠会浪费产能，所以现实永远低于理论；
        进而推算日产能餐位次与日营收预估（可选毛利率展示毛利），并支持反推模式：给定目标日营收，
        反算需要多少座位数或多少翻台率。翻台率不是越高越好、外卖不计入堂食产能、节假日系数另调等口径提示随结果展示。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 说明条 -->
    <div class="flex items-start gap-2 px-4 py-3 mb-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-foreground">
      <Info class="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
      <span>口径分层：理论翻台率 = 营业时长 ÷ 每客占时（用餐 + 清台，每桌串行取整）；现实翻台率 = 理论 × 峰值集中系数（默认 0.55）；日产能 = 座位数 × 现实翻台率。本页按单一时段简化估算，午市/晚市结构差异大时可分两次计算再相加（见 FAQ）。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左列 -->
      <div class="space-y-6">
        <!-- 营业参数卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Timer class="w-5 h-5 mr-2 text-primary" /> 营业与翻台参数
          </h2>

          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="field-label">营业开始</span>
              <input v-model="openTime" type="time" class="input-base" />
            </label>
            <label class="block">
              <span class="field-label">营业结束</span>
              <input v-model="closeTime" type="time" class="input-base" />
            </label>
          </div>
          <p class="text-xs text-muted-foreground -mt-2">
            营业时长：{{ bizMinutes === null ? '时段无效（结束需晚于开始，跨午夜可自动处理）' : `${fmtNum(bizMinutes)} 分钟（${fmtNum(bizMinutes / 60)} 小时）` }}
          </p>

          <label class="block">
            <span class="field-label">每客用餐时长（分钟）</span>
            <div class="flex flex-wrap items-center gap-2">
              <button
                v-for="p in MEAL_PRESETS"
                :key="p.value"
                type="button"
                @click="mealMinutesInput = p.value"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition border"
                :class="numOf(mealMinutesInput) === p.value
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-muted hover:bg-muted/80 text-foreground border-border'"
              >
                {{ p.label }} {{ p.value }} 分钟
              </button>
              <input v-model.number="mealMinutesInput" type="number" min="5" step="5" class="w-24 px-2.5 py-1.5 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </label>

          <label class="block">
            <span class="field-label">清台与翻场时间：{{ clearMinutes }} 分钟</span>
            <input v-model.number="clearMinutesInput" type="range" min="5" max="20" step="1" class="w-full accent-[hsl(var(--primary))]" />
            <span class="text-[10px] text-muted-foreground mt-1 block">客人起身到下一桌入座：撤台、擦桌、重新摆台，快餐 5-10 分钟、正餐 10-15 分钟</span>
          </label>

          <label class="block">
            <span class="field-label">峰值集中系数：{{ coefText }}（{{ coefLabel }}）</span>
            <input v-model.number="coefInput" type="range" min="0.3" max="0.8" step="0.05" class="w-full accent-[hsl(var(--primary))]" />
            <span class="text-[10px] text-muted-foreground mt-1 block">
              客流不会均匀铺满全天：午晚高峰桌位挤满、平峰大量空置，高峰重叠会浪费产能，所以现实翻台率 = 理论 × 系数。0.3 客流极不均（强午晚两峰），0.55 大众餐饮常见，0.8 全天较均匀（景区/商圈店）
            </span>
          </label>

          <div v-if="paramWarning" class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
            <TriangleAlert class="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-red-600 leading-relaxed">{{ paramWarning }}</p>
          </div>
        </div>

        <!-- 反推模式卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Target class="w-5 h-5 mr-2 text-primary" /> 反推：目标日营收要什么条件
          </h2>
          <div class="flex gap-2">
            <button
              type="button"
              @click="reverseMode = 'seats'"
              class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition border"
              :class="reverseMode === 'seats' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border hover:text-foreground'"
            >
              求座位数（翻台率已定）
            </button>
            <button
              type="button"
              @click="reverseMode = 'turns'"
              class="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition border"
              :class="reverseMode === 'turns' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border hover:text-foreground'"
            >
              求翻台率（座位数已定）
            </button>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="field-label">目标日营收（元）</span>
              <input v-model.number="targetRevenueInput" type="number" min="0" step="1000" placeholder="如：36300" class="input-base" />
            </label>
            <label class="block">
              <span class="field-label">客单价（元/人次）</span>
              <input v-model.number="reverseTicketInput" type="number" min="0" step="5" placeholder="如：60" class="input-base" />
            </label>
          </div>
          <p class="text-xs text-muted-foreground -mt-1">峰值集中系数沿用左侧滑块（{{ coefText }}）。</p>

          <template v-if="reverseResult !== null">
            <div class="bg-primary/10 rounded-lg p-5 text-center">
              <template v-if="reverseMode === 'seats'">
                <p class="text-xs text-muted-foreground mb-1">按理论翻台 {{ theoryTurnsText }} 轮 × 系数 {{ coefText }} × 客单 {{ fmtNum(reverseTicket) }} 元，做到日营收 {{ fmtNum(reverseTargetRevenue) }} 元需要</p>
                <p class="text-3xl font-bold text-primary">≥ {{ fmtNum(reverseResult) }} 座</p>
                <p class="text-xs text-muted-foreground mt-2">公式：座位数 = 目标营收 ÷（客单价 × 系数 × 理论翻台率），向上取整</p>
              </template>
              <template v-else>
                <p class="text-xs text-muted-foreground mb-1">按 {{ seats }} 座 × 系数 {{ coefText }} × 客单 {{ fmtNum(reverseTicket) }} 元，做到日营收 {{ fmtNum(reverseTargetRevenue) }} 元需要理论翻台率达到</p>
                <p class="text-3xl font-bold text-primary">{{ fmtNum(reverseResult) }} 轮</p>
                <p class="text-xs text-muted-foreground mt-2">公式：理论翻台率 = 目标营收 ÷（座位数 × 客单价 × 系数），向上取整；再对照左侧行动：缩短用餐时长或延长营业时段</p>
              </template>
            </div>
          </template>
          <p v-else class="text-sm text-muted-foreground">{{ reverseHint }}</p>
        </div>
      </div>

      <!-- 右列 -->
      <div class="space-y-6">
        <!-- 产能结论卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 产能与营收结论
          </h2>

          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">理论翻台率</p>
              <p class="text-2xl font-bold text-foreground">{{ theoryTurns === null ? '—' : theoryTurns }}</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">轮（每桌串行上限）</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">现实翻台率</p>
              <p class="text-2xl font-bold text-foreground">{{ realTurnsText }}</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">轮（× 系数 {{ coefText }}）</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">日产能餐位次</p>
              <p class="text-2xl font-bold text-foreground">{{ capacitySeats === null ? '—' : fmtNum(capacitySeats) }}</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">人次/日</p>
            </div>
          </div>

          <template v-if="dailyRevenue !== null">
            <div class="bg-primary/10 rounded-lg p-6 text-center">
              <p class="text-xs text-muted-foreground mb-1">日营收预估（堂食）</p>
              <p class="text-5xl font-bold text-primary leading-none">{{ fmtNum(dailyRevenue) }}</p>
              <p class="text-sm font-medium text-primary mt-2">元 / 日</p>
              <p class="text-xs text-muted-foreground mt-3">
                {{ seats }} 座 × {{ fmtNum(realTurns) }} 轮 × 客单 {{ fmtNum(avgTicket) }} 元 · 折合月营收（按 30 天）约 {{ fmtNum(dailyRevenue * 30) }} 元
              </p>
            </div>
            <div v-if="grossProfit !== null" class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">按毛利率 {{ fmtNum(grossPct) }}% 折算</p>
              <p class="text-xl font-bold text-green-600">毛利约 {{ fmtNum(grossProfit) }} 元/日</p>
              <p class="text-[10px] text-muted-foreground mt-1">毛利 = 日营收 × 毛利率，未扣房租人工等固定成本，不能直接当净利润</p>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                计算链：营业 {{ bizMinutes === null ? '—' : fmtNum(bizMinutes) }} 分钟 ÷ 每客占时 {{ perGuest === null ? '—' : fmtNum(perGuest) }} 分钟（用餐 {{ fmtNum(mealMinutes) }} + 清台 {{ clearMinutes }}）
                = 理论 {{ theoryTurns === null ? '—' : theoryTurns }} 轮；理论 {{ theoryTurns === null ? '—' : theoryTurns }} × 系数 {{ coefText }} = {{ realTurnsExactText }}（显示约 {{ realTurnsText }} 轮）；
                {{ seats }} 座 × {{ fmtNum(realTurns) }} = {{ capacitySeats === null ? '—' : fmtNum(capacitySeats) }} 餐位次 × 客单 {{ fmtNum(avgTicket) }} 元 = 日营收。
              </span>
            </p>
          </template>
          <div v-else class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-2">
            <TriangleAlert class="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-red-600 leading-relaxed">{{ paramWarning || '请先补全座位数与客单价（均大于 0）。' }}</p>
          </div>
        </div>

        <!-- 经营参数卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Users class="w-5 h-5 mr-2 text-primary" /> 座位与客单
          </h2>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="field-label">座位数（堂食餐位）</span>
              <input v-model.number="seatsInput" type="number" min="1" step="1" placeholder="如：100" class="input-base" />
            </label>
            <label class="block">
              <span class="field-label">客单价（元/人次）</span>
              <input v-model.number="ticketInput" type="number" min="0" step="5" placeholder="如：60" class="input-base" />
            </label>
            <label class="block">
              <span class="field-label">毛利率（%，选填）</span>
              <input v-model.number="grossPctInput" type="number" min="0" max="100" step="1" placeholder="如：65" class="input-base" />
              <span class="text-[10px] text-muted-foreground mt-1 block">餐饮综合毛利常见 55%-70%</span>
            </label>
            <div class="grid grid-cols-2 gap-2 content-end">
              <button
                @click="loadExample"
                class="px-3 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5"
              >
                <Play class="w-4 h-4" /> 示例
              </button>
              <button
                @click="resetInputs"
                class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border text-foreground rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw class="w-4 h-4" /> 重置
              </button>
            </div>
          </div>
        </div>

        <!-- 诚实卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <TriangleAlert class="w-5 h-5 mr-2 text-amber-500" /> 口径诚实卡：三个常见误区
          </h2>
          <div class="space-y-2.5">
            <div class="flex items-start gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2.5">
              <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p class="text-xs text-muted-foreground leading-relaxed">
                <span class="text-foreground font-medium">翻台率不是越高越好。</span>一味压缩用餐时长赶客，伤体验、伤复购、伤员工负荷与出品质稳；
                翻台率是产能上限的估计，最终目标还是营收与利润（可结合盈亏平衡计算器看保本点）。
              </p>
            </div>
            <div class="flex items-start gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2.5">
              <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p class="text-xs text-muted-foreground leading-relaxed">
                <span class="text-foreground font-medium">外卖不计入堂食产能。</span>外卖走的是出餐产能（灶台、打包、骑手），不占座位；
                本页所有结果只覆盖堂食，外卖营收请单独测算，别把外卖单量折进翻台率。
              </p>
            </div>
            <div class="flex items-start gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2.5">
              <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p class="text-xs text-muted-foreground leading-relaxed">
                <span class="text-foreground font-medium">节假日系数另调。</span>本页默认按平日客流估计；周末、节假日与店庆的峰值集中程度和客流结构都不同，
                系数与客单价建议单独测算一轮，别拿平日的日营收直接乘 30 天做月预算。
              </p>
            </div>
          </div>
        </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>翻台率产能计算是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          翻台率产能计算是一款面向餐饮开店者与小餐馆老板的产能与营收估算工具。它把翻台率诚实地分成两层：
          理论翻台率 = 营业时长 ÷ 每客占时（用餐时长 + 清台时间，每桌串行取整），是全天不歇客的天花板；
          现实翻台率 = 理论 × 峰值集中系数（默认 0.55，可调 0.3-0.8），因为客流不会均匀铺满全天，午晚高峰重叠会浪费产能。
          在此基础上推算日产能餐位次（座位数 × 现实翻台率）与日营收预估（餐位次 × 客单价，可按毛利率折算毛利），
          并支持反推模式：给定目标日营收与客单价，反算需要多少座位数或多少理论翻台率。
          全部计算在你的浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">翻台率怎么计算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          翻台率 = 一张桌子全天接待了几轮客人。理论翻台率 = 营业时长 ÷ 每客占时，其中每客占时 = 用餐时长 + 清台时间，
          结果向下取整——桌子只能整轮接待。举例：营业 11:00-21:30 共 630 分钟，每客用餐 45 分钟、清台 10 分钟，占时 55 分钟，
          理论翻台率 = 630 ÷ 55 = 11.45 → 向下取整 11 轮。但这是「桌桌无缝衔接」的天花板：现实中客流集中在午晚高峰，
          高峰桌位挤满、平峰大量空置，所以要乘峰值集中系数：11 × 0.55 = 6.05 轮（显示约 6.1），
          100 座 × 6.05 × 客单 60 元 = 日营收约 36,300 元。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么实际翻台率达不到理论值？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          因为产能与客流在时间上错配。理论翻台率假设全天 630 分钟每一桌都刚好坐满又刚好翻场，但大众餐饮的客流通常一半以上压在午市 1-2 小时和晚市 2-3 小时里：
          高峰时排队等位（产能不足，客人流失），平峰时大量空桌（产能闲置）。峰值集中系数就是给这种浪费定的折扣——
          客流越集中系数越低（取 0.3-0.4），全天流量较均匀的商圈/景区店可取 0.7-0.8。判断自己店的真实系数，
          最好连续记录几天的分时段入场人数，用「实际接待轮数 ÷ 理论轮数」反推。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">午市和晚市怎么分开算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本页保持单一时段简化估算。当午市与晚市的用餐时长、客单价差异明显（如工作日午市快餐 30 分钟客单 25 元、晚市正餐 60 分钟客单 80 元），
          建议分两次计算：午市时段（如 11:00-14:00）按午市参数算一次餐位次，晚市时段（17:00-21:00）按晚市参数算一次，
          两段餐位次分别乘各自客单价后相加。分段计算比单时段粗估更接近真实营收，代价是要多维护一组参数——两种口径都可用本页完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">翻台率越高越好吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不是。翻台率是产能利用指标，不是目标本身。一味压用餐时长、催客起身，短期能多翻两轮，代价是体验下降、差评增多、
          员工满负荷出错率高、出品赶工质量下滑——复购掉下来的损失往往超过多翻一两轮的营收。
          健康的做法是先保证客单价与体验，再在动线（点单/出餐/结账速度）、菜单结构（减少长耗时菜品）、清台效率上找无痛提速的空间，
          并始终盯着「营收 − 成本」而不是翻台率数字本身。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么提高翻台率？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          无痛提速主要四条：一是压缩等待与流程——扫码点单、提前结账、叫号等位把高峰堵点挪到产能空闲时段；
          二是优化菜单——减少 40 分钟以上的长耗时菜，或提前预制半成品；三是清台效率——配置专职清台岗、桌面易清洁材质，把清台从 15 分钟压到 8 分钟；
          四是错峰引导——平峰时段套餐折扣、下午茶，把高峰客流匀到平峰（这同时抬高峰值集中系数）。
          每做一项改动，用本页重新估一遍：理论轮数与系数各变了多少、日营收差多少，用数字验证值不值。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">翻台率怎么计算？</h3>
            <p class="text-sm text-muted-foreground mt-1">理论翻台率 = 营业时长 ÷ 每客占时（用餐时长 + 清台时间），向下取整。例：营业 630 分钟、每客占时 55 分钟 → 630 ÷ 55 = 11 轮；现实翻台率再乘峰值集中系数（默认 0.55）→ 约 6.1 轮。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么实际翻台率达不到理论值？</h3>
            <p class="text-sm text-muted-foreground mt-1">客流集中在午晚高峰，高峰排队产能不足、平峰空桌产能闲置，理论值的「无缝衔接」不存在。峰值集中系数（0.3-0.8）就是给这种浪费的折扣，客流越集中系数越低。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">午市和晚市怎么分开算？</h3>
            <p class="text-sm text-muted-foreground mt-1">本页按单时段简化。差异明显时分两次算：午市时段按午市的时长/客单算一次餐位次，晚市再算一次，分别乘各自客单价后相加，比粗估更准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">翻台率越高越好吗？外卖算不算？</h3>
            <p class="text-sm text-muted-foreground mt-1">翻台率不是越高越好：压缩用餐时长赶客伤体验、伤复购、推高员工负荷。外卖不占座位、走的是出餐产能，不计入本页的堂食产能与营收，请单独测算。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">日营收预估能当月营收计划用吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">只能当平日的量级参考：节假日系数与客单价需另调，直接乘 30 天会高估或低估月营收。稳妥做法是平日、周末各估一档，按当月天数加权；再叠固定成本看保本点。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'restaurant-capacity-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Utensils, Timer, Calculator, Target, Users, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '翻台率产能计算 - 餐厅日营收与餐位产能在线估算',
  description: '免费在线翻台率计算器：按营业时段、用餐时长与清台时间算理论与现实翻台率（峰值集中系数可调），推算日产能餐位次与日营收预估，支持目标营收反推座位数或翻台率，附午晚市分段、外卖与节假日口径提示，纯本地计算不上传',
  keywords: '翻台率计算,餐厅产能,餐位数,餐饮营收预估,翻台率怎么算',
  author: '有条工具',
  ogTitle: '翻台率产能计算 - 餐厅日营收与餐位产能在线估算 | 有条工具',
  ogDescription: '理论与现实翻台率分层估算，日产能与营收预估，目标营收反推座位数或翻台率。',
  ogUrl: 'https://www.util.cn/tools/restaurant-capacity-calculator',
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
          name: '翻台率产能计算',
          url: 'https://www.util.cn/tools/restaurant-capacity-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['理论翻台率（营业时长÷每客占时，串行取整）', '现实翻台率（峰值集中系数 0.3-0.8 可调）', '日产能餐位次与日营收预估', '毛利率折算毛利', '目标营收反推座位数或翻台率', '用餐时长快捷档（快餐/正餐/宴席）', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '翻台率产能计算', item: 'https://www.util.cn/tools/restaurant-capacity-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '翻台率怎么计算？',
              acceptedAnswer: { '@type': 'Answer', text: '理论翻台率 = 营业时长 ÷ 每客占时（用餐时长 + 清台时间），向下取整。例：营业 630 分钟、每客占时 55 分钟 → 11 轮；现实翻台率再乘峰值集中系数（默认 0.55）→ 约 6.1 轮。' }
            },
            {
              '@type': 'Question',
              name: '为什么实际翻台率达不到理论值？',
              acceptedAnswer: { '@type': 'Answer', text: '客流集中在午晚高峰，高峰排队产能不足、平峰空桌产能闲置，理论值的「无缝衔接」不存在。峰值集中系数（0.3-0.8）就是给这种浪费的折扣，客流越集中系数越低。' }
            },
            {
              '@type': 'Question',
              name: '午市和晚市怎么分开算？',
              acceptedAnswer: { '@type': 'Answer', text: '本页按单时段简化。差异明显时分两次算：午市时段按午市的时长/客单算一次餐位次，晚市再算一次，分别乘各自客单价后相加，比粗估更准。' }
            },
            {
              '@type': 'Question',
              name: '翻台率越高越好吗？外卖算不算？',
              acceptedAnswer: { '@type': 'Answer', text: '翻台率不是越高越好：压缩用餐时长赶客伤体验、伤复购、推高员工负荷。外卖不占座位、走的是出餐产能，不计入堂食产能与营收，请单独测算。' }
            },
            {
              '@type': 'Question',
              name: '日营收预估能当月营收计划用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '只能当平日的量级参考：节假日系数与客单价需另调，直接乘 30 天会失真。稳妥做法是平日、周末各估一档按当月天数加权，再叠固定成本看保本点。' }
            }
          ]
        }
      ]
    })
  }]
})

/* ==== 纯函数（node 自测提取区）begin ==== */
const COEF_MIN = 0.3      // 峰值集中系数下限（客流极端集中）
const COEF_MAX = 0.8      // 峰值集中系数上限（全天较均匀）
const COEF_DEFAULT = 0.55 // 大众餐饮常见系数

// null / undefined / 空串视为未填（非法）返回 null；其余转 Number，非有限值也返回 null
function validNumOf(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// 解析 HH:MM 为当日分钟数；格式非法或越界返回 null
function parseHHMMOf(text) {
  const s = String(text == null ? '' : text).trim()
  const m = s.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return h * 60 + min
}

// 营业分钟数 = 结束 − 开始；结束 ≤ 开始视为跨午夜自动 +24h；任一时刻非法返回 null
function businessMinutesOf(startHHMM, endHHMM) {
  const s = parseHHMMOf(startHHMM)
  const e = parseHHMMOf(endHHMM)
  if (s === null || e === null) return null
  let diff = e - s
  if (diff <= 0) diff += 24 * 60
  return diff
}

// 每客占时 = 用餐时长 + 清台时间；用餐 ≤ 0 或非法返回 null，清台为负钳 0
function perGuestMinutesOf(mealMinutes, clearMinutes) {
  const m = validNumOf(mealMinutes)
  const c = validNumOf(clearMinutes)
  if (m === null || c === null || m <= 0) return null
  return m + Math.max(0, c)
}

// 理论翻台率 = 营业时长 ÷ 每客占时，每桌串行向下取整；任一 ≤ 0（含除零）返回 null
function theoryTurnsOf(businessMinutes, perGuestMinutes) {
  const b = validNumOf(businessMinutes)
  const p = validNumOf(perGuestMinutes)
  if (b === null || p === null || b <= 0 || p <= 0) return null
  return Math.floor(b / p)
}

// 峰值集中系数钳制到 [0.3, 0.8]，非法回退默认 0.55
function clampCoefOf(coef) {
  const c = validNumOf(coef)
  if (c === null) return COEF_DEFAULT
  return Math.min(COEF_MAX, Math.max(COEF_MIN, c))
}

// 现实翻台率 = 理论 × 峰值集中系数；理论非法/为负或系数 ≤ 0 返回 null
function realTurnsOf(theoryTurns, coef) {
  const t = validNumOf(theoryTurns)
  const c = validNumOf(coef)
  if (t === null || c === null || t < 0 || c <= 0) return null
  return t * c
}

// 日产能餐位次 = 座位数 × 现实翻台率；座位 ≤ 0 或翻台非法返回 null
function capacitySeatsOf(seatCount, realTurns) {
  const n = validNumOf(seatCount)
  const t = validNumOf(realTurns)
  if (n === null || t === null || n <= 0 || t < 0) return null
  return n * t
}

// 日营收 = 餐位次 × 客单价；客单 ≤ 0 或餐位次非法返回 null
function dailyRevenueOf(capacitySeats, avgTicket) {
  const c = validNumOf(capacitySeats)
  const p = validNumOf(avgTicket)
  if (c === null || p === null || p <= 0 || c < 0) return null
  return c * p
}

// 毛利 = 日营收 × 毛利率(%)；营收非法或毛利率不在 [0,100] 返回 null
function grossProfitOf(dailyRevenue, grossPct) {
  const r = validNumOf(dailyRevenue)
  const g = validNumOf(grossPct)
  if (r === null || g === null || r < 0 || g < 0 || g > 100) return null
  return r * (g / 100)
}

// 反推座位数 = 目标营收 ÷（客单 × 系数 × 理论翻台），向上取整；任一 ≤ 0（含除零）返回 null
function seatsForOf(targetRevenue, avgTicket, coef, theoryTurns) {
  const t = validNumOf(targetRevenue)
  const p = validNumOf(avgTicket)
  const c = validNumOf(coef)
  const n = validNumOf(theoryTurns)
  if (t === null || p === null || c === null || n === null) return null
  if (t <= 0 || p <= 0 || c <= 0 || n <= 0) return null
  return Math.ceil(t / (p * c * n) - 1e-9)
}

// 反推理论翻台率 = 目标营收 ÷（座位 × 客单 × 系数），向上取整；任一 ≤ 0（含除零）返回 null
function theoryTurnsForOf(targetRevenue, seatCount, avgTicket, coef) {
  const t = validNumOf(targetRevenue)
  const n = validNumOf(seatCount)
  const p = validNumOf(avgTicket)
  const c = validNumOf(coef)
  if (t === null || n === null || p === null || c === null) return null
  if (t <= 0 || n <= 0 || p <= 0 || c <= 0) return null
  return Math.ceil(t / (n * p * c) - 1e-9)
}
/* ==== 纯函数（node 自测提取区）end ==== */

// ---------- 输入状态 ----------
const MEAL_PRESETS = [
  { label: '快餐', value: 30 },
  { label: '正餐', value: 45 },
  { label: '宴席', value: 90 }
]

const DEFAULTS = {
  openTime: '11:00',
  closeTime: '21:30',
  mealMinutes: 45,
  clearMinutes: 10,
  coef: 0.55,
  seats: 100,
  ticket: 60,
  grossPct: 65,
  targetRevenue: 36300,
  reverseTicket: 60
}

const openTime = ref(DEFAULTS.openTime)
const closeTime = ref(DEFAULTS.closeTime)
const mealMinutesInput = ref(DEFAULTS.mealMinutes)
const clearMinutesInput = ref(DEFAULTS.clearMinutes)
const coefInput = ref(DEFAULTS.coef)
const seatsInput = ref(DEFAULTS.seats)
const ticketInput = ref(DEFAULTS.ticket)
const grossPctInput = ref(DEFAULTS.grossPct)

const reverseMode = ref('seats')
const targetRevenueInput = ref(DEFAULTS.targetRevenue)
const reverseTicketInput = ref(DEFAULTS.reverseTicket)

const seoContentVisible = ref(true)

// 空输入/非法输入统一按 0 处理
function numOf(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// ---------- 翻台链计算 ----------
const bizMinutes = computed(() => businessMinutesOf(openTime.value, closeTime.value))
const mealMinutes = computed(() => numOf(mealMinutesInput.value))
const clearMinutes = computed(() => Math.min(20, Math.max(5, numOf(clearMinutesInput.value) || 10)))
const coef = computed(() => clampCoefOf(coefInput.value))
const coefText = computed(() => coef.value.toFixed(2))
const coefLabel = computed(() => {
  const c = coef.value
  if (c < 0.45) return '客流极不均匀'
  if (c < 0.65) return '大众餐饮常见'
  return '全天较均匀'
})
const perGuest = computed(() => perGuestMinutesOf(mealMinutes.value, clearMinutes.value))
const theoryTurns = computed(() => theoryTurnsOf(bizMinutes.value, perGuest.value))
const realTurns = computed(() => realTurnsOf(theoryTurns.value, coef.value))
const realTurnsText = computed(() => (realTurns.value === null ? '—' : (Math.round(realTurns.value * 10) / 10).toFixed(1)))
const realTurnsExactText = computed(() => (realTurns.value === null ? '—' : realTurns.value.toFixed(2)))

const seats = computed(() => numOf(seatsInput.value))
const avgTicket = computed(() => numOf(ticketInput.value))
const grossPct = computed(() => numOf(grossPctInput.value))

const capacitySeats = computed(() => capacitySeatsOf(seats.value, realTurns.value))
const dailyRevenue = computed(() => dailyRevenueOf(capacitySeats.value, avgTicket.value))
const grossProfit = computed(() => (grossPct.value > 0 && grossPct.value <= 100 ? grossProfitOf(dailyRevenue.value, grossPct.value) : null))

const theoryTurnsText = computed(() => (theoryTurns.value === null ? '—' : `${theoryTurns.value}`))

const paramWarning = computed(() => {
  if (bizMinutes.value === null) return '营业时段无效：请用「开始/结束时间」选择器填写，结束早于开始会按跨午夜处理。'
  if (perGuest.value === null) return '请填写大于 0 的每客用餐时长（分钟）。'
  return ''
})

// ---------- 反推 ----------
const reverseTargetRevenue = computed(() => numOf(targetRevenueInput.value))
const reverseTicket = computed(() => numOf(reverseTicketInput.value))
const reverseResult = computed(() => {
  if (reverseMode.value === 'seats') {
    return seatsForOf(reverseTargetRevenue.value, reverseTicket.value, coef.value, theoryTurns.value)
  }
  return theoryTurnsForOf(reverseTargetRevenue.value, seats.value, reverseTicket.value, coef.value)
})
const reverseHint = computed(() => {
  if (bizMinutes.value === null || perGuest.value === null) return '先在左侧补全营业时段与用餐时长，理论翻台率有效后才能反推。'
  if (reverseMode.value === 'seats') return `需要理论翻台率有效（当前 ${theoryTurnsText.value} 轮），并填入大于 0 的目标日营收与客单价。`
  return '填入大于 0 的目标日营收与客单价（座位数沿用左侧经营参数）。'
})

// ---------- 展示工具 ----------
function fmtNum(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  const r = Math.round(v * 100) / 100
  return Number.isInteger(r)
    ? r.toLocaleString('zh-CN')
    : r.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
}

// ---------- 操作 ----------
function loadExample() {
  openTime.value = DEFAULTS.openTime
  closeTime.value = DEFAULTS.closeTime
  mealMinutesInput.value = DEFAULTS.mealMinutes
  clearMinutesInput.value = DEFAULTS.clearMinutes
  coefInput.value = DEFAULTS.coef
  seatsInput.value = DEFAULTS.seats
  ticketInput.value = DEFAULTS.ticket
  grossPctInput.value = DEFAULTS.grossPct
  targetRevenueInput.value = DEFAULTS.targetRevenue
  reverseTicketInput.value = DEFAULTS.reverseTicket
}
function resetInputs() {
  loadExample()
  reverseMode.value = 'seats'
}
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('restaurant-capacity-calculator')
})
</script>

<style scoped>
.input-base {
  @apply w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30;
}
.field-label {
  @apply block text-[10px] text-muted-foreground mb-1;
}
</style>
