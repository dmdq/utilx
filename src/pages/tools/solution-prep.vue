<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FlaskConical class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">溶液配制计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">质量分数 / 摩尔浓度 / C1V1=C2V2 稀释 / 混合终浓度，四类配制场景一站算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线溶液配制计算工具：① 质量分数——目标 wt% × 总质量 → 溶质与溶剂（水，按密度 1g/mL 折毫升）各取多少；
        ② 摩尔浓度——目标 mol/L × 体积 L × 摩尔质量 → 溶质克数，内置 NaOH 40 / NaCl 58.44 / 葡萄糖 180.16 常用摩尔质量预设；
        ③ 稀释 C1V1=C2V2——四参数知三求一，给出取样体积与定容提示；④ 混合终浓度——两种浓度混合按 c=(c1V1+c2V2)/(V1+V2) 估算（体积可加和口径）。
        附「酸入水、放热体系冷却定容」安全注记。全部计算在浏览器本地完成，不上传任何数据，实验室、家庭园艺与清洁配液通用。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 mb-6 text-sm text-foreground leading-relaxed">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>质量分数按「质量」，摩尔浓度按「体积」，两者换算需要密度，别混用；C1V1=C2V2 的本质是稀释前后溶质守恒，等号两边浓度单位一致、体积单位一致即可。
      稀释强酸务必「酸入水」；NaOH 等放热体系要冷却至室温后再定容，否则浓度偏高。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算区（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <!-- 模式切换 -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              v-for="m in MODES"
              :key="m.k"
              @click="mode = m.k"
              :class="mode === m.k ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2.5 rounded-lg text-sm font-medium transition-all"
            >{{ m.label }}</button>
          </div>

          <!-- 模式①：质量分数 -->
          <template v-if="mode === 'wt'">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="wt-pct" class="block text-sm font-medium text-foreground mb-1.5">目标质量分数 wt%（%）</label>
                <input
                  id="wt-pct"
                  v-model.number="wtPct"
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 10"
                >
              </div>
              <div>
                <label for="wt-total" class="block text-sm font-medium text-foreground mb-1.5">溶液总质量（g）</label>
                <input
                  id="wt-total"
                  v-model.number="wtTotal"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 500"
                >
              </div>
            </div>
            <div v-if="wtResult" class="space-y-3">
              <div class="bg-primary/10 rounded-lg p-5 text-center">
                <p class="text-xs text-muted-foreground mb-1">称取溶质</p>
                <p class="text-4xl font-bold text-primary">{{ fmt(wtResult.solute, 2) }}<span class="text-base font-semibold ml-1">g</span></p>
                <p class="text-sm text-muted-foreground mt-2">溶剂（水）取 {{ fmt(wtResult.solvent, 2) }} g ≈ {{ fmt(wtResult.waterMl, 1) }} mL（水密度 1g/mL 口径）</p>
              </div>
              <p class="text-xs text-muted-foreground leading-relaxed p-2.5 rounded bg-muted/60 font-mono">{{ wtProcessText }}</p>
              <p class="text-xs text-muted-foreground">口径：质量分数 = 溶质质量 ÷ 溶液总质量；「10% 的水溶液」即 100g 溶液里含 10g 溶质。若溶质是液体（酒精等）按体积分数另算，别混用。</p>
            </div>
            <div v-else class="p-6 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
              填入目标 wt% 与总质量后给出溶质/溶剂克数
            </div>
          </template>

          <!-- 模式②：摩尔浓度 -->
          <template v-else-if="mode === 'molar'">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label for="mol-c" class="block text-sm font-medium text-foreground mb-1.5">目标浓度（mol/L）</label>
                <input
                  id="mol-c"
                  v-model.number="molC"
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 0.5"
                >
              </div>
              <div>
                <label for="mol-v" class="block text-sm font-medium text-foreground mb-1.5">溶液体积（L）</label>
                <input
                  id="mol-v"
                  v-model.number="molV"
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 2"
                >
              </div>
              <div>
                <label for="mol-m" class="block text-sm font-medium text-foreground mb-1.5">摩尔质量（g/mol）</label>
                <input
                  id="mol-m"
                  v-model.number="molM"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 40"
                >
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs text-muted-foreground">常用预设：</span>
              <button
                v-for="p in MOLAR_PRESETS"
                :key="p.name"
                @click="molM = p.M"
                :class="molM === p.M ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition"
              >{{ p.name }}（{{ p.M }}）</button>
            </div>
            <div v-if="molarGramsC > 0" class="space-y-3">
              <div class="bg-primary/10 rounded-lg p-5 text-center">
                <p class="text-xs text-muted-foreground mb-1">称取溶质</p>
                <p class="text-4xl font-bold text-primary">{{ fmt(molarGramsC, 2) }}<span class="text-base font-semibold ml-1">g</span></p>
                <p class="text-sm text-muted-foreground mt-2">即 {{ fmt(molarMmol, 0) }} mmol；体积 {{ fmt(num(molV), 2) }} L = {{ fmt(num(molV) * 1000, 0) }} mL</p>
              </div>
              <p class="text-xs text-muted-foreground leading-relaxed p-2.5 rounded bg-muted/60 font-mono">{{ molarProcessText }}</p>
              <p class="text-xs text-muted-foreground">定容提示：烧杯内加少量水溶解（放热溶质先冷却），转入容量瓶，涮洗烧杯 2–3 次并入，最后加水至刻度线。</p>
            </div>
            <div v-else class="p-6 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
              填入浓度、体积与摩尔质量后给出溶质克数
            </div>
          </template>

          <!-- 模式③：稀释 C1V1=C2V2 -->
          <template v-else-if="mode === 'dilution'">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">求哪个参数？（其余三项填数值）</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  v-for="k in DIL_KEYS"
                  :key="k.k"
                  @click="setDilUnknown(k.k)"
                  :class="dilUnknown === k.k ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-2 rounded-lg text-xs font-medium transition-all"
                >{{ k.label }}</button>
              </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label for="dil-c1" class="block text-xs font-medium text-muted-foreground mb-1">C1 母液浓度（mol/L）</label>
                <input
                  id="dil-c1"
                  v-model.number="dilC1"
                  type="number"
                  min="0"
                  step="0.1"
                  :disabled="dilUnknown === 'c1'"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                  :placeholder="dilUnknown === 'c1' ? '自动求解' : '如 1'"
                >
              </div>
              <div>
                <label for="dil-v1" class="block text-xs font-medium text-muted-foreground mb-1">V1 取样体积（mL）</label>
                <input
                  id="dil-v1"
                  v-model.number="dilV1"
                  type="number"
                  min="0"
                  step="1"
                  :disabled="dilUnknown === 'v1'"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                  :placeholder="dilUnknown === 'v1' ? '自动求解' : '如 25'"
                >
              </div>
              <div>
                <label for="dil-c2" class="block text-xs font-medium text-muted-foreground mb-1">C2 目标浓度（mol/L）</label>
                <input
                  id="dil-c2"
                  v-model.number="dilC2"
                  type="number"
                  min="0"
                  step="0.1"
                  :disabled="dilUnknown === 'c2'"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                  :placeholder="dilUnknown === 'c2' ? '自动求解' : '如 0.1'"
                >
              </div>
              <div>
                <label for="dil-v2" class="block text-xs font-medium text-muted-foreground mb-1">V2 定容体积（mL）</label>
                <input
                  id="dil-v2"
                  v-model.number="dilV2"
                  type="number"
                  min="0"
                  step="1"
                  :disabled="dilUnknown === 'v2'"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                  :placeholder="dilUnknown === 'v2' ? '自动求解' : '如 250'"
                >
              </div>
            </div>
            <div v-if="dilResult" class="space-y-3">
              <div class="bg-primary/10 rounded-lg p-5 text-center">
                <p class="text-xs text-muted-foreground mb-1">{{ dilSolvedLabel }}（待求项）</p>
                <p class="text-4xl font-bold text-primary">{{ fmt(dilSolvedValue, 3) }}</p>
                <p class="text-sm text-muted-foreground mt-2">{{ dilHint }}</p>
              </div>
              <p class="text-xs text-muted-foreground leading-relaxed p-2.5 rounded bg-muted/60 font-mono">C1×V1 = C2×V2 → {{ fmt(dilResult.c1, 3) }} × {{ fmt(dilResult.v1, 1) }} = {{ fmt(dilResult.c2, 3) }} × {{ fmt(dilResult.v2, 1) }}（溶质守恒）</p>
            </div>
            <div v-else class="p-6 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
              除待求项外填满另外三项（均为正数）即自动求解
            </div>
          </template>

          <!-- 模式④：混合终浓度 -->
          <template v-else>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label for="mix-c1" class="block text-xs font-medium text-muted-foreground mb-1">A 液浓度（mol/L）</label>
                <input
                  id="mix-c1"
                  v-model.number="mixC1"
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 1"
                >
              </div>
              <div>
                <label for="mix-v1" class="block text-xs font-medium text-muted-foreground mb-1">A 液体积（mL）</label>
                <input
                  id="mix-v1"
                  v-model.number="mixV1"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 100"
                >
              </div>
              <div>
                <label for="mix-c2" class="block text-xs font-medium text-muted-foreground mb-1">B 液浓度（mol/L）</label>
                <input
                  id="mix-c2"
                  v-model.number="mixC2"
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 0.2（纯水填 0）"
                >
              </div>
              <div>
                <label for="mix-v2" class="block text-xs font-medium text-muted-foreground mb-1">B 液体积（mL）</label>
                <input
                  id="mix-v2"
                  v-model.number="mixV2"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="如 400"
                >
              </div>
            </div>
            <div v-if="mixResult" class="space-y-3">
              <div class="bg-primary/10 rounded-lg p-5 text-center">
                <p class="text-xs text-muted-foreground mb-1">混合终浓度</p>
                <p class="text-4xl font-bold text-primary">{{ fmt(mixResult.final, 3) }}<span class="text-base font-semibold ml-1">mol/L</span></p>
                <p class="text-sm text-muted-foreground mt-2">总体积 {{ fmt(mixResult.vTotal, 1) }} mL · 溶质合计 {{ fmt(mixResult.mmol, 1) }} mmol</p>
              </div>
              <p class="text-xs text-muted-foreground leading-relaxed p-2.5 rounded bg-muted/60 font-mono">{{ mixProcessText }}</p>
              <p class="text-xs text-muted-foreground">口径：c = (c1V1 + c2V2)/(V1+V2)，默认体积可加和（稀水溶液近似成立）；浓溶液、强电解质混合或溶剂不同时体积不严格加和，以实测为准。</p>
            </div>
            <div v-else class="p-6 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
              填入两种液体的浓度与体积后估算混合终浓度
            </div>
          </template>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="copyPrepCard"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition"
          >
            <Copy class="w-4 h-4" /> 复制配制单
          </button>
          <span class="text-xs text-muted-foreground">贴到实验记录本 / 手机备忘录，称量照单执行。</span>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-4">
        <!-- 安全注记 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <ShieldAlert class="w-5 h-5 mr-2 text-primary" /> 安全注记
          </h2>
          <ul class="space-y-2.5 text-sm text-muted-foreground leading-relaxed">
            <li><b class="text-foreground">酸入水</b>：稀释浓硫酸等强酸，把酸沿器壁缓缓加入水中并不断搅拌，切勿把水倒进酸——局部剧烈放热会暴沸飞溅。</li>
            <li><b class="text-foreground">冷却定容</b>：NaOH 溶解、浓酸稀释大量放热，热溶液体积偏大，未冷却就定容会导致冷却后浓度偏高；务必回到室温再定容。</li>
            <li>腐蚀性试剂称量戴手套与护目镜；固体用称量纸/称量瓶，不直接放在天平托盘上。</li>
            <li>定量配制用容量瓶与移液管，粗配用烧杯+量筒即可；一般用蒸馏水/去离子水。</li>
          </ul>
        </div>

        <!-- 常用参考 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <FlaskConical class="w-5 h-5 mr-2 text-primary" /> 常用参考
          </h2>
          <div class="text-sm text-muted-foreground space-y-1.5 leading-relaxed">
            <p>· 常见摩尔质量（g/mol）：NaOH 40.00 · NaCl 58.44 · NaHCO₃ 84.01 · 葡萄糖 180.16 · 蔗糖 342.30</p>
            <p>· 生理盐水 ≈ 0.9% NaCl（质量分数口径）</p>
            <p>· 家用配比参考：糖水 10%、盐水 1% 起步尝味调整</p>
            <p>· mol/L ↔ wt% 换算需要溶液密度与摩尔质量，本页暂不互转</p>
          </div>
        </div>

        <!-- 名词与配套工具互链 -->
        <div class="bg-muted/50 border border-border rounded-lg p-6">
          <h2 class="text-sm font-semibold text-foreground mb-2">名词口径与配套工具</h2>
          <p class="text-sm text-muted-foreground leading-relaxed mb-3">
            质量分数、摩尔浓度、体积分数三种口径的区别与换算条件，见
            <NuxtLink to="/wiki/solution-concentration" class="text-primary hover:underline">溶液浓度名词解释</NuxtLink>。
          </p>
          <p class="text-sm text-muted-foreground leading-relaxed">
            要把母液按 1:10、1:100 逐级配成一系列工作液？
            <NuxtLink to="/tools/serial-dilution-calculator" class="text-primary hover:underline">梯度稀释计算器</NuxtLink>
            专门算逐级稀释链，本页算单步配制、稀释与混合，两者分工互补。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>溶液配制计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          溶液配制计算器覆盖四类最常见的配液场景：① 质量分数配制——目标 wt% × 总质量 = 溶质质量，溶剂（水）= 总质量 − 溶质，
          水按密度 1g/mL 折毫升；② 摩尔浓度配制——溶质质量 = c（mol/L）× V（L）× M（g/mol），内置 NaOH 40、NaCl 58.44、葡萄糖 180.16 预设；
          ③ 稀释 C1V1=C2V2——稀释前后溶质守恒，四个参数知三求一，给出取样体积与定容提示；
          ④ 混合终浓度——c = (c1V1 + c2V2)/(V1+V2)，稀水溶液按体积可加和近似。工具还提供「酸入水、放热冷却定容」等安全注记，
          并可一键复制配制单。名词口径详见
          <NuxtLink to="/wiki/solution-concentration" class="text-primary hover:underline">溶液浓度名词解释</NuxtLink>。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">质量分数、摩尔浓度、体积分数三种口径的区别？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          质量分数 wt% = 溶质质量 ÷ 溶液质量 × 100%，口径是「质量」，称重即得，不受温度影响；
          摩尔浓度 mol/L = 溶质物质的量 ÷ 溶液体积，口径是「体积」，化学反应用量计算最方便，但体积随温度略变；
          体积分数（如 75% 酒精）= 溶质体积 ÷ 溶液体积，适合液体溶质。三者换算需要溶液密度与摩尔质量：
          c = 1000 × ρ × wt% ÷ M（ρ 为密度 g/mL）。日常 kitchen 场景多用质量分数，实验室定量反应用摩尔浓度，
          混合酒水、消毒液用体积分数——先确认口径再算，是配液不翻车的第一步。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">定容是什么意思？为什么要冷却后定容？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          定容指在容量瓶中把溶液体积精确补到标线：烧杯里溶解后先转入容量瓶，涮洗烧杯 2–3 次洗液并入，
          再加水到离刻度线 1–2cm 改用胶头滴管，视线与凹液面最低处相平加至刻度，最后摇匀。
          必须冷却后定容的原因：NaOH 溶解、浓酸稀释都大量放热，热溶液体积膨胀，此时定容刻度对应的水偏少，
          冷却后体积收缩，实际浓度会偏高。顺序永远是：溶解 → 冷却至室温 → 转移洗涤 → 定容 → 摇匀。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">母液与工作液是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          母液（stock solution）是预先配好的高浓度储备液，比如 1 mol/L 的储备盐液、10× 的缓冲液；
          工作液（working solution）是使用时从母液稀释出来的低浓度液。先配母液的好处是分次使用不必每次称量、
          浓度一致性好、还能保存活性成分。C1V1=C2V2 算的就是母液取样体积：C1 是母液浓度、V1 是要取的量，
          C2、V2 是目标工作液的浓度与体积——例：1 mol/L 母液配 250mL 的 0.1 mol/L 工作液，取 25mL 定容即可。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">和梯度稀释计算器的分工？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本页解决「单步」问题：一次配制（质量分数/摩尔浓度）、一步稀释（C1V1=C2V2）和两液混合终浓度。
          如果你要把母液连乘稀释成一系列浓度——如 1:10 → 1:100 → 1:1000 的标准曲线梯度、或对半稀释的 MIC 梯度——
          请用 <NuxtLink to="/tools/serial-dilution-calculator" class="text-primary hover:underline">梯度稀释计算器</NuxtLink>，
          它按稀释倍数与级数展开每管浓度与取样量。一句话分工：单步用本页，成系列用它。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">配 500g 的 10% NaOH 溶液怎么称？</h3>
            <p class="text-sm text-muted-foreground mt-1">溶质 = 500 × 10% = 50g，水 = 450g ≈ 450mL。NaOH 溶解放热，先在烧杯里溶解放凉至室温再装瓶；称量要快（易吸潮），戴手套护目镜。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">0.5mol/L 的 NaOH 溶液 2L 要多少克？</h3>
            <p class="text-sm text-muted-foreground mt-1">质量 = 0.5 mol/L × 2 L × 40 g/mol = 40g。用 2000mL 容量瓶或 1000mL 容量瓶配两次各 20g；溶解放热，冷却至室温后定容。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">C1V1=C2V2 对单位有什么要求？</h3>
            <p class="text-sm text-muted-foreground mt-1">等号两边单位一致即可：浓度都用 mol/L（或都用 wt%、mg/mL），体积都用 mL（或都用 L）。公式本质是溶质守恒，跨浓度类型（如 wt% 配 mol/L）不能直接用。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">两种溶液混合，体积正好相加吗？</h3>
            <p class="text-sm text-muted-foreground leading-relaxed mt-1">稀水溶液近似相加（本工具口径），误差通常在 1–2% 内；浓溶液（如浓硫酸+水）、强电解质高浓度混合或溶剂不同（水+酒精）体积不严格加和，关键应用以实验定容/称重为准。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'solution-prep'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  FlaskConical, Info, ShieldAlert,
  ChevronUp, ChevronDown, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'solution-prep'
const STORAGE_KEY = 'solution-prep.inputs'

// ---------- SEO ----------
useSeoMeta({
  title: '溶液配制计算器 - 质量分数/摩尔浓度/C1V1稀释与混合浓度在线计算',
  description: '免费在线溶液配制计算器：质量分数 wt% 求溶质溶剂克数（水密度 1g/mL 口径）、摩尔浓度 mol/L×体积×摩尔质量求克数（NaOH/NaCl/葡萄糖预设）、稀释 C1V1=C2V2 知三求一定容提示、混合终浓度 c=(c1V1+c2V2)/(V1+V2)，附酸入水与冷却定容安全注记，纯本地计算。',
  keywords: '溶液配制,质量分数计算,摩尔浓度计算,c1v1稀释公式,定容,母液工作液,稀释计算,solution calculator',
  author: '有条工具',
  ogTitle: '溶液配制计算器 - 质量分数/摩尔浓度/C1V1稀释与混合浓度在线计算 | 有条工具',
  ogDescription: '质量分数、摩尔浓度、C1V1=C2V2 稀释与混合终浓度四场景配液计算，含安全注记与配制单复制。',
  ogUrl: 'https://www.util.cn/tools/solution-prep',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '溶液配制计算器',
  twitterDescription: 'wt%/mol/L/C1V1 稀释/混合浓度四模式配液计算，知三求一与定容提示。'
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
          name: '溶液配制计算器',
          url: 'https://www.util.cn/tools/solution-prep',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '质量分数 wt% 求溶质/溶剂克数（水密度 1g/mL 口径）',
            '摩尔浓度 c×V×M 求溶质克数（NaOH/NaCl/葡萄糖预设）',
            '稀释 C1V1=C2V2 四参数知三求一',
            '定容取样提示',
            '混合终浓度 c=(c1V1+c2V2)/(V1+V2)',
            '酸入水与冷却定容安全注记',
            '配制单一键复制',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '溶液配制计算器', item: 'https://www.util.cn/tools/solution-prep/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '配 500g 的 10% NaOH 溶液怎么称？',
              acceptedAnswer: { '@type': 'Answer', text: '溶质 = 500 × 10% = 50g，水 = 450g ≈ 450mL（水密度 1g/mL）。NaOH 溶解放热，先溶解、冷却至室温再装瓶；NaOH 易吸潮称量要快，戴手套护目镜。' }
            },
            {
              '@type': 'Question',
              name: '0.5mol/L 的 NaOH 溶液 2L 要多少克？',
              acceptedAnswer: { '@type': 'Answer', text: '质量 = 0.5 mol/L × 2 L × 40 g/mol = 40g。溶解放热，烧杯内溶解并冷却至室温后转入容量瓶定容到刻度。' }
            },
            {
              '@type': 'Question',
              name: 'C1V1=C2V2 对单位有什么要求？',
              acceptedAnswer: { '@type': 'Answer', text: '等号两边单位一致即可：浓度都用 mol/L（或都用 wt%、mg/mL），体积都用 mL（或都用 L）。公式本质是稀释前后溶质守恒；跨浓度类型（如 wt% 与 mol/L）不能直接套用。' }
            },
            {
              '@type': 'Question',
              name: '两种溶液混合，体积正好相加吗？',
              acceptedAnswer: { '@type': 'Answer', text: '稀水溶液近似相加（误差通常 1-2% 内），c=(c1V1+c2V2)/(V1+V2) 按体积可加和口径估算；浓溶液、强电解质高浓度混合或溶剂不同时体积不严格加和，关键应用以实测为准。' }
            }
          ]
        }
      ]
    })
  }]
})

// __PURE_FNS_START__
// ---------- 纯逻辑（可独立单测） ----------
// 数值解析：非法/空记 0
function num(v) {
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) ? n : 0
}
function pos(v) {
  const n = num(v)
  return n > 0 ? n : 0
}
// 格式化：toFixed + 去尾零，避免浮点尾差
function fmt(v, dp = 2) {
  if (!Number.isFinite(v)) return '—'
  const s = Number(v).toFixed(dp)
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s
}
function roundN(v, dp) {
  const f = Math.pow(10, dp)
  return Math.round(v * f) / f
}

// ① 质量分数：溶质 = 总质量 × wt%，溶剂 = 总质量 − 溶质（pct ≤ 100）
function wtSplit(pct, totalG) {
  const t = pos(totalG), p = num(pct)
  if (!t || p <= 0 || p > 100) return null
  const solute = t * p / 100
  return { solute, solvent: t - solute, waterMl: t - solute } // 水密度 1g/mL 口径
}

// ② 摩尔浓度：质量 g = c(mol/L) × V(L) × M(g/mol)；mmol = c × V(L) × 1000
function molarGrams(c, v, M) {
  const cv = pos(c), vol = pos(v), m = pos(M)
  if (!cv || !vol || !m) return 0
  return cv * vol * m
}
function molarMmolOf(c, v) { return pos(c) * pos(v) * 1000 }

// ③ 稀释 C1V1=C2V2：四参数知三求一（unknown 指明待求项，其余须为正数）
function dilutionSolve(unknown, c1, v1, c2, v2) {
  const C1 = num(c1), V1 = num(v1), C2 = num(c2), V2 = num(v2)
  const need = {
    c1: [V1, C2, V2],
    v1: [C1, C2, V2],
    c2: [C1, V1, V2],
    v2: [C1, V1, C2]
  }
  const req = need[unknown]
  if (!req || req.some((x) => !(x > 0))) return null
  const out = { c1: C1, v1: V1, c2: C2, v2: V2 }
  if (unknown === 'c1') out.c1 = C2 * V2 / V1
  if (unknown === 'v1') out.v1 = C2 * V2 / C1
  if (unknown === 'c2') out.c2 = C1 * V1 / V2
  if (unknown === 'v2') out.v2 = C1 * V1 / C2
  out.solved = unknown
  return out
}

// 定容/取样提示文案
function dilutionHint(r) {
  if (!r) return ''
  if (r.solved === 'v1') return `量取 ${fmt(r.v1, 1)} mL 母液，加水（或稀释剂）定容至 ${fmt(r.v2, 1)} mL 即得工作液。`
  if (r.solved === 'v2') return `量取 ${fmt(r.v1, 1)} mL 母液，加水稀释至总体积 ${fmt(r.v2, 1)} mL。`
  if (r.solved === 'c1') return `母液浓度应为 ${fmt(r.c1, 3)} mol/L（取 ${fmt(r.v1, 1)} mL 稀释至 ${fmt(r.v2, 1)} mL）。`
  return `取 ${fmt(r.v1, 1)} mL 母液（${fmt(r.c1, 3)} mol/L）定容至 ${fmt(r.v2, 1)} mL，终浓度 ${fmt(r.c2, 3)} mol/L。`
}

// ④ 混合终浓度：c = (c1V1 + c2V2)/(V1+V2)，体积可加和口径（浓度可为 0，如掺纯水）
function mixFinal(c1, v1, c2, v2) {
  const V1 = pos(v1), V2 = pos(v2)
  const V = V1 + V2
  if (!V) return 0
  return (num(c1) * V1 + num(c2) * V2) / V
}
function mixMmol(c1, v1, c2, v2) { return num(c1) * pos(v1) + num(c2) * pos(v2) }

// 模式与常量
const MODES = [
  { k: 'wt', label: '质量分数' },
  { k: 'molar', label: '摩尔浓度' },
  { k: 'dilution', label: '稀释 C1V1' },
  { k: 'mix', label: '混合终浓度' }
]
const MOLAR_PRESETS = [
  { name: 'NaOH 氢氧化钠', M: 40 },
  { name: 'NaCl 氯化钠', M: 58.44 },
  { name: '葡萄糖', M: 180.16 }
]
const DIL_KEYS = [
  { k: 'c1', label: '求 C1 母液浓度' },
  { k: 'v1', label: '求 V1 取样体积' },
  { k: 'c2', label: '求 C2 目标浓度' },
  { k: 'v2', label: '求 V2 定容体积' }
]
const DIL_LABELS = { c1: '母液浓度 C1', v1: '取样体积 V1', c2: '目标浓度 C2', v2: '定容体积 V2' }

// 配制单文案（可独立单测）
function buildPrepText(info) {
  const lines = []
  lines.push('【溶液配制单】溶液配制计算器')
  if (info.mode === 'wt') {
    lines.push(`配制 ${fmt(info.pct, 2)}%（质量分数）溶液，总量 ${fmt(info.totalG, 1)} g`)
    lines.push(`· 称取溶质 ${fmt(info.solute, 2)} g`)
    lines.push(`· 量取溶剂（水）${fmt(info.solvent, 2)} g ≈ ${fmt(info.waterMl, 1)} mL（水密度 1g/mL 口径）`)
    lines.push('· 溶解混匀即得；放热溶质先冷却再转移装瓶。')
  } else if (info.mode === 'molar') {
    lines.push(`配制 ${fmt(info.c, 3)} mol/L 溶液 ${fmt(info.vL, 2)} L（${fmt(info.vL * 1000, 0)} mL），摩尔质量 ${fmt(info.M, 2)} g/mol`)
    lines.push(`· 称取溶质 ${fmt(info.grams, 2)} g（${fmt(info.mmol, 0)} mmol）`)
    lines.push('· 烧杯溶解 → 冷却至室温 → 转容量瓶 → 涮洗 2–3 次 → 定容摇匀。')
  } else if (info.mode === 'dilution') {
    lines.push(`稀释（C1V1=C2V2）：C1=${fmt(info.c1, 3)} mol/L · V1=${fmt(info.v1, 1)} mL → C2=${fmt(info.c2, 3)} mol/L · V2=${fmt(info.v2, 1)} mL`)
    lines.push(`· ${info.hint}`)
    lines.push('· 移液管/移液器取样，容量瓶定容；稀释倍数大时分两步稀释更准。')
  } else {
    lines.push(`混合：${fmt(info.c1, 3)} mol/L × ${fmt(info.v1, 1)} mL + ${fmt(info.c2, 3)} mol/L × ${fmt(info.v2, 1)} mL`)
    lines.push(`· 混合总体积 ${fmt(info.vTotal, 1)} mL，终浓度 ${fmt(info.final, 3)} mol/L（体积可加和口径）`)
    lines.push('· 同类溶剂体系才可直接相加体积；浓度差异大或浓溶液以实测为准。')
  }
  lines.push('安全：稀释强酸「酸入水」沿壁缓加并搅拌；NaOH 等放热体系冷却至室温后再定容。')
  return lines.join('\n')
}
// __PURE_FNS_END__

// ---------- 交互状态 ----------
const mode = ref('wt')

// ① 质量分数
const wtPct = ref(10)
const wtTotal = ref(500)

// ② 摩尔浓度
const molC = ref(0.5)
const molV = ref(2)
const molM = ref(40)

// ③ 稀释（默认：1M 母液 → 250mL 的 0.1M，求 V1）
const dilUnknown = ref('v1')
const dilC1 = ref(1)
const dilV1 = ref('')
const dilC2 = ref(0.1)
const dilV2 = ref(250)

// ④ 混合
const mixC1 = ref(1)
const mixV1 = ref(100)
const mixC2 = ref(0.2)
const mixV2 = ref(400)

const seoContentVisible = ref(true)
// 未知项切换时的旧值暂存（纯内存，非浏览器 API）
const dilStash = {}

// ---------- 派生计算 ----------
const wtResult = computed(() => wtSplit(wtPct.value, wtTotal.value))
const wtProcessText = computed(() => {
  const r = wtResult.value
  if (!r) return ''
  return `溶质 = ${fmt(num(wtTotal.value), 1)} g × ${fmt(num(wtPct.value), 2)}% = ${fmt(r.solute, 2)} g；水 = ${fmt(num(wtTotal.value), 1)} − ${fmt(r.solute, 2)} = ${fmt(r.solvent, 2)} g ≈ ${fmt(r.waterMl, 1)} mL`
})

const molarGramsC = computed(() => molarGrams(molC.value, molV.value, molM.value))
const molarMmol = computed(() => molarMmolOf(molC.value, molV.value))
const molarProcessText = computed(() => {
  if (!(molarGramsC.value > 0)) return ''
  return `溶质 = ${fmt(num(molC.value), 3)} mol/L × ${fmt(num(molV.value), 2)} L × ${fmt(num(molM.value), 2)} g/mol = ${fmt(molarGramsC.value, 2)} g`
})

const dilResult = computed(() => dilutionSolve(dilUnknown.value, dilC1.value, dilV1.value, dilC2.value, dilV2.value))
const dilSolvedValue = computed(() => (dilResult.value ? dilResult.value[dilUnknown.value] : 0))
const dilSolvedLabel = computed(() => DIL_LABELS[dilUnknown.value] || '待求项')
const dilHint = computed(() => dilutionHint(dilResult.value))

const mixResult = computed(() => {
  const V1 = pos(mixV1.value), V2 = pos(mixV2.value)
  if (!(V1 + V2)) return null
  return {
    final: mixFinal(mixC1.value, V1, mixC2.value, V2),
    vTotal: V1 + V2,
    mmol: mixMmol(mixC1.value, V1, mixC2.value, V2)
  }
})
const mixProcessText = computed(() => {
  const r = mixResult.value
  if (!r) return ''
  return `c = (${fmt(num(mixC1.value), 3)}×${fmt(pos(mixV1.value), 1)} + ${fmt(num(mixC2.value), 3)}×${fmt(pos(mixV2.value), 1)}) ÷ ${fmt(r.vTotal, 1)} = ${fmt(r.final, 3)} mol/L`
})

const prepCardText = computed(() => {
  if (mode.value === 'wt') {
    const r = wtResult.value
    if (!r) return ''
    return buildPrepText({
      mode: 'wt',
      pct: num(wtPct.value),
      totalG: num(wtTotal.value),
      solute: r.solute,
      solvent: r.solvent,
      waterMl: r.waterMl
    })
  }
  if (mode.value === 'molar') {
    if (!(molarGramsC.value > 0)) return ''
    return buildPrepText({
      mode: 'molar',
      c: num(molC.value),
      vL: num(molV.value),
      M: num(molM.value),
      grams: molarGramsC.value,
      mmol: molarMmol.value
    })
  }
  if (mode.value === 'dilution') {
    const r = dilResult.value
    if (!r) return ''
    return buildPrepText({
      mode: 'dilution',
      c1: r.c1, v1: r.v1, c2: r.c2, v2: r.v2,
      hint: dilutionHint(r)
    })
  }
  const r = mixResult.value
  if (!r) return ''
  return buildPrepText({
    mode: 'mix',
    c1: num(mixC1.value), v1: pos(mixV1.value),
    c2: num(mixC2.value), v2: pos(mixV2.value),
    vTotal: r.vTotal,
    final: r.final
  })
})

// ---------- 事件（浏览器 API 只在回调，SSR 安全） ----------
// 稀释未知项切换：暂存旧值，空出新的待求项
function fieldOf(k) {
  if (k === 'c1') return dilC1.value
  if (k === 'v1') return dilV1.value
  if (k === 'c2') return dilC2.value
  return dilV2.value
}
function setFieldOf(k, val) {
  if (k === 'c1') dilC1.value = val
  else if (k === 'v1') dilV1.value = val
  else if (k === 'c2') dilC2.value = val
  else dilV2.value = val
}
function setDilUnknown(k) {
  if (k === dilUnknown.value) return
  dilStash[dilUnknown.value] = fieldOf(dilUnknown.value)
  dilUnknown.value = k
  setFieldOf(k, Object.prototype.hasOwnProperty.call(dilStash, k) ? dilStash[k] : '')
}

async function copyPrepCard() {
  const text = prepCardText.value
  if (!text) {
    alert('请先填写参数得出配制结果')
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    alert('配制单已复制到剪贴板')
  } catch (e) {
    alert('复制失败，请手动选中配制单文本复制')
  }
}
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 输入持久化（键前缀为工具 id；watch 仅由用户交互触发，SSR 安全）
watch([mode, wtPct, wtTotal, molC, molV, molM, dilUnknown, dilC1, dilV1, dilC2, dilV2, mixC1, mixV1, mixC2, mixV2], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode: mode.value,
      wtPct: wtPct.value,
      wtTotal: wtTotal.value,
      molC: molC.value,
      molV: molV.value,
      molM: molM.value,
      dilUnknown: dilUnknown.value,
      dilC1: dilC1.value,
      dilV1: dilV1.value,
      dilC2: dilC2.value,
      dilV2: dilV2.value,
      mixC1: mixC1.value,
      mixV1: mixV1.value,
      mixC2: mixC2.value,
      mixV2: mixV2.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
})

// ---------- 挂载：注册最近使用 + 恢复上次输入 ----------
onMounted(() => {
  addRecentTool(TOOL_ID)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (typeof s.mode === 'string') mode.value = s.mode
      if (typeof s.wtPct === 'number') wtPct.value = s.wtPct
      if (typeof s.wtTotal === 'number') wtTotal.value = s.wtTotal
      if (typeof s.molC === 'number') molC.value = s.molC
      if (typeof s.molV === 'number') molV.value = s.molV
      if (typeof s.molM === 'number') molM.value = s.molM
      if (typeof s.dilUnknown === 'string') dilUnknown.value = s.dilUnknown
      if (typeof s.dilC1 === 'number' || typeof s.dilC1 === 'string') dilC1.value = s.dilC1
      if (typeof s.dilV1 === 'number' || typeof s.dilV1 === 'string') dilV1.value = s.dilV1
      if (typeof s.dilC2 === 'number' || typeof s.dilC2 === 'string') dilC2.value = s.dilC2
      if (typeof s.dilV2 === 'number' || typeof s.dilV2 === 'string') dilV2.value = s.dilV2
      if (typeof s.mixC1 === 'number') mixC1.value = s.mixC1
      if (typeof s.mixV1 === 'number') mixV1.value = s.mixV1
      if (typeof s.mixC2 === 'number') mixC2.value = s.mixC2
      if (typeof s.mixV2 === 'number') mixV2.value = s.mixV2
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})
</script>
