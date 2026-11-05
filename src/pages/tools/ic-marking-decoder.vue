<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ScanSearch class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">IC丝印解读器</h1>
          <p class="text-sm text-muted-foreground mt-1">芯片丝印 date code 周历解读（YYWW / YYMMDD / YYDDD）、常见前缀厂商线索、丝印结构与标识科普</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 IC 丝印解读器：芯片顶面的「2547」「L358P A21」到底怎么读？本工具解读丝印里的 date code——输入数字串自动识别
        YYWW（年+周）、YYMMDD（年月日）、YYDDD（年+天）三种格式，给出生产周对应的周一至周日精确日期（ISO 8601 周历、本地时区计算）；
        另附 37 条常见厂商前缀速查（原厂商 / 现属 / 常见产品线）、SOT-23 与 SOIC-8 丝印四段结构示意、常见标识符号说明与翻新件五点交叉验证清单。
        全部识别在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 免责声明（显著位置） -->
    <div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs leading-relaxed flex items-start gap-2 mb-6">
      <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>
        <strong>仅供学习与线索参考</strong>：丝印可以打磨重印、可以仿冒，本工具不做全量型号反查，解读结果不构成真伪或型号结论。
        反查具体型号请用专业数据库（厂商官网 marking code 表、芯查查、smdmarking 等），关键电路以实物 + 规格书交叉验证为准。
      </span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：date code 输入 -->
      <div class="space-y-4">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CalendarClock class="w-5 h-5 mr-2 text-primary" /> Date code 解读
          </h2>
          <div>
            <label class="block text-sm font-medium mb-1.5 text-foreground">丝印中的数字串</label>
            <input
              v-model="dateInput"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              spellcheck="false"
              placeholder="如 2547、251117、25130"
              class="w-full px-3 py-2 rounded-md border border-border bg-background text-sm font-mono uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
            <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
              自动按位数识别格式：4 位 = YYWW（年+周，主流）、5 位 = YYDDD（年+年内天）、6 位 = YYMMDD（年月日）。非数字字符自动忽略。
            </p>
          </div>
          <div>
            <p class="text-sm font-medium mb-2 text-foreground">示例（点击载入）</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="e in dateExamples"
                :key="e.value"
                @click="dateInput = e.value"
                class="px-3 py-1.5 rounded-md border text-xs font-mono transition"
                :class="dateInput === e.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'"
                :title="e.hint"
              >
                {{ e.value }}
              </button>
            </div>
          </div>
          <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>年份按 2000~2099 解读（两位年份 yy → 20yy）；周历按 ISO 8601 口径：周一起始、包含当年第一个周四的那一周为 W01，平年 52 周、闰年规则下最多 53 周。</span>
          </p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Search class="w-5 h-5 mr-2 text-primary" /> 厂商前缀搜索
          </h2>
          <input
            v-model="prefixQuery"
            type="text"
            autocomplete="off"
            spellcheck="false"
            placeholder="过滤前缀 / 厂商 / 产品线，如 LM、Toshiba、达林顿"
            class="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
          <p class="text-xs text-muted-foreground leading-relaxed">
            在下方「厂商前缀速查」表中按前缀、原厂商、现属或产品线关键词过滤，共 {{ PREFIX_ROWS.length }} 条。
          </p>
        </div>
      </div>

      <!-- 右侧：解读结果（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <h2 class="text-lg font-semibold flex items-center">
              <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 解读结果
            </h2>
            <button
              v-if="dateSummaryText"
              @click="copyResult"
              class="px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-xs text-muted-foreground transition flex items-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> 复制解读
            </button>
          </div>

          <!-- 位数不支持 -->
          <p v-if="dateResult && !dateResult.ok && dateResult.error !== '待输入'" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ dateResult.error }}</span>
          </p>

          <!-- 解读条目 -->
          <template v-if="dateResult && dateResult.ok">
            <div
              v-for="(item, idx) in dateResult.items"
              :key="idx"
              class="rounded-lg p-4"
              :class="item.ok ? 'bg-primary/10' : 'bg-red-500/10'"
            >
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                  :class="item.ok ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-600'"
                >{{ item.type }}</span>
                <span class="text-xs text-muted-foreground">{{ item.formatLabel }}</span>
              </div>
              <template v-if="item.ok">
                <p class="text-2xl font-bold text-primary">{{ item.title }}</p>
                <p class="text-sm text-foreground font-mono mt-1">{{ item.rangeText }}</p>
                <p v-if="item.note" class="text-xs text-muted-foreground mt-2 leading-relaxed">{{ item.note }}</p>
                <p v-if="item.future" class="text-xs text-amber-600 mt-1.5 leading-relaxed flex items-start gap-1">
                  <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>该解读晚于今天：请核对输入，或确认是否为样品 / 预生产批次丝印。</span>
                </p>
              </template>
              <template v-else>
                <p class="text-sm text-red-600 leading-relaxed">{{ item.error }}</p>
              </template>
            </div>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>
                4 位丝印 date code 以 YYWW 为主流；5 位 YYDDD 与 6 位 YYMMDD 多见于批号组合或小厂标法。
                同一串数字若与型号排在一起，注意先按位置分段再解读，date code 通常独立成段、位于型号缩写之后。
              </span>
            </p>
          </template>
          <p v-else-if="dateResult && !dateResult.ok" class="text-sm text-muted-foreground">
            在左侧输入丝印数字串（如 <span class="font-mono">2547</span>），这里给出年份、周次与精确日期区间。
          </p>
        </div>
      </div>
    </div>

    <!-- 厂商前缀速查 -->
    <div class="bg-card border border-border rounded-lg p-6 space-y-3 mb-6">
      <h2 class="text-lg font-semibold flex items-center">
        <Factory class="w-5 h-5 mr-2 text-primary" /> 厂商前缀速查（{{ filteredPrefixRows.length }} / {{ PREFIX_ROWS.length }} 条）
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-muted-foreground border-b border-border">
              <th class="py-2 pr-3 font-medium whitespace-nowrap">前缀</th>
              <th class="py-2 pr-3 font-medium">原厂商</th>
              <th class="py-2 pr-3 font-medium">现属</th>
              <th class="py-2 pr-3 font-medium">常见产品线</th>
              <th class="py-2 font-medium whitespace-nowrap">备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredPrefixRows" :key="row.prefix" class="border-b border-border/50 last:border-0">
              <td class="py-2.5 pr-3 font-mono font-bold text-primary whitespace-nowrap">{{ row.prefix }}</td>
              <td class="py-2.5 pr-3 text-foreground">{{ row.origin }}</td>
              <td class="py-2.5 pr-3 text-foreground">{{ row.now }}</td>
              <td class="py-2.5 pr-3 text-muted-foreground">{{ row.line }}</td>
              <td class="py-2.5">
                <span class="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground whitespace-nowrap">{{ PREFIX_NOTE }}</span>
              </td>
            </tr>
            <tr v-if="!filteredPrefixRows.length">
              <td colspan="5" class="py-6 text-center text-muted-foreground text-sm">没有匹配「{{ prefixQuery }}」的前缀，试试更短的关键词。</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
        <TriangleAlert class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
        <span>
          每一行都要当作「线索」而不是「结论」：半导体制 Bootstrap 半世纪，并购与授权转产极其频繁（原厂商标消亡后前缀被新东家沿用），
          同一前缀也常被多厂共用（如 TDA、ULN、74 系）。前缀只能缩小排查范围，最终定位型号请用专业数据库。
        </span>
      </p>
    </div>

    <!-- 丝印结构示意 -->
    <div class="bg-card border border-border rounded-lg p-6 space-y-4 mb-6">
      <h2 class="text-lg font-semibold flex items-center">
        <Cpu class="w-5 h-5 mr-2 text-primary" /> 丝印四段结构示意（顶视图）
      </h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- SOT-23 -->
        <div class="bg-muted/40 border border-border rounded-lg p-4 space-y-3">
          <p class="text-sm font-medium text-foreground">SOT-23（小封装：常只印两三字符）</p>
          <svg viewBox="0 0 320 190" class="w-full" role="img" aria-label="SOT-23 顶视图丝印位置示意">
            <!-- 本体 -->
            <rect x="112" y="26" width="84" height="78" rx="3" class="fill-muted stroke-border" stroke-width="1.5" />
            <!-- 引脚（顶视图向下延伸） -->
            <rect x="120" y="104" width="10" height="44" rx="2" class="fill-muted stroke-border" stroke-width="1.2" />
            <rect x="149" y="104" width="10" height="44" rx="2" class="fill-muted stroke-border" stroke-width="1.2" />
            <rect x="178" y="104" width="10" height="44" rx="2" class="fill-muted stroke-border" stroke-width="1.2" />
            <text x="125" y="162" font-size="10" text-anchor="middle" class="fill-current text-muted-foreground">1</text>
            <text x="154" y="162" font-size="10" text-anchor="middle" class="fill-current text-muted-foreground">2</text>
            <text x="183" y="162" font-size="10" text-anchor="middle" class="fill-current text-muted-foreground">3</text>
            <!-- pin1 圆点 -->
            <circle cx="124" cy="38" r="4" class="fill-current text-muted-foreground" />
            <!-- 丝印：型号缩写 -->
            <text x="154" y="72" font-size="16" text-anchor="middle" font-family="monospace" class="fill-current text-foreground">J3</text>
            <!-- 标注引线 -->
            <line x1="128" y1="38" x2="208" y2="26" class="stroke-border" stroke-dasharray="3 3" />
            <text x="212" y="30" font-size="11" class="fill-current text-muted-foreground">pin1 圆点（定位）</text>
            <line x1="166" y1="66" x2="212" y2="66" class="stroke-border" stroke-dasharray="3 3" />
            <text x="216" y="70" font-size="11" class="fill-current text-muted-foreground">型号缩写（两三字符）</text>
            <line x1="188" y1="88" x2="212" y2="102" class="stroke-border" stroke-dasharray="3 3" />
            <text x="216" y="106" font-size="11" class="fill-current text-muted-foreground">logo / date code / 批号：面积太小，常省略或并入型号简码</text>
          </svg>
          <p class="text-xs text-muted-foreground leading-relaxed">
            SOT-23 顶面只有约 2.9×2.4mm，绝大多数只印 2~3 个字符的型号缩写（如 J3 = 一颗具体二极管 / 三极管的简码），
            厂商 logo、date code、批号通常全部省略。这类缩写要靠厂商小封装代码表反查。
          </p>
        </div>
        <!-- SOIC-8 -->
        <div class="bg-muted/40 border border-border rounded-lg p-4 space-y-3">
          <p class="text-sm font-medium text-foreground">SOIC-8（完整四段丝印：logo / 型号缩写 / date code / 批号）</p>
          <svg viewBox="0 0 340 190" class="w-full" role="img" aria-label="SOIC-8 顶视图丝印四段位置示意">
            <!-- 本体 -->
            <rect x="86" y="30" width="150" height="118" rx="3" class="fill-muted stroke-border" stroke-width="1.5" />
            <!-- pin1 切角 -->
            <line x1="86" y1="44" x2="100" y2="30" class="stroke-border" stroke-width="2" />
            <!-- 左右引脚各 4 -->
            <rect x="56" y="44" width="30" height="10" rx="2" class="fill-muted stroke-border" stroke-width="1.2" />
            <rect x="56" y="70" width="30" height="10" rx="2" class="fill-muted stroke-border" stroke-width="1.2" />
            <rect x="56" y="96" width="30" height="10" rx="2" class="fill-muted stroke-border" stroke-width="1.2" />
            <rect x="56" y="122" width="30" height="10" rx="2" class="fill-muted stroke-border" stroke-width="1.2" />
            <rect x="236" y="44" width="30" height="10" rx="2" class="fill-muted stroke-border" stroke-width="1.2" />
            <rect x="236" y="70" width="30" height="10" rx="2" class="fill-muted stroke-border" stroke-width="1.2" />
            <rect x="236" y="96" width="30" height="10" rx="2" class="fill-muted stroke-border" stroke-width="1.2" />
            <rect x="236" y="122" width="30" height="10" rx="2" class="fill-muted stroke-border" stroke-width="1.2" />
            <!-- pin1 圆点 -->
            <circle cx="102" cy="42" r="3.5" class="fill-current text-muted-foreground" />
            <!-- 四段丝印 -->
            <circle cx="118" cy="60" r="7" fill="none" class="stroke-border" stroke-width="1.5" />
            <path d="M 115 60 L 118 55 L 121 60 Z" class="fill-current text-muted-foreground" />
            <text x="161" y="90" font-size="15" text-anchor="middle" font-family="monospace" class="fill-current text-foreground">L358P</text>
            <text x="161" y="112" font-size="13" text-anchor="middle" font-family="monospace" class="fill-current text-muted-foreground">2547</text>
            <text x="161" y="132" font-size="11" text-anchor="middle" font-family="monospace" class="fill-current text-muted-foreground">A21</text>
            <!-- 标注引线 -->
            <line x1="127" y1="60" x2="272" y2="46" class="stroke-border" stroke-dasharray="3 3" />
            <text x="276" y="50" font-size="11" class="fill-current text-muted-foreground">厂商 logo</text>
            <line x1="186" y1="85" x2="272" y2="80" class="stroke-border" stroke-dasharray="3 3" />
            <text x="276" y="84" font-size="11" class="fill-current text-muted-foreground">型号缩写</text>
            <line x1="180" y1="108" x2="272" y2="112" class="stroke-border" stroke-dasharray="3 3" />
            <text x="276" y="116" font-size="11" class="fill-current text-muted-foreground">date code（YYWW）</text>
            <line x1="172" y1="128" x2="272" y2="140" class="stroke-border" stroke-dasharray="3 3" />
            <text x="276" y="144" font-size="11" class="fill-current text-muted-foreground">批号（lot code）</text>
            <line x1="93" y1="37" x2="40" y2="26" class="stroke-border" stroke-dasharray="3 3" />
            <text x="8" y="22" font-size="11" class="fill-current text-muted-foreground">pin1 切角 + 圆点</text>
          </svg>
          <p class="text-xs text-muted-foreground leading-relaxed">
            SOIC 及以上封装顶面通常依次印四段：厂商 logo、型号缩写（可能是完整型号 LM358P，也可能是内部简码）、
            date code（本工具主功能：如 2547）、批号。四段的字号、行序因厂商而异，date code 常独占一行。
          </p>
        </div>
      </div>
    </div>

    <!-- 标识符号说明 + 翻新件交叉验证 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-card border border-border rounded-lg p-6 space-y-3">
        <h2 class="text-lg font-semibold flex items-center">
          <Leaf class="w-5 h-5 mr-2 text-primary" /> 常见标识符号说明
        </h2>
        <div v-for="s in symbolRows" :key="s.title" class="flex items-start gap-3 bg-muted/40 border border-border rounded-lg px-3 py-2.5">
          <component :is="s.icon" class="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
          <div>
            <p class="text-sm font-medium text-foreground">{{ s.title }}</p>
            <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">{{ s.text }}</p>
          </div>
        </div>
      </div>

      <div class="bg-card border border-border rounded-lg p-6 space-y-3">
        <h2 class="text-lg font-semibold flex items-center">
          <ShieldCheck class="w-5 h-5 mr-2 text-primary" /> 翻新件交叉验证五点
        </h2>
        <div v-for="(c, i) in counterfeitChecks" :key="c.title" class="flex items-start gap-3 bg-muted/40 border border-border rounded-lg px-3 py-2.5">
          <span class="text-xs font-mono font-bold text-primary mt-0.5">{{ String(i + 1).padStart(2, '0') }}</span>
          <div>
            <p class="text-sm font-medium text-foreground">{{ c.title }}</p>
            <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">{{ c.text }}</p>
          </div>
        </div>
        <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <span>五点中任意一点异常即应提高警惕，两点以上同时出现基本可判定翻新或重打标；date code 逻辑矛盾是其中成本最低、最易执行的排查项。</span>
        </p>
      </div>
    </div>

    <RelatedTools :currentToolId="'ic-marking-decoder'" :category="'others'" />

    <!-- SEO 内容区 -->
    <div class="relative mt-8">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>IC丝印解读器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          IC丝印解读器是一款面向电子维修、采购验货和电子爱好者的教学型丝印线索工具。芯片顶面的字符一般由四段组成：
          厂商 logo、型号缩写、date code（生产日期码）与批号。本工具的主功能是解读其中的 date code——输入 4 位数字按 YYWW（年 + 周）
          给出该周的周一至周日精确日期，5 位按 YYDDD（年 + 年内第几天）、6 位按 YYMMDD（年月日）解读，周历采用 ISO 8601 口径、
          本地时区计算；同时提供 37 条常见厂商前缀的「原厂商 / 现属 / 常见产品线」速查、丝印四段结构示意图、常见标识符号说明
          与翻新件五点交叉验证清单。工具定位是教学与线索参考，不做全量型号反查——丝印可仿可重印，反查具体型号请用专业数据库。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">丝印四段结构详解</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          以 SOIC-8 上的一行「L358P 2547 A21」为例：第一段厂商 logo（激光图形标）标识原厂；
          第二段型号缩写可能是完整型号也可能是厂商内部简码（SOT-23 等小封装只剩这一段，常两三个字符）；
          第三段 date code 是生产日期码，主流为 YYWW（两位年 + 两位周），也有 YYMMDD、YYDDD 或「年 + 字母月」等变体；
          第四段批号（lot / batch code）标识同一批次晶圆，可带字母数字混合。date code 与批号共同决定批次一致性——
          同一型号不同批次的工艺改版、参数微调都可能存在，替换器件时尽量同批次或核对改版记录。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">date code 为什么重要</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          一是<span class="font-medium text-foreground">批次改版差异</span>：半导体厂商会在生命周期内悄悄改版（换晶圆厂、修 errata、调参数档），
          维修与设计复用时要确认批次行为一致；二是<span class="font-medium text-foreground">库存判断</span>：date code 集中且新鲜可能是正常到货，
          date code 跨度极大（如同一盘里 2013 到 2024 混杂）则是拆机 / 翻新的强信号；三是<span class="font-medium text-foreground">质保与追溯</span>：
          厂商索赔、召回都按批次走，date code 是第一关键字。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么丝印不是真伪凭证</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          丝印本质是物理印刷：激光重打标、打磨后重印、洗版重印在造假产业链里都是成熟工艺，连包装与编带都可以仿。
          正向逻辑成立（真芯片的丝印符合原厂规则），反向逻辑不成立（丝印像真货不等于就是真货）。
          可靠的验证路径是：丝印线索 → 专业数据库反查 → 实物参数测试（功能、曲线、X-RAY 看晶圆、开封看芯片版图）→ 渠道溯源。
          本工具的翻新件五点交叉验证清单就是这条路径里的低成本初筛。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">小封装缩写怎么查</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          SOT-23 / SOT-323 等小封装上的两三字符缩写，直接搜索引擎往往查不准，正规路径是：
          先根据封装与引脚数猜厂商范围，再查该厂商官网的「marking code / small-signal code」对照表（TI、onsemi、NXP、Nexperia、Rohm 都有公开 PDF）；
          或使用专业数据库如芯查查、smdmarking 这类丝印反查库输入缩写 + 封装得到候选列表，再用参数（耐压、电流、hFE）收敛到唯一型号。
          注意不同厂商可能用同一缩写标不同器件，封装体色与 date code 风格可作旁证。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">前缀并购史举例</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          半导体行业并购频繁，前缀「换东家不换姓」是常态：LM（原 National Semiconductor，2011 年并入 TI）；
          MAX（原 Maxim Integrated，2021 年并入 ADI）；IR（原 International Rectifier，2015 年并入 Infineon）；
          KA（原 Fairchild，2016 年并入 onsemi）；AT（原 Atmel，2016 年并入 Microchip）；ICL / HI（原 Intersil / Harris，
          线并入 Renesas）；MC（原 Motorola 半导体，拆分为 Freescale 后器件线归于 onsemi / NXP）；
          CD（原 RCA，4000 系列现由 TI 等多厂生产）；LA / LB（原 Sanyo，2010 年并入 onsemi）；
          AN（原松下，2020 年半导体业务由 Nuvoton 承接）。所以速查表里「现属」一栏会随时间变化，遇到陌生前缀先查并购史再下结论。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">丝印 2547 是哪一年的芯片？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              按 YYWW 主流口径：2547 = 2025 年第 47 周，对应 2025-11-17（周一）至 2025-11-23（周日）这一周生产。
              周历按 ISO 8601（周一起始、含当年第一个周四的那周为 W01），平年 52 周、个别年份 53 周（如 2020 W53）。
              在本工具输入数字串即可得到任意 date code 的精确日期区间。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">怎么查丝印对应的具体型号？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              三步：完整型号丝印（如 LM358P、STM32F103C8T6）直接搜型号 + 厂商官网核对封装与丝印规则；
              小封装缩写（SOT-23 的 J3、L7 等）查厂商官网 marking code 表或专业数据库（芯查查、smdmarking 等）反查候选列表，再用参数收敛；
              只有 date code 没有型号的裸字串无法反查型号——date code 只记录时间不记录器件身份，这正是「丝印四段」要分段理解的原因。
              本工具定位教学与线索参考，不做全量反查。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">怎么判断是不是翻新件？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              低成本初筛看五点：丝印质感（重打标重影、字浅、字号与原厂不符）、引脚光洁度（焊锡半月残留、氧化发黑、镀层磨损）、
              封装光泽（喷砂翻新后发乌）、date code 与整机上市日期逻辑矛盾（「生产日期」晚于设备上市年份必假）、
              价格渠道异常（远低于市场价的批量现货）。任一点异常提高警惕，两点以上基本可判翻新；进一步用 X-RAY、参数测试或开封验证。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">丝印上的小圆点、切角和色环是什么意思？</h3>
            <p class="text-muted-foreground mt-1 leading-relaxed">
              圆点与切角都是 pin1（第一脚）方向标识，SOIC 常见左上角切角 + 圆点双标；二极管 / 齐纳管体上的色环标阴极（负极），
              焊接方向靠它判断；Pb-free 叶子标、绿色点与 RoHS 字样表示无铅与限用物质合规；ESD 三角警示说明器件对人体敏感
              （HBM 模型低等级），操作时需要防静电手环与接地台垫。
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  ScanSearch, CalendarClock, Search, Info, Copy, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Cpu, Leaf, Recycle, ShieldCheck, Factory, CircleDot
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'IC丝印解读器 - 芯片date code生产日期解读与前缀线索查询工具',
  description: '免费在线 IC 丝印解读器：输入丝印数字串自动识别 YYWW/YYMMDD/YYDDD 三种 date code 格式并给出生产周精确日期（ISO 8601 周历），附 37 条常见厂商前缀原属速查、SOT-23/SOIC-8 丝印结构示意、标识符号说明与翻新件五点交叉验证，仅供学习线索参考，纯本地计算不上传',
  keywords: '芯片丝印查询,date code解读,ic生产日期,丝印反查,芯片批次,ic marking decoder,smd marking code',
  author: '有条工具',
  ogTitle: 'IC丝印解读器 - 芯片date code生产日期解读与前缀线索查询 | 有条工具',
  ogDescription: 'YYWW/YYMMDD/YYDDD 三种 date code 自动解读，37 条厂商前缀速查，丝印结构示意与翻新件验证清单，仅供学习线索参考。',
  ogUrl: 'https://www.util.cn/tools/ic-marking-decoder',
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
          name: 'IC丝印解读器',
          url: 'https://www.util.cn/tools/ic-marking-decoder',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'YYWW date code 解读（ISO 8601 周历，周一至周日精确日期）',
            'YYMMDD 与 YYDDD 格式自动识别解读',
            '非法周数 / 日期明确报错（如 2599 周数无效）',
            '37 条常见厂商前缀速查（原厂商 / 现属 / 产品线，可搜索过滤）',
            'SOT-23 与 SOIC-8 丝印四段结构顶视示意图',
            '常见标识符号说明（Pb-free / RoHS / ESD / pin1）',
            '翻新件五点交叉验证清单',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: 'IC丝印解读器', item: 'https://www.util.cn/tools/ic-marking-decoder/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '丝印 2547 是哪一年的芯片？',
              acceptedAnswer: { '@type': 'Answer', text: '按 YYWW 主流口径：2547 = 2025 年第 47 周，对应 2025-11-17（周一）至 2025-11-23（周日）这一周生产。周历按 ISO 8601（周一起始、含当年第一个周四的那周为 W01），平年 52 周、个别年份 53 周（如 2020 W53）。' }
            },
            {
              '@type': 'Question',
              name: '怎么查丝印对应的具体型号？',
              acceptedAnswer: { '@type': 'Answer', text: '完整型号丝印直接搜型号并到厂商官网核对；小封装缩写（SOT-23 的 J3、L7 等）查厂商官网 marking code 表或专业数据库（芯查查、smdmarking 等）反查候选列表，再用参数收敛。只有 date code 无法反查型号——它只记录时间不记录器件身份。' }
            },
            {
              '@type': 'Question',
              name: '怎么判断是不是翻新件？',
              acceptedAnswer: { '@type': 'Answer', text: '低成本初筛看五点：丝印质感（重打标重影、字浅）、引脚光洁度（焊锡半月残留、氧化发黑）、封装光泽（喷砂翻新发乌）、date code 与整机上市日期逻辑矛盾、价格渠道异常。任一点异常提高警惕，两点以上基本可判翻新。' }
            },
            {
              '@type': 'Question',
              name: '丝印上的小圆点、切角和色环是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '圆点与切角是 pin1（第一脚）方向标识；二极管/齐纳管体上的色环标阴极（负极）；Pb-free 叶子标、绿点与 RoHS 表示无铅合规；ESD 三角警示说明器件对人体敏感（HBM 低等级），操作需防静电。' }
            }
          ]
        }
      ]
    })
  }]
})

/* ===== 纯函数区开始（node 单测直接复用本段，勿混入 Vue 响应式或浏览器 API） ===== */

const WEEKDAY_CN = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function pad2(n) {
  return String(n).padStart(2, '0')
}
function pad3(n) {
  return String(n).padStart(3, '0')
}

function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

// ISO 8601：当年有 52 或 53 周。1 月 1 日是周四必为 53 周；闰年且 1 月 1 日是周三也是 53 周
function isoWeeksInYear(y) {
  const dow = new Date(y, 0, 1).getDay() // 0=周日 ... 4=周四
  return (dow === 4 || (isLeapYear(y) && dow === 3)) ? 53 : 52
}

// 本地时区日期加减（显式 Date(y, m, d) 构造，避免 UTC 偏移）
function addDays(d, n) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  r.setDate(r.getDate() + n)
  return r
}

// ISO 周 W 的周一（W 合法性由调用方校验）
function isoWeekMonday(y, w) {
  const jan1 = new Date(y, 0, 1)
  const shift = (jan1.getDay() + 6) % 7 // 距本周一的天数（周一=0）
  const week1Monday = addDays(jan1, -shift)
  return addDays(week1Monday, (w - 1) * 7)
}

function fmtISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function fmtDateWithWeek(d) {
  return `${fmtISODate(d)}（${WEEKDAY_CN[(d.getDay() + 6) % 7]}）`
}

// 某年某月天数（m 为 1~12）
function daysInMonthOf(y, m) {
  return new Date(y, m, 0).getDate()
}

// date code 解读核心：自动按位数识别 YYWW（4 位）/ YYDDD（5 位）/ YYMMDD（6 位）
function parseDateCode(raw) {
  const s = String(raw === null || raw === undefined ? '' : raw).replace(/\D/g, '')
  if (!s) return { ok: false, error: '待输入' }
  if (s.length === 4) return parseYYWW(s)
  if (s.length === 5) return parseYYDDD(s)
  if (s.length === 6) return parseYYMMDD(s)
  return {
    ok: false,
    error: `「${s}」是 ${s.length} 位数字：丝印 date code 支持 4 位 YYWW（如 2547）、5 位 YYDDD（如 25130）、6 位 YYMMDD（如 251117）；其他位数不做猜测式解读`
  }
}

function parseYYWW(s) {
  const yy = Number(s.slice(0, 2))
  const w = Number(s.slice(2))
  const year = 2000 + yy
  const weeks = isoWeeksInYear(year)
  if (w < 1 || w > weeks) {
    return {
      ok: true,
      digits: s,
      items: [{
        type: 'YYWW',
        ok: false,
        formatLabel: `${s}（年 ${year} + 周）`,
        error: `周数无效：${year} 年按 ISO 8601 周历只有 ${weeks} 周（W 须为 01~${pad2(weeks)}），「${s}」不构成合法 date code`
      }]
    }
  }
  const monday = isoWeekMonday(year, w)
  const sunday = addDays(monday, 6)
  const crossYear = monday.getFullYear() !== year ? '该周历跨年（W01 可能包含上年末几天）。' : ''
  return {
    ok: true,
    digits: s,
    items: [{
      type: 'YYWW',
      ok: true,
      formatLabel: `${s}（年 ${year} + 周 ${pad2(w)}）`,
      title: `${year} 年第 ${pad2(w)} 周`,
      rangeText: `${fmtDateWithWeek(monday)}至${fmtDateWithWeek(sunday)}`,
      mondayISO: fmtISODate(monday),
      sundayISO: fmtISODate(sunday),
      year,
      week: w,
      note: `丝印 date code 以 YYWW 为主流。${crossYear}`,
      future: sunday.getTime() > Date.now()
    }]
  }
}

function parseYYDDD(s) {
  const yy = Number(s.slice(0, 2))
  const ddd = Number(s.slice(2))
  const year = 2000 + yy
  const ylen = isLeapYear(year) ? 366 : 365
  if (ddd < 1 || ddd > ylen) {
    return {
      ok: true,
      digits: s,
      items: [{
        type: 'YYDDD',
        ok: false,
        formatLabel: `${s}（年 ${year} + 年内天）`,
        error: ddd < 1
          ? `天数无效：DDD 段须为 001~${ylen}，「${s}」的 ${pad3(ddd)} 不合法`
          : `年内天数无效：${year} 年只有 ${ylen} 天（${isLeapYear(year) ? '闰年' : '平年'}），「${s}」的 DDD = ${pad3(ddd)} 超界`
      }]
    }
  }
  const date = new Date(year, 0, ddd) // 显式本地时区构造，day-of-year 溢出自动进位
  return {
    ok: true,
    digits: s,
    items: [{
      type: 'YYDDD',
      ok: true,
      formatLabel: `${s}（年 ${year} + 年内第 ${pad3(ddd)} 天）`,
      title: `${year} 年第 ${pad3(ddd)} 天`,
      rangeText: `${fmtDateWithWeek(date)}`,
      dateISO: fmtISODate(date),
      year,
      note: 'YYDDD（年 + 年内天）写法少见，多见于批号组合；如与周历口径冲突以厂商资料为准。',
      future: date.getTime() > Date.now()
    }]
  }
}

function parseYYMMDD(s) {
  const yy = Number(s.slice(0, 2))
  const mm = Number(s.slice(2, 4))
  const dd = Number(s.slice(4))
  const year = 2000 + yy
  if (mm < 1 || mm > 12) {
    return {
      ok: true,
      digits: s,
      items: [{
        type: 'YYMMDD',
        ok: false,
        formatLabel: `${s}（年 ${year} + 月日）`,
        error: `月份无效：MM 段须为 01~12，「${s}」的 MM = ${pad2(mm)} 不合法`
      }]
    }
  }
  const dim = daysInMonthOf(year, mm)
  if (dd < 1 || dd > dim) {
    return {
      ok: true,
      digits: s,
      items: [{
        type: 'YYMMDD',
        ok: false,
        formatLabel: `${s}（年 ${year} + 月 ${mm}）`,
        error: `日期无效：${year} 年 ${mm} 月只有 ${dim} 天，「${s}」的 DD = ${pad2(dd)} 超界`
      }]
    }
  }
  const date = new Date(year, mm - 1, dd) // 显式本地时区构造，避免 UTC 偏移
  return {
    ok: true,
    digits: s,
    items: [{
      type: 'YYMMDD',
      ok: true,
      formatLabel: `${s}（年 ${year} + 月 ${pad2(mm)} + 日 ${pad2(dd)}）`,
      title: `${year} 年 ${mm} 月 ${dd} 日`,
      rangeText: `${fmtDateWithWeek(date)}`,
      dateISO: fmtISODate(date),
      year,
      note: 'YYMMDD 写法多见于批号组合段；主流 date code 仍是 YYWW。',
      future: date.getTime() > Date.now()
    }]
  }
}

// 厂商前缀速查（37 条）：前缀 | 原厂商 | 现属 | 常见产品线，均为线索性信息
const PREFIX_NOTE = '多厂共用/并购频繁，仅供线索'
const PREFIX_ROWS = [
  { prefix: 'LM', origin: '原 National Semiconductor（国半）', now: 'TI（2011 年并购）', line: '运放 / 稳压 / 电源：LM358、LM317、LM2596' },
  { prefix: 'MC', origin: '原 Motorola（后 Freescale）', now: 'onsemi / NXP', line: '逻辑 / 运放 / MCU：MC14093、MC34063' },
  { prefix: 'TL', origin: 'TI', now: 'TI', line: '线性 / 运放 / PWM：TL431、TL072、TL494' },
  { prefix: 'SN', origin: 'TI 逻辑线', now: 'TI', line: '74 系逻辑：SN74HC595、SN74LVC245' },
  { prefix: 'CD', origin: '原 RCA', now: 'TI 等多厂', line: 'CD4000 CMOS 逻辑：CD4017、CD4060' },
  { prefix: 'NE', origin: '原 Signetics', now: 'NXP', line: '定时器 / 音频：NE555、NE5532' },
  { prefix: 'SA', origin: '原 Signetics', now: 'NXP', line: '同系专用品：SA5532、SA605' },
  { prefix: 'AD', origin: 'Analog Devices', now: 'ADI', line: '运放 / 数据转换：AD620、AD8232' },
  { prefix: 'MAX', origin: '原 Maxim Integrated', now: 'ADI（2021 年并购）', line: '电源 / 接口：MAX232、MAX7219' },
  { prefix: 'ICL', origin: '原 Intersil', now: 'Renesas（2017 年并购 Intersil）', line: '波形发生 / A/D 前端：ICL8038、ICL7107' },
  { prefix: 'HI', origin: '原 Harris', now: 'Renesas（Intersil 线沿袭）', line: '高可靠模拟 / 运放：HI- 系列' },
  { prefix: 'STM', origin: 'ST', now: 'ST', line: 'MCU / 功率：STM32、STM8' },
  { prefix: 'TDA', origin: '原 Philips 系，多厂通用', now: 'ST / NXP / 多厂', line: '音频功放：TDA2030、TDA7297' },
  { prefix: 'TA', origin: '东芝', now: 'Toshiba 电子器件', line: '音频功放 / 功率：TA7240、TA7633' },
  { prefix: 'NJM', origin: '原新日本无线（JRC）', now: 'JRC（现役品牌）', line: '运放 / 稳压：NJM4558、NJM5532' },
  { prefix: 'µPC', origin: '原 NEC', now: 'Renesas（NEC 电子沿袭）', line: '运放 / 功放保护：µPC1237（丝印常印 UPC / C）' },
  { prefix: 'BA', origin: 'Rohm', now: 'Rohm', line: '音频 / 驱动：BA1404、BA6208' },
  { prefix: 'BU', origin: 'Rohm（BU 亦被多厂用作功率管前缀）', now: 'Rohm / 多厂', line: '功率晶体管：BU406、BU508' },
  { prefix: 'LA', origin: '原 Sanyo', now: 'onsemi（2010 年并购）', line: '音频功放 / 场输出：LA4440、LA7840' },
  { prefix: 'LB', origin: '原 Sanyo', now: 'onsemi', line: 'LED 驱动 / 电平指示：LB1403、LB1836' },
  { prefix: 'AN', origin: '松下', now: 'Nuvoton（2020 年承接松下半导体）', line: '稳压 / 音放：AN78xx、AN7115' },
  { prefix: 'MB', origin: '原 Fujitsu', now: 'Socionext（部分产线转产）', line: 'MCU / 存储器：MB89 系列、MBM27 系列' },
  { prefix: 'HA', origin: '原 Hitachi', now: 'Renesas', line: '通用模拟 / 音放：HA17555、HA13118' },
  { prefix: 'HD', origin: '原 Hitachi', now: 'Renesas', line: 'MCU / LCD 控制 / 逻辑：HD44780、HD64180' },
  { prefix: 'KS', origin: '原 Samsung', now: 'Samsung System LSI', line: 'LCD 控制 / MCU：KS0066、KS57C 系列' },
  { prefix: 'KA', origin: '原 Fairchild', now: 'onsemi（2016 年并购）', line: '电源 / 稳压：KA7500、KA3842' },
  { prefix: 'IR', origin: '原 International Rectifier', now: 'Infineon（2015 年并购）', line: 'MOSFET / 栅极驱动：IRF540、IR2110' },
  { prefix: 'UC', origin: '原 Unitrode', now: 'TI（1999 年并购）', line: '电源控制：UC3842、UC3854' },
  { prefix: 'ULN', origin: '原 Sprague', now: 'TI / ST / onsemi 等多厂', line: '达林顿阵列：ULN2003、ULN2803' },
  { prefix: 'ULQ', origin: '原 Sprague（ULN 同族）', now: 'TI / ST / onsemi 等多厂', line: '达林顿阵列：ULQ2003、ULQ2004' },
  { prefix: '74xx', origin: 'TI 原 Signetics 7400 系，多厂并存', now: 'TI / onsemi / NXP / Diodes 等', line: '74 系逻辑：74HC00、74LS138、74LVC245' },
  { prefix: '40xx', origin: '原 RCA CD4000 系', now: 'TI / onsemi / ST 等多厂', line: 'CMOS 逻辑：4011、4017、4060' },
  { prefix: 'DM', origin: '原 National Semiconductor', now: 'TI（2011 年并购）', line: '逻辑：DM74LS00、DM74S 系列' },
  { prefix: 'LMX', origin: 'TI（原 NS RF 线并入）', now: 'TI', line: 'RF 锁相环 / 频率合成：LMX2306、LMX2594' },
  { prefix: 'TPS', origin: 'TI', now: 'TI', line: '电源管理：TPS5430、TPS62203' },
  { prefix: 'MCP', origin: 'Microchip', now: 'Microchip', line: 'CAN / ADC / LDO：MCP2551、MCP1700' },
  { prefix: 'AT', origin: '原 Atmel', now: 'Microchip（2016 年并购）', line: 'MCU / EEPROM：AT89C52、ATmega328P、AT24C02' }
]

/* ===== 纯函数区结束 ===== */

// ---------- 交互状态 ----------
const seoContentVisible = ref(true)
const dateInput = ref('2547')
const prefixQuery = ref('')
const STORAGE_KEY = 'ic-marking-decoder:state'

const dateExamples = [
  { value: '2547', hint: '2025 年第 47 周' },
  { value: '2401', hint: '2024 年第 1 周' },
  { value: '2512', hint: '2025 年第 12 周' },
  { value: '2601', hint: '2026 年第 1 周（跨年周）' },
  { value: '2053', hint: '2020 年第 53 周（53 周年）' },
  { value: '2599', hint: '非法样例：2025 年没有第 99 周' },
  { value: '251117', hint: '6 位 YYMMDD：2025-11-17' },
  { value: '25130', hint: '5 位 YYDDD：2025 年第 130 天' },
  { value: '24366', hint: '5 位 YYDDD：闰年 2024 第 366 天' }
]

const dateResult = computed(() => parseDateCode(dateInput.value))

const filteredPrefixRows = computed(() => {
  const q = prefixQuery.value.trim().toLowerCase()
  if (!q) return PREFIX_ROWS
  return PREFIX_ROWS.filter(r =>
    r.prefix.toLowerCase().includes(q) ||
    r.origin.toLowerCase().includes(q) ||
    r.now.toLowerCase().includes(q) ||
    r.line.toLowerCase().includes(q)
  )
})

// ---------- 静态卡数据 ----------
const symbolRows = [
  { icon: Leaf, title: 'Pb-free 叶子标识', text: '叶形图标表示无铅工艺（铅含量符合 RoHS 豁免清单要求）；焊端镀层为无铅合金，回流焊温度曲线需按无铅档（峰值约 245~260℃）设置。' },
  { icon: Recycle, title: '绿色环保点 / RoHS', text: '封装上的绿色点或「Green」字样表示该器件同时满足无卤与 RoHS 限用物质要求；RoHS 字样本身表示十项限用物质达标，二者常同时出现。' },
  { icon: TriangleAlert, title: 'ESD 三角警示', text: '三角 + 静电符号表示器件对静电敏感，三角内数字为人体模型（HBM）耐受等级：无数字为 2kV 标准，1kV / 500V / 250V 为敏感等级递增，操作需佩戴防静电手环并接地。' },
  { icon: CircleDot, title: '色环 = 阴极标识', text: '二极管 / 齐纳管体端的一圈色环标阴极（负极）；SOT-23 封装的引脚序号以 pin1 圆点或封装侧面斜切为准，贴装方向以它定位。' },
  { icon: Cpu, title: '切角 = pin1', text: 'SOIC / QFP 等封装左上角（俯视）常有一个小切角或凹坑，配合丝印圆点共同标识 pin1；读丝印时先定 pin1 再按逆时针 / 顺时针展开引脚。' }
]

const counterfeitChecks = [
  { title: '丝印质感', text: '重打标常有重影（新旧字重叠）、字深浅不一、字号字体与原厂规格不符；激光刻字边缘发毛、打磨面反光异常都是重印痕迹。' },
  { title: '引脚光洁度', text: '原厂新件引脚镀层光亮平整；拆机翻新件引脚常见焊锡半月残留（弯月状锡痕）、氧化发黑、镀层磨损或重新电镀后的哑光面。' },
  { title: '封装光泽', text: '翻新常经喷砂 / 抛光「美容」，封装表面光泽不均或整体发乌；塑封体的模印文字被磨薄，棱角变钝。' },
  { title: 'date code 逻辑矛盾', text: '丝印「生产日期」晚于整机上市日期必假；同一盘内 date code 跨度极大、字体风格混杂不同年代规格，都是拼料翻新的强信号——用本工具先算出具体日期再比对。' },
  { title: '价格渠道异常', text: '远低于市场价的批量现货、停产料却「大量全新原装」、无质保与溯源渠道的散新货，风险远高于账面价差，优先选授权 / 指定分销渠道。' }
]

// ---------- 复制（剪贴板 API 仅在事件回调中使用，反馈用 alert，SSR 安全） ----------
const dateSummaryText = computed(() => {
  const r = dateResult.value
  if (!r.ok) return ''
  const parts = []
  for (const item of r.items) {
    if (item.ok) parts.push(`${item.type}：${item.title}（${item.rangeText}）`)
    else parts.push(`${item.type}：${item.error}`)
  }
  return `${r.digits} → ${parts.join('；')}`
})

function copyResult() {
  const text = dateSummaryText.value
  if (!text) return
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => { alert('已复制到剪贴板：\n' + text) },
        () => { alert('复制失败，请手动选择文本复制') }
      )
    } else {
      alert('当前环境不支持自动复制，请手动选择文本')
    }
  } catch {
    alert('复制失败，请手动选择文本复制')
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 本地持久化（localStorage 仅在 onMounted 内访问，SSR 安全） ----------
onMounted(() => {
  addRecentTool('ic-marking-decoder')
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      if (saved && typeof saved === 'object') {
        if (typeof saved.dateInput === 'string') dateInput.value = saved.dateInput
        if (typeof saved.prefixQuery === 'string') prefixQuery.value = saved.prefixQuery
      }
    }
  } catch {
    // 本地存储不可用或内容损坏时忽略，使用默认值
  }
  watch(
    [dateInput, prefixQuery],
    () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          dateInput: dateInput.value,
          prefixQuery: prefixQuery.value
        }))
      } catch {
        // 忽略写入失败（隐私模式等）
      }
    }
  )
})
</script>
