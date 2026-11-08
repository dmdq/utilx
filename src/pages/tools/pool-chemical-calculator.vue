<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Droplets class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">泳池投药计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">泳池容积、余氯消毒剂与 pH 调节剂用量一步算清——先算后投、循环复测，不凭感觉下药</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线泳池投药计算器：先按矩形（长 × 宽 × 平均水深）或圆形（π × 半径² × 水深）算出泳池容积，
        再用「用量(g) = 容积(L) × 浓度变化(ppm) ÷ 有效成分含量」计算把游离氯从现状提到目标所需的药剂克数，
        三氯异氰尿酸、二氯、次氯酸钙、次氯酸钠四种常见药剂按各自有效氯含量自动对照，含量可按产品包装修改；
        pH 调节按「每 50 m³ 每变化 0.1 pH」的经验剂量区间估算盐酸或纯碱用量，页面明确标注为经验参考、需复测校准。
        消毒剂勿混用、投药后循环 1-2 小时再复测、儿童远离等安全提示与计算同等显眼。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <p class="flex items-start gap-2 text-xs leading-relaxed bg-primary/10 border border-primary/20 text-foreground rounded-lg p-3 mb-6">
      <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
      <span>本页所有剂量均为参考值：投药请以产品说明书为准，先投估量的一部分，循环 1-2 小时复测后再决定是否补足。计算只在浏览器本地进行。</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左栏：输入 -->
      <div class="space-y-6">
        <!-- 容积 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Waves class="w-5 h-5 mr-2 text-primary" /> 泳池容积
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">池体形状</label>
            <div class="flex rounded-lg border border-border overflow-hidden w-fit">
              <button
                @click="poolShape = 'rect'"
                class="px-4 py-1.5 text-sm font-medium transition"
                :class="poolShape === 'rect' ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted'"
              >矩形池</button>
              <button
                @click="poolShape = 'circle'"
                class="px-4 py-1.5 text-sm font-medium transition"
                :class="poolShape === 'circle' ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted'"
              >圆形池</button>
            </div>
          </div>

          <div v-if="poolShape === 'rect'" class="grid grid-cols-3 gap-3">
            <div>
              <label for="pool-length" class="block text-sm font-medium text-foreground mb-1.5">长（米）</label>
              <input
                id="pool-length"
                v-model.number="lengthM"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label for="pool-width" class="block text-sm font-medium text-foreground mb-1.5">宽（米）</label>
              <input
                id="pool-width"
                v-model.number="widthM"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label for="pool-depth" class="block text-sm font-medium text-foreground mb-1.5">平均水深（米）</label>
              <input
                id="pool-depth"
                v-model.number="avgDepthM"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <p v-if="poolShape === 'rect'" class="text-xs text-muted-foreground -mt-2">
            平均水深：浅端与深端各测一次取平均；斜底池分段多测几处会更准。
          </p>

          <div v-if="poolShape === 'circle'" class="grid grid-cols-2 gap-3">
            <div>
              <label for="pool-radius" class="block text-sm font-medium text-foreground mb-1.5">半径（米）</label>
              <input
                id="pool-radius"
                v-model.number="radiusM"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label for="pool-circle-depth" class="block text-sm font-medium text-foreground mb-1.5">水深（米）</label>
              <input
                id="pool-circle-depth"
                v-model.number="depthM"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <p v-if="poolShape === 'circle'" class="text-xs text-muted-foreground -mt-2">
            半径 = 直径 ÷ 2。圆形池按 π × 半径² × 水深计算。
          </p>

          <div>
            <label for="pool-known-volume" class="block text-sm font-medium text-foreground mb-1.5">已知容积（选填，m³）</label>
            <input
              id="pool-known-volume"
              v-model.number="knownVolume"
              type="number"
              min="0"
              step="0.1"
              placeholder="如 50"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p class="text-xs text-muted-foreground mt-1.5">图纸或铭牌已标明容积就直接填，留空或填 0 按上方尺寸计算。</p>
          </div>
        </div>

        <!-- 余氯投药 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Droplets class="w-5 h-5 mr-2 text-primary" /> 游离氯（余氯）投药
          </h2>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="pool-fc-now" class="block text-sm font-medium text-foreground mb-1.5">现状游离氯（ppm）</label>
              <input
                id="pool-fc-now"
                v-model.number="currentFc"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label for="pool-fc-target" class="block text-sm font-medium text-foreground mb-1.5">目标游离氯（ppm）</label>
              <input
                id="pool-fc-target"
                v-model.number="targetFc"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p class="text-xs text-muted-foreground mt-1">常见维护范围 1-3 ppm</p>
            </div>
          </div>

          <div>
            <label for="pool-product" class="block text-sm font-medium text-foreground mb-1.5">消毒剂</label>
            <select
              id="pool-product"
              v-model="productId"
              @change="applyProductPurity"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option v-for="p in CHLORINE_PRODUCTS" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>

          <div>
            <label for="pool-purity" class="block text-sm font-medium text-foreground mb-1.5">有效成分含量（%）</label>
            <input
              id="pool-purity"
              v-model.number="purityInput"
              type="number"
              min="1"
              max="100"
              step="0.5"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p class="text-xs text-muted-foreground mt-1.5">以上为商品常规规格参考值，请按产品包装标示的实际含量修改。</p>
          </div>
        </div>

        <!-- pH 调节 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <FlaskConical class="w-5 h-5 mr-2 text-primary" /> pH 调节（经验估算）
          </h2>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="pool-ph-now" class="block text-sm font-medium text-foreground mb-1.5">现状 pH</label>
              <input
                id="pool-ph-now"
                v-model.number="currentPh"
                type="number"
                min="0"
                max="14"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label for="pool-ph-target" class="block text-sm font-medium text-foreground mb-1.5">目标 pH</label>
              <input
                id="pool-ph-target"
                v-model.number="targetPh"
                type="number"
                min="0"
                max="14"
                step="0.1"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p class="text-xs text-muted-foreground mt-1">参考范围 7.2-7.8</p>
            </div>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed">
            pH 受总碱度、水温等影响很大，本节剂量是经验区间估算，不是精确公式——先投区间下限的量，
            循环后复测再补。调节方向会根据现状与目标自动判断（低于目标用上调剂，高于目标用下调剂）。
          </p>
        </div>
      </div>

      <!-- 右栏：结果 -->
      <div class="space-y-6">
        <!-- 容积结果 -->
        <div class="bg-muted/40 border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Waves class="w-5 h-5 mr-2 text-primary" /> 容积结果
          </h2>
          <div v-if="volumeM3 === null" class="py-6 text-center text-sm text-muted-foreground">
            请先填写有效的池体尺寸（数值需大于 0），或直接填写已知容积。
          </div>
          <template v-else>
            <div class="flex items-end gap-4">
              <div>
                <p class="text-xs text-muted-foreground mb-1">泳池容积</p>
                <p class="text-3xl font-bold text-foreground">{{ fmt(volumeM3, 1) }} <span class="text-base font-medium">m³</span></p>
              </div>
              <div class="pb-1">
                <p class="text-xs text-muted-foreground mb-1">折合</p>
                <p class="text-lg font-semibold text-foreground">{{ fmt(volumeL, 0) }} L</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ knownVolume > 0 ? '按你填写的已知容积计算' : (poolShape === 'rect' ? '按矩形：长 × 宽 × 平均水深' : '按圆形：π × 半径² × 水深') }}
            </p>
          </template>
        </div>

        <!-- 余氯投药结果 -->
        <div class="bg-muted/40 border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Droplets class="w-5 h-5 mr-2 text-primary" /> 消毒剂用量
          </h2>

          <div v-if="fcDelta === null" class="py-6 text-center text-sm text-muted-foreground">
            请先填写有效的现状与目标游离氯（数值不小于 0）。
          </div>

          <div v-else-if="fcDelta <= 0" class="space-y-2">
            <p class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle class="w-4 h-4 flex-shrink-0" />
              {{ fcDelta === 0 ? '现状已达目标游离氯，无需补投。' : '现状高于目标：停止补投，加强循环静置，让余氯自然衰减后再复测。' }}
            </p>
          </div>

          <div v-else-if="volumeM3 === null" class="py-6 text-center text-sm text-muted-foreground">
            先在左侧算出泳池容积，再回来查用量。
          </div>

          <div v-else-if="!purityValid" class="py-6 text-center text-sm text-muted-foreground">
            有效成分含量需在 1-100 之间，请按产品包装修改。
          </div>

          <template v-else>
            <div class="p-4 bg-background border border-border rounded-lg">
              <p class="text-sm text-muted-foreground mb-1">需要{{ selectedProduct.shortName || selectedProduct.name }}</p>
              <p class="text-3xl font-bold text-primary">{{ fmtWeight(selectedDoseG) }}</p>
              <p class="text-xs text-muted-foreground mt-2">
                算式：{{ fmt(volumeL, 0) }} L × {{ fmt(fcDelta, 2) }} ppm ÷ {{ fmt(purityInput, 1) }}% 有效成分
                （1 ppm = 1 mg/L）
              </p>
            </div>

            <div class="border border-border rounded-lg overflow-hidden">
              <p class="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/60 border-b border-border">按本次目标变化量，各常见药剂用量对照（含量为默认书值）</p>
              <div
                v-for="row in productComparison"
                :key="row.id"
                class="flex justify-between items-center px-3 py-2 text-sm border-b border-border last:border-b-0"
                :class="row.id === productId ? 'bg-primary/5' : ''"
              >
                <span :class="row.id === productId ? 'font-medium text-foreground' : 'text-muted-foreground'">{{ row.name }}</span>
                <span :class="row.id === productId ? 'font-semibold text-foreground' : 'text-foreground'">{{ fmtWeight(row.grams) }}</span>
              </div>
            </div>

            <p class="text-xs text-muted-foreground leading-relaxed">
              缓释氯片请按单片有效氯含量折算片数；液体药剂 1 L 约 1.1-1.2 kg，按体积量取时自行折算。
              建议先投估量的 2/3，循环 1-2 小时复测后按需补足。
            </p>
          </template>
        </div>

        <!-- pH 调节结果 -->
        <div class="bg-muted/40 border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <FlaskConical class="w-5 h-5 mr-2 text-primary" /> pH 调节用量（经验区间）
          </h2>

          <div v-if="phDelta === null" class="py-6 text-center text-sm text-muted-foreground">
            请先填写有效的现状与目标 pH（0-14）。
          </div>

          <div v-else-if="Math.abs(phDelta) < 0.01" class="space-y-2">
            <p class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle class="w-4 h-4 flex-shrink-0" />
              现状 pH 已在目标值，无需调节。
            </p>
          </div>

          <div v-else-if="volumeM3 === null" class="py-6 text-center text-sm text-muted-foreground">
            先在左侧算出泳池容积，再回来查用量。
          </div>

          <template v-else>
            <div class="p-4 bg-background border border-border rounded-lg">
              <p class="text-sm text-muted-foreground mb-1">
                {{ phDelta > 0 ? '上调' : '下调' }} {{ fmt(Math.abs(phDelta), 2) }} pH（{{ fmt(volumeM3, 1) }} m³），约需
              </p>
              <p class="text-2xl font-bold text-primary">
                {{ fmt(phDose.low, 2) }} – {{ fmt(phDose.high, 2) }} {{ phDose.unit }}
              </p>
              <p class="text-xs text-muted-foreground mt-2">{{ phDose.name }}，按「每 50 m³ 每变化 0.1 pH」的经验锚点线性折算</p>
            </div>
            <p class="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>经验参考值（区间来源为泳池维护经验，非精确公式）：先投下限的量，循环后复测，按实际 pH 再补——以产品说明书与实际复测为准。</span>
            </p>
          </template>
        </div>

        <!-- 目标范围参考 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 目标范围参考
          </h2>
          <div class="flex justify-between items-center py-1.5">
            <span class="text-sm text-muted-foreground">游离氯（余氯）</span>
            <span class="text-sm font-medium text-foreground">1 – 3 ppm</span>
          </div>
          <div class="flex justify-between items-center py-1.5">
            <span class="text-sm text-muted-foreground">pH</span>
            <span class="text-sm font-medium text-foreground">7.2 – 7.8</span>
          </div>
          <div v-if="fcStatus" class="flex justify-between items-center py-1.5 border-t border-border">
            <span class="text-sm text-muted-foreground">你的现状游离氯 {{ fmt(currentFc, 2) }} ppm</span>
            <span class="text-xs px-2 py-0.5 rounded-full border" :class="statusBadgeClass[fcStatus]">{{ statusBadgeText[fcStatus] }}</span>
          </div>
          <div v-if="phStatus" class="flex justify-between items-center py-1.5">
            <span class="text-sm text-muted-foreground">你的现状 pH {{ fmt(currentPh, 2) }}</span>
            <span class="text-xs px-2 py-0.5 rounded-full border" :class="statusBadgeClass[phStatus]">{{ statusBadgeText[phStatus] }}</span>
          </div>
          <p class="text-xs text-muted-foreground">
            以上为常见维护参考口径；正式经营场馆以当地卫生监管要求为准。pH 偏高时余氯杀菌效率会下降，两者要一起看。
          </p>
        </div>
      </div>
    </div>

    <!-- 安全提示（整宽，与计算同等重要） -->
    <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold flex items-center text-foreground mb-3">
        <TriangleAlert class="w-5 h-5 mr-2 text-amber-600 dark:text-amber-400" /> 安全提示（与计算同样重要）
      </h2>
      <ul class="space-y-2 text-sm text-muted-foreground">
        <li class="flex items-start gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5"></span>
          <span><strong class="text-foreground">严禁混用：</strong>含氯消毒剂与盐酸等酸性药剂接触会立即放出有毒的氯气，两者必须分开存放、分开投加，投加间隔要充分循环。</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5"></span>
          <span><strong class="text-foreground">投药时池内不得有人：</strong>投药后开启循环泵循环 1-2 小时，再复测余氯与 pH，达标后再开放使用。</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5"></span>
          <span><strong class="text-foreground">儿童远离药剂：</strong>所有药剂密封存放于阴凉干燥处，远离儿童与火源；称量用具专物专用，不得挪作他用。</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5"></span>
          <span><strong class="text-foreground">先算后投、小步快调：</strong>先投估量的 2/3，循环复测后再补足，比一次投满更安全——本工具结果仅为参考剂量，以产品说明书与实际复测为准。</span>
        </li>
      </ul>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative mb-8">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是泳池投药计算器？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          泳池投药计算器是一款面向家庭泳池、民宿泳池与小型场馆维护者的在线剂量工具。它把投药前的两步算术集中在一个页面：
          第一步按池体形状算出水量——矩形池用长 × 宽 × 平均水深，圆形池用 π × 半径² × 水深，也可以直接填图纸上的已知容积；
          第二步按「用量(g) = 容积(L) × 浓度变化(ppm) ÷ 有效成分含量」把游离氯从现状提到目标值所需的消毒剂克数算出来，
          并对三氯异氰尿酸（TCCA）、二氯异氰尿酸钠（SDIC）、次氯酸钙、次氯酸钠四种常见药剂按各自有效氯含量给出对照。
          pH 调节剂用量没有普适公式（受总碱度影响极大），本页按「每 50 m³ 每变化 0.1 pH」的经验锚点给出区间并明确标注为经验参考。
          全部计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">泳池容积怎么算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          矩形池：容积(m³) = 长(m) × 宽(m) × 平均水深(m)。平均水深在浅端和深端各测一次取平均，
          有台阶或斜底的池子分段多测几处取平均更准——1.2 m 与 1.6 m 深的两段池，平均水深不是简单的中点，按面积加权更好。
          圆形池：容积(m³) = 3.1416 × 半径(m)² × 水深(m)。算出的 m³ 乘以 1000 就是升（L），投药公式直接用升。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">消毒剂用量公式与例子</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-3">
          用量(g) = 容积(L) × 浓度变化(mg/L，即 ppm) ÷ 有效成分含量。水的密度近似 1 kg/L，所以 1 ppm = 1 mg/L，
          每 1000 L 水提升 1 ppm 需要 1 g 纯氯。
        </p>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
          <li>50 m³（50000 L）提升 1 ppm：需纯氯 50000 × 1 ÷ 1000 = 50 g</li>
          <li>用三氯异氰尿酸（有效氯约 90%）：50 ÷ 0.9 ≈ 55.6 g</li>
          <li>用二氯异氰尿酸钠（有效氯约 55%）：50 ÷ 0.55 ≈ 90.9 g</li>
          <li>用次氯酸钠液体（约 10%）：50 ÷ 0.10 = 500 g（约 0.42-0.45 L）</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">pH 调节为什么只给经验区间？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          因为 pH 的变化量不只取决于加了多少酸或碱，更取决于水的总碱度（缓冲能力）：同样 50 m³ 水、同样降 0.1 pH，
          总碱度高的池子要的酸可能是低碱度池子的几倍。所以任何「死表」都会误导，本页选择给出经验区间——
          以 50 m³ 降 0.1 pH 约需 31% 盐酸 0.5-1 L 为锚点线性折算，并强制提醒先投一部分、循环后复测再补。
          正确的节奏是：测 pH 和总碱度 → 按区间下限投药 → 循环 1-2 小时 → 复测 → 微调。总碱度本身也应定期检测（常见参考 80-120 ppm）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">使用场景</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
          <li>家庭泳池 / 别墅泳池开季与日常维护：算清水量再买药，避免买多浪费或买少不够</li>
          <li>民宿、小型游泳馆的兼职维护：按测得的余氯现状算补投量，替代「凭经验倒半桶」</li>
          <li>检测超标后的纠偏：余氯偏低算补投，pH 超范围算调节剂用量，循环复测后复核</li>
          <li>泳池维护教学与培训：用公式和对照表理解有效成分含量对实际用量的影响</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">50 m³ 水提高 1 ppm 余氯需要多少消毒剂？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              需要纯氯 50 g；折成商品药剂：三氯异氰尿酸（有效氯约 90%）约 55.6 g，二氯（约 55%）约 90.9 g，
              10% 次氯酸钠液体约 500 g。公式是用量(g) = 容积(L) × 浓度变化(ppm) ÷ 有效成分含量，
              药剂实际含量按包装标示代入。建议先投 2/3，循环 1-2 小时复测后再补足。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">pH 调节剂的用量为什么只给区间，不准一点吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              不准是刻意的：pH 变化量受总碱度（水的缓冲能力）影响极大，同样的池子、同样的目标，
              不同碱度下所需酸量能差几倍，精确死表反而误导。本页按「50 m³ 每降 0.1 pH 约需 31% 盐酸 0.5-1 L」的经验锚点给区间，
              来源是泳池维护经验值，并标注以产品说明书与实际复测为准——先投下限量、循环复测、按需补足才是可靠做法。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">游离氯和 pH 的目标范围是多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              常见维护口径：游离氯 1-3 ppm、pH 7.2-7.8。pH 高于 7.8 时次氯酸的杀菌效率明显下降，即使余氯达标消毒效果也会打折扣，
              所以两项要一起调。正式经营场所请以当地卫生监管标准为准；本页的判定仅供参考。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么消毒剂绝对不能和盐酸混用？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              含氯消毒剂（氯片、粉剂、次氯酸钠）遇酸会立即反应放出氯气——黄绿色有毒气体，密闭空间少量吸入就会刺激呼吸道甚至致命。
              因此酸性和含氯药剂必须分开存放（不共用一个货架层）、分开投加，投加之间充分循环；称量用具也不能混用。
              万一闻到刺激性黄绿色气体，立即撤离通风处并就医。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">投药后多久可以游泳？什么时候复测？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              投药时人离开池子，开循环泵循环 1-2 小时让药剂混匀，之后复测余氯与 pH：游离氯回落到 1-3 ppm、pH 在 7.2-7.8
              才适合下水。缓释氯片投入浮药器后持续溶解，期间不要让人（尤其儿童）接触浮药器。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pool-chemical-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Droplets, Waves, FlaskConical, Info, TriangleAlert,
  ChevronUp, ChevronDown, CheckCircle
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '泳池投药计算器 - 泳池容积与消毒剂/pH 调节剂用量计算 | 有条工具',
  description: '免费在线泳池投药计算器：矩形/圆形泳池容积计算，按「容积×浓度变化÷有效成分含量」算余氯提升所需氯片、二氯、次氯酸钙、次氯酸钠用量，pH 调节经验剂量区间并标注需复测，消毒剂勿混用等安全提示齐全，纯浏览器本地运行不上传',
  keywords: '泳池投药计算,泳池消毒剂用量,泳池余氯计算,泳池pH调节,泳池容积计算,氯片用量,三氯异氰尿酸,二氯消毒剂',
  author: '有条工具',
  ogTitle: '泳池投药计算器 - 泳池容积与投药量在线计算 | 有条工具',
  ogDescription: '先算容积再算投药：余氯提升剂量四药剂对照，pH 调节经验区间标注复测提醒，安全提示与计算同等显眼。',
  ogUrl: 'https://www.util.cn/tools/pool-chemical-calculator',
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
          name: '泳池投药计算器',
          url: 'https://www.util.cn/tools/pool-chemical-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '矩形/圆形泳池容积计算，支持已知容积直填',
            '余氯提升投药量：用量(g)=容积(L)×浓度变化(ppm)÷有效成分含量',
            '三氯异氰尿酸/二氯/次氯酸钙/次氯酸钠四药剂用量对照',
            '有效成分含量可按产品包装修改',
            'pH 调节经验剂量区间并强制标注复测提醒',
            '游离氯 1-3 ppm 与 pH 7.2-7.8 目标范围提示',
            '消毒剂混用/循环复测/儿童远离安全提示',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '泳池投药计算器', item: 'https://www.util.cn/tools/pool-chemical-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '50 m³ 水提高 1 ppm 余氯需要多少消毒剂？',
              acceptedAnswer: { '@type': 'Answer', text: '需要纯氯 50 g；折成商品药剂：三氯异氰尿酸（有效氯约 90%）约 55.6 g，二氯（约 55%）约 90.9 g，10% 次氯酸钠液体约 500 g。公式是用量(g)=容积(L)×浓度变化(ppm)÷有效成分含量，药剂实际含量按包装标示代入。建议先投 2/3，循环 1-2 小时复测后再补足。' }
            },
            {
              '@type': 'Question',
              name: 'pH 调节剂的用量为什么只给区间？',
              acceptedAnswer: { '@type': 'Answer', text: 'pH 变化量受总碱度（水的缓冲能力）影响极大，同样条件下所需酸量可差数倍，精确死表反而误导。本页按「50 m³ 每降 0.1 pH 约需 31% 盐酸 0.5-1 L」的经验锚点给区间，来源为泳池维护经验值，以产品说明书与实际复测为准。' }
            },
            {
              '@type': 'Question',
              name: '游离氯和 pH 的目标范围是多少？',
              acceptedAnswer: { '@type': 'Answer', text: '常见维护口径：游离氯 1-3 ppm、pH 7.2-7.8。pH 高于 7.8 时杀菌效率明显下降，两项要一起调；正式经营场所以当地卫生监管标准为准。' }
            },
            {
              '@type': 'Question',
              name: '为什么消毒剂绝对不能和盐酸混用？',
              acceptedAnswer: { '@type': 'Answer', text: '含氯消毒剂遇酸会立即反应放出有毒氯气。酸性与含氯药剂必须分开存放、分开投加，投加之间充分循环，称量用具也不能混用。' }
            },
            {
              '@type': 'Question',
              name: '投药后多久可以游泳？什么时候复测？',
              acceptedAnswer: { '@type': 'Answer', text: '投药时人离开池子，开循环泵循环 1-2 小时让药剂混匀后复测：游离氯 1-3 ppm、pH 7.2-7.8 才适合下水；缓释氯片溶解期间不要接触浮药器。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 单位口径：1 m³ = 1000 L；1 ppm = 1 mg/L；每 1000 L 水提升 1 ppm 需纯药 1 g
const L_PER_M3 = 1000

// 常见含氯消毒剂有效成分（有效氯）含量（%，商品常规规格参考值；以产品包装标示为准，页面可修改）
const CHLORINE_PRODUCTS = [
  { id: 'tcca', name: '三氯异氰尿酸（缓释氯片 TCCA）', shortName: '三氯异氰尿酸氯片', purity: 90 },
  { id: 'sdic', name: '二氯异氰尿酸钠（速溶粉剂 SDIC）', shortName: '二氯粉剂', purity: 55 },
  { id: 'cal-hypo', name: '次氯酸钙（漂白精）', shortName: '次氯酸钙', purity: 65 },
  { id: 'liq-chlorine', name: '次氯酸钠（液体消毒剂）', shortName: '次氯酸钠液体', purity: 10 }
]

// 游离氯与 pH 的常见维护目标范围
const FREE_CHLORINE_RANGE = { min: 1, max: 3 }
const PH_RANGE = { min: 7.2, max: 7.8 }

// pH 调节经验剂量锚点：每 50 m³ 水每变化 0.1 pH 的用量区间
// 来源为泳池维护经验参考值（非精确公式，pH 受总碱度影响极大）——投药以产品说明书与实际复测为准
const PH_ADJUSTERS = {
  down: { name: '31% 盐酸（pH 下调剂）', low: 0.5, high: 1, unit: 'L' },
  up: { name: '纯碱 / 碳酸钠（pH 上调剂）', low: 0.1, high: 0.2, unit: 'kg' }
}

const isPositive = (n) => Number.isFinite(n) && n > 0

// 泳池容积（m³）：矩形 长×宽×平均深；圆形 π×r²×深；输入非法（缺失/非数值/≤0）返回 null
function poolVolume(shape, dims) {
  const v = dims || {}
  if (shape === 'rect') {
    const l = Number(v.length), w = Number(v.width), d = Number(v.avgDepth)
    if (![l, w, d].every(isPositive)) return null
    return l * w * d
  }
  if (shape === 'circle') {
    const r = Number(v.radius), d = Number(v.depth)
    if (![r, d].every(isPositive)) return null
    return Math.PI * r * r * d
  }
  return null
}

// 投药量（g）= 容积(L) × 浓度变化(mg/L=ppm) ÷ 有效成分含量
// purity 为百分数（90 表示 90%）；容积/含量非法或浓度变化为负返回 null（变化为 0 返回 0）
function doseG(volumeL, deltaPpm, purity) {
  const V = Number(volumeL), dp = Number(deltaPpm), p = Number(purity)
  if (![V, dp, p].every(Number.isFinite)) return null
  if (V <= 0 || dp < 0 || p <= 0 || p > 100) return null
  return (V * dp / 1000) / (p / 100)
}

// pH 调节经验剂量区间：按容积与 pH 变化量，从「每 50 m³ 每变化 0.1 pH」的经验锚点线性折算
// 只做线性折算这一步数学，锚点本身为经验值，不做精确断言；输入非法返回 null
function phDoseRange(volumeM3, deltaPh, kind) {
  const adj = PH_ADJUSTERS[kind]
  const V = Number(volumeM3), dp = Math.abs(Number(deltaPh))
  if (!adj || ![V, dp].every(Number.isFinite) || V <= 0 || dp <= 0) return null
  const scale = (V / 50) * (dp / 0.1)
  return { name: adj.name, unit: adj.unit, low: scale * adj.low, high: scale * adj.high }
}

// 数字显示（非法返回 —）
function fmt(n, digits = 1) {
  return Number.isFinite(n) ? n.toFixed(digits) : '—'
}

// 重量显示：<1000 g 用克，≥1000 g 折公斤
function fmtWeight(grams) {
  if (!Number.isFinite(grams)) return '—'
  if (grams < 1000) return `${grams.toFixed(1)} g`
  return `${(grams / 1000).toFixed(2)} kg`
}

// ---------- 页面状态与交互 ----------
const poolShape = ref('rect')
const lengthM = ref(10)
const widthM = ref(5)
const avgDepthM = ref(1)
const radiusM = ref(2)
const depthM = ref(1.2)
const knownVolume = ref(0) // > 0 直接采用，0 表示按尺寸计算

const currentFc = ref(0.5)
const targetFc = ref(2)
const productId = ref('tcca')
const purityInput = ref(90)

const currentPh = ref(7)
const targetPh = ref(7.5)

const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 容积：优先用已知容积，否则按尺寸算；无效返回 null
const computedVolumeM3 = computed(() =>
  poolVolume(poolShape.value, { length: lengthM.value, width: widthM.value, avgDepth: avgDepthM.value, radius: radiusM.value, depth: depthM.value })
)
const volumeM3 = computed(() => {
  const k = Number(knownVolume.value)
  if (Number.isFinite(k) && k > 0) return k
  return computedVolumeM3.value
})
const volumeL = computed(() => (volumeM3.value === null ? null : volumeM3.value * L_PER_M3))

// 余氯剂量
const selectedProduct = computed(() => CHLORINE_PRODUCTS.find((p) => p.id === productId.value) || CHLORINE_PRODUCTS[0])
const purityValid = computed(() => Number.isFinite(purityInput.value) && purityInput.value > 0 && purityInput.value <= 100)
const fcDelta = computed(() => {
  const c = Number(currentFc.value), t = Number(targetFc.value)
  if (![c, t].every(Number.isFinite) || c < 0 || t < 0) return null
  return t - c
})
const selectedDoseG = computed(() => {
  if (volumeL.value === null || fcDelta.value === null || fcDelta.value <= 0 || !purityValid.value) return null
  return doseG(volumeL.value, fcDelta.value, purityInput.value)
})
const productComparison = computed(() => {
  const usable = volumeL.value !== null && fcDelta.value !== null && fcDelta.value > 0
  return CHLORINE_PRODUCTS.map((p) => ({
    ...p,
    grams: usable ? doseG(volumeL.value, fcDelta.value, p.purity) : null
  }))
})

// pH 调节
const phDelta = computed(() => {
  const c = Number(currentPh.value), t = Number(targetPh.value)
  if (![c, t].every(Number.isFinite) || c < 0 || c > 14 || t < 0 || t > 14) return null
  return t - c
})
const phDose = computed(() => {
  if (volumeM3.value === null || phDelta.value === null || Math.abs(phDelta.value) < 0.01) return null
  const kind = phDelta.value > 0 ? 'up' : 'down'
  return phDoseRange(volumeM3.value, phDelta.value, kind)
})

// 范围状态徽章
const statusBadgeClass = {
  low: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  ok: 'bg-green-500/10 text-green-600 border-green-500/30',
  high: 'bg-red-500/10 text-red-600 border-red-500/30'
}
const statusBadgeText = { low: '偏低', ok: '在范围内', high: '偏高' }
const fcStatus = computed(() => {
  const c = Number(currentFc.value)
  if (!Number.isFinite(c) || c < 0) return null
  if (c < FREE_CHLORINE_RANGE.min) return 'low'
  if (c > FREE_CHLORINE_RANGE.max) return 'high'
  return 'ok'
})
const phStatus = computed(() => {
  const c = Number(currentPh.value)
  if (!Number.isFinite(c) || c < 0 || c > 14) return null
  if (c < PH_RANGE.min) return 'low'
  if (c > PH_RANGE.max) return 'high'
  return 'ok'
})

// 药剂切换时带入该药剂的默认含量（仍可手改）
function applyProductPurity() {
  purityInput.value = selectedProduct.value.purity
}

onMounted(() => {
  addRecentTool('pool-chemical-calculator')
})
</script>
