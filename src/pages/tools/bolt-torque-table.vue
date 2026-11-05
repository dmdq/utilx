<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Wrench class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">螺栓拧紧扭矩对照</h1>
          <p class="text-sm text-muted-foreground mt-1">公制粗牙 M3-M24 × 8.8/10.9/12.9 级 × 摩擦系数 μ 三维速查，扭矩-预紧力反算与屈服利用率校核</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线螺栓拧紧扭矩对照表：按 M3-M24 公称直径、8.8/10.9/12.9 性能等级与摩擦系数 μ（0.10 润滑 / 0.14 常规 / 0.20 粗糙）
        三个维度给出装配扭矩与对应预紧力；另附反算模式，输入扭矩按工程近似 F = T/(0.2×d) 估算预紧力，
        并对照 8.8 级屈服夹紧力上限给出利用率。适合机修钳工、装配调试与结构设计做车间速查。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
      <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <AlertTriangle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed text-foreground">
          以 <span class="font-semibold">VDI 2230 与紧固件厂商手册为准，表值为 μ 口径参考</span>：真实装配扭矩对摩擦系数极其敏感（μ=0.10~0.20 差近一倍），
          不同厂家速查表之间互差 ±10% 属正常。重要连接请按图样规定的扭矩/转角要求与现行标准执行。
        </p>
      </div>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        数据口径：表值由 VDI 2230 摩擦扭矩公式 T = F·(0.16P + 0.58·d₂·μ<sub>G</sub> + 0.5·D<sub>Km</sub>·μ<sub>K</sub>) 按
        <span class="text-foreground font-medium">约 70% 屈服利用率（F = 0.70·σ<sub>s</sub>·A<sub>s</sub>，一般机械装配口径）</span>自核生成，
        锚点行 M8 8.8 级 μ=0.14 ≈ 25 N·m、M10 8.8 级 ≈ 49 N·m，与公开速查表及厂商目录互相印证（多源互差 ±10% 内）。
        预紧力列不随 μ 变化（摩擦只影响「拧进去多少扭矩」，不影响「最后剩多少夹紧力」的目标量级）。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主区：查表 / 反算 双模式 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="grid grid-cols-2 gap-1.5">
          <button
            @click="mode = 'table'"
            :class="mode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 rounded-lg text-sm font-medium transition-all"
          >扭矩查表（M3-M24）</button>
          <button
            @click="mode = 'calc'"
            :class="mode === 'calc' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 rounded-lg text-sm font-medium transition-all"
          >反算预紧力（T → F）</button>
        </div>

        <!-- 查表模式 -->
        <div v-if="mode === 'table'" class="space-y-4">
          <div>
            <p class="text-xs text-muted-foreground mb-1.5">性能等级（前位×100=抗拉强度 MPa，后位×10=屈强比）</p>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="g in GRADES"
                :key="g.id"
                @click="grade = g.id"
                class="py-2 rounded-lg border text-sm font-medium transition"
                :class="grade === g.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
              >
                {{ g.id }} 级 <span class="text-[10px] font-normal opacity-75">σs {{ g.sy }} MPa</span>
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">规格</th>
                  <th class="py-2 pr-3 font-medium">粗牙螺距 mm</th>
                  <th class="py-2 pr-3 font-medium">应力截面积 mm²</th>
                  <th class="py-2 pr-3 font-medium">预紧力 kN</th>
                  <th class="py-2 pr-3 font-medium">μ=0.10 润滑</th>
                  <th class="py-2 pr-3 font-medium bg-primary/5">μ=0.14 常规</th>
                  <th class="py-2 font-medium">μ=0.20 粗糙</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="size in BOLT_SIZES"
                  :key="size.spec"
                  @click="selectedSpec = size.spec"
                  class="border-b border-border/50 cursor-pointer hover:bg-muted/50 transition"
                  :class="selectedSpec === size.spec ? 'bg-primary/10' : ''"
                >
                  <td class="py-2.5 pr-3 font-semibold text-foreground whitespace-nowrap">
                    {{ size.spec }}
                    <span v-if="selectedSpec === size.spec" class="ml-2 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-medium">已选</span>
                  </td>
                  <td class="py-2.5 pr-3 font-mono text-muted-foreground">{{ size.p.toFixed(2).replace(/\.00$/, '') }}</td>
                  <td class="py-2.5 pr-3 font-mono text-muted-foreground">{{ fmt1(stressArea(size.d, size.p)) }}</td>
                  <td class="py-2.5 pr-3 font-mono text-foreground">{{ fmt1(preloadForceN(size, syOf(grade)) / 1000) }}</td>
                  <td class="py-2.5 pr-3 font-mono text-foreground">{{ fmtTorque(assemblyTorqueNm(size, syOf(grade), 0.10)) }}</td>
                  <td class="py-2.5 pr-3 font-mono text-foreground bg-primary/5 font-semibold">{{ fmtTorque(assemblyTorqueNm(size, syOf(grade), 0.14)) }}</td>
                  <td class="py-2.5 font-mono text-foreground">{{ fmtTorque(assemblyTorqueNm(size, syOf(grade), 0.20)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p class="text-xs text-muted-foreground leading-relaxed">
              扭矩单位 N·m。点击行选中规格，切到「反算预紧力」按该规格校核。同一规格 μ=0.20 的扭矩约为 μ=0.10 的 1.6~1.9 倍——
              拧紧前先判断摩擦状态再选列。
            </p>
            <button
              @click="copyTsv"
              class="px-3 py-1.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-xs font-medium text-foreground transition whitespace-nowrap"
            >
              <CheckCircle v-if="copyStatus === 'ok'" class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-green-600" />
              <Copy v-else class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-primary" />
              {{ copyStatus === 'ok' ? '已复制' : '复制本表 TSV' }}
            </button>
          </div>
        </div>

        <!-- 反算模式 -->
        <div v-else class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="btt-torque" class="block text-sm font-medium text-foreground mb-1.5">拧紧扭矩 T（N·m）</label>
              <input
                id="btt-torque"
                v-model.number="calcTorque"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 40"
              >
            </div>
            <div>
              <label for="btt-size" class="block text-sm font-medium text-foreground mb-1.5">螺栓规格</label>
              <select
                id="btt-size"
                v-model="selectedSpec"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option v-for="size in BOLT_SIZES" :key="size.spec" :value="size.spec">{{ size.spec }}（粗牙 ×{{ size.p }}）</option>
              </select>
            </div>
          </div>

          <div v-if="calcValid && selectedSize" class="space-y-3">
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <p class="text-sm text-muted-foreground mb-1">反算预紧力（K=0.2 工程近似口径）</p>
              <p class="text-3xl font-bold text-primary">
                {{ fmt0(backCalcForceN(calcTorque, selectedSize.d)) }} <span class="text-sm font-normal">N</span>
                <span class="text-base font-semibold">≈ {{ fmt1(backCalcForceN(calcTorque, selectedSize.d) / 1000) }} kN</span>
              </p>
              <p class="text-[11px] leading-relaxed text-muted-foreground mt-2">
                F = T ÷ (0.2×d)：0.2 为综合摩擦系数 K 的工程近似（K = 扭矩系数，μ≈0.14 时 K≈0.19~0.20）。
                与查表公式相比偏粗，只做量级校核；精确值应按实际摩擦系数用 VDI 2230 公式算。
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="p-4 rounded-lg border border-border bg-muted/50">
                <p class="text-sm font-medium text-foreground mb-2">8.8 级夹紧力上限（{{ selectedSpec }}）</p>
                <p class="text-2xl font-bold text-foreground">{{ fmt1(clampLimitN(selectedSize) / 1000) }} <span class="text-sm font-normal">kN</span></p>
                <p class="text-xs text-muted-foreground mt-1 leading-relaxed">
                  = 0.9 × σ<sub>s</sub>(640 MPa) × A<sub>s</sub>({{ fmt1(stressArea(selectedSize.d, selectedSize.p)) }} mm²)，即 90% 屈服的装配上限口径。
                </p>
              </div>
              <div class="p-4 rounded-lg border border-border bg-muted/50">
                <p class="text-sm font-medium text-foreground mb-2">利用率</p>
                <p class="text-2xl font-bold" :class="utilCls(utilPct)">
                  {{ fmt1(utilPct) }}%
                </p>
                <div class="h-2 rounded-full bg-border mt-2 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="utilPct > 100 ? 'bg-red-500' : utilPct > 85 ? 'bg-amber-500' : 'bg-primary'"
                    :style="{ width: Math.min(utilPct, 100) + '%' }"
                  ></div>
                </div>
                <p class="text-xs text-muted-foreground mt-2 leading-relaxed">{{ utilVerdict }}</p>
              </div>
            </div>
          </div>

          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">暂无法计算</p>
              <p class="text-xs text-muted-foreground mt-1">请输入大于 0 的扭矩 T（N·m），并选择螺栓规格。</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 性能等级读法 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <ShieldAlert class="w-5 h-5 mr-2 text-primary" /> 性能等级怎么读
          </h2>
          <div class="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5 text-xs text-muted-foreground leading-relaxed">
            <p><span class="font-mono text-foreground font-semibold">8.8</span> → 抗拉 800 MPa · 屈服 640 MPa</p>
            <p><span class="font-mono text-foreground font-semibold">10.9</span> → 抗拉 1000 MPa · 屈服 940 MPa</p>
            <p><span class="font-mono text-foreground font-semibold">12.9</span> → 抗拉 1200 MPa · 屈服 1100 MPa</p>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            前位数字 × 100 = 抗拉强度（MPa），小数点后 × 10 × 前位 = 屈服强度。同规格换等级，扭矩大致按屈服强度等比放大。
          </p>
          <NuxtLink
            to="/wiki/bolt-grade-torque"
            class="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink class="w-3.5 h-3.5" /> 详见词条：螺栓性能等级与扭矩
          </NuxtLink>
        </div>

        <!-- 摩擦去哪了 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Gauge class="w-5 h-5 mr-2 text-primary" /> 扭矩九成变摩擦
          </h2>
          <div class="bg-muted/50 rounded-lg p-3 border border-border space-y-2">
            <div class="flex items-center gap-2 text-xs">
              <span class="w-24 text-muted-foreground">螺纹副摩擦</span>
              <div class="flex-1 h-2 rounded-full bg-border overflow-hidden"><div class="h-full bg-primary/70" style="width: 40%"></div></div>
              <span class="font-mono text-foreground">≈40%</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="w-24 text-muted-foreground">支承面摩擦</span>
              <div class="flex-1 h-2 rounded-full bg-border overflow-hidden"><div class="h-full bg-primary/70" style="width: 50%"></div></div>
              <span class="font-mono text-foreground">≈50%</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="w-24 text-muted-foreground">变为夹紧力</span>
              <div class="flex-1 h-2 rounded-full bg-border overflow-hidden"><div class="h-full bg-green-500" style="width: 10%"></div></div>
              <span class="font-mono text-foreground">≈10%</span>
            </div>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            典型分布：约四成耗在螺纹副摩擦、五成耗在螺栓头/螺母支承面摩擦，真正拉伸螺杆变成夹紧力的只有一成左右——
            所以润滑状态（μ 变小）会让同样扭矩打出大得多的预紧力，润滑螺栓必须降扭矩。
          </p>
        </div>

        <!-- 装配红线 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <AlertTriangle class="w-5 h-5 mr-2 text-amber-500" /> 装配红线
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">扭矩+转角法更稳</span>：先用小扭矩贴合，再转固定角度利用弹性区，受摩擦波动影响比死拧一个扭矩值小，重要连接推荐。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">复用红线</span>：螺栓已拉伸变形（螺纹拉毛、伸长）、反复拆装的高强螺栓必须换新；12.9 级有氢脆敏感性，断裂多为过拧。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">拧后标记</span>：关键连接拧紧后在螺母/螺栓上划线做防松检查标记，定期核对是否转动。</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 显著免责条 -->
    <div class="flex items-start gap-2 p-4 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
        免责声明：本页表值按 VDI 2230 口径（约 70% 屈服利用率、μ 分档）自核生成，仅供车间速查与量级校核；
        正式装配以 VDI 2230、紧固件厂商手册与图样规定为准，安全相关连接请用扭矩扳手并做工艺验证。
      </p>
    </div>

    <!-- SEO 内容区（可折叠） -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>螺栓拧紧扭矩对照表是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          螺栓拧紧扭矩对照表是一面给机修钳工、装配工与结构设计的速查工具：把公制粗牙 M3-M24、性能等级 8.8/10.9/12.9
          与摩擦系数 μ（0.10 润滑 / 0.14 常规 / 0.20 粗糙）三个维度交叉成表，每格给出装配扭矩，并附同口径预紧力列；
          反算模式可从已知扭矩按 F = T/(0.2×d) 估算预紧力，并对照 8.8 级屈服夹紧力上限给出利用率，判断「拧到位了没有」。
          表值按 VDI 2230 口径自核生成，以 VDI 2230 与紧固件厂商手册为准，仅作 μ 口径参考。全部计算在浏览器本地完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">性能等级 8.8 / 10.9 / 12.9 怎么读？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          螺栓头上的性能等级由两部分组成：前位数字 × 100 = 公称抗拉强度（MPa），小数点后的数字 × 10 × 前位 = 公称屈服强度（MPa）。
          所以 8.8 级 = 抗拉 800 MPa、屈强比 0.8 → 屈服 640 MPa；10.9 级 = 抗拉 1000 MPa、屈服 940 MPa；12.9 级 = 抗拉 1200 MPa、屈服 1100 MPa。
          同一规格换更高等级，预紧力与扭矩大致按屈服强度等比放大（本表三档即按 640/940/1100 换算）。
          更多细节参见<NuxtLink to="/wiki/bolt-grade-torque" class="text-primary hover:underline">螺栓性能等级与扭矩</NuxtLink>词条。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么拧紧扭矩九成都变成了摩擦？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          拧紧时输入的扭矩要克服三处阻力：螺纹副摩擦（约占 40%）、螺栓头或螺母支承面摩擦（约占 50%），
          剩下只有一成左右真正转化为螺杆拉伸——也就是有用的夹紧力。VDI 2230 把这两处摩擦分开记为 μ<sub>G</sub>（螺纹）与 μ<sub>K</sub>（支承面），
          表达式 T = F·(0.16P + 0.58·d₂·μ<sub>G</sub> + 0.5·D<sub>Km</sub>·μ<sub>K</sub>)。这解释了三个常见现象：
          涂油/MoS₂ 后同样的扭矩会打出远超预期的预紧力（必须降扭矩约 20~30%）；表面粗糙、未镀层螺栓要加大扭矩；
          以及为什么「凭手感拧到断」往往发生在螺纹已锈蚀再润滑的旧件上——摩擦状态一变，扭矩-预紧力关系整个漂移。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">扭矩+转角法是什么？为什么比死拧扭矩稳？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          扭矩+转角法（T/A 法）分两步收尾：先按一个较小贴合扭矩（约 20%~30% 最终扭矩）把螺栓副贴合消除间隙，
          再按规定的角度再拧——角度与螺杆伸长量成正比，直接对应预紧力，几乎不受摩擦系数波动影响。
          死拧一个扭矩值时，摩擦 ±20% 的波动会让最终预紧力差出 ±30%~40%；转角法则把这份不确定性大部分甩掉。
          发动机连杆螺栓、缸盖螺栓等关键连接普遍采用扭矩+转角（甚至多次转角）工艺；车间没有转角工具时，
          至少按「润滑降扭矩、粗糙加扭矩」选对摩擦列，并用扭矩扳手代替气动冲击扳手收尾。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">旧螺栓能不能复用？复用红线在哪？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          普通低载荷、非关键部位的 8.8 级螺栓，拆下后螺纹完好、无伸长可以复用；但下面几条红线碰不得：
          ① 螺纹拉毛、拉长（用螺母徒手能拧到很紧才吃劲，说明中径已拉大）——材料已过屈服，必换；
          ② 高强螺栓（≥10.9 级）反复拆装后建议直接换新，复用等于埋雷；
          ③ 12.9 级有氢脆敏感性，酸洗/电镀后未除氢的件禁止用于高预紧场合，断裂常常毫无预兆；
          ④ 承受交变载荷的关键连接（连杆、主轴、吊装）螺栓按一次性使用设计，不允许回用。
          拧紧后划线做标记，巡检时一眼能看出松动。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">M8 螺栓 8.8 级拧多少牛·米？</h3>
            <p class="text-sm text-muted-foreground mt-1">常规摩擦（μ≈0.14、干态商用件）约 20~25 N·m（本表 25）；涂油或 MoS₂ 润滑按 μ≈0.10 降到约 19~21 N·m；表面粗糙未镀层按 μ≈0.20 加到约 34 N·m。拿不准摩擦状态时宁可取润滑列的低值，用扭矩扳手收尾。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">涂了润滑油后扭矩表还能直接用吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不能照搬 μ=0.14 列。润滑使摩擦系数降到 0.10 左右，同样的扭矩预紧力会高出约 30%——要么按本表 μ=0.10 列降扭矩，要么按「扭矩 × 0.75」粗折。润滑螺栓过拧是高强螺栓断裂的常见原因。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">12.9 级扭矩最大，为什么反而更容易断？</h3>
            <p class="text-sm text-muted-foreground mt-1">12.9 级强度高但延展性与韧性低，且对氢脆敏感：过拧、氢脆、疲劳叠加时往往在屈服前突然断裂，没有明显预兆。装配 12.9 级应精确控扭矩（±5% 内的扭矩扳手）、避免冲击扳手，电镀件确认已做除氢处理。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">表里的值能直接用于关键连接吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不能。本页表值按 VDI 2230 口径自核生成，仅供车间速查与量级校核；压力容器、吊装、车辆行走机构等安全相关连接，请以图样规定扭矩/转角、VDI 2230 标准文本与紧固件厂商手册为准，并做工艺验证。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'bolt-torque-table'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Wrench, Info, AlertTriangle, ChevronUp, ChevronDown,
  Copy, CheckCircle, ExternalLink, ShieldAlert, Gauge
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// ---------- 数据口径（自核依据，详见交付说明） ----------
// 公式：VDI 2230 摩擦扭矩 T = F·(0.16·P + 0.58·d2·μG + 0.5·D_Km·μK)，取 μG = μK = μ。
// 预紧力：F = 0.70·σs·As（约 70% 屈服利用率，一般机械装配口径）。
// 自核锚点（μ=0.14）：M8 8.8 级 ≈ 24.7 N·m（公开速查表 anzugsmoment.de/DSM 同表 24.9、
//   厂商目录 Schrauben-Jäger 90% 屈服口径 26，多源互差 ±10% 内）；M10 8.8 级 ≈ 48.6（速查表 49）；
//   M12 10.9 级 ≈ 122（速查表 121）。D_Km 取六角头支承面 dw(ISO 4014) 与通孔 dh 平均。
const K_D2 = 0.649519   // d2 = d − 0.649519·P（ISO 60° 牙型中径系数）
const K_D3 = 1.226869   // d3 = d − 1.226869·P（小径系数，用于应力截面积）
const UTILIZATION = 0.70

const GRADES = [
  { id: '8.8', sy: 640 },
  { id: '10.9', sy: 940 },
  { id: '12.9', sy: 1100 }
]

// dkm: D_Km ≈ (dw + dh)/2，dw 取 ISO 4014 六角头支承面最小值，dh 取通孔近似 d+1~2
const BOLT_SIZES = [
  { spec: 'M3', d: 3, p: 0.5, dkm: 4.2 },
  { spec: 'M4', d: 4, p: 0.7, dkm: 5.4 },
  { spec: 'M5', d: 5, p: 0.8, dkm: 6.4 },
  { spec: 'M6', d: 6, p: 1, dkm: 7.9 },
  { spec: 'M8', d: 8, p: 1.25, dkm: 10.3 },
  { spec: 'M10', d: 10, p: 1.5, dkm: 12.8 },
  { spec: 'M12', d: 12, p: 1.75, dkm: 14.8 },
  { spec: 'M14', d: 14, p: 2, dkm: 17.6 },
  { spec: 'M16', d: 16, p: 2, dkm: 20 },
  { spec: 'M18', d: 18, p: 2.5, dkm: 22.7 },
  { spec: 'M20', d: 20, p: 2.5, dkm: 24.9 },
  { spec: 'M22', d: 22, p: 2.5, dkm: 27.9 },
  { spec: 'M24', d: 24, p: 3, dkm: 29.7 }
]

// 应力截面积 As = π/4·((d2+d3)/2)²（ISO 898-1 口径）
function stressArea(d, p) {
  if (!(d > 0) || !(p > 0)) return null
  const d2 = d - K_D2 * p
  const d3 = d - K_D3 * p
  const dm = (d2 + d3) / 2
  return (Math.PI / 4) * dm * dm
}

// 预紧力 F = ν·σs·As（N）
function preloadForceN(size, sy) {
  const as = stressArea(size.d, size.p)
  if (as === null || !(sy > 0)) return null
  return UTILIZATION * sy * as
}

// 力臂 = 0.16P + 0.58·d2·μG + 0.5·D_Km·μK（mm）
function leverArmMm(size, mu) {
  const d2 = size.d - K_D2 * size.p
  return 0.16 * size.p + 0.58 * d2 * mu + 0.5 * size.dkm * mu
}

// 装配扭矩 T = F·力臂 / 1000（N·m）
function assemblyTorqueNm(size, sy, mu) {
  const f = preloadForceN(size, sy)
  if (f === null || !(mu > 0)) return null
  return (f * leverArmMm(size, mu)) / 1000
}

// 屈服夹紧力上限：0.9·σs·As（N），默认 8.8 级（与查表口径一致）
function clampLimitN(size, sy = 640) {
  const as = stressArea(size.d, size.p)
  if (as === null || !(sy > 0)) return null
  return 0.9 * sy * as
}

// 扭矩-预紧力反算：F = T/(0.2×d)（K=0.2 综合摩擦系数工程近似），T N·m、d mm → N
function backCalcForceN(torqueNm, dMm) {
  if (!(torqueNm > 0) || !(dMm > 0)) return null
  return (torqueNm * 1000) / (0.2 * dMm)
}

// 利用率 %（反算预紧力 / 屈服夹紧力上限）
function utilizationPct(forceN, limitN) {
  if (forceN === null || limitN === null || !(limitN > 0)) return null
  return (forceN / limitN) * 100
}

// 显示：扭矩 <10 保留 1 位小数，否则取整；避免浮点尾差
function fmtTorque(t) {
  if (t === null || !Number.isFinite(t)) return '—'
  return t < 10 ? String(Math.round(t * 10) / 10) : String(Math.round(t))
}
function fmt1(x) {
  if (x === null || !Number.isFinite(x)) return '—'
  return String(Math.round(x * 10) / 10)
}
function fmt0(x) {
  if (x === null || !Number.isFinite(x)) return '—'
  return String(Math.round(x))
}

// TSV 导出：当前等级全表
function buildTsv(gradeId, sy) {
  const header = ['规格', '螺距mm', '应力截面积mm2', '预紧力kN', 'Tμ0.10Nm', 'Tμ0.14Nm', 'Tμ0.20Nm'].join('\t')
  const lines = BOLT_SIZES.map((s) => {
    const as = stressArea(s.d, s.p)
    const fk = preloadForceN(s, sy) / 1000
    return [
      s.spec, s.p, fmt1(as), fmt1(fk),
      fmtTorque(assemblyTorqueNm(s, sy, 0.10)),
      fmtTorque(assemblyTorqueNm(s, sy, 0.14)),
      fmtTorque(assemblyTorqueNm(s, sy, 0.20))
    ].join('\t')
  })
  return [header].concat(lines).join('\n')
}
// ==== PURE-FNS-END ====

// ---------- SEO ----------
useSeoMeta({
  title: '螺栓拧紧扭矩对照表 - M3-M24 8.8/10.9/12.9级预紧扭矩速查',
  description: '在线螺栓拧紧扭矩对照表：M3-M24 公制粗牙 × 8.8/10.9/12.9 性能等级 × 摩擦系数 μ(0.10润滑/0.14常规/0.20粗糙) 三维速查，VDI 2230 口径自核，附扭矩-预紧力反算 F=T/(0.2×d)、8.8级屈服夹紧力上限与利用率校核、性能等级读法与扭矩转角法说明，纯浏览器本地运行。',
  keywords: '螺栓扭矩表,拧紧扭矩,m8扭矩多少牛米,8.8级螺栓扭矩,10.9级扭矩,预紧力计算,VDI2230,螺栓性能等级',
  author: '有条工具',
  ogTitle: '螺栓拧紧扭矩对照表 - M3-M24 8.8/10.9/12.9级预紧扭矩速查 | 有条工具',
  ogDescription: 'M3-M24 × 8.8/10.9/12.9 级 × μ 摩擦分档的装配扭矩速查表，附扭矩-预紧力反算与利用率校核。',
  ogUrl: 'https://www.util.cn/tools/bolt-torque-table',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '螺栓拧紧扭矩对照表',
  twitterDescription: 'M3-M24 × 8.8/10.9/12.9 级 × μ 摩擦分档装配扭矩速查，扭矩-预紧力反算与利用率校核。'
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
          name: '螺栓拧紧扭矩对照表',
          url: 'https://www.util.cn/tools/bolt-torque-table',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'M3-M24 × 8.8/10.9/12.9 级 × μ(0.10/0.14/0.20) 三维扭矩速查表',
            '预紧力 F=0.70·σs·As 同表对照列',
            '扭矩-预紧力反算 F=T/(0.2×d) 工程近似',
            '8.8 级屈服夹紧力上限与利用率校核',
            '性能等级读法（前位×100抗拉、后位×10屈强比）',
            '扭矩+转角法与旧螺栓复用红线说明',
            'TSV 复制导出',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '螺栓拧紧扭矩对照', item: 'https://www.util.cn/tools/bolt-torque-table' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'M8 螺栓 8.8 级拧多少牛·米？',
              acceptedAnswer: { '@type': 'Answer', text: '常规摩擦（μ≈0.14、干态商用件）约 20-25 N·m；涂油或二硫化钼润滑按 μ≈0.10 降到约 19-21 N·m；表面粗糙未镀层按 μ≈0.20 加到约 34 N·m。拿不准时取润滑列低值并用扭矩扳手收尾。' }
            },
            {
              '@type': 'Question',
              name: '涂了润滑油后扭矩表还能直接用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能照搬 μ=0.14 列。润滑使摩擦系数降到 0.10 左右，同样扭矩的预紧力会高出约 30%，应按 μ=0.10 列降扭矩（约 ×0.75），否则容易过拧。' }
            },
            {
              '@type': 'Question',
              name: '12.9 级扭矩最大，为什么反而更容易断？',
              acceptedAnswer: { '@type': 'Answer', text: '12.9 级强度高但延展性低且对氢脆敏感，过拧、氢脆、疲劳叠加时常在屈服前突然断裂。应精确控扭矩、避免冲击扳手，电镀件确认除氢处理。' }
            },
            {
              '@type': 'Question',
              name: '表里的值能直接用于关键连接吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。表值按 VDI 2230 口径自核生成，仅供车间速查与量级校核；安全相关连接以图样规定扭矩/转角、VDI 2230 标准文本与紧固件厂商手册为准，并做工艺验证。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'bolt-torque-table'
const SETTINGS_KEY = 'bolt-torque-table-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 状态 ----------
const mode = ref('table')            // 'table' 查表 | 'calc' 反算
const grade = ref('8.8')
const selectedSpec = ref('M10')
const calcTorque = ref(40)
const copyStatus = ref('idle')
const seoContentVisible = ref(true)

const syOf = (id) => {
  const g = GRADES.find((x) => x.id === id)
  return g ? g.sy : 640
}
const selectedSize = computed(() => BOLT_SIZES.find((s) => s.spec === selectedSpec.value) || null)

const calcValid = computed(() => Number.isFinite(calcTorque.value) && calcTorque.value > 0)
const utilPct = computed(() => {
  if (!calcValid.value || !selectedSize.value) return null
  const f = backCalcForceN(calcTorque.value, selectedSize.value.d)
  return utilizationPct(f, clampLimitN(selectedSize.value))
})
const utilVerdict = computed(() => {
  const v = utilPct.value
  if (v === null) return ''
  if (v > 100) return '已超过 90% 屈服上限——按此扭矩必过拧，立即降低扭矩或改用润滑列。'
  if (v > 85) return '接近屈服上限，只建议在扭矩扳手精确控扭且有经验收要求时使用。'
  if (v >= 50) return '一般机械装配的合理区间（50%~85%），兼顾防松与不滑丝。'
  return '利用率偏低——连接偏保守，振动场合注意补充防松措施（垫圈、螺纹胶）。'
})
const utilCls = (v) => {
  if (v === null) return 'text-muted-foreground'
  if (v > 100) return 'text-red-500'
  if (v > 85) return 'text-amber-600 dark:text-amber-400'
  return 'text-primary'
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 复制 TSV（clipboard + alert） ----------
let copyTimer = null
async function copyTsv() {
  const text = buildTsv(grade.value, syOf(grade.value))
  try {
    await navigator.clipboard.writeText(text)
    copyStatus.value = 'ok'
    trackEvent('工具结果', '复制', TOOL_ID)
  } catch (err) {
    copyStatus.value = 'fail'
    alert('复制失败：浏览器未授权剪贴板，请手动选择表格复制。')
  }
  if (copyTimer !== null) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copyStatus.value = 'idle'; copyTimer = null }, 1600)
}

// ---------- 设置持久化（localStorage，键前缀=工具 id，仅 onMounted/交互回调） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (s.mode === 'table' || s.mode === 'calc') mode.value = s.mode
    if (GRADES.some((g) => g.id === s.grade)) grade.value = s.grade
    if (BOLT_SIZES.some((b) => b.spec === s.selectedSpec)) selectedSpec.value = s.selectedSpec
    if (Number.isFinite(s.calcTorque) && s.calcTorque > 0) calcTorque.value = s.calcTorque
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([mode, grade, selectedSpec, calcTorque], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      mode: mode.value,
      grade: grade.value,
      selectedSpec: selectedSpec.value,
      calcTorque: calcTorque.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
})
</script>
