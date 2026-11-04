<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Disc class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">轮胎尺寸对比计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">输入原胎与新胎规格（如 225/45R17），对比外径差、时速表与里程表偏差，并给出同直径替代尺寸清单</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线轮胎规格对比工具：解析 225/45R17 子午线胎与 750-20 轻卡斜交胎格式，按几何公式计算外径、周长与胎壁高度；
        改装换胎、二手验车、网购配件前，先算清新旧轮胎直径差——判断时速表是虚快还是放慢、轮拱会不会蹭胎，
        并在常用宽度与扁平比组合里筛出直径差 ≤1.5% 的同直径替代清单。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <p class="flex items-start gap-2 text-xs leading-relaxed bg-muted/60 border border-border rounded-lg px-3 py-2.5 mb-6 text-foreground">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>换算为几何理论值（胎壁受载压缩约 3% 未计）；改胎请同时核对：时速表误差、轮拱干涉、ET 偏距与载重指数，年检按同规格恢复。</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Disc class="w-5 h-5 mr-2 text-primary" /> 规格输入
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">原车轮胎（当前规格）</label>
          <input
            v-model="origInput"
            type="text"
            placeholder="例如 205/55R16 或 225/45R17 91V"
            class="w-full px-3 py-2 rounded-lg border border-border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p v-if="origError" class="text-xs text-red-500 mt-1.5 leading-relaxed">
            无法解析：请用「断面宽/扁平比R轮辋」格式，如 225/45R17；轻卡斜交胎可写 750-20
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">新轮胎（拟换规格）</label>
          <input
            v-model="newInput"
            type="text"
            placeholder="例如 225/45R17"
            class="w-full px-3 py-2 rounded-lg border border-border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p v-if="newError" class="text-xs text-red-500 mt-1.5 leading-relaxed">
            无法解析：请用「断面宽/扁平比R轮辋」格式，如 225/45R17；轻卡斜交胎可写 750-20
          </p>
        </div>

        <div class="flex gap-2">
          <button
            @click="swapTires"
            class="flex-1 px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <ArrowLeftRight class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 互换
          </button>
          <button
            @click="resetInputs"
            class="flex-1 px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置
          </button>
        </div>

        <div>
          <p class="text-sm font-medium text-foreground mb-2">快速预设</p>
          <div class="space-y-2">
            <button
              v-for="preset in presets"
              :key="preset.name"
              @click="applyPreset(preset)"
              class="w-full text-left px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/50 transition"
            >
              <span class="text-sm font-medium text-foreground">
                <Play class="w-3.5 h-3.5 inline mr-1.5 text-primary -mt-0.5" />{{ preset.name }}
              </span>
              <span class="block text-xs text-muted-foreground font-mono mt-0.5">{{ preset.orig }} → {{ preset.new }}</span>
            </button>
          </div>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          时速表原理一句话：轮速传感器测的是车轮每分钟转数，行车电脑按出厂胎周长换算成车速——
          换胎改变了周长，换算基准就变了，表显与真实车速出现固定比例偏差。
        </p>
      </div>

      <!-- 对比结果 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Gauge class="w-5 h-5 mr-2 text-primary" /> 对比结果
        </h2>

        <p v-if="!cmp" class="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
          请在上侧输入两个可解析的轮胎规格（默认已预填 205/55R16 → 225/45R17），这里将实时给出直径差、时速表偏差与安全判定。
        </p>

        <template v-if="cmp">
          <!-- 判定徽章 -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold" :class="badgeMeta[cmp.level].cls">
              <CheckCircle v-if="cmp.level === 'safe'" class="w-4 h-4" />
              <TriangleAlert v-else class="w-4 h-4" />
              {{ badgeMeta[cmp.level].label }}
            </span>
            <span class="text-xs text-muted-foreground">{{ badgeMeta[cmp.level].desc }}</span>
          </div>

          <!-- 核心数值 -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">外径差</p>
              <p class="text-lg font-bold text-foreground font-mono">{{ cmp.dDiffSigned }} mm</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">外径差 %</p>
              <p class="text-lg font-bold font-mono" :class="cmp.level === 'safe' ? 'text-green-600' : cmp.level === 'edge' ? 'text-yellow-600' : 'text-red-600'">
                {{ cmp.dPctSigned }}%
              </p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">周长差</p>
              <p class="text-lg font-bold text-foreground font-mono">{{ cmp.cDiffSigned }} mm</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">新胎外径</p>
              <p class="text-lg font-bold text-foreground font-mono">{{ fmt1(cmp.newGeo.diameterMm) }} mm</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- 时速表偏差表 -->
            <div>
              <p class="text-sm font-medium text-foreground mb-2">时速表偏差（表显 → 真实车速）</p>
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-[10px] text-muted-foreground border-b border-border">
                    <th class="text-left py-1.5 font-medium">表显 km/h</th>
                    <th class="text-right py-1.5 font-medium">真实 km/h</th>
                    <th class="text-right py-1.5 font-medium">偏差</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in cmp.speedRows" :key="row.shown" class="border-b border-border/50">
                    <td class="py-1.5 font-mono text-foreground">{{ row.shown }}</td>
                    <td class="py-1.5 text-right font-mono font-semibold" :class="cmp.level === 'safe' ? 'text-green-600' : cmp.level === 'edge' ? 'text-yellow-600' : 'text-red-600'">
                      {{ fmt1(row.actual) }}
                    </td>
                    <td class="py-1.5 text-right font-mono text-muted-foreground">{{ row.actual > row.shown ? '+' : '' }}{{ fmt1(row.actual - row.shown) }}</td>
                  </tr>
                </tbody>
              </table>
              <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
                新胎更大则真实车速快于表显（表「显示慢」，易无意识超速）；新胎更小则表显虚快（易被拍超速）。
              </p>
            </div>

            <!-- 里程表偏差 + 宽度/扁平比注记 -->
            <div class="space-y-3">
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">里程表偏差</p>
                <p class="text-sm font-semibold text-foreground font-mono">
                  表显 10000 km → 实际约 {{ cmp.odoActualText }} km（{{ cmp.odoDiffSigned }} km）
                </p>
                <p class="text-xs text-muted-foreground mt-1 leading-relaxed">方向与时速表同源：周长变了，每一转计入的里程就按同一比例失真。</p>
              </div>

              <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5" :class="cmp.widthRisk.cls">
                <CheckCircle v-if="cmp.widthRisk.level === 'ok'" class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                <TriangleAlert v-else class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{{ cmp.widthRisk.text }}</span>
              </p>

              <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
                <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <span>{{ cmp.aspectNote }}</span>
              </p>
            </div>
          </div>

          <!-- SVG 双圆同心对比 -->
          <div class="bg-muted/30 rounded-lg p-4">
            <p class="text-sm font-medium text-foreground mb-1 text-center">外径同心对比（轮辋为虚线圈）</p>
            <svg
              v-if="svgSpec"
              :width="svgSpec.size"
              :height="svgSpec.size"
              :viewBox="'0 0 ' + svgSpec.size + ' ' + svgSpec.size"
              class="block mx-auto"
              role="img"
              aria-label="原胎与新胎外径同心对比图"
            >
              <circle
                v-for="(ring, i) in svgSpec.rings"
                :key="'ring-' + i"
                :cx="svgSpec.cx"
                :cy="svgSpec.cy"
                :r="ring.r"
                :fill="ring.fill"
                :stroke="ring.stroke"
                stroke-width="2"
                :stroke-dasharray="ring.dash"
              />
              <text
                v-for="(label, i) in svgSpec.labels"
                :key="'label-' + i"
                :x="label.x"
                :y="label.y"
                :fill="label.color"
                font-size="11"
                text-anchor="middle"
              >{{ label.text }}</text>
            </svg>
            <div class="flex justify-center gap-4 text-xs text-muted-foreground mt-1">
              <span class="flex items-center gap-1"><i class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: #2563eb"></i>原胎外径</span>
              <span class="flex items-center gap-1"><i class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: #f59e0b"></i>新胎外径</span>
              <span class="flex items-center gap-1"><i class="w-2.5 h-2 rounded-sm inline-block" style="background-color: #94a3b8"></i>轮辋</span>
            </div>
          </div>
        </template>
      </div>

      <!-- 单胎信息卡：原胎 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-3">
        <h2 class="text-base font-semibold flex items-center">
          <Disc class="w-4 h-4 mr-2 text-primary" /> {{ origCard ? origCard.title : '原胎信息' }}
        </h2>
        <p v-if="!origCard" class="text-xs text-muted-foreground">规格解析成功后显示直径 / 周长 / 胎壁直观数据。</p>
        <div v-else class="space-y-2 text-sm">
          <div class="flex justify-between py-1 border-b border-border/50"><span class="text-muted-foreground">外径</span><span class="font-mono font-semibold text-foreground">{{ fmt1(origCard.geo.diameterMm) }} mm（{{ fmt1(origCard.geo.diameterMm / 10) }} cm）</span></div>
          <div class="flex justify-between py-1 border-b border-border/50"><span class="text-muted-foreground">滚圆周长</span><span class="font-mono font-semibold text-foreground">{{ fmt1(origCard.geo.circumferenceMm) }} mm（{{ fmt2(origCard.geo.circumferenceMm / 1000) }} m）</span></div>
          <div class="flex justify-between py-1"><span class="text-muted-foreground">单侧胎壁高</span><span class="font-mono font-semibold text-foreground">{{ fmt1(origCard.geo.sidewallMm) }} mm（{{ fmt1(origCard.geo.sidewallMm / 10) }} cm）</span></div>
          <p class="text-xs leading-relaxed p-2 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>{{ origCard.hint }}</span>
          </p>
          <p v-if="origCard.biasNote" class="text-xs text-yellow-600 leading-relaxed">{{ origCard.biasNote }}</p>
        </div>
      </div>

      <!-- 单胎信息卡：新胎 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-3">
        <h2 class="text-base font-semibold flex items-center">
          <Disc class="w-4 h-4 mr-2 text-primary" /> {{ newCard ? newCard.title : '新胎信息' }}
        </h2>
        <p v-if="!newCard" class="text-xs text-muted-foreground">规格解析成功后显示直径 / 周长 / 胎壁直观数据。</p>
        <div v-else class="space-y-2 text-sm">
          <div class="flex justify-between py-1 border-b border-border/50"><span class="text-muted-foreground">外径</span><span class="font-mono font-semibold text-foreground">{{ fmt1(newCard.geo.diameterMm) }} mm（{{ fmt1(newCard.geo.diameterMm / 10) }} cm）</span></div>
          <div class="flex justify-between py-1 border-b border-border/50"><span class="text-muted-foreground">滚圆周长</span><span class="font-mono font-semibold text-foreground">{{ fmt1(newCard.geo.circumferenceMm) }} mm（{{ fmt2(newCard.geo.circumferenceMm / 1000) }} m）</span></div>
          <div class="flex justify-between py-1"><span class="text-muted-foreground">单侧胎壁高</span><span class="font-mono font-semibold text-foreground">{{ fmt1(newCard.geo.sidewallMm) }} mm（{{ fmt1(newCard.geo.sidewallMm / 10) }} cm）</span></div>
          <p class="text-xs leading-relaxed p-2 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>{{ newCard.hint }}</span>
          </p>
          <p v-if="newCard.biasNote" class="text-xs text-yellow-600 leading-relaxed">{{ newCard.biasNote }}</p>
        </div>
      </div>

      <!-- 同直径替代推荐 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-3">
        <h2 class="text-base font-semibold flex items-center">
          <CheckCircle class="w-4 h-4 mr-2 text-green-600" /> 同直径替代清单
        </h2>
        <p class="text-xs text-muted-foreground leading-relaxed">
          以「原胎」为基准，在常用宽度（195-255）× 扁平比（40-70）× 轮辋 ±1 英寸的组合里，筛选外径差 ≤1.5% 的替代规格（最多 8 条，标注常见在售）。
        </p>
        <p v-if="!altList.length" class="text-xs text-muted-foreground">原胎规格解析成功后自动生成清单。</p>
        <div v-else class="space-y-1.5">
          <div
            v-for="alt in altList"
            :key="alt.label"
            class="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border border-border text-sm"
          >
            <span class="font-mono font-semibold text-foreground">{{ alt.label }}</span>
            <span class="flex items-center gap-2">
              <span v-if="alt.common" class="px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 text-[10px] font-medium">常见在售</span>
              <span class="font-mono text-xs text-muted-foreground">{{ alt.pctSigned }}%</span>
            </span>
          </div>
        </div>
        <p class="text-[11px] text-muted-foreground leading-relaxed">
          「常见在售」按国内乘用车主流规格常识标注，实际购买仍以品牌型号库存为准；换不同轮辋直径的替代规格需连带换毂，注意 ET 偏距与卡钳让位。
        </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>轮胎尺寸对比计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是一台面向汽车改装、二手车交易与配件网购场景的在线轮胎规格换算工具。输入原车胎与拟换胎两组规格（如 205/55R16 与 225/45R17，
          也兼容 750-20 这类轻卡斜交写法），工具按几何公式还原外径、周长与胎壁高度，输出直径差毫米数与百分比、时速表与里程表的偏差方向、
          轮拱干涉风险提示，并列出外径差在 1.5% 以内的同直径替代规格清单，帮助你在下单或上车前把「能不能换、换了表会差多少」一次算清楚。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">轮胎规格上的数字都什么意思？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">以 225/45R17 91V 为例逐段拆解：</p>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li><b class="text-foreground">225</b>：胎面断面宽度，单位毫米。同级别每 +10mm，外径会同步变大，还需确认轮拱与轮辋 J 值是否容得下。</li>
          <li><b class="text-foreground">45</b>：扁平比，胎壁高度 = 断面宽 × 45% = 101.25mm。数字越小胎壁越薄。</li>
          <li><b class="text-foreground">R</b>：子午线结构（Radial）；若写「-」如 750-20 则是斜交胎，多为轻卡/老车口径。</li>
          <li><b class="text-foreground">17</b>：轮辋直径，单位英寸（17 × 25.4 = 431.8mm）。</li>
          <li><b class="text-foreground">91</b>：载重指数，91 = 单胎最大载重 615kg，改胎不得低于原厂指数。</li>
          <li><b class="text-foreground">V</b>：速度级别，V = 最高 240km/h；常见 H=210、W=270。</li>
        </ul>
        <p class="text-sm text-muted-foreground leading-relaxed mt-2">
          外径 = 轮辋英寸 × 25.4 + 2 × 胎壁高。所以 225/45R17 外径 = 431.8 + 2 × 101.25 = 634.3mm。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么改胎要看直径而不是宽度？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          时速表、里程表、ABS/ESP 轮速逻辑全部建立在「车轮每转前进一个周长」的假设上，周长由外径决定，与宽度没有直接关系。
          只加宽不改扁平比（如 205 换 225/55），外径多出近 20mm，表速误差立现；而 205/55R16 换 225/45R17 宽度加了 20mm，外径只差 2.4mm（约 0.4%），
          这就是改装圈「加宽降级、外径守恒」的由来。宽度另管的是接地面、轮拱让位与轮毂 J 值匹配，需与直径分开核对。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">时速表误差多少能接受？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          诚实说，国内对改装胎的表速误差没有强制公开标准，行业普遍经验口径是：外径差 ±2% 以内为常见安全区（多数车型原厂时速表本身就有 0-4% 的偏保守余量，可被吸收）；
          2%-3% 属于临界，建议实路用 GPS 复核；超过 ±3% 误差明显，不仅超速风险与保养里程失真，还影响 ESP 触发逻辑，建议回到原规格。
          本工具按这三档给出绿/黄/红判定，并列出 40/60/100/120 km/h 表显对应的真实车速。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">扁平比与舒适、操控怎么取舍？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          同外径下降扁平比（配更大的轮毂）意味着胎壁更薄：侧向形变小、过弯路感更直接、外观更饱满；代价是滤震变差、坑洼与路缘石更容易伤胎鼓包，
          胎壁 10cm 以下过减速带建议明显减速。反之 60-70 的厚胎壁舒适、耐坑，但快速变向时胎壁「扭」得多，指向感变肉。家用轿车 50-60、运动取向 35-45、SUV/越野 55-75 是常见档位。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">里程表偏差往哪边偏？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          新胎外径偏大时，每转覆盖的真实距离变大，而仪表仍按出厂周长计数，所以「实际跑了 10000 公里，表显只有约 9660」——里程虚低，二手车表显里程比真实里程少，保养提醒也会延迟；
          新胎偏小时相反，表显里程虚高。买二手车主看过改胎记录时，可按本工具偏差比例反推真实里程。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">轮胎改多大直径以内算安全？</h3>
            <p class="text-sm text-muted-foreground mt-1">经验口径：外径差 ±2% 以内为常见安全区，2%-3% 临界需实测复核，超过 ±3% 时速表误差明显，同时轮拱干涉、ET 偏距与载重指数风险上升，建议回原规格。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">225/45R17 和 205/55R16 直径差多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">205/55R16 外径 631.9mm，225/45R17 外径 634.3mm，差 +2.4mm、约 +0.4%，表显 100km/h 时真实约 100.4km/h，属于典型的加宽降级安全改法（另需核对轮拱与轮毂参数）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">750-20 这种写法也能算吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">可以。这是轻卡斜交胎口径，750 表示断面宽 7.50 英寸、20 为轮辋英寸。斜交胎胎壁按断面宽约 87% 近似折算，结果比子午胎公式误差大，仅供对比参考，精确值以厂家滚测为准。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'tire-size-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Disc, Gauge, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, ArrowLeftRight
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '轮胎尺寸对比计算器 - 轮胎规格换算/时速表误差在线工具',
  description: '免费在线轮胎尺寸对比计算器：解析 225/45R17、750-20 等规格，算外径周长胎壁，对比新旧轮胎直径差与时速表/里程表偏差，±2%安全区判定，同直径替代规格推荐，改装验车配件网购必备，纯浏览器本地计算不上传。',
  keywords: '轮胎尺寸换算,轮胎规格对比,时速表误差,225/45r17,轮胎直径计算,轮胎外径对比,同直径替代轮胎,改胎计算',
  author: '有条工具',
  ogTitle: '轮胎尺寸对比计算器 - 轮胎规格换算/时速表误差在线工具 | 有条工具',
  ogDescription: '输入原胎与新胎规格，秒算外径差、时速表与里程表偏差、轮拱风险与同直径替代清单。',
  ogUrl: 'https://www.util.cn/tools/tire-size-calculator',
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
          name: '轮胎尺寸对比计算器',
          url: 'https://www.util.cn/tools/tire-size-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['225/45R17 与 750-20 规格解析', '外径/周长/胎壁几何计算', '新旧轮胎直径差与时速表偏差', '里程表偏差方向', '轮拱干涉与扁平比风险提示', '同直径替代规格清单', 'SVG 同心对比图', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '轮胎尺寸对比计算器', item: 'https://www.util.cn/tools/tire-size-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '轮胎改多大直径以内算安全？',
              acceptedAnswer: { '@type': 'Answer', text: '经验口径：外径差±2%以内为常见安全区，2%-3%临界需实测复核，超过±3%时速表误差明显，同时轮拱干涉、ET偏距与载重指数风险上升，建议回原规格。' }
            },
            {
              '@type': 'Question',
              name: '225/45R17和205/55R16直径差多少？',
              acceptedAnswer: { '@type': 'Answer', text: '205/55R16外径631.9mm，225/45R17外径634.3mm，差+2.4mm约+0.4%，表显100km/h时真实约100.4km/h，属于典型的加宽降级安全改法，另需核对轮拱与轮毂参数。' }
            },
            {
              '@type': 'Question',
              name: '750-20这种写法也能算吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以，这是轻卡斜交胎口径，750表示断面宽7.50英寸、20为轮辋英寸。斜交胎胎壁按断面宽约87%近似折算，误差比子午胎大，仅供对比参考，精确值以厂家滚测为准。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MM_PER_INCH = 25.4
const BIAS_SIDEWALL_RATIO = 0.87 // 斜交胎胎壁 ≈ 断面宽 × 0.87（近似口径）
const SAFE_PCT = 2   // ±2% 内：常见安全区
const EDGE_PCT = 3   // ±2%~±3%：临界；>±3%：时速表误差明显
const ALT_WIDTHS = [195, 205, 215, 225, 235, 245, 255]
const ALT_ASPECTS = [40, 45, 50, 55, 60, 65, 70]
const ALT_MAX_PCT = 1.5
const ALT_LIMIT = 8

// 国内乘用车市场常识：常见在售的「宽/扁」组合
const COMMON_PAIRS = new Set([
  '195/55', '195/60', '195/65',
  '205/45', '205/50', '205/55', '205/60', '205/65',
  '215/45', '215/50', '215/55', '215/60', '215/65',
  '225/40', '225/45', '225/50', '225/55', '225/60',
  '235/40', '235/45', '235/50', '235/55', '235/60',
  '245/40', '245/45', '245/50',
  '255/40', '255/45'
])

const RADIAL_RE = /^P?(\d{3})[ /\-]+(\d{2,3})[ /\-]*(?:Z\s*)?R[ /\-]*(\d{2})(?:[ /\-]+\d{2,3}(?:\/\d{2,3})?[A-Z]{1,3})?$/i
const BIAS_RE = /^(\d{1,4}(?:\.\d{1,2})?)[ \-xX×]+(\d{2})$/

// 宽容解析轮胎规格：225/45R17、225 / 45 r 17、225/45ZR17 91V、750-20、7.50-20
// 成功返回 { width, aspect, rimInch, type }（width 一律折算为 mm；斜交胎 aspect 取近似口径 87）；失败返回 null
function parseTireOf(str) {
  const s = String(str || '').trim().replace(/\s+/g, ' ')
  const m = s.match(RADIAL_RE)
  if (m) {
    const width = Number(m[1])
    const aspect = Number(m[2])
    const rimInch = Number(m[3])
    if (width >= 125 && width <= 385 && aspect >= 20 && aspect <= 95 && rimInch >= 10 && rimInch <= 28) {
      return { width, aspect, rimInch, type: 'radial' }
    }
    return null
  }
  const b = s.match(BIAS_RE)
  if (b) {
    const raw = b[1].includes('.') ? Number(b[1]) : Number(b[1]) >= 100 ? Number(b[1]) / 100 : Number(b[1])
    const rimInch = Number(b[2])
    if (raw >= 5 && raw <= 16 && rimInch >= 10 && rimInch <= 26) {
      return { width: Math.round(raw * MM_PER_INCH * 10) / 10, aspect: Math.round(BIAS_SIDEWALL_RATIO * 100), rimInch, type: 'bias' }
    }
  }
  return null
}

// 几何换算：胎壁 = 宽 × 扁平比/100；外径 = 轮辋 × 25.4 + 2 × 胎壁；周长 = πD
function tireGeometryOf(t) {
  const sidewallMm = (t.width * t.aspect) / 100
  const diameterMm = t.rimInch * MM_PER_INCH + 2 * sidewallMm
  return {
    sidewallMm,
    diameterMm,
    diameterInch: diameterMm / MM_PER_INCH,
    circumferenceMm: Math.PI * diameterMm
  }
}

// 直径差百分比（以原胎为基准）
function diameterDiffPct(origGeo, newGeo) {
  return ((newGeo.diameterMm - origGeo.diameterMm) / origGeo.diameterMm) * 100
}

// 真实车速 = 表显 × (新周长 / 原周长)
function speedActualOf(shownKmh, origGeo, newGeo) {
  return shownKmh * (newGeo.circumferenceMm / origGeo.circumferenceMm)
}

// 三档判定：±2% 内 safe / ±3% 内 edge / 超 3% danger
function judgePct(pct) {
  const a = Math.abs(pct)
  if (a <= SAFE_PCT) return 'safe'
  if (a <= EDGE_PCT) return 'edge'
  return 'danger'
}

// 宽度差轮拱风险：+8mm 经验红线
function widthRiskOf(origTire, newTire) {
  const dw = newTire.width - origTire.width
  if (dw >= 8) return { level: 'warn', text: `新胎断面宽比原胎多 ${Math.round(dw)}mm（≥8mm 经验红线）：注意轮拱/内衬与叶子板是否干涉，转角满舵回正听蹭响。` }
  if (dw >= 4) return { level: 'warn', text: `新胎宽出约 ${Math.round(dw)}mm，接近轮拱让位余量，建议装后满舵实测。` }
  if (dw <= -8) return { level: 'warn', text: `新胎比原胎窄 ${Math.round(-dw)}mm 以上：接地与刹车盘面配合变弱，外观也显空，谨慎选用。` }
  return { level: 'ok', text: `宽度差 ${dw >= 0 ? '+' : ''}${Math.round(dw)}mm，轮拱干涉风险低（仍建议核对轮毂 J 值与 ET 偏距）。` }
}

// 扁平比档位说明
function aspectNoteOf(origTire, newTire) {
  const da = newTire.aspect - origTire.aspect
  if (da === 0) return '扁平比同档：胎壁软硬与滤震特性接近，操控手感变化主要来自宽度。'
  if (da < 0) return `扁平比 ${origTire.aspect} → ${newTire.aspect}：胎壁变薄约 ${Math.round((origTire.aspect - newTire.aspect) * newTire.width / 100)}mm，路感更直接，但过坑要减速，防鼓包伤圈。`
  return `扁平比 ${origTire.aspect} → ${newTire.aspect}：胎壁变厚，滤震舒适、耐坑，代价是快速变向指向感变“肉”。`
}

// 同直径替代清单：常用宽度 × 常用扁平比 × 轮辋 ±1，筛选直径差 ≤1.5%，最多 8 条
function altSizesOf(origTire) {
  const origGeo = tireGeometryOf(origTire)
  const rims = [origTire.rimInch - 1, origTire.rimInch, origTire.rimInch + 1].filter((r) => r >= 13 && r <= 24)
  const seen = new Set()
  const out = []
  for (const rim of rims) {
    for (const width of ALT_WIDTHS) {
      for (const aspect of ALT_ASPECTS) {
        if (width === origTire.width && aspect === origTire.aspect && rim === origTire.rimInch) continue
        const t = { width, aspect, rimInch: rim, type: 'radial' }
        const pct = diameterDiffPct(origGeo, tireGeometryOf(t))
        if (Math.abs(pct) > ALT_MAX_PCT) continue
        const label = `${width}/${aspect}R${rim}`
        if (seen.has(label)) continue
        seen.add(label)
        out.push({ label, pct, common: COMMON_PAIRS.has(`${width}/${aspect}`) })
      }
    }
  }
  out.sort((a, b) => Math.abs(a.pct) - Math.abs(b.pct))
  return out.slice(0, ALT_LIMIT)
}

// SVG 同心双圆对比数据：新胎外径圈 + 原胎外径圈 + 轮辋虚线圈，数值全部为纯数字，文本经转义后由模板绑定渲染
function svgEscapeText(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function tiresCompareSvgOf(origGeo, newGeo) {
  const size = 260
  const cx = size / 2
  const cy = size / 2
  const maxD = Math.max(origGeo.diameterMm, newGeo.diameterMm)
  const scale = (size / 2 - 22) / (maxD / 2)
  const r = (d) => Math.round((d / 2) * scale * 10) / 10
  // 轮辋直径 = 外径 − 2 × 胎壁
  const rimDia = (geo) => geo.diameterMm - geo.sidewallMm * 2
  return {
    size,
    cx,
    cy,
    rings: [
      { r: r(origGeo.diameterMm), fill: 'rgba(37, 99, 235, 0.10)', stroke: '#2563eb', dash: null },
      { r: r(newGeo.diameterMm), fill: 'rgba(245, 158, 11, 0.06)', stroke: '#f59e0b', dash: null },
      { r: r(rimDia(origGeo)), fill: 'none', stroke: '#94a3b8', dash: '5 4' },
      { r: r(rimDia(newGeo)), fill: 'none', stroke: '#78716c', dash: '3 4' }
    ],
    labels: [
      { x: cx, y: cy - r(Math.max(origGeo.diameterMm, newGeo.diameterMm)) - 8, color: '#64748b', text: svgEscapeText('同心外径对比') }
    ]
  }
}

// ---------- 响应式状态 ----------
const DEFAULT_ORIG = '205/55R16'
const DEFAULT_NEW = '225/45R17'

const origInput = ref(DEFAULT_ORIG)
const newInput = ref(DEFAULT_NEW)
const seoContentVisible = ref(true)

const presets = [
  { name: '主流家轿升级', orig: '205/55R16', new: '225/45R17' },
  { name: '激进升级一档', orig: '205/55R16', new: '235/45R17' },
  { name: 'SUV 大一号（轻卡/SUV 斜交另注）', orig: '265/65R17', new: '265/70R17' }
]

const badgeMeta = {
  safe: { label: '常见安全区（±2% 内）', desc: '外径差在经验安全区内，多数车型时速表失真可被原厂保守余量吸收。', cls: 'bg-green-500/10 text-green-600 border-green-500/20' },
  edge: { label: '临界（±2%~±3%）', desc: '接近经验上限，建议装胎后用 GPS 实测一次车速。', cls: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  danger: { label: '误差明显（超 ±3%）', desc: '时速表误差明显、轮拱干涉与电子系统标定风险上升，建议回原规格。', cls: 'bg-red-500/10 text-red-600 border-red-500/20' }
}

const fmt1 = (v) => (Math.round(v * 10) / 10).toFixed(1)
const fmt2 = (v) => (Math.round(v * 100) / 100).toFixed(2)
const signed = (v, d = 1) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(d)}`

const origTire = computed(() => parseTireOf(origInput.value))
const newTire = computed(() => parseTireOf(newInput.value))
const origError = computed(() => origInput.value.trim() !== '' && !origTire.value)
const newError = computed(() => newInput.value.trim() !== '' && !newTire.value)

const origGeo = computed(() => (origTire.value ? tireGeometryOf(origTire.value) : null))
const newGeo = computed(() => (newTire.value ? tireGeometryOf(newTire.value) : null))

function canonicalLabel(t) {
  if (!t) return ''
  if (t.type === 'radial') return `${t.width}/${t.aspect}R${t.rimInch}`
  return `${(t.width / MM_PER_INCH).toFixed(2)}-${t.rimInch} 斜交`
}

function sidewallHintOf(geo) {
  const cm = geo.sidewallMm / 10
  if (cm <= 9.5) return `胎壁 ${cm.toFixed(1)}cm 超低扁平：过坑、减速带和路缘石务必减速，鼓包伤圈风险高。`
  if (cm <= 11.5) return `胎壁 ${cm.toFixed(1)}cm——过坑要慢：日常舒适尚可，深坑与高速压井盖仍有伤胎风险。`
  return `胎壁 ${cm.toFixed(1)}cm 较厚：滤震舒适、耐坑，激烈变向时胎壁形变偏大。`
}

const origCard = computed(() => {
  if (!origTire.value || !origGeo.value) return null
  return {
    title: `原胎 ${canonicalLabel(origTire.value)}`,
    geo: origGeo.value,
    hint: sidewallHintOf(origGeo.value),
    biasNote: origTire.value.type === 'bias' ? '斜交轻卡胎口径：胎壁按断面宽 × 0.87 近似折算，非子午胎公式，结果仅供对比参考。' : ''
  }
})

const newCard = computed(() => {
  if (!newTire.value || !newGeo.value) return null
  return {
    title: `新胎 ${canonicalLabel(newTire.value)}`,
    geo: newGeo.value,
    hint: sidewallHintOf(newGeo.value),
    biasNote: newTire.value.type === 'bias' ? '斜交轻卡胎口径：胎壁按断面宽 × 0.87 近似折算，非子午胎公式，结果仅供对比参考。' : ''
  }
})

const cmp = computed(() => {
  if (!origTire.value || !newTire.value || !origGeo.value || !newGeo.value) return null
  const pct = diameterDiffPct(origGeo.value, newGeo.value)
  const level = judgePct(pct)
  const speedRows = [40, 60, 100, 120].map((shown) => ({ shown, actual: speedActualOf(shown, origGeo.value, newGeo.value) }))
  const odoActual = 10000 * (newGeo.value.circumferenceMm / origGeo.value.circumferenceMm)
  return {
    level,
    dDiffSigned: signed(newGeo.value.diameterMm - origGeo.value.diameterMm),
    dPctSigned: signed(pct, 2),
    cDiffSigned: signed(newGeo.value.circumferenceMm - origGeo.value.circumferenceMm),
    newGeo: newGeo.value,
    speedRows,
    odoActualText: fmt1(odoActual),
    odoDiffSigned: signed(odoActual - 10000),
    widthRisk: (() => { const r = widthRiskOf(origTire.value, newTire.value); return { ...r, cls: r.level === 'ok' ? '' : 'bg-red-500/10' } })(),
    aspectNote: aspectNoteOf(origTire.value, newTire.value)
  }
})

const svgSpec = computed(() => {
  if (!origGeo.value || !newGeo.value) return null
  return tiresCompareSvgOf(origGeo.value, newGeo.value)
})

const altList = computed(() => {
  if (!origTire.value) return []
  return altSizesOf(origTire.value).map((a) => ({ ...a, pctSigned: signed(a.pct, 2) }))
})

function applyPreset(p) {
  origInput.value = p.orig
  newInput.value = p.new
}

function swapTires() {
  const o = origInput.value
  origInput.value = newInput.value
  newInput.value = o
}

function resetInputs() {
  origInput.value = DEFAULT_ORIG
  newInput.value = DEFAULT_NEW
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('tire-size-calculator')
})
</script>
