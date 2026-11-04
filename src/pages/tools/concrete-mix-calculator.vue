<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <House class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">混凝土配合比计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">按浇筑体积与强度等级算水泥袋数、砂石吨数与用水量，含损耗、水灰比、备料清单与自拌 vs 商砼对比，农村自建房 / 院落硬化 / 小工程备料一站搞定</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线混凝土用量计算工具：输入长×宽×厚（或直接填方量 m³），选择 C20 / C25 / C30 / C35 强度等级，
        自动按每 m³ 参考配合比算出水泥（换算成 50kg/袋并向上取整）、砂、石子的吨数与用水量，附带 1%-10% 施工损耗；
        同时给出一料多用的一键备料清单（复制后去建材市场照念）、水灰比提示、商砼一车方能浇多厚的方量反推，
        以及自拌与商品混凝土的本单方省钱对比。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <p class="text-xs leading-relaxed p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-foreground flex items-start gap-2 mb-6">
      <Info class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <span>参考配合比取自 C20-C35 常用经验配比（重量法，中砂、42.5 水泥），实际以试验室试配与工地砂石含水率调整为准；结构承重浇筑请遵循设计图纸。</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：浇筑参数输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Package class="w-5 h-5 mr-2 text-primary" /> 浇筑参数
        </h2>

        <!-- 体积输入模式切换 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">浇筑体积</p>
          <div class="grid grid-cols-2 gap-1 bg-muted/60 rounded-lg p-1 mb-3">
            <button
              @click="mode = 'dim'"
              class="py-1.5 rounded-md text-sm font-medium transition"
              :class="mode === 'dim' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
            >尺寸计算</button>
            <button
              @click="mode = 'vol'"
              class="py-1.5 rounded-md text-sm font-medium transition"
              :class="mode === 'vol' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
            >直接填方量</button>
          </div>

          <div v-show="mode === 'dim'" class="grid grid-cols-3 gap-2">
            <label class="block">
              <span class="text-xs text-muted-foreground">长 (m)</span>
              <input v-model="len" type="number" min="0" step="0.01" class="mt-1 w-full px-2.5 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground" placeholder="10" />
            </label>
            <label class="block">
              <span class="text-xs text-muted-foreground">宽 (m)</span>
              <input v-model="width" type="number" min="0" step="0.01" class="mt-1 w-full px-2.5 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground" placeholder="4" />
            </label>
            <label class="block">
              <span class="text-xs text-muted-foreground">厚 (m)</span>
              <input v-model="thick" type="number" min="0" step="0.01" class="mt-1 w-full px-2.5 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground" placeholder="0.12" />
            </label>
          </div>
          <label v-show="mode === 'vol'" class="block">
            <span class="text-xs text-muted-foreground">方量 (m³)</span>
            <input v-model="volInput" type="number" min="0" step="0.001" class="mt-1 w-full px-2.5 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground" placeholder="1.5" />
          </label>

          <div class="mt-3 bg-primary/10 rounded-lg p-3 text-center">
            <p class="text-xs text-muted-foreground mb-1">净方量（不含损耗）</p>
            <p class="text-2xl font-bold text-primary">{{ netVolume.toFixed(3) }} m³</p>
          </div>
        </div>

        <!-- 强度等级 -->
        <label class="block">
          <span class="text-sm font-medium text-foreground">强度等级</span>
          <select v-model="grade" class="mt-1 w-full px-2.5 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground">
            <option v-for="g in gradeOptions" :key="g" :value="g">{{ g }}</option>
          </select>
          <span class="block text-[11px] text-muted-foreground mt-1">{{ gradeHint }}</span>
        </label>

        <!-- 损耗系数 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-1">损耗系数：<span class="text-primary font-bold">{{ waste }}%</span></p>
          <input v-model.number="waste" type="range" min="1" max="10" step="1" class="w-full accent-primary" />
          <p class="text-[11px] text-muted-foreground mt-1">地面摊垫取 2%-3%，坑槽浇筑 / 转运洒落多取 5%-8%。</p>
        </div>

        <!-- 常用预设 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">常用预设</p>
          <div class="space-y-2">
            <button
              v-for="p in presets"
              :key="p.name"
              @click="applyPreset(p)"
              class="w-full text-left px-3 py-2 bg-muted/50 hover:bg-muted/80 border border-border rounded-lg transition"
            >
              <span class="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Play class="w-3.5 h-3.5 text-primary flex-shrink-0" /> {{ p.name }}
              </span>
              <span class="block text-[11px] text-muted-foreground mt-0.5 ml-5">{{ p.desc }}</span>
            </button>
          </div>
        </div>

        <button
          @click="resetDefaults"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认参数
        </button>
      </div>

      <!-- 右：材料用量结果 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 备料用量（{{ grade }}）
          </h2>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
            水灰比 {{ waterCementRatio.toFixed(2) }}
          </span>
        </div>

        <p v-if="netVolume <= 0" class="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
          请输入有效的长×宽×厚或直接填写方量，结果区将实时给出水泥袋数、砂石吨数与用水量。
        </p>

        <template v-else>
          <p class="text-xs text-muted-foreground">
            净方量 {{ totals.netVolM3.toFixed(3) }} m³，含 {{ waste }}% 损耗按 <span class="font-semibold text-foreground">{{ totals.effVolM3.toFixed(3) }} m³</span> 备料。
          </p>

          <!-- 四材料结果卡 -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-muted/40 border border-border rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">水泥</p>
              <p class="text-4xl font-bold text-primary leading-tight">{{ totals.cementBags }}<span class="text-sm font-normal text-muted-foreground ml-0.5">袋</span></p>
              <p class="text-[11px] text-muted-foreground mt-1">50kg/袋 · 共约 {{ Math.round(totals.cementKg) }} kg</p>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">砂（中砂）</p>
              <p class="text-3xl font-bold text-foreground leading-tight mt-1.5">{{ totals.sandTons.toFixed(2) }}<span class="text-sm font-normal text-muted-foreground ml-0.5">吨</span></p>
              <p class="text-[11px] text-muted-foreground mt-1.5">约 {{ Math.round(totals.sandKg) }} kg</p>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">石子</p>
              <p class="text-3xl font-bold text-foreground leading-tight mt-1.5">{{ totals.stoneTons.toFixed(2) }}<span class="text-sm font-normal text-muted-foreground ml-0.5">吨</span></p>
              <p class="text-[11px] text-muted-foreground mt-1.5">约 {{ Math.round(totals.stoneKg) }} kg</p>
            </div>
            <div class="bg-muted/40 border border-border rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">水</p>
              <p class="text-3xl font-bold text-foreground leading-tight mt-1.5">{{ Math.round(totals.waterKg) }}<span class="text-sm font-normal text-muted-foreground ml-0.5">kg</span></p>
              <p class="text-[11px] text-muted-foreground mt-1.5">≈ {{ (totals.waterKg / 1000).toFixed(2) }} 吨 / {{ Math.round(totals.waterKg) }} L</p>
            </div>
          </div>

          <!-- 配合比明细表 -->
          <div>
            <h3 class="text-sm font-semibold text-foreground mb-2">配合比明细（每 m³ 参考用量 → 本单总量）</h3>
            <div class="overflow-x-auto border border-border rounded-lg">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-muted/60 text-left text-xs text-muted-foreground">
                    <th class="px-3 py-2 font-medium">材料</th>
                    <th class="px-3 py-2 font-medium text-right">每 m³ (kg)</th>
                    <th class="px-3 py-2 font-medium text-right">本单总量 (kg)</th>
                    <th class="px-3 py-2 font-medium text-right">换算</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in tableRows" :key="row.name" class="border-t border-border">
                    <td class="px-3 py-2 text-foreground">{{ row.name }}</td>
                    <td class="px-3 py-2 text-right font-mono">{{ row.perM3 }}</td>
                    <td class="px-3 py-2 text-right font-mono">{{ Math.round(row.totalKg) }}</td>
                    <td class="px-3 py-2 text-right text-muted-foreground">{{ row.extra }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 备料清单（可复制） -->
          <div class="bg-muted/40 border border-border rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-semibold text-foreground">备料清单（去建材市场照念）</h3>
              <button
                @click="copyShoppingList"
                class="px-3 py-1.5 rounded-lg border border-border text-xs font-medium transition"
                :class="copied ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-card hover:bg-muted text-foreground'"
              >
                <CheckCircle v-if="copied" class="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                <Copy v-else class="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                {{ copied ? '已复制' : '复制清单' }}
              </button>
            </div>
            <p class="text-xs leading-relaxed text-foreground font-mono break-all">{{ shoppingList }}</p>
          </div>

          <!-- 自拌 vs 商砼 -->
          <div class="border border-border rounded-lg p-4 space-y-3">
            <h3 class="text-sm font-semibold text-foreground">自拌 vs 商砼 · 本单方小算</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <label class="block">
                <span class="text-[11px] text-muted-foreground">商砼方价 (元/m³)</span>
                <input v-model="readyPrice" type="number" min="0" step="10" class="mt-1 w-full px-2.5 py-1.5 bg-background border border-border border-border rounded-lg text-sm text-foreground" />
              </label>
              <label class="block">
                <span class="text-[11px] text-muted-foreground">自拌人工折算 (元/m³)</span>
                <input v-model="laborPrice" type="number" min="0" step="5" class="mt-1 w-full px-2.5 py-1.5 bg-background border border-border border-border rounded-lg text-sm text-foreground" />
              </label>
              <label class="block">
                <span class="text-[11px] text-muted-foreground">水泥 (元/袋)</span>
                <input v-model="cementBagPrice" type="number" min="0" step="1" class="mt-1 w-full px-2.5 py-1.5 bg-background border border-border border-border rounded-lg text-sm text-foreground" />
              </label>
              <label class="block">
                <span class="text-[11px] text-muted-foreground">砂 (元/吨)</span>
                <input v-model="sandTonPrice" type="number" min="0" step="5" class="mt-1 w-full px-2.5 py-1.5 bg-background border border-border border-border rounded-lg text-sm text-foreground" />
              </label>
              <label class="block">
                <span class="text-[11px] text-muted-foreground">石子 (元/吨)</span>
                <input v-model="stoneTonPrice" type="number" min="0" step="5" class="mt-1 w-full px-2.5 py-1.5 bg-background border border-border border-border rounded-lg text-sm text-foreground" />
              </label>
            </div>
            <div class="grid grid-cols-2 gap-2 text-center">
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">商砼总价（含损耗方量）</p>
                <p class="text-xl font-bold text-foreground">{{ costResult.readyTotal.toFixed(2) }} 元</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">自拌总价（材料 + 人工）</p>
                <p class="text-xl font-bold text-foreground">{{ costResult.selfTotal.toFixed(2) }} 元</p>
              </div>
            </div>
            <p class="text-xs leading-relaxed text-foreground bg-primary/10 rounded-lg p-3">{{ costVerdict }}</p>
          </div>

          <p v-if="showBulkWarn" class="text-xs leading-relaxed p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-foreground flex items-start gap-2">
            <TriangleAlert class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>本单方量超过 20 m³：自拌难以保证连续供应与强度稳定，且商砼量大议价空间更好，建议直接订购商品混凝土。</span>
          </p>
        </template>
      </div>
    </div>

    <!-- 方量反推卡 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold mb-3 flex items-center">
        <Package class="w-5 h-5 mr-2 text-primary" /> 方量反推：一车商砼能浇多厚？
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <label class="block">
          <span class="text-xs text-muted-foreground">一车商砼方量 (m³)</span>
          <input v-model="truckVol" type="number" min="0" step="0.5" class="mt-1 w-full px-2.5 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground" />
        </label>
        <label class="block">
          <span class="text-xs text-muted-foreground">地面面积 (㎡)</span>
          <input v-model="floorArea" type="number" min="0" step="1" class="mt-1 w-full px-2.5 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground" />
        </label>
        <div class="bg-primary/10 rounded-lg p-3 text-center">
          <p class="text-xs text-muted-foreground mb-1">可浇筑厚度</p>
          <p class="text-xl font-bold text-primary">{{ truckThicknessText }}</p>
        </div>
      </div>
      <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
        例：8 m³ 一车浇 10 ㎡ 地面约 0.8 m 厚（显然过厚）——按院落常用的 12 cm 板厚，一车约可铺 {{ coverageText }} ㎡，用来倒推「买几车 / 打多宽」最方便。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>混凝土配合比计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是一款面向农村自建房、院落硬化、地坪、小雨棚柱基等小工程的在线混凝土用量计算工具。
          按重量法给出 C20-C35 各强度等级每立方米的水泥、中砂、碎石与水参考用量，输入方量与损耗系数后，
          自动换算成「水泥多少袋（50kg/袋向上取整）、砂石多少吨、水多少公斤」，并附带水灰比、备料清单一键复制、
          方量反推厚度以及自拌与商品混凝土的本单方造价对比。全部计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">C20 / C25 / C30 的区别是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          字母 C 代表混凝土（Concrete），数字是立方体抗压强度标准值，单位 MPa（N/m㎡）：C20 表示 150mm 立方试块在标准养护 28 天后
          抗压强度不低于 20MPa（具有 95% 保证率），C25、C30 依此类推。等级越高，水泥用量越多、水灰比越低、造价越高。
          农村自用的院落地面、散水、地坪垫层用 C20 就够；室内地面、院墙基础常用 C25；自建房构造柱、圈梁、楼板等承重构件
          一般设计要求 C30 及以上，请以设计图纸为准，不要凭经验降档。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">配合比的「几比几」口诀是怎么回事？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          老工匠说的「1 : 2 : 4」这类口诀，指的是水泥 : 砂 : 石子 的重量比。以本页 C25 参考配比 350 : 650 : 1200 为例，
          除以水泥量约等于 1 : 1.86 : 3.43，民间常顺口记成「一立方 C25，七百沙来一千二石」的近似值；等级越高，石子比例略降、水泥比例上升。
          口诀只适合现场估堆，精确备料请按每 m³ 公斤数称量——同样口诀下砂子含水、堆重不同，误差可达一方几十公斤。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么是「水灰比决定强度」，而不是水泥越多越好？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          水灰比 = 用水量 ÷ 水泥用量。水泥水化只需要很少的水（完全水化约需水泥重量 25% 的水），多余的水分蒸发后在混凝土里留下毛细孔，
          孔越多强度越低、越易开裂渗水——所以决定强度的第一因素是水灰比：本页 C35 水灰比 0.39 就比 C20 的 0.58 强度高一档，
          而不仅仅是水泥多。水泥过量则水化热大、收缩大，地面易开裂，还白白增加成本。施工中「坍落度」够不够好抹面，靠砂石级配与外加剂调节，
          而不是现场随手加水——一车商砼到场后加水是最常见的偷强度行为。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么砂石含水率要现场调整？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          表中的砂、石是按干燥状态给的。农村露天堆砂雨后含水可达 5%-8%：一方 C25 需砂约 650kg，若含水 6% 就应称 689kg 湿砂，
          并把这部分带入的水（约 39kg）从用水量里扣掉；否则实际水灰比被抬高，强度直接打折，表现就是地面起砂、开裂。
          反过来烘干的砂要补少量水。简单口诀：砂子捏成团、松手就散，含水适中；捏出水印，就扣水。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">农村自拌和商品混凝土怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          看方量与构件：五方以内的小活（散水、柱墩、小地面）自拌更灵活，商砼往往有起订量、进场等待与泵送费用，不划算；
          超过十方、或涉及楼板 / 梁 / 构造柱等承重构件时，商砼的级配、计量与强度保证率远好过一台小搅拌机凭手感下料，
          还应要求随车合格证与试块。经验说法「小方量自拌、大方量商砼」的本质是：固定成本摊薄与质量稳定性的权衡，
          本页「自拌 vs 商砼小算」用你当地材料价算出本单差额，供决策参考。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">打一方 C25 混凝土需要几袋水泥？</h3>
            <p class="text-sm text-muted-foreground mt-1">按常用重量法参考配比，C25 每 m³ 约需水泥 350kg，即 50kg/袋的 7 袋；砂约 0.65 吨、石子约 1.2 吨、水约 175kg。备料时再叠加 3%-8% 损耗，袋数向上取整。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">自建房楼板该用 C25 还是 C30？</h3>
            <p class="text-sm text-muted-foreground mt-1">承重构件（楼板、梁、构造柱、圈梁）应严格按结构设计图纸标注的等级执行，一般不低于 C30。本工具的参考配比仅用于估算备料量，实际施工配合比须以试验室试配报告为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">水泥是不是放得越多越结实？</h3>
            <p class="text-sm text-muted-foreground mt-1">不是。决定强度首要因素是水灰比（水 ÷ 水泥），水多加了反而强度下降；水泥过量则水化热和收缩增大，地面更容易开裂还多花钱。按配合比称量、控制用水量比「多放水泥」更有效。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算结果会上传或保存吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有输入与计算都在你的浏览器本地完成，无网络请求、不写 localStorage，刷新页面即恢复默认参数，复制备料清单也只在本机剪贴板内。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'concrete-mix-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  House, Package, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '混凝土配合比计算器 - C20/C25/C30水泥砂石用量计算 | 有条工具',
  description: '免费在线混凝土用量计算器，按长宽厚或方量算水泥袋数、砂子石子吨数与用水量，支持 C20-C35 强度等级、损耗系数、水灰比、备料清单复制、方量反推厚度与自拌 vs 商砼对比，农村自建房院落硬化备料必备，纯浏览器本地运行不上传',
  keywords: '混凝土用量计算,C25 配合比,水泥砂石用量,自建房混凝土,方量计算',
  author: '有条工具',
  ogTitle: '混凝土配合比计算器 - C20/C25/C30水泥砂石用量计算 | 有条工具',
  ogDescription: '输入体积与强度等级，一键算出水泥袋数、砂石吨数、水灰比与备料清单，还能对比自拌和商砼哪个省钱。',
  ogUrl: 'https://www.util.cn/tools/concrete-mix-calculator',
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
          name: '混凝土配合比计算器',
          url: 'https://www.util.cn/tools/concrete-mix-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['C20-C35 参考配合比', '水泥袋数/砂石吨数换算', '损耗系数 1%-10%', '水灰比提示', '备料清单一键复制', '一车商砼方量反推厚度', '自拌 vs 商砼造价对比', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '混凝土配合比计算器', item: 'https://www.util.cn/tools/concrete-mix-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '打一方C25混凝土需要几袋水泥？',
              acceptedAnswer: { '@type': 'Answer', text: '按常用重量法参考配比，C25每m³约需水泥350kg，即50kg/袋的7袋；砂约0.65吨、石子约1.2吨、水约175kg。备料时再叠加3%-8%损耗，袋数向上取整。' }
            },
            {
              '@type': 'Question',
              name: '自建房楼板该用C25还是C30？',
              acceptedAnswer: { '@type': 'Answer', text: '承重构件（楼板、梁、构造柱、圈梁）应严格按结构设计图纸标注的等级执行，一般不低于C30。本工具的参考配比仅用于估算备料量，实际施工配合比须以试验室试配报告为准。' }
            },
            {
              '@type': 'Question',
              name: '水泥是不是放得越多越结实？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。决定强度首要因素是水灰比（水÷水泥），多加水反而强度下降；水泥过量则水化热和收缩增大，地面更容易开裂还多花钱。按配合比称量、控制用水量比多放水泥更有效。' }
            },
            {
              '@type': 'Question',
              name: '计算结果会上传或保存吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有输入与计算都在浏览器本地完成，无网络请求、不写localStorage，刷新页面即恢复默认参数，复制备料清单也只在本机剪贴板内。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const CEMENT_BAG_KG = 50 // 市售袋装水泥规格：50kg/袋

// 每 m³ 参考配合比（kg，重量法）。来源：《普通混凝土配合比设计规程》JGJ 55 体系下，
// 中砂、42.5 水泥、泵送坍落度条件下公开出版物与农村自建房施工中广泛引用的经验值，
// 仅供备料估算，不能替代试验室试配。
const MIX_TABLE = {
  C20: { cementKg: 300, sandKg: 685, stoneKg: 1226, waterKg: 175 },
  C25: { cementKg: 350, sandKg: 650, stoneKg: 1200, waterKg: 175 },
  C30: { cementKg: 400, sandKg: 620, stoneKg: 1180, waterKg: 175 },
  C35: { cementKg: 450, sandKg: 590, stoneKg: 1160, waterKg: 175 }
}

const GRADE_HINTS = {
  C20: '院落地面、散水、垫层等非承重',
  C25: '室内地面、院墙与房屋基础常用',
  C30: '构造柱、圈梁、楼梯等承重构件',
  C35: '设计图纸要求的较高承重等级'
}

function num(v) {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function roundN(value, digits) {
  const f = 10 ** digits
  return Math.round(value * f) / f
}

// 长×宽×厚（m）→ 体积 m³，保留三位小数
function volumeOf(l, w, h) {
  return roundN(num(l) * num(w) * num(h), 3)
}

// 强度等级 → 每 m³ 材料用量表；未知等级返回 null
function mixRatioOf(grade) {
  const r = MIX_TABLE[grade]
  return r ? { ...r } : null
}

// 配合比 × 净方量 × (1+损耗%) → 总量、袋数（向上取整）与吨数（2 位）
function totalsOf(ratio, vol, wastePercent) {
  const netVolM3 = roundN(num(vol), 3)
  const effVolM3 = roundN(netVolM3 * (1 + num(wastePercent) / 100), 3)
  const cementKg = ratio.cementKg * effVolM3
  const sandKg = ratio.sandKg * effVolM3
  const stoneKg = ratio.stoneKg * effVolM3
  const waterKg = ratio.waterKg * effVolM3
  return {
    netVolM3,
    effVolM3,
    cementKg,
    sandKg,
    stoneKg,
    waterKg,
    cementBags: Math.ceil(cementKg / CEMENT_BAG_KG),
    sandTons: roundN(sandKg / 1000, 2),
    stoneTons: roundN(stoneKg / 1000, 2)
  }
}

// 水灰比 = 水 ÷ 水泥（2 位小数），越低强度越高
function waterCementRatioOf(ratio) {
  return roundN(ratio.waterKg / ratio.cementKg, 2)
}

// 反推：方量 ÷ 面积 → 厚度 m（3 位）；面积非正返回 null
function thicknessOf(volumeM3, areaM2) {
  const a = num(areaM2)
  if (a <= 0) return null
  return roundN(num(volumeM3) / a, 3)
}

// 反推：方量 ÷ 目标厚度 → 可铺面积 ㎡（2 位）；厚度非正返回 null
function areaOf(volumeM3, thicknessM) {
  const t = num(thicknessM)
  if (t <= 0) return null
  return roundN(num(volumeM3) / t, 2)
}

// 每 m³ 自拌材料费（元）：水泥按袋、砂按吨、石按吨、水按吨计价
function selfMaterialCostOf(ratio, price) {
  return (ratio.cementKg / CEMENT_BAG_KG) * num(price.cementBagYuan)
    + (ratio.sandKg / 1000) * num(price.sandTonYuan)
    + (ratio.stoneKg / 1000) * num(price.stoneTonYuan)
    + (ratio.waterKg / 1000) * num(price.waterTonYuan)
}

// 自拌（材料 + 人工）vs 商砼 的本单方总价对比，diff > 0 表示自拌更省
function costCompareOf(vol, wastePercent, readyPricePerM3, selfCostPerM3) {
  const eff = roundN(num(vol) * (1 + num(wastePercent) / 100), 3)
  const readyTotal = roundN(num(readyPricePerM3) * eff, 2)
  const selfTotal = roundN(num(selfCostPerM3) * eff, 2)
  const diff = roundN(readyTotal - selfTotal, 2)
  return { effVolM3: eff, readyTotal, selfTotal, diff, cheaper: diff > 0 ? 'self' : diff < 0 ? 'ready' : 'tie' }
}

// 建材市场照念版备料清单
function shoppingListOf(grade, t) {
  return `${grade} 混凝土：净 ${t.netVolM3.toFixed(3)} m³（含损耗共 ${t.effVolM3.toFixed(3)} m³）——`
    + `水泥 ${t.cementBags} 袋（约 ${Math.round(t.cementKg)} 公斤）、砂 ${t.sandTons.toFixed(2)} 吨、`
    + `石子 ${t.stoneTons.toFixed(2)} 吨、水 ${Math.round(t.waterKg)} 公斤。参考配比，备料请扣砂石含水。`
}

// ---------- 输入状态（默认对应预设①：院落硬化） ----------
const DEFAULTS = {
  mode: 'dim', len: '10', width: '4', thick: '0.12', volInput: '1.5',
  grade: 'C25', waste: 3,
  truckVol: '8', floorArea: '10',
  readyPrice: '450', laborPrice: '80', cementBagPrice: '28', sandTonPrice: '120', stoneTonPrice: '135'
}

const mode = ref(DEFAULTS.mode)
const len = ref(DEFAULTS.len)
const width = ref(DEFAULTS.width)
const thick = ref(DEFAULTS.thick)
const volInput = ref(DEFAULTS.volInput)
const grade = ref(DEFAULTS.grade)
const waste = ref(DEFAULTS.waste)
const truckVol = ref(DEFAULTS.truckVol)
const floorArea = ref(DEFAULTS.floorArea)
const readyPrice = ref(DEFAULTS.readyPrice)
const laborPrice = ref(DEFAULTS.laborPrice)
const cementBagPrice = ref(DEFAULTS.cementBagPrice)
const sandTonPrice = ref(DEFAULTS.sandTonPrice)
const stoneTonPrice = ref(DEFAULTS.stoneTonPrice)
const copied = ref(false)
const seoContentVisible = ref(true)
let copyTimer = null

const gradeOptions = Object.keys(MIX_TABLE)
const gradeHint = computed(() => GRADE_HINTS[grade.value] || '')

// ---------- 派生结果 ----------
const netVolume = computed(() =>
  mode.value === 'dim'
    ? volumeOf(len.value, width.value, thick.value)
    : volumeOf(volInput.value, 1, 1)
)
const ratio = computed(() => mixRatioOf(grade.value))
const totals = computed(() => totalsOf(ratio.value, netVolume.value, waste.value))
const waterCementRatio = computed(() => waterCementRatioOf(ratio.value))
const showBulkWarn = computed(() => netVolume.value > 20)

const tableRows = computed(() => {
  const r = ratio.value
  const t = totals.value
  return [
    { name: '水泥 (42.5)', perM3: r.cementKg, totalKg: t.cementKg, extra: `${t.cementBags} 袋 × 50kg` },
    { name: '中砂', perM3: r.sandKg, totalKg: t.sandKg, extra: `约 ${t.sandTons.toFixed(2)} 吨` },
    { name: '碎石', perM3: r.stoneKg, totalKg: t.stoneKg, extra: `约 ${t.stoneTons.toFixed(2)} 吨` },
    { name: '水', perM3: r.waterKg, totalKg: t.waterKg, extra: `水灰比 ${waterCementRatio.value.toFixed(2)}` }
  ]
})

const shoppingList = computed(() => shoppingListOf(grade.value, totals.value))

const selfCostPerM3 = computed(() =>
  selfMaterialCostOf(ratio.value, {
    cementBagYuan: cementBagPrice.value,
    sandTonYuan: sandTonPrice.value,
    stoneTonYuan: stoneTonPrice.value,
    waterTonYuan: 5
  }) + num(laborPrice.value)
)
const costResult = computed(() =>
  costCompareOf(netVolume.value, waste.value, num(readyPrice.value), selfCostPerM3.value)
)
const costVerdict = computed(() => {
  const c = costResult.value
  if (c.effVolM3 <= 0) return '请先填写有效方量。'
  const diffText = c.cheaper === 'tie'
    ? '两种方式总价基本打平'
    : `${c.cheaper === 'self' ? '自拌' : '商砼'}约省 ${Math.abs(c.diff).toFixed(2)} 元`
  return `本单 ${c.effVolM3.toFixed(3)} m³：${diffText}。自拌每 m³ 约 ${selfCostPerM3.value.toFixed(2)} 元（含人工）。${
    c.cheaper === 'self'
      ? '经验法则：小方量自拌（商砼常有起订量与到场等待），量大或承重构件选商砼更稳。'
      : '注意单价上商砼因集料批量采购更便宜，但五方以下小活凑不齐起订量、还要算等待与二次倒运费——经验法则仍是小方量自拌、大方量商砼。'
  }`
})

// 方量反推
const truckThickness = computed(() => thicknessOf(truckVol.value, floorArea.value))
const truckThicknessText = computed(() => {
  if (truckThickness.value === null || num(truckVol.value) <= 0) return '—'
  return `${truckThickness.value.toFixed(3)} m（约 ${Math.round(truckThickness.value * 1000)} mm）`
})
const coverageText = computed(() => {
  const area = areaOf(truckVol.value, 0.12)
  return area === null ? '—' : area.toFixed(1)
})

// ---------- 预设 ----------
const presets = [
  {
    name: '院落硬化',
    desc: '10 m × 4 m × 0.12 m · C25 · 损耗 3%',
    mode: 'dim', len: '10', width: '4', thick: '0.12', grade: 'C25', waste: 3
  },
  {
    name: '小雨棚柱基',
    desc: '直接 1.5 m³ · C30 · 损耗 5%',
    mode: 'vol', volInput: '1.5', grade: 'C30', waste: 5
  }
]

function applyPreset(p) {
  mode.value = p.mode
  len.value = p.len ?? DEFAULTS.len
  width.value = p.width ?? DEFAULTS.width
  thick.value = p.thick ?? DEFAULTS.thick
  volInput.value = p.volInput ?? DEFAULTS.volInput
  grade.value = p.grade
  waste.value = p.waste
}

function resetDefaults() {
  mode.value = DEFAULTS.mode
  len.value = DEFAULTS.len
  width.value = DEFAULTS.width
  thick.value = DEFAULTS.thick
  volInput.value = DEFAULTS.volInput
  grade.value = DEFAULTS.grade
  waste.value = DEFAULTS.waste
  truckVol.value = DEFAULTS.truckVol
  floorArea.value = DEFAULTS.floorArea
  readyPrice.value = DEFAULTS.readyPrice
  laborPrice.value = DEFAULTS.laborPrice
  cementBagPrice.value = DEFAULTS.cementBagPrice
  sandTonPrice.value = DEFAULTS.sandTonPrice
  stoneTonPrice.value = DEFAULTS.stoneTonPrice
}

// ---------- 浏览器 API（仅在事件回调内，SSR 安全） ----------
async function copyShoppingList() {
  try {
    await navigator.clipboard.writeText(shoppingList.value)
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
      copyTimer = null
    }, 2000)
  } catch {
    copied.value = false
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('concrete-mix-calculator')
})
</script>
