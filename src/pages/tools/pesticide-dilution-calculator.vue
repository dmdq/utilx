<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Bug class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">农药稀释倍数计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">稀释倍数、ppm 目标浓度、标签「克/亩有效成分」三种口径互算，背负式喷雾器一桶水加多少药直达答案</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线农药稀释倍数计算器：按「1 份药配 N 份水」的农技口径算倍数稀释（800 倍、1500 倍……15kg 一桶水即 18.75 g），
        支持 ppm 目标浓度与稀释倍数互推（1 ppm ≈ 1 mg/L，倍数 ≈ 100 万 ÷ ppm），并把农药标签上登记的「克/亩有效成分」落到最后一里——
        结合制剂含元率与亩用水量，直接算出每桶水应加多少克制剂；配药单可一键复制，含水与活元双口径。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面安全提示条（显著） -->
    <div class="mb-6 p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5">
      <TriangleAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <p class="text-sm leading-relaxed text-foreground font-medium">
        实际用药以农药标签登记剂量为准，本工具只做倍数与重量换算；配药戴手套口罩，严禁超剂量，注意安全间隔期。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Droplet class="w-5 h-5 mr-2 text-primary" /> 配药参数
        </h2>

        <!-- 模式切换 -->
        <div class="grid grid-cols-3 gap-1 p-1 bg-muted/60 rounded-lg">
          <button
            v-for="tab in modeTabs"
            :key="tab.id"
            @click="mode = tab.id"
            class="px-2 py-2 rounded-md text-xs font-medium transition"
            :class="mode === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
          >
            {{ tab.name }}
          </button>
        </div>

        <!-- 模式一：倍数稀释 -->
        <div v-if="mode === 'factor'" class="space-y-3">
          <div>
            <label for="pdc-mult" class="block text-sm font-medium text-foreground mb-1.5">稀释倍数（800 倍 = 1 份药配 800 份水）</label>
            <input id="pdc-mult" v-model="fac.mult" type="text" inputmode="decimal" placeholder="如 800" class="pdc-input" />
          </div>
          <div>
            <label for="pdc-water" class="block text-sm font-medium text-foreground mb-1.5">配液水量</label>
            <div class="flex gap-2 mb-1.5">
              <button
                v-for="chip in WATER_CHIPS"
                :key="chip.id"
                @click="applyWaterChip(chip)"
                class="flex-1 px-2 py-1.5 rounded-md border text-xs font-medium transition"
                :class="chip.active ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'"
              >
                {{ chip.label }}
              </button>
            </div>
            <div class="flex gap-2">
              <input id="pdc-water" v-model="fac.water" type="text" inputmode="decimal" placeholder="如 15" class="pdc-input" />
              <select v-model="fac.unit" class="pdc-select" aria-label="水量单位">
                <option value="kg">kg 水</option>
                <option value="L">L 水</option>
                <option value="桶">桶数</option>
              </select>
            </div>
            <div v-if="fac.unit === '桶'" class="mt-2">
              <label for="pdc-tankkg" class="block text-xs text-muted-foreground mb-1">每桶装水（背负式喷雾器规格）</label>
              <select id="pdc-tankkg" v-model="fac.tankKg" class="pdc-input" aria-label="每桶水量">
                <option v-for="t in TANK_OPTIONS" :key="'f' + t" :value="String(t)">{{ t }} kg/桶</option>
              </select>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">药量 = 水量 ÷ 倍数（水的密度按 1 kg/L 计）；结果同时给出 g/mL、瓶盖粗估与对应 ppm。</p>
        </div>

        <!-- 模式二：ppm 目标 -->
        <div v-else-if="mode === 'ppm'" class="space-y-3">
          <div>
            <label for="pdc-ppm" class="block text-sm font-medium text-foreground mb-1.5">目标浓度 ppm（1 ppm ≈ 1 mg/L）</label>
            <input id="pdc-ppm" v-model="ppm.ppm" type="text" inputmode="decimal" placeholder="如 667（≈1500 倍）" class="pdc-input" />
          </div>
          <div>
            <label for="pdc-ppmwater" class="block text-sm font-medium text-foreground mb-1.5">水量</label>
            <div class="flex gap-2">
              <input id="pdc-ppmwater" v-model="ppm.water" type="text" inputmode="decimal" placeholder="如 15" class="pdc-input" />
              <select v-model="ppm.unit" class="pdc-select" aria-label="水量单位">
                <option value="kg">kg</option>
                <option value="L">L</option>
              </select>
            </div>
          </div>
          <div>
            <label for="pdc-ppmcontent" class="block text-sm font-medium text-foreground mb-1.5">制剂含元率 %（按纯品兑药填 100）</label>
            <input id="pdc-ppmcontent" v-model="ppm.content" type="text" inputmode="decimal" placeholder="如 100 / 25" class="pdc-input" />
          </div>
          <p class="text-xs text-muted-foreground">ppm 按「纯有效成分」计：制剂含元 25% 时实际加药量 ×4；倍数与 ppm 换算：倍数 ≈ 100 万 ÷ ppm（1500 倍 ≈ 667 ppm）。</p>
        </div>

        <!-- 模式三：有效成分剂量 -->
        <div v-else class="space-y-3">
          <div>
            <label for="pdc-aicontent" class="block text-sm font-medium text-foreground mb-1.5">制剂含量 %（如 25% 吡虫啉可湿粉填 25）</label>
            <input id="pdc-aicontent" v-model="ai.content" type="text" inputmode="decimal" placeholder="如 25" class="pdc-input" />
          </div>
          <div>
            <label for="pdc-aipermu" class="block text-sm font-medium text-foreground mb-1.5">标签亩用量（有效成分，g/亩）</label>
            <input id="pdc-aipermu" v-model="ai.perMu" type="text" inputmode="decimal" placeholder="如 6" class="pdc-input" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="pdc-muwater" class="block text-sm font-medium text-foreground mb-1.5">亩用水量 kg</label>
              <select id="pdc-muwater" v-model="ai.muWater" class="pdc-input" aria-label="亩用水量">
                <option v-for="w in MU_WATER_OPTIONS" :key="'mw' + w" :value="String(w)">{{ w }} kg</option>
              </select>
            </div>
            <div>
              <label for="pdc-aitank" class="block text-sm font-medium text-foreground mb-1.5">每桶水量 kg</label>
              <select id="pdc-aitank" v-model="ai.tank" class="pdc-input" aria-label="每桶水量">
                <option v-for="t in TANK_OPTIONS" :key="'at' + t" :value="String(t)">{{ t }} kg</option>
              </select>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">标签登记的是「克有效成分/亩」；先除以含元率折成制剂克/亩，再除以亩桶数（亩水 ÷ 桶水）落到每桶加药——这是农户最容易差的最后一公里。</p>
        </div>

        <!-- 预设 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">常见场景预设</p>
          <div class="space-y-2">
            <button
              v-for="p in presetDefs"
              :key="p.id"
              @click="applyPreset(p.id)"
              class="w-full px-3 py-2 bg-muted/60 hover:bg-muted border border-border rounded-lg text-xs font-medium text-foreground transition flex items-center gap-2 text-left"
            >
              <Play class="w-3.5 h-3.5 text-primary flex-shrink-0" /> {{ p.label }}
            </button>
          </div>
        </div>

        <button
          @click="resetInputs"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
        >
          <RefreshCw class="w-4 h-4" /> 恢复默认参数
        </button>
      </div>

      <!-- 右：结果面板 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Droplet class="w-5 h-5 mr-2 text-primary" /> 配药结果
          </h2>

          <!-- 倍数稀释结果 -->
          <div v-if="mode === 'factor'" class="space-y-4">
            <p v-if="!factorResult.ok" class="text-sm text-red-500 flex items-start gap-1.5">
              <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ factorResult.error }}
            </p>
            <template v-else>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="bg-primary/10 rounded-lg p-4 text-center">
                  <p class="text-xs text-muted-foreground mb-1">应加药剂</p>
                  <p class="text-3xl font-bold text-primary">{{ factorResult.doseText }}</p>
                </div>
                <div class="bg-muted/50 rounded-lg p-4 text-center">
                  <p class="text-xs text-muted-foreground mb-1">约合体积 / 瓶盖</p>
                  <p class="text-xl font-bold text-foreground">{{ factorResult.mlText }}</p>
                  <p class="text-xs text-muted-foreground mt-1">{{ factorResult.capsText }}</p>
                </div>
                <div class="bg-muted/50 rounded-lg p-4 text-center">
                  <p class="text-xs text-muted-foreground mb-1">对应浓度</p>
                  <p class="text-xl font-bold text-foreground">{{ factorResult.ppmText }} ppm</p>
                  <p class="text-xs text-muted-foreground mt-1">{{ factorResult.totalText }}</p>
                </div>
              </div>
              <p class="text-sm text-foreground">
                口径：{{ factorResult.multText }} 倍 = 1 份药配 {{ factorResult.multText }} 份水，{{ factorResult.waterText }} 兑入后混匀即可。
                若标签按「1:{{ factorResult.multText }} 兑至总体积」口径，药量仅差约 0.1%，量杯称不出这个差别，按本结果配即可。
              </p>
            </template>
          </div>

          <!-- ppm 结果 -->
          <div v-else-if="mode === 'ppm'" class="space-y-4">
            <p v-if="!ppmResult.ok" class="text-sm text-red-500 flex items-start gap-1.5">
              <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ ppmResult.error }}
            </p>
            <template v-else>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="bg-primary/10 rounded-lg p-4 text-center">
                  <p class="text-xs text-muted-foreground mb-1">应加制剂</p>
                  <p class="text-3xl font-bold text-primary">{{ ppmResult.prepText }}</p>
                </div>
                <div class="bg-muted/50 rounded-lg p-4 text-center">
                  <p class="text-xs text-muted-foreground mb-1">折合有效成分</p>
                  <p class="text-xl font-bold text-foreground">{{ ppmResult.pureText }}</p>
                </div>
                <div class="bg-muted/50 rounded-lg p-4 text-center">
                  <p class="text-xs text-muted-foreground mb-1">相当于稀释</p>
                  <p class="text-xl font-bold text-foreground">≈ {{ ppmResult.factorText }} 倍</p>
                </div>
              </div>
              <p class="text-sm text-foreground">
                {{ ppmResult.waterText }} 水中配成 {{ ppmResult.ppmTextShow }} ppm 纯药液，需要 {{ ppmResult.pureText }} 纯有效成分；按 {{ ppmResult.contentText }}% 含量折成制剂即 {{ ppmResult.prepText }}。
              </p>
            </template>
          </div>

          <!-- 有效成分剂量结果 -->
          <div v-else class="space-y-4">
            <p v-if="!aiResult.ok" class="text-sm text-red-500 flex items-start gap-1.5">
              <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ aiResult.error }}
            </p>
            <template v-else>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="bg-primary/10 rounded-lg p-4 text-center">
                  <p class="text-xs text-muted-foreground mb-1">制剂用量</p>
                  <p class="text-3xl font-bold text-primary">{{ aiResult.prepPerMuText }}</p>
                  <p class="text-xs text-muted-foreground mt-1">每亩</p>
                </div>
                <div class="bg-muted/50 rounded-lg p-4 text-center">
                  <p class="text-xs text-muted-foreground mb-1">每亩桶数</p>
                  <p class="text-xl font-bold text-foreground">{{ aiResult.bucketsText }} 桶</p>
                  <p class="text-xs text-muted-foreground mt-1">{{ aiResult.muWaterText }} ÷ {{ aiResult.tankText }}</p>
                </div>
                <div class="bg-muted/50 rounded-lg p-4 text-center">
                  <p class="text-xs text-muted-foreground mb-1">每桶加药</p>
                  <p class="text-xl font-bold text-foreground">{{ aiResult.perTankText }}</p>
                  <p class="text-xs text-muted-foreground mt-1">实际打药照此配</p>
                </div>
              </div>
              <p class="text-sm text-foreground">
                标签口径 {{ aiResult.aiPerMuText }} ÷ {{ aiResult.contentText }}% 含量 = 制剂 {{ aiResult.prepPerMuText }}/亩；
                再按亩用水 {{ aiResult.muWaterText }} 分 {{ aiResult.bucketsText }} 桶，每桶加 {{ aiResult.perTankText }}。打药前对照水量，别把三桶药当成一桶的量。
              </p>
            </template>
          </div>

          <!-- 复制配药单 -->
          <div class="flex flex-wrap gap-2 items-center pt-2 border-t border-border">
            <button
              @click="copyMixSheet"
              :disabled="!mixText"
              class="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle v-if="copied" class="w-4 h-4" />
              <Copy v-else class="w-4 h-4" />
              {{ copied ? '已复制配药单' : '复制配药单' }}
            </button>
            <p class="text-xs text-muted-foreground">配药单含药量、瓶盖参照与二次稀释口诀，可发到种植群或抄在桶上。</p>
          </div>
        </div>

        <!-- 换算参照卡（静态 + 联动） -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 亩用药量与瓶盖参照
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">每桶（15kg）加药</p>
              <p class="text-lg font-bold text-foreground">{{ tank15Text }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">约合矿泉水瓶盖</p>
              <p class="text-lg font-bold text-foreground">{{ caps15Text }}</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">1 盖 ≈ 5 g · 粗估</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">约合体积（水剂）</p>
              <p class="text-lg font-bold text-foreground">{{ ml15Text }}</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">按密度 ≈1 g/mL 粗估</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border border-border rounded-lg overflow-hidden">
              <thead>
                <tr class="bg-muted/60 text-xs text-muted-foreground">
                  <th class="px-3 py-2 text-left font-medium">背负机每亩桶数</th>
                  <th class="px-3 py-2 text-left font-medium">亩用水量</th>
                  <th class="px-3 py-2 text-left font-medium">折亩用制剂</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in conversionRows" :key="row.buckets" class="border-t border-border">
                  <td class="px-3 py-2 font-medium text-foreground">{{ row.buckets }} 桶/亩</td>
                  <td class="px-3 py-2 font-mono text-muted-foreground">{{ row.muWaterText }}</td>
                  <td class="px-3 py-2 font-mono text-foreground">{{ row.muDoseText }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="!conversionRows.length" class="text-xs text-muted-foreground">先在上方填出合法参数，这里联动折亩。</p>
        </div>

        <!-- 二次稀释法（静态三步） -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Droplet class="w-5 h-5 mr-2 text-primary" /> 二次稀释法：先小杯化开再倒满桶
          </h2>
          <ol class="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li v-for="(step, i) in SECOND_MIX_STEPS" :key="'sm' + i">{{ step }}</li>
          </ol>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>农药稀释倍数计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          农药稀释倍数计算器是面向种植户、基层农技员与果园菜农的在线配比工具。它把打药配液常见的三种口径放在一张页面上互算：
          按「1 份药配 N 份水」的倍数稀释（背负式喷雾器 15kg 一桶水、800 倍即 18.75 g）、按 ppm 目标浓度反推加药量（1 ppm ≈ 1 mg/L）、
          以及把农药标签登记的「克有效成分/亩」结合制剂含元率与亩用水量，落到每桶水加多少克制剂——这是标签口径到喷雾器口径的最后一公里。
          结果同时给出 g、mL 与矿泉水瓶盖（≈5 g/盖，粗估）三种参照，配药单可一键复制。全部计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">稀释倍数是什么意思？1:800 和 800 倍有区别吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          农业推广口径的「800 倍」= 1 份药剂配 800 份水，药量 = 水量 ÷ 800：15 kg 一桶水即 15000 ÷ 800 = 18.75 g。
          数学记法「1:800」严格说是 1 份药剂配成 800 份总体积（药 + 水），15 kg 总液需 18.73 g 药——两者只差 1/801，约 0.1%。
          量杯和杆秤称不出这个差别，配药时按哪个口径结果都一样；但读配方时要留意作者用的是哪种记法。本工具按「水 ÷ 倍数」口径计算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么要二次稀释（先小杯化开）？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          农药用量一小杯都嫌多，直接倒进整桶水里既倒不干净、也化不开：可湿性粉剂会结团漂浮，悬浮剂、乳油会挂壁成缕。
          农技推广的标准做法是「二次稀释法」——先用少量清水在杯中把药搅成均匀母液，再倒入装有半桶水的喷雾器搅匀，最后定容并用药液冲洗杯子 2-3 次并入桶。
          这样每桶浓度均匀一致，避免前半桶浓、后半桶淡造成的药害与防效不稳。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">标签写「克/亩」还是「克/桶」？哪个才是登记口径？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          农药标签登记的是「有效成分克/亩」（如 25% 噻虫嗪每亩用有效成分 6 g，即制剂 24 g/亩），并不规定你分几桶喷完。
          「克/桶」是把亩用量按你的实际亩用水量摊出来的：亩用水 45 kg、15 kg 一桶，就是 3 桶/亩 → 每桶 8 g。
          所以同一张标签，大水漫喷和低容量喷雾算出的每桶加药不一样——本工具用模式三按你的桶规格重新摊，换喷头、换机型后务必重算。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">ppm 和稀释倍数怎么对应？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          水的密度 ≈ 1 kg/L，所以 1 ppm ≈ 1 mg/L ≈ 1 g/吨水。稀释倍数与 ppm 的近似换算：ppm ≈ 100 万 ÷ 倍数。
          常用对应：500 倍 = 2000 ppm、800 倍 = 1250 ppm、1000 倍 = 1000 ppm、1500 倍 ≈ 667 ppm、5000 倍 = 200 ppm。
          文献、说明书出现 ppm 时（尤其无激素、微肥、植物生长调节剂），切到 ppm 模式直接算，页面还会反向标出相当于多少倍。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">安全间隔期是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一句话：安全间隔期 = 最后一次施药到采收之间必须等待的天数（标签上登记，如 7 天、14 天），不到天数采收就是农药残留超标；倍数配得再准，也不代表可以提前摘。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">800 倍稀释，一桶 15 公斤水到底加几克药？</h3>
            <p class="text-sm text-muted-foreground mt-1">15 kg 水 ÷ 800 = 18.75 g，约 18.8 克（水剂约 18.8 mL，粗估 3-4 瓶盖矿泉水盖）。选「倍数稀释」模式填 800 与 15kg 即得；先小杯母液化开再定容混匀。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">稀释倍数和 ppm 怎么换算？</h3>
            <p class="text-sm text-muted-foreground mt-1">按水的密度 ≈1 kg/L，ppm ≈ 100 万 ÷ 稀释倍数：1500 倍 ≈ 667 ppm，800 倍 = 1250 ppm。本工具 ppm 模式按 1 ppm = 1 mg/L 计，输入目标 ppm 与水量直接出加药克数，并按含元率折成制剂。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">标签写每亩用有效成分 6 克，喷雾器里该加多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">先除以制剂含量：25% 噻虫嗪 → 制剂 24 g/亩；再按你实际亩用水量摊桶：背负机大水每亩 45 kg 水、15 kg 一桶即 3 桶 → 每桶加 8 g。亩用水 30 kg 就只分 2 桶、每桶 12 g——每桶克数随水量变，亩总克数不变。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么药要先在杯子里化开，不能直接倒桶里？</h3>
            <p class="text-sm text-muted-foreground mt-1">几克药倒进 15 公斤水倒不匀也冲不净：粉剂结团、乳油挂壁，前半桶浓后半桶淡，轻则防效差、重则局部药害。二次稀释（小杯母液 → 半桶水搅匀 → 定容并冲洗杯子并入）是农技推广的标准配药法。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pesticide-dilution-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Bug, Droplet, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '农药稀释倍数计算器 - 打药一桶水加多少药/倍数ppm克每亩换算工具',
  description: '免费在线农药稀释倍数计算器：800倍1500倍倍数稀释一桶水加药量、ppm与倍数互推、标签克/亩有效成分折每桶加药，背负式喷雾器15kg预设与瓶盖参照，配药单一键复制，纯浏览器本地计算不上传',
  keywords: '农药稀释倍数,打药一桶水加多少药,倍数换算 ppm,农药配比计算,背负式喷雾器用水量',
  author: '有条工具',
  ogTitle: '农药稀释倍数计算器 - 打药一桶水加多少药/倍数ppm克每亩换算工具 | 有条工具',
  ogDescription: '倍数稀释、ppm 目标、标签克/亩三种口径互算，直接给出每桶水加药克数与二次稀释步骤。',
  ogUrl: 'https://www.util.cn/tools/pesticide-dilution-calculator',
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
          name: '农药稀释倍数计算器',
          url: 'https://www.util.cn/tools/pesticide-dilution-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['倍数稀释每桶加药速算', 'ppm 与稀释倍数互推', '标签克/亩折每桶加药', '15kg/16L 背负喷雾器预设', 'g/mL/瓶盖生活参照', '二次稀释法步骤与配药单复制']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '农药稀释倍数计算器', item: 'https://www.util.cn/tools/pesticide-dilution-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '800 倍稀释，一桶 15 公斤水加几克药？',
              acceptedAnswer: { '@type': 'Answer', text: '15 kg 水 ÷ 800 = 18.75 g，约 18.8 克（水剂约 18.8 mL，粗估 3-4 矿泉水瓶盖）。选倍数稀释模式填 800 与 15kg 即得；先小杯母液化开再定容混匀。' }
            },
            {
              '@type': 'Question',
              name: '稀释倍数和 ppm 怎么换算？',
              acceptedAnswer: { '@type': 'Answer', text: '按水的密度≈1 kg/L，ppm ≈ 100 万 ÷ 稀释倍数：1500 倍 ≈ 667 ppm，800 倍 = 1250 ppm。本工具 ppm 模式按 1 ppm = 1 mg/L 直接算加药克数，并可按制剂含元率折成制剂用量。' }
            },
            {
              '@type': 'Question',
              name: '标签写每亩用有效成分 6 克，喷雾器里该加多少？',
              acceptedAnswer: { '@type': 'Answer', text: '先除以制剂含量：25% 噻虫嗪折合制剂 24 g/亩；再按实际亩用水量摊桶：亩用水 45 kg、15 kg 一桶即 3 桶，每桶加 8 g。亩用水变少桶数变少，每桶克数随水量变，亩总克数不变。' }
            },
            {
              '@type': 'Question',
              name: '为什么药要先在杯子里化开，不能直接倒桶里？',
              acceptedAnswer: { '@type': 'Answer', text: '几克药倒进 15 公斤水倒不匀也冲不净：粉剂结团、乳油挂壁，前半桶浓后半桶淡，轻则防效差、重则局部药害。二次稀释（小杯母液→半桶水搅匀→定容并冲洗杯子并入）是农技推广的标准配药法。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const CAP_G = 5        // 矿泉水瓶盖 ≈5 g/盖（生活参照，粗估）
const TANK_KG = 15     // 背负式喷雾器一桶水常用 15 kg
const PPM_BASE = 1e6   // ppm ↔ 倍数桥：ppm = 100万 ÷ 倍数（1500 倍 ≈ 667 ppm，水的密度按 1 kg/L）

// 宽松数值解析：接受 "15" / "800" / "1,500"（千分位逗号容错）
function toNum(raw) {
  const s = String(raw == null ? '' : raw).trim().replace(/,/g, '')
  if (!s) return NaN
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

// 小数尾零裁剪：18.80 → 18.8；8.00 → 8
function trimNum(x, digits) {
  let s = x.toFixed(digits)
  if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '')
  return s
}

// 药量显示：≥1000 g 折 kg；18.75 g → "18.8 g"；200 g → "200 g"
function fmtDose(g) {
  const v = toNum(g)
  if (!Number.isFinite(v) || v < 0) return '—'
  if (v >= 1000) return `${trimNum(Math.round((v / 1000) * 1000) / 1000, 2)} kg`
  if (v >= 100) return `${Math.round(v)} g`
  if (v >= 10) return `${trimNum(v, 1)} g`
  return `${trimNum(v, 2)} g`
}

// 数量显示（1 位小数去尾零）：3 → "3"；18.75 → "18.8"
function fmt1(x) {
  const v = toNum(x)
  return Number.isFinite(v) ? trimNum(v, 1) : '—'
}

// 整数显示：666.7 → "667"
function fmtInt(x) {
  const v = toNum(x)
  return Number.isFinite(v) ? String(Math.round(v)) : '—'
}

// 水量统一折成 kg：kg/L 按水密度 1:1；桶数 × 每桶水量
function waterToKg(raw, unit, tankKgRaw) {
  const v = toNum(raw)
  if (!Number.isFinite(v) || v <= 0) return NaN
  if (unit === 'kg' || unit === 'L') return v
  if (unit === '桶') {
    const t = toNum(tankKgRaw)
    return Number.isFinite(t) && t > 0 ? v * t : NaN
  }
  return NaN
}

// 倍数稀释核心：倍数含义 = 1 份药剂 : N 份水 → 药量(g) = 水量(kg)×1000 ÷ 倍数
// 15 kg 一桶水 800 倍 = 18.75 g；300 kg 水 1500 倍 = 200 g（水 ÷ 倍数口径）
function factorDose(waterKg, factor) {
  const w = toNum(waterKg)
  const m = toNum(factor)
  if (!Number.isFinite(w) || w <= 0) return { ok: false, error: '水量无效：请填写大于 0 的水量（kg 或 L）' }
  if (!Number.isFinite(m)) return { ok: false, error: '稀释倍数需为数字（如 800、1500，只填倍数本身）' }
  if (m <= 1) return { ok: false, error: '稀释倍数需大于 1：800 倍即 1 份药剂配 800 份水' }
  if (m < 20) return { ok: false, error: '倍数低于 20 已属极浓配方，请核对标签——多半是把「药:水」比例误填成了倍数' }
  return { ok: true, waterKg: w, factor: m, doseG: (w * 1000) / m, ppm: PPM_BASE / m }
}

// 倍数 → ppm：1500 倍 ≈ 666.7 ppm（近似式 100万 ÷ 倍数，忽略药剂自身体积）
function factorToPpm(factor) {
  const m = toNum(factor)
  if (!Number.isFinite(m) || m <= 1) return NaN
  return PPM_BASE / m
}

// ppm → 倍数：667 ppm ≈ 1499（按 1 倍 = 1e6 ppm 桥换算）
function ppmToFactor(ppm) {
  const p = toNum(ppm)
  if (!Number.isFinite(p) || p <= 0) return NaN
  return PPM_BASE / p
}

// ppm 目标核心：1 ppm ≈ 1 mg/L ≈ 1 g/吨水 → 纯药 g = ppm×水量kg÷1000；制剂 g = 纯药 ÷ 含元率
function ppmDose(ppm, waterKg, content) {
  const p = toNum(ppm)
  const w = toNum(waterKg)
  const c = toNum(content)
  if (!Number.isFinite(p) || p <= 0) return { ok: false, error: '目标浓度 ppm 需为大于 0 的数字' }
  if (!Number.isFinite(w) || w <= 0) return { ok: false, error: '水量无效：请填写大于 0 的水量（kg 或 L）' }
  if (!Number.isFinite(c) || c <= 0 || c > 100) return { ok: false, error: '制剂含元率需在 0 - 100 之间：按纯品兑药填 100，25% 悬浮剂填 25' }
  const pureG = (p * w) / 1000
  return { ok: true, ppm: p, waterKg: w, content: c, pureG, prepG: pureG / (c / 100), factor: PPM_BASE / p }
}

// 有效成分剂量核心（标签口径 → 喷雾器口径）：
// 制剂 g/亩 = 亩用有效成分 ÷ 含元率；亩桶数 = 亩用水量 ÷ 每桶水量；每桶加药 = 制剂 g/亩 ÷ 亩桶数
// 例：25% 噻虫嗪、亩用元 6 g、亩水 45 kg、桶 15 kg → 制剂 24 g/亩、3 桶/亩、每桶 8 g
function aiDose(content, perMuAi, muWater, tank) {
  const c = toNum(content)
  const ai = toNum(perMuAi)
  const mw = toNum(muWater)
  const tk = toNum(tank)
  if (!Number.isFinite(c) || c <= 0 || c > 100) return { ok: false, error: '制剂含量需在 0 - 100 之间（如 25% 填 25）' }
  if (!Number.isFinite(ai) || ai <= 0) return { ok: false, error: '亩用有效成分需为大于 0 的数字（标签上的「克/亩」）' }
  if (!Number.isFinite(mw) || mw <= 0) return { ok: false, error: '亩用水量需为大于 0 的数字（背负大水常用 30 - 60 kg）' }
  if (!Number.isFinite(tk) || tk <= 0) return { ok: false, error: '每桶水量需为大于 0 的数字（15 / 16 / 20 kg）' }
  const prepPerMu = (ai * 100) / c
  const buckets = mw / tk
  return { ok: true, content: c, perMuAi: ai, muWater: mw, tank: tk, prepPerMu, buckets, perTank: prepPerMu / buckets }
}

// 瓶盖粗估：1 矿泉水盖 ≈ 5 g；非法返回 NaN
function capsOf(grams) {
  const g = toNum(grams)
  if (!Number.isFinite(g) || g < 0) return NaN
  return g / CAP_G
}

// g → mL：按密度粗估（水剂 ≈1，默认 1）
function mlOf(grams, density) {
  const g = toNum(grams)
  const d = toNum(density)
  if (!Number.isFinite(g) || g < 0) return NaN
  if (!Number.isFinite(d) || d <= 0) return g
  return g / d
}

// 每桶加药 × 每亩桶数 = 折亩用制剂
function perMuFromTank(perTank, buckets) {
  const p = toNum(perTank)
  const b = toNum(buckets)
  if (!Number.isFinite(p) || !Number.isFinite(b) || p < 0 || b <= 0) return NaN
  return p * b
}

// 15 kg 基准桶药量（倍数口径）：800 倍 → 18.75 g
function bucketDoseFromFactor(factor) {
  const r = factorDose(TANK_KG, factor)
  return r.ok ? r.doseG : NaN
}

// ---------- 页面状态 ----------
const mode = ref('factor')
const modeTabs = [
  { id: 'factor', name: '倍数稀释' },
  { id: 'ppm', name: 'ppm 目标' },
  { id: 'ai', name: '有效成分' }
]

const DEFAULTS = {
  fac: { mult: '800', water: '15', unit: 'kg', tankKg: '15' },
  ppm: { ppm: '667', water: '15', unit: 'kg', content: '100' },
  ai: { content: '25', perMu: '6', muWater: '45', tank: '15' }
}

const fac = reactive({ ...DEFAULTS.fac })
const ppm = reactive({ ...DEFAULTS.ppm })
const ai = reactive({ ...DEFAULTS.ai })

const TANK_OPTIONS = [15, 16, 20]
const MU_WATER_OPTIONS = [30, 35, 40, 45, 50, 55, 60]
const BUCKETS_PER_MU = [2, 3, 4]
const SECOND_MIX_STEPS = [
  '第一步·化母液：小杯或量杯里先放少量清水，倒入称好的药剂，搅成均匀无疙瘩的糊状母液。',
  '第二步·入半桶：喷雾器先装约半桶清水，把母液缓缓倒入并边倒边搅拌，让药液散开。',
  '第三步·定容冲洗：加满水到所需量，再用清水把杯子和量具冲洗 2-3 次全部倒入桶中，盖盖摇匀后开喷。'
]

const seoContentVisible = ref(true)
const copied = ref(false)
let copyTimer = null

// 水量快捷片（当前参数命中时高亮）
const WATER_CHIPS = computed(() => {
  const hit = (water, unit, tankKg) => fac.water === water && fac.unit === unit && (!tankKg || fac.tankKg === tankKg)
  return [
    { id: 'w15', label: '15kg 背负', water: '15', unit: 'kg', tankKg: null, active: hit('15', 'kg', null) },
    { id: 'w16', label: '16L 背负', water: '16', unit: 'L', tankKg: null, active: hit('16', 'L', null) },
    { id: 'wtwo', label: '2 桶(30kg)', water: '2', unit: '桶', tankKg: '15', active: hit('2', '桶', '15') }
  ]
})

function applyWaterChip(chip) {
  fac.water = chip.water
  fac.unit = chip.unit
  if (chip.tankKg) fac.tankKg = chip.tankKg
}

// ---------- 派生结果 ----------
const factorResult = computed(() => {
  const kg = waterToKg(fac.water, fac.unit, fac.tankKg)
  const r = factorDose(kg, fac.mult)
  if (!r.ok) return r
  return {
    ...r,
    doseText: fmtDose(r.doseG),
    mlText: `${fmt1(r.doseG)} mL（粗估）`,
    capsText: `≈ ${fmt1(capsOf(r.doseG))} 瓶盖（粗估）`,
    ppmText: fmtInt(r.ppm),
    multText: fmt1(r.factor),
    waterText: `${fmt1(r.waterKg)} kg 水`,
    totalText: `总液约 ${fmt1(r.waterKg + r.doseG / 1000)} kg`
  }
})

const ppmResult = computed(() => {
  const r = ppmDose(ppm.ppm, toNum(ppm.water), ppm.content)
  if (!r.ok) return r
  return {
    ...r,
    prepText: fmtDose(r.prepG),
    pureText: fmtDose(r.pureG),
    factorText: fmtInt(r.factor),
    ppmTextShow: fmt1(r.ppm),
    contentText: fmt1(r.content),
    waterText: `${fmt1(r.waterKg)} ${ppm.unit} 水`
  }
})

const aiResult = computed(() => {
  const r = aiDose(ai.content, ai.perMu, ai.muWater, ai.tank)
  if (!r.ok) return r
  return {
    ...r,
    prepPerMuText: fmtDose(r.prepPerMu),
    perTankText: fmtDose(r.perTank),
    aiPerMuText: `${fmt1(r.perMuAi)} g 元/亩`,
    bucketsText: fmt1(r.buckets),
    contentText: fmt1(r.content),
    muWaterText: `${fmt1(r.muWater)} kg`,
    tankText: `${fmt1(r.tank)} kg`
  }
})

// 统一折算到 15kg 基准桶的每桶加药量（供换算卡联动）
const perTank15 = computed(() => {
  if (mode.value === 'factor') {
    const kg = waterToKg(fac.water, fac.unit, fac.tankKg)
    const r = factorDose(kg, fac.mult)
    return r.ok ? bucketDoseFromFactor(r.factor) : null
  }
  if (mode.value === 'ppm') {
    const r = ppmDose(ppm.ppm, TANK_KG, ppm.content)
    return r.ok ? r.prepG : null
  }
  const r = aiResult.value
  if (r.ok) return (r.prepPerMu * TANK_KG) / r.muWater
  return null
})

const tank15Text = computed(() => (perTank15.value === null ? '—' : fmtDose(perTank15.value)))
const caps15Text = computed(() => (perTank15.value === null ? '—' : `≈ ${fmt1(capsOf(perTank15.value))} 盖`))
const ml15Text = computed(() => (perTank15.value === null ? '—' : `≈ ${fmt1(mlOf(perTank15.value, 1))} mL`))

const conversionRows = computed(() => {
  if (perTank15.value === null) return []
  return BUCKETS_PER_MU.map((b) => ({
    buckets: b,
    muWaterText: `${fmt1(b * TANK_KG)} kg/亩`,
    muDoseText: fmtDose(perMuFromTank(perTank15.value, b))
  }))
})

// ---------- 配药单文本 ----------
const mixText = computed(() => {
  if (perTank15.value === null) return ''
  const common = [
    `每桶(15kg水)加药：${fmtDose(perTank15.value)}（≈${fmt1(capsOf(perTank15.value))} 瓶盖 · 粗估）`,
    '二次稀释：先小杯化开母液 → 半桶水搅匀 → 定容并冲洗杯子 2-3 次并入',
    '提醒：以农药标签登记剂量为准；戴手套口罩，严禁超剂量，注意安全间隔期'
  ]
  if (mode.value === 'factor' && factorResult.value.ok) {
    return ['【配药单 · 倍数稀释】', `倍数：${factorResult.value.multText} 倍 · 水量：${factorResult.value.waterText}`, `应加药剂：${factorResult.value.doseText}`, ...common].join('\n')
  }
  if (mode.value === 'ppm' && ppmResult.value.ok) {
    return ['【配药单 · ppm 目标】', `目标：${ppmResult.value.ppmTextShow} ppm · 水量：${ppmResult.value.waterText}`, `应加制剂：${ppmResult.value.prepText}（纯药 ${ppmResult.value.pureText}）`, ...common].join('\n')
  }
  if (mode.value === 'ai' && aiResult.value.ok) {
    return ['【配药单 · 有效成分剂量】', `亩制剂：${aiResult.value.prepPerMuText} · 亩桶数：${aiResult.value.bucketsText} 桶`, `每桶加药：${aiResult.value.perTankText}`, ...common].join('\n')
  }
  return ''
})

// ---------- 预设（手算断言口径） ----------
const presetDefs = [
  { id: 'backpack800', label: '800 倍 · 15kg 一桶水 → 18.8 g' },
  { id: 'big300x1500', label: '1500 倍 · 300 L 水 → 200 g' },
  { id: 'aiThiamethoxam', label: '25% 噻虫嗪 · 亩用元 6g · 亩水 45kg → 24g/亩 · 8g/桶' }
]

function applyPreset(id) {
  if (id === 'backpack800') {
    mode.value = 'factor'
    Object.assign(fac, { mult: '800', water: '15', unit: 'kg', tankKg: '15' })
  } else if (id === 'big300x1500') {
    mode.value = 'factor'
    Object.assign(fac, { mult: '1500', water: '300', unit: 'L', tankKg: '15' })
  } else if (id === 'aiThiamethoxam') {
    mode.value = 'ai'
    Object.assign(ai, { content: '25', perMu: '6', muWater: '45', tank: '15' })
  }
}

function resetInputs() {
  mode.value = 'factor'
  Object.assign(fac, DEFAULTS.fac)
  Object.assign(ppm, DEFAULTS.ppm)
  Object.assign(ai, DEFAULTS.ai)
}

// ---------- 交互回调（仅浏览器环境，SSR 安全） ----------
async function copyMixSheet() {
  const text = mixText.value
  if (!text || !navigator.clipboard) return
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 2000)
  } catch {
    copied.value = false
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('pesticide-dilution-calculator')
})

onBeforeUnmount(() => {
  if (copyTimer) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
})
</script>

<style scoped>
.pdc-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: hsl(var(--foreground));
}
.pdc-input:focus {
  outline: none;
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px hsl(var(--primary) / 0.4);
}
.pdc-select {
  padding: 0.625rem 0.5rem;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: hsl(var(--foreground));
  flex-shrink: 0;
}
</style>
