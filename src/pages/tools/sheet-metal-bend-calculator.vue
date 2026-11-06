<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Layers class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">钣金展开计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">K 因子 / 折弯补偿 BA / 折弯扣除 BD 三法并列，单弯与多弯累加展开长度</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入板厚 t、内半径 R、弯曲角 θ 与 K 因子，同时给出折弯补偿 BA = θ·(R+K·t)、外退让 OSSB = tan(θ/2)·(R+t)、
        折弯扣除 BD = 2·OSSB − BA 三组数值；按外模线口径 L = A + B − BD 计算展开长度，并列出
        「平面段 + 弧段」分解式验证恒等。多弯累加模式逐行输入每弯参数与行间平面段，总展开 = Σ平面段 + ΣBA。
        附两弯截面 SVG 示意标注 R / t / K 塑性区位置。全部计算在浏览器本地完成，不上传任何数据。
      </p>
      <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <AlertTriangle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed text-foreground">
          <span class="font-semibold">K 因子与材料参考值为工程经验参考，不是精确查表</span>：
          同一材料不同模具、不同批次也会漂移，正式下料前务必按工厂实际模具试折测量回算 K 因子后再批量展开。
        </p>
      </div>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        公式口径：BA（折弯补偿）= θ<sub>rad</sub> × (R + K·t)；OSSB（外退让）= tan(θ/2) × (R+t)；BD（折弯扣除）= 2×OSSB − BA。
        展开长度统一采用<span class="text-foreground font-medium">外模线口径</span> L = A + B − BD（A/B 为边缘量到外模线交点的尺寸），
        等价于 (A−OSSB) + (B−OSSB) + BA。自核锚点：t=1、R=1、θ=90°、K=0.446 时 BA=2.2714、OSSB=2.0、BD=1.7286，
        A=B=11 时 L=20.2714，两式恒等；θ=60° 时 BA=1.5142（按公式 θ<sub>rad</sub>×1.446 计算）。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主区 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="grid grid-cols-2 gap-1.5">
          <button
            @click="mode = 'single'"
            :class="mode === 'single' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 rounded-lg text-sm font-medium transition-all"
          >单弯计算</button>
          <button
            @click="mode = 'multi'"
            :class="mode === 'multi' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 rounded-lg text-sm font-medium transition-all"
          >多弯累加</button>
        </div>

        <!-- 单弯模式 -->
        <div v-if="mode === 'single'" class="space-y-5">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label for="smb-t" class="block text-xs font-medium text-muted-foreground mb-1.5">板厚 t（mm）</label>
              <input id="smb-t" v-model.number="tMm" type="number" min="0" step="0.5" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            </div>
            <div>
              <label for="smb-r" class="block text-xs font-medium text-muted-foreground mb-1.5">内半径 R（mm）</label>
              <input id="smb-r" v-model.number="rMm" type="number" min="0" step="0.5" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            </div>
            <div>
              <label for="smb-theta" class="block text-xs font-medium text-muted-foreground mb-1.5">弯曲角 θ（°，0~180）</label>
              <input id="smb-theta" v-model.number="thetaDeg" type="number" min="1" max="179" step="5" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            </div>
            <div>
              <label for="smb-k" class="block text-xs font-medium text-muted-foreground mb-1.5">K 因子（默认 0.44）</label>
              <input id="smb-k" v-model.number="kFactor" type="number" min="0.05" max="0.95" step="0.01" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            </div>
          </div>

          <div>
            <p class="text-xs text-muted-foreground mb-1.5">材料 K 因子经验宽档（点击填入区间中值）</p>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="m in MATERIALS"
                :key="m.key"
                @click="kFactor = m.mid"
                class="py-2 rounded-lg border text-xs font-medium transition"
                :class="kFactor === m.mid ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
              >
                {{ m.label }} <span class="opacity-75 font-normal">{{ m.range }}</span>
              </button>
            </div>
            <p class="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
              <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              显著提示：以上为工程经验参考宽档（K 因子经验范围 0.3-0.5），实际以工厂试折实测回算为准。
            </p>
            <p v-if="kOutsideRange && singleValid" class="mt-1 text-xs text-amber-600 dark:text-amber-400">
              当前 K = {{ fmt2(kFactor) }} 已在常用经验范围 0.3~0.5 之外，结果仅供公式演示，请复核输入。
            </p>
          </div>

          <!-- BA / OSSB / BD 结果 -->
          <div v-if="singleValid" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
                <p class="text-xs text-muted-foreground mb-1">折弯补偿 BA（弧段长）</p>
                <p class="text-xl font-bold text-primary font-mono">{{ fmt4(baVal) }} <span class="text-xs font-normal">mm</span></p>
                <p class="text-[10px] text-muted-foreground mt-1">θ<sub>rad</sub> × (R + K·t)</p>
              </div>
              <div class="p-4 rounded-lg border border-border bg-muted/50">
                <p class="text-xs text-muted-foreground mb-1">外退让 OSSB</p>
                <p class="text-xl font-bold text-foreground font-mono">{{ fmt4(ossbVal) }} <span class="text-xs font-normal">mm</span></p>
                <p class="text-[10px] text-muted-foreground mt-1">tan(θ/2) × (R + t)</p>
              </div>
              <div class="p-4 rounded-lg border border-border bg-muted/50">
                <p class="text-xs text-muted-foreground mb-1">折弯扣除 BD</p>
                <p class="text-xl font-bold text-foreground font-mono">{{ fmt4(bdVal) }} <span class="text-xs font-normal">mm</span></p>
                <p class="text-[10px] text-muted-foreground mt-1">2×OSSB − BA</p>
              </div>
            </div>

            <!-- 外模线口径展开长度 -->
            <div class="p-4 rounded-lg border border-border bg-muted/50 space-y-3">
              <p class="text-sm font-medium text-foreground">外模线口径展开长度 L = A + B − BD</p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="smb-a" class="block text-xs font-medium text-muted-foreground mb-1.5">A（边缘到外模线交点，mm）</label>
                  <input id="smb-a" v-model.number="aLen" type="number" min="0" step="1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                </div>
                <div>
                  <label for="smb-b" class="block text-xs font-medium text-muted-foreground mb-1.5">B（边缘到外模线交点，mm）</label>
                  <input id="smb-b" v-model.number="bLen" type="number" min="0" step="1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                </div>
              </div>
              <div v-if="flatL !== null">
                <div class="p-3 rounded-lg border border-primary/30 bg-primary/10 text-center">
                  <p class="text-xs text-muted-foreground mb-1">展开长度 L（外模线口径）</p>
                  <p class="text-2xl font-bold text-primary font-mono">{{ fmt4(flatL) }} <span class="text-xs font-normal">mm</span></p>
                </div>
                <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
                  分解式恒等验证：(A−OSSB) + (B−OSSB) + BA = {{ fmt4(aLen - ossbVal) }} + {{ fmt4(bLen - ossbVal) }} + {{ fmt4(baVal) }} =
                  <span class="font-mono text-foreground">{{ fmt4(flatDec) }} mm</span>，与 L = {{ fmt4(aLen) }} + {{ fmt4(bLen) }} − {{ fmt4(bdVal) }} 两式恒等。
                  平面段走直线、弧段走中性层，这是钣金展开最容易混淆的口径点（详见下方 SEO 区专段）。
                </p>
              </div>
              <p v-else class="text-xs text-muted-foreground">填入大于 0 的 A、B 后给出展开长度（A/B 为图纸边缘量到弯角顶点/外模线交点的尺寸）。</p>
            </div>

            <button
              @click="copySingle"
              class="px-3 py-1.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-xs font-medium text-foreground transition"
            >
              <CheckCircle v-if="copyStatus === 'ok'" class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-green-600" />
              <Copy v-else class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-primary" />
              {{ copyStatus === 'ok' ? '已复制' : '复制单弯明细' }}
            </button>
          </div>

          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">暂无法计算</p>
              <p class="text-xs text-muted-foreground mt-1">{{ singleError }}</p>
            </div>
          </div>
        </div>

        <!-- 多弯累加模式 -->
        <div v-else class="space-y-4">
          <div class="max-w-xs">
            <label for="smb-lead" class="block text-xs font-medium text-muted-foreground mb-1.5">首端平面段（板边到第一弯，mm）</label>
            <input id="smb-lead" v-model.number="leadingFlat" type="number" min="0" step="1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm min-w-[560px]">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-2 font-medium">弯序</th>
                  <th class="py-2 pr-2 font-medium">板厚 t</th>
                  <th class="py-2 pr-2 font-medium">内半径 R</th>
                  <th class="py-2 pr-2 font-medium">角度 θ°</th>
                  <th class="py-2 pr-2 font-medium">K 因子</th>
                  <th class="py-2 pr-2 font-medium">弯后平面段</th>
                  <th class="py-2 font-medium">BA（mm）</th>
                  <th class="py-2"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in bends" :key="idx" class="border-b border-border/50">
                  <td class="py-2 pr-2 text-xs text-muted-foreground">{{ idx + 1 }}</td>
                  <td class="py-2 pr-2"><input v-model.number="row.tMm" type="number" min="0" step="0.5" :aria-label="`弯${idx + 1}板厚`" class="w-16 px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"></td>
                  <td class="py-2 pr-2"><input v-model.number="row.rMm" type="number" min="0" step="0.5" :aria-label="`弯${idx + 1}内半径`" class="w-16 px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"></td>
                  <td class="py-2 pr-2"><input v-model.number="row.thetaDeg" type="number" min="1" max="179" step="5" :aria-label="`弯${idx + 1}角度`" class="w-16 px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"></td>
                  <td class="py-2 pr-2"><input v-model.number="row.k" type="number" min="0.05" max="0.95" step="0.01" :aria-label="`弯${idx + 1}K因子`" class="w-16 px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"></td>
                  <td class="py-2 pr-2"><input v-model.number="row.flatAfter" type="number" min="0" step="1" :aria-label="`弯${idx + 1}弯后平面段`" class="w-20 px-2 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"></td>
                  <td class="py-2 pr-2 font-mono text-xs" :class="bendRowError(row) || baOf(row) === null ? 'text-red-500' : 'text-foreground'">{{ baOf(row) === null ? '—' : fmt4(baOf(row)) }}</td>
                  <td class="py-2">
                    <button @click="removeBend(idx)" :disabled="bends.length <= 1" aria-label="删除该弯" class="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            「弯后平面段」= 该弯到下一弯（末弯到板端）的直线段长。总展开 = 首端平面段 + Σ弯后平面段 + ΣBA，
            即 Σ平面段 + ΣBA 统一口径。
          </p>
          <button
            @click="addBend"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-xs font-medium text-foreground transition"
          >
            <Plus class="w-3.5 h-3.5" /> 添加一弯
          </button>

          <div v-if="multiResult" class="space-y-3">
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10 text-center">
              <p class="text-xs text-muted-foreground mb-1">多弯总展开长度</p>
              <p class="text-3xl font-bold text-primary font-mono">{{ fmt4(multiResult.total) }} <span class="text-sm font-normal">mm</span></p>
              <p class="text-xs text-muted-foreground mt-2">
                ΣBA = {{ fmt4(multiResult.sumBa) }} mm；平面段合计（含首端）= {{ fmt4(multiResult.sumFlat) }} mm
              </p>
            </div>
            <button
              @click="copyMulti"
              class="px-3 py-1.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-xs font-medium text-foreground transition"
            >
              <CheckCircle v-if="copyStatus === 'ok'" class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-green-600" />
              <Copy v-else class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-primary" />
              {{ copyStatus === 'ok' ? '已复制' : '复制多弯明细' }}
            </button>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">暂无法计算</p>
              <p class="text-xs text-muted-foreground mt-1">{{ multiError }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- K 因子 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Sigma class="w-5 h-5 mr-2 text-primary" /> K 因子是什么
          </h2>
          <p class="text-xs leading-relaxed text-muted-foreground">
            弯曲时中性层（不受拉也不受压、长度不变的那层）到<span class="text-foreground font-medium">内表面</span>的距离是 K·t。
            K 因子就是它占板厚 t 的比例，决定 BA 弧段按哪一层算长度：BA = θ<sub>rad</sub>×(R + K·t)。
          </p>
          <div class="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5 text-xs text-muted-foreground">
            <p>经验范围 <span class="font-mono text-foreground font-semibold">0.3 ~ 0.5</span></p>
            <p>软钢 <span class="font-mono text-foreground">0.44-0.46</span> · 铝 <span class="font-mono text-foreground">0.40-0.44</span> · 不锈钢 <span class="font-mono text-foreground">0.44-0.48</span></p>
          </div>
          <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
            显著提示：以上为工程经验参考，不给精确查表值；同一副模具试折一件、量出展开长反算 K，比任何表都准。
          </p>
        </div>

        <!-- 三公式关系 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> BA / OSSB / BD 关系
          </h2>
          <div class="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5 text-xs font-mono text-muted-foreground">
            <p><span class="text-foreground font-semibold">BA</span> = θ<sub>rad</sub>·(R + K·t)</p>
            <p><span class="text-foreground font-semibold">OSSB</span> = tan(θ/2)·(R + t)</p>
            <p><span class="text-foreground font-semibold">BD</span> = 2·OSSB − BA</p>
            <p><span class="text-foreground font-semibold">L</span> = A + B − BD（外模线口径）</p>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            三者是同一几何的不同记账法：BA 从「加上弧段」记账，BD 从「减去顶点外框多余量」记账，
            OSSB 是两者换算的桥梁。用哪一套取决于图纸标注口径，混用口径是最常见的展开错误。
          </p>
        </div>

        <!-- 展开红线 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <AlertTriangle class="w-5 h-5 mr-2 text-amber-500" /> 展开红线
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">先试折再批量</span>：新材料/新模具组合，先折一件实测展开长回算 K 因子，再放批量下料。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">口径别混</span>：外模线口径的 A/B 与内尺寸口径的 A/B 数值不同，全图只用一种口径，换算清楚再代入。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">R=0 要当心</span>：图纸标清角时，实际成形仍有材料内半径，按刀具 V 槽/模具参数估一个 R 再算，别真按 0 算。</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- SVG 截面示意（纯 SVG 字符串渲染） -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-1">
        <Frame class="w-5 h-5 mr-2 text-primary" /> 截面示意：两弯槽形件
      </h2>
      <p class="text-xs text-muted-foreground mb-4">按当前输入的 t / R / K 绘制（θ=90° 画法示意，任意角度公式同源）；虚线为中性层，位于距内表面 K·t 处，弯曲塑性区集中在弯角内外表面之间。</p>
      <div class="rounded-lg bg-muted/40 border border-border p-3" v-html="sectionSvg"></div>
      <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
        读图要点：灰色实线为内表面与外模线（外表面），两者相距板厚 t；弯角处内半径 R 由模具决定；
        琥珀色虚线为中性层（距内表面 K·t），展开长度按中性层弧段 BA 记账——这就是「平面段走直线、弧段走中性层」的几何含义。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>钣金展开计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          钣金展开计算器把折弯件「摊平」：输入板厚 t、内半径 R、弯曲角 θ 与 K 因子，同时给出折弯补偿 BA、外退让 OSSB、
          折弯扣除 BD 三组互补数值，并按外模线口径 L = A + B − BD 算展开长，列出「(A−OSSB) + (B−OSSB) + BA」分解式验证两式恒等。
          多弯累加模式逐行输入每弯 t/R/θ/K 与弯后平面段，总展开 = Σ平面段 + ΣBA。
          全部计算在浏览器本地完成，K 因子相关参考值仅为工程经验档，下料前请以工厂试折实测为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">外模线口径与内尺寸口径：展开长度最大混淆点</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          同一个弯，图纸可以从两种位置量尺寸，代入的公式完全不同：
        </p>
        <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground leading-relaxed">
          <li><span class="text-foreground font-medium">外模线口径（本页采用）</span>：A/B 从板边量到<span class="text-foreground">两平面段延长线的交点</span>（弯角顶点，即外模线交点）。展开长 L = A + B − BD，其中 BD = 2·OSSB − BA 把「顶点外框比实际多出来的量」扣掉；等价分解 (A−OSSB) + (B−OSSB) + BA，平面段加弧段，两式恒等。</li>
          <li><span class="text-foreground font-medium">内尺寸口径</span>：A/B 从板边量到<span class="text-foreground">内表面</span>（内模线）。此时弯角内侧量到的尺寸已含内半径 R，展开长应写成 L = A′ + B′ + BA − 2·(R + t)·tan(θ/2) + 2·R·tan(θ/2) 的等价形式，简化后即 L = A′ + B′ − BD′，BD′ 数值与外模线口径的 BD 不同。</li>
        </ul>
        <p class="text-sm text-muted-foreground leading-relaxed mt-2">
          混用口径（比如 A 按外模线量、B 按内表面量）是最常见的展开报废原因。拿到图先确认每条边量到哪条线，
          全图统一口径后再代入本页公式；本页所有 A/B 均指外模线口径。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">K 因子怎么取？为什么强调试折实测</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          K 因子 = 中性层到内表面距离 ÷ 板厚，几何上只取决于材料与成形的塑性流动状态，经验范围 0.3~0.5：
          软钢常见 0.44-0.46、铝 0.40-0.44、不锈钢 0.44-0.48。但它随模具圆角、V 槽宽度、压边力甚至轧向变化，
          同一张图纸换一副模具，K 漂移 0.02 就足以让长件端部差出零点几毫米。
          所以规范做法是：用当前模具折一件试件 → 测量展开长 → 按 K = (BA/θ<sub>rad</sub> − R)/t 反算 → 再批量下料。
          本页给出的材料宽档仅作初值参考，不给精确查表值。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">t=1、R=1、90°、K=0.446 时各值是多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">BA = (π/2)×(1+0.446) ≈ 2.2714 mm；OSSB = tan45°×2 = 2.0 mm；BD = 2×2.0 − 2.2714 = 1.7286 mm。若 A=B=11（外模线口径），展开长 L = 22 − 1.7286 = 20.2714 mm，与 (11−2)+(11−2)+2.2714 完全相等。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">BA 和 BD 到底用哪个？</h3>
            <p class="text-sm text-muted-foreground mt-1">看图纸口径：尺寸量到弯角顶点（外模线）用 BD 做「减法」——L = A + B − BD；按平面段+弧段逐段排料用 BA 做「加法」——L = 平面段之和 + ΣBA。两者通过 OSSB 换算，结果一致，不能混着用两次。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">多弯件怎么累加？</h3>
            <p class="text-sm text-muted-foreground mt-1">把每个弯单独算 BA，再把所有直线段（板边到第一弯、弯与弯之间、末弯到板边）与所有 BA 相加：总展开 = Σ平面段 + ΣBA。每弯的 t/R/θ/K 可以不同，逐行填入本页多弯模式即可。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">算出来的展开长能直接下料吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不建议直接下料。K 因子取值、模具回弹与材料批次都会影响实际展开长，务必先试折一件验证；重要配合尺寸留研配余量，批量前用工件实测复核。本工具仅供工艺估算。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'sheet-metal-bend-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Layers, Info, AlertTriangle, ChevronUp, ChevronDown,
  Copy, CheckCircle, Ruler, Sigma, Frame, Trash2, Plus
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 口径：BA = θ_rad×(R+K·t)；OSSB = tan(θ/2)×(R+t)；BD = 2×OSSB − BA；
// 外模线口径展开长 L = A + B − BD，等价分解 (A−OSSB)+(B−OSSB)+BA（两式恒等）。
// 多弯累加：总展开 = Σ平面段（首端 + 各弯后平面段） + ΣBA。
// 自核锚点（容差 1e-3）：t=1, R=1, θ=90°, K=0.446 → BA=2.2714 / OSSB=2.0 / BD=1.7286；
// A=B=11 → L=20.2714；θ=60° 同参数 → BA=π/3×1.446≈1.5142。
const DEG2RAD = Math.PI / 180

function fmtNum(x, digits = 2) {
  if (x === null || x === undefined || !Number.isFinite(x)) return '—'
  const p = Math.pow(10, digits)
  return String(Math.round(x * p) / p)
}
function fmt2(x) { return fmtNum(x, 2) }
function fmt4(x) { return fmtNum(x, 4) }

// 参数校验：θ ∈ (0,180)，t > 0，R ≥ 0，K ∈ (0,1)
function validBend(thetaDeg, rMm, tMm, k) {
  return (
    Number.isFinite(thetaDeg) && thetaDeg > 0 && thetaDeg < 180 &&
    Number.isFinite(tMm) && tMm > 0 &&
    Number.isFinite(rMm) && rMm >= 0 &&
    Number.isFinite(k) && k > 0 && k < 1
  )
}

// 折弯补偿 BA（mm）
function bendAllowance(thetaDeg, rMm, tMm, k) {
  if (!validBend(thetaDeg, rMm, tMm, k)) return null
  return thetaDeg * DEG2RAD * (rMm + k * tMm)
}

// 外退让 OSSB（mm）
function ossb(thetaDeg, rMm, tMm) {
  if (!(Number.isFinite(thetaDeg) && thetaDeg > 0 && thetaDeg < 180) || !(Number.isFinite(tMm) && tMm > 0) || !(Number.isFinite(rMm) && rMm >= 0)) return null
  return Math.tan((thetaDeg * DEG2RAD) / 2) * (rMm + tMm)
}

// 折弯扣除 BD（mm）
function bendDeduction(thetaDeg, rMm, tMm, k) {
  const ba = bendAllowance(thetaDeg, rMm, tMm, k)
  const o = ossb(thetaDeg, rMm, tMm)
  if (ba === null || o === null) return null
  return 2 * o - ba
}

// 外模线口径展开长 L = A + B − BD（A/B 量到弯角顶点）
function flatFromMoldLines(aMm, bMm, thetaDeg, rMm, tMm, k) {
  const bd = bendDeduction(thetaDeg, rMm, tMm, k)
  if (bd === null || !(Number.isFinite(aMm) && aMm > 0) || !(Number.isFinite(bMm) && bMm > 0)) return null
  return aMm + bMm - bd
}

// 分解式 (A−OSSB) + (B−OSSB) + BA（用于恒等验证）
function flatDecomposed(aMm, bMm, thetaDeg, rMm, tMm, k) {
  const ba = bendAllowance(thetaDeg, rMm, tMm, k)
  const o = ossb(thetaDeg, rMm, tMm)
  if (ba === null || o === null || !(Number.isFinite(aMm) && aMm > 0) || !(Number.isFinite(bMm) && bMm > 0)) return null
  return (aMm - o) + (bMm - o) + ba
}

// 多弯行错误提示（null=合法）
function bendRowError(row) {
  if (!row) return '行数据缺失'
  if (!(Number.isFinite(row.tMm) && row.tMm > 0)) return '板厚 t 必须大于 0'
  if (!(Number.isFinite(row.rMm) && row.rMm >= 0)) return '内半径 R 不能为负'
  if (!(Number.isFinite(row.thetaDeg) && row.thetaDeg > 0 && row.thetaDeg < 180)) return '弯曲角 θ 需在 0°~180° 之间（不含端点）'
  if (!(Number.isFinite(row.k) && row.k > 0 && row.k < 1)) return 'K 因子需在 0~1 之间'
  if (!(Number.isFinite(row.flatAfter) && row.flatAfter >= 0)) return '弯后平面段不能为负'
  return null
}

// 多弯累加：总展开 = 首端平面段 + Σ弯后平面段 + ΣBA
function multiBendTotal(bends, leadingFlat) {
  if (!Number.isFinite(leadingFlat) || leadingFlat < 0) return null
  let sumBa = 0
  let sumFlatAfter = 0
  for (const b of bends) {
    if (bendRowError(b)) return null
    sumBa += bendAllowance(b.thetaDeg, b.rMm, b.tMm, b.k)
    sumFlatAfter += b.flatAfter
  }
  return { total: leadingFlat + sumFlatAfter + sumBa, sumBa, sumFlat: leadingFlat + sumFlatAfter }
}

// 材料经验宽档（显著标注：工程经验参考，以试折实测为准）
const MATERIALS = [
  { key: 'steel', label: '软钢', range: '0.44-0.46', mid: 0.45 },
  { key: 'alu', label: '铝', range: '0.40-0.44', mid: 0.42 },
  { key: 'ss', label: '不锈钢', range: '0.44-0.48', mid: 0.46 }
]

// 两弯槽形件截面 SVG（纯字符串生成，不碰 DOM；θ 按 90° 画法示意）
function bendSectionSvg(tMm, rMm, k) {
  const t = Number.isFinite(tMm) && tMm > 0 ? tMm : 1
  const r = Number.isFinite(rMm) && rMm >= 0 ? rMm : 1
  const kk = Number.isFinite(k) && k > 0 && k < 1 ? k : 0.44
  const tPx = Math.min(26, Math.max(8, t * 12))
  const rPx = Math.min(42, Math.max(10, r * 12))
  const kPx = tPx * kk
  const n = (x) => Math.round(x * 100) / 100
  const s = 0.7071
  const xL = 96, xR = 364, yTop = 26, yIn = 148
  const cLx = xL + rPx, cLy = yIn - rPx, cRx = xR - rPx
  const p = []
  p.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 208" width="100%" role="img" aria-label="钣金两弯槽形件截面示意，标注板厚 t、内半径 R 与 K 因子中性层位置">')
  // 外轮廓（外模线）
  p.push(`<path d="M ${n(xL - tPx)} ${yTop} L ${n(xL - tPx)} ${n(cLy)} A ${n(rPx + tPx)} ${n(rPx + tPx)} 0 0 0 ${n(cLx)} ${n(yIn + tPx)} L ${n(cRx)} ${n(yIn + tPx)} A ${n(rPx + tPx)} ${n(rPx + tPx)} 0 0 0 ${n(xR + tPx)} ${n(cLy)} L ${n(xR + tPx)} ${yTop}" fill="none" stroke="#94a3b8" stroke-width="2"/>`)
  // 内轮廓（内表面）
  p.push(`<path d="M ${xL} ${yTop} L ${xL} ${n(cLy)} A ${rPx} ${rPx} 0 0 0 ${n(cLx)} ${yIn} L ${n(cRx)} ${yIn} A ${rPx} ${rPx} 0 0 0 ${xR} ${n(cLy)} L ${xR} ${yTop}" fill="none" stroke="#94a3b8" stroke-width="2"/>`)
  // 端面封口
  p.push(`<line x1="${xL}" y1="${yTop}" x2="${n(xL - tPx)}" y2="${yTop}" stroke="#94a3b8" stroke-width="2"/>`)
  p.push(`<line x1="${xR}" y1="${yTop}" x2="${n(xR + tPx)}" y2="${yTop}" stroke="#94a3b8" stroke-width="2"/>`)
  // 中性层（K·t 虚线）
  p.push(`<path d="M ${n(xL - kPx)} ${yTop} L ${n(xL - kPx)} ${n(cLy)} A ${n(rPx + kPx)} ${n(rPx + kPx)} 0 0 0 ${n(cLx)} ${n(yIn + kPx)} L ${n(cRx)} ${n(yIn + kPx)} A ${n(rPx + kPx)} ${n(rPx + kPx)} 0 0 0 ${n(xR + kPx)} ${n(cLy)} L ${n(xR + kPx)} ${yTop}" fill="none" stroke="#f59e0b" stroke-width="1.6" stroke-dasharray="6 4"/>`)
  // t 尺寸（左翻边）
  p.push(`<line x1="${n(xL - tPx)}" y1="64" x2="${xL}" y2="64" stroke="#64748b" stroke-width="1"/>`)
  p.push(`<line x1="${n(xL - tPx)}" y1="59" x2="${n(xL - tPx)}" y2="69" stroke="#64748b" stroke-width="1"/>`)
  p.push(`<line x1="${xL}" y1="59" x2="${xL}" y2="69" stroke="#64748b" stroke-width="1"/>`)
  p.push(`<text x="${n(xL - tPx - 6)}" y="68" font-size="11" fill="#94a3b8" text-anchor="end">t = ${t} mm</text>`)
  // R 半径（左弯，圆心到内弧）
  p.push(`<line x1="${n(cLx)}" y1="${n(cLy)}" x2="${n(cLx + 34)}" y2="${n(cLy - 36)}" stroke="#64748b" stroke-width="1"/>`)
  p.push(`<circle cx="${n(cLx)}" cy="${n(cLy)}" r="1.8" fill="#64748b"/>`)
  p.push(`<text x="${n(cLx + 40)}" y="${n(cLy - 32)}" font-size="11" fill="#94a3b8">R = ${r} mm（内半径）</text>`)
  // K·t 标注（左翻边内表面到中性层）
  p.push(`<line x1="${xL}" y1="88" x2="${n(xL - kPx)}" y2="88" stroke="#f59e0b" stroke-width="1"/>`)
  p.push(`<text x="${n(xL + 8)}" y="92" font-size="11" fill="#f59e0b">K·t = ${fmtNum(kk * t, 2)} mm（K = ${kk}）</text>`)
  // 塑性区（右弯中性层与内表面之间）
  const pzRad = rPx + kPx / 2
  const pzX = cRx + pzRad * s
  const pzY = cLy + pzRad * s
  p.push(`<circle cx="${n(pzX)}" cy="${n(pzY)}" r="3" fill="#f59e0b"/>`)
  p.push(`<line x1="${n(pzX)}" y1="${n(pzY)}" x2="${n(pzX + 18)}" y2="${n(pzY + 22)}" stroke="#f59e0b" stroke-width="1"/>`)
  p.push(`<text x="${n(pzX + 22)}" y="${n(pzY + 26)}" font-size="11" fill="#f59e0b">塑性区</text>`)
  // 中性层说明（右下引出）
  p.push(`<line x1="${n(xR - 60)}" y1="${n(yIn + kPx)}" x2="330" y2="${n(yIn + tPx + 14)}" stroke="#f59e0b" stroke-width="1"/>`)
  p.push(`<text x="334" y="${n(yIn + tPx + 18)}" font-size="11" fill="#f59e0b">中性层（K·t 处）</text>`)
  // 平面段
  p.push(`<text x="230" y="${yIn - 8}" font-size="11" fill="#94a3b8" text-anchor="middle">平面段</text>`)
  p.push('</svg>')
  return p.join('')
}

// 单弯明细文本
function buildSingleReport(tMm, rMm, thetaDeg, k, aMm, bMm) {
  const ba = bendAllowance(thetaDeg, rMm, tMm, k)
  const o = ossb(thetaDeg, rMm, tMm)
  const bd = bendDeduction(thetaDeg, rMm, tMm, k)
  if (ba === null || o === null || bd === null) return null
  const lines = [
    '钣金展开明细-单弯（有条工具 · 本地计算）',
    `参数：t=${tMm} mm，R=${rMm} mm，θ=${thetaDeg}°，K=${k}`,
    `BA（折弯补偿）= ${fmtNum(ba, 4)} mm`,
    `OSSB（外退让）= ${fmtNum(o, 4)} mm`,
    `BD（折弯扣除）= ${fmtNum(bd, 4)} mm`
  ]
  const L = flatFromMoldLines(aMm, bMm, thetaDeg, rMm, tMm, k)
  const Ld = flatDecomposed(aMm, bMm, thetaDeg, rMm, tMm, k)
  if (L !== null && Ld !== null) {
    lines.push(`外模线口径：L = A + B − BD = ${fmtNum(aMm, 2)} + ${fmtNum(bMm, 2)} − ${fmtNum(bd, 4)} = ${fmtNum(L, 4)} mm`)
    lines.push(`分解式恒等：(A−OSSB)+(B−OSSB)+BA = ${fmtNum(Ld, 4)} mm`)
  }
  lines.push('提醒：K 因子以工厂试折实测回算为准，批量下料前先试折验证。')
  return lines.join('\n')
}

// 多弯明细文本
function buildMultiReport(bends, leadingFlat) {
  const m = multiBendTotal(bends, leadingFlat)
  if (!m) return null
  const lines = [
    '钣金展开明细-多弯累加（有条工具 · 本地计算）',
    `首端平面段：${fmtNum(leadingFlat, 2)} mm`
  ]
  bends.forEach((b, i) => {
    const ba = bendAllowance(b.thetaDeg, b.rMm, b.tMm, b.k)
    lines.push(`弯${i + 1}：t=${b.tMm} R=${b.rMm} θ=${b.thetaDeg}° K=${b.k} → BA=${fmtNum(ba, 4)} mm；弯后平面段=${fmtNum(b.flatAfter, 2)} mm`)
  })
  lines.push(
    `ΣBA = ${fmtNum(m.sumBa, 4)} mm；平面段合计（含首端）= ${fmtNum(m.sumFlat, 2)} mm`,
    `总展开长度 = ${fmtNum(m.total, 4)} mm`,
    '提醒：Σ平面段 + ΣBA 统一口径，下料前先试折验证。'
  )
  return lines.join('\n')
}
// ==== PURE-FNS-END ====

// ---------- SEO ----------
useSeoMeta({
  title: '钣金展开计算器 - K因子/折弯补偿BA/折弯扣除BD与多弯累加',
  description: '在线钣金展开计算器：输入板厚、内半径、弯曲角与 K 因子，同时计算折弯补偿 BA、外退让 OSSB、折弯扣除 BD，按外模线口径 L=A+B−BD 算展开长度并验证分解式恒等；多弯累加模式 Σ平面段+ΣBA，附两弯截面 SVG 示意与 K 因子材料经验档，纯本地计算。',
  keywords: '钣金展开计算,k因子计算,折弯补偿BA,折弯扣除BD,展开长度计算,OSSB外退让,钣金折弯公式,多弯展开',
  author: '有条工具',
  ogTitle: '钣金展开计算器 - K因子/BA/BD与多弯累加 | 有条工具',
  ogDescription: '折弯补偿、折弯扣除三法并列，外模线口径展开长与多弯累加，截面示意标注 K 塑性区。',
  ogUrl: 'https://www.util.cn/tools/sheet-metal-bend-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '钣金展开计算器',
  twitterDescription: 'K 因子/BA/BD 三法并列的钣金展开长度计算，多弯累加与截面示意。'
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
          name: '钣金展开计算器',
          url: 'https://www.util.cn/tools/sheet-metal-bend-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '折弯补偿 BA = θ_rad×(R+K·t)',
            '外退让 OSSB = tan(θ/2)×(R+t)',
            '折弯扣除 BD = 2×OSSB − BA',
            '外模线口径展开长 L = A + B − BD 与分解式恒等验证',
            '多弯累加：总展开 = Σ平面段 + ΣBA',
            'K 因子材料经验宽档（软钢/铝/不锈钢）与试折实测提示',
            '两弯截面 SVG 示意（标注 R/t/K 塑性区）',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '钣金展开计算器', item: 'https://www.util.cn/tools/sheet-metal-bend-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 't=1、R=1、90°、K=0.446 时 BA/OSSB/BD 各是多少？',
              acceptedAnswer: { '@type': 'Answer', text: 'BA = (π/2)×(1+0.446) ≈ 2.2714 mm；OSSB = tan45°×2 = 2.0 mm；BD = 2×2.0 − 2.2714 ≈ 1.7286 mm。A=B=11（外模线口径）时展开长 L = 22 − 1.7286 = 20.2714 mm。' }
            },
            {
              '@type': 'Question',
              name: 'BA 和 BD 到底用哪个？',
              acceptedAnswer: { '@type': 'Answer', text: '尺寸量到弯角顶点（外模线）用 BD：L = A + B − BD；按平面段加弧段排料用 BA：L = Σ平面段 + ΣBA。两者通过 OSSB 换算，结果一致，不能混用两次。' }
            },
            {
              '@type': 'Question',
              name: '多弯件怎么累加展开？',
              acceptedAnswer: { '@type': 'Answer', text: '每个弯单独算 BA，再把所有直线段（板边到第一弯、弯与弯之间、末弯到板边）与所有 BA 相加：总展开 = Σ平面段 + ΣBA，每弯的 t/R/θ/K 可以不同。' }
            },
            {
              '@type': 'Question',
              name: 'K 因子怎么取？',
              acceptedAnswer: { '@type': 'Answer', text: '经验范围 0.3-0.5，软钢 0.44-0.46、铝 0.40-0.44、不锈钢 0.44-0.48 仅为工程经验参考；用当前模具试折一件、按 K = (BA/θ_rad − R)/t 反算最可靠，批量下料前务必验证。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'sheet-metal-bend-calculator'
onMounted(() => {
  addRecentTool(TOOL_ID)
})

// ---------- 状态 ----------
const mode = ref('single') // 'single' 单弯 | 'multi' 多弯累加
const tMm = ref(1)
const rMm = ref(1)
const thetaDeg = ref(90)
const kFactor = ref(0.44)
const aLen = ref(11)
const bLen = ref(11)
const leadingFlat = ref(10)
const bends = ref([
  { tMm: 1, rMm: 1, thetaDeg: 90, k: 0.44, flatAfter: 10 },
  { tMm: 1, rMm: 1, thetaDeg: 90, k: 0.44, flatAfter: 10 }
])
const copyStatus = ref('idle')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
const addBend = () => {
  bends.value.push({ tMm: 1, rMm: 1, thetaDeg: 90, k: 0.44, flatAfter: 10 })
}
const removeBend = (idx) => {
  if (bends.value.length > 1) bends.value.splice(idx, 1)
}

// ---------- 单弯计算 ----------
const singleValid = computed(() => validBend(thetaDeg.value, rMm.value, tMm.value, kFactor.value))
const singleError = computed(() => {
  if (!(Number.isFinite(tMm.value) && tMm.value > 0)) return '板厚 t 必须大于 0（mm）。'
  if (!(Number.isFinite(rMm.value) && rMm.value >= 0)) return '内半径 R 不能为负（mm）。'
  if (!(Number.isFinite(thetaDeg.value) && thetaDeg.value > 0 && thetaDeg.value < 180)) return '弯曲角 θ 需在 0°~180° 之间（不含端点）。'
  if (!(Number.isFinite(kFactor.value) && kFactor.value > 0 && kFactor.value < 1)) return 'K 因子需在 0~1 之间（经验范围 0.3~0.5）。'
  return '请检查输入数值。'
})
const kOutsideRange = computed(() => Number.isFinite(kFactor.value) && (kFactor.value < 0.3 || kFactor.value > 0.5))
const baVal = computed(() => bendAllowance(thetaDeg.value, rMm.value, tMm.value, kFactor.value) ?? 0)
const ossbVal = computed(() => ossb(thetaDeg.value, rMm.value, tMm.value) ?? 0)
const bdVal = computed(() => bendDeduction(thetaDeg.value, rMm.value, tMm.value, kFactor.value) ?? 0)
const flatL = computed(() => flatFromMoldLines(aLen.value, bLen.value, thetaDeg.value, rMm.value, tMm.value, kFactor.value))
const flatDec = computed(() => flatDecomposed(aLen.value, bLen.value, thetaDeg.value, rMm.value, tMm.value, kFactor.value))

// ---------- 多弯计算 ----------
const baOf = (row) => bendAllowance(row.thetaDeg, row.rMm, row.tMm, row.k)
const multiResult = computed(() => multiBendTotal(bends.value, leadingFlat.value))
const multiError = computed(() => {
  if (!(Number.isFinite(leadingFlat.value) && leadingFlat.value >= 0)) return '首端平面段不能为负（mm）。'
  for (let i = 0; i < bends.value.length; i++) {
    const err = bendRowError(bends.value[i])
    if (err) return `第 ${i + 1} 弯：${err}`
  }
  return '请检查各弯参数。'
})

// ---------- SVG 示意 ----------
const sectionSvg = computed(() => bendSectionSvg(tMm.value, rMm.value, kFactor.value))

// ---------- 复制明细（clipboard + alert） ----------
let copyTimer = null
async function copyText(buildFn) {
  const text = buildFn()
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copyStatus.value = 'ok'
    trackEvent('工具结果', '复制', TOOL_ID)
  } catch (err) {
    copyStatus.value = 'fail'
    alert('复制失败：浏览器未授权剪贴板，请手动记录展开数据。')
  }
  if (copyTimer !== null) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copyStatus.value = 'idle'; copyTimer = null }, 1600)
}
const copySingle = () => copyText(() => buildSingleReport(tMm.value, rMm.value, thetaDeg.value, kFactor.value, aLen.value, bLen.value))
const copyMulti = () => copyText(() => buildMultiReport(bends.value, leadingFlat.value))
</script>
