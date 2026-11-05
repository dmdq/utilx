<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部区 -->
    <div class="mb-6">
      <div class="flex items-start gap-3 mb-3">
        <div class="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <component :is="toolIcon" class="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground mb-1">液压压力计算器 - 帕斯卡原理与液压缸推力速算</h1>
          <p class="text-muted-foreground">帕斯卡原理三向计算：千斤顶增力模型（力×面积比、行程反比）、P=F/A 力·压强·活塞直径互算、液压缸推拉力（含效率 η），纯本地计算。</p>
        </div>
      </div>
      <p class="text-sm text-muted-foreground">液压工作压力可达 25~31 MPa（气动一般 0.4~0.8 MPa），同等缸径输出力高 30~70 倍；附 16t 千斤顶锚点表与油压/气压分工注记。</p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        统一口径：1 MPa = 1 N/mm²，活塞面积 A = πD²/4。千斤顶模型按帕斯卡定律理想流体（忽略摩擦与内泄）计算；
        液压缸推拉力默认取效率 η = 0.9（含摩擦与容积损失），可自行修改。压强以 MPa、尺寸以 mm 输入时，力直接得 N，无需换算。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算器 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 计算模式
          </h2>
        </div>

        <!-- 模式切换 -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          <button
            @click="mode = 'jack'"
            :class="mode === 'jack' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 px-2 rounded-lg text-sm font-medium transition-all"
          >千斤顶增力（帕斯卡）</button>
          <button
            @click="mode = 'pfa'"
            :class="mode === 'pfa' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 px-2 rounded-lg text-sm font-medium transition-all"
          >P=F/A 三向互算</button>
          <button
            @click="mode = 'cylinder'"
            :class="mode === 'cylinder' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 px-2 rounded-lg text-sm font-medium transition-all"
          >液压缸推力</button>
        </div>

        <!-- 模式一：千斤顶增力 -->
        <template v-if="mode === 'jack'">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="hyd-d1" class="block text-sm font-medium text-foreground mb-1.5">小活塞直径 d₁（mm）</label>
              <input
                id="hyd-d1"
                v-model.number="jackD1"
                type="number"
                min="0.1"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 12"
              >
            </div>
            <div>
              <label for="hyd-d2" class="block text-sm font-medium text-foreground mb-1.5">大活塞直径 d₂（mm）</label>
              <input
                id="hyd-d2"
                v-model.number="jackD2"
                type="number"
                min="0.1"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 60"
              >
            </div>
            <div>
              <label for="hyd-f1" class="block text-sm font-medium text-foreground mb-1.5">小活塞驱动力 F₁（N）</label>
              <input
                id="hyd-f1"
                v-model.number="jackF1"
                type="number"
                min="0"
                step="10"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 200"
              >
              <p class="text-xs text-muted-foreground mt-1">手柄杠杆输出到小活塞的力（杠杆比另乘）</p>
            </div>
            <div>
              <label for="hyd-h1" class="block text-sm font-medium text-foreground mb-1.5">小活塞行程 h₁（mm）</label>
              <input
                id="hyd-h1"
                v-model.number="jackH1"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 50"
              >
              <p class="text-xs text-muted-foreground mt-1">大活塞行程 h₂ = h₁×A₁/A₂，行程反比</p>
            </div>
          </div>

          <div v-if="jackResult" class="space-y-3">
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <p class="text-sm text-muted-foreground mb-1">大活塞输出力 F₂ = F₁ × (d₂/d₁)²</p>
              <p class="text-3xl font-bold text-primary font-mono">
                {{ fmtNum(jackResult.f2, 1) }} <span class="text-base font-normal text-muted-foreground">N</span>
                <span class="text-lg font-semibold text-muted-foreground ml-1">= {{ fmtNum(jackResult.f2 / 1000, 2) }} kN</span>
              </p>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div class="p-2.5 rounded-lg bg-muted/60">
                <p class="text-[11px] text-muted-foreground mb-0.5">面积比 A₂/A₁</p>
                <p class="font-mono text-sm text-foreground">{{ fmtNum(jackResult.areaRatio, 2) }} 倍</p>
              </div>
              <div class="p-2.5 rounded-lg bg-muted/60">
                <p class="text-[11px] text-muted-foreground mb-0.5">小活塞面积 A₁（mm²）</p>
                <p class="font-mono text-sm text-foreground">{{ fmtNum(jackResult.a1, 2) }}</p>
              </div>
              <div class="p-2.5 rounded-lg bg-muted/60">
                <p class="text-[11px] text-muted-foreground mb-0.5">大活塞面积 A₂（mm²）</p>
                <p class="font-mono text-sm text-foreground">{{ fmtNum(jackResult.a2, 2) }}</p>
              </div>
              <div class="p-2.5 rounded-lg bg-muted/60">
                <p class="text-[11px] text-muted-foreground mb-0.5">大活塞行程 h₂（mm）</p>
                <p class="font-mono text-sm text-foreground">{{ fmtNum(jackResult.h2, 3) }}</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed p-2.5 rounded-lg bg-muted/50">
              省力不省功：忽略摩擦与内泄时 F₁×h₁ ≈ F₂×h₂，力放大 {{ fmtNum(jackResult.areaRatio, 2) }} 倍，行程就缩小同倍数——
              千斤顶要压很多下才能顶起一点，做的功不变。
            </p>
          </div>
          <div v-else class="p-8 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
            请输入大于 0 的活塞直径，F₁ 与 h₁ 可选填
          </div>
        </template>

        <!-- 模式二：P=F/A 三向互算 -->
        <template v-else-if="mode === 'pfa'">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">求解目标（已知另外两个量）</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="opt in pfaOptions"
                :key="opt.value"
                @click="pfaTarget = opt.value"
                :class="pfaTarget === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-sm font-medium transition-all"
              >{{ opt.label }}</button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-if="pfaTarget !== 'force'">
              <label for="hyd-pfa-f" class="block text-sm font-medium text-foreground mb-1.5">力 F（N）</label>
              <input
                id="hyd-pfa-f"
                v-model.number="pfaF"
                type="number"
                min="0"
                step="100"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 100000"
              >
            </div>
            <div v-if="pfaTarget !== 'pressure'">
              <label for="hyd-pfa-p" class="block text-sm font-medium text-foreground mb-1.5">压强 P（MPa）</label>
              <input
                id="hyd-pfa-p"
                v-model.number="pfaP"
                type="number"
                min="0"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 20"
              >
            </div>
            <div v-if="pfaTarget !== 'diameter'">
              <label for="hyd-pfa-d" class="block text-sm font-medium text-foreground mb-1.5">活塞直径 D（mm）</label>
              <input
                id="hyd-pfa-d"
                v-model.number="pfaD"
                type="number"
                min="0.1"
                step="1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 80"
              >
            </div>
          </div>

          <div v-if="pfaResult" class="space-y-3">
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <p class="text-sm text-muted-foreground mb-1">{{ pfaResult.formula }}</p>
              <p class="text-3xl font-bold text-primary font-mono">
                {{ pfaResult.display }}<span class="text-base font-normal text-muted-foreground ml-1">{{ pfaResult.unit }}</span>
              </p>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed p-2.5 rounded-lg bg-muted/50">
              口径：A = πD²/4，1 MPa = 1 N/mm²，故 F(N) = P(MPa) × A(mm²)。
              例：D=80 mm、P=20 MPa → A = {{ fmtNum(Math.PI * 80 * 80 / 4, 1) }} mm²，F ≈ {{ fmtNum(forceFromPressure(20, 80) || 0, 1) }} N（约 {{ fmtNum((forceFromPressure(20, 80) || 0) / 1000, 1) }} kN）。
            </p>
          </div>
          <div v-else class="p-8 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
            请输入两个大于 0 的已知量
          </div>
        </template>

        <!-- 模式三：液压缸推力 -->
        <template v-else>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="hyd-cyl-bore" class="block text-sm font-medium text-foreground mb-1.5">缸径 D（mm）</label>
              <input
                id="hyd-cyl-bore"
                v-model.number="cylBore"
                type="number"
                min="1"
                step="5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 80"
              >
            </div>
            <div>
              <label for="hyd-cyl-rod" class="block text-sm font-medium text-foreground mb-1.5">活塞杆径 d（mm）</label>
              <input
                id="hyd-cyl-rod"
                v-model.number="cylRod"
                type="number"
                min="0"
                step="5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 45"
              >
              <p class="text-xs text-muted-foreground mt-1">拉力侧环形腔扣杆面积；仅算推力可填 0</p>
            </div>
            <div>
              <label for="hyd-cyl-p" class="block text-sm font-medium text-foreground mb-1.5">工作压强 P（MPa）</label>
              <input
                id="hyd-cyl-p"
                v-model.number="cylP"
                type="number"
                min="0"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="如 20"
              >
              <p class="text-xs text-muted-foreground mt-1">液压常见 10~25 MPa，高压系统 25~31.5 MPa</p>
            </div>
            <div>
              <label for="hyd-cyl-eta" class="block text-sm font-medium text-foreground mb-1.5">机械效率 η</label>
              <input
                id="hyd-cyl-eta"
                v-model.number="cylEta"
                type="number"
                min="0.5"
                max="1"
                step="0.05"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="默认 0.9"
              >
              <p class="text-xs text-muted-foreground mt-1">工程口径默认 0.9（摩擦 + 容积损失）</p>
            </div>
          </div>

          <div v-if="cylResult" class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="p-4 rounded-lg border border-primary/30 bg-primary/10">
                <p class="text-xs text-muted-foreground mb-1">推力（无杆腔受压）F = P·πD²/4·η</p>
                <p class="text-2xl font-bold text-primary font-mono">{{ fmtNum(cylResult.thrust, 0) }} <span class="text-sm font-normal">N</span></p>
                <p class="text-sm text-muted-foreground mt-0.5">≈ {{ fmtNum(cylResult.thrust / 1000, 2) }} kN · 约合 {{ fmtNum(cylResult.thrust / 9.80665, 0) }} kgf</p>
              </div>
              <div class="p-4 rounded-lg border border-border bg-muted/50">
                <p class="text-xs text-muted-foreground mb-1">拉力（有杆腔受压）F = P·π(D²−d²)/4·η</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ cylResult.pull !== null ? fmtNum(cylResult.pull, 0) + ' N' : '—' }}</p>
                <p v-if="cylResult.pull !== null" class="text-sm text-muted-foreground mt-0.5">≈ {{ fmtNum(cylResult.pull / 1000, 2) }} kN</p>
              </div>
            </div>
            <div class="p-2.5 rounded-lg bg-muted/60 text-xs text-muted-foreground leading-relaxed">
              无杆腔面积 {{ fmtNum(cylResult.aBore, 1) }} mm²<span v-if="cylResult.pull !== null">，有杆腔环形面积 {{ fmtNum(cylResult.aAnn, 1) }} mm²</span>。
              与气动缸的差异：油压可到 25~31 MPa，气动一般 0.4~0.8 MPa，同等缸径下液压输出力约为气动的 30~70 倍（
              <NuxtLink to="/tools/pneumatic-cylinder" class="text-primary hover:underline">气动缸推力计算</NuxtLink>
              按气压口径另算）。
            </div>
          </div>
          <div v-else class="p-8 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
            请输入大于 0 的缸径与压强，η 取 0.5~1
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
        <!-- 16t 千斤顶锚点表 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Anchor class="w-4 h-4 text-primary mr-1.5" /> 典型锚点：16t 液压千斤顶
          </h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center py-1.5 border-b border-border/60">
              <span class="text-muted-foreground">额定顶升力 F₂</span>
              <span class="font-mono text-foreground">160 kN（16 t）</span>
            </div>
            <div class="flex justify-between items-center py-1.5 border-b border-border/60">
              <span class="text-muted-foreground">大活塞（常见 φ85）</span>
              <span class="font-mono text-foreground">A₂ ≈ 5674.5 mm²</span>
            </div>
            <div class="flex justify-between items-center py-1.5 border-b border-border/60">
              <span class="text-muted-foreground">系统油压 P = F₂/A₂</span>
              <span class="font-mono text-primary font-semibold">≈ 28.2 MPa</span>
            </div>
            <div class="flex justify-between items-center py-1.5 border-b border-border/60">
              <span class="text-muted-foreground">小活塞（常见 φ12）</span>
              <span class="font-mono text-foreground">A₁ ≈ 113.1 mm²</span>
            </div>
            <div class="flex justify-between items-center py-1.5 border-b border-border/60">
              <span class="text-muted-foreground">小活塞需力 F₁ = P·A₁</span>
              <span class="font-mono text-foreground">≈ 3.19 kN</span>
            </div>
            <div class="flex justify-between items-center py-1.5 border-b border-border/60">
              <span class="text-muted-foreground">手柄杠杆比（口径 25:1）</span>
              <span class="font-mono text-foreground">手压力 ≈ 128 N</span>
            </div>
            <div class="flex justify-between items-center py-1.5">
              <span class="text-muted-foreground">行程：小活塞压 50 mm</span>
              <span class="font-mono text-foreground">重物升 ≈ 1.0 mm</span>
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed mt-3">
            注：φ12 小活塞、φ85 大活塞与 25:1 杠杆比为常见口径示例，实际产品以说明书为准；28.2 MPa 落在液压油 25~31 MPa 典型工作压强区间内。
          </p>
        </div>

        <!-- 油压 vs 气压 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Droplets class="w-4 h-4 text-primary mr-1.5" /> 油压与气动的分工
          </h3>
          <ul class="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <li>• 液压：工作压强 10~25 MPa、高压系统 25~31.5 MPa，输出力大、刚度好，用于千斤顶、压机、工程机械。</li>
            <li>• 气动：0.4~0.8 MPa，响应快、清洁、成本低保，用于夹紧、送料、轻载往复。</li>
            <li>• 油液近似不可压缩（压缩性约 0.5~1%/10 MPa），气压则明显可压缩，定位刚度差。</li>
            <li>• 同缸径对比：P=20 MPa 液压 vs P=0.6 MPa 气动，力差约 33 倍。</li>
          </ul>
          <NuxtLink to="/tools/pneumatic-cylinder" class="inline-flex items-center gap-1 mt-3 text-xs text-primary hover:underline">
            气缸推力计算（气压口径） <ArrowRight class="w-3 h-3" />
          </NuxtLink>
        </div>

        <!-- 单位速记 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Scale class="w-4 h-4 text-primary mr-1.5" /> 单位速记
          </h3>
          <div class="space-y-1.5 text-xs text-muted-foreground font-mono leading-relaxed">
            <p>1 MPa = 1 N/mm²</p>
            <p>1 kN = 1000 N ≈ 102 kgf</p>
            <p>1 bar = 0.1 MPa</p>
            <p>A(圆) = πD²/4 ≈ 0.7854·D²</p>
            <p>F(N) = P(MPa) × A(mm²)</p>
          </div>
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
          什么是液压压力计算器
        </h2>
        <p class="text-muted-foreground mb-4">
          液压压力计算器是一款基于帕斯卡定律的在线速算工具，覆盖三个方向：一是千斤顶增力模型，输入小/大活塞直径与小活塞驱动力，按 F₂ = F₁ × (d₂/d₁)²
          求大活塞输出力，并按 h₂ = h₁ × (d₁/d₂)² 反比求行程；二是 P=F/A 三向互算，力、压强、活塞直径任知其二求其三（A = πD²/4）；
          三是液压缸推拉力，给缸径、杆径与工作压强，按效率 η（默认 0.9）算推力与拉力。全部计算在浏览器本地完成，不上传任何数据。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>千斤顶模式：输入小活塞 d₁、大活塞 d₂ 与小活塞力 F₁，读输出力 F₂ 与面积比，填行程看 h₂；</li>
          <li>P=F/A 模式：先选"求力 / 求压强 / 求直径"，再填另外两个已知量；</li>
          <li>液压缸模式：输入缸径、杆径、工作压强与效率 η，同时读推力（无杆腔）与拉力（有杆腔）；</li>
          <li>点"复制结果"把计算摘要粘贴到工单或选型记录。</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          液压计算公式
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>帕斯卡定律</strong>：密闭液体上的压强等值传递，F₂ = F₁ × (A₂/A₁) = F₁ × (d₂/d₁)²（千斤顶增力）；</li>
          <li><strong>行程反比</strong>：h₂ = h₁ × (A₁/A₂) = h₁ × (d₁/d₂)²，省力不省功（F₁h₁ ≈ F₂h₂）；</li>
          <li><strong>压强定义</strong>：P = F/A，活塞面积 A = πD²/4；1 MPa = 1 N/mm²，故 F(N) = P(MPa)×A(mm²)；</li>
          <li><strong>液压缸推力</strong>：F推 = P·πD²/4·η（无杆腔）；<strong>拉力</strong>：F拉 = P·π(D²−d²)/4·η（有杆腔），η 默认 0.9。</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4 mb-6">
          <div>
            <h3 class="text-lg font-semibold text-foreground">帕斯卡定律是什么？</h3>
            <p class="text-muted-foreground mt-1">
              加在密闭液体上的压强，能够大小不变地被液体向各个方向传递。因此小活塞上施加压力 F₁ 产生压强 P = F₁/A₁，
              大活塞感受到同样的 P，输出力 F₂ = P×A₂ = F₁×(A₂/A₁)。面积比越大输出力越大——这就是液压千斤顶、压力机的原理。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么千斤顶省力却不省功？</h3>
            <p class="text-muted-foreground mt-1">
              力放大多少倍，行程就缩小多少倍：h₂ = h₁×(A₁/A₂)。F₁×h₁ ≈ F₂×h₂，输入功约等于输出功（还要扣摩擦与内泄），
              所以 16t 千斤顶把 1t 重物顶起 10 cm，手柄要压很多下——省的是力，不是功。能量守恒在液压系统里同样成立。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">液压油会被压缩吗？</h3>
            <p class="text-muted-foreground mt-1">
              会，但很小：矿物油的压缩性约为每 10 MPa 压强变化 0.5%~1% 的体积变化，工程上多数场合按"不可压缩"处理。
              正因如此液压系统刚度好、定位准；高压长行程油缸（如 31.5 MPa 系统）精密控制时才需要计入油液压缩性与软管膨胀。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">液压和气动怎么分工？</h3>
            <p class="text-muted-foreground mt-1">
              液压工作压强 10~31.5 MPa，力大刚性好，适合千斤顶、压机、挖掘机等重载；气动 0.4~0.8 MPa，
              快速、清洁、便宜，适合夹紧、送料等轻载短行程。同等缸径下液压输出力约为气动的 30~70 倍。
              气动侧的计算见
              <NuxtLink to="/tools/pneumatic-cylinder" class="text-primary hover:underline">气缸推力计算器</NuxtLink>。
            </p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          相关工具
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground">
          <li><NuxtLink to="/tools/pneumatic-cylinder" class="text-primary hover:underline">气缸推力计算</NuxtLink>：气压 0.4~0.8 MPa 口径的推/拉力与行程时间；</li>
          <li><NuxtLink to="/tools/gear-ratio-reducer" class="text-primary hover:underline">减速比计算</NuxtLink>：液压马达 + 减速器选型的转速扭矩换算；</li>
          <li><NuxtLink to="/tools/torque-unit-converter" class="text-primary hover:underline">扭矩单位换算器</NuxtLink>：N·m、kgf·m、lb-ft 互算；</li>
          <li><NuxtLink to="/tools/pressure-unit-converter" class="text-primary hover:underline">压力单位换算</NuxtLink>：MPa、bar、psi、kgf/cm² 互转。</li>
        </ul>
      </div>
    </div>

    <!-- 相关推荐 -->
    <RelatedTools :current-tool-id="'hydraulic-force'" :category="'calculate'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Droplet, Droplets, Calculator, Info, Anchor, Scale, ArrowRight,
  Copy, Check, ChevronUp, HelpCircle
} from 'lucide-vue-next'
import { addRecentTool } from '~/composables/useTools'
import { resolveToolIcon } from '~/utils/toolIcons'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'hydraulic-force'
const STORAGE_KEY = 'hydraulic-force.inputs'

// SEO配置
useSeoMeta({
  title: '液压压力计算器 - 帕斯卡原理与液压缸推力速算 | 有条工具',
  description: '免费在线液压计算器：帕斯卡定律千斤顶增力 F2=F1×(A2/A1) 与行程反比、P=F/A 力压强活塞直径三向互算（A=πD²/4）、液压缸推拉力 P·πD²/4·η（η默认0.9），油压25~31MPa口径，附16t千斤顶锚点表，纯本地计算。',
  keywords: '液压压力计算,帕斯卡定律计算,液压缸推力计算,千斤顶省力原理,活塞面积计算,F=PA,液压计算,hydraulic force calculator,油缸推力',
  author: '有条工具',
  ogTitle: '液压压力计算器 - 帕斯卡原理与液压缸推力速算',
  ogDescription: '千斤顶增力、P=F/A 三向互算、液压缸推拉力含效率η，油压25~31MPa口径，纯本地计算。',
  ogUrl: 'https://www.util.cn/tools/hydraulic-force',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '液压压力计算器 - 机械传动速算',
  twitterDescription: '帕斯卡原理三向计算：千斤顶增力、力压强直径互算、液压缸推拉力。'
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
          name: '液压压力计算器',
          url: 'https://www.util.cn/tools/hydraulic-force',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '千斤顶增力：F2 = F1 × (A2/A1)，行程反比 h2 = h1 × (A1/A2)',
            'P=F/A 三向互算：力 / 压强 / 活塞直径（A = πD²/4）',
            '液压缸推力与拉力，效率 η 默认 0.9',
            '油压 25~31 MPa 口径注记，16t 千斤顶锚点表',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '液压压力计算器', item: 'https://www.util.cn/tools/hydraulic-force/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '帕斯卡定律是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '加在密闭液体上的压强大小不变地向各个方向传递。小活塞产生压强 P=F1/A1，大活塞输出 F2=P×A2=F1×(A2/A1)，面积比即增力倍数，是液压千斤顶与压力机的原理。' }
            },
            {
              '@type': 'Question',
              name: '为什么千斤顶省力却不省功？',
              acceptedAnswer: { '@type': 'Answer', text: '力放大多少倍行程就缩小多少倍：h2 = h1×(A1/A2)，F1×h1 ≈ F2×h2，输入功约等于输出功（还要扣摩擦与内泄）。省的是力，不是功。' }
            },
            {
              '@type': 'Question',
              name: '液压油会被压缩吗？',
              acceptedAnswer: { '@type': 'Answer', text: '会但很小：矿物油每 10 MPa 压强变化约 0.5%~1% 体积变化，工程上多数场合按不可压缩处理，因此液压系统刚度好；高压长行程精密控制时才需计入压缩性。' }
            },
            {
              '@type': 'Question',
              name: '液压和气动怎么分工？',
              acceptedAnswer: { '@type': 'Answer', text: '液压 10~31.5 MPa，力大刚性好，适合千斤顶、压机、工程机械；气动 0.4~0.8 MPa，快速清洁便宜，适合轻载短行程。同等缸径下液压输出力约为气动的 30~70 倍。' }
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

const toolIcon = resolveToolIcon('Droplet', 'calculate')

// ==== PURE-FNS-START ====
// 活塞面积（mm²）：A = πD²/4
function pistonAreaMm2(dMm: number): number | null {
  if (!Number.isFinite(dMm) || dMm <= 0) return null
  return Math.PI * dMm * dMm / 4
}

// 千斤顶增力：F2 = F1 × (d2/d1)²
function jackOutputForce(f1N: number, d1Mm: number, d2Mm: number): number | null {
  if (!Number.isFinite(f1N) || !Number.isFinite(d1Mm) || !Number.isFinite(d2Mm)) return null
  if (d1Mm <= 0 || d2Mm <= 0 || f1N < 0) return null
  const r = d2Mm / d1Mm
  return f1N * r * r
}

// 面积比（即直径比的平方）：A2/A1 = (d2/d1)²
function jackAreaRatio(d1Mm: number, d2Mm: number): number | null {
  if (!Number.isFinite(d1Mm) || !Number.isFinite(d2Mm) || d1Mm <= 0 || d2Mm <= 0) return null
  const r = d2Mm / d1Mm
  return r * r
}

// 行程反比：h2 = h1 × (d1/d2)²
function jackStroke(h1Mm: number, d1Mm: number, d2Mm: number): number | null {
  if (!Number.isFinite(h1Mm) || !Number.isFinite(d1Mm) || !Number.isFinite(d2Mm)) return null
  if (d1Mm <= 0 || d2Mm <= 0 || h1Mm < 0) return null
  const r = d1Mm / d2Mm
  return h1Mm * r * r
}

// P=F/A 三向（MPa × mm² = N）
function forceFromPressure(pMpa: number, dMm: number): number | null {
  if (!Number.isFinite(pMpa) || !Number.isFinite(dMm) || pMpa < 0 || dMm <= 0) return null
  const a = pistonAreaMm2(dMm)
  return a === null ? null : pMpa * a
}

function pressureFromForce(fN: number, dMm: number): number | null {
  if (!Number.isFinite(fN) || !Number.isFinite(dMm) || fN < 0 || dMm <= 0) return null
  return 4 * fN / (Math.PI * dMm * dMm)
}

function diameterFromForce(fN: number, pMpa: number): number | null {
  if (!Number.isFinite(fN) || !Number.isFinite(pMpa) || fN < 0 || pMpa <= 0) return null
  return Math.sqrt(4 * fN / (Math.PI * pMpa))
}

// 液压缸推力（无杆腔）：F = P·πD²/4·η，单位 N
function cylinderThrustN(pMpa: number, boreMm: number, eta: number): number | null {
  if (!Number.isFinite(pMpa) || !Number.isFinite(boreMm) || !Number.isFinite(eta)) return null
  if (pMpa < 0 || boreMm <= 0 || eta < 0 || eta > 1) return null
  const a = pistonAreaMm2(boreMm)
  return a === null ? null : pMpa * a * eta
}

// 液压缸拉力（有杆腔环形腔）：F = P·π(D²−d²)/4·η，单位 N；rod=0 时不适用返回 null
function cylinderPullN(pMpa: number, boreMm: number, rodMm: number, eta: number): number | null {
  if (!Number.isFinite(pMpa) || !Number.isFinite(boreMm) || !Number.isFinite(rodMm) || !Number.isFinite(eta)) return null
  if (pMpa < 0 || boreMm <= 0 || rodMm < 0 || rodMm >= boreMm || eta < 0 || eta > 1) return null
  const a = Math.PI * (boreMm * boreMm - rodMm * rodMm) / 4
  return pMpa * a * eta
}
// ==== PURE-FNS-END ====

// ---------- 状态 ----------
const mode = ref<'jack' | 'pfa' | 'cylinder'>('jack')
const seoContentVisible = ref(true)
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

// 千斤顶
const jackD1 = ref<number | null>(12)
const jackD2 = ref<number | null>(60)
const jackF1 = ref<number | null>(200)
const jackH1 = ref<number | null>(50)

// P=F/A
const pfaOptions = [
  { value: 'force', label: '求力 F' },
  { value: 'pressure', label: '求压强 P' },
  { value: 'diameter', label: '求直径 D' }
] as const
const pfaTarget = ref<'force' | 'pressure' | 'diameter'>('force')
const pfaF = ref<number | null>(100000)
const pfaP = ref<number | null>(20)
const pfaD = ref<number | null>(80)

// 液压缸
const cylBore = ref<number | null>(80)
const cylRod = ref<number | null>(45)
const cylP = ref<number | null>(20)
const cylEta = ref<number | null>(0.9)

// ---------- 千斤顶结果 ----------
const jackResult = computed(() => {
  const d1 = Number(jackD1.value)
  const d2 = Number(jackD2.value)
  const ratio = jackAreaRatio(d1, d2)
  if (ratio === null) return null
  const a1 = pistonAreaMm2(d1)
  const a2 = pistonAreaMm2(d2)
  if (a1 === null || a2 === null) return null
  const f1 = Number(jackF1.value)
  const h1 = Number(jackH1.value)
  const f2 = jackOutputForce(f1, d1, d2)
  const h2 = jackStroke(h1, d1, d2)
  return {
    a1,
    a2,
    areaRatio: ratio,
    f2: f2 ?? 0,
    hasF: f2 !== null,
    h2: h2 ?? 0,
    hasH: h2 !== null
  }
})

// ---------- P=F/A 结果 ----------
const pfaResult = computed(() => {
  if (pfaTarget.value === 'force') {
    const p = Number(pfaP.value)
    const d = Number(pfaD.value)
    const f = forceFromPressure(p, d)
    if (f === null) return null
    return {
      formula: `F = P × A = ${fmtNum(p, 2)} MPa × π×${fmtNum(d, 1)}²/4`,
      display: fmtNum(f, 1),
      unit: `N（≈ ${fmtNum(f / 1000, 2)} kN）`
    }
  }
  if (pfaTarget.value === 'pressure') {
    const f = Number(pfaF.value)
    const d = Number(pfaD.value)
    const p = pressureFromForce(f, d)
    if (p === null) return null
    return {
      formula: `P = 4F/(πD²) = 4×${fmtNum(f, 0)}/(π×${fmtNum(d, 1)}²)`,
      display: fmtNum(p, 2),
      unit: 'MPa'
    }
  }
  const f = Number(pfaF.value)
  const p = Number(pfaP.value)
  const d = diameterFromForce(f, p)
  if (d === null) return null
  return {
    formula: `D = √(4F/(πP)) = √(4×${fmtNum(f, 0)}/(π×${fmtNum(p, 2)}))`,
    display: fmtNum(d, 2),
    unit: 'mm'
  }
})

// ---------- 液压缸结果 ----------
const cylResult = computed(() => {
  const bore = Number(cylBore.value)
  const rod = Number(cylRod.value)
  const p = Number(cylP.value)
  const eta = Number(cylEta.value)
  const thrust = cylinderThrustN(p, bore, eta)
  if (thrust === null) return null
  const aBore = pistonAreaMm2(bore) as number
  const pull = cylinderPullN(p, bore, rod, eta)
  return {
    thrust,
    pull,
    aBore,
    aAnn: pull !== null ? Math.PI * (bore * bore - rod * rod) / 4 : null
  }
})

// ---------- 复制 ----------
const copyText = computed(() => {
  if (mode.value === 'jack' && jackResult.value) {
    const r = jackResult.value
    return `帕斯卡千斤顶：d1=${trimNum(Number(jackD1.value))}mm、d2=${trimNum(Number(jackD2.value))}mm，面积比 ${fmtNum(r.areaRatio, 2)} 倍，F1=${trimNum(Number(jackF1.value))}N → F2=${fmtNum(r.f2, 1)}N（${fmtNum(r.f2 / 1000, 2)}kN），h1=${trimNum(Number(jackH1.value))}mm → h2=${fmtNum(r.h2, 3)}mm`
  }
  if (mode.value === 'pfa' && pfaResult.value) {
    return `P=F/A 互算：${pfaResult.value.formula} → ${pfaResult.value.display} ${pfaResult.value.unit}`
  }
  if (mode.value === 'cylinder' && cylResult.value) {
    const r = cylResult.value
    return `液压缸：缸径 ${trimNum(Number(cylBore.value))}mm、杆径 ${trimNum(Number(cylRod.value))}mm、P=${trimNum(Number(cylP.value))}MPa、η=${trimNum(Number(cylEta.value))} → 推力 ${fmtNum(r.thrust, 0)}N（${fmtNum(r.thrust / 1000, 2)}kN）${r.pull !== null ? `，拉力 ${fmtNum(r.pull, 0)}N（${fmtNum(r.pull / 1000, 2)}kN）` : ''}`
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
function persistInputs() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode: mode.value,
      jackD1: jackD1.value,
      jackD2: jackD2.value,
      jackF1: jackF1.value,
      jackH1: jackH1.value,
      pfaTarget: pfaTarget.value,
      pfaF: pfaF.value,
      pfaP: pfaP.value,
      pfaD: pfaD.value,
      cylBore: cylBore.value,
      cylRod: cylRod.value,
      cylP: cylP.value,
      cylEta: cylEta.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
}

function loadInputs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (data && typeof data === 'object') {
      if (data.mode === 'jack' || data.mode === 'pfa' || data.mode === 'cylinder') mode.value = data.mode
      const numKeys = ['jackD1', 'jackD2', 'jackF1', 'jackH1', 'pfaF', 'pfaP', 'pfaD', 'cylBore', 'cylRod', 'cylP', 'cylEta'] as const
      for (const k of numKeys) {
        if (typeof data[k] === 'number' && Number.isFinite(data[k])) {
          (refMap[k] as unknown as { value: number }).value = data[k]
        }
      }
      if (data.pfaTarget === 'force' || data.pfaTarget === 'pressure' || data.pfaTarget === 'diameter') pfaTarget.value = data.pfaTarget
    }
  } catch (e) { /* 忽略解析失败 */ }
}

const refMap = {
  jackD1, jackD2, jackF1, jackH1, pfaF, pfaP, pfaD, cylBore, cylRod, cylP, cylEta
}

watch([mode, pfaTarget, jackD1, jackD2, jackF1, jackH1, pfaF, pfaP, pfaD, cylBore, cylRod, cylP, cylEta], () => {
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
