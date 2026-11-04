<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Wrench class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">螺纹规格速查表</h1>
          <p class="text-sm text-muted-foreground mt-1">公制粗/细牙、美制 UNC/UNF、管螺纹 G 与 NPT 的牙距、大径、攻丝底孔一表对照，附 TPI 换算、扳手对边反查与打印导出</p>
        </div>
      </div>
      <p class="text-muted-foreground no-print">
        在线螺纹规格速查表：内置公制粗牙 M3-M24、常用公制细牙、美制统一螺纹 UNC/UNF、管螺纹 G 与 NPT 的公开标准数据，按「规格 · 牙距/TPI · 大径 · 底孔」对照；
        搜索框同时认「M8」「8毫米」与 1/2" 分数写法，点击任意行可展开中径/小径近似值、钢与铸铁两档底孔、8.8 级扭矩粗算与备注；
        另带 TPI 与毫米牙距双向换算器、按「对边≈1.5×直径」经验式反推常见规格的扳手反查，可复制 TSV、下载或打印速查卡。
        适合机加工选钻头、钳工维修配螺栓、3D 打印建模定参数、海淘买家核对英制规格，全部数据与计算在浏览器本地完成，不上传任何信息。
      </p>
      <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 no-print">
        <TriangleAlert class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed text-foreground">
          数据为 ISO 公制普通螺纹（GB/T 193/196 同源）、英制惠氏、常用管螺纹公开标准整理；底孔为 71% 旋合量经验值（钢/韧性材料），铸铁或精密配合请按手册修正；正式生产以现行标准文本为准。
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：检索 / 换算 / 反查 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 no-print">
        <h2 class="text-lg font-semibold flex items-center">
          <Search class="w-5 h-5 mr-2 text-primary" /> 检索与换算
        </h2>

        <!-- 搜索 -->
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder='如 M8 / 8毫米 / 1/2" / G1/2'
            class="w-full pl-3 pr-14 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            aria-label="清除搜索"
          >
            清除
          </button>
        </div>

        <!-- 系列 tab -->
        <div>
          <p class="text-xs text-muted-foreground mb-1.5">系列过滤</p>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="tab in SERIES_TABS"
              :key="tab.id"
              @click="activeSeries = tab.id"
              class="px-2 py-1.5 rounded-lg border text-xs font-medium transition"
              :class="activeSeries === tab.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- TPI 换算器 -->
        <div class="border-t border-border pt-3 space-y-2.5">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">换算器 · TPI ↔ 毫米牙距</p>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <p class="text-xs text-muted-foreground mb-1">牙数 TPI（牙/英寸）</p>
              <input
                v-model="tpiIn"
                type="text"
                inputmode="decimal"
                placeholder="如 20"
                class="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <p class="text-xs text-muted-foreground mb-1">牙距 mm</p>
              <input
                v-model="pitchIn"
                type="text"
                inputmode="decimal"
                placeholder="如 1.25"
                class="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            TPI 20 → 牙距 <span class="font-mono text-foreground">{{ pitchFromTpiText }}</span>；
            牙距 1.5mm → <span class="font-mono text-foreground">{{ tpiFromPitchText }}</span>。
            换算式：牙距 = 25.4 ÷ TPI（任一侧输入即算）。
          </p>
        </div>

        <!-- 扳手对边反查 -->
        <div class="border-t border-border pt-3 space-y-2.5">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">反查 · 看到扳手猜规格</p>
          <div class="flex gap-2">
            <input
              v-model="afIn"
              type="text"
              inputmode="decimal"
              placeholder="螺栓头/螺母对边 mm，如 14"
              class="flex-1 px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div v-if="afCandidates.length" class="space-y-1.5">
            <div
              v-for="cand in afCandidates"
              :key="cand.uid"
              class="flex items-center justify-between gap-2 bg-muted/50 rounded-lg px-2.5 py-1.5 text-sm"
            >
              <span class="font-semibold text-foreground">{{ cand.spec }}</span>
              <span class="text-xs text-muted-foreground font-mono">经验对边 {{ cand.estimate }} · 标准 {{ cand.afHint || '—' }}</span>
            </div>
            <p class="text-[10px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
              <TriangleAlert class="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>经验式「对边≈1.5×公称直径」仅供初判：同一下扳手尺寸可能是半标准老件或英制件（如 14 对边常见 M9×1.25 半标准、3/8-24 UNF、汽车法兰件），精确核对请量螺纹大径与牙距回表比对。</span>
            </p>
          </div>
          <p v-else class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info v-if="!hasAfInput" class="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <TriangleAlert v-else class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{{ hasAfInput ? '输入的对边尺寸超出本表 M3-M24/3/4" 范围，或数值无效。' : '输入手上扳手或螺栓头对边（mm），按经验式反推最可能的螺纹规格。' }}</span>
          </p>
        </div>
      </div>

      <!-- 右侧：速查表（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
          <h2 class="text-lg font-semibold flex items-center">
            <Wrench class="w-5 h-5 mr-2 text-primary" /> 螺纹规格速查表
          </h2>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs text-muted-foreground font-mono">当前 {{ filteredRows.length }} 条</span>
            <button
              @click="copyTsv"
              class="px-3 py-1.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-xs font-medium text-foreground transition"
            >
              <CheckCircle v-if="copyStatus === 'ok'" class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-green-600" />
              <Copy v-else class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-primary" />
              {{ copyStatus === 'ok' ? '已复制' : copyStatus === 'fail' ? '复制失败' : '复制 TSV' }}
            </button>
            <button
              @click="saveTsv"
              class="px-3 py-1.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-xs font-medium text-foreground transition"
            >
              <Download class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-primary" /> 下载 TSV
            </button>
            <button
              @click="printCard"
              class="px-3 py-1.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-xs font-medium text-foreground transition"
            >
              打印速查卡
            </button>
          </div>
        </div>

        <div class="overflow-x-auto print-table-card">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-muted-foreground border-b border-border">
                <th class="py-2 pr-3 font-medium">规格</th>
                <th class="py-2 pr-3 font-medium">系列</th>
                <th class="py-2 pr-3 font-medium">牙距 mm</th>
                <th class="py-2 pr-3 font-medium">牙/英寸</th>
                <th class="py-2 pr-3 font-medium">大径 mm</th>
                <th class="py-2 pr-3 font-medium">底孔 mm(钢)</th>
                <th class="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="row in filteredRows" :key="row.uid">
                <tr
                  @click="toggleRow(row.uid)"
                  class="border-b border-border/50 cursor-pointer hover:bg-muted/50 transition"
                  :class="expandedKey === row.uid ? 'bg-primary/10' : ''"
                >
                  <td class="py-2.5 pr-3 font-semibold text-foreground whitespace-nowrap">
                    {{ row.spec }}
                    <span v-if="expandedKey === row.uid" class="ml-2 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-medium">详情</span>
                  </td>
                  <td class="py-2.5 pr-3 text-xs text-muted-foreground whitespace-nowrap">{{ row.name }}</td>
                  <td class="py-2.5 pr-3 font-mono text-foreground whitespace-nowrap">{{ pitchDisplayOf(row) }}</td>
                  <td class="py-2.5 pr-3 font-mono text-muted-foreground whitespace-nowrap">{{ row.tpi ?? '—' }}</td>
                  <td class="py-2.5 pr-3 font-mono text-foreground whitespace-nowrap">{{ row.majorMm }}</td>
                  <td class="py-2.5 pr-3 font-mono text-foreground whitespace-nowrap">{{ row.tapDrillMm ?? '—' }}</td>
                  <td class="py-2.5 text-right text-muted-foreground">
                    <ChevronUp v-if="expandedKey === row.uid" class="w-4 h-4 inline" />
                    <ChevronDown v-else class="w-4 h-4 inline" />
                  </td>
                </tr>
                <tr v-if="expandedKey === row.uid" class="bg-muted/30">
                  <td :colspan="7" class="px-3 py-3">
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                      <p class="text-muted-foreground">中径 d2 ≈ <span class="font-mono text-foreground">{{ rowDetailOf(row).d2 }}</span> mm</p>
                      <p class="text-muted-foreground">小径 ≈ <span class="font-mono text-foreground">{{ rowDetailOf(row).d3 }}</span> mm</p>
                      <p class="text-muted-foreground">底孔·钢 <span class="font-mono text-foreground">{{ rowDetailOf(row).drillSteel }}</span> mm</p>
                      <p class="text-muted-foreground">底孔·铸铁 <span class="font-mono text-foreground">{{ rowDetailOf(row).drillCast }}</span> mm</p>
                      <p class="text-muted-foreground">8.8 级扭矩 <span class="font-mono text-foreground">{{ rowDetailOf(row).torque }}</span></p>
                      <p class="text-muted-foreground">牙型角 <span class="font-mono text-foreground">{{ rowDetailOf(row).angleText }}</span></p>
                      <p class="text-muted-foreground sm:col-span-2">对边参考 <span class="font-mono text-foreground">{{ rowDetailOf(row).afHint }}</span></p>
                    </div>
                    <p v-if="row.notes" class="text-xs text-muted-foreground mt-2 leading-relaxed">
                      <Info class="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-primary" /> {{ row.notes }}
                    </p>
                    <p class="text-[10px] text-muted-foreground/80 mt-2 leading-relaxed">
                      详情口径：中径/小径按 60° ISO 牙型近似（G/NPT 牙型角不同仅为估算）；铸铁底孔 = 大径 − 1.1×牙距（GB/T 手册口径），管螺纹请参照对应丝锥专用底孔；扭矩为 μ≈0.14 粗算参考，正式装配力矩查设计手册或标准。
                    </p>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          <p v-if="filteredRows.length === 0" class="text-xs text-muted-foreground py-4 text-center">
            没有匹配「{{ searchQuery }}」的螺纹规格：试试 M8、1/2、G1/2、20（TPI）或 14（扳手对边去左侧反查）。
          </p>
        </div>

        <!-- 常用预设 -->
        <div class="border-t border-border pt-4 no-print">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">常用预设</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="p in PRESETS"
              :key="p.id"
              @click="applyPreset(p)"
              class="px-3 py-1.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-xs font-medium text-foreground transition"
            >
              <Play class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-primary" /> {{ p.label }}<span class="text-muted-foreground">（{{ p.hint }}）</span>
            </button>
          </div>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed no-print">
          提示：点击任意行展开详情卡。粗牙未标牙距即为默认系列（如「M8」即 M8×1.25），细牙必须在图样上标出牙距（如 M12×1.5）。
          英制行的大径为 分数英寸 × 25.4 换算并保留两位；管螺纹底孔为攻丝专用孔经验值，比「大径−牙距」口径略大。
        </p>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>螺纹规格速查表是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          螺纹规格速查表是一面给机加工、钳工维修、3D 打印建模与海淘买家的对照工具。它把 ISO 公制普通螺纹（GB/T 193/196 同源）的粗牙与常用细牙系列、
          美制统一螺纹 UNC/UNF、管螺纹 G（ISO 228）与 NPT（ANSI/ASME B1.20.1）的牙距（或每英寸牙数 TPI）、大径与攻丝底孔放在一起对照，
          支持按规格、毫米数或英制分数搜索，点击行展开中径/小径近似、钢与铸铁两档底孔与 8.8 级扭矩粗算，并内置 TPI↔毫米牙距换算器和扳手对边反查。全部数据与计算在浏览器本地完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">粗牙和细牙怎么分？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          ISO 261/GB/T 193 为每个公称直径规定了多个标准牙距，其中最大的那一个是「粗牙」（默认系列），其余更小牙距统称「细牙」。
          例如 M12 的粗牙是 ×1.75，×1.25、×1.5、×1 就是细牙。图纸与紧固件标记上，粗牙省略牙距（写 M8 即 M8×1.25），细牙必须标出（M12×1.5）。
          粗牙强度高、装配快、通用性好；细牙牙浅、自锁与抗振性好、适合薄壁件与微调机构，同一直径细牙承载旋合长度更短。英制统一螺纹同理：UNC 为粗牙系列、UNF 为细牙系列。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">UNC 和 UNF、G 和 NPT 能互拧吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          UNC 与 UNF 牙型角同为 60°、大径系列相同，只是牙距不同——同一直径的 UNC 与 UNF 不可互换（1/4-20 与 1/4-28 硬拧只会毁螺纹）；
          跨系列勉强能旋入的也只是直径相近的巧合，强度与旋合都不成立。G 与 NPT 则是另一种区别：G 是 55° 牙型角的非密封平行管螺纹（ISO 228/GB/T 7307），
          密封靠垫圈或密封胶；NPT 是 60° 牙型角、1:16 锥度的美制密封锥管螺纹（ANSI/ASME B1.20.1），同规格每英寸牙数也不同（如 1/2 的 G 是 11 牙、NPT 是 14 牙），
          靠锥面金属挤压密封。二者参考直径接近但牙型角与直/锥都不同，绝不可互相替代或强行拧配。英制惠氏 BSW/BSF（55° 平牙）在英国已淘汰，本表收录现行统一螺纹，老件核对可用同直径 UNC 试配前先量 TPI。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">底孔为什么不是小径？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          如果按螺纹小径钻孔，丝锥要切削出 100% 完整牙型，切削量与扭矩过大，容易崩丝锥、烂牙，尤其小直径或不锈钢件。
          工程上按约 71%-85% 旋合量选底孔：螺纹强度损失很小，扭矩却大幅下降。常用经验式「钢及韧性材料：底孔 = 大径 − 1.0×牙距」（M8×1.25 → 6.8），
          「灰铸铁等脆性材料：底孔 = 大径 − 1.1×牙距」（切屑呈碎屑、挤压隆起小，可取更高旋合量，M8 → 6.6）。
          本表底孔列即按此口径给出经验值（圆整到 0.1mm 的钻头/铰刀可及尺寸），精密配合或高强度螺纹锁固请按手册修正。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">3D 打印建模画螺纹要哪三个参数？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          三个参数定一条可打印螺纹：① 公称大径 D（决定外形）；② 牙距 P（或英制换算成 TPI，决定一圈进给量）；③ 牙型角（ISO 公制与统一螺纹 60°、惠氏与 G 55°）。
          建模时按 D 与 P 画三角牙廓即可（本表行详情给出中径/小径近似值辅助校核）。FDM 打印建议公母件各留 0.15-0.4mm 间隙补偿（视打印机精度先打试片），
          树脂打印间隙可收窄到 0.1-0.2mm；受力配合优先选粗牙或细牙大直径，避免 0.5mm 牙距直接打印。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">左旋螺纹怎么标注？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          国标默认右旋省略不标；左旋在规格后加注：公制如 M12×1.5-LH（旧国内图纸也写「左」或「L」），管螺纹如 G1/2L、Rc1/2L（GB/T 7306 用 LH/L 表示左旋），
          英制如 1/4-20 UNC-LH（美标）或 BSW R/L。左旋常用于反向旋转会松脱的场景：自行车左脚踏曲柄、砂轮护罩、吊装旋转机构等。维修拆装前先看清旋转方向，别用蛮力。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">M8 螺丝攻丝要打多大的孔？</h3>
            <p class="text-sm text-muted-foreground mt-1">钢及韧性材料按经验式「大径 − 牙距」取 8 − 1.25 ≈ 6.8mm；灰铸铁取 8 − 1.1×1.25 ≈ 6.6mm。表内底孔列均为该口径圆整值，不锈钢、铝合金等请按旋合量再微调。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">看到 14 的扳手，螺栓大概是几号？</h3>
            <p class="text-sm text-muted-foreground mt-1">按「对边≈1.5×公称直径」经验式，14 对边大致对应 M9-M10，最常见的是 M8/M10 的薄头、法兰头件或老标准半螺纹件（如 M9×1.25、3/8-24 UNF 英制件）。反查卡会列出候选，最终以量出的螺纹大径与牙距回表确认为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">1/2-13 和 G1/2 是不是一种螺纹？</h3>
            <p class="text-sm text-muted-foreground mt-1">不是。1/2-13 是美制统一螺纹 UNC 紧固件螺纹（60° 牙型，大径 12.7mm、牙距 1.955mm）；G1/2 是英制管螺纹（55° 牙型、11 牙/英寸，参考大径 20.955mm）。前者拧螺栓，后者接管子，直径含义也完全不同（管螺纹 1/2 对应通径 DN15 而非 12.7mm）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">表里的数据能直接用于正式生产吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">建议作为车间速查与选型参考。本表按公开标准口径整理（ISO 261/228、GB/T 193/196/7307、ANSI/ASME B1.20.1、统一螺纹标准），底孔与扭矩是经验粗算值；正式生产、检验与合同技术条款请以现行有效标准文本与设计手册为准。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="no-print">
      <RelatedTools :currentToolId="'thread-reference-table'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Wrench, Search, Download, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '螺纹规格速查表 - 公制英制管螺纹牙距大径底孔对照工具',
  description: '免费在线螺纹规格速查表，公制粗牙M3-M24/细牙、美制UNC/UNF、管螺纹G与NPT的牙距、大径、攻丝底孔对照，支持M8/1/2"分数搜索、TPI与毫米牙距双向换算、扳手对边反查与TSV导出打印，机加工钳工3D打印常用，纯浏览器本地运行不上传',
  keywords: '螺纹规格表,公制螺纹牙距,M8 底孔,英制螺纹 TPI,管螺纹 G 和 NPT',
  author: '有条工具',
  ogTitle: '螺纹规格速查表 - 公制英制管螺纹牙距大径底孔对照工具 | 有条工具',
  ogDescription: '公制粗/细牙、UNC/UNF、G 与 NPT 的牙距·大径·底孔一表对照，附 TPI 换算与扳手对边反查。',
  ogUrl: 'https://www.util.cn/tools/thread-reference-table',
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
          name: '螺纹规格速查表',
          url: 'https://www.util.cn/tools/thread-reference-table',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '公制粗牙 M3-M24 牙距/大径/底孔对照',
            '常用公制细牙与美制 UNC/UNF 换算列',
            '管螺纹 G 与 NPT 数据及互换性说明',
            'M8 / 8毫米 / 1/2" 分数混合搜索',
            'TPI 与毫米牙距双向换算器',
            '扳手对边经验反查常见规格',
            '行详情：中径/小径/铸铁底孔/8.8 级扭矩粗算',
            'TSV 复制下载与打印速查卡'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '螺纹规格速查表', item: 'https://www.util.cn/tools/thread-reference-table/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'M8 螺丝攻丝要打多大的孔？',
              acceptedAnswer: { '@type': 'Answer', text: '钢及韧性材料按经验式「大径减牙距」取 8-1.25≈6.8mm；灰铸铁取 8-1.1×1.25≈6.6mm。表内底孔列均为该口径圆整值，不锈钢、铝合金等请按旋合量再微调。' }
            },
            {
              '@type': 'Question',
              name: '看到 14 的扳手，螺栓大概是几号？',
              acceptedAnswer: { '@type': 'Answer', text: '按对边约等于1.5倍公称直径的经验式，14 对边大致对应 M9-M10，常见于 M8/M10 的薄头、法兰头件或老标准半螺纹件（如 M9×1.25、3/8-24 UNF 英制件），最终以量出的螺纹大径与牙距回表确认为准。' }
            },
            {
              '@type': 'Question',
              name: '1/2-13 和 G1/2 是不是一种螺纹？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。1/2-13 是美制统一螺纹 UNC 紧固件螺纹（60°牙型，大径12.7mm、牙距1.955mm）；G1/2 是英制管螺纹（55°牙型、11牙/英寸，参考大径20.955mm），管螺纹的 1/2 对应通径 DN15 而非 12.7mm。' }
            },
            {
              '@type': 'Question',
              name: '表里的数据能直接用于正式生产吗？',
              acceptedAnswer: { '@type': 'Answer', text: '建议作为车间速查与选型参考。数据按公开标准口径整理（ISO 261/228、GB/T 193/196/7307、ANSI/ASME B1.20.1），底孔与扭矩是经验粗算值；正式生产与合同技术条款请以现行有效标准文本与设计手册为准。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 数据口径（逐列与公开标准核对，来源说明见各系列注释）：
//   公制粗牙：GB/T 193 / ISO 261 大系列（第一系列）标准牙距；大径=公称直径；
//             底孔为「钢/韧性材料 大径 − 1.0×牙距」71-75% 旋合量经验值（机械工人手册口径，圆整到 0.1mm）。
//   公制细牙：GB/T 193 小牙距系列中选 8 条常用（1/1.25/1.5 属标准细牙系列）；底孔同上口径。
//   UNC/UNF ：ASME B1.1 统一螺纹标准粗/细牙系列，TPI 为标准值；大径 mm = 英寸标称 × 25.4（保留两位）；
//             牙距 mm = 25.4 ÷ TPI；底孔按 大径 − 牙距 经验口径圆整（≈#7 钻/71% 档附近）。
//   G 系列  ：ISO 228-1 / GB/T 7307 非密封平行管螺纹，牙数 28/19/19/11/11/11 每英寸、
//             参考大径 9.728/13.157/16.662/20.955/26.441/33.249 为公开标准值；底孔为攻丝专用孔经验值。
//   NPT 列  ：ANSI/ASME B1.20.1 60° 锥管螺纹（1:16 锥度），大径取 ~管端外径近似值（标注"约"），
//             与 G（55° 平行）牙型角与每英寸牙数均不同，仅直径量级接近，密封方式不同不可互换。
const INCH_MM = 25.4
const FASTENER_SERIES = ['coarse', 'fine', 'unc', 'unf']

function round1(x) { return Math.round(x * 10) / 10 }
function round2(x) { return Math.round(x * 100) / 100 }
function round3(x) { return Math.round(x * 1000) / 1000 }

const THREAD_DB = [
  // —— 公制粗牙（GB/T 193 标准牙距，底孔 = D − P 经验值）——
  { series: 'coarse', name: '公制粗牙', spec: 'M3×0.5', pitchMm: 0.5, majorMm: 3, tapDrillMm: 2.5, notes: '电子/小机构，配 5.5 扳手' },
  { series: 'coarse', name: '公制粗牙', spec: 'M4×0.7', pitchMm: 0.7, majorMm: 4, tapDrillMm: 3.3, notes: '电子/3D打印件常用' },
  { series: 'coarse', name: '公制粗牙', spec: 'M5×0.8', pitchMm: 0.8, majorMm: 5, tapDrillMm: 4.2 },
  { series: 'coarse', name: '公制粗牙', spec: 'M6×1', pitchMm: 1, majorMm: 6, tapDrillMm: 5 },
  { series: 'coarse', name: '公制粗牙', spec: 'M8×1.25', pitchMm: 1.25, majorMm: 8, tapDrillMm: 6.8, notes: '最常见规格，标准对边 13' },
  { series: 'coarse', name: '公制粗牙', spec: 'M10×1.5', pitchMm: 1.5, majorMm: 10, tapDrillMm: 8.5, notes: '标准对边 16/17' },
  { series: 'coarse', name: '公制粗牙', spec: 'M12×1.75', pitchMm: 1.75, majorMm: 12, tapDrillMm: 10.2, notes: '自行车/机架常用' },
  { series: 'coarse', name: '公制粗牙', spec: 'M14×2', pitchMm: 2, majorMm: 14, tapDrillMm: 12 },
  { series: 'coarse', name: '公制粗牙', spec: 'M16×2', pitchMm: 2, majorMm: 16, tapDrillMm: 14 },
  { series: 'coarse', name: '公制粗牙', spec: 'M18×2.5', pitchMm: 2.5, majorMm: 18, tapDrillMm: 15.5 },
  { series: 'coarse', name: '公制粗牙', spec: 'M20×2.5', pitchMm: 2.5, majorMm: 20, tapDrillMm: 17.5 },
  { series: 'coarse', name: '公制粗牙', spec: 'M22×2.5', pitchMm: 2.5, majorMm: 22, tapDrillMm: 19.5 },
  { series: 'coarse', name: '公制粗牙', spec: 'M24×3', pitchMm: 3, majorMm: 24, tapDrillMm: 21 },
  // —— 公制细牙（GB/T 193 小牙距系列，8 条常用）——
  { series: 'fine', name: '公制细牙', spec: 'M8×1', pitchMm: 1, majorMm: 8, tapDrillMm: 7, notes: '薄壁/微调机构' },
  { series: 'fine', name: '公制细牙', spec: 'M10×1', pitchMm: 1, majorMm: 10, tapDrillMm: 9 },
  { series: 'fine', name: '公制细牙', spec: 'M10×1.25', pitchMm: 1.25, majorMm: 10, tapDrillMm: 8.8 },
  { series: 'fine', name: '公制细牙', spec: 'M12×1.25', pitchMm: 1.25, majorMm: 12, tapDrillMm: 10.8 },
  { series: 'fine', name: '公制细牙', spec: 'M12×1.5', pitchMm: 1.5, majorMm: 12, tapDrillMm: 10.5, notes: '汽车轮毂常见' },
  { series: 'fine', name: '公制细牙', spec: 'M14×1.5', pitchMm: 1.5, majorMm: 14, tapDrillMm: 12.5, notes: '汽车轮毂常见' },
  { series: 'fine', name: '公制细牙', spec: 'M16×1.5', pitchMm: 1.5, majorMm: 16, tapDrillMm: 14.5 },
  { series: 'fine', name: '公制细牙', spec: 'M20×1.5', pitchMm: 1.5, majorMm: 20, tapDrillMm: 18.5 },
  // —— 美制统一粗牙 UNC（ASME B1.1：大径=英寸×25.4，底孔=大径−牙距）——
  { series: 'unc', name: '美制 UNC', spec: '1/4-20', tpi: 20, majorMm: 6.35, tapDrillMm: 5.1 },
  { series: 'unc', name: '美制 UNC', spec: '5/16-18', tpi: 18, majorMm: 7.94, tapDrillMm: 6.5 },
  { series: 'unc', name: '美制 UNC', spec: '3/8-16', tpi: 16, majorMm: 9.52, tapDrillMm: 7.9 },
  { series: 'unc', name: '美制 UNC', spec: '1/2-13', tpi: 13, majorMm: 12.7, tapDrillMm: 10.7, notes: '绞盘/美机进口常见' },
  { series: 'unc', name: '美制 UNC', spec: '5/8-11', tpi: 11, majorMm: 15.88, tapDrillMm: 13.6 },
  { series: 'unc', name: '美制 UNC', spec: '3/4-10', tpi: 10, majorMm: 19.05, tapDrillMm: 16.5 },
  // —— 美制统一细牙 UNF（ASME B1.1）——
  { series: 'unf', name: '美制 UNF', spec: '1/4-28', tpi: 28, majorMm: 6.35, tapDrillMm: 5.4 },
  { series: 'unf', name: '美制 UNF', spec: '5/16-24', tpi: 24, majorMm: 7.94, tapDrillMm: 6.9 },
  { series: 'unf', name: '美制 UNF', spec: '3/8-24', tpi: 24, majorMm: 9.52, tapDrillMm: 8.5, notes: '航空/汽车钣金薄壁' },
  { series: 'unf', name: '美制 UNF', spec: '7/16-20', tpi: 20, majorMm: 11.11, tapDrillMm: 9.8 },
  { series: 'unf', name: '美制 UNF', spec: '1/2-20', tpi: 20, majorMm: 12.7, tapDrillMm: 11.4 },
  { series: 'unf', name: '美制 UNF', spec: '9/16-18', tpi: 18, majorMm: 14.29, tapDrillMm: 12.9 },
  { series: 'unf', name: '美制 UNF', spec: '5/8-18', tpi: 18, majorMm: 15.88, tapDrillMm: 14.5 },
  { series: 'unf', name: '美制 UNF', spec: '3/4-16', tpi: 16, majorMm: 19.05, tapDrillMm: 17.5 },
  // —— 管螺纹 G（ISO 228 / GB/T 7307，55° 非密封平行；底孔为攻丝专用孔经验值）——
  { series: 'g', name: '管螺纹 G', spec: 'G1/8', tpi: 28, majorMm: 9.728, tapDrillMm: 8.8, notes: '55° 平行，密封靠垫圈/生料带；旧「管螺纹」标注勿混' },
  { series: 'g', name: '管螺纹 G', spec: 'G1/4', tpi: 19, majorMm: 13.157, tapDrillMm: 11.4 },
  { series: 'g', name: '管螺纹 G', spec: 'G3/8', tpi: 19, majorMm: 16.662, tapDrillMm: 15 },
  { series: 'g', name: '管螺纹 G', spec: 'G1/2', tpi: 11, majorMm: 20.955, tapDrillMm: 19, notes: '水暖最常见（DN15），11 牙/英寸' },
  { series: 'g', name: '管螺纹 G', spec: 'G3/4', tpi: 11, majorMm: 26.441, tapDrillMm: 24.3 },
  { series: 'g', name: '管螺纹 G', spec: 'G1', tpi: 11, majorMm: 33.249, tapDrillMm: 30.3, notes: '对应通径 DN25' },
  // —— 管螺纹 NPT（ANSI/ASME B1.20.1，60° 1:16 锥度密封；大径为管端近似值）——
  { series: 'npt', name: '锥管螺纹 NPT', spec: 'NPT1/8', tpi: 27, majorMm: 10.3, tapDrillMm: null, notes: '60° 锥管，密封靠锥面挤压，不可与 G 互换' },
  { series: 'npt', name: '锥管螺纹 NPT', spec: 'NPT1/4', tpi: 18, majorMm: 13.7, tapDrillMm: null },
  { series: 'npt', name: '锥管螺纹 NPT', spec: 'NPT3/8', tpi: 18, majorMm: 17.1, tapDrillMm: null },
  { series: 'npt', name: '锥管螺纹 NPT', spec: 'NPT1/2', tpi: 14, majorMm: 21.3, tapDrillMm: null, notes: '美标气路/水路常用，14 牙 ≠ G1/2 的 11 牙' },
  { series: 'npt', name: '锥管螺纹 NPT', spec: 'NPT3/4', tpi: 14, majorMm: 26.7, tapDrillMm: null },
  { series: 'npt', name: '锥管螺纹 NPT', spec: 'NPT1', tpi: 11.5, majorMm: 33.4, tapDrillMm: null }
]

// 公制粗牙标准对边（ISO 4014/4032 新旧两档并列），用于反查卡与详情行
const STANDARD_AF_BY_SPEC = {
  'M3×0.5': '5.5', 'M4×0.7': '7', 'M5×0.8': '8', 'M6×1': '10', 'M8×1.25': '13',
  'M10×1.5': '16/17', 'M12×1.75': '18/19', 'M14×2': '21/22', 'M16×2': '24',
  'M18×2.5': '27', 'M20×2.5': '30', 'M22×2.5': '32', 'M24×3': '36'
}

// 行牙距：紧固件系列直接取表值；管螺纹由 TPI 换算（25.4 ÷ 牙数）
function pitchMmOf(row) {
  if (typeof row.pitchMm === 'number' && row.pitchMm > 0) return row.pitchMm
  if (typeof row.tpi === 'number' && row.tpi > 0) return round3(INCH_MM / row.tpi)
  return null
}

// 搜索词归一化：小写、分数符号、去引号标记、毫米→mm、×→x、去空格
// '1/2"'→'1/2'；'8毫米'→'8mm'；'M8×1.25'→'m8x1.25'；'G 1/2'→'g1/2'
function normalizeQuery(raw) {
  let s = String(raw ?? '').trim().toLowerCase()
  const VULGAR = { '½': '1/2', '¼': '1/4', '¾': '3/4', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8' }
  s = s.replace(/[½¼¾⅛⅜⅝]/g, (ch) => VULGAR[ch])
  s = s.replace(/["″]/g, '')
  s = s.replace(/毫米/g, 'mm')
  s = s.replace(/×/g, 'x')
  s = s.replace(/\s+/g, '')
  return s
}

// 行可检索文本（规格/系列名/大径mm/牙距mm/TPI/备注 归一化后拼接）
function haystackOf(row) {
  const parts = [row.spec, row.name, row.series, `${row.majorMm}mm`, row.notes || '']
  const p = pitchMmOf(row)
  if (p !== null) parts.push(`${p}mm`)
  if (row.tpi) parts.push(`${row.tpi}tpi`)
  return normalizeQuery(parts.join(' '))
}

const THREAD_TABLE = THREAD_DB.map((row) => ({ ...row, uid: `${row.series}|${row.spec}`, hay: haystackOf(row) }))

// 过滤：系列 tab + 归一化搜索词（空串不过滤）
// 纯数字毫米查询（如「8毫米」归一为 8mm）按大径/牙距精确等值匹配，避免 9.728mm 被子串误命中
function filterRows(rows, series, query) {
  const q = normalizeQuery(query)
  const mmMatch = /^(\d+(?:\.\d+)?)mm$/.exec(q)
  return rows.filter((r) => {
    if (series !== 'all' && r.series !== series) return false
    if (!q) return true
    if (mmMatch) {
      const v = Number(mmMatch[1])
      return r.majorMm === v || pitchMmOf(r) === v
    }
    return r.hay.includes(q)
  })
}

// TPI → 毫米牙距（保留 3 位）；非法输入返回 null
function tpiToPitchMm(tpi) {
  return typeof tpi === 'number' && tpi > 0 ? round3(INCH_MM / tpi) : null
}

// 毫米牙距 → TPI（保留 2 位，非整数如实显示，如 1.5mm → 16.93）
function pitchMmToTpi(pitchMm) {
  return typeof pitchMm === 'number' && pitchMm > 0 ? round2(INCH_MM / pitchMm) : null
}

// 反查：经验式 对边 AF ≈ 1.5×大径，容差 ±2mm（经验口径，仅供初判）
function guessSpecsByHead(afMm) {
  if (typeof afMm !== 'number' || !(afMm > 0)) return []
  return THREAD_TABLE
    .filter((r) => r.series === 'coarse' || r.series === 'unc' || r.series === 'unf')
    .map((r) => ({ row: r, diff: Math.abs(round1(1.5 * r.majorMm) - afMm) }))
    .filter((c) => c.diff <= 2.0001)
    .sort((a, b) => a.diff - b.diff || a.row.majorMm - b.row.majorMm)
    .slice(0, 8)
    .map((c) => ({
      uid: c.row.uid,
      spec: c.row.spec,
      estimate: round1(1.5 * c.row.majorMm),
      afHint: STANDARD_AF_BY_SPEC[c.row.spec] || ''
    }))
}

// 牙型角（G 为 55°，其余收录系列均为 60°；英制惠氏 BSW/BSF 为 55° 见 SEO 说明）
function threadAngleOf(row) {
  return row.series === 'g' ? 55 : 60
}

// 详情：中径 d2 ≈ D−0.6495P、小径 ≈ D−1.0825P（60° ISO 口径近似，管螺纹仅量级参考）
function detailOf(row) {
  const p = pitchMmOf(row)
  if (p === null) return null
  const d = row.majorMm
  const isFastener = FASTENER_SERIES.includes(row.series)
  return {
    pitch: p,
    d2: round3(d - 0.6495 * p),
    d3: round3(d - 1.0825 * p),
    drillSteel: row.tapDrillMm,
    // 铸铁口径：大径 − 1.1×牙距（机械手册经验式）；管螺纹丝锥有专用底孔，不套用
    drillCast: isFastener ? round1(d - 1.1 * p) : null,
    angle: threadAngleOf(row),
    torque: isFastener ? round1(torque88Of(d, p)) : null,
    afHint: STANDARD_AF_BY_SPEC[row.spec] || ''
  }
}

// 8.8 级扭矩粗算：T = K×F0×d，K=0.2（μ≈0.14），F0=0.6×σs(640MPa)×As，As≈π/4×(D−P)²
// 仅为车间粗算参考，正式预紧力矩请查设计手册/标准
function torque88Of(majorMm, pitchMm) {
  if (!(majorMm > 0) || !(pitchMm > 0)) return null
  const as = (Math.PI / 4) * (majorMm - pitchMm) * (majorMm - pitchMm)
  const f0 = 0.6 * 640 * as
  return (0.2 * f0 * majorMm) / 1000
}

// 导出 TSV：表头 + 每行；列 = 规格/系列/牙距mm/牙数TPI/大径mm/底孔mm(钢)/备注
function buildTsv(rows) {
  const header = ['规格', '系列', '牙距mm', '牙数TPI', '大径mm', '底孔mm(钢)', '备注'].join('\t')
  const lines = rows.map((r) => {
    const p = pitchMmOf(r)
    return [r.spec, r.name, p === null ? '' : p, r.tpi ?? '', r.majorMm, r.tapDrillMm ?? '', r.notes || ''].join('\t')
  })
  return [header].concat(lines).join('\n')
}
// ---------- 纯逻辑结束 ----------

// ---------- UI 常量 ----------
const SERIES_TABS = [
  { id: 'all', label: '全部' },
  { id: 'coarse', label: '公制粗牙' },
  { id: 'fine', label: '公制细牙' },
  { id: 'unc', label: 'UNC 粗' },
  { id: 'unf', label: 'UNF 细' },
  { id: 'g', label: 'G 平行管' },
  { id: 'npt', label: 'NPT 锥管' }
]

const PRESETS = [
  { id: 'm8', label: 'M8 粗牙', hint: '牙距1.25·底孔6.8', series: 'coarse', query: 'M8', expandUid: 'coarse|M8×1.25' },
  { id: 'half13', label: '1/2-13 UNC', hint: '13牙/英寸', series: 'unc', query: '1/2-13', expandUid: 'unc|1/2-13' },
  { id: 'g-half', label: 'G1/2 管螺纹', hint: '水暖 DN15', series: 'g', query: 'G1/2', expandUid: 'g|G1/2' }
]

// ---------- 响应式状态 ----------
const searchQuery = ref('')
const activeSeries = ref('all')
const expandedKey = ref(null)
const tpiIn = ref('')
const pitchIn = ref('')
const afIn = ref('')
const copyStatus = ref('idle')
const seoContentVisible = ref(true)

// ---------- 派生 ----------
const filteredRows = computed(() => filterRows(THREAD_TABLE, activeSeries.value, searchQuery.value))

function parsePos(text) {
  const n = Number(String(text ?? '').trim())
  return Number.isFinite(n) && n > 0 ? n : null
}

const pitchFromTpi = computed(() => tpiToPitchMm(parsePos(tpiIn.value)))
const tpiFromPitch = computed(() => pitchMmToTpi(parsePos(pitchIn.value)))
const pitchFromTpiText = computed(() => (pitchFromTpi.value === null ? '—' : `${pitchFromTpi.value} mm`))
const tpiFromPitchText = computed(() => (tpiFromPitch.value === null ? '—' : `${tpiFromPitch.value} 牙/英寸`))
const afCandidates = computed(() => guessSpecsByHead(parsePos(afIn.value)))
const hasAfInput = computed(() => parsePos(afIn.value) !== null)

// ---------- 展示辅助 ----------
function pitchDisplayOf(row) {
  const p = pitchMmOf(row)
  if (p === null) return '—'
  return typeof row.pitchMm === 'number' ? String(p) : `≈${p}`
}

function rowDetailOf(row) {
  const d = detailOf(row)
  if (!d) return { d2: '—', d3: '—', drillSteel: '—', drillCast: '—', torque: '—', angleText: '—', afHint: '—' }
  return {
    d2: d.d2,
    d3: d.d3,
    drillSteel: d.drillSteel ?? '查丝锥',
    drillCast: d.drillCast ?? '查丝锥',
    torque: d.torque === null ? '—' : `≈${d.torque} N·m（粗算）`,
    angleText: `${d.angle}°`,
    afHint: d.afHint || '—'
  }
}

// ---------- 交互（浏览器 API 仅在回调内，SSR 安全） ----------
function toggleRow(uid) {
  expandedKey.value = expandedKey.value === uid ? null : uid
}

function applyPreset(p) {
  activeSeries.value = p.series
  searchQuery.value = p.query
  expandedKey.value = p.expandUid
  copyStatus.value = 'idle'
}

let copyTimer = null
function flashCopy(status) {
  copyStatus.value = status
  if (copyTimer !== null) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copyStatus.value = 'idle'
    copyTimer = null
  }, 1600)
}

async function copyTsv() {
  const text = buildTsv(filteredRows.value)
  try {
    await navigator.clipboard.writeText(text)
    flashCopy('ok')
  } catch (err) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      flashCopy(ok ? 'ok' : 'fail')
    } catch (err2) {
      flashCopy('fail')
    }
  }
}

function saveTsv() {
  const blob = new Blob(['\uFEFF' + buildTsv(filteredRows.value)], { type: 'text/tab-separated-values;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `螺纹速查_${activeSeries.value}_${filteredRows.value.length}条.tsv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function printCard() {
  window.print()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('thread-reference-table')
})
</script>

<style scoped>
@media print {
  @page {
    size: A4 landscape;
    margin: 10mm;
  }

  .no-print {
    display: none !important;
  }

  .print-table-card {
    border: none !important;
    padding: 0 !important;
  }

  table {
    font-size: 11px;
  }
}
</style>
