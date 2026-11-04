<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <TreePine class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">木材材积计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">方木/板材体积与 board foot 换算、原木中央径法材积、薪炭材堆实积、含水率树种重量估算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线木材材积计算工具：方材板材按 厚×宽×长×根数 算立方米并换算北美 board feet；圆木原木给出小头直径法、中央直径法（Smalian）、圆台公式三种公开几何式并列结果与查算表；
        薪炭材按堆体积乘实积系数折实材；再按气干/生木/窑干含水率与树种绝干密度估算总重。林农备材、木材交易估价、加工厂下料、户外 DIY 均可用，全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <div class="flex items-start gap-2 p-3 rounded-lg bg-muted/60 border border-border text-xs leading-relaxed text-foreground mb-6">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>原木径级材积使用常用检尺公式（短径/长中径近似）；国标与地方原木材积表存在差异，交易结算请对照当地现行材积表与检尺规程。</span>
    </div>

    <!-- 模式切换 -->
    <div class="flex flex-wrap gap-2 mb-6">
      <button
        v-for="m in modes"
        :key="m.id"
        @click="activeMode = m.id"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5',
          activeMode === m.id
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
        ]"
      >
        <component :is="m.icon" class="w-4 h-4" />{{ m.label }}
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Ruler class="w-5 h-5 mr-2 text-primary" /> 输入尺寸
        </h2>

        <!-- 方材/板材 -->
        <div v-if="activeMode === 'timber'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2 text-foreground">长度单位</label>
            <div class="flex gap-2">
              <button
                v-for="u in unitDefs"
                :key="u.id"
                @click="timberUnit = u.id"
                :class="[
                  'px-3 py-1.5 rounded-lg text-sm transition',
                  timberUnit === u.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                {{ u.label }}
              </button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">厚度</label>
              <input v-model.number="tbThick" type="number" min="0" step="0.1" :class="inputCls" placeholder="如 5">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">宽度</label>
              <input v-model.number="tbWidth" type="number" min="0" step="0.1" :class="inputCls" placeholder="如 20">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">长度</label>
              <input v-model.number="tbLength" type="number" min="0" step="1" :class="inputCls" placeholder="如 400">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">根数 / 张数</label>
              <input v-model.number="tbCount" type="number" min="0" step="1" :class="inputCls" placeholder="如 100">
            </div>
          </div>
          <label class="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
            <input v-model="applyNominal" type="checkbox" class="mt-0.5 accent-primary">
            <span>Board foot 应用「名义厚度」规则：厚度不足 1 英寸（2.54 cm）的板材按 1 英寸计（北美行业惯例，且 BF 历来按粗锯名义尺寸报价，非刨光净尺寸）</span>
          </label>
        </div>

        <!-- 圆木/原木 -->
        <div v-if="activeMode === 'log'" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">小头短径 d（cm）</label>
              <input v-model.number="logSmall" type="number" min="0" step="1" :class="inputCls" placeholder="如 24">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">大头直径 D（cm，选填）</label>
              <input v-model.number="logBig" type="number" min="0" step="1" :class="inputCls" placeholder="如 32，不填则只出小头式">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">长度 L（m）</label>
              <input v-model.number="logLen" type="number" min="0" step="0.1" :class="inputCls" placeholder="如 4">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">根数</label>
              <input v-model.number="logCount" type="number" min="0" step="1" :class="inputCls" placeholder="如 1">
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            直径按 cm、长度按 m 输入；小头短径是检尺口径（椭圆的短轴）。不填大头时中央径法与圆台公式无法计算，重量卡按小头直径法体积估算。
          </p>
        </div>

        <!-- 薪炭材堆 -->
        <div v-if="activeMode === 'pile'" class="space-y-4">
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">堆长（m）</label>
              <input v-model.number="pileLen" type="number" min="0" step="0.1" :class="inputCls" placeholder="3">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">堆宽（m）</label>
              <input v-model.number="pileWid" type="number" min="0" step="0.1" :class="inputCls" placeholder="1.2">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">堆高（m）</label>
              <input v-model.number="pileHei" type="number" min="0" step="0.1" :class="inputCls" placeholder="1.5">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2 text-foreground">实积系数（空隙率 = 1 − 实积系数）</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="p in PILE_FACTORS"
                :key="p.id"
                @click="pilePresetId = p.id"
                :class="[
                  'px-3 py-1.5 rounded-lg text-sm transition',
                  pilePresetId === p.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                {{ p.label }}
              </button>
            </div>
            <div v-if="pilePresetId === 'custom'" class="mt-3">
              <label class="block text-xs font-medium mb-1 text-foreground">自定义实积系数（0–1）</label>
              <input v-model.number="pileCustomFactor" type="number" min="0" max="1" step="0.05" :class="inputCls">
            </div>
            <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
              整齐码放实测实积系数约 0.6–0.75，乱堆约 0.4–0.55；具体因木段长短、码放方式与粗细混杂程度而异，取值仅供参考。
            </p>
          </div>
        </div>

        <!-- 预设与重置 -->
        <div class="pt-2 border-t border-border space-y-2">
          <button
            v-for="p in examplePresets"
            :key="p.id"
            @click="applyPreset(p)"
            class="w-full px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-xs font-medium text-primary transition text-left flex items-center gap-1.5"
          >
            <Play class="w-3.5 h-3.5 flex-shrink-0" /> {{ p.label }}
          </button>
          <button
            @click="resetInputs"
            class="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置当前模式
          </button>
        </div>
      </div>

      <!-- 结果区（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 方材/板材结果 -->
        <div v-if="activeMode === 'timber'" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 方材 / 板材结果
          </h2>

          <div v-if="!timberResult" class="flex items-start gap-1.5 text-xs p-2.5 rounded bg-red-500/10 text-foreground">
            <TriangleAlert class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <span>请输入大于 0 的厚、宽、长与非负根数（当前组合非法，无法计算）。</span>
          </div>

          <template v-else>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div class="bg-primary/10 rounded-lg p-4">
                <p class="text-xs text-muted-foreground mb-1">总体积</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(timberResult.totalM3, 4) }} <span class="text-xs font-normal">m³</span></p>
                <p class="text-[10px] text-muted-foreground mt-1">{{ timberResult.count }} 根 × 单根 {{ fmt(timberResult.singleM3, 4) }} m³</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-xs text-muted-foreground mb-1">总板 feet（名义）</p>
                <p class="text-2xl font-bold text-foreground">{{ fmt(timberBfTotal, 1) }} <span class="text-xs font-normal">BF</span></p>
                <p class="text-[10px] text-muted-foreground mt-1">单根 {{ fmt(timberBfSingle, 2) }} BF · 1 ft = 12 in</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-xs text-muted-foreground mb-1">按体积直接换算</p>
                <p class="text-2xl font-bold text-foreground">{{ fmt(timberBfFromM3, 1) }} <span class="text-xs font-normal">BF</span></p>
                <p class="text-[10px] text-muted-foreground mt-1">1 m³ ≈ 423.78 BF（1 BF = 144 in³）</p>
              </div>
            </div>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>
                Board foot 按名义尺寸（粗锯）计：1 BF = 1 in × 12 in × 12 in = 144 in³ ≈ 2.36 L。勾选名义规则后不足 1 英寸厚的板材按 1 英寸计，
                因此「名义 BF」与「体积直算 BF」可能不同——前者是北美报价口径，后者是纯体积换算，两者都以 423.778 BF/m³ 为参照。
              </span>
            </p>
          </template>
        </div>

        <!-- 圆木/原木结果 -->
        <div v-if="activeMode === 'log'" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <TreePine class="w-5 h-5 mr-2 text-primary" /> 原木材积 · 三种公式并列
          </h2>

          <div v-if="!logResults" class="flex items-start gap-1.5 text-xs p-2.5 rounded bg-red-500/10 text-foreground">
            <TriangleAlert class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <span>请输入大于 0 的小头短径与长度（根数可为 0）。</span>
          </div>

          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div v-for="f in logResults.formulas" :key="f.name" class="bg-muted/50 border border-border rounded-lg p-4">
                <p class="text-sm font-medium text-foreground">{{ f.name }}</p>
                <p class="text-[10px] text-muted-foreground font-mono mt-0.5 mb-2">{{ f.formula }}</p>
                <p class="text-xl font-bold" :class="f.value === null ? 'text-muted-foreground' : 'text-primary'">
                  {{ f.value === null ? '需大头直径' : fmt(f.value, 4) }}<span v-if="f.value !== null" class="text-xs font-normal text-muted-foreground ml-0.5">m³/根</span>
                </p>
                <p class="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">{{ f.note }}</p>
              </div>
            </div>
            <div class="bg-primary/10 rounded-lg p-4 flex items-center justify-between text-sm">
              <span class="text-muted-foreground">按{{ logResults.primaryName }} · {{ logResults.count }} 根合计</span>
              <span class="text-lg font-bold text-primary">{{ fmt(logResults.totalM3, 4) }} m³</span>
            </div>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>
                三条均为公开几何近似式：小头直径法把原木当等径圆柱（偏保守、未计尖削与树皮）；中央径法（Smalian）取大小头平均直径，对抛物线形材近精确；
                圆台公式（Newton）把原木当正圆台，通常略偏大。去皮实积与检尺带皮体积之间还有系统偏差，交易请以当地现行材积表为准。
              </span>
            </p>
          </template>
        </div>

        <!-- 薪炭材堆结果 -->
        <div v-if="activeMode === 'pile'" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Scale class="w-5 h-5 mr-2 text-primary" /> 薪炭材堆结果
          </h2>

          <div v-if="!pileResult" class="flex items-start gap-1.5 text-xs p-2.5 rounded bg-red-500/10 text-foreground">
            <TriangleAlert class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <span>堆长宽高需大于 0，实积系数需在 0–1 之间。</span>
          </div>

          <template v-else>
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-xs text-muted-foreground mb-1">堆体积（外形）</p>
                <p class="text-2xl font-bold text-foreground">{{ fmt(pileResult.grossM3, 3) }} <span class="text-xs font-normal">m³</span></p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-xs text-muted-foreground mb-1">实积系数</p>
                <p class="text-2xl font-bold text-foreground">{{ pileResult.factor.toFixed(2) }}</p>
                <p class="text-[10px] text-muted-foreground mt-1">空隙率 ≈ {{ fmt(1 - pileResult.factor, 2) }}</p>
              </div>
              <div class="bg-primary/10 rounded-lg p-4">
                <p class="text-xs text-muted-foreground mb-1">实积（折材）</p>
                <p class="text-2xl font-bold text-primary">{{ fmt(pileResult.solidM3, 3) }} <span class="text-xs font-normal">m³</span></p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              实积 = 堆外形体积 × 实积系数。欧美薪材常用 cord（≈3.62 m³ 堆体积）等名义单位，同样按实积系数折材；本工具直接按米制堆尺寸计算，实测因码放而异。
            </p>
          </template>
        </div>

        <!-- 重量估算卡（各模式共用当前体积） -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Scale class="w-5 h-5 mr-2 text-primary" /> 重量估算
            <span class="ml-2 text-xs font-normal text-muted-foreground">体积口径：{{ activeVolumeLabel }}</span>
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">含水率档位（绝干基）</label>
              <select v-model="moistureId" :class="inputCls">
                <option v-for="m in MOISTURE_LEVELS" :key="m.id" :value="m.id">{{ m.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">树种（绝干密度经验值）</label>
              <select v-model="speciesId" :class="inputCls">
                <option v-for="s in SPECIES" :key="s.id" :value="s.id">{{ s.label }}（{{ s.density }} kg/m³）</option>
              </select>
            </div>
          </div>

          <div v-if="!weightResult" class="flex items-start gap-1.5 text-xs p-2.5 rounded bg-muted/60 text-muted-foreground">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>暂无有效材积（左侧输入非法或为 0），先算出体积再看重量。</span>
          </div>

          <template v-else>
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-xs text-muted-foreground mb-1">绝干物质</p>
                <p class="text-xl font-bold text-foreground">{{ fmt(weightResult.dryKg, 1) }} <span class="text-xs font-normal">kg</span></p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-xs text-muted-foreground mb-1">水分（{{ activeMoisture.mc }}%）</p>
                <p class="text-xl font-bold text-foreground">{{ fmt(weightResult.waterKg, 1) }} <span class="text-xs font-normal">kg</span></p>
              </div>
              <div class="bg-primary/10 rounded-lg p-4">
                <p class="text-xs text-muted-foreground mb-1">总重</p>
                <p class="text-xl font-bold text-primary">{{ fmt(weightResult.totalTon, 3) }} <span class="text-xs font-normal">吨</span></p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              总重 = 体积 × 绝干密度 × (1 + 含水率)，含水率为绝干基定义（水分重 ÷ 绝干重）。树种密度为常用经验值（松 500 / 杉木 350 / 橡木 750 / 桦木 700 / 桉木 800 kg/m³），
              实际因产地、树龄、部位与容重口径而异，估算载重/运费请留余量。
            </p>
          </template>
        </div>

        <!-- 原木材积快速查算表（仅原木模式） -->
        <div v-if="activeMode === 'log'" class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <TreePine class="w-5 h-5 mr-2 text-primary" /> 小头径 × 长度材积查算表
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-xs border-collapse">
              <thead>
                <tr class="bg-muted/60">
                  <th class="border border-border px-2 py-1.5 text-left font-semibold text-foreground">小头短径 (cm)</th>
                  <th v-for="l in LOG_TABLE_LENGTHS" :key="'h' + l" class="border border-border px-2 py-1.5 text-right font-semibold text-foreground">{{ l }} m</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in logTable" :key="'r' + row.d">
                  <td class="border border-border px-2 py-1.5 font-medium text-foreground">{{ row.d }}</td>
                  <td v-for="(c, i) in row.cells" :key="'c' + row.d + '-' + i" class="border border-border px-2 py-1.5 text-right font-mono text-muted-foreground">{{ c }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            表值由本工具小头直径公式 V = π/4·d²·L 现算生成（d 取 6–30 cm、步长 2 cm），<span class="font-medium text-foreground">非 GB 或地方原木材积表检尺值</span>；
            正式检尺表按径级/长度进舍规则统计编制且含尖削与树皮修正，两者差异可达 ±10% 以上，交易结算请对照当地现行材积表与检尺规程。
          </p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>木材材积计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          木材材积计算器覆盖三类典型场景：① 方材/板材——厚×宽×长×根数直接得立方米，并按北美口径换算 board feet（1 BF = 144 立方英寸，1 m³ ≈ 423.78 BF，
          不足 1 英寸厚的板按 1 英寸名义厚度计）；② 圆木/原木——输入小头短径、大头直径与长度，并列给出小头直径法、中央直径法（Smalian）、圆台公式（Newton）三种公开几何近似式的单根材积，
          附 6–30 cm × 2–6 m 的公式值查算表；③ 薪炭材——堆长×宽×高得堆体积，乘实积系数（整齐堆约 0.7、乱堆约 0.5）折成实积立方米。最后按含水率档位与树种绝干密度估算总重（绝干物质与水分分列）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">一立方米原木能出多少板材？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          行业经验出材率约 60%–70%：大径级、通直、少节疤的原木靠边锯切损耗低，可到 65%–70%；小径、弯曲或多节材常低于 60%。
          注意锯材报价多用名义尺寸（粗锯），刨光减量（S4S）后净体积更低；板皮、截头与锯末都不计入板材体积。所以下料前按 65% 中值估、开料后按实测名义体积核对，误差才不会吃掉利润。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Board foot 是什么？为什么北美进口材用它报价？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Board foot（板英尺，BF）是北美木材计量单位：1 BF = 1 英寸厚 × 12 英寸宽 × 1 英尺长 = 144 立方英寸 ≈ 2.360 升。
          1 立方米 ≈ 423.78 BF（1,000,000 cm³ ÷ 2359.737 cm³）。报价按名义尺寸而非刨光净尺寸，且板厚不足 1 英寸按 1 英寸计——这是历史习惯：早期制材以 1 英寸为最薄规格，
          因此 3/4 英寸的板也按 1 英寸收费。进口报价单上看到「$X / MBF」（千板英尺）时用本工具的 BF 换算即可对照立方米与单价。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么原木检尺要量小头短径？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          原木近似锥形，直径随位置连续变化，只有端面可重复测量；小头端面在吊装、堆放与检尺时最先暴露，量取成本最低且不易争议。
          断面常为椭圆，取短径（两轴中较小者）保证结果偏保守、口径统一。国标与地方材积表都以「小头径级 × 检尺长度」编列，径级按进舍规则归级（如 24.3 cm 归 24 cm 级），
          所以同一根木头检尺值与你的实测体积天然有差——这是制度口径差，不是谁量错了。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">气干、窑干、生木的含水率差多少重量？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          木材含水率按绝干基定义（水分重 ÷ 绝干重 × 100%）：窑干材约 8%、气干材约 15%、刚砍伐生木常达 40%–60%。
          以绝干密度 500 kg/m³ 的松木 1 m³ 为例：窑干约 540 kg、气干约 575 kg、按 50% 含水率的生木约 750 kg——生木到窑干可轻约 28%。
          这也是运输按生重计价、成材交易按气干/窑干重量或体积计价差别很大的原因；本工具重量卡可切换三档直接对比绝干物质与水分构成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">材积表和公式计算为什么有差？结算以哪个为准？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          几何公式（π/4·d²·L、中央径法、圆台式）假设树干是理想曲线体，且不含树皮带皮与梢端削头修正；检尺表则是在大量实测样木上按径级、长度回归统计编制的，
          隐含进舍规则（长度不足进位、径级归级）与地区树种调整系数，两者对单根木可差 5%–15%。交易结算以合同指定的现行材积表（国标或当地省标）与检尺规程为准，
          本工具公式值与查算表只用于预算、估价和下料参考。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">一立方米原木能出多少板材？</h3>
            <p class="text-sm text-muted-foreground mt-1">经验出材率约 60%–70%：大径通直少节可到 65%–70%，小径弯曲材常低于 60%。锯材按名义尺寸计体积，刨光（S4S）后净材更少，板皮、截头与锯末不计入出材。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">Board foot 怎么换算成立方米？</h3>
            <p class="text-sm text-muted-foreground mt-1">1 BF = 144 立方英寸 = 2359.737 cm³，所以 1 m³ ≈ 423.78 BF。北美按名义尺寸报价且不足 1 英寸厚按 1 英寸计，因此同样一块板的名义 BF 可能比实际体积换算值大，两种口径本页并列给出。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么原木检尺量小头短径？</h3>
            <p class="text-sm text-muted-foreground mt-1">原木呈锥形，只有端面直径可重复测量；小头最先暴露、量取成本最低，断面为椭圆时取短径使口径统一偏保守。材积表均按小头径级×检尺长度编列并带进舍规则。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">气干、窑干和生木重量差多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">含水率（绝干基）窑干约 8%、气干约 15%、生木 40%–60%。同体积下松木生木比窑干重约 39%，干燥后重量下降主要来自水分，本工具按树种绝干密度分解展示绝干物质与水分两部分。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">本工具的查算表能用于交易结算吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不能。表值由小头直径公式现算，非 GB 或地方原木材积表检尺值，与正式检尺可差 ±10% 以上。交易结算请对照合同指定的当地现行材积表与检尺规程，本工具适合预算、估价与下料参考。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'lumber-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  TreePine, Ruler, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Scale
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '木材材积计算器 - 方木原木板材体积与木材重量在线计算',
  description: '免费在线木材材积计算器，方木板材厚宽长算立方米并换算 board foot，原木小头短径中央径法圆台公式三种材积并列，薪炭材堆实积折算，含水率树种密度估总重，纯浏览器本地计算不上传',
  keywords: '木材材积计算,方木体积,原木立方米,板材 board foot,木材重量',
  author: '有条工具',
  ogTitle: '木材材积计算器 - 方木原木板材体积与木材重量在线计算 | 有条工具',
  ogDescription: '方木立方米与 board foot 换算、原木三种检尺近似公式并列、薪堆实积折算、含水率重量估算。',
  ogUrl: 'https://www.util.cn/tools/lumber-calculator',
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
          name: '木材材积计算器',
          url: 'https://www.util.cn/tools/lumber-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['方材板材立方米与根数合计', 'Board foot 名义厚度换算', '原木小头/中央径/圆台三公式并列', '小头径×长度材积查算表', '薪炭材堆实积系数折算', '含水率与树种密度重量估算', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '木材材积计算器', item: 'https://www.util.cn/tools/lumber-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '一立方米原木能出多少板材？',
              acceptedAnswer: { '@type': 'Answer', text: '经验出材率约60%-70%：大径通直少节可到65%-70%，小径弯曲材常低于60%。锯材按名义尺寸计体积，刨光（S4S）后净材更少，板皮、截头与锯末不计入出材。' }
            },
            {
              '@type': 'Question',
              name: 'Board foot 怎么换算成立方米？',
              acceptedAnswer: { '@type': 'Answer', text: '1 BF = 144立方英寸 = 2359.737 cm³，所以 1 m³ ≈ 423.78 BF。北美按名义尺寸报价且不足1英寸厚按1英寸计，因此名义BF可能比实际体积换算值大，本页两种口径并列给出。' }
            },
            {
              '@type': 'Question',
              name: '为什么原木检尺量小头短径？',
              acceptedAnswer: { '@type': 'Answer', text: '原木呈锥形，只有端面直径可重复测量；小头最先暴露、量取成本最低，断面为椭圆时取短径使口径统一偏保守。材积表均按小头径级×检尺长度编列并带进舍规则。' }
            },
            {
              '@type': 'Question',
              name: '气干、窑干和生木重量差多少？',
              acceptedAnswer: { '@type': 'Answer', text: '含水率（绝干基）窑干约8%、气干约15%、生木40%-60%。同体积下松木生木比窑干重约39%，重量差主要来自水分，工具按树种绝干密度分解展示绝干物质与水分。' }
            },
            {
              '@type': 'Question',
              name: '本工具的材积查算表能用于交易结算吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。表值由小头直径公式现算，非GB或地方原木材积表检尺值，与正式检尺可差±10%以上。交易结算请对照合同指定的当地现行材积表与检尺规程。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const PI_QUARTER = Math.PI / 4      // 0.7853981633974483
const CM3_PER_IN3 = 16.387064       // 1 立方英寸 = 16.387064 cm³（精确定义）
const BF_CM3 = 144 * CM3_PER_IN3    // 1 board foot = 144 in³ = 2359.737216 cm³
const BOARD_FEET_PER_M3 = 1e6 / BF_CM3 // ≈ 423.778445 BF / m³

const UNIT_TO_CM = { mm: 0.1, cm: 1, in: 2.54 }

function isPos(v) {
  return typeof v === 'number' && Number.isFinite(v) && v > 0
}

// 带单位数值 → 米（非法返回 null；允许 0 以便乘法自然失效）
function toMeters(value, unit) {
  const perCm = UNIT_TO_CM[unit]
  if (!perCm || typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null
  return (value * perCm) / 100
}

// 带单位数值 → 英寸
function toInches(value, unit) {
  const perCm = UNIT_TO_CM[unit]
  if (!perCm || typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null
  return (value * perCm) / 2.54
}

// 方材/板材：单根与总体积（m³）；厚宽高非法或根数非非负整数 → null
function squaredTimberVolume(thick, width, length, unit, count) {
  const t = toMeters(thick, unit)
  const w = toMeters(width, unit)
  const l = toMeters(length, unit)
  if (t === null || w === null || l === null) return null
  if (t <= 0 || w <= 0 || l <= 0) return null
  if (typeof count !== 'number' || !Number.isFinite(count) || count < 0) return null
  const n = Math.floor(count)
  const single = t * w * l
  return { singleM3: single, totalM3: single * n, count: n }
}

// 单块板 board feet：BF = 厚(in) × 宽(in) × 长(in) ÷ 144
// applyNominal=true 时执行名义厚度规则：不足 1 英寸按 1 英寸计
function boardFeetSingleIn(thickIn, widthIn, lengthIn, applyNominal) {
  if (!isPos(thickIn) || !isPos(widthIn) || !isPos(lengthIn)) return null
  const t = applyNominal && thickIn < 1 ? 1 : thickIn
  return (t * widthIn * lengthIn) / 144
}

// 立方米 → board feet（纯体积换算）
function cubicMetersToBoardFeet(m3) {
  if (typeof m3 !== 'number' || !Number.isFinite(m3) || m3 < 0) return null
  return m3 * BOARD_FEET_PER_M3
}

// 原木①小头直径法：V = π/4 · d² · L（d cm、L m）
function logVolumeSmallEnd(dSmallCm, lM) {
  const d = toMeters(dSmallCm, 'cm')
  if (d === null || d <= 0 || !isPos(lM)) return null
  return PI_QUARTER * d * d * lM
}

// 原木②中央径法（Smalian）：V = π/4 · ((D+d)/2)² · L
function logVolumeSmalian(dSmallCm, dBigCm, lM) {
  const d = toMeters(dSmallCm, 'cm')
  const D = toMeters(dBigCm, 'cm')
  if (d === null || D === null || d <= 0 || D <= 0 || !isPos(lM)) return null
  const dm = (D + d) / 2
  return PI_QUARTER * dm * dm * lM
}

// 原木③圆台公式（Newton）：V = π/12 · L · (D² + D·d + d²)
function logVolumeFrustum(dSmallCm, dBigCm, lM) {
  const d = toMeters(dSmallCm, 'cm')
  const D = toMeters(dBigCm, 'cm')
  if (d === null || D === null || d <= 0 || D <= 0 || !isPos(lM)) return null
  return (Math.PI / 12) * lM * (D * D + D * d + d * d)
}

// 小头径 × 长度公式值查算表：d 从 dStart 到 dEnd 步长 dStep， lengths 为长度数组
function buildLogVolumeTable(dStart, dEnd, dStep, lengths) {
  const rows = []
  for (let d = dStart; d <= dEnd; d += dStep) {
    rows.push({
      d,
      cells: lengths.map((l) => {
        const v = logVolumeSmallEnd(d, l)
        return v === null ? '—' : v.toFixed(4)
      })
    })
  }
  return rows
}

// 薪炭材堆：堆外形体积 × 实积系数 → 实积；系数须在 (0,1]
function pileSolidVolume(lenM, widM, heiM, solidFactor) {
  if (!isPos(lenM) || !isPos(widM) || !isPos(heiM)) return null
  if (typeof solidFactor !== 'number' || !Number.isFinite(solidFactor) || solidFactor <= 0 || solidFactor > 1) return null
  const gross = lenM * widM * heiM
  return { grossM3: gross, solidM3: gross * solidFactor, factor: solidFactor }
}

// 重量分解：总体积、绝干密度 kg/m³、绝干基含水率 % → 绝干/水分/总重
function weightBreakdown(volumeM3, densityKgM3, mcPercent) {
  if (typeof volumeM3 !== 'number' || !Number.isFinite(volumeM3) || volumeM3 <= 0) return null
  if (!isPos(densityKgM3)) return null
  if (typeof mcPercent !== 'number' || !Number.isFinite(mcPercent) || mcPercent < 0) return null
  const dryKg = volumeM3 * densityKgM3
  const waterKg = dryKg * (mcPercent / 100)
  return { dryKg, waterKg, totalKg: dryKg + waterKg, totalTon: (dryKg + waterKg) / 1000 }
}

// 展示格式化：null → '—'
function fmt(v, digits) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—'
  return v.toFixed(digits)
}

// ---------- 常量选项 ----------
const modes = [
  { id: 'timber', label: '方材 / 板材', icon: Ruler },
  { id: 'log', label: '圆木 / 原木', icon: TreePine },
  { id: 'pile', label: '薪炭材堆', icon: Scale }
]

const unitDefs = [
  { id: 'mm', label: '毫米 mm' },
  { id: 'cm', label: '厘米 cm' },
  { id: 'in', label: '英寸 inch' }
]

// 材积表列宽（米）——静态生成用
const LOG_TABLE_LENGTHS = [2, 3, 4, 5, 6]
const logTable = buildLogVolumeTable(6, 30, 2, LOG_TABLE_LENGTHS)

// 输入控件统一样式类
const inputCls = 'w-full px-3 py-2 border border-border rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'

const PILE_FACTORS = [
  { id: 'neat', label: '整齐堆 0.70', factor: 0.7 },
  { id: 'messy', label: '乱堆 0.50', factor: 0.5 },
  { id: 'custom', label: '自定义', factor: null }
]

const MOISTURE_LEVELS = [
  { id: 'kiln', label: '窑干 ≈8%', mc: 8 },
  { id: 'air', label: '气干 ≈15%', mc: 15 },
  { id: 'green', label: '生木 ≈50%', mc: 50 }
]

// 树种绝干密度为常用经验值（kg/m³），因产地树龄而异
const SPECIES = [
  { id: 'pine', label: '松木', density: 500 },
  { id: 'fir', label: '杉木', density: 350 },
  { id: 'oak', label: '橡木', density: 750 },
  { id: 'birch', label: '桦木', density: 700 },
  { id: 'eucalyptus', label: '桉木', density: 800 }
]

const defaultInputs = {
  timberUnit: 'cm', tbThick: 5, tbWidth: 20, tbLength: 400, tbCount: 100, applyNominal: true,
  logSmall: 24, logBig: 32, logLen: 4, logCount: 1,
  pileLen: 3, pileWid: 1.2, pileHei: 1.5, pilePresetId: 'neat', pileCustomFactor: 0.6,
  moistureId: 'air', speciesId: 'pine'
}

const examplePresets = [
  { id: 'preset-timber', label: '预设①：100 根 5×20×400 cm 方木 → 单根 0.04 m³ · 共 4 m³' },
  { id: 'preset-log', label: '预设②：原木 小头 24 / 大头 32 cm × 长 4 m（中央径法单根约 0.2463 m³）' }
]

// ---------- 页面状态 ----------
const activeMode = ref('timber')
const seoContentVisible = ref(true)

const timberUnit = ref(defaultInputs.timberUnit)
const tbThick = ref(defaultInputs.tbThick)
const tbWidth = ref(defaultInputs.tbWidth)
const tbLength = ref(defaultInputs.tbLength)
const tbCount = ref(defaultInputs.tbCount)
const applyNominal = ref(defaultInputs.applyNominal)

const logSmall = ref(defaultInputs.logSmall)
const logBig = ref(defaultInputs.logBig)
const logLen = ref(defaultInputs.logLen)
const logCount = ref(defaultInputs.logCount)

const pileLen = ref(defaultInputs.pileLen)
const pileWid = ref(defaultInputs.pileWid)
const pileHei = ref(defaultInputs.pileHei)
const pilePresetId = ref(defaultInputs.pilePresetId)
const pileCustomFactor = ref(defaultInputs.pileCustomFactor)

const moistureId = ref(defaultInputs.moistureId)
const speciesId = ref(defaultInputs.speciesId)

// ---------- 结果派生 ----------
const timberResult = computed(() =>
  squaredTimberVolume(tbThick.value, tbWidth.value, tbLength.value, timberUnit.value, tbCount.value)
)
const timberBfSingle = computed(() =>
  boardFeetSingleIn(
    toInches(tbThick.value, timberUnit.value),
    toInches(tbWidth.value, timberUnit.value),
    toInches(tbLength.value, timberUnit.value),
    applyNominal.value
  )
)
const timberBfTotal = computed(() =>
  timberBfSingle.value === null || timberResult.value === null
    ? null
    : timberBfSingle.value * timberResult.value.count
)
const timberBfFromM3 = computed(() =>
  timberResult.value === null ? null : cubicMetersToBoardFeet(timberResult.value.totalM3)
)

const logResults = computed(() => {
  const small = logVolumeSmallEnd(logSmall.value, logLen.value)
  const bigOk = isPos(logBig.value)
  const smalian = bigOk ? logVolumeSmalian(logSmall.value, logBig.value, logLen.value) : null
  const frustum = bigOk ? logVolumeFrustum(logSmall.value, logBig.value, logLen.value) : null
  if (small === null && smalian === null) return null
  const primaryName = smalian !== null ? '中央径法' : '小头直径法'
  const primary = smalian !== null ? smalian : small
  const n = Number.isFinite(logCount.value) && logCount.value >= 0 ? Math.floor(logCount.value) : 1
  return {
    formulas: [
      { name: '小头直径法', formula: 'V = π/4 · d² · L', value: small, note: '按小头短径等径圆柱近似，未计尖削，偏保守下限' },
      { name: '中央径法 (Smalian)', formula: 'V = π/4 · ((D+d)/2)² · L', value: smalian, note: '大小头平均直径，对抛物线形材近精确，常用参考口径' },
      { name: '圆台公式 (Newton)', formula: 'V = π/12 · L · (D²+D·d+d²)', value: frustum, note: '视作正圆台，通常略偏上限' }
    ],
    primaryName,
    primaryM3: primary,
    count: n,
    totalM3: primary === null ? null : primary * n
  }
})

const pileFactorValue = computed(() => {
  const p = PILE_FACTORS.find((x) => x.id === pilePresetId.value)
  if (!p) return null
  return p.id === 'custom' ? Number(pileCustomFactor.value) : p.factor
})
const pileResult = computed(() =>
  pileSolidVolume(pileLen.value, pileWid.value, pileHei.value, pileFactorValue.value)
)

// 当前模式供重量卡使用的体积
const activeVolumeM3 = computed(() => {
  if (activeMode.value === 'timber') return timberResult.value ? timberResult.value.totalM3 : null
  if (activeMode.value === 'log') return logResults.value && logResults.value.totalM3 > 0 ? logResults.value.totalM3 : null
  return pileResult.value ? pileResult.value.solidM3 : null
})
const activeVolumeLabel = computed(() => {
  if (activeMode.value === 'timber') return '方材总方'
  if (activeMode.value === 'log') return logResults.value ? `原木合计 · ${logResults.value.primaryName}` : '原木合计'
  return '薪堆实积'
})

const activeMoisture = computed(() => MOISTURE_LEVELS.find((m) => m.id === moistureId.value) || MOISTURE_LEVELS[0])
const activeSpecies = computed(() => SPECIES.find((s) => s.id === speciesId.value) || SPECIES[0])
const weightResult = computed(() =>
  weightBreakdown(activeVolumeM3.value, activeSpecies.value.density, activeMoisture.value.mc)
)

// ---------- 交互 ----------
function applyPreset(p) {
  if (p.id === 'preset-timber') {
    activeMode.value = 'timber'
    timberUnit.value = 'cm'
    tbThick.value = 5
    tbWidth.value = 20
    tbLength.value = 400
    tbCount.value = 100
    applyNominal.value = true
  } else if (p.id === 'preset-log') {
    activeMode.value = 'log'
    logSmall.value = 24
    logBig.value = 32
    logLen.value = 4
    logCount.value = 1
  }
}

function resetInputs() {
  if (activeMode.value === 'timber') {
    timberUnit.value = defaultInputs.timberUnit
    tbThick.value = defaultInputs.tbThick
    tbWidth.value = defaultInputs.tbWidth
    tbLength.value = defaultInputs.tbLength
    tbCount.value = defaultInputs.tbCount
    applyNominal.value = defaultInputs.applyNominal
  } else if (activeMode.value === 'log') {
    logSmall.value = defaultInputs.logSmall
    logBig.value = defaultInputs.logBig
    logLen.value = defaultInputs.logLen
    logCount.value = defaultInputs.logCount
  } else {
    pileLen.value = defaultInputs.pileLen
    pileWid.value = defaultInputs.pileWid
    pileHei.value = defaultInputs.pileHei
    pilePresetId.value = defaultInputs.pilePresetId
    pileCustomFactor.value = defaultInputs.pileCustomFactor
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('lumber-calculator')
})
</script>
