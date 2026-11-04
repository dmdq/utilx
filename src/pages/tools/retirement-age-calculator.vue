<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Hourglass class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">延迟退休年龄计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按 2025 年施行的渐进式延迟法定退休年龄决定，测算法定退休年月、退休时年龄、延迟月数与最低缴费年限</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线延迟退休计算器：选择出生年月与人员类型（男职工 / 原 55 周岁女职工 / 原 50 周岁女职工），
        按《全国人民代表大会常务委员会关于实施渐进式延迟法定退休年龄的决定》的组距口径（男职工与原 55 档每 4 个月延迟 1 个月、
        原 50 档每 2 个月延迟 1 个月）自动测算延迟后的法定退休年月与退休时精确到月的年龄，同时给出弹性提前 / 弹性延迟 3 年窗口、
        2030 年起 15→20 年渐进的最低缴费年限，以及与官方对照表逐行核对过的节选速查表。全部计算在浏览器本地完成，不上传任何数据。
      </p>
      <!-- 页面固定免责与出处（显著位置） -->
      <p class="mt-3 text-xs leading-relaxed p-3 rounded-lg bg-muted/60 border border-border text-foreground flex items-start gap-2">
        <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <span>依据《全国人民代表大会常务委员会关于实施渐进式延迟法定退休年龄的决定》（2024 年 9 月 13 日通过，2025 年 1 月 1 日施行）测算；弹性提前/延迟退休需与单位协商并符合社保部门规定，本工具仅供参考。</span>
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <CalendarClock class="w-5 h-5 mr-2 text-primary" /> 出生信息与人员类型
        </h2>

        <!-- 出生年月 -->
        <div>
          <label for="retire-birthYM" class="block text-sm font-medium text-foreground mb-2">出生年月</label>
          <input
            id="retire-birthYM"
            v-model="birthYM"
            type="month"
            min="1940-01"
            max="2069-12"
            class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground leading-relaxed mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>按身份证出生日期所在月选择；原法定退休年月早于 2025 年 1 月的人群按原年龄退休、不受延迟影响。</span>
          </p>
        </div>

        <!-- 人员类型 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">人员类型</label>
          <div class="space-y-2">
            <label
              v-for="t in PERSON_TYPES"
              :key="t.id"
              class="flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition"
              :class="typeId === t.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/40'"
            >
              <input v-model="typeId" type="radio" name="retirePersonType" :value="t.id" class="mt-0.5 accent-primary" />
              <span class="min-w-0">
                <span class="block text-sm font-medium text-foreground">{{ t.label }}</span>
                <span class="block text-xs text-muted-foreground mt-0.5">原 {{ t.origYears }} 周岁 → {{ t.targetYears }} 周岁 · 每 {{ t.stepMonths }} 个月延迟 1 个月</span>
              </span>
            </label>
          </div>
        </div>

        <!-- 当前类型政策口径 -->
        <div class="text-xs leading-relaxed p-3 rounded-lg bg-muted/60 text-foreground flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <span>当前口径：{{ activeType.label }}原 {{ activeType.origYears }} 周岁退休，逐步延迟至 {{ activeType.targetYears }} 周岁，最长延迟 {{ activeType.capMonths }} 个月（{{ activeType.capMonths / 12 }} 年）；弹性提前、弹性延迟各不超过 3 年。</span>
        </div>

        <!-- 操作 -->
        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            @click="loadExample"
            class="px-3 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            <Play class="w-4 h-4 inline mr-1 -mt-0.5" /> 载入示例
          </button>
          <button
            @click="resetAll"
            class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1 -mt-0.5" /> 重置
          </button>
        </div>

        <p class="text-[10px] text-muted-foreground/80 leading-relaxed">
          测算完全在浏览器本地完成；你的选择仅保存在本设备浏览器（localStorage）便于下次打开，不上传服务器，可随时点「重置」清除。
        </p>
      </div>

      <!-- 右侧：测算结果（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Hourglass class="w-5 h-5 mr-2 text-primary" /> 测算结果
          </h2>
          <span v-if="canCalc" class="text-xs text-muted-foreground hidden sm:block">{{ activeType.label }} · 官方对照表口径</span>
        </div>

        <template v-if="canCalc">
          <!-- 结论卡 -->
          <div class="bg-primary/10 rounded-lg p-5 space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
              <div>
                <p class="text-xs text-muted-foreground mb-1">新法定退休年月</p>
                <p class="text-4xl font-bold text-primary whitespace-nowrap">{{ retireYMText }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">退休时年龄</p>
                <p class="text-2xl font-bold text-foreground whitespace-nowrap">{{ ageText }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground mb-1">较原政策</p>
                <p class="text-2xl font-bold whitespace-nowrap" :class="result.delayMonths > 0 ? 'text-foreground' : 'text-muted-foreground'">{{ delayText }}</p>
              </div>
            </div>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-card/70 text-foreground flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" :class="result.affected ? 'text-primary' : 'text-green-500'" />
              <span>{{ affectedNote }}</span>
            </p>
          </div>

          <!-- 时间线卡：出生 → 原退休 → 新退休 → 弹性窗口 -->
          <div class="border border-border rounded-lg p-4 space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-foreground flex items-center">
                <CalendarClock class="w-4 h-4 mr-1.5 text-primary" /> 退休时间线
              </h3>
              <span class="text-xs text-muted-foreground">弹性窗口 ±3 年（简化口径）</span>
            </div>
            <div class="relative h-2.5 rounded-full bg-muted">
              <div
                class="absolute top-0 h-2.5 rounded-full bg-primary/20 border-x border-primary/40"
                :style="{ left: timeline.windowStartPct + '%', width: timeline.windowWidthPct + '%' }"
              ></div>
              <div
                class="absolute -top-0.5 w-2.5 h-2.5 rounded-full bg-muted-foreground/60 border-2 border-background"
                :style="{ left: 'calc(' + timeline.origPct + '% - 5px)' }"
                :title="'原法定退休 ' + origYMText"
              ></div>
              <div
                class="absolute -top-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background"
                :style="{ left: 'calc(' + timeline.retirePct + '% - 7px)' }"
                :title="'新法定退休 ' + retireYMText"
              ></div>
            </div>
            <div class="flex justify-between text-[10px] text-muted-foreground gap-2">
              <span>出生 {{ birthYMText }}</span>
              <span>原法定 {{ origYMText }}</span>
              <span class="text-primary font-medium">新法定 {{ retireYMText }}</span>
              <span>弹性上限 {{ latestYMText }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
              <span class="flex items-center gap-1"><i class="w-2 h-2 rounded-full bg-muted-foreground/60 inline-block"></i>原法定退休点</span>
              <span class="flex items-center gap-1"><i class="w-2.5 h-2.5 rounded-full bg-primary inline-block"></i>新法定退休点</span>
              <span class="flex items-center gap-1"><i class="w-3 h-2 rounded bg-primary/20 inline-block"></i>弹性窗口（提前 ≤3 年 / 延迟 ≤3 年）</span>
            </div>
            <p v-if="result.delayMonths === 0" class="text-xs text-muted-foreground flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>原、新法定退休点重合：按原法定退休年龄退休，不适用延迟。</span>
            </p>
          </div>

          <!-- 最低缴费年限卡 -->
          <div class="bg-muted/40 border border-border rounded-lg p-4 flex flex-wrap items-center gap-4">
            <div class="flex-shrink-0">
              <p class="text-xs text-muted-foreground mb-1">退休时适用的最低缴费年限</p>
              <p class="text-2xl font-bold text-foreground whitespace-nowrap">{{ minYears }} 年</p>
            </div>
            <p class="text-xs leading-relaxed text-muted-foreground flex items-start gap-1.5 flex-1 min-w-[16rem]">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>{{ contributionNote }}</span>
            </p>
          </div>

          <!-- 对照表节选（静态硬编码，与上方纯函数输出逐行一致） -->
          <div class="space-y-3">
            <div v-for="group in snippetGroups" :key="group.id" class="border border-border rounded-lg overflow-hidden">
              <div class="px-4 py-2 bg-muted/40 border-b border-border">
                <p class="text-sm font-semibold text-foreground">{{ group.title }}</p>
              </div>
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-muted-foreground border-b border-border">
                    <th class="px-3 py-1.5 text-left font-medium">出生年月</th>
                    <th class="px-3 py-1.5 text-left font-medium">原退休</th>
                    <th class="px-3 py-1.5 text-left font-medium">延迟后年龄</th>
                    <th class="px-3 py-1.5 text-left font-medium">退休年月</th>
                    <th class="px-3 py-1.5 text-right font-medium">延迟</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in group.rows"
                    :key="row.type + '-' + row.birth"
                    :class="row.type === typeId && row.birth === birthYM ? 'bg-primary/10' : ''"
                  >
                    <td class="px-3 py-1.5 font-mono text-foreground">{{ row.birth }}</td>
                    <td class="px-3 py-1.5 text-muted-foreground">{{ row.origYM }} · {{ row.origAge }}</td>
                    <td class="px-3 py-1.5 font-medium text-foreground">{{ row.age }}</td>
                    <td class="px-3 py-1.5 font-mono text-foreground">{{ row.retireYM }}</td>
                    <td class="px-3 py-1.5 text-right font-mono text-muted-foreground">+{{ row.delay }} 个月</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-[10px] text-muted-foreground/80 leading-relaxed">
              对照表节选自官方附表口径（每档取首月出生年月，延迟后年龄精确到月），18 行数值均与上方纯函数输出逐行一致；全表请以人社部门公布为准。
            </p>
          </div>

          <!-- 提示条（静态） -->
          <p class="text-xs leading-relaxed p-2.5 rounded bg-yellow-500/10 text-foreground flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <span>1976 年 9 月及以后出生的男职工、1984 年 9 月及以后出生的原 55 女职工等按顶格年龄退休；实际退休以参保地社保经办机构核定为准。</span>
          </p>
        </template>

        <!-- 输入不完整时的空状态 -->
        <div v-else class="text-center text-muted-foreground py-16">
          <TriangleAlert class="w-10 h-10 mx-auto mb-3 text-yellow-500" />
          <p class="text-sm">请先在左侧选择出生年月与人员类型。</p>
          <p class="text-xs text-muted-foreground/70 mt-1">也可以点击「载入示例」先看一条完整测算：1970 年 1 月出生的男职工。</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>延迟退休年龄怎么算？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          延迟退休年龄计算器是一款在线政策测算工具，口径为《全国人民代表大会常务委员会关于实施渐进式延迟法定退休年龄的决定》
          （2024 年 9 月 13 日通过，2025 年 1 月 1 日施行）。输入出生年月与人员类型后，工具先算出「原法定退休年月」，
          再按官方对照表的组距规则推算延迟月数，得到新法定退休年月与退休时精确到月的年龄；同时给出弹性提前 / 弹性延迟窗口、
          退休时适用的最低缴费年限（2030 年起 15→20 年渐进），以及一张与官方附表逐行核对的节选速查表。全部计算在浏览器本地完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">延迟退休怎么计算（组距规则通俗版）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          改革只覆盖「2025 年 1 月 1 日后达到原法定退休年龄」的人群，分三类按组距逐步延迟：
          <b class="text-foreground">男职工</b>从 60 周岁逐步延到 63 周岁、<b class="text-foreground">原 55 周岁女职工</b>延到 58 周岁，
          都是每 4 个出生月延迟 1 个月；<b class="text-foreground">原 50 周岁女职工</b>从 50 周岁延到 55 周岁，每 2 个出生月延迟 1 个月。
          官方对照表以改革前最后一个原退休月（2024 年 12 月）为基准逐组加 1：原退休月落在 2025 年 1 月的人群延迟 1 个月，
          之后每出生晚一个组距就多延迟 1 个月，即「延迟月数 = min(上限, 原退休月距基准的超出月数 ÷ 组距，向上取整)」。
          举例：1970 年 1 月出生的男职工原应 2030 年 1 月退休，距基准 61 个月，61 ÷ 4 向上取整为 16 个月，
          即 61 岁 4 个月、2031 年 5 月退休；1980 年 1 月出生的原 50 周岁女职工原应 2030 年 1 月退休，61 ÷ 2 向上取整为 31 个月，
          即 52 岁 7 个月、2032 年 8 月退休。男职工与原 55 档最多延迟 36 个月（3 年）、原 50 档最多延迟 60 个月（5 年），
          到顶后出生的人群一律按顶格年龄退休。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">对照表怎么看（三类人群）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          官方附表把出生年月按组距分档：男职工与原 55 周岁女职工每 4 个出生月一档、原 50 周岁女职工每 2 个出生月一档，每档对应一个退休年龄。
          查表三步：先确定自己属于哪类人群（男 / 女 55 档 / 女 50 档），再找到出生年月所在的档，最后读该档对应的退休年龄与退休年月。
          三张表的顶格行分别是：1976 年 9 月及以后出生的男职工按 63 周岁、1981 年 9 月及以后出生的原 55 档女职工按 58 周岁、
          1984 年 11 月及以后出生的原 50 档女职工按 55 周岁退休。本页右侧的节选表（每类 6 行）与官方附表口径逐行一致，可直接对照自查。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">弹性提前和弹性延迟是什么（3 年窗口口径）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          《决定》第二条建立了弹性退休机制：<b class="text-foreground">弹性提前</b>——职工达到法定退休年龄前，与所在单位和参保地社保经办机构
          协商一致的，可以弹性提前退休，提前时间不超过 3 年，且退休年龄不得低于原法定退休年龄（男 60、女 55、女 50 周岁）；
          <b class="text-foreground">弹性延迟</b>——职工达到法定退休年龄后，与所在单位协商一致的，可以弹性延迟退休，延迟时间不超过 3 年。
          因此你的实际退休时间窗口为新法定退休年月往前最多 3 年（但不早于原法定退休点）、往后最多 3 年。本页时间线按此口径给出简化窗口，
          弹性退休的具体实施以各地实施细则与单位协商结果为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">最低缴费年限怎么变（15→20 渐进表）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          《决定》规定：从 2030 年 1 月 1 日起，按月领取基本养老金最低缴费年限由 15 年逐步提高至 20 年，每年提高 6 个月。
          按退休年份取值：2030 年退休 15.5 年、2031 年 16 年、2032 年 16.5 年……2039 年及以后 20 年；2030 年前退休仍为 15 年。
        </p>
        <div class="flex flex-wrap gap-2 mb-2">
          <span
            v-for="(p, i) in CONTRIBUTION_PROGRESSION"
            :key="p.year"
            class="px-2.5 py-1 rounded-full border border-border bg-muted/40 text-xs text-foreground"
          >
            {{ p.year }}{{ i === 0 ? ' 及以前' : (i === CONTRIBUTION_PROGRESSION.length - 1 ? ' 及以后' : '') }} · {{ p.years }} 年
          </span>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">1965 年以前出生的人受影响吗（不受影响口径）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不受影响。改革仅适用于 2025 年 1 月 1 日后达到「原法定退休年龄」的人群：只要原法定退休年月早于 2025 年 1 月，
          就按原年龄退休。对应到出生时间——男职工 1964 年 12 月及以前出生（2024 年 12 月及以前满 60 岁）、
          原 55 周岁女职工 1969 年 12 月及以前出生、原 50 周岁女职工 1974 年 12 月及以前出生，均不延迟。
          从男职工 1965 年 1 月、女 55 档 1970 年 1 月、女 50 档 1975 年 1 月出生起，原退休月落入改革区间，
          按对应组距从延迟 1 个月开始逐步递增。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">延迟退休怎么计算？</h3>
            <p class="text-sm text-muted-foreground mt-1">2025 年 1 月 1 日改革施行后达到原法定退休年龄的人群按组距延迟：男职工与原 55 周岁女职工每 4 个出生月延迟 1 个月、原 50 周岁女职工每 2 个月延迟 1 个月；延迟月数 = 距官方对照表基准月（2024 年 12 月）的超出月数 ÷ 组距后向上取整，男/女 55 档上限 36 个月、女 50 档上限 60 个月。例：1970 年 1 月出生男职工原应 2030 年 1 月退休，距基准 61 个月，61÷4 向上取整为 16 个月，即 61 岁 4 个月、2031 年 5 月退休。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">哪些人不受延迟退休影响？</h3>
            <p class="text-sm text-muted-foreground mt-1">原法定退休年月早于 2025 年 1 月的人群不受影响：男职工 1964 年 12 月及以前出生、原 55 周岁女职工 1969 年 12 月及以前出生、原 50 周岁女职工 1974 年 12 月及以前出生，均按原法定退休年龄退休。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">弹性提前和弹性延迟是什么意思？</h3>
            <p class="text-sm text-muted-foreground mt-1">达到法定退休年龄前与所在单位和参保地社保经办机构协商一致，可弹性提前退休，提前不超过 3 年且不得低于原法定退休年龄（男 60 / 女 55 / 女 50 周岁）；达到后与单位协商一致可弹性延迟退休，延迟不超过 3 年。本工具按该口径给出简化窗口，具体以实施细则为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">最低缴费年限怎么变？</h3>
            <p class="text-sm text-muted-foreground mt-1">2030 年 1 月 1 日起，按月领取基本养老金最低缴费年限由 15 年逐步提高至 20 年，每年提高 6 个月：2030 年退休 15.5 年、2031 年 16 年……2039 年及以后 20 年；2030 年前退休仍按 15 年。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">延迟退休对照表怎么看？</h3>
            <p class="text-sm text-muted-foreground mt-1">官方附表按出生年月分档：男职工与原 55 档女职工每 4 个出生月一档、原 50 档女职工每 2 个出生月一档，每档对应一个退休年龄。顶格行：1976 年 9 月及以后出生男职工 63 岁、1981 年 9 月及以后出生原 55 档女职工 58 岁、1984 年 11 月及以后出生原 50 档女职工 55 岁。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">测算结果准确吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">本工具核心函数按官方对照表口径校准（如 1970 年 1 月男职工 61 岁 4 个月、2031 年 5 月退休；1980 年 1 月原 50 档女职工 52 岁 7 个月、2032 年 8 月退休），节选表可与官方附表逐行核对；但弹性退休、特殊工种等特殊情形以参保地社保经办机构核定为准，本工具仅供参考。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'retirement-age-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Hourglass, CalendarClock, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '延迟退休年龄计算器 - 法定退休年龄对照表与弹性退休测算',
  description: '免费在线延迟退休年龄计算器：按 2025 年 1 月 1 日施行的渐进式延迟法定退休年龄决定，输入出生年月与人员类型（男职工 / 原 55 周岁女职工 / 原 50 周岁女职工），即时测算延迟后的法定退休年月、退休时精确年龄与延迟月数，附弹性提前/延迟 3 年窗口、2030 年起 15→20 年最低缴费年限渐进与官方对照表节选，纯浏览器本地计算不上传',
  keywords: '延迟退休计算器,法定退休年龄,退休年龄对照表,弹性退休,最低缴费年限',
  author: '有条工具',
  ogTitle: '延迟退休年龄计算器 - 法定退休年龄对照表与弹性退休测算 | 有条工具',
  ogDescription: '三类人群组距口径测算延迟退休年月与年龄，弹性窗口与最低缴费年限渐进一目了然。',
  ogUrl: 'https://www.util.cn/tools/retirement-age-calculator',
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
          name: '延迟退休年龄计算器',
          url: 'https://www.util.cn/tools/retirement-age-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '三类人群组距测算（男 60→63 / 女 55→58 / 女 50→55）',
            '官方对照表口径校准（首组延迟 1 个月逐组递增）',
            '退休时年龄精确到月与延迟月数对比',
            '弹性提前 / 弹性延迟 3 年窗口示意',
            '2030 年起 15→20 年最低缴费年限渐进测算',
            '官方对照表节选速查（18 行逐行核对）',
            '纯浏览器本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '延迟退休年龄计算器', item: 'https://www.util.cn/tools/retirement-age-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '延迟退休怎么计算？',
              acceptedAnswer: { '@type': 'Answer', text: '2025年1月1日改革施行后达到原法定退休年龄的人群按组距延迟：男职工与原55周岁女职工每4个出生月延迟1个月、原50周岁女职工每2个月延迟1个月；延迟月数=距官方对照表基准月（2024年12月）的超出月数÷组距后向上取整，男/女55档上限36个月、女50档上限60个月。例：1970年1月出生男职工原应2030年1月退休，距基准61个月，61÷4向上取整为16个月，即61岁4个月、2031年5月退休。' }
            },
            {
              '@type': 'Question',
              name: '哪些人不受延迟退休影响？',
              acceptedAnswer: { '@type': 'Answer', text: '原法定退休年月早于2025年1月的人群不受影响：男职工1964年12月及以前出生、原55周岁女职工1969年12月及以前出生、原50周岁女职工1974年12月及以前出生，均按原法定退休年龄退休。' }
            },
            {
              '@type': 'Question',
              name: '弹性提前和弹性延迟是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '达到法定退休年龄前与所在单位和参保地社保经办机构协商一致，可弹性提前退休，提前不超过3年且不得低于原法定退休年龄（男60/女55/女50周岁）；达到后与单位协商一致可弹性延迟退休，延迟不超过3年。本工具按该口径给出简化窗口，具体以实施细则为准。' }
            },
            {
              '@type': 'Question',
              name: '最低缴费年限怎么变？',
              acceptedAnswer: { '@type': 'Answer', text: '2030年1月1日起，按月领取基本养老金最低缴费年限由15年逐步提高至20年，每年提高6个月：2030年退休15.5年、2031年16年……2039年及以后20年；2030年前退休仍按15年。' }
            },
            {
              '@type': 'Question',
              name: '延迟退休对照表怎么看？',
              acceptedAnswer: { '@type': 'Answer', text: '官方附表按出生年月分档：男职工与原55档女职工每4个出生月一档、原50档女职工每2个出生月一档，每档对应一个退休年龄。顶格行：1976年9月及以后出生男职工63岁、1981年9月及以后出生原55档女职工58岁、1984年11月及以后出生原50档女职工55岁。' }
            },
            {
              '@type': 'Question',
              name: '测算结果准确吗？',
              acceptedAnswer: { '@type': 'Answer', text: '本工具核心函数按官方对照表口径校准（如1970年1月男职工61岁4个月、2031年5月退休；1980年1月原50档女职工52岁7个月、2032年8月退休），节选表可与官方附表逐行核对；但弹性退休、特殊工种等特殊情形以参保地社保经办机构核定为准，本工具仅供参考。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 政策口径：《全国人民代表大会常务委员会关于实施渐进式延迟法定退休年龄的决定》
// （2024-09-13 通过，2025-01-01 施行）。
// 官方对照表口径：以改革前最后一个原退休月 2024-12 为递增基准——原退休月为 2025-01 的人群
// 延迟 1 个月，此后每出生晚一个组距（男/女55 为 4 个月、女50 为 2 个月）多延迟 1 个月，
// 即 delay = min(上限, ceil((原退休月 − 2024-12) 的月数 / 组距))。
// 已对照官方对照表校准：男 1965-01→60岁1个月(2025-02)、1970-01→61岁4个月(2031-05)、
// 1976-09→63岁(2039-09)；女55 1970-01→55岁1个月(2025-02)、1981-09→58岁(2039-09)；
// 女50 1975-01→50岁1个月(2025-02)、1980-01→52岁7个月(2032-08)、1984-11→55岁(2039-11)。
// 最低缴费年限：2030-01-01 起由 15 年逐步提高至 20 年、每年提高 6 个月（按退休年份逐年取值）：
// 2030 年 15.5 年、2031 年 16 年……2039 年及以后 20 年；2030 年前退休仍为 15 年。
// 弹性窗口：弹性提前 ≤3 年且不得低于原法定退休年龄（60/55/50），弹性延迟 ≤3 年（简化口径）。

const REFORM_BASE_YM = '2025-01' // 改革施行首月：原退休月早于该月的不延迟
const COUNT_BASE_YM = '2024-12'  // 官方对照表的递增基准月（其上超出月数从 1 开始计数）
const ELASTIC_MONTHS = 36        // 弹性提前 / 弹性延迟上限：3 年

const PERSON_TYPES = [
  { id: 'male', label: '男职工', sub: '原 60 周岁退休', origYears: 60, targetYears: 63, stepMonths: 4, capMonths: 36 },
  { id: 'female55', label: '女职工（原 55 周岁）', sub: '干部及管理技术岗', origYears: 55, targetYears: 58, stepMonths: 4, capMonths: 36 },
  { id: 'female50', label: '女职工（原 50 周岁）', sub: '工人岗位', origYears: 50, targetYears: 55, stepMonths: 2, capMonths: 60 }
]

function typeOf(id) {
  return PERSON_TYPES.find((t) => t.id === id) || PERSON_TYPES[0]
}

// 'YYYY-MM' → 月序号（y*12 + m-1）；格式非法或超出 1900-2200 返回 null
function ymIndexOf(ym) {
  const m = /^(\d{4})-(\d{1,2})$/.exec(String(ym || '').trim())
  if (!m) return null
  const y = +m[1]
  const mo = +m[2]
  if (mo < 1 || mo > 12 || y < 1900 || y > 2200) return null
  return y * 12 + (mo - 1)
}

// 月序号 → 'YYYY-MM'
function ymOfIndex(idx) {
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`
}

// 月序号 → 'YYYY 年 M 月'（展示用）
function ymTextOf(idx) {
  return `${Math.floor(idx / 12)} 年 ${(idx % 12) + 1} 月`
}

// 年龄（岁 + 余月）→ 'X 岁 Y 个月'；余月为 0 时只显示岁数
function ageTextOf(years, months) {
  return months > 0 ? `${years} 岁 ${months} 个月` : `${years} 岁`
}

// originalRetireOf(type) → { years, months }：男 60/0、女55 55/0、女50 50/0
function originalRetireOf(typeId) {
  const t = typeOf(typeId)
  return { years: t.origYears, months: 0 }
}

// delayedRetireOf(birthYM, type) → { ok, affected, birthIdx, origIdx, origYM, retireIdx, retireYM,
//   delayMonths, ageYears, ageMonths }
// 先算原退休年月 = 出生年月 + 原退休年龄；原退休年月早于 2025-01 → 不延迟（old 口径）；
// 否则按官方对照表口径：延迟 = min(上限, ceil(原退休月距 2024-12 的超出月数 / 组距步长))。
function delayedRetireOf(birthYM, typeId) {
  const t = typeOf(typeId)
  const birthIdx = ymIndexOf(birthYM)
  if (birthIdx === null) {
    return { ok: false, affected: false, birthIdx: null, origIdx: null, origYM: '', retireIdx: null, retireYM: '', delayMonths: 0, ageYears: 0, ageMonths: 0 }
  }
  const origIdx = birthIdx + t.origYears * 12
  const reformIdx = ymIndexOf(REFORM_BASE_YM)
  if (origIdx < reformIdx) {
    return {
      ok: true, affected: false, birthIdx, origIdx,
      origYM: ymOfIndex(origIdx), retireIdx: origIdx, retireYM: ymOfIndex(origIdx),
      delayMonths: 0, ageYears: t.origYears, ageMonths: 0
    }
  }
  const beyond = origIdx - ymIndexOf(COUNT_BASE_YM) // 原退休月距 2024-12 的超出月数，≥1
  const delayMonths = Math.min(t.capMonths, Math.ceil(beyond / t.stepMonths))
  const retireIdx = origIdx + delayMonths
  const ageTotal = retireIdx - birthIdx
  return {
    ok: true, affected: true, birthIdx, origIdx,
    origYM: ymOfIndex(origIdx), retireIdx, retireYM: ymOfIndex(retireIdx),
    delayMonths,
    ageYears: Math.floor(ageTotal / 12),
    ageMonths: ageTotal % 12
  }
}

// minContributionYearsOf(retireYM) → 最低缴费年限（15..20，0.5 的整数倍）
// 按退休年份逐年取值：2029 及以前 15；2030-01 至 2039-12 线性每年 +0.5（2030 → 15.5，2039 → 20）；2040 起 20（封顶）。
function minContributionYearsOf(retireYM) {
  const idx = ymIndexOf(retireYM)
  if (idx === null) return null
  const year = Math.floor(idx / 12)
  if (year < 2030) return 15
  return Math.min(20, 15 + (year - 2029) * 0.5)
}

// elasticWindowOf(retireYM, type, origYM) → { earliestIdx, earliestYM, latestIdx, latestYM }
// 弹性提前不超过 3 年且不得低于原法定退休年龄（origYM 为该人的原退休年月，缺省按 retireYM 处理）；
// 弹性延迟不超过 3 年。简化窗口口径，弹性办法以实施细则为准。
function elasticWindowOf(retireYM, typeId, origYM) {
  const retireIdx = ymIndexOf(retireYM)
  if (retireIdx === null) return null
  const origIdx = ymIndexOf(origYM)
  const floorIdx = origIdx === null ? retireIdx : origIdx
  const earliestIdx = Math.max(floorIdx, retireIdx - ELASTIC_MONTHS)
  const latestIdx = retireIdx + ELASTIC_MONTHS
  return { earliestIdx, earliestYM: ymOfIndex(earliestIdx), latestIdx, latestYM: ymOfIndex(latestIdx) }
}

// timelineModelOf(各节点月序号) → CSS 横条百分比：把 [出生 → 弹性延迟上限] 映射到 0..100%
function timelineModelOf(birthIdx, origIdx, retireIdx, earliestIdx, latestIdx) {
  const span = Math.max(1, latestIdx - birthIdx)
  const pctOf = (idx) => Math.round(Math.min(100, Math.max(0, ((idx - birthIdx) / span) * 100)) * 1000) / 1000
  const startPct = pctOf(earliestIdx)
  const endPct = pctOf(latestIdx)
  return {
    origPct: pctOf(origIdx),
    retirePct: pctOf(retireIdx),
    windowStartPct: startPct,
    windowWidthPct: Math.round((endPct - startPct) * 1000) / 1000
  }
}

// ---------- 官方对照表节选（静态硬编码；取值由上方纯函数生成并经官方对照表逐行核对） ----------
const TABLE_SNIPPET = [
  { type: 'male', birth: '1965-01', origYM: '2025-01', origAge: '60 岁', age: '60 岁 1 个月', retireYM: '2025-02', delay: 1 },
  { type: 'male', birth: '1970-01', origYM: '2030-01', origAge: '60 岁', age: '61 岁 4 个月', retireYM: '2031-05', delay: 16 },
  { type: 'male', birth: '1972-09', origYM: '2032-09', origAge: '60 岁', age: '62 岁', retireYM: '2034-09', delay: 24 },
  { type: 'male', birth: '1975-06', origYM: '2035-06', origAge: '60 岁', age: '62 岁 8 个月', retireYM: '2038-02', delay: 32 },
  { type: 'male', birth: '1976-09', origYM: '2036-09', origAge: '60 岁', age: '63 岁', retireYM: '2039-09', delay: 36 },
  { type: 'male', birth: '1980-01', origYM: '2040-01', origAge: '60 岁', age: '63 岁', retireYM: '2043-01', delay: 36 },
  { type: 'female55', birth: '1970-01', origYM: '2025-01', origAge: '55 岁', age: '55 岁 1 个月', retireYM: '2025-02', delay: 1 },
  { type: 'female55', birth: '1975-01', origYM: '2030-01', origAge: '55 岁', age: '56 岁 4 个月', retireYM: '2031-05', delay: 16 },
  { type: 'female55', birth: '1978-05', origYM: '2033-05', origAge: '55 岁', age: '57 岁 2 个月', retireYM: '2035-07', delay: 26 },
  { type: 'female55', birth: '1981-09', origYM: '2036-09', origAge: '55 岁', age: '58 岁', retireYM: '2039-09', delay: 36 },
  { type: 'female55', birth: '1985-03', origYM: '2040-03', origAge: '55 岁', age: '58 岁', retireYM: '2043-03', delay: 36 },
  { type: 'female55', birth: '1990-06', origYM: '2045-06', origAge: '55 岁', age: '58 岁', retireYM: '2048-06', delay: 36 },
  { type: 'female50', birth: '1975-01', origYM: '2025-01', origAge: '50 岁', age: '50 岁 1 个月', retireYM: '2025-02', delay: 1 },
  { type: 'female50', birth: '1977-07', origYM: '2027-07', origAge: '50 岁', age: '51 岁 4 个月', retireYM: '2028-11', delay: 16 },
  { type: 'female50', birth: '1980-01', origYM: '2030-01', origAge: '50 岁', age: '52 岁 7 个月', retireYM: '2032-08', delay: 31 },
  { type: 'female50', birth: '1982-05', origYM: '2032-05', origAge: '50 岁', age: '53 岁 9 个月', retireYM: '2036-02', delay: 45 },
  { type: 'female50', birth: '1984-11', origYM: '2034-11', origAge: '50 岁', age: '55 岁', retireYM: '2039-11', delay: 60 },
  { type: 'female50', birth: '1991-01', origYM: '2041-01', origAge: '50 岁', age: '55 岁', retireYM: '2046-01', delay: 60 }
]

// 最低缴费年限渐进表（2029 及以前 → 2040 及以后），静态展示用
const CONTRIBUTION_PROGRESSION = Array.from({ length: 12 }, (_, i) => {
  const year = 2029 + i
  return { year, years: minContributionYearsOf(`${year}-06`) }
})

// ---------- 页面状态与交互 ----------
const birthYM = ref('')
const typeId = ref('male')
const seoContentVisible = ref(true)
const STORAGE_KEY = 'retirement-age-calculator'

const activeType = computed(() => typeOf(typeId.value))
const result = computed(() => delayedRetireOf(birthYM.value, typeId.value))
const canCalc = computed(() => result.value.ok)

const elasticWin = computed(() => {
  if (!canCalc.value) return null
  return elasticWindowOf(result.value.retireYM, typeId.value, result.value.origYM)
})

const timeline = computed(() => {
  if (!canCalc.value || !elasticWin.value) return null
  return timelineModelOf(result.value.birthIdx, result.value.origIdx, result.value.retireIdx, elasticWin.value.earliestIdx, elasticWin.value.latestIdx)
})

const minYears = computed(() => {
  if (!canCalc.value) return null
  return minContributionYearsOf(result.value.retireYM)
})

const retireYMText = computed(() => (canCalc.value ? ymTextOf(result.value.retireIdx) : '—'))
const origYMText = computed(() => (canCalc.value ? ymTextOf(result.value.origIdx) : '—'))
const birthYMText = computed(() => (canCalc.value ? ymTextOf(result.value.birthIdx) : '—'))
const latestYMText = computed(() => (canCalc.value && elasticWin.value ? ymTextOf(elasticWin.value.latestIdx) : '—'))
const ageText = computed(() => (canCalc.value ? ageTextOf(result.value.ageYears, result.value.ageMonths) : '—'))
const delayText = computed(() => {
  if (!canCalc.value) return '—'
  return result.value.delayMonths > 0 ? `延迟 ${result.value.delayMonths} 个月` : '不延迟'
})

const affectedNote = computed(() => {
  if (!canCalc.value) return ''
  const r = result.value
  const t = activeType.value
  if (!r.affected) {
    return `原法定退休年月 ${ymTextOf(r.origIdx)} 早于 2025 年 1 月（改革施行首月），按原法定退休年龄 ${t.origYears} 周岁退休，不适用延迟。`
  }
  const ageText = ageTextOf(r.ageYears, r.ageMonths)
  return `原法定退休 ${ymTextOf(r.origIdx)}（${t.origYears} 岁），按「每 ${t.stepMonths} 个月延迟 1 个月」口径延迟 ${r.delayMonths} 个月，改革后法定退休年龄 ${ageText}。`
})

const contributionNote = computed(() => {
  if (!canCalc.value || minYears.value === null) return ''
  const year = Math.floor(result.value.retireIdx / 12)
  if (year < 2030) {
    return `${year} 年退休：2030 年 1 月 1 日前退休的最低缴费年限仍为 15 年。`
  }
  if (year < 2039) {
    return `2030 年起最低缴费年限每年提高 6 个月（15 年 → 20 年）：您 ${year} 年退休适用 ${minYears.value} 年，2039 年及以后提高到顶格 20 年。`
  }
  return '最低缴费年限已到顶格：2030 年起每年提高 6 个月，2039 年及以后退休统一适用 20 年。'
})

// 对照表节选按人员类型分组，命中当前输入的行高亮
const snippetGroups = computed(() =>
  PERSON_TYPES.map((t) => ({
    id: t.id,
    title: `${t.label}（原 ${t.origYears} 周岁 · 每 ${t.stepMonths} 个月延迟 1 个月）`,
    rows: TABLE_SNIPPET.filter((r) => r.type === t.id)
  }))
)

// ---------- 示例与重置 ----------
function loadExample() {
  birthYM.value = '1970-01'
  typeId.value = 'male'
}

function resetAll() {
  birthYM.value = ''
  typeId.value = 'male'
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 本地持久化（仅 localStorage，失败静默） ----------
function persistInput() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ birthYM: birthYM.value, typeId: typeId.value }))
  } catch (e) {
    // 隐私模式等场景下写入失败时忽略，不影响测算
  }
}

function restoreInput() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (saved && typeof saved === 'object') {
      if (typeof saved.birthYM === 'string' && ymIndexOf(saved.birthYM) !== null) birthYM.value = saved.birthYM
      if (PERSON_TYPES.some((t) => t.id === saved.typeId)) typeId.value = saved.typeId
    }
  } catch (e) {
    // 本地数据损坏时忽略，按空输入开始
  }
}

watch([birthYM, typeId], persistInput)

onMounted(() => {
  restoreInput()
  addRecentTool('retirement-age-calculator')
})
</script>
