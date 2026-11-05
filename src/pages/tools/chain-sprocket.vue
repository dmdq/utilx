<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部区 -->
    <div class="mb-6">
      <div class="flex items-start gap-3 mb-3">
        <div class="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <component :is="toolIcon" class="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground mb-1">链条长度计算器 - 链轮节数与中心距速算</h1>
          <p class="text-muted-foreground">链传动公式：齿数 Z₁/Z₂、中心距 C、节距 p → 理论链条节数，自动取偶数节并反算实际安装中心距（含垂度补偿 −0.5~1%），附链速校核与节距对照表，纯本地计算。</p>
        </div>
      </div>
      <p class="text-sm text-muted-foreground">节数 L = 2C/p + (Z₁+Z₂)/2 + p·((Z₂−Z₁)/2π)²/C（标准滚子链近似式）；偶数节优先——奇数节必须加过渡链节，强度打折。</p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        口径：采用 GB/T 1243 / ISO 606 滚子链传动通用近似公式（与 ANSI/ASME B29.1 手册公式一致），L 为以节距数计的链条长度；
        反算中心距为该式的精确逆解（求根公式），含垂度补偿时按预留 −0.5%~−1% 缩短安装中心距。
        常用中心距 a = (30~50)p，链速 v = Z₁·n₁·p/60000（m/s），v &lt; 15 m/s 为常规范围。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 计算方向
          </h2>
        </div>

        <!-- 方向切换 -->
        <div class="grid grid-cols-2 gap-1.5">
          <button
            @click="dir = 'forward'"
            :class="dir === 'forward' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 rounded-lg text-sm font-medium transition-all"
          >正算：参数 → 节数</button>
          <button
            @click="dir = 'reverse'"
            :class="dir === 'reverse' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 rounded-lg text-sm font-medium transition-all"
          >反算：节数 → 中心距</button>
        </div>

        <!-- 公共输入：齿数与节距 -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label for="cs-z1" class="block text-sm font-medium text-foreground mb-1.5">小链轮齿数 Z₁</label>
            <input
              id="cs-z1"
              v-model.number="z1"
              type="number"
              min="6"
              max="200"
              step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 17"
            >
            <p class="text-xs text-muted-foreground mt-1">建议 ≥17，低速可到 9</p>
          </div>
          <div>
            <label for="cs-z2" class="block text-sm font-medium text-foreground mb-1.5">大链轮齿数 Z₂</label>
            <input
              id="cs-z2"
              v-model.number="z2"
              type="number"
              min="6"
              max="200"
              step="1"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 34"
            >
            <p class="text-xs text-muted-foreground mt-1">一般不超过 120</p>
          </div>
          <div>
            <label for="cs-p" class="block text-sm font-medium text-foreground mb-1.5">节距 p（mm）</label>
            <input
              id="cs-p"
              v-model.number="pitch"
              type="number"
              min="3"
              step="0.001"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="如 12.7"
            >
            <p class="text-xs text-muted-foreground mt-1">点侧栏节距表可快速填入</p>
          </div>
        </div>

        <!-- 正算模式 -->
        <template v-if="dir === 'forward'">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="cs-c" class="block text-sm font-medium text-foreground mb-1.5">中心距 C（mm）</label>
              <input
                id="cs-c"
                v-model.number="centerDist"
                type="number"
                min="1"
                step="5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 500"
              >
              <p class="text-xs text-muted-foreground mt-1">常用 a = (30~50)p</p>
            </div>
            <div>
              <label for="cs-n1" class="block text-sm font-medium text-foreground mb-1.5">小链轮转速 n₁（rpm，算链速用）</label>
              <input
                id="cs-n1"
                v-model.number="rpm"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 1000"
              >
            </div>
          </div>

          <div v-if="forwardResult" class="space-y-3">
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <p class="text-sm text-muted-foreground mb-1">链条节数（偶数优先取整）</p>
              <p class="text-3xl font-bold text-primary font-mono">
                {{ forwardResult.linksEven }} <span class="text-base font-normal text-muted-foreground">节</span>
              </p>
              <p class="text-xs text-muted-foreground mt-1 font-mono">
                理论值 L = {{ fmtNum(forwardResult.linksTheory, 4) }} 节 = 2C/p + (Z₁+Z₂)/2 + p·((Z₂−Z₁)/2π)²/C
              </p>
            </div>

            <p v-if="forwardResult.oddWarning" class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-foreground">
              <TriangleAlert class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-amber-500" />
              {{ forwardResult.oddWarning }}
            </p>
            <p v-else class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground">
              <CheckCircle class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-green-600 dark:text-green-400" />
              取整后为偶数节，用标准连接链节（锁片/卡簧）即可，强度不打折。奇数节必须加过渡链节（弯板），强度约打 8 折，应尽量避免。
            </p>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div class="p-2.5 rounded-lg bg-muted/60">
                <p class="text-[11px] text-muted-foreground mb-0.5">由 {{ forwardResult.linksEven }} 节反算中心距</p>
                <p class="font-mono text-sm text-foreground">{{ fmtNum(forwardResult.centerBack, 2) }} mm</p>
              </div>
              <div class="p-2.5 rounded-lg bg-muted/60">
                <p class="text-[11px] text-muted-foreground mb-0.5">与输入 C 偏差</p>
                <p class="font-mono text-sm text-foreground">{{ fmtNum(forwardResult.devPct, 2) }} %</p>
              </div>
              <div class="p-2.5 rounded-lg bg-muted/60">
                <p class="text-[11px] text-muted-foreground mb-0.5">安装中心距（垂度 −{{ trimNum(Number(sagPct)) }}%）</p>
                <p class="font-mono text-sm text-foreground">{{ fmtNum(forwardResult.centerMount, 2) }} mm</p>
              </div>
              <div class="p-2.5 rounded-lg bg-muted/60">
                <p class="text-[11px] text-muted-foreground mb-0.5">链速 v = Z₁n₁p/60000</p>
                <p class="font-mono text-sm text-foreground">{{ forwardResult.speed !== null ? fmtNum(forwardResult.speed, 2) + ' m/s' : '—' }}</p>
              </div>
            </div>

            <p v-if="forwardResult.speed !== null && forwardResult.speed >= 15" class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-foreground">
              <TriangleAlert class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-amber-500" />
              链速 {{ fmtNum(forwardResult.speed, 2) }} m/s 已超 15 m/s：常规滚子链按 v &lt; 15 m/s 口径选用，超出需专门校核动载、选用小节距多排链并加强润滑（油浴/压力润滑）。
            </p>
            <p v-else class="text-xs text-muted-foreground leading-relaxed">
              链速常规口径 v &lt; 15 m/s；低速链（&lt;0.6 m/s）按静强度选型，高速链注意多边形效应与冲击，尽量用小链轮多齿数。
            </p>
          </div>
          <div v-else class="p-8 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
            请输入 6~200 的整数齿数、大于 0 的节距与中心距
          </div>
        </template>

        <!-- 反算模式 -->
        <template v-else>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="cs-links" class="block text-sm font-medium text-foreground mb-1.5">链条节数 L（节）</label>
              <input
                id="cs-links"
                v-model.number="linksInput"
                type="number"
                min="10"
                step="2"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 104"
              >
              <p class="text-xs text-muted-foreground mt-1">现货链条按整节数计，偶数节免过渡链节</p>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label for="cs-sag" class="block text-sm font-medium text-foreground">垂度补偿（缩短中心距）</label>
                <span class="text-sm font-mono text-primary font-semibold">−{{ trimNum(Number(sagPct)) }}%</span>
              </div>
              <input
                id="cs-sag"
                v-model.number="sagPct"
                type="range"
                min="0.5"
                max="1"
                step="0.1"
                class="w-full accent-primary"
              >
              <div class="flex justify-between text-[11px] text-muted-foreground">
                <span>0.5%</span>
                <span>水平传动预留松边垂度用</span>
                <span>1%</span>
              </div>
            </div>
          </div>

          <div v-if="reverseResult" class="space-y-3">
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <p class="text-sm text-muted-foreground mb-1">理论中心距 a = p/4 × [L−(Z₁+Z₂)/2 + √((L−(Z₁+Z₂)/2)² − 8((Z₂−Z₁)/2π)²)]</p>
              <p class="text-3xl font-bold text-primary font-mono">
                {{ fmtNum(reverseResult.center, 2) }} <span class="text-base font-normal text-muted-foreground">mm</span>
              </p>
              <p class="text-xs text-muted-foreground mt-1">
                安装中心距（含垂度 −{{ trimNum(Number(sagPct)) }}%）≈
                <span class="font-mono font-semibold text-foreground">{{ fmtNum(reverseResult.centerMount, 2) }} mm</span>
              </p>
            </div>

            <p v-if="reverseResult.oddWarning" class="text-xs leading-relaxed p-2.5 rounded bg-amber-500/10 text-foreground">
              <TriangleAlert class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-amber-500" />
              {{ reverseResult.oddWarning }}
            </p>

            <div class="text-xs text-muted-foreground leading-relaxed p-2.5 rounded-lg bg-muted/50">
              垂度校核：安装后松边下垂量 f ≈ (1%~2%)×中心距（水平传动），过大易跳齿振动、过紧增大轴与轴承载荷；
              张紧优先调中心距，其次在靠近小链轮的松边加张紧轮/导板。
            </div>
          </div>
          <div v-else class="p-8 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
            请输入 6~200 的整数齿数、大于 0 的节距与节数；节数过短时中心距无正实解
          </div>
        </template>

        <!-- 复制结果 -->
        <div class="pt-1">
          <button
            v-if="copyText"
            @click="copyResults"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition"
          >
            <Copy v-if="!copied" class="w-3.5 h-3.5" />
            <Check v-else class="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            {{ copied ? '已复制' : '复制结果' }}
          </button>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 节距对照表 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Ruler class="w-4 h-4 text-primary mr-1.5" /> 常用节距对照（点击填入）
          </h3>
          <p class="text-[11px] text-muted-foreground mb-2">GB/T 1243 / ISO 606（B 系列滚子链）</p>
          <div class="grid grid-cols-2 gap-1.5 mb-3">
            <button
              v-for="row in metricPitches"
              :key="row.label"
              @click="applyPitch(row.pitch)"
              :class="Number(pitch) === row.pitch ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'"
              class="px-2 py-1.5 rounded-lg text-xs font-mono text-left transition"
            >
              {{ row.label }} · {{ row.pitch }}
            </button>
          </div>
          <p class="text-[11px] text-muted-foreground mb-2">ANSI 美制（每节距 = n/8 英寸）</p>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="row in ansiPitches"
              :key="row.label"
              @click="applyPitch(row.pitch)"
              :class="Number(pitch) === row.pitch ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'"
              class="px-2 py-1.5 rounded-lg text-xs font-mono text-left transition"
            >
              {{ row.label }} · {{ row.pitch }}
            </button>
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed mt-3">
            同节距对照：06B ≈ #35（9.525）、08B ≈ #40（12.7）、10B ≈ #50（15.875）。同节距不同系列的滚子/链板尺寸有差异，替换前核对链条代号。
          </p>
        </div>

        <!-- 偶数节警示 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <TriangleAlert class="w-4 h-4 text-primary mr-1.5" /> 为什么节数要偶数
          </h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            偶数节用标准连接链节（卡簧/锁片）闭合，强度与链板本体相当；奇数节必须用过渡链节（弯板/偏置链节），
            链板承受附加弯曲应力，强度通常按链条本体的 80% 或更低评估，疲劳寿命显著下降。
            设计口诀：先取偶数节，再微调中心距——中心距差 1~2mm 一般都能被安装公差与垂度吸收。
          </p>
        </div>

        <!-- 磨损与张紧 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Wrench class="w-4 h-4 text-primary mr-1.5" /> 磨损判断与张紧方式
          </h3>
          <ul class="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <li>• 磨损判断：量整 10 或 20 节长度，与公称长（节数×节距，如 08B 20 节 = 254mm）比较，节距伸长率 ≥3% 即更换（高速重载按 2% 更保守）。</li>
            <li>• 链轮齿磨成钩状或两侧不对称时同步更换；新链不要配旧轮，会加速磨合磨损。</li>
            <li>• 张紧方式：首选调中心距；空间受限用张紧轮/惰轮压松边（布置在靠近小链轮一侧的松边，直径 ≥ 小链轮），振动大用导板限位。</li>
            <li>• 垂度口诀：水平传动松边下垂量 f ≈ (1%~2%)×中心距，垂直或倾斜传动取更小。</li>
          </ul>
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
          什么是链条长度计算器
        </h2>
        <p class="text-muted-foreground mb-4">
          链条长度计算器面向滚子链传动设计：输入两个链轮齿数 Z₁/Z₂、中心距 C 与节距 p，按标准近似式
          L = 2C/p + (Z₁+Z₂)/2 + p·((Z₂−Z₁)/2π)²/C 求链条节数，自动按"偶数优先"取整并给出过渡链节警示；
          再由取整后的节数反算实际中心距（反算公式是正算式的精确逆解），并按 −0.5%~−1% 滑杆做垂度补偿得到安装中心距。
          附链速校核 v = Z₁·n₁·p/60000、06B~16B 与 ANSI #25~#50 节距对照表。全部计算在浏览器本地完成。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>填小/大链轮齿数 Z₁、Z₂ 与节距 p（点侧栏节距表快速填入 9.525/12.7/15.875 等常用值）；</li>
          <li>正算：填中心距 C 得理论节数与偶数节取整，读反算中心距、偏差与安装中心距；</li>
          <li>反算：手头已有链条时，填节数 L 得理论中心距，拖垂度补偿滑杆读安装中心距；</li>
          <li>填小链轮转速 n₁ 校核链速，v ≥ 15 m/s 时按提示加强选型与润滑。</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          链传动计算公式
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>链条节数</strong>：L = 2C/p + (Z₁+Z₂)/2 + p·((Z₂−Z₁)/2π)²/C（以节距数计，标准滚子链近似式）；</li>
          <li><strong>取整口径</strong>：偶数优先，L偶 = 2×round(L/2)；奇数节需过渡链节，强度约打 8 折；</li>
          <li><strong>中心距反算</strong>：a = p/4 × [L−(Z₁+Z₂)/2 + √((L−(Z₁+Z₂)/2)² − 8((Z₂−Z₁)/2π)²)]（正算式的精确逆解）；</li>
          <li><strong>垂度补偿</strong>：安装中心距 = 理论中心距 × (1 − 0.5%~1%)；水平传动松边下垂量 f ≈ (1%~2%)a；</li>
          <li><strong>链速</strong>：v = Z₁×n₁×p/60000（m/s），常规口径 v &lt; 15 m/s。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4 mb-6">
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么链条节数要偶数？</h3>
            <p class="text-muted-foreground mt-1">
              滚子链是偶数节闭合最自然：偶数节首尾相接用的是标准连接链节（卡簧/锁片），强度与链板本体相当；
              奇数节则必须加一个过渡链节（弯板或偏置链节），它承受附加弯曲应力，强度通常按链条本体的 80% 或更低评估，
              疲劳寿命也明显下降。所以设计时先取偶数节，中心距的微小差别由安装公差和垂度吸收。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">链条垂度多少合适？</h3>
            <p class="text-muted-foreground mt-1">
              水平或倾角不大的传动，松边下垂量 f ≈ (1%~2%)×中心距（垂直或大倾角取更小值）。
              过紧会显著增大轴与轴承的附加载荷并加速铰链磨损；过松则易产生振动、冲击甚至跳齿。
              安装时常把中心距预留 −0.5%~−1% 作为垂度补偿，或直接配张紧轮/导板。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">链轮磨损怎么判断？什么时候换？</h3>
            <p class="text-muted-foreground mt-1">
              核心指标是节距伸长率：取整 10 节或 20 节测量长度，与公称长度（节数×节距，例如 08B 的 20 节 = 20×12.7 = 254mm）比较，
              伸长率 =（实测−公称）/公称 ≥ 3% 即应更换链条（高速重载建议按 2% 更保守）。链轮齿形磨成钩状或两侧不对称时要同步更换；
              新链条配旧链轮会因节距不匹配而加速磨损。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">链条张紧有哪些方式？</h3>
            <p class="text-muted-foreground mt-1">
              首选调整中心距（滑轨电机座）；空间受限时用张紧轮或惰轮压松边——应布置在靠近小链轮一侧的松边，
              直径不小于小链轮；振动大或空间紧凑时用导板限位。链速 v = Z₁n₁p/60000，超过 15 m/s 属高速链，
              需校核多边形效应与动载，并采用油浴或压力润滑。
            </p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          相关工具
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground">
          <li><NuxtLink to="/tools/gear-ratio-reducer" class="text-primary hover:underline">减速比计算</NuxtLink>：链轮速比同样按 Z₂/Z₁ 换算转速与扭矩；</li>
          <li><NuxtLink to="/tools/belt-length-calculator" class="text-primary hover:underline">皮带长度计算器</NuxtLink>：带轮直径与中心距对应的带长速算；</li>
          <li><NuxtLink to="/tools/gear-module-calculator" class="text-primary hover:underline">齿轮模数计算器</NuxtLink>：齿轮几何尺寸与中心距速查；</li>
          <li><NuxtLink to="/tools/torque-unit-converter" class="text-primary hover:underline">扭矩单位换算器</NuxtLink>：N·m、kgf·m、lb-ft 互算。</li>
        </ul>
      </div>
    </div>

    <!-- 相关推荐 -->
    <RelatedTools :current-tool-id="'chain-sprocket'" :category="'calculate'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Link, Calculator, Info, Ruler, Wrench, TriangleAlert, CheckCircle,
  Copy, Check, ChevronUp, HelpCircle
} from 'lucide-vue-next'
import { addRecentTool } from '~/composables/useTools'
import { resolveToolIcon } from '~/utils/toolIcons'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'chain-sprocket'
const STORAGE_KEY = 'chain-sprocket.inputs'

// SEO配置
useSeoMeta({
  title: '链条长度计算器 - 链轮节数与中心距速算 | 有条工具',
  description: '免费在线链条长度计算器：链轮齿数/中心距/节距求链条节数 L=2C/p+(Z1+Z2)/2+p((Z2-Z1)/2π)²/C，偶数节优先取整并警示过渡链节，反算实际中心距含垂度补偿-0.5~1%，链速校核与06B/08B/ANSI节距对照表，纯本地计算。',
  keywords: '链条长度计算,链条节数计算,链轮中心距,节距对照表,链速计算,链条垂度,过渡链节,chain length calculator,滚子链计算',
  author: '有条工具',
  ogTitle: '链条长度计算器 - 链轮节数与中心距速算',
  ogDescription: '齿数/中心距/节距求链条节数，偶数节优先取整与反算安装中心距，附节距对照与链速校核。',
  ogUrl: 'https://www.util.cn/tools/chain-sprocket',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '链条长度计算器 - 机械传动速算',
  twitterDescription: '链条节数、中心距反算、垂度补偿与链速校核速算工具。'
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
          name: '链条长度计算器',
          url: 'https://www.util.cn/tools/chain-sprocket',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '链条节数 L = 2C/p + (Z1+Z2)/2 + p((Z2-Z1)/2π)²/C',
            '偶数节优先取整，奇数节过渡链节强度打折警示',
            '由节数反算实际中心距（正算式精确逆解）',
            '垂度补偿 −0.5%~−1% 滑杆得安装中心距',
            '链速 v = Z1·n1·p/60000 校核（<15 m/s 常规）',
            '06B~16B 与 ANSI #25~#50 节距对照表',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '链条长度计算器', item: 'https://www.util.cn/tools/chain-sprocket/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么链条节数要偶数？',
              acceptedAnswer: { '@type': 'Answer', text: '偶数节用标准连接链节（卡簧/锁片）闭合，强度与链板本体相当；奇数节必须加过渡链节（弯板/偏置链节），承受附加弯曲应力，强度通常按链条本体的 80% 或更低评估。设计时先取偶数节再微调中心距。' }
            },
            {
              '@type': 'Question',
              name: '链条垂度多少合适？',
              acceptedAnswer: { '@type': 'Answer', text: '水平或倾角不大的传动，松边下垂量 f ≈ (1%~2%)×中心距，垂直或大倾角取更小。过紧增大轴与轴承载荷并加速磨损，过松易跳齿振动。安装时中心距常预留 −0.5%~−1% 作垂度补偿，或配张紧轮。' }
            },
            {
              '@type': 'Question',
              name: '链轮磨损怎么判断？什么时候换？',
              acceptedAnswer: { '@type': 'Answer', text: '量整 10 或 20 节长度与公称长度（节数×节距，如 08B 20 节 = 254mm）比较，节距伸长率 ≥3% 即更换（高速重载按 2% 更保守）；链轮齿磨成钩状应同步更换，新链不配旧轮。' }
            },
            {
              '@type': 'Question',
              name: '链条张紧有哪些方式？',
              acceptedAnswer: { '@type': 'Answer', text: '首选调整中心距；空间受限用张紧轮/惰轮压松边（布置在靠近小链轮一侧的松边，直径不小于小链轮）；振动大用导板限位。链速 v = Z1n1p/60000 超过 15 m/s 需专门校核与加强润滑。' }
            }
          ]
        }
      ]
    })
  }]
})

const trackToolUsage = () => { addRecentTool(TOOL_ID) }
onMounted(() => {
  trackToolUsage()
  loadInputs()
})

const toolIcon = resolveToolIcon('Link', 'calculate')

// ==== PURE-FNS-START ====
// 链条理论节数（以节距数计）：L = 2C/p + (Z1+Z2)/2 + p·((Z2-Z1)/2π)²/C
function chainLinksTheory(cMm: number, pMm: number, z1: number, z2: number): number | null {
  if (!Number.isFinite(cMm) || !Number.isFinite(pMm) || !Number.isInteger(z1) || !Number.isInteger(z2)) return null
  if (cMm <= 0 || pMm <= 0 || z1 < 1 || z2 < 1) return null
  const k = Math.pow((z2 - z1) / (2 * Math.PI), 2)
  return 2 * cMm / pMm + (z1 + z2) / 2 + k * pMm / cMm
}

// 偶数优先取整：L偶 = 2 × round(L/2)
function evenLinks(lPitches: number): number | null {
  if (!Number.isFinite(lPitches) || lPitches <= 0) return null
  return 2 * Math.round(lPitches / 2)
}

// 由节数反算中心距（正算式的精确逆解）：
// C = p/4 × [L − (Z1+Z2)/2 + √((L − (Z1+Z2)/2)² − 8((Z2−Z1)/2π)²)]
function centerFromLinks(links: number, pMm: number, z1: number, z2: number): number | null {
  if (!Number.isFinite(links) || !Number.isFinite(pMm) || !Number.isInteger(z1) || !Number.isInteger(z2)) return null
  if (links <= 0 || pMm <= 0 || z1 < 1 || z2 < 1) return null
  const k = Math.pow((z2 - z1) / (2 * Math.PI), 2)
  const d = links - (z1 + z2) / 2
  const disc = d * d - 8 * k
  if (disc <= 0) return null
  return pMm / 4 * (d + Math.sqrt(disc))
}

// 垂度补偿：安装中心距 = 理论中心距 × (1 − sagPct/100)
function mountCenter(centerMm: number, sagPct: number): number | null {
  if (!Number.isFinite(centerMm) || !Number.isFinite(sagPct)) return null
  if (centerMm <= 0 || sagPct < 0 || sagPct > 100) return null
  return centerMm * (1 - sagPct / 100)
}

// 链速：v = Z1 × n1 × p / 60000（m/s）
function chainSpeedMs(z1: number, rpm: number, pMm: number): number | null {
  if (!Number.isFinite(z1) || !Number.isFinite(rpm) || !Number.isFinite(pMm)) return null
  if (z1 < 1 || rpm < 0 || pMm <= 0) return null
  return z1 * rpm * pMm / 60000
}

// 节距伸长率（%）：(实测 − 公称) / 公称 × 100
function wearPct(measuredMm: number, nominalMm: number): number | null {
  if (!Number.isFinite(measuredMm) || !Number.isFinite(nominalMm) || nominalMm <= 0 || measuredMm < 0) return null
  return (measuredMm - nominalMm) / nominalMm * 100
}
// ==== PURE-FNS-END ====

// ---------- 状态 ----------
const dir = ref<'forward' | 'reverse'>('forward')
const seoContentVisible = ref(true)
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const z1 = ref<number | null>(17)
const z2 = ref<number | null>(34)
const pitch = ref<number | null>(12.7)
const centerDist = ref<number | null>(500)
const rpm = ref<number | null>(1000)
const linksInput = ref<number | null>(104)
const sagPct = ref<number>(0.5)

// 节距对照（mm）
const metricPitches = [
  { label: '06B', pitch: 9.525 },
  { label: '08B', pitch: 12.7 },
  { label: '10B', pitch: 15.875 },
  { label: '12B', pitch: 19.05 },
  { label: '16B', pitch: 25.4 },
  { label: '20B', pitch: 31.75 }
]
const ansiPitches = [
  { label: 'ANSI #25', pitch: 6.35 },
  { label: 'ANSI #35', pitch: 9.525 },
  { label: 'ANSI #40', pitch: 12.7 },
  { label: 'ANSI #50', pitch: 15.875 }
]

function applyPitch(p: number) {
  pitch.value = p
  trackToolUsage()
}

function teethValid(a: number | null, b: number | null): boolean {
  return Number.isInteger(Number(a)) && Number.isInteger(Number(b))
    && Number(a) >= 6 && Number(a) <= 200 && Number(b) >= 6 && Number(b) <= 200
}

// ---------- 正算结果 ----------
const forwardResult = computed(() => {
  if (!teethValid(z1.value, z2.value)) return null
  const p = Number(pitch.value)
  const c = Number(centerDist.value)
  const a1 = Number(z1.value)
  const a2 = Number(z2.value)
  const theory = chainLinksTheory(c, p, a1, a2)
  if (theory === null) return null
  const even = evenLinks(theory)
  if (even === null) return null
  const back = centerFromLinks(even, p, a1, a2)
  if (back === null) return null
  const mount = mountCenter(back, Number(sagPct.value))
  if (mount === null) return null
  const speed = chainSpeedMs(a1, Number(rpm.value), p)
  // 四舍五入若会得到奇数节，给出过渡链节警示
  const nearest = Math.round(theory)
  let oddWarning = ''
  if (nearest % 2 === 1) {
    oddWarning = `理论值按四舍五入是奇数 ${nearest} 节——本工具已自动改取偶数 ${even} 节（微调中心距吸收偏差）。切勿按奇数节配过渡链节：弯板承受附加弯曲，强度约打 8 折。`
  }
  return {
    linksTheory: theory,
    linksEven: even,
    centerBack: back,
    centerMount: mount,
    devPct: (back - c) / c * 100,
    speed,
    oddWarning
  }
})

// ---------- 反算结果 ----------
const reverseResult = computed(() => {
  if (!teethValid(z1.value, z2.value)) return null
  const p = Number(pitch.value)
  const links = Number(linksInput.value)
  const a1 = Number(z1.value)
  const a2 = Number(z2.value)
  const center = centerFromLinks(links, p, a1, a2)
  if (center === null) return null
  const mount = mountCenter(center, Number(sagPct.value))
  if (mount === null) return null
  let oddWarning = ''
  if (Number.isInteger(links) && links % 2 === 1) {
    oddWarning = `节数 ${links} 为奇数：需要过渡链节（弯板/偏置链节）闭合，强度约打 8 折，建议改用相邻偶数节数并调整中心距或加张紧轮。`
  }
  return { center, centerMount: mount, oddWarning }
})

// ---------- 复制 ----------
const copyText = computed(() => {
  if (dir.value === 'forward' && forwardResult.value) {
    const r = forwardResult.value
    return `链条正算：Z1=${trimNum(Number(z1.value))}、Z2=${trimNum(Number(z2.value))}、p=${trimNum(Number(pitch.value))}mm、C=${trimNum(Number(centerDist.value))}mm → 理论 L=${fmtNum(r.linksTheory, 4)} 节，取偶 ${r.linksEven} 节；反算中心距 ${fmtNum(r.centerBack, 2)}mm（偏差 ${fmtNum(r.devPct, 2)}%），安装中心距（垂度 −${trimNum(Number(sagPct.value))}%）${fmtNum(r.centerMount, 2)}mm${r.speed !== null ? `，链速 ${fmtNum(r.speed, 2)} m/s` : ''}`
  }
  if (dir.value === 'reverse' && reverseResult.value) {
    const r = reverseResult.value
    return `链条反算：L=${trimNum(Number(linksInput.value))} 节、Z1=${trimNum(Number(z1.value))}、Z2=${trimNum(Number(z2.value))}、p=${trimNum(Number(pitch.value))}mm → 理论中心距 ${fmtNum(r.center, 2)}mm，安装中心距（垂度 −${trimNum(Number(sagPct.value))}%）${fmtNum(r.centerMount, 2)}mm${r.oddWarning ? `；${r.oddWarning}` : ''}`
  }
  return ''
})

const copyResults = async () => {
  const text = copyText.value
  if (!text) return
  trackToolUsage()
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    if (copyTimer !== null) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
    alert('当前环境不支持剪贴板，请手动选择文本复制')
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 输入持久化（键前缀为工具 id，仅 onMounted 读取 / watch 写入） ----------
const refMap = { z1, z2, pitch, centerDist, rpm, linksInput, sagPct }

function persistInputs() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      dir: dir.value,
      z1: z1.value,
      z2: z2.value,
      pitch: pitch.value,
      centerDist: centerDist.value,
      rpm: rpm.value,
      linksInput: linksInput.value,
      sagPct: sagPct.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}

function loadInputs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (data && typeof data === 'object') {
      if (data.dir === 'forward' || data.dir === 'reverse') dir.value = data.dir
      for (const k of Object.keys(refMap) as Array<keyof typeof refMap>) {
        const v = data[k]
        if (typeof v === 'number' && Number.isFinite(v)) {
          (refMap[k] as unknown as { value: number }).value = v
        }
      }
    }
  } catch (e) { /* 忽略解析失败 */ }
}

watch([dir, z1, z2, pitch, centerDist, rpm, linksInput, sagPct], () => {
  persistInputs()
})

// ---------- 格式化 ----------
function trimNum(x: number): string {
  if (!Number.isFinite(x)) return '—'
  const fixed = (Math.round(x * 1000) / 1000).toFixed(3)
  return fixed.replace(/0+$/, '').replace(/\.$/, '')
}

function fmtNum(x: number, digits = 2): string {
  if (!Number.isFinite(x)) return '—'
  const fixed = x.toFixed(digits)
  if (fixed.includes('.')) {
    return fixed.replace(/0+$/, '').replace(/\.$/, '')
  }
  return fixed
}
</script>
