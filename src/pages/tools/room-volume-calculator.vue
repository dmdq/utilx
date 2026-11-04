<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Layers class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">房间面积与体积计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按矩形房间长×宽×高算地面 / 顶面 / 扣门窗后的净墙面与立方米容积，一步换算乳胶漆升数与 18L/5L 桶装建议，附带空调冷负荷速估与搬家容积口径</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线房间面积体积计算器：装修买涂料、空调定匹数、搬家报容积，依据都是同一间房。输入长宽高并填写门窗尺寸，
        工具按「四面墙毛面积 =（长+宽）×2×层高、净墙面 = 毛 − 门窗、地面 = 顶面 = 长×宽、体积 = 长×宽×高」逐项可追溯地算出，
        再把涂刷面积换算成乳胶漆升数、向上取整给出 18L / 5L / 1L 整桶组合，同时输出简易冷负荷与搬仓立方米。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 口径说明条 -->
    <p class="text-xs leading-relaxed p-3 rounded-lg bg-muted/60 border border-border text-muted-foreground flex items-start gap-2 mb-6">
      <Info class="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
      <span>按矩形房间（长×宽×高）计算，门窗按输入扣除；异形房间分块相加。涂料覆盖率为厂商标称值参考，实际涂刷遍数与稀释请照产品说明。</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左列：输入面板 -->
      <div class="space-y-6">
        <!-- 房间尺寸 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 房间尺寸
          </h2>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5" for="rvc-length">长（m）</label>
              <input id="rvc-length" v-model="lengthInput" type="text" inputmode="decimal" placeholder="如 4"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5" for="rvc-width">宽（m）</label>
              <input id="rvc-width" v-model="widthInput" type="text" inputmode="decimal" placeholder="如 3.8"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5" for="rvc-height">层高（m）</label>
              <input id="rvc-height" v-model="heightInput" type="text" inputmode="decimal" placeholder="如 2.86"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          <div>
            <label class="block text-xs text-muted-foreground mb-1.5" for="rvc-name">房间名称（选填，标注在示意图上）</label>
            <input id="rvc-name" v-model="roomNameInput" type="text" maxlength="12" placeholder="如 主卧"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed">内净尺寸为准（不含抹灰）；异形房间按矩形分块各算一遍再相加。</p>
        </div>

        <!-- 门窗洞口 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <TriangleAlert class="w-5 h-5 mr-2 text-primary" /> 门窗洞口（选填）
          </h2>
          <div>
            <p class="text-sm font-medium text-foreground mb-2">门（默认单扇 0.9 × 2.05 m ≈ 1.845 ㎡）</p>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs text-muted-foreground mb-1.5" for="rvc-door-count">扇数</label>
                <input id="rvc-door-count" v-model="doorCountInput" type="text" inputmode="numeric" placeholder="如 1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label class="block text-xs text-muted-foreground mb-1.5" for="rvc-door-w">宽（m）</label>
                <input id="rvc-door-w" v-model="doorWInput" type="text" inputmode="decimal" placeholder="0.9"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label class="block text-xs text-muted-foreground mb-1.5" for="rvc-door-h">高（m）</label>
                <input id="rvc-door-h" v-model="doorHInput" type="text" inputmode="decimal" placeholder="2.05"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>
          </div>
          <div>
            <p class="text-sm font-medium text-foreground mb-2">窗（单窗宽 × 高 × 扇数）</p>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs text-muted-foreground mb-1.5" for="rvc-win-count">扇数</label>
                <input id="rvc-win-count" v-model="winCountInput" type="text" inputmode="numeric" placeholder="如 1"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label class="block text-xs text-muted-foreground mb-1.5" for="rvc-win-w">宽（m）</label>
                <input id="rvc-win-w" v-model="winWInput" type="text" inputmode="decimal" placeholder="1.5"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label class="block text-xs text-muted-foreground mb-1.5" for="rvc-win-h">高（m）</label>
                <input id="rvc-win-h" v-model="winHInput" type="text" inputmode="decimal" placeholder="1.4"
                  class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>
          </div>
          <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>贴墙柜、衣柜占住的墙在装柜前照样要刷，不扣除；只扣门、窗、垭口这类永久留空的洞口。</span>
          </p>
        </div>

        <!-- 涂料参数 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <PaintBucket class="w-5 h-5 mr-2 text-primary" /> 涂料参数
          </h2>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-muted-foreground mb-1.5" for="rvc-coats">涂刷遍数</label>
              <select id="rvc-coats" v-model="coatsSelect"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option v-for="c in COAT_OPTIONS" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1.5" for="rvc-spread">覆盖率（㎡/L·遍）</label>
              <input id="rvc-spread" v-model="spreadInput" type="text" inputmode="decimal" placeholder="默认 12"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            涂刷范围按「净墙面 + 顶面」计，地面不刷；12 ㎡/L·遍 是主流乳胶漆厂商标称展开率参考值，深色漆、粗糙基面会更费。
          </p>
        </div>

        <!-- 快速预设 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Play class="w-5 h-5 mr-2 text-primary" /> 快速预设
          </h2>
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
          <label class="flex items-start gap-2 text-sm text-foreground cursor-pointer pt-1">
            <input v-model="sunFlag" type="checkbox" class="mt-1 accent-[var(--primary,currentColor)]" />
            <span>
              <span class="font-medium">西晒 / 顶层</span>
              <span class="block text-[11px] text-muted-foreground">空调速估按 ×1.10 修正，与空调匹数计算器口径一致</span>
            </span>
          </label>
        </div>
      </div>

      <!-- 右列：结果面板（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 几何结果六格 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Ruler class="w-5 h-5 mr-2 text-primary" /> 房间几何
            </h2>
            <span class="text-[10px] font-mono text-muted-foreground">{{ dimsText }}</span>
          </div>

          <div v-if="!geo" class="text-sm text-muted-foreground p-4 rounded-lg bg-muted/50 flex items-start gap-2">
            <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>{{ inputMsg }}</span>
          </div>

          <div v-else class="space-y-4">
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div class="bg-primary/10 rounded-lg p-4">
                <p class="text-[10px] text-muted-foreground mb-1">地面面积</p>
                <p class="text-2xl font-bold text-primary font-mono">{{ formatAreaOf(geo.floor) }}<span class="text-xs font-normal text-muted-foreground ml-0.5">㎡</span></p>
                <p class="text-[10px] text-muted-foreground mt-1">买地板 / 瓷砖的口径</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-[10px] text-muted-foreground mb-1">顶面面积</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ formatAreaOf(geo.ceiling) }}<span class="text-xs font-normal text-muted-foreground ml-0.5">㎡</span></p>
                <p class="text-[10px] text-muted-foreground mt-1">= 地面（平顶假设）</p>
              </div>
              <div class="bg-primary/10 rounded-lg p-4">
                <p class="text-[10px] text-muted-foreground mb-1">墙面净（扣门窗）</p>
                <p class="text-2xl font-bold text-primary font-mono">{{ formatAreaOf(geo.wallsNet) }}<span class="text-xs font-normal text-muted-foreground ml-0.5">㎡</span></p>
                <p class="text-[10px] text-muted-foreground mt-1">刷漆 / 贴墙纸的口径</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-[10px] text-muted-foreground mb-1">门窗扣减合计</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ formatAreaOf(geo.openingsTotal) }}<span class="text-xs font-normal text-muted-foreground ml-0.5">㎡</span></p>
                <p class="text-[10px] text-muted-foreground mt-1">{{ openingsSummary }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-[10px] text-muted-foreground mb-1">四面墙毛</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ formatAreaOf(geo.wallsGross) }}<span class="text-xs font-normal text-muted-foreground ml-0.5">㎡</span></p>
                <p class="text-[10px] text-muted-foreground mt-1">(长+宽)×2×层高</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-[10px] text-muted-foreground mb-1">房间体积</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ formatAreaOf(geo.volume) }}<span class="text-xs font-normal text-muted-foreground ml-0.5">m³</span></p>
                <p class="text-[10px] text-muted-foreground mt-1">搬仓 / 新风量口径</p>
              </div>
            </div>
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              净墙 {{ formatAreaOf(geo.wallsNet) }} ㎡ = 毛 {{ formatAreaOf(geo.wallsGross) }} ㎡ − 门窗 {{ formatAreaOf(geo.openingsTotal) }} ㎡；
              贴墙柜不扣除——装柜前的墙照样要刷（见下方说明）。
            </p>
          </div>
        </div>

        <!-- 涂料用量卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-semibold flex items-center">
              <PaintBucket class="w-5 h-5 mr-2 text-primary" /> 乳胶漆用量与桶装建议
            </h2>
            <span class="text-[10px] font-mono text-muted-foreground">墙面净 + 顶面</span>
          </div>

          <div v-if="!geo" class="text-sm text-muted-foreground p-4 rounded-lg bg-muted/50 flex items-start gap-2">
            <Info class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>填好长宽高后自动换算涂刷面积与用漆量。</span>
          </div>

          <div v-else class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-[10px] text-muted-foreground mb-1">涂刷面积（净墙+顶面）</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ formatAreaOf(paintArea) }}<span class="text-xs font-normal text-muted-foreground ml-0.5">㎡</span></p>
              </div>
              <div class="bg-primary/10 rounded-lg p-4">
                <p class="text-[10px] text-muted-foreground mb-1">理论需漆（{{ coatsNum }} 遍 ÷ {{ spreadNum }} ㎡/L）</p>
                <p class="text-2xl font-bold text-primary font-mono">{{ paintText }}<span class="text-xs font-normal text-muted-foreground ml-0.5">L</span></p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-[10px] text-muted-foreground mb-1">向上取整（0.5L 档）</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ litersText }}<span class="text-xs font-normal text-muted-foreground ml-0.5">L</span></p>
              </div>
            </div>

            <div class="border border-primary/30 bg-primary/5 rounded-lg p-4">
              <p class="text-xs font-medium text-primary mb-1">整桶购买建议（18L 大桶 / 5L 中桶 / 1L 小桶，贪心组合）</p>
              <p class="text-xl font-bold text-foreground font-mono">{{ cansText }}</p>
              <p v-if="pick && pick.parts.length" class="text-xs text-muted-foreground mt-1.5">{{ cansNote }}</p>
            </div>

            <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>一底两面是常见工艺：需要底漆时把「遍数」按面漆计，底漆另按一遍加量；兑水比例、喷涂（更费）与滚涂差异请以产品说明为准。</span>
            </p>
          </div>
        </div>

        <!-- 空调速估卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 空调冷负荷速估（与空调工具联动）
          </h2>
          <div v-if="!ac" class="text-sm text-muted-foreground p-4 rounded-lg bg-muted/50 flex items-start gap-2">
            <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>{{ inputMsg }}</span>
          </div>
          <div v-else class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div class="bg-primary/10 rounded-lg p-4">
                <p class="text-[10px] text-muted-foreground mb-1">估算制冷量</p>
                <p class="text-2xl font-bold text-primary font-mono">{{ ac.loadW }}<span class="text-xs font-normal text-muted-foreground ml-0.5">W</span></p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-[10px] text-muted-foreground mb-1">匹数（1 匹 = 2500 W）</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ ac.ps }}<span class="text-xs font-normal text-muted-foreground ml-0.5">匹</span></p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4">
                <p class="text-[10px] text-muted-foreground mb-1">就近建议档</p>
                <p class="text-lg font-bold text-foreground mt-1">{{ acAdvice }}</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              基准 {{ areaText }} ㎡ × 160 W/㎡（与空调工具的「北方普通」档同口径）{{ acNotesText }}
            </p>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
              <span>
                挑高房间（体积 ÷ 地面 > 3.5 m）已按体积上浮修正；气候带、大开窗、保温差等工况请去
                <NuxtLink to="/tools/ac-btu-calculator" class="text-primary font-medium hover:underline">空调匹数 BTU 计算器</NuxtLink>
                精确选型。
              </span>
            </p>
          </div>
        </div>

        <!-- 平面示意图 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 平面示意（俯视）
          </h2>
          <div v-if="svgHtml" class="space-y-2">
            <div class="rounded-lg border border-border bg-muted/30 py-3 px-2" v-html="svgHtml"></div>
            <p class="text-[11px] text-muted-foreground flex items-center gap-3">
              <span><i class="inline-block w-4 h-[3px] bg-primary align-middle mr-1 rounded-sm"></i>墙体</span>
              <span><i class="inline-block w-4 h-[3px] bg-amber-500 align-middle mr-1 rounded-sm"></i>门（弧线为开门方向）</span>
              <span><i class="inline-block w-4 h-[3px] bg-sky-500 align-middle mr-1 rounded-sm"></i>窗（顶墙缺口）</span>
            </p>
          </div>
          <p v-else class="text-sm text-muted-foreground p-4 rounded-lg bg-muted/50 flex items-start gap-2">
            <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>输入有效的长宽后显示示意图。</span>
          </p>
        </div>

        <!-- 搬仓容积卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Layers class="w-5 h-5 mr-2 text-primary" /> 搬家 / 阁楼容积
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">本房间几何体积</p>
              <p class="text-3xl font-bold text-primary font-mono">{{ storageText }}<span class="text-sm font-normal text-muted-foreground ml-1">m³</span></p>
              <p class="text-xs text-muted-foreground mt-1.5">长 × 宽 × 层高</p>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              搬家报价按「立方数」口径：报几何体积即可，实际装车按 0.6–0.7 的装载率折算可用方数；
              阁楼 / 仓库储物同理——单间立方米直接复用本页体积，全屋把各房间相加。
              面积想换算瓷砖块数与损耗，见
              <NuxtLink to="/tools/tile-calculator" class="text-primary font-medium hover:underline">瓷砖用量计算器</NuxtLink>；
              墙纸按卷算，见
              <NuxtLink to="/tools/wallpaper-calculator" class="text-primary font-medium hover:underline">墙纸用量计算器</NuxtLink>。
            </p>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>房间面积与体积计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是一款面向装修备料、空调选型与搬家估方的几何计算工具。它把一间矩形房间拆成四个口径：
          地面 = 顶面 = 长×宽；四面墙毛面积 =（长+宽）×2×层高；净墙面 = 毛面积 − 门窗洞口合计；体积 = 长×宽×高。
          在此之上换算三件事——乳胶漆升数（涂刷面积 = 净墙 + 顶面，按覆盖率与遍数折算，向上取整到 0.5L 并给出 18L/5L/1L 整桶组合）、
          空调冷负荷速估（面积 × 160 W/㎡ 基准 + 层高/西晒修正），以及搬家按立方报量的体积口径。
          全部计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">墙面面积为什么不是「地面 ×3」就完</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          「地面面积 ×3」是老师傅的速估口诀：层高 2.8 m 的方正房间，四面墙毛面积 ÷ 地面 = 2(l+w)×2.8÷(l×w)，
          4×4 的房间约 2.8 倍、5×3 约 3.0 倍，所以乘 3 大致够买料。但它有三处系统性偏差：
          一是没扣门窗，一间卧室洞口通常占墙 4–8 ㎡，速估直接多买半桶漆；
          二是房间形状，长条房（6×3）周长/面积比更高，实际约 3.4 倍，方正大房间（5×5）只有 2.24 倍；
          三是层高，2.6 m 精装层高乘 3 会买多，3.3 m 挑高乘 3 会买少。本工具用「周长×层高 − 洞口」的净面积口径，
          每个数字都能拿卷尺核对，这就是和口诀估料的核心差别。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">涂料一桶能刷多少平方（涂刷率）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          厂商标称的乳胶漆展开率约 12–14 ㎡/L·遍（一遍、干膜约 30–40 μm），换算成桶：5L 桶一遍约 60 ㎡、
          18L 桶一遍约 216 ㎡，这是本页 12 ㎡/L 默认口径的来源。家装通常「一底两面」，两遍面漆就把涂刷面积翻倍再除覆盖率；
          深色漆遮盖难、喷涂损耗大（可比滚涂多 20–30%）、基面粗糙吸水都会拉低实际展开率，所以本页结果向上取整到 0.5L，
          再按整桶贪心组合给出「宁可多一点点」的买法。开罐后剩余漆若不足整桶规格，优先凑小桶补货避免色差。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么门窗要扣、贴墙柜面积不扣</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          门窗洞口是永久留空的：装完门套窗套后漆刷不到，必须扣除，否则多算的 4–8 ㎡ 会让你白花小半桶漆。
          贴墙大柜、衣柜则相反——正常工序是「先刷墙、后装柜」，柜子背后的墙今天照样要刷一遍底漆两遍面漆防霉防潮，
          所以不能从涂刷面积里扣；只有日后可能移走的家具占的墙更不该扣。若你确定「先装柜后补漆」或柜体到顶不刷背墙，
          可以把柜子正面尺寸临时填成「门」来扣减，这只是同一公式的变通用法。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">层高多少算挑高，对空调有什么影响</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          住宅常规层高 2.6–3.0 m；净高超过 3.5 m 一般就叫挑高 / 复式上空了。冷负荷不只跟面积走：
          热空气上浮、空间储冷量更大，同样 15 ㎡ 的地面，3.5 m 以上层高需要的制冷量明显更高，
          所以本页速估在「体积 ÷ 地面 > 3.5 m」时按每超 0.5 m 加一成（封顶 ×1.2）修正，并勾上西晒 ×1.10——
          与空调匹数计算器的经验系数同口径。Loft、楼梯间上空这类异形空间别用口诀，直接拿体积立方米去
          <NuxtLink to="/tools/ac-btu-calculator" class="text-primary font-medium hover:underline">空调匹数 BTU 计算器</NuxtLink>
          按气候带逐项修正更稳妥。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">搬家用的立方数怎么报</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          跨城搬家按车报价的「几立方」指货物实占体积，而货运公司问房间时常按几何体积粗估：长×宽×高直接报即可，
          本页「房间体积」一格就是这个数（如 4×3.8×2.86 ≈ 43.5 m³）。实际装车受家具形态影响，装载率大约 0.6–0.7，
          三间卧室 + 客厅报 120–150 m³ 通常对应 4.2 米厢车；阁楼、地下室储物货架则按净体积扣去梁柱。
          全屋清单逐个房间算完相加，比「大概几车」的估算更容易比价防坑。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">墙面面积用「地面 ×3」估算行不行？</h3>
            <p class="text-sm text-muted-foreground mt-1">买料速估可以，下料别用它。×3 只在层高约 2.8 m、方正且洞口少的房间接近毛墙面积，没扣门窗、没反映长条房与挑高的偏差。本工具按「(长+宽)×2×层高 − 门窗」算净面积，每一项都能拿卷尺核对。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">一桶乳胶漆能刷多少平方？</h3>
            <p class="text-sm text-muted-foreground mt-1">按厂商标称展开率约 12–14 ㎡/L·遍：5L 桶一遍约 60 ㎡，18L 桶一遍约 216 ㎡。家装一底两面按两遍面漆计，涂刷面积（净墙 + 顶面）翻倍再折算升数，本页向上取整到 0.5L 并给出整桶组合。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">算涂料面积时衣柜的墙要不要扣？</h3>
            <p class="text-sm text-muted-foreground mt-1">不扣。正常工序先刷墙后装柜，柜子背后的墙照样要刷以防潮发霉；门窗洞口是永久留空才必须扣。若确定装柜后不再刷背墙，可把柜体正面当「门」填进去扣减。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">层高多少算挑高？对空调有什么影响？</h3>
            <p class="text-sm text-muted-foreground mt-1">净高超 3.5 m 一般视为挑高。同样面积层越高储冷量越大、所需制冷量越高，本页在体积 ÷ 地面 > 3.5 m 时按每超 0.5 m 加一成修正（封顶 ×1.2），西晒/顶层再 ×1.10，精确选型请去空调匹数计算器。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">搬家报价问「几个立方」怎么回答？</h3>
            <p class="text-sm text-muted-foreground mt-1">直接报房间几何体积（长×宽×高），全屋各房间相加；实际装车按约 0.6–0.7 装载率折算。阁楼或仓库储物同理，本工具的体积格就是立方米口径。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。尺寸、门窗、涂料换算与冷负荷速估全部在你的浏览器中即时完成，不发送任何网络请求，刷新页面即恢复默认输入。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'room-volume-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Layers, Ruler, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, PaintBucket
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '房间面积与体积计算器 - 刷墙面积/乳胶漆用量/立方米在线计算',
  description: '免费在线房间面积体积计算器：按长×宽×高算地面、顶面、扣门窗后的净墙面与立方米容积，换算乳胶漆升数与 18L/5L 整桶建议，附空调冷负荷速估与搬家容积口径，装修买料、空调匹配、搬仓估方一站搞定，纯浏览器本地运行不上传',
  keywords: '房间面积计算,刷墙面积计算,房间立方米,乳胶漆用量,空调制冷量匹配',
  author: '有条工具',
  ogTitle: '房间面积与体积计算器 - 刷墙面积/乳胶漆用量/立方米 | 有条工具',
  ogDescription: '输入长宽高与门窗尺寸，算净墙面、地面、体积，换算乳胶漆升数与整桶组合，附空调匹数速估和搬家立方数。',
  ogUrl: 'https://www.util.cn/tools/room-volume-calculator',
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
          name: '房间面积与体积计算器',
          url: 'https://www.util.cn/tools/room-volume-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '地面/顶面/四面墙毛面积与扣门窗净墙面',
            '房间立方米体积（搬仓/阁楼/新风口径）',
            '乳胶漆升数换算与 18L/5L/1L 整桶贪心建议',
            '空调冷负荷速估（160 W/㎡ 基准 + 挑高/西晒修正）',
            '俯视平面示意（长宽标注 + 门窗缺口）',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '房间面积与体积计算器', item: 'https://www.util.cn/tools/room-volume-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '墙面面积用「地面×3」估算行不行？',
              acceptedAnswer: { '@type': 'Answer', text: '买料速估可以，下料别用它。×3 只在层高约 2.8 m、方正且洞口少的房间接近毛墙面积，没扣门窗、没反映长条房与挑高的偏差。本工具按（长+宽）×2×层高减门窗算净面积，每一项都能拿卷尺核对。' }
            },
            {
              '@type': 'Question',
              name: '一桶乳胶漆能刷多少平方？',
              acceptedAnswer: { '@type': 'Answer', text: '按厂商标称展开率约 12 至 14 ㎡/L·遍：5L 桶一遍约 60 ㎡，18L 桶一遍约 216 ㎡。家装一底两面按两遍面漆计，涂刷面积（净墙面加顶面）翻倍再折算升数，结果向上取整到 0.5L 并给出整桶组合。' }
            },
            {
              '@type': 'Question',
              name: '算涂料面积时衣柜的墙要不要扣？',
              acceptedAnswer: { '@type': 'Answer', text: '不扣。正常工序先刷墙后装柜，柜子背后的墙照样要刷以防潮发霉；门窗洞口是永久留空才必须扣除。若确定装柜后不再刷背墙，可把柜体正面尺寸当门填进去扣减。' }
            },
            {
              '@type': 'Question',
              name: '层高多少算挑高？对空调有什么影响？',
              acceptedAnswer: { '@type': 'Answer', text: '住宅常规层高 2.6 至 3.0 m，净高超过 3.5 m 一般视为挑高。同样面积层越高储冷量越大、所需制冷量越高，本工具在体积除以地面大于 3.5 m 时按每超 0.5 m 加一成修正（封顶 1.2 倍），西晒顶层再乘 1.10，精确选型请用空调匹数 BTU 计算器。' }
            },
            {
              '@type': 'Question',
              name: '搬家报价问几个立方怎么回答？',
              acceptedAnswer: { '@type': 'Answer', text: '直接报房间几何体积（长×宽×高），全屋各房间相加；实际装车按约 0.6 至 0.7 装载率折算。阁楼或仓库储物同理，本工具的房间体积格就是立方米口径。' }
            },
            {
              '@type': 'Question',
              name: '计算数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。尺寸、门窗、涂料换算与冷负荷速估全部在浏览器本地即时完成，不发送任何网络请求，刷新页面即恢复默认输入。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 口径：涂刷面积 = 净墙面（扣门窗）+ 顶面；覆盖率默认 12 ㎡/L·遍（厂商标称展开率参考）
const DEFAULT_SPREAD = 12
// 整桶规格：18L 大桶 / 5L 中桶 / 1L 小桶
const CAN_SIZES = [18, 5, 1]
// 单门默认尺寸 0.9×2.05 m ≈ 1.845 ㎡（常见成品门洞）
const DEFAULT_DOOR = { w: 0.9, h: 2.05 }
// 冷负荷速估基准：160 W/㎡，与空调匹数计算器的「北方普通」档一致
const AC_BASE_W_PER_M2 = 160
const AC_PS_WATTS = 2500 // 1 匹 = 2500 W 制冷量（同空调工具口径）
const AC_LOFT_H = 3.5 // 体积÷地面 超此层高视为挑高
const SUN_FACTOR = 1.1 // 西晒/顶层修正（同空调工具经验值）

const COAT_OPTIONS = [
  { value: '1', label: '1 遍（修补/罩面）' },
  { value: '2', label: '2 遍（一底两面面漆）' },
  { value: '3', label: '3 遍（深色/翻新加强）' }
]

// 解析输入数字：空串/非法返回 null
function parseNum(text) {
  const s = String(text ?? '').trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

// 面积格式化：2 位小数；非法返回 '—'
function formatAreaOf(m2) {
  if (!Number.isFinite(m2)) return '—'
  return m2.toFixed(2)
}

// 门窗洞口清单：只收录三要素都有效的项（数量可为 0 → 跳过）
// doorCount×(doorW×doorH) + winCount×(winW×winH)，扣减只看合计、与先后顺序无关
function openingsListOf(doorCount, doorW, doorH, winCount, winW, winH) {
  const list = []
  if (Number.isFinite(doorCount) && doorCount > 0 && doorW > 0 && doorH > 0) {
    list.push({ kind: 'door', w: doorW, h: doorH, count: Math.floor(doorCount) })
  }
  if (Number.isFinite(winCount) && winCount > 0 && winW > 0 && winH > 0) {
    list.push({ kind: 'window', w: winW, h: winH, count: Math.floor(winCount) })
  }
  return list
}

// 房间几何：地面=顶面=l·w；四面墙毛=2(l+w)·h；净=毛−门窗（不为负）；体积=l·w·h
function roomGeometryOf(l, w, h, openings) {
  if (!Number.isFinite(l) || !Number.isFinite(w) || !Number.isFinite(h)) return null
  if (l <= 0 || w <= 0 || h <= 0) return null
  const floor = l * w
  const wallsGross = 2 * (l + w) * h
  let openingsTotal = 0
  for (const o of (Array.isArray(openings) ? openings : [])) {
    if (o && Number.isFinite(o.w * o.h * o.count) && o.count > 0 && o.w > 0 && o.h > 0) {
      openingsTotal += o.w * o.h * o.count
    }
  }
  const wallsNet = Math.max(0, wallsGross - openingsTotal)
  return { floor, ceiling: floor, wallsGross, openingsTotal, wallsNet, volume: l * w * h }
}

// 乳胶漆升数：升 = 涂刷面积 × 遍数 ÷ 覆盖率；精确值另存，liters 向上取整到 0.5L
// 遍数夹在 1–3；面积/覆盖率非法返回 null
function paintCoverageOf(netWallCeilArea, coats, spread) {
  if (!Number.isFinite(netWallCeilArea) || netWallCeilArea < 0) return null
  const n = Math.min(3, Math.max(1, Math.round(Number.isFinite(coats) ? coats : 1)))
  const sp = Number.isFinite(spread) && spread > 0 ? spread : DEFAULT_SPREAD
  const exact = (netWallCeilArea * n) / sp
  const liters = Math.ceil(exact * 2) / 2
  return { area: netWallCeilArea, coats: n, spread: sp, exact, liters }
}

// 整桶贪心：先凑满 18L，再凑 5L；余量 ≤1L 用 1L 小桶向上取整，1–5L 余量并成一桶 5L
// 例：31.5L → 18L×1 + 5L×3（共 33L，多 1.5L）
function pickCansOf(liters) {
  if (!Number.isFinite(liters) || liters < 0) return null
  if (liters <= 0) return { parts: [], totalL: 0, overL: 0 }
  let rem = liters
  const counts = CAN_SIZES.map(() => 0)
  counts[0] = Math.floor(rem / CAN_SIZES[0])
  rem = Math.round((rem - counts[0] * CAN_SIZES[0]) * 1000) / 1000
  counts[1] = Math.floor(rem / CAN_SIZES[1])
  rem = Math.round((rem - counts[1] * CAN_SIZES[1]) * 1000) / 1000
  if (rem > 0) {
    if (rem <= 1) counts[2] = Math.ceil(rem)
    else counts[1] += 1
  }
  const parts = []
  CAN_SIZES.forEach((size, i) => {
    if (counts[i] > 0) parts.push({ size, count: counts[i] })
  })
  const totalL = Math.round(parts.reduce((s, p) => s + p.size * p.count, 0) * 10) / 10
  return { parts, totalL, overL: Math.round((totalL - liters) * 10) / 10 }
}

// 桶装组合文字
function cansTextOf(pick) {
  if (!pick) return '—'
  if (!pick.parts.length) return '0 L（无需购漆）'
  return pick.parts.map((p) => `${p.size}L×${p.count}`).join(' + ')
}

// 冷负荷速估：面积×160 W/㎡ 基准；层高(体积÷地面)>3.5 m 按每超 0.5 m 加一成（封顶 ×1.2）；西晒/顶层 ×1.1
function acLoadOf(volume, area, sunFlag) {
  if (!Number.isFinite(volume) || volume <= 0) return null
  if (!Number.isFinite(area) || area <= 0) return null
  const effH = volume / area
  let w = area * AC_BASE_W_PER_M2
  const notes = []
  if (effH > AC_LOFT_H) {
    const f = Math.min(1.2, Math.round((1 + (effH - AC_LOFT_H) * 0.2) * 100) / 100)
    w *= f
    notes.push(`层高 ${effH.toFixed(1)} m 属挑高，体积修正 ×${f.toFixed(2)}`)
  }
  if (sunFlag) {
    w *= SUN_FACTOR
    notes.push(`西晒/顶层 ×${SUN_FACTOR}`)
  }
  const loadW = Math.round(w)
  return { loadW, ps: Math.round((loadW / AC_PS_WATTS) * 10) / 10, effH, notes }
}

// 匹数 → 就近在售档建议
function acAdviceOf(loadW) {
  const ps = loadW / AC_PS_WATTS
  if (!Number.isFinite(ps) || ps <= 0) return '—'
  if (ps <= 1.1) return '大 1 匹（26 型）'
  if (ps <= 1.5) return '1.5 匹（35 型）'
  if (ps <= 2.2) return '2 匹（50 型）'
  return '3 匹（72 型）或分体两台'
}

// 搬仓 / 阁楼立方米：复用体积公式，保留 2 位小数
function storageVolumeOf(l, w, h) {
  if (!Number.isFinite(l) || !Number.isFinite(w) || !Number.isFinite(h)) return null
  if (l <= 0 || w <= 0 || h <= 0) return null
  return Math.round(l * w * h * 100) / 100
}

// SVG 文本转义（防止房间名等注入标记）
function escapeSvgText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const n2 = (v) => Math.round(v * 100) / 100

// 俯视平面示意：墙体（缺口示门）、顶墙窗洞、长宽标注；输出已转义的 SVG 字符串
function roomSvg(l, w, h, opts) {
  if (!Number.isFinite(l) || !Number.isFinite(w) || l <= 0 || w <= 0) return ''
  const o = opts || {}
  const name = o.name ? escapeSvgText(String(o.name)) : ''
  const doorW = Number.isFinite(o.doorW) && o.doorW > 0 ? Math.min(o.doorW, l) : 0
  const winW = Number.isFinite(o.winW) && o.winW > 0 ? Math.min(o.winW, l / 3) : 0
  const winCount = Math.min(2, Math.max(0, Math.floor(Number.isFinite(o.winCount) ? o.winCount : 0)))
  const VW = 340
  const VH = 240
  const k = Math.min((VW - 120) / l, (VH - 120) / w)
  const rw = l * k
  const rh = w * k
  const x0 = (VW - rw) / 2
  const y0 = (VH - rh) / 2 + 8
  const x1 = x0 + rw
  const y1 = y0 + rh
  const parts = []
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" role="img" class="w-full max-w-md mx-auto block" aria-label="房间平面示意">`)
  parts.push(`<rect x="${n2(x0)}" y="${n2(y0)}" width="${n2(rw)}" height="${n2(rh)}" class="fill-primary/5" stroke="none"/>`)
  // 左/右墙 + 底墙（留门缺口）
  const dw = doorW * k
  const gapX = x0 + rw * 0.14
  const gx1 = Math.min(gapX, x1 - 8)
  const gx2 = Math.min(gx1 + dw, x1)
  parts.push(`<g class="text-primary" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none">`)
  parts.push(`<line x1="${n2(x0)}" y1="${n2(y0)}" x2="${n2(x0)}" y2="${n2(y1)}"/>`)
  parts.push(`<line x1="${n2(x1)}" y1="${n2(y0)}" x2="${n2(x1)}" y2="${n2(y1)}"/>`)
  parts.push(`<line x1="${n2(x0)}" y1="${n2(y1)}" x2="${n2(gx1)}" y2="${n2(y1)}"/>`)
  parts.push(`<line x1="${n2(gx2)}" y1="${n2(y1)}" x2="${n2(x1)}" y2="${n2(y1)}"/>`)
  // 顶墙（留窗缺口）
  const winGaps = []
  for (let i = 0; i < winCount; i++) {
    const cx = x0 + (rw * (i + 1)) / (winCount + 1)
    winGaps.push({ a: cx - (winW * k) / 2, b: cx + (winW * k) / 2, cx })
  }
  let cursor = x0
  for (const g of winGaps) {
    const a = Math.max(cursor, g.a)
    const b = Math.min(x1, g.b)
    if (a > cursor) parts.push(`<line x1="${n2(cursor)}" y1="${n2(y0)}" x2="${n2(a)}" y2="${n2(y0)}"/>`)
    cursor = b
  }
  if (cursor < x1) parts.push(`<line x1="${n2(cursor)}" y1="${n2(y0)}" x2="${n2(x1)}" y2="${n2(y0)}"/>`)
  parts.push(`</g>`)
  // 门：门扇线 + 开门弧线
  if (doorW > 0 && gx2 - gx1 > 2) {
    const r = gx2 - gx1
    parts.push(`<g class="text-amber-600" stroke="currentColor" stroke-width="1.5" fill="none">`)
    parts.push(`<line x1="${n2(gx1)}" y1="${n2(y1)}" x2="${n2(gx1)}" y2="${n2(y1 - r)}"/>`)
    parts.push(`<path d="M ${n2(gx2)} ${n2(y1)} A ${n2(r)} ${n2(r)} 0 0 1 ${n2(gx1)} ${n2(y1 - r)}"/>`)
    parts.push(`</g>`)
    parts.push(`<text x="${n2((gx1 + gx2) / 2)}" y="${n2(y1 - 6)}" text-anchor="middle" font-size="9" class="text-amber-600" fill="currentColor">门 ${escapeSvgText(formatAreaOf(doorW))} m</text>`)
  }
  // 窗：缺口处的双线窗框
  if (winCount > 0 && winW > 0) {
    parts.push(`<g class="text-sky-500" stroke="currentColor" stroke-width="1.5" fill="none">`)
    for (const g of winGaps) {
      parts.push(`<rect x="${n2(g.a)}" y="${n2(y0 - 2.5)}" width="${n2(g.b - g.a)}" height="5"/>`)
    }
    parts.push(`</g>`)
    parts.push(`<text x="${n2(winGaps[0].cx)}" y="${n2(y0 - 8)}" text-anchor="middle" font-size="9" class="text-sky-500" fill="currentColor">窗 ×${winCount}</text>`)
  }
  // 尺寸标注
  parts.push(`<g class="text-muted-foreground" fill="currentColor" font-size="11" font-family="ui-monospace,monospace">`)
  parts.push(`<text x="${n2((x0 + x1) / 2)}" y="${n2(y1 + 22)}" text-anchor="middle">长 ${escapeSvgText(formatAreaOf(l))} m</text>`)
  parts.push(`<text transform="translate(${n2(x1 + 20)} ${n2((y0 + y1) / 2)}) rotate(-90)" text-anchor="middle">宽 ${escapeSvgText(formatAreaOf(w))} m</text>`)
  if (Number.isFinite(h) && h > 0) {
    parts.push(`<text x="${n2((x0 + x1) / 2)}" y="${n2(y0 - 22)}" text-anchor="middle">层高 ${escapeSvgText(formatAreaOf(h))} m${name ? ` · ${name}` : ''}</text>`)
  } else if (name) {
    parts.push(`<text x="${n2((x0 + x1) / 2)}" y="${n2(y0 - 22)}" text-anchor="middle">${name}</text>`)
  }
  parts.push(`</g>`)
  parts.push(`</svg>`)
  return parts.join('')
}

// ---------- 常量与默认值 ----------
const DEFAULTS = {
  length: '4.2',
  width: '3.6',
  height: '2.8',
  roomName: '',
  doorCount: '1',
  doorW: '0.9',
  doorH: '2.05',
  winCount: '1',
  winW: '1.5',
  winH: '1.4',
  coats: '2',
  spread: '12',
  sun: false
}

// 预设：① 15㎡ 卧室 4×3.8×2.86 一扇窗 1.5×1.4（门暂不扣，便于对照手算）② 客厅 5.2×4.5×2.9 双窗 + 两樘门
const presets = [
  {
    id: 'bed15',
    label: '15㎡ 卧室（4×3.8×2.86·单窗）',
    length: '4', width: '3.8', height: '2.86', roomName: '卧室',
    doorCount: '0', doorW: '0.9', doorH: '2.05',
    winCount: '1', winW: '1.5', winH: '1.4',
    coats: '2', spread: '12', sun: false
  },
  {
    id: 'living',
    label: '客厅（5.2×4.5×2.9·双窗）',
    length: '5.2', width: '4.5', height: '2.9', roomName: '客厅',
    doorCount: '2', doorW: '0.9', doorH: '2.05',
    winCount: '2', winW: '1.8', winH: '1.5',
    coats: '2', spread: '12', sun: true
  }
]

// ---------- 页面状态 ----------
const lengthInput = ref(DEFAULTS.length)
const widthInput = ref(DEFAULTS.width)
const heightInput = ref(DEFAULTS.height)
const roomNameInput = ref(DEFAULTS.roomName)
const doorCountInput = ref(DEFAULTS.doorCount)
const doorWInput = ref(DEFAULTS.doorW)
const doorHInput = ref(DEFAULTS.doorH)
const winCountInput = ref(DEFAULTS.winCount)
const winWInput = ref(DEFAULTS.winW)
const winHInput = ref(DEFAULTS.winH)
const coatsSelect = ref(DEFAULTS.coats)
const spreadInput = ref(DEFAULTS.spread)
const sunFlag = ref(DEFAULTS.sun)
const seoContentVisible = ref(true)

// 尺寸读数：非法 → NaN（纯函数用 Number.isFinite 拒绝）
function readDim(text, max) {
  const n = parseNum(text)
  if (n === null || n <= 0) return NaN
  return Math.min(n, max)
}
function readCount(text) {
  const n = parseNum(text)
  if (n === null || n < 0) return 0
  return Math.min(20, Math.floor(n))
}

const lM = computed(() => readDim(lengthInput.value, 200))
const wM = computed(() => readDim(widthInput.value, 200))
const hM = computed(() => readDim(heightInput.value, 20))

const openings = computed(() => openingsListOf(
  readCount(doorCountInput.value), readDim(doorWInput.value, 20), readDim(doorHInput.value, 8),
  readCount(winCountInput.value), readDim(winWInput.value, 20), readDim(winHInput.value, 8)
))

const geo = computed(() => roomGeometryOf(lM.value, wM.value, hM.value, openings.value))

const inputMsg = computed(() => {
  if (!geo.value) return '请输入有效的长、宽、层高（正数，单位米，如 4 × 3.8 × 2.86）。'
  return ''
})

const dimsText = computed(() => {
  if (!geo.value) return '—'
  return `${formatAreaOf(lM.value)}×${formatAreaOf(wM.value)}×${formatAreaOf(hM.value)} m`
})

const openingsSummary = computed(() => {
  if (!geo.value) return '—'
  const parts = openings.value.map((o) => `${o.kind === 'door' ? '门' : '窗'} ${o.count} 扇 × ${formatAreaOf(o.w * o.h)} ㎡`)
  return parts.length ? parts.join(' + ') : '未填门窗（按毛墙面计）'
})

const coatsNum = computed(() => {
  const n = Number(coatsSelect.value)
  return Number.isFinite(n) ? n : 2
})
const spreadNum = computed(() => {
  const n = parseNum(spreadInput.value)
  return n && n > 0 ? Math.min(n, 30) : DEFAULT_SPREAD
})

const paintArea = computed(() => (geo.value ? geo.value.wallsNet + geo.value.ceiling : null))
const paint = computed(() => (paintArea.value === null ? null : paintCoverageOf(paintArea.value, coatsNum.value, spreadNum.value)))
const paintText = computed(() => (paint.value ? paint.value.exact.toFixed(2) : '—'))
const litersText = computed(() => (paint.value ? String(paint.value.liters) : '—'))
const pick = computed(() => (paint.value ? pickCansOf(paint.value.liters) : null))
const cansText = computed(() => cansTextOf(pick.value))
const cansNote = computed(() => {
  if (!pick.value || !pick.value.parts.length) return ''
  return `共 ${pick.value.totalL} L，比需求多 ${pick.value.overL} L —— 买漆宁多勿少，余漆可补缝`
})

const ac = computed(() => (geo.value ? acLoadOf(geo.value.volume, geo.value.floor, sunFlag.value) : null))
const acAdvice = computed(() => (ac.value ? acAdviceOf(ac.value.loadW) : '—'))
const acNotesText = computed(() => {
  if (!ac.value) return ''
  const notes = ac.value.notes.map((s) => ` · ${s}`).join('')
  return `${notes} ≈ ${ac.value.loadW} W（速估口径，工况全修正请走下方链接）`
})
const areaText = computed(() => (geo.value ? formatAreaOf(geo.value.floor) : '—'))

const storageText = computed(() => {
  const v = storageVolumeOf(lM.value, wM.value, hM.value)
  return v === null ? '—' : formatAreaOf(v)
})

const svgHtml = computed(() => roomSvg(lM.value, wM.value, hM.value, {
  name: roomNameInput.value,
  doorW: readDim(doorWInput.value, 20),
  winW: readDim(winWInput.value, 20),
  winCount: readCount(winCountInput.value)
}))

// ---------- 交互处理 ----------
function applyPreset(p) {
  lengthInput.value = p.length
  widthInput.value = p.width
  heightInput.value = p.height
  roomNameInput.value = p.roomName
  doorCountInput.value = p.doorCount
  doorWInput.value = p.doorW
  doorHInput.value = p.doorH
  winCountInput.value = p.winCount
  winWInput.value = p.winW
  winHInput.value = p.winH
  coatsSelect.value = p.coats
  spreadInput.value = p.spread
  sunFlag.value = p.sun
}

function resetAll() {
  applyPreset({ ...DEFAULTS })
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('room-volume-calculator')
})
</script>
