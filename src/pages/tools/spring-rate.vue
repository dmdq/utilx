<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <AspectRatio class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">弹簧刚度计算</h1>
          <p class="text-sm text-muted-foreground mt-1">胡克定律 k=F/x 互算、多弹簧串并联组合，圆柱螺旋弹簧理论刚度 G·d⁴/(8·D³·nₐ) 小算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线弹簧刚度计算器：单簧模式在「已知载荷与形变求刚度 k」与「已知刚度求形变 x」之间互算（单位 N/mm，1 N/mm = 1000 N/m）；
        组合模式支持任意 n 根弹簧并联（k=Σk，变硬）与串联（k=1/Σ(1/k)，变软）——并附与电阻组合恰好相反的记忆卡；
        侧栏提供圆柱螺旋压缩弹簧理论刚度小算 k = G·d⁴/(8·D³·nₐ)（G=79 GPa 钢口径），可一键填回单簧模式继续算。
        适合选型替换弹簧、配重回弹机构与夹具设计速算。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/60 border border-border">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs leading-relaxed text-muted-foreground">
        口径说明：k = F/x 为割线刚度口径（载荷-形变曲线上两点连线，线性弹簧即常数）；螺旋弹簧理论式取
        剪切模量 <span class="text-foreground font-medium">G = 79 GPa（钢）</span>，
        <span class="text-foreground font-medium">有效圈数 nₐ = 总圈数 − 2</span>（两端各约 1 圈支承圈不参与变形的口径）；
        实测弹簧因材料、节距、端圈磨面差异，与理论值偏差 ±5%~10% 常见，验收以载荷-形变实测为准。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主区：单簧 / 组合 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <div class="grid grid-cols-2 gap-1.5">
            <button
              @click="mode = 'single'"
              :class="mode === 'single' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >单簧刚度 k = F/x</button>
            <button
              @click="mode = 'combo'"
              :class="mode === 'combo' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >弹簧组合（串/并联）</button>
          </div>

          <!-- 单簧模式 -->
          <div v-if="mode === 'single'" class="space-y-4">
            <div>
              <p class="text-xs text-muted-foreground mb-1.5">求解目标</p>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="singleMode = 'k'"
                  :class="singleMode === 'k' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground border border-border hover:border-primary/40'"
                  class="py-2 rounded-lg text-sm font-medium transition-all"
                >求 k（已知 F、x）</button>
                <button
                  @click="singleMode = 'x'"
                  :class="singleMode === 'x' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground border border-border hover:border-primary/40'"
                  class="py-2 rounded-lg text-sm font-medium transition-all"
                >求 x（已知 F、k）</button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label for="spr-f" class="block text-sm font-medium text-foreground mb-1.5">载荷 F（N）</label>
                <input
                  id="spr-f"
                  v-model.number="inF"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 100"
                >
              </div>
              <div v-if="singleMode === 'k'">
                <label for="spr-x" class="block text-sm font-medium text-foreground mb-1.5">形变 x（mm）</label>
                <input
                  id="spr-x"
                  v-model.number="inX"
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="压缩/拉伸量，如 10"
                >
                <p class="text-xs text-muted-foreground mt-1">工作行程：自由长 − 受载长（取绝对值）</p>
              </div>
              <div v-else>
                <label for="spr-k" class="block text-sm font-medium text-foreground mb-1.5">刚度 k（N/mm）</label>
                <input
                  id="spr-k"
                  v-model.number="inK"
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 10"
                >
                <p class="text-xs text-muted-foreground mt-1">弹簧图样标注或实测 k 值</p>
              </div>
              <div class="p-3 rounded-lg bg-muted/50 border border-border flex flex-col justify-center">
                <p class="text-xs text-muted-foreground">{{ singleMode === 'k' ? '刚度 k = F / x' : '形变 x = F / k' }}</p>
                <p class="text-2xl font-bold text-primary mt-1">
                  <template v-if="singleMode === 'k'">{{ singleK === null ? '—' : fmtN(singleK) + ' N/mm' }}</template>
                  <template v-else>{{ singleX === null ? '—' : fmtN(singleX) + ' mm' }}</template>
                </p>
                <p v-if="singleMode === 'k' && singleK !== null" class="text-xs text-muted-foreground mt-0.5">
                  = {{ fmtN(singleK * 1000) }} N/m
                </p>
              </div>
            </div>

            <p v-if="singleError" class="text-xs text-red-500">{{ singleError }}</p>

            <p class="text-xs leading-relaxed text-muted-foreground">
              胡克定律 F = k·x 只在弹性区成立：压缩弹簧接近压并高度、拉伸弹簧超过许用载荷后刚度不再线性，
              本工具结果仅对线性段有效。需要校核行程末端的「压并应力」时，请按弹簧厂手册另算。
            </p>
          </div>

          <!-- 组合模式 -->
          <div v-else class="space-y-4">
            <div>
              <p class="text-xs text-muted-foreground mb-1.5">连接方式</p>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="conn = 'parallel'"
                  :class="conn === 'parallel' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground border border-border hover:border-primary/40'"
                  class="py-2 rounded-lg text-sm font-medium transition-all"
                >并联（并排装）→ 变硬</button>
                <button
                  @click="conn = 'series'"
                  :class="conn === 'series' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground border border-border hover:border-primary/40'"
                  class="py-2 rounded-lg text-sm font-medium transition-all"
                >串联（叠着装）→ 变软</button>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-sm font-medium text-foreground">各弹簧刚度 kᵢ（N/mm）</label>
                <button
                  v-if="springKs.length < 8"
                  @click="addSpring"
                  class="px-2.5 py-1 rounded-lg border border-border bg-background hover:border-primary/50 text-xs font-medium text-foreground transition"
                >
                  <Plus class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-primary" /> 加一根
                </button>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div v-for="(kv, i) in springKs" :key="i" class="relative">
                  <label :for="'spr-k' + i" class="sr-only">弹簧 {{ i + 1 }}</label>
                  <input
                    :id="'spr-k' + i"
                    v-model.number="springKs[i]"
                    type="number"
                    min="0"
                    step="0.5"
                    class="w-full px-3 py-2 pr-7 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    :placeholder="'k' + (i + 1)"
                  >
                  <button
                    v-if="springKs.length > 1"
                    @click="removeSpring(i)"
                    class="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-500"
                    :aria-label="'删除弹簧 ' + (i + 1)"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div v-if="comboValid" class="p-4 rounded-lg border border-primary/30 bg-primary/10">
              <p class="text-sm text-muted-foreground mb-1">
                {{ conn === 'parallel' ? '并联总刚度 k = k₁ + k₂ + …' : '串联总刚度 1/k = 1/k₁ + 1/k₂ + …' }}
              </p>
              <p class="text-3xl font-bold text-primary">
                {{ fmtN(comboK) }} <span class="text-sm font-normal">N/mm</span>
                <span class="text-base font-semibold">= {{ fmtN(comboK * 1000) }} N/m</span>
              </p>
              <p class="text-xs text-muted-foreground mt-2">
                {{ conn === 'parallel'
                  ? '并联后每根弹簧分担同一载荷的一部分，总刚度比任何一根都大（变硬）。'
                  : '串联后每根弹簧承受同样的力、形变叠加，总刚度比任何一根都小（变软）。' }}
              </p>
            </div>
            <p v-else class="text-xs text-red-500">请给每根弹簧填入大于 0 的刚度（N/mm）。</p>

            <!-- 与电阻相反警示卡 -->
            <div class="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-medium text-foreground">别背反了：弹簧与电阻的组合恰好相反</p>
                <p class="text-xs text-muted-foreground mt-1 leading-relaxed">
                  弹簧<span class="text-foreground font-medium">串联变软、并联变硬</span>；
                  电阻<span class="text-foreground font-medium">串联变大、并联变小</span>。
                  记忆法：弹簧串的是「行程」，一根被压长整串都软；电阻串的是「路径」，一个个加起来自然大。
                  两根相同 k 的弹簧：串 k/2、并 2k；两根相同电阻：串 2R、并 R/2——口诀「弹串减半、阻串加倍」。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 圆柱螺旋弹簧理论刚度 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 螺旋弹簧理论刚度
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            k = G·d⁴ / (8·D³·nₐ)，G = 79 GPa（钢）；
            d 线径、D 中径（≈ 外径 − 线径）、nₐ 有效圈数。
          </p>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label for="spr-cd" class="block text-xs text-muted-foreground mb-1">线径 d mm</label>
              <input
                id="spr-cd"
                v-model.number="coilD"
                type="number"
                min="0.1"
                step="0.2"
                class="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
            </div>
            <div>
              <label for="spr-cD" class="block text-xs text-muted-foreground mb-1">中径 D mm</label>
              <input
                id="spr-cD"
                v-model.number="coilDm"
                type="number"
                min="0.5"
                step="1"
                class="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
            </div>
            <div>
              <label for="spr-ct" class="block text-xs text-muted-foreground mb-1">总圈数 n</label>
              <input
                id="spr-ct"
                v-model.number="coilNt"
                type="number"
                min="3"
                step="0.5"
                class="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
            </div>
          </div>
          <div v-if="coilK !== null" class="p-3 rounded-lg bg-muted/50 border border-border">
            <p class="text-xs text-muted-foreground">有效圈数 nₐ = {{ fmtN(coilNt) }} − 2 = <span class="text-foreground font-medium">{{ fmtN(coilNa) }}</span></p>
            <p class="text-xl font-bold text-primary mt-1">{{ fmtN(coilK) }} N/mm</p>
          </div>
          <p v-else class="text-xs text-red-500">请检查输入：d、D、总圈数需大于 0，总圈数建议 ≥ 3。</p>
          <p class="text-[11px] leading-relaxed text-muted-foreground">
            线径 d 在四次方上——d 加大 20%，刚度约翻一倍，这是选硬弹簧最狠的一招；中径 D 三次方、圈数线性。
            总圈 − 2 为两端支承圈（死圈）不参与变形的常用口径，端面磨平的弹簧更接近此口径。
          </p>
          <button
            v-if="coilK !== null"
            @click="fillFromCoil"
            class="w-full px-3 py-1.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-xs font-medium text-foreground transition"
          >
            把 {{ fmtN(coilK) }} N/mm 填入单簧计算
          </button>
        </div>

        <!-- 刚度与固有频率 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Zap class="w-5 h-5 mr-2 text-primary" /> 刚度与固有频率
          </h2>
          <div class="bg-muted/50 rounded-lg p-3 border border-border">
            <p class="text-xs text-muted-foreground">隔振系统固有频率（Hz）</p>
            <p class="text-lg font-bold text-foreground mt-1 font-mono">f ≈ 4.98 / √x<sub>st</sub>(cm)</p>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            弹簧刚度决定系统固有频率：f = (1/2π)·√(k/m)，静压缩量 x<sub>st</sub> = mg/k 越大频率越低、隔振越好。
            经验式「f ≈ 4.98/√x(cm)」用静压缩量直接估频率——想隔掉 20Hz 以上的振动，静压缩量得有 6cm 以上。
            换更硬的弹簧（k 变大）会让固有频率上移，可能恰好撞上设备转速频率引起共振，更换弹簧前先核一下工作转速。
          </p>
        </div>
      </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>弹簧刚度计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          弹簧刚度计算器处理三件事：① 单簧刚度互算——已知载荷与形变求 k（N/mm），或已知 k 求某载荷下的形变；
          ② 多弹簧组合——任意 n 根弹簧按并联（k=Σk）或串联（k=1/Σ(1/k)）求总刚度，附与电阻组合相反的警示；
          ③ 圆柱螺旋弹簧理论刚度小算——由线径 d、中径 D 与有效圈数 nₐ 按 k = G·d⁴/(8·D³·nₐ)（G=79 GPa 钢口径）估算 k 值。
          适合维修替换弹簧时反推规格、夹具与隔振设计选刚度。全部计算在浏览器本地完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">弹簧串并联和电阻有什么不同？记忆法是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          结论先记牢：<span class="text-foreground font-medium">弹簧串联变软、并联变硬；电阻串联变大、并联变小</span>——两套组合规则恰好互为镜像。
          原因在「串的是什么」：弹簧串联时共用同一个力，形变却要叠加，行程翻倍而力不变，k = F/x 自然减半（两根 10 N/mm 串联得 5 N/mm）；
          弹簧并联时形变相同，力由各根分摊相加，k = Σk 翻倍（两根 10 N/mm 并联得 20 N/mm）。
          电阻串联是电流路径一个个接起来，R = R₁+R₂ 变大；并联是路径分岔，R 变小。
          记忆口诀：想「装在一起更难压」选并联，像电阻的「反向世界」。n 根相同 k 的弹簧：并联 nk、串联 k/n——这条在配弹簧时最常用。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">有效圈数怎么数？为什么总圈数要减 2？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          圆柱螺旋压缩弹簧两端各有约 0.75~1 圈「支承圈」（死圈）：它们被压平贴在端面上，只负责把力均匀传到端面，
          基本不产生扭转变形，所以不参与刚度。常用口径取两端各 1 圈，即 <span class="text-foreground font-medium">nₐ = 总圈数 − 2</span>。
          数圈数时数螺距完整的圈（端圈贴并的那圈不算进有效段）。端面磨平的弹簧最接近这个口径；
          拉伸弹簧整圈都参与变形（钩环另算），直接用总圈数即可。圈数标错一位，k 值差一截——维修换弹簧时不妨用本工具
          反算一下：量外径与线径，按实测 k 校核图样标注是否一致。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">刚度和固有频率、隔振有什么关系？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          质量 m 挂在刚度 k 的弹簧上，固有频率 f = (1/2π)·√(k/m)。频率比（激励频率/固有频率）大于 √2 才有隔振效果，
          所以「选软弹簧」是隔振设计的核心手段。用静压缩量换算最直观：x<sub>st</sub> = mg/k（cm 口径），
          f ≈ 4.98/√x<sub>st</sub>——静压缩 1 cm 约 5 Hz，4 cm 约 2.5 Hz。反过来，把设备垫铁换成更硬的弹簧，
          固有频率上移，可能恰好落进设备转速的激励频率里产生共振，振动反而变大；更换弹簧或增减垫片后出现新振动，
          先查频率比。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">弹簧疲劳与更换判据</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          弹簧失效九成是疲劳断簧而不是「弹力变小」：交变应力集中在材料缺陷或内表面划痕处萌生裂纹，圈数多的断在里圈第二、三圈。
          判据：自由长度比新件缩短超过约 3%~5%、端面明显歪斜、出现压痕或裂纹——直接换新，不要试图校正后再用。
          高频工况（气门弹簧、阀弹簧）对脏污与润滑敏感，异物嵌入圈间会造成局部应力集中提前断簧。
          更换时优先同规格同材料替换：线径差 0.1 mm 刚度差可达 ±20%，凭手感凑刚度等于埋雷；
          用本工具按「载荷-形变」实测两点求 k，再对照螺旋弹簧理论式反推线径，比只量外径靠谱得多。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">两根 10 N/mm 的弹簧串联和并联总刚度分别是多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">串联 k = 1/(1/10 + 1/10) = 5 N/mm（变软），并联 k = 10 + 10 = 20 N/mm（变硬）。n 根相同弹簧：串联 k/n、并联 nk。注意与电阻组合规则正好相反。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">k = F/x 中单位怎么统一？</h3>
            <p class="text-sm text-muted-foreground mt-1">工程上最常用 F 取牛（N）、x 取毫米（mm），得 k 的单位 N/mm；换算 1 N/mm = 1000 N/m = 1 kN/m。本工具全程 N/mm 口径，结果附 N/m 对照。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">量不到中径怎么估螺旋弹簧刚度？</h3>
            <p class="text-sm text-muted-foreground mt-1">中径 D ≈ 外径 − 线径（压缩弹簧）。用卡尺量外径与线径代入侧栏小算即可；拉伸弹簧钩环段的圈距不规则，中径直接量弹簧体内径 + 线径更稳。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">换更硬的弹簧有什么副作用？</h3>
            <p class="text-sm text-muted-foreground mt-1">三件事跟着变：同样载荷下形变减小（行程不够可能压不到位反而顶死）、系统固有频率上移（可能撞上激励频率共振）、最大压并载荷提高（对导向件与端面压力变大）。换弹簧前把行程两端都核一遍。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'spring-rate'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Ratio as AspectRatio, Ruler, Zap, Info, AlertTriangle, ChevronUp, ChevronDown,
  Plus, X
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 单簧刚度（胡克定律，割线刚度口径）：k = F/x，F N、x mm → k N/mm
function kFromFx(forceN, deflMm) {
  if (!(forceN > 0) || !(deflMm > 0)) return null
  return forceN / deflMm
}

// 形变：x = F/k，F N、k N/mm → x mm
function xFromFk(forceN, kNpmm) {
  if (!(forceN > 0) || !(kNpmm > 0)) return null
  return forceN / kNpmm
}

// 并联：k_total = Σk（各簧形变相同、力相加）
function parallelK(ks) {
  if (!Array.isArray(ks) || ks.length === 0) return null
  let sum = 0
  for (const k of ks) {
    if (!(Number(k) > 0)) return null
    sum += Number(k)
  }
  return sum
}

// 串联：1/k_total = Σ(1/k)（各簧受力相同、形变叠加）
function seriesK(ks) {
  if (!Array.isArray(ks) || ks.length === 0) return null
  let inv = 0
  for (const k of ks) {
    if (!(Number(k) > 0)) return null
    inv += 1 / Number(k)
  }
  return 1 / inv
}

// 圆柱螺旋弹簧理论刚度：k = G·d⁴/(8·D³·nₐ)，G N/mm²、d/D mm → N/mm
function coilSpringK(gNpmm2, wireDm, meanDm, activeCoils) {
  if (!(gNpmm2 > 0) || !(wireDm > 0) || !(meanDm > 0) || !(activeCoils > 0)) return null
  return (gNpmm2 * Math.pow(wireDm, 4)) / (8 * Math.pow(meanDm, 3) * activeCoils)
}

// 有效圈数：总圈数 − 2 支承圈口径（两端各约 1 圈死圈），下限 1
function activeCoils(totalCoils) {
  if (!(totalCoils > 2)) return null
  return Math.max(1, totalCoils - 2)
}

// 显示：智能位数（<1 保留 3 位，<10 保留 2 位，其余 1 位），避免浮点尾差
function fmtN(v) {
  if (v === null || !Number.isFinite(v)) return '—'
  const abs = Math.abs(v)
  let d = 1
  if (abs < 1) d = 3
  else if (abs < 10) d = 2
  return String(Math.round(v * 10 ** d) / 10 ** d)
}
// ==== PURE-FNS-END ====

// ---------- SEO ----------
useSeoMeta({
  title: '弹簧刚度计算器 - k=F/x 胡克定律与串并联组合在线计算',
  description: '在线弹簧刚度计算器：已知载荷与形变求 k（N/mm）或已知刚度求形变，任意 n 根弹簧并联 k=Σk、串联 1/k=Σ(1/k) 组合计算并附与电阻相反的警示记忆卡，圆柱螺旋弹簧理论刚度 k=G·d⁴/(8·D³·nₐ)（G=79GPa 钢，有效圈数=总圈−2 口径），刚度与固有频率、疲劳判据注记，纯浏览器本地计算。',
  keywords: '弹簧刚度计算,k值计算,劲度系数,弹簧串并联,胡克定律,螺旋弹簧刚度,有效圈数,弹簧固有频率',
  author: '有条工具',
  ogTitle: '弹簧刚度计算器 - k=F/x 胡克定律与串并联组合在线计算 | 有条工具',
  ogDescription: '单簧 k=F/x 互算、串并联组合（弹簧串联变软、并联变硬）与螺旋弹簧理论刚度小算。',
  ogUrl: 'https://www.util.cn/tools/spring-rate',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '弹簧刚度计算器',
  twitterDescription: 'k=F/x 互算、串并联组合与螺旋弹簧理论刚度小算。'
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
          name: '弹簧刚度计算器',
          url: 'https://www.util.cn/tools/spring-rate',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '单簧刚度 k=F/x 与形变 x=F/k 双向互算（N/mm）',
            '任意 n 根弹簧并联 k=Σk、串联 1/k=Σ(1/k) 组合',
            '弹簧/电阻组合规则相反的警示记忆卡',
            '圆柱螺旋弹簧理论刚度 k=G·d⁴/(8·D³·nₐ)（G=79GPa）',
            '有效圈数 nₐ=总圈数−2 支承圈口径',
            '刚度与固有频率、弹簧疲劳判据注记',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '弹簧刚度计算', item: 'https://www.util.cn/tools/spring-rate' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '两根 10 N/mm 的弹簧串联和并联总刚度分别是多少？',
              acceptedAnswer: { '@type': 'Answer', text: '串联 k=1/(1/10+1/10)=5 N/mm（变软），并联 k=10+10=20 N/mm（变硬）。n 根相同弹簧：串联 k/n、并联 nk，与电阻组合规则正好相反。' }
            },
            {
              '@type': 'Question',
              name: 'k=F/x 中单位怎么统一？',
              acceptedAnswer: { '@type': 'Answer', text: '工程上 F 取牛（N）、x 取毫米（mm），k 单位为 N/mm；1 N/mm = 1000 N/m = 1 kN/m。' }
            },
            {
              '@type': 'Question',
              name: '量不到中径怎么估螺旋弹簧刚度？',
              acceptedAnswer: { '@type': 'Answer', text: '压缩弹簧中径 D ≈ 外径 − 线径；拉伸弹簧量内径 + 线径更稳。代入 k=G·d⁴/(8·D³·nₐ)（G=79GPa）估算。' }
            },
            {
              '@type': 'Question',
              name: '换更硬的弹簧有什么副作用？',
              acceptedAnswer: { '@type': 'Answer', text: '同样载荷下形变减小可能行程不够、固有频率上移可能撞上激励频率共振、对端面与导向件压力变大。更换前核一遍行程两端。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'spring-rate'
const SETTINGS_KEY = 'spring-rate-settings'
onMounted(() => {
  addRecentTool(TOOL_ID)
  loadSettings()
})

// ---------- 状态 ----------
const mode = ref('single')           // 'single' 单簧 | 'combo' 组合
const singleMode = ref('k')          // 'k' 求 k | 'x' 求 x
const inF = ref(100)
const inX = ref(10)
const inK = ref(10)
const conn = ref('parallel')         // 'parallel' 并联 | 'series' 串联
const springKs = ref([10, 10])
const coilD = ref(2)
const coilDm = ref(10)
const coilNt = ref(10)
const seoContentVisible = ref(true)

// ---------- 派生 ----------
const singleK = computed(() => (singleMode.value === 'k' ? kFromFx(inF.value, inX.value) : null))
const singleX = computed(() => (singleMode.value === 'x' ? xFromFk(inF.value, inK.value) : null))
const singleError = computed(() => {
  if (singleMode.value === 'k') {
    if (Number.isFinite(inF.value) && inF.value > 0 && !(inX.value > 0)) return '形变 x 需大于 0（压缩/拉伸量取绝对值）。'
    if (!(inF.value > 0)) return '载荷 F 需大于 0。'
  } else if (!(inK.value > 0)) {
    return '刚度 k 需大于 0（N/mm）。'
  }
  return ''
})

const comboK = computed(() => (conn.value === 'parallel' ? parallelK(springKs.value) : seriesK(springKs.value)))
const comboValid = computed(() => comboK.value !== null)

const coilNa = computed(() => activeCoils(coilNt.value))
const coilK = computed(() => (coilNa.value === null ? null : coilSpringK(79000, coilD.value, coilDm.value, coilNa.value)))

// ---------- 交互 ----------
function addSpring() {
  if (springKs.value.length < 8) springKs.value.push(10)
}
function removeSpring(i) {
  if (springKs.value.length > 1) springKs.value.splice(i, 1)
}
function fillFromCoil() {
  if (coilK.value === null) return
  mode.value = 'single'
  singleMode.value = 'x'
  inK.value = Math.round(coilK.value * 100) / 100
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 设置持久化（localStorage，键前缀=工具 id，仅 onMounted/交互回调） ----------
function loadSettings() {
  if (typeof localStorage === 'undefined') return
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return
    const s = JSON.parse(saved)
    if (s.mode === 'single' || s.mode === 'combo') mode.value = s.mode
    if (s.singleMode === 'k' || s.singleMode === 'x') singleMode.value = s.singleMode
    if (s.conn === 'parallel' || s.conn === 'series') conn.value = s.conn
    if (Number.isFinite(s.inF) && s.inF > 0) inF.value = s.inF
    if (Number.isFinite(s.inX) && s.inX > 0) inX.value = s.inX
    if (Number.isFinite(s.inK) && s.inK > 0) inK.value = s.inK
    if (Array.isArray(s.springKs) && s.springKs.length >= 1 && s.springKs.length <= 8 && s.springKs.every((k) => Number(k) > 0)) springKs.value = s.springKs
    if (Number.isFinite(s.coilD) && s.coilD > 0) coilD.value = s.coilD
    if (Number.isFinite(s.coilDm) && s.coilDm > 0) coilDm.value = s.coilDm
    if (Number.isFinite(s.coilNt) && s.coilNt > 2) coilNt.value = s.coilNt
  } catch (err) { /* 忽略损坏的本地数据 */ }
}

watch([mode, singleMode, conn, inF, inX, inK, springKs, coilD, coilDm, coilNt], () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      mode: mode.value,
      singleMode: singleMode.value,
      conn: conn.value,
      inF: inF.value,
      inX: inX.value,
      inK: inK.value,
      springKs: springKs.value,
      coilD: coilD.value,
      coilDm: coilDm.value,
      coilNt: coilNt.value
    }))
  } catch (err) { /* 存储不可用时静默降级 */ }
}, { deep: true })
</script>
