<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-start gap-3 mb-3">
        <div class="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <component :is="toolIcon" class="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground mb-1">公差配合速查 - ISO 286 / GB/T 1800.1 轴孔配合查询</h1>
          <p class="text-muted-foreground">选尺寸段与配合代号，即查孔轴上下偏差、公差带宽、配合性质与最大间隙 / 最大过盈，纯本地计算。</p>
        </div>
      </div>
      <p class="text-sm text-muted-foreground">数据依据 GB/T 1800.1（ISO 286）极限与偏差表，覆盖 ≤3~500 mm 十三个基本尺寸段与常用基孔制配合，适合机修、机加、五金图纸速查。</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center gap-2 mb-4">
          <Ruler class="w-4 h-4 text-primary" />
          <h2 class="text-base font-semibold text-foreground">查询条件</h2>
        </div>

        <div class="space-y-4">
          <div>
            <label for="fit-segment" class="block text-sm font-medium mb-1 text-foreground">基本尺寸段（mm）</label>
            <select
              id="fit-segment"
              v-model.number="segIdx"
              class="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option v-for="(seg, i) in COARSE_SEGMENTS" :key="seg.label" :value="i">{{ seg.label }} mm</option>
            </select>
          </div>

          <div>
            <label for="fit-nominal" class="block text-sm font-medium mb-1 text-foreground">名义尺寸 Φ（mm，同段内可精确到分档）</label>
            <input
              id="fit-nominal"
              v-model.number="nominal"
              type="number"
              min="0.1"
              max="500"
              step="0.1"
              class="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="如 30"
            >
            <p class="text-xs text-muted-foreground mt-1">默认取该段上限；切换尺寸段会自动带出。输入其他数值会自动匹配所在尺寸段。</p>
          </div>

          <div>
            <label for="fit-code" class="block text-sm font-medium mb-1 text-foreground">配合代号（基孔制）</label>
            <select
              id="fit-code"
              v-model="fitId"
              class="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <optgroup v-for="group in fitGroups" :key="group.label" :label="group.label">
                <option v-for="fit in group.fits" :key="fit.id" :value="fit.id">{{ fit.id }}　{{ fit.short }}</option>
              </optgroup>
            </select>
            <p class="text-xs text-muted-foreground mt-1">孔公差带位置固定（基孔制 H），轴用不同基本偏差获得间隙 / 过渡 / 过盈。</p>
          </div>

          <div v-if="selectedFit" class="p-3 rounded-lg bg-muted">
            <p class="text-xs font-medium text-foreground mb-1">{{ selectedFit.id }} 典型应用</p>
            <p class="text-xs text-muted-foreground leading-relaxed">{{ selectedFit.app }}</p>
          </div>
        </div>
      </div>

      <!-- 结果区 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-primary" />
            <h2 class="text-base font-semibold text-foreground">查询结果</h2>
          </div>
          <button
            v-if="results"
            @click="copyResults"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition"
          >
            <Copy v-if="!copied" class="w-3.5 h-3.5" />
            <Check v-else class="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            {{ copied ? '已复制' : '复制结果' }}
          </button>
        </div>

        <template v-if="results">
          <!-- 标题与性质 -->
          <div class="flex flex-wrap items-center gap-2 mb-4">
            <span class="text-lg font-bold text-foreground font-mono">Φ{{ results.nominal }} {{ results.fitId }}</span>
            <span :class="natureClass(results.nature)" class="px-2 py-0.5 rounded text-xs font-medium">{{ results.nature }}</span>
            <span class="text-xs text-muted-foreground">采用标准分段 Φ{{ results.fineLabel }} mm</span>
          </div>

          <!-- 孔 / 轴偏差 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div class="p-3 rounded-lg bg-muted/60">
              <p class="text-sm font-semibold text-foreground mb-2">孔 {{ results.holeLabel }}</p>
              <div class="space-y-1.5 text-xs">
                <div class="flex justify-between gap-2">
                  <span class="text-muted-foreground">上偏差 ES</span>
                  <span class="font-mono text-foreground text-right">{{ fmtUm(results.hole.ES) }}<span class="text-muted-foreground ml-1">（{{ fmtMm(results.hole.ES) }}）</span></span>
                </div>
                <div class="flex justify-between gap-2">
                  <span class="text-muted-foreground">下偏差 EI</span>
                  <span class="font-mono text-foreground text-right">{{ fmtUm(results.hole.EI) }}<span class="text-muted-foreground ml-1">（{{ fmtMm(results.hole.EI) }}）</span></span>
                </div>
                <div class="flex justify-between gap-2">
                  <span class="text-muted-foreground">公差带宽 T<sub>h</sub></span>
                  <span class="font-mono text-foreground">{{ results.Th }} μm（{{ fmtMm(results.Th) }}）</span>
                </div>
              </div>
            </div>
            <div class="p-3 rounded-lg bg-muted/60">
              <p class="text-sm font-semibold text-foreground mb-2">轴 {{ results.shaftLabel }}</p>
              <div class="space-y-1.5 text-xs">
                <div class="flex justify-between gap-2">
                  <span class="text-muted-foreground">上偏差 es</span>
                  <span class="font-mono text-foreground text-right">{{ fmtUm(results.shaft.es) }}<span class="text-muted-foreground ml-1">（{{ fmtMm(results.shaft.es) }}）</span></span>
                </div>
                <div class="flex justify-between gap-2">
                  <span class="text-muted-foreground">下偏差 ei</span>
                  <span class="font-mono text-foreground text-right">{{ fmtUm(results.shaft.ei) }}<span class="text-muted-foreground ml-1">（{{ fmtMm(results.shaft.ei) }}）</span></span>
                </div>
                <div class="flex justify-between gap-2">
                  <span class="text-muted-foreground">公差带宽 T<sub>s</sub></span>
                  <span class="font-mono text-foreground">{{ results.Ts }} μm（{{ fmtMm(results.Ts) }}）</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 配合指标 -->
          <div class="space-y-2 mb-3">
            <div class="flex justify-between items-center p-2.5 rounded-lg bg-primary/5">
              <span class="text-xs text-muted-foreground">{{ results.pair1.label }}</span>
              <span class="font-mono text-sm font-semibold text-primary">{{ fmtUmVal(results.pair1.value) }}（{{ fmtMm(results.pair1.value) }}）</span>
            </div>
            <div class="flex justify-between items-center p-2.5 rounded-lg bg-primary/5">
              <span class="text-xs text-muted-foreground">{{ results.pair2.label }}</span>
              <span class="font-mono text-sm font-semibold text-primary">{{ fmtUmVal(results.pair2.value) }}（{{ fmtMm(results.pair2.value) }}）</span>
            </div>
            <div class="flex justify-between items-center p-2.5 rounded-lg bg-muted">
              <span class="text-xs text-muted-foreground">{{ results.avg.label }}</span>
              <span class="font-mono text-sm font-medium text-foreground">{{ fmtUmVal(results.avg.value) }}（{{ fmtMm(results.avg.value) }}）</span>
            </div>
          </div>

          <!-- 极限尺寸 -->
          <div class="grid grid-cols-2 gap-2 text-xs mb-3">
            <div class="p-2.5 rounded-lg bg-muted/60">
              <p class="text-muted-foreground mb-0.5">孔极限尺寸</p>
              <p class="font-mono text-foreground">Φ{{ results.holeSizeMax }} ~ Φ{{ results.holeSizeMin }}</p>
            </div>
            <div class="p-2.5 rounded-lg bg-muted/60">
              <p class="text-muted-foreground mb-0.5">轴极限尺寸</p>
              <p class="font-mono text-foreground">Φ{{ results.shaftSizeMax }} ~ Φ{{ results.shaftSizeMin }}</p>
            </div>
          </div>

          <!-- 分档提示 -->
          <p v-if="results.splitHint" class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-foreground mb-3">
            <TriangleAlert class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-amber-500" />
            {{ results.splitHint }}
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">配合判定：最大间隙 X<sub>max</sub> = ES − ei；最大过盈 Y<sub>max</sub> = es − EI。X<sub>max</sub> ≥ 0 且 X<sub>min</sub> = EI − es ≥ 0 为间隙配合，X<sub>max</sub> ≤ 0 为过盈配合，其余为过渡配合。</p>
        </template>

        <div v-else class="p-8 text-center text-sm text-muted-foreground">
          请选择尺寸段并输入 0~500 mm 之间的有效名义尺寸
        </div>
      </div>
    </div>

    <!-- 公差带位置图 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <div class="flex items-center gap-2 mb-1">
        <BarChart3 class="w-4 h-4 text-primary" />
        <h2 class="text-base font-semibold text-foreground">公差带位置图</h2>
      </div>
      <p class="text-xs text-muted-foreground mb-4">零线为基本尺寸线，上正下负，单位 μm；孔 / 轴公差带按查询结果等比绘制。</p>
      <div v-if="svgView">
        <svg :viewBox="svgView.box" class="w-full" role="img" aria-label="孔轴公差带位置示意图">
          <defs>
            <pattern id="shaftHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="hsl(var(--muted-foreground))" stroke-width="1.2" />
            </pattern>
          </defs>
          <!-- 零线 -->
          <line :x1="svgView.zero.x1" :y1="svgView.zero.y" :x2="svgView.zero.x2" :y2="svgView.zero.y" stroke="hsl(var(--foreground))" stroke-width="1.5" />
          <text :x="svgView.zero.x1 - 6" :y="svgView.zero.y + 4" font-size="11" fill="hsl(var(--muted-foreground))" text-anchor="start">零线</text>
          <!-- 孔公差带 -->
          <rect
            :x="svgView.hole.x" :y="svgView.hole.top" :width="svgView.hole.w" :height="svgView.hole.h"
            fill="hsl(var(--primary))" fill-opacity="0.18" stroke="hsl(var(--primary))" stroke-width="1.5"
          />
          <text :x="svgView.hole.x + svgView.hole.w / 2" :y="svgView.hole.labelY" font-size="12" fill="hsl(var(--foreground))" text-anchor="middle" font-weight="600">孔 {{ svgView.hole.name }}</text>
          <text v-if="svgView.hole.topLabel" :x="svgView.hole.x + svgView.hole.w + 6" :y="svgView.hole.top + 4" font-size="11" fill="hsl(var(--muted-foreground))">{{ svgView.hole.topLabel }}</text>
          <text v-if="svgView.hole.bottomLabel" :x="svgView.hole.x + svgView.hole.w + 6" :y="svgView.hole.bottom + 4" font-size="11" fill="hsl(var(--muted-foreground))">{{ svgView.hole.bottomLabel }}</text>
          <!-- 轴公差带 -->
          <rect
            :x="svgView.shaft.x" :y="svgView.shaft.top" :width="svgView.shaft.w" :height="svgView.shaft.h"
            fill="url(#shaftHatch)" stroke="hsl(var(--foreground))" stroke-width="1"
          />
          <text :x="svgView.shaft.x + svgView.shaft.w / 2" :y="svgView.shaft.labelY" font-size="12" fill="hsl(var(--foreground))" text-anchor="middle" font-weight="600">轴 {{ svgView.shaft.name }}</text>
          <text v-if="svgView.shaft.topLabel" :x="svgView.shaft.x + svgView.shaft.w + 6" :y="svgView.shaft.top + 4" font-size="11" fill="hsl(var(--muted-foreground))">{{ svgView.shaft.topLabel }}</text>
          <text v-if="svgView.shaft.bottomLabel" :x="svgView.shaft.x + svgView.shaft.w + 6" :y="svgView.shaft.bottom + 4" font-size="11" fill="hsl(var(--muted-foreground))">{{ svgView.shaft.bottomLabel }}</text>
        </svg>
        <div class="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span class="inline-flex items-center gap-1.5"><span class="inline-block w-4 h-3 rounded-[2px] bg-primary/20 border border-primary"></span>孔公差带</span>
          <span class="inline-flex items-center gap-1.5"><span class="inline-block w-4 h-3 rounded-[2px] border border-muted-foreground/60 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,hsl(var(--muted-foreground))_2px,hsl(var(--muted-foreground))_3px)]"></span>轴公差带</span>
          <span class="inline-flex items-center gap-1.5"><span class="inline-block w-4 border-t-2 border-foreground"></span>零线（基本尺寸）</span>
        </div>
      </div>
      <div v-else class="p-8 text-center text-sm text-muted-foreground">输入有效条件后显示公差带图</div>
    </div>

    <!-- 常用基孔制配合速览 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <div class="flex items-center gap-2 mb-1">
        <ListChecks class="w-4 h-4 text-primary" />
        <h2 class="text-base font-semibold text-foreground">常用基孔制配合速览（点击行载入）</h2>
      </div>
      <p class="text-xs text-muted-foreground mb-4">配合性质按当前名义尺寸 Φ{{ nominalText }} mm 实时判定；同一代号在不同尺寸段的偏差不同，以查询结果为准。</p>
      <div class="overflow-x-auto">
        <div class="min-w-[640px]">
          <div class="grid grid-cols-[1.1fr_0.9fr_2.4fr] gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground border-b border-border">
            <span>配合代号</span><span>配合性质</span><span>典型应用</span>
          </div>
          <button
            v-for="row in fitTableRows"
            :key="row.id"
            @click="loadFit(row.id)"
            :class="[
              'w-full grid grid-cols-[1.1fr_0.9fr_2.4fr] gap-2 px-3 py-2.5 text-left text-xs border-b border-border/60 hover:bg-primary/5 transition items-center',
              fitId === row.id ? 'bg-primary/5' : ''
            ]"
          >
            <span class="font-mono font-semibold text-foreground">{{ row.id }}</span>
            <span :class="natureClass(row.nature)" class="justify-self-start px-2 py-0.5 rounded text-[11px] font-medium">{{ row.nature }}</span>
            <span class="text-muted-foreground leading-snug">{{ row.app }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="seoContentVisible ? '折叠内容' : '展开内容'"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <HelpCircle v-else class="w-5 h-5" />
      </button>

      <div v-show="seoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是公差配合速查
        </h2>
        <p class="text-muted-foreground mb-4">
          公差配合速查是一款面向机修、机加工与五金装配的在线轴孔配合查询工具。输入基本尺寸段与配合代号，即可得到孔、轴的上偏差与下偏差（μm 与 mm 双显）、公差带宽度、配合性质（间隙 / 过渡 / 过盈），以及最大间隙、最大过盈和平均性质，并附公差带位置示意图。全部数据依据 GB/T 1800.1《产品几何技术规范（GPS）线性尺寸公差ISO代号》等同采用的 ISO 286 极限与配合体系，查询在浏览器本地完成，不上传任何数据。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择图纸或实测对应的基本尺寸段（如 Φ30 属于 18~30 mm 段）；</li>
          <li>确认名义尺寸，默认取段上限，同段内可输入精确值以命中标准分档；</li>
          <li>选择配合代号，如 H7/g6、H7/k6、H7/s6 等常用基孔制配合；</li>
          <li>读取孔 / 轴上下偏差与配合指标，点击"复制结果"即可粘贴到检验单或工单。</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          看懂结果：偏差、公差带与配合判定
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>孔 H7</strong>：下偏差 EI = 0，上偏差 ES = +IT7，公差带在零线上方且随等级加宽；</li>
          <li><strong>轴 a~h</strong>：上偏差 es 为负的基本偏差，下偏差 ei = es − IT；</li>
          <li><strong>轴 j~zc</strong>：下偏差 ei 为正的基本偏差，上偏差 es = ei + IT；</li>
          <li><strong>最大间隙</strong>：X<sub>max</sub> = ES − ei，<strong>最大过盈</strong>：Y<sub>max</sub> = es − EI；</li>
          <li><strong>性质判定</strong>：X<sub>min</sub> = EI − es ≥ 0 为间隙配合；X<sub>max</sub> ≤ 0 为过盈配合；两者皆出现为过渡配合；</li>
          <li><strong>平均性质</strong>：(X<sub>max</sub> + X<sub>min</sub>) / 2，正值为平均间隙，负值为平均过盈，可粗判装配松紧趋势。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          基孔制优先配合怎么选
        </h2>
        <p class="text-muted-foreground mb-4">
          基孔制指孔公差带位置固定（H），通过选择轴的基本偏差实现不同松紧：需要转动或滑动选 a~h（间隙），定位可拆选 k、n（过渡），需要靠过盈传力选 p、s、u（过盈）。转速高、精度低选宽等级（H11/c11、H9/d9），精密滑动选 H7/g6，定位兼易装拆选 H7/h6 或 H7/k6，红套热装大扭矩选 H7/u6。具体到某一尺寸段时，请以上方查询结果与设计图纸为准。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4 mb-6">
          <div>
            <h3 class="text-lg font-semibold text-foreground">Φ30 H7/g6 是什么配合，间隙多大？</h3>
            <p class="text-muted-foreground mt-1">
              Φ30 属于 18~30 mm 段：孔 H7 为 +0.021~0 mm，轴 g6 为 −0.007~−0.020 mm，是间隙配合。
              最大间隙 = +0.021 − (−0.020) = 0.041 mm，最小间隙 = 0 − (−0.007) = 0.007 mm，属于间隙很小的精密滑动配合。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么同一个尺寸段内有的配合出现两档数值？</h3>
            <p class="text-muted-foreground mt-1">
              GB/T 1800.1 对部分轴的基本偏差（如 c、s、u）在常用尺寸段内还有细分档，例如 u 在 18~30 mm 段内以 24 mm 分界（18~24 为 +41，24~30 为 +48）。
              本工具按名义尺寸自动命中标准分档，结果卡片会显示"采用标准分段"，修改名义尺寸即可查看另一档数值。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">数据来源是什么？适用于哪些场景？</h3>
            <p class="text-muted-foreground mt-1">
              偏差与标准公差数值依据 GB/T 1800.1 / ISO 286（≤500 mm 常用段），配合应用说明参考 GB/T 1801 优先与常用配合。
              工具面向机修拆检、五金采购、机加自检等速查场景；正式设计与验收请以产品图纸、工艺文件和标准文本为准。
            </p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          相关工具
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground">
          <li><NuxtLink to="/tools/gear-module-calculator" class="text-primary hover:underline">齿轮模数计算器</NuxtLink>：模数齿数互算分度圆、齿顶圆与中心距；</li>
          <li><NuxtLink to="/tools/torque-unit-converter" class="text-primary hover:underline">扭矩单位换算器</NuxtLink>：N·m、kgf·m、lb-ft、lb-in 四单位互算；</li>
          <li><NuxtLink to="/tools/caliper-calculator" class="text-primary hover:underline">卡尺计算器</NuxtLink>：游标卡尺读数练习与换算；</li>
          <li><NuxtLink to="/tools/thread-reference-table" class="text-primary hover:underline">螺纹参考表</NuxtLink>：常用螺纹规格参数速查。</li>
        </ul>
      </div>
    </div>

    <!-- 相关推荐 -->
    <RelatedTools :current-tool-id="'tolerance-fit-lookup'" :category="'calculate'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Ruler, CheckCircle2, Copy, Check, TriangleAlert, BarChart3, ListChecks, ChevronUp, HelpCircle } from 'lucide-vue-next'
import { addRecentTool } from '~/composables/useTools'
import { resolveToolIcon } from '~/utils/toolIcons'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO配置
useSeoMeta({
  title: '公差配合速查 - ISO 286轴孔配合查询工具 | 有条工具',
  description: '免费在线公差配合速查工具，依据GB/T 1800.1（ISO 286）查询H7 g6等轴孔配合的上下偏差、公差带宽度、配合性质与最大间隙最大过盈，覆盖3~500mm常用尺寸段，纯本地计算。',
  keywords: '公差配合查询,公差配合速查,ISO 286,GB/T 1800,H7 g6 配合,轴孔公差偏差表,基孔制优先配合,公差带查询,tolerance fit calculator,上下偏差查询',
  author: '有条工具',
  ogTitle: '公差配合速查 - ISO 286轴孔配合查询工具',
  ogDescription: '选尺寸段与配合代号，即查孔轴上下偏差、公差带与配合性质，数据依据GB/T 1800.1（ISO 286），纯本地计算。',
  ogUrl: 'https://www.util.cn/tools/tolerance-fit-lookup',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '公差配合速查 - 轴孔配合查询',
  twitterDescription: 'ISO 286 / GB/T 1800.1 轴孔配合上下偏差、公差带与配合性质速查，纯本地计算。'
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
          name: '公差配合速查',
          url: 'https://www.util.cn/tools/tolerance-fit-lookup',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '13个基本尺寸段（≤3~500mm）偏差查询',
            '12种常用基孔制配合（H11/c11~H7/u6）',
            '孔轴上下偏差μm/mm双显',
            '配合性质自动判定（间隙/过渡/过盈）',
            '最大间隙、最大过盈与平均性质计算',
            '公差带位置示意图'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '公差配合速查', item: 'https://www.util.cn/tools/tolerance-fit-lookup/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Φ30 H7/g6 是什么配合，间隙多大？',
              acceptedAnswer: { '@type': 'Answer', text: 'Φ30属于18~30mm段：孔H7为+0.021~0mm，轴g6为−0.007~−0.020mm，是间隙配合。最大间隙0.041mm，最小间隙0.007mm，属于间隙很小的精密滑动配合。' }
            },
            {
              '@type': 'Question',
              name: '为什么同一个尺寸段内有的配合出现两档数值？',
              acceptedAnswer: { '@type': 'Answer', text: 'GB/T 1800.1对部分轴的基本偏差（如c、s、u）在常用尺寸段内还有细分档，例如u在18~30mm段内以24mm分界。本工具按名义尺寸自动命中标准分档并显示采用分段。' }
            },
            {
              '@type': 'Question',
              name: '数据来源是什么？适用于哪些场景？',
              acceptedAnswer: { '@type': 'Answer', text: '偏差与标准公差数值依据GB/T 1800.1 / ISO 286（≤500mm常用段），配合应用说明参考GB/T 1801优先与常用配合，适合机修、机加与五金速查；正式设计请以图纸和标准文本为准。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = { id: 'tolerance-fit-lookup' }

const trackToolUsage = () => { addRecentTool(tool.id) }
onMounted(() => { trackToolUsage() })

const toolIcon = resolveToolIcon('Ruler', 'calculate')

// ---------- 数据表（GB/T 1800.1 / ISO 286，μm） ----------
// 标准公差 IT6/IT7/IT9/IT11，按13个基本尺寸段（index 与 coarseSegments 对应）
const IT_TABLE: Record<number, number[]> = {
  6: [6, 8, 9, 11, 13, 16, 19, 22, 25, 29, 32, 36, 40],
  7: [10, 12, 15, 18, 21, 25, 30, 35, 40, 46, 52, 57, 63],
  8: [14, 18, 22, 27, 33, 39, 46, 54, 63, 72, 81, 89, 97],
  9: [25, 30, 36, 43, 52, 62, 74, 87, 100, 115, 130, 140, 155],
  11: [60, 75, 90, 110, 130, 160, 190, 220, 250, 290, 320, 360, 400]
}

// 基本尺寸段（mm），it 为对应标准公差段索引
const COARSE_SEGMENTS = [
  { min: 0, max: 3, label: '≤3', it: 0 },
  { min: 3, max: 6, label: '3~6', it: 1 },
  { min: 6, max: 10, label: '6~10', it: 2 },
  { min: 10, max: 18, label: '10~18', it: 3 },
  { min: 18, max: 30, label: '18~30', it: 4 },
  { min: 30, max: 50, label: '30~50', it: 5 },
  { min: 50, max: 80, label: '50~80', it: 6 },
  { min: 80, max: 120, label: '80~120', it: 7 },
  { min: 120, max: 180, label: '120~180', it: 8 },
  { min: 180, max: 250, label: '180~250', it: 9 },
  { min: 250, max: 315, label: '250~315', it: 10 },
  { min: 315, max: 400, label: '315~400', it: 11 },
  { min: 400, max: 500, label: '400~500', it: 12 }
]

// 细分档（mm，名义尺寸 n 满足 min < n ≤ max），it 为所属标准公差段索引
// 某些轴基本偏差（c、s、u 等）在常用段内以更细界限分档
const FINE_SEGMENTS = [
  { min: 0, max: 3, it: 0 },
  { min: 3, max: 6, it: 1 },
  { min: 6, max: 10, it: 2 },
  { min: 10, max: 18, it: 3 },
  { min: 18, max: 24, it: 4 },
  { min: 24, max: 30, it: 4 },
  { min: 30, max: 40, it: 5 },
  { min: 40, max: 50, it: 5 },
  { min: 50, max: 65, it: 6 },
  { min: 65, max: 80, it: 6 },
  { min: 80, max: 100, it: 7 },
  { min: 100, max: 120, it: 7 },
  { min: 120, max: 140, it: 8 },
  { min: 140, max: 160, it: 8 },
  { min: 160, max: 180, it: 8 },
  { min: 180, max: 200, it: 9 },
  { min: 200, max: 225, it: 9 },
  { min: 225, max: 250, it: 9 },
  { min: 250, max: 280, it: 10 },
  { min: 280, max: 315, it: 10 },
  { min: 315, max: 355, it: 11 },
  { min: 355, max: 400, it: 11 },
  { min: 400, max: 450, it: 12 },
  { min: 450, max: 500, it: 12 }
]

// 轴基本偏差（μm）。a~h 为上偏差 es；k~zc 为下偏差 ei
const SHAFT_DEV: Record<string, number[]> = {
  c: [-60, -70, -80, -95, -110, -110, -120, -130, -140, -150, -170, -180, -200, -210, -230, -240, -260, -280, -300, -330, -360, -400, -440, -480],
  d: [-20, -30, -40, -50, -65, -65, -80, -80, -100, -100, -120, -120, -145, -145, -145, -170, -170, -170, -190, -190, -210, -210, -230, -230],
  f: [-6, -10, -13, -16, -20, -20, -25, -25, -30, -30, -36, -36, -43, -43, -43, -50, -50, -50, -56, -56, -62, -62, -68, -68],
  g: [-2, -4, -5, -6, -7, -7, -9, -9, -10, -10, -12, -12, -14, -14, -14, -15, -15, -15, -17, -17, -18, -18, -20, -20],
  h: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  k: [0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5],
  n: [4, 8, 10, 12, 15, 15, 17, 17, 20, 20, 23, 23, 27, 27, 27, 31, 31, 31, 34, 34, 37, 37, 40, 40],
  p: [6, 12, 15, 18, 22, 22, 26, 26, 32, 32, 37, 37, 43, 43, 43, 50, 50, 50, 56, 56, 62, 62, 68, 68],
  s: [14, 19, 23, 28, 35, 35, 43, 43, 53, 59, 71, 79, 92, 100, 108, 122, 130, 140, 158, 170, 190, 208, 232, 252],
  u: [18, 23, 28, 33, 41, 48, 60, 70, 87, 102, 124, 144, 170, 190, 210, 236, 258, 284, 315, 350, 390, 435, 490, 540]
}

const BELOW_H_LETTERS = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])

// 常用基孔制配合（典型应用一句话）
const FITS = [
  { id: 'H11/c11', hGrade: 11, sLetter: 'c', sGrade: 11, group: '间隙配合', short: '很松转动', app: '很大间隙的松转动，适合粗糙机械、多尘或外露工况（农机、绞车、滑轮空转支承）。' },
  { id: 'H9/d9', hGrade: 9, sLetter: 'd', sGrade: 9, group: '间隙配合', short: '松转低速', app: '大间隙低速转动或自由旋转件，如滑轮与轴、传动轴穿过填料函的自由段。' },
  { id: 'H8/f7', hGrade: 8, sLetter: 'f', sGrade: 7, group: '间隙配合', short: '通用转动', app: '中速中载的通用转动配合，最常用的滑动轴承配合（泵轴、齿轮箱轴颈）。' },
  { id: 'H7/g6', hGrade: 7, sLetter: 'g', sGrade: 6, group: '间隙配合', short: '精密滑动', app: '间隙很小的精密滑动配合，移动平稳、定位准确（滑阀、精密导套、分度主轴）。' },
  { id: 'H7/h6', hGrade: 7, sLetter: 'h', sGrade: 6, group: '间隙配合', short: '定位易拆', app: '最小间隙为零的定位间隙配合，装拆方便，常配键销传扭（轴套、联轴器、定位面）。' },
  { id: 'H7/k6', hGrade: 7, sLetter: 'k', sGrade: 6, group: '过渡配合', short: '定位可拆', app: '平均过盈近零的过渡定位配合，定位准且可拆卸（滚动轴承内圈、键连接齿轮定位）。' },
  { id: 'H7/n6', hGrade: 7, sLetter: 'n', sGrade: 6, group: '过渡配合', short: '紧过渡', app: '平均有过盈的较紧过渡配合，定位精度高、很少拆卸（蜗轮轮缘、衬套压入定位）。' },
  { id: 'H7/n7', hGrade: 7, sLetter: 'n', sGrade: 7, group: '过渡配合', short: '过渡·宽轴公差', app: '过渡配合（轴公差比 H7/n6 宽一档），定位用，装拆力较大，用于一般机械定位。' },
  { id: 'H7/p6', hGrade: 7, sLetter: 'p', sGrade: 6, group: '过盈配合', short: '轻压定位', app: '最松状态仍有微小过盈的轻压配合，压入后一般不拆卸（绳轮、齿圈定位压入）。' },
  { id: 'H7/p7', hGrade: 7, sLetter: 'p', sGrade: 7, group: '过盈配合', short: '过盈·宽轴公差', app: '过盈配合（轴公差比 H7/p6 宽一档），压入装配，承受轻载或另配辅助紧固。' },
  { id: 'H7/s6', hGrade: 7, sLetter: 's', sGrade: 6, group: '过盈配合', short: '中压传扭', app: '中等压入过盈配合，靠过盈传递中等载荷（联轴器、齿圈红套、泵体衬套）。' },
  { id: 'H7/u6', hGrade: 7, sLetter: 'u', sGrade: 6, group: '过盈配合', short: '热套重载', app: '重压入或热套的大过盈配合，靠过盈传递大扭矩（火车轮箍、大型联轴器热装）。' }
]

const FIT_MAP: Record<string, (typeof FITS)[number]> = Object.fromEntries(FITS.map(f => [f.id, f]))

const fitGroups = computed(() => ['间隙配合', '过渡配合', '过盈配合'].map(label => ({
  label,
  fits: FITS.filter(f => f.group === label)
})))

// ---------- 纯计算（可独立单测） ----------
interface FitResult {
  fitId: string
  holeLabel: string
  shaftLabel: string
  nominal: number
  fineLabel: string
  hole: { ES: number, EI: number }
  shaft: { es: number, ei: number }
  Th: number
  Ts: number
  nature: string
  pair1: { label: string, value: number }
  pair2: { label: string, value: number }
  avg: { label: string, value: number }
  holeSizeMax: string
  holeSizeMin: string
  shaftSizeMax: string
  shaftSizeMin: string
  splitHint: string
}

function findFineIndex(n: number): number {
  return FINE_SEGMENTS.findIndex(f => n > f.min && n <= f.max)
}

function fineLabelOf(f: { min: number, max: number }): string {
  return f.min === 0 ? `≤${f.max}` : `${f.min}~${f.max}`
}

// 计算某一配合在某名义尺寸下的完整结果；入参不合法返回 null
function computeFit(fit: { id: string, hGrade: number, sLetter: string, sGrade: number } | undefined, nominalValue: unknown): FitResult | null {
  const n = Number(nominalValue)
  if (!fit || !Number.isFinite(n) || n <= 0 || n > 500) return null
  const coarseIdx = COARSE_SEGMENTS.findIndex(s => n > s.min && n <= s.max)
  if (coarseIdx < 0) return null
  const fi = findFineIndex(n)
  if (fi < 0) return null
  const fine = FINE_SEGMENTS[fi]
  const itIdx = fine.it

  const holeITRow = IT_TABLE[fit.hGrade]
  const itShaftRow = IT_TABLE[fit.sGrade]
  if (!holeITRow || !itShaftRow || holeITRow[itIdx] === undefined) return null
  const holeIT = holeITRow[itIdx]
  const holeEI = 0
  const holeES = holeIT

  const fd = SHAFT_DEV[fit.sLetter][fi]
  const itShaft = itShaftRow[itIdx]
  const belowH = BELOW_H_LETTERS.has(fit.sLetter)
  const sEs = belowH ? fd : fd + itShaft
  const sEi = belowH ? fd - itShaft : fd

  const Th = holeES - holeEI
  const Ts = sEs - sEi
  const xmax = holeES - sEi // ≥0：间隙；<0：其相反数为最小过盈
  const xmin = holeEI - sEs // ≥0：间隙；<0：其相反数为最大过盈

  let nature: string
  if (xmin >= 0) nature = '间隙配合'
  else if (xmax <= 0) nature = '过盈配合'
  else nature = '过渡配合'
  const avg = (xmax + xmin) / 2

  // 同一常用段内该轴基本偏差是否分档
  const coarse = COARSE_SEGMENTS[coarseIdx]
  const subRows = FINE_SEGMENTS
    .map((f, i) => ({ f, fd: SHAFT_DEV[fit.sLetter][i] }))
    .filter(x => x.f.it === coarse.it)
  const distinctFds = Array.from(new Set(subRows.map(x => x.fd)))
  let splitHint = ''
  if (distinctFds.length > 1) {
    const detail = subRows.map(x => `Φ${fineLabelOf(x.f)} 为 ${x.fd > 0 ? '+' : ''}${x.fd}`).join('，')
    splitHint = `${fit.sLetter.toUpperCase()} 的基本偏差在 ${coarse.label} mm 段内分档：${detail} μm；当前按名义尺寸 Φ${trimNum(n)} 采用 ${fd > 0 ? '+' : ''}${fd} μm 一档。`
  }

  return {
    fitId: fit.id,
    holeLabel: `H${fit.hGrade}`,
    shaftLabel: `${fit.sLetter}${fit.sGrade}`,
    nominal: n,
    fineLabel: fineLabelOf(fine),
    hole: { ES: holeES, EI: holeEI },
    shaft: { es: sEs, ei: sEi },
    Th,
    Ts,
    nature,
    pair1: xmax >= 0 ? { label: '最大间隙 Xmax = ES − ei', value: xmax } : { label: '最小过盈', value: -xmax },
    pair2: xmin >= 0 ? { label: '最小间隙 Xmin = EI − es', value: xmin } : { label: '最大过盈 Ymax = es − EI', value: -xmin },
    avg: avg >= 0 ? { label: '平均间隙（松紧趋势）', value: avg } : { label: '平均过盈（松紧趋势）', value: -avg },
    holeSizeMax: trimNum(n + holeES / 1000),
    holeSizeMin: trimNum(n + holeEI / 1000),
    shaftSizeMax: trimNum(n + sEs / 1000),
    shaftSizeMin: trimNum(n + sEi / 1000),
    splitHint
  }
}

function trimNum(x: number): string {
  const fixed = (Math.round(x * 1000) / 1000).toFixed(3)
  return fixed.replace(/\.?0+$/, '')
}

// ---------- 状态 ----------
const segIdx = ref(4) // 默认 18~30，便于直接看到 Φ30 锚点示例
const nominal = ref<number | null>(30)
const fitId = ref('H7/g6')
const seoContentVisible = ref(true)
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const selectedFit = computed(() => FIT_MAP[fitId.value])
const results = computed(() => computeFit(selectedFit.value, nominal.value))
const nominalText = computed(() => {
  const n = Number(nominal.value)
  return Number.isFinite(n) && n > 0 ? trimNum(n) : '—'
})

// 切换尺寸段时，名义尺寸自动取段上限（如 18~30 → 30）；
// 若由名义尺寸输入触发的段切换（当前值已在新段内），则保留用户输入
watch(segIdx, (idx) => {
  const seg = COARSE_SEGMENTS[idx]
  if (!seg) return
  const n = Number(nominal.value)
  if (!(Number.isFinite(n) && n > seg.min && n <= seg.max)) {
    nominal.value = seg.max
  }
})

// 名义尺寸变化时自动匹配所在尺寸段
watch(nominal, (v) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return
  const idx = COARSE_SEGMENTS.findIndex(s => n > s.min && n <= s.max)
  if (idx >= 0 && idx !== segIdx.value) segIdx.value = idx
})

const natureClass = (nature: string) => {
  if (nature === '间隙配合') return 'bg-primary/10 text-primary'
  if (nature === '过盈配合') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
  return 'bg-muted text-foreground'
}

// ---------- 公差带 SVG ----------
const svgView = computed(() => {
  const r = results.value
  if (!r) return null
  const W = 640, H = 230, zeroY = 110
  const span = 75
  const devs = [r.hole.ES, r.hole.EI, r.shaft.es, r.shaft.ei]
  const maxPos = Math.max(1, ...devs.filter(v => v > 0))
  const maxNeg = Math.max(1, ...devs.filter(v => v < 0).map(v => -v))
  const s = Math.min(span / maxPos, span / maxNeg)
  const y = (d: number) => zeroY - d * s

  const holeW = 170
  const shaftW = 170
  const holeX = 120
  const shaftX = 400

  const band = (x: number, w: number, top: number, bottom: number, name: string, topLabel: string, bottomLabel: string) => {
    const bandH = Math.max(2, bottom - top)
    return {
      x, w,
      top,
      bottom,
      h: bandH,
      name,
      labelY: Math.max(14, top - 8),
      topLabel: bandH >= 16 ? topLabel : '',
      bottomLabel: bandH >= 16 ? bottomLabel : ''
    }
  }

  return {
    box: `0 0 ${W} ${H}`,
    zero: { x1: 70, x2: 596, y: zeroY },
    hole: band(holeX, holeW, y(r.hole.ES), y(r.hole.EI), r.holeLabel, fmtUm(r.hole.ES), fmtUm(r.hole.EI)),
    shaft: band(shaftX, shaftW, y(r.shaft.es), y(r.shaft.ei), r.shaftLabel, fmtUm(r.shaft.es), fmtUm(r.shaft.ei))
  }
})

// ---------- 速览表 ----------
const fitTableRows = computed(() => FITS.map(f => {
  const r = computeFit(f, nominal.value)
  return { id: f.id, app: f.app, nature: r ? r.nature : '—' }
}))

function loadFit(id: string) {
  fitId.value = id
  trackToolUsage()
}

// ---------- 复制 ----------
const copyResults = async () => {
  const r = results.value
  if (!r) return
  trackToolUsage()
  const lines = [
    `Φ${trimNum(r.nominal)} ${r.fitId}（GB/T 1800.1 / ISO 286）`,
    `孔 ${r.holeLabel}：ES ${fmtUm(r.hole.ES)}（${fmtMm(r.hole.ES)}），EI ${fmtUm(r.hole.EI)}（${fmtMm(r.hole.EI)}），公差带 ${r.Th} μm`,
    `轴 ${r.shaftLabel}：es ${fmtUm(r.shaft.es)}（${fmtMm(r.shaft.es)}），ei ${fmtUm(r.shaft.ei)}（${fmtMm(r.shaft.ei)}），公差带 ${r.Ts} μm`,
    `配合性质：${r.nature}`,
    `${r.pair1.label}：${fmtUmVal(r.pair1.value)}（${fmtMm(r.pair1.value)}）`,
    `${r.pair2.label}：${fmtUmVal(r.pair2.value)}（${fmtMm(r.pair2.value)}）`,
    `${r.avg.label}：${fmtUmVal(r.avg.value)}（${fmtMm(r.avg.value)}）`,
    `孔极限尺寸 Φ${r.holeSizeMax}~Φ${r.holeSizeMin}；轴极限尺寸 Φ${r.shaftSizeMax}~Φ${r.shaftSizeMin}`
  ]
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    copied.value = true
    if (copyTimer !== null) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
    copied.value = false
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 格式化 ----------
function fmtUm(v: number): string {
  if (v === 0) return '0 μm'
  return `${v > 0 ? '+' : ''}${v} μm`
}

function fmtMm(v: number): string {
  const mm = v / 1000
  if (mm === 0) return '0.000 mm'
  return `${mm > 0 ? '+' : ''}${mm.toFixed(3)} mm`
}

function fmtUmVal(v: number): string {
  const rounded = Math.round(v * 10) / 10
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} μm`
}
</script>
