<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Zap class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">电镀时间计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">法拉第定律算镀层沉积时间：目标厚度×面积×密度 ÷ (电化当量×电流×效率)，镍/铜/锌/铬/银/金镀层档案</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线电镀时间计算工具：按法拉第电解定律 t = m/(E·η·I)，由目标镀层厚度 δ、受镀面积 A、镀层金属密度 ρ、电化当量 E（g/(A·h)）与电流效率 η
        计算所需通电时间（min/h 双显），并给出沉积速率（μm/min）、镀层质量与有效总电流。内置镀镍、酸性镀铜、镀锌、六价/三价镀铬、镀银、氰化/无氰镀金档案
        （电化当量按 E = M/(z×26.8) 由摩尔质量与价态导出），支持自定义镀层参数与按总电流 / 电流密度两种输入口径。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 量纲推导条 -->
    <div class="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 mb-6 text-sm text-foreground leading-relaxed">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>
        量纲推导（可展开 SEO 区看逐步过程）：δ(μm)/10000 = cm，×A(dm²)×100 = cm²，体积 = δ·A/100 cm³，质量 m = δ·A·ρ/100 (g)；
        电荷量 Q = m/(E·η) (A·h)；时间 t = Q/I = m/(E·η·D·A) = <b>0.6·δ·ρ/(E·η·D) min</b>——面积 A 在分子分母约去，镀速只与厚度、密度、电流密度、效率、电化当量有关。
      </span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <!-- 镀层档案 -->
        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Layers class="w-5 h-5 mr-2 text-primary" /> ① 镀层档案
          </h2>
          <div class="space-y-2">
            <label
              v-for="c in COATINGS"
              :key="c.id"
              class="flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition"
              :class="coatingId === c.id ? 'border-primary bg-primary/10' : 'border-border bg-muted/30 hover:bg-muted/60'"
            >
              <input type="radio" name="coating" :value="c.id" v-model="coatingId" class="mt-1 accent-[var(--primary,#6366f1)]" />
              <span class="text-sm">
                <span class="font-medium text-foreground">{{ c.label }}</span>
                <span class="block text-xs text-muted-foreground">E={{ c.E }} g/(A·h)（{{ c.valence }}）· ρ={{ c.rho }} · 效率常见 {{ c.etaRange }}</span>
              </span>
            </label>
            <label
              class="flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition"
              :class="coatingId === 'custom' ? 'border-primary bg-primary/10' : 'border-border bg-muted/30 hover:bg-muted/60'"
            >
              <input type="radio" name="coating" value="custom" v-model="coatingId" class="mt-1 accent-[var(--primary,#6366f1)]" />
              <span class="text-sm font-medium text-foreground">自定义镀层（填 E 与 ρ）</span>
            </label>
          </div>
          <div v-if="coatingId === 'custom'" class="grid grid-cols-2 gap-2 mt-2">
            <label class="text-sm text-muted-foreground">
              电化当量 E（g/(A·h)）
              <input
                v-model.number="customE"
                type="number" min="0" step="0.001" placeholder="如 1.095"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="text-sm text-muted-foreground">
              密度 ρ（g/cm³）
              <input
                v-model.number="customRho"
                type="number" min="0" step="0.01" placeholder="如 8.9"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <p class="col-span-2 text-xs text-muted-foreground">E = M/(z×26.8)：摩尔质量 M (g/mol) 除以价态 z 与 26.8 (A·h/mol)。</p>
          </div>
          <p class="text-xs text-muted-foreground mt-2">档案按 E = M/(z×26.8) 导出并两源交叉（电化学当量表与 PCB 电镀工程问答口径）；实际镀液以工艺卡实测效率为准。</p>
        </div>

        <hr class="border-border" />

        <!-- 工艺参数 -->
        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Gauge class="w-5 h-5 mr-2 text-primary" /> ② 工艺参数
          </h2>
          <div class="grid grid-cols-2 gap-2">
            <label class="text-sm text-muted-foreground">
              目标厚度 δ（μm）
              <input
                v-model.number="thickUm"
                type="number" min="0" step="0.5" placeholder="如 10"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="text-sm text-muted-foreground">
              受镀面积 A（dm²）
              <input
                v-model.number="areaDm2"
                type="number" min="0" step="0.1" placeholder="如 1"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="text-sm text-muted-foreground">
              电流效率 η（%）
              <input
                v-model.number="etaPct"
                type="number" min="0" max="100" step="0.5" :placeholder="String(etaDefault)"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="text-sm text-muted-foreground">
              {{ currentMode === 'density' ? '电流密度 D（A/dm²）' : '总电流 I（A）' }}
              <input
                v-model.number="currentInput"
                type="number" min="0" step="0.1" :placeholder="String(currentDefault)"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <button
              @click="currentMode = 'density'"
              class="px-2 py-2 rounded-lg text-xs font-medium border transition"
              :class="currentMode === 'density' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted'"
            >按电流密度 D</button>
            <button
              @click="currentMode = 'total'"
              class="px-2 py-2 rounded-lg text-xs font-medium border transition"
              :class="currentMode === 'total' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted'"
            >按总电流 I</button>
          </div>
          <p v-if="currentMode === 'density'" class="text-xs text-muted-foreground mt-2">
            常见区间提示：{{ currentCoating.dHint }}。总电流 I = D×A = {{ fmt2(totalCurrentA) }} A。
          </p>
          <p v-else class="text-xs text-muted-foreground mt-2">
            折算电流密度 D = I÷A = {{ fmt2(densityEff) }} A/dm²{{ currentCoating.dHint ? '（常见 ' + currentCoating.dHint + '）' : '' }}。
          </p>
          <p v-if="effWarn" class="mt-2 text-xs flex items-start gap-1.5 p-2 rounded bg-amber-500/10 text-foreground">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>{{ effWarn }}</span>
          </p>
        </div>
      </div>

      <!-- 右侧：结果区 -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <CheckCircle v-if="res" class="w-5 h-5 mr-2 text-green-500" />
            <TriangleAlert v-else class="w-5 h-5 mr-2 text-amber-500" />
            通电时间与沉积速率
          </h2>

          <div v-if="res" class="bg-primary/10 rounded-lg p-5 text-center mb-4">
            <p class="text-xs text-muted-foreground mb-1">{{ coatingLabel }} · δ={{ fmt1(thickUmEff) }}μm · A={{ fmt1(areaEff) }}dm² · η={{ fmt1(etaEff) }}% · {{ currentMode === 'density' ? 'D=' + fmt1(densityEff) + ' A/dm²' : 'I=' + fmt1(totalCurrentA) + ' A' }}</p>
            <p class="text-5xl font-bold text-primary tabular-nums">
              {{ fmt1(res.min) }}<span class="text-lg font-semibold ml-1">min</span>
            </p>
            <p class="text-sm text-muted-foreground mt-2 tabular-nums">= {{ fmt2(res.hours) }} h（小时）· 沉积速率 {{ fmt2(res.rate) }} μm/min</p>
          </div>
          <p v-else class="text-sm text-muted-foreground p-3 bg-muted/50 rounded-xl mb-4">
            填入目标厚度、面积、效率与电流（密度或总电流任一口径），所有参数需大于 0。
          </p>

          <div v-if="res" class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mb-4">
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-[10px] text-muted-foreground mb-1">镀层质量 m</p>
              <p class="text-sm font-bold text-foreground tabular-nums">{{ fmt2(res.massG) }} g</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">δ·A·ρ/100</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-[10px] text-muted-foreground mb-1">有效电流 I·η</p>
              <p class="text-sm font-bold text-foreground tabular-nums">{{ fmt2(res.effCurrentA) }} A</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">析氢等副反应吃掉 {{ fmt1(100 - etaEff) }}%</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-[10px] text-muted-foreground mb-1">所需电荷 Q</p>
              <p class="text-sm font-bold text-foreground tabular-nums">{{ fmt3(res.chargeAh) }} A·h</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">m/(E·η)</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-[10px] text-muted-foreground mb-1">30 min 可镀厚</p>
              <p class="text-sm font-bold text-primary tabular-nums">{{ fmt1(res.thick30) }} μm</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">同参数镀 30 分钟</p>
            </div>
          </div>

          <div v-if="res" class="bg-muted/50 rounded-xl p-4">
            <p class="text-[10px] text-muted-foreground mb-1">算式代入</p>
            <p class="text-sm font-mono text-foreground leading-relaxed break-all">
              t(min) = 0.6×δ×ρ/(E×η×D) = 0.6×{{ fmt1(thickUmEff) }}×{{ num(rhoEff) }}/( {{ num(eEff) }}×{{ fmt3(etaEff / 100) }}×{{ fmt1(densityEff) }} ) = {{ fmt1(res.min) }} min
            </p>
          </div>

          <p class="text-xs text-muted-foreground mt-3 flex items-start gap-1.5 p-2.5 rounded bg-amber-500/10">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>η 为阴极电流效率，随电流密度、镀液温度与成分漂移：镀铬对电流最敏感（六价铬约 13–18%），偏离常用区间时先校η再算时间。实际生产以霍尔槽试验与镀层测厚仪实测为准。</span>
          </p>
        </div>

        <!-- 镀层档案速查 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Layers class="w-5 h-5 mr-2 text-primary" /> 常用镀层档案速查
          </h2>
          <div class="overflow-x-auto rounded-lg border border-border">
            <table class="w-full text-sm">
              <thead class="bg-muted/60 text-muted-foreground text-xs">
                <tr>
                  <th class="px-3 py-2 text-left font-medium">镀层</th>
                  <th class="px-3 py-2 text-center font-medium">价态</th>
                  <th class="px-3 py-2 text-right font-medium">E g/(A·h)</th>
                  <th class="px-3 py-2 text-right font-medium">ρ g/cm³</th>
                  <th class="px-3 py-2 text-right font-medium">10μm@2A/dm²·η95% 分钟</th>
                  <th class="px-3 py-2 text-left font-medium">电流密度常见区间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in archiveRows" :key="c.id" class="border-t border-border tabular-nums">
                  <td class="px-3 py-2 font-medium text-foreground">{{ c.label }}</td>
                  <td class="px-3 py-2 text-center text-muted-foreground">{{ c.valence }}</td>
                  <td class="px-3 py-2 text-right text-foreground">{{ c.E }}</td>
                  <td class="px-3 py-2 text-right text-foreground">{{ c.rho }}</td>
                  <td class="px-3 py-2 text-right font-semibold text-primary">{{ fmt1(refMinutes(c)) }}</td>
                  <td class="px-3 py-2 text-left text-xs text-muted-foreground">{{ c.dHint }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground mt-2">
            参考列统一按 δ=10μm、D=2A/dm²、η=95% 计（镀铬/三价铬按其典型效率另注）；E = M/(z×26.8) 导出，金按氰化（一价）与无氰/酸性（三价）两口径给出，以镀液体系为准。
          </p>
        </div>
      </div>
    </div>

    <!-- 可折叠 SEO 内容区 -->
    <details open class="bg-card border border-border rounded-lg mb-8">
      <summary class="px-6 py-4 cursor-pointer select-none text-xl font-bold text-foreground flex items-center justify-between">
        <span><span class="text-primary mr-2">#</span>法拉第定律推导、量纲验证与常见问题</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground" />
      </summary>
      <div class="px-6 pb-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h3 class="text-lg font-semibold text-foreground">公式怎么来的：逐步推导与量纲验证</h3>
        <p>
          法拉第电解第一定律：电极上析出物质的质量 m = E×Q×η，其中 E 是电化当量（g/(A·h)）、Q 是通过的电量（A·h）、η 是阴极电流效率（析氢等副反应会分走一部分电流）。
          镀层是一层均匀贴在受镀面上的金属，所以：
        </p>
        <ol class="list-decimal pl-5 space-y-1.5">
          <li><b class="text-foreground">体积</b>：厚度 δ 用 μm 计、面积 A 用 dm² 计。1 cm = 10⁴ μm，1 dm² = 100 cm²，所以 V = (δ/10000) cm × (A×100) cm² = <b>δ·A/100 cm³</b>。</li>
          <li><b class="text-foreground">质量</b>：m = V×ρ = <b>δ·A·ρ/100 (g)</b>。验算：10μm 厚、1dm²（=100cm²）的镀层，体积 = 0.001cm×100cm² = 0.1cm³，代式 10×1×8.9/100 = 0.89 g，两种路径一致。</li>
          <li><b class="text-foreground">电量</b>：Q = m/(E×η) (A·h)。E 的单位 g/(A·h) 恰好把克换算回安时——1/(E) 就是「每克金属需要的 A·h」。</li>
          <li><b class="text-foreground">时间</b>：t = Q ÷ I，I = D×A（电流密度 D 乘面积）。t = δ·A·ρ/100 ÷ (E·η·D·A) = <b>δ·ρ/(100·E·η·D) (h) = 0.6·δ·ρ/(E·η·D) (min)</b>。</li>
        </ol>
        <p>
          量纲验证：[μm]×[g/cm³]/([g/(A·h)]×[A/dm²]) —— 分子是 μm·g/cm³，分母是 g/(A·h·dm²/A)… 按第 4 步的约分路径看更清楚：t 的分子 δ·A·ρ/100 是克，分母 E·η·D·A 是 (g/(A·h))·(A)（其中 D·A=A），克 ÷ (克/安时 × 安) = 安时/安 = 小时 ✓。注意面积 A 在第 4 步分子分母同时出现并<b class="text-foreground">完全约去</b>——镀层长厚的速率与工件大小无关，工件大小只影响需要的总电流（I = D×A），不影响「镀多久」。本工具同时支持按电流密度或按整流器总电流两种输入，两者等价。
        </p>
        <p class="bg-muted/50 rounded-lg p-3 font-mono text-xs leading-relaxed text-foreground">
          例（镀镍）：δ=10μm，D=2A/dm²，η=95%，E=1.095，ρ=8.90<br />
          m = 10×1×8.9/100 = 0.89 g；Q = 0.89/(1.095×0.95) = 0.8565 A·h；I = 2×1 = 2A<br />
          t = 0.8565/2 = 0.4283 h ≈ <b class="text-primary">25.7 min</b>（即 0.6×10×8.9/(1.095×0.95×2)）
        </p>

        <h3 class="text-lg font-semibold text-foreground">电化当量 E 是什么？</h3>
        <p>
          E = M/(z×F)，换成电镀常用单位就是 M/(z×26.8) g/(A·h)——M 是摩尔质量，z 是沉积反应的价态，F 是法拉第常数（96485 C/mol = 26.8 A·h/mol）。镍 M=58.69、Ni²⁺ 两价：58.69/(2×26.8) = 1.095 g/(A·h)；铜酸性镀液是 Cu²⁺ → 1.186，氰化镀液是 Cu¹⁺ → 2.372；铬六价镀液（铬酸 CrO₃）Cr⁶⁺ → 0.324，三价铬镀液 Cr³⁺ → 0.647；金氰化镀液 Au¹⁺ → 7.35，无氰/酸性体系 Au³⁺ → 2.45。同一个金属不同价态的镀液 E 差好几倍，查档案务必先确认价态口径。
        </p>

        <h3 class="text-lg font-semibold text-foreground">电流密度与镀层质量的关系</h3>
        <p>
          由 t = 0.6·δ·ρ/(E·η·D)：时间与电流密度成反比，D 翻倍时间减半；沉积速率 ∝ D×η。但 D 不能无脑加大——超过镀液允许的上限会出现烧焦（枝晶、粗糙、边缘结瘤），氢脆风险也随析氢加剧；D 太低则沉积太慢且覆盖能力差。常见工艺窗口：瓦特镍 1–5 A/dm²、酸性光亮铜 1–5、碱性镀锌 0.5–4、装饰铬 10–20、硬铬 30–60、镀银 0.3–2、镀金 0.2–2。带材连续电镀走的是另一套高速体系（D 可达数十 A/dm²），口径不同。
        </p>

        <h3 class="text-lg font-semibold text-foreground">为什么镀铬的电流效率特别低？</h3>
        <p>
          六价铬（铬酸酐 CrO₃ 镀液）阴极过程极其复杂：Cr⁶⁺ → Cr³⁺ → Cr²⁺ 一连串中间价态，真正沉积成金属铬的只有约 13–18% 的电流，其余大量消耗在析氢副反应上（镀铬阴极一半以上电流在冒氢气），再加上必须的铅锡阳极与强酸性雾抑体系，能耗高、沉积慢。这也解释了镀铬工艺的三个特征：要用大电流密度（10–60 A/dm²）硬「压」出沉积；镀液温控关键（温度与 D 匹配才能光亮）；深凹处镀不上——低电流密度区析氢占主导，铬根本沉不出来（深镀能力差）。三价铬镀液效率与覆盖能力更好、毒性仅为六价的约 1%，是现行环保替代方向，但镀层性能与槽液维护口径不同，E 与 η 都要按三价体系取值。
        </p>

        <h3 class="text-lg font-semibold text-foreground">常见问题 (FAQ)</h3>
        <ul class="list-disc pl-5 space-y-2">
          <li><b class="text-foreground">镀 10μm 镍要多久？</b>按 D=2A/dm²、η=95%：约 25.7 分钟。D 提到 4 A/dm² 约 12.2 分钟（η 漂移时按实际效率修正）。</li>
          <li><b class="text-foreground">镀铬 1μm 要多久？</b>按 D=20A/dm²、η=15%：t = 0.6×1×7.19/(0.324×0.15×20) ≈ 4.4 分钟——大电流密度补回了低效率。</li>
          <li><b class="text-foreground">为什么我按公式镀出来偏薄？</b>几乎都是 η 取高了：实际镀液温度、浓度、杂质与电流密度都会拉低效率；挂具接触电阻与远阴极位置也会造成厚度不均。用测厚仪反推实际 η 再修正。</li>
          <li><b class="text-foreground">合金镀层怎么算？</b>按各组分质量分数加权：m = Σ(wᵢ×δ·A·ρᵢ/100)，E 用合金平均电化当量或分组分估算，本工具的自定义口径可近似处理。</li>
          <li><b class="text-foreground">数据会上传吗？</b>不会。全部计算在浏览器本地完成，刷新即清空。</li>
        </ul>

        <p class="text-xs pt-3 border-t border-border/50">
          来源与口径注记：电化当量两源交叉自《电化学当量》通用表（Cu²⁺ 0.0003292 g/C 即 1.186 g/(A·h)、1F=26.8A·h 口径）与 PCB 电镀工程问答实测例（Ni 1.095、ρ8.8 口径，本页取标准密度 8.90）；镀铬效率 13–18% 与析氢机理自镀铬工艺文献与三价铬电沉积研究；金按价态两口径自镀金专利文献（Au³⁺ 2.452 / Au⁺ 约 7.35–7.40）。以现行镀液工艺卡与实测电流效率为准，本页为理论估算。
        </p>
      </div>
    </details>

    <RelatedTools :currentToolId="'electroplating-time-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Zap, Info, CheckCircle, TriangleAlert, Layers, Gauge, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '电镀时间计算器 - 法拉第定律镀层厚度/沉积时间在线计算',
  description: '免费在线电镀时间计算：法拉第定律 t=0.6·δ·ρ/(E·η·D)，镀镍/酸性镀铜/镀锌/六价三价镀铬/镀银/镀金电化当量档案（E=M/(z×26.8)），支持按电流密度或总电流输入，输出 min/h 双显、沉积速率与镀层质量，附量纲推导，纯浏览器本地运行。',
  keywords: '电镀时间计算,法拉第定律电镀,镀层厚度计算,电化当量,电流密度,镀镍时间,镀铬效率,沉积速率',
  author: '有条工具',
  ogTitle: '电镀时间计算器 - 法拉第定律镀层厚度/沉积时间 | 有条工具',
  ogDescription: '按法拉第定律算通电时间与沉积速率，镍/铜/锌/铬/银/金电化当量档案，附量纲推导。',
  ogUrl: 'https://www.util.cn/tools/electroplating-time-calculator',
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
          name: '电镀时间计算器',
          url: 'https://www.util.cn/tools/electroplating-time-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['法拉第定律通电时间计算（min/h 双显）', '镍/铜/锌/铬/银/金电化当量档案与自定义', '按电流密度或总电流两种输入', '沉积速率 μm/min 与镀层质量', '电流效率异常提示与常用电流密度区间', '量纲推导与算式代入展示', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '电镀时间计算器', item: 'https://www.util.cn/tools/electroplating-time-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '镀 10μm 镍要多久？',
              acceptedAnswer: { '@type': 'Answer', text: '按电流密度 2A/dm²、电流效率 95%、E=1.095 g/(A·h)、ρ=8.90：t=0.6×10×8.9/(1.095×0.95×2)≈25.7 分钟；电流密度提到 4A/dm² 约减半到 12.2 分钟。' }
            },
            {
              '@type': 'Question',
              name: '镀铬的电流效率为什么只有 13–18%？',
              acceptedAnswer: { '@type': 'Answer', text: '六价铬镀液阴极过程复杂，大量电流消耗在析氢副反应上，真正沉积成金属铬的只有约 13–18%；所以镀铬要用 10–60A/dm² 的大电流密度，且深凹低电流区镀不上。' }
            },
            {
              '@type': 'Question',
              name: '镀层时间公式里面积去哪了？',
              acceptedAnswer: { '@type': 'Answer', text: '质量 m=δ·A·ρ/100 随面积增大，但总电流 I=D×A 也随面积增大，两者相除面积完全约去：t=0.6·δ·ρ/(E·η·D)。面积只影响需要的总电流，不影响镀多久。' }
            },
            {
              '@type': 'Question',
              name: '电化当量 E 怎么取？',
              acceptedAnswer: { '@type': 'Answer', text: 'E=M/(z×26.8) g/(A·h)，M 为摩尔质量、z 为沉积价态。注意同一金属不同价态镀液 E 差数倍：铜酸性(Cu²⁺)1.186、氰化(Cu¹⁺)2.372；金氰化(Au¹⁺)7.35、无氰/酸性(Au³⁺)2.45。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 数值解析：空/非法/非正数记 0
function num(v) {
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}
function fmt1(v) { return Number.isFinite(v) ? v.toFixed(1) : '—' }
function fmt2(v) { return Number.isFinite(v) ? v.toFixed(2) : '—' }
function fmt3(v) { return Number.isFinite(v) ? v.toFixed(3) : '—' }

// 镀层档案：E=M/(z×26.8) 导出（g/(A·h)），rho 为镀层金属密度 g/cm³
const COATINGS = [
  { id: 'nickel', label: '镀镍（瓦特浴）', E: 1.095, rho: 8.90, valence: 'Ni²⁺ 两价', etaDefault: 95, etaRange: '90–98%', dHint: '1–5 A/dm²' },
  { id: 'copper', label: '酸性镀铜（硫酸盐）', E: 1.186, rho: 8.96, valence: 'Cu²⁺ 两价', etaDefault: 98, etaRange: '95–99%', dHint: '1–5 A/dm²' },
  { id: 'zinc', label: '镀锌（碱性/氯化物）', E: 1.220, rho: 7.14, valence: 'Zn²⁺ 两价', etaDefault: 90, etaRange: '85–95%', dHint: '0.5–4 A/dm²' },
  { id: 'chrome6', label: '镀铬（六价铬酸）', E: 0.324, rho: 7.19, valence: 'Cr⁶⁺ 六价', etaDefault: 15, etaRange: '13–18%', dHint: '装饰 10–20 / 硬铬 30–60 A/dm²' },
  { id: 'chrome3', label: '镀铬（三价铬，环保）', E: 0.647, rho: 7.19, valence: 'Cr³⁺ 三价', etaDefault: 30, etaRange: '约 20–40%', dHint: '5–20 A/dm²' },
  { id: 'silver', label: '镀银（氰化物）', E: 4.025, rho: 10.49, valence: 'Ag⁺ 一价', etaDefault: 99, etaRange: '95–100%', dHint: '0.3–2 A/dm²' },
  { id: 'gold1', label: '镀金（氰化物）', E: 7.35, rho: 19.32, valence: 'Au⁺ 一价', etaDefault: 80, etaRange: '60–95%', dHint: '0.2–2 A/dm²' },
  { id: 'gold3', label: '镀金（无氰/酸性）', E: 2.45, rho: 19.32, valence: 'Au³⁺ 三价', etaDefault: 40, etaRange: '约 30–60%', dHint: '0.2–1 A/dm²' }
]

// 镀层质量（g）：m = δ(μm)×A(dm²)×ρ/100 —— 量纲：μm/10000→cm，dm²×100→cm²，δ·A/100 = cm³
function depositMassG(thickUm, areaDm2, rho) {
  const d = num(thickUm), a = num(areaDm2), r = num(rho)
  if (!d || !a || !r) return null
  return (d * a * r) / 100
}

// 通电时间（min）：t = m/(E·η·I)×60，I = D×A → 化简为 t = 0.6·δ·ρ/(E·η·D)，面积约去
function platingMinutes(thickUm, rho, equivE, etaFrac, currentDensity) {
  const d = num(thickUm), r = num(rho), e = num(equivE), eta = num(etaFrac), cd = num(currentDensity)
  if (!d || !r || !e || !eta || eta > 1 || !cd) return null
  return (0.6 * d * r) / (e * eta * cd)
}

// 按总电流口径：t(h) = m/(E·η·I_total)；与密度口径等价（I = D×A）
function platingHoursByTotalCurrent(thickUm, areaDm2, rho, equivE, etaFrac, totalCurrentA) {
  const m = depositMassG(thickUm, areaDm2, rho)
  const e = num(equivE), eta = num(etaFrac), i = num(totalCurrentA)
  if (!m || !e || !eta || eta > 1 || !i) return null
  return m / (e * eta * i)
}

// 沉积速率（μm/min）= δ/t = E·η·D/(0.6·ρ)
function rateUmPerMin(equivE, etaFrac, currentDensity, rho) {
  const e = num(equivE), eta = num(etaFrac), cd = num(currentDensity), r = num(rho)
  if (!e || !eta || !cd || !r) return null
  return (e * eta * cd) / (0.6 * r)
}

// 已知时间反算可镀厚度（μm）：δ = t(min)×E·η·D/(0.6·ρ)
function thicknessFromMinutes(min, equivE, etaFrac, currentDensity, rho) {
  const t = num(min), e = num(equivE), eta = num(etaFrac), cd = num(currentDensity), r = num(rho)
  if (!t || !e || !eta || !cd || !r) return null
  return (t * e * eta * cd) / (0.6 * r)
}

// ---------- 页面状态 ----------
const coatingId = ref('nickel')
const customE = ref(1.095)
const customRho = ref(8.9)
const thickUm = ref(10)
const areaDm2 = ref(1)
const etaOverride = ref('')
const currentMode = ref('density') // density A/dm² | total A
const densityInput = ref(2)
const totalInput = ref(2)

// ---------- 派生计算 ----------
const currentCoating = computed(() => COATINGS.find((c) => c.id === coatingId.value) || COATINGS[0])
const eEff = computed(() => (coatingId.value === 'custom' ? num(customE.value) : currentCoating.value.E))
const rhoEff = computed(() => (coatingId.value === 'custom' ? num(customRho.value) : currentCoating.value.rho))
const etaDefault = computed(() => currentCoating.value.etaDefault)
const etaEff = computed(() => {
  const v = parseFloat(etaOverride.value)
  return Number.isFinite(v) && v > 0 && v <= 100 ? v : etaDefault.value
})
const currentDefault = computed(() => (currentMode.value === 'density' ? 2 : 2))
const currentInput = computed({
  get: () => (currentMode.value === 'density' ? densityInput.value : totalInput.value),
  set: (v) => {
    if (currentMode.value === 'density') densityInput.value = v
    else totalInput.value = v
  }
})
const areaEff = computed(() => num(areaDm2.value))
const thickUmEff = computed(() => num(thickUm.value))
const densityEff = computed(() => {
  if (currentMode.value === 'density') return num(densityInput.value)
  const a = areaEff.value, i = num(totalInput.value)
  if (!a || !i) return 0
  return i / a
})
const totalCurrentA = computed(() => {
  if (currentMode.value === 'total') return num(totalInput.value)
  const a = areaEff.value, d = num(densityInput.value)
  if (!a || !d) return 0
  return d * a
})
const coatingLabel = computed(() => (coatingId.value === 'custom' ? '自定义镀层' : currentCoating.value.label))

const effWarn = computed(() => {
  const c = currentCoating.value
  if (coatingId.value === 'custom' || !c) return ''
  const eta = etaEff.value
  const range = c.etaRange.match(/(\d+(?:\.\d+)?)/g)
  const lo = range ? parseFloat(range[0]) : null
  const hi = range && range.length > 1 ? parseFloat(range[range.length - 1]) : lo
  if (lo !== null && hi !== null && (eta < lo || eta > hi)) {
    return `当前效率 ${fmt1(eta)}% 超出 ${c.label} 常见带（${c.etaRange}），请复核镀液工况或按实测修正。`
  }
  return ''
})

const res = computed(() => {
  const min = platingMinutes(thickUmEff.value, rhoEff.value, eEff.value, etaEff.value / 100, densityEff.value)
  if (min === null || !Number.isFinite(min)) return null
  const mass = depositMassG(thickUmEff.value, areaEff.value, rhoEff.value)
  const charge = mass && eEff.value && etaEff.value ? mass / (eEff.value * (etaEff.value / 100)) : null
  const rate = rateUmPerMin(eEff.value, etaEff.value / 100, densityEff.value, rhoEff.value)
  const t30 = thicknessFromMinutes(30, eEff.value, etaEff.value / 100, densityEff.value, rhoEff.value)
  const hours = platingHoursByTotalCurrent(thickUmEff.value, areaEff.value, rhoEff.value, eEff.value, etaEff.value / 100, totalCurrentA.value)
  return {
    min,
    hours: min / 60,
    hoursByTotal: hours,
    massG: mass,
    chargeAh: charge,
    effCurrentA: totalCurrentA.value * (etaEff.value / 100),
    rate,
    thick30: t30
  }
})

// 速查表参考列：统一 δ=10μm、D=2A/dm²、η=95%
function refMinutes(c) {
  return platingMinutes(10, c.rho, c.E, 0.95, 2)
}
const archiveRows = computed(() => COATINGS.map((c) => ({ ...c, ref: refMinutes(c) })))

onMounted(() => {
  addRecentTool('electroplating-time-calculator')
})
</script>
