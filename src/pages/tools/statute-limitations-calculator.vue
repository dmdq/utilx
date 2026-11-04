<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Scale class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">诉讼时效计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按《民法典》第 188 条普通时效 3 年、第 594 条特殊时效 4 年与《劳动争议调解仲裁法》第 27 条仲裁时效 1 年口径测算届满日</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线诉讼时效计算器：选择时效类型并输入起算日（知道或应当知道权利受损之日），按《民法典》第 188 / 201 / 202 条的
        「对应日」口径自动算出普通 3 年、特殊 4 年或劳动仲裁 1 年时效的法定届满日与剩余天数；届满日落在周末时按第 203 条口径
        顺延（简化为顺延至下一周一），并可同时输入权利受损日，对照第 188 条第 2 款的 20 年最长保护期、自动提示哪一期先到期。
        附中断（第 195 条）与中止（第 194 条）规则提示卡。全部计算在浏览器本地完成，不上传、不保存任何日期数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calendar class="w-5 h-5 mr-2 text-primary" /> 时效类型与起算信息
        </h2>

        <!-- 时效类型 -->
        <div>
          <label for="statute-type" class="block text-sm font-medium text-foreground mb-2">时效类型</label>
          <select
            id="statute-type"
            v-model="typeId"
            class="w-full px-2.5 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="t in TYPES" :key="t.id" :value="t.id">{{ t.label }}</option>
          </select>
          <p class="text-xs leading-relaxed mt-2 p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>{{ activeType.desc }}</span>
          </p>
        </div>

        <!-- 起算日 -->
        <div>
          <label for="statute-start" class="block text-sm font-medium text-foreground mb-2">起算日（知道或应当知道权利受损之日）</label>
          <input
            id="statute-start"
            v-model="startDate"
            type="date"
            class="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground leading-relaxed mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>起算日当天不计入，自次日起开始计算（第 201 条）；届满日取 3 / 4 / 1 年后到期月的「对应日」（第 202 条）。</span>
          </p>
        </div>

        <!-- 权利受损日（20 年最长保护期对照） -->
        <div v-if="activeType.id !== 'labor'">
          <label for="statute-damage" class="block text-sm font-medium text-foreground mb-2">权利受损日（用于 20 年最长保护期对照，可选）</label>
          <input
            id="statute-damage"
            v-model="damageDate"
            type="date"
            class="w-full px-2.5 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground leading-relaxed mt-1.5">
            通常与起算日相同或更早；若知道权利受损远晚于实际受损，20 年最长保护期可能先到期。
          </p>
        </div>
        <p v-else class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <span>劳动争议仲裁时效适用《劳动争议调解仲裁法》，该法未设 20 年最长保护期规则，故无需填写权利受损日。</span>
        </p>

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
          <Clock class="w-5 h-5 mr-2 text-primary" /> 时效测算结果
        </h2>

        <template v-if="canCalc">
          <!-- 届满日主卡 -->
          <div class="bg-primary/10 rounded-lg p-4 space-y-3">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p class="text-xs text-muted-foreground mb-1">期间最后一日（{{ activeType.years }} 年期{{ result.delayed ? '，周末顺延后' : '' }}）</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ fmtDate(result.final) }}</p>
                <p class="text-xs text-muted-foreground mt-1">
                  法定届满日（对应日）：{{ fmtDate(result.rawExpiry) }}<span v-if="result.delayed">（{{ weekdayName(result.rawExpiry) }}，依第 203 条顺延）</span>
                </p>
              </div>
              <span
                v-if="statusBadge"
                class="text-xs px-2.5 py-1 rounded-full font-medium"
                :class="statusBadge.cls"
              >{{ statusBadge.text }}</span>
            </div>

            <div v-if="remainingText" class="flex justify-between items-center p-3 bg-background rounded-lg">
              <span class="text-sm text-muted-foreground">剩余天数（自 {{ todayStr }} 起，计至期间最后一日）</span>
              <span class="font-semibold text-foreground" :class="result.remaining < 0 ? 'text-red-500' : ''">{{ remainingText }}</span>
            </div>

            <p v-if="result.delayed" class="text-xs leading-relaxed p-2.5 rounded bg-yellow-500/10 text-foreground flex items-start gap-1.5">
              <TriangleAlert class="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <span>简化口径：本工具仅把落在周六 / 周日的届满日顺延至下一周一；如恰逢春节、国庆等法定节假日（含调休上班日），请按第 203 条完整口径自行核对日历。</span>
            </p>
            <p v-if="result.lastSixMonths" class="text-xs leading-relaxed p-2.5 rounded bg-yellow-500/10 text-foreground flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <span>已进入时效期间最后六个月：此区间内如遇不可抗力等第 194 条中止事由，可主张时效中止（自原因消除之日起满六个月届满）。</span>
            </p>
          </div>

          <!-- 20 年最长保护期对照卡 -->
          <div v-if="result.longCap" class="border border-border rounded-lg p-4 bg-muted/30 space-y-2">
            <div class="flex items-center gap-2">
              <Hourglass class="w-4 h-4 text-primary" />
              <p class="text-sm font-semibold text-foreground">20 年最长保护期对照（第 188 条第 2 款）</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div class="p-2.5 rounded bg-background">
                <p class="text-xs text-muted-foreground">{{ activeType.years }} 年时效届满（顺延后）</p>
                <p class="font-mono font-semibold text-foreground mt-0.5">{{ fmtDate(result.final) }}</p>
              </div>
              <div class="p-2.5 rounded bg-background">
                <p class="text-xs text-muted-foreground">20 年最长保护期届满（顺延后）</p>
                <p class="font-mono font-semibold text-foreground mt-0.5">{{ fmtDate(result.longCap.final) }}</p>
              </div>
            </div>
            <p class="text-xs leading-relaxed text-foreground flex items-start gap-1.5">
              <component :is="capFirst ? TriangleAlert : CheckCircle" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" :class="capFirst ? 'text-red-500' : 'text-green-600'" />
              <span v-if="capFirst">权利受损日远早于起算日：20 年最长保护期先到期，法院保护以 {{ fmtDate(result.longCap.final) }} 为限。</span>
              <span v-else-if="capSameDay">两期同日届满，以该日为最后一日。</span>
              <span v-else>{{ activeType.years }} 年时效先到期，20 年最长保护期（{{ fmtDate(result.longCap.final) }} 届满）尚未构成障碍。</span>
            </p>
          </div>

          <!-- 劳动仲裁特别提示 -->
          <div v-if="activeType.id === 'labor'" class="border border-border rounded-lg p-4 bg-muted/30 space-y-1.5">
            <p class="text-sm font-semibold text-foreground flex items-center gap-2">
              <Info class="w-4 h-4 text-primary" /> 劳动仲裁时效特别规则（第 27 条第 4 款）
            </p>
            <p class="text-xs leading-relaxed text-muted-foreground">
              劳动关系存续期间因拖欠劳动报酬发生争议的，申请仲裁不受 1 年时效限制；但劳动关系终止的，应当自劳动关系终止之日起一年内提出。
            </p>
          </div>

          <!-- 时效状态明细 -->
          <div class="border border-border rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-muted/40 border-b border-border">
              <p class="text-sm font-semibold text-foreground">计算口径明细</p>
            </div>
            <table class="w-full text-sm">
              <tbody>
                <tr class="border-b border-border/40">
                  <td class="px-4 py-2 text-muted-foreground w-28 align-top">时效类型</td>
                  <td class="px-4 py-2 text-foreground">{{ activeType.label }} · 依据 {{ activeType.law }}</td>
                </tr>
                <tr class="border-b border-border/40">
                  <td class="px-4 py-2 text-muted-foreground align-top">起算日</td>
                  <td class="px-4 py-2 text-foreground font-mono">{{ fmtDate(result.start) }}（当日不计入，自次日按 {{ activeType.years }} 年计算）</td>
                </tr>
                <tr class="border-b border-border/40">
                  <td class="px-4 py-2 text-muted-foreground align-top">法定届满日</td>
                  <td class="px-4 py-2 text-foreground font-mono">{{ fmtDate(result.rawExpiry) }}（{{ weekdayName(result.rawExpiry) }}，对应日口径）</td>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-muted-foreground align-top">期间最后一日</td>
                  <td class="px-4 py-2 text-foreground font-mono">{{ fmtDate(result.final) }}<span v-if="result.delayed">（周末顺延 {{ daysBetween(result.rawExpiry, result.final) }} 天）</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- 输入不完整时的空状态 -->
        <div v-else class="text-center text-muted-foreground py-16">
          <TriangleAlert class="w-10 h-10 mx-auto mb-3 text-yellow-500" />
          <p class="text-sm">请选择时效类型并填写起算日{{ inputError ? '：' + inputError : '' }}。</p>
          <p class="text-xs text-muted-foreground/70 mt-1">也可以点击「载入示例」先看一条完整测算：2024-01-02 起算普通 3 年时效。</p>
        </div>
      </div>
    </div>

    <!-- 中断 / 中止提示卡（只提示，不参与计算） -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-3">
        <Info class="w-5 h-5 mr-2 text-primary" /> 时效中断与中止提示（本工具不自动计算，仅供对照）
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 rounded-lg bg-muted/40 border border-border">
          <p class="text-sm font-semibold text-foreground mb-1.5">诉讼时效中断（重新起算）</p>
          <p class="text-xs leading-relaxed text-muted-foreground">
            权利人向义务人提出履行请求、义务人同意履行义务、权利人提起诉讼或申请仲裁等情形下，时效中断，
            从中断、有关程序终结时起<b class="text-foreground">重新计算</b>（普通时效重新起算 3 年，仲裁时效重新起算 1 年）。
            发生中断事由后，可把中断（或有关程序终结）之日作为新的「起算日」重新测算。
          </p>
          <p class="text-[10px] text-muted-foreground/80 mt-1.5">依据：《民法典》第 195 条；《劳动争议调解仲裁法》第 27 条第 2 款</p>
        </div>
        <div class="p-4 rounded-lg bg-muted/40 border border-border">
          <p class="text-sm font-semibold text-foreground mb-1.5">诉讼时效中止（暂停计算）</p>
          <p class="text-xs leading-relaxed text-muted-foreground">
            在时效期间的<b class="text-foreground">最后六个月内</b>，因不可抗力、无 / 限制民事行为能力人没有法定代理人、
            继承开始后未确定继承人或者遗产管理人等障碍不能行使请求权的，时效中止：
            自中止原因消除之日起<b class="text-foreground">满六个月</b>，诉讼时效期间届满
            （仲裁时效为自原因消除之日起继续计算）。
          </p>
          <p class="text-[10px] text-muted-foreground/80 mt-1.5">依据：《民法典》第 194 条；《劳动争议调解仲裁法》第 27 条第 3 款</p>
        </div>
      </div>
      <p class="text-xs leading-relaxed mt-3 p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
        <TriangleAlert class="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <span>20 年最长保护期间为权利保护的最长期间，通说认为不适用诉讼时效中止、中断的规定（《民法典》第 188 条第 2 款）。</span>
      </p>
    </div>

    <!-- 免责声明（页面固定、显著位置） -->
    <p class="text-xs text-muted-foreground leading-relaxed mb-8 p-3 rounded-lg bg-muted/40 border border-border flex items-start gap-1.5">
      <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <span>本工具按《民法典》与《劳动争议调解仲裁法》现行条文及通说计算口径估算，仅供计算参考，不构成法律意见；
      届满日顺延仅作周末简化处理，法定节假日请自行核对；具体时效认定与是否超过时效，以人民法院、仲裁机构生效裁判为准，重要事项请咨询执业律师。</span>
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
      <div v-show="seoVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是诉讼时效计算器？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          诉讼时效计算器是一款在线法律期间测算工具。它以《民法典》第 188 条（普通诉讼时效 3 年与 20 年最长保护期）、
          第 594 条（国际货物买卖合同和技术进出口合同争议 4 年特殊时效）与《劳动争议调解仲裁法》第 27 条（劳动争议仲裁时效 1 年）为口径，
          输入起算日后自动完成三步计算：按第 201 条「开始的当日不计入」自次日起算，按第 202 条把届满日落在到期月的「对应日」上，
          再按第 203 条对落在周末的届满日作顺延处理，给出法定届满日、顺延后的期间最后一日、剩余天数与时效状态，
          并可与 20 年最长保护期对照、自动提示哪一期先到期。全部计算在浏览器本地完成，不保存任何输入。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">诉讼时效 3 年从哪天起算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          《民法典》第 188 条规定，向人民法院请求保护民事权利的诉讼时效期间为三年，自权利人<b class="text-foreground">知道或者应当知道权利受到损害以及义务人</b>之日起计算。
          结合第 201 条「按照年、月、日计算期间的，开始的当日不计入，自下一日开始计算」：例如 2024-01-02 知道权利受损，
          则 2024-01-02 当天不计入，时效期间自 2024-01-03 起按 3 年计算。常见起算场景：约定履行期限的债务自履行期限届满之日起算；
          人身损害赔偿自知道伤害与致害人之日起算；分期履行的同一债务自最后一期履行期限届满之日起算（第 189 条）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">届满日怎么确定？什么是「对应日」？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          《民法典》第 202 条：按照年、月计算期间的，<b class="text-foreground">到期月的对应日为期间的最后一日</b>；没有对应日的，月末日为期间的最后一日。
          「对应日」指与起算事实发生日相同的日期（起算当日本身不计入）：2024-01-02 起算 3 年，到期月为 2027 年 1 月，对应日 2027-01-02 即期间最后一日；
          若起算日为 2024-02-29（闰年），2027 年 2 月没有 29 日，则以月末日 2027-02-28 为最后一日。本工具按此口径计算并已处理闰年收敛。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">届满日遇节假日怎么顺延？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          《民法典》第 203 条：期间的最后一日是法定休假日的，<b class="text-foreground">以法定休假日结束的次日为期间的最后一日</b>。
          法定休假日既包括周末，也包括春节、国庆等法定节假日及其调休。本工具采用<b class="text-foreground">简化口径：仅识别周六、周日并顺延至下一周一</b>，
          不内置逐年公布的法定节假日与调休安排——例如 2027-01-02（周六）届满顺延至 2027-01-04（周一）。
          届满日恰逢长假时，请在页面提示处自行核对当年日历；期间最后一日的截止时间为二十四时（第 203 条第 2 款）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">什么是 20 年最长保护期？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          《民法典》第 188 条第 2 款：自权利受到损害之日起超过二十年的，人民法院不予保护；有特殊情况的，人民法院可以根据权利人的申请决定延长。
          20 年最长保护期从<b class="text-foreground">权利实际受损之日</b>起算，与「知道之日」无关，且不适用中止、中断——
          即使每次中断都重新起算 3 年，从受损之日起满 20 年后权利也不再受法院保护。当权利受损日远早于知道之日时，
          20 年届满日可能先于普通时效届满日到期，本工具会自动对比并提示以先到期者为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">时效中断和中止有什么区别？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          <b class="text-foreground">中断</b>（第 195 条）：权利人提出履行请求、义务人同意履行、提起诉讼或申请仲裁等，已经经过的时效期间归于无效，
          从中断、有关程序终结时起<b class="text-foreground">重新起算</b>（3 年普通时效重新计算）。
          <b class="text-foreground">中止</b>（第 194 条）：只发生在时效期间的最后六个月内，因不可抗力等障碍不能行使请求权的，
          时效暂停；自中止原因消除之日起<b class="text-foreground">满六个月</b>届满（而非继续算剩余天数）。
          简单记忆：中断是「清零重来」，中止是「暂停后补足六个月」。劳动争议仲裁时效的中断、中止规则见《劳动争议调解仲裁法》第 27 条第 2、3 款，措辞略有差异。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">哪些纠纷适用特殊时效？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          <b class="text-foreground">4 年</b>：因国际货物买卖合同和技术进出口合同争议提起诉讼或者申请仲裁的，时效期间为四年（《民法典》第 594 条）；
          通说认为该类争议仍受第 188 条第 2 款 20 年最长保护期的限制，本工具按此口径提供对照。
          <b class="text-foreground">1 年</b>：劳动争议申请仲裁的时效期间为一年（《劳动争议调解仲裁法》第 27 条），
          但劳动关系存续期间因拖欠劳动报酬发生争议的，不受一年限制；劳动关系终止的，应当自劳动关系终止之日起一年内提出。
          此外《民法典》第 196 条列举的请求权（停止侵害、排除妨碍、返还原物、支付抚养费赡养费扶养费等）不适用诉讼时效。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">诉讼时效 3 年从哪天起算？</h3>
            <p class="text-sm text-muted-foreground mt-1">自权利人知道或者应当知道权利受到损害以及义务人之日起计算（《民法典》第 188 条），起算日当天不计入、自次日开始计算（第 201 条）。约定履行期限的债务，自履行期限届满之日起算。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">届满日是周末怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">期间最后一日为法定休假日的，以法定休假日结束的次日为最后一日（第 203 条）。本工具简化为周末顺延至下一周一，如 2027-01-02（周六）届满顺延至 2027-01-04（周一）；法定节假日请自行核对日历。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">什么是 20 年最长保护期？</h3>
            <p class="text-sm text-muted-foreground mt-1">自权利受到损害之日起超过二十年的，人民法院不予保护（《民法典》第 188 条第 2 款），可因特殊情况申请延长。20 年期间从实际受损日起算，不适用中止、中断。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">时效中断后怎么重新计算？</h3>
            <p class="text-sm text-muted-foreground mt-1">从中断、有关程序终结时起重新计算（《民法典》第 195 条）：普通时效重新起算 3 年。可在本工具把中断事由发生之日（或程序终结之日）填为新的起算日重新测算。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">时效中止是什么效果？</h3>
            <p class="text-sm text-muted-foreground mt-1">在时效期间最后六个月内因不可抗力等障碍不能行使请求权的，时效中止（第 194 条）；自中止原因消除之日起满六个月，诉讼时效期间届满——不是按剩余天数继续计算。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">劳动仲裁时效有什么特殊规则？</h3>
            <p class="text-sm text-muted-foreground mt-1">劳动争议申请仲裁的时效期间为一年（《劳动争议调解仲裁法》第 27 条）；劳动关系存续期间因拖欠劳动报酬发生争议的不受一年限制，但劳动关系终止的应当自终止之日起一年内提出。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :current-tool-id="'statute-limitations-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Scale, Calendar, Clock, Hourglass, Info, TriangleAlert, CheckCircle,
  ChevronUp, ChevronDown, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '诉讼时效计算器 - 民法典 3 年时效届满日在线测算',
  description: '免费在线诉讼时效计算器：按《民法典》第 188 条普通时效 3 年、第 594 条特殊时效 4 年与劳动仲裁时效 1 年口径，输入起算日自动测算法定届满日、周末顺延后的期间最后一日与剩余天数，附 20 年最长保护期对照、中断中止规则提示，纯浏览器本地计算',
  keywords: '诉讼时效计算,民法典诉讼时效 3年,诉讼时效起算,statute of limitations calculator,劳动仲裁时效 1年,诉讼时效届满日,20年最长保护期,诉讼时效中断,诉讼时效中止,民法典203条顺延',
  author: '有条工具',
  ogTitle: '诉讼时效计算器 - 民法典 3 年时效届满日在线测算 | 有条工具',
  ogDescription: '3 年 / 4 年 / 1 年三档时效届满日与剩余天数测算，周末顺延与 20 年最长保护期自动对照。',
  ogUrl: 'https://www.util.cn/tools/statute-limitations-calculator',
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
          name: '诉讼时效计算器',
          url: 'https://www.util.cn/tools/statute-limitations-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '普通诉讼时效 3 年届满日测算（《民法典》第 188 条）',
            '国际货物买卖 / 技术进出口 4 年特殊时效（第 594 条）',
            '劳动争议仲裁时效 1 年（《劳动争议调解仲裁法》第 27 条）',
            '对应日口径届满日与闰年月末收敛（第 201 / 202 条）',
            '周末顺延简化口径提示（第 203 条）',
            '20 年最长保护期对照与先到期提示',
            '中断 / 中止规则提示卡',
            '纯本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '诉讼时效计算器', item: 'https://www.util.cn/tools/statute-limitations-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '诉讼时效 3 年从哪天起算？',
              acceptedAnswer: { '@type': 'Answer', text: '自权利人知道或者应当知道权利受到损害以及义务人之日起计算（《民法典》第 188 条），起算日当天不计入、自次日开始计算（第 201 条）。约定履行期限的债务，自履行期限届满之日起算。' }
            },
            {
              '@type': 'Question',
              name: '届满日是周末怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '期间最后一日为法定休假日的，以法定休假日结束的次日为最后一日（第 203 条）。本工具简化为周末顺延至下一周一，如 2027-01-02（周六）届满顺延至 2027-01-04（周一）；法定节假日请自行核对日历。' }
            },
            {
              '@type': 'Question',
              name: '什么是 20 年最长保护期？',
              acceptedAnswer: { '@type': 'Answer', text: '自权利受到损害之日起超过二十年的，人民法院不予保护（《民法典》第 188 条第 2 款），可因特殊情况申请延长。20 年期间从实际受损日起算，不适用中止、中断。' }
            },
            {
              '@type': 'Question',
              name: '时效中断后怎么重新计算？',
              acceptedAnswer: { '@type': 'Answer', text: '从中断、有关程序终结时起重新计算（《民法典》第 195 条）：普通时效重新起算 3 年。可把中断事由发生之日填为新的起算日重新测算。' }
            },
            {
              '@type': 'Question',
              name: '时效中止是什么效果？',
              acceptedAnswer: { '@type': 'Answer', text: '在时效期间最后六个月内因不可抗力等障碍不能行使请求权的，时效中止（第 194 条）；自中止原因消除之日起满六个月，诉讼时效期间届满，不是按剩余天数继续计算。' }
            },
            {
              '@type': 'Question',
              name: '劳动仲裁时效有什么特殊规则？',
              acceptedAnswer: { '@type': 'Answer', text: '劳动争议申请仲裁的时效期间为一年（《劳动争议调解仲裁法》第 27 条）；劳动关系存续期间因拖欠劳动报酬发生争议的不受一年限制，但劳动关系终止的应当自终止之日起一年内提出。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 日期一律按 UTC 口径处理，避免本地时区导致的「差一天」漂移；不触碰 window / document。

// 严格解析 YYYY-MM-DD，返回 UTC 零点 Date；格式或日期不存在时返回 null
function parseYmd(s) {
  if (typeof s !== 'string') return null
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s.trim())
  if (!m) return null
  const y = +m[1]
  const mo = +m[2]
  const d = +m[3]
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(Date.UTC(y, mo - 1, d))
  // 回读校验：拦截「格式合法但不存在」的日期（如 2026-02-30）
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null
  return dt
}

// 加 n 天（UTC 整日口径）
function addDaysUtc(date, n) {
  return new Date(date.getTime() + n * 86400000)
}

// 加 n 个自然年（第 202 条口径）：到期月的「对应日」为最后一日；没有对应日（如闰日遇到平年）时取月末日
function addYearsUtc(date, years) {
  const y = date.getUTCFullYear() + years
  const m = date.getUTCMonth()
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  return new Date(Date.UTC(y, m, Math.min(date.getUTCDate(), lastDay)))
}

// 第 203 条简化口径：期间最后一日为周六 / 周日时，顺延至下一周一（法定节假日请人工核对日历）
function weekendDelay(date) {
  const wd = date.getUTCDay()
  if (wd === 6) return { date: addDaysUtc(date, 2), delayed: true }
  if (wd === 0) return { date: addDaysUtc(date, 1), delayed: true }
  return { date, delayed: false }
}

// 两个 UTC 零点之间的整日差
function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

// 展示：YYYY-MM-DD（周X），UTC 口径，SSR / 客户端一致
const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
function weekdayName(date) {
  return WEEKDAY_NAMES[date.getUTCDay()]
}
function fmtDate(date) {
  if (!date) return '—'
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}（${weekdayName(date)}）`
}

// 时效类型：years 决定期间长度；labor 类型不适用 20 年最长保护期对照
const TYPES = [
  {
    id: 'ordinary',
    label: '普通诉讼时效 · 3 年（民法典第 188 条）',
    years: 3,
    law: '《民法典》第 188 条第 1 款',
    desc: '向人民法院请求保护民事权利的诉讼时效期间为三年，自权利人知道或者应当知道权利受到损害以及义务人之日起计算。'
  },
  {
    id: 'international',
    label: '国际货物买卖 / 技术进出口争议 · 4 年（民法典第 594 条）',
    years: 4,
    law: '《民法典》第 594 条',
    desc: '因国际货物买卖合同和技术进出口合同争议提起诉讼或者申请仲裁的时效期间为四年；通说认为仍受第 188 条 20 年最长保护期限制。'
  },
  {
    id: 'labor',
    label: '劳动争议仲裁时效 · 1 年（调解仲裁法第 27 条）',
    years: 1,
    law: '《劳动争议调解仲裁法》第 27 条',
    desc: '劳动争议申请仲裁的时效期间为一年，从当事人知道或者应当知道其权利被侵害之日起计算；劳动关系存续期间拖欠劳动报酬的争议不受一年限制。'
  }
]

// 全链路测算：起算日 → 加 N 年（对应日）→ 周末顺延 → 与 20 年最长保护期对照取先到期者
// 返回 { ok, type, start, rawExpiry, final, delayed, longCap, operative, remaining, lastSixMonths }
function calcStatute(input) {
  const src = input && typeof input === 'object' ? input : {}
  const type = TYPES.find((t) => t.id === src.type) || TYPES[0]
  const start = parseYmd(src.start)
  if (!start) return { ok: false, type }

  const rawExpiry = addYearsUtc(start, type.years)
  const delay = weekendDelay(rawExpiry)
  const out = {
    ok: true,
    type,
    start,
    rawExpiry,
    final: delay.date,
    delayed: delay.delayed,
    longCap: null,
    operative: delay.date,
    remaining: null,
    lastSixMonths: false
  }

  // 20 年最长保护期（劳动仲裁时效无此规则）：自权利受损之日起 20 年
  if (type.id !== 'labor' && src.damage) {
    const damage = parseYmd(src.damage)
    if (damage) {
      const capDelay = weekendDelay(addYearsUtc(damage, 20))
      out.longCap = { damage, raw: addYearsUtc(damage, 20), final: capDelay.date, delayed: capDelay.delayed }
    }
  }
  if (out.longCap && out.longCap.final.getTime() < out.final.getTime()) {
    out.operative = out.longCap.final
  }

  // 剩余天数：相对「今天」（客户端 onMounted 注入的本地日期字符串，SSR 阶段为空）
  const today = parseYmd(src.today)
  if (today) {
    out.remaining = daysBetween(today, out.operative)
    out.lastSixMonths = out.remaining >= 0 && out.remaining <= 183
  }
  return out
}

// ---------- 页面状态 ----------
const TOOL_ID = 'statute-limitations-calculator'
const typeId = ref('ordinary')
const startDate = ref('2024-01-02')
const damageDate = ref('2024-01-02')
const todayStr = ref('')
const seoVisible = ref(true)

const toggleSeoContent = () => { seoVisible.value = !seoVisible.value }

// ---------- 计算与展示派生 ----------
const activeType = computed(() => TYPES.find((t) => t.id === typeId.value) || TYPES[0])

// ---------- 校验 ----------
const dateOrderError = computed(() => {
  const start = parseYmd(startDate.value)
  const damage = parseYmd(damageDate.value)
  if (start && damage && activeType.value.id !== 'labor' && damage.getTime() > start.getTime()) {
    return '权利受损日晚于起算日：通常「知道或应当知道之日」不早于实际受损日，请核对两个日期是否填反'
  }
  return ''
})

const inputError = computed(() => {
  if (!parseYmd(startDate.value)) return '请选择起算日'
  return dateOrderError.value
})

const canCalc = computed(() => !inputError.value)

const result = computed(() => calcStatute({
  type: typeId.value,
  start: startDate.value,
  damage: damageDate.value,
  today: todayStr.value
}))

const capFirst = computed(() => !!result.value.longCap && result.value.longCap.final.getTime() < result.value.final.getTime())
const capSameDay = computed(() => !!result.value.longCap && result.value.longCap.final.getTime() === result.value.final.getTime())

const remainingText = computed(() => {
  if (!result.value.ok || result.value.remaining === null) return ''
  const r = result.value.remaining
  if (r < 0) return `已届满 ${-r} 天`
  if (r === 0) return '今日为期间最后一日'
  return `${r} 天`
})

const statusBadge = computed(() => {
  if (!result.value.ok || result.value.remaining === null) return null
  const r = result.value.remaining
  if (r < 0) return { text: '时效已届满', cls: 'bg-red-500/10 text-red-600' }
  if (r === 0) return { text: '今日届满', cls: 'bg-red-500/10 text-red-600' }
  if (r <= 183) return { text: '临近届满', cls: 'bg-yellow-500/10 text-yellow-600' }
  return { text: '在时效内', cls: 'bg-green-500/10 text-green-600' }
})

// ---------- 示例与重置 ----------
function loadExample() {
  typeId.value = 'ordinary'
  startDate.value = '2024-01-02'
  damageDate.value = '2024-01-02'
}

function resetAll() {
  typeId.value = 'ordinary'
  startDate.value = ''
  damageDate.value = ''
}

// ---------- 生命周期 ----------
onMounted(() => {
  // 「今天」取本地日期字符串（客户端注入，避免 SSR 与时区导致 hydration 不一致）
  const now = new Date()
  todayStr.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  addRecentTool(TOOL_ID)
})
</script>
