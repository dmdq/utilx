<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <AirVent class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">空调匹数 BTU 计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按面积、层高、气候带与顶层西晒等工况估冷负荷，输出建议制冷量 W / BTU/h / 匹数，就近匹配在售 26/32/35/50/72 型，附机型反查与季电费估算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线空调选型计算器：买挂机、柜机前先算冷负荷。输入房间面积与层高，选气候带（北方普通 / 中部夏热 / 南方湿热），
        勾选顶层、西晒、大开窗、保温差、人员密集等工况修正，工具按「单位面积冷负荷指标 × 连乘修正系数」逐项可追溯地算出所需制冷量，
        同时换算 BTU/h 与匹数，给出「舒适档 / 经济档」两档在售型号建议、机型适用面积反查、全房型速查表与整季耗电量电费估算。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 估算口径说明条 -->
    <p class="text-xs leading-relaxed p-3 rounded-lg bg-muted/60 border border-border text-muted-foreground flex items-start gap-2 mb-6">
      <Info class="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
      <span>负荷估算按「单位面积冷负荷指标」经验法（住宅 150-220 W/㎡ 区间内取值），西晒/顶层/大开窗会显著上浮；精确选型请暖通人员按规范计算，本工具用于家用选购快速决策。</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左列：输入面板 -->
      <div class="space-y-6">
        <!-- 房间与工况 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Thermometer class="w-5 h-5 mr-2 text-primary" /> 房间与气候
          </h2>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5" for="ac-area">房间面积（㎡）</label>
              <input
                id="ac-area"
                v-model="areaInput"
                type="text"
                inputmode="decimal"
                placeholder="如 15"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5" for="ac-height">层高（m）</label>
              <input
                id="ac-height"
                v-model="heightInput"
                type="text"
                inputmode="decimal"
                placeholder="默认 2.8"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <p class="text-sm font-medium text-foreground mb-2">气候带（基准冷负荷指标）</p>
            <div class="space-y-2">
              <button
                v-for="c in CLIMATE_DEFS"
                :key="c.id"
                @click="climate = c.id"
                class="w-full text-left px-3 py-2 rounded-lg border transition"
                :class="climate === c.id ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-muted'"
                :aria-pressed="climate === c.id"
              >
                <span class="block text-sm font-medium text-foreground">{{ c.label }}</span>
                <span class="block text-[11px] text-muted-foreground">{{ c.tip }} · 基准 {{ c.baseW }} W/㎡</span>
              </button>
            </div>
          </div>

          <div>
            <p class="text-sm font-medium text-foreground mb-2">使用性质</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="u in USAGE_DEFS"
                :key="u.id"
                @click="usage = u.id"
                class="px-3 py-1.5 rounded-full border text-xs font-medium transition"
                :class="usage === u.id ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:bg-muted'"
                :aria-pressed="usage === u.id"
              >
                {{ u.label }}
              </button>
            </div>
            <p class="text-[11px] text-muted-foreground mt-2 leading-relaxed">{{ usageTip }}</p>
          </div>

          <div>
            <p class="text-xs text-muted-foreground mb-2">快速预设</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="preset in presets"
                :key="preset.id"
                @click="applyPreset(preset)"
                class="px-2.5 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition"
              >
                <Play class="w-3 h-3 inline mr-1 -mt-0.5 text-primary" />{{ preset.label }}
              </button>
              <button
                @click="resetAll"
                class="px-2.5 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground transition"
              >
                <RefreshCw class="w-3 h-3 inline mr-1 -mt-0.5" />重置
              </button>
            </div>
          </div>
        </div>

        <!-- 工况修正开关组 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Sun class="w-5 h-5 mr-2 text-primary" /> 工况修正（逐项连乘）
          </h2>
          <div class="space-y-2">
            <button
              v-for="m in MOD_DEFS"
              :key="m.id"
              @click="toggleMod(m.id)"
              class="w-full flex items-start gap-2 text-left px-3 py-2 rounded-lg border transition"
              :class="mods[m.id] ? 'border-primary/50 bg-primary/5' : 'border-border bg-background hover:bg-muted'"
              :aria-pressed="mods[m.id]"
            >
              <CheckCircle v-if="mods[m.id]" class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <i v-else class="w-4 h-4 rounded-full border border-border flex-shrink-0 mt-0.5 inline-block"></i>
              <span class="min-w-0">
                <span class="block text-sm font-medium text-foreground">
                  {{ m.label }}
                  <span class="ml-1 text-[10px] font-mono text-muted-foreground">×{{ m.factor }}</span>
                </span>
                <span class="block text-[11px] text-muted-foreground leading-relaxed">{{ m.tip }}</span>
              </span>
            </button>
          </div>
          <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>层高按体积折算：{{ heightM }} m → ×{{ heightFactor.toFixed(3) }}（2.8 m 为基准）。系数为家装经验值，非规范取值。</span>
          </p>
        </div>

        <!-- 电费小卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Thermometer class="w-5 h-5 mr-2 text-primary" /> 整季耗电与电费
          </h2>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-muted-foreground mb-1.5" for="ac-hours">季节等效满负荷小时数</label>
              <input
                id="ac-hours"
                v-model="hoursInput"
                type="text"
                inputmode="decimal"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1.5" for="ac-price">电价（元/kWh）</label>
              <input
                id="ac-price"
                v-model="priceInput"
                type="text"
                inputmode="decimal"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div>
            <label class="block text-xs text-muted-foreground mb-1.5" for="ac-eer">能效比 EER（制冷量 ÷ 输入功率）</label>
            <select
              id="ac-eer"
              v-model="eerSelect"
              class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option v-for="e in EER_DEFS" :key="e.value" :value="e.value">{{ e.value }}（{{ e.label }}）</option>
            </select>
          </div>
          <div class="bg-primary/10 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">按负荷 {{ loadText }} W ÷ EER {{ eer }} 估算</p>
            <p class="text-2xl font-bold text-primary font-mono">{{ energyText }}<span class="text-sm font-normal text-muted-foreground ml-1">kWh/季</span></p>
            <p class="text-xs text-muted-foreground mt-1">约 {{ costText }} 元 · 输入功率约 {{ inputPowerText }} W</p>
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            口径：耗电量 = 制冷量 ÷ EER × 小时数。变频机达温后低频运转，实际通常低于此上限；600 h 是「等效满负荷」而非开机总时长。
          </p>
        </div>
      </div>

      <!-- 右列：结果面板（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 结论卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <AirVent class="w-5 h-5 mr-2 text-primary" /> 本房间建议制冷量
            </h2>
            <span class="text-[10px] font-mono text-muted-foreground">{{ areaM }} ㎡ × {{ heightM }} m · {{ climateLabel }}</span>
          </div>

          <div v-if="!load" class="text-sm text-muted-foreground p-4 rounded-lg bg-muted/50 flex items-start gap-2">
            <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>{{ inputMsg }}</span>
          </div>

          <div v-else class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div class="bg-primary/10 rounded-lg p-4">
                <p class="text-[10px] text-muted-foreground mb-1">建议制冷量</p>
                <p class="text-4xl font-bold text-primary font-mono leading-none">{{ loadText }}</p>
                <p class="text-xs text-muted-foreground mt-1.5">W（峰值负荷）</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-[10px] text-muted-foreground mb-1">BTU/h</p>
                <p class="text-2xl font-bold text-foreground font-mono mt-2">{{ btuText }}</p>
                <p class="text-xs text-muted-foreground mt-1.5">1 W = 3.412 BTU/h</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-[10px] text-muted-foreground mb-1">匹数（按 2500 W/匹）</p>
                <p class="text-2xl font-bold text-foreground font-mono mt-2">{{ psExact }}</p>
                <p class="text-xs text-muted-foreground mt-1.5">{{ psSpeech }}</p>
              </div>
            </div>

            <!-- 选型卡 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="border border-primary/30 bg-primary/5 rounded-lg p-4">
                <p class="text-xs font-medium text-primary mb-1">舒适档（就近上靠）</p>
                <p class="text-xl font-bold text-foreground">{{ comfort.model }}</p>
                <p class="text-sm font-mono text-muted-foreground mt-1">额定制冷量 {{ fmtInt(comfort.ratedW) }} W · {{ psOfText(comfort.ratedW) }}</p>
                <p class="text-xs mt-2 font-medium" :class="marginClass(comfort)">
                  余量 {{ signed(comfort.marginPct, 1) }}%
                  <span class="text-muted-foreground font-normal">（{{ marginNote(comfort.hint) }}）</span>
                </p>
              </div>
              <div class="border border-border rounded-lg p-4">
                <p class="text-xs font-medium text-muted-foreground mb-1">经济档（{{ usage === 'intermittent' ? '间歇使用可降一档' : '长时使用不降档' }}）</p>
                <p class="text-xl font-bold text-foreground">{{ economy.model }}</p>
                <p class="text-sm font-mono text-muted-foreground mt-1">额定制冷量 {{ fmtInt(economy.ratedW) }} W · {{ psOfText(economy.ratedW) }}</p>
                <p class="text-xs mt-2" :class="marginClass(economy)">
                  余量 {{ signed(economy.marginPct, 1) }}%
                  <span class="text-muted-foreground font-normal">（{{ marginNote(economy.hint) }}）</span>
                </p>
              </div>
            </div>

            <p
              class="text-xs leading-relaxed p-2.5 rounded flex items-start gap-1.5"
              :class="comfort.hint === 'over' ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'"
            >
              <TriangleAlert v-if="comfort.hint === 'over'" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <CheckCircle v-else class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ verdictText }}</span>
            </p>
          </div>
        </div>

        <!-- 修正明细表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Info class="w-5 h-5 mr-2 text-primary" /> 负荷明细（逐项可追溯）
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-[11px] text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">项目</th>
                  <th class="py-2 pr-3 font-medium text-right">系数</th>
                  <th class="py-2 pr-3 font-medium text-right">修正前 W</th>
                  <th class="py-2 pr-3 font-medium text-right">本项增加 W</th>
                  <th class="py-2 font-medium text-right">修正后 W</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in steps" :key="s.key" class="border-b border-border/60 last:border-0">
                  <td class="py-2 pr-3 text-foreground">{{ s.label }}</td>
                  <td class="py-2 pr-3 text-right font-mono text-muted-foreground">{{ s.factor.toFixed(3) }}</td>
                  <td class="py-2 pr-3 text-right font-mono text-muted-foreground">{{ fmtInt(s.beforeW) }}</td>
                  <td class="py-2 pr-3 text-right font-mono" :class="s.deltaW > 0.5 ? 'text-amber-600' : 'text-muted-foreground'">{{ signed(s.deltaW, 0) }}</td>
                  <td class="py-2 text-right font-mono font-medium text-foreground">{{ fmtInt(s.afterW) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            基准 {{ baseText }} W（{{ areaM }} ㎡ × {{ climateBaseW }} W/㎡）→ 合计放大 ×{{ totalFactor.toFixed(3) }} → 最终 {{ loadText }} W。
            每一项系数都可以单独核对，这就是和「凭感觉买匹数」的核心差别。
          </p>
        </div>

        <!-- 反查卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <RefreshCw class="w-5 h-5 mr-2 text-primary" /> 机型反查：这台机器在我家能用多大？
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label class="block text-xs text-muted-foreground mb-1.5" for="ac-model">选择在售机型</label>
              <select
                id="ac-model"
                v-model="reverseModelSel"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option v-for="m in MODELS" :key="m.id" :value="m.id">{{ m.name }}（{{ m.ratedW }} W）</option>
              </select>
              <p class="text-[11px] text-muted-foreground mt-2">反查按当前气候带与勾选项（含层高 ×{{ heightFactor.toFixed(3) }}）折算。</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">{{ reverseModel.name }} 在本工况下适用面积上限</p>
              <p class="text-3xl font-bold text-primary font-mono">{{ reverseAreaText }}<span class="text-sm font-normal text-muted-foreground ml-1">㎡</span></p>
              <p class="text-xs text-muted-foreground mt-1.5">{{ reverseHint }}</p>
            </div>
          </div>
        </div>

        <!-- 全房型速查表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <AirVent class="w-5 h-5 mr-2 text-primary" /> 全房型速查表（随气候与修正联动）
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-[11px] text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">面积</th>
                  <th class="py-2 pr-3 font-medium text-right">所需制冷量</th>
                  <th class="py-2 pr-3 font-medium text-right">BTU/h</th>
                  <th class="py-2 pr-3 font-medium text-right">匹数</th>
                  <th class="py-2 font-medium">建议型号（就近上靠）</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in quickRows"
                  :key="row.area"
                  class="border-b border-border/60 last:border-0"
                  :class="row.active ? 'bg-primary/10' : ''"
                >
                  <td class="py-2 pr-3 font-mono text-foreground">
                    {{ row.area }} ㎡
                    <span v-if="row.active" class="ml-1 text-[10px] text-primary font-sans">← 当前</span>
                  </td>
                  <td class="py-2 pr-3 text-right font-mono text-foreground">{{ row.loadText }} W</td>
                  <td class="py-2 pr-3 text-right font-mono text-muted-foreground">{{ row.btuText }}</td>
                  <td class="py-2 pr-3 text-right font-mono text-muted-foreground">{{ row.psText }}</td>
                  <td class="py-2">{{ row.modelText }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground mt-3">速查表按当前气候带、层高与勾选的工况修正实时换算；「当前」行是包含你家面积的最近档位（向上取档）。</p>
        </div>

        <!-- 科普卡：匹的口径 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Info class="w-5 h-5 mr-2 text-primary" /> 「一匹」到底等于多少瓦？
          </h2>
          <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li><span class="text-foreground font-medium">本工具口径：1 匹 = 2500 W 制冷量</span>——行业约定俗成，厂商标称的 26 / 32 / 35 / 50 / 72 型就按这个口径叫「大 1 匹 / 1.5 匹 / 2 匹 / 3 匹」。</li>
            <li>历史来源：早期空调用输入功率（电功率）说话，1 匹 = 1 马力 = 735 W；乘上能效比 EER≈3.16 得到约 2324 W 制冷量，四舍五入按 2500 W 记，于是「匹」变成了制冷量的俗称。</li>
            <li>看机器铭牌时认准「额定制冷量 W」而不是「输入功率 W」：同样标 1.5 匹的机型，制冷量都是 3500 W 上下，输入功率却因能效等级从 1000 W 到 1150 W 不等。</li>
            <li>换算成 BTU/h 就统一了：1 W ≈ 3.412 BTU/h，2500 W ≈ 8530 BTU/h，所以美标 9000 BTU 的窗机≈小 1 匹，12000 BTU≈1.5 匹（约 3517 W）。</li>
          </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>空调匹数 BTU 计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是一款面向家装与租房购机的在线空调选型工具。它用暖通行业通用的「单位面积冷负荷指标」经验法：先按气候带取基准
          <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">160 / 190 / 220 W/㎡</code>，乘以房间面积得到基准冷负荷，
          再对顶层、西晒、大开窗、保温差、人员密集等工况逐项连乘 1.05–1.15 的经验系数，并按层高做体积折算，
          最终同时以 W、BTU/h、匹数三种口径输出，并把结果就近上靠到在售的 2600 / 3200 / 3500 / 5000 / 5100 / 7200 W 规格上。
          反向还能查「某机型在本工况下适用多少平方米」，并估算整季耗电量与电费。全部计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">一匹到底等于多少瓦（2500 W 约定 / 735 W 的历史）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          「匹」原本不是制冷量单位。早期压缩机用输入功率（电功率）标定，1 匹 = 1 英制马力 = 735 W；那代机器能效比约 3.16，
          735 × 3.16 ≈ 2324 W 制冷量，市售习惯把这一档叫「1 匹」，并逐步简化为 <span class="text-foreground font-medium">1 匹 ≈ 2500 W 制冷量</span> 的约定口径——这也是 26 型（2600 W）被称为「大 1 匹」、
          35 型（3500 W）被称为「1.5 匹」的原因。今天再看「匹」，应该把它当成制冷量的口语刻度，而不是电功率；
          真正省电与否看的是能效比 EER/APF（制冷量 ÷ 输入功率），同为 1.5 匹的新一级机型输入功率可比新三级低 10%–15%。
          本工具统一按 2500 W/匹 换算，页面所有匹数都是这个口径。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么顶层、西晒要加量？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          屋顶是住宅围护结构中传热系数最高、日照时间最长的部位：夏季屋面向阳面外表面温度可达 60℃ 以上，顶层房间的屋顶传热往往占到总负荷的一半以上，
          所以经验上要乘 1.10–1.15；西晒墙在 15:00–18:00 同时吃到最大太阳辐射与最高外气温，冷负荷峰值正好落在开机时段，乘 1.08–1.12。
          单层大玻璃的传热只有同面积 240 mm 砖墙的三分之一到二分之一，落地窗房间按开窗比与朝向再加 1.05–1.10；老房保温差、房内经常 4 人以上（人均散热约 130 W）再各加一档。
          这些系数连乘之后差距很大——同样 15 ㎡，北方中层北向卧室约 2400 W，南方顶层西晒落地窗卧室可以逼近 4100 W，
          从「1 匹够了」变成「至少要 1.5 匹、舒适档建议 2 匹」，这就是逐项修正的价值。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">BTU 和 W 怎么换算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          1 W = 3.412 BTU/h（严格值 3.412142），反向 1 BTU/h ≈ 0.293 W。制冷量常见的四种口径可直接对照：
          2500 W ≈ 8530 BTU/h ≈ 1 匹 ≈ 2150 kcal/h；3500 W ≈ 11942 BTU/h ≈ 1.4 匹（市称 1.5 匹）；5000 W ≈ 17061 BTU/h = 2 匹；7200 W ≈ 24567 BTU/h ≈ 2.9 匹（市称 3 匹）。
          进口或港式机型常只标 BTU/h（如 9000 / 12000 / 18000 / 24000 BTU），把 BTU 值除以 3.412 就能换成 W，再除以 2500 就知道是几匹，不必背整张换算表。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">变频空调要不要按最大负荷选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          要。变频的优势是在达到设定温度后低频维持运转、体感平稳且省电，但它并不能把额定制冷量变大：铭牌上的「额定制冷量」是中间转速的标称点，
          最大输出通常只有 1.1–1.3 倍，且只能在高温启动阶段短时维持。按最大负荷（也就是本页算出的峰值）选型，机器在最热最晒的那几个小时不用满载，
          达温后自动降频，寿命、噪音与电耗都更好看；反过来按「平均负荷」买小了，机器长时间高频满载仍压不住温度，还会频繁启停、结霜保护，
          省下的购机钱会以电费与舒适性损失还回来。合理做法是舒适档按上靠取一档，预算紧张再考虑间歇房间用经济档（本页给降一档方案）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">新风与除湿需求</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一句话：普通挂机不管新风，密闭房间要另配新风机或每隔几小时开窗换气；南方湿热房间优先看「除湿量 L/h」参数并把温度设低 1℃，
          湿负荷大的衣帽间、地下室建议单独上除湿机，不要指望加大匹数解决潮湿——匹数解决的是温度，湿度靠露点除湿。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">空调一匹到底等于多少瓦？</h3>
            <p class="text-sm text-muted-foreground mt-1">本工具按行业约定「1 匹 = 2500 W 制冷量」换算，匹数是制冷量的口语刻度，不是耗电功率。历史上 1 匹指 1 马力 = 735 W 输入功率，乘以当年约 3.16 的能效比得到约 2324 W 制冷量，后被简化记忆为 2500 W，所以 26 型叫大 1 匹、35 型叫 1.5 匹。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">房间空调选多大匹数怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1">用「面积 × 单位面积冷负荷指标 × 工况修正系数」：按气候带取 160/190/220 W/㎡，再对顶层、西晒、大开窗、保温差、人员密集分别连乘 1.05–1.15，并按层高折算体积。算出的 W 除以 2500 就是匹数，最后就近上靠到在售的 2600/3500/5000/7200 W 规格。本工具会自动完成这三步并列出每一档的增量。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">BTU/h 和 W 怎么换算？</h3>
            <p class="text-sm text-muted-foreground mt-1">1 W ≈ 3.412 BTU/h，1 BTU/h ≈ 0.293 W。2500 W 约等于 8530 BTU/h（1 匹），12000 BTU/h 约等于 3517 W（1.5 匹）。进口机型只标 BTU 时，除以 3.412 得 W，再除以 2500 得匹数。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">变频空调要不要按最大负荷选？</h3>
            <p class="text-sm text-muted-foreground mt-1">要。变频只是能低频维持运转，并不能把额定制冷量变大，最大输出约为标称的 1.1–1.3 倍且只能短时维持。按峰值负荷上靠选型，最热时段不必满载，达温后降频更省电安静；买小了会长时间高频运转仍压不住温度。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">已有 2600 W 大 1 匹机器，能带多大房间？</h3>
            <p class="text-sm text-muted-foreground mt-1">用反查卡：把机型除以「基准指标 × 修正系数 × 层高系数」。中部夏热、无修正、2.8 m 层高的房间上限约 13.7 ㎡；若同时是顶层加西晒，上限降到约 11 ㎡；南方湿热且大开窗还会更低。反过来，15 ㎡ 的南方顶层西晒卧室需要约 4100 W，1 匹机明显不够。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。面积、工况修正、匹数换算与电费估算全部在你的浏览器中即时完成，不发送任何网络请求，刷新页面即恢复默认输入。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ac-btu-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  AirVent, Sun, Thermometer, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '空调匹数 BTU 计算器 - 房间制冷量与空调选多大在线估算',
  description: '免费在线空调匹数计算器：按面积、层高、气候带与顶层西晒等工况估算房间冷负荷（W/㎡ 经验法），换算 BTU/h 与匹数并就近匹配 26/35/50/72 型在售规格，含舒适档经济档建议、机型适用面积反查、全房型速查表与整季电费估算，纯浏览器本地运行不上传',
  keywords: '空调匹数计算,房间制冷量,BTU 换算,空调选多大,一匹多少瓦',
  author: '有条工具',
  ogTitle: '空调匹数 BTU 计算器 - 房间制冷量与空调选多大 | 有条工具',
  ogDescription: '输入面积与顶层西晒等工况，算出所需制冷量 W、BTU/h 与匹数，就近推荐在售型号，附机型反查与季电费估算。',
  ogUrl: 'https://www.util.cn/tools/ac-btu-calculator',
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
          name: '空调匹数 BTU 计算器',
          url: 'https://www.util.cn/tools/ac-btu-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '单位面积冷负荷指标估算（160/190/220 W/㎡）',
            '顶层/西晒/大开窗/保温差/人员密集逐项修正',
            '制冷量 W、BTU/h 与匹数三口径输出',
            '舒适档与经济档就近匹配在售型号',
            '机型适用面积反查与全房型速查表',
            '整季耗电量与电费估算',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '空调匹数 BTU 计算器', item: 'https://www.util.cn/tools/ac-btu-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '空调一匹到底等于多少瓦？',
              acceptedAnswer: { '@type': 'Answer', text: '按行业约定 1 匹 = 2500 W 制冷量，匹数是制冷量的口语刻度而不是耗电功率。历史上 1 匹指 1 马力 735 W 输入功率，乘当年约 3.16 的能效比得到 2324 W 制冷量，后简化记为 2500 W，因此 26 型叫大 1 匹、35 型叫 1.5 匹。' }
            },
            {
              '@type': 'Question',
              name: '房间空调选多大匹数怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '用面积乘单位面积冷负荷指标再乘工况修正：按气候带取 160/190/220 W/㎡，对顶层、西晒、大开窗、保温差、人员密集分别连乘 1.05 至 1.15，并按层高折算体积。所得 W 除以 2500 即匹数，最后就近上靠到在售的 2600/3500/5000/7200 W 规格。' }
            },
            {
              '@type': 'Question',
              name: 'BTU 和 W 怎么换算？',
              acceptedAnswer: { '@type': 'Answer', text: '1 W 约等于 3.412 BTU/h，1 BTU/h 约等于 0.293 W。2500 W 约 8530 BTU/h（1 匹），12000 BTU/h 约 3517 W（1.5 匹）。进口机型只标 BTU 时先除以 3.412 换成 W，再除以 2500 得匹数。' }
            },
            {
              '@type': 'Question',
              name: '变频空调要不要按最大负荷选？',
              acceptedAnswer: { '@type': 'Answer', text: '要。变频只是达温后低频维持，并不能放大额定制冷量，最大输出约为标称的 1.1 至 1.3 倍且只能短时维持。按峰值负荷上靠选型可避免最热时段满载硬扛，买小了会长时间高频运转仍压不住温度，电费与噪音反而更高。' }
            },
            {
              '@type': 'Question',
              name: '为什么顶层和西晒要加量？',
              acceptedAnswer: { '@type': 'Answer', text: '屋面夏季外表面温度可达 60℃ 以上，屋顶传热常占顶层房间负荷的一半以上，故乘 1.10 至 1.15；西晒墙在 15 至 18 点同时吃到最大太阳辐射与最高外气温，峰值正好落在开机时段，乘 1.08 至 1.12。这些系数连乘后同样面积所需制冷量可差出一到两档。' }
            },
            {
              '@type': 'Question',
              name: '计算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。面积与工况修正、匹数与 BTU 换算、机型反查和电费估算全部在浏览器本地即时完成，不发送任何网络请求，刷新页面即恢复默认输入。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 口径：1 匹 = 2500 W 制冷量（行业约定俗成，非输入功率 735 W 的历史口径）
const PS_WATTS = 2500
// 1 W = 3.412142 BTU/h（国际蒸汽表卡）
const BTU_PER_W = 3.412142
// 层高基准：住宅常见 2.8 m，按体积线性折算经验系数
const HEIGHT_BASE = 2.8
const HEIGHT_STEP = 0.1 // 每偏离 1 m 折算 ±10%，经验值

// 气候带基准冷负荷指标（住宅经验区间 150-220 W/㎡）
const CLIMATE_DEFS = [
  { id: 'north', label: '北方普通', baseW: 160, tip: '北京及周边、夏热时间较短' },
  { id: 'mid', label: '中部夏热', baseW: 190, tip: '长江流域，夏季闷热持续' },
  { id: 'south', label: '南方湿热 + 西晒强', baseW: 220, tip: '华南、沿海，高温高湿' }
]

// 工况修正经验系数（连乘用，取自家装经验区间 1.05–1.15，非规范取值）
const MOD_DEFS = [
  { id: 'topFloor', label: '顶层', factor: 1.12, tip: '屋面日照强，屋顶传热常占顶层负荷一半以上' },
  { id: 'westSun', label: '西晒', factor: 1.10, tip: '下午太阳辐射叠加最高外温，峰值正落在开机时段' },
  { id: 'bigWindow', label: '大开窗 / 落地窗', factor: 1.08, tip: '玻璃热阻只有同面积砖墙的 1/3–1/2' },
  { id: 'poorInsulation', label: '保温差（老房单层玻璃）', factor: 1.08, tip: '围护结构热阻低、无外墙保温' },
  { id: 'crowded', label: '人员密集（经常 ≥4 人在房）', factor: 1.05, tip: '静坐人均散热约 130 W，四人即 520 W' }
]

// 在售常见规格（额定制冷量 W → 市售口语匹数）
const MODELS = [
  { id: '26', name: '大 1 匹（26 型）', ratedW: 2600 },
  { id: '32', name: '1.25 匹（32 型）', ratedW: 3200 },
  { id: '35', name: '1.5 匹（35 型）', ratedW: 3500 },
  { id: '50', name: '2 匹（50 型）', ratedW: 5000 },
  { id: '51', name: '2 匹（51 型柜机）', ratedW: 5100 },
  { id: '72', name: '3 匹（72 型）', ratedW: 7200 }
]

// 使用性质：间歇（卧室，可降一档）/ 长时（客厅书房，按全负荷）
const USAGE_DEFS = [
  { id: 'intermittent', label: '间歇（卧室）', tip: '夜间或短时开机，峰值压不满也能接受，经济档可降一档。' },
  { id: 'continuous', label: '长时（客厅 / 书房）', tip: '白天连续运行，按全负荷选，不建议降档。' }
]

// 速查表面积档
const QUICK_AREAS = [10, 15, 20, 25, 30, 40, 50]

// 能效比档位（示意：新三级 / 新一级）
const EER_DEFS = [
  { value: '3.2', label: '新三级示意' },
  { value: '3.5', label: '新一级示意' },
  { value: '4.0', label: '高能效 / 直流变频' }
]

// 解析输入数字：空串/非法返回 null
function parseNum(text) {
  const s = String(text ?? '').trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

// 气候带基准指标（未知气候按中部夏热兜底）
function baseWOf(climateId) {
  const hit = CLIMATE_DEFS.find((c) => c.id === climateId)
  return hit ? hit.baseW : 190
}

// 基准冷负荷 = 面积 × 指标；非法面积返回 null
function baseLoadOf(area, climateId) {
  if (!Number.isFinite(area) || area <= 0) return null
  return area * baseWOf(climateId)
}

// 层高体积折算经验系数：2.8 m → 1.0，每偏离 1 m ±10%，夹在 0.9–1.2
function heightFactorOf(heightM) {
  const h = Number.isFinite(heightM) ? heightM : HEIGHT_BASE
  const raw = 1 + (h - HEIGHT_BASE) * HEIGHT_STEP
  return Math.min(1.2, Math.max(0.9, Math.round(raw * 1000) / 1000))
}

// 连乘总系数 = 各启用修正系数 × 层高系数（mods 为 {开关 id: bool, height: number}）
function modsFactorOf(mods) {
  let f = 1
  for (const m of MOD_DEFS) {
    if (mods && mods[m.id]) f *= m.factor
  }
  return f * heightFactorOf(mods ? mods.height : HEIGHT_BASE)
}

// 修正后冷负荷（连乘）；基准非法返回 null
function adjustedLoadOf(base, mods) {
  if (!Number.isFinite(base) || base <= 0) return null
  return base * modsFactorOf(mods)
}

// 逐项明细：基准行 + 每个启用修正 + 层高，含修正前 / 本项增加 / 修正后，可追溯
function modStepsOf(base, mods) {
  if (!Number.isFinite(base) || base <= 0) return []
  const rows = []
  let cur = base
  rows.push({ key: 'base', label: '基准冷负荷（面积 × 指标）', factor: 1, beforeW: base, deltaW: 0, afterW: base })
  for (const m of MOD_DEFS) {
    if (!mods || !mods[m.id]) continue
    const next = cur * m.factor
    rows.push({ key: m.id, label: m.label, factor: m.factor, beforeW: round1(cur), deltaW: round1(next - cur), afterW: round1(next) })
    cur = next
  }
  const hRaw = mods && Number.isFinite(mods.height) ? mods.height : HEIGHT_BASE
  const hf = heightFactorOf(hRaw)
  if (Math.abs(hf - 1) > 0.0005) {
    const next = cur * hf
    rows.push({ key: 'height', label: `层高折算（${hRaw.toFixed(1)} m）`, factor: hf, beforeW: round1(cur), deltaW: round1(next - cur), afterW: round1(next) })
    cur = next
  }
  return rows
}

// W → BTU/h（取整）
function wattsToBtuOf(w) {
  if (!Number.isFinite(w) || w <= 0) return 0
  return Math.round(w * BTU_PER_W)
}

// W → 匹数（1 匹 = 2500 W 制冷量口径），保留两位小数
function wattsToPsOf(w) {
  if (!Number.isFinite(w) || w <= 0) return 0
  return Math.round((w / PS_WATTS) * 100) / 100
}

// 口语匹数：就近取 0.5 档
function psSpeechOf(w) {
  const ps = w / PS_WATTS
  if (!Number.isFinite(ps) || ps <= 0) return '—'
  const step = Math.max(0.5, Math.round(ps * 2) / 2)
  return `约 ${step} 匹`
}

// 就近上靠选型：取首个 额定 ≥ 负荷 的规格；
// 若恰好卡在档位上（余量 0），上靠一档——但上靠后余量超过 30% 就保留原档并提示余量偏紧。
function pickModelOf(loadW) {
  if (!Number.isFinite(loadW) || loadW <= 0) return null
  const last = MODELS[MODELS.length - 1]
  if (loadW > last.ratedW) {
    return { model: last.name, ratedW: last.ratedW, id: last.id, marginPct: marginOf(last.ratedW, loadW), hint: 'over' }
  }
  let idx = MODELS.findIndex((m) => m.ratedW >= loadW)
  if (idx < 0) idx = MODELS.length - 1
  let hit = MODELS[idx]
  let hint = null
  if (hit.ratedW === loadW && idx < MODELS.length - 1) {
    const next = MODELS[idx + 1]
    if (marginOf(next.ratedW, loadW) <= 30) {
      hit = next
      hint = 'up'
    } else {
      hint = 'tight'
    }
  } else if (loadW < MODELS[0].ratedW * 0.85) {
    hint = 'under'
  } else if (marginOf(hit.ratedW, loadW) > 30) {
    hint = 'oversize'
  }
  return { model: hit.name, ratedW: hit.ratedW, marginPct: marginOf(hit.ratedW, loadW), hint, id: hit.id }
}

// 经济档：间歇使用允许降一档（降档后欠负荷不超过 15%），长时使用维持舒适档
function economyModelOf(loadW, usage) {
  const comfort = pickModelOf(loadW)
  if (!comfort) return null
  if (usage !== 'intermittent') {
    return { ...comfort, hint: comfort.hint || 'keep', downgraded: false }
  }
  const idx = MODELS.findIndex((m) => m.ratedW === comfort.ratedW)
  const prev = MODELS[idx - 1]
  if (prev && prev.ratedW >= loadW * 0.85) {
    return { model: prev.name, ratedW: prev.ratedW, id: prev.id, marginPct: marginOf(prev.ratedW, loadW), hint: 'down', downgraded: true }
  }
  return { ...comfort, hint: comfort.hint || 'keep', downgraded: false }
}

// 反查：某机型在当前气候与工况下适用面积上限（㎡，保留 1 位小数）
function areaReverseOf(modelW, climateId, mods) {
  const perW = baseWOf(climateId)
  if (!Number.isFinite(modelW) || modelW <= 0 || perW <= 0) return null
  const f = modsFactorOf(mods)
  if (!(f > 0)) return null
  return Math.round((modelW / (perW * f)) * 10) / 10
}

// 季耗电量 kWh = 制冷量 W ÷ EER × 小时数 ÷ 1000（输入功率 × 时间）
function energyKwhOf(loadW, hours, eer) {
  if (!Number.isFinite(loadW) || loadW <= 0) return 0
  if (!Number.isFinite(hours) || hours <= 0) return 0
  if (!Number.isFinite(eer) || eer <= 0) return 0
  return Math.round(((loadW / eer) * hours / 1000) * 10) / 10
}

// 季电费（元）
function costOf(loadW, hours, eer, price) {
  return Math.round(energyKwhOf(loadW, hours, eer) * (Number.isFinite(price) ? price : 0) * 10) / 10
}

// 输入功率 W = 制冷量 ÷ EER
function inputPowerOf(loadW, eer) {
  if (!Number.isFinite(loadW) || loadW <= 0 || !Number.isFinite(eer) || eer <= 0) return null
  return Math.round(loadW / eer)
}

// 速查表行：面积 → 负荷 / BTU / 匹数 / 建议型号；高亮「包含当前面积的第一个向上档位」
function quickRowsOf(climateId, mods, currentArea) {
  const rows = QUICK_AREAS.map((area) => {
    const load = adjustedLoadOf(baseLoadOf(area, climateId), mods)
    const pick = pickModelOf(load)
    return {
      area,
      loadText: fmtInt(load),
      btuText: fmtInt(wattsToBtuOf(load)),
      psText: `${wattsToPsOf(load)} 匹`,
      modelText: pick ? `${pick.model} · ${fmtInt(pick.ratedW)} W（${pick.marginPct}% 余量）` : '—',
      active: false
    }
  })
  if (Number.isFinite(currentArea)) {
    const hit = rows.findIndex((r) => r.area >= currentArea)
    const idx = hit === -1 ? rows.length - 1 : hit
    rows[idx] = { ...rows[idx], active: true }
  }
  return rows
}

// 余量百分比（正=富余，负=欠量）
function marginOf(ratedW, loadW) {
  if (!(loadW > 0)) return 0
  return Math.round(((ratedW - loadW) / loadW) * 1000) / 10
}

function round1(n) {
  return Math.round(n * 10) / 10
}

// 千分位整数格式化（SSR / 客户端一致）
function fmtInt(n) {
  if (!Number.isFinite(n)) return '—'
  const s = String(Math.round(n))
  const sign = s.startsWith('-') ? '-' : ''
  const digits = sign ? s.slice(1) : s
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// ---------- 常量与默认值 ----------
const DEFAULTS = {
  area: '15',
  height: '2.8',
  climate: 'south',
  usage: 'intermittent',
  hours: '600',
  price: '0.6',
  eer: '3.5',
  mods: { topFloor: false, westSun: false, bigWindow: false, poorInsulation: false, crowded: false }
}

// 预设：① 南方 15㎡ 顶层西晒卧室 ② 中部 40㎡ 客厅落地窗
const presets = [
  {
    id: 'south15',
    label: '南方 15㎡ 顶层西晒卧室',
    area: '15', height: '2.8', climate: 'south', usage: 'intermittent',
    mods: { topFloor: true, westSun: true, bigWindow: false, poorInsulation: false, crowded: false }
  },
  {
    id: 'mid40',
    label: '中部 40㎡ 客厅落地窗',
    area: '40', height: '2.8', climate: 'mid', usage: 'continuous',
    mods: { topFloor: false, westSun: false, bigWindow: true, poorInsulation: false, crowded: true }
  }
]

// ---------- 页面状态 ----------
const areaInput = ref(DEFAULTS.area)
const heightInput = ref(DEFAULTS.height)
const climate = ref(DEFAULTS.climate)
const usage = ref(DEFAULTS.usage)
const mods = ref({ ...DEFAULTS.mods })
const hoursInput = ref(DEFAULTS.hours)
const priceInput = ref(DEFAULTS.price)
const eerSelect = ref(DEFAULTS.eer)
const reverseModelId = ref('')
const seoContentVisible = ref(true)

const areaM = computed(() => {
  const n = parseNum(areaInput.value)
  if (n === null) return NaN
  return Math.max(1, Math.min(300, n))
})
const heightM = computed(() => {
  const n = parseNum(heightInput.value)
  if (n === null) return HEIGHT_BASE
  return Math.max(2, Math.min(6, n))
})
const heightFactor = computed(() => heightFactorOf(heightM.value))
const climateLabel = computed(() => (CLIMATE_DEFS.find((c) => c.id === climate.value) || CLIMATE_DEFS[1]).label)
const climateBaseW = computed(() => baseWOf(climate.value))
const usageTip = computed(() => (USAGE_DEFS.find((u) => u.id === usage.value) || USAGE_DEFS[0]).tip)

// 修正后的 mod 表（带入层高，供纯函数连乘）
const modsTable = computed(() => ({ ...mods.value, height: heightM.value }))

const inputMsg = computed(() => {
  if (!Number.isFinite(areaM.value)) return '请输入有效面积（数字，如 15）。'
  return ''
})

const baseLoad = computed(() => baseLoadOf(areaM.value, climate.value))
const load = computed(() => adjustedLoadOf(baseLoad.value, modsTable.value))
const loadText = computed(() => fmtInt(load.value))
const baseText = computed(() => fmtInt(baseLoad.value))
const totalFactor = computed(() => modsFactorOf(modsTable.value))
const steps = computed(() => modStepsOf(baseLoad.value, modsTable.value))
const btuText = computed(() => fmtInt(wattsToBtuOf(load.value)))
const psExact = computed(() => (Number.isFinite(load.value) ? wattsToPsOf(load.value).toFixed(2) : '—'))
const psSpeech = computed(() => psSpeechOf(load.value))

const comfort = computed(() => pickModelOf(load.value) || { model: '—', ratedW: 0, marginPct: 0, hint: null })
const economy = computed(() => economyModelOf(load.value, usage.value) || comfort.value)

function signed(n, digits) {
  const v = Number(n).toFixed(digits)
  return n > 0 ? `+${v}` : v
}
function marginClass(pick) {
  if (pick.hint === 'over') return 'text-red-600'
  if (pick.marginPct < 0) return 'text-amber-600'
  return 'text-green-600'
}
function marginNote(hint) {
  const notes = {
    over: '超出家用单台常见规格',
    tight: '正好卡在档位、余量偏紧',
    up: '已就近上靠一档',
    under: '负荷很小，1 匹以下机型即可',
    oversize: '余量较大，可考虑小一档',
    down: '间歇使用降一档',
    keep: '长时使用维持全负荷档'
  }
  return notes[hint] || '按负荷就近上靠'
}
function psOfText(w) {
  return `${wattsToPsOf(w)} 匹`
}

const verdictText = computed(() => {
  const c = comfort.value
  if (c.hint === 'over') {
    return `所需 ${loadText.value} W 已超过 72 型（7200 W）单台能力，建议分两台（如 2 匹 + 1.5 匹）或直接上中央空调 / 多联机，别硬买一台 3 匹。`
  }
  if (usage.value === 'intermittent' && economy.value.downgraded) {
    return `舒适建议 ${c.model}；${areaM.value} ㎡ 若只在夜间或短时开，${economy.value.model} 也够用（欠量 ${Math.abs(economy.value.marginPct).toFixed(1)}%，达温会慢一些）。`
  }
  if (c.hint === 'tight') {
    return `负荷正好等于 ${c.model} 额定值，无富余。长时或高温天建议直接上靠一档更稳妥。`
  }
  return `选 ${c.model}（${c.ratedW} W，余量 ${signed(c.marginPct, 1)}%）即可覆盖本工况峰值负荷。`
})

// 反查卡：未手动选择时默认落在舒适档机型上（保证下拉框显示与结果一致）
const reverseModelSel = computed({
  get: () => (MODELS.some((m) => m.id === reverseModelId.value) ? reverseModelId.value : (comfort.value.id || MODELS[0].id)),
  set: (id) => { reverseModelId.value = id }
})
const reverseModel = computed(() => MODELS.find((m) => m.id === reverseModelSel.value) || MODELS[0])
const reverseArea = computed(() => areaReverseOf(reverseModel.value.ratedW, climate.value, modsTable.value))
const reverseAreaText = computed(() => (reverseArea.value === null ? '—' : reverseArea.value.toFixed(1)))
const reverseHint = computed(() => {
  if (reverseArea.value === null) return '反查不可用'
  const fits = Number.isFinite(areaM.value) && areaM.value <= reverseArea.value
  return fits
    ? `当前 ${areaM.value} ㎡ 在这台机器适用范围内。`
    : `当前 ${areaM.value} ㎡ 已超出，这台机器会长时间满载仍压不住温度。`
})

// 速查表
const quickRows = computed(() => quickRowsOf(climate.value, modsTable.value, areaM.value))

// 电费卡
const hoursNum = computed(() => {
  const n = parseNum(hoursInput.value)
  if (n === null) return 600
  return Math.max(1, Math.min(8000, n))
})
const priceNum = computed(() => {
  const n = parseNum(priceInput.value)
  if (n === null) return 0.6
  return Math.max(0, Math.min(5, n))
})
const eer = computed(() => {
  const n = Number(eerSelect.value)
  return Number.isFinite(n) && n > 0 ? n : 3.5
})
const energyText = computed(() => fmtRounded(energyKwhOf(load.value, hoursNum.value, eer.value)))
const costText = computed(() => fmtRounded(costOf(load.value, hoursNum.value, eer.value, priceNum.value)))
const inputPowerText = computed(() => fmtInt(inputPowerOf(load.value, eer.value)))

function fmtRounded(n) {
  if (!Number.isFinite(n)) return '—'
  return n >= 100 ? String(Math.round(n)) : String(Math.round(n * 10) / 10)
}

// ---------- 交互处理 ----------
function toggleMod(id) {
  mods.value = { ...mods.value, [id]: !mods.value[id] }
}

function applyPreset(p) {
  areaInput.value = p.area
  heightInput.value = p.height
  climate.value = p.climate
  usage.value = p.usage
  mods.value = { ...p.mods }
  reverseModelId.value = ''
}

function resetAll() {
  areaInput.value = DEFAULTS.area
  heightInput.value = DEFAULTS.height
  climate.value = DEFAULTS.climate
  usage.value = DEFAULTS.usage
  mods.value = { ...DEFAULTS.mods }
  hoursInput.value = DEFAULTS.hours
  priceInput.value = DEFAULTS.price
  eerSelect.value = DEFAULTS.eer
  reverseModelId.value = ''
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('ac-btu-calculator')
})
</script>
