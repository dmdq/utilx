<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6 print:hidden">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ChefHat class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">菜品成本核算卡</h1>
          <p class="text-sm text-muted-foreground mt-1">配料净料率折算 · 成本率与毛利定价 · 外卖对照 · 批量备料 · 打印档口成本卡</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线菜品成本核算工具：按「毛料价 × 用量 ÷ 采购规格 ÷ 净料率」逐项折算每道菜的食材实耗成本，
        用目标成本率反推建议售价，支持成本率三档健康判定、外卖平台价对照与批量备料放大，
        配方卡保存在浏览器本地可随时载入编辑，并一键打印成餐饮店贴在档口的标准成本卡格式。纯本地计算，不上传任何数据。
      </p>
    </div>

    <!-- 说明条 -->
    <div class="flex items-start gap-2 px-4 py-3 mb-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-foreground print:hidden">
      <Info class="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
      <span>成本=食材毛料按净料率折算的实耗金额；未含人工房租水电燃气——这是'食材成本卡'，用于定价与毛利分析，完整成本请叠加你的固定成本率。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 print:hidden">
      <!-- 左两列：配料编辑 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <h2 class="text-lg font-semibold flex items-center">
              <ChefHat class="w-5 h-5 mr-2 text-primary" /> 成本卡编辑
            </h2>
            <span class="text-xs text-muted-foreground">配料 {{ rows.length }} / {{ MAX_ROWS }} 行</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label class="block">
              <span class="text-xs text-muted-foreground mb-1 block">菜名</span>
              <input v-model="dishName" type="text" placeholder="如：番茄炒蛋" class="input-base" />
            </label>
            <label class="block">
              <span class="text-xs text-muted-foreground mb-1 block">份数（本配方出几份）</span>
              <input v-model="servingsText" type="number" min="1" step="1" class="input-base" />
            </label>
            <label class="block">
              <span class="text-xs text-muted-foreground mb-1 block">目标成本率 %（定价用）</span>
              <input v-model="targetPctText" type="number" min="1" max="100" step="1" class="input-base" />
            </label>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button
              @click="addRow"
              :disabled="rows.length >= MAX_ROWS"
              class="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus class="w-4 h-4 inline mr-1 -mt-0.5" /> 添加配料
            </button>
            <button
              @click="applyPreset(PRESET_TOMATO)"
              class="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            >
              <Play class="w-4 h-4 inline mr-1 -mt-0.5" /> 预设：番茄炒蛋
            </button>
            <button
              @click="applyPreset(PRESET_FISH)"
              class="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
            >
              <Play class="w-4 h-4 inline mr-1 -mt-0.5" /> 预设：酸菜鱼
            </button>
          </div>

          <!-- 配料行 -->
          <div class="space-y-3">
            <div v-for="(row, idx) in rows" :key="row.uid" class="bg-muted/40 border border-border rounded-lg p-3">
              <div class="grid grid-cols-2 sm:grid-cols-12 gap-2">
                <div class="col-span-2 sm:col-span-3">
                  <span class="field-label">食材名</span>
                  <input v-model="row.name" type="text" placeholder="如：番茄" class="input-base" />
                </div>
                <div class="sm:col-span-2">
                  <span class="field-label">单价（元）</span>
                  <input v-model="row.price" type="number" min="0" step="0.1" placeholder="0" class="input-base" />
                </div>
                <div class="sm:col-span-2">
                  <span class="field-label">采购规格量</span>
                  <input v-model="row.purchaseQty" type="number" min="0" step="1" placeholder="500" class="input-base" />
                </div>
                <div class="sm:col-span-2">
                  <span class="field-label">净料用量</span>
                  <input v-model="row.useQty" type="number" min="0" step="1" placeholder="200" class="input-base" />
                </div>
                <div class="sm:col-span-1">
                  <span class="field-label">单位</span>
                  <select v-model="row.unit" class="input-base">
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="个">个</option>
                  </select>
                </div>
                <div class="sm:col-span-1 flex items-end">
                  <button
                    @click="removeRow(idx)"
                    class="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition"
                    aria-label="删除该配料"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
                <div class="col-span-2 sm:col-span-12 flex flex-wrap items-center gap-2 pt-1">
                  <span class="field-label inline-block mb-0 mr-1">净料率</span>
                  <select
                    :value="presetKeyOf(row.yieldPct)"
                    @change="onPresetSelect(row, $event.target.value)"
                    class="w-auto px-2 py-1.5 bg-background border border-border border-border rounded text-xs text-foreground"
                  >
                    <option v-for="p in YIELD_PRESETS" :key="p.name" :value="String(p.value)">{{ p.name }} {{ p.value }}%</option>
                    <option value="custom">自定义</option>
                  </select>
                  <input v-model="row.yieldPct" type="number" min="1" max="100" step="1" class="w-20 px-2 py-1.5 bg-background border border-border border-border rounded text-xs text-foreground" />
                  <span class="text-xs text-muted-foreground">%</span>
                  <span class="text-xs text-muted-foreground sm:ml-auto">单项成本 ≈ {{ money(rowCostOf(row)) }} 元</span>
                </div>
              </div>
            </div>
            <p v-if="!rows.length" class="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
              暂无配料行，点「添加配料」或上方预设开始。
            </p>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed">
            录入口径：单价填「一个采购规格」的钱——元/500g（1 斤）就填 500，整包 1000g 就填 1000；
            净料用量按去皮去骨后的实下锅量填，净料率把损耗折回毛料；单价×用量÷规格的换算要求 g 对 g、ml 对 ml、个对个，单位必须一致。
          </p>
        </div>

        <!-- 配方卡列表（本地保存） -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <h2 class="text-lg font-semibold flex items-center">
              <Download class="w-5 h-5 mr-2 text-primary" /> 我的配方卡
            </h2>
            <div class="flex items-center gap-2">
              <button
                @click="saveCurrent"
                class="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition"
              >
                <Download class="w-4 h-4 inline mr-1 -mt-0.5" /> {{ editingId ? '更新已存卡' : '保存为配方卡' }}
              </button>
              <button
                @click="copyCardText"
                class="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
              >
                <CheckCircle v-if="copied" class="w-4 h-4 inline mr-1 -mt-0.5 text-green-600" />
                <span>{{ copied ? '已复制' : '复制成本卡文本' }}</span>
              </button>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">配方卡保存在本浏览器（localStorage），换设备/清缓存会丢失；删除需点两次确认。</p>

          <div class="space-y-2">
            <div
              v-for="card in cards"
              :key="card.id"
              class="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2 flex-wrap"
            >
              <button @click="loadCard(card)" class="text-sm font-medium text-foreground hover:text-primary text-left flex-1 min-w-32">
                {{ card.name || '未命名' }}
                <span class="text-xs text-muted-foreground font-normal ml-2">{{ card.items.length }} 料 · 单份 {{ money(perServingCostOf(card)) }} 元</span>
              </button>
              <button
                @click="copySavedCard(card)"
                class="px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >复制</button>
              <button
                @click="removeCard(card.id)"
                class="px-2 py-1 rounded-md text-xs transition"
                :class="armedDeleteId === card.id ? 'bg-red-500/10 text-red-600 font-medium' : 'text-muted-foreground hover:text-red-600 hover:bg-red-500/10'"
              >{{ armedDeleteId === card.id ? '确认删除？' : '删除' }}</button>
            </div>
            <p v-if="!cards.length" class="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">还没有保存的配方卡。</p>
          </div>
        </div>
      </div>

      <!-- 右列：结果面板 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 核算结果
          </h2>

          <div class="bg-primary/10 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">{{ dishName || '未命名菜' }} · 共 {{ safeServings }} 份</p>
            <p class="text-2xl font-bold text-primary">{{ money(result.total) }} 元 <span class="text-sm font-normal text-muted-foreground">食材总成本</span></p>
            <p class="text-xs text-muted-foreground mt-1">单份成本 {{ money(perServingCost) }} 元 · 净料率损耗占成本 {{ result.yieldLossPct.toFixed(1) }}%</p>
          </div>

          <div class="grid grid-cols-2 gap-2 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">建议售价（成本 ÷ {{ safeTargetPct }}%）</p>
              <p class="text-xl font-bold text-foreground">{{ priceSug ? money(priceSug.price) : '—' }} 元</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">单份毛利额</p>
              <p class="text-xl font-bold text-foreground">{{ priceSug ? money(priceSug.profit) : '—' }} 元</p>
            </div>
          </div>

          <!-- 成本率反算 -->
          <div class="space-y-2">
            <label class="block">
              <span class="field-label">实际卖价（元/份）——反算成本率并判定健康度</span>
              <input v-model="salePriceText" type="number" min="0" step="0.1" placeholder="如：38" class="input-base" />
            </label>
            <p
              v-if="actualPct !== null"
              class="flex items-start gap-1.5 px-2.5 py-2 rounded text-xs leading-relaxed border"
              :class="judgeMeta[judge.level].class"
            >
              <CheckCircle v-if="judge.level !== 'high'" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <TriangleAlert v-else class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>成本率 {{ actualPct.toFixed(1) }}% · {{ judge.label }}（{{ judge.hint }}，按大众餐饮经验带）</span>
            </p>
          </div>

          <button
            @click="printCard"
            class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            打印成本卡（档口贴卡格式）
          </button>
        </div>

        <!-- 外卖价对照 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 外卖价对照
          </h2>
          <div class="grid grid-cols-2 gap-2">
            <label class="block">
              <span class="field-label">平台抽佣</span>
              <select v-model="commissionText" class="input-base">
                <option v-for="c in COMMISSION_OPTIONS" :key="c" :value="String(c)">{{ c }}%（经验档）</option>
              </select>
            </label>
            <label class="block">
              <span class="field-label">履约（包装+配送）</span>
              <select v-model="fulfillmentText" class="input-base">
                <option v-for="f in FULFILLMENT_OPTIONS" :key="f" :value="String(f)">{{ f }}%</option>
              </select>
            </label>
          </div>
          <div class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-xs text-muted-foreground mb-1">外卖建议定价（简式）</p>
            <p class="text-xl font-bold text-foreground">{{ takeawayPrice !== null ? `${money(takeawayPrice)} 元` : '无法定价' }}</p>
            <p class="text-[10px] text-muted-foreground mt-1">对照堂食价 {{ priceSug ? money(priceSug.price) : '—' }} 元</p>
          </div>
          <p v-if="takeawayPrice === null" class="flex items-start gap-1.5 text-xs p-2.5 rounded bg-red-500/10 text-red-600 leading-relaxed">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>目标成本率 − 抽佣 − 履约 ≤ 0：按该成本率外卖必亏，要么提目标售价、要么压缩食材成本。</span>
          </p>
          <p v-else class="text-xs text-muted-foreground leading-relaxed">
            口径：外卖价 = 单份食材成本 ÷（目标成本率 − 抽佣 − 履约）——只保食材毛利，推广竞价/满减补贴未计入，实际再上浮 5-10%。
          </p>
        </div>

        <!-- 批量备料 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Plus class="w-5 h-5 mr-2 text-primary" /> 批量备料放大
          </h2>
          <label class="block">
            <span class="field-label">放大到多少份（相对本配方 {{ safeServings }} 份）</span>
            <input v-model="batchServingsText" type="number" min="1" step="1" placeholder="20" class="input-base" />
          </label>
          <div class="space-y-1.5 max-h-64 overflow-auto">
            <div v-for="b in batch.items" :key="b.name" class="flex items-center justify-between text-sm px-2.5 py-1.5 bg-muted/40 rounded">
              <span class="text-foreground truncate">{{ b.name }}</span>
              <span class="text-muted-foreground text-xs whitespace-nowrap">净 {{ qtyText(b.netQty, b.unit) }} → 需采购毛料 {{ qtyText(b.grossQty, b.unit) }}</span>
            </div>
            <p v-if="!batch.items.length" class="text-xs text-muted-foreground">先填配料再放大。</p>
          </div>
          <p v-if="batch.factor !== 1" class="text-xs text-muted-foreground">倍率 ×{{ batch.factor.toFixed(2) }}，采购量已按净料率折回毛料。</p>
        </div>
      </div>
    </div>

    <!-- 打印用成本卡（屏幕隐藏，仅打印输出） -->
    <div class="hidden print:block text-black text-sm">
      <h2 class="text-xl font-bold mb-1">{{ dishName || '未命名菜品' }} · 成本卡</h2>
      <p class="text-xs mb-3">份数 {{ safeServings }} · 打印日期 {{ printDate }}</p>
      <table class="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th class="border border-black px-1.5 py-1 text-left">食材</th>
            <th class="border border-black px-1.5 py-1 text-left">单价/规格</th>
            <th class="border border-black px-1.5 py-1 text-left">净用量</th>
            <th class="border border-black px-1.5 py-1 text-left">净料率</th>
            <th class="border border-black px-1.5 py-1 text-right">成本(元)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="it in result.items" :key="it.uid">
            <td class="border border-black px-1.5 py-1">{{ it.name || '—' }}</td>
            <td class="border border-black px-1.5 py-1">{{ money(it.price) }} 元 / {{ it.purchaseQty }} {{ it.unit }}</td>
            <td class="border border-black px-1.5 py-1">{{ it.useQty }} {{ it.unit }}</td>
            <td class="border border-black px-1.5 py-1">{{ it.yieldPct }}%</td>
            <td class="border border-black px-1.5 py-1 text-right">{{ money(it.cost) }}</td>
          </tr>
          <tr>
            <td colspan="4" class="border border-black px-1.5 py-1 font-bold">食材总成本（{{ safeServings }} 份合计 {{ money(result.total) }} 元）</td>
            <td class="border border-black px-1.5 py-1 text-right font-bold">{{ money(perServingCost) }}</td>
          </tr>
        </tbody>
      </table>
      <p class="text-xs mt-2">目标成本率 {{ safeTargetPct }}% → 建议售价 {{ priceSug ? money(priceSug.price) : '—' }} 元/份，毛利 {{ priceSug ? money(priceSug.profit) : '—' }} 元。未含人工房租水电燃气，完整成本请叠加固定成本率。</p>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative print:hidden">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>菜品成本核算卡是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          菜品成本核算卡（简称成本卡）是餐饮后厨与外卖运营的标准管理工具：把一道菜拆成逐条配料，
          按「毛料采购价 × 净料用量 ÷ 采购规格 ÷ 净料率」算出每条配料的实耗金额，加总即单份食材成本，
          再用目标成本率反推售价（售价 = 成本 ÷ 成本率）。它回答的核心问题是：这道菜卖多少钱才不亏毛利、
          换一种食材能省几毛、外卖上定价要不要比堂食高一截。本页所有计算在你的浏览器本地完成，配方卡保存在 localStorage，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">净料率是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          毛料是买回来的原始形态，净料是实际下锅可用的形态，两者之比就是净料率。例如 1 斤（500g）带骨排骨去骨去皮后只剩 325g 肉，
          净料率 65%；一条 1000g 草鱼宰杀去鳞鳃内脏后剩 600g 鱼片，净料率 60%。成本必须按净料率折算：
          要用 400g 鱼片就得采购 400 ÷ 60% ≈ 667g 毛鱼，账才能算对——忽略净料率是新手核成本最常见的高估毛利错误。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">菜品成本率怎么定？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          目标成本率法一句话：售价 = 食材成本 ÷ 目标成本率。大众餐饮通常把食材成本率压在 30%-40%——正餐炒菜约 35%-40%，
          快餐约 30%-35%，火锅烧烤因人工房租重可压到 25%-30%，饮品甜点可到 25% 以下。先定品类经验带，再逐菜微调：
          引流菜可高成本率，招牌菜和酒水低成本率拉平均。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么你的菜不赚钱？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>损耗没进账：叶菜隔夜蔫掉 10%、解冻缩水、边角料没利用，都是隐性成本，净料率要按实际出成而不是理论值填。</li>
          <li>退菜与出品事故：客人退单、炒糊重做，成本照样发生却不产生收入，按月营业额的 1%-2% 预提。</li>
          <li>员工餐与试菜：后厨每天吃掉的也是库存食材，应分摊进固定成本率。</li>
          <li>只算食材不算房租人工：本页是「食材成本卡」，完整盈亏还要叠加你店的固定成本率（房租+人工+能耗 ÷ 营业额）。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">外卖和堂食成本结构差别</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          同一份菜，堂食只需覆盖食材成本率；外卖还要从毛利里再掏平台抽佣（15%-25% 经验档）与履约成本（餐盒、封签、骑手补贴摊薄约 8%-12%）。
          所以外卖定价普遍比堂食高 20%-35%：本页的外卖对照卡用「成本 ÷（目标成本率 − 抽佣 − 履约）」简式直接给外卖价，
          若算出无法定价，说明该成本率下外卖必亏，要么提价要么换料。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">成本卡多久更新一次？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          食材价格随季节与 supply 波动明显——叶菜雨季可翻倍，鱼类休渔期涨价，建议每月复核一次采购价、每季度全面改版一次成本卡；
          换了供应商、改了配菜克重当天就要更新。把本店的成本卡存在本页配方卡列表里，改价时载入、更新、重新打印贴回档口即可。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">净料率在哪里查？不确定怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">本页内置叶菜 80%、带骨肉 65%、整鱼 60%、去皮土豆 85% 等常见预设；最准的办法是自己称一次：采购毛料称重、处理后下锅前再称重，两者之比就是你的实际净料率，后厨损耗大就如实填低。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">油盐糖酱料要不要算进成本？</h3>
            <p class="text-sm text-muted-foreground mt-1">要。调味成本约占菜品食材成本的 3%-8%，常见做法是按采购均价折算每份用量（如一桶 20 元 5L 的油按每菜 10ml 折 0.04 元），懒得细算时也可用整菜调味包干价一行带过，本页预设即按包干行演示。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">算出来的成本率怎么判断好坏？</h3>
            <p class="text-sm text-muted-foreground mt-1">按大众餐饮经验带三档判定：低于 30% 毛利健康，30%-40% 属常见区间，高于 40% 成本偏高需要调价、换料或减量。注意这是只看食材的口径，还要叠加人工房租水电燃气等固定成本率才等于真实盈亏。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有配料、价格与配方卡都保存在你浏览器的 localStorage 中，计算全程本地完成，不发任何网络请求；换设备需重新录入或用「复制成本卡文本」带走。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'recipe-cost-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  ChefHat, Plus, X, Download, CheckCircle,
  TriangleAlert, ChevronUp, ChevronDown, Info, Play
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '菜品成本核算卡 - 餐饮成本率配方成本毛利定价工具',
  description: '免费在线菜品成本核算工具：按净料率折算配料实耗成本，目标成本率反推建议售价与毛利，外卖平台抽佣对照定价，批量备料放大，打印档口成本卡，配方卡本地保存，纯浏览器运行不上传',
  keywords: '菜品成本核算,餐饮成本率,菜谱配方成本,毛利定价,餐饮成本卡',
  author: '有条工具',
  ogTitle: '菜品成本核算卡 - 餐饮成本率配方成本毛利定价工具 | 有条工具',
  ogDescription: '净料率折算食材成本，目标成本率定售价，外卖对照与打印成本卡。',
  ogUrl: 'https://www.util.cn/tools/recipe-cost-calculator',
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
          name: '菜品成本核算卡',
          url: 'https://www.util.cn/tools/recipe-cost-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['净料率折算单项配料成本', '目标成本率反推建议售价与毛利', '成本率三档健康判定', '外卖抽佣履约对照定价', '批量备料放大清单', '配方卡本地保存与打印成本卡']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '菜品成本核算卡', item: 'https://www.util.cn/tools/recipe-cost-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '净料率在哪里查？不确定怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '工具内置叶菜80%、带骨肉65%、整鱼60%、去皮土豆85%等常见预设；最准的办法是自己称一次：采购毛料称重、处理后下锅前再称重，两者之比就是你的实际净料率，后厨损耗大就如实填低。' }
            },
            {
              '@type': 'Question',
              name: '油盐糖酱料要不要算进成本？',
              acceptedAnswer: { '@type': 'Answer', text: '要。调味成本约占菜品食材成本的3%-8%，常见做法是按采购均价折算每份用量，懒得细算时也可用整菜调味包干价一行带过。' }
            },
            {
              '@type': 'Question',
              name: '算出来的成本率怎么判断好坏？',
              acceptedAnswer: { '@type': 'Answer', text: '按大众餐饮经验带三档判定：低于30%毛利健康，30%-40%属常见区间，高于40%成本偏高需要调价、换料或减量；这是只看食材的口径，还要叠加人工房租等固定成本率。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MAX_ROWS = 15 // 单菜配料行上限（后厨成本卡实际不超过 15 味料）

// 常见净料率预设表（大众后厨经验值，按实际出成填写最准）
const YIELD_PRESETS = [
  { name: '叶菜（青菜/菠菜）', value: 80 },
  { name: '带骨肉（排骨/鸡块）', value: 65 },
  { name: '整鱼（去鳞鳃内脏）', value: 60 },
  { name: '去皮土豆', value: 85 },
  { name: '带壳虾', value: 55 },
  { name: '鸡蛋（去壳）', value: 88 },
  { name: '南瓜（去皮去瓤）', value: 75 },
  { name: '生米/干货', value: 100 },
  { name: '油盐糖调味料', value: 100 }
]

const UNITS = ['g', 'ml', '个']

// 安全取数：非有限值回退 fallback
function num(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

// 净料率越界钳制：非法/≤0 视为 100（不折算损耗），>100 钳到 100（净料不可能多于毛料口径）
function clampYield(p) {
  const v = num(p, 100)
  if (v <= 0) return 100
  return Math.min(v, 100)
}

// 金额保留 2 位
function round2(x) {
  return Math.round(num(x) * 100) / 100
}

// 单项配料成本。
// 口径：price = 一个采购规格的金额（如 3 元/500g → price=3, purchaseQty=500）；
// useQty 是净料（下锅）用量，毛料需求 = useQty ÷ (yieldPct/100)，
// 成本 = price × useQty ÷ purchaseQty ÷ (yieldPct/100)。
// 单位同口径：purchaseQty 与 useQty 必须同为 g、同为 ml 或同为个，混用结果无意义。
function ingredientCostOf(price, purchaseQty, useQty, yieldPct) {
  const p = num(price)
  const q = num(purchaseQty)
  const u = num(useQty)
  const y = clampYield(yieldPct)
  if (p <= 0 || q <= 0 || u <= 0) return 0
  return (p * u / q) / (y / 100)
}

// 整菜成本：总成本 + 每项成本 + 净料率损耗占总成本的比例 %
// 损耗占比 = (含净料率总成本 − 按 100% 出成的理论成本) ÷ 含净料率总成本 × 100
function dishCostOf(items) {
  const list = Array.isArray(items) ? items : []
  let total = 0
  let ideal = 0
  const priced = list.map((it) => {
    const cost = ingredientCostOf(it.price, it.purchaseQty, it.useQty, it.yieldPct)
    total += cost
    ideal += num(it.price) * num(it.useQty) / num(it.purchaseQty) || 0
    return { ...it, cost }
  })
  const loss = total > 0 ? ((total - ideal) / total) * 100 : 0
  return { total: round2(total), items: priced, yieldLossPct: Math.max(0, round2(loss)) }
}

// 目标成本率法定价：售价 = 成本 ÷ 成本率（餐饮常用 30%-40% 成本率），同时给出毛利额
function priceOf(totalCost, targetFoodCostPct) {
  const c = num(totalCost)
  const r = num(targetFoodCostPct, 35)
  if (c <= 0 || r <= 0 || r > 100) return null
  const price = c / (r / 100)
  return { price: round2(price), profit: round2(price - c) }
}

// 成本率反算：卖 38 元成本 12.6 → 33.2%；卖价非法返回 null
function actualFoodCostPctOf(salePrice, cost) {
  const s = num(salePrice)
  if (s <= 0) return null
  return round2((num(cost) / s) * 100)
}

// 三档判定（按大众餐饮经验带）：<30 绿「毛利健康」，30-40 黄「常见区间」，>40 红「成本偏高需调价或换料」
function judgeFoodCostPct(pct) {
  if (pct === null || !Number.isFinite(pct)) return { level: 'good', label: '待填卖价', hint: '填入实际售价后自动判定' }
  if (pct < 30) return { level: 'good', label: '毛利健康', hint: '低于 30%' }
  if (pct <= 40) return { level: 'fair', label: '常见区间', hint: '30%-40%' }
  return { level: 'high', label: '成本偏高需调价或换料', hint: '高于 40%' }
}

// 批量备料放大：把配方（servings 份）放大到 batchServings 份，
// 返回每项净料用量与按净料率折回的采购毛料量
function batchScaleOf(recipe, batchServings) {
  const base = num(recipe && recipe.servings, 1)
  const target = num(batchServings, 0)
  const factor = base > 0 && target > 0 ? target / base : 1
  const items = ((recipe && recipe.items) || []).map((it) => {
    const net = num(it.useQty) * factor
    const gross = clampYield(it.yieldPct) < 100 ? net / (clampYield(it.yieldPct) / 100) : net
    return { name: String(it.name || '').trim() || '未命名', unit: UNITS.includes(it.unit) ? it.unit : 'g', netQty: round2(net), grossQty: round2(gross) }
  })
  return { factor, items }
}

// 外卖定价简式：平台价 = 单份成本 ÷ (目标成本率 − 抽佣 − 履约)，分母 ≤0 无法定价返回 null
// 口径：抽佣/履约按营业额占比经验档（15-25% / 8-12%），推广竞价与满减补贴未计入
function takeawayPriceOf(cost, targetPct, commissionPct, fulfillmentPct) {
  const denom = num(targetPct, 35) - num(commissionPct, 20) - num(fulfillmentPct, 10)
  if (num(cost) <= 0 || denom <= 0 || num(targetPct) > 100) return null
  return round2(num(cost) / (denom / 100))
}

// 规范化单条配料（localStorage 读回 / 外部数据入库前的清洗）
function normalizeItem(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  return {
    uid: String(r.uid ?? `i-${Date.now()}-${Math.round(Math.random() * 1e6)}`),
    name: String(r.name ?? '').slice(0, 40),
    price: Math.max(0, num(r.price)),
    purchaseQty: Math.max(0, num(r.purchaseQty)),
    useQty: Math.max(0, num(r.useQty)),
    unit: UNITS.includes(r.unit) ? r.unit : 'g',
    yieldPct: clampYield(r.yieldPct ?? 100)
  }
}

// 规范化整张配方卡：份数至少 1，配料裁剪到 MAX_ROWS 行
function normalizeCard(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  return {
    id: String(r.id ?? `c-${Date.now()}`),
    name: String(r.name ?? '').slice(0, 40),
    servings: Math.max(1, Math.round(num(r.servings, 1))),
    items: (Array.isArray(r.items) ? r.items : []).slice(0, MAX_ROWS).map(normalizeItem)
  }
}

// 规范化配方卡列表：非数组返回 []，逐项过 normalizeCard
function normalizeCardList(raw) {
  return Array.isArray(raw) ? raw.map(normalizeCard) : []
}

// 打印/复制用的成本卡纯文本
function costCardTextOf(card, targetPct) {
  const calc = dishCostOf(card.items)
  const per = card.servings > 0 ? calc.total / card.servings : calc.total
  const sug = priceOf(per, targetPct)
  const lines = [
    `【${card.name || '未命名'}】成本卡（${card.servings} 份，单份成本 ${round2(per).toFixed(2)} 元）`,
    ...calc.items.map((it) => `  ${it.name || '未命名'}: ${num(it.price).toFixed(2)}元/${it.purchaseQty}${it.unit} 用${it.useQty}${it.unit} 净料率${clampYield(it.yieldPct)}% → ${round2(it.cost).toFixed(2)}元`),
    `食材总成本(单份): ${round2(per).toFixed(2)} 元`,
    sug ? `目标成本率 ${num(targetPct, 35)}% → 建议售价 ${sug.price.toFixed(2)} 元，毛利 ${sug.profit.toFixed(2)} 元` : `目标成本率非法，无法给出建议售价`,
    '注：未含人工房租水电燃气，完整成本请叠加固定成本率'
  ]
  return lines.join('\n')
}

// ---------- 预设（先手算断言见自测报告） ----------
// 番茄炒蛋（1 份）：番茄 3×200÷500÷0.95=1.263…；鸡蛋 0.8×3=2.4；油盐糖包干 0.6 → 合计 ≈4.26
const PRESET_TOMATO = {
  name: '番茄炒蛋',
  servings: 1,
  items: [
    { name: '番茄', price: 3, purchaseQty: 500, useQty: 200, unit: 'g', yieldPct: 95 },
    { name: '鸡蛋', price: 0.8, purchaseQty: 1, useQty: 3, unit: '个', yieldPct: 100 },
    { name: '油盐糖', price: 0.6, purchaseQty: 1, useQty: 1, unit: '个', yieldPct: 100 }
  ]
}
// 酸菜鱼（1 份）：黑鱼片 28×400÷500÷0.6=37.333…；酸菜 6×150÷500÷0.9=2；配料包干 2.5 → 合计 ≈41.83
const PRESET_FISH = {
  name: '酸菜鱼',
  servings: 1,
  items: [
    { name: '黑鱼片', price: 28, purchaseQty: 500, useQty: 400, unit: 'g', yieldPct: 60 },
    { name: '酸菜', price: 6, purchaseQty: 500, useQty: 150, unit: 'g', yieldPct: 90 },
    { name: '配料', price: 2.5, purchaseQty: 1, useQty: 1, unit: '个', yieldPct: 100 }
  ]
}

const COMMISSION_OPTIONS = [15, 18, 20, 22, 25]
const FULFILLMENT_OPTIONS = [8, 10, 12, 15]

const judgeMeta = {
  good: { label: '毛利健康', class: 'bg-green-500/10 text-green-600 border-green-500/20' },
  fair: { label: '常见区间', class: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  high: { label: '成本偏高', class: 'bg-red-500/10 text-red-600 border-red-500/20' },
  empty: { label: '', class: 'bg-muted/60 text-foreground border-border' }
}

// ---------- 编辑态 ----------
const STORAGE_KEY = 'recipe-cost-ca...'

const uidSeed = ref(0)
function newUid() {
  uidSeed.value += 1
  return `row-${uidSeed.value}-${Date.now()}`
}

function blankRow() {
  return { uid: newUid(), name: '', price: '', purchaseQty: '', useQty: '', unit: 'g', yieldPct: 100 }
}

const dishName = ref('')
const servingsText = ref('1')
const targetPctText = ref('35')
const salePriceText = ref('')
const commissionText = ref('20')
const fulfillmentText = ref('10')
const batchServingsText = ref('20')
const rows = ref([blankRow()])

const cards = ref([])
const editingId = ref(null)
const armedDeleteId = ref(null)
const copied = ref(false)
const seoContentVisible = ref(true)
const printDate = ref('')

const safeServings = computed(() => Math.max(1, Math.round(num(servingsText.value, 1))))
const safeTargetPct = computed(() => {
  const v = num(targetPctText.value, 35)
  return v > 0 && v <= 100 ? v : 35
})

const currentCard = computed(() => ({
  id: editingId.value || 'draft',
  name: dishName.value,
  servings: safeServings.value,
  items: rows.value.map((r) => ({ ...r }))
}))

const result = computed(() => dishCostOf(rows.value))
const perServingCost = computed(() => round2(result.value.total / safeServings.value))
const priceSug = computed(() => priceOf(perServingCost.value, safeTargetPct.value))

const actualPct = computed(() => actualFoodCostPctOf(num(salePriceText.value), perServingCost.value))
const judge = computed(() => {
  const j = judgeFoodCostPct(actualPct.value)
  return { ...j, class: judgeMeta[j.level] ? judgeMeta[j.level].class : judgeMeta.empty.class }
})

const takeawayPrice = computed(() => takeawayPriceOf(perServingCost.value, safeTargetPct.value, num(commissionText.value, 20), num(fulfillmentText.value, 10)))

const batch = computed(() => batchScaleOf({ servings: safeServings.value, items: rows.value }, num(batchServingsText.value, 0)))

// ---------- 表单辅助 ----------
function money(x) {
  return round2(x).toFixed(2)
}
function rowCostOf(row) {
  return ingredientCostOf(row.price, row.purchaseQty, row.useQty, row.yieldPct)
}
function qtyText(q, unit) {
  return `${Math.round(q * 100) / 100}${unit}`
}
function presetKeyOf(pct) {
  const v = num(pct, 100)
  return YIELD_PRESETS.some((p) => p.value === v) ? String(v) : 'custom'
}
function onPresetSelect(row, key) {
  if (key === 'custom') return
  const v = Number(key)
  if (Number.isFinite(v)) row.yieldPct = v
}

function addRow() {
  if (rows.value.length >= MAX_ROWS) return
  rows.value.push(blankRow())
}
function removeRow(idx) {
  rows.value.splice(idx, 1)
  if (!rows.value.length) rows.value.push(blankRow())
}
function applyPreset(preset) {
  dishName.value = preset.name
  servingsText.value = String(preset.servings)
  rows.value = preset.items.map((it) => ({ ...normalizeItem(it), uid: newUid() }))
  editingId.value = null
}

// ---------- localStorage（读写均只在浏览器侧，读仅在 onMounted） ----------
function persistCards() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards.value))
  } catch (e) {
    // 隐私模式/配额满：静默降级为仅会话内可用
  }
}

function loadCardsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    cards.value = normalizeCardList(raw ? JSON.parse(raw) : [])
  } catch (e) {
    cards.value = []
  }
}

function saveCurrent() {
  const card = normalizeCard({ ...currentCard.value })
  if (!card.items.some((it) => it.name && num(it.price) > 0)) return
  const at = cards.value.findIndex((c) => c.id === card.id)
  if (at >= 0) cards.value.splice(at, 1, card)
  else cards.value.unshift(card)
  editingId.value = card.id
  persistCards()
}

function loadCard(card) {
  dishName.value = card.name
  servingsText.value = String(card.servings)
  rows.value = card.items.length ? card.items.map((it) => ({ ...it })) : [blankRow()]
  editingId.value = card.id
}

function copyCardText() {
  copyText(costCardTextOf(currentCard.value, safeTargetPct.value))
}
function copySavedCard(card) {
  copyText(costCardTextOf(card, safeTargetPct.value))
}
function copyText(text) {
  copied.value = false
  try {
    navigator.clipboard.writeText(text).then(() => {
      copied.value = true
      setTimeout(() => { copied.value = false }, 2500)
    }).catch(() => { window.prompt('复制以下内容：', text) })
  } catch (e) {
    window.prompt('复制以下内容：', text)
  }
}

function removeCard(id) {
  if (armedDeleteId.value === id) {
    cards.value = cards.value.filter((c) => c.id !== id)
    armedDeleteId.value = null
    if (editingId.value === id) editingId.value = null
    persistCards()
    return
  }
  armedDeleteId.value = id
  setTimeout(() => { if (armedDeleteId.value === id) armedDeleteId.value = null }, 3000)
}

function perServingCostOf(card) {
  const calc = dishCostOf(card.items)
  return card.servings > 0 ? calc.total / card.servings : calc.total
}

function printCard() {
  window.print()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  loadCardsFromStorage()
  printDate.value = new Date().toLocaleDateString('zh-CN')
  addRecentTool('recipe-cost-calculator')
})
</script>

<style scoped>
.input-base {
  @apply w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30;
}
.field-label {
  @apply block text-[10px] text-muted-foreground mb-1;
}
</style>
