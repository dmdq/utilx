<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Fish class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">水产用药计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">塘口面积水体估算 → 全池泼洒 / 拌饵投喂药量 → 休药期上市提醒</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        三步算清塘口用药：① 按矩形 / 圆形 / 梯形断面估算塘口面积（m² 与亩双显），乘平均水深得水体 m³；
        ② 方式A 全池泼洒按浓度（mg/L = g/m³）算总药量，克与千克双显；方式B 拌饵投喂按存塘鱼总重 × 按体重剂量算日药量与拌饵量；
        ③ 填入休药期天数与停药日期，生成「该日期后才能捕捞上市」的提醒。全部计算在浏览器本地完成，不上传任何数据。
      </p>
      <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <AlertTriangle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed text-foreground">
          <span class="font-semibold">渔药使用受《兽药管理条例》与执业兽医规范约束</span>：
          本工具仅做算术换算，不构成用药指导；实际用药品种、剂量、禁用清单与休药期，以药品说明书与执业兽医处方为准。
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 卡片1：水体估算 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Droplets class="w-5 h-5 mr-2 text-primary" /> 第一步 · 塘口水体估算
          </h2>

          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="sp in SHAPES"
              :key="sp.key"
              @click="shape = sp.key"
              class="py-2 rounded-lg border text-xs font-medium transition"
              :class="shape === sp.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
            >{{ sp.label }}</button>
          </div>

          <div v-if="shape === 'rect'" class="grid grid-cols-2 gap-3">
            <div>
              <label for="pm-rl" class="block text-xs font-medium text-muted-foreground mb-1.5">池长（m）</label>
              <input id="pm-rl" v-model.number="rectL" type="number" min="0" step="1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            </div>
            <div>
              <label for="pm-rw" class="block text-xs font-medium text-muted-foreground mb-1.5">池宽（m）</label>
              <input id="pm-rw" v-model.number="rectW" type="number" min="0" step="1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            </div>
          </div>
          <div v-else-if="shape === 'circle'" class="grid grid-cols-2 gap-3">
            <div>
              <label for="pm-cd" class="block text-xs font-medium text-muted-foreground mb-1.5">直径（m）</label>
              <input id="pm-cd" v-model.number="circleD" type="number" min="0" step="1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            </div>
          </div>
          <div v-else class="grid grid-cols-3 gap-3">
            <div>
              <label for="pm-tt" class="block text-xs font-medium text-muted-foreground mb-1.5">上底（水面宽，m）</label>
              <input id="pm-tt" v-model.number="trapTop" type="number" min="0" step="1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            </div>
            <div>
              <label for="pm-tb" class="block text-xs font-medium text-muted-foreground mb-1.5">下底（池底宽，m）</label>
              <input id="pm-tb" v-model.number="trapBottom" type="number" min="0" step="1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            </div>
            <div>
              <label for="pm-tl" class="block text-xs font-medium text-muted-foreground mb-1.5">池长（m）</label>
              <input id="pm-tl" v-model.number="trapLen" type="number" min="0" step="1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            </div>
            <p class="col-span-3 text-xs text-muted-foreground">梯形断面：垂直于池长方向切一刀，上底为水面宽、下底为池底宽，面积 = (上底+下底)/2 × 池长。</p>
          </div>

          <div class="max-w-xs">
            <label for="pm-depth" class="block text-xs font-medium text-muted-foreground mb-1.5">平均水深（m）</label>
            <input id="pm-depth" v-model.number="depthM" type="number" min="0" step="0.1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            <p class="text-xs text-muted-foreground mt-1.5">建议沿池边与中央多点测深取平均，坡底塘误差最大。</p>
          </div>

          <div v-if="volumeM3 !== null" class="p-4 rounded-lg border border-primary/30 bg-primary/10">
            <div class="grid grid-cols-2 gap-3 mb-3">
              <div class="text-center">
                <p class="text-xs text-muted-foreground mb-1">面积</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ fmt2(areaM2) }} m²</p>
                <p class="text-xs text-muted-foreground">≈ {{ fmt2(areaMu) }} 亩</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-muted-foreground mb-1">平均水深</p>
                <p class="text-lg font-bold text-foreground font-mono">{{ fmt2(depthM) }} m</p>
                <p class="text-xs text-muted-foreground">1 亩 = 666.67 m²</p>
              </div>
            </div>
            <div class="text-center border-t border-border pt-3">
              <p class="text-xs text-muted-foreground mb-1">水体（面积 × 平均水深）</p>
              <p class="text-3xl font-bold text-primary font-mono">{{ fmt2(volumeM3) }} <span class="text-sm font-normal">m³</span></p>
            </div>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-muted-foreground">请填写大于 0 的塘口尺寸与平均水深，即可算出面积与水体。</p>
          </div>
        </div>

        <!-- 卡片2：方式A 全池泼洒 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <FlaskConical class="w-5 h-5 mr-2 text-primary" /> 方式A · 全池泼洒（按浓度）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label for="pm-conc" class="block text-sm font-medium text-foreground mb-1.5">泼洒浓度（mg/L，= g/m³）</label>
              <input id="pm-conc" v-model.number="splashConc" type="number" min="0" step="0.1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <p class="text-xs text-muted-foreground mt-1.5">淡水 1 ppm ≈ 1 mg/L ≈ 1 g/m³，三套单位数值通用。</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground mb-1.5">公认宽档预设（仅供量级参考）</p>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  v-for="ps in SPLASH_PRESETS"
                  :key="ps.label"
                  @click="splashConc = ps.value"
                  class="py-2 px-2 rounded-lg border text-xs font-medium transition"
                  :class="splashConc === ps.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
                >
                  {{ ps.label }}<span class="block text-[10px] font-normal opacity-75">{{ ps.range }}</span>
                </button>
              </div>
            </div>
          </div>
          <div class="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p class="text-xs leading-relaxed text-amber-600 dark:text-amber-400 font-medium">
              显著提示：预设仅为两个公认宽档（生石灰清塘 20-30 g/m³、二氧化氯消毒 0.1-0.3 g/m³），
              仅供参考，以药品说明书与执业兽医处方为准。
            </p>
          </div>
          <div v-if="splashG !== null" class="p-4 rounded-lg border border-primary/30 bg-primary/10 text-center">
            <p class="text-xs text-muted-foreground mb-1">总药量 = 水体 {{ fmt2(volumeM3) }} m³ × 浓度 {{ fmt2(splashConc) }} g/m³</p>
            <p class="text-3xl font-bold text-primary font-mono">{{ fmt2(splashG) }} <span class="text-sm font-normal">g</span></p>
            <p class="text-sm text-muted-foreground mt-1">≈ {{ fmt3(splashG / 1000) }} kg（1 mg/L = 1 g/m³，总药量 = 水体 × 浓度）</p>
          </div>
          <p v-else class="text-xs text-muted-foreground">水体与浓度均有效后给出总药量；浓度必须大于 0。</p>
        </div>

        <!-- 卡片3：方式B 拌饵投喂 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Utensils class="w-5 h-5 mr-2 text-primary" /> 方式B · 拌饵投喂（按鱼体重）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="pm-fish" class="block text-sm font-medium text-foreground mb-1.5">存塘鱼总重（kg）</label>
              <input id="pm-fish" v-model.number="fishKg" type="number" min="0" step="50" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            </div>
            <div>
              <label for="pm-dose" class="block text-sm font-medium text-foreground mb-1.5">按体重剂量（mg/kg）</label>
              <input id="pm-dose" v-model.number="doseMgKg" type="number" min="0" step="5" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <p class="text-xs text-muted-foreground mt-1.5">以说明书/处方为准</p>
            </div>
            <div>
              <label for="pm-rate" class="block text-sm font-medium text-foreground mb-1.5">投饵率（%，默认 2）</label>
              <input id="pm-rate" v-model.number="feedRatePct" type="number" min="0" step="0.5" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <p class="text-xs text-muted-foreground mt-1.5">按水温与吃食情况调整</p>
            </div>
          </div>
          <div v-if="feedResult" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-4 rounded-lg border border-primary/30 bg-primary/10 text-center">
              <p class="text-xs text-muted-foreground mb-1">日药量（鱼重 × 剂量）</p>
              <p class="text-2xl font-bold text-primary font-mono">{{ fmt2(feedResult.drugG) }} <span class="text-xs font-normal">g</span></p>
            </div>
            <div class="p-4 rounded-lg border border-border bg-muted/50 text-center">
              <p class="text-xs text-muted-foreground mb-1">日投饵量（鱼重 × 投饵率）</p>
              <p class="text-2xl font-bold text-foreground font-mono">{{ fmt2(feedResult.feedKg) }} <span class="text-xs font-normal">kg</span></p>
            </div>
            <div class="p-4 rounded-lg border border-border bg-muted/50 text-center">
              <p class="text-xs text-muted-foreground mb-1">每 kg 饲料拌药</p>
              <p class="text-2xl font-bold text-foreground font-mono">{{ fmt2(feedResult.drugPerKgFeedG) }} <span class="text-xs font-normal">g</span></p>
            </div>
          </div>
          <p v-else class="text-xs text-muted-foreground">鱼重、剂量与投饵率均需大于 0；存塘鱼重量可按投放记录或抽样估算法核对。</p>
        </div>

        <!-- 卡片4：休药期提醒 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CalendarClock class="w-5 h-5 mr-2 text-primary" /> 休药期提醒
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="pm-wd" class="block text-sm font-medium text-foreground mb-1.5">休药期（天）</label>
              <input id="pm-wd" v-model.number="wdDays" type="number" min="0" step="1" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <p class="text-xs text-muted-foreground mt-1.5">按所用药品说明书/处方填写</p>
            </div>
            <div>
              <label for="pm-wddate" class="block text-sm font-medium text-foreground mb-1.5">最后一次用药/停药日期</label>
              <input id="pm-wddate" v-model="wdDate" type="date" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            </div>
          </div>
          <div v-if="wdNotice" class="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
            <p class="text-sm leading-relaxed text-foreground font-medium">{{ wdNotice }}</p>
            <p class="text-xs text-muted-foreground mt-2">休药期从最后一次给药之日起算；提前捕捞上市属违规行为，残留超标还将面临抽检处罚。</p>
          </div>
          <p v-else class="text-xs text-muted-foreground">填写休药期天数与停药日期后自动生成提醒（本地时区推算，无需联网）。</p>
          <button
            @click="copyScheme"
            class="px-3 py-1.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-xs font-medium text-foreground transition"
          >
            <CheckCircle v-if="copyStatus === 'ok'" class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-green-600" />
            <Copy v-else class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-primary" />
            {{ copyStatus === 'ok' ? '已复制' : '复制用药方案' }}
          </button>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-6">
        <!-- 单位与原理 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 单位与原理速记
          </h2>
          <div class="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5 text-xs text-muted-foreground leading-relaxed">
            <p><span class="font-mono text-foreground font-semibold">1 mg/L = 1 g/m³</span>（数值相同）</p>
            <p>淡水 <span class="font-mono text-foreground font-semibold">1 ppm ≈ 1 mg/L</span></p>
            <p><span class="font-mono text-foreground font-semibold">1 亩 = 666.67 m²</span>，1 亩 × 1 m 水深 = 666.67 m³</p>
            <p>全池泼洒总药量（g）= 水体 m³ × 浓度 g/m³</p>
            <p>拌饵日药量（g）= 鱼重 kg × 剂量 mg/kg ÷ 1000</p>
          </div>
          <p class="text-xs leading-relaxed text-muted-foreground">
            例：666.67 m³ 水体按 1 mg/L 泼洒需 666.67 g 药；1000 kg 鱼按 20 mg/kg 拌饵日药量 20 g。
          </p>
        </div>

        <!-- 用药三原则 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <ShieldAlert class="w-5 h-5 mr-2 text-amber-500" /> 塘口用药三原则
          </h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">处方优先</span>：品种、剂量、疗程以执业兽医处方与药品说明书为准；禁用药物（如氯霉素、孔雀石绿等）一律不碰。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">先算水再下药</span>：水体估不准，泼洒浓度全错；坡底塘多点测深取平均，面积按水位线实测。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span><span class="text-foreground font-medium">休药期红线</span>：休药期内不得捕捞上市，记录每次用药时间，到期后留出检测缓冲更稳妥。</span>
            </li>
          </ul>
        </div>

        <!-- 使用步骤 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">三步用完</h2>
          <ul class="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>选形状填尺寸与平均水深，得到面积（m²/亩）与水体 m³。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>泼洒用药填浓度，拌饵投喂填鱼重与剂量，两种方式各自出量。</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>填休药期与停药日期，复制提醒贴到塘口记录本上。</span>
            </li>
          </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>水产用药计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          水产用药计算器面向塘口与小养殖场，把「用多少药」拆成三步算术：先按塘口形状估面积与水体，
          再按全池泼洒浓度（mg/L = g/m³）或拌饵投喂剂量（mg/kg 鱼体重）算出总药量，
          最后按休药期天数与停药日期生成「该日期后才能捕捞上市」的提醒。全部换算在浏览器本地完成。
          渔药使用受法规与兽医规范约束，本工具仅做算术换算，用药决策以药品说明书与执业兽医处方为准。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">水体体积怎么算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          三种常见塘口形状的面积公式（水深一律取平均）：
        </p>
        <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground leading-relaxed">
          <li><span class="text-foreground font-medium">矩形</span>：面积 = 长 × 宽；</li>
          <li><span class="text-foreground font-medium">圆形</span>：面积 = π/4 × 直径²；</li>
          <li><span class="text-foreground font-medium">梯形断面</span>：垂直于池长方向切一刀，面积 = (水面宽 + 池底宽)/2 × 池长。</li>
        </ul>
        <p class="text-sm text-muted-foreground leading-relaxed mt-2">
          水体（m³）= 面积（m²）× 平均水深（m）。1 亩 = 666.67 m²，所以「1 亩塘、平均水深 1 米」就是 666.67 m³ 水。
          平均水深建议沿塘边浅处、中间深处、进出水口各测几点取平均；坡度大的塘最容易出现「按最深点算多用一倍药」的错误。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">ppm 用药量原理：为什么 mg/L 直接等于 g/m³</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          1 L 淡水约重 1 kg，1 mg 药溶进 1 L 水的浓度就是 1 mg/L，即百万分之一（1 ppm，质量比近似）。
          而 1 m³ = 1000 L、1 g = 1000 mg，所以 1 mg/L = 1 mg/1 kg 水 = 1 g/m³——三套单位数值完全通用。
          于是全池泼洒的总药量就是一道乘法：总药量（g）= 水体（m³）× 泼洒浓度（mg/L 或 g/m³）。
          例如 666.67 m³ 水体按 1 mg/L 泼洒，需药 666.67 g；按生石灰清塘宽档 20~30 g/m³，则需 13.3~20 kg 量级。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">休药期是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          休药期（停药期）指食品动物从停止给药到允许屠宰/捕捞上市的最短间隔天数。渔药在鱼体内代谢排出需要时间，
          休药期就是为了把残留降到安全标准以下；不同药物、不同水温下休药期差异很大，以药品说明书与处方为准。
          休药期内捕捞上市属违规行为，抽检残留超标将面临产品无害化处理与处罚。合规做法是：
          记录每次用药日期 → 停药日起算休药期天数 → 到期后才能捕捞上市，并在上市前留出检测缓冲。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">1 亩塘平均水深 1 米有多少水？</h3>
            <p class="text-sm text-muted-foreground mt-1">1 亩 = 666.67 m²，乘 1 m 水深 = 666.67 m³。若按 1 mg/L（1 g/m³）全池泼洒，总药量 = 666.67 g；按生石灰清塘 20-30 g/m³ 宽档则是 13.3~20 kg 量级（以说明书与处方为准）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">说明书上写 ppm 怎么换算？</h3>
            <p class="text-sm text-muted-foreground mt-1">淡水条件下 1 ppm ≈ 1 mg/L ≈ 1 g/m³，数值通用。水体 m³ × ppm 数值 ≈ 总药量克数，例如 1000 m³ × 0.5 ppm ≈ 500 g。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">拌饵投喂的药量怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1">日药量（g）= 存塘鱼总重（kg）× 按体重剂量（mg/kg）÷ 1000。例如 1000 kg 鱼按 20 mg/kg，日药量 20 g；按投饵率 2% 当日投饵 20 kg 饲料，即每 kg 饲料拌 1 g 药。鱼存塘重量建议按投放记录与抽样生长估算核对。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">休药期从哪天起算？</h3>
            <p class="text-sm text-muted-foreground mt-1">从最后一次给药（停药）之日起算，满说明书规定的天数后方可捕捞上市。本工具按停药日期 + 休药期天数给出最早可捕捞日期，在浏览器本地用时区安全的日期推算，跨月跨年均准确。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pond-medication-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Fish, Info, AlertTriangle, ChevronUp, ChevronDown,
  Copy, CheckCircle, Droplets, FlaskConical, Utensils,
  CalendarClock, ShieldAlert
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ==== PURE-FNS-START ====
// 口径：1 亩 = 666.67 m²；1 mg/L = 1 g/m³（淡水 1 ppm ≈ 1 mg/L）；
// 全池泼洒总药量(g) = 水体 m³ × 浓度 g/m³；拌饵日药量(g) = 鱼重 kg × 剂量 mg/kg ÷ 1000。
// 锚点：1亩×1m=666.67m³；666.67m³×1mg/L=666.67g；鱼 1000kg×20mg/kg=20g；投饵率 2% → 日投饵 20kg。
const MU_M2 = 666.67

function fmtNum(x, digits = 2) {
  if (x === null || x === undefined || !Number.isFinite(x)) return '—'
  const p = Math.pow(10, digits)
  return String(Math.round(x * p) / p)
}
function fmt2(x) { return fmtNum(x, 2) }
function fmt3(x) { return fmtNum(x, 3) }

// 塘口面积：rect 长×宽 / circle 直径 / trap 梯形断面两底×长（m²）
function pondAreaM2(shape, d) {
  if (shape === 'rect') {
    if (!(Number.isFinite(d.length) && d.length > 0) || !(Number.isFinite(d.width) && d.width > 0)) return null
    return d.length * d.width
  }
  if (shape === 'circle') {
    if (!(Number.isFinite(d.diameter) && d.diameter > 0)) return null
    return (Math.PI / 4) * d.diameter * d.diameter
  }
  if (shape === 'trap') {
    if (!(Number.isFinite(d.topWidth) && d.topWidth > 0) || !(Number.isFinite(d.bottomWidth) && d.bottomWidth > 0) || !(Number.isFinite(d.length) && d.length > 0)) return null
    return ((d.topWidth + d.bottomWidth) / 2) * d.length
  }
  return null
}

// m² → 亩
function areaToMu(areaM2) {
  return areaM2 === null || !Number.isFinite(areaM2) ? null : areaM2 / MU_M2
}

// 水体 = 面积 × 平均水深（m³）
function waterVolumeM3(areaM2, depthM) {
  if (areaM2 === null || !Number.isFinite(areaM2)) return null
  if (!(Number.isFinite(depthM) && depthM > 0)) return null
  return areaM2 * depthM
}

// 方式A：总药量(g) = 水体 m³ × 浓度 g/m³（mg/L 数值同 g/m³）
function splashDoseG(volumeM3, concMgL) {
  if (volumeM3 === null || !Number.isFinite(volumeM3)) return null
  if (!(Number.isFinite(concMgL) && concMgL > 0)) return null
  return volumeM3 * concMgL
}

// 方式B：日药量 g、日投饵量 kg、每 kg 饲料拌药 g
function feedDose(fishKg, doseMgPerKg, feedRatePct) {
  if (!(Number.isFinite(fishKg) && fishKg > 0)) return null
  if (!(Number.isFinite(doseMgPerKg) && doseMgPerKg > 0)) return null
  if (!(Number.isFinite(feedRatePct) && feedRatePct > 0)) return null
  const drugG = (fishKg * doseMgPerKg) / 1000
  const feedKg = (fishKg * feedRatePct) / 100
  return { drugG, feedKg, drugPerKgFeedG: drugG / feedKg }
}

// 本地时区日期推算（YYYY-MM-DD 字符串拼接，禁止 toISOString 防东八区偏一天）
function addDaysLocal(dateStr, days) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr === undefined || dateStr === null ? '' : dateStr).trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (!(Number.isFinite(days) && days >= 0)) return null
  const dt = new Date(y, mo - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  dt.setDate(dt.getDate() + Math.round(days))
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

// 休药期提醒文本
function withdrawalNotice(dateStr, days) {
  const end = addDaysLocal(dateStr, days)
  if (!end) return null
  return `休药期提醒：最后一次用药/停药日期为 ${dateStr}，休药期 ${days} 天，最早可捕捞上市日期为 ${end}——该日期后才能捕捞上市。`
}

// 形状选项与泼洒宽档预设（显著标注仅供参考）
const SHAPES = [
  { key: 'rect', label: '矩形（长×宽）' },
  { key: 'circle', label: '圆形（直径）' },
  { key: 'trap', label: '梯形断面（两底×长）' }
]
const SPLASH_PRESETS = [
  { label: '生石灰清塘', range: '20-30 g/m³', value: 25 },
  { label: '二氧化氯消毒', range: '0.1-0.3 g/m³', value: 0.2 }
]

// 用药方案文本（复制导出用）
function buildSchemeReport(volumeM3, concMgL, splashG, fishKg, doseMgPerKg, feedRatePct, feed, wdDateStr, wdDaysN, wdNoticeText) {
  const lines = ['塘口用药方案（有条工具 · 本地计算，仅供参考）']
  if (volumeM3 !== null && volumeM3 !== undefined) {
    lines.push(`水体：${fmtNum(volumeM3, 2)} m³`)
  }
  if (splashG !== null && splashG !== undefined) {
    lines.push(`全池泼洒：浓度 ${fmtNum(concMgL, 2)} mg/L（g/m³）→ 总药量 ${fmtNum(splashG, 2)} g（≈ ${fmtNum(splashG / 1000, 3)} kg）`)
  }
  if (feed !== null && feed !== undefined) {
    lines.push(`拌饵投喂：存塘鱼 ${fmtNum(fishKg, 2)} kg × ${fmtNum(doseMgPerKg, 2)} mg/kg → 日药量 ${fmtNum(feed.drugG, 2)} g；投饵率 ${fmtNum(feedRatePct, 2)}% → 日投饵 ${fmtNum(feed.feedKg, 2)} kg（每 kg 饲料拌药 ${fmtNum(feed.drugPerKgFeedG, 2)} g）`)
  }
  if (wdNoticeText) {
    lines.push(wdNoticeText)
  }
  lines.push('以药品说明书与执业兽医处方为准；休药期内不得捕捞上市。')
  return lines.length > 2 ? lines.join('\n') : null
}
// ==== PURE-FNS-END ====

// ---------- SEO ----------
useSeoMeta({
  title: '水产用药计算器 - 鱼塘水体估算/全池泼洒/拌饵投喂药量与休药期',
  description: '在线水产用药计算器：按矩形/圆形/梯形断面估算塘口面积（m²与亩双显）与水体 m³，全池泼洒按浓度 mg/L=g/m³ 算总药量，拌饵投喂按鱼重×mg/kg 算日药量与拌饵量，休药期天数+停药日期生成上市提醒，纯本地计算。',
  keywords: '水产用药计算,鱼塘用药量,全池泼洒浓度,ppm用药量,水体体积计算,拌饵投喂,休药期,亩换算平方米',
  author: '有条工具',
  ogTitle: '水产用药计算器 - 水体估算/泼洒拌饵药量/休药期提醒 | 有条工具',
  ogDescription: '塘口面积水体估算，全池泼洒与拌饵投喂药量双方式，休药期上市提醒。',
  ogUrl: 'https://www.util.cn/tools/pond-medication-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '水产用药计算器',
  twitterDescription: '鱼塘水体估算到全池泼洒与拌饵药量，休药期提醒，纯本地计算。'
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
          name: '水产用药计算器',
          url: 'https://www.util.cn/tools/pond-medication-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '矩形/圆形/梯形断面塘口面积（m² 与亩双显，1 亩 = 666.67 m²）',
            '水体 m³ = 面积 × 平均水深',
            '全池泼洒：浓度 mg/L = g/m³，总药量 g/kg 双显',
            '拌饵投喂：鱼重 × mg/kg 剂量，日药量与投饵率拌饵量',
            '休药期提醒：停药日期 + 天数 → 最早可捕捞上市日期（本地时区推算）',
            '生石灰/二氧化氯公认宽档预设并显著标注仅供参考',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '水产用药计算器', item: 'https://www.util.cn/tools/pond-medication-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '1 亩塘平均水深 1 米有多少水？',
              acceptedAnswer: { '@type': 'Answer', text: '1 亩 = 666.67 m²，乘 1 m 水深 = 666.67 m³。按 1 mg/L（1 g/m³）全池泼洒需药 666.67 g；按生石灰清塘 20-30 g/m³ 宽档为 13.3-20 kg 量级，以说明书与处方为准。' }
            },
            {
              '@type': 'Question',
              name: '说明书上写 ppm 怎么换算？',
              acceptedAnswer: { '@type': 'Answer', text: '淡水条件下 1 ppm ≈ 1 mg/L ≈ 1 g/m³，数值通用。水体 m³ × ppm 数值 ≈ 总药量克数，例如 1000 m³ × 0.5 ppm ≈ 500 g。' }
            },
            {
              '@type': 'Question',
              name: '拌饵投喂的药量怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '日药量（g）= 存塘鱼总重（kg）× 按体重剂量（mg/kg）÷ 1000。1000 kg 鱼按 20 mg/kg 为 20 g；按投饵率 2% 当日投饵 20 kg 饲料，每 kg 饲料拌 1 g 药。' }
            },
            {
              '@type': 'Question',
              name: '休药期从哪天起算？',
              acceptedAnswer: { '@type': 'Answer', text: '从最后一次给药（停药）之日起算，满说明书规定天数后方可捕捞上市；休药期内捕捞上市属违规行为。' }
            }
          ]
        }
      ]
    })
  }]
})

const TOOL_ID = 'pond-medication-calculator'
// 本地时区今天（YYYY-MM-DD，仅 onMounted 中调用，避免 SSR 时区/水合差异）
function localTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
onMounted(() => {
  addRecentTool(TOOL_ID)
  wdDate.value = localTodayStr()
})

// ---------- 状态 ----------
const shape = ref('rect')
const rectL = ref(50)
const rectW = ref(20)
const circleD = ref(30)
const trapTop = ref(10)
const trapBottom = ref(6)
const trapLen = ref(50)
const depthM = ref(1)
const splashConc = ref(1)
const fishKg = ref(1000)
const doseMgKg = ref(20)
const feedRatePct = ref(2)
const wdDays = ref(28)
const wdDate = ref('')
const copyStatus = ref('idle')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 水体估算 ----------
const dims = computed(() => {
  if (shape.value === 'rect') return { length: rectL.value, width: rectW.value }
  if (shape.value === 'circle') return { diameter: circleD.value }
  return { topWidth: trapTop.value, bottomWidth: trapBottom.value, length: trapLen.value }
})
const areaM2 = computed(() => pondAreaM2(shape.value, dims.value))
const areaMu = computed(() => areaToMu(areaM2.value))
const volumeM3 = computed(() => waterVolumeM3(areaM2.value, depthM.value))

// ---------- 方式A / 方式B ----------
const splashG = computed(() => splashDoseG(volumeM3.value, splashConc.value))
const feedResult = computed(() => feedDose(fishKg.value, doseMgKg.value, feedRatePct.value))

// ---------- 休药期 ----------
const wdNotice = computed(() => withdrawalNotice(wdDate.value, wdDays.value))

// ---------- 复制方案（clipboard + alert） ----------
let copyTimer = null
async function copyScheme() {
  const text = buildSchemeReport(
    volumeM3.value, splashConc.value, splashG.value,
    fishKg.value, doseMgKg.value, feedRatePct.value, feedResult.value,
    wdDate.value, wdDays.value, wdNotice.value
  )
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copyStatus.value = 'ok'
    trackEvent('工具结果', '复制', TOOL_ID)
  } catch (err) {
    copyStatus.value = 'fail'
    alert('复制失败：浏览器未授权剪贴板，请手动记录用药数据。')
  }
  if (copyTimer !== null) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copyStatus.value = 'idle'; copyTimer = null }, 1600)
}
</script>
