<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Cog class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">皮带长度计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">皮带轮中心距↔皮带圈长度互算、标准带长吸附、速比与线速度，农机/台钻/砂带机配带必备</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线皮带长度计算工具：输入大轮直径 D、小轮直径 d、中心距 C（mm），按标准几何近似公式（弧长 + 直线段）正算开口带与交叉带的皮带圈长度；
        也可以反解「已知带长求中心距」，并把结果吸附到常用标准带长档位，直接告诉你「买哪一档、中心距调到多少」；另附两轮速比与线速度小卡。
        全部计算在浏览器本地完成，不上传任何数据，适合农机维修、台钻变速、砂带机与 3D 打印机床的皮带选型与改轮验算。
      </p>
    </div>

    <!-- 页面说明条（口径声明） -->
    <div class="flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 mb-6 text-xs leading-relaxed text-muted-foreground">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>
        两带轮开口/交叉带长用标准几何近似公式（弧长+直线段），实际选型请核对带厂手册（皮带节线长 LW ≠ 中心线长口径差异已注明）；本工具覆盖 90% 家用农机/台钻/砂带机场景。
      </span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左列：模式 / 输入 / 预设 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Cog class="w-5 h-5 mr-2 text-primary" /> 计算模式
          </h2>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="mode = 'forward'"
              class="px-3 py-2 rounded-lg text-sm font-medium border transition"
              :class="mode === 'forward' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted hover:bg-muted/80 border-border text-foreground'"
            >
              正算：中心距 → 带长
            </button>
            <button
              @click="mode = 'inverse'"
              class="px-3 py-2 rounded-lg text-sm font-medium border transition"
              :class="mode === 'inverse' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted hover:bg-muted/80 border-border text-foreground'"
            >
              反算：带长 → 中心距
            </button>
          </div>
        </div>

        <!-- 正算输入 -->
        <div v-show="mode === 'forward'" class="space-y-3">
          <div v-for="field in forwardFields" :key="field.key" class="flex items-center gap-3">
            <label class="w-40 text-sm text-foreground flex-shrink-0">{{ field.label }}</label>
            <input
              v-model="field.ref.value"
              type="number"
              :min="0"
              step="1"
              class="flex-1 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <p class="text-xs text-muted-foreground">约束：D ≥ d > 0，且 C > (D−d)/2 + 20 mm（过小无法包角安装）。</p>
        </div>

        <!-- 反算输入 -->
        <div v-show="mode === 'inverse'" class="space-y-3">
          <div v-for="field in inverseFields" :key="field.key" class="flex items-center gap-3">
            <label class="w-40 text-sm text-foreground flex-shrink-0">{{ field.label }}</label>
            <input
              v-model="field.ref.value"
              type="number"
              :min="0"
              step="0.1"
              class="flex-1 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <p class="text-xs text-muted-foreground">带长 L 按开口带口径输入（节线长近似）；L 太小时两轮包不住带，会提示无实根。</p>
        </div>

        <!-- 预设 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">快速预设</p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="preset in presets"
              :key="preset.name"
              @click="applyPreset(preset)"
              class="px-2 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition"
              :title="`${preset.name}：D=${preset.D} d=${preset.d} C=${preset.C}`"
            >
              <Play class="w-3 h-3 inline mr-1 -mt-0.5 text-primary" />{{ preset.name }}
            </button>
          </div>
        </div>

        <button
          @click="resetInputs"
          class="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认参数
        </button>

        <!-- 轮径/带型对照参考 -->
        <div class="rounded-lg bg-muted/50 border border-border p-3 text-xs leading-relaxed text-muted-foreground">
          <p class="font-medium text-foreground mb-1">常见带型一眼对照</p>
          <p>V 带截面：Z 型 10×6 mm、A 型 13×8 mm、B 型 17×11 mm（顶宽×高），配带须与带轮槽型一致；平皮带按宽度×厚度另查，本工具按节线口径计算。</p>
        </div>
      </div>

      <!-- 右列：结果 + 示意 + 速比 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 正算结果 -->
        <div v-show="mode === 'forward'" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <ArrowLeftRight class="w-5 h-5 mr-2 text-primary" /> 开口带 / 交叉带长度对照
            </h2>
            <span v-if="forwardCheck.ok" class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
              <CheckCircle class="w-3.5 h-3.5" /> 参数有效
            </span>
            <span v-else class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-600 border border-red-500/20">
              <TriangleAlert class="w-3.5 h-3.5" /> 参数待修正
            </span>
          </div>

          <p v-if="!forwardCheck.ok" class="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-start gap-1.5">
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ forwardCheck.msg }}
          </p>

          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">开口带长 L（最常用，两轮同向）</p>
                <p class="text-2xl font-bold text-primary">{{ forwardResult.openText }} mm</p>
                <p class="text-[10px] text-muted-foreground mt-1 font-mono">L = 2C + π(D+d)/2 + (D−d)²/(4C)</p>
              </div>
              <div class="bg-muted/60 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">交叉带长 L（两轮反向，交叉传动少用）</p>
                <p class="text-2xl font-bold text-foreground">{{ forwardResult.crossText }} mm</p>
                <p class="text-[10px] text-muted-foreground mt-1 font-mono">L = 2C + π(D+d)/2 + (D+d)²/(4C)</p>
              </div>
            </div>

            <!-- 标准带长吸附卡 -->
            <div class="rounded-lg border border-border bg-muted/40 p-4">
              <p class="text-sm font-medium text-foreground mb-2">最近标准带长吸附</p>
              <p class="text-sm text-muted-foreground leading-relaxed">
                <template v-if="forwardResult.snap">
                  买 <span class="font-bold text-primary">{{ forwardResult.snap.std }} mm</span> 的标准带（与计算值 {{ forwardResult.openText }} mm 差 {{ forwardResult.snap.diffText }} mm），
                  把中心距调到 <span class="font-bold text-foreground">{{ forwardResult.snapCenterText }} mm</span> 即可张紧到位。
                </template>
                <template v-else>
                  计算值 {{ forwardResult.openText }} mm 超出常用标准档序列（350–2000 mm），可按节线长定制或改轮径重算。
                </template>
              </p>
            </div>
          </template>
        </div>

        <!-- 反算结果 -->
        <div v-show="mode === 'inverse'" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ArrowLeftRight class="w-5 h-5 mr-2 text-primary" /> 中心距反解结果
          </h2>

          <p v-if="!inverseResult.ok" class="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-start gap-1.5">
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ inverseResult.msg }}
          </p>

          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">可安装中心距 C</p>
                <p class="text-2xl font-bold text-primary">{{ inverseResult.cText }} mm</p>
                <p class="text-[10px] text-muted-foreground mt-1 font-mono">C = [(L−π(D+d)/2) + √((L−π(D+d)/2)²−2(D−d)²)] / 4</p>
              </div>
              <div class="bg-muted/60 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">推荐调节区间</p>
                <p class="text-lg font-bold text-foreground">{{ inverseResult.rangeText }} mm</p>
                <p class="text-[10px] text-muted-foreground mt-1">经验值 0.7(D+d) ~ 2(D+d) 与本解的交集</p>
              </div>
            </div>

            <div v-if="inverseResult.snap" class="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground leading-relaxed">
              <p class="font-medium text-foreground mb-1">若改用标准带</p>
              与输入带长 {{ inverseResult.inputLText }} mm 最接近的标准档为 <span class="font-bold text-primary">{{ inverseResult.snap.std }} mm</span>
              （差 {{ inverseResult.snap.diffText }} mm）；买这一档并把中心距调到 <span class="font-bold text-foreground">{{ inverseResult.snapCenterText }} mm</span>，张紧余量最合理。
            </div>
          </template>
        </div>

        <!-- SVG 两圆切线示意 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Circle class="w-5 h-5 mr-2 text-primary" /> 两带轮切线示意
            </h2>
            <div class="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span class="flex items-center gap-1"><i class="w-5 h-0.5 bg-primary inline-block"></i>开口带边</span>
              <span class="flex items-center gap-1"><i class="w-5 border-t-2 border-dashed border-amber-500 inline-block"></i>交叉带边</span>
            </div>
          </div>
          <svg
            v-if="beltGeom"
            :viewBox="beltGeom.viewBox"
            class="w-full h-auto max-h-64"
            role="img"
            aria-label="两带轮与皮带切线示意图"
          >
            <circle :cx="beltGeom.big.cx" cy="0" :r="beltGeom.big.r" fill="none" class="stroke-primary" stroke-width="2" vector-effect="non-scaling-stroke" />
            <circle :cx="beltGeom.small.cx" cy="0" :r="beltGeom.small.r" fill="none" class="stroke-primary/70" stroke-width="2" vector-effect="non-scaling-stroke" />
            <line
              v-for="(ln, i) in beltGeom.openLines"
              :key="`o${i}`"
              :x1="ln.x1" :y1="ln.y1" :x2="ln.x2" :y2="ln.y2"
              class="stroke-primary" stroke-width="2" vector-effect="non-scaling-stroke"
            />
            <line
              v-for="(ln, i) in beltGeom.crossLines"
              :key="`c${i}`"
              :x1="ln.x1" :y1="ln.y1" :x2="ln.x2" :y2="ln.y2"
              class="stroke-amber-500" stroke-width="1.5" stroke-dasharray="6 5" vector-effect="non-scaling-stroke"
            />
            <text :x="beltGeom.labelX" :y="beltGeom.labelY" :font-size="beltGeom.fontSize" class="fill-current text-muted-foreground">
              D={{ beltGeom.D }} · d={{ beltGeom.d }} · C={{ beltGeom.C }} mm
            </text>
          </svg>
          <p v-else class="text-sm text-muted-foreground py-6 text-center">
            <Info class="w-4 h-4 inline mr-1 -mt-0.5" /> 参数不完整或未通过校验，暂无法绘制切线示意图。
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            实线为开口带上下公切边（节线近似），虚线为交叉带的两条内公切边；交叉传动包角大、带在交叉点互相摩擦磨损快，仅在需要反向旋转且中心距富余时采用。
          </p>
        </div>

        <!-- 速比小卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Cog class="w-5 h-5 mr-2 text-primary" /> 速比与线速度小卡（n₁·d₁ = n₂·d₂）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label class="text-sm text-foreground space-y-1">
              <span class="text-xs text-muted-foreground">主动轮转速 n₁（rpm）</span>
              <input
                v-model="speedN1"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="text-sm text-foreground space-y-1">
              <span class="text-xs text-muted-foreground">主动轮直径 d₁（mm）</span>
              <input
                v-model="speedD1"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="text-sm text-foreground space-y-1">
              <span class="text-xs text-muted-foreground">从动轮直径 d₂（mm）</span>
              <input
                v-model="speedD2"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
          </div>
          <div v-if="speedResult.ok" class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">从动轮转速 n₂</p>
              <p class="text-xl font-bold text-foreground">{{ speedResult.n2Text }} rpm</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">传动比 i = d₂/d₁</p>
              <p class="text-xl font-bold text-foreground">{{ speedResult.ratioText }}</p>
            </div>
            <div class="bg-primary/10 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">皮带线速度 v</p>
              <p class="text-xl font-bold text-primary">{{ speedResult.vText }} m/s</p>
            </div>
          </div>
          <p v-else class="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-start gap-1.5">
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ speedResult.msg }}
          </p>
          <p class="text-xs text-muted-foreground leading-relaxed" :class="!speedResult.ok ? 'opacity-60' : ''">
            打滑 1-3% 未计入，实际 n₂ 略低、线速略低。台钻常用 10–25 m/s 换带轮调速；砂带机线速经验：粗磨/木工 20–35 m/s 配 40–80 目，细磨 12–20 m/s 配 120 目以上——线速越高，砂带宜选越粗。
          </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>皮带长度计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是一款在线皮带圈长度与皮带轮中心距互算工具。开口传动（两轮同向）带长按「带在两轮上的弧长 + 上下两段公切直线长」展开，工程上化简为标准近似式
          L = 2C + π(D+d)/2 + (D−d)²/(4C)；交叉传动把两轮直径差换成直径和，得 L = 2C + π(D+d)/2 + (D+d)²/(4C)。
          正算给出开口/交叉两个并列结果并绘制两圆切线示意；反算把公式整理成关于中心距 C 的一元二次方程取正号实根，并把带长吸附到 350–2000 mm 常用标准档，直接给出「买哪档带、中心距调到多少」。
          所有计算在浏览器本地完成，不上传数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">皮带长度公式是怎么来的？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          把皮带拆成四类几何段：带在大轮、小轮上的两条包弧弧长（开口传动两弧角互补，合并后恰为 π(D+d)/2），加上上下两条外公切线段的长 2√(C²−((D−d)/2)²)，
          再对小轮径差项按 (D−d)/C 做二项式展开近似，就得到教科书式的 2C + π(D+d)/2 + (D−d)²/(4C)。近似误差在常见中心距（C 大于两轮半径和）下远小于 1 mm，选型完全够用。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">中心距怎么定才合理？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          经验区间取 0.7(D+d) ~ 2(D+d)：太小则小轮包角不足、易打滑且带弯曲疲劳加剧（每秒弯折次数与带速成正比）；太大则运转时带易颤动、占地也大。
          实际结构还应留出张紧行程：V 带更换后需再收紧约 1%–2% 带长，可调电机座滑轨就是为此设计的。本工具反算卡片里同时给出该经验区间与方程解的交集。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么标准带长按「节线长」标注？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          V 带绕过带轮时，内部抗拉层（节线）长度基本不变，带顶被拉伸、带底被压缩。因此带厂手册标注的节线长 LW 既不是内周长也不等于外周长——
          按内周长 PI 口径买带会短一节，按外周长又过长。本工具公式按节线口径推导，与带厂 LW 序列同口径，可直接与规格表对照；若你的旧带印的是 PI 内周长度，请以带厂换算表为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">交叉带为什么少见？换带后打滑怎么办？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          交叉传动让皮带在交叉点处边弯折边互相摩擦，发热磨损远超开口传动，还会迫使两轮轴向间距更近，因此仅在必须反向旋转、低速短程的场合偶尔使用，本工具把它作为对照项列出并注明「交叉传动少用」。
          换上新带后打滑，先别急着换更短的带：V 带靠侧面楔紧摩擦传动，正确的张紧应让小轮包角不小于 120°，用拇指按下带中部有约 1.6 cm 挠度为宜；仍打滑再检查带型与轮槽是否匹配（Z/A/B 截面混用是新手最常见错误），或加张紧轮。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">量旧皮带长度直接买带，为什么还是不合适？</h3>
            <p class="text-sm text-muted-foreground mt-1">软尺绕旧带一圈量到的是外轮廓或内圈长度，而选型对照表用的是节线长 LW，三者相差可达数厘米。正确做法：用本工具按两轮直径与中心距正算出节线口径带长，再吸附到标准档位购买；实在要量旧带，请在带侧面画一条标记线再沿标记线测量。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">反算提示「带长太短无法包住两轮」是什么意思？</h3>
            <p class="text-sm text-muted-foreground mt-1">说明输入带长比包住两轮所需的最小周长还短，方程无实根，带无论如何也套不上去。要么换更长的带（看吸附卡推荐的标准档），要么减小两轮直径或改用更小中心距结构。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">台钻想调主轴转速，换多大带轮合适？</h3>
            <p class="text-sm text-muted-foreground mt-1">按 n₂ = n₁·d₁/d₂ 估算：想让主轴更快就换更大的电机（主动）轮或更小的主轴轮，反之变慢。注意线速度 v = π·d₁·n₁/60000 不宜超 25 m/s，且新带长要回本工具正算校验，标准档不一定恰好有货，必要时选可调中心距结构。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算结果精确吗？能直接用于验收吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">公式为工程近似，在 C > (D+d)/2 的常规布局下误差小于 1 mm，但皮带本身有公差、轮槽有节线直径修正（小轮槽使有效节径小于标称外径）。选型请核对带厂手册，本工具覆盖 90% 家用农机/台钻/砂带机场景，不替代正式验收依据。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'belt-length-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Cog, Circle, CheckCircle, TriangleAlert, Info,
  ChevronUp, ChevronDown, RefreshCw, Play, ArrowLeftRight
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '皮带长度计算器 - 在线皮带轮中心距/皮带圈长度互算工具',
  description: '免费在线皮带长度计算器：按标准几何近似公式正算开口带/交叉带带长，反算皮带轮中心距，吸附 350-2000mm 标准带长档，附速比与线速度计算，农机/台钻/砂带机配带必备，纯浏览器本地运行不上传',
  keywords: '皮带长度计算,皮带轮中心距,皮带圈长度公式,三角带长度,同步带齿数',
  author: '有条工具',
  ogTitle: '皮带长度计算器 - 在线皮带轮中心距/皮带圈长度互算工具 | 有条工具',
  ogDescription: '开口带/交叉带带长正算、中心距反算、标准带长吸附、速比线速度，一台农机/台钻/砂带机配带问题一站解决。',
  ogUrl: 'https://www.util.cn/tools/belt-length-calculator',
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
          name: '皮带长度计算器',
          url: 'https://www.util.cn/tools/belt-length-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['开口带/交叉带带长正算', '带长反算中心距（二次方程求根）', '标准带长档位吸附', '速比与皮带线速度计算', '两带轮切线 SVG 示意', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '皮带长度计算器', item: 'https://www.util.cn/tools/belt-length-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '量旧皮带长度直接买带，为什么还是不合适？',
              acceptedAnswer: { '@type': 'Answer', text: '软尺绕旧带一圈量到的是外轮廓或内圈长度，而选型对照表用的是节线长LW，三者相差可达数厘米。正确做法是按两轮直径与中心距正算节线口径带长，再吸附标准档购买；要量旧带，先在带侧面画一条标记线再沿标记线测量。' }
            },
            {
              '@type': 'Question',
              name: '反算提示「带长太短无法包住两轮」是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '说明输入带长比包住两轮所需最小周长还短，中心距方程无实根，带无论如何也套不上。要么换更长的带（参考吸附卡推荐的标准档），要么减小两轮直径或改用更小中心距结构。' }
            },
            {
              '@type': 'Question',
              name: '台钻想调主轴转速，换多大带轮合适？',
              acceptedAnswer: { '@type': 'Answer', text: '按n2=n1·d1/d2估算：想更快就换更大的电机（主动）轮或更小的主轴轮，反之变慢。注意线速度不宜超过25m/s，且新带长要回本工具正算校验，标准档不一定恰好有货，必要时选可调中心距结构。' }
            },
            {
              '@type': 'Question',
              name: '计算结果精确吗？能直接用于验收吗？',
              acceptedAnswer: { '@type': 'Answer', text: '公式为工程近似，常规布局下误差小于1mm，但皮带有公差、轮槽存在节线直径修正。选型请核对带厂手册，本工具覆盖90%家用农机/台钻/砂带机场景，不替代正式验收依据。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const STD_BELT_LENGTHS = [350, 400, 450, 500, 560, 630, 710, 800, 900, 1000, 1120, 1250, 1400, 1600, 1800, 2000]
const STD_SNAP_LIMIT = 2200 // 超出该长度不再吸附标准档（按定制处理）
const MIN_EXTRA_CENTER = 20 // 最小中心距安全余量（mm）

// 保留 1 位小数（0.1 mm 精度显示）
function round1(x) {
  return Math.round(x * 10) / 10
}

// 输入转正数；非法返回 null
function positiveNum(v) {
  const n = Number(v)
  if (v === '' || v === null || v === undefined || Number.isNaN(n) || n <= 0) return null
  return n
}

// 开口带长（节线口径近似）：L = 2C + π(D+d)/2 + (D−d)²/(4C)
function openBeltLength(D, d, C) {
  return 2 * C + (Math.PI * (D + d)) / 2 + ((D - d) * (D - d)) / (4 * C)
}

// 交叉带长（标准手册近似）：L = 2C + π(D+d)/2 + (D+d)²/(4C)
function crossedBeltLength(D, d, C) {
  return 2 * C + (Math.PI * (D + d)) / 2 + ((D + d) * (D + d)) / (4 * C)
}

// 几何约束校验：D ≥ d > 0 且 C > (D−d)/2 + 20
function validateBeltInputs(D, d, C) {
  if (D === null || d === null || C === null) return { ok: false, msg: '请把大轮直径 D、小轮直径 d、中心距 C 填全（均为正数）。' }
  if (d <= 0 || D <= 0) return { ok: false, msg: '轮径必须为大于 0 的数。' }
  if (D < d) return { ok: false, msg: 'D 是大轮、d 是小轮，需满足 D ≥ d（当前 D < d）。' }
  const minC = (D - d) / 2 + MIN_EXTRA_CENTER
  if (C <= minC) return { ok: false, msg: `中心距过小：需 C > (D−d)/2 + ${MIN_EXTRA_CENTER} = ${round1(minC)} mm，过小则包角不足、无法安装。` }
  return { ok: true, msg: '' }
}

// 反算中心距：正算式整理为 2C² − (L−π(D+d)/2)C + (D−d)²/4 = 0，取正号实根
function solveCenterDistance(L, D, d) {
  if (L === null || D === null || d === null) return { ok: false, msg: '请把带长 L、大轮直径 D、小轮直径 d 填全（均为正数）。' }
  if (D < d) return { ok: false, msg: 'D 是大轮、d 是小轮，需满足 D ≥ d。' }
  const s = (Math.PI * (D + d)) / 2
  const a = L - s
  const disc = a * a - 2 * (D - d) * (D - d)
  if (a <= 0 || disc < 0) return { ok: false, msg: `带长太短无法包住两轮：L=${L} mm 小于该轮组最小包容带长（约 ${round1(s + Math.SQRT2 * (D - d))} mm），方程无实根。` }
  const C = (a + Math.sqrt(disc)) / 4
  const minC = (D - d) / 2 + MIN_EXTRA_CENTER
  if (C <= minC) return { ok: false, msg: `解出中心距 ${round1(C)} mm 过小（需 > ${round1(minC)} mm），该带在此轮组上已无张紧余量，请换更长带。` }
  return { ok: true, C }
}

// 吸附最近标准带长；超出档位序列上限返回 null
function snapToStandard(L) {
  if (L === null || L > STD_SNAP_LIMIT) return null
  let best = STD_BELT_LENGTHS[0]
  for (const std of STD_BELT_LENGTHS) {
    if (Math.abs(std - L) < Math.abs(best - L)) best = std
  }
  const diff = round1(best - L)
  return { std: best, diff, diffText: (diff >= 0 ? '+' : '') + diff.toFixed(1) }
}

// 中心距推荐区间：经验区间 0.7(D+d) ~ 2(D+d) 与解的邻域交集（解 ± 张紧行程，取区间内整段）
function centerRangeHint(C, D, d) {
  const lo = Math.max(0.7 * (D + d), C - 0.02 * C - 10)
  const hi = Math.min(2 * (D + d), C + 0.05 * C + 30)
  if (lo > hi) return { lo: round1(C), hi: round1(C) }
  return { lo: round1(lo), hi: round1(hi) }
}

// 速比与线速度：n1·d1 = n2·d2；v = π·d1·n1/60000 m/s（打滑 1–3% 未计）
function speedRatio(n1, d1, d2) {
  if (n1 === null || d1 === null || d2 === null) return { ok: false, msg: '转速与两轮直径均为必填正数。' }
  return {
    ok: true,
    n2: (n1 * d1) / d2,
    ratio: d2 / d1,
    v: (Math.PI * d1 * n1) / 60000
  }
}

// 两圆切线示意几何（纯函数）：圆心 (0,0)/(C,0)，开口带取外公切线、交叉带取内公切线
function beltSvg(D, d, C) {
  const R = D / 2
  const r = d / 2
  if (!(R > 0) || !(r > 0) || !(C > 0)) return null
  const pad = 0.2 * R + 15
  const fmt = (n) => Math.round(n * 10) / 10
  const so = (R - r) / C
  const yo = Math.sqrt(Math.max(0, 1 - so * so))
  const openLines = [
    { x1: fmt(R * so), y1: fmt(-R * yo), x2: fmt(C + r * so), y2: fmt(-r * yo) },
    { x1: fmt(R * so), y1: fmt(R * yo), x2: fmt(C + r * so), y2: fmt(r * yo) }
  ]
  let crossLines = []
  if (C > R + r) {
    const sc = (R + r) / C
    const yc = Math.sqrt(Math.max(0, 1 - sc * sc))
    crossLines = [
      { x1: fmt(-R * sc), y1: fmt(-R * yc), x2: fmt(C + r * sc), y2: fmt(r * yc) },
      { x1: fmt(-R * sc), y1: fmt(R * yc), x2: fmt(C + r * sc), y2: fmt(-r * yc) }
    ]
  }
  return {
    viewBox: `${fmt(-(R + pad))} ${fmt(-(R + pad))} ${fmt(C + R + r + 2 * pad)} ${fmt(2 * (R + pad))}`,
    big: { cx: 0, r: fmt(R) },
    small: { cx: fmt(C), r: fmt(r) },
    openLines,
    crossLines,
    labelX: fmt(C / 2 - 40),
    labelY: fmt(-(R + pad) + 24),
    fontSize: fmt(Math.max(14, R * 0.14)),
    D: fmt(D),
    d: fmt(d),
    C: fmt(C)
  }
}

// ---------- 页面状态 ----------
const mode = ref('forward')
const seoContentVisible = ref(true)

// 正算输入（mm）
const fD = ref(200)
const fd = ref(80)
const fC = ref(250)
// 反算输入（mm）
const iL = ref(954.2)
const iD = ref(200)
const id = ref(80)
// 速比输入
const speedN1 = ref(1400)
const speedD1 = ref(80)
const speedD2 = ref(200)

const forwardFields = [
  { key: 'D', label: '大轮直径 D（mm）', ref: fD },
  { key: 'd', label: '小轮直径 d（mm）', ref: fd },
  { key: 'C', label: '中心距 C（mm）', ref: fC }
]
const inverseFields = [
  { key: 'L', label: '皮带圈长度 L（mm）', ref: iL },
  { key: 'D', label: '大轮直径 D（mm）', ref: iD },
  { key: 'd', label: '小轮直径 d（mm）', ref: id }
]

const presets = [
  { name: '台钻', D: 200, d: 80, C: 250 },
  { name: '砂带机', D: 100, d: 100, C: 400 },
  { name: '农机', D: 300, d: 150, C: 500 }
]

function applyPreset(p) {
  mode.value = 'forward'
  fD.value = p.D
  fd.value = p.d
  fC.value = p.C
}

function resetInputs() {
  mode.value = 'forward'
  fD.value = 200
  fd.value = 80
  fC.value = 250
  iL.value = 954.2
  iD.value = 200
  id.value = 80
  speedN1.value = 1400
  speedD1.value = 80
  speedD2.value = 200
}

// ---------- 计算结果 ----------
const forwardCheck = computed(() =>
  validateBeltInputs(positiveNum(fD.value), positiveNum(fd.value), positiveNum(fC.value))
)

const forwardResult = computed(() => {
  const empty = { openText: '—', crossText: '—', snap: null, snapCenterText: '—' }
  if (!forwardCheck.value.ok) return empty
  const D = Number(fD.value)
  const d = Number(fd.value)
  const C = Number(fC.value)
  const open = round1(openBeltLength(D, d, C))
  const snap = snapToStandard(open)
  let snapCenter = null
  if (snap) {
    const solved = solveCenterDistance(snap.std, D, d)
    snapCenter = solved.ok ? round1(solved.C) : null
  }
  return {
    openText: open.toFixed(1),
    crossText: round1(crossedBeltLength(D, d, C)).toFixed(1),
    snap,
    snapCenterText: snapCenter === null ? '（该轮组下无解）' : snapCenter.toFixed(1)
  }
})

const inverseResult = computed(() => {
  const solved = solveCenterDistance(positiveNum(iL.value), positiveNum(iD.value), positiveNum(id.value))
  if (!solved.ok) return { ok: false, msg: solved.msg, inputLText: '—', snap: null, snapCenterText: '—', rangeText: '—', cText: '—' }
  const L = Number(iL.value)
  const D = Number(iD.value)
  const d = Number(id.value)
  const C = round1(solved.C)
  const snap = snapToStandard(L)
  let snapCenter = null
  if (snap && snap.std !== round1(L)) {
    const again = solveCenterDistance(snap.std, D, d)
    snapCenter = again.ok ? round1(again.C) : null
  }
  const range = centerRangeHint(C, D, d)
  return {
    ok: true,
    msg: '',
    cText: C.toFixed(1),
    rangeText: `${range.lo.toFixed(1)} ~ ${range.hi.toFixed(1)}`,
    inputLText: L.toFixed(1),
    snap: snap && snapCenter !== null ? { ...snap, } : null,
    snapCenterText: snapCenter === null ? '—' : snapCenter.toFixed(1)
  }
})

// SVG 示意几何：正算用输入，反算用解出的 C
const beltGeom = computed(() => {
  if (mode.value === 'forward') {
    if (!forwardCheck.value.ok) return null
    return beltSvg(Number(fD.value), Number(fd.value), Number(fC.value))
  }
  if (!inverseResult.value.ok) return null
  return beltSvg(Number(iD.value), Number(id.value), Number(inverseResult.value.cText))
})

const speedResult = computed(() => {
  const res = speedRatio(positiveNum(speedN1.value), positiveNum(speedD1.value), positiveNum(speedD2.value))
  if (!res.ok) return res
  return {
    ok: true,
    n2Text: round1(res.n2).toFixed(1),
    ratioText: `${round1(res.ratio).toFixed(2)} : 1`,
    vText: res.v.toFixed(2)
  }
})

function toggleSeoContent() {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 生命周期（SSR 安全） ----------
onMounted(() => {
  addRecentTool('belt-length-calculator')
})
</script>
