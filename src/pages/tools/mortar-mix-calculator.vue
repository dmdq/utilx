<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Layers class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">砂浆配比计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">M2.5~M15 砌筑/抹灰砂浆每立方水泥、砂、水用量估算，按体积或按抹灰面积两种算法，袋数吨位一步换算</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线砂浆配比计算器：砌墙、抹灰备料常问的「一立方砂浆要几袋水泥、多少吨砂」这页算清。
        两种模式：①按体积——选强度等级 M2.5/M5/M7.5/M10/M15，按 32.5/42.5 水泥给出每立方米水泥(kg)、
        中砂(kg)、用水量(kg) 的常用经验参考值（依据 JGJ/T 98 砌筑砂浆配合比设计规程的用量区间整理，两源交叉核对，
        以试验室试配为准）；②按面积（抹灰）——墙面面积 × 抹灰厚度（内墙 15~20mm / 外墙 20~25mm 预设）× 损耗 1.03
        得砂浆体积，再按强度查单方用量。输出水泥袋数（50kg/袋、向上取整）、砂吨位、用水量与体积比 1:x 展示。
        全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <div class="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6">
      <Info class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        本页为常用经验参考值：区间依据 JGJ/T 98《砌筑砂浆配合比设计规程》每立方米水泥砂浆材料用量表（32.5 级水泥口径）整理，
        采用值为施工手册/现场常用单值，两源交叉核对。实际工程必须按规程做试验室试配与现场调整确定配合比，
        本页结果仅作备料估算参考，以现行标准原文和试配通知单为准。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Layers class="w-5 h-5 mr-2 text-primary" /> 计算参数
        </h2>

        <!-- 模式 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">计算模式</p>
          <div class="grid grid-cols-2 gap-2" role="group" aria-label="计算模式">
            <button
              type="button"
              class="px-3 py-2 rounded-lg border text-sm font-medium transition"
              :class="mode === 'volume' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="mode = 'volume'"
            >
              按体积
              <span class="block text-[10px] font-normal mt-0.5" :class="mode === 'volume' ? 'text-primary-foreground/80' : 'text-muted-foreground'">需要多少方砂浆</span>
            </button>
            <button
              type="button"
              class="px-3 py-2 rounded-lg border text-sm font-medium transition"
              :class="mode === 'area' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="mode = 'area'"
            >
              按面积（抹灰）
              <span class="block text-[10px] font-normal mt-0.5" :class="mode === 'area' ? 'text-primary-foreground/80' : 'text-muted-foreground'">墙面㎡ × 厚度</span>
            </button>
          </div>
        </div>

        <!-- 强度等级 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">砂浆强度等级</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="g in GRADES"
              :key="g.id"
              type="button"
              class="px-3 py-1.5 rounded-md text-xs font-medium border transition"
              :class="grade === g.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="grade = g.id"
            >{{ g.id }}</button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">砌筑常用 M5/M7.5/M10，承重或水下部位用 M10 以上；抹灰常用 M5~M15。</p>
        </div>

        <!-- 按体积输入 -->
        <div v-if="mode === 'volume'" class="flex items-center gap-3">
          <label for="mm-vol" class="text-sm text-foreground whitespace-nowrap">砂浆体积</label>
          <input
            id="mm-vol"
            v-model.number="volume"
            type="number"
            min="0.01"
            step="0.01"
            class="w-28 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
          <span class="text-sm text-muted-foreground">m³</span>
        </div>

        <!-- 按面积输入 -->
        <div v-if="mode === 'area'" class="space-y-3">
          <div class="flex items-center gap-3">
            <label for="mm-area" class="text-sm text-foreground whitespace-nowrap">抹灰面积</label>
            <input
              id="mm-area"
              v-model.number="wallArea"
              type="number"
              min="0.01"
              step="0.1"
              class="w-28 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <span class="text-sm text-muted-foreground">㎡（单面，门窗洞已扣除）</span>
          </div>
          <div>
            <p class="text-sm font-medium text-foreground mb-1.5">抹灰厚度（底+面合计）</p>
            <div class="flex flex-wrap items-center gap-1.5">
              <button
                v-for="t in THICKNESS_CHIPS"
                :key="t.label"
                type="button"
                class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
                :class="thickness === t.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
                @click="thickness = t.value"
              >{{ t.label }}</button>
              <input
                v-model.number="thickness"
                type="number"
                min="5"
                max="40"
                step="1"
                aria-label="自定义厚度 mm"
                class="w-20 border border-border bg-background rounded-lg px-2 py-1.5 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
              <span class="text-xs text-muted-foreground">mm</span>
            </div>
            <p class="text-[11px] text-muted-foreground mt-1.5">预设按常见口径：内墙 15~20mm、外墙 20~25mm；局部找平另计。</p>
          </div>
          <div class="flex items-center gap-3">
            <label for="mm-loss" class="text-sm text-foreground whitespace-nowrap">损耗系数</label>
            <input
              id="mm-loss"
              v-model.number="loss"
              type="number"
              min="1"
              max="1.3"
              step="0.01"
              class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <span class="text-xs text-muted-foreground">默认 1.03（落地、飞溅与薄边修补余量）</span>
          </div>
        </div>

        <!-- 材料参数 -->
        <div class="border-t border-border pt-4 space-y-3">
          <div>
            <p class="text-sm font-medium text-foreground mb-1.5">水泥强度等级</p>
            <div class="grid grid-cols-2 gap-2" role="group" aria-label="水泥强度等级">
              <button
                v-for="c in CEMENT_GRADES"
                :key="c.id"
                type="button"
                class="px-3 py-2 rounded-lg border text-sm font-medium transition text-left"
                :class="cementGrade === c.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
                @click="cementGrade = c.id"
              >{{ c.label }}
                <span class="block text-[10px] font-normal mt-0.5" :class="cementGrade === c.id ? 'text-primary-foreground/80' : 'text-muted-foreground'">{{ c.note }}</span>
              </button>
            </div>
            <p class="text-[11px] text-muted-foreground mt-1.5">规程口径：表按 32.5 级编制，采用更高等级水泥时水泥用量宜取区间下限。</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <label for="mm-sand" class="text-sm text-foreground whitespace-nowrap">砂堆积密度</label>
            <input
              id="mm-sand"
              v-model.number="sandDensity"
              type="number"
              min="1200"
              max="1800"
              step="10"
              class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <span class="text-xs text-muted-foreground">kg/m³（干中砂常用 1450~1500，湿砂可达 1600）</span>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <label for="mm-water" class="text-sm text-foreground whitespace-nowrap">单方用水量</label>
            <input
              id="mm-water"
              v-model.number="waterPerM3"
              type="number"
              min="240"
              max="340"
              step="5"
              class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
            <span class="text-xs text-muted-foreground">kg/m³（规程 270~330 按稠度选，默认 300）</span>
          </div>
        </div>

        <button
          type="button"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          @click="resetAll"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认参数
        </button>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-4">
        <!-- 备料结果 -->
        <div class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 备料结果（{{ grade }} · {{ cementGrade === 'c325' ? '32.5' : '42.5' }} 水泥 · 中砂）
          </h2>
          <div v-if="result" class="space-y-3">
            <div v-if="mode === 'area'" class="p-3 rounded-lg bg-muted/40 border border-border text-xs text-foreground flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>
                砂浆体积 = {{ fmt(wallArea) }}㎡ × {{ thickness }}mm ÷ 1000 × 损耗{{ loss }} =
                <span class="font-mono font-semibold">{{ fmt(result.volume) }} m³</span>
              </span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="bg-primary/10 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">水泥</p>
                <p class="text-2xl font-bold text-primary font-mono leading-tight">{{ result.cementKgText }}</p>
                <p class="text-[10px] text-muted-foreground mt-1">kg（{{ result.bags }} 袋 × 50kg）</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">中砂</p>
                <p class="text-2xl font-bold text-foreground font-mono leading-tight">{{ result.sandTText }}</p>
                <p class="text-[10px] text-muted-foreground mt-1">吨（{{ result.sandKgText }} kg）</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">用水量</p>
                <p class="text-2xl font-bold text-foreground font-mono leading-tight">{{ result.waterKgText }}</p>
                <p class="text-[10px] text-muted-foreground mt-1">kg（拌合用水）</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">体积比（水泥:砂）</p>
                <p class="text-2xl font-bold text-foreground font-mono leading-tight">{{ result.ratioText }}</p>
                <p class="text-[10px] text-muted-foreground mt-1">按堆积密度折算</p>
              </div>
            </div>
            <div class="p-3 rounded-lg bg-muted/40 border border-border text-xs text-foreground leading-relaxed flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>
                单方口径（每 m³）：水泥 {{ result.cementPerM3 }} kg（规程区间 {{ result.rangeText }}，{{ cementGrade === 'c325' ? '32.5 按常用值' : '42.5 按下限' }}）、
                砂 1 m³ 堆积体积（≈ {{ sandDensity }} kg）、水 {{ waterPerM3 }} kg。
                袋数已向上取整；砂建议按吨位再上浮 3%~5% 备料。
              </span>
            </div>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>以上为经验参考值，正式使用必须按 JGJ/T 98 做试验室试配并按稠度、强度实测调整；现场砂含水率变化时先调水后调砂。</span>
            </p>
            <button
              type="button"
              class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
              @click="copyResult"
            >
              <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制备料单文本
            </button>
          </div>
          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <TriangleAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">参数无效</p>
              <p class="text-xs text-muted-foreground mt-1">体积/面积需大于 0；厚度 5~40mm；损耗 1~1.3；砂密度 1200~1800 kg/m³；用水量 240~340 kg/m³。</p>
            </div>
          </div>
        </div>

        <!-- 单方用量对照表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Table class="w-5 h-5 mr-2 text-primary" /> {{ grade }} 单方用量与规程区间
          </h2>
          <p class="text-xs text-muted-foreground mb-3 leading-relaxed">每立方米水泥砂浆（32.5 级水泥口径）；JGJ/T 98 区间为公开资料整理，采用值为常用经验单值，各施工水平与砂况略有出入。</p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">强度等级</th>
                  <th class="py-2 pr-3 font-medium">规程水泥区间</th>
                  <th class="py-2 pr-3 font-medium">常用采用值</th>
                  <th class="py-2 pr-3 font-medium">袋数/m³</th>
                  <th class="py-2 font-medium">体积比 1:x</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="g in GRADES"
                  :key="g.id"
                  class="border-b border-border/60"
                  :class="grade === g.id ? 'bg-primary/5' : ''"
                >
                  <td class="py-2 pr-3 font-medium text-foreground cursor-pointer" @click="grade = g.id">{{ g.id }}</td>
                  <td class="py-2 pr-3 font-mono text-muted-foreground">{{ g.min }} ~ {{ g.max }} kg</td>
                  <td class="py-2 pr-3 font-mono text-foreground">{{ cementPerM3Of(g.id, 'c325') }} kg</td>
                  <td class="py-2 pr-3 font-mono text-muted-foreground">{{ Math.ceil(cementPerM3Of(g.id, 'c325') / 50) }} 袋</td>
                  <td class="py-2 font-mono text-muted-foreground">1 : {{ ratioOf(g.id) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground mt-3">砂均按 1 m³ 堆积体积（≈ {{ sandDensity }} kg）、水 270~330 kg/m³ 按稠度选用；M2.5~M15 也可做水泥混合砂浆（掺石灰膏改善和易性，掺量按规程另算）。</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-6" open>
      <summary class="text-base font-semibold text-foreground cursor-pointer select-none mb-4">规程依据、材料选择与常见问题</summary>

      <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>砂浆配比计算器是什么？</h2>
      <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
        砂浆 = 胶凝材料（水泥）+ 细骨料（砂）+ 水（+ 掺加料）。备料要回答三个数：多少水泥、多少砂、多少水。
        本工具按 JGJ/T 98《砌筑砂浆配合比设计规程》的每立方米水泥砂浆材料用量区间（32.5 级水泥口径，
        公开资料两源交叉核对）给出 M2.5~M15 的常用经验参考值，并支持两种备料入口：
        按砂浆体积（如 2.5 m³ 砌筑用量）或按抹灰面积（墙面㎡ × 厚度 × 损耗）。
        输出水泥袋数、砂吨位、用水量与体积比。<strong class="text-foreground">注意：经验值仅供备料估算，
        正式配合比必须按规程经试验室试配确定，以现行标准原文为准。</strong>
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">计算公式</h3>
      <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
        <li>按面积：砂浆体积 = 墙面面积(㎡) × 抹灰厚度(mm) ÷ 1000 × 损耗系数（默认 1.03）。</li>
        <li>材料用量 = 砂浆体积 × 单方用量：水泥按强度等级与水泥等级查表（kg/m³）；砂按 1 m³ 堆积体积 × 堆积密度(kg/m³)；水按稠度 270~330 kg/m³ 选用。</li>
        <li>水泥袋数 = ⌈水泥用量 ÷ 50⌉（50kg/袋，向上取整）；砂吨位 = 砂用量(kg) ÷ 1000。</li>
        <li>体积比（水泥:砂）= 1 : 砂堆积体积 ÷ 水泥堆积体积，水泥堆积体积按 1300 kg/m³ 折算（如 M7.5 水泥 240kg ≈ 0.185m³，对 1m³ 砂约为 1:5.4）。</li>
        <li>42.5 级水泥按规程口径"宜取区间下限"；细砂/粗砂、掺石灰膏的混合砂浆需另行试配调整。</li>
      </ul>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">水泥标号 32.5 与 42.5 有什么影响？</h3>
      <p class="text-sm text-muted-foreground leading-relaxed">
        水泥强度越高，达到同样砂浆强度所需的水泥用量越少——规程明确"采用大于 32.5 级的水泥时，水泥用量宜取区间下限"。
        但砂浆强度不只取决于水泥，还取决于砂级配与稠度，普通砌筑/抹灰用 32.5 级（现多对应"32.5 普通硅酸盐"）最常见、
        和易性也更好配；42.5 级多用于 M10 以上或工期紧、需要早强的部位。水泥用量并非越多越好：超过配比的水泥只增加收缩开裂风险，
        不会线性提高砂浆强度。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么强调中砂？</h3>
      <p class="text-sm text-muted-foreground leading-relaxed">
        砂浆用砂以中砂（粒径 0.35~0.5mm 为主）为佳：细砂比表面积大，要裹住同样一层浆需更多水泥且易开裂；
        粗砂颗粒大，抹灰面不易压光、砌缝咬合差。中砂级配适中，既省水泥又有好的和易性。
        用砂还应过筛除杂物、控制含泥量（砌筑 ≤5%、抹灰 ≤3% 的通行口径），含水率变化时要按现场实测调水调砂。
        本页砂用量按"1 m³ 堆积体积"口径（规程表注），堆积密度默认 1500 kg/m³ 可按进场实测调整。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">搭配工具</h3>
      <p class="text-sm text-muted-foreground leading-relaxed">
        需要算混凝土（有石子骨料、按强度与坍落度设计）的配合比与备料，用本站混凝土配比计算器：
        <NuxtLink to="/tools/concrete-mix-calculator/" class="text-primary font-medium hover:underline">/tools/concrete-mix-calculator/</NuxtLink>。
      </p>

      <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-base font-semibold text-foreground">一方 M7.5 砂浆要几袋水泥？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            常用经验值约 240kg/m³（规程区间 220~280，按 32.5 级水泥），即 240÷50 = 4.8 → 备 5 袋；
            砂 1 m³ 堆积体积约 1.5 吨、水约 300kg。42.5 级水泥可按下限约 220kg（4~5 袋）。以试验室试配为准。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">100㎡ 内墙抹灰要备多少料？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            按 20mm 厚、损耗 1.03：砂浆体积 = 100×20÷1000×1.03 = 2.06 m³；M7.5 口径需水泥约 2.06×240 ≈ 494kg（10 袋）、
            砂约 3.09 吨、水约 618kg。外墙 25mm 厚则体积 ×1.25。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">1:3、1:2.5 水泥砂浆是什么强度？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            现场常说的体积比（如 1:3 水泥砂）大致对应 M10~M15 一档，1:4~1:5 对应 M7.5 左右，1:6~1:7 对应 M5 左右——
            但体积比受砂粗细与含水影响很大，不能替代配合比设计。本页"体积比"一栏按堆积密度折算给出参考换算。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">砌筑砂浆和抹灰砂浆配比一样吗？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            同强度等级下单方用量口径一致（水泥/砂/水），差别在稠度与和易性要求：砌筑砂浆稠度一般 70~90mm（砖砌），
            抹灰按工艺 70~100mm；抹灰常掺石灰膏或稠化粉改善保水性。预拌（商品）砂浆按厂标执行，本页按现场拌合口径估算。
          </p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">数据以什么为准？</h3>
          <p class="text-sm text-muted-foreground mt-1">
            区间数据依据 JGJ/T 98《砌筑砂浆配合比设计规程》每立方米水泥砂浆材料用量表整理（公开资料两源交叉核对），
            采用值为施工手册常用经验单值。正式工程以现行标准原文与试验室试配通知单为准；本页全部计算在浏览器本地完成，不上传数据。
          </p>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'mortar-mix-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Layers, Calculator, Info, CheckCircle, TriangleAlert, Copy, Table, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '砂浆配比计算器 - M2.5~M15每立方水泥砂用量与抹灰备料 | 有条工具',
  description: '免费在线砂浆配比计算器：M2.5/M5/M7.5/M10/M15 砌筑抹灰砂浆每立方米水泥(kg)、中砂、用水量经验参考值（依据 JGJ/T 98 用量区间两源交叉整理，以试验室试配为准），按体积或按墙面面积×厚度×损耗 1.03 两种算法，水泥袋数、砂吨位与体积比一键换算，纯浏览器本地计算',
  keywords: '砂浆配比计算器,M7.5砂浆配比,每立方砂浆水泥用量,抹灰砂浆计算,水泥砂比例',
  author: '有条工具',
  ogTitle: '砂浆配比计算器 - 每立方水泥砂用量与抹灰备料 | 有条工具',
  ogDescription: 'M2.5~M15 砌筑/抹灰砂浆按体积或面积算水泥袋数、砂吨位与用水量，规程区间+常用经验值双口径。',
  ogUrl: 'https://www.util.cn/tools/mortar-mix-calculator',
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
          name: '砂浆配比计算器',
          url: 'https://www.util.cn/tools/mortar-mix-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'M2.5~M15 每立方米水泥/砂/水用量（规程区间+常用经验值）',
            '32.5 / 42.5 水泥等级口径（42.5 取区间下限）',
            '按体积或按抹灰面积×厚度×损耗两种算法',
            '内墙 15~20mm / 外墙 20~25mm 厚度预设',
            '水泥袋数(50kg)向上取整与砂吨位换算',
            '体积比 1:x 按堆积密度折算展示',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '砂浆配比计算器', item: 'https://www.util.cn/tools/mortar-mix-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '一方 M7.5 砂浆要几袋水泥？',
              acceptedAnswer: { '@type': 'Answer', text: '常用经验值约 240kg/m³（规程区间 220~280，32.5 级水泥口径），即约 5 袋；砂 1 m³ 堆积体积约 1.5 吨、水约 300kg。42.5 级水泥宜取区间下限。以试验室试配为准。' }
            },
            {
              '@type': 'Question',
              name: '100㎡ 内墙抹灰要备多少料？',
              acceptedAnswer: { '@type': 'Answer', text: '按 20mm 厚、损耗 1.03：砂浆体积 = 100×20÷1000×1.03 = 2.06 m³；M7.5 口径约需水泥 494kg（10 袋）、砂约 3.09 吨、水约 618kg。' }
            },
            {
              '@type': 'Question',
              name: '水泥标号 32.5 与 42.5 有什么影响？',
              acceptedAnswer: { '@type': 'Answer', text: '42.5 级水泥强度更高，达到同强度砂浆所需水泥更少，规程口径为"宜取区间下限"；普通砌筑抹灰多用 32.5 级，和易性更好配。水泥超量不会线性提高强度，反增收缩开裂风险。' }
            },
            {
              '@type': 'Question',
              name: '为什么砂浆要用中砂？',
              acceptedAnswer: { '@type': 'Answer', text: '细砂需更多水泥包裹且易开裂，粗砂不易压光、咬合差；中砂级配适中省水泥且和易性好。含泥量砌筑≤5%、抹灰≤3%，含水率变化时先调水后调砂。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 依据：JGJ/T 98《砌筑砂浆配合比设计规程》每立方米水泥砂浆材料用量表（32.5 级水泥口径）区间，
// 经施工手册/现场常用单值两源交叉核对后锁定采用值；42.5 级按规程"宜取区间下限"。
// 砂用量按规程表注口径：1 m³ 砂堆积体积 × 堆积密度（kg/m³）；水 270~330 kg/m³ 按稠度选。
// 本页为备料估算参考，正式配合比以试验室试配为准。
/* TESTABLE-START */
// 强度等级 → { min, max } 每方水泥区间（kg/m³）；adopt 为 32.5 水泥常用采用值
const GRADE_TABLE = {
  'M2.5': { min: 200, max: 230, adopt: 200 },
  'M5': { min: 200, max: 230, adopt: 220 },
  'M7.5': { min: 220, max: 280, adopt: 240 },
  'M10': { min: 220, max: 280, adopt: 270 },
  'M15': { min: 280, max: 340, adopt: 330 }
}

// 水泥用量（kg/m³）：32.5 → 采用值；42.5 → 区间下限；非法返回 null
function cementPerM3Of(grade, cementGrade) {
  const row = GRADE_TABLE[grade]
  if (!row) return null
  if (cementGrade === 'c425') return row.min
  return row.adopt
}

// 体积比 1:x（水泥:砂）：砂按 1 m³ 堆积体积、水泥堆积体积 = 质量/1300
function volumeRatioOf(grade, cementBulk) {
  const c = cementPerM3Of(grade, 'c325')
  const bulk = Number(cementBulk)
  if (c === null || !Number.isFinite(bulk) || bulk <= 0) return null
  return Math.round((bulk / c) * 10) / 10
}

// 砂浆体积（m³）：面积㎡ × 厚度mm ÷ 1000 × 损耗；非法返回 null
function plasterVolume(areaM2, thicknessMm, loss) {
  const A = Number(areaM2), T = Number(thicknessMm), L = Number(loss)
  if (!Number.isFinite(A) || !Number.isFinite(T) || !Number.isFinite(L) || A <= 0 || T <= 0 || L < 1) return null
  if (T < 5 || T > 40) return null
  if (L > 1.3) return null
  return (A * T) / 1000 * L
}

// 备料汇总：砂浆体积 × 单方用量 → 水泥 kg/袋数、砂 kg、水 kg；非法返回 null
function mortarBatch(volumeM3, grade, cementGrade, sandDensity, waterPerM3) {
  const V = Number(volumeM3)
  const c = cementPerM3Of(grade, cementGrade)
  const S = Number(sandDensity), W = Number(waterPerM3)
  if (!Number.isFinite(V) || V <= 0 || c === null) return null
  if (!Number.isFinite(S) || !Number.isFinite(W) || S < 1200 || S > 1800 || W < 240 || W > 340) return null
  const cementKg = V * c
  const sandKg = V * S
  const waterKg = V * W
  return {
    volume: V,
    cementKg,
    bags: Math.ceil(cementKg / 50),
    sandKg,
    waterKg,
    cementPerM3: c
  }
}

// 抹灰模式一键：面积+厚度+损耗 → 体积 → 备料
function plasterBatch(areaM2, thicknessMm, loss, grade, cementGrade, sandDensity, waterPerM3) {
  const v = plasterVolume(areaM2, thicknessMm, loss)
  if (v === null) return null
  const b = mortarBatch(v, grade, cementGrade, sandDensity, waterPerM3)
  if (!b) return null
  return b
}

function roundTo(v, digits) {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  const p = Math.pow(10, digits)
  return Math.round(n * p) / p
}
/* TESTABLE-END */

function fmt(v) {
  const r = roundTo(v, 2)
  return r === null ? '—' : String(r)
}

// ---------- 静态数据 ----------
const GRADES = [
  { id: 'M2.5', min: 200, max: 230 },
  { id: 'M5', min: 200, max: 230 },
  { id: 'M7.5', min: 220, max: 280 },
  { id: 'M10', min: 220, max: 280 },
  { id: 'M15', min: 280, max: 340 }
]

const CEMENT_GRADES = [
  { id: 'c325', label: '32.5 级', note: '砌筑抹灰常用，按采用值' },
  { id: 'c425', label: '42.5 级', note: '用量取区间下限' }
]

const THICKNESS_CHIPS = [
  { label: '内墙 15mm', value: 15 },
  { label: '内墙 20mm', value: 20 },
  { label: '外墙 25mm', value: 25 }
]

const CEMENT_BULK_DENSITY = 1300 // 水泥堆积密度 kg/m³（折算体积比用）

// ---------- 响应式参数 ----------
const mode = ref('volume')
const grade = ref('M7.5')
const volume = ref(1)
const wallArea = ref(100)
const thickness = ref(20)
const loss = ref(1.03)
const cementGrade = ref('c325')
const sandDensity = ref(1500)
const waterPerM3 = ref(300)

const inputInvalid = computed(() => {
  if (mode.value === 'volume') {
    const v = Number(volume.value)
    return !Number.isFinite(v) || v <= 0
  }
  const a = Number(wallArea.value)
  return !Number.isFinite(a) || a <= 0
})

// 当前模式下的砂浆体积
const volumeM3 = computed(() => {
  if (inputInvalid.value) return null
  if (mode.value === 'volume') {
    const v = Number(volume.value)
    return Number.isFinite(v) && v > 0 ? v : null
  }
  return plasterVolume(wallArea.value, thickness.value, loss.value)
})

const result = computed(() => {
  if (volumeM3.value === null) return null
  const b = mortarBatch(volumeM3.value, grade.value, cementGrade.value, sandDensity.value, waterPerM3.value)
  if (!b) return null
  const row = GRADE_TABLE[grade.value]
  return {
    ...b,
    cementKgText: fmt(roundTo(b.cementKg, 1)),
    sandKgText: fmt(roundTo(b.sandKg, 0)),
    sandTText: fmt(roundTo(b.sandKg / 1000, 2)),
    waterKgText: fmt(roundTo(b.waterKg, 0)),
    bags: b.bags,
    rangeText: `${row.min}~${row.max}`,
    ratioText: `1 : ${volumeRatioOf(grade.value, CEMENT_BULK_DENSITY)}`
  }
})

// ---------- 交互动作 ----------
function ratioOf(gid) {
  return volumeRatioOf(gid, CEMENT_BULK_DENSITY)
}

function resetAll() {
  mode.value = 'volume'
  grade.value = 'M7.5'
  volume.value = 1
  wallArea.value = 100
  thickness.value = 20
  loss.value = 1.03
  cementGrade.value = 'c325'
  sandDensity.value = 1500
  waterPerM3.value = 300
}

function resultText() {
  if (!result.value) return ''
  const r = result.value
  const head = mode.value === 'area'
    ? `抹灰备料单（${grade.value} · ${cementGrade.value === 'c325' ? '32.5' : '42.5'} 水泥 · 中砂）\n面积 ${fmt(wallArea.value)}㎡ × ${thickness}mm × 损耗${loss} = ${fmt(r.volume)} m³ 砂浆`
    : `砌筑备料单（${grade.value} · ${cementGrade.value === 'c325' ? '32.5' : '42.5'} 水泥 · 中砂）\n砂浆体积 ${fmt(r.volume)} m³`
  return `${head}\n水泥：${r.cementKgText} kg（${r.bags} 袋 × 50kg）\n中砂：${r.sandKgText} kg ≈ ${r.sandTText} 吨\n用水量：${r.waterKgText} kg\n体积比（水泥:砂）：${r.ratioText}\n提示：经验参考值，正式配合比按 JGJ/T 98 试验室试配确定。`
}

async function copyResult() {
  const text = resultText()
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制')
  } catch {
    alert('复制失败，请手动记录数值')
  }
}

onMounted(() => {
  addRecentTool('mortar-mix-calculator')
})
</script>
